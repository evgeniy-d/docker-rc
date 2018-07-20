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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:mentions-flextab":{"server":{"publications":{"mentionedMessages.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/rocketchat_mentions-flextab/server/publications/mentionedMessages.js                      //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
Meteor.publish('mentionedMessages', function (rid, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (!user) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findVisibleByMentionAndRoomId(user.username, rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      record.mentionedList = true;
      return publication.added('rocketchat_mentioned_message', _id, record);
    },

    changed(_id, record) {
      record.mentionedList = true;
      return publication.changed('rocketchat_mentioned_message', _id, record);
    },

    removed(_id) {
      return publication.removed('rocketchat_mentioned_message', _id);
    }

  });
  this.ready();
  return this.onStop(function () {
    return cursorHandle.stop();
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:mentions-flextab/server/publications/mentionedMessages.js");

/* Exports */
Package._define("rocketchat:mentions-flextab");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_mentions-flextab.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZW50aW9ucy1mbGV4dGFiL3NlcnZlci9wdWJsaWNhdGlvbnMvbWVudGlvbmVkTWVzc2FnZXMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwicHVibGlzaCIsInJpZCIsImxpbWl0IiwidXNlcklkIiwicmVhZHkiLCJwdWJsaWNhdGlvbiIsInVzZXIiLCJSb2NrZXRDaGF0IiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kT25lQnlJZCIsImN1cnNvckhhbmRsZSIsIk1lc3NhZ2VzIiwiZmluZFZpc2libGVCeU1lbnRpb25BbmRSb29tSWQiLCJ1c2VybmFtZSIsInNvcnQiLCJ0cyIsIm9ic2VydmVDaGFuZ2VzIiwiYWRkZWQiLCJfaWQiLCJyZWNvcmQiLCJtZW50aW9uZWRMaXN0IiwiY2hhbmdlZCIsInJlbW92ZWQiLCJvblN0b3AiLCJzdG9wIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlLG1CQUFmLEVBQW9DLFVBQVNDLEdBQVQsRUFBY0MsUUFBUSxFQUF0QixFQUEwQjtBQUM3RCxNQUFJLENBQUMsS0FBS0MsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUtDLEtBQUwsRUFBUDtBQUNBOztBQUNELFFBQU1DLGNBQWMsSUFBcEI7QUFDQSxRQUFNQyxPQUFPQyxXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsV0FBeEIsQ0FBb0MsS0FBS1AsTUFBekMsQ0FBYjs7QUFDQSxNQUFJLENBQUNHLElBQUwsRUFBVztBQUNWLFdBQU8sS0FBS0YsS0FBTCxFQUFQO0FBQ0E7O0FBQ0QsUUFBTU8sZUFBZUosV0FBV0MsTUFBWCxDQUFrQkksUUFBbEIsQ0FBMkJDLDZCQUEzQixDQUF5RFAsS0FBS1EsUUFBOUQsRUFBd0ViLEdBQXhFLEVBQTZFO0FBQ2pHYyxVQUFNO0FBQ0xDLFVBQUksQ0FBQztBQURBLEtBRDJGO0FBSWpHZDtBQUppRyxHQUE3RSxFQUtsQmUsY0FMa0IsQ0FLSDtBQUNqQkMsVUFBTUMsR0FBTixFQUFXQyxNQUFYLEVBQW1CO0FBQ2xCQSxhQUFPQyxhQUFQLEdBQXVCLElBQXZCO0FBQ0EsYUFBT2hCLFlBQVlhLEtBQVosQ0FBa0IsOEJBQWxCLEVBQWtEQyxHQUFsRCxFQUF1REMsTUFBdkQsQ0FBUDtBQUNBLEtBSmdCOztBQUtqQkUsWUFBUUgsR0FBUixFQUFhQyxNQUFiLEVBQXFCO0FBQ3BCQSxhQUFPQyxhQUFQLEdBQXVCLElBQXZCO0FBQ0EsYUFBT2hCLFlBQVlpQixPQUFaLENBQW9CLDhCQUFwQixFQUFvREgsR0FBcEQsRUFBeURDLE1BQXpELENBQVA7QUFDQSxLQVJnQjs7QUFTakJHLFlBQVFKLEdBQVIsRUFBYTtBQUNaLGFBQU9kLFlBQVlrQixPQUFaLENBQW9CLDhCQUFwQixFQUFvREosR0FBcEQsQ0FBUDtBQUNBOztBQVhnQixHQUxHLENBQXJCO0FBa0JBLE9BQUtmLEtBQUw7QUFDQSxTQUFPLEtBQUtvQixNQUFMLENBQVksWUFBVztBQUM3QixXQUFPYixhQUFhYyxJQUFiLEVBQVA7QUFDQSxHQUZNLENBQVA7QUFHQSxDQS9CRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21lbnRpb25zLWZsZXh0YWIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3IucHVibGlzaCgnbWVudGlvbmVkTWVzc2FnZXMnLCBmdW5jdGlvbihyaWQsIGxpbWl0ID0gNTApIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0Y29uc3QgcHVibGljYXRpb24gPSB0aGlzO1xuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51c2VySWQpO1xuXHRpZiAoIXVzZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cdGNvbnN0IGN1cnNvckhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRWaXNpYmxlQnlNZW50aW9uQW5kUm9vbUlkKHVzZXIudXNlcm5hbWUsIHJpZCwge1xuXHRcdHNvcnQ6IHtcblx0XHRcdHRzOiAtMVxuXHRcdH0sXG5cdFx0bGltaXRcblx0fSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRyZWNvcmQubWVudGlvbmVkTGlzdCA9IHRydWU7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24uYWRkZWQoJ3JvY2tldGNoYXRfbWVudGlvbmVkX21lc3NhZ2UnLCBfaWQsIHJlY29yZCk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRyZWNvcmQubWVudGlvbmVkTGlzdCA9IHRydWU7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24uY2hhbmdlZCgncm9ja2V0Y2hhdF9tZW50aW9uZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoX2lkKSB7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24ucmVtb3ZlZCgncm9ja2V0Y2hhdF9tZW50aW9uZWRfbWVzc2FnZScsIF9pZCk7XG5cdFx0fVxuXHR9KTtcblx0dGhpcy5yZWFkeSgpO1xuXHRyZXR1cm4gdGhpcy5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGN1cnNvckhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iXX0=
