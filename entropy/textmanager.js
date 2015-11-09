function TextManager(styles, fonts, colorDict) {
// Stores text style information and handles drawing text to a given canvas
        
        this.styles = {};

        for (styleId in styles) {
                // Building styles from font and color data
                var font = fonts[styles[styleId].font];
                // Handles the case where the given color is a 3-byte rgb hex value / string representation
                var colorHex = parseInt(styles[styleId].color);
                if (isNaN(colorHex)) {
                        // Handles the case where the given color is a css color name
                        colorHex = parseInt(colorDict[styles[styleId].color]);
                }
                if (isNaN(colorHex)) {
                        throw "Bad color for text style: " + styleId;
                }

                var rgb = [
                        Math.floor(colorHex / 0x10000),
                        Math.floor((colorHex % 0x10000) / 0x100),
                        colorHex % 0x100
                ];
                

                var styleCv = document.createElement("canvas");
                styleCv.width = font.image.width;
                styleCv.height = font.image.height;
                var styleCtx = styleCv.getContext("2d");
                
                styleCtx.drawImage(font.image, 0, 0);
                var fontData = styleCtx.getImageData(0, 0, styleCv.width, styleCv.height);
                
                var styleData = styleCtx.createImageData(fontData);

                
                for (var i = 0; i < fontData.data.length; i+=4) {
                        if (fontData.data[i] === 0 && fontData.data[i+1] === 0
                        && fontData.data[i+2] === 0 && fontData.data[i+3] === 0xff) {
                                styleData.data[i] = rgb[0];
                                styleData.data[i+1] = rgb[1];
                                styleData.data[i+2] = rgb[2];
                                styleData.data[i+3] = 0xff;
                        }
                }

                styleCtx.putImageData(styleData, 0, 0);
               
                var test = styleCtx.getImageData(0, 0, styleCv.width, styleCv.height);
 
                var styleObj = {};
                styleObj.sheet = styleCv;
                styleObj.width = font.width;
                styleObj.height = font.height;
                styleObj.spacing = font.spacing;
                styleObj.padding = font.padding;
                styleObj.coords = {};

                for (symbol in font.coords) {
                        styleObj.coords[symbol] = {
                                "x" : font.coords[symbol].x,
                                "y" : font.coords[symbol].y
                        };
                }

                this.styles[styleId] = styleObj;
        }

        this.drawText = function(text, styleId, targetCtx, tlx, tly) {
                var style = this.styles[styleId];

                tlx = Math.round(tlx + style.padding);
                tly = Math.round(tly + style.padding);
                
                for (var i = 0; i < text.length; i++) {
                        var coord = style.coords[text[i]];
                        if (coord !== undefined) {
                                var x = coord.x * style.width;
                                var y = coord.y * style.height;
                                
                                targetCtx.drawImage(style.sheet, x, y, style.width, style.height,
                                                    tlx, tly, style.width, style.height);
                                tlx += style.width + style.spacing;
                        }
                }
        }
}
