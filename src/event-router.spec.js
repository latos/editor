var ER = require('./event-router');
var tutil = require('./test-util');
var Point = require('./point');

describe('EventRouter', function() {
  it('bubbleLeft', tutil.promised(function() {
    return tutil.dom('<p><i>sup</i><b>blah</b><span></span></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = i.nextSibling;
      var s = p.lastChild;
      var t1 = b.firstChild;
      var t2 = b.firstChild.splitText(2);

      function expectPoint(point, type, node, offset) {
        expect(point.type).toBe(type);
        expect(point.node).toBe(node);
        expect(point.offset).toBe(offset);
      }

      var point, next;

      point = Point.start(i);
      next = ER.bubbleLeft(point);
      expectPoint(point, 'start', i, null);
      expectEquivalent(next, Point.before(i));

      point = Point.text(t, 0);
      next = ER.bubbleLeft(point);
      expectPoint(point, 'start', i, null);
      expectEquivalent(next, Point.before(i));

      point = Point.text(t, 1);
      next = ER.bubbleLeft(point);
      expectPoint(point, 'text', t, 1);
      expect(next).toBe(null);

      point = Point.before(t1);
      next = ER.bubbleLeft(point);
      expectPoint(point, 'start', b, null);
      expectEquivalent(next, Point.before(b));

      point = next
      next = ER.bubbleLeft(point);
      expectPoint(point, 'after', i, null);
      expect(next).toBe(null);

      point = Point.before(b);
      next = ER.bubbleLeft(point);
      expectPoint(point, 'after', i, null);
      expect(next).toBe(null);

      point = Point.after(i);
      next = ER.bubbleLeft(point);
      expectPoint(point, 'after', i, null);
      expect(next).toBe(null);
    })
  }));

  it('bubbleRight', tutil.promised(function() {
    return tutil.dom('<p><i>sup</i><b>blah</b><span></span></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = i.nextSibling;
      var s = p.lastChild;
      var t1 = b.firstChild;
      var t2 = b.firstChild.splitText(2);

      function expectPoint(point, type, node, offset) {
        expect(point.type).toBe(type);
        expect(point.node).toBe(node);
        expect(point.offset).toBe(offset);
      }

      var point, next;

      point = Point.end(i);
      next = ER.bubbleRight(point);
      expectPoint(point, 'end', i, null);
      expectEquivalent(next, Point.after(i));

      point = Point.text(t, 3);
      next = ER.bubbleRight(point);
      expectPoint(point, 'end', i, null);
      expectEquivalent(next, Point.after(i));

      point = Point.text(t, 1);
      next = ER.bubbleRight(point);
      expectPoint(point, 'text', t, 1);
      expect(next).toBe(null);

      point = Point.after(t2);
      next = ER.bubbleRight(point);
      expectPoint(point, 'end', b, null);
      expectEquivalent(next, Point.after(b));
      expectEquivalent(next, Point.before(s));

      point = next
      next = ER.bubbleRight(point);
      expectPoint(point, 'before', s, null);
      expect(next).toBe(null);

      point = Point.after(b);
      next = ER.bubbleRight(point);
      expectPoint(point, 'before', s, null);
      expect(next).toBe(null);

      point = Point.before(s);
      next = ER.bubbleRight(point);
      expectPoint(point, 'before', s, null);
      expect(next).toBe(null);
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

