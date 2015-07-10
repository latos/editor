// Knicking some of the codes from Google wave-protocol
module.exports.codes = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  ESC: 27,
  SPACE: 32,
  LEFT : 37,
  UP : 38,
  RIGHT: 39,
  DOWN: 40,
  DELETE: 46
};

module.exports.types = {
  DELETE: 0,
  INPUT: 1,
  ENTER: 2,
  NAVIGATION: 3,
  NOEFFECT: 4
}

// Returns true for a navigation key
isNavigationKeyCode = function (key) {
  me = module.exports;
  return key >= me.codes.LEFT && key <= me.codes.DOWN;
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
  // Input
  } else if ((e.keyIdentifier && e.keyIdentifier.match("^U\+")) || (e.type && e.type === 'keydown')) {
    type = me.types.INPUT;
  // No effect
  } else {
    type = me.types.NOEFFECT;
  }

  return type;
};
