function game(info){

//For debugging purposes
game.info = info;


var animationId;
var player;
var input = new KeyboardInterface(info.dicts.defaultKeybind);

var activeWorld;
var activeRoom;

var exitZones;
var camera;
var roomEntities;
var roomTiles;
var collisionDict;
var roomBounds;

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
        game.player = player;
        processStack = new ProcessStack();

        info.ps = processStack;

        var initialWorld = info.worlds[info.dicts.constants.STARTING_WORLD_ID];
        var initialEntrance = initialWorld.entrances[info.dicts.constants.STARTING_ENTRANCE_ID];
        
        enterWorld(initialWorld, initialEntrance, {"bl" : {"x":0, "y":0}, "tr" : {"x":0, "y":0}});
        
        processStack.push(coreStep, false, 0, 0);

        animationId = window.requestAnimationFrame(step);
}

function enterWorld(world, entrance, exitZone) {
        processStack.push(function(){ return undefined; }, true, 0, 0);
        var room = entrance.room;
        var enterZone = entrance.zone;

        activeWorld = world;
        
        info.draw.initWorld(world.background, world.tilesheet);
        info.audio.start(world.music, "music", "song");

        enterRoom(room, enterZone, exitZone);
        processStack.pop(0);
}

function enterRoom(room, enterZone, exitZone) {
        processStack.push(function() { return undefined; }, true, 0, 0);
        activeRoom = room;

        var newCoords = calcTransferCoords(player.getBox(), exitZone, enterZone);

        player.x = newCoords.x;
        player.y = newCoords.y;
       
 
        roomEntities = {};
        roomEntities["player"] = player;
        for (entityInstanceId in room.entities) {
                var inst = room.entities[entityInstanceId];
                var entity = new info.entities[inst.entityId](inst.x, inst.y, inst.z);
                roomEntities[entityInstanceId] = entity;
        }


        exitZones = [];
        miscZones = [];

        //getting world exits
        for (zone in room.zones) {
                var isExit = false;
                var exit = activeWorld.exits[[room.id, room.zones[zone].id]];
                if (exit !== undefined) {
                        exitZones.push(new WorldExit(exit, room.zones[zone]));
                        isExit = true;
                }
                
                var exit = activeWorld.connections[[room.id, room.zones[zone].id]];
                if (exit !== undefined) {
                        exitZones.push(new RoomExit(exit, room.zones[zone]));
                        isExit = true;
                }

                if (!isExit) {
                        miscZones.push(new MiscZone(room.zones[zone]));
                }
        }

        roomTiles = [];
        for (var i = 0; i < room.width; i++) {
                for (var j = 0; j < room.height; j++) {
                        if (room.tiles[i][j] !== "empty") {
                                roomTiles.push(new info.tiles[room.tiles[i][j]](i, j));
                        }
                }
        }
        
        collisionDict = {};
        for (entity in roomEntities) {
                collisionDict["entity-"+entity] = roomEntities[entity];
        }
        for (var i = 0; i < exitZones.length; i++) {
                collisionDict["exit-"+i] = exitZones[i];
        }
        for (var i = 0; i < miscZones.length; i++) {
                collisionDict["zone-"+i] = miscZones[i];
        }
        for (var i = 0 ; i < roomTiles.length; i++) {
                collisionDict["tile-"+i] = roomTiles[i];
        }

        camera = new info.camera(room, player);

        var padding = info.dicts.constants.ROOM_PADDING;
        roomBounds = {
                "bl" : { "x" : -padding, "y" : -padding },
                "tr" : { "x" : room.width + padding, "y" : room.height + padding }
        };

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
        var collider = new info.collider(roomBounds);
        
        // Populating the quadtree
        for (itemId in collisionDict) {
                if (collisionDict[itemId].getBox !== undefined) {
                        var box = collisionDict[itemId].getBox();
                        if (box !== null) {
                                box.id = itemId;
                                collider.insert(box);
                        }
                }
        }

        // Getting collisions from quadtree
        for (itemId in collisionDict) {
                if (collisionDict[itemId].isMobile) {
                        var collisions = collider.getCollisionsAndRemove(itemId);
                        for (var i = 0; i < collisions.length; i++) {
                                collisionDict[itemId].logCollision(collisionDict[collisions[i]]);
                                collisionDict[collisions[i]].logCollision(collisionDict[itemId]);
                        }
                }
        }

        // Handling collisions
        for (itemId in collisionDict) {
                try {
                        collisionDict[itemId].handleCollisions();
                }
                catch (err) {
                        if (err === "EXIT") {
                                break;
                        }
                        else throw err;
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

function WorldExit(exit, zone) {
        this.zone = zone;
        this.exit = exit;
        this.triggered = false;
        this.logCollision = function(collision) {
                if (collision.type === "player") {
                       this.triggered = true; 
                }
        };
        this.handleCollisions = function() {
                if (this.triggered) {
                        enterWorld(this.exit.world, this.exit.entrance, this.zone);        
                        throw "EXIT";
                }
        };
        this.getBox = function() {
                return {
                        "bl" : { "x" : this.zone.bl.x, "y" : this.zone.bl.y },
                        "tr" : { "x" : this.zone.tr.x, "y" : this.zone.tr.y }
                };
        };
}

function RoomExit(exit, zone) {
        this.zone = zone;
        this.exit = exit;
        this.triggered = false;
        this.logCollision = function(collision) {
                if (collision.type === "player") {
                        this.triggered = true;
                }        

        };
        this.handleCollisions = function() {
                if (this.triggered) {
                        enterRoom(this.exit.room, this.exit.zone, this.zone);
                        throw "EXIT";
                }
        };
        this.getBox = function() {
                return {
                        "bl" : { "x" : this.zone.bl.x, "y" : this.zone.bl.y },
                        "tr" : { "x" : this.zone.tr.x, "y" : this.zone.tr.y }
                };
        };
}

function MiscZone(zone) {
        this.zone = zone;
        this.logCollision = function(collision) { return undefined; };
        this.handleCollisions = function() { return undefined; };
}

function calcTransferCoords(playerRect, exitRect, enterRect) {
        //Determines the player's bottom-left corner after passing through an exit zone
        var leftOffset = playerRect.bl.x - exitRect.bl.x;
        if (leftOffset < 0) leftOffset = 0;

        var rightOffset = exitRect.tr.x - playerRect.tr.x;
        if (rightOffset < 0) rightOffset = 0;

        var exitFreedomX = leftOffset + rightOffset;
        var positionRatioX = exitFreedomX > 0 ? leftOffset/exitFreedomX : 0.5;

        var downOffset = playerRect.bl.y - exitRect.bl.y;
        if (downOffset < 0) downOffset = 0;

        var upOffset = exitRect.tr.y - playerRect.tr.y;
        if (upOffset < 0) upOffset = 0;

        var exitFreedomY = downOffset + upOffset;
        var positionRatioY = exitFreedomY > 0 ? downOffset/exitFreedomY : 0.5;

        var newCoords = {};

        var enterFreedomX = enterRect.tr.x - enterRect.bl.x - (playerRect.tr.x - playerRect.bl.x);
        if (enterFreedomX > 0) {
                newCoords.x = enterRect.bl.x + enterFreedomX*positionRatioX;
        }
        else {
                newCoords.x = (enterRect.bl.x + enterRect.tr.x)/2 - (playerRect.tr.x - playerRect.bl.x)/2;
        }

        var enterFreedomY = enterRect.tr.y - enterRect.bl.y - (playerRect.tr.y - playerRect.bl.y);
        if (enterFreedomY > 0) {
                newCoords.y = enterRect.bl.y + enterFreedomY*positionRatioY;
        }
        else {
                newCoords.y = (enterRect.bl.y + enterRect.tr.y)/2 - (playerRect.tr.y - playerRect.bl.y)/2;
        }
        
        return newCoords;
}

start();
}
