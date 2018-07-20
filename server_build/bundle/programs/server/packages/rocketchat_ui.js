(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Push = Package['raix:push'].Push;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var fileUpload;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:ui":{"getAvatarUrlFromUsername.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/rocketchat_ui/getAvatarUrlFromUsername.js                                                  //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// TODO: remove global
this.getAvatarUrlFromUsername = function (username) {
  const key = `avatar_random_${username}`;
  const random = typeof Session !== 'undefined' ? Session.keys[key] : 0;

  if (username == null) {
    return;
  }

  const cdnPrefix = (RocketChat.settings.get('CDN_PREFIX') || '').trim().replace(/\/$/, '');
  const pathPrefix = (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '').trim().replace(/\/$/, '');
  let path = pathPrefix;

  if (cdnPrefix) {
    path = cdnPrefix + pathPrefix;
  } else if (Meteor.isCordova) {
    path = Meteor.absoluteUrl().replace(/\/$/, '');
  }

  return `${path}/avatar/${encodeURIComponent(username)}?_dc=${random}`;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:ui/getAvatarUrlFromUsername.js");

/* Exports */
Package._define("rocketchat:ui", {
  fileUpload: fileUpload
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_ui.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1aS9nZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUuanMiXSwibmFtZXMiOlsiZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lIiwidXNlcm5hbWUiLCJrZXkiLCJyYW5kb20iLCJTZXNzaW9uIiwia2V5cyIsImNkblByZWZpeCIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsInRyaW0iLCJyZXBsYWNlIiwicGF0aFByZWZpeCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsInBhdGgiLCJNZXRlb3IiLCJpc0NvcmRvdmEiLCJhYnNvbHV0ZVVybCIsImVuY29kZVVSSUNvbXBvbmVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBLEtBQUtBLHdCQUFMLEdBQWdDLFVBQVNDLFFBQVQsRUFBbUI7QUFDbEQsUUFBTUMsTUFBTyxpQkFBaUJELFFBQVUsRUFBeEM7QUFDQSxRQUFNRSxTQUFTLE9BQU9DLE9BQVAsS0FBbUIsV0FBbkIsR0FBaUNBLFFBQVFDLElBQVIsQ0FBYUgsR0FBYixDQUFqQyxHQUFxRCxDQUFwRTs7QUFDQSxNQUFJRCxZQUFZLElBQWhCLEVBQXNCO0FBQ3JCO0FBQ0E7O0FBQ0QsUUFBTUssWUFBWSxDQUFDQyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixZQUF4QixLQUF5QyxFQUExQyxFQUE4Q0MsSUFBOUMsR0FBcURDLE9BQXJELENBQTZELEtBQTdELEVBQW9FLEVBQXBFLENBQWxCO0FBQ0EsUUFBTUMsYUFBYSxDQUFDQywwQkFBMEJDLG9CQUExQixJQUFrRCxFQUFuRCxFQUF1REosSUFBdkQsR0FBOERDLE9BQTlELENBQXNFLEtBQXRFLEVBQTZFLEVBQTdFLENBQW5CO0FBQ0EsTUFBSUksT0FBT0gsVUFBWDs7QUFDQSxNQUFJTixTQUFKLEVBQWU7QUFDZFMsV0FBT1QsWUFBWU0sVUFBbkI7QUFDQSxHQUZELE1BRU8sSUFBSUksT0FBT0MsU0FBWCxFQUFzQjtBQUM1QkYsV0FBT0MsT0FBT0UsV0FBUCxHQUFxQlAsT0FBckIsQ0FBNkIsS0FBN0IsRUFBb0MsRUFBcEMsQ0FBUDtBQUNBOztBQUNELFNBQVEsR0FBR0ksSUFBTSxXQUFXSSxtQkFBbUJsQixRQUFuQixDQUE4QixRQUFRRSxNQUFRLEVBQTFFO0FBQ0EsQ0FmRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3VpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETzogcmVtb3ZlIGdsb2JhbFxudGhpcy5nZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUgPSBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRjb25zdCBrZXkgPSBgYXZhdGFyX3JhbmRvbV8keyB1c2VybmFtZSB9YDtcblx0Y29uc3QgcmFuZG9tID0gdHlwZW9mIFNlc3Npb24gIT09ICd1bmRlZmluZWQnID8gU2Vzc2lvbi5rZXlzW2tleV0gOiAwO1xuXHRpZiAodXNlcm5hbWUgPT0gbnVsbCkge1xuXHRcdHJldHVybjtcblx0fVxuXHRjb25zdCBjZG5QcmVmaXggPSAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NETl9QUkVGSVgnKSB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG5cdGNvbnN0IHBhdGhQcmVmaXggPSAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG5cdGxldCBwYXRoID0gcGF0aFByZWZpeDtcblx0aWYgKGNkblByZWZpeCkge1xuXHRcdHBhdGggPSBjZG5QcmVmaXggKyBwYXRoUHJlZml4O1xuXHR9IGVsc2UgaWYgKE1ldGVvci5pc0NvcmRvdmEpIHtcblx0XHRwYXRoID0gTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXFwvJC8sICcnKTtcblx0fVxuXHRyZXR1cm4gYCR7IHBhdGggfS9hdmF0YXIvJHsgZW5jb2RlVVJJQ29tcG9uZW50KHVzZXJuYW1lKSB9P19kYz0keyByYW5kb20gfWA7XG59O1xuIl19
