/*global window, document, TextDecoder, setTimeout, console */
(function() {
    var WebSocket = require("ws");
    var q = require("q");
    module.exports = function(onClientMessage, onServerMessage) {
        var deferred = q.defer();
        var server;
        var startServer = function() {
            server = new WebSocket.Server({
                port: 6574
            });
            server.on("connection", function(c) {
                c.on("message", function(data) {
                    if (onClientMessage) {
                        onClientMessage(data);
                    }
                });
                c.once("close", function() {
                    console.log("close");
                });
                c.on("error", function(err) {
                    console.log(err);
                });

                deferred.resolve({
                    client: client,
                    server: server
                });
            });
        };

        var client = new WebSocket("ws://127.0.0.1:6574");
        client.on("error", function() {
            console.log("Error connecting to server...starting one.");
            startServer();
            deferred.resolve({
                client: client,
                server: server
            });
        });
        client.on("open", function() {
            console.log("Connected");
            client.on("message", function(data) {
                if (onServerMessage) {
                    onServerMessage(data);
                }
            });
            client.on("close", function() {
                console.log("Connection closed");
            });
        });

        return deferred.promise;
    };
})();
