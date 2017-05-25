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
const Url = require('url');
const TAG = 'WhiteListPattern';

class URLPattern {
    constructor(schema, host, port, path) {
        if (schema === undefined || '*' === schema) {
            this.schema = undefined;
        } else {
            let regex = this.regexFromPattern(schema, false);
            this.schema = new RegExp(regex, 'i');
        }
        if (host === undefined || '*' === host) {
            this.host = undefined;
        } else if (host.startsWith('*.')) {
            let regex = '([a-z0-9.-]*\\.)?' + this.regexFromPattern(host.substr(2), false);
            this.host = new RegExp(regex, 'i');
        } else {
            let regex = this.regexFromPattern(host, false);
            this.host = new RegExp(regex, 'i');
        }
        if (port === undefined || "*" === port) {
            this.port = undefined;
        } else {
            this.port = Number(port);
        }
        if (path === undefined || "/*" === path) {
            this.path = undefined;
        } else {
            let regex = this.regexFromPattern(path, true);
            this.path = new RegExp(regex);
        }
    }

    regexFromPattern(pattern, allowWidcard) {
        let toReplace = '\\.[]{}()^$?+|';
        let regex = '';
        for (let i=0; i<pattern.length; i++) {
            let char = pattern.charAt(i);
            if (char === '*' && allowWidcard) {
                regex += '.';
            } else if (toReplace.indexOf(char) > -1){
                regex += '\\';
            }
            regex += char;
        }
        return regex;
    }

    matches(url) {
        let urlObj = Url.parse(url);
        let schema = urlObj.protocol;
        let host = urlObj.hostname;
        let port = urlObj.port;
        let path = urlObj.path;

        try {
            return (this.schema === undefined || this.schema.test(schema)) &&
                   (this.host === undefined || this.host.test(host)) &&
                   (this.port === undefined || this.port === port) &&
                   (this.path === undefined || this.path.test(path));
        } catch( e ) {
            Log.E(TAG, 'Exception to check url: ' + e);
        }
        return false;
    }
}

class WhiteListPattern {
    constructor() {
        this._patterns = [];
    }

    addWhiteListEntry(patternStr) {
        if (this._patterns === undefined) {
            return;
        }
        if (patternStr === '*') {
            Log.D(TAG, 'Unlimited access to network resources');
            this._patterns = undefined;
            return;
        }
        let regex = new RegExp('^(([*A-Za-z-]+):(\/\/)?)?(((([*A-Za-z-]+)\.\*)?[^\*/:]+))?(:(\d+))?(\/.*)?');
        let matches = regex.exec(patternStr);
        if (matches === undefined || matches.length != 11) {
            Log.E(TAG, 'Failed to parse patternStr: ' + patternStr);
            return;
        }
        let schema = matches[2];
        let host = matches[4];
        let port = matches[8];
        let path = matches[9];
        if (schema === null) {
            let pattern = new URLPattern('http', host, port, path);
            this._patterns.push(pattern);
            pattern = new URLPattern('https', host, port, path);
            this._patterns.push(pattern);
        } else {
            let pattern = new URLPattern(schema, host, port, path);
            this._patterns.push(pattern);
        }
    }

    isUrlWhiteListed(url) {
        if (this._patterns === undefined) {
            return true;
        }

        for (let i=0; i<this._patterns.length; i++) {
            let pattern = this._patterns[i];
            if (pattern.matches(url)) {
                return true;
            }
        }
        return false;
    }
}

module.exports = WhiteListPattern;

