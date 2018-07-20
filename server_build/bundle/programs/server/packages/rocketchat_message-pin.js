(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-pin":{"server":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-pin/server/settings.js                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.startup(function () {
  RocketChat.settings.add('Message_AllowPinning', true, {
    type: 'boolean',
    group: 'Message',
    'public': true
  });
  return RocketChat.models.Permissions.upsert('pin-message', {
    $setOnInsert: {
      roles: ['owner', 'moderator', 'admin']
    }
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pinMessage.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-pin/server/pinMessage.js                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
const recursiveRemove = (msg, deep = 1) => {
  if (!msg) {
    return;
  }

  if (deep > RocketChat.settings.get('Message_QuoteChainLimit')) {
    delete msg.attachments;
    return msg;
  }

  msg.attachments = Array.isArray(msg.attachments) ? msg.attachments.map(nestedMsg => recursiveRemove(nestedMsg, deep + 1)) : null;
  return msg;
};

const shouldAdd = (attachments, attachment) => !attachments.some(({
  message_link
}) => message_link && message_link === attachment.message_link);

Meteor.methods({
  pinMessage(message, pinnedAt) {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'pinMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowPinning')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
        method: 'pinMessage',
        action: 'Message_pinning'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), {
      fields: {
        _id: 1
      }
    });

    if (!subscription) {
      return false;
    }

    let originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (originalMessage == null || originalMessage._id == null) {
      throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
        method: 'pinMessage',
        action: 'Message_pinning'
      });
    } //If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
    }

    const me = RocketChat.models.Users.findOneById(userId);
    originalMessage.pinned = true;
    originalMessage.pinnedAt = pinnedAt || Date.now;
    originalMessage.pinnedBy = {
      _id: userId,
      username: me.username
    };
    originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
    RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
    const attachments = [];

    if (Array.isArray(originalMessage.attachments)) {
      originalMessage.attachments.forEach(attachment => {
        if (!attachment.message_link || shouldAdd(attachments, attachment)) {
          attachments.push(attachment);
        }
      });
    }
    /*
    		return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser(
    			'message_pinned',
    			originalMessage.rid,
    			'',
    			me,
    			{
    				attachments: [
    					{
    						text: originalMessage.msg,
    						author_name: originalMessage.u.username,
    						author_icon: getAvatarUrlFromUsername(
    							originalMessage.u.username
    						),
    						ts: originalMessage.ts,
    						attachments: recursiveRemove(attachments)
    					}
    				]
    			}
    		);*/


    return true;
    /*RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', originalMessage.rid, '', me, {
    attachments: [
    {
    'text': originalMessage.msg,
    'author_name': originalMessage.u.username,
    'author_icon': getAvatarUrlFromUsername(originalMessage.u.username),
    'ts': originalMessage.ts
    }
    ]
    });*/
  },

  unpinMessage(message) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unpinMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowPinning')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
        method: 'unpinMessage',
        action: 'Message_pinning'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), {
      fields: {
        _id: 1
      }
    });

    if (!subscription) {
      return false;
    }

    let originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (originalMessage == null || originalMessage._id == null) {
      throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
        method: 'unpinMessage',
        action: 'Message_pinning'
      });
    } //If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(originalMessage._id);
    }

    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    originalMessage.pinned = false;
    originalMessage.pinnedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
    return RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"pinnedMessages.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-pin/server/publications/pinnedMessages.js                                             //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.publish('pinnedMessages', function (rid, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (!user) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findPinnedByRoom(rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      return publication.added('rocketchat_pinned_message', _id, record);
    },

    changed(_id, record) {
      return publication.changed('rocketchat_pinned_message', _id, record);
    },

    removed(_id) {
      return publication.removed('rocketchat_pinned_message', _id);
    }

  });
  this.ready();
  return this.onStop(function () {
    return cursorHandle.stop();
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"indexes.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-pin/server/startup/indexes.js                                                         //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.startup(function () {
  return Meteor.defer(function () {
    return RocketChat.models.Messages.tryEnsureIndex({
      'pinnedBy._id': 1
    }, {
      sparse: 1
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-pin/server/settings.js");
require("/node_modules/meteor/rocketchat:message-pin/server/pinMessage.js");
require("/node_modules/meteor/rocketchat:message-pin/server/publications/pinnedMessages.js");
require("/node_modules/meteor/rocketchat:message-pin/server/startup/indexes.js");

/* Exports */
Package._define("rocketchat:message-pin");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-pin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXBpbi9zZXJ2ZXIvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1waW4vc2VydmVyL3Bpbk1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1waW4vc2VydmVyL3B1YmxpY2F0aW9ucy9waW5uZWRNZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXBpbi9zZXJ2ZXIvc3RhcnR1cC9pbmRleGVzLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGQiLCJ0eXBlIiwiZ3JvdXAiLCJtb2RlbHMiLCJQZXJtaXNzaW9ucyIsInVwc2VydCIsIiRzZXRPbkluc2VydCIsInJvbGVzIiwicmVjdXJzaXZlUmVtb3ZlIiwibXNnIiwiZGVlcCIsImdldCIsImF0dGFjaG1lbnRzIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwibmVzdGVkTXNnIiwic2hvdWxkQWRkIiwiYXR0YWNobWVudCIsInNvbWUiLCJtZXNzYWdlX2xpbmsiLCJtZXRob2RzIiwicGluTWVzc2FnZSIsIm1lc3NhZ2UiLCJwaW5uZWRBdCIsInVzZXJJZCIsIkVycm9yIiwibWV0aG9kIiwiYWN0aW9uIiwic3Vic2NyaXB0aW9uIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZCIsInJpZCIsImZpZWxkcyIsIl9pZCIsIm9yaWdpbmFsTWVzc2FnZSIsIk1lc3NhZ2VzIiwiZmluZE9uZUJ5SWQiLCJjbG9uZUFuZFNhdmVBc0hpc3RvcnlCeUlkIiwibWUiLCJVc2VycyIsInBpbm5lZCIsIkRhdGUiLCJub3ciLCJwaW5uZWRCeSIsInVzZXJuYW1lIiwiY2FsbGJhY2tzIiwicnVuIiwic2V0UGlubmVkQnlJZEFuZFVzZXJJZCIsImZvckVhY2giLCJwdXNoIiwidW5waW5NZXNzYWdlIiwicHVibGlzaCIsImxpbWl0IiwicmVhZHkiLCJwdWJsaWNhdGlvbiIsInVzZXIiLCJjdXJzb3JIYW5kbGUiLCJmaW5kUGlubmVkQnlSb29tIiwic29ydCIsInRzIiwib2JzZXJ2ZUNoYW5nZXMiLCJhZGRlZCIsInJlY29yZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwib25TdG9wIiwic3RvcCIsImRlZmVyIiwidHJ5RW5zdXJlSW5kZXgiLCJzcGFyc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isc0JBQXhCLEVBQWdELElBQWhELEVBQXNEO0FBQ3JEQyxVQUFNLFNBRCtDO0FBRXJEQyxXQUFPLFNBRjhDO0FBR3JELGNBQVU7QUFIMkMsR0FBdEQ7QUFLQSxTQUFPSixXQUFXSyxNQUFYLENBQWtCQyxXQUFsQixDQUE4QkMsTUFBOUIsQ0FBcUMsYUFBckMsRUFBb0Q7QUFDMURDLGtCQUFjO0FBQ2JDLGFBQU8sQ0FBQyxPQUFELEVBQVUsV0FBVixFQUF1QixPQUF2QjtBQURNO0FBRDRDLEdBQXBELENBQVA7QUFLQSxDQVhELEU7Ozs7Ozs7Ozs7O0FDQUEsTUFBTUMsa0JBQWtCLENBQUNDLEdBQUQsRUFBTUMsT0FBTyxDQUFiLEtBQW1CO0FBQzFDLE1BQUksQ0FBQ0QsR0FBTCxFQUFVO0FBQ1Q7QUFDQTs7QUFFRCxNQUFJQyxPQUFPWixXQUFXQyxRQUFYLENBQW9CWSxHQUFwQixDQUF3Qix5QkFBeEIsQ0FBWCxFQUErRDtBQUM5RCxXQUFPRixJQUFJRyxXQUFYO0FBQ0EsV0FBT0gsR0FBUDtBQUNBOztBQUVEQSxNQUFJRyxXQUFKLEdBQWtCQyxNQUFNQyxPQUFOLENBQWNMLElBQUlHLFdBQWxCLElBQWlDSCxJQUFJRyxXQUFKLENBQWdCRyxHQUFoQixDQUNsREMsYUFBYVIs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anMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01lc3NhZ2VfQWxsb3dQaW5uaW5nJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdCdwdWJsaWMnOiB0cnVlXG5cdH0pO1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdwaW4tbWVzc2FnZScsIHtcblx0XHQkc2V0T25JbnNlcnQ6IHtcblx0XHRcdHJvbGVzOiBbJ293bmVyJywgJ21vZGVyYXRvcicsICdhZG1pbiddXG5cdFx0fVxuXHR9KTtcbn0pO1xuIiwiY29uc3QgcmVjdXJzaXZlUmVtb3ZlID0gKG1zZywgZGVlcCA9IDEpID0+IHtcblx0aWYgKCFtc2cpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoZGVlcCA+IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX1F1b3RlQ2hhaW5MaW1pdCcpKSB7XG5cdFx0ZGVsZXRlIG1zZy5hdHRhY2htZW50cztcblx0XHRyZXR1cm4gbXNnO1xuXHR9XG5cblx0bXNnLmF0dGFjaG1lbnRzID0gQXJyYXkuaXNBcnJheShtc2cuYXR0YWNobWVudHMpID8gbXNnLmF0dGFjaG1lbnRzLm1hcChcblx0XHRuZXN0ZWRNc2cgPT4gcmVjdXJzaXZlUmVtb3ZlKG5lc3RlZE1zZywgZGVlcCArIDEpXG5cdCkgOiBudWxsO1xuXG5cdHJldHVybiBtc2c7XG59O1xuXG5jb25zdCBzaG91bGRBZGQgPSAoYXR0YWNobWVudHMsIGF0dGFjaG1lbnQpID0+ICFhdHRhY2htZW50cy5zb21lKCh7bWVzc2FnZV9saW5rfSkgPT4gbWVzc2FnZV9saW5rICYmIG1lc3NhZ2VfbGluayA9PT0gYXR0YWNobWVudC5tZXNzYWdlX2xpbmspO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdHBpbk1lc3NhZ2UobWVzc2FnZSwgcGlubmVkQXQpIHtcblx0XHRjb25zdCB1c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0aWYgKCF1c2VySWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3Bpbk1lc3NhZ2UnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93UGlubmluZycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTWVzc2FnZSBwaW5uaW5nIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdwaW5NZXNzYWdlJyxcblx0XHRcdFx0YWN0aW9uOiAnTWVzc2FnZV9waW5uaW5nJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQobWVzc2FnZS5yaWQsIE1ldGVvci51c2VySWQoKSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0aWYgKCFzdWJzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRsZXQgb3JpZ2luYWxNZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobWVzc2FnZS5faWQpO1xuXHRcdGlmIChvcmlnaW5hbE1lc3NhZ2UgPT0gbnVsbCB8fCBvcmlnaW5hbE1lc3NhZ2UuX2lkID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtbWVzc2FnZScsICdNZXNzYWdlIHlvdSBhcmUgcGlubmluZyB3YXMgbm90IGZvdW5kJywge1xuXHRcdFx0XHRtZXRob2Q6ICdwaW5NZXNzYWdlJyxcblx0XHRcdFx0YWN0aW9uOiAnTWVzc2FnZV9waW5uaW5nJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly9JZiB3ZSBrZWVwIGhpc3Rvcnkgb2YgZWRpdHMsIGluc2VydCBhIG5ldyBtZXNzYWdlIHRvIHN0b3JlIGhpc3RvcnkgaW5mb3JtYXRpb25cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01lc3NhZ2VfS2VlcEhpc3RvcnknKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY2xvbmVBbmRTYXZlQXNIaXN0b3J5QnlJZChtZXNzYWdlLl9pZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXG5cdFx0b3JpZ2luYWxNZXNzYWdlLnBpbm5lZCA9IHRydWU7XG5cdFx0b3JpZ2luYWxNZXNzYWdlLnBpbm5lZEF0ID0gcGlubmVkQXQgfHwgRGF0ZS5ub3c7XG5cdFx0b3JpZ2luYWxNZXNzYWdlLnBpbm5lZEJ5ID0ge1xuXHRcdFx0X2lkOiB1c2VySWQsXG5cdFx0XHR1c2VybmFtZTogbWUudXNlcm5hbWVcblx0XHR9O1xuXG5cdFx0b3JpZ2luYWxNZXNzYWdlID0gUm9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdiZWZvcmVTYXZlTWVzc2FnZScsIG9yaWdpbmFsTWVzc2FnZSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRQaW5uZWRCeUlkQW5kVXNlcklkKG9yaWdpbmFsTWVzc2FnZS5faWQsIG9yaWdpbmFsTWVzc2FnZS5waW5uZWRCeSwgb3JpZ2luYWxNZXNzYWdlLnBpbm5lZCk7XG5cblx0XHRjb25zdCBhdHRhY2htZW50cyA9IFtdO1xuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkob3JpZ2luYWxNZXNzYWdlLmF0dGFjaG1lbnRzKSkge1xuXHRcdFx0b3JpZ2luYWxNZXNzYWdlLmF0dGFjaG1lbnRzLmZvckVhY2goYXR0YWNobWVudCA9PiB7XG5cdFx0XHRcdGlmICghYXR0YWNobWVudC5tZXNzYWdlX2xpbmsgfHwgc2hvdWxkQWRkKGF0dGFjaG1lbnRzLCBhdHRhY2htZW50KSkge1xuXHRcdFx0XHRcdGF0dGFjaG1lbnRzLnB1c2goYXR0YWNobWVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cbi8qXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoXG5cdFx0XHQnbWVzc2FnZV9waW5uZWQnLFxuXHRcdFx0b3JpZ2luYWxNZXNzYWdlLnJpZCxcblx0XHRcdCcnLFxuXHRcdFx0bWUsXG5cdFx0XHR7XG5cdFx0XHRcdGF0dGFjaG1lbnRzOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGV4dDogb3JpZ2luYWxNZXNzYWdlLm1zZyxcblx0XHRcdFx0XHRcdGF1dGhvcl9uYW1lOiBvcmlnaW5hbE1lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0XHRcdGF1dGhvcl9pY29uOiBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUoXG5cdFx0XHRcdFx0XHRcdG9yaWdpbmFsTWVzc2FnZS51LnVzZXJuYW1lXG5cdFx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdFx0dHM6IG9yaWdpbmFsTWVzc2FnZS50cyxcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnRzOiByZWN1cnNpdmVSZW1vdmUoYXR0YWNobWVudHMpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdXG5cdFx0XHR9XG5cdFx0KTsqL1xuXHRcdHJldHVybiB0cnVlOyAvKlJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ21lc3NhZ2VfcGlubmVkJywgb3JpZ2luYWxNZXNzYWdlLnJpZCwgJycsIG1lLCB7XG5cdFx0XHRhdHRhY2htZW50czogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0J3RleHQnOiBvcmlnaW5hbE1lc3NhZ2UubXNnLFxuXHRcdFx0XHRcdCdhdXRob3JfbmFtZSc6IG9yaWdpbmFsTWVzc2FnZS51LnVzZXJuYW1lLFxuXHRcdFx0XHRcdCdhdXRob3JfaWNvbic6IGdldEF2YXRhclVybEZyb21Vc2VybmFtZShvcmlnaW5hbE1lc3NhZ2UudS51c2VybmFtZSksXG5cdFx0XHRcdFx0J3RzJzogb3JpZ2luYWxNZXNzYWdlLnRzXG5cdFx0XHRcdH1cblx0XHRcdF1cblx0XHR9KTsqL1xuXHR9LFxuXHR1bnBpbk1lc3NhZ2UobWVzc2FnZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRtZXRob2Q6ICd1bnBpbk1lc3NhZ2UnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93UGlubmluZycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTWVzc2FnZSBwaW5uaW5nIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICd1bnBpbk1lc3NhZ2UnLFxuXHRcdFx0XHRhY3Rpb246ICdNZXNzYWdlX3Bpbm5pbmcnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChtZXNzYWdlLnJpZCwgTWV0ZW9yLnVzZXJJZCgpLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblx0XHRpZiAoIXN1YnNjcmlwdGlvbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGxldCBvcmlnaW5hbE1lc3NhZ2UgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChtZXNzYWdlLl9pZCk7XG5cblx0XHRpZiAob3JpZ2luYWxNZXNzYWdlID09IG51bGwgfHwgb3JpZ2luYWxNZXNzYWdlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLW1lc3NhZ2UnLCAnTWVzc2FnZSB5b3UgYXJlIHVucGlubmluZyB3YXMgbm90IGZvdW5kJywge1xuXHRcdFx0XHRtZXRob2Q6ICd1bnBpbk1lc3NhZ2UnLFxuXHRcdFx0XHRhY3Rpb246ICdNZXNzYWdlX3Bpbm5pbmcnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvL0lmIHdlIGtlZXAgaGlzdG9yeSBvZiBlZGl0cywgaW5zZXJ0IGEgbmV3IG1lc3NhZ2UgdG8gc3RvcmUgaGlzdG9yeSBpbmZvcm1hdGlvblxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9LZWVwSGlzdG9yeScpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jbG9uZUFuZFNhdmVBc0hpc3RvcnlCeUlkKG9yaWdpbmFsTWVzc2FnZS5faWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoTWV0ZW9yLnVzZXJJZCgpKTtcblx0XHRvcmlnaW5hbE1lc3NhZ2UucGlubmVkID0gZmFsc2U7XG5cdFx0b3JpZ2luYWxNZXNzYWdlLnBpbm5lZEJ5ID0ge1xuXHRcdFx0X2lkOiBNZXRlb3IudXNlcklkKCksXG5cdFx0XHR1c2VybmFtZTogbWUudXNlcm5hbWVcblx0XHR9O1xuXHRcdG9yaWdpbmFsTWVzc2FnZSA9IFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignYmVmb3JlU2F2ZU1lc3NhZ2UnLCBvcmlnaW5hbE1lc3NhZ2UpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFBpbm5lZEJ5SWRBbmRVc2VySWQob3JpZ2luYWxNZXNzYWdlLl9pZCwgb3JpZ2luYWxNZXNzYWdlLnBpbm5lZEJ5LCBvcmlnaW5hbE1lc3NhZ2UucGlubmVkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IucHVibGlzaCgncGlubmVkTWVzc2FnZXMnLCBmdW5jdGlvbihyaWQsIGxpbWl0ID0gNTApIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0Y29uc3QgcHVibGljYXRpb24gPSB0aGlzO1xuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cdGlmICghdXNlcikge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0Y29uc3QgY3Vyc29ySGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZFBpbm5lZEJ5Um9vbShyaWQsIHsgc29ydDogeyB0czogLTEgfSwgbGltaXQgfSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24uYWRkZWQoJ3JvY2tldGNoYXRfcGlubmVkX21lc3NhZ2UnLCBfaWQsIHJlY29yZCk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24uY2hhbmdlZCgncm9ja2V0Y2hhdF9waW5uZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoX2lkKSB7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24ucmVtb3ZlZCgncm9ja2V0Y2hhdF9waW5uZWRfbWVzc2FnZScsIF9pZCk7XG5cdFx0fVxuXHR9KTtcblx0dGhpcy5yZWFkeSgpO1xuXHRyZXR1cm4gdGhpcy5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGN1cnNvckhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0cmV0dXJuIE1ldGVvci5kZWZlcihmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMudHJ5RW5zdXJlSW5kZXgoe1xuXHRcdFx0J3Bpbm5lZEJ5Ll9pZCc6IDFcblx0XHR9LCB7XG5cdFx0XHRzcGFyc2U6IDFcblx0XHR9KTtcblx0fSk7XG59KTtcbiJdfQ==
