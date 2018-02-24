/*global window, document, TextDecoder, setTimeout, console*/
(function() {
    // Matter.js module aliases
    var q = require("q");
    var Matter = require("matter-js");
    var Engine = require("./engine");
    var Networking = require("./networking");
    var Helpers = require("./helpers");

    var clientMessages = [];
    var serverMessages = [];
    var moving = {
        up: false,
        down:false,
        left: false,
        right: false
    };
    var engine;
    var engineCreatedDeferred = q.defer();
    var engineCreatedPromise = engineCreatedDeferred.promise;
    var player;

    var networkPromise = new Networking({
        onMessage: function(data) {
            var parsed = JSON.parse(data);
            if(parsed.uuid){
                player = parsed.uuid;
            }else{
                clientMessages.push(parsed);
            }
        }
    }, {
        onConnection: function(client){
            engineCreatedPromise.then(function(){
                var newPlayer = Matter.Bodies.circle(150, 150, 20);
                newPlayer.uuid = Helpers.getUUID();
                client.uuid = newPlayer.uuid;
                engine.addBody(newPlayer);
                client.send(JSON.stringify({ uuid: newPlayer.uuid }));
            });
        },
        onMessage: function(data) {
            serverMessages.push(JSON.parse(data));
        }
    });
    networkPromise.then(function(network) {
        engine = new Engine(function(engine){
            //update world
            //get last message to client and update the clients state from the server state
            var lastMessage = clientMessages[clientMessages.length - 1];
            var state = lastMessage ? lastMessage.s : undefined;
            if(state){
                engine.applyWorldState(state, player);
            }
            clientMessages = [];

            //update all the players' states on the server
            if(network.server){
                serverMessages.forEach(function(message){
                    if(message.uuid !== player.uuid){
                        engine.applyPlayerState(message);
                    }
                });
            }

            // change things according to user input
            var netXV = 0;
            var netYV = 0;
            if(moving.up) netYV -= 0.5;
            if(moving.down) netYV += 0.5;
            if(moving.left) netXV -= 0.5;
            if(moving.right) netXV += 0.5;
            if(player){
                if(player.uuid){
                    Matter.Body.set(player, 'velocity', {
                        x: netXV,
                        y: netYV
                    });
                } else {
                    var found = engine.getBodyByUUID(player);
                    if(found){
                        player = found;
                    }else{
                        console.log('error finding player body');
                    }
                }
            }
            serverMessages = [];
        }, function(engine){
            if(player && player.id && player.serialize){
                var playerState = {
                    ts: Date.now(),
                    s: player.serialize()
                };
                player.states ? player.states.push(playerState) : player.states = [playerState];
                player.states.splice(0, player.states.length - 30);
                network.client.send(JSON.stringify(playerState));
            }
            if(network.server){
                var state = engine.getWorldState();
                network.server.clients.forEach(function(client){
                    client.send(JSON.stringify({
                        ts: Date.now(),
                        s: state
                    }));
                });
            }
        });

        engineCreatedDeferred.resolve();

        if(network.server){
            var rand = function (min, max) {
                return Math.floor(Math.random() * (max - min)) + min;
            };
            for(var i = 0; i < 100; i+=1){
                engine.addBody(Matter.Bodies.circle(rand(0,800), rand(0,500), 20));
            }
        }
    });

    window.onkeydown = function(e) {
        if (e.key.toLowerCase() === "w") {
            moving.up = true;
        } else if (e.key.toLowerCase() === "a") {
            moving.left = true;
        } else if (e.key.toLowerCase() === "s") {
            moving.down = true;
        } else if (e.key.toLowerCase() === "d") {
            moving.right = true;
        }
    };

    window.onkeyup = function(e) {
        if (e.key.toLowerCase() === "w") {
            moving.up = false;
        } else if (e.key.toLowerCase() === "a") {
            moving.left = false;
        } else if (e.key.toLowerCase() === "s") {
            moving.down = false;
        } else if (e.key.toLowerCase() === "d") {
            moving.right = false;
        }
    };
})();
