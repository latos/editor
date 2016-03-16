var Point = require('./point');
var tutil = require('./test-util');

var dom = tutil.dom;
var domrange = tutil.domrange;

var promised = tutil.promised;

describe('Range Iterator', function() {
  it('does not alter the range', promised(function() {
    return tutil.rangeCases([
      '|',
      '[abc]',
      '<p>[</p>]',
      '[<p>]</p>'
    ], function(elem, range) {
      var copy = range.copy();

      var it = range.iterateRight();

      it.skipText();
      it.leaveElement();
      it.enterElement();

      expect(range.isEquivalentTo(copy)).toBe(true);
    });
  }));

  it('should terminate immediately when collapsed', promised(function() {
    return tutil.rangeCases([
      '|',
      '<p>|</p>',
      '<p>a|</p>',
      '<p>|b</p>',
      '<p>a|b</p>',
    ], function(elem, range) {
      expect(range.iterateRight().isAtEnd()).toBe(true);
    });
  }));

  it('should not be at end when not collapsed', promised(function() {
    return tutil.rangeCases([
      '[a]',
      '<p>[</p>]',
      '[<p>]</p>',
      '[<p>x]</p>',
    ], function(elem, range) {
      expect(range.iterateRight().isAtEnd()).toBe(false);
    });
  }));

  it('should skip text to the end', promised(function() {
    return tutil.rangeCases([
      '[ab]',
      '<b></b>[ab]',
      '[ab]<b></b>',
    ], function(elem, range) {
      // so we can safely munge up the text nodes
      range = range.outwardNormalized();

      var it = range.iterateRight();
      expect(it.skipText()).not.toBe(null);
      expect(it.isAtEnd()).toBe(true);

      range.getStart().nodeAfter().splitText(1)

      // check it skips over multiple text nodes
      var it = range.iterateRight();
      expect(it.skipText()).not.toBe(null);
      expect(it.isAtEnd()).toBe(true);
    });
  }));

  it('should skip text to the end 2', promised(function() {
    return tutil.rangeCases([
      '[ab]xy',
      'xy[ab]',
      'wx[ab]yz',
    ], function(elem, range) {
      // so we can safely munge up the text nodes
      range = range.outwardNormalized();

      var it = range.iterateRight();
      expect(it.skipText()).not.toBe(null);
      expect(it.isAtEnd()).toBe(true);

    });
  }));

  it('should skip text', promised(function() {
    return tutil.rangeCases([
      'xy[ab<b>cd]</b>',
    ], function(elem, range) {
      // so we can safely munge up the text nodes
      range = range.outwardNormalized();

      var it = range.iterateRight();
      expect(it.skipText().length).toBe(2);
      expect(it.point.nodeAfter()).toBe(elem.lastChild);
      expect(it.isAtEnd()).toBe(false);

    });
  }));


  // todo: lots more tests.


});

function expectBefore(point1, point2) {
  expect(point1.compare(point2)).toBeLessThan(0);
}
function expectAfter(point1, point2) {
  expect(point1.compare(point2)).toBeGreaterThan(0);
}
function expectEquivalent(point1, point2) {
  expect(point1.compare(point2)).toBe(0);
}

