(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:grant":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/index.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  path: () => path,
  generateCallback: () => generateCallback,
  generateAppCallback: () => generateAppCallback,
  Providers: () => Providers,
  Settings: () => Settings,
  GrantError: () => GrantError
});
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 0);
let session;
module.watch(require("express-session"), {
  default(v) {
    session = v;
  }

}, 1);
let Grant;
module.watch(require("grant-express"), {
  default(v) {
    Grant = v;
  }

}, 2);
let fiber;
module.watch(require("fibers"), {
  default(v) {
    fiber = v;
  }

}, 3);
let GrantError;
module.watch(require("./error"), {
  GrantError(v) {
    GrantError = v;
  }

}, 4);
let generateConfig;
module.watch(require("./grant"), {
  generateConfig(v) {
    generateConfig = v;
  }

}, 5);
let path, generateCallback, generateAppCallback;
module.watch(require("./routes"), {
  path(v) {
    path = v;
  },

  generateCallback(v) {
    generateCallback = v;
  },

  generateAppCallback(v) {
    generateAppCallback = v;
  }

}, 6);
let redirect;
module.watch(require("./redirect"), {
  middleware(v) {
    redirect = v;
  }

}, 7);
let Providers, providers;
module.watch(require("./providers"), {
  default(v) {
    Providers = v;
  },

  middleware(v) {
    providers = v;
  }

}, 8);
let Settings;
module.watch(require("./settings"), {
  default(v) {
    Settings = v;
  }

}, 9);
let grant;
WebApp.connectHandlers.use(session({
  secret: 'grant',
  resave: true,
  saveUninitialized: true
})); // grant

WebApp.connectHandlers.use(path, (req, res, next) => {
  if (grant) {
    grant(req, res, next);
  } else {
    next();
  }
}); // callbacks

WebApp.connectHandlers.use((req, res, next) => {
  fiber(() => {
    redirect(req, res, next);
  }).run();
}); // providers

