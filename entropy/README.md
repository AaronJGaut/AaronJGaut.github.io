Entropy
=======

Files
-----

### index.html

Almost nothing here. Just imports the styling and loads all the .js files. Has a div for the game canvases to go in.

### style.css

Contains styling for the canvases and rest of the page. Handles the aliasing and zooming of the canvases.

### loader.js

This is the starting point for the game. Once the page is loaded, loader will gather all game resources such as level data and constants from the various files. Once everthing is ready it starts the game engine.

### engine.js

Contains the main loop of the game and its high level logic.

### entities.js

Contains the funtion getEntityFactory, which should be called with two arguments:

* attributes --- this is a dictionary where each key is the name of an entity type. The corresponding value is another dictionary whose key value pairs are attributes to be assigned to the respective entity. This is useful for defining constants for specific entities (e.g. the player's width and height).  
* constants --- this is a dictionary for general constants that may be needed by entities.

getEntityFactory returns a dictionary where each key is the name of an entity type and each value is a prototype for the respective entity. The funciton only needs to be called once, then its return value can be used to create entities for the duration of the game.

#### Sample Usage:
        var entities = getEntityFactory(attributes, constants);
        //sometime later
        var player = new entities["player"]();

### keyboard.js

Handles keyboard input and converts to game actions (jump, left, etc...) using a keybind dictionary. Provides an interfacing for checking the state of said game actions.

### camera.js

Setup is similar to getEntityFactory, except the return value is the camera function. Determines what portion of the room to draw. The camera tries to lead a bit by considering player velocity. Contains two useful fuction attributes, transformPoint and transformBox, which convert from absolute coordinates in the room to cordinates in the visible portion of the room. A new camera object should be created each time a room is entered.

### quadtree.js

Implements a data structure useful for efficient collision detection. Stores hitboxes based on their location in the room. Isn't actually being used in the engine for collision detection just yet.

### rAF.js

A polyfill for the requestAnimationFrame function. requestAnimationFrame is better than simply using setInterval, and automatically targets 60fps.

To do
-----

Add and remove things from this list as you see fit. For now let's focus on expanding the engine capabilities and making audio and visual resources.

* sound.js --- similar to keyboard.js or camera.js but for handling sound output. Needs an interface somehow accessible to all entities as well as the portion of code that deals with entering worlds and rooms in engine.js.  
* While on the topic, we need sound effects and music resources to use.  
* Better drawing system. Current drawing system is just for debugging; everything is redrawn every frame. We can use multiple canvases layered on top of each other to avoid redraws. Another improvement would be to keep track of and only clear sections of a canvas that have changed instead of clearing the whole thing.  
* More entities. The only complete entity is the player. Aside from simple enemies some ideas are pushable blocks, invincible spikes, entities that belong to other entities (e.g. projectiles or floating arms), noninteracting entities that are just for looks, and powerups. It might be worth devising a deeper system of inheritance so similar types of entities aren't too repetative.  
* Proper collision detection. Quadtrees are still missing some implementation before they can be used. Collision detection needs to work on all relevent entities, not just the player.  
* A status overlay at the top of the screen. See Super Metroid for an example.  
* Pause menu with options, inventory screen, and the ability to change keybinds.  
* Better tilesheets and backgrounds. The current ones are placeholder.  
