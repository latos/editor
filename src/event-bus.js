'use strict';

/**
 * Event routing utility.
 *
 * Event handlers may return true, indicating they handled
 * an event in which case no further handlers will be called.
 */
module.exports = function EventBus() {
  var me = this;

  var handlers = {};

  /**
   * Add a listener function for the given named event.
   */
  me.on = function(name, handler) {
    if (!handlers[name]) {
      handlers[name] = [];
    }

    if (handlers[name].indexOf(handler) >= 0) {
      return;
    }
    
    handlers[name].push(handler);
  };

  /**
   * Adds a listener object that handles multiple events.
   *
   * The object's own properties will be traversed, looking
   * for methods starting with "on" - they will all be added
   * as listeners to their named event (e.g. "onChange" will
   " receive "change" events)
   */
  me.addListener = function(object) {
    for (var k in object) {
      (function(k) {
        if (k.match(/^on./)) {
          var name = k.substring(2).toLowerCase();
          me.on(name, function(dummy, data) {
            return object[k](data);
          });
        }
      })(k);
    }
  };

  /**
   * Posts an event with an optional data object.
   */
  me.post = function(name, data) {
    var list = handlers[name];
    if (!list) {
      return false;
    }

    for (var i = 0; i < list.length; i++) {
      var handled = list[i](name, data);
      
      if (typeof handled !== 'boolean') {
        console.warn('handler return type was not boolean, instead got', 
          handled, 'for event', name, data);
      }
      if (handled) {
        return true;
      }
    }

    return false;
  };
};
