function game(info){

//For debugging purposes
game.info = info;

var dm = new DrawManager(info.dicts.constants);

var animationId;
var player;
var input = new KeyboardInterface(info.dicts.defaultKeybind);

var activeWorld;
var activeRoom;

var exitZones = [];
var camera;

function start() {
        var initialWorld = info.worlds[info.dicts.constants.STARTING_WORLD_ID];
        var initialEntrance = initialWorld.entrances[info.dicts.constants.STARTING_ENTRANCE_ID];

        player = new info.entities.player(0, 0, input);

        enterWorld(initialWorld, initialEntrance);
}

function startSteps() {
        if (animationId === undefined) {
                animationId = window.requestAnimationFrame(step);
        }
}

function stopSteps() {
        if (animationId != undefined) {
                window.cancelAnimationFrame(animationId);
        }
        animationId = undefined;
}
game.stop = stopSteps;

function enterWorld(world, entrance) {
        stopSteps();
        var room = entrance.room;
        var zone = entrance.zone;

        activeWorld = world;
        dm.initWorld(world.background, world.tilesheet);

        enterRoom(room, zone);
}

function enterRoom(room, zone) {
        stopSteps();

        activeRoom = room;

        player.x = zone.bl.x;
        player.y = zone.bl.y;

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

        dm.initRoom(room, camera);

        startSteps();
}

function step() {
        player.step();

        var collisions = getCollisions(activeRoom.tileBoxes);
        handleCollisions(collisions);

        playerBox = player.getBox();
        for (exit in exitZones) {
                if (checkOverlap(playerBox, exitZones[exit].zone)) {
                        exitZones[exit].onCollide();
                        return;
                }
        }

        camera.updateCenter();

        dm.startFrame();
        dm.drawEntity(player);
        dm.endFrame();

        if (animationId != undefined) {
                animationId = window.requestAnimationFrame(step);
        }
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
