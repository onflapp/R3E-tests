ImageEntities = {
  SEP_S:'\t\r\n',
  //![image](/img.png)
  parse: function(text, cb) {
    let sz = text.length;
    let ch = '';
    let word = [];
    let rv = [];

    let intag = false;
    let inimg = false;
    for (let i = 0; i < sz; i++) {
      let ch = text.charAt(i);
      let ch_last = text.charAt(i-1);
      let ch_next = text.charAt(i+1);
      if (intag == false && ch == '[' && ch_last == '!') {
        intag = true;
      }
      else if (intag && ch == '(' && ch_last == ']') {
        inimg = true;
      }
      else if (inimg && (ch == ')' || this.SEP_S.indexOf(ch) != -1)) {
        intag = false;
        inimg = false;
        let v = cb(word.join(''));
        if (v) rv.push(v);
        word = [];
      }
      else if (inimg) {
        word.push(ch);
        continue;
      }
      rv.push(ch);
    }

    return rv.join('');
  }
};

TextEntities = {
  SEP_C:'/.,;:-,()[]{}\'"',
  SEP_S:' \t\r\n',
  
  is_separator: function(ch, ch_last, ch_next) {
    if (ch == '') return true;
    if (ch == '@') {
      if (ch_last == '') return false;
    }
    if (ch == '#') {
      if (ch_last == '/') return true;
      if (ch_last == '#') return true;
      if (ch_next.match(/^\w/)) return false;
      if (ch_last == '') return false;
    }
    if (this.SEP_C.indexOf(ch) != -1) return true;
    if (this.SEP_S.indexOf(ch) != -1) return true;

    return false;
  },

  parse: function(text, cb) {
    let sz = text.length;
    let ch = '';
    let word = [];
    let rv = [];

    for (let i = 0; i < sz; i++) {
      let ch = text.charAt(i);
      let ch_last = text.charAt(i-1);
      let ch_next = text.charAt(i+1);
      if (this.is_separator(ch, ch_last, ch_next)) {
        if (word.length > 0) {
          let w = word.join('');
          let v = cb(w);
          if (v) rv.push(v);
          else rv.push(w);
        }
        word = [];
        rv.push(ch);
      }
      else {
        word.push(ch);
      }
    }
    if (word.length > 0) {
      let w = word.join('');
      let v = cb(w);
      if (v) rv.push(v);
      else rv.push(w);
    }

    return rv.join('');
  },

  titleline: function(text) {
    let a = text.split('\n');
    let rv = [];
    let sz = a.length;

    for (let i = 0; i < sz; i++) {
      let t = a[i].trim();
      if (t.indexOf(':') == 0) continue;
      if (t.indexOf('!') == 0) continue;
      if (t.indexOf('~') == 0) continue;

      if (t.length > 0) {
        rv.push(t);
        break;
      }
    }

    if (rv.length) {
      let t = rv.join(' ');
      t = t.replace(/^\W+\s*/, '');
      t = t.replace(/#.*$/, '');
      if (t.length > 32) t = t.substr(0, 32);
      return t;
    }
    else return null;
  },

  replaceAll: function(text) {
    let t = text;
    t = t.replace(/=>/g, '&rArr;');
    t = t.replace(/->/g, '&rarr;');
    return t;
  }
};
/*
let x = 'hello there\n![image](notes_image_11/Whitehead%27s_Trogon_0A2A5728.jpg_r/w296h266x-146y-47.png)\nhello there\nimage\n\n\n![image](notes_image_11/Whitehead%27s_Trogon_0A2A5728.jpg_r/w211h166x-171y-148.png)\n\n';

let z = ImageEntities.parse(x, function(word) {
  return 'xxx';
});

console.log(x+'<');
console.log('---');
console.log(z+'<');
*/
/*
let x =
`@vv aaa-aaa@aaa.com \na/ ##AAA #dw A dsffdsfsdf #TBD\n- @aaa.dddd\ntodo:@aaa sdfsdfsdf `;

let z = TextParser.parse(x, function(word) {
  if (word.charAt(0) == '@' && word.length > 2) {
    return '<'+word+'>';
  }
  if (word.charAt(0) == '#' && word.length > 2) {
    return '<'+word+'>';
  }
});

console.log(x+'<');
console.log('---');
console.log(z+'<');
*/
