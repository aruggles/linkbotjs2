var ProtoBuf = require('protobufjs');

var RB = require('./ribbon-bridge.js');

var builder = ProtoBuf.loadProtoFile('proto/daemon.proto');
var daemon_obj = builder.build('barobo.Daemon');

var rb = new RB.RibbonBridge(daemon_obj);
rb.connect('ws://localhost:42000/', function() {
        rb.resolveSerialId({'serialId':{'value':'DGKR'}}, function(obj) { 
            console.log(obj);
        })
});

setTimeout(function() {
    console.log('Done waiting for messages.');
}, 3000);


