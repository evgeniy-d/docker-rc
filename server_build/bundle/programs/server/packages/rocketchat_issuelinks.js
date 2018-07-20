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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:issuelinks":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_issuelinks/settings.js                        //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
RocketChat.settings.add('IssueLinks_Enabled', false, {
  type: 'boolean',
  i18nLabel: 'Enabled',
  i18nDescription: 'IssueLinks_Incompatible',
  group: 'Message',
  section: 'Issue_Links',
  public: true
});
RocketChat.settings.add('IssueLinks_Template', '', {
  type: 'string',
  i18nLabel: 'IssueLinks_LinkTemplate',
  i18nDescription: 'IssueLinks_LinkTemplate_Description',
  group: 'Message',
  section: 'Issue_Links',
  public: true
});
///////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:issuelinks/settings.js");

/* Exports */
Package._define("rocketchat:issuelinks");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_issuelinks.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppc3N1ZWxpbmtzL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZCIsInR5cGUiLCJpMThuTGFiZWwiLCJpMThuRGVzY3JpcHRpb24iLCJncm91cCIsInNlY3Rpb24iLCJwdWJsaWMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isb0JBQXhCLEVBQThDLEtBQTlDLEVBQXFEO0FBQ3BEQyxRQUFNLFNBRDhDO0FBRXBEQyxhQUFXLFNBRnlDO0FBR3BEQyxtQkFBaUIseUJBSG1DO0FBSXBEQyxTQUFPLFNBSjZDO0FBS3BEQyxXQUFTLGFBTDJDO0FBTXBEQyxVQUFRO0FBTjRDLENBQXJEO0FBU0FSLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHFCQUF4QixFQUErQyxFQUEvQyxFQUFtRDtBQUNsREMsUUFBTSxRQUQ0QztBQUVsREMsYUFBVyx5QkFGdUM7QUFHbERDLG1CQUFpQixxQ0FIaUM7QUFJbERDLFNBQU8sU0FKMkM7QUFLbERDLFdBQVMsYUFMeUM7QUFNbERDLFVBQVE7QUFOMEMsQ0FBbkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9pc3N1ZWxpbmtzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0lzc3VlTGlua3NfRW5hYmxlZCcsIGZhbHNlLCB7XG5cdHR5cGU6ICdib29sZWFuJyxcblx0aTE4bkxhYmVsOiAnRW5hYmxlZCcsXG5cdGkxOG5EZXNjcmlwdGlvbjogJ0lzc3VlTGlua3NfSW5jb21wYXRpYmxlJyxcblx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0c2VjdGlvbjogJ0lzc3VlX0xpbmtzJyxcblx0cHVibGljOiB0cnVlXG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0lzc3VlTGlua3NfVGVtcGxhdGUnLCAnJywge1xuXHR0eXBlOiAnc3RyaW5nJyxcblx0aTE4bkxhYmVsOiAnSXNzdWVMaW5rc19MaW5rVGVtcGxhdGUnLFxuXHRpMThuRGVzY3JpcHRpb246ICdJc3N1ZUxpbmtzX0xpbmtUZW1wbGF0ZV9EZXNjcmlwdGlvbicsXG5cdGdyb3VwOiAnTWVzc2FnZScsXG5cdHNlY3Rpb246ICdJc3N1ZV9MaW5rcycsXG5cdHB1YmxpYzogdHJ1ZVxufSk7XG4iXX0=
