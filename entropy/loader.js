//wait for page load
var readyCheck = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyCheck);
		loader();
	}
}, 10);

//loader starts here
function loader() {

var loadingCount = 0;
window.setInterval(function() {
        console.log(loadingCount);
}, 10);
var readyState = "uninitialized";

var entityAttributes = {};
var entitySprites = {};
var backgrounds = {};
var tilesheets = {};
var overlay = {};

var drawManager;

var desiredAudioExts = ["ogg", "mp3"];
var audioExt;
var audioAssets = {};
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var audioManager;

//Stores the camera prototype after getting info from the constants dictionary
var camera;

//Stores all entity prototypes after getting info from the constants dictionary and entities folder
var entities;

//Stores info from the dictionaries folder
var dicts = {};

//Stores info from the worlds, backgrounds, and tilesheets folders
var worldInfo = {};

function Coord(x, y) {
        this.x = x;
        this.y = y;
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
			//calls with null if something went wrong
			var text = xhr.status == 200 ? xhr.responseText : null;
                        callback.apply(this, [text].concat(args));
                }
        }
}

function LineReader(text){
	/* Reads the input text one line at a time.
	 * 
	 * Methods/Fields:
	 * 	hasNext - returns true if end
	 * 		of file has been reached,
	 * 		false otherwise.
	 * 	read() - outputs the next line from
	 * 		the input text. Throws "EOF"
	 * 		if called after end of file
	 * 		is reached.
	 * 	readTokens() - same as read, but the
	 * 		line is split by whitespace
	 * 		into an array of strings.
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
   
	this.readTokens = function() {
		return this.read().split(" ");
	};

	this.prepareNext();
}
    
function pixelToHex(data){
	/* Maps an array representing a 24 or 
	 * 32 bit pixel to a hex string of the form:
	 *   0xNNNNNN
	 */ 
	var num = data[0]*0x10000 + data[1]*0x100 + data[2];
        num = num.toString(16);
        while(num.length < 6) {
                num = "0" + num;
        }
        return "0x" + num;
}

function getAudioExt(desiredExts) {
        var tester = document.createElement("audio");
        for (var i = 0 ; i < desiredExts.length; i++) {
                if (tester.canPlayType && tester.canPlayType("audio/"+desiredExts[i]+";").replace(/no/, ""))
                        return desiredExts[i];
        }
        return null;
}

