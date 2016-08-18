var util = require('./util');
var assert = util.assert;

var TEXT   = 'text';
var START  = 'start';
var END    = 'end';
var BEFORE = 'before';
var AFTER  = 'after';

/**
 * A class that represents a location in the DOM, offering
 * a more convenient interface to traverse, mutate, compare
 * locations, etc, abstracting away the fairly fiddly code
 * normally needed for complex low-level DOM manipulations.
 *
 * Points offer a semi-opaque abstraction over the multiple
 * ways a particular DOM location can be represented.
 *
 * For example, when comparing points, the "start" of a
 * paragraph, a point "before" its first text node, and
 * a point at offset 0 of the first text node, are all considered
 * equivalent -- althought, the differences in representation
 * are accessible if needed.
 */
module.exports = Point;

Point.text = text;
Point.start = start;
Point.end = end;
Point.before = before;
Point.after = after;
Point.fromNodeOffset = fromNodeOffset;
Point.of = of;
Point.ofArgs = ofArgs;
Point.check = checkPoint;

Point.types = {
  TEXT:TEXT,
  START:START,
  END:END,
  BEFORE:BEFORE,
  AFTER:AFTER
};

var magic = 'xx';

/**
 * A point at the given character offset within a text node
 */
function text(textNode, offset) {
  return new Point(magic).moveToText(textNode, offset);
}

/**
 * A point inside the start of an element
 */
function start(elem) {
  return new Point(magic).moveToStart(elem);
}

/**
 * A point inside the end of an element
 */
function end(elem) {
  return new Point(magic).moveToEnd(elem);
}

/**
 * A point before a node
 */
function before(node) {
  return new Point(magic).moveToBefore(node);
}

/**
 * A point after a node
 */
function after(node) {
  return new Point(magic).moveToAfter(node);
}

/**
 * A point equivalent to that represented by the standard browser node/offset pair idiom
 */
function fromNodeOffset(node, offset) {
  if (node.nodeType === 3) {
    return text(node, offset);
  }

  if (offset === node.childNodes.length) {
    return end(node);
  }

  assert(offset >= 0 && offset < node.childNodes.length,
      'invalid offset for', node, offset);

  return before(node.childNodes[offset]);
}

function ofArgs(args) {
  return of(args[0], args[1]);
}

/**
 * An all-purpose adapter of either a Point, a node/offset pair, or
 * a node/node pair
 */
function of(x, y) {
  if (x instanceof Point) {
    assert(y === undefined);
    return x;
  }

  if (x.nodeType === 3) {
    return text(x, y);
  }

  assert(x.nodeType === 1);
  if (typeof y === 'number') {
    return fromNodeOffset(x, y);
  }

  if (y === null) {
    return end(x);
  }

  assert(parentNode(checkNode(y)) === x);

  return before(y);
}

function Point(check) {
  assert(check === magic, 'do not construct Point directly');
};
Point.prototype.toString = function() {
  return '[' + this.type + ' ' + this.node +
      (this.type === TEXT ? ':' + this.offset : '') + ']';
};


Point.prototype.moveToText = function(node, offset) {
  this.type = TEXT;
  this.node = checkText(node);
  assert(typeof offset === 'number', 'offset num required');

  assert(offset >= 0 && offset <= node.data.length, 'offset out of range', node.data, offset);
  this.offset = offset;
  return this;
};

Point.prototype.moveToTextStart = function(node) {
  this.moveToText(node, 0);
};

Point.prototype.moveToTextEnd = function(node) {
  this.moveToText(node, node.length);
};

Point.prototype.moveToStart = function(elem) {
  this.type = START;
  this.node = checkElem(elem);
  this.offset = null;
  return this;
};

Point.prototype.moveToEnd = function(elem) {
  this.type = END;
  this.node = checkElem(elem);
  this.offset = null;
  return this;
};

Point.prototype.moveToBefore = function(node) {
  this.type = BEFORE;
  this.node = checkNode(node);
  this.offset = null;
  return this;
};

Point.prototype.moveToAfter = function(node) {
  this.type = AFTER;
  this.node = checkNode(node);
  this.offset = null;
  return this;
};

