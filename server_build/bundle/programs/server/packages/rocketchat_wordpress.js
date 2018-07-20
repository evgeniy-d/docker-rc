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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:wordpress":{"common.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/rocketchat_wordpress/common.js                                                                         //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const config = {
  serverURL: '',
  identityPath: '/oauth/me',
  addAutopublishFields: {
    forLoggedInUser: ['services.wordpress'],
    forOtherUsers: ['services.wordpress.user_login']
  }
};
const WordPress = new CustomOAuth('wordpress', config);

const fillSettings = _.debounce(Meteor.bindEnvironment(() => {
  config.serverURL = RocketChat.settings.get('API_Wordpress_URL');

  if (!config.serverURL) {
    if (config.serverURL === undefined) {
      return fillSettings();
    }

    return;
  }

  delete config.identityPath;
  delete config.identityTokenSentVia;
  delete config.authorizePath;
  delete config.tokenPath;
  delete config.scope;
  const serverType = RocketChat.settings.get('Accounts_OAuth_Wordpress_server_type');

  switch (serverType) {
    case 'custom':
      if (RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_path')) {
        config.identityPath = RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_path');
      }

      if (RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_token_sent_via')) {
        config.identityTokenSentVia = RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_token_sent_via');
      }

      if (RocketChat.settings.get('Accounts_OAuth_Wordpress_token_path')) {
        config.tokenPath = RocketChat.settings.get('Accounts_OAuth_Wordpress_token_path');
      }

      if (RocketChat.settings.get('Accounts_OAuth_Wordpress_authorize_path')) {
        config.authorizePath = RocketChat.settings.get('Accounts_OAuth_Wordpress_authorize_path');
      }

      if (RocketChat.settings.get('Accounts_OAuth_Wordpress_scope')) {
        config.scope = RocketChat.settings.get('Accounts_OAuth_Wordpress_scope');
      }

      break;

    case 'wordpress-com':
      config.identityPath = 'https://public-api.wordpress.com/rest/v1/me';
      config.identityTokenSentVia = 'header';
      config.authorizePath = 'https://public-api.wordpress.com/oauth2/authorize';
      config.tokenPath = 'https://public-api.wordpress.com/oauth2/token';
      config.scope = 'auth';
      break;

    default:
      config.identityPath = '/oauth/me';
      break;
  }

  const result = WordPress.configure(config);

  if (Meteor.isServer) {
    const enabled = RocketChat.settings.get('Accounts_OAuth_Wordpress');

    if (enabled) {
      ServiceConfiguration.configurations.upsert({
        service: 'wordpress'
      }, {
        $set: config
      });
    } else {
      ServiceConfiguration.configurations.remove({
        service: 'wordpress'
      });
    }
  }

  return result;
}), Meteor.isServer ? 1000 : 100);

