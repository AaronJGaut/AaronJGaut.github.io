function getCameraFactory(constants) {
        var VX_FACTOR = constants.CAMERA_VX_FACTOR;
        var VY_FACTOR = constants.CAMERA_VY_FACTOR;

        var X_DESIRE_WEIGHT = constants.CAMERA_X_DESIRE_WEIGHT;
        var Y_DESIRE_WEIGHT = constants.CAMERA_Y_DESIRE_WEIGHT;
        
        if (X_DESIRE_WEIGHT > 1 || X_DESIRE_WEIGHT < 0) {
                throw "constant CAMERA_X_DESIRE_WEIGHT should be in the range [0,1]";
        }
        if (Y_DESIRE_WEIGHT > 1 || Y_DESIRE_WEIGHT < 0) {
                throw "constant CAMERA_Y_DESIRE_WEIGHT should be in the range [0,1]";
        }
        
        var X_OLD_WEIGHT = 1 - X_DESIRE_WEIGHT;
        var Y_OLD_WEIGHT = 1 - Y_DESIRE_WEIGHT;
        
        function Camera(room, player) {
                this.center = {};
                this.center.x = player.x + VX_FACTOR*player.vx + player.width/2;
                this.center.y = player.y + VY_FACTOR*player.vy + player.height/2;
                
                if (room.width < constants.CAMERA_WIDTH || room.height < constants.CAMERA_HEIGHT) {
                        //if room is too small, enter free mode
                        this.mode = "free";
                }
                else {
                        //otherwise, dont let camera go out of bounds
                        this.mode = "bounded";
                }

                this.enforceBounds = function() {
                        //free mode lets camera go out of bounds
                        if (this.mode === "free") {
                                return;
                        }

                        this.bleft = false;
                        this.bright = false;
                        this.btop = false;
                        this.bbottom = false;
                        //enforce left bounds
                        if (this.center.x - constants.CAMERA_WIDTH/2 < 0) {
                                this.bleft = true;
                                this.center.x = constants.CAMERA_WIDTH/2;
                        }
                        //enforce right bounds
                        if (this.center.x + constants.CAMERA_WIDTH/2 > room.width) {
                                this.bright = true;
                                this.center.x = room.width - constants.CAMERA_WIDTH/2;
                        }

                        //enforce bottom bounds
                        if (this.center.y - constants.CAMERA_HEIGHT/2 < 0) {
                                this.bbottom = true;
                                this.center.y = constants.CAMERA_HEIGHT/2;
                        }
                        //enforce top bounds
                        if (this.center.y + constants.CAMERA_HEIGHT/2 > room.height) {
                                this.btop = true;
                                this.center.y = room.height - constants.CAMERA_HEIGHT/2;
                        }
                }
               
                this.updateCenter = function() {
                        desiredX = player.x + VX_FACTOR*player.vx + player.width/2;
                        desiredY = player.y + VY_FACTOR*player.vy + player.height/2;        
                        this.center.x = X_OLD_WEIGHT*this.center.x + X_DESIRE_WEIGHT*desiredX;
                        this.center.y = Y_OLD_WEIGHT*this.center.y + Y_DESIRE_WEIGHT*desiredY;

                        this.enforceBounds();
                };

                this.transformPoint = function(point) {
                        var snapToTile = function(n) { return Math.round(n*constants.TILE_SIZE)/constants.TILE_SIZE; };
                        return {
                                "x" : (player.lastInput.right + player.lastInput.left === 1 ? point.x : snapToTile(point.x)) - this.center.x + constants.CAMERA_WIDTH/2,
                                "y" : point.y - this.center.y + constants.CAMERA_HEIGHT/2
                        };
                };
 
                this.transformBox = function(box) {
                        return {
                                "bl" : this.transformPoint(box.bl),
                                "tr" : this.transformPoint(box.tr)
                        };
                };

                this.updateCenter();
        }
        return Camera;
}
