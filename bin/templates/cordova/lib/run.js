#!/usr/bin/env node

/**
 * Copyright (C) 2010-2017 Alibaba Group Holding Limited
 */

/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/

/* jshint loopfunc:true */

var path  = require('path'),
    build = require('./build'),
    emulator = require('./emulator'),
    device   = require('./device'),
    Q = require('q'),
    events = require('cordova-common').events;

function getInstallTarget(runOptions) {
    var installTarget;
    if (runOptions.target) {
        installTarget = runOptions.target;
    } else if (runOptions.device) {
        installTarget = '--device';
    } else if (runOptions.emulator) {
        installTarget = '--emulator';
    }

    return installTarget;
}

/**
 * Runs the application on a device if available. If no device is found, it will
 *   use a started emulator. If no started emulators are found it will attempt
 *   to start an avd. If no avds are found it will error out.
 *
 * @param   {Object}  runOptions  various run/build options. See Api.js build/run
 *   methods for reference.
 *
 * @return  {Promise}
 */
 module.exports.run = function(runOptions) {
    var self = this;
    var installTarget = getInstallTarget(runOptions);

    return Q()
    .then(function() {
        if (!installTarget) {
            // no target given, deploy to device if available, otherwise use the emulator.
            return device.list()
            .then(function(device_list) {
                if (device_list.length > 0) {
                    events.emit('warn', 'No target specified, deploying to device \'' + device_list[0] + '\'.');
                    installTarget = device_list[0];
                } else {
                    events.emit('warn', 'No target specified and no devices found, deploying to emulator');
                    installTarget = '--emulator';
                }
            });
        }
    }).then(function() {
        if (installTarget == '--device') {
            return device.resolveTarget(null);
        } else if (installTarget == '--emulator') {
            // Give preference to any already started emulators. Else, start one.
            return emulator.list_started()
            .then(function(started) {
                return started && started.length > 0 ? started[0] : emulator.start();
            }).then(function(emulatorId) {
                return emulator.resolveTarget(emulatorId);
            });
        }
        // They specified a specific device/emulator ID.
        return device.list()
        .then(function(devices) {
            if (devices.indexOf(installTarget) > -1) {
                return device.resolveTarget(installTarget);
            }
            return emulator.list_started()
            .then(function(started_emulators) {
                if (started_emulators.indexOf(installTarget) > -1) {
                    return emulator.resolveTarget(installTarget);
                }
                return emulator.list_images()
                .then(function(avds) {
                    // if target emulator isn't started, then start it.
                    for (var avd in avds) {
                        if (avds[avd].name == installTarget) {
                            return emulator.start(installTarget)
                            .then(function(emulatorId) {
                                return emulator.resolveTarget(emulatorId);
                            });
                        }
                    }
                    return Q.reject('Target \'' + installTarget + '\' not found, unable to run project');
                });
            });
        });
    }).then(function(resolvedTarget) {
        return build.run.call(runOptions)
        .then(function(buildResults) {
            if (resolvedTarget.isEmulator) {
                return emulator.wait_for_boot(resolvedTarget.target)
                .then(function () {
                    return emulator.install(resolvedTarget, buildResults);
                });
            }
            return device.install(resolvedTarget, buildResults);
        });
    });
};

module.exports.help = function() {
    console.log('Usage: ' + path.relative(process.cwd(), process.argv[1]) + ' [options]');
    console.log('Build options :');
    console.log('    --debug : Builds project in debug mode');
    console.log('    --release : Builds project in release mode');
    console.log('    --nobuild : Runs the currently built project without recompiling');
    console.log('Deploy options :');
    console.log('    --device : Will deploy the built project to a device');
    console.log('    --emulator : Will deploy the built project to an emulator if one exists');
    console.log('    --target=<target_id> : Installs to the target with the specified id.');
    process.exit(0);
};
