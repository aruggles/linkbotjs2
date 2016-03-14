const assert = require('assert');

// hash function
var hash = function(string) {
    var h = 0;
    var c = 0;
    for(var i = 0, len = string.length; i < len; i++) {
        c = string.charCodeAt(i);
        h = (101*h + c) & 0xffffffff
    }
    return h;
}

var RibbonBridge = function(protobufObj) {
    var pb = require("protobufjs");
    var WebSocketClient = require("websocket").client;

    var _msgId = 10;
    var _replyHandlers = {};
    var _connection = null;
    var _proxyProtoBuf = protobufObj;
    var _valid_callbacks = [
        'connect',
        'broadcast',
        ];
    var _callbacks = {};
    // Initialize protobuf
    builder = pb.loadProtoFile('proto/rpc.proto');
    barobo = builder.build('barobo');

    // initialize websockets
    ws_client = new WebSocketClient();
    ws_client.on('connectFailed', function(error) {
        console.log('WS Connect error: ' + error.toString());
    });

    ws_client.on('connect', function(connection) {
        connection.on('close', function() {
            console.log('Connection closed.');
        });
        connection.on('error', function(error) {
            console.log('WS Connection error: ' + error.toString());
        });
        connection.on('message', function(message) {
            console.log('ribbon-bridge received message.');
            serverMessage = barobo.rpc.ServerMessage.decode(message.binaryData);
            if(
                (serverMessage.type == barobo.rpc.ServerMessage.Type.REPLY) 
                ) 
            {
                if(serverMessage.reply.type == barobo.rpc.Reply.Type.RESULT) {
                    if (_replyHandlers[serverMessage.inReplyTo]['name'] != null) {
                        var name = _replyHandlers[serverMessage.inReplyTo]['name'];
                        result = _proxyProtoBuf[name]['Result'];
                        result_obj = result.decode(serverMessage.reply.result.payload);
                        _replyHandlers[serverMessage.inReplyTo]['cb'](null, result_obj);
                    } else {
                        _replyHandlers[serverMessage.inReplyTo]['cb'](
                            null, serverMessage.reply.result.payload );
                    }
                    delete _replyHandlers[serverMessage.inReplyTo];
                } else if (serverMessage.reply.type == barobo.rpc.Reply.Type.VERSIONS) {
                    if(_callbacks.hasOwnProperty('connect')) {
                        _callbacks['connect'](null);
                    }
                }
            } else if (serverMessage.type == barobo.rpc.ServerMessage.Type.BROADCAST) {
                if(_callbacks.hasOwnProperty('broadcast')) {
                    _callbacks['broadcast'](serverMessage.broadcast);
                }
            }
        });

        function handshake() {
            if(connection.connected) {
                // Send ribbon-bridge connect message
                connect_msg = new barobo.rpc.ClientMessage({
                    'id':_msgId,
                    'request': {
                        'type':barobo.rpc.Request.Type.CONNECT
                    }
                });
                _replyHandlers[_msgId] = {
                    'name':null, 
                    'cb': (function(obj) {}),
                };
                connection.sendBytes(connect_msg.toBuffer());
                _connection = connection;
                _msgId += 1;
            }
        }
        handshake();
    });

    this.connect = function(uri, callback) {
        _callbacks['connect'] = callback;
        ws_client.connect(uri, null);
    }

    this.fire = function(rpcName, payload, callback) {
        console.log('Fire: ' + rpcName);
        fire_msg = new barobo.rpc.ClientMessage({
            'id':_msgId,
            'request': {
                'type':barobo.rpc.Request.Type.FIRE,
                'fire': {
                    'id': hash(rpcName),
                    'payload': payload
                }
            }
        });
        _replyHandlers[_msgId] = {'name':rpcName, 'cb':callback};
        _msgId += 1;
        _connection.sendBytes(fire_msg.toBuffer());
    }

    this.on = function(event_name, callback) {
        assert( _valid_callbacks.indexOf(event_name) >= 0 );
        _callbacks[event_name] = callback;
    }

    var mkProxy = (function(protobufObj, augment_object) {
        // Loop through all properties of protobufObj . If there are properties
        // with both "In" and "Result" objects, they are RPC messages.
        for (var property in protobufObj) {
            if(protobufObj.hasOwnProperty(property)) {
                if ( (protobufObj[property].hasOwnProperty('In')) && 
                     (protobufObj[property].hasOwnProperty('Result'))) {
                     // "property" is an RPC message
                     augment_object[property] = (function(proxy, protobufObj, property) {
                         // arg_obj must be an object that complies with the "In"
                         // message format
                         //
                         // The reply_callback will be called when a reply is
                         // received with a single argument that contains the
                         // "Result" object
                         return function(arg_obj, reply_callback) {
                             var payload_obj = new protobufObj[property]['In'](arg_obj);
                             proxy.fire(property, payload_obj.toBuffer(), reply_callback);
                         }
                     })(augment_object, protobufObj, property);
                }
            }
        }
    })(protobufObj, this);
    return this;
}

var loadProtoFile = function(filename) {
    var rb = new RibbonBridge;
};

module.exports.RibbonBridge = RibbonBridge
module.exports.hash = hash