WebApp.connectHandlers.use((req, res, next) => {
  fiber(() => {
    providers(req, res, next);
  }).run();
});
Meteor.startup(() => {
  const config = generateConfig();
  grant = new Grant(config);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"authenticate.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/authenticate.js                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  authenticate: () => authenticate
});
let AccountsServer;
module.watch(require("meteor/rocketchat:accounts"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let Accounts;
module.watch(require("meteor/accounts-base"), {
  Accounts(v) {
    Accounts = v;
  }

}, 2);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 3);
let GrantError;
module.watch(require("./error"), {
  GrantError(v) {
    GrantError = v;
  }

}, 4);
let Providers;
module.watch(require("./providers"), {
  default(v) {
    Providers = v;
  }

}, 5);

const setAvatarFromUrl = (userId, url) => {
  return new Promise((resolve, reject) => {
    Meteor.runAsUser(userId, () => {
      Meteor.call('setAvatarFromService', url, '', 'url', err => {
        if (err) {
          if (err.details.timeToReset && err.details.timeToReset) {
            reject(t('error-too-many-requests', {
              seconds: parseInt(err.details.timeToReset / 1000)
            }));
          } else {
            reject(t('Avatar_url_invalid_or_error'));
          }
        } else {
          resolve();
        }
      });
    });
  });
};

const findUserByOAuthId = (providerName, id) => {
  return RocketChat.models.Users.findOne({
    [`settings.profile.oauth.${providerName}`]: id
  });
};

const addOAuthIdToUserProfile = (user, providerName, providerId) => {
  const profile = Object.assign({}, user.settings.profile, {
    oauth: (0, _objectSpread2.default)({}, user.settings.profile.oauth, {
      [providerName]: providerId
    })
  });
  RocketChat.models.Users.setProfile(user.id, profile);
};

function getAccessToken(req) {
  const i = req.url.indexOf('?');

  if (i === -1) {
    return;
  }

  const barePath = req.url.substring(i + 1);
  const splitPath = barePath.split('&');
  const token = splitPath.find(p => p.match(/access_token=[a-zA-Z0-9]+/));

  if (token) {
    return token.replace('access_token=', '');
  }
}

function authenticate(providerName, req) {
  return Promise.asyncApply(() => {
    let tokens;
    const accessToken = getAccessToken(req);
    const provider = Providers.get(providerName);

    if (!provider) {
      throw new GrantError(`Provider '${providerName}' not found`);
    }

    const userData = provider.getUser(accessToken);
    let user = findUserByOAuthId(providerName, userData.id);

    if (user) {
      user.id = user._id;
    } else {
      user = RocketChat.models.Users.findOneByEmailAddress(userData.email);

      if (user) {
        user.id = user._id;
      }
    }

    if (user) {
      addOAuthIdToUserProfile(user, providerName, userData.id);
      const loginResult = Promise.await(AccountsServer.loginWithUser({
        id: user.id
      }));
      tokens = loginResult.tokens;
    } else {
      const id = Accounts.createUser({
        email: userData.email,
        username: userData.username
      });
      RocketChat.models.Users.setProfile(id, {
        avatar: userData.avatar,
        oauth: {
          [providerName]: userData.id
        }
      });
      RocketChat.models.Users.setName(id, userData.name);
      RocketChat.models.Users.setEmailVerified(id, userData.email);
      Promise.await(setAvatarFromUrl(id, userData.avatar));
      const loginResult = Promise.await(AccountsServer.loginWithUser({
        id
      }));
      tokens = loginResult.tokens;
    }

    return tokens;
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"error.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/error.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  GrantError: () => GrantError
});

class GrantError extends Error {
  constructor(...args) {
    super(...args);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"grant.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/grant.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  generateConfig: () => generateConfig,
  getConfig: () => getConfig
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let Providers;
module.watch(require("./providers"), {
  default(v) {
    Providers = v;
  }

}, 1);
let Settings;
module.watch(require("./settings"), {
  default(v) {
    Settings = v;
  }

}, 2);
let path, generateCallback, generateAppCallback;
module.watch(require("./routes"), {
  path(v) {
    path = v;
  },

  generateCallback(v) {
    generateCallback = v;
  },

  generateAppCallback(v) {
    generateAppCallback = v;
  }

}, 3);

function addProviders(config) {
  Settings.forEach((settings, providerName) => {
    if (settings.enabled === true) {
      const registeredProvider = Providers.get(providerName);

      if (!registeredProvider) {
        console.error(`No configuration for '${providerName}' provider`);
      } // basic settings


      const data = {
        key: settings.key,
        secret: settings.secret,
        scope: registeredProvider.scope,
        callback: generateCallback(providerName)
      }; // set each app

      Settings.apps.forEach((_, appName) => {
        data[appName] = {
          callback: generateAppCallback(providerName, appName)
        };
      });
      config[providerName] = data;
    }
  });
}

const config = {};

function generateConfig() {
  config['server'] = {
    protocol: 'http',
    host: RocketChat.hostname,
    path,
    state: true
  };
  addProviders(config);
  return config;
}

function getConfig() {
  return config;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"providers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/providers.js                                                           //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  middleware: () => middleware
});
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 0);
let Storage;
module.watch(require("./storage"), {
  Storage(v) {
    Storage = v;
  }

}, 1);
let routes;
module.watch(require("./routes"), {
  routes(v) {
    routes = v;
  }

}, 2);

class Providers extends Storage {
  register(name, options, getUser) {
    check(name, String);
    check(options, {
      // eslint-disable-next-line
      scope: Match.OneOf(String, [String])
    });
    check(getUser, Function);

    this._add(name.toLowerCase(), {
      scope: options.scope,
      getUser
    });
  }

}

const providers = new Providers();
module.exportDefault(providers);

function middleware(req, res, next) {
  const route = routes.providers(req);

  if (route) {
    const list = [];
    providers.forEach((_, name) => list.push(name));
    res.end(JSON.stringify({
      data: list
    }));
    return;
  }

  next();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"redirect.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/redirect.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  middleware: () => middleware
});
let authenticate;
module.watch(require("./authenticate"), {
  authenticate(v) {
    authenticate = v;
  }

}, 0);
let Settings;
module.watch(require("./settings"), {
  default(v) {
    Settings = v;
  }

}, 1);
let routes;
module.watch(require("./routes"), {
  routes(v) {
    routes = v;
  }

}, 2);
let GrantError;
module.watch(require("./error"), {
  GrantError(v) {
    GrantError = v;
  }

}, 3);

function parseUrl(url, config) {
  return url.replace(/\{[\ ]*(provider|accessToken|refreshToken|error)[\ ]*\}/g, (_, key) => config[key]);
}

function getAppConfig(providerName, appName) {
  const providerConfig = Settings.get(providerName);

  if (providerConfig) {
    return Settings.apps.get(appName);
  }
}

function middleware(req, res, next) {
  return Promise.asyncApply(() => {
    const route = routes.appCallback(req); // handle app callback

    if (route) {
      const config = {
        provider: route.provider
      };
      const appConfig = getAppConfig(route.provider, route.app);

      if (appConfig) {
        const {
          redirectUrl,
          errorUrl
        } = appConfig;

        try {
          const tokens = Promise.await(authenticate(route.provider, req));
          config.accessToken = tokens.accessToken;
          config.refreshToken = tokens.refreshToken;
          res.redirect(parseUrl(redirectUrl, config));
          return;
        } catch (error) {
          config.error = error instanceof GrantError ? error.message : 'Something went wrong';
          console.error(error);
          res.redirect(parseUrl(errorUrl, config));
          return;
        }
      }
    }

    next();
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/routes.js                                                              //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  path: () => path,
  generateCallback: () => generateCallback,
  generateAppCallback: () => generateAppCallback,
  getPaths: () => getPaths,
  routes: () => routes
});
const path = '/_oauth_apps';

function generateCallback(providerName) {
  return `${path}/${providerName}/callback`;
}

function generateAppCallback(providerName, appName) {
  return generateCallback(`${providerName}/${appName}`);
}

function getPaths(req) {
  const i = req.url.indexOf('?');
  let barePath;

  if (i === -1) {
    barePath = req.url;
  } else {
    barePath = req.url.substring(0, i);
  }

  const splitPath = barePath.split('/'); // Any non-oauth request will continue down the default
  // middlewares.

  if (splitPath[1] === '_oauth_apps') {
    return splitPath.slice(2);
  }
}

const routes = {
  // :path/:provider/:app/callback
  appCallback: req => {
    const paths = getPaths(req);

    if (paths && paths[2] === 'callback') {
      return {
        provider: paths[0],
        app: paths[1]
      };
    }
  },
  // :path/providers
  providers: req => {
    const paths = getPaths(req);
    return paths && paths[0] === 'providers';
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/settings.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 0);
let Storage;
module.watch(require("./storage"), {
  Storage(v) {
    Storage = v;
  }

}, 1);

class Apps extends Storage {
  add(name, body) {
    check(name, String);
    check(body, {
      redirectUrl: String,
      errorUrl: String
    });

    this._add(name, body);
  }

}

class Settings extends Storage {
  constructor() {
    super();
    this.apps = new Apps();
  }

  add(settings) {
    check(settings, {
      enabled: Match.Optional(Boolean),
      provider: String,
      key: String,
      secret: String
    });

    this._add(settings.provider, {
      enabled: settings.enabled === true,
      provider: settings.provider,
      key: settings.key,
      secret: settings.secret
    });
  }

}

const settings = new Settings();
module.exportDefault(settings);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/storage.js                                                             //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  Storage: () => Storage
});

class Storage {
  constructor() {
    this._data = {};
  }

  all() {
    return this._data;
  }

  forEach(fn) {
    Object.keys(this.all()).forEach(name => {
      fn(this.get(name), name);
    });
  }

  get(name) {
    return this.all()[name.toLowerCase()];
  }

  has(name) {
    return !!this._data[name];
  }

  _add(name, body) {
    if (this.has(name)) {
      console.error(`'${name}' have been already defined`);
      return;
    }

    this._data[name] = body;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"express-session":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/express-session/package.json                          //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
exports.name = "express-session";
exports.version = "1.15.4";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/express-session/index.js                              //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/*!
 * express-session
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var cookie = require('cookie');
var crc = require('crc').crc32;
var debug = require('debug')('express-session');
var deprecate = require('depd')('express-session');
var parseUrl = require('parseurl');
var uid = require('uid-safe').sync
  , onHeaders = require('on-headers')
  , signature = require('cookie-signature')

var Session = require('./session/session')
  , MemoryStore = require('./session/memory')
  , Cookie = require('./session/cookie')
  , Store = require('./session/store')

// environment

var env = process.env.NODE_ENV;

/**
 * Expose the middleware.
 */

exports = module.exports = session;

/**
 * Expose constructors.
 */

exports.Store = Store;
exports.Cookie = Cookie;
exports.Session = Session;
exports.MemoryStore = MemoryStore;

/**
 * Warning message for `MemoryStore` usage in production.
 * @private
 */

var warning = 'Warning: connect.session() MemoryStore is not\n'
  + 'designed for a production environment, as it will leak\n'
  + 'memory, and will not scale past a single process.';

/**
 * Node.js 0.8+ async implementation.
 * @private
 */

/* istanbul ignore next */
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

/**
 * Setup session store with the given `options`.
 *
 * @param {Object} [options]
 * @param {Object} [options.cookie] Options for cookie
 * @param {Function} [options.genid]
 * @param {String} [options.name=connect.sid] Session ID cookie name
 * @param {Boolean} [options.proxy]
 * @param {Boolean} [options.resave] Resave unmodified sessions back to the store
 * @param {Boolean} [options.rolling] Enable/disable rolling session expiration
 * @param {Boolean} [options.saveUninitialized] Save uninitialized sessions to the store
 * @param {String|Array} [options.secret] Secret for signing session ID
 * @param {Object} [options.store=MemoryStore] Session store
 * @param {String} [options.unset]
 * @return {Function} middleware
 * @public
 */

function session(options) {
  var opts = options || {}

  // get the cookie options
  var cookieOptions = opts.cookie || {}

  // get the session id generate function
  var generateId = opts.genid || generateSessionId

  // get the session cookie name
  var name = opts.name || opts.key || 'connect.sid'

  // get the session store
  var store = opts.store || new MemoryStore()

  // get the trust proxy setting
  var trustProxy = opts.proxy

  // get the resave session option
  var resaveSession = opts.resave;

  // get the rolling session option
  var rollingSessions = Boolean(opts.rolling)

  // get the save uninitialized session option
  var saveUninitializedSession = opts.saveUninitialized

  // get the cookie signing secret
  var secret = opts.secret

  if (typeof generateId !== 'function') {
    throw new TypeError('genid option must be a function');
  }

  if (resaveSession === undefined) {
    deprecate('undefined resave option; provide resave option');
    resaveSession = true;
  }

  if (saveUninitializedSession === undefined) {
    deprecate('undefined saveUninitialized option; provide saveUninitialized option');
    saveUninitializedSession = true;
  }

  if (opts.unset && opts.unset !== 'destroy' && opts.unset !== 'keep') {
    throw new TypeError('unset option must be "destroy" or "keep"');
  }

  // TODO: switch to "destroy" on next major
  var unsetDestroy = opts.unset === 'destroy'

  if (Array.isArray(secret) && secret.length === 0) {
    throw new TypeError('secret option array must contain one or more strings');
  }

  if (secret && !Array.isArray(secret)) {
    secret = [secret];
  }

  if (!secret) {
    deprecate('req.secret; provide secret option');
  }

  // notify user that this store is not
  // meant for a production environment
  /* istanbul ignore next: not tested */
  if ('production' == env && store instanceof MemoryStore) {
    console.warn(warning);
  }

  // generates the new session
  store.generate = function(req){
    req.sessionID = generateId(req);
    req.session = new Session(req);
    req.session.cookie = new Cookie(cookieOptions);

    if (cookieOptions.secure === 'auto') {
      req.session.cookie.secure = issecure(req, trustProxy);
    }
  };

  var storeImplementsTouch = typeof store.touch === 'function';

  // register event listeners for the store to track readiness
  var storeReady = true
  store.on('disconnect', function ondisconnect() {
    storeReady = false
  })
  store.on('connect', function onconnect() {
    storeReady = true
  })

  return function session(req, res, next) {
    // self-awareness
    if (req.session) {
      next()
      return
    }

    // Handle connection as if there is no session if
    // the store has temporarily disconnected etc
    if (!storeReady) {
      debug('store is disconnected')
      next()
      return
    }

    // pathname mismatch
    var originalPath = parseUrl.original(req).pathname;
    if (originalPath.indexOf(cookieOptions.path || '/') !== 0) return next();

    // ensure a secret is available or bail
    if (!secret && !req.secret) {
      next(new Error('secret option required for sessions'));
      return;
    }

    // backwards compatibility for signed cookies
    // req.secret is passed from the cookie parser middleware
    var secrets = secret || [req.secret];

    var originalHash;
    var originalId;
    var savedHash;
    var touched = false

    // expose store
    req.sessionStore = store;

    // get the session ID from the cookie
    var cookieId = req.sessionID = getcookie(req, name, secrets);

    // set-cookie
    onHeaders(res, function(){
      if (!req.session) {
        debug('no session');
        return;
      }

      if (!shouldSetCookie(req)) {
        return;
      }

      // only send secure cookies via https
      if (req.session.cookie.secure && !issecure(req, trustProxy)) {
        debug('not secured');
        return;
      }

      if (!touched) {
        // touch session
        req.session.touch()
        touched = true
      }

      // set cookie
      setcookie(res, name, req.sessionID, secrets[0], req.session.cookie.data);
    });

    // proxy end() to commit the session
    var _end = res.end;
    var _write = res.write;
    var ended = false;
    res.end = function end(chunk, encoding) {
      if (ended) {
        return false;
      }

      ended = true;

      var ret;
      var sync = true;

      function writeend() {
        if (sync) {
          ret = _end.call(res, chunk, encoding);
          sync = false;
          return;
        }

        _end.call(res);
      }

      function writetop() {
        if (!sync) {
          return ret;
        }

        if (chunk == null) {
          ret = true;
          return ret;
        }

        var contentLength = Number(res.getHeader('Content-Length'));

        if (!isNaN(contentLength) && contentLength > 0) {
          // measure chunk
          chunk = !Buffer.isBuffer(chunk)
            ? new Buffer(chunk, encoding)
            : chunk;
          encoding = undefined;

          if (chunk.length !== 0) {
            debug('split response');
            ret = _write.call(res, chunk.slice(0, chunk.length - 1));
            chunk = chunk.slice(chunk.length - 1, chunk.length);
            return ret;
          }
        }

        ret = _write.call(res, chunk, encoding);
        sync = false;

        return ret;
      }

      if (shouldDestroy(req)) {
        // destroy session
        debug('destroying');
        store.destroy(req.sessionID, function ondestroy(err) {
          if (err) {
            defer(next, err);
          }

          debug('destroyed');
          writeend();
        });

        return writetop();
      }

      // no session to save
      if (!req.session) {
        debug('no session');
        return _end.call(res, chunk, encoding);
      }

      if (!touched) {
        // touch session
        req.session.touch()
        touched = true
      }

      if (shouldSave(req)) {
        req.session.save(function onsave(err) {
          if (err) {
            defer(next, err);
          }

          writeend();
        });

        return writetop();
      } else if (storeImplementsTouch && shouldTouch(req)) {
        // store implements touch method
        debug('touching');
        store.touch(req.sessionID, req.session, function ontouch(err) {
          if (err) {
            defer(next, err);
          }

          debug('touched');
          writeend();
        });

        return writetop();
      }

      return _end.call(res, chunk, encoding);
    };

    // generate the session
    function generate() {
      store.generate(req);
      originalId = req.sessionID;
      originalHash = hash(req.session);
      wrapmethods(req.session);
    }

    // wrap session methods
    function wrapmethods(sess) {
      var _reload = sess.reload
      var _save = sess.save;

      function reload(callback) {
        debug('reloading %s', this.id)
        _reload.call(this, function () {
          wrapmethods(req.session)
          callback.apply(this, arguments)
        })
      }

      function save() {
        debug('saving %s', this.id);
        savedHash = hash(this);
        _save.apply(this, arguments);
      }

      Object.defineProperty(sess, 'reload', {
        configurable: true,
        enumerable: false,
        value: reload,
        writable: true
      })

      Object.defineProperty(sess, 'save', {
        configurable: true,
        enumerable: false,
        value: save,
        writable: true
      });
    }

    // check if session has been modified
    function isModified(sess) {
      return originalId !== sess.id || originalHash !== hash(sess);
    }

    // check if session has been saved
    function isSaved(sess) {
      return originalId === sess.id && savedHash === hash(sess);
    }

    // determine if session should be destroyed
    function shouldDestroy(req) {
      return req.sessionID && unsetDestroy && req.session == null;
    }

    // determine if session should be saved to store
    function shouldSave(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        debug('session ignored because of bogus req.sessionID %o', req.sessionID);
        return false;
      }

      return !saveUninitializedSession && cookieId !== req.sessionID
        ? isModified(req.session)
        : !isSaved(req.session)
    }

    // determine if session should be touched
    function shouldTouch(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        debug('session ignored because of bogus req.sessionID %o', req.sessionID);
        return false;
      }

      return cookieId === req.sessionID && !shouldSave(req);
    }

    // determine if cookie should be set on response
    function shouldSetCookie(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        return false;
      }

      return cookieId != req.sessionID
        ? saveUninitializedSession || isModified(req.session)
        : rollingSessions || req.session.cookie.expires != null && isModified(req.session);
    }

    // generate a session if the browser doesn't send a sessionID
    if (!req.sessionID) {
      debug('no SID sent, generating session');
      generate();
      next();
      return;
    }

    // generate the session object
    debug('fetching %s', req.sessionID);
    store.get(req.sessionID, function(err, sess){
      // error handling
      if (err) {
        debug('error %j', err);

        if (err.code !== 'ENOENT') {
          next(err);
          return;
        }

        generate();
      // no session
      } else if (!sess) {
        debug('no session found');
        generate();
      // populate req.session
      } else {
        debug('session found');
        store.createSession(req, sess);
        originalId = req.sessionID;
        originalHash = hash(sess);

        if (!resaveSession) {
          savedHash = originalHash
        }

        wrapmethods(req.session);
      }

      next();
    });
  };
};

