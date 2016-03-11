var ProtoBuf = require('protobufjs');

var RB = require('./ribbon-bridge.js');

var builder = ProtoBuf.loadProtoFile('proto/daemon.proto');
var daemon_obj = builder.build('barobo.Daemon');

var rb = new RB.RibbonBridge(daemon_obj);
rb.connect('ws://localhost:42000/', function() {
        console.log('Calling resolveSerialId...');
        rb.resolveSerialId({'serialId':{'value':'DGKR'}}, function(obj) { 
            console.log(obj);
        
            var robot_builder = ProtoBuf.loadProtoFile('proto/robot.proto');
            console.log('builder:');
            console.log(robot_builder);
            var robot_pb = robot_builder.build('barobo.Robot');
            var robot = new RB.RibbonBridge(robot_pb);
            robot.connect(
                'ws://'+obj.endpoint.address+':'+obj.endpoint.port,
                function(obj) {
                    robot.setLedColor({'value':0}, 
                        function(reply) {
                            console.log(reply);
                        });
                });
        })
});


setTimeout(function() {
    console.log('Done waiting for messages.');
}, 3000);


