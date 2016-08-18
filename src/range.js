'use strict';

var util = require('./util');
var Point = require('./point');
var assert = util.assert;

module.exports = Range;

Range.collapsed = function(point) {
  return new Range(point, point);
};

/**
 * A pair of Points, representing a range.
 */
function Range(anchor, focus) {
  this.anchor = Point.check(anchor);
  this.focus = Point.check(focus);
};

Range.prototype.isCollapsed = function() {
  return this.anchor.compare(this.focus) === 0;
};

/**
 * Deep-copies the range (copies the underlying points too)
 */
Range.prototype.copy = function() {
  return new Range(this.anchor.copy(), this.focus.copy());
};

/**
 * True if the focus comes after (or is equivalent to) the anchor.
 */
Range.prototype.isOrdered = function() {
  return this.anchor.compare(this.focus) <= 0;
};

Range.prototype.orderedCopy = function() {
  var r = this.copy();
  r.order();
  return r;
};

Range.prototype.getStart = function() {
  return this.isOrdered() ? this.anchor : this.focus;
};

Range.prototype.getEnd = function() {
  return this.isOrdered() ? this.focus : this.anchor;
};

Range.prototype.order = function() {
  if (!this.isOrdered()) {
    var tmp = this.focus;
    this.focus = this.anchor;
    this.anchor = tmp;
  }

  return this;
};

Range.prototype.outwardNormalized = function() {
  return (this.isOrdered() 
      ? new Range(this.anchor.leftNormalized(), this.focus.rightNormalized())
      : new Range(this.focus.leftNormalized(), this.anchor.rightNormalized())
      );
};

Range.prototype.isEquivalentTo = function(other) {
  return this.anchor.isEquivalentTo(other.anchor) &&
         this.anchor.isEquivalentTo(other.anchor);
};

Range.prototype.isUnorderedEquivalentTo = function(other) {
  return this.getStart().isEquivalentTo(other.getStart()) &&
         this.getEnd().isEquivalentTo(other.getEnd());
};

/**
 * Returns a left-to-right iterator (regardless of range's ordering).
 */
Range.prototype.iterateRight = function() {
  return new RightIterator(this.getStart(), this.getEnd());
};


var RightIterator = function(start, end) {
  this.start = start.leftNormalized();
  this.end = end.rightNormalized();

  this.point = start.rightNormalized();
};

RightIterator.prototype.isAtEnd = function() {
  var cmp = this.point.compare(this.end);
  assert(cmp <= 0);

  return cmp === 0;
};

RightIterator.prototype.skipText = function() {
  if (this.isAtEnd()) {
    return null;
  }

  var original = this.point.leftNormalized();
  var totalChars = 0;
  while (!this.isAtEnd()) {
    if (!this.point.hasTextAfter()) {
      break;
    }

    // start offset within the text node we are entirely or partially skipping.
    var startOffset;
    var textNode = this.point.nodeAfter();

    if (textNode) {
      startOffset = 0;

      // assume no comments, etc.
      // will need to handle them if encountered,
      // probably by skipping over but not updating count.

      assert(textNode.nodeType === 3);
    } else {
      startOffset = this.point.offset;
      textNode = this.point.node;
    }

    assert(typeof startOffset === 'number');

    // end offset within the text node we are entirely or partially skipping.
    var endOffset;
    var endIsInSameNode = (this.end.type === Point.types.TEXT 
                        && this.end.node === textNode);

    endOffset = endIsInSameNode ? this.end.offset : textNode.length;


    assert(endOffset >= startOffset);

    totalChars += endOffset - startOffset;

    if (endOffset === textNode.length) {
      this.point.moveToAfter(textNode);
    } else {
      this.point.moveToText(textNode, endOffset);
      assert(this.isAtEnd());
    }
  }

  if (totalChars === 0) {
    return null;
  }
  
  return new FlatTextRange(original, this.point.rightNormalized(), totalChars);
};

RightIterator.prototype.enterElement = function() {
  if (this.isAtEnd()) {
    return null;
  }

  var node = this.point.nodeAfter();
  if (node && node.nodeType === 1) {
    this.point.moveToStart(node);
    return node;
  }

  return null;
};

RightIterator.prototype.leaveElement = function() {
  if (this.isAtEnd()) {
    return null;
  }

  var container = this.point.containingElement();
  assert(container); // not expecting to leave the dom, end point should have been well defined.

  var after = Point.after(container);
  if (after.compare(this.end) > 0) {
    return null;
  }

  this.point = after;

  return container;
};

var FlatTextRange = function(start, end, length) {
  assert(length > 0);
  this.start = start;
  this.end = end;
  this.length = length;

  if (!start.hasTextAfter()) {
    throw new Error('Invalid text range start ' + this.start.debug(1));
  }
  if (!end.hasTextBefore()) {
    throw new Error('Invalid text range end ' + this.end.debug(1));
  }
};

FlatTextRange.prototype.wrap = function(elem) {
  this.start = this.start.ensureInsertable(this.start);
  this.end   = this.end.ensureInsertable(this.end);

  assert(false); // todo
};

FlatTextRange.prototype.getText = function() {
  assert(this.start.hasTextAfter());
  assert(this.end.hasTextBefore());
  var firstNode = this.start.nodeAfter() || this.start.node;
  var lastNode = this.end.nodeBefore() || this.end.node;
  assert(firstNode.nodeType === 3);
  assert(lastNode.nodeType === 3);

  if (firstNode === lastNode) {
    return firstNode.data.substring(
        this.start.offset || 0, 
        this.end.offset || firstNode.data.length);
  }

  var text = firstNode.data.substring(this.start.offset);
  for (var node = firstNode.nextSibling; 
      node != lastNode;
      node = node.nextSibling) {

    text += node.data
  }

  text += lastNode.data.substring(0, this.end.offset);

  return text;
}

