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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-unarchive":{"server":{"messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/rocketchat_slashcommands-unarchive/server/messages.js                          //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
RocketChat.models.Messages.createRoomUnarchivedByRoomIdAndUser = function (roomId, user) {
  return this.createWithTypeRoomIdMessageAndUser('room-unarchived', roomId, '', user);
};
/////////////////////////////////////////////////////////////////////////////////////////////

},"server.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/rocketchat_slashcommands-unarchive/server/server.js                            //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
function Unarchive(command, params, item) {
  if (command !== 'unarchive' || !Match.test(params, String)) {
    return;
  }

  let channel = params.trim();
  let room;

  if (channel === '') {
    room = RocketChat.models.Rooms.findOneById(item.rid);
    channel = room.name;
  } else {
    channel = channel.replace('#', '');
    room = RocketChat.models.Rooms.findOneByName(channel);
  }

  const user = Meteor.users.findOne(Meteor.userId());

  if (!room) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Channel_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [channel]
      }, user.language)
    });
  } // You can not archive direct messages.


  if (room.t === 'd') {
    return;
  }

  if (!room.archived) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Channel_already_Unarchived', {
        postProcess: 'sprintf',
        sprintf: [channel]
      }, user.language)
    });
    return;
  }

  Meteor.call('unarchiveRoom', room._id);
  RocketChat.models.Messages.createRoomUnarchivedByRoomIdAndUser(room._id, Meteor.user());
  RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
    _id: Random.id(),
    rid: item.rid,
    ts: new Date(),
    msg: TAPi18n.__('Channel_Unarchived', {
      postProcess: 'sprintf',
      sprintf: [channel]
    }, user.language)
  });
  return Unarchive;
}

RocketChat.slashCommands.add('unarchive', Unarchive, {
  description: 'Unarchive',
  params: '#channel'
});
/////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-unarchive/server/messages.js");
require("/node_modules/meteor/rocketchat:slashcommands-unarchive/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-unarchive");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-unarchive.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLXVuYXJjaGl2ZS9zZXJ2ZXIvbWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhc2hjb21tYW5kcy11bmFyY2hpdmUvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0IiwibW9kZWxzIiwiTWVzc2FnZXMiLCJjcmVhdGVSb29tVW5hcmNoaXZlZEJ5Um9vbUlkQW5kVXNlciIsInJvb21JZCIsInVzZXIiLCJjcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyIiwiVW5hcmNoaXZlIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJjaGFubmVsIiwidHJpbSIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeUlkIiwicmlkIiwibmFtZSIsInJlcGxhY2UiLCJmaW5kT25lQnlOYW1lIiwiTWV0ZW9yIiwidXNlcnMiLCJmaW5kT25lIiwidXNlcklkIiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeVVzZXIiLCJfaWQiLCJSYW5kb20iLCJpZCIsInRzIiwiRGF0ZSIsIm1zZyIsIlRBUGkxOG4iLCJfXyIsInBvc3RQcm9jZXNzIiwic3ByaW50ZiIsImxhbmd1YWdlIiwidCIsImFyY2hpdmVkIiwiY2FsbCIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyxtQ0FBM0IsR0FBaUUsVUFBU0MsTUFBVCxFQUFpQkMsSUFBakIsRUFBdUI7QUFDdkYsU0FBTyxLQUFLQyxrQ0FBTCxDQUF3QyxpQkFBeEMsRUFBMkRGLE1BQTNELEVBQW1FLEVBQW5FLEVBQXVFQyxJQUF2RSxDQUFQO0FBQ0EsQ0FGRCxDOzs7Ozs7Ozs7OztBQ0FB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QUFRO0FBRjRDLENBQXJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy11bmFyY2hpdmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tVW5hcmNoaXZlZEJ5Um9vbUlkQW5kVXNlciA9IGZ1bmN0aW9uKHJvb21JZCwgdXNlcikge1xuXHRyZXR1cm4gdGhpcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tLXVuYXJjaGl2ZWQnLCByb29tSWQsICcnLCB1c2VyKTtcbn07XG4iLCJmdW5jdGlvbiBVbmFyY2hpdmUoY29tbWFuZCwgcGFyYW1zLCBpdGVtKSB7XG5cdGlmIChjb21tYW5kICE9PSAndW5hcmNoaXZlJyB8fCAhTWF0Y2gudGVzdChwYXJhbXMsIFN0cmluZykpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRsZXQgY2hhbm5lbCA9IHBhcmFtcy50cmltKCk7XG5cdGxldCByb29tO1xuXG5cdGlmIChjaGFubmVsID09PSAnJykge1xuXHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpdGVtLnJpZCk7XG5cdFx0Y2hhbm5lbCA9IHJvb20ubmFtZTtcblx0fSBlbHNlIHtcblx0XHRjaGFubmVsID0gY2hhbm5lbC5yZXBsYWNlKCcjJywgJycpO1xuXHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKGNoYW5uZWwpO1xuXHR9XG5cblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKE1ldGVvci51c2VySWQoKSk7XG5cblx0aWYgKCFyb29tKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0bXNnOiBUQVBpMThuLl9fKCdDaGFubmVsX2RvZXNudF9leGlzdCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gWW91IGNhbiBub3QgYXJjaGl2ZSBkaXJlY3QgbWVzc2FnZXMuXG5cdGlmIChyb29tLnQgPT09ICdkJykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmICghcm9vbS5hcmNoaXZlZCkge1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0bXNnOiBUQVBpMThuLl9fKCdDaGFubmVsX2FscmVhZHlfVW5hcmNoaXZlZCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdH0pO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdE1ldGVvci5jYWxsKCd1bmFyY2hpdmVSb29tJywgcm9vbS5faWQpO1xuXG5cdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21VbmFyY2hpdmVkQnlSb29tSWRBbmRVc2VyKHJvb20uX2lkLCBNZXRlb3IudXNlcigpKTtcblx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0bXNnOiBUQVBpMThuLl9fKCdDaGFubmVsX1VuYXJjaGl2ZWQnLCB7XG5cdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0fSk7XG5cblx0cmV0dXJuIFVuYXJjaGl2ZTtcbn1cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgndW5hcmNoaXZlJywgVW5hcmNoaXZlLCB7XG5cdGRlc2NyaXB0aW9uOiAnVW5hcmNoaXZlJyxcblx0cGFyYW1zOiAnI2NoYW5uZWwnXG59KTtcbiJdfQ==
