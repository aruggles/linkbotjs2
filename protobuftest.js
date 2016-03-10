var RB = require('./ribbon-bridge.js');

var rb = RB.RibbonBridge;
rb.connect('ws://localhost:42000/');
setTimeout(function() {
    console.log('Done waiting for messages.');
}, 3000);
