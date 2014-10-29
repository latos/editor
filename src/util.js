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
 * returns:
 *   'parent' - if node1 is parent of node2
 *   'child'  - if node1 is child of node2
 *   'before' - if node1 is before node2
 *   'after'  - if node1 is after node2
 *   'same'   - if node1 is node2
 *   assertion error - if nodes are not in same tree
 */
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

exports.isBlock = function(elem) {
  return computedStyle(elem).display === 'block';
};

exports.computedStyle = function(elem) {
  return elem.currentStyle || window.getComputedStyle(elem, ""); 
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

exports.noop = function(){};
