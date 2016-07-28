var keycodes = require('./keycodes');

describe('Keycodes', function() {
  describe('computeKeyType', function() {
    var tests = [
    {
      input: {
        name: 'space',
        type: 'keydown'
      },
      computedType: 2
    },
    {
      input: {
        name: 'space',
        type: 'keyup'
      },
      computedType: 5
    },
    {
      input: {
        name: 'enter',
        type: 'keydown'
      },
      computedType: 3
    },
    {
      input: {
        name: 'backspace',
        type: 'keydown'
      },
      computedType: 1
    },
    {
      input: {
        name: 'up',
        type: 'keydown'
      },
      computedType: 4
    },
    {
      input: {
        name: 'control',
        type: 'keydown'
      },
      computedType: 5
    }
    ];

      it('should give the expected computed key type', function() {
        for (var idx in tests) {
          var test = tests[idx];
          var event = generateKeyEvent(test.input.name, test.input.type);

          expect(keycodes.computeKeyType(event)).toBe(test.computedType);
        }
      });
  });
});

var events = {
  'space': {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    code: 'Space',
    keyCode: 32,
    keyIdentifier: 'U+0020',
    keyType: 'typing',
    type: 'keydown',
    which: 32
  },
  'backspace': {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    code: 'Backspace',
    keyCode: 8,
    keyIdentifier: 'U+0008',
    keyType: 'backspace',
    type: 'keydown',
    which: 8
  },
  'enter': {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    code: 'Enter',
    keyCode: 13,
    keyIdentifier: 'Enter',
    keyType: 'typing',
    type: 'keydown',
    which: 13
  },
  'up': {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    code: 'ArrowUp',
    keyCode: 38,
    keyIdentifier: 'Up',
    keyType: 'typing',
    type: 'keydown',
    which: 38
  },
  'control': {
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    code: 'ControlLeft',
    keyCode: 17,
    keyIdentifier: 'Control',
    keyType: 'typing',
    type: 'keydown',
    which: 17
  }
};

var generateKeyEvent = function generateKeyEvent(keyName, keyType) {
  if (!keyType) {
    keyType = 'keydown';
  }

  var event = events[keyName];
  event.preventDefault = function() {};
  event.type = keyType;

  return event;
};