/**
 * Returns a standard browser node/offset pair as a two element array.
 */
Point.prototype.toNodeOffset = function() {
  switch (this.type) {
    case TEXT: return [this.node, this.offset];
    case START: return [this.node, 0];
    case END: return [this.node, this.node.childNodes.length];
    case BEFORE: return [
        parentNode(checkHasParent(this.node)),
        childIndex(this.node)];
    case AFTER: return [
        parentNode(checkHasParent(this.node)),
        childIndex(this.node) + 1];
    default: assert(false);
  }
};

/**
 * The index of the given node within its parent's children
 */
function childIndex(child) {
  var elem = parentNode(child);
  var children = elem.childNodes;
  var len = children.length;
  for (var i = 0; i < len; i++) {
    if (children[i] === child) {
      return i;
    }
  }

  assert(false, 'not parent-child:', elem, child);
}

/**
 * Ensures the point is suitable for element insertion, by splitting
 * the text node it is within if necessary, otherwise does nothing.
 * Either way, moves itself to a suitable insertion point.
 * (and returns itself)
 */
Point.prototype.ensureInsertable = function() {
  if (this.type === TEXT && this.offset > 0 && this.offset < this.node.length) {
    return this.moveToBefore(this.node.splitText(this.offset));
  }

  return this;
};

/**
 * Inserts the given node at this point.
 */
Point.prototype.insert = function(newChild) {
  var p = this.rightNormalized();

  p.ensureInsertable();

  if (p.type === TEXT) {
    p = p.moveToAfter(p.node).rightNormalized();
  }

  assert(p.type !== TEXT);

  if (p.type === BEFORE) {
    parentNode(p.node).insertBefore(newChild, p.node);
  } else if (p.type === END) {
    p.node.appendChild(newChild);
  } else {
    assert(false);
  }

  return newChild;
};


/**
 * Split at a point.
 */
Point.prototype.splitRight = function(splitWith) {
  this.setTo(splitRight(this, splitWith).rightNormalized());
}

function splitRight(splitPoint, splitWith) {
  splitPoint.ensureInsertable();
  splitPoint = splitPoint.rightNormalized();
  var avoidSplittingIfPossible = !splitWith;

  var resultPoint = Point.after(splitPoint.containingElement());

  if (splitPoint.type === END && avoidSplittingIfPossible) {
    return resultPoint;
  }

  var originalElem = splitPoint.containingElement();
  if (splitWith === true || !splitWith) {
    splitWith = originalElem.cloneNode(false);
  }
  checkElem(splitWith);
  resultPoint.insert(splitWith);

  if (splitPoint.type === BEFORE) {
    do {
      var node = lastChild(originalElem);
      splitWith.insertBefore(node, firstChild(splitWith));
    } while (node != splitPoint.node);

  } else if (splitPoint.type === END) {
    // do nothing
  } else {
    assert(false);
  }

  return Point.before(splitWith);
};

/**
 * Split at a point with left-bias
 */
Point.prototype.splitLeft = function(splitWith) {
  this.setTo(splitLeft(this, splitWith).leftNormalized());
};

function splitLeft(splitPoint, splitWith) {
  // Creates the actaul split
  splitPoint.ensureInsertable();
  // Normalizes the point with left-bias
  splitPoint = splitPoint.leftNormalized();
  var avoidSplittingIfPossible = !splitWith;

  var resultPoint = Point.before(splitPoint.containingElement());

  // A split will end up with the point being outside the containing element. If we are attempting
  // to avoid splitting and the point is at the start, we just give the point outside the element
  if (splitPoint.type === START && avoidSplittingIfPossible) {
    return resultPoint;
  }

  // Grabs the containing element and clones, unless alternative element is provided, and inserts the empty node
  // before the original element
  var originalElem = splitPoint.containingElement();
  if (splitWith === true || !splitWith) {
    splitWith = originalElem.cloneNode(false);
  }
  checkElem(splitWith);
  resultPoint.insert(splitWith);

  if (splitPoint.type === AFTER) {

    // Move child elements of the original element that are left of the split point to the newly created node
    do{
      var node = firstChild(originalElem);
      splitWith.appendChild(node);
    } while (node != splitPoint.node);

  } else if (splitPoint.type === START) {
    // Do nothing
  } else {
    assert(false);
  }

  return Point.after(splitWith);
};

