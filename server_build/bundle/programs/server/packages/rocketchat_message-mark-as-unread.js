(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-mark-as-unread":{"server":{"logger.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_message-mark-as-unread/server/logger.js                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
const logger = new Logger('MessageMarkAsUnread', {
  sections: {
    connection: 'Connection',
    events: 'Events'
  }
});
module.exportDefault(logger);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unreadMessages.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_message-mark-as-unread/server/unreadMessages.js                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let logger;
module.watch(require("./logger"), {
  default(v) {
    logger = v;
  }

}, 0);
Meteor.methods({
  unreadMessages(firstUnreadMessage, room) {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unreadMessages'
      });
    }

    if (room) {
      const lastMessage = RocketChat.models.Messages.findVisibleByRoomId(room, {
        limit: 1,
        sort: {
          ts: -1
        }
      }).fetch()[0];

      if (lastMessage == null) {
        throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
          method: 'unreadMessages',
          action: 'Unread_messages'
        });
      }

      return RocketChat.models.Subscriptions.setAsUnreadByRoomIdAndUserId(lastMessage.rid, userId, lastMessage.ts);
    }

    const originalMessage = RocketChat.models.Messages.findOneById(firstUnreadMessage._id, {
      fields: {
        u: 1,
        rid: 1,
        file: 1,
        ts: 1
      }
    });

    if (originalMessage == null || userId === originalMessage.u._id) {
      throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
        method: 'unreadMessages',
        action: 'Unread_messages'
      });
    }

    const lastSeen = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(originalMessage.rid, userId).ls;

    if (firstUnreadMessage.ts >= lastSeen) {
      return logger.connection.debug('Provided message is already marked as unread');
    }

    logger.connection.debug(`Updating unread  message of ${originalMessage.ts} as the first unread`);
    return RocketChat.models.Subscriptions.setAsUnreadByRoomIdAndUserId(originalMessage.rid, userId, originalMessage.ts);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-mark-as-unread/server/logger.js");
require("/node_modules/meteor/rocketchat:message-mark-as-unread/server/unreadMessages.js");

