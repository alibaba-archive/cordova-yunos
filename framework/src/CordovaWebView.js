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

const ConfigHelper = require('./ConfigHelper');
const CoreYunOS = require('./CoreYunOS');
const CordovaWebViewClient = require('./CordovaWebViewClient');
const Log = require('./Log');
const pluginManager = require('./PluginManager').getInstance();
const Page = require('yunos/page/Page');
const Path = require('path');

const TAG = 'CordovaWebView';

class CordovaWebView extends WebView {
    constructor(options) {
        super(options);
        this.boundKeys = [];
        this.appPlugin = null;
        this.window = null;
        this.page = null;
        this.msgQueue = [];
        this.inEvaluate = false;
    }

    pullOnce() {
        if (this.msgQueue.length === 0) {
            Log.D(TAG, 'All messages sent done');
            return;
        }
        let topMsg = this.msgQueue.shift();
        let result_ = topMsg.result;
        let callbackId_ = topMsg.callbackId;
        let jsStr =
            'var bridgeImpl = cordova.require("cordova/yunos/bridgeimpl");' +
            'bridgeImpl.onNodeMessageReceivedAgilWebView(__result__, __callbackId__);';
        let resultStr = '\'';
        resultStr += result_.toString();
        resultStr += '\'';
        Log.D(TAG, resultStr);
        jsStr = jsStr.replace('__result__', resultStr);
        let callbackIdStr = '\'';
        callbackIdStr += callbackId_;
        callbackIdStr += '\'';
        jsStr = jsStr.replace('__callbackId__', callbackIdStr);
        this.inEvaluate = true;
        this.evaluateJavaScript(jsStr, (arg) => {
            this.inEvaluate = false;
            this.pullOnce();
        });
    }

    initWebViewBridge() {
        // Node -> JS bridge
        pluginManager.registerMsgListener((result, callbackId) => {
            let msg = {result: result, callbackId: callbackId};
            if (this.inEvaluate === true) {
                Log.D(TAG, 'Bridge is busy, push to queue');
                this.msgQueue.push(msg);
                // Waiting for sending to JS
                return false;
            } else {
                this.msgQueue.push(msg);
                this.pullOnce();
                // Sending to JS ongoing
                return true;
            }
        });
    }

    initBridge() {
        // JS -> Node bridge
        let self = this;
        let cordovaNodeBridge = {
            exec: function(service, action, callbackId, argsJson) {
                let args = [];
                // Init webview bridge
                if (service === '' && action === 'gap_init:') {
                    Log.V(TAG, 'Init WebView bridge');
                    self.initWebViewBridge();
                    return;
                }
                try {
                    args = JSON.parse(argsJson);
                } catch(e) {
                    Log.E(TAG, 'Failed to parse args from DOM: ' + e);
                }
                pluginManager.exec(service, action, callbackId, args);
            }
        };
        this.addJavascriptInterface(cordovaNodeBridge, '_cordovaNodeBridge', ['exec']);
    }

    initUserAgent(overrideUserAgent, appendUserAgent) {
        if (overrideUserAgent) {
            this.settings.userAgentOverride = overrideUserAgent;
        } else if (appendUserAgent) {
            let originalUA = this.settings.userAgentOverride;
            let newUA = originalUA + ' ' + appendUserAgent;
            this.settings.userAgentOverride = newUA;
        }
    }

    initWindow(fullscreen, orientation) {
        if (fullscreen === 'true') {
            this.window.fullScreenMode = true;
        } else if (fullscreen === 'false') {
            this.window.fullScreenMode = false;
        } else {
            Log.E(TAG, 'Invalid fullscreen preference:', fullscreen);
        }
        let orientationFlag = Page.Orientation.Portrait;
        switch(orientation) {
            case 'all':
                this.page.autoOrientation = true;
                break;
            case 'default':
                orientationFlag = Page.Orientation.Portrait;
                break;
            case 'landscape':
                orientationFlag = Page.Orientation.LandscapeLeft;
                break;
            case 'portrait':
                orientationFlag = Page.Orientation.Portrait;
                break;
            default:
                Log.E(TAG, 'Invalid orientation preference:', orientation);
        }
        this.page.orientation = orientationFlag;
    }