/*
 * Joins at this point, preserving the right node. Expects point to be either BEFORE or AFTER a node
 */
Point.prototype.joinRight = function() {
  this.setTo(joinRight(this).rightNormalized());
};

function joinRight(joinPoint) {
  assert(joinPoint.type === BEFORE || joinPoint.type === AFTER);
  joinPoint = joinPoint.rightNormalized();

  source = previousSibling(joinPoint.node);
  dest = joinPoint.node;
  prntNode = parentNode(dest);

  if (!source) {
    return Point.before(joinPoint.node);
  }

  if (hasChildNodes(source)) {
    if (lastChild(source).nodeType === 3) {
      resultPoint = Point.text(lastChild(source), lastChild(source).textContent.length)
    } else {
      resultPoint = Point.after(lastChild(source));
    }
  } else {
    resultPoint = Point.start(dest);
  }

  if (joinPoint.type === BEFORE) {
    // Move each node from the sibling node to the left over to this node
    while (hasChildNodes(source)) {
      var node = lastChild(source);
      dest.insertBefore(node, firstChild(dest));
    }
    // Remove the now empty node
    prntNode.removeChild(source);
  }
  else if (joinPoint.type === END) {
    // do nothing
  } else {
    assert(false);
  }

  // Before normalizing, check if the result point and any (new) previous sibling node are text.
  // If so grab a value for the new offset that is the length of the previous sibling's text
  if (previousSibling(resultPoint.node) && resultPoint.node.nodeType === 3
      && previousSibling(resultPoint.node).nodeType === 3) {
    newOffset = previousSibling(resultPoint.node).length;
  } else {
    newOffset = null;
  }

  dest.normalize();

  // If we calculated a new offset, set resultPoint to the new offset
  if (newOffset) {
    resultPoint.moveToText(resultPoint.node, newOffset);
  }

  return resultPoint;
};

/*
 * Joins at this point, preserving left node. Expects point to be either BEFORE or AFTER a node
 */
Point.prototype.joinLeft = function() {
  this.setTo(joinLeft(this).leftNormalized());
};

function joinLeft(joinPoint) {
  assert(joinPoint.type === BEFORE || joinPoint.type === AFTER);
  joinPoint = joinPoint.leftNormalized();

  source = nextSibling(joinPoint.node);
  dest = joinPoint.node;
  prntNode = parentNode(dest);


  if (!source) {
    return Point.after(joinPoint.node);
  }

  if (!hasChildNodes(dest)) {
    resultPoint = Point.start(dest);
  } else if (lastChild(dest).nodeType === 3) {
    resultPoint = Point.text(lastChild(dest), lastChild(dest).textContent.length);
  } else {
    resultPoint = Point.after(lastChild(dest));
  }

  if (joinPoint.type === AFTER) {
    while(hasChildNodes(source)) {
      var node = firstChild(source);
      dest.appendChild(node);
    }
    prntNode.removeChild(source);
  }
  else if (joinPoint.type === START) {
    // do nothing
  } else {
    assert(false);
  }

  // Normalize the node to remove any inner adjacent text nodes
  dest.normalize()

  return resultPoint;
};

/**
 * Adjusts the internal representation to be right-biased,
 */
Point.prototype.rightNormalized = function() {
  var p = this.nodeNormalized();

  if (p.type == TEXT) {
    return p;
  } else if (p.type == AFTER) {
    var next = nextSibling(p.node);
    if (next) {
      return before(next);
    } else {
      return end(parentNode(p.node));
    }
  } else if (p.type == START) {
    var child = firstChild(p.node);
    if (child) {
      return before(child);
    } else {
      return end(p.node);
    }
  }

  assert(p.type === BEFORE || p.type === END);

  return p;
};

/**
 * Adjusts the internal representation to be left-biased,
 */
