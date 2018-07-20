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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:autolinker":{"server":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/rocketchat_autolinker/server/settings.js                   //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
Meteor.startup(function () {
  const enableQuery = {
    _id: 'AutoLinker',
    value: true
  };
  RocketChat.settings.add('AutoLinker', true, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    i18nLabel: 'Enabled'
  });
  RocketChat.settings.add('AutoLinker_StripPrefix', false, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    i18nDescription: 'AutoLinker_StripPrefix_Description',
    enableQuery
  });
  RocketChat.settings.add('AutoLinker_Urls_Scheme', true, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    enableQuery
  });
  RocketChat.settings.add('AutoLinker_Urls_www', true, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    enableQuery
  });
  RocketChat.settings.add('AutoLinker_Urls_TLD', true, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    enableQuery
  });
  RocketChat.settings.add('AutoLinker_UrlsRegExp', '(://|www\\.).+', {
    type: 'string',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    enableQuery
  });
  RocketChat.settings.add('AutoLinker_Email', true, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    enableQuery
  });
  RocketChat.settings.add('AutoLinker_Phone', true, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoLinker',
    public: true,
    i18nDescription: 'AutoLinker_Phone_Description',
    enableQuery
  });
});
/////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:autolinker/server/settings.js");

/* Exports */
Package._define("rocketchat:autolinker");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_autolinker.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRvbGlua2VyL3NlcnZlci9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJzdGFydHVwIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZCIsInR5cGUiLCJncm91cCIsInNlY3Rpb24iLCJwdWJsaWMiLCJpMThuTGFiZWwiLCJpMThuRGVzY3JpcHRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekIsUUFBTUMsY0FBYztBQUNuQkMsU0FBSyxZQURjO0FBRW5CQyxXQUFPO0FBRlksR0FBcEI7QUFLQUMsYUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsWUFBeEIsRUFBc0MsSUFBdEMsRUFBNEM7QUFBQ0MsVUFBTSxTQUFQO0FBQWtCQyxXQUFPLFNBQXpCO0FBQW9DQyxhQUFTLFlBQTdDO0FBQTJEQyxZQUFRLElBQW5FO0FBQXlFQyxlQUFXO0FBQXBGLEdBQTVDO0FBRUFQLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxLQUFsRCxFQUF5RDtBQUFDQyxVQUFNLFNBQVA7QUFBa0JDLFdBQU8sU0FBekI7QUFBb0NDLGFBQVMsWUFBN0M7QUFBMkRDLFlBQVEsSUFBbkU7QUFBeUVFLHFCQUFpQixvQ0FBMUY7QUFBZ0lYO0FBQWhJLEdBQXpEO0FBQ0FHLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxJQUFsRCxFQUF3RDtBQUFDQyxVQUFNLFNBQVA7QUFBa0JDLFdBQU8sU0FBekI7QUFBb0NDLGFBQVMsWUFBN0M7QUFBMkRDLFlBQVEsSUFBbkU7QUFBeUVUO0FBQXpFLEdBQXhEO0FBQ0FHLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHFCQUF4QixFQUErQyxJQUEvQyxFQUFxRDtBQUFDQyxVQUFNLFNBQVA7QUFBa0JDLFdBQU8sU0FBekI7QUFBb0NDLGFBQVMsWUFBN0M7QUFBMkRDLFlBQVEsSUFBbkU7QUFBeUVUO0FBQXpFLEdBQXJEO0FBQ0FHLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHFCQUF4QixFQUErQyxJQUEvQyxFQUFxRDtBQUFDQyxVQUFNLFNBQVA7QUFBa0JDLFdBQU8sU0FBekI7QUFBb0NDLGFBQVMsWUFBN0M7QUFBMkRDLFlBQVEsSUFBbkU7QUFBeUVUO0FBQXpFLEdBQXJEO0FBQ0FHLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QixFQUFpRCxnQkFBakQsRUFBbUU7QUFBQ0MsVUFBTSxRQUFQO0FBQWlCQyxXQUFPLFNBQXhCO0FBQW1DQyxhQUFTLFlBQTVDO0FBQTBEQyxZQUFRLElBQWxFO0FBQXdFVDtBQUF4RSxHQUFuRTtBQUNBRyxhQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixrQkFBeEIsRUFBNEMsSUFBNUMsRUFBa0Q7QUFBQ0MsVUFBTSxTQUFQO0FBQWtCQyxXQUFPLFNBQXpCO0FBQW9DQyxhQUFTLFlBQTdDO0FBQTJEQyxZQUFRLElBQW5FO0FBQXlFVDtBQUF6RSxHQUFsRDtBQUNBRyxhQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixrQkFBeEIsRUFBNEMsSUFBNUMsRUFBa0Q7QUFBQ0MsVUFBTSxTQUFQO0FBQWtCQyxXQUFPLFNBQXpCO0FBQW9DQyxhQUFTLFlBQTdDO0FBQTJEQyxZQUFRLElBQW5FO0FBQXlFRSxxQkFBaUIsOEJBQTFGO0FBQTBIWDtBQUExSCxHQUFsRDtBQUNBLENBZkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hdXRvbGlua2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge1xuXHRcdF9pZDogJ0F1dG9MaW5rZXInLFxuXHRcdHZhbHVlOiB0cnVlXG5cdH07XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0F1dG9MaW5rZXInLCB0cnVlLCB7dHlwZTogJ2Jvb2xlYW4nLCBncm91cDogJ01lc3NhZ2UnLCBzZWN0aW9uOiAnQXV0b0xpbmtlcicsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnRW5hYmxlZCd9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnQXV0b0xpbmtlcl9TdHJpcFByZWZpeCcsIGZhbHNlLCB7dHlwZTogJ2Jvb2xlYW4nLCBncm91cDogJ01lc3NhZ2UnLCBzZWN0aW9uOiAnQXV0b0xpbmtlcicsIHB1YmxpYzogdHJ1ZSwgaTE4bkRlc2NyaXB0aW9uOiAnQXV0b0xpbmtlcl9TdHJpcFByZWZpeF9EZXNjcmlwdGlvbicsIGVuYWJsZVF1ZXJ5fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBdXRvTGlua2VyX1VybHNfU2NoZW1lJywgdHJ1ZSwge3R5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0F1dG9MaW5rZXInLCBwdWJsaWM6IHRydWUsIGVuYWJsZVF1ZXJ5fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBdXRvTGlua2VyX1VybHNfd3d3JywgdHJ1ZSwge3R5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0F1dG9MaW5rZXInLCBwdWJsaWM6IHRydWUsIGVuYWJsZVF1ZXJ5fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBdXRvTGlua2VyX1VybHNfVExEJywgdHJ1ZSwge3R5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0F1dG9MaW5rZXInLCBwdWJsaWM6IHRydWUsIGVuYWJsZVF1ZXJ5fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBdXRvTGlua2VyX1VybHNSZWdFeHAnLCAnKDovL3x3d3dcXFxcLikuKycsIHt0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0F1dG9MaW5rZXInLCBwdWJsaWM6IHRydWUsIGVuYWJsZVF1ZXJ5fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBdXRvTGlua2VyX0VtYWlsJywgdHJ1ZSwge3R5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0F1dG9MaW5rZXInLCBwdWJsaWM6IHRydWUsIGVuYWJsZVF1ZXJ5fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBdXRvTGlua2VyX1Bob25lJywgdHJ1ZSwge3R5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdNZXNzYWdlJywgc2VjdGlvbjogJ0F1dG9MaW5rZXInLCBwdWJsaWM6IHRydWUsIGkxOG5EZXNjcmlwdGlvbjogJ0F1dG9MaW5rZXJfUGhvbmVfRGVzY3JpcHRpb24nLCBlbmFibGVRdWVyeX0pO1xufSk7XG4iXX0=
