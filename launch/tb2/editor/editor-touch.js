function scrollViewToCursor() {
  var cur = editor.getCursor();
  window.scrollTo(0, 0);
  editor.scrollIntoView(cur);
}

function selectWidgetForce(doc, el) {
  selectWidget(doc, el);
  setTimeout(function() {
    selectWidget(doc, el);
  },100);
}

function touchDidMove(evt) {
  var x = Math.abs(window.__touchpos.x - evt.pageX);
  var y = Math.abs(window.__touchpos.y - evt.pageY);

  if (x > 10 || y > 10) return true;
  else return false;
}

function fixWebViewHeight() {
  editor.markSelectionRange(null);
  exec_once('fix_size', 50, function() {
    scrollViewToCursor();
  });
}

function showActionMenu(type, text) {
  var info = getInfoForContext();
  info.action = 'UI_context_word';
  info.value = text;
  info.type = type;

  window.sendWindowMessage(info);
}

function hideContextMenu() {
  exec_clear('cm_update_selection');
  window.sendWindowMessage({action:'UI_context_hide'});
}

function isActiveEditor() {
  return (window.document.body.classList.contains('cm-active'));
}

function activateEditor() {
  if (isActiveEditor()) return;
  window.document.body.classList.add('cm-active');
}

function deactivateEditor() {
  if (!isActiveEditor()) return;
  window.document.body.classList.remove('cm-active');
}

function initEditorTouch() {
  editor.on('focus', function() {
    //fixWebViewHeight();
    activateEditor();
  });

  editor.on('blur', function() {
    //fixWebViewHeight();
    deactivateEditor();
  });
  
  window.addEventListener('resize', function(evt) {
    //fixWebViewHeight();
  });
  
  editor.on('scroll', function() {
    window.getSelection().removeAllRanges();
  });
  
  window.onblur = function(evt) {
    editor.setExtending(false);
    if (document.activeElement) document.activeElement.blur();
  };
  
/*
  window.addEventListener('touchstart', function(evt) { //needs to capture to be able to cancel events
    return;
    var el = evt.target;
    window.__touchpos = {
      x:evt.pageX,
      y:evt.pageY
    };

    if (isActiveEditor() && el.classList.contains('cm-spell-error')) {
      evt.preventDefault();
      editor.display.input.startGracePeriod();
      exec_once('cm_handle_touch', 50, function() {
        selectWidget(editor.getDoc(), el);

        el.__ignoreevent = 2;

        var info = {
          cmd:'showSpellSheet',
          value:el.innerText
        };
        window.sendWindowMessage(info);
      });
    }
    else if (!isActiveEditor() && el.classList.contains('cm-link')) {
      evt.cancelBubble = true;
      evt.preventDefault();
      el.setAttribute('cm-ignore-events', 'true');
      el.__ignoreevent = 1;
      handleOpenLink(el.innerText);
    }
    else if (!isActiveEditor() && el.classList.contains('cm-link-wikiname')) {
      evt.cancelBubble = true;
      evt.preventDefault();
      el.setAttribute('cm-ignore-events', 'true');
      el.__ignoreevent = 1;
      handleOpenLink(el.innerText);
    }
    else if (!isActiveEditor() && el.tagName == 'A') {
      evt.cancelBubble = true;
      el.__ignoreevent = 2;
      evt.preventDefault();
      handleOpenLink(el.href);
    }
  }, true);
  
  window.addEventListener('touchend', function(evt) {
    var el = evt.target;
    if (el.__ignoreevent == 1) {
      el.removeAttribute('cm-ignore-events');
      evt.preventDefault();
    }
    else if (el.__ignoreevent == 2) {
      evt.preventDefault();
    }
  }, true);
  
  window.ontouchend = function(evt) {
    var el = evt.target;
    var sel = document.getSelection();

    if (el.__ignoreevent == 1) {
      el.removeAttribute('cm-ignore-events');
      evt.preventDefault();
      delete el.__ignoreevent;
      return;
    }
    else if (el.__ignoreevent == 2) {
      evt.preventDefault();
      delete el.__ignoreevent;
      return;
    }
    
    if (document.body.classList.contains('dragging')) {
      evt.preventDefault();
      return false;
    }
    
    if (editor.state.focused && evt.target.classList.contains('cm-task-open')) {
      var l = editor.getLineHandleAtPos(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
      if (l) editor.replaceLine(l.text.replace('- [ ]', '- [x]'), l.lineNo());
      evt.preventDefault();
      return false;
    }
    else if (editor.state.focused && evt.target.classList.contains('cm-task-closed')) {
      var l = editor.getLineHandleAtPos(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
      if (l) editor.replaceLine(l.text.replace('- [x]', '- [ ]'), l.lineNo());
      evt.preventDefault();
      return false;
    }
    else if (editor.state.focused) { //editor.hasFocus()) {
      el = evt.target.parentElement;
      el = getWidgetEl(el);
      if (el && !touchDidMove(evt)) {
        editor.display.input.startGracePeriod();
        exec_once('cm_handle_touch', 50, function() {
          selectWidgetForce(editor.getDoc(), el);
        });

        evt.preventDefault();
        return;
      }
    }
    
    el = evt.target;
  };
  */
  
  editor.on('changes', function(cm, changes) {
    hideContextMenu();
  });

  editor.on('keydown', function(cm, evt) {
    if (window.PRESSING_NINJA_KEY) {
      if (evt.key === 'c') {
        UI_command('copy');
      }
      else if (evt.key === 'v') {
        UI_command('paste');
      }
      else if (evt.key === 'x') {
        UI_command('cut');
      }
      else if (evt.key === 'f') {
        UI_command('find');
      }
      else if (evt.key === 'a') {
        editor.execCommand('selectAll');
      }
      else if (evt.key === 'i') {
        editor.execCommand('defaultTab');
      }
      else if (evt.key === 'z') {
        editor.execCommand('undo');
      }
      else if (evt.which === 8) { //backspace
        editor.execCommand('delCharAfter');
      }
      else if (evt.which === 13) { //enter
        editor.execCommand('goLineStart');
        editor.execCommand('newlineAndIndent');
        editor.execCommand('goLineUp');
      }
      
      evt.stopPropagation();
      evt.preventDefault();
    }
  });
}
