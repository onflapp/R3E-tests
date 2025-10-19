function infoToImgFrame(img, info) {
  var frame = img.parentElement;
  var gv = function(n) {
    var a = info.match(n);
    if (a == null) return null;
    else return a[1];
  };

  var w = gv(/w(\d+)/);
  var h = gv(/h(\d+)/);
  var i = gv(/i(\d+)/);
  var x = gv(/x(\-?\d+)/);
  var y = gv(/y(\-?\d+)/);

  if (w) frame.style.width = w+'px';
  if (h) frame.style.height = h+'px';
  if (i) img.setAttribute('width', i+'px');
  if (x) img.style.marginLeft = x+'px';
  if (y) img.style.marginTop = y+'px';
}

function imgFrameToInfo(img) {
  //w100h100i100x10y10
  var frame = img.parentElement;
  var gv = function(v) { return v.substr(0, v.length-2); };

  var w = frame.style.width;
  var h = frame.style.height;
  var i = img.getAttribute('width');
  var x = img.style.marginLeft;
  var y = img.style.marginTop;
  var n = img.dataset.filename;

  var str = '';
  if (w) str += 'w'+gv(w);
  if (h) str += 'h'+gv(h);
  if (i) str += 'i'+gv(i);
  if (x) str += 'x'+gv(x);
  if (y) str += 'y'+gv(y);

  return str;
}

function replaceImgInfo(from, to, name, info) {
  var s = editor.getRange(from, to);
  var i = s.indexOf(name);
  if (i > 0) {
    s = s.substr(0, i+name.length);
    if (info.length > 0) s += '_r/'+info+'.png';
    s += ')';
    editor.doc.replaceRange(s, from, to);
  }
}

function highlightRanges(ranges, cl, type) {
  var doc = editor.getDoc();
  var end = doc.lineCount();

  clearEntities(doc, 0, end, type);
      
  for (var i = 0; i < ranges.length; i++) {
    var r = ranges[i];
    var index = r[0];
    var len = r[1];
    var start = doc.posFromIndex(index);
    var end = doc.posFromIndex(index+len);

    var it = doc.markText(start, end, {
      className: cl
    });
    it.xtype = type;
  }
}

function highlightCursor() {
  setTimeout(function() {
    var $c = $('.CodeMirror-cursor');
    $c.addClass('large');
    setTimeout(function() {
      $c.addClass('zoomout');
    }, 50);
  }, 100);
}

function handleWindowMessage(msg) {
  if (msg.cmd == 'spellcheckHighlight') {
    highlightRanges(msg.ranges, 'cm-spell-error', 5);
  }
  else if (msg.cmd == 'spellcheckCorrectWord') {
    if (msg.text) {
      editor.replaceSelection(msg.text);
    }
  }
  else if (msg.cmd == 'replaceSelection') {
    if (msg.text) {
      editor.replaceSelection(msg.text);
    }
  }
  else if (msg.cmd == 'syncClipboardCB') {
    var text = msg['text'];

    if (msg['linkName']) {
      var name = msg['linkName'].replace(/[\(\)\[\]]/g, '_');
      text = '['+msg['linkName']+']('+msg['linkURL']+')';
    }
    
    if (text) {
      editor.replaceSelection(text);
      refreshContent();
    }
  }
  else {
    console.log(msg);
  }
}

