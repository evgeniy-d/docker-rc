(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:action-links":{"both":{"lib":{"actionLinks.js":function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_action-links/both/lib/actionLinks.js                           //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
//Action Links namespace creation.
RocketChat.actionLinks = {
  actions: {},

  register(name, funct) {
    RocketChat.actionLinks.actions[name] = funct;
  },

  getMessage(name, messageId) {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        function: 'actionLinks.getMessage'
      });
    }

    const message = RocketChat.models.Messages.findOne({
      _id: messageId
    });

    if (!message) {
      throw new Meteor.Error('error-invalid-message', 'Invalid message', {
        function: 'actionLinks.getMessage'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOne({
      rid: message.rid,
      'u._id': userId
    });

    if (!subscription) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        function: 'actionLinks.getMessage'
      });
    }

    if (!message.actionLinks || !message.actionLinks[name]) {
      throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', {
        function: 'actionLinks.getMessage'
      });
    }

    return message;
  }

};
////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"actionLinkHandler.js":function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_action-links/server/actionLinkHandler.js                       //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
//Action Links Handler. This method will be called off the client.
Meteor.methods({
  actionLinkHandler(name, messageId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'actionLinkHandler'
      });
    }

    const message = RocketChat.actionLinks.getMessage(name, messageId);
    const actionLink = message.actionLinks[name];
    RocketChat.actionLinks.actions[actionLink.method_id](message, actionLink.params);
  }

});
////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:action-links/both/lib/actionLinks.js");
require("/node_modules/meteor/rocketchat:action-links/server/actionLinkHandler.js");

