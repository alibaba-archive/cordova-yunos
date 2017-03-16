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

// Workaround for yunos.require relative path
function modulePath(path) {
    var pathname = location.pathname;
    var index = pathname.indexOf('/res/');
    var modulePath = '';
    if (index != -1) {
        var basePath = pathname.substr(0, index);
        var Path = yunos.require('path');
        modulePath = Path.join(basePath, path);
        modulePath = 'page:/' + modulePath;
    }
    return modulePath;
}

// TODO:
// To support agil-webview usage, we need re-implement send and init metnod, and do not
// use PluginManager directly, use IPC message instead.

module.exports = {
    pluginManager: undefined,
    onBrowserMessageReceived: undefined,
    send: function(service, action, callbackId, args) {
        // TODO:
        // Use WebViewPrivate IPC instead.
        pluginManager.exec(service, action, callbackId, args);
    },
    init: function() {
        // TODO:
        // Register IPC listener from WebViewPrivate
        // Use WebViewPrivate IPC message to send init message to PluginManager
        try {
            pluginManager = yunos.require(modulePath('CordovaLib/PluginManager')).getInstance();
            pluginManager.registerMsgListener(this.onBrowserMessageReceived);
        } catch(e) {
            console.log('Failed to init Domono bridge proxy'+ '::stack trace=' + e.stack);
        }
    }
};
