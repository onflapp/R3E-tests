var docid = '';
var documentContent = null;
var documentConfig = null;
var userSettings = null;
var bundleData = null;
var sharedData = null;
var documentData = null;
var documentTemp = null;

try {
  docid = window.location.hash.match(/^#(\d+)/)[1];
}
catch(ex) { }

window.name = '_document';

//events
$(document).on('click', 'a.act_open-editor', function(evt) {
  sendWindowMessage({showEditorPath:unescape(evt.target.href)});
  evt.preventDefault();
});

$(document).on('click', 'a.act_open-external', function(evt) {
  sendWindowMessage({openExternal:unescape(evt.target.href)});
  evt.preventDefault();
});

function resizeWindow(width, height) {
  sendWindowMessage({resizeWindow:{width:width, height:height}});
}

function initViewModeObserver() {
  if (typeof window.sendWindowMessage == 'undefined') return;
  
  var cb = function(event, observer) {
    if (document.body.classList.contains('edit')) {
      window.sendWindowMessage({viewMode:'edit'});
    }
    else if (document.body.classList.contains('search')) {
      window.sendWindowMessage({viewMode:'search'});
    }
    else if (document.body.classList.contains('preview')) {
      window.sendWindowMessage({viewMode:'preview'});
    }
    else {
      window.sendWindowMessage({viewMode:'view'});
    }
  };
  
  var observer = new MutationObserver(cb);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    childList: false,
    characterData: false
  });
  
  cb();
}

window.newUUID = function(data, key) {
  var lastid = Tools.makeID(documentContent, 'LAST_ITEM_ID');
  var n = 'item';

  if (data && data['_rt'] && data['_rt'].length) {
    n = data['_rt'];
    n = Utils.expandValue(n, data);
    n = n.replaceAll('/', '_');
  }
  else if (data) {
    var z = '{'+key+'}/_rt';
    for (var k in data) {
      if (k.endsWith(z)) {
        n = data[k];
        n = Utils.expandValue(n, data);
        n = n.replaceAll('/', '_');
        break;
      }
    }
  }

  return n+'_'+lastid;
};

function initBaleBaseAppFuncs() {
  window.sendWindowMessage = function(msg) {
    if (msg['openExternal']) {
      window.open(msg['openExternal']);
    }
    else if (msg['openWindow']) {
      var u = msg['openWindow'];
      var t = msg['type'];
      var link = window.config.APP_PREFIX+u+'.@'+t; 
      window.open(link);
    }
    else if (msg['cmd'] && msg.cmd == 'syncClipboard') {
      try {
        navigator.clipboard.readText().then(function(txt) {
          window.handleWindowMessage({'cmd':'syncClipboardCB', 'text':txt});
        });
      }
      catch(ex) {}
    }
    else {
      console.log(msg);
    }
  };
  
  window.localStorage.getItem('_md');
  window.addEventListener('storage', function(evt) {
    if (evt.key == '_md' && frames.length == 0 && !document.body.classList.contains('mode_popup-visible')) {
      exec_once('reload', 0.1, function() {
        window.location.reload();
      });
    }
  });
}

//user content
var hc = Utils.makeHash(window.location.pathname);
if (!docid) {
  console.log('no docid found, using local storage!');

  documentContent = new LocalStorageResource({}, 'documentContent'+hc);

  bundleData = new ObjectResource({});
  sharedData = new ObjectResource({});
  documentData = new ObjectResource({});
  documentTemp = new ObjectResource({});

  documentConfig = new LocalStorageResource({}, 'documentConfig'+hc).wrap({
    getType: function() { return 'resource/config'; }
  });
}
else {
  documentContent = new StoredObjectResource(new RemoteResource(`/${docid}/`), 'content.json');
  documentContent.setExternalizeContent(true);

  bundleData = new RemoteResource('/BUNDLE/');
  sharedData = new RemoteResource('/SHARED/'); //home library - used to override
  documentData = new RemoteResource(`/${docid}/`);
  documentTemp = new RemoteResource(`/${docid}-TEMP/`);

  documentConfig = new RemoteResource(`/${docid}-CONTENT/`).wrap({
    getType: function() { return 'resource/config'; }
  });
}

