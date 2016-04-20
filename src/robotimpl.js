var ProtoBuf = require('protobufjs');
var RibbonBridge = require('./ribbon-bridge.js');
var daemon_module = require('./daemon.js');
var async = require('async');
var util = require('./util.js');
const assert = require('assert');

function rgbToHex(value) {
    if (!value || value === null || value === "undefined") {
        return "00";
    }
    var val = Math.round(value);
    val = val.toString(16);
    if (val.length < 2) {
        val = "0" + val;
    }
    return val;
}

function sign(value) {
    return (value > 0) - (value < 0);
}

function colorToHex(color) {
    var red = rgbToHex(color.red);
    var green = rgbToHex(color.green);
    var blue = rgbToHex(color.blue);
    return red + green + blue;
}

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

    var _jointsMovingMask = 0;
    var _motorMask = 0x07;
    var _moveWaitCallbacks = [];

    self.on = function(name, callback) {
        // Valid broadcast names are:
        // 'buttonEvent',
        // 'encoderEvent',
        // 'accelerometerEvent',
        // 'jointEvent',
        // 'debugMessageEvent',
        // 'connectionTerminated'

        _broadcastCallbacks[name] = callback;
    }

    var _onJointEvent = function(payload) {
        console.log('Received joint event:');
        console.log(_jointsMovingMask);
        if( 
              (payload.event == robot_pb.JointState.COAST) ||
              (payload.event == robot_pb.JointState.HOLD)
          )
        {
            _jointsMovingMask &= ~(1<<payload.joint);
        }
        var i = _moveWaitCallbacks.length;
        while(i--) {
            item = _moveWaitCallbacks[i];
            if( 0 == (item.mask & _jointsMovingMask) ) {
                item.callback(null)
                _moveWaitCallbacks.splice(i, 1);
            }
        }
    }

    self.color = function(r, g, b) {
        return new Promise(function(resolve, reject) {
            colorvalue = r<<16 | g<<8 | b;
            color = {'value': colorvalue};
            util.timeout(self.proxy.setLedColor(color, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.connect = function(uri, serialId) {
        return new Promise(function(resolve, reject) {
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
                    console.log('Connection in progress... waiting on callback.');
                }, ROBOT_TIMEOUT),
                util.timeout(function(proxy, callback_) {
                    // Get our form factor
                    console.log('Getting form factor...');
                    proxy.getFormFactor({}, function(err, result) {
                        var f = result.value;
                        if(f == 0) {
                            // I
                            _motorMask = 0x05;
                        } else if (f == 1) {
                            // L
                            _motorMask = 0x03;
                        } else if (f == 2) {
                            // T
                            _motorMask = 0x07;
                        } else if (f == 3) {
                            // Dongle
                            _motorMask = 0;
                        }
                        callback_(err, proxy);
                    });
                }, ROBOT_TIMEOUT),
                util.timeout(function(proxy, callback_) {
                    // Register our broadcast handler
                    proxy.on('broadcast', _broadcastHandler);
                    // Register our own joint-event handler
                    self.on('jointEvent', _onJointEvent);
                    proxy.enableJointEvent({'enable':true}, function(err, result) {
                        callback_(err, proxy);
                    });
                }, ROBOT_TIMEOUT),
            ], function(err, result) {
                if(!err) {
                    self.proxy = result;
                    resolve(self);
                } else {
                    reject(err);
                }
            });
        });
    };

    self.drive = function(a1, a2, a3, mask) {
        return new Promise(function(resolve, reject) {
            move_obj = {};
            if(mask & 0x01) {
                move_obj.motorOneGoal = 
                    { 'type': robot_pb.Goal.Type.RELATIVE,
                      'goal': a1,
                      'controller' : robot_pb.Goal.Controller.PID
                    };
            }
            if(mask & 0x02) {
                move_obj.motorTwoGoal = 
                    { 'type': robot_pb.Goal.Type.RELATIVE,
                      'goal': a2,
                      'controller' : robot_pb.Goal.Controller.PID
                    };
            }
            if(mask & 0x04) {
                move_obj.motorThreeGoal = 
                    { 'type': robot_pb.Goal.Type.RELATIVE,
                      'goal': a3,
                      'controller' : robot_pb.Goal.Controller.PID
                    };
            }
            _jointsMovingMask = mask&_motorMask;
            util.timeout(self.proxy.move(move_obj, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.driveTo = function(a1, a2, a3, mask) {
        return new Promise(function(resolve, reject) {
            move_obj = {};
            if(mask & 0x01) {
                move_obj.motorOneGoal = 
                    { 'type': robot_pb.Goal.Type.ABSOLUTE,
                      'goal': a1,
                      'controller' : robot_pb.Goal.Controller.PID
                    };
            }
            if(mask & 0x02) {
                move_obj.motorTwoGoal = 
                    { 'type': robot_pb.Goal.Type.ABSOLUTE,
                      'goal': a2,
                      'controller' : robot_pb.Goal.Controller.PID
                    };
            }
            if(mask & 0x04) {
                move_obj.motorThreeGoal = 
                    { 'type': robot_pb.Goal.Type.ABSOLUTE,
                      'goal': a3,
                      'controller' : robot_pb.Goal.Controller.PID
                    };
            }
            _jointsMovingMask = mask&_motorMask;
            util.timeout(self.proxy.move(move_obj, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.getColor = function() {
        return new Promise(function(resolve, reject) {
            util.timeout(self.proxy.getLedColor( {}, function(err, result) {
                if(err) { reject(err); }
                else {
                    var value = result.value;
                    color = {'red': value >> 16,
                             'green': (value >> 8) & 0x00ff,
                             'blue': value & 0x00ff
                             };
                    resolve(color);
                }
            }), ROBOT_TIMEOUT);
        });
    }

    self.getFormFactor = function() {
        // Returns result:
        // I = 0;
        // L = 1;
        // T = 2;
        // DONGLE = 3;
        return new Promise(function(resolve, reject) {
            util.timeout(self.proxy.getFormFactor( {}, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result.value); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.getHexColor = function() {
        return new Promise(function(resolve, reject) {
            util.timeout(self.proxy.getLedColor( {}, function(err, result) {
                if(err) { reject(err); }
                else {
                    var color = {
                        'red':result.value>>16,
                        'green': (result.value>>8)&0x00ff,
                        'blue':  (result.value)&0x00ff
                        };
                    resolve(colorToHex(color));
                }
            }), ROBOT_TIMEOUT);
        });
    }

    self.getJointAngles = function() {
        return new Promise(function(resolve, reject) {
            util.timeout(self.proxy.getEncoderValues({}, function(err, result) {
                if(err) { reject(err); }
                else {
                    resolve(result.values);
                }
            }), ROBOT_TIMEOUT);
        });
    }

    self.getSpeeds = function() {
        return new Promise(function(resolve, reject) {
            util.timeout(self.proxy.getMotorControllerOmega({}, function(err, result) {
                if ( err ) { reject(err); }
                else { resolve(result.values); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.getVersion = function() {
        return new Promise(function(resolve, reject) {
            util.timeout(self.proxy.getFirmwareVersion({}, function(err, result) {
                if ( err ) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.move = function(a1, a2, a3, mask) {
        return new Promise(function(resolve, reject) {
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
            _jointsMovingMask = mask&_motorMask;
            util.timeout(self.proxy.move(move_obj, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.moveJoints = function(c1, c2, c3, mask) {
        // Begin moving a robot's joints indefinitely. c1, c2, and c3 are joint
        // motion coefficients. Setting a coefficient to 1 begins moving the
        // joint at maximum forward velocity, and -1 at maximum backward
        // velocity.
        return new Promise(function(resolve, reject) {
            move_obj = {};
            if(mask & 0x01) {
                move_obj.motorOneGoal = 
                    { 'type': robot_pb.Goal.Type.INFINITE,
                      'goal': c1,
                    };
            }
            if(mask & 0x02) {
                move_obj.motorTwoGoal = 
                    { 'type': robot_pb.Goal.Type.INFINITE,
                      'goal': c2,
                    };
            }
            if(mask & 0x04) {
                move_obj.motorThreeGoal = 
                    { 'type': robot_pb.Goal.Type.INFINITE,
                      'goal': c3,
                    };
            }
            _jointsMovingMask = mask&_motorMask;
            util.timeout(self.proxy.move(move_obj, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.moveTo = function(a1, a2, a3, mask) {
        return new Promise(function(resolve, reject) {
            move_obj = {};
            if(mask & 0x01) {
                move_obj.motorOneGoal = 
                    { 'type': robot_pb.Goal.Type.ABSOLUTE,
                      'goal': a1,
                    };
            }
            if(mask & 0x02) {
                move_obj.motorTwoGoal = 
                    { 'type': robot_pb.Goal.Type.ABSOLUTE,
                      'goal': a2,
                    };
            }
            if(mask & 0x04) {
                move_obj.motorThreeGoal = 
                    { 'type': robot_pb.Goal.Type.ABSOLUTE,
                      'goal': a3,
                    };
            }
            _jointsMovingMask = mask&_motorMask;
            util.timeout(self.proxy.move(move_obj, function(err, result) {
                if(err) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.moveWait = function(mask) {
        return new Promise(function(resolve, reject) {
            mask = mask & _motorMask;
            // If the joint is not moving, call the callback immediately.
            if( 0 == (mask & _jointsMovingMask) ) {
                resolve();
            } else {
                // Add the callback to our move_wait callbacks
                _moveWaitCallbacks.push( 
                    {'mask':mask, 'callback':function(err, result) 
                        {
                            if(err) { reject(err); }
                            else { resolve(); }
                        }} );
            }
        });
    }

    self.reset = function() {
        // Reset the Linkbot's motor multi-rotation counters.
        return new Promise(function(resolve, reject) {
            util.timeout(
                self.proxy.resetEncoderRevs({}, function(err, result) {
                    if(err) { reject(err); }
                    else { resolve(result); }
                }),
                ROBOT_TIMEOUT
            );
        });
    }

    self.setBuzzerFrequency = function(frequency) {
        return new Promise(function(resolve, reject) {
            util.timeout(
                self.proxy.setBuzzerFrequency({'value':frequency}, function(err, result) {
                    if(err) { reject(err); }
                    else { resolve(result); }
                }),
                ROBOT_TIMEOUT
            );
        });
    }

    self.speeds = function(s1, s2, s3, mask) {
        return new Promise(function(resolve, reject) {
            speed_obj = {};
            speed_obj.mask = mask;
            speed_obj.values = [s1, s2, s3];
            util.timeout(self.proxy.setMotorControllerOmega(speed_obj, function(err, result) {
                if ( err ) { reject(err); }
                else { resolve(result); }
            }), ROBOT_TIMEOUT);
        });
    }

    self.stop = function() {
        return new Promise(function(resolve, reject) {
            util.timeout(
                self.proxy.stop({}, function(err, result) {
                    if(err) { reject(err); }
                    else { resolve(result); }
                }),
                ROBOT_TIMEOUT
            );
        });
    }
}

module.exports.RobotImpl = RobotImpl;
global.RobotImpl = RobotImpl;
global.Linkbot = RobotImpl;
