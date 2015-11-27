Possible GUI elements
=====================

pause menu
* options
* keybind
* inventory/item select

readable entities

dialogue

Geometric attributes
==============
Position / position type
Size / size type
Padding

GUI types
=========
list container
* may be horizontal or vertical
* each element in the list has an assigned pixel width (or height if its a vertical list)
* has a background attribute
* may be scrollable?
* divider width and color

window
* must be the root element (may initiate new window inside suppressing process if necessary)
* instantiated when window is opened
* callback function argument
* special container with border and background
* has exactly one child
* only gui element with absolute position
* contains a navigation graph that controls how the user navigates through the window with arrow keys, with attached scripts for activation of elements

text
* stores one line of text and text style

image
* stores an image (may be animated?)
