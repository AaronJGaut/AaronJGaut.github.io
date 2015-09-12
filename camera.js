function getCameraFactory(constants) {
        function Camera(room, player) {
                this.center = {};
                this.center.x = player.x + 12*player.vx + player.width/2;
                this.center.y = player.y + 30*player.vy + player.height/2;
                
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
                        desiredX = player.x + 30*player.vx + player.width/2;
                        desiredY = player.y + 30*player.vy + player.height/2;        
                        this.center.x = (24*this.center.x + desiredX)/25;
                        this.center.y = (24*this.center.y + desiredY)/25;
                        if (Math.abs(desiredX - this.center.x) < 1/constants.TILE_SIZE) {
                                this.center.x = desiredX;
                        }
                        if (Math.abs(desiredY - this.center.y) < 1/constants.TILE_SIZE) {
                                this.center.y = desiredY;
                        }
                        this.enforceBounds();

                };

                this.transformPoint = function(point) {
                        var snapToTile = function(n) { return Math.round(n*constants.TILE_SIZE)/constants.TILE_SIZE; };
                        return {
                                "x" : snapToTile(point.x) - snapToTile(this.center.x) + constants.CAMERA_WIDTH/2,
                                "y" : snapToTile(point.y) - snapToTile(this.center.y) + constants.CAMERA_HEIGHT/2
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
