/**
 * Created by adam on 4/24/16.
 */
"use strict";

var deepEqual = require('deep-equal');
// TODO change this to a web service call.
function set (k, v) {
    var config = {}; //asyncBaroboBridge.configuration;
    if (!config) {
        config = {};
    }
    config[k] = v;
    //asyncBaroboBridge.configuration = config;
    //return deepEqual(asyncBaroboBridge.configuration, config);
    return;
}

function get (k) {
    var config = {};//asyncBaroboBridge.configuration;
    if (!config) {
        config = {};
    }
    return config[k];
}

module.exports.set = set;
module.exports.get = get;