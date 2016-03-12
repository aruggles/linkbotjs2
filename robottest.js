robotimpl = require('./robotimpl.js');
async = require('async');

var robot = new robotimpl.RobotImpl();

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
