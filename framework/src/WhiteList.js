/**
 * Copyright (C) 2010-2017 Alibaba Group Holding Limited
 */

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

const Log = require('../CordovaLib/Log');
const TAG = 'WhiteList';

let WhiteListPattern = require('./WhiteListPattern');

class WhiteList {
    constructor(config) {
        this._config = config;

        this._allowedNavigations = new WhiteListPattern();
        this._allowedIntents = new WhiteListPattern();
        this._allowedRequests = new WhiteListPattern();

        this.initWhitlistPattern();
    }

    initWhitlistPattern() {
        // allowed navigations
        for (let i in this._config.allowedNavigations) {
            let pattern = this._config.allowedNavigations[i];
            this._allowedNavigations.addWhiteListEntry(pattern);
        }

        // allowed intents
        for (let i in this._config.allowedIntents) {
            let pattern = this._config.allowedIntents[i];
            this._allowedIntents.addWhiteListEntry(pattern);
        }

        // allowed requests
        for (let i in this._config.allowedRequests) {
            let pattern = this._config.allowedRequests[i];
            this._allowedRequests.addWhiteListEntry(pattern);
        }
    }

    shouldAllowNavigation(url) {
        if (this._allowedNavigations.isUrlWhiteListed(url)) {
            return true;
        }
        return undefined; // Default policy
    }

    shouldAllowRequest(url) {
        if (this.shouldAllowNavigation(url) === true) {
            return true;
        }
        if (this._allowedRequests.isUrlWhiteListed(url)) {
            return true;
        }
        return undefined; // Default policy
    }

    shouldOpenExternalUrl(url) {
        if (this._allowedIntents.isUrlWhiteListed(url)) {
            return true;
        }
        return undefined; // Default policy
    }
}

module.exports = WhiteList;

