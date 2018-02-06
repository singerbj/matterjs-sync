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

        engine.addBody = function(body) {
            console.log(body);
            body.serialize = serialize;
            Matter.World.add(engine.world, body);
        };
        engine.applyForce = function(body, force) {
            Matter.Body.applyForce(body, body.position, force);
        };
        engine.getWorldState = function(){
            return engine.world.bodies.map(function(body){
                return body.serialize();
            });
        };

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

        var serialize = function(){
            return {
                i: this.id,
                p: this.position,
                a: this.angle,
                v: this.v,
                av: this.angularVelocity
            };
        };

        return engine;
    };
})();
