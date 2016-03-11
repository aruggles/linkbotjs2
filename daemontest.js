var async = require('async');

var daemon_module = require('./daemon.js');

async.waterfall([
        function(callback) {
            daemon_module.connect('ws://localhost:42000', callback);
        },
        function(daemon, callback) {
            daemon.resolveSerialId({'serialId':{'value':'DGKR'}}, callback);
        },
        function(endpoint, callback) {
            console.log(endpoint);
        }
]);

/*
var daemon = daemon_module.connect('ws://localhost:42000', function(err, daemon) {
            daemon.resolveSerialId({'serialId':{'value':'DGKR'}}, function(err, reply) {
                console.log(reply);
            });
        });
        */
