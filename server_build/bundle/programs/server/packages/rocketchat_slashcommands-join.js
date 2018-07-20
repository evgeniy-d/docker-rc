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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-join":{"server":{"server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/rocketchat_slashcommands-join/server/server.js                                            //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
/*
* Join is a named function that will replace /join commands
* @param {Object} message - The message object
*/
RocketChat.slashCommands.add('join', function Join(command, params, item) {
  if (command !== 'join' || !Match.test(params, String)) {
    return;
  }

  let channel = params.trim();

  if (channel === '') {
    return;
  }

  channel = channel.replace('#', '');
  const user = Meteor.users.findOne(Meteor.userId());
  const room = RocketChat.models.Rooms.findOneByNameAndType(channel, 'c');

  if (!room) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Channel_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [channel]
      }, user.language)
    });
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
    fields: {
      _id: 1
    }
  });

  if (subscription) {
    throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
      method: 'slashCommands'
    });
  }

  Meteor.call('joinRoom', room._id);
}, {
  description: 'Join_the_given_channel',
  params: '#channel'
});
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-join/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-join");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-join.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWpvaW4vc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2xhc2hDb21tYW5kcyIsImFkZCIsIkpvaW4iLCJjb21tYW5kIiwicGFyYW1zIiwiaXRlbSIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsImNoYW5uZWwiLCJ0cmltIiwicmVwbGFjZSIsInVzZXIiLCJNZXRlb3IiLCJ1c2VycyIsImZpbmRPbmUiLCJ1c2VySWQiLCJyb29tIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lQW5kVHlwZSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJyaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsInN1YnNjcmlwdGlvbiIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJmaWVsZHMiLCJFcnJvciIsIm1ldGhvZCIsImNhbGwiLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7Ozs7QUFNQUEsV0FBV0MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsTUFBN0IsRUFBcUMsU0FBU0MsSUFBVCxDQUFjQyxPQUFkLEVBQXVCQyxNQUF2QixFQUErQkMsSUFBL0IsRUFBcUM7QUFFekUsTUFBSUYsWUFBWSxNQUFaLElBQXNCLENBQUNHLE1BQU1DLElBQU4sQ0FBV0gsTUFBWCxFQUFtQkksTUFBbkIsQ0FBM0IsRUFBdUQ7QUFDdEQ7QUFDQTs7QUFDRCxNQUFJQyxVQUFVTCxPQUFPTSxJQUFQLEVBQWQ7O0FBQ0EsTUFBSUQsWUFBWSxFQUFoQixFQUFvQjtBQUNuQjtBQUNBOztBQUNEQSxZQUFVQSxRQUFRRSxPQUFSLENBQWdCLEdBQWhCLEVBQXFCLEVBQXJCLENBQVY7QUFDQSxRQUFNQyxPQUFPQyxPQUFPQyxLQUFQLENBQWFDLE9BQWIsQ0FBcUJGLE9BQU9HLE1BQVAsRUFBckIsQ0FBYjtBQUNBLFFBQU1DLE9BQU9sQixXQUFXbUIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLG9CQUF4QixDQUE2Q1gsT0FBN0MsRUFBc0QsR0FBdEQsQ0FBYjs7QUFDQSxNQUFJLENBQUNRLElBQUwsRUFBVztBQUNWbEIsZUFBV3NCLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DVCxPQUFPRyxNQUFQLEVBQXBDLEVBQXFELFNBQXJELEVBQWdFO0FBQy9ETyxXQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EQyxXQUFLckIsS0FBS3FCLEdBRnFEO0FBRy9EQyxVQUFJLElBQUlDLElBQUosRUFIMkQ7QUFJL0RDLFdBQUtDLFFBQVFDLEVBQVIsQ0FBVyxzQkFBWCxFQUFtQztBQUN2Q0MscUJBQWEsU0FEMEI7QUFFdkNDLGlCQUFTLENBQUN4QixPQUFEO0FBRjhCLE9BQW5DLEVBR0ZHLEtBQUtzQixRQUhIO0FBSjBELEtBQWhFO0FBU0E7O0FBRUQsUUFBTUMsZUFBZXBDLFdBQVdtQixNQUFYLENBQWtCa0IsYUFBbEIsQ0FBZ0NDLHdCQUFoQyxDQUF5RHBCLEtBQUtNLEdBQTlELEVBQW1FWCxLQUFLVyxHQUF4RSxFQUE2RTtBQUFFZSxZQUFRO0FBQUVmLFdBQUs7QUFBUDtBQUFWLEdBQTdFLENBQXJCOztBQUNBLE1BQUlZLFlBQUosRUFBa0I7QUFDakIsVUFBTSxJQUFJdEIsT0FBTzBCLEtBQVgsQ0FBaUIsNEJBQWpCLEVBQStDLGdDQUEvQyxFQUFpRjtBQUN0RkMsY0FBUTtBQUQ4RSxLQUFqRixDQUFOO0FBR0E7O0FBQ0QzQixTQUFPNEIsSUFBUCxDQUFZLFVBQVosRUFBd0J4QixLQUFLTSxHQUE3QjtBQUNBLENBL0JELEVBK0JHO0FBQ0ZtQixlQUFhLHdCQURYO0FBRUZ0QyxVQUFRO0FBRk4sQ0EvQkgsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbGFzaGNvbW1hbmRzLWpvaW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8qXG4qIEpvaW4gaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcmVwbGFjZSAvam9pbiBjb21tYW5kc1xuKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuKi9cblxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdqb2luJywgZnVuY3Rpb24gSm9pbihjb21tYW5kLCBwYXJhbXMsIGl0ZW0pIHtcblxuXHRpZiAoY29tbWFuZCAhPT0gJ2pvaW4nIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgY2hhbm5lbCA9IHBhcmFtcy50cmltKCk7XG5cdGlmIChjaGFubmVsID09PSAnJykge1xuXHRcdHJldHVybjtcblx0fVxuXHRjaGFubmVsID0gY2hhbm5lbC5yZXBsYWNlKCcjJywgJycpO1xuXHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoTWV0ZW9yLnVzZXJJZCgpKTtcblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWVBbmRUeXBlKGNoYW5uZWwsICdjJyk7XG5cdGlmICghcm9vbSkge1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnQ2hhbm5lbF9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFtjaGFubmVsXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCB1c2VyLl9pZCwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdGlmIChzdWJzY3JpcHRpb24pIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci11c2VyLWFscmVhZHktaW4tcm9vbScsICdZb3UgYXJlIGFscmVhZHkgaW4gdGhlIGNoYW5uZWwnLCB7XG5cdFx0XHRtZXRob2Q6ICdzbGFzaENvbW1hbmRzJ1xuXHRcdH0pO1xuXHR9XG5cdE1ldGVvci5jYWxsKCdqb2luUm9vbScsIHJvb20uX2lkKTtcbn0sIHtcblx0ZGVzY3JpcHRpb246ICdKb2luX3RoZV9naXZlbl9jaGFubmVsJyxcblx0cGFyYW1zOiAnI2NoYW5uZWwnXG59KTtcbiJdfQ==
