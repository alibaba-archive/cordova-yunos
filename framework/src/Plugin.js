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
const Log = require('./Log');
const TAG = 'Plugin';

class Plugin {
    // Constructor
    constructor() {
        this._serviceName = null;
        this._config = null;
        this._page = null;
    }

    // Called after plugin initialized.
    privateInitialize(serviceName) {
        this._serviceName = serviceName;
        this.initialize();
    }

    // Plugin service name.
    getServiceName() {
        return this._serviceName;
    }

    // Called from PluginManager.
    execute(action, callbackContext, args) {
        let func = this[action];
        if (typeof func === 'function') {
            try {
                let ret = func.call(this, callbackContext, args);
                // Plugin actions are allwed to have no return value.
                if (ret === undefined) {
                    return true;
                }
                return ret;
            } catch(e) {
                Log.E(TAG, 'Call action:' + action + ' failed with error:' + e);
                return false;
            }
        } else {
            Log.E(TAG, 'No action:' + action + ' founded in ' + this._serviceName);
            // Action not founded in plugin
            return false;
        }
    }

    set config(config) {
        this._config = config;
    }

    get config() {
        return this._config;
    }

    set page(page) {
        this._page = page;
    }

    get page() {
        return this._page;
    }

    // Custom init for plugins.
    initialize() {
    }

    // The event is fired when the page instance is created.
    onCreate() {
    }

    // The event is fired when the page instance is started.
    onStart() {
    }

    // The event is fired when the page instance is stoped.
    onStop() {
    }

    // The method is called when the page instance receives message from other pages.
    onLink(link) {
    }

    // The event is fired when the page instance is destroyed.
    onDestroy() {
    }

    // The event is fired when the page instance is shown.
    onShow() {
    }

    // The event is fired when the page instance is hidden.
    onHide() {
    }

    // The event is fired when the page instance is requested to trim memory.
    onTrimMemory() {
    }

    /**
     * Hook for blocking the loading of external resources.
     *
     * This will be called when the WebView's shouldInterceptRequest wants to
     * know whether to open a connection to an external resource. Return false
     * to block the request: if any plugin returns false, Cordova will block
     * the request. If all plugins return null, the default policy will be
     * enforced. If at least one plugin returns true, and no plugins return
     * false, then the request will proceed.
     *
     * Note that this only affects resource requests which are routed through
     * WebViewClient.shouldInterceptRequest, such as XMLHttpRequest requests and
     * img tag loads. WebSockets and media requests (such as <video> and <audio>
     * tags) are not affected by this method. Use CSP headers to control access
     * to such resources.
     */
    shouldAllowRequest(url) {
        return undefined;
    }

    /**
     * Allows plugins to handle a link being clicked. Return true here to cancel the navigation.
     *
     * @param url           The URL that is trying to be loaded in the Cordova webview.
     * @return              Return true to prevent the URL from loading. Default is false.
     */
    onOverrideUrlLoading(url) {
        return false;
    }

    /**
     * Hook for blocking the launching of Intents by the Cordova application.
     *
     * This will be called when the WebView will not navigate to a page, but
     * could launch an intent to handle the URL. Return false to block this: if
     * any plugin returns false, Cordova will block the navigation. If all
     * plugins return null, the default policy will be enforced. If at least one
     * plugin returns true, and no plugins return false, then the URL will be
     * opened.
     */
    shouldOpenExternalUrl(url) {
        return undefined;
    }

    /**
     * Hook for blocking navigation by the Cordova WebView. This applies both to top-level and
     * iframe navigations.
     *
     * This will be called when the WebView's needs to know whether to navigate
     * to a new page. Return false to block the navigation: if any plugin
     * returns false, Cordova will block the navigation. If all plugins return
     * null, the default policy will be enforced. It at least one plugin returns
     * true, and no plugins return false, then the navigation will proceed.
     */
    shouldAllowNavigation(url) {
        return undefined;
    }
}

module.exports = Plugin;