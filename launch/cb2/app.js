var docid = '';
var documentContent = null;
var documentConfig = null;
var bundleData = null;
var sharedData = null;
var documentData = null;

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

function initBaleBaseAppFuncs() {
  window.sendWindowMessage = function(msg) {
    console.log(msg);
  };
  
  window.localStorage.getItem('_md');
  window.addEventListener('storage', function(evt) {
    if (evt.key == '_md' && frames.length == 0 && !document.body.classList.contains('mode_popup-visible')) {
      window.location.reload();
    }
  });
}

//user content
if (!docid) {
  console.log('no docid found, using local storage!');
  var hc = Utils.makeHash(window.location.pathname);

  documentContent = new LocalStorageResource({}, 'documentContent'+hc);

  bundleData = new ObjectResource({});
  sharedData = new ObjectResource({});
  documentData = new ObjectResource({});

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

  documentConfig = new RemoteResource(`/${docid}-CONTENT/`).wrap({
    getType: function() { return 'resource/config'; }
  });
}

//user session
var userSession = new SessionStorageResource({}, 'usersession');

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
  'content': documentContent,
  'temp': tempContent,
  'session': userSession,
  'index': searchIndex,
  '_document': documentData,
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
  'USER_TEMPLATES':'/user-templates'
};

var handler = new SPARequestHandler(rres, rtmp);

// [path].x-[selector].[selectorArgs][dataPath]
// /cards/item1.x-json.-1.223/a/d
handler.setPathParserPattern('^\\d*(?<path>\\/.*?)(\\.@(?<selector>[a-z\\-_]+)(?<dataPath>\\/.*?)?)?$');
handler.setConfigProperties(config);

handler.registerValueTranformer('newUUID', function(data, key) {
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
});

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
  if (document.cookie && document.cookie.indexOf('BaleBaseApp=1') != -1) {
    window.IS_BALEBASEAPP = true;
    document.body.classList.add('balebaseapp');
  }
  else {
    window.IS_BALEBASEAPP = false;
    initBaleBaseAppFuncs();
  }
  document.body.classList.add('loaded');
});

initContent(function () {
  handler.handleRequest(path);
});
