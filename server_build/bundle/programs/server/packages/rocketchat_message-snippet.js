(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var Random = Package.random.Random;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-snippet":{"server":{"startup":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/startup/settings.js                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.startup(function () {
  RocketChat.settings.add('Message_AllowSnippeting', false, {
    type: 'boolean',
    public: true,
    group: 'Message'
  });
  RocketChat.models.Permissions.upsert('snippet-message', {
    $setOnInsert: {
      roles: ['owner', 'moderator', 'admin']
    }
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"snippetMessage.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/methods/snippetMessage.js                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({
  snippetMessage(message, filename) {
    if (Meteor.userId() == null) {
      //noinspection JSUnresolvedFunction
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'snippetMessage'
      });
    }

    const room = RocketChat.models.Rooms.findOne({
      _id: message.rid
    });

    if (typeof room === 'undefined' || room === null) {
      return false;
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, Meteor.userId(), {
      fields: {
        _id: 1
      }
    });

    if (!subscription) {
      return false;
    } // If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
    }

    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    message.snippeted = true;
    message.snippetedAt = Date.now;
    message.snippetedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    message = RocketChat.callbacks.run('beforeSaveMessage', message); // Create the SnippetMessage

    RocketChat.models.Messages.setSnippetedByIdAndUserId(message, filename, message.snippetedBy, message.snippeted, Date.now, filename);
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_snippeted', message.rid, '', me, {
      'snippetId': message._id,
      'snippetName': filename
    });
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"requests.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/requests.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* global Cookies */
WebApp.connectHandlers.use('/snippet/download', function (req, res) {
  let rawCookies;
  let token;
  let uid;
  const cookie = new Cookies();

  if (req.headers && req.headers.cookie !== null) {
    rawCookies = req.headers.cookie;
  }

  if (rawCookies !== null) {
    uid = cookie.get('rc_uid', rawCookies);
  }

  if (rawCookies !== null) {
    token = cookie.get('rc_token', rawCookies);
  }

  if (uid === null) {
    uid = req.query.rc_uid;
    token = req.query.rc_token;
  }

  const user = RocketChat.models.Users.findOneByIdAndLoginToken(uid, token);

  if (!(uid && token && user)) {
    res.writeHead(403);
    res.end();
    return false;
  }

  const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

  if (match[1]) {
    const snippet = RocketChat.models.Messages.findOne({
      '_id': match[1],
      'snippeted': true
    });
    const room = RocketChat.models.Rooms.findOne({
      '_id': snippet.rid,
      'usernames': {
        '$in': [user.username]
      }
    });

    if (room === undefined) {
      res.writeHead(403);
      res.end();
      return false;
    }

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(snippet.snippetName)}`);
    res.setHeader('Content-Type', 'application/octet-stream'); // Removing the ``` contained in the msg.

    const snippetContent = snippet.msg.substr(3, snippet.msg.length - 6);
    res.setHeader('Content-Length', snippetContent.length);
    res.write(snippetContent);
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
  return;
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"snippetedMessagesByRoom.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/publications/snippetedMessagesByRoom.js                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.publish('snippetedMessages', function (rid, limit = 50) {
  if (typeof this.userId === 'undefined' || this.userId === null) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (typeof user === 'undefined' || user === null) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findSnippetedByRoom(rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      publication.added('rocketchat_snippeted_message', _id, record);
    },

    changed(_id, record) {
      publication.changed('rocketchat_snippeted_message', _id, record);
    },

    removed(_id) {
      publication.removed('rocketchat_snippeted_message', _id);
    }

  });
  this.ready();

  this.onStop = function () {
    cursorHandle.stop();
  };
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"snippetedMessage.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/publications/snippetedMessage.js                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.publish('snippetedMessage', function (_id) {
  if (typeof this.userId === 'undefined' || this.userId === null) {
    return this.ready();
  }

  const snippet = RocketChat.models.Messages.findOne({
    _id,
    snippeted: true
  });
  const user = RocketChat.models.Users.findOneById(this.userId);
  const roomSnippetQuery = {
    '_id': snippet.rid,
    'usernames': {
      '$in': [user.username]
    }
  };

  if (RocketChat.models.Rooms.findOne(roomSnippetQuery) === undefined) {
    return this.ready();
  }

  const publication = this;

  if (typeof user === 'undefined' || user === null) {
    return this.ready();
  }

  const cursor = RocketChat.models.Messages.find({
    _id
  }).observeChanges({
    added(_id, record) {
      publication.added('rocketchat_snippeted_message', _id, record);
    },

    changed(_id, record) {
      publication.changed('rocketchat_snippeted_message', _id, record);
    },

    removed(_id) {
      publication.removed('rocketchat_snippeted_message', _id);
    }

  });
  this.ready();

  this.onStop = function () {
    cursor.stop();
  };
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-snippet/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/methods/snippetMessage.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/requests.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/publications/snippetedMessagesByRoom.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/publications/snippetedMessage.js");

