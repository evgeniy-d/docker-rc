(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:login-token":{"server":{"login_token_server.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_login-token/server/login_token_server.js      //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
/* globals Accounts */
Accounts.registerLoginHandler('login-token', function (result) {
  if (!result.loginToken) {
    return;
  }

  const user = Meteor.users.findOne({
    'services.loginToken.token': result.loginToken
  });

  if (user) {
    Meteor.users.update({
      _id: user._id
    }, {
      $unset: {
        'services.loginToken': 1
      }
    });
    return {
      userId: user._id
    };
  }
});
///////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:login-token/server/login_token_server.js");

/* Exports */
Package._define("rocketchat:login-token");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_login-token.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsb2dpbi10b2tlbi9zZXJ2ZXIvbG9naW5fdG9rZW5fc2VydmVyLmpzIl0sIm5hbWVzIjpbIkFjY291bnRzIiwicmVnaXN0ZXJMb2dpbkhhbmRsZXIiLCJyZXN1bHQiLCJsb2dpblRva2VuIiwidXNlciIsIk1ldGVvciIsInVzZXJzIiwiZmluZE9uZSIsInVwZGF0ZSIsIl9pZCIsIiR1bnNldCIsInVzZXJJZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUVBQSxTQUFTQyxvQkFBVCxDQUE4QixhQUE5QixFQUE2QyxVQUFTQyxNQUFULEVBQWlCO0FBQzdELE1BQUksQ0FBQ0EsT0FBT0MsVUFBWixFQUF3QjtBQUN2QjtBQUNBOztBQUVELFFBQU1DLE9BQU9DLE9BQU9DLEtBQVAsQ0FBYUMsT0FBYixDQUFxQjtBQUNqQyxpQ0FBNkJMLE9BQU9DO0FBREgsR0FBckIsQ0FBYjs7QUFJQSxNQUFJQyxJQUFKLEVBQVU7QUFDVEMsV0FBT0MsS0FBUCxDQUFhRSxNQUFiLENBQW9CO0FBQUNDLFdBQUtMLEtBQUtLO0FBQVgsS0FBcEIsRUFBcUM7QUFBQ0MsY0FBUTtBQUFDLCtCQUF1QjtBQUF4QjtBQUFULEtBQXJDO0FBRUEsV0FBTztBQUNOQyxjQUFRUCxLQUFLSztBQURQLEtBQVA7QUFHQTtBQUNELENBaEJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbG9naW4tdG9rZW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIEFjY291bnRzICovXG5cbkFjY291bnRzLnJlZ2lzdGVyTG9naW5IYW5kbGVyKCdsb2dpbi10b2tlbicsIGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRpZiAoIXJlc3VsdC5sb2dpblRva2VuKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcblx0XHQnc2VydmljZXMubG9naW5Ub2tlbi50b2tlbic6IHJlc3VsdC5sb2dpblRva2VuXG5cdH0pO1xuXG5cdGlmICh1c2VyKSB7XG5cdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHskdW5zZXQ6IHsnc2VydmljZXMubG9naW5Ub2tlbic6IDF9fSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dXNlcklkOiB1c2VyLl9pZFxuXHRcdH07XG5cdH1cbn0pO1xuIl19
