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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-invite-all":{"server":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_slashcommands-invite-all/server/server.js                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */
function inviteAll(type) {
  return function inviteAll(command, params, item) {
    if (!/invite\-all-(to|from)/.test(command) || !Match.test(params, String)) {
      return;
    }

    const regexp = /#?([\d-_\w]+)/g;
    const [, channel] = regexp.exec(params.trim());

    if (!channel) {
      return;
    }

    const userId = Meteor.userId();
    const currentUser = Meteor.users.findOne(userId);
    const baseChannel = type === 'to' ? RocketChat.models.Rooms.findOneById(item.rid) : RocketChat.models.Rooms.findOneByName(channel);
    const targetChannel = type === 'from' ? RocketChat.models.Rooms.findOneById(item.rid) : RocketChat.models.Rooms.findOneByName(channel);

    if (!baseChannel) {
      return RocketChat.Notifications.notifyUser(userId, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('Channel_doesnt_exist', {
          postProcess: 'sprintf',
          sprintf: [channel]
        }, currentUser.language)
      });
    }

    const cursor = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(baseChannel._id, {
      fields: {
        'u.username': 1
      }
    });

    try {
      if (cursor.count() > RocketChat.settings.get('API_User_Limit')) {
        throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
          method: 'addAllToRoom'
        });
      }

      const users = cursor.fetch().map(s => s.u.username);

      if (!targetChannel && ['c', 'p'].indexOf(baseChannel.t) > -1) {
        Meteor.call(baseChannel.t === 'c' ? 'createChannel' : 'createPrivateGroup', channel, users);
        RocketChat.Notifications.notifyUser(userId, 'message', {
          _id: Random.id(),
          rid: item.rid,
          ts: new Date(),
          msg: TAPi18n.__('Channel_created', {
            postProcess: 'sprintf',
            sprintf: [channel]
          }, currentUser.language)
        });
      } else {
        Meteor.call('addUsersToRoom', {
          rid: targetChannel._id,
          users
        });
      }

      return RocketChat.Notifications.notifyUser(userId, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('Users_added', null, currentUser.language)
      });
    } catch (e) {
      const msg = e.error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : e.error;
      RocketChat.Notifications.notifyUser(userId, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__(msg, null, currentUser.language)
      });
    }
  };
}

