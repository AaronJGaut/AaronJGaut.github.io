function DrawManager(constants) {
        this.constants = constants;
        this.cvm = new CanvasManager(constants);
        this.SCALE = constants.TILE_SIZE; 
        this.cvheight = constants.CAMERA_HEIGHT*this.SCALE + constants.OVERLAY_HEIGHT;
        this.cvwidth = constants.CAMERA_WIDTH*this.SCALE;
}

DrawManager.prototype.drawEntity = function(entity) {
        /* Draws an entity
         *
         * The entity must have certain attributes.
         *      - x and y are the tile based coordinates of the entity,
         *      meaning that (0, 0) is the bottom left corner and
         *      the width of a tile is 1.
         *      - width and height are the tile based width and height of
         *      the entities sprites.
         *      - spriteCoord, which has two attributes, x and y. In
         *      this case, (0, 0) is the top left corner of the spritesheet
         *      and increasing either dimension by 1 moves over 1 sprite
         *      in the corresponding direction
         *      - zLevel is which layer the entity should be drawn to.
         */

        // bl corner of entire room is (0, 0), a tile is one unit.
        var absoluteTileCoord = {"x":entity.x, "y":entity.y};

        // bl corner of camera is (0, 0), a tile is one unit.
        var relativeTileCoord = this.camera.transformPoint(absoluteTileCoord);

        // tl corner of canvas is (0, 0), a pixel is one unit.
        var drawX = Math.round(relativeTileCoord.x * this.SCALE);
        var drawY = this.cvheight - Math.round((relativeTileCoord.y+entity.height) * this.SCALE);

        // Location of sprite to draw on spritesheet, (0, 0) is tl corner.
        // Integer coordinates correspond to the various sprites.
        var spriteCoordX = entity.spriteCoord.x * entity.width * this.SCALE;
        var spriteCoordY = entity.spriteCoord.y * entity.height * this.SCALE;

        this.cvm.drawSprite(entity.sprites, spriteCoordX, spriteCoordY,
                        entity.width*this.SCALE, entity.height*this.SCALE,
                        entity.zIndex, drawX, drawY);
};

DrawManager.prototype.initWorld = function(background, tilesheet) {
        this.cvm.drawSprite(background, 0, 0, this.cvwidth, this.cvheight-this.constants.OVERLAY_HEIGHT,
                        this.constants.BACKGROUND_LAYER, 0, this.constants.OVERLAY_HEIGHT);
        this.tilesheet = tilesheet;
};

DrawManager.prototype.initRoom = function(room, camera) {
        /* Draws all tiles in the room to an internal canvas.
         * The visible portion will be copied to a displayed canvas later.
         */
        this.camera = camera;
        this.tileCv = document.createElement("canvas");
        this.tileCv.width = room.width * this.SCALE;
        this.tileCv.height = room.height * this.SCALE;
        this.tileCtx = this.tileCv.getContext("2d");

        for (var i = 0; i < room.width; i++) {
                for (var j = 0; j < room.height; j++) {
                        if (room.drawCoords[i][j] !== undefined)
                                this.tileCtx.drawImage(this.tilesheet, room.drawCoords[i][j][0]*this.SCALE,
                                                        room.drawCoords[i][j][1]*this.SCALE, this.SCALE, this.SCALE,
                                                        Math.round(i*this.SCALE), Math.round((room.height-j-1)*this.SCALE),
                                                        this.SCALE, this.SCALE);
                }
        }
};

DrawManager.prototype.updateTile = function() {
        //redraws 1 tile. TBD
        return;
};

DrawManager.prototype.startFrame = function() {
        this.cvm.clearLayer(this.constants.TILE_LAYER);
        this.cvm.clearLayer(4);
}

DrawManager.prototype.endFrame = function() {
        /* Contains behavior for end of draw cycle.
         *      -Redraws visible tiles
         */
        var xtlTiles = Math.round((this.camera.center.x - this.constants.CAMERA_WIDTH/2)*this.SCALE);
        var ytlTiles = Math.round(this.tileCv.height - (this.camera.center.y + this.constants.CAMERA_HEIGHT/2)*this.SCALE);
        this.cvm.drawSprite(this.tileCv, xtlTiles, ytlTiles, this.constants.CAMERA_WIDTH*this.SCALE,
                        this.constants.CAMERA_HEIGHT*this.SCALE, this.constants.TILE_LAYER, 0, this.constants.OVERLAY_HEIGHT);
        return;
};
