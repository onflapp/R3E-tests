function externalizeImageSrc(url, img) {
  if (documentContent.constructor.name == 'LocalStorageResource') {
    window.R3E.context.renderResource(url, 'externalize').then(function(val) {
      if (val) img.src = val.content;
    });
  }
  else {
    img.src = url;
  }
}

function editFromSearchFilter() {
  if (editor['__search_filter']) {
    delete editor['__search_filter'];

    setTimeout(function () {
      var c = editor.getCursor();
    
      editor.operation(function() {
        switchToReadOnly(false);
        editor.showAllLines();
        editor.refresh();
        editor.setCursor(c);
        highlightCursor();
      });
    }, 100);
    
    return true;
  }
  else {
    return false;
  }
}

function refreshPageMarkers() {
  var doc = editor.getDoc();
  var from = 0;
  var to = editor.lineCount();
  var last = editor.lineCount();
  var pnum = 1;
  var line = 0;
  var pages = [];
  var info = {
    page: pnum,
    from: line,
    to: line
  };

  pages.push(info);

  var marks = doc.getAllMarks();
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark['xtype'] && mark.xtype == 2) {
      mark.clear();
    }
  }
 
  editor.eachLine(from, to, function(it) {
    var text = it.text;
    
    info.to = line++;
    if (text == '%' && line > 1 && line != last) {
      pnum++;
      info = {
        page: pnum,
        from: line,
        to: line
      };
      pages.push(info);
    }
  });
  if (pages.length == 1) return;

  for (var i = 0; i < pages.length; i++) {
    var info = pages[i];

    var opts = {
      from:info.from,
      to:info.to,
      startStyle:'cm-page-start',
      endStyle:'cm-page-end',
      inclusiveRight: true,
      inclusiveLeft: true
    };
    if (info.from == info.to) delete opts.endStyle;
    if (info.to == (last-1)) delete opts.endStyle;

    var it = doc.markText({line: info.from, ch: 0}, {line: info.to}, opts);
    it['xtype'] = 2;
    it['page'] = info.page;
  }
}

function showPage(page) {

}

function refreshSearchFilter() {
  var from = 0;
  var to = editor.lineCount();
  
  var qs = [];
  
  if (editor.state['search'] && window.CONFIG.search_filter) {
    if (editor.state.search.queryPrefix) qs = qs.concat(editor.state.search.queryPrefix);
    if (editor.state.search.query) qs.push(editor.state.search.query);
  }
  
  editor.operation(function() {
    if (qs.length == 0) {
      qs = null;
      editor.showAllLines();
      switchToReadOnly(false);
      delete editor['__search_filter'];
    }
    else {
      editor.showAllLines();
      filterLines(qs, from, to);
      editor['__search_filter'] = qs;
      switchToReadOnly(true);
    }
    editor.refresh();
  });
}

function filterLines(qs, from, to) {
  editor.eachLine(from, to, function(it) {
    var text = it.text;
    if (qs) {
      var rv = true;
      for (var i = 0; i < qs.length; i++) {
        var rx = qs[i];
        if (typeof rx == 'string') {
          if (text.indexOf(rx) === -1) {
            rv = false;
            break;
          }
        }
        else {
          if (!text.match(rx)) {
            rv = false;
            break;
          }
        }
      }
      if (!rv) {
        editor.hideLine(it.lineNo());
      }
    }
  });
}

function refreshContent() {
  if (window.REFRESHING) return;

  var doc = editor.getDoc();
  var end = doc.lineCount();
  
  window.REFRESHING = 1;
  editor.operation(function() {
    makeEntities(doc, 0, end);
    execPlugins(doc, 0, end);
    refreshIfClean();
    window.REFRESHING = 0;
  });
}

function markDirty() {
  if (window.DIRTY_UPDATES == 0) {
    editor.saveScrollOffset();
  }
  window.DIRTY_UPDATES++;
}

function markClean() {
  if (typeof window.DIRTY_UPDATES == 'undefined') window.DIRTY_UPDATES = 0;
  else if (window.DIRTY_UPDATES > 0) window.DIRTY_UPDATES--;

  refreshIfClean();
}

function refreshIfClean() {
  exec_once('refresh', 100, function() {
    if (window.DIRTY_UPDATES == 0) {
      editor.refresh();
      editor.restoreScrollOffset();
    }
  });
}

function findEntityAt(doc, pos, xtype) {
  var marks = doc.findMarks(pos, pos);
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark['xtype'] && mark.xtype == xtype) {
      return mark;
    }
  }
  return null;
}

