function game(info){

//For debugging purposes
game.info = info;


var animationId;
var player;
var input = new KeyboardInterface(info.dicts.defaultKeybind);

var activeWorld;
var activeRoom;

var exitZones = [];
var camera;
var roomEntities;

var processStack;

var debugPause = false;

function _debugPause() {
        if (!debugPause) {
                processStack.push(function() { return undefined; }, true, 0, 0);
                debugPause = true;
        }
}

function _debugResume() {
        if (debugPause) {
                processStack.pop(0);
                debugPause = false;
        }
}

game.pause = _debugPause;
game.resume = _debugResume;

function start() {
        player = new info.entities.player(0, 0, input);
        processStack = new ProcessStack();

        info.ps = processStack;

        var initialWorld = info.worlds[info.dicts.constants.STARTING_WORLD_ID];
        var initialEntrance = initialWorld.entrances[info.dicts.constants.STARTING_ENTRANCE_ID];
        
        enterWorld(initialWorld, initialEntrance);
        
        processStack.push(coreStep, false, 0, 0);

        animationId = window.requestAnimationFrame(step);
}

function enterWorld(world, entrance) {
        processStack.push(function(){ return undefined; }, true, 0, 0);
        var room = entrance.room;
        var zone = entrance.zone;

        activeWorld = world;
        
        info.draw.initWorld(world.background, world.tilesheet);
        info.audio.start(world.music, "music", "song");

        enterRoom(room, zone);
        processStack.pop(0);
}

function enterRoom(room, zone) {
        processStack.push(function() { return undefined; }, true, 0, 0);
        activeRoom = room;

        player.x = zone.bl.x;
        player.y = zone.bl.y;
        
        roomEntities = {};
        roomEntities["player"] = player;
        for (entityInstanceId in room.entities) {
                var inst = room.entities[entityInstanceId];
                var entity = new info.entities[inst.entityId](inst.x, inst.y, inst.z);
                roomEntities[entityInstanceId] = entity;
        }

        exitZones = [];

        //getting world exits
        for (zone in room.zones) {
                var exit = activeWorld.exits[[room.id, room.zones[zone].id]];
                if (exit != undefined) {
                        exitZones.push(new WorldExit(exit, room.zones[zone]));
                }
        }

        for (zone in room.zones) {
                var exit = activeWorld.connections[[room.id, room.zones[zone].id]];
                if (exit != undefined) {
                        exitZones.push(new RoomExit(exit, room.zones[zone]));
                }
        }

        camera = new info.camera(room, player);

        info.draw.initRoom(room, camera);

        processStack.pop(0);
}

function step() {
        processStack.call();        
        // Call next frame
        animationId = window.requestAnimationFrame(step);
}

function coreStep() {
        // Naive physics simulation(no collisions) + animation updates
        for (entity in roomEntities) {
                roomEntities[entity].step();
        }

        // Collision detection and handling
        var collisions = getCollisions(activeRoom.tileBoxes);
        handleCollisions(collisions);

        playerBox = player.getBox();
        for (exit in exitZones) {
                if (checkOverlap(playerBox, exitZones[exit].zone)) {
                        exitZones[exit].onCollide();
                        return;
                }
        }

        // Update Camera
        camera.updateCenter();

        // Render frame
        info.draw.startFrame();
        for (entity in roomEntities) {
                info.draw.drawEntity(roomEntities[entity]);
        }
        info.draw.endFrame();

}

function getCollisions(boxes) {
        var playerBox = player.getBox();
        
        var collisions = [];

        for (var i = 0; i < boxes.length; i++) {
                if (checkOverlap(playerBox, boxes[i])) {
                        collisions.push(boxes[i]);
                }
        }

        return collisions;
}

function handleCollisions(collisions) {
        var sideCollide = false;
        var lastStep = player.lastStep;
        for (var i = 0; i < collisions.length; i++) {
                if (lastStep.y >= collisions[i].tr.y
                && (lastStep.x < collisions[i].tr.x
                && lastStep.x + player.width > collisions[i].bl.x)) {
                        player.collide({
                                "obstruct" : true,
                                "side" : "bottom",
                                "y" : collisions[i].tr.y
                        });
                        sideCollide = true;
                }
                else if (lastStep.y + player.height <= collisions[i].bl.y
                && (lastStep.x < collisions[i].tr.x
                && lastStep.x + player.width > collisions[i].bl.x)) {
                        player.collide({
                                "obstruct" : true,
                                "side" : "top",
                                "y" : collisions[i].bl.y
                        });
                        sideCollide = true;
                }
                else if (lastStep.x >= collisions[i].tr.x
                && (lastStep.y < collisions[i].tr.y
                && lastStep.y + player.height > collisions[i].bl.y)) {
                        player.collide({
                                "obstruct" : true,
                                "side" : "left",
                                "x" : collisions[i].tr.x
                        });
                        sideCollide = true;
                }
                else if (lastStep.x + player.width <= collisions[i].bl.x
                && (lastStep.y < collisions[i].tr.y
                && lastStep.y + player.height > collisions[i].bl.y)) {
                        player.collide({
                                "obstruct" : true,
                                "side" : "right",
                                "x" : collisions[i].bl.x
                        });
                        sideCollide = true;
                }
        }
        
        //handle corner collisions
        if (!sideCollide) {
                for (var i = 0; i < collisions.length; i++) {
                        if (lastStep.y >= collisions[i].tr.y) {
                                player.collide({
                                        "obstruct" : true,
                                        "side" : "bottom",
                                        "y" : collisions[i].tr.y
                                });
                        }
                        else if (lastStep.y + player.height <= collisions[i].bl.y) {
                                player.collide({
                                        "obstruct" : true,
                                        "side" : "top",
                                        "y" : collisions[i].bl.y
                                });
                        }
                }
        }
}

function checkOverlap(box1, box2) {
        return  box1.bl.x < box2.tr.x &&
                box1.tr.x > box2.bl.x &&
                box1.bl.y < box2.tr.y &&
                box1.tr.y > box2.bl.y;
}

function WorldExit(exit, zone) {
        this.zone = zone;
        this.exit = exit;
        this.onCollide = function() {
                enterWorld(this.exit.world, this.exit.entrance);        
        }
}

function RoomExit(exit, zone) {
        this.zone = zone;
        this.exit = exit;
        this.onCollide = function() {
                enterRoom(this.exit.room, this.exit.zone);
        }
}

start();
}
