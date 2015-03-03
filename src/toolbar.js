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

          for (idx in me.actions) {
            var action = me.actions[idx];
            var isToggled = action.toggleCheck(me.editor);
            if (isToggled) {
              action.button.classList.add('qed-button-toggled');
            } else {
              action.button.classList.remove('qed-button-toggled');
            }
            action.button.onclick = action.toggle(isToggled);
          }
        })
      } else {
        me.elem.style.display = 'none';
      }

      return false;
    }
  });

  // TODO: use dom DSL lib instead of all this boilerplate.
  me.elem = document.createElement('div');
  me.elem.className = 'qed-toolbar';

  me.elem.style.position = 'fixed';
  // Default width without any buttons
  me.width = 2;
  me.elem.style.width = me.width + 'px';
  me.elem.style.height = '40px';
  me.elem.style.zIndex = '10';
  me.elem.style.border = '1px solid silver';
  me.elem.style.background = 'white';
  me.elem.style.boxShadow = '0px 3px 15px rgba(0,0,0,0.2)';

  ul = document.createElement('ul');
  ul.className = 'qed-toolbar-actions';

  me.elem.appendChild(ul);

  me.actions = [];

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

  var buttonWidth = 30;

  // Create toolbar button
  var li = document.createElement("li");
  var newButton = document.createElement("button");
  var buttonLabel = document.createTextNode(label);
  newButton.appendChild(buttonLabel);
  li.appendChild(newButton);

  // Style it
  newButton.style.width = buttonWidth + 'px';
  newButton.style.height = '40px';
  newButton.className = 'qed-toolbar-button';

  li.style.float = 'left';

  // Update toolbar
  me.width = me.width + buttonWidth;
  me.elem.style.width = me.width + 'px';

  // Attach action to button
  newButton.onclick=function(){
    callback(me.editor, check(me.editor));
  };

  // Attach it to toolbar
  me.elem.lastChild.appendChild(li);
  me.actions.push({
    button: newButton,
    toggleCheck: check,
    toggle: function(shouldToggle){
      return function(){
        callback(me.editor, shouldToggle);
      };
    }
  });
};

