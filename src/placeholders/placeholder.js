'use strict';
var util = require('./../util');

/**
 * Placeholder
 *
 * Representation of the placeholder to be placed over blank block elems
 *
 */

function Placeholder(elem, tracker) {
  var tag = elem.tagName;
  var text = tracker.placeholderTexts[tag] || "Placeholder";

  var me = this;
  me.elem = elem;
  me.container = tracker.container;

  me.holder = document.createElement("div");
  me.holder.className = "qed-placeholder";
  me.holder.innerHTML = "<" + tag + ">" + text + "</" + tag + ">";

  me.container.appendChild(me.holder);

  elem.$placeholder = me;
};

/** Positions the placeholder based on current position of tracked elements */
Placeholder.prototype.position = function() {
  // HACK: So that holder's clientHeight is correct, we have to set the position style to absolute before doing calculations
  this.holder.style.position= "absolute";

  var coords = this.elem.getBoundingClientRect();
  var boundingCoords = this.elem.parentNode.getBoundingClientRect();

  var elemTop = (coords.top - boundingCoords.top);

  var offset = (this.holder.clientHeight - coords.height) / 2;

  this.holder.style.top = (elemTop - offset) + 'px';
  this.holder.style.left = (coords.left - boundingCoords.left) + 'px';
  this.holder.style['z-index'] = -1;
  return;
};

/** Removes the placeholder from dom */
Placeholder.prototype.remove = function() {
  delete this.elem.$placeholder;
  util.removeNode( this.holder );
};

/** Static to either retrieve attached placeholder, or create a new one **/
Placeholder.getOrCreate = function(elem, tracker) {
  return elem.$placeholder || new Placeholder(elem, tracker);
};


module.exports = Placeholder
