function evogame(container){
    var STEP_RATE = 30;
    var RENDER_RATE = 30;

    var BOT_RADIUS = 13;
    var FOOD_RADIUS = 2;

    var CONDITIONS = 20;
    var MAX_SUBCONDITIONS = 5;
    var SUBCONDITION_ACTIVATION_RATE = 0.5;

    var POPULATION_SIZE = 40;
    var REPRODUCERS_SIZE = 8;

    var MIN_TIMEOUT = 1000;
    var CHANGE_TIMEOUT = 1000;
    var FAST_SELECTION = true;

    var INITIAL_FOOD = 100;
    var FOOD_DELAY = 10;
    var FOOD_BATCH_SIZE = 1;
    var FOOD_SPAWN_RELATIVE = true;

    var FOOD_VALUE = 50;
    var HUNGER_DRAIN = 0.2;
    var HEALTH_DRAIN = 1;
    var MAX_HEALTH = 100;
    var MAX_HUNGER = 100;
    var HEAL_THRESHOLD = 80;
    var HEALTH_RECOVERY = 0.2;
    var INITIAL_HEALTH = 80;
    var INITIAL_HUNGER = 50;

    var FOG_DISTANCE = 100;
    var VISION_DISTANCE = 200;

    var CENTER_VISION_WIDTH = toRad(30);
    var SIDE_VISION_WIDTH = toRad(60);
    var SIDE_VISION_PLACEMENT = toRad(45);

    var LINEAR_FRICTION = 0.95;
    var RADIAL_FRICTION = 0.9;
    
    var LINEAR_IMPULSE = 0.2;
    var RADIAL_IMPULSE = toRad(1);
    var BRAKING_RATE = 0.5;

    var USE_CROSSOVER = false;

    var CROSSOVER_RATE = 0.2;
    var CONDITION_MUTATION_RATE = 0.005;
    var SUBCONDITION_MUTATION_RATE = 0.005;
    var SUBCONDITION_TWEAK_RATE = 0.01;
    var ACTION_MUTATION_RATE = 0.005; 
    var SWAP_MUTATION_RATE = 0.005;

    var FLAG_MUTATION_RATE = 0.1;
    var FLAG_PLACEMENT_MUTATION_MAX = toRad(20);
    var FLAG_TILT_MUTATION_MAX = toRad(10);

    var CONDITION_MUTATION_VALUE = 100;
    var SUBCONDITION_MUTATION_VALUE = 20;
    var SUBCONDITION_TWEAK_VALUE = 10;
    var ACTION_MUTATION_VALUE = 20;
    var SWAP_MUTATION_VALUE = 20;
    var FLAG_PLACEMENT_MUTATION_VALUE = 1
    var FLAG_TILT_MUTATION_VALUE = 2

    var paused = false;

    var canvas = undefined; 
    var context = undefined;
    var width = undefined;
    var height = undefined;

    var min_x = undefined;
    var min_y = undefined;
    var max_x = undefined;
    var max_y = undefined;

    var eye_l_mid = -SIDE_VISION_PLACEMENT;
    var eye_l_min = eye_l_mid - SIDE_VISION_WIDTH/2;
    var eye_l_max = eye_l_mid + SIDE_VISION_WIDTH/2;
    
    var eye_c_mid = 0;
    var eye_c_min = eye_c_mid - CENTER_VISION_WIDTH/2;
    var eye_c_max = eye_c_mid + CENTER_VISION_WIDTH/2;

    var eye_r_mid = SIDE_VISION_PLACEMENT;
    var eye_r_min = eye_r_mid - SIDE_VISION_WIDTH/2;
    var eye_r_max = eye_r_mid + SIDE_VISION_WIDTH/2;

    var eat_dist = get_eat_dist();

    var w_generation = undefined;
    var w_timer = undefined;
    var w_food = [];
    var w_stepID = undefined;
    var w_renderID = undefined;
    var w_min_healths = undefined;
    var w_min_hungers = undefined;
    var w_min_living = undefined;

    var senses = ["eye_l", "eye_c", "eye_r", "eye_l_dist", "eye_c_dist",
                  "eye_r_dist", "rand1", "rand2", "rand3", "health",
                  "hunger", "speed", "heading", "rot_vel"];
  
    var action_mutations = {"ON" : ["PULSE"],
                            "PULSE" : ["ON", "STAY"],
                            "STAY" : ["PULSE", "BLOCK"],
                            "BLOCK" : ["STAY", "OFF"],
                            "OFF" : ["BLOCK"] };

    var action_types = ["ON", "OFF", "STAY", "PULSE", "BLOCK"];
 
    function toRad(deg) { return deg*Math.PI/180; }
    function toDeg(rad) { return make_nice(rad*180/Math.PI); }
 
    function make_nice(x) {
        var whole = Math.floor(x);
        var decimal = x - whole;
        var eps = 0.000001;
        if (decimal < eps || 1 - decimal < eps){
            return Math.round(x);
        }
        var nice_denoms = [64, 80, 100, 125];
        for (i = 0; i < nice_denoms.length; i++){
            var d = nice_denoms[i];
            for (n = 1; n < d; n++){
                if (Math.abs(n/d - decimal) < eps){
                    return whole + n/d;
                }
            }
        }
        return x.toPrecision(7);
    }

    function lt(a, b){ return a < b; }
    function gt(a, b){ return a > b; }
    function eq(a, b){ return a == b; }

    function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

    function rel_heading(x1, y1, h, x2, y2){
        if (x1 == x2 && y1 == y2) {
            if (h >= 0) {
                return h - Math.PI;
            }
            else {
                return h + Math.PI;
            }
        }
        var v1x = Math.cos(h);
        var v1y = Math.sin(h);
        var v2x = x2 - x1;
        var v2y = y2 - y1;

        var dot = v1x*v2x + v1y*v2y;
        var v1normsq = v1x*v1x + v1y*v1y;
        var v2normsq = v2x*v2x + v2y*v2y; 
        
        var heading = Math.acos(dot/Math.sqrt(v1normsq*v2normsq));
        return heading * sign(v1x*v2y - v1y*v2x); 
    }

    function next_collide(x, y, vx, vy) {
        if (vx < 0) {
            var col_y = (vy/vx)*(min_x - x) + y;
            if (col_y <= max_y && col_y >= min_y) {
                return new Coords(min_x, col_y);
            }
        }
        if (vx > 0) {
            var col_y = (vy/vx)*(max_x - x) + y;
            if (col_y <= max_y && col_y >= min_y) {
                return new Coords(max_x, col_y);
            }
        }
        if (vy < 0) {
            var col_x = (vx/vy)*(min_y - y) + x;
            if (col_x <= max_x && col_x >= min_x) {
                return new Coords(col_x, min_y);
            }
        }
        if (vy > 0) {
            var col_x = (vx/vy)*(max_y - y) + x;
            if (col_x <= max_x && col_x >= min_x) {
                return new Coords(col_x, max_y);
            }
        }
        return null;
    }

    function Coords(x, y){
        this.x = x;
        this.y = y;
    }

    var inequalities = [lt, gt];
    var equalities = [eq];

    function shuffle(arr) {
        for (var i = arr.length-1; i > 1; i--){
            var pick = Math.floor(Math.random()*i);
            var temp = arr[pick];
            arr[pick] = arr[i];
            arr[i] = temp;
        }
    }

    function norm(x, y){ return Math.sqrt(x*x + y*y); }

    function choose(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    function lin_range(a, b){ return Math.random()*(b-a) + a; }

    var sensor_comps = {"eye_l" : equalities,
                        "eye_c" : equalities,
                        "eye_r" : equalities,
                        "eye_l_dist" : inequalities,
                        "eye_c_dist" : inequalities,
                        "eye_r_dist" : inequalities,
                        "rand1" : inequalities,
                        "rand2" : inequalities,
                        "rand3" : inequalities,
                        "health" : inequalities,
                        "hunger" : inequalities,
                        "speed" : inequalities,
                        "heading" : inequalities,
                        "rot_vel" : inequalities };

    var sight_objs = ["WALL", "FOOD", "BOT", "EMPTY", "OBSCURED"];

    function array_choice_generator(arr){
        this.arr = arr;
        this.choose = function() { return choose(arr); };
    }

    function lin_range_generator(a, b){
        this.a = a;
        this.b = b;
        this.choose = function() { return lin_range(a, b); };
    }

    var MRV = Math.PI/10;
    var sensor_vals =  {"eye_l" : new array_choice_generator(sight_objs),
                        "eye_c" : new array_choice_generator(sight_objs),
                        "eye_r" : new array_choice_generator(sight_objs),
                        "eye_l_dist" : new lin_range_generator(0, VISION_DISTANCE),
                        "eye_c_dist" : new lin_range_generator(0, VISION_DISTANCE),
                        "eye_r_dist" : new lin_range_generator(0, VISION_DISTANCE),
                        "rand1" : new lin_range_generator(0, 1),
                        "rand2" : new lin_range_generator(0, 1),
                        "rand3" : new lin_range_generator(0, 1),
                        "health" : new lin_range_generator(0, MAX_HEALTH),
                        "hunger" : new lin_range_generator(0, MAX_HUNGER),
                        "speed" : new lin_range_generator(0, 20),
                        "heading" : new lin_range_generator(-Math.PI, Math.PI),
                        "rot_vel" : new lin_range_generator(-MRV, MRV) };

    function Vision_Object(x, y, type){
        this.x = x;
        this.y = y;
        this.type = type;
    }

    function Control(p1, p2){
        if (p1 == undefined) {
            this.flagella = [];
            this.flagella.push(makeFlagellum(toRad(135), toRad(60)));
            this.flagella.push(makeFlagellum(toRad(-135), toRad(-60)));
            this.flagella.push(makeFlagellum(toRad(-90), toRad(0)));
            this.flagella.push(makeFlagellum(toRad(90), toRad(0)));
            this.flagella.push(makeFlagellum(toRad(180), toRad(0)));
            
            this.brakes = new Brakes();
        }
        else {
            par_control = p1.control;
            this.flagella = [];
            for (var i = 0; i < par_control.flagella.length; i++) {
                this.flagella.push(new Flagellum(par_control.flagella[i]));
            }
            
            this.brakes = new Brakes(par_control.brakes);
        }
            
        this.parts = this.flagella.slice();
        this.parts.push(this.brakes);
    }

    function Constitution(){
        this.health = INITIAL_HEALTH;
        this.hunger = INITIAL_HUNGER;
    }

    Constitution.prototype.feed = function(){
        this.hunger += FOOD_VALUE;
        if (this.hunger > MAX_HUNGER){
            this.hunger = MAX_HUNGER;
        }
    };

    Constitution.prototype.drain = function(){
        if (this.hunger <= 0){
            this.health -= HEALTH_DRAIN;
            if (this.health < 0){
                this.health = 0;
            }
        }
        if (this.hunger > 0){
            if (this.hunger > HEAL_THRESHOLD){
                this.health += HEALTH_RECOVERY;
                if (this.health > MAX_HEALTH){
                    this.health = MAX_HEALTH;
                }
            }
            this.hunger -= HUNGER_DRAIN;
            if (this.hunger < 0){
                this.hunger = 0;
            }
        }
    };

    Constitution.prototype.isAlive = function(){ return this.health > 0; };

    function Physics(control){
        this.control = control;

        this.posx = lin_range(min_x, max_x);
        this.posy = lin_range(min_y, max_y);
        this.posr = lin_range(-Math.PI, Math.PI);        

        this.velx = 0;
        this.vely = 0;
        this.velr = 0;
    }

    Physics.prototype.simulate = function() {
        for (var i = 0; i < this.control.flagella.length; i++){
            this.control.flagella[i].simulate(this);
        }
        this.control.brakes.simulate(this);

        this.posr += this.velr;
        this.velr *= RADIAL_FRICTION;

        var step = 1;
        var collisions = 0;
        while (step > 0){

            if (this.posx < min_x){
                this.posx = min_x+1;
            }
            if (this.posx > max_x){
                this.posx = max_x-1;
            }
            if (this.posy < min_y){
                this.posy = min_y+1;
            }
            if (this.posy > max_y){
                this.posy = max_y-1;
            }
            var new_x = this.posx + step*this.velx;
            var new_y = this.posy + step*this.vely;
            if (new_x<min_x || new_x>max_x || new_y<min_y || new_y>max_y) {
                var col = next_collide(this.posx, this.posy, this.velx, this.vely);
                if (col == null || collisions > 3){
                    break;
                }
                collisions++;
                if (this.velx != 0){
                    step -= step*(col.x-this.posx)/(new_x-this.posx); 
                }
                else {
                    step -= step*(col.y-this.posy)/(new_y-this.posy);
                }
                this.posx = col.x;
                this.posy = col.y;
                if (this.posx <= min_x || this.posx >= max_x){
                    this.velx *= -1;
                }
                if (this.posy <= min_y || this.posy >= max_y){
                    this.vely *= -1;
                }
            }
            else {
                this.posx = new_x;
                this.posy = new_y;
                step = 0;
            }
        }
        this.velx *= LINEAR_FRICTION;
        this.vely *= LINEAR_FRICTION;
    };

    function Sensors(physics, constitution){
        this.physics = physics;
        this.constitution = constitution;

        this.speed = 0;
        this.heading = 0;
        this.rot_vel = 0;

        this.eye_l = "EMPTY";
        this.eye_c = "EMPTY";
        this.eye_r = "EMPTY";

        this.eye_l_dist = Infinity;
        this.eye_c_dist = Infinity;
        this.eye_r_dist = Infinity;

        this.rand1 = 0;
        this.rand2 = 0;
        this.rand3 = 0;

        this.health = 0;
        this.hunger = 0;
    }

    Sensors.prototype.update = function(vision_objs){
        this.health = this.constitution.health;
        this.rand1 = Math.random();
        this.rand2 = Math.random();
        this.rand3 = Math.random();

        var x = this.physics.posx;
        var y = this.physics.posy;
 
        this.eye_l_dist = Infinity;
        this.eye_c_dist = Infinity;
        this.eye_r_dist = Infinity;

        this.eye_l = "EMPTY";
        this.eye_c = "EMPTY";
        this.eye_r = "EMPTY";
        
        this.rot_vel = this.physics.velr;

        var vx = this.physics.velx;
        var vy = this.physics.vely;
        
        var abs_head = this.physics.posr;
        this.heading = abs_head-Math.atan2(vy, vx);
        if (this.heading < -Math.PI){
            this.heading += 2*Math.PI;
        }
        if (this.heading > Math.PI){
            this.heading -= 2*Math.PI;
        }
        this.speed = Math.sqrt(vx*vx + vy*vy);
        
        for(var i = 0; i < vision_objs.length; i++){
            var vobj = vision_objs[i];
            var vhead = rel_heading(x, y, abs_head, vobj.x, vobj.y);
            
            var diffx = vobj.x - x;
            var diffy = vobj.y - y;
            var vdist = Math.sqrt(diffx*diffx + diffy*diffy);
            
            var vtype = vobj.type;            

            if (vdist > VISION_DISTANCE || vdist == 0){
                vdist = Infinity;
            }
            else if(vdist > FOG_DISTANCE){
                vtype = "OBSCURED";
            }        

            if (vhead >= eye_l_min && vhead <= eye_l_max){
                if (vdist < this.eye_l_dist){
                    this.eye_l_dist = vdist;
                    this.eye_l = vtype;
                }
            }
            if (vhead >= eye_c_min && vhead <= eye_c_max){
                if (vdist < this.eye_c_dist){
                    this.eye_c_dist = vdist;
                    this.eye_c = vtype;
                }
            }
            if (vhead >= eye_r_min && vhead <= eye_r_max){
                if (vdist < this.eye_r_dist){
                    this.eye_r_dist = vdist;
                    this.eye_r = vtype;
                }
            }
        }
        if (this.eye_l == "EMPTY") {
            var eye_x = Math.cos(eye_l_mid + abs_head);
            var eye_y = Math.sin(eye_l_mid + abs_head);
            
            var col = next_collide(x, y, eye_x, eye_y);
            if (col == null) {
                this.eye_l = "WALL";
                this.eye_l_dist = 0;
            }
            else {
                var col_dist = Math.sqrt((col.x-x)*(col.x-x)+(col.y-y)*(col.y-y))
                if (col_dist <= FOG_DISTANCE){
                    this.eye_l = "WALL";
                    this.eye_l_dist = col_dist;
                }
                else if(col_dist <= VISION_DISTANCE){
                    this.eye_l = "OBSCURED";
                    this.eye_l_dist = col_dist;
                }
            }
        }
        if (this.eye_c == "EMPTY") {
            var eye_x = Math.cos(eye_c_mid + abs_head);
            var eye_y = Math.sin(eye_c_mid + abs_head);
            
            var col = next_collide(x, y, eye_x, eye_y);
            if (col == null) {
                this.eye_c = "WALL";
                this.eye_c_dist = 0;
            }
            else {
                col_dist = Math.sqrt((col.x-x)*(col.x-x)+(col.y-y)*(col.y-y))
                if (col_dist <= FOG_DISTANCE){
                    this.eye_c = "WALL";
                    this.eye_c_dist = col_dist;
                }
                else if(col_dist <= VISION_DISTANCE){
                    this.eye_c = "OBSCURED";
                    this.eye_c_dist = col_dist;
                }
            }
        }
        if (this.eye_r == "EMPTY") {
            var eye_x = Math.cos(eye_r_mid + abs_head);
            var eye_y = Math.sin(eye_r_mid + abs_head);
            
            var col = next_collide(x, y, eye_x, eye_y);
            if (col == null) {
                this.eye_r = "WALL";
                this.eye_r_dist = 0;
            }
            else {
                col_dist = Math.sqrt((col.x-x)*(col.x-x)+(col.y-y)*(col.y-y))
                if (col_dist <= FOG_DISTANCE){
                    this.eye_r = "WALL";
                    this.eye_r_dist = col_dist;
                }
                else if(col_dist <= VISION_DISTANCE){
                    this.eye_r = "OBSCURED";
                    this.eye_r_dist = col_dist;
                }
            }
        }
    };

    function Actions(control, par_act) { 
        this.actions = [];
        this.mutation = 0;
        if (par_act == undefined) {
            for (var i = 0; i < control.parts.length; i++) {
                this.actions.push(new ActionPath(control.parts[i]));
            }
        }
        else {
            for (var i = 0; i < control.parts.length; i++) {
                this.actions.push(new ActionPath(control.parts[i], par_act[i]));
            }
        }
    }

    Actions.prototype.execute = function(control) {
        for (var i = 0; i < this.actions.length; i++) {
            this.actions[i].execute();
        }
    };

    Actions.prototype.toString = function(){
        msg = this.actions[0];
        for (var i = 1; i < this.actions.length; i++){
            msg += ", " + this.actions[i].toString();
        }
        return msg;
    }

    function makeFlagellum(placement, tilt) {
        var flag = new Flagellum();
        flag.placement = placement;
        flag.tilt = tilt;
        return flag;
    }

    function Flagellum(par_flag){
        this.mutation = 0;
        if (par_flag == undefined) {
            this.placement = lin_range(-Math.PI, Math.PI);
            this.tilt = lin_range(-Math.PI/2, Math.PI/2);
        }
        else {
            if (Math.random() < FLAG_MUTATION_RATE) {
                var placement_change = lin_range(-FLAG_PLACEMENT_MUTATION_MAX, FLAG_PLACEMENT_MUTATION_MAX);
                var new_placement = par_flag.placement + placement_change;
                if (new_placement < -Math.PI) {
                    new_placement = -Math.PI;
                }
                else if (new_placement > Math.PI) {
                    new_placement = Math.PI;
                }
                this.mutation += toDeg(Math.abs(new_placement - par_flag.placement))*FLAG_PLACEMENT_MUTATION_VALUE;

                var tilt_change = lin_range(-FLAG_TILT_MUTATION_MAX, FLAG_TILT_MUTATION_MAX);
                var new_tilt = par_flag.tilt + tilt_change;
                if (new_tilt < -Math.PI/2) {
                    new_tilt = -Math.PI/2;
                }
                else if (new_tilt > Math.PI/2) {
                    new_tilt = Math.PI/2;
                }
                this.mutation += toDeg(Math.abs(new_tilt - par_flag.tilt))*FLAG_TILT_MUTATION_VALUE;

                this.placement = new_placement;
                this.tilt = new_tilt;
            }
            else {
                this.placement = par_flag.placement;
                this.tilt = par_flag.tilt;
            }
        }
        this.active = false;
        this.pulsing = false;
        this.blocking = false;
    }

    Flagellum.prototype.activate = function() { 
        this.active = true;
        this.pulsing = false;
        this.blocking = false;
    };

    Flagellum.prototype.deactivate = function() {
        this.active = false;
        this.pulsing = false;
        this.blocking = false;
    };

    Flagellum.prototype.pulse = function() { 
        this.pulsing = true;
        this.blocking = false;
    };

    Flagellum.prototype.block = function() {
        this.pulsing = false;
        this.blocking = true;
    };

    Flagellum.prototype.stay = function() {
        this.pulsing = false;
        this.blocking = false;
    };

    Flagellum.prototype.isActive = function() {
        return this.active && !this.blocking || this.pulsing;
    };

    Flagellum.prototype.toString = function() {
        return "flagellum at " + toDeg(this.placement) + " tilted " + toDeg(this.tilt);
    };

    Flagellum.prototype.simulate = function(phys) {
        if (this.isActive()){
            phys.velr -= Math.sin(this.tilt)*RADIAL_IMPULSE;
            phys.velx -= Math.cos(phys.posr + this.placement + this.tilt)*LINEAR_IMPULSE;
            phys.vely -= Math.sin(phys.posr + this.placement + this.tilt)*LINEAR_IMPULSE;
        }
    };

    function Brakes(){
        this.active = false;
        this.pulsing = false;
        this.blocking = false;
    }

    Brakes.prototype.activate = function() {
        this.active = true;
        this.pulsing = false;
        this.blocking = false;
    };

    Brakes.prototype.deactivate = function() {
        this.active = false;
        this.pulsing = false;
        this.blocking = false;
    };

    Brakes.prototype.pulse = function() {
        this.pulsing = true;
        this.blocking = false;
    };

    Brakes.prototype.block = function() {
        this.pulsing = false;
        this.blocking = true;
    };

    Brakes.prototype.stay = function() {
        this.pulsing = false;
        this.blocking = false;
    };

    Brakes.prototype.isActive = function() {
        return this.active && !this.blocking || this.pulsing;
    };

    Brakes.prototype.toString = function() {
        return "brakes";
    };

    Brakes.prototype.simulate = function(phys) {
        if (this.isActive()) {
            phys.velx *= BRAKING_RATE;
            phys.vely *= BRAKING_RATE;
        }
    };

    function ActionPath(motion_part, par_path) {
        this.actor = motion_part;
        this.mutation = 0;
        if (par_path == undefined) {
            this.type = choose(action_types);
        }
        else {
            this.type = par_path.type;
            
            if (Math.random() < ACTION_MUTATION_RATE) {
                this.type = choose(action_mutations[this.type]);
                this.mutation += ACTION_MUTATION_VALUE;
            }
        }
    }

    ActionPath.prototype.execute = function() { 
        switch (this.type) {
            case "ON":
                this.actor.activate();
                break;
            case "OFF":
                this.actor.deactivate();
                break;
            case "PULSE":        
                this.actor.pulse();
                break;
            case "BLOCK":        
                this.actor.block();
                break;
        }
    };

    ActionPath.prototype.toString = function() {
        switch (this.type) {
            case "ON":
                return "turn on " + this.actor.toString();
            case "OFF":
                return "turn off " + this.actor.toString();
            case "STAY":
                return "do nothing"; 
            case "PULSE":
                return "pulse " + this.actor.toString();
            case "BLOCK":
                return "block " + this.actor.toString();
        }
    };

    function Condition(par_cond){
        this.conditions = [];
        this.mutation = 0;
        if (par_cond == undefined){
            for (var i = 0; i < MAX_SUBCONDITIONS; i++){
                this.conditions.push(new Subcondition());
            }
        }
        else {
            for (var i = 0; i < MAX_SUBCONDITIONS; i++){
                if (par_cond[i] == undefined){
                    this.conditions.push(new Subcondition());
                }
                else if (Math.random() < SUBCONDITION_MUTATION_RATE){
                    this.conditions.push(new Subcondition());
                    this.mutation += SUBCONDITION_MUTATION_VALUE;
                } 
                else {
                    this.conditions.push(new Subcondition(par_cond[i]));
                    this.mutation += this.conditions[i].mutation;
                }
            }
        }
    }

    Condition.prototype.evaluate = function(sensors){
        for (var i = 0; i < this.conditions.length; i++){
            if (!this.conditions[i].evaluate(sensors))
                return false;
        }
        return true;
    };

    Condition.prototype.toString = function(){
        msg = this.conditions[0].toString();
        for (var i = 1; i < this.conditions.length; i++){
            msg += " & " + this.conditions[i].toString();
        }
        return msg;
    };

    function Subcondition(par_sub){
        this.mutation = 0;
        if (par_sub == undefined){
            this.disabled = false;
            if (Math.random() >= SUBCONDITION_ACTIVATION_RATE){
                this.disabled = true;  
            }
            else {
                this.sense = choose(senses);
                this.relop = choose(sensor_comps[this.sense]);
                this.value = sensor_vals[this.sense].choose();
            }
        }
        else {
            this.disabled = par_sub.disabled;
            if (!this.disabled){
                this.sense = par_sub.sense;
                this.relop = par_sub.relop;
                if (Math.random() < SUBCONDITION_TWEAK_RATE){
                    this.value = sensor_vals[this.sense].choose();
                    this.mutation += SUBCONDITION_TWEAK_VALUE;
                }
                else {
                    this.value = par_sub.value;
                }
            }
        }
    }

    Subcondition.prototype.evaluate = function(sensors){
        if (this.disabled){
            return true;
        }
        else {
            return this.relop(sensors[this.sense], this.value);  
        }
    };

    Subcondition.prototype.toString = function() {
        if (this.disabled) {
            return "true";
        }
        var msg = this.sense;
        if (this.relop === eq){
            msg += "==";
        }
        else if (this.relop === lt){
            msg += "<";
        }
        else{
            msg += ">";
        }
        return msg + this.value;
    };

    function Brain(sensors, control, p1, p2){
        this.sensors = sensors;
        this.control = control;
        this.conditions = [];        
        this.actions = [];
        this.mutation = 0;
        this.default_actions = undefined;

        if (p1 == undefined){
            for (var i = 0; i < CONDITIONS; i++){
                this.conditions.push(new Condition());
                this.actions.push(new Actions(control));
            }
            this.default_actions = new Actions(control);
        }
        
        else {
            if (p2 == undefined){ 
                for (var i = 0; i < CONDITIONS; i++){
                    if (p1.brain.conditions[i] == undefined){
                        this.conditions.push(new Condition());
                        this.actions.push(new Actions(control));
                    }
                    else if (Math.random() < CONDITION_MUTATION_RATE){
                        this.conditions.push(new Condition());
                        this.actions.push(new Actions(control));
                        this.mutation += CONDITION_MUTATION_VALUE;
                    }
                    else {
                        var cond = p1.brain.conditions[i];
                        var pact = p1.brain.actions[i].actions;
                        this.conditions.push(new Condition(cond));
                        this.actions.push(new Actions(control, pact));
                        this.mutation += this.conditions[i].mutation;
                        this.mutation += this.actions[i].mutation;
                    }
                }
                if (Math.random() < CONDITION_MUTATION_RATE){
                    this.default_actions = new Actions(control);
                    this.mutation += CONDITION_MUTATION_VALUE;
                }
                else {
                    var default_act = p1.brain.default_actions.actions;
                    this.default_actions = new Actions(control, default_act);
                    this.mutation += this.default_actions.mutation;
                }
            }
            else {
                var brains = [p1.brain, p2.brain];
                var cur= Math.floor(lin_range(0, 2));
                for (var i = 0; i < CONDITIONS; i++){
                    if (brains[cur].conditions[i] == undefined){
                        this.conditions.push(new Condition());
                        this.actions.push(new Actions(control));
                    }
                    else if (Math.random() < CONDITION_MUTATION_RATE){
                        this.conditions.push(new Condition());
                        this.actions.push(new Actions(control));
                        this.mutation += CONDITION_MUTATION_VALUE;
                    }
                    else {
                        var cond = brains[cur].conditions[i];
                        var pact = brains[cur].actions[i].actions;
                        this.conditions.push(new Condition(cond));
                        this.actions.push(new Actions(control, pact));
                        this.mutation += this.conditions[i].mutation;
                        this.mutation += this.actions[i].mutation;
                    }
                    if (Math.random() < CROSSOVER_RATE){
                        cur = (cur + 1)%2
                    }
                }
                if (Math.random() < CONDITION_MUTATION_RATE){
                    this.default_actions = new Actions(control);
                    this.mutation += CONDITION_MUTATION_VALUE;
                }
                else {
                    var default_act = brains[cur].default_actions.actions;
                    this.default_actions = new Actions(control, default_act);
                    this.mutation += this.default_actions.mutation;
                }
            }
            if (Math.random() < SWAP_MUTATION_RATE){
                var c1 = Math.floor(lin_range(0, this.conditions.length));
                var c2 = Math.floor(lin_range(0, this.conditions.length));
                if (c1 != c2){
                    var swap_con = this.conditions[c1];
                    var swap_act = this.actions[c1];
                    this.conditions[c1] = this.conditions[c2];
                    this.actions[c1] = this.actions[c2];
                    this.conditions[c2] = swap_con;
                    this.actions[c2] = swap_act;
                    this.mutation += SWAP_MUTATION_VALUE;
                }
            }
        }
    }

    Brain.prototype.act = function(){
        for (var i = 0; i < this.conditions.length; i++){
            if (this.conditions[i].evaluate(this.sensors)){
                this.actions[i].execute(this.control);
                return;
            }
        }
        this.default_actions.execute(this.control);
    };

    Brain.prototype.toString = function(){
        var msg = "";
        for (var i = 0; i < this.conditions.length; i++){
            msg += this.conditions[i].toString();
            msg += "\n====> ";
            msg += (this.actions[i]).toString() + "\n";
        }
        msg += "default actions: " + this.default_actions.toString();
        return msg;
    };    
    
    function Fishbot(p1, p2){
        this.constitution = new Constitution();
        this.control = new Control(p1, p2);
        this.physics = new Physics(this.control);
        this.sensors = new Sensors(this.physics, this.constitution);
        this.brain = new Brain(this.sensors, this.control, p1, p2);
        this.score = 0;
        this.food_eaten = 0;

        if (p1 == undefined){
            this.hue = Math.floor(lin_range(0,360))
        }
        else {
            if (p2 == undefined){
                this.hue = p1.hue;
            }
            else {
                if (p1.hue <= p2.hue){
                    var hues = [p1.hue, p2.hue];
                }
                else {
                    var hues = [p2.hue, p1.hue];
                }
                var outer = hues[0] + (360-hues[1]);
                var inner = hues[1] - hues[0];
                if (outer < inner || outer == inner && Math.random <= 0.5){
                    hues[0] += 360;
                }
                this.hue = (hues[0] + hues[1])/2;
            }
            this.hue += lin_range(-this.brain.mutation,this.brain.mutation);
            this.hue = Math.round(this.hue % 360);
            if (this.hue < 0){
                this.hue += 360;
            }
        }
    }

    Fishbot.prototype.react = function(vision_objs) {
        this.sensors.update(vision_objs);
        this.brain.act();
    };

    Fishbot.prototype.run_physics = function() {
        this.physics.simulate();
    };

    Fishbot.prototype.feed = function() {
        this.food_eaten++;
        this.constitution.feed();
    };

    Fishbot.prototype.run_hunger = function() {
        this.score += this.constitution.health;
        this.constitution.drain();
    };
    
    Fishbot.prototype.toString = function() {
        msg = "Score: " + this.score;
        msg += "\nHue: " + this.hue;
        msg += "\nBrain:\n" + this.brain.toString();
        return msg;
    };

    function get_generation(last_gen){
        generation = [];
        if (last_gen == undefined) {
            for (var i = 0; i < POPULATION_SIZE; i++){
                generation.push(new Fishbot());
            }
        }
        else {
            last_gen.sort(function (x, y)
            {
                return y.score - x.score;
            });
            console.log("Best in generation:\n" + last_gen[0].toString());
            var parents = last_gen.slice(0, REPRODUCERS_SIZE);
            for (var i = 0; i < POPULATION_SIZE; i++){
                if (USE_CROSSOVER) {
                    generation.push(new Fishbot(choose(parents), choose(parents)));
                }
                else {
                    generation.push(new Fishbot(choose(parents)));
                }
            }
        }
        return generation;
    }

    function start(){
        canvas = document.createElement("canvas"); 
        container.appendChild(canvas);
        context = canvas.getContext("2d");
        enforce_bounds();
        w_next_generation();
    }

    w_add_food = function() {
        var bad_loc = true;
        var attempts = 0;
        while (bad_loc) {
            attempts++;
            if (attempts > 5){
                return;
            }
            bad_loc = false;
            var loc = [lin_range(min_x, max_x), lin_range(min_y, max_y)];
            for (var i = 0; i < w_generation.length; i++){
                if (w_generation[i].constitution.isAlive()){
                    var x_dist = w_generation[i].physics.posx - loc[0];
                    var y_dist = w_generation[i].physics.posy - loc[1];
                    var dist = Math.sqrt(x_dist*x_dist + y_dist*y_dist);
                    if (dist <= eat_dist){
                        bad_loc = true;
                    }
                }
            }
        }
        w_food.push(loc);
    };

    w_step = function() {
        w_timer++;
        if (w_timer % FOOD_DELAY  == 0 && !FOOD_SPAWN_RELATIVE){
            for (var i = 0; i < FOOD_BATCH_SIZE; i++){
                w_add_food();
            }
        }
        var extinct = true;
        var vobjs = [];
        for (var i = 0; i < w_generation.length; i++){
            if (w_generation[i].constitution.isAlive()){
                extinct = false;
                var bot_phys = w_generation[i].physics;
                vobjs.push(new Vision_Object(bot_phys.posx, bot_phys.posy, "BOT"));
            }
        }
        for (var i = 0; i < w_food.length; i++){
            vobjs.push(new Vision_Object(w_food[i][0], w_food[i][1], "FOOD"));
        }
        
        for (var i = 0; i < w_generation.length; i++){
            if (w_generation[i].constitution.isAlive()){
                w_generation[i].react(vobjs);
            }
        }
        for (var i = 0; i < w_generation.length; i++){
            if (w_generation[i].constitution.isAlive()){
                w_generation[i].run_physics();
                for (var j = 0; j < w_food.length; j++){
                    var x_dist = w_generation[i].physics.posx - w_food[j][0];
                    var y_dist = w_generation[i].physics.posy - w_food[j][1];
                    var dist = Math.sqrt(x_dist*x_dist + y_dist*y_dist);
                    if (dist <= eat_dist){
                        w_generation[i].feed();
                        w_food.splice(j, 1);
                        j--;
                        if (FOOD_SPAWN_RELATIVE){
                            w_add_food();
                        }
                    }
                }
                w_generation[i].run_hunger();
            }
        }
        var current_living = w_living_count();
        var current_healths = w_healths();
        var current_hungers = w_hungers();
        if (current_living < w_min_living){
            w_min_living = current_living;
            w_min_healths = current_healths;
            w_min_hungers = current_hungers;
            w_last_min = w_timer;
        }
        else {
            var new_hunger = false;
            for (var i = 0; i < current_hungers.length; i++){
                if (current_hungers[i] < w_min_hungers[i]){
                    new_hunger = true;
                    w_min_hungers[i] = current_hungers[i];
                }
            }
            if (new_hunger){
                w_last_min = w_timer;
                w_min_healths = current_healths;
            }
            else {
                for (var i = 0; i < current_healths.length; i++){
                    if (current_healths[i] < w_min_healths[i]){
                        w_last_min = w_timer;
                        w_min_healths[i] = current_healths[i];
                    }
                }
            }
        }

        var time_since_min = w_timer - w_last_min;
        if (extinct || (time_since_min >= CHANGE_TIMEOUT && w_timer >= MIN_TIMEOUT) || (FAST_SELECTION && w_min_living <= REPRODUCERS_SIZE)) {
            clearInterval(w_stepID);
            clearInterval(w_renderID);
            w_next_generation();
        }
    };

    w_render = function() {
        var m_width = BOT_RADIUS/3;
        var m_length = BOT_RADIUS;

        var eye_colors = {"EMPTY" : "#FFFFFF", "OBSCURED" : "#505050",
                          "FOOD" : "#00FF00", "WALL" : "#FF0000",
                          "BOT" : "#C000C0" };
                                  

        enforce_bounds();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#000028";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = "#00FF00";
        for (var i = 0; i < w_food.length; i++){
            context.beginPath();
            var cx = w_food[i][0];
            var cy = w_food[i][1];
            context.arc(cx, cy, FOOD_RADIUS, 0, Math.PI*2, false);
            context.fill();
        }
        
        for (var i = 0; i < w_generation.length; i++){
            var bot = w_generation[i];
            if(!bot.constitution.isAlive()){
                continue;
            }

            var cx = bot.physics.posx;
            var cy = bot.physics.posy;
            
            for (var j = 0; j < bot.control.flagella.length; j++){
                var f = bot.control.flagella[j];
                if (f.isActive()){
                    context.fillStyle = "#A0FFFF";
                }
                else {
                    context.fillStyle = "#606060";
                }

                var mx = cx + Math.cos(bot.physics.posr+f.placement)*BOT_RADIUS*0.9;
                var my = cy + Math.sin(bot.physics.posr+f.placement)*BOT_RADIUS*0.9;
                var hx = -Math.cos(bot.physics.posr+f.placement+f.tilt);
                var hy = -Math.sin(bot.physics.posr+f.placement+f.tilt);
                var hx_p = Math.sin(bot.physics.posr+f.placement+f.tilt);
                var hy_p = -Math.cos(bot.physics.posr+f.placement+f.tilt);

                var p1x = mx - hx_p*m_width/2;
                var p1y = my - hy_p*m_width/2;
                var p2x = p1x + hx_p*m_width;
                var p2y = p1y + hy_p*m_width;
                var p3x = p2x - hx*m_length;
                var p3y = p2y - hy*m_length;
                var p4x = p3x - hx_p*m_width;
                var p4y = p3y - hy_p*m_width;
                context.beginPath();
                context.moveTo(p1x, p1y);
                context.lineTo(p2x, p2y);
                context.lineTo(p3x, p3y);
                context.lineTo(p4x, p4y);
                context.closePath();
                context.fill();

                context.fillStyle = "#909090";
                context.beginPath();
                context.arc(mx, my, BOT_RADIUS/4, 0, Math.PI*2, false); 
                context.fill();
            }

            context.beginPath();
            context.fillStyle =  "hsl(" + bot.hue + ",100%,50%)";
            context.arc(cx, cy, BOT_RADIUS, 0, Math.PI*2, false);
            context.fill();
            
            var green = Math.floor(bot.constitution.hunger*255/MAX_HUNGER);
            var red = Math.floor(255 - bot.constitution.health*255/MAX_HEALTH);
            var con_color = "rgb(" + red + "," + green + ",0)";
            context.beginPath();
            context.fillStyle = con_color; 
            context.arc(cx, cy, BOT_RADIUS*0.85, 0, Math.PI*2, false);
            context.fill();

            if (bot.control.brakes.isActive()){
                context.fillStyle = "#FFFFFF";
            }
            else {
                context.fillStyle = "#0000FF";
            }
            context.beginPath();
            context.arc(cx, cy, BOT_RADIUS/3, 0, Math.PI*2, false);
            context.fill();

            var eyex_c = cx + Math.cos(bot.physics.posr)*BOT_RADIUS*(3/5);
            var eyey_c = cy + Math.sin(bot.physics.posr)*BOT_RADIUS*(3/5);
            var eyex_l = cx + Math.cos(bot.physics.posr-SIDE_VISION_PLACEMENT)*BOT_RADIUS*(3/5);
            var eyey_l = cy + Math.sin(bot.physics.posr-SIDE_VISION_PLACEMENT)*BOT_RADIUS*(3/5);
            var eyex_r = cx + Math.cos(bot.physics.posr+SIDE_VISION_PLACEMENT)*BOT_RADIUS*(3/5);
            var eyey_r = cy + Math.sin(bot.physics.posr+SIDE_VISION_PLACEMENT)*BOT_RADIUS*(3/5);


            var eyer1_c = bot.physics.posr - CENTER_VISION_WIDTH/2;
            var eyer2_c = bot.physics.posr + CENTER_VISION_WIDTH/2;
            context.lineWidth = BOT_RADIUS/8;
            context.strokeStyle = "hsl(" + bot.hue + ",100%,90%)";
            context.beginPath();
            context.arc(eyex_c, eyey_c, BOT_RADIUS/6, eyer1_c, eyer2_c, true);
            context.stroke();
            context.fillStyle = eye_colors[bot.sensors.eye_c];
            context.beginPath();
            context.arc(eyex_c, eyey_c, BOT_RADIUS/8, 0, Math.PI*2, false);
            context.fill();

            var eyer1_l = bot.physics.posr - SIDE_VISION_PLACEMENT - SIDE_VISION_WIDTH/2;
            var eyer2_l = bot.physics.posr - SIDE_VISION_PLACEMENT + SIDE_VISION_WIDTH/2;
            context.lineWidth = BOT_RADIUS/8;
            context.strokeStyle = "hsl(" + bot.hue + ",100%,90%)";
            context.beginPath();
            context.arc(eyex_l, eyey_l, BOT_RADIUS/6, eyer1_l, eyer2_l, true);
            context.stroke();
            context.fillStyle = eye_colors[bot.sensors.eye_l];
            context.beginPath();
            context.arc(eyex_l, eyey_l, BOT_RADIUS/8, 0, Math.PI*2, false);
            context.fill();
            
            
            var eyer1_r = bot.physics.posr + SIDE_VISION_PLACEMENT - SIDE_VISION_WIDTH/2;
            var eyer2_r = bot.physics.posr + SIDE_VISION_PLACEMENT + SIDE_VISION_WIDTH/2;
            context.lineWidth = BOT_RADIUS/8;
            context.strokeStyle = "hsl(" + bot.hue + ",100%,90%)";
            context.beginPath();
            context.arc(eyex_r, eyey_r, BOT_RADIUS/6, eyer1_r, eyer2_r, true);
            context.stroke();
            context.fillStyle = eye_colors[bot.sensors.eye_r];
            context.beginPath();
            context.arc(eyex_r, eyey_r, BOT_RADIUS/8, 0, Math.PI*2, false);
            context.fill();
        }
    };

    function enforce_bounds() {
        if (container.offsetWidth != width || container.offsetHeight != height){
            update_bounds();
            moved_food = 0;
            for (var i = 0; i < w_food.length; i++){
                if (w_food[i][0] < min_x || w_food[i][0] > max_x || w_food[i][1] < min_y || w_food[i][1] > max_y){
                    w_food.splice(i, 1);
                    i--;
                    moved_food++;
                }
            }
            for (var i = 0; i < moved_food; i++){
                w_add_food();
            }
        }
    }

    function update_bounds() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        width = canvas.width;
        height = canvas.height;
        min_x = BOT_RADIUS;
        max_x = width - BOT_RADIUS;
        min_y = BOT_RADIUS;
        max_y = height - BOT_RADIUS;
    }

    w_hungers = function() {
        var hungers = [];
        for (var i = 0; i < w_generation.length; i++){
            hungers.push(w_generation[i].constitution.hunger);
        }
        return hungers;
    }

    w_healths = function() {
        var healths = [];
        for (var i = 0; i < w_generation.length; i++){
            healths.push(w_generation[i].constitution.health);
        }
        return healths;
    };

    w_living_count = function() {
        var living = 0;
        for (var i = 0; i < w_generation.length; i++) {
            if (w_generation[i].constitution.isAlive()) {
                living++;
            }
        }
        return living;
    };

    w_next_generation = function() {
        w_generation = get_generation(w_generation);
        w_timer = 0;
        w_last_min = w_timer;
        w_food = []
        for (var i = 0; i < INITIAL_FOOD; i++){
            w_add_food();
        }
        w_min_living = w_living_count();
        w_min_healths = w_healths();
        w_min_hungers = w_hungers();
        w_stepID = setInterval(w_step, STEP_RATE);
        w_renderID = setInterval(w_render, RENDER_RATE);
    };

    this.pause = function(){
        paused = true;
        clearInterval(w_stepID);
        clearInterval(w_renderID);
    };

    this.resume = function(){
        if (w_stepID != undefined && w_renderID != undefined){
            clearInterval(w_stepID);
            clearInterval(w_renderID);
        }
        w_stepID = setInterval(w_step, STEP_RATE);
        w_renderID = setInterval(w_render, RENDER_RATE);
        paused = false;
    };

    function get_eat_dist(){
        return BOT_RADIUS - FOOD_RADIUS;
    }

    var update_eat_dist = function(){
        eat_dist = get_eat_dist();
    };

    var update_eye_vars = function(){
        eye_l_mid = -SIDE_VISION_PLACEMENT;
        eye_l_min = eye_l_mid - SIDE_VISION_WIDTH/2;
        eye_l_max = eye_l_mid + SIDE_VISION_WIDTH/2;
        
        eye_c_mid = 0;
        eye_c_min = eye_c_mid - CENTER_VISION_WIDTH/2;
        eye_c_max = eye_c_mid + CENTER_VISION_WIDTH/2;

        eye_r_mid = SIDE_VISION_PLACEMENT;
        eye_r_min = eye_r_mid - SIDE_VISION_WIDTH/2;
        eye_r_max = eye_r_mid + SIDE_VISION_WIDTH/2;
    };

    this.set_bot_radius = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 1){
                r = 1;
            }
            BOT_RADIUS = Math.floor(r);
            update_eat_dist();
            min_x = BOT_RADIUS;
            min_y = BOT_RADIUS;
            max_x = width - BOT_RADIUS;
            max_y = height - BOT_RADIUS;
        }
    }
    
    this.set_food_radius = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 1){
                r = 1;
            }
            FOOD_RADIUS = Math.floor(r);
            update_eat_dist();
        }
    }

    this.set_population_size = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 1){
                r = 1;
            }
            POPULATION_SIZE = Math.floor(r);
        }
    };

    this.set_reproducers = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 1){
                r = 1;
            }
            REPRODUCERS_SIZE = Math.floor(r);
        }
    };

    this.set_initial_food = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            INITIAL_FOOD = Math.floor(r);
        }
    };

    this.set_food_delay = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 1){
                r = 1;
            }
            FOOD_DELAY = Math.floor(r);
        }
    };

    this.set_food_batch_size = function(r){
        if (!isNaN(r) && r != Infinity){   
            if (r < 0){
                r = 0;
            }
            FOOD_BATCH_SIZE = Math.floor(r);
        }
    };

    this.set_linear_friction = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            LINEAR_FRICTION = r;
        }
    };

    this.set_radial_friction = function(r){
        if (!isNaN(r) && r != Infinity){
            RADIAL_FRICTION = r;
        }
    };

    this.set_min_timeout = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            MIN_TIMEOUT = Math.floor(r);
        }
    };
    
    this.set_change_timeout = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            CHANGE_TIMEOUT = Math.floor(r);
        }
    };

    this.set_food_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            FOOD_VALUE = r;
        }
    };

    this.set_hunger_drain = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            HUNGER_DRAIN = r;
        }
    };

    this.set_health_drain = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            HEALTH_DRAIN = r;
        }
    };

    this.set_initial_hunger = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            INITIAL_HUNGER = r;
        }
    };

    this.set_initial_health = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            INITIAL_HEALTH = r;
        }
    };

    this.set_max_health = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            MAX_HEALTH = r;
        }
    };

    this.set_max_hunger = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            MAX_HUNGER = r;
        }
    };

    this.set_heal_threshold = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            HEAL_THRESHOLD = r;
        }
    };

    this.set_fog_distance = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            FOG_DISTANCE = r;
        }
    };

    this.set_vision_distance = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            VISION_DISTANCE = r;
        }
    };
    
    this.set_center_vision_width = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 2*Math.PI){
                r = 2*Math.PI;
            }
            CENTER_VISION_WIDTH = r;
            update_eye_vars();
        }
    };


    this.set_side_vision_width = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 2*Math.PI){
                r = 2*Math.PI;
            }
            SIDE_VISION_WIDTH = r;
            update_eye_vars();
        }
    };

    this.set_side_vision_placement = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > Math.PI){
                r = Math.PI;
            }
            SIDE_VISION_PLACEMENT = r;
            update_eye_vars();
        }
    };

    this.set_linear_impulse = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            LINEAR_IMPULSE = r;
        }
    };

    this.set_radial_impulse = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            RADIAL_IMPULSE = r;
        }
    };

    this.set_braking_rate = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            BRAKING_RATE = r;
        }
    };

    this.set_food_spawn_relative = function(r){
        FOOD_SPAWN_RELATIVE = r;
    };

    this.set_fast_selection = function(r){
        FAST_SELECTION = r;
    };

    this.set_use_crossover = function(r){
        USE_CROSSOVER = r;
    };

    this.set_crossover_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            CROSSOVER_RATE = r;
        }
    };

    this.set_condition_mutation_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            CONDITION_MUTATION_RATE = r;
        }
    };

    this.set_subcondition_mutation_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            SUBCONDITION_MUTATION_RATE = r;
        }
    };

    this.set_subcondition_tweak_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            SUBCONDITION_TWEAK_RATE = r;
        }
    };

    this.set_action_mutation_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            ACTION_MUTATION_RATE = r;
        }
    };

    this.set_swap_mutation_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            SWAP_MUTATION_RATE = r;
        }
    };

    this.set_flag_mutation_rate = function(r){
        if (!isNaN(r)){
            if (r < 0){
                r = 0;
            }
            if (r > 1){
                r = 1;
            }
            FRAG_MUTATION_RATE = r;
        }
    };

    this.set_flag_placement_mutation_max = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            FLAG_PLACEMENT_MUTATION_MAX = r;
        }
    };

    this.set_flag_tilt_mutation_max = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            FLAG_TILT_MUTATION_MAX = r;
        }
    };
    this.set_conditions = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 0){
                r = 0;
            }
            CONDITIONS = Math.floor(r);
        }
    };

    this.set_max_subconditions = function(r){
        if (!isNaN(r) && r != Infinity){
            if (r < 1){
                r = 1;
            }
            MAX_SUBCONDITIONS = Math.floor(r);
        }
    };

    this.set_subcondition_activation_rate = function(r){
        if (!isNaN(r)){
            if (r > 1){
                r = 1;
            }
            if (r < 0){
                r = 0;
            }
            SUBCONDITION_ACTIVATION_RATE = r;
        }
    };

    this.set_render_rate = function(r){        
        if (!isNaN(r) && r != Infinity){
            var was_paused = paused;
            this.pause();
            if (r < 1){
                r = 1;
            }
            RENDER_RATE = Math.floor(r);
            if (!was_paused){
                this.resume();
            }
        }
    };

    this.set_step_rate = function(r){
        if (!isNaN(r) && r != Infinity){
            var was_paused = paused;
            this.pause();
            if (r < 1){
                r = 1;
            }
            STEP_RATE = Math.floor(r);
            if (!was_paused){
                this.resume();
            }
        }
    };

    this.set_condition_mutation_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            CONDITION_MUTATION_VALUE = r;
        }
    };

    this.set_subcondition_mutation_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            SUBCONDITION_MUTATION_VALUE = r;
        }
    };

    this.set_subcondition_tweak_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            SUBCONDITION_TWEAK_VALUE = r;
        }
    };

    this.set_action_mutation_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            ACTION_MUTATION_VALUE = r;
        }
    };

    this.set_swap_mutation_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            SWAP_MUTATION_VALUE = r;
        }
    };

    this.set_flag_placement_mutation_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            FLAG_PLACEMENT_MUTATION_VALUE = r;
        }
    };

    this.set_flag_tilt_mutation_value = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            FLAG_TILT_MUTATION_VALUE = r;
        }
    };

    this.set_health_recovery = function(r){
        if (!isNaN(r) && r != Infinity && r != -Infinity){
            HEALTH_RECOVERY = r;
        }
    };

    function Parameters(){
        this.STEP_RATE = STEP_RATE;
        this.RENDER_RATE = RENDER_RATE;

        this.BOT_RADIUS = BOT_RADIUS;
        this.FOOD_RADIUS = FOOD_RADIUS;

        this.CONDITIONS = CONDITIONS;
        this.MAX_SUBCONDITIONS = MAX_SUBCONDITIONS;
        this.SUBCONDITION_ACTIVATION_RATE = SUBCONDITION_ACTIVATION_RATE;

        this.POPULATION_SIZE = POPULATION_SIZE;
        this.REPRODUCERS_SIZE = REPRODUCERS_SIZE;

        this.MIN_TIMEOUT = MIN_TIMEOUT;
        this.CHANGE_TIMEOUT = CHANGE_TIMEOUT;
        this.FAST_SELECTION = FAST_SELECTION;

        this.INITIAL_FOOD = INITIAL_FOOD;
        this.FOOD_DELAY = FOOD_DELAY;
        this.FOOD_BATCH_SIZE = FOOD_BATCH_SIZE;
        this.FOOD_SPAWN_RELATIVE = FOOD_SPAWN_RELATIVE;

        this.FOOD_VALUE = FOOD_VALUE;
        this.HUNGER_DRAIN = HUNGER_DRAIN;
        this.HEALTH_DRAIN = HEALTH_DRAIN;
        this.MAX_HEALTH = MAX_HEALTH;
        this.MAX_HUNGER = MAX_HUNGER;
        this.HEAL_THRESHOLD = HEAL_THRESHOLD;
        this.HEALTH_RECOVERY = HEALTH_RECOVERY;
        this.INITIAL_HEALTH = INITIAL_HEALTH;
        this.INITIAL_HUNGER = INITIAL_HUNGER;

        this.FOG_DISTANCE = FOG_DISTANCE;
        this.VISION_DISTANCE = VISION_DISTANCE;

        this.CENTER_VISION_WIDTH = toDeg(CENTER_VISION_WIDTH);
        this.SIDE_VISION_WIDTH = toDeg(SIDE_VISION_WIDTH);
        this.SIDE_VISION_PLACEMENT = toDeg(SIDE_VISION_PLACEMENT);

        this.LINEAR_FRICTION = LINEAR_FRICTION;
        this.RADIAL_FRICTION = RADIAL_FRICTION;

        this.LINEAR_IMPULSE = LINEAR_IMPULSE;
        this.RADIAL_IMPULSE = toDeg(RADIAL_IMPULSE);
        this.BRAKING_RATE = BRAKING_RATE;

        this.USE_CROSSOVER = USE_CROSSOVER;

        this.CROSSOVER_RATE = CROSSOVER_RATE;
        this.CONDITION_MUTATION_RATE = CONDITION_MUTATION_RATE;
        this.SUBCONDITION_MUTATION_RATE = SUBCONDITION_MUTATION_RATE;
        this.SUBCONDITION_TWEAK_RATE = SUBCONDITION_TWEAK_RATE;
        this.ACTION_MUTATION_RATE = ACTION_MUTATION_RATE; 
        this.SWAP_MUTATION_RATE = SWAP_MUTATION_RATE;
        this.FLAG_MUTATION_RATE = FLAG_MUTATION_RATE;
        this.FLAG_PLACEMENT_MUTATION_MAX = toDeg(FLAG_PLACEMENT_MUTATION_MAX);
        this.FLAG_TILT_MUTATION_MAX = toDeg(FLAG_TILT_MUTATION_MAX);

        this.CONDITION_MUTATION_VALUE = CONDITION_MUTATION_VALUE;
        this.SUBCONDITION_MUTATION_VALUE = SUBCONDITION_MUTATION_VALUE;
        this.SUBCONDITION_TWEAK_VALUE = SUBCONDITION_TWEAK_VALUE;
        this.ACTION_MUTATION_VALUE = ACTION_MUTATION_VALUE;
        this.SWAP_MUTATION_VALUE = SWAP_MUTATION_VALUE; 
        this.FLAG_PLACEMENT_MUTATION_VALUE = FLAG_PLACEMENT_MUTATION_VALUE;
        this.FLAG_TILT_MUTATION_VALUE = FLAG_TILT_MUTATION_VALUE;
    };

    this.get_attributes = function(){
        return new Parameters();
    };

    this.set_attributes = function(args){
        this.set_bot_radius(args.BOT_RADIUS);
        this.set_food_radius(args.FOOD_RADIUS); 
        this.set_population_size(args.POPULATION_SIZE);
        this.set_reproducers(args.REPRODUCERS_SIZE);
        this.set_initial_food(args.INITIAL_FOOD);
        this.set_food_delay(args.FOOD_DELAY);
        this.set_food_batch_size(args.FOOD_BATCH_SIZE);
        this.set_linear_friction(args.LINEAR_FRICTION);
        this.set_min_timeout(args.MIN_TIMEOUT);
        this.set_change_timeout(args.CHANGE_TIMEOUT); 
        this.set_food_value(args.FOOD_VALUE);
        this.set_hunger_drain(args.HUNGER_DRAIN);
        this.set_health_drain(args.HEALTH_DRAIN);
        this.set_initial_hunger(args.INITIAL_HUNGER);
        this.set_initial_health(args.INITIAL_HEALTH);
        this.set_max_health(args.MAX_HEALTH);
        this.set_max_hunger(args.MAX_HUNGER);
        this.set_heal_threshold(args.HEAL_THRESHOLD);
        this.set_fog_distance(args.FOG_DISTANCE);
        this.set_vision_distance(args.VISION_DISTANCE);
        this.set_center_vision_width(toRad(args.CENTER_VISION_WIDTH)); 
        this.set_side_vision_width(toRad(args.SIDE_VISION_WIDTH));
        this.set_side_vision_placement(toRad(args.SIDE_VISION_PLACEMENT));
        this.set_linear_impulse(args.LINEAR_IMPULSE);
        this.set_radial_impulse(toRad(args.RADIAL_IMPULSE));    
        this.set_braking_rate(args.BRAKING_RATE);
        this.set_food_spawn_relative(args.FOOD_SPAWN_RELATIVE);
        this.set_fast_selection(args.FAST_SELECTION);
        this.set_use_crossover(args.USE_CROSSOVER);
        this.set_crossover_rate(args.CROSSOVER_RATE);
        this.set_condition_mutation_rate(args.CONDITION_MUTATION_RATE);
        this.set_subcondition_mutation_rate(args.SUBCONDITION_MUTATION_RATE);
        this.set_subcondition_tweak_rate(args.SUBCONDITION_TWEAK_RATE);
        this.set_action_mutation_rate(args.ACTION_MUTATION_RATE);
        this.set_swap_mutation_rate(args.SWAP_MUTATION_RATE);
        this.set_flag_mutation_rate(args.FLAG_MUTATION_RATE);
        this.set_flag_placement_mutation_max(toRad(args.FLAG_PLACEMENT_MUTATION_MAX));
        this.set_flag_tilt_mutation_max(toRad(args.FLAG_TILT_MUTATION_MAX));
        this.set_conditions(args.CONDITIONS);
        this.set_max_subconditions(args.SUBCONDITIONS);
        this.set_subcondition_activation_rate(args.SUBCONDITION_ACTIVATION_RATE);
        this.set_render_rate(args.RENDER_RATE);
        this.set_step_rate(args.STEP_RATE);     
        this.set_condition_mutation_value(args.CONDITION_MUTATION_VALUE);
        this.set_subcondition_mutation_value(args.SUBCONDITION_MUTATION_VALUE);
        this.set_subcondition_tweak_value(args.SUBCONDITION_TWEAK_VALUE);
        this.set_action_mutation_value(args.ACTION_MUTATION_VALUE);
        this.set_swap_mutation_value(args.SWAP_MUTATION_VALUE);
        this.set_flag_placement_mutation_value(args.FLAG_PLACEMENT_MUTATION_VALUE);
        this.set_flag_tilt_mutation_value(args.FLAG_TILT_MUTATION_VALUE);
        this.set_health_recovery(args.HEALTH_RECOVERY);
    };

    start();
}
