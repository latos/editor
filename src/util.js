var assert = exports.assert = function(truth, msg) {
  if (!truth) {
    var info = Array.prototype.slice.call(arguments, 1);
    throw new Error('Assertion failed' + (info.length > 0 ? ': ' + info.join(' ') : '!'));
  }
  return truth;
};


exports.isVanillaObj = function(x) {
  return typeof x === 'object' && x.constructor == Object;
};

exports.args2array = function(x) {
  return Array.prototype.slice.call(x);
};

exports.shallowCopy = function(obj) {
  var copy = {};
  for (var k in obj) {
    copy[k] = obj[k];
  }
  return copy;
};

exports.isElement = function(node) {
  return node.nodeType === 1;
}

exports.isOrHasChild = function(elem, maybeChild) {
  while (maybeChild) {
    if (maybeChild === elem) {
      return true;
    }

    maybeChild = maybeChild.parentNode;
  }

  return false;
};

/**
 * returns the node's parent if the node is its first child
 */
exports.isFirstChild = function(node) {
  return !node.previousSibling && node.parentNode || null;
};

/**
 * returns the node's parent if the node is its last child
 */
exports.isLastChild = function(node) {
  return !node.nextSibling && node.parentNode || null;
};

exports.isEditable = function(elem) {
  // first case is for jsdom
  while (typeof elem.contentEditable === 'undefined' || elem.contentEditable == 'inherit') {
    elem = elem.parentNode;
    if (!elem) {
      return false;
    }
  }

  return elem.contentEditable == 'true';
};

exports.isElemType = function(elem, str) {
  return elem.tagName.toLowerCase() === str.toLowerCase();
};

/**
 * returns:
 *   'parent' - if node1 is parent of node2
 *   'child'  - if node1 is child of node2
 *   'before' - if node1 is before node2
 *   'after'  - if node1 is after node2
 *   'same'   - if node1 is node2
 *   assertion error - if nodes are not in same tree
 */
// TODO: maybe use compareDocumentPosition
exports.compareNodes = function(node1, node2) {
  var path1 = nodePath(node1);
  var path2 = nodePath(node2);

  assert(path1.length > 0 && path2.length > 0 && path1[0] === path2[0],
      'Nodes not attached to same tree, incomparable', node1, node2);

  var currentParent = path1[0];

  var moreThanEnough = path1.length + path2.length;

  for (var i = 1; i < moreThanEnough; i++) {
    var n1 = path1[i];
    var n2 = path2[i];

    if (!n1 && !n2) {
      return 'same';
    }

    if (!n1) {
      return 'parent';
    }

    if (!n2) {
      return 'child';
    }

    if (n1 != n2) {
      for (var n = currentParent.firstChild; n; n = n.nextSibling) {
        if (n === n1) {
          return 'before';
        }
        if (n === n2) {
          return 'after';
        }
      }
      assert(false);
    }

    assert(n1 === n2);
    currentParent = n1;
  };

  assert(false);
};

var nodePath = exports.nodePath = function(node) {
  assert(node);

  var path = [];
  while (node) {
    path.unshift(node);
    node = node.parentNode;
  }

  return path;
};

exports.addClass = function(elem, klass) {
  elem.className += ' ' + klass;
};

exports.removeClass = function(elem, klass) {
  elem.className = elem.className.replace(new RegExp(' *' + klass + ' *'), ' ');
};

// TODO: Get rid of this wnd parameter threading,
// and make a util class that contains wnd as a member var.
exports.isBlock = function(elem, wnd) {
  styles = exports.computedStyle(elem, wnd);
  return styles.display === 'block' || styles.display === 'list-item';
};

/**
 * wnd - optional arg to override window, for testing. not ideal but meh.
 */
exports.computedStyle = function(elem, wnd) {
  if (!wnd) {
    wnd = window;
  }

  return elem.currentStyle || wnd.getComputedStyle(elem, "");
};

exports.removeNode = function(node) {
  if (!node || ! node.parentNode) {
    return;
  }

  node.parentNode.removeChild(node);
};

exports.rateLimited = function(intervalMillis, func) {
  if (!intervalMillis || intervalMillis < 0) {
    intervalMillis = 0;
  }

  var scheduled = false;
  var lastScheduled = 0;

  function run() {
    scheduled = false;
    func();
  }

  function schedule() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    var now = Date.now();
    var earliest = lastScheduled + intervalMillis;
    var delay = earliest > now ? earliest - now : 0;

    lastScheduled = now + delay;

    setTimeout(run, delay);
  };

  return schedule;
};

/**
 * Checks if elem is 'open', i.e. would have non-zero height (a completely empty
 * paragraph has zero height, unless held 'open' by some text or an element)
 */
exports.isOpen = function(elem) {
  if (elem.textContent.trim().length > 0) {
    return true;
  }
  // Check last child node for <br> tag, which opens the element but doesn't
  // show in textContent check
  if (elem.lastElementChild && elem.lastElementChild.tagName === "BR") {
    return true;
  }

  return false;

};

/**
 * If elem is not 'open' inserts <br>
 */
exports.ensureOpen = function(elem) {
  if (!this.isOpen(elem)) {
    elem.appendChild(document.createElement('br'));
  }
  return;
};

/**
 * Ensure elem has only one <br> tag.
 */
exports.cleanOpenElem = function(elem) {
  for (i = elem.childNodes.length - 1; i >= 0; i--) {
    if (elem.childNodes[i].tagName === 'BR') {
      elem.removeChild(elem.childNodes[i]);
    }
  }
  this.ensureOpen(elem);
  return;
};

/**
 * Given a point, removes any br tags in the containing element and moves the
 * point as necessary for any removed nodes.
 */
exports.removeBrTags = function(point) {
  currNode = point.node.parentNode.firstChild;
  while (currNode != null) {
    // We remove nodes with BR tag name
    if (currNode.tagName === 'BR') {
      // However if we're at the node we're currently pointing to, we need to
      // move
      if (currNode.isSameNode(point.node)) {
        if (currNode.nextSibling == null) {
          point.moveToEnd(currNode.parentNode);
        } else {
          point.moveToBefore(currNode.nextSibling);
        }
      }

      removeThis = currNode;
      currNode = currNode.nextSibling;
      removeThis.parentNode.removeChild(removeThis);
    } else {
      currNode = currNode.nextSibling;
    }
  }

  return;
}

exports.noop = function(){};

exports.map = function(arr, func) {
  var result = [];
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    result.push(func(arr[i]));
  }
  return result;
};
