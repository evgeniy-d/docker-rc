(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:webrtc":{"server":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_webrtc/server/settings.js                     //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
RocketChat.settings.addGroup('WebRTC', function () {
  this.add('WebRTC_Enable_Channel', false, {
    type: 'boolean',
    group: 'WebRTC',
    'public': true
  });
  this.add('WebRTC_Enable_Private', true, {
    type: 'boolean',
    group: 'WebRTC',
    'public': true
  });
  this.add('WebRTC_Enable_Direct', true, {
    type: 'boolean',
    group: 'WebRTC',
    'public': true
  });
  return this.add('WebRTC_Servers', 'stun:stun.l.google.com:19302, stun:23.21.150.121, team%40rocket.chat:demo@turn:numb.viagenie.ca:3478', {
    type: 'string',
    group: 'WebRTC',
    'public': true
  });
});
///////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:webrtc/server/settings.js");

/* Exports */
Package._define("rocketchat:webrtc");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_webrtc.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp3ZWJydGMvc2VydmVyL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSIsImdyb3VwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLFFBQVgsQ0FBb0JDLFFBQXBCLENBQTZCLFFBQTdCLEVBQXVDLFlBQVc7QUFDakQsT0FBS0MsR0FBTCxDQUFTLHVCQUFULEVBQWtDLEtBQWxDLEVBQXlDO0FBQ3hDQyxVQUFNLFNBRGtDO0FBRXhDQyxXQUFPLFFBRmlDO0FBR3hDLGNBQVU7QUFIOEIsR0FBekM7QUFLQSxPQUFLRixHQUFMLENBQVMsdUJBQVQsRUFBa0MsSUFBbEMsRUFBd0M7QUFDdkNDLFVBQU0sU0FEaUM7QUFFdkNDLFdBQU8sUUFGZ0M7QUFHdkMsY0FBVTtBQUg2QixHQUF4QztBQUtBLE9BQUtGLEdBQUwsQ0FBUyxzQkFBVCxFQUFpQyxJQUFqQyxFQUF1QztBQUN0Q0MsVUFBTSxTQURnQztBQUV0Q0MsV0FBTyxRQUYrQjtBQUd0QyxjQUFVO0FBSDRCLEdBQXZDO0FBS0EsU0FBTyxLQUFLRixHQUFMLENBQVMsZ0JBQVQsRUFBMkIsc0dBQTNCLEVBQW1JO0FBQ3pJQyxVQUFNLFFBRG1JO0FBRXpJQyxXQUFPLFFBRmtJO0FBR3pJLGNBQVU7QUFIK0gsR0FBbkksQ0FBUDtBQUtBLENBckJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfd2VicnRjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnV2ViUlRDJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuYWRkKCdXZWJSVENfRW5hYmxlX0NoYW5uZWwnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ1dlYlJUQycsXG5cdFx0J3B1YmxpYyc6IHRydWVcblx0fSk7XG5cdHRoaXMuYWRkKCdXZWJSVENfRW5hYmxlX1ByaXZhdGUnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnV2ViUlRDJyxcblx0XHQncHVibGljJzogdHJ1ZVxuXHR9KTtcblx0dGhpcy5hZGQoJ1dlYlJUQ19FbmFibGVfRGlyZWN0JywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ1dlYlJUQycsXG5cdFx0J3B1YmxpYyc6IHRydWVcblx0fSk7XG5cdHJldHVybiB0aGlzLmFkZCgnV2ViUlRDX1NlcnZlcnMnLCAnc3R1bjpzdHVuLmwuZ29vZ2xlLmNvbToxOTMwMiwgc3R1bjoyMy4yMS4xNTAuMTIxLCB0ZWFtJTQwcm9ja2V0LmNoYXQ6ZGVtb0B0dXJuOm51bWIudmlhZ2VuaWUuY2E6MzQ3OCcsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ1dlYlJUQycsXG5cdFx0J3B1YmxpYyc6IHRydWVcblx0fSk7XG59KTtcbiJdfQ==
