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
  var stems = [];

  this.editorElem = editor.currentElem();
  this.containerElem = this.createDom();
  this.reposition();

  /** Listen for changes in content and update. */
  editor.addListener({
    onContent: function () {
      updateStems( this.editorElem );
      return false;
    },
  });


  function updateStems(editorElem){
    var previousStems = stems;
    stems = [];

    /** Loops through all top level elements */
    var topLevelElems = getTopLevelElems();
    for (var i=0; i < topLevelElems.length; i++){
      var elem = topLevelElems[i];
      var stem = Stem.getOrCreate( elem, onClick, me.containerElem );
      stems.push(stem);
      stem.reposition();
    }

    /** Removes orphaned stems */
    for (var i=0; i < previousStems.length; i++){
      var previousStem = previousStems[i];
      if (stems.indexOf(previousStem) < 0){
        previousStem.remove();
      }
    }
  }

  function getTopLevelElems(){
    var topLevelElems = [];
    for (var node = me.editorElem.firstChild; node != null; node = node.nextSibling){
      if (needsStem(node)) {
        topLevelElems.push( node )
      }
    }
    return topLevelElems;
  }

  function needsStem (elem) {
    if (!canHaveStem(elem)){
      return false;
    } else {
      return elem.textContent.trim() === '' && typeof elem.$stem === 'undefined';
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
  this.containerElem.style.left = '-40px';
  this.containerElem.style.top = '0px';
}

module.exports = StemTracker;

