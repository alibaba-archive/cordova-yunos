/**
 * Copyright (C) 2010-2017 Alibaba Group Holding Limited
 */

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
var base64 = require('cordova/base64');

// This should keep same with PluginResult's MessageType
const MessageType = {
    MESSAGE_TYPE_ARRAYBUFFER: 1,
    MESSAGE_TYPE_STRING:2
};

module.exports = {
    bridgeImpl: undefined,

    send: function(service, action, callbackId, args) {
        if(this.checkBridge() === false) {
            return;
        }
        bridgeImpl.send(service, action, callbackId, args);
    },

    init: function() {
        bridgeImpl = require('cordova/yunos/bridgeimpl');
        bridgeImpl.onNodeMessageReceived = this.onNodeMessageReceived;
        bridgeImpl.init();
    },

    checkBridge: function() {
        if (bridgeImpl === undefined) {
            console.error('Bridge not implemented');
            return false;
        }
        return true;
    },

    onNodeMessageReceived: function(result, callbackId) {
        function callback(result, callbackId) {
            result = result || {};
            switch (result.messageType) {
                case MessageType.MESSAGE_TYPE_ARRAYBUFFER:
                    result.retValue = base64.toArrayBuffer(result.retValue);
                    break;
                case MessageType.MESSAGE_TYPE_STRING:
                    var arrayBuffer = base64.toArrayBuffer(result.retValue);
                    var view = new Uint8Array(arrayBuffer);
                    var decoder = new TextDecoder();
                    result.retValue = decoder.decode(view);
                    break;
                default:
                    break;
            }
            var status = result.status || cordova.callbackStatus.ERROR;
            var retValue = (result.retValue === undefined) ? '': result.retValue;
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
        return true;
    }
};
