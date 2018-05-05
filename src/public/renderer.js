/*global window, document, TextDecoder, setTimeout, console, PIXI*/
(function() {
    // Matter.js module aliases
    var q = require("q");
    var Matter = require("matter-js");
    var Engine = require("./engine");
    var Networking = require("./networking");
    var Helpers = require("./helpers");
    var raf = require("raf");
    require("../../node_modules/pixi.js/dist/pixi.min.js");

    var clientMessages = [];
    var serverMessages = [];
    var moving = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    var engine;
    var engineCreatedDeferred = q.defer();
    var engineCreatedPromise = engineCreatedDeferred.promise;
    var player;
    var mouseX = 0;
    var mouseY = 0;
    var angle = 0;
    var bodies = [];

    var networkPromise = new Networking(
        {
            onMessage: function(data) {
                var parsed = JSON.parse(data);
                if (parsed.uuid) {
                    player = parsed.uuid;
                } else {
                    clientMessages.push(parsed);
                }
            }
        },
        {
            onConnection: function(client) {
                engineCreatedPromise.then(function() {
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
        }
    );
    networkPromise.then(function(network) {
        engine = new Engine(
            function(engine) {
                //update world
                //get last message to client and update the clients state from the server state
                var lastMessage = clientMessages[clientMessages.length - 1];
                var state = lastMessage ? lastMessage.s : undefined;
                if (state) {
                    engine.applyWorldState(state, player);
                }
                clientMessages = [];

                bodies = engine.world.bodies;

                //update all the players' states on the server
                if (network.server) {
                    serverMessages.forEach(function(message) {
                        if (message.uuid !== player.uuid) {
                            engine.applyPlayerState(message);
                        }
                    });
                }

                // change things according to user input
                var netXV = 0;
                var netYV = 0;
                // if (moving.up) netYV -= 0.15;
                // if (moving.down) netYV += 0.15;
                if (moving.left) netXV -= 0.15;
                if (moving.right) netXV += 0.15;
                if (player) {
                    if (player.uuid) {
                        Matter.Body.set(player, "angle", angle);
                        Matter.Body.set(player, "position", {
                            x: player.position.x + netXV * (engine.timing.time - engine.timing.lastTime),
                            y: player.position.y + netYV * (engine.timing.time - engine.timing.lastTime)
                        });
                        if (moving.up) {
                            Matter.Body.applyForce(player, player.position, { x: 0, y: -0.00005 })
                        }
                    } else {
                        var found = engine.getBodyByUUID(player);
                        if (found) {
                            player = found;
                        } else {
                            player = Matter.Bodies.rectangle(150, 150, 19, 43);
                            player.uuid = Helpers.getUUID();
                            engine.addBody(player);
                        }
                    }
                }
                serverMessages = [];
            },
            function(engine) {
                if (player && player.id && player.serialize) {
                    var playerState = {
                        ts: Date.now(),
                        s: player.serialize()
                    };
                    player.states ? player.states.push(playerState) : (player.states = [playerState]);
                    player.states.splice(0, player.states.length - 30);
                    network.client.send(JSON.stringify(playerState));
                }
                if (network.server) {
                    var state = engine.getWorldState();
                    network.server.clients.forEach(function(client) {
                        client.send(
                            JSON.stringify({
                                ts: Date.now(),
                                s: state
                            })
                        );
                    });
                }
            }
        );

        engineCreatedDeferred.resolve();

        if (network.server) {
            var wall = Matter.Bodies.rectangle(0, 550, 550 * 3, 100);
            Matter.Body.setStatic(wall, true);
            engine.addBody(wall);

            for (var i = 0; i < 10; i += 1) {
                wall = Matter.Bodies.rectangle(Helpers.rand(0, 800), Helpers.rand(0, 800), 19, 43);
                engine.addBody(wall);
            }
        }
    });

    // var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { backgroundColor: 0x1099bb });
    // var stage = new PIXI.Container();
    // document.body.appendChild(renderer.view);
    //
    // var imageUrl = "../sprites/PNG/Hitman 1/hitman1_gun.png";
    // var textures = {
    //     player: PIXI.Texture.fromImage(imageUrl)
    // }
    //
    // var createSpriteObject = function(body) {
    //     // create a new Sprite using the texture
    //     var sprite = new PIXI.Sprite(textures.player);
    //     sprite.height = 43;
    //     sprite.width = 49;
    //     // center the sprite's anchor point
    //     sprite.anchor.x = 0.38775510204;
    //     sprite.anchor.y = 0.5;
    //     // move the sprite to the center of the screen
    //     sprite.position = body.position;
    //     sprite.rotation = body.angle;
    //     return sprite;
    // };
    //
    // var pixiMap = {};
    // // start animating
    // var animate = function() {
    //     raf(animate);
    //     if (player && player.position) {
    //         stage.pivot.x = player.position.x - renderer.view.width / 2;
    //         stage.pivot.y = player.position.y - renderer.view.height / 2;
    //     }
    //
    //     bodies.forEach(function(body) {
    //         if(pixiMap[body.id]){
    //             pixiMap[body.id].position = body.position;
    //             pixiMap[body.id].rotation = body.angle;
    //         }else{
    //             pixiMap[body.id] = createSpriteObject(body);
    //             stage.addChild(pixiMap[body.id]);
    //         }
    //     });
    //     // render the container
    //     renderer.render(stage);
    // };
    // animate();

    // renderer.view.onmousemove = function(e) {
    //     if (player) {
    //         mouseX = player.position.x + (e.offsetX - renderer.view.width / 2);
    //         mouseY = player.position.y + (e.offsetY - renderer.view.height / 2);
    //         angle = Math.atan2(mouseY - player.position.y, mouseX - player.position.x);
    //     }
    // };

    window.onkeypress = function(e){
        console.log(e)
;        if (e.key.toLowerCase() === "w") {
            moving.up = true;
        }
    };

    window.onkeydown = function(e) {
     if (e.key.toLowerCase() === "a") {
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

    window.onresize = function() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        //this part resizes the canvas but keeps ratio the same
        renderer.view.style.width = w + "px";
        renderer.view.style.height = h + "px";
        //this part adjusts the ratio:
        renderer.resize(w, h);
    };
})();
