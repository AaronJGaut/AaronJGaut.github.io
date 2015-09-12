function KeyboardInterface(keybind) {
        var keybind = keybind;

        this.states = {};
        
        this.reset = function(){
                this.states.left = false;
                this.states.right = false;
                this.states.up = false;
                this.states.down = false;
                this.states.jump = false;
                this.states.action1 = false;
                this.states.action2 = false;
                this.states.menu = false;
        }

        this.getSnapshot = function() {
                return {
                        "left" : this.states.left,
                        "right" : this.states.right,
                        "up" : this.states.up,
                        "down" : this.states.down,
                        "jump" : this.states.jump,
                        "action1" : this.states.action1,
                        "action2" : this.states.action2,
                        "menu" : this.states.menu
                }
        }

        this.setKeybind = function(newKeybind) {
                keybind = newKeybind;
        }

        window.addEventListener("keydown", (function(keyboard) { 
                return function(event) {
                        //console.log("keydown:" + event.keyCode);
                        if (event.defaultPrevented) {
                                return;
                        }

                        var keyId = keybind[event.keyCode];
                        if (keyId != undefined) {
                                keyboard.states[keyId] = true;
                        }
                }
        }(this)));

        window.addEventListener("keyup", (function(keyboard) { 
                return function(event) {
                        //console.log("keyup:" + event.keyCode);
                        if (event.defaultPrevented) {
                                return;
                        }

                        var keyId = keybind[event.keyCode];
                        if (keyId != undefined) {
                                keyboard.states[keyId] = false;
                        }
                }
        }(this)));

        this.reset();
}
