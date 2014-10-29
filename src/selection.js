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


