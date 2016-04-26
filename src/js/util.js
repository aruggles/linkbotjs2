// Taken from https://github.com/caolan/async/blob/master/lib/timeout.js
"use strict";

function timeout(asyncFn, miliseconds) {
    var originalCallback, timer;
    var timedOut = false;

    function injectedCallback() {
        if (!timedOut) {
            originalCallback.apply(null, arguments);
            clearTimeout(timer);
        }
    }

    function timeoutCallback() {
        var error  = new Error('Callback function timed out.');
        error.code = 'ETIMEDOUT';
        timedOut = true;
        originalCallback(error);
    }

    function injectCallback(asyncFnArgs) {
        // replace callback in asyncFn args
        var args = Array.prototype.slice.call(asyncFnArgs, 0);
        originalCallback = args[args.length - 1];
        args[args.length - 1] = injectedCallback;
        return args;
    }

    function wrappedFn() {
        // setup timer and call original function
        timer = setTimeout(timeoutCallback, miliseconds);
        asyncFn.apply(null, injectCallback(arguments));
    }

    return wrappedFn;
}

function rgbToHex(value) {
    if (!value || value === null || value === "undefined") {
        return "00";
    }
    var val = Math.round(value);
    val = val.toString(16);
    if (val.length < 2) {
        val = "0" + val;
    }
    return val;
}

function hexToRgb(hex) {
    var bigint;
    if (hex.substr(0, 1) === '#') {
        bigint = parseInt(hex.substring(1), 16);
    } else {
        bigint = parseInt(hex, 16);
    }
    return {
        'red':((bigint >> 16) & 255),
        'green':((bigint >> 8) & 255),
        'blue':(bigint & 255)
    };
}

function colorToHex(color) {
    var red = rgbToHex(color.red);
    var green = rgbToHex(color.green);
    var blue = rgbToHex(color.blue);
    return red + green + blue;
}

// DOM Utils.
function hasClass(ele,cls) {
    return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
function addClass(ele,cls) {
    if (!hasClass(ele,cls)) ele.className += " "+cls;
}
function removeClass(ele,cls) {
    if (hasClass(ele,cls)) {
        var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
        ele.className=ele.className.replace(reg,' ');
    }
}
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while(element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }
    return { x: xPosition, y: yPosition };
}

// Export all utility functions.
module.exports.timeout = timeout;
module.exports.hexToRgb = hexToRgb;
module.exports.colorToHex = colorToHex;
module.exports.rgbToHex = rgbToHex;
module.exports.hasClass = hasClass;
module.exports.addClass = addClass;
module.exports.removeClass = removeClass;
module.exports.getPosition = getPosition;


module.exports.uri = 'ws://localhost:42000';
module.exports.rad2deg = 180/Math.PI;