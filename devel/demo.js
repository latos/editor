
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
  var result;
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



// -----------------------------------------------------

window.onload = function() {
  var Editor = qed.Editor;
  var Toolbar = qed.Toolbar;
  var StemTracker = qed.StemTracker;

  var editor = new Editor();
  editor.addListener({
    onContent: function() {
      showContent();
      return false;
    },
    onAttached: function() {
      console.log("Editor attached");
      return true;
    },
    onKey: function(e) {
      // if (e.keyType == 'backspace' && e.point.type == 'start') {
      //   e.preventDefault();
      //   //result = joinRightHandler(e.point);
      //   result = joinLeftHandler(e.point);
      //   showContent();

      //   editor.selection().setCaret(e.point);

      //   return result;
      // } else if (e.keyCode == 13) {
      //   result = splitRightHandler(e.point);
      //   showContent();

      //   // We set the caret to the split point
      //   editor.selection().setCaret(e.point);

      //   return result;
      // }
      return false;
    },
  });

  editor.attach($('editor'));
  editor.focus();
  showContent();

  var tracker = new StemTracker(editor, function(){
    /* Click handler goes here */
  });
  var toolbar = new Toolbar(editor);

  function showContent() {
    $('content').innerHTML = '';
    $('content').appendChild(document.createTextNode($('editor').innerHTML));
  }

  function $(id) {
    return document.getElementById(id);
  }

};
