//Implements the quadtree data structure.
//Anything added to the tree should implement the behavior of a Box object.
//id should be unique for each box in the tree at a given time. 
//If not, unexpected behavior may occur.



function getColliderFactory(constants) {
        var Box = function(xbl, ybl, xtr, ytr, id) {
                this.bl = {
                        "x" : xbl,
                        "y" : ybl
                };
                this.tr = {
                        "x" : xtr,
                        "y" : ytr
                };
                this.id = id;
        };
        Box.prototype.intersects = function(box) {
                return  this.bl.x < box.tr.x &&
                        this.tr.x > box.bl.x &&
                        this.bl.y < box.tr.y &&
                        this.tr.y > box.bl.y;
        }

        Box.prototype.toString = function() {
                var idStr = this.id === undefined ? "" : this.id + " = ";
                return idStr + "bl: (" + this.bl.x + "," + this.bl.y + "), tr: (" + this.tr.x + "," + this.tr.y + ")";
        };
       
        var NODE_MAX = constants.QUADTREE_MAX_NODESIZE;
        var MAX_DEPTH = constants.QUADTREE_MAX_DEPTH;
 
        function Collider(bounds) {

                function Node(bounds, depth) {
                        this.bounds = bounds;
                        this.center = {
                                "x" : (this.bounds.bl.x + this.bounds.tr.x)/2,
                                "y" : (this.bounds.bl.y + this.bounds.tr.y)/2
                        };
                        this.depth = depth;
                        this.isLeaf = true;
                        this.boxes = [];
                }

                Node.prototype.intersects = function(box) {
                        return  this.bounds.intersects(box);
                };

                Node.prototype.insert = function(box) {
                        if(this.isLeaf) {
                                if (this.boxes.length == NODE_MAX && this.depth < MAX_DEPTH) {
                                        //time to split this up into quadrants
                                        this.isLeaf = false;
                                        
                                        //top right
                                        var q1 = new Node(new Box(this.center.x, this.center.y, this.bounds.tr.x, this.bounds.tr.y), this.depth+1);
                                        
                                        //top left
                                        var q2 = new Node(new Box(this.bounds.bl.x, this.center.y, this.center.x, this.bounds.tr.y), this.depth+1); 
                                        
                                        //bottom left
                                        var q3 = new Node(new Box(this.bounds.bl.x, this.bounds.bl.y, this.center.x, this.center.y), this.depth+1);
                                        
                                        //bottom right
                                        var q4 = new Node(new Box(this.center.x, this.bounds.bl.y, this.bounds.tr.x, this.center.y), this.depth+1);                                        
                                        this.children = [q1, q2, q3, q4];

                                        for (var i = 0; i < this.boxes.length; i++) {
                                                this.insert(this.boxes[i]);
                                        }

                                        delete this.boxes;
                                        
                                        //recall the function; box will be placed in appropriate quadrants
                                        this.insert(box);
                                }
                                else {
                                        //box can go in this node
                                        this.boxes.push(box);
                                }
                        }
                        else {
                                //not a leaf node; add to children
                                for (var i = 0; i < this.children.length; i++) {
                                        if (this.children[i].intersects(box)) {
                                                this.children[i].insert(box);
                                        }
                                }
                        }
                };

                Node.prototype.remove = function(box) {
                        if (this.isLeaf) {
                                for (var i = 0; i < this.boxes.length; i++) {
                                        if (box.id === this.boxes[i].id) {
                                                this.boxes.splice(i, 1);
                                                i--;
                                        }
                                }
                        }
                        else {
                                for (var i = 0; i < this.children.length; i++) {
                                        if (this.children[i].intersects(box)) {
                                                this.children[i].getCollisions(box, collisions);
                                        }
                                }

                                var grandkidsSet = {};
                                for (var i = 0; i < this.children.length; i++) {
                                        if (!this.children[i].isLeaf) {
                                                return;
                                        }
                                        for (var j = 0; j < this.children[i].boxes.length; j++) {
                                                grandkidsSet[this.children[i].boxes[j].id] = this.children[i].boxes[j];
                                        }
                                }

                                var grandkids = [];
                                for (kid in grandkidsSet) {
                                        grandkids.push(grandkidsSet[kid]);
                                }

                                if (grandkids.length <= NODE_MAX) {
                                        this.isLeaf = true;
                                        this.boxes = grandkids;
                                        for (var i = 0; i < this.children.length; i++) {
                                                delete this.children[i];
                                        }
                                        delete this.children;
                                }
                        }
                };

                Node.prototype.getCollisions = function(box, collisions) {
                        if (this.isLeaf) {
                                for (var i = 0; i < this.boxes.length; i++) {
                                        if (this.boxes[i].id !== box.id && this.boxes[i].intersects(box)) {
                                                collisions.add(this.boxes[i].id);
                                        }
                                }
                        }

                        else {
                                for (var i = 0; i < this.children.length; i++) {
                                        if (this.children[i].intersects(box)) {
                                                this.children[i].getCollisions(box, collisions);
                                        }
                                }
                        }
                        
                };

                Node.prototype.getCollisionsAndRemove = function(box, collisions) {
                        if (this.isLeaf) {
                                for (var i = 0; i < this.boxes.length; i++) {
                                        if (this.boxes[i].id === box.id) {
                                                this.boxes.splice(i, 1);
                                                i--;
                                        }
                                        else if (this.boxes[i].intersects(box)) {
                                                collisions.add(this.boxes[i].id);
                                        }
                                        
                                }
                        }

                        else {
                                for (var i = 0; i < this.children.length; i++) {
                                        if (this.children[i].intersects(box)) {
                                                this.children[i].getCollisions(box, collisions);
                                        }
                                }
                                
                                var grandkidsSet = {};
                                for (var i = 0; i < this.children.length; i++) {
                                        if (!this.children[i].isLeaf) {
                                                return;
                                        }
                                        for (var j = 0; j < this.children[i].boxes.length; j++) {
                                                grandkidsSet[this.children[i].boxes[j].id] = this.children[i].boxes[j];
                                        }
                                }

                                var grandkids = [];
                                for (kid in grandkidsSet) {
                                        grandkids.push(grandkidsSet[kid]);
                                }

                                if (grandkids.length <= NODE_MAX) {
                                        this.isLeaf = true;
                                        this.boxes = grandkids;
                                        for (var i = 0; i < this.children.length; i++) {
                                                delete this.children[i];
                                        }
                                        delete this.children;
                                }
                        }
                

                };

                Node.prototype.toString = function() {
                        var spacing = "";
                        for (var i = 0; i < this.depth; i++) {
                                spacing += "| ";
                        }
                        if (this.isLeaf) {
                                this.bounds.id = "leafnode";
                                var msg = "\n" + spacing + this.bounds.toString();
                                for (var i = 0; i < this.boxes.length; i++) {
                                        msg += "\n| " + spacing + this.boxes[i].toString();
                                }
                                return msg;
                        }
                        else {
                                this.bounds.id = "nonleafnode";
                                var msg = "\n" + spacing + this.bounds.toString();
                                for (var i = 0; i < this.children.length; i++) {
                                        msg += this.children[i].toString();
                                }
                                return msg;
                        }
                };

                this.contents = {};
                
                var boundsCopy = new Box(bounds.bl.x, bounds.bl.y, bounds.tr.x, bounds.tr.y);
                this.head = new Node(boundsCopy, 0);
        }

        Collider.prototype.insert = function(box) {
                if (this.contents[box.id] !== undefined) {
                        throw box.id + " already belongs to collider";
                }

                // A box won't be added if it is completely outside the quadtree
                if (this.head.intersects(box)) {
                        var boxCopy = new Box(box.bl.x, box.bl.y, box.tr.x, box.tr.y, box.id);
                        this.head.insert(boxCopy);
                        this.contents[boxCopy.id] = boxCopy;
                }
        };

        Collider.prototype.remove = function(id) {
                var target = this.contents[id];

                if (target === undefined) return;

                this.head.remove(target);
                delete this.contents[id];   
        };

        Collider.prototype.getCollisions = function(id) {
                var target = this.contents[id];
                var collisions = new Set(); 
       
                if (target !== undefined) { 
                        this.head.getCollisions(this.contents[id], collisions);
                }                

                return collisions.elements();
        };

        Collider.prototype.getCollisionsAndRemove = function(id) {
                //gets collisions and removes in one traversal
                var target = this.contents[id];

                var collisions = new Set();

                if (target !== undefined) {
                        this.head.getCollisionsAndRemove(target, collisions);
                        delete this.contents[id];
                }                

                return collisions.elements();
        };

        Collider.prototype.update = function(box) {
                //box will just be removed if the new location is completely outside the quadtree
                this.remove(box.id);
                this.insert(box);
        };

        return Collider;
}