RocketChat.slashCommands.add('invite-all-to', inviteAll('to'), {
  description: 'Invite_user_to_join_channel_all_to',
  params: '#room'
});
RocketChat.slashCommands.add('invite-all-from', inviteAll('from'), {
  description: 'Invite_user_to_join_channel_all_from',
  params: '#room'
});
module.exports = inviteAll;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-invite-all/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-invite-all");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-invite-all.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWludml0ZS1hbGwvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJpbnZpdGVBbGwiLCJ0eXBlIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJ0ZXN0IiwiTWF0Y2giLCJTdHJpbmciLCJyZWdleHAiLCJjaGFubmVsIiwiZXhlYyIsInRyaW0iLCJ1c2VySWQiLCJNZXRlb3IiLCJjdXJyZW50VXNlciIsInVzZXJzIiwiZmluZE9uZSIsImJhc2VDaGFubmVsIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlJvb21zIiwiZmluZE9uZUJ5SWQiLCJyaWQiLCJmaW5kT25lQnlOYW1lIiwidGFyZ2V0Q2hhbm5lbCIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsImN1cnNvciIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kQnlSb29tSWRXaGVuVXNlcm5hbWVFeGlzdHMiLCJmaWVsZHMiLCJjb3VudCIsInNldHRpbmdzIiwiZ2V0IiwiRXJyb3IiLCJtZXRob2QiLCJmZXRjaCIsIm1hcCIsInMiLCJ1IiwidXNlcm5hbWUiLCJpbmRleE9mIiwidCIsImNhbGwiLCJlIiwiZXJyb3IiLCJzbGFzaENvbW1hbmRzIiwiYWRkIiwiZGVzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUtBLFNBQVNBLFNBQVQsQ0FBbUJDLElBQW5CLEVBQXlCO0FBQ3hCLFNBQU8sU0FBU0QsU0FBVCxDQUFtQkUsT0FBbkIsRUFBNEJDLE1BQTVCLEVBQW9DQyxJQUFwQyxFQUEwQztBQUVoRCxRQUFJLENBQUMsd0JBQXdCQyxJQUF4QixDQUE2QkgsT0FBN0Is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QWhELEVBQW1FO0FBQ2xFMkQsZUFBYSxzQ0FEcUQ7QUFFbEV4RCxVQUFRO0FBRjBELENBQW5FO0FBSUF5RCxPQUFPQyxPQUFQLEdBQWlCN0QsU0FBakIsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbGFzaGNvbW1hbmRzLWludml0ZS1hbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSW52aXRlIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL2ludml0ZSBjb21tYW5kc1xuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiAqL1xuXG5mdW5jdGlvbiBpbnZpdGVBbGwodHlwZSkge1xuXHRyZXR1cm4gZnVuY3Rpb24gaW52aXRlQWxsKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXG5cdFx0aWYgKCEvaW52aXRlXFwtYWxsLSh0b3xmcm9tKS8udGVzdChjb21tYW5kKSB8fCAhTWF0Y2gudGVzdChwYXJhbXMsIFN0cmluZykpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCByZWdleHAgPSAvIz8oW1xcZC1fXFx3XSspL2c7XG5cdFx0Y29uc3QgWywgY2hhbm5lbF0gPSByZWdleHAuZXhlYyhwYXJhbXMudHJpbSgpKTtcblxuXHRcdGlmICghY2hhbm5lbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb25zdCB1c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0Y29uc3QgY3VycmVudFVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuXHRcdGNvbnN0IGJhc2VDaGFubmVsID0gdHlwZSA9PT0gJ3RvJyA/IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGl0ZW0ucmlkKSA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY2hhbm5lbCk7XG5cdFx0Y29uc3QgdGFyZ2V0Q2hhbm5lbCA9IHR5cGUgPT09ICdmcm9tJyA/IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGl0ZW0ucmlkKSA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY2hhbm5lbCk7XG5cblx0XHRpZiAoIWJhc2VDaGFubmVsKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlcklkLCAnbWVzc2FnZScsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnQ2hhbm5lbF9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRzcHJpbnRmOiBbY2hhbm5lbF1cblx0XHRcdFx0fSwgY3VycmVudFVzZXIubGFuZ3VhZ2UpXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlSb29tSWRXaGVuVXNlcm5hbWVFeGlzdHMoYmFzZUNoYW5uZWwuX2lkLCB7IGZpZWxkczogeyAndS51c2VybmFtZSc6IDEgfSB9KTtcblxuXHRcdHRyeSB7XG5cdFx0XHRpZiAoY3Vyc29yLmNvdW50KCkgPiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1VzZXJfTGltaXQnKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci11c2VyLWxpbWl0LWV4Y2VlZGVkJywgJ1VzZXIgTGltaXQgRXhjZWVkZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnYWRkQWxsVG9Sb29tJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IHVzZXJzID0gY3Vyc29yLmZldGNoKCkubWFwKHMgPT4gcy51LnVzZXJuYW1lKTtcblxuXHRcdFx0aWYgKCF0YXJnZXRDaGFubmVsICYmIFsnYycsICdwJ10uaW5kZXhPZihiYXNlQ2hhbm5lbC50KSA+IC0xKSB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKGJhc2VDaGFubmVsLnQgPT09ICdjJyA/ICdjcmVhdGVDaGFubmVsJyA6ICdjcmVhdGVQcml2YXRlR3JvdXAnLCBjaGFubmVsLCB1c2Vycyk7XG5cdFx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXJJZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnQ2hhbm5lbF9jcmVhdGVkJywge1xuXHRcdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRcdHNwcmludGY6IFtjaGFubmVsXVxuXHRcdFx0XHRcdH0sIGN1cnJlbnRVc2VyLmxhbmd1YWdlKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdhZGRVc2Vyc1RvUm9vbScsIHtcblx0XHRcdFx0XHRyaWQ6IHRhcmdldENoYW5uZWwuX2lkLFxuXHRcdFx0XHRcdHVzZXJzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXJJZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJzX2FkZGVkJywgbnVsbCwgY3VycmVudFVzZXIubGFuZ3VhZ2UpXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zdCBtc2cgPSBlLmVycm9yID09PSAnY2FudC1pbnZpdGUtZm9yLWRpcmVjdC1yb29tJyA/ICdDYW5ub3RfaW52aXRlX3VzZXJzX3RvX2RpcmVjdF9yb29tcycgOiBlLmVycm9yO1xuXHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlcklkLCAnbWVzc2FnZScsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXyhtc2csIG51bGwsIGN1cnJlbnRVc2VyLmxhbmd1YWdlKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufVxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdpbnZpdGUtYWxsLXRvJywgaW52aXRlQWxsKCd0bycpLCB7XG5cdGRlc2NyaXB0aW9uOiAnSW52aXRlX3VzZXJfdG9fam9pbl9jaGFubmVsX2FsbF90bycsXG5cdHBhcmFtczogJyNyb29tJ1xufSk7XG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdpbnZpdGUtYWxsLWZyb20nLCBpbnZpdGVBbGwoJ2Zyb20nKSwge1xuXHRkZXNjcmlwdGlvbjogJ0ludml0ZV91c2VyX3RvX2pvaW5fY2hhbm5lbF9hbGxfZnJvbScsXG5cdHBhcmFtczogJyNyb29tJ1xufSk7XG5tb2R1bGUuZXhwb3J0cyA9IGludml0ZUFsbDtcbiJdfQ==
