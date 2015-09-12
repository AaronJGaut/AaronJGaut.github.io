//Implements the quadtree data structure
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

Box.prototype.log = function() {
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
                        return  this.bounds.bl.x < box.tr.x &&
                                this.bounds.tr.x > box.bl.x &&
                                this.bounds.bl.y < box.tr.y &&
                                this.bounds.tr.y > box.bl.y;
                };

                Node.prototype.insert = function(box) {
                        if(this.isLeaf) {
                                if (this.boxes.length == NODE_MAX && this.depth < MAX_DEPTH) {
                                        //time to split this up into quadrants
                                        this.isLeaf = false;
                                        var center = {"x" : (this.bounds.bl.x + this.bounds.tr.x)/2, "y" : (this.bounds.bl.y + this.bounds.tr.y)/2};
                                        
                                        //top right
                                        var q1 = new Node(new Box(center.x, center.y, this.bounds.tr.x, this.bounds.tr.y), this.depth+1);
                                        
                                        //top left
                                        var q2 = new Node(new Box(this.bounds.bl.x, center.y, center.x, this.bounds.tr.y), this.depth+1); 
                                        
                                        //bottom left
                                        var q3 = new Node(new Box(this.bounds.bl.x, this.bounds.bl.y, center.x, center.y), this.depth+1);
                                        
                                        //bottom right
                                        var q4 = new Node(new Box(center.x, this.bounds.bl.y, this.bounds.tr.x, center.y), this.depth+1);                                        
                                        //recall the function; box will be placed in appropriate quadrants
                                        this.children = [q1, q2, q3, q4];

                                        for (var i = 0; i < this.boxes.length; i++) {
                                                this.insert(this.boxes[i]);
                                        }

                                        delete this.boxes;
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

                Node.prototype.print = function() {
                        var spacing = "";
                        for (var i = 0; i < this.depth; i++) {
                                spacing += "| ";
                        }
                        if (this.isLeaf) {
                                this.bounds.id = "leafnode";
                                var msg = "\n" + spacing + this.bounds.log();
                                for (var i = 0; i < this.boxes.length; i++) {
                                        msg += "\n| " + spacing + this.boxes[i].log();
                                }
                                return msg;
                        }
                        else {
                                this.bounds.id = "nonleafnode";
                                var msg = "\n" + spacing + this.bounds.log();
                                for (var i = 0; i < this.children.length; i++) {
                                        msg += this.children[i].print();
                                }
                                return msg;
                        }
                };

                this.head = new Node(bounds, 0);

                for (var id in boxes) {
                        this.head.insert(boxes[id]);
                }
        }

        return Collider;
}
