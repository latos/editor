'use strict';
var util = require('./../util');
var Placeholder = require('./placeholder');

/**
 * Placeholder tracking
 *
 * Track elements with 'placeholder=true' attribute and attach default text
 * when the element is empty. We keep the placeholder text out of the editor
 * to ensure there is less mess in what you save.
 */

function PlaceholderTracker(editor) {

  var me = this;
  me.placeholderTexts = {};
  me.places = [];

  me.editor = editor;

  me.editorElem = editor.currentElem();

  /** Defines container for placeholders */
  me.container = createContainer();
  me.editorElem.parentNode.insertBefore( me.container, me.editorElem );

  /**
   * Defines a placeholder for a given tag
   * Currently only supports text placeholder.
   */
  me.addPlaceholder = function(tag, text) {
    me.placeholderTexts[tag] = text;
  }

  /**
   * Explicitly start tracking so that users can add placeholders
   * as is wanted before DOM gets manipulated.
   */
  me.startTracking = function() {
    me.editor.addListener({
      onContent: function () {
        updatePlaceholders( me.editor.currentElem() );
        return false;
      }
    });
  }

  /** Loops over top level nodes in editor and adds/removes placeholders as necessary */
  function updatePlaceholders(editorElem) {
    var previousPlaces = me.places;
    me.places = [];

    for (var node = me.editorElem.firstChild; node != null; node = node.nextSibling) {
      if (needsPlaceholder(node)) {
        var placeholder = Placeholder.getOrCreate(node, me);
        placeholder.position();
        me.places.push(placeholder);
      } else if (node.$placeholder) {
        node.$placeholder.remove();
      }
    }

    /** Removes orphaned stems */
    for (var i=0; i < previousPlaces.length; i++) {
      var previousPlace = previousPlaces[i];
      if (me.places.indexOf(previousPlace) < 0) {
        previousPlace.remove();
      }
    }
  };

  /** Checks whether the provided node needs a placeholder, though doesn't check if it already has one */
  function needsPlaceholder(node) {
    if (util.isElement(node) && util.isBlock(node) && util.isEditable(node)) {
      if (node.getAttribute('placeholder')) {
        return node.textContent.trim() === '';
      }
    }
  };

  /** Creates DOM element for the container */
  function createContainer() {
    var c = document.createElement("div");
    c.className = "qed-placeholder-container";
    c.style.position = "relative";
    c.style.left = "0px";
    return c;
  };
}

module.exports = PlaceholderTracker;
