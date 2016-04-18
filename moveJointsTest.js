robotimpl = require('./src/robotimpl.js');
async = require('async');

var robot = new robotimpl.RobotImpl();
var a = 90*3.14/180;

robot.connect('ws://localhost:42000', 'DGKR').then(function() {
    return robot.moveJoints(1, 1, -1, 7);
}).then(function() {
    return new Promise(function(resolve, reject) {
        setTimeout(resolve, 3000);
    });
}).then(function() {
    return robot.stop();
}).catch(function(err) {
    console.log('Error!');
    console.log(err);
});

