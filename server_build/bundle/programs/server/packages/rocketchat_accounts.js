(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:accounts":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_accounts/server/index.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AccountsServer: () => AccountsServer
});
module.watch(require("./config"));
let AccountsServer;
module.watch(require("@accounts/server"), {
  default(v) {
    AccountsServer = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_accounts/server/config.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let AccountsServer;
module.watch(require("@accounts/server"), {
  default(v) {
    AccountsServer = v;
  }

}, 0);
let MongoAdapter;
module.watch(require("@accounts/mongo"), {
  default(v) {
    MongoAdapter = v;
  }

}, 1);
let MongoInternals;
module.watch(require("meteor/mongo"), {
  MongoInternals(v) {
    MongoInternals = v;
  }

}, 2);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 3);
Meteor.startup(() => {
  const mongodb = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const mongoAdapter = new MongoAdapter(mongodb, {
    convertUserIdToMongoObjectId: false
  });
  AccountsServer.config({
    tokenConfigs: {
      accessToken: {
        expiresIn: '3d'
      },
      refreshToken: {
        expiresIn: '30d'
      }
    },
    passwordHashAlgorithm: 'sha256'
  }, mongoAdapter);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"@accounts":{"server":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_accounts/node_modules/@accounts/server/package.json                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "@accounts/server";
exports.version = "0.0.18";
exports.main = "lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_accounts/node_modules/@accounts/server/lib/index.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babel-runtime/regenerator"), require("babel-runtime/helpers/asyncToGenerator"), require("babel-runtime/helpers/extends"), require("babel-runtime/helpers/classCallCheck"), require("babel-runtime/helpers/createClass"), require("lodash"), require("events"), require("jsonwebtoken"), require("@accounts/common"), require("bcryptjs"), require("crypto"), require("lodash/isString"), require("babel-runtime/core-js/promise"), require("emailjs"));
	else if(typeof define === 'function' && define.amd)
		define(["babel-runtime/regenerator", "babel-runtime/helpers/asyncToGenerator", "babel-runtime/helpers/extends", "babel-runtime/helpers/classCallCheck", "babel-runtime/helpers/createClass", "lodash", "events", "jsonwebtoken", "@accounts/common", "bcryptjs", "crypto", "lodash/isString", "babel-runtime/core-js/promise", "emailjs"], factory);
	else if(typeof exports === 'object')
		exports["@accounts/server"] = factory(require("babel-runtime/regenerator"), require("babel-runtime/helpers/asyncToGenerator"), require("babel-runtime/helpers/extends"), require("babel-runtime/helpers/classCallCheck"), require("babel-runtime/helpers/createClass"), require("lodash"), require("events"), require("jsonwebtoken"), require("@accounts/common"), require("bcryptjs"), require("crypto"), require("lodash/isString"), require("babel-runtime/core-js/promise"), require("emailjs"));
	else
		root["@accounts/server"] = factory(root["babel-runtime/regenerator"], root["babel-runtime/helpers/asyncToGenerator"], root["babel-runtime/helpers/extends"], root["babel-runtime/helpers/classCallCheck"], root["babel-runtime/helpers/createClass"], root["lodash"], root["events"], root["jsonwebtoken"], root["@accounts/common"], root["bcryptjs"], root["crypto"], root["lodash/isString"], root["babel-runtime/core-js/promise"], root["emailjs"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_8__, __WEBPACK_EXTERNAL_MODULE_9__, __WEBPACK_EXTERNAL_MODULE_10__, __WEBPACK_EXTERNAL_MODULE_13__, __WEBPACK_EXTERNAL_MODULE_14__, __WEBPACK_EXTERNAL_MODULE_15__, __WEBPACK_EXTERNAL_MODULE_18__, __WEBPACK_EXTERNAL_MODULE_19__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.config = exports.encryption = exports.AccountsServer = undefined;

	var _AccountsServer = __webpack_require__(1);

	var _AccountsServer2 = _interopRequireDefault(_AccountsServer);

	var _encryption = __webpack_require__(12);

	var encryption = _interopRequireWildcard(_encryption);

	var _config = __webpack_require__(11);

	var _config2 = _interopRequireDefault(_config);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = _AccountsServer2.default; /* eslint-disable import/no-named-as-default */
	/* eslint-disable flowtype/no-types-missing-file-annotation */

	exports.AccountsServer = _AccountsServer.AccountsServer;
	exports.encryption = encryption;
	exports.config = _config2.default;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.AccountsServer = exports.ServerHooks = undefined;

	var _regenerator = __webpack_require__(2);

	var _regenerator2 = _interopRequireDefault(_regenerator);

	var _asyncToGenerator2 = __webpack_require__(3);

	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

	var _extends2 = __webpack_require__(4);

	var _extends3 = _interopRequireDefault(_extends2);

	var _classCallCheck2 = __webpack_require__(5);

	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

	var _createClass2 = __webpack_require__(6);

	var _createClass3 = _interopRequireDefault(_createClass2);

	var _lodash = __webpack_require__(7);

	var _events = __webpack_require__(8);

	var _events2 = _interopRequireDefault(_events);

	var _jsonwebtoken = __webpack_require__(9);

	var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

	var _common = __webpack_require__(10);

	var _config2 = __webpack_require__(11);

	var _config3 = _interopRequireDefault(_config2);

	var _encryption = __webpack_require__(12);

	var _tokens = __webpack_require__(16);

	var _email = __webpack_require__(17);

	var _email2 = _interopRequireDefault(_email);

	var _emailTemplates = __webpack_require__(20);

	var _emailTemplates2 = _interopRequireDefault(_emailTemplates);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var ServerHooks = exports.ServerHooks = {
	  LoginSuccess: 'LoginSuccess',
	  LoginError: 'LoginError',
	  LogoutSuccess: 'LogoutSuccess',
	  LogoutError: 'LogoutError',
	  CreateUserSuccess: 'CreateUserSuccess',
	  CreateUserError: 'CreateUserError',
	  ResumeSessionSuccess: 'ResumeSessionSuccess',
	  ResumeSessionError: 'ResumeSessionError',
	  RefreshTokensSuccess: 'RefreshTokensSuccess',
	  RefreshTokensError: 'RefreshTokensError',
	  ImpersonationSuccess: 'ImpersonationSuccess',
	  ImpersonationError: 'ImpersonationError'
	};

	var AccountsServer = exports.AccountsServer = function () {
	  function AccountsServer() {
	    (0, _classCallCheck3.default)(this, AccountsServer);
	  }

	  (0, _createClass3.default)(AccountsServer, [{
	    key: 'config',


	    /**
	     * @description Configure AccountsServer.
	     * @param {Object} options - Options for AccountsServer.
	     * @param {Object} db - DBInterface for AccountsServer.
	     * @returns {Object} - Return the options.
	     */
	    value: function config(options, db) {
	      this._options = (0, _extends3.default)({}, _config3.default, options);
	      if (!db) {
	        throw new _common.AccountsError('A database driver is required');
	      }
	      this.db = db;
	      if (this._options.sendMail) {
	        this.email = { sendMail: this._options.sendMail };
	      } else {
	        this.email = new _email2.default(this._options.email);
	      }
	      this.emailTemplates = _emailTemplates2.default;

	      if (!this.hooks) {
	        this.hooks = new _events2.default();
	      }
	    }

	    /**
	     * @description Return the AccountsServer options.
	     * @returns {AccountsServerConfiguration} - Return the options.
	     */

	  }, {
	    key: 'options',
	    value: function options() {
	      return this._options;
	    }
	  }, {
	    key: 'onLoginSuccess',
	    value: function onLoginSuccess(callback) {
	      return this._on(ServerHooks.LoginSuccess, callback);
	    }
	  }, {
	    key: 'onLoginError',
	    value: function onLoginError(callback) {
	      return this._on(ServerHooks.LoginError, callback);
	    }
	  }, {
	    key: 'onLogoutSuccess',
	    value: function onLogoutSuccess(callback) {
	      return this._on(ServerHooks.LogoutSuccess, callback);
	    }
	  }, {
	    key: 'onLogoutError',
	    value: function onLogoutError(callback) {
	      return this._on(ServerHooks.LogoutError, callback);
	    }
	  }, {
	    key: 'onCreateUserSuccess',
	    value: function onCreateUserSuccess(callback) {
	      return this._on(ServerHooks.CreateUserSuccess, callback);
	    }
	  }, {
	    key: 'onCreateUserError',
	    value: function onCreateUserError(callback) {
	      return this._on(ServerHooks.CreateUserError, callback);
	    }
	  }, {
	    key: 'onResumeSessionSuccess',
	    value: function onResumeSessionSuccess(callback) {
	      return this._on(ServerHooks.ResumeSessionSuccess, callback);
	    }
	  }, {
	    key: 'onResumeSessionError',
	    value: function onResumeSessionError(callback) {
	      return this._on(ServerHooks.ResumeSessionError, callback);
	    }
	  }, {
	    key: 'onRefreshTokensSuccess',
	    value: function onRefreshTokensSuccess(callback) {
	      return this._on(ServerHooks.RefreshTokensSuccess, callback);
	    }
	  }, {
	    key: 'onRefreshTokensError',
	    value: function onRefreshTokensError(callback) {
	      return this._on(ServerHooks.RefreshTokensError, callback);
	    }
	  }, {
	    key: 'onImpersonationSuccess',
	    value: function onImpersonationSuccess(callback) {
	      return this._on(ServerHooks.ImpersonationSuccess, callback);
	    }
	  }, {
	    key: 'onImpersonationError',
	    value: function onImpersonationError(callback) {
	      return this._on(ServerHooks.ImpersonationError, callback);
	    }

	    /**
	     * @description Login the user with his password.
	     * @param {Object} user - User to login.
	     * @param {PasswordType} password - Password of user to login.
	     * @param {string} ip - User ip.
	     * @param {string} userAgent - User user agent.
	     * @returns {Promise<Object>} - LoginReturnType.
	     */
	    // eslint-disable-next-line max-len

	  }, {
	    key: 'loginWithPassword',
	    value: function () {
	      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(user, password, ip, userAgent) {
	        var foundUser, loginResult;
	        return _regenerator2.default.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                _context.prev = 0;

	                if (!(!user || !password)) {
	                  _context.next = 3;
	                  break;
	                }

	                throw new _common.AccountsError('Unrecognized options for login request', user, 400);

	              case 3:
	                if (!(!(0, _lodash.isString)(user) && !(0, _lodash.isPlainObject)(user) || !(0, _lodash.isString)(password))) {
	                  _context.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('Match failed', user, 400);

	              case 5:
	                foundUser = void 0;

	                if (!this._options.passwordAuthenticator) {
	                  _context.next = 12;
	                  break;
	                }

	                _context.next = 9;
	                return this._externalPasswordAuthenticator(this._options.passwordAuthenticator, user, password);

	              case 9:
	                foundUser = _context.sent;
	                _context.next = 15;
	                break;

	              case 12:
	                _context.next = 14;
	                return this._defaultPasswordAuthenticator(user, password);

	              case 14:
	                foundUser = _context.sent;

	              case 15:
	                if (foundUser) {
	                  _context.next = 17;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', user, 403);

	              case 17:
	                _context.next = 19;
	                return this.loginWithUser(foundUser, ip, userAgent);

	              case 19:
	                loginResult = _context.sent;


	                this.hooks.emit(ServerHooks.LoginSuccess, loginResult);

	                return _context.abrupt('return', loginResult);

	              case 24:
	                _context.prev = 24;
	                _context.t0 = _context['catch'](0);

	                this.hooks.emit(ServerHooks.LoginError, _context.t0);

	                throw _context.t0;

	              case 28:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, this, [[0, 24]]);
	      }));

	      function loginWithPassword(_x, _x2, _x3, _x4) {
	        return _ref.apply(this, arguments);
	      }

	      return loginWithPassword;
	    }()

	    // eslint-disable-next-line max-len

	  }, {
	    key: '_externalPasswordAuthenticator',
	    value: function () {
	      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(authFn, user, password) {
	        return _regenerator2.default.wrap(function _callee2$(_context2) {
	          while (1) {
	            switch (_context2.prev = _context2.next) {
	              case 0:
	                return _context2.abrupt('return', authFn(user, password));

	              case 1:
	              case 'end':
	                return _context2.stop();
	            }
	          }
	        }, _callee2, this);
	      }));

	      function _externalPasswordAuthenticator(_x5, _x6, _x7) {
	        return _ref2.apply(this, arguments);
	      }

	      return _externalPasswordAuthenticator;
	    }()
	  }, {
	    key: '_validateLoginWithField',
	    value: function _validateLoginWithField(fieldName, user) {
	      var allowedFields = this._options.allowedLoginFields || [];
	      var isAllowed = allowedFields.includes(fieldName);

	      if (!isAllowed) {
	        throw new _common.AccountsError('Login with ' + fieldName + ' is not allowed!', user);
	      }
	    }

	    // eslint-disable-next-line max-len

	  }, {
	    key: '_defaultPasswordAuthenticator',
	    value: function () {
	      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(user, password) {
	        var _ref4, username, email, id, foundUser, hash, hashAlgorithm, pass, isPasswordValid;

	        return _regenerator2.default.wrap(function _callee3$(_context3) {
	          while (1) {
	            switch (_context3.prev = _context3.next) {
	              case 0:
	                _ref4 = (0, _lodash.isString)(user) ? (0, _common.toUsernameAndEmail)({ user: user }) : (0, _common.toUsernameAndEmail)((0, _extends3.default)({}, user)), username = _ref4.username, email = _ref4.email, id = _ref4.id;
	                foundUser = void 0;

	                if (!id) {
	                  _context3.next = 9;
	                  break;
	                }

	                this._validateLoginWithField('id', user);
	                _context3.next = 6;
	                return this.db.findUserById(id);

	              case 6:
	                foundUser = _context3.sent;
	                _context3.next = 21;
	                break;

	              case 9:
	                if (!username) {
	                  _context3.next = 16;
	                  break;
	                }

	                this._validateLoginWithField('username', user);
	                _context3.next = 13;
	                return this.db.findUserByUsername(username);

	              case 13:
	                foundUser = _context3.sent;
	                _context3.next = 21;
	                break;

	              case 16:
	                if (!email) {
	                  _context3.next = 21;
	                  break;
	                }

	                this._validateLoginWithField('email', user);
	                _context3.next = 20;
	                return this.db.findUserByEmail(email);

	              case 20:
	                foundUser = _context3.sent;

	              case 21:
	                if (foundUser) {
	                  _context3.next = 23;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', user, 403);

	              case 23:
	                _context3.next = 25;
	                return this.db.findPasswordHash(foundUser.id);

	              case 25:
	                hash = _context3.sent;

	                if (hash) {
	                  _context3.next = 28;
	                  break;
	                }

	                throw new _common.AccountsError('User has no password set', user, 403);

	              case 28:
	                hashAlgorithm = this._options.passwordHashAlgorithm;
	                pass = hashAlgorithm ? (0, _encryption.hashPassword)(password, hashAlgorithm) : password;
	                _context3.next = 32;
	                return (0, _encryption.verifyPassword)(pass, hash);

	              case 32:
	                isPasswordValid = _context3.sent;

	                if (isPasswordValid) {
	                  _context3.next = 35;
	                  break;
	                }

	                throw new _common.AccountsError('Incorrect password', user, 403);

	              case 35:
	                return _context3.abrupt('return', foundUser);

	              case 36:
	              case 'end':
	                return _context3.stop();
	            }
	          }
	        }, _callee3, this);
	      }));

	      function _defaultPasswordAuthenticator(_x8, _x9) {
	        return _ref3.apply(this, arguments);
	      }

	      return _defaultPasswordAuthenticator;
	    }()

	    /**
	     * @description Server use only. This method creates a session
	     *              without authenticating any user identity.
	     *              Any authentication should happen before calling this function.
	     * @param {UserObjectType} userId - The user object.
	     * @param {string} ip - User's ip.
	     * @param {string} userAgent - User's client agent.
	     * @returns {Promise<LoginReturnType>} - Session tokens and user object.
	     */
	    // eslint-disable-next-line max-len

	  }, {
	    key: 'loginWithUser',
	    value: function () {
	      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(user, ip, userAgent) {
	        var sessionId, _createTokens, accessToken, refreshToken, loginResult;

	        return _regenerator2.default.wrap(function _callee4$(_context4) {
	          while (1) {
	            switch (_context4.prev = _context4.next) {
	              case 0:
	                _context4.next = 2;
	                return this.db.createSession(user.id, ip, userAgent);

	              case 2:
	                sessionId = _context4.sent;
	                _createTokens = this.createTokens(sessionId), accessToken = _createTokens.accessToken, refreshToken = _createTokens.refreshToken;
	                loginResult = {
	                  sessionId: sessionId,
	                  user: this._sanitizeUser(user),
	                  tokens: {
	                    refreshToken: refreshToken,
	                    accessToken: accessToken
	                  }
	                };
	                return _context4.abrupt('return', loginResult);

	              case 6:
	              case 'end':
	                return _context4.stop();
	            }
	          }
	        }, _callee4, this);
	      }));

	      function loginWithUser(_x10, _x11, _x12) {
	        return _ref5.apply(this, arguments);
	      }

	      return loginWithUser;
	    }()

	    /**
	     * @description Create a new user.
	     * @param {Object} user - The user object.
	     * @returns {Promise<string>} - Return the id of user created.
	     */

	  }, {
	    key: 'createUser',
	    value: function () {
	      var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(user) {
	        var password, _options, validateNewUser, proposedUserObject, userId;

	        return _regenerator2.default.wrap(function _callee5$(_context5) {
	          while (1) {
	            switch (_context5.prev = _context5.next) {
	              case 0:
	                _context5.prev = 0;

	                if (!(!_common.validators.validateUsername(user.username) && !_common.validators.validateEmail(user.email))) {
	                  _context5.next = 3;
	                  break;
	                }

	                throw new _common.AccountsError('Username or Email is required', {
	                  username: user && user.username,
	                  email: user && user.email
	                });

	              case 3:
	                _context5.t0 = user.username;

	                if (!_context5.t0) {
	                  _context5.next = 8;
	                  break;
	                }

	                _context5.next = 7;
	                return this.db.findUserByUsername(user.username);

	              case 7:
	                _context5.t0 = _context5.sent;

	              case 8:
	                if (!_context5.t0) {
	                  _context5.next = 10;
	                  break;
	                }

	                throw new _common.AccountsError('Username already exists', { username: user.username });

	              case 10:
	                _context5.t1 = user.email;

	                if (!_context5.t1) {
	                  _context5.next = 15;
	                  break;
	                }

	                _context5.next = 14;
	                return this.db.findUserByEmail(user.email);

	              case 14:
	                _context5.t1 = _context5.sent;

	              case 15:
	                if (!_context5.t1) {
	                  _context5.next = 17;
	                  break;
	                }

	                throw new _common.AccountsError('Email already exists', { email: user.email });

	              case 17:
	                password = void 0;

	                if (!user.password) {
	                  _context5.next = 22;
	                  break;
	                }

	                _context5.next = 21;
	                return this._hashAndBcryptPassword(user.password);

	              case 21:
	                password = _context5.sent;

	              case 22:
	                _options = this.options(), validateNewUser = _options.validateNewUser;
	                proposedUserObject = {
	                  username: user.username,
	                  email: user.email && user.email.toLowerCase(),
	                  password: password,
	                  profile: user.profile
	                };

	                if (!(0, _lodash.isFunction)(validateNewUser)) {
	                  _context5.next = 27;
	                  break;
	                }

	                _context5.next = 27;
	                return validateNewUser(proposedUserObject);

	              case 27:
	                _context5.next = 29;
	                return this.db.createUser(proposedUserObject);

	              case 29:
	                userId = _context5.sent;

	                this.hooks.emit(ServerHooks.CreateUserSuccess, userId, proposedUserObject);

	                return _context5.abrupt('return', userId);

	              case 34:
	                _context5.prev = 34;
	                _context5.t2 = _context5['catch'](0);

	                this.hooks.emit(ServerHooks.CreateUserError, _context5.t2);

	                throw _context5.t2;

	              case 38:
	              case 'end':
	                return _context5.stop();
	            }
	          }
	        }, _callee5, this, [[0, 34]]);
	      }));

	      function createUser(_x13) {
	        return _ref6.apply(this, arguments);
	      }

	      return createUser;
	    }()
	  }, {
	    key: '_on',
	    value: function _on(eventName, callback) {
	      var _this = this;

	      this.hooks.on(eventName, callback);

	      return function () {
	        return _this.hooks.removeListener(eventName, callback);
	      };
	    }

	    /**
	     * @description Impersonate to another user.
	     * @param {string} accessToken - User access token.
	     * @param {string} username - impersonated user username.
	     * @param {string} ip - The user ip.
	     * @param {string} userAgent - User user agent.
	     * @returns {Promise<Object>} - ImpersonateReturnType
	     */
	    // eslint-disable-next-line max-len

	  }, {
	    key: 'impersonate',
	    value: function () {
	      var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(accessToken, username, ip, userAgent) {
	        var session, user, impersonatedUser, isAuthorized, newSessionId, impersonationTokens, impersonationResult;
	        return _regenerator2.default.wrap(function _callee6$(_context6) {
	          while (1) {
	            switch (_context6.prev = _context6.next) {
	              case 0:
	                _context6.prev = 0;

	                if ((0, _lodash.isString)(accessToken)) {
	                  _context6.next = 3;
	                  break;
	                }

	                throw new _common.AccountsError('An access token is required');

	              case 3:
	                _context6.prev = 3;

	                _jsonwebtoken2.default.verify(accessToken, this._options.tokenSecret);
	                _context6.next = 10;
	                break;

	              case 7:
	                _context6.prev = 7;
	                _context6.t0 = _context6['catch'](3);
	                throw new _common.AccountsError('Access token is not valid');

	              case 10:
	                _context6.next = 12;
	                return this.findSessionByAccessToken(accessToken);

	              case 12:
	                session = _context6.sent;

	                if (session.valid) {
	                  _context6.next = 15;
	                  break;
	                }

	                throw new _common.AccountsError('Session is not valid for user');

	              case 15:
	                _context6.next = 17;
	                return this.db.findUserById(session.userId);

	              case 17:
	                user = _context6.sent;

	                if (user) {
	                  _context6.next = 20;
	                  break;
	                }

	                throw new _common.AccountsError('User not found');

	              case 20:
	                _context6.next = 22;
	                return this.db.findUserByUsername(username);

	              case 22:
	                impersonatedUser = _context6.sent;

	                if (impersonatedUser) {
	                  _context6.next = 25;
	                  break;
	                }

	                throw new _common.AccountsError('User ' + username + ' not found');

	              case 25:
	                if (this._options.impersonationAuthorize) {
	                  _context6.next = 27;
	                  break;
	                }

	                return _context6.abrupt('return', { authorized: false });

	              case 27:
	                _context6.next = 29;
	                return this._options.impersonationAuthorize(user, impersonatedUser);

	              case 29:
	                isAuthorized = _context6.sent;

	                if (isAuthorized) {
	                  _context6.next = 32;
	                  break;
	                }

	                return _context6.abrupt('return', { authorized: false });

	              case 32:
	                _context6.next = 34;
	                return this.db.createSession(impersonatedUser.id, ip, userAgent, { impersonatorUserId: user.id });

	              case 34:
	                newSessionId = _context6.sent;
	                impersonationTokens = this.createTokens(newSessionId, true);
	                impersonationResult = {
	                  authorized: true,
	                  tokens: impersonationTokens,
	                  user: this._sanitizeUser(impersonatedUser)
	                };


	                this.hooks.emit(ServerHooks.ImpersonationSuccess, user, impersonationResult);

	                return _context6.abrupt('return', impersonationResult);

	              case 41:
	                _context6.prev = 41;
	                _context6.t1 = _context6['catch'](0);

	                this.hooks.emit(ServerHooks.ImpersonationError, _context6.t1);

	                throw _context6.t1;

	              case 45:
	              case 'end':
	                return _context6.stop();
	            }
	          }
	        }, _callee6, this, [[0, 41], [3, 7]]);
	      }));

	      function impersonate(_x14, _x15, _x16, _x17) {
	        return _ref7.apply(this, arguments);
	      }

	      return impersonate;
	    }()

	    /**
	     * @description Refresh a user token.
	     * @param {string} accessToken - User access token.
	     * @param {string} refreshToken - User refresh token.
	     * @param {string} ip - User ip.
	     * @param {string} userAgent - User user agent.
	     * @returns {Promise<Object>} - LoginReturnType.
	     */
	    // eslint-disable-next-line max-len

	  }, {
	    key: 'refreshTokens',
	    value: function () {
	      var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(accessToken, refreshToken, ip, userAgent) {
	        var sessionId, decodedAccessToken, session, user, tokens, result;
	        return _regenerator2.default.wrap(function _callee7$(_context7) {
	          while (1) {
	            switch (_context7.prev = _context7.next) {
	              case 0:
	                _context7.prev = 0;

	                if (!(!(0, _lodash.isString)(accessToken) || !(0, _lodash.isString)(refreshToken))) {
	                  _context7.next = 3;
	                  break;
	                }

	                throw new _common.AccountsError('An accessToken and refreshToken are required');

	              case 3:
	                sessionId = void 0;
	                _context7.prev = 4;

	                _jsonwebtoken2.default.verify(refreshToken, this._options.tokenSecret);
	                decodedAccessToken = _jsonwebtoken2.default.verify(accessToken, this._options.tokenSecret, {
	                  ignoreExpiration: true
	                });

	                sessionId = decodedAccessToken.data.sessionId;
	                _context7.next = 13;
	                break;

	              case 10:
	                _context7.prev = 10;
	                _context7.t0 = _context7['catch'](4);
	                throw new _common.AccountsError('Tokens are not valid');

	              case 13:
	                _context7.next = 15;
	                return this.db.findSessionById(sessionId);

	              case 15:
	                session = _context7.sent;

	                if (session) {
	                  _context7.next = 18;
	                  break;
	                }

	                throw new _common.AccountsError('Session not found');

	              case 18:
	                if (!session.valid) {
	                  _context7.next = 32;
	                  break;
	                }

	                _context7.next = 21;
	                return this.db.findUserById(session.userId);

	              case 21:
	                user = _context7.sent;

	                if (user) {
	                  _context7.next = 24;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { id: session.userId });

	              case 24:
	                tokens = this.createTokens(sessionId);
	                _context7.next = 27;
	                return this.db.updateSession(sessionId, ip, userAgent);

	              case 27:
	                result = {
	                  sessionId: sessionId,
	                  user: this._sanitizeUser(user),
	                  tokens: tokens
	                };


	                this.hooks.emit(ServerHooks.RefreshTokensSuccess, result);

	                return _context7.abrupt('return', result);

	              case 32:
	                throw new _common.AccountsError('Session is no longer valid', { id: session.userId });

	              case 33:
	                _context7.next = 39;
	                break;

	              case 35:
	                _context7.prev = 35;
	                _context7.t1 = _context7['catch'](0);

	                this.hooks.emit(ServerHooks.RefreshTokensError, _context7.t1);

	                throw _context7.t1;

	              case 39:
	              case 'end':
	                return _context7.stop();
	            }
	          }
	        }, _callee7, this, [[0, 35], [4, 10]]);
	      }));

	      function refreshTokens(_x18, _x19, _x20, _x21) {
	        return _ref8.apply(this, arguments);
	      }

	      return refreshTokens;
	    }()

	    /**
	     * @description Refresh a user token.
	     * @param {string} sessionId - User session id.
	     * @param {boolean} isImpersonated - Should be true if impersonating another user.
	     * @returns {Promise<Object>} - Return a new accessToken and refreshToken.
	     */

	  }, {
	    key: 'createTokens',
	    value: function createTokens(sessionId) {
	      var isImpersonated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	      var _options2 = this._options,
	          _options2$tokenSecret = _options2.tokenSecret,
	          tokenSecret = _options2$tokenSecret === undefined ? _config3.default.tokenSecret : _options2$tokenSecret,
	          _options2$tokenConfig = _options2.tokenConfigs,
	          tokenConfigs = _options2$tokenConfig === undefined ? _config3.default.tokenConfigs : _options2$tokenConfig;

	      var accessToken = (0, _tokens.generateAccessToken)({
	        data: {
	          sessionId: sessionId,
	          isImpersonated: isImpersonated
	        },
	        secret: tokenSecret,
	        config: tokenConfigs.accessToken || {}
	      });
	      var refreshToken = (0, _tokens.generateRefreshToken)({
	        secret: tokenSecret,
	        config: tokenConfigs.refreshToken || {}
	      });
	      return { accessToken: accessToken, refreshToken: refreshToken };
	    }

	    /**
	     * @description Logout a user and invalidate his session.
	     * @param {string} accessToken - User access token.
	     * @returns {Promise<void>} - Return a promise.
	     */

	  }, {
	    key: 'logout',
	    value: function () {
	      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(accessToken) {
	        var session, user;
	        return _regenerator2.default.wrap(function _callee8$(_context8) {
	          while (1) {
	            switch (_context8.prev = _context8.next) {
	              case 0:
	                _context8.prev = 0;
	                _context8.next = 3;
	                return this.findSessionByAccessToken(accessToken);

	              case 3:
	                session = _context8.sent;

	                if (!session.valid) {
	                  _context8.next = 15;
	                  break;
	                }

	                _context8.next = 7;
	                return this.db.findUserById(session.userId);

	              case 7:
	                user = _context8.sent;

	                if (user) {
	                  _context8.next = 10;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { id: session.userId });

	              case 10:
	                _context8.next = 12;
	                return this.db.invalidateSession(session.sessionId);

	              case 12:
	                this.hooks.emit(ServerHooks.LogoutSuccess, this._sanitizeUser(user), session, accessToken);
	                _context8.next = 16;
	                break;

	              case 15:
	                throw new _common.AccountsError('Session is no longer valid', { id: session.userId });

	              case 16:
	                _context8.next = 22;
	                break;

	              case 18:
	                _context8.prev = 18;
	                _context8.t0 = _context8['catch'](0);

	                this.hooks.emit(ServerHooks.LogoutError, _context8.t0);

	                throw _context8.t0;

	              case 22:
	              case 'end':
	                return _context8.stop();
	            }
	          }
	        }, _callee8, this, [[0, 18]]);
	      }));

	      function logout(_x23) {
	        return _ref9.apply(this, arguments);
	      }

	      return logout;
	    }()
	  }, {
	    key: 'resumeSession',
	    value: function () {
	      var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(accessToken) {
	        var session, user;
	        return _regenerator2.default.wrap(function _callee9$(_context9) {
	          while (1) {
	            switch (_context9.prev = _context9.next) {
	              case 0:
	                _context9.prev = 0;
	                _context9.next = 3;
	                return this.findSessionByAccessToken(accessToken);

	              case 3:
	                session = _context9.sent;

	                if (!session.valid) {
	                  _context9.next = 21;
	                  break;
	                }

	                _context9.next = 7;
	                return this.db.findUserById(session.userId);

	              case 7:
	                user = _context9.sent;

	                if (user) {
	                  _context9.next = 10;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { id: session.userId });

	              case 10:
	                if (!this._options.resumeSessionValidator) {
	                  _context9.next = 19;
	                  break;
	                }

	                _context9.prev = 11;
	                _context9.next = 14;
	                return this._options.resumeSessionValidator(user, session);

	              case 14:
	                _context9.next = 19;
	                break;

	              case 16:
	                _context9.prev = 16;
	                _context9.t0 = _context9['catch'](11);
	                throw new _common.AccountsError(_context9.t0, { id: session.userId }, 403);

	              case 19:

	                this.hooks.emit(ServerHooks.ResumeSessionSuccess, user, accessToken);

	                return _context9.abrupt('return', this._sanitizeUser(user));

	              case 21:

	                this.hooks.emit(ServerHooks.ResumeSessionError, new _common.AccountsError('Invalid Session', { id: session.userId }));

	                return _context9.abrupt('return', null);

	              case 25:
	                _context9.prev = 25;
	                _context9.t1 = _context9['catch'](0);

	                this.hooks.emit(ServerHooks.ResumeSessionError, _context9.t1);

	                throw _context9.t1;

	              case 29:
	              case 'end':
	                return _context9.stop();
	            }
	          }
	        }, _callee9, this, [[0, 25], [11, 16]]);
	      }));

	      function resumeSession(_x24) {
	        return _ref10.apply(this, arguments);
	      }

	      return resumeSession;
	    }()
	  }, {
	    key: 'findSessionByAccessToken',
	    value: function () {
	      var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(accessToken) {
	        var sessionId, decodedAccessToken, session;
	        return _regenerator2.default.wrap(function _callee10$(_context10) {
	          while (1) {
	            switch (_context10.prev = _context10.next) {
	              case 0:
	                if ((0, _lodash.isString)(accessToken)) {
	                  _context10.next = 2;
	                  break;
	                }

	                throw new _common.AccountsError('An accessToken is required');

	              case 2:
	                sessionId = void 0;
	                _context10.prev = 3;
	                decodedAccessToken = _jsonwebtoken2.default.verify(accessToken, this._options.tokenSecret);

	                sessionId = decodedAccessToken.data.sessionId;
	                _context10.next = 11;
	                break;

	              case 8:
	                _context10.prev = 8;
	                _context10.t0 = _context10['catch'](3);
	                throw new _common.AccountsError('Tokens are not valid');

	              case 11:
	                _context10.next = 13;
	                return this.db.findSessionById(sessionId);

	              case 13:
	                session = _context10.sent;

	                if (session) {
	                  _context10.next = 16;
	                  break;
	                }

	                throw new _common.AccountsError('Session not found');

	              case 16:
	                return _context10.abrupt('return', session);

	              case 17:
	              case 'end':
	                return _context10.stop();
	            }
	          }
	        }, _callee10, this, [[3, 8]]);
	      }));

	      function findSessionByAccessToken(_x25) {
	        return _ref11.apply(this, arguments);
	      }

	      return findSessionByAccessToken;
	    }()

	    /**
	     * @description Find a user by one of his emails.
	     * @param {string} email - User email.
	     * @returns {Promise<Object>} - Return a user or null if not found.
	     */

	  }, {
	    key: 'findUserByEmail',
	    value: function findUserByEmail(email) {
	      return this.db.findUserByEmail(email);
	    }

	    /**
	     * @description Find a user by his username.
	     * @param {string} username - User username.
	     * @returns {Promise<Object>} - Return a user or null if not found.
	     */

	  }, {
	    key: 'findUserByUsername',
	    value: function findUserByUsername(username) {
	      return this.db.findUserByUsername(username);
	    }

	    /**
	     * @description Find a user by his id.
	     * @param {string} userId - User id.
	     * @returns {Promise<Object>} - Return a user or null if not found.
	     */

	  }, {
	    key: 'findUserById',
	    value: function findUserById(userId) {
	      return this.db.findUserById(userId);
	    }

	    /**
	     * @description Add an email address for a user.
	     * Use this instead of directly updating the database.
	     * @param {string} userId - User id.
	     * @param {string} newEmail - A new email address for the user.
	     * @param {boolean} [verified] - Whether the new email address should be marked as verified.
	     * Defaults to false.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'addEmail',
	    value: function addEmail(userId, newEmail, verified) {
	      return this.db.addEmail(userId, newEmail, verified);
	    }

	    /**
	     * @description Remove an email address for a user.
	     * Use this instead of directly updating the database.
	     * @param {string} userId - User id.
	     * @param {string} email - The email address to remove.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'removeEmail',
	    value: function removeEmail(userId, email) {
	      return this.db.removeEmail(userId, email);
	    }

	    /**
	     * @description Marks the user's email address as verified.
	     * @param {string} token - The token retrieved from the verification URL.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'verifyEmail',
	    value: function () {
	      var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11(token) {
	        var user, verificationTokens, tokenRecord, emailRecord;
	        return _regenerator2.default.wrap(function _callee11$(_context11) {
	          while (1) {
	            switch (_context11.prev = _context11.next) {
	              case 0:
	                _context11.next = 2;
	                return this.db.findUserByEmailVerificationToken(token);

	              case 2:
	                user = _context11.sent;

	                if (user) {
	                  _context11.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('Verify email link expired');

	              case 5:
	                verificationTokens = (0, _lodash.get)(user, ['services', 'email', 'verificationTokens'], []);
	                tokenRecord = (0, _lodash.find)(verificationTokens, function (t) {
	                  return t.token === token;
	                });

	                if (tokenRecord) {
	                  _context11.next = 9;
	                  break;
	                }

	                throw new _common.AccountsError('Verify email link expired');

	              case 9:
	                // TODO check time for expiry date
	                emailRecord = (0, _lodash.find)(user.emails, function (e) {
	                  return e.address === tokenRecord.address;
	                });

	                if (emailRecord) {
	                  _context11.next = 12;
	                  break;
	                }

	                throw new _common.AccountsError('Verify email link is for unknown address');

	              case 12:
	                _context11.next = 14;
	                return this.db.verifyEmail(user.id, emailRecord.address);

	              case 14:
	              case 'end':
	                return _context11.stop();
	            }
	          }
	        }, _callee11, this);
	      }));

	      function verifyEmail(_x26) {
	        return _ref12.apply(this, arguments);
	      }

	      return verifyEmail;
	    }()

	    /**
	     * @description Reset the password for a user using a token received in email.
	     * @param {string} token - The token retrieved from the reset password URL.
	     * @param {string} newPassword - A new password for the user.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'resetPassword',
	    value: function () {
	      var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(token, newPassword) {
	        var user, resetTokens, resetTokenRecord, emails, password;
	        return _regenerator2.default.wrap(function _callee12$(_context12) {
	          while (1) {
	            switch (_context12.prev = _context12.next) {
	              case 0:
	                _context12.next = 2;
	                return this.db.findUserByResetPasswordToken(token);

	              case 2:
	                user = _context12.sent;

	                if (user) {
	                  _context12.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('Reset password link expired');

	              case 5:

	                // TODO move this getter into a password service module
	                resetTokens = (0, _lodash.get)(user, ['services', 'password', 'reset']);
	                resetTokenRecord = (0, _lodash.find)(resetTokens, function (t) {
	                  return t.token === token;
	                });

	                if (!this._isTokenExpired(token, resetTokenRecord)) {
	                  _context12.next = 9;
	                  break;
	                }

	                throw new _common.AccountsError('Reset password link expired');

	              case 9:
	                emails = user.emails || [];

	                if ((0, _lodash.includes)(emails.map(function (email) {
	                  return email.address;
	                }), resetTokenRecord.address)) {
	                  _context12.next = 12;
	                  break;
	                }

	                throw new _common.AccountsError('Token has invalid email address');

	              case 12:
	                _context12.next = 14;
	                return this._hashAndBcryptPassword(newPassword);

	              case 14:
	                password = _context12.sent;
	                _context12.next = 17;
	                return this.db.setResetPasssword(user.id, resetTokenRecord.address, password, token);

	              case 17:
	                // Changing the password should invalidate existing sessions
	                this.db.invalidateAllSessions(user.id);

	              case 18:
	              case 'end':
	                return _context12.stop();
	            }
	          }
	        }, _callee12, this);
	      }));

	      function resetPassword(_x27, _x28) {
	        return _ref13.apply(this, arguments);
	      }

	      return resetPassword;
	    }()
	  }, {
	    key: '_isTokenExpired',
	    value: function _isTokenExpired(token, tokenRecord) {
	      return !tokenRecord || Number(tokenRecord.when) + this._options.emailTokensExpiry < Date.now();
	    }

	    /**
	     * @description Change the password for a user.
	     * @param {string} userId - User id.
	     * @param {string} newPassword - A new password for the user.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'setPassword',
	    value: function () {
	      var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13(userId, newPassword) {
	        var password;
	        return _regenerator2.default.wrap(function _callee13$(_context13) {
	          while (1) {
	            switch (_context13.prev = _context13.next) {
	              case 0:
	                _context13.next = 2;
	                return (0, _encryption.bcryptPassword)(newPassword);

	              case 2:
	                password = _context13.sent;
	                return _context13.abrupt('return', this.db.setPasssword(userId, password));

	              case 4:
	              case 'end':
	                return _context13.stop();
	            }
	          }
	        }, _callee13, this);
	      }));

	      function setPassword(_x29, _x30) {
	        return _ref14.apply(this, arguments);
	      }

	      return setPassword;
	    }()

	    /**
	     * @description Change the profile for a user.
	     * @param {string} userId - User id.
	     * @param {Object} profile - The new user profile.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'setProfile',
	    value: function () {
	      var _ref15 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee14(userId, profile) {
	        var user;
	        return _regenerator2.default.wrap(function _callee14$(_context14) {
	          while (1) {
	            switch (_context14.prev = _context14.next) {
	              case 0:
	                _context14.next = 2;
	                return this.db.findUserById(userId);

	              case 2:
	                user = _context14.sent;

	                if (user) {
	                  _context14.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { id: userId });

	              case 5:
	                _context14.next = 7;
	                return this.db.setProfile(userId, profile);

	              case 7:
	              case 'end':
	                return _context14.stop();
	            }
	          }
	        }, _callee14, this);
	      }));

	      function setProfile(_x31, _x32) {
	        return _ref15.apply(this, arguments);
	      }

	      return setProfile;
	    }()

	    /**
	     * @description Update the profile for a user,
	     * the new profile will be added to the existing one.
	     * @param {string} userId - User id.
	     * @param {Object} profile - User profile to add.
	     * @returns {Promise<Object>} - Return a Promise.
	     */

	  }, {
	    key: 'updateProfile',
	    value: function () {
	      var _ref16 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee15(userId, profile) {
	        var user;
	        return _regenerator2.default.wrap(function _callee15$(_context15) {
	          while (1) {
	            switch (_context15.prev = _context15.next) {
	              case 0:
	                _context15.next = 2;
	                return this.db.findUserById(userId);

	              case 2:
	                user = _context15.sent;

	                if (user) {
	                  _context15.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { id: userId });

	              case 5:
	                return _context15.abrupt('return', this.db.setProfile(userId, (0, _extends3.default)({}, user.profile, profile)));

	              case 6:
	              case 'end':
	                return _context15.stop();
	            }
	          }
	        }, _callee15, this);
	      }));

	      function updateProfile(_x33, _x34) {
	        return _ref16.apply(this, arguments);
	      }

	      return updateProfile;
	    }()

	    /**
	     * @description Send an email with a link the user can use verify their email address.
	     * @param {string} [address] - Which address of the user's to send the email to.
	     * This address must be in the user's emails list.
	     * Defaults to the first unverified email in the list.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'sendVerificationEmail',
	    value: function () {
	      var _ref17 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee16(address) {
	        var user, email, emails, token, resetPasswordMail;
	        return _regenerator2.default.wrap(function _callee16$(_context16) {
	          while (1) {
	            switch (_context16.prev = _context16.next) {
	              case 0:
	                _context16.next = 2;
	                return this.db.findUserByEmail(address);

	              case 2:
	                user = _context16.sent;

	                if (user) {
	                  _context16.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { email: address });

	              case 5:
	                // If no address provided find the first unverified email
	                if (!address) {
	                  email = (0, _lodash.find)(user.emails, function (e) {
	                    return !e.verified;
	                  });

	                  address = email && email.address; // eslint-disable-line no-param-reassign
	                }
	                // Make sure the address is valid
	                emails = user.emails || [];

	                if (!(!address || !(0, _lodash.includes)(emails.map(function (email) {
	                  return email.address;
	                }), address))) {
	                  _context16.next = 9;
	                  break;
	                }

	                throw new _common.AccountsError('No such email address for user');

	              case 9:
	                token = (0, _tokens.generateRandomToken)();
	                _context16.next = 12;
	                return this.db.addEmailVerificationToken(user.id, address, token);

	              case 12:
	                resetPasswordMail = this._prepareMail(address, token, this._sanitizeUser(user), 'verify-email', this.emailTemplates.verifyEmail, this.emailTemplates.from);
	                _context16.next = 15;
	                return this.email.sendMail(resetPasswordMail);

	              case 15:
	              case 'end':
	                return _context16.stop();
	            }
	          }
	        }, _callee16, this);
	      }));

	      function sendVerificationEmail(_x35) {
	        return _ref17.apply(this, arguments);
	      }

	      return sendVerificationEmail;
	    }()

	    /**
	     * @description Send an email with a link the user can use to reset their password.
	     * @param {string} [address] - Which address of the user's to send the email to.
	     * This address must be in the user's emails list.
	     * Defaults to the first email in the list.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'sendResetPasswordEmail',
	    value: function () {
	      var _ref18 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee17(address) {
	        var user, token, resetPasswordMail;
	        return _regenerator2.default.wrap(function _callee17$(_context17) {
	          while (1) {
	            switch (_context17.prev = _context17.next) {
	              case 0:
	                _context17.next = 2;
	                return this.db.findUserByEmail(address);

	              case 2:
	                user = _context17.sent;

	                if (user) {
	                  _context17.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { email: address });

	              case 5:
	                address = this._getFirstUserEmail(user, address); // eslint-disable-line no-param-reassign
	                token = (0, _tokens.generateRandomToken)();
	                _context17.next = 9;
	                return this.db.addResetPasswordToken(user.id, address, token);

	              case 9:
	                resetPasswordMail = this._prepareMail(address, token, this._sanitizeUser(user), 'reset-password', this.emailTemplates.resetPassword, this.emailTemplates.from);
	                _context17.next = 12;
	                return this.email.sendMail(resetPasswordMail);

	              case 12:
	              case 'end':
	                return _context17.stop();
	            }
	          }
	        }, _callee17, this);
	      }));

	      function sendResetPasswordEmail(_x36) {
	        return _ref18.apply(this, arguments);
	      }

	      return sendResetPasswordEmail;
	    }()

	    /**
	     * @description Send an email with a link the user can use to set their initial password.
	     * @param {string} [address] - Which address of the user's to send the email to.
	     * This address must be in the user's emails list.
	     * Defaults to the first email in the list.
	     * @returns {Promise<void>} - Return a Promise.
	     */

	  }, {
	    key: 'sendEnrollmentEmail',
	    value: function () {
	      var _ref19 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee18(address) {
	        var user, token, enrollmentMail;
	        return _regenerator2.default.wrap(function _callee18$(_context18) {
	          while (1) {
	            switch (_context18.prev = _context18.next) {
	              case 0:
	                _context18.next = 2;
	                return this.db.findUserByEmail(address);

	              case 2:
	                user = _context18.sent;

	                if (user) {
	                  _context18.next = 5;
	                  break;
	                }

	                throw new _common.AccountsError('User not found', { email: address });

	              case 5:
	                address = this._getFirstUserEmail(user, address); // eslint-disable-line no-param-reassign
	                token = (0, _tokens.generateRandomToken)();
	                _context18.next = 9;
	                return this.db.addResetPasswordToken(user.id, address, token, 'enroll');

	              case 9:
	                enrollmentMail = this._prepareMail(address, token, this._sanitizeUser(user), 'enroll-account', this.emailTemplates.enrollAccount, this.emailTemplates.from);
	                _context18.next = 12;
	                return this.email.sendMail(enrollmentMail);

	              case 12:
	              case 'end':
	                return _context18.stop();
	            }
	          }
	        }, _callee18, this);
	      }));

	      function sendEnrollmentEmail(_x37) {
	        return _ref19.apply(this, arguments);
	      }

	      return sendEnrollmentEmail;
	    }()
	  }, {
	    key: '_internalUserSanitizer',
	    value: function _internalUserSanitizer(user) {
	      return (0, _lodash.omit)(user, ['services']);
	    }
	  }, {
	    key: '_sanitizeUser',
	    value: function _sanitizeUser(user) {
	      var _options3 = this.options(),
	          userObjectSanitizer = _options3.userObjectSanitizer;

	      return userObjectSanitizer(this._internalUserSanitizer(user), _lodash.omit, _lodash.pick);
	    }
	  }, {
	    key: '_prepareMail',
	    value: function _prepareMail() {
	      if (this._options.prepareMail) {
	        var _options4;

	        return (_options4 = this._options).prepareMail.apply(_options4, arguments);
	      }
	      return this._defaultPrepareEmail.apply(this, arguments);
	    }

	    // eslint-disable-next-line max-len

	  }, {
	    key: '_defaultPrepareEmail',
	    value: function _defaultPrepareEmail(to, token, user, pathFragment, emailTemplate, from) {
	      var tokenizedUrl = this._defaultCreateTokenizedUrl(pathFragment, token);
	      return {
	        from: emailTemplate.from || from,
	        to: to,
	        subject: emailTemplate.subject(user),
	        text: emailTemplate.text(user, tokenizedUrl)
	      };
	    }
	  }, {
	    key: '_defaultCreateTokenizedUrl',
	    value: function _defaultCreateTokenizedUrl(pathFragment, token) {
	      var siteUrl = this._options.siteUrl || _config3.default.siteUrl;
	      return siteUrl + '/' + pathFragment + '/' + token;
	    }
	  }, {
	    key: '_getFirstUserEmail',
	    value: function _getFirstUserEmail(user, address) {
	      // Pick the first email if we weren't passed an email
	      if (!address && user.emails && user.emails[0]) {
	        address = user.emails[0].address; // eslint-disable-line no-param-reassign
	      }
	      // Make sure the address is valid
	      var emails = user.emails || [];
	      if (!address || !(0, _lodash.includes)(emails.map(function (email) {
	        return email.address;
	      }), address)) {
	        throw new _common.AccountsError('No such email address for user');
	      }
	      return address;
	    }
	  }, {
	    key: '_hashAndBcryptPassword',
	    value: function () {
	      var _ref20 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee19(password) {
	        var hashAlgorithm, hashedPassword;
	        return _regenerator2.default.wrap(function _callee19$(_context19) {
	          while (1) {
	            switch (_context19.prev = _context19.next) {
	              case 0:
	                hashAlgorithm = this._options.passwordHashAlgorithm;
	                hashedPassword = hashAlgorithm ? (0, _encryption.hashPassword)(password, hashAlgorithm) : password;
	                return _context19.abrupt('return', (0, _encryption.bcryptPassword)(hashedPassword));

	              case 3:
	              case 'end':
	                return _context19.stop();
	            }
	          }
	        }, _callee19, this);
	      }));

	      function _hashAndBcryptPassword(_x38) {
	        return _ref20.apply(this, arguments);
	      }

	      return _hashAndBcryptPassword;
	    }()
	  }]);
	  return AccountsServer;
	}();

	exports.default = new AccountsServer();

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/regenerator");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/helpers/asyncToGenerator");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/helpers/extends");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/helpers/classCallCheck");

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/helpers/createClass");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	module.exports = require("lodash");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	module.exports = require("events");

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	module.exports = require("jsonwebtoken");

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	module.exports = require("@accounts/common");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends2 = __webpack_require__(4);

	var _extends3 = _interopRequireDefault(_extends2);

	var _common = __webpack_require__(10);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	// eslint-disable-next-line max-len

	// eslint-disable-next-line max-len
	exports.default = (0, _extends3.default)({}, _common.config, {
	  tokenSecret: 'terrible secret',
	  tokenConfigs: {
	    accessToken: {
	      expiresIn: '90m'
	    },
	    refreshToken: {
	      expiresIn: '1d'
	    }
	  },
	  userObjectSanitizer: function userObjectSanitizer(user) {
	    return user;
	  },
	  allowedLoginFields: ['id', 'email', 'username'],
	  emailTokensExpiry: 1000 * 3600 // 1 hour in milis
	  // TODO Investigate oauthSecretKey
	  // oauthSecretKey
	});

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.verifyPassword = exports.hashPassword = exports.bcryptPassword = undefined;

	var _regenerator = __webpack_require__(2);

	var _regenerator2 = _interopRequireDefault(_regenerator);

	var _asyncToGenerator2 = __webpack_require__(3);

	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

	var _bcryptjs = __webpack_require__(13);

	var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

	var _crypto = __webpack_require__(14);

	var _crypto2 = _interopRequireDefault(_crypto);

	var _isString = __webpack_require__(15);

	var _isString2 = _interopRequireDefault(_isString);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var bcryptPassword = function () {
	  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(password) {
	    var salt, hash;
	    return _regenerator2.default.wrap(function _callee$(_context) {
	      while (1) {
	        switch (_context.prev = _context.next) {
	          case 0:
	            _context.next = 2;
	            return _bcryptjs2.default.genSalt(10);

	          case 2:
	            salt = _context.sent;
	            _context.next = 5;
	            return _bcryptjs2.default.hash(password, salt);

	          case 5:
	            hash = _context.sent;
	            return _context.abrupt('return', hash);

	          case 7:
	          case 'end':
	            return _context.stop();
	        }
	      }
	    }, _callee, undefined);
	  }));

	  return function bcryptPassword(_x) {
	    return _ref.apply(this, arguments);
	  };
	}();

	var hashPassword = function hashPassword(password, algorithm) {
	  if ((0, _isString2.default)(password)) {
	    var hash = _crypto2.default.createHash(algorithm);
	    hash.update(password);
	    return hash.digest('hex');
	  }

	  return password.digest;
	};

	var verifyPassword = function () {
	  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(password, hash) {
	    return _regenerator2.default.wrap(function _callee2$(_context2) {
	      while (1) {
	        switch (_context2.prev = _context2.next) {
	          case 0:
	            return _context2.abrupt('return', _bcryptjs2.default.compare(password, hash));

	          case 1:
	          case 'end':
	            return _context2.stop();
	        }
	      }
	    }, _callee2, undefined);
	  }));

	  return function verifyPassword(_x2, _x3) {
	    return _ref2.apply(this, arguments);
	  };
	}();

	exports.bcryptPassword = bcryptPassword;
	exports.hashPassword = hashPassword;
	exports.verifyPassword = verifyPassword;

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	module.exports = require("bcryptjs");

