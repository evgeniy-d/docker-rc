(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:gitlab":{"common.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/rocketchat_gitlab/common.js                                                          //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
/* global CustomOAuth */
const config = {
  serverURL: 'https://gitlab.com',
  identityPath: '/api/v3/user',
  scope: 'read_user',
  addAutopublishFields: {
    forLoggedInUser: ['services.gitlab'],
    forOtherUsers: ['services.gitlab.username']
  }
};
const Gitlab = new CustomOAuth('gitlab', config);

if (Meteor.isServer) {
  Meteor.startup(function () {
    RocketChat.settings.get('API_Gitlab_URL', function (key, value) {
      config.serverURL = value.trim().replace(/\/*$/, '');
      Gitlab.configure(config);
    });
  });
} else {
  Meteor.startup(function () {
    Tracker.autorun(function () {
      if (RocketChat.settings.get('API_Gitlab_URL')) {
        config.serverURL = RocketChat.settings.get('API_Gitlab_URL').trim().replace(/\/*$/, '');
        Gitlab.configure(config);
      }
    });
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/rocketchat_gitlab/startup.js                                                         //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
RocketChat.settings.addGroup('OAuth', function () {
  this.section('GitLab', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Gitlab',
      value: true
    };
    this.add('Accounts_OAuth_Gitlab', false, {
      type: 'boolean',
      public: true
    });
    this.add('API_Gitlab_URL', '', {
      type: 'string',
      enableQuery,
      public: true
    });
    this.add('Accounts_OAuth_Gitlab_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Gitlab_secret', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Gitlab_callback_url', '_oauth/gitlab', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:gitlab/common.js");
require("/node_modules/meteor/rocketchat:gitlab/startup.js");

/* Exports */
Package._define("rocketchat:gitlab");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_gitlab.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpnaXRsYWIvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdpdGxhYi9zdGFydHVwLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsInNjb3BlIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwiR2l0bGFiIiwiQ3VzdG9tT0F1dGgiLCJNZXRlb3IiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJ2YWx1ZSIsInRyaW0iLCJyZXBsYWNlIiwiY29uZmlndXJlIiwiVHJhY2tlciIsImF1dG9ydW4iLCJhZGRHcm91cCIsInNlY3Rpb24iLCJlbmFibGVRdWVyeSIsIl9pZCIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJyZWFkb25seSIsImZvcmNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0EsTUFBTUEsU0FBUztBQUNkQyxhQUFXLG9CQURHO0FBRWRDLGdCQUFjLGNBRkE7QUFHZEMsU0FBTyxXQUhPO0FBSWRDLHdCQUFzQjtBQUNyQkMscUJBQWlCLENBQUMsaUJBQUQsQ0FESTtBQUVyQkMsbUJBQWUsQ0FBQywwQkFBRDtBQUZNO0FBSlIsQ0FBZjtBQVVBLE1BQU1DLFNBQVMsSUFBSUMsV0FBSixDQUFnQixRQUFoQixFQUEwQlIsTUFBMUIsQ0FBZjs7QUFFQSxJQUFJUyxPQUFPQyxRQUFYLEVBQXFCO0FBQ3BCRCxTQUFPRSxPQUFQLENBQWUsWUFBVztBQUN6QkMsZUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsZ0JBQXhCLEVBQTBDLFVBQVNDLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUM5RGhCLGFBQU9DLFNBQVAsR0FBbUJlLE1BQU1DLElBQU4sR0FBYUMsT0FBYixDQUFxQixNQUFyQixFQUE2QixFQUE3QixDQUFuQjtBQUNBWCxhQUFPWSxTQUFQLENBQWlCbkIsTUFBakI7QUFDQSxLQUhEO0FBSUEsR0FMRDtBQU1BLENBUEQsTUFPTztBQUNOUyxTQUFPRSxPQUFQLENBQWUsWUFBVztBQUN6QlMsWUFBUUMsT0FBUixDQUFnQixZQUFXO0FBQzFCLFVBQUlULFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLGdCQUF4QixDQUFKLEVBQStDO0FBQzlDZCxlQUFPQyxTQUFQLEdBQW1CVyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixnQkFBeEIsRUFBMENHLElBQTFDLEdBQWlEQyxPQUFqRCxDQUF5RCxNQUF6RCxFQUFpRSxFQUFqRSxDQUFuQjtBQUNBWCxlQUFPWSxTQUFQLENBQWlCbkIsTUFBakI7QUFDQTtBQUNELEtBTEQ7QUFNQSxHQVBEO0FBUUEsQzs7Ozs7Ozs7Ozs7QUM3QkRZLFdBQVdDLFFBQVgsQ0FBb0JTLFFBQXBCLENBQTZCLE9BQTdCLEVBQXNDLFlBQVc7QUFDaEQsT0FBS0MsT0FBTCxDQUFhLFFBQWIsRUFBdUIsWUFBVztBQUNqQyxVQUFNQyxjQUFjO0FBQ25CQyxXQUFLLHVCQURjO0FBRW5CVCxhQUFPO0FBRlksS0FBcEI7QUFLQSxTQUFLVSxHQUFMLENBQVMsdUJBQVQsRUFBa0MsS0FBbEMsRUFBeUM7QUFBRUMsWUFBTSxTQUFSO0FBQW1CQyxjQUFRO0FBQTNCLEtBQXpDO0FBQ0EsU0FBS0YsR0FBTCxDQUFTLGdCQUFULEVBQTJCLEVBQTNCLEVBQStCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkgsaUJBQWxCO0FBQStCSSxjQUFRO0FBQXZDLEtBQS9CO0FBQ0EsU0FBS0YsR0FBTCxDQUFTLDBCQUFULEVBQXFDLEVBQXJDLEVBQXlDO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkg7QUFBbEIsS0FBekM7QUFDQSxTQUFLRSxHQUFMLENBQVMsOEJBQVQsRUFBeUMsRUFBekMsRUFBNkM7QUFBRUMsWUFBTSxRQUFSO0FBQWtCSDtBQUFsQixLQUE3QztBQUNBLFNBQUtFLEdBQUwsQ0FBUyxvQ0FBVCxFQUErQyxlQUEvQyxFQUFnRTtBQUFFQyxZQUFNLGFBQVI7QUFBdUJFLGdCQUFVLElBQWpDO0FBQXVDQyxhQUFPLElBQTlDO0FBQW9ETjtBQUFwRCxLQUFoRTtBQUNBLEdBWEQ7QUFZQSxDQWJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZ2l0bGFiLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIEN1c3RvbU9BdXRoICovXG5jb25zdCBjb25maWcgPSB7XG5cdHNlcnZlclVSTDogJ2h0dHBzOi8vZ2l0bGFiLmNvbScsXG5cdGlkZW50aXR5UGF0aDogJy9hcGkvdjMvdXNlcicsXG5cdHNjb3BlOiAncmVhZF91c2VyJyxcblx0YWRkQXV0b3B1Ymxpc2hGaWVsZHM6IHtcblx0XHRmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMuZ2l0bGFiJ10sXG5cdFx0Zm9yT3RoZXJVc2VyczogWydzZXJ2aWNlcy5naXRsYWIudXNlcm5hbWUnXVxuXHR9XG59O1xuXG5jb25zdCBHaXRsYWIgPSBuZXcgQ3VzdG9tT0F1dGgoJ2dpdGxhYicsIGNvbmZpZyk7XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0TWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9HaXRsYWJfVVJMJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdFx0Y29uZmlnLnNlcnZlclVSTCA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9cXC8qJC8sICcnKTtcblx0XHRcdEdpdGxhYi5jb25maWd1cmUoY29uZmlnKTtcblx0XHR9KTtcblx0fSk7XG59IGVsc2Uge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRUcmFja2VyLmF1dG9ydW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9HaXRsYWJfVVJMJykpIHtcblx0XHRcdFx0Y29uZmlnLnNlcnZlclVSTCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfR2l0bGFiX1VSTCcpLnRyaW0oKS5yZXBsYWNlKC9cXC8qJC8sICcnKTtcblx0XHRcdFx0R2l0bGFiLmNvbmZpZ3VyZShjb25maWcpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ09BdXRoJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VjdGlvbignR2l0TGFiJywgZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgZW5hYmxlUXVlcnkgPSB7XG5cdFx0XHRfaWQ6ICdBY2NvdW50c19PQXV0aF9HaXRsYWInLFxuXHRcdFx0dmFsdWU6IHRydWVcblx0XHR9O1xuXG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX0dpdGxhYicsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfR2l0bGFiX1VSTCcsICcnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeSwgcHVibGljOiB0cnVlIH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9HaXRsYWJfaWQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX0dpdGxhYl9zZWNyZXQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX0dpdGxhYl9jYWxsYmFja191cmwnLCAnX29hdXRoL2dpdGxhYicsIHsgdHlwZTogJ3JlbGF0aXZlVXJsJywgcmVhZG9ubHk6IHRydWUsIGZvcmNlOiB0cnVlLCBlbmFibGVRdWVyeSB9KTtcblx0fSk7XG59KTtcbiJdfQ==