Point.prototype.leftNormalized = function() {
  var p = this.nodeNormalized();
  if (p.type == TEXT) {
    return p;
  } else if (p.type == BEFORE) {
    var prev = previousSibling(p.node);
    if (prev) {
      return after(prev);
    } else {
      return start(parentNode(p.node));
    }
  } else if (p.type == END) {
    var child = lastChild(p.node);
    if (child) {
      return after(child);
    } else {
      return start(p.node);
    }
  }

  assert(p.type === AFTER || p.type === START);

  return p;
};


/**
 * Returns the containing element.
 */
Point.prototype.containingElement = function() {
  switch (this.type) {
    case TEXT:
    case BEFORE:
    case AFTER:
      return parentNode(this.node);
    case START:
    case END:
      return this.node;
    default: assert(false);
  }
};



/**
 * Returns the containing element, if the point is at its start
 * otherwise null.
 */
Point.prototype.elemStartingAt = function() {
  if (this.type === TEXT) {
    return this.offset === 0 && util.isFirstChild(this.node) || null;
  } else if (this.type === BEFORE) {
    return util.isFirstChild(this.node);
  } else if (this.type === START) {
    return this.node;
  } else if (this.type === END) {
    return firstChild(this.node) ? null : this.node;
  } else {
    return null;
  }
};

/**
 * Returns the containing element, if the point is at its end
 * otherwise null.
 */
Point.prototype.elemEndingAt = function() {
  if (this.type === TEXT) {
    return this.offset === this.node.length && util.isLastChild(this.node) || null;
  } else if (this.type === AFTER) {
    return util.isLastChild(this.node);
  } else if (this.type === END) {
    return this.node;
  } else if (this.type === START) {
    return firstChild(this.node) ? null : this.node;
  } else {
    return null;
  }
};

Point.prototype.nodeBefore = function() {
  var left = this.leftNormalized();
  switch (left.type) {
    case TEXT: return null;
    case START: return null;
    case AFTER: return left.node;
    default: assert(false);
  }
};
Point.prototype.elemBefore = function() {
  var node = this.nodeBefore();
  return node && node.nodeType === 1 ? node : null;
};
Point.prototype.hasTextBefore = function() {
  var left = this.leftNormalized();
  switch (left.type) {
    case TEXT: return true;
    case START: return false;
    case AFTER: return left.node.nodeType === 3;
    default: assert(false);
  }
};

Point.prototype.nodeAfter = function() {
  var right = this.rightNormalized();
  switch (right.type) {
    case TEXT: return null;
    case END: return null;
    case BEFORE: return right.node;
    default: assert(false);
  }
};
Point.prototype.elemAfter = function() {
  var node = this.nodeAfter();
  return node && node.nodeType === 1 ? node : null;
};
Point.prototype.hasTextAfter = function() {
  // NOTE: this won't handle comment nodes.
  var right = this.rightNormalized();
  switch (right.type) {
    case TEXT: return true;
    case END: return false;
    case BEFORE: return right.node.nodeType === 3;
    default: assert(false);
  }
};

Point.prototype.isWithin = function(elem) {
  assert(false, 'unimplemented');
};

Point.prototype.isEquivalentTo = function(point) {
  return this.compare(point) === 0;
};

/**
 * Returns a negative number if this point is before the
 * other point in depth-first dom-traversal order, positive
 * if it is after, or zero if the two points are equivalent.
 *
 * NB that a point at the "start" of a paragraph, a point
 * "before" its first text node, and a point at offset 0 of
 * the first text node, are all considered equivalent.
 */
Point.prototype.compare = function(point) {
  Point.check(point);

  var p1 = this.rightNormalized();
  var p2 = point.rightNormalized();

  var relationship = util.compareNodes(p1.node, p2.node);
  if (relationship == 'before') {
    return -1;
  }
  if (relationship == 'after') {
    return 1;
  }
  if (relationship == 'parent') {
    return p1.type !== END ? -1 : 1;
  }
  if (relationship == 'child') {
    return p2.type === END ? -1 : 1;
  }
  if (relationship == 'same') {
    if (p1.type === TEXT && p2.type === TEXT) {
      return p1.offset - p2.offset;
    } else if (p1.type === TEXT) {
      return 1;
    } else if (p2.type === TEXT) {
      return -1;
    } else if (p1.type === p2.type) {
      return 0;
    } else if (p1.type === BEFORE) {
      assert(p2.type === END);
      return -1;
    } else if (p2.type === BEFORE) {
      assert(p1.type === END);
      return 1;
    } else {
      assert(false, p1.type, '!=', p2.type);
    }
  }

  assert(false, 'unhandled situation - ', relationship);
};

