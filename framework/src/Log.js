/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with Log work for additional information
 * regarding copyright ownership.  The ASF licenses Log file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use Log file except in compliance
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

const VERBOSE = 0;
const DEBUG = 1;
const INFO = 2;
const WARN = 3;
const ERROR = 4;

function generateArgs(args) {
    let argsArray = [].slice.call(args);
    let ret = [];
    if (argsArray.length === 0) {
        return [Log.APP_NAME, ''];
    } else if (argsArray.length === 1) {
        return [Log.APP_NAME, argsArray[0]];
    }
    ret.push(Log.APP_NAME + argsArray[0]);
    ret = ret.concat(argsArray.slice(1));
    return ret;
}

class Log {
    static setLogLevel(appName, level) {
        Log.APP_NAME = appName + ':';
        level = level || 'ERROR';
        Log.V('Logger', 'AppName:' + appName);
        Log.V('Logger', 'Level:' + level);
        switch (level) {
            case 'VERBOSE':
                Log.LOG_LEVEL = VERBOSE;
                break;
            case 'DEBUG':
                Log.LOG_LEVEL = DEBUG;
                break;
            case 'INFO':
                Log.LOG_LEVEL = INFO;
                break;
            case 'WARN':
                Log.LOG_LEVEL = WARN;
                break;
            case 'ERROR':
            case '':
                Log.LOG_LEVEL = ERROR;
                break;
            default:
                log.E(Log.APP_NAME, 'Unknown loglevel:' + level);
        }
    }

    static V() {
        if (VERBOSE < Log.LOG_LEVEL) {
            return;
        }
        let args = generateArgs(arguments);
        log.V.apply(this, args);
    }

    static D() {
        if (DEBUG < Log.LOG_LEVEL) {
            return;
        }
        let args = generateArgs(arguments);
        log.D.apply(this, args);
    }

    static I() {
        if (INFO < Log.LOG_LEVEL) {
            return;
        }
        let args = generateArgs(arguments);
        log.I.apply(this, args);
    }

    static W() {
        if (WARN < Log.LOG_LEVEL) {
            return;
        }
        let args = generateArgs(arguments);
        log.W.apply(this, args);
    }

    static E() {
        if (ERROR < Log.LOG_LEVEL) {
            return;
        }
        let args = generateArgs(arguments);
        log.E.apply(this, args);
    }

    static v() {
        this.V.apply(this, arguments);
    }

    static d() {
        this.D.apply(this, arguments);
    }

    static i() {
        this.I.apply(this, arguments);
    }

    static w() {
        this.W.apply(this, arguments);
    }

    static e() {
        this.E.apply(this, arguments);
    }
}

Log.LOG_LEVEL = VERBOSE;
Log.APP_NAME = 'CordovaYunOSLogger:';

module.exports = Log;
