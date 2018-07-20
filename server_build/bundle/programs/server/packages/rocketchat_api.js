(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Restivus = Package['nimble:restivus'].Restivus;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var result, endpoints, options, routes;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:api":{"server":{"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/api.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('API', {});

class API extends Restivus {
  constructor(properties) {
    super(properties);
    this.authMethods = [];
    this.fieldSeparator = '.';
    this.defaultFieldsToExclude = {
      joinCode: 0,
      members: 0,
      importIds: 0
    };
    this.limitedUserFieldsToExclude = {
      avatarOrigin: 0,
      emails: 0,
      phone: 0,
      statusConnection: 0,
      createdAt: 0,
      lastLogin: 0,
      services: 0,
      requirePasswordChange: 0,
      requirePasswordChangeReason: 0,
      roles: 0,
      statusDefault: 0,
      _updatedAt: 0,
      customFields: 0,
      settings: 0
    };
    this.limitedUserFieldsToExcludeIfIsPrivilegedUser = {
      services: 0
    };

    this._config.defaultOptionsEndpoint = function _defaultOptionsEndpoint() {
      if (this.request.method === 'OPTIONS' && this.request.headers['access-control-request-method']) {
        if (RocketChat.settings.get('API_Enable_CORS') === true) {
          this.response.writeHead(200, {
            'Access-Control-Allow-Origin': RocketChat.settings.get('API_CORS_Origin'),
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token'
          });
        } else {
          this.response.writeHead(405);
          this.response.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
        }
      } else {
        this.response.writeHead(404);
      }

      this.done();
    };
  }

  hasHelperMethods() {
    return RocketChat.API.helperMethods.size !== 0;
  }

  getHelperMethods() {
    return RocketChat.API.helperMethods;
  }

  getHelperMethod(name) {
    return RocketChat.API.helperMethods.get(name);
  }

  addAuthMethod(method) {
    this.authMethods.push(method);
  }

  success(result = {}) {
    if (_.isObject(result)) {
      result.success = true;
    }

    result = {
      statusCode: 200,
      body: result
    };
    logger.debug('Success', result);
    return result;
  }

  failure(result, errorType, stack) {
    if (_.isObject(result)) {
      result.success = false;
    } else {
      result = {
        success: false,
        error: result,
        stack
      };

      if (errorType) {
        result.errorType = errorType;
      }
    }

    result = {
      statusCode: 400,
      body: result
    };
    logger.debug('Failure', result);
    return result;
  }

  notFound(msg) {
    return {
      statusCode: 404,
      body: {
        success: false,
        error: msg ? msg : 'Resource not found'
      }
    };
  }

  unauthorized(msg) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: msg ? msg : 'unauthorized'
      }
    };
  }

  addRoute(routes, options, endpoints) {
    //Note: required if the developer didn't provide options
    if (typeof endpoints === 'undefined') {
      endpoints = options;
      options = {};
    } //Allow for more than one route using the same option and endpoints


    if (!_.isArray(routes)) {
      routes = [routes];
    }

    const version = this._config.version;
    routes.forEach(route => {
      //Note: This is required due to Restivus calling `addRoute` in the constructor of itself
      Object.keys(endpoints).forEach(method => {
        if (typeof endpoints[method] === 'function') {
          endpoints[method] = {
            action: endpoints[method]
          };
        } //Add a try/catch for each endpoint


        const originalAction = endpoints[method].action;

        endpoints[method].action = function _internalRouteActionHandler() {
          const rocketchatRestApiEnd = RocketChat.metrics.rocketchatRestApi.startTimer({
            method,
            version,
            user_agent: this.request.headers['user-agent'],
            entrypoint: route
          });
          logger.debug(`${this.request.method.toUpperCase()}: ${this.request.url}`);
          let result;

          try {
            result = originalAction.apply(this);
          } catch (e) {
            logger.debug(`${method} ${route} threw an error:`, e.stack);
            result = RocketChat.API.v1.failure(e.message, e.error);
          }

          result = result || RocketChat.API.v1.success();
          rocketchatRestApiEnd({
            status: result.statusCode
          });
          return result;
        };

        if (this.hasHelperMethods()) {
          for (const [name, helperMethod] of this.getHelperMethods()) {
            endpoints[method][name] = helperMethod;
          }
        } //Allow the endpoints to make usage of the logger which respects the user's settings


        endpoints[method].logger = logger;
      });
      super.addRoute(route, options, endpoints);
    });
  }

  _initAuth() {
    const loginCompatibility = bodyParams => {
      // Grab the username or email that the user is logging in with
      const {
        user,
        username,
        email,
        password,
        code
      } = bodyParams;

      if (password == null) {
        return bodyParams;
      }

      if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
        return bodyParams;
      }

      const auth = {
        password
      };

      if (typeof user === 'string') {
        auth.user = user.includes('@') ? {
          email: user
        } : {
          username: user
        };
      } else if (username) {
        auth.user = {
          username
        };
      } else if (email) {
        auth.user = {
          email
        };
      }

      if (auth.user == null) {
        return bodyParams;
      }

      if (auth.password.hashed) {
        auth.password = {
          digest: auth.password,
          algorithm: 'sha-256'
        };
      }

      if (code) {
        return {
          totp: {
            code,
            login: auth
          }
        };
      }

      return auth;
    };

    const self = this;
    this.addRoute('login', {
      authRequired: false
    }, {
      post() {
        const args = loginCompatibility(this.bodyParams);
        const getUserInfo = self.getHelperMethod('getUserInfo');
        const invocation = new DDPCommon.MethodInvocation({
          connection: {
            close() {}

          }
        });
        let auth;

        try {
          auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('login', args));
        } catch (error) {
          let e = error;

          if (error.reason === 'User not found') {
            e = {
              error: 'Unauthorized',
              reason: 'Unauthorized'
            };
          }

          return {
            statusCode: 401,
            body: {
              status: 'error',
              error: e.error,
              message: e.reason || e.message
            }
          };
        }

        this.user = Meteor.users.findOne({
          _id: auth.id
        });
        this.userId = this.user._id; // Remove tokenExpires to keep the old behavior

        Meteor.users.update({
          _id: this.user._id,
          'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(auth.token)
        }, {
          $unset: {
            'services.resume.loginTokens.$.when': 1
          }
        });
        const response = {
          status: 'success',
          data: {
            userId: this.userId,
            authToken: auth.token,
            me: getUserInfo(this.user)
          }
        };

        const extraData = self._config.onLoggedIn && self._config.onLoggedIn.call(this);

        if (extraData != null) {
          _.extend(response.data, {
            extra: extraData
          });
        }

        return response;
      }

    });

    const logout = function () {
      // Remove the given auth token from the user's account
      const authToken = this.request.headers['x-auth-token'];

      const hashedToken = Accounts._hashLoginToken(authToken);

      const tokenLocation = self._config.auth.token;
      const index = tokenLocation.lastIndexOf('.');
      const tokenPath = tokenLocation.substring(0, index);
      const tokenFieldName = tokenLocation.substring(index + 1);
      const tokenToRemove = {};
      tokenToRemove[tokenFieldName] = hashedToken;
      const tokenRemovalQuery = {};
      tokenRemovalQuery[tokenPath] = tokenToRemove;
      Meteor.users.update(this.user._id, {
        $pull: tokenRemovalQuery
      });
      const response = {
        status: 'success',
        data: {
          message: 'You\'ve been logged out!'
        }
      }; // Call the logout hook with the authenticated user attached

      const extraData = self._config.onLoggedOut && self._config.onLoggedOut.call(this);

      if (extraData != null) {
        _.extend(response.data, {
          extra: extraData
        });
      }

      return response;
    };
    /*
    	Add a logout endpoint to the API
    	After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
    	adding hook).
    */


    return this.addRoute('logout', {
      authRequired: true
    }, {
      get() {
        console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
        console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
        return logout.call(this);
      },

      post: logout
    });
  }

}

const getUserAuth = function _getUserAuth() {
  const invalidResults = [undefined, null, false];
  return {
    token: 'services.resume.loginTokens.hashedToken',

    user() {
      if (this.bodyParams && this.bodyParams.payload) {
        this.bodyParams = JSON.parse(this.bodyParams.payload);
      }

      for (let i = 0; i < RocketChat.API.v1.authMethods.length; i++) {
        const method = RocketChat.API.v1.authMethods[i];

        if (typeof method === 'function') {
          const result = method.apply(this, arguments);

          if (!invalidResults.includes(result)) {
            return result;
          }
        }
      }

      let token;

      if (this.request.headers['x-auth-token']) {
        token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
      }

      return {
        userId: this.request.headers['x-user-id'],
        token
      };
    }

  };
};

RocketChat.API = {
  helperMethods: new Map(),
  getUserAuth,
  ApiClass: API
};

const createApi = function _createApi(enableCors) {
  if (!RocketChat.API.v1 || RocketChat.API.v1._config.enableCors !== enableCors) {
    RocketChat.API.v1 = new API({
      version: 'v1',
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }

  if (!RocketChat.API.default || RocketChat.API.default._config.enableCors !== enableCors) {
    RocketChat.API.default = new API({
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }
}; // register the API to be re-created once the CORS-setting changes.


RocketChat.settings.get('API_Enable_CORS', (key, value) => {
  createApi(value);
}); // also create the API immediately

createApi(!!RocketChat.settings.get('API_Enable_CORS'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/settings.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('General', function () {
  this.section('REST API', function () {
    this.add('API_Upper_Count_Limit', 100, {
      type: 'int',
      public: false
    });
    this.add('API_Default_Count', 50, {
      type: 'int',
      public: false
    });
    this.add('API_Allow_Infinite_Count', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Direct_Message_History_EndPoint', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Shields', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Shield_Types', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_Shields',
        value: true
      }
    });
    this.add('API_Enable_CORS', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_CORS_Origin', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_CORS',
        value: true
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"requestParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/requestParams.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('requestParams', function _requestParams() {
  return ['POST', 'PUT'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPaginationItems.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getPaginationItems.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
RocketChat.API.helperMethods.set('getPaginationItems', function _getPaginationItems() {
  const hardUpperLimit = RocketChat.settings.get('API_Upper_Count_Limit') <= 0 ? 100 : RocketChat.settings.get('API_Upper_Count_Limit');
  const defaultCount = RocketChat.settings.get('API_Default_Count') <= 0 ? 50 : RocketChat.settings.get('API_Default_Count');
  const offset = this.queryParams.offset ? parseInt(this.queryParams.offset) : 0;
  let count = defaultCount; // Ensure count is an appropiate amount

  if (typeof this.queryParams.count !== 'undefined') {
    count = parseInt(this.queryParams.count);
  } else {
    count = defaultCount;
  }

  if (count > hardUpperLimit) {
    count = hardUpperLimit;
  }

  if (count === 0 && !RocketChat.settings.get('API_Allow_Infinite_Count')) {
    count = defaultCount;
  }

  return {
    offset,
    count
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getUserFromParams.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//Convenience method, almost need to turn it into a middleware of sorts
RocketChat.API.helperMethods.set('getUserFromParams', function _getUserFromParams() {
  const doesntExist = {
    _doesntExist: true
  };
  let user;
  const params = this.requestParams();

  if (params.userId && params.userId.trim()) {
    user = RocketChat.models.Users.findOneById(params.userId) || doesntExist;
  } else if (params.username && params.username.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.username) || doesntExist;
  } else if (params.user && params.user.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.user) || doesntExist;
  } else {
    throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
  }

  if (user._doesntExist) {
    throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getUserInfo.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const getInfoFromUserObject = user => {
  const {
    _id,
    name,
    emails,
    status,
    statusConnection,
    username,
    utcOffset,
    active,
    language,
    roles,
    settings
  } = user;
  return {
    _id,
    name,
    emails,
    status,
    statusConnection,
    username,
    utcOffset,
    active,
    language,
    roles,
    settings
  };
};

RocketChat.API.helperMethods.set('getUserInfo', function _getUserInfo(user) {
  const me = getInfoFromUserObject(user);

  const isVerifiedEmail = () => {
    if (me && me.emails && Array.isArray(me.emails)) {
      return me.emails.find(email => email.verified);
    }

    return false;
  };

  const getUserPreferences = () => {
    const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
    const allDefaultUserSettings = RocketChat.settings.get(new RegExp(`^${defaultUserSettingPrefix}.*$`));
    return allDefaultUserSettings.reduce((accumulator, setting) => {
      const settingWithoutPrefix = setting.key.replace(defaultUserSettingPrefix, ' ').trim();
      accumulator[settingWithoutPrefix] = RocketChat.getUserPreference(user, settingWithoutPrefix);
      return accumulator;
    }, {});
  };

  const verifiedEmail = isVerifiedEmail();
  me.email = verifiedEmail ? verifiedEmail.address : undefined;
  me.settings = {
    preferences: getUserPreferences()
  };
  return me;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/isUserFromParams.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('isUserFromParams', function _isUserFromParams() {
  const params = this.requestParams();
  return !params.userId && !params.username && !params.user || params.userId && this.userId === params.userId || params.username && this.user.username === params.username || params.user && this.user.username === params.user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parseJsonQuery.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/parseJsonQuery.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('parseJsonQuery', function _parseJsonQuery() {
  let sort;

  if (this.queryParams.sort) {
    try {
      sort = JSON.parse(this.queryParams.sort);
    } catch (e) {
      this.logger.warn(`Invalid sort parameter provided "${this.queryParams.sort}":`, e);
      throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: "${this.queryParams.sort}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  }

  let fields;

  if (this.queryParams.fields) {
    try {
      fields = JSON.parse(this.queryParams.fields);
    } catch (e) {
      this.logger.warn(`Invalid fields parameter provided "${this.queryParams.fields}":`, e);
      throw new Meteor.Error('error-invalid-fields', `Invalid fields parameter provided: "${this.queryParams.fields}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user's selected fields only contains ones which their role allows


  if (typeof fields === 'object') {
    let nonSelectableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (this.request.route.includes('/v1/users.')) {
      const getFields = () => Object.keys(RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') ? RocketChat.API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser : RocketChat.API.v1.limitedUserFieldsToExclude);

      nonSelectableFields = nonSelectableFields.concat(getFields());
    }

    Object.keys(fields).forEach(k => {
      if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete fields[k];
      }
    });
  } // Limit the fields by default


  fields = Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude);

  if (this.request.route.includes('/v1/users.')) {
    if (RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info')) {
      fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser);
    } else {
      fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExclude);
    }
  }

  let query;

  if (this.queryParams.query) {
    try {
      query = JSON.parse(this.queryParams.query);
    } catch (e) {
      this.logger.warn(`Invalid query parameter provided "${this.queryParams.query}":`, e);
      throw new Meteor.Error('error-invalid-query', `Invalid query parameter provided: "${this.queryParams.query}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user has permission to query the fields they are


  if (typeof query === 'object') {
    let nonQueryableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (this.request.route.includes('/v1/users.')) {
      if (RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info')) {
        nonQueryableFields = nonQueryableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExcludeIfIsPrivilegedUser));
      } else {
        nonQueryableFields = nonQueryableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
      }
    }

    Object.keys(query).forEach(k => {
      if (nonQueryableFields.includes(k) || nonQueryableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete query[k];
      }
    });
  }

  return {
    sort,
    fields,
    query
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deprecationWarning.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/deprecationWarning.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

RocketChat.API.helperMethods.set('deprecationWarning', function _deprecationWarning({
  endpoint,
  versionWillBeRemove,
  response
}) {
  const warningMessage = `The endpoint "${endpoint}" is deprecated and will be removed after version ${versionWillBeRemove}`;
  console.warn(warningMessage);

  if (process.env.NODE_ENV === 'development') {
    return (0, _objectSpread2.default)({
      warning: warningMessage
    }, response);
  }

  return response;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getLoggedInUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getLoggedInUser.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
  let user;

  if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
    user = RocketChat.models.Users.findOne({
      '_id': this.request.headers['x-user-id'],
      'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token'])
    });
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertUserObject.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/insertUserObject.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('insertUserObject', function _addUserToObject({
  object,
  userId
}) {
  const user = RocketChat.models.Users.findOneById(userId);
  object.user = {};

  if (user) {
    object.user = {
      _id: userId,
      username: user.username,
      name: user.name
    };
  }

  return object;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"default":{"info.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/default/info.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.default.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      version: RocketChat.Info.version
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"v1":{"channels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/channels.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findChannelByIdOrName({
  params,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = (0, _objectSpread2.default)({}, RocketChat.API.v1.defaultFieldsToExclude);
  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room || room.t !== 'c') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('channels.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult._id, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
/**
 DEPRECATED
 // TODO: Remove this after three versions have been released. That means at 0.67 this should be gone.
 **/

RocketChat.API.v1.addRoute('channels.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanChannelHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success(this.deprecationWarning({
      endpoint: 'channels.cleanHistory',
      versionWillBeRemove: 'v0.67'
    }));
  }

});
RocketChat.API.v1.addRoute('channels.close', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}.`);
    }

    if (!sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.counters', {
  authRequired: true
}, {
  get() {
    const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
    const userId = this.requestParams().userId;
    let user = this.userId;
    let unreads = null;
    let userMentions = null;
    let unreadsFrom = null;
    let joined = false;
    let msgs = null;
    let latest = null;
    let members = null;

    if (userId) {
      if (!access) {
        return RocketChat.API.v1.unauthorized();
      }

      user = userId;
    }

    const room = findChannelByIdOrName({
      params: this.requestParams(),
      returnUsernames: true
    });
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user);
    const lm = room.lm ? room.lm : room._updatedAt;

    if (typeof subscription !== 'undefined' && subscription.open) {
      if (subscription.ls) {
        unreads = RocketChat.models.Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls, lm);
        unreadsFrom = subscription.ls;
      }

      userMentions = subscription.userMentions;
      joined = true;
    }

    if (access || joined) {
      msgs = room.msgs;
      latest = lm;
      members = room.usersCount;
    }

    return RocketChat.API.v1.success({
      joined,
      members,
      unreads,
      unreadsFrom,
      msgs,
      latest,
      userMentions
    });
  }

}); // Channel -> create

function createChannelValidator(params) {
  if (!RocketChat.authz.hasPermission(params.user.value, 'create-c')) {
    throw new Error('unauthorized');
  }

  if (!params.name || !params.name.value) {
    throw new Error(`Param "${params.name.key}" is required`);
  }

  if (params.members && params.members.value && !_.isArray(params.members.value)) {
    throw new Error(`Param "${params.members.key}" must be an array if provided`);
  }

  if (params.customFields && params.customFields.value && !(typeof params.customFields.value === 'object')) {
    throw new Error(`Param "${params.customFields.key}" must be an object if provided`);
  }
}

function createChannel(userId, params) {
  let readOnly = false;

  if (typeof params.readOnly !== 'undefined') {
    readOnly = params.readOnly;
  }

  let id;
  Meteor.runAsUser(userId, () => {
    id = Meteor.call('createChannel', params.name, params.members ? params.members : [], readOnly, params.customFields);
  });
  return {
    channel: RocketChat.models.Rooms.findOneById(id.rid, {
      fields: RocketChat.API.v1.defaultFieldsToExclude
    })
  };
}

RocketChat.API.channels = {};
RocketChat.API.channels.create = {
  validate: createChannelValidator,
  execute: createChannel
};
RocketChat.API.v1.addRoute('channels.create', {
  authRequired: true
}, {
  post() {
    const userId = this.userId;
    const bodyParams = this.bodyParams;
    let error;

    try {
      RocketChat.API.channels.create.validate({
        user: {
          value: userId
        },
        name: {
          value: bodyParams.name,
          key: 'name'
        },
        members: {
          value: bodyParams.members,
          key: 'members'
        }
      });
    } catch (e) {
      if (e.message === 'unauthorized') {
        error = RocketChat.API.v1.unauthorized();
      } else {
        error = RocketChat.API.v1.failure(e.message);
      }
    }

    if (error) {
      return error;
    }

    return RocketChat.API.v1.success(RocketChat.API.channels.create.execute(userId, bodyParams));
  }

});
RocketChat.API.v1.addRoute('channels.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: findResult
    });
  }

});
RocketChat.API.v1.addRoute('channels.files', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('canAccessRoom', findResult._id, this.userId);
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let includeAllPublicChannels = true;

    if (typeof this.queryParams.includeAllPublicChannels !== 'undefined') {
      includeAllPublicChannels = this.queryParams.includeAllPublicChannels === 'true';
    }

    let ourQuery = {
      channel: `#${findResult.name}`
    };

    if (includeAllPublicChannels) {
      ourQuery.channel = {
        $in: [ourQuery.channel, 'all_public_channels']
      };
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    ourQuery = Object.assign({}, query, ourQuery);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.history', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('channels.info', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.invite', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addUserToRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.join', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('joinRoom', findResult._id, this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.list', {
  authRequired: true
}, {
  get: {
    //This is defined as such only to provide an example of how the routes can be defined :X
    action() {
      const {
        offset,
        count
      } = this.getPaginationItems();
      const {
        sort,
        fields,
        query
      } = this.parseJsonQuery();
      const hasPermissionToSeeAllPublicChannels = RocketChat.authz.hasPermission(this.userId, 'view-c-room');
      const ourQuery = (0, _objectSpread2.default)({}, query, {
        t: 'c'
      });

      if (!hasPermissionToSeeAllPublicChannels) {
        if (!RocketChat.authz.hasPermission(this.userId, 'view-joined-room')) {
          return RocketChat.API.v1.unauthorized();
        }

        const roomIds = RocketChat.models.Subscriptions.findByUserIdAndType(this.userId, 'c', {
          fields: {
            rid: 1
          }
        }).fetch().map(s => s.rid);
        ourQuery._id = {
          $in: roomIds
        };
      }

      const cursor = RocketChat.models.Rooms.find(ourQuery, {
        sort: sort ? sort : {
          name: 1
        },
        skip: offset,
        limit: count,
        fields
      });
      const total = cursor.count();
      const rooms = cursor.fetch();
      return RocketChat.API.v1.success({
        channels: rooms,
        count: rooms.length,
        offset,
        total
      });
    }

  }
});
RocketChat.API.v1.addRoute('channels.list.joined', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields
    } = this.parseJsonQuery(); // TODO: CACHE: Add Breacking notice since we removed the query param

    const cursor = RocketChat.models.Rooms.findBySubscriptionTypeAndUserId('c', this.userId, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    const totalCount = cursor.count();
    const rooms = cursor.fetch();
    return RocketChat.API.v1.success({
      channels: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('channels.members', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    if (findResult.broadcast && !RocketChat.authz.hasPermission(this.userId, 'view-broadcast-member-list')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort = {}
    } = this.parseJsonQuery();
    const subscriptions = RocketChat.models.Subscriptions.findByRoomId(findResult._id, {
      fields: {
        'u._id': 1
      },
      sort: {
        'u.username': sort.username != null ? sort.username : 1
      },
      skip: offset,
      limit: count
    });
    const total = subscriptions.count();
    const members = subscriptions.fetch().map(s => s.u && s.u._id);
    const users = RocketChat.models.Users.find({
      _id: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: {
        username: sort.username != null ? sort.username : 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: users.length,
      offset,
      total
    });
  }

});
RocketChat.API.v1.addRoute('channels.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult._id
    }); //Special check for the permissions

    if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId, {
      fields: {
        _id: 1
      }
    })) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const cursor = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    });
    const total = cursor.count();
    const messages = cursor.fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total
    });
  }

}); // TODO: CACHE: I dont like this method( functionality and how we implemented ) its very expensive
// TODO check if this code is better or not
// RocketChat.API.v1.addRoute('channels.online', { authRequired: true }, {
// 	get() {
// 		const { query } = this.parseJsonQuery();
// 		const ourQuery = Object.assign({}, query, { t: 'c' });
// 		const room = RocketChat.models.Rooms.findOne(ourQuery);
// 		if (room == null) {
// 			return RocketChat.API.v1.failure('Channel does not exists');
// 		}
// 		const ids = RocketChat.models.Subscriptions.find({ rid: room._id }, { fields: { 'u._id': 1 } }).fetch().map(sub => sub.u._id);
// 		const online = RocketChat.models.Users.find({
// 			username: { $exists: 1 },
// 			_id: { $in: ids },
// 			status: { $in: ['online', 'away', 'busy'] }
// 		}, {
// 			fields: { username: 1 }
// 		}).fetch();
// 		return RocketChat.API.v1.success({
// 			online
// 		});
// 	}
// });

RocketChat.API.v1.addRoute('channels.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'c'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Channel does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id, {
        fields: {
          _id: 1
        }
      });

      if (subscription) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('channels.open', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
    }

    if (sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findChannelByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      }
    });

    if (findResult.name === this.bodyParams.name) {
      return RocketChat.API.v1.failure('The channel name is the same as what it would be renamed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setCustomFields', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('The bodyParam "customFields" is required with a type like object.');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomCustomFields', this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setDefault', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.default === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "default" is required', 'error-channels-setdefault-is-same');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.default === this.bodyParams.default) {
      return RocketChat.API.v1.failure('The channel default setting is the same as what it would be changed to.', 'error-channels-setdefault-missing-default-param');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'default', this.bodyParams.default.toString());
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.description) {
      return RocketChat.API.v1.failure('The channel description is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('channels.setJoinCode', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.joinCode || !this.bodyParams.joinCode.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "joinCode" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'joinCode', this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.purpose) {
      return RocketChat.API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('channels.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The channel read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.topic === this.bodyParams.topic) {
      return RocketChat.API.v1.failure('The channel topic is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('channels.setAnnouncement', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.announcement || !this.bodyParams.announcement.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "announcement" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomAnnouncement', this.bodyParams.announcement);
    });
    return RocketChat.API.v1.success({
      announcement: this.bodyParams.announcement
    });
  }

});
RocketChat.API.v1.addRoute('channels.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The channel type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    if (!findResult.archived) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is not archived`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.getAllUserMentionsByChannel', {
  authRequired: true
}, {
  get() {
    const {
      roomId
    } = this.requestParams();
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    if (!roomId) {
      return RocketChat.API.v1.failure('The request param "roomId" is required');
    }

    const mentions = Meteor.runAsUser(this.userId, () => Meteor.call('getUserMentionsByChannel', {
      roomId,
      options: {
        sort: sort ? sort : {
          ts: 1
        },
        skip: offset,
        limit: count
      }
    }));
    const allMentions = Meteor.runAsUser(this.userId, () => Meteor.call('getUserMentionsByChannel', {
      roomId,
      options: {}
    }));
    return RocketChat.API.v1.success({
      mentions,
      count: mentions.length,
      offset,
      total: allMentions.length
    });
  }

});
RocketChat.API.v1.addRoute('channels.roles', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const roles = Meteor.runAsUser(this.userId, () => Meteor.call('getRoomRoles', findResult._id));
    return RocketChat.API.v1.success({
      roles
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/rooms.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 0);

function findRoomByIdOrName({
  params,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = (0, _objectSpread2.default)({}, RocketChat.API.v1.defaultFieldsToExclude);
  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room) {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('rooms.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('rooms/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('rooms.upload/:rid', {
  authRequired: true
}, {
  post() {
    const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.userId);

    if (!room) {
      return RocketChat.API.v1.unauthorized();
    }

    const busboy = new Busboy({
      headers: this.request.headers
    });
    const files = [];
    const fields = {};
    Meteor.wrapAsync(callback => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname !== 'file') {
          return files.push(new Meteor.Error('invalid-field'));
        }

        const fileDate = [];
        file.on('data', data => fileDate.push(data));
        file.on('end', () => {
          files.push({
            fieldname,
            file,
            filename,
            encoding,
            mimetype,
            fileBuffer: Buffer.concat(fileDate)
          });
        });
      });
      busboy.on('field', (fieldname, value) => fields[fieldname] = value);
      busboy.on('finish', Meteor.bindEnvironment(() => callback()));
      this.request.pipe(busboy);
    })();

    if (files.length === 0) {
      return RocketChat.API.v1.failure('File required');
    }

    if (files.length > 1) {
      return RocketChat.API.v1.failure('Just 1 file is allowed');
    }

    const file = files[0];
    const fileStore = FileUpload.getStore('Uploads');
    const details = {
      name: file.filename,
      size: file.fileBuffer.length,
      type: file.mimetype,
      rid: this.urlParams.rid,
      userId: this.userId
    };
    Meteor.runAsUser(this.userId, () => {
      const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);
      uploadedFile.description = fields.description;
      delete fields.description;
      RocketChat.API.v1.success(Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields));
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.saveNotification', {
  authRequired: true
}, {
  post() {
    const saveNotifications = (notifications, roomId) => {
      Object.keys(notifications).map(notificationKey => {
        Meteor.runAsUser(this.userId, () => Meteor.call('saveNotificationSettings', roomId, notificationKey, notifications[notificationKey]));
      });
    };

    const {
      roomId,
      notifications
    } = this.bodyParams;

    if (!roomId) {
      return RocketChat.API.v1.failure('The \'roomId\' param is required');
    }

    if (!notifications || Object.keys(notifications).length === 0) {
      return RocketChat.API.v1.failure('The \'notifications\' param is required');
    }

    saveNotifications(notifications, roomId);
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.favorite', {
  authRequired: true
}, {
  post() {
    const {
      favorite
    } = this.bodyParams;

    if (!this.bodyParams.hasOwnProperty('favorite')) {
      return RocketChat.API.v1.failure('The \'favorite\' param is required');
    }

    const room = findRoomByIdOrName({
      params: this.bodyParams
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('toggleFavorite', room._id, favorite));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('rooms.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findRoomByIdOrName({
      params: this.bodyParams
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanRoomHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/subscriptions.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('subscriptions.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('subscriptions/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('subscriptions.getOne', {
  authRequired: true
}, {
  get() {
    const {
      roomId
    } = this.requestParams();

    if (!roomId) {
      return RocketChat.API.v1.failure('The \'roomId\' param is required');
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, this.userId);
    return RocketChat.API.v1.success({
      subscription
    });
  }

});
/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 */

RocketChat.API.v1.addRoute('subscriptions.read', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      rid: String
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('readMessages', this.bodyParams.rid));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('subscriptions.unread', {
  authRequired: true
}, {
  post() {
    const {
      roomId,
      firstUnreadMessage
    } = this.bodyParams;

    if (!roomId && firstUnreadMessage && !firstUnreadMessage._id) {
      return RocketChat.API.v1.failure('At least one of "roomId" or "firstUnreadMessage._id" params is required');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('unreadMessages', firstUnreadMessage, roomId));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/chat.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.delete', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      msgId: String,
      roomId: String,
      asUser: Match.Maybe(Boolean)
    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId, {
      fields: {
        u: 1,
        rid: 1
      }
    });

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    }

    if (this.bodyParams.asUser && msg.u._id !== this.userId && !RocketChat.authz.hasPermission(Meteor.userId(), 'force-delete-message', msg.rid)) {
      return RocketChat.API.v1.failure('Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.');
    }

    Meteor.runAsUser(this.bodyParams.asUser ? msg.u._id : this.userId, () => {
      Meteor.call('deleteMessage', {
        _id: msg._id
      });
    });
    return RocketChat.API.v1.success({
      _id: msg._id,
      ts: Date.now(),
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.syncMessages', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      lastUpdate
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!lastUpdate) {
      throw new Meteor.Error('error-lastUpdate-param-not-provided', 'The required "lastUpdate" query param is missing.');
    } else if (isNaN(Date.parse(lastUpdate))) {
      throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('messages/get', roomId, {
        lastUpdate: new Date(lastUpdate)
      });
    });

    if (!result) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      result
    });
  }

});
RocketChat.API.v1.addRoute('chat.getMessage', {
  authRequired: true
}, {
  get() {
    if (!this.queryParams.msgId) {
      return RocketChat.API.v1.failure('The "msgId" query parameter must be provided.');
    }

    let msg;
    Meteor.runAsUser(this.userId, () => {
      msg = Meteor.call('getSingleMessage', this.queryParams.msgId);
    });

    if (!msg) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.pinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    let pinnedMessage;
    Meteor.runAsUser(this.userId, () => pinnedMessage = Meteor.call('pinMessage', msg));
    return RocketChat.API.v1.success({
      message: pinnedMessage
    });
  }

});
RocketChat.API.v1.addRoute('chat.postMessage', {
  authRequired: true
}, {
  post() {
    const messageReturn = processWebhookMessage(this.bodyParams, this.user, undefined, true)[0];

    if (!messageReturn) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    return RocketChat.API.v1.success({
      ts: Date.now(),
      channel: messageReturn.channel,
      message: messageReturn.message
    });
  }

});
RocketChat.API.v1.addRoute('chat.search', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      searchText,
      limit
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!searchText) {
      throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
    }

    if (limit && (typeof limit !== 'number' || isNaN(limit) || limit <= 0)) {
      throw new Meteor.Error('error-limit-param-invalid', 'The "limit" query parameter must be a valid number and be greater than 0.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('messageSearch', searchText, roomId, limit).message.docs);
    return RocketChat.API.v1.success({
      messages: result
    });
  }

}); // The difference between `chat.postMessage` and `chat.sendMessage` is that `chat.sendMessage` allows
// for passing a value for `_id` and the other one doesn't. Also, `chat.sendMessage` only sends it to
// one channel whereas the other one allows for sending to more than one channel at a time.

RocketChat.API.v1.addRoute('chat.sendMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.message) {
      throw new Meteor.Error('error-invalid-params', 'The "message" parameter must be provided.');
    }

    let message;
    Meteor.runAsUser(this.userId, () => message = Meteor.call('sendMessage', this.bodyParams.message));
    return RocketChat.API.v1.success({
      message
    });
  }

});
RocketChat.API.v1.addRoute('chat.starMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: true
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unPinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('unpinMessage', msg));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unStarMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: false
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      roomId: String,
      msgId: String,
      text: String //Using text to be consistant with chat.postMessage

    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId); //Ensure the message exists

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    } //Permission checks are already done in the updateMessage method, so no need to duplicate them


    Meteor.runAsUser(this.userId, () => {
      Meteor.call('updateMessage', {
        _id: msg._id,
        msg: this.bodyParams.text,
        rid: msg.rid
      });
    });
    return RocketChat.API.v1.success({
      message: RocketChat.models.Messages.findOneById(msg._id)
    });
  }

});
RocketChat.API.v1.addRoute('chat.react', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    const emoji = this.bodyParams.emoji || this.bodyParams.reaction;

    if (!emoji) {
      throw new Meteor.Error('error-emoji-param-not-provided', 'The required "emoji" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('setReaction', emoji, msg._id, this.bodyParams.shouldReact));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.getMessageReadReceipts', {
  authRequired: true
}, {
  get() {
    const {
      messageId
    } = this.queryParams;

    if (!messageId) {
      return RocketChat.API.v1.failure({
        error: 'The required \'messageId\' param is missing.'
      });
    }

    try {
      const messageReadReceipts = Meteor.runAsUser(this.userId, () => Meteor.call('getReadReceipts', {
        messageId
      }));
      return RocketChat.API.v1.success({
        receipts: messageReadReceipts
      });
    } catch (error) {
      return RocketChat.API.v1.failure({
        error: error.message
      });
    }
  }

});
RocketChat.API.v1.addRoute('chat.reportMessage', {
  authRequired: true
}, {
  post() {
    const {
      messageId,
      description
    } = this.bodyParams;

    if (!messageId) {
      return RocketChat.API.v1.failure('The required "messageId" param is missing.');
    }

    if (!description) {
      return RocketChat.API.v1.failure('The required "description" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('reportMessage', messageId, description));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.ignoreUser', {
  authRequired: true
}, {
  get() {
    const {
      rid,
      userId
    } = this.queryParams;
    let {
      ignore = true
    } = this.queryParams;
    ignore = typeof ignore === 'string' ? /true|1/.test(ignore) : ignore;

    if (!rid || !rid.trim()) {
      throw new Meteor.Error('error-room-id-param-not-provided', 'The required "rid" param is missing.');
    }

    if (!userId || !userId.trim()) {
      throw new Meteor.Error('error-user-id-param-not-provided', 'The required "userId" param is missing.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('ignoreUser', {
      rid,
      userId,
      ignore
    }));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/commands.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('commands.get', {
  authRequired: true
}, {
  get() {
    const params = this.queryParams;

    if (typeof params.command !== 'string') {
      return RocketChat.API.v1.failure('The query param "command" must be provided.');
    }

    const cmd = RocketChat.slashCommands.commands[params.command.toLowerCase()];

    if (!cmd) {
      return RocketChat.API.v1.failure(`There is no command in the system by the name of: ${params.command}`);
    }

    return RocketChat.API.v1.success({
      command: cmd
    });
  }

});
RocketChat.API.v1.addRoute('commands.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let commands = Object.values(RocketChat.slashCommands.commands);

    if (query && query.command) {
      commands = commands.filter(command => command.command === query.command);
    }

    const totalCount = commands.length;
    commands = RocketChat.models.Rooms.processQueryOptionsOnResult(commands, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      commands,
      offset,
      count: commands.length,
      total: totalCount
    });
  }

}); // Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value' }

RocketChat.API.v1.addRoute('commands.run', {
  authRequired: true
}, {
  post() {
    const body = this.bodyParams;
    const user = this.getLoggedInUser();

    if (typeof body.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to run.');
    }

    if (body.params && typeof body.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof body.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where to execute this command must be provided and be a string.');
    }

    const cmd = body.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[body.command.toLowerCase()]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', body.roomId, user._id);
    const params = body.params ? body.params : '';
    let result;
    Meteor.runAsUser(user._id, () => {
      result = RocketChat.slashCommands.run(cmd, params, {
        _id: Random.id(),
        rid: body.roomId,
        msg: `/${cmd} ${params}`
      });
    });
    return RocketChat.API.v1.success({
      result
    });
  }

});
RocketChat.API.v1.addRoute('commands.preview', {
  authRequired: true
}, {
  // Expects these query params: command: 'giphy', params: 'mine', roomId: 'value'
  get() {
    const query = this.queryParams;
    const user = this.getLoggedInUser();

    if (typeof query.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to get the previews from.');
    }

    if (query.params && typeof query.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof query.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where the previews are being displayed must be provided and be a string.');
    }

    const cmd = query.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[cmd]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', query.roomId, user._id);
    const params = query.params ? query.params : '';
    let preview;
    Meteor.runAsUser(user._id, () => {
      preview = Meteor.call('getSlashCommandPreviews', {
        cmd,
        params,
        msg: {
          rid: query.roomId
        }
      });
    });
    return RocketChat.API.v1.success({
      preview
    });
  },

  // Expects a body format of: { command: 'giphy', params: 'mine', roomId: 'value', previewItem: { id: 'sadf8' type: 'image', value: 'https://dev.null/gif } }
  post() {
    const body = this.bodyParams;
    const user = this.getLoggedInUser();

    if (typeof body.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to run the preview item on.');
    }

    if (body.params && typeof body.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof body.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where the preview is being executed in must be provided and be a string.');
    }

    if (typeof body.previewItem === 'undefined') {
      return RocketChat.API.v1.failure('The preview item being executed must be provided.');
    }

    if (!body.previewItem.id || !body.previewItem.type || typeof body.previewItem.value === 'undefined') {
      return RocketChat.API.v1.failure('The preview item being executed is in the wrong format.');
    }

    const cmd = body.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[cmd]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', body.roomId, user._id);
    const params = body.params ? body.params : '';
    Meteor.runAsUser(user._id, () => {
      Meteor.call('executeSlashCommandPreview', {
        cmd,
        params,
        msg: {
          rid: body.roomId
        }
      }, body.previewItem);
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"emoji-custom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/emoji-custom.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('emoji-custom', {
  authRequired: true
}, {
  get() {
    const emojis = Meteor.call('listEmojiCustom');
    return RocketChat.API.v1.success({
      emojis
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groups.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/groups.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupByIdOrName({
  params,
  userId,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  let roomSub;

  if (params.roomId) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(params.roomId, userId);
  } else if (params.roomName) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomNameAndUserId(params.roomName, userId);
  }

  if (!roomSub || roomSub.t !== 'p') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
  }

  if (checkedArchived && roomSub.archived) {
    throw new Meteor.Error('error-room-archived', `The private group, ${roomSub.name}, is archived`);
  }

  return roomSub;
}

RocketChat.API.v1.addRoute('groups.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

}); //Archives a private group only if it wasn't

RocketChat.API.v1.addRoute('groups.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.close', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (!findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.counters', {
  authRequired: true
}, {
  get() {
    const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
    const params = this.requestParams();
    let user = this.userId;
    let room;
    let unreads = null;
    let userMentions = null;
    let unreadsFrom = null;
    let joined = false;
    let msgs = null;
    let latest = null;
    let members = null;

    if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
      throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
    }

    if (params.roomId) {
      room = RocketChat.models.Rooms.findOneById(params.roomId);
    } else if (params.roomName) {
      room = RocketChat.models.Rooms.findOneByName(params.roomName);
    }

    if (!room || room.t !== 'p') {
      throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
    }

    if (room.archived) {
      throw new Meteor.Error('error-room-archived', `The private group, ${room.name}, is archived`);
    }

    if (params.userId) {
      if (!access) {
        return RocketChat.API.v1.unauthorized();
      }

      user = params.userId;
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user);
    const lm = room.lm ? room.lm : room._updatedAt;

    if (typeof subscription !== 'undefined' && subscription.open) {
      if (subscription.ls) {
        unreads = RocketChat.models.Messages.countVisibleByRoomIdBetweenTimestampsInclusive(subscription.rid, subscription.ls, lm);
        unreadsFrom = subscription.ls;
      }

      userMentions = subscription.userMentions;
      joined = true;
    }

    if (access || joined) {
      msgs = room.msgs;
      latest = lm;
      members = room.usersCount;
    }

    return RocketChat.API.v1.success({
      joined,
      members,
      unreads,
      unreadsFrom,
      msgs,
      latest,
      userMentions
    });
  }

}); //Create Private Group

RocketChat.API.v1.addRoute('groups.create', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'create-p')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.name) {
      return RocketChat.API.v1.failure('Body param "name" is required');
    }

    if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
      return RocketChat.API.v1.failure('Body param "members" must be an array if provided');
    }

    if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('Body param "customFields" must be an object if provided');
    }

    let readOnly = false;

    if (typeof this.bodyParams.readOnly !== 'undefined') {
      readOnly = this.bodyParams.readOnly;
    }

    let id;
    Meteor.runAsUser(this.userId, () => {
      id = Meteor.call('createPrivateGroup', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : [], readOnly, this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(id.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult.rid);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.files', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.rid
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let includeAllPrivateGroups = true;

    if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
      includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
    }

    const channelsToSearch = [`#${findResult.name}`];

    if (includeAllPrivateGroups) {
      channelsToSearch.push('all_private_groups');
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      channel: {
        $in: channelsToSearch
      }
    });
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.history', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.rid,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('groups.info', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.invite', {
  authRequired: true
}, {
  post() {
    const {
      roomId = '',
      roomName = ''
    } = this.requestParams();
    const idOrName = roomId || roomName;

    if (!idOrName.trim()) {
      throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
    }

    const {
      _id: rid,
      t: type
    } = RocketChat.models.Rooms.findOneByIdOrName(idOrName) || {};

    if (!rid || type !== 'p') {
      throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
    }

    const {
      username
    } = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => Meteor.call('addUserToRoom', {
      rid,
      username
    }));
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult.rid,
        username: user.username
      });
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

}); //List Private Groups a user has access to

RocketChat.API.v1.addRoute('groups.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields
    } = this.parseJsonQuery(); // TODO: CACHE: Add Breacking notice since we removed the query param

    const cursor = RocketChat.models.Rooms.findBySubscriptionTypeAndUserId('p', this.userId, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    const totalCount = cursor.count();
    const rooms = cursor.fetch();
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.listAll', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    let rooms = RocketChat.models.Rooms.find(ourQuery).fetch();
    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.members', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const room = RocketChat.models.Rooms.findOneById(findResult.rid, {
      fields: {
        broadcast: 1
      }
    });

    if (room.broadcast && !RocketChat.authz.hasPermission(this.userId, 'view-broadcast-member-list')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort = {}
    } = this.parseJsonQuery();
    const subscriptions = RocketChat.models.Subscriptions.findByRoomId(findResult.rid, {
      fields: {
        'u._id': 1
      },
      sort: {
        'u.username': sort.username != null ? sort.username : 1
      },
      skip: offset,
      limit: count
    });
    const total = subscriptions.count();
    const members = subscriptions.fetch().map(s => s.u && s.u._id);
    const users = RocketChat.models.Users.find({
      _id: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: {
        username: sort.username != null ? sort.username : 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: users.length,
      offset,
      total
    });
  }

});
RocketChat.API.v1.addRoute('groups.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.rid
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

}); // TODO: CACHE: same as channels.online

RocketChat.API.v1.addRoute('groups.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Group does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id, {
        fields: {
          _id: 1
        }
      });

      if (subscription) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('groups.open', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      },
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setCustomFields', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.customFields || !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('The bodyParam "customFields" is required with a type like object.');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomCustomFields', this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('groups.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('groups.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The private group read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('groups.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The private group type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.roles', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const roles = Meteor.runAsUser(this.userId, () => Meteor.call('getRoomRoles', findResult.rid));
    return RocketChat.API.v1.success({
      roles
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"im.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/im.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function findDirectMessageRoom(params, user) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.username || !params.username.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
  }

  const room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
    currentUserId: user._id,
    nameOrId: params.username || params.roomId,
    type: 'd'
  });

  if (!room || room.t !== 'd') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "username" param provided does not match any dirct message');
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
  return {
    room,
    subscription
  };
}

RocketChat.API.v1.addRoute(['dm.create', 'im.create'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    return RocketChat.API.v1.success({
      room: findResult.room
    });
  }

});
RocketChat.API.v1.addRoute(['dm.close', 'im.close'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      return RocketChat.API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.room._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.counters', 'im.counters'], {
  authRequired: true
}, {
  get() {
    const access = RocketChat.authz.hasPermission(this.userId, 'view-room-administration');
    const ruserId = this.requestParams().userId;
    let user = this.userId;
    let unreads = null;
    let userMentions = null;
    let unreadsFrom = null;
    let joined = false;
    let msgs = null;
    let latest = null;
    let members = null;
    let lm = null;

    if (ruserId) {
      if (!access) {
        return RocketChat.API.v1.unauthorized();
      }

      user = ruserId;
    }

    const rs = findDirectMessageRoom(this.requestParams(), {
      '_id': user
    });
    const room = rs.room;
    const dm = rs.subscription;
    lm = room.lm ? room.lm : room._updatedAt;

    if (typeof dm !== 'undefined' && dm.open) {
      if (dm.ls && room.msgs) {
        unreads = dm.unread;
        unreadsFrom = dm.ls;
      }

      userMentions = dm.userMentions;
      joined = true;
    }

    if (access || joined) {
      msgs = room.msgs;
      latest = lm;
      members = room.usersCount;
    }

    return RocketChat.API.v1.success({
      joined,
      members,
      unreads,
      unreadsFrom,
      msgs,
      latest,
      userMentions
    });
  }

});
RocketChat.API.v1.addRoute(['dm.files', 'im.files'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    const addUserObjectToEveryObject = file => {
      if (file.userId) {
        file = this.insertUserObject({
          object: file,
          userId: file.userId
        });
      }

      return file;
    };

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files: files.map(addUserObjectToEveryObject),
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.history', 'im.history'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.room._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute(['dm.members', 'im.members'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();
    const cursor = RocketChat.models.Subscriptions.findByRoomId(findResult._id, {
      sort: {
        'u.username': sort.username != null ? sort.username : 1
      },
      skip: offset,
      limit: count
    });
    const total = cursor.count();
    const members = cursor.fetch().map(s => s.u && s.u.username);
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: {
        username: sort.username != null ? sort.username : 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages', 'im.messages'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    console.log(findResult);
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages.others', 'im.messages.others'], {
  authRequired: true
}, {
  get() {
    if (RocketChat.settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/im.messages.others'
      });
    }

    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const roomId = this.queryParams.roomId;

    if (!roomId || !roomId.trim()) {
      throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'd') {
      throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: room._id
    });
    const msgs = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages: msgs,
      offset,
      count: msgs.length,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list', 'im.list'], {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort = {
        name: 1
      },
      fields
    } = this.parseJsonQuery(); // TODO: CACHE: Add Breacking notice since we removed the query param

    const cursor = RocketChat.models.Rooms.findBySubscriptionTypeAndUserId('d', this.userId, {
      sort,
      skip: offset,
      limit: count,
      fields
    });
    const total = cursor.count();
    const rooms = cursor.fetch();
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list.everyone', 'im.list.everyone'], {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'd'
    });
    const rooms = RocketChat.models.Rooms.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: RocketChat.models.Rooms.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.open', 'im.open'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('openRoom', findResult.room._id);
      });
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.setTopic', 'im.setTopic'], {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.room._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrations.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/integrations.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('integrations.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      name: String,
      enabled: Boolean,
      username: String,
      urls: Match.Maybe([String]),
      channel: String,
      event: Match.Maybe(String),
      triggerWords: Match.Maybe([String]),
      alias: Match.Maybe(String),
      avatar: Match.Maybe(String),
      emoji: Match.Maybe(String),
      token: Match.Maybe(String),
      scriptEnabled: Boolean,
      script: Match.Maybe(String),
      targetChannel: Match.Maybe(String)
    }));
    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addOutgoingIntegration', this.bodyParams);
        });
        break;

      case 'webhook-incoming':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addIncomingIntegration', this.bodyParams);
        });
        break;

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }

    return RocketChat.API.v1.success({
      integration
    });
  }

});
RocketChat.API.v1.addRoute('integrations.history', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.queryParams.id || this.queryParams.id.trim() === '') {
      return RocketChat.API.v1.failure('Invalid integration id.');
    }

    const id = this.queryParams.id;
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      'integration._id': id
    });
    const history = RocketChat.models.IntegrationHistory.find(ourQuery, {
      sort: sort ? sort : {
        _updatedAt: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      history,
      offset,
      items: history.length,
      total: RocketChat.models.IntegrationHistory.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      offset,
      items: integrations.length,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.remove', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      target_url: Match.Maybe(String),
      integrationId: Match.Maybe(String)
    }));

    if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
      return RocketChat.API.v1.failure('An integrationId or target_url needs to be provided.');
    }

    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        if (this.bodyParams.target_url) {
          integration = RocketChat.models.Integrations.findOne({
            urls: this.bodyParams.target_url
          });
        } else if (this.bodyParams.integrationId) {
          integration = RocketChat.models.Integrations.findOne({
            _id: this.bodyParams.integrationId
          });
        }

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteOutgoingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      case 'webhook-incoming':
        integration = RocketChat.models.Integrations.findOne({
          _id: this.bodyParams.integrationId
        });

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteIncomingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"misc.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/misc.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      info: {
        'version': RocketChat.Info.version
      }
    });
  }

});
RocketChat.API.v1.addRoute('me', {
  authRequired: true
}, {
  get() {
    return RocketChat.API.v1.success(this.getUserInfo(RocketChat.models.Users.findOneById(this.userId)));
  }

});
let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute

