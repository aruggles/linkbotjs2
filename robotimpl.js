var ProtoBuf = require('protobufjs');
var RibbonBridge = require('./ribbon-bridge.js');
var daemon_module = require('./daemon.js');
var async = require('async');
var util = require('./util.js');
const assert = require('assert');

var RobotImpl = function() {
    var self = this;
    var DAEMON_TIMEOUT = 5000;
    var ROBOT_TIMEOUT = 10000;

    var builder = ProtoBuf.loadProtoFile('proto/robot.proto');
    var robot_pb = builder.build('barobo.Robot');

    var _rpcBroadcastNames = [
        'buttonEvent',
        'encoderEvent',
        'accelerometerEvent',
        'jointEvent',
        'debugMessageEvent',
        'connectionTerminated',
    ];

    var _rpcHashMap = {};
    for(var i = 0; i <  _rpcBroadcastNames.length; i++) {
        var name = _rpcBroadcastNames[i];
        _rpcHashMap[RibbonBridge.hash(name)] = name;
    }

    var _broadcastCallbacks = {};

    var _broadcastHandler = function(bcast) {
        console.log(_rpcHashMap);
        console.log(bcast);
        assert(_rpcHashMap.hasOwnProperty(bcast.id));
        var name = _rpcHashMap[bcast.id];
        if(!(name in _broadcastCallbacks)) {
            return;
        }
        bcast_obj = robot_pb[name].decode(bcast.payload);
        _broadcastCallbacks[name](bcast_obj);
    }

    this.on = function(name, callback) {
        _broadcastCallbacks[name] = callback;
    }

    this.connect = function(uri, serialId, callback) {
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
            function(proxy, callback_) {
                // Register our broadcast handler
                proxy.on('broadcast', _broadcastHandler);
                callback_(null, proxy);
            }
        ], function(err, result) {
            self.proxy = result;
            callback(err, self);
        });
        return self;
    };
}

module.exports.RobotImpl = RobotImpl;
