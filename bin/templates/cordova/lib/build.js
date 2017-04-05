#!/usr/bin/env node

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var path = require('path'),
    fs = require('fs'),
    shjs = require('shelljs'),
    Q = require('q'),
    clean = require('./clean'),
    check_reqs = require('./check_reqs'),
    os = require('os'),
    spawn = require('cordova-common').superspawn.spawn,
    nopt = require('nopt'),
    platformAppDir = path.join('platforms', 'yunos'),
    platformBuildDir = path.join('platforms', 'yunos', 'build'),
    outputsDir = path.join(platformBuildDir, 'outputs'),
    packageDir = path.join(outputsDir, 'package'),
    yppDir = path.join(outputsDir, 'ypp');

// Parse the arguments of command line
function parseOpts(options, projectRoot) {
    options = options || {};
    options.argv = nopt({
        keystore: path,
        alias: String,
        password: String,
        keystoreType: String
    }, {}, options.argv, 0);

    var opts = {
        buildType: options.release ? 'release' : 'debug'
    };

    if (options.argv.keystore)
        opts.keystore = path.relative(projectRoot, path.resolve(options.argv.keystore));

    ['alias', 'password', 'keystoreType'].forEach(function(e) {
        if (options.argv[e])
            opts[e] = options.argv[e];
    });

    return opts;
}

// Generate a package for YunOS
function generateYpp(options) {
    var buildResults = {};

    if (fs.existsSync(packageDir)) {
        shjs.rm('-rf', packageDir);
    }
    shjs.mkdir('-p', packageDir);

    if (fs.existsSync(yppDir)) {
        shjs.rm('-rf', yppDir);
    }
    shjs.mkdir('-p', yppDir);
    // Copy source files or directories to a package directory, delete it after generating
    // a package with signature
    shjs.cp('-rf', path.join(platformAppDir, 'CordovaLib', 'src'), path.join(packageDir, 'CordovaLib'));
    shjs.cp('-rf', path.join(platformAppDir, 'libs'), packageDir);
    shjs.cp('-f', path.join(platformAppDir, 'manifest.json'), packageDir);
    shjs.cp('-rf', path.join(platformAppDir, 'res'), packageDir);
    shjs.cp('-rf', path.join(platformAppDir, 'spec'), packageDir);
    shjs.cp('-rf', path.join(platformAppDir, 'src'), packageDir);
    shjs.cp('-rf', path.join(platformAppDir, 'test'), packageDir);

    var manifest = JSON.parse(fs.readFileSync(path.join(platformAppDir, 'manifest.json')));
    try {
        buildResults.pageUri = manifest.pages[0].uri;
    } catch (e) {
        console.error('Please make sure your app has one page at least');
    }
    // The arguments for ycmd cli
    var args = [];
    args.push('export');
    args.push('-d');
    args.push(packageDir);
    // signature type:
    // 0 for developer sign, 1 for system sign, 2 for custom sign.
    // 0 is default.
    if (options.signType === 1) {
        args.push('-s');
        args.push(options.signType);
    } else if (options.signType === 2) {
        args.push('-s');
        args.push(options.signType);
        if (options.keystorePath) {
            args.push('-k');
            args.push(options.keystorePath);
        }
        if (options.keystoreAlias) {
            args.push('-a');
            args.push(options.keystoreAlias);
        }
        if (options.keystorePassword) {
            args.push('-p');
            args.push(options.keystorePassword);
        }
    }
    args.push('-o');
    var pkgName = 'yunos' + '-' + options.buildType + '.ypp';
    var pkgPath = path.join(yppDir, pkgName);
    buildResults.yppPath = pkgPath;
    args.push(pkgPath);
    return spawn('ycmd', args)
        .progress(function(stdio) {
            if (stdio.stderr) {
              console.log(stdio.stderr);
            }
            if (stdio.stdout) {
              console.log(stdio.stdout);
            }
        })
        .then(function() {
            shjs.rm('-rf', packageDir);
            return buildResults;
        });
}

/**
 * Builds the project with the specifed options.
 */
module.exports.run = function(options, target) {

    return check_reqs.run()
    .then(function() {
            return clean.cleanProject();
        },
        function checkReqsError(err) {
            console.error('Please make sure you meet the software requirements in order to build a yunos cordova project');
    })
    .then(function() {
        var opts = parseOpts(options, this.root);
        return generateYpp(opts);
    });
};

module.exports.help = function() {
    console.log('Usage: cordova build yunos');
    console.log('Build will create the packaged app in \'' + yppDir + '\'.');
};
