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

const Log = require('../CordovaLib/Log');
const Plugin = require('./Plugin');
const PluginResult = require('./PluginResult');
const WhiteList = require('./WhiteList');

const TAG = 'CoreYunOS';

class CoreYunOS extends Plugin {
    constructor() {
        super();
        this._messageChannel = null;
    }

    initialize() {
        super.initialize();
        this._whiteList = new WhiteList(this.config);
    }

    shouldAllowRequest(url) {
        return this._whiteList.shouldAllowRequest(url);
    }

    shouldAllowNavigation(url) {
        return this._whiteList.shouldAllowNavigation(url);
    }

    shouldOpenExternalUrl(url) {
        return this._whiteList.shouldOpenExternalUrl(url);
    }

    /*
     * navigator.app Apis
    */
    clearCache() {
        Log.D(TAG, 'clearCache');
        //TODO
    }

    // args [url, prop]
    loadUrl(callbackContext, args) {
        if (args.length !== 2) {
            Log.E(TAG, 'loadUrl args error');
            return false;
        }
        let url = args[0];
        let props = args[1];

        let wait = 0;
        let openExternal = false;
        let clearHistory = false;
        let params = {};
        if (props !== undefined && props !== null) {
            // keyword to lowercase
            let str = JSON.stringify(props);
            props = JSON.parse(str.toLocaleLowerCase());
            // wait
            let tmp = props.wait;
            if (typeof tmp === 'number') {
                wait = tmp;
            }
            // openexternal
            tmp = props.openexternal;
            if (typeof tmp === 'boolean') {
                openExternal = tmp;
            }
            // clearhistory
            tmp = props.clearhistory;
            if (typeof tmp === 'boolean') {
                clearHistory = tmp;
            }
            // loadingDialog
            tmp = props.loadingdialog;
            if (typeof tmp === 'string') {
                Log.W(TAG, 'Loading dialog is not supported');
            }
            // loadUrlTimeoutValue
            tmp = props.loadurltimeoutvalue;
            if (typeof tmp === 'number') {
                params.loadUrlTimeoutValue = tmp;
            }
        }
        setTimeout(()=> {
            this.webview.client.showWebPage(url, openExternal, clearHistory, params);
        }, wait);
    }

    cancelLoadUrl() {
        // Do nothing
    }

    clearHistory() {
        Log.D(TAG, 'Clear history');
        this.webview.history.clear();
    }

    backHistory() {
        Log.D(TAG, 'Back history');
        this.webview.goBack();
    }

    // args: [override]
    overrideBackbutton(callbackContext, args) {
        if (args.length !== 1) {
            Log.E(TAG, 'overrideBackbutton argument error: ', args);
            return;
        }
        this.webview.setButtonPlumbedToJs(CoreYunOS.BACK_BUTTON, args[0]);
    }

    overrideButton(callbackContext, args) {
        //TODO
    }

    exitApp() {
        Log.D(TAG, 'exit App');
        this.page.stopPage();
    }

    messageChannel(callbackContext, args) {
        Log.V(TAG, 'Message channel has been set.');
        this._messageChannel = callbackContext;
    }

    fireDOMEvent(action) {
        if (this._messageChannel === null) {
            Log.E(TAG, 'Failed to get channel');
            return;
        }
        let result = new PluginResult(PluginResult.Status.OK, {'action': action});
        result.keepCallback = true;
        this._messageChannel.sendPluginResult(result);
    }
}

CoreYunOS.BACK_BUTTON = 'backbutton';

module.exports = CoreYunOS;

