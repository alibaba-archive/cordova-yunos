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

/* jshint sub:true */

var Q = require('q');

/**
 * Returns a Promise for a list of emulator images in the form of objects
 * {
       name   : <emulator_name>,
       path   : <path_to_emulator_image>,
       target : <api_target>,
       abi    : <cpu>,
       skin   : <skin>
   }
 */
module.exports.list_images = function() {
    return Q.resolve();
};

// Returns a promise.
module.exports.list_started = function() {
    return Q.resolve();
};

/*
 * Starts an emulator with the given ID,
 * and returns the started ID of that emulator.
 * If no ID is given it will use the first image available,
 * if no image is available it will error out (maybe create one?).
 * If no boot timeout is given or the value is negative it will wait forever for
 * the emulator to boot
 *
 * Returns a promise.
 */
module.exports.start = function(emulator_ID, boot_timeout) {
    return Q.resolve();
};

/*
 * Waits for the core android process of the emulator to start. Returns a
 * promise that resolves to a boolean indicating success. Not specifying a
 * time_remaining or passing a negative value will cause it to wait forever
 */
module.exports.wait_for_boot = function(emulator_id, time_remaining) {
    return Q.resolve();
};

module.exports.resolveTarget = function(target) {
    return Q.resolve();
};

/*
 * Installs a previously built application on the emulator and launches it.
 * If no target is specified, then it picks one.
 * If no started emulators are found, error out.
 * Returns a promise.
 */
module.exports.install = function(givenTarget, buildResults) {
    return Q.resolve();
};
