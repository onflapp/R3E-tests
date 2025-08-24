function updateTags() {
  $('.editor:not(.active) .sec_prompt-tag').each(function(n, it) {
    it.innerHTML = '';    
  });
  $('.editor.selected .sec_prompt-tag').each(function(n, it) {
    let tt = '[TEXT'+(n+1)+']';
    it.innerHTML = tt;
  });
}

function getRectForEl(el) {
  return {
    x:el.offsetLeft,
    y:el.offsetTop,
    width:el.offsetWidth,
    height:el.offsetHeight
  };
}

function drawBackground() {
  let view = $('.view').get(0);
  let svg = $('.sec_background').get(0);
  svg.style.width = view.clientWidth;
  svg.style.height = view.clientHeight;

  let draw = [];
  let width = 0;

  let lw = $('.sec_libs').outerHeight();

  draw.push(`<text class="label" x="25" y="30">Facts and Truths</text>`);
  draw.push(`<text class="label" x="25" y="${lw+30}">Base Texts</text>`);

  $('.rows').each(function(n, row) {
    let ed = row.previousElementSibling;
    if (ed && ed.classList.contains('editor') && row.childElementCount > 0) {
      let rect = getRectForEl(ed);//ed.getBoundingClientRect();
      let x1 = rect.x + rect.width;
      let y1 = rect.y + (rect.height / 2);
      draw.push(`<circle class="con" cx="${x1-1}" cy="${y1}" r="6" fill="black" />`);

      for (let i = 0; i < row.children.length; i++) {
        let it = row.children[i].children[0].children[0];

        rect = getRectForEl(it);//it.getBoundingClientRect();
        let x2 = rect.x;
        let y2 = rect.y + (rect.height/2);
        draw.push(`<circle class="con" cx="${x2+1}" cy="${y2}" r="6" fill="black" />`);

        draw.push(`<line class="con" x1="${x1+2}" y1="${y1}" x2="${x2-2}" y2="${y2}" stroke="black" />`);
      }
    }
    if (width == 0 && ed && ed.classList.contains('editor')) {
      width = getRectForEl(ed).width + 50;
    }
  });

  if (width > 0) {
    draw.unshift(`<text class="label" x="${width+25}" y="${lw+30}">Derivatives</text>`);
    draw.unshift(`<line class="cona" x1="${width}" y1="${lw}" x2="${width}" y2="100%" stroke="black" />`);
  }

  svg.innerHTML = draw.join('');
}

function getEditorChildren(target) {
  let $rows = $(target).parents('.rows').first();
  return $rows.children('.box').children('.content').children('.editor:not(.output)');
}

function initDragger() {
  drawBackground();
  $('.view').dragger({
    useHandle: true,
    isFreehand: true,
    onstart:function(target) {
      if (this.isResizing) return true;
      if (this.isScrolling) return true;
      //if (document.body.classList.contains('edit')) return false;
      //if (target.classList.contains('active')) return true;
      return false;
    },
    onresizing:function(target, size) {
      if (target.classList.contains('output')) return;
      getEditorChildren(target).each(function(n, it) {
        let $it = $(it);
        
        it.style.width = size.width+'px';
        if (it == target) {
          it.style.height = size.height+'px';
        }
        
        drawBackground();
      });
      this.actions++;
    },
    onresized:function(target) {
      let forms = [];
      if (target.classList.contains('output')) return;
      getEditorChildren(target).each(function(n, it) {
        let $it = $(it);
        let $form = $it.find('[data-cmd=update]');
        
        $form.find('[name=height]').val(it.clientHeight);
        $form.find('[name=width]').val(it.clientWidth);

        forms.push($form.get(0));
      });

      let save = function() {
        let form = forms.shift();
        if (form) {
          submitFormAsync(form, function() { save() });
        }
      };
      save();
    },
    getScrollableItem:function(target) {
      var $item = $(target);
      if ($item.hasClass('editor') || $item.parents('.editor').length) return null;
      else return $('.sec_scroll-view').get(0);
    },
    onscrolled:function(target) {
      console.log('scrolled');
    }
  });
}

$(document).on('mousedown', '.sec_scroll-view', function(evt) { 
  //prevents click event when drag select textarea
  window.__mouseDownEl = evt.target;
});

