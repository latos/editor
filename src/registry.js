'use strict';

var EventBus = require('./event-bus');

var PROP = '$qeh';

module.exports = function Registry(defaultBus) {
  var me = this;

  me.addElemHandler = function(elem, handler) {
    var bus = elem[PROP] = new EventBus();
    // TODO: cache event bus wrappers or avoid using bus wrappers.
    bus.addListener(handler);
  };

  me.defaultHandler = function() {
    return defaultBus;
  };

  // TODO: extendable handlers by tag names,
  //       other attributes, whether elem is block or not, etc.
  me.handlerFor = function(elem) {
    return elem[PROP] || defaultBus;
  };
};
