function ProcessStack() {
        this.stack = [];
}

ProcessStack.prototype.push = function(stepFunction, suppressFlag) {
        this.stack.push({
                "func" : stepFunction,
                "suppress" : suppressFlag
        });
};

ProcessStack.prototype.pop = function() {
        this.stack.pop();
};

ProcessStack.prototype.step = function() {
        for (var i = this.stack.length-1; i >= 0; i--) {
                this.stack[i].func();
                if (this.stack[i].suppress) {
                        return;
                }
        }
};