function ACTION_apply_style(cmd) {
  var head = null;
  var cur = editor.getCursor();
  var line = editor.getLine(cur.line);

  if (cmd.value == 'H1') {
    head = "# ";
  }
  else if (cmd.value == 'H2') {
    head = "## ";
  }
  else if (cmd.value == 'H3') {
    head = "### ";
  }
  else if (cmd.value == 'H4') {
    head = "#### ";
  }

  if (cmd.value == 'MONO') {
    if (!editor.somethingSelected() && line.length == 0) {
      editor.insert("```\n");
    }
    else {
      var range = editor.listSelections()[0];
      var start = range.head.line;
      var end = range.anchor.line;
      editor.eachSelectedLine(function (text, from, to) {
        if (from.line == start) text = "```\n" + text;
        if (from.line == end) text = text + "\n```";

        return text;
      });
    }
  }
  else if (cmd.value == 'CONTAINER') {
    if (!editor.somethingSelected() && line.length == 0) {
      editor.insert(":::\n");
    }
    else {
      var range = editor.listSelections()[0];
      var start = range.head.line;
      var end = range.anchor.line;
      editor.eachSelectedLine(function (text, from, to) {
        if (from.line == start) text = ":::\n" + text;
        if (from.line == end) text = text + "\n:::";

        return text;
      });
    }
  }
  else if (cmd.value == 'QUOTE') {
    if (!editor.somethingSelected() && line.length == 0) {
      editor.insert("> ");
    }
    else {
      editor.eachSelectedLine(function (text, from, to) {
        if (text.charAt(0) == '>') text = '>' + text;
        else text = '> ' + text;

        return text;
      });
    }
  }
  else if (cmd.value == 'TASK') {
    if (!editor.somethingSelected() && line.length == 0) {
      editor.insert("- [ ] ");
    }
    else {
      editor.eachSelectedLine(function (text, from, to) {
        if (text.length > 0) {
          if (text.match(/^\s*-/)) {
            text = text.replace(/^\s*- \[.\] /, '');
            text = text.replace(/^\s*- /, '');
          }
          text = '- [ ] ' + text;
        }

        return text;
      });
    }
  }
  else if (cmd.value == 'LIST') {
    if (!editor.somethingSelected() && line.length == 0) {
      editor.insert("- ");
    }
    else {
      editor.eachSelectedLine(function (text, from, to) {
        if (text.length > 0 && !text.match(/^\s*-/)) text = '- ' + text;

        return text;
      });
    }
  }
  else if (cmd.value == 'NORMAL') {
    editor.eachSelectedLine(function (text, from, to) {
      text = text.replace(/^#+ /, '');
      text = text.replace(/^```$/, '');
      text = text.replace(/^~~~$/, '');
      text = text.replace(/^>+ /, '');
      text = text.replace(/^\s*- \[.\] /, '');
      text = text.replace(/^\s*[\-\*\+] /, '');
      text = text.replace(/^\s+/, '');
      return text;
    });
  }
  else if (head) {
    if (!editor.somethingSelected() && line.length == 0) {
      editor.insert(head);
    }
    else {
      editor.eachSelectedLine(function (text, from, to) {
        text = text.replace(/^#+ /, '');
        return head + text;
      });
    }
  }
}

function ACTION_apply_layout(cmd) {
  console.log(cmd);
  var doc = editor.getDoc();
  var r = editor.listSelections()[0];
  var l = r.head.line;

  var getpar = function(c) {
    var haspar = false;
    doc.eachLine(0, c, function(line) {
      if (line.text.match(/^%%%$/) || line.text.match(/^%%%align-.*$/)) {
        haspar = true;
      }
    });

    if (cmd.value == 'CENTER') {
      return '%%%align-center';
    }
    else if (cmd.value == 'RIGHT') {
      return '%%%align-right';
    }
    else if (haspar) {
      return '%%%';
    }
    else {
      return '';
    }
  };

  var text = editor.getLine(l);
  if (text === '%%%align-center' || text === '%%%align-right' || text === '%%%' || text == '') {
    editor.replaceLine(getpar(l), l);
  }
  else if (text != '' && l > 0) {
    l--;
    text = editor.getLine(l);
    if (text === '%%%align-center' || text === '%%%align-right' || text === '%%%') {
      var r = getpar(l);
      if (r == '') editor.deleteLine(l);
      else editor.replaceLine(r, l); 
    }
    else if (text === '') {
      editor.replaceLine(getpar(l), l);
    }
    else {
      editor.replaceLine(text + '\n' + getpar(l), l);
    }
  }
  else if (text != '' && l == 0) {
    text = editor.getLine(l);
    if (text === '%%%align-center' || text === '%%%align-right' || text === '%%%') {
      editor.replaceLine(getpar(l), l); 
    }
    else if (text === '') {
      var r = getpar(l);
      if (r != '') editor.replaceLine(r + '\n', l);
    }
    else {
      var r = getpar(l);
      if (r != '') r += '\n';
      editor.replaceLine(r + text, l);
    }
  }
}

function ACTION_apply_font(cmd) {
  var code = "*";
  var doc = editor.getDoc();
  var range = editor.listSelections()[0];

  if (cmd.value == 'BOLD') {
    code = "**";
  }
  else if (cmd.value == 'ITALIC') {
    code = "*";
  }
  else if (cmd.value == 'UNDERLINE') {
    code = "__";
  }
  else if (cmd.value == 'STRIKE') {
    code = "~~";
  }
  else if (cmd.value == 'MONOSPACE') {
    code = "`";
  }


  var r = editor.expandRange(orderRange(range), "[_~\\*]");
  var s = editor.getRange(r.anchor, r.head);
   
  var cursor = false;
  var ns = s.replaceAll(code, "");
  if (ns == s) {
    if (s.length == 0) cursor = true;
    s = code + s + code;
  }
  else s = ns;

  if (cursor) {
    editor.replaceRange(s, r.anchor, r.head);
    r.anchor.ch += code.length;
    editor.setCursor(r.anchor);
  }
  else {
    editor.replaceRangeAndSelect(s, r.anchor, r.head);
  }
}

function ACTION_search(cmd) {
  window.SEARCH_TEXT = cmd.text;
  window.editor['__ignore_selection'] = 1;
  var c = editor.state.focused;
  var r = null;

  if (cmd['command'] === 'findNext') {
    editor.execCommand(cmd.command);
    r = makeRange(editor.state.search.posFrom, editor.state.search.posTo);
  }
  else if (cmd['command'] == 'findPrev') {
    editor.execCommand(cmd.command);
    r = makeRange(editor.state.search.posFrom, editor.state.search.posTo);
  }
  else if (cmd['command'] == 'findAndEdit') {
    editor.execCommand('find');
    c = true;
    r = makeRange(editor.state.search.posFrom, editor.state.search.posTo);
  }
  else if (cmd['command'] == 'filter') {
    refreshSearchFilter();
    return;
  }
  else if (cmd['livetext']) {
    window.SEARCH_TEXT = cmd.livetext;
    editor.execCommand('find');
    refreshSearchFilter();
    r = makeRange(editor.state.search.posFrom, editor.state.search.posTo);
  }
  else if (cmd.text) {
    editor.execCommand('findNext');
    refreshSearchFilter();
    r = makeRange(editor.state.search.posFrom, editor.state.search.posTo);
  }
  else {
    editor.execCommand('clearSearch');
    editor.markSelectionRange(null);
    refreshSearchFilter();
    window.document.body.classList.remove('search-mode');
  }

  if (document.querySelector('.cm-searching') && r) {
    editor.markSelectionRange(r);
    window.document.body.classList.add('search-mode');
  }
  else {
    editor.markSelectionRange(null);
    window.document.body.classList.remove('search-mode');
  }

  if (c && r) {
    editor.setCursor(r.to());
    highlightCursor();
  }

  delete window.editor['__ignore_selection'];
}

function ACTION_context_menu() {
  var info = getInfoForContext();
  var rsel = editor.getSelectedRange();

  info.action = 'UI_context_word';

  editor.markSelectionRange(rsel);

  window.sendWindowMessage(info);
}

function ACTION_open_link() {
  var info = getInfoForSelection();
  if (info) {
    info.action = 'UI_open_link';
    window.sendWindowMessage(info);
  }
}

function ACTION_edit_link() {
  var info = getInfoForSelection();
  var spos = getInfoForContext();
  var rsel = editor.getSelectedRange();

  if (!info) info = {};
 
  editor.markSelectionRange(rsel);

  info.x = spos.x;
  info.y = spos.y;
  info.w = spos.w;
  info.h = spos.h;
  info.action = 'UI_edit_link';
  window.sendWindowMessage(info);
}

function ACTION_edit_image(val) {
  var info = getInfoForContext();
  var sel = editor.getSelectedWord();

  if (sel) {
    if (a = sel.match(/^\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)$/)) {
      info.name = a[1];
      info.src  = a[2];
      info.href = a[3];
    }
    else if (a = sel.match(/^!\[(.*?)\]\((.*?)\)$/)) {
      info.name = a[1];
      info.src  = a[2];
    }
    else {
      info.name = sel;
    }
  }

  info.action = 'UI_edit_image';
  info.type = val.type;
  window.sendWindowMessage(info);
}

function initEditor(te) {
  window.IS_TOUCH_DEVICE = 0;

  delete CodeMirror.keyMap.default["Cmd-F"];
  delete CodeMirror.keyMap.default["Cmd-G"];
  delete CodeMirror.keyMap.default["Cmd-S"];
  delete CodeMirror.keyMap.default["Cmd-D"];
  delete CodeMirror.keyMap.default["Cmd-U"];

  if (navigator.platform === 'iPad' || navigator.platform === 'iPhone' || navigator.maxTouchPoints > 1) {
    window.IS_TOUCH_DEVICE = 1;
    CodeMirror.inputStyles.contenteditable.prototype.setUneditable = function() {
    };
  }
        
  editor = CodeMirror.fromTextArea(te, {
    mode: {
      name:"markdown"
    },
    firstLineNumber: 0,
    lineNumbers: false,
    foldGutter: false,
    dragDrop: false,
    matchBrackets: true,
    autoCloseBrackets: false,
    showCursorWhenSelecting: true,
    lineWrapping: true,
    cursorHeight: 1,
    cursorScrollMargin: 3,
    styleActiveLine: false,
    tabSize: 2,
    indentWithTabs: false,
    spellcheck: false,
    autocorrect: false,
    autocomplete: false,
    xscrollbarStyle: "simple",
    xgutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    xinputStyle: 'contenteditable',
    xviewportMargin:1000,
    foldOptions: {
      widget: function(from, to) {
        return "...";
      }
    }
  });

  editor.addKeyMap({
    Enter: function(cm) {
      if (cm.somethingSelected()) {
        return CodeMirror.Pass;
      }
      else {
        var cl = cm.getCurrentLine();
        var ll = cm.getLastLine();
        if (cl.match(/^\t+$/) && ll) {
          if (ll.match(/^\s*[\-\*\+] /) || ll.match(/^\s+$/)) {
            cm.execCommand('indentLess');
            return;
          }
        }
        
        return CodeMirror.Pass;
      }
    },
    Tab: function(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection("add");
        return;
      }

      if (cm.options.indentWithTabs) {
        cm.replaceSelection("\t", "end", "+input");
      }
      else {
        cm.execCommand("insertSoftTab");
      }
    },
    "Shift-Tab": function(cm) {
      cm.indentSelection("subtract");
    }
  });

  if (window.IS_TOUCH_DEVICE) {
    initEditorTouch();
  }
  else {
    var cls = document.getElementsByClassName('CodeMirror-cursors')[0].previousElementSibling;
    /* needed to highlight text with background color */
    cls.style.opacity = 0.5;
    cls.style.zIndex = 10;

    initEditorDesktop();
  }
}

function initUndoManager() {
  var e = document.createElement('textarea');
  document.body.appendChild(e);
  e.focus();
  setTimeout(function() {
    document.execCommand('insertText', 0, '');
    e.remove();
  },0);
}

function initEvents() {
  //initUndoManager();

  editor.on('dblclick', function(cm, evt) {
    var target = evt.target;
    if (target.tagName == 'IMG' && $('ui_cropframe').length == 0) {
      editor.execCommand('selectNone')      
      $(target).crop({
        frame:'sec_img-frame',
        callback:function() {
          try {
            var info = imgFrameToInfo(target);
            var block = target.parentElement.dataset['block'];
            var name = target.dataset['filename'];
            if (block.length > 0 && name) {
              var range = editor.findRangeForBlock(target.parentElement);
              replaceImgInfo(range.anchor, range.head, name, info);
              editor.execCommand('selectNone')      
            }
          }
          catch(ex) {
            console.log(ex);
          }
          target.parentElement.classList.add('cropped');
        }
      });
      evt.preventDefault();
      return false;
    }
  });

  editor.on('dragstart', function(cm, e) {
    e.preventDefault();
    return false;
  });

  editor.on('xpaste', function(data, e) {
  });

  window.addEventListener('xcut', function(evt) {
  });

  window.addEventListener('xcopy', function(evt) {
  });

  editor.on('changes', function(cm, changes) {
    var marks = 0;
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i];
      marks += makeEntities(cm.getDoc(), change.from.line, change.to.line + change.text.length);
      clearPluginOutput(cm.getDoc(), change.from.line, change.to.line);
    }

    if (window.CONFIG.show_spelling_errors) {
      exec_once('cm_update_spelling', 1000, function() {
        window.sendWindowMessage({cmd:'spellcheck', value:cm.getValue()});
      });
    }
  });

  editor.on('blur', function(cm) {
    cm.save();
  });
}

function startEditor(el) {
  if (!window.CONFIG) window.CONFIG = {};
  window.CONFIG.show_spelling_errors = true;

  var pref = el.dataset['image_prefix'];
  if (pref) CONFIG.image_prefix = pref;

  initEditor(el);

  var doc = editor.getDoc();

  markClean();
  refreshContent();

  doc.clearHistory();
  doc.markClean();
  
  initEvents();
        
  editor.focus();
}
