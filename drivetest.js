robotimpl = require('./src/robotimpl.js');
async = require('async');

var robot = new robotimpl.RobotImpl();
var a = 90*3.14/180;

robot.connect('ws://localhost:42000', 'DGKR').then(function() {
    return robot.drive(a, a, a, 7);
}).then(function() {
    return robot.moveWait(7);
}).then(function() {
    console.log('Motion completed.');
}).catch(function(err) {
    console.log('Error!');
    console.log(err);
});
