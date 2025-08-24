function __resetPageMarker(mark, settings) {
  var opts = {
    from:mark.from,
    to:mark.to,
    inclusiveRight: true,
    inclusiveLeft: true
  };

  for (var k in settings) {
    opts[k] = settings[k];
  }

  mark.clear();
  var it = mark.doc.markText({line: mark.from, ch: 0}, {line: mark.to}, opts);
  it['xtype'] = 2;
  it['page'] = mark.page;
  
  return it;
}

CodeMirror.prototype.saveScrollOffset = function() {
  this.__last_scroll_offset = this.getScrollInfo();
  document.__last_scroll_offset = {top:document.scrollingElement.scrollTop};
};

CodeMirror.prototype.restoreScrollOffset = function() {
  if (this['__last_scroll_offset']) {
    this.scrollTo(0, 0);
    this.scrollTo(0, this.__last_scroll_offset.top);
    
    this.__last_scroll_offset = null;
  }
  if (document['__last_scroll_offset']) {
    document.scrollingElement.scrollTop = document.__last_scroll_offset.top;
  }
  document.__last_scroll_offset = null;
};

CodeMirror.prototype.openDialog = function(a, func) {
  func(window.SEARCH_TEXT);
};

CodeMirror.prototype.getSelectedWord = function() {
  var text = this.getSelection();
  return text;
};

CodeMirror.prototype.getContentValue = function() {
  var lines = [];
  var doc = this.getDoc();
  var from = 0;
  var to = this.lineCount();
  var inblock = false;

  doc.eachLine(from, to, function(it) {
    var text = it.text;
    var lineclass = getHandleLineClass(it);
    if ('cm-code-block' == lineclass) {
      if (inblock) return;
      else if (it.widgets) {
        var wid = it.widgets[0];
        text = wid.node.innerHTML;
        inblock = true;
      }
    }
    else {
      inblock = false;
    }

    lines.push(text);
  });
  return lines.join('\n');
};

CodeMirror.prototype.getContentInfo = function() {
  var doc = this.getDoc();
  var cur = this.getCursor();
  var index = doc.indexFromPos(cur);
  return {
    value: this.getValue(),
    index: index,
    line: cur.line,
    ch: cur.ch
  };
};

CodeMirror.prototype.insert = function(text, cur) {
  var doc = this.getDoc();
  doc.replaceRange(text, cur?cur:this.getCursor());
};

CodeMirror.prototype.deleteLine = function(line) {
  var doc = this.getDoc();
  var start = {line:line, ch:0};
  var end = {line:line+1, ch:0};
  doc.replaceRange('', start, end);
};

CodeMirror.prototype.replaceLine = function(text, line) {
  var doc = this.getDoc();
  var t = doc.getLine(line);
  var start = {line:line, ch:0};
  var end = {line:line, ch:t.length};
  doc.replaceRange(text, start, end);
};

CodeMirror.prototype.showAllLines = function() {
  var doc = this.getDoc();
  var to = editor.lineCount();
  var marks = doc.findMarks(CodeMirror.Pos(0, 0), CodeMirror.Pos(to, 0));
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark['xtype'] && mark.xtype == 1) {
      mark.clear();
    }
  }
};

CodeMirror.prototype.hideLine = function(line) {
  var doc = this.getDoc();
  var marks = doc.findMarks(CodeMirror.Pos(line, 0), CodeMirror.Pos(line));
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark['xtype'] && mark.xtype == 1) {
      return;
    }
  }
  
  var it = doc.markText({line: line, ch: 0}, {line: line}, {inclusiveRight: true, inclusiveLeft: true, collapsed: true, clearWhenEmpty:false});
  it.xtype = 1;
};

CodeMirror.prototype.replaceRangeAndSelect = function(text, start, end) {
  this.replaceRange(text, start, end);
  
  var ch = this.indexFromPos(start);
  end = this.posFromIndex(ch + text.length);

  this.setSelection(start, end);
};

CodeMirror.prototype.getWordAtCursor = function(cur) {
  var r = this.findWordAt(cur?cur:this.getCursor());
  return this.getRange(r.anchor, r.head);
};

CodeMirror.prototype.selectWordAtPos = function(x, y) {
  var coords = {left: x, top: y};
  var loc = this.coordsChar(coords);
  if (loc) {
    var r = this.findWordAt(loc);
    this.setSelection(r.anchor, r.head);
  }
};

CodeMirror.prototype.lineNo = function() {
  var cur = this.getCursor();
  return cur.line;
};

CodeMirror.prototype.getCurrentLine = function() {
  var cur = this.getCursor();
  return this.getLine(cur.line);
};

CodeMirror.prototype.getCurrentPage = function() {
  var cur = this.getCursor();
  var doc = this.getDoc();
  var marks = doc.findMarks(cur, cur);

  if (cur.line == 0) return 1;

  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark['xtype'] && mark.xtype == 2) {
      return mark.page;
    }
  }
  return -1;
};

CodeMirror.prototype.showPage = function(page) {
  var doc = this.getDoc();
  var marks = doc.getAllMarks();
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark['xtype'] && mark.xtype == 2) {
      if (mark.page == page) {
        __resetPageMarker(mark, {});
      }
      else {
        __resetPageMarker(mark, {collapsed:true});
      }
    }
  } 
};

CodeMirror.prototype.getLastLine = function() {
  var cur = this.getCursor();
  var l = cur.line;
  if (l == 0) return null;
  else return this.getLine(l-1);
};

CodeMirror.prototype.selectRange = function(index, len) {
  var doc = this.getDoc();
  var start = doc.posFromIndex(index);
  var end = doc.posFromIndex(index+len);
  this.setSelection(start, end);
};