if (Meteor.isServer) {
  Meteor.startup(function () {
    return RocketChat.settings.get(/(API\_Wordpress\_URL)?(Accounts\_OAuth\_Wordpress\_)?/, () => fillSettings());
  });
} else {
  Meteor.startup(function () {
    return Tracker.autorun(function () {
      return fillSettings();
    });
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/rocketchat_wordpress/startup.js                                                                        //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
RocketChat.settings.addGroup('OAuth', function () {
  return this.section('WordPress', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Wordpress',
      value: true
    };
    this.add('Accounts_OAuth_Wordpress', false, {
      type: 'boolean',
      'public': true
    });
    this.add('API_Wordpress_URL', '', {
      type: 'string',
      enableQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Wordpress_secret', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Wordpress_server_type', '', {
      type: 'select',
      enableQuery,
      'public': true,
      values: [{
        key: 'wordpress-com',
        i18nLabel: 'Accounts_OAuth_Wordpress_server_type_wordpress_com'
      }, {
        key: 'wp-oauth-server',
        i18nLabel: 'Accounts_OAuth_Wordpress_server_type_wp_oauth_server'
      }, {
        key: 'custom',
        i18nLabel: 'Accounts_OAuth_Wordpress_server_type_custom'
      }],
      i18nLabel: 'Server_Type'
    });
    const customOAuthQuery = [{
      _id: 'Accounts_OAuth_Wordpress',
      value: true
    }, {
      _id: 'Accounts_OAuth_Wordpress_server_type',
      value: 'custom'
    }];
    this.add('Accounts_OAuth_Wordpress_identity_path', '', {
      type: 'string',
      enableQuery: customOAuthQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_identity_token_sent_via', '', {
      type: 'string',
      enableQuery: customOAuthQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_token_path', '', {
      type: 'string',
      enableQuery: customOAuthQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_authorize_path', '', {
      type: 'string',
      enableQuery: customOAuthQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_scope', '', {
      type: 'string',
      enableQuery: customOAuthQuery,
      'public': true
    });
    return this.add('Accounts_OAuth_Wordpress_callback_url', '_oauth/wordpress', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:wordpress/common.js");
require("/node_modules/meteor/rocketchat:wordpress/startup.js");

/* Exports */
Package._define("rocketchat:wordpress");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_wordpress.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp3b3JkcHJlc3MvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OndvcmRwcmVzcy9zdGFydHVwLmpzIl0sIm5hbWVzIjpbIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsImFkZEF1dG9wdWJsaXNoRmllbGRzIiwiZm9yTG9nZ2VkSW5Vc2VyIiwiZm9yT3RoZXJVc2VycyIsIldvcmRQcmVzcyIsIkN1c3RvbU9BdXRoIiwiZmlsbFNldHRpbmdzIiwiZGVib3VuY2UiLCJNZXRlb3IiLCJiaW5kRW52aXJvbm1lbnQiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJ1bmRlZmluZWQiLCJpZGVudGl0eVRva2VuU2VudFZpYSIsImF1dGhvcml6ZVBhdGgiLCJ0b2tlblBhdGgiLCJzY29wZSIsInNlcnZlclR5cGUiLCJyZXN1bHQiLCJjb25maWd1cmUiLCJpc1NlcnZlciIsImVuYWJsZWQiLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwidXBzZXJ0Iiwic2VydmljZSIsIiRzZXQiLCJyZW1vdmUiLCJzdGFydHVwIiwiVHJhY2tlciIsImF1dG9ydW4iLCJhZGRHcm91cCIsInNlY3Rpb24iLCJlbmFibGVRdWVyeSIsIl9pZCIsInZhbHVlIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImN1c3RvbU9BdXRoUXVlcnkiLCJyZWFkb25seSIsImZvcmNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7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QUwsQ0FBUyxnQ0FBVCxFQUEyQyxFQUEzQyxFQUErQztBQUM5Q0MsWUFBTSxRQUR3QztBQUU5Q0osbUJBQWFRLGdCQUZpQztBQUc5QyxnQkFBVTtBQUhvQyxLQUEvQztBQUtBLFdBQU8sS0FBS0wsR0FBTCxDQUFTLHVDQUFULEVBQWtELGtCQUFsRCxFQUFzRTtBQUM1RUMsWUFBTSxhQURzRTtBQUU1RUssZ0JBQVUsSUFGa0U7QUFHNUVDLGFBQU8sSUFIcUU7QUFJNUVWO0FBSjRFLEtBQXRFLENBQVA7QUFNQSxHQW5GTSxDQUFQO0FBb0ZBLENBckZELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfd29yZHByZXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBDdXN0b21PQXV0aCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmNvbnN0IGNvbmZpZyA9IHtcblx0c2VydmVyVVJMOiAnJyxcblx0aWRlbnRpdHlQYXRoOiAnL29hdXRoL21lJyxcblxuXHRhZGRBdXRvcHVibGlzaEZpZWxkczoge1xuXHRcdGZvckxvZ2dlZEluVXNlcjogWydzZXJ2aWNlcy53b3JkcHJlc3MnXSxcblx0XHRmb3JPdGhlclVzZXJzOiBbJ3NlcnZpY2VzLndvcmRwcmVzcy51c2VyX2xvZ2luJ11cblx0fVxufTtcblxuY29uc3QgV29yZFByZXNzID0gbmV3IEN1c3RvbU9BdXRoKCd3b3JkcHJlc3MnLCBjb25maWcpO1xuXG5jb25zdCBmaWxsU2V0dGluZ3MgPSBfLmRlYm91bmNlKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRjb25maWcuc2VydmVyVVJMID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Xb3JkcHJlc3NfVVJMJyk7XG5cdGlmICghY29uZmlnLnNlcnZlclVSTCkge1xuXHRcdGlmIChjb25maWcuc2VydmVyVVJMID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBmaWxsU2V0dGluZ3MoKTtcblx0XHR9XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZGVsZXRlIGNvbmZpZy5pZGVudGl0eVBhdGg7XG5cdGRlbGV0ZSBjb25maWcuaWRlbnRpdHlUb2tlblNlbnRWaWE7XG5cdGRlbGV0ZSBjb25maWcuYXV0aG9yaXplUGF0aDtcblx0ZGVsZXRlIGNvbmZpZy50b2tlblBhdGg7XG5cdGRlbGV0ZSBjb25maWcuc2NvcGU7XG5cblx0Y29uc3Qgc2VydmVyVHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3Nfc2VydmVyX3R5cGUnKTtcblx0c3dpdGNoIChzZXJ2ZXJUeXBlKSB7XG5cdFx0Y2FzZSAnY3VzdG9tJzpcblx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzX2lkZW50aXR5X3BhdGgnKSkge1xuXHRcdFx0XHRjb25maWcuaWRlbnRpdHlQYXRoID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19pZGVudGl0eV9wYXRoJyk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzX2lkZW50aXR5X3Rva2VuX3NlbnRfdmlhJykpIHtcblx0XHRcdFx0Y29uZmlnLmlkZW50aXR5VG9rZW5TZW50VmlhID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19pZGVudGl0eV90b2tlbl9zZW50X3ZpYScpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc190b2tlbl9wYXRoJykpIHtcblx0XHRcdFx0Y29uZmlnLnRva2VuUGF0aCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3NfdG9rZW5fcGF0aCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19hdXRob3JpemVfcGF0aCcpKSB7XG5cdFx0XHRcdGNvbmZpZy5hdXRob3JpemVQYXRoID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19hdXRob3JpemVfcGF0aCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19zY29wZScpKSB7XG5cdFx0XHRcdGNvbmZpZy5zY29wZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3Nfc2NvcGUnKTtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ3dvcmRwcmVzcy1jb20nOlxuXHRcdFx0Y29uZmlnLmlkZW50aXR5UGF0aCA9ICdodHRwczovL3B1YmxpYy1hcGkud29yZHByZXNzLmNvbS9yZXN0L3YxL21lJztcblx0XHRcdGNvbmZpZy5pZGVudGl0eVRva2VuU2VudFZpYSA9ICdoZWFkZXInO1xuXHRcdFx0Y29uZmlnLmF1dGhvcml6ZVBhdGggPSAnaHR0cHM6Ly9wdWJsaWMtYXBpLndvcmRwcmVzcy5jb20vb2F1dGgyL2F1dGhvcml6ZSc7XG5cdFx0XHRjb25maWcudG9rZW5QYXRoID0gJ2h0dHBzOi8vcHVibGljLWFwaS53b3JkcHJlc3MuY29tL29hdXRoMi90b2tlbic7XG5cdFx0XHRjb25maWcuc2NvcGUgPSAnYXV0aCc7XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0Y29uZmlnLmlkZW50aXR5UGF0aCA9ICcvb2F1dGgvbWUnO1xuXHRcdFx0YnJlYWs7XG5cdH1cblxuXHRjb25zdCByZXN1bHQgPSBXb3JkUHJlc3MuY29uZmlndXJlKGNvbmZpZyk7XG5cdGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0XHRjb25zdCBlbmFibGVkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzcycpO1xuXHRcdGlmIChlbmFibGVkKSB7XG5cdFx0XHRTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy51cHNlcnQoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnd29yZHByZXNzJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHQkc2V0OiBjb25maWdcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5yZW1vdmUoe1xuXHRcdFx0XHRzZXJ2aWNlOiAnd29yZHByZXNzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn0pLCBNZXRlb3IuaXNTZXJ2ZXIgPyAxMDAwIDogMTAwKTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoLyhBUElcXF9Xb3JkcHJlc3NcXF9VUkwpPyhBY2NvdW50c1xcX09BdXRoXFxfV29yZHByZXNzXFxfKT8vLCAoKSA9PiBmaWxsU2V0dGluZ3MoKSk7XG5cdH0pO1xufSBlbHNlIHtcblx0TWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFRyYWNrZXIuYXV0b3J1bihmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBmaWxsU2V0dGluZ3MoKTtcblx0XHR9KTtcblx0fSk7XG59XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdPQXV0aCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5zZWN0aW9uKCdXb3JkUHJlc3MnLCBmdW5jdGlvbigpIHtcblxuXHRcdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge1xuXHRcdFx0X2lkOiAnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJyxcblx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0fTtcblx0XHR0aGlzLmFkZCgnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdCdwdWJsaWMnOiB0cnVlXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9Xb3JkcHJlc3NfVVJMJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnksXG5cdFx0XHQncHVibGljJzogdHJ1ZVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3NfaWQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3Nfc2VjcmV0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzX3NlcnZlcl90eXBlJywgJycsIHtcblx0XHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdFx0ZW5hYmxlUXVlcnksXG5cdFx0XHQncHVibGljJzogdHJ1ZSxcblx0XHRcdHZhbHVlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0a2V5OiAnd29yZHByZXNzLWNvbScsXG5cdFx0XHRcdFx0aTE4bkxhYmVsOiAnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzX3NlcnZlcl90eXBlX3dvcmRwcmVzc19jb20nXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRrZXk6ICd3cC1vYXV0aC1zZXJ2ZXInLFxuXHRcdFx0XHRcdGkxOG5MYWJlbDogJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19zZXJ2ZXJfdHlwZV93cF9vYXV0aF9zZXJ2ZXInXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRrZXk6ICdjdXN0b20nLFxuXHRcdFx0XHRcdGkxOG5MYWJlbDogJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19zZXJ2ZXJfdHlwZV9jdXN0b20nXG5cdFx0XHRcdH1cblx0XHRcdF0sXG5cdFx0XHRpMThuTGFiZWw6ICdTZXJ2ZXJfVHlwZSdcblx0XHR9KTtcblxuXHRcdGNvbnN0IGN1c3RvbU9BdXRoUXVlcnkgPSBbe1xuXHRcdFx0X2lkOiAnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJyxcblx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0fSwge1xuXHRcdFx0X2lkOiAnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzX3NlcnZlcl90eXBlJyxcblx0XHRcdHZhbHVlOiAnY3VzdG9tJ1xuXHRcdH1dO1xuXG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19pZGVudGl0eV9wYXRoJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IGN1c3RvbU9BdXRoUXVlcnksXG5cdFx0XHQncHVibGljJzogdHJ1ZVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3NfaWRlbnRpdHlfdG9rZW5fc2VudF92aWEnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeTogY3VzdG9tT0F1dGhRdWVyeSxcblx0XHRcdCdwdWJsaWMnOiB0cnVlXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc190b2tlbl9wYXRoJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IGN1c3RvbU9BdXRoUXVlcnksXG5cdFx0XHQncHVibGljJzogdHJ1ZVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3NfYXV0aG9yaXplX3BhdGgnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeTogY3VzdG9tT0F1dGhRdWVyeSxcblx0XHRcdCdwdWJsaWMnOiB0cnVlXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19zY29wZScsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiBjdXN0b21PQXV0aFF1ZXJ5LFxuXHRcdFx0J3B1YmxpYyc6IHRydWVcblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19jYWxsYmFja191cmwnLCAnX29hdXRoL3dvcmRwcmVzcycsIHtcblx0XHRcdHR5cGU6ICdyZWxhdGl2ZVVybCcsXG5cdFx0XHRyZWFkb25seTogdHJ1ZSxcblx0XHRcdGZvcmNlOiB0cnVlLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0fSk7XG59KTtcbiJdfQ==
