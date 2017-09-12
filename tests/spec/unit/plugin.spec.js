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
/* jshint laxcomma:true */

var pluginHandlers = require('../../../bin/templates/cordova/lib/pluginHandlers');
var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var ROOT = path.join(__dirname, '..', '..', '..');

describe("plugin methods", function () {
    var events = {emit: function() {}};
    var exists;

    beforeEach(function () {
        spyOn(events, 'emit');
        exists = spyOn(fs, 'existsSync').and.returnValue(true);
        spyOn(shell, 'cp');
        spyOn(shell, 'mkdir');
        spyOn(shell, 'chmod');
        spyOn(shell, 'rm');
        spyOn(fs, 'symlinkSync');
        spyOn(fs, 'rmdirSync');
        spyOn(fs, 'realpathSync').and.callFake(function(_path) {
            return '/cordova/plugin/' + _path;
        });
        spyOn(fs, 'readdirSync').and.callFake(function(_path) {
            return [];
        });
        spyOn(fs, 'statSync').and.callFake(function(path) {
            var func = {};
            func.isDirectory = function() {return true;};
            func.isFile = function() {return true;};
            return func;
        });
    });

    function checkHandlers(getter_func) {
        var handlers = ['source-file', 'asset', 'js-module'];
        handlers.forEach(function(handler) {
            var handler_func = getter_func(handler);
            expect(typeof handler_func).toBe('function');
        });
    }

    it('spec#0 check plugin handler apis', function(done) {
        expect(typeof pluginHandlers.getInstaller).toBe('function');
        checkHandlers(pluginHandlers.getInstaller);
        expect(typeof pluginHandlers.getUninstaller).toBe('function');
        checkHandlers(pluginHandlers.getUninstaller);
        done();
    });

    it('spec#1 check source-file installer', function(done) {
        var handler = pluginHandlers.getInstaller('source-file');
        var obj = {src: 'src/yunos/Device.js', targetDir: 'src/org/apache/cordova/device'};
        var plugin = {id: 'Device', dir: '/myApp/plugins/cordova-plugin-device'};
        var project = {projectDir: '/myApp/platforms/yunos'};
        var options = {link: false, force: true};
        handler(obj, plugin, project, options);
        expect(shell.mkdir).toHaveBeenCalledWith('-p', '/myApp/platforms/yunos/src/org/apache/cordova/device');
        expect(shell.cp).toHaveBeenCalledWith('-Rf', '/myApp/plugins/cordova-plugin-device/src/yunos/Device.js',
                '/myApp/platforms/yunos/src/org/apache/cordova/device/Device.js');
        done();
    });

    it('spec#2 check source-file uninstaller', function(done) {
        var handler = pluginHandlers.getUninstaller('source-file');
        var obj = {src: 'src/yunos/Device.js', targetDir: 'src/org/apache/cordova/device'};
        var plugin = {id: 'Device', dir: '/myApp/plugins/cordova-plugin-device'};
        var project = {projectDir: '/myApp/platforms/yunos'};
        var options = {link: false, force: true};
        handler(obj, plugin, project, options);
        expect(shell.rm).toHaveBeenCalledWith('-Rf', '/myApp/platforms/yunos/src/org/apache/cordova/device/Device.js');
        done();
    });

    it('spec#3 check asset installer', function(done) {
        var handler = pluginHandlers.getInstaller('asset');
        var obj = {src: 'www/yunos/Device.js', target: 'www/device'};
        var plugin = {id: 'Device', dir: '/myApp/plugins/cordova-plugin-device'};
        var project = {www: '/myApp/platforms/yunos/res/asset'};
        var options = {link: false, force: true};
        handler(obj, plugin, project, options);
        expect(shell.mkdir).toHaveBeenCalledWith('-p', '/myApp/platforms/yunos/res/asset/www');
        expect(shell.cp).toHaveBeenCalledWith('-Rf', '/myApp/plugins/cordova-plugin-device/www/yunos/Device.js',
                '/myApp/platforms/yunos/res/asset/www/device');
        done();
    });

    it('spec#4 check asset uninstaller', function(done) {
        var handler = pluginHandlers.getUninstaller('asset');
        var obj = {src: 'www/yunos/Device.js', target: 'www/org/apache/cordova/device'};
        var plugin = {id: 'Device', dir: '/myApp/plugins/cordova-plugin-device'};
        var project = {www: '/myApp/platforms/yunos'};
        var options = {link: false, force: true};
        handler(obj, plugin, project, options);
        expect(shell.rm).toHaveBeenCalledWith('-Rf', '/myApp/platforms/yunos/www/org/apache/cordova/device');
        done();
    });

    it('spec#5 check js-module installer', function(done) {
        var handler = pluginHandlers.getInstaller('js-module');
        var obj = {src: 'www/yunos/Device.js', target: 'www/device'};
        var plugin = {id: 'Device', dir: '/myApp/plugins/cordova-plugin-device'};
        var project = {www: '/myApp/platforms/yunos/res/asset'};
        var options = {link: false, force: true};

        spyOn(fs, 'readFileSync').and.callFake(function(_path) {
            if (_path === '/myApp/plugins/cordova-plugin-device/www/yunos/Device.js') {
                return 'HelloWorld';
            }
            return '';
        });
        spyOn(fs, 'writeFileSync').and.callFake(function(_path, content, tupe) {
            expect(_path).toBe('/myApp/platforms/yunos/res/asset/plugins/Device/www/yunos/Device.js');
            expect(content).toBe('cordova.define("Device.Device", function(require, exports, module) {\nHelloWorld\n});\n');
            expect(tupe).toBe('utf-8');
            return '';
        });

        handler(obj, plugin, project, options);
        expect(shell.mkdir).toHaveBeenCalledWith('-p', '/myApp/platforms/yunos/res/asset/plugins/Device/www/yunos');
        done();
    });

    it('spec#6 check asset uninstaller', function(done) {
        var handler = pluginHandlers.getUninstaller('asset');
        var obj = {src: 'www/yunos/Device.js', target: 'www/device'};
        var plugin = {id: 'Device', dir: '/myApp/plugins/cordova-plugin-device'};
        var project = {www: '/myApp/platforms/yunos/res/asset'};
        var options = {link: false, force: true};
        handler(obj, plugin, project, options);
        expect(shell.rm).toHaveBeenCalledWith('-Rf', '/myApp/platforms/yunos/res/asset/plugins/Device');
        done();
    });

});
