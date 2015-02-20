'use strict';
var util = require("./../util");
var Stem = require("./stem");

/**
 * Stem Tracking Utility.
 *
 * A stem is a widget insertion button. It signifies a potential widget.
 * The tracking utility manages the absolute positioning of these stems,
 * as well as their addition and removal from the DOM.
 */

function StemTracker(editor, onClick) {
  var me = this;
  var stem;
  var topLevelTags = ['p', 'h1', 'h2', 'h3', 'div', 'section'];

  this.editorElem = editor.currentElem();
  this.containerElem = this.createDom();
  this.reposition();

  /** Listen for changes in content and update. */
  editor.addListener({
    onKeyup: function (e) {
      updateStems();
      return false;
    },
    onMouseup: function (e) {
      updateStems();
      return false
    }
  });


  function getTopLevelBlockElem(currentNode){
    for (var node = currentNode; node != null; node = node.parentNode){
      if (util.isElement(node) && util.isBlock(node)) {
        return node;
      }
    }
    return false;
  } 

  function updateStems(){
    var point = editor.selection().getRange().focus;
    var previousStem = stem;
    if (stem){
      stem.remove();
    }

    // Get top-level element containing current selection / cursor, if any
    var elem = getTopLevelBlockElem( point.node )
    if (!needsStem(elem)){
      stem.remove()
    } else {
      stem = Stem.getOrCreate( elem, onClick, me.containerElem );
    }
  }

  function needsStem (elem) {
    if (!canHaveStem(elem)){
      return false;
    } else {
      return elem.textContent.trim() === ''; // && typeof elem.$stem === 'undefined';
    }
  }

  function canHaveStem(elem) {
    return util.isElement(elem) && util.isBlock(elem) && util.isEditable(elem);
  }

}

/** Creates and Appends DOM for the Stem Tracker */
StemTracker.prototype.createDom = function() {
  var containerElem = document.createElement("div");
  containerElem.className = "stem-tracker-container";
  this.editorElem.parentNode.insertBefore( containerElem, this.editorElem );
  return containerElem;
}

/** Positions the Stem Tracker's container div in the DOM */
StemTracker.prototype.reposition = function() {
  this.containerElem.style.position = 'relative';
  this.containerElem.style.left = '-30px';
  this.containerElem.style.top = '0px';
}

module.exports = StemTracker;

