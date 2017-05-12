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

const WebViewClient = require("yunos/web/WebViewClient");
const Log = require('../CordovaLib/Log');
const pluginManager = require('../CordovaLib/PluginManager').getInstance();

const TAG = 'CordovaWebViewClient';

class CordovaWebViewClient extends WebViewClient {
    constructor(webview) {
        super();
        this._webview = webview;
    }

    showWebPage(url, openExternal, clearHistory, params) {
        // TODO
    }

    shouldOverrideUrlLoading(webView, url) {
        // Give plugins the chance to handle the url
        if (pluginManager.onOverrideUrlLoading(url)) {
            return true;
        } else if (pluginManager.shouldAllowNavigation(url)) {
            return false;
        } else if (pluginManager.shouldOpenExternalUrl(url)) {
            showWebPage(url, true, false, null);
            return true;
        }
        Log.W(TAG, "Blocked (possibly sub-frame) navigation to non-allowed URL: " + url);
        return true;
    }
}
module.exports = CordovaWebViewClient;
