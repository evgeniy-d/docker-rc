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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-kick":{"server":{"server.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/rocketchat_slashcommands-kick/server/server.js                                       //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
// Kick is a named function that will replace /kick commands
const Kick = function (command, params, {
  rid
}) {
  if (command !== 'kick' || !Match.test(params, String)) {
    return;
  }

  const username = params.trim().replace('@', '');

  if (username === '') {
    return;
  }

  const userId = Meteor.userId();
  const user = Meteor.users.findOne(userId);
  const kickedUser = RocketChat.models.Users.findOneByUsername(username);

  if (kickedUser == null) {
    return RocketChat.Notifications.notifyUser(userId, 'message', {
      _id: Random.id(),
      rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id, {
    fields: {
      _id: 1
    }
  });

  if (!subscription) {
    return RocketChat.Notifications.notifyUser(userId, 'message', {
      _id: Random.id(),
      rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_is_not_in_this_room', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  Meteor.call('removeUserFromRoom', {
    rid,
    username
  });
};

RocketChat.slashCommands.add('kick', Kick, {
  description: 'Remove_someone_from_room',
  params: '@username',
  permission: 'remove-user'
});
///////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-kick/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-kick");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-kick.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWtpY2svc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJLaWNrIiwiY29tbWFuZCIsInBhcmFtcyIsInJpZCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsInVzZXJuYW1lIiwidHJpbSIsInJlcGxhY2UiLCJ1c2VySWQiLCJNZXRlb3IiLCJ1c2VyIiwidXNlcnMiLCJmaW5kT25lIiwia2lja2VkVXNlciIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJVc2VycyIsImZpbmRPbmVCeVVzZXJuYW1lIiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeVVzZXIiLCJfaWQiLCJSYW5kb20iLCJpZCIsInRzIiwiRGF0ZSIsIm1zZyIsIlRBUGkxOG4iLCJfXyIsInBvc3RQcm9jZXNzIiwic3ByaW50ZiIsImxhbmd1YWdlIiwic3Vic2NyaXB0aW9uIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZCIsImZpZWxkcyIsImNhbGwiLCJzbGFzaENvbW1hbmRzIiwiYWRkIiwiZGVzY3JpcHRpb24iLCJwZXJtaXNzaW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTtBQUVBLE1BQU1BLE9BQU8sVUFBU0MsT0FBVCxFQUFrQkMsTUFBbEIsRUFBMEI7QUFBQ0M7QUFBRCxDQUExQixFQUFpQztBQUM3QyxNQUFJRixZQUFZLE1BQVosSUFBc0IsQ0FBQ0csTUFBTUMsSUFBTixDQUFXSCxNQUFYLEVBQW1CSSxNQUFuQixDQUEzQixFQUF1RDtBQUN0RDtBQUNBOztBQUNELFFBQU1DLFdBQVdMLE9BQU9NLElBQVAsR0FBY0MsT0FBZCxDQUFzQixHQUF0QixFQUEyQixFQUEzQixDQUFqQjs7QUFDQSxNQUFJRixhQUFhLEVBQWpCLEVBQXFCO0FBQ3BCO0FBQ0E7O0FBQ0QsUUFBTUcsU0FBU0MsT0FBT0QsTUFBUCxFQUFmO0FBQ0EsUUFBTUUsT0FBT0QsT0FBT0UsS0FBUCxDQUFhQyxPQUFiLENBQXFCSixNQUFyQixDQUFiO0FBQ0EsUUFBTUssYUFBYUMsV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLGlCQUF4QixDQUEwQ1osUUFBMUMsQ0FBbkI7O0FBRUEsTUFBSVEsY0FBYyxJQUFsQixFQUF3QjtBQUN2QixXQUFPQyxXQUFXSSxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ1gsTUFBcEMsRUFBNEMsU0FBNUMsRUFBdUQ7QUFDN0RZLFdBQUtDLE9BQU9DLEVBQVAsRUFEd0Q7QUFFN0RyQixTQUY2RDtBQUc3RHNCLFVBQUksSUFBSUMsSUFBSixFQUh5RDtBQUk3REMsV0FBS0MsUUFBUUMsRUFBUixDQUFXLHVCQUFYLEVBQW9DO0FBQ3hDQyxxQkFBYSxTQUQyQjtBQUV4Q0MsaUJBQVMsQ0FBQ3hCLFFBQUQ7QUFGK0IsT0FBcEMsRUFHRkssS0FBS29CLFFBSEg7QUFKd0QsS0FBdkQsQ0FBUDtBQVNBOztBQUVELFFBQU1DLGVBQWVqQixXQUFXQyxNQUFYLENBQWtCaUIsYUFBbEIsQ0FBZ0NDLHdCQUFoQyxDQUF5RGhDLEdBQXpELEVBQThEUyxLQUFLVSxHQUFuRSxFQUF3RTtBQUFFYyxZQUFRO0FBQUVkLFdBQUs7QUFBUDtBQUFWLEdBQXhFLENBQXJCOztBQUNBLE1BQUksQ0FBQ1csWUFBTCxFQUFtQjtBQUNsQixXQUFPakIsV0FBV0ksYUFBWCxDQUF5QkMsVUFBekIsQ0FBb0NYLE1BQXBDLEVBQTRDLFNBQTVDLEVBQXVEO0FBQzdEWSxXQUFLQyxPQUFPQyxFQUFQLEVBRHdEO0FBRTdEckIsU0FGNkQ7QUFHN0RzQixVQUFJLElBQUlDLElBQUosRUFIeUQ7QUFJN0RDLFdBQUtDLFFBQVFDLEVBQVIsQ0FBVyw4QkFBWCxFQUEyQztBQUMvQ0MscUJBQWEsU0FEa0M7QUFFL0NDLGlCQUFTLENBQUN4QixRQUFEO0FBRnNDLE9BQTNDLEVBR0ZLLEtBQUtvQixRQUhIO0FBSndELEtBQXZELENBQVA7QUFTQTs7QUFDRHJCLFNBQU8wQixJQUFQLENBQVksb0JBQVosRUFBa0M7QUFBQ2xDLE9BQUQ7QUFBTUk7QUFBTixHQUFsQztBQUNBLENBckNEOztBQXVDQVMsV0FBV3NCLGFBQVgsQ0FBeUJDLEdBQXpCLENBQTZCLE1BQTdCLEVBQXFDdkMsSUFBckMsRUFBMkM7QUFDMUN3QyxlQUFhLDBCQUQ2QjtBQUUxQ3RDLFVBQVEsV0FGa0M7QUFHMUN1QyxjQUFZO0FBSDhCLENBQTNDLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy1raWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBLaWNrIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL2tpY2sgY29tbWFuZHNcblxuY29uc3QgS2ljayA9IGZ1bmN0aW9uKGNvbW1hbmQsIHBhcmFtcywge3JpZH0pIHtcblx0aWYgKGNvbW1hbmQgIT09ICdraWNrJyB8fCAhTWF0Y2gudGVzdChwYXJhbXMsIFN0cmluZykpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdXNlcm5hbWUgPSBwYXJhbXMudHJpbSgpLnJlcGxhY2UoJ0AnLCAnJyk7XG5cdGlmICh1c2VybmFtZSA9PT0gJycpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpO1xuXHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcblx0Y29uc3Qga2lja2VkVXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblxuXHRpZiAoa2lja2VkVXNlciA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXJJZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlLFxuXHRcdFx0bXNnOiBUQVBpMThuLl9fKCdVc2VybmFtZV9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFt1c2VybmFtZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdH1cblxuXHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyaWQsIHVzZXIuX2lkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblx0aWYgKCFzdWJzY3JpcHRpb24pIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlcklkLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJuYW1lX2lzX25vdF9pbl90aGlzX3Jvb20nLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFt1c2VybmFtZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdH1cblx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVVzZXJGcm9tUm9vbScsIHtyaWQsIHVzZXJuYW1lfSk7XG59O1xuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdraWNrJywgS2ljaywge1xuXHRkZXNjcmlwdGlvbjogJ1JlbW92ZV9zb21lb25lX2Zyb21fcm9vbScsXG5cdHBhcmFtczogJ0B1c2VybmFtZScsXG5cdHBlcm1pc3Npb246ICdyZW1vdmUtdXNlcidcbn0pO1xuIl19
