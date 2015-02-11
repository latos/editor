'use strict';
var Stem = require("./stem");

/**
 * Stem Tracking Utility.
 *
 * Handles the stems for a given editor.
 */
module.exports = function StemTracker(editor, onClick) {
  var me = this;
  var previousStems = [];
  var stems = [];
  var topLevelTags = ['p', 'h1', 'h2', 'h3', 'div', 'section'];

  // Listen for changes in content and update.
  editor.addListener({
    onContent: function () {
      updateStems( editor.currentElem() );
      return false;
    },
    onKey: function(e) {
      if (e.keyType == 'backspace' && e.point.type == 'start') {
        updateStems( editor.currentElem() );
      }
      return false; 
    }
  });

  function updateStems(editorElem){
    previousStems = stems;
    stems = [];

    
    // Loop through all top level elements
    var topLevelElems = getTopLevelElems( topLevelTags, editorElem );
    for (var i=0; i < topLevelElems.length; i++){
      var elem = topLevelElems[i];
      // Add stems where required.
      if (needsStem(elem)) {
        var stem = Stem.getOrCreate( elem, onClick );
        stems.push(stem);
      }
    }

    // Remove orphaned stems
    for (var i=0; i < previousStems.length; i++){
      var previousStem = previousStems[i];
      if (stems.indexOf(previousStem) < 0){
        previousStem.destroy();
      }
    }


  }

  function getTopLevelElems(tags, editorElem){
    var topLevelElems = [];
    for (var i=0; i < tags.length; i++){
      topLevelElems = mergeNodeList( 
        topLevelElems, editorElem.getElementsByTagName( tags[i] ) 
      );
    }
    return topLevelElems;
  }

  function mergeNodeList(array, nodeList) {
    return array.concat(Array.prototype.slice.call(nodeList));
  }


  function needsStem (elem) {
    return elem.textContent === '' && typeof elem.$stem === 'undefined';
  }

}


