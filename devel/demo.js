
// In a non-commonjs app, would include this with a script tag.
// This script puts "qed" in the global scope.
require('../src/client');

splitLeftHandler = function(point) {

  point.splitLeft();

  // We want to stop bubbling the handling up once we reach the editor level of the DOM
  if (point.node.parentNode.id === 'editor') {
    return true;
  }

  return false
}

splitRightHandler = function(point) {
  if (point.node.parentNode.id === 'editor') {
    return true;
  }

  point.splitRight();

  return false
}

joinLeftHandler = function(point) {
  if (point.node.parentNode.id === 'editor') {
    result = true;
  }
  else {
    result = false;
  }
  point.joinLeft();

  return result;
};

joinRightHandler = function(point) {
  point.joinRight();

  if (point.node.parentNode.id === 'editor') {
    return true;
  }
  else {
    return false;
  }
};

window.onload = function() {
  var Editor = qed.Editor;
  var Toolbar = qed.Toolbar;

  var editor = new Editor();
  editor.addListener({
    onContent: function() {
      showContent();
    },
    onAttached: function() {
      console.log("Editor attached");
    },
    onKeypress: function(e) {
      // quick hack to test plumbing
      if (e.keyCode == 13) {
        e.preventDefault();
      }
      return true;
    },
    onKey: function(e) {
      if (e.keyType == 'backspace' && e.point.type == 'start') {
        e.preventDefault();
      } else if (e.keyCode == 13) {
        result = splitLeftHandler(e.point);
        showContent();

        // We set the caret to the split point
        editor.selection().setCaret(e.point);

        return result;
      }
      return true;
    },
    // Trying to get rid of error messaging for unhandled events to clear up debugging messages
    onSelection: function(e) {
      return true;
    }
  });

  editor.attach($('editor'));
  editor.focus();
  showContent();

  var toolbar = new Toolbar(editor);

  function showContent() {
    $('content').innerHTML = '';
    $('content').appendChild(document.createTextNode($('editor').innerHTML));
  }

  function $(id) {
    return document.getElementById(id);
  }

};
