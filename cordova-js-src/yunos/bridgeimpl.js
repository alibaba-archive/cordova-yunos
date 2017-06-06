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

var isDomono = yunos !== undefined && yunos.require !== undefined;
var base64 = require('cordova/base64');
var utils = require('cordova/utils');

// This should keep same with PluginResult's MessageType
const MessageType = {
    MESSAGE_TYPE_ARRAYBUFFER: 1,
    MESSAGE_TYPE_STRING:2
};

module.exports = {
    pluginManager: undefined,
    onNodeMessageReceived: undefined,

    send: function(service, action, callbackId, args) {
        // If args is not provided, default to an empty array
        args = args || [];
        pluginManager.exec(service, action, callbackId, args);
    },

    init: function() {
        if (isDomono === true) {
            this.initDomono();
        } else {
            this.initAgilWebView();
        }
    },

    initDomono: function() {
        // Workaround for yunos.require relative path
        function modulePath(path) {
            var pathname = location.pathname;
            var index = pathname.indexOf('/res/');
            var modulePath = '';
            if (index != -1) {
                var basePath = pathname.substr(0, index);
                var Path = yunos.require('path');
                modulePath = Path.join(basePath, path);
                modulePath = 'page:/' + modulePath;
            }
            return modulePath;
        }
        try {
            pluginManager = yunos.require(modulePath('CordovaLib/PluginManager')).getInstance();
            pluginManager.registerMsgListener(this.onNodeMessageReceived);
        } catch(e) {
            console.log('Failed to init Domono bridge proxy'+ '::stack trace=' + e.stack);
        }
    },

    initAgilWebView: function() {
        pluginManager = {};
        pluginManager.exec = function(service, action, callbackId, args) {
            if (window._cordovaNodeBridge === undefined) {
                console.error('No _cordovaNodeBridge founded');
                return;
            }
            // Process any ArrayBuffers in the args into a string.
            for (let i in args) {
                if (utils.typeName(args[i]) === 'ArrayBuffer') {
                    args[i] = base64.fromArrayBuffer(args[i]);
                }
            }
            var argsJson = JSON.stringify(args);
            window._cordovaNodeBridge.exec(service, action, callbackId, argsJson);
        }
        // Init webview bridge
        window._cordovaNodeBridge.exec('', 'gap_init:', '', '');
    },

    // Used only for agil-webview mode, will be called from node.
    onNodeMessageReceivedAgilWebView: function(result, callbackId) {
        if (this.onNodeMessageReceived === undefined) {
            console.error('No onNodeMessageReceived founded.');
            return;
        }
        var resultJson = {};
        result = result || '';
        try {
            resultJson = JSON.parse(result);
        } catch(e) {
            console.error('Parse node return message failed:');
            console.error(e);
            return;
        }
        switch (resultJson.messageType) {
            case MessageType.MESSAGE_TYPE_ARRAYBUFFER:
                resultJson.retValue = base64.toArrayBuffer(resultJson.retValue);
                break;
            case MessageType.MESSAGE_TYPE_STRING:
                var arrayBuffer = base64.toArrayBuffer(resultJson.retValue);
                var view = new Uint8Array(arrayBuffer);
                var decoder = new TextDecoder();
                resultJson.retValue = decoder.decode(view);
                break;
            default:
                break;
        }
        this.onNodeMessageReceived(resultJson, callbackId);
    }
};
