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

var gTaskIndex = 0;

// A class for callers want to execute a asynchronous task.
// The task's body is a *.js source file, and callers can transfer
// its paramters to the source file and callback function object
// Uses this class such as below:
// @example
// var Task = require('Task');
// var task = new Task();
// task.source = "decode.js";
// task.parameters = ["src.bmp", "dest.png"];
// task.callback = function(result) { console.log(result.code)};
// var WorkerPool = require('WorkerPool');
// WorkerPool.getInstance().exec(task);
class Task {
    // Construct a task object from a serialize string
    // This string is necessary in the case of transfered from worker
    // Otherwise the string is default optional
    constructor(task) {
        if (!task) {
            // Undefined fields are:
            // this._source
            // this._callback
            // this._parameters
            // this._result
            this._id = ++gTaskIndex;
            return;
        }

        // Must read the raw prototype
        this._id = task._id;
        this._result = task._result;
        this._source = task._source;
        this._parameters = task._parameters;
    }

    set callback(cb) {
        this._callback = cb;
    }

    complete() {
        this._callback(this._result);
    }

    fail() {
        // Could add some error codes in future
        this._callback();
    }

    // This id is used to match between main thread and worker
    get id() {
        return this._id;
    }

    // Support input parameters which is a Array object
    set parameters(parameters) {
        this._parameters = parameters;
    }

    get result() {
        return this._result;
    }

    set result(result) {
        this._result = result;
    }

    run() {
        var exec = require(this._source);
        this._result = exec(this._parameters);
    }

    get source() {
        return this._source;
    }

    set source(path) {
        this._source = path;
    }
}

module.exports = Task;
