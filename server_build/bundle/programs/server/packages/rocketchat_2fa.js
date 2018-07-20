(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var SHA256 = Package.sha.SHA256;
var Random = Package.random.Random;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:2fa":{"server":{"lib":{"totp.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/lib/totp.js                                                            //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
let speakeasy;
module.watch(require("speakeasy"), {
  default(v) {
    speakeasy = v;
  }

}, 0);
RocketChat.TOTP = {
  generateSecret() {
    return speakeasy.generateSecret();
  },

  generateOtpauthURL(secret, username) {
    return speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `Rocket.Chat:${username}`
    });
  },

  verify({
    secret,
    token,
    backupTokens,
    userId
  }) {
    // validates a backup code
    if (token.length === 8 && backupTokens) {
      const hashedCode = SHA256(token);
      const usedCode = backupTokens.indexOf(hashedCode);

      if (usedCode !== -1) {
        backupTokens.splice(usedCode, 1); // mark the code as used (remove it from the list)

        RocketChat.models.Users.update2FABackupCodesByUserId(userId, backupTokens);
        return true;
      }

      return false;
    }

    const maxDelta = RocketChat.settings.get('Accounts_TwoFactorAuthentication_MaxDelta');

    if (maxDelta) {
      const verifiedDelta = speakeasy.totp.verifyDelta({
        secret,
        encoding: 'base32',
        token,
        window: maxDelta
      });
      return verifiedDelta !== undefined;
    }

    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });
  },

  generateCodes() {
    // generate 12 backup codes
    const codes = [];
    const hashedCodes = [];

    for (let i = 0; i < 12; i++) {
      const code = Random.id(8);
      codes.push(code);
      hashedCodes.push(SHA256(code));
    }

    return {
      codes,
      hashedCodes
    };
  }

};
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"checkCodesRemaining.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/checkCodesRemaining.js                                         //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:checkCodesRemaining'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (!user.services || !user.services.totp || !user.services.totp.enabled) {
      throw new Meteor.Error('invalid-totp');
    }

    return {
      remaining: user.services.totp.hashedBackup.length
    };
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"disable.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/disable.js                                                     //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:disable'(code) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();
    const verified = RocketChat.TOTP.verify({
      secret: user.services.totp.secret,
      token: code,
      userId: Meteor.userId(),
      backupTokens: user.services.totp.hashedBackup
    });

    if (!verified) {
      return false;
    }

    return RocketChat.models.Users.disable2FAByUserId(Meteor.userId());
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"enable.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/enable.js                                                      //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:enable'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();
    const secret = RocketChat.TOTP.generateSecret();
    RocketChat.models.Users.disable2FAAndSetTempSecretByUserId(Meteor.userId(), secret.base32);
    return {
      secret: secret.base32,
      url: RocketChat.TOTP.generateOtpauthURL(secret, user.username)
    };
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"regenerateCodes.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/regenerateCodes.js                                             //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:regenerateCodes'(userToken) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (!user.services || !user.services.totp || !user.services.totp.enabled) {
      throw new Meteor.Error('invalid-totp');
    }

    const verified = RocketChat.TOTP.verify({
      secret: user.services.totp.secret,
      token: userToken,
      userId: Meteor.userId(),
      backupTokens: user.services.totp.hashedBackup
    });

    if (verified) {
      const {
        codes,
        hashedCodes
      } = RocketChat.TOTP.generateCodes();
      RocketChat.models.Users.update2FABackupCodesByUserId(Meteor.userId(), hashedCodes);
      return {
        codes
      };
    }
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateTempToken.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/validateTempToken.js                                           //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:validateTempToken'(userToken) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (!user.services || !user.services.totp || !user.services.totp.tempSecret) {
      throw new Meteor.Error('invalid-totp');
    }

    const verified = RocketChat.TOTP.verify({
      secret: user.services.totp.tempSecret,
      token: userToken
    });

    if (verified) {
      const {
        codes,
        hashedCodes
      } = RocketChat.TOTP.generateCodes();
      RocketChat.models.Users.enable2FAAndSetSecretAndCodesByUserId(Meteor.userId(), user.services.totp.tempSecret, hashedCodes);
      return {
        codes
      };
    }
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"users.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/models/users.js                                                        //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
RocketChat.models.Users.disable2FAAndSetTempSecretByUserId = function (userId, tempToken) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp': {
        enabled: false,
        tempSecret: tempToken
      }
    }
  });
};

RocketChat.models.Users.enable2FAAndSetSecretAndCodesByUserId = function (userId, secret, backupCodes) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp.enabled': true,
      'services.totp.secret': secret,
      'services.totp.hashedBackup': backupCodes
    },
    $unset: {
      'services.totp.tempSecret': 1
    }
  });
};

RocketChat.models.Users.disable2FAByUserId = function (userId) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp': {
        enabled: false
      }
    }
  });
};

