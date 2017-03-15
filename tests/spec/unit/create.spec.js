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
    var exists;

    beforeEach(function () {
        spyOn(events, 'emit');
        exists = spyOn(fs, 'existsSync').and.returnValue(true);
        spyOn(shell, 'cp');
        spyOn(shell, 'mkdir');
        spyOn(shell, 'chmod');
        spyOn(shell, 'rm');
        spyOn(fs, 'symlinkSync');
    });

    function checkCopiedFiles(projectPath, extras) {
        function copyInfo(oper, source, dest) {
            this._oper = oper;
            this._source = path.join(ROOT, source);
            this._dest = path.join(projectPath, dest);
        }

        var tests = [
            new copyInfo("-rf", "framework/src", "CordovaLib"),
            new copyInfo("-f", "bin/templates/project/.jsbeautifyrc", "."),
            new copyInfo("-f", "bin/templates/project/.tern-project", "."),
            new copyInfo("-f", "bin/templates/project/.yunos-project", "."),
            new copyInfo("-f", "bin/templates/project/manifest.json", "."),
            new copyInfo("-r", "bin/templates/cordova", "."),
            new copyInfo("-f", "cordova-lib/cordova.js", "platform_www"),
            new copyInfo("-rf", "cordova-js-src", "platform_www"),
            new copyInfo("-f", "cordova-lib/cordova.js", "res/asset"),
            new copyInfo("-r", "node_modules", "cordova"),
            new copyInfo("-r", "bin/templates/cordova", "."),
            new copyInfo("", "bin/lib/check_reqs.js", "cordova/lib")
        ];

        if (extras && extras instanceof Array) {
            extras.forEach(function(obj) {
                tests.push(obj);
            });
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
            new symblinkInfo("framework/src", "CordovaLib/src"),
            new symblinkInfo("bin/templates/project/libs", "libs"),
            new symblinkInfo("bin/templates/project/spec", "spec"),
            new symblinkInfo("bin/templates/project/test", "test")
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
        exists.and.returnValue(false);
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
        exists.and.returnValue(false);
        var rejectSpy = jasmine.createSpy();
        var config = {name: function() { return 'testname'; },
            packageName: function() { return 'com.app.test'; }};
        create.create('test', config, null, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            checkCreateDir("test");
            checkCopiedFiles("test");
            done();
        });
    });

    it('spec#3 create project with link', function(done) {
        exists.and.returnValue(false);
        var rejectSpy = jasmine.createSpy();
        var options = {link: true};
        var config = {name: function() { return 'testname'; },
            packageName: function() { return 'com.app.test'; }};
        create.create('test', config, options, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            checkCreateDir("test");
            checkLinkedFiles("test");
            done();
        });
    });

    it('spec#4 update valid project', function(done) {
        exists.and.returnValue(false);
        var rejectSpy = jasmine.createSpy();
        create.update('test', null, events).fail(rejectSpy).done(function() {
            expect(rejectSpy).not.toHaveBeenCalled();
            expect(shell.rm).toHaveBeenCalledWith("-rf", "test/cordova");
            checkCreateDir("test");
            checkCopiedFiles("test");
            done();
        });
    });
});
