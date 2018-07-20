(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var settings;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:channel-settings":{"server":{"functions":{"saveReactWhenReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveReactWhenReadOnly.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveReactWhenReadOnly = function (rid, allowReact) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveReactWhenReadOnly'
    });
  }

  return RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomType.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomType.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomType = function (rid, roomType, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  if (roomType !== 'c' && roomType !== 'p') {
    throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
      'function': 'RocketChat.saveRoomType',
      type: roomType
    });
  }

  const room = RocketChat.models.Rooms.findOneById(rid);

  if (room == null) {
    throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
      'function': 'RocketChat.saveRoomType',
      _id: rid
    });
  }

  if (room.t === 'd') {
    throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  const result = RocketChat.models.Rooms.setTypeById(rid, roomType) && RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType);

  if (result && sendMessage) {
    let message;

    if (roomType === 'c') {
      message = TAPi18n.__('Channel', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    } else {
      message = TAPi18n.__('Private_Group', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    }

    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_privacy', rid, message, user);
  }

  return result;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTopic.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomTopic.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomTopic = function (rid, roomTopic, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTopic'
    });
  }

  roomTopic = s.escapeHTML(roomTopic);
  const update = RocketChat.models.Rooms.setTopicById(rid, roomTopic);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rid, roomTopic, user);
  }

  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomCustomFields.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomCustomFields.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomCustomFields = function (rid, roomCustomFields) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomCustomFields'
    });
  }

  if (!Match.test(roomCustomFields, Object)) {
    throw new Meteor.Error('invalid-roomCustomFields-type', 'Invalid roomCustomFields type', {
      'function': 'RocketChat.saveRoomCustomFields'
    });
  }

  const ret = RocketChat.models.Rooms.setCustomFieldsById(rid, roomCustomFields); // Update customFields of any user's Subscription related with this rid

  RocketChat.models.Subscriptions.updateCustomFieldsByRoomId(rid, roomCustomFields);
  return ret;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomAnnouncement.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomAnnouncement.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectWithoutProperties"));

let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomAnnouncement = function (rid, roomAnnouncement, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveRoomAnnouncement'
    });
  }

  let message;
  let announcementDetails;

  if (typeof roomAnnouncement === 'string') {
    message = roomAnnouncement;
  } else {
    var _roomAnnouncement = roomAnnouncement;
    ({
      message
    } = _roomAnnouncement);
    announcementDetails = (0, _objectWithoutProperties2.default)(_roomAnnouncement, ["message"]);
    _roomAnnouncement;
  }

  const escapedMessage = s.escapeHTML(message);
  const updated = RocketChat.models.Rooms.setAnnouncementById(rid, escapedMessage, announcementDetails);

  if (updated && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, escapedMessage, user);
  }

  return updated;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomName.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomName.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomName = function (rid, displayName, user, sendMessage = true) {
  const room = RocketChat.models.Rooms.findOneById(rid);

  if (RocketChat.roomTypes.roomTypes[room.t].preventRenaming()) {
    throw new Meteor.Error('error-not-allowed', 'Not allowed', {
      'function': 'RocketChat.saveRoomdisplayName'
    });
  }

  if (displayName === room.name) {
    return;
  }

  const slugifiedRoomName = RocketChat.getValidRoomName(displayName, rid);
  const update = RocketChat.models.Rooms.setNameById(rid, slugifiedRoomName, displayName) && RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
  }

  return displayName;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomReadOnly.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomReadOnly = function (rid, readOnly) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomReadOnly'
    });
  }

  return RocketChat.models.Rooms.setReadOnlyById(rid, readOnly);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomDescription.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomDescription.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomDescription = function (rid, roomDescription, user) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomDescription'
    });
  }

  const escapedRoomDescription = s.escapeHTML(roomDescription);
  const update = RocketChat.models.Rooms.setDescriptionById(rid, escapedRoomDescription);
  RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, escapedRoomDescription, user);
  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomSystemMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomSystemMessages.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomSystemMessages = function (rid, systemMessages) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomSystemMessages'
    });
  }

  return RocketChat.models.Rooms.setSystemMessagesById(rid, systemMessages);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"saveRoomSettings.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/methods/saveRoomSettings.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const fields = ['roomName', 'roomTopic', 'roomAnnouncement', 'roomCustomFields', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions'];
