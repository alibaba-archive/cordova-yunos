#!/usr/bin/env node

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

/* jshint sub:true */

var Q = require('q');
var Adb = require('./Adb');
var child_process = require('child_process');
var process = require('process');
var CordovaError = require('cordova-common').CordovaError;
var Path = require('path');
var spawn = require('cordova-common').superspawn.spawn;
var events = require('cordova-common').events;

var ONE_SECOND              = 1000; // in milliseconds
var CHECK_BOOTED_INTERVAL   = 3 * ONE_SECOND; // in milliseconds

var YUNOS_IDE_PATH = 'YUNOS_IDE_PATH';

function getYunOSIDEPath() {
    var platform = process.platform;
    if (/darwin/.test(platform)) {
        return '/Applications/.atom/yunos/emulator';
    } else if (/^win/.test(platform)) {
        var ide_path = process.env[YUNOS_IDE_PATH];
        if (ide_path === undefined || ide_path.length === 0) {
            return '';
        }
        var atom_path = Path.join(ide_path, '.atom', 'yunos', 'emulator');
        return atom_path;
    } else {
        events.emit('error', 'YunOS emulator is not supported in ' + platform);
        return '';
    }
}

/**
 * Returns a Promise for a list of emulator images in the form of objects
 * {
       name   : <emulator_name>,
       path   : <path_to_emulator_image>,
       target : <api_target>,
       abi    : <cpu>,
       skin   : <skin>
   }
 */
module.exports.list_images = function() {
    var yunosPath = getYunOSIDEPath();
    if (yunosPath === '') {
        events.emit('error', 'Please specify ' + YUNOS_IDE_PATH +
                    ' in your system environment');
        return Q.reject(new CordovaError('YunOS emulator is not Found'));
    }

    var emulatorPath = Path.join(yunosPath, 'tools', 'emulator');
    return spawn(emulatorPath, ['-list-avds'])
    .then(function(output) {
        var response = [];
        if (/^win/.test(process.platform)) {
            response = output.split('\r\n');
        } else {
            response = output.split('\n');
        }
        var emulator_list = [];
        for (var i = 0; i < response.length; i++) {
            var img_obj = {};
            img_obj.name = response[i];
            emulator_list.push(img_obj);
        }
        return emulator_list;
    });
};

/**
 * Will return the closest avd to the projects target
 * or undefined if no avds exist.
 * Returns a promise.
 */
module.exports.best_image = function() {
    return this.list_images()
    .then(function(images) {
        // Just return undefined if there is no images
        if (images.length === 0) return;

        // TODO: No target defined in YunOS currently,
        // Will support in the future, just phone is the best image currently.
        return images[0];
    });
};

// Returns a promise.
module.exports.list_started = function() {
    return Adb.devices({emulators: true});
};

/*
 * Waits for an emulator to boot on a given port.
 * Returns this emulator's ID in a promise.
 */
module.exports.wait_for_emulator = function(port) {
    var self = this;
    return Q.delay(CHECK_BOOTED_INTERVAL)
    .then(function() {
        return Adb.devices({emulators: true})
        .then(function(device_list) {
            for (var i = 0; i < device_list.length; ++i) {
                if (device_list[i].indexOf(port) >= 0) {
                    return device_list[i];
                }
            }
        });
    })
    .then(function(target) {
        return Adb.shell(target, 'getprop sys.yunos.boot_completed')
        .then(function (output) {
            if (output.indexOf('1') >= 0) {
                return target;
            }
            return self.wait_for_emulator(port);
        }, function (error) {
            if (error && error.message &&
            (error.message.indexOf('not found') > -1) ||
            error.message.indexOf('device offline') > -1) {
                // emulator not yet started, continue waiting
                return self.wait_for_emulator(port);
            } else {
                // something unexpected has happened
                throw error;
            }
        });
     });
};

/*
 * Waits for the core yunos process of the emulator to start. Returns a
 * promise that resolves to a boolean indicating success. Not specifying a
 * time_remaining or passing a negative value will cause it to wait forever
 */
module.exports.wait_for_boot = function(emulator_id, time_remaining) {
    var self = this;
    return Adb.shell(emulator_id, 'ps -A')
    .then(function(output) {
        if (output.match(/seed/)) {
            return true;
        } else if (time_remaining === 0) {
            return false;
        } else {
            process.stdout.write('.');

            // Check at regular intervals
            return Q.delay(time_remaining < CHECK_BOOTED_INTERVAL ? time_remaining : CHECK_BOOTED_INTERVAL).then(function() {
                var updated_time = time_remaining >= 0 ? Math.max(time_remaining - CHECK_BOOTED_INTERVAL, 0) : time_remaining;
                return self.wait_for_boot(emulator_id, updated_time);
            });
        }
    });
};

