function initEditorDesktop() {

  window.oncontextmenu = function(evt) {
    var el = evt.target;
    if (el.classList.contains('cm-spell-error')) {
      var m = findEntityAt(editor.getDoc(), editor.getCursor(), 5);
      if (m) {
        var r = m.find(); //editor.findWordAt(editor.getCursor());
        if (r) {
          var text = el.innerText;
        
          window.sendWindowMessage({cmd:'assignContextWord', value:text});
          if (!editor.somethingSelected()) editor.setSelection(r.from, r.to);
        }
      }
    }
    else if (el.classList.contains('cm-link')) {
      var r = editor.findWordAt(editor.getCursor());
      if (r && !editor.somethingSelected()) editor.setSelection(r.anchor, r.head);
    }
    else {
      window.sendWindowMessage({cmd:'assignContextWord'});
      
      el = evt.target.parentElement;
      if (!el) return;

      el = getWidgetEl(el);
      if (el) {
        var p = getPositionForMarkEl(editor.getDoc(), el);
        if (p) {
          editor.setSelection(p.from, p.to);
        }
      }
    }
  };

  editor.on('blur', function() {
    window.document.body.classList.remove('cm-active');
  });
  
  editor.on('focus', function() {
    window.document.body.classList.add('cm-active');
  });

  editor.on('mousedown', function(cm, evt) {
    var target = evt.target;
    if (editFromSearchFilter()) {
      return;
    }

    if (evt.button > 1 || evt.ctrlKey) {
      /* only when we do selection */
      var cls = document.getElementsByClassName('CodeMirror-cursors')[0].previousElementSibling;
      cls.style.opacity = 1.0;
      cls.style.zIndex = 1;

      window.requestAnimationFrame(function() {
        cls.style.opacity = 0.5;
        cls.style.zIndex = 10;
      }, 0);
      return;
    }

    if (document.body.classList.contains('dragging')) {
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    else if (target.classList.contains('cm-task-open')) {
      var l = editor.getLineHandleAtPos(evt.clientX, evt.clientY);
      if (l) editor.replaceLine(l.text.replace('- [ ]', '- [x]'), l.lineNo());
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
    else if (target.classList.contains('cm-task-closed')) {
      var l = editor.getLineHandleAtPos(evt.clientX, evt.clientY);
      if (l) editor.replaceLine(l.text.replace('- [x]', '- [ ]'), l.lineNo());
      evt.preventDefault();
      evt.stopPropagation();
      return false;
    }
  });
  
  editor.on('scroll', function(cm) {
    exec_once('cm_update_scroll', 50, function() {
      var info = cm.getScrollInfo();
      var x = info.top / (info.height - info.clientHeight);
    });
  });
  
  editor.focus();
}
