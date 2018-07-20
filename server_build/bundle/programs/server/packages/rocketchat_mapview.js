(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:mapview":{"server":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_mapview/server/settings.js                    //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
Meteor.startup(function () {
  RocketChat.settings.add('MapView_Enabled', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Google Maps',
    public: true,
    i18nLabel: 'MapView_Enabled',
    i18nDescription: 'MapView_Enabled_Description'
  });
  return RocketChat.settings.add('MapView_GMapsAPIKey', '', {
    type: 'string',
    group: 'Message',
    section: 'Google Maps',
    public: true,
    i18nLabel: 'MapView_GMapsAPIKey',
    i18nDescription: 'MapView_GMapsAPIKey_Description'
  });
});
///////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:mapview/server/settings.js");

/* Exports */
Package._define("rocketchat:mapview");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_mapview.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXB2aWV3L3NlcnZlci9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiYWRkIiwidHlwZSIsImdyb3VwIiwic2VjdGlvbiIsInB1YmxpYyIsImkxOG5MYWJlbCIsImkxOG5EZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUJBQXhCLEVBQTJDLEtBQTNDLEVBQWtEO0FBQUNDLFVBQU0sU0FBUDtBQUFrQkMsV0FBTyxTQUF6QjtBQUFvQ0MsYUFBUyxhQUE3QztBQUE0REMsWUFBUSxJQUFwRTtBQUEwRUMsZUFBVyxpQkFBckY7QUFBd0dDLHFCQUFpQjtBQUF6SCxHQUFsRDtBQUNBLFNBQU9SLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHFCQUF4QixFQUErQyxFQUEvQyxFQUFtRDtBQUFDQyxVQUFNLFFBQVA7QUFBaUJDLFdBQU8sU0FBeEI7QUFBbUNDLGFBQVMsYUFBNUM7QUFBMkRDLFlBQVEsSUFBbkU7QUFBeUVDLGVBQVcscUJBQXBGO0FBQTJHQyxxQkFBaUI7QUFBNUgsR0FBbkQsQ0FBUDtBQUNBLENBSEQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9tYXB2aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXBWaWV3X0VuYWJsZWQnLCBmYWxzZSwge3R5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0dvb2dsZSBNYXBzJywgcHVibGljOiB0cnVlLCBpMThuTGFiZWw6ICdNYXBWaWV3X0VuYWJsZWQnLCBpMThuRGVzY3JpcHRpb246ICdNYXBWaWV3X0VuYWJsZWRfRGVzY3JpcHRpb24nfSk7XG5cdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFwVmlld19HTWFwc0FQSUtleScsICcnLCB7dHlwZTogJ3N0cmluZycsIGdyb3VwOiAnTWVzc2FnZScsIHNlY3Rpb246ICdHb29nbGUgTWFwcycsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnTWFwVmlld19HTWFwc0FQSUtleScsIGkxOG5EZXNjcmlwdGlvbjogJ01hcFZpZXdfR01hcHNBUElLZXlfRGVzY3JpcHRpb24nfSk7XG59KTtcbiJdfQ==
