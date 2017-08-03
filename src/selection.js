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
 *
 * currentElem is a function that returns the element to which the editor is currently attached
 */
function Selection(currentElem, nativeSelection) {
  var me = this;
  me.currentElem = currentElem;

  var native = me.native = nativeSelection || new NativeSelection();

  // If point is null, remove selection, otherwise set the caret at the provided point
  me.setCaret = function(point) {
    if (!point) {
      native.removeSelection();
    } else {
      var pair = Point.check(point).toNodeOffset();

      me.setBaseAndExtent(pair[0], pair[1], pair[0], pair[1]);
    }
    return;
  };

  me.setEndpoints = function(anchor, focus) {
    var anchorPair = Point.check(anchor).toNodeOffset();
    var focusPair = Point.check(focus).toNodeOffset();

    me.setBaseAndExtent(anchorPair[0], anchorPair[1], focusPair[0], focusPair[1]);
  };

  me.setBaseAndExtent = native.setBaseAndExtent;

  /** Convenience function - returns true if the selection is collapsed or there is no range*/
  me.isCollapsed = function() {
    var range = me.getRange();
    if (range) {
      return range.isCollapsed();
    } else {
      return true;
    }
  };

  /** Helper function - returns true if the selection is completely within the editor elem or false
  otherwise */
  /** TODO: check whether this function only works for parent relationships or can also include the same relationship. */
  me.withinEditor = function() {
    return compareWithElement(me.currentElem(), "parent");
  };

  /** Returns true if the selection is within the element or false otherwise */
  me.withinElement = function(element) {
    return compareWithElement(element, "same") || compareWithElement(element, "parent");
  };

  /** Returns true if the selection has the given relationship with the given element or false
  otherwise. Available relationships are:
    - 'parent'
    - 'child'
    - 'same'
  */
  function compareWithElement(element, relationship) {
    if (!native.anchorNode() || !native.focusNode() || !element || !util.isElement(element)) {
      return false;
    } else {
      var result = false;

      try {
        result = util.compareNodes(element, native.anchorNode()) === relationship &&
        util.compareNodes(element, native.focusNode()) === relationship
      } catch (e) {
        result = false;
      }

      return result;
    }
  };

  /** If selection is not within editor, or no caret, returns null. Otherwise
  returns a Range for the current selection. */
  me.getRange = function() {
    if (!native.anchorNode) {
      return null;
    } else if (!me.withinEditor()) {
      return null;
    }
    return new Range(
        Point.fromNodeOffset(native.anchorNode(), native.anchorOffset()),
        Point.fromNodeOffset(native.focusNode(),  native.focusOffset()));
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
    if (!sel) {
      return;
    } else {
      // In case they're in the same text node, do the
      // dom-order-latter one first, to avoid invalidating the other.
      if (sel.isOrdered()) {
        sel.focus.insert(markers[1]);
        sel.anchor.insert(markers[0]);
      } else {
        sel.anchor.insert(markers[0]);
        sel.focus.insert(markers[1]);
      }
    }
  };

  me.loadFromMarkers = function() {
    var start = Point.before(markers[0]).leftNormalized();
    var end = Point.after(markers[1]).rightNormalized();

    me.setEndpoints(start, end);
    me.clearMarkers();
  };

  me.setMarkers = function(newMarkers) {
    markers[0] = newMarkers.start;
    markers[1] = newMarkers.end;
  };

  me.getMarkers = function() {
    return {
      start: Point.before(markers[0]).leftNormalized(),
      end: Point.after(markers[1]).rightNormalized()
    };
  };

  me.clearMarkers = function() {
    util.removeNode(markers[0]);
    util.removeNode(markers[1]);
  };

  /** The returned width/height may be inaccurate on browsers that don't support getClientRects
  natively on ranges */
  me.getCoords = getSelectionCoords;
};

