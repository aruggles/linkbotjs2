
var ProtoBuf = require('protobufjs');
var RibbonBridge = require('./ribbon-bridge.js');

var connect = (function() {
    var builder = ProtoBuf.loadProtoFile('proto/daemon.proto');
    var daemon_pb = builder.build('barobo.Daemon');
    var proxy = new RibbonBridge.RibbonBridge(daemon_pb);

    return function(uri, completion_callback) {
        proxy.connect(uri, 
            function(reply) {
                completion_callback(proxy);
            });
        return proxy;
    };
})();

module.exports.connect = connect;
