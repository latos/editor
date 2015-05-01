var util = require('./util');
var Editor = require('./event-bus');
var Selection = require('./selection');
var InlineDecorator = require('./inline-decorator');

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
          me.reposition(selection);

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
  me.elem.style.width = me.width + 'px';
  me.elem.style.zIndex = '1000';
  me.elem.style.border = '1px solid silver';
  me.elem.style.background = 'white';
  me.elem.style.boxShadow = '0px 3px 15px rgba(0,0,0,0.2)';

  ul = document.createElement('ul');
  ul.className = 'qed-toolbar-actions';

  me.elem.appendChild(ul);

  me.actions = [];

  // Reposition toolbar when window is resized.
  var debouncedReposition = util.debounce( function(event) {
    var selection = me.editor.selection();
    me.reposition(selection);
  }, 5, true);
  window.addEventListener('resize', debouncedReposition);
  document.addEventListener('scroll', debouncedReposition);

  document.body.appendChild(me.elem);
};

/* Reposition the toolbar relative to the selection */
Toolbar.prototype.reposition = function(selection) {
  var me = this;
  var coords = selection.getCoords();
  me.elem.style.top = (coords.y - 60) + 'px';
  me.elem.style.left = ( (coords.x + (coords.width / 2)) - me.elem.offsetWidth/2 ) + 'px';
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
  newButton.innerHTML = label;
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

/*
 * Adds generic link button to toolbar with a default behaviour
 * label: Can specify a custom label, or will use a default
 */
Toolbar.prototype.addDefaultLinkButton = function(label) {
  var me = this;

  if (!label) {
    label = 'L';
  }

  // We add a listener to refresh the toolbar on selection if
  // the link text box is still active
  me.editor.addListener({
    onSelection: function(selection) {
      if (me.urlTextbox) {
        me.elem.remove(me.urlTextbox);
        me.urlTextbox = null;
        me.elem.firstChild.style.display = 'inline';
      }
      return false;
    }
  });

  var linkCheck = function(editor) {
    var iDec = new InlineDecorator();

    styles = iDec.getRangeAttributes(editor.selection().getRange());

    return styles.href && styles.href.length > 0;
  };

  var linkCallback = function(editor, toggle) {

    // Hide buttons
    me.elem.firstChild.style.display = 'none';

    // Save selection
    var range = editor.selection().getRange();

    // Show textbox
    var urlTextbox = document.createElement("input");
    me.elem.appendChild(urlTextbox);
    me.urlTextbox = urlTextbox;
    urlTextbox.focus();
    urlTextbox.onkeyup = function(e) {

      if (e.keyCode === 13) {
        // Set browsers selection back on what it was before
        editor.selection().setEndpoints(range.anchor, range.focus);

        // Add link to selection
        document.execCommand('createLink', true, urlTextbox.value);

        // Remove textbox
        me.elem.removeChild(urlTextbox);

        // Show buttons
        me.elem.firstChild.style.display = 'block';

        return true;
      }

      return;
    };

    return;
  };

  this.addButton(label, linkCheck, linkCallback);
};

