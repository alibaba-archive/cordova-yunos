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

var create = require('../../../bin/lib/create');
var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var ROOT = path.join(__dirname, '..', '..', '..');

describe("create methods", function () {
    var events = {emit: function() {}};

    beforeEach(function () {
        spyOn(events, 'emit');
        spyOn(fs, 'existsSync').and.returnValue(false);
        spyOn(shell, 'cp');
        spyOn(shell, 'mkdir');
        spyOn(shell, 'chmod');
        spyOn(shell, 'rm');
        spyOn(fs, 'symlinkSync');
    });

    function checkRemoveFiles(projectPath) {
        function removeInfo(oper, dest) {
            this._oper = oper;
            this._dest = path.join(projectPath, dest);
        }
        var test = new removeInfo('-rf', 'CordovaLib');
        expect(shell.rm).toHaveBeenCalledWith(test._oper, test._dest);
    }

    function checkCopiedFiles(projectPath, shared) {
        function copyInfo(oper, source, dest) {
            this._oper = oper;
            this._source = path.join(ROOT, source);
            this._dest = path.join(projectPath, dest);
        }

        var tests = [
            new copyInfo("-f", "bin/templates/project/.jsbeautifyrc", "."),
            new copyInfo("-f", "bin/templates/project/.tern-project", "."),
            new copyInfo("-f", "bin/templates/project/.yunos-project", "."),
            new copyInfo("-rf", "bin/templates/project/", "."),
            new copyInfo("-r", "bin/templates/cordova", "."),
            new copyInfo("-f", "cordova-lib/cordova.js", "platform_www"),
            new copyInfo("-rf", "cordova-js-src", "platform_www"),
            new copyInfo("-f", "cordova-lib/cordova.js", "res/asset"),
            new copyInfo("-r", "node_modules", "cordova")
        ];

        if (!shared) {
            tests.push(new copyInfo("-rf", "framework/src", "CordovaLib"));
        }

        tests.forEach(function(obj) {
            if (obj._oper === "") {
                expect(shell.cp).toHaveBeenCalledWith(obj._source, obj._dest);
            } else {
                expect(shell.cp).toHaveBeenCalledWith(obj._oper, obj._source, obj._dest);
            }
        });
    }

    function checkLinkedFiles(projectPath) {
        function symblinkInfo(source, dest) {
            this._source = path.join(ROOT, source);
            this._dest = path.join(projectPath, dest);
        }

        var tests = [
            new symblinkInfo("framework/src", "CordovaLib")
        ];

        tests.forEach(function(obj) {
            expect(fs.symlinkSync).toHaveBeenCalledWith(obj._source, obj._dest);
        });
    }

    function checkCreateDir(projectPath) {
        function mkdirInfo(oper, source) {
            this._oper = oper;
            this._source = path.join(projectPath, source);
        }

        var tests = [
            new mkdirInfo("-p", "platform_www"),
            new mkdirInfo("-p", "cordova/lib")
        ];
        tests.forEach(function(obj) {
            expect(shell.mkdir).toHaveBeenCalledWith(obj._oper, obj._source);
        });
    }

    it('spec#1 create invalidate project', function(done) {
        expect(function () { create.create(); }).toThrow();

        var rejectSpy = jasmine.createSpy();
        var config = {name: function() { return 'testname'; },
            packageName: function() { return 'test'; }};
        create.create('test', config).fail(rejectSpy).done(function() {
            expect(rejectSpy).toHaveBeenCalled();
            done();
        });
    });

    it('spec#2 create valid project', function(done) {
        spyOn(fs, 'readFileSync').and.callFake(function() {
            return '{}';
        });

        var appName;
        spyOn(fs, 'writeFileSync').and.callFake(function(path, str) {
            var obj = JSON.parse(str);
            appName = obj.APP_NAME;
            expect(appName).toBe('testname');
        });

        spyOn(fs, 'unlinkSync').and.throwError('there is no linked file');

        var rejectSpy = jasmine.createSpy();
        var config = {name: function() { return 'testname'; },
            packageName: function() { return 'com.app.test'; }};
        create.create('test', config, null, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            checkCreateDir("test");
            checkRemoveFiles("test");
            checkCopiedFiles("test");
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            done();
        });
    });

    it('spec#3 create project with link', function(done) {
        spyOn(fs, 'readFileSync').and.callFake(function() {
            return '{}';
        });

        var appName;
        spyOn(fs, 'writeFileSync').and.callFake(function(path, str) {
            var obj = JSON.parse(str);
            appName = obj.APP_NAME;
        });

        var rejectSpy = jasmine.createSpy();
        var options = {link: true};
        var config = {name: function() { return 'test'; },
            packageName: function() { return 'com.app.test'; }};
        create.create('test', config, options, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            checkCreateDir("test");
            checkLinkedFiles("test");
            checkCopiedFiles("test", options.link);
            checkRemoveFiles("test");
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(appName).toBe('test');
            done();
        });
    });

    it('spec#4 update valid project', function(done) {
        var rejectSpy = jasmine.createSpy();
        create.update('test', null, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            expect(shell.rm).toHaveBeenCalledWith("-rf", "test/cordova");
            checkCreateDir("test");
            checkCopiedFiles("test");
            done();
        });
    });

    it('spec#5 update valid project with link', function(done) {
        var rejectSpy = jasmine.createSpy();
        var options = {link: true};
        create.update('test', options, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            expect(shell.rm).toHaveBeenCalledWith("-rf", "test/cordova");
            checkCreateDir("test");
            checkRemoveFiles("test");
            checkCopiedFiles("test", options.link);
            checkLinkedFiles("test");
            done();
        });
    });

    it('spec#6 create valid project and then update the project', function(done) {
        spyOn(fs, 'readFileSync').and.callFake(function() {
            return '{}';
        });

        var appName;
        spyOn(fs, 'writeFileSync').and.callFake(function(path, str) {
            var obj = JSON.parse(str);
            appName = obj.APP_NAME;
        });

        var rejectSpy = jasmine.createSpy();
        var config = {name: function() { return 'testname'; },
            packageName: function() { return 'com.app.test'; }};
        create.create('test', config, null, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            checkCreateDir("test");
            checkCopiedFiles("test");
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(appName).toBe('testname');
        });

        var options = {link: true};
        create.update('test', options, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            expect(shell.rm).toHaveBeenCalledWith("-rf", "test/cordova");
            checkCreateDir("test");
            checkLinkedFiles("test");
            checkCopiedFiles("test", options.link);
            done();
        });
    });
});
