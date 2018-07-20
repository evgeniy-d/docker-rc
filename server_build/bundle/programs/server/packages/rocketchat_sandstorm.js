(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var getHttpBridge, waitPromise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:sandstorm":{"server":{"lib.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_sandstorm/server/lib.js                                                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 0);
RocketChat.Sandstorm = {};

if (process.env.SANDSTORM === '1') {
  const Capnp = require('capnp');

  const SandstormHttpBridge = Capnp.importSystem('sandstorm/sandstorm-http-bridge.capnp').SandstormHttpBridge;
  let capnpConnection = null;
  let httpBridge = null;

  getHttpBridge = function () {
    if (!httpBridge) {
      capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');
      httpBridge = capnpConnection.restore(null, SandstormHttpBridge);
    }

    return httpBridge;
  };

  const promiseToFuture = function (promise) {
    const result = new Future();
    promise.then(result.return.bind(result), result.throw.bind(result));
    return result;
  };

  waitPromise = function (promise) {
    return promiseToFuture(promise).wait();
  }; // This usual implementation of this method returns an absolute URL that is invalid
  // under Sandstorm.


  UploadFS.Store.prototype.getURL = function (path) {
    return this.getRelativeURL(path);
  };
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"events.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_sandstorm/server/events.js                                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.Sandstorm.notify = function () {};

if (process.env.SANDSTORM === '1') {
  const ACTIVITY_TYPES = {
    'message': 0,
    'privateMessage': 1
  };

  RocketChat.Sandstorm.notify = function (message, userIds, caption, type) {
    const sessionId = message.sandstormSessionId;

    if (!sessionId) {
      return;
    }

    const httpBridge = getHttpBridge();
    const activity = {};

    if (type) {
      activity.type = ACTIVITY_TYPES[type];
    }

    if (caption) {
      activity.notification = {
        caption: {
          defaultText: caption
        }
      };
    }

    if (userIds) {
      activity.users = _.map(userIds, function (userId) {
        const user = Meteor.users.findOne({
          _id: userId
        }, {
          fields: {
            'services.sandstorm.id': 1
          }
        });
        return {
          identity: waitPromise(httpBridge.getSavedIdentity(user.services.sandstorm.id)).identity,
          mentioned: true
        };
      });
    }

    return waitPromise(httpBridge.getSessionContext(sessionId).context.activity(activity));
  };
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"powerbox.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_sandstorm/server/powerbox.js                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* globals getHttpBridge, waitPromise */
RocketChat.Sandstorm.offerUiView = function () {};

if (process.env.SANDSTORM === '1') {
  const Capnp = require('capnp');

  const Powerbox = Capnp.importSystem('sandstorm/powerbox.capnp');
  const Grain = Capnp.importSystem('sandstorm/grain.capnp');

  RocketChat.Sandstorm.offerUiView = function (token, serializedDescriptor, sessionId) {
    const httpBridge = getHttpBridge();
    const session = httpBridge.getSessionContext(sessionId).context;
    const api = httpBridge.getSandstormApi(sessionId).api;
    const cap = waitPromise(api.restore(new Buffer(token, 'base64'))).cap;
    return waitPromise(session.offer(cap, undefined, {
      tags: [{
        id: '15831515641881813735',
        value: new Buffer(serializedDescriptor, 'base64')
      }]
    }));
  };

  Meteor.methods({
    sandstormClaimRequest(token, serializedDescriptor) {
      const descriptor = Capnp.parsePacked(Powerbox.PowerboxDescriptor, new Buffer(serializedDescriptor, 'base64'));
      const grainTitle = Capnp.parse(Grain.UiView.PowerboxTag, descriptor.tags[0].value).title;
      const sessionId = this.connection.sandstormSessionId();
      const httpBridge = getHttpBridge();
      const session = httpBridge.getSessionContext(sessionId).context;
      const cap = waitPromise(session.claimRequest(token)).cap.castAs(Grain.UiView);
      const api = httpBridge.getSandstormApi(sessionId).api;
      const newToken = waitPromise(api.save(cap)).token.toString('base64');
      const viewInfo = waitPromise(cap.getViewInfo());
      const appTitle = viewInfo.appTitle;
      const asset = waitPromise(viewInfo.grainIcon.getUrl());
      const appIconUrl = `${asset.protocol}://${asset.hostPath}`;
      return {
        token: newToken,
        appTitle,
        appIconUrl,
        grainTitle,
        descriptor: descriptor.tags[0].value.toString('base64')
      };
    },

    sandstormOffer(token, serializedDescriptor) {
      RocketChat.Sandstorm.offerUiView(token, serializedDescriptor, this.connection.sandstormSessionId());
    }

  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:sandstorm/server/lib.js");
require("/node_modules/meteor/rocketchat:sandstorm/server/events.js");
require("/node_modules/meteor/rocketchat:sandstorm/server/powerbox.js");

/* Exports */
Package._define("rocketchat:sandstorm");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_sandstorm.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzYW5kc3Rvcm0vc2VydmVyL2xpYi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzYW5kc3Rvcm0vc2VydmVyL2V2ZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzYW5kc3Rvcm0vc2VydmVyL3Bvd2VyYm94LmpzIl0sIm5hbWVzIjpbIkZ1dHVyZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiUm9ja2V0Q2hhdCIsIlNhbmRzdG9ybSIsInByb2Nlc3MiLCJlbnYiLCJTQU5EU1RPUk0iLCJDYXBucCIsIlNhbmRzdG9ybUh0dHBCcmlkZ2UiLCJpbXBvcnRTeXN0ZW0iLCJjYXBucENvbm5lY3Rpb24iLCJodHRwQnJpZGdlIiwiZ2V0SHR0cEJyaWRnZSIsImNvbm5lY3QiLCJyZXN0b3JlIiwicHJvbWlzZVRvRnV0dXJlIiwicHJvbWlzZSIsInJlc3VsdCIsInRoZW4iLCJyZXR1cm4iLCJiaW5kIiwidGhyb3ciLCJ3YWl0UHJvbWlzZSIsIndhaXQiLCJVcGxvYWRGUyIsIlN0b3JlIiwicHJvdG90eXBlIiwiZ2V0VVJMIiwicGF0aCIsImdldFJlbGF0aXZlVVJMIiwiXyIsIm5vdGlmeSIsIkFDVElWSVRZX1RZUEVTIiwibWVzc2FnZSIsInVzZXJJZHMiLCJjYXB0aW9uIiwidHlwZSIsInNlc3Npb25JZCIsInNhbmRzdG9ybVNlc3Npb25JZCIsImFjdGl2aXR5Iiwibm90aWZpY2F0aW9uIiwiZGVmYXVsdFRleHQiLCJ1c2VycyIsIm1hcCIsInVzZXJJZCIsInVzZXIiLCJNZXRlb3IiLCJmaW5kT25lIiwiX2lkIiwiZmllbGRzIiwiaWRlbnRpdHkiLCJnZXRTYXZlZElkZW50aXR5Iiwic2VydmljZXMiLCJzYW5kc3Rvcm0iLCJpZCIsIm1lbnRpb25lZCIsImdldFNlc3Npb25Db250ZXh0IiwiY29udGV4dCIsIm9mZmVyVWlWaWV3IiwiUG93ZXJib3giLCJHcmFpbiIsInRva2VuIiwic2VyaWFsaXplZERlc2NyaXB0b3IiLCJzZXNzaW9uIiwiYXBpIiwiZ2V0U2FuZHN0b3JtQXBpIiwiY2FwIiwiQnVmZmVyIiwib2ZmZXIiLCJ1bmRlZmluZWQiLCJ0YWdzIiwidmFsdWUiLCJtZXRob2RzIiwic2FuZHN0b3JtQ2xhaW1SZXF1ZXN0IiwiZGVzY3JpcHRvciIsInBhcnNlUGFja2VkIiwiUG93ZXJib3hEZXNjcmlwdG9yIiwiZ3JhaW5UaXRsZSIsInBhcnNlIiwiVWlWaWV3IiwiUG93ZXJib3hUYWciLCJ0aXRsZSIsImNvbm5lY3Rpb24iLCJjbGFpbVJlcXVlc3QiLCJjYXN0QXMiLCJuZXdUb2tlbiIsInNhdmUiLCJ0b1N0cmluZyIsInZpZXdJbmZvIiwiZ2V0Vmlld0luZm8iLCJhcHBUaXRsZSIsImFzc2V0IiwiZ3JhaW5JY29uIiwiZ2V0VXJsIiwiYXBwSWNvblVybCIsInByb3RvY29sIiwiaG9zdFBhdGgiLCJzYW5kc3Rvcm1PZmZlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGFBQU9LLENBQVA7QUFBUzs7QUFBckIsQ0FBdEMsRUFBNkQsQ0FBN0Q7QUFJWEMsV0FBV0MsU0FBWCxHQUF1QixFQUF2Qjs7QUFFQSxJQUFJQyxRQUFRQyxHQUFSLENBQVlDLFNBQVosS0FBMEIsR0FBOUIsRUFBbUM7QUFDbEMsUUFBTUMsUUFBUVIsUUFBUSxPQUFSLENBQWQ7O0FBQ0EsUUFBTVMsc0JBQXNCRCxNQUFNRSxZQUFOLENBQW1CLHVDQUFuQixFQUE0REQsbUJBQXhGO0FBRUEsTUFBSUUsa0JBQWtCLElBQXRCO0FBQ0EsTUFBSUMsYUFBYSxJQUFqQjs7QUFFQUMsa0JBQWdCLFlBQVc7QUFDMUIsUUFBSSxDQUFDRCxVQUFMLEVBQWlC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LFdBQXJCLENBQWlDRyxLQUFqQyxFQUF3Q0Msb0JBQXhDLEVBQ0MsS0FBS29CLFVBQUwsQ0FBZ0I1QyxrQkFBaEIsRUFERDtBQUVBOztBQXpCYSxHQUFmO0FBMkJBLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2FuZHN0b3JtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBnZXRIdHRwQnJpZGdlLCB3YWl0UHJvbWlzZSwgVXBsb2FkRlMgKi9cbi8qIGV4cG9ydGVkIGdldEh0dHBCcmlkZ2UsIHdhaXRQcm9taXNlICovXG5pbXBvcnQgRnV0dXJlIGZyb20gJ2ZpYmVycy9mdXR1cmUnO1xuXG5Sb2NrZXRDaGF0LlNhbmRzdG9ybSA9IHt9O1xuXG5pZiAocHJvY2Vzcy5lbnYuU0FORFNUT1JNID09PSAnMScpIHtcblx0Y29uc3QgQ2FwbnAgPSByZXF1aXJlKCdjYXBucCcpO1xuXHRjb25zdCBTYW5kc3Rvcm1IdHRwQnJpZGdlID0gQ2FwbnAuaW1wb3J0U3lzdGVtKCdzYW5kc3Rvcm0vc2FuZHN0b3JtLWh0dHAtYnJpZGdlLmNhcG5wJykuU2FuZHN0b3JtSHR0cEJyaWRnZTtcblxuXHRsZXQgY2FwbnBDb25uZWN0aW9uID0gbnVsbDtcblx0bGV0IGh0dHBCcmlkZ2UgPSBudWxsO1xuXG5cdGdldEh0dHBCcmlkZ2UgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAoIWh0dHBCcmlkZ2UpIHtcblx0XHRcdGNhcG5wQ29ubmVjdGlvbiA9IENhcG5wLmNvbm5lY3QoJ3VuaXg6L3RtcC9zYW5kc3Rvcm0tYXBpJyk7XG5cdFx0XHRodHRwQnJpZGdlID0gY2FwbnBDb25uZWN0aW9uLnJlc3RvcmUobnVsbCwgU2FuZHN0b3JtSHR0cEJyaWRnZSk7XG5cdFx0fVxuXHRcdHJldHVybiBodHRwQnJpZGdlO1xuXHR9O1xuXG5cdGNvbnN0IHByb21pc2VUb0Z1dHVyZSA9IGZ1bmN0aW9uKHByb21pc2UpIHtcblx0XHRjb25zdCByZXN1bHQgPSBuZXcgRnV0dXJlKCk7XG5cdFx0cHJvbWlzZS50aGVuKHJlc3VsdC5yZXR1cm4uYmluZChyZXN1bHQpLCByZXN1bHQudGhyb3cuYmluZChyZXN1bHQpKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9O1xuXG5cdHdhaXRQcm9taXNlID0gZnVuY3Rpb24ocHJvbWlzZSkge1xuXHRcdHJldHVybiBwcm9taXNlVG9GdXR1cmUocHJvbWlzZSkud2FpdCgpO1xuXHR9O1xuXG5cdC8vIFRoaXMgdXN1YWwgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtZXRob2QgcmV0dXJucyBhbiBhYnNvbHV0ZSBVUkwgdGhhdCBpcyBpbnZhbGlkXG5cdC8vIHVuZGVyIFNhbmRzdG9ybS5cblx0VXBsb2FkRlMuU3RvcmUucHJvdG90eXBlLmdldFVSTCA9IGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRSZWxhdGl2ZVVSTChwYXRoKTtcblx0fTtcbn1cbiIsIi8qIGdsb2JhbHMgZ2V0SHR0cEJyaWRnZSwgd2FpdFByb21pc2UgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblJvY2tldENoYXQuU2FuZHN0b3JtLm5vdGlmeSA9IGZ1bmN0aW9uKCkge307XG5cbmlmIChwcm9jZXNzLmVudi5TQU5EU1RPUk0gPT09ICcxJykge1xuXHRjb25zdCBBQ1RJVklUWV9UWVBFUyA9IHtcblx0XHQnbWVzc2FnZSc6IDAsXG5cdFx0J3ByaXZhdGVNZXNzYWdlJzogMVxuXHR9O1xuXG5cdFJvY2tldENoYXQuU2FuZHN0b3JtLm5vdGlmeSA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHVzZXJJZHMsIGNhcHRpb24sIHR5cGUpIHtcblx0XHRjb25zdCBzZXNzaW9uSWQgPSBtZXNzYWdlLnNhbmRzdG9ybVNlc3Npb25JZDtcblx0XHRpZiAoIXNlc3Npb25JZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb25zdCBodHRwQnJpZGdlID0gZ2V0SHR0cEJyaWRnZSgpO1xuXHRcdGNvbnN0IGFjdGl2aXR5ID0ge307XG5cblx0XHRpZiAodHlwZSkge1xuXHRcdFx0YWN0aXZpdHkudHlwZSA9IEFDVElWSVRZX1RZUEVTW3R5cGVdO1xuXHRcdH1cblxuXHRcdGlmIChjYXB0aW9uKSB7XG5cdFx0XHRhY3Rpdml0eS5ub3RpZmljYXRpb24gPSB7Y2FwdGlvbjoge2RlZmF1bHRUZXh0OiBjYXB0aW9ufX07XG5cdFx0fVxuXG5cdFx0aWYgKHVzZXJJZHMpIHtcblx0XHRcdGFjdGl2aXR5LnVzZXJzID0gXy5tYXAodXNlcklkcywgZnVuY3Rpb24odXNlcklkKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7X2lkOiB1c2VySWR9LCB7ZmllbGRzOiB7J3NlcnZpY2VzLnNhbmRzdG9ybS5pZCc6IDF9fSk7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0aWRlbnRpdHk6IHdhaXRQcm9taXNlKGh0dHBCcmlkZ2UuZ2V0U2F2ZWRJZGVudGl0eSh1c2VyLnNlcnZpY2VzLnNhbmRzdG9ybS5pZCkpLmlkZW50aXR5LFxuXHRcdFx0XHRcdG1lbnRpb25lZDogdHJ1ZVxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHdhaXRQcm9taXNlKGh0dHBCcmlkZ2UuZ2V0U2Vzc2lvbkNvbnRleHQoc2Vzc2lvbklkKS5jb250ZXh0LmFjdGl2aXR5KGFjdGl2aXR5KSk7XG5cdH07XG59XG4iLCIvKiBnbG9iYWxzIGdldEh0dHBCcmlkZ2UsIHdhaXRQcm9taXNlICovXG5cblJvY2tldENoYXQuU2FuZHN0b3JtLm9mZmVyVWlWaWV3ID0gZnVuY3Rpb24oKSB7fTtcblxuaWYgKHByb2Nlc3MuZW52LlNBTkRTVE9STSA9PT0gJzEnKSB7XG5cdGNvbnN0IENhcG5wID0gcmVxdWlyZSgnY2FwbnAnKTtcblx0Y29uc3QgUG93ZXJib3ggPSBDYXBucC5pbXBvcnRTeXN0ZW0oJ3NhbmRzdG9ybS9wb3dlcmJveC5jYXBucCcpO1xuXHRjb25zdCBHcmFpbiA9IENhcG5wLmltcG9ydFN5c3RlbSgnc2FuZHN0b3JtL2dyYWluLmNhcG5wJyk7XG5cblx0Um9ja2V0Q2hhdC5TYW5kc3Rvcm0ub2ZmZXJVaVZpZXcgPSBmdW5jdGlvbih0b2tlbiwgc2VyaWFsaXplZERlc2NyaXB0b3IsIHNlc3Npb25JZCkge1xuXHRcdGNvbnN0IGh0dHBCcmlkZ2UgPSBnZXRIdHRwQnJpZGdlKCk7XG5cdFx0Y29uc3Qgc2Vzc2lvbiA9IGh0dHBCcmlkZ2UuZ2V0U2Vzc2lvbkNvbnRleHQoc2Vzc2lvbklkKS5jb250ZXh0O1xuXHRcdGNvbnN0IGFwaSA9IGh0dHBCcmlkZ2UuZ2V0U2FuZHN0b3JtQXBpKHNlc3Npb25JZCkuYXBpO1xuXHRcdGNvbnN0IGNhcCA9IHdhaXRQcm9taXNlKGFwaS5yZXN0b3JlKG5ldyBCdWZmZXIodG9rZW4sICdiYXNlNjQnKSkpLmNhcDtcblx0XHRyZXR1cm4gd2FpdFByb21pc2Uoc2Vzc2lvbi5vZmZlcihjYXAsIHVuZGVmaW5lZCwge3RhZ3M6IFt7XG5cdFx0XHRpZDogJzE1ODMxNTE1NjQxODgxODEzNzM1Jyxcblx0XHRcdHZhbHVlOiBuZXcgQnVmZmVyKHNlcmlhbGl6ZWREZXNjcmlwdG9yLCAnYmFzZTY0Jylcblx0XHR9XX0pKTtcblx0fTtcblxuXHRNZXRlb3IubWV0aG9kcyh7XG5cdFx0c2FuZHN0b3JtQ2xhaW1SZXF1ZXN0KHRva2VuLCBzZXJpYWxpemVkRGVzY3JpcHRvcikge1xuXHRcdFx0Y29uc3QgZGVzY3JpcHRvciA9IENhcG5wLnBhcnNlUGFja2VkKFBvd2VyYm94LlBvd2VyYm94RGVzY3JpcHRvciwgbmV3IEJ1ZmZlcihzZXJpYWxpemVkRGVzY3JpcHRvciwgJ2Jhc2U2NCcpKTtcblx0XHRcdGNvbnN0IGdyYWluVGl0bGUgPSBDYXBucC5wYXJzZShHcmFpbi5VaVZpZXcuUG93ZXJib3hUYWcsIGRlc2NyaXB0b3IudGFnc1swXS52YWx1ZSkudGl0bGU7XG5cdFx0XHRjb25zdCBzZXNzaW9uSWQgPSB0aGlzLmNvbm5lY3Rpb24uc2FuZHN0b3JtU2Vzc2lvbklkKCk7XG5cdFx0XHRjb25zdCBodHRwQnJpZGdlID0gZ2V0SHR0cEJyaWRnZSgpO1xuXHRcdFx0Y29uc3Qgc2Vzc2lvbiA9IGh0dHBCcmlkZ2UuZ2V0U2Vzc2lvbkNvbnRleHQoc2Vzc2lvbklkKS5jb250ZXh0O1xuXHRcdFx0Y29uc3QgY2FwID0gd2FpdFByb21pc2Uoc2Vzc2lvbi5jbGFpbVJlcXVlc3QodG9rZW4pKS5jYXAuY2FzdEFzKEdyYWluLlVpVmlldyk7XG5cdFx0XHRjb25zdCBhcGkgPSBodHRwQnJpZGdlLmdldFNhbmRzdG9ybUFwaShzZXNzaW9uSWQpLmFwaTtcblx0XHRcdGNvbnN0IG5ld1Rva2VuID0gd2FpdFByb21pc2UoYXBpLnNhdmUoY2FwKSkudG9rZW4udG9TdHJpbmcoJ2Jhc2U2NCcpO1xuXHRcdFx0Y29uc3Qgdmlld0luZm8gPSB3YWl0UHJvbWlzZShjYXAuZ2V0Vmlld0luZm8oKSk7XG5cdFx0XHRjb25zdCBhcHBUaXRsZSA9IHZpZXdJbmZvLmFwcFRpdGxlO1xuXHRcdFx0Y29uc3QgYXNzZXQgPSB3YWl0UHJvbWlzZSh2aWV3SW5mby5ncmFpbkljb24uZ2V0VXJsKCkpO1xuXHRcdFx0Y29uc3QgYXBwSWNvblVybCA9IGAkeyBhc3NldC5wcm90b2NvbCB9Oi8vJHsgYXNzZXQuaG9zdFBhdGggfWA7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0b2tlbjogbmV3VG9rZW4sXG5cdFx0XHRcdGFwcFRpdGxlLFxuXHRcdFx0XHRhcHBJY29uVXJsLFxuXHRcdFx0XHRncmFpblRpdGxlLFxuXHRcdFx0XHRkZXNjcmlwdG9yOiBkZXNjcmlwdG9yLnRhZ3NbMF0udmFsdWUudG9TdHJpbmcoJ2Jhc2U2NCcpXG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0c2FuZHN0b3JtT2ZmZXIodG9rZW4sIHNlcmlhbGl6ZWREZXNjcmlwdG9yKSB7XG5cdFx0XHRSb2NrZXRDaGF0LlNhbmRzdG9ybS5vZmZlclVpVmlldyh0b2tlbiwgc2VyaWFsaXplZERlc2NyaXB0b3IsXG5cdFx0XHRcdHRoaXMuY29ubmVjdGlvbi5zYW5kc3Rvcm1TZXNzaW9uSWQoKSk7XG5cdFx0fVxuXHR9KTtcbn1cbiJdfQ==
