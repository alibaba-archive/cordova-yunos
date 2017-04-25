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
                console.log('Call action:' + action + ' failed with error:' + e);
                return false;
            }
        } else {
            console.error('No action:' + action + ' founded in ' + this._serviceName);
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
}

module.exports = Plugin;