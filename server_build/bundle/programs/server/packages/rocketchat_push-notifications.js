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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:push-notifications":{"server":{"methods":{"saveNotificationSettings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_push-notifications/server/methods/saveNotificationSettings.js                          //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
Meteor.methods({
  saveNotificationSettings(roomId, field, value) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'saveNotificationSettings'
      });
    }

    check(roomId, String);
    check(field, String);
    check(value, String);
    const notifications = {
      'audioNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateAudioNotificationsById(subscription._id, value)
      },
      'desktopNotifications': {
        updateMethod: (subscription, value) => {
          if (value === 'default') {
            const userPref = RocketChat.getUserNotificationPreference(Meteor.userId(), 'desktop');
            RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, userPref.origin === 'server' ? null : userPref);
          } else {
            RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, {
              value,
              origin: 'subscription'
            });
          }
        }
      },
      'mobilePushNotifications': {
        updateMethod: (subscription, value) => {
          if (value === 'default') {
            const userPref = RocketChat.getUserNotificationPreference(Meteor.userId(), 'mobile');
            RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, userPref.origin === 'server' ? null : userPref);
          } else {
            RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, {
              value,
              origin: 'subscription'
            });
          }
        }
      },
      'emailNotifications': {
        updateMethod: (subscription, value) => {
          if (value === 'default') {
            const userPref = RocketChat.getUserNotificationPreference(Meteor.userId(), 'email');
            RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, userPref.origin === 'server' ? null : userPref);
          } else {
            RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, {
              value,
              origin: 'subscription'
            });
          }
        }
      },
      'unreadAlert': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateUnreadAlertById(subscription._id, value)
      },
      'disableNotifications': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDisableNotificationsById(subscription._id, value === '1')
      },
      'hideUnreadStatus': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1')
      },
      'muteGroupMentions': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateMuteGroupMentions(subscription._id, value === '1')
      },
      'desktopNotificationDuration': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDesktopNotificationDurationById(subscription._id, value)
      },
      'audioNotificationValue': {
        updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateAudioNotificationValueById(subscription._id, value)
      }
    };
    const isInvalidNotification = !Object.keys(notifications).includes(field);
    const basicValuesForNotifications = ['all', 'mentions', 'nothing', 'default'];
    const fieldsMustHaveBasicValues = ['emailNotifications', 'audioNotifications', 'mobilePushNotifications', 'desktopNotifications'];

    if (isInvalidNotification) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', {
        method: 'saveNotificationSettings'
      });
    }

    if (fieldsMustHaveBasicValues.includes(field) && !basicValuesForNotifications.includes(value)) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', {
        method: 'saveNotificationSettings'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveNotificationSettings'
      });
    }

    notifications[field].updateMethod(subscription, value);
    return true;
  },

  saveAudioNotificationValue(rid, value) {
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveAudioNotificationValue'
      });
    }

    RocketChat.models.Subscriptions.updateAudioNotificationValueById(subscription._id, value);
    return true;
  },

  saveDesktopNotificationDuration(rid, value) {
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveDesktopNotificationDuration'
      });
    }

    RocketChat.models.Subscriptions.updateDesktopNotificationDurationById(subscription._id, value);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Subscriptions.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_push-notifications/server/models/Subscriptions.js                                      //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
