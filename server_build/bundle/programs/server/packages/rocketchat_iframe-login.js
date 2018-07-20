(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var check = Package.check.check;
var Match = Package.check.Match;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:iframe-login":{"iframe_rocketchat.js":function(){

//////////////////////////////////////////////////////////////////////////
//                                                                      //
// packages/rocketchat_iframe-login/iframe_rocketchat.js                //
//                                                                      //
//////////////////////////////////////////////////////////////////////////
                                                                        //
Meteor.startup(function () {
  RocketChat.settings.addGroup('Accounts', function () {
    this.section('Iframe', function () {
      this.add('Accounts_iframe_enabled', false, {
        type: 'boolean',
        public: true
      });
      this.add('Accounts_iframe_url', '', {
        type: 'string',
        public: true
      });
      this.add('Accounts_Iframe_api_url', '', {
        type: 'string',
        public: true
      });
      this.add('Accounts_Iframe_api_method', 'POST', {
        type: 'string',
        public: true
      });
    });
  });
});
//////////////////////////////////////////////////////////////////////////

},"iframe_server.js":function(){

//////////////////////////////////////////////////////////////////////////
//                                                                      //
// packages/rocketchat_iframe-login/iframe_server.js                    //
//                                                                      //
//////////////////////////////////////////////////////////////////////////
                                                                        //
/* globals Accounts, OAuth */
Accounts.registerLoginHandler('iframe', function (result) {
  if (!result.iframe) {
    return;
  }

  console.log('[Method] registerLoginHandler');
  const user = Meteor.users.findOne({
    'services.iframe.token': result.token
  });

  if (user) {
    return {
      userId: user._id
    };
  }
});
Meteor.methods({
  'OAuth.retrieveCredential'(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
  }

});
//////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:iframe-login/iframe_rocketchat.js");
require("/node_modules/meteor/rocketchat:iframe-login/iframe_server.js");

/* Exports */
Package._define("rocketchat:iframe-login");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_iframe-login.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppZnJhbWUtbG9naW4vaWZyYW1lX3JvY2tldGNoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aWZyYW1lLWxvZ2luL2lmcmFtZV9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZEdyb3VwIiwic2VjdGlvbiIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJBY2NvdW50cyIsInJlZ2lzdGVyTG9naW5IYW5kbGVyIiwicmVzdWx0IiwiaWZyYW1lIiwiY29uc29sZSIsImxvZyIsInVzZXIiLCJ1c2VycyIsImZpbmRPbmUiLCJ0b2tlbiIsInVzZXJJZCIsIl9pZCIsIm1ldGhvZHMiLCJjcmVkZW50aWFsVG9rZW4iLCJjcmVkZW50aWFsU2VjcmV0IiwiT0F1dGgiLCJyZXRyaWV2ZUNyZWRlbnRpYWwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsUUFBcEIsQ0FBNkIsVUFBN0IsRUFBeUMsWUFBVztBQUNuRCxTQUFLQyxPQUFMLENBQWEsUUFBYixFQUF1QixZQUFXO0FBQ2pDLFdBQUtDLEdBQUwsQ0FBUyx5QkFBVCxFQUFvQyxLQUFwQyxFQUEyQztBQUFFQyxjQUFNLFNBQVI7QUFBbUJDLGdCQUFRO0FBQTNCLE9BQTNDO0FBQ0EsV0FBS0YsR0FBTCxDQUFTLHFCQUFULEVBQWdDLEVBQWhDLEVBQW9DO0FBQUVDLGNBQU0sUUFBUjtBQUFrQkMsZ0JBQVE7QUFBMUIsT0FBcEM7QUFDQSxXQUFLRixHQUFMLENBQVMseUJBQVQsRUFBb0MsRUFBcEMsRUFBd0M7QUFBRUMsY0FBTSxRQUFSO0FBQWtCQyxnQkFBUTtBQUExQixPQUF4QztBQUNBLFdBQUtGLEdBQUwsQ0FBUyw0QkFBVCxFQUF1QyxNQUF2QyxFQUErQztBQUFFQyxjQUFNLFFBQVI7QUFBa0JDLGdCQUFRO0FBQTFCLE9BQS9DO0FBQ0EsS0FMRDtBQU1BLEdBUEQ7QUFRQSxDQVRELEU7Ozs7Ozs7Ozs7O0FDQUE7QUFFQUMsU0FBU0Msb0JBQVQsQ0FBOEIsUUFBOUIsRUFBd0MsVUFBU0MsTUFBVCxFQUFpQjtBQUN4RCxNQUFJLENBQUNBLE9BQU9DLE1BQVosRUFBb0I7QUFDbkI7QUFDQTs7QUFFREMsVUFBUUMsR0FBUixDQUFZLCtCQUFaO0FBRUEsUUFBTUMsT0FBT2YsT0FBT2dCLEtBQVAsQ0FBYUMsT0FBYixDQUFxQjtBQUNqQyw2QkFBeUJOLE9BQU9PO0FBREMsR0FBckIsQ0FBYjs7QUFJQSxNQUFJSCxJQUFKLEVBQVU7QUFDVCxXQUFPO0FBQ05JLGNBQVFKLEtBQUtLO0FBRFAsS0FBUDtBQUdBO0FBQ0QsQ0FoQkQ7QUFtQkFwQixPQUFPcUIsT0FBUCxDQUFlO0FBQ2QsNkJBQTJCQyxlQUEzQixFQUE0Q0MsZ0JBQTVDLEVBQThEO0FBQzdELFdBQU9DLE1BQU1DLGtCQUFOLENBQXlCSCxlQUF6QixFQUEwQ0MsZ0JBQTFDLENBQVA7QUFDQTs7QUFIYSxDQUFmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfaWZyYW1lLWxvZ2luLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0FjY291bnRzJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5zZWN0aW9uKCdJZnJhbWUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuYWRkKCdBY2NvdW50c19pZnJhbWVfZW5hYmxlZCcsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5hZGQoJ0FjY291bnRzX2lmcmFtZV91cmwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5hZGQoJ0FjY291bnRzX0lmcmFtZV9hcGlfdXJsJywgJycsIHsgdHlwZTogJ3N0cmluZycsIHB1YmxpYzogdHJ1ZSB9KTtcblx0XHRcdHRoaXMuYWRkKCdBY2NvdW50c19JZnJhbWVfYXBpX21ldGhvZCcsICdQT1NUJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIiwiLyogZ2xvYmFscyBBY2NvdW50cywgT0F1dGggKi9cblxuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoJ2lmcmFtZScsIGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRpZiAoIXJlc3VsdC5pZnJhbWUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zb2xlLmxvZygnW01ldGhvZF0gcmVnaXN0ZXJMb2dpbkhhbmRsZXInKTtcblxuXHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuXHRcdCdzZXJ2aWNlcy5pZnJhbWUudG9rZW4nOiByZXN1bHQudG9rZW5cblx0fSk7XG5cblx0aWYgKHVzZXIpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dXNlcklkOiB1c2VyLl9pZFxuXHRcdH07XG5cdH1cbn0pO1xuXG5cbk1ldGVvci5tZXRob2RzKHtcblx0J09BdXRoLnJldHJpZXZlQ3JlZGVudGlhbCcoY3JlZGVudGlhbFRva2VuLCBjcmVkZW50aWFsU2VjcmV0KSB7XG5cdFx0cmV0dXJuIE9BdXRoLnJldHJpZXZlQ3JlZGVudGlhbChjcmVkZW50aWFsVG9rZW4sIGNyZWRlbnRpYWxTZWNyZXQpO1xuXHR9XG59KTtcbiJdfQ==
