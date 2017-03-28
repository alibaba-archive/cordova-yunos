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

class CordovaEmbedded extends Page {
    onCreate() {
        // Set log name and level
        Log.setLogLevel('MyEmbeddedCordovaApp', 'VERBOSE');
        this._cordovaWebView = new CordovaWebView();
        this._cordovaWebView.width = this.window.width;
        this._cordovaWebView.height = this.window.height;
        this._cordovaWebView.top = 0;
        this.window.addChild(this._cordovaWebView);
        let self = this;
        function success(config) {
            // Load the content path with agil-webview mode
            let href = config.contentPath || 'index.html';
            self._cordovaWebView.url = Path.join('res', 'asset', href);
        }
        function error(msg) {
            Log.E(TAG, 'Failed to get content src:');
            Log.E(TAG, msg);
        }
        ConfigHelper.readConfig(success, error);
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

    // The event is fired when the page instance is shown.
    onShow() {
        this._cordovaWebView.onShow();
    }

    // The event is fired when the page instance is hidden.
    onHide() {
        this._cordovaWebView.onHide();
    }

    // The event is fired when the page instance is requested to trim memory.
    onTrimMemory() {
        this._cordovaWebView.onTrimMemory();
    }
}
module.exports = CordovaEmbedded;
