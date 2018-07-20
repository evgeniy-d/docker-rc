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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-msg":{"server.js":function(){

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/rocketchat_slashcommands-msg/server.js                                   //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
/*
* Msg is a named function that will replace /msg commands
*/
function Msg(command, params, item) {
  if (command !== 'msg' || !Match.test(params, String)) {
    return;
  }

  const trimmedParams = params.trim();
  const separator = trimmedParams.indexOf(' ');
  const user = Meteor.users.findOne(Meteor.userId());

  if (separator === -1) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_and_message_must_not_be_empty', null, user.language)
    });
  }

  const message = trimmedParams.slice(separator + 1);
  const targetUsernameOrig = trimmedParams.slice(0, separator);
  const targetUsername = targetUsernameOrig.replace('@', '');
  const targetUser = RocketChat.models.Users.findOneByUsername(targetUsername);

  if (targetUser == null) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [targetUsernameOrig]
      }, user.language)
    });
    return;
  }

  const {
    rid
  } = Meteor.call('createDirectMessage', targetUsername);
  const msgObject = {
    _id: Random.id(),
    rid,
    msg: message
  };
  Meteor.call('sendMessage', msgObject);
}

RocketChat.slashCommands.add('msg', Msg, {
  description: 'Direct_message_someone',
  params: '@username <message>'
});
///////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-msg/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-msg");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-msg.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLW1zZy9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiTXNnIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJ0cmltbWVkUGFyYW1zIiwidHJpbSIsInNlcGFyYXRvciIsImluZGV4T2YiLCJ1c2VyIiwiTWV0ZW9yIiwidXNlcnMiLCJmaW5kT25lIiwidXNlcklkIiwiUm9ja2V0Q2hhdCIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJyaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJsYW5ndWFnZSIsIm1lc3NhZ2UiLCJzbGljZSIsInRhcmdldFVzZXJuYW1lT3JpZyIsInRhcmdldFVzZXJuYW1lIiwicmVwbGFjZSIsInRhcmdldFVzZXIiLCJtb2RlbHMiLCJVc2VycyIsImZpbmRPbmVCeVVzZXJuYW1lIiwicG9zdFByb2Nlc3MiLCJzcHJpbnRmIiwiY2FsbCIsIm1zZ09iamVjdCIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7OztBQUlBLFNBQVNBLEdBQVQsQ0FBYUMsT0FBYixFQUFzQkMsTUFBdEIsRUFBOEJDLElBQTlCLEVBQW9DO0FBQ25DLE1BQUlGLFlBQVksS0FBWixJQUFxQixDQUFDRyxNQUFNQyxJQUFOLENBQVdILE1BQVgsRUFBbUJJLE1BQW5CLENBQTFCLEVBQXNEO0FBQ3JEO0FBQ0E7O0FBQ0QsUUFBTUMsZ0JBQWdCTCxPQUFPTSxJQUFQLEVBQXRCO0FBQ0EsUUFBTUMsWUFBWUYsY0FBY0csT0FBZCxDQUFzQixHQUF0QixDQUFsQjtBQUNBLFFBQU1DLE9BQU9DLE9BQU9DLEtBQVAsQ0FBYUMsT0FBYixDQUFxQkYsT0FBT0csTUFBUCxFQUFyQixDQUFiOztBQUNBLE1BQUlOLGNBQWMsQ0FBQyxDQUFuQixFQUFzQjtBQUNyQixXQUFPTyxXQUFXQyxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ04sT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUN0RUksV0FBS0MsT0FBT0MsRUFBUCxFQURpRTtBQUV0RUMsV0FBS25CLEtBQUttQixHQUY0RDtBQUd0RUMsVUFBSSxJQUFJQyxJQUFKLEVBSGtFO0FBSXRFQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsd0NBQVgsRUFBcUQsSUFBckQsRUFBMkRoQixLQUFLaUIsUUFBaEU7QUFKaUUsS0FBaEUsQ0FBUDtBQU1BOztBQUNELFFBQU1DLFVBQVV0QixjQUFjdUIsS0FBZCxDQUFvQnJCLFlBQVksQ0FBaEMsQ0FBaEI7QUFDQSxRQUFNc0IscUJBQXFCeEIsY0FBY3VCLEtBQWQsQ0FBb0IsQ0FBcEIsRUFBdUJyQixTQUF2QixDQUEzQjtBQUNBLFFBQU11QixpQkFBaUJELG1CQUFtQkUsT0FBbkIsQ0FBMkIsR0FBM0IsRUFBZ0MsRUFBaEMsQ0FBdkI7QUFDQSxRQUFNQyxhQUFhbEIsV0FBV21CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxpQkFBeEIsQ0FBMENMLGNBQTFDLENBQW5COztBQUNBLE1BQUlFLGNBQWMsSUFBbEIsRUFBd0I7QUFDdkJsQixlQUFXQyxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ04sT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUMvREksV0FBS0MsT0FBT0MsRUFBUCxFQUQwRDtBQUUvREMsV0FBS25CLEtBQUttQixHQUZxRDtBQUcvREMsVUFBSSxJQUFJQyxJQUFKLEVBSDJEO0FBSS9EQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsdUJBQVgsRUFBb0M7QUFDeENXLHFCQUFhLFNBRDJCO0FBRXhDQyxpQkFBUyxDQUFDUixrQkFBRDtBQUYrQixPQUFwQyxFQUdGcEIsS0FBS2lCLFFBSEg7QUFKMEQsS0FBaEU7QUFTQTtBQUNBOztBQUNELFFBQU07QUFBQ047QUFBRCxNQUFRVixPQUFPNEIsSUFBUCxDQUFZLHFCQUFaLEVBQW1DUixjQUFuQyxDQUFkO0FBQ0EsUUFBTVMsWUFBWTtBQUNqQnRCLFNBQUtDLE9BQU9DLEVBQVAsRUFEWTtBQUVqQkMsT0FGaUI7QUFHakJHLFNBQUtJO0FBSFksR0FBbEI7QUFLQWpCLFNBQU80QixJQUFQLENBQVksYUFBWixFQUEyQkMsU0FBM0I7QUFDQTs7QUFFRHpCLFdBQVcwQixhQUFYLENBQXlCQyxHQUF6QixDQUE2QixLQUE3QixFQUFvQzNDLEdBQXBDLEVBQXlDO0FBQ3hDNEMsZUFBYSx3QkFEMkI7QUFFeEMxQyxVQUFRO0FBRmdDLENBQXpDLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy1tc2cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8qXG4qIE1zZyBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCByZXBsYWNlIC9tc2cgY29tbWFuZHNcbiovXG5cbmZ1bmN0aW9uIE1zZyhjb21tYW5kLCBwYXJhbXMsIGl0ZW0pIHtcblx0aWYgKGNvbW1hbmQgIT09ICdtc2cnIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRjb25zdCB0cmltbWVkUGFyYW1zID0gcGFyYW1zLnRyaW0oKTtcblx0Y29uc3Qgc2VwYXJhdG9yID0gdHJpbW1lZFBhcmFtcy5pbmRleE9mKCcgJyk7XG5cdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShNZXRlb3IudXNlcklkKCkpO1xuXHRpZiAoc2VwYXJhdG9yID09PSAtMSkge1xuXHRcdHJldHVyblx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlLFxuXHRcdFx0bXNnOiBUQVBpMThuLl9fKCdVc2VybmFtZV9hbmRfbWVzc2FnZV9tdXN0X25vdF9iZV9lbXB0eScsIG51bGwsIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgbWVzc2FnZSA9IHRyaW1tZWRQYXJhbXMuc2xpY2Uoc2VwYXJhdG9yICsgMSk7XG5cdGNvbnN0IHRhcmdldFVzZXJuYW1lT3JpZyA9IHRyaW1tZWRQYXJhbXMuc2xpY2UoMCwgc2VwYXJhdG9yKTtcblx0Y29uc3QgdGFyZ2V0VXNlcm5hbWUgPSB0YXJnZXRVc2VybmFtZU9yaWcucmVwbGFjZSgnQCcsICcnKTtcblx0Y29uc3QgdGFyZ2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHRhcmdldFVzZXJuYW1lKTtcblx0aWYgKHRhcmdldFVzZXIgPT0gbnVsbCkge1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnVXNlcm5hbWVfZG9lc250X2V4aXN0Jywge1xuXHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRzcHJpbnRmOiBbdGFyZ2V0VXNlcm5hbWVPcmlnXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3Qge3JpZH0gPSBNZXRlb3IuY2FsbCgnY3JlYXRlRGlyZWN0TWVzc2FnZScsIHRhcmdldFVzZXJuYW1lKTtcblx0Y29uc3QgbXNnT2JqZWN0ID0ge1xuXHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0cmlkLFxuXHRcdG1zZzogbWVzc2FnZVxuXHR9O1xuXHRNZXRlb3IuY2FsbCgnc2VuZE1lc3NhZ2UnLCBtc2dPYmplY3QpO1xufVxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdtc2cnLCBNc2csIHtcblx0ZGVzY3JpcHRpb246ICdEaXJlY3RfbWVzc2FnZV9zb21lb25lJyxcblx0cGFyYW1zOiAnQHVzZXJuYW1lIDxtZXNzYWdlPidcbn0pO1xuIl19
