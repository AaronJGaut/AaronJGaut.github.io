var pageloadInterval = window.setInterval( function() {
        if (document.readyState === "complete") {
                window.clearInterval(pageloadInterval);
                start();
        }
}, 10);

function start() {
        var damping = {
                "UNDAMPED" : 0,
                "UNDERDAMPED" : 1,
                "CRITICALLY_DAMPED" : 2,
                "OVERDAMPED" : 3
        };

        var springCv = document.getElementById("springcv");
        var springCtx = springCv.getContext("2d");

        var physics = {
                "x" : 200,
                "v" : 0,
                "y" : springCv.height/2,
                "t" : 0,
                "m" : 5,
                "k" : 0.01,
                "c" : 0.06
        };

        this.physics=physics;

        var springColor = "#ff0000";
        var massColor = "#8080ff";
        var tickColor = "#80ff80";
        var springWidth = springCv.height/2;
        var massWidth = springCv.height;

        var dampingTypeSpan = document.getElementById("dampingtype");

        var model = updateModel(physics);

        document.getElementById("springk").value = physics.k;
        document.getElementById("springm").value = physics.m;
        document.getElementById("springc").value = physics.c;
        document.getElementById("springx").value = physics.x;
        document.getElementById("springv").value = physics.v;


        var stepRef = window.requestAnimationFrame(step);

        window.updateConstants1 = updateConstants;
        window.physics = physics;

        function updateConstants() {
                window.cancelAnimationFrame(stepRef);
                var alertmsg = "";
                physics.k = parseFloat(document.getElementById("springk").value);
                if (physics.k <= 0) {
                        physics.k = 1;
                        document.getElementById("springk").value = physics.k;
                        alertmsg += "k must be greater than 0. Set to 1.\n"
                }
                physics.m = parseFloat(document.getElementById("springm").value);
                if (physics.m <= 0) {
                        physics.m = 1;
                        document.getElementById("springm").value = physics.m;
                        alertmsg += "m must be greater than 0. Set to 1.\n"
                }
                physics.c = parseFloat(document.getElementById("springc").value);
                if (physics.c < 0) {
                        physics.c = 0;
                        document.getElementById("springc").value = physics.c;
                        alertmsg += "c must be greater than or equal to 0. Set to 0.\n"
                }
                physics.x = parseFloat(document.getElementById("springx").value);
                physics.v = parseFloat(document.getElementById("springv").value);
                physics.t = 0;
                if (alertmsg !== "") {
                        alert(alertmsg);
                }
                model = updateModel(physics);
                stepRef = window.requestAnimationFrame(step);
        }
        

        function updateModel(physics) {
                var dampingType;
                if (physics.c == 0) {
                        dampingType = damping["UNDAMPED"];
                } else {
                        var discriminant = physics.c*physics.c - 4*physics.m*physics.k;
                        if (Math.abs(discriminant) < (physics.c*physics.c+4*physics.m*physics.k)/20000000000) {
                                dampingType = damping["CRITICALLY_DAMPED"];
                        }
                        else if (discriminant < 0) {
                                dampingType = damping["UNDERDAMPED"];
                        }
                        else {
                                dampingType = damping["OVERDAMPED"];
                        }
                }
                switch (dampingType) {
                        case damping["UNDAMPED"]:
                                dampingTypeSpan.innerHTML = "Undamped";
                                var beta = Math.sqrt(physics.k/physics.m);
                                var c1 = physics.x;
                                var c2 = physics.v/beta;
                                return function(physics) {
                                        physics.x = c1*Math.cos(beta*physics.t)
                                                  + c2*Math.sin(beta*physics.t);
                                };
                        case damping["UNDERDAMPED"]:
                                dampingTypeSpan.innerHTML = "Underdamped";
                                var alpha = -physics.c/(2*physics.m);
                                var beta = Math.sqrt(-discriminant)/(2*physics.m);
                                var c1 = physics.x;
                                var c2 = (-alpha*physics.x + physics.v)/beta;
                                return function(physics) {
                                        physics.x = c1*Math.exp(alpha*physics.t)*Math.cos(beta*physics.t)
                                                  + c2*Math.exp(alpha*physics.t)*Math.sin(beta*physics.t);
                                };
                        case damping["CRITICALLY_DAMPED"]:
                                dampingTypeSpan.innerHTML = "Critically Damped";
                                var r = -physics.c/(2*physics.m);
                                var c1 = physics.x;
                                var c2 = -r*physics.x + physics.v;
                                return function(physics) {
                                        physics.x = c1*Math.exp(r*physics.t)+c2*physics.t*Math.exp(r*physics.t);
                                }
                        case damping["OVERDAMPED"]:
                                dampingTypeSpan.innerHTML = "Overdamped";
                                var r1 = (-physics.c + Math.sqrt(discriminant))/(2*physics.m);
                                var r2 = (-physics.c - Math.sqrt(discriminant))/(2*physics.m);
                                var c1 = (r2*physics.x - physics.v)/(r2-r1);
                                var c2 = (-r1*physics.x + physics.v)/(r2-r1);
                                return function(physics) {
                                        physics.x = c1*Math.exp(r1*physics.t) + c2*Math.exp(r2*physics.t);
                                };
                }
        };

        function render() {
                springCtx.clearRect(0, 0, springCv.width, springCv.height);
                
                springCtx.fillStyle = springColor;
                springCtx.fillRect(0, physics.y-springWidth/2, physics.x+springCv.width/2, springWidth);
                
                springCtx.fillStyle = massColor;
                springCtx.fillRect(physics.x-massWidth/2+springCv.width/2, physics.y-massWidth/2, massWidth, massWidth); 
                
                springCtx.fillStyle = tickColor;
                springCtx.fillRect(springCv.width/2-1, 0, 2, springCv.height);
        }

        function step() {
                physics.t += 1;
                model(physics);
                render();
                stepRef = window.requestAnimationFrame(step);
        }
}
