(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var __coffeescriptShare, OAuth2Server;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_oauth2-server/model.coffee.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var AccessTokens, AuthCodes, Clients, Model, RefreshTokens, debug;

AccessTokens = void 0;

RefreshTokens = void 0;

Clients = void 0;

AuthCodes = void 0;

debug = void 0;

this.Model = Model = (function() {
  function Model(config) {
    if (config == null) {
      config = {};
    }
    if (config.accessTokensCollectionName == null) {
      config.accessTokensCollectionName = 'oauth_access_tokens';
    }
    if (config.refreshTokensCollectionName == null) {
      config.refreshTokensCollectionName = 'oauth_refresh_tokens';
    }
    if (config.clientsCollectionName == null) {
      config.clientsCollectionName = 'oauth_clients';
    }
    if (config.authCodesCollectionName == null) {
      config.authCodesCollectionName = 'oauth_auth_codes';
    }
    this.debug = debug = config.debug;
    this.AccessTokens = AccessTokens = config.accessTokensCollection || new Meteor.Collection(config.accessTokensCollectionName);
    this.RefreshTokens = RefreshTokens = config.refreshTokensCollection || new Meteor.Collection(config.refreshTokensCollectionName);
    this.Clients = Clients = config.clientsCollection || new Meteor.Collection(config.clientsCollectionName);
    this.AuthCodes = AuthCodes = config.authCodesCollection || new Meteor.Collection(config.authCodesCollectionName);
  }

  Model.prototype.getAccessToken = Meteor.bindEnvironment(function(bearerToken, callback) {
    var e, token;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in getAccessToken (bearerToken:', bearerToken, ')');
    }
    try {
      token = AccessTokens.findOne({
        accessToken: bearerToken
      });
      return callback(null, token);
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  Model.prototype.getClient = Meteor.bindEnvironment(function(clientId, clientSecret, callback) {
    var client, e;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in getClient (clientId:', clientId, ', clientSecret:', clientSecret, ')');
    }
    try {
      if (clientSecret == null) {
        client = Clients.findOne({
          active: true,
          clientId: clientId
        });
      } else {
        client = Clients.findOne({
          active: true,
          clientId: clientId,
          clientSecret: clientSecret
        });
      }
      return callback(null, client);
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  Model.prototype.grantTypeAllowed = function(clientId, grantType, callback) {
    if (debug === true) {
      console.log('[OAuth2Server]', 'in grantTypeAllowed (clientId:', clientId, ', grantType:', grantType + ')');
    }
    return callback(false, grantType === 'authorization_code' || grantType === 'refresh_token');
  };

  Model.prototype.saveAccessToken = Meteor.bindEnvironment(function(token, clientId, expires, user, callback) {
    var e, tokenId;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in saveAccessToken (token:', token, ', clientId:', clientId, ', user:', user, ', expires:', expires, ')');
    }
    try {
      tokenId = AccessTokens.insert({
        accessToken: token,
        clientId: clientId,
        userId: user.id,
        expires: expires
      });
      return callback(null, tokenId);
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  Model.prototype.getAuthCode = Meteor.bindEnvironment(function(authCode, callback) {
    var code, e;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in getAuthCode (authCode: ' + authCode + ')');
    }
    try {
      code = AuthCodes.findOne({
        authCode: authCode
      });
      return callback(null, code);
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  Model.prototype.saveAuthCode = Meteor.bindEnvironment(function(code, clientId, expires, user, callback) {
    var codeId, e;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in saveAuthCode (code:', code, ', clientId:', clientId, ', expires:', expires, ', user:', user, ')');
    }
    try {
      codeId = AuthCodes.upsert({
        authCode: code
      }, {
        authCode: code,
        clientId: clientId,
        userId: user.id,
        expires: expires
      });
      return callback(null, codeId);
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  Model.prototype.saveRefreshToken = Meteor.bindEnvironment(function(token, clientId, expires, user, callback) {
    var e, tokenId;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in saveRefreshToken (token:', token, ', clientId:', clientId, ', user:', user, ', expires:', expires, ')');
    }
    try {
      return tokenId = RefreshTokens.insert({
        refreshToken: token,
        clientId: clientId,
        userId: user.id,
        expires: expires
      }, callback(null, tokenId));
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  Model.prototype.getRefreshToken = Meteor.bindEnvironment(function(refreshToken, callback) {
    var e, token;
    if (debug === true) {
      console.log('[OAuth2Server]', 'in getRefreshToken (refreshToken: ' + refreshToken + ')');
    }
    try {
      token = RefreshTokens.findOne({
        refreshToken: refreshToken
      });
      return callback(null, token);
    } catch (_error) {
      e = _error;
      return callback(e);
    }
  });

  return Model;

})();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_oauth2-server/oauth.coffee.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var express, oauthserver;              

oauthserver = Npm.require('oauth2-server');

express = Npm.require('express');

OAuth2Server = (function() {
  function OAuth2Server(config) {
    this.config = config != null ? config : {};
    this.app = express();
    this.routes = express();
    this.model = new Model(this.config);
    this.oauth = oauthserver({
      model: this.model,
      grants: ['authorization_code', 'refresh_token'],
      debug: this.config.debug
    });
    this.publishAuhorizedClients();
    this.initRoutes();
    return this;
  }

  OAuth2Server.prototype.publishAuhorizedClients = function() {
    return Meteor.publish('authorizedOAuth', function() {
      if (this.userId == null) {
        return this.ready();
      }
      return Meteor.users.find({
        _id: this.userId
      }, {
        fields: {
          'oauth.authorizedClients': 1
        }
      });
      return typeof user !== "undefined" && user !== null;
    });
  };

  OAuth2Server.prototype.initRoutes = function() {
    var debugMiddleware, self, transformRequestsNotUsingFormUrlencodedType;
    self = this;
    debugMiddleware = function(req, res, next) {
      if (self.config.debug === true) {
        console.log('[OAuth2Server]', req.method, req.url);
      }
      return next();
    };
    transformRequestsNotUsingFormUrlencodedType = function(req, res, next) {
      if (!req.is('application/x-www-form-urlencoded') && req.method === 'POST') {
        if (self.config.debug === true) {
          console.log('[OAuth2Server]', 'Transforming a request to form-urlencoded with the query going to the body.');
        }
        req.headers['content-type'] = 'application/x-www-form-urlencoded';
        req.body = Object.assign({}, req.body, req.query);
      }
      return next();
    };
    this.app.all('/oauth/token', debugMiddleware, transformRequestsNotUsingFormUrlencodedType, this.oauth.grant());
    this.app.get('/oauth/authorize', debugMiddleware, Meteor.bindEnvironment(function(req, res, next) {
      var client;
      client = self.model.Clients.findOne({
        active: true,
        clientId: req.query.client_id
      });
      if (client == null) {
        return res.redirect('/oauth/error/404');
      }
      if (client.redirectUri !== req.query.redirect_uri) {
        return res.redirect('/oauth/error/invalid_redirect_uri');
      }
      return next();
    }));
    this.app.post('/oauth/authorize', debugMiddleware, Meteor.bindEnvironment(function(req, res, next) {
      var user;
      if (req.body.token == null) {
        return res.sendStatus(401).send('No token');
      }
      user = Meteor.users.findOne({
        'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(req.body.token)
      });
      if (user == null) {
        return res.sendStatus(401).send('Invalid token');
      }
      req.user = {
        id: user._id
      };
      return next();
    }));
    this.app.post('/oauth/authorize', debugMiddleware, this.oauth.authCodeGrant(function(req, next) {
      if (req.body.allow === 'yes') {
        Meteor.users.update(req.user.id, {
          $addToSet: {
            'oauth.authorizedClients': this.clientId
          }
        });
      }
      return next(null, req.body.allow === 'yes', req.user);
    }));
    this.app.use(this.routes);
    return this.app.all('/oauth/*', this.oauth.errorHandler());
  };

  return OAuth2Server;

})();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("rocketchat:oauth2-server", {
  OAuth2Server: OAuth2Server
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_oauth2-server.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdF9vYXV0aDItc2VydmVyL21vZGVsLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdF9vYXV0aDItc2VydmVyL29hdXRoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQUEsZUFBZSxNQUFmOztBQUFBLGFBQ0EsR0FBZ0IsTUFEaEI7O0FBQUEsT0FFQSxHQUFVLE1BRlY7O0FBQUEsU0FHQSxHQUFZLE1BSFo7O0FBQUEsS0FJQSxHQUFRLE1BSlI7O0FBQUEsSUFNQyxNQUFELEdBQWU7QUFDRCxpQkFBQyxNQUFEOztNQUFDLFNBQU87S0FDcEI7O01BQUEsTUFBTSxDQUFDLDZCQUE4QjtLQUFyQzs7TUFDQSxNQUFNLENBQUMsOEJBQStCO0tBRHRDOztNQUVBLE1BQU0sQ0FBQyx3QkFBeUI7S0FGaEM7O01BR0EsTUFBTSxDQUFDLDBCQUEyQjtLQUhsQztBQUFBLElBS0EsSUFBQyxNQUFELEdBQVMsUUFBUSxNQUFNLENBQUMsS0FMeEI7QUFBQSxJQU9BLElBQUMsYUFBRCxHQUFnQixlQUFlLE1BQU0sQ0FBQyxzQkFBUCxJQUFxQyxVQUFNLENBQUMsVUFBUCxDQUFrQixNQUFNLENBQUMsMEJBQXpCLENBUHBFO0FBQUEsSUFRQSxJQUFDLGNBQUQsR0FBaUIsZ0JBQWdCLE1BQU0sQ0FBQyx1QkFBUCxJQUFzQyxVQUFNLENBQUMsVUFBUCxDQUFrQixNQUFNLENBQUMsMkJBQXpCLENBUnZFO0FBQUEsSUFTQSxJQUFDLFFBQUQsR0FBVyxVQUFVLE1BQU0sQ0FBQyxpQkFBUCxJQUFnQyxVQUFNLENBQUMsVUFBUCxDQUFrQixNQUFNLENBQUMscUJBQXpCLENBVHJEO0FBQUEsSUFVQSxJQUFDLFVBQUQsR0FBYSxZQUFZLE1BQU0sQ0FBQyxtQkFBUCxJQUFrQyxVQUFNLENBQUMsVUFBUCxDQUFrQixNQUFNLENBQUMsdUJB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bGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9vYXV0aDItc2VydmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQWNjZXNzVG9rZW5zID0gdW5kZWZpbmVkXG5SZWZyZXNoVG9rZW5zID0gdW5kZWZpbmVkXG5DbGllbnRzID0gdW5kZWZpbmVkXG5BdXRoQ29kZXMgPSB1bmRlZmluZWRcbmRlYnVnID0gdW5kZWZpbmVkXG5cbkBNb2RlbCA9IGNsYXNzIE1vZGVsXG5cdGNvbnN0cnVjdG9yOiAoY29uZmlnPXt9KSAtPlxuXHRcdGNvbmZpZy5hY2Nlc3NUb2tlbnNDb2xsZWN0aW9uTmFtZSA/PSAnb2F1dGhfYWNjZXNzX3Rva2Vucydcblx0XHRjb25maWcucmVmcmVzaFRva2Vuc0NvbGxlY3Rpb25OYW1lID89ICdvYXV0aF9yZWZyZXNoX3Rva2Vucydcblx0XHRjb25maWcuY2xpZW50c0NvbGxlY3Rpb25OYW1lID89ICdvYXV0aF9jbGllbnRzJ1xuXHRcdGNvbmZpZy5hdXRoQ29kZXNDb2xsZWN0aW9uTmFtZSA/PSAnb2F1dGhfYXV0aF9jb2RlcydcblxuXHRcdEBkZWJ1ZyA9IGRlYnVnID0gY29uZmlnLmRlYnVnXG5cblx0XHRAQWNjZXNzVG9rZW5zID0gQWNjZXNzVG9rZW5zID0gY29uZmlnLmFjY2Vzc1Rva2Vuc0NvbGxlY3Rpb24gb3IgbmV3IE1ldGVvci5Db2xsZWN0aW9uIGNvbmZpZy5hY2Nlc3NUb2tlbnNDb2xsZWN0aW9uTmFtZVxuXHRcdEBSZWZyZXNoVG9rZW5zID0gUmVmcmVzaFRva2VucyA9IGNvbmZpZy5yZWZyZXNoVG9rZW5zQ29sbGVjdGlvbiBvciBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24gY29uZmlnLnJlZnJlc2hUb2tlbnNDb2xsZWN0aW9uTmFtZVxuXHRcdEBDbGllbnRzID0gQ2xpZW50cyA9IGNvbmZpZy5jbGllbnRzQ29sbGVjdGlvbiBvciBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24gY29uZmlnLmNsaWVudHNDb2xsZWN0aW9uTmFtZVxuXHRcdEBBdXRoQ29kZXMgPSBBdXRoQ29kZXMgPSBjb25maWcuYXV0aENvZGVzQ29sbGVjdGlvbiBvciBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24gY29uZmlnLmF1dGhDb2Rlc0NvbGxlY3Rpb25OYW1lXG5cblxuXHRnZXRBY2Nlc3NUb2tlbjogTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCAoYmVhcmVyVG9rZW4sIGNhbGxiYWNrKSAtPlxuXHRcdGlmIGRlYnVnIGlzIHRydWVcblx0XHRcdGNvbnNvbGUubG9nICdbT0F1dGgyU2VydmVyXScsICdpbiBnZXRBY2Nlc3NUb2tlbiAoYmVhcmVyVG9rZW46JywgYmVhcmVyVG9rZW4sICcpJ1xuXG5cdFx0dHJ5XG5cdFx0XHR0b2tlbiA9IEFjY2Vzc1Rva2Vucy5maW5kT25lIGFjY2Vzc1Rva2VuOiBiZWFyZXJUb2tlblxuXHRcdFx0Y2FsbGJhY2sgbnVsbCwgdG9rZW5cblx0XHRjYXRjaCBlXG5cdFx0XHRjYWxsYmFjayBlXG5cblxuXHRnZXRDbGllbnQ6IE1ldGVvci5iaW5kRW52aXJvbm1lbnQgKGNsaWVudElkLCBjbGllbnRTZWNyZXQsIGNhbGxiYWNrKSAtPlxuXHRcdGlmIGRlYnVnIGlzIHRydWVcblx0XHRcdGNvbnNvbGUubG9nICdbT0F1dGgyU2VydmVyXScsICdpbiBnZXRDbGllbnQgKGNsaWVudElkOicsIGNsaWVudElkLCAnLCBjbGllbnRTZWNyZXQ6JywgY2xpZW50U2VjcmV0LCAnKSdcblxuXHRcdHRyeVxuXHRcdFx0aWYgbm90IGNsaWVudFNlY3JldD9cblx0XHRcdFx0Y2xpZW50ID0gQ2xpZW50cy5maW5kT25lIHsgYWN0aXZlOiB0cnVlLCBjbGllbnRJZDogY2xpZW50SWQgfVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRjbGllbnQgPSBDbGllbnRzLmZpbmRPbmUgeyBhY3RpdmU6IHRydWUsIGNsaWVudElkOiBjbGllbnRJZCwgY2xpZW50U2VjcmV0OiBjbGllbnRTZWNyZXQgfVxuXHRcdFx0Y2FsbGJhY2sgbnVsbCwgY2xpZW50XG5cdFx0Y2F0Y2ggZVxuXHRcdFx0Y2FsbGJhY2sgZVxuXG5cblx0Z3JhbnRUeXBlQWxsb3dlZDogKGNsaWVudElkLCBncmFudFR5cGUsIGNhbGxiYWNrKSAtPlxuXHRcdGlmIGRlYnVnIGlzIHRydWVcblx0XHRcdGNvbnNvbGUubG9nICdbT0F1dGgyU2VydmVyXScsICdpbiBncmFudFR5cGVBbGxvd2VkIChjbGllbnRJZDonLCBjbGllbnRJZCwgJywgZ3JhbnRUeXBlOicsIGdyYW50VHlwZSArICcpJ1xuXG5cdFx0cmV0dXJuIGNhbGxiYWNrKGZhbHNlLCBncmFudFR5cGUgaW4gWydhdXRob3JpemF0aW9uX2NvZGUnLCAncmVmcmVzaF90b2tlbiddKVxuXG5cblx0c2F2ZUFjY2Vzc1Rva2VuOiBNZXRlb3IuYmluZEVudmlyb25tZW50ICh0b2tlbiwgY2xpZW50SWQsIGV4cGlyZXMsIHVzZXIsIGNhbGxiYWNrKSAtPlxuXHRcdGlmIGRlYnVnIGlzIHRydWVcblx0XHRcdGNvbnNvbGUubG9nICdbT0F1dGgyU2VydmVyXScsICdpbiBzYXZlQWNjZXNzVG9rZW4gKHRva2VuOicsIHRva2VuLCAnLCBjbGllbnRJZDonLCBjbGllbnRJZCwgJywgdXNlcjonLCB1c2VyLCAnLCBleHBpcmVzOicsIGV4cGlyZXMsICcpJ1xuXG5cdFx0dHJ5XG5cdFx0XHR0b2tlbklkID0gQWNjZXNzVG9rZW5zLmluc2VydFxuXHRcdFx0XHRhY2Nlc3NUb2tlbjogdG9rZW5cblx0XHRcdFx0Y2xpZW50SWQ6IGNsaWVudElkXG5cdFx0XHRcdHVzZXJJZDogdXNlci5pZFxuXHRcdFx0XHRleHBpcmVzOiBleHBpcmVzXG5cblx0XHRcdGNhbGxiYWNrIG51bGwsIHRva2VuSWRcblx0XHRjYXRjaCBlXG5cdFx0XHRjYWxsYmFjayBlXG5cblxuXHRnZXRBdXRoQ29kZTogTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCAoYXV0aENvZGUsIGNhbGxiYWNrKSAtPlxuXHRcdGlmIGRlYnVnIGlzIHRydWVcblx0XHRcdGNvbnNvbGUubG9nICdbT0F1dGgyU2VydmVyXScsICdpbiBnZXRBdXRoQ29kZSAoYXV0aENvZGU6ICcgKyBhdXRoQ29kZSArICcpJ1xuXG5cdFx0dHJ5XG5cdFx0XHRjb2RlID0gQXV0aENvZGVzLmZpbmRPbmUgYXV0aENvZGU6IGF1dGhDb2RlXG5cdFx0XHRjYWxsYmFjayBudWxsLCBjb2RlXG5cdFx0Y2F0Y2ggZVxuXHRcdFx0Y2FsbGJhY2sgZVxuXG5cblx0c2F2ZUF1dGhDb2RlOiBNZXRlb3IuYmluZEVudmlyb25tZW50IChjb2RlLCBjbGllbnRJZCwgZXhwaXJlcywgdXNlciwgY2FsbGJhY2spIC0+XG5cdFx0aWYgZGVidWcgaXMgdHJ1ZVxuXHRcdFx0Y29uc29sZS5sb2cgJ1tPQXV0aDJTZXJ2ZXJdJywgJ2luIHNhdmVBdXRoQ29kZSAoY29kZTonLCBjb2RlLCAnLCBjbGllbnRJZDonLCBjbGllbnRJZCwgJywgZXhwaXJlczonLCBleHBpcmVzLCAnLCB1c2VyOicsIHVzZXIsICcpJ1xuXG5cdFx0dHJ5XG5cdFx0XHRjb2RlSWQgPSBBdXRoQ29kZXMudXBzZXJ0XG5cdFx0XHRcdGF1dGhDb2RlOiBjb2RlXG5cdFx0XHQsXG5cdFx0XHRcdGF1dGhDb2RlOiBjb2RlXG5cdFx0XHRcdGNsaWVudElkOiBjbGllbnRJZFxuXHRcdFx0XHR1c2VySWQ6IHVzZXIuaWRcblx0XHRcdFx0ZXhwaXJlczogZXhwaXJlc1xuXG5cdFx0XHRjYWxsYmFjayBudWxsLCBjb2RlSWRcblx0XHRjYXRjaCBlXG5cdFx0XHRjYWxsYmFjayBlXG5cblxuXHRzYXZlUmVmcmVzaFRva2VuOiBNZXRlb3IuYmluZEVudmlyb25tZW50ICh0b2tlbiwgY2xpZW50SWQsIGV4cGlyZXMsIHVzZXIsIGNhbGxiYWNrKSAtPlxuXHRcdGlmIGRlYnVnIGlzIHRydWVcblx0XHRcdGNvbnNvbGUubG9nICdbT0F1dGgyU2VydmVyXScsICdpbiBzYXZlUmVmcmVzaFRva2VuICh0b2tlbjonLCB0b2tlbiwgJywgY2xpZW50SWQ6JywgY2xpZW50SWQsICcsIHVzZXI6JywgdXNlciwgJywgZXhwaXJlczonLCBleHBpcmVzLCAnKSdcblxuXHRcdHRyeVxuXHRcdFx0dG9rZW5JZCA9IFJlZnJlc2hUb2tlbnMuaW5zZXJ0XG5cdFx0XHRcdHJlZnJlc2hUb2tlbjogdG9rZW5cblx0XHRcdFx0Y2xpZW50SWQ6IGNsaWVudElkXG5cdFx0XHRcdHVzZXJJZDogdXNlci5pZFxuXHRcdFx0XHRleHBpcmVzOiBleHBpcmVzXG5cblx0XHRcdFx0Y2FsbGJhY2sgbnVsbCwgdG9rZW5JZFxuXHRcdGNhdGNoIGVcblx0XHRcdGNhbGxiYWNrIGVcblxuXG5cdGdldFJlZnJlc2hUb2tlbjogTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCAocmVmcmVzaFRva2VuLCBjYWxsYmFjaykgLT5cblx0XHRpZiBkZWJ1ZyBpcyB0cnVlXG5cdFx0XHRjb25zb2xlLmxvZyAnW09BdXRoMlNlcnZlcl0nLCAnaW4gZ2V0UmVmcmVzaFRva2VuIChyZWZyZXNoVG9rZW46ICcgKyByZWZyZXNoVG9rZW4gKyAnKSdcblxuXHRcdHRyeVxuXHRcdFx0dG9rZW4gPSBSZWZyZXNoVG9rZW5zLmZpbmRPbmUgcmVmcmVzaFRva2VuOiByZWZyZXNoVG9rZW5cblx0XHRcdGNhbGxiYWNrIG51bGwsIHRva2VuXG5cdFx0Y2F0Y2ggZVxuXHRcdFx0Y2FsbGJhY2sgZVxuIiwib2F1dGhzZXJ2ZXIgPSBOcG0ucmVxdWlyZSgnb2F1dGgyLXNlcnZlcicpXG5leHByZXNzID0gTnBtLnJlcXVpcmUoJ2V4cHJlc3MnKVxuXG4jIFdlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMudXNlIGFwcFxuIyBKc29uUm91dGVzLk1pZGRsZXdhcmUudXNlIGFwcFxuXG5cbmNsYXNzIE9BdXRoMlNlcnZlclxuXHRjb25zdHJ1Y3RvcjogKEBjb25maWc9e30pIC0+XG5cdFx0QGFwcCA9IGV4cHJlc3MoKVxuXG5cdFx0QHJvdXRlcyA9IGV4cHJlc3MoKVxuXG5cdFx0QG1vZGVsID0gbmV3IE1vZGVsKEBjb25maWcpXG5cblx0XHRAb2F1dGggPSBvYXV0aHNlcnZlclxuXHRcdFx0bW9kZWw6IEBtb2RlbFxuXHRcdFx0Z3JhbnRzOiBbJ2F1dGhvcml6YXRpb25fY29kZScsICdyZWZyZXNoX3Rva2VuJ11cblx0XHRcdGRlYnVnOiBAY29uZmlnLmRlYnVnXG5cblx0XHRAcHVibGlzaEF1aG9yaXplZENsaWVudHMoKVxuXHRcdEBpbml0Um91dGVzKClcblxuXHRcdHJldHVybiBAXG5cblxuXHRwdWJsaXNoQXVob3JpemVkQ2xpZW50czogLT5cblx0XHRNZXRlb3IucHVibGlzaCAnYXV0aG9yaXplZE9BdXRoJywgLT5cblx0XHRcdFx0aWYgbm90IEB1c2VySWQ/XG5cdFx0XHRcdFx0cmV0dXJuIEByZWFkeSgpXG5cblx0XHRcdFx0cmV0dXJuIE1ldGVvci51c2Vycy5maW5kXG5cdFx0XHRcdFx0X2lkOiBAdXNlcklkXG5cdFx0XHRcdCxcblx0XHRcdFx0XHRmaWVsZHM6XG5cdFx0XHRcdFx0XHQnb2F1dGguYXV0aG9yaXplZENsaWVudHMnOiAxXG5cblx0XHRcdFx0cmV0dXJuIHVzZXI/XG5cblxuXHRpbml0Um91dGVzOiAtPlxuXHRcdHNlbGYgPSBAXG5cdFx0ZGVidWdNaWRkbGV3YXJlID0gKHJlcSwgcmVzLCBuZXh0KSAtPlxuXHRcdFx0aWYgc2VsZi5jb25maWcuZGVidWcgaXMgdHJ1ZVxuXHRcdFx0XHRjb25zb2xlLmxvZyAnW09BdXRoMlNlcnZlcl0nLCByZXEubWV0aG9kLCByZXEudXJsXG5cdFx0XHRuZXh0KClcblxuXHRcdCMgVHJhbnNmb3JtcyByZXF1ZXN0cyB3aGljaCBhcmUgUE9TVCBhbmQgYXJlbid0IFwieC13d3ctZm9ybS11cmxlbmNvZGVkXCIgY29udGVudCB0eXBlXG5cdFx0IyBhbmQgdGhleSBwYXNzIHRoZSByZXF1aXJlZCBpbmZvcm1hdGlvbiBhcyBxdWVyeSBzdHJpbmdzXG5cdFx0dHJhbnNmb3JtUmVxdWVzdHNOb3RVc2luZ0Zvcm1VcmxlbmNvZGVkVHlwZSA9IChyZXEsIHJlcywgbmV4dCkgLT5cblx0XHRcdGlmIG5vdCByZXEuaXMoJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpIGFuZCByZXEubWV0aG9kIGlzICdQT1NUJ1xuXHRcdFx0XHRpZiBzZWxmLmNvbmZpZy5kZWJ1ZyBpcyB0cnVlXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cgJ1tPQXV0aDJTZXJ2ZXJdJywgJ1RyYW5zZm9ybWluZyBhIHJlcXVlc3QgdG8gZm9ybS11cmxlbmNvZGVkIHdpdGggdGhlIHF1ZXJ5IGdvaW5nIHRvIHRoZSBib2R5Lidcblx0XHRcdFx0cmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddID0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcblx0XHRcdFx0cmVxLmJvZHkgPSBPYmplY3QuYXNzaWduIHt9LCByZXEuYm9keSwgcmVxLnF1ZXJ5XG5cdFx0XHRuZXh0KClcblxuXHRcdEBhcHAuYWxsICcvb2F1dGgvdG9rZW4nLCBkZWJ1Z01pZGRsZXdhcmUsIHRyYW5zZm9ybVJlcXVlc3RzTm90VXNpbmdGb3JtVXJsZW5jb2RlZFR5cGUsIEBvYXV0aC5ncmFudCgpXG5cblx0XHRAYXBwLmdldCAnL29hdXRoL2F1dGhvcml6ZScsIGRlYnVnTWlkZGxld2FyZSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCAocmVxLCByZXMsIG5leHQpIC0+XG5cdFx0XHRjbGllbnQgPSBzZWxmLm1vZGVsLkNsaWVudHMuZmluZE9uZSh7IGFjdGl2ZTogdHJ1ZSwgY2xpZW50SWQ6IHJlcS5xdWVyeS5jbGllbnRfaWQgfSlcblx0XHRcdGlmIG5vdCBjbGllbnQ/XG5cdFx0XHRcdHJldHVybiByZXMucmVkaXJlY3QgJy9vYXV0aC9lcnJvci80MDQnXG5cblx0XHRcdGlmIGNsaWVudC5yZWRpcmVjdFVyaSBpc250IHJlcS5xdWVyeS5yZWRpcmVjdF91cmlcblx0XHRcdFx0cmV0dXJuIHJlcy5yZWRpcmVjdCAnL29hdXRoL2Vycm9yL2ludmFsaWRfcmVkaXJlY3RfdXJpJ1xuXG5cdFx0XHRuZXh0KClcblxuXHRcdEBhcHAucG9zdCAnL29hdXRoL2F1dGhvcml6ZScsIGRlYnVnTWlkZGxld2FyZSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCAocmVxLCByZXMsIG5leHQpIC0+XG5cdFx0XHRpZiBub3QgcmVxLmJvZHkudG9rZW4/XG5cdFx0XHRcdHJldHVybiByZXMuc2VuZFN0YXR1cyg0MDEpLnNlbmQoJ05vIHRva2VuJylcblxuXHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lXG5cdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nOiBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4gcmVxLmJvZHkudG9rZW5cblxuXHRcdFx0aWYgbm90IHVzZXI/XG5cdFx0XHRcdHJldHVybiByZXMuc2VuZFN0YXR1cyg0MDEpLnNlbmQoJ0ludmFsaWQgdG9rZW4nKVxuXG5cdFx0XHRyZXEudXNlciA9XG5cdFx0XHRcdGlkOiB1c2VyLl9pZFxuXG5cdFx0XHRuZXh0KClcblxuXG5cdFx0QGFwcC5wb3N0ICcvb2F1dGgvYXV0aG9yaXplJywgZGVidWdNaWRkbGV3YXJlLCBAb2F1dGguYXV0aENvZGVHcmFudCAocmVxLCBuZXh0KSAtPlxuXHRcdFx0aWYgcmVxLmJvZHkuYWxsb3cgaXMgJ3llcydcblx0XHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSByZXEudXNlci5pZCwgeyRhZGRUb1NldDogeydvYXV0aC5hdXRob3JpemVkQ2xpZW50cyc6IEBjbGllbnRJZH19XG5cblx0XHRcdG5leHQobnVsbCwgcmVxLmJvZHkuYWxsb3cgaXMgJ3llcycsIHJlcS51c2VyKVxuXG5cdFx0QGFwcC51c2UgQHJvdXRlc1xuXG5cdFx0QGFwcC5hbGwgJy9vYXV0aC8qJywgQG9hdXRoLmVycm9ySGFuZGxlcigpXG4iXX0=
