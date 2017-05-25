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

const Path = require('path');
const Page = require('yunos/page/Page');

const ConfigHelper = require('../CordovaLib/ConfigHelper');
const CordovaWebView = require('../CordovaLib/CordovaWebView');
const Log = require('../CordovaLib/Log');
const TAG = 'CordovaEmbedded';

class CordovaEmbedded extends Page {
    onCreate() {
        Log.setLogLevel('MyEmbeddedCordovaApp', 'VERBOSE');
        this._cordovaWebView = new CordovaWebView(this);
        this._cordovaWebView.initCordova(this);
        // Set log name and level
        this._cordovaWebView.width = this.window.width;
        this._cordovaWebView.height = this.window.height;
        this._cordovaWebView.top = 0;
        this.window.addChild(this._cordovaWebView);
        let self = this;
        function success(config) {
            // Init userAgent
            let overrideUserAgent = config.getPreferenceValue('overrideUserAgent', '');
            let appendUserAgent = config.getPreferenceValue('appendUserAgent', '');
            self.initUserAgent(overrideUserAgent, appendUserAgent);
            // Load the content path with agil-webview mode
            let href = config.contentPath || 'index.html';
            self._cordovaWebView.url = Path.join('res', 'asset', href);
            // Init fullscreen and orientation
            let fullscreen = config.getPreferenceValue('fullscreen', false);
            let orientation = config.getPreferenceValue('orientation', 'portrait');
            self.initWindow(fullscreen, orientation);
        }
        function error(msg) {
            Log.E(TAG, 'Failed to get content src:');
            Log.E(TAG, msg);
        }
        ConfigHelper.readConfig(success, error);
        this._cordovaWebView.onCreate();
    }

    initUserAgent(overrideUserAgent, appendUserAgent) {
        if (overrideUserAgent) {
            this._cordovaWebView.settings.userAgentOverride = overrideUserAgent;
        } else if (appendUserAgent) {
            let originalUA = this._cordovaWebView.settings.userAgentOverride;
            let newUA = originalUA + ' ' + appendUserAgent;
            this._cordovaWebView.settings.userAgentOverride = newUA;
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
                this.autoOrientation = true;
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
        this.orientation = orientationFlag;
    }

    onOrientationChange(orientation) {
        this._cordovaWebView.width = this.window.width;
        this._cordovaWebView.height = this.window.height;
    }

    // The event is fired when the page instance is shown.
    onShow() {
        this._cordovaWebView.onShow();
    }

    // The event is fired when the page instance is started.
    onStart() {
        this._cordovaWebView.onStart();
    }

    // The event is fired when the page instance is stoped.
    onStop() {
        this._cordovaWebView.onStop();
    }

    // The method is called when the page instance receives message from other pages.
    onLink(link) {
        this._cordovaWebView.onLink(link);
    }

    // The event is fired when the page instance is destroyed.
    onDestroy() {
        this._cordovaWebView.onDestroy();
    }

    // The event is fired when the page instance is hidden.
    onHide() {
        this._cordovaWebView.onHide();
    }

    // The event is fired when the page instance is requested to trim memory.
    onTrimMemory() {
        this._cordovaWebView.onTrimMemory();
    }

    // The method is called when the back key is pressed on this page.
    onBackKey() {
        // Send back key event to cordova.
        // backKeyHandled === true: cordova has handled back key event.
        // otherwise, application should handle back key.
        let backKeyHandled = this._cordovaWebView.onBackKey();

        // Cordova omitted back key event, application should quite.
        if (backKeyHandled === false) {
            this.stopPage();
        }
        return true;
    }
}
module.exports = CordovaEmbedded;
