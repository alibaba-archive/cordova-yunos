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

/* jshint sub:true */

var shelljs = require('shelljs'),
    child_process = require('child_process'),
    Q     = require('q'),
    path  = require('path'),
    fs    = require('fs'),
    ROOT  = path.join(__dirname, '..', '..');
var CordovaError = require('cordova-common').CordovaError;

var isWindows = process.platform == 'win32';

function forgivingWhichSync(cmd) {
    try {
        return fs.realpathSync(shelljs.which(cmd));
    } catch (e) {
        return '';
    }
}

function tryCommand(cmd, errMsg, catchStderr) {
    var d = Q.defer();
    child_process.exec(cmd, function(err, stdout, stderr) {
        if (err) d.reject(new CordovaError(errMsg));
        // Sometimes it is necessary to return an stderr instead of stdout in case of success, since
        // some commands prints theirs output to stderr instead of stdout. 'javac' is the example
        else d.resolve((catchStderr ? stderr : stdout).trim());
    });
    return d.promise;
}

// Check the java environment
module.exports.check_java = function() {
    var javacPath = forgivingWhichSync('javac');
    var hasJavaHome = !!process.env['JAVA_HOME'];
    return Q().then(function() {
        if (hasJavaHome) {
            // Windows java installer doesn't add javac to PATH, nor set JAVA_HOME (ugh).
            if (!javacPath) {
                process.env['PATH'] += path.delimiter + path.join(process.env['JAVA_HOME'], 'bin');
            }
        } else {
            if (javacPath) {
                var msg = 'Failed to find \'JAVA_HOME\' environment variable. Try setting setting it manually.';
                // OS X has a command for finding JAVA_HOME.
                if (fs.existsSync('/usr/libexec/java_home')) {
                    return tryCommand('/usr/libexec/java_home', msg)
                    .then(function(stdout) {
                        process.env['JAVA_HOME'] = stdout.trim();
                    });
                } else {
                    // See if we can derive it from javac's location.
                    // fs.realpathSync is require on Ubuntu, which symplinks from /usr/bin -> JDK
                    var maybeJavaHome = path.dirname(path.dirname(javacPath));
                    if (fs.existsSync(path.join(maybeJavaHome, 'lib', 'tools.jar'))) {
                        process.env['JAVA_HOME'] = maybeJavaHome;
                    } else {
                        throw new CordovaError(msg);
                    }
                }
            } else if (isWindows) {
                // Try to auto-detect java in the default install paths.
                var oldSilent = shelljs.config.silent;
                shelljs.config.silent = true;
                var firstJdkDir =
                    shelljs.ls(process.env['ProgramFiles'] + '\\java\\jdk*')[0] ||
                    shelljs.ls('C:\\Program Files\\java\\jdk*')[0] ||
                    shelljs.ls('C:\\Program Files (x86)\\java\\jdk*')[0];
                shelljs.config.silent = oldSilent;
                if (firstJdkDir) {
                    // shelljs always uses / in paths.
                    firstJdkDir = firstJdkDir.replace(/\//g, path.sep);
                    if (!javacPath) {
                        process.env['PATH'] += path.delimiter + path.join(firstJdkDir, 'bin');
                    }
                    process.env['JAVA_HOME'] = firstJdkDir;
                }
            }
        }
    }).then(function() {
            var msg =
                'Failed to run "javac -version", make sure that you have a JDK installed.\n' +
                'You can get it from: http://www.oracle.com/technetwork/java/javase/downloads.\n';
            if (process.env['JAVA_HOME']) {
                msg += 'Your JAVA_HOME is invalid: ' + process.env['JAVA_HOME'] + '\n';
            }
            // We use tryCommand with catchStderr = true, because
            // javac writes version info to stderr instead of stdout
            return tryCommand('javac -version', msg, true)
                .then(function (output) {
                    //Let's check for at least Java 8, and keep it future proof so we can support Java 10
                    var match = /javac ((?:1\.)(?:[8-9]\.)(?:\d+))|((?:1\.)(?:[1-9]\d+\.)(?:\d+))/i.exec(output);
                    return match && match[1];
                });
        });
};

// Check adb for YunOS
module.exports.check_adb = function() {
    return Q().then(function() {
        var msg = 'Failed to find adb in version. Try setting setting it manually.';
        // Use adb version to get current adb tools version
        return tryCommand('adb version', msg, false)
            .then(function(output) {
                //Match YunOS
                var match = output && output.indexOf('YunOS') !== -1;
                if (!match) {
                    var msg = 'Failed to find \'YunOS ADB\' environment variable. Try setting setting it manually.';
                    throw new CordovaError(msg);
                }
                return output;
            });
    });
};

// Check the environment about YunOS SDK
module.exports.check_yunos = function() {
    return Q().then(function() {
        var hasYunOSHome = !!process.env['YUNOS_HOME'] && fs.existsSync(process.env['YUNOS_HOME']);
        function maybeSetYunOSHome(value) {
            if (!hasYunOSHome && fs.existsSync(value)) {
                hasYunOSHome = true;
                process.env['YUNOS_HOME'] = value;
            }
        }
        if (!hasYunOSHome) {
            if (isWindows) {
                // Try to get YunOS SDK from 'PATH' enviroment
                var value = process.env['PATH'];
                var target = 'YunOS-SDK';
                var index = value.indexOf(target);
                if (index !== -1) {
                    // Get the target path
                    var start = value.substr(0, index).lastIndexOf(';') + 1;
                    var pathStr = value.substr(start, index - start + target.length);
                    maybeSetYunOSHome(pathStr);
                }
            } else if (process.platform == 'darwin') {
                maybeSetYunOSHome(path.join(process.env['HOME'], 'Library', 'YunOS', 'sdk'));
                maybeSetYunOSHome('/Applications/yunos-sdk-macosx');
                maybeSetYunOSHome('/Applications/yunos-sdk');
            }
        }

        if (!hasYunOSHome) {
            var msg = 'Failed to find \'YUNOS_HOME\' environment variable. Try setting setting it manually.';
            throw new CordovaError(msg);
        }
    });
};

module.exports.check_ycmd = function() {
    return Q().then(function() {
        var msg = 'Failed to find ycmd in version. Try installing it manually.';
        // Use adb version to get current adb tools version
        return tryCommand('ycmd -V', msg, false)
            .then(function(output) {
                return output;
            });
    });
};

module.exports.run = function() {
    return Q.all([this.check_java(), this.check_adb()])
        .then(function(values) {
            if (!values[0]) {
                throw new CordovaError('Requirements check failed for JDK 1.8 or greater');
            }

            if (!values[1]) {
                throw new CordovaError('Requirements check failed for YunOS ADB');
            }
    });
};

/**
 * Object thar represents one of requirements for current platform.
 * @param {String} id         The unique identifier for this requirements.
 * @param {String} name       The name of requirements. Human-readable field.
 * @param {String} version    The version of requirement installed. In some cases could be an array of strings
 *                            (for example, check_android_target returns an array of yunos targets installed)
 * @param {Boolean} installed Indicates whether the requirement is installed or not
 */
var Requirement = function (id, name, version, installed) {
    this.id = id;
    this.name = name;
    this.installed = installed || false;
    this.metadata = {
        version: version,
    };
};

/**
 * Methods that runs all checks one by one and returns a result of checks
 * as an array of Requirement objects.
 * This method intended to be used by Api requirements method
 *
 * @return Promise<Requirement[]> Array of requirements.
 * Due to implementation, promise is always fulfilled.
 */
module.exports.checkAll = function() {

    var requirements = [
        new Requirement('java', 'Java JDK'),
        new Requirement('yunos_adb', 'ADB'),
        new Requirement('yunos_sdk', 'YunOS SDK'),
        new Requirement('yunos_cmd', 'YCMD')
    ];

    var checkFns = [
        this.check_java,
        this.check_adb,
        this.check_yunos,
        this.check_ycmd
    ];

    // Then execute requirement checks one-by-one
    return checkFns.reduce(function(promise, checkFn, idx) {
        // Update each requirement with results
        var requirement = requirements[idx];
        return promise.then(checkFn)
        .then(function (version) {
            requirement.installed = true;
            requirement.metadata.version = version;
        }, function (err) {
            requirement.metadata.reason = err instanceof Error ? err.message : err;
        });
    }, Q())
    .then(function () {
        return requirements;
    });
};
