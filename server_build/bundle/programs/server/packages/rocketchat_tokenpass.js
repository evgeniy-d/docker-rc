(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var SyncedCron = Package['percolate:synced-cron'].SyncedCron;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:tokenpass":{"common.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/common.js                                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* global CustomOAuth */
const config = {
  serverURL: '',
  identityPath: '/oauth/user',
  authorizePath: '/oauth/authorize',
  tokenPath: '/oauth/access-token',
  scope: 'user,tca,private-balances',
  tokenSentVia: 'payload',
  usernameField: 'username',
  mergeUsers: true,
  addAutopublishFields: {
    forLoggedInUser: ['services.tokenpass'],
    forOtherUsers: ['services.tokenpass.name']
  }
};
const Tokenpass = new CustomOAuth('tokenpass', config);

if (Meteor.isServer) {
  Meteor.startup(function () {
    RocketChat.settings.get('API_Tokenpass_URL', function (key, value) {
      config.serverURL = value;
      Tokenpass.configure(config);
    });
  });
} else {
  Meteor.startup(function () {
    Tracker.autorun(function () {
      if (RocketChat.settings.get('API_Tokenpass_URL')) {
        config.serverURL = RocketChat.settings.get('API_Tokenpass_URL');
        Tokenpass.configure(config);
      }
    });
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/startup.js                                                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.settings.addGroup('OAuth', function () {
  this.section('Tokenpass', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Tokenpass',
      value: true
    };
    this.add('Accounts_OAuth_Tokenpass', false, {
      type: 'boolean'
    });
    this.add('API_Tokenpass_URL', '', {
      type: 'string',
      public: true,
      enableQuery,
      i18nDescription: 'API_Tokenpass_URL_Description'
    });
    this.add('Accounts_OAuth_Tokenpass_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Tokenpass_secret', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Tokenpass_callback_url', '_oauth/tokenpass', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});

function validateTokenAccess(userData, roomData) {
  if (!userData || !userData.services || !userData.services.tokenpass || !userData.services.tokenpass.tcaBalances) {
    return false;
  }

  return RocketChat.Tokenpass.validateAccess(roomData.tokenpass, userData.services.tokenpass.tcaBalances);
}

Meteor.startup(function () {
  RocketChat.authz.addRoomAccessValidator(function (room, user) {
    if (!room || !room.tokenpass || !user) {
      return false;
    }

    const userData = RocketChat.models.Users.getTokenBalancesByUserId(user._id);
    return validateTokenAccess(userData, room);
  });
  RocketChat.callbacks.add('beforeJoinRoom', function (user, room) {
    if (room.tokenpass && !validateTokenAccess(user, room)) {
      throw new Meteor.Error('error-not-allowed', 'Token required', {
        method: 'joinRoom'
      });
    }

    return room;
  });
});
Accounts.onLogin(function ({
  user
}) {
  if (user && user.services && user.services.tokenpass) {
    RocketChat.updateUserTokenpassBalances(user);
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"functions":{"getProtectedTokenpassBalances.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/getProtectedTokenpassBalances.js                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let userAgent = 'Meteor';

if (Meteor.release) {
  userAgent += `/${Meteor.release}`;
}

RocketChat.getProtectedTokenpassBalances = function (accessToken) {
  try {
    return HTTP.get(`${RocketChat.settings.get('API_Tokenpass_URL')}/api/v1/tca/protected/balances`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent
      },
      params: {
        oauth_token: accessToken
      }
    }).data;
  } catch (error) {
    throw new Error(`Failed to fetch protected tokenpass balances from Tokenpass. ${error.message}`);
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPublicTokenpassBalances.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/getPublicTokenpassBalances.js                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let userAgent = 'Meteor';

if (Meteor.release) {
  userAgent += `/${Meteor.release}`;
}

RocketChat.getPublicTokenpassBalances = function (accessToken) {
  try {
    return HTTP.get(`${RocketChat.settings.get('API_Tokenpass_URL')}/api/v1/tca/public/balances`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent
      },
      params: {
        oauth_token: accessToken
      }
    }).data;
  } catch (error) {
    throw new Error(`Failed to fetch public tokenpass balances from Tokenpass. ${error.message}`);
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTokens.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/saveRoomTokens.js                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.saveRoomTokenpass = function (rid, tokenpass) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTokens'
    });
  }

  return RocketChat.models.Rooms.setTokenpassById(rid, tokenpass);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTokensMinimumBalance.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/saveRoomTokensMinimumBalance.js                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomTokensMinimumBalance = function (rid, roomTokensMinimumBalance) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTokensMinimumBalance'
    });
  }

  const minimumTokenBalance = parseFloat(s.escapeHTML(roomTokensMinimumBalance));
  return RocketChat.models.Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateUserTokenpassBalances.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/updateUserTokenpassBalances.js                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.updateUserTokenpassBalances = function (user) {
  if (user && user.services && user.services.tokenpass) {
    const tcaPublicBalances = RocketChat.getPublicTokenpassBalances(user.services.tokenpass.accessToken);
    const tcaProtectedBalances = RocketChat.getProtectedTokenpassBalances(user.services.tokenpass.accessToken);

    const balances = _.uniq(_.union(tcaPublicBalances, tcaProtectedBalances), false, item => item.asset);

    RocketChat.models.Users.setTokenpassTcaBalances(user._id, balances);
    return balances;
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"indexes.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/indexes.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.startup(function () {
  RocketChat.models.Rooms.tryEnsureIndex({
    'tokenpass.tokens.token': 1
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/Rooms.js                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Rooms.findByTokenpass = function (tokens) {
  const query = {
    'tokenpass.tokens.token': {
      $in: tokens
    }
  };
  return this._db.find(query).fetch();
};

RocketChat.models.Rooms.setTokensById = function (_id, tokens) {
  const update = {
    $set: {
      'tokenpass.tokens.token': tokens
    }
  };
  return this.update({
    _id
  }, update);
};

RocketChat.models.Rooms.setTokenpassById = function (_id, tokenpass) {
  const update = {
    $set: {
      tokenpass
    }
  };
  return this.update({
    _id
  }, update);
};

RocketChat.models.Rooms.findAllTokenChannels = function () {
  const query = {
    tokenpass: {
      $exists: true
    }
  };
  const options = {
    fields: {
      tokenpass: 1
    }
  };
  return this._db.find(query, options);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/Subscriptions.js                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Subscriptions.findByRoomIds = function (roomIds) {
  const query = {
    rid: {
      $in: roomIds
    }
  };
  const options = {
    fields: {
      'u._id': 1,
      rid: 1
    }
  };
  return this._db.find(query, options);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Users.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/Users.js                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Users.setTokenpassTcaBalances = function (_id, tcaBalances) {
  const update = {
    $set: {
      'services.tokenpass.tcaBalances': tcaBalances
    }
  };
  return this.update(_id, update);
};

RocketChat.models.Users.getTokenBalancesByUserId = function (userId) {
  const query = {
    _id: userId
  };
  const options = {
    fields: {
      'services.tokenpass.tcaBalances': 1
    }
  };
  return this.findOne(query, options);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"findTokenChannels.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/methods/findTokenChannels.js                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({
  findTokenChannels() {
    if (!Meteor.userId()) {
      return [];
    }

    const user = Meteor.user();

    if (user.services && user.services.tokenpass && user.services.tokenpass.tcaBalances) {
      const tokens = {};
      user.services.tokenpass.tcaBalances.forEach(token => {
        tokens[token.asset] = 1;
      });
      return RocketChat.models.Rooms.findByTokenpass(Object.keys(tokens)).filter(room => RocketChat.Tokenpass.validateAccess(room.tokenpass, user.services.tokenpass.tcaBalances));
    }

    return [];
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getChannelTokenpass.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/methods/getChannelTokenpass.js                                               //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({
  getChannelTokenpass(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getChannelTokenpass'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getChannelTokenpass'
      });
    }

    return room.tokenpass;
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cronRemoveUsers.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/cronRemoveUsers.js                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* globals SyncedCron */
function removeUsersFromTokenChannels() {
  const rooms = {};
  RocketChat.models.Rooms.findAllTokenChannels().forEach(room => {
    rooms[room._id] = room.tokenpass;
  });
  const users = {};
  RocketChat.models.Subscriptions.findByRoomIds(Object.keys(rooms)).forEach(sub => {
    if (!users[sub.u._id]) {
      users[sub.u._id] = [];
    }

    users[sub.u._id].push(sub.rid);
  });
  Object.keys(users).forEach(user => {
    const userInfo = RocketChat.models.Users.findOneById(user);

    if (userInfo && userInfo.services && userInfo.services.tokenpass) {
      const balances = RocketChat.updateUserTokenpassBalances(userInfo);
      users[user].forEach(roomId => {
        const valid = RocketChat.Tokenpass.validateAccess(rooms[roomId], balances);

        if (!valid) {
          RocketChat.removeUserFromRoom(roomId, userInfo);
        }
      });
    }
  });
}

Meteor.startup(function () {
  Meteor.defer(function () {
    removeUsersFromTokenChannels();
    SyncedCron.add({
      name: 'Remove users from Token Channels',
      schedule: parser => parser.cron('0 * * * *'),
      job: removeUsersFromTokenChannels
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Tokenpass.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/Tokenpass.js                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.Tokenpass = {
  validateAccess(tokenpass, balances) {
    const compFunc = tokenpass.require === 'any' ? 'some' : 'every';
    return tokenpass.tokens[compFunc](config => {
      return balances.some(userToken => {
        return config.token === userToken.asset && parseFloat(config.balance) <= parseFloat(userToken.balance);
      });
    });
  }

};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:tokenpass/common.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/startup.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/getProtectedTokenpassBalances.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/getPublicTokenpassBalances.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/saveRoomTokens.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/saveRoomTokensMinimumBalance.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/updateUserTokenpassBalances.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/indexes.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/Users.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/methods/findTokenChannels.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/methods/getChannelTokenpass.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/cronRemoveUsers.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/Tokenpass.js");

/* Exports */
Package._define("rocketchat:tokenpass");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_tokenpass.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3MvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvc3RhcnR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXRQcm90ZWN0ZWRUb2tlbnBhc3NCYWxhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXRQdWJsaWNUb2tlbnBhc3NCYWxhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVRva2Vucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVRva2Vuc01pbmltdW1CYWxhbmNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvZnVuY3Rpb25zL3VwZGF0ZVVzZXJUb2tlbnBhc3NCYWxhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL21vZGVscy9pbmRleGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvbW9kZWxzL1Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvbW9kZWxzL1N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dG9rZW5wYXNzL3NlcnZlci9tb2RlbHMvVXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dG9rZW5wYXNzL3NlcnZlci9tZXRob2RzL2ZpbmRUb2tlbkNoYW5uZWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvbWV0aG9kcy9nZXRDaGFubmVsVG9rZW5wYXNzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvY3JvblJlbW92ZVVzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvVG9rZW5wYXNzLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsImF1dGhvcml6ZVBhdGgiLCJ0b2tlblBhdGgiLCJzY29wZSIsInRva2VuU2VudFZpYSIsInVzZXJuYW1lRmllbGQiLCJtZXJnZVVzZXJzIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwiVG9rZW5wYXNzIiwiQ3VzdG9tT0F1dGgiLCJNZXRlb3IiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJ2YWx1ZSIsImNvbmZpZ3VyZSIsIlRyYWNrZXIiLCJhdXRvcnVuIiwiYWRkR3JvdXAiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiaTE4bkRlc2NyaXB0aW9uIiwicmVhZG9ubHkiLCJmb3JjZSIsInZhbGlkYXRlVG9rZW5BY2Nlc3MiLCJ1c2VyRGF0YSIsInJvb21EYXRhIiwic2VydmljZXMiLCJ0b2tlbnBhc3MiLCJ0Y2FCYWxhbmNlcyIsInZhbGlkYXRlQWNjZXNzIiwiYXV0aHoiLCJhZGRSb29tQWNjZXNzVmFsaWRhdG9yIiwicm9vbSIsInVzZXIiLCJtb2RlbHMiLCJVc2VycyIsImdldFRva2VuQmFsYW5jZXNCeVVzZXJJZCIsImNhbGxiYWNrcyIsIkVycm9yIiwibWV0aG9kIiwiQWNjb3VudHMiLCJvbkxvZ2luIiwidXBkYXRlVXNlclRva2VucGFzc0JhbGFuY2VzIiwidXNlckFnZW50IiwicmVsZWFzZSIsImdldFByb3RlY3RlZFRva2VucGFzc0JhbGFuY2VzIiwiYWNjZXNzVG9rZW4iLCJIVFRQIiwiaGVhZGVycyIsIkFjY2VwdCIsInBhcmFtcyIsIm9hdXRoX3Rva2VuIiwiZGF0YSIsImVycm9yIiwibWVzc2FnZSIsImdldFB1YmxpY1Rva2VucGFzc0JhbGFuY2VzIiwic2F2ZVJvb21Ub2tlbnBhc3MiLCJyaWQiLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJSb29tcyIsInNldFRva2VucGFzc0J5SWQiLCJzIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzYXZlUm9vbVRva2Vuc01pbmltdW1CYWxhbmNlIiwicm9vbVRva2Vuc01pbmltdW1CYWxhbmNlIiwibWluaW11bVRva2VuQmFsYW5jZSIsInBhcnNlRmxvYXQiLCJlc2NhcGVIVE1MIiwic2V0TWluaW11bVRva2VuQmFsYW5jZUJ5SWQiLCJfIiwidGNhUHVibGljQmFsYW5jZXMiLCJ0Y2FQcm90ZWN0ZWRCYWxhbmNlcyIsImJhbGFuY2VzIiwidW5pcSIsInVuaW9uIiwiaXRlbSIsImFzc2V0Iiwic2V0VG9rZW5wYXNzVGNhQmFsYW5jZXMiLCJ0cnlFbnN1cmVJbmRleCIsImZpbmRCeVRva2VucGFzcyIsInRva2VucyIsInF1ZXJ5IiwiJGluIiwiX2RiIiwiZmluZCIsImZldGNoIiwic2V0VG9rZW5zQnlJZCIsInVwZGF0ZSIsIiRzZXQiLCJmaW5kQWxsVG9rZW5DaGFubmVscyIsIiRleGlzdHMiLCJvcHRpb25zIiwiZmllbGRzIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRCeVJvb21JZHMiLCJyb29tSWRzIiwidXNlcklkIiwiZmluZE9uZSIsIm1ldGhvZHMiLCJmaW5kVG9rZW5DaGFubmVscyIsImZvckVhY2giLCJ0b2tlbiIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJnZXRDaGFubmVsVG9rZW5wYXNzIiwiY2hlY2siLCJmaW5kT25lQnlJZCIsInJlbW92ZVVzZXJzRnJvbVRva2VuQ2hhbm5lbHMiLCJyb29tcyIsInVzZXJzIiwic3ViIiwidSIsInB1c2giLCJ1c2VySW5mbyIsInJvb21JZCIsInZhbGlkIiwicmVtb3ZlVXNlckZyb21Sb29tIiwiZGVmZXIiLCJTeW5jZWRDcm9uIiwibmFtZSIsInNjaGVkdWxlIiwicGFyc2VyIiwiY3JvbiIsImpvYiIsImNvbXBGdW5jIiwic29tZSIsInVzZXJUb2tlbiIsImJhbGFuY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQSxNQUFNQSxTQUFTO0FBQ2RDLGFBQVcsRUFERztBQUVkQyxnQkFBYyxhQUZBO0FBR2RDLGlCQUFlLGtCQUhEO0FBSWRDLGFBQVcscUJBSkc7QUFLZEMsU0FBTywyQkFMTztBQU1kQyxnQkFBYyxTQU5BO0FBT2RDLGlCQUFlLFVBUEQ7QUFRZEMsY0FBWSxJQVJFO0FBU2RDLHdCQUFzQjtBQUNyQkMscUJBQWlCLENBQUMsb0JBQUQsQ0FESTtBQUVyQkMsbUJBQWUsQ0FBQyx5QkFBRDtBQUZNO0FBVFIsQ0FBZjtBQWVBLE1BQU1DLFlBQVksSUFBSUMsV0FBSixDQUFnQixXQUFoQixFQUE2QmIsTUFBN0IsQ0FBbEI7O0FBRUEsSUFBSWMsT0FBT0MsUUFBWCxFQUFxQjtBQUNwQkQsU0FBT0UsT0FBUCxDQUFlLFlBQVc7QUFDekJDLGVBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QixFQUE2QyxVQUFTQyxHQUFULEVBQWNDLEtBQWQsRUFBcUI7QUFDakVyQixhQUFPQyxTQUFQLEdBQW1Cb0IsS0FBbkI7QUFDQVQsZ0JBQVVVLFNBQVYsQ0FBb0J0QixNQUFwQjtBQUNBLEtBSEQ7QUFJQSxHQUxEO0FBTUEsQ0FQRCxNQU9PO0FBQ05jLFNBQU9F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cEMsRUFBbUQzQyxRQUFuRCxDQUFkOztBQUVBLFlBQUksQ0FBQzRDLEtBQUwsRUFBWTtBQUNYckgscUJBQVdzSCxrQkFBWCxDQUE4QkYsTUFBOUIsRUFBc0NELFFBQXRDO0FBQ0E7QUFDRCxPQU5EO0FBT0E7QUFDRCxHQWREO0FBZUE7O0FBRUR0SCxPQUFPRSxPQUFQLENBQWUsWUFBVztBQUN6QkYsU0FBTzBILEtBQVAsQ0FBYSxZQUFXO0FBQ3ZCVjtBQUVBVyxlQUFXNUcsR0FBWCxDQUFlO0FBQ2Q2RyxZQUFNLGtDQURRO0FBRWRDLGdCQUFXQyxNQUFELElBQVlBLE9BQU9DLElBQVAsQ0FBWSxXQUFaLENBRlI7QUFHZEMsV0FBS2hCO0FBSFMsS0FBZjtBQUtBLEdBUkQ7QUFTQSxDQVZELEU7Ozs7Ozs7Ozs7O0FDbENBN0csV0FBV0wsU0FBWCxHQUF1QjtBQUN0QjZCLGlCQUFlRixTQUFmLEVBQTBCbUQsUUFBMUIsRUFBb0M7QUFDbkMsVUFBTXFELFdBQVd4RyxVQUFVdUMsT0FBVixLQUFzQixLQUF0QixHQUE4QixNQUE5QixHQUF1QyxPQUF4RDtBQUNBLFdBQU92QyxVQUFVMkQsTUFBVixDQUFpQjZDLFFBQWpCLEVBQTRCL0ksTUFBRCxJQUFZO0FBQzdDLGFBQU8wRixTQUFTc0QsSUFBVCxDQUFjQyxhQUFhO0FBQ2pDLGVBQU9qSixPQUFPdUgsS0FBUCxLQUFpQjBCLFVBQVVuRCxLQUEzQixJQUFvQ1YsV0FBV3BGLE9BQU9rSixPQUFsQixLQUE4QjlELFdBQVc2RCxVQUFVQyxPQUFyQixDQUF6RTtBQUNBLE9BRk0sQ0FBUDtBQUdBLEtBSk0sQ0FBUDtBQUtBOztBQVJxQixDQUF2QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3Rva2VucGFzcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBDdXN0b21PQXV0aCAqL1xuXG5jb25zdCBjb25maWcgPSB7XG5cdHNlcnZlclVSTDogJycsXG5cdGlkZW50aXR5UGF0aDogJy9vYXV0aC91c2VyJyxcblx0YXV0aG9yaXplUGF0aDogJy9vYXV0aC9hdXRob3JpemUnLFxuXHR0b2tlblBhdGg6ICcvb2F1dGgvYWNjZXNzLXRva2VuJyxcblx0c2NvcGU6ICd1c2VyLHRjYSxwcml2YXRlLWJhbGFuY2VzJyxcblx0dG9rZW5TZW50VmlhOiAncGF5bG9hZCcsXG5cdHVzZXJuYW1lRmllbGQ6ICd1c2VybmFtZScsXG5cdG1lcmdlVXNlcnM6IHRydWUsXG5cdGFkZEF1dG9wdWJsaXNoRmllbGRzOiB7XG5cdFx0Zm9yTG9nZ2VkSW5Vc2VyOiBbJ3NlcnZpY2VzLnRva2VucGFzcyddLFxuXHRcdGZvck90aGVyVXNlcnM6IFsnc2VydmljZXMudG9rZW5wYXNzLm5hbWUnXVxuXHR9XG59O1xuXG5jb25zdCBUb2tlbnBhc3MgPSBuZXcgQ3VzdG9tT0F1dGgoJ3Rva2VucGFzcycsIGNvbmZpZyk7XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0TWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Ub2tlbnBhc3NfVVJMJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdFx0Y29uZmlnLnNlcnZlclVSTCA9IHZhbHVlO1xuXHRcdFx0VG9rZW5wYXNzLmNvbmZpZ3VyZShjb25maWcpO1xuXHRcdH0pO1xuXHR9KTtcbn0gZWxzZSB7XG5cdE1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRcdFRyYWNrZXIuYXV0b3J1bihmdW5jdGlvbigpIHtcblx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1Rva2VucGFzc19VUkwnKSkge1xuXHRcdFx0XHRjb25maWcuc2VydmVyVVJMID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Ub2tlbnBhc3NfVVJMJyk7XG5cdFx0XHRcdFRva2VucGFzcy5jb25maWd1cmUoY29uZmlnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdPQXV0aCcsIGZ1bmN0aW9uKCkge1xuXHR0aGlzLnNlY3Rpb24oJ1Rva2VucGFzcycsIGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge1xuXHRcdFx0X2lkOiAnQWNjb3VudHNfT0F1dGhfVG9rZW5wYXNzJyxcblx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0fTtcblxuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Ub2tlbnBhc3MnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicgfSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9Ub2tlbnBhc3NfVVJMJywgJycsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogdHJ1ZSwgZW5hYmxlUXVlcnksIGkxOG5EZXNjcmlwdGlvbjogJ0FQSV9Ub2tlbnBhc3NfVVJMX0Rlc2NyaXB0aW9uJyB9KTtcblx0XHR0aGlzLmFkZCgnQWNjb3VudHNfT0F1dGhfVG9rZW5wYXNzX2lkJywgJycsIHsgdHlwZTogJ3N0cmluZycsIGVuYWJsZVF1ZXJ5IH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Ub2tlbnBhc3Nfc2VjcmV0JywgJycsIHsgdHlwZTogJ3N0cmluZycsIGVuYWJsZVF1ZXJ5IH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Ub2tlbnBhc3NfY2FsbGJhY2tfdXJsJywgJ19vYXV0aC90b2tlbnBhc3MnLCB7IHR5cGU6ICdyZWxhdGl2ZVVybCcsIHJlYWRvbmx5OiB0cnVlLCBmb3JjZTogdHJ1ZSwgZW5hYmxlUXVlcnkgfSk7XG5cdH0pO1xufSk7XG5cbmZ1bmN0aW9uIHZhbGlkYXRlVG9rZW5BY2Nlc3ModXNlckRhdGEsIHJvb21EYXRhKSB7XG5cdGlmICghdXNlckRhdGEgfHwgIXVzZXJEYXRhLnNlcnZpY2VzIHx8ICF1c2VyRGF0YS5zZXJ2aWNlcy50b2tlbnBhc3MgfHwgIXVzZXJEYXRhLnNlcnZpY2VzLnRva2VucGFzcy50Y2FCYWxhbmNlcykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0LlRva2VucGFzcy52YWxpZGF0ZUFjY2Vzcyhyb29tRGF0YS50b2tlbnBhc3MsIHVzZXJEYXRhLnNlcnZpY2VzLnRva2VucGFzcy50Y2FCYWxhbmNlcyk7XG59XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IoZnVuY3Rpb24ocm9vbSwgdXNlcikge1xuXHRcdGlmICghcm9vbSB8fCAhcm9vbS50b2tlbnBhc3MgfHwgIXVzZXIpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyRGF0YSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldFRva2VuQmFsYW5jZXNCeVVzZXJJZCh1c2VyLl9pZCk7XG5cblx0XHRyZXR1cm4gdmFsaWRhdGVUb2tlbkFjY2Vzcyh1c2VyRGF0YSwgcm9vbSk7XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYmVmb3JlSm9pblJvb20nLCBmdW5jdGlvbih1c2VyLCByb29tKSB7XG5cdFx0aWYgKHJvb20udG9rZW5wYXNzICYmICF2YWxpZGF0ZVRva2VuQWNjZXNzKHVzZXIsIHJvb20pKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdUb2tlbiByZXF1aXJlZCcsIHsgbWV0aG9kOiAnam9pblJvb20nIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiByb29tO1xuXHR9KTtcbn0pO1xuXG5BY2NvdW50cy5vbkxvZ2luKGZ1bmN0aW9uKHsgdXNlciB9KSB7XG5cdGlmICh1c2VyICYmIHVzZXIuc2VydmljZXMgJiYgdXNlci5zZXJ2aWNlcy50b2tlbnBhc3MpIHtcblx0XHRSb2NrZXRDaGF0LnVwZGF0ZVVzZXJUb2tlbnBhc3NCYWxhbmNlcyh1c2VyKTtcblx0fVxufSk7XG4iLCJsZXQgdXNlckFnZW50ID0gJ01ldGVvcic7XG5pZiAoTWV0ZW9yLnJlbGVhc2UpIHsgdXNlckFnZW50ICs9IGAvJHsgTWV0ZW9yLnJlbGVhc2UgfWA7IH1cblxuUm9ja2V0Q2hhdC5nZXRQcm90ZWN0ZWRUb2tlbnBhc3NCYWxhbmNlcyA9IGZ1bmN0aW9uKGFjY2Vzc1Rva2VuKSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIEhUVFAuZ2V0KFxuXHRcdFx0YCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfVG9rZW5wYXNzX1VSTCcpIH0vYXBpL3YxL3RjYS9wcm90ZWN0ZWQvYmFsYW5jZXNgLCB7XG5cdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdFx0XHQnVXNlci1BZ2VudCc6IHVzZXJBZ2VudFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwYXJhbXM6IHtcblx0XHRcdFx0XHRvYXV0aF90b2tlbjogYWNjZXNzVG9rZW5cblx0XHRcdFx0fVxuXHRcdFx0fSkuZGF0YTtcblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBwcm90ZWN0ZWQgdG9rZW5wYXNzIGJhbGFuY2VzIGZyb20gVG9rZW5wYXNzLiAkeyBlcnJvci5tZXNzYWdlIH1gKTtcblx0fVxufTtcbiIsImxldCB1c2VyQWdlbnQgPSAnTWV0ZW9yJztcbmlmIChNZXRlb3IucmVsZWFzZSkgeyB1c2VyQWdlbnQgKz0gYC8keyBNZXRlb3IucmVsZWFzZSB9YDsgfVxuXG5Sb2NrZXRDaGF0LmdldFB1YmxpY1Rva2VucGFzc0JhbGFuY2VzID0gZnVuY3Rpb24oYWNjZXNzVG9rZW4pIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSFRUUC5nZXQoXG5cdFx0XHRgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Ub2tlbnBhc3NfVVJMJykgfS9hcGkvdjEvdGNhL3B1YmxpYy9iYWxhbmNlc2AsIHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdCdVc2VyLUFnZW50JzogdXNlckFnZW50XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdG9hdXRoX3Rva2VuOiBhY2Nlc3NUb2tlblxuXHRcdFx0XHR9XG5cdFx0XHR9KS5kYXRhO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIHB1YmxpYyB0b2tlbnBhc3MgYmFsYW5jZXMgZnJvbSBUb2tlbnBhc3MuICR7IGVycm9yLm1lc3NhZ2UgfWApO1xuXHR9XG59O1xuIiwiUm9ja2V0Q2hhdC5zYXZlUm9vbVRva2VucGFzcyA9IGZ1bmN0aW9uKHJpZCwgdG9rZW5wYXNzKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21Ub2tlbnMnXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0VG9rZW5wYXNzQnlJZChyaWQsIHRva2VucGFzcyk7XG59O1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5Sb2NrZXRDaGF0LnNhdmVSb29tVG9rZW5zTWluaW11bUJhbGFuY2UgPSBmdW5jdGlvbihyaWQsIHJvb21Ub2tlbnNNaW5pbXVtQmFsYW5jZSkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVG9rZW5zTWluaW11bUJhbGFuY2UnXG5cdFx0fSk7XG5cdH1cblxuXHRjb25zdCBtaW5pbXVtVG9rZW5CYWxhbmNlID0gcGFyc2VGbG9hdChzLmVzY2FwZUhUTUwocm9vbVRva2Vuc01pbmltdW1CYWxhbmNlKSk7XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldE1pbmltdW1Ub2tlbkJhbGFuY2VCeUlkKHJpZCwgbWluaW11bVRva2VuQmFsYW5jZSk7XG59O1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblJvY2tldENoYXQudXBkYXRlVXNlclRva2VucGFzc0JhbGFuY2VzID0gZnVuY3Rpb24odXNlcikge1xuXHRpZiAodXNlciAmJiB1c2VyLnNlcnZpY2VzICYmIHVzZXIuc2VydmljZXMudG9rZW5wYXNzKSB7XG5cdFx0Y29uc3QgdGNhUHVibGljQmFsYW5jZXMgPSBSb2NrZXRDaGF0LmdldFB1YmxpY1Rva2VucGFzc0JhbGFuY2VzKHVzZXIuc2VydmljZXMudG9rZW5wYXNzLmFjY2Vzc1Rva2VuKTtcblx0XHRjb25zdCB0Y2FQcm90ZWN0ZWRCYWxhbmNlcyA9IFJvY2tldENoYXQuZ2V0UHJvdGVjdGVkVG9rZW5wYXNzQmFsYW5jZXModXNlci5zZXJ2aWNlcy50b2tlbnBhc3MuYWNjZXNzVG9rZW4pO1xuXG5cdFx0Y29uc3QgYmFsYW5jZXMgPSBfLnVuaXEoXy51bmlvbih0Y2FQdWJsaWNCYWxhbmNlcywgdGNhUHJvdGVjdGVkQmFsYW5jZXMpLCBmYWxzZSwgaXRlbSA9PiBpdGVtLmFzc2V0KTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldFRva2VucGFzc1RjYUJhbGFuY2VzKHVzZXIuX2lkLCBiYWxhbmNlcyk7XG5cblx0XHRyZXR1cm4gYmFsYW5jZXM7XG5cdH1cbn07XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudHJ5RW5zdXJlSW5kZXgoeyAndG9rZW5wYXNzLnRva2Vucy50b2tlbic6IDEgfSk7XG59KTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVRva2VucGFzcyA9IGZ1bmN0aW9uKHRva2Vucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHQndG9rZW5wYXNzLnRva2Vucy50b2tlbic6IHtcblx0XHRcdCRpbjogdG9rZW5zXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLl9kYi5maW5kKHF1ZXJ5KS5mZXRjaCgpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0VG9rZW5zQnlJZCA9IGZ1bmN0aW9uKF9pZCwgdG9rZW5zKSB7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHQndG9rZW5wYXNzLnRva2Vucy50b2tlbic6IHRva2Vuc1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUoe19pZH0sIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUb2tlbnBhc3NCeUlkID0gZnVuY3Rpb24oX2lkLCB0b2tlbnBhc3MpIHtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHRva2VucGFzc1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRBbGxUb2tlbkNoYW5uZWxzID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHRva2VucGFzczogeyAkZXhpc3RzOiB0cnVlIH1cblx0fTtcblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdHRva2VucGFzczogMVxuXHRcdH1cblx0fTtcblx0cmV0dXJuIHRoaXMuX2RiLmZpbmQocXVlcnksIG9wdGlvbnMpO1xufTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkcyA9IGZ1bmN0aW9uKHJvb21JZHMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cmlkOiB7XG5cdFx0XHQkaW46IHJvb21JZHNcblx0XHR9XG5cdH07XG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0ZmllbGRzOiB7XG5cdFx0XHQndS5faWQnOiAxLFxuXHRcdFx0cmlkOiAxXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLl9kYi5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRUb2tlbnBhc3NUY2FCYWxhbmNlcyA9IGZ1bmN0aW9uKF9pZCwgdGNhQmFsYW5jZXMpIHtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCdzZXJ2aWNlcy50b2tlbnBhc3MudGNhQmFsYW5jZXMnOiB0Y2FCYWxhbmNlc1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUoX2lkLCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0VG9rZW5CYWxhbmNlc0J5VXNlcklkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogdXNlcklkXG5cdH07XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdCdzZXJ2aWNlcy50b2tlbnBhc3MudGNhQmFsYW5jZXMnOiAxXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xufTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0ZmluZFRva2VuQ2hhbm5lbHMoKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmICh1c2VyLnNlcnZpY2VzICYmIHVzZXIuc2VydmljZXMudG9rZW5wYXNzICYmIHVzZXIuc2VydmljZXMudG9rZW5wYXNzLnRjYUJhbGFuY2VzKSB7XG5cdFx0XHRjb25zdCB0b2tlbnMgPSB7fTtcblx0XHRcdHVzZXIuc2VydmljZXMudG9rZW5wYXNzLnRjYUJhbGFuY2VzLmZvckVhY2godG9rZW4gPT4ge1xuXHRcdFx0XHR0b2tlbnNbdG9rZW4uYXNzZXRdID0gMTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VG9rZW5wYXNzKE9iamVjdC5rZXlzKHRva2VucykpXG5cdFx0XHRcdC5maWx0ZXIocm9vbSA9PiBSb2NrZXRDaGF0LlRva2VucGFzcy52YWxpZGF0ZUFjY2Vzcyhyb29tLnRva2VucGFzcywgdXNlci5zZXJ2aWNlcy50b2tlbnBhc3MudGNhQmFsYW5jZXMpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gW107XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRDaGFubmVsVG9rZW5wYXNzKHJpZCkge1xuXHRcdGNoZWNrKHJpZCwgU3RyaW5nKTtcblxuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdnZXRDaGFubmVsVG9rZW5wYXNzJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHsgbWV0aG9kOiAnZ2V0Q2hhbm5lbFRva2VucGFzcycgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJvb20udG9rZW5wYXNzO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgU3luY2VkQ3JvbiAqL1xuZnVuY3Rpb24gcmVtb3ZlVXNlcnNGcm9tVG9rZW5DaGFubmVscygpIHtcblx0Y29uc3Qgcm9vbXMgPSB7fTtcblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQWxsVG9rZW5DaGFubmVscygpLmZvckVhY2gocm9vbSA9PiB7XG5cdFx0cm9vbXNbcm9vbS5faWRdID0gcm9vbS50b2tlbnBhc3M7XG5cdH0pO1xuXG5cdGNvbnN0IHVzZXJzID0ge307XG5cblx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlSb29tSWRzKE9iamVjdC5rZXlzKHJvb21zKSkuZm9yRWFjaChzdWIgPT4ge1xuXHRcdGlmICghdXNlcnNbc3ViLnUuX2lkXSkge1xuXHRcdFx0dXNlcnNbc3ViLnUuX2lkXSA9IFtdO1xuXHRcdH1cblx0XHR1c2Vyc1tzdWIudS5faWRdLnB1c2goc3ViLnJpZCk7XG5cdH0pO1xuXG5cdE9iamVjdC5rZXlzKHVzZXJzKS5mb3JFYWNoKHVzZXIgPT4ge1xuXHRcdGNvbnN0IHVzZXJJbmZvID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcik7XG5cblx0XHRpZiAodXNlckluZm8gJiYgdXNlckluZm8uc2VydmljZXMgJiYgdXNlckluZm8uc2VydmljZXMudG9rZW5wYXNzKSB7XG5cdFx0XHRjb25zdCBiYWxhbmNlcyA9IFJvY2tldENoYXQudXBkYXRlVXNlclRva2VucGFzc0JhbGFuY2VzKHVzZXJJbmZvKTtcblxuXHRcdFx0dXNlcnNbdXNlcl0uZm9yRWFjaChyb29tSWQgPT4ge1xuXHRcdFx0XHRjb25zdCB2YWxpZCA9IFJvY2tldENoYXQuVG9rZW5wYXNzLnZhbGlkYXRlQWNjZXNzKHJvb21zW3Jvb21JZF0sIGJhbGFuY2VzKTtcblxuXHRcdFx0XHRpZiAoIXZhbGlkKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5yZW1vdmVVc2VyRnJvbVJvb20ocm9vbUlkLCB1c2VySW5mbyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG59XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0cmVtb3ZlVXNlcnNGcm9tVG9rZW5DaGFubmVscygpO1xuXG5cdFx0U3luY2VkQ3Jvbi5hZGQoe1xuXHRcdFx0bmFtZTogJ1JlbW92ZSB1c2VycyBmcm9tIFRva2VuIENoYW5uZWxzJyxcblx0XHRcdHNjaGVkdWxlOiAocGFyc2VyKSA9PiBwYXJzZXIuY3JvbignMCAqICogKiAqJyksXG5cdFx0XHRqb2I6IHJlbW92ZVVzZXJzRnJvbVRva2VuQ2hhbm5lbHNcblx0XHR9KTtcblx0fSk7XG59KTtcbiIsIlJvY2tldENoYXQuVG9rZW5wYXNzID0ge1xuXHR2YWxpZGF0ZUFjY2Vzcyh0b2tlbnBhc3MsIGJhbGFuY2VzKSB7XG5cdFx0Y29uc3QgY29tcEZ1bmMgPSB0b2tlbnBhc3MucmVxdWlyZSA9PT0gJ2FueScgPyAnc29tZScgOiAnZXZlcnknO1xuXHRcdHJldHVybiB0b2tlbnBhc3MudG9rZW5zW2NvbXBGdW5jXSgoY29uZmlnKSA9PiB7XG5cdFx0XHRyZXR1cm4gYmFsYW5jZXMuc29tZSh1c2VyVG9rZW4gPT4ge1xuXHRcdFx0XHRyZXR1cm4gY29uZmlnLnRva2VuID09PSB1c2VyVG9rZW4uYXNzZXQgJiYgcGFyc2VGbG9hdChjb25maWcuYmFsYW5jZSkgPD0gcGFyc2VGbG9hdCh1c2VyVG9rZW4uYmFsYW5jZSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxufTtcbiJdfQ==
