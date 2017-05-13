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
const CallbackContext = require('./CallbackContext');
const HashMap = require('./utils/HashMap');
const Log = require('./Log');
const Path = require ('path');
const PluginResult = require('./PluginResult');
const TAG = 'PluginManager';

function Entry(path, onload) {
    this.path = path;
    this.onload = onload;
}

let pluginModulePath = Path.join(__dirname, 'Plugin');
let logModulePath = Path.join(__dirname, 'Log');
let workerBasePath = Path.join(__dirname, 'worker');

// TODO:
// Hook node module require
// This hooked require will handle Plugin module, when Plugin is build-in into system,
// no need this hook anymore.
function hookRequire() {
    let Module = require('module');
    let assert = require('assert');

    var origRequire = Module.prototype.require;
    let _require = function(context, path) {
        return origRequire.call(context, path);
    };

    let main = require.main;

    Module.prototype.require = function(path) {
        assert(typeof path === 'string', 'path must be a string');
        assert(path, 'missing path');

        if (path === 'Plugin') {
            return _require(main, pluginModulePath);
        } else if (path === 'Log') {
            return _require(main, logModulePath);
        } else if (path === 'WorkerPool' || path === 'Task') {
            return _require(main, Path.join(workerBasePath, path));
        }
        return _require(this, path);
    };
}

function instantiatePlugin(path) {
    Log.V(TAG, 'Instantiate Plugin: ' + path);
    let plugin = null;
    try {
        // As plugin path start with src, need add ../ prefix.
        path = '../' + path;
        let Plugin = require(path);
        plugin = new Plugin();
    } catch (e) {
        Log.E(TAG, 'Failed to Instantiate ' + path + ': ' + e);
    }
    return plugin;
}

class PluginManager {
    static getInstance() {
        if (!this.instance) {
            this.instance = new PluginManager();
        }
        return this.instance;
    }

    constructor() {
        Log.V(TAG, 'Constructor called');
        // Plugin service name and instance map
        this._pluginMap = new HashMap();
        // Plugin service name and path map
        this._entryMap = new HashMap();
        this._retMsgListener = null;
        this._config = null;
        this._page = null;
        hookRequire();
    }

    // Init PluginManager when load new web page.
    init() {
        Log.V(TAG, 'Init plugins');
        // Send onStop and onDestroy event to plugins.
        this.onStop();
        this.onDestroy();
        // Clear plugin instances
        this._pluginMap.clear();
        this.startupPlugins();
    }

    // Create plugins objects that have onload set.
    startupPlugins() {
        let keys = this._entryMap.keySet();
        Log.D(TAG, 'Start load startup plugins');
        keys.forEach(function(key) {
            var entry = this._entryMap.get(key);
            if (entry !== null && entry.onload === true) {
                Log.D(TAG, 'Load Plugin:', entry.path);
                this.getPlugin(key);
            }
        }.bind(this));
        Log.D(TAG, 'End load startup plugins');
    }

    exec(service, action, callbackId, args) {
        Log.D(TAG, 'exec:', service, action, callbackId, args);
        let plugin = this.getPlugin(service);
        let callbackContext = new CallbackContext(callbackId);
        if (plugin === null) {
            Log.E(TAG, 'Plugin', service, 'not founded');
            let result = new PluginResult(PluginResult.Status.CLASS_NOT_FOUND_EXCEPTION);
            callbackContext.sendPluginResult(result);
            return;
        }
        try {
            let wasValidAction = plugin.execute(action, callbackContext, args);
            if (!wasValidAction) {
                Log.E(TAG, 'Invalid Action');
                let result = new PluginResult(PluginResult.Status.INVALID_ACTION);
                callbackContext.sendPluginResult(result);
            }
        } catch (e) {
            Log.E(TAG, 'Invalid action:' + service + '+' + action);
        }
    }

    addService(service, path, onload) {
        Log.V(TAG, 'Add new plugin:', service, path, onload);
        let entry = new Entry(path, onload);
        this._entryMap.put(service, entry);
    }

    getPlugin(service) {
        let plugin = this._pluginMap.get(service);
        if (plugin === null) {
            let entry = this._entryMap.get(service);
            if (entry === null) {
                return null;
            }
            plugin = instantiatePlugin(entry.path);
            if (plugin !== null) {
                plugin.config = this._config;
                plugin.page = this._page;
                plugin.privateInitialize(service);
                this._pluginMap.put(service, plugin);
            }
        }
        return plugin;
    }

    registerMsgListener(listener) {
        Log.V(TAG, 'Set message listener');
        if (this._retMsgListener !== null) {
            Log.D(TAG, 'Message listener has been reset');
        }
        this._retMsgListener = listener;
    }

