
// In a non-commonjs app, would include this with a script tag.
// This script puts "qed" in the global scope.
require('../src/client');
// -----------------------------------------------------

window.onload = function() {
  var Editor = qed.Editor;
  var Toolbar = qed.Toolbar;
  var StemTracker = qed.StemTracker;
  var Placeholders = qed.Placeholders;

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
      return false;
    },
  });

  editor.attach($('editor'));
  editor.focus();
  showContent();

  function showContent() {
    $('content').innerHTML = '';
    $('content').appendChild(document.createTextNode($('editor').innerHTML));
  }

  function $(id) {
    return document.getElementById(id);
  }

};
