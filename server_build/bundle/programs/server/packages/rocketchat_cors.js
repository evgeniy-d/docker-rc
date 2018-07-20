(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:cors":{"cors.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_cors/cors.js                                                                       //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 1);
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 2);
let tls;
module.watch(require("tls"), {
  default(v) {
    tls = v;
  }

}, 3);
// FIX For TLS error see more here https://github.com/RocketChat/Rocket.Chat/issues/9316
// TODO: Remove after NodeJS fix it, more information https://github.com/nodejs/node/issues/16196 https://github.com/nodejs/node/pull/16853
tls.DEFAULT_ECDH_CURVE = 'auto'; // Revert change from Meteor 1.6.1 who set ignoreUndefined: true
// more information https://github.com/meteor/meteor/pull/9444

let mongoOptions = {
  ignoreUndefined: false
};
const mongoOptionStr = process.env.MONGO_OPTIONS;

if (typeof mongoOptionStr !== 'undefined') {
  const jsonMongoOptions = JSON.parse(mongoOptionStr);
  mongoOptions = Object.assign({}, mongoOptions, jsonMongoOptions);
}

Mongo.setConnectionOptions(mongoOptions);
WebApp.rawConnectHandlers.use(Meteor.bindEnvironment(function (req, res, next) {
  if (req._body) {
    return next();
  }

  if (req.headers['transfer-encoding'] === undefined && isNaN(req.headers['content-length'])) {
    return next();
  }

  if (req.headers['content-type'] !== '' && req.headers['content-type'] !== undefined) {
    return next();
  }

  if (req.url.indexOf(`${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX}/ufs/`) === 0) {
    return next();
  }

  let buf = '';
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    return buf += chunk;
  });
  req.on('end', function () {
    if (RocketChat && RocketChat.debugLevel === 'debug') {
      console.log('[request]'.green, req.method, req.url, '\nheaders ->', req.headers, '\nbody ->', buf);
    }

    try {
      req.body = JSON.parse(buf);
    } catch (error) {
      req.body = buf;
    }

    req._body = true;
    return next();
  });
}));
WebApp.rawConnectHandlers.use(function (req, res, next) {
  if (/^\/(api|_timesync|sockjs|tap-i18n|__cordova)(\/|$)/.test(req.url)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  const setHeader = res.setHeader;

  res.setHeader = function (key, val) {
    if (key.toLowerCase() === 'access-control-allow-origin' && val === 'http://meteor.local') {
      return;
    }

    return setHeader.apply(this, arguments);
  };

  return next();
});
const _staticFilesMiddleware = WebAppInternals.staticFilesMiddleware;

WebAppInternals._staticFilesMiddleware = function (staticFiles, req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return _staticFilesMiddleware(staticFiles, req, res, next);
};

const oldHttpServerListeners = WebApp.httpServer.listeners('request').slice(0);
WebApp.httpServer.removeAllListeners('request');
WebApp.httpServer.addListener('request', function (req, res) {
  const next = () => {
    for (const oldListener of oldHttpServerListeners) {
      oldListener.apply(WebApp.httpServer, arguments);
    }
  };

  if (RocketChat.settings.get('Force_SSL') !== true) {
    next();
    return;
  }

  const remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress;
  const localhostRegexp = /^\s*(127\.0\.0\.1|::1)\s*$/;

  const localhostTest = function (x) {
    return localhostRegexp.test(x);
  };

  const isLocal = localhostRegexp.test(remoteAddress) && (!req.headers['x-forwarded-for'] || _.all(req.headers['x-forwarded-for'].split(','), localhostTest));

  const isSsl = req.connection.pair || req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'].indexOf('https') !== -1;

  if (RocketChat && RocketChat.debugLevel === 'debug') {
    console.log('req.url', req.url);
    console.log('remoteAddress', remoteAddress);
    console.log('isLocal', isLocal);
    console.log('isSsl', isSsl);
    console.log('req.headers', req.headers);
  }

  if (!isLocal && !isSsl) {
    let host = req.headers['host'] || url.parse(Meteor.absoluteUrl()).hostname;
    host = host.replace(/:\d+$/, '');
    res.writeHead(302, {
      'Location': `https://${host}${req.url}`
    });
    res.end();
    return;
  }

  return next();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_cors/common.js                                                                     //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
Meteor.startup(function () {
  RocketChat.settings.onload('Force_SSL', function (key, value) {
    Meteor.absoluteUrl.defaultOptions.secure = value;
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:cors/cors.js");
require("/node_modules/meteor/rocketchat:cors/common.js");

/* Exports */
Package._define("rocketchat:cors");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_cors.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjb3JzL2NvcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y29ycy9jb21tb24uanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwidXJsIiwiTW9uZ28iLCJ0bHMiLCJERUZBVUxUX0VDREhfQ1VSVkUiLCJtb25nb09wdGlvbnMiLCJpZ25vcmVVbmRlZmluZWQiLCJtb25nb09wdGlvblN0ciIsInByb2Nlc3MiLCJlbnYiLCJNT05HT19PUFRJT05TIiwianNvbk1vbmdvT3B0aW9ucyIsIkpTT04iLCJwYXJzZSIsIk9iamVjdCIsImFzc2lnbiIsInNldENvbm5lY3Rpb25PcHRpb25zIiwiV2ViQXBwIiwicmF3Q29ubmVjdEhhbmRsZXJzIiwidXNlIiwiTWV0ZW9yIiwiYmluZEVudmlyb25tZW50IiwicmVxIiwicmVzIiwibmV4dCIsIl9ib2R5IiwiaGVhZGVycyIsInVuZGVmaW5lZCIsImlzTmFOIiwiaW5kZXhPZiIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsImJ1ZiIsInNldEVuY29kaW5nIiwib24iLCJjaHVuayIsIlJvY2tldENoYXQiLCJkZWJ1Z0xldmVsIiwiY29uc29sZSIsImxvZyIsImdyZWVuIiwibWV0aG9kIiwiYm9keSIsImVycm9yIiwidGVzdCIsInNldEhlYWRlciIsImtleSIsInZhbCIsInRvTG93ZXJDYXNlIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJfc3RhdGljRmlsZXNNaWRkbGV3YXJlIiwiV2ViQXBwSW50ZXJuYWxzIiwic3RhdGljRmlsZXNNaWRkbGV3YXJlIiwic3RhdGljRmlsZXMiLCJvbGRIdHRwU2VydmVyTGlzdGVuZXJzIiwiaHR0cFNlcnZlciIsImxpc3RlbmVycyIsInNsaWNlIiwicmVtb3ZlQWxsTGlzdGVuZXJzIiwiYWRkTGlzdGVuZXIiLCJvbGRMaXN0ZW5lciIsInNldHRpbmdzIiwiZ2V0IiwicmVtb3RlQWRkcmVzcyIsImNvbm5lY3Rpb24iLCJzb2NrZXQiLCJsb2NhbGhvc3RSZWdleHAiLCJsb2NhbGhvc3RUZXN0IiwieCIsImlzTG9jYWwiLCJhbGwiLCJzcGxpdCIsImlzU3NsIiwicGFpciIsImhvc3QiLCJhYnNvbHV0ZVVybCIsImhvc3RuYW1lIiwicmVwbGFjZSIsIndyaXRlSGVhZCIsImVuZCIsInN0YXJ0dXAiLCJvbmxvYWQiLCJ2YWx1ZSIsImRlZmF1bHRPcHRpb25zIiwic2VjdXJlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLEdBQUo7QUFBUUwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLEtBQVIsQ0FBYixFQUE0QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0MsVUFBSUQsQ0FBSjtBQUFNOztBQUFsQixDQUE1QixFQUFnRCxDQUFoRDtBQUFtRCxJQUFJRSxLQUFKO0FBQVVOLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxjQUFSLENBQWIsRUFBcUM7QUFBQ0ksUUFBTUYsQ0FBTixFQUFRO0FBQUNFLFlBQU1GLENBQU47QUFBUTs7QUFBbEIsQ0FBckMsRUFBeUQsQ0FBekQ7QUFBNEQsSUFBSUcsR0FBSjtBQUFRUCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsS0FBUixDQUFiLEVBQTRCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDRyxVQUFJSCxDQUFKO0FBQU07O0FBQWxCLENBQTVCLEVBQWdELENBQWhEO0FBT3ZNO0FBQ0E7QUFDQUcsSUFBSUMsa0JBQUosR0FBeUIsTUFBekIsQyxDQUVBO0FBQ0E7O0FBQ0EsSUFBSUMsZUFBZTtBQUNsQkMsbUJBQWlCO0FBREMsQ0FBbkI7QUFJQSxNQUFNQyxpQkFBaUJDLFFBQVFDLEdBQVIsQ0FBWUMsYUFBbkM7O0FBQ0EsSUFBSSxPQUFPSCxjQUFQLEtBQTBCLFdBQTlCLEVBQTJDO0FBQzFDLFFBQU1JLG1CQUFtQkMsS0FBS0MsS0FBTCxDQUFXTixjQUFYLENBQXpCO0FBRUFGLGlCQUFlUyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQlYsWUFBbEIsRUFBZ0NNLGdCQUFoQyxDQUFmO0FBQ0E7O0FBRURULE1BQU1jLG9CQUFOLENBQTJCWCxZQUEzQjtBQUVBWSxPQUFPQyxrQkFBUCxDQUEwQkMsR0FBMUIsQ0FBOEJDLE9BQU9DLGVBQVAsQ0FBdUIsVUFBU0MsR0FBVCxFQUFjQyxHQUFkLEVBQW1CQyxJQUFuQixFQUF5QjtBQUM3RSxNQUFJRixJQUFJRyxLQUFSLEVBQWU7QUFDZCxXQUFPRCxNQUFQO0FBQ0E7O0FBQ0QsTUFBSUYsSUFBSUksT0FBSixDQUFZLG1CQUFaLE1BQXFDQyxTQUFyQyxJQUFrREMsTUFBTU4sSUFBSUksT0FBSixDQUFZLGdCQUFaLENBQU4sQ0FBdEQsRUFBNEY7QUFDM0YsV0FBT0YsTUFBUDtBQUNBOztBQUNELE1BQUlGLElBQUlJLE9BQUosQ0FBWSxjQUFaLE1BQWdDLEVBQWhDLElBQXNDSixJQUFJSSxPQUFKLENBQVksY0FBWixNQUFnQ0MsU0FBMUUsRUFBcUY7QUFDcEYsV0FBT0gsTUFBUDtBQUNBOztBQUNELE1BQUlGLElBQUlyQixHQUFKLENBQVE0QixPQUFSLENBQWlCLEdBQUdDLDBCQUEwQkMsb0JBQXNCLE9BQXBFLE1BQWdGLENBQXBGLEVBQXVGO0FBQ3RGLFdBQU9QLE1BQVA7QUFDQTs7QUFFRCxNQUFJUSxNQUFNLEVBQVY7QUFDQVYsTUFBSVcsV0FBSixDQUFnQixNQUFoQjtBQUNBWCxNQUFJWSxFQUFKLENBQU8sTUFBUCxFQUFlLFVBQVNDLEtBQVQsRUFBZ0I7QUFDOUIsV0FBT0gsT0FBT0csS0FBZDtBQUNBLEdBRkQ7QUFJQWIsTUFBSVksRUFBSixDQUFPLEtBQVAsRUFBYyxZQUFXO0FBQ3hCLFFBQUlFLGNBQWNBLFdBQVdDLFVBQVgsS0FBMEIsT0FBNUMsRUFBcUQ7QUFDcERDLGNBQVFDLEdBQVIsQ0FBWSxZQUFZQyxLQUF4QixFQUErQmxCLElBQUltQixNQUFuQyxFQUEyQ25CLElBQUlyQixHQUEvQyxFQUFvRCxjQUFwRCxFQUFvRXFCLElBQUlJLE9BQXhFLEVBQWlGLFdBQWpGLEVBQThGTSxHQUE5RjtBQUNBOztBQUVELFFBQUk7QUFDSFYsVUFBSW9CLElBQUosR0FBVzlCLEtBQUtDLEtBQUwsQ0FBV21CLEdBQVgsQ0FBWDtBQUNBLEtBRkQsQ0FFRSxPQUFPVyxLQUFQLEVBQWM7QUFDZnJCLFVBQUlvQixJQUFKLEdBQVdWLEdBQVg7QUFDQTs7QUFDRFYsUUFBSUcsS0FBSixHQUFZLElBQVo7QUFFQSxXQUFPRCxNQUFQO0FBQ0EsR0FiRDtBQWNBLENBbEM2QixDQUE5QjtBQW9DQVAsT0FBT0Msa0JBQVAsQ0FBMEJDLEdBQTFCLENBQThCLFVBQVNHLEdBQVQsRUFBY0MsR0FBZCxFQUFtQkMsSUFBbkIsRUFBeUI7QUFDdEQsTUFBSSxxREFBcURvQixJQUFyRCxDQUEwRHRCLElBQUlyQixHQUE5RCxDQUFKLEVBQXdFO0FBQ3ZFc0IsUUFBSXNCLFNBQUosQ0FBYyw2QkFBZCxFQUE2QyxHQUE3QztBQUNBOztBQUVELFFBQU1BLFlBQVl0QixJQUFJc0IsU0FBdEI7O0FBQ0F0QixNQUFJc0IsU0FBSixHQUFnQixVQUFTQyxHQUFULEVBQWNDLEdBQWQsRUFBbUI7QUFDbEMsUUFBSUQsSUFBSUUsV0FBSixPQUFzQiw2QkFBdEIsSUFBdURELFFBQVEscUJBQW5FLEVBQTBGO0FBQ3pGO0FBQ0E7O0FBQ0QsV0FBT0YsVUFBVUksS0FBVixDQUFnQixJQUFoQixFQUFzQkMsU0FBdEIsQ0FBUDtBQUNBLEdBTEQ7O0FBTUEsU0FBTzFCLE1BQVA7QUFDQSxDQWJEO0FBZUEsTUFBTTJCLHlCQUF5QkMsZ0JBQWdCQyxxQkFBL0M7O0FBRUFELGdCQUFnQkQsc0JBQWhCLEdBQXlDLFVBQVNHLFdBQVQsRUFBc0JoQyxHQUF0QixFQUEyQkMsR0FBM0IsRUFBZ0NDLElBQWhDLEVBQXNDO0FBQzlFRCxNQUFJc0IsU0FBSixDQUFjLDZCQUFkLEVBQTZDLEdBQTdDO0FBQ0EsU0FBT00sdUJBQXVCRyxXQUF2QixFQUFvQ2hDLEdBQXBDLEVBQXlDQyxHQUF6QyxFQUE4Q0MsSUFBOUMsQ0FBUDtBQUNBLENBSEQ7O0FBS0EsTUFBTStCLHlCQUF5QnRDLE9BQU91QyxVQUFQLENBQWtCQyxTQUFsQixDQUE0QixTQUE1QixFQUF1Q0MsS0FBdkMsQ0FBNkMsQ0FBN0MsQ0FBL0I7QUFFQXpDLE9BQU91QyxVQUFQLENBQWtCRyxrQkFBbEIsQ0FBcUMsU0FBckM7QUFFQTFDLE9BQU91QyxVQUFQLENBQWtCSSxXQUFsQixDQUE4QixTQUE5QixFQUF5QyxVQUFTdEMsR0FBVCxFQUFjQyxHQUFkLEVBQW1CO0FBQzNELFFBQU1DLE9BQU8sTUFBTTtBQUNsQixTQUFLLE1BQU1xQyxXQUFYLElBQTBCTixzQkFBMUIsRUFBa0Q7QUFDakRNLGtCQUFZWixLQUFaLENBQWtCaEMsT0FBT3VDLFVBQXpCLEVBQXFDTixTQUFyQztBQUNBO0FBQ0QsR0FKRDs7QUFNQSxNQUFJZCxXQUFXMEIsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsV0FBeEIsTUFBeUMsSUFBN0MsRUFBbUQ7QUFDbER2QztBQUNBO0FBQ0E7O0FBRUQsUUFBTXdDLGdCQUFnQjFDLElBQUkyQyxVQUFKLENBQWVELGFBQWYsSUFBZ0MxQyxJQUFJNEMsTUFBSixDQUFXRixhQUFqRTtBQUNBLFFBQU1HLGtCQUFrQiw0QkFBeEI7O0FBQ0EsUUFBTUMsZ0JBQWdCLFVBQVNDLENBQVQsRUFBWTtBQUNqQyxXQUFPRixnQkFBZ0J2QixJQUFoQixDQUFxQnlCLENBQXJCLENBQVA7QUFDQSxHQUZEOztBQUlBLFFBQU1DLFVBQVVILGdCQUFnQnZCLElBQWhCLENBQXFCb0IsYUFBckIsTUFBd0MsQ0FBQzFDLElBQUlJLE9BQUosQ0FBWSxpQkFBWixDQUFELElBQW1DL0IsRUFBRTRFLEdBQUYsQ0FBTWpELElBQUlJLE9BQUosQ0FBWSxpQkFBWixFQUErQjhDLEtBQS9CLENBQXFDLEdBQXJDLENBQU4sRUFBaURKLGFBQWpELENBQTNFLENBQWhCOztBQUNBLFFBQU1LLFFBQVFuRCxJQUFJMkMsVUFBSixDQUFlUyxJQUFmLElBQXdCcEQsSUFBSUksT0FBSixDQUFZLG1CQUFaLEtBQW9DSixJQUFJSSxPQUFKLENBQVksbUJBQVosRUFBaUNHLE9BQWpDLENBQXlDLE9BQXpDLE1BQXNELENBQUMsQ0FBakk7O0FBRUEsTUFBSU8sY0FBY0EsV0FBV0MsVUFBWCxLQUEwQixPQUE1QyxFQUFxRDtBQUNwREMsWUFBUUMsR0FBUixDQUFZLFNBQVosRUFBdUJqQixJQUFJckIsR0FBM0I7QUFDQXFDLFlBQVFDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCeUIsYUFBN0I7QUFDQTFCLFlBQVFDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCK0IsT0FBdkI7QUFDQWhDLFlBQVFDLEdBQVIsQ0FBWSxPQUFaLEVBQXFCa0MsS0FBckI7QUFDQW5DLFlBQVFDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCakIsSUFBSUksT0FBL0I7QUFDQTs7QUFFRCxNQUFJLENBQUM0QyxPQUFELElBQVksQ0FBQ0csS0FBakIsRUFBd0I7QUFDdkIsUUFBSUUsT0FBT3JELElBQUlJLE9BQUosQ0FBWSxNQUFaLEtBQXVCekIsSUFBSVksS0FBSixDQUFVTyxPQUFPd0QsV0FBUCxFQUFWLEVBQWdDQyxRQUFsRTtBQUNBRixXQUFPQSxLQUFLRyxPQUFMLENBQWEsT0FBYixFQUFzQixFQUF0QixDQUFQO0FBQ0F2RCxRQUFJd0QsU0FBSixDQUFjLEdBQWQsRUFBbUI7QUFDbEIsa0JBQWEsV0FBV0osSUFBTSxHQUFHckQsSUFBSXJCLEdBQUs7QUFEeEIsS0FBbkI7QUFHQXNCLFFBQUl5RCxHQUFKO0FBQ0E7QUFDQTs7QUFFRCxTQUFPeEQsTUFBUDtBQUNBLENBeENELEU7Ozs7Ozs7Ozs7O0FDeEZBSixPQUFPNkQsT0FBUCxDQUFlLFlBQVc7QUFDekI3QyxhQUFXMEIsUUFBWCxDQUFvQm9CLE1BQXBCLENBQTJCLFdBQTNCLEVBQXdDLFVBQVNwQyxHQUFULEVBQWNxQyxLQUFkLEVBQXFCO0FBQzVEL0QsV0FBT3dELFdBQVAsQ0FBbUJRLGNBQW5CLENBQWtDQyxNQUFsQyxHQUEyQ0YsS0FBM0M7QUFDQSxHQUZEO0FBR0EsQ0FKRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2NvcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIFdlYkFwcEludGVybmFscyAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmltcG9ydCB1cmwgZnJvbSAndXJsJztcblxuaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHRscyBmcm9tICd0bHMnO1xuLy8gRklYIEZvciBUTFMgZXJyb3Igc2VlIG1vcmUgaGVyZSBodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9pc3N1ZXMvOTMxNlxuLy8gVE9ETzogUmVtb3ZlIGFmdGVyIE5vZGVKUyBmaXggaXQsIG1vcmUgaW5mb3JtYXRpb24gaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2lzc3Vlcy8xNjE5NiBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvcHVsbC8xNjg1M1xudGxzLkRFRkFVTFRfRUNESF9DVVJWRSA9ICdhdXRvJztcblxuLy8gUmV2ZXJ0IGNoYW5nZSBmcm9tIE1ldGVvciAxLjYuMSB3aG8gc2V0IGlnbm9yZVVuZGVmaW5lZDogdHJ1ZVxuLy8gbW9yZSBpbmZvcm1hdGlvbiBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9wdWxsLzk0NDRcbmxldCBtb25nb09wdGlvbnMgPSB7XG5cdGlnbm9yZVVuZGVmaW5lZDogZmFsc2Vcbn07XG5cbmNvbnN0IG1vbmdvT3B0aW9uU3RyID0gcHJvY2Vzcy5lbnYuTU9OR09fT1BUSU9OUztcbmlmICh0eXBlb2YgbW9uZ29PcHRpb25TdHIgIT09ICd1bmRlZmluZWQnKSB7XG5cdGNvbnN0IGpzb25Nb25nb09wdGlvbnMgPSBKU09OLnBhcnNlKG1vbmdvT3B0aW9uU3RyKTtcblxuXHRtb25nb09wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBtb25nb09wdGlvbnMsIGpzb25Nb25nb09wdGlvbnMpO1xufVxuXG5Nb25nby5zZXRDb25uZWN0aW9uT3B0aW9ucyhtb25nb09wdGlvbnMpO1xuXG5XZWJBcHAucmF3Q29ubmVjdEhhbmRsZXJzLnVzZShNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cdGlmIChyZXEuX2JvZHkpIHtcblx0XHRyZXR1cm4gbmV4dCgpO1xuXHR9XG5cdGlmIChyZXEuaGVhZGVyc1sndHJhbnNmZXItZW5jb2RpbmcnXSA9PT0gdW5kZWZpbmVkICYmIGlzTmFOKHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSkge1xuXHRcdHJldHVybiBuZXh0KCk7XG5cdH1cblx0aWYgKHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSAhPT0gJycgJiYgcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gbmV4dCgpO1xuXHR9XG5cdGlmIChyZXEudXJsLmluZGV4T2YoYCR7IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggfS91ZnMvYCkgPT09IDApIHtcblx0XHRyZXR1cm4gbmV4dCgpO1xuXHR9XG5cblx0bGV0IGJ1ZiA9ICcnO1xuXHRyZXEuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcblx0cmVxLm9uKCdkYXRhJywgZnVuY3Rpb24oY2h1bmspIHtcblx0XHRyZXR1cm4gYnVmICs9IGNodW5rO1xuXHR9KTtcblxuXHRyZXEub24oJ2VuZCcsIGZ1bmN0aW9uKCkge1xuXHRcdGlmIChSb2NrZXRDaGF0ICYmIFJvY2tldENoYXQuZGVidWdMZXZlbCA9PT0gJ2RlYnVnJykge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tyZXF1ZXN0XScuZ3JlZW4sIHJlcS5tZXRob2QsIHJlcS51cmwsICdcXG5oZWFkZXJzIC0+JywgcmVxLmhlYWRlcnMsICdcXG5ib2R5IC0+JywgYnVmKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0cmVxLmJvZHkgPSBKU09OLnBhcnNlKGJ1Zik7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHJlcS5ib2R5ID0gYnVmO1xuXHRcdH1cblx0XHRyZXEuX2JvZHkgPSB0cnVlO1xuXG5cdFx0cmV0dXJuIG5leHQoKTtcblx0fSk7XG59KSk7XG5cbldlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMudXNlKGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cdGlmICgvXlxcLyhhcGl8X3RpbWVzeW5jfHNvY2tqc3x0YXAtaTE4bnxfX2NvcmRvdmEpKFxcL3wkKS8udGVzdChyZXEudXJsKSkge1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG5cdH1cblxuXHRjb25zdCBzZXRIZWFkZXIgPSByZXMuc2V0SGVhZGVyO1xuXHRyZXMuc2V0SGVhZGVyID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcblx0XHRpZiAoa2V5LnRvTG93ZXJDYXNlKCkgPT09ICdhY2Nlc3MtY29udHJvbC1hbGxvdy1vcmlnaW4nICYmIHZhbCA9PT0gJ2h0dHA6Ly9tZXRlb3IubG9jYWwnKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHJldHVybiBzZXRIZWFkZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0fTtcblx0cmV0dXJuIG5leHQoKTtcbn0pO1xuXG5jb25zdCBfc3RhdGljRmlsZXNNaWRkbGV3YXJlID0gV2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzTWlkZGxld2FyZTtcblxuV2ViQXBwSW50ZXJuYWxzLl9zdGF0aWNGaWxlc01pZGRsZXdhcmUgPSBmdW5jdGlvbihzdGF0aWNGaWxlcywgcmVxLCByZXMsIG5leHQpIHtcblx0cmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgJyonKTtcblx0cmV0dXJuIF9zdGF0aWNGaWxlc01pZGRsZXdhcmUoc3RhdGljRmlsZXMsIHJlcSwgcmVzLCBuZXh0KTtcbn07XG5cbmNvbnN0IG9sZEh0dHBTZXJ2ZXJMaXN0ZW5lcnMgPSBXZWJBcHAuaHR0cFNlcnZlci5saXN0ZW5lcnMoJ3JlcXVlc3QnKS5zbGljZSgwKTtcblxuV2ViQXBwLmh0dHBTZXJ2ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZXF1ZXN0Jyk7XG5cbldlYkFwcC5odHRwU2VydmVyLmFkZExpc3RlbmVyKCdyZXF1ZXN0JywgZnVuY3Rpb24ocmVxLCByZXMpIHtcblx0Y29uc3QgbmV4dCA9ICgpID0+IHtcblx0XHRmb3IgKGNvbnN0IG9sZExpc3RlbmVyIG9mIG9sZEh0dHBTZXJ2ZXJMaXN0ZW5lcnMpIHtcblx0XHRcdG9sZExpc3RlbmVyLmFwcGx5KFdlYkFwcC5odHRwU2VydmVyLCBhcmd1bWVudHMpO1xuXHRcdH1cblx0fTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZvcmNlX1NTTCcpICE9PSB0cnVlKSB7XG5cdFx0bmV4dCgpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHJlbW90ZUFkZHJlc3MgPSByZXEuY29ubmVjdGlvbi5yZW1vdGVBZGRyZXNzIHx8IHJlcS5zb2NrZXQucmVtb3RlQWRkcmVzcztcblx0Y29uc3QgbG9jYWxob3N0UmVnZXhwID0gL15cXHMqKDEyN1xcLjBcXC4wXFwuMXw6OjEpXFxzKiQvO1xuXHRjb25zdCBsb2NhbGhvc3RUZXN0ID0gZnVuY3Rpb24oeCkge1xuXHRcdHJldHVybiBsb2NhbGhvc3RSZWdleHAudGVzdCh4KTtcblx0fTtcblxuXHRjb25zdCBpc0xvY2FsID0gbG9jYWxob3N0UmVnZXhwLnRlc3QocmVtb3RlQWRkcmVzcykgJiYgKCFyZXEuaGVhZGVyc1sneC1mb3J3YXJkZWQtZm9yJ10gfHwgXy5hbGwocmVxLmhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddLnNwbGl0KCcsJyksIGxvY2FsaG9zdFRlc3QpKTtcblx0Y29uc3QgaXNTc2wgPSByZXEuY29ubmVjdGlvbi5wYWlyIHx8IChyZXEuaGVhZGVyc1sneC1mb3J3YXJkZWQtcHJvdG8nXSAmJiByZXEuaGVhZGVyc1sneC1mb3J3YXJkZWQtcHJvdG8nXS5pbmRleE9mKCdodHRwcycpICE9PSAtMSk7XG5cblx0aWYgKFJvY2tldENoYXQgJiYgUm9ja2V0Q2hhdC5kZWJ1Z0xldmVsID09PSAnZGVidWcnKSB7XG5cdFx0Y29uc29sZS5sb2coJ3JlcS51cmwnLCByZXEudXJsKTtcblx0XHRjb25zb2xlLmxvZygncmVtb3RlQWRkcmVzcycsIHJlbW90ZUFkZHJlc3MpO1xuXHRcdGNvbnNvbGUubG9nKCdpc0xvY2FsJywgaXNMb2NhbCk7XG5cdFx0Y29uc29sZS5sb2coJ2lzU3NsJywgaXNTc2wpO1xuXHRcdGNvbnNvbGUubG9nKCdyZXEuaGVhZGVycycsIHJlcS5oZWFkZXJzKTtcblx0fVxuXG5cdGlmICghaXNMb2NhbCAmJiAhaXNTc2wpIHtcblx0XHRsZXQgaG9zdCA9IHJlcS5oZWFkZXJzWydob3N0J10gfHwgdXJsLnBhcnNlKE1ldGVvci5hYnNvbHV0ZVVybCgpKS5ob3N0bmFtZTtcblx0XHRob3N0ID0gaG9zdC5yZXBsYWNlKC86XFxkKyQvLCAnJyk7XG5cdFx0cmVzLndyaXRlSGVhZCgzMDIsIHtcblx0XHRcdCdMb2NhdGlvbic6IGBodHRwczovLyR7IGhvc3QgfSR7IHJlcS51cmwgfWBcblx0XHR9KTtcblx0XHRyZXMuZW5kKCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0cmV0dXJuIG5leHQoKTtcbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3Mub25sb2FkKCdGb3JjZV9TU0wnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0TWV0ZW9yLmFic29sdXRlVXJsLmRlZmF1bHRPcHRpb25zLnNlY3VyZSA9IHZhbHVlO1xuXHR9KTtcbn0pO1xuIl19
