'use strict';

var util = require("./../util");

/***
 * Stem
 *
 * A class that creates and manages the "insert widget here" buttons a.k.a "stems"
 * that appear beside an empty block level element.
 */

 // Define the button height for use across the stem button
 var buttonDiameter = 30;

function Stem(blockElem, onClick, containerElem) {
  util.assert(!blockElem.$stem);

  this.blockElem = blockElem;
  this.blockElem.$stem = this;
  this.containerElem = containerElem;

  this.stemButton = this.createDom();
  this.addStyles();
  this.reposition();

  // Handle click event
  var me = this;
  this.stemButton.addEventListener( 'click', function(e) {
    onClick(e, me);
  }, false);

}

/** Static idompotent function to retrive or create a Stem */
Stem.getOrCreate = function(blockElem, onClick, containerElem) {
  return blockElem.$stem || new Stem(blockElem, onClick, containerElem);
}


/** Remove the stem */
Stem.prototype.remove = function() {
  delete this.blockElem.$stem;
  util.removeNode( this.stemButton );
}

/** Reposition the button. */
Stem.prototype.reposition = function() {
  var elemCoords      = this.blockElem.getBoundingClientRect();
  var containerCoords = this.containerElem.getBoundingClientRect();

  /* We need to shift the button to center it on the line */
  var buttonCoords = this.stemButton.getBoundingClientRect();
  var centering    = (elemCoords.height / 2) - (buttonCoords.height / 2);

  this.stemButton.style.top = (elemCoords.top - containerCoords.top + centering) + 'px';
}

/** Adds a Stem Button to DOM */
Stem.prototype.createDom = function() {
  var button = document.createElement("div");
  button.className = "stem-creator-button";
  button.innerHTML = "<span class='symbol'>+</span>";
  this.containerElem.appendChild(button);
  return button;
}

/** Adds Basic styles */
Stem.prototype.addStyles = function() {
  this.stemButton.style.background = "#fff";
  this.stemButton.style.border = "1px solid #ccc";
  this.stemButton.style.position = "absolute";
  this.stemButton.style.width = buttonDiameter + "px";
  this.stemButton.style.height = buttonDiameter + "px";
  this.stemButton.style['border-radius'] = "100px";
  this.stemButton.style['line-height'] =  "30px";
  this.stemButton.style['text-align'] =  "center";
  this.stemButton.firstElementChild.style.color = '#ccc';
}

module.exports = Stem;