Meteor.methods({
  saveRoomSettings(rid, settings, value) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        'function': 'RocketChat.saveRoomName'
      });
    }

    if (!Match.test(rid, String)) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    if (typeof settings !== 'object') {
      settings = {
        [settings]: value
      };
    }

    if (!Object.keys(settings).every(key => fields.includes(key))) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
        method: 'saveRoomSettings'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    const user = Meteor.user();
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      if (settings === 'default' && !RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
        throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
          method: 'saveRoomSettings',
          action: 'Viewing_room_administration'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'c' && !RocketChat.authz.hasPermission(this.userId, 'create-c')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'p' && !RocketChat.authz.hasPermission(this.userId, 'create-p')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }
    });
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      switch (setting) {
        case 'roomName':
          RocketChat.saveRoomName(rid, value, user);
          break;

        case 'roomTopic':
          if (value !== room.topic) {
            RocketChat.saveRoomTopic(rid, value, user);
          }

          break;

        case 'roomAnnouncement':
          if (value !== room.announcement) {
            RocketChat.saveRoomAnnouncement(rid, value, user);
          }

          break;

        case 'roomCustomFields':
          if (value !== room.customFields) {
            RocketChat.saveRoomCustomFields(rid, value);
          }

          break;

        case 'roomDescription':
          if (value !== room.description) {
            RocketChat.saveRoomDescription(rid, value, user);
          }

          break;

        case 'roomType':
          if (value !== room.t) {
            RocketChat.saveRoomType(rid, value, user);
          }

          break;

        case 'tokenpass':
          check(value, {
            require: String,
            tokens: [{
              token: String,
              balance: String
            }]
          });
          RocketChat.saveRoomTokenpass(rid, value);
          break;

        case 'streamingOptions':
          RocketChat.saveStreamingOptions(rid, value);
          break;

        case 'readOnly':
          if (value !== room.ro) {
            RocketChat.saveRoomReadOnly(rid, value, user);
          }

          break;

        case 'reactWhenReadOnly':
          if (value !== room.reactWhenReadOnly) {
            RocketChat.saveReactWhenReadOnly(rid, value, user);
          }

          break;

        case 'systemMessages':
          if (value !== room.sysMes) {
            RocketChat.saveRoomSystemMessages(rid, value, user);
          }

          break;

        case 'joinCode':
          RocketChat.models.Rooms.setJoinCodeById(rid, String(value));
          break;

        case 'default':
          RocketChat.models.Rooms.saveDefaultById(rid, value);
      }
    });
    return {
      result: true,
      rid: room._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Messages.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser = function (type, roomId, message, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData);
};

RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser = function (roomId, roomName, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser('r', roomId, roomName, user, extraData);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Rooms.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Rooms.setDescriptionById = function (_id, description) {
  const query = {
    _id
  };
  const update = {
    $set: {
      description
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setReadOnlyById = function (_id, readOnly) {
  const query = {
    _id
  };
  const update = {
    $set: {
      ro: readOnly,
      muted: []
    }
  };

  if (readOnly) {
    RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(_id, {
      fields: {
        'u._id': 1,
        'u.username': 1
      }
    }).forEach(function ({
      u: user
    }) {
      if (RocketChat.authz.hasPermission(user._id, 'post-readonly')) {
        return;
      }

      return update.$set.muted.push(user.username);
    });
  } else {
    update.$unset = {
      muted: ''
    };
  }

  if (update.$set.muted.length === 0) {
    delete update.$set.muted;
  }

  return this.update(query, update);
};

RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById = function (_id, allowReacting) {
  const query = {
    _id
  };
  const update = {
    $set: {
      reactWhenReadOnly: allowReacting
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setSystemMessagesById = function (_id, systemMessages) {
  const query = {
    _id
  };
  const update = {
    $set: {
      sysMes: systemMessages
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/startup.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Permissions.upsert('post-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner', 'moderator']
    }
  });
  RocketChat.models.Permissions.upsert('set-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
  RocketChat.models.Permissions.upsert('set-react-when-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveReactWhenReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomType.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomTopic.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomCustomFields.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomAnnouncement.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomName.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomDescription.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomSystemMessages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/methods/saveRoomSettings.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/startup.js");

/* Exports */
Package._define("rocketchat:channel-settings");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_channel-settings.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9mdW5jdGlvbnMvc2F2ZVJlYWN0V2hlblJlYWRPbmx5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tVG9waWMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tQ3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbUFubm91bmNlbWVudC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9mdW5jdGlvbnMvc2F2ZVJvb21OYW1lLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVJlYWRPbmx5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbURlc2NyaXB0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVN5c3RlbU1lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL21ldGhvZHMvc2F2ZVJvb21TZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9tb2RlbHMvTWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvbW9kZWxzL1Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL3N0YXJ0dXAuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsInNhdmVSZWFjdFdoZW5SZWFkT25seSIsInJpZCIsImFsbG93UmVhY3QiLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJNZXRlb3IiLCJFcnJvciIsImZ1bmN0aW9uIiwibW9kZWxzIiwiUm9vbXMiLCJzZXRBbGxvd1JlYWN0aW5nV2hlblJlYWRPbmx5QnlJZCIsInNhdmVSb29tVHlwZSIsInJvb21UeXBlIiwidXNlciIsInNlbmRNZXNzYWdlIiwidHlwZSIsInJvb20iLCJmaW5kT25lQnlJZCIsIl9pZCIsInQiLCJyZXN1bHQiLCJzZXRUeXBlQnlJZCIsIlN1YnNjcmlwdGlvbnMiLCJ1cGRhdGVUeXBlQnlSb29tSWQiLCJtZXNzYWdlIiwiVEFQaTE4biIsIl9fIiwibG5nIiwibGFuZ3VhZ2UiLCJzZXR0aW5ncyIsImdldCIsIk1lc3NhZ2VzIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJzIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzYXZlUm9vbVRvcGljIiwicm9vbVRvcGljIiwiZXNjYXBlSFRNTCIsInVwZGF0ZSIsInNldFRvcGljQnlJZCIsInNhdmVSb29tQ3VzdG9tRmllbGRzIiwicm9vbUN1c3RvbUZpZWxkcyIsIk9iamVjdCIsInJldCIsInNldEN1c3RvbUZpZWxkc0J5SWQiLCJ1cGRhdGVDdXN0b21GaWVsZHNCeVJvb21JZCIsInNhdmVSb29tQW5ub3VuY2VtZW50Iiwicm9vbUFubm91bmNlbWVudCIsImFubm91bmNlbWVudERldGFpbHMiLCJlc2NhcGVkTWVzc2FnZSIsInVwZGF0ZWQiLCJzZXRBbm5vdW5jZW1lbnRCeUlkIiwic2F2ZVJvb21OYW1lIiwiZGlzcGxheU5hbWUiLCJyb29tVHlwZXMiLCJwcmV2ZW50UmVuYW1pbmciLCJuYW1lIiwic2x1Z2lmaWVkUm9vbU5hbWUiLCJnZXRWYWxpZFJvb21OYW1lIiwic2V0TmFtZUJ5SWQiLCJ1cGRhdGVOYW1lQW5kQWxlcnRCeVJvb21JZCIsImNyZWF0ZVJvb21SZW5hbWVkV2l0aFJvb21JZFJvb21OYW1lQW5kVXNlciIsInNhdmVSb29tUmVhZE9ubHkiLCJyZWFkT25seSIsInNldFJlYWRPbmx5QnlJZCIsInNhdmVSb29tRGVzY3JpcHRpb24iLCJyb29tRGVzY3JpcHRpb24iLCJlc2NhcGVkUm9vbURlc2NyaXB0aW9uIiwic2V0RGVzY3JpcHRpb25CeUlkIiwic2F2ZVJvb21TeXN0ZW1NZXNzYWdlcyIsInN5c3RlbU1lc3NhZ2VzIiwic2V0U3lzdGVtTWVzc2FnZXNCeUlkIiwiZmllbGRzIiwibWV0aG9kcyIsInNhdmVSb29tU2V0dGluZ3MiLCJ2YWx1ZSIsInVzZXJJZCIsIm1ldGhvZCIsImtleXMiLCJldmVyeSIsImtleSIsImluY2x1ZGVzIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiYWN0aW9uIiwiYnJvYWRjYXN0IiwicmVhY3RXaGVuUmVhZE9ubHkiLCJmb3JFYWNoIiwic2V0dGluZyIsInRvcGljIiwiYW5ub3VuY2VtZW50IiwiY3VzdG9tRmllbGRzIiwiZGVzY3JpcHRpb24iLCJjaGVjayIsInRva2VucyIsInRva2VuIiwiYmFsYW5jZSIsInNhdmVSb29tVG9rZW5wYXNzIiwic2F2ZVN0cmVhbWluZ09wdGlvbnMiLCJybyIsInN5c01lcyIsInNldEpvaW5Db2RlQnlJZCIsInNhdmVEZWZhdWx0QnlJZCIsInJvb21JZCIsImV4dHJhRGF0YSIsImNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJyb29tTmFtZSIsInF1ZXJ5IiwiJHNldCIsIm11dGVkIiwiZmluZEJ5Um9vbUlkV2hlblVzZXJuYW1lRXhpc3RzIiwidSIsInB1c2giLCJ1c2VybmFtZSIsIiR1bnNldCIsImxlbmd0aCIsImFsbG93UmVhY3RpbmciLCJzdGFydHVwIiwiUGVybWlzc2lvbnMiLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJyb2xlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxxQkFBWCxHQUFtQyxVQUFTQyxHQUFULEVBQWNDLFVBQWQsRUFBMEI7QUFDNUQsTUFBSSxDQUFDQyxNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQUVDLGdCQUFVO0FBQVosS0FBakQsQ0FBTjtBQUNBOztBQUVELFNBQU9ULFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxnQ0FBeEIsQ0FBeURWLEdBQXpELEVBQThEQyxVQUE5RCxDQUFQO0FBQ0EsQ0FORCxDOzs7Ozs7Ozs7OztBQ0NBSCxXQUFXYSxZQUFYLEdBQTBCLFVBQVNYLEdBQVQsRUFBY1ksUUFBZCxFQUF3QkMsSUFBeEIsRUFBOEJDLGNBQWMsSUFBNUMsRUFBa0Q7QUFDM0UsTUFBSSxDQUFDWixNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQ3RELGtCQUFZO0FBRDBDLEtBQWpELENBQU47QUFHQTs7QUFDRCxNQUFJTSxhQUFhLEdBQWIsSUFBb0JBLGFBQWEsR0FBckMsRUFBMEM7QUFDekMs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Q0FBa0JrSCxXQUFsQixDQUE4QkMsTUFBOUIsQ0FBcUMsY0FBckMsRUFBcUQ7QUFBQ0Msa0JBQWM7QUFBRUMsYUFBTyxDQUFDLE9BQUQsRUFBVSxPQUFWO0FBQVQ7QUFBZixHQUFyRDtBQUNBL0gsYUFBV1UsTUFBWCxDQUFrQmtILFdBQWxCLENBQThCQyxNQUE5QixDQUFxQyx5QkFBckMsRUFBZ0U7QUFBQ0Msa0JBQWM7QUFBRUMsYUFBTyxDQUFDLE9BQUQsRUFBVSxPQUFWO0FBQVQ7QUFBZixHQUFoRTtBQUNBLENBSkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9jaGFubmVsLXNldHRpbmdzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zYXZlUmVhY3RXaGVuUmVhZE9ubHkgPSBmdW5jdGlvbihyaWQsIGFsbG93UmVhY3QpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IGZ1bmN0aW9uOiAnUm9ja2V0Q2hhdC5zYXZlUmVhY3RXaGVuUmVhZE9ubHknIH0pO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEFsbG93UmVhY3RpbmdXaGVuUmVhZE9ubHlCeUlkKHJpZCwgYWxsb3dSZWFjdCk7XG59O1xuIiwiXG5Sb2NrZXRDaGF0LnNhdmVSb29tVHlwZSA9IGZ1bmN0aW9uKHJpZCwgcm9vbVR5cGUsIHVzZXIsIHNlbmRNZXNzYWdlID0gdHJ1ZSkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVHlwZSdcblx0XHR9KTtcblx0fVxuXHRpZiAocm9vbVR5cGUgIT09ICdjJyAmJiByb29tVHlwZSAhPT0gJ3AnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tLXR5cGUnLCAnZXJyb3ItaW52YWxpZC1yb29tLXR5cGUnLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUnLFxuXHRcdFx0dHlwZTogcm9vbVR5cGVcblx0XHR9KTtcblx0fVxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdlcnJvci1pbnZhbGlkLXJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUnLFxuXHRcdFx0X2lkOiByaWRcblx0XHR9KTtcblx0fVxuXHRpZiAocm9vbS50ID09PSAnZCcpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1kaXJlY3Qtcm9vbScsICdDYW5cXCd0IGNoYW5nZSB0eXBlIG9mIGRpcmVjdCByb29tcycsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVHlwZSdcblx0XHR9KTtcblx0fVxuXHRjb25zdCByZXN1bHQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUeXBlQnlJZChyaWQsIHJvb21UeXBlKSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZVR5cGVCeVJvb21JZChyaWQsIHJvb21UeXBlKTtcblx0aWYgKHJlc3VsdCAmJiBzZW5kTWVzc2FnZSkge1xuXHRcdGxldCBtZXNzYWdlO1xuXHRcdGlmIChyb29tVHlwZSA9PT0gJ2MnKSB7XG5cdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnQ2hhbm5lbCcsIHtcblx0XHRcdFx0bG5nOiB1c2VyICYmIHVzZXIubGFuZ3VhZ2UgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJ1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdQcml2YXRlX0dyb3VwJywge1xuXHRcdFx0XHRsbmc6IHVzZXIgJiYgdXNlci5sYW5ndWFnZSB8fCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnbGFuZ3VhZ2UnKSB8fCAnZW4nXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9wcml2YWN5JywgcmlkLCBtZXNzYWdlLCB1c2VyKTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuUm9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljID0gZnVuY3Rpb24ocmlkLCByb29tVG9waWMsIHVzZXIsIHNlbmRNZXNzYWdlID0gdHJ1ZSkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMnXG5cdFx0fSk7XG5cdH1cblx0cm9vbVRvcGljID0gcy5lc2NhcGVIVE1MKHJvb21Ub3BpYyk7XG5cdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFRvcGljQnlJZChyaWQsIHJvb21Ub3BpYyk7XG5cdGlmICh1cGRhdGUgJiYgc2VuZE1lc3NhZ2UpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX3RvcGljJywgcmlkLCByb29tVG9waWMsIHVzZXIpO1xuXHR9XG5cdHJldHVybiB1cGRhdGU7XG59O1xuIiwiUm9ja2V0Q2hhdC5zYXZlUm9vbUN1c3RvbUZpZWxkcyA9IGZ1bmN0aW9uKHJpZCwgcm9vbUN1c3RvbUZpZWxkcykge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tQ3VzdG9tRmllbGRzJ1xuXHRcdH0pO1xuXHR9XG5cdGlmICghTWF0Y2gudGVzdChyb29tQ3VzdG9tRmllbGRzLCBPYmplY3QpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tQ3VzdG9tRmllbGRzLXR5cGUnLCAnSW52YWxpZCByb29tQ3VzdG9tRmllbGRzIHR5cGUnLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbUN1c3RvbUZpZWxkcydcblx0XHR9KTtcblx0fVxuXHRjb25zdCByZXQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRDdXN0b21GaWVsZHNCeUlkKHJpZCwgcm9vbUN1c3RvbUZpZWxkcyk7XG5cblx0Ly8gVXBkYXRlIGN1c3RvbUZpZWxkcyBvZiBhbnkgdXNlcidzIFN1YnNjcmlwdGlvbiByZWxhdGVkIHdpdGggdGhpcyByaWRcblx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVDdXN0b21GaWVsZHNCeVJvb21JZChyaWQsIHJvb21DdXN0b21GaWVsZHMpO1xuXG5cdHJldHVybiByZXQ7XG59O1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5Sb2NrZXRDaGF0LnNhdmVSb29tQW5ub3VuY2VtZW50ID0gZnVuY3Rpb24ocmlkLCByb29tQW5ub3VuY2VtZW50LCB1c2VyLCBzZW5kTWVzc2FnZT10cnVlKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBmdW5jdGlvbjogJ1JvY2tldENoYXQuc2F2ZVJvb21Bbm5vdW5jZW1lbnQnIH0pO1xuXHR9XG5cblx0bGV0IG1lc3NhZ2U7XG5cdGxldCBhbm5vdW5jZW1lbnREZXRhaWxzO1xuXHRpZiAodHlwZW9mIHJvb21Bbm5vdW5jZW1lbnQgPT09ICdzdHJpbmcnKSB7XG5cdFx0bWVzc2FnZSA9IHJvb21Bbm5vdW5jZW1lbnQ7XG5cdH0gZWxzZSB7XG5cdFx0KHttZXNzYWdlLCAuLi5hbm5vdW5jZW1lbnREZXRhaWxzfSA9IHJvb21Bbm5vdW5jZW1lbnQpO1xuXHR9XG5cblx0Y29uc3QgZXNjYXBlZE1lc3NhZ2UgPSBzLmVzY2FwZUhUTUwobWVzc2FnZSk7XG5cblx0Y29uc3QgdXBkYXRlZCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEFubm91bmNlbWVudEJ5SWQocmlkLCBlc2NhcGVkTWVzc2FnZSwgYW5ub3VuY2VtZW50RGV0YWlscyk7XG5cdGlmICh1cGRhdGVkICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9hbm5vdW5jZW1lbnQnLCByaWQsIGVzY2FwZWRNZXNzYWdlLCB1c2VyKTtcblx0fVxuXG5cdHJldHVybiB1cGRhdGVkO1xufTtcbiIsIlxuUm9ja2V0Q2hhdC5zYXZlUm9vbU5hbWUgPSBmdW5jdGlvbihyaWQsIGRpc3BsYXlOYW1lLCB1c2VyLCBzZW5kTWVzc2FnZSA9IHRydWUpIHtcblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cdGlmIChSb2NrZXRDaGF0LnJvb21UeXBlcy5yb29tVHlwZXNbcm9vbS50XS5wcmV2ZW50UmVuYW1pbmcoKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21kaXNwbGF5TmFtZSdcblx0XHR9KTtcblx0fVxuXHRpZiAoZGlzcGxheU5hbWUgPT09IHJvb20ubmFtZSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHNsdWdpZmllZFJvb21OYW1lID0gUm9ja2V0Q2hhdC5nZXRWYWxpZFJvb21OYW1lKGRpc3BsYXlOYW1lLCByaWQpO1xuXG5cdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldE5hbWVCeUlkKHJpZCwgc2x1Z2lmaWVkUm9vbU5hbWUsIGRpc3BsYXlOYW1lKSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU5hbWVBbmRBbGVydEJ5Um9vbUlkKHJpZCwgc2x1Z2lmaWVkUm9vbU5hbWUsIGRpc3BsYXlOYW1lKTtcblxuXHRpZiAodXBkYXRlICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyKHJpZCwgZGlzcGxheU5hbWUsIHVzZXIpO1xuXHR9XG5cdHJldHVybiBkaXNwbGF5TmFtZTtcbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVSb29tUmVhZE9ubHkgPSBmdW5jdGlvbihyaWQsIHJlYWRPbmx5KSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21SZWFkT25seSdcblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0UmVhZE9ubHlCeUlkKHJpZCwgcmVhZE9ubHkpO1xufTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuUm9ja2V0Q2hhdC5zYXZlUm9vbURlc2NyaXB0aW9uID0gZnVuY3Rpb24ocmlkLCByb29tRGVzY3JpcHRpb24sIHVzZXIpIHtcblxuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgZXNjYXBlZFJvb21EZXNjcmlwdGlvbiA9IHMuZXNjYXBlSFRNTChyb29tRGVzY3JpcHRpb24pO1xuXHRjb25zdCB1cGRhdGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXREZXNjcmlwdGlvbkJ5SWQocmlkLCBlc2NhcGVkUm9vbURlc2NyaXB0aW9uKTtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9kZXNjcmlwdGlvbicsIHJpZCwgZXNjYXBlZFJvb21EZXNjcmlwdGlvbiwgdXNlcik7XG5cdHJldHVybiB1cGRhdGU7XG59O1xuIiwiUm9ja2V0Q2hhdC5zYXZlUm9vbVN5c3RlbU1lc3NhZ2VzID0gZnVuY3Rpb24ocmlkLCBzeXN0ZW1NZXNzYWdlcykge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVSb29tU3lzdGVtTWVzc2FnZXMnXG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFN5c3RlbU1lc3NhZ2VzQnlJZChyaWQsIHN5c3RlbU1lc3NhZ2VzKTtcbn07XG4iLCJjb25zdCBmaWVsZHMgPSBbJ3Jvb21OYW1lJywgJ3Jvb21Ub3BpYycsICdyb29tQW5ub3VuY2VtZW50JywgJ3Jvb21DdXN0b21GaWVsZHMnLCAncm9vbURlc2NyaXB0aW9uJywgJ3Jvb21UeXBlJywgJ3JlYWRPbmx5JywgJ3JlYWN0V2hlblJlYWRPbmx5JywgJ3N5c3RlbU1lc3NhZ2VzJywgJ2RlZmF1bHQnLCAnam9pbkNvZGUnLCAndG9rZW5wYXNzJywgJ3N0cmVhbWluZ09wdGlvbnMnXTtcbk1ldGVvci5tZXRob2RzKHtcblx0c2F2ZVJvb21TZXR0aW5ncyhyaWQsIHNldHRpbmdzLCB2YWx1ZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbU5hbWUnXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2Ygc2V0dGluZ3MgIT09ICdvYmplY3QnKSB7XG5cdFx0XHRzZXR0aW5ncyA9IHtcblx0XHRcdFx0W3NldHRpbmdzXSA6IHZhbHVlXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghT2JqZWN0LmtleXMoc2V0dGluZ3MpLmV2ZXJ5KGtleSA9PiBmaWVsZHMuaW5jbHVkZXMoa2V5KSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc2V0dGluZ3MnLCAnSW52YWxpZCBzZXR0aW5ncyBwcm92aWRlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2VkaXQtcm9vbScsIHJpZCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdFZGl0aW5nIHJvb20gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnLFxuXHRcdFx0XHRhY3Rpb246ICdFZGl0aW5nX3Jvb20nXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblxuXHRcdGlmIChyb29tLmJyb2FkY2FzdCAmJiAoc2V0dGluZ3MucmVhZE9ubHkgfHwgc2V0dGluZ3MucmVhY3RXaGVuUmVhZE9ubHkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnRWRpdGluZyByZWFkT25seS9yZWFjdFdoZW5SZWFkT25seSBhcmUgbm90IGFsbG93ZWQgZm9yIGJyb2FkY2FzdCByb29tcycsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdGFjdGlvbjogJ0VkaXRpbmdfcm9vbSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0T2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goc2V0dGluZyA9PiB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IHNldHRpbmdzW3NldHRpbmddO1xuXHRcdFx0aWYgKHNldHRpbmdzID09PSAnZGVmYXVsdCcgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdWaWV3aW5nIHJvb20gYWRtaW5pc3RyYXRpb24gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdFx0YWN0aW9uOiAnVmlld2luZ19yb29tX2FkbWluaXN0cmF0aW9uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXR0aW5nID09PSAncm9vbVR5cGUnICYmIHZhbHVlICE9PSByb29tLnQgJiYgdmFsdWUgPT09ICdjJyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnY3JlYXRlLWMnKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQ2hhbmdpbmcgYSBwcml2YXRlIGdyb3VwIHRvIGEgcHVibGljIGNoYW5uZWwgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdFx0YWN0aW9uOiAnQ2hhbmdlX1Jvb21fVHlwZSdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2V0dGluZyA9PT0gJ3Jvb21UeXBlJyAmJiB2YWx1ZSAhPT0gcm9vbS50ICYmIHZhbHVlID09PSAncCcgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2NyZWF0ZS1wJykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0NoYW5naW5nIGEgcHVibGljIGNoYW5uZWwgdG8gYSBwcml2YXRlIHJvb20gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdFx0YWN0aW9uOiAnQ2hhbmdlX1Jvb21fVHlwZSdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRPYmplY3Qua2V5cyhzZXR0aW5ncykuZm9yRWFjaChzZXR0aW5nID0+IHtcblx0XHRcdGNvbnN0IHZhbHVlID0gc2V0dGluZ3Nbc2V0dGluZ107XG5cdFx0XHRzd2l0Y2ggKHNldHRpbmcpIHtcblx0XHRcdFx0Y2FzZSAncm9vbU5hbWUnOlxuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21OYW1lKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tVG9waWMnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS50b3BpYykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncm9vbUFubm91bmNlbWVudCc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLmFubm91bmNlbWVudCkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbUFubm91bmNlbWVudChyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Jvb21DdXN0b21GaWVsZHMnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5jdXN0b21GaWVsZHMpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21DdXN0b21GaWVsZHMocmlkLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tRGVzY3JpcHRpb24nOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5kZXNjcmlwdGlvbikge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbURlc2NyaXB0aW9uKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncm9vbVR5cGUnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS50KSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVHlwZShyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Rva2VucGFzcyc6XG5cdFx0XHRcdFx0Y2hlY2sodmFsdWUsIHtcblx0XHRcdFx0XHRcdHJlcXVpcmU6IFN0cmluZyxcblx0XHRcdFx0XHRcdHRva2VuczogW3tcblx0XHRcdFx0XHRcdFx0dG9rZW46IFN0cmluZyxcblx0XHRcdFx0XHRcdFx0YmFsYW5jZTogU3RyaW5nXG5cdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Ub2tlbnBhc3MocmlkLCB2YWx1ZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3N0cmVhbWluZ09wdGlvbnMnOlxuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVN0cmVhbWluZ09wdGlvbnMocmlkLCB2YWx1ZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3JlYWRPbmx5Jzpcblx0XHRcdFx0XHRpZiAodmFsdWUgIT09IHJvb20ucm8pIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21SZWFkT25seShyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3JlYWN0V2hlblJlYWRPbmx5Jzpcblx0XHRcdFx0XHRpZiAodmFsdWUgIT09IHJvb20ucmVhY3RXaGVuUmVhZE9ubHkpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJlYWN0V2hlblJlYWRPbmx5KHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnc3lzdGVtTWVzc2FnZXMnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5zeXNNZXMpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21TeXN0ZW1NZXNzYWdlcyhyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2pvaW5Db2RlJzpcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRKb2luQ29kZUJ5SWQocmlkLCBTdHJpbmcodmFsdWUpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnZGVmYXVsdCc6XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2F2ZURlZmF1bHRCeUlkKHJpZCwgdmFsdWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3VsdDogdHJ1ZSxcblx0XHRcdHJpZDogcm9vbS5faWRcblx0XHR9O1xuXHR9XG59KTtcbiIsIlJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyID0gZnVuY3Rpb24odHlwZSwgcm9vbUlkLCBtZXNzYWdlLCB1c2VyLCBleHRyYURhdGEpIHtcblx0cmV0dXJuIHRoaXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcih0eXBlLCByb29tSWQsIG1lc3NhZ2UsIHVzZXIsIGV4dHJhRGF0YSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIgPSBmdW5jdGlvbihyb29tSWQsIHJvb21OYW1lLCB1c2VyLCBleHRyYURhdGEpIHtcblx0cmV0dXJuIHRoaXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncicsIHJvb21JZCwgcm9vbU5hbWUsIHVzZXIsIGV4dHJhRGF0YSk7XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0RGVzY3JpcHRpb25CeUlkID0gZnVuY3Rpb24oX2lkLCBkZXNjcmlwdGlvbikge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGRlc2NyaXB0aW9uXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZWFkT25seUJ5SWQgPSBmdW5jdGlvbihfaWQsIHJlYWRPbmx5KSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0cm86IHJlYWRPbmx5LFxuXHRcdFx0bXV0ZWQ6IFtdXG5cdFx0fVxuXHR9O1xuXHRpZiAocmVhZE9ubHkpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRCeVJvb21JZFdoZW5Vc2VybmFtZUV4aXN0cyhfaWQsIHsgZmllbGRzOiB7ICd1Ll9pZCc6IDEsICd1LnVzZXJuYW1lJzogMSB9IH0pLmZvckVhY2goZnVuY3Rpb24oeyB1OiB1c2VyIH0pIHtcblx0XHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlci5faWQsICdwb3N0LXJlYWRvbmx5JykpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVwZGF0ZS4kc2V0Lm11dGVkLnB1c2godXNlci51c2VybmFtZSk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlLiR1bnNldCA9IHtcblx0XHRcdG11dGVkOiAnJ1xuXHRcdH07XG5cdH1cblxuXHRpZiAodXBkYXRlLiRzZXQubXV0ZWQubGVuZ3RoID09PSAwKSB7XG5cdFx0ZGVsZXRlIHVwZGF0ZS4kc2V0Lm11dGVkO1xuXHR9XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0QWxsb3dSZWFjdGluZ1doZW5SZWFkT25seUJ5SWQgPSBmdW5jdGlvbihfaWQsIGFsbG93UmVhY3RpbmcpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRyZWFjdFdoZW5SZWFkT25seTogYWxsb3dSZWFjdGluZ1xuXHRcdH1cblx0fTtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0U3lzdGVtTWVzc2FnZXNCeUlkID0gZnVuY3Rpb24oX2lkLCBzeXN0ZW1NZXNzYWdlcykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHN5c01lczogc3lzdGVtTWVzc2FnZXNcblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdwb3N0LXJlYWRvbmx5JywgeyRzZXRPbkluc2VydDogeyByb2xlczogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9IH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NldC1yZWFkb25seScsIHskc2V0T25JbnNlcnQ6IHsgcm9sZXM6IFsnYWRtaW4nLCAnb3duZXInXSB9IH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NldC1yZWFjdC13aGVuLXJlYWRvbmx5JywgeyRzZXRPbkluc2VydDogeyByb2xlczogWydhZG1pbicsICdvd25lciddIH19KTtcbn0pO1xuIl19
