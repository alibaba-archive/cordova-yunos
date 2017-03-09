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

var bridgeProxy = require('cordova/yunos/bridgeproxy');
var cordova = require('cordova');
var execProxy = require('cordova/exec/proxy');

module.exports = {
    exec: function(service, action, callbackId, args) {
        var w3cProxy = execProxy.get(service, action);
        if (w3cProxy) {
            // service is a w3c wrapper
            // callbackOptions param represents additional optional parameters command could pass back, like keepCallback or
            // custom callbackId, for example {callbackId: id, keepCallback: true, status: cordova.callbackStatus.JSON_EXCEPTION }
            var onSuccess = function (result, callbackOptions) {
                callbackOptions = callbackOptions || {};
                var callbackStatus;
                // covering both undefined and null.
                // strict null comparison was causing callbackStatus to be undefined
                // and then no callback was called because of the check in cordova.callbackFromNative
                // see CB-8996 Mobilespec app hang on windows
                if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                    callbackStatus = callbackOptions.status;
                }
                else {
                    callbackStatus = cordova.callbackStatus.OK;
                }
                cordova.callbackSuccess(callbackOptions.callbackId || callbackId,
                    {
                        status: callbackStatus,
                        message: result,
                        keepCallback: callbackOptions.keepCallback || false
                    });
            };
            var onError = function (err, callbackOptions) {
                callbackOptions = callbackOptions || {};
                var callbackStatus;
                // covering both undefined and null.
                // strict null comparison was causing callbackStatus to be undefined
                // and then no callback was called because of the check in cordova.callbackFromNative
                // note: status can be 0
                if (callbackOptions.status !== undefined && callbackOptions.status !== null) {
                    callbackStatus = callbackOptions.status;
                }
                else {
                    callbackStatus = cordova.callbackStatus.OK;
                }
                cordova.callbackError(callbackOptions.callbackId || callbackId,
                {
                    status: callbackStatus,
                    message: err,
                    keepCallback: callbackOptions.keepCallback || false
                });
            };
            w3cProxy(onSuccess, onError, args);
        } else {
            // service is on YunOS node implementation
            bridgeProxy.send(service, action, callbackId, args);
        }
    },
    init: function() {
        bridgeProxy.init();
    }
};