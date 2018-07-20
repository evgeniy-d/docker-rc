(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:livestream":{"server":{"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/index.js                                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.watch(require("./routes.js"));
module.watch(require("./methods.js"));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"Rooms.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/models/Rooms.js                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
RocketChat.models.Rooms.setStreamingOptionsById = function (_id, streamingOptions) {
  const update = {
    $set: {
      streamingOptions
    }
  };
  return this.update({
    _id
  }, update);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"saveStreamingOptions.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/functions/saveStreamingOptions.js                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
RocketChat.saveStreamingOptions = function (rid, streamingOptions) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveStreamingOptions'
    });
  }

  return RocketChat.models.Rooms.setStreamingOptionsById(rid, streamingOptions);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livestream.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/functions/livestream.js                                                  //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  getBroadcastStatus: () => getBroadcastStatus,
  statusStreamLiveStream: () => statusStreamLiveStream,
  statusLiveStream: () => statusLiveStream,
  setBroadcastStatus: () => setBroadcastStatus,
  createLiveStream: () => createLiveStream
});
let google;
module.watch(require("googleapis"), {
  default(v) {
    google = v;
  }

}, 0);
const OAuth2 = google.auth.OAuth2;

const p = fn => new Promise(function (resolve, reject) {
  fn(function (err, value) {
    if (err) {
      return reject(err);
    }

    resolve(value.data);
  });
});

const getBroadcastStatus = ({
  id,
  access_token,
  refresh_token,
  clientId,
  clientSecret
}) => Promise.asyncApply(() => {
  const auth = new OAuth2(clientId, clientSecret);
  auth.setCredentials({
    access_token,
    refresh_token
  });
  const youtube = google.youtube({
    version: 'v3',
    auth
  });
  const result = Promise.await(p(resolve => youtube.liveBroadcasts.list({
    part: 'id,status',
    id
  }, resolve)));
  return result.items && result.items[0] && result.items[0].status.lifeCycleStatus;
});

const statusStreamLiveStream = ({
  id,
  access_token,
  refresh_token,
  clientId,
  clientSecret
}) => Promise.asyncApply(() => {
  const auth = new OAuth2(clientId, clientSecret);
  auth.setCredentials({
    access_token,
    refresh_token
  });
  const youtube = google.youtube({
    version: 'v3',
    auth
  });
  const result = Promise.await(p(resolve => youtube.liveStreams.list({
    part: 'id,status',
    id
  }, resolve)));
  return result.items && result.items[0].status.streamStatus;
});

const statusLiveStream = ({
  id,
  access_token,
  refresh_token,
  clientId,
  clientSecret,
  status
}) => {
  const auth = new OAuth2(clientId, clientSecret);
  auth.setCredentials({
    access_token,
    refresh_token
  });
  const youtube = google.youtube({
    version: 'v3',
    auth
  });
  return p(resolve => youtube.liveBroadcasts.transition({
    part: 'id,status',
    id,
    broadcastStatus: status
  }, resolve));
};

const setBroadcastStatus = ({
  id,
  access_token,
  refresh_token,
  clientId,
  clientSecret,
  status
}) => {
  const auth = new OAuth2(clientId, clientSecret);
  auth.setCredentials({
    access_token,
    refresh_token
  });
  const youtube = google.youtube({
    version: 'v3',
    auth
  });
  return p(resolve => youtube.liveBroadcasts.transition({
    part: 'id,status',
    id,
    broadcastStatus: status
  }, resolve));
};

