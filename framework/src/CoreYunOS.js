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

const Plugin = require('./Plugin');
const WhiteList = require('./WhiteList');

class CoreYunOS extends Plugin {
    constructor() {
        super();
    }

    initialize() {
        super.initialize();
        this._whiteList = new WhiteList(this.config);
    }

    shouldAllowRequest(url) {
        return this._whiteList.shouldAllowRequest(url);
    }

    shouldAllowNavigation(url) {
        return this._whiteList.shouldAllowNavigation(url);
    }

    shouldOpenExternalUrl(url) {
        return this._whiteList.shouldOpenExternalUrl(url);
    }
}

module.exports = CoreYunOS;

