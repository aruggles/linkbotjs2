/**
 * Created by adam on 4/24/16.
 */
"use strict";

var RobotManager = require('./robot-manager.js');
var Events = require('./events.js');
var Config = require('./config.js');
var Linkbot = require('./robotimpl.js');
var NavigationManager = require('./navigation-manager.js');
var UIManager = require('../jsx/ui-manager.jsx');

function LinkbotsAPI() {
    var module = {};
    var startOpen = false;

    module.addRobot = RobotManager.addRobot;
    module.removeRobot = RobotManager.removeRobot;
    module.openRobotMenu = function() {
        Events.uiEvents.trigger(Events.uiEvents.eventType.SHOW_MENU);
    };
    module.closeRobotMenu = function() {
        Events.uiEvents.trigger(Events.uiEvents.eventType.HIDE_MENU);
    };
    module.acquire = RobotManager.acquire;
    module.relinquish = RobotManager.relinquish;
    module.relinquishAll = RobotManager.relinquishAll;
    module.scan = function() {
        // TODO implement this.
    };
    module.startOpen = function(value) {
        startOpen = value;
    };
    module.setPathways = function(pathways) {
        if (!Array.isArray(pathways)) {
            pathways = [pathways];
        }
        if (!Config.set('pathways', pathways)) {
            Events.uiEvents.trigger(Events.uiEvents.eventType.ADD_ERROR, 'Unable to write pathways to the configuration file');
        }
    };
    module.getPathways = function() {
        var pathways = Config.get('pathways');
        if (typeof pathways === 'undefined') {
            return [];
        }
        return pathways;
    };
    module.setNavigationTitle = NavigationManager.setNavigationTitle;
    module.setNavigationItems = NavigationManager.setNavigationItems;
    module.addNavigationItem = NavigationManager.addNavigationItem;
    module.addNavigationItems = NavigationManager.addNavigationItems;

    module.robotEvents = Events.robotEvents;
    module.uiEvents = Events.uiEvents;
    module.Linbot = Linkbot.Linkbot;

    if(window.attachEvent) {
        window.attachEvent('onload', function() {
            UIManager.addUI();
            if (startOpen) {
                Events.uiEvents.trigger(Events.uiEvents.eventType.SHOW_MENU);
            }
        });
    } else {
        if(window.onload) {
            var originalOnLoad = window.onload;
            window.onload = function() {
                originalOnLoad();
                UIManager.addUI();
                if (startOpen) {
                    Events.uiEvents.trigger(Events.uiEvents.eventType.SHOW_MENU);
                }
            };
        } else {
            window.onload = function() {
                UIManager.addUI();
                if (startOpen) {
                    Events.uiEvents.trigger(Events.uiEvents.eventType.SHOW_MENU);
                }
            };
        }
    }

    return module;
}

global.Linkbots = new LinkbotsAPI();