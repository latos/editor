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
  this.reposition();
  this.addStyles();

  // Handle click event
  this.stemButton.addEventListener( 'click', function(me) {
    return function(e) {
      onClick(e, me);
    };
  }(this), false);

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
  var coords = this.blockElem.getBoundingClientRect();
  var boundingCoords = this.blockElem.parentNode.getBoundingClientRect();
  var centering = (coords.height / 2) - (buttonDiameter / 2);
  //var centering = 0;
  this.stemButton.style.top = (coords.top - boundingCoords.top + centering) + 'px';
  //this.stemButton.style.top = (coords.top - (this.stemButton.offsetHeight * 4)) + 'px';
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
