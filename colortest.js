robotimpl = require('./src/robotimpl.js');
async = require('async');

var robot = new robotimpl.Linkbot();
var a = 90*3.14/180;

robot.connect('ws://localhost:42000', 'DGKR').then(function() {
    return robot.color(255, 0, 0);
}).then(function() {
    return robot.getColor();
}).then(function(color) {
    console.log(color);
    return robot.getHexColor();
}).then(function(color) {
    console.log(color);
}).catch(function(err) {
    console.log('Error!');
    console.log(err);
});

