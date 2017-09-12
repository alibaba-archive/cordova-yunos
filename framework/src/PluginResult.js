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

const Log = require('./Log');
const TAG = 'PluginResult';

const Status = {
    NO_RESULT: 0,
    OK: 1,
    CLASS_NOT_FOUND_EXCEPTION: 2,
    ILLEGAL_ACCESS_EXCEPTION: 3,
    INSTANTIATION_EXCEPTION: 4,
    MALFORMED_URL_EXCEPTION: 5,
    IO_EXCEPTION: 6,
    INVALID_ACTION: 7,
    JSON_EXCEPTION: 8,
    ERROR: 9
};

const MessageType = {
    MESSAGE_TYPE_ARRAYBUFFER: 1,
    MESSAGE_TYPE_STRING:2
};

class PluginResult {
    constructor(status_, retValue_) {
        // If retValue_ is string, revert it as base64 format to avoid some reserved
        // characters cann't be recognized when json parses it.
        let Buffer = require('buffer').Buffer;
        if (retValue_ instanceof Buffer || retValue_ instanceof ArrayBuffer|| typeof retValue_ === 'string') {
            this.messageType = (retValue_ instanceof Buffer || retValue_ instanceof ArrayBuffer)?
                MessageType.MESSAGE_TYPE_ARRAYBUFFER: MessageType.MESSAGE_TYPE_STRING;
            let buffer = new Buffer(retValue_);
            retValue_ = buffer.toString('base64');
        }
        this.status = status_;
        this.retValue = retValue_;
        this.keepCallback = false;
    }

    toString() {
        let retStr = '';
        try {
            retStr = JSON.stringify(this);
        } catch (e) {
            Log.E(TAG, 'Failed to convert PluginResult to JSON string.');
            Log.E(TAG, e);
        }
        return retStr;
    }
}

module.exports = PluginResult;
module.exports.Status = Status;
