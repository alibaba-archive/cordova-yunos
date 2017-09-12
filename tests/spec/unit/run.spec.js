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

var run = require('../../../bin/templates/cordova/lib/run');
var build = require('../../../bin/templates/cordova/lib/build');
var device = require('../../../bin/templates/cordova/lib/device');
var emulator = require('../../../bin/templates/cordova/lib/emulator');
var Q = require('q');

describe("run methods", function () {

    it('spec#1 should not run if the device is offline', function(done) {
        // the online device is null
        spyOn(device, 'list').and.callFake(function() {
            return Q([]);
        });
        // the emulator is not support yet.
        spyOn(emulator, 'resolveTarget').and.callFake(function() {
            return Q.reject('emulator is not support on yunos yet');
        });
        var rejectSpy = jasmine.createSpy();
        var buildRun = jasmine.createSpy();
        var runOption = {"release":true,"argv":[],"nobuild":true};
        spyOn(build, 'run').and.callFake(function() {
            buildRun();
            return Q.reject(); // rejecting to break run chain
        });
        run.run(runOption).fail(rejectSpy).done(function() {
            expect(rejectSpy).toHaveBeenCalled();
            expect(buildRun).not.toHaveBeenCalled();
            done();
        });
    });

    it('spec#2 should run if the device is online', function(done) {
        // there's one online device
        spyOn(device, 'list').and.callFake(function() {
            return Q(['fakeDeice0']);
        });
        spyOn(device, 'resolveTarget').and.callFake(function(target) {
            return Q({ target: target, arch: 'arm', isEmulator: false });
        });
        spyOn(device, 'install').and.callFake(function(resolvedTarget, buildResults) {
            expect(resolveTarget).toBe({ target: 'fakeDeice0', arch: 'arm', isEmulator: false });
            expect(buildResults).toBe(true);
        });
        spyOn(build, 'run').and.callFake(function() {
            buildRun();
            return Q(true); // rejecting to break run chain
        });
        var rejectSpy = jasmine.createSpy();
        var buildRun = jasmine.createSpy();
        var runOption = {"release":true,"argv":[],"nobuild":true};

        run.run(runOption).fail(rejectSpy).done(function() {
            expect(rejectSpy).toHaveBeenCalled();
            expect(buildRun).toHaveBeenCalled();
            expect(device.install).toHaveBeenCalled();
            done();
        });
    });

});