    initCordova(page, window) {
        let self = this;
        this.client = new CordovaWebViewClient(this, page);
        this.page = page;
        this.window = window;
        function success(config) {
            // Init LoadUrlTimeoutValue
            let LoadUrlTimeoutValue = config.getPreferenceValue('loadUrlTimeoutValue', 20000);
            self.client.LoadUrlTimeoutValue = LoadUrlTimeoutValue;
            // Set config to PluginManager
            pluginManager.config = config;
            // Set page to PluginManager
            pluginManager.page = page;
            // Set webview to PluginManager
            pluginManager.webview = self;
            // Set log name and level
            Log.setLogLevel(config.name, config.getPreferenceValue('LogLevel'));
            // Add default yunos core plugin
            pluginManager.addService('CoreYunOS', 'CordovaLib/CoreYunOS', true);
            // Initialize custom plugins
            const PluginLoader = require('../CordovaLib/PluginLoader');
            PluginLoader.init();
            pluginManager.onCreate();
            // Expose JS interfaces
            self.initBridge();
            // Set UserAgent
            let overrideUserAgent = config.getPreferenceValue('overrideUserAgent', '');
            let appendUserAgent = config.getPreferenceValue('appendUserAgent', '');
            self.initUserAgent(overrideUserAgent, appendUserAgent);
            // Init the errorUrl
            let errorUrl = config.getPreferenceValue('errorUrl', '');
            if (errorUrl) {
                self.settings.errorPage = Path.join('res', 'asset', errorUrl);
            }
            // Init fullscreen and orientation
            let fullscreen = config.getPreferenceValue('fullscreen', 'false');
            let orientation = config.getPreferenceValue('orientation', 'portrait');
            self.initWindow(fullscreen, orientation);
            // Load the content path with agil-webview mode
            self.setUrl(config.package, config.contentPath);
        }
        function error(msg) {
            Log.E(TAG, 'Failed to get content src:');
            Log.E(TAG, msg);
        }
        ConfigHelper.readConfig(success, error);
    }

    setUrl(pkg, url) {
        let href = url || 'index.html';
        this.url = 'page://' + pkg + '/asset/res/asset/' + href;
    }

    onOrientationChange(orientation) {
        this.width = this.window.width;
        this.height = this.window.height;
        pluginManager.onOrientationChange(orientation);
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

    // The method will be called when the back key is pressed on this page.
    onBackKey() {
        let handled = this.dispatchKeyEventToDOM(CoreYunOS.BACK_BUTTON);
        if (handled === true) {
            return true;
        }
        if (this.canGoBack === true) {
            this.goBack();
            return true;
        }
        this.page.stopPage();
        return false;
    }

    dispatchKeyEventToDOM(key) {
        if (this.keyBoundedInDOM(key)) {
            if (this.appPlugin === null) {
                this.appPlugin = pluginManager.getPlugin('CoreYunOS');
            }
            if (this.appPlugin === null) {
                Log.E(TAG, 'Failed to get CoreYunOS plugin');
                return false;
            }
            this.appPlugin.fireDOMEvent(key);
            return true;
        }
        Log.D(TAG, key, ' not bound in DOM');
        return false;
    }

    keyBoundedInDOM(key) {
        let founded = false;
        for (let i in this.boundKeys) {
            if (this.boundKeys[i] === key) {
                founded = true;
            }
        }
        return founded;
    }

    pushBoundKeys(key) {
        let founded = false;
        for (let i in this.boundKeys) {
            if (this.boundKeys[i] === key) {
                founded = true;
            }
        }
        if (founded === false) {
            this.boundKeys.push(key);
        }
    }

    popBoundKeys(key) {
        let index = -1;
        for (let i in this.boundKeys) {
            if (this.boundKeys[i] === key) {
                index = i;
            }
        }
        if (index !== -1) {
            this.boundKeys.splice(index, 1);
        }
    }

    setButtonPlumbedToJs(button, override) {
        switch(button) {
            case CoreYunOS.BACK_BUTTON:
            case CoreYunOS.VOLUME_UP:
            case CoreYunOS.VOLUME_DOWN:
                if (override) {
                    this.pushBoundKeys(button);
                } else {
                    this.popBoundKeys(button);
                }
            break;
            default:
                Log.E(TAG, 'Not allowed to bound key:', button);
        }
    }

    clearBoundButtons() {
        this.boundKeys = [];
    }
}

module.exports = CordovaWebView;