RocketChat.API.v1.addRoute('shield.svg', {
  authRequired: false
}, {
  get() {
    const {
      type,
      channel,
      name,
      icon
    } = this.queryParams;

    if (!RocketChat.settings.get('API_Enable_Shields')) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const types = RocketChat.settings.get('API_Shield_Types');

    if (type && types !== '*' && !types.split(',').map(t => t.trim()).includes(type)) {
      throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const hideIcon = icon === 'false';

    if (hideIcon && (!name || !name.trim())) {
      return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
    }

    let text;
    let backgroundColor = '#4c1';

    switch (type) {
      case 'online':
        if (Date.now() - onlineCacheDate > cacheInvalid) {
          onlineCache = RocketChat.models.Users.findUsersNotOffline().count();
          onlineCacheDate = Date.now();
        }

        text = `${onlineCache} ${TAPi18n.__('Online')}`;
        break;

      case 'channel':
        if (!channel) {
          return RocketChat.API.v1.failure('Shield channel is required for type "channel"');
        }

        text = `#${channel}`;
        break;

      case 'user':
        const user = this.getUserFromParams(); // Respect the server's choice for using their real names or not

        if (user.name && RocketChat.settings.get('UI_Use_Real_Name')) {
          text = `${user.name}`;
        } else {
          text = `@${user.username}`;
        }

        switch (user.status) {
          case 'online':
            backgroundColor = '#1fb31f';
            break;

          case 'away':
            backgroundColor = '#dc9b01';
            break;

          case 'busy':
            backgroundColor = '#bc2031';
            break;

          case 'offline':
            backgroundColor = '#a5a1a1';
        }

        break;

      default:
        text = TAPi18n.__('Join_Chat').toUpperCase();
    }

    const iconSize = hideIcon ? 7 : 24;
    const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
    const rightSize = text.length * 6 + 20;
    const width = leftSize + rightSize;
    const height = 20;
    return {
      headers: {
        'Content-Type': 'image/svg+xml;charset=utf-8'
      },
      body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
				  <linearGradient id="b" x2="0" y2="100%">
				    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
				    <stop offset="1" stop-opacity=".1"/>
				  </linearGradient>
				  <mask id="a">
				    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
				  </mask>
				  <g mask="url(#a)">
				    <path fill="#555" d="M0 0h${leftSize}v${height}H0z"/>
				    <path fill="${backgroundColor}" d="M${leftSize} 0h${rightSize}v${height}H${leftSize}z"/>
				    <path fill="url(#b)" d="M0 0h${width}v${height}H0z"/>
				  </g>
				    ${hideIcon ? '' : '<image x="5" y="3" width="14" height="14" xlink:href="/assets/favicon.svg"/>'}
				  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${name ? `<text x="${iconSize}" y="15" fill="#010101" fill-opacity=".3">${name}</text>
				    <text x="${iconSize}" y="14">${name}</text>` : ''}
				    <text x="${leftSize + 7}" y="15" fill="#010101" fill-opacity=".3">${text}</text>
				    <text x="${leftSize + 7}" y="14">${text}</text>
				  </g>
				</svg>
			`.trim().replace(/\>[\s]+\</gm, '><')
    };
  }

});
RocketChat.API.v1.addRoute('spotlight', {
  authRequired: true
}, {
  get() {
    check(this.queryParams, {
      query: String
    });
    const {
      query
    } = this.queryParams;
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('spotlight', query));
    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('directory', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      query
    } = this.parseJsonQuery();
    const {
      text,
      type
    } = query;

    if (sort && Object.keys(sort).length > 1) {
      return RocketChat.API.v1.failure('This method support only one "sort" parameter');
    }

    const sortBy = sort ? Object.keys(sort)[0] : undefined;
    const sortDirection = sort && Object.values(sort)[0] === 1 ? 'asc' : 'desc';
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('browseChannels', {
      text,
      type,
      sortBy,
      sortDirection,
      page: offset,
      limit: count
    }));

    if (!result) {
      return RocketChat.API.v1.failure('Please verify the parameters');
    }

    return RocketChat.API.v1.success({
      result: result.results,
      count: result.results.length,
      offset,
      total: result.total
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"permissions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/permissions.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
	This API returns all permissions that exists
	on the server, with respective roles.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', {
  authRequired: true
}, {
  get() {
    const warningMessage = 'The endpoint "permissions" is deprecated and will be removed after version v0.69';
    console.warn(warningMessage);
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('permissions.list', {
  authRequired: true
}, {
  get() {
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success({
      permissions: result
    });
  }

});
RocketChat.API.v1.addRoute('permissions.update', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
      return RocketChat.API.v1.failure('Editing permissions is not allowed', 'error-edit-permissions-not-allowed');
    }

    check(this.bodyParams, {
      permissions: [Match.ObjectIncluding({
        _id: String,
        roles: [String]
      })]
    });
    let permissionNotFound = false;
    let roleNotFound = false;
    Object.keys(this.bodyParams.permissions).forEach(key => {
      const element = this.bodyParams.permissions[key];

      if (!RocketChat.models.Permissions.findOneById(element._id)) {
        permissionNotFound = true;
      }

      Object.keys(element.roles).forEach(key => {
        const subelement = element.roles[key];

        if (!RocketChat.models.Roles.findOneById(subelement)) {
          roleNotFound = true;
        }
      });
    });

    if (permissionNotFound) {
      return RocketChat.API.v1.failure('Invalid permission', 'error-invalid-permission');
    } else if (roleNotFound) {
      return RocketChat.API.v1.failure('Invalid role', 'error-invalid-role');
    }

    Object.keys(this.bodyParams.permissions).forEach(key => {
      const element = this.bodyParams.permissions[key];
      RocketChat.models.Permissions.createOrUpdate(element._id, element.roles);
    });
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success({
      permissions: result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"push.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/push.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals Push */
RocketChat.API.v1.addRoute('push.token', {
  authRequired: true
}, {
  post() {
    const {
      type,
      value,
      appName
    } = this.bodyParams;
    let {
      id
    } = this.bodyParams;

    if (id && typeof id !== 'string') {
      throw new Meteor.Error('error-id-param-not-valid', 'The required "id" body param is invalid.');
    } else {
      id = Random.id();
    }

    if (!type || type !== 'apn' && type !== 'gcm') {
      throw new Meteor.Error('error-type-param-not-valid', 'The required "type" body param is missing or invalid.');
    }

    if (!value || typeof value !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "value" body param is missing or invalid.');
    }

    if (!appName || typeof appName !== 'string') {
      throw new Meteor.Error('error-appName-param-not-valid', 'The required "appName" body param is missing or invalid.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('raix:push-update', {
      id,
      token: {
        [type]: value
      },
      appName,
      userId: this.userId
    }));
    return RocketChat.API.v1.success({
      result
    });
  },

  delete() {
    const {
      token
    } = this.bodyParams;

    if (!token || typeof token !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
    }

    const affectedRecords = Push.appCollection.remove({
      $or: [{
        'token.apn': token
      }, {
        'token.gcm': token
      }],
      userId: this.userId
    });

    if (affectedRecords === 0) {
      return RocketChat.API.v1.notFound();
    }

    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/settings.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
// settings endpoints
RocketChat.API.v1.addRoute('settings.public', {
  authRequired: false
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      },
      'public': true
    };
    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings.oauth', {
  authRequired: false
}, {
  get() {
    const mountOAuthServices = () => {
      const oAuthServicesEnabled = ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch();
      return oAuthServicesEnabled.map(service => {
        if (service.custom || ['saml', 'cas', 'wordpress'].includes(service.service)) {
          return (0, _objectSpread2.default)({}, service);
        }

        return {
          _id: service._id,
          name: service.service,
          clientId: service.appId || service.clientId || service.consumerKey,
          buttonLabelText: service.buttonLabelText || '',
          buttonColor: service.buttonColor || '',
          buttonLabelColor: service.buttonLabelColor || '',
          custom: false
        };
      });
    };

    return RocketChat.API.v1.success({
      services: mountOAuthServices()
    });
  }

});
RocketChat.API.v1.addRoute('settings', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      }
    };

    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      ourQuery.public = true;
    }

    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(_.pick(RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value'));
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'edit-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    } // allow special handling of particular setting types


    const setting = RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id);

    if (setting.type === 'action' && this.bodyParams && this.bodyParams.execute) {
      //execute the configured method
      Meteor.call(setting.value);
      return RocketChat.API.v1.success();
    }

    if (setting.type === 'color' && this.bodyParams && this.bodyParams.editor && this.bodyParams.value) {
      RocketChat.models.Settings.updateOptionsById(this.urlParams._id, {
        editor: this.bodyParams.editor
      });
      RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value);
      return RocketChat.API.v1.success();
    }

    check(this.bodyParams, {
      value: Match.Any
    });

    if (RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value)) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure();
  }

});
RocketChat.API.v1.addRoute('service.configurations', {
  authRequired: false
}, {
  get() {
    const ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
    return RocketChat.API.v1.success({
      configurations: ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/stats.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('statistics', {
  authRequired: true
}, {
  get() {
    let refresh = false;

    if (typeof this.queryParams.refresh !== 'undefined' && this.queryParams.refresh === 'true') {
      refresh = true;
    }

    let stats;
    Meteor.runAsUser(this.userId, () => {
      stats = Meteor.call('getStatistics', refresh);
    });
    return RocketChat.API.v1.success({
      statistics: stats
    });
  }

});
RocketChat.API.v1.addRoute('statistics.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-statistics')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const statistics = RocketChat.models.Statistics.find(query, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      statistics,
      count: statistics.length,
      offset,
      total: RocketChat.models.Statistics.find(query).count()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/users.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 1);
RocketChat.API.v1.addRoute('users.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      email: String,
      name: String,
      password: String,
      username: String,
      active: Match.Maybe(Boolean),
      roles: Match.Maybe(Array),
      joinDefaultChannels: Match.Maybe(Boolean),
      requirePasswordChange: Match.Maybe(Boolean),
      sendWelcomeEmail: Match.Maybe(Boolean),
      verified: Match.Maybe(Boolean),
      customFields: Match.Maybe(Object)
    }); //New change made by pull request #5152

    if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
      this.bodyParams.joinDefaultChannels = true;
    }

    if (this.bodyParams.customFields) {
      RocketChat.validateCustomFields(this.bodyParams.customFields);
    }

    const newUserId = RocketChat.saveUser(this.userId, this.bodyParams);

    if (this.bodyParams.customFields) {
      RocketChat.saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
    }

    if (typeof this.bodyParams.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(newUserId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.delete', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'delete-user')) {
      return RocketChat.API.v1.unauthorized();
    }

    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('deleteUser', user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.getAvatar', {
  authRequired: false
}, {
  get() {
    const user = this.getUserFromParams();
    const url = RocketChat.getURL(`/avatar/${user.username}`, {
      cdn: false,
      full: true
    });
    this.response.setHeader('Location', url);
    return {
      statusCode: 307,
      body: url
    };
  }

});
RocketChat.API.v1.addRoute('users.getPresence', {
  authRequired: true
}, {
  get() {
    if (this.isUserFromParams()) {
      const user = RocketChat.models.Users.findOneById(this.userId);
      return RocketChat.API.v1.success({
        presence: user.status,
        connectionStatus: user.statusConnection,
        lastLogin: user.lastLogin
      });
    }

    const user = this.getUserFromParams();
    return RocketChat.API.v1.success({
      presence: user.status
    });
  }

});
RocketChat.API.v1.addRoute('users.info', {
  authRequired: true
}, {
  get() {
    const user = this.getUserFromParams();
    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getFullUserData', {
        filter: user.username,
        limit: 1
      });
    });

    if (!result || result.length !== 1) {
      return RocketChat.API.v1.failure(`Failed to get the user data for the userId of "${user._id}".`);
    }

    return RocketChat.API.v1.success({
      user: result[0]
    });
  }

});
RocketChat.API.v1.addRoute('users.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const users = RocketChat.models.Users.find(query, {
      sort: sort ? sort : {
        username: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      users,
      count: users.length,
      offset,
      total: RocketChat.models.Users.find(query).count()
    });
  }

});
RocketChat.API.v1.addRoute('users.register', {
  authRequired: false
}, {
  post() {
    if (this.userId) {
      return RocketChat.API.v1.failure('Logged in users can not register again.');
    } //We set their username here, so require it
    //The `registerUser` checks for the other requirements


    check(this.bodyParams, Match.ObjectIncluding({
      username: String
    })); //Register the user

    const userId = Meteor.call('registerUser', this.bodyParams); //Now set their username

    Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.resetAvatar', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();

    if (user._id === this.userId) {
      Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.setAvatar', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      avatarUrl: Match.Maybe(String),
      userId: Match.Maybe(String),
      username: Match.Maybe(String)
    }));
    let user;

    if (this.isUserFromParams()) {
      user = Meteor.users.findOne(this.userId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      user = this.getUserFromParams();
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    Meteor.runAsUser(user._id, () => {
      if (this.bodyParams.avatarUrl) {
        RocketChat.setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
      } else {
        const busboy = new Busboy({
          headers: this.request.headers
        });
        Meteor.wrapAsync(callback => {
          busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
            if (fieldname !== 'image') {
              return callback(new Meteor.Error('invalid-field'));
            }

            const imageData = [];
            file.on('data', Meteor.bindEnvironment(data => {
              imageData.push(data);
            }));
            file.on('end', Meteor.bindEnvironment(() => {
              RocketChat.setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
              callback();
            }));
          }));
          this.request.pipe(busboy);
        })();
      }
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: String,
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        password: Match.Maybe(String),
        username: Match.Maybe(String),
        active: Match.Maybe(Boolean),
        roles: Match.Maybe(Array),
        joinDefaultChannels: Match.Maybe(Boolean),
        requirePasswordChange: Match.Maybe(Boolean),
        sendWelcomeEmail: Match.Maybe(Boolean),
        verified: Match.Maybe(Boolean),
        customFields: Match.Maybe(Object)
      })
    });

    const userData = _.extend({
      _id: this.bodyParams.userId
    }, this.bodyParams.data);

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, userData));

    if (this.bodyParams.data.customFields) {
      RocketChat.saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
    }

    if (typeof this.bodyParams.data.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.updateOwnBasicInfo', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        username: Match.Maybe(String),
        currentPassword: Match.Maybe(String),
        newPassword: Match.Maybe(String)
      }),
      customFields: Match.Maybe(Object)
    });
    const userData = {
      email: this.bodyParams.data.email,
      realname: this.bodyParams.data.name,
      username: this.bodyParams.data.username,
      newPassword: this.bodyParams.data.newPassword,
      typedPassword: this.bodyParams.data.currentPassword
    };
    Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.createToken', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();
    let data;
    Meteor.runAsUser(this.userId, () => {
      data = Meteor.call('createToken', user._id);
    });
    return data ? RocketChat.API.v1.success({
      data
    }) : RocketChat.API.v1.unauthorized();
  }

});
RocketChat.API.v1.addRoute('users.getPreferences', {
  authRequired: true
}, {
  get() {
    const user = RocketChat.models.Users.findOneById(this.userId);

    if (user.settings) {
      const preferences = user.settings.preferences;
      preferences['language'] = user.language;
      return RocketChat.API.v1.success({
        preferences
      });
    } else {
      return RocketChat.API.v1.failure(TAPi18n.__('Accounts_Default_User_Preferences_not_available').toUpperCase());
    }
  }

});
RocketChat.API.v1.addRoute('users.setPreferences', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: Match.Maybe(String),
      data: Match.ObjectIncluding({
        newRoomNotification: Match.Maybe(String),
        newMessageNotification: Match.Maybe(String),
        useEmojis: Match.Maybe(Boolean),
        convertAsciiEmoji: Match.Maybe(Boolean),
        saveMobileBandwidth: Match.Maybe(Boolean),
        collapseMediaByDefault: Match.Maybe(Boolean),
        autoImageLoad: Match.Maybe(Boolean),
        emailNotificationMode: Match.Maybe(String),
        unreadAlert: Match.Maybe(Boolean),
        notificationsSoundVolume: Match.Maybe(Number),
        desktopNotifications: Match.Maybe(String),
        mobileNotifications: Match.Maybe(String),
        enableAutoAway: Match.Maybe(Boolean),
        highlights: Match.Maybe(Array),
        desktopNotificationDuration: Match.Maybe(Number),
        messageViewMode: Match.Maybe(Number),
        hideUsernames: Match.Maybe(Boolean),
        hideRoles: Match.Maybe(Boolean),
        hideAvatars: Match.Maybe(Boolean),
        hideFlexTab: Match.Maybe(Boolean),
        sendOnEnter: Match.Maybe(String),
        roomCounterSidebar: Match.Maybe(Boolean),
        language: Match.Maybe(String),
        sidebarShowFavorites: Match.Optional(Boolean),
        sidebarShowUnread: Match.Optional(Boolean),
        sidebarSortby: Match.Optional(String),
        sidebarViewMode: Match.Optional(String),
        sidebarHideAvatar: Match.Optional(Boolean),
        sidebarGroupByType: Match.Optional(Boolean),
        muteFocusedConversations: Match.Optional(Boolean)
      })
    });
    const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;
    const userData = {
      _id: userId,
      settings: {
        preferences: this.bodyParams.data
      }
    };

    if (this.bodyParams.data.language) {
      const language = this.bodyParams.data.language;
      delete this.bodyParams.data.language;
      userData.language = language;
    }

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, userData));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(userId, {
        fields: {
          'settings.preferences': 1
        }
      })
    });
  }

});
/**
 DEPRECATED
 // TODO: Remove this after three versions have been released. That means at 0.66 this should be gone.
 This API returns the logged user roles.

 Method: GET
 Route: api/v1/user.roles
 */

RocketChat.API.v1.addRoute('user.roles', {
  authRequired: true
}, {
  get() {
    let currentUserRoles = {};
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUserRoles'));

    if (Array.isArray(result) && result.length > 0) {
      currentUserRoles = result[0];
    }

    return RocketChat.API.v1.success(this.deprecationWarning({
      endpoint: 'user.roles',
      versionWillBeRemove: 'v0.66',
      response: currentUserRoles
    }));
  }

});
RocketChat.API.v1.addRoute('users.forgotPassword', {
  authRequired: false
}, {
  post() {
    const {
      email
    } = this.bodyParams;

    if (!email) {
      return RocketChat.API.v1.failure('The \'email\' param is required');
    }

    const emailSent = Meteor.call('sendForgotPasswordEmail', email);

    if (emailSent) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure('User not found');
  }

});
RocketChat.API.v1.addRoute('users.getUsernameSuggestion', {
  authRequired: true
}, {
  get() {
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUsernameSuggestion'));
    return RocketChat.API.v1.success({
      result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:api/server/api.js");
require("/node_modules/meteor/rocketchat:api/server/settings.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/requestParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getPaginationItems.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getUserInfo.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/isUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/parseJsonQuery.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/deprecationWarning.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getLoggedInUser.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/insertUserObject.js");
require("/node_modules/meteor/rocketchat:api/server/default/info.js");
require("/node_modules/meteor/rocketchat:api/server/v1/channels.js");
require("/node_modules/meteor/rocketchat:api/server/v1/rooms.js");
require("/node_modules/meteor/rocketchat:api/server/v1/subscriptions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/chat.js");
require("/node_modules/meteor/rocketchat:api/server/v1/commands.js");
require("/node_modules/meteor/rocketchat:api/server/v1/emoji-custom.js");
require("/node_modules/meteor/rocketchat:api/server/v1/groups.js");
require("/node_modules/meteor/rocketchat:api/server/v1/im.js");
require("/node_modules/meteor/rocketchat:api/server/v1/integrations.js");
require("/node_modules/meteor/rocketchat:api/server/v1/misc.js");
require("/node_modules/meteor/rocketchat:api/server/v1/permissions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/push.js");
require("/node_modules/meteor/rocketchat:api/server/v1/settings.js");
require("/node_modules/meteor/rocketchat:api/server/v1/stats.js");
require("/node_modules/meteor/rocketchat:api/server/v1/users.js");

/* Exports */
Package._define("rocketchat:api");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_api.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9yZXF1ZXN0UGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRQYWdpbmF0aW9uSXRlbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2dldFVzZXJGcm9tUGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRVc2VySW5mby5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvaXNVc2VyRnJvbVBhcmFtcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvcGFyc2VKc29uUXVlcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2RlcHJlY2F0aW9uV2FybmluZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvZ2V0TG9nZ2VkSW5Vc2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9pbnNlcnRVc2VyT2JqZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvZGVmYXVsdC9pbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvY2hhbm5lbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9jaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvY29tbWFuZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9lbW9qaS1jdXN0b20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9ncm91cHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9pbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2ludGVncmF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL21pc2MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9wZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3B1c2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3N0YXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvdXNlcnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwibG9nZ2VyIiwiTG9nZ2VyIiwiQVBJIiwiUmVzdGl2dXMiLCJjb25zdHJ1Y3RvciIsInByb3BlcnRpZXMiLCJhdXRoTWV0aG9kcyIsImZpZWxkU2VwYXJhdG9yIiwiZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSIsImpvaW5Db2RlIiwibWVtYmVycyIsImltcG9ydElkcyIsImxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlIiwiYXZhdGFyT3JpZ2luIiwiZW1haWxzIiwicGhvbmUiLCJzdGF0dXNDb25uZWN0aW9uIiwiY3JlYXRlZEF0IiwibGFzdExvZ2luIiwic2VydmljZXMiLCJyZXF1aXJlUGFzc3dvcmRDaGFuZ2UiLCJyZXF1aXJlUGFzc3dvcmRDaGFuZ2VSZWFzb24iLCJyb2xlcyIsInN0YXR1c0RlZmF1bHQiLCJfdXBkYXRlZEF0IiwiY3VzdG9tRmllbGRzIiwic2V0dGluZ3MiLCJsaW1pdGVkVXNlckZpZWxkc1RvRXhjbHVkZUlmSXNQcml2aWxlZ2VkVXNlciIsIl9jb25maWciLCJkZWZhdWx0T3B0aW9uc0VuZHBvaW50IiwiX2RlZmF1bHRPcHRpb25zRW5kcG9pbnQiLCJyZXF1ZXN0IiwibWV0aG9kIiwiaGVhZGVycyIsIlJvY2tldENoYXQiLCJnZXQiLCJyZXNwb25zZSIsIndyaXRlSGVhZCIsIndyaXRlIiwiZG9uZSIsImhhc0hlbHBlck1ldGhvZHMiLCJoZWxwZXJNZXRob2RzIiwic2l6ZSIsImdldEhlbHBlck1ldGhvZHMiLCJnZXRIZWxwZXJNZXRob2QiLCJuYW1lIiwiYWRkQXV0aE1ldGhvZCIsInB1c2giLCJzdWNjZXNzIiwicmVzdWx0IiwiaXNPYmplY3QiLCJzdGF0dXNDb2RlIiwiYm9keSIsImRlYnVnIiwiZmFpbHVyZSIsImVycm9yVHlwZSIsInN0YWNrIiwiZXJyb3IiLCJub3RGb3VuZCIsIm1zZyIsInVuYXV0aG9yaXplZCIsImFkZFJvdXRlIiwicm91dGVzIiwib3B0aW9ucyIsImVuZHBvaW50cyIsImlzQXJyYXkiLCJ2ZXJzaW9uIiwiZm9yRWFjaCIsInJvdXRlIiwiT2JqZWN0Iiwia2V5cyIsImFjdGlvbiIsIm9yaWdpbmFsQWN0aW9uIiwiX2ludGVybmFsUm91dGVBY3Rpb25IYW5kbGVyIiwicm9ja2V0Y2hhdFJlc3RBcGlFbmQiLCJtZXRyaWNzIiwicm9ja2V0Y2hhdFJlc3RBcGkiLCJzdGFydFRpbWVyIiwidXNlcl9hZ2VudCIsImVudHJ5cG9pbnQiLCJ0b1VwcGVyQ2FzZSIsInVybCIsImFwcGx5IiwiZSIsInYxIiwibWVzc2FnZSIsInN0YXR1cyIsImhlbHBlck1ldGhvZCIsIl9pbml0QXV0aCIsImxvZ2luQ29tcGF0aWJpbGl0eSIsImJvZHlQYXJhbXMiLCJ1c2VyIiwidXNlcm5hbWUiLCJlbWFpbCIsInBhc3N3b3JkIiwiY29kZSIsIndpdGhvdXQiLCJsZW5ndGgiLCJhdXRoIiwiaW5jbHVkZXMiLCJoYXNoZWQiLCJkaWdlc3QiLCJhbGdvcml0aG0iLCJ0b3RwIiwibG9naW4iLCJzZWxmIiwiYXV0aFJlcXVpcmVkIiwicG9zdCIsImFyZ3MiLCJnZXRVc2VySW5mbyIsImludm9jYXRpb24iLCJERFBDb21tb24iLCJNZXRob2RJbnZvY2F0aW9uIiwiY29ubmVjdGlvbiIsImNsb3NlIiwiRERQIiwiX0N1cnJlbnRJbnZvY2F0aW9uIiwid2l0aFZhbHVlIiwiTWV0ZW9yIiwiY2FsbCIsInJlYXNvbiIsInVzZXJzIiwiZmluZE9uZSIsIl9pZCIsImlkIiwidXNlcklkIiwidXBkYXRlIiwiQWNjb3VudHMiLCJfaGFzaExvZ2luVG9rZW4iLCJ0b2tlbiIsIiR1bnNldCIsImRhdGEiLCJhdXRoVG9rZW4iLCJtZSIsImV4dHJhRGF0YSIsIm9uTG9nZ2VkSW4iLCJleHRlbmQiLCJleHRyYSIsImxvZ291dCIsImhhc2hlZFRva2VuIiwidG9rZW5Mb2NhdGlvbiIsImluZGV4IiwibGFzdEluZGV4T2YiLCJ0b2tlblBhdGgiLCJzdWJzdHJpbmciLCJ0b2tlbkZpZWxkTmFtZSIsInRva2VuVG9SZW1vdmUiLCJ0b2tlblJlbW92YWxRdWVyeSIsIiRwdWxsIiwib25Mb2dnZWRPdXQiLCJjb25zb2xlIiwid2FybiIsImdldFVzZXJBdXRoIiwiX2dldFVzZXJBdXRoIiwiaW52YWxpZFJlc3VsdHMiLCJ1bmRlZmluZWQiLCJwYXlsb2FkIiwiSlNPTiIsInBhcnNlIiwiaSIsImFyZ3VtZW50cyIsIk1hcCIsIkFwaUNsYXNzIiwiY3JlYXRlQXBpIiwiX2NyZWF0ZUFwaSIsImVuYWJsZUNvcnMiLCJ1c2VEZWZhdWx0QXV0aCIsInByZXR0eUpzb24iLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJrZXkiLCJ2YWx1ZSIsImFkZEdyb3VwIiwic2VjdGlvbiIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJlbmFibGVRdWVyeSIsInNldCIsIl9yZXF1ZXN0UGFyYW1zIiwicXVlcnlQYXJhbXMiLCJfZ2V0UGFnaW5hdGlvbkl0ZW1zIiwiaGFyZFVwcGVyTGltaXQiLCJkZWZhdWx0Q291bnQiLCJvZmZzZXQiLCJwYXJzZUludCIsImNvdW50IiwiX2dldFVzZXJGcm9tUGFyYW1zIiwiZG9lc250RXhpc3QiLCJfZG9lc250RXhpc3QiLCJwYXJhbXMiLCJyZXF1ZXN0UGFyYW1zIiwidHJpbSIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJmaW5kT25lQnlVc2VybmFtZSIsIkVycm9yIiwiZ2V0SW5mb0Zyb21Vc2VyT2JqZWN0IiwidXRjT2Zmc2V0IiwiYWN0aXZlIiwibGFuZ3VhZ2UiLCJfZ2V0VXNlckluZm8iLCJpc1ZlcmlmaWVkRW1haWwiLCJBcnJheSIsImZpbmQiLCJ2ZXJpZmllZCIsImdldFVzZXJQcmVmZXJlbmNlcyIsImRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCIsImFsbERlZmF1bHRVc2VyU2V0dGluZ3MiLCJSZWdFeHAiLCJyZWR1Y2UiLCJhY2N1bXVsYXRvciIsInNldHRpbmciLCJzZXR0aW5nV2l0aG91dFByZWZpeCIsInJlcGxhY2UiLCJnZXRVc2VyUHJlZmVyZW5jZSIsInZlcmlmaWVkRW1haWwiLCJhZGRyZXNzIiwicHJlZmVyZW5jZXMiLCJfaXNVc2VyRnJvbVBhcmFtcyIsIl9wYXJzZUpzb25RdWVyeSIsInNvcnQiLCJmaWVsZHMiLCJub25TZWxlY3RhYmxlRmllbGRzIiwiZ2V0RmllbGRzIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiY29uY2F0IiwiayIsInNwbGl0IiwiYXNzaWduIiwicXVlcnkiLCJub25RdWVyeWFibGVGaWVsZHMiLCJfZGVwcmVjYXRpb25XYXJuaW5nIiwiZW5kcG9pbnQiLCJ2ZXJzaW9uV2lsbEJlUmVtb3ZlIiwid2FybmluZ01lc3NhZ2UiLCJ3YXJuaW5nIiwiX2dldExvZ2dlZEluVXNlciIsIl9hZGRVc2VyVG9PYmplY3QiLCJvYmplY3QiLCJnZXRMb2dnZWRJblVzZXIiLCJoYXNSb2xlIiwiaW5mbyIsIkluZm8iLCJmaW5kQ2hhbm5lbEJ5SWRPck5hbWUiLCJjaGVja2VkQXJjaGl2ZWQiLCJyb29tSWQiLCJyb29tTmFtZSIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJ0IiwiYXJjaGl2ZWQiLCJmaW5kUmVzdWx0IiwicnVuQXNVc2VyIiwiYWN0aXZlVXNlcnNPbmx5IiwiY2hhbm5lbCIsImdldFVzZXJGcm9tUGFyYW1zIiwibGF0ZXN0Iiwib2xkZXN0IiwiRGF0ZSIsImluY2x1c2l2ZSIsImRlcHJlY2F0aW9uV2FybmluZyIsInN1YiIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJvcGVuIiwiYWNjZXNzIiwidW5yZWFkcyIsInVzZXJNZW50aW9ucyIsInVucmVhZHNGcm9tIiwiam9pbmVkIiwibXNncyIsInJldHVyblVzZXJuYW1lcyIsInN1YnNjcmlwdGlvbiIsImxtIiwibHMiLCJNZXNzYWdlcyIsImNvdW50VmlzaWJsZUJ5Um9vbUlkQmV0d2VlblRpbWVzdGFtcHNJbmNsdXNpdmUiLCJyaWQiLCJ1c2Vyc0NvdW50IiwiY3JlYXRlQ2hhbm5lbFZhbGlkYXRvciIsImNyZWF0ZUNoYW5uZWwiLCJyZWFkT25seSIsImNoYW5uZWxzIiwiY3JlYXRlIiwidmFsaWRhdGUiLCJleGVjdXRlIiwiYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QiLCJmaWxlIiwiaW5zZXJ0VXNlck9iamVjdCIsImdldFBhZ2luYXRpb25JdGVtcyIsInBhcnNlSnNvblF1ZXJ5Iiwib3VyUXVlcnkiLCJmaWxlcyIsIlVwbG9hZHMiLCJza2lwIiwibGltaXQiLCJmZXRjaCIsIm1hcCIsInRvdGFsIiwiaW5jbHVkZUFsbFB1YmxpY0NoYW5uZWxzIiwiJGluIiwiaW50ZWdyYXRpb25zIiwiSW50ZWdyYXRpb25zIiwiX2NyZWF0ZWRBdCIsImxhdGVzdERhdGUiLCJvbGRlc3REYXRlIiwiaGFzUGVybWlzc2lvblRvU2VlQWxsUHVibGljQ2hhbm5lbHMiLCJyb29tSWRzIiwiZmluZEJ5VXNlcklkQW5kVHlwZSIsInMiLCJjdXJzb3IiLCJyb29tcyIsImZpbmRCeVN1YnNjcmlwdGlvblR5cGVBbmRVc2VySWQiLCJ0b3RhbENvdW50IiwiYnJvYWRjYXN0Iiwic3Vic2NyaXB0aW9ucyIsImZpbmRCeVJvb21JZCIsInUiLCJ0cyIsIm1lc3NhZ2VzIiwib25saW5lIiwiZmluZFVzZXJzTm90T2ZmbGluZSIsIm9ubGluZUluUm9vbSIsInJvb3QiLCJ0b1N0cmluZyIsImRlc2NyaXB0aW9uIiwicHVycG9zZSIsInJvIiwidG9waWMiLCJhbm5vdW5jZW1lbnQiLCJtZW50aW9ucyIsImFsbE1lbnRpb25zIiwiQnVzYm95IiwiZmluZFJvb21CeUlkT3JOYW1lIiwidXBkYXRlZFNpbmNlIiwidXBkYXRlZFNpbmNlRGF0ZSIsImlzTmFOIiwicmVtb3ZlIiwidXJsUGFyYW1zIiwiYnVzYm95Iiwid3JhcEFzeW5jIiwiY2FsbGJhY2siLCJvbiIsImZpZWxkbmFtZSIsImZpbGVuYW1lIiwiZW5jb2RpbmciLCJtaW1ldHlwZSIsImZpbGVEYXRlIiwiZmlsZUJ1ZmZlciIsIkJ1ZmZlciIsImJpbmRFbnZpcm9ubWVudCIsInBpcGUiLCJmaWxlU3RvcmUiLCJGaWxlVXBsb2FkIiwiZ2V0U3RvcmUiLCJkZXRhaWxzIiwidXBsb2FkZWRGaWxlIiwiaW5zZXJ0IiwiYmluZCIsInNhdmVOb3RpZmljYXRpb25zIiwibm90aWZpY2F0aW9ucyIsIm5vdGlmaWNhdGlvbktleSIsImZhdm9yaXRlIiwiaGFzT3duUHJvcGVydHkiLCJjaGVjayIsIlN0cmluZyIsImZpcnN0VW5yZWFkTWVzc2FnZSIsIk1hdGNoIiwiT2JqZWN0SW5jbHVkaW5nIiwibXNnSWQiLCJhc1VzZXIiLCJNYXliZSIsIkJvb2xlYW4iLCJub3ciLCJsYXN0VXBkYXRlIiwibWVzc2FnZUlkIiwicGlubmVkTWVzc2FnZSIsIm1lc3NhZ2VSZXR1cm4iLCJwcm9jZXNzV2ViaG9va01lc3NhZ2UiLCJzZWFyY2hUZXh0IiwiZG9jcyIsInN0YXJyZWQiLCJ0ZXh0IiwiZW1vamkiLCJyZWFjdGlvbiIsInNob3VsZFJlYWN0IiwibWVzc2FnZVJlYWRSZWNlaXB0cyIsInJlY2VpcHRzIiwiaWdub3JlIiwidGVzdCIsImNvbW1hbmQiLCJjbWQiLCJzbGFzaENvbW1hbmRzIiwiY29tbWFuZHMiLCJ0b0xvd2VyQ2FzZSIsInZhbHVlcyIsImZpbHRlciIsInByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdCIsInJ1biIsIlJhbmRvbSIsInByZXZpZXciLCJwcmV2aWV3SXRlbSIsImVtb2ppcyIsImZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lIiwicm9vbVN1YiIsImZpbmRPbmVCeVJvb21OYW1lQW5kVXNlcklkIiwiZ3JvdXAiLCJpbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyIsImNoYW5uZWxzVG9TZWFyY2giLCJpZE9yTmFtZSIsImZpbmRPbmVCeUlkT3JOYW1lIiwiZ3JvdXBzIiwiZmluZERpcmVjdE1lc3NhZ2VSb29tIiwiZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luIiwiY3VycmVudFVzZXJJZCIsIm5hbWVPcklkIiwicnVzZXJJZCIsInJzIiwiZG0iLCJ1bnJlYWQiLCJsb2ciLCJpbXMiLCJlbmFibGVkIiwidXJscyIsImV2ZW50IiwidHJpZ2dlcldvcmRzIiwiYWxpYXMiLCJhdmF0YXIiLCJzY3JpcHRFbmFibGVkIiwic2NyaXB0IiwidGFyZ2V0Q2hhbm5lbCIsImludGVncmF0aW9uIiwiaGlzdG9yeSIsIkludGVncmF0aW9uSGlzdG9yeSIsIml0ZW1zIiwidGFyZ2V0X3VybCIsImludGVncmF0aW9uSWQiLCJvbmxpbmVDYWNoZSIsIm9ubGluZUNhY2hlRGF0ZSIsImNhY2hlSW52YWxpZCIsImljb24iLCJ0eXBlcyIsImhpZGVJY29uIiwiYmFja2dyb3VuZENvbG9yIiwiVEFQaTE4biIsIl9fIiwiaWNvblNpemUiLCJsZWZ0U2l6ZSIsInJpZ2h0U2l6ZSIsIndpZHRoIiwiaGVpZ2h0Iiwic29ydEJ5Iiwic29ydERpcmVjdGlvbiIsInBhZ2UiLCJyZXN1bHRzIiwicGVybWlzc2lvbnMiLCJwZXJtaXNzaW9uTm90Rm91bmQiLCJyb2xlTm90Rm91bmQiLCJlbGVtZW50IiwiUGVybWlzc2lvbnMiLCJzdWJlbGVtZW50IiwiUm9sZXMiLCJjcmVhdGVPclVwZGF0ZSIsImFwcE5hbWUiLCJkZWxldGUiLCJhZmZlY3RlZFJlY29yZHMiLCJQdXNoIiwiYXBwQ29sbGVjdGlvbiIsIiRvciIsImhpZGRlbiIsIiRuZSIsIlNldHRpbmdzIiwibW91bnRPQXV0aFNlcnZpY2VzIiwib0F1dGhTZXJ2aWNlc0VuYWJsZWQiLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwic2VjcmV0Iiwic2VydmljZSIsImN1c3RvbSIsImNsaWVudElkIiwiYXBwSWQiLCJjb25zdW1lcktleSIsImJ1dHRvbkxhYmVsVGV4dCIsImJ1dHRvbkNvbG9yIiwiYnV0dG9uTGFiZWxDb2xvciIsInBpY2siLCJmaW5kT25lTm90SGlkZGVuQnlJZCIsImVkaXRvciIsInVwZGF0ZU9wdGlvbnNCeUlkIiwidXBkYXRlVmFsdWVOb3RIaWRkZW5CeUlkIiwiQW55IiwiUGFja2FnZSIsInJlZnJlc2giLCJzdGF0cyIsInN0YXRpc3RpY3MiLCJTdGF0aXN0aWNzIiwiam9pbkRlZmF1bHRDaGFubmVscyIsInNlbmRXZWxjb21lRW1haWwiLCJ2YWxpZGF0ZUN1c3RvbUZpZWxkcyIsIm5ld1VzZXJJZCIsInNhdmVVc2VyIiwic2F2ZUN1c3RvbUZpZWxkc1dpdGhvdXRWYWxpZGF0aW9uIiwiZ2V0VVJMIiwiY2RuIiwiZnVsbCIsInNldEhlYWRlciIsImlzVXNlckZyb21QYXJhbXMiLCJwcmVzZW5jZSIsImNvbm5lY3Rpb25TdGF0dXMiLCJhdmF0YXJVcmwiLCJzZXRVc2VyQXZhdGFyIiwiaW1hZ2VEYXRhIiwidXNlckRhdGEiLCJzYXZlQ3VzdG9tRmllbGRzIiwiY3VycmVudFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJyZWFsbmFtZSIsInR5cGVkUGFzc3dvcmQiLCJuZXdSb29tTm90aWZpY2F0aW9uIiwibmV3TWVzc2FnZU5vdGlmaWNhdGlvbiIsInVzZUVtb2ppcyIsImNvbnZlcnRBc2NpaUVtb2ppIiwic2F2ZU1vYmlsZUJhbmR3aWR0aCIsImNvbGxhcHNlTWVkaWFCeURlZmF1bHQiLCJhdXRvSW1hZ2VMb2FkIiwiZW1haWxOb3RpZmljYXRpb25Nb2RlIiwidW5yZWFkQWxlcnQiLCJub3RpZmljYXRpb25zU291bmRWb2x1bWUiLCJOdW1iZXIiLCJkZXNrdG9wTm90aWZpY2F0aW9ucyIsIm1vYmlsZU5vdGlmaWNhdGlvbnMiLCJlbmFibGVBdXRvQXdheSIsImhpZ2hsaWdodHMiLCJkZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb24iLCJtZXNzYWdlVmlld01vZGUiLCJoaWRlVXNlcm5hbWVzIiwiaGlkZVJvbGVzIiwiaGlkZUF2YXRhcnMiLCJoaWRlRmxleFRhYiIsInNlbmRPbkVudGVyIiwicm9vbUNvdW50ZXJTaWRlYmFyIiwic2lkZWJhclNob3dGYXZvcml0ZXMiLCJPcHRpb25hbCIsInNpZGViYXJTaG93VW5yZWFkIiwic2lkZWJhclNvcnRieSIsInNpZGViYXJWaWV3TW9kZSIsInNpZGViYXJIaWRlQXZhdGFyIiwic2lkZWJhckdyb3VwQnlUeXBlIiwibXV0ZUZvY3VzZWRDb252ZXJzYXRpb25zIiwiY3VycmVudFVzZXJSb2xlcyIsImVtYWlsU2VudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBRU4sTUFBTUMsU0FBUyxJQUFJQyxNQUFKLENBQVcsS0FBWCxFQUFrQixFQUFsQixDQUFmOztBQUVBLE1BQU1DLEdBQU4sU0FBa0JDLFFBQWxCLENBQTJCO0FBQzFCQyxjQUFZQyxVQUFaLEVBQXdCO0FBQ3ZCLFVBQU1BLFVBQU47QUFDQSxTQUFLQyxXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixHQUF0QjtBQUNBLFNBQUtDLHNCQUFMLEdBQThCO0FBQzdCQyxnQkFBVSxDQURtQjtBQUU3QkMsZUFBUyxDQUZvQjtBQUc3QkMsaUJBQVc7QUFIa0IsS0FBOUI7QUFLQSxTQUFLQywwQkFBTCxHQUFrQztBQUNqQ0Msb0JBQWMsQ0FEbUI7QUFFakNDLGNBQVEsQ0FGeUI7QUFHakNDLGFBQU8sQ0FIMEI7QUFJakNDLHdCQUFrQixDQUplO0FBS2pDQyxpQkFBVyxDQUxzQjtBQU1qQ0MsaUJBQVcsQ0FOc0I7QUFPakNDLGdCQUFVLENBUHVCO0FBUWpDQyw2QkFBdUIsQ0FSVTtBQVNqQ0MsbUNBQTZCLENBVEk7QUFVakNDLGFBQU8sQ0FWMEI7QUFXakNDLHFCQUFlLENBWGtCO0FBWWpDQyxrQkFBWSxDQVpxQjtBQWFqQ0Msb0JBQWMsQ0FibUI7QUFjakNDLGdCQUFVO0FBZHVCLEtBQWxDO0FBZ0JBLFNBQUtDLDRDQUFMLEdBQW9EO0FBQ25E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a0J2QixRQUFsQixDQUEyQixzQkFBM0IsRUFBbUQ7QUFBRTZDLGdCQUFjO0FBQWhCLENBQW5ELEVBQTRFO0FBQzNFQyxTQUFPO0FBQ04sVUFBTTtBQUFFZDtBQUFGLFFBQVksS0FBS0gsVUFBdkI7O0FBQ0EsUUFBSSxDQUFDRyxLQUFMLEVBQVk7QUFDWCxhQUFPM0QsV0FBV2hDLEdBQVgsQ0FBZWtGLEVBQWYsQ0FBa0I5QixPQUFsQixDQUEwQixpQ0FBMUIsQ0FBUDtBQUNBOztBQUVELFVBQU1xZixZQUFZcmIsT0FBT0MsSUFBUCxDQUFZLHlCQUFaLEVBQXVDMUIsS0FBdkMsQ0FBbEI7O0FBQ0EsUUFBSThjLFNBQUosRUFBZTtBQUNkLGFBQU96Z0IsV0FBV2hDLEdBQVgsQ0FBZWtGLEVBQWYsQ0FBa0JwQyxPQUFsQixFQUFQO0FBQ0E7O0FBQ0QsV0FBT2QsV0FBV2hDLEdBQVgsQ0FBZWtGLEVBQWYsQ0FBa0I5QixPQUFsQixDQUEwQixnQkFBMUIsQ0FBUDtBQUNBOztBQVowRSxDQUE1RTtBQWVBcEIsV0FBV2hDLEdBQVgsQ0FBZWtGLEVBQWYsQ0FBa0J2QixRQUFsQixDQUEyQiw2QkFBM0IsRUFBMEQ7QUFBRTZDLGdCQUFjO0FBQWhCLENBQTFELEVBQWtGO0FBQ2pGdkUsUUFBTTtBQUNMLFVBQU1jLFNBQVNxRSxPQUFPMkksU0FBUCxDQUFpQixLQUFLcEksTUFBdEIsRUFBOEIsTUFBTVAsT0FBT0MsSUFBUCxDQUFZLHVCQUFaLENBQXBDLENBQWY7QUFFQSxXQUFPckYsV0FBV2hDLEdBQVgsQ0FBZWtGLEVBQWYsQ0FBa0JwQyxPQUFsQixDQUEwQjtBQUFFQztBQUFGLEtBQTFCLENBQVA7QUFDQTs7QUFMZ0YsQ0FBbEYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hcGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgUmVzdGl2dXMsIEREUCwgRERQQ29tbW9uICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0FQSScsIHt9KTtcblxuY2xhc3MgQVBJIGV4dGVuZHMgUmVzdGl2dXMge1xuXHRjb25zdHJ1Y3Rvcihwcm9wZXJ0aWVzKSB7XG5cdFx0c3VwZXIocHJvcGVydGllcyk7XG5cdFx0dGhpcy5hdXRoTWV0aG9kcyA9IFtdO1xuXHRcdHRoaXMuZmllbGRTZXBhcmF0b3IgPSAnLic7XG5cdFx0dGhpcy5kZWZhdWx0RmllbGRzVG9FeGNsdWRlID0ge1xuXHRcdFx0am9pbkNvZGU6IDAsXG5cdFx0XHRtZW1iZXJzOiAwLFxuXHRcdFx0aW1wb3J0SWRzOiAwXG5cdFx0fTtcblx0XHR0aGlzLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlID0ge1xuXHRcdFx0YXZhdGFyT3JpZ2luOiAwLFxuXHRcdFx0ZW1haWxzOiAwLFxuXHRcdFx0cGhvbmU6IDAsXG5cdFx0XHRzdGF0dXNDb25uZWN0aW9uOiAwLFxuXHRcdFx0Y3JlYXRlZEF0OiAwLFxuXHRcdFx0bGFzdExvZ2luOiAwLFxuXHRcdFx0c2VydmljZXM6IDAsXG5cdFx0XHRyZXF1aXJlUGFzc3dvcmRDaGFuZ2U6IDAsXG5cdFx0XHRyZXF1aXJlUGFzc3dvcmRDaGFuZ2VSZWFzb246IDAsXG5cdFx0XHRyb2xlczogMCxcblx0XHRcdHN0YXR1c0RlZmF1bHQ6IDAsXG5cdFx0XHRfdXBkYXRlZEF0OiAwLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiAwLFxuXHRcdFx0c2V0dGluZ3M6IDBcblx0XHR9O1xuXHRcdHRoaXMubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGVJZklzUHJpdmlsZWdlZFVzZXIgPSB7XG5cdFx0XHRzZXJ2aWNlczogMFxuXHRcdH07XG5cblx0XHR0aGlzLl9jb25maWcuZGVmYXVsdE9wdGlvbnNFbmRwb2ludCA9IGZ1bmN0aW9uIF9kZWZhdWx0T3B0aW9uc0VuZHBvaW50KCkge1xuXHRcdFx0aWYgKHRoaXMucmVxdWVzdC5tZXRob2QgPT09ICdPUFRJT05TJyAmJiB0aGlzLnJlcXVlc3QuaGVhZGVyc1snYWNjZXNzLWNvbnRyb2wtcmVxdWVzdC1tZXRob2QnXSkge1xuXHRcdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbmFibGVfQ09SUycpID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0dGhpcy5yZXNwb25zZS53cml0ZUhlYWQoMjAwLCB7XG5cdFx0XHRcdFx0XHQnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9DT1JTX09yaWdpbicpLFxuXHRcdFx0XHRcdFx0J0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnT3JpZ2luLCBYLVJlcXVlc3RlZC1XaXRoLCBDb250ZW50LVR5cGUsIEFjY2VwdCwgWC1Vc2VyLUlkLCBYLUF1dGgtVG9rZW4nXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5yZXNwb25zZS53cml0ZUhlYWQoNDA1KTtcblx0XHRcdFx0XHR0aGlzLnJlc3BvbnNlLndyaXRlKCdDT1JTIG5vdCBlbmFibGVkLiBHbyB0byBcIkFkbWluID4gR2VuZXJhbCA+IFJFU1QgQXBpXCIgdG8gZW5hYmxlIGl0LicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnJlc3BvbnNlLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmRvbmUoKTtcblx0XHR9O1xuXHR9XG5cblx0aGFzSGVscGVyTWV0aG9kcygpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zaXplICE9PSAwO1xuXHR9XG5cblx0Z2V0SGVscGVyTWV0aG9kcygpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcztcblx0fVxuXG5cdGdldEhlbHBlck1ldGhvZChuYW1lKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuZ2V0KG5hbWUpO1xuXHR9XG5cblx0YWRkQXV0aE1ldGhvZChtZXRob2QpIHtcblx0XHR0aGlzLmF1dGhNZXRob2RzLnB1c2gobWV0aG9kKTtcblx0fVxuXG5cdHN1Y2Nlc3MocmVzdWx0ID0ge30pIHtcblx0XHRpZiAoXy5pc09iamVjdChyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQuc3VjY2VzcyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0cmVzdWx0ID0ge1xuXHRcdFx0c3RhdHVzQ29kZTogMjAwLFxuXHRcdFx0Ym9keTogcmVzdWx0XG5cdFx0fTtcblxuXHRcdGxvZ2dlci5kZWJ1ZygnU3VjY2VzcycsIHJlc3VsdCk7XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0ZmFpbHVyZShyZXN1bHQsIGVycm9yVHlwZSwgc3RhY2spIHtcblx0XHRpZiAoXy5pc09iamVjdChyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQuc3VjY2VzcyA9IGZhbHNlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQgPSB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogcmVzdWx0LFxuXHRcdFx0XHRzdGFja1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGVycm9yVHlwZSkge1xuXHRcdFx0XHRyZXN1bHQuZXJyb3JUeXBlID0gZXJyb3JUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlc3VsdCA9IHtcblx0XHRcdHN0YXR1c0NvZGU6IDQwMCxcblx0XHRcdGJvZHk6IHJlc3VsdFxuXHRcdH07XG5cblx0XHRsb2dnZXIuZGVidWcoJ0ZhaWx1cmUnLCByZXN1bHQpO1xuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdG5vdEZvdW5kKG1zZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDQsXG5cdFx0XHRib2R5OiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogbXNnID8gbXNnIDogJ1Jlc291cmNlIG5vdCBmb3VuZCdcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0dW5hdXRob3JpemVkKG1zZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDMsXG5cdFx0XHRib2R5OiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogbXNnID8gbXNnIDogJ3VuYXV0aG9yaXplZCdcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cblx0YWRkUm91dGUocm91dGVzLCBvcHRpb25zLCBlbmRwb2ludHMpIHtcblx0XHQvL05vdGU6IHJlcXVpcmVkIGlmIHRoZSBkZXZlbG9wZXIgZGlkbid0IHByb3ZpZGUgb3B0aW9uc1xuXHRcdGlmICh0eXBlb2YgZW5kcG9pbnRzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0ZW5kcG9pbnRzID0gb3B0aW9ucztcblx0XHRcdG9wdGlvbnMgPSB7fTtcblx0XHR9XG5cblx0XHQvL0FsbG93IGZvciBtb3JlIHRoYW4gb25lIHJvdXRlIHVzaW5nIHRoZSBzYW1lIG9wdGlvbiBhbmQgZW5kcG9pbnRzXG5cdFx0aWYgKCFfLmlzQXJyYXkocm91dGVzKSkge1xuXHRcdFx0cm91dGVzID0gW3JvdXRlc107XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmVyc2lvbiA9IHRoaXMuX2NvbmZpZy52ZXJzaW9uO1xuXG5cdFx0cm91dGVzLmZvckVhY2goKHJvdXRlKSA9PiB7XG5cdFx0XHQvL05vdGU6IFRoaXMgaXMgcmVxdWlyZWQgZHVlIHRvIFJlc3RpdnVzIGNhbGxpbmcgYGFkZFJvdXRlYCBpbiB0aGUgY29uc3RydWN0b3Igb2YgaXRzZWxmXG5cdFx0XHRPYmplY3Qua2V5cyhlbmRwb2ludHMpLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuXHRcdFx0XHRpZiAodHlwZW9mIGVuZHBvaW50c1ttZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0ZW5kcG9pbnRzW21ldGhvZF0gPSB7IGFjdGlvbjogZW5kcG9pbnRzW21ldGhvZF0gfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vQWRkIGEgdHJ5L2NhdGNoIGZvciBlYWNoIGVuZHBvaW50XG5cdFx0XHRcdGNvbnN0IG9yaWdpbmFsQWN0aW9uID0gZW5kcG9pbnRzW21ldGhvZF0uYWN0aW9uO1xuXHRcdFx0XHRlbmRwb2ludHNbbWV0aG9kXS5hY3Rpb24gPSBmdW5jdGlvbiBfaW50ZXJuYWxSb3V0ZUFjdGlvbkhhbmRsZXIoKSB7XG5cdFx0XHRcdFx0Y29uc3Qgcm9ja2V0Y2hhdFJlc3RBcGlFbmQgPSBSb2NrZXRDaGF0Lm1ldHJpY3Mucm9ja2V0Y2hhdFJlc3RBcGkuc3RhcnRUaW1lcih7XG5cdFx0XHRcdFx0XHRtZXRob2QsXG5cdFx0XHRcdFx0XHR2ZXJzaW9uLFxuXHRcdFx0XHRcdFx0dXNlcl9hZ2VudDogdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3VzZXItYWdlbnQnXSxcblx0XHRcdFx0XHRcdGVudHJ5cG9pbnQ6IHJvdXRlXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRsb2dnZXIuZGVidWcoYCR7IHRoaXMucmVxdWVzdC5tZXRob2QudG9VcHBlckNhc2UoKSB9OiAkeyB0aGlzLnJlcXVlc3QudXJsIH1gKTtcblx0XHRcdFx0XHRsZXQgcmVzdWx0O1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBvcmlnaW5hbEFjdGlvbi5hcHBseSh0aGlzKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIuZGVidWcoYCR7IG1ldGhvZCB9ICR7IHJvdXRlIH0gdGhyZXcgYW4gZXJyb3I6YCwgZS5zdGFjayk7XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSwgZS5lcnJvcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzdWx0ID0gcmVzdWx0IHx8IFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblxuXHRcdFx0XHRcdHJvY2tldGNoYXRSZXN0QXBpRW5kKHtcblx0XHRcdFx0XHRcdHN0YXR1czogcmVzdWx0LnN0YXR1c0NvZGVcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKHRoaXMuaGFzSGVscGVyTWV0aG9kcygpKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBbbmFtZSwgaGVscGVyTWV0aG9kXSBvZiB0aGlzLmdldEhlbHBlck1ldGhvZHMoKSkge1xuXHRcdFx0XHRcdFx0ZW5kcG9pbnRzW21ldGhvZF1bbmFtZV0gPSBoZWxwZXJNZXRob2Q7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9BbGxvdyB0aGUgZW5kcG9pbnRzIHRvIG1ha2UgdXNhZ2Ugb2YgdGhlIGxvZ2dlciB3aGljaCByZXNwZWN0cyB0aGUgdXNlcidzIHNldHRpbmdzXG5cdFx0XHRcdGVuZHBvaW50c1ttZXRob2RdLmxvZ2dlciA9IGxvZ2dlcjtcblx0XHRcdH0pO1xuXG5cdFx0XHRzdXBlci5hZGRSb3V0ZShyb3V0ZSwgb3B0aW9ucywgZW5kcG9pbnRzKTtcblx0XHR9KTtcblx0fVxuXG5cdF9pbml0QXV0aCgpIHtcblx0XHRjb25zdCBsb2dpbkNvbXBhdGliaWxpdHkgPSAoYm9keVBhcmFtcykgPT4ge1xuXHRcdFx0Ly8gR3JhYiB0aGUgdXNlcm5hbWUgb3IgZW1haWwgdGhhdCB0aGUgdXNlciBpcyBsb2dnaW5nIGluIHdpdGhcblx0XHRcdGNvbnN0IHt1c2VyLCB1c2VybmFtZSwgZW1haWwsIHBhc3N3b3JkLCBjb2RlfSA9IGJvZHlQYXJhbXM7XG5cblx0XHRcdGlmIChwYXNzd29yZCA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBib2R5UGFyYW1zO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoXy53aXRob3V0KE9iamVjdC5rZXlzKGJvZHlQYXJhbXMpLCAndXNlcicsICd1c2VybmFtZScsICdlbWFpbCcsICdwYXNzd29yZCcsICdjb2RlJykubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRyZXR1cm4gYm9keVBhcmFtcztcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYXV0aCA9IHtcblx0XHRcdFx0cGFzc3dvcmRcblx0XHRcdH07XG5cblx0XHRcdGlmICh0eXBlb2YgdXNlciA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0YXV0aC51c2VyID0gdXNlci5pbmNsdWRlcygnQCcpID8ge2VtYWlsOiB1c2VyfSA6IHt1c2VybmFtZTogdXNlcn07XG5cdFx0XHR9IGVsc2UgaWYgKHVzZXJuYW1lKSB7XG5cdFx0XHRcdGF1dGgudXNlciA9IHt1c2VybmFtZX07XG5cdFx0XHR9IGVsc2UgaWYgKGVtYWlsKSB7XG5cdFx0XHRcdGF1dGgudXNlciA9IHtlbWFpbH07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhdXRoLnVzZXIgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gYm9keVBhcmFtcztcblx0XHRcdH1cblxuXHRcdFx0aWYgKGF1dGgucGFzc3dvcmQuaGFzaGVkKSB7XG5cdFx0XHRcdGF1dGgucGFzc3dvcmQgPSB7XG5cdFx0XHRcdFx0ZGlnZXN0OiBhdXRoLnBhc3N3b3JkLFxuXHRcdFx0XHRcdGFsZ29yaXRobTogJ3NoYS0yNTYnXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjb2RlKSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0dG90cDoge1xuXHRcdFx0XHRcdFx0Y29kZSxcblx0XHRcdFx0XHRcdGxvZ2luOiBhdXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYXV0aDtcblx0XHR9O1xuXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLmFkZFJvdXRlKCdsb2dpbicsIHthdXRoUmVxdWlyZWQ6IGZhbHNlfSwge1xuXHRcdFx0cG9zdCgpIHtcblx0XHRcdFx0Y29uc3QgYXJncyA9IGxvZ2luQ29tcGF0aWJpbGl0eSh0aGlzLmJvZHlQYXJhbXMpO1xuXHRcdFx0XHRjb25zdCBnZXRVc2VySW5mbyA9IHNlbGYuZ2V0SGVscGVyTWV0aG9kKCdnZXRVc2VySW5mbycpO1xuXG5cdFx0XHRcdGNvbnN0IGludm9jYXRpb24gPSBuZXcgRERQQ29tbW9uLk1ldGhvZEludm9jYXRpb24oe1xuXHRcdFx0XHRcdGNvbm5lY3Rpb246IHtcblx0XHRcdFx0XHRcdGNsb3NlKCkge31cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGxldCBhdXRoO1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGF1dGggPSBERFAuX0N1cnJlbnRJbnZvY2F0aW9uLndpdGhWYWx1ZShpbnZvY2F0aW9uLCAoKSA9PiBNZXRlb3IuY2FsbCgnbG9naW4nLCBhcmdzKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0bGV0IGUgPSBlcnJvcjtcblx0XHRcdFx0XHRpZiAoZXJyb3IucmVhc29uID09PSAnVXNlciBub3QgZm91bmQnKSB7XG5cdFx0XHRcdFx0XHRlID0ge1xuXHRcdFx0XHRcdFx0XHRlcnJvcjogJ1VuYXV0aG9yaXplZCcsXG5cdFx0XHRcdFx0XHRcdHJlYXNvbjogJ1VuYXV0aG9yaXplZCdcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwMSxcblx0XHRcdFx0XHRcdGJvZHk6IHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzOiAnZXJyb3InLFxuXHRcdFx0XHRcdFx0XHRlcnJvcjogZS5lcnJvcixcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogZS5yZWFzb24gfHwgZS5tZXNzYWdlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMudXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcblx0XHRcdFx0XHRfaWQ6IGF1dGguaWRcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0dGhpcy51c2VySWQgPSB0aGlzLnVzZXIuX2lkO1xuXG5cdFx0XHRcdC8vIFJlbW92ZSB0b2tlbkV4cGlyZXMgdG8ga2VlcCB0aGUgb2xkIGJlaGF2aW9yXG5cdFx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUoe1xuXHRcdFx0XHRcdF9pZDogdGhpcy51c2VyLl9pZCxcblx0XHRcdFx0XHQnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuJzogQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGgudG9rZW4pXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHQkdW5zZXQ6IHtcblx0XHRcdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuJC53aGVuJzogMVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSB7XG5cdFx0XHRcdFx0c3RhdHVzOiAnc3VjY2VzcycsXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZCxcblx0XHRcdFx0XHRcdGF1dGhUb2tlbjogYXV0aC50b2tlbixcblx0XHRcdFx0XHRcdG1lOiBnZXRVc2VySW5mbyh0aGlzLnVzZXIpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnN0IGV4dHJhRGF0YSA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluICYmIHNlbGYuX2NvbmZpZy5vbkxvZ2dlZEluLmNhbGwodGhpcyk7XG5cblx0XHRcdFx0aWYgKGV4dHJhRGF0YSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Xy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuXHRcdFx0XHRcdFx0ZXh0cmE6IGV4dHJhRGF0YVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgbG9nb3V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBSZW1vdmUgdGhlIGdpdmVuIGF1dGggdG9rZW4gZnJvbSB0aGUgdXNlcidzIGFjY291bnRcblx0XHRcdGNvbnN0IGF1dGhUb2tlbiA9IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXTtcblx0XHRcdGNvbnN0IGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGhUb2tlbik7XG5cdFx0XHRjb25zdCB0b2tlbkxvY2F0aW9uID0gc2VsZi5fY29uZmlnLmF1dGgudG9rZW47XG5cdFx0XHRjb25zdCBpbmRleCA9IHRva2VuTG9jYXRpb24ubGFzdEluZGV4T2YoJy4nKTtcblx0XHRcdGNvbnN0IHRva2VuUGF0aCA9IHRva2VuTG9jYXRpb24uc3Vic3RyaW5nKDAsIGluZGV4KTtcblx0XHRcdGNvbnN0IHRva2VuRmllbGROYW1lID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcoaW5kZXggKyAxKTtcblx0XHRcdGNvbnN0IHRva2VuVG9SZW1vdmUgPSB7fTtcblx0XHRcdHRva2VuVG9SZW1vdmVbdG9rZW5GaWVsZE5hbWVdID0gaGFzaGVkVG9rZW47XG5cdFx0XHRjb25zdCB0b2tlblJlbW92YWxRdWVyeSA9IHt9O1xuXHRcdFx0dG9rZW5SZW1vdmFsUXVlcnlbdG9rZW5QYXRoXSA9IHRva2VuVG9SZW1vdmU7XG5cblx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUodGhpcy51c2VyLl9pZCwge1xuXHRcdFx0XHQkcHVsbDogdG9rZW5SZW1vdmFsUXVlcnlcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCByZXNwb25zZSA9IHtcblx0XHRcdFx0c3RhdHVzOiAnc3VjY2VzcycsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRtZXNzYWdlOiAnWW91XFwndmUgYmVlbiBsb2dnZWQgb3V0ISdcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0Ly8gQ2FsbCB0aGUgbG9nb3V0IGhvb2sgd2l0aCB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGF0dGFjaGVkXG5cdFx0XHRjb25zdCBleHRyYURhdGEgPSBzZWxmLl9jb25maWcub25Mb2dnZWRPdXQgJiYgc2VsZi5fY29uZmlnLm9uTG9nZ2VkT3V0LmNhbGwodGhpcyk7XG5cdFx0XHRpZiAoZXh0cmFEYXRhICE9IG51bGwpIHtcblx0XHRcdFx0Xy5leHRlbmQocmVzcG9uc2UuZGF0YSwge1xuXHRcdFx0XHRcdGV4dHJhOiBleHRyYURhdGFcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fTtcblxuXHRcdC8qXG5cdFx0XHRBZGQgYSBsb2dvdXQgZW5kcG9pbnQgdG8gdGhlIEFQSVxuXHRcdFx0QWZ0ZXIgdGhlIHVzZXIgaXMgbG9nZ2VkIG91dCwgdGhlIG9uTG9nZ2VkT3V0IGhvb2sgaXMgY2FsbGVkIChzZWUgUmVzdGZ1bGx5LmNvbmZpZ3VyZSgpIGZvclxuXHRcdFx0YWRkaW5nIGhvb2spLlxuXHRcdCovXG5cdFx0cmV0dXJuIHRoaXMuYWRkUm91dGUoJ2xvZ291dCcsIHtcblx0XHRcdGF1dGhSZXF1aXJlZDogdHJ1ZVxuXHRcdH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdXYXJuaW5nOiBEZWZhdWx0IGxvZ291dCB2aWEgR0VUIHdpbGwgYmUgcmVtb3ZlZCBpbiBSZXN0aXZ1cyB2MS4wLiBVc2UgUE9TVCBpbnN0ZWFkLicpO1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJyAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2thaG1hbGkvbWV0ZW9yLXJlc3RpdnVzL2lzc3Vlcy8xMDAnKTtcblx0XHRcdFx0cmV0dXJuIGxvZ291dC5jYWxsKHRoaXMpO1xuXHRcdFx0fSxcblx0XHRcdHBvc3Q6IGxvZ291dFxuXHRcdH0pO1xuXHR9XG59XG5cbmNvbnN0IGdldFVzZXJBdXRoID0gZnVuY3Rpb24gX2dldFVzZXJBdXRoKCkge1xuXHRjb25zdCBpbnZhbGlkUmVzdWx0cyA9IFt1bmRlZmluZWQsIG51bGwsIGZhbHNlXTtcblx0cmV0dXJuIHtcblx0XHR0b2tlbjogJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbicsXG5cdFx0dXNlcigpIHtcblx0XHRcdGlmICh0aGlzLmJvZHlQYXJhbXMgJiYgdGhpcy5ib2R5UGFyYW1zLnBheWxvYWQpIHtcblx0XHRcdFx0dGhpcy5ib2R5UGFyYW1zID0gSlNPTi5wYXJzZSh0aGlzLmJvZHlQYXJhbXMucGF5bG9hZCk7XG5cdFx0XHR9XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgUm9ja2V0Q2hhdC5BUEkudjEuYXV0aE1ldGhvZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgbWV0aG9kID0gUm9ja2V0Q2hhdC5BUEkudjEuYXV0aE1ldGhvZHNbaV07XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdFx0XHRpZiAoIWludmFsaWRSZXN1bHRzLmluY2x1ZGVzKHJlc3VsdCkpIHtcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxldCB0b2tlbjtcblx0XHRcdGlmICh0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pIHtcblx0XHRcdFx0dG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4odGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXNlcklkOiB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10sXG5cdFx0XHRcdHRva2VuXG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn07XG5cblJvY2tldENoYXQuQVBJID0ge1xuXHRoZWxwZXJNZXRob2RzOiBuZXcgTWFwKCksXG5cdGdldFVzZXJBdXRoLFxuXHRBcGlDbGFzczogQVBJXG59O1xuXG5jb25zdCBjcmVhdGVBcGkgPSBmdW5jdGlvbiBfY3JlYXRlQXBpKGVuYWJsZUNvcnMpIHtcblx0aWYgKCFSb2NrZXRDaGF0LkFQSS52MSB8fCBSb2NrZXRDaGF0LkFQSS52MS5fY29uZmlnLmVuYWJsZUNvcnMgIT09IGVuYWJsZUNvcnMpIHtcblx0XHRSb2NrZXRDaGF0LkFQSS52MSA9IG5ldyBBUEkoe1xuXHRcdFx0dmVyc2lvbjogJ3YxJyxcblx0XHRcdHVzZURlZmF1bHRBdXRoOiB0cnVlLFxuXHRcdFx0cHJldHR5SnNvbjogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcsXG5cdFx0XHRlbmFibGVDb3JzLFxuXHRcdFx0YXV0aDogZ2V0VXNlckF1dGgoKVxuXHRcdH0pO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LkFQSS5kZWZhdWx0IHx8IFJvY2tldENoYXQuQVBJLmRlZmF1bHQuX2NvbmZpZy5lbmFibGVDb3JzICE9PSBlbmFibGVDb3JzKSB7XG5cdFx0Um9ja2V0Q2hhdC5BUEkuZGVmYXVsdCA9IG5ldyBBUEkoe1xuXHRcdFx0dXNlRGVmYXVsdEF1dGg6IHRydWUsXG5cdFx0XHRwcmV0dHlKc29uOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jyxcblx0XHRcdGVuYWJsZUNvcnMsXG5cdFx0XHRhdXRoOiBnZXRVc2VyQXV0aCgpXG5cdFx0fSk7XG5cdH1cbn07XG5cbi8vIHJlZ2lzdGVyIHRoZSBBUEkgdG8gYmUgcmUtY3JlYXRlZCBvbmNlIHRoZSBDT1JTLXNldHRpbmcgY2hhbmdlcy5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRjcmVhdGVBcGkodmFsdWUpO1xufSk7XG5cbi8vIGFsc28gY3JlYXRlIHRoZSBBUEkgaW1tZWRpYXRlbHlcbmNyZWF0ZUFwaSghIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW5hYmxlX0NPUlMnKSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdHZW5lcmFsJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VjdGlvbignUkVTVCBBUEknLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0JywgMTAwLCB7IHR5cGU6ICdpbnQnLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRGVmYXVsdF9Db3VudCcsIDUwLCB7IHR5cGU6ICdpbnQnLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfQWxsb3dfSW5maW5pdGVfQ291bnQnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiBmYWxzZSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRW5hYmxlX1NoaWVsZHMnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiBmYWxzZSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX1NoaWVsZF9UeXBlcycsICcqJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQVBJX0VuYWJsZV9TaGllbGRzJywgdmFsdWU6IHRydWUgfSB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0VuYWJsZV9DT1JTJywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfQ09SU19PcmlnaW4nLCAnKicsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogZmFsc2UsIGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0FQSV9FbmFibGVfQ09SUycsIHZhbHVlOiB0cnVlIH0gfSk7XG5cdH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgncmVxdWVzdFBhcmFtcycsIGZ1bmN0aW9uIF9yZXF1ZXN0UGFyYW1zKCkge1xuXHRyZXR1cm4gWydQT1NUJywgJ1BVVCddLmluY2x1ZGVzKHRoaXMucmVxdWVzdC5tZXRob2QpID8gdGhpcy5ib2R5UGFyYW1zIDogdGhpcy5xdWVyeVBhcmFtcztcbn0pO1xuIiwiLy8gSWYgdGhlIGNvdW50IHF1ZXJ5IHBhcmFtIGlzIGhpZ2hlciB0aGFuIHRoZSBcIkFQSV9VcHBlcl9Db3VudF9MaW1pdFwiIHNldHRpbmcsIHRoZW4gd2UgbGltaXQgdGhhdFxuLy8gSWYgdGhlIGNvdW50IHF1ZXJ5IHBhcmFtIGlzbid0IGRlZmluZWQsIHRoZW4gd2Ugc2V0IGl0IHRvIHRoZSBcIkFQSV9EZWZhdWx0X0NvdW50XCIgc2V0dGluZ1xuLy8gSWYgdGhlIGNvdW50IGlzIHplcm8sIHRoZW4gdGhhdCBtZWFucyB1bmxpbWl0ZWQgYW5kIGlzIG9ubHkgYWxsb3dlZCBpZiB0aGUgc2V0dGluZyBcIkFQSV9BbGxvd19JbmZpbml0ZV9Db3VudFwiIGlzIHRydWVcblxuUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2dldFBhZ2luYXRpb25JdGVtcycsIGZ1bmN0aW9uIF9nZXRQYWdpbmF0aW9uSXRlbXMoKSB7XG5cdGNvbnN0IGhhcmRVcHBlckxpbWl0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9VcHBlcl9Db3VudF9MaW1pdCcpIDw9IDAgPyAxMDAgOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0Jyk7XG5cdGNvbnN0IGRlZmF1bHRDb3VudCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRGVmYXVsdF9Db3VudCcpIDw9IDAgPyA1MCA6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRGVmYXVsdF9Db3VudCcpO1xuXHRjb25zdCBvZmZzZXQgPSB0aGlzLnF1ZXJ5UGFyYW1zLm9mZnNldCA/IHBhcnNlSW50KHRoaXMucXVlcnlQYXJhbXMub2Zmc2V0KSA6IDA7XG5cdGxldCBjb3VudCA9IGRlZmF1bHRDb3VudDtcblxuXHQvLyBFbnN1cmUgY291bnQgaXMgYW4gYXBwcm9waWF0ZSBhbW91bnRcblx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdH0gZWxzZSB7XG5cdFx0Y291bnQgPSBkZWZhdWx0Q291bnQ7XG5cdH1cblxuXHRpZiAoY291bnQgPiBoYXJkVXBwZXJMaW1pdCkge1xuXHRcdGNvdW50ID0gaGFyZFVwcGVyTGltaXQ7XG5cdH1cblxuXHRpZiAoY291bnQgPT09IDAgJiYgIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfQWxsb3dfSW5maW5pdGVfQ291bnQnKSkge1xuXHRcdGNvdW50ID0gZGVmYXVsdENvdW50O1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRvZmZzZXQsXG5cdFx0Y291bnRcblx0fTtcbn0pO1xuIiwiLy9Db252ZW5pZW5jZSBtZXRob2QsIGFsbW9zdCBuZWVkIHRvIHR1cm4gaXQgaW50byBhIG1pZGRsZXdhcmUgb2Ygc29ydHNcblJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdnZXRVc2VyRnJvbVBhcmFtcycsIGZ1bmN0aW9uIF9nZXRVc2VyRnJvbVBhcmFtcygpIHtcblx0Y29uc3QgZG9lc250RXhpc3QgPSB7IF9kb2VzbnRFeGlzdDogdHJ1ZSB9O1xuXHRsZXQgdXNlcjtcblx0Y29uc3QgcGFyYW1zID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cblx0aWYgKHBhcmFtcy51c2VySWQgJiYgcGFyYW1zLnVzZXJJZC50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocGFyYW1zLnVzZXJJZCkgfHwgZG9lc250RXhpc3Q7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnVzZXJuYW1lICYmIHBhcmFtcy51c2VybmFtZS50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocGFyYW1zLnVzZXJuYW1lKSB8fCBkb2VzbnRFeGlzdDtcblx0fSBlbHNlIGlmIChwYXJhbXMudXNlciAmJiBwYXJhbXMudXNlci50cmltKCkpIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocGFyYW1zLnVzZXIpIHx8IGRvZXNudEV4aXN0O1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInVzZXJJZFwiIG9yIFwidXNlcm5hbWVcIiBwYXJhbSB3YXMgbm90IHByb3ZpZGVkJyk7XG5cdH1cblxuXHRpZiAodXNlci5fZG9lc250RXhpc3QpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnVGhlIHJlcXVpcmVkIFwidXNlcklkXCIgb3IgXCJ1c2VybmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSB1c2VycycpO1xuXHR9XG5cblx0cmV0dXJuIHVzZXI7XG59KTtcbiIsImNvbnN0IGdldEluZm9Gcm9tVXNlck9iamVjdCA9ICh1c2VyKSA9PiB7XG5cdGNvbnN0IHtcblx0XHRfaWQsXG5cdFx0bmFtZSxcblx0XHRlbWFpbHMsXG5cdFx0c3RhdHVzLFxuXHRcdHN0YXR1c0Nvbm5lY3Rpb24sXG5cdFx0dXNlcm5hbWUsXG5cdFx0dXRjT2Zmc2V0LFxuXHRcdGFjdGl2ZSxcblx0XHRsYW5ndWFnZSxcblx0XHRyb2xlcyxcblx0XHRzZXR0aW5nc1xuXHR9ID0gdXNlcjtcblx0cmV0dXJuIHtcblx0XHRfaWQsXG5cdFx0bmFtZSxcblx0XHRlbWFpbHMsXG5cdFx0c3RhdHVzLFxuXHRcdHN0YXR1c0Nvbm5lY3Rpb24sXG5cdFx0dXNlcm5hbWUsXG5cdFx0dXRjT2Zmc2V0LFxuXHRcdGFjdGl2ZSxcblx0XHRsYW5ndWFnZSxcblx0XHRyb2xlcyxcblx0XHRzZXR0aW5nc1xuXHR9O1xufTtcblxuXG5Sb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgnZ2V0VXNlckluZm8nLCBmdW5jdGlvbiBfZ2V0VXNlckluZm8odXNlcikge1xuXHRjb25zdCBtZSA9IGdldEluZm9Gcm9tVXNlck9iamVjdCh1c2VyKTtcblx0Y29uc3QgaXNWZXJpZmllZEVtYWlsID0gKCkgPT4ge1xuXHRcdGlmIChtZSAmJiBtZS5lbWFpbHMgJiYgQXJyYXkuaXNBcnJheShtZS5lbWFpbHMpKSB7XG5cdFx0XHRyZXR1cm4gbWUuZW1haWxzLmZpbmQoKGVtYWlsKSA9PiBlbWFpbC52ZXJpZmllZCk7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblx0Y29uc3QgZ2V0VXNlclByZWZlcmVuY2VzID0gKCkgPT4ge1xuXHRcdGNvbnN0IGRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCA9ICdBY2NvdW50c19EZWZhdWx0X1VzZXJfUHJlZmVyZW5jZXNfJztcblx0XHRjb25zdCBhbGxEZWZhdWx0VXNlclNldHRpbmdzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQobmV3IFJlZ0V4cChgXiR7IGRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCB9LiokYCkpO1xuXG5cdFx0cmV0dXJuIGFsbERlZmF1bHRVc2VyU2V0dGluZ3MucmVkdWNlKChhY2N1bXVsYXRvciwgc2V0dGluZykgPT4ge1xuXHRcdFx0Y29uc3Qgc2V0dGluZ1dpdGhvdXRQcmVmaXggPSBzZXR0aW5nLmtleS5yZXBsYWNlKGRlZmF1bHRVc2VyU2V0dGluZ1ByZWZpeCwgJyAnKS50cmltKCk7XG5cdFx0XHRhY2N1bXVsYXRvcltzZXR0aW5nV2l0aG91dFByZWZpeF0gPSBSb2NrZXRDaGF0LmdldFVzZXJQcmVmZXJlbmNlKHVzZXIsIHNldHRpbmdXaXRob3V0UHJlZml4KTtcblx0XHRcdHJldHVybiBhY2N1bXVsYXRvcjtcblx0XHR9LCB7fSk7XG5cdH07XG5cdGNvbnN0IHZlcmlmaWVkRW1haWwgPSBpc1ZlcmlmaWVkRW1haWwoKTtcblx0bWUuZW1haWwgPSB2ZXJpZmllZEVtYWlsID8gdmVyaWZpZWRFbWFpbC5hZGRyZXNzIDogdW5kZWZpbmVkO1xuXHRtZS5zZXR0aW5ncyA9IHtcblx0XHRwcmVmZXJlbmNlczogZ2V0VXNlclByZWZlcmVuY2VzKClcblx0fTtcblxuXHRyZXR1cm4gbWU7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdpc1VzZXJGcm9tUGFyYW1zJywgZnVuY3Rpb24gX2lzVXNlckZyb21QYXJhbXMoKSB7XG5cdGNvbnN0IHBhcmFtcyA9IHRoaXMucmVxdWVzdFBhcmFtcygpO1xuXG5cdHJldHVybiAoIXBhcmFtcy51c2VySWQgJiYgIXBhcmFtcy51c2VybmFtZSAmJiAhcGFyYW1zLnVzZXIpIHx8XG5cdFx0KHBhcmFtcy51c2VySWQgJiYgdGhpcy51c2VySWQgPT09IHBhcmFtcy51c2VySWQpIHx8XG5cdFx0KHBhcmFtcy51c2VybmFtZSAmJiB0aGlzLnVzZXIudXNlcm5hbWUgPT09IHBhcmFtcy51c2VybmFtZSkgfHxcblx0XHQocGFyYW1zLnVzZXIgJiYgdGhpcy51c2VyLnVzZXJuYW1lID09PSBwYXJhbXMudXNlcik7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdwYXJzZUpzb25RdWVyeScsIGZ1bmN0aW9uIF9wYXJzZUpzb25RdWVyeSgpIHtcblx0bGV0IHNvcnQ7XG5cdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnNvcnQpIHtcblx0XHR0cnkge1xuXHRcdFx0c29ydCA9IEpTT04ucGFyc2UodGhpcy5xdWVyeVBhcmFtcy5zb3J0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIHNvcnQgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5zb3J0IH1cIjpgLCBlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc29ydCcsIGBJbnZhbGlkIHNvcnQgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMuc29ydCB9XCJgLCB7IGhlbHBlck1ldGhvZDogJ3BhcnNlSnNvblF1ZXJ5JyB9KTtcblx0XHR9XG5cdH1cblxuXHRsZXQgZmllbGRzO1xuXHRpZiAodGhpcy5xdWVyeVBhcmFtcy5maWVsZHMpIHtcblx0XHR0cnkge1xuXHRcdFx0ZmllbGRzID0gSlNPTi5wYXJzZSh0aGlzLnF1ZXJ5UGFyYW1zLmZpZWxkcyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgSW52YWxpZCBmaWVsZHMgcGFyYW1ldGVyIHByb3ZpZGVkIFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5maWVsZHMgfVwiOmAsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWVsZHMnLCBgSW52YWxpZCBmaWVsZHMgcGFyYW1ldGVyIHByb3ZpZGVkOiBcIiR7IHRoaXMucXVlcnlQYXJhbXMuZmllbGRzIH1cImAsIHsgaGVscGVyTWV0aG9kOiAncGFyc2VKc29uUXVlcnknIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8vIFZlcmlmeSB0aGUgdXNlcidzIHNlbGVjdGVkIGZpZWxkcyBvbmx5IGNvbnRhaW5zIG9uZXMgd2hpY2ggdGhlaXIgcm9sZSBhbGxvd3Ncblx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICdvYmplY3QnKSB7XG5cdFx0bGV0IG5vblNlbGVjdGFibGVGaWVsZHMgPSBPYmplY3Qua2V5cyhSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0XHRpZiAodGhpcy5yZXF1ZXN0LnJvdXRlLmluY2x1ZGVzKCcvdjEvdXNlcnMuJykpIHtcblx0XHRcdGNvbnN0IGdldEZpZWxkcyA9ICgpID0+IE9iamVjdC5rZXlzKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSA/IFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlSWZJc1ByaXZpbGVnZWRVc2VyIDogUm9ja2V0Q2hhdC5BUEkudjEubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGUpO1xuXHRcdFx0bm9uU2VsZWN0YWJsZUZpZWxkcyA9IG5vblNlbGVjdGFibGVGaWVsZHMuY29uY2F0KGdldEZpZWxkcygpKTtcblx0XHR9XG5cblx0XHRPYmplY3Qua2V5cyhmaWVsZHMpLmZvckVhY2goKGspID0+IHtcblx0XHRcdGlmIChub25TZWxlY3RhYmxlRmllbGRzLmluY2x1ZGVzKGspIHx8IG5vblNlbGVjdGFibGVGaWVsZHMuaW5jbHVkZXMoay5zcGxpdChSb2NrZXRDaGF0LkFQSS52MS5maWVsZFNlcGFyYXRvcilbMF0pKSB7XG5cdFx0XHRcdGRlbGV0ZSBmaWVsZHNba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBMaW1pdCB0aGUgZmllbGRzIGJ5IGRlZmF1bHRcblx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGRzLCBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0aWYgKHRoaXMucmVxdWVzdC5yb3V0ZS5pbmNsdWRlcygnL3YxL3VzZXJzLicpKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSkge1xuXHRcdFx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbihmaWVsZHMsIFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlSWZJc1ByaXZpbGVnZWRVc2VyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbihmaWVsZHMsIFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgcXVlcnk7XG5cdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5KSB7XG5cdFx0dHJ5IHtcblx0XHRcdHF1ZXJ5ID0gSlNPTi5wYXJzZSh0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIHF1ZXJ5IHBhcmFtZXRlciBwcm92aWRlZCBcIiR7IHRoaXMucXVlcnlQYXJhbXMucXVlcnkgfVwiOmAsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1xdWVyeScsIGBJbnZhbGlkIHF1ZXJ5IHBhcmFtZXRlciBwcm92aWRlZDogXCIkeyB0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5IH1cImAsIHsgaGVscGVyTWV0aG9kOiAncGFyc2VKc29uUXVlcnknIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8vIFZlcmlmeSB0aGUgdXNlciBoYXMgcGVybWlzc2lvbiB0byBxdWVyeSB0aGUgZmllbGRzIHRoZXkgYXJlXG5cdGlmICh0eXBlb2YgcXVlcnkgPT09ICdvYmplY3QnKSB7XG5cdFx0bGV0IG5vblF1ZXJ5YWJsZUZpZWxkcyA9IE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUpO1xuXHRcdGlmICh0aGlzLnJlcXVlc3Qucm91dGUuaW5jbHVkZXMoJy92MS91c2Vycy4nKSkge1xuXHRcdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZnVsbC1vdGhlci11c2VyLWluZm8nKSkge1xuXHRcdFx0XHRub25RdWVyeWFibGVGaWVsZHMgPSBub25RdWVyeWFibGVGaWVsZHMuY29uY2F0KE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlSWZJc1ByaXZpbGVnZWRVc2VyKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub25RdWVyeWFibGVGaWVsZHMgPSBub25RdWVyeWFibGVGaWVsZHMuY29uY2F0KE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXMocXVlcnkpLmZvckVhY2goKGspID0+IHtcblx0XHRcdGlmIChub25RdWVyeWFibGVGaWVsZHMuaW5jbHVkZXMoaykgfHwgbm9uUXVlcnlhYmxlRmllbGRzLmluY2x1ZGVzKGsuc3BsaXQoUm9ja2V0Q2hhdC5BUEkudjEuZmllbGRTZXBhcmF0b3IpWzBdKSkge1xuXHRcdFx0XHRkZWxldGUgcXVlcnlba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHNvcnQsXG5cdFx0ZmllbGRzLFxuXHRcdHF1ZXJ5XG5cdH07XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdkZXByZWNhdGlvbldhcm5pbmcnLCBmdW5jdGlvbiBfZGVwcmVjYXRpb25XYXJuaW5nKHsgZW5kcG9pbnQsIHZlcnNpb25XaWxsQmVSZW1vdmUsIHJlc3BvbnNlIH0pIHtcblx0Y29uc3Qgd2FybmluZ01lc3NhZ2UgPSBgVGhlIGVuZHBvaW50IFwiJHsgZW5kcG9pbnQgfVwiIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBhZnRlciB2ZXJzaW9uICR7IHZlcnNpb25XaWxsQmVSZW1vdmUgfWA7XG5cdGNvbnNvbGUud2Fybih3YXJuaW5nTWVzc2FnZSk7XG5cdGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jykge1xuXHRcdHJldHVybiB7XG5cdFx0XHR3YXJuaW5nOiB3YXJuaW5nTWVzc2FnZSxcblx0XHRcdC4uLnJlc3BvbnNlXG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiByZXNwb25zZTtcbn0pO1xuXG4iLCJSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgnZ2V0TG9nZ2VkSW5Vc2VyJywgZnVuY3Rpb24gX2dldExvZ2dlZEluVXNlcigpIHtcblx0bGV0IHVzZXI7XG5cblx0aWYgKHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSAmJiB0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC11c2VyLWlkJ10pIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0XHQnX2lkJzogdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtdXNlci1pZCddLFxuXHRcdFx0J3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbic6IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbih0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pXG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gdXNlcjtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2luc2VydFVzZXJPYmplY3QnLCBmdW5jdGlvbiBfYWRkVXNlclRvT2JqZWN0KHsgb2JqZWN0LCB1c2VySWQgfSkge1xuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblx0b2JqZWN0LnVzZXIgPSB7IH07XG5cdGlmICh1c2VyKSB7XG5cdFx0b2JqZWN0LnVzZXIgPSB7XG5cdFx0XHRfaWQ6IHVzZXJJZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLFxuXHRcdFx0bmFtZTogdXNlci5uYW1lXG5cdFx0fTtcblx0fVxuXG5cblx0cmV0dXJuIG9iamVjdDtcbn0pO1xuXG4iLCJSb2NrZXRDaGF0LkFQSS5kZWZhdWx0LmFkZFJvdXRlKCdpbmZvJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpO1xuXG5cdFx0aWYgKHVzZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKHVzZXIuX2lkLCAnYWRtaW4nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRpbmZvOiBSb2NrZXRDaGF0LkluZm9cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHZlcnNpb246IFJvY2tldENoYXQuSW5mby52ZXJzaW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbi8vUmV0dXJucyB0aGUgY2hhbm5lbCBJRiBmb3VuZCBvdGhlcndpc2UgaXQgd2lsbCByZXR1cm4gdGhlIGZhaWx1cmUgb2Ygd2h5IGl0IGRpZG4ndC4gQ2hlY2sgdGhlIGBzdGF0dXNDb2RlYCBwcm9wZXJ0eVxuZnVuY3Rpb24gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zLCBjaGVja2VkQXJjaGl2ZWQgPSB0cnVlIH0pIHtcblx0aWYgKCghcGFyYW1zLnJvb21JZCB8fCAhcGFyYW1zLnJvb21JZC50cmltKCkpICYmICghcGFyYW1zLnJvb21OYW1lIHx8ICFwYXJhbXMucm9vbU5hbWUudHJpbSgpKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb21pZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHBhcmFtZXRlciBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0Y29uc3QgZmllbGRzID0geyAuLi5Sb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH07XG5cblx0bGV0IHJvb207XG5cdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHBhcmFtcy5yb29tSWQsIHsgZmllbGRzIH0pO1xuXHR9IGVsc2UgaWYgKHBhcmFtcy5yb29tTmFtZSkge1xuXHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHBhcmFtcy5yb29tTmFtZSwgeyBmaWVsZHMgfSk7XG5cdH1cblxuXHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnYycpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGNoYW5uZWwnKTtcblx0fVxuXG5cdGlmIChjaGVja2VkQXJjaGl2ZWQgJiYgcm9vbS5hcmNoaXZlZCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tYXJjaGl2ZWQnLCBgVGhlIGNoYW5uZWwsICR7IHJvb20ubmFtZSB9LCBpcyBhcmNoaXZlZGApO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5hZGRBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkQWxsVXNlclRvUm9vbScsIGZpbmRSZXN1bHQuX2lkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlVXNlcnNPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZE1vZGVyYXRvcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZE93bmVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tT3duZXInLCBmaW5kUmVzdWx0Ll9pZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5hcmNoaXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FyY2hpdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cbi8qKlxuIERFUFJFQ0FURURcbiAvLyBUT0RPOiBSZW1vdmUgdGhpcyBhZnRlciB0aHJlZSB2ZXJzaW9ucyBoYXZlIGJlZW4gcmVsZWFzZWQuIFRoYXQgbWVhbnMgYXQgMC42NyB0aGlzIHNob3VsZCBiZSBnb25lLlxuICoqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmNsZWFuSGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW1ldGVyIFwibGF0ZXN0XCIgaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMub2xkZXN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbWV0ZXIgXCJvbGRlc3RcIiBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBsYXRlc3QgPSBuZXcgRGF0ZSh0aGlzLmJvZHlQYXJhbXMubGF0ZXN0KTtcblx0XHRjb25zdCBvbGRlc3QgPSBuZXcgRGF0ZSh0aGlzLmJvZHlQYXJhbXMub2xkZXN0KTtcblxuXHRcdGxldCBpbmNsdXNpdmUgPSBmYWxzZTtcblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5pbmNsdXNpdmUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLmJvZHlQYXJhbXMuaW5jbHVzaXZlO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdjbGVhbkNoYW5uZWxIaXN0b3J5JywgeyByb29tSWQ6IGZpbmRSZXN1bHQuX2lkLCBsYXRlc3QsIG9sZGVzdCwgaW5jbHVzaXZlIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5kZXByZWNhdGlvbldhcm5pbmcoe1xuXHRcdFx0ZW5kcG9pbnQ6ICdjaGFubmVscy5jbGVhbkhpc3RvcnknLFxuXHRcdFx0dmVyc2lvbldpbGxCZVJlbW92ZTogJ3YwLjY3J1xuXHRcdH0pKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jbG9zZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGNvbnN0IHN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKGZpbmRSZXN1bHQuX2lkLCB0aGlzLnVzZXJJZCk7XG5cblx0XHRpZiAoIXN1Yikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSB1c2VyL2NhbGxlZSBpcyBub3QgaW4gdGhlIGNoYW5uZWwgXCIkeyBmaW5kUmVzdWx0Lm5hbWUgfS5gKTtcblx0XHR9XG5cblx0XHRpZiAoIXN1Yi5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIGNoYW5uZWwsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jb3VudGVycycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGFjY2VzcyA9IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpO1xuXHRcdGNvbnN0IHVzZXJJZCA9IHRoaXMucmVxdWVzdFBhcmFtcygpLnVzZXJJZDtcblx0XHRsZXQgdXNlciA9IHRoaXMudXNlcklkO1xuXHRcdGxldCB1bnJlYWRzID0gbnVsbDtcblx0XHRsZXQgdXNlck1lbnRpb25zID0gbnVsbDtcblx0XHRsZXQgdW5yZWFkc0Zyb20gPSBudWxsO1xuXHRcdGxldCBqb2luZWQgPSBmYWxzZTtcblx0XHRsZXQgbXNncyA9IG51bGw7XG5cdFx0bGV0IGxhdGVzdCA9IG51bGw7XG5cdFx0bGV0IG1lbWJlcnMgPSBudWxsO1xuXG5cdFx0aWYgKHVzZXJJZCkge1xuXHRcdFx0aWYgKCFhY2Nlc3MpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdFx0fVxuXHRcdFx0dXNlciA9IHVzZXJJZDtcblx0XHR9XG5cdFx0Y29uc3Qgcm9vbSA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7XG5cdFx0XHRwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLFxuXHRcdFx0cmV0dXJuVXNlcm5hbWVzOiB0cnVlXG5cdFx0fSk7XG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIpO1xuXHRcdGNvbnN0IGxtID0gcm9vbS5sbSA/IHJvb20ubG0gOiByb29tLl91cGRhdGVkQXQ7XG5cblx0XHRpZiAodHlwZW9mIHN1YnNjcmlwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgc3Vic2NyaXB0aW9uLm9wZW4pIHtcblx0XHRcdGlmIChzdWJzY3JpcHRpb24ubHMpIHtcblx0XHRcdFx0dW5yZWFkcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNvdW50VmlzaWJsZUJ5Um9vbUlkQmV0d2VlblRpbWVzdGFtcHNJbmNsdXNpdmUoc3Vic2NyaXB0aW9uLnJpZCwgc3Vic2NyaXB0aW9uLmxzLCBsbSk7XG5cdFx0XHRcdHVucmVhZHNGcm9tID0gc3Vic2NyaXB0aW9uLmxzO1xuXHRcdFx0fVxuXHRcdFx0dXNlck1lbnRpb25zID0gc3Vic2NyaXB0aW9uLnVzZXJNZW50aW9ucztcblx0XHRcdGpvaW5lZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGFjY2VzcyB8fCBqb2luZWQpIHtcblx0XHRcdG1zZ3MgPSByb29tLm1zZ3M7XG5cdFx0XHRsYXRlc3QgPSBsbTtcblx0XHRcdG1lbWJlcnMgPSByb29tLnVzZXJzQ291bnQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0am9pbmVkLFxuXHRcdFx0bWVtYmVycyxcblx0XHRcdHVucmVhZHMsXG5cdFx0XHR1bnJlYWRzRnJvbSxcblx0XHRcdG1zZ3MsXG5cdFx0XHRsYXRlc3QsXG5cdFx0XHR1c2VyTWVudGlvbnNcblx0XHR9KTtcblx0fVxufSk7XG5cbi8vIENoYW5uZWwgLT4gY3JlYXRlXG5cbmZ1bmN0aW9uIGNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IocGFyYW1zKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHBhcmFtcy51c2VyLnZhbHVlLCAnY3JlYXRlLWMnKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcigndW5hdXRob3JpemVkJyk7XG5cdH1cblxuXHRpZiAoIXBhcmFtcy5uYW1lIHx8ICFwYXJhbXMubmFtZS52YWx1ZSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgUGFyYW0gXCIkeyBwYXJhbXMubmFtZS5rZXkgfVwiIGlzIHJlcXVpcmVkYCk7XG5cdH1cblxuXHRpZiAocGFyYW1zLm1lbWJlcnMgJiYgcGFyYW1zLm1lbWJlcnMudmFsdWUgJiYgIV8uaXNBcnJheShwYXJhbXMubWVtYmVycy52YWx1ZSkpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFBhcmFtIFwiJHsgcGFyYW1zLm1lbWJlcnMua2V5IH1cIiBtdXN0IGJlIGFuIGFycmF5IGlmIHByb3ZpZGVkYCk7XG5cdH1cblxuXHRpZiAocGFyYW1zLmN1c3RvbUZpZWxkcyAmJiBwYXJhbXMuY3VzdG9tRmllbGRzLnZhbHVlICYmICEodHlwZW9mIHBhcmFtcy5jdXN0b21GaWVsZHMudmFsdWUgPT09ICdvYmplY3QnKSkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgUGFyYW0gXCIkeyBwYXJhbXMuY3VzdG9tRmllbGRzLmtleSB9XCIgbXVzdCBiZSBhbiBvYmplY3QgaWYgcHJvdmlkZWRgKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDaGFubmVsKHVzZXJJZCwgcGFyYW1zKSB7XG5cdGxldCByZWFkT25seSA9IGZhbHNlO1xuXHRpZiAodHlwZW9mIHBhcmFtcy5yZWFkT25seSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRyZWFkT25seSA9IHBhcmFtcy5yZWFkT25seTtcblx0fVxuXG5cdGxldCBpZDtcblx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRpZCA9IE1ldGVvci5jYWxsKCdjcmVhdGVDaGFubmVsJywgcGFyYW1zLm5hbWUsIHBhcmFtcy5tZW1iZXJzID8gcGFyYW1zLm1lbWJlcnMgOiBbXSwgcmVhZE9ubHksIHBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlkLnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0fTtcbn1cblxuUm9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMgPSB7fTtcblJvY2tldENoYXQuQVBJLmNoYW5uZWxzLmNyZWF0ZSA9IHtcblx0dmFsaWRhdGU6IGNyZWF0ZUNoYW5uZWxWYWxpZGF0b3IsXG5cdGV4ZWN1dGU6IGNyZWF0ZUNoYW5uZWxcbn07XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jcmVhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgdXNlcklkID0gdGhpcy51c2VySWQ7XG5cdFx0Y29uc3QgYm9keVBhcmFtcyA9IHRoaXMuYm9keVBhcmFtcztcblxuXHRcdGxldCBlcnJvcjtcblxuXHRcdHRyeSB7XG5cdFx0XHRSb2NrZXRDaGF0LkFQSS5jaGFubmVscy5jcmVhdGUudmFsaWRhdGUoe1xuXHRcdFx0XHR1c2VyOiB7XG5cdFx0XHRcdFx0dmFsdWU6IHVzZXJJZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRuYW1lOiB7XG5cdFx0XHRcdFx0dmFsdWU6IGJvZHlQYXJhbXMubmFtZSxcblx0XHRcdFx0XHRrZXk6ICduYW1lJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRtZW1iZXJzOiB7XG5cdFx0XHRcdFx0dmFsdWU6IGJvZHlQYXJhbXMubWVtYmVycyxcblx0XHRcdFx0XHRrZXk6ICdtZW1iZXJzJ1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoZS5tZXNzYWdlID09PSAndW5hdXRob3JpemVkJykge1xuXHRcdFx0XHRlcnJvciA9IFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZXJyb3IgPSBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRyZXR1cm4gZXJyb3I7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoUm9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMuY3JlYXRlLmV4ZWN1dGUodXNlcklkLCBib2R5UGFyYW1zKSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2VyYXNlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IGZpbmRSZXN1bHRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5maWxlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXHRcdGNvbnN0IGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0ID0gKGZpbGUpID0+IHtcblx0XHRcdGlmIChmaWxlLnVzZXJJZCkge1xuXHRcdFx0XHRmaWxlID0gdGhpcy5pbnNlcnRVc2VyT2JqZWN0KHsgb2JqZWN0OiBmaWxlLCB1c2VySWQ6IGZpbGUudXNlcklkIH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCB9KTtcblxuXHRcdGNvbnN0IGZpbGVzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGZpbGVzOiBmaWxlcy5tYXAoYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QpLFxuXHRcdFx0Y291bnQ6XG5cdFx0XHRmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZ2V0SW50ZWdyYXRpb25zJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGxldCBpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgPSB0cnVlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyA9PT0gJ3RydWUnO1xuXHRcdH1cblxuXHRcdGxldCBvdXJRdWVyeSA9IHtcblx0XHRcdGNoYW5uZWw6IGAjJHsgZmluZFJlc3VsdC5uYW1lIH1gXG5cdFx0fTtcblxuXHRcdGlmIChpbmNsdWRlQWxsUHVibGljQ2hhbm5lbHMpIHtcblx0XHRcdG91clF1ZXJ5LmNoYW5uZWwgPSB7XG5cdFx0XHRcdCRpbjogW291clF1ZXJ5LmNoYW5uZWwsICdhbGxfcHVibGljX2NoYW5uZWxzJ11cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3QgaW50ZWdyYXRpb25zID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfY3JlYXRlZEF0OiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW50ZWdyYXRpb25zLFxuXHRcdFx0Y291bnQ6IGludGVncmF0aW9ucy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5oaXN0b3J5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgbGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRsYXRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBvbGRlc3REYXRlID0gdW5kZWZpbmVkO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0b2xkZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRsZXQgY291bnQgPSAyMDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5jb3VudCkge1xuXHRcdFx0Y291bnQgPSBwYXJzZUludCh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KTtcblx0XHR9XG5cblx0XHRsZXQgdW5yZWFkcyA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHMpIHtcblx0XHRcdHVucmVhZHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHM7XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBNZXRlb3IuY2FsbCgnZ2V0Q2hhbm5lbEhpc3RvcnknLCB7XG5cdFx0XHRcdHJpZDogZmluZFJlc3VsdC5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5pbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5pbnZpdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFVzZXJUb1Jvb20nLCB7IHJpZDogZmluZFJlc3VsdC5faWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuam9pbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdqb2luUm9vbScsIGZpbmRSZXN1bHQuX2lkLCB0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMua2ljaycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlVXNlckZyb21Sb29tJywgeyByaWQ6IGZpbmRSZXN1bHQuX2lkLCB1c2VybmFtZTogdXNlci51c2VybmFtZSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxlYXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2xlYXZlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDoge1xuXHRcdC8vVGhpcyBpcyBkZWZpbmVkIGFzIHN1Y2ggb25seSB0byBwcm92aWRlIGFuIGV4YW1wbGUgb2YgaG93IHRoZSByb3V0ZXMgY2FuIGJlIGRlZmluZWQgOlhcblx0XHRhY3Rpb24oKSB7XG5cdFx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRcdGNvbnN0IGhhc1Blcm1pc3Npb25Ub1NlZUFsbFB1YmxpY0NoYW5uZWxzID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1jLXJvb20nKTtcblxuXHRcdFx0Y29uc3Qgb3VyUXVlcnkgPSB7IC4uLnF1ZXJ5LCB0OiAnYycgfTtcblxuXHRcdFx0aWYgKCFoYXNQZXJtaXNzaW9uVG9TZWVBbGxQdWJsaWNDaGFubmVscykge1xuXHRcdFx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctam9pbmVkLXJvb20nKSkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCByb29tSWRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlVc2VySWRBbmRUeXBlKHRoaXMudXNlcklkLCAnYycsIHsgZmllbGRzOiB7IHJpZDogMSB9IH0pLmZldGNoKCkubWFwKHMgPT4gcy5yaWQpO1xuXHRcdFx0XHRvdXJRdWVyeS5faWQgPSB7ICRpbjogcm9vbUlkcyB9O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBjdXJzb3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0XHRmaWVsZHNcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCB0b3RhbCA9IGN1cnNvci5jb3VudCgpO1xuXG5cdFx0XHRjb25zdCByb29tcyA9IGN1cnNvci5mZXRjaCgpO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGNoYW5uZWxzOiByb29tcyxcblx0XHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdFx0b2Zmc2V0LFxuXHRcdFx0XHR0b3RhbFxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmxpc3Quam9pbmVkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzIH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHQvLyBUT0RPOiBDQUNIRTogQWRkIEJyZWFja2luZyBub3RpY2Ugc2luY2Ugd2UgcmVtb3ZlZCB0aGUgcXVlcnkgcGFyYW1cblx0XHRjb25zdCBjdXJzb3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlTdWJzY3JpcHRpb25UeXBlQW5kVXNlcklkKCdjJywgdGhpcy51c2VySWQsIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KTtcblxuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSBjdXJzb3IuY291bnQoKTtcblx0XHRjb25zdCByb29tcyA9IGN1cnNvci5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbHM6IHJvb21zLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdHRvdGFsOiB0b3RhbENvdW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMubWVtYmVycycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoe1xuXHRcdFx0cGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSxcblx0XHRcdGNoZWNrZWRBcmNoaXZlZDogZmFsc2Vcblx0XHR9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LmJyb2FkY2FzdCAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1icm9hZGNhc3QtbWVtYmVyLWxpc3QnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQgPSB7fSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9ucyA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkKGZpbmRSZXN1bHQuX2lkLCB7XG5cdFx0XHRmaWVsZHM6IHsgJ3UuX2lkJzogMSB9LFxuXHRcdFx0c29ydDogeyAndS51c2VybmFtZSc6IHNvcnQudXNlcm5hbWUgIT0gbnVsbCA/IHNvcnQudXNlcm5hbWUgOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnRcblx0XHR9KTtcblxuXHRcdGNvbnN0IHRvdGFsID0gc3Vic2NyaXB0aW9ucy5jb3VudCgpO1xuXG5cdFx0Y29uc3QgbWVtYmVycyA9IHN1YnNjcmlwdGlvbnMuZmV0Y2goKS5tYXAocyA9PiBzLnUgJiYgcy51Ll9pZCk7XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoeyBfaWQ6IHsgJGluOiBtZW1iZXJzIH0gfSwge1xuXHRcdFx0ZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEsIG5hbWU6IDEsIHN0YXR1czogMSwgdXRjT2Zmc2V0OiAxIH0sXG5cdFx0XHRzb3J0OiB7IHVzZXJuYW1lOiAgc29ydC51c2VybmFtZSAhPSBudWxsID8gc29ydC51c2VybmFtZSA6IDEgfVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW1iZXJzOiB1c2Vycyxcblx0XHRcdGNvdW50OiB1c2Vycy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLm1lc3NhZ2VzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7XG5cdFx0XHRwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLFxuXHRcdFx0Y2hlY2tlZEFyY2hpdmVkOiBmYWxzZVxuXHRcdH0pO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCB9KTtcblxuXHRcdC8vU3BlY2lhbCBjaGVjayBmb3IgdGhlIHBlcm1pc3Npb25zXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctam9pbmVkLXJvb20nKSAmJiAhUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQoZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctYy1yb29tJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBjdXJzb3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdHM6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KTtcblxuXHRcdGNvbnN0IHRvdGFsID0gY3Vyc29yLmNvdW50KCk7XG5cdFx0Y29uc3QgbWVzc2FnZXMgPSBjdXJzb3IuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzLFxuXHRcdFx0Y291bnQ6IG1lc3NhZ2VzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsXG5cdFx0fSk7XG5cdH1cbn0pO1xuLy8gVE9ETzogQ0FDSEU6IEkgZG9udCBsaWtlIHRoaXMgbWV0aG9kKCBmdW5jdGlvbmFsaXR5IGFuZCBob3cgd2UgaW1wbGVtZW50ZWQgKSBpdHMgdmVyeSBleHBlbnNpdmVcbi8vIFRPRE8gY2hlY2sgaWYgdGhpcyBjb2RlIGlzIGJldHRlciBvciBub3Rcbi8vIFJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5vbmxpbmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG4vLyBcdGdldCgpIHtcbi8vIFx0XHRjb25zdCB7IHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG4vLyBcdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAnYycgfSk7XG5cbi8vIFx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZShvdXJRdWVyeSk7XG5cbi8vIFx0XHRpZiAocm9vbSA9PSBudWxsKSB7XG4vLyBcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQ2hhbm5lbCBkb2VzIG5vdCBleGlzdHMnKTtcbi8vIFx0XHR9XG5cbi8vIFx0XHRjb25zdCBpZHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmQoeyByaWQ6IHJvb20uX2lkIH0sIHsgZmllbGRzOiB7ICd1Ll9pZCc6IDEgfSB9KS5mZXRjaCgpLm1hcChzdWIgPT4gc3ViLnUuX2lkKTtcblxuLy8gXHRcdGNvbnN0IG9ubGluZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoe1xuLy8gXHRcdFx0dXNlcm5hbWU6IHsgJGV4aXN0czogMSB9LFxuLy8gXHRcdFx0X2lkOiB7ICRpbjogaWRzIH0sXG4vLyBcdFx0XHRzdGF0dXM6IHsgJGluOiBbJ29ubGluZScsICdhd2F5JywgJ2J1c3knXSB9XG4vLyBcdFx0fSwge1xuLy8gXHRcdFx0ZmllbGRzOiB7IHVzZXJuYW1lOiAxIH1cbi8vIFx0XHR9KS5mZXRjaCgpO1xuXG4vLyBcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuLy8gXHRcdFx0b25saW5lXG4vLyBcdFx0fSk7XG4vLyBcdH1cbi8vIH0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMub25saW5lJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgdDogJ2MnIH0pO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUob3VyUXVlcnkpO1xuXG5cdFx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0NoYW5uZWwgZG9lcyBub3QgZXhpc3RzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb25saW5lID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZFVzZXJzTm90T2ZmbGluZSh7XG5cdFx0XHRmaWVsZHM6IHsgdXNlcm5hbWU6IDEgfVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRjb25zdCBvbmxpbmVJblJvb20gPSBbXTtcblx0XHRvbmxpbmUuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb3QuX2lkLCB1c2VyLl9pZCwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0XHRpZiAoc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRcdG9ubGluZUluUm9vbS5wdXNoKHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0b25saW5lOiBvbmxpbmVJblJvb21cblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5vcGVuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0Y29uc3Qgc3ViID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQoZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghc3ViKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHVzZXIvY2FsbGVlIGlzIG5vdCBpbiB0aGUgY2hhbm5lbCBcIiR7IGZpbmRSZXN1bHQubmFtZSB9XCIuYCk7XG5cdFx0fVxuXG5cdFx0aWYgKHN1Yi5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIGNoYW5uZWwsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IG9wZW4gdG8gdGhlIHNlbmRlcmApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMucmVtb3ZlTW9kZXJhdG9yJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tTW9kZXJhdG9yJywgZmluZFJlc3VsdC5faWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMucmVtb3ZlT3duZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVJvb21Pd25lcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnJlbmFtZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5uYW1lIHx8ICF0aGlzLmJvZHlQYXJhbXMubmFtZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogeyByb29tSWQ6IHRoaXMuYm9keVBhcmFtcy5yb29tSWQgfSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0Lm5hbWUgPT09IHRoaXMuYm9keVBhcmFtcy5uYW1lKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgbmFtZSBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIHJlbmFtZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21OYW1lJywgdGhpcy5ib2R5UGFyYW1zLm5hbWUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0Q3VzdG9tRmllbGRzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyB8fCAhKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzID09PSAnb2JqZWN0JykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiY3VzdG9tRmllbGRzXCIgaXMgcmVxdWlyZWQgd2l0aCBhIHR5cGUgbGlrZSBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbUN1c3RvbUZpZWxkcycsIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0RGVmYXVsdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5kZWZhdWx0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJkZWZhdWx0XCIgaXMgcmVxdWlyZWQnLCAnZXJyb3ItY2hhbm5lbHMtc2V0ZGVmYXVsdC1pcy1zYW1lJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5kZWZhdWx0ID09PSB0aGlzLmJvZHlQYXJhbXMuZGVmYXVsdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIGRlZmF1bHQgc2V0dGluZyBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJywgJ2Vycm9yLWNoYW5uZWxzLXNldGRlZmF1bHQtbWlzc2luZy1kZWZhdWx0LXBhcmFtJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ2RlZmF1bHQnLCB0aGlzLmJvZHlQYXJhbXMuZGVmYXVsdC50b1N0cmluZygpKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldERlc2NyaXB0aW9uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uIHx8ICF0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24udHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImRlc2NyaXB0aW9uXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LmRlc2NyaXB0aW9uID09PSB0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCBkZXNjcmlwdGlvbiBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRkZXNjcmlwdGlvbjogdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0Sm9pbkNvZGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUgfHwgIXRoaXMuYm9keVBhcmFtcy5qb2luQ29kZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiam9pbkNvZGVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ2pvaW5Db2RlJywgdGhpcy5ib2R5UGFyYW1zLmpvaW5Db2RlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFB1cnBvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMucHVycG9zZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInB1cnBvc2VcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQuZGVzY3JpcHRpb24gPT09IHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgcHVycG9zZSAoZGVzY3JpcHRpb24pIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbURlc2NyaXB0aW9uJywgdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHVycG9zZTogdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRSZWFkT25seScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwicmVhZE9ubHlcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQucm8gPT09IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIHJlYWQgb25seSBzZXR0aW5nIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncmVhZE9ubHknLCB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0VG9waWMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudG9waWMgfHwgIXRoaXMuYm9keVBhcmFtcy50b3BpYy50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwidG9waWNcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudG9waWMgPT09IHRoaXMuYm9keVBhcmFtcy50b3BpYykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIHRvcGljIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRBbm5vdW5jZW1lbnQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuYW5ub3VuY2VtZW50IHx8ICF0aGlzLmJvZHlQYXJhbXMuYW5ub3VuY2VtZW50LnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJhbm5vdW5jZW1lbnRcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21Bbm5vdW5jZW1lbnQnLCB0aGlzLmJvZHlQYXJhbXMuYW5ub3VuY2VtZW50KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGFubm91bmNlbWVudDogdGhpcy5ib2R5UGFyYW1zLmFubm91bmNlbWVudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFR5cGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudHlwZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnR5cGUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInR5cGVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudCA9PT0gdGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCB0eXBlIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbVR5cGUnLCB0aGlzLmJvZHlQYXJhbXMudHlwZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy51bmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRpZiAoIWZpbmRSZXN1bHQuYXJjaGl2ZWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGUgY2hhbm5lbCwgJHsgZmluZFJlc3VsdC5uYW1lIH0sIGlzIG5vdCBhcmNoaXZlZGApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCd1bmFyY2hpdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5nZXRBbGxVc2VyTWVudGlvbnNCeUNoYW5uZWwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCB9ID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0aWYgKCFyb29tSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcmVxdWVzdCBwYXJhbSBcInJvb21JZFwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVudGlvbnMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0VXNlck1lbnRpb25zQnlDaGFubmVsJywge1xuXHRcdFx0cm9vbUlkLFxuXHRcdFx0b3B0aW9uczoge1xuXHRcdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdHM6IDEgfSxcblx0XHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0XHRsaW1pdDogY291bnRcblx0XHRcdH1cblx0XHR9KSk7XG5cblx0XHRjb25zdCBhbGxNZW50aW9ucyA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwnLCB7XG5cdFx0XHRyb29tSWQsXG5cdFx0XHRvcHRpb25zOiB7fVxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lbnRpb25zLFxuXHRcdFx0Y291bnQ6IG1lbnRpb25zLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBhbGxNZW50aW9ucy5sZW5ndGhcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5yb2xlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3Qgcm9sZXMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0Um9vbVJvbGVzJywgZmluZFJlc3VsdC5faWQpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJvbGVzXG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IEJ1c2JveSBmcm9tICdidXNib3knO1xuXG5mdW5jdGlvbiBmaW5kUm9vbUJ5SWRPck5hbWUoeyBwYXJhbXMsIGNoZWNrZWRBcmNoaXZlZCA9IHRydWV9KSB7XG5cdGlmICgoIXBhcmFtcy5yb29tSWQgfHwgIXBhcmFtcy5yb29tSWQudHJpbSgpKSAmJiAoIXBhcmFtcy5yb29tTmFtZSB8fCAhcGFyYW1zLnJvb21OYW1lLnRyaW0oKSkpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29taWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSBwYXJhbWV0ZXIgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgaXMgcmVxdWlyZWQnKTtcblx0fVxuXG5cdGNvbnN0IGZpZWxkcyA9IHsgLi4uUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9O1xuXG5cdGxldCByb29tO1xuXHRpZiAocGFyYW1zLnJvb21JZCkge1xuXHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChwYXJhbXMucm9vbUlkLCB7IGZpZWxkcyB9KTtcblx0fSBlbHNlIGlmIChwYXJhbXMucm9vbU5hbWUpIHtcblx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShwYXJhbXMucm9vbU5hbWUsIHsgZmllbGRzIH0pO1xuXHR9XG5cdGlmICghcm9vbSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgY2hhbm5lbCcpO1xuXHR9XG5cdGlmIChjaGVja2VkQXJjaGl2ZWQgJiYgcm9vbS5hcmNoaXZlZCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tYXJjaGl2ZWQnLCBgVGhlIGNoYW5uZWwsICR7IHJvb20ubmFtZSB9LCBpcyBhcmNoaXZlZGApO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5nZXQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHVwZGF0ZWRTaW5jZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGxldCB1cGRhdGVkU2luY2VEYXRlO1xuXHRcdGlmICh1cGRhdGVkU2luY2UpIHtcblx0XHRcdGlmIChpc05hTihEYXRlLnBhcnNlKHVwZGF0ZWRTaW5jZSkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVwZGF0ZWRTaW5jZS1wYXJhbS1pbnZhbGlkJywgJ1RoZSBcInVwZGF0ZWRTaW5jZVwiIHF1ZXJ5IHBhcmFtZXRlciBtdXN0IGJlIGEgdmFsaWQgZGF0ZS4nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVwZGF0ZWRTaW5jZURhdGUgPSBuZXcgRGF0ZSh1cGRhdGVkU2luY2UpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ3Jvb21zL2dldCcsIHVwZGF0ZWRTaW5jZURhdGUpKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcblx0XHRcdHJlc3VsdCA9IHtcblx0XHRcdFx0dXBkYXRlOiByZXN1bHQsXG5cdFx0XHRcdHJlbW92ZTogW11cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy51cGxvYWQvOnJpZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCByb29tID0gTWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCB0aGlzLnVybFBhcmFtcy5yaWQsIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGJ1c2JveSA9IG5ldyBCdXNib3koeyBoZWFkZXJzOiB0aGlzLnJlcXVlc3QuaGVhZGVycyB9KTtcblx0XHRjb25zdCBmaWxlcyA9IFtdO1xuXHRcdGNvbnN0IGZpZWxkcyA9IHt9O1xuXG5cdFx0TWV0ZW9yLndyYXBBc3luYygoY2FsbGJhY2spID0+IHtcblx0XHRcdGJ1c2JveS5vbignZmlsZScsIChmaWVsZG5hbWUsIGZpbGUsIGZpbGVuYW1lLCBlbmNvZGluZywgbWltZXR5cGUpID0+IHtcblx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gJ2ZpbGUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZpbGVzLnB1c2gobmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWVsZCcpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGZpbGVEYXRlID0gW107XG5cdFx0XHRcdGZpbGUub24oJ2RhdGEnLCBkYXRhID0+IGZpbGVEYXRlLnB1c2goZGF0YSkpO1xuXG5cdFx0XHRcdGZpbGUub24oJ2VuZCcsICgpID0+IHtcblx0XHRcdFx0XHRmaWxlcy5wdXNoKHsgZmllbGRuYW1lLCBmaWxlLCBmaWxlbmFtZSwgZW5jb2RpbmcsIG1pbWV0eXBlLCBmaWxlQnVmZmVyOiBCdWZmZXIuY29uY2F0KGZpbGVEYXRlKSB9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0YnVzYm95Lm9uKCdmaWVsZCcsIChmaWVsZG5hbWUsIHZhbHVlKSA9PiBmaWVsZHNbZmllbGRuYW1lXSA9IHZhbHVlKTtcblxuXHRcdFx0YnVzYm95Lm9uKCdmaW5pc2gnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IGNhbGxiYWNrKCkpKTtcblxuXHRcdFx0dGhpcy5yZXF1ZXN0LnBpcGUoYnVzYm95KTtcblx0XHR9KSgpO1xuXG5cdFx0aWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ZpbGUgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRpZiAoZmlsZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0p1c3QgMSBmaWxlIGlzIGFsbG93ZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlID0gZmlsZXNbMF07XG5cblx0XHRjb25zdCBmaWxlU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJyk7XG5cblx0XHRjb25zdCBkZXRhaWxzID0ge1xuXHRcdFx0bmFtZTogZmlsZS5maWxlbmFtZSxcblx0XHRcdHNpemU6IGZpbGUuZmlsZUJ1ZmZlci5sZW5ndGgsXG5cdFx0XHR0eXBlOiBmaWxlLm1pbWV0eXBlLFxuXHRcdFx0cmlkOiB0aGlzLnVybFBhcmFtcy5yaWQsXG5cdFx0XHR1c2VySWQ6IHRoaXMudXNlcklkXG5cdFx0fTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdGNvbnN0IHVwbG9hZGVkRmlsZSA9IE1ldGVvci53cmFwQXN5bmMoZmlsZVN0b3JlLmluc2VydC5iaW5kKGZpbGVTdG9yZSkpKGRldGFpbHMsIGZpbGUuZmlsZUJ1ZmZlcik7XG5cblx0XHRcdHVwbG9hZGVkRmlsZS5kZXNjcmlwdGlvbiA9IGZpZWxkcy5kZXNjcmlwdGlvbjtcblxuXHRcdFx0ZGVsZXRlIGZpZWxkcy5kZXNjcmlwdGlvbjtcblxuXHRcdFx0Um9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhNZXRlb3IuY2FsbCgnc2VuZEZpbGVNZXNzYWdlJywgdGhpcy51cmxQYXJhbXMucmlkLCBudWxsLCB1cGxvYWRlZEZpbGUsIGZpZWxkcykpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5zYXZlTm90aWZpY2F0aW9uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHNhdmVOb3RpZmljYXRpb25zID0gKG5vdGlmaWNhdGlvbnMsIHJvb21JZCkgPT4ge1xuXHRcdFx0T2JqZWN0LmtleXMobm90aWZpY2F0aW9ucykubWFwKChub3RpZmljYXRpb25LZXkpID0+IHtcblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3NhdmVOb3RpZmljYXRpb25TZXR0aW5ncycsIHJvb21JZCwgbm90aWZpY2F0aW9uS2V5LCBub3RpZmljYXRpb25zW25vdGlmaWNhdGlvbktleV0pKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0Y29uc3QgeyByb29tSWQsIG5vdGlmaWNhdGlvbnMgfSA9IHRoaXMuYm9keVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIFxcJ3Jvb21JZFxcJyBwYXJhbSBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGlmICghbm90aWZpY2F0aW9ucyB8fCBPYmplY3Qua2V5cyhub3RpZmljYXRpb25zKS5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgXFwnbm90aWZpY2F0aW9uc1xcJyBwYXJhbSBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdHNhdmVOb3RpZmljYXRpb25zKG5vdGlmaWNhdGlvbnMsIHJvb21JZCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3Jvb21zLmZhdm9yaXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHsgZmF2b3JpdGUgfSA9IHRoaXMuYm9keVBhcmFtcztcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLmhhc093blByb3BlcnR5KCdmYXZvcml0ZScpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIFxcJ2Zhdm9yaXRlXFwnIHBhcmFtIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IGZpbmRSb29tQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5ib2R5UGFyYW1zIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3RvZ2dsZUZhdm9yaXRlJywgcm9vbS5faWQsIGZhdm9yaXRlKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3Jvb21zLmNsZWFuSGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFJvb21CeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLmJvZHlQYXJhbXMgfSk7XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5sYXRlc3QpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtZXRlciBcImxhdGVzdFwiIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW1ldGVyIFwib2xkZXN0XCIgaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbGF0ZXN0ID0gbmV3IERhdGUodGhpcy5ib2R5UGFyYW1zLmxhdGVzdCk7XG5cdFx0Y29uc3Qgb2xkZXN0ID0gbmV3IERhdGUodGhpcy5ib2R5UGFyYW1zLm9sZGVzdCk7XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuaW5jbHVzaXZlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5ib2R5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnY2xlYW5Sb29tSGlzdG9yeScsIHsgcm9vbUlkOiBmaW5kUmVzdWx0Ll9pZCwgbGF0ZXN0LCBvbGRlc3QsIGluY2x1c2l2ZSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3Vic2NyaXB0aW9ucy5nZXQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHVwZGF0ZWRTaW5jZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGxldCB1cGRhdGVkU2luY2VEYXRlO1xuXHRcdGlmICh1cGRhdGVkU2luY2UpIHtcblx0XHRcdGlmIChpc05hTihEYXRlLnBhcnNlKHVwZGF0ZWRTaW5jZSkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb21JZC1wYXJhbS1pbnZhbGlkJywgJ1RoZSBcImxhc3RVcGRhdGVcIiBxdWVyeSBwYXJhbWV0ZXIgbXVzdCBiZSBhIHZhbGlkIGRhdGUuJyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR1cGRhdGVkU2luY2VEYXRlID0gbmV3IERhdGUodXBkYXRlZFNpbmNlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdzdWJzY3JpcHRpb25zL2dldCcsIHVwZGF0ZWRTaW5jZURhdGUpKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcblx0XHRcdHJlc3VsdCA9IHtcblx0XHRcdFx0dXBkYXRlOiByZXN1bHQsXG5cdFx0XHRcdHJlbW92ZTogW11cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdWJzY3JpcHRpb25zLmdldE9uZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcm9vbUlkIH0gPSB0aGlzLnJlcXVlc3RQYXJhbXMoKTtcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIFxcJ3Jvb21JZFxcJyBwYXJhbSBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb21JZCwgdGhpcy51c2VySWQpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c3Vic2NyaXB0aW9uXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG4vKipcblx0VGhpcyBBUEkgaXMgc3VwcG9zZSB0byBtYXJrIGFueSByb29tIGFzIHJlYWQuXG5cblx0TWV0aG9kOiBQT1NUXG5cdFJvdXRlOiBhcGkvdjEvc3Vic2NyaXB0aW9ucy5yZWFkXG5cdFBhcmFtczpcblx0XHQtIHJpZDogVGhlIHJpZCBvZiB0aGUgcm9vbSB0byBiZSBtYXJrZWQgYXMgcmVhZC5cbiAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3N1YnNjcmlwdGlvbnMucmVhZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHJpZDogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PlxuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlYWRNZXNzYWdlcycsIHRoaXMuYm9keVBhcmFtcy5yaWQpXG5cdFx0KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3Vic2NyaXB0aW9ucy51bnJlYWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyByb29tSWQsIGZpcnN0VW5yZWFkTWVzc2FnZSB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGlmICghcm9vbUlkICYmIChmaXJzdFVucmVhZE1lc3NhZ2UgJiYgIWZpcnN0VW5yZWFkTWVzc2FnZS5faWQpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQXQgbGVhc3Qgb25lIG9mIFwicm9vbUlkXCIgb3IgXCJmaXJzdFVucmVhZE1lc3NhZ2UuX2lkXCIgcGFyYW1zIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT5cblx0XHRcdE1ldGVvci5jYWxsKCd1bnJlYWRNZXNzYWdlcycsIGZpcnN0VW5yZWFkTWVzc2FnZSwgcm9vbUlkKVxuXHRcdCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuXG4iLCIvKiBnbG9iYWwgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlICovXG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LmRlbGV0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRhc1VzZXI6IE1hdGNoLk1heWJlKEJvb2xlYW4pXG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1zZ0lkLCB7IGZpZWxkczogeyB1OiAxLCByaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgTm8gbWVzc2FnZSBmb3VuZCB3aXRoIHRoZSBpZCBvZiBcIiR7IHRoaXMuYm9keVBhcmFtcy5tc2dJZCB9XCIuYCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5yb29tSWQgIT09IG1zZy5yaWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcm9vbSBpZCBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCB3aGVyZSB0aGUgbWVzc2FnZSBpcyBmcm9tLicpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuYXNVc2VyICYmIG1zZy51Ll9pZCAhPT0gdGhpcy51c2VySWQgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdmb3JjZS1kZWxldGUtbWVzc2FnZScsIG1zZy5yaWQpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVW5hdXRob3JpemVkLiBZb3UgbXVzdCBoYXZlIHRoZSBwZXJtaXNzaW9uIFwiZm9yY2UtZGVsZXRlLW1lc3NhZ2VcIiB0byBkZWxldGUgb3RoZXJcXCdzIG1lc3NhZ2UgYXMgdGhlbS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMuYm9keVBhcmFtcy5hc1VzZXIgPyBtc2cudS5faWQgOiB0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHRzOiBEYXRlLm5vdygpLFxuXHRcdFx0bWVzc2FnZTogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zeW5jTWVzc2FnZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCwgbGFzdFVwZGF0ZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFsYXN0VXBkYXRlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1sYXN0VXBkYXRlLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9IGVsc2UgaWYgKGlzTmFOKERhdGUucGFyc2UobGFzdFVwZGF0ZSkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0taW52YWxpZCcsICdUaGUgXCJsYXN0VXBkYXRlXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ21lc3NhZ2VzL2dldCcsIHJvb21JZCwgeyBsYXN0VXBkYXRlOiBuZXcgRGF0ZShsYXN0VXBkYXRlKSB9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJlc3VsdFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuZ2V0TWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghdGhpcy5xdWVyeVBhcmFtcy5tc2dJZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBcIm1zZ0lkXCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1zZztcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRtc2cgPSBNZXRlb3IuY2FsbCgnZ2V0U2luZ2xlTWVzc2FnZScsIHRoaXMucXVlcnlQYXJhbXMubXNnSWQpO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZTogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5waW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRsZXQgcGlubmVkTWVzc2FnZTtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBwaW5uZWRNZXNzYWdlID0gTWV0ZW9yLmNhbGwoJ3Bpbk1lc3NhZ2UnLCBtc2cpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2U6IHBpbm5lZE1lc3NhZ2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnBvc3RNZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IG1lc3NhZ2VSZXR1cm4gPSBwcm9jZXNzV2ViaG9va01lc3NhZ2UodGhpcy5ib2R5UGFyYW1zLCB0aGlzLnVzZXIsIHVuZGVmaW5lZCwgdHJ1ZSlbMF07XG5cblx0XHRpZiAoIW1lc3NhZ2VSZXR1cm4pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCd1bmtub3duLWVycm9yJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dHM6IERhdGUubm93KCksXG5cdFx0XHRjaGFubmVsOiBtZXNzYWdlUmV0dXJuLmNoYW5uZWwsXG5cdFx0XHRtZXNzYWdlOiBtZXNzYWdlUmV0dXJuLm1lc3NhZ2Vcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnNlYXJjaCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcm9vbUlkLCBzZWFyY2hUZXh0LCBsaW1pdCB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICghcm9vbUlkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tSWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzZWFyY2hUZXh0KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zZWFyY2hUZXh0LXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJzZWFyY2hUZXh0XCIgcXVlcnkgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRpZiAobGltaXQgJiYgKHR5cGVvZiBsaW1pdCAhPT0gJ251bWJlcicgfHwgaXNOYU4obGltaXQpIHx8IGxpbWl0IDw9IDApKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1saW1pdC1wYXJhbS1pbnZhbGlkJywgJ1RoZSBcImxpbWl0XCIgcXVlcnkgcGFyYW1ldGVyIG11c3QgYmUgYSB2YWxpZCBudW1iZXIgYW5kIGJlIGdyZWF0ZXIgdGhhbiAwLicpO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ21lc3NhZ2VTZWFyY2gnLCBzZWFyY2hUZXh0LCByb29tSWQsIGxpbWl0KS5tZXNzYWdlLmRvY3MpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXM6IHJlc3VsdFxuXHRcdH0pO1xuXHR9XG59KTtcblxuLy8gVGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBgY2hhdC5wb3N0TWVzc2FnZWAgYW5kIGBjaGF0LnNlbmRNZXNzYWdlYCBpcyB0aGF0IGBjaGF0LnNlbmRNZXNzYWdlYCBhbGxvd3Ncbi8vIGZvciBwYXNzaW5nIGEgdmFsdWUgZm9yIGBfaWRgIGFuZCB0aGUgb3RoZXIgb25lIGRvZXNuJ3QuIEFsc28sIGBjaGF0LnNlbmRNZXNzYWdlYCBvbmx5IHNlbmRzIGl0IHRvXG4vLyBvbmUgY2hhbm5lbCB3aGVyZWFzIHRoZSBvdGhlciBvbmUgYWxsb3dzIGZvciBzZW5kaW5nIHRvIG1vcmUgdGhhbiBvbmUgY2hhbm5lbCBhdCBhIHRpbWUuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zZW5kTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBhcmFtcycsICdUaGUgXCJtZXNzYWdlXCIgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1lc3NhZ2U7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gbWVzc2FnZSA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zdGFyTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQgfHwgIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcIm1lc3NhZ2VJZFwiIHBhcmFtIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQpO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2Utbm90LWZvdW5kJywgJ1RoZSBwcm92aWRlZCBcIm1lc3NhZ2VJZFwiIGRvZXMgbm90IG1hdGNoIGFueSBleGlzdGluZyBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzdGFyTWVzc2FnZScsIHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHJpZDogbXNnLnJpZCxcblx0XHRcdHN0YXJyZWQ6IHRydWVcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQudW5QaW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCk7XG5cblx0XHRpZiAoIW1zZykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZS1ub3QtZm91bmQnLCAnVGhlIHByb3ZpZGVkIFwibWVzc2FnZUlkXCIgZG9lcyBub3QgbWF0Y2ggYW55IGV4aXN0aW5nIG1lc3NhZ2UuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3VucGluTWVzc2FnZScsIG1zZykpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnVuU3Rhck1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkIHx8ICF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnc3Rhck1lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IG1zZy5faWQsXG5cdFx0XHRyaWQ6IG1zZy5yaWQsXG5cdFx0XHRzdGFycmVkOiBmYWxzZVxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC51cGRhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0dGV4dDogU3RyaW5nIC8vVXNpbmcgdGV4dCB0byBiZSBjb25zaXN0YW50IHdpdGggY2hhdC5wb3N0TWVzc2FnZVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tc2dJZCk7XG5cblx0XHQvL0Vuc3VyZSB0aGUgbWVzc2FnZSBleGlzdHNcblx0XHRpZiAoIW1zZykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYE5vIG1lc3NhZ2UgZm91bmQgd2l0aCB0aGUgaWQgb2YgXCIkeyB0aGlzLmJvZHlQYXJhbXMubXNnSWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMucm9vbUlkICE9PSBtc2cucmlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb20gaWQgcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggd2hlcmUgdGhlIG1lc3NhZ2UgaXMgZnJvbS4nKTtcblx0XHR9XG5cblx0XHQvL1Blcm1pc3Npb24gY2hlY2tzIGFyZSBhbHJlYWR5IGRvbmUgaW4gdGhlIHVwZGF0ZU1lc3NhZ2UgbWV0aG9kLCBzbyBubyBuZWVkIHRvIGR1cGxpY2F0ZSB0aGVtXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3VwZGF0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCwgbXNnOiB0aGlzLmJvZHlQYXJhbXMudGV4dCwgcmlkOiBtc2cucmlkIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZTogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobXNnLl9pZClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnJlYWN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgbWlzc2luZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBlbW9qaSA9IHRoaXMuYm9keVBhcmFtcy5lbW9qaSB8fCB0aGlzLmJvZHlQYXJhbXMucmVhY3Rpb247XG5cblx0XHRpZiAoIWVtb2ppKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1lbW9qaS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwiZW1vamlcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzZXRSZWFjdGlvbicsIGVtb2ppLCBtc2cuX2lkLCB0aGlzLmJvZHlQYXJhbXMuc2hvdWxkUmVhY3QpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5nZXRNZXNzYWdlUmVhZFJlY2VpcHRzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBtZXNzYWdlSWQgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cdFx0aWYgKCFtZXNzYWdlSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHtcblx0XHRcdFx0ZXJyb3I6ICdUaGUgcmVxdWlyZWQgXFwnbWVzc2FnZUlkXFwnIHBhcmFtIGlzIG1pc3NpbmcuJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VSZWFkUmVjZWlwdHMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0UmVhZFJlY2VpcHRzJywgeyBtZXNzYWdlSWQgfSkpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRyZWNlaXB0czogbWVzc2FnZVJlYWRSZWNlaXB0c1xuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHtcblx0XHRcdFx0ZXJyb3I6IGVycm9yLm1lc3NhZ2Vcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnJlcG9ydE1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyBtZXNzYWdlSWQsIGRlc2NyaXB0aW9uIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cdFx0aWYgKCFtZXNzYWdlSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICghZGVzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcmVxdWlyZWQgXCJkZXNjcmlwdGlvblwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3JlcG9ydE1lc3NhZ2UnLCBtZXNzYWdlSWQsIGRlc2NyaXB0aW9uKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuaWdub3JlVXNlcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcmlkLCB1c2VySWQgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cdFx0bGV0IHsgaWdub3JlID0gdHJ1ZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlnbm9yZSA9IHR5cGVvZiBpZ25vcmUgPT09ICdzdHJpbmcnID8gL3RydWV8MS8udGVzdChpZ25vcmUpIDogaWdub3JlO1xuXG5cdFx0aWYgKCFyaWQgfHwgIXJpZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20taWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInJpZFwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF1c2VySWQgfHwgIXVzZXJJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcInVzZXJJZFwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2lnbm9yZVVzZXInLCB7IHJpZCwgdXNlcklkLCBpZ25vcmUgfSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY29tbWFuZHMuZ2V0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgcGFyYW1zID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGlmICh0eXBlb2YgcGFyYW1zLmNvbW1hbmQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHF1ZXJ5IHBhcmFtIFwiY29tbWFuZFwiIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW3BhcmFtcy5jb21tYW5kLnRvTG93ZXJDYXNlKCldO1xuXG5cdFx0aWYgKCFjbWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGVyZSBpcyBubyBjb21tYW5kIGluIHRoZSBzeXN0ZW0gYnkgdGhlIG5hbWUgb2Y6ICR7IHBhcmFtcy5jb21tYW5kIH1gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGNvbW1hbmQ6IGNtZCB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjb21tYW5kcy5saXN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IGNvbW1hbmRzID0gT2JqZWN0LnZhbHVlcyhSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHMpO1xuXG5cdFx0aWYgKHF1ZXJ5ICYmIHF1ZXJ5LmNvbW1hbmQpIHtcblx0XHRcdGNvbW1hbmRzID0gY29tbWFuZHMuZmlsdGVyKChjb21tYW5kKSA9PiBjb21tYW5kLmNvbW1hbmQgPT09IHF1ZXJ5LmNvbW1hbmQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSBjb21tYW5kcy5sZW5ndGg7XG5cdFx0Y29tbWFuZHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5wcm9jZXNzUXVlcnlPcHRpb25zT25SZXN1bHQoY29tbWFuZHMsIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNvbW1hbmRzLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IGNvbW1hbmRzLmxlbmd0aCxcblx0XHRcdHRvdGFsOiB0b3RhbENvdW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG4vLyBFeHBlY3RzIGEgYm9keSBvZjogeyBjb21tYW5kOiAnZ2ltbWUnLCBwYXJhbXM6ICdhbnkgc3RyaW5nIHZhbHVlJywgcm9vbUlkOiAndmFsdWUnIH1cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjb21tYW5kcy5ydW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgYm9keSA9IHRoaXMuYm9keVBhcmFtcztcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRMb2dnZWRJblVzZXIoKTtcblxuXHRcdGlmICh0eXBlb2YgYm9keS5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1lvdSBtdXN0IHByb3ZpZGUgYSBjb21tYW5kIHRvIHJ1bi4nKTtcblx0XHR9XG5cblx0XHRpZiAoYm9keS5wYXJhbXMgJiYgdHlwZW9mIGJvZHkucGFyYW1zICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBwYXJhbWV0ZXJzIGZvciB0aGUgY29tbWFuZCBtdXN0IGJlIGEgc2luZ2xlIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGJvZHkucm9vbUlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSByb29tXFwncyBpZCB3aGVyZSB0byBleGVjdXRlIHRoaXMgY29tbWFuZCBtdXN0IGJlIHByb3ZpZGVkIGFuZCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBib2R5LmNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoIVJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tib2R5LmNvbW1hbmQudG9Mb3dlckNhc2UoKV0pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY29tbWFuZCBwcm92aWRlZCBkb2VzIG5vdCBleGlzdCAob3IgaXMgZGlzYWJsZWQpLicpO1xuXHRcdH1cblxuXHRcdC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGV5IGNhbid0IG9yIHRoZSByb29tIGlzIGludmFsaWRcblx0XHRNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIGJvZHkucm9vbUlkLCB1c2VyLl9pZCk7XG5cblx0XHRjb25zdCBwYXJhbXMgPSBib2R5LnBhcmFtcyA/IGJvZHkucGFyYW1zIDogJyc7XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5ydW4oY21kLCBwYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBib2R5LnJvb21JZCxcblx0XHRcdFx0bXNnOiBgLyR7IGNtZCB9ICR7IHBhcmFtcyB9YFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHJlc3VsdCB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjb21tYW5kcy5wcmV2aWV3JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHQvLyBFeHBlY3RzIHRoZXNlIHF1ZXJ5IHBhcmFtczogY29tbWFuZDogJ2dpcGh5JywgcGFyYW1zOiAnbWluZScsIHJvb21JZDogJ3ZhbHVlJ1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpO1xuXG5cdFx0aWYgKHR5cGVvZiBxdWVyeS5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1lvdSBtdXN0IHByb3ZpZGUgYSBjb21tYW5kIHRvIGdldCB0aGUgcHJldmlld3MgZnJvbS4nKTtcblx0XHR9XG5cblx0XHRpZiAocXVlcnkucGFyYW1zICYmIHR5cGVvZiBxdWVyeS5wYXJhbXMgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBjb21tYW5kIG11c3QgYmUgYSBzaW5nbGUgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcXVlcnkucm9vbUlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSByb29tXFwncyBpZCB3aGVyZSB0aGUgcHJldmlld3MgYXJlIGJlaW5nIGRpc3BsYXllZCBtdXN0IGJlIHByb3ZpZGVkIGFuZCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBxdWVyeS5jb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjb21tYW5kIHByb3ZpZGVkIGRvZXMgbm90IGV4aXN0IChvciBpcyBkaXNhYmxlZCkuJyk7XG5cdFx0fVxuXG5cdFx0Ly8gVGhpcyB3aWxsIHRocm93IGFuIGVycm9yIGlmIHRoZXkgY2FuJ3Qgb3IgdGhlIHJvb20gaXMgaW52YWxpZFxuXHRcdE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgcXVlcnkucm9vbUlkLCB1c2VyLl9pZCk7XG5cblx0XHRjb25zdCBwYXJhbXMgPSBxdWVyeS5wYXJhbXMgPyBxdWVyeS5wYXJhbXMgOiAnJztcblxuXHRcdGxldCBwcmV2aWV3O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdHByZXZpZXcgPSBNZXRlb3IuY2FsbCgnZ2V0U2xhc2hDb21tYW5kUHJldmlld3MnLCB7IGNtZCwgcGFyYW1zLCBtc2c6IHsgcmlkOiBxdWVyeS5yb29tSWQgfSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcHJldmlldyB9KTtcblx0fSxcblx0Ly8gRXhwZWN0cyBhIGJvZHkgZm9ybWF0IG9mOiB7IGNvbW1hbmQ6ICdnaXBoeScsIHBhcmFtczogJ21pbmUnLCByb29tSWQ6ICd2YWx1ZScsIHByZXZpZXdJdGVtOiB7IGlkOiAnc2FkZjgnIHR5cGU6ICdpbWFnZScsIHZhbHVlOiAnaHR0cHM6Ly9kZXYubnVsbC9naWYgfSB9XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgYm9keSA9IHRoaXMuYm9keVBhcmFtcztcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRMb2dnZWRJblVzZXIoKTtcblxuXHRcdGlmICh0eXBlb2YgYm9keS5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1lvdSBtdXN0IHByb3ZpZGUgYSBjb21tYW5kIHRvIHJ1biB0aGUgcHJldmlldyBpdGVtIG9uLicpO1xuXHRcdH1cblxuXHRcdGlmIChib2R5LnBhcmFtcyAmJiB0eXBlb2YgYm9keS5wYXJhbXMgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHBhcmFtZXRlcnMgZm9yIHRoZSBjb21tYW5kIG11c3QgYmUgYSBzaW5nbGUgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYm9keS5yb29tSWQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb21cXCdzIGlkIHdoZXJlIHRoZSBwcmV2aWV3IGlzIGJlaW5nIGV4ZWN1dGVkIGluIG11c3QgYmUgcHJvdmlkZWQgYW5kIGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgYm9keS5wcmV2aWV3SXRlbSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcHJldmlldyBpdGVtIGJlaW5nIGV4ZWN1dGVkIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFib2R5LnByZXZpZXdJdGVtLmlkIHx8ICFib2R5LnByZXZpZXdJdGVtLnR5cGUgfHwgdHlwZW9mIGJvZHkucHJldmlld0l0ZW0udmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHByZXZpZXcgaXRlbSBiZWluZyBleGVjdXRlZCBpcyBpbiB0aGUgd3JvbmcgZm9ybWF0LicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGJvZHkuY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICghUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY29tbWFuZCBwcm92aWRlZCBkb2VzIG5vdCBleGlzdCAob3IgaXMgZGlzYWJsZWQpLicpO1xuXHRcdH1cblxuXHRcdC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiB0aGV5IGNhbid0IG9yIHRoZSByb29tIGlzIGludmFsaWRcblx0XHRNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIGJvZHkucm9vbUlkLCB1c2VyLl9pZCk7XG5cblx0XHRjb25zdCBwYXJhbXMgPSBib2R5LnBhcmFtcyA/IGJvZHkucGFyYW1zIDogJyc7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnZXhlY3V0ZVNsYXNoQ29tbWFuZFByZXZpZXcnLCB7IGNtZCwgcGFyYW1zLCBtc2c6IHsgcmlkOiBib2R5LnJvb21JZCB9IH0sIGJvZHkucHJldmlld0l0ZW0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZW1vamktY3VzdG9tJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZW1vamlzID0gTWV0ZW9yLmNhbGwoJ2xpc3RFbW9qaUN1c3RvbScpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBlbW9qaXMgfSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbi8vUmV0dXJucyB0aGUgcHJpdmF0ZSBncm91cCBzdWJzY3JpcHRpb24gSUYgZm91bmQgb3RoZXJ3aXNlIGl0IHdpbGwgcmV0dXJuIHRoZSBmYWlsdXJlIG9mIHdoeSBpdCBkaWRuJ3QuIENoZWNrIHRoZSBgc3RhdHVzQ29kZWAgcHJvcGVydHlcbmZ1bmN0aW9uIGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zLCB1c2VySWQsIGNoZWNrZWRBcmNoaXZlZCA9IHRydWUgfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHBhcmFtZXRlciBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0bGV0IHJvb21TdWI7XG5cdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0cm9vbVN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHBhcmFtcy5yb29tSWQsIHVzZXJJZCk7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnJvb21OYW1lKSB7XG5cdFx0cm9vbVN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbU5hbWVBbmRVc2VySWQocGFyYW1zLnJvb21OYW1lLCB1c2VySWQpO1xuXHR9XG5cblx0aWYgKCFyb29tU3ViIHx8IHJvb21TdWIudCAhPT0gJ3AnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1ub3QtZm91bmQnLCAnVGhlIHJlcXVpcmVkIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSBncm91cCcpO1xuXHR9XG5cblx0aWYgKGNoZWNrZWRBcmNoaXZlZCAmJiByb29tU3ViLmFyY2hpdmVkKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1hcmNoaXZlZCcsIGBUaGUgcHJpdmF0ZSBncm91cCwgJHsgcm9vbVN1Yi5uYW1lIH0sIGlzIGFyY2hpdmVkYCk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbVN1Yjtcbn1cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRBbGxVc2VyVG9Sb29tJywgZmluZFJlc3VsdC5yaWQsIHRoaXMuYm9keVBhcmFtcy5hY3RpdmVVc2Vyc09ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRNb2RlcmF0b3InLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRPd25lcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tT3duZXInLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYWRkTGVhZGVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbUxlYWRlcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuLy9BcmNoaXZlcyBhIHByaXZhdGUgZ3JvdXAgb25seSBpZiBpdCB3YXNuJ3RcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYXJjaGl2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FyY2hpdmVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY2xvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGlmICghZmluZFJlc3VsdC5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHByaXZhdGUgZ3JvdXAsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY291bnRlcnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBhY2Nlc3MgPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKTtcblx0XHRjb25zdCBwYXJhbXMgPSB0aGlzLnJlcXVlc3RQYXJhbXMoKTtcblx0XHRsZXQgdXNlciA9IHRoaXMudXNlcklkO1xuXHRcdGxldCByb29tO1xuXHRcdGxldCB1bnJlYWRzID0gbnVsbDtcblx0XHRsZXQgdXNlck1lbnRpb25zID0gbnVsbDtcblx0XHRsZXQgdW5yZWFkc0Zyb20gPSBudWxsO1xuXHRcdGxldCBqb2luZWQgPSBmYWxzZTtcblx0XHRsZXQgbXNncyA9IG51bGw7XG5cdFx0bGV0IGxhdGVzdCA9IG51bGw7XG5cdFx0bGV0IG1lbWJlcnMgPSBudWxsO1xuXG5cdFx0aWYgKCghcGFyYW1zLnJvb21JZCB8fCAhcGFyYW1zLnJvb21JZC50cmltKCkpICYmICghcGFyYW1zLnJvb21OYW1lIHx8ICFwYXJhbXMucm9vbU5hbWUudHJpbSgpKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHBhcmFtZXRlciBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocGFyYW1zLnJvb21JZCk7XG5cdFx0fSBlbHNlIGlmIChwYXJhbXMucm9vbU5hbWUpIHtcblx0XHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHBhcmFtcy5yb29tTmFtZSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ3AnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGdyb3VwJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHJvb20uYXJjaGl2ZWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tYXJjaGl2ZWQnLCBgVGhlIHByaXZhdGUgZ3JvdXAsICR7IHJvb20ubmFtZSB9LCBpcyBhcmNoaXZlZGApO1xuXHRcdH1cblxuXHRcdGlmIChwYXJhbXMudXNlcklkKSB7XG5cdFx0XHRpZiAoIWFjY2Vzcykge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0XHR9XG5cdFx0XHR1c2VyID0gcGFyYW1zLnVzZXJJZDtcblx0XHR9XG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIpO1xuXHRcdGNvbnN0IGxtID0gcm9vbS5sbSA/IHJvb20ubG0gOiByb29tLl91cGRhdGVkQXQ7XG5cblx0XHRpZiAodHlwZW9mIHN1YnNjcmlwdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgc3Vic2NyaXB0aW9uLm9wZW4pIHtcblx0XHRcdGlmIChzdWJzY3JpcHRpb24ubHMpIHtcblx0XHRcdFx0dW5yZWFkcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNvdW50VmlzaWJsZUJ5Um9vbUlkQmV0d2VlblRpbWVzdGFtcHNJbmNsdXNpdmUoc3Vic2NyaXB0aW9uLnJpZCwgc3Vic2NyaXB0aW9uLmxzLCBsbSk7XG5cdFx0XHRcdHVucmVhZHNGcm9tID0gc3Vic2NyaXB0aW9uLmxzO1xuXHRcdFx0fVxuXHRcdFx0dXNlck1lbnRpb25zID0gc3Vic2NyaXB0aW9uLnVzZXJNZW50aW9ucztcblx0XHRcdGpvaW5lZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGFjY2VzcyB8fCBqb2luZWQpIHtcblx0XHRcdG1zZ3MgPSByb29tLm1zZ3M7XG5cdFx0XHRsYXRlc3QgPSBsbTtcblx0XHRcdG1lbWJlcnMgPSByb29tLnVzZXJzQ291bnQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0am9pbmVkLFxuXHRcdFx0bWVtYmVycyxcblx0XHRcdHVucmVhZHMsXG5cdFx0XHR1bnJlYWRzRnJvbSxcblx0XHRcdG1zZ3MsXG5cdFx0XHRsYXRlc3QsXG5cdFx0XHR1c2VyTWVudGlvbnNcblx0XHR9KTtcblx0fVxufSk7XG5cbi8vQ3JlYXRlIFByaXZhdGUgR3JvdXBcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnY3JlYXRlLXAnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm5hbWUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzICYmICFfLmlzQXJyYXkodGhpcy5ib2R5UGFyYW1zLm1lbWJlcnMpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm1lbWJlcnNcIiBtdXN0IGJlIGFuIGFycmF5IGlmIHByb3ZpZGVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMgJiYgISh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyA9PT0gJ29iamVjdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcImN1c3RvbUZpZWxkc1wiIG11c3QgYmUgYW4gb2JqZWN0IGlmIHByb3ZpZGVkJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHJlYWRPbmx5ID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZWFkT25seSA9IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seTtcblx0XHR9XG5cblx0XHRsZXQgaWQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0aWQgPSBNZXRlb3IuY2FsbCgnY3JlYXRlUHJpdmF0ZUdyb3VwJywgdGhpcy5ib2R5UGFyYW1zLm5hbWUsIHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzID8gdGhpcy5ib2R5UGFyYW1zLm1lbWJlcnMgOiBbXSwgcmVhZE9ubHksIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlkLnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnZXJhc2VSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5maWxlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cdFx0Y29uc3QgYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QgPSAoZmlsZSkgPT4ge1xuXHRcdFx0aWYgKGZpbGUudXNlcklkKSB7XG5cdFx0XHRcdGZpbGUgPSB0aGlzLmluc2VydFVzZXJPYmplY3QoeyBvYmplY3Q6IGZpbGUsIHVzZXJJZDogZmlsZS51c2VySWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmlsZTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucmlkIH0pO1xuXG5cdFx0Y29uc3QgZmlsZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZmlsZXM6IGZpbGVzLm1hcChhZGRVc2VyT2JqZWN0VG9FdmVyeU9iamVjdCksXG5cdFx0XHRjb3VudDogZmlsZXMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5nZXRJbnRlZ3JhdGlvbnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgaW5jbHVkZUFsbFByaXZhdGVHcm91cHMgPSB0cnVlO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGluY2x1ZGVBbGxQcml2YXRlR3JvdXBzID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyA9PT0gJ3RydWUnO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNoYW5uZWxzVG9TZWFyY2ggPSBbYCMkeyBmaW5kUmVzdWx0Lm5hbWUgfWBdO1xuXHRcdGlmIChpbmNsdWRlQWxsUHJpdmF0ZUdyb3Vwcykge1xuXHRcdFx0Y2hhbm5lbHNUb1NlYXJjaC5wdXNoKCdhbGxfcHJpdmF0ZV9ncm91cHMnKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IGNoYW5uZWw6IHsgJGluOiBjaGFubmVsc1RvU2VhcmNoIH0gfSk7XG5cdFx0Y29uc3QgaW50ZWdyYXRpb25zID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfY3JlYXRlZEF0OiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW50ZWdyYXRpb25zLFxuXHRcdFx0Y291bnQ6IGludGVncmF0aW9ucy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuaGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRsZXQgbGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KSB7XG5cdFx0XHRsYXRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBvbGRlc3REYXRlID0gdW5kZWZpbmVkO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0b2xkZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlKSB7XG5cdFx0XHRpbmNsdXNpdmUgPSB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRsZXQgY291bnQgPSAyMDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5jb3VudCkge1xuXHRcdFx0Y291bnQgPSBwYXJzZUludCh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KTtcblx0XHR9XG5cblx0XHRsZXQgdW5yZWFkcyA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHMpIHtcblx0XHRcdHVucmVhZHMgPSB0aGlzLnF1ZXJ5UGFyYW1zLnVucmVhZHM7XG5cdFx0fVxuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBNZXRlb3IuY2FsbCgnZ2V0Q2hhbm5lbEhpc3RvcnknLCB7IHJpZDogZmluZFJlc3VsdC5yaWQsIGxhdGVzdDogbGF0ZXN0RGF0ZSwgb2xkZXN0OiBvbGRlc3REYXRlLCBpbmNsdXNpdmUsIGNvdW50LCB1bnJlYWRzIH0pO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5pbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuaW52aXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHsgcm9vbUlkID0gJycsIHJvb21OYW1lID0gJycgfSA9IHRoaXMucmVxdWVzdFBhcmFtcygpO1xuXHRcdGNvbnN0IGlkT3JOYW1lID0gcm9vbUlkIHx8IHJvb21OYW1lO1xuXHRcdGlmICghaWRPck5hbWUudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBfaWQ6IHJpZCwgdDogdHlwZSB9ID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWRPck5hbWUoaWRPck5hbWUpIHx8IHt9O1xuXG5cdFx0aWYgKCFyaWQgfHwgdHlwZSAhPT0gJ3AnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGdyb3VwJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyB1c2VybmFtZSB9ID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2FkZFVzZXJUb1Jvb20nLCB7IHJpZCwgdXNlcm5hbWUgfSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMua2ljaycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVVc2VyRnJvbVJvb20nLCB7IHJpZDogZmluZFJlc3VsdC5yaWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMubGVhdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdsZWF2ZVJvb20nLCBmaW5kUmVzdWx0LnJpZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuLy9MaXN0IFByaXZhdGUgR3JvdXBzIGEgdXNlciBoYXMgYWNjZXNzIHRvXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHN9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Ly8gVE9ETzogQ0FDSEU6IEFkZCBCcmVhY2tpbmcgbm90aWNlIHNpbmNlIHdlIHJlbW92ZWQgdGhlIHF1ZXJ5IHBhcmFtXG5cdFx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5U3Vic2NyaXB0aW9uVHlwZUFuZFVzZXJJZCgncCcsIHRoaXMudXNlcklkLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRjb25zdCB0b3RhbENvdW50ID0gY3Vyc29yLmNvdW50KCk7XG5cdFx0Y29uc3Qgcm9vbXMgPSBjdXJzb3IuZmV0Y2goKTtcblxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXBzOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmxpc3RBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdwJyB9KTtcblxuXHRcdGxldCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmZldGNoKCk7XG5cdFx0Y29uc3QgdG90YWxDb3VudCA9IHJvb21zLmxlbmd0aDtcblxuXHRcdHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KHJvb21zLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cHM6IHJvb21zLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IHJvb21zLmxlbmd0aCxcblx0XHRcdHRvdGFsOiB0b3RhbENvdW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm1lbWJlcnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IHsgYnJvYWRjYXN0OiAxIH0gfSk7XG5cblx0XHRpZiAocm9vbS5icm9hZGNhc3QgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctYnJvYWRjYXN0LW1lbWJlci1saXN0JykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0ID0ge30gfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRCeVJvb21JZChmaW5kUmVzdWx0LnJpZCwge1xuXHRcdFx0ZmllbGRzOiB7ICd1Ll9pZCc6IDEgfSxcblx0XHRcdHNvcnQ6IHsgJ3UudXNlcm5hbWUnOiBzb3J0LnVzZXJuYW1lICE9IG51bGwgPyBzb3J0LnVzZXJuYW1lIDogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50XG5cdFx0fSk7XG5cblx0XHRjb25zdCB0b3RhbCA9IHN1YnNjcmlwdGlvbnMuY291bnQoKTtcblxuXHRcdGNvbnN0IG1lbWJlcnMgPSBzdWJzY3JpcHRpb25zLmZldGNoKCkubWFwKHMgPT4gcy51ICYmIHMudS5faWQpO1xuXG5cdFx0Y29uc3QgdXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHsgX2lkOiB7ICRpbjogbWVtYmVycyB9IH0sIHtcblx0XHRcdGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxLCBuYW1lOiAxLCBzdGF0dXM6IDEsIHV0Y09mZnNldDogMSB9LFxuXHRcdFx0c29ydDogeyB1c2VybmFtZTogIHNvcnQudXNlcm5hbWUgIT0gbnVsbCA/IHNvcnQudXNlcm5hbWUgOiAxIH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVtYmVyczogdXNlcnMsXG5cdFx0XHRjb3VudDogdXNlcnMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWxcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMubWVzc2FnZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0LnJpZCB9KTtcblxuXHRcdGNvbnN0IG1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzLFxuXHRcdFx0Y291bnQ6IG1lc3NhZ2VzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuLy8gVE9ETzogQ0FDSEU6IHNhbWUgYXMgY2hhbm5lbHMub25saW5lXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm9ubGluZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdwJyB9KTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKG91clF1ZXJ5KTtcblxuXHRcdGlmIChyb29tID09IG51bGwpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdHcm91cCBkb2VzIG5vdCBleGlzdHMnKTtcblx0XHR9XG5cblx0XHRjb25zdCBvbmxpbmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNOb3RPZmZsaW5lKHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHR1c2VybmFtZTogMVxuXHRcdFx0fVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRjb25zdCBvbmxpbmVJblJvb20gPSBbXTtcblx0XHRvbmxpbmUuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb3QuX2lkLCB1c2VyLl9pZCwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0XHRpZiAoc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRcdG9ubGluZUluUm9vbS5wdXNoKHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0b25saW5lOiBvbmxpbmVJblJvb21cblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMub3BlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBwcml2YXRlIGdyb3VwLCAkeyBmaW5kUmVzdWx0Lm5hbWUgfSwgaXMgYWxyZWFkeSBvcGVuIGZvciB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ29wZW5Sb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucmVtb3ZlTW9kZXJhdG9yJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVJvb21Nb2RlcmF0b3InLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucmVtb3ZlT3duZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlUm9vbU93bmVyJywgZmluZFJlc3VsdC5yaWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnJlbW92ZUxlYWRlcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tTGVhZGVyJywgZmluZFJlc3VsdC5yaWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnJlbmFtZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5uYW1lIHx8ICF0aGlzLmJvZHlQYXJhbXMubmFtZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB7IHJvb21JZDogdGhpcy5ib2R5UGFyYW1zLnJvb21JZH0sIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbU5hbWUnLCB0aGlzLmJvZHlQYXJhbXMubmFtZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldEN1c3RvbUZpZWxkcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMgfHwgISh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyA9PT0gJ29iamVjdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcImN1c3RvbUZpZWxkc1wiIGlzIHJlcXVpcmVkIHdpdGggYSB0eXBlIGxpa2Ugb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbUN1c3RvbUZpZWxkcycsIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXREZXNjcmlwdGlvbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbiB8fCAhdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJkZXNjcmlwdGlvblwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5yaWQsICdyb29tRGVzY3JpcHRpb24nLCB0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZGVzY3JpcHRpb246IHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvblxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXRQdXJwb3NlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UgfHwgIXRoaXMuYm9keVBhcmFtcy5wdXJwb3NlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJwdXJwb3NlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHB1cnBvc2U6IHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldFJlYWRPbmx5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJyZWFkT25seVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnJvID09PSB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcHJpdmF0ZSBncm91cCByZWFkIG9ubHkgc2V0dGluZyBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3JlYWRPbmx5JywgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0VG9waWMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudG9waWMgfHwgIXRoaXMuYm9keVBhcmFtcy50b3BpYy50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwidG9waWNcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0VHlwZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50eXBlIHx8ICF0aGlzLmJvZHlQYXJhbXMudHlwZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwidHlwZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnQgPT09IHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHByaXZhdGUgZ3JvdXAgdHlwZSBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21UeXBlJywgdGhpcy5ib2R5UGFyYW1zLnR5cGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy51bmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCd1bmFyY2hpdmVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMucm9sZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3Qgcm9sZXMgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnZ2V0Um9vbVJvbGVzJywgZmluZFJlc3VsdC5yaWQpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJvbGVzXG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiZnVuY3Rpb24gZmluZERpcmVjdE1lc3NhZ2VSb29tKHBhcmFtcywgdXNlcikge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMudXNlcm5hbWUgfHwgIXBhcmFtcy51c2VybmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnQm9keSBwYXJhbSBcInJvb21JZFwiIG9yIFwidXNlcm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHtcblx0XHRjdXJyZW50VXNlcklkOiB1c2VyLl9pZCxcblx0XHRuYW1lT3JJZDogcGFyYW1zLnVzZXJuYW1lIHx8IHBhcmFtcy5yb29tSWQsXG5cdFx0dHlwZTogJ2QnXG5cdH0pO1xuXG5cdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdkJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwidXNlcm5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgZGlyY3QgbWVzc2FnZScpO1xuXHR9XG5cblx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIuX2lkKTtcblxuXHRyZXR1cm4ge1xuXHRcdHJvb20sXG5cdFx0c3Vic2NyaXB0aW9uXG5cdH07XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uY3JlYXRlJywgJ2ltLmNyZWF0ZSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmREaXJlY3RNZXNzYWdlUm9vbSh0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdGhpcy51c2VyKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJvb206IGZpbmRSZXN1bHQucm9vbVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5jbG9zZScsICdpbS5jbG9zZSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmREaXJlY3RNZXNzYWdlUm9vbSh0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdGhpcy51c2VyKTtcblxuXHRcdGlmICghZmluZFJlc3VsdC5zdWJzY3JpcHRpb24ub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBkaXJlY3QgbWVzc2FnZSByb29tLCAkeyB0aGlzLmJvZHlQYXJhbXMubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5yb29tLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5jb3VudGVycycsICdpbS5jb3VudGVycyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBhY2Nlc3MgPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKTtcblx0XHRjb25zdCBydXNlcklkID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCkudXNlcklkO1xuXHRcdGxldCB1c2VyID0gdGhpcy51c2VySWQ7XG5cdFx0bGV0IHVucmVhZHMgPSBudWxsO1xuXHRcdGxldCB1c2VyTWVudGlvbnMgPSBudWxsO1xuXHRcdGxldCB1bnJlYWRzRnJvbSA9IG51bGw7XG5cdFx0bGV0IGpvaW5lZCA9IGZhbHNlO1xuXHRcdGxldCBtc2dzID0gbnVsbDtcblx0XHRsZXQgbGF0ZXN0ID0gbnVsbDtcblx0XHRsZXQgbWVtYmVycyA9IG51bGw7XG5cdFx0bGV0IGxtID0gbnVsbDtcblxuXHRcdGlmIChydXNlcklkKSB7XG5cdFx0XHRpZiAoIWFjY2Vzcykge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0XHR9XG5cdFx0XHR1c2VyID0gcnVzZXJJZDtcblx0XHR9XG5cdFx0Y29uc3QgcnMgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHsnX2lkJzogdXNlcn0pO1xuXHRcdGNvbnN0IHJvb20gPSBycy5yb29tO1xuXHRcdGNvbnN0IGRtID0gcnMuc3Vic2NyaXB0aW9uO1xuXHRcdGxtID0gcm9vbS5sbSA/IHJvb20ubG0gOiByb29tLl91cGRhdGVkQXQ7XG5cblx0XHRpZiAodHlwZW9mIGRtICE9PSAndW5kZWZpbmVkJyAmJiBkbS5vcGVuKSB7XG5cdFx0XHRpZiAoZG0ubHMgJiYgcm9vbS5tc2dzKSB7XG5cdFx0XHRcdHVucmVhZHMgPSBkbS51bnJlYWQ7XG5cdFx0XHRcdHVucmVhZHNGcm9tID0gZG0ubHM7XG5cdFx0XHR9XG5cdFx0XHR1c2VyTWVudGlvbnMgPSBkbS51c2VyTWVudGlvbnM7XG5cdFx0XHRqb2luZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChhY2Nlc3MgfHwgam9pbmVkKSB7XG5cdFx0XHRtc2dzID0gcm9vbS5tc2dzO1xuXHRcdFx0bGF0ZXN0ID0gbG07XG5cdFx0XHRtZW1iZXJzID0gcm9vbS51c2Vyc0NvdW50O1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGpvaW5lZCxcblx0XHRcdG1lbWJlcnMsXG5cdFx0XHR1bnJlYWRzLFxuXHRcdFx0dW5yZWFkc0Zyb20sXG5cdFx0XHRtc2dzLFxuXHRcdFx0bGF0ZXN0LFxuXHRcdFx0dXNlck1lbnRpb25zXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmZpbGVzJywgJ2ltLmZpbGVzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cdFx0Y29uc3QgYWRkVXNlck9iamVjdFRvRXZlcnlPYmplY3QgPSAoZmlsZSkgPT4ge1xuXHRcdFx0aWYgKGZpbGUudXNlcklkKSB7XG5cdFx0XHRcdGZpbGUgPSB0aGlzLmluc2VydFVzZXJPYmplY3QoeyBvYmplY3Q6IGZpbGUsIHVzZXJJZDogZmlsZS51c2VySWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmlsZTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBmaWxlcyA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRmaWxlczogZmlsZXMubWFwKGFkZFVzZXJPYmplY3RUb0V2ZXJ5T2JqZWN0KSxcblx0XHRcdGNvdW50OiBmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmhpc3RvcnknLCAnaW0uaGlzdG9yeSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0bGV0IGxhdGVzdERhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0bGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgb2xkZXN0RGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdG9sZGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZSkge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0bGV0IGNvdW50ID0gMjA7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuY291bnQpIHtcblx0XHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdFx0fVxuXG5cdFx0bGV0IHVucmVhZHMgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzKSB7XG5cdFx0XHR1bnJlYWRzID0gdGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ2dldENoYW5uZWxIaXN0b3J5Jywge1xuXHRcdFx0XHRyaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubWVtYmVycycsICdpbS5tZW1iZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlSb29tSWQoZmluZFJlc3VsdC5faWQsIHtcblx0XHRcdHNvcnQ6IHsgJ3UudXNlcm5hbWUnOiAgc29ydC51c2VybmFtZSAhPSBudWxsID8gc29ydC51c2VybmFtZSA6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudFxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdG90YWwgPSBjdXJzb3IuY291bnQoKTtcblxuXHRcdGNvbnN0IG1lbWJlcnMgPSBjdXJzb3IuZmV0Y2goKS5tYXAocyA9PiBzLnUgJiYgcy51LnVzZXJuYW1lKTtcblxuXHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZCh7IHVzZXJuYW1lOiB7ICRpbjogbWVtYmVycyB9IH0sIHtcblx0XHRcdGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxLCBuYW1lOiAxLCBzdGF0dXM6IDEsIHV0Y09mZnNldDogMSB9LFxuXHRcdFx0c29ydDogeyB1c2VybmFtZTogIHNvcnQudXNlcm5hbWUgIT0gbnVsbCA/IHNvcnQudXNlcm5hbWUgOiAxIH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVtYmVyczogdXNlcnMsXG5cdFx0XHRjb3VudDogbWVtYmVycy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcycsICdpbS5tZXNzYWdlcyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc29sZS5sb2coZmluZFJlc3VsdCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB0czogLTEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlcyxcblx0XHRcdGNvdW50OiBtZXNzYWdlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcy5vdGhlcnMnLCAnaW0ubWVzc2FnZXMub3RoZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JykgIT09IHRydWUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWVuZHBvaW50LWRpc2FibGVkJywgJ1RoaXMgZW5kcG9pbnQgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9pbS5tZXNzYWdlcy5vdGhlcnMnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tSWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLnJvb21JZDtcblx0XHRpZiAoIXJvb21JZCB8fCAhcm9vbUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0XHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnZCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgYE5vIGRpcmVjdCBtZXNzYWdlIHJvb20gZm91bmQgYnkgdGhlIGlkIG9mOiAkeyByb29tSWQgfWApO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogcm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtc2dzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzOiBtc2dzLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IG1zZ3MubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubGlzdCcsICdpbS5saXN0J10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQgPSB7IG5hbWU6IDEgfSwgZmllbGRzIH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHQvLyBUT0RPOiBDQUNIRTogQWRkIEJyZWFja2luZyBub3RpY2Ugc2luY2Ugd2UgcmVtb3ZlZCB0aGUgcXVlcnkgcGFyYW1cblxuXHRcdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVN1YnNjcmlwdGlvblR5cGVBbmRVc2VySWQoJ2QnLCB0aGlzLnVzZXJJZCwge1xuXHRcdFx0c29ydCxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdG90YWwgPSBjdXJzb3IuY291bnQoKTtcblx0XHRjb25zdCByb29tcyA9IGN1cnNvci5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW1zOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5saXN0LmV2ZXJ5b25lJywgJ2ltLmxpc3QuZXZlcnlvbmUnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgdDogJ2QnIH0pO1xuXG5cdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGltczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ub3BlbicsICdpbS5vcGVuJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0aWYgKCFmaW5kUmVzdWx0LnN1YnNjcmlwdGlvbi5vcGVuKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQucm9vbS5faWQpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uc2V0VG9waWMnLCAnaW0uc2V0VG9waWMnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRvcGljIHx8ICF0aGlzLmJvZHlQYXJhbXMudG9waWMudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInRvcGljXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJvb20uX2lkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLmNyZWF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRlbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0dXNlcm5hbWU6IFN0cmluZyxcblx0XHRcdHVybHM6IE1hdGNoLk1heWJlKFtTdHJpbmddKSxcblx0XHRcdGNoYW5uZWw6IFN0cmluZyxcblx0XHRcdGV2ZW50OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dHJpZ2dlcldvcmRzOiBNYXRjaC5NYXliZShbU3RyaW5nXSksXG5cdFx0XHRhbGlhczogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGF2YXRhcjogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGVtb2ppOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dG9rZW46IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRzY3JpcHRFbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0c2NyaXB0OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dGFyZ2V0Q2hhbm5lbDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdHN3aXRjaCAodGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdGNhc2UgJ3dlYmhvb2stb3V0Z29pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3dlYmhvb2staW5jb21pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIGludGVncmF0aW9uIHR5cGUuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBpbnRlZ3JhdGlvbiB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdpbnRlZ3JhdGlvbnMuaGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnF1ZXJ5UGFyYW1zLmlkIHx8IHRoaXMucXVlcnlQYXJhbXMuaWQudHJpbSgpID09PSAnJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLmlkO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgJ2ludGVncmF0aW9uLl9pZCc6IGlkIH0pO1xuXHRcdGNvbnN0IGhpc3RvcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aGlzdG9yeSxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBoaXN0b3J5Lmxlbmd0aCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2ludGVncmF0aW9ucy5saXN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcblx0XHRjb25zdCBpbnRlZ3JhdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGludGVncmF0aW9ucyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBpbnRlZ3JhdGlvbnMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLnJlbW92ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHR0YXJnZXRfdXJsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0aW50ZWdyYXRpb25JZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRhcmdldF91cmwgJiYgIXRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQW4gaW50ZWdyYXRpb25JZCBvciB0YXJnZXRfdXJsIG5lZWRzIHRvIGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblx0XHRzd2l0Y2ggKHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRjYXNlICd3ZWJob29rLW91dGdvaW5nJzpcblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IHVybHM6IHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsIH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogdGhpcy5ib2R5UGFyYW1zLmludGVncmF0aW9uSWQgfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWludGVncmF0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ05vIGludGVncmF0aW9uIGZvdW5kLicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJywgaW50ZWdyYXRpb24uX2lkKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGludGVncmF0aW9uXG5cdFx0XHRcdH0pO1xuXHRcdFx0Y2FzZSAnd2ViaG9vay1pbmNvbWluZyc6XG5cdFx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkIH0pO1xuXG5cdFx0XHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTm8gaW50ZWdyYXRpb24gZm91bmQuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24nLCBpbnRlZ3JhdGlvbi5faWQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb25cblx0XHRcdFx0fSk7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBpbnRlZ3JhdGlvbiB0eXBlLicpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdpbmZvJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldExvZ2dlZEluVXNlcigpO1xuXG5cdFx0aWYgKHVzZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKHVzZXIuX2lkLCAnYWRtaW4nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRpbmZvOiBSb2NrZXRDaGF0LkluZm9cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGluZm86IHtcblx0XHRcdFx0J3ZlcnNpb24nOiBSb2NrZXRDaGF0LkluZm8udmVyc2lvblxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ21lJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5nZXRVc2VySW5mbyhSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCkpKTtcblx0fVxufSk7XG5cbmxldCBvbmxpbmVDYWNoZSA9IDA7XG5sZXQgb25saW5lQ2FjaGVEYXRlID0gMDtcbmNvbnN0IGNhY2hlSW52YWxpZCA9IDYwMDAwOyAvLyAxIG1pbnV0ZVxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NoaWVsZC5zdmcnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyB0eXBlLCBjaGFubmVsLCBuYW1lLCBpY29uIH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbmFibGVfU2hpZWxkcycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1lbmRwb2ludC1kaXNhYmxlZCcsICdUaGlzIGVuZHBvaW50IGlzIGRpc2FibGVkJywgeyByb3V0ZTogJy9hcGkvdjEvc2hpZWxkLnN2ZycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHlwZXMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1NoaWVsZF9UeXBlcycpO1xuXHRcdGlmICh0eXBlICYmICh0eXBlcyAhPT0gJyonICYmICF0eXBlcy5zcGxpdCgnLCcpLm1hcCgodCkgPT4gdC50cmltKCkpLmluY2x1ZGVzKHR5cGUpKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itc2hpZWxkLWRpc2FibGVkJywgJ1RoaXMgc2hpZWxkIHR5cGUgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9zaGllbGQuc3ZnJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBoaWRlSWNvbiA9IGljb24gPT09ICdmYWxzZSc7XG5cdFx0aWYgKGhpZGVJY29uICYmICghbmFtZSB8fCAhbmFtZS50cmltKCkpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTmFtZSBjYW5ub3QgYmUgZW1wdHkgd2hlbiBpY29uIGlzIGhpZGRlbicpO1xuXHRcdH1cblxuXHRcdGxldCB0ZXh0O1xuXHRcdGxldCBiYWNrZ3JvdW5kQ29sb3IgPSAnIzRjMSc7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdvbmxpbmUnOlxuXHRcdFx0XHRpZiAoRGF0ZS5ub3coKSAtIG9ubGluZUNhY2hlRGF0ZSA+IGNhY2hlSW52YWxpZCkge1xuXHRcdFx0XHRcdG9ubGluZUNhY2hlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZFVzZXJzTm90T2ZmbGluZSgpLmNvdW50KCk7XG5cdFx0XHRcdFx0b25saW5lQ2FjaGVEYXRlID0gRGF0ZS5ub3coKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRleHQgPSBgJHsgb25saW5lQ2FjaGUgfSAkeyBUQVBpMThuLl9fKCdPbmxpbmUnKSB9YDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdjaGFubmVsJzpcblx0XHRcdFx0aWYgKCFjaGFubmVsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1NoaWVsZCBjaGFubmVsIGlzIHJlcXVpcmVkIGZvciB0eXBlIFwiY2hhbm5lbFwiJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0ZXh0ID0gYCMkeyBjaGFubmVsIH1gO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3VzZXInOlxuXHRcdFx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0XHRcdC8vIFJlc3BlY3QgdGhlIHNlcnZlcidzIGNob2ljZSBmb3IgdXNpbmcgdGhlaXIgcmVhbCBuYW1lcyBvciBub3Rcblx0XHRcdFx0aWYgKHVzZXIubmFtZSAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVUlfVXNlX1JlYWxfTmFtZScpKSB7XG5cdFx0XHRcdFx0dGV4dCA9IGAkeyB1c2VyLm5hbWUgfWA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGV4dCA9IGBAJHsgdXNlci51c2VybmFtZSB9YDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN3aXRjaCAodXNlci5zdGF0dXMpIHtcblx0XHRcdFx0XHRjYXNlICdvbmxpbmUnOlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yID0gJyMxZmIzMWYnO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnYXdheSc6XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgPSAnI2RjOWIwMSc7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdidXN5Jzpcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvciA9ICcjYmMyMDMxJztcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ29mZmxpbmUnOlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yID0gJyNhNWExYTEnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGV4dCA9IFRBUGkxOG4uX18oJ0pvaW5fQ2hhdCcpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWNvblNpemUgPSBoaWRlSWNvbiA/IDcgOiAyNDtcblx0XHRjb25zdCBsZWZ0U2l6ZSA9IG5hbWUgPyBuYW1lLmxlbmd0aCAqIDYgKyA3ICsgaWNvblNpemUgOiBpY29uU2l6ZTtcblx0XHRjb25zdCByaWdodFNpemUgPSB0ZXh0Lmxlbmd0aCAqIDYgKyAyMDtcblx0XHRjb25zdCB3aWR0aCA9IGxlZnRTaXplICsgcmlnaHRTaXplO1xuXHRcdGNvbnN0IGhlaWdodCA9IDIwO1xuXHRcdHJldHVybiB7XG5cdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnaW1hZ2Uvc3ZnK3htbDtjaGFyc2V0PXV0Zi04JyB9LFxuXHRcdFx0Ym9keTogYFxuXHRcdFx0XHQ8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB3aWR0aD1cIiR7IHdpZHRoIH1cIiBoZWlnaHQ9XCIkeyBoZWlnaHQgfVwiPlxuXHRcdFx0XHQgIDxsaW5lYXJHcmFkaWVudCBpZD1cImJcIiB4Mj1cIjBcIiB5Mj1cIjEwMCVcIj5cblx0XHRcdFx0ICAgIDxzdG9wIG9mZnNldD1cIjBcIiBzdG9wLWNvbG9yPVwiI2JiYlwiIHN0b3Atb3BhY2l0eT1cIi4xXCIvPlxuXHRcdFx0XHQgICAgPHN0b3Agb2Zmc2V0PVwiMVwiIHN0b3Atb3BhY2l0eT1cIi4xXCIvPlxuXHRcdFx0XHQgIDwvbGluZWFyR3JhZGllbnQ+XG5cdFx0XHRcdCAgPG1hc2sgaWQ9XCJhXCI+XG5cdFx0XHRcdCAgICA8cmVjdCB3aWR0aD1cIiR7IHdpZHRoIH1cIiBoZWlnaHQ9XCIkeyBoZWlnaHQgfVwiIHJ4PVwiM1wiIGZpbGw9XCIjZmZmXCIvPlxuXHRcdFx0XHQgIDwvbWFzaz5cblx0XHRcdFx0ICA8ZyBtYXNrPVwidXJsKCNhKVwiPlxuXHRcdFx0XHQgICAgPHBhdGggZmlsbD1cIiM1NTVcIiBkPVwiTTAgMGgkeyBsZWZ0U2l6ZSB9diR7IGhlaWdodCB9SDB6XCIvPlxuXHRcdFx0XHQgICAgPHBhdGggZmlsbD1cIiR7IGJhY2tncm91bmRDb2xvciB9XCIgZD1cIk0keyBsZWZ0U2l6ZSB9IDBoJHsgcmlnaHRTaXplIH12JHsgaGVpZ2h0IH1IJHsgbGVmdFNpemUgfXpcIi8+XG5cdFx0XHRcdCAgICA8cGF0aCBmaWxsPVwidXJsKCNiKVwiIGQ9XCJNMCAwaCR7IHdpZHRoIH12JHsgaGVpZ2h0IH1IMHpcIi8+XG5cdFx0XHRcdCAgPC9nPlxuXHRcdFx0XHQgICAgJHsgaGlkZUljb24gPyAnJyA6ICc8aW1hZ2UgeD1cIjVcIiB5PVwiM1wiIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHhsaW5rOmhyZWY9XCIvYXNzZXRzL2Zhdmljb24uc3ZnXCIvPicgfVxuXHRcdFx0XHQgIDxnIGZpbGw9XCIjZmZmXCIgZm9udC1mYW1pbHk9XCJEZWphVnUgU2FucyxWZXJkYW5hLEdlbmV2YSxzYW5zLXNlcmlmXCIgZm9udC1zaXplPVwiMTFcIj5cblx0XHRcdFx0XHRcdCR7IG5hbWUgPyBgPHRleHQgeD1cIiR7IGljb25TaXplIH1cIiB5PVwiMTVcIiBmaWxsPVwiIzAxMDEwMVwiIGZpbGwtb3BhY2l0eT1cIi4zXCI+JHsgbmFtZSB9PC90ZXh0PlxuXHRcdFx0XHQgICAgPHRleHQgeD1cIiR7IGljb25TaXplIH1cIiB5PVwiMTRcIj4keyBuYW1lIH08L3RleHQ+YCA6ICcnIH1cblx0XHRcdFx0ICAgIDx0ZXh0IHg9XCIkeyBsZWZ0U2l6ZSArIDcgfVwiIHk9XCIxNVwiIGZpbGw9XCIjMDEwMTAxXCIgZmlsbC1vcGFjaXR5PVwiLjNcIj4keyB0ZXh0IH08L3RleHQ+XG5cdFx0XHRcdCAgICA8dGV4dCB4PVwiJHsgbGVmdFNpemUgKyA3IH1cIiB5PVwiMTRcIj4keyB0ZXh0IH08L3RleHQ+XG5cdFx0XHRcdCAgPC9nPlxuXHRcdFx0XHQ8L3N2Zz5cblx0XHRcdGAudHJpbSgpLnJlcGxhY2UoL1xcPltcXHNdK1xcPC9nbSwgJz48Jylcblx0XHR9O1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3Nwb3RsaWdodCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNoZWNrKHRoaXMucXVlcnlQYXJhbXMsIHtcblx0XHRcdHF1ZXJ5OiBTdHJpbmdcblx0XHR9KTtcblxuXHRcdGNvbnN0IHsgcXVlcnkgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRjb25zdCByZXN1bHQgPSBNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PlxuXHRcdFx0TWV0ZW9yLmNhbGwoJ3Nwb3RsaWdodCcsIHF1ZXJ5KVxuXHRcdCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2RpcmVjdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCB7IHRleHQsIHR5cGUgfSA9IHF1ZXJ5O1xuXHRcdGlmIChzb3J0ICYmIE9iamVjdC5rZXlzKHNvcnQpLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGlzIG1ldGhvZCBzdXBwb3J0IG9ubHkgb25lIFwic29ydFwiIHBhcmFtZXRlcicpO1xuXHRcdH1cblx0XHRjb25zdCBzb3J0QnkgPSBzb3J0ID8gT2JqZWN0LmtleXMoc29ydClbMF0gOiB1bmRlZmluZWQ7XG5cdFx0Y29uc3Qgc29ydERpcmVjdGlvbiA9IHNvcnQgJiYgT2JqZWN0LnZhbHVlcyhzb3J0KVswXSA9PT0gMSA/ICdhc2MnIDogJ2Rlc2MnO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2Jyb3dzZUNoYW5uZWxzJywge1xuXHRcdFx0dGV4dCxcblx0XHRcdHR5cGUsXG5cdFx0XHRzb3J0QnksXG5cdFx0XHRzb3J0RGlyZWN0aW9uLFxuXHRcdFx0cGFnZTogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50XG5cdFx0fSkpO1xuXG5cdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdQbGVhc2UgdmVyaWZ5IHRoZSBwYXJhbWV0ZXJzJyk7XG5cdFx0fVxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJlc3VsdDogcmVzdWx0LnJlc3VsdHMsXG5cdFx0XHRjb3VudDogcmVzdWx0LnJlc3VsdHMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IHJlc3VsdC50b3RhbFxuXHRcdH0pO1xuXHR9XG59KTtcbiIsIi8qKlxuXHRUaGlzIEFQSSByZXR1cm5zIGFsbCBwZXJtaXNzaW9ucyB0aGF0IGV4aXN0c1xuXHRvbiB0aGUgc2VydmVyLCB3aXRoIHJlc3BlY3RpdmUgcm9sZXMuXG5cblx0TWV0aG9kOiBHRVRcblx0Um91dGU6IGFwaS92MS9wZXJtaXNzaW9uc1xuICovXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB3YXJuaW5nTWVzc2FnZSA9ICdUaGUgZW5kcG9pbnQgXCJwZXJtaXNzaW9uc1wiIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBhZnRlciB2ZXJzaW9uIHYwLjY5Jztcblx0XHRjb25zb2xlLndhcm4od2FybmluZ01lc3NhZ2UpO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3Blcm1pc3Npb25zL2dldCcpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdwZXJtaXNzaW9ucy9nZXQnKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRwZXJtaXNzaW9uczogcmVzdWx0XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncGVybWlzc2lvbnMudXBkYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdFZGl0aW5nIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywgJ2Vycm9yLWVkaXQtcGVybWlzc2lvbnMtbm90LWFsbG93ZWQnKTtcblx0XHR9XG5cblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHBlcm1pc3Npb25zOiBbXG5cdFx0XHRcdE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdFx0X2lkOiBTdHJpbmcsXG5cdFx0XHRcdFx0cm9sZXM6IFtTdHJpbmddXG5cdFx0XHRcdH0pXG5cdFx0XHRdXG5cdFx0fSk7XG5cblx0XHRsZXQgcGVybWlzc2lvbk5vdEZvdW5kID0gZmFsc2U7XG5cdFx0bGV0IHJvbGVOb3RGb3VuZCA9IGZhbHNlO1xuXHRcdE9iamVjdC5rZXlzKHRoaXMuYm9keVBhcmFtcy5wZXJtaXNzaW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRjb25zdCBlbGVtZW50ID0gdGhpcy5ib2R5UGFyYW1zLnBlcm1pc3Npb25zW2tleV07XG5cblx0XHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZUJ5SWQoZWxlbWVudC5faWQpKSB7XG5cdFx0XHRcdHBlcm1pc3Npb25Ob3RGb3VuZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdE9iamVjdC5rZXlzKGVsZW1lbnQucm9sZXMpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRjb25zdCBzdWJlbGVtZW50ID0gZWxlbWVudC5yb2xlc1trZXldO1xuXG5cdFx0XHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZE9uZUJ5SWQoc3ViZWxlbWVudCkpIHtcblx0XHRcdFx0XHRyb2xlTm90Rm91bmQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmIChwZXJtaXNzaW9uTm90Rm91bmQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIHBlcm1pc3Npb24nLCAnZXJyb3ItaW52YWxpZC1wZXJtaXNzaW9uJyk7XG5cdFx0fSBlbHNlIGlmIChyb2xlTm90Rm91bmQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIHJvbGUnLCAnZXJyb3ItaW52YWxpZC1yb2xlJyk7XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXModGhpcy5ib2R5UGFyYW1zLnBlcm1pc3Npb25zKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdGNvbnN0IGVsZW1lbnQgPSB0aGlzLmJvZHlQYXJhbXMucGVybWlzc2lvbnNba2V5XTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoZWxlbWVudC5faWQsIGVsZW1lbnQucm9sZXMpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3Blcm1pc3Npb25zL2dldCcpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHBlcm1pc3Npb25zOiByZXN1bHRcblx0XHR9KTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFB1c2ggKi9cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3B1c2gudG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyB0eXBlLCB2YWx1ZSwgYXBwTmFtZSB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGxldCB7IGlkIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoaWQgJiYgdHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaWQtcGFyYW0tbm90LXZhbGlkJywgJ1RoZSByZXF1aXJlZCBcImlkXCIgYm9keSBwYXJhbSBpcyBpbnZhbGlkLicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdHlwZSB8fCAodHlwZSAhPT0gJ2FwbicgJiYgdHlwZSAhPT0gJ2djbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10eXBlLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJ0eXBlXCIgYm9keSBwYXJhbSBpcyBtaXNzaW5nIG9yIGludmFsaWQuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10b2tlbi1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwidmFsdWVcIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIWFwcE5hbWUgfHwgdHlwZW9mIGFwcE5hbWUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hcHBOYW1lLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJhcHBOYW1lXCIgYm9keSBwYXJhbSBpcyBtaXNzaW5nIG9yIGludmFsaWQuJyk7XG5cdFx0fVxuXG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdyYWl4OnB1c2gtdXBkYXRlJywge1xuXHRcdFx0aWQsXG5cdFx0XHR0b2tlbjogeyBbdHlwZV06IHZhbHVlIH0sXG5cdFx0XHRhcHBOYW1lLFxuXHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZFxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcmVzdWx0IH0pO1xuXHR9LFxuXHRkZWxldGUoKSB7XG5cdFx0Y29uc3QgeyB0b2tlbiB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXG5cdFx0aWYgKCF0b2tlbiB8fCB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10b2tlbi1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwidG9rZW5cIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBhZmZlY3RlZFJlY29yZHMgPSBQdXNoLmFwcENvbGxlY3Rpb24ucmVtb3ZlKHtcblx0XHRcdCRvcjogW3tcblx0XHRcdFx0J3Rva2VuLmFwbic6IHRva2VuXG5cdFx0XHR9LCB7XG5cdFx0XHRcdCd0b2tlbi5nY20nOiB0b2tlblxuXHRcdFx0fV0sXG5cdFx0XHR1c2VySWQ6IHRoaXMudXNlcklkXG5cdFx0fSk7XG5cblx0XHRpZiAoYWZmZWN0ZWRSZWNvcmRzID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vLyBzZXR0aW5ncyBlbmRwb2ludHNcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy5wdWJsaWMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IG91clF1ZXJ5ID0ge1xuXHRcdFx0aGlkZGVuOiB7ICRuZTogdHJ1ZSB9LFxuXHRcdFx0J3B1YmxpYyc6IHRydWVcblx0XHR9O1xuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgX2lkOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHM6IE9iamVjdC5hc3NpZ24oeyBfaWQ6IDEsIHZhbHVlOiAxIH0sIGZpZWxkcylcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c2V0dGluZ3MsXG5cdFx0XHRjb3VudDogc2V0dGluZ3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy5vYXV0aCcsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBtb3VudE9BdXRoU2VydmljZXMgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCBvQXV0aFNlcnZpY2VzRW5hYmxlZCA9IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHsgZmllbGRzOiB7IHNlY3JldDogMCB9IH0pLmZldGNoKCk7XG5cblx0XHRcdHJldHVybiBvQXV0aFNlcnZpY2VzRW5hYmxlZC5tYXAoKHNlcnZpY2UpID0+IHtcblx0XHRcdFx0aWYgKHNlcnZpY2UuY3VzdG9tIHx8IFsnc2FtbCcsICdjYXMnLCAnd29yZHByZXNzJ10uaW5jbHVkZXMoc2VydmljZS5zZXJ2aWNlKSkge1xuXHRcdFx0XHRcdHJldHVybiB7IC4uLnNlcnZpY2UgfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0X2lkOiBzZXJ2aWNlLl9pZCxcblx0XHRcdFx0XHRuYW1lOiBzZXJ2aWNlLnNlcnZpY2UsXG5cdFx0XHRcdFx0Y2xpZW50SWQ6IHNlcnZpY2UuYXBwSWQgfHwgc2VydmljZS5jbGllbnRJZCB8fCBzZXJ2aWNlLmNvbnN1bWVyS2V5LFxuXHRcdFx0XHRcdGJ1dHRvbkxhYmVsVGV4dDogc2VydmljZS5idXR0b25MYWJlbFRleHQgfHwgJycsXG5cdFx0XHRcdFx0YnV0dG9uQ29sb3I6IHNlcnZpY2UuYnV0dG9uQ29sb3IgfHwgJycsXG5cdFx0XHRcdFx0YnV0dG9uTGFiZWxDb2xvcjogc2VydmljZS5idXR0b25MYWJlbENvbG9yIHx8ICcnLFxuXHRcdFx0XHRcdGN1c3RvbTogZmFsc2Vcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzZXJ2aWNlczogbW91bnRPQXV0aFNlcnZpY2VzKClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGxldCBvdXJRdWVyeSA9IHtcblx0XHRcdGhpZGRlbjogeyAkbmU6IHRydWUgfVxuXHRcdH07XG5cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcHJpdmlsZWdlZC1zZXR0aW5nJykpIHtcblx0XHRcdG91clF1ZXJ5LnB1YmxpYyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0b3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgb3VyUXVlcnkpO1xuXG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgX2lkOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHM6IE9iamVjdC5hc3NpZ24oeyBfaWQ6IDEsIHZhbHVlOiAxIH0sIGZpZWxkcylcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c2V0dGluZ3MsXG5cdFx0XHRjb3VudDogc2V0dGluZ3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzZXR0aW5ncy86X2lkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXByaXZpbGVnZWQtc2V0dGluZycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoXy5waWNrKFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmVOb3RIaWRkZW5CeUlkKHRoaXMudXJsUGFyYW1zLl9pZCksICdfaWQnLCAndmFsdWUnKSk7XG5cdH0sXG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdlZGl0LXByaXZpbGVnZWQtc2V0dGluZycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Ly8gYWxsb3cgc3BlY2lhbCBoYW5kbGluZyBvZiBwYXJ0aWN1bGFyIHNldHRpbmcgdHlwZXNcblx0XHRjb25zdCBzZXR0aW5nID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKTtcblx0XHRpZiAoc2V0dGluZy50eXBlID09PSAnYWN0aW9uJyAmJiB0aGlzLmJvZHlQYXJhbXMgJiYgdGhpcy5ib2R5UGFyYW1zLmV4ZWN1dGUpIHtcblx0XHRcdC8vZXhlY3V0ZSB0aGUgY29uZmlndXJlZCBtZXRob2Rcblx0XHRcdE1ldGVvci5jYWxsKHNldHRpbmcudmFsdWUpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHR9XG5cblx0XHRpZiAoc2V0dGluZy50eXBlID09PSAnY29sb3InICYmIHRoaXMuYm9keVBhcmFtcyAmJiB0aGlzLmJvZHlQYXJhbXMuZWRpdG9yICYmIHRoaXMuYm9keVBhcmFtcy52YWx1ZSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MudXBkYXRlT3B0aW9uc0J5SWQodGhpcy51cmxQYXJhbXMuX2lkLCB7IGVkaXRvcjogdGhpcy5ib2R5UGFyYW1zLmVkaXRvciB9KTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLnVwZGF0ZVZhbHVlTm90SGlkZGVuQnlJZCh0aGlzLnVybFBhcmFtcy5faWQsIHRoaXMuYm9keVBhcmFtcy52YWx1ZSk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdH1cblxuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0dmFsdWU6IE1hdGNoLkFueVxuXHRcdH0pO1xuXHRcdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkLCB0aGlzLmJvZHlQYXJhbXMudmFsdWUpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc2VydmljZS5jb25maWd1cmF0aW9ucycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBTZXJ2aWNlQ29uZmlndXJhdGlvbiA9IFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddLlNlcnZpY2VDb25maWd1cmF0aW9uO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y29uZmlndXJhdGlvbnM6IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHsgZmllbGRzOiB7IHNlY3JldDogMCB9IH0pLmZldGNoKClcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc3RhdGlzdGljcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGxldCByZWZyZXNoID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLnJlZnJlc2ggIT09ICd1bmRlZmluZWQnICYmIHRoaXMucXVlcnlQYXJhbXMucmVmcmVzaCA9PT0gJ3RydWUnKSB7XG5cdFx0XHRyZWZyZXNoID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRsZXQgc3RhdHM7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0c3RhdHMgPSBNZXRlb3IuY2FsbCgnZ2V0U3RhdGlzdGljcycsIHJlZnJlc2gpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0c3RhdGlzdGljczogc3RhdHNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdGF0aXN0aWNzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctc3RhdGlzdGljcycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgc3RhdGlzdGljcyA9IFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZChxdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzdGF0aXN0aWNzLFxuXHRcdFx0Y291bnQ6IHN0YXRpc3RpY3MubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZChxdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IEJ1c2JveSBmcm9tICdidXNib3knO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0ZW1haWw6IFN0cmluZyxcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdHBhc3N3b3JkOiBTdHJpbmcsXG5cdFx0XHR1c2VybmFtZTogU3RyaW5nLFxuXHRcdFx0YWN0aXZlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHJvbGVzOiBNYXRjaC5NYXliZShBcnJheSksXG5cdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRzZW5kV2VsY29tZUVtYWlsOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHZlcmlmaWVkOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdH0pO1xuXG5cdFx0Ly9OZXcgY2hhbmdlIG1hZGUgYnkgcHVsbCByZXF1ZXN0ICM1MTUyXG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuam9pbkRlZmF1bHRDaGFubmVscyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRoaXMuYm9keVBhcmFtcy5qb2luRGVmYXVsdENoYW5uZWxzID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcykge1xuXHRcdFx0Um9ja2V0Q2hhdC52YWxpZGF0ZUN1c3RvbUZpZWxkcyh0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0XHR9XG5cblx0XHRjb25zdCBuZXdVc2VySWQgPSBSb2NrZXRDaGF0LnNhdmVVc2VyKHRoaXMudXNlcklkLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZUN1c3RvbUZpZWxkc1dpdGhvdXRWYWxpZGF0aW9uKG5ld1VzZXJJZCwgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyk7XG5cdFx0fVxuXG5cblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5hY3RpdmUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VyQWN0aXZlU3RhdHVzJywgbmV3VXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlcjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQobmV3VXNlcklkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KSB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5kZWxldGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdkZWxldGUtdXNlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVVc2VyJywgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5nZXRBdmF0YXInLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdGNvbnN0IHVybCA9IFJvY2tldENoYXQuZ2V0VVJMKGAvYXZhdGFyLyR7IHVzZXIudXNlcm5hbWUgfWAsIHsgY2RuOiBmYWxzZSwgZnVsbDogdHJ1ZSB9KTtcblx0XHR0aGlzLnJlc3BvbnNlLnNldEhlYWRlcignTG9jYXRpb24nLCB1cmwpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDMwNyxcblx0XHRcdGJvZHk6IHVybFxuXHRcdH07XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuZ2V0UHJlc2VuY2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAodGhpcy5pc1VzZXJGcm9tUGFyYW1zKCkpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHByZXNlbmNlOiB1c2VyLnN0YXR1cyxcblx0XHRcdFx0Y29ubmVjdGlvblN0YXR1czogdXNlci5zdGF0dXNDb25uZWN0aW9uLFxuXHRcdFx0XHRsYXN0TG9naW46IHVzZXIubGFzdExvZ2luXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0cHJlc2VuY2U6IHVzZXIuc3RhdHVzXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuaW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IE1ldGVvci5jYWxsKCdnZXRGdWxsVXNlckRhdGEnLCB7IGZpbHRlcjogdXNlci51c2VybmFtZSwgbGltaXQ6IDEgfSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIXJlc3VsdCB8fCByZXN1bHQubGVuZ3RoICE9PSAxKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgRmFpbGVkIHRvIGdldCB0aGUgdXNlciBkYXRhIGZvciB0aGUgdXNlcklkIG9mIFwiJHsgdXNlci5faWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHVzZXI6IHJlc3VsdFswXVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctZC1yb29tJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQocXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB1c2VybmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHVzZXJzLFxuXHRcdFx0Y291bnQ6IHVzZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMucmVnaXN0ZXInLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICh0aGlzLnVzZXJJZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0xvZ2dlZCBpbiB1c2VycyBjYW4gbm90IHJlZ2lzdGVyIGFnYWluLicpO1xuXHRcdH1cblxuXHRcdC8vV2Ugc2V0IHRoZWlyIHVzZXJuYW1lIGhlcmUsIHNvIHJlcXVpcmUgaXRcblx0XHQvL1RoZSBgcmVnaXN0ZXJVc2VyYCBjaGVja3MgZm9yIHRoZSBvdGhlciByZXF1aXJlbWVudHNcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0fSkpO1xuXG5cdFx0Ly9SZWdpc3RlciB0aGUgdXNlclxuXHRcdGNvbnN0IHVzZXJJZCA9IE1ldGVvci5jYWxsKCdyZWdpc3RlclVzZXInLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0Ly9Ob3cgc2V0IHRoZWlyIHVzZXJuYW1lXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzZXRVc2VybmFtZScsIHRoaXMuYm9keVBhcmFtcy51c2VybmFtZSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnJlc2V0QXZhdGFyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRpZiAodXNlci5faWQgPT09IHRoaXMudXNlcklkKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgncmVzZXRBdmF0YXInKSk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdlZGl0LW90aGVyLXVzZXItaW5mbycpKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiBNZXRlb3IuY2FsbCgncmVzZXRBdmF0YXInKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnNldEF2YXRhcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRhdmF0YXJVcmw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHR1c2VySWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCB1c2VyO1xuXHRcdGlmICh0aGlzLmlzVXNlckZyb21QYXJhbXMoKSkge1xuXHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHRoaXMudXNlcklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2VkaXQtb3RoZXItdXNlci1pbmZvJykpIHtcblx0XHRcdHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmF2YXRhclVybCkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNldFVzZXJBdmF0YXIodXNlciwgdGhpcy5ib2R5UGFyYW1zLmF2YXRhclVybCwgJycsICd1cmwnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGJ1c2JveSA9IG5ldyBCdXNib3koeyBoZWFkZXJzOiB0aGlzLnJlcXVlc3QuaGVhZGVycyB9KTtcblxuXHRcdFx0XHRNZXRlb3Iud3JhcEFzeW5jKChjYWxsYmFjaykgPT4ge1xuXHRcdFx0XHRcdGJ1c2JveS5vbignZmlsZScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGZpZWxkbmFtZSwgZmlsZSwgZmlsZW5hbWUsIGVuY29kaW5nLCBtaW1ldHlwZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gJ2ltYWdlJykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWVsZCcpKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y29uc3QgaW1hZ2VEYXRhID0gW107XG5cdFx0XHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZGF0YSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpbWFnZURhdGEucHVzaChkYXRhKTtcblx0XHRcdFx0XHRcdH0pKTtcblxuXHRcdFx0XHRcdFx0ZmlsZS5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2V0VXNlckF2YXRhcih1c2VyLCBCdWZmZXIuY29uY2F0KGltYWdlRGF0YSksIG1pbWV0eXBlLCAncmVzdCcpO1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHRcdHRoaXMucmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0XHRcdH0pKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnVwZGF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHVzZXJJZDogU3RyaW5nLFxuXHRcdFx0ZGF0YTogTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdFx0ZW1haWw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdG5hbWU6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHBhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0YWN0aXZlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0cm9sZXM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdFx0am9pbkRlZmF1bHRDaGFubmVsczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHJlcXVpcmVQYXNzd29yZENoYW5nZTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNlbmRXZWxjb21lRW1haWw6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHR2ZXJpZmllZDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdFx0fSlcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJEYXRhID0gXy5leHRlbmQoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy51c2VySWQgfSwgdGhpcy5ib2R5UGFyYW1zLmRhdGEpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gUm9ja2V0Q2hhdC5zYXZlVXNlcih0aGlzLnVzZXJJZCwgdXNlckRhdGEpKTtcblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZUN1c3RvbUZpZWxkcyh0aGlzLmJvZHlQYXJhbXMudXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXN0b21GaWVsZHMpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmRhdGEuYWN0aXZlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0VXNlckFjdGl2ZVN0YXR1cycsIHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHRoaXMuYm9keVBhcmFtcy5kYXRhLmFjdGl2ZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLnVwZGF0ZU93bkJhc2ljSW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdGRhdGE6IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdGVtYWlsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuYW1lOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VybmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0Y3VycmVudFBhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuZXdQYXNzd29yZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdFx0fSksXG5cdFx0XHRjdXN0b21GaWVsZHM6IE1hdGNoLk1heWJlKE9iamVjdClcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJEYXRhID0ge1xuXHRcdFx0ZW1haWw6IHRoaXMuYm9keVBhcmFtcy5kYXRhLmVtYWlsLFxuXHRcdFx0cmVhbG5hbWU6IHRoaXMuYm9keVBhcmFtcy5kYXRhLm5hbWUsXG5cdFx0XHR1c2VybmFtZTogdGhpcy5ib2R5UGFyYW1zLmRhdGEudXNlcm5hbWUsXG5cdFx0XHRuZXdQYXNzd29yZDogdGhpcy5ib2R5UGFyYW1zLmRhdGEubmV3UGFzc3dvcmQsXG5cdFx0XHR0eXBlZFBhc3N3b3JkOiB0aGlzLmJvZHlQYXJhbXMuZGF0YS5jdXJyZW50UGFzc3dvcmRcblx0XHR9O1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3NhdmVVc2VyUHJvZmlsZScsIHVzZXJEYXRhLCB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KSB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5jcmVhdGVUb2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXHRcdGxldCBkYXRhO1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdGRhdGEgPSBNZXRlb3IuY2FsbCgnY3JlYXRlVG9rZW4nLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGRhdGEgPyBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgZGF0YSB9KSA6IFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmdldFByZWZlcmVuY2VzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblx0XHRpZiAodXNlci5zZXR0aW5ncykge1xuXHRcdFx0Y29uc3QgcHJlZmVyZW5jZXMgPSB1c2VyLnNldHRpbmdzLnByZWZlcmVuY2VzO1xuXHRcdFx0cHJlZmVyZW5jZXNbJ2xhbmd1YWdlJ10gPSB1c2VyLmxhbmd1YWdlO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHByZWZlcmVuY2VzXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoVEFQaTE4bi5fXygnQWNjb3VudHNfRGVmYXVsdF9Vc2VyX1ByZWZlcmVuY2VzX25vdF9hdmFpbGFibGUnKS50b1VwcGVyQ2FzZSgpKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuc2V0UHJlZmVyZW5jZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHR1c2VySWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRkYXRhOiBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0XHRuZXdSb29tTm90aWZpY2F0aW9uOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRuZXdNZXNzYWdlTm90aWZpY2F0aW9uOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHR1c2VFbW9qaXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRjb252ZXJ0QXNjaWlFbW9qaTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHNhdmVNb2JpbGVCYW5kd2lkdGg6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRjb2xsYXBzZU1lZGlhQnlEZWZhdWx0OiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0YXV0b0ltYWdlTG9hZDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGVtYWlsTm90aWZpY2F0aW9uTW9kZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0dW5yZWFkQWxlcnQ6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRub3RpZmljYXRpb25zU291bmRWb2x1bWU6IE1hdGNoLk1heWJlKE51bWJlciksXG5cdFx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRtb2JpbGVOb3RpZmljYXRpb25zOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRlbmFibGVBdXRvQXdheTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZ2hsaWdodHM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uOiBNYXRjaC5NYXliZShOdW1iZXIpLFxuXHRcdFx0XHRtZXNzYWdlVmlld01vZGU6IE1hdGNoLk1heWJlKE51bWJlciksXG5cdFx0XHRcdGhpZGVVc2VybmFtZXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRoaWRlUm9sZXM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRoaWRlQXZhdGFyczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZGVGbGV4VGFiOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0c2VuZE9uRW50ZXI6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHJvb21Db3VudGVyU2lkZWJhcjogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGxhbmd1YWdlOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRzaWRlYmFyU2hvd0Zhdm9yaXRlczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdHNpZGViYXJTaG93VW5yZWFkOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdFx0c2lkZWJhclNvcnRieTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdFx0c2lkZWJhclZpZXdNb2RlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0XHRzaWRlYmFySGlkZUF2YXRhcjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdHNpZGViYXJHcm91cEJ5VHlwZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdG11dGVGb2N1c2VkQ29udmVyc2F0aW9uczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbilcblx0XHRcdH0pXG5cdFx0fSk7XG5cblx0XHRjb25zdCB1c2VySWQgPSB0aGlzLmJvZHlQYXJhbXMudXNlcklkID8gdGhpcy5ib2R5UGFyYW1zLnVzZXJJZCA6IHRoaXMudXNlcklkO1xuXHRcdGNvbnN0IHVzZXJEYXRhID0ge1xuXHRcdFx0X2lkOiB1c2VySWQsXG5cdFx0XHRzZXR0aW5nczoge1xuXHRcdFx0XHRwcmVmZXJlbmNlczogdGhpcy5ib2R5UGFyYW1zLmRhdGFcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5kYXRhLmxhbmd1YWdlKSB7XG5cdFx0XHRjb25zdCBsYW5ndWFnZSA9IHRoaXMuYm9keVBhcmFtcy5kYXRhLmxhbmd1YWdlO1xuXHRcdFx0ZGVsZXRlIHRoaXMuYm9keVBhcmFtcy5kYXRhLmxhbmd1YWdlO1xuXHRcdFx0dXNlckRhdGEubGFuZ3VhZ2UgPSBsYW5ndWFnZTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBSb2NrZXRDaGF0LnNhdmVVc2VyKHRoaXMudXNlcklkLCB1c2VyRGF0YSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dXNlcjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkLCB7XG5cdFx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRcdCdzZXR0aW5ncy5wcmVmZXJlbmNlcyc6IDFcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9KTtcblx0fVxufSk7XG5cbi8qKlxuIERFUFJFQ0FURURcbiAvLyBUT0RPOiBSZW1vdmUgdGhpcyBhZnRlciB0aHJlZSB2ZXJzaW9ucyBoYXZlIGJlZW4gcmVsZWFzZWQuIFRoYXQgbWVhbnMgYXQgMC42NiB0aGlzIHNob3VsZCBiZSBnb25lLlxuIFRoaXMgQVBJIHJldHVybnMgdGhlIGxvZ2dlZCB1c2VyIHJvbGVzLlxuXG4gTWV0aG9kOiBHRVRcbiBSb3V0ZTogYXBpL3YxL3VzZXIucm9sZXNcbiAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXIucm9sZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRsZXQgY3VycmVudFVzZXJSb2xlcyA9IHt9O1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFVzZXJSb2xlcycpKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkgJiYgcmVzdWx0Lmxlbmd0aCA+IDApIHtcblx0XHRcdGN1cnJlbnRVc2VyUm9sZXMgPSByZXN1bHRbMF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5kZXByZWNhdGlvbldhcm5pbmcoe1xuXHRcdFx0ZW5kcG9pbnQ6ICd1c2VyLnJvbGVzJyxcblx0XHRcdHZlcnNpb25XaWxsQmVSZW1vdmU6ICd2MC42NicsXG5cdFx0XHRyZXNwb25zZTogY3VycmVudFVzZXJSb2xlc1xuXHRcdH0pKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5mb3Jnb3RQYXNzd29yZCcsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgeyBlbWFpbCB9ID0gdGhpcy5ib2R5UGFyYW1zO1xuXHRcdGlmICghZW1haWwpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgXFwnZW1haWxcXCcgcGFyYW0gaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBlbWFpbFNlbnQgPSBNZXRlb3IuY2FsbCgnc2VuZEZvcmdvdFBhc3N3b3JkRW1haWwnLCBlbWFpbCk7XG5cdFx0aWYgKGVtYWlsU2VudCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHR9XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1VzZXIgbm90IGZvdW5kJyk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuZ2V0VXNlcm5hbWVTdWdnZXN0aW9uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFVzZXJuYW1lU3VnZ2VzdGlvbicpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgcmVzdWx0IH0pO1xuXHR9XG59KTtcbiJdfQ==