/*
 * Gets unused port for android emulator, between 9554 and 9680
 * Returns a promise.
 */
module.exports.get_available_port = function () {
    var self = this;

    return self.list_started()
    .then(function (emulators) {
        for (var p = 9680; p >= 9554; p-=2) {
            if (emulators.indexOf('emulator-' + p) === -1) {
                events.emit('verbose', 'Found available port: ' + p);
                return p;
            }
        }
        throw new CordovaError('Could not find an available avd port');
    });
};

/*
 * Starts an emulator with the given ID,
 * and returns the started ID of that emulator.
 * If no ID is given it will use the first image available,
 * if no image is available it will error out (maybe create one?).
 * If no boot timeout is given or the value is negative it will wait forever for
 * the emulator to boot
 *
 * Returns a promise.
 */
module.exports.start = function(emulator_ID, boot_timeout) {
    var self = this;

    return Q().then(function() {
        if (emulator_ID) return Q(emulator_ID);

        return self.best_image()
        .then(function(best) {
            if (best && best.name) {
                events.emit('warn', 'No emulator specified, defaulting to ' + best.name);
                return best.name;
            }

            // Loading check_reqs at run-time to avoid test-time vs run-time directory structure difference issue
            var androidCmd = require('./check_reqs').getAbsoluteAndroidCmd();
            return Q.reject(new CordovaError('No emulator images (avds) found.\n' +
                'Please download YunOS IDE from http://cloudapp.yunos.com\n'));
        });
    }).then(function(emulatorId) {
        return self.get_available_port()
        .then(function (port) {
            //java -jar ./tools/emu.jar -mi -execute avd -name phone -port 9674 -run
            var yunosPath = getYunOSIDEPath();
            if (yunosPath === '') {
                return Q.reject(new CordovaError('YunOS emulator is not Found'));
            }
            var emuPath = Path.join(yunosPath, 'tools', 'emu.jar');
            var args = ['-jar', emuPath, '-mi', '-execute', 'avd',
                        '-name', emulatorId, '-port', port, '-run'];
            // Don't wait for it to finish, since the emulator will probably keep running for a long time.
            child_process
                .spawn('java', args, { stdio: 'inherit' })
                .unref();

            // wait for emulator to start
            events.emit('log', 'Waiting for emulator to start...');
            return self.wait_for_emulator(port);
        });
    }).then(function(emulatorId) {
        if (!emulatorId)
            return Q.reject(new CordovaError('Failed to start emulator'));

        //wait for emulator to boot up
        process.stdout.write('Waiting for emulator to boot (this may take a while)...');
        return self.wait_for_boot(emulatorId, boot_timeout)
        .then(function(success) {
            if (success) {
                events.emit('log','BOOT COMPLETE');
                return emulatorId;
            } else {
                // We timed out waiting for the boot to happen
                return null;
            }
        });
    });
};

// Detect the target device's architecture
function detectArch(target) {
    return Adb.shell(target, 'cat /proc/cpuinfo')
        .then(function(output) {
            return /intel/i.exec(output) ? 'x86' : 'arm';
        });
}

module.exports.resolveTarget = function(target) {
    return this.list_started()
    .then(function(emulator_list) {
        if (emulator_list.length < 1) {
            return Q.reject('No running YunOS emulators found, please start an emulator before deploying your project.');
        }

        // default emulator
        target = target || emulator_list[0];
        if (emulator_list.indexOf(target) < 0) {
            return Q.reject('Unable to find target \'' + target + '\'. Failed to deploy to emulator.');
        }

        return detectArch(target)
        .then(function(arch) {
            return {target:target, arch:arch, isEmulator:true};
        });
    });
};

/*
 * Installs a previously built application on the emulator and launches it.
 * If no target is specified, then it picks one.
 * If no started emulators are found, error out.
 * Returns a promise.
 */
module.exports.install = function(target, buildResults) {
    return Q().then(function() {
        if (target && typeof target === 'object') {
            return target;
        }
        return module.exports.resolveTarget(target);
    }).then(function(resolvedTarget) {
        var yppPath = buildResults.yppPath;
        var pageUri = buildResults.pageUri;
        return Adb.install(resolvedTarget.target, yppPath)
        .then(function() {
            return Adb.start(resolvedTarget.target, pageUri);
        }).then(function() {
            events.emit('log', 'LAUNCH SUCCESS');
        });
    });
};
