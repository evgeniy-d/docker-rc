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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-star":{"server":{"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_message-star/server/settings.js                                                            //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.startup(function () {
  return RocketChat.settings.add('Message_AllowStarring', true, {
    type: 'boolean',
    group: 'Message',
    'public': true
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"starMessage.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_message-star/server/starMessage.js                                                         //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.methods({
  starMessage(message) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'starMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowStarring')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
        method: 'pinMessage',
        action: 'Message_starring'
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

    return RocketChat.models.Messages.updateUserStarById(message._id, Meteor.userId(), message.starred);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"starredMessages.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_message-star/server/publications/starredMessages.js                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.publish('starredMessages', function (rid, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (!user) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findStarredByUserAtRoom(this.userId, rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      return publication.added('rocketchat_starred_message', _id, record);
    },

    changed(_id, record) {
      return publication.changed('rocketchat_starred_message', _id, record);
    },

    removed(_id) {
      return publication.removed('rocketchat_starred_message', _id);
    }

  });
  this.ready();
  return this.onStop(function () {
    return cursorHandle.stop();
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"indexes.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_message-star/server/startup/indexes.js                                                     //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.startup(function () {
  return Meteor.defer(function () {
    return RocketChat.models.Messages.tryEnsureIndex({
      'starred._id': 1
    }, {
      sparse: 1
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-star/server/settings.js");
require("/node_modules/meteor/rocketchat:message-star/server/starMessage.js");
require("/node_modules/meteor/rocketchat:message-star/server/publications/starredMessages.js");
require("/node_modules/meteor/rocketchat:message-star/server/startup/indexes.js");

/* Exports */
Package._define("rocketchat:message-star");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-star.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXN0YXIvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1lc3NhZ2Utc3Rhci9zZXJ2ZXIvc3Rhck1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zdGFyL3NlcnZlci9wdWJsaWNhdGlvbnMvc3RhcnJlZE1lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1lc3NhZ2Utc3Rhci9zZXJ2ZXIvc3RhcnR1cC9pbmRleGVzLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGQiLCJ0eXBlIiwiZ3JvdXAiLCJtZXRob2RzIiwic3Rhck1lc3NhZ2UiLCJtZXNzYWdlIiwidXNlcklkIiwiRXJyb3IiLCJtZXRob2QiLCJnZXQiLCJhY3Rpb24iLCJzdWJzY3JpcHRpb24iLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwiZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkIiwicmlkIiwiZmllbGRzIiwiX2lkIiwiTWVzc2FnZXMiLCJ1cGRhdGVVc2VyU3RhckJ5SWQiLCJzdGFycmVkIiwicHVibGlzaCIsImxpbWl0IiwicmVhZHkiLCJwdWJsaWNhdGlvbiIsInVzZXIiLCJVc2VycyIsImZpbmRPbmVCeUlkIiwiY3Vyc29ySGFuZGxlIiwiZmluZFN0YXJyZWRCeVVzZXJBdFJvb20iLCJzb3J0IiwidHMiLCJvYnNlcnZlQ2hhbmdlcyIsImFkZGVkIiwicmVjb3JkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJvblN0b3AiLCJzdG9wIiwiZGVmZXIiLCJ0cnlFbnN1cmVJbmRleCIsInNwYXJzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCLFNBQU9DLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QixFQUFpRCxJQUFqRCxFQUF1RDtBQUM3REMsVUFBTSxTQUR1RDtBQUU3REMsV0FBTyxTQUZzRDtBQUc3RCxjQUFVO0FBSG1ELEdBQXZELENBQVA7QUFLQSxDQU5ELEU7Ozs7Ozs7Ozs7O0FDQUFOLE9BQU9PLE9BQVAsQ0FBZTtBQUNkQyxjQUFZQyxPQUFaLEVBQXFCO0FBQ3BCLFFBQUksQ0FBQ1QsT0FBT1UsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSVYsT0FBT1csS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFDNURDLGdCQUFRO0FBRG9ELE9BQXZELENBQU47QUFHQTs7QUFFRCxRQUFJLENBQUNWLFdBQVdDLFFBQVgsQ0FBb0JVLEdBQXBCLENBQXdCLHVCQUF4QixDQUFMLEVBQXVEO0FBQ3RELFlBQU0sSUFBSWIsT0FBT1csS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsOEJBQTdDLEVBQTZFO0FBQ2xGQyxnQkFBUSxZQUQwRTtBQUVsRkUsZ0JBQVE7QUFGMEUsT0FBN0UsQ0FBTjtBQUlBOztBQUVELFVBQU1DLGVBQWViLFdBQVdjLE1BQVgsQ0FBa0JDLGFBQWxCLENBQWdDQyx3QkFBaEMsQ0FBeURULFFBQVFVLEdBQWpFLEVBQXNFbkIsT0FBT1UsTUFBUCxFQUF0RSxFQUF1RjtBQUFFVSxjQUFRO0FBQUVDLGFBQUs7QUFBUDtBQUFWLEtBQXZGLENBQXJCOztBQUNBLFFBQUksQ0FBQ04sWUFBTCxFQUFtQjtBQUNsQixhQUFPLEtBQVA7QUFDQTs7QUFFRCxXQUFPYixXQUFXYyxNQUFYLENBQWtCTSxRQUFsQixDQUEyQkMsa0JBQTNCLENBQThDZCxRQUFRWSxHQUF0RCxFQUEyRHJCLE9BQU9VLE1BQVAsRUFBM0QsRUFBNEVELFFBQVFlLE9BQXBGLENBQVA7QUFDQTs7QUFyQmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBeEIsT0FBT3lCLE9BQVAsQ0FBZSxpQkFBZixFQUFrQyxVQUFTTixHQUFULEVBQWNPLFFBQVEsRUFBdEIsRUFBMEI7QUFDM0QsTUFBSSxDQUFDLEtBQUtoQixNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBS2lCLEtBQUwsRUFBUDtBQUNBOztBQUNELFFBQU1DLGNBQWMsSUFBcEI7QUFDQSxRQUFNQyxPQUFPM0IsV0FBV2MsTUFBWCxDQUFrQmMsS0FBbEIsQ0FBd0JDLFdBQXhCLENBQW9DLEtBQUtyQixNQUF6QyxDQUFiOztBQUNBLE1BQUksQ0FBQ21CLElBQUwsRUFBVztBQUNWLFdBQU8sS0FBS0YsS0FBTCxFQUFQO0FBQ0E7O0FBQ0QsUUFBTUssZUFBZTlCLFdBQVdjLE1BQVgsQ0FBa0JNLFFBQWxCLENBQTJCVyx1QkFBM0IsQ0FBbUQsS0FBS3ZCLE1BQXhELEVBQWdFUyxHQUFoRSxFQUFxRTtBQUN6RmUsVUFBTTtBQUNMQyxVQUFJLENBQUM7QUFEQSxLQURtRjtBQUl6RlQ7QUFKeUYsR0FBckUsRUFLbEJVLGNBTGtCLENBS0g7QUFDakJDLFVBQU1oQixHQUFOLEVBQVdpQixNQUFYLEVBQW1CO0FBQ2xCLGFBQU9WLFlBQVlTLEtBQVosQ0FBa0IsNEJBQWxCLEVBQWdEaEIsR0FBaEQsRUFBcURpQixNQUFyRCxDQUFQO0FBQ0EsS0FIZ0I7O0FBSWpCQyxZQUFRbEIsR0FBUixFQUFhaUIsTUFBYixFQUFxQjtBQUNwQixhQUFPVixZQUFZVyxPQUFaLENBQW9CLDRCQUFwQixFQUFrRGxCLEdBQWxELEVBQXVEaUIsTUFBdkQsQ0FBUDtBQUNBLEtBTmdCOztBQU9qQkUsWUFBUW5CLEdBQVIsRUFBYTtBQUNaLGFBQU9PLFlBQVlZLE9BQVosQ0FBb0IsNEJBQXBCLEVBQWtEbkIsR0FBbEQsQ0FBUDtBQUNBOztBQVRnQixHQUxHLENBQXJCO0FBZ0JBLE9BQUtNLEtBQUw7QUFDQSxTQUFPLEtBQUtjLE1BQUwsQ0FBWSxZQUFXO0FBQzdCLFdBQU9ULGFBQWFVLElBQWIsRUFBUDtBQUNBLEdBRk0sQ0FBUDtBQUdBLENBN0JELEU7Ozs7Ozs7Ozs7O0FDQUExQyxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QixTQUFPRCxPQUFPMkMsS0FBUCxDQUFhLFlBQVc7QUFDOUIsV0FBT3pDLFdBQVdjLE1BQVgsQ0FBa0JNLFFBQWxCLENBQTJCc0IsY0FBM0IsQ0FBMEM7QUFDaEQscUJBQWU7QUFEaUMsS0FBMUMsRUFFSjtBQUNGQyxjQUFRO0FBRE4sS0FGSSxDQUFQO0FBS0EsR0FOTSxDQUFQO0FBT0EsQ0FSRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21lc3NhZ2Utc3Rhci5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01lc3NhZ2VfQWxsb3dTdGFycmluZycsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHQncHVibGljJzogdHJ1ZVxuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRzdGFyTWVzc2FnZShtZXNzYWdlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3N0YXJNZXNzYWdlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9BbGxvd1N0YXJyaW5nJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdNZXNzYWdlIHN0YXJyaW5nIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdwaW5NZXNzYWdlJyxcblx0XHRcdFx0YWN0aW9uOiAnTWVzc2FnZV9zdGFycmluZydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKG1lc3NhZ2UucmlkLCBNZXRlb3IudXNlcklkKCksIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnVwZGF0ZVVzZXJTdGFyQnlJZChtZXNzYWdlLl9pZCwgTWV0ZW9yLnVzZXJJZCgpLCBtZXNzYWdlLnN0YXJyZWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdzdGFycmVkTWVzc2FnZXMnLCBmdW5jdGlvbihyaWQsIGxpbWl0ID0gNTApIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0Y29uc3QgcHVibGljYXRpb24gPSB0aGlzO1xuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51c2VySWQpO1xuXHRpZiAoIXVzZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cdGNvbnN0IGN1cnNvckhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRTdGFycmVkQnlVc2VyQXRSb29tKHRoaXMudXNlcklkLCByaWQsIHtcblx0XHRzb3J0OiB7XG5cdFx0XHR0czogLTFcblx0XHR9LFxuXHRcdGxpbWl0XG5cdH0pLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRhZGRlZChfaWQsIHJlY29yZCkge1xuXHRcdFx0cmV0dXJuIHB1YmxpY2F0aW9uLmFkZGVkKCdyb2NrZXRjaGF0X3N0YXJyZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoX2lkLCByZWNvcmQpIHtcblx0XHRcdHJldHVybiBwdWJsaWNhdGlvbi5jaGFuZ2VkKCdyb2NrZXRjaGF0X3N0YXJyZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoX2lkKSB7XG5cdFx0XHRyZXR1cm4gcHVibGljYXRpb24ucmVtb3ZlZCgncm9ja2V0Y2hhdF9zdGFycmVkX21lc3NhZ2UnLCBfaWQpO1xuXHRcdH1cblx0fSk7XG5cdHRoaXMucmVhZHkoKTtcblx0cmV0dXJuIHRoaXMub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBjdXJzb3JIYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdHJldHVybiBNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnRyeUVuc3VyZUluZGV4KHtcblx0XHRcdCdzdGFycmVkLl9pZCc6IDFcblx0XHR9LCB7XG5cdFx0XHRzcGFyc2U6IDFcblx0XHR9KTtcblx0fSk7XG59KTtcbiJdfQ==
