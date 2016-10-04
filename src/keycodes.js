// Knicking some of the codes from Google wave-protocol
module.exports.codes = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  CONTEXT_MENU: 16,
  CONTROL: 17,
  ALT: 18,
  ESC: 27,
  SPACE: 32,
  PAGEUP: 33,
  PAGEDOWN: 34,
  END: 35,
  HOME: 36,
  LEFT : 37,
  UP : 38,
  RIGHT: 39,
  DOWN: 40,
  DELETE: 46,
  META: 91
};

module.exports.types = {
  DELETE: 1,
  INPUT: 2,
  ENTER: 3,
  NAVIGATION: 4,
  NOEFFECT: 5
}

// Returns true for a navigation key
var isNavigationKeyCode = function (key) {
  me = module.exports;
  return key >= me.codes.PAGEUP && key <= me.codes.DOWN;
}

var metaPressed = function (e) {
  return e.ctrlKey || e.altKey || e.metaKey;
}

// Given a keydown event, calculate the type of key that was pressed
module.exports.computeKeyType = function (e) {
  keycode = e.which !== null ? e.which : e.keyCode;
  me = module.exports;

  // Backspace/Delete
  if (keycode === me.codes.BACKSPACE || keycode === me.codes.DELETE) {
    type = me.types.DELETE;
  // Navigation
  } else if (isNavigationKeyCode(keycode)) {
    type = me.types.NAVIGATION;
  // Enter
  } else if (keycode === me.codes.ENTER) {
    type = me.types.ENTER;
  // No effect on some key types, otherwise input
  } else {
    switch (keycode) {
      case me.codes.CONTEXT_MENU:
      case me.codes.CONTROL:
      case me.codes.ALT:
      case me.codes.ESC:
      case me.codes.META:
        type = me.types.NOEFFECT;
        break;
      default:
        if (e.type && e.type === 'keydown' && !metaPressed(e)) {
          type = me.types.INPUT;
        } else {
          type = me.types.NOEFFECT;
        }
        break;
    };
  }

  return type;
};
