'use strict';

var util = require('./util');
var keycodes = require('./keycodes');
var codes = keycodes.codes
var Point = require('./point');

var assert = util.assert;

/**
 * Expands regular DOM events into a richer set of high-level
 * semantic editing events that are more convenient to consume,
 * and routes them to the context-appropriate handler.
 */
var EventRouter = module.exports = function EventRouter(getRootElem, registry, selection) {
  var me = this;


  var scheduleContentChangeNotifier = util.rateLimited(100, function() {
    registry.defaultHandler().post('content');
  });

  var scheduleSelectionChangeNotifier = util.rateLimited(100, function() {
    registry.defaultHandler().post('selection', selection);
  });

  function wrap(func) {
    func = func || util.noop;

    return function(e) {
      if (func(e)) {
        return true;
      }

      return handleEvent(registry.defaultHandler(), e.type, e);
    };
  };

  function decorateKeyEvent(ev, keyType, point) {
    ev.keyType = keyType;
    ev.point = point;
    return ev;
  }

  function decorateRangedKeyEvent(ev, keyType, range) {
    ev.keyType     = keyType;
    ev.range       = range;
    ev.keyCategory = keycodes.computeKeyType(ev);
    return ev;
  }

  function isAttached(node) {
    return util.isOrHasChild(getRootElem(), node);
  }

  function handleEvent(handler, name, ev) {
    var ret = handler.post(name, ev);
    if (typeof ret !== 'boolean') {
      console.warn('handler return type was not boolean, instead got', ret,
          'for event', e);
    }

    return !!ret;
  }

  function handleCollapsedKeydown(e, point) {
    var info = getKeyInfo(e.keyCode);
    var dir = info.dir;

    if (dir !== 'up') {
      var currPoint = point.copy();
      var count = 0;
      while (true) {
        if (count++ > 100) {
          throw new Error("Couldn't resolve bubbling");
        }
        var next = bubblers[dir](currPoint);

        // Loop over the fleet of busses, return true if one of them handles it
        var fleet = registry.busFleetFor(currPoint.node);

        for (var bus in fleet) {
          var handled = handleEvent(fleet[bus], 'key', decorateKeyEvent(e, info.type, point));

          if (handled) {
            return handled;
          }
        }

        // If we reach editor node without handling, exit loop and use defaultBus
        if (!next) {
          break;
        }

        // Check in case the dom has changed as a result of the handler
        // The handler *should* have returned true in that case, but it could be
        // buggy
        if (!isAttached(next.node)) {
          console.warn("Node for next point no longer attached - " +
            "handler needs to be fixed to return true");
          return true;
        }

        currPoint = next;
      }
    } else {
      var node = point.node;
      var count = 0;
      while (true) {
        if (count++ > 100) {
          throw new Error("Couldn't resolve bubbling");
        }

        var next = node.parentNode;
        next = isAttached(next) ? next : null;

        var fleet = registry.busFleetFor(node);

        for (var bus in fleet) {
          var handled = handleEvent(fleet[bus], 'key', decorateKeyEvent(e, info.type, point));

          if (handled) {
            return handled;
          }
        }

        // If we reach editor node without handling, exit loop and use defaultBus
        if (!next) {
          break;
        }

        // Check if we have become unattached as a result of the handler
        // The handler *should* have returned true in that case, but it could be
        // buggy
        if (!isAttached(next)) {
          console.warn("Node for next point no longer attached - " +
            "handler needs to be fixed to return true");
          return true;
        }

        node = next;
      }
    }

    // If we are no longer in the loop, we've exhausted handlers except for the
    // defaultBus
    var handled = handleEvent(registry.defaultHandler(), 'key',
      decorateKeyEvent(e, info.type, point));
    return handled;
  }

  function handleRangedKeydown(e, range) {
    var info = getKeyInfo(e.keyCode);

    // We just send this directly to default bus as there isn't a specific
    // element to bubble up on
    var handled = handleEvent(registry.defaultHandler(), 'rangedkey',
      decorateRangedKeyEvent(e, info.type, range));
    if (!handled) {
      console.warn("No handlers handled rangedKeyDown event - handlers need to be fixed to return true");
    }

    return true;
  }

  me.handlers = {
    mousedown: wrap(function(e) {
      scheduleSelectionChangeNotifier();
    }),

    mouseup: wrap(function(e) {
      scheduleSelectionChangeNotifier();
    }),

    keydown: wrap(function(e) {
      scheduleSelectionChangeNotifier();

      var range = selection.getRange();
      if (!range) {
        e.preventDefault();
        return true;
      }

      if (range.isCollapsed()) {
        return handleCollapsedKeydown(e, range.focus);
      } else {
        return handleRangedKeydown(e, range);
      }
    }),

    keypress: wrap(function(e) {
      scheduleSelectionChangeNotifier();
    }),

    keyup: wrap(function(e) {
      scheduleSelectionChangeNotifier();
    }),

    input: wrap(function(e) {
      scheduleContentChangeNotifier();
      scheduleSelectionChangeNotifier();
      return false;
    }),

    focus: wrap(function(e) {
      scheduleSelectionChangeNotifier();
    }),
    blur: wrap(function(e) {
      scheduleSelectionChangeNotifier();
    }),
    compositionstart: wrap(),
    compositionend: wrap(),
    DOMSubtreeModified: wrap(function(e) {
      scheduleContentChangeNotifier();
    }),
    paste: wrap(),
    copy: wrap(),
    cut: wrap()
  };

  // Logical directions (within the dom)
  var BUBBLE_UP = 'up';
  var BUBBLE_LEFT = 'left';
  var BUBBLE_RIGHT = 'right';

  var KEY_INFO = {};
  KEY_INFO[codes.LEFT] =      keyInfo(BUBBLE_LEFT, 'left');
  KEY_INFO[codes.BACKSPACE] = keyInfo(BUBBLE_LEFT, 'backspace');

  KEY_INFO[codes.RIGHT] =     keyInfo(BUBBLE_RIGHT, 'right');
  KEY_INFO[codes.DELETE] =    keyInfo(BUBBLE_RIGHT, 'delete');

  ///**
  // * {point:, next:}
  // *
  // * point is in the correct type form (start, before, after, end)
  // * for applying a directional (left/right) event to its element.
  // *
  // * if there is no contextual element to apply a directional event
  // * to, then the point will be in 'text' form.
  // *
  // *
  // * where elem is the element in question, and
  // * relation is the point based relation to the element
  // * next is the next point to try in the bubble sequence.
  // *
  // * elem may be null if nothing to do here.
  // * next may be null if nowhere to go next.
  // */
  //function bubbleStep(relation, elem, nextPoint) {
  //  return {
  //    relation: relation,
  //    elem:     elem,
  //    next:     nextPoint
  //  };
  //}

  var bubblers = {
    left: bubbleLeft,
    right: bubbleRight
  };

  /**
   * Alters the given point such that:
   * - if there is a contextual element to apply a directional (left/right)
   *   event, then it will be of the form (start, before, after, end) relative
   *   to that element
   * - otherwise, it will be in text form.
   *
   * returns the next point to investigate in the bubble direction.
   */
  function bubbleLeft(point) {
    var next = EventRouter.bubbleLeft(point);

    // Don't bubble out of our editing region.
    if (isTerminal(point.node)) {
      return null;
    }

    return next;
  }


  function bubbleRight(point) {
    var next = EventRouter.bubbleRight(point);

    // Don't bubble out of our editing region.
    if (isTerminal(point.node)) {
      return null;
    }

    return next;
  }


//  // TODO: bubble back into elements if they are inline, etc.
//  function xbubbleLeft(point, func) {
//    var elem;
//
//    point = point.leftNormalized();
//
//    elem = point.elemStartingAt();
//    if (elem) {
//      if (func(point, 'start', elem)) {
//        return;
//      }
//      if (isTerminal(elem)) {
//        return;
//      }
//      return
//    } else {
//      elem = point.elemBefore();
//      if (func(point, 'before', elem)) {
//        return;
//      }
//    }
//
//    xxx todo
//    return bubbleLeft(point
//  }

  function isTerminal(elem) {
    return !util.isEditable(elem.parentNode);
  }

  function getKeyInfo(keyCode) {
    var info = KEY_INFO[keyCode];
    if (info) {
      return info;
    }

    return KEY_INFO[keyCode] = keyInfo(BUBBLE_UP, 'typing');
  }

  function keyInfo(bubbleDirection, keyType) {
    return {
      dir: bubbleDirection,
      type: keyType
    };
  }
};