/**
 * Generate a session ID for a new session.
 *
 * @return {String}
 * @private
 */

function generateSessionId(sess) {
  return uid(24);
}

/**
 * Get the session ID cookie from request.
 *
 * @return {string}
 * @private
 */

function getcookie(req, name, secrets) {
  var header = req.headers.cookie;
  var raw;
  var val;

  // read from cookie header
  if (header) {
    var cookies = cookie.parse(header);

    raw = cookies[name];

    if (raw) {
      if (raw.substr(0, 2) === 's:') {
        val = unsigncookie(raw.slice(2), secrets);

        if (val === false) {
          debug('cookie signature invalid');
          val = undefined;
        }
      } else {
        debug('cookie unsigned')
      }
    }
  }

  // back-compat read from cookieParser() signedCookies data
  if (!val && req.signedCookies) {
    val = req.signedCookies[name];

    if (val) {
      deprecate('cookie should be available in req.headers.cookie');
    }
  }

  // back-compat read from cookieParser() cookies data
  if (!val && req.cookies) {
    raw = req.cookies[name];

    if (raw) {
      if (raw.substr(0, 2) === 's:') {
        val = unsigncookie(raw.slice(2), secrets);

        if (val) {
          deprecate('cookie should be available in req.headers.cookie');
        }

        if (val === false) {
          debug('cookie signature invalid');
          val = undefined;
        }
      } else {
        debug('cookie unsigned')
      }
    }
  }

  return val;
}

