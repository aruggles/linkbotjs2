robotimpl = require('./src/robotimpl.js');
async = require('async');

var robot = new robotimpl.RobotImpl();
var a = 90*3.14/180;

robot.connect('ws://localhost:42000', 'DGKR').then(function() {
    return robot.move(a,a,a,7);
}).then(function() {
    return robot.moveWait(7);
}).then(function() {
    return robot.setBuzzerFrequency(440);
}).then(function() {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, 1000);
    });
}).then(function() {
    return robot.setBuzzerFrequency(0);
}).then(function() {
    return robot.getJointAngles();
}).then(function(values) {
    console.log("Robot joint angles: ");
    console.log(values);
}).catch(function(err) {
    console.log('Error!');
    console.log(err);
});

/*
.then
    robot.move(a, a, a, 7)).then(
    robot.moveWait(7)).then(
    robot.setBuzzerFrequency(440)).then(function() {
            return new Promise(function(resolve, reject) {
                setTimeout(resolve, 1000);
            });
        }).then(
    robot.setBuzzerFrequency(0)).catch(function(err) {
        console.log('Could not complete robot program:');
        console.log(err);
    });
*/

/*
async.series([
    async.apply(robot.connect, 'ws://localhost:42000', 'DGKR'),
    async.apply(robot.move, a, a, a, 0x07),
    async.apply(robot.moveWait, 0x07),
    function(callback) {
        console.log('moveWait done.');
        callback(null);
    },
    async.apply(robot.setBuzzerFrequency, 440),
    function(callback) {
        setTimeout(callback, 1000, null, null);
    },
    async.apply(robot.setBuzzerFrequency, 0),
    function(callback) {
        robot.getJointAngles(function(err, result) {
            if(err) { callback(err); return; }
            console.log('Current motor angles: ');
            console.log(result);
        });
    }
], function(err, results) {
    if(err) {
        console.log(err);
    }
});

*/

/*
var buttonEvent = function() {
    console.log('Button event!');
    console.log(arguments);
}

async.waterfall([
        function(callback) {
            console.log('Connecting to robot...');
            robot.connect('ws://localhost:42000', 'DGKR', callback);
        },
        function(robot, callback) {
            console.log('Setting led color...');
            robot.proxy.setLedColor(0xffffff, function(err, reply) {
                callback(null, robot);
            });
        },
        function(robot, callback) {
            // Enable button events
            robot.on('buttonEvent', buttonEvent);
            robot.proxy.enableButtonEvent({'enable':true}, function(err, reply) {
                callback(null, robot);
            });
        },
    ], 
    function(err, result) {
        if(err) {
            console.log('Error controlling robot: '+err);
        }
});
*/
