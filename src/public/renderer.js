/*global window, document, TextDecoder, setTimeout, console*/
(function() {
    // Matter.js module aliases
    var Matter = require("matter-js");
    var Engine = require("./engine");
    var Networking = require("./networking");

    var engine = new Engine();
    var networkPromise = new Networking(
        function(data) {
            console.log(data);
        },
        function(data) {
            console.log(data);
        }
    );
    networkPromise.then(function(network) {
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
