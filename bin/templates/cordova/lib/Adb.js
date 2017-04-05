/**
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
var os = require('os');
var events = require('cordova-common').events;
var spawn = require('cordova-common').superspawn.spawn;
var CordovaError = require('cordova-common').CordovaError;

var Adb = {};

function isDevice(line) {
    return line.match(/\w+\tdevice/) && !line.match(/emulator/);
}

function isEmulator(line) {
    return line.match(/device/) && line.match(/emulator/);
}

/**
 * Lists available/connected devices and emulators
 *
 * @param   {Object}   opts            Various options
 * @param   {Boolean}  opts.emulators  Specifies whether this method returns
 *   emulators only
 *
 * @return  {Promise<String[]>}        list of available/connected
 *   devices/emulators
 */
Adb.devices = function(opts) {
    return spawn('adb', ['-host', 'devices'], {cwd: os.tmpdir()})
    .then(function(output) {
        return output.split('\n').filter(function (line) {
            // Filter out either real devices or emulators, depending on options
            return (line && opts && opts.emulators) ? isEmulator(line) : isDevice(line);
        }).map(function (line) {
            return line.replace(/\tdevice/, '').replace('\r', '');
        });
    });
};

Adb.install = function(target, packagePath) {
    events.emit('verbose', 'Installing ypp ' + packagePath + ' on target ' + target + '...');
    var path = require('path');
    var yppName = path.basename(packagePath);
    // Cann't use path join method here
    var targetPath = '/tmp/' + yppName;
    var args = ['-host', '-s', target, 'push', packagePath, targetPath];
    return spawn('adb', args, {cwd: null})
    .then(function(output) {
        if (output.match(/Failure/)) {
            return Q.reject(new CordovaError('Failed to push ypp to device: ' + output));
        }
        return Adb.shell(target, 'ypm -i ' + targetPath);
    })
    .then(function(output) {
        return Adb.shell(target, 'rm ' + targetPath);
    });
};

Adb.uninstall = function(target, domain) {
    events.emit('verbose', 'Uninstalling package ' + domain + ' from target ' + target + '...');
    return Adb.shell('ypm -u ' + domain);
};

Adb.shell = function(target, shellCommand) {
    events.emit('verbose', 'Running adb shell command "' + shellCommand + '" on target ' + target + '...');
    var args = ['-host', '-s', target, 'shell'];
    shellCommand = shellCommand.split(/\s+/);
    return spawn('adb', args.concat(shellCommand), {cwd: null})
    .catch(function (output) {
        return Q.reject(new CordovaError('Failed to execute shell command "' +
            shellCommand + '"" on device: ' + output));
    });
};

Adb.start = function(target, pageUri) {
    events.emit('verbose', 'Starting page "' + pageUri + '" on target ' + target + '...');
    return Adb.shell(target, 'sendlink ' + pageUri)
    .catch(function(output) {
        return Q.reject(new CordovaError('Failed to start page "' +
            pageUri + '"" on device: ' + output));
    });
};

module.exports = Adb;
