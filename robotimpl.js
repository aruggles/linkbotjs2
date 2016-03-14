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
        // Cheap hack note: The bcast.id parameter is 32-bit unsigned, but our
        // hashes are all signed (Thanks, Javascript.) Thus, we |0 the id to
        // created a signed 32-bit int before searching our hash database.
        assert(_rpcHashMap.hasOwnProperty(bcast.id|0));
        var name = _rpcHashMap[bcast.id|0];
        if(!(name in _broadcastCallbacks)) {
            return;
        }
        bcast_obj = robot_pb[name].decode(bcast.payload);
        _broadcastCallbacks[name](bcast_obj);
    }

    self._jointsMovingMask = 0;
    self._motorMask = 0x07;
    self._moveWaitCallbacks = [];

    self.on = function(name, callback) {
        _broadcastCallbacks[name] = callback;
    }

    self._onJointEvent = function(payload) {
        console.log('Received joint event:');
        console.log(self._jointsMovingMask);
        if( 
              (payload.event == robot_pb.JointState.COAST) ||
              (payload.event == robot_pb.JointState.HOLD)
          )
        {
            self._jointsMovingMask &= ~(1<<payload.joint);
        }
        var i = self._moveWaitCallbacks.length;
        while(i--) {
            item = self._moveWaitCallbacks[i];
            if( 0 == (item.mask & self._jointsMovingMask) ) {
                item.callback(null)
                self._moveWaitCallbacks.splice(i, 1);
            }
        }
    }

    self.connect = function(uri, serialId, callback) {
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
                // Get our form factor
                proxy.getFormFactor({}, function(err, result) {
                    var f = result.value;
                    if(f == 0) {
                        // I
                        self._motorMask = 0x05;
                    } else if (f == 1) {
                        // L
                        self._motorMask = 0x03;
                    } else if (f == 2) {
                        // T
                        self._motorMask = 0x07;
                    } else if (f == 3) {
                        // Dongle
                        self._motorMask = 0;
                    }
                    callback_(err, proxy);
                });
            },
            function(proxy, callback_) {
                // Register our broadcast handler
                proxy.on('broadcast', _broadcastHandler);
                // Register our own joint-event handler
                self.on('jointEvent', self._onJointEvent);
                proxy.enableJointEvent({'enable':true}, function(err, result) {
                    callback_(err, proxy);
                });
            }
        ], function(err, result) {
            self.proxy = result;
            callback(err, self);
        });
        return self;
    };

    self.move = function(a1, a2, a3, mask, callback) {
        move_obj = {};
        if(mask & 0x01) {
            move_obj.motorOneGoal = 
                { 'type': robot_pb.Goal.Type.RELATIVE,
                  'goal': a1,
                };
        }
        if(mask & 0x02) {
            move_obj.motorTwoGoal = 
                { 'type': robot_pb.Goal.Type.RELATIVE,
                  'goal': a2,
                };
        }
        if(mask & 0x04) {
            move_obj.motorThreeGoal = 
                { 'type': robot_pb.Goal.Type.RELATIVE,
                  'goal': a3,
                };
        }
        self._jointsMovingMask = mask&self._motorMask;
        util.timeout(self.proxy.move(move_obj, callback), ROBOT_TIMEOUT);
    }

    self.moveWait = function(mask, callback) {
        mask = mask & self._motorMask;
        // If the joint is not moving, call the callback immediately.
        if( 0 == (mask & self._jointsMovingMask) ) {
            async.setImmediate(callback, null);
        } else {
            // Add the callback to our move_wait callbacks
            self._moveWaitCallbacks.push( {'mask':mask, 'callback':callback} );
        }
    }
}

module.exports.RobotImpl = RobotImpl;
