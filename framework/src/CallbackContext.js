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

const PluginResult = require('./PluginResult');

class CallbackContext {
    constructor(callbackId) {
        this._callbackId = callbackId;
        this._keepCallback = false;
    }

    success(retValue) {
        let pluginResult = new PluginResult(PluginResult.Status.OK, retValue);
        pluginResult.keepCallback = this._keepCallback;
        this.sendPluginResult(pluginResult);
    }

    error(errorMsg) {
        let pluginResult = new PluginResult(PluginResult.Status.ERROR, errorMsg);
        pluginResult.keepCallback = this._keepCallback;
        this.sendPluginResult(pluginResult);
    }

    set keepCallback(keep) {
        this._keepCallback = keep;
    }

    get keepCallback() {
        return this._keepCallback;
    }

    get callbackId() {
        return this._callbackId;
    }

    sendPluginResult(result) {
        const PluginManager = require('./PluginManager');
        return PluginManager.getInstance().sendPluginResult(result, this._callbackId);
    }
}

module.exports = CallbackContext;
