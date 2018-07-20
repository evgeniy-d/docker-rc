(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var logger;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:cas":{"server":{"cas_rocketchat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/cas_rocketchat.js                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/* globals logger:true */
logger = new Logger('CAS', {});
Meteor.startup(function () {
  RocketChat.settings.addGroup('CAS', function () {
    this.add('CAS_enabled', false, {
      type: 'boolean',
      group: 'CAS',
      public: true
    });
    this.add('CAS_base_url', '', {
      type: 'string',
      group: 'CAS',
      public: true
    });
    this.add('CAS_login_url', '', {
      type: 'string',
      group: 'CAS',
      public: true
    });
    this.add('CAS_version', '1.0', {
      type: 'select',
      values: [{
        key: '1.0',
        i18nLabel: '1.0'
      }, {
        key: '2.0',
        i18nLabel: '2.0'
      }],
      group: 'CAS'
    });
    this.section('Attribute_handling', function () {
      // Enable/disable sync
      this.add('CAS_Sync_User_Data_Enabled', true, {
        type: 'boolean'
      }); // Attribute mapping table

      this.add('CAS_Sync_User_Data_FieldMap', '{}', {
        type: 'string'
      });
    });
    this.section('CAS_Login_Layout', function () {
      this.add('CAS_popup_width', '810', {
        type: 'string',
        group: 'CAS',
        public: true
      });
      this.add('CAS_popup_height', '610', {
        type: 'string',
        group: 'CAS',
        public: true
      });
      this.add('CAS_button_label_text', 'CAS', {
        type: 'string',
        group: 'CAS'
      });
      this.add('CAS_button_label_color', '#FFFFFF', {
        type: 'color',
        group: 'CAS'
      });
      this.add('CAS_button_color', '#13679A', {
        type: 'color',
        group: 'CAS'
      });
      this.add('CAS_autoclose', true, {
        type: 'boolean',
        group: 'CAS'
      });
    });
  });
});
let timer;

function updateServices()
/*record*/
{
  if (typeof timer !== 'undefined') {
    Meteor.clearTimeout(timer);
  }

  timer = Meteor.setTimeout(function () {
    const data = {
      // These will pe passed to 'node-cas' as options
      enabled: RocketChat.settings.get('CAS_enabled'),
      base_url: RocketChat.settings.get('CAS_base_url'),
      login_url: RocketChat.settings.get('CAS_login_url'),
      // Rocketchat Visuals
      buttonLabelText: RocketChat.settings.get('CAS_button_label_text'),
      buttonLabelColor: RocketChat.settings.get('CAS_button_label_color'),
      buttonColor: RocketChat.settings.get('CAS_button_color'),
      width: RocketChat.settings.get('CAS_popup_width'),
      height: RocketChat.settings.get('CAS_popup_height'),
      autoclose: RocketChat.settings.get('CAS_autoclose')
    }; // Either register or deregister the CAS login service based upon its configuration

    if (data.enabled) {
      logger.info('Enabling CAS login service');
      ServiceConfiguration.configurations.upsert({
        service: 'cas'
      }, {
        $set: data
      });
    } else {
      logger.info('Disabling CAS login service');
      ServiceConfiguration.configurations.remove({
        service: 'cas'
      });
    }
  }, 2000);
}

RocketChat.settings.get(/^CAS_.+/, (key, value) => {
  updateServices(value);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cas_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/cas_server.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fiber;
module.watch(require("fibers"), {
  default(v) {
    fiber = v;
  }

}, 1);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 2);
let CAS;
module.watch(require("cas"), {
  default(v) {
    CAS = v;
  }

}, 3);
RoutePolicy.declare('/_cas/', 'network');

const closePopup = function (res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  const content = '<html><head><script>window.close()</script></head></html>';
  res.end(content, 'utf-8');
};

const casTicket = function (req, token, callback) {
  // get configuration
  if (!RocketChat.settings.get('CAS_enabled')) {
    logger.error('Got ticket validation request, but CAS is not enabled');
    callback();
  } // get ticket and validate.


  const parsedUrl = url.parse(req.url, true);
  const ticketId = parsedUrl.query.ticket;
  const baseUrl = RocketChat.settings.get('CAS_base_url');
  const cas_version = parseFloat(RocketChat.settings.get('CAS_version'));

  const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;

  logger.debug(`Using CAS_base_url: ${baseUrl}`);
  const cas = new CAS({
    base_url: baseUrl,
    version: cas_version,
    service: `${appUrl}/_cas/${token}`
  });
  cas.validate(ticketId, Meteor.bindEnvironment(function (err, status, username, details) {
    if (err) {
      logger.error(`error when trying to validate: ${err.message}`);
    } else if (status) {
      logger.info(`Validated user: ${username}`);
      const user_info = {
        username
      }; // CAS 2.0 attributes handling

      if (details && details.attributes) {
        _.extend(user_info, {
          attributes: details.attributes
        });
      }

      RocketChat.models.CredentialTokens.create(token, user_info);
    } else {
      logger.error(`Unable to validate ticket: ${ticketId}`);
    } //logger.debug("Receveied response: " + JSON.stringify(details, null , 4));


    callback();
  }));
  return;
};

const middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    const barePath = req.url.substring(0, req.url.indexOf('?'));
    const splitPath = barePath.split('/'); // Any non-cas request will continue down the default
    // middlewares.

    if (splitPath[1] !== '_cas') {
      next();
      return;
    } // get auth token


    const credentialToken = splitPath[2];

    if (!credentialToken) {
      closePopup(res);
      return;
    } // validate ticket


    casTicket(req, credentialToken, function () {
      closePopup(res);
    });
  } catch (err) {
    logger.error(`Unexpected error : ${err.message}`);
    closePopup(res);
  }
}; // Listen to incoming OAuth http requests


