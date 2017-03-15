/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

let lang = require("caf/core/lang");

let Plugin = lang.create({
    constructor: function() {
        this._serviceName = null;
    },

    initialize: function(serviceName) {
        this._serviceName = serviceName;
    },

    getServiceName: function() {
        return this._serviceName;
    },

    execute: function(action, callbackContext, args) {
        let func = this[action];
        if (typeof func === 'function') {
            try {
                func.call(this, callbackContext, args);
            } catch(e) {
                console.log('Call action:' + action + ' failed with error:' + e);
            }
            // Action founded
            return true;
        } else {
            console.error('No action:' + action + ' founded in ' + this._serviceName);
            // Action not founded in plugin
            return false;
        }
    },

    onStart: function() {
        //TODO
    },

    onShow: function() {
        //TODO
    },

    onHide: function() {
        //TODO
    },

    onLink: function() {
        //TODO
    },

    onDestroy: function() {
        //TODO
    }
});

module.exports = Plugin;