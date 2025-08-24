function makeRange(from, to) {
  var range = {
    from: function() { return from },
    to: function() { return to },
  };

  return range;
}

function getBoundingRectForSelection() {
  if (window.IS_TOUCH_DEVICE) {
    var sel = window.getSelection();
    if (sel.rangeCount) {
      var r = sel.getRangeAt(0);
      var p = r.getBoundingClientRect();
      return p;
    }
    else return null;
  }
  else {
    var el = document.querySelector('.CodeMirror-cursor');
    var p = el.getBoundingClientRect();
    return p;
  }
}

function selectWidget(doc, el) {
  var r = document.createRange();
  var s = document.getSelection();
  
  /*
  s.removeAllRanges();
  r.setStart(el, 0);
  r.collapse(true);
  s.addRange(r);
*/
  s.removeAllRanges();
  r.collapse(false);
  r.selectNode(el);
  s.addRange(r);
}

function clearLineWidget(it) {
  var l = it.widgets;
  if (l) {
    var sz = l.length;
    for (var i = 0; i < sz; i++) {
      l[i].clear();
    }
  }
}

function getElementClass(it, start, end) {
  var st = it.styles;
  if (!st) return [];

  var cls = {};
  var inside = false;

  for (var i = 0; i < st.length; i++) {
    var x = st[i];
    if (x == start) {
      inside = true;
    }
    else if (x == end) {
      inside = false;
    }
    else if (inside && typeof x == 'string') {
      var a = x.split(' ');
      for (var z = 0; z < a.length; z++) {
        var s = a[z];
        cls[s] = s;
      }
    }
  }

  return Object.keys(cls);
}


function getHandleLineClass(it) {
  var st = it.styleClasses;
  if (!st) return false;
  return st.textClass;
}

function orderRange(range) {
  var a = range.anchor;
  var b = range.head;

  if (b.line < a.line) {
    range.anchor = b;
    range.head = a;
  }
  else if (a.line == b.line && b.ch < a.ch) {
    range.anchor = b;
    range.head = a;
  }

  return range;
}

function handleOpenLink(t) {
  var u = null;
  var a = null;
  
  a = t.match(/^\[([\w-\._]+)\]$/);
  if (!a) a = t.match(/^\[\[(\w.*?\w)\]\]$/);
  if (!a) a = t.match(/^([\w-\._]+)$/);
  if (!a) a = t.match(/^dn:\/\/([\w-\._]+)$/);
  if (!a) a = t.match(/^dn:([\w-\._]+)$/);

  if (a) {
    var title = a[1];
    var page = getPageTitleFromOutline(title);
    if (page) {
      loadFile(page.file);
      return;
    }
    else {
      u = 'dn://' + title;
    }
  }
  
  a = t.match(/^<?([a-z]+:.*?)>?$/);

  if (a) {
    u = a[1];
  }
  if (!a) {
    a = t.match(/^<?(\w.*?@\w.*?)>?$/);
    if (a) u = 'mailto:' + a[1];
  }

  if (u) {
    var info = {
      action:'UI_open_link',
      href: u
    }

    window.sendWindowMessage(info);
  }
}

function getInfoForSelection() {
  var info = {};
  var sel = editor.getSelectedWord();

  if (sel) {
    if (a = sel.match(/^\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)$/)) {
      info.name = a[1];
      info.src  = a[2];
      info.href = a[3];
    }
    else if (a = sel.match(/^\[(.*?)\]\((.*?)\)$/)) {
      info.name = a[1];
      info.href = a[2];
    }
    else {
      info.name = sel;
    }

    return info;
  }
  else {
    return null;
  }
}

function getInfoForContext() {
  var sel = getBoundingRectForSelection();
  if (sel) {
    return {
      x: Math.ceil(sel.x),
      y: Math.ceil(sel.y),
      w: Math.ceil(sel.width),
      h: Math.ceil(sel.height)
    };
  }
  else return {};
}

function getPositionForMarkEl(doc, el) {
  var marks = doc.getAllMarks();
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark.widgetNode == el) {
      var p = mark.find();
      return p;
    }
  }
  return null;
}

function getWidgetEl(el) {
  if (!el) return null;
  if (el.classList.contains('CodeMirror-widget')) return el;
  var p = el.parentElement;
  while (p != null) {
    if (p.classList.contains('CodeMirror-widget')) return p;
    p = p.parentElement;
  }
  return null;
}

function History() {
  this.history = [];
  this.index = -1;
  this.visit = function(url) {
    this.history[++this.index] = url;
  }

  this.current = function() {
    return this.history[this.index];
  }

  this.back = function() {
    this.index = Math.max(0,--this.index);
    return this.history[this.index];
  }

  this.forward = function() {
    this.index = Math.min(this.history.length-1,++this.index);
    return this.history[this.index];
  }

  this.clear = function() {
    this.history = [];
    this.index = -1;
  }
}
