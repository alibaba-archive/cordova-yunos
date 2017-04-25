/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

const WebView = require('yunos/ui/view/WebView');

const ConfigHelper = require('../CordovaLib/ConfigHelper');
const Log = require('../CordovaLib/Log');
const pluginManager = require('../CordovaLib/PluginManager').getInstance();

const TAG = 'CordovaWebView';

class CordovaWebView extends WebView {
    constructor(options) {
        super(options);
    }

    initBridge() {
        // JS -> Node bridge
        let cordovaNodeBridge = {
            exec: function(service, action, callbackId, argsJson) {
                let args = [];
                try {
                    Log.v(TAG, 'Start parsing args from DOM');
                    Log.v(TAG, 'argsJson: ' + argsJson);
                    args = JSON.parse(argsJson);
                    Log.v(TAG, 'args: ' + args);
                } catch(e) {
                    Log.e(TAG, 'Failed to parse args from DOM: ' + e);
                }
                pluginManager.exec(service, action, callbackId, args);
            }
        };
        this.addJavascriptInterface(cordovaNodeBridge, '_cordovaNodeBridge', ['exec']);
        // Node -> JS bridge
        let self = this;
        pluginManager.registerMsgListener(function(result, callbackId) {
            let jsStr =
                'var result = __result__;' +
                'var callbackId = __callbackId__;' +
                'setTimeout(function() {' +
                '    var bridgeImpl = cordova.require("cordova/yunos/bridgeimpl");' +
                '    bridgeImpl.onNodeMessageReceivedAgilWebView(result, callbackId);' +
                '}, 0);';
            let resultStr = '\'';
            resultStr += result.toString();
            resultStr += '\'';
            jsStr = jsStr.replace('__result__', resultStr);
            let callbackIdStr = '\'';
            callbackIdStr += callbackId;
            callbackIdStr += '\'';
            jsStr = jsStr.replace('__callbackId__', callbackIdStr);
            self.evaluateJavaScript(jsStr);
        });
    }

    initCordova(page) {
        let self = this;
        function success(config) {
            // Set config to PluginManager
            pluginManager.config = config;
            // Set page to PluginManager
            pluginManager.page = page;
            // Set log name and level
            Log.setLogLevel(config.name, config.getPreferenceValue('LogLevel'));
            // Add default yunos core plugin
            pluginManager.addService('CoreYunOS', 'CordovaLib/CoreYunOSDomono', true);
            // Initialize custom plugins
            const PluginLoader = require('../CordovaLib/PluginLoader');
            PluginLoader.init();
            pluginManager.onCreate();
            // Expose JS interfaces
            self.initBridge();
        }
        function error(msg) {
            Log.E(TAG, 'Failed to get content src:');
            Log.E(TAG, msg);
        }
        ConfigHelper.readConfig(success, error);
    }

    onCreate() {
        pluginManager.onCreate();
    }

    // The event is fired when the page instance is started.
    onStart() {
        pluginManager.onStart();
    }

    // The event is fired when the page instance is stoped.
    onStop() {
        pluginManager.onStop();
    }

    // The method is called when the page instance receives message from other pages.
    onLink(link) {
        pluginManager.onLink(link);
    }

    // The event is fired when the page instance is destroyed.
    onDestroy() {
        pluginManager.onDestroy();
    }

    // The event is fired when the page instance is shown.
    onShow() {
        pluginManager.onShow();
    }

    // The event is fired when the page instance is hidden.
    onHide() {
        pluginManager.onHide();
    }

    // The event is fired when the page instance is requested to trim memory.
    onTrimMemory() {
        pluginManager.onTrimMemory();
    }
}
module.exports = CordovaWebView;
