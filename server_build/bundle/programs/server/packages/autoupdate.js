(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Autoupdate, ClientVersions;

var require = meteorInstall({"node_modules":{"meteor":{"autoupdate":{"autoupdate_server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/autoupdate/autoupdate_server.js                                                                      //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 0);
Autoupdate = {}; // The collection of acceptable client versions.

ClientVersions = new Mongo.Collection("meteor_autoupdate_clientVersions", {
  connection: null
}); // The client hash includes __meteor_runtime_config__, so wait until
// all packages have loaded and have had a chance to populate the
// runtime config before using the client hash as our default auto
// update version id.
// Note: Tests allow people to override Autoupdate.autoupdateVersion before
// startup.

Autoupdate.autoupdateVersion = null;
Autoupdate.autoupdateVersionRefreshable = null;
Autoupdate.autoupdateVersionCordova = null;
Autoupdate.appId = __meteor_runtime_config__.appId = process.env.APP_ID;
var syncQueue = new Meteor._SynchronousQueue(); // updateVersions can only be called after the server has fully loaded.

var updateVersions = function (shouldReloadClientProgram) {
  // Step 1: load the current client program on the server and update the
  // hash values in __meteor_runtime_config__.
  if (shouldReloadClientProgram) {
    WebAppInternals.reloadClientPrograms();
  } // If we just re-read the client program, or if we don't have an autoupdate
  // version, calculate it.


  if (shouldReloadClientProgram || Autoupdate.autoupdateVersion === null) {
    Autoupdate.autoupdateVersion = process.env.AUTOUPDATE_VERSION || WebApp.calculateClientHashNonRefreshable();
  } // If we just recalculated it OR if it was set by (eg) test-in-browser,
  // ensure it ends up in __meteor_runtime_config__.


  __meteor_runtime_config__.autoupdateVersion = Autoupdate.autoupdateVersion;
  Autoupdate.autoupdateVersionRefreshable = __meteor_runtime_config__.autoupdateVersionRefreshable = process.env.AUTOUPDATE_VERSION || WebApp.calculateClientHashRefreshable();
  Autoupdate.autoupdateVersionCordova = __meteor_runtime_config__.autoupdateVersionCordova = process.env.AUTOUPDATE_VERSION || WebApp.calculateClientHashCordova(); // Step 2: form the new client boilerplate which contains the updated
  // assets and __meteor_runtime_config__.

  if (shouldReloadClientProgram) {
    WebAppInternals.generateBoilerplate();
  } // XXX COMPAT WITH 0.8.3


  if (!ClientVersions.findOne({
    current: true
  })) {
    // To ensure apps with version of Meteor prior to 0.9.0 (in
    // which the structure of documents in `ClientVersions` was
    // different) also reload.
    ClientVersions.insert({
      current: true
    });
  }

  if (!ClientVersions.findOne({
    _id: "version"
  })) {
    ClientVersions.insert({
      _id: "version",
      version: Autoupdate.autoupdateVersion
    });
  } else {
    ClientVersions.update("version", {
      $set: {
        version: Autoupdate.autoupdateVersion
      }
    });
  }

  if (!ClientVersions.findOne({
    _id: "version-cordova"
  })) {
    ClientVersions.insert({
      _id: "version-cordova",
      version: Autoupdate.autoupdateVersionCordova,
      refreshable: false
    });
  } else {
    ClientVersions.update("version-cordova", {
      $set: {
        version: Autoupdate.autoupdateVersionCordova
      }
    });
  } // Use `onListening` here because we need to use
  // `WebAppInternals.refreshableAssets`, which is only set after
  // `WebApp.generateBoilerplate` is called by `main` in webapp.


  WebApp.onListening(function () {
    if (!ClientVersions.findOne({
      _id: "version-refreshable"
    })) {
      ClientVersions.insert({
        _id: "version-refreshable",
        version: Autoupdate.autoupdateVersionRefreshable,
        assets: WebAppInternals.refreshableAssets
      });
    } else {
      ClientVersions.update("version-refreshable", {
        $set: {
          version: Autoupdate.autoupdateVersionRefreshable,
          assets: WebAppInternals.refreshableAssets
        }
      });
    }
  });
};

Meteor.publish("meteor_autoupdate_clientVersions", function (appId) {
  // `null` happens when a client doesn't have an appId and passes
  // `undefined` to `Meteor.subscribe`. `undefined` is translated to
  // `null` as JSON doesn't have `undefined.
  check(appId, Match.OneOf(String, undefined, null)); // Don't notify clients using wrong appId such as mobile apps built with a
  // different server but pointing at the same local url

  if (Autoupdate.appId && appId && Autoupdate.appId !== appId) return [];
  return ClientVersions.find();
}, {
  is_auto: true
});
Meteor.startup(function () {
  updateVersions(false);
});
var fut = new Future(); // We only want 'refresh' to trigger 'updateVersions' AFTER onListen,
// so we add a queued task that waits for onListen before 'refresh' can queue
// tasks. Note that the `onListening` callbacks do not fire until after
// Meteor.startup, so there is no concern that the 'updateVersions' calls from
// 'refresh' will overlap with the `updateVersions` call from Meteor.startup.

syncQueue.queueTask(function () {
  fut.wait();
});
WebApp.onListening(function () {
  fut.return();
});

var enqueueVersionsRefresh = function () {
  syncQueue.queueTask(function () {
    updateVersions(true);
  });
}; // Listen for the special {refresh: 'client'} message, which signals that a
// client asset has changed.


process.on('message', Meteor.bindEnvironment(function (m) {
  if (m && m.refresh === 'client') {
    enqueueVersionsRefresh();
  }
}, "handling client refresh message")); // Another way to tell the process to refresh: send SIGHUP signal

process.on('SIGHUP', Meteor.bindEnvironment(function () {
  enqueueVersionsRefresh();
}, "handling SIGHUP signal for refresh"));
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/autoupdate/autoupdate_server.js");

/* Exports */
Package._define("autoupdate", {
  Autoupdate: Autoupdate
});

})();

//# sourceURL=meteor://💻app/packages/autoupdate.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYXV0b3VwZGF0ZS9hdXRvdXBkYXRlX3NlcnZlci5qcyJdLCJuYW1lcyI6WyJGdXR1cmUiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIkF1dG91cGRhdGUiLCJDbGllbnRWZXJzaW9ucyIsIk1vbmdvIiwiQ29sbGVjdGlvbiIsImNvbm5lY3Rpb24iLCJhdXRvdXBkYXRlVmVyc2lvbiIsImF1dG91cGRhdGVWZXJzaW9uUmVmcmVzaGFibGUiLCJhdXRvdXBkYXRlVmVyc2lvbkNvcmRvdmEiLCJhcHBJZCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJwcm9jZXNzIiwiZW52IiwiQVBQX0lEIiwic3luY1F1ZXVlIiwiTWV0ZW9yIiwiX1N5bmNocm9ub3VzUXVldWUiLCJ1cGRhdGVWZXJzaW9ucyIsInNob3VsZFJlbG9hZENsaWVudFByb2dyYW0iLCJXZWJBcHBJbnRlcm5hbHMiLCJyZWxvYWRDbGllbnRQcm9ncmFtcyIsIkFVVE9VUERBVEVfVkVSU0lPTiIsIldlYkFwcCIsImNhbGN1bGF0ZUNsaWVudEhhc2hOb25SZWZyZXNoYWJsZSIsImNhbGN1bGF0ZUNsaWVudEhhc2hSZWZyZXNoYWJsZSIsImNhbGN1bGF0ZUNsaWVudEhhc2hDb3Jkb3ZhIiwiZ2VuZXJhdGVCb2lsZXJwbGF0ZSIsImZpbmRPbmUiLCJjdXJyZW50IiwiaW5zZXJ0IiwiX2lkIiwidmVyc2lvbiIsInVwZGF0ZSIsIiRzZXQiLCJyZWZyZXNoYWJsZSIsIm9uTGlzdGVuaW5nIiwiYXNzZXRzIiwicmVmcmVzaGFibGVBc3NldHMiLCJwdWJsaXNoIiwiY2hlY2siLCJNYXRjaCIsIk9uZU9mIiwiU3RyaW5nIiwidW5kZWZpbmVkIiwiZmluZCIsImlzX2F1dG8iLCJzdGFydHVwIiwiZnV0IiwicXVldWVUYXNrIiwid2FpdCIsInJldHVybiIsImVucXVldWVWZXJzaW9uc1JlZnJlc2giLCJvbiIsImJpbmRFbnZpcm9u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QUlBLElBQUlDLHlCQUF5QixZQUFZO0FBQ3ZDckMsWUFBVWtDLFNBQVYsQ0FBb0IsWUFBWTtBQUM5Qi9CLG1CQUFlLElBQWY7QUFDRCxHQUZEO0FBR0QsQ0FKRCxDLENBTUE7QUFDQTs7O0FBQ0FOLFFBQVF5QyxFQUFSLENBQVcsU0FBWCxFQUFzQnJDLE9BQU9zQyxlQUFQLENBQXVCLFVBQVVDLENBQVYsRUFBYTtBQUN4RCxNQUFJQSxLQUFLQSxFQUFFQyxPQUFGLEtBQWMsUUFBdkIsRUFBaUM7QUFDL0JKO0FBQ0Q7QUFDRixDQUpxQixFQUluQixpQ0FKbUIsQ0FBdEIsRSxDQU1BOztBQUNBeEMsUUFBUXlDLEVBQVIsQ0FBVyxRQUFYLEVBQXFCckMsT0FBT3NDLGVBQVAsQ0FBdUIsWUFBWTtBQUN0REY7QUFDRCxDQUZvQixFQUVsQixvQ0FGa0IsQ0FBckIsRSIsImZpbGUiOiIvcGFja2FnZXMvYXV0b3VwZGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFB1Ymxpc2ggdGhlIGN1cnJlbnQgY2xpZW50IHZlcnNpb25zIHRvIHRoZSBjbGllbnQuICBXaGVuIGEgY2xpZW50XG4vLyBzZWVzIHRoZSBzdWJzY3JpcHRpb24gY2hhbmdlIGFuZCB0aGF0IHRoZXJlIGlzIGEgbmV3IHZlcnNpb24gb2YgdGhlXG4vLyBjbGllbnQgYXZhaWxhYmxlIG9uIHRoZSBzZXJ2ZXIsIGl0IGNhbiByZWxvYWQuXG4vL1xuLy8gQnkgZGVmYXVsdCB0aGVyZSBhcmUgdHdvIGN1cnJlbnQgY2xpZW50IHZlcnNpb25zLiBUaGUgcmVmcmVzaGFibGUgY2xpZW50XG4vLyB2ZXJzaW9uIGlzIGlkZW50aWZpZWQgYnkgYSBoYXNoIG9mIHRoZSBjbGllbnQgcmVzb3VyY2VzIHNlZW4gYnkgdGhlIGJyb3dzZXJcbi8vIHRoYXQgYXJlIHJlZnJlc2hhYmxlLCBzdWNoIGFzIENTUywgd2hpbGUgdGhlIG5vbiByZWZyZXNoYWJsZSBjbGllbnQgdmVyc2lvblxuLy8gaXMgaWRlbnRpZmllZCBieSBhIGhhc2ggb2YgdGhlIHJlc3Qgb2YgdGhlIGNsaWVudCBhc3NldHNcbi8vICh0aGUgSFRNTCwgY29kZSwgYW5kIHN0YXRpYyBmaWxlcyBpbiB0aGUgYHB1YmxpY2AgZGlyZWN0b3J5KS5cbi8vXG4vLyBJZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUgYEFVVE9VUERBVEVfVkVSU0lPTmAgaXMgc2V0IGl0IHdpbGwgYmVcbi8vIHVzZWQgYXMgdGhlIGNsaWVudCBpZCBpbnN0ZWFkLiAgWW91IGNhbiB1c2UgdGhpcyB0byBjb250cm9sIHdoZW5cbi8vIHRoZSBjbGllbnQgcmVsb2Fkcy4gIEZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCB0byBvbmx5IGZvcmNlIGFcbi8vIHJlbG9hZCBvbiBtYWpvciBjaGFuZ2VzLCB5b3UgY2FuIHVzZSBhIGN1c3RvbSBBVVRPVVBEQVRFX1ZFUlNJT05cbi8vIHdoaWNoIHlvdSBvbmx5IGNoYW5nZSB3aGVuIHNvbWV0aGluZyB3b3J0aCBwdXNoaW5nIHRvIGNsaWVudHNcbi8vIGltbWVkaWF0ZWx5IGhhcHBlbnMuXG4vL1xuLy8gVGhlIHNlcnZlciBwdWJsaXNoZXMgYSBgbWV0ZW9yX2F1dG91cGRhdGVfY2xpZW50VmVyc2lvbnNgXG4vLyBjb2xsZWN0aW9uLiBUaGVyZSBhcmUgdHdvIGRvY3VtZW50cyBpbiB0aGlzIGNvbGxlY3Rpb24sIGEgZG9jdW1lbnRcbi8vIHdpdGggX2lkICd2ZXJzaW9uJyB3aGljaCByZXByZXNlbnRzIHRoZSBub24gcmVmcmVzaGFibGUgY2xpZW50IGFzc2V0cyxcbi8vIGFuZCBhIGRvY3VtZW50IHdpdGggX2lkICd2ZXJzaW9uLXJlZnJlc2hhYmxlJyB3aGljaCByZXByZXNlbnRzIHRoZVxuLy8gcmVmcmVzaGFibGUgY2xpZW50IGFzc2V0cy4gRWFjaCBkb2N1bWVudCBoYXMgYSAndmVyc2lvbicgZmllbGRcbi8vIHdoaWNoIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGhhc2ggb2YgdGhlIHJlbGV2YW50IGFzc2V0cy4gVGhlIHJlZnJlc2hhYmxlXG4vLyBkb2N1bWVudCBhbHNvIGNvbnRhaW5zIGEgbGlzdCBvZiB0aGUgcmVmcmVzaGFibGUgYXNzZXRzLCBzbyB0aGF0IHRoZSBjbGllbnRcbi8vIGNhbiBzd2FwIGluIHRoZSBuZXcgYXNzZXRzIHdpdGhvdXQgZm9yY2luZyBhIHBhZ2UgcmVmcmVzaC4gQ2xpZW50cyBjYW5cbi8vIG9ic2VydmUgY2hhbmdlcyBvbiB0aGVzZSBkb2N1bWVudHMgdG8gZGV0ZWN0IHdoZW4gdGhlcmUgaXMgYSBuZXdcbi8vIHZlcnNpb24gYXZhaWxhYmxlLlxuLy9cbi8vIEluIHRoaXMgaW1wbGVtZW50YXRpb24gb25seSB0d28gZG9jdW1lbnRzIGFyZSBwcmVzZW50IGluIHRoZSBjb2xsZWN0aW9uXG4vLyB0aGUgY3VycmVudCByZWZyZXNoYWJsZSBjbGllbnQgdmVyc2lvbiBhbmQgdGhlIGN1cnJlbnQgbm9uUmVmcmVzaGFibGUgY2xpZW50XG4vLyB2ZXJzaW9uLiAgRGV2ZWxvcGVycyBjYW4gZWFzaWx5IGV4cGVyaW1lbnQgd2l0aCBkaWZmZXJlbnQgdmVyc2lvbmluZyBhbmRcbi8vIHVwZGF0aW5nIG1vZGVscyBieSBmb3JraW5nIHRoaXMgcGFja2FnZS5cblxuaW1wb3J0IEZ1dHVyZSBmcm9tIFwiZmliZXJzL2Z1dHVyZVwiO1xuXG5BdXRvdXBkYXRlID0ge307XG5cbi8vIFRoZSBjb2xsZWN0aW9uIG9mIGFjY2VwdGFibGUgY2xpZW50IHZlcnNpb25zLlxuQ2xpZW50VmVyc2lvbnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbihcIm1ldGVvcl9hdXRvdXBkYXRlX2NsaWVudFZlcnNpb25zXCIsXG4gIHsgY29ubmVjdGlvbjogbnVsbCB9KTtcblxuLy8gVGhlIGNsaWVudCBoYXNoIGluY2x1ZGVzIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18sIHNvIHdhaXQgdW50aWxcbi8vIGFsbCBwYWNrYWdlcyBoYXZlIGxvYWRlZCBhbmQgaGF2ZSBoYWQgYSBjaGFuY2UgdG8gcG9wdWxhdGUgdGhlXG4vLyBydW50aW1lIGNvbmZpZyBiZWZvcmUgdXNpbmcgdGhlIGNsaWVudCBoYXNoIGFzIG91ciBkZWZhdWx0IGF1dG9cbi8vIHVwZGF0ZSB2ZXJzaW9uIGlkLlxuXG4vLyBOb3RlOiBUZXN0cyBhbGxvdyBwZW9wbGUgdG8gb3ZlcnJpZGUgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbiBiZWZvcmVcbi8vIHN0YXJ0dXAuXG5BdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uID0gbnVsbDtcbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSA9IG51bGw7XG5BdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSA9IG51bGw7XG5BdXRvdXBkYXRlLmFwcElkID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hcHBJZCA9IHByb2Nlc3MuZW52LkFQUF9JRDtcblxudmFyIHN5bmNRdWV1ZSA9IG5ldyBNZXRlb3IuX1N5bmNocm9ub3VzUXVldWUoKTtcblxuLy8gdXBkYXRlVmVyc2lvbnMgY2FuIG9ubHkgYmUgY2FsbGVkIGFmdGVyIHRoZSBzZXJ2ZXIgaGFzIGZ1bGx5IGxvYWRlZC5cbnZhciB1cGRhdGVWZXJzaW9ucyA9IGZ1bmN0aW9uIChzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtKSB7XG4gIC8vIFN0ZXAgMTogbG9hZCB0aGUgY3VycmVudCBjbGllbnQgcHJvZ3JhbSBvbiB0aGUgc2VydmVyIGFuZCB1cGRhdGUgdGhlXG4gIC8vIGhhc2ggdmFsdWVzIGluIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uXG4gIGlmIChzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtKSB7XG4gICAgV2ViQXBwSW50ZXJuYWxzLnJlbG9hZENsaWVudFByb2dyYW1zKCk7XG4gIH1cblxuICAvLyBJZiB3ZSBqdXN0IHJlLXJlYWQgdGhlIGNsaWVudCBwcm9ncmFtLCBvciBpZiB3ZSBkb24ndCBoYXZlIGFuIGF1dG91cGRhdGVcbiAgLy8gdmVyc2lvbiwgY2FsY3VsYXRlIGl0LlxuICBpZiAoc2hvdWxkUmVsb2FkQ2xpZW50UHJvZ3JhbSB8fCBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uID09PSBudWxsKSB7XG4gICAgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbiA9XG4gICAgICBwcm9jZXNzLmVudi5BVVRPVVBEQVRFX1ZFUlNJT04gfHxcbiAgICAgIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUoKTtcbiAgfVxuICAvLyBJZiB3ZSBqdXN0IHJlY2FsY3VsYXRlZCBpdCBPUiBpZiBpdCB3YXMgc2V0IGJ5IChlZykgdGVzdC1pbi1icm93c2VyLFxuICAvLyBlbnN1cmUgaXQgZW5kcyB1cCBpbiBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlxuICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmF1dG91cGRhdGVWZXJzaW9uID1cbiAgICBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uO1xuXG4gIEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSA9XG4gICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hdXRvdXBkYXRlVmVyc2lvblJlZnJlc2hhYmxlID1cbiAgICAgIHByb2Nlc3MuZW52LkFVVE9VUERBVEVfVkVSU0lPTiB8fFxuICAgICAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hSZWZyZXNoYWJsZSgpO1xuXG4gIEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhID1cbiAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSA9XG4gICAgICBwcm9jZXNzLmVudi5BVVRPVVBEQVRFX1ZFUlNJT04gfHxcbiAgICAgIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoQ29yZG92YSgpO1xuXG4gIC8vIFN0ZXAgMjogZm9ybSB0aGUgbmV3IGNsaWVudCBib2lsZXJwbGF0ZSB3aGljaCBjb250YWlucyB0aGUgdXBkYXRlZFxuICAvLyBhc3NldHMgYW5kIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uXG4gIGlmIChzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtKSB7XG4gICAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcbiAgfVxuXG4gIC8vIFhYWCBDT01QQVQgV0lUSCAwLjguM1xuICBpZiAoISBDbGllbnRWZXJzaW9ucy5maW5kT25lKHtjdXJyZW50OiB0cnVlfSkpIHtcbiAgICAvLyBUbyBlbnN1cmUgYXBwcyB3aXRoIHZlcnNpb24gb2YgTWV0ZW9yIHByaW9yIHRvIDAuOS4wIChpblxuICAgIC8vIHdoaWNoIHRoZSBzdHJ1Y3R1cmUgb2YgZG9jdW1lbnRzIGluIGBDbGllbnRWZXJzaW9uc2Agd2FzXG4gICAgLy8gZGlmZmVyZW50KSBhbHNvIHJlbG9hZC5cbiAgICBDbGllbnRWZXJzaW9ucy5pbnNlcnQoe2N1cnJlbnQ6IHRydWV9KTtcbiAgfVxuXG4gIGlmICghIENsaWVudFZlcnNpb25zLmZpbmRPbmUoe19pZDogXCJ2ZXJzaW9uXCJ9KSkge1xuICAgIENsaWVudFZlcnNpb25zLmluc2VydCh7XG4gICAgICBfaWQ6IFwidmVyc2lvblwiLFxuICAgICAgdmVyc2lvbjogQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvblxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIENsaWVudFZlcnNpb25zLnVwZGF0ZShcInZlcnNpb25cIiwgeyAkc2V0OiB7XG4gICAgICB2ZXJzaW9uOiBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uXG4gICAgfX0pO1xuICB9XG5cbiAgaWYgKCEgQ2xpZW50VmVyc2lvbnMuZmluZE9uZSh7X2lkOiBcInZlcnNpb24tY29yZG92YVwifSkpIHtcbiAgICBDbGllbnRWZXJzaW9ucy5pbnNlcnQoe1xuICAgICAgX2lkOiBcInZlcnNpb24tY29yZG92YVwiLFxuICAgICAgdmVyc2lvbjogQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbkNvcmRvdmEsXG4gICAgICByZWZyZXNoYWJsZTogZmFsc2VcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBDbGllbnRWZXJzaW9ucy51cGRhdGUoXCJ2ZXJzaW9uLWNvcmRvdmFcIiwgeyAkc2V0OiB7XG4gICAgICB2ZXJzaW9uOiBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uQ29yZG92YVxuICAgIH19KTtcbiAgfVxuXG4gIC8vIFVzZSBgb25MaXN0ZW5pbmdgIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHVzZVxuICAvLyBgV2ViQXBwSW50ZXJuYWxzLnJlZnJlc2hhYmxlQXNzZXRzYCwgd2hpY2ggaXMgb25seSBzZXQgYWZ0ZXJcbiAgLy8gYFdlYkFwcC5nZW5lcmF0ZUJvaWxlcnBsYXRlYCBpcyBjYWxsZWQgYnkgYG1haW5gIGluIHdlYmFwcC5cbiAgV2ViQXBwLm9uTGlzdGVuaW5nKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoISBDbGllbnRWZXJzaW9ucy5maW5kT25lKHtfaWQ6IFwidmVyc2lvbi1yZWZyZXNoYWJsZVwifSkpIHtcbiAgICAgIENsaWVudFZlcnNpb25zLmluc2VydCh7XG4gICAgICAgIF9pZDogXCJ2ZXJzaW9uLXJlZnJlc2hhYmxlXCIsXG4gICAgICAgIHZlcnNpb246IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSxcbiAgICAgICAgYXNzZXRzOiBXZWJBcHBJbnRlcm5hbHMucmVmcmVzaGFibGVBc3NldHNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBDbGllbnRWZXJzaW9ucy51cGRhdGUoXCJ2ZXJzaW9uLXJlZnJlc2hhYmxlXCIsIHsgJHNldDoge1xuICAgICAgICB2ZXJzaW9uOiBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uUmVmcmVzaGFibGUsXG4gICAgICAgIGFzc2V0czogV2ViQXBwSW50ZXJuYWxzLnJlZnJlc2hhYmxlQXNzZXRzXG4gICAgICB9fSk7XG4gICAgfVxuICB9KTtcbn07XG5cbk1ldGVvci5wdWJsaXNoKFxuICBcIm1ldGVvcl9hdXRvdXBkYXRlX2NsaWVudFZlcnNpb25zXCIsXG4gIGZ1bmN0aW9uIChhcHBJZCkge1xuICAgIC8vIGBudWxsYCBoYXBwZW5zIHdoZW4gYSBjbGllbnQgZG9lc24ndCBoYXZlIGFuIGFwcElkIGFuZCBwYXNzZXNcbiAgICAvLyBgdW5kZWZpbmVkYCB0byBgTWV0ZW9yLnN1YnNjcmliZWAuIGB1bmRlZmluZWRgIGlzIHRyYW5zbGF0ZWQgdG9cbiAgICAvLyBgbnVsbGAgYXMgSlNPTiBkb2Vzbid0IGhhdmUgYHVuZGVmaW5lZC5cbiAgICBjaGVjayhhcHBJZCwgTWF0Y2guT25lT2YoU3RyaW5nLCB1bmRlZmluZWQsIG51bGwpKTtcblxuICAgIC8vIERvbid0IG5vdGlmeSBjbGllbnRzIHVzaW5nIHdyb25nIGFwcElkIHN1Y2ggYXMgbW9iaWxlIGFwcHMgYnVpbHQgd2l0aCBhXG4gICAgLy8gZGlmZmVyZW50IHNlcnZlciBidXQgcG9pbnRpbmcgYXQgdGhlIHNhbWUgbG9jYWwgdXJsXG4gICAgaWYgKEF1dG91cGRhdGUuYXBwSWQgJiYgYXBwSWQgJiYgQXV0b3VwZGF0ZS5hcHBJZCAhPT0gYXBwSWQpXG4gICAgICByZXR1cm4gW107XG5cbiAgICByZXR1cm4gQ2xpZW50VmVyc2lvbnMuZmluZCgpO1xuICB9LFxuICB7aXNfYXV0bzogdHJ1ZX1cbik7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uICgpIHtcbiAgdXBkYXRlVmVyc2lvbnMoZmFsc2UpO1xufSk7XG5cbnZhciBmdXQgPSBuZXcgRnV0dXJlKCk7XG5cbi8vIFdlIG9ubHkgd2FudCAncmVmcmVzaCcgdG8gdHJpZ2dlciAndXBkYXRlVmVyc2lvbnMnIEFGVEVSIG9uTGlzdGVuLFxuLy8gc28gd2UgYWRkIGEgcXVldWVkIHRhc2sgdGhhdCB3YWl0cyBmb3Igb25MaXN0ZW4gYmVmb3JlICdyZWZyZXNoJyBjYW4gcXVldWVcbi8vIHRhc2tzLiBOb3RlIHRoYXQgdGhlIGBvbkxpc3RlbmluZ2AgY2FsbGJhY2tzIGRvIG5vdCBmaXJlIHVudGlsIGFmdGVyXG4vLyBNZXRlb3Iuc3RhcnR1cCwgc28gdGhlcmUgaXMgbm8gY29uY2VybiB0aGF0IHRoZSAndXBkYXRlVmVyc2lvbnMnIGNhbGxzIGZyb21cbi8vICdyZWZyZXNoJyB3aWxsIG92ZXJsYXAgd2l0aCB0aGUgYHVwZGF0ZVZlcnNpb25zYCBjYWxsIGZyb20gTWV0ZW9yLnN0YXJ0dXAuXG5cbnN5bmNRdWV1ZS5xdWV1ZVRhc2soZnVuY3Rpb24gKCkge1xuICBmdXQud2FpdCgpO1xufSk7XG5cbldlYkFwcC5vbkxpc3RlbmluZyhmdW5jdGlvbiAoKSB7XG4gIGZ1dC5yZXR1cm4oKTtcbn0pO1xuXG52YXIgZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgc3luY1F1ZXVlLnF1ZXVlVGFzayhmdW5jdGlvbiAoKSB7XG4gICAgdXBkYXRlVmVyc2lvbnModHJ1ZSk7XG4gIH0pO1xufTtcblxuLy8gTGlzdGVuIGZvciB0aGUgc3BlY2lhbCB7cmVmcmVzaDogJ2NsaWVudCd9IG1lc3NhZ2UsIHdoaWNoIHNpZ25hbHMgdGhhdCBhXG4vLyBjbGllbnQgYXNzZXQgaGFzIGNoYW5nZWQuXG5wcm9jZXNzLm9uKCdtZXNzYWdlJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAobSkge1xuICBpZiAobSAmJiBtLnJlZnJlc2ggPT09ICdjbGllbnQnKSB7XG4gICAgZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCgpO1xuICB9XG59LCBcImhhbmRsaW5nIGNsaWVudCByZWZyZXNoIG1lc3NhZ2VcIikpO1xuXG4vLyBBbm90aGVyIHdheSB0byB0ZWxsIHRoZSBwcm9jZXNzIHRvIHJlZnJlc2g6IHNlbmQgU0lHSFVQIHNpZ25hbFxucHJvY2Vzcy5vbignU0lHSFVQJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoKSB7XG4gIGVucXVldWVWZXJzaW9uc1JlZnJlc2goKTtcbn0sIFwiaGFuZGxpbmcgU0lHSFVQIHNpZ25hbCBmb3IgcmVmcmVzaFwiKSk7XG5cbiJdfQ==
