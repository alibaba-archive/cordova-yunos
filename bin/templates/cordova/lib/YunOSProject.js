/**
 * Copyright (C) 2010-2017 Alibaba Group Holding Limited
 */

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

var fs = require('fs');
var path = require('path');
var pluginHandlers = require('./pluginHandlers');

var projectFileCache = {};

function getRelativeLibraryPath (parentDir, subDir) {
    var libraryPath = path.relative(parentDir, subDir);
    return (path.sep == '\\') ? libraryPath.replace(/\\/g, '/') : libraryPath;
}

function YunOSProject(projectDir) {
    this._propertiesEditors = {};
    this._subProjectDirs = {};
    this._dirty = false;
    this.projectDir = projectDir;
    this.platformWww = path.join(this.projectDir, 'platform_www');
    this.www = path.join(this.projectDir, 'res/asset');
}

YunOSProject.getProjectFile = function (projectDir) {
    if (!projectFileCache[projectDir]) {
        projectFileCache[projectDir] = new YunOSProject(projectDir);
    }

    return projectFileCache[projectDir];
};

YunOSProject.purgeCache = function (projectDir) {
    if (projectDir) {
        delete projectFileCache[projectDir];
    } else {
        projectFileCache = {};
    }
};

/**
 * Reads the package name out of the YunOS Manifest file
 *
 * @param   {String}  projectDir  The absolute path to the directory containing the project
 *
 * @return  {String}              The name of the package
 */
YunOSProject.prototype.getPackageName = function() {
    var manifestPath = path.join(this.projectDir, 'manifest.json');
    var manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    return manifest.domain.name;
};

YunOSProject.prototype.getInstaller = function (type) {
    return pluginHandlers.getInstaller(type);
};

YunOSProject.prototype.getUninstaller = function (type) {
    return pluginHandlers.getUninstaller(type);
};

/*
 * This checks if an YunOS project is clean or has old build artifacts
 */

YunOSProject.prototype.isClean = function() {
    var build_path = path.join(this.projectDir, 'build');
    //If the build directory doesn't exist, it's clean
    return !(fs.existsSync(build_path));
};

module.exports = YunOSProject;
