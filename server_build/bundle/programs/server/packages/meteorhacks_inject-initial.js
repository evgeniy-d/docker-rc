(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;

/* Package-scope variables */
var Inject, id;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/meteorhacks_inject-initial/lib/inject-server.js                                          //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
function escapeReplaceString(str) {
  /*
   * When using string.replace(str, newSubStr), the dollar sign ("$") is
   * considered a special character in newSubStr, and needs to be escaped
   * as "$$".  We have to do this twice, for escaping the newSubStr in
   * this function, and for the resulting string which is passed back.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
   */
   return str.replace(/\$/g, '$$$$');
}

Inject = {
  // stores in a script type=application/ejson tag, accessed with Injected.obj('id')
  obj: function(id, data, res) {
    this._checkForObjOrFunction(data,
      'Inject.obj(id, data [,res]) expects `data` to be an Object or Function');

    if (res) {
      this._resAssign(res, 'objList', id, data);
    } else {
      this.objList[id] = data;
    }
  },
  objList: {},

  // Inserts a META called `id`, whose `content` can be accessed with Injected.meta()
  meta: function(id, data, res) {
    this._checkForTextOrFunction(data,
      'Inject.meta(id, data [,res]) expects `data` to be an String or Function');

    if (res) {
      this._resAssign(res, 'metaList', id, data);
    } else {
      this.metaList[id] = data;
    }
  },
  metaList: {},

  rawHead: function(id, textOrFunc, res) {
    this._checkForTextOrFunction(textOrFunc,
      'Inject.rawHead(id, content [,res]) expects `content` to be an String or Function');

    if (res) {
      this._resAssign(res, 'rawHeads', id, textOrFunc);
    } else {
      this.rawHeads[id] = textOrFunc;
    }
  },
  rawHeads: {},

  rawBody: function(id, textOrFunc, res) {
    this._checkForTextOrFunction(textOrFunc,
      'Inject.rawBody(id, content [,res]) expects `content` to be an String or Function');

    if (res) {
      this._resAssign(res, 'rawBodies', id, textOrFunc);
    } else {
      this.rawBodies[id] = textOrFunc;
    }
  },
  rawBodies: {},

  // The callback receives the entire HTML page and must return a modified version
  rawModHtml: function(id, func) {
    if (!_.isFunction(func)) {
      var message = 'Inject func id "' + id + '" should be a function, not ' + typeof(func);
      throw new Error(message);
    }

    this.rawModHtmlFuncs[id] = func;
  },
  rawModHtmlFuncs: {},

  _injectObjects: function(html, res) {
    var objs = _.extend({}, Inject.objList, res.Inject && res.Inject.objList);
    if (_.isEmpty(objs)) {
      return html;
    }

    var obj, injectHtml = '';
    for (id in objs) {
      obj = _.isFunction(objs[id]) ? objs[id](res) : objs[id];
      injectHtml += "  <script id='" + id.replace("'", '&apos;')
        + "' type='application/ejson'>" + EJSON.stringify(obj)
        + "</script>\n";
    }

    return html.replace('<head>', '<head>\n' + escapeReplaceString(injectHtml));
  },

  _injectMeta: function(html, res) {
    var metas = _.extend({}, Inject.metaList, res.Inject && res.Inject.metaList);
    if (_.isEmpty(metas))
      return html;

    var injectHtml = '';
    for (id in metas) {
      var meta = this._evalToText(metas[id], res, html);
      injectHtml += "  <meta id='" + id.replace("'", '&apos;')
        + "' content='" + meta.replace("'", '&apos;') + "'>\n", res;
    }

    return html.replace('<head>', '<head>\n' + escapeReplaceString(injectHtml));
  },

  _injectHeads: function(html, res) {
    var heads = _.extend({}, Inject.rawHeads, res.Inject && res.Inject.rawHeads);
    if (_.isEmpty(heads))
      return html;

    var injectHtml = '';
    for (id in heads) {
      var head = this._evalToText(heads[id], res, html);
      injectHtml += head + '\n';
    }

    return html.replace('<head>', '<head>\n' + escapeReplaceString(injectHtml));
  },

  _injectBodies: function(html, res) {
    var bodies = _.extend({}, Inject.rawBodies, res.Inject && res.Inject.rawBodies);
    if (_.isEmpty(bodies))
      return html;

    var injectHtml = '';
    for (id in bodies) {
      var body = this._evalToText(bodies[id], res, html);
      injectHtml += body + '\n';
    }

    return html.replace('<body>', '<body>\n' + escapeReplaceString(injectHtml));
  },

  // ensure object exists and store there
  _resAssign: function(res, key, id, value) {
    if (!res.Inject)
      res.Inject = {};
    if (!res.Inject[key])
      res.Inject[key] = {};
    res.Inject[key][id] = value;
  },

  _checkForTextOrFunction: function (arg, message) {
    if(!(_.isString(arg) || _.isFunction(arg))) {
      throw new Error(message);
    }
  },

  _checkForObjOrFunction: function (arg, message) {
    if(!(_.isObject(arg) || _.isFunction(arg))) {
      throw new Error(message);
    }
  },

  // we don't handle errors here. Let them to handle in a higher level
  _evalToText: function(textOrFunc, res, html) {
    if(_.isFunction(textOrFunc)) {
      return textOrFunc(res, html);
    } else {
      return textOrFunc;
    }
  }
};

Inject.rawModHtml('injectHeads', Inject._injectHeads.bind(Inject));
Inject.rawModHtml('injectMeta', Inject._injectMeta.bind(Inject));
Inject.rawModHtml('injectBodies', Inject._injectBodies.bind(Inject));
Inject.rawModHtml('injectObjects', Inject._injectObjects.bind(Inject));

///////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/meteorhacks_inject-initial/lib/inject-core.js                                            //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
// Hijack core node API and attach data to the response dynamically
// We are simply using this hack because, there is no way to alter
// Meteor's html content on the server side

Inject._hijackWrite = function(res) {
  var originalWrite = res.write;
  res.write = function(chunk, encoding) {
    //prevent hijacking other http requests
    if(!res.iInjected &&
      encoding === undefined && /^<!DOCTYPE html>/.test(chunk)) {
      chunk = chunk.toString();

      for (id in Inject.rawModHtmlFuncs) {
        chunk = Inject.rawModHtmlFuncs[id](chunk, res);
        if (!_.isString(chunk)) {
          throw new Error('Inject func id "' + id + '" must return HTML, not '
            + typeof(chunk) + '\n' + JSON.stringify(chunk, null, 2));
        }
      }

      res.iInjected = true;
    }

    originalWrite.call(res, chunk, encoding);
  };
}

WebApp.connectHandlers.use(function(req, res, next) {
  // We only separate this to make testing easier
  Inject._hijackWrite(res);

  next();
});

//meteor algorithm to check if this is a meteor serving http request or not
Inject.appUrl = function(url) {
  if (url === '/favicon.ico' || url === '/robots.txt')
    return false;

  // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file id we have chosen to use for HTML5
  // appcache URLs. It is included here to prevent using an appcache
  // then removing it from poisoning an app permanently. Eventually,
  // once we have server side routing, this won't be needed as
  // unknown URLs with return a 404 automatically.
  if (url === '/app.manifest')
    return false;

  // Avoid serving app HTML for declared routes such as /sockjs/.
  if (typeof(RoutePolicy) != 'undefined' && RoutePolicy.classify(url))
    return false;

  // we currently return app HTML on all URLs by default
  return true;
};

///////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteorhacks:inject-initial", {
  Inject: Inject
});

})();