/**
 * Hash the given `sess` object omitting changes to `.cookie`.
 *
 * @param {Object} sess
 * @return {String}
 * @private
 */

function hash(sess) {
  return crc(JSON.stringify(sess, function (key, val) {
    // ignore sess.cookie property
    if (this === sess && key === 'cookie') {
      return
    }

    return val
  }))
}

/**
 * Determine if request is secure.
 *
 * @param {Object} req
 * @param {Boolean} [trustProxy]
 * @return {Boolean}
 * @private
 */

function issecure(req, trustProxy) {
  // socket is https server
  if (req.connection && req.connection.encrypted) {
    return true;
  }

  // do not trust proxy
  if (trustProxy === false) {
    return false;
  }

  // no explicit trust; try req.secure from express
  if (trustProxy !== true) {
    var secure = req.secure;
    return typeof secure === 'boolean'
      ? secure
      : false;
  }

  // read the proto from x-forwarded-proto header
  var header = req.headers['x-forwarded-proto'] || '';
  var index = header.indexOf(',');
  var proto = index !== -1
    ? header.substr(0, index).toLowerCase().trim()
    : header.toLowerCase().trim()

  return proto === 'https';
}

/**
 * Set cookie on response.
 *
 * @private
 */

function setcookie(res, name, val, secret, options) {
  var signed = 's:' + signature.sign(val, secret);
  var data = cookie.serialize(name, signed, options);

  debug('set-cookie %s', data);

  var prev = res.getHeader('set-cookie') || [];
  var header = Array.isArray(prev) ? prev.concat(data) : [prev, data];

  res.setHeader('set-cookie', header)
}

/**
 * Verify and decode the given `val` with `secrets`.
 *
 * @param {String} val
 * @param {Array} secrets
 * @returns {String|Boolean}
 * @private
 */