const createLiveStream = ({
  room,
  access_token,
  refresh_token,
  clientId,
  clientSecret
}) => Promise.asyncApply(() => {
  const auth = new OAuth2(clientId, clientSecret);
  auth.setCredentials({
    access_token,
    refresh_token
  });
  const youtube = google.youtube({
    version: 'v3',
    auth
  });
  const [stream, broadcast] = Promise.await(Promise.all([p(resolve => youtube.liveStreams.insert({
    part: 'id,snippet,cdn,contentDetails,status',
    resource: {
      snippet: {
        'title': room.name || 'RocketChat Broadcast'
      },
      'cdn': {
        'format': '480p',
        'ingestionType': 'rtmp'
      }
    }
  }, resolve)), p(resolve => youtube.liveBroadcasts.insert({
    part: 'id,snippet,contentDetails,status',
    resource: {
      snippet: {
        'title': room.name || 'RocketChat Broadcast',
        'scheduledStartTime': new Date().toISOString()
      },
      'status': {
        'privacyStatus': 'unlisted'
      }
    }
  }, resolve))]));
  Promise.await(p(resolve => youtube.liveBroadcasts.bind({
    part: 'id,snippet,status',
    // resource: {
    id: broadcast.id,
    streamId: stream.id
  }, resolve)));
  return {
    id: stream.cdn.ingestionInfo.streamName,
    stream,
    broadcast
  };
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/settings.js                                                              //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.startup(function () {
  RocketChat.settings.addGroup('LiveStream & Broadcasting', function () {
    this.add('Livestream_enabled', false, {
      type: 'boolean',
      public: true,
      alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
    });
    this.add('Broadcasting_enabled', false, {
      type: 'boolean',
      public: true,
      alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues',
      enableQuery: {
        _id: 'Livestream_enabled',
        value: true
      }
    });
    this.add('Broadcasting_client_id', '', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'Broadcasting_enabled',
        value: true
      }
    });
    this.add('Broadcasting_client_secret', '', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'Broadcasting_enabled',
        value: true
      }
    });
    this.add('Broadcasting_api_key', '', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'Broadcasting_enabled',
        value: true
      }
    });
    this.add('Broadcasting_media_server_url', '', {
      type: 'string',
      public: true,
      enableQuery: {
        _id: 'Broadcasting_enabled',
        value: true
      }
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/methods.js                                                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let createLiveStream, statusLiveStream, statusStreamLiveStream, getBroadcastStatus, setBroadcastStatus;
module.watch(require("./functions/livestream"), {
  createLiveStream(v) {
    createLiveStream = v;
  },

  statusLiveStream(v) {
    statusLiveStream = v;
  },

  statusStreamLiveStream(v) {
    statusStreamLiveStream = v;
  },

  getBroadcastStatus(v) {
    getBroadcastStatus = v;
  },

  setBroadcastStatus(v) {
    setBroadcastStatus = v;
  }

}, 1);

const selectLivestreamSettings = user => user && user.settings && user.settings.livestream;

Meteor.methods({
  livestreamStreamStatus({
    streamId
  }) {
    return Promise.asyncApply(() => {
      if (!streamId) {
        // TODO: change error
        throw new Meteor.Error('error-not-allowed', 'Livestream ID not found', {
          method: 'livestreamStreamStatus'
        });
      }

      const livestreamSettings = selectLivestreamSettings(Meteor.user());

      if (!livestreamSettings) {
        throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
          method: 'livestreamStreamStatus'
        });
      }

      const {
        access_token,
        refresh_token
      } = livestreamSettings;
      return Promise.await(statusStreamLiveStream({
        id: streamId,
        access_token,
        refresh_token,
        clientId: RocketChat.settings.get('Broadcasting_client_id'),
        clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
      }));
    });
  },

  setLivestreamStatus({
    broadcastId,
    status
  }) {
    return Promise.asyncApply(() => {
      if (!broadcastId) {
        // TODO: change error
        throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
          method: 'livestreamStart'
        });
      }

      const livestreamSettings = selectLivestreamSettings(Meteor.user());

      if (!livestreamSettings) {
        throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
          method: 'livestreamStart'
        });
      }

      const {
        access_token,
        refresh_token
      } = livestreamSettings;
      return Promise.await(statusLiveStream({
        id: broadcastId,
        access_token,
        refresh_token,
        status,
        clientId: RocketChat.settings.get('Broadcasting_client_id'),
        clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
      }));
    });
  },

  livestreamGet({
    rid
  }) {
    return Promise.asyncApply(() => {
      const livestreamSettings = selectLivestreamSettings(Meteor.user());

      if (!livestreamSettings) {
        throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
          method: 'livestreamGet'
        });
      }

      const room = RocketChat.models.Rooms.findOne({
        _id: rid
      });

      if (!room) {
        // TODO: change error
        throw new Meteor.Error('error-not-allowed', 'You have no settings to livestream', {
          method: 'livestreamGet'
        });
      }

      const {
        access_token,
        refresh_token
      } = livestreamSettings;
      return Promise.await(createLiveStream({
        room,
        access_token,
        refresh_token,
        clientId: RocketChat.settings.get('Broadcasting_client_id'),
        clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
      }));
    });
  },

  getBroadcastStatus({
    broadcastId
  }) {
    return Promise.asyncApply(() => {
      if (!broadcastId) {
        // TODO: change error
        throw new Meteor.Error('error-not-allowed', 'Broadcast ID not found', {
          method: 'getBroadcastStatus'
        });
      }

      const livestreamSettings = selectLivestreamSettings(Meteor.user());

      if (!livestreamSettings) {
        throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
          method: 'getBroadcastStatus'
        });
      }

      const {
        access_token,
        refresh_token
      } = livestreamSettings;
      return Promise.await(getBroadcastStatus({
        id: broadcastId,
        access_token,
        refresh_token,
        clientId: RocketChat.settings.get('Broadcasting_client_id'),
        clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
      }));
    });
  },

  setBroadcastStatus({
    broadcastId,
    status
  }) {
    return Promise.asyncApply(() => {
      if (!broadcastId) {
        // TODO: change error
        throw new Meteor.Error('error-not-allowed', 'Broadcast ID not found', {
          method: 'setBroadcastStatus'
        });
      }

      const livestreamSettings = selectLivestreamSettings(Meteor.user());

      if (!livestreamSettings) {
        throw new Meteor.Error('error-not-allowed', 'You have no settings to stream', {
          method: 'setBroadcastStatus'
        });
      }

      const {
        access_token,
        refresh_token
      } = livestreamSettings;
      return Promise.await(setBroadcastStatus({
        id: broadcastId,
        access_token,
        refresh_token,
        status,
        clientId: RocketChat.settings.get('Broadcasting_client_id'),
        clientSecret: RocketChat.settings.get('Broadcasting_client_secret')
      }));
    });
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routes.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_livestream/server/routes.js                                                                //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let google;
module.watch(require("googleapis"), {
  default(v) {
    google = v;
  }

}, 0);
const OAuth2 = google.auth.OAuth2;
RocketChat.API.v1.addRoute('livestream/oauth', {
  get: function functionName() {
    const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), `${RocketChat.settings.get('Site_Url')}/api/v1/livestream/oauth/callback`.replace(/\/{2}api/g, '/api'));
    const {
      userId
    } = this.queryParams;
    const url = clientAuth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube'],
      state: JSON.stringify({
        userId
      })
    });
    return {
      statusCode: 302,
      headers: {
        Location: url
      },
      body: 'Oauth redirect'
    };
  }
});
RocketChat.API.v1.addRoute('livestream/oauth/callback', {
  get: function functionName() {
    const {
      code,
      state
    } = this.queryParams;
    const {
      userId
    } = JSON.parse(state);
    const clientAuth = new OAuth2(RocketChat.settings.get('Broadcasting_client_id'), RocketChat.settings.get('Broadcasting_client_secret'), `${RocketChat.settings.get('Site_Url')}/api/v1/livestream/oauth/callback`.replace(/\/{2}api/g, '/api'));
    const ret = Meteor.wrapAsync(clientAuth.getToken.bind(clientAuth))(code);
    RocketChat.models.Users.update({
      _id: userId
    }, {
      $set: {
        'settings.livestream': ret
      }
    });
    return {
      headers: {
        'content-type': 'text/html'
      },
      body: '<script>window.close()</script>'
    };
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"googleapis":{"package.json":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/rocketchat_livestream/node_modules/googleapis/package.json                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
exports.name = "googleapis";
exports.version = "25.0.0";
exports.main = "./build/src/lib/googleapis.js";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"build":{"src":{"lib":{"googleapis.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// node_modules/meteor/rocketchat_livestream/node_modules/googleapis/build/src/lib/googleapis.js                  //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
"use strict";
// Copyright 2012-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var apis = require("../apis");
var discovery_1 = require("./discovery");
var discovery = new discovery_1.Discovery({ debug: false, includePrivate: false });
/**
 * @class GoogleAuth
 */
var google_auth_library_1 = require("google-auth-library");
/**
 * GoogleApis constructor.
 *
 * @example
 * const GoogleApis = require('googleapis').GoogleApis;
 * const google = new GoogleApis();
 *
 * @class GoogleApis
 * @param {Object} [options] Configuration options.
 */
function GoogleApis(options) {
    this.options(options);
    this.addAPIs(apis);
    /**
     * A reference to an instance of GoogleAuth.
     *
     * @name GoogleApis#auth
     * @type {GoogleAuth}
     */
    this.auth = new google_auth_library_1.GoogleAuth();
    this.auth.JWT = google_auth_library_1.JWT;
    this.auth.Compute = google_auth_library_1.Compute;
    this.auth.OAuth2 = google_auth_library_1.OAuth2Client;
    /**
     * A reference to the {@link GoogleApis} constructor function.
     *
     * @name GoogleApis#GoogleApis
     * @see GoogleApis
     * @type {Function}
     */
    this.GoogleApis = GoogleApis;
}
/**
 * Set options.
 *
 * @param  {Object} [options] Configuration options.
 */
GoogleApis.prototype.options = function (options) {
    this._options = options || {};
};
/**
 * Add APIs endpoints to googleapis object
 * E.g. googleapis.drive and googleapis.datastore
 *
 * @name GoogleApis#addAPIs
 * @method
 * @param {Object} apis Apis to be added to this GoogleApis instance.
 * @private
 */
GoogleApis.prototype.addAPIs = function (apisToAdd) {
    for (var apiName in apisToAdd) {
        if (apisToAdd.hasOwnProperty(apiName)) {
            this[apiName] = apisToAdd[apiName].bind(this);
        }
    }
};
/**
 * Dynamically generate an apis object that can provide Endpoint objects for the
 * discovered APIs.
 *
 * @example
 * const google = require('googleapis');
 * const discoveryUrl = 'https://myapp.appspot.com/_ah/api/discovery/v1/apis/';
 * google.discover(discoveryUrl, function (err) {
 *   const someapi = google.someapi('v1');
 * });
 *
 * @name GoogleApis#discover
 * @method
 * @param {string} url Url to the discovery service for a set of APIs. e.g.,
 * https://www.googleapis.com/discovery/v1/apis
 * @param {Function} callback Callback function.
 */
GoogleApis.prototype.discover = function (url, callback) {
    var self = this;
    discovery.discoverAllAPIs(url, function (err, allApis) {
        if (err) {
            return callback(err);
        }
        self.addAPIs(allApis);
        callback();
    });
};
/**
 * Dynamically generate an Endpoint object from a discovery doc.
 *
 * @example
 * const google = require('google');
 * const discoveryDocUrl =
 * 'https://myapp.appspot.com/_ah/api/discovery/v1/apis/someapi/v1/rest';
 * google.discoverApi(discoveryDocUrl, function (err, someapi) {
 *   // use someapi
 * });
 *
 * @name GoogleApis#discoverAPI
 * @method
 * @param {string} path Url or file path to discover doc for a single API.
 * @param {object} [options] Options to configure the Endpoint object generated
 * from the discovery doc.
 * @param {Function} callback Callback function.
 */
GoogleApis.prototype.discoverAPI = function (apiPath, options, callback) {
    var self = this;
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    // Creating an object, so Pascal case is appropriate.
    // tslint:disable-next-line
    discovery.discoverAPI(apiPath, function (err, Endpoint) {
        if (err) {
            return callback(err);
        }
        var ep = new Endpoint(options);
        ep.google = self; // for drive.google.transporter
        return callback(null, Object.freeze(ep)); // create new & freeze
    });
};
module.exports = new GoogleApis();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:livestream/server/index.js");
require("/node_modules/meteor/rocketchat:livestream/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:livestream/server/functions/saveStreamingOptions.js");
require("/node_modules/meteor/rocketchat:livestream/server/settings.js");

/* Exports */
Package._define("rocketchat:livestream");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_livestream.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlc3RyZWFtL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlc3RyZWFtL3NlcnZlci9tb2RlbHMvUm9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZXN0cmVhbS9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVTdHJlYW1pbmdPcHRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVzdHJlYW0vc2VydmVyL2Z1bmN0aW9ucy9saXZlc3RyZWFtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVzdHJlYW0vc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVzdHJlYW0vc2VydmVyL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZXN0cmVhbS9zZXJ2ZXIvcm91dGVzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJSb29tcyIsInNldFN0cmVhbWluZ09wdGlvbnNCeUlkIiwiX2lkIiwic3RyZWFtaW5nT3B0aW9ucyIsInVwZGF0ZSIsIiRzZXQiLCJzYXZlU3RyZWFtaW5nT3B0aW9ucyIsInJpZCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsIk1ldGVvciIsIkVycm9yIiwiZXhwb3J0IiwiZ2V0QnJvYWRjYXN0U3RhdHVzIiwic3RhdHVzU3RyZWFtTGl2ZVN0cmVhbSIsInN0YXR1c0xpdmVTdHJlYW0iLCJzZXRCcm9hZGNhc3RTdGF0dXMiLCJjcmVhdGVMaXZlU3RyZWFtIiwiZ29vZ2xlIiwiZGVmYXVsdCIsInYiLCJPQXV0aDIiLCJhdXRoIiwicCIsImZuIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJlcnIiLCJ2YWx1ZSIsImRhdGEiLCJpZCIsImFjY2Vzc190b2tlbiIsInJlZnJlc2hfdG9rZW4iLCJjbGllbnRJZCIsImNsaWVudFNlY3JldCIsInNldENyZWRlbnRpYWxzIiwieW91dHViZSIsInZlcnNpb24iLCJyZXN1bHQiLCJsaXZlQnJvYWRjYXN0cyIsImxpc3QiLCJwYXJ0IiwiaXRlbXMiLCJzdGF0dXMiLCJsaWZlQ3ljbGVTdGF0dXMiLCJsaXZlU3RyZWFtcyIsInN0cmVhbVN0YXR1cyIsInRyYW5zaXRpb24iLCJicm9hZGNhc3RTdGF0dXMiLCJyb29tIiwic3RyZWFtIiwiYnJvYWRjYXN0IiwiYWxsIiwiaW5zZXJ0IiwicmVzb3VyY2UiLCJzbmlwcGV0IiwibmFtZSIsIkRhdGUiLCJ0b0lTT1N0cmluZyIsImJpbmQiLCJzdHJlYW1JZCIsImNkbiIsImluZ2VzdGlvbkluZm8iLCJzdHJlYW1OYW1lIiwic3RhcnR1cCIsInNldHRpbmdzIiwiYWRkR3JvdXAiLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiYWxlcnQiLCJlbmFibGVRdWVyeSIsInNlbGVjdExpdmVzdHJlYW1TZXR0aW5ncyIsInVzZXIiLCJsaXZlc3RyZWFtIiwibWV0aG9kcyIsImxpdmVzdHJlYW1TdHJlYW1TdGF0dXMiLCJtZXRob2QiLCJsaXZlc3RyZWFtU2V0dGluZ3MiLCJnZXQiLCJzZXRMaXZlc3RyZWFtU3RhdHVzIiwiYnJvYWRjYXN0SWQiLCJsaXZlc3RyZWFtR2V0IiwiZmluZE9uZSIsIkFQSSIsInYxIiwiYWRkUm91dGUiLCJmdW5jdGlvbk5hbWUiLCJjbGllbnRBdXRoIiwicmVwbGFjZSIsInVzZXJJZCIsInF1ZXJ5UGFyYW1zIiwidXJsIiwiZ2VuZXJhdGVBdXRoVXJsIiwiYWNjZXNzX3R5cGUiLCJzY29wZSIsInN0YXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c0NvZGUiLCJoZWFkZXJzIiwiTG9jYXRpb24iLCJib2R5IiwiY29kZSIsInBhcnNl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YWdlcy9yb2NrZXRjaGF0X2xpdmVzdHJlYW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJy4vcm91dGVzLmpzJztcbmltcG9ydCAnLi9tZXRob2RzLmpzJztcbiIsIlJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFN0cmVhbWluZ09wdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBzdHJlYW1pbmdPcHRpb25zKSB7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRzdHJlYW1pbmdPcHRpb25zXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgdXBkYXRlKTtcbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVTdHJlYW1pbmdPcHRpb25zID0gZnVuY3Rpb24ocmlkLCBzdHJlYW1pbmdPcHRpb25zKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVN0cmVhbWluZ09wdGlvbnMnXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0U3RyZWFtaW5nT3B0aW9uc0J5SWQocmlkLCBzdHJlYW1pbmdPcHRpb25zKTtcbn07XG4iLCJpbXBvcnQgZ29vZ2xlIGZyb20gJ2dvb2dsZWFwaXMnO1xuY29uc3QgT0F1dGgyID0gZ29vZ2xlLmF1dGguT0F1dGgyO1xuXG5cbmNvbnN0IHAgPSBmbiA9PiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0Zm4oZnVuY3Rpb24oZXJyLCB2YWx1ZSkge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdHJldHVybiByZWplY3QoZXJyKTtcblx0XHR9XG5cdFx0cmVzb2x2ZSh2YWx1ZS5kYXRhKTtcblx0fSk7XG59KTtcblxuZXhwb3J0IGNvbnN0IGdldEJyb2FkY2FzdFN0YXR1cyA9IGFzeW5jKHtcblx0aWQsXG5cdGFjY2Vzc190b2tlbixcblx0cmVmcmVzaF90b2tlbixcblx0Y2xpZW50SWQsXG5cdGNsaWVudFNlY3JldFxufSkgPT4ge1xuXHRjb25zdCBhdXRoID0gbmV3IE9BdXRoMihjbGllbnRJZCwgY2xpZW50U2VjcmV0KTtcblxuXHRhdXRoLnNldENyZWRlbnRpYWxzKHtcblx0XHRhY2Nlc3NfdG9rZW4sXG5cdFx0cmVmcmVzaF90b2tlblxuXHR9KTtcblx0Y29uc3QgeW91dHViZSA9IGdvb2dsZS55b3V0dWJlKHsgdmVyc2lvbjondjMnLCBhdXRoIH0pO1xuXHRjb25zdCByZXN1bHQgPSBhd2FpdCBwKHJlc29sdmUgPT4geW91dHViZS5saXZlQnJvYWRjYXN0cy5saXN0KHtcblx0XHRwYXJ0OidpZCxzdGF0dXMnLFxuXHRcdGlkXG5cdH0sIHJlc29sdmUpKTtcblx0cmV0dXJuIHJlc3VsdC5pdGVtcyAmJiByZXN1bHQuaXRlbXNbMF0gJiYgcmVzdWx0Lml0ZW1zWzBdLnN0YXR1cy5saWZlQ3ljbGVTdGF0dXM7XG59O1xuXG5leHBvcnQgY29uc3Qgc3RhdHVzU3RyZWFtTGl2ZVN0cmVhbSA9IGFzeW5jKHtcblx0aWQsXG5cdGFjY2Vzc190b2tlbixcblx0cmVmcmVzaF90b2tlbixcblx0Y2xpZW50SWQsXG5cdGNsaWVudFNlY3JldFxufSkgPT4ge1xuXHRjb25zdCBhdXRoID0gbmV3IE9BdXRoMihjbGllbnRJZCwgY2xpZW50U2VjcmV0KTtcblxuXHRhdXRoLnNldENyZWRlbnRpYWxzKHtcblx0XHRhY2Nlc3NfdG9rZW4sXG5cdFx0cmVmcmVzaF90b2tlblxuXHR9KTtcblxuXHRjb25zdCB5b3V0dWJlID0gZ29vZ2xlLnlvdXR1YmUoeyB2ZXJzaW9uOid2MycsIGF1dGggfSk7XG5cdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHAocmVzb2x2ZSA9PiB5b3V0dWJlLmxpdmVTdHJlYW1zLmxpc3Qoe1xuXHRcdHBhcnQ6J2lkLHN0YXR1cycsXG5cdFx0aWRcblx0fSwgcmVzb2x2ZSkpO1xuXHRyZXR1cm4gcmVzdWx0Lml0ZW1zICYmIHJlc3VsdC5pdGVtc1swXS5zdGF0dXMuc3RyZWFtU3RhdHVzO1xufTtcblxuZXhwb3J0IGNvbnN0IHN0YXR1c0xpdmVTdHJlYW0gPSAoe1xuXHRpZCxcblx0YWNjZXNzX3Rva2VuLFxuXHRyZWZyZXNoX3Rva2VuLFxuXHRjbGllbnRJZCxcblx0Y2xpZW50U2VjcmV0LFxuXHRzdGF0dXNcbn0pID0+IHtcblx0Y29uc3QgYXV0aCA9IG5ldyBPQXV0aDIoY2xpZW50SWQsIGNsaWVudFNlY3JldCk7XG5cblx0YXV0aC5zZXRDcmVkZW50aWFscyh7XG5cdFx0YWNjZXNzX3Rva2VuLFxuXHRcdHJlZnJlc2hfdG9rZW5cblx0fSk7XG5cblx0Y29uc3QgeW91dHViZSA9IGdvb2dsZS55b3V0dWJlKHsgdmVyc2lvbjondjMnLCBhdXRoIH0pO1xuXG5cdHJldHVybiBwKHJlc29sdmUgPT4geW91dHViZS5saXZlQnJvYWRjYXN0cy50cmFuc2l0aW9uKHtcblx0XHRwYXJ0OidpZCxzdGF0dXMnLFxuXHRcdGlkLFxuXHRcdGJyb2FkY2FzdFN0YXR1czogc3RhdHVzXG5cdH0sIHJlc29sdmUpKTtcbn07XG5cbmV4cG9ydCBjb25zdCBzZXRCcm9hZGNhc3RTdGF0dXMgPSAoe1xuXHRpZCxcblx0YWNjZXNzX3Rva2VuLFxuXHRyZWZyZXNoX3Rva2VuLFxuXHRjbGllbnRJZCxcblx0Y2xpZW50U2VjcmV0LFxuXHRzdGF0dXNcbn0pID0+IHtcblx0Y29uc3QgYXV0aCA9IG5ldyBPQXV0aDIoY2xpZW50SWQsIGNsaWVudFNlY3JldCk7XG5cblx0YXV0aC5zZXRDcmVkZW50aWFscyh7XG5cdFx0YWNjZXNzX3Rva2VuLFxuXHRcdHJlZnJlc2hfdG9rZW5cblx0fSk7XG5cblx0Y29uc3QgeW91dHViZSA9IGdvb2dsZS55b3V0dWJlKHsgdmVyc2lvbjondjMnLCBhdXRoIH0pO1xuXG5cdHJldHVybiBwKHJlc29sdmUgPT4geW91dHViZS5saXZlQnJvYWRjYXN0cy50cmFuc2l0aW9uKHtcblx0XHRwYXJ0OidpZCxzdGF0dXMnLFxuXHRcdGlkLFxuXHRcdGJyb2FkY2FzdFN0YXR1czogc3RhdHVzXG5cdH0sIHJlc29sdmUpKTtcbn07XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVMaXZlU3RyZWFtID0gYXN5bmMoe1xuXHRyb29tLFxuXHRhY2Nlc3NfdG9rZW4sXG5cdHJlZnJlc2hfdG9rZW4sXG5cdGNsaWVudElkLFxuXHRjbGllbnRTZWNyZXRcbn0pID0+IHtcblx0Y29uc3QgYXV0aCA9IG5ldyBPQXV0aDIoY2xpZW50SWQsIGNsaWVudFNlY3JldCk7XG5cdGF1dGguc2V0Q3JlZGVudGlhbHMoe1xuXHRcdGFjY2Vzc190b2tlbixcblx0XHRyZWZyZXNoX3Rva2VuXG5cdH0pO1xuXHRjb25zdCB5b3V0dWJlID0gZ29vZ2xlLnlvdXR1YmUoeyB2ZXJzaW9uOid2MycsIGF1dGggfSk7XG5cblx0Y29uc3QgW3N0cmVhbSwgYnJvYWRjYXN0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtwKChyZXNvbHZlKSA9PiB5b3V0dWJlLmxpdmVTdHJlYW1zLmluc2VydCh7XG5cdFx0cGFydDogJ2lkLHNuaXBwZXQsY2RuLGNvbnRlbnREZXRhaWxzLHN0YXR1cycsXG5cdFx0cmVzb3VyY2U6IHtcblx0XHRcdHNuaXBwZXQ6IHtcblx0XHRcdFx0J3RpdGxlJzogcm9vbS5uYW1lIHx8ICdSb2NrZXRDaGF0IEJyb2FkY2FzdCdcblx0XHRcdH0sXG5cdFx0XHQnY2RuJzoge1xuXHRcdFx0XHQnZm9ybWF0JzogJzQ4MHAnLFxuXHRcdFx0XHQnaW5nZXN0aW9uVHlwZSc6ICdydG1wJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSwgcmVzb2x2ZSkpLCBwKChyZXNvbHZlKT0+IHlvdXR1YmUubGl2ZUJyb2FkY2FzdHMuaW5zZXJ0KHtcblx0XHRwYXJ0OiAnaWQsc25pcHBldCxjb250ZW50RGV0YWlscyxzdGF0dXMnLFxuXHRcdHJlc291cmNlOiB7XG5cdFx0XHRzbmlwcGV0OiB7XG5cdFx0XHRcdCd0aXRsZSc6IHJvb20ubmFtZSB8fCAnUm9ja2V0Q2hhdCBCcm9hZGNhc3QnLFxuXHRcdFx0XHQnc2NoZWR1bGVkU3RhcnRUaW1lJyA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuXHRcdFx0fSxcblx0XHRcdCdzdGF0dXMnOiB7XG5cdFx0XHRcdCdwcml2YWN5U3RhdHVzJzogJ3VubGlzdGVkJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSwgcmVzb2x2ZSkpXSk7XG5cblx0YXdhaXQgcChyZXNvbHZlID0+IHlvdXR1YmUubGl2ZUJyb2FkY2FzdHMuYmluZCh7XG5cdFx0cGFydDogJ2lkLHNuaXBwZXQsc3RhdHVzJyxcblx0XHQvLyByZXNvdXJjZToge1xuXHRcdGlkOiBicm9hZGNhc3QuaWQsXG5cdFx0c3RyZWFtSWQ6IHN0cmVhbS5pZFxuXHR9LCByZXNvbHZlKSk7XG5cblx0cmV0dXJuIHtpZDogc3RyZWFtLmNkbi5pbmdlc3Rpb25JbmZvLnN0cmVhbU5hbWUsIHN0cmVhbSwgYnJvYWRjYXN0fTtcbn07XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnTGl2ZVN0cmVhbSAmIEJyb2FkY2FzdGluZycsIGZ1bmN0aW9uKCkge1xuXG5cdFx0dGhpcy5hZGQoJ0xpdmVzdHJlYW1fZW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRwdWJsaWM6IHRydWUsXG5cdFx0XHRhbGVydDogJ1RoaXMgZmVhdHVyZSBpcyBjdXJyZW50bHkgaW4gYmV0YSEgUGxlYXNlIHJlcG9ydCBidWdzIHRvIGdpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9pc3N1ZXMnXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnQnJvYWRjYXN0aW5nX2VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0cHVibGljOiB0cnVlLFxuXHRcdFx0YWxlcnQ6ICdUaGlzIGZlYXR1cmUgaXMgY3VycmVudGx5IGluIGJldGEhIFBsZWFzZSByZXBvcnQgYnVncyB0byBnaXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVzdHJlYW1fZW5hYmxlZCcsIHZhbHVlOiB0cnVlIH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdCcm9hZGNhc3RpbmdfY2xpZW50X2lkJywgJycsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogZmFsc2UsIGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0Jyb2FkY2FzdGluZ19lbmFibGVkJywgdmFsdWU6IHRydWUgfSB9KTtcblx0XHR0aGlzLmFkZCgnQnJvYWRjYXN0aW5nX2NsaWVudF9zZWNyZXQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQnJvYWRjYXN0aW5nX2VuYWJsZWQnLCB2YWx1ZTogdHJ1ZSB9IH0pO1xuXHRcdHRoaXMuYWRkKCdCcm9hZGNhc3RpbmdfYXBpX2tleScsICcnLCB7IHR5cGU6ICdzdHJpbmcnLCBwdWJsaWM6IGZhbHNlLCBlbmFibGVRdWVyeTogeyBfaWQ6ICdCcm9hZGNhc3RpbmdfZW5hYmxlZCcsIHZhbHVlOiB0cnVlIH0gfSk7XG5cdFx0dGhpcy5hZGQoJ0Jyb2FkY2FzdGluZ19tZWRpYV9zZXJ2ZXJfdXJsJywgJycsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogdHJ1ZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQnJvYWRjYXN0aW5nX2VuYWJsZWQnLCB2YWx1ZTogdHJ1ZSB9IH0pO1xuXHR9KTtcbn0pO1xuIiwiaW1wb3J0IHtNZXRlb3J9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgY3JlYXRlTGl2ZVN0cmVhbSwgc3RhdHVzTGl2ZVN0cmVhbSwgc3RhdHVzU3RyZWFtTGl2ZVN0cmVhbSwgZ2V0QnJvYWRjYXN0U3RhdHVzLCBzZXRCcm9hZGNhc3RTdGF0dXMgfSBmcm9tICcuL2Z1bmN0aW9ucy9saXZlc3RyZWFtJztcblxuY29uc3Qgc2VsZWN0TGl2ZXN0cmVhbVNldHRpbmdzID0gKHVzZXIpID0+IHVzZXIgJiYgdXNlci5zZXR0aW5ncyAmJiB1c2VyLnNldHRpbmdzLmxpdmVzdHJlYW07XG5cbk1ldGVvci5tZXRob2RzKHtcblxuXHRhc3luYyBsaXZlc3RyZWFtU3RyZWFtU3RhdHVzKHtzdHJlYW1JZH0pIHtcblx0XHRpZiAoIXN0cmVhbUlkKSB7XG5cdFx0XHQvLyBUT0RPOiBjaGFuZ2UgZXJyb3Jcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ0xpdmVzdHJlYW0gSUQgbm90IGZvdW5kJywge1xuXHRcdFx0XHRtZXRob2Q6ICdsaXZlc3RyZWFtU3RyZWFtU3RhdHVzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGNvbnN0IGxpdmVzdHJlYW1TZXR0aW5ncyA9IHNlbGVjdExpdmVzdHJlYW1TZXR0aW5ncyhNZXRlb3IudXNlcigpKTtcblxuXHRcdGlmICghbGl2ZXN0cmVhbVNldHRpbmdzKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdZb3UgaGF2ZSBubyBzZXR0aW5ncyB0byBzdHJlYW0nLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2xpdmVzdHJlYW1TdHJlYW1TdGF0dXMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB7YWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VufSA9IGxpdmVzdHJlYW1TZXR0aW5ncztcblxuXHRcdHJldHVybiBhd2FpdCBzdGF0dXNTdHJlYW1MaXZlU3RyZWFtKHtcblx0XHRcdGlkOiBzdHJlYW1JZCxcblx0XHRcdGFjY2Vzc190b2tlbixcblx0XHRcdHJlZnJlc2hfdG9rZW4sXG5cdFx0XHRjbGllbnRJZDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Jyb2FkY2FzdGluZ19jbGllbnRfaWQnKSxcblx0XHRcdGNsaWVudFNlY3JldDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Jyb2FkY2FzdGluZ19jbGllbnRfc2VjcmV0Jylcblx0XHR9KTtcblxuXHR9LFxuXHRhc3luYyBzZXRMaXZlc3RyZWFtU3RhdHVzKHticm9hZGNhc3RJZCwgc3RhdHVzfSkge1xuXHRcdGlmICghYnJvYWRjYXN0SWQpIHtcblx0XHRcdC8vIFRPRE86IGNoYW5nZSBlcnJvclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnWW91IGhhdmUgbm8gc2V0dGluZ3MgdG8gbGl2ZXN0cmVhbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnbGl2ZXN0cmVhbVN0YXJ0J1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGNvbnN0IGxpdmVzdHJlYW1TZXR0aW5ncyA9IHNlbGVjdExpdmVzdHJlYW1TZXR0aW5ncyhNZXRlb3IudXNlcigpKTtcblxuXHRcdGlmICghbGl2ZXN0cmVhbVNldHRpbmdzKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdZb3UgaGF2ZSBubyBzZXR0aW5ncyB0byBsaXZlc3RyZWFtJywge1xuXHRcdFx0XHRtZXRob2Q6ICdsaXZlc3RyZWFtU3RhcnQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB7YWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VufSA9IGxpdmVzdHJlYW1TZXR0aW5ncztcblxuXHRcdHJldHVybiBhd2FpdCBzdGF0dXNMaXZlU3RyZWFtKHtcblx0XHRcdGlkOiBicm9hZGNhc3RJZCxcblx0XHRcdGFjY2Vzc190b2tlbixcblx0XHRcdHJlZnJlc2hfdG9rZW4sXG5cdFx0XHRzdGF0dXMsXG5cdFx0XHRjbGllbnRJZDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Jyb2FkY2FzdGluZ19jbGllbnRfaWQnKSxcblx0XHRcdGNsaWVudFNlY3JldDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Jyb2FkY2FzdGluZ19jbGllbnRfc2VjcmV0Jylcblx0XHR9KTtcblxuXHR9LFxuXHRhc3luYyBsaXZlc3RyZWFtR2V0KHtyaWR9KSB7XG5cdFx0Y29uc3QgbGl2ZXN0cmVhbVNldHRpbmdzID0gc2VsZWN0TGl2ZXN0cmVhbVNldHRpbmdzKE1ldGVvci51c2VyKCkpO1xuXG5cdFx0aWYgKCFsaXZlc3RyZWFtU2V0dGluZ3MpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ1lvdSBoYXZlIG5vIHNldHRpbmdzIHRvIGxpdmVzdHJlYW0nLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2xpdmVzdHJlYW1HZXQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7X2lkOiByaWR9KTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0Ly8gVE9ETzogY2hhbmdlIGVycm9yXG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdZb3UgaGF2ZSBubyBzZXR0aW5ncyB0byBsaXZlc3RyZWFtJywge1xuXHRcdFx0XHRtZXRob2Q6ICdsaXZlc3RyZWFtR2V0J1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qge2FjY2Vzc190b2tlbiwgcmVmcmVzaF90b2tlbn0gPSBsaXZlc3RyZWFtU2V0dGluZ3M7XG5cdFx0cmV0dXJuIGF3YWl0IGNyZWF0ZUxpdmVTdHJlYW0oe1xuXHRcdFx0cm9vbSxcblx0XHRcdGFjY2Vzc190b2tlbixcblx0XHRcdHJlZnJlc2hfdG9rZW4sXG5cdFx0XHRjbGllbnRJZDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Jyb2FkY2FzdGluZ19jbGllbnRfaWQnKSxcblx0XHRcdGNsaWVudFNlY3JldDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Jyb2FkY2FzdGluZ19jbGllbnRfc2VjcmV0Jylcblx0XHR9KTtcblxuXHR9LFxuXHRhc3luYyBnZXRCcm9hZGNhc3RTdGF0dXMoe2Jyb2FkY2FzdElkfSkge1xuXHRcdGlmICghYnJvYWRjYXN0SWQpIHtcblx0XHRcdC8vIFRPRE86IGNoYW5nZSBlcnJvclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnQnJvYWRjYXN0IElEIG5vdCBmb3VuZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnZ2V0QnJvYWRjYXN0U3RhdHVzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGNvbnN0IGxpdmVzdHJlYW1TZXR0aW5ncyA9IHNlbGVjdExpdmVzdHJlYW1TZXR0aW5ncyhNZXRlb3IudXNlcigpKTtcblxuXHRcdGlmICghbGl2ZXN0cmVhbVNldHRpbmdzKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdZb3UgaGF2ZSBubyBzZXR0aW5ncyB0byBzdHJlYW0nLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2dldEJyb2FkY2FzdFN0YXR1cydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHthY2Nlc3NfdG9rZW4sIHJlZnJlc2hfdG9rZW59ID0gbGl2ZXN0cmVhbVNldHRpbmdzO1xuXG5cdFx0cmV0dXJuIGF3YWl0IGdldEJyb2FkY2FzdFN0YXR1cyh7XG5cdFx0XHRpZDogYnJvYWRjYXN0SWQsXG5cdFx0XHRhY2Nlc3NfdG9rZW4sXG5cdFx0XHRyZWZyZXNoX3Rva2VuLFxuXHRcdFx0Y2xpZW50SWQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdCcm9hZGNhc3RpbmdfY2xpZW50X2lkJyksXG5cdFx0XHRjbGllbnRTZWNyZXQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdCcm9hZGNhc3RpbmdfY2xpZW50X3NlY3JldCcpXG5cdFx0fSk7XG5cdH0sXG5cdGFzeW5jIHNldEJyb2FkY2FzdFN0YXR1cyh7YnJvYWRjYXN0SWQsIHN0YXR1c30pIHtcblx0XHRpZiAoIWJyb2FkY2FzdElkKSB7XG5cdFx0XHQvLyBUT0RPOiBjaGFuZ2UgZXJyb3Jcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ0Jyb2FkY2FzdCBJRCBub3QgZm91bmQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NldEJyb2FkY2FzdFN0YXR1cydcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjb25zdCBsaXZlc3RyZWFtU2V0dGluZ3MgPSBzZWxlY3RMaXZlc3RyZWFtU2V0dGluZ3MoTWV0ZW9yLnVzZXIoKSk7XG5cblx0XHRpZiAoIWxpdmVzdHJlYW1TZXR0aW5ncykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnWW91IGhhdmUgbm8gc2V0dGluZ3MgdG8gc3RyZWFtJywge1xuXHRcdFx0XHRtZXRob2Q6ICdzZXRCcm9hZGNhc3RTdGF0dXMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB7YWNjZXNzX3Rva2VuLCByZWZyZXNoX3Rva2VufSA9IGxpdmVzdHJlYW1TZXR0aW5ncztcblxuXHRcdHJldHVybiBhd2FpdCBzZXRCcm9hZGNhc3RTdGF0dXMoe1xuXHRcdFx0aWQ6IGJyb2FkY2FzdElkLFxuXHRcdFx0YWNjZXNzX3Rva2VuLFxuXHRcdFx0cmVmcmVzaF90b2tlbixcblx0XHRcdHN0YXR1cyxcblx0XHRcdGNsaWVudElkOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQnJvYWRjYXN0aW5nX2NsaWVudF9pZCcpLFxuXHRcdFx0Y2xpZW50U2VjcmV0OiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQnJvYWRjYXN0aW5nX2NsaWVudF9zZWNyZXQnKVxuXHRcdH0pO1xuXG5cdH1cbn0pO1xuIiwiaW1wb3J0IGdvb2dsZSBmcm9tICdnb29nbGVhcGlzJztcbmNvbnN0IE9BdXRoMiA9IGdvb2dsZS5hdXRoLk9BdXRoMjtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVzdHJlYW0vb2F1dGgnLCB7XG5cdGdldDogZnVuY3Rpb24gZnVuY3Rpb25OYW1lKCkge1xuXHRcdGNvbnN0IGNsaWVudEF1dGggPSBuZXcgT0F1dGgyKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdCcm9hZGNhc3RpbmdfY2xpZW50X2lkJyksIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdCcm9hZGNhc3RpbmdfY2xpZW50X3NlY3JldCcpLCBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NpdGVfVXJsJykgfS9hcGkvdjEvbGl2ZXN0cmVhbS9vYXV0aC9jYWxsYmFja2AucmVwbGFjZSgvXFwvezJ9YXBpL2csICcvYXBpJykpO1xuXHRcdGNvbnN0IHsgdXNlcklkIH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGNvbnN0IHVybCA9IGNsaWVudEF1dGguZ2VuZXJhdGVBdXRoVXJsKHtcblx0XHRcdGFjY2Vzc190eXBlOiAnb2ZmbGluZScsXG5cdFx0XHRzY29wZTogWydodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3lvdXR1YmUnXSxcblx0XHRcdHN0YXRlOiBKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdHVzZXJJZFxuXHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiAzMDIsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdExvY2F0aW9uOiB1cmxcblx0XHRcdH0sIGJvZHk6ICdPYXV0aCByZWRpcmVjdCdcblx0XHR9O1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVzdHJlYW0vb2F1dGgvY2FsbGJhY2snLCB7XG5cdGdldDogZnVuY3Rpb24gZnVuY3Rpb25OYW1lKCkge1xuXHRcdGNvbnN0IHsgY29kZSwgc3RhdGUgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRjb25zdCB7IHVzZXJJZCB9ID0gSlNPTi5wYXJzZShzdGF0ZSk7XG5cblx0XHRjb25zdCBjbGllbnRBdXRoID0gbmV3IE9BdXRoMihSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQnJvYWRjYXN0aW5nX2NsaWVudF9pZCcpLCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQnJvYWRjYXN0aW5nX2NsaWVudF9zZWNyZXQnKSwgYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTaXRlX1VybCcpIH0vYXBpL3YxL2xpdmVzdHJlYW0vb2F1dGgvY2FsbGJhY2tgLnJlcGxhY2UoL1xcL3syfWFwaS9nLCAnL2FwaScpKTtcblxuXHRcdGNvbnN0IHJldCA9IE1ldGVvci53cmFwQXN5bmMoY2xpZW50QXV0aC5nZXRUb2tlbi5iaW5kKGNsaWVudEF1dGgpKShjb2RlKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnVwZGF0ZSh7IF9pZDogdXNlcklkIH0sIHskc2V0OiB7XG5cdFx0XHQnc2V0dGluZ3MubGl2ZXN0cmVhbScgOiByZXRcblx0XHR9fSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnY29udGVudC10eXBlJyA6ICd0ZXh0L2h0bWwnXG5cdFx0XHR9LCBib2R5OiAnPHNjcmlwdD53aW5kb3cuY2xvc2UoKTwvc2NyaXB0Pidcblx0XHR9O1xuXHR9XG59KTtcbiJdfQ==
