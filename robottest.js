robot = require('./robot.js');
async = require('async');

async.waterfall([
        function(callback) {
            console.log('Connecting to robot...');
            robot.connect('ws://localhost:42000', 'DGKR', callback);
        },
        function(robot, callback) {
            console.log('Setting led color...');
            robot.setLedColor(0xffffff, callback)
        },
    ], 
    function(err, result) {
        if(err) {
            console.log('Error controlling robot: '+err);
        }
});
