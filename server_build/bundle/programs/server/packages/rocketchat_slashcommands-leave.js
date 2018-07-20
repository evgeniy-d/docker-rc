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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-leave":{"leave.js":function(){

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/rocketchat_slashcommands-leave/leave.js                   //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
/*
* Leave is a named function that will replace /leave commands
* @param {Object} message - The message object
*/
function Leave(command, params, item) {
  if (command !== 'leave' && command !== 'part') {
    return;
  }

  try {
    Meteor.call('leaveRoom', item.rid);
  } catch ({
    error
  }) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__(error, null, Meteor.user().language)
    });
  }
}

RocketChat.slashCommands.add('leave', Leave, {
  description: 'Leave_the_current_channel'
});
RocketChat.slashCommands.add('part', Leave, {
  description: 'Leave_the_current_channel'
});
////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-leave/leave.js");

/* Exports */
Package._define("rocketchat:slashcommands-leave");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-leave.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWxlYXZlL2xlYXZlLmpzIl0sIm5hbWVzIjpbIkxlYXZlIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJNZXRlb3IiLCJjYWxsIiwicmlkIiwiZXJyb3IiLCJSb2NrZXRDaGF0IiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeVVzZXIiLCJ1c2VySWQiLCJfaWQiLCJSYW5kb20iLCJpZCIsInRzIiwiRGF0ZSIsIm1zZyIsIlRBUGkxOG4iLCJfXyIsInVzZXIiLCJsYW5ndWFnZSIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOzs7O0FBSUEsU0FBU0EsS0FBVCxDQUFlQyxPQUFmLEVBQXdCQyxNQUF4QixFQUFnQ0MsSUFBaEMsRUFBc0M7QUFDckMsTUFBSUYsWUFBWSxPQUFaLElBQXVCQSxZQUFZLE1BQXZDLEVBQStDO0FBQzlDO0FBQ0E7O0FBRUQsTUFBSTtBQUNIRyxXQUFPQyxJQUFQLENBQVksV0FBWixFQUF5QkYsS0FBS0csR0FBOUI7QUFDQSxHQUZELENBRUUsT0FBTztBQUFDQztBQUFELEdBQVAsRUFBZ0I7QUFDakJDLGVBQVdDLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DTixPQUFPTyxNQUFQLEVBQXBDLEVBQXFELFNBQXJELEVBQWdFO0FBQy9EQyxXQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EUixXQUFLSCxLQUFLRyxHQUZxRDtBQUcvRFMsVUFBSSxJQUFJQyxJQUFKLEVBSDJEO0FBSS9EQyxXQUFLQyxRQUFRQyxFQUFSLENBQVdaLEtBQVgsRUFBa0IsSUFBbEIsRUFBd0JILE9BQU9nQixJQUFQLEdBQWNDLFFBQXRDO0FBSjBELEtBQWhFO0FBTUE7QUFDRDs7QUFFRGIsV0FBV2MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsT0FBN0IsRUFBc0N2QixLQUF0QyxFQUE2QztBQUFFd0IsZUFBYTtBQUFmLENBQTdDO0FBQ0FoQixXQUFXYyxhQUFYLENBQXlCQyxHQUF6QixDQUE2QixNQUE3QixFQUFxQ3ZCLEtBQXJDLEVBQTRDO0FBQUV3QixlQUFhO0FBQWYsQ0FBNUMsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbGFzaGNvbW1hbmRzLWxlYXZlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKlxuKiBMZWF2ZSBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCByZXBsYWNlIC9sZWF2ZSBjb21tYW5kc1xuKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuKi9cbmZ1bmN0aW9uIExlYXZlKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCAhPT0gJ2xlYXZlJyAmJiBjb21tYW5kICE9PSAncGFydCcpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHR0cnkge1xuXHRcdE1ldGVvci5jYWxsKCdsZWF2ZVJvb20nLCBpdGVtLnJpZCk7XG5cdH0gY2F0Y2ggKHtlcnJvcn0pIHtcblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oZXJyb3IsIG51bGwsIE1ldGVvci51c2VyKCkubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgnbGVhdmUnLCBMZWF2ZSwgeyBkZXNjcmlwdGlvbjogJ0xlYXZlX3RoZV9jdXJyZW50X2NoYW5uZWwnIH0pO1xuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgncGFydCcsIExlYXZlLCB7IGRlc2NyaXB0aW9uOiAnTGVhdmVfdGhlX2N1cnJlbnRfY2hhbm5lbCcgfSk7XG4iXX0=
