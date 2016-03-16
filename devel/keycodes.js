var EventBus = require('../src/event-bus');
var Registry = require('../src/registry');
var Selection = require('../src/selection');
var EventRouter = require('../src/event-router');

window.onload = function() {
  var bus = new EventBus();
  var registry = new Registry(bus);
  var selection = new Selection(getElem);
  var router = new EventRouter(getElem, registry, selection);

  bus.addListener({
    onKey: handler,
    onRangedKey: handler
  });

  // The editor keycodes module
  var keycodes = require('../src/keycodes');

  var codes = keycodes.codes;
  var types = keycodes.types;

  var textarea = $('editor');
  var output = $('output-box');

  for (var type in router.handlers) {
    textarea.addEventListener(type, router.handlers[type]);
  }

  textarea.focus();

  function handler(e) {
    // Calculate codes and detect if we recognise it
    var typeCode = keycodes.computeKeyType(e);

    var typeName = getTypeName(typeCode);

    // Create a log element
    var logElem = document.createElement('P');
    logElem.innerHTML = e.keyType + ' ' + computeKey(e.which || e.keyCode) + ' ' + typeCode + ' ' + typeName;
    if (output.firstChild) {
      output.insertBefore(logElem, output.firstChild);
    } else {
      output.appendChild(logElem);
    }

  };

  function computeKey(keyCode) {
    for (var keyName in codes) {
      if (codes[keyName] === keyCode) {
        return keyName;
      }
    }

    return 'Unmapped key';
  };

  function getTypeName(typeCode) {
    for (var typeName in types) {
      if (types[typeName] === typeCode) {
        return typeName;
      }
    }

    return 'Bad key type number';
  };

  function getElem() {
    return $('editor');
  }

  function $(id) {
    return document.getElementById(id);
  };

};
