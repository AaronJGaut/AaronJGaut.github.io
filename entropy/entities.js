function getEntityFactory(attributes, constants, audioManager) {
        function EntityCommon(x, y, z) {
                
                this.x = x;
                this.y = y;
                
                if (z !== undefined) {
                        this.zIndex = z;
                }

                this.vx = 0;
                this.vy = 0;

                this.animationFrame = 0;

                this.getBox = function() {
                        return {
                                "bl" : {
                                        "x" : this.x,
                                        "y" : this.y
                                },
                                "tr" : {
                                        "x" : this.x + this.width,
                                        "y" : this.y + this.height,
                                }
                        };
                };

                this.getSpriteCoord = function() {
                        var frameArray = this.spriteCoords[this.animationState];
                        var totalTime = 0;
                        for (var i = 0; i < frameArray.length; i++) {
                                totalTime += frameArray[i].time;
                        }

                        var modFrame = this.animationFrame % totalTime;

                        for (var i = 0; i < frameArray.length; i++) {
                                if (modFrame < frameArray[i].time) {
                                        return frameArray[i].coord;
                                } else {
                                        modFrame -= frameArray[i].time;
                                }
                        }

                };

                this.updateAnimationState = function(newState) {
                        if (this.animationState === newState) {
                                this.animationFrame++;
                        } else {
                                this.animationState = newState;
                                this.animationFrame = 0;
                        }
                };

                this.logCollision = function(collision) { return undefined; };
                this.handleCollisions = function() { return undefined; };
        }

        var entities = {};

        //entity classes start here
        entities.player = function(x, y, keyboard, z) {
                this.inherit = EntityCommon;
                this.inherit(x, y);

                this.keyboard = keyboard;
                this.onGround = true;
                this.MAX_JUMPS = 1;

                if (this.zLevel !== undefined) {
                        this.zLevel = z;
                }

                this.animationState = "standcenter";

                this.animationFrame = 0;
 
                this.midairJumps = this.MAX_JUMPS;

                this.getPhysicsSnapshot = function() {
                        return {
                                "onGround" : this.onGround,
                                "midairJumps" : this.midairJumps,
                                "x" : this.x,
                                "y" : this.y,
                                "vx" : this.vx,
                                "vy" : this.vy
                        };
                };

                this.determineAnimationState = function() {
                        var keys = this.lastInput;

                        switch (this.facing) {
                                case undefined: 
                                        if (this.onGround) {
                                                this.updateAnimationState("standcenter");
                                        } else {
                                                this.facing = "right";
                                                this.updateAnimationState("jumpright");
                                        }
                                        break;
                                case "left":
                                        if (this.onGround) {
                                                if (keys.left && !keys.right) {
                                                        this.updateAnimationState("walkleft");
                                                        if (keys.action1) {
                                                                this.animationFrame++;
                                                        }
                                                } else {
                                                        this.updateAnimationState("standleft");
                                                }
                                        } else {
                                                this.updateAnimationState("jumpleft");
                                        }
                                        break;
                                case "right":
                                        if (this.onGround) {
                                                if (keys.right && !keys.left) {
                                                        this.updateAnimationState("walkright");
                                                        if (keys.action1) {
                                                                this.animationFrame++;
                                                        }
                                                } else {
                                                        this.updateAnimationState("standright");
                                                }
                                        } else {
                                                this.updateAnimationState("jumpright");
                                        }
                                        break;
                        }
                };

                this.lastInput = keyboard.getSnapshot();
                this.lastStep = this.getPhysicsSnapshot();
                
                this.step = function() {
                        this.lastStep = this.getPhysicsSnapshot();
                        var keyInput = keyboard.getSnapshot();

                        //gravity
                        this.vy += constants.GRAVITY; 

                        //friction
                        if (this.onGround) {
                                this.vx *= 0.4;
                        } else {
                                this.vx *= 0.95;
                                this.vy *= 0.98;
                        }

                        //clean up tiny vx
                        if (Math.abs(this.vx) < 0.0001) {
                                this.vx = 0;
                        }

                        //letting go of jump key
                        if (this.lastInput.jump && !keyInput.jump && this.vy > 0) {
                                this.vy = 0;
                        }
                        
                        //pressing jump key
                        if (!this.lastInput.jump && keyInput.jump) {
                                audioManager.start(this.sfx.jump, "sound", null);
                                if (this.onGround) {
                                        this.vy += 0.35; 
                                }
                                else if (this.midairJumps > 0) {
                                        this.vy += 0.3;
                                        this.midairJumps--;
                                }
                        }

                        //pressing left key
                        if (keyInput.left && !keyInput.right) {
                                if (this.onGround) {
                                        if (keyInput.action1) {
                                                this.vx -= 0.1;
                                        } else {
                                                this.vx -= 0.055;
                                        }
                                } else {
                                        this.vx -= 0.008;
                                }
                        
                                this.facing = "left";
                        }

                        //pressing right key
                        if (keyInput.right && !keyInput.left) {
                                if (this.onGround) {
                                        if (keyInput.action1) {
                                                this.vx += 0.1;
                                        } else {
                                                this.vx += 0.055;
                                        }
                                } else {
                                        this.vx += 0.008;
                                }
                                
                                this.facing = "right";
                        }

                        //update position
                        this.x += this.vx;
                        this.y += this.vy;


                        //store input
                        this.lastInput = keyInput;
                
                        this.determineAnimationState();
                        
                        this.onGround = false;
                        this.sideCollide = false;
                        this.obstructCollisions = [];
                }

                this.obstruct = function(collisions) {
                        var lastStep = this.lastStep;
                        for (var i = 0; i < collisions.length; i++) {
                                if (lastStep.y >= collisions[i].tr.y
                                && (lastStep.x < collisions[i].tr.x
                                && lastStep.x + this.width > collisions[i].bl.x)) {
                                        this.vy = 0;
                                        this.y = collisions[i].tr.y;
                                        this.onGround = true;
                                        this.midairJumps = this.MAX_JUMPS;
                                        if (this.lastStep.y > this.y) {
                                                audioManager.start(this.sfx.land, "sound", null);
                                        }
                                        this.sideCollide = true;
                                }
                                else if (lastStep.y + this.height <= collisions[i].bl.y
                                && (lastStep.x < collisions[i].tr.x
                                && lastStep.x + this.width > collisions[i].bl.x)) {
                                        if (this.vy > 0) {
                                                this.vy *= -0.4;
                                        }
                                        this.y = collisions[i].bl.y-this.height;
                                        this.sideCollide = true;
                                }
                                else if (lastStep.x >= collisions[i].tr.x
                                && (lastStep.y < collisions[i].tr.y
                                && lastStep.y + this.height > collisions[i].bl.y)) {
                                        this.vx = 0;
                                        this.x = collisions[i].tr.x;
                                        this.sideCollide = true;
                                }
                                else if (lastStep.x + this.width <= collisions[i].bl.x
                                && (lastStep.y < collisions[i].tr.y
                                && lastStep.y + this.height > collisions[i].bl.y)) {
                                        this.vx = 0;
                                        this.x = collisions[i].bl.x-this.width;
                                        this.sideCollide = true;
                                }
                        }
                        
                        //handle corner collisions
                        if (!this.sideCollide) {
                                for (var i = 0; i < collisions.length; i++) {
                                        if (lastStep.y >= collisions[i].tr.y) {
                                                this.vy = 0;
                                                this.y = collisions[i].tr.y;
                                                this.onGround = true;
                                                this.midairJumps = this.MAX_JUMPS;
                                                if (this.lastStep.y > this.y) {
                                                        audioManager.start(this.sfx.land, "sound", null);
                                                }
                                        }
                                        else if (lastStep.y + this.height <= collisions[i].bl.y) {
                                                if (this.vy > 0) {
                                                        this.vy *= -0.4;
                                                }
                                                this.y = collisions[i].bl.y-this.height;
                                        }
                                }
                        }
                }

                this.logCollision = function(collision) {
                        if (collision.type === "wall") {
                                this.obstructCollisions.push(collision.getBox());
                        }
                };

                this.handleCollisions = function() {
                        this.obstruct(this.obstructCollisions); 
                };
        };

        entities.goomba = function(x, y) {
                this.inherit = EntityCommon;
                this.inherit(x, y);
                
                this.animationState = "standcenter";
                this.animationFrame = 0;

                this.step = function() { 
                        if (this.animationFrame > 9) {
                                switch(this.animationState) {
                                        case "standcenter" :
                                                this.animationState = "standright";
                                                break;
                                        case "standright" :
                                                this.animationState = "standleft";
                                                break;
                                        case "standleft" :
                                                this.animationState = "standright";
                                                break;
                                }
                                this.animationFrame=0;
                        }
                        else {
                                this.animationFrame++;
                        }
                }
        }
        //entity classes end here

        for (e in entities) {
                for (attr in attributes[e]) {
                        entities[e].prototype[attr] = attributes[e][attr];
                }
        }

        return entities;
}
