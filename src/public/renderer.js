/*global window, document, TextDecoder, setTimeout, console*/
(function() {
    // Matter.js module aliases
    var q = require("q");
    var Matter = require("matter-js");
    var Engine = require("./engine");
    var Networking = require("./networking");
    var Helpers = require("./helpers");
    var raf = require("raf");
    require('../../node_modules/pixi.js/dist/pixi.min.js');

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
    var mouseX = 0;
    var mouseY = 0;
    var bodies = [];

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
                var newPlayer = Matter.Bodies.rectangle(150, 150, 19, 43);
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

            bodies = engine.world.bodies;

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
                    // Matter.Body.set(player, 'velocity', {
                    //     x: netXV,
                    //     y: netYV
                    // });
                    Matter.Body.applyForce(player, player.position, {
                        x: netXV / 25000,
                        y: netYV / 25000
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
            for(var i = 0; i < 10; i+=1){
                engine.addBody(Matter.Bodies.rectangle(rand(0,800), rand(0,500), 19, 43));
            }
        }
    });

    var renderer = PIXI.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});
    var stage = new PIXI.Container();
    document.body.appendChild(renderer.view);

    var imageUrl = '../sprites/PNG/Hitman 1/hitman1_gun.png';
    var texture = PIXI.Texture.fromImage(imageUrl);

    var createSpriteObject = function (body) {
    	// create a new Sprite using the texture
    	var sprite = new PIXI.Sprite(texture);
        sprite.height = 43;
        sprite.width = 49;

    	// center the sprite's anchor point
    	sprite.anchor.x = 0.38775510204;
    	sprite.anchor.y = 0.5;
    	// move the sprite to the center of the screen
    	sprite.position = body.position;
        sprite.rotation = body.angle;

    	return sprite;
    };

    // start animating
    var animate = function () {
        raf(animate);
    	// for(var b in bunnies) {
    	// 	bunnies[b].sprite.position = bunnies[b].body.position;
    	// 	bunnies[b].sprite.rotation = bunnies[b].body.angle;
    	// }
        for (var i = stage.children.length - 1; i >= 0; i--) {	stage.removeChild(stage.children[i]);};
        bodies.forEach(function(body){
            stage.addChild(createSpriteObject(body));
        });
    	// render the container
    	renderer.render(stage);
    };
    animate();

    window.onmousemove = function (e) {
        mouseX = e.offsetX * window.devicePixelRatio;
        mouseY = e.offsetY * window.devicePixelRatio;
    };

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
