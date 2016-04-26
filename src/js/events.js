/**
 * Created by adam on 4/24/16.
 */
"use strict";
var events = {
    on: function(event, callback, context) {
        this.hasOwnProperty('events') || (this.events = {}); // jshint ignore:line
        this.events.hasOwnProperty(event) || (this.events[event] = []); // jshint ignore:line
        this.events[event].push([callback, context]);
    },
    off: function(event, callback, context) {
        this.hasOwnProperty('events') || (this.events = {}); // jshint ignore:line
        var i, list, index;
        list = this.events[event] || [];
        index = -1;
        for (i = 0; i < list.length; i++) {
            if (list[i][0] === callback || list[i][1] == context) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    },
    trigger: function(event) {
        this.hasOwnProperty('events') || (this.events = {}); // jshint ignore:line
        var args = Array.apply([], arguments);
        var tail = Array.prototype.slice.call(args, 1), callbacks = this.events[event] || [];
        for(var i = 0, l = callbacks.length; i < l; i++) {
            var callback = callbacks[i][0],
                context = callbacks[i][1] === undefined ? this : callbacks[i][1];
            callback.apply(context, tail);
        }
    },
    clearAll: function() {
        this.events = {};
    },
    clearEvent: function(event) {
        this.events[event] = [];
    },
    extend: function(other) {
        for (var property in this) {
            other[property] = this[property];
        }
        return other;
    },
    eventType: {}
};

// UI Events
console.log('Initializing Events');
var uiEvents = events.extend({});
uiEvents.eventType = {
    HIDE:'hide',
    HIDE_SLIDER:'hide-slider',
    HIDE_MENU: 'hide-menu',
    SHOW_MENU: 'show-menu',
    HIDE_DONGLE_UPDATE: 'hide-dongle-update',
    SHOW_DONGLE_UPDATE: 'show-dongle-update',
    HIDE_CONTROL_PANEL: 'hide-control-panel',
    SHOW_CONTROL_PANEL: 'show-control-panel',
    HIDE_FULL_SPINNER: 'hide-full-spinner',
    SHOW_FULL_SPINNER: 'show-full-spinner',
    ADD_ERROR: 'add-error',
    HIDE_CONSOLE: 'hide-console',
    HIDE_HELP: 'hide-help',
    SHOW_HELP: 'show-help',
    NAVIGATION_CHANGED: 'navigation-changed'
};

var robotEvents = events.extend({});
robotEvents.eventType = {
    MOVED: 'moved',
    ADDED: 'added',
    CHANGED: 'changed',
    REMOVED: 'removed',
    DONGLE_UP: 'dongleUp',
    DONGLE_DOWN: 'dongleDown',
    DONGLE_UPDATE: 'dongleUpdate'
};

module.exports.Events = events;
module.exports.uiEvents = uiEvents;
module.exports.robotEvents = robotEvents;