WebApp.connectHandlers.use(function (req, res, next) {
  // Need to create a fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  fiber(function () {
    middleware(req, res, next);
  }).run();
});
/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */

Accounts.registerLoginHandler(function (options) {
  if (!options.cas) {
    return undefined;
  }

  const credentials = RocketChat.models.CredentialTokens.findOneById(options.cas.credentialToken);

  if (credentials === undefined) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching login attempt found');
  }

  const result = credentials.userInfo;
  const syncUserDataFieldMap = RocketChat.settings.get('CAS_Sync_User_Data_FieldMap').trim();
  const cas_version = parseFloat(RocketChat.settings.get('CAS_version'));
  const sync_enabled = RocketChat.settings.get('CAS_Sync_User_Data_Enabled'); // We have these

  const ext_attrs = {
    username: result.username
  }; // We need these

  const int_attrs = {
    email: undefined,
    name: undefined,
    username: undefined,
    rooms: undefined
  }; // Import response attributes

  if (cas_version >= 2.0) {
    // Clean & import external attributes
    _.each(result.attributes, function (value, ext_name) {
      if (value) {
        ext_attrs[ext_name] = value[0];
      }
    });
  } // Source internal attributes


  if (syncUserDataFieldMap) {
    // Our mapping table: key(int_attr) -> value(ext_attr)
    // Spoken: Source this internal attribute from these external attributes
    const attr_map = JSON.parse(syncUserDataFieldMap);

    _.each(attr_map, function (source, int_name) {
      // Source is our String to interpolate
      if (_.isString(source)) {
        _.each(ext_attrs, function (value, ext_name) {
          source = source.replace(`%${ext_name}%`, ext_attrs[ext_name]);
        });

        int_attrs[int_name] = source;
        logger.debug(`Sourced internal attribute: ${int_name} = ${source}`);
      }
    });
  } // Search existing user by its external service id


  logger.debug(`Looking up user by id: ${result.username}`);
  let user = Meteor.users.findOne({
    'services.cas.external_id': result.username
  });

  if (user) {
    logger.debug(`Using existing user for '${result.username}' with id: ${user._id}`);

    if (sync_enabled) {
      logger.debug('Syncing user attributes'); // Update name

      if (int_attrs.name) {
        RocketChat._setRealName(user._id, int_attrs.name);
      } // Update email


      if (int_attrs.email) {
        Meteor.users.update(user, {
          $set: {
            emails: [{
              address: int_attrs.email,
              verified: true
            }]
          }
        });
      }
    }
  } else {
    // Define new user
    const newUser = {
      username: result.username,
      active: true,
      globalRoles: ['user'],
      emails: [],
      services: {
        cas: {
          external_id: result.username,
          version: cas_version,
          attrs: int_attrs
        }
      }
    }; // Add User.name

    if (int_attrs.name) {
      _.extend(newUser, {
        name: int_attrs.name
      });
    } // Add email


    if (int_attrs.email) {
      _.extend(newUser, {
        emails: [{
          address: int_attrs.email,
          verified: true
        }]
      });
    } // Create the user


    logger.debug(`User "${result.username}" does not exist yet, creating it`);
    const userId = Accounts.insertUserDoc({}, newUser); // Fetch and use it

    user = Meteor.users.findOne(userId);
    logger.debug(`Created new user for '${result.username}' with id: ${user._id}`); //logger.debug(JSON.stringify(user, undefined, 4));

    logger.debug(`Joining user to attribute channels: ${int_attrs.rooms}`);

    if (int_attrs.rooms) {
      _.each(int_attrs.rooms.split(','), function (room_name) {
        if (room_name) {
          let room = RocketChat.models.Rooms.findOneByNameAndType(room_name, 'c');

          if (!room) {
            room = RocketChat.models.Rooms.createWithIdTypeAndName(Random.id(), 'c', room_name);
          }

          if (!RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, userId)) {
            RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
              ts: new Date(),
              open: true,
              alert: true,
              unread: 1,
              userMentions: 1,
              groupMentions: 0
            });
          }
        }
      });
    }
  }

  return {
    userId: user._id
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"CredentialTokens.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/models/CredentialTokens.js                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
RocketChat.models.CredentialTokens = new class extends RocketChat.models._Base {
  constructor() {
    super('credential_tokens');
    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  create(_id, userInfo) {
    const validForMilliseconds = 60000; // Valid for 60 seconds

    const token = {
      _id,
      userInfo,
      expireAt: new Date(Date.now() + validForMilliseconds)
    };
    this.insert(token);
    return token;
  }

  findOneById(_id) {
    const query = {
      _id,
      expireAt: {
        $gt: new Date()
      }
    };
    return this.findOne(query);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:cas/server/cas_rocketchat.js");
require("/node_modules/meteor/rocketchat:cas/server/cas_server.js");
require("/node_modules/meteor/rocketchat:cas/server/models/CredentialTokens.js");

/* Exports */
Package._define("rocketchat:cas");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_cas.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjYXMvc2VydmVyL2Nhc19yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNhcy9zZXJ2ZXIvY2FzX3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjYXMvc2VydmVyL21vZGVscy9DcmVkZW50aWFsVG9rZW5zLmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIkxvZ2dlciIsIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJncm91cCIsInB1YmxpYyIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsInNlY3Rpb24iLCJ0aW1lciIsInVwZGF0ZVNlcnZpY2VzIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImRhdGEiLCJlbmFibGVkIiwiZ2V0IiwiYmFzZV91cmwiLCJsb2dpbl91cmwiLCJidXR0b25MYWJlbFRleHQiLCJidXR0b25MYWJlbENvbG9yIiwiYnV0dG9uQ29sb3IiLCJ3aWR0aCIsImhlaWdodCIsImF1dG9jbG9zZSIsImluZm8iLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwidXBzZXJ0Iiwic2VydmljZSIsIiRzZXQiLCJyZW1vdmUiLCJ2YWx1ZSIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsImZpYmVyIiwidXJsIiwiQ0FTIiwiUm91dGVQb2xpY3kiLCJkZWNsYXJlIiwiY2xvc2VQb3B1cCIsInJlcyIsIndyaXRlSGVhZCIsImNvbnRlbnQiLCJlbmQiLCJjYXNUaWNrZXQiLCJyZXEiLCJ0b2tlbiIsImNhbGxiYWNrIiwiZXJyb3IiLCJwYXJzZWRVcmwiLCJwYXJzZSIsInRpY2tldElkIiwicXVlcnkiLCJ0aWNrZXQiLCJiYXNlVXJsIiwiY2FzX3ZlcnNpb24iLCJwYXJzZUZsb2F0IiwiYXBwVXJsIiwiYWJzb2x1dGVVcmwiLCJyZXBsYWNlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwiZGVidWciLCJjYXMiLCJ2ZXJzaW9uIiwidmFsaWRhdGUiLCJiaW5kRW52aXJvbm1lbnQiLCJlcnIiLCJzdGF0dXMiLCJ1c2VybmFtZSIsImRldGFpbHMiLCJtZXNzYWdlIiwidXNlcl9pbmZvIiwiYXR0cmlidXRlcyIsImV4dGVuZCIsIm1vZGVscyIsIkNyZWRlbnRpYWxUb2tlbnMiLCJjcmVhdGUiLCJtaWRkbGV3YXJlIiwibmV4dCIsImJhcmVQYXRoIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsInNwbGl0UGF0aCIsInNwbGl0IiwiY3JlZGVudGlhbFRva2VuIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicnVuIiwiQWNjb3VudHMiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJ1bmRlZmluZWQiLCJjcmVkZW50aWFscyIsImZpbmRPbmVCeUlkIiwiRXJyb3IiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibnVtZXJpY0Vycm9yIiwicmVzdWx0IiwidXNlckluZm8iLCJzeW5jVXNlckRhdGFGaWVsZE1hcCIsInRyaW0iLCJzeW5jX2VuYWJsZWQiLCJleHRfYXR0cnMiLCJpbnRfYXR0cnMiLCJlbWFpbCIsIm5hbWUiLCJyb29tcyIsImVhY2giLCJleHRfbmFtZSIsImF0dHJfbWFwIiwiSlNPTiIsInNvdXJjZSIsImludF9uYW1lIiwiaXNTdHJpbmciLCJ1c2VyIiwidXNlcnMiLCJmaW5kT25lIiwiX2lkIiwiX3NldFJlYWxOYW1lIiwidXBkYXRlIiwiZW1haWxzIiwiYWRkcmVzcyIsInZlcmlmaWVkIiwibmV3VXNlciIsImFjdGl2ZSIsImdsb2JhbFJvbGVzIiwic2VydmljZXMiLCJleHRlcm5hbF9pZCIsImF0dHJzIiwidXNlcklkIiwiaW5zZXJ0VXNlckRvYyIsInJvb21fbmFtZSIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeU5hbWVBbmRUeXBlIiwiY3JlYXRlV2l0aElkVHlwZUFuZE5hbWUiLCJSYW5kb20iLCJpZCIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJjcmVhdGVXaXRoUm9vbUFuZFVzZXIiLCJ0cyIsIkRhdGUiLCJvcGVuIiwiYWxlcnQiLCJ1bnJlYWQiLCJ1c2VyTWVudGlvbnMiLCJncm91cE1lbnRpb25zIiwiX0Jhc2UiLCJjb25zdHJ1Y3RvciIsInRyeUVuc3VyZUluZGV4Iiwic3BhcnNlIiwiZXhwaXJlQWZ0ZXJTZWNvbmRzIiwidmFsaWRGb3JNaWxsaXNlY29uZHMiLCJleHBpcmVBdCIsIm5vdyIsImluc2VydCIsIiRndCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBRUFBLFNBQVMsSUFBSUMsTUFBSixDQUFXLEtBQVgsRUFBa0IsRUFBbEIsQ0FBVDtBQUVBQyxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsUUFBcEIsQ0FBNkIsS0FBN0IsRUFBb0MsWUFBVztBQUM5QyxTQUFLQyxHQUFMLENBQVMsYUFBVCxFQUF3QixLQUF4QixFQUErQjtBQUFFQyxZQUFNLFNBQVI7QUFBbUJDLGFBQU8sS0FBMUI7QUFBaUNDLGNBQVE7QUFBekMsS0FBL0I7QUFDQSxTQUFLSCxHQUFMLENBQVMsY0FBVCxFQUF5QixFQUF6QixFQUE2QjtBQUFFQyxZQUFNLFFBQVI7QUFBa0JDLGFBQU8sS0FBekI7QUFBZ0NDLGNBQVE7QUFBeEMsS0FBN0I7QUFDQSxTQUFLSCxHQUFMLENBQVMsZUFBVCxFQUEwQixFQUExQixFQUE4QjtBQUFFQyxZQUFNLFFBQVI7QUFBa0JDLGFBQU8sS0FBekI7QUFBZ0NDLGNBQVE7QUFBeEMsS0FBOUI7QUFDQSxTQUFLSCxHQUFMLENBQVMsYUFBVCxFQUF3QixLQUF4QixFQUErQjtBQUFFQyxZQUFNLFFBQVI7QUFBa0JHLGNBQVEsQ0FBQztB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QVl3QixHQUFaLEVBQWlCO0FBQ2hCLFVBQU1uRSxRQUFRO0FBQ2JtRSxTQURhO0FBRWJxQyxnQkFBVTtBQUFFRyxhQUFLLElBQUlmLElBQUo7QUFBUDtBQUZHLEtBQWQ7QUFLQSxXQUFPLEtBQUsxQixPQUFMLENBQWFsRSxLQUFiLENBQVA7QUFDQTs7QUExQjZFLENBQTFDLEVBQXJDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfY2FzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBsb2dnZXI6dHJ1ZSAqL1xuXG5sb2dnZXIgPSBuZXcgTG9nZ2VyKCdDQVMnLCB7fSk7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdDQVMnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnQ0FTX2VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnQ0FTJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdHRoaXMuYWRkKCdDQVNfYmFzZV91cmwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0dGhpcy5hZGQoJ0NBU19sb2dpbl91cmwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0dGhpcy5hZGQoJ0NBU192ZXJzaW9uJywgJzEuMCcsIHsgdHlwZTogJ3NlbGVjdCcsIHZhbHVlczogW3sga2V5OiAnMS4wJywgaTE4bkxhYmVsOiAnMS4wJ30sIHsga2V5OiAnMi4wJywgaTE4bkxhYmVsOiAnMi4wJ31dLCBncm91cDogJ0NBUycgfSk7XG5cblx0XHR0aGlzLnNlY3Rpb24oJ0F0dHJpYnV0ZV9oYW5kbGluZycsIGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8gRW5hYmxlL2Rpc2FibGUgc3luY1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19TeW5jX1VzZXJfRGF0YV9FbmFibGVkJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicgfSk7XG5cdFx0XHQvLyBBdHRyaWJ1dGUgbWFwcGluZyB0YWJsZVxuXHRcdFx0dGhpcy5hZGQoJ0NBU19TeW5jX1VzZXJfRGF0YV9GaWVsZE1hcCcsICd7fScsIHsgdHlwZTogJ3N0cmluZycgfSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnNlY3Rpb24oJ0NBU19Mb2dpbl9MYXlvdXQnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuYWRkKCdDQVNfcG9wdXBfd2lkdGgnLCAnODEwJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmFkZCgnQ0FTX3BvcHVwX2hlaWdodCcsICc2MTAnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0NBUycsIHB1YmxpYzogdHJ1ZSB9KTtcblx0XHRcdHRoaXMuYWRkKCdDQVNfYnV0dG9uX2xhYmVsX3RleHQnLCAnQ0FTJywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdDQVMnfSk7XG5cdFx0XHR0aGlzLmFkZCgnQ0FTX2J1dHRvbl9sYWJlbF9jb2xvcicsICcjRkZGRkZGJywgeyB0eXBlOiAnY29sb3InLCBncm91cDogJ0NBUyd9KTtcblx0XHRcdHRoaXMuYWRkKCdDQVNfYnV0dG9uX2NvbG9yJywgJyMxMzY3OUEnLCB7IHR5cGU6ICdjb2xvcicsIGdyb3VwOiAnQ0FTJ30pO1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19hdXRvY2xvc2UnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdDQVMnfSk7XG5cdFx0fSk7XG5cdH0pO1xufSk7XG5cbmxldCB0aW1lcjtcblxuZnVuY3Rpb24gdXBkYXRlU2VydmljZXMoLypyZWNvcmQqLykge1xuXHRpZiAodHlwZW9mIHRpbWVyICE9PSAndW5kZWZpbmVkJykge1xuXHRcdE1ldGVvci5jbGVhclRpbWVvdXQodGltZXIpO1xuXHR9XG5cblx0dGltZXIgPSBNZXRlb3Iuc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0Ly8gVGhlc2Ugd2lsbCBwZSBwYXNzZWQgdG8gJ25vZGUtY2FzJyBhcyBvcHRpb25zXG5cdFx0XHRlbmFibGVkOiAgICAgICAgICBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2VuYWJsZWQnKSxcblx0XHRcdGJhc2VfdXJsOiAgICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYmFzZV91cmwnKSxcblx0XHRcdGxvZ2luX3VybDogICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfbG9naW5fdXJsJyksXG5cdFx0XHQvLyBSb2NrZXRjaGF0IFZpc3VhbHNcblx0XHRcdGJ1dHRvbkxhYmVsVGV4dDogIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYnV0dG9uX2xhYmVsX3RleHQnKSxcblx0XHRcdGJ1dHRvbkxhYmVsQ29sb3I6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYnV0dG9uX2xhYmVsX2NvbG9yJyksXG5cdFx0XHRidXR0b25Db2xvcjogICAgICBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2J1dHRvbl9jb2xvcicpLFxuXHRcdFx0d2lkdGg6ICAgICAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19wb3B1cF93aWR0aCcpLFxuXHRcdFx0aGVpZ2h0OiAgICAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19wb3B1cF9oZWlnaHQnKSxcblx0XHRcdGF1dG9jbG9zZTogICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYXV0b2Nsb3NlJylcblx0XHR9O1xuXG5cdFx0Ly8gRWl0aGVyIHJlZ2lzdGVyIG9yIGRlcmVnaXN0ZXIgdGhlIENBUyBsb2dpbiBzZXJ2aWNlIGJhc2VkIHVwb24gaXRzIGNvbmZpZ3VyYXRpb25cblx0XHRpZiAoZGF0YS5lbmFibGVkKSB7XG5cdFx0XHRsb2dnZXIuaW5mbygnRW5hYmxpbmcgQ0FTIGxvZ2luIHNlcnZpY2UnKTtcblx0XHRcdFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLnVwc2VydCh7c2VydmljZTogJ2Nhcyd9LCB7ICRzZXQ6IGRhdGEgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdEaXNhYmxpbmcgQ0FTIGxvZ2luIHNlcnZpY2UnKTtcblx0XHRcdFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLnJlbW92ZSh7c2VydmljZTogJ2Nhcyd9KTtcblx0XHR9XG5cdH0sIDIwMDApO1xufVxuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkNBU18uKy8sIChrZXksIHZhbHVlKSA9PiB7XG5cdHVwZGF0ZVNlcnZpY2VzKHZhbHVlKTtcbn0pO1xuIiwiLyogZ2xvYmFscyBSb3V0ZVBvbGljeSwgbG9nZ2VyICovXG4vKiBqc2hpbnQgbmV3Y2FwOiBmYWxzZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmltcG9ydCBmaWJlciBmcm9tICdmaWJlcnMnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IENBUyBmcm9tICdjYXMnO1xuXG5Sb3V0ZVBvbGljeS5kZWNsYXJlKCcvX2Nhcy8nLCAnbmV0d29yaycpO1xuXG5jb25zdCBjbG9zZVBvcHVwID0gZnVuY3Rpb24ocmVzKSB7XG5cdHJlcy53cml0ZUhlYWQoMjAwLCB7J0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnfSk7XG5cdGNvbnN0IGNvbnRlbnQgPSAnPGh0bWw+PGhlYWQ+PHNjcmlwdD53aW5kb3cuY2xvc2UoKTwvc2NyaXB0PjwvaGVhZD48L2h0bWw+Jztcblx0cmVzLmVuZChjb250ZW50LCAndXRmLTgnKTtcbn07XG5cbmNvbnN0IGNhc1RpY2tldCA9IGZ1bmN0aW9uKHJlcSwgdG9rZW4sIGNhbGxiYWNrKSB7XG5cblx0Ly8gZ2V0IGNvbmZpZ3VyYXRpb25cblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2VuYWJsZWQnKSkge1xuXHRcdGxvZ2dlci5lcnJvcignR290IHRpY2tldCB2YWxpZGF0aW9uIHJlcXVlc3QsIGJ1dCBDQVMgaXMgbm90IGVuYWJsZWQnKTtcblx0XHRjYWxsYmFjaygpO1xuXHR9XG5cblx0Ly8gZ2V0IHRpY2tldCBhbmQgdmFsaWRhdGUuXG5cdGNvbnN0IHBhcnNlZFVybCA9IHVybC5wYXJzZShyZXEudXJsLCB0cnVlKTtcblx0Y29uc3QgdGlja2V0SWQgPSBwYXJzZWRVcmwucXVlcnkudGlja2V0O1xuXHRjb25zdCBiYXNlVXJsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19iYXNlX3VybCcpO1xuXHRjb25zdCBjYXNfdmVyc2lvbiA9IHBhcnNlRmxvYXQoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU192ZXJzaW9uJykpO1xuXHRjb25zdCBhcHBVcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoKS5yZXBsYWNlKC9cXC8kLywgJycpICsgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWDtcblx0bG9nZ2VyLmRlYnVnKGBVc2luZyBDQVNfYmFzZV91cmw6ICR7IGJhc2VVcmwgfWApO1xuXG5cdGNvbnN0IGNhcyA9IG5ldyBDQVMoe1xuXHRcdGJhc2VfdXJsOiBiYXNlVXJsLFxuXHRcdHZlcnNpb246IGNhc192ZXJzaW9uLFxuXHRcdHNlcnZpY2U6IGAkeyBhcHBVcmwgfS9fY2FzLyR7IHRva2VuIH1gXG5cdH0pO1xuXG5cdGNhcy52YWxpZGF0ZSh0aWNrZXRJZCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihlcnIsIHN0YXR1cywgdXNlcm5hbWUsIGRldGFpbHMpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoYGVycm9yIHdoZW4gdHJ5aW5nIHRvIHZhbGlkYXRlOiAkeyBlcnIubWVzc2FnZSB9YCk7XG5cdFx0fSBlbHNlIGlmIChzdGF0dXMpIHtcblx0XHRcdGxvZ2dlci5pbmZvKGBWYWxpZGF0ZWQgdXNlcjogJHsgdXNlcm5hbWUgfWApO1xuXHRcdFx0Y29uc3QgdXNlcl9pbmZvID0geyB1c2VybmFtZSB9O1xuXG5cdFx0XHQvLyBDQVMgMi4wIGF0dHJpYnV0ZXMgaGFuZGxpbmdcblx0XHRcdGlmIChkZXRhaWxzICYmIGRldGFpbHMuYXR0cmlidXRlcykge1xuXHRcdFx0XHRfLmV4dGVuZCh1c2VyX2luZm8sIHsgYXR0cmlidXRlczogZGV0YWlscy5hdHRyaWJ1dGVzIH0pO1xuXHRcdFx0fVxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuQ3JlZGVudGlhbFRva2Vucy5jcmVhdGUodG9rZW4sIHVzZXJfaW5mbyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ2dlci5lcnJvcihgVW5hYmxlIHRvIHZhbGlkYXRlIHRpY2tldDogJHsgdGlja2V0SWQgfWApO1xuXHRcdH1cblx0XHQvL2xvZ2dlci5kZWJ1ZyhcIlJlY2V2ZWllZCByZXNwb25zZTogXCIgKyBKU09OLnN0cmluZ2lmeShkZXRhaWxzLCBudWxsICwgNCkpO1xuXG5cdFx0Y2FsbGJhY2soKTtcblx0fSkpO1xuXG5cdHJldHVybjtcbn07XG5cbmNvbnN0IG1pZGRsZXdhcmUgPSBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHQvLyBNYWtlIHN1cmUgdG8gY2F0Y2ggYW55IGV4Y2VwdGlvbnMgYmVjYXVzZSBvdGhlcndpc2Ugd2UnZCBjcmFzaFxuXHQvLyB0aGUgcnVubmVyXG5cdHRyeSB7XG5cdFx0Y29uc3QgYmFyZVBhdGggPSByZXEudXJsLnN1YnN0cmluZygwLCByZXEudXJsLmluZGV4T2YoJz8nKSk7XG5cdFx0Y29uc3Qgc3BsaXRQYXRoID0gYmFyZVBhdGguc3BsaXQoJy8nKTtcblxuXHRcdC8vIEFueSBub24tY2FzIHJlcXVlc3Qgd2lsbCBjb250aW51ZSBkb3duIHRoZSBkZWZhdWx0XG5cdFx0Ly8gbWlkZGxld2FyZXMuXG5cdFx0aWYgKHNwbGl0UGF0aFsxXSAhPT0gJ19jYXMnKSB7XG5cdFx0XHRuZXh0KCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gZ2V0IGF1dGggdG9rZW5cblx0XHRjb25zdCBjcmVkZW50aWFsVG9rZW4gPSBzcGxpdFBhdGhbMl07XG5cdFx0aWYgKCFjcmVkZW50aWFsVG9rZW4pIHtcblx0XHRcdGNsb3NlUG9wdXAocmVzKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyB2YWxpZGF0ZSB0aWNrZXRcblx0XHRjYXNUaWNrZXQocmVxLCBjcmVkZW50aWFsVG9rZW4sIGZ1bmN0aW9uKCkge1xuXHRcdFx0Y2xvc2VQb3B1cChyZXMpO1xuXHRcdH0pO1xuXG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGxvZ2dlci5lcnJvcihgVW5leHBlY3RlZCBlcnJvciA6ICR7IGVyci5tZXNzYWdlIH1gKTtcblx0XHRjbG9zZVBvcHVwKHJlcyk7XG5cdH1cbn07XG5cbi8vIExpc3RlbiB0byBpbmNvbWluZyBPQXV0aCBodHRwIHJlcXVlc3RzXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHQvLyBOZWVkIHRvIGNyZWF0ZSBhIGZpYmVyIHNpbmNlIHdlJ3JlIHVzaW5nIHN5bmNocm9ub3VzIGh0dHAgY2FsbHMgYW5kIG5vdGhpbmdcblx0Ly8gZWxzZSBpcyB3cmFwcGluZyB0aGlzIGluIGEgZmliZXIgYXV0b21hdGljYWxseVxuXHRmaWJlcihmdW5jdGlvbigpIHtcblx0XHRtaWRkbGV3YXJlKHJlcSwgcmVzLCBuZXh0KTtcblx0fSkucnVuKCk7XG59KTtcblxuLypcbiAqIFJlZ2lzdGVyIGEgc2VydmVyLXNpZGUgbG9naW4gaGFuZGxlLlxuICogSXQgaXMgY2FsbCBhZnRlciBBY2NvdW50cy5jYWxsTG9naW5NZXRob2QoKSBpcyBjYWxsIGZyb20gY2xpZW50LlxuICpcbiAqL1xuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoZnVuY3Rpb24ob3B0aW9ucykge1xuXG5cdGlmICghb3B0aW9ucy5jYXMpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cblx0Y29uc3QgY3JlZGVudGlhbHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5DcmVkZW50aWFsVG9rZW5zLmZpbmRPbmVCeUlkKG9wdGlvbnMuY2FzLmNyZWRlbnRpYWxUb2tlbik7XG5cdGlmIChjcmVkZW50aWFscyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihBY2NvdW50cy5Mb2dpbkNhbmNlbGxlZEVycm9yLm51bWVyaWNFcnJvcixcblx0XHRcdCdubyBtYXRjaGluZyBsb2dpbiBhdHRlbXB0IGZvdW5kJyk7XG5cdH1cblxuXHRjb25zdCByZXN1bHQgPSBjcmVkZW50aWFscy51c2VySW5mbztcblx0Y29uc3Qgc3luY1VzZXJEYXRhRmllbGRNYXAgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX1N5bmNfVXNlcl9EYXRhX0ZpZWxkTWFwJykudHJpbSgpO1xuXHRjb25zdCBjYXNfdmVyc2lvbiA9IHBhcnNlRmxvYXQoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU192ZXJzaW9uJykpO1xuXHRjb25zdCBzeW5jX2VuYWJsZWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX1N5bmNfVXNlcl9EYXRhX0VuYWJsZWQnKTtcblxuXHQvLyBXZSBoYXZlIHRoZXNlXG5cdGNvbnN0IGV4dF9hdHRycyA9IHtcblx0XHR1c2VybmFtZTogcmVzdWx0LnVzZXJuYW1lXG5cdH07XG5cblx0Ly8gV2UgbmVlZCB0aGVzZVxuXHRjb25zdCBpbnRfYXR0cnMgPSB7XG5cdFx0ZW1haWw6IHVuZGVmaW5lZCxcblx0XHRuYW1lOiB1bmRlZmluZWQsXG5cdFx0dXNlcm5hbWU6IHVuZGVmaW5lZCxcblx0XHRyb29tczogdW5kZWZpbmVkXG5cdH07XG5cblx0Ly8gSW1wb3J0IHJlc3BvbnNlIGF0dHJpYnV0ZXNcblx0aWYgKGNhc192ZXJzaW9uID49IDIuMCkge1xuXHRcdC8vIENsZWFuICYgaW1wb3J0IGV4dGVybmFsIGF0dHJpYnV0ZXNcblx0XHRfLmVhY2gocmVzdWx0LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKHZhbHVlLCBleHRfbmFtZSkge1xuXHRcdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRcdGV4dF9hdHRyc1tleHRfbmFtZV0gPSB2YWx1ZVswXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8vIFNvdXJjZSBpbnRlcm5hbCBhdHRyaWJ1dGVzXG5cdGlmIChzeW5jVXNlckRhdGFGaWVsZE1hcCkge1xuXG5cdFx0Ly8gT3VyIG1hcHBpbmcgdGFibGU6IGtleShpbnRfYXR0cikgLT4gdmFsdWUoZXh0X2F0dHIpXG5cdFx0Ly8gU3Bva2VuOiBTb3VyY2UgdGhpcyBpbnRlcm5hbCBhdHRyaWJ1dGUgZnJvbSB0aGVzZSBleHRlcm5hbCBhdHRyaWJ1dGVzXG5cdFx0Y29uc3QgYXR0cl9tYXAgPSBKU09OLnBhcnNlKHN5bmNVc2VyRGF0YUZpZWxkTWFwKTtcblxuXHRcdF8uZWFjaChhdHRyX21hcCwgZnVuY3Rpb24oc291cmNlLCBpbnRfbmFtZSkge1xuXHRcdFx0Ly8gU291cmNlIGlzIG91ciBTdHJpbmcgdG8gaW50ZXJwb2xhdGVcblx0XHRcdGlmIChfLmlzU3RyaW5nKHNvdXJjZSkpIHtcblx0XHRcdFx0Xy5lYWNoKGV4dF9hdHRycywgZnVuY3Rpb24odmFsdWUsIGV4dF9uYW1lKSB7XG5cdFx0XHRcdFx0c291cmNlID0gc291cmNlLnJlcGxhY2UoYCUkeyBleHRfbmFtZSB9JWAsIGV4dF9hdHRyc1tleHRfbmFtZV0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRpbnRfYXR0cnNbaW50X25hbWVdID0gc291cmNlO1xuXHRcdFx0XHRsb2dnZXIuZGVidWcoYFNvdXJjZWQgaW50ZXJuYWwgYXR0cmlidXRlOiAkeyBpbnRfbmFtZSB9ID0gJHsgc291cmNlIH1gKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8vIFNlYXJjaCBleGlzdGluZyB1c2VyIGJ5IGl0cyBleHRlcm5hbCBzZXJ2aWNlIGlkXG5cdGxvZ2dlci5kZWJ1ZyhgTG9va2luZyB1cCB1c2VyIGJ5IGlkOiAkeyByZXN1bHQudXNlcm5hbWUgfWApO1xuXHRsZXQgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHsgJ3NlcnZpY2VzLmNhcy5leHRlcm5hbF9pZCc6IHJlc3VsdC51c2VybmFtZSB9KTtcblxuXHRpZiAodXNlcikge1xuXHRcdGxvZ2dlci5kZWJ1ZyhgVXNpbmcgZXhpc3RpbmcgdXNlciBmb3IgJyR7IHJlc3VsdC51c2VybmFtZSB9JyB3aXRoIGlkOiAkeyB1c2VyLl9pZCB9YCk7XG5cdFx0aWYgKHN5bmNfZW5hYmxlZCkge1xuXHRcdFx0bG9nZ2VyLmRlYnVnKCdTeW5jaW5nIHVzZXIgYXR0cmlidXRlcycpO1xuXHRcdFx0Ly8gVXBkYXRlIG5hbWVcblx0XHRcdGlmIChpbnRfYXR0cnMubmFtZSkge1xuXHRcdFx0XHRSb2NrZXRDaGF0Ll9zZXRSZWFsTmFtZSh1c2VyLl9pZCwgaW50X2F0dHJzLm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBVcGRhdGUgZW1haWxcblx0XHRcdGlmIChpbnRfYXR0cnMuZW1haWwpIHtcblx0XHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLCB7ICRzZXQ6IHsgZW1haWxzOiBbeyBhZGRyZXNzOiBpbnRfYXR0cnMuZW1haWwsIHZlcmlmaWVkOiB0cnVlIH1dIH19KTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cblx0XHQvLyBEZWZpbmUgbmV3IHVzZXJcblx0XHRjb25zdCBuZXdVc2VyID0ge1xuXHRcdFx0dXNlcm5hbWU6IHJlc3VsdC51c2VybmFtZSxcblx0XHRcdGFjdGl2ZTogdHJ1ZSxcblx0XHRcdGdsb2JhbFJvbGVzOiBbJ3VzZXInXSxcblx0XHRcdGVtYWlsczogW10sXG5cdFx0XHRzZXJ2aWNlczoge1xuXHRcdFx0XHRjYXM6IHtcblx0XHRcdFx0XHRleHRlcm5hbF9pZDogcmVzdWx0LnVzZXJuYW1lLFxuXHRcdFx0XHRcdHZlcnNpb246IGNhc192ZXJzaW9uLFxuXHRcdFx0XHRcdGF0dHJzOiBpbnRfYXR0cnNcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBBZGQgVXNlci5uYW1lXG5cdFx0aWYgKGludF9hdHRycy5uYW1lKSB7XG5cdFx0XHRfLmV4dGVuZChuZXdVc2VyLCB7XG5cdFx0XHRcdG5hbWU6IGludF9hdHRycy5uYW1lXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBBZGQgZW1haWxcblx0XHRpZiAoaW50X2F0dHJzLmVtYWlsKSB7XG5cdFx0XHRfLmV4dGVuZChuZXdVc2VyLCB7XG5cdFx0XHRcdGVtYWlsczogW3sgYWRkcmVzczogaW50X2F0dHJzLmVtYWlsLCB2ZXJpZmllZDogdHJ1ZSB9XVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gQ3JlYXRlIHRoZSB1c2VyXG5cdFx0bG9nZ2VyLmRlYnVnKGBVc2VyIFwiJHsgcmVzdWx0LnVzZXJuYW1lIH1cIiBkb2VzIG5vdCBleGlzdCB5ZXQsIGNyZWF0aW5nIGl0YCk7XG5cdFx0Y29uc3QgdXNlcklkID0gQWNjb3VudHMuaW5zZXJ0VXNlckRvYyh7fSwgbmV3VXNlcik7XG5cblx0XHQvLyBGZXRjaCBhbmQgdXNlIGl0XG5cdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG5cdFx0bG9nZ2VyLmRlYnVnKGBDcmVhdGVkIG5ldyB1c2VyIGZvciAnJHsgcmVzdWx0LnVzZXJuYW1lIH0nIHdpdGggaWQ6ICR7IHVzZXIuX2lkIH1gKTtcblx0XHQvL2xvZ2dlci5kZWJ1ZyhKU09OLnN0cmluZ2lmeSh1c2VyLCB1bmRlZmluZWQsIDQpKTtcblxuXHRcdGxvZ2dlci5kZWJ1ZyhgSm9pbmluZyB1c2VyIHRvIGF0dHJpYnV0ZSBjaGFubmVsczogJHsgaW50X2F0dHJzLnJvb21zIH1gKTtcblx0XHRpZiAoaW50X2F0dHJzLnJvb21zKSB7XG5cdFx0XHRfLmVhY2goaW50X2F0dHJzLnJvb21zLnNwbGl0KCcsJyksIGZ1bmN0aW9uKHJvb21fbmFtZSkge1xuXHRcdFx0XHRpZiAocm9vbV9uYW1lKSB7XG5cdFx0XHRcdFx0bGV0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lQW5kVHlwZShyb29tX25hbWUsICdjJyk7XG5cdFx0XHRcdFx0aWYgKCFyb29tKSB7XG5cdFx0XHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY3JlYXRlV2l0aElkVHlwZUFuZE5hbWUoUmFuZG9tLmlkKCksICdjJywgcm9vbV9uYW1lKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCB1c2VySWQpKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmNyZWF0ZVdpdGhSb29tQW5kVXNlcihyb29tLCB1c2VyLCB7XG5cdFx0XHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRhbGVydDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0dW5yZWFkOiAxLFxuXHRcdFx0XHRcdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRcdFx0XHRcdGdyb3VwTWVudGlvbnM6IDBcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH1cblxuXHRyZXR1cm4geyB1c2VySWQ6IHVzZXIuX2lkIH07XG59KTtcbiIsIlJvY2tldENoYXQubW9kZWxzLkNyZWRlbnRpYWxUb2tlbnMgPSBuZXcgY2xhc3MgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdjcmVkZW50aWFsX3Rva2VucycpO1xuXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdleHBpcmVBdCc6IDEgfSwgeyBzcGFyc2U6IDEsIGV4cGlyZUFmdGVyU2Vjb25kczogMCB9KTtcblx0fVxuXG5cdGNyZWF0ZShfaWQsIHVzZXJJbmZvKSB7XG5cdFx0Y29uc3QgdmFsaWRGb3JNaWxsaXNlY29uZHMgPSA2MDAwMDtcdFx0Ly8gVmFsaWQgZm9yIDYwIHNlY29uZHNcblx0XHRjb25zdCB0b2tlbiA9IHtcblx0XHRcdF9pZCxcblx0XHRcdHVzZXJJbmZvLFxuXHRcdFx0ZXhwaXJlQXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyB2YWxpZEZvck1pbGxpc2Vjb25kcylcblx0XHR9O1xuXG5cdFx0dGhpcy5pbnNlcnQodG9rZW4pO1xuXHRcdHJldHVybiB0b2tlbjtcblx0fVxuXG5cdGZpbmRPbmVCeUlkKF9pZCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0X2lkLFxuXHRcdFx0ZXhwaXJlQXQ6IHsgJGd0OiBuZXcgRGF0ZSgpIH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG5cdH1cbn07XG4iXX0=
