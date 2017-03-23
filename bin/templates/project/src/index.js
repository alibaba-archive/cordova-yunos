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

let lang = require('caf/core/lang');
let page = require('caf/page');
let path = require('path');
let configHelper = require('../CordovaLib/ConfigHelper');
let pluginManager = require('../CordovaLib/PluginManager').getInstance();

page.instance.on('create', function() {
    function success(config) {
        // Add default yunos core plugin
        pluginManager.addService('CoreYunOS', 'CordovaLib/CoreYunOSDomono', true);
        // Initialize custom plugins
        let pluginLoader = require('../CordovaLib/PluginLoader');
        pluginLoader.init();
        pluginManager.onCreate();
        // Load the content path with Domono mode
        let href = config.contentPath || 'index.html';
        page.window.href = path.join('res', 'asset', href);
    }
    function error(msg) {
        console.log('Failed to get content src:');
        console.log(msg);
    }
    configHelper.readConfig(success, error);
});

// The event is fired when the page instance is started.
page.instance.on('start', function() {
    pluginManager.onStart();
});

// The event is fired when the page instance is stoped.
page.instance.on('stop', function() {
    pluginManager.onStop();
});

// The method is called when the page instance receives message from other pages.
page.instance.on('link', function(link) {
    pluginManager.onLink(link);
});

// The event is fired when the page instance is destroyed.
page.instance.on('destroy', function() {
    pluginManager.onDestroy();
});

// The event is fired when the page instance is shown.
page.window.on('show', function() {
    pluginManager.onShow();
});

// The event is fired when the page instance is hidden.
page.window.on('hide', function() {
    pluginManager.onHide();
});

// The event is fired when the page instance is requested to trim memory.
page.window.on('trimMemory', function() {
    pluginManager.onTrimMemory();
});