RocketChat.models.Subscriptions.updateAudioNotificationsById = function (_id, audioNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (audioNotifications === 'default') {
    update.$unset = {
      audioNotifications: 1
    };
  } else {
    update.$set = {
      audioNotifications
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateAudioNotificationValueById = function (_id, audioNotificationValue) {
  const query = {
    _id
  };
  const update = {
    $set: {
      audioNotificationValue
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationsById = function (_id, desktopNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (desktopNotifications === null) {
    update.$unset = {
      desktopNotifications: 1,
      desktopPrefOrigin: 1
    };
  } else {
    update.$set = {
      desktopNotifications: desktopNotifications.value,
      desktopPrefOrigin: desktopNotifications.origin
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationDurationById = function (_id, value) {
  const query = {
    _id
  };
  const update = {
    $set: {
      desktopNotificationDuration: parseInt(value)
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateMobilePushNotificationsById = function (_id, mobilePushNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (mobilePushNotifications === null) {
    update.$unset = {
      mobilePushNotifications: 1,
      mobilePrefOrigin: 1
    };
  } else {
    update.$set = {
      mobilePushNotifications: mobilePushNotifications.value,
      mobilePrefOrigin: mobilePushNotifications.origin
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateEmailNotificationsById = function (_id, emailNotifications) {
  const query = {
    _id
  };
  const update = {};

  if (emailNotifications === null) {
    update.$unset = {
      emailNotifications: 1,
      emailPrefOrigin: 1
    };
  } else {
    update.$set = {
      emailNotifications: emailNotifications.value,
      emailPrefOrigin: emailNotifications.origin
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateUnreadAlertById = function (_id, unreadAlert) {
  const query = {
    _id
  };
  const update = {
    $set: {
      unreadAlert
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDisableNotificationsById = function (_id, disableNotifications) {
  const query = {
    _id
  };
  const update = {
    $set: {
      disableNotifications
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateHideUnreadStatusById = function (_id, hideUnreadStatus) {
  const query = {
    _id
  };
  const update = {
    $set: {
      hideUnreadStatus
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateMuteGroupMentions = function (_id, muteGroupMentions) {
  const query = {
    _id
  };
  const update = {
    $set: {
      muteGroupMentions
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.findAlwaysNotifyAudioUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    audioNotifications: 'all'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findAlwaysNotifyDesktopUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    desktopNotifications: 'all'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findDontNotifyDesktopUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    desktopNotifications: 'nothing'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findAlwaysNotifyMobileUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    mobilePushNotifications: 'all'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findDontNotifyMobileUsersByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    mobilePushNotifications: 'nothing'
  };
  return this.find(query);
};

RocketChat.models.Subscriptions.findWithSendEmailByRoomId = function (roomId) {
  const query = {
    rid: roomId,
    emailNotifications: {
      $exists: true
    }
  };
  return this.find(query, {
    fields: {
      emailNotifications: 1,
      u: 1
    }
  });
};

RocketChat.models.Subscriptions.findNotificationPreferencesByRoom = function (query
/*{ roomId: rid, desktopFilter: desktopNotifications, mobileFilter: mobilePushNotifications, emailFilter: emailNotifications }*/
) {
  return this._db.find(query, {
    fields: {
      // fields needed for notifications
      rid: 1,
      t: 1,
      u: 1,
      name: 1,
      fname: 1,
      code: 1,
      // fields to define if should send a notification
      ignored: 1,
      audioNotifications: 1,
      audioNotificationValue: 1,
      desktopNotificationDuration: 1,
      desktopNotifications: 1,
      mobilePushNotifications: 1,
      emailNotifications: 1,
      disableNotifications: 1,
      muteGroupMentions: 1,
      userHighlights: 1
    }
  });
};

RocketChat.models.Subscriptions.findAllMessagesNotificationPreferencesByRoom = function (roomId) {
  const query = {
    rid: roomId,
    'u._id': {
      $exists: true
    },
    $or: [{
      desktopNotifications: {
        $in: ['all', 'mentions']
      }
    }, {
      mobilePushNotifications: {
        $in: ['all', 'mentions']
      }
    }, {
      emailNotifications: {
        $in: ['all', 'mentions']
      }
    }]
  };
  return this._db.find(query, {
    fields: {
      'u._id': 1,
      audioNotifications: 1,
      audioNotificationValue: 1,
      desktopNotificationDuration: 1,
      desktopNotifications: 1,
      mobilePushNotifications: 1,
      emailNotifications: 1,
      disableNotifications: 1,
      muteGroupMentions: 1
    }
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:push-notifications/server/methods/saveNotificationSettings.js");
require("/node_modules/meteor/rocketchat:push-notifications/server/models/Subscriptions.js");

/* Exports */
Package._define("rocketchat:push-notifications");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_push-notifications.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpwdXNoLW5vdGlmaWNhdGlvbnMvc2VydmVyL21ldGhvZHMvc2F2ZU5vdGlmaWNhdGlvblNldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnB1c2gtbm90aWZpY2F0aW9ucy9zZXJ2ZXIvbW9kZWxzL1N1YnNjcmlwdGlvbnMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwibWV0aG9kcyIsInNhdmVOb3RpZmljYXRpb25TZXR0aW5ncyIsInJvb21JZCIsImZpZWxkIiwidmFsdWUiLCJ1c2VySWQiLCJFcnJvciIsIm1ldGhvZCIsImNoZWNrIiwiU3RyaW5nIiwibm90aWZpY2F0aW9ucyIsInVwZGF0ZU1ldGhvZCIsInN1YnNjcmlwdGlvbiIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwidXBkYXRlQXVkaW9Ob3RpZmljYXRpb25zQnlJZCIsIl9pZCIsInVzZXJQcmVmIiwiZ2V0VXNlck5vdGlmaWNhdGlvblByZWZlcmVuY2UiLCJ1cGRhdGVEZXNrdG9wTm90aWZpY2F0aW9uc0J5SWQiLCJvcmlnaW4iLCJ1cGRhdGVNb2JpbGVQdXNoTm90aWZpY2F0aW9uc0J5SWQiLCJ1cGRhdGVFbWFpbE5vdGlmaWNhdGlvbnNCeUlkIiwidXBkYXRlVW5yZWFkQWxlcnRCeUlkIiwidXBkYXRlRGlzYWJsZU5vdGlmaWNhdGlvbnNCeUlkIiwidXBkYXRlSGlkZVVucmVhZFN0YXR1c0J5SWQiLCJ1cGRhdGVNdXRlR3JvdXBNZW50aW9ucyIsInVwZGF0ZURlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbkJ5SWQiLCJ1cGRhdGVBdWRpb05vdGlmaWNhdGlvblZhbHVlQnlJZCIsImlzSW52YWxpZE5vdGlmaWNhdGlvbiIsIk9iamVjdCIsImtleXMiLCJpbmNsdWRlcyIsImJhc2ljVmFsdWVzRm9yTm90aWZpY2F0aW9ucyIsImZpZWxkc011c3RIYXZlQmFzaWNWYWx1ZXMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJzYXZlQXVkaW9Ob3RpZmljYXRpb25WYWx1ZSIsInJpZCIsInNhdmVEZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb24iLCJhdWRpb05vdGlmaWNhdGlvbnMiLCJxdWVyeSIsInVwZGF0ZSIsIiR1bnNldCIsIiRzZXQiLCJhdWRpb05vdGlmaWNhdGlvblZhbHVlIiwiZGVza3RvcE5vdGlmaWNhdGlvbnMiLCJkZXNrdG9wUHJlZk9yaWdpbiIsImRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbiIsInBhcnNlSW50IiwibW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMiLCJtb2JpbGVQcmVmT3JpZ2luIiwiZW1haWxOb3RpZmljYXRpb25zIiwiZW1haWxQcmVmT3JpZ2luIiwidW5yZWFkQWxlcnQiLCJkaXNhYmxlTm90aWZpY2F0aW9ucyIsImhpZGVVbnJlYWRTdGF0dXMiLCJtdXRlR3JvdXBNZW50aW9ucyIsImZpbmRBbHdheXNOb3RpZnlBdWRpb1VzZXJzQnlSb29tSWQiLCJmaW5kIiwiZmluZEFsd2F5c05vdGlmeURlc2t0b3BVc2Vyc0J5Um9vbUlkIiwiZmluZERvbnROb3RpZnlEZXNrdG9wVXNlcnNCeVJvb21JZCIsImZpbmRBbHdheXNOb3RpZnlNb2JpbGVVc2Vyc0J5Um9vbUlkIiwiZmluZERvbnROb3RpZnlNb2JpbGVVc2Vyc0J5Um9vbUlkIiwiZmluZFdpdGhTZW5kRW1haWxCeVJvb21JZCIsIiRleGlzdHMiLCJmaWVsZHMiLCJ1IiwiZmluZE5vdGlmaWNhdGlvblByZWZlcmVuY2VzQnlSb29tIiwiX2RiIiwidCIsIm5hbWUiLCJmbmFtZSIsImNvZGUiLCJpZ25vcmVkIiwidXNlckhpZ2hsaWdodHMiLCJmaW5kQWxsTWVzc2FnZXNOb3RpZmljYXRpb25QcmVmZXJlbmNlc0J5Um9vbSIsIiRvciIsIiRpbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWU7QUFDZEMsMkJBQXlCQyxNQUF6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SEk7QUFIUSxHQUFkO0FBVUEsU0FBTyxLQUFLVCxHQUFMLENBQVNWLElBQVQsQ0FBY2xCLEtBQWQsRUFBcUI7QUFDM0J5QixZQUFRO0FBQ1AsZUFBUyxDQURGO0FBRVAxQiwwQkFBb0IsQ0FGYjtBQUdQSyw4QkFBd0IsQ0FIakI7QUFJUEcsbUNBQTZCLENBSnRCO0FBS1BGLDRCQUFzQixDQUxmO0FBTVBJLCtCQUF5QixDQU5sQjtBQU9QRSwwQkFBb0IsQ0FQYjtBQVFQRyw0QkFBc0IsQ0FSZjtBQVNQRSx5QkFBbUI7QUFUWjtBQURtQixHQUFyQixDQUFQO0FBYUEsQ0F4QkQsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9wdXNoLW5vdGlmaWNhdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3IubWV0aG9kcyh7XG5cdHNhdmVOb3RpZmljYXRpb25TZXR0aW5ncyhyb29tSWQsIGZpZWxkLCB2YWx1ZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzYXZlTm90aWZpY2F0aW9uU2V0dGluZ3MnIH0pO1xuXHRcdH1cblx0XHRjaGVjayhyb29tSWQsIFN0cmluZyk7XG5cdFx0Y2hlY2soZmllbGQsIFN0cmluZyk7XG5cdFx0Y2hlY2sodmFsdWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCBub3RpZmljYXRpb25zID0ge1xuXHRcdFx0J2F1ZGlvTm90aWZpY2F0aW9ucyc6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVBdWRpb05vdGlmaWNhdGlvbnNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fSxcblx0XHRcdCdkZXNrdG9wTm90aWZpY2F0aW9ucyc6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGlmICh2YWx1ZSA9PT0gJ2RlZmF1bHQnKSB7XG5cdFx0XHRcdFx0XHRjb25zdCB1c2VyUHJlZiA9IFJvY2tldENoYXQuZ2V0VXNlck5vdGlmaWNhdGlvblByZWZlcmVuY2UoTWV0ZW9yLnVzZXJJZCgpLCAnZGVza3RvcCcpO1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVEZXNrdG9wTm90aWZpY2F0aW9uc0J5SWQoc3Vic2NyaXB0aW9uLl9pZCwgdXNlclByZWYub3JpZ2luID09PSAnc2VydmVyJyA/IG51bGwgOiB1c2VyUHJlZik7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGVza3RvcE5vdGlmaWNhdGlvbnNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHsgdmFsdWUsIG9yaWdpbjogJ3N1YnNjcmlwdGlvbicgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0J21vYmlsZVB1c2hOb3RpZmljYXRpb25zJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlID09PSAnZGVmYXVsdCcpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHVzZXJQcmVmID0gUm9ja2V0Q2hhdC5nZXRVc2VyTm90aWZpY2F0aW9uUHJlZmVyZW5jZShNZXRlb3IudXNlcklkKCksICdtb2JpbGUnKTtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlTW9iaWxlUHVzaE5vdGlmaWNhdGlvbnNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHVzZXJQcmVmLm9yaWdpbiA9PT0gJ3NlcnZlcicgPyBudWxsIDogdXNlclByZWYpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU1vYmlsZVB1c2hOb3RpZmljYXRpb25zQnlJZChzdWJzY3JpcHRpb24uX2lkLCB7IHZhbHVlLCBvcmlnaW46ICdzdWJzY3JpcHRpb24nIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCdlbWFpbE5vdGlmaWNhdGlvbnMnOiB7XG5cdFx0XHRcdHVwZGF0ZU1ldGhvZDogKHN1YnNjcmlwdGlvbiwgdmFsdWUpID0+IHtcblx0XHRcdFx0XHRpZiAodmFsdWUgPT09ICdkZWZhdWx0Jykge1xuXHRcdFx0XHRcdFx0Y29uc3QgdXNlclByZWYgPSBSb2NrZXRDaGF0LmdldFVzZXJOb3RpZmljYXRpb25QcmVmZXJlbmNlKE1ldGVvci51c2VySWQoKSwgJ2VtYWlsJyk7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUVtYWlsTm90aWZpY2F0aW9uc0J5SWQoc3Vic2NyaXB0aW9uLl9pZCwgdXNlclByZWYub3JpZ2luID09PSAnc2VydmVyJyA/IG51bGwgOiB1c2VyUHJlZik7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRW1haWxOb3RpZmljYXRpb25zQnlJZChzdWJzY3JpcHRpb24uX2lkLCB7IHZhbHVlLCBvcmlnaW46ICdzdWJzY3JpcHRpb24nIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdCd1bnJlYWRBbGVydCc6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVVbnJlYWRBbGVydEJ5SWQoc3Vic2NyaXB0aW9uLl9pZCwgdmFsdWUpXG5cdFx0XHR9LFxuXHRcdFx0J2Rpc2FibGVOb3RpZmljYXRpb25zJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZURpc2FibGVOb3RpZmljYXRpb25zQnlJZChzdWJzY3JpcHRpb24uX2lkLCB2YWx1ZSA9PT0gJzEnKVxuXHRcdFx0fSxcblx0XHRcdCdoaWRlVW5yZWFkU3RhdHVzJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUhpZGVVbnJlYWRTdGF0dXNCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlID09PSAnMScpXG5cdFx0XHR9LFxuXHRcdFx0J211dGVHcm91cE1lbnRpb25zJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU11dGVHcm91cE1lbnRpb25zKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlID09PSAnMScpXG5cdFx0XHR9LFxuXHRcdFx0J2Rlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbic6IHtcblx0XHRcdFx0dXBkYXRlTWV0aG9kOiAoc3Vic2NyaXB0aW9uLCB2YWx1ZSkgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVEZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb25CeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fSxcblx0XHRcdCdhdWRpb05vdGlmaWNhdGlvblZhbHVlJzoge1xuXHRcdFx0XHR1cGRhdGVNZXRob2Q6IChzdWJzY3JpcHRpb24sIHZhbHVlKSA9PiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0Y29uc3QgaXNJbnZhbGlkTm90aWZpY2F0aW9uID0gIU9iamVjdC5rZXlzKG5vdGlmaWNhdGlvbnMpLmluY2x1ZGVzKGZpZWxkKTtcblx0XHRjb25zdCBiYXNpY1ZhbHVlc0Zvck5vdGlmaWNhdGlvbnMgPSBbJ2FsbCcsICdtZW50aW9ucycsICdub3RoaW5nJywgJ2RlZmF1bHQnXTtcblx0XHRjb25zdCBmaWVsZHNNdXN0SGF2ZUJhc2ljVmFsdWVzID0gWydlbWFpbE5vdGlmaWNhdGlvbnMnLCAnYXVkaW9Ob3RpZmljYXRpb25zJywgJ21vYmlsZVB1c2hOb3RpZmljYXRpb25zJywgJ2Rlc2t0b3BOb3RpZmljYXRpb25zJ107XG5cblx0XHRpZiAoaXNJbnZhbGlkTm90aWZpY2F0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXNldHRpbmdzJywgJ0ludmFsaWQgc2V0dGluZ3MgZmllbGQnLCB7IG1ldGhvZDogJ3NhdmVOb3RpZmljYXRpb25TZXR0aW5ncycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGZpZWxkc011c3RIYXZlQmFzaWNWYWx1ZXMuaW5jbHVkZXMoZmllbGQpICYmICFiYXNpY1ZhbHVlc0Zvck5vdGlmaWNhdGlvbnMuaW5jbHVkZXModmFsdWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXNldHRpbmdzJywgJ0ludmFsaWQgc2V0dGluZ3MgdmFsdWUnLCB7IG1ldGhvZDogJ3NhdmVOb3RpZmljYXRpb25TZXR0aW5ncycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbUlkLCBNZXRlb3IudXNlcklkKCkpO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXN1YnNjcmlwdGlvbicsICdJbnZhbGlkIHN1YnNjcmlwdGlvbicsIHsgbWV0aG9kOiAnc2F2ZU5vdGlmaWNhdGlvblNldHRpbmdzJyB9KTtcblx0XHR9XG5cblx0XHRub3RpZmljYXRpb25zW2ZpZWxkXS51cGRhdGVNZXRob2Qoc3Vic2NyaXB0aW9uLCB2YWx1ZSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRzYXZlQXVkaW9Ob3RpZmljYXRpb25WYWx1ZShyaWQsIHZhbHVlKSB7XG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocmlkLCBNZXRlb3IudXNlcklkKCkpO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXN1YnNjcmlwdGlvbicsICdJbnZhbGlkIHN1YnNjcmlwdGlvbicsIHsgbWV0aG9kOiAnc2F2ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWUnIH0pO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRzYXZlRGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uKHJpZCwgdmFsdWUpIHtcblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyaWQsIE1ldGVvci51c2VySWQoKSk7XG5cdFx0aWYgKCFzdWJzY3JpcHRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc3Vic2NyaXB0aW9uJywgJ0ludmFsaWQgc3Vic2NyaXB0aW9uJywgeyBtZXRob2Q6ICdzYXZlRGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uJyB9KTtcblx0XHR9XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVEZXNrdG9wTm90aWZpY2F0aW9uRHVyYXRpb25CeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uc0J5SWQgPSBmdW5jdGlvbihfaWQsIGF1ZGlvTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRpZiAoYXVkaW9Ob3RpZmljYXRpb25zID09PSAnZGVmYXVsdCcpIHtcblx0XHR1cGRhdGUuJHVuc2V0ID0geyBhdWRpb05vdGlmaWNhdGlvbnM6IDEgfTtcblx0fSBlbHNlIHtcblx0XHR1cGRhdGUuJHNldCA9IHsgYXVkaW9Ob3RpZmljYXRpb25zIH07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1ZGlvTm90aWZpY2F0aW9uVmFsdWVCeUlkID0gZnVuY3Rpb24oX2lkLCBhdWRpb05vdGlmaWNhdGlvblZhbHVlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRhdWRpb05vdGlmaWNhdGlvblZhbHVlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGVza3RvcE5vdGlmaWNhdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBkZXNrdG9wTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRpZiAoZGVza3RvcE5vdGlmaWNhdGlvbnMgPT09IG51bGwpIHtcblx0XHR1cGRhdGUuJHVuc2V0ID0ge1xuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6IDEsXG5cdFx0XHRkZXNrdG9wUHJlZk9yaWdpbjogMVxuXHRcdH07XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlLiRzZXQgPSB7XG5cdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogZGVza3RvcE5vdGlmaWNhdGlvbnMudmFsdWUsXG5cdFx0XHRkZXNrdG9wUHJlZk9yaWdpbjogZGVza3RvcE5vdGlmaWNhdGlvbnMub3JpZ2luXG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uQnlJZCA9IGZ1bmN0aW9uKF9pZCwgdmFsdWUpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbjogcGFyc2VJbnQodmFsdWUpXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlTW9iaWxlUHVzaE5vdGlmaWNhdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBtb2JpbGVQdXNoTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRpZiAobW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMgPT09IG51bGwpIHtcblx0XHR1cGRhdGUuJHVuc2V0ID0ge1xuXHRcdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6IDEsXG5cdFx0XHRtb2JpbGVQcmVmT3JpZ2luOiAxXG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHR1cGRhdGUuJHNldCA9IHtcblx0XHRcdG1vYmlsZVB1c2hOb3RpZmljYXRpb25zOiBtb2JpbGVQdXNoTm90aWZpY2F0aW9ucy52YWx1ZSxcblx0XHRcdG1vYmlsZVByZWZPcmlnaW46IG1vYmlsZVB1c2hOb3RpZmljYXRpb25zLm9yaWdpblxuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUVtYWlsTm90aWZpY2F0aW9uc0J5SWQgPSBmdW5jdGlvbihfaWQsIGVtYWlsTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7fTtcblxuXHRpZiAoZW1haWxOb3RpZmljYXRpb25zID09PSBudWxsKSB7XG5cdFx0dXBkYXRlLiR1bnNldCA9IHtcblx0XHRcdGVtYWlsTm90aWZpY2F0aW9uczogMSxcblx0XHRcdGVtYWlsUHJlZk9yaWdpbjogMVxuXHRcdH07XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlLiRzZXQgPSB7XG5cdFx0XHRlbWFpbE5vdGlmaWNhdGlvbnM6IGVtYWlsTm90aWZpY2F0aW9ucy52YWx1ZSxcblx0XHRcdGVtYWlsUHJlZk9yaWdpbjogZW1haWxOb3RpZmljYXRpb25zLm9yaWdpblxuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZVVucmVhZEFsZXJ0QnlJZCA9IGZ1bmN0aW9uKF9pZCwgdW5yZWFkQWxlcnQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHVucmVhZEFsZXJ0XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlRGlzYWJsZU5vdGlmaWNhdGlvbnNCeUlkID0gZnVuY3Rpb24oX2lkLCBkaXNhYmxlTm90aWZpY2F0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0ZGlzYWJsZU5vdGlmaWNhdGlvbnNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVIaWRlVW5yZWFkU3RhdHVzQnlJZCA9IGZ1bmN0aW9uKF9pZCwgaGlkZVVucmVhZFN0YXR1cykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0aGlkZVVucmVhZFN0YXR1c1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU11dGVHcm91cE1lbnRpb25zID0gZnVuY3Rpb24oX2lkLCBtdXRlR3JvdXBNZW50aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0bXV0ZUdyb3VwTWVudGlvbnNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQWx3YXlzTm90aWZ5QXVkaW9Vc2Vyc0J5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdGF1ZGlvTm90aWZpY2F0aW9uczogJ2FsbCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEFsd2F5c05vdGlmeURlc2t0b3BVc2Vyc0J5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kRG9udE5vdGlmeURlc2t0b3BVc2Vyc0J5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiAnbm90aGluZydcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEFsd2F5c05vdGlmeU1vYmlsZVVzZXJzQnlSb29tSWQgPSBmdW5jdGlvbihyb29tSWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cmlkOiByb29tSWQsXG5cdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmREb250Tm90aWZ5TW9iaWxlVXNlcnNCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyaWQ6IHJvb21JZCxcblx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogJ25vdGhpbmcnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRXaXRoU2VuZEVtYWlsQnlSb29tSWQgPSBmdW5jdGlvbihyb29tSWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cmlkOiByb29tSWQsXG5cdFx0ZW1haWxOb3RpZmljYXRpb25zOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnksIHsgZmllbGRzOiB7IGVtYWlsTm90aWZpY2F0aW9uczogMSwgdTogMSB9IH0pO1xufTtcblxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmROb3RpZmljYXRpb25QcmVmZXJlbmNlc0J5Um9vbSA9IGZ1bmN0aW9uKHF1ZXJ5Lyp7IHJvb21JZDogcmlkLCBkZXNrdG9wRmlsdGVyOiBkZXNrdG9wTm90aWZpY2F0aW9ucywgbW9iaWxlRmlsdGVyOiBtb2JpbGVQdXNoTm90aWZpY2F0aW9ucywgZW1haWxGaWx0ZXI6IGVtYWlsTm90aWZpY2F0aW9ucyB9Ki8pIHtcblxuXHRyZXR1cm4gdGhpcy5fZGIuZmluZChxdWVyeSwge1xuXHRcdGZpZWxkczoge1xuXG5cdFx0XHQvLyBmaWVsZHMgbmVlZGVkIGZvciBub3RpZmljYXRpb25zXG5cdFx0XHRyaWQ6IDEsXG5cdFx0XHR0OiAxLFxuXHRcdFx0dTogMSxcblx0XHRcdG5hbWU6IDEsXG5cdFx0XHRmbmFtZTogMSxcblx0XHRcdGNvZGU6IDEsXG5cblx0XHRcdC8vIGZpZWxkcyB0byBkZWZpbmUgaWYgc2hvdWxkIHNlbmQgYSBub3RpZmljYXRpb25cblx0XHRcdGlnbm9yZWQ6IDEsXG5cdFx0XHRhdWRpb05vdGlmaWNhdGlvbnM6IDEsXG5cdFx0XHRhdWRpb05vdGlmaWNhdGlvblZhbHVlOiAxLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uOiAxLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6IDEsXG5cdFx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogMSxcblx0XHRcdGVtYWlsTm90aWZpY2F0aW9uczogMSxcblx0XHRcdGRpc2FibGVOb3RpZmljYXRpb25zOiAxLFxuXHRcdFx0bXV0ZUdyb3VwTWVudGlvbnM6IDEsXG5cdFx0XHR1c2VySGlnaGxpZ2h0czogMVxuXHRcdH1cblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRBbGxNZXNzYWdlc05vdGlmaWNhdGlvblByZWZlcmVuY2VzQnlSb29tID0gZnVuY3Rpb24ocm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJpZDogcm9vbUlkLFxuXHRcdCd1Ll9pZCc6IHskZXhpc3RzOiB0cnVlfSxcblx0XHQkb3I6IFtcblx0XHRcdHsgZGVza3RvcE5vdGlmaWNhdGlvbnM6IHsgJGluOiBbJ2FsbCcsICdtZW50aW9ucyddIH0gfSxcblx0XHRcdHsgbW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6IHsgJGluOiBbJ2FsbCcsICdtZW50aW9ucyddIH0gfSxcblx0XHRcdHsgZW1haWxOb3RpZmljYXRpb25zOiB7ICRpbjogWydhbGwnLCAnbWVudGlvbnMnXSB9IH1cblx0XHRdXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuX2RiLmZpbmQocXVlcnksIHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdCd1Ll9pZCc6IDEsXG5cdFx0XHRhdWRpb05vdGlmaWNhdGlvbnM6IDEsXG5cdFx0XHRhdWRpb05vdGlmaWNhdGlvblZhbHVlOiAxLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uOiAxLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6IDEsXG5cdFx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogMSxcblx0XHRcdGVtYWlsTm90aWZpY2F0aW9uczogMSxcblx0XHRcdGRpc2FibGVOb3RpZmljYXRpb25zOiAxLFxuXHRcdFx0bXV0ZUdyb3VwTWVudGlvbnM6IDFcblx0XHR9XG5cdH0pO1xufTtcbiJdfQ==
