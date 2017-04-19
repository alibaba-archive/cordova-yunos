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

const pluginManager = require('../CordovaLib/PluginManager').getInstance();
const ConfigHelper = require('../CordovaLib/ConfigHelper');
const H5Page = require('yunos/page/H5Page');
const Log = require('../CordovaLib/Log');
const Path = require('path');

class CordovaEmbedded extends H5Page {
    onCreate() {
        super.onCreate();
        let self = this;
        function success(config) {
            // Set config to PluginManager
            pluginManager.config = config;
            // Set page to PluginManager
            pluginManager.page = self;
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
            self.url = Path.join('res', 'asset', href);
        }
        function error(msg) {
            console.log('Failed to get content src:');
            console.log(msg);
        }
        ConfigHelper.readConfig(success, error);
    }

    // The event is fired when the page instance is started.
    onStart() {
        super.onStart();
        pluginManager.onStart();
    }

    // The event is fired when the page instance is stoped.
    onStop() {
        super.onStop();
        pluginManager.onStop();
    }

    // The method is called when the page instance receives message from other pages.
    onLink(link) {
        super.onLink(link);
        pluginManager.onLink(link);
    }

    // The event is fired when the page instance is destroyed.
    onDestroy() {
        super.onDestroy();
        pluginManager.onDestroy();
    }

    // The event is fired when the page instance is shown.
    onShow() {
        super.onShow();
        pluginManager.onShow();
    }

    // The event is fired when the page instance is hidden.
    onHide() {
        super.onHide();
        pluginManager.onHide();
    }

    // The event is fired when the page instance is requested to trim memory.
    trimMemory() {
        super.trimMemory();
        pluginManager.onTrimMemory();
    }
}

module.exports = CordovaEmbedded;
