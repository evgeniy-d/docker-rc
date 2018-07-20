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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:colors":{"server":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_colors/server/settings.js                     //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
RocketChat.settings.add('HexColorPreview_Enabled', true, {
  type: 'boolean',
  i18nLabel: 'Enabled',
  group: 'Message',
  section: 'Hex_Color_Preview',
  public: true
});
///////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:colors/server/settings.js");

/* Exports */
Package._define("rocketchat:colors");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_colors.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjb2xvcnMvc2VydmVyL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZCIsInR5cGUiLCJpMThuTGFiZWwiLCJncm91cCIsInNlY3Rpb24iLCJwdWJsaWMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IseUJBQXhCLEVBQW1ELElBQW5ELEVBQXlEO0FBQ3hEQyxRQUFNLFNBRGtEO0FBRXhEQyxhQUFXLFNBRjZDO0FBR3hEQyxTQUFPLFNBSGlEO0FBSXhEQyxXQUFTLG1CQUorQztBQUt4REMsVUFBUTtBQUxnRCxDQUF6RCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2NvbG9ycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdIZXhDb2xvclByZXZpZXdfRW5hYmxlZCcsIHRydWUsIHtcblx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRpMThuTGFiZWw6ICdFbmFibGVkJyxcblx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0c2VjdGlvbjogJ0hleF9Db2xvcl9QcmV2aWV3Jyxcblx0cHVibGljOiB0cnVlXG59KTtcbiJdfQ==
