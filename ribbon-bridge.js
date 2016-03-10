var pb = require("protobufjs");
var WebSocketClient = require("websocket").client;

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
    var _msgId = 10;
    var _replyHandlers = {};
    var _connection = null;
    var _proxyProtoBuf = protobufObj;
    var _valid_callbacks = [
        'connect',
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
            console.log('Received message from remote host.');
            serverMessage = barobo.rpc.ServerMessage.decode(message.binaryData);
            console.log(serverMessage);
            console.log(serverMessage.type);
            console.log(_callbacks);
            if(
                (serverMessage.type == barobo.rpc.ServerMessage.Type.REPLY) 
                ) 
            {
                if(serverMessage.reply.type == barobo.rpc.Reply.RESULT) {
                    console.log('Got reply result.');
                    if (_replyHandlers[serverMessage.inReplyTo]['name'] != null) {
                        result = _proxyProtoBuf[_replyHandlers[serverMessage.inReplyTo]['name']]['Result']();
                        result.decode(serverMessage.reply.result.payload);
                        _replyHandlers[serverMessage.inReplyTo]['cb'](result);
                    } else {
                        _replyHandlers[serverMessage.inReplyTo]['cb'](
                            serverMessage.reply.result.payload );
                    }
                    delete _replyHandlers[serverMessage.inReplyTo];
                } else if (serverMessage.reply.type == barobo.rpc.Reply.Type.VERSIONS) {
                    console.log('Checking connect callback...');
                    if(_callbacks.hasOwnProperty('connect')) {
                        console.log('Calling connect callback...');
                        _callbacks['connect']();
                    }
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
                console.log('Sending rpc handshake...');
                connection.sendBytes(connect_msg.toBuffer());
                _connection = connection;
            }
        }
        handshake();
    });

    this.connect = function(uri, callback) {
        _callbacks['connect'] = callback;
        ws_client.connect(uri, null);
    }

    this.fire = function(rpcName, payload, callback) {
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
        assert( event_name in _valid_callbacks );
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

}

var loadProtoFile = function(filename) {
    var rb = new RibbonBridge;
};

module.exports.RibbonBridge = RibbonBridge
