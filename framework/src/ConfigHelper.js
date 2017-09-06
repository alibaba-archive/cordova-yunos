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

var config;
const Log = require('./Log');
const TAG = 'ConfigHelper';

function Config(data) {
    function loadPreferences(node) {
        let preferences = node.elements('preference');
        return preferences;
    }

    function loadFeatures(node) {
        let featureArray = [];
        let features = node.elements('feature');
        features.each(function(feature) {
            let featureValue = {'name':'', 'params':[]};
            featureValue.name = feature.attribute('name').toString();
            let params = feature.elements('param');
            params.each(function(param) {
                let value = {'name':'', 'value':''};
                value.name = param.attribute('name').toString();
                value.value = param.attribute('value').toString();
                featureValue.params.push(value);
            });
            featureArray.push(featureValue);
        });
        return featureArray;
    }

    function loadContentPath(node) {
        let contents = node.elements('content');
        let src;
        contents.each(function(content) {
            src = content.attribute('src').toString();
        });
        return src;
    }

    function loadName(node) {
        let names = node.elements('name');
        let retName;
        names.each(function(name) {
            retName = name;
        });
        return retName;
    }

    function loadPackage(node) {
        let id = node.attribute('id').toString();
        return id;
    }

    function loadAllowNavigations(node) {
        let allowedNavigations = [];
        // contents
        let list = node.elements('content');
        list.each(function(elem) {
            let src = elem.attribute('src').toString().toLowerCase();
            allowedNavigations.push(src);
        });
        // allow-navigation
        list = node.elements('allow-navigation');
        list.each(function(elem) {
            let href = elem.attribute('href').toString().toLowerCase();
            if (href === '*') {
                allowedNavigations.push('http://*/*');
                allowedNavigations.push('https://*/*');
                allowedNavigations.push('data:*');
            } else {
                allowedNavigations.push(href);
            }
        });
        return allowedNavigations;
    }

    function loadAllowIntents(node) {
        let allowedIntents = [];
        let list = node.elements('allow-intent');
        list.each(function(elem) {
            let href = elem.attribute('href').toString().toLowerCase();
            allowedIntents.push(href);
        });
        return allowedIntents;
    }

    function loadAllowRequests(node) {
        let allowedRequests = [];
        let list = node.elements('access');
        list.each(function(elem) {
            let origin = elem.attribute('origin').toString().toLowerCase();
            if (origin === '*') {
                allowedRequests.push('http://*/*');
                allowedRequests.push('https://*/*');
            } else {
                allowedRequests.push(origin);
            }
        });
        return allowedRequests;
    }
    let XML = require('./utils/jsxml').XML;
    let node = new XML(data);
    this.preferences = loadPreferences(node);
    this.features = loadFeatures(node);
    this.contentPath = loadContentPath(node);
    this.name = loadName(node);
    this.package = loadPackage(node);
    this.allowedNavigations = loadAllowNavigations(node);
    this.allowedIntents = loadAllowIntents(node);
    this.allowedRequests = loadAllowRequests(node);
}

/**
 * Reads a preference value from config.xml.
 * Returns preference value or undefined if it does not exist.
 * @param {String} preferenceName Preference name to read */
Config.prototype.getPreferenceValue = function getPreferenceValue(preferenceName, defaultValue) {
    preferenceName = preferenceName.toLowerCase();
    let list = [];
    this.preferences.each(function(elem) {
        let name = elem.attribute('name').toString().toLowerCase();
        if (name == preferenceName) {
            list.push(elem.attribute('value').toString());
        }
    });
    if(list.length > 0) {
        return list[0];
    }
    return defaultValue;
};

function readConfig(success, error) {
    let xhr;

    if(typeof config != 'undefined') {
        success(config);
        return;
    }

    let fs = require('fs');
    let path = require('path');
    let configPath = path.resolve(__dirname, '../res/default/config.xml');
    let data = fs.readFileSync(configPath, 'utf-8');
    if (data !== null) {
        try {
            config = new Config(data);
        } catch (e) {
            Log.E(TAG, 'Failed to read config.xml error:' + e);
            error(e);
            return;
        }
        success(config);
    } else {
        const errStr = 'config.xml not founded';
        Log.E(TAG, errStr);
        error(errStr);
    }
}

exports.readConfig = readConfig;
