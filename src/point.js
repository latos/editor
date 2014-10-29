var util = require('./util');
var assert = util.assert;

var TEXT   = 'text';
var START  = 'start';
var END    = 'end';
var BEFORE = 'before';
var AFTER  = 'after';

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

var magic = 'xx';

function text(textNode, offset) {
  return new Point(magic).moveToText(textNode, offset);
}

function start(elem) {
  return new Point(magic).moveToStart(elem);
}

function end(elem) {
  return new Point(magic).moveToEnd(elem);
}

function before(node) {
  return new Point(magic).moveToBefore(node);
}

function after(node) {
  return new Point(magic).moveToAfter(node);
}

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

  assert(checkNode(y).parentNode === x);

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

Point.prototype.elemAfter = function() {
  return ensureElem(this.nodeAfter());
};
Point.prototype.nodeAfter = function() {
  this.leaveTextNode();
};

Point.prototype.enterNext = function() {
  this.leaveTextNode(true);
  this.normalizeRight();
  assert(this.type === BEFORE, 'nothing on the right to enter', this);

  return this.moveToStart(this.node);
};

Point.prototype.toNodeOffset = function() {
  switch (this.type) {
    case TEXT: return [this.node, this.offset];
    case START: return [this.node, 0];
    case END: return [this.node, this.node.childNodes.length];
    case BEFORE: return [
        checkHasParent(this.node).parentNode, 
        childIndex(this.node)];
    case AFTER: return [
        checkHasParent(this.node).parentNode, 
        childIndex(this.node) + 1];
    default: assert(false);
  }
};

function childIndex(child) {
  var elem = child.parentNode;
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

Point.prototype.insert = function(node) {
  var pair = this
    .ensureInsertable()
    .leaveTextNode(true)
    .toNodeOffset();

  pair[0].insertBefore(node, pair[0].childNodes[pair[1]]);
};

Point.prototype.normalizeRight = function() {
  this.leaveTextNode(false);
  if (this.type == TEXT) {
    return this;
  } else if (this.type == AFTER) {
    var next = this.node.nextSibling;
    if (next) {
      return this.moveToBefore(next);
    } else {
      return this.moveToEnd(this.node.parentNode);
    }
  } else if (this.type == START) {
    var child = this.node.firstChild;
    if (child) {
      return this.moveToBefore(child);
    } else {
      return this.moveToEnd(this.node);
    }
  }

  assert(this.type === BEFORE || this.type === END);

  return this;
};

Point.prototype.isWithin = function(elem) {
  assert(false, 'unimplemented');
};

Point.prototype.compare = function(point) {
  Point.check(point);

  this.normalizeRight();
  point.normalizeRight();

  var relationship = util.compareNodes(this.node, point.node);
  if (relationship == 'before') {
    return -1;
  }
  if (relationship == 'after') {
    return 1;
  }
  if (relationship == 'parent') {
    return this.type !== END ? -1 : 1;
  }
  if (relationship == 'child') {
    return point.type === END ? -1 : 1;
  }
  if (relationship == 'same') {
    if (this.type === TEXT && point.type === TEXT) {
      return this.offset - point.offset;
    } else if (this.type === TEXT) {
      return 1;
    } else if (point.type === TEXT) {
      return -1;
    } else {
      assert(this.type === point.type, this.type, '!=', point.type);
      return 0;
    }
  }

  assert(false, 'unhandled situation - ', relationship);
};

/**
 * Moves the point out of text nodes, into the gap between them
 * If the point is in the middle (not at the edge) of a text node,
 * then an error occurs if requested by mustLeave.
 * Use ensureInsertable() first to avoid this.
 */
Point.prototype.leaveTextNode = function(mustLeave) {
  if (this.type == TEXT) {
    if (this.offset === 0) {
      return this.moveToBefore(this.node);
    }
    if (this.offset === this.node.length) {
      return this.moveToAfter(this.node);
    }
    if (mustLeave) {
      throw new Error('Cannot leave from middle of text node ' + 
          this.node + ':' + this.offset);
    }
  }

  return this;
};

Point.prototype.copy = function() {
  var point = new Point();
  point.type = this.type;
  point.node = this.node;
  point.offset = this.offset;
  return point;
};

function checkHasParent(node) {
  assert(node.parentNode, 'node not attached to a parent', node);
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
