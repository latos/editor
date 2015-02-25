var _ = require('lodash');
var util = require('./util');
var assert = util.assert;
var InlineDecorator = require('./inline-decorator');
var tutil = require('./test-util');
var Point = require('./point');
var Q = require('q');

describe('InlineDecorator', function() {
  var testCases = [
    ['|', {}],
    ['|a', {}],
    ['a|', {}],
    ['[a]', {}],

    ['<b>|</b>', {'font-weight':['bold']}],
    ['<b>|a</b>', {'font-weight':['bold']}],
    ['<b>a|</b>', {'font-weight':['bold']}],
    ['<b>[a]</b>', {'font-weight':['bold']}],

    ['<p>a|bc<i>sup</i></p><p>hello<b>sup</b></p>', {}],
    ['<p>abc<i>|sup</i></p><p>hello<b>sup</b></p>', {'font-style':['italic']}],
    ['<p>abc<i>sup</i></p><p>hello<b>|sup</b></p>', {'font-weight':['bold']}],
    ['<p>ab[c<i>s]up</i></p><p>hello<b>sup</b></p>', {'font-style':['italic','normal']}],
    ['<p>ab[c<i>sup</i></p><p>hello<b>s]up</b></p>', {'font-style':['italic','normal'], 'font-weight':['bold','normal']}],
    ['<p>|</p>', {}],

    ['<p><a href="http://www.google.com">L|ink</a> there.</p>', {'href':['http://www.google.com/']}]

  ];

  it('getRangeAttributes', tutil.promised(function() {
    return tutil.rangeCases(testCases, function(elem, range, expected) {

      // So decorator thinks it's in an editor
      elem.contentEditable = 'true';

      assert(elem.$wnd);

      var idec = new InlineDecorator(elem.$wnd);

      var fullExpected = expandWithDefaults(expected, idec.getDefaults());
      var attrs = idec.getRangeAttributes(range);

      sortArrays(attrs);
      sortArrays(fullExpected);

      expect(attrs).toEqual(fullExpected);
    }, function wrap(testContent) {
      return '<div contentEditable="true">' + testContent + '</div>';
    });
  }));

});

function sortArrays(mapOfArrays) {
  for (var k in mapOfArrays) {
    mapOfArrays[k].sort();
  }
}

/**
 * Expands the given attrs to encompass the full set of keys with at least
 * one value for each key, given the defaults.
 */
function expandWithDefaults(attrs, defaults) {

  var filled = _.assign({}, attrs);
  for (var k in defaults) {
    if (!filled[k]) {
      filled[k] = [];
    }
    if (filled[k].length === 0 && defaults[k] !== null) {
      filled[k].push(defaults[k]);
    }
  }

  return filled;
}