function load() {
	/* loadingCount is incremented each time a new file needs
	 * to be loaded, and is decremented when a file has been
	 * full parsed. When loadingCount returns to zero, readyState
	 * is set to the next value. Multiple readyStates are used
	 * for loading because there are some dependencies.
	 */
        readyState = "loading1";
        loadingCount+=6;
        
	getTextFile("worlds/worlds.txt", loadWorlds);
        getTextFile("dictionaries/dictionaries.txt", loadDictionaries);
        getTextFile("backgrounds/backgrounds.txt", loadBackgrounds);
        getTextFile("tilesheets/tilesheets.txt", loadTilesheets);
        getTextFile("entities/entities.txt", loadAllEntityAttributes);
	getTextFile("overlay/overlay.txt", loadOverlayGraphics);
 
	var loadTextReadyCheck = setInterval(function() {
                if (readyState === "loading1" && loadingCount === 0) {
                        clearInterval(loadTextReadyCheck);
                        
                        loadingCount++;
                        audioExt = getAudioExt(dicts.constants.AUDIO_EXTS);
                        getTextFile("audio/audio.txt", loadAudioAssets);
                        
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
        var reader;
        var worldIds;
        
        try {
                reader = new LineReader(text);
                worldIds = reader.readTokens();
        }
        catch (err) {
                var message = "Problem reading worlds/worlds.txt: " + err.message;
                throw(message);
        }
        
        loadingCount += worldIds.length;
        for (var i = 0; i < worldIds.length; i++) {
                getTextFile("worlds/world" + worldIds[i] + "/world" + worldIds[i] + ".json", loadWorldFromText, worldIds[i]);
        }
        loadingCount--;
}

function loadWorldFromText(text, id){
        var world;

        try {
                world = JSON.parse(text);
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
	/* Handles tiling. Tiles that need to be tiled must belong to the
	 * needsTiling dict. They will try to line up with all tiles in the
	 * tileTo dict. Tiling is determined by looking at a tile's surroundings
	 * and appending characters to its type id accordingly. For the 4 cardinal
	 * directions, n s e and w are used to indicate absence of a tile
	 * to line up with in that direction. For diagonals, 1 3 7 and 9 are used
	 * for nw ne sw and se respectively. These characters are always appended in
	 * the order nsew1379. Once everything has the corrected type id, the dict
	 * tileIdToCoord is used to convert to coordinates in a tilesheet.
	 * Every tilesheet should use the same coordinates for corresponding tiles.
	 * An array of these coordinates is finally returned.
	 */

	//TODO: move these dicts to external JSON files in the dictionaries folder
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
	/* Used to make collision detection for tiles slightly
	 * more efficient. May be unneccessary or detrimental once
	 * quadtree is in use.
	 */

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
        var reader;
        var dictIds;

        try {
                reader = new LineReader(text);
                dictIds = reader.readTokens();
        }
        catch (err) {
                var message = "Problem loading dictionaries/dictionaries.txt: " + err.message;
                throw message;
        }

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
        var reader;
        var tks;

        try {
                reader = new LineReader(text);
                tks = reader.readTokens();
        }
        catch (err) {
                var message = "Problem reading backgrounds/backgrounds.txt: " + err.message;
                throw message;
        } 

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
        var reader;
        var tks;

        try {
                reader = new LineReader(text);
                tks = reader.readTokens();
        }
        catch (err) {
                var message = "Problem reading tilesheets/tilesheets.txt: " + err.message;
                throw(message);
        }
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
        var reader;
        var tks;

        try {
                reader = new LineReader(text);
                tks = reader.readTokens();
        }
        catch (err) {
                var message = "Problem loading entities/entities.txt: " + err.message;
                throw message;
        }        

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
	/* Where ids are used as dict values, such
	 * as in entrances and tilesheets, this function
	 * replaces the ids with direct references to the
	 * corresponding objects.
	 *
	 * Also prepares the entity and camera prototypes
	 */

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
        
        audioManager = new AudioManager(audioAssets, dicts.constants, audioContext);
        
        //getting entities
        for (e in entityAttributes) {
                entityAttributes[e].sprites = entitySprites[e];
        }
        entities = getEntityFactory(entityAttributes, dicts.constants, audioManager);
        
        //preparing camera class
        camera = getCameraFactory(dicts.constants);


        drawManager = new DrawManager(dicts.constants, overlay.overlay);
}

function loadOverlayGraphics(text) {
	var reader;
	var tks;

	try {
		reader = new LineReader(text);
		tks = reader.readTokens();
	}
	catch (err) {
		var message = "Problem reading overlay/overlay.txt: " + err.message;
		throw message;
	}
        
        loadingCount += tks.length;
        
        for (var i = 0; i < tks.length; i++) {
                var overImg = new Image();
                overImg.onload = function() {
                        loadingCount--;
                };
                overImg.src = "overlay/" + tks[i] + ".png";
                overlay[tks[i]] = overImg;
        }

        loadingCount--;
}

function loadAudioAssets(text) {
	var reader;
	var tks;

	try {
		reader = new LineReader(text);
		tks = reader.readTokens();
	}
	catch (err) {
		if (err === "EOF") {
                        tks = [];
                }
                else {
                        var message = "Problem reading audio/audio.txt: " + err.message;
		        throw message;
                }
	}
        
        loadingCount += tks.length;

        for (var i = 0; i < tks.length; i++) {
                try {
                        loadAudioFile("audio/"+tks[i]+"."+audioExt, tks[i]);
                }
                catch (err) {
                        audioAssets[tks[i]] = null;
                        console.log("audio/"+tks[i]+"."+audioExt + " failed to load: " + err.message);
                        loadingCount--;
                }
        }

        loadingCount--;
}

function loadAudioFile(path, id){
        var request = new XMLHttpRequest();
        request.open("GET", path, true);
        request.responseType = "arraybuffer";
 
        request.onload = function() {
                audioContext.decodeAudioData(request.response, function(buffer) {
                        audioAssets[id] = buffer;
                        loadingCount--;
                });
        }; 
        request.send();
}

function startGame() {
	var info = {
                "worlds" : worldInfo,
                "dicts" : dicts,
                "entities" : entities,
                "camera" : camera,
                "audio" : audioManager,
                "draw" : drawManager
        };
	//Starts up engine.js
        game(info);
}

load();

}
