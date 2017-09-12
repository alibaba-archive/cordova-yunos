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

var build = require('../../../bin/templates/cordova/lib/build');
var clean = require('../../../bin/templates/cordova/lib/clean');
var check_reqs = require('../../../bin/templates/cordova/lib/check_reqs');
var Q = require('q');
var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var platformAppDir = path.join('platforms', 'yunos');
var platformBuildDir = path.join('platforms', 'yunos', 'build');
var outputsDir = path.join(platformBuildDir, 'outputs');
var packageDir = path.join(outputsDir, 'package');
var yppDir = path.join(outputsDir, 'ypp');

describe("build methods", function () {

    beforeEach(function () {
        spyOn(check_reqs, 'run').and.returnValue(Q());
        spyOn(clean, 'cleanProject').and.returnValue(Q());
        spyOn(fs, 'existsSync').and.returnValue(true);
        spyOn(shell, 'mkdir');
        spyOn(shell, 'cp');
        spyOn(shell, 'rm');
        spyOn(fs, 'readFileSync').and.returnValue('{"domain": {}, "pages": [{"uri": "page://test.yunos.com/jasmine"}]}');
    });

    function checkRemoveFiles() {
        function removeInfo(oper, dest) {
            this._oper = oper;
            this._dest = dest;
        }
        var tests = [
            new removeInfo('-rf', packageDir),
            new removeInfo('-rf', yppDir)
        ];
        tests.forEach(function(obj) {
            expect(shell.rm).toHaveBeenCalledWith(obj._oper, obj._dest);
        });
    }

    function checkCopiedFiles() {
        function copyInfo(oper, source, dest) {
            this._oper = oper;
            this._source = path.join(platformAppDir, source);
            this._dest = path.join(packageDir, dest);
        }

        var tests = [
            new copyInfo('-rf', 'CordovaLib/', 'CordovaLib'),
            new copyInfo('-rf', 'libs', '.'),
            new copyInfo('-f',  'manifest.json', '.'),
            new copyInfo('-rf', 'res', '.'),
            new copyInfo('-rf', 'spec','.'),
            new copyInfo('-rf', 'src', '.'),
            new copyInfo('-rf', 'test','.')
        ];

        tests.forEach(function(obj) {
            if (obj._oper === "") {
                expect(shell.cp).toHaveBeenCalledWith(obj._source, obj._dest);
            } else {
                expect(shell.cp).toHaveBeenCalledWith(obj._oper, obj._source, obj._dest);
            }
        });
    }

    function checkCreateDir() {
        function mkdirInfo(oper, source) {
            this._oper = oper;
            this._source = source;
        }

        var tests = [
            new mkdirInfo("-p", packageDir),
            new mkdirInfo("-p", yppDir)
        ];
        tests.forEach(function(obj) {
            expect(shell.mkdir).toHaveBeenCalledWith(obj._oper, obj._source);
        });
    }

    it('spec#1 build project', function(done) {
        var options = {"argv":[]};
        var rejectSpy = jasmine.createSpy();
        build.run(options).fail(rejectSpy).done(function() {
            // expect(rejectSpy).not.toHaveBeenCalled();
            checkRemoveFiles();
            checkCopiedFiles();
            checkCreateDir();
            done();
        });
    });


});
