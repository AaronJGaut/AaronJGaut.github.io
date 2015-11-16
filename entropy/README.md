Entropy
=======

Last updated November 16, 2015

Files
-----

### index.html

Almost nothing here. Just imports the styling and loads all the .js files. Has a div for the game canvases to go in.

### style.css

Contains styling for the canvases and rest of the page.

### loader.js

This is the starting point for the game. Once the page is loaded, loader will gather all game resources such as level data and constants from the various files. Once everthing is ready it starts the game engine.

### engine.js

Contains the main loop of the game and its high level logic.

### entities.js

Contains the funtion getEntityFactory, which should be called with two arguments:

* attributes --- this is a dictionary where each key is the name of an entity type. The corresponding value is another dictionary whose key value pairs are attributes to be assigned to the respective entity. This is useful for defining constants for specific entities (e.g. the player's width and height).  
* constants --- this is a dictionary for general constants that may be needed by entities.

getEntityFactory returns a dictionary where each key is the name of an entity type and each value is a prototype for the respective entity. The function only needs to be called once, then its return value can be used to create entities for the duration of the game.

#### Sample Usage:
        var entities = getEntityFactory(attributes, constants);
        //sometime later
        var player = new entities["player"]();

### tiles.js

Very similar to entities.js but for tiles instead of entities. Maybe tiles and entities should be merged into a common inheritance chain. (zones too?)

### keyboard.js

Handles keyboard input and converts to game actions (jump, left, etc...) using a keybind dictionary. Provides an interface for checking the state of said game actions.

### camera.js

Setup is similar to getEntityFactory, except the return value is the Camera prototype. Determines what portion of the room to draw. The camera tries to lead a bit by considering player velocity. Contains two useful fuctions, transformPoint and transformBox, which convert from absolute coordinates in the room to cordinates in the visible portion of the room. A new camera object should be created each time a room is entered.

### quadtree.js

Implements a data structure useful for efficient collision detection. Stores hitboxes in a tree structure based on their location in the room.

### canvasmanager.js

A wrapper for multiple canvasas, layered on top of each other. Many of the functions are copies of canvas functions but with an extra argument specifying the layer to draw to.

### textmanager.js

Handles storage of text fonts and styles, and provides a function for drawing text to a given canvas.

### drawmanager.js

Encapsulates a canvas manager and text manager and provides smarter, high level functions that can be used to render game elements.

### audiomanager.js

Uses the web audio API (absent in IE, so no audio with that browser)
Handles storage of audio assets, managing the audio graph, playing sound effects and music, and tracking currently playing audio.

### processStack.js

Determines what processes to run on each time step, and in what order. Processes are capable of suppressing other processes from running (imagine a dialog box that pauses gameplay until it is resolved). Processes are functions stored in a series of stacks. Processes in an earlier stack or closer to the top of a stack can suppress all processes that come later. Order of execution is determined by a separate parameter and is not necessarily connected to the suppress heirarchy.

### set.js

Implements a set data structure. Note this set has a different interface than the set that is implemented in some browsers. All entries in the set will be casted to strings, so it can only distinguish between objects whose string representations are unique.

### rAF.js

A polyfill for the requestAnimationFrame function. requestAnimationFrame is better than simply using setInterval, and automatically targets 60fps.

To do
-----

Add and remove things from this list as you see fit. For now let's focus on expanding the engine capabilities and making audio and visual assets.

* More and better assets. This includes tilesheets, spritesheets, fonts, ui elements, sound effects, and music.
* Merging entities, tiles, and zones into a common type.
* More sophisticated audio graph; for example, gradual change in gain during song transitions and basic programmable modifications to the quality of sound.
* More entities. The only complete entity is the player. Aside from simple enemies some ideas are pushable blocks, invincible spikes, entities that belong to other entities (e.g. projectiles or floating arms), noninteracting entities that are just for looks, and powerups. It might be worth devising a deeper system of inheritance so similar types of entities aren't too repetative.  
* Pause menu with options, inventory screen, and the ability to change keybinds.  
