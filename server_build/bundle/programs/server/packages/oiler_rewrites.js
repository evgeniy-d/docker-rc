(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"oiler:rewrites":{"rocketchat-lib":{"server":{"methods":{"updateMessage.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/oiler_rewrites/rocketchat-lib/server/methods/updateMessa //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
Meteor.methods({
  updateMessageWithButton(message) {
    check(message, Match.ObjectIncluding({
      _id: String
    }));

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'updateMessage'
      });
    }

    return RocketChat.updateMessage(message, Meteor.user());
  }

});
///////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/oiler:rewrites/rocketchat-lib/server/methods/updateMessage.js");

/* Exports */
Package._define("oiler:rewrites");

})();

//# sourceURL=meteor://💻app/packages/oiler_rewrites.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2lsZXI6cmV3cml0ZXMvcm9ja2V0Y2hhdC1saWIvc2VydmVyL21ldGhvZHMvdXBkYXRlTWVzc2FnZS5qcyJdLCJuYW1lcyI6WyJtb21lbnQiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIk1ldGVvciIsIm1ldGhvZHMiLCJ1cGRhdGVNZXNzYWdlV2l0aEJ1dHRvbiIsIm1lc3NhZ2UiLCJjaGVjayIsIk1hdGNoIiwiT2JqZWN0SW5jbHVkaW5nIiwiX2lkIiwiU3RyaW5nIiwidXNlcklkIiwiRXJyb3IiLCJtZXRob2QiLCJSb2NrZXRDaGF0IiwidXBkYXRlTWVzc2FnZSIsInVzZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLE1BQUo7QUFBV0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsYUFBT0ssQ0FBUDtBQUFTOztBQUFyQixDQUEvQixFQUFzRCxDQUF0RDtBQUVYQyxPQUFPQyxPQUFQLENBQWU7QUFDZEMsMEJBQXdCQyxPQUF4QixFQUFpQztBQUVoQ0MsVUFBTUQsT0FBTixFQUFlRSxNQUFNQyxlQUFOLENBQXNCO0FBQUNDLFdBQUlDO0FBQUwsS0FBdEIsQ0FBZjs7QUFFQSxRQUFJLENBQUNSLE9BQU9TLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlULE9BQU9VLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQUVDLGdCQUFRO0FBQVYsT0FBdkQsQ0FBTjtBQUNBOztBQUVELFdBQU9DLFdBQVdDLGFBQVgsQ0FBeUJWLE9BQXpCLEVBQWtDSCxPQUFPYyxJQUFQLEVBQWxDLENBQVA7QUFDQTs7QUFWYSxDQUFmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL29pbGVyX3Jld3JpdGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdHVwZGF0ZU1lc3NhZ2VXaXRoQnV0dG9uKG1lc3NhZ2UpIHtcblxuXHRcdGNoZWNrKG1lc3NhZ2UsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7X2lkOlN0cmluZ30pKTtcblxuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICd1cGRhdGVNZXNzYWdlJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC51cGRhdGVNZXNzYWdlKG1lc3NhZ2UsIE1ldGVvci51c2VyKCkpO1xuXHR9XG59KTtcbiJdfQ==
