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

var fs         = require('fs'),
    shjs       = require('shelljs'),
    Q          = require ('q'),
    args       = process.argv,
    path       = require('path'),
    ROOT       = path.join(__dirname, '..', '..'),
    check_reqs = require('./check_reqs');

function copyJsAndLibrary(project_path, shared) {
    var cordovaLibPath = path.join(project_path,"CordovaLib");
    shjs.mkdir('-p', cordovaLibPath);
    if (shared) {
        fs.symlinkSync(path.join(ROOT, 'framework','src'), path.join(cordovaLibPath,'src'));
        fs.symlinkSync(path.join(ROOT, 'bin', 'templates', 'project', 'libs'), path.join(project_path, 'libs'));
        fs.symlinkSync(path.join(ROOT, 'bin', 'templates', 'project', 'spec'), path.join(project_path, 'spec'));
        fs.symlinkSync(path.join(ROOT, 'bin', 'templates', 'project', 'test'), path.join(project_path, 'test'));
    } else {
        shjs.cp('-rf', path.join(ROOT, 'framework','src'), cordovaLibPath);
        shjs.cp('-rf', path.join(ROOT, 'bin', 'templates', 'project', 'libs'), path.join(project_path, 'libs'));
        shjs.cp('-rf', path.join(ROOT, 'bin', 'templates', 'project', 'spec'), path.join(project_path, 'spec'));
        shjs.cp('-rf', path.join(ROOT, 'bin', 'templates', 'project', 'test'), path.join(project_path, 'test'));
    }
    // Copy cordova.js file
    shjs.cp('-rf', path.join(ROOT, 'bin', 'templates', 'project', 'res'), path.join(project_path, 'res'));
    var srcCordovaJSPath = path.join(ROOT, 'cordova-lib', 'cordova.js');
    shjs.cp('-f', srcCordovaJSPath, path.join(project_path, 'res', 'asset'));

    // Cppy cordova-js-src directory and cordova.js into platform_www directory
    shjs.mkdir('-p', path.join(project_path, 'platform_www'));
    shjs.cp('-f', srcCordovaJSPath, path.join(project_path, 'platform_www'));
    shjs.cp('-rf', path.join(ROOT, 'cordova-js-src'), path.join(project_path, 'platform_www'));

    // Copy manifest.json
    var srcManifestPath = path.join(ROOT, 'bin', 'templates', 'project', 'manifest.json');
    shjs.cp('-f', srcManifestPath, project_path);

    // Copy the files for YunOS IDE
    shjs.cp('-f', path.join(ROOT, 'bin', 'templates', 'project', '.eslintrc'), project_path);
    shjs.cp('-f', path.join(ROOT, 'bin', 'templates', 'project', '.jsbeautifyrc'), project_path);
    shjs.cp('-f', path.join(ROOT, 'bin', 'templates', 'project', '.tern-project'), project_path);
    shjs.cp('-f', path.join(ROOT, 'bin', 'templates', 'project', '.yunos-project'), project_path);
}

function copyScripts(project_path) {
    //create cordova/lib if it does not exist yet
    if (!fs.existsSync(path.join(project_path,'cordova', 'lib'))) {
        shjs.mkdir('-p', path.join(project_path,'cordova', 'lib'));
    }

    //copy required node_modules
    shjs.cp('-r', path.join(ROOT, 'node_modules'), path.join(project_path,'cordova'));

    //copy check_reqs file
    shjs.cp( path.join(ROOT, 'bin', 'lib', 'check_reqs.js'), path.join(project_path,'cordova', 'lib'));

    //copy cordova directory
    shjs.cp('-r', path.join(ROOT, 'bin', 'templates', 'cordova'), project_path);

    [
        'run',
        'build',
        'clean',
        'version',
    ].forEach(function(f) {
         shjs.chmod(755, path.join(project_path, 'cordova', f));
    });
}

function setShellFatal(value, func) {
    var oldVal = shjs.config.fatal;
    shjs.config.fatal = value;
    func();
    shjs.config.fatal = oldVal;
}

/**
 * Test whether a package name is acceptable for use as an YunOS project.
 * Returns a promise, fulfilled if the package name is acceptable; rejected
 * otherwise.
 */
function validatePackageName(package_name) {
    //Enforce underscore limitation
    //TODO: Check with YunOS spec
    var msg = 'Error validating package name. ';
    if (!/^[a-zA-Z][a-zA-Z0-9_]+(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(package_name)) {
        return Q.reject(new CordovaError(msg + 'Package name must look like: com.company.Name'));
    }
    return Q.resolve();
}

/**
 * Returns a promise, fulfilled if the project name is acceptable; rejected
 * otherwise.
 */
function validateProjectName(project_name) {
    var msg = 'Error validating project name. ';
    //Make sure there's something there
    if (project_name === '') {
        return Q.reject(new CordovaError(msg + 'Project name cannot be empty'));
    }

    return Q.resolve();
}

function generateDoneMessage(type) {
    var pkg = require('../../package');
    var msg = 'YunOS project ' + (type == 'update' ? 'updated ' : 'created ') + 'with ' + pkg.name + '@' + pkg.version;
    return msg;
}

/**
 * Creates an yunos application with the given options.
 *
 * @param   {String}  project_path  Path to the new Cordova yunos project.
 * @param   {ConfigParser}  config  Instance of ConfigParser to retrieve basic
 *   project properties.
 * @param   {Object}  [options={}]  Various options
 * @param   {EventEmitter}  [events]  An EventEmitter instance for logging
 *   events
 *
 * @return  {Promise<String>}  Directory where application has been created
 */
module.exports.create = function(project_path, config, options, events) {
    options = options || {};

    // Set default values for path, package and name
    project_path = path.relative(process.cwd(), (project_path || 'CordovaExample'));
    // Check if project already exists
    if(fs.existsSync(project_path)) {
        return Q.reject(new CordovaError('Project already exists! Delete and recreate'));
    }
    var package_name = config.packageName() || 'my.cordova.project';
    var project_name = config.name() ?
        config.name().replace(/[^\w.]/g,'_') : 'CordovaExample';

    //Make the package conform to YunOS spec
    return validatePackageName(package_name)
    .then(function() {
        validateProjectName(project_name);
    }).then(function() {
        // Log the given values for the project
        events.emit('log', 'Creating Cordova project for the YunOS platform:');
        events.emit('log', '\tPath: ' + project_path);
        events.emit('log', '\tPackage: ' + package_name);
        events.emit('log', '\tName: ' + project_name);

        events.emit('verbose', 'Copying YunOS template project to ' + project_path);

        setShellFatal(true, function() {
            // copy cordova.js
            copyJsAndLibrary(project_path, options&&options.link);

            copyScripts(project_path);
            events.emit('log', generateDoneMessage('create'));
        });
    }).thenResolve(project_path);
};

module.exports.update = function(projectPath, options, events) {
    options = options || {};

    return Q()
    .then(function() {
        shjs.rm('-rf', path.join(projectPath,'cordova'));

        copyJsAndLibrary(projectPath, options&&options.link);
        copyScripts(projectPath);
        events.emit('log', generateDoneMessage('update'));
    }).thenResolve(projectPath);
};
