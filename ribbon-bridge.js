var pb = require("protobufjs");
var WebSocketClient = require("websocket").client;

var RibbonBridge = (function() {
    var _msgId = 1;
    var _replyHandlers = {};
    var _connection = null;
    // Initialize protobuf
    builder = pb.loadProtoFile('proto/rpc.proto');
    barobo = builder.build('barobo');

    // initialize websockets
    ws_client = new WebSocketClient();
    ws_client.on('connectFailed', function(error) {
        console.log('WS Connect error: ' + error.toString());
    });

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
            console.log(serverMessage.type);
        });

        function handshake() {
            if(connection.connected) {
                // Send ribbon-bridge connect message
                connect_msg = new barobo.rpc.ClientMessage({
                    'id':5,
                    'request': {
                        'type':barobo.rpc.Request.Type.CONNECT
                    }
                });
                console.log('Sending rpc handshake...');
                connection.sendBytes(connect_msg.toBuffer());
                _connection = connection;
            }
        }
        handshake();
    });

    var connect = function(uri) {
        ws_client.connect(uri, null);
    }

    var fire = function(rpcName, payload, callback) {
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
        _replyHandlers[_msgId] = callback;
        _msgId += 1;
        _connection.sendBytes(fire_msg.toBuffer());
    }

    return { connect: connect, 
             fire: fire,
    };
}());

module.exports.RibbonBridge = RibbonBridge
