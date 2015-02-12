var util = require('./util');
var assert = util.assert;
var Point = require('./point');
var tutil = require('./test-util');

var domrange = tutil.domrange;
var promised = tutil.promised;

describe('domrange', function() {
  it('should extract simple ranges', promised(function() {
    return domrange('<p><i>[sup]</i></p>', function(elem, range) {
      var p = elem;
      var i = elem.firstChild;
      var t = i.firstChild;

      expectEquivalent(Point.text(t, 0), range.anchor);
      expectEquivalent(Point.text(t, 3), range.focus);
    })
  }));

  it('should extract collapsed ranges', promised(function() {
    return domrange('<p><i>s|up</i></p>', function(elem, range) {
      var p = elem;
      var i = elem.firstChild;
      var t = i.firstChild;

      expectEquivalent(Point.text(t, 1), range.anchor);
      expectEquivalent(Point.text(t, 1), range.focus);
    })
  }));

  it('should extract ranges across elements', promised(function() {
    return domrange('<p><i>s[up</i><b>]x</b></p>', function(elem, range) {
      var p = elem;
      var i = elem.firstChild;
      var t1 = i.firstChild;
      var b = elem.lastChild;
      var t2 = b.lastChild;

      expectEquivalent(Point.text(t1, 1), range.anchor);
      expectEquivalent(Point.text(t2, 0), range.focus);
    })
  }));

  it('should extract ranges inside empty elements', promised(function() {
    return domrange('<p><i>[</i><b>]</b></p>', function(elem, range) {
      var p = elem;
      var i = elem.firstChild;
      var b = elem.lastChild;

      // Check there were not any junk nodes (e.g. zero len text nodes) left
      expect(i.firstChild).toBe(null);
      expect(b.firstChild).toBe(null);

      expectEquivalent(Point.start(i), range.anchor);
      expectEquivalent(Point.start(b), range.focus);
    })
  }));

  it('should extract ranges across elements', promised(function() {
    return domrange('<p>ab[c<i>s]up</i></p>', function(elem, range) {

      var p = elem;
      var i = elem.lastChild;
      var t1 = elem.firstChild;
      var t2 = i.firstChild;

      expectEquivalent(Point.text(t1, 2), range.anchor);
      expectEquivalent(Point.text(t2, 1), range.focus);
    })
  }));

  it('should allow multiple elements in adjacently with no other text', promised(function() {
    return domrange('<div>[]</div>', function(elem, range) {

      var div = elem;

      expectEquivalent(Point.start(div), range.anchor);
      expectEquivalent(Point.start(div), range.focus);
    })
  }));

  it('should extract ranges around element boundaries', promised(function() {
    return domrange('<div>[<p>]</p></div>', function(elem, range) {

      var div = elem;
      var p = elem.firstChild;

      assert(p.nodeType === 1);

      expectEquivalent(Point.start(div), range.anchor);
      expectEquivalent(Point.start(p), range.focus);
    })
  }));
});

function expectEquivalent(point1, point2) {
  expect(point1.compare(point2)).toBe(0);
}

