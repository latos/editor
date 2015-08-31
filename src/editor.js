var util = require('./util');
var EventBus = require('./event-bus');
var EventRouter = require('./event-router');
var Selection = require('./selection');
var Registry = require('./registry');

/**
 * Editor class
 *
 * An editor may be attached to any DOM element, which will
 * then become editable.  When the editor is detached, the element
 * will cease to be editable.
 *
 * The editor emits a rich set of events which can be handled
 * specially by users.
 */
module.exports = function Editor() {
  var me = this;

  var currentElem = null;

  var bus = new EventBus();

  var selection = new Selection(window.getSelection(), me);

  var registry = new Registry(bus);

  var router = new EventRouter(getCurrentElem, registry, selection);

  /**
   * The editor's selection helper
   *
   * See the Selection class for details.
   */
  me.selection = function() {
    return selection;
  };

  var detacher;

  /**
   * Attaches the editor to an element
   */
  me.attach = function(elem) {
    me.detach();

    currentElem = elem;
    elem.contentEditable = true;
    elem.style.outline = 'none';

    detacher = attachHandlers(elem, router.handlers);

    bus.post('attached');
  };

  /**
   * Detaches the editor from its element
   */
  me.detach = function() {
    if (!currentElem) {
      return;
    }

    assert(detacher);

    detacher();

    currentElem.contentEditable = 'inherit';
    bus.post('detached');

    currentElem = null;
  };

  /**
   * true if the editor is currently attached
   */
  me.attached = function() {
    return currentElem !== null;
  };

  /**
   * The element the editor is currently attached to (or null)
   */
  me.currentElem = getCurrentElem;
  function getCurrentElem() {
    return currentElem;
  };

  /**
   * Focus the editor, put the cursor in it.
   */
  me.focus = function() {
    if (!currentElem) {
      return;
    }

    currentElem.focus();
  };


  /** See EventBus.on */
  me.on = bus.on;

  /** See EventBus.addListener */
  me.addListener = bus.addListener;

  /** Exposing registry **/
  me.registry = registry;

  // -- private -- //

  /**
   * Registers a map of handlers to an element after wrapping each one,
   * and returns a function for unregistering them.
   */
  function attachHandlers(elem, handlerMap) {
    var registered = {};

    for (var type in handlerMap) {
      var wrapped = registered[type] = wrapHandler(handlerMap[type]);
      elem.addEventListener(type, wrapped);
    }

    return function() {
      for (var type in registered) {
        elem.removeEventListener(type, registered[type]);
      }
    };
  }

  function wrapHandler(func) {
    return function(ev) {
      beforeEvent();
      try {
        func(ev);

        // TODO: error handling
      } finally {
        afterEvent();
      }
    };
  }

  // TODO: use these to cache things like selection, for optimisation.
  function beforeEvent() {
  }

  function afterEvent() {
  }
}



