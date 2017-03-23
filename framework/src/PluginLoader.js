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
const configHelper = require('./ConfigHelper');
const pluginManager = require('./PluginManager').getInstance();
const Log = require('./Log');
const TAG = 'PluginLoader';

module.exports = {
    init: function() {
        Log.V(TAG, 'Start loading plugins');
        function error(err) {
        }
        function success(config) {
            Log.V(TAG, 'Read config.xml succeed, start parsing:');
            let features = config.features || [];
            features.forEach(function(feature) {
                let service = feature.name;
                let path = '';
                let onload = false;
                let params = feature.params || [];
                params.forEach(function(param) {
                    let paramName = param.name;
                    if (paramName === 'yunos-package') {
                        path = param.value;
                    } else if (paramName === 'onload') {
                        onload = param.value === 'true'? true : false;
                    }
                });
                Log.V(TAG, 'Found Plugin:', 'name=' + service, 'path=' + path,
                        'onload=' + onload);
                pluginManager.addService(service, path, onload);
            });
            pluginManager.init();
        }
        configHelper.readConfig(success, error);
    }
};