(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var SHA256 = Package.sha.SHA256;
var Accounts = Package['accounts-base'].Accounts;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var CROWD;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:crowd":{"server":{"crowd.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_crowd/server/crowd.js                                                             //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
/* globals:CROWD:true */

/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */
const logger = new Logger('CROWD', {});

function fallbackDefaultAccountSystem(bind, username, password) {
  if (typeof username === 'string') {
    if (username.indexOf('@') === -1) {
      username = {
        username
      };
    } else {
      username = {
        email: username
      };
    }
  }

  logger.info('Fallback to default account system', username);
  const loginRequest = {
    user: username,
    password: {
      digest: SHA256(password),
      algorithm: 'sha-256'
    }
  };
  return Accounts._runLoginHandlers(bind, loginRequest);
}

const CROWD = class CROWD {
  constructor() {
    const AtlassianCrowd = require('atlassian-crowd');

    let url = RocketChat.settings.get('CROWD_URL');
    const urlLastChar = url.slice(-1);

    if (urlLastChar !== '/') {
      url += '/';
    }

    this.options = {
      crowd: {
        base: url
      },
      application: {
        name: RocketChat.settings.get('CROWD_APP_USERNAME'),
        password: RocketChat.settings.get('CROWD_APP_PASSWORD')
      },
      rejectUnauthorized: RocketChat.settings.get('CROWD_Reject_Unauthorized')
    };
    this.crowdClient = new AtlassianCrowd(this.options);
    this.crowdClient.user.authenticateSync = Meteor.wrapAsync(this.crowdClient.user.authenticate, this);
    this.crowdClient.user.findSync = Meteor.wrapAsync(this.crowdClient.user.find, this);
    this.crowdClient.pingSync = Meteor.wrapAsync(this.crowdClient.ping, this);
  }

  checkConnection() {
    this.crowdClient.pingSync();
  }

  authenticate(username, password) {
    if (!username || !password) {
      logger.error('No username or password');
      return;
    }

    logger.info('Going to crowd:', username);
    const auth = this.crowdClient.user.authenticateSync(username, password);

    if (!auth) {
      return;
    }

    const userResponse = this.crowdClient.user.findSync(username);
    const user = {
      displayname: userResponse['display-name'],
      username: userResponse.name,
      email: userResponse.email,
      password,
      active: userResponse.active
    };
    return user;
  }

  syncDataToUser(crowdUser, id) {
    const user = {
      username: crowdUser.username,
      emails: [{
        address: crowdUser.email,
        verified: true
      }],
      password: crowdUser.password,
      active: crowdUser.active
    };

    if (crowdUser.displayname) {
      RocketChat._setRealName(id, crowdUser.displayname);
    }

    Meteor.users.update(id, {
      $set: user
    });
  }

  sync() {
    if (RocketChat.settings.get('CROWD_Enable') !== true) {
      return;
    }

    const self = this;
    logger.info('Sync started');
    const users = RocketChat.models.Users.findCrowdUsers();

    if (users) {
      users.forEach(function (user) {
        logger.info('Syncing user', user.username);
        const userResponse = self.crowdClient.user.findSync(user.username);

        if (userResponse) {
          const crowdUser = {
            displayname: userResponse['display-name'],
            username: userResponse.name,
            email: userResponse.email,
            password: userResponse.password,
            active: userResponse.active
          };
          self.syncDataToUser(crowdUser, user._id);
        }
      });
    }
  }

  addNewUser(crowdUser) {
    const userQuery = {
      crowd: true,
      username: crowdUser.username
    }; // find our existinmg user if they exist

    const user = Meteor.users.findOne(userQuery);

    if (user) {
      const stampedToken = Accounts._generateStampedLoginToken();

      Meteor.users.update(user._id, {
        $push: {
          'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
        }
      });
      this.syncDataToUser(crowdUser, user._id);
      return {
        userId: user._id,
        token: stampedToken.token
      };
    } else {
      try {
        crowdUser._id = Accounts.createUser(crowdUser);
      } catch (error) {
        logger.info('Error creating new user for crowd user', error);
      }

      const updateUser = {
        name: crowdUser.displayname,
        crowd: true,
        active: crowdUser.active
      };
      Meteor.users.update(crowdUser._id, {
        $set: updateUser
      });
    }

    return {
      userId: crowdUser._id
    };
  }

};
Accounts.registerLoginHandler('crowd', function (loginRequest) {
  if (!loginRequest.crowd) {
    return undefined;
  }

  logger.info('Init CROWD login', loginRequest.username);

  if (RocketChat.settings.get('CROWD_Enable') !== true) {
    return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
  }

  const crowd = new CROWD();
  let user;

  try {
    user = crowd.authenticate(loginRequest.username, loginRequest.crowdPassword);
  } catch (error) {
    logger.error('Crowd user not authenticated due to an error, falling back');
  }

  if (!user) {
    return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.crowdPassword);
  }

  return crowd.addNewUser(user);
});
let interval;
let timeout;
RocketChat.settings.get('CROWD_Sync_User_Data', function (key, value) {
  Meteor.clearInterval(interval);
  Meteor.clearTimeout(timeout);

  if (value === true) {
    const crowd = new CROWD();
    logger.info('Enabling CROWD user sync');
    Meteor.setInterval(crowd.sync, 1000 * 60 * 60);
    Meteor.setTimeout(function () {
      crowd.sync();
    }, 1000 * 30);
  } else {
    logger.info('Disabling CROWD user sync');
  }
});
Meteor.methods({
  crowd_test_connection() {
    const user = Meteor.user();

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'crowd_test_connection'
      });
    }

    if (!RocketChat.authz.hasRole(user._id, 'admin')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'crowd_test_connection'
      });
    }

    if (RocketChat.settings.get('CROWD_Enable') !== true) {
      throw new Meteor.Error('crowd_disabled');
    }

    const crowd = new CROWD();

    try {
      crowd.checkConnection();
    } catch (error) {
      logger.error('Invalid crowd connection details, check the url and application username/password and make sure this server is allowed to speak to crowd');
      throw new Meteor.Error('Invalid connection details', '', {
        method: 'crowd_test_connection'
      });
    }

    return {
      message: 'Connection success',
      params: []
    };
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_crowd/server/settings.js                                                          //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.startup(function () {
  RocketChat.settings.addGroup('AtlassianCrowd', function () {
    const enableQuery = {
      _id: 'CROWD_Enable',
      value: true
    };
    this.add('CROWD_Enable', false, {
      type: 'boolean',
      public: true,
      i18nLabel: 'Enabled'
    });
    this.add('CROWD_URL', '', {
      type: 'string',
      enableQuery,
      i18nLabel: 'URL'
    });
    this.add('CROWD_Reject_Unauthorized', true, {
      type: 'boolean',
      enableQuery
    });
    this.add('CROWD_APP_USERNAME', '', {
      type: 'string',
      enableQuery,
      i18nLabel: 'Username'
    });
    this.add('CROWD_APP_PASSWORD', '', {
      type: 'password',
      enableQuery,
      i18nLabel: 'Password'
    });
    this.add('CROWD_Sync_User_Data', false, {
      type: 'boolean',
      enableQuery,
      i18nLabel: 'Sync_Users'
    });
    this.add('CROWD_Test_Connection', 'crowd_test_connection', {
      type: 'action',
      actionText: 'Test_Connection',
      i18nLabel: 'Test_Connection'
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:crowd/server/crowd.js");
require("/node_modules/meteor/rocketchat:crowd/server/settings.js");

/* Exports */
Package._define("rocketchat:crowd", {
  CROWD: CROWD
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_crowd.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjcm93ZC9zZXJ2ZXIvY3Jvd2QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y3Jvd2Qvc2VydmVyL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIkxvZ2dlciIsImZhbGxiYWNrRGVmYXVsdEFjY291bnRTeXN0ZW0iLCJiaW5kIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsImluZGV4T2YiLCJlbWFpbCIsImluZm8iLCJsb2dpblJlcXVlc3QiLCJ1c2VyIiwiZGlnZXN0IiwiU0hBMjU2IiwiYWxnb3JpdGhtIiwiQWNjb3VudHMiLCJfcnVuTG9naW5IYW5kbGVycyIsIkNST1dEIiwiY29uc3RydWN0b3IiLCJBdGxhc3NpYW5Dcm93ZCIsInJlcXVpcmUiLCJ1cmwiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJ1cmxMYXN0Q2hhciIsInNsaWNlIiwib3B0aW9ucyIsImNyb3dkIiwiYmFzZSIsImFwcGxpY2F0aW9uIiwibmFtZSIsInJlamVjdFVuYXV0aG9yaXplZCIsImNyb3dkQ2xpZW50IiwiYXV0aGVudGljYXRlU3luYyIsIk1ldGVvciIsIndyYXBBc3luYyIsImF1dGhlbnRpY2F0ZSIsImZpbmRTeW5jIiwiZmluZCIsInBpbmdTeW5jIiwicGluZyIsImNoZWNrQ29ubmVjdGlvbiIsImVycm9yIiwiYXV0aCIsInVzZXJSZXNwb25zZSIsImRpc3BsYXluYW1lIiwiYWN0aXZlIiwic3luY0RhdGFUb1VzZXIiLCJjcm93ZFVzZXIiLCJpZCIsImVtYWlscyIsImFkZHJlc3MiLCJ2ZXJpZmllZCIsIl9zZXRSZWFsTmFtZSIsInVzZXJzIiwidXBkYXRlIiwiJHNldCIsInN5bmMiLCJzZWxmIiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kQ3Jvd2RVc2VycyIsImZvckVhY2giLCJfaWQiLCJhZGROZXdVc2VyIiwidXNlclF1ZXJ5IiwiZmluZE9uZSIsInN0YW1wZWRUb2tlbiIsIl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuIiwiJHB1c2giLCJfaGFzaFN0YW1wZWRUb2tlbiIsInVzZXJJZCIsInRva2VuIiwiY3JlYXRlVXNlciIsInVwZGF0ZVVzZXIiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsInVuZGVmaW5lZCIsImNyb3dkUGFzc3dvcmQiLCJpbnRlcnZhbCIsInRpbWVvdXQiLCJrZXkiLCJ2YWx1ZSIsImNsZWFySW50ZXJ2YWwiLCJjbGVhclRpbWVvdXQiLCJzZXRJbnRlcnZhbCIsInNldFRpbWVvdXQiLCJtZXRob2RzIiwiY3Jvd2RfdGVzdF9jb25uZWN0aW9uIiwiRXJyb3IiLCJtZXRob2QiLCJhdXRoeiIsImhhc1JvbGUiLCJtZXNzYWdlIiwicGFyYW1zIiwic3RhcnR1cCIsImFkZEdyb3VwIiwiZW5hYmxlUXVlcnkiLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiaTE4bkxhYmVsIiwiYWN0aW9uVGV4dCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7QUFDQSxNQUFNQSxTQUFTLElBQUlDLE1BQUosQ0FBVyxPQUFYLEVBQW9CLEVBQXBCLENBQWY7O0FBRUEsU0FBU0MsNEJBQVQsQ0FBc0NDLElBQXRDLEVBQTRDQyxRQUE1QyxFQUFzREMsUUFBdEQsRUFBZ0U7QUFDL0QsTUFBSSxPQUFPRCxRQUFQLEtBQW9CLFFBQXhCLEVBQWtDO0FBQ2pDLFFBQUlBLFNBQVNFLE9BQVQsQ0FBaUIsR0FBakIsTUFBMEIsQ0FBQyxDQUEvQixFQUFrQztBQUNqQ0YsaUJBQVc7QUFBQ0E7QUFBRCxPQUFYO0FBQ0EsS0FGRCxNQUVPO0FBQ05BLGlCQUFXO0FBQUNHLGVBQU9IO0FBQVIsT0FBWDtBQUNBO0FBQ0Q7O0FBRURKLFNBQU9RLElBQVAsQ0FBWSxvQ0FBWixFQUFrREosUUFBbEQ7QUFFQSxRQUFNSyxlQUFlO0FBQ3BCQyxVQUFNTixRQURjO0FBRXBCQyxjQUFVO0FBQ1RNLGNBQVFDLE9BQU9QLFFBQVAsQ0FEQztB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IGdsb2JhbHM6Q1JPV0Q6dHJ1ZSAqL1xuLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiU0hBMjU2XCJdfV0gKi9cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0NST1dEJywge30pO1xuXG5mdW5jdGlvbiBmYWxsYmFja0RlZmF1bHRBY2NvdW50U3lzdGVtKGJpbmQsIHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXHRpZiAodHlwZW9mIHVzZXJuYW1lID09PSAnc3RyaW5nJykge1xuXHRcdGlmICh1c2VybmFtZS5pbmRleE9mKCdAJykgPT09IC0xKSB7XG5cdFx0XHR1c2VybmFtZSA9IHt1c2VybmFtZX07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHVzZXJuYW1lID0ge2VtYWlsOiB1c2VybmFtZX07XG5cdFx0fVxuXHR9XG5cblx0bG9nZ2VyLmluZm8oJ0ZhbGxiYWNrIHRvIGRlZmF1bHQgYWNjb3VudCBzeXN0ZW0nLCB1c2VybmFtZSk7XG5cblx0Y29uc3QgbG9naW5SZXF1ZXN0ID0ge1xuXHRcdHVzZXI6IHVzZXJuYW1lLFxuXHRcdHBhc3N3b3JkOiB7XG5cdFx0XHRkaWdlc3Q6IFNIQTI1NihwYXNzd29yZCksXG5cdFx0XHRhbGdvcml0aG06ICdzaGEtMjU2J1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gQWNjb3VudHMuX3J1bkxvZ2luSGFuZGxlcnMoYmluZCwgbG9naW5SZXF1ZXN0KTtcbn1cblxuY29uc3QgQ1JPV0QgPSBjbGFzcyBDUk9XRCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdGNvbnN0IEF0bGFzc2lhbkNyb3dkID0gcmVxdWlyZSgnYXRsYXNzaWFuLWNyb3dkJyk7XG5cdFx0bGV0IHVybCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDUk9XRF9VUkwnKTtcblx0XHRjb25zdCB1cmxMYXN0Q2hhciA9IHVybC5zbGljZSgtMSk7XG5cblx0XHRpZiAodXJsTGFzdENoYXIgIT09ICcvJykge1xuXHRcdFx0dXJsICs9ICcvJztcblx0XHR9XG5cblx0XHR0aGlzLm9wdGlvbnMgPSB7XG5cdFx0XHRjcm93ZDoge1xuXHRcdFx0XHRiYXNlOiB1cmxcblx0XHRcdH0sXG5cdFx0XHRhcHBsaWNhdGlvbjoge1xuXHRcdFx0XHRuYW1lOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ1JPV0RfQVBQX1VTRVJOQU1FJyksXG5cdFx0XHRcdHBhc3N3b3JkOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ1JPV0RfQVBQX1BBU1NXT1JEJylcblx0XHRcdH0sXG5cdFx0XHRyZWplY3RVbmF1dGhvcml6ZWQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDUk9XRF9SZWplY3RfVW5hdXRob3JpemVkJylcblx0XHR9O1xuXG5cdFx0dGhpcy5jcm93ZENsaWVudCA9IG5ldyBBdGxhc3NpYW5Dcm93ZCh0aGlzLm9wdGlvbnMpO1xuXG5cdFx0dGhpcy5jcm93ZENsaWVudC51c2VyLmF1dGhlbnRpY2F0ZVN5bmMgPSBNZXRlb3Iud3JhcEFzeW5jKHRoaXMuY3Jvd2RDbGllbnQudXNlci5hdXRoZW50aWNhdGUsIHRoaXMpO1xuXHRcdHRoaXMuY3Jvd2RDbGllbnQudXNlci5maW5kU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5jcm93ZENsaWVudC51c2VyLmZpbmQsIHRoaXMpO1xuXHRcdHRoaXMuY3Jvd2RDbGllbnQucGluZ1N5bmMgPSBNZXRlb3Iud3JhcEFzeW5jKHRoaXMuY3Jvd2RDbGllbnQucGluZywgdGhpcyk7XG5cdH1cblxuXHRjaGVja0Nvbm5lY3Rpb24oKSB7XG5cdFx0dGhpcy5jcm93ZENsaWVudC5waW5nU3luYygpO1xuXHR9XG5cblx0YXV0aGVudGljYXRlKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXHRcdGlmICghdXNlcm5hbWUgfHwgIXBhc3N3b3JkKSB7XG5cdFx0XHRsb2dnZXIuZXJyb3IoJ05vIHVzZXJuYW1lIG9yIHBhc3N3b3JkJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLmluZm8oJ0dvaW5nIHRvIGNyb3dkOicsIHVzZXJuYW1lKTtcblx0XHRjb25zdCBhdXRoID0gdGhpcy5jcm93ZENsaWVudC51c2VyLmF1dGhlbnRpY2F0ZVN5bmModXNlcm5hbWUsIHBhc3N3b3JkKTtcblxuXHRcdGlmICghYXV0aCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJSZXNwb25zZSA9IHRoaXMuY3Jvd2RDbGllbnQudXNlci5maW5kU3luYyh1c2VybmFtZSk7XG5cblx0XHRjb25zdCB1c2VyID0ge1xuXHRcdFx0ZGlzcGxheW5hbWU6IHVzZXJSZXNwb25zZVsnZGlzcGxheS1uYW1lJ10sXG5cdFx0XHR1c2VybmFtZTogdXNlclJlc3BvbnNlLm5hbWUsXG5cdFx0XHRlbWFpbDogdXNlclJlc3BvbnNlLmVtYWlsLFxuXHRcdFx0cGFzc3dvcmQsXG5cdFx0XHRhY3RpdmU6IHVzZXJSZXNwb25zZS5hY3RpdmVcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH1cblxuXHRzeW5jRGF0YVRvVXNlcihjcm93ZFVzZXIsIGlkKSB7XG5cdFx0Y29uc3QgdXNlciA9IHtcblx0XHRcdHVzZXJuYW1lOiBjcm93ZFVzZXIudXNlcm5hbWUsXG5cdFx0XHRlbWFpbHM6IFt7XG5cdFx0XHRcdGFkZHJlc3MgOiBjcm93ZFVzZXIuZW1haWwsXG5cdFx0XHRcdHZlcmlmaWVkOiB0cnVlXG5cdFx0XHR9XSxcblx0XHRcdHBhc3N3b3JkOiBjcm93ZFVzZXIucGFzc3dvcmQsXG5cdFx0XHRhY3RpdmU6IGNyb3dkVXNlci5hY3RpdmVcblx0XHR9O1xuXG5cdFx0aWYgKGNyb3dkVXNlci5kaXNwbGF5bmFtZSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5fc2V0UmVhbE5hbWUoaWQsIGNyb3dkVXNlci5kaXNwbGF5bmFtZSk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZShpZCwge1xuXHRcdFx0JHNldDogdXNlclxuXHRcdH0pO1xuXHR9XG5cblx0c3luYygpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NST1dEX0VuYWJsZScpICE9PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdFx0bG9nZ2VyLmluZm8oJ1N5bmMgc3RhcnRlZCcpO1xuXG5cdFx0Y29uc3QgdXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kQ3Jvd2RVc2VycygpO1xuXHRcdGlmICh1c2Vycykge1xuXHRcdFx0dXNlcnMuZm9yRWFjaChmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdGxvZ2dlci5pbmZvKCdTeW5jaW5nIHVzZXInLCB1c2VyLnVzZXJuYW1lKTtcblx0XHRcdFx0Y29uc3QgdXNlclJlc3BvbnNlID0gc2VsZi5jcm93ZENsaWVudC51c2VyLmZpbmRTeW5jKHVzZXIudXNlcm5hbWUpO1xuXHRcdFx0XHRpZiAodXNlclJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0Y29uc3QgY3Jvd2RVc2VyID0ge1xuXHRcdFx0XHRcdFx0ZGlzcGxheW5hbWU6IHVzZXJSZXNwb25zZVsnZGlzcGxheS1uYW1lJ10sXG5cdFx0XHRcdFx0XHR1c2VybmFtZTogdXNlclJlc3BvbnNlLm5hbWUsXG5cdFx0XHRcdFx0XHRlbWFpbDogdXNlclJlc3BvbnNlLmVtYWlsLFxuXHRcdFx0XHRcdFx0cGFzc3dvcmQ6IHVzZXJSZXNwb25zZS5wYXNzd29yZCxcblx0XHRcdFx0XHRcdGFjdGl2ZTogdXNlclJlc3BvbnNlLmFjdGl2ZVxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRzZWxmLnN5bmNEYXRhVG9Vc2VyKGNyb3dkVXNlciwgdXNlci5faWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRhZGROZXdVc2VyKGNyb3dkVXNlcikge1xuXHRcdGNvbnN0IHVzZXJRdWVyeSA9IHtcblx0XHRcdGNyb3dkOiB0cnVlLFxuXHRcdFx0dXNlcm5hbWU6IGNyb3dkVXNlci51c2VybmFtZVxuXHRcdH07XG5cblx0XHQvLyBmaW5kIG91ciBleGlzdGlubWcgdXNlciBpZiB0aGV5IGV4aXN0XG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJRdWVyeSk7XG5cblx0XHRpZiAodXNlcikge1xuXHRcdFx0Y29uc3Qgc3RhbXBlZFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKTtcblxuXHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwge1xuXHRcdFx0XHQkcHVzaDoge1xuXHRcdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMnOiBBY2NvdW50cy5faGFzaFN0YW1wZWRUb2tlbihzdGFtcGVkVG9rZW4pXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLnN5bmNEYXRhVG9Vc2VyKGNyb3dkVXNlciwgdXNlci5faWQpO1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1c2VySWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHR0b2tlbjogc3RhbXBlZFRva2VuLnRva2VuXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjcm93ZFVzZXIuX2lkID0gQWNjb3VudHMuY3JlYXRlVXNlcihjcm93ZFVzZXIpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0bG9nZ2VyLmluZm8oJ0Vycm9yIGNyZWF0aW5nIG5ldyB1c2VyIGZvciBjcm93ZCB1c2VyJywgZXJyb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1cGRhdGVVc2VyID0ge1xuXHRcdFx0XHRuYW1lOiBjcm93ZFVzZXIuZGlzcGxheW5hbWUsXG5cdFx0XHRcdGNyb3dkOiB0cnVlLFxuXHRcdFx0XHRhY3RpdmU6IGNyb3dkVXNlci5hY3RpdmVcblx0XHRcdH07XG5cblx0XHRcdE1ldGVvci51c2Vycy51cGRhdGUoY3Jvd2RVc2VyLl9pZCwge1xuXHRcdFx0XHQkc2V0OiB1cGRhdGVVc2VyXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXNlcklkOiBjcm93ZFVzZXIuX2lkXG5cdFx0fTtcblx0fVxufTtcblxuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoJ2Nyb3dkJywgZnVuY3Rpb24obG9naW5SZXF1ZXN0KSB7XG5cdGlmICghbG9naW5SZXF1ZXN0LmNyb3dkKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGxvZ2dlci5pbmZvKCdJbml0IENST1dEIGxvZ2luJywgbG9naW5SZXF1ZXN0LnVzZXJuYW1lKTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NST1dEX0VuYWJsZScpICE9PSB0cnVlKSB7XG5cdFx0cmV0dXJuIGZhbGxiYWNrRGVmYXVsdEFjY291bnRTeXN0ZW0odGhpcywgbG9naW5SZXF1ZXN0LnVzZXJuYW1lLCBsb2dpblJlcXVlc3QuY3Jvd2RQYXNzd29yZCk7XG5cdH1cblxuXHRjb25zdCBjcm93ZCA9IG5ldyBDUk9XRCgpO1xuXHRsZXQgdXNlcjtcblx0dHJ5IHtcblx0XHR1c2VyID0gY3Jvd2QuYXV0aGVudGljYXRlKGxvZ2luUmVxdWVzdC51c2VybmFtZSwgbG9naW5SZXF1ZXN0LmNyb3dkUGFzc3dvcmQpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdGxvZ2dlci5lcnJvcignQ3Jvd2QgdXNlciBub3QgYXV0aGVudGljYXRlZCBkdWUgdG8gYW4gZXJyb3IsIGZhbGxpbmcgYmFjaycpO1xuXHR9XG5cblx0aWYgKCF1c2VyKSB7XG5cdFx0cmV0dXJuIGZhbGxiYWNrRGVmYXVsdEFjY291bnRTeXN0ZW0odGhpcywgbG9naW5SZXF1ZXN0LnVzZXJuYW1lLCBsb2dpblJlcXVlc3QuY3Jvd2RQYXNzd29yZCk7XG5cdH1cblxuXHRyZXR1cm4gY3Jvd2QuYWRkTmV3VXNlcih1c2VyKTtcbn0pO1xuXG5sZXQgaW50ZXJ2YWw7XG5sZXQgdGltZW91dDtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NST1dEX1N5bmNfVXNlcl9EYXRhJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRNZXRlb3IuY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG5cdE1ldGVvci5jbGVhclRpbWVvdXQodGltZW91dCk7XG5cblx0aWYgKHZhbHVlID09PSB0cnVlKSB7XG5cdFx0Y29uc3QgY3Jvd2QgPSBuZXcgQ1JPV0QoKTtcblx0XHRsb2dnZXIuaW5mbygnRW5hYmxpbmcgQ1JPV0QgdXNlciBzeW5jJyk7XG5cdFx0TWV0ZW9yLnNldEludGVydmFsKGNyb3dkLnN5bmMsIDEwMDAgKiA2MCAqIDYwKTtcblx0XHRNZXRlb3Iuc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdGNyb3dkLnN5bmMoKTtcblx0XHR9LCAxMDAwICogMzApO1xuXHR9IGVsc2Uge1xuXHRcdGxvZ2dlci5pbmZvKCdEaXNhYmxpbmcgQ1JPV0QgdXNlciBzeW5jJyk7XG5cdH1cbn0pO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGNyb3dkX3Rlc3RfY29ubmVjdGlvbigpIHtcblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2Nyb3dkX3Rlc3RfY29ubmVjdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlci5faWQsICdhZG1pbicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnY3Jvd2RfdGVzdF9jb25uZWN0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NST1dEX0VuYWJsZScpICE9PSB0cnVlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdjcm93ZF9kaXNhYmxlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNyb3dkID0gbmV3IENST1dEKCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y3Jvd2QuY2hlY2tDb25uZWN0aW9uKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGxvZ2dlci5lcnJvcignSW52YWxpZCBjcm93ZCBjb25uZWN0aW9uIGRldGFpbHMsIGNoZWNrIHRoZSB1cmwgYW5kIGFwcGxpY2F0aW9uIHVzZXJuYW1lL3Bhc3N3b3JkIGFuZCBtYWtlIHN1cmUgdGhpcyBzZXJ2ZXIgaXMgYWxsb3dlZCB0byBzcGVhayB0byBjcm93ZCcpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignSW52YWxpZCBjb25uZWN0aW9uIGRldGFpbHMnLCAnJywgeyBtZXRob2Q6ICdjcm93ZF90ZXN0X2Nvbm5lY3Rpb24nIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRtZXNzYWdlOiAnQ29ubmVjdGlvbiBzdWNjZXNzJyxcblx0XHRcdHBhcmFtczogW11cblx0XHR9O1xuXHR9XG59KTtcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdBdGxhc3NpYW5Dcm93ZCcsIGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge19pZDogJ0NST1dEX0VuYWJsZScsIHZhbHVlOiB0cnVlfTtcblx0XHR0aGlzLmFkZCgnQ1JPV0RfRW5hYmxlJywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IHRydWUsIGkxOG5MYWJlbDogJ0VuYWJsZWQnIH0pO1xuXHRcdHRoaXMuYWRkKCdDUk9XRF9VUkwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnksIGkxOG5MYWJlbDogJ1VSTCcgfSk7XG5cdFx0dGhpcy5hZGQoJ0NST1dEX1JlamVjdF9VbmF1dGhvcml6ZWQnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0NST1dEX0FQUF9VU0VSTkFNRScsICcnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeSwgaTE4bkxhYmVsOiAnVXNlcm5hbWUnIH0pO1xuXHRcdHRoaXMuYWRkKCdDUk9XRF9BUFBfUEFTU1dPUkQnLCAnJywgeyB0eXBlOiAncGFzc3dvcmQnLCBlbmFibGVRdWVyeSwgaTE4bkxhYmVsOiAnUGFzc3dvcmQnIH0pO1xuXHRcdHRoaXMuYWRkKCdDUk9XRF9TeW5jX1VzZXJfRGF0YScsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgZW5hYmxlUXVlcnksIGkxOG5MYWJlbDogJ1N5bmNfVXNlcnMnIH0pO1xuXHRcdHRoaXMuYWRkKCdDUk9XRF9UZXN0X0Nvbm5lY3Rpb24nLCAnY3Jvd2RfdGVzdF9jb25uZWN0aW9uJywgeyB0eXBlOiAnYWN0aW9uJywgYWN0aW9uVGV4dDogJ1Rlc3RfQ29ubmVjdGlvbicsIGkxOG5MYWJlbDogJ1Rlc3RfQ29ubmVjdGlvbicgfSk7XG5cdH0pO1xufSk7XG4iXX0=
