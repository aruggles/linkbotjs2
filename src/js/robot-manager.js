/**
 * Created by adam on 4/24/16.
 */
"use strict";

var Events = require('./events.js');
var Config = require('./config.js');
var Robot = require('./robotimpl.js');

var robots = {};
var orderedRobots = [];
var pingRobots = [];

function findRobot(id) {
    return robots[id];
}

function readRobotsFromConfig() {
    var robots = Config.get('robots');
    if (typeof robots !== 'undefined' && Array.isArray(robots)) {
        return robots.map(function(id) {
           return new Robot.Linkbot(id);
        });
    } else {
        return [];
    }
}

function writeRobotsToConfig(robotArray) {
    if (typeof robots !== 'undefined' && Array.isArray(robotArray)) {
        if (!Config.set('robots', robotArray.map(function(b) { return b.id; })) ) {
            console.warn("Unable to write robots array to configuration");
        } else {
            console.warn("Invalid robots array not writing to configuration");
        }
    }
}

function disconnectAll() {
    for (var key in robots) {
        if (robots.hasOwnProperty(key)) {
            robots[key].disconnect();
        }
    }
}

function batchcallPings(error) {
    var p;
    if (error.code === 0) {
        if (pingRobots.length > 0) {
            p = pingRobots.splice(0, 8);
            if (p.length > 0) {
                // TODO implement send robot ping.
                //asyncBaroboBridge.sendRobotPing(p, botlib.addCallback(batchcallPings));
            }
        }
    }
    else {
        console.warn('error occurred [' + error.category + '] :: ' + error.message);
    }
}

function refresh () {
    // TODO: If any robot has an error while trying to connect, disconnect and
    // reconnect once. This should fix simple communications interruptions.
    var i = 0, pinged;
    pingRobots = [];
    for (i = 0; i < orderedRobots.length; i++) {
        pingRobots.push(orderedRobots[i]);
    }
    pinged = pingRobots.splice(0, 8);
    if (pinged.length > 0) { // if pinged.length == 0, every robot will reply
        // TODO implement send robot ping.
        //asyncBaroboBridge.sendRobotPing(pinged, botlib.addCallback(batchcallPings));
    }
}

module.exports.moveRobot = function(from, to) {
    orderedRobots.splice(to, 0, orderedRobots.splice(from, 1)[0]);
    writeRobotsToConfig(robots);
    Events.robotEvents.trigger(Events.robotEvents.eventType.MOVED);
};
module.exports.addRobot = function(id) {
    if (typeof id === 'undefined' || id === null || id.length < 3 || /[a|e|i|o|u]/gi.test(id)) {
        // TODO notify the user that this is an invalid add.
        return;
    }
    var identifier = id.toUpperCase();
    var robot = findRobot(identifier);
    if (!robot) {
        orderedRobots.unshift(identifier);
        robots[identifier] = new Robot.Linkbot(identifier);
        writeRobotsToConfig(robots);
        Events.robotEvents.trigger(Events.robotEvents.eventType.ADDED, identifier);
        // TODO update this to new API version.
        //asyncBaroboBridge.sendRobotPing([identifier], botlib.addGenericCallback());
    }
};
module.exports.removeRobot = function(id) {
    var robot, index;
    robot = findRobot(id);
    if (robot) {
        robot.disconnect();
        index = orderedRobots.indexOf(id);
        orderedRobots.splice(index, 1);
        delete robots[id];
        Events.robotEvents.trigger(Events.robotEvents.eventType.REMOVED, id);
    }
};
module.exports.getRobot = findRobot;
module.exports.getRobots = function() {
    return orderedRobots.map(function(id) {
        return robots[id];
    });
};
module.exports.disconnectAll = disconnectAll;
module.exports.refresh = refresh;
module.exports.acquire = function(n) {
    var readyBots = orderedRobots.filter(function(id) {
        return robots[id].status === "ready";
    });
    var ret = {
        robots: [],
        registered: robots.length,
        ready: readyBots.length
    };
    if (ret.ready >= n) {
        var rs = readyBots.slice(0, n);
        rs.map(function(r) {
            r.status = "acquired";
            return r.status;
        });
        ret.robots = rs.map(function(r) {
            return r;
        });
        ret.ready -= n;
    }
    return ret;
};

module.exports.relinquish = function(bot) {
    var robot = robots[bot.id];
    if (robot && robot.status === 'acquired') {
        robot.status = 'ready';
        robot.unregister();
    }
};

module.exports.relinquishAll = function() {
    for (var key in robots) {
        if (robots.hasOwnProperty(key)) {
            var robot = robots[key];
            if (robot.status === "acquired") {
                robot.status = "ready";
                robot.unregister();
            }
        }
    }
};

// TODO move this in to the main area.
setTimeout(function() {
    var i;
    var robotArray = readRobotsFromConfig();
    if (robotArray && robotArray.length > 0) {
        for (i = 0; i < robotArray.length; i++) {
            var r = robotArray[i];
            if (r) {
                orderedRobots.shift(r.id);
                robots[r.id] = r;
                Events.robotEvents.trigger(Events.robotEvents.eventType.ADDED, r.id);
            }
        }
        refresh();

    }
}, 1);

Events.robotEvents.on(Events.robotEvents.eventType.DONGLE_UP, function() {
    Events.uiEvents.trigger(Events.uiEvents.eventType.HIDE_DONGLE_UPDATE);
    refresh();
});

Events.robotEvents.on(Events.robotEvents.eventType.DONGLE_DOWN, function() {
    Events.uiEvents.trigger(Events.uiEvents.eventType.HIDE_DONGLE_UPDATE);
});

Events.robotEvents.on(Events.robotEvents.eventType.DONGLE_UPDATE, function(data) {
    Events.uiEvents.trigger(Events.uiEvents.eventType.SHOW_DONGLE_UPDATE, data);
});

// TODO port over connection terminated.