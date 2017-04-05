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

var Q = require('q');
var path = require('path');
var Adb = require('./Adb');
var spawn = require('cordova-common').superspawn.spawn;
var CordovaError = require('cordova-common').CordovaError;
var events = require('cordova-common').events;

// Detect the target device's architecture
function detectArch(target) {
    return Adb.shell(target, 'cat /proc/cpuinfo')
        .then(function(output) {
            return /intel/i.exec(output) ? 'x86' : 'arm';
        });
}

// Returns a promise for the list of the device ID's found
module.exports.list = function() {
    return Adb.devices();
};

module.exports.resolveTarget = function(target) {
    return this.list(true)
    .then(function(device_list) {
        if (!device_list || !device_list.length) {
            return Q.reject(new CordovaError('Failed to deploy to device, no devices found.'));
        }
        // default device
        target = target || device_list[0];

        if (device_list.indexOf(target) < 0) {
            return Q.reject('ERROR: Unable to find target \'' + target + '\'.');
        }

        return detectArch(target)
        .then(function(arch) {
            return { target: target, arch: arch, isEmulator: false };
        });
    });
};

/*
 * Installs a previously built application on the device
 * and launches it.
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
