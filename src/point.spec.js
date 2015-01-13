var Point = require('./point');
var tutil = require('./test-util');

var dom = tutil.dom;
var promised = tutil.promised;

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
    return dom('<p><i>sup</i><b>blah</b><span></span></p>', function(elem) {
      var p = elem;
      var i = p.firstChild;
      var t = i.firstChild;
      var b = i.nextSibling;
      var s = p.lastChild;

      expect(Point.start(p).elemStartingAt()).toBe(p);
      expect(Point.end(p).elemStartingAt()).toBe(null);
      expect(Point.before(i).elemStartingAt()).toBe(p);
      expect(Point.before(t).elemStartingAt()).toBe(i);
      expect(Point.text(t, 0).elemStartingAt()).toBe(i);
      expect(Point.text(t, 1).elemStartingAt()).toBe(null);
      expect(Point.after(i).elemStartingAt()).toBe(null);
      expect(Point.before(b).elemStartingAt()).toBe(null);
      expect(Point.start(s).elemStartingAt()).toBe(s);
      expect(Point.end(s).elemStartingAt()).toBe(s);

      expect(Point.start(p).elemEndingAt()).toBe(null);
      expect(Point.end(p).elemEndingAt()).toBe(p);
      expect(Point.after(s).elemEndingAt()).toBe(p);
      expect(Point.start(s).elemEndingAt()).toBe(s);
      expect(Point.end(s).elemEndingAt()).toBe(s);
      expect(Point.text(t, 0).elemEndingAt()).toBe(null);
      expect(Point.text(t, 2).elemEndingAt()).toBe(null);
      expect(Point.text(t, 3).elemEndingAt()).toBe(i);
      expect(Point.after(b.firstChild).elemEndingAt()).toBe(b);
    });
  }));

  it('should split at a point', promised(function(){
    return dom('<p>stuff<b>Here<i>good</i>things</b>and things here</p>', function(elem) {
      var stuff = elem.firstChild
      var b = stuff.nextSibling
      var here = b.firstChild
      var i = here.nextSibling 
      
      var point = Point.text(here, 1);
      point.splitRight();
      expect( b.innerHTML ).toBe("H");
      var createdB = b.nextSibling;
      expect( createdB.nodeType ).toBe(1);
      expect( createdB.tagName ).toBe('B');
      expect( point.node ).toBe( createdB );
      expect( point.type ).toBe('before');
      
    });
  }));

  it('should split at a point (left bias)', promised(function(){
    return dom('<p>stuff<b>Here<i>good</i>things</b>and things here</p>', function(elem) {
      var stuff = elem.firstChild
      var b = stuff.nextSibling
      var here = b.firstChild
      var i = here.nextSibling 
      
      var point = Point.text(here, 1);
      point.splitLeft();
      expect( b.innerHTML ).toBe("ere<i>good</i>things");
      var createdB = b.previousSibling;
      expect( createdB.nodeType ).toBe(1);
      expect( createdB.tagName ).toBe('B');
      expect( point.node ).toBe( createdB );
      expect( point.type ).toBe('after');
      
    });
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

