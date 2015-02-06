var util = require('./util');
var Editor = require('./event-bus');
var Selection = require('./selection');

module.exports = Toolbar;

/**
 * Default Toolbar
 */
function Toolbar(editor) {
  var me = this;

  me.editor = editor;

  editor.addListener({
    onSelection: function(selection) {
      if (!selection.isCollapsed()) {
        me.elem.style.display = 'block';

        // Do it in a timeout so it can calculate accurately.
        setTimeout(function() {
          var coords = selection.getCoords();
          console.log(coords);

          me.elem.style.top = (coords.y + 40) + 'px';
          me.elem.style.left = (coords.x - me.elem.offsetWidth/2) + 'px';
        })
      } else {
        me.elem.style.display = 'none';
      }
    }
  });

  // TODO: use dom DSL lib instead of all this boilerplate.
  me.elem = document.createElement('div');
  me.elem.className = 'qed-toolbar';

  me.elem.style.position = 'fixed';
  me.elem.style.width = '200px';
  me.elem.style.height = '40px';
  me.elem.style.zIndex = '10';
  me.elem.style.padding = '10px';
  me.elem.style.border = '1px solid silver';
  me.elem.style.background = 'white';
  me.elem.style.boxShadow = '0px 3px 15px rgba(0,0,0,0.2)';

  document.body.appendChild(me.elem);
};

/*
 * Add a button to the toolbar
 * label:    The text to show as a button label
 * check:    A function that returns true if text nodes in current selection are wrapped in style
 * callback: A function that takes the editor and result of check, adds style to current selection, or removes the style if check return false
 */
Toolbar.prototype.addButton = function(label, check, callback) {
  var me = this;

  var newButton = document.createElement("button");
  buttonLabel = document.createTextNode(label);
  newButton.appendChild(buttonLabel);

  newButton.onclick=function(){
    callback(me.editor, check(me.editor));
  };

  me.elem.appendChild(newButton);
};

