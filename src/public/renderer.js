/*global window, document, TextDecoder, setTimeout, console*/
(function() {
    // Matter.js module aliases
    var Matter = require("matter-js");
    var Engine = require("./engine");
    var Networking = require("./networking");

    var clientMessages = [];
    var serverMessages = [];

    var networkPromise = new Networking(
        function(data) {
            clientMessages.push(JSON.parse(data));
        },
        function(data) {
            serverMessages.push(JSON.parse(data));
        }
    );
    networkPromise.then(function(network) {
        var engine = new Engine(function(engine){
            //update world

            //get last message to client and update the clients state from the server state
        }, function(engine){
            if(network.server){
                var state = engine.getWorldState();
                console.log(state);
                network.server.clients.forEach(function(client){
                    client.send(JSON.stringify(state));
                });
            }
        });

        console.log(network);

        var player = Matter.Bodies.circle(50, 50, 20);
        engine.addBody(player);

        window.onkeypress = function(e) {
            if (e.key === "w") {
                engine.applyForce(player, {
                    x: 0,
                    y: -0.001
                });
            } else if (e.key === "a") {
                engine.applyForce(player, {
                    x: -0.001,
                    y: 0
                });
            } else if (e.key === "s") {
                engine.applyForce(player, {
                    x: 0,
                    y: 0.001
                });
            } else if (e.key === "d") {
                engine.applyForce(player, {
                    x: 0.001,
                    y: 0
                });
            }
        };
    });
})();
