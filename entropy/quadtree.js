//Implements the quadtree data structure.
//Anything added to the tree should implement the behavior of a Box object.
//id should be unique for each box in the tree at a given time. 
//If not, unexpected behavior may occur.

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

var data = {
        "box1" : new Box(0, 0, 10, 10, "box1"),
        "box2" : new Box(2, 3, 7, 8, "box2"),
        "box3" : new Box(5, 5, 6, 6, "box3"),
        "box4" : new Box(1, 2, 3, 4, "box4"),
        "box5" : new Box(-1, -1, 0, 0, "box5"),
        "box6" : new Box(2, 2, 3, 3, "box6"),
        "box7" : new Box(8, 10, 9, 11, "box7"),
        "box8" : new Box(0, 8, 1, 9, "box8"),
        "box9" : new Box(7, 1, 9, 4, "box9"),
        "box10" : new Box(5, 10, 6, 11, "box10")
}

var dataBounds = new Box(-1, -1, 10, 11);

function getColliderFactory(NODE_MAX, MAX_DEPTH) {
        function Collider(boxes, bounds) {
                function Node(bounds, depth) {
                        this.bounds = bounds;
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
                                        this.center = {"x" : (this.bounds.bl.x + this.bounds.tr.x)/2, "y" : (this.bounds.bl.y + this.bounds.tr.y)/2};
                                        
                                        //top right
                                        var q1 = new Node(new Box(center.x, center.y, this.bounds.tr.x, this.bounds.tr.y), this.depth+1);
                                        
                                        //top left
                                        var q2 = new Node(new Box(this.bounds.bl.x, center.y, center.x, this.bounds.tr.y), this.depth+1); 
                                        
                                        //bottom left
                                        var q3 = new Node(new Box(this.bounds.bl.x, this.bounds.bl.y, center.x, center.y), this.depth+1);
                                        
                                        //bottom right
                                        var q4 = new Node(new Box(center.x, this.bounds.bl.y, this.bounds.tr.x, center.y), this.depth+1);                                        
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
                                var left = box.bl.x <= this.center.x;
                                var right = box.tr.x >= this.center.x;
                                var up = box.tr.y >= this.center.y;
                                var down = box.bl.y <= this.center.y;
                                
                                if (right && up) {
                                        this.children[0].remove(box);
                                }
                                if (left && up) {
                                        this.children[1].remove(box);
                                }
                                if (left && down) {
                                        this.children[2].remove(box);
                                }
                                if (right && down) {
                                        this.children[3].remove(box);
                                }

                                var grandkids = [];
                                for (var i = 0; i < this.children.length; i++) {
                                        if (!this.children[i].isLeaf) {
                                                return;
                                        }
                                        grandkids = grandkids.concat(this.children[i].boxes);
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
                                var left = box.bl.x <= this.center.x;
                                var right = box.tr.x >= this.center.x;
                                var up = box.tr.y >= this.center.y;
                                var down = box.bl.y <= this.center.y;
                                
                                if (right && up) {
                                        this.children[0].getCollisions(box, collisions);
                                }
                                if (left && up) {
                                        this.children[1].getCollisions(box, collisions);
                                }
                                if (left && down) {
                                        this.children[2].getCollisions(box, collisions);
                                }
                                if (right && down) {
                                        this.children[3].getCollisions(box, collisions);
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
                                var left = box.bl.x <= this.center.x;
                                var right = box.tr.x >= this.center.x;
                                var up = box.tr.y >= this.center.y;
                                var down = box.bl.y <= this.center.y;
                                
                                if (right && up) {
                                        this.children[0].getCollisionsAndRemove(box, collisions);
                                }
                                if (left && up) {
                                        this.children[1].getCollisionsAndRemove(box, collisions);
                                }
                                if (left && down) {
                                        this.children[2].getCollisionsAndRemove(box, collisions);
                                }
                                if (right && down) {
                                        this.children[3].getCollisionsAndRemove(box, collisions);
                                }
                                
                                var grandkids = [];
                                for (var i = 0; i < this.children.length; i++) {
                                        if (!this.children[i].isLeaf) {
                                                return;
                                        }
                                        grandkids = grandkids.concat(this.children[i].boxes);
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

                this.head = new Node(bounds, 0);

                for (var id in boxes) {
                        this.head.insert(boxes[id]);
                }
        }

        Collider.prototype.add = function(box) {
                this.head.add(box);
        };

        Collider.prototype.remove = function(box) {
                if (head.intersects(box)) {
                        this.head.remove(box);
                }
        };

        Collider.prototype.getCollisions = function(box) {
                var collisions = new Set();
                if (head.intersects(box)) {
                        return this.head.getCollisions(box, collisions);
                }
                return collisions.elements();
        };

        Collider.prototype.getCollisionsAndRemove = function(box) {
                //gets collisions and removes in one traversal
                var collisions = new Set();
                if (head.intersects(box)) {
                        this.head.getCollisionsAndRemove(box, collisions);
                }
                return collisions.elements();
        };

        return Collider;
}
