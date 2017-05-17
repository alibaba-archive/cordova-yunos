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

const AudioManager = require("yunos/device/AudioManager");
const Page = require('yunos/page/Page');

const Log = require('../CordovaLib/Log');
const Plugin = require('./Plugin');
const PluginResult = require('./PluginResult');
const WhiteList = require('./WhiteList');

const TAG = 'CoreYunOS';

class CoreYunOS extends Plugin {
    constructor() {
        super();
        this._messageChannel = null;
        this._boundVolumeUp = false;
        this._boundVolumeDown = false;
    }

    initialize() {
        super.initialize();
        this._whiteList = new WhiteList(this.config);
        this.initVolumeType();
    }

    initVolumeType() {
        let volumeType = this.config.getPreferenceValue('DefaultVolumeStream', '');
        volumeType = volumeType.toLocaleLowerCase();
        Log.V(TAG, 'volumeType = ', volumeType);
        if (volumeType === 'media') {
            this._audioStreamType = this.page.adjustableAudioStreamType = Page.AdjustableAudioStreamType.AUDIO_STREAM_MUSIC;
        } else {
            this._audioStreamType = this.page.adjustableAudioStreamType = Page.AdjustableAudioStreamType.AUDIO_STREAM_VOICE_CALL;
        }
        this._boundVolumeDown = false;
        this._boundVolumeUp = false;
    }

    adjustStreamVolunme(key) {
        const {StreamType} = AudioManager;
        const {FLAG_SHOW_UI} = AudioManager.AdjustFlag;
        const {ADJUST_LOWER, ADJUST_RAISE} = AudioManager.AdjustDirection;
        let amInstance = AudioManager.getInstance();
        let direction = null;
        if (key === CoreYunOS.VOLUME_UP) {
            direction = ADJUST_RAISE;
        } else if (key === CoreYunOS.VOLUME_DOWN) {
            direction = ADJUST_LOWER;
        }
        if (direction !== null) {
            amInstance.adjustStreamVolume(StreamType[this._audioStreamType], direction, FLAG_SHOW_UI);
        }
    }

    // This function will take the control of volume button.
    bindVolumeButton() {
        // Own volume button control from system.
        if (this.page.adjustableAudioStreamType === null) {
            Log.D(TAG, 'Volume button already controlled by app');
            return;
        }
        this.page.adjustableAudioStreamType = null;
        this.page.window.on('keydown', (e)=> {
            let direction = null;
            Log.D(TAG, 'keydown: ', e.code, 'boundVolumeUp:', this._boundVolumeUp, 'boundVolumeDown', this._boundVolumeDown);
            switch(e.code) {
                case 'VolumeUp':
                    if (this._boundVolumeUp === true) {
                        this.webview.dispatchKeyEventToDOM(CoreYunOS.VOLUME_UP);
                    } else {
                        this.adjustStreamVolunme(CoreYunOS.VOLUME_UP);
                    }
                    e.preventDefault();
                    break;
                case 'VolumeDown':
                    if (this._boundVolumeDown === true) {
                        this.webview.dispatchKeyEventToDOM(CoreYunOS.VOLUME_DOWN);
                    } else {
                        this.adjustStreamVolunme(CoreYunOS.VOLUME_DOWN);
                    }
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        });
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

    // Only volume button allowed
    overrideButton(callbackContext, args) {
        if (args.length !== 2) {
            Log.E(TAG, 'overrideBackbutton argument error: ', args);
            return;
        }
        let button = args[0];
        let override = args[1];
        let key = null;
        if (button === 'volumeup') {
            key = CoreYunOS.VOLUME_UP;
            this._boundVolumeUp = override;
        } else if (button === 'volumedown') {
            key = CoreYunOS.VOLUME_DOWN;
            this._boundVolumeDown = override;
        }
        if (key !== null) {
            if (override === true) {
                this.bindVolumeButton();
            } else {
                // When no volume button bound in DOM, give up the volume control.
                if (this._boundVolumeUp === false &&
                    this._boundVolumeDown === false) {
                    this.initVolumeType();
                }
            }
        }
        this.webview.setButtonPlumbedToJs(key, override);
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

    onReset() {
        this.webview.clearBoundButtons();
        this.initVolumeType();
    }
}

CoreYunOS.BACK_BUTTON = 'backbutton';
CoreYunOS.VOLUME_UP = 'volumeupbutton';
CoreYunOS.VOLUME_DOWN = 'volumedownbutton';

module.exports = CoreYunOS;

