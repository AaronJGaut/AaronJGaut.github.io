function CanvasManager(constants) {
        var div = document.getElementById(constants.DIV_ID);
        this.cvwidth = constants.CAMERA_WIDTH*constants.TILE_SIZE;
        this.cvheight = constants.CAMERA_HEIGHT*constants.TILE_SIZE + constants.OVERLAY_HEIGHT;
        
        this.cvLayers = [];
        this.ctxLayers = [];

        for (var i = 0; i < constants.CANVAS_LAYERS; i++) {
                var cv = document.createElement("canvas");

                cv.width = this.cvwidth;
                cv.height = this.cvheight;
                cv.style.width = this.cvwidth*constants.PIXEL_SIZE+"px";
                cv.style.height = this.cvheight*constants.PIXEL_SIZE+"px";
                cv.style.zIndex = i.toString();
                cv.className = constants.CANVAS_CSS_CLASSNAME;

                div.appendChild(cv);

                var ctx = cv.getContext("2d");
                this.cvLayers.push(cv);
                this.ctxLayers.push(ctx);
        }
}

CanvasManager.prototype.drawSprite = function(sourceCv, sourceTlx, sourceTly, width, height, layer, destTlx, destTly) {
        this.ctxLayers[layer].drawImage(sourceCv, sourceTlx, sourceTly, width, height, destTlx, destTly, width, height);
};

CanvasManager.prototype.clearRect = function(tlx, tly, width, height, layer) {
        this.ctxLayers[layer].clearRect(tlx, tly, width, height);
};

CanvasManager.prototype.clearLayer = function(layer) {
        this.ctxLayers[layer].clearRect(0, 0, this.cvwidth, this.cvheight);
};

CanvasManager.prototype.clearAll = function() {
        for (var i = 0; i < this.ctxLayers.length; i++) {
                this.clearLayer(i);
        }
};
