/*global window, document, TextDecoder, setTimeout, console */
(function() {
    var WebSocket = require("ws");
    var q = require("q");

    var networkSetup = function(clientFunctions, serverFunctions, startServer) {
        var deferred = q.defer();
        var server;
        if(startServer){
            server = new WebSocket.Server({
                port: 6574
            });
            server.on("connection", function(client) {
                if (serverFunctions && serverFunctions.onConnection) {
                    serverFunctions.onConnection(client);
                }
                client.on("message", function(data) {
                    if (serverFunctions && serverFunctions.onMessage) {
                        serverFunctions.onMessage(data);
                    }
                });
                client.once("close", function() {
                    console.log("close");
                    if (serverFunctions && serverFunctions.onClose) {
                        serverFunctions.onClose();
                    }
                });
                client.on("error", function(err) {
                    console.log(err);
                    if (serverFunctions && serverFunctions.onError) {
                        serverFunctions.onError(err);
                    }
                });
            });
        }

        var client = new WebSocket("ws://127.0.0.1:6574");
        client.on("error", function() {
            console.log("Error connecting to server...starting one.");
            networkSetup(clientFunctions, serverFunctions, true).then(function(network){
                deferred.resolve(network);
            });
        });
        client.on("open", function() {
            console.log(client);
            console.log("Connected");
            if (clientFunctions && clientFunctions.onConnection) {
                clientFunctions.onConnection();
            }
            client.on("message", function(data) {
                if (clientFunctions && clientFunctions.onMessage) {
                    clientFunctions.onMessage(data);
                }
            });
            client.on("close", function() {
                console.log("Connection closed");
                if (clientFunctions && clientFunctions.onClose) {
                    clientFunctions.onClose();
                }
            });
            deferred.resolve({
                client: client,
                server: server
            });
        });

        return deferred.promise;
    };

    module.exports = function(onClientMessage, onServerMessage){
        return networkSetup(onClientMessage, onServerMessage);
    };
})();