$(document).on('click', '.sec_scroll-view', function(evt) {
  let $item = $(evt.target);
  let eel = window.__mouseDownEl;

  window.__mouseDownEl = null;

  if (eel && evt.target != eel) return;
  if ($item.hasClass('editor')) return;
  if ($item.parents('.editor').length) return;
  
  $('.active').removeClass('active');
  $('.selected').removeClass('selected');
  $('.edit').removeClass('edit');
  $('.visible').removeClass('visible');
  $('.mode_edit').removeClass('mode_edit');

  evt.preventDefault();
  evt.stopPropagation();
});

$(document).on('mousedown', '.sec_textarea, .editor', function(evt) {
  if (evt.detail > 1) return; //double click

  let $item = $(evt.target);
  if (!$item.hasClass('editor')) $item = $item.parents('.editor');

  if (evt.ctrlKey || evt.shiftKey || evt.metaKey || evt.altKey) {
    if ($item.hasClass('selected')) {
      $item.removeClass('selected');
      updateTags();
    }
    else if (!$item.hasClass('active') && !$item.hasClass('output')) {
      $item.addClass('selected');
      updateTags();

      let tt = $item.find('.sec_prompt-tag').html();
      let te = document.activeElement;
      if (te && (te.tagName == 'INPUT' || te.tagName == 'TEXTAREA')) {
        document.execCommand('insertText', false, tt);
      }
    }
    evt.preventDefault();
    evt.stopPropagation();
  }
  else {
    if ($item.hasClass('active')) {
      if ($(evt.target).parents('.ui_button-act.mode_edit.visible').length) {
        return;
      }
      else if ($item.find('.ui_button-act.mode_edit.visible').length) {
        $('.edit').removeClass('edit');
        $('.visible').removeClass('visible');
        $('.mode_edit').removeClass('mode_edit');
      }
    }
    else {
      $('.selected').removeClass('selected');
      $('.active').removeClass('active');
      $('.edit').removeClass('edit');
      $('.visible').removeClass('visible');
      $('.mode_edit').removeClass('mode_edit');

      $item.addClass('active');
      $item.find('.sec_prompt-tag').html('[TEXT]');

      setTimeout(function() {
        $item.get(0).scrollIntoViewIfNeeded();//scrollIntoView({ behavior: "smooth"});
      },100);
    }
  }
});

$(document).on('click', '.ui_button-act', function(evt) {
  setTimeout(function() {
    let $el = $('.mode_edit.visible .sec_actions-tools');
    if ($el.length) {
      $el.get(0).scrollIntoViewIfNeeded();//scrollIntoView({ behavior: "smooth"});
    }
  },100);
});

$(document).on('click', '.act_externalize', function(evt) {
  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('textarea');
  let $cmd = $item.find('.sec_prompt-text');

  let txt = $text.val().trim();
  let kls = 'extract the most important keywords and terms from [TEXT] as list ';
  let cmd = $cmd.val().trim();

  if (txt.length) {
    txt = preparePrompt(kls, selectedTexts());
    //console.log(txt);

    $item.addClass('transforming');
    transform(txt, function(rv) {
      $item.removeClass('transforming');

      $('.edit').removeClass('edit');
      $('.visible').removeClass('visible');
      $('.mode_edit').removeClass('mode_edit');

      externalSearch(cmd, rv);
    });
  }

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_transform', function(evt) {
  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('textarea');
  let $cmd = $item.find('.sec_prompt-text');
  let $prompt = $(evt.target).find('.sec_prompt-value');
  let save = true;

  let txt = $text.val().trim();
  let cmd = $cmd.val().trim();
  
  if ($prompt.length) {
    cmd = $prompt.html();
    save = false;
  }

  if (txt.length) {
    txt = preparePrompt(cmd, selectedTexts(), baseTexts());
    console.log(txt);

    $item.addClass('transforming');
    transform(txt, function(rv) {
      $item.removeClass('transforming');

      let $form = $item.find('[data-cmd=trans]').last();
      let f = $form.children().first().get(0);
      f.value = rv;

      saveHighlightMode('.editor');

      if (save) {
        $item.find('input[name=prompt]').val(cmd);
        $item.find('[data-cmd=prompt] input[name=value]').val(cmd);

        submitFormAsync($item.find('[data-cmd=prompt]').get(0), function() {
          submitFormAsync($item.find('[data-cmd=update]').get(0), function() {
            $form.trigger('submit');
          });
        });
      }
      else {
        $item.find('input[name=prompt]').val(cmd);

        submitFormAsync($item.find('[data-cmd=update]').get(0), function() {
          $form.trigger('submit');
        });
      }
    });
  }

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_merge', function(evt) {
  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('textarea');
  let $other = $item.parents('.rows').parents('.content').find('.editor').first();

  let txt = $text.val().trim();
  
  if (txt.length) {
    let $form = $other.find('[data-cmd=update]');
    let f = $form.children().first().get(0);
    f.value = txt;

    saveHighlightMode('.editor');

    submitFormAsync($item.find('[data-cmd=delete]').get(0), function() {
      $form.trigger('submit');
    });
  }

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_add', function(evt) {
  let $item = $(evt.target).parents('.editor');

  saveHighlightMode('.editor');
});

