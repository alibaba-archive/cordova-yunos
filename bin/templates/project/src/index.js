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

const Page = require('caf/page');
const Path = require('path');
const ConfigHelper = require('../CordovaLib/ConfigHelper');
const pluginManager = require('../CordovaLib/PluginManager').getInstance();
const Log = require('../CordovaLib/Log');

Page.instance.on('create', function() {
    function success(config) {
        // Set config to PluginManager
        pluginManager.config = config;
        // Set page to PluginManager
        pluginManager.page = Page.instance;
        // Set log name and level
        Log.setLogLevel(config.name, config.getPreferenceValue('LogLevel'));
        // Add default yunos core plugin
        pluginManager.addService('CoreYunOS', 'CordovaLib/CoreYunOSDomono', true);
        // Initialize custom plugins
        const PluginLoader = require('../CordovaLib/PluginLoader');
        PluginLoader.init();
        pluginManager.onCreate();
        // Load the content path with Domono mode
        let href = config.contentPath || 'index.html';
        Page.window.href = Path.join('res', 'asset', href);
    }
    function error(msg) {
        console.log('Failed to get content src:');
        console.log(msg);
    }
    ConfigHelper.readConfig(success, error);
});

// The event is fired when the page instance is started.
Page.instance.on('start', function() {
    pluginManager.onStart();
});

// The event is fired when the page instance is stoped.
Page.instance.on('stop', function() {
    pluginManager.onStop();
});

// The method is called when the page instance receives message from other pages.
Page.instance.on('link', function(link) {
    pluginManager.onLink(link);
});

// The event is fired when the page instance is destroyed.
Page.instance.on('destroy', function() {
    pluginManager.onDestroy();
});

// The event is fired when the page instance is shown.
Page.window.on('show', function() {
    pluginManager.onShow();
});

// The event is fired when the page instance is hidden.
Page.window.on('hide', function() {
    pluginManager.onHide();
});

// The event is fired when the page instance is requested to trim memory.
Page.window.on('trimMemory', function() {
    pluginManager.onTrimMemory();
});
