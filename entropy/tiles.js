function getTileFactory(){
        function AbstractTile(x, y) {
                this.x = x;
                this.y = y;

                this.getBox = function() {
                        return {
                                "bl" : { "x" : this.x, "y" : this.y },
                                "tr" : { "x" : this.x+1, "y" : this.y+1 }
                        };
                };

                this.logCollision = function(collision) { return undefined; };
                this.handleCollisions = function() { return undefined; };
        }

        var tilePrototypes = {
                "wall" : function(x, y) {
                                this.inherit = AbstractTile;
                                this.inherit(x, y);
                                this.type = "wall";
                }        
        };

        return tilePrototypes;
}
