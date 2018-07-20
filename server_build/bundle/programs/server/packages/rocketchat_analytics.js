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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:analytics":{"server":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/rocketchat_analytics/server/settings.js                                  //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
RocketChat.settings.addGroup('Analytics', function addSettings() {
  this.section('Piwik', function () {
    const enableQuery = {
      _id: 'PiwikAnalytics_enabled',
      value: true
    };
    this.add('PiwikAnalytics_enabled', false, {
      type: 'boolean',
      public: true,
      i18nLabel: 'Enable'
    });
    this.add('PiwikAnalytics_url', '', {
      type: 'string',
      public: true,
      i18nLabel: 'URL',
      enableQuery
    });
    this.add('PiwikAnalytics_siteId', '', {
      type: 'string',
      public: true,
      i18nLabel: 'Client_ID',
      enableQuery
    });
    this.add('PiwikAdditionalTrackers', '', {
      type: 'string',
      multiline: true,
      public: true,
      i18nLabel: 'PiwikAdditionalTrackers',
      enableQuery
    });
    this.add('PiwikAnalytics_prependDomain', false, {
      type: 'boolean',
      public: true,
      i18nLabel: 'PiwikAnalytics_prependDomain',
      enableQuery
    });
    this.add('PiwikAnalytics_cookieDomain', false, {
      type: 'boolean',
      public: true,
      i18nLabel: 'PiwikAnalytics_cookieDomain',
      enableQuery
    });
    this.add('PiwikAnalytics_domains', '', {
      type: 'string',
      multiline: true,
      public: true,
      i18nLabel: 'PiwikAnalytics_domains',
      enableQuery
    });
  });
  this.section('Analytics_Google', function () {
    const enableQuery = {
      _id: 'GoogleAnalytics_enabled',
      value: true
    };
    this.add('GoogleAnalytics_enabled', false, {
      type: 'boolean',
      public: true,
      i18nLabel: 'Enable'
    });
    this.add('GoogleAnalytics_ID', '', {
      type: 'string',
      public: true,
      i18nLabel: 'Analytics_Google_id',
      enableQuery
    });
  });
  this.section('Analytics_features_enabled', function addFeaturesEnabledSettings() {
    this.add('Analytics_features_messages', true, {
      type: 'boolean',
      public: true,
      i18nLabel: 'Messages',
      i18nDescription: 'Analytics_features_messages_Description'
    });
    this.add('Analytics_features_rooms', true, {
      type: 'boolean',
      public: true,
      i18nLabel: 'Rooms',
      i18nDescription: 'Analytics_features_rooms_Description'
    });
    this.add('Analytics_features_users', true, {
      type: 'boolean',
      public: true,
      i18nLabel: 'Users',
      i18nDescription: 'Analytics_features_users_Description'
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:analytics/server/settings.js");

/* Exports */
Package._define("rocketchat:analytics");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_analytics.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphbmFseXRpY3Mvc2VydmVyL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZEdyb3VwIiwiYWRkU2V0dGluZ3MiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJpMThuTGFiZWwiLCJtdWx0aWxpbmUiLCJhZGRGZWF0dXJlc0VuYWJsZWRTZXR0aW5ncyIsImkxOG5EZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixXQUE3QixFQUEwQyxTQUFTQyxXQUFULEdBQXVCO0FBQ2hFLE9BQUtDLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLFlBQVc7QUFDaEMsVUFBTUMsY0FBYztBQUFDQyxXQUFLLHdCQUFOO0FBQWdDQyxhQUFPO0FBQXZDLEtBQXBCO0FBQ0EsU0FBS0MsR0FBTCxDQUFTLHdCQUFULEVBQW1DLEtBQW5DLEVBQTBDO0FBQ3pDQyxZQUFNLFNBRG1DO0FBRXpDQyxjQUFRLElBRmlDO0FBR3pDQyxpQkFBVztBQUg4QixLQUExQztBQUtBLFNBQUtILEdBQUwsQ0FBUyxvQkFBVCxFQUErQixFQUEvQixFQUFtQztBQUNsQ0MsWUFBTSxRQUQ0QjtBQUVsQ0MsY0FBUSxJQUYwQjtBQUdsQ0MsaUJBQVcsS0FIdUI7QUFJbENOO0FBSmtDLEtBQW5DO0FBTUEsU0FBS0csR0FBTCxDQUFTLHVCQUFULEVBQWtDLEVBQWxDLEVBQXNDO0FBQ3JDQyxZQUFNLFFBRCtCO0FBRXJDQyxjQUFRLElBRjZCO0FBR3JDQyxpQkFBVyxXQUgwQjtBQUlyQ047QUFKcUMsS0FBdEM7QUFNQSxTQUFLRyxHQUFMLENBQVMseUJBQVQsRUFBb0MsRUFBcEMsRUFBd0M7QUFDdkNDLFlBQU0sUUFEaUM7QUFFdkNHLGlCQUFXLElBRjRCO0FBR3ZDRixjQUFRLElBSCtCO0FBSXZDQyxpQkFBVyx5QkFKNEI7QUFLdkNOO0FBTHVDLEtBQXhDO0FBT0EsU0FBS0csR0FBTCxDQUFTLDhCQUFULEVBQXlDLEtBQXpDLEVBQWdEO0FBQy9DQyxZQUFNLFNBRHlDO0FBRS9DQyxjQUFRLElBRnVDO0FBRy9DQyxpQkFBVyw4QkFIb0M7QUFJL0NOO0FBSitDLEtBQWhEO0FBTUEsU0FBS0csR0FBTCxDQUFTLDZCQUFULEVBQXdDLEtBQXhDLEVBQStDO0FBQzlDQyxZQUFNLFNBRHdDO0FBRTlDQyxjQUFRLElBRnNDO0FBRzlDQyxpQkFBVyw2QkFIbUM7QUFJOUNOO0FBSjhDLEtBQS9DO0FBTUEsU0FBS0csR0FBTCxDQUFTLHdCQUFULEVBQW1DLEVBQW5DLEVBQXVDO0FBQ3RDQyxZQUFNLFFBRGdDO0FBRXRDRyxpQkFBVyxJQUYyQjtBQUd0Q0YsY0FBUSxJQUg4QjtBQUl0Q0MsaUJBQVcsd0JBSjJCO0FBS3RDTjtBQUxzQyxLQUF2QztBQU9BLEdBN0NEO0FBK0NBLE9BQUtELE9BQUwsQ0FBYSxrQkFBYixFQUFpQyxZQUFXO0FBQzNDLFVBQU1DLGNBQWM7QUFBQ0MsV0FBSyx5QkFBTjtBQUFpQ0MsYUFBTztBQUF4QyxLQUFwQjtBQUNBLFNBQUtDLEdBQUwsQ0FBUyx5QkFBVCxFQUFvQyxLQUFwQyxFQUEyQztBQUMxQ0MsWUFBTSxTQURvQztBQUUxQ0MsY0FBUSxJQUZrQztBQUcxQ0MsaUJBQVc7QUFIK0IsS0FBM0M7QUFNQSxTQUFLSCxHQUFMLENBQVMsb0JBQVQsRUFBK0IsRUFBL0IsRUFBbUM7QUFDbENDLFlBQU0sUUFENEI7QUFFbENDLGNBQVEsSUFGMEI7QUFHbENDLGlCQUFXLHFCQUh1QjtBQUlsQ047QUFKa0MsS0FBbkM7QUFNQSxHQWREO0FBZ0JBLE9BQUtELE9BQUwsQ0FBYSw0QkFBYixFQUEyQyxTQUFTUywwQkFBVCxHQUFzQztBQUNoRixTQUFLTCxHQUFMLENBQVMsNkJBQVQsRUFBd0MsSUFBeEMsRUFBOEM7QUFDN0NDLFlBQU0sU0FEdUM7QUFFN0NDLGNBQVEsSUFGcUM7QUFHN0NDLGlCQUFXLFVBSGtDO0FBSTdDRyx1QkFBaUI7QUFKNEIsS0FBOUM7QUFNQSxTQUFLTixHQUFMLENBQVMsMEJBQVQsRUFBcUMsSUFBckMsRUFBMkM7QUFDMUNDLFlBQU0sU0FEb0M7QUFFMUNDLGNBQVEsSUFGa0M7QUFHMUNDLGlCQUFXLE9BSCtCO0FBSTFDRyx1QkFBaUI7QUFKeUIsS0FBM0M7QUFNQSxTQUFLTixHQUFMLENBQVMsMEJBQVQsRUFBcUMsSUFBckMsRUFBMkM7QUFDMUNDLFlBQU0sU0FEb0M7QUFFMUNDLGNBQVEsSUFGa0M7QUFHMUNDLGlCQUFXLE9BSCtCO0FBSTFDRyx1QkFBaUI7QUFKeUIsS0FBM0M7QUFNQSxHQW5CRDtBQW9CQSxDQXBGRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FuYWx5dGljcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0FuYWx5dGljcycsIGZ1bmN0aW9uIGFkZFNldHRpbmdzKCkge1xuXHR0aGlzLnNlY3Rpb24oJ1Bpd2lrJywgZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgZW5hYmxlUXVlcnkgPSB7X2lkOiAnUGl3aWtBbmFseXRpY3NfZW5hYmxlZCcsIHZhbHVlOiB0cnVlfTtcblx0XHR0aGlzLmFkZCgnUGl3aWtBbmFseXRpY3NfZW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRwdWJsaWM6IHRydWUsXG5cdFx0XHRpMThuTGFiZWw6ICdFbmFibGUnXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ1Bpd2lrQW5hbHl0aWNzX3VybCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRcdGkxOG5MYWJlbDogJ1VSTCcsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdQaXdpa0FuYWx5dGljc19zaXRlSWQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRwdWJsaWM6IHRydWUsXG5cdFx0XHRpMThuTGFiZWw6ICdDbGllbnRfSUQnLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnUGl3aWtBZGRpdGlvbmFsVHJhY2tlcnMnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRtdWx0aWxpbmU6IHRydWUsXG5cdFx0XHRwdWJsaWM6IHRydWUsXG5cdFx0XHRpMThuTGFiZWw6ICdQaXdpa0FkZGl0aW9uYWxUcmFja2VycycsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdQaXdpa0FuYWx5dGljc19wcmVwZW5kRG9tYWluJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRcdGkxOG5MYWJlbDogJ1Bpd2lrQW5hbHl0aWNzX3ByZXBlbmREb21haW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnUGl3aWtBbmFseXRpY3NfY29va2llRG9tYWluJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRcdGkxOG5MYWJlbDogJ1Bpd2lrQW5hbHl0aWNzX2Nvb2tpZURvbWFpbicsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdQaXdpa0FuYWx5dGljc19kb21haW5zJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0cHVibGljOiB0cnVlLFxuXHRcdFx0aTE4bkxhYmVsOiAnUGl3aWtBbmFseXRpY3NfZG9tYWlucycsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLnNlY3Rpb24oJ0FuYWx5dGljc19Hb29nbGUnLCBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBlbmFibGVRdWVyeSA9IHtfaWQ6ICdHb29nbGVBbmFseXRpY3NfZW5hYmxlZCcsIHZhbHVlOiB0cnVlfTtcblx0XHR0aGlzLmFkZCgnR29vZ2xlQW5hbHl0aWNzX2VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0cHVibGljOiB0cnVlLFxuXHRcdFx0aTE4bkxhYmVsOiAnRW5hYmxlJ1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ0dvb2dsZUFuYWx5dGljc19JRCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRcdGkxOG5MYWJlbDogJ0FuYWx5dGljc19Hb29nbGVfaWQnLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdBbmFseXRpY3NfZmVhdHVyZXNfZW5hYmxlZCcsIGZ1bmN0aW9uIGFkZEZlYXR1cmVzRW5hYmxlZFNldHRpbmdzKCkge1xuXHRcdHRoaXMuYWRkKCdBbmFseXRpY3NfZmVhdHVyZXNfbWVzc2FnZXMnLCB0cnVlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRwdWJsaWM6IHRydWUsXG5cdFx0XHRpMThuTGFiZWw6ICdNZXNzYWdlcycsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdBbmFseXRpY3NfZmVhdHVyZXNfbWVzc2FnZXNfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0FuYWx5dGljc19mZWF0dXJlc19yb29tcycsIHRydWUsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRcdGkxOG5MYWJlbDogJ1Jvb21zJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0FuYWx5dGljc19mZWF0dXJlc19yb29tc19EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnQW5hbHl0aWNzX2ZlYXR1cmVzX3VzZXJzJywgdHJ1ZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0cHVibGljOiB0cnVlLFxuXHRcdFx0aTE4bkxhYmVsOiAnVXNlcnMnLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnQW5hbHl0aWNzX2ZlYXR1cmVzX3VzZXJzX0Rlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19
