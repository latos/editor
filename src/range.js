var Point = require('./point');
module.exports = Range;

Range.collapsed = function(point) {
  return new Range(point, point);
};

/**
 * A pair of Points, representing a range.
 */
function Range(anchor, focus) {
  this.anchor = Point.check(anchor);
  this.focus = Point.check(focus);
};

Range.prototype.isCollapsed = function() {
  return this.anchor.isEquivalentTo(this.focus);
};

Range.prototype.copy = function() {
  return new Range(this.anchor, this.focus);
};

/**
 * True if the focus comes after (or is equivalent to) the anchor.
 */
Range.prototype.isOrdered = function() {
  return this.anchor.compare(this.focus) <= 0;
};

Range.prototype.order = function() {
  if (!this.isOrdered()) {
    var tmp = this.focus;
    this.focus = this.anchor;
    this.anchor = tmp;
  }

  return this;
};