//user session
var userSession = new ObjectResource({});
if (localStorage) userSession = new SessionStorageResource({}, 'usersession');

//user settings
var userSettings = new LocalStorageResource({}, 'userSettings'+hc).wrap({
  getType: function() { return 'resource/settings'; }
});

//system templates loaded by <script> and exposed as window.templates
var systemTemplates = new ObjectResource(window.templates).wrap({
  getType: function() { return 'resource/templates'; }
});

//temp object
var tempContent = new ObjectResource({});

//tempates for our own renderTypes
//var userTemplates = new StoredObjectResource(new RemoteResource(`/${docid}/`), 'templates.json').wrap({
var userTemplates = new StoredObjectResource(new RemoteResource(''), 'templates.json').wrap({
  getType: function() { return 'resource/templates'; }
});

var searchIndex = new JSONIndexResource().wrap({
  buildIndex: function(cb) {
    var self = this;
    documentContent.resolveItself(function() {
      self.addObject('/content', documentContent.values);
      cb();
    });
  }
});

var defaultTemplates = new ObjectResource({
  'resource': {
    'error': {
      'default.func': function(res, writer, context) {
        writer.start('text/html');
        writer.write('<pre>'+res._['message']+'</pre>');
        writer.end();
      }
    },
    'root': {
      'default.func': function(res, writer, context) {
        //default is to take the existing resource path and render it as html
        context.forwardRequest(docid + '/.@res-list');
        writer.end();
      }
    }
  }
});

var root = new RootResource({
  'system-templates': systemTemplates,
  'user-templates': userTemplates,
  'config': documentConfig,
  'settings':userSettings,
  'content': documentContent,
  'temp': tempContent,
  'session': userSession,
  'index': searchIndex,
  '_document': documentData,
  '_temp': documentTemp,
  '_bundle': bundleData,
  '_shared': sharedData
});

var rres = new ResourceResolver(root);
var rtmp = new MultiResourceResolver([userTemplates, systemTemplates, defaultTemplates]);

var app_path = window.location.protocol + '//' + window.location.host + window.location.pathname + '#' + docid;
var doc_path = window.location.protocol + '//' + window.location.host + '/' + docid;

//configuration which is passed through context to the renderer, accessible as C.something
var config = {
  'X': '.@',
  'APP_PREFIX':app_path,
  'DOC_PREFIX':doc_path,
  'DOC_ID':docid,
  'USER_TEMPLATES':'/user-templates'
};

var handler = new SPARequestHandler(rres, rtmp);

// [path].x-[selector].[selectorArgs][dataPath]
// /cards/item1.x-json.-1.223/a/d
handler.setPathParserPattern('^\\d*(?<path>\\/.*?)(\\.@(?<selector>[a-z\\-_]+)(?<dataPath>\\/.*?)?)?$');
handler.setConfigProperties(config);

handler.registerValueTranformer('newUUID', window.newUUID);

//register renderers
var hbs = new HBSRendererFactory();
handler.registerFactory('hbs', hbs);
handler.registerFactory('js', new JSRendererFactory());
handler.registerFactory('func', new InterFuncRendererFactory()); //internal functions, usefull for function-based renderers

//start by listing content of the root resource
var path = location.hash.substr(1);

if (!path) path = '/.@res-list';
else if (path.indexOf('/') == -1) path += '/.@res-list';

handler.addEventListener('loaded', function() {
  if (window.IS_BALEBASEAPP) document.body.classList.add('mode_balebaseapp');
  document.body.classList.add('loaded');
  initViewModeObserver();
});

initContent(function () {
  if (document.cookie && document.cookie.indexOf('BaleBaseApp=1') != -1) {
    window.IS_BALEBASEAPP = true;
    handler.addEventListener('stored', function(evt, path) {
      sendWindowMessage({storedPath:path});
    });
  }
  else {
    window.IS_BALEBASEAPP = false;
    initBaleBaseAppFuncs();
  }

  handler.handleRequest(path);
});
