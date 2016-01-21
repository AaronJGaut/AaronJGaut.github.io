function game(canvas){
    var WIDTH = 30;
    var HEIGHT = 17;
    var BORDER_WIDTH = 5;
    var BORDER_NAME = "border.png";
    var LEVEL_IMAGE_NAME = "leveldat";
    var LEVEL_IMAGE_EXT = "bmp";
    var LEVEL_TRIGGER_NAME = "leveldat";
    var LEVEL_TRIGGER_EXT = "txt";
    
    var INITIAL_LEVEL = 1;
    var TILESET = "tileset2.png";
    var TILE_SIZE = 32;
    var LEVELS = 3;
    var FRAMERATE = 50;
    var MILLIS_PER_FRAME = Math.floor(1000/FRAMERATE);

    var UP_KEYS = [38, 75, 87, 104];
    var DOWN_KEYS = [40, 74, 83, 98, 101];
    var RIGHT_KEYS = [39, 68, 76, 102];
    var LEFT_KEYS = [37, 65, 72, 100];

    var KEY_MAP = {38: "up",
                   75: "up",
                   87: "up",
                   104: "up",
                   40: "down",
                   74: "down",
                   83: "down",
                   98: "down",
                   101: "down",
                   39: "right",
                   68: "right",
                   76: "right",
                   102: "right",
                   37: "left",
                   65: "left",
                   72: "left",
                   100: "left" };

    var TILE_DICT = {"wall":[[0,0]],
                     "walle":[[0,1]],
                     "walln":[[0,2]],
                     "wallw":[[0,3]],
                     "walls":[[0,4]],
                     "wallns":[[0,5]],
                     "wallew":[[0,6]],
                     "wallne":[[0,7]],
                     "wallnw":[[0,8]],
                     "wallsw":[[0,9]],
                     "wallse":[[0,10]],
                     "wallnse":[[0,11]],
                     "wallnew":[[0,12]],
                     "wallnsw":[[0,13]],
                     "wallsew":[[0,14]],
                     "wallnsew":[[0,15]],
                     
                     "wall1":[[1,1]],
                     "wall3":[[1,2]],
                     "wall7":[[1,3]],
                     "wall9":[[1,4]],
                     "wall13":[[1,5]],
                     "wall17":[[1,6]],
                     "wall19":[[1,7]],
                     "wall37":[[1,8]],
                     "wall39":[[1,9]],
                     "wall79":[[1,10]],
                     "wall137":[[1,11]],
                     "wall139":[[1,12]],
                     "wall179":[[1,13]],
                     "wall379":[[1,14]],
                     "wall1379":[[1,15]],

                     "walln1":[[2,0]],
                     "walln3":[[2,1]],
                     "walln13":[[2,2]],
                     "walls7":[[2,3]],
                     "walls9":[[2,4]],
                     "walls79":[[2,5]],
                     "walle1":[[2,6]],
                     "walle7":[[2,7]],
                     "walle17":[[2,8]],
                     "wallw3":[[2,9]],
                     "wallw9":[[2,10]],
                     "wallw39":[[2,11]],
                     "wallne1":[[2,12]],
                     "wallnw3":[[2,13]],
                     "wallse7":[[2,14]],
                     "wallsw9":[[2,15]],
                     
                     "floor":[[0,16]],
                     "floorice":[[0,20]],
                     
                     "hole":[[0,17]],
                     "switchoff":[[0,18]],
                     "switchon":[[0,19]],
                     "switchsoftoff":[[1,18]],
                     "switchsofton":[[1,19]],
                     "wallgen":[[1,16,2500],[2,16,100]],
                     "holefillable":[[1,17]],
                     "holefilledboulder":[[2,17]],
                     "holefilledplayer":[[2,18]],

                     "boulder":[[0,21]],
                     "player":[[2,20,300],[2,21,300],[2,20,300],[2,19,300]]};

    var TILE_TYPE_DICT = {0xFFFFFF:"floor",
                          0x000000:"wall",
                          0x0000FF:"floorice"};

    var TILE_FLOORITEM_DICT = {0x000000:"none",
                               0xFF0000:"hole",
                               0xFFFF00:"switchoff",
                               0x00FFFF:"wallgen",
                               0xFF00FF:"holefillable",
                               0x0000FF:"switchsoftoff"};

    var TILE_ITEM_DICT = {0x000000:"none"};

    var TILE_ENTITY_DICT = {0x000000:"none",
                            0xFF00FF:"boulder",
                            0x00FF00:"player"};

    var millis = 0;

    var ready = false;

    var drawContext = canvas.getContext("2d");
   
    var bufferedInput = "none";

    var levelData = [];
    levelData.playerX = -1;
    levelData.playerY = -1;

    var redrawBlocks = new HashSet();

    var setImage = new Image();
    var borderImage = new Image();

    var updateInterval

    function Tile(type, floorItem, item, entity) {
        this.type = TILE_TYPE_DICT[type];
        this.floorItem = TILE_FLOORITEM_DICT[floorItem];
        this.item = TILE_ITEM_DICT[item];
        this.entity = TILE_ENTITY_DICT[entity];
    }
    
    var setReady = function(){
        move = bufferedInput;
        ready = true;
        gameMove(move);
    }
    
    function loadLevel(level){
        ready = false;
        if(updateInterval != undefined){
            clearInterval(updateInterval);
        }
        levelImage = new Image();
        levelImage.onload = function(){
            getLevelData(levelImage);
            triggerPath = LEVEL_TRIGGER_NAME + level + "." + LEVEL_TRIGGER_EXT;
            //loadTriggers(triggerPath);
            drawLevel();
            updateInterval=setInterval(updateWindow, MILLIS_PER_FRAME);
            millis = 0;
            setReady();
        }
        levelImage.src = LEVEL_IMAGE_NAME + level + "." + LEVEL_IMAGE_EXT;
    }

    this.loadLevel = loadLevel;

    var start = function(){
        currentLevel = INITIAL_LEVEL;
        loadLevel(currentLevel);
    };

    var pixelToHex = function(data){
        return data[0]*0x10000 + data[1]*0x100 + data[2];
    };

    var updateWindow = function(){
        blocksArray = redrawBlocks.values();
        layers = ["type", "floorItem", "item", "entity"];
        for(var k = 0; k < blocksArray.length; k++){
            decodedCoords = decodeCoords(blocksArray[k]);
            var i = decodedCoords[1];
            var j = decodedCoords[0];
        
            for(var l = 0; l < layers.length; l++){            
                tileID = getTileID(i, j, layers[l]);
                if(tileID != "none"){
                    drawTile(tileID, i, j);
                }
            }
            if(!isAnimated(j, i)){
                redrawBlocks.remove(blocksArray[k]);
            }
        }
        millis = millis % 1232431200 + MILLIS_PER_FRAME;
    };

    var isAnimated = function(X, Y){
        var animated = function(ID){
            if( TILE_DICT[ID] == undefined){
                return false;
            }
            return (TILE_DICT[ID].length > 1);
        };

        tile = levelData[Y][X];
        return  animated(tile.type) || animated(tile.floorItem)
             || animated(tile.item) || animated(tile.entity);
    };

    var isPassable = function(X, Y, entityID){
        if(!inBounds(X, Y))
            return false;
        tile = levelData[Y][X];
        if(!isFloor(X, Y))
            return false;
        if(tile.entity == "boulder")
            return false;
        return true;
    };

    var inBounds = function(x,y){
        return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
    };

    var isFallable = function(X, Y){
        floorItemID = levelData[Y][X].floorItem;
        return floorItemID == "hole"
            || floorItemID == "holefillable";
    };

    var getLevelData = function(sourceImage){
        levelCanvas = document.createElement("canvas");
        levelCanvas.width = sourceImage.width;
        levelCanvas.height = sourceImage.height;

        levelImage = levelCanvas.getContext("2d");
        levelImage.drawImage(sourceImage, 0, 0);

        for (i = 0; i < HEIGHT; i++) {
            levelData[i] = [];
            for (j = 0; j < WIDTH; j++) {
                var typeData = levelImage.getImageData(j*3, i*3, 1, 1);
                var floorItemData = levelImage.getImageData(j*3+1, i*3, 1, 1);
                var itemData = levelImage.getImageData(j*3, i*3+1, 1, 1);
                var entityData = levelImage.getImageData(j*3+1, i*3+1, 1, 1);

                var type = pixelToHex(typeData.data);
                var floorItem = pixelToHex(floorItemData.data);
                var item = pixelToHex(itemData.data);
                var entity = pixelToHex(entityData.data);

                levelData[i][j] = new Tile(type, floorItem, item, entity);
                if(isAnimated(j, i)){
                    redrawBlocks.add(encodeCoords(j, i));
                }
            }
        }
    };

    var getTileID = function(i, j, layer){
         var ID = "none";
         switch(layer){
            case "type":
            ID = levelData[i][j].type;
            if(ID == "wall"){
                var corner1 = true;
                var corner3 = true;
                var corner7 = true;
                var corner9 = true;
                if(i > 0 && isFloor(j, i-1)) {       
                    ID = ID + "n";
                    corner7 = false;
                    corner9 = false;
                }
                if(i < HEIGHT-1 && isFloor(j, i+1)) {
                    ID = ID + "s";
                    corner1 = false;
                    corner3 = false;
                }
                if(j < WIDTH-1 && isFloor(j+1, i)) {
                    ID = ID + "e";
                    corner3 = false;
                    corner9 = false;
                }
                if(j > 0 && isFloor(j-1, i)) {
                    ID = ID + "w";
                    corner1 = false;
                    corner7 = false
                }
                if(corner1 && i < HEIGHT-1 && j > 0
                   && isFloor(j-1, i+1)) {
                    ID = ID + "1";
                }
                if(corner3 && i < HEIGHT-1 && j < WIDTH-1
                   && isFloor(j+1, i+1))  {             
                    ID = ID + "3";
                }
                if(corner7 && i > 0 && j > 0
                   && isFloor(j-1, i-1)) {
                    ID = ID + "7";
                }
                if(corner9 && i > 0 && j < WIDTH-1
                   && isFloor(j+1, i-1)) {
                    ID = ID + "9";
                }
            }
            break;
           
            case "floorItem":
            ID = levelData[i][j].floorItem;   
            break;

            case "item":
            ID = levelData[i][j].item;
            break;   

            case "entity":
            ID = levelData[i][j].entity;
            if(ID == "player"){
                levelData.playerX = j;
                levelData.playerY = i;
            }
            break; 
        }

        return ID;
            
    };

    var drawTile = function(tileID, screenRow, screenCol){
        var setCoordsList = TILE_DICT[tileID];
        if (setCoordsList.length > 1){
            var totalAnimationMillis = 0;
            for (var i = 0; i < setCoordsList.length; i++){
                totalAnimationMillis += setCoordsList[i][2];
            }
            var currentAnimationMillis = millis % totalAnimationMillis;
            var runningMilliTotal=0;
            for (i = 0; i < setCoordsList.length; i++){
                runningMilliTotal = runningMilliTotal + setCoordsList[i][2];
                if (runningMilliTotal > currentAnimationMillis){
                    var setCoords = setCoordsList[i];
                    break;
                }
            }
        } else {
            var setCoords = setCoordsList[0];
        
        
        }

        var x = TILE_SIZE*setCoords[1];
        var y = TILE_SIZE*setCoords[0];
        drawContext.drawImage(setImage, x, y, TILE_SIZE, TILE_SIZE, 
                         screenCol*TILE_SIZE + BORDER_WIDTH,
                         screenRow*TILE_SIZE + BORDER_WIDTH,
                         TILE_SIZE, TILE_SIZE);
    };

    var isFloor = function(X, Y){
        type = levelData[Y][X].type
        return type == "floor" 
            || type == "floorice"
            || type == "holefilledboulder"
            || type == "holefilledplayer";
    };

    var drawLevel = function(){
        var layers = ["type", "floorItem", "item", "entity"];
        for(i = 0; i < HEIGHT; i++){
            for (j = 0; j < WIDTH; j++){
                for(var l = 0; l < layers.length; l++){            
                    tileID = getTileID(i, j, layers[l]);
                    if(tileID != "none"){
                        drawTile(tileID, i, j);
                    }
                    if(tileID == "player"){
                        levelData.playerX = j;
                        levelData.playerY = i;
                    }
                }
            }
        }
    };

    var killPlayer = function(x, y){
        levelData.playerX = -1;
        levelData.playerY = -1;
    }
    
    encodeCoords = function(x, y){
        return x*HEIGHT + y;
    };

    var decodeCoords = function(coordKey){
        var x = Math.floor(coordKey/HEIGHT);
        var y = coordKey%HEIGHT;
        return [x,y];
    };

    var moveEntity = function(oldX, oldY, newX, newY, deactivate){
        if (typeof(deactivate) === "undefined") deactivate=true;
        
        var entityID = levelData[oldY][oldX].entity;
        
        levelData[oldY][oldX].entity = "none";
        redrawBlocks.add(encodeCoords(oldX, oldY));
        
        levelData[newY][newX].entity = entityID;
        redrawBlocks.add(encodeCoords(newX, newY));

        if(entityID == "player"){
            levelData.playerX = newX;
            levelData.playerY = newY;
        }
        if(deactivate && levelData[oldY][oldX].floorItem != "none"){
            deactivateFloorItem(oldX, oldY, entityID);
        }
        if(levelData[newY][newX].floorItem != "none"){
            activateFloorItem(newX, newY, entityID);
        }
    };

    var activateFloorItem = function(X, Y, entityID){
        var floorItemID = levelData[Y][X].floorItem;
        switch(floorItemID){
            case "hole":
            levelData[Y][X].entity = "none";
            redrawBlocks.add(encodeCoords(X, Y));
            if (entityID == "player"){
                killPlayer();
            }
            break;

            case "switchoff":
            levelData[Y][X].floorItem = "switchon";
            redrawBlocks.add(encodeCoords(X, Y));
            break;

            case "switchsoftoff":
            levelData[Y][X].floorItem = "switchsofton";
            redrawBlocks.add(encodeCoords(X, Y));
            break;

            case "holefillable":
            if (entityID == "player"){
                levelData[Y][X].entity = "none";
                levelData[Y][X].floorItem = "holefilledplayer";
                killPlayer();
            }
            if (entityID == "boulder"){
                levelData[Y][X].entity = "none";
                levelData[Y][X].floorItem = "holefilledboulder";
            }
            break;
        }
    };

    var deactivateFloorItem = function(X, Y, entityID){
        var floorItemID = levelData[Y][X].floorItem;
        switch(floorItemID){
            case "wallgen":
            var tile = levelData[Y][X];
            tile.type = "wall";
            tile.floorItem = "none";
            tile.item = "none";
            if(tile.entity == "player"){
                killPlayer();
            }
            tile.entity = "none";
            redrawBlocks.add(encodeCoords(X-1, Y-1));
            redrawBlocks.add(encodeCoords(X-1, Y));
            redrawBlocks.add(encodeCoords(X-1, Y+1));
            redrawBlocks.add(encodeCoords(X, Y-1));
            redrawBlocks.add(encodeCoords(X, Y));
            redrawBlocks.add(encodeCoords(X, Y+1));
            redrawBlocks.add(encodeCoords(X+1, Y-1));
            redrawBlocks.add(encodeCoords(X+1, Y));
            redrawBlocks.add(encodeCoords(X+1, Y+1));
            break;

            case "switchsofton":
            levelData[Y][X].floorItem = "switchsoftoff";
            redrawBlocks.add(encodeCoords(X, Y));
            break;
        }
    }

    var gameMove = function(moveID){
        if(levelData.playerX >= 0 && levelData.playerY >= 0){
            var oldX = levelData.playerX;
            var oldY = levelData.playerY;
            var newX = oldX;
            var newY = oldY;
            var newX2 = oldX;
            var newY2 = oldY;
            
            switch(moveID){
                case "up":
                    newY = newY-1;
                    newY2 = newY2-2;
                    break;

                case "down":
                    newY = newY+1;
                    newY2 = newY2+2;
                    break;

                case "left":
                    newX = newX-1;
                    newX2 = newX2-2;
                    break;

                case "right":
                    newX = newX+1;
                    newX2 = newX2+2;
                    break
            }
            
            if(inBounds(newX, newY)){
                if(isPassable(newX, newY)){
                    if(levelData[newY][newX].type == "floorice"){
                        slide(oldX, oldY, moveID, "player");
                    } else {
                        moveEntity(oldX, oldY, newX, newY);
                    }
                }
                else if (levelData[newY][newX].entity == "boulder" 
                        && levelData[oldY][oldX].type != "floorice"
                        && inBounds(newX2, newY2)
                        && isPassable(newX2, newY2)){
                    if(levelData[newY2][newX2].type == "floorice"){
                        if (levelData[newY][newX].type != "floorice"){
                            slide(newX, newY, moveID, "boulder", false);
                            moveEntity(oldX, oldY, newX, newY);
                        } else {
                            slide(newX, newY, moveID, "boulder");
                        }
                    } else {
                        moveEntity(newX, newY, newX2, newY2, false);
                        moveEntity(oldX, oldY, newX, newY);
                    }
                }
            }
        }
    };

    var slide = function(X, Y, heading, entityID, deactivate){
        if (typeof(deactivate) === "undefined") deactivate=true;
        
        var headingArray = []
        switch(heading){
            case "up":
                headingArray = [0, -1]; 
                break;

            case "down":
                headingArray = [0, 1];
                break;

            case "left":
                headingArray = [-1, 0];
                break;

            case "right":
                headingArray = [1, 0];
                break;
        }
        sliding = true;
        first = true
        while(sliding){
            
            newX = X + headingArray[0];
            newY = Y + headingArray[1];
            if (isPassable(newX, newY)){
                if(first){
                    moveEntity(X, Y, newX, newY, deactivate);
                } else {
                    moveEntity(X, Y, newX, newY);
                }
                X = newX;
                Y = newY;
                first = false;
            } else {
                sliding = false;
            }
            if (levelData[Y][X].type != "floorice" || isFallable(X, Y)){
                sliding = false;
            }
        }

        return [X, Y];        
    };

    handleKeydown = function(event){
        eventKey = event.keyCode;
        if (eventKey >= 37 && eventKey <= 40){
            event.preventDefault();
        }
        action = KEY_MAP[eventKey];
        if (action != undefined){ 
            if(ready){
                gameMove(action);
            } else {
                bufferedInput = action;
            }
        }
    };

    window.addEventListener("keydown", handleKeydown) 
    
    setImage.onload = function(){
        borderImage.onload = function(){
       
            drawContext.drawImage(borderImage, 0, 0);
            start();
        };
        borderImage.src = BORDER_NAME;
    };
    setImage.src = TILESET;
}