$(document).on('dblclick', '.act_preview', function(evt) {
  let $item = $(evt.target).parents('.editor');
  let url = $item.data('href');

  window.open(url+'.@preview');

  saveScrollView();
  saveHighlightMode('.editor');
});

$(document).on('click', '.act_edit', function(evt) {
  let $item = $(evt.target).parents('.editor');

  saveScrollView();  
  saveHighlightMode('.editor');
});

$(document).on('click', '.act_clone', function(evt) {
  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('textarea');

  let txt = selectedTexts().join('\n\n---\n\n');
  
  if (txt.length) {
    let $form = $item.find('[data-cmd=clone]');
    let f = $form.children().first().get(0);
    f.value = txt;

    $form.find('[name=width]').val($item.get(0).clientWidth);

    saveHighlightMode('.editor');
    
    submitFormAsync($item.find('[data-cmd=update]').get(0), function() {
      $form.trigger('submit');
    });
  }

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_format', function(evt) {
  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('textarea');

  let txt = $text.val().trim();
  
  if (txt.length) {
    let $form = $item.find('[data-cmd=format]');
    let f = $form.children().first().get(0);
    f.value = txt;

    saveHighlightMode('.editor');

    submitFormAsync($item.find('[data-cmd=update]').get(0), function() {
      $form.trigger('submit');
    });
  }

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_popup-prompts', function(evt) {
  evt.preventDefault();

  let path = $(evt.target).attr('href');
  popupPath(0, path, function(item) {
    if (item) {
      $('.sec_prompt-text').val(item);
    }
  });
});

$(document).on('click', '.act_show-righ-panel', function(evt) {
  evt.preventDefault();

  let txt = window.getSelection().toString();
  if (!txt) txt = '';

  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('.sec_prompt-text');

  $text.val(txt);
});

$(document).on('click', '.act_show-bottom-panel', function(evt) {
  evt.preventDefault();

  let txt = window.getSelection().toString();
  if (!txt) txt = '';

  let $item = $(evt.target).parents('.editor');
  let $text = $item.find('[data-cmd=add]').children().first();

  $text.val(txt);

  let w = $item.find('.sec_textarea [data-cmd=update] input[name=width]').val();

  $item.find('[data-cmd=add]   input[name=width]').val(w);
  $item.find('[data-cmd=clone] input[name=width]').val(w);
});

$(document).on('submit', '.act_search', function(evt) {
  let txt = window.getSelection().toString();

  if (txt) {
    $(evt.target).find('[name=q]').val(txt);
  }
  else {
    txt = $(evt.target).find('[name=q]').val();
  }

  searchFragments(txt);

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_search-clear', function(evt) {
  $(evt.target.form).find('[name=q]').val('');

  searchFragments('');

  evt.stopPropagation();
  evt.preventDefault();
});

$(document).on('click', '.act_zoom', function(evt) {
  let x = $(evt.target).data('zoom');
  let view = $('.view').get(0);

  let v = Number.parseFloat(view.style.zoom);
  if (isNaN(v)) v = 1;
  if (x == '+') v += 0.1;
  if (x == '-') v -= 0.1;
  if (x == '1') v = 1;

  view.style.zoom = v;

  saveScrollView();  

  evt.stopPropagation();
  evt.preventDefault();
});
