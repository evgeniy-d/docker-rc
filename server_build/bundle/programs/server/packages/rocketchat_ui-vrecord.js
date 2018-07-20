(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:ui-vrecord":{"server":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_ui-vrecord/server/settings.js                 //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
RocketChat.settings.addGroup('Message', function () {
  this.add('Message_VideoRecorderEnabled', true, {
    type: 'boolean',
    public: true,
    i18nDescription: 'Message_VideoRecorderEnabledDescription'
  });
});
///////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:ui-vrecord/server/settings.js");

/* Exports */
Package._define("rocketchat:ui-vrecord");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_ui-vrecord.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1aS12cmVjb3JkL3NlcnZlci9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJpMThuRGVzY3JpcHRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLFFBQVgsQ0FBb0JDLFFBQXBCLENBQTZCLFNBQTdCLEVBQXdDLFlBQVc7QUFDbEQsT0FBS0MsR0FBTCxDQUFTLDhCQUFULEVBQXlDLElBQXpDLEVBQStDO0FBQzlDQyxVQUFNLFNBRHdDO0FBRTlDQyxZQUFRLElBRnNDO0FBRzlDQyxxQkFBaUI7QUFINkIsR0FBL0M7QUFLQSxDQU5ELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfdWktdnJlY29yZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ01lc3NhZ2UnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5hZGQoJ01lc3NhZ2VfVmlkZW9SZWNvcmRlckVuYWJsZWQnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuRGVzY3JpcHRpb246ICdNZXNzYWdlX1ZpZGVvUmVjb3JkZXJFbmFibGVkRGVzY3JpcHRpb24nXG5cdH0pO1xufSk7XG4iXX0=
