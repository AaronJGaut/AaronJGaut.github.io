function game(info){

//For debugging purposes
game.info = info;

var displayCv = document.getElementById("gamecanvas");
var displayCtx = displayCv.getContext("2d");


var drawCv = document.createElement("canvas");
drawCv.width = 200;
drawCv.height = 150;
var drawCtx = drawCv.getContext("2d");

game.drawCtx = drawCtx;

drawCtx.imageSmoothingEnabled = false;
displayCtx.imageSmoothingEnabled = false;

drawCtx.font = "10px Arial";
drawCtx.fillStyle = "white";

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
game.start = startSteps;

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
        background = world.background;
        tilesheet = world.tilesheet;

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

        startSteps();
}

function drawBackground() {
        drawCtx.drawImage(activeWorld.background, 0, 0);
}

function drawTile(sheet, x, y, destx, desty) {
        var SIZE = info.dicts.constants.TILE_SIZE;
        drawCtx.drawImage(sheet, x*SIZE, y*SIZE, SIZE, SIZE, Math.round(destx*SIZE), Math.round(desty*SIZE), SIZE, SIZE);
}

function step() {
        drawBackground();
        for (var i = 0; i < activeRoom.width; i++) {
                for (var j = 0; j < activeRoom.height; j++) {
                        if (activeRoom.tiles[i][j] === "wall") {
                                destPoint = camera.transformPoint({"x":i, "y":j});
                                drawTile(activeWorld.tilesheet, activeRoom.drawCoords[i][j][0], 
                                        activeRoom.drawCoords[i][j][1], destPoint.x, info.dicts.constants.CAMERA_HEIGHT-destPoint.y-1);
                        }
                }
        }
        /*
        drawCtx.fillText("cameraX : " + camera.center.x, 10, 12);
        drawCtx.fillText("cameraY : " + camera.center.y, 10, 24);
        drawCtx.fillText("cameraMode : " + camera.mode, 10, 36);
        drawCtx.fillText("bounded left : " + camera.bleft, 10, 48);
        drawCtx.fillText("bounded right : " + camera.bright, 10, 60);
        drawCtx.fillText("bounded top : " + camera.btop, 10, 72);
        drawCtx.fillText("bounded bottom : " + camera.bbottom, 10, 84);
        drawCtx.fillText("playerX : " + player.x, 10, 96);
        drawCtx.fillText("playerY : " + player.y, 10, 108);
        drawCtx.fillText("playerVX : " + player.vx, 10, 120);
        drawCtx.fillText("playerVY : " + player.vy, 10, 134);
        */
        
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


        player.render(drawCtx, camera);
        
        camera.updateCenter();

        displayCtx.drawImage(drawCv, 0, 0);

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
