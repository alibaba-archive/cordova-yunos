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

const BACK_KEYCODE = 27;

const is_dom_on_node = yunos !== undefined && yunos.require !== undefined;

module.exports = {
    id: 'yunos',

    bootstrap: function() {
        var modulemapper = require('cordova/modulemapper');
        var channel = require('cordova/channel');
        var exec = require('cordova/exec');

        exec.init();

        modulemapper.clobbers('cordova/exec/proxy', 'cordova.commandProxy');

        // Align with android navigator.app plugin
        modulemapper.clobbers('cordova/plugin/yunos/app', 'navigator.app');

        channel.onNativeReady.fire();

        var APP_PLUGIN_NAME = 'CoreYunOS';

        // Inject a listener for the backbutton on the document.
        var backKeyEventListener = function(e) {
            if (e.keyCode == BACK_KEYCODE) {
                cordova.fireDocumentEvent('backbutton');
                e.preventDefault();
            }
        };

        var backButtonChannel = cordova.addDocumentEventHandler('backbutton');
        backButtonChannel.onHasSubscribersChange = function() {
            // If we just attached the first handler or detached the last handler,
            // let native know we need to override the back button.
            var isOverride = this.numHandlers === 1;
            // Register key event in Domono mode.
            // TODO: Receive backbutton event from page in agil-webview mode.
            if (isOverride) {
                if (is_dom_on_node) {
                    document.addEventListener('keyup', backKeyEventListener);
                } else {
                    exec(null, null, APP_PLUGIN_NAME, "overrideBackbutton", [true]);
                }
            } else {
                if (is_dom_on_node) {
                    document.removeEventListener('keyup', backKeyEventListener);
                } else {
                    exec(null, null, APP_PLUGIN_NAME, "overrideBackbutton", [false]);
                }
            }
        };

        // Receive Pause/Resume events from W3C API instead of YunOS Page API.
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                channel.onPause.fire();
            } else {
                channel.onResume.fire();
            }
        }, false);

        channel.onCordovaReady.subscribe(function() {
            exec(onMessageFromNative, null, APP_PLUGIN_NAME, 'messageChannel', []);
        });

    // End of bootstrap
    }
};

function onMessageFromNative(msg) {
    var cordova = require('cordova');
    var action = msg.action;

    switch (action)
    {
        case 'backbutton':
            cordova.fireDocumentEvent(action);
            break;
        default:
            throw new Error('Unknown event action ' + action);
    }
}
