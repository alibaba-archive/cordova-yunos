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

const WebViewClient = require('yunos/web/WebViewClient');
const Log = require('../CordovaLib/Log');
const pluginManager = require('../CordovaLib/PluginManager').getInstance();

const TAG = 'CordovaWebViewClient';

class CordovaWebViewClient extends WebViewClient {
    constructor(webview, page) {
        super();
        this._webview = webview;
        this._page = page;
        this._LoadUrlTimeoutValue = 20000;
        this._timer = null;
    }

    showWebPage(url, openExternal, clearHistory, params) {
        Log.D(TAG, 'showWebPage:', url, openExternal, clearHistory, params);
        if (clearHistory === true) {
            this._webview.history.clear();
        }

        // If loading into our webview
        if (openExternal === false) {
            if (pluginManager.shouldAllowNavigation(url) === true) {
                //TODO: load url in this webview and treat with load timeout
                Log.E(TAG, 'Not implemented');
                return;
            } else {
                Log.W(TAG, 'showWebPage: Refusing to load URL into webview since it is not in the <allow-navigation> whitelist. URL=', url);
            }
        }
        if (pluginManager.shouldOpenExternalUrl(url) === false) {
            LOG.W(TAG, 'showWebPage: Refusing to send intent for URL since it is not in the <allow-intent> whitelist. URL=' + url);
            return;
        }
        let PageLink = require('yunos/page/PageLink');
        let linkObject = new PageLink('page://ucbrowser.yunos.com/browser');
        let data = {url: url};
        linkObject.data = JSON.stringify(data);
        this._page.sendLink(linkObject);
    }

    shouldOverrideUrlLoading(webView, url) {
        // Give plugins the chance to handle the url
        if (pluginManager.onOverrideUrlLoading(url)) {
            return true;
        } else if (pluginManager.shouldAllowNavigation(url)) {
            return false;
        } else if (pluginManager.shouldOpenExternalUrl(url)) {
            this.showWebPage(url, true, false, null);
            return true;
        }
        Log.W(TAG, 'Blocked (possibly sub-frame) navigation to non-allowed URL: ' + url);
        return true;
    }

    onPageStarted(webView, url) {
        this._timer = setTimeout(function() {
            let data = {
                errorCode: -6,
                description: 'The connection to the server was unsuccessful.',
                url: url
            };
            pluginManager.onReceivedError(data);
        }, this.LoadUrlTimeoutValue);
        pluginManager.onReset();
    }

    onPageFinished(webView, url) {
        this.clearLoadTimeoutTimer();
    }

    onLoadVisuallyCommitted(webView, url) {
        pluginManager.onLoadVisuallyCommitted(url);
    }

    clearLoadTimeoutTimer() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
    }

    set LoadUrlTimeoutValue(LoadUrlTimeoutValue) {
        this._LoadUrlTimeoutValue = LoadUrlTimeoutValue;
    }

    get LoadUrlTimeoutValue() {
        return this._LoadUrlTimeoutValue;
    }
}
module.exports = CordovaWebViewClient;
