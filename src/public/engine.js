/*global window, document, TextDecoder, setTimeout, console*/
(function() {
    module.exports = function(beforeCallback, afterCallback) {
        var raf = require("raf");
        var Matter = require("matter-js");

        // create a Matter.js engine

        var engine = Matter.Engine.create();
        engine.world.gravity.y = 0;
        // create a Matter.js renderer
        // var render = Matter.Render.create({
        //     element: document.body,
        //     engine: engine
        // });

        Matter.Engine.run(engine);
        // Matter.Render.run(render);

        engine.addBody = function(body) {
            body.serialize = serialize;
            Matter.World.add(engine.world, body);
        };
        engine.getBodyByUUID = function(uuid){
            var body = engine.world.bodies.filter(function(body){
                return body.uuid === uuid;
            })[0];
            if(body){
                body.serialize = serialize;
            }
            return body;
        };
        engine.applyForce = function(body, force) {
            Matter.Body.applyForce(body, body.position, force);
        };
        engine.getWorldState = function(){
            return engine.world.bodies.map(function(body){
                return body.serialize();
            });
        };
        engine.applyWorldState = function(state, player){
            var newBody, found;
            state.forEach(function(body){
                if(!player || (player && !player.uuid) || (player && player.uuid && body.uuid !== player.uuid)){
                    found = Matter.Composite.get(engine.world, body.i, body.t);
                    if(found){
                        if(!found.lastUpdate || found.lastUpdate < state.ts){
                            found.lastUpdate = state.ts;
                            Matter.Body.set(found, 'position', body.p);
                            Matter.Body.set(found, 'angle', body.a);
                            Matter.Body.set(found, 'velocity', body.v);
                            Matter.Body.set(found, 'angularVelocity', body.av);
                            found.uuid = body.uuid;
                        }
                    }else{
                        newBody = Matter.Bodies.rectangle(body.p.x, body.p.y, 19, 43);
                        newBody.lastUpdate = state.ts;
                        Matter.Body.set(newBody, 'angle', body.a);
                        Matter.Body.set(newBody, 'velocity', body.v);
                        Matter.Body.set(newBody, 'angularVelocity', body.av);
                        newBody.uuid = body.uuid;
                        body.serialize = serialize;
                        Matter.World.add(engine.world, newBody);
                    }
                }
            });
        };

        engine.applyPlayerState = function(message){
            var found = Matter.Composite.get(engine.world, message.s.i, message.s.t);
            if(found){
                found.lastUpdate = message.ts;
                Matter.Body.set(found, 'position', message.s.p);
                Matter.Body.set(found, 'angle', message.s.a);
                Matter.Body.set(found, 'velocity', message.s.v);
                //Matter.Body.set(found, 'velocity', {
                //     x: 100 * Math.sin(engine.timing.timestamp * message.s.v.x),
                //     y: 100 * Math.sin(engine.timing.timestamp * message.s.v.y)
                // });
                Matter.Body.set(found, 'angularVelocity', message.s.av);
            }
        };

        var lastTimeFps;
        var fps = -1;
        var lastFpsDraw = Date.now();
        var currentTime;
        var animate = function() {
            if (beforeCallback) {
                beforeCallback(engine);
            }
            Matter.Engine.update(engine);
            if (afterCallback) {
                afterCallback(engine);
            }
            currentTime = Date.now();
            if (lastTimeFps && (currentTime - lastFpsDraw) > 500) {
                lastFpsDraw = currentTime;
                fps = Math.floor(1000 / (currentTime - lastTimeFps));
            }
            lastTimeFps = currentTime;
            raf(animate);
        };
        animate();

        var serialize = function(){
            return {
                uuid: this.uuid,
                i: this.id,
                p: this.position,
                a: this.angle,
                v: this.velocity,
                av: this.angularVelocity,
                t: this.type
            };
        };

        return engine;
    };
})();