RocketChat.models.Users.update2FABackupCodesByUserId = function (userId, backupCodes) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp.hashedBackup': backupCodes
    }
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"loginHandler.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/loginHandler.js                                                        //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Accounts.registerLoginHandler('totp', function (options) {
  if (!options.totp || !options.totp.code) {
    return;
  }

  return Accounts._runLoginHandlers(this, options.totp.login);
});
RocketChat.callbacks.add('onValidateLogin', login => {
  if (login.type === 'password' && login.user.services && login.user.services.totp && login.user.services.totp.enabled === true) {
    const {
      totp
    } = login.methodArguments[0];

    if (!totp || !totp.code) {
      throw new Meteor.Error('totp-required', 'TOTP Required');
    }

    const verified = RocketChat.TOTP.verify({
      secret: login.user.services.totp.secret,
      token: totp.code,
      userId: login.user._id,
      backupTokens: login.user.services.totp.hashedBackup
    });

    if (verified !== true) {
      throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
    }
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:2fa/server/lib/totp.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/checkCodesRemaining.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/disable.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/enable.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/regenerateCodes.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/validateTempToken.js");
require("/node_modules/meteor/rocketchat:2fa/server/models/users.js");
require("/node_modules/meteor/rocketchat:2fa/server/loginHandler.js");

/* Exports */
Package._define("rocketchat:2fa");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_2fa.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDoyZmEvc2VydmVyL2xpYi90b3RwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OjJmYS9zZXJ2ZXIvbWV0aG9kcy9jaGVja0NvZGVzUmVtYWluaW5nLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OjJmYS9zZXJ2ZXIvbWV0aG9kcy9kaXNhYmxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OjJmYS9zZXJ2ZXIvbWV0aG9kcy9lbmFibGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6MmZhL3NlcnZlci9tZXRob2RzL3JlZ2VuZXJhdGVDb2Rlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDoyZmEvc2VydmVyL21ldGhvZHMvdmFsaWRhdGVUZW1wVG9rZW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6MmZhL3NlcnZlci9tb2RlbHMvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6MmZhL3NlcnZlci9sb2dpbkhhbmRsZXIuanMiXSwibmFtZXMiOlsic3BlYWtlYXN5IiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJSb2NrZXRDaGF0IiwiVE9UUCIsImdlbmVyYXRlU2VjcmV0IiwiZ2VuZXJhdGVPdHBhdXRoVVJMIiwic2VjcmV0IiwidXNlcm5hbWUiLCJvdHBhdXRoVVJMIiwiYXNjaWkiLCJsYWJlbCIsInZlcmlmeSIsInRva2VuIiwiYmFja3VwVG9rZW5zIiwidXNlcklkIiwibGVuZ3RoIiwiaGFzaGVkQ29kZSIsIlNIQTI1NiIsInVzZWRDb2RlIiwiaW5kZXhPZiIsInNwbGljZSIsIm1vZGVscyIsIlVzZXJzIiwidXBkYXRlMkZBQmFja3VwQ29kZXNCeVVzZXJJZCIsIm1heERlbHRhIiwic2V0dGluZ3MiLCJnZXQiLCJ2ZXJpZmllZERlbHRhIiwidG90cCIsInZlcmlmeURlbHRhIiwiZW5jb2RpbmciLCJ3aW5kb3ciLCJ1bmRlZmluZWQiLCJnZW5lcmF0ZUNvZGVzIiwiY29kZXMiLCJoYXNoZWRDb2RlcyIsImkiLCJjb2RlIiwiUmFuZG9tIiwiaWQiLCJwdXNoIiwiTWV0ZW9yIiwibWV0aG9kcyIsIkVycm9yIiwidXNlciIsInNlcnZpY2VzIiwiZW5hYmxlZCIsInJlbWFpbmluZyIsImhhc2hlZEJhY2t1cCIsInZlcmlmaWVkIiwiZGlzYWJsZTJGQUJ5VXNlcklkIiwiZGlzYWJsZTJGQUFuZFNldFRlbXBTZWNyZXRCeVVzZXJJZCIsImJhc2UzMiIsInVybCIsInVzZXJUb2tlbiIsInRlbXBTZWNyZXQiLCJlbmFibGUyRkFBbmRTZXRTZWNyZXRBbmRDb2Rlc0J5VXNlcklkIiwidGVtcFRva2VuIiwidXBkYXRlIiwiX2lkIiwiJHNldCIsImJhY2t1cENvZGVzIiwiJHVuc2V0IiwiQWNjb3VudHMiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJfcnVuTG9naW5IYW5kbGVycyIsImxvZ2luIiwiY2FsbGJhY2tzIiwiYWRkIiwidHlwZSIsIm1ldGhvZEFyZ3VtZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLFNBQUo7QUFBY0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFdBQVIsQ0FBYixFQUFrQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsZ0JBQVVLLENBQVY7QUFBWTs7QUFBeEIsQ0FBbEMsRUFBNEQsQ0FBNUQ7QUFFZEMsV0FBV0MsSUFBWCxHQUFrQjtBQUNqQkMsbUJBQWlCO0FBQ2hCLFdBQU9SLFVBQVVRLGNBQVYsRUFBUDtBQUNBLEdBSGdCOztBQUtqQkMscUJBQW1CQyxNQUFuQixFQUEyQkMsUUFBM0IsRUFBcUM7QUFDcEMsV0FBT1gsVUFBVVksVUFBVixDQUFxQjtBQUMzQkYsY0FBUUEsT0FBT0csS0FEWTtBQUUzQkMsYUFBUSxlQUFlSCxRQUFVO0FBRk4sS0FBckIsQ0FBUDtBQUlBLEdBVmdCOztBQVlqQkksU0FBTztBQUFFTCxVQUFGO0FBQVVNLFNBQVY7QUFBaUJDLGdCQUFqQjtBQUErQkM7QUFBL0IsR0FBUCxFQUFnRDtBQUMvQztBQUNBLFFBQUlGLE1BQU1HLE1BQU4sS0FBaUIsQ0FBakIsSUFBc0JGLFlBQTFCLEVBQXdDO0FBQ3ZDLFlBQU1HLGFBQWFDLE9BQU9MLEtBQVAsQ0FBbkI7QUFDQSxZQUFNTSxXQUFXTCxhQUFhTSxPQUFiLENBQXFCSCxVQUFyQixDQUFqQjs7QUFFQSxVQUFJRSxhQUFhLENBQUMsQ0FBbEIsRUFBcUI7QUFDcEJMLHFCQUFhTyxNQUFiLENBQW9CRixRQUFwQixFQUE4QixDQUE5QixFQURvQixDQUdwQjs7QUFDQWhCLG1CQUFXbUIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLDRCQUF4QixDQUFxRFQsTUFBckQsRUFBNkRELFlBQTdEO0FBQ0EsZUFBTyxJQUFQO0FBQ0E7O0FBRUQsYUFBTyxLQUFQO0FBQ0E7O0FBRUQsVUFBTVcsV0FBV3RCLFdBQVd1QixRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQ0FBeEIsQ0FBakI7O0FBQ0EsUUFBSUYsUUFBSixFQUFjO0FBQ2IsWUFBTUcsZ0JBQWdCL0IsVUFBVWdDLElBQVYsQ0FBZUMsV0FBZixDQUEyQjtBQUNoRHZCLGNBRGdEO0FBRWhEd0Isa0JBQVUsUUFGc0M7QUFHaERsQixhQUhnRDtBQUloRG1CLGdCQUFRUDtBQUp3QyxPQUEzQixDQUF0QjtBQU9BLGFBQU9HLGtCQUFrQkssU0FBekI7QUFDQTs7QUFFRCxXQUFPcEMsVUFBVWdDLElBQVYsQ0FBZWpCLE1BQWYsQ0FBc0I7QUFDNUJMLFlBRDRCO0FBRTVCd0IsZ0JBQVUsUUFGa0I7QUFHNUJsQjtBQUg0QixLQUF0QixDQUFQO0FBS0EsR0E5Q2dCOztBQWdEakJxQixrQkFBZ0I7QUFDZjtBQUNBLFVBQU1DLFFBQVEsRUFBZDtBQUNBLFVBQU1DLGNBQWMsRUFBcEI7O0FBQ0EsU0FBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUksRUFBcEIsRUFBd0JBLEdBQXhCLEVBQTZCO0FBQzVCLFlBQU1DLE9BQU9DLE9BQU9DLEVBQVAsQ0FBVSxDQUFWLENBQWI7QUFDQUwsWUFBTU0sSUFBTixDQUFXSCxJQUFYO0FBQ0FGLGtCQUFZSyxJQUFaLENBQWlCdkIsT0FBT29CLElBQVAsQ0FBakI7QUFDQTs7QUFFRCxXQUFPO0FBQUVILFdBQUY7QUFBU0M7QUFBVCxLQUFQO0FBQ0E7O0FBM0RnQixDQUFsQixDOzs7Ozs7Ozs7OztBQ0ZBTSxPQUFPQyxPQUFQLENBQWU7QUFDZCw4QkFBNEI7QUFDM0IsUUFBSSxDQUFDRCxPQUFPM0IsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSTJCLE9BQU9FLEtBQVgsQ0FBaUIsZ0JBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxPQUFPSCxPQUFPRyxJQUFQLEVBQWI7O0FBRUEsUUFBSSxDQUFDQSxLQUFLQyxRQUFOLElBQWtCLENBQUNELEtBQUtDLFFBQUwsQ0FBY2pCLElBQWpDLElBQXlDLENBQUNnQixLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1Ca0IsT0FBakUsRUFBMEU7QUFDekUsWUFBTSxJQUFJTCxPQUFPRSxLQUFYLENBQWlCLGNBQWpCLENBQU47QUFDQTs7QUFFRCxXQUFPO0FBQ05JLGlCQUFXSCxLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1Cb0IsWUFBbkIsQ0FBZ0NqQztBQURyQyxLQUFQO0FBR0E7O0FBZmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBMEIsT0FBT0MsT0FBUCxDQUFlO0FBQ2QsZ0JBQWNMLElBQWQsRUFBb0I7QUFDbkIsUUFBSSxDQUFDSSxPQUFPM0IsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSTJCLE9BQU9FLEtBQVgsQ0FBaUIsZ0JBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxPQUFPSCxPQUFPRyxJQUFQLEVBQWI7QUFFQSxVQUFNSyxXQUFXL0MsV0FBV0MsSUFBWCxDQUFnQlEsTUFBaEIsQ0FBdUI7QUFDdkNMLGNBQVFzQyxLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1CdEIsTUFEWTtBQUV2Q00sYUFBT3lCLElBRmdDO0FBR3ZDdkIsY0FBUTJCLE9BQU8zQixNQUFQLEVBSCtCO0FBSXZDRCxvQkFBYytCLEtBQUtDLFFBQUwsQ0FBY2pCLElBQWQsQ0FBbUJvQjtBQUpNLEtBQXZCLENBQWpCOztBQU9BLFFBQUksQ0FBQ0MsUUFBTCxFQUFlO0FBQ2QsYUFBTyxLQUFQO0FBQ0E7O0FBRUQsV0FBTy9DLFdBQVdtQixNQUFYLENBQWtCQyxLQUFsQixDQUF3QjRCLGtCQUF4QixDQUEyQ1QsT0FBTzNCLE1BQVAsRUFBM0MsQ0FBUDtBQUNBOztBQXBCYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDQUEyQixPQUFPQyxPQUFQLENBQWU7QUFDZCxpQkFBZTtBQUNkLFFBQUksQ0FBQ0QsT0FBTzNCLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUkyQixPQUFPRSxLQUFYLENBQWlCLGdCQUFqQixDQUFOO0FBQ0E7O0FBRUQsVUFBTUMsT0FBT0gsT0FBT0csSUFBUCxFQUFiO0FBRUEsVUFBTXRDLFNBQVNKLFdBQVdDLElBQVgsQ0FBZ0JDLGNBQWhCLEVBQWY7QUFFQUYsZUFBV21CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCNkIsa0NBQXhCLENBQTJEVixPQUFPM0IsTUFBUCxFQUEzRCxFQUE0RVIsT0FBTzhDLE1BQW5GO0FBRUEsV0FBTztBQUNOOUMsY0FBUUEsT0FBTzhDLE1BRFQ7QUFFTkMsV0FBS25ELFdBQVdDLElBQVgsQ0FBZ0JFLGtCQUFoQixDQUFtQ0MsTUFBbkMsRUFBMkNzQyxLQUFLckMsUUFBaEQ7QUFGQyxLQUFQO0FBSUE7O0FBaEJhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQWtDLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLHdCQUFzQlksU0FBdEIsRUFBaUM7QUFDaEMsUUFBSSxDQUFDYixPQUFPM0IsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSTJCLE9BQU9FLEtBQVgsQ0FBaUIsZ0JBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxPQUFPSCxPQUFPRyxJQUFQLEVBQWI7O0FBRUEsUUFBSSxDQUFDQSxLQUFLQyxRQUFOLElBQWtCLENBQUNELEtBQUtDLFFBQUwsQ0FBY2pCLElBQWpDLElBQXlDLENBQUNnQixLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1Ca0IsT0FBakUsRUFBMEU7QUFDekUsWUFBTSxJQUFJTCxPQUFPRSxLQUFYLENBQWlCLGNBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNTSxXQUFXL0MsV0FBV0MsSUFBWCxDQUFnQlEsTUFBaEIsQ0FBdUI7QUFDdkNMLGNBQVFzQyxLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1CdEIsTUFEWTtBQUV2Q00sYUFBTzBDLFNBRmdDO0FBR3ZDeEMsY0FBUTJCLE9BQU8zQixNQUFQLEVBSCtCO0FBSXZDRCxvQkFBYytCLEtBQUtDLFFBQUwsQ0FBY2pCLElBQWQsQ0FBbUJvQjtBQUpNLEtBQXZCLENBQWpCOztBQU9BLFFBQUlDLFFBQUosRUFBYztBQUNiLFlBQU07QUFBRWYsYUFBRjtBQUFTQztBQUFULFVBQXlCakMsV0FBV0MsSUFBWCxDQUFnQjhCLGFBQWhCLEVBQS9CO0FBRUEvQixpQkFBV21CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyw0QkFBeEIsQ0FBcURrQixPQUFPM0IsTUFBUCxFQUFyRCxFQUFzRXFCLFdBQXRFO0FBQ0EsYUFBTztBQUFFRDtBQUFGLE9BQVA7QUFDQTtBQUNEOztBQXpCYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDQUFPLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLDBCQUF3QlksU0FBeEIsRUFBbUM7QUFDbEMsUUFBSSxDQUFDYixPQUFPM0IsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSTJCLE9BQU9FLEtBQVgsQ0FBaUIsZ0JBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxPQUFPSCxPQUFPRyxJQUFQLEVBQWI7O0FBRUEsUUFBSSxDQUFDQSxLQUFLQyxRQUFOLElBQWtCLENBQUNELEtBQUtDLFFBQUwsQ0FBY2pCLElBQWpDLElBQXlDLENBQUNnQixLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1CMkIsVUFBakUsRUFBNkU7QUFDNUUsWUFBTSxJQUFJZCxPQUFPRSxLQUFYLENBQWlCLGNBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNTSxXQUFXL0MsV0FBV0MsSUFBWCxDQUFnQlEsTUFBaEIsQ0FBdUI7QUFDdkNMLGNBQVFzQyxLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1CMkIsVUFEWTtBQUV2QzNDLGFBQU8wQztBQUZnQyxLQUF2QixDQUFqQjs7QUFLQSxRQUFJTCxRQUFKLEVBQWM7QUFDYixZQUFNO0FBQUVmLGFBQUY7QUFBU0M7QUFBVCxVQUF5QmpDLFdBQVdDLElBQVgsQ0FBZ0I4QixhQUFoQixFQUEvQjtBQUVBL0IsaUJBQVdtQixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtDLHFDQUF4QixDQUE4RGYsT0FBTzNCLE1BQVAsRUFBOUQsRUFBK0U4QixLQUFLQyxRQUFMLENBQWNqQixJQUFkLENBQW1CMkIsVUFBbEcsRUFBOEdwQixXQUE5RztBQUNBLGFBQU87QUFBRUQ7QUFBRixPQUFQO0FBQ0E7QUFDRDs7QUF2QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBaEMsV0FBV21CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCNkIsa0NBQXhCLEdBQTZELFVBQVNyQyxNQUFULEVBQWlCMkMsU0FBakIsRUFBNEI7QUFDeEYsU0FBTyxLQUFLQyxNQUFMLENBQVk7QUFDbEJDLFNBQUs3QztBQURhLEdBQVosRUFFSjtBQUNGOEMsVUFBTTtBQUNMLHVCQUFpQjtBQUNoQmQsaUJBQVMsS0FETztBQUVoQlMsb0JBQVlFO0FBRkk7QUFEWjtBQURKLEdBRkksQ0FBUDtBQVVBLENBWEQ7O0FBYUF2RCxXQUFXbUIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JrQyxxQ0FBeEIsR0FBZ0UsVUFBUzFDLE1BQVQsRUFBaUJSLE1BQWpCLEVBQXlCdUQsV0FBekIsRUFBc0M7QUFDckcsU0FBTyxLQUFLSCxNQUFMLENBQVk7QUFDbEJDLFNBQUs3QztBQURhLEdBQVosRUFFSjtBQUNGOEMsVUFBTTtBQUNMLCtCQUF5QixJQURwQjtBQUVMLDhCQUF3QnRELE1BRm5CO0FBR0wsb0NBQThCdUQ7QUFIekIsS0FESjtBQU1GQyxZQUFRO0FBQ1Asa0NBQTRCO0FBRHJCO0FBTk4sR0FGSSxDQUFQO0FBWUEsQ0FiRDs7QUFlQTVELFdBQVdtQixNQUFYLENBQWtCQyxLQUFsQixDQUF3QjRCLGtCQUF4QixHQUE2QyxVQUFTcEMsTUFBVCxFQUFpQjtBQUM3RCxTQUFPLEtBQUs0QyxNQUFMLENBQVk7QUFDbEJDLFNBQUs3QztBQURhLEdBQVosRUFFSjtBQUNGOEMsVUFBTTtBQUNMLHVCQUFpQjtBQUNoQmQsaUJBQVM7QUFETztBQURaO0FBREosR0FGSSxDQUFQO0FBU0EsQ0FWRDs7QUFZQTVDLFdBQVdtQixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsNEJBQXhCLEdBQXVELFVBQVNULE1BQVQsRUFBaUIrQyxXQUFqQixFQUE4QjtBQUNwRixTQUFPLEtBQUtILE1BQUwsQ0FBWTtBQUNsQkMsU0FBSzdDO0FBRGEsR0FBWixFQUVKO0FBQ0Y4QyxVQUFNO0FBQ0wsb0NBQThCQztBQUR6QjtBQURKLEdBRkksQ0FBUDtBQU9BLENBUkQsQzs7Ozs7Ozs7Ozs7QUN4Q0FFLFNBQVNDLG9CQUFULENBQThCLE1BQTlCLEVBQXNDLFVBQVNDLE9BQVQsRUFBa0I7QUFDdkQsTUFBSSxDQUFDQSxRQUFRckMsSUFBVCxJQUFpQixDQUFDcUMsUUFBUXJDLElBQVIsQ0FBYVMsSUFBbkMsRUFBeUM7QUFDeEM7QUFDQTs7QUFFRCxTQUFPMEIsU0FBU0csaUJBQVQsQ0FBMkIsSUFBM0IsRUFBaUNELFFBQVFyQyxJQUFSLENBQWF1QyxLQUE5QyxDQUFQO0FBQ0EsQ0FORDtBQVFBakUsV0FBV2tFLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGlCQUF6QixFQUE2Q0YsS0FBRCxJQUFXO0FBQ3RELE1BQUlBLE1BQU1HLElBQU4sS0FBZSxVQUFmLElBQTZCSCxNQUFNdkIsSUFBTixDQUFXQyxRQUF4QyxJQUFvRHNCLE1BQU12QixJQUFOLENBQVdDLFFBQVgsQ0FBb0JqQixJQUF4RSxJQUFnRnVDLE1BQU12QixJQUFOLENBQVdDLFFBQVgsQ0FBb0JqQixJQUFwQixDQUF5QmtCLE9BQXpCLEtBQXFDLElBQXpILEVBQStIO0FBQzlILFVBQU07QUFBRWxCO0FBQUYsUUFBV3VDLE1BQU1JLGVBQU4sQ0FBc0IsQ0FBdEIsQ0FBakI7O0FBRUEsUUFBSSxDQUFDM0MsSUFBRCxJQUFTLENBQUNBLEtBQUtTLElBQW5CLEVBQXlCO0FBQ3hCLFlBQU0sSUFBSUksT0FBT0UsS0FBWCxDQUFpQixlQUFqQixFQUFrQyxlQUFsQyxDQUFOO0FBQ0E7O0FBRUQsVUFBTU0sV0FBVy9DLFdBQVdDLElBQVgsQ0FBZ0JRLE1BQWhCLENBQXVCO0FBQ3ZDTCxjQUFRNkQsTUFBTXZCLElBQU4sQ0FBV0MsUUFBWCxDQUFvQmpCLElBQXBCLENBQXlCdEIsTUFETTtBQUV2Q00sYUFBT2dCLEtBQUtTLElBRjJCO0FBR3ZDdkIsY0FBUXFELE1BQU12QixJQUFOLENBQVdlLEdBSG9CO0FBSXZDOUMsb0JBQWNzRCxNQUFNdkIsSUFBTixDQUFXQyxRQUFYLENBQW9CakIsSUFBcEIsQ0FBeUJvQjtBQUpBLEtBQXZCLENBQWpCOztBQU9BLFFBQUlDLGFBQWEsSUFBakIsRUFBdUI7QUFDdEIsWUFBTSxJQUFJUixPQUFPRSxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLENBQU47QUFDQTtBQUNEO0FBQ0QsQ0FuQkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF8yZmEuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc3BlYWtlYXN5IGZyb20gJ3NwZWFrZWFzeSc7XG5cblJvY2tldENoYXQuVE9UUCA9IHtcblx0Z2VuZXJhdGVTZWNyZXQoKSB7XG5cdFx0cmV0dXJuIHNwZWFrZWFzeS5nZW5lcmF0ZVNlY3JldCgpO1xuXHR9LFxuXG5cdGdlbmVyYXRlT3RwYXV0aFVSTChzZWNyZXQsIHVzZXJuYW1lKSB7XG5cdFx0cmV0dXJuIHNwZWFrZWFzeS5vdHBhdXRoVVJMKHtcblx0XHRcdHNlY3JldDogc2VjcmV0LmFzY2lpLFxuXHRcdFx0bGFiZWw6IGBSb2NrZXQuQ2hhdDokeyB1c2VybmFtZSB9YFxuXHRcdH0pO1xuXHR9LFxuXG5cdHZlcmlmeSh7IHNlY3JldCwgdG9rZW4sIGJhY2t1cFRva2VucywgdXNlcklkIH0pIHtcblx0XHQvLyB2YWxpZGF0ZXMgYSBiYWNrdXAgY29kZVxuXHRcdGlmICh0b2tlbi5sZW5ndGggPT09IDggJiYgYmFja3VwVG9rZW5zKSB7XG5cdFx0XHRjb25zdCBoYXNoZWRDb2RlID0gU0hBMjU2KHRva2VuKTtcblx0XHRcdGNvbnN0IHVzZWRDb2RlID0gYmFja3VwVG9rZW5zLmluZGV4T2YoaGFzaGVkQ29kZSk7XG5cblx0XHRcdGlmICh1c2VkQ29kZSAhPT0gLTEpIHtcblx0XHRcdFx0YmFja3VwVG9rZW5zLnNwbGljZSh1c2VkQ29kZSwgMSk7XG5cblx0XHRcdFx0Ly8gbWFyayB0aGUgY29kZSBhcyB1c2VkIChyZW1vdmUgaXQgZnJvbSB0aGUgbGlzdClcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlMkZBQmFja3VwQ29kZXNCeVVzZXJJZCh1c2VySWQsIGJhY2t1cFRva2Vucyk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWF4RGVsdGEgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWNjb3VudHNfVHdvRmFjdG9yQXV0aGVudGljYXRpb25fTWF4RGVsdGEnKTtcblx0XHRpZiAobWF4RGVsdGEpIHtcblx0XHRcdGNvbnN0IHZlcmlmaWVkRGVsdGEgPSBzcGVha2Vhc3kudG90cC52ZXJpZnlEZWx0YSh7XG5cdFx0XHRcdHNlY3JldCxcblx0XHRcdFx0ZW5jb2Rpbmc6ICdiYXNlMzInLFxuXHRcdFx0XHR0b2tlbixcblx0XHRcdFx0d2luZG93OiBtYXhEZWx0YVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB2ZXJpZmllZERlbHRhICE9PSB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNwZWFrZWFzeS50b3RwLnZlcmlmeSh7XG5cdFx0XHRzZWNyZXQsXG5cdFx0XHRlbmNvZGluZzogJ2Jhc2UzMicsXG5cdFx0XHR0b2tlblxuXHRcdH0pO1xuXHR9LFxuXG5cdGdlbmVyYXRlQ29kZXMoKSB7XG5cdFx0Ly8gZ2VuZXJhdGUgMTIgYmFja3VwIGNvZGVzXG5cdFx0Y29uc3QgY29kZXMgPSBbXTtcblx0XHRjb25zdCBoYXNoZWRDb2RlcyA9IFtdO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMTI7IGkrKykge1xuXHRcdFx0Y29uc3QgY29kZSA9IFJhbmRvbS5pZCg4KTtcblx0XHRcdGNvZGVzLnB1c2goY29kZSk7XG5cdFx0XHRoYXNoZWRDb2Rlcy5wdXNoKFNIQTI1Nihjb2RlKSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgY29kZXMsIGhhc2hlZENvZGVzIH07XG5cdH1cbn07XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCcyZmE6Y2hlY2tDb2Rlc1JlbWFpbmluZycoKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1hdXRob3JpemVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRpZiAoIXVzZXIuc2VydmljZXMgfHwgIXVzZXIuc2VydmljZXMudG90cCB8fCAhdXNlci5zZXJ2aWNlcy50b3RwLmVuYWJsZWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdG90cCcpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRyZW1haW5pbmc6IHVzZXIuc2VydmljZXMudG90cC5oYXNoZWRCYWNrdXAubGVuZ3RoXG5cdFx0fTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCcyZmE6ZGlzYWJsZScoY29kZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0Y29uc3QgdmVyaWZpZWQgPSBSb2NrZXRDaGF0LlRPVFAudmVyaWZ5KHtcblx0XHRcdHNlY3JldDogdXNlci5zZXJ2aWNlcy50b3RwLnNlY3JldCxcblx0XHRcdHRva2VuOiBjb2RlLFxuXHRcdFx0dXNlcklkOiBNZXRlb3IudXNlcklkKCksXG5cdFx0XHRiYWNrdXBUb2tlbnM6IHVzZXIuc2VydmljZXMudG90cC5oYXNoZWRCYWNrdXBcblx0XHR9KTtcblxuXHRcdGlmICghdmVyaWZpZWQpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZGlzYWJsZTJGQUJ5VXNlcklkKE1ldGVvci51c2VySWQoKSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnMmZhOmVuYWJsZScoKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1hdXRob3JpemVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRjb25zdCBzZWNyZXQgPSBSb2NrZXRDaGF0LlRPVFAuZ2VuZXJhdGVTZWNyZXQoKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmRpc2FibGUyRkFBbmRTZXRUZW1wU2VjcmV0QnlVc2VySWQoTWV0ZW9yLnVzZXJJZCgpLCBzZWNyZXQuYmFzZTMyKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRzZWNyZXQ6IHNlY3JldC5iYXNlMzIsXG5cdFx0XHR1cmw6IFJvY2tldENoYXQuVE9UUC5nZW5lcmF0ZU90cGF1dGhVUkwoc2VjcmV0LCB1c2VyLnVzZXJuYW1lKVxuXHRcdH07XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnMmZhOnJlZ2VuZXJhdGVDb2RlcycodXNlclRva2VuKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1hdXRob3JpemVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRpZiAoIXVzZXIuc2VydmljZXMgfHwgIXVzZXIuc2VydmljZXMudG90cCB8fCAhdXNlci5zZXJ2aWNlcy50b3RwLmVuYWJsZWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdG90cCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZlcmlmaWVkID0gUm9ja2V0Q2hhdC5UT1RQLnZlcmlmeSh7XG5cdFx0XHRzZWNyZXQ6IHVzZXIuc2VydmljZXMudG90cC5zZWNyZXQsXG5cdFx0XHR0b2tlbjogdXNlclRva2VuLFxuXHRcdFx0dXNlcklkOiBNZXRlb3IudXNlcklkKCksXG5cdFx0XHRiYWNrdXBUb2tlbnM6IHVzZXIuc2VydmljZXMudG90cC5oYXNoZWRCYWNrdXBcblx0XHR9KTtcblxuXHRcdGlmICh2ZXJpZmllZCkge1xuXHRcdFx0Y29uc3QgeyBjb2RlcywgaGFzaGVkQ29kZXMgfSA9IFJvY2tldENoYXQuVE9UUC5nZW5lcmF0ZUNvZGVzKCk7XG5cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnVwZGF0ZTJGQUJhY2t1cENvZGVzQnlVc2VySWQoTWV0ZW9yLnVzZXJJZCgpLCBoYXNoZWRDb2Rlcyk7XG5cdFx0XHRyZXR1cm4geyBjb2RlcyB9O1xuXHRcdH1cblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCcyZmE6dmFsaWRhdGVUZW1wVG9rZW4nKHVzZXJUb2tlbikge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0aWYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzLnRvdHAgfHwgIXVzZXIuc2VydmljZXMudG90cC50ZW1wU2VjcmV0KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRvdHAnKTtcblx0XHR9XG5cblx0XHRjb25zdCB2ZXJpZmllZCA9IFJvY2tldENoYXQuVE9UUC52ZXJpZnkoe1xuXHRcdFx0c2VjcmV0OiB1c2VyLnNlcnZpY2VzLnRvdHAudGVtcFNlY3JldCxcblx0XHRcdHRva2VuOiB1c2VyVG9rZW5cblx0XHR9KTtcblxuXHRcdGlmICh2ZXJpZmllZCkge1xuXHRcdFx0Y29uc3QgeyBjb2RlcywgaGFzaGVkQ29kZXMgfSA9IFJvY2tldENoYXQuVE9UUC5nZW5lcmF0ZUNvZGVzKCk7XG5cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmVuYWJsZTJGQUFuZFNldFNlY3JldEFuZENvZGVzQnlVc2VySWQoTWV0ZW9yLnVzZXJJZCgpLCB1c2VyLnNlcnZpY2VzLnRvdHAudGVtcFNlY3JldCwgaGFzaGVkQ29kZXMpO1xuXHRcdFx0cmV0dXJuIHsgY29kZXMgfTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZGlzYWJsZTJGQUFuZFNldFRlbXBTZWNyZXRCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZCwgdGVtcFRva2VuKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiB1c2VySWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCdzZXJ2aWNlcy50b3RwJzoge1xuXHRcdFx0XHRlbmFibGVkOiBmYWxzZSxcblx0XHRcdFx0dGVtcFNlY3JldDogdGVtcFRva2VuXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmVuYWJsZTJGQUFuZFNldFNlY3JldEFuZENvZGVzQnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQsIHNlY3JldCwgYmFja3VwQ29kZXMpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHRfaWQ6IHVzZXJJZFxuXHR9LCB7XG5cdFx0JHNldDoge1xuXHRcdFx0J3NlcnZpY2VzLnRvdHAuZW5hYmxlZCc6IHRydWUsXG5cdFx0XHQnc2VydmljZXMudG90cC5zZWNyZXQnOiBzZWNyZXQsXG5cdFx0XHQnc2VydmljZXMudG90cC5oYXNoZWRCYWNrdXAnOiBiYWNrdXBDb2Rlc1xuXHRcdH0sXG5cdFx0JHVuc2V0OiB7XG5cdFx0XHQnc2VydmljZXMudG90cC50ZW1wU2VjcmV0JzogMVxuXHRcdH1cblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5kaXNhYmxlMkZBQnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHRfaWQ6IHVzZXJJZFxuXHR9LCB7XG5cdFx0JHNldDoge1xuXHRcdFx0J3NlcnZpY2VzLnRvdHAnOiB7XG5cdFx0XHRcdGVuYWJsZWQ6IGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLnVwZGF0ZTJGQUJhY2t1cENvZGVzQnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQsIGJhY2t1cENvZGVzKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiB1c2VySWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCdzZXJ2aWNlcy50b3RwLmhhc2hlZEJhY2t1cCc6IGJhY2t1cENvZGVzXG5cdFx0fVxuXHR9KTtcbn07XG4iLCJBY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcigndG90cCcsIGZ1bmN0aW9uKG9wdGlvbnMpIHtcblx0aWYgKCFvcHRpb25zLnRvdHAgfHwgIW9wdGlvbnMudG90cC5jb2RlKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0cmV0dXJuIEFjY291bnRzLl9ydW5Mb2dpbkhhbmRsZXJzKHRoaXMsIG9wdGlvbnMudG90cC5sb2dpbik7XG59KTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdvblZhbGlkYXRlTG9naW4nLCAobG9naW4pID0+IHtcblx0aWYgKGxvZ2luLnR5cGUgPT09ICdwYXNzd29yZCcgJiYgbG9naW4udXNlci5zZXJ2aWNlcyAmJiBsb2dpbi51c2VyLnNlcnZpY2VzLnRvdHAgJiYgbG9naW4udXNlci5zZXJ2aWNlcy50b3RwLmVuYWJsZWQgPT09IHRydWUpIHtcblx0XHRjb25zdCB7IHRvdHAgfSA9IGxvZ2luLm1ldGhvZEFyZ3VtZW50c1swXTtcblxuXHRcdGlmICghdG90cCB8fCAhdG90cC5jb2RlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCd0b3RwLXJlcXVpcmVkJywgJ1RPVFAgUmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCB2ZXJpZmllZCA9IFJvY2tldENoYXQuVE9UUC52ZXJpZnkoe1xuXHRcdFx0c2VjcmV0OiBsb2dpbi51c2VyLnNlcnZpY2VzLnRvdHAuc2VjcmV0LFxuXHRcdFx0dG9rZW46IHRvdHAuY29kZSxcblx0XHRcdHVzZXJJZDogbG9naW4udXNlci5faWQsXG5cdFx0XHRiYWNrdXBUb2tlbnM6IGxvZ2luLnVzZXIuc2VydmljZXMudG90cC5oYXNoZWRCYWNrdXBcblx0XHR9KTtcblxuXHRcdGlmICh2ZXJpZmllZCAhPT0gdHJ1ZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcigndG90cC1pbnZhbGlkJywgJ1RPVFAgSW52YWxpZCcpO1xuXHRcdH1cblx0fVxufSk7XG4iXX0=
