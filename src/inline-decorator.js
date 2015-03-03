'use strict';

var util = require('./util');
var assert = util.assert;

/**
 * Inline styles & attributes utility
 *
 * wnd - optional arg to override window for testing
 */
module.exports = function InlineDecorator(wnd) {
  if (!wnd) {
    wnd = window;
  }

  var me = this;

  // TODO: Generalise the Registry class for use here.
  // Decide if we want to allow extensible attribute definitions,
  // or extensible element types, or both (kind of an m x n problem).
  // For now, hard coding the behaviour.
  // Note: possible way is to abolish any querying - inline attributes
  // are sourced from the model only (can have some standard extraction
  // logic for pasting of arbitrary rich text) - and rendering is
  // registered with the attribute (cf annotation painting in wave editor).
  var attrParsers = {
  };

  /**
   * Returns a map of attrName -> [list of values] that apply over a given range
   * in the document.
   */
  me.getRangeAttributes = function(range) {
    assert(range && range.anchor && range.focus);

    assert(util.isEditable(range.anchor.containingElement()));

    var attrs = {};
    for (var k in supportedAttributes) {
      attrs[k] = [];
    }

    // Special case - if our range is collapsed,
    // then we treat the 
    if (range.isCollapsed()) {
      accumulate(range.getStart().containingElement());
      return attrs;
    }

    var it = range.iterateRight();

    // Here, we accumulate styles over all selectable content.
    // That is, styles for text, and certain element boundaries
    // like inter-paragraph newlines.
    while (true) {
      var el = it.enterElement();
      if (el) {
        if (isIgnored(el)) {
          // jump back out to skip entire element contents.
          el = it.leaveElement();

          assert(el); // otherwise end is inside an ignored widget or something??
        } else if (elementHasSelectableBoundary(el)) {
          accumulate(el);
        }

        continue;
      }

      var txt = it.skipText();
      if (txt) {
        accumulate(txt.start.containingElement());
        continue;
      }

      var el = it.leaveElement();
      if (el) {
        continue;
      }

      assert(it.isAtEnd());

      return attrs;
    }


    function accumulate(elem) {
      var computed = hackComputedStyle(elem, wnd);

      var len = supportedAttributes.length;
      for (var attr in supportedAttributes) {
        var val = computed[attr];
        if (val && attrs[attr].indexOf(val) < 0) {
          attrs[attr].push(val);
        }
      }
    }

    function hackComputedStyle(elem) {
      var computed = util.computedStyle(elem, wnd);

      // HACK(dan): jsdom doesn't seem to implement this properly for testing afaik
      // quick hack, good enough for cases tested.
      if (!computed['font-weight']) {
        computed = util.shallowCopy(supportedAttributes);
        if (util.isElemType(elem, 'i')) {
          computed['font-style'] = 'italic';
        }
        if (util.isElemType(elem, 'b')) {
          computed['font-weight'] = 'bold';
        }
      }

      return computed;
    }
  };

  // todo: links
  var supportedAttributes = {     // defaults (unused for now?)
    'font-weight'      : 'normal',
    'font-style'       : 'normal',
    'text-decoration'  : 'none',
    'color'            : 'inherit'
  };

  this.getDefaults = function() {
    return util.shallowCopy(supportedAttributes);
  };

  /**
   * Returns true if the element has a selectable boundary.
   * E.g. the conceptual newline betwen paragraphs.
   *
   * An inline styling span does not have a selectable boundary.
   */
  function elementHasSelectableBoundary(el) {
    return util.isBlock(el, wnd);
  }

  function isIgnored(el) {
    // Probably some kind of fancy nested widget.
    // Treat it as a style-inert black box.
    if (!util.isEditable(el)) {
      return true;
    }

    // Ignore BRs, don't let their state mess with the logic.
    if (util.isElemType(el, 'br')) {
      return true;
    }

    return false;
  }

};
