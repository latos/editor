'use strict';

var util = require('./util');
var Point = require('./point');
var Range = require('./range');

var assert = util.assert;

module.exports = Selection;

/**
 * Abstraction over the editor selection, exposing
 * methods in terms of Point objects, and providing
 * facilities to manipulate, save, restore the
 * selection, across DOM modifications.
 */
function Selection(nativeSelection) {
  var me = this;

  var native = me.native = assert(nativeSelection);

  me.setCaret = function(point) {
    var pair = Point.check(point).toNodeOffset();

    native.setBaseAndExtent(pair[0], pair[1], pair[0], pair[1]);
  };

  me.setEndpoints = function(anchor, focus) {
    var anchorPair = Point.check(anchor).toNodeOffset();
    var focusPair = Point.check(focus).toNodeOffset();

    native.setBaseAndExtent(anchorPair[0], anchorPair[1], focusPair[0], focusPair[1]);
  };

  /** Convenience function - returns true if the selection is collapsed */
  me.isCollapsed = function() {
    return me.getRange().isCollapsed();
  };

  me.getRange = function() {
    // TODO: Check for selection within editor and return null if none.
    if (!native.anchorNode) {
      return null;
    }
    return new Range(
        Point.fromNodeOffset(native.anchorNode, native.anchorOffset),
        Point.fromNodeOffset(native.focusNode,  native.focusOffset));
  };

  var markers = [
    document.createElement('span'),
    document.createElement('span')
  ];

  // For debugging.
  markers[0].setAttribute('data-marker', 'start');
  markers[1].setAttribute('data-marker', 'end');

  me.saveToMarkers = function() {
    me.clearMarkers();

    var sel = me.getRange();
    sel.anchor.insert(markers[0]);
    sel.focus.insert(markers[1]);
  };

  me.clearMarkers = function() {
    util.removeNode(markers[0]);
    util.removeNode(markers[1]);
  };

  me.getCoords = getSelectionCoords;
};

// TODO: implement wrapper to abstract browser variants.
//function NativeSelection(browserSel) {
//  var sel = window.selection || browserSel;
//
//  if (sel.setBaseAndExtent) {
//    me.setBaseAndExtent = function(anchorNode, anchorOffset, focusNode, focusOffset) {
//      sel.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
//    };
//  } else {
//    me.setBaseAndExtent = function(anchorNode, anchorOffset, focusNode, focusOffset) {
//      assert(false, 'not implemented');
//    };
//  }
//
//};


// copy pasted from
// http://stackoverflow.com/questions/6846230/coordinates-of-selected-text-in-browser-page
// TODO: refactor as needed.
function getSelectionCoords() {
  var sel = document.selection, range, rects, rect;
  var x = 0, y = 0, width = 0;
  if (sel) {
    if (sel.type != "Control") {
      range = sel.createRange();
      range.collapse(true);
      x = range.boundingLeft;
      y = range.boundingTop;
      width = range.boundingWidth;
    }
  } else if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0).cloneRange();
      // Get width before collapsing
      if (range.getBoundingClientRect) {
        var rect = range.getBoundingClientRect();
        width = rect.right - rect.left;
      }
      // Collapse and get coords
      if (range.getClientRects) {
        range.collapse(true);
        rects = range.getClientRects();
        if (rects.length > 0) {
          rect = range.getClientRects()[0];
        }
        x = rect.left;
        y = rect.top;
      }
      // Fall back to inserting a temporary element
      if (x == 0 && y == 0) {
        var span = document.createElement("span");
        if (span.getClientRects) {
          // Ensure span has dimensions and position by
          // adding a zero-width space character
          span.appendChild( document.createTextNode("\u200b") );
          range.insertNode(span);
          rect = span.getClientRects()[0];
          x = rect.left;
          y = rect.top;
          width = rect.right - rect.left;
          var spanParent = span.parentNode;
          spanParent.removeChild(span);

          // Glue any broken text nodes back together
          spanParent.normalize();
        }
      }
    }
  }
  return { x: x, y: y, width: width };
}
