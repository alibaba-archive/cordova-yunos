/**
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    'License'); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

/* jshint node:true */

var Api = require('../../../bin/templates/cordova/Api');
var prepare = require('../../../bin/templates/cordova/lib/prepare');
var YunOSProject = require('../../../bin/templates/cordova/lib/YunOSProject');
var check_reqs = require('../../../bin/templates/cordova/lib/check_reqs');
var path = require('path');
var create = require('../../../bin/lib/create');
var EventEmitter = require('events').EventEmitter;
var ROOT = path.join(__dirname, '..', '..', '..');
var Q = require('q');
var PluginManager = require('cordova-common').PluginManager;

describe('api methods', function () {
    var events = new EventEmitter();

    beforeEach(function() {
        spyOn(events, 'emit');
    });

    function checkProperty(api) {
        expect(api.platform).toBe("yunos");
        expect(api.root).toBe(path.join(ROOT, 'bin/templates'));
        expect(api.locations instanceof Object).toBe(true);
        expect(api.locations.root).toBe(path.join(ROOT, 'bin/templates'));
        expect(api.locations.www).toBe(path.join(ROOT, 'bin/templates/res/asset'));
        expect(api.locations.res).toBe(path.join(ROOT, 'bin/templates/res'));
        expect(api.locations.platformWww).toBe(path.join(ROOT, 'bin/templates/platform_www'));
        expect(api.locations.configXml).toBe(path.join(ROOT, 'bin/templates/res/default/config.xml'));
        expect(api.locations.defaultConfigXml).toBe(path.join(ROOT, 'bin/templates/cordova/defaults.xml'));
        expect(api.locations.strings).toBe(path.join(ROOT, 'bin/templates/res/default/strings.json'));
        expect(api.locations.manifest).toBe(path.join(ROOT, 'bin/templates/manifest.json'));
        expect(api.locations.build).toBe(path.join(ROOT, 'bin/templates/build'));
        expect(api.locations.cordovaJs).toBe('bin/templates/project/assets/www/cordova.js');
        expect(api.locations.cordovaJsSrc).toBe('cordova-js-src');
    }

    it('spec#0 API check', function(done) {
        // Check Api functions
        expect(typeof Api).toBe('function');
        expect(typeof Api.createPlatform).toBe('function');
        expect(typeof Api.updatePlatform).toBe('function');
        // Check Api prototype
        var api = new Api();
        expect(typeof api.getPlatformInfo).toBe('function');
        expect(typeof api.prepare).toBe('function');
        expect(typeof api.addPlugin).toBe('function');
        expect(typeof api.removePlugin).toBe('function');
        expect(typeof api.build).toBe('function');
        expect(typeof api.run).toBe('function');
        expect(typeof api.clean).toBe('function');
        expect(typeof api.requirements).toBe('function');
        done();
    });

    it('spec#1 constructor', function(done) {
        var api = new Api();
        checkProperty(api);
        done();
    });

    it('spec#2 getPlatformInfo', function(done) {
        var api = new Api();
        api._config = 'fake_config';
        var result = api.getPlatformInfo();
        expect(result.name).toBe("yunos");
        expect(result.root).toBe(path.join(ROOT, 'bin/templates'));
        expect(result.locations instanceof Object).toBe(true);
        expect(typeof result.version.version).toBe('string');
        expect(result.projectConfig).toBe('fake_config');
        done();
    });

    it('spec#3 createPlatform', function(done) {
        var destination = path.join(ROOT, 'bin/templates');
        spyOn(create, 'create').and.callFake(function() {
            return Q.resolve(destination);
        });
        Api.createPlatform(destination).done(function(result) {
            expect(create.create).toHaveBeenCalled();
            expect(result instanceof Api).toBe(true);
            checkProperty(result);
            done();
        });
    });

    it('spec#4 updatePlatform', function(done) {
        var destination = path.join(ROOT, 'bin/templates');
        spyOn(create, 'update').and.callFake(function() {
            return Q.resolve(destination);
        });
        Api.updatePlatform(destination).done(function(result) {
            expect(create.update).toHaveBeenCalled();
            expect(result instanceof Api).toBe(true);
            checkProperty(result);
            done();
        });
    });

    it('spec#5 prepare', function(done) {
        var api = new Api();
        var project = "test";
        var option = {};
        spyOn(prepare, 'prepare');
        api.prepare(project, option);
        expect(prepare.prepare).toHaveBeenCalledWith(project, option);
        done();
    });

    it('spec#6 addPlugin', function(done) {
        var platform = "yunos";
        var locations = {root: path.join(ROOT, 'bin/templates')};
        var ideProject = {};
        var mgr = new PluginManager(platform, locations, ideProject);
        spyOn(YunOSProject, 'getProjectFile');
        spyOn(PluginManager, 'get').and.callFake(function() {
            return mgr;
        });
        spyOn(mgr, 'addPlugin').and.callFake(function() {
            return Q.resolve();
        });
        spyOn(prepare, 'updatePermissions').and.callFake(function() {
            return Q.resolve();
        });

        var api = new Api();
        var plugin = {};
        var option = {};
        api.addPlugin(plugin, option).done(function() {
            var root = path.join(ROOT, 'bin/templates');
            expect(YunOSProject.getProjectFile).toHaveBeenCalledWith(root);
            expect(PluginManager.get).toHaveBeenCalled();
            expect(mgr.addPlugin).toHaveBeenCalledWith(plugin, option);
            expect(prepare.updatePermissions).toHaveBeenCalled();
            done();
        });
    });

    it('spec#7 removePlugin', function(done) {
        var platform = "yunos";
        var locations = {root: path.join(ROOT, 'bin/templates')};
        var ideProject = {};
        var mgr = new PluginManager(platform, locations, ideProject);
        spyOn(YunOSProject, 'getProjectFile');
        spyOn(PluginManager, 'get').and.callFake(function() {
            return mgr;
        });
        spyOn(mgr, 'removePlugin').and.callFake(function() {
            return Q.resolve();
        });
        spyOn(prepare, 'updatePermissions').and.callFake(function() {
            return Q.resolve();
        });

        var api = new Api();
        var plugin = {};
        var option = {};
        api.removePlugin(plugin, option).done(function() {
            var root = path.join(ROOT, 'bin/templates');
            expect(YunOSProject.getProjectFile).toHaveBeenCalledWith(root);
            expect(PluginManager.get).toHaveBeenCalled();
            expect(mgr.removePlugin).toHaveBeenCalledWith(plugin, option);
            expect(prepare.updatePermissions).toHaveBeenCalled();
            done();
        });
    });
});
