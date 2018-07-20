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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-mute":{"server":{"mute.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_slashcommands-mute/server/mute.js                                                     //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
/*
* Mute is a named function that will replace /mute commands
*/
RocketChat.slashCommands.add('mute', function Mute(command, params, item) {
  if (command !== 'mute' || !Match.test(params, String)) {
    return;
  }

  const username = params.trim().replace('@', '');

  if (username === '') {
    return;
  }

  const userId = Meteor.userId();
  const user = Meteor.users.findOne(userId);
  const mutedUser = RocketChat.models.Users.findOneByUsername(username);

  if (mutedUser == null) {
    RocketChat.Notifications.notifyUser(userId, 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
    return;
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(item.rid, mutedUser._id, {
    fields: {
      _id: 1
    }
  });

  if (!subscription) {
    RocketChat.Notifications.notifyUser(userId, 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_is_not_in_this_room', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
    return;
  }

  Meteor.call('muteUserInRoom', {
    rid: item.rid,
    username
  });
}, {
  description: 'Mute_someone_in_room',
  params: '@username'
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unmute.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_slashcommands-mute/server/unmute.js                                                   //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
/*
* Unmute is a named function that will replace /unmute commands
*/
RocketChat.slashCommands.add('unmute', function Unmute(command, params, item) {
  if (command !== 'unmute' || !Match.test(params, String)) {
    return;
  }

  const username = params.trim().replace('@', '');

  if (username === '') {
    return;
  }

  const user = Meteor.users.findOne(Meteor.userId());
  const unmutedUser = RocketChat.models.Users.findOneByUsername(username);

  if (unmutedUser == null) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(item.rid, unmutedUser._id, {
    fields: {
      _id: 1
    }
  });

  if (!subscription) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_is_not_in_this_room', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  Meteor.call('unmuteUserInRoom', {
    rid: item.rid,
    username
  });
}, {
  description: 'Unmute_someone_in_room',
  params: '@username'
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-mute/server/mute.js");
require("/node_modules/meteor/rocketchat:slashcommands-mute/server/unmute.js");

/* Exports */
Package._define("rocketchat:slashcommands-mute");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-mute.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLW11dGUvc2VydmVyL211dGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhc2hjb21tYW5kcy1tdXRlL3NlcnZlci91bm11dGUuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJNdXRlIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJ1c2VybmFtZSIsInRyaW0iLCJyZXBsYWNlIiwidXNlcklkIiwiTWV0ZW9yIiwidXNlciIsInVzZXJzIiwiZmluZE9uZSIsIm11dGVkVXNlciIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5VXNlciIsIl9pZCIsIlJhbmRvbSIsImlkIiwicmlkIiwidHMiLCJEYXRlIiwibXNnIiwiVEFQaTE4biIsIl9fIiwicG9zdFByb2Nlc3MiLCJzcHJpbnRmIiwibGFuZ3VhZ2UiLCJzdWJzY3JpcHRpb24iLCJTdWJzY3JpcHRpb25zIiwiZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkIiwiZmllbGRzIiwiY2FsbCIsImRlc2NyaXB0aW9uIiwiVW5tdXRlIiwidW5tdXRlZFVzZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOzs7QUFJQUEsV0FBV0MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsTUFBN0IsRUFBcUMsU0FBU0MsSUFBVCxDQUFjQyxPQUFkLEVBQXVCQyxNQUF2QixFQUErQkMsSUFBL0IsRUFBcUM7QUFDekUsTUFBSUYsWUFBWSxNQUFaLElBQXNCLENBQUNHLE1BQU1DLElBQU4sQ0FBV0gsTUFBWCxFQUFtQkksTUFBbkIsQ0FBM0IsRUFBdUQ7QUFDdEQ7QUFDQTs7QUFDRCxRQUFNQyxXQUFXTCxPQUFPTSxJQUFQLEdBQWNDLE9BQWQsQ0FBc0IsR0FBdEIsRUFBMkIsRUFBM0IsQ0FBakI7O0FBQ0EsTUFBSUYsYUFBYSxFQUFqQixFQUFxQjtBQUNwQjtBQUNBOztBQUNELFFBQU1HLFNBQVNDLE9BQU9ELE1BQVAsRUFBZjtBQUNBLFFBQU1FLE9BQU9ELE9BQU9FLEtBQVAsQ0FBYUMsT0FBYixDQUFxQkosTUFBckIsQ0FBYjtBQUNBLFFBQU1LLFlBQVlsQixXQUFXbUIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLGlCQUF4QixDQUEwQ1gsUUFBMUMsQ0FBbEI7O0FBQ0EsTUFBSVEsYUFBYSxJQUFqQixFQUF1QjtBQUN0QmxCLGVBQVdzQixhQUFYLENBQXlCQyxVQUF6QixDQUFvQ1YsTUFBcEMsRUFBNEMsU0FBNUMsRUFBdUQ7QUFDdERXLFdBQUtDLE9BQU9DLEVBQVAsRUFEaUQ7QUFFdERDLFdBQUtyQixLQUFLcUIsR0FGNEM7QUFHdERDLFVBQUksSUFBSUMsSUFBSixFQUhrRDtBQUl0REMsV0FBS0MsUUFBUUMsRUFBUixDQUFXLHVCQUFYLEVBQW9DO0FBQ3hDQyxxQkFBYSxTQUQyQjtBQUV4Q0MsaUJBQVMsQ0FBQ3hCLFFBQUQ7QUFGK0IsT0FBcEMsRUFHRkssS0FBS29CLFFBSEg7QUFKaUQsS0FBdkQ7QUFTQTtBQUNBOztBQUVELFFBQU1DLGVBQWVwQyxXQUFXbUIsTUFBWCxDQUFrQmtCLGFBQWxCLENBQWdDQyx3QkFBaEMsQ0FBeURoQyxLQUFLcUIsR0FBOUQsRUFBbUVULFVBQVVNLEdBQTdFLEVBQWtGO0FBQUVlLFlBQVE7QUFBRWYsV0FBSztBQUFQO0FBQVYsR0FBbEYsQ0FBckI7O0FBQ0EsTUFBSSxDQUFDWSxZQUFMLEVBQW1CO0FBQ2xCcEMsZUFBV3NCLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DVixNQUFwQyxFQUE0QyxTQUE1QyxFQUF1RDtBQUN0RFcsV0FBS0MsT0FBT0MsRUFBUCxFQURpRDtBQUV0REMsV0FBS3JCLEtBQUtxQixHQUY0QztBQUd0REMsVUFBSSxJQUFJQyxJQUFKLEVBSGtEO0FBSXREQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsOEJBQVgsRUFBMkM7QUFDL0NDLHFCQUFhLFNBRGtDO0FBRS9DQyxpQkFBUyxDQUFDeEIsUUFBRDtBQUZzQyxPQUEzQyxFQUdGSyxLQUFLb0IsUUFISDtBQUppRCxLQUF2RDtBQVNBO0FBQ0E7O0FBQ0RyQixTQUFPMEIsSUFBUCxDQUFZLGdCQUFaLEVBQThCO0FBQzdCYixTQUFLckIsS0FBS3FCLEdBRG1CO0FBRTdCakI7QUFGNkIsR0FBOUI7QUFJQSxDQXpDRCxFQXlDRztBQUNGK0IsZUFBYSxzQkFEWDtBQUVGcEMsVUFBUTtBQUZOLENBekNILEU7Ozs7Ozs7Ozs7O0FDSkE7OztBQUlBTCxXQUFXQyxhQUFYLENBQXlCQyxHQUF6QixDQUE2QixRQUE3QixFQUF1QyxTQUFTd0MsTUFBVCxDQUFnQnRDLE9BQWhCLEVBQXlCQyxNQUF6QixFQUFpQ0MsSUFBakMsRUFBdUM7QUFFN0UsTUFBSUYsWUFBWSxRQUFaLElBQXdCLENBQUNHLE1BQU1DLElBQU4sQ0FBV0gsTUFBWCxFQUFtQkksTUFBbkIsQ0FBN0IsRUFBeUQ7QUFDeEQ7QUFDQTs7QUFDRCxRQUFNQyxXQUFXTCxPQUFPTSxJQUFQLEdBQWNDLE9BQWQsQ0FBc0IsR0FBdEIsRUFBMkIsRUFBM0IsQ0FBakI7O0FBQ0EsTUFBSUYsYUFBYSxFQUFqQixFQUFxQjtBQUNwQjtBQUNBOztBQUNELFFBQU1LLE9BQU9ELE9BQU9FLEtBQVAsQ0FBYUMsT0FBYixDQUFxQkgsT0FBT0QsTUFBUCxFQUFyQixDQUFiO0FBQ0EsUUFBTThCLGNBQWMzQyxXQUFXbUIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLGlCQUF4QixDQUEwQ1gsUUFBMUMsQ0FBcEI7O0FBQ0EsTUFBSWlDLGVBQWUsSUFBbkIsRUFBeUI7QUFDeEIsV0FBTzNDLFdBQVdzQixhQUFYLENBQXlCQyxVQUF6QixDQUFvQ1QsT0FBT0QsTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUN0RVcsV0FBS0MsT0FBT0MsRUFBUCxFQURpRTtBQUV0RUMsV0FBS3JCLEtBQUtxQixHQUY0RDtBQUd0RUMsVUFBSSxJQUFJQyxJQUFKLEVBSGtFO0FBSXRFQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsdUJBQVgsRUFBb0M7QUFDeENDLHFCQUFhLFNBRDJCO0FBRXhDQyxpQkFBUyxDQUFDeEIsUUFBRDtBQUYrQixPQUFwQyxFQUdGSyxLQUFLb0IsUUFISDtBQUppRSxLQUFoRSxDQUFQO0FBU0E7O0FBRUQsUUFBTUMsZUFBZXBDLFdBQVdtQixNQUFYLENBQWtCa0IsYUFBbEIsQ0FBZ0NDLHdCQUFoQyxDQUF5RGhDLEtBQUtxQixHQUE5RCxFQUFtRWdCLFlBQVluQixHQUEvRSxFQUFvRjtBQUFFZSxZQUFRO0FBQUVmLFdBQUs7QUFBUDtBQUFWLEdBQXBGLENBQXJCOztBQUNBLE1BQUksQ0FBQ1ksWUFBTCxFQUFtQjtBQUNsQixXQUFPcEMsV0FBV3NCLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DVCxPQUFPRCxNQUFQLEVBQXBDLEVBQXFELFNBQXJELEVBQWdFO0FBQ3RFVyxXQUFLQyxPQUFPQyxFQUFQLEVBRGlFO0FBRXRFQyxXQUFLckIsS0FBS3FCLEdBRjREO0FBR3RFQyxVQUFJLElBQUlDLElBQUosRUFIa0U7QUFJdEVDLFdBQUtDLFFBQVFDLEVBQVIsQ0FBVyw4QkFBWCxFQUEyQztBQUMvQ0MscUJBQWEsU0FEa0M7QUFFL0NDLGlCQUFTLENBQUN4QixRQUFEO0FBRnNDLE9BQTNDLEVBR0ZLLEtBQUtvQixRQUhIO0FBSmlFLEtBQWhFLENBQVA7QUFTQTs7QUFDRHJCLFNBQU8wQixJQUFQLENBQVksa0JBQVosRUFBZ0M7QUFDL0JiLFNBQUtyQixLQUFLcUIsR0FEcUI7QUFFL0JqQjtBQUYrQixHQUFoQztBQUlBLENBdkNELEVBdUNHO0FBQ0YrQixlQUFhLHdCQURYO0FBRUZwQyxVQUFRO0FBRk4sQ0F2Q0gsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbGFzaGNvbW1hbmRzLW11dGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8qXG4qIE11dGUgaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcmVwbGFjZSAvbXV0ZSBjb21tYW5kc1xuKi9cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgnbXV0ZScsIGZ1bmN0aW9uIE11dGUoY29tbWFuZCwgcGFyYW1zLCBpdGVtKSB7XG5cdGlmIChjb21tYW5kICE9PSAnbXV0ZScgfHwgIU1hdGNoLnRlc3QocGFyYW1zLCBTdHJpbmcpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IHVzZXJuYW1lID0gcGFyYW1zLnRyaW0oKS5yZXBsYWNlKCdAJywgJycpO1xuXHRpZiAodXNlcm5hbWUgPT09ICcnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IHVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG5cdGNvbnN0IG11dGVkVXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblx0aWYgKG11dGVkVXNlciA9PSBudWxsKSB7XG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlcklkLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlLFxuXHRcdFx0bXNnOiBUQVBpMThuLl9fKCdVc2VybmFtZV9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFt1c2VybmFtZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQoaXRlbS5yaWQsIG11dGVkVXNlci5faWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRpZiAoIXN1YnNjcmlwdGlvbikge1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXJJZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnVXNlcm5hbWVfaXNfbm90X2luX3RoaXNfcm9vbScsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW3VzZXJuYW1lXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0TWV0ZW9yLmNhbGwoJ211dGVVc2VySW5Sb29tJywge1xuXHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0dXNlcm5hbWVcblx0fSk7XG59LCB7XG5cdGRlc2NyaXB0aW9uOiAnTXV0ZV9zb21lb25lX2luX3Jvb20nLFxuXHRwYXJhbXM6ICdAdXNlcm5hbWUnXG59KTtcbiIsIlxuLypcbiogVW5tdXRlIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL3VubXV0ZSBjb21tYW5kc1xuKi9cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgndW5tdXRlJywgZnVuY3Rpb24gVW5tdXRlKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXG5cdGlmIChjb21tYW5kICE9PSAndW5tdXRlJyB8fCAhTWF0Y2gudGVzdChwYXJhbXMsIFN0cmluZykpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdXNlcm5hbWUgPSBwYXJhbXMudHJpbSgpLnJlcGxhY2UoJ0AnLCAnJyk7XG5cdGlmICh1c2VybmFtZSA9PT0gJycpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKE1ldGVvci51c2VySWQoKSk7XG5cdGNvbnN0IHVubXV0ZWRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXHRpZiAodW5tdXRlZFVzZXIgPT0gbnVsbCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJuYW1lX2RvZXNudF9leGlzdCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW3VzZXJuYW1lXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKGl0ZW0ucmlkLCB1bm11dGVkVXNlci5faWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRpZiAoIXN1YnNjcmlwdGlvbikge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJuYW1lX2lzX25vdF9pbl90aGlzX3Jvb20nLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFt1c2VybmFtZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdH1cblx0TWV0ZW9yLmNhbGwoJ3VubXV0ZVVzZXJJblJvb20nLCB7XG5cdFx0cmlkOiBpdGVtLnJpZCxcblx0XHR1c2VybmFtZVxuXHR9KTtcbn0sIHtcblx0ZGVzY3JpcHRpb246ICdVbm11dGVfc29tZW9uZV9pbl9yb29tJyxcblx0cGFyYW1zOiAnQHVzZXJuYW1lJ1xufSk7XG4iXX0=