/* Exports */
Package._define("rocketchat:action-links");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_action-links.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphY3Rpb24tbGlua3MvYm90aC9saWIvYWN0aW9uTGlua3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YWN0aW9uLWxpbmtzL3NlcnZlci9hY3Rpb25MaW5rSGFuZGxlci5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0IiwiYWN0aW9uTGlua3MiLCJhY3Rpb25zIiwicmVnaXN0ZXIiLCJuYW1lIiwiZnVuY3QiLCJnZXRNZXNzYWdlIiwibWVzc2FnZUlkIiwidXNlcklkIiwiTWV0ZW9yIiwiRXJyb3IiLCJmdW5jdGlvbiIsIm1lc3NhZ2UiLCJtb2RlbHMiLCJNZXNzYWdlcyIsImZpbmRPbmUiLCJfaWQiLCJzdWJzY3JpcHRpb24iLCJTdWJzY3JpcHRpb25zIiwicmlkIiwibWV0aG9kcyIsImFjdGlvbkxpbmtIYW5kbGVyIiwibWV0aG9kIiwiYWN0aW9uTGluayIsIm1ldGhvZF9pZCIsInBhcmFtcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxXQUFXQyxXQUFYLEdBQXlCO0FBQ3hCQyxXQUFTLEVBRGU7O0FBRXhCQyxXQUFTQyxJQUFULEVBQWVDLEtBQWYsRUFBc0I7QUFDckJMLGVBQVdDLFdBQVgsQ0FBdUJDLE9BQXZCLENBQStCRSxJQUEvQixJQUF1Q0MsS0FBdkM7QUFDQSxHQUp1Qjs7QUFLeEJDLGFBQVdGLElBQVgsRUFBaUJHLFNBQWpCLEVBQTRCO0FBQzNCLFVBQU1DLFNBQVNDLE9BQU9ELE1BQVAsRUFBZjs7QUFDQSxRQUFJLENBQUNBLE1BQUwsRUFBYTtBQUNaLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRUMsa0JBQVU7QUFBWixPQUF2RCxDQUFOO0FBQ0E7O0FBRUQsVUFBTUMsVUFBVVosV0FBV2EsTUFBWCxDQUFrQkMsUUFBbEIsQ0FBMkJDLE9BQTNCLENBQW1DO0FBQUVDLFdBQUtUO0FBQVAsS0FBbkMsQ0FBaEI7O0FBQ0EsUUFBSSxDQUFDSyxPQUFMLEVBQWM7QUFDYixZQUFNLElBQUlILE9BQU9DLEtBQVgsQ0FBaUIsdUJBQWpCLEVBQTBDLGlCQUExQyxFQUE2RDtBQUFFQyxrQkFBVTtBQUFaLE9BQTdELENBQU47QUFDQTs7QUFFRCxVQUFNTSxlQUFlakIsV0FBV2EsTUFBWCxDQUFrQkssYUFBbEIsQ0FBZ0NILE9BQWhDLENBQXdDO0FBQzVESSxXQUFLUCxRQUFRTyxHQUQrQztBQUU1RCxlQUFTWDtBQUZtRCxLQUF4QyxDQUFyQjs7QUFJQSxRQUFJLENBQUNTLFlBQUwsRUFBbUI7QUFDbEIsWUFBTSxJQUFJUixPQUFPQyxLQUFYLENBQWlCLG1CQUFqQixFQUFzQyxhQUF0QyxFQUFxRDtBQUFFQyxrQkFBVTtBQUFaLE9BQXJELENBQU47QUFDQTs7QUFFRCxRQUFJLENBQUNDLFFBQVFYLFdBQVQsSUFBd0IsQ0FBQ1csUUFBUVgsV0FBUixDQUFvQkcsSUFBcEIsQ0FBN0IsRUFBd0Q7QUFDdkQsWUFBTSxJQUFJSyxPQUFPQyxLQUFYLENBQWlCLDBCQUFqQixFQUE2QyxxQkFBN0MsRUFBb0U7QUFBRUMsa0JBQVU7QUFBWixPQUFwRSxDQUFOO0FBQ0E7O0FBRUQsV0FBT0MsT0FBUDtBQUNBOztBQTdCdUIsQ0FBekIsQzs7Ozs7Ozs7Ozs7QUNEQTtBQUVBSCxPQUFPVyxPQUFQLENBQWU7QUFDZEMsb0JBQWtCakIsSUFBbEIsRUFBd0JHLFNBQXhCLEVBQW1DO0FBQ2xDLFFBQUksQ0FBQ0UsT0FBT0QsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRVksZ0JBQVE7QUFBVixPQUF2RCxDQUFOO0FBQ0E7O0FBRUQsVUFBTVYsVUFBVVosV0FBV0MsV0FBWCxDQUF1QkssVUFBdkIsQ0FBa0NGLElBQWxDLEVBQXdDRyxTQUF4QyxDQUFoQjtBQUVBLFVBQU1nQixhQUFhWCxRQUFRWCxXQUFSLENBQW9CRyxJQUFwQixDQUFuQjtBQUVBSixlQUFXQyxXQUFYLENBQXVCQyxPQUF2QixDQUErQnFCLFdBQVdDLFNBQTFDLEVBQXFEWixPQUFyRCxFQUE4RFcsV0FBV0UsTUFBekU7QUFDQTs7QUFYYSxDQUFmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfYWN0aW9uLWxpbmtzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy9BY3Rpb24gTGlua3MgbmFtZXNwYWNlIGNyZWF0aW9uLlxuUm9ja2V0Q2hhdC5hY3Rpb25MaW5rcyA9IHtcblx0YWN0aW9uczoge30sXG5cdHJlZ2lzdGVyKG5hbWUsIGZ1bmN0KSB7XG5cdFx0Um9ja2V0Q2hhdC5hY3Rpb25MaW5rcy5hY3Rpb25zW25hbWVdID0gZnVuY3Q7XG5cdH0sXG5cdGdldE1lc3NhZ2UobmFtZSwgbWVzc2FnZUlkKSB7XG5cdFx0Y29uc3QgdXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpO1xuXHRcdGlmICghdXNlcklkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBmdW5jdGlvbjogJ2FjdGlvbkxpbmtzLmdldE1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lKHsgX2lkOiBtZXNzYWdlSWQgfSk7XG5cdFx0aWYgKCFtZXNzYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLW1lc3NhZ2UnLCAnSW52YWxpZCBtZXNzYWdlJywgeyBmdW5jdGlvbjogJ2FjdGlvbkxpbmtzLmdldE1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZSh7XG5cdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0J3UuX2lkJzogdXNlcklkXG5cdFx0fSk7XG5cdFx0aWYgKCFzdWJzY3JpcHRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBmdW5jdGlvbjogJ2FjdGlvbkxpbmtzLmdldE1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghbWVzc2FnZS5hY3Rpb25MaW5rcyB8fCAhbWVzc2FnZS5hY3Rpb25MaW5rc1tuYW1lXSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hY3Rpb25saW5rJywgJ0ludmFsaWQgYWN0aW9uIGxpbmsnLCB7IGZ1bmN0aW9uOiAnYWN0aW9uTGlua3MuZ2V0TWVzc2FnZScgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cbn07XG4iLCIvL0FjdGlvbiBMaW5rcyBIYW5kbGVyLiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBvZmYgdGhlIGNsaWVudC5cblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRhY3Rpb25MaW5rSGFuZGxlcihuYW1lLCBtZXNzYWdlSWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnYWN0aW9uTGlua0hhbmRsZXInIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSBSb2NrZXRDaGF0LmFjdGlvbkxpbmtzLmdldE1lc3NhZ2UobmFtZSwgbWVzc2FnZUlkKTtcblxuXHRcdGNvbnN0IGFjdGlvbkxpbmsgPSBtZXNzYWdlLmFjdGlvbkxpbmtzW25hbWVdO1xuXG5cdFx0Um9ja2V0Q2hhdC5hY3Rpb25MaW5rcy5hY3Rpb25zW2FjdGlvbkxpbmsubWV0aG9kX2lkXShtZXNzYWdlLCBhY3Rpb25MaW5rLnBhcmFtcyk7XG5cdH1cbn0pO1xuIl19
