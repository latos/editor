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

  me.holder.style.position = "absolute";
  me.holder.style['z-index'] = 0;

  me.container.appendChild(me.holder);

  elem.$placeholder = me;
};

/** Positions the placeholder based on current position of tracked elements */
Placeholder.prototype.reposition = function() {

  /* The position of the placeholder is calculated by getting the
  * difference between the element getting the placeholder and the top of
  * the placeholder-tracker. To complicate this, any margins applied to the
  * placeholder html will define the edge of the placeholder div but won't
  * get accounted for when grabbing the top of the element the placeholder
  * is being applied to. To fudge this we get the difference in height of
  * the div and it's child element.
  */

  var placeCoords     = this.elem.getBoundingClientRect();
  var containerCoords = this.container.getBoundingClientRect();

  var offset = 0;
  if (this.holder.firstChild) {
    var holderCoords      = this.holder.getBoundingClientRect();
    var holderChildCoords = this.holder.firstChild.getBoundingClientRect();
    offset = holderCoords.top - holderChildCoords.top;
  }

  this.holder.style.top = (placeCoords.top - containerCoords.top) + offset + 'px';

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
