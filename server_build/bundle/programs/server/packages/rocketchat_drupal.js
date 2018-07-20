(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:drupal":{"common.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/rocketchat_drupal/common.js                                                      //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
/* global CustomOAuth */
// Drupal Server CallBack URL needs to be http(s)://{rocketchat.server}[:port]/_oauth/drupal
// In RocketChat -> Administration the URL needs to be http(s)://{drupal.server}/
const config = {
  serverURL: '',
  identityPath: '/oauth2/UserInfo',
  authorizePath: '/oauth2/authorize',
  tokenPath: '/oauth2/token',
  scope: 'openid email profile offline_access',
  tokenSentVia: 'payload',
  usernameField: 'preferred_username',
  mergeUsers: true,
  addAutopublishFields: {
    forLoggedInUser: ['services.drupal'],
    forOtherUsers: ['services.drupal.name']
  }
};
const Drupal = new CustomOAuth('drupal', config);

if (Meteor.isServer) {
  Meteor.startup(function () {
    RocketChat.settings.get('API_Drupal_URL', function (key, value) {
      config.serverURL = value;
      Drupal.configure(config);
    });
  });
} else {
  Meteor.startup(function () {
    Tracker.autorun(function () {
      if (RocketChat.settings.get('API_Drupal_URL')) {
        config.serverURL = RocketChat.settings.get('API_Drupal_URL');
        Drupal.configure(config);
      }
    });
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/rocketchat_drupal/startup.js                                                     //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
RocketChat.settings.addGroup('OAuth', function () {
  this.section('Drupal', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Drupal',
      value: true
    };
    this.add('Accounts_OAuth_Drupal', false, {
      type: 'boolean'
    });
    this.add('API_Drupal_URL', '', {
      type: 'string',
      public: true,
      enableQuery,
      i18nDescription: 'API_Drupal_URL_Description'
    });
    this.add('Accounts_OAuth_Drupal_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Drupal_secret', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Drupal_callback_url', '_oauth/drupal', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:drupal/common.js");
require("/node_modules/meteor/rocketchat:drupal/startup.js");

/* Exports */
Package._define("rocketchat:drupal");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_drupal.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpkcnVwYWwvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmRydXBhbC9zdGFydHVwLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsImF1dGhvcml6ZVBhdGgiLCJ0b2tlblBhdGgiLCJzY29wZSIsInRva2VuU2VudFZpYSIsInVzZXJuYW1lRmllbGQiLCJtZXJnZVVzZXJzIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwiRHJ1cGFsIiwiQ3VzdG9tT0F1dGgiLCJNZXRlb3IiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJ2YWx1ZSIsImNvbmZpZ3VyZSIsIlRyYWNrZXIiLCJhdXRvcnVuIiwiYWRkR3JvdXAiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiaTE4bkRlc2NyaXB0aW9uIiwicmVhZG9ubHkiLCJmb3JjZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQTtBQUNBO0FBRUEsTUFBTUEsU0FBUztBQUNkQyxhQUFXLEVBREc7QUFFZEMsZ0JBQWMsa0JBRkE7QUFHZEMsaUJBQWUsbUJBSEQ7QUFJZEMsYUFBVyxlQUpHO0FBS2RDLFNBQU8scUNBTE87QUFNZEMsZ0JBQWMsU0FOQTtBQU9kQyxpQkFBZSxvQkFQRDtBQVFkQyxjQUFZLElBUkU7QUFTZEMsd0JBQXNCO0FBQ3JCQyxxQkFBaUIsQ0FBQyxpQkFBRCxDQURJO0FBRXJCQyxtQkFBZSxDQUFDLHNCQUFEO0FBRk07QUFUUixDQUFmO0FBZUEsTUFBTUMsU0FBUyxJQUFJQyxXQUFKLENBQWdCLFFBQWhCLEVBQTBCYixNQUExQixDQUFmOztBQUVBLElBQUljLE9BQU9DLFFBQVgsRUFBcUI7QUFDcEJELFNBQU9FLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCQyxlQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixnQkFBeEIsRUFBMEMsVUFBU0MsR0FBVCxFQUFjQyxLQUFkLEVBQXFCO0FBQzlEckIsYUFBT0MsU0FBUCxHQUFtQm9CLEtBQW5CO0FBQ0FULGFBQU9VLFNBQVAsQ0FBaUJ0QixNQUFqQjtBQUNBLEtBSEQ7QUFJQSxHQUxEO0FBTUEsQ0FQRCxNQU9PO0FBQ05jLFNBQU9FLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCTyxZQUFRQyxPQUFSLENBQWdCLFlBQVc7QUFDMUIsVUFBSVAsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsZ0JBQXhCLENBQUosRUFBK0M7QUFDOUNuQixlQUFPQyxTQUFQLEdBQW1CZ0IsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsZ0JBQXhCLENBQW5CO0FBQ0FQLGVBQU9VLFNBQVAsQ0FBaUJ0QixNQUFqQjtBQUNBO0FBQ0QsS0FMRDtBQU1BLEdBUEQ7QUFRQSxDOzs7Ozs7Ozs7OztBQ3RDRGlCLFdBQVdDLFFBQVgsQ0FBb0JPLFFBQXBCLENBQTZCLE9BQTdCLEVBQXNDLFlBQVc7QUFDaEQsT0FBS0MsT0FBTCxDQUFhLFFBQWIsRUFBdUIsWUFBVztBQUNqQyxVQUFNQyxjQUFjO0FBQ25CQyxXQUFLLHVCQURjO0FBRW5CUCxhQUFPO0FBRlksS0FBcEI7QUFLQSxTQUFLUSxHQUFMLENBQVMsdUJBQVQsRUFBa0MsS0FBbEMsRUFBeUM7QUFBRUMsWUFBTTtBQUFSLEtBQXpDO0FBQ0EsU0FBS0QsR0FBTCxDQUFTLGdCQUFULEVBQTJCLEVBQTNCLEVBQStCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkMsY0FBUSxJQUExQjtBQUFnQ0osaUJBQWhDO0FBQTZDSyx1QkFBaUI7QUFBOUQsS0FBL0I7QUFDQSxTQUFLSCxHQUFMLENBQVMsMEJBQVQsRUFBcUMsRUFBckMsRUFBeUM7QUFBRUMsWUFBTSxRQUFSO0FBQWtCSDtBQUFsQixLQUF6QztBQUNBLFNBQUtFLEdBQUwsQ0FBUyw4QkFBVCxFQUF5QyxFQUF6QyxFQUE2QztBQUFFQyxZQUFNLFFBQVI7QUFBa0JIO0FBQWxCLEtBQTdDO0FBQ0EsU0FBS0UsR0FBTCxDQUFTLG9DQUFULEVBQStDLGVBQS9DLEVBQWdFO0FBQUVDLFlBQU0sYUFBUjtBQUF1QkcsZ0JBQVUsSUFBakM7QUFBdUNDLGFBQU8sSUFBOUM7QUFBb0RQO0FBQXBELEtBQWhFO0FBQ0EsR0FYRDtBQVlBLENBYkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9kcnVwYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgQ3VzdG9tT0F1dGggKi9cblxuLy8gRHJ1cGFsIFNlcnZlciBDYWxsQmFjayBVUkwgbmVlZHMgdG8gYmUgaHR0cChzKTovL3tyb2NrZXRjaGF0LnNlcnZlcn1bOnBvcnRdL19vYXV0aC9kcnVwYWxcbi8vIEluIFJvY2tldENoYXQgLT4gQWRtaW5pc3RyYXRpb24gdGhlIFVSTCBuZWVkcyB0byBiZSBodHRwKHMpOi8ve2RydXBhbC5zZXJ2ZXJ9L1xuXG5jb25zdCBjb25maWcgPSB7XG5cdHNlcnZlclVSTDogJycsXG5cdGlkZW50aXR5UGF0aDogJy9vYXV0aDIvVXNlckluZm8nLFxuXHRhdXRob3JpemVQYXRoOiAnL29hdXRoMi9hdXRob3JpemUnLFxuXHR0b2tlblBhdGg6ICcvb2F1dGgyL3Rva2VuJyxcblx0c2NvcGU6ICdvcGVuaWQgZW1haWwgcHJvZmlsZSBvZmZsaW5lX2FjY2VzcycsXG5cdHRva2VuU2VudFZpYTogJ3BheWxvYWQnLFxuXHR1c2VybmFtZUZpZWxkOiAncHJlZmVycmVkX3VzZXJuYW1lJyxcblx0bWVyZ2VVc2VyczogdHJ1ZSxcblx0YWRkQXV0b3B1Ymxpc2hGaWVsZHM6IHtcblx0XHRmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMuZHJ1cGFsJ10sXG5cdFx0Zm9yT3RoZXJVc2VyczogWydzZXJ2aWNlcy5kcnVwYWwubmFtZSddXG5cdH1cbn07XG5cbmNvbnN0IERydXBhbCA9IG5ldyBDdXN0b21PQXV0aCgnZHJ1cGFsJywgY29uZmlnKTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0RydXBhbF9VUkwnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0XHRjb25maWcuc2VydmVyVVJMID0gdmFsdWU7XG5cdFx0XHREcnVwYWwuY29uZmlndXJlKGNvbmZpZyk7XG5cdFx0fSk7XG5cdH0pO1xufSBlbHNlIHtcblx0TWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFx0VHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRHJ1cGFsX1VSTCcpKSB7XG5cdFx0XHRcdGNvbmZpZy5zZXJ2ZXJVUkwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0RydXBhbF9VUkwnKTtcblx0XHRcdFx0RHJ1cGFsLmNvbmZpZ3VyZShjb25maWcpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ09BdXRoJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VjdGlvbignRHJ1cGFsJywgZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgZW5hYmxlUXVlcnkgPSB7XG5cdFx0XHRfaWQ6ICdBY2NvdW50c19PQXV0aF9EcnVwYWwnLFxuXHRcdFx0dmFsdWU6IHRydWVcblx0XHR9O1xuXG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX0RydXBhbCcsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJyB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX0RydXBhbF9VUkwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiB0cnVlLCBlbmFibGVRdWVyeSwgaTE4bkRlc2NyaXB0aW9uOiAnQVBJX0RydXBhbF9VUkxfRGVzY3JpcHRpb24nIH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9EcnVwYWxfaWQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX0RydXBhbF9zZWNyZXQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX0RydXBhbF9jYWxsYmFja191cmwnLCAnX29hdXRoL2RydXBhbCcsIHsgdHlwZTogJ3JlbGF0aXZlVXJsJywgcmVhZG9ubHk6IHRydWUsIGZvcmNlOiB0cnVlLCBlbmFibGVRdWVyeSB9KTtcblx0fSk7XG59KTtcbiJdfQ==
