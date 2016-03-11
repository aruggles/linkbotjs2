var ProtoBuf = require('protobufjs');
var RibbonBridge = require('./ribbon-bridge.js');
var daemon_module = require('./daemon.js');
var async = require('async');
var util = require('./util.js');

var connect = (function() {
    var DAEMON_TIMEOUT = 5000;
    var ROBOT_TIMEOUT = 10000;

    var builder = ProtoBuf.loadProtoFile('proto/robot.proto');
    var robot_pb = builder.build('barobo.Robot');

    return function(uri, serialId, callback) {
        async.waterfall([
            util.timeout(function(callback_) {
                // Connect to the daemon
                console.log('Connecting to daemon...');
                daemon_module.connect(uri, callback_);
            }, DAEMON_TIMEOUT),
            util.timeout(function(daemon, callback_) {
                // Resolve the serial ID of the robot
                console.log('Resolving serial ID...');
                daemon.resolveSerialId(
                    {'serialId':{'value':serialId}},
                    function(err, reply) {
                        callback_(err, reply.endpoint.address, reply.endpoint.port);
                    }
                );
            }, DAEMON_TIMEOUT),
            util.timeout(function(host, port, callback_) {
                // Connect to the robot
                console.log('Connecting to robot...');
                var proxy = new RibbonBridge.RibbonBridge(robot_pb);
                proxy.connect('ws://'+host+':'+port, function(reply) {
                    callback_(null, proxy);
                });
            }, ROBOT_TIMEOUT),
        ], function(err, result) {
            callback(err, result);
        });
    };
})();

module.exports.connect = connect;
