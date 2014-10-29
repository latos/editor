var util = require('./util');
var EventBus = require('./event-bus');
var EventExpander = require('./editing-events');
var Selection = require('./selection');

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
  var expander = new EventExpander(bus);

  var selection = new Selection(window.getSelection());

  /**
   * The editor's selection helper
   *
   * See the Selection class for details.
   */
  me.selection = function() {
    return selection;
  };
  
  /**
   * Attaches the editor to an element
   */
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

  /**
   * Detaches the editor from its element
   */
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

  /**
   * true if the editor is currently attached
   */
  me.attached = function() {
    return currentElem !== null;
  };

  /**
   * The element the editor is currently attached to (or null)
   */
  me.currentElem = function() {
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
}