/***/ }),
/* 14 */
/***/ (function(module, exports) {

	module.exports = require("crypto");

/***/ }),
/* 15 */
/***/ (function(module, exports) {

	module.exports = require("lodash/isString");

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.generateRefreshToken = exports.generateAccessToken = exports.generateRandomToken = undefined;

	var _jsonwebtoken = __webpack_require__(9);

	var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

	var _crypto = __webpack_require__(14);

	var _crypto2 = _interopRequireDefault(_crypto);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var generateRandomToken = exports.generateRandomToken = function generateRandomToken() {
	  var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 43;
	  return _crypto2.default.randomBytes(length).toString('hex');
	};

	var generateAccessToken = exports.generateAccessToken = function generateAccessToken(_ref) {
	  var secret = _ref.secret,
	      data = _ref.data,
	      config = _ref.config;
	  return _jsonwebtoken2.default.sign({
	    data: data
	  }, secret, config);
	};

	var generateRefreshToken = exports.generateRefreshToken = function generateRefreshToken(_ref2) {
	  var secret = _ref2.secret,
	      data = _ref2.data,
	      config = _ref2.config;
	  return _jsonwebtoken2.default.sign({
	    data: data
	  }, secret, config);
	};

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _promise = __webpack_require__(18);

	var _promise2 = _interopRequireDefault(_promise);

	var _classCallCheck2 = __webpack_require__(5);

	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

	var _createClass2 = __webpack_require__(6);

	var _createClass3 = _interopRequireDefault(_createClass2);

	var _emailjs = __webpack_require__(19);

	var _emailjs2 = _interopRequireDefault(_emailjs);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var Email = function () {
	  function Email(emailConfig) {
	    (0, _classCallCheck3.default)(this, Email);

	    if (emailConfig) {
	      this.server = _emailjs2.default.server.connect(emailConfig);
	    }
	  }

	  (0, _createClass3.default)(Email, [{
	    key: 'sendMail',
	    value: function sendMail(mail) {
	      var _this = this;

	      return new _promise2.default(function (resolve, reject) {
	        // eslint-disable-line flowtype/require-parameter-type
	        // If no configuration for email just warn the user
	        if (!_this.server) {
	          console.log('No configuration for email, you must set an email configuration');
	          resolve();
	          return;
	        }
	        _this.server.send(mail, function (err, message) {
	          if (err) return reject(err);
	          return resolve(message);
	        });
	      });
	    }
	  }]);
	  return Email;
	}();

	exports.default = Email;

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	module.exports = require("babel-runtime/core-js/promise");

/***/ }),
/* 19 */
/***/ (function(module, exports) {

	module.exports = require("emailjs");

/***/ }),
/* 20 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {
	  from: 'js-accounts <no-reply@js-accounts.com>',

	  verifyEmail: {
	    subject: function subject() {
	      return 'Verify your account email';
	    },
	    text: function text(user, url) {
	      return 'To verify your account email please click on this link: ' + url;
	    }
	  },

	  resetPassword: {
	    subject: function subject() {
	      return 'Reset your password';
	    },
	    text: function text(user, url) {
	      return 'To reset your password please click on this link: ' + url;
	    }
	  },

	  enrollAccount: {
	    subject: function subject() {
	      return 'Set your password';
	    },
	    text: function text(user, url) {
	      return 'To set your password please click on this link: ' + url;
	    }
	  }
	};

/***/ })
/******/ ])
});
;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"mongo":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_accounts/node_modules/@accounts/mongo/package.json                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "@accounts/mongo";
exports.version = "0.0.12";
exports.main = "lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_accounts/node_modules/@accounts/mongo/lib/index.js                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("babel-runtime/helpers/defineProperty"), require("babel-runtime/regenerator"), require("babel-runtime/helpers/asyncToGenerator"), require("babel-runtime/helpers/extends"), require("babel-runtime/helpers/classCallCheck"), require("babel-runtime/helpers/createClass"), require("mongodb"), require("lodash/get"));
	else if(typeof define === 'function' && define.amd)
		define(["babel-runtime/helpers/defineProperty", "babel-runtime/regenerator", "babel-runtime/helpers/asyncToGenerator", "babel-runtime/helpers/extends", "babel-runtime/helpers/classCallCheck", "babel-runtime/helpers/createClass", "mongodb", "lodash/get"], factory);
	else if(typeof exports === 'object')
		exports["@accounts/mongo"] = factory(require("babel-runtime/helpers/defineProperty"), require("babel-runtime/regenerator"), require("babel-runtime/helpers/asyncToGenerator"), require("babel-runtime/helpers/extends"), require("babel-runtime/helpers/classCallCheck"), require("babel-runtime/helpers/createClass"), require("mongodb"), require("lodash/get"));
	else
		root["@accounts/mongo"] = factory(root["babel-runtime/helpers/defineProperty"], root["babel-runtime/regenerator"], root["babel-runtime/helpers/asyncToGenerator"], root["babel-runtime/helpers/extends"], root["babel-runtime/helpers/classCallCheck"], root["babel-runtime/helpers/createClass"], root["mongodb"], root["lodash/get"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_8__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _defineProperty2 = __webpack_require__(1);

	var _defineProperty3 = _interopRequireDefault(_defineProperty2);

	var _regenerator = __webpack_require__(2);

	var _regenerator2 = _interopRequireDefault(_regenerator);

	var _asyncToGenerator2 = __webpack_require__(3);

	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

	var _extends2 = __webpack_require__(4);

	var _extends3 = _interopRequireDefault(_extends2);

	var _classCallCheck2 = __webpack_require__(5);

	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

	var _createClass2 = __webpack_require__(6);

	var _createClass3 = _interopRequireDefault(_createClass2);

	var _mongodb = __webpack_require__(7);

	var _get = __webpack_require__(8);

	var _get2 = _interopRequireDefault(_get);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var toMongoID = function toMongoID(objectId) {
	  if (typeof objectId === 'string') {
	    return new _mongodb.ObjectID(objectId);
	  }

	  return objectId;
	};

	var Mongo = function () {
	  function Mongo(db, options) {
	    (0, _classCallCheck3.default)(this, Mongo);

	    // eslint-disable-next-line no-unused-expressions
	    this;
	    var defaultOptions = {
	      collectionName: 'users',
	      sessionCollectionName: 'sessions',
	      timestamps: {
	        createdAt: 'createdAt',
	        updatedAt: 'updatedAt'
	      },
	      convertUserIdToMongoObjectId: true,
	      caseSensitiveUserName: true,
	      convertSessionIdToMongoObjectId: true,
	      idProvider: null,
	      dateProvider: function dateProvider(date) {
	        return date ? date.getTime() : Date.now();
	      }
	    };
	    this.options = (0, _extends3.default)({}, defaultOptions, options);
	    if (!db) {
	      throw new Error('A database connection is required');
	    }
	    this.db = db;
	    this.collection = this.db.collection(this.options.collectionName);
	    this.sessionCollection = this.db.collection(this.options.sessionCollectionName);
	  }
	  // TODO definition for mongodb connection object


	  (0, _createClass3.default)(Mongo, [{
	    key: 'setupIndexes',
	    value: function () {
	      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
	        return _regenerator2.default.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                _context.next = 2;
	                return this.collection.createIndex('username', { unique: 1, sparse: 1 });

	              case 2:
	                _context.next = 4;
	                return this.collection.createIndex('emails.address', { unique: 1, sparse: 1 });

	              case 4:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, this);
	      }));

	      function setupIndexes() {
	        return _ref.apply(this, arguments);
	      }

	      return setupIndexes;
	    }()
	  }, {
	    key: 'createUser',
	    value: function () {
	      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(options) {
	        var _user;

	        var user, ret;
	        return _regenerator2.default.wrap(function _callee2$(_context2) {
	          while (1) {
	            switch (_context2.prev = _context2.next) {
	              case 0:
	                user = (_user = {
	                  services: {},
	                  profile: {}
	                }, (0, _defineProperty3.default)(_user, this.options.timestamps.createdAt, Date.now()), (0, _defineProperty3.default)(_user, this.options.timestamps.updatedAt, Date.now()), _user);

	                if (options.password) {
	                  user.services.password = { bcrypt: options.password };
	                }
	                if (options.username) {
	                  user.username = options.username;
	                }
	                if (options.email) {
	                  user.emails = [{ address: options.email.toLowerCase(), verified: false }];
	                }
	                if (options.profile) {
	                  user.profile = options.profile;
	                }
	                if (options.idProvider) {
	                  user = (0, _extends3.default)({}, user, {
	                    _id: options.idProvider()
	                  });
	                }
	                _context2.next = 8;
	                return this.collection.insertOne(user);

	              case 8:
	                ret = _context2.sent;
	                return _context2.abrupt('return', ret.ops[0]._id);

	              case 10:
	              case 'end':
	                return _context2.stop();
	            }
	          }
	        }, _callee2, this);
	      }));

	      function createUser(_x) {
	        return _ref2.apply(this, arguments);
	      }

	      return createUser;
	    }()
	  }, {
	    key: 'findUserById',
	    value: function () {
	      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(userId) {
	        var _id, user;

	        return _regenerator2.default.wrap(function _callee3$(_context3) {
	          while (1) {
	            switch (_context3.prev = _context3.next) {
	              case 0:
	                _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context3.next = 3;
	                return this.collection.findOne({ _id: _id });

	              case 3:
	                user = _context3.sent;

	                if (user) {
	                  user.id = user._id;
	                }
	                return _context3.abrupt('return', user);

	              case 6:
	              case 'end':
	                return _context3.stop();
	            }
	          }
	        }, _callee3, this);
	      }));

	      function findUserById(_x2) {
	        return _ref3.apply(this, arguments);
	      }

	      return findUserById;
	    }()
	  }, {
	    key: 'findUserByEmail',
	    value: function () {
	      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(email) {
	        var user;
	        return _regenerator2.default.wrap(function _callee4$(_context4) {
	          while (1) {
	            switch (_context4.prev = _context4.next) {
	              case 0:
	                _context4.next = 2;
	                return this.collection.findOne({ 'emails.address': email.toLowerCase() });

	              case 2:
	                user = _context4.sent;

	                if (user) {
	                  user.id = user._id;
	                }
	                return _context4.abrupt('return', user);

	              case 5:
	              case 'end':
	                return _context4.stop();
	            }
	          }
	        }, _callee4, this);
	      }));

	      function findUserByEmail(_x3) {
	        return _ref4.apply(this, arguments);
	      }

	      return findUserByEmail;
	    }()
	  }, {
	    key: 'findUserByUsername',
	    value: function () {
	      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(username) {
	        var filter, user;
	        return _regenerator2.default.wrap(function _callee5$(_context5) {
	          while (1) {
	            switch (_context5.prev = _context5.next) {
	              case 0:
	                filter = this.options.caseSensitiveUserName ? { username: username } : { $where: 'obj.username && (obj.username.toLowerCase() === "' + username.toLowerCase() + '")' };
	                _context5.next = 3;
	                return this.collection.findOne(filter);

	              case 3:
	                user = _context5.sent;

	                if (user) {
	                  user.id = user._id;
	                }
	                return _context5.abrupt('return', user);

	              case 6:
	              case 'end':
	                return _context5.stop();
	            }
	          }
	        }, _callee5, this);
	      }));

	      function findUserByUsername(_x4) {
	        return _ref5.apply(this, arguments);
	      }

	      return findUserByUsername;
	    }()
	  }, {
	    key: 'findUserByEmailVerificationToken',
	    value: function () {
	      var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(token) {
	        var user;
	        return _regenerator2.default.wrap(function _callee6$(_context6) {
	          while (1) {
	            switch (_context6.prev = _context6.next) {
	              case 0:
	                _context6.next = 2;
	                return this.collection.findOne({ 'services.email.verificationTokens.token': token });

	              case 2:
	                user = _context6.sent;

	                if (user) {
	                  user.id = user._id;
	                }
	                return _context6.abrupt('return', user);

	              case 5:
	              case 'end':
	                return _context6.stop();
	            }
	          }
	        }, _callee6, this);
	      }));

	      function findUserByEmailVerificationToken(_x5) {
	        return _ref6.apply(this, arguments);
	      }

	      return findUserByEmailVerificationToken;
	    }()
	  }, {
	    key: 'findUserByResetPasswordToken',
	    value: function () {
	      var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(token) {
	        var user;
	        return _regenerator2.default.wrap(function _callee7$(_context7) {
	          while (1) {
	            switch (_context7.prev = _context7.next) {
	              case 0:
	                _context7.next = 2;
	                return this.collection.findOne({ 'services.password.reset.token': token });

	              case 2:
	                user = _context7.sent;

	                if (user) {
	                  user.id = user._id;
	                }
	                return _context7.abrupt('return', user);

	              case 5:
	              case 'end':
	                return _context7.stop();
	            }
	          }
	        }, _callee7, this);
	      }));

	      function findUserByResetPasswordToken(_x6) {
	        return _ref7.apply(this, arguments);
	      }

	      return findUserByResetPasswordToken;
	    }()
	  }, {
	    key: 'findPasswordHash',
	    value: function () {
	      var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(userId) {
	        var id, user;
	        return _regenerator2.default.wrap(function _callee8$(_context8) {
	          while (1) {
	            switch (_context8.prev = _context8.next) {
	              case 0:
	                id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context8.next = 3;
	                return this.findUserById(id);

	              case 3:
	                user = _context8.sent;

	                if (!user) {
	                  _context8.next = 6;
	                  break;
	                }

	                return _context8.abrupt('return', (0, _get2.default)(user, 'services.password.bcrypt'));

	              case 6:
	                return _context8.abrupt('return', null);

	              case 7:
	              case 'end':
	                return _context8.stop();
	            }
	          }
	        }, _callee8, this);
	      }));

	      function findPasswordHash(_x7) {
	        return _ref8.apply(this, arguments);
	      }

	      return findPasswordHash;
	    }()
	  }, {
	    key: 'addEmail',
	    value: function () {
	      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(userId, newEmail, verified) {
	        var _id, ret;

	        return _regenerator2.default.wrap(function _callee9$(_context9) {
	          while (1) {
	            switch (_context9.prev = _context9.next) {
	              case 0:
	                _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context9.next = 3;
	                return this.collection.update({ _id: _id }, {
	                  $addToSet: {
	                    emails: {
	                      address: newEmail.toLowerCase(),
	                      verified: verified
	                    }
	                  },
	                  $set: (0, _defineProperty3.default)({}, this.options.timestamps.updatedAt, Date.now())
	                });

	              case 3:
	                ret = _context9.sent;

	                if (!(ret.result.nModified === 0)) {
	                  _context9.next = 6;
	                  break;
	                }

	                throw new Error('User not found');

	              case 6:
	              case 'end':
	                return _context9.stop();
	            }
	          }
	        }, _callee9, this);
	      }));

	      function addEmail(_x8, _x9, _x10) {
	        return _ref9.apply(this, arguments);
	      }

	      return addEmail;
	    }()
	  }, {
	    key: 'removeEmail',
	    value: function () {
	      var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(userId, email) {
	        var _id, ret;

	        return _regenerator2.default.wrap(function _callee10$(_context10) {
	          while (1) {
	            switch (_context10.prev = _context10.next) {
	              case 0:
	                _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context10.next = 3;
	                return this.collection.update({ _id: _id }, {
	                  $pull: { emails: { address: email.toLowerCase() } },
	                  $set: (0, _defineProperty3.default)({}, this.options.timestamps.updatedAt, Date.now())
	                });

	              case 3:
	                ret = _context10.sent;

	                if (!(ret.result.nModified === 0)) {
	                  _context10.next = 6;
	                  break;
	                }

	                throw new Error('User not found');

	              case 6:
	              case 'end':
	                return _context10.stop();
	            }
	          }
	        }, _callee10, this);
	      }));

	      function removeEmail(_x11, _x12) {
	        return _ref10.apply(this, arguments);
	      }

	      return removeEmail;
	    }()
	  }, {
	    key: 'setUsername',
	    value: function () {
	      var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11(userId, newUsername) {
	        var _id, ret;

	        return _regenerator2.default.wrap(function _callee11$(_context11) {
	          while (1) {
	            switch (_context11.prev = _context11.next) {
	              case 0:
	                _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context11.next = 3;
	                return this.collection.update({ _id: _id }, {
	                  $set: (0, _defineProperty3.default)({
	                    username: newUsername
	                  }, this.options.timestamps.updatedAt, Date.now())
	                });

	              case 3:
	                ret = _context11.sent;

	                if (!(ret.result.nModified === 0)) {
	                  _context11.next = 6;
	                  break;
	                }

	                throw new Error('User not found');

	              case 6:
	              case 'end':
	                return _context11.stop();
	            }
	          }
	        }, _callee11, this);
	      }));

	      function setUsername(_x13, _x14) {
	        return _ref11.apply(this, arguments);
	      }

	      return setUsername;
	    }()
	  }, {
	    key: 'setPasssword',
	    value: function () {
	      var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(userId, newPassword) {
	        var _id, ret;

	        return _regenerator2.default.wrap(function _callee12$(_context12) {
	          while (1) {
	            switch (_context12.prev = _context12.next) {
	              case 0:
	                _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context12.next = 3;
	                return this.collection.update({ _id: _id }, {
	                  $set: (0, _defineProperty3.default)({
	                    'services.password.bcrypt': newPassword
	                  }, this.options.timestamps.updatedAt, Date.now()),
	                  $unset: {
	                    'services.password.reset': ''
	                  }
	                });

	              case 3:
	                ret = _context12.sent;

	                if (!(ret.result.nModified === 0)) {
	                  _context12.next = 6;
	                  break;
	                }

	                throw new Error('User not found');

	              case 6:
	              case 'end':
	                return _context12.stop();
	            }
	          }
	        }, _callee12, this);
	      }));

	      function setPasssword(_x15, _x16) {
	        return _ref12.apply(this, arguments);
	      }

	      return setPasssword;
	    }()
	  }, {
	    key: 'setProfile',
	    value: function () {
	      var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13(userId, profile) {
	        var _id;

	        return _regenerator2.default.wrap(function _callee13$(_context13) {
	          while (1) {
	            switch (_context13.prev = _context13.next) {
	              case 0:
	                _id = this.options.convertUserIdToMongoObjectId ? toMongoID(userId) : userId;
	                _context13.next = 3;
	                return this.collection.update({ _id: _id }, {
	                  $set: (0, _defineProperty3.default)({
	                    profile: profile
	                  }, this.options.timestamps.updatedAt, Date.now())
	                });

	              case 3:
	                return _context13.abrupt('return', profile);

	              case 4:
	              case 'end':
	                return _context13.stop();
	            }
	          }
	        }, _callee13, this);
	      }));

	      function setProfile(_x17, _x18) {
	        return _ref13.apply(this, arguments);
	      }

	      return setProfile;
	    }()
	  }, {
	    key: 'createSession',
	    value: function () {
	      var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee14(userId, ip, userAgent, extraData) {
	        var _session;

	        var session, ret;
	        return _regenerator2.default.wrap(function _callee14$(_context14) {
	          while (1) {
	            switch (_context14.prev = _context14.next) {
	              case 0:
	                session = (_session = {
	                  userId: userId,
	                  userAgent: userAgent,
	                  ip: ip,
	                  extraData: extraData,
	                  valid: true
	                }, (0, _defineProperty3.default)(_session, this.options.timestamps.createdAt, this.options.dateProvider()), (0, _defineProperty3.default)(_session, this.options.timestamps.updatedAt, this.options.dateProvider()), _session);

	                if (this.options.idProvider) {
	                  session = (0, _extends3.default)({}, session, {
	                    _id: this.options.idProvider()
	                  });
	                }
	                _context14.next = 4;
	                return this.sessionCollection.insertOne(session);

	              case 4:
	                ret = _context14.sent;
	                return _context14.abrupt('return', ret.ops[0]._id);

	              case 6:
	              case 'end':
	                return _context14.stop();
	            }
	          }
	        }, _callee14, this);
	      }));

	      function createSession(_x19, _x20, _x21, _x22) {
	        return _ref14.apply(this, arguments);
	      }

	      return createSession;
	    }()
	  }, {
	    key: 'updateSession',
	    value: function () {
	      var _ref15 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee15(sessionId, ip, userAgent) {
	        var _id;

	        return _regenerator2.default.wrap(function _callee15$(_context15) {
	          while (1) {
	            switch (_context15.prev = _context15.next) {
	              case 0:
	                _id = this.options.convertSessionIdToMongoObjectId ? toMongoID(sessionId) : sessionId;
	                _context15.next = 3;
	                return this.sessionCollection.update({ _id: _id }, {
	                  $set: (0, _defineProperty3.default)({
	                    ip: ip,
	                    userAgent: userAgent
	                  }, this.options.timestamps.updatedAt, this.options.dateProvider())
	                });

	              case 3:
	              case 'end':
	                return _context15.stop();
	            }
	          }
	        }, _callee15, this);
	      }));

	      function updateSession(_x23, _x24, _x25) {
	        return _ref15.apply(this, arguments);
	      }

	      return updateSession;
	    }()
	  }, {
	    key: 'invalidateSession',
	    value: function () {
	      var _ref16 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee16(sessionId) {
	        var id;
	        return _regenerator2.default.wrap(function _callee16$(_context16) {
	          while (1) {
	            switch (_context16.prev = _context16.next) {
	              case 0:
	                id = this.options.convertSessionIdToMongoObjectId ? toMongoID(sessionId) : sessionId;
	                _context16.next = 3;
	                return this.sessionCollection.update({ _id: id }, {
	                  $set: (0, _defineProperty3.default)({
	                    valid: false
	                  }, this.options.timestamps.updatedAt, this.options.dateProvider())
	                });

	              case 3:
	              case 'end':
	                return _context16.stop();
	            }
	          }
	        }, _callee16, this);
	      }));

	      function invalidateSession(_x26) {
	        return _ref16.apply(this, arguments);
	      }

	      return invalidateSession;
	    }()
	  }, {
	    key: 'invalidateAllSessions',
	    value: function () {
	      var _ref17 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee17(userId) {
	        return _regenerator2.default.wrap(function _callee17$(_context17) {
	          while (1) {
	            switch (_context17.prev = _context17.next) {
	              case 0:
	                _context17.next = 2;
	                return this.sessionCollection.updateMany({ userId: userId }, {
	                  $set: (0, _defineProperty3.default)({
	                    valid: false
	                  }, this.options.timestamps.updatedAt, this.options.dateProvider())
	                });

	              case 2:
	              case 'end':
	                return _context17.stop();
	            }
	          }
	        }, _callee17, this);
	      }));

	      function invalidateAllSessions(_x27) {
	        return _ref17.apply(this, arguments);
	      }

	      return invalidateAllSessions;
	    }()
	  }, {
	    key: 'findSessionById',
	    value: function findSessionById(sessionId) {
	      var _id = this.options.convertSessionIdToMongoObjectId ? toMongoID(sessionId) : sessionId;
	      return this.sessionCollection.findOne({ _id: _id });
	    }
	  }, {
	    key: 'addEmailVerificationToken',
	    value: function () {
	      var _ref18 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee18(userId, email, token) {
	        return _regenerator2.default.wrap(function _callee18$(_context18) {
	          while (1) {
	            switch (_context18.prev = _context18.next) {
	              case 0:
	                _context18.next = 2;
	                return this.collection.update({ _id: userId }, {
	                  $push: {
	                    'services.email.verificationTokens': {
	                      token: token,
	                      address: email.toLowerCase(),
	                      when: Date.now()
	                    }
	                  }
	                });

	              case 2:
	              case 'end':
	                return _context18.stop();
	            }
	          }
	        }, _callee18, this);
	      }));

	      function addEmailVerificationToken(_x28, _x29, _x30) {
	        return _ref18.apply(this, arguments);
	      }

	      return addEmailVerificationToken;
	    }()
	  }, {
	    key: 'addResetPasswordToken',
	    value: function () {
	      var _ref19 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee19(userId, email, token) {
	        var reason = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'reset';
	        return _regenerator2.default.wrap(function _callee19$(_context19) {
	          while (1) {
	            switch (_context19.prev = _context19.next) {
	              case 0:
	                _context19.next = 2;
	                return this.collection.update({ _id: userId }, {
	                  $push: {
	                    'services.password.reset': {
	                      token: token,
	                      address: email.toLowerCase(),
	                      when: Date.now(),
	                      reason: reason
	                    }
	                  }
	                });

	              case 2:
	              case 'end':
	                return _context19.stop();
	            }
	          }
	        }, _callee19, this);
	      }));

	      function addResetPasswordToken(_x31, _x32, _x33) {
	        return _ref19.apply(this, arguments);
	      }

	      return addResetPasswordToken;
	    }()

	    // eslint-disable-next-line max-len

	  }, {
	    key: 'setResetPasssword',
	    value: function () {
	      var _ref20 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee20(userId, email, newPassword) {
	        return _regenerator2.default.wrap(function _callee20$(_context20) {
	          while (1) {
	            switch (_context20.prev = _context20.next) {
	              case 0:
	                _context20.next = 2;
	                return this.setPasssword(userId, newPassword);

	              case 2:
	              case 'end':
	                return _context20.stop();
	            }
	          }
	        }, _callee20, this);
	      }));

	      function setResetPasssword(_x35, _x36, _x37) {
	        return _ref20.apply(this, arguments);
	      }

	      return setResetPasssword;
	    }()
	  }]);
	  return Mongo;
	}();

	exports.default = Mongo;

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("babel-runtime/helpers/defineProperty");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("babel-runtime/regenerator");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("babel-runtime/helpers/asyncToGenerator");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("babel-runtime/helpers/extends");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("babel-runtime/helpers/classCallCheck");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("babel-runtime/helpers/createClass");

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("mongodb");

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = require("lodash/get");

