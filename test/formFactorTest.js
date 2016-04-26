robotimpl = require('./../src/js/robotimpl.js');
async = require('async');

var robot = new robotimpl.RobotImpl();
var a = 90*3.14/180;

robot.connect('ws://localhost:42000', 'DGKR').then(function() {
    return robot.getFormFactor();
}).then(function(formfactor) {
    console.log(formfactor);
}).catch(function(err) {
    console.log('Error!');
    console.log(err);
});