CodeMirror.prototype.expandRangeLine = function(range) {
  var doc = this.getDoc();
  var start = range.head.line;
  var end = range.anchor.line;

  if (start == end) {
    end++;
  }
  else if (start > end) {
    var s = start;
    start = end;
    end = s;
  }
  else {
    end++;
  }

  return {
    anchor:{line:start, ch:0},
    head:{line:end, ch:0}
  };
};

CodeMirror.prototype.expandRange = function(range, pat) {
  var cs = 0;
  var ce = 0;

  var start = range.anchor.ch - 1;
  var line = range.anchor.line;

  while (start >= 0) {
    var str = this.getRange({ch:start,line:line}, {ch:start+1,line:line});
    if (!str.match(pat)) {
      break;
    }
    start--;
    cs++;
  }

  start = range.head.ch;
  line = range.head.line;

  var sz = this.getLine(line).length; 

  while (start < sz) {
    var str = this.getRange({ch:start,line:line}, {ch:start+1,line:line});
    if (!str.match(pat)) {
      break;
    }
    start++;
    ce++;
  }

  if (cs) range.anchor = {ch:range.anchor.ch - cs, line:range.anchor.line};
  if (ce) range.head = {ch:range.head.ch + ce, line:range.head.line};

  return range;
};

CodeMirror.prototype.eachSelectedLine = function(func) {
  var doc = this.getDoc();
  var range = this.listSelections()[0];
  var start = range.head.line;
  var end = range.anchor.line;

  if (start == end) {
    end++;
  }
  else if (start > end) {
    var s = start;
    start = end;
    end = s;
  }
  else {
    end++;
  }

  var lines = [];
  
  doc.eachLine(start, end, function(line) {
    var ch = line.text.length;
    var f = {line: line.lineNo(), ch: 0};
    var t = {line: line.lineNo(), ch: ch};
    
    var line = func(line.text, f, t);
    if (typeof line != 'undefined' && line != null) {
      lines.push(line);
    }
  });

  var text = lines.join('\n') + '\n';
  this.replaceRangeAndSelect(text, {line:start, ch:0}, {line:end, ch:0});
};

CodeMirror.prototype.getLineHandleAtPos = function(x, y) {
  var coords = {left: x, top: y};
  var loc = this.coordsChar(coords);
  if (loc) return this.getLineHandle(loc.line);
  else return null;
};

CodeMirror.prototype.setCursorAtPos = function(x, y) {
  var coords = {left: x, top: y};
  var loc = this.coordsChar(coords);
  if (loc) {
    this.setCursor(loc);
  }
};

CodeMirror.prototype.getSelectedRange = function() {
  var ls = this.listSelections();
  if (ls.length > 0) return ls[0];
  else return null;
}

CodeMirror.prototype.markSelectionRange = function(range) {
  var doc = this.getDoc();
  var prev = this['__selection_range_marker'];
  var selr = this['__selection_range'];
  
  if (prev) {
    doc.removeLineClass(selr.from().line, 'background');

    prev.clear();
    delete this['__selection_range_marker'];
    delete this['__selection_range'];
  }

  if (range) {
    var start = range.from();
    var end = range.to();

    var ls = editor.findMarks(start, end);
    if (ls.length) {
    }

    var mark = doc.markText(start, end, {
      className: 'cm-selection-marker'
    });
    
    this['__selection_range_marker'] = mark;
    this['__selection_range'] = range;

    var line = doc.addLineClass(start.line, 'background', 'CodeMirror-activemarker-background');
  }
};

CodeMirror.prototype.getSelectionRangeOrMarker = function() {
  var sel = this.getSelectedRange();
  if (sel) return sel;
  else return ['__selection_range'];
};

/*
CodeMirror.prototype.refreshAll = function() {
  var doc = this.getDoc();
  var end = doc.lineCount();

  this.operation(function() {
    makeMarks(doc, 0, end);
  });
};
*/

CodeMirror.prototype.old_setSelection = CodeMirror.prototype.setSelection;
CodeMirror.prototype.setSelection = function(a, b) {
  if (this['__ignore_selection']) return;
  CodeMirror.prototype.old_setSelection.call(this, a, b);
};

CodeMirror.prototype.old_findWordAt = CodeMirror.prototype.findWordAt;
CodeMirror.prototype.findWordAt = function(pos) {
  var range = CodeMirror.prototype.old_findWordAt.call(this, pos);
  var str = this.getRange(range.anchor, range.head);
  var len = 0;
  while(true) {
    if (str.charAt(len) === '_' && str.charAt(str.length - len - 1) === '_' && len < str.length) {
      len++;
    }
    else break;
  }
  if (len > 0) {
    range.anchor.ch += len;
    range.head.ch -= len;
  }
  return range;
};

CodeMirror.commands['selectNone'] = function(cm) {
  cm.setCursor(cm.getCursor());
  cm.setExtending(false);
};

CodeMirror.commands['selectWord'] = function(cm) {
  var r = cm.findWordAt(cm.getCursor());
  if (r) {
    cm.setSelection(r.anchor, r.head);
  }
};

CodeMirror.commands['selectLine'] = function(cm) {
  var cur = cm.getCursor();
  var f = {line:cur.line, ch:0};
  var t = {line:cur.line, ch:cm.getLine(cur.line).length};

  cm.setSelection(f, t);
};

CodeMirror.commands['newLineBefore'] = function(cm) {
  var cur = cm.getCursor();
  var f = {line:cur.line, ch:0};
  cm.insert('\n', f);
  cm.setCursor(f);
};
