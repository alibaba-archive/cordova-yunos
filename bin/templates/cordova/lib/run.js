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

var fs = require('fs'),
    nopt  = require('nopt'),
    os = require('os'),
    path = require('path'),
    shjs = require('shelljs'),
    spawn = require('cordova-common').superspawn.spawn,
    url = require('url'),
    Q = require('q');

var platformDir       = path.join('platforms', 'yunos'),
    platformBuildDir = path.join(platformDir, 'build'),
    packageFile      = path.join(platformBuildDir, 'package');

module.exports.help = function(argv){
    console.log('Usage: cordova run yunos');
    console.log('Run will install the package to YunOS device.');
};

module.exports.run = function(argv){
    //TODO replace to use YunOS CLI to install and run.
    return Q()
    .then(function() {
        return spawn('adb', ['-host', 'shell', 'rm', '-rf', '/tmp/package'], {cwd: os.tmpdir()})
        .progress(function(stdio) {
            if (stdio.stderr) {
              console.log(stdio.stderr);
            }
            if (stdio.stdout) {
              console.log(stdio.stdout);
            }
        });
    }).then(function() {
        return spawn('adb', ['-host', 'shell', 'mkdir', '/tmp/package'], {cwd: os.tmpdir()})
        .progress(function(stdio) {
            if (stdio.stderr) {
              console.log(stdio.stderr);
            }
            if (stdio.stdout) {
              console.log(stdio.stdout);
            }
        });
    }).then(function() {
        return spawn('adb', ['-host', 'push', packageFile, '/tmp/package'], {stdio: 'pipe'})
        .progress(function(stdio) {
            if (stdio.stderr) {
              console.log(stdio.stderr);
            }
            if (stdio.stdout) {
              console.log(stdio.stdout);
            }
        });
    }).then(function() {
        return spawn('adb', ['-host', 'shell', 'ypm', '-f', '-i', '/tmp/package'], {cwd: os.tmpdir()})
        .progress(function(stdio) {
            if (stdio.stderr) {
              console.log(stdio.stderr);
            }
            if (stdio.stdout) {
              console.log(stdio.stdout);
            }
        });
    }).then(function() {
        var manifest = JSON.parse(fs.readFileSync(path.join(platformDir, 'manifest.json'), 'utf-8'));
        var uri = manifest.pages[0].uri;
        return spawn('adb', ['-host', 'shell', 'sendlink', uri, '--debug-brk'], {cwd: os.tmpdir()})
        .progress(function(stdio) {
            if (stdio.stderr) {
              console.log(stdio.stderr);
            }
            if (stdio.stdout) {
              console.log(stdio.stdout);
            }
        });
    }).then(function() {
      // workaround cordova issue, do not store config.xml file under project folder.
      // https://issues.apache.org/jira/browse/CB-6414
      shjs.rm('-rf', packageFile);
    });
};