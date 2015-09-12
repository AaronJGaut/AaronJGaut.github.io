//wait for page load
var readyCheck = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyCheck);
		loader();
	}
}, 10);

//loader starts here
function loader() {

loadingCount = 0;
var readyState = "uninitialized";
var entityAttributes = {};
var entitySprites = {};

var dicts = {};
var backgrounds = {};
var tilesheets = {};
var entities;
var camera;

var worldInfo = {};
/*
Info format:
* indicates a dictionary w/ arbitrary keys
~ indicates an array

worldInfo
| worldIds*
| | themeId
| | entranceId*
| | | roomId
| | | boxId
| | exits*
| | | roomId
| | | exitId
| | | worldId
| | | entranceId
| | (fromRoomId, exitBoxId)*
| | | toRoomId
| | | entranceBoxId
| | rooms
| | | roomId*
| | | | entitiesIds*
| | | | | type
| | | | | pos
| | | | | | x
| | | | | | y
| | | | boxIds*
| | | | | rect
| | | | | | blx
| | | | | | bly
| | | | | | trx
| | | | | | try
*/

function Coord(x, y) {
        this.x = x;
        this.y = y;
}

function dictKeys(dict) {
        /* Returns the keys of a dictionary as an array. */
        keyArray = [];
        for (key in dict) {
                keyArray.push(key);
        }
        return keyArray;
}

function dictValues(dict) {
        /* Returns the values of a dictionary as an array. */
        valueArray = [];
        for (key in dict) {
                valueArray.push(dict[key]);
        }
        return valueArray;
}

function getTextFile() {
	/* Gets the text from a text file at the given path.
	 * When the text is ready, calls a given function.
         * 
         * Arguments by position:
         *      arguments[0] - filepath
         *      arguments[1] - callback function
         *      arguments[2+] - arguments for callback function
	 */

        var path = arguments[0];
        var callback = arguments[1];
        var args = dictValues(arguments).slice(2);

        var xhr;

        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = handleStateChange;
        xhr.open("GET", path, true);
        xhr.send();

        function handleStateChange() {
                if (xhr.readyState === 4) {
                        var text = xhr.status == 200 ? xhr.responseText : null;
                        callback.apply(this, [text].concat(args));
                        gettingFile = false;
                }
        }
}

function LineReader(text){
	/* Reads the input text one line at a time.
	 * 
	 * Methods/Fields:
	 * 	hasNext() - returns true if end
	 * 		of file has been reached,
	 * 		false otherwise.
	 * 	read() - outputs the next line from
	 * 		the input text. Throws "EOF"
	 * 		if called after end of file
	 * 		is reached.
	 *
	 * LineReader also has a few quirks/features:
	 * 	-Trims whitespace from beginning and end
	 * 		of lines.
         *      -Removes commas.
	 * 	-Ignores lines that start with # (after 
	 * 		trimming).
	 * 	-Ignores empty lines (after trimming).
         *      -Replaces any chain of consecutive tabs 
         *              and spaces with a single space.
         */

	this.hasNext = true;
	
	this.lines = text.split("\n");
	this.lineNumber = 0;
	this.nextLine = undefined;

	this.prepareNext = function () {
		while (true) {
			if (this.lineNumber >= this.lines.length) {
				this.hasNext = false;
				return;
			}
			var line = this.lines[this.lineNumber];
                        
                        //trimming outer whitespace
                        line = line.trim();

                        //removing redundant whitespace
                        line = line.replace(/\s+/g, " ");
                        
                        //removing commas
                        line = line.replace(/,/g, "");
                        
                        this.lineNumber++;    
			if (line.length > 0 && line[0] != "#") {
				this.nextLine = line;
				return;
			}
		}
	};

	this.read = function() {
		if (this.hasNext) {
			var val = this.nextLine;
			this.prepareNext();
			return val;
		} else {
			throw "EOF";
		}
	};
    
	this.prepareNext();
}
    
function pixelToHex(data){
        var num = data[0]*0x10000 + data[1]*0x100 + data[2];
        num = num.toString(16);
        while(num.length < 6) {
                num = "0" + num;
        }
        return "0x" + num;
}

function load() {

        readyState = "loading1";
        loadingCount+=5;
        getTextFile("worlds/worlds.txt", loadWorlds);
        getTextFile("dictionaries/dictionaries.txt", loadDictionaries);
        getTextFile("backgrounds/backgrounds.txt", loadBackgrounds);
        getTextFile("tilesheets/tilesheets.txt", loadTilesheets);
        getTextFile("entities/entities.txt", loadAllEntityAttributes);
        var loadTextReadyCheck = setInterval(function() {
                if (readyState === "loading1" && loadingCount === 0) {
                        clearInterval(loadTextReadyCheck);
                        loadRoomTiles();
                        readyState = "loading2";
                }
        }, 10);

        var loadTilesReadyCheck = setInterval(function() {
                if (readyState === "loading2" && loadingCount === 0) {
                        clearInterval(loadTilesReadyCheck);
                        linkObjects();
                        startGame();
                }
        }, 10);
}

function loadWorlds(text) {
        var reader = new LineReader(text);
        var worldIds = reader.read().split(" ");
        loadingCount += worldIds.length;
        for (var i = 0; i < worldIds.length; i++) {
                getTextFile("worlds/world" + worldIds[i] + "/world" + worldIds[i] + ".json", loadWorldFromText, worldIds[i]);
        }
        loadingCount--;
}

function loadWorldFromText(text, id){
        try {
                var world = JSON.parse(text);
        }
        catch (err) {
                var message = "Problem reading world" + id + ".json: " + err.message; 
                throw(message);
        }

        worldInfo[id] = world;

        loadingCount += world.rooms.length;   
        for (var i = 0; i < world.rooms.length; i++) {
                getTextFile("worlds/world" + id + "/room" + world.rooms[i] + ".json", loadRoomFromText, id, world.rooms[i]);
        }
        
        loadingCount--;
}

function loadRoomFromText(text, worldId, roomId) {
        var room;
        
        try {
                room = JSON.parse(text);
        }
        catch (err) {
                var message = "Problem reading world" + worldId + "/room" + roomId + ".json: " + err.message;
                throw(message);
        }

        room.id = roomId;
        for (zoneId in room.zones) {
                room.zones[zoneId].id = zoneId
        }
        worldInfo[worldId].rooms[roomId] = room;
        
        loadingCount--;
}

function loadRoomTiles() {
        for (worldId in worldInfo) {
                for (roomId in worldInfo[worldId].rooms) {
                        loadingCount++;
                        var sourceImage = new Image();
                        sourceImage.onload = (function(world, room, img) {
                                return function() {
                                        loadTilesFromImage(img, worldInfo[world].rooms[room]);
                                }
                        })(worldId, roomId, sourceImage);

                        sourceImage.src = "worlds/world" + worldId + "/room" + roomId + ".png";
                }
        }
}

function loadTilesFromImage(sourceImage, roomObj) {
        var cv = document.createElement("canvas");
        cv.width = sourceImage.width;
        cv.height = sourceImage.height;

        var ctx = cv.getContext("2d");
        ctx.drawImage(sourceImage, 0, 0);

        var tiles = [];

        var imgData = ctx.getImageData(0, 0, cv.width, cv.height).data;
        for (var i = 0; i < cv.width; i++) {
                var row = [];
                for (var j = cv.height-1; j >= 0; j--) {
                        var k = (j*cv.width+i)*4;
                        var pixelData = [imgData[k], imgData[k+1], imgData[k+2]];
                        var tileId = dicts.hexToTileId[pixelToHex(pixelData)];
                        row.push(tileId);
                }
                tiles.push(row);
        }

        roomObj.tiles = tiles;
        roomObj.drawCoords = getDrawCoords(tiles);
        roomObj.tileBoxes = getTileBoxes(tiles);

        roomObj.width = tiles.length;
        roomObj.height = tiles[0].length;

        loadingCount--;
}

function getDrawCoords(tiles) {
        needsTiling = {
                "wall" : true
        };
        tileTo = {
                "wall" : true,
        };

        var drawTiles = [];

        for (var i = 0; i < tiles.length; i++) {
                var row = [];
                for (var j = 0; j < tiles[i].length; j++) {
                        var drawTile = tiles[i][j];
                        if (needsTiling[tiles[i][j]]) {
                                var diagonals = {
                                        "1" : true,
                                        "3" : true,
                                        "7" : true,
                                        "9" : true
                                }
                                if (j === tiles[i].length-1 || !tileTo[tiles[i][j+1]]) {
                                        if (j < tiles[i].length-1) {
                                                drawTile += "n";
                                        }
                                        diagonals["1"] = false;
                                        diagonals["3"] = false;
                                }
                                if (j === 0 || !tileTo[tiles[i][j-1]]) {
                                        if (j > 0) {
                                                drawTile += "s";
                                        }
                                        diagonals["7"] = false;
                                        diagonals["9"] = false;
                                }
                                if (i === tiles.length-1 || !tileTo[tiles[i+1][j]]) {
                                        if (i < tiles.length-1) {
                                                drawTile += "e";
                                        }
                                        diagonals["3"] = false;
                                        diagonals["9"] = false;
                                }
                                if (i === 0 || !tileTo[tiles[i-1][j]]) {
                                        if (i > 0) {
                                                drawTile += "w";
                                        }
                                        diagonals["1"] = false;
                                        diagonals["7"] = false;
                                }
                                if (diagonals["1"] && !tileTo[tiles[i-1][j+1]]) {
                                        drawTile += "1";
                                }
                                if (diagonals["3"] && !tileTo[tiles[i+1][j+1]]) {
                                        drawTile += "3";
                                }
                                if (diagonals["7"] && !tileTo[tiles[i-1][j-1]]) {
                                        drawTile += "7";
                                }
                                if (diagonals["9"] && !tileTo[tiles[i+1][j-1]]) {
                                        drawTile += "9";
                                }
                        }
                        row.push(dicts.tileIdToCoord[drawTile]);
                }
                drawTiles.push(row);
        }
        return drawTiles;
}

function getTileBoxes(tiles) {
        var isImpassible = {
                "wall" : true
        }

        var unboxed = [];
        for (var i = 0; i < tiles.length; i++) {
                var col = [];
                for (var j = 0; j < tiles[i].length; j++) {
                        col.push(isImpassible[tiles[i][j]]);
                }
                unboxed.push(col);
        }
        
        var boxes = [];
       
        for (var i = 0; i < unboxed.length; i++) {
                for (var j = 0; j < unboxed[i].length; j++) {
                        if (unboxed[i][j]) {
                                var box = {
                                        "bl" : {
                                                "x" : i,
                                                "y" : j
                                        },
                                        "tr" : {
                                                "x" : i+1,
                                                "y" : j+1
                                        }
                                };
                                
                                while (box.tr.x < unboxed.length && unboxed[box.tr.x][box.bl.y]) {
                                        box.tr.x++;
                                }

                                var yCheck = true;
                                while (yCheck) {
                                        for (var k = box.bl.x; k < box.tr.x; k++) {
                                                if (!unboxed[k][box.tr.y]) {
                                                        yCheck = false;
                                                        break;
                                                }
                                        }
                                        if (yCheck) {
                                                box.tr.y++;
                                        }
                                }

                                for (var k = box.bl.x; k < box.tr.x; k++) {
                                        for (var l = box.bl.y; l < box.tr.y; l++) {
                                                unboxed[k][l] = false;
                                        }
                                }
                                boxes.push(box);
                        }
                }
        }
        return boxes;
}

function loadDictionaries(text) {
        var reader = new LineReader(text);
        var dictIds = reader.read().split(" ");
        loadingCount += dictIds.length;
        for (var i = 0; i < dictIds.length; i++) {
                getTextFile("dictionaries/" + dictIds[i] + ".json", loadDictFromText, dictIds[i]);
        }
        loadingCount--;
}

function loadDictFromText(text, dictId) {
        try {
                dicts[dictId] = JSON.parse(text);
        }
        catch (err) {
                var message = "Problem reading dictionaries/" + dictId + ".json: " + err.message;
                throw(message);
        }
        
        loadingCount--;
}

function loadBackgrounds(text) {
        var reader = new LineReader(text);
        var tks = reader.read().split(" ");
        loadingCount += tks.length;
        
        for (var i = 0; i < tks.length; i++) {
                var bgImg = new Image();
                bgImg.onload = function() {
                        loadingCount--;
                };
                bgImg.src = "backgrounds/" + tks[i] + ".png";
                backgrounds[tks[i]] = bgImg;
        }

        loadingCount--;
}

function loadTilesheets(text) {
        var reader = new LineReader(text);
        var tks = reader.read().split(" ");
        loadingCount += tks.length;

        for (var i = 0; i < tks.length; i++) {
                var tileImg = new Image();
                tileImg.onload = function() {
                        loadingCount--;
                };
                tileImg.src = "tilesheets/" + tks[i] + ".png";
                tilesheets[tks[i]] = tileImg;
        }

        loadingCount--;
}

function loadAllEntityAttributes(text) {
        var reader = new LineReader(text);
        var tks = reader.read().split(" ");
        
        loadingCount += tks.length*2;

        for (var i = 0; i < tks.length; i++) {
                getTextFile("entities/" + tks[i] + ".json", loadEntityAttributes, tks[i]);

                var spriteImg = new Image();
                spriteImg.onload = function() {
                        loadingCount--;
                };
                spriteImg.src = "entities/" + tks[i] + ".png";
                entitySprites[tks[i]] = spriteImg;
        }

        loadingCount--;
}

function loadEntityAttributes(text, entityId) {
        try {
                entityAttributes[entityId] = JSON.parse(text);
        }
        catch (err) {
                var message = "Problem loading entities/" + entityId + ".json: " + err.message;
                throw(message);
        }

        loadingCount--;
}

function linkObjects() {
        //linking world entrances, exits, and connections
        for (worldId in worldInfo) {

                //linking world entrances to room and zone objects
                for (enterId in worldInfo[worldId].entrances) {
                        var entrance = worldInfo[worldId].entrances[enterId];
                        entrance.room = worldInfo[worldId].rooms[entrance.room];
                        entrance.zone = entrance.room.zones[entrance.zone];
                }

                //linking world exits to world and entrance objects
                for (exitId in worldInfo[worldId].exits) {
                        var exit = worldInfo[worldId].exits[exitId];
                        exit.world = worldInfo[exit.world];
                        exit.entrance = exit.world.entrances[exit.entrance];
                }

                //linking world connections to room and zone objects
                for (connectId in worldInfo[worldId].connections) {
                        var connection = worldInfo[worldId].connections[connectId];
                        connection.room = worldInfo[worldId].rooms[connection.room];
                        connection.zone = connection.room.zones[connection.zone];
                }

                //linking backgrounds and tilesheets to worlds
                for (worldId in worldInfo) {
                        var world = worldInfo[worldId];
                        world.background = backgrounds[world.background];
                        world.tilesheet = tilesheets[world.tilesheet];
                }
        }
        
        //getting entities
        for (e in entityAttributes) {
                entityAttributes[e].sprites = entitySprites[e];
        }
        entities = getEntityFactory(entityAttributes, dicts.constants);
        
        //preparing camera class
        camera = getCameraFactory(dicts.constants);
}

function startGame() {
        var info = {
                "worlds" : worldInfo,
                "dicts" : dicts,
                "entities" : entities,
                "camera" : camera
        };
        game(info);
}

load();

}
