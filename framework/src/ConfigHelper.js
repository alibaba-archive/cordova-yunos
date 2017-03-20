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

    let XML = require('./utils/jsxml').XML;
    let node = new XML(data);
    this.preferences = loadPreferences(node);
    this.features = loadFeatures(node);
    this.contentPath = loadContentPath(node);
}

/**
 * Reads a preference value from config.xml.
 * Returns preference value or undefined if it does not exist.
 * @param {String} preferenceName Preference name to read */
Config.prototype.getPreferenceValue = function getPreferenceValue(preferenceName) {
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
    return '';
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
            error(e);
            return;
        }
        success(config);
    } else {
        error('config.xml not founded!');
    }
}

exports.readConfig = readConfig;