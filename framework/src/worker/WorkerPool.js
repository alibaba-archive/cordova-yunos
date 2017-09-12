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
const kWorkerTemplate = 'CordovaLib/worker/Worker.js';
const Log = require('Log');
const TAG = 'WorkerPool';

class WorkerAgent {
    constructor() {
        var worker;
        try {
            var WorkerEx = require('workerex');
            worker = new WorkerEx(kWorkerTemplate);
        } catch (e) {
            Log.E(TAG, 'Create WorkerEx error');
            return;
        }
        worker.onmessage = this.onMessage.bind(this);
        this._worker = worker;
        this._isBusy = false;
    }

    get isBusy() {
        return this._isBusy;
    }

    // Received response from worker
    onMessage(msg) {
        var Task = require('Task');
        var task = new Task(msg.data);
        WorkerPool.getInstance().complete(task);
        this._isBusy = false;
    }

    // Send a message to worker to run a task
    schedule(task) {
        if (!this._worker) {
            Log.E(TAG, "Worker isn't created successfully");
            return false;
        }

        this._worker.postMessage(task);
        this._isBusy = true;
        return true;
    }
}

var resolvedPromise = typeof Promise === 'undefined' ? null : Promise.resolve();
var nextTick = resolvedPromise ? function(fn) { resolvedPromise.then(fn); } : function(fn) { setTimeout(fn); };

// WorkerPool is used to help execute another *.js async in a dedicated worker
class WorkerPool {
    // Get the WorkerPool object which is a singleton
    static getInstance(config) {
        if (!WorkerPool._instance) {
            WorkerPool._instance = new WorkerPool(config);
        }
        return WorkerPool._instance;
    }

    constructor(config) {
        if (config && config.maxWorkers) {
            this._maxWorkerNum = config.maxWorkers;
        } else {
            // The default max workers in pool
            this._maxWorkerNum = 2;
        }
        // Used to store active workers
        this._activeWorkers = [];
        // Used to hold the tasks in tree queue
        // The lifecycle of task is as below:
        // new Task -> _pendingQueue->_runningQueue
        // ->worker execute it ->_completedQueue
        // ->invoke callback -> destory
        this._pendingQueue = [];
        this._runningQueue = [];
        this._completedQueue = [];

        // Used to mark the timer is running
        this._isRunning = false;
    }

    createWorker() {
        var worker = new WorkerAgent();
        // Add to active workers queue
        this._activeWorkers.push(worker);
        return worker;
    }

    complete(task) {
        // Find the actual task in the running queue according the worker id
        var t;
        this._runningQueue.forEach(function(e) {
            if (task.id === e.id) {
                t = e;
            }
        });

        if (t) {
            t.result = task.result;
            var index = this._runningQueue.indexOf(t);
            // Move this task from running queue to complete queue
            this._runningQueue.splice(index, 1);
            this._completedQueue.push(t);
        } else {
            Log.E(TAG, 'Not found the task in running queue of pool, task id: ' + task.id);
        }

        // Finally fire the timer to handle the task
        this.fireTimer();
    }

    // Provide a execute method for callers to put their task
    // and callback handlers into pool
    exec(task) {
        this._pendingQueue.push(task);
        this.fireTimer();
    }

    getAvailableWorker() {
        // Try to get idle worker from pool
        for (let i = 0; i < this._activeWorkers.length; ++i) {
            let e = this._activeWorkers[i];
            if (!e.isBusy) {
                return e;
            }
        }

        // Make sure the workers number lower than max worker number.
        // If current workers are busy, create another new worker
        if (this._activeWorkers.length < this._maxWorkerNum) {
            return this.createWorker();
        }

        Log.D(TAG, 'No available worker in pool now');
        return null;
    }

    pollOnce() {
        // There are no tasks to be handled
        if (this._pendingQueue.length === 0 && this._completedQueue.length === 0) {
            this._isRunning = false;
            return;
        }

        // The task has been processed by worker must have more priority to be handled
        if (this._completedQueue.length > 0) {
            var task = this._completedQueue.shift();
            task.complete();
        } else {
            var worker = this.getAvailableWorker();
            if (!worker) {
                this._isRunning = false;
                return;
            }
            var task = this._pendingQueue.shift();
            this._runningQueue.push(task);
            if (!worker.schedule(task)) {
                task.fail();
            }
        }
        nextTick(this.pollOnce.bind(this));
    }

    fireTimer() {
        if (this._isRunning) {
            return;
        }
        nextTick(this.pollOnce.bind(this));
        this._isRunning = true;
    }
}

module.exports = WorkerPool;
