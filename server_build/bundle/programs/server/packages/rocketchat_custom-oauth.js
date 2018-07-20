(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var check = Package.check.check;
var Match = Package.check.Match;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var ECMAScript = Package.ecmascript.ECMAScript;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Accounts = Package['accounts-base'].Accounts;

/* Package-scope variables */
var CustomOAuth;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:custom-oauth":{"server":{"custom_oauth_server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_custom-oauth/server/custom_oauth_server.js                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  CustomOAuth: () => CustomOAuth
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('CustomOAuth');
const Services = {};
const BeforeUpdateOrCreateUserFromExternalService = [];

class CustomOAuth {
  constructor(name, options) {
    logger.debug('Init CustomOAuth', name, options);
    this.name = name;

    if (!Match.test(this.name, String)) {
      throw new Meteor.Error('CustomOAuth: Name is required and must be String');
    }

    if (Services[this.name]) {
      Services[this.name].configure(options);
      return;
    }

    Services[this.name] = this;
    this.configure(options);
    this.userAgent = 'Meteor';

    if (Meteor.release) {
      this.userAgent += `/${Meteor.release}`;
    }

    Accounts.oauth.registerService(this.name);
    this.registerService();
    this.addHookToProcessUser();
  }

  configure(options) {
    if (!Match.test(options, Object)) {
      throw new Meteor.Error('CustomOAuth: Options is required and must be Object');
    }

    if (!Match.test(options.serverURL, String)) {
      throw new Meteor.Error('CustomOAuth: Options.serverURL is required and must be String');
    }

    if (!Match.test(options.tokenPath, String)) {
      options.tokenPath = '/oauth/token';
    }

    if (!Match.test(options.identityPath, String)) {
      options.identityPath = '/me';
    }

    this.serverURL = options.serverURL;
    this.tokenPath = options.tokenPath;
    this.identityPath = options.identityPath;
    this.tokenSentVia = options.tokenSentVia;
    this.identityTokenSentVia = options.identityTokenSentVia;
    this.usernameField = (options.usernameField || '').trim();
    this.mergeUsers = options.mergeUsers;

    if (this.identityTokenSentVia == null || this.identityTokenSentVia === 'default') {
      this.identityTokenSentVia = this.tokenSentVia;
    }

    if (!/^https?:\/\/.+/.test(this.tokenPath)) {
      this.tokenPath = this.serverURL + this.tokenPath;
    }

    if (!/^https?:\/\/.+/.test(this.identityPath)) {
      this.identityPath = this.serverURL + this.identityPath;
    }

    if (Match.test(options.addAutopublishFields, Object)) {
      Accounts.addAutopublishFields(options.addAutopublishFields);
    }
  }

  getAccessToken(query) {
    const config = ServiceConfiguration.configurations.findOne({
      service: this.name
    });

    if (!config) {
      throw new ServiceConfiguration.ConfigError();
    }

    let response = undefined;
    const allOptions = {
      headers: {
        'User-Agent': this.userAgent,
        // http://doc.gitlab.com/ce/api/users.html#Current-user
        Accept: 'application/json'
      },
      params: {
        code: query.code,
        redirect_uri: OAuth._redirectUri(this.name, config),
        grant_type: 'authorization_code',
        state: query.state
      }
    }; // Only send clientID / secret once on header or payload.

    if (this.tokenSentVia === 'header') {
      allOptions['auth'] = `${config.clientId}:${OAuth.openSecret(config.secret)}`;
    } else {
      allOptions['params']['client_secret'] = OAuth.openSecret(config.secret);
      allOptions['params']['client_id'] = config.clientId;
    }

    try {
      response = HTTP.post(this.tokenPath, allOptions);
    } catch (err) {
      const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${err.message}`);
      throw _.extend(error, {
        response: err.response
      });
    }

    let data;

    if (response.data) {
      data = response.data;
    } else {
      data = JSON.parse(response.content);
    }

    if (data.error) {
      //if the http response was a json object with an error attribute
      throw new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${data.error}`);
    } else {
      return data.access_token;
    }
  }

  getIdentity(accessToken) {
    const params = {};
    const headers = {
      'User-Agent': this.userAgent // http://doc.gitlab.com/ce/api/users.html#Current-user

    };

    if (this.identityTokenSentVia === 'header') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      params['access_token'] = accessToken;
    }

    try {
      const response = HTTP.get(this.identityPath, {
        headers,
        params
      });
      let data;

      if (response.data) {
        data = response.data;
      } else {
        data = JSON.parse(response.content);
      }

      logger.debug('Identity response', JSON.stringify(data, null, 2));
      return data;
    } catch (err) {
      const error = new Error(`Failed to fetch identity from ${this.name} at ${this.identityPath}. ${err.message}`);
      throw _.extend(error, {
        response: err.response
      });
    }
  }

  registerService() {
    const self = this;
    OAuth.registerService(this.name, 2, null, query => {
      const accessToken = self.getAccessToken(query); // console.log 'at:', accessToken

      let identity = self.getIdentity(accessToken);

      if (identity) {
        // Set 'id' to '_id' for any sources that provide it
        if (identity._id && !identity.id) {
          identity.id = identity._id;
        } // Fix for Reddit


        if (identity.result) {
          identity = identity.result;
        } // Fix WordPress-like identities having 'ID' instead of 'id'


        if (identity.ID && !identity.id) {
          identity.id = identity.ID;
        } // Fix Auth0-like identities having 'user_id' instead of 'id'


        if (identity.user_id && !identity.id) {
          identity.id = identity.user_id;
        }

        if (identity.CharacterID && !identity.id) {
          identity.id = identity.CharacterID;
        } // Fix Dataporten having 'user.userid' instead of 'id'


        if (identity.user && identity.user.userid && !identity.id) {
          if (identity.user.userid_sec && identity.user.userid_sec[0]) {
            identity.id = identity.user.userid_sec[0];
          } else {
            identity.id = identity.user.userid;
          }

          identity.email = identity.user.email;
        } // Fix for Xenforo [BD]API plugin for 'user.user_id; instead of 'id'


        if (identity.user && identity.user.user_id && !identity.id) {
          identity.id = identity.user.user_id;
          identity.email = identity.user.user_email;
        } // Fix general 'phid' instead of 'id' from phabricator


        if (identity.phid && !identity.id) {
          identity.id = identity.phid;
        } // Fix Keycloak-like identities having 'sub' instead of 'id'


        if (identity.sub && !identity.id) {
          identity.id = identity.sub;
        } // Fix general 'userid' instead of 'id' from provider


        if (identity.userid && !identity.id) {
          identity.id = identity.userid;
        } // Fix Nextcloud provider


        if (!identity.id && identity.ocs && identity.ocs.data && identity.ocs.data.id) {
          identity.id = identity.ocs.data.id;
          identity.name = identity.ocs.data.displayname;
          identity.email = identity.ocs.data.email;
        } // Fix when authenticating from a meteor app with 'emails' field


        if (!identity.email && identity.emails && Array.isArray(identity.emails) && identity.emails.length >= 1) {
          identity.email = identity.emails[0].address ? identity.emails[0].address : undefined;
        }
      } // console.log 'id:', JSON.stringify identity, null, '  '


      const serviceData = {
        _OAuthCustom: true,
        accessToken
      };

      _.extend(serviceData, identity);

      const data = {
        serviceData,
        options: {
          profile: {
            name: identity.name || identity.username || identity.nickname || identity.CharacterName || identity.userName || identity.preferred_username || identity.user && identity.user.name
          }
        }
      }; // console.log data

      return data;
    });
  }

  retrieveCredential(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
  }

  getUsername(data) {
    let username = '';
    username = this.usernameField.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : undefined;
    }, data);

    if (!username) {
      throw new Meteor.Error('field_not_found', `Username field "${this.usernameField}" not found in data`, data);
    }

    return username;
  }

  addHookToProcessUser() {
    BeforeUpdateOrCreateUserFromExternalService.push((serviceName, serviceData
    /*, options*/
    ) => {
      if (serviceName !== this.name) {
        return;
      }

      if (this.usernameField) {
        const username = this.getUsername(serviceData);
        const user = RocketChat.models.Users.findOneByUsername(username);

        if (!user) {
          return;
        } // User already created or merged


        if (user.services && user.services[serviceName] && user.services[serviceName].id === serviceData.id) {
          return;
        }

        if (this.mergeUsers !== true) {
          throw new Meteor.Error('CustomOAuth', `User with username ${user.username} already exists`);
        }

        const serviceIdKey = `services.${serviceName}.id`;
        const update = {
          $set: {
            [serviceIdKey]: serviceData.id
          }
        };
        RocketChat.models.Users.update({
          _id: user._id
        }, update);
      }
    });
    Accounts.validateNewUser(user => {
      if (!user.services || !user.services[this.name] || !user.services[this.name].id) {
        return true;
      }

      if (this.usernameField) {
        user.username = this.getUsername(user.services[this.name]);
      }

      return true;
    });
  }

}

const updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;

Accounts.updateOrCreateUserFromExternalService = function ()
/*serviceName, serviceData, options*/
{
  for (const hook of BeforeUpdateOrCreateUserFromExternalService) {
    hook.apply(this, arguments);
  }

  return updateOrCreateUserFromExternalService.apply(this, arguments);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:custom-oauth/server/custom_oauth_server.js");

/* Exports */
Package._define("rocketchat:custom-oauth", exports, {
  CustomOAuth: CustomOAuth
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_custom-oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjdXN0b20tb2F1dGgvc2VydmVyL2N1c3RvbV9vYXV0aF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiQ3VzdG9tT0F1dGgiLCJfIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJsb2dnZXIiLCJMb2dnZXIiLCJTZXJ2aWNlcyIsIkJlZm9yZVVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJvcHRpb25zIiwiZGVidWciLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJNZXRlb3IiLCJFcnJvciIsImNvbmZpZ3VyZSIsInVzZXJBZ2VudCIsInJlbGVhc2UiLCJBY2NvdW50cyIsIm9hdXRoIiwicmVnaXN0ZXJTZXJ2aWNlIiwiYWRkSG9va1RvUHJvY2Vzc1VzZXIiLCJPYmplY3QiLCJzZXJ2ZXJVUkwiLCJ0b2tlblBhdGgiLCJpZGVudGl0eVBhdGgiLCJ0b2tlblNlbnRWaWEiLCJpZGVudGl0eVRva2VuU2VudFZpYSIsInVzZXJuYW1lRmllbGQiLCJ0cmltIiwibWVyZ2VVc2VycyIsImFkZEF1dG9wdWJsaXNoRmllbGRzIiwiZ2V0QWNjZXNzVG9rZW4iLCJxdWVyeSIsImNvbmZpZyIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJmaW5kT25lIiwic2VydmljZSIsIkNvbmZpZ0Vycm9yIiwicmVzcG9uc2UiLCJ1bmRlZmluZWQiLCJhbGxPcHRpb25zIiwiaGVhZGVycyIsIkFjY2VwdCIsInBhcmFtcyIsImNvZGUiLCJyZWRpcmVjdF91cmkiLCJPQXV0aCIsIl9yZWRpcmVjdFVyaSIsImdyYW50X3R5cGUiLCJzdGF0ZSIsImNsaWVudElkIiwib3BlblNlY3JldCIsInNlY3JldCIsIkhUVFAiLCJwb3N0IiwiZXJyIiwiZXJyb3IiLCJtZXNzYWdlIiwiZXh0ZW5kIiwiZGF0YSIsIkpTT04iLCJwYXJzZSIsImNvbnRlbnQiLCJhY2Nlc3NfdG9rZW4iLCJnZXRJZGVudGl0eSIsImFjY2Vzc1Rva2VuIiwiZ2V0Iiwic3RyaW5naWZ5Iiwic2VsZiIsImlkZW50aXR5IiwiX2lkIiwiaWQiLCJyZXN1bHQiLCJJRCIsInVzZXJfaWQiLCJDaGFyYWN0ZXJJRCIsInVzZXIiLCJ1c2VyaWQiLCJ1c2VyaWRfc2VjIiwiZW1haWwiLCJ1c2VyX2VtYWlsIiwicGhpZCIsInN1YiIsIm9jcyIsImRpc3BsYXluYW1lIiwiZW1haWxzIiwiQXJyYXkiLCJpc0FycmF5IiwibGVuZ3RoIiwiYWRkcmVzcyIsInNlcnZpY2VEYXRhIiwiX09BdXRoQ3VzdG9tIiwicHJvZmlsZSIsInVzZXJuYW1lIiwibmlja25hbWUiLCJDaGFyYWN0ZXJOYW1lIiwidXNlck5hbWUiLCJwcmVmZXJyZWRfdXNlcm5hbWUiLCJyZXRyaWV2ZUNyZWRlbnRpYWwiLCJjcmVkZW50aWFsVG9rZW4iLCJjcmVkZW50aWFsU2VjcmV0IiwiZ2V0VXNlcm5hbWUiLCJzcGxpdCIsInJlZHVjZSIsInByZXYiLCJjdXJyIiwicHVzaCIsInNlcnZpY2VOYW1lIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJzZXJ2aWNlcyIsInNlcnZpY2VJZEtleSIsInVwZGF0ZSIsIiRzZXQiLCJ2YWxpZGF0ZU5ld1VzZXIiLCJ1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIiwiaG9vayIsImFwcGx5IiwiYXJndW1lbnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGVBQVksTUFBSUE7QUFBakIsQ0FBZDs7QUFBNkMsSUFBSUMsQ0FBSjs7QUFBTUgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0osUUFBRUksQ0FBRjtBQUFJOztBQUFo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QU4sSUFBa0IsQ0FBQ3BDLEtBQUtvQyxRQUFMLENBQWMsS0FBSzNHLElBQW5CLENBQW5CLElBQStDLENBQUN1RSxLQUFLb0MsUUFBTCxDQUFjLEtBQUszRyxJQUFuQixFQUF5QmtFLEVBQTdFLEVBQWlGO0FBQ2hGLGVBQU8sSUFBUDtBQUNBOztBQUVELFVBQUksS0FBSzdDLGFBQVQsRUFBd0I7QUFDdkJrRCxhQUFLaUIsUUFBTCxHQUFnQixLQUFLUSxXQUFMLENBQWlCekIsS0FBS29DLFFBQUwsQ0FBYyxLQUFLM0csSUFBbkIsQ0FBakIsQ0FBaEI7QUFDQTs7QUFFRCxhQUFPLElBQVA7QUFDQSxLQVZEO0FBWUE7O0FBNVR1Qjs7QUFnVXpCLE1BQU1nSCx3Q0FBd0NyRyxTQUFTcUcscUNBQXZEOztBQUNBckcsU0FBU3FHLHFDQUFULEdBQWlEO0FBQVM7QUFBdUM7QUFDaEcsT0FBSyxNQUFNQyxJQUFYLElBQW1CbkgsMkNBQW5CLEVBQWdFO0FBQy9EbUgsU0FBS0MsS0FBTCxDQUFXLElBQVgsRUFBaUJDLFNBQWpCO0FBQ0E7O0FBRUQsU0FBT0gsc0NBQXNDRSxLQUF0QyxDQUE0QyxJQUE1QyxFQUFrREMsU0FBbEQsQ0FBUDtBQUNBLENBTkQsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9jdXN0b20tb2F1dGguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmdsb2JhbHMgT0F1dGgqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0N1c3RvbU9BdXRoJyk7XG5cbmNvbnN0IFNlcnZpY2VzID0ge307XG5jb25zdCBCZWZvcmVVcGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlID0gW107XG5cbmV4cG9ydCBjbGFzcyBDdXN0b21PQXV0aCB7XG5cdGNvbnN0cnVjdG9yKG5hbWUsIG9wdGlvbnMpIHtcblx0XHRsb2dnZXIuZGVidWcoJ0luaXQgQ3VzdG9tT0F1dGgnLCBuYW1lLCBvcHRpb25zKTtcblxuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0aWYgKCFNYXRjaC50ZXN0KHRoaXMubmFtZSwgU3RyaW5nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ3VzdG9tT0F1dGg6IE5hbWUgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgU3RyaW5nJyk7XG5cdFx0fVxuXG5cdFx0aWYgKFNlcnZpY2VzW3RoaXMubmFtZV0pIHtcblx0XHRcdFNlcnZpY2VzW3RoaXMubmFtZV0uY29uZmlndXJlKG9wdGlvbnMpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdFNlcnZpY2VzW3RoaXMubmFtZV0gPSB0aGlzO1xuXG5cdFx0dGhpcy5jb25maWd1cmUob3B0aW9ucyk7XG5cblx0XHR0aGlzLnVzZXJBZ2VudCA9ICdNZXRlb3InO1xuXHRcdGlmIChNZXRlb3IucmVsZWFzZSkge1xuXHRcdFx0dGhpcy51c2VyQWdlbnQgKz0gYC8keyBNZXRlb3IucmVsZWFzZSB9YDtcblx0XHR9XG5cblx0XHRBY2NvdW50cy5vYXV0aC5yZWdpc3RlclNlcnZpY2UodGhpcy5uYW1lKTtcblx0XHR0aGlzLnJlZ2lzdGVyU2VydmljZSgpO1xuXHRcdHRoaXMuYWRkSG9va1RvUHJvY2Vzc1VzZXIoKTtcblx0fVxuXG5cdGNvbmZpZ3VyZShvcHRpb25zKSB7XG5cdFx0aWYgKCFNYXRjaC50ZXN0KG9wdGlvbnMsIE9iamVjdCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0N1c3RvbU9BdXRoOiBPcHRpb25zIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIE9iamVjdCcpO1xuXHRcdH1cblxuXHRcdGlmICghTWF0Y2gudGVzdChvcHRpb25zLnNlcnZlclVSTCwgU3RyaW5nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ3VzdG9tT0F1dGg6IE9wdGlvbnMuc2VydmVyVVJMIGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIFN0cmluZycpO1xuXHRcdH1cblxuXHRcdGlmICghTWF0Y2gudGVzdChvcHRpb25zLnRva2VuUGF0aCwgU3RyaW5nKSkge1xuXHRcdFx0b3B0aW9ucy50b2tlblBhdGggPSAnL29hdXRoL3Rva2VuJztcblx0XHR9XG5cblx0XHRpZiAoIU1hdGNoLnRlc3Qob3B0aW9ucy5pZGVudGl0eVBhdGgsIFN0cmluZykpIHtcblx0XHRcdG9wdGlvbnMuaWRlbnRpdHlQYXRoID0gJy9tZSc7XG5cdFx0fVxuXG5cdFx0dGhpcy5zZXJ2ZXJVUkwgPSBvcHRpb25zLnNlcnZlclVSTDtcblx0XHR0aGlzLnRva2VuUGF0aCA9IG9wdGlvbnMudG9rZW5QYXRoO1xuXHRcdHRoaXMuaWRlbnRpdHlQYXRoID0gb3B0aW9ucy5pZGVudGl0eVBhdGg7XG5cdFx0dGhpcy50b2tlblNlbnRWaWEgPSBvcHRpb25zLnRva2VuU2VudFZpYTtcblx0XHR0aGlzLmlkZW50aXR5VG9rZW5TZW50VmlhID0gb3B0aW9ucy5pZGVudGl0eVRva2VuU2VudFZpYTtcblx0XHR0aGlzLnVzZXJuYW1lRmllbGQgPSAob3B0aW9ucy51c2VybmFtZUZpZWxkIHx8ICcnKS50cmltKCk7XG5cdFx0dGhpcy5tZXJnZVVzZXJzID0gb3B0aW9ucy5tZXJnZVVzZXJzO1xuXG5cdFx0aWYgKHRoaXMuaWRlbnRpdHlUb2tlblNlbnRWaWEgPT0gbnVsbCB8fCB0aGlzLmlkZW50aXR5VG9rZW5TZW50VmlhID09PSAnZGVmYXVsdCcpIHtcblx0XHRcdHRoaXMuaWRlbnRpdHlUb2tlblNlbnRWaWEgPSB0aGlzLnRva2VuU2VudFZpYTtcblx0XHR9XG5cblx0XHRpZiAoIS9eaHR0cHM/OlxcL1xcLy4rLy50ZXN0KHRoaXMudG9rZW5QYXRoKSkge1xuXHRcdFx0dGhpcy50b2tlblBhdGggPSB0aGlzLnNlcnZlclVSTCArIHRoaXMudG9rZW5QYXRoO1xuXHRcdH1cblxuXHRcdGlmICghL15odHRwcz86XFwvXFwvLisvLnRlc3QodGhpcy5pZGVudGl0eVBhdGgpKSB7XG5cdFx0XHR0aGlzLmlkZW50aXR5UGF0aCA9IHRoaXMuc2VydmVyVVJMICsgdGhpcy5pZGVudGl0eVBhdGg7XG5cdFx0fVxuXG5cdFx0aWYgKE1hdGNoLnRlc3Qob3B0aW9ucy5hZGRBdXRvcHVibGlzaEZpZWxkcywgT2JqZWN0KSkge1xuXHRcdFx0QWNjb3VudHMuYWRkQXV0b3B1Ymxpc2hGaWVsZHMob3B0aW9ucy5hZGRBdXRvcHVibGlzaEZpZWxkcyk7XG5cdFx0fVxuXHR9XG5cblx0Z2V0QWNjZXNzVG9rZW4ocXVlcnkpIHtcblx0XHRjb25zdCBjb25maWcgPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kT25lKHtzZXJ2aWNlOiB0aGlzLm5hbWV9KTtcblx0XHRpZiAoIWNvbmZpZykge1xuXHRcdFx0dGhyb3cgbmV3IFNlcnZpY2VDb25maWd1cmF0aW9uLkNvbmZpZ0Vycm9yKCk7XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3BvbnNlID0gdW5kZWZpbmVkO1xuXG5cdFx0Y29uc3QgYWxsT3B0aW9ucyA9IHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J1VzZXItQWdlbnQnOiB0aGlzLnVzZXJBZ2VudCwgLy8gaHR0cDovL2RvYy5naXRsYWIuY29tL2NlL2FwaS91c2Vycy5odG1sI0N1cnJlbnQtdXNlclxuXHRcdFx0XHRBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdFx0fSxcblx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRjb2RlOiBxdWVyeS5jb2RlLFxuXHRcdFx0XHRyZWRpcmVjdF91cmk6IE9BdXRoLl9yZWRpcmVjdFVyaSh0aGlzLm5hbWUsIGNvbmZpZyksXG5cdFx0XHRcdGdyYW50X3R5cGU6ICdhdXRob3JpemF0aW9uX2NvZGUnLFxuXHRcdFx0XHRzdGF0ZTogcXVlcnkuc3RhdGVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly8gT25seSBzZW5kIGNsaWVudElEIC8gc2VjcmV0IG9uY2Ugb24gaGVhZGVyIG9yIHBheWxvYWQuXG5cdFx0aWYgKHRoaXMudG9rZW5TZW50VmlhID09PSAnaGVhZGVyJykge1xuXHRcdFx0YWxsT3B0aW9uc1snYXV0aCddID0gYCR7IGNvbmZpZy5jbGllbnRJZCB9OiR7IE9BdXRoLm9wZW5TZWNyZXQoY29uZmlnLnNlY3JldCkgfWA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFsbE9wdGlvbnNbJ3BhcmFtcyddWydjbGllbnRfc2VjcmV0J10gPSBPQXV0aC5vcGVuU2VjcmV0KGNvbmZpZy5zZWNyZXQpO1xuXHRcdFx0YWxsT3B0aW9uc1sncGFyYW1zJ11bJ2NsaWVudF9pZCddID0gY29uZmlnLmNsaWVudElkO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRyZXNwb25zZSA9IEhUVFAucG9zdCh0aGlzLnRva2VuUGF0aCwgYWxsT3B0aW9ucyk7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNvbXBsZXRlIE9BdXRoIGhhbmRzaGFrZSB3aXRoICR7IHRoaXMubmFtZSB9IGF0ICR7IHRoaXMudG9rZW5QYXRoIH0uICR7IGVyci5tZXNzYWdlIH1gKTtcblx0XHRcdHRocm93IF8uZXh0ZW5kKGVycm9yLCB7cmVzcG9uc2U6IGVyci5yZXNwb25zZX0pO1xuXHRcdH1cblxuXHRcdGxldCBkYXRhO1xuXHRcdGlmIChyZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRkYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG5cdFx0fVxuXG5cdFx0aWYgKGRhdGEuZXJyb3IpIHsgLy9pZiB0aGUgaHR0cCByZXNwb25zZSB3YXMgYSBqc29uIG9iamVjdCB3aXRoIGFuIGVycm9yIGF0dHJpYnV0ZVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY29tcGxldGUgT0F1dGggaGFuZHNoYWtlIHdpdGggJHsgdGhpcy5uYW1lIH0gYXQgJHsgdGhpcy50b2tlblBhdGggfS4gJHsgZGF0YS5lcnJvciB9YCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBkYXRhLmFjY2Vzc190b2tlbjtcblx0XHR9XG5cdH1cblxuXHRnZXRJZGVudGl0eShhY2Nlc3NUb2tlbikge1xuXHRcdGNvbnN0IHBhcmFtcyA9IHt9O1xuXHRcdGNvbnN0IGhlYWRlcnMgPSB7XG5cdFx0XHQnVXNlci1BZ2VudCc6IHRoaXMudXNlckFnZW50IC8vIGh0dHA6Ly9kb2MuZ2l0bGFiLmNvbS9jZS9hcGkvdXNlcnMuaHRtbCNDdXJyZW50LXVzZXJcblx0XHR9O1xuXG5cdFx0aWYgKHRoaXMuaWRlbnRpdHlUb2tlblNlbnRWaWEgPT09ICdoZWFkZXInKSB7XG5cdFx0XHRoZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBgQmVhcmVyICR7IGFjY2Vzc1Rva2VuIH1gO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwYXJhbXNbJ2FjY2Vzc190b2tlbiddID0gYWNjZXNzVG9rZW47XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQodGhpcy5pZGVudGl0eVBhdGgsIHtcblx0XHRcdFx0aGVhZGVycyxcblx0XHRcdFx0cGFyYW1zXG5cdFx0XHR9KTtcblxuXHRcdFx0bGV0IGRhdGE7XG5cblx0XHRcdGlmIChyZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG5cdFx0XHR9XG5cblx0XHRcdGxvZ2dlci5kZWJ1ZygnSWRlbnRpdHkgcmVzcG9uc2UnLCBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSk7XG5cblx0XHRcdHJldHVybiBkYXRhO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYEZhaWxlZCB0byBmZXRjaCBpZGVudGl0eSBmcm9tICR7IHRoaXMubmFtZSB9IGF0ICR7IHRoaXMuaWRlbnRpdHlQYXRoIH0uICR7IGVyci5tZXNzYWdlIH1gKTtcblx0XHRcdHRocm93IF8uZXh0ZW5kKGVycm9yLCB7cmVzcG9uc2U6IGVyci5yZXNwb25zZX0pO1xuXHRcdH1cblx0fVxuXG5cdHJlZ2lzdGVyU2VydmljZSgpIHtcblx0XHRjb25zdCBzZWxmID0gdGhpcztcblx0XHRPQXV0aC5yZWdpc3RlclNlcnZpY2UodGhpcy5uYW1lLCAyLCBudWxsLCAocXVlcnkpID0+IHtcblx0XHRcdGNvbnN0IGFjY2Vzc1Rva2VuID0gc2VsZi5nZXRBY2Nlc3NUb2tlbihxdWVyeSk7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyAnYXQ6JywgYWNjZXNzVG9rZW5cblxuXHRcdFx0bGV0IGlkZW50aXR5ID0gc2VsZi5nZXRJZGVudGl0eShhY2Nlc3NUb2tlbik7XG5cblx0XHRcdGlmIChpZGVudGl0eSkge1xuXHRcdFx0XHQvLyBTZXQgJ2lkJyB0byAnX2lkJyBmb3IgYW55IHNvdXJjZXMgdGhhdCBwcm92aWRlIGl0XG5cdFx0XHRcdGlmIChpZGVudGl0eS5faWQgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS5faWQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggZm9yIFJlZGRpdFxuXHRcdFx0XHRpZiAoaWRlbnRpdHkucmVzdWx0KSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkgPSBpZGVudGl0eS5yZXN1bHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggV29yZFByZXNzLWxpa2UgaWRlbnRpdGllcyBoYXZpbmcgJ0lEJyBpbnN0ZWFkIG9mICdpZCdcblx0XHRcdFx0aWYgKGlkZW50aXR5LklEICYmICFpZGVudGl0eS5pZCkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkuSUQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggQXV0aDAtbGlrZSBpZGVudGl0aWVzIGhhdmluZyAndXNlcl9pZCcgaW5zdGVhZCBvZiAnaWQnXG5cdFx0XHRcdGlmIChpZGVudGl0eS51c2VyX2lkICYmICFpZGVudGl0eS5pZCkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkudXNlcl9pZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChpZGVudGl0eS5DaGFyYWN0ZXJJRCAmJiAhaWRlbnRpdHkuaWQpIHtcblx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5LkNoYXJhY3RlcklEO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRml4IERhdGFwb3J0ZW4gaGF2aW5nICd1c2VyLnVzZXJpZCcgaW5zdGVhZCBvZiAnaWQnXG5cdFx0XHRcdGlmIChpZGVudGl0eS51c2VyICYmIGlkZW50aXR5LnVzZXIudXNlcmlkICYmICFpZGVudGl0eS5pZCkge1xuXHRcdFx0XHRcdGlmIChpZGVudGl0eS51c2VyLnVzZXJpZF9zZWMgJiYgaWRlbnRpdHkudXNlci51c2VyaWRfc2VjWzBdKSB7XG5cdFx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5LnVzZXIudXNlcmlkX3NlY1swXTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS51c2VyLnVzZXJpZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWRlbnRpdHkuZW1haWwgPSBpZGVudGl0eS51c2VyLmVtYWlsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIEZpeCBmb3IgWGVuZm9ybyBbQkRdQVBJIHBsdWdpbiBmb3IgJ3VzZXIudXNlcl9pZDsgaW5zdGVhZCBvZiAnaWQnXG5cdFx0XHRcdGlmIChpZGVudGl0eS51c2VyICYmIGlkZW50aXR5LnVzZXIudXNlcl9pZCAmJiAhaWRlbnRpdHkuaWQpIHtcblx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5LnVzZXIudXNlcl9pZDtcblx0XHRcdFx0XHRpZGVudGl0eS5lbWFpbCA9IGlkZW50aXR5LnVzZXIudXNlcl9lbWFpbDtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBGaXggZ2VuZXJhbCAncGhpZCcgaW5zdGVhZCBvZiAnaWQnIGZyb20gcGhhYnJpY2F0b3Jcblx0XHRcdFx0aWYgKGlkZW50aXR5LnBoaWQgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS5waGlkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRml4IEtleWNsb2FrLWxpa2UgaWRlbnRpdGllcyBoYXZpbmcgJ3N1YicgaW5zdGVhZCBvZiAnaWQnXG5cdFx0XHRcdGlmIChpZGVudGl0eS5zdWIgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS5zdWI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggZ2VuZXJhbCAndXNlcmlkJyBpbnN0ZWFkIG9mICdpZCcgZnJvbSBwcm92aWRlclxuXHRcdFx0XHRpZiAoaWRlbnRpdHkudXNlcmlkICYmICFpZGVudGl0eS5pZCkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkudXNlcmlkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRml4IE5leHRjbG91ZCBwcm92aWRlclxuXHRcdFx0XHRpZiAoIWlkZW50aXR5LmlkICYmIGlkZW50aXR5Lm9jcyAmJiBpZGVudGl0eS5vY3MuZGF0YSAmJiBpZGVudGl0eS5vY3MuZGF0YS5pZCkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkub2NzLmRhdGEuaWQ7XG5cdFx0XHRcdFx0aWRlbnRpdHkubmFtZSA9IGlkZW50aXR5Lm9jcy5kYXRhLmRpc3BsYXluYW1lO1xuXHRcdFx0XHRcdGlkZW50aXR5LmVtYWlsID0gaWRlbnRpdHkub2NzLmRhdGEuZW1haWw7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggd2hlbiBhdXRoZW50aWNhdGluZyBmcm9tIGEgbWV0ZW9yIGFwcCB3aXRoICdlbWFpbHMnIGZpZWxkXG5cdFx0XHRcdGlmICghaWRlbnRpdHkuZW1haWwgJiYgKGlkZW50aXR5LmVtYWlscyAmJiBBcnJheS5pc0FycmF5KGlkZW50aXR5LmVtYWlscykgJiYgaWRlbnRpdHkuZW1haWxzLmxlbmd0aCA+PSAxKSkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmVtYWlsID0gaWRlbnRpdHkuZW1haWxzWzBdLmFkZHJlc3MgPyBpZGVudGl0eS5lbWFpbHNbMF0uYWRkcmVzcyA6IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyAnaWQ6JywgSlNPTi5zdHJpbmdpZnkgaWRlbnRpdHksIG51bGwsICcgICdcblxuXHRcdFx0Y29uc3Qgc2VydmljZURhdGEgPSB7XG5cdFx0XHRcdF9PQXV0aEN1c3RvbTogdHJ1ZSxcblx0XHRcdFx0YWNjZXNzVG9rZW5cblx0XHRcdH07XG5cblx0XHRcdF8uZXh0ZW5kKHNlcnZpY2VEYXRhLCBpZGVudGl0eSk7XG5cblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHNlcnZpY2VEYXRhLFxuXHRcdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdFx0cHJvZmlsZToge1xuXHRcdFx0XHRcdFx0bmFtZTogaWRlbnRpdHkubmFtZSB8fCBpZGVudGl0eS51c2VybmFtZSB8fCBpZGVudGl0eS5uaWNrbmFtZSB8fCBpZGVudGl0eS5DaGFyYWN0ZXJOYW1lIHx8IGlkZW50aXR5LnVzZXJOYW1lIHx8IGlkZW50aXR5LnByZWZlcnJlZF91c2VybmFtZSB8fCAoaWRlbnRpdHkudXNlciAmJiBpZGVudGl0eS51c2VyLm5hbWUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyBkYXRhXG5cblx0XHRcdHJldHVybiBkYXRhO1xuXHRcdH0pO1xuXHR9XG5cblx0cmV0cmlldmVDcmVkZW50aWFsKGNyZWRlbnRpYWxUb2tlbiwgY3JlZGVudGlhbFNlY3JldCkge1xuXHRcdHJldHVybiBPQXV0aC5yZXRyaWV2ZUNyZWRlbnRpYWwoY3JlZGVudGlhbFRva2VuLCBjcmVkZW50aWFsU2VjcmV0KTtcblx0fVxuXG5cdGdldFVzZXJuYW1lKGRhdGEpIHtcblx0XHRsZXQgdXNlcm5hbWUgPSAnJztcblxuXHRcdHVzZXJuYW1lID0gdGhpcy51c2VybmFtZUZpZWxkLnNwbGl0KCcuJykucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcblx0XHRcdHJldHVybiBwcmV2ID8gcHJldltjdXJyXSA6IHVuZGVmaW5lZDtcblx0XHR9LCBkYXRhKTtcblx0XHRpZiAoIXVzZXJuYW1lKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdmaWVsZF9ub3RfZm91bmQnLCBgVXNlcm5hbWUgZmllbGQgXCIkeyB0aGlzLnVzZXJuYW1lRmllbGQgfVwiIG5vdCBmb3VuZCBpbiBkYXRhYCwgZGF0YSk7XG5cdFx0fVxuXHRcdHJldHVybiB1c2VybmFtZTtcblx0fVxuXG5cdGFkZEhvb2tUb1Byb2Nlc3NVc2VyKCkge1xuXHRcdEJlZm9yZVVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UucHVzaCgoc2VydmljZU5hbWUsIHNlcnZpY2VEYXRhLyosIG9wdGlvbnMqLykgPT4ge1xuXHRcdFx0aWYgKHNlcnZpY2VOYW1lICE9PSB0aGlzLm5hbWUpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy51c2VybmFtZUZpZWxkKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXJuYW1lID0gdGhpcy5nZXRVc2VybmFtZShzZXJ2aWNlRGF0YSk7XG5cblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gVXNlciBhbHJlYWR5IGNyZWF0ZWQgb3IgbWVyZ2VkXG5cdFx0XHRcdGlmICh1c2VyLnNlcnZpY2VzICYmIHVzZXIuc2VydmljZXNbc2VydmljZU5hbWVdICYmIHVzZXIuc2VydmljZXNbc2VydmljZU5hbWVdLmlkID09PSBzZXJ2aWNlRGF0YS5pZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLm1lcmdlVXNlcnMgIT09IHRydWUpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDdXN0b21PQXV0aCcsIGBVc2VyIHdpdGggdXNlcm5hbWUgJHsgdXNlci51c2VybmFtZSB9IGFscmVhZHkgZXhpc3RzYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBzZXJ2aWNlSWRLZXkgPSBgc2VydmljZXMuJHsgc2VydmljZU5hbWUgfS5pZGA7XG5cdFx0XHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0XHRbc2VydmljZUlkS2V5XTogc2VydmljZURhdGEuaWRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgdXBkYXRlKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdEFjY291bnRzLnZhbGlkYXRlTmV3VXNlcigodXNlcikgPT4ge1xuXHRcdFx0aWYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzW3RoaXMubmFtZV0gfHwgIXVzZXIuc2VydmljZXNbdGhpcy5uYW1lXS5pZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMudXNlcm5hbWVGaWVsZCkge1xuXHRcdFx0XHR1c2VyLnVzZXJuYW1lID0gdGhpcy5nZXRVc2VybmFtZSh1c2VyLnNlcnZpY2VzW3RoaXMubmFtZV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblxuXHR9XG59XG5cblxuY29uc3QgdXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSA9IEFjY291bnRzLnVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2U7XG5BY2NvdW50cy51cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlID0gZnVuY3Rpb24oLypzZXJ2aWNlTmFtZSwgc2VydmljZURhdGEsIG9wdGlvbnMqLykge1xuXHRmb3IgKGNvbnN0IGhvb2sgb2YgQmVmb3JlVXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSkge1xuXHRcdGhvb2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0fVxuXG5cdHJldHVybiB1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuIl19