Point.prototype.isInEmptyTextNode = function() {
  return this.type === TEXT && this.node.length === 0;
};

/**
 * Returns new point out of text nodes, into the gap between them
 * if possible. If deep in a text node, returns original. If already
 * a node point, returns self.
 */
Point.prototype.nodeNormalized = function(mustLeave) {
  if (this.type == TEXT) {
    if (this.offset === 0) {
      return before(this.node);
    }
    if (this.offset === this.node.length) {
      return after(this.node);
    }
    assert(this.offset > 0 && this.offset < this.node.length, this.offset, this.node.data);
  }

  return this.copy();
};

Point.prototype.copy = function() {
  var point = new Point(magic);
  point.type = this.type;
  point.node = this.node;
  point.offset = this.offset;
  return point;
};


Point.prototype.setTo = function(point) {
  this.type = point.type;
  this.node = point.node;
  this.offset = point.offset;
}

//function rightNormalized0(func) {
//  return function() {
//    func(this.rightNormalized());
//  };
//}
//function rightNormalized1(func) {
//  return function(arg1) {
//    func(this.rightNormalized(), arg1);
//  };
//}
//
//function leftNormalized0(func) {
//  return function() {
//    func(this.leftNormalized());
//  };
//}
//function leftNormalized1(func) {
//  return function(arg1) {
//    func(this.leftNormalized(arg1));
//  };
//}

function checkHasParent(node) {
  assert(parentNode(node), 'node not attached to a parent', node);
  return node;
}

function checkElem(node) {
  assert(node.nodeType === 1, 'not an element', node);
  return node;
}
function checkText(node) {
  assert(node.nodeType === 3, 'not a text node', node);
  return node;
}
function checkNode(node) {
  assert(node.nodeType === 1 || node.nodeType === 3, 'invalid node', node);
  return node;
}
function checkPoint(obj) {
  assert(obj instanceof Point, 'object not a Point', obj);
  return obj;
}


// We use these dom-traversal helpers instead of the node properties
// so that we effectively get a filtered 'view' of the dom that
// contains only elements and text (in particular, skip comment nodes)
// In any case, these functions are a choke-point for customizing
// this kind of behaviour.
// NB: Be careful with usage of other props e.g. childNodes,

function hasChildNodes(node) {
  return firstChild(node) != null;
}

function parentNode(node) {
  return node.parentNode;

  if (!node.parentNode) {
    return null;
  }
  var candidate = node.parentNode;
  if (candidate.nodeType === 1 || candidate.nodeType === 3) {
    return candidate;
  }
  return parentNode(candidate);
}

function firstChild(node) {
  if (!node.firstChild) {
    return null;
  }
  var candidate = node.firstChild;
  if (candidate.nodeType === 1 || candidate.nodeType === 3) {
    return candidate;
  }
  return nextSibling(candidate);
}

function lastChild(node) {
  if (!node.lastChild) {
    return null;
  }
  var candidate = node.lastChild;
  if (candidate.nodeType === 1 || candidate.nodeType === 3) {
    return candidate;
  }
  return previousSibling(candidate);
}

function nextSibling(node) {
  if (!node.nextSibling) {
    return null;
  }
  var candidate = node.nextSibling;
  if (candidate.nodeType === 1 || candidate.nodeType === 3) {
    return candidate;
  }
  return nextSibling(candidate);
}

function previousSibling(node) {
  if (!node.previousSibling) {
    return null;
  }
  var candidate = node.previousSibling;
  if (candidate.nodeType === 1 || candidate.nodeType === 3) {
    return candidate;
  }
  return previousSibling(candidate);
}

