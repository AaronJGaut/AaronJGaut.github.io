function ProcessStack() {
        /* ProcessStack is a data structure used to control evaluation of functions
         * 
         * Multistack behaves like a sparse array where each entry is a stack.
         *
         * Definition: 
         * suppress heirarchy - This is an ordering of functions in
         * the multistack. Stacks at a lower suppressLevel are higher in the heirarchy
         * than stacks at a higher suppressLevel. Within a stack, funtions are ordered
         * from highest in the heirarchy at the top of the stack to lowest at the bottom.
         *
         * suppress - Only functions that are not suppressed will be called. The function
         * at the top of the suppress heirarchy is never suppressed. If a function was
         * pushed with suppressFlag set to true, it will suppress all functions below it
         * in the suppress heirarchy.
         */
        this.multistack = {};
}

ProcessStack.prototype.push = function(stepFunction, suppressFlag, suppressLevel, callPriority) {
        /* Adds a function to the multistack. The arguments determine where the function
         * will be placed in the suppress heirarchy and what order the function should be called in.
         *
         * Arguments:
         *      -stepFunction - the function to be called
         *      -suppressFlag - if true, no functions below this one in the suppress
         *                      heirarchy will be called
         *      -suppressLevel - integer that determines which stack the function 
         *                       will be pushed to. A lower value means a higher
         *                       level in the suppress heirarchy.
         *      -callPriority - determines what order the functions will be called in.
         *                      Lower callPriority means sooner evaluation.
         *                       
         */
        if (callPriority === undefined) {
                callPriority = 0;
        }

        if (this.multistack[suppressLevel] === undefined) {
                this.multistack[suppressLevel] = [];
        }
        this.multistack[suppressLevel].push({
                "func" : stepFunction,
                "suppress" : suppressFlag,
                "order" : callPriority,
                "level" : suppressLevel,
                "stackPosition" : this.multistack[suppressLevel].length
        });
};

ProcessStack.prototype.pop = function(suppressLevel) {
        /* Pops the function at the top of the stack of the given suppressLevel
         */
        if (this.multistack[suppressLevel] !== undefined) {
                this.multistack[suppressLevel].pop();
                if (this.multistack[suppressLevel].length === 0) {
                        delete this.multistack[suppressLevel];
                }
        }
};

ProcessStack.prototype.call = function() {
        /* Calls the non-suppressed functions in the multistack.
         * 
         * The suppress heirarchy is used to determine which functions
         * to call
         * 
         * The non-suppressed functions will be called
         * in the order determined by what callPrioritys were used when
         * pushing the functions to the multistack.
         *
         * If nothing is suppressed, returns false; otherwise true.
         */
        var stepFuncs = [];
        var suppressed = false;

        var levels = [];
        
        // Getting indices of stacks in multistack
        for (var level in this.multistack) {
                levels.push(level);
        }

        // Sorting the indices so lower level stacks come first
        levels.sort();

        // Gathering non-suppressed functions
        for (var i = 0; i < levels.length; i++) {
                var level = levels[i];
                for (var j = this.multistack[level].length-1; j >= 0; j--) {
                        stepFuncs.push(this.multistack[level][j]);
                        if (this.multistack[level][j].suppress) {
                                suppressed = true;
                                break;
                        }
                }
                if (suppressed) {
                        break;
                }
        }

        // Sorting non-suppressed functions by callPriority, or if callPriority
        // is equal, by suppress heirarchy
        stepFuncs.sort(function(a, b) {
                if (a.order - b.order != 0) {
                        return a.order - b.order;
                }
                if (a.level - b.level != 0) {
                        return a.level - b.level;
                }
                return b.stackPosition - a.stackPosition;
        });

        // Calling non-suppressed functions
        for (var i = 0; i < stepFuncs.length; i++) {
                stepFuncs[i].func();
        }

        return suppressed;
};