// TODO: possibly replace bubble utility functions with range iterators

/**
 * Alters the given point such that:
 * - if there is a contextual element to apply a directional (left/right)
 *   event, then it will be of the form (start, before, after, end) relative
 *   to that element
 * - otherwise, it will be in text form.
 *
 * returns the next point to investigate in the bubble direction.
 */
EventRouter.bubbleLeft = function bubbleLeft(point) {
  var elem = point.elemStartingAt();
  if (elem) {
    point.moveToStart(elem);
    return Point.before(elem);
  }

  var node = point.nodeBefore();
  if (!node) {
    assert(point.offset > 0);
    return null;
  }

  if (node.nodeType === 1) {
    point.moveToAfter(node);
  } else {
    point.moveToTextEnd(node);
  }

  // directional bubbling doesn't traverse into nodes, only outwards.
  return Point.before(node);
}


EventRouter.bubbleRight = function bubbleRight(point) {
  var elem = point.elemEndingAt();
  if (elem) {
    point.moveToEnd(elem);
    return Point.after(elem);
  }

  var node = point.nodeAfter();
  if (!node) {
    assert(point.offset > 0);
    return null;
  }

  if (node.nodeType === 1) {
    point.moveToBefore(node);
  } else {
    point.moveToTextStart(node);
  }

  // directional bubbling doesn't traverse into nodes, only outwards.
  return Point.after(node);
}


