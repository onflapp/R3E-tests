function defaultOutlinePlugin(name, args, content, cb) {
  var tags = {};
  var links = [];
  var text = '<ul>';
  var lines = content.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.startsWith("#")) {
      line = line.replace(/#/g, '-');
      text += `<li class="cm-header" data-line="${i}">${line}</li>`;
    }
    else if (line.startsWith("--- ")) {
      line = line.substr(4);
      text += `<li class="cm-section" data-line="${i}">${line}</li>`;
    }

    var tl = line.match(/#[A-Z_]+/g);
    if (tl) {
      for (var x = 0; x < tl.length; x++) {
        var name = tl[x];
        tags[name] = name;
      }
    }

    /*
    var ll = line.match(/[^!]\[.*?\]\(.*?\)/g);
    if (ll) {
      for (var x = 0; x < ll.length; x++) {
        var link = ll[x];
        var a = line.match(/\[(.*?)\]/);
        if (a) {
          links.push({
            title:a[1],
            line:i
          });
        }
      }
    }
    
    var ll = line.match(/\[\[.*?\]\]/g);
    if (ll) {
      for (var x = 0; x < ll.length; x++) {
        var link = ll[x];
        var a = line.match(/\[\[(.*?)]\]/);
        if (a && !a[1].startsWith("[[[")) {
          links.push({
            title:a[1],
            line:i
          });
        }
      }
    }
    */
  }

  text += '</ul>';
  text += '<h3>Tags</h3>';

  for (var tag in tags) {
    var title = tag.substr(1);
    text += `<span class="cm-tag" data-find="${tag}">${title}</span>`;
    text += ' ';
  }

  /*
  text += '<h3>Links</h3>';

  for (var x = 0; x < links.length; x++) {
    var link = links[x];
    text += `<div data-line="${link.line}">${link.title}</div>`;
  }
  */
    
  cb(text);
}

function pluginFuncForName(name) {
  var func = null;
  if (window.PLUGINS_CUSTOM) func = window.PLUGINS_CUSTOM[name];
  if (func && typeof func == 'function') return func;
  else return window.PLUGINS[name];
}

function pipePlugin(name, args, lines, cb) {
  var plug = pluginFuncForName(name);
  if (!plug) {
    return false;
  }
  else {
    markDirty();
    try {
      plug(name, args, lines.join('\n'), function(data) {
        cb(data);
        markClean();
      });
    }
    catch (ex) {
      cb('error: ' + ex);
      markClean();
    }
    return true;
  }
}

function pipeOutlinePlugin(name, args, content, cb) {
  var plug = pluginFuncForName(name);
  if (!plug) {
    return false;
  }
  else {
    try {
      plug(name, args, content, function(data) {
        cb(data);
      });
    }
    catch (ex) {
      cb('error: ' + ex);
    }
    return true;
  }
}

function clearPluginOutput(doc, from, to) {
  if (from == to) to++;
  doc.eachLine(from, to, function(it) {
    clearLineWidget(it);
  });
}

function updateOutline(doc) {
  var mytitle = null;

  doc.eachLine(0, 10, function(it) {
    if (it.text.charAt(0) == '%' && it.text.length > 5) {
      var a = it.text.match("^%\\s?(\\w+):\\s?(\\w.+)$");
      if (a && a[1] == 'title') {
        mytitle = a[2].trim();
      }
    }
    else if (!mytitle && it.text.indexOf('# ') == 0) {
      mytitle = it.text.substr(2).trim();
    }
  });

  var page = getPageFromOutline(CURRENT_FILE);
  if (page && page.title != mytitle) page.title = mytitle;
}

function execOutlinePlugin(doc) {
  prepareCustomPlugins();
  updateOutline(doc);

  var tx = doc.getValue();
  var el = document.querySelector('#outline .pages');
  var pl = makePageOutline();
  el.innerHTML = pl;

  if (CURRENT_FILE) {
    selectPageInOutline(CURRENT_FILE);
  }

  var el = document.querySelector('#outline .plugin');
  pipeOutlinePlugin('outline', null, tx, function(data) {
    el.innerHTML = data;
  });
}

function execPlugins(doc, from, to) {
  var phead = null;
  var pstart = -1;
  var plines = [];

  doc.eachLine(from, to, function(it) {
    var text = it.text;
    var line = it.lineNo();
    var lineclass = getHandleLineClass(it);

    if ('cm-code-block' == lineclass) {
      clearLineWidget(it);

      if (!phead) {
        phead = text;
        pstart = line;
      }
      else {
        plines.push(text);
      }
    }
    else if (phead) {
      var pname = phead.replace(/^[\`~]*\s*/, '');
      if (pname.length > 0 && !window.CONFIG.show_source) {
        var args = pname.split(' ');
        pname = args.shift();
        plines.pop();

        var el = document.createElement('div');
        el.innerHTML = "...";

        var rv = pipePlugin(pname, args, plines, function(data) {
          el.innerHTML = data;
        });

        if (rv) {
          doc.addLineWidget(line-2, el, {className:'cm-plugin-output'});
        }
      }
      plines = [];
      phead = null;
      pstart = -1;
    }
  });
}

function prepareCustomPlugins() {
  window.PLUGINS_CUSTOM_EX = null;
  window.PLUGINS_CUSTOM = {};
  
  if (window['PLUGINS_CODE']) {
    var code = unescape(window['PLUGINS_CODE']);
    try {
      "use strict";
      var rv = eval('rv = '+code);
      window.PLUGINS_CUSTOM = rv;
      console.log(rv);
    }
    catch(ex) {
      window.PLUGINS_CUSTOM_EX = ''+ex;
      console.log(ex);
    }
  }
}

PLUGINS = {
  outline: function(name, args, content, cb) {
    if (window.PLUGINS_CUSTOM_EX) {
      cb('<p>custom plugin error: '+window.PLUGINS_CUSTOM_EX+'</p>');
    }
    else {
      defaultOutlinePlugin(name, args, content, cb);
    }
  },
  test: function(name, args, content, cb) {
    cb('<pre>test: args:' + args + '\ncontent:\n' + content + "</pre>");
  },
  include: function(name, args, content, cb) {
    var url = args[0];
    $.get(url, function(data) {
      cb(data);
    })
    .fail(function() {
      cb();
    });
  }
};
