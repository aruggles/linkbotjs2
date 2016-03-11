var daemon_module = require('./daemon.js');
var daemon = daemon_module.connect('ws://localhost:42000', function(daemon) {
            daemon.resolveSerialId({'serialId':{'value':'DGKR'}}, function(reply) {
                console.log(reply);
            });
        });
