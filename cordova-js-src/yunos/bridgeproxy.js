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

var cordova = require('cordova');

var isDomono = yunos !== undefined && yunos.require !== undefined;

module.exports = {
    bridgeImpl: undefined,
    send: function(service, action, callbackId, args) {
        if(this.checkBridge() === false) {
            return;
        }
        bridgeImpl.send(service, action, callbackId, args);
    },
    init: function() {
        if (isDomono) {
            bridgeImpl = require('cordova/yunos/bridgeimpl');
        } else {
            //TODO: Bridge Impl for WebView
        }
        bridgeImpl.onBrowserMessageReceived = this.onBrowserMessageReceived;
        bridgeImpl.init();
    },
    checkBridge: function() {
        if (bridgeImpl === undefined) {
            console.error('Bridge not implemented');
            return false;
        }
        return true;
    },
    onBrowserMessageReceived: function(result, callbackId) {
        function callback(result, callbackId) {
            result = result || {};
            var status = result.status || cordova.callbackStatus.ERROR;
            var retValue = result.retValue || '';
            var keepCallback = result.keepCallback || false;
            var isSuccess = false;
            if (status == cordova.callbackStatus.OK ||
                status == cordova.callbackStatus.NO_RESULT) {
                isSuccess = true;
            }
            cordova.callbackFromNative(callbackId, isSuccess, status,
                                       [retValue], keepCallback);
        }
        // Post result to handler instead of calling handler's callback directly
        var TaskQueue = require('cordova/yunos/TaskQueue');
        TaskQueue.post(new TaskQueue.Task(callback, result, callbackId));
    }
};
