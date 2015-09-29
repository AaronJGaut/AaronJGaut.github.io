//Provides a cleaner interface for using a js object as a set
//Note: elements will be casted to strings in the set
function Set() {
        this._internal = {};
}

Set.prototype.add = function(e) {
        this._internal[e] = true;
};

Set.prototype.union = function(otherSet) {
        for (e in otherSet._internal) {
                this.add(e);
        }                
};

Set.prototype.remove = function(e) {
        delete this._internal[e];
};

Set.prototype.elements = function() {
        var elmts = [];
        for (e in this._internal) {
                elmts.push(e);
        }
        return elmts;
};

Set.prototype.contains = function(e) {
        return (e in this._internal);
};

Set.prototype.toString = function() {
        var elmts = this.elements();
        if (elmts.length === 0) {
                return "{}";
        }
        return "{ " + elmts.join(", ") + " }";
};