function unsigncookie(val, secrets) {
  for (var i = 0; i < secrets.length; i++) {
    var result = signature.unsign(val, secrets[i]);

    if (result !== false) {
      return result;
    }
  }

  return false;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"grant-express":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/grant-express/package.json                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
exports.name = "grant-express";
exports.version = "3.8.0";
exports.main = "index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/grant-express/index.js                                //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //

module.exports = require('grant').express()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:grant/server/index.js");

/* Exports */
Package._define("rocketchat:grant", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_grant.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFudC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL2F1dGhlbnRpY2F0ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFudC9zZXJ2ZXIvZXJyb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL2dyYW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYW50L3NlcnZlci9wcm92aWRlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL3JlZGlyZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYW50L3NlcnZlci9yb3V0ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYW50L3NlcnZlci9zdG9yYWdlLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsInBhdGgiLCJnZW5lcmF0ZUNhbGxiYWNrIiwiZ2VuZXJhdGVBcHBDYWxsYmFjayIsIlByb3ZpZGVycyIsIlNldHRpbmdzIiwiR3JhbnRFcnJvciIsIldlYkFwcCIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJzZXNzaW9uIiwiZGVmYXVsdCIsIkdyYW50IiwiZmliZXIiLCJnZW5lcmF0ZUNvbmZpZyIsInJlZGlyZWN0IiwibWlkZGxld2FyZSIsInByb3ZpZGVycyIsImdyYW50IiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwic2VjcmV0IiwicmVzYXZlIiwic2F2ZVVuaW5pdGlhbGl6ZWQiLCJyZXEiLCJyZXMiLCJuZXh0IiwicnVuIiwiTWV0ZW9yIiwic3RhcnR1cCIsImNvbmZpZyIsImF1dGhlbnRpY2F0ZSIsIkFjY291bnRzU2VydmVyIiwiUm9ja2V0Q2hhdCIsIkFjY291bnRzIiwic2V0QXZhdGFyRnJvbVVybCIsInVzZXJJZCIsInVybCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwicnVuQXNVc2VyIiwiY2FsbCIsImVyciIsImRldGFpbHMiLCJ0aW1lVG9SZXNldCIsInQiLCJzZWNvbmRzIiwicGFyc2VJbnQiLCJmaW5kVXNlckJ5T0F1dGhJZCIsInByb3ZpZGVyTmFtZSIsImlkIiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kT25lIiwiYWRkT0F1dGhJZFRvVXNlclByb2ZpbGUiLCJ1c2VyIiwicHJvdmlkZXJJZCIsInByb2ZpbGUiLCJPYmplY3QiLCJhc3NpZ24iLCJzZXR0aW5ncyIsIm9hdXRoIiwic2V0UHJvZmlsZSIsImdldEFjY2Vzc1Rva2VuIiwiaSIsImluZGV4T2YiLCJiYXJlUGF0aCIsInN1YnN0cmluZyIsInNwbGl0UGF0aCIsInNwbGl0IiwidG9rZW4iLCJmaW5kIiwicCIsIm1hdGNoIiwicmVwbGFjZSIsInRva2VucyIsImFjY2Vzc1Rva2VuIiwicHJvdmlkZXIiLCJnZXQiLCJ1c2VyRGF0YSIsImdldFVzZXIiLCJfaWQiLCJmaW5kT25lQnlFbWFpbEFkZHJlc3MiLCJlbWFpbCIsImxvZ2luUmVzdWx0IiwibG9naW5XaXRoVXNlciIsImNyZWF0ZVVzZXIiLCJ1c2VybmFtZSIsImF2YXRhciIsInNldE5hbWUiLCJuYW1lIiwic2V0RW1haWxWZXJpZmllZCIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJhcmdzIiwiZ2V0Q29uZmlnIiwiYWRkUHJvdmlkZXJzIiwiZm9yRWFjaCIsImVuYWJsZWQiLCJyZWdpc3RlcmVkUHJvdmlkZXIiLCJjb25zb2xlIiwiZXJyb3IiLCJkYXRhIiwia2V5Iiwic2NvcGUiLCJjYWxsYmFjayIsImFwcHMiLCJfIiwiYXBwTmFtZSIsInByb3RvY29sIiwiaG9zdCIsImhvc3RuYW1lIiwic3RhdGUiLCJjaGVjayIsIlN0b3JhZ2UiLCJyb3V0ZXMiLCJyZWdpc3RlciIsIm9wdGlvbnMiLCJTdHJpbmciLCJNYXRjaCIsIk9uZU9mIiwiRnVuY3Rpb24iLCJfYWRkIiwidG9Mb3dlckNhc2UiLCJleHBvcnREZWZhdWx0Iiwicm91dGUiLCJsaXN0IiwicHVzaCIsImVuZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJwYXJzZVVybCIsImdldEFwcENvbmZpZyIsInByb3ZpZGVyQ29uZmlnIiwiYXBwQ2FsbGJhY2siLCJhcHBDb25maWciLCJhcHAiLCJyZWRpcmVjdFVybCIsImVycm9yVXJsIiwicmVmcmVzaFRva2VuIiwibWVzc2FnZSIsImdldFBhdGhzIiwic2xpY2UiLCJwYXRocyIsIkFwcHMiLCJhZGQiLCJib2R5IiwiT3B0aW9uYWwiLCJCb29sZWFuIiwiX2RhdGEiLCJhbGwiLCJmbiIsImtleXMiLCJoYXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxRQUFLLE1BQUlBLElBQVY7QUFBZUMsb0JBQWlCLE1BQUlBLGdCQUFwQztBQUFxREMsdUJBQW9CLE1BQUlBLG1CQUE3RTtBQUFpR0MsYUFBVSxNQUFJQSxTQUEvRztBQUF5SEMsWUFBUyxNQUFJQSxRQUF0STtBQUErSUMsY0FBVyxNQUFJQTtBQUE5SixDQUFkO0FBQXlMLElBQUlDLE1BQUo7QUFBV1IsT0FBT1MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDRixTQUFPRyxDQUFQLEVBQVM7QUFBQ0gsYUFBT0csQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUErRCxJQUFJQyxPQUFKO0FBQVlaLE9BQU9TLEtBQVAsQ0FBYUMsUUFBUSxpQkFBUixDQUFiLEVBQXdDO0FBQUNHLFVBQVFGLENBQVIsRUFBVTtBQUFDQyxjQUFRRCxDQUFSO0FBQVU7O0FBQXRCLENBQXhDLEVBQWdFLENBQWhF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QU4sT0FBTytILGFBQVAsQ0F5Q2VoRSxRQXpDZixFOzs7Ozs7Ozs7OztBQ0FBL0QsT0FBT0MsTUFBUCxDQUFjO0FBQUNvSCxXQUFRLE1BQUlBO0FBQWIsQ0FBZDs7QUFBTyxNQUFNQSxPQUFOLENBQWM7QUFDcEJyQixnQkFBYztBQUNiLFNBQUt3RCxLQUFMLEdBQWEsRUFBYjtBQUNBOztBQUVEQyxRQUFNO0FBQ0wsV0FBTyxLQUFLRCxLQUFaO0FBQ0E7O0FBRURwRCxVQUFRc0QsRUFBUixFQUFZO0FBQ1g3RixXQUFPOEYsSUFBUCxDQUFZLEtBQUtGLEdBQUwsRUFBWixFQUNFckQsT0FERixDQUNXUCxJQUFELElBQVU7QUFDbEI2RCxTQUFHLEtBQUt6RSxHQUFMLENBQVNZLElBQVQsQ0FBSCxFQUFtQkEsSUFBbkI7QUFDQSxLQUhGO0FBSUE7O0FBRURaLE1BQUlZLElBQUosRUFBVTtBQUNULFdBQU8sS0FBSzRELEdBQUwsR0FBVzVELEtBQUtpQyxXQUFMLEVBQVgsQ0FBUDtBQUNBOztBQUVEOEIsTUFBSS9ELElBQUosRUFBVTtBQUNULFdBQU8sQ0FBQyxDQUFDLEtBQUsyRCxLQUFMLENBQVczRCxJQUFYLENBQVQ7QUFDQTs7QUFFRGdDLE9BQUtoQyxJQUFMLEVBQVd3RCxJQUFYLEVBQWlCO0FBQ2hCLFFBQUksS0FBS08sR0FBTCxDQUFTL0QsSUFBVCxDQUFKLEVBQW9CO0FBQ25CVSxjQUFRQyxLQUFSLENBQWUsSUFBSVgsSUFBTSw2QkFBekI7QUFDQTtBQUNBOztBQUVELFNBQUsyRCxLQUFMLENBQVczRCxJQUFYLElBQW1Cd0QsSUFBbkI7QUFDQTs7QUEvQm1CLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZ3JhbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXZWJBcHAgfSBmcm9tICdtZXRlb3Ivd2ViYXBwJztcbmltcG9ydCBzZXNzaW9uIGZyb20gJ2V4cHJlc3Mtc2Vzc2lvbic7XG5pbXBvcnQgR3JhbnQgZnJvbSAnZ3JhbnQtZXhwcmVzcyc7XG5pbXBvcnQgZmliZXIgZnJvbSAnZmliZXJzJztcblxuaW1wb3J0IHsgR3JhbnRFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgZ2VuZXJhdGVDb25maWcgfSBmcm9tICcuL2dyYW50JztcbmltcG9ydCB7IHBhdGgsIGdlbmVyYXRlQ2FsbGJhY2ssIGdlbmVyYXRlQXBwQ2FsbGJhY2sgfSBmcm9tICcuL3JvdXRlcyc7XG5pbXBvcnQgeyBtaWRkbGV3YXJlIGFzIHJlZGlyZWN0IH0gZnJvbSAnLi9yZWRpcmVjdCc7XG5pbXBvcnQgUHJvdmlkZXJzLCB7IG1pZGRsZXdhcmUgYXMgcHJvdmlkZXJzIH0gZnJvbSAnLi9wcm92aWRlcnMnO1xuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vc2V0dGluZ3MnO1xuXG5sZXQgZ3JhbnQ7XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKHNlc3Npb24oe1xuXHRzZWNyZXQ6ICdncmFudCcsXG5cdHJlc2F2ZTogdHJ1ZSxcblx0c2F2ZVVuaW5pdGlhbGl6ZWQ6IHRydWVcbn0pKTtcblxuLy8gZ3JhbnRcbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKHBhdGgsIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuXHRpZiAoZ3JhbnQpIHtcblx0XHRncmFudChyZXEsIHJlcywgbmV4dCk7XG5cdH0gZWxzZSB7XG5cdFx0bmV4dCgpO1xuXHR9XG59KTtcblxuLy8gY2FsbGJhY2tzXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcblx0ZmliZXIoKCkgPT4ge1xuXHRcdHJlZGlyZWN0KHJlcSwgcmVzLCBuZXh0KTtcblx0fSkucnVuKCk7XG59KTtcblxuLy8gcHJvdmlkZXJzXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcblx0ZmliZXIoKCkgPT4ge1xuXHRcdHByb3ZpZGVycyhyZXEsIHJlcywgbmV4dCk7XG5cdH0pLnJ1bigpO1xufSk7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0Y29uc3QgY29uZmlnID0gZ2VuZXJhdGVDb25maWcoKTtcblxuXHRncmFudCA9IG5ldyBHcmFudChjb25maWcpO1xufSk7XG5cbmV4cG9ydCB7XG5cdHBhdGgsXG5cdGdlbmVyYXRlQ2FsbGJhY2ssXG5cdGdlbmVyYXRlQXBwQ2FsbGJhY2ssXG5cdFByb3ZpZGVycyxcblx0U2V0dGluZ3MsXG5cdEdyYW50RXJyb3Jcbn07XG4iLCJpbXBvcnQgeyBBY2NvdW50c1NlcnZlciB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmFjY291bnRzJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuaW1wb3J0IHsgQWNjb3VudHMgfSBmcm9tICdtZXRlb3IvYWNjb3VudHMtYmFzZSc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuaW1wb3J0IHsgR3JhbnRFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IFByb3ZpZGVycyBmcm9tICcuL3Byb3ZpZGVycyc7XG5cbmNvbnN0IHNldEF2YXRhckZyb21VcmwgPSAodXNlcklkLCB1cmwpID0+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NldEF2YXRhckZyb21TZXJ2aWNlJywgdXJsLCAnJywgJ3VybCcsIChlcnIpID0+IHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdGlmIChlcnIuZGV0YWlscy50aW1lVG9SZXNldCAmJiBlcnIuZGV0YWlscy50aW1lVG9SZXNldCkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KCh0KCdlcnJvci10b28tbWFueS1yZXF1ZXN0cycsIHtcblx0XHRcdFx0XHRcdFx0c2Vjb25kczogcGFyc2VJbnQoZXJyLmRldGFpbHMudGltZVRvUmVzZXQgLyAxMDAwKVxuXHRcdFx0XHRcdFx0fSkpKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHQoJ0F2YXRhcl91cmxfaW52YWxpZF9vcl9lcnJvcicpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSk7XG59O1xuXG5jb25zdCBmaW5kVXNlckJ5T0F1dGhJZCA9IChwcm92aWRlck5hbWUsIGlkKSA9PiB7XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHsgW2BzZXR0aW5ncy5wcm9maWxlLm9hdXRoLiR7IHByb3ZpZGVyTmFtZSB9YF06IGlkIH0pO1xufTtcblxuY29uc3QgYWRkT0F1dGhJZFRvVXNlclByb2ZpbGUgPSAodXNlciwgcHJvdmlkZXJOYW1lLCBwcm92aWRlcklkKSA9PiB7XG5cdGNvbnN0IHByb2ZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCB1c2VyLnNldHRpbmdzLnByb2ZpbGUsIHtcblx0XHRvYXV0aDoge1xuXHRcdFx0Li4udXNlci5zZXR0aW5ncy5wcm9maWxlLm9hdXRoLFxuXHRcdFx0W3Byb3ZpZGVyTmFtZV06IHByb3ZpZGVySWRcblx0XHR9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldFByb2ZpbGUodXNlci5pZCwgcHJvZmlsZSk7XG59O1xuXG5mdW5jdGlvbiBnZXRBY2Nlc3NUb2tlbihyZXEpIHtcblx0Y29uc3QgaSA9IHJlcS51cmwuaW5kZXhPZignPycpO1xuXG5cdGlmIChpID09PSAtMSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IGJhcmVQYXRoID0gcmVxLnVybC5zdWJzdHJpbmcoaSArIDEpO1xuXHRjb25zdCBzcGxpdFBhdGggPSBiYXJlUGF0aC5zcGxpdCgnJicpO1xuXHRjb25zdCB0b2tlbiA9IHNwbGl0UGF0aC5maW5kKHAgPT4gcC5tYXRjaCgvYWNjZXNzX3Rva2VuPVthLXpBLVowLTldKy8pKTtcblxuXHRpZiAodG9rZW4pIHtcblx0XHRyZXR1cm4gdG9rZW4ucmVwbGFjZSgnYWNjZXNzX3Rva2VuPScsICcnKTtcblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXV0aGVudGljYXRlKHByb3ZpZGVyTmFtZSwgcmVxKSB7XG5cdGxldCB0b2tlbnM7XG5cdGNvbnN0IGFjY2Vzc1Rva2VuID0gZ2V0QWNjZXNzVG9rZW4ocmVxKTtcblx0Y29uc3QgcHJvdmlkZXIgPSBQcm92aWRlcnMuZ2V0KHByb3ZpZGVyTmFtZSk7XG5cblx0aWYgKCFwcm92aWRlcikge1xuXHRcdHRocm93IG5ldyBHcmFudEVycm9yKGBQcm92aWRlciAnJHsgcHJvdmlkZXJOYW1lIH0nIG5vdCBmb3VuZGApO1xuXHR9XG5cblx0Y29uc3QgdXNlckRhdGEgPSBwcm92aWRlci5nZXRVc2VyKGFjY2Vzc1Rva2VuKTtcblxuXHRsZXQgdXNlciA9IGZpbmRVc2VyQnlPQXV0aElkKHByb3ZpZGVyTmFtZSwgdXNlckRhdGEuaWQpO1xuXG5cdGlmICh1c2VyKSB7XG5cdFx0dXNlci5pZCA9IHVzZXIuX2lkO1xuXHR9IGVsc2Uge1xuXHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlFbWFpbEFkZHJlc3ModXNlckRhdGEuZW1haWwpO1xuXHRcdGlmICh1c2VyKSB7XG5cdFx0XHR1c2VyLmlkID0gdXNlci5faWQ7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHVzZXIpIHtcblx0XHRhZGRPQXV0aElkVG9Vc2VyUHJvZmlsZSh1c2VyLCBwcm92aWRlck5hbWUsIHVzZXJEYXRhLmlkKTtcblxuXHRcdGNvbnN0IGxvZ2luUmVzdWx0ID0gYXdhaXQgQWNjb3VudHNTZXJ2ZXIubG9naW5XaXRoVXNlcih7IGlkOiB1c2VyLmlkIH0pO1xuXG5cdFx0dG9rZW5zID0gbG9naW5SZXN1bHQudG9rZW5zO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnN0IGlkID0gQWNjb3VudHMuY3JlYXRlVXNlcih7XG5cdFx0XHRlbWFpbDogdXNlckRhdGEuZW1haWwsXG5cdFx0XHR1c2VybmFtZTogdXNlckRhdGEudXNlcm5hbWVcblx0XHR9KTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldFByb2ZpbGUoaWQsIHtcblx0XHRcdGF2YXRhcjogdXNlckRhdGEuYXZhdGFyLFxuXHRcdFx0b2F1dGg6IHtcblx0XHRcdFx0W3Byb3ZpZGVyTmFtZV06IHVzZXJEYXRhLmlkXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0TmFtZShpZCwgdXNlckRhdGEubmFtZSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0RW1haWxWZXJpZmllZChpZCwgdXNlckRhdGEuZW1haWwpO1xuXG5cdFx0YXdhaXQgc2V0QXZhdGFyRnJvbVVybChpZCwgdXNlckRhdGEuYXZhdGFyKTtcblxuXHRcdGNvbnN0IGxvZ2luUmVzdWx0ID0gYXdhaXQgQWNjb3VudHNTZXJ2ZXIubG9naW5XaXRoVXNlcih7IGlkIH0pO1xuXG5cdFx0dG9rZW5zID0gbG9naW5SZXN1bHQudG9rZW5zO1xuXHR9XG5cblx0cmV0dXJuIHRva2Vucztcbn1cbiIsImV4cG9ydCBjbGFzcyBHcmFudEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuXHRjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG5cdFx0c3VwZXIoLi4uYXJncyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgUHJvdmlkZXJzIGZyb20gJy4vcHJvdmlkZXJzJztcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IHBhdGgsIGdlbmVyYXRlQ2FsbGJhY2ssIGdlbmVyYXRlQXBwQ2FsbGJhY2sgfSBmcm9tICcuL3JvdXRlcyc7XG5cbmZ1bmN0aW9uIGFkZFByb3ZpZGVycyhjb25maWcpIHtcblx0U2V0dGluZ3MuZm9yRWFjaCgoc2V0dGluZ3MsIHByb3ZpZGVyTmFtZSkgPT4ge1xuXHRcdGlmIChzZXR0aW5ncy5lbmFibGVkID09PSB0cnVlKSB7XG5cdFx0XHRjb25zdCByZWdpc3RlcmVkUHJvdmlkZXIgPSBQcm92aWRlcnMuZ2V0KHByb3ZpZGVyTmFtZSk7XG5cblx0XHRcdGlmICghcmVnaXN0ZXJlZFByb3ZpZGVyKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYE5vIGNvbmZpZ3VyYXRpb24gZm9yICckeyBwcm92aWRlck5hbWUgfScgcHJvdmlkZXJgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gYmFzaWMgc2V0dGluZ3Ncblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdGtleTogc2V0dGluZ3Mua2V5LFxuXHRcdFx0XHRzZWNyZXQ6IHNldHRpbmdzLnNlY3JldCxcblx0XHRcdFx0c2NvcGU6IHJlZ2lzdGVyZWRQcm92aWRlci5zY29wZSxcblx0XHRcdFx0Y2FsbGJhY2s6IGdlbmVyYXRlQ2FsbGJhY2socHJvdmlkZXJOYW1lKVxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gc2V0IGVhY2ggYXBwXG5cdFx0XHRTZXR0aW5ncy5hcHBzLmZvckVhY2goKF8sIGFwcE5hbWUpID0+IHtcblx0XHRcdFx0ZGF0YVthcHBOYW1lXSA9IHtcblx0XHRcdFx0XHRjYWxsYmFjazogZ2VuZXJhdGVBcHBDYWxsYmFjayhwcm92aWRlck5hbWUsIGFwcE5hbWUpXG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uZmlnW3Byb3ZpZGVyTmFtZV0gPSBkYXRhO1xuXHRcdH1cblx0fSk7XG59XG5cbmNvbnN0IGNvbmZpZyA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWcoKSB7XG5cdGNvbmZpZ1snc2VydmVyJ10gPSB7XG5cdFx0cHJvdG9jb2w6ICdodHRwJyxcblx0XHRob3N0OiBSb2NrZXRDaGF0Lmhvc3RuYW1lLFxuXHRcdHBhdGgsXG5cdFx0c3RhdGU6IHRydWVcblx0fTtcblxuXHRhZGRQcm92aWRlcnMoY29uZmlnKTtcblxuXHRyZXR1cm4gY29uZmlnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKCkge1xuXHRyZXR1cm4gY29uZmlnO1xufVxuIiwiaW1wb3J0IHsgY2hlY2sgfSBmcm9tICdtZXRlb3IvY2hlY2snO1xuXG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcbmltcG9ydCB7IHJvdXRlcyB9IGZyb20gJy4vcm91dGVzJztcblxuY2xhc3MgUHJvdmlkZXJzIGV4dGVuZHMgU3RvcmFnZSB7XG5cdHJlZ2lzdGVyKG5hbWUsIG9wdGlvbnMsIGdldFVzZXIpIHtcblx0XHRjaGVjayhuYW1lLCBTdHJpbmcpO1xuXHRcdGNoZWNrKG9wdGlvbnMsIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuXHRcdFx0c2NvcGU6IE1hdGNoLk9uZU9mKFN0cmluZywgW1N0cmluZ10pXG5cdFx0fSk7XG5cdFx0Y2hlY2soZ2V0VXNlciwgRnVuY3Rpb24pO1xuXG5cdFx0dGhpcy5fYWRkKG5hbWUudG9Mb3dlckNhc2UoKSwge1xuXHRcdFx0c2NvcGU6IG9wdGlvbnMuc2NvcGUsXG5cdFx0XHRnZXRVc2VyXG5cdFx0fSk7XG5cdH1cbn1cblxuY29uc3QgcHJvdmlkZXJzID0gbmV3IFByb3ZpZGVycztcblxuZXhwb3J0IGRlZmF1bHQgcHJvdmlkZXJzO1xuXG5leHBvcnQgZnVuY3Rpb24gbWlkZGxld2FyZShyZXEsIHJlcywgbmV4dCkge1xuXHRjb25zdCByb3V0ZSA9IHJvdXRlcy5wcm92aWRlcnMocmVxKTtcblxuXHRpZiAocm91dGUpIHtcblx0XHRjb25zdCBsaXN0ID0gW107XG5cblx0XHRwcm92aWRlcnMuZm9yRWFjaCgoXywgbmFtZSkgPT4gbGlzdC5wdXNoKG5hbWUpKTtcblxuXHRcdHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0ZGF0YTogbGlzdFxuXHRcdH0pKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRuZXh0KCk7XG59XG4iLCJpbXBvcnQgeyBhdXRoZW50aWNhdGUgfSBmcm9tICcuL2F1dGhlbnRpY2F0ZSc7XG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyByb3V0ZXMgfSBmcm9tICcuL3JvdXRlcyc7XG5pbXBvcnQgeyBHcmFudEVycm9yIH0gZnJvbSAnLi9lcnJvcic7XG5cbmZ1bmN0aW9uIHBhcnNlVXJsKHVybCwgY29uZmlnKSB7XG5cdHJldHVybiB1cmwucmVwbGFjZSgvXFx7W1xcIF0qKHByb3ZpZGVyfGFjY2Vzc1Rva2VufHJlZnJlc2hUb2tlbnxlcnJvcilbXFwgXSpcXH0vZywgKF8sIGtleSkgPT4gY29uZmlnW2tleV0pO1xufVxuXG5mdW5jdGlvbiBnZXRBcHBDb25maWcocHJvdmlkZXJOYW1lLCBhcHBOYW1lKSB7XG5cdGNvbnN0IHByb3ZpZGVyQ29uZmlnID0gU2V0dGluZ3MuZ2V0KHByb3ZpZGVyTmFtZSk7XG5cblx0aWYgKHByb3ZpZGVyQ29uZmlnKSB7XG5cdFx0cmV0dXJuIFNldHRpbmdzLmFwcHMuZ2V0KGFwcE5hbWUpO1xuXHR9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KSB7XG5cdGNvbnN0IHJvdXRlID0gcm91dGVzLmFwcENhbGxiYWNrKHJlcSk7XG5cblx0Ly8gaGFuZGxlIGFwcCBjYWxsYmFja1xuXHRpZiAocm91dGUpIHtcblx0XHRjb25zdCBjb25maWcgPSB7XG5cdFx0XHRwcm92aWRlcjogcm91dGUucHJvdmlkZXJcblx0XHR9O1xuXHRcdGNvbnN0IGFwcENvbmZpZyA9IGdldEFwcENvbmZpZyhyb3V0ZS5wcm92aWRlciwgcm91dGUuYXBwKTtcblxuXHRcdGlmIChhcHBDb25maWcpIHtcblx0XHRcdGNvbnN0IHtcblx0XHRcdFx0cmVkaXJlY3RVcmwsXG5cdFx0XHRcdGVycm9yVXJsXG5cdFx0XHR9ID0gYXBwQ29uZmlnO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCB0b2tlbnMgPSBhd2FpdCBhdXRoZW50aWNhdGUocm91dGUucHJvdmlkZXIsIHJlcSk7XG5cblx0XHRcdFx0Y29uZmlnLmFjY2Vzc1Rva2VuID0gdG9rZW5zLmFjY2Vzc1Rva2VuO1xuXHRcdFx0XHRjb25maWcucmVmcmVzaFRva2VuID0gdG9rZW5zLnJlZnJlc2hUb2tlbjtcblxuXHRcdFx0XHRyZXMucmVkaXJlY3QocGFyc2VVcmwocmVkaXJlY3RVcmwsIGNvbmZpZykpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25maWcuZXJyb3IgPSBlcnJvciBpbnN0YW5jZW9mIEdyYW50RXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1NvbWV0aGluZyB3ZW50IHdyb25nJztcblxuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblxuXHRcdFx0XHRyZXMucmVkaXJlY3QocGFyc2VVcmwoZXJyb3JVcmwsIGNvbmZpZykpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0bmV4dCgpO1xufVxuIiwiZXhwb3J0IGNvbnN0IHBhdGggPSAnL19vYXV0aF9hcHBzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ2FsbGJhY2socHJvdmlkZXJOYW1lKSB7XG5cdHJldHVybiBgJHsgcGF0aCB9LyR7IHByb3ZpZGVyTmFtZSB9L2NhbGxiYWNrYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQXBwQ2FsbGJhY2socHJvdmlkZXJOYW1lLCBhcHBOYW1lKSB7XG5cdHJldHVybiBnZW5lcmF0ZUNhbGxiYWNrKGAkeyBwcm92aWRlck5hbWUgfS8keyBhcHBOYW1lIH1gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhdGhzKHJlcSkge1xuXHRjb25zdCBpID0gcmVxLnVybC5pbmRleE9mKCc/Jyk7XG5cdGxldCBiYXJlUGF0aDtcblxuXHRpZiAoaSA9PT0gLTEpIHtcblx0XHRiYXJlUGF0aCA9IHJlcS51cmw7XG5cdH0gZWxzZSB7XG5cdFx0YmFyZVBhdGggPSByZXEudXJsLnN1YnN0cmluZygwLCBpKTtcblx0fVxuXG5cdGNvbnN0IHNwbGl0UGF0aCA9IGJhcmVQYXRoLnNwbGl0KCcvJyk7XG5cblx0Ly8gQW55IG5vbi1vYXV0aCByZXF1ZXN0IHdpbGwgY29udGludWUgZG93biB0aGUgZGVmYXVsdFxuXHQvLyBtaWRkbGV3YXJlcy5cblx0aWYgKHNwbGl0UGF0aFsxXSA9PT0gJ19vYXV0aF9hcHBzJykge1xuXHRcdHJldHVybiBzcGxpdFBhdGguc2xpY2UoMik7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IHJvdXRlcyA9IHtcblx0Ly8gOnBhdGgvOnByb3ZpZGVyLzphcHAvY2FsbGJhY2tcblx0YXBwQ2FsbGJhY2s6IChyZXEpID0+IHtcblx0XHRjb25zdCBwYXRocyA9IGdldFBhdGhzKHJlcSk7XG5cblx0XHRpZiAocGF0aHMgJiYgcGF0aHNbMl0gPT09ICdjYWxsYmFjaycpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHByb3ZpZGVyOiBwYXRoc1swXSxcblx0XHRcdFx0YXBwOiBwYXRoc1sxXVxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cdC8vIDpwYXRoL3Byb3ZpZGVyc1xuXHRwcm92aWRlcnM6IChyZXEpID0+IHtcblx0XHRjb25zdCBwYXRocyA9IGdldFBhdGhzKHJlcSk7XG5cblx0XHRyZXR1cm4gcGF0aHMgJiYgcGF0aHNbMF0gPT09ICdwcm92aWRlcnMnO1xuXHR9XG59O1xuIiwiaW1wb3J0IHsgY2hlY2sgfSBmcm9tICdtZXRlb3IvY2hlY2snO1xuXG5pbXBvcnQgeyBTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuY2xhc3MgQXBwcyBleHRlbmRzIFN0b3JhZ2Uge1xuXHRhZGQobmFtZSwgYm9keSkge1xuXHRcdGNoZWNrKG5hbWUsIFN0cmluZyk7XG5cdFx0Y2hlY2soYm9keSwge1xuXHRcdFx0cmVkaXJlY3RVcmw6IFN0cmluZyxcblx0XHRcdGVycm9yVXJsOiBTdHJpbmdcblx0XHR9KTtcblxuXHRcdHRoaXMuX2FkZChuYW1lLCBib2R5KTtcblx0fVxufVxuXG5jbGFzcyBTZXR0aW5ncyBleHRlbmRzIFN0b3JhZ2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5hcHBzID0gbmV3IEFwcHM7XG5cdH1cblx0YWRkKHNldHRpbmdzKSB7XG5cdFx0Y2hlY2soc2V0dGluZ3MsIHtcblx0XHRcdGVuYWJsZWQ6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXHRcdFx0cHJvdmlkZXI6IFN0cmluZyxcblx0XHRcdGtleTogU3RyaW5nLFxuXHRcdFx0c2VjcmV0OiBTdHJpbmdcblx0XHR9KTtcblxuXHRcdHRoaXMuX2FkZChzZXR0aW5ncy5wcm92aWRlciwge1xuXHRcdFx0ZW5hYmxlZDogc2V0dGluZ3MuZW5hYmxlZCA9PT0gdHJ1ZSxcblx0XHRcdHByb3ZpZGVyOiBzZXR0aW5ncy5wcm92aWRlcixcblx0XHRcdGtleTogc2V0dGluZ3Mua2V5LFxuXHRcdFx0c2VjcmV0OiBzZXR0aW5ncy5zZWNyZXRcblx0XHR9KTtcblx0fVxufVxuXG5jb25zdCBzZXR0aW5ncyA9IG5ldyBTZXR0aW5ncztcblxuZXhwb3J0IGRlZmF1bHQgc2V0dGluZ3M7XG4iLCJleHBvcnQgY2xhc3MgU3RvcmFnZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuX2RhdGEgPSB7fTtcblx0fVxuXG5cdGFsbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fZGF0YTtcblx0fVxuXG5cdGZvckVhY2goZm4pIHtcblx0XHRPYmplY3Qua2V5cyh0aGlzLmFsbCgpKVxuXHRcdFx0LmZvckVhY2goKG5hbWUpID0+IHtcblx0XHRcdFx0Zm4odGhpcy5nZXQobmFtZSksIG5hbWUpO1xuXHRcdFx0fSk7XG5cdH1cblxuXHRnZXQobmFtZSkge1xuXHRcdHJldHVybiB0aGlzLmFsbCgpW25hbWUudG9Mb3dlckNhc2UoKV07XG5cdH1cblxuXHRoYXMobmFtZSkge1xuXHRcdHJldHVybiAhIXRoaXMuX2RhdGFbbmFtZV07XG5cdH1cblxuXHRfYWRkKG5hbWUsIGJvZHkpIHtcblx0XHRpZiAodGhpcy5oYXMobmFtZSkpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYCckeyBuYW1lIH0nIGhhdmUgYmVlbiBhbHJlYWR5IGRlZmluZWRgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLl9kYXRhW25hbWVdID0gYm9keTtcblx0fVxufVxuIl19
