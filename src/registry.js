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
  me.busFleetFor = function(elem) {
    var fleet = [];

    if (elem.nodeType === 3) {
      if (elem[PROP]) {
        fleet.push(elem[PROP]);
      }
    } else {
      assert(elem.nodeType === 1);
      var tag = elem.tagName.toUpperCase();
      if (elem[PROP]) {
        fleet.push(elem[PROP]);
      }
      if (tagHandlers[tag]) {
        fleet.push(tagHandlers[tag]);
      }
    }

    return fleet;
  };
};