    // TODO: Use message queue if needed
    sendPluginResult(result, callbackId) {
        if (this._retMsgListener === null) {
            Log.E(TAG, 'No Message Listener registered');
            return;
        }
        Log.V(TAG, 'Send plugin result for', callbackId);
        this._retMsgListener(result, callbackId);
    }

    shouldAllowRequest(url) {
        let keys = this._pluginMap.keySet();
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let plugin = this._pluginMap.get(key);
            if (plugin !== null) {
                let allowed = plugin.shouldAllowRequest(url);
                if (allowed !== undefined) {
                    Log.V(TAG, 'check shouldAllowRequest:', url, ' for:', key);
                    Log.V(TAG, 'shouldAllowRequest result:', allowed);
                    return allowed;
                }
            }
        }
        Log.D(TAG, 'shouldAllowRequest, use default policy');
        if (typeof url !== 'string') {
            Log.E(TAG, 'shouldAllowRequest url is not string');
            return false;
        }
        // Default policy from cordova-android:
        if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('about:blank')) {
            return true;
        }
        // YunOS policy
        if (url.startsWith('page://')) {
            return true;
        }
        // File schema is not allowed
        if (url.startsWith('file://')) {
            return false;
        }
        return true;
    }

    /**
     * Called when the URL of the webview changes.
     *
     * @param url               The URL that is being changed to.
     * @return                  Return false to allow the URL to load, return true to prevent the URL from loading.
     */
    onOverrideUrlLoading(url) {
        let keys = this._pluginMap.keySet();
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let plugin = this._pluginMap.get(key);
            if (plugin !== null) {
                let override = plugin.onOverrideUrlLoading(url);
                if (override === true) {
                    Log.V(TAG, 'overrideUrlLoading on:', url, ' for:', key);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Called when the webview is going to change the URL of the loaded content.
     *
     * This delegates to the installed plugins, and returns true/false for the
     * first plugin to provide a non-null result.  If no plugins respond, then
     * the default policy is applied.
     *
     * @param url       The URL that is being requested.
     * @return          Returns true to allow the navigation,
     *                  false to block the navigation.
     */
    shouldAllowNavigation(url) {
        let keys = this._pluginMap.keySet();
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let plugin = this._pluginMap.get(key);
            if (plugin !== null) {
                let allowed = plugin.shouldAllowNavigation(url);
                if (allowed !== undefined) {
                    Log.V(TAG, 'shouldAllowNavigation result:', allowed, ' for:' , key);
                    return allowed;
                }
            }
        }

        // Default policy:
        return url.startsWith('file://') || url.startsWith('about:blank') || url.startsWith('page://');
    }

    /**
     * Called when the webview is going not going to navigate, but may launch
     * an Intent for an URL.
     *
     * This delegates to the installed plugins, and returns true/false for the
     * first plugin to provide a non-null result.  If no plugins respond, then
     * the default policy is applied.
     *
     * @param url       The URL that is being requested.
     * @return          Returns true to allow the URL to launch an intent,
     *                  false to block the intent.
     */
    shouldOpenExternalUrl(url) {
        let keys = this._pluginMap.keySet();
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let plugin = this._pluginMap.get(key);
            if (plugin !== null) {
                let allowed = plugin.shouldOpenExternalUrl(url);
                if (allowed !== undefined) {
                    Log.V(TAG, 'shouldOpenExternalUrl result:', allowed, ' for:', key);
                    return allowed;
                }
            }
        }

        // Default policy:
        // External URLs are not allowed
        return false;
    }

    callPluginsEvent(event, args) {
        Log.V(TAG, 'Events:', event, 'received');
        let keys = this._pluginMap.keySet();
        keys.forEach(function(key) {
            let plugin = this._pluginMap.get(key);
            if (plugin !== null) {
                plugin[event].call(plugin, args);
            }
        }.bind(this));
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

    onCreate() {
        this.callPluginsEvent('onCreate');
    }

    onStart() {
        this.callPluginsEvent('onStart');
    }

    onStop() {
        this.callPluginsEvent('onStop');
    }

    onLink(link) {
        this.callPluginsEvent('onLink', link);
    }

    onDestroy() {
        this.callPluginsEvent('onDestroy');
    }

    onShow() {
        this.callPluginsEvent('onShow');
    }

    onHide() {
        this.callPluginsEvent('onHide');
    }

    onTrimMemory() {
        this.callPluginsEvent('onTrimMemory');
    }
}

module.exports = PluginManager;
