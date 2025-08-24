function transform(txt, cb) {
  let url = 'https://webproxy-193293931303.europe-west1.run.app';
  //let url = 'http://localhost:3000';

  if (window.IS_BALEBASEAPP) {
    url = window.location.protocol + '//' + window.location.host;
  }
  let apikey = 'sk-proj-lUsKsOhTXv4lp1Z4ayOeGtjKnUaWla8qQdMSF_e8tZ2AGVyvOTDzNaDeF3Gf_s21qKnSGwpM_fBkN8ea4CmcB3T3BlbkFJ7XzVd9Fl33w8WRZgkn8UgmayZGYZTOUmohxjTF80EQw91yaoM5d3EpWQNjGGzI_IXYOnzcbLcA';

  let response = fetch(`${url}/https://api.openai.com/v1/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apikey}`
    },
    body: JSON.stringify({
      'model':'gpt-4.1',
      'input':txt
    })
  });
  
  response.then(function(data) {
    data.json().then(function(rv) {
      if (rv) {
        let t = rv.output[0].content[0].text;
        t = removeHeader(t);
        t = cleanupText(t);
        cb(t);
      }
      else cb('error');
    }).catch(function(err) {
      cb('error:'+err);
    });
  });
}

function externalSearch(cmd, words) {
  let ls = words.split('\n');
  let q = [];
  
  if (cmd.length) {
    q.push(escape(cmd));
  }

  for (let i = 0; i < ls.length; i++) {
    if (q.length > 10) break;

    let word = ls[i].trim();
    if (word.indexOf('-') == 0 || word.indexOf('*') == 0) {
      word = word.substr(1).trim();
      word = escape(word);
      q.push(word);
    }
  }

  let href = 'https://www.google.com/search?client=safari&rls=en&q='+(q.join('+'))+'&ie=UTF-8&oe=UTF-8';
  sendWindowMessage({openExternal:href}); 
}

function get_file(path, cb) {
  let url = window.location.protocol + '//' + window.location.host;
  let response = fetch(url+'/file://'+escape(path), {
    method: 'GET'
  });
  
  response.then(function(data) {
    data.text().then(function(rv) {
      if (rv) {
        cb(rv);
      }
      else cb(null);
    });
  }).catch(function(ex) {
    console.log(ex);
    cb(null);
  });
}

function removeHeader(txt) {
  let lines = [];
  let l = txt.split('\n');
  let b = false;
  for (let i = 0; i < l.length; i++) {
    let line = l[i];
    if (!b) {
      if (line == '---') b = true;
      if (line == '') {
        if (l[i+1] == '---') {
          l[i+1] = '';
        }
        b = true;
      }
    }
    lines.push(line);
  }

  let la = lines[lines.length-1];
  if (la == '') {
    lines.pop();
  }

  la = lines[lines.length-1];
  let lb = lines[lines.length-2];
  let lc = lines[lines.length-3];
  if (la && la.indexOf('Let me know if you’d like') == 0 && lb == '' && lc == '---') {
    lines.pop();
    lines.pop();
    lines.pop();
  }

  return lines.join('\n').trim();
}

function markText(txt) {
  let lines = [];
  let l = txt.split('\n');
  for (let i = 0; i < l.length; i++) {
    let line = l[i];
    if (line.match(/\w/)) {
      line += '<!--'+escape(line)+'-->';
    }
    lines.push(line);
  }
  return lines.join('\n').trim();
}

