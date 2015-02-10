'use strict';

var EventBus = require('./event-bus');
var util = require('./util');
var assert = util.assert;

var PROP = '$qeh';

module.exports = function Registry(defaultBus) {
  var me = this;

  var tagHandlers = {};

  me.addNodeHandler = function(elem, handler) {
    var bus = elem[PROP] || (elem[PROP] = new EventBus());
    bus.addListener(handler);
  };


  me.addTagHandler = function(tagName, handler) {
    tagName = tagName.toUpperCase();
    var bus = tagHandlers[tagName] || (tagHandlers[tagName] = new EventBus());
    bus.addListener(handler);
  };

  me.defaultHandler = function() {
    return defaultBus;
  };

  // TODO: extendable handlers by other attributes, whether elem is block or not, etc.
  me.busFor = function(elem) {
    assert(elem.nodeType === 1);
    var tag = elem.tagName.toUpperCase();

    return (
      elem[PROP]
      || tagHandlers[tag]
      || defaultBus
      );
  };
};