function clearEntities(doc, from, to, xtype) {
  var count = 0;
  var marks = doc.findMarks(CodeMirror.Pos(from, 0), CodeMirror.Pos(to, 0));
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (!xtype) {
      mark.clear();
      count++;
    }
    else if (mark['xtype'] && mark.xtype == xtype) {
      mark.clear();
      count++;
    }
  }
  return count;
}

function makeEntities(doc, from, to) {
  var count = 0;
  count += clearEntities(doc, from, to, 3);

  if (window.CONFIG.show_source) return count;

  for (var i = 0; i < ENTITIES.length; i++) {
    var entity = ENTITIES[i];
    var re = entity.re;
    var makeElement = entity.makeElement;

    doc.eachLine(from, to, function(it) {
      var text = it.text;
      var line = it.lineNo();
      var lineclass = getHandleLineClass(it);

      if ('cm-code-block' == lineclass) return;

      while ((a = re.exec(text)) !== null) {
        var val = a[0];
        var start = re.lastIndex - val.length;
        var end = re.lastIndex;
        var elclass = getElementClass(it, start, end);
        var el = makeElement(val);

        if (el) {
          try {
            var m = doc.markText(CodeMirror.Pos(line, start), CodeMirror.Pos(line, end), {
              atomic: true,
              collapsed: true,
              handleMouseEvents: false,
              replacedWith: el
            });
            el.dataset['block'] = `${line}:${start}:${line}:${end}`;

            for (var i = 0; i < elclass.length; i++) {
              m.widgetNode.classList.add('cm-'+elclass[i]);
            }
            
            m.xtype = 3;
            count++;
          }
          catch (ex) {
          }
        }
      }
    });
  }

  return count;
}

ENTITIES = [
  {
    re:/\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)/g,
    makeElement:function(val) {
      var l = val.match(/\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)/);
      var name = l[1];
      var src  = l[2];
      var href = l[3];
      var w = href.match(/\-w(\d+)\./);
      
      var img = document.createElement("img");
      img.alt = name;
      img.setAttribute('data-filename', src);
      if (w) img.width = w[1];

      img.onload = img.onerror = function() {
        markClean();
      };

      img.src = window.CONFIG.image_prefix + src;

      var node = document.createElement("a");
      node.href = href;
      node.appendChild(img);

      markDirty();

      return node;
    }
  },
  {
    re:/\[[^\[]*?\]\(.*?\)/g,
    makeElement:function(val) {
      var l = val.match(/\[(.*?)\]\((.*?)\)/);
      var href = l[2];
      var name = l[1];
      var node = document.createElement("a");

      if (!href) return null;
      if (!name) name = href;

      node.href = href;
      node.innerHTML = name;

      return node;
    }
  },
  {
    re:/!\[.*?\]\(.*?\)/g,
    makeElement:function(val) {
      var l = val.match(/\[(.*?)\]\((.*?)\)/);
      var href = l[2];
      var name = l[1];
      var info = null;
      var i = href.lastIndexOf('_r/');
      if (i > 0) {
        info = href.substr(i+3);
        href = href.substr(0, i);
      }

      var node = document.createElement("img");
      var frame = document.createElement("div");
      var url = window.CONFIG.image_prefix + href;
      
      markDirty();

      node.alt = name;
      node.setAttribute('data-filename', href);
      if (info) node.setAttribute('data-info', info);

      node.onload = node.onerror = function() {
        markClean();
      };
      
      externalizeImageSrc(unescape(url), node);

      frame.classList.add('sec_img-frame');
      frame.appendChild(node);

      if (info) {
        infoToImgFrame(node, info);
        frame.classList.add('cropped');
      }

      return frame;
    }
  },
  {
    re:/^%%%(\s*([\w\-]+))?$/g,
    makeElement:function(val) {
      var node = document.createElement("span");
      node.innerText = '%';
      node.classList.add('cm-layout-marker');

      return node;
    }
  },
  {
    re:/%X_(.*?)_X/g,
    makeElement:function(val) {
      var node = document.createElement("span");
      node.innerHTML = '<input type="date"></input>';

      return node;
    }
  },
  {
    re:/(^---$)|(^\*\*\*$)|(^___$)/g,
    makeElement:function(val) {
      var node = document.createElement("span");
      node.innerText = '-';
      node.classList.add('cm-layout-marker');

      return node;
    }
  },
  {
    re:/(  )$/g,
    makeElement:function(val) {
      var node = document.createElement("span");
      node.innerText = '↩︎';
      node.classList.add('cm-layout-marker');

      return node;
    }
  }

];
