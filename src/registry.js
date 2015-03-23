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
  // Accepts dom elements. If given a text node, will just return empty fleet.
  me.busFleetFor = function(node) {
    var fleet = [];

    // Ideally we would only accept elements, but to be generous and flexible
    // with points inside text nodes we return gracefully for text nodes.
    if (node.nodeType === 3) {
      return [];
    } else {
      assert(node.nodeType === 1);
      var tag = node.tagName.toUpperCase();
      if (node[PROP]) {
        fleet.push(node[PROP]);
      }
      if (tagHandlers[tag]) {
        fleet.push(tagHandlers[tag]);
      }
    }

    return fleet;
  };
};
