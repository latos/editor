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

      var point1 = Point.start(p);
      var point2 = Point.text(t, 1);
      var point3 = Point.text(t, 2);
      var point4 = Point.text(t, 3);
      var point5 = Point.after(i);
      var point6 = Point.before(b);

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

