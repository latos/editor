'use strict';

module.exports = function EventBus() {
  var me = this;

  var handlers = {};

  me.on = function(name, handler) {
    if (!handlers[name]) {
      handlers[name] = [];
    }

    if (handlers[name].indexOf(handler) >= 0) {
      return;
    }
    
    handlers[name].push(handler);
  };

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

  me.post = function(name, data) {
    var list = handlers[name];
    if (!list) {
      return false;
    }

    for (var i = 0; i < list.length; i++) {
      var handled = list[i](name, data);
      if (handled) {
        return true;
      }
    }

    return false;
  };
};
