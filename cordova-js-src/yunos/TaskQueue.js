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

var resolvedPromise = typeof Promise === 'undefined' ? null : Promise.resolve();
var nextTick = resolvedPromise ? function(fn) { resolvedPromise.then(fn); } : function(fn) { setTimeout(fn); };

// Use a array to store the runnables to execute
var gTasks = [];
var gIsRunning = false;

function pollingOnce() {
    if (gTasks.length === 0) {
        gIsRunning = false;
        return;
    }

    var task = gTasks.shift();
    task._callback.apply(null, task._args);

    nextTick(pollingOnce);
}

// Fire a timer if the timer is not running
function start() {
    if (gIsRunning) {
        return;
    }
    nextTick(pollingOnce);
    gIsRunning = true;
}

function Task() {
    // At leaset has a function for Task
    if (arguments.length === 0) {
        return;
    }

    var args = Array.prototype.slice.call(arguments);
    this._callback = args[0];
    // Pop the function
    args.shift();
    this._args = args;
}

function post(task) {
    if (task instanceof Task === false) {
        return false;
    }

    gTasks.push(task);
    start();
    return true;
};

module.exports = {
    Task: Task,
    post: post
};