function cleanupText(txt) {
  let lines = [];
  let l = txt.split('\n');

  for (let i = 0; i < l.length; i++) {
    let line = l[i];
    let nl = false;

    if (line.match(/ $/)) {
      line = line.trim();
      nl = true;
    }
    if (line.match(/^##* \*\*.*\*\*$/)) {
      line = line.replace(/^#### \*\*/, '#### ');
      line = line.replace(/^### \*\*/, '### ');
      line = line.replace(/^## \*\*/, '## ');
      line = line.replace(/^# \*\*/, '# ');
      line = line.replace(/\*\*$/, '');
      nl = true;
    }
    else if (line.match(/\*\*:$/)) {
      line = line.replace(/\*\*/g, '*');
    }
    else if (line.match(/\*\*/)) {
      line = line.replace(/\*\*/g, '*');
    }

    lines.push(line);
    if (nl) {
      lines.push('');
    }
    else if (line.match(/^##*/) && lines[i-1] != '') {
      lines.push('');
    }
  }
  return lines.join('\n').trim();
}

function saveScrollView() {
  let sv = $('.sec_scroll-view').get(0);
  let vv = $('.sec_scroll-view .view').get(0);
  let v = {
    scroll_x:sv.scrollLeft,
    scroll_y:sv.scrollTop,
    zoom:vv.style.zoom
  };

  sessionStorage.setItem('__LAST_SCROLL_VIEW', JSON.stringify(v));
}

function restoreScrollView() {
  let v = JSON.parse(sessionStorage.getItem('__LAST_SCROLL_VIEW'));
  let sv = $('.sec_scroll-view').get(0);
  let vv = $('.sec_scroll-view .view').get(0);

  if (!v) return;

  vv.style.zoom = v.zoom;
  sv.scrollLeft = v.scroll_x;
  sv.scrollTop = v.scroll_y;
}

function preparePrompt(cmd, docs, libs) {
  if (cmd.length == 0) {
    let txt = docs.join('\n');
    return txt;
  }
  else {
    let lib = '';
    let def  = 'Define "[TEXT]" as content between line containing text "===TEXT_FRAGMENT_START===" and line containing text "===TEXT_FRAGMENT_END===" .\n';
        def += 'Refer to content between line containing text "===TEXT_FRAGMENT_START===" and line containing text "===TEXT_FRAGMENT_END===" as [TEXT] .\n\n';
        def += 'Consider this as true and verified fact .\n\n';

    if (libs) {
      def += 'Consider all content between line containing text ===TRUETH_FRAGMENT_START=== and line containing text "===TRUETH_FRAGMENT_END===" as true and verified fact .\n';
      def += 'Refer to content between line containing text "===TRUETH_FRAGMENT_START===" and line containing text "===TRUETH_FRAGMENT_END===" as [FACT] .\n\n';
      def += 'Any text output must not contradict true and verified facts.\n\n';

      lib += '\n===TRUETH_FRAGMENT_START===\n';
      for (let i = 0; i <libs.length; i++) {
        let doc = libs[i];
        lib += '\n' + doc + '\n';
      }
      lib += '\n===TRUETH_FRAGMENT_END===\n';
      lib += '\n\n';
    }

    let txt = docs.shift();
    let con = '';

    con += '\n===TEXT_FRAGMENT_START===\n';
    con += txt;
    con += '\n===TEXT_FRAGMENT_END===\n';

    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i];
      let n = i+1;
      def += 'define "[TEXT'+n+']" as content between line containing text "===TEXT'+n+'_FRAGMENT_START===" and line containing text "===TEXT'+n+'_FRAGMENT_END==="\n';
      def += 'refer to content between line containing text "===TEXT'+n+'_FRAGMENT_START===" and line containing text "===TEXT'+n+'_FRAGMENT_END===" as [TEXT'+n+']\n';
      con += '\n===TEXT'+n+'_FRAGMENT_START===\n';
      con += doc;
      con += '\n===TEXT'+n+'_FRAGMENT_END===\n';
    }

    con += '\n\n';

    /*
    if (!cmd.match(/\[TEXT\]/i)) {
      cmd = 'do the following for content in [TEXT]:\n' + cmd;
    }
    */

    return def + lib + con + cmd;
  }
}

function baseTexts() {
  let rv = [];

  $('.sec_libs .editor .sec_textarea textarea').each(function(n, it) {
    rv.push(it.value.trim());
  });

  return rv;
}

function selectedTexts() {
  let rv = [];

  $('.editor.active .sec_textarea textarea').each(function(n, it) {
    rv.push(it.value.trim());
  });

  $('.editor.selected .sec_textarea textarea').each(function(n, it) {
    rv.push(it.value.trim());
  });

  return rv;
}

function searchFragments(word) {
  let ls = document.querySelectorAll('.markdown');

  if (word) {
    for (let i = 0; i < ls.length; i++) {
      let it = ls[i];
      let html = it.innerHTML;
      
      if (!it.__orig_html) it.__orig_html = html;
      
      html = html.replace(new RegExp(`(${word})`, 'g'), '<span class="filter_word">$1</span>');
      it.innerHTML = html;
    }

    document.body.classList.add('mode_filter');
  }
  else {
    for (let i = 0; i < ls.length; i++) {
      let it = ls[i];
      let html = it.__orig_html;
      if (html) it.innerHTML= it.__orig_html;
      delete it.__orig_html;
    }
 
    document.body.classList.remove('mode_filter');
  }
}