/** Thin abstraction over browser selection, aims to provide uniform interface for selection across
all browsers */
function NativeSelection(browserSel) {
  var me = this;

  me.sel = browserSel || window.getSelection();


  if (me.sel.setBaseAndExtent) {
    me.setBaseAndExtent = function(anchorNode, anchorOffset, focusNode, focusOffset) {
      me.sel.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    };
  } else if (me.sel.getRangeAt) {
    // Using Firefox caret setting methods as backup
    me.setBaseAndExtent = function(anchorNode, anchorOffset, focusNode, focusOffset) {
      // If we already have a selection, let's just move it
      if (me.sel.rangeCount > 0) {
        var fRange = me.sel.getRangeAt(0);
        fRange.setStart(anchorNode, anchorOffset);
        fRange.setEnd(focusNode, focusOffset);

      // Otherwise we need to create a range
      } else {
        var fRange = document.createRange();
        fRange.setStart(anchorNode, anchorOffset);
        fRange.setEnd(focusNode, focusOffset);
        me.sel.addRange(fRange);
      }
    };
  } else {
    me.setBaseAndExtent = function(anchorNode, anchorOffset, focusNode, focusOffset) {
      assert(false, 'setBaseAndExtent not implemented for this browser');
    };
  }

  if (me.sel.removeAllRanges) {
    me.removeSelection = function() {
      me.sel.removeAllRanges();
    };
  } else {
    me.removeSelection = function() {
      assert(false, 'not implemented');
    };
  }

  me.focusNode = function() {
    return me.sel.focusNode;
  };
  me.anchorNode = function() {
    return me.sel.anchorNode;
  };
  me.focusOffset = function() {
    return me.sel.focusOffset;
  };
  me.anchorOffset = function() {
    return me.sel.anchorOffset;
  };
};


// copy pasted from
// http://stackoverflow.com/questions/6846230/coordinates-of-selected-text-in-browser-page
// TODO: refactor as needed.
function getSelectionCoords() {
  var sel = document.selection, range, rects, rect;
  var x = null, y = null, width = null, height = null;
  if (sel) {
    if (sel.type != "Control") {
      range = sel.createRange();
      range.collapse(true);
      x = range.boundingLeft;
      y = range.boundingTop;
      width = range.boundingWidth;
      height = range.boundingHeight;
    }
  } else if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0).cloneRange();
      // Get details of selection bounding rectangle if possible
      if (range.getBoundingClientRect) {
        rect = range.getBoundingClientRect();
        width = rect.right - rect.left;
        height = rect.bottom - rect.top;
        x = rect.left;
        y = rect.top;
      // Otherwise collapse and get coords that we can
      } else if (range.getClientRects) {
        range.collapse(true);
        rects = range.getClientRects();
        if (rects.length > 0) {
          rect = range.getClientRects()[0];
        }
        if (rect) {
          x = rect.left;
          y = rect.top;
          width = rect.width;
          height = rect.height;
        }
      }
      // Fall back to inserting a temporary element
      if (x === null || y === null) {
        var span = document.createElement("span");
        if (span.getClientRects) {
          // Ensure span has dimensions and position by
          // adding a zero-width space character
          span.appendChild( document.createTextNode("\u200b") );
          range.insertNode(span);
          rect = span.getClientRects()[0];
          // TODO: The width/height isn't accurate when dealing with word wrapping. Need to take
          // that into account.
          if (rect) {
            x = rect.left;
            y = rect.top;
            width = rect.right - rect.left;
            height = rect.bottom - rect.top;
          }
          var spanParent = span.parentNode;
          spanParent.removeChild(span);

          // Glue any broken text nodes back together
          spanParent.normalize();
        }
      }
    }
  }

  // Handle the case that we were unable to set one or more of the values
  if (x === null || y === null || width === null || height === null) {
    throw new Error("Unable to determine selection coordinates");
  }

  return { x: x, y: y, width: width, height: height };
}
