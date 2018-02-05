/*global window, document, TextDecoder, setTimeout, console*/
(function() {
    module.exports = function(beforeCallback, afterCallback) {
        var raf = require("raf");
        var Matter = require("matter-js");

        // create a Matter.js engine

        var engine = Matter.Engine.create();
        engine.world.gravity.y = 0;
        // create a Matter.js renderer
        var render = Matter.Render.create({
            element: document.body,
            engine: engine
        });

        Matter.Engine.run(engine);
        Matter.Render.run(render);

        var animate = function() {
            raf(animate);
            if (beforeCallback) {
                beforeCallback(engine);
            }
            Matter.Engine.update(engine, 1000 / 60);
            if (afterCallback) {
                afterCallback(engine);
            }
        };
        animate();

        return {
            addBody: function(body) {
                Matter.World.add(engine.world, body);
            },
            applyForce: function(body, force) {
                Matter.Body.applyForce(body, body.position, force);
            }
        };
    };
})();
