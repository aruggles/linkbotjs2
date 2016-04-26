/**
 * Created by adam on 4/25/16.
 */
"use strict";

var Events = require('./events');

var navigationItems = [];
var title = document.title;

if (title.length === 0) {
    title = "Linkbot Labs";
}
navigationItems.push({'title':title, 'url':'#'});

module.exports.getNavigationTitle = function() {
    return title;
};
module.exports.setNavigationTitle = function(newTitle) {
    title = newTitle;
};
module.exports.getNavigationItems = function() {
    return navigationItems;
};

module.exports.addNavigationItem = function(item) {
    if (item !== null && typeof(item) !== 'undefined' && typeof item === 'object') {
        if (item.title && item.url) {
            navigationItems.push(item);
            Events.uiEvents.trigger(Events.uiEvents.eventType.NAVIGATION_CHANGED);
        }
    }
};
module.exports.addNavigationItems = function(items) {
    var changed = false;
    if (items !== null && Array.isArray(items)) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item !== null && typeof(item) !== 'undefined' && typeof item === 'object') {
                if (item.title && item.url) {
                    navigationItems.push(item);
                    changed = true;
                }
            }
        }
        if (changed) {
            Events.uiEvents.trigger(Events.uiEvents.eventType.NAVIGATION_CHANGED);
        }
    }
};
module.exports.setNavigationItems = function(items) {
    navigationItems = [];
    if (items !== null && Array.isArray(items)) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item !== null && typeof(item) !== 'undefined' && typeof item === 'object') {
                if (item.title && item.url) {
                    navigationItems.push(item);
                }
            }
        }
    }
    Events.uiEvents.trigger(Events.uiEvents.eventType.NAVIGATION_CHANGED);
};