/* Exports */
Package._define("rocketchat:message-mark-as-unread");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-mark-as-unread.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLW1hcmstYXMtdW5yZWFkL3NlcnZlci9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1tYXJrLWFzLXVucmVhZC9zZXJ2ZXIvdW5yZWFkTWVzc2FnZXMuanMiXSwibmFtZXMiOlsibG9nZ2VyIiwiTG9nZ2VyIiwic2VjdGlvbnMiLCJjb25uZWN0aW9uIiwiZXZlbnRzIiwibW9kdWxlIiwiZXhwb3J0RGVmYXVsdCIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiTWV0ZW9yIiwibWV0aG9kcyIsInVucmVhZE1lc3NhZ2VzIiwiZmlyc3RVbnJlYWRNZXNzYWdlIiwicm9vbSIsInVzZXJJZCIsIkVycm9yIiwibWV0aG9kIiwibGFzdE1lc3NhZ2UiLCJSb2NrZXRDaGF0IiwibW9kZWxzIiwiTWVzc2FnZXMiLCJmaW5kVmlzaWJsZUJ5Um9vbUlkIiwibGltaXQiLCJzb3J0IiwidHMiLCJmZXRjaCIsImFjdGlvbiIsIlN1YnNjcmlwdGlvbnMiLCJzZXRBc1VucmVhZEJ5Um9vbUlkQW5kVXNlcklkIiwicmlkIiwib3JpZ2luYWxNZXNzYWdlIiwiZmluZE9uZUJ5SWQiLCJfaWQiLCJmaWVsZHMiLCJ1IiwiZmlsZSIsImxhc3RTZWVuIiwiZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkIiwibHMiLCJkZWJ1ZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxNQUFNQSxTQUFTLElBQUlDLE1BQUosQ0FBVyxxQkFBWCxFQUFrQztBQUNoREMsWUFBVTtBQUNUQyxnQkFBWSxZQURIO0FBRVRDLFlBQVE7QUFGQztBQURzQyxDQUFsQyxDQUFmO0FBQUFDLE9BQU9DLGFBQVAsQ0FNZU4sTUFOZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUlBLE1BQUo7QUFBV0ssT0FBT0UsS0FBUCxDQUFhQyxRQUFRLFVBQVIsQ0FBYixFQUFpQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ1YsYUFBT1UsQ0FBUDtBQUFTOztBQUFyQixDQUFqQyxFQUF3RCxDQUF4RDtBQUNYQyxPQUFPQyxPQUFQLENBQWU7QUFDZEMsaUJBQWVDLGtCQUFmLEVBQW1DQyxJQUFuQyxFQUF5QztBQUN4QyxVQUFNQyxTQUFTTCxPQUFPSyxNQUFQLEVBQWY7O0FBQ0EsUUFBSSxDQUFDQSxNQUFMLEVBQWE7QUFDWixZQUFNLElBQUlMLE9BQU9NLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEQyxnQkFBUTtBQURvRCxPQUF2RCxDQUFOO0FBR0E7O0FBRUQsUUFBSUgsSUFBSixFQUFVO0FBQ1QsWUFBTUksY0FBY0MsV0FBV0MsTUFBWCxDQUFrQkMsUUFBbEIsQ0FBMkJDLG1CQUEzQixDQUErQ1IsSUFBL0MsRUFBcUQ7QUFBQ1MsZUFBTyxDQUFSO0FBQVdDLGNBQU07QUFBQ0MsY0FBSSxDQUFDO0FBQU47QUFBakIsT0FBckQsRUFBaUZDLEtBQWpGLEdBQXlGLENBQXpGLENBQXBCOztBQUVBLFVBQUlSLGVBQWUsSUFBbkIsRUFBeUI7QUFDeEIsY0FBTSxJQUFJUixPQUFPTSxLQUFYLENBQWlCLDBCQUFqQixFQUE2QyxhQUE3QyxFQUE0RDtBQUNqRUMsa0JBQVEsZ0JBRHlEO0FBRWpFVSxrQkFBUTtBQUZ5RCxTQUE1RCxDQUFOO0FBSUE7O0FBRUQsYUFBT1IsV0FBV0MsTUFBWCxDQUFrQlEsYUFBbEIsQ0FBZ0NDLDRCQUFoQyxDQUE2RFgsWUFBWVksR0FBekUsRUFBOEVmLE1BQTlFLEVBQXNGRyxZQUFZTyxFQUFsRyxDQUFQO0FBQ0E7O0FBRUQsVUFBTU0sa0JBQWtCWixXQUFXQyxNQUFYLENBQWtCQyxRQUFsQixDQUEyQlcsV0FBM0IsQ0FBdUNuQixtQkFBbUJvQixHQUExRCxFQUErRDtBQUN0RkMsY0FBUTtBQUNQQyxXQUFHLENBREk7QUFFUEwsYUFBSyxDQUZFO0FBR1BNLGNBQU0sQ0FIQztBQUlQWCxZQUFJO0FBSkc7QUFEOEUsS0FBL0QsQ0FBeEI7O0FBUUEsUUFBSU0sbUJBQW1CLElBQW5CLElBQTJCaEIsV0FBV2dCLGdCQUFnQkksQ0FBaEIsQ0FBa0JGLEdBQTVELEVBQWlFO0FBQ2hFLFlBQU0sSUFBSXZCLE9BQU9NLEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLGFBQTdDLEVBQTREO0FBQ2pFQyxnQkFBUSxnQkFEeUQ7QUFFakVVLGdCQUFRO0FBRnlELE9BQTVELENBQU47QUFJQTs7QUFDRCxVQUFNVSxXQUFXbEIsV0FBV0MsTUFBWCxDQUFrQlEsYUFBbEIsQ0FBZ0NVLHdCQUFoQyxDQUF5RFAsZ0JBQWdCRCxHQUF6RSxFQUE4RWYsTUFBOUUsRUFBc0Z3QixFQUF2Rzs7QUFDQSxRQUFJMUIsbUJBQW1CWSxFQUFuQixJQUF5QlksUUFBN0IsRUFBdUM7QUFDdEMsYUFBT3RDLE9BQU9HLFVBQVAsQ0FBa0JzQyxLQUFsQixDQUF3Qiw4Q0FBeEIsQ0FBUDtBQUNBOztBQUNEekMsV0FBT0csVUFBUCxDQUFrQnNDLEtBQWxCLENBQXlCLCtCQUErQlQsZ0JBQWdCTixFQUFJLHNCQUE1RTtBQUNBLFdBQU9OLFdBQVdDLE1BQVgsQ0FBa0JRLGFBQWxCLENBQWdDQyw0QkFBaEMsQ0FBNkRFLGdCQUFnQkQsR0FBN0UsRUFBa0ZmLE1BQWxGLEVBQTBGZ0IsZ0JBQWdCTixFQUExRyxDQUFQO0FBQ0E7O0FBMUNhLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9tZXNzYWdlLW1hcmstYXMtdW5yZWFkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignTWVzc2FnZU1hcmtBc1VucmVhZCcsIHtcblx0c2VjdGlvbnM6IHtcblx0XHRjb25uZWN0aW9uOiAnQ29ubmVjdGlvbicsXG5cdFx0ZXZlbnRzOiAnRXZlbnRzJ1xuXHR9XG59KTtcbmV4cG9ydCBkZWZhdWx0IGxvZ2dlcjtcbiIsImltcG9ydCBsb2dnZXIgZnJvbSAnLi9sb2dnZXInO1xuTWV0ZW9yLm1ldGhvZHMoe1xuXHR1bnJlYWRNZXNzYWdlcyhmaXJzdFVucmVhZE1lc3NhZ2UsIHJvb20pIHtcblx0XHRjb25zdCB1c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0aWYgKCF1c2VySWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3VucmVhZE1lc3NhZ2VzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJvb20pIHtcblx0XHRcdGNvbnN0IGxhc3RNZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZFZpc2libGVCeVJvb21JZChyb29tLCB7bGltaXQ6IDEsIHNvcnQ6IHt0czogLTF9fSkuZmV0Y2goKVswXTtcblxuXHRcdFx0aWYgKGxhc3RNZXNzYWdlID09IG51bGwpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdG1ldGhvZDogJ3VucmVhZE1lc3NhZ2VzJyxcblx0XHRcdFx0XHRhY3Rpb246ICdVbnJlYWRfbWVzc2FnZXMnXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5zZXRBc1VucmVhZEJ5Um9vbUlkQW5kVXNlcklkKGxhc3RNZXNzYWdlLnJpZCwgdXNlcklkLCBsYXN0TWVzc2FnZS50cyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb3JpZ2luYWxNZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQoZmlyc3RVbnJlYWRNZXNzYWdlLl9pZCwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdHU6IDEsXG5cdFx0XHRcdHJpZDogMSxcblx0XHRcdFx0ZmlsZTogMSxcblx0XHRcdFx0dHM6IDFcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpZiAob3JpZ2luYWxNZXNzYWdlID09IG51bGwgfHwgdXNlcklkID09PSBvcmlnaW5hbE1lc3NhZ2UudS5faWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAndW5yZWFkTWVzc2FnZXMnLFxuXHRcdFx0XHRhY3Rpb246ICdVbnJlYWRfbWVzc2FnZXMnXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y29uc3QgbGFzdFNlZW4gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChvcmlnaW5hbE1lc3NhZ2UucmlkLCB1c2VySWQpLmxzO1xuXHRcdGlmIChmaXJzdFVucmVhZE1lc3NhZ2UudHMgPj0gbGFzdFNlZW4pIHtcblx0XHRcdHJldHVybiBsb2dnZXIuY29ubmVjdGlvbi5kZWJ1ZygnUHJvdmlkZWQgbWVzc2FnZSBpcyBhbHJlYWR5IG1hcmtlZCBhcyB1bnJlYWQnKTtcblx0XHR9XG5cdFx0bG9nZ2VyLmNvbm5lY3Rpb24uZGVidWcoYFVwZGF0aW5nIHVucmVhZCAgbWVzc2FnZSBvZiAkeyBvcmlnaW5hbE1lc3NhZ2UudHMgfSBhcyB0aGUgZmlyc3QgdW5yZWFkYCk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuc2V0QXNVbnJlYWRCeVJvb21JZEFuZFVzZXJJZChvcmlnaW5hbE1lc3NhZ2UucmlkLCB1c2VySWQsIG9yaWdpbmFsTWVzc2FnZS50cyk7XG5cdH1cbn0pO1xuIl19
