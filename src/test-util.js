var _ = require('lodash');
var Q = require('q');
var jsdom = require('jsdom');
var util = require('./util');
var Point = require('./point');
var Range = require('./range');
var assert = util.assert;

exports.promised = function promised(func) {
  return function(done) {
    (func() || Q.resolve())
    .then(function() { done(); })
    .catch(function(err) {
      done(err);
    })
  };
};

exports.dom = function dom(html, func) {
  var deferred = Q.defer();

  jsdom.env({
      html: html, 
      done: function(err, win) { 
        if (err) {
          deferred.reject(err);
          return;
        }

        var elem = win.document.body.firstChild;

        if (elem.nextSibling) {
          deferred.reject(new Error('invalid test dom - multiple top level elements!'));
          return;
        }

        // Stick it on the elem so we can fish it out if needed
        // 99% case don't need it, so don't want to complicate the
        // func args.
        elem.$wnd = win;

        deferred.resolve(elem);
      }
  });

  return func ? deferred.promise.then(func) : deferred.promise;
};

/**
 * Similar to dom(), but also interprets markers in the html delimiting a range.
 *
 * calls the supplied function with the top level element, as well as a Range
 * covering where the markers were.
 *
 * The markers are the characters '|',  '[',  ']', 
 * extracted from parsed text nodes. They are removed from the DOM and do not
 * contribute to position offsets.
 *
 * The [ and ] characters denote the start and end of a range.
 * The pipe marker is a convenience shorthand for "[]" (i.e. a collapsed range)
 *
 * Only one range is permitted and it must be well-formed.
 */
exports.domrange = function domrange(html, func) {
  return exports.dom(html, function(elem) {
    var result = {};

    findEndpoints(elem);

    if (!result.start || !result.end) {
      throw new Error("No range found in " + html);
    }

    var junkNodes = [];
    result.start = cleanupPoint(result.start);
    result.end = cleanupPoint(result.end);

    junkNodes.forEach(util.removeNode);

    return func(elem, new Range(result.start, result.end));
    
    function findEndpoints(elem) {
      var next;
      for (var node = elem.firstChild; node; node = node.nextSibling) {

        if (node.nodeType === 1) {
          findEndpoints(node);
        } else {
          while (extractSingleMarker(node)) /**/ ;
        }
      }
    }

    function extractSingleMarker(node) {
      var txt = node.data;
      var index;

      index = txt.indexOf('|');
      if (index >= 0) {
        assert(!result.start && !result.end);
        removeChar(node, index);
        result.start = Point.text(node, index);
        result.end = result.start.copy();
        return true;
      }
      
      index = txt.indexOf('[');
      if (index >= 0) {
        assert(!result.start && !result.end);
        removeChar(node, index);

        result.start = Point.text(node, index);
        return true;
      }
      
      index = txt.indexOf(']');
      if (index >= 0) {
        assert(result.start && !result.end);
        removeChar(node, index);

        result.end = Point.text(node, index);
        return true;
      }

      return false;
    }

    function cleanupPoint(point) {
      if (point.isInEmptyTextNode()) {
        var node = point.node;
        point = Point.before(node).leftNormalized();
        junkNodes.push(node);
      }

      return point;
    }

    function textPoint(textNode, offset) {
      if (textNode.length === 0) {
        assert(offset === 0);

        // get it associated away from the junk empty node
        var point = Point.before(textNode).leftNormalized();

        util.removeNode(textNode);

        return point;
      } else {
        return Point.text(textNode, offset);
      }
    }

    function removeChar(textNode, index) {
      var data = textNode.data;

      assert(index >= 0 && index < data.length);

      textNode.data = data.substr(0, index) + data.substr(index + 1);
    }
  });
};


/**
 * Convenience utility for applying a certain check to a variety of
 * related dom+range test cases.
 *
 * testCases - array of html strings,
 *             OR array of array pairs, first val is html string, second val is info
 *
 * NOTE: html strings will be automatically wrapped in a div - so, multiple top elements
 *       are permitted, and the passed element will be the implicit div.
 *
 * checkFunc - args are 
 *             - elem
 *             - range
 *             - info for test case (or null)
 *
 * wrap - optional func to change how the test case content is wrapped.
 */
exports.rangeCases = function(testCases, checkFunc, wrap) {
  return Q.all(_.map(testCases, function runCase(testCase) {
    var pair = typeof testCase === 'string' ? [testCase, null] : testCase;

    assert((pair.length === 1 || pair.length === 2) && typeof pair[0] === 'string');

    var html = (wrap ? wrap(pair[0]) : '<div>' + pair[0] + '</div>');
    var info = pair[1];

    return exports.domrange(html, function(elem, range) {
      assert(elem && range);
      return checkFunc(elem, range, info);
    });

  }));
};

