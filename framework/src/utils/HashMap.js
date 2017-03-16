"use strict";

// const TAG = "MMS/HashMap";

class HashMap {

    constructor() {
        this.length = 0;
        this.obj = {};
    }

    isEmpty() {
        return this.length === 0;
    }

    containsKey(key) {
        return key in this.obj;
    }

    containsValue(value) {
        for (var key in this.obj) { // add filter if needed
            if (this.obj[key] === value) {
                return true;
            }
        }
        return false;
    }

    put(key, value) {
        if (!this.containsKey(key)) {
            this.length++;
        }
        this.obj[key] = value;
    }

    get(key) {
        return this.containsKey(key) ? this.obj[key] : null;
    }

    remove(key) {
        if (this.containsKey(key) && delete this.obj[key]) {
            this.length--;
        }
    }

    values() {
        var _values = [];
        for (var key in this.obj) {
            if (this.obj.hasOwnProperty(key)) {
                _values.push(this.obj[key]);
            }
        }
        return _values;
    }

    keySet() {
        var _keys = [];
        for (var key in this.obj) {
            if (this.obj.hasOwnProperty(key)) {
                _keys.push(key);
            }
        }
        return _keys;
    }

    size() {
        return this.length;
    }

    clear() {
        this.length = 0;
        this.obj = {};
    }

    setInBatch(value) {
        for (var key in this.obj) {
            if (this.obj.hasOwnProperty(key)) {
                this.obj[key] = value;
            }
        }
    }
}

module.exports = HashMap;