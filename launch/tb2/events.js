function makeTimeStampFromTag(tag) {
  let a = tag.match(/^([1-9]|[1-3][0-9])(Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sep|Oct|Nov)(\d\d?\d?\d?)$/);
  if (a && a.length == 4) {
    let x = Date.parse(a[1]+' '+a[2]+' '+a[3]);
    return (x ? x : null);
  }
  else return null;
}

function makeDateTag(tag) {
  if (tag.match(/^#?([1-9]|[1-3][0-9])(Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sep|Oct|Nov)\d\d?\d?\d?$/)) return tag;
  else if (tag.match(/^#?([1-9]|[1-3][0-9])(Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sep|Oct|Nov)$/)) return tag+(new Date().getYear()-100);
  else return null;
}

function formatDateTag(d) {
  if (!d) return null;

  let v = Date.parse(d);
  let x = new Date(v)

  let mon = x.toLocaleDateString('en', {'month':'short'});
  let day = x.toLocaleDateString("en", {'day':'numeric'});
  let year = x.toLocaleDateString("en", {'year':'2-digit'});

  return day + mon + year;
}

function clearImageRenditions(base, $images, cb) {
  var todo = 0;
  var done = function() {
    if (todo == 0) cb();
  };

  todo = $images.length;
  $images.each(function (n, img) {
    var src = img.dataset['filename'];
    var path = base+'/'+src+'_r';

    submitDataAsync({':delete':path}, '#'+path, function() {
      todo--;
      done();
    });
  });
}

function saveEditorForm(sync, cb) {
  var $form = $('#editor');
  var form = $form.get(0);
  var change = formChanges(form);
  clearMode('edit');

  if (typeof editor == 'undefined') {
    console.log('no editor');
    cb();
    return;
  }

  editor.save();
  if (change > 0 || !editor.doc.isClean()) {
    var $images = $('.sec_img-frame.cropped img');

    if ($images.length > 0) {
      var base = $form.attr('action');
      postProcessImages(base, $images, function() {
        if (sync) {
          $form.trigger('submit');
          cb(true);
        }
        else if (form) {
          submitFormAsync(form, function() {
            //Utils.flushResourceCache();
            cb(true);
          });
        }
        else {
          cb(true);
        }
      });
    }
    else {
      if (sync) {
        $form.trigger('submit');
        cb(true);
      }
      else if (form) {
        submitFormAsync(form, function() {
          //Utils.flushResourceCache();
          cb(true);
        });
      }
      else {
        cb(true);
      }
    }
  }
  else {
    cb(false);
  }
}

function postProcessImages(base, $images, cb) {
  var todo = 0;
  var done = function() {
    if (todo == 0) cb();
  };
  
  todo = $images.length;
  console.log('post process images '+todo);

  //clear renditions
  clearImageRenditions(base, $images, function() {

    //render
    $images.renderToCanvas({
      callback:function(canvas, img) {
        var info = img.dataset['info'];
        var src = img.dataset['filename'];
        var path = base+'/'+src+'_r/'+info;

        //save the blob
        canvas.toBlob(function(blob) {
          submitDataAsync(blob, '#'+path, function() {
            todo--;
            done();
          });
        });
      }
    });
  });
}

function execPlugin(text, config, cb) {
  var path = 'plugin_content';
  var name = config.name;

  tempContent.values[path] = {
    _rt:`notes/plugins/${name}`,
    text:text,
    config:config
  };

  R3E.context.renderResource(`/temp/${path}`).then(function(rv) {
    cb(rv);
  });
}

function initEditView() {
  var el = document.getElementById('editor_textarea');
  restoreMode('edit');
  startEditor(el);

  $('.ui_draggable-list').dragger({
    ondropped:function(from, loc, to) {
      var f = from.dataset['item_ref'];
      var t = to.dataset['item_ref'];
      var n = Utils.filename(f);
      var data = {};

      if (loc == 'after') {
        var a = Utils.filename(t);
        t = Utils.filename_dir(t);
        t = Utils.filename_path_append(t, n);
        data = {
          '_rt':'notes/item',
          ':moveto':t,
          ':moveafter':a,
          ':transform':'reorder'
        };
      }
      else {
        t = Utils.filename_path_append(t, n);
        data = {
          '_rt':'notes/item',
          ':moveto':t,
          ':transform':'reorder'
        };
      }

      submitDataAsync(data, '#'+f, function() {
        var u = window.location.toString();
        u = u.substr(0, u.indexOf('#'));

        u += '#'+t;
        window.location.assign(u);
      });

      return true;
    }
  });
}

$(function () {
  $(document).on('click', '#show_navigation', function(evt) {
    clearMode('edit');
    document.body.classList.remove('mode_edit');
    document.body.classList.remove('edit');

    if (document.body.classList.contains('navigation')) {
      document.body.classList.remove('navigation');
    }
    else {
      saveEditorForm(false, function() {
        document.body.classList.add('navigation');
      });
    }

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('click', '#act_edit-note', function(evt) {
    setTimeout(function() {
      if (document.body.classList.contains('mode_edit')) {
        editor.focus();
      }
    }, 300);
  });

  $(document).on('click', '#add_link', function(evt) {
    let path = $(evt.target).attr('href');
    if (window.__selected_link) {
      path += '?href='+escape(window.__selected_link.href);
      path += '&title='+escape(window.__selected_link.title);
    }
    delete window.__selected_link;

    popupPath(0, path, function(item) {
      if (item) {
        let u = item.href;
        let t = item.title;

        if (!t) t = 'Untitled';

        editor.replaceSelection('['+t+']('+u+')');
        refreshContent();
        editor.focus();
      }
      else {
        editor.execCommand('selectNone');
      }
    });

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('click', '#act_append-page', function(evt) {
    if (evt.x == 0 && evt.y == 0) return;

    saveEditorForm(false, function() {
      saveMode('edit', true);
      evt.target.click();
    });

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('click', '#act_add-page', function(evt) {
    saveMode('edit', true);
    if (evt.x == 0 && evt.y == 0) return;

    saveEditorForm(false, function() {
      evt.target.click();
    });

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('click', '.act_save-note-end', function(evt) {
    if (!document.body.classList.contains('edit')) return;
    if (evt.x == 0 && evt.y == 0) return;

    saveEditorForm(false, function() {
      clearMode('edit');
      evt.target.click();
    });

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('click', '#act_save-note', function(evt) {
    $('img').crop('destroy');
    if (document.querySelector('#ui_popup')) {
      cancelPopupPath();
    }
    else {
      saveEditorForm(true, function(changes) {
        if (!changes) window.location.reload();
      });
    }

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('click', '#toggle_filter-short', function(evt) {
    toggleFilterMode('mode_filter-short');
    if (window['editor']) refreshContent();
    evt.preventDefault();
  });

  $(document).on('click', '#toggle_filter-img', function(evt) {
    toggleFilterMode('mode_filter-img');
    if (window['editor']) refreshContent();
    evt.preventDefault();
  });

  $(document).on('click', '#toggle_filter-cards', function(evt) {
    toggleFilterMode('mode_filter-cards');
    evt.preventDefault();
  });

  $(document).on('click', '#toggle_filter-preview', function(evt) {
    toggleFilterMode('mode_filter-preview');
    evt.preventDefault();
  });
  
  $(document).on('click', '.sec_note-editor-textarea', function(evt) {
    if (evt.target.classList.contains('sec_note-editor-textarea') && !document.body.classList.contains('cm-active')) {
      editor.focus();
    }
  });

  $(document).on('click', '.act_exec-code', function(evt) {
    let el = evt.target.querySelector('.sec-code_content');
    if (el) {
      let txt = unescape(el.textContent);
      let name = 'bash';
      execPlugin(txt, {name:name}, function(rv) {
        if (rv) {
          let out = document.createElement('div');
          out.innerHTML = rv.content;
          el.parentElement.parentElement.appendChild(out);
        }
      });
    }
    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('dblclick', '.act_nav-item img', function(evt) {
    let u = evt.target.src;
    let i = u.lastIndexOf('_r/');
    if (i > 0) u = u.substr(0, i);
    
    evt.stopPropagation();
    evt.preventDefault();

    sendWindowMessage({openExternal:unescape(u)});
  });
  
  $(document).on('click', '.act_nav-item', function(evt) {
    let base_url = $(evt.target).parents('[data-base_url]').data('base_url');
    let item_ref = $(evt.target).data('item_ref');
    let item_query = $(evt.target).data('item_query');
    let $item = $(evt.target);
    let selected = !(window.getSelection().isCollapsed);
    let stickie = document.body.classList.contains('page_note-stickie');

    if (!item_ref) {
      $item = $(evt.target).parents('[data-item_ref]');
      item_ref = $item.data('item_ref');
    }

    if (evt.target.classList.contains('act_exec-code')) return;
    //if (window.getSelection().type == 'Range') return;

    if (item_query) {
      let query_url = $(evt.target).parents('[data-base_query_url]').data('base_query_url');
      if (!query_url) query_url = window.location.toString().replace(/\?.*$/, '');
      let u = query_url + '?' + item_query;
      window.location.assign(u);
      evt.stopPropagation();
      evt.preventDefault();
      return;
    }

    if (evt.target.tagName == 'IMG') {
      document.getSelection().removeAllRanges();
      evt.preventDefault();
      return;
    }

    if (evt.target.tagName == 'A') {
      document.getSelection().removeAllRanges();
      let href = evt.target.getAttribute('href');

      if (href.indexOf('/') == 0) {
        let u = base_url + href;
        window.location.assign(u);
      }
      else {
        sendWindowMessage({openExternal:href});
      }

      evt.stopPropagation();
      evt.preventDefault();
      return;
    }

    if (item_ref && !selected) {
      window.location.assign(item_ref);
      evt.stopPropagation();
      evt.preventDefault();
      return;
    }

  });

  $(document).on('click', '.CodeMirror-code .cm-link', function(evt) {
    var t = evt.target.textContent;
    window.__selected_link = {
      href:t,
      title:t
    };

    var r = editor.findTextAt(editor.getCursor(), t);
    if (r) editor.setSelection(r.anchor, r.head);
    triggerAction('#add_link');
    evt.preventDefault();
  });

  $(document).on('click', '.CodeMirror-widget a', function(evt) {
    var t = evt.target.textContent;
    window.__selected_link = {
      href:evt.target.getAttribute('href'),
      title:t
    };

    var r = editor.findRangeForBlock(evt.target);
    if (r) editor.setSelection(r.anchor, r.head);
    triggerAction('#add_link');
    evt.preventDefault();
  });

  $(document).on('click', '#act_popup-info-show', function(evt) {
    evt.preventDefault();

    let path = $(evt.target).attr('href');
    saveEditorForm(false, function(changes) {
      popupPath(0, path, function(item) {
        if (item) {
          window.location.reload();
        }
      });
    });
  });
  
  $(document).on('click', '.act_popup-image-show', function(evt) {
    evt.preventDefault();

    let path = $(evt.target).attr('href');
    popupPath(0, path, function(item) {
      if (item) {
        editor.insert('\n![image]('+escape(item)+')\n');
        refreshContent();
        editor.focus();
      }
    });
  });

  $(document).on('click', '.act_popup-tags-show', function(evt) {
    evt.preventDefault();

    let path = $(evt.target).attr('href');
    let pref = $(evt.target).data('pref');
    popupPath(0, path, function(item) {
      if (item) {
        if (typeof item['date'] != 'undefined') {
          let d = formatDateTag(item['date']);
          if (d) editor.insert('#'+d);
        }
        else {
          editor.insert(`${pref}${item}`);
        }
        refreshContent();
        editor.focus();
      }
    });
  });

  $(document).on('dblclick', '.sec_note-list .sec_item.selected', function(evt) {
    let $item = $(evt.target);
    if (!$item.data('item_ref')) $item = $(evt.target).parents('[data-item_ref]');
    let item_ref = $item.data('item_ref');

    sendWindowMessage({openWindow:unescape(item_ref),type:'stickie'});

    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('dragstart', function(evt) {
    document.__dragel = evt.target;
  });

  $(document).on('dragend', function(evt) {
    delete document.__dragel;
  });

  $(document).on('dragenter', function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  });

  $(document).on('dragover', function(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (evt.target.tagName == 'INPUT') return;
    if (document.__dragel) return;

    let dropel = null;
    let $a = $(evt.target).parents('.act_drop');

    if (evt.target.classList.contains('act_drop')) dropel = evt.target;
    if ($a.length > 0) dropel = $a.get(0);

    if (dropel == null) return;
    if (dropel.classList.contains('dropping')) return;

    $('.dropping').removeClass('dropping');

    evt.dataTransfer.dropEffect = 'copy';
    dropel.classList.add('dropping');
  });

  $(document).on('dragleave', '.act_drop', function(evt) {
    let el = document.elementFromPoint(evt.x, evt.y);

    if (el) {
      if ($(el).parents('.dropping').length > 0) return;
      if ($(el).hasClass('dropping')) return;
    }

    $('.dropping').removeClass('dropping');
  });

  $(document).on('drop', function(evt) {
    $('.dropping').removeClass('dropping');

    evt.preventDefault();
    evt.stopPropagation();

    if (document.__dragel) return;

    let url = evt.dataTransfer.getData("text/uri-list");
    let text = evt.dataTransfer.getData("text/plain");
    let files = evt.dataTransfer.files;
    let target = null;

    if (evt.target.classList.contains('act_drop')) {
      target = evt.target;
    }
    if ($(evt.target).parents('.act_drop').length) {
      target = $(evt.target).parents('.act_drop')[0];
    }

    if (target) {
      let $file = $(target).find('[data-drop_type=file]');

      if (files.length && $file.length) {
        let $form = $file.parents('form');
        let dt = new DataTransfer();
        dt.items.add(files[0]);
        $file[0].files = dt.files;

        if ($form.find("[name=':forward']").length) {
          $form.trigger('submit');
        }
        else {
          submitFormAsync($form.get(0), function(data) {
            let item = data[':image']; //+ '/' + escape(data['image_name']);
            Utils.flushResourceCache();
            editor.insert('\n![image]('+item+')\n');
            refreshContent();
          });
        }
      }
      else if (url) {
        editor.insert(url);
        refreshContent();
      }
      else if (text) {
        editor.insert(text);
        refreshContent();
      }
    }
  });
});
