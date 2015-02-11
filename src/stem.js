'use strict';

var util = require("./util");


/**
 * Stem
 *
 * A class that creates and manages the "insert widget here" buttons a.k.a "stems"
 * that appear beside an empty block level element.
 */

function Stem(blockElem, onClick) {
  util.assert(!blockElem.$stem);

  this.blockElem = blockElem;
  this.blockElem.$stem = this;

  this.stemButton = this.createDom();
  this.reposition();

  // Handle click event
  this.stemButton.addEventListener( 'click', function() {
    onClick();
  }, false);

}

// Static "idompotent" function to retrive or create a Stem
Stem.getOrCreate = function(blockElem, onClick) {
  return blockElem.$stem || new Stem(blockElem, onClick);
}


// Hide the stem
Stem.prototype.destroy = function() {
  // Delete back reference
  delete this.blockElem.$stem;
  // Remove DOM
  document.body.removeChild( this.stemButton );
}

// Reposition the button.
Stem.prototype.reposition = function() {
  var coords = this.blockElem.getBoundingClientRect();
  this.stemButton.style.top = (coords.top - (this.stemButton.offsetHeight / 2)) + 'px';
  this.stemButton.style.left = (coords.left - this.stemButton.offsetWidth) + 'px';
}

// Add Stem Button to DOM
Stem.prototype.createDom = function() {
  var button = document.createElement("div");
  button.className = "stem-creator-button";
  button.innerHTML = "<span class='symbol'>+</span>";
  document.body.appendChild(button);
  return button;
}

module.exports = Stem;