/***/ }
/******/ ])
});
;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:accounts/server/index.js");

/* Exports */
Package._define("rocketchat:accounts", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_accounts.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphY2NvdW50cy9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YWNjb3VudHMvc2VydmVyL2NvbmZpZy5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJBY2NvdW50c1NlcnZlciIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiTW9uZ29BZGFwdGVyIiwiTW9uZ29JbnRlcm5hbHMiLCJNZXRlb3IiLCJzdGFydHVwIiwibW9uZ29kYiIsImRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyIiwibW9uZ28iLCJkYiIsIm1vbmdvQWRhcHRlciIsImNvbnZlcnRVc2VySWRUb01vbmdvT2JqZWN0SWQiLCJjb25maWciLCJ0b2tlbkNvbmZpZ3MiLCJhY2Nlc3NUb2tlbiIsImV4cGlyZXNJbiIsInJlZnJlc2hUb2tlbiIsInBhc3N3b3JkSGFzaEFsZ29yaXRobSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0Msa0JBQWUsTUFBSUE7QUFBcEIsQ0FBZDtBQUFtREYsT0FBT0csS0FBUCxDQUFhQyxRQUFRLFVBQVIsQ0FBYjtBQUFrQyxJQUFJRixjQUFKO0FBQW1CRixPQUFPRyxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYixFQUF5QztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0oscUJBQWVJLENBQWY7QUFBaUI7O0FBQTdCLENBQXpDLEVBQXdFLENBQXhFLEU7Ozs7Ozs7Ozs7O0FDQXhHLElBQUlKLGNBQUo7QUFBbUJGLE9BQU9HLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiLEVBQXlDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDSixxQkFBZUksQ0FBZjtBQUFpQjs7QUFBN0IsQ0FBekMsRUFBd0UsQ0FBeEU7QUFBMkUsSUFBSUMsWUFBSjtBQUFpQlAsT0FBT0csS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWIsRUFBd0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLG1CQUFhRCxDQUFiO0FBQWU7O0FBQTNCLENBQXhDLEVBQXFFLENBQXJFO0FBQXdFLElBQUlFLGNBQUo7QUFBbUJSLE9BQU9HLEtBQVAsQ0FBYUMsUUFBUSxjQUFSLENBQWIsRUFBcUM7QUFBQ0ksaUJBQWVGLENBQWYsRUFBaUI7QUFBQ0UscUJBQWVGLENBQWY7QUFBaUI7O0FBQXBDLENBQXJDLEVBQTJFLENBQTNFO0FBQThFLElBQUlHLE1BQUo7QUFBV1QsT0FBT0csS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDSyxTQUFPSCxDQUFQLEVBQVM7QUFBQ0csYUFBT0gsQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUtuU0csT0FBT0MsT0FBUCxDQUFlLE1BQU07QUFDcEIsUUFBTUMsVUFBVUgsZUFBZUksNkJBQWYsR0FBK0NDLEtBQS9DLENBQXFEQyxFQUFyRTtBQUVBLFFBQU1DLGVBQWUsSUFBSVIsWUFBSixDQUFpQkksT0FBakIsRUFBMEI7QUFDOUNLLGtDQUE4QjtBQURnQixHQUExQixDQUFyQjtBQUlBZCxpQkFBZWUsTUFBZixDQUFzQjtBQUNyQkMsa0JBQWM7QUFDYkMsbUJBQWE7QUFDWkMsbUJBQVc7QUFEQyxPQURBO0FBSWJDLG9CQUFjO0FBQ2JELG1CQUFXO0FBREU7QUFKRCxLQURPO0FBU3JCRSwyQkFBdUI7QUFURixHQUF0QixFQVVHUCxZQVZIO0FBV0EsQ0FsQkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hY2NvdW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi9jb25maWcnO1xuXG5pbXBvcnQgQWNjb3VudHNTZXJ2ZXIgZnJvbSAnQGFjY291bnRzL3NlcnZlcic7XG5cblxuZXhwb3J0IHtcblx0QWNjb3VudHNTZXJ2ZXJcbn07XG4iLCJpbXBvcnQgQWNjb3VudHNTZXJ2ZXIgZnJvbSAnQGFjY291bnRzL3NlcnZlcic7XG5pbXBvcnQgTW9uZ29BZGFwdGVyIGZyb20gJ0BhY2NvdW50cy9tb25nbyc7XG5pbXBvcnQgeyBNb25nb0ludGVybmFscyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRjb25zdCBtb25nb2RiID0gTW9uZ29JbnRlcm5hbHMuZGVmYXVsdFJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIoKS5tb25nby5kYjtcblxuXHRjb25zdCBtb25nb0FkYXB0ZXIgPSBuZXcgTW9uZ29BZGFwdGVyKG1vbmdvZGIsIHtcblx0XHRjb252ZXJ0VXNlcklkVG9Nb25nb09iamVjdElkOiBmYWxzZVxuXHR9KTtcblxuXHRBY2NvdW50c1NlcnZlci5jb25maWcoe1xuXHRcdHRva2VuQ29uZmlnczoge1xuXHRcdFx0YWNjZXNzVG9rZW46IHtcblx0XHRcdFx0ZXhwaXJlc0luOiAnM2QnXG5cdFx0XHR9LFxuXHRcdFx0cmVmcmVzaFRva2VuOiB7XG5cdFx0XHRcdGV4cGlyZXNJbjogJzMwZCdcblx0XHRcdH1cblx0XHR9LFxuXHRcdHBhc3N3b3JkSGFzaEFsZ29yaXRobTogJ3NoYTI1Nidcblx0fSwgbW9uZ29BZGFwdGVyKTtcbn0pO1xuIl19
