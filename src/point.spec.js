var jsdom = require('jsdom');
var Q = require('q');
var Point = require('./point');

describe('Point', function() {
  it('should construct well', promised(function() {
    return dom('<p><i>sup</i></p>', function(elem) {
      var p = elem;
      var i = elem.firstChild;
      var t = i.firstChild;

      var point;
      
      point = Point.text(elem.firstChild.firstChild, 2);
      expect(point.node).toBe(t);
      expect(point.offset).toBe(2);

      point = Point.start(p);
      expect(point.node).toBe(p);
      expect(point.offset).toBe(null);
    })
  }));

  it('should be comparable', promised(function() {
    return dom('<p><i>sup</i><b>blah</b></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = p.lastChild;

      expectBefore(Point.start(p), Point.text(t, 1));
      expectAfter(Point.text(t, 1), Point.start(p));
      expectEquivalent(Point.start(p), Point.before(i));
      expectEquivalent(Point.before(i), Point.start(p));
      expectEquivalent(Point.start(i), Point.before(t));
      expectEquivalent(Point.start(i), Point.text(t, 0));
      expectEquivalent(Point.before(t), Point.text(t, 0));

      expectBefore(Point.text(t, 0), Point.text(t, 1));
      expectBefore(Point.text(t, 1), Point.text(t, 2));
      expectBefore(Point.text(t, 2), Point.text(t, 3));
      expectEquivalent(Point.text(t, 2), Point.text(t, 2));
      expectEquivalent(Point.text(t, 3), Point.after(t));
      expectEquivalent(Point.text(t, 3), Point.end(i));

      expectEquivalent(Point.after(i), Point.before(b));
    })
  }));

  it('should detect element start and end', promised(function() {
    return dom('<p><i>sup</i><b>blah</b></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = p.lastChild;

      expect(Point.start(p).isAtElemStart()).toBe(true);
      expect(Point.before(i).isAtElemStart()).toBe(true);
      expect(Point.before(t).isAtElemStart()).toBe(true);
      expect(Point.text(t, 0).isAtElemStart()).toBe(true);
      expect(Point.text(t, 1).isAtElemStart()).toBe(false);
      expect(Point.after(i).isAtElemStart()).toBe(false);
      expect(Point.before(b).isAtElemStart()).toBe(false);
    })
  }));

  it('should detect element start and end', promised(function() {
    return dom('<p><i>sup</i><b>blah</b><span></span></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = i.nextSibling;
      var s = p.lastChild;

      expect(Point.start(p).isAtElemStart()).toBe(true);
      expect(Point.end(p).isAtElemStart()).toBe(false);
      expect(Point.before(i).isAtElemStart()).toBe(true);
      expect(Point.before(t).isAtElemStart()).toBe(true);
      expect(Point.text(t, 0).isAtElemStart()).toBe(true);
      expect(Point.text(t, 1).isAtElemStart()).toBe(false);
      expect(Point.after(i).isAtElemStart()).toBe(false);
      expect(Point.before(b).isAtElemStart()).toBe(false);
      expect(Point.start(s).isAtElemStart()).toBe(true);
      expect(Point.end(s).isAtElemStart()).toBe(true);

      expect(Point.start(p).isAtElemEnd()).toBe(false);
      expect(Point.end(p).isAtElemEnd()).toBe(true);
      expect(Point.after(s).isAtElemEnd()).toBe(true);
      expect(Point.start(s).isAtElemEnd()).toBe(true);
      expect(Point.end(s).isAtElemEnd()).toBe(true);
      expect(Point.text(t, 0).isAtElemEnd()).toBe(false);
      expect(Point.text(t, 2).isAtElemEnd()).toBe(false);
      expect(Point.text(t, 3).isAtElemEnd()).toBe(true);
    })
  }));

  it('should detect before/after elem/text', promised(function() {
    return dom('<p><i>sup</i><b>blah</b><span></span></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = i.nextSibling;
      var s = p.lastChild;
      var t1 = b.firstChild;
      var t2 = b.firstChild.splitText(2);

      function expectRelatives(point, prev, next, textOffset) {
        var originalType = point.type;
        var originalNode = point.node;
        var originalOffset = point.offset;

        if (textOffset === undefined) {
          expect(point.nodeBefore()).toBe(prev);
          expect(point.nodeAfter()).toBe(next);

          expect(point.elemBefore()).toBe(prev && prev.nodeType == 1 ? prev : null);
          expect(point.elemAfter()).toBe(next && next.nodeType == 1 ? next : null);

          expect(point.hasTextBefore()).toBe(!!(prev && prev.nodeType == 3));
          expect(point.hasTextAfter()).toBe(!!(next && next.nodeType == 3));
        } else {
          expect(point.nodeBefore()).toBe(null);
          expect(point.nodeAfter()).toBe(null);

          expect(point.elemBefore()).toBe(null);
          expect(point.elemAfter()).toBe(null);

          expect(point.hasTextAfter()).toBe(true);
          expect(point.hasTextBefore()) .toBe(true);
        }

        // check the point wasn't mutated.
        expect(point.type).toBe(originalType);
        expect(point.node).toBe(originalNode);
        expect(point.offset).toBe(originalOffset);
      }

      expectRelatives(Point.start(p), null, i);
      expectRelatives(Point.before(i), null, i);
      expectRelatives(Point.start(i), null, t);
      expectRelatives(Point.before(t), null, t);
      expectRelatives(Point.text(t, 0), null, t);
      expectRelatives(Point.text(t, 1), null, null, 1);
      expectRelatives(Point.text(t, 3), t, null);
      expectRelatives(Point.after(t), t, null);
      expectRelatives(Point.after(i), i, b);
      expectRelatives(Point.after(t1), t1, t2);
      expectRelatives(Point.text(t1, 2), t1, t2);
      expectRelatives(Point.before(t2), t1, t2);
      expectRelatives(Point.text(t2, 0), t1, t2);
      expectRelatives(Point.start(s), null, null);
      expectRelatives(Point.end(s), null, null);
      expectRelatives(Point.end(p), s, null);
    })
  }));
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

function dom(html, func) {
  var deferred = Q.defer();

  jsdom.env({
      html: html, 
      done: function(err, win) { 
        if (err) {
          deferred.reject(err);
          return;
        }

        deferred.resolve(win.document.body.firstChild);
      }
  });

  return func ? deferred.promise.then(func) : deferred.promise;
}

function promised(func) {
  return function(done) {
    (func() || Q.resolve())
    .then(done)
    .catch(function(err) {
      done(err);
    })
  };
}