/* Exports */
Package._define("rocketchat:message-snippet");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-snippet.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXNuaXBwZXQvc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zbmlwcGV0L3NlcnZlci9tZXRob2RzL3NuaXBwZXRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1lc3NhZ2Utc25pcHBldC9zZXJ2ZXIvcmVxdWVzdHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zbmlwcGV0L3NlcnZlci9wdWJsaWNhdGlvbnMvc25pcHBldGVkTWVzc2FnZXNCeVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zbmlwcGV0L3NlcnZlci9wdWJsaWNhdGlvbnMvc25pcHBldGVkTWVzc2FnZS5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiYWRkIiwidHlwZSIsInB1YmxpYyIsImdyb3VwIiwibW9kZWxzIiwiUGVybWlzc2lvbnMiLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJyb2xlcyIsIm1ldGhvZHMiLCJzbmlwcGV0TWVzc2FnZSIsIm1lc3NhZ2UiLCJmaWxlbmFtZSIsInVzZXJJZCIsIkVycm9yIiwibWV0aG9kIiwicm9vbSIsIlJvb21zIiwiZmluZE9uZSIsIl9pZCIsInJpZCIsInN1YnNjcmlwdGlvbiIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJmaWVsZHMiLCJnZXQiLCJNZXNzYWdlcyIsImNsb25lQW5kU2F2ZUFzSGlzdG9yeUJ5SWQiLCJtZSIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJzbmlwcGV0ZWQiLCJzbmlwcGV0ZWRBdCIsIkRhdGUiLCJub3ciLCJzbmlwcGV0ZWRCeSIsInVzZXJuYW1lIiwiY2FsbGJhY2tzIiwicnVuIiwic2V0U25pcHBldGVkQnlJZEFuZFVzZXJJZCIsImNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJyZXEiLCJyZXMiLCJyYXdDb29raWVzIiwidG9rZW4iLCJ1aWQiLCJjb29raWUiLCJDb29raWVzIiwiaGVhZGVycyIsInF1ZXJ5IiwicmNfdWlkIiwicmNfdG9rZW4iLCJ1c2VyIiwiZmluZE9uZUJ5SWRBbmRMb2dpblRva2VuIiwid3JpdGVIZWFkIiwiZW5kIiwibWF0Y2giLCJleGVjIiwidXJsIiwic25pcHBldCIsInVuZGVmaW5lZCIsInNldEhlYWRlciIsImVuY29kZVVSSUNvbXBvbmVudCIsInNuaXBwZXROYW1lIiwic25pcHBldENvbnRlbnQiLCJtc2ciLCJzdWJzdHIiLCJsZW5ndGgiLCJ3cml0ZSIsInB1Ymxpc2giLCJsaW1pdCIsInJlYWR5IiwicHVibGljYXRpb24iLCJjdXJzb3JIYW5kbGUiLCJmaW5kU25pcHBldGVkQnlSb29tIiwic29ydCIsInRzIiwib2JzZXJ2ZUNoYW5nZXMiLCJhZGRlZCIsInJlY29yZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwib25TdG9wIiwic3RvcCIsInJvb21TbmlwcGV0UXVlcnkiLCJjdXJzb3IiLCJmaW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCQyxhQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix5QkFBeEIsRUFBbUQsS0FBbkQsRUFBMEQ7QUFDekRDLFVBQU0sU0FEbUQ7QUFFekRDLFlBQVEsSUFGaUQ7QUFHekRDLFdBQU87QUFIa0QsR0FBMUQ7QUFLQUwsYUFBV00sTUFBWCxDQUFrQkMsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDLGlCQUFyQyxFQUF3RDtBQUN2REMsa0JBQWM7QUFDYkMsYUFBTyxDQUFD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QUF4QixDQUFnQ3FFLGdCQUFoQyxNQUFzRHhCLFNBQTFELEVBQXFFO0FBQ3BFLFdBQU8sS0FBS1csS0FBTCxFQUFQO0FBQ0E7O0FBRUQsUUFBTUMsY0FBYyxJQUFwQjs7QUFHQSxNQUFJLE9BQU9wQixJQUFQLEtBQWdCLFdBQWhCLElBQStCQSxTQUFTLElBQTVDLEVBQWtEO0FBQ2pELFdBQU8sS0FBS21CLEtBQUwsRUFBUDtBQUNBOztBQUVELFFBQU1jLFNBQVMxRixXQUFXTSxNQUFYLENBQWtCc0IsUUFBbEIsQ0FBMkIrRCxJQUEzQixDQUNkO0FBQUV0RTtBQUFGLEdBRGMsRUFFYjZELGNBRmEsQ0FFRTtBQUNoQkMsVUFBTTlELEdBQU4sRUFBVytELE1BQVgsRUFBbUI7QUFDbEJQLGtCQUFZTSxLQUFaLENBQWtCLDhCQUFsQixFQUFrRDlELEdBQWxELEVBQXVEK0QsTUFBdkQ7QUFDQSxLQUhlOztBQUloQkMsWUFBUWhFLEdBQVIsRUFBYStELE1BQWIsRUFBcUI7QUFDcEJQLGtCQUFZUSxPQUFaLENBQW9CLDhCQUFwQixFQUFvRGhFLEdBQXBELEVBQXlEK0QsTUFBekQ7QUFDQSxLQU5lOztBQU9oQkUsWUFBUWpFLEdBQVIsRUFBYTtBQUNad0Qsa0JBQVlTLE9BQVosQ0FBb0IsOEJBQXBCLEVBQW9EakUsR0FBcEQ7QUFDQTs7QUFUZSxHQUZGLENBQWY7QUFjQSxPQUFLdUQsS0FBTDs7QUFFQSxPQUFLVyxNQUFMLEdBQWMsWUFBVztBQUN4QkcsV0FBT0YsSUFBUDtBQUNBLEdBRkQ7QUFHQSxDQTlDRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21lc3NhZ2Utc25pcHBldC5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWVzc2FnZV9BbGxvd1NuaXBwZXRpbmcnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdzbmlwcGV0LW1lc3NhZ2UnLCB7XG5cdFx0JHNldE9uSW5zZXJ0OiB7XG5cdFx0XHRyb2xlczogWydvd25lcicsICdtb2RlcmF0b3InLCAnYWRtaW4nXVxuXHRcdH1cblx0fSk7XG59KTtcblxuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRzbmlwcGV0TWVzc2FnZShtZXNzYWdlLCBmaWxlbmFtZSkge1xuXHRcdGlmIChNZXRlb3IudXNlcklkKCkgPT0gbnVsbCkge1xuXHRcdFx0Ly9ub2luc3BlY3Rpb24gSlNVbnJlc29sdmVkRnVuY3Rpb25cblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLFxuXHRcdFx0XHR7bWV0aG9kOiAnc25pcHBldE1lc3NhZ2UnfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUoeyBfaWQ6IG1lc3NhZ2UucmlkIH0pO1xuXG5cdFx0aWYgKCh0eXBlb2Ygcm9vbSA9PT0gJ3VuZGVmaW5lZCcpIHx8IChyb29tID09PSBudWxsKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKG1lc3NhZ2UucmlkLCBNZXRlb3IudXNlcklkKCksIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgd2Uga2VlcCBoaXN0b3J5IG9mIGVkaXRzLCBpbnNlcnQgYSBuZXcgbWVzc2FnZSB0byBzdG9yZSBoaXN0b3J5IGluZm9ybWF0aW9uXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0tlZXBIaXN0b3J5JykpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNsb25lQW5kU2F2ZUFzSGlzdG9yeUJ5SWQobWVzc2FnZS5faWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoTWV0ZW9yLnVzZXJJZCgpKTtcblxuXHRcdG1lc3NhZ2Uuc25pcHBldGVkID0gdHJ1ZTtcblx0XHRtZXNzYWdlLnNuaXBwZXRlZEF0ID0gRGF0ZS5ub3c7XG5cdFx0bWVzc2FnZS5zbmlwcGV0ZWRCeSA9IHtcblx0XHRcdF9pZDogTWV0ZW9yLnVzZXJJZCgpLFxuXHRcdFx0dXNlcm5hbWU6IG1lLnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdG1lc3NhZ2UgPSBSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2JlZm9yZVNhdmVNZXNzYWdlJywgbWVzc2FnZSk7XG5cblx0XHQvLyBDcmVhdGUgdGhlIFNuaXBwZXRNZXNzYWdlXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0U25pcHBldGVkQnlJZEFuZFVzZXJJZChtZXNzYWdlLCBmaWxlbmFtZSwgbWVzc2FnZS5zbmlwcGV0ZWRCeSxcblx0XHRcdG1lc3NhZ2Uuc25pcHBldGVkLCBEYXRlLm5vdywgZmlsZW5hbWUpO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcihcblx0XHRcdCdtZXNzYWdlX3NuaXBwZXRlZCcsIG1lc3NhZ2UucmlkLCAnJywgbWUsIHtcdCdzbmlwcGV0SWQnOiBtZXNzYWdlLl9pZCwgJ3NuaXBwZXROYW1lJzogZmlsZW5hbWUgfSk7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFsIENvb2tpZXMgKi9cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKCcvc25pcHBldC9kb3dubG9hZCcsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG5cdGxldCByYXdDb29raWVzO1xuXHRsZXQgdG9rZW47XG5cdGxldCB1aWQ7XG5cdGNvbnN0IGNvb2tpZSA9IG5ldyBDb29raWVzKCk7XG5cblx0aWYgKHJlcS5oZWFkZXJzICYmIHJlcS5oZWFkZXJzLmNvb2tpZSAhPT0gbnVsbCkge1xuXHRcdHJhd0Nvb2tpZXMgPSByZXEuaGVhZGVycy5jb29raWU7XG5cdH1cblxuXHRpZiAocmF3Q29va2llcyAhPT0gbnVsbCkge1xuXHRcdHVpZCA9IGNvb2tpZS5nZXQoJ3JjX3VpZCcsIHJhd0Nvb2tpZXMpO1xuXHR9XG5cblx0aWYgKHJhd0Nvb2tpZXMgIT09IG51bGwpIHtcblx0XHR0b2tlbiA9IGNvb2tpZS5nZXQoJ3JjX3Rva2VuJywgcmF3Q29va2llcyk7XG5cdH1cblxuXHRpZiAodWlkID09PSBudWxsKSB7XG5cdFx0dWlkID0gcmVxLnF1ZXJ5LnJjX3VpZDtcblx0XHR0b2tlbiA9IHJlcS5xdWVyeS5yY190b2tlbjtcblx0fVxuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZEFuZExvZ2luVG9rZW4odWlkLCB0b2tlbik7XG5cblx0aWYgKCEodWlkICYmIHRva2VuICYmIHVzZXIpKSB7XG5cdFx0cmVzLndyaXRlSGVhZCg0MDMpO1xuXHRcdHJlcy5lbmQoKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0Y29uc3QgbWF0Y2ggPSAvXlxcLyhbXlxcL10rKVxcLyguKikvLmV4ZWMocmVxLnVybCk7XG5cblx0aWYgKG1hdGNoWzFdKSB7XG5cdFx0Y29uc3Qgc25pcHBldCA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmUoXG5cdFx0XHR7XG5cdFx0XHRcdCdfaWQnOiBtYXRjaFsxXSxcblx0XHRcdFx0J3NuaXBwZXRlZCc6IHRydWVcblx0XHRcdH1cblx0XHQpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHsgJ19pZCc6IHNuaXBwZXQucmlkLCAndXNlcm5hbWVzJzogeyAnJGluJzogW3VzZXIudXNlcm5hbWVdIH19KTtcblx0XHRpZiAocm9vbSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZSo9VVRGLTgnJyR7IGVuY29kZVVSSUNvbXBvbmVudChzbmlwcGV0LnNuaXBwZXROYW1lKSB9YCk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScpO1xuXG5cdFx0Ly8gUmVtb3ZpbmcgdGhlIGBgYCBjb250YWluZWQgaW4gdGhlIG1zZy5cblx0XHRjb25zdCBzbmlwcGV0Q29udGVudCA9IHNuaXBwZXQubXNnLnN1YnN0cigzLCBzbmlwcGV0Lm1zZy5sZW5ndGggLSA2KTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIHNuaXBwZXRDb250ZW50Lmxlbmd0aCk7XG5cdFx0cmVzLndyaXRlKHNuaXBwZXRDb250ZW50KTtcblx0XHRyZXMuZW5kKCk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRyZXMuZW5kKCk7XG5cdHJldHVybjtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ3NuaXBwZXRlZE1lc3NhZ2VzJywgZnVuY3Rpb24ocmlkLCBsaW1pdD01MCkge1xuXHRpZiAodHlwZW9mIHRoaXMudXNlcklkID09PSAndW5kZWZpbmVkJyB8fCB0aGlzLnVzZXJJZCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRjb25zdCBwdWJsaWNhdGlvbiA9IHRoaXM7XG5cblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblxuXHRpZiAodHlwZW9mIHVzZXIgPT09ICd1bmRlZmluZWQnIHx8IHVzZXIgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0Y29uc3QgY3Vyc29ySGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZFNuaXBwZXRlZEJ5Um9vbShcblx0XHRyaWQsXG5cdFx0e1xuXHRcdFx0c29ydDoge3RzOiAtMX0sXG5cdFx0XHRsaW1pdFxuXHRcdH1cblx0KS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoX2lkLCByZWNvcmQpIHtcblx0XHRcdHB1YmxpY2F0aW9uLmFkZGVkKCdyb2NrZXRjaGF0X3NuaXBwZXRlZF9tZXNzYWdlJywgX2lkLCByZWNvcmQpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChfaWQsIHJlY29yZCkge1xuXHRcdFx0cHVibGljYXRpb24uY2hhbmdlZCgncm9ja2V0Y2hhdF9zbmlwcGV0ZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoX2lkKSB7XG5cdFx0XHRwdWJsaWNhdGlvbi5yZW1vdmVkKCdyb2NrZXRjaGF0X3NuaXBwZXRlZF9tZXNzYWdlJywgX2lkKTtcblx0XHR9XG5cdH0pO1xuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRjdXJzb3JIYW5kbGUuc3RvcCgpO1xuXHR9O1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnc25pcHBldGVkTWVzc2FnZScsIGZ1bmN0aW9uKF9pZCkge1xuXHRpZiAodHlwZW9mIHRoaXMudXNlcklkID09PSAndW5kZWZpbmVkJyB8fCB0aGlzLnVzZXJJZCA9PT0gbnVsbCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRjb25zdCBzbmlwcGV0ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZSh7X2lkLCBzbmlwcGV0ZWQ6IHRydWV9KTtcblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblx0Y29uc3Qgcm9vbVNuaXBwZXRRdWVyeSA9IHtcblx0XHQnX2lkJzogc25pcHBldC5yaWQsXG5cdFx0J3VzZXJuYW1lcyc6IHtcblx0XHRcdCckaW4nOiBbXG5cdFx0XHRcdHVzZXIudXNlcm5hbWVcblx0XHRcdF1cblx0XHR9XG5cdH07XG5cblx0aWYgKFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUocm9vbVNuaXBwZXRRdWVyeSkgPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRjb25zdCBwdWJsaWNhdGlvbiA9IHRoaXM7XG5cblxuXHRpZiAodHlwZW9mIHVzZXIgPT09ICd1bmRlZmluZWQnIHx8IHVzZXIgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChcblx0XHR7IF9pZCB9XG5cdCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRwdWJsaWNhdGlvbi5hZGRlZCgncm9ja2V0Y2hhdF9zbmlwcGV0ZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoX2lkLCByZWNvcmQpIHtcblx0XHRcdHB1YmxpY2F0aW9uLmNoYW5nZWQoJ3JvY2tldGNoYXRfc25pcHBldGVkX21lc3NhZ2UnLCBfaWQsIHJlY29yZCk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKF9pZCkge1xuXHRcdFx0cHVibGljYXRpb24ucmVtb3ZlZCgncm9ja2V0Y2hhdF9zbmlwcGV0ZWRfbWVzc2FnZScsIF9pZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRjdXJzb3Iuc3RvcCgpO1xuXHR9O1xufSk7XG4iXX0=
