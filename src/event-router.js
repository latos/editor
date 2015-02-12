'use strict';

var util = require('./util');
var keycodes = require('./keycodes');
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
      point = point.copy();
      var count = 0;
      while (true) {
        if (count++ > 100) {
          throw new Error("Coudn't resolve bubbling");
        }
        var next = bubblers[dir](point);

        var handled = handleEvent(registry.handlerFor(point.node),
            'key', decorateKeyEvent(e, info.type, point));

        if (handled || !next) {
          return handled;
        }

        // check in case the dom has changed as a result of the handler.
        // the handler *should* have returned true in that case, but
        // it could also be buggy, so...
        if (!isAttached(next.node)) {
          console.warn("node for next point no longer attached - " + 
              "handler needs to be fixed to return true!");
          return true;
        }

        point = next;
      }
    } else {
      var node = point.node;
      while (true) {
        if (count++ > 100) {
          throw new Error("Coudn't resolve bubbling");
        }

        var next = node.parentNode;
        next = isAttached(next) ? next : null;

        var handled = handleEvent(registry.handlerFor(node),
            'key', decorateKeyEvent(e, info.type, point));

        if (handled || !next) {
          return handled;
        }
        
        if (!isAttached(next)) {
          console.warn("node for next point no longer attached - " + 
              "handler needs to be fixed to return true!");
          return true;
        }

        node = next;
      }

      return false;
    }
  }

  function handleRangedKeydown(e, range) {
    return;
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
    })
  };

  // Logical directions (within the dom)
  var BUBBLE_UP = 'up';
  var BUBBLE_LEFT = 'left';
  var BUBBLE_RIGHT = 'right';

  var KEY_INFO = {};
  KEY_INFO[keycodes.LEFT] =      keyInfo(BUBBLE_LEFT, 'left');
  KEY_INFO[keycodes.BACKSPACE] = keyInfo(BUBBLE_LEFT, 'backspace');

  KEY_INFO[keycodes.RIGHT] =     keyInfo(BUBBLE_RIGHT, 'right');
  KEY_INFO[keycodes.DELETE] =    keyInfo(BUBBLE_RIGHT, 'delete');

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
  return null;
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
  return null;
}


