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
let lang = require('caf/core/lang');
let CallbackContext = require('./CallbackContext');
let HashMap = require('./HashMap');
let Path = require ('path');
let PluginResult = require('./PluginResult');

function Entry(path, run) {
    this.path = path;
    this.run = run;
}

let pluginModulePath = Path.join(__dirname, 'Plugin');

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

        if (path.slice(0, 2) === ':/') {
            return _require(main, './' + path.slice(2));
        } else if (path == 'Plugin') {
            return _require(main, pluginModulePath);
        }

        return _require(this, path);
    };
}

function instantiatePlugin(path) {
    console.log('Instantiate Plugin: ' + path);
    let plugin = null;
    try {
        // As plugin path start with src, need add ../ prefix.
        path = '../' + path;
        let Plugin = require(path);
        plugin = new Plugin();
    } catch (e) {
        console.log('Filed to Instantiate ' + path + ': ' + e);
    }
    return plugin;
}

// TODO:
// Use RendererIPC to send/receive message between renderer.
let PluginManager = lang.create({
    constructor: function() {
        // Plugin service name and instance map
        this._pluginMap = new HashMap();
        // Plugin service name and path map
        this._entryMap = new HashMap();

        this._retMsgListener = null;
        hookRequire();
        // TODO:
        // Register RendererIPC message receiver.
    },

    exec: function(service, action, callbackId, args) {
        let plugin = this.getPlugin(service);
        let callbackContext = new CallbackContext(callbackId);
        if (plugin === null) {
            let result = new PluginResult(PluginResult.Status.CLASS_NOT_FOUND_EXCEPTION);
            callbackContext.sendPluginResult(result);
            return;
        }
        try {
            let wasValidAction = plugin.execute(action, callbackContext, args);
            if (!wasValidAction) {
                let result = new PluginResult(PluginResult.Status.INVALID_ACTION);
                callbackContext.sendPluginResult(result);
            }
        } catch (e) {
            console.error('Invalid action:' + service + '+' + action);
        }
    },

    addService: function(service, path, run) {
        let entry = new Entry(path, run);
        this._entryMap.put(service, entry);
    },

    getPlugin: function(service) {
        let plugin = this._pluginMap.get(service);
        if (plugin === null) {
            let entry = this._entryMap.get(service);
            if (entry === null) {
                return null;
            }
            plugin = instantiatePlugin(entry.path);
            plugin.initialize(service);
            if (plugin !== null) {
                this._pluginMap.put(service, plugin);
            }
        }
        return plugin;
    },

    registerMsgListener: function(listener) {
        if (this._retMsgListener !== null) {
            console.error('PluginManager: Message listener has been reset');
        }
        this._retMsgListener = listener;
    },

    sendPluginResult: function(result, callbackId) {
        // TODO:
        // 1. Use message queue
        // 2. For webview mode, Encode result as json string.
        // 3. Send result via RendererIPC
        if (this._retMsgListener === null) {
            console.error('No Message Listener registered');
            return;
        }
        this._retMsgListener(result, callbackId);
    },
});

let sInstance = null;

let getInstance = function() {
    if (!sInstance) {
        sInstance = new PluginManager();
    }
    return sInstance;
};

module.exports.getInstance = getInstance;