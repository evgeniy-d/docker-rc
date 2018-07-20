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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-create":{"server":{"server.js":function(){

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/rocketchat_slashcommands-create/server/server.js                   //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
function Create(command, params, item) {
  function getParams(str) {
    const regex = /(--(\w+))+/g;
    const result = [];
    let m;

    while ((m = regex.exec(str)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      result.push(m[2]);
    }

    return result;
  }

  const regexp = new RegExp(RocketChat.settings.get('UTF8_Names_Validation'));

  if (command !== 'create' || !Match.test(params, String)) {
    return;
  }

  let channel = regexp.exec(params.trim());
  channel = channel ? channel[0] : '';

  if (channel === '') {
    return;
  }

  const user = Meteor.users.findOne(Meteor.userId());
  const room = RocketChat.models.Rooms.findOneByName(channel);

  if (room != null) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Channel_already_exist', {
        postProcess: 'sprintf',
        sprintf: [channel]
      }, user.language)
    });
    return;
  }

  if (getParams(params).indexOf('private') > -1) {
    return Meteor.call('createPrivateGroup', channel, []);
  }

  Meteor.call('createChannel', channel, []);
}

RocketChat.slashCommands.add('create', Create, {
  description: 'Create_A_New_Channel',
  params: '#channel'
});
/////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-create/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-create");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-create.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWNyZWF0ZS9zZXJ2ZXIvc2VydmVyLmpzIl0sIm5hbWVzIjpbIkNyZWF0ZSIsImNvbW1hbmQiLCJwYXJhbXMiLCJpdGVtIiwiZ2V0UGFyYW1zIiwic3RyIiwicmVnZXgiLCJyZXN1bHQiLCJtIiwiZXhlYyIsImluZGV4IiwibGFzdEluZGV4IiwicHVzaCIsInJlZ2V4cCIsIlJlZ0V4cCIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsImNoYW5uZWwiLCJ0cmltIiwidXNlciIsIk1ldGVvciIsInVzZXJzIiwiZmluZE9uZSIsInVzZXJJZCIsInJvb20iLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5VXNlciIsIl9pZCIsIlJhbmRvbSIsImlkIiwicmlkIiwidHMiLCJEYXRlIiwibXNnIiwiVEFQaTE4biIsIl9fIiwicG9zdFByb2Nlc3MiLCJzcHJpbnRmIiwibGFuZ3VhZ2UiLCJpbmRleE9mIiwiY2FsbCIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsU0FBU0EsTUFBVCxDQUFnQkMsT0FBaEIsRUFBeUJDLE1BQXpCLEVBQWlDQyxJQUFqQyxFQUF1QztBQUN0QyxXQUFTQyxTQUFULENBQW1CQyxHQUFuQixFQUF3QjtBQUN2QixVQUFNQyxRQUFRLGFBQWQ7QUFDQSxVQUFNQyxTQUFTLEVBQWY7QUFDQSxRQUFJQyxDQUFKOztBQUNBLFdBQU8sQ0FBQ0EsSUFBSUYsTUFBTUcsSUFBTixDQUFXSixHQUFYLENBQUwsTUFBMEIsSUFBakMsRUFBdUM7QUFDdEMsVUFBSUcsRUFBRUUsS0FBRixLQUFZSixNQUFNSyxTQUF0QixFQUFpQztBQUNoQ0wsY0FBTUssU0FBTjtBQUNBOztBQUNESixhQUFPSyxJQUFQLENBQVlKLEVBQUUsQ0FBRixDQUFaO0FBQ0E7O0FBQ0QsV0FBT0QsTUFBUDtBQUNBOztBQUVELFFBQU1NLFNBQVMsSUFBSUMsTUFBSixDQUFXQyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix1QkFBeEIsQ0FBWCxDQUFmOztBQUVBLE1BQUloQixZQUFZLFFBQVosSUFBd0IsQ0FBQ2lCLE1BQU1DLElBQU4sQ0FBV2pCLE1BQVgsRUFBbUJrQixNQUFuQixDQUE3QixFQUF5RDtBQUN4RDtBQUNBOztBQUNELE1BQUlDLFVBQVVSLE9BQU9KLElBQVAsQ0FBWVAsT0FBT29CLElBQVAsRUFBWixDQUFkO0FBQ0FELFlBQVVBLFVBQVVBLFFBQVEsQ0FBUixDQUFWLEdBQXVCLEVBQWpDOztBQUNBLE1BQUlBLFlBQVksRUFBaEIsRUFBb0I7QUFDbkI7QUFDQTs7QUFFRCxRQUFNRSxPQUFPQyxPQUFPQyxLQUFQLENBQWFDLE9BQWIsQ0FBcUJGLE9BQU9HLE1BQVAsRUFBckIsQ0FBYjtBQUNBLFFBQU1DLE9BQU9iLFdBQVdjLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxhQUF4QixDQUFzQ1YsT0FBdEMsQ0FBYjs7QUFDQSxNQUFJTyxRQUFRLElBQVosRUFBa0I7QUFDakJiLGVBQVdpQixhQUFYLENBQXlCQyxVQUF6QixDQUFvQ1QsT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUMvRE8sV0FBS0MsT0FBT0MsRUFBUCxFQUQwRDtBQUUvREMsV0FBS2xDLEtBQUtrQyxHQUZxRDtBQUcvREMsVUFBSSxJQUFJQyxJQUFKLEVBSDJEO0FBSS9EQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsdUJBQVgsRUFBb0M7QUFDeENDLHFCQUFhLFNBRDJCO0FBRXhDQyxpQkFBUyxDQUFDdkIsT0FBRDtBQUYrQixPQUFwQyxFQUdGRSxLQUFLc0IsUUFISDtBQUowRCxLQUFoRTtBQVNBO0FBQ0E7O0FBRUQsTUFBSXpDLFVBQVVGLE1BQVYsRUFBa0I0QyxPQUFsQixDQUEwQixTQUExQixJQUF1QyxDQUFDLENBQTVDLEVBQStDO0FBQzlDLFdBQU90QixPQUFPdUIsSUFBUCxDQUFZLG9CQUFaLEVBQWtDMUIsT0FBbEMsRUFBMkMsRUFBM0MsQ0FBUDtBQUNBOztBQUVERyxTQUFPdUIsSUFBUCxDQUFZLGVBQVosRUFBNkIxQixPQUE3QixFQUFzQyxFQUF0QztBQUNBOztBQUVETixXQUFXaUMsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsUUFBN0IsRUFBdUNqRCxNQUF2QyxFQUErQztBQUM5Q2tELGVBQWEsc0JBRGlDO0FBRTlDaEQsVUFBUTtBQUZzQyxDQUEvQyxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NsYXNoY29tbWFuZHMtY3JlYXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gQ3JlYXRlKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRmdW5jdGlvbiBnZXRQYXJhbXMoc3RyKSB7XG5cdFx0Y29uc3QgcmVnZXggPSAvKC0tKFxcdyspKSsvZztcblx0XHRjb25zdCByZXN1bHQgPSBbXTtcblx0XHRsZXQgbTtcblx0XHR3aGlsZSAoKG0gPSByZWdleC5leGVjKHN0cikpICE9PSBudWxsKSB7XG5cdFx0XHRpZiAobS5pbmRleCA9PT0gcmVnZXgubGFzdEluZGV4KSB7XG5cdFx0XHRcdHJlZ2V4Lmxhc3RJbmRleCsrO1xuXHRcdFx0fVxuXHRcdFx0cmVzdWx0LnB1c2gobVsyXSk7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRjb25zdCByZWdleHAgPSBuZXcgUmVnRXhwKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVVEY4X05hbWVzX1ZhbGlkYXRpb24nKSk7XG5cblx0aWYgKGNvbW1hbmQgIT09ICdjcmVhdGUnIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgY2hhbm5lbCA9IHJlZ2V4cC5leGVjKHBhcmFtcy50cmltKCkpO1xuXHRjaGFubmVsID0gY2hhbm5lbCA/IGNoYW5uZWxbMF0gOiAnJztcblx0aWYgKGNoYW5uZWwgPT09ICcnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKE1ldGVvci51c2VySWQoKSk7XG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKGNoYW5uZWwpO1xuXHRpZiAocm9vbSAhPSBudWxsKSB7XG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ0NoYW5uZWxfYWxyZWFkeV9leGlzdCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdH0pO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmIChnZXRQYXJhbXMocGFyYW1zKS5pbmRleE9mKCdwcml2YXRlJykgPiAtMSkge1xuXHRcdHJldHVybiBNZXRlb3IuY2FsbCgnY3JlYXRlUHJpdmF0ZUdyb3VwJywgY2hhbm5lbCwgW10pO1xuXHR9XG5cblx0TWV0ZW9yLmNhbGwoJ2NyZWF0ZUNoYW5uZWwnLCBjaGFubmVsLCBbXSk7XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ2NyZWF0ZScsIENyZWF0ZSwge1xuXHRkZXNjcmlwdGlvbjogJ0NyZWF0ZV9BX05ld19DaGFubmVsJyxcblx0cGFyYW1zOiAnI2NoYW5uZWwnXG59KTtcbiJdfQ==
