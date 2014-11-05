'use strict';

var util = require('./util');

/**
 * Expands regular DOM events into a richer set of high-level
 * semantic editing events that are more convenient to consume,
 * and routes them to the context-appropriate handler.
 */
module.exports = function EventRouter(bus) {
  var me = this;


  var scheduleChangeNotifier = util.rateLimited(100, function() {
    bus.post('change');
  });

  function wrap(func) {
    func = func || util.noop;

    return function(e) {
      if (func(e)) {
        return true;
      }

      return bus.post(e.type, e);
    };
  };

  me.handlers = {
    mousedown: wrap(function(e) {
    }),

    keydown: wrap(function(e) {
    }),
    keypress: wrap(function(e) {
    }),
    input: wrap(function(e) {
      scheduleChangeNotifier();
      return false;
    }),

    focus: wrap(),
    blur: wrap(),
    compositionstart: wrap(),
    compositionend: wrap()
  };
};
