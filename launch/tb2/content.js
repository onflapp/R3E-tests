function initContent(cb) {
  userSettings.values = {
    show_source: false
  };
  
  documentContent.values = {
    redirect:'/content/notes/main',
    _rt:'resource/redirect',
    notes:{
      main:{_rt:'notes/item'},
      tags:{_rt:'notes/tags', 'title':'tags'},
      refs:{_rt:'notes/tags', 'title':'mentions'},
      dates:{_rt:'notes/tags', 'title':'dates'},
      style:{_rt:'notes/style'},
      views:{_rt:'notes/views'},
      boards:{_rt:'notes/boards'}
    }
  };
  
  documentContent.values['style'] = MY_DEFAULT_STYLE['style'];  

  cb();
}

var MY_DEFAULT_STYLE = {
  "style": {
    "body_name": "Arial",
    "h1_name": "Arial",
    "h2_name": "Arial",
    "h3_name": "Arial",
    "body_size": "14",
    "h1_size": "20",
    "h2_size": "18",
    "h3_size": "16",
    "em_bold": "bold",
    "strong_bold": "bold",
    "h1_bold": "bold",
    "h2_bold": "bold",
    "h3_bold": "bold",
    "_rt": "text/style",
    "_md": "1750697717157"
  }
};
