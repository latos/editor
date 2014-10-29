var util = require('./util');
var EventBus = require('./event-bus');
var EventExpander = require('./event-expander');
var Selection = require('./selection');

module.exports = function Editor() {
  var me = this;

  var currentElem = null;

  var bus = new EventBus();
  var expander = new EventExpander(bus);

  var selection = new Selection(window.getSelection());

  me.selection = function() {
    return selection;
  };
  
  me.attach = function(elem) {
    me.detach();

    currentElem = elem;
    elem.contentEditable = true;
    elem.style.outline = 'none';

    for (var type in expander.handlers) {
      elem.addEventListener(type, expander.handlers[type]);
    }

    bus.post('attached');
  };

  me.detach = function() {
    if (!currentElem) {
      return;
    }

    for (var type in expander.handlers) {
      currentElem.removeEventListener(type, expander.handlers[type]);
    }

    currentElem.contentEditable = '';
    bus.post('detached');

    currentElem = null;
  };

  me.attached = function() {
    return currentElem !== null;
  };

  me.currentElem = function() {
    return currentElem;
  };

  me.focus = function() {
    if (!currentElem) {
      return;
    }

    currentElem.focus();
  };


  me.on = bus.on;
  me.addListener = bus.addListener;
}



