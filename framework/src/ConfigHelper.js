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
        var preferences = node.elements('preference');
        return preferences;
    }
    function loadFeatures(node) {
        var featureArray = [];
        var features = node.elements('feature');
        features.each(function(feature) {
            var featureValue = {'name':'', 'params':[]};
            featureValue.name = feature.attribute('name').toString();
            var params = feature.elements('param');
            params.each(function(param) {
                var value = {'name':'', 'value':''};
                value.name = param.attribute('name').toString();
                value.value = param.attribute('value').toString();
                featureValue.params.push(value);
            });
            featureArray.push(featureValue);
        });
        return featureArray;
    }

    try {
        var XML = require('./jsxml').XML;
        var node = new XML(data);
        this.preferences = loadPreferences(node);
        this.features = loadFeatures(node);
    } catch(err) {
        console.error(err);
    }
}

/**
 * Reads a preference value from config.xml.
 * Returns preference value or undefined if it does not exist.
 * @param {String} preferenceName Preference name to read */
Config.prototype.getPreferenceValue = function getPreferenceValue(preferenceName) {
    preferenceName = preferenceName.toLowerCase();
    var list = [];
    this.preferences.each(function(elem) {
        var name = elem.attribute('name').toString().toLowerCase();
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
    var xhr;

    if(typeof config != 'undefined') {
        success(config);
        return;
    }

    var fs = require('fs');
    var path = require('path');
    var configPath = path.resolve(__dirname, '../res/default/config.xml');
    var data = fs.readFileSync(configPath, "utf-8");
    if (data !== null) {
        config = new Config(data);
        success(config);
    }
}

exports.readConfig = readConfig;
