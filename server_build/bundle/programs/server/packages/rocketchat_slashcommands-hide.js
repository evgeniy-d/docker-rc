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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-hide":{"server":{"hide.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/rocketchat_slashcommands-hide/server/hide.js                                //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
/*
* Hide is a named function that will replace /hide commands
* @param {Object} message - The message object
*/
function Hide(command, param, item) {
  if (command !== 'hide' || !Match.test(param, String)) {
    return;
  }

  const room = param.trim();
  const user = Meteor.user(); // if there is not a param, hide the current room

  let {
    rid
  } = item;

  if (room !== '') {
    const [strippedRoom] = room.replace(/#|@/, '').split(' ');
    const [type] = room;
    const roomObject = type === '#' ? RocketChat.models.Rooms.findOneByName(strippedRoom) : RocketChat.models.Rooms.findOne({
      t: 'd',
      usernames: {
        $all: [user.username, strippedRoom]
      }
    });

    if (!roomObject) {
      return RocketChat.Notifications.notifyUser(user._id, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('Channel_doesnt_exist', {
          postProcess: 'sprintf',
          sprintf: [room]
        }, user.language)
      });
    }

    if (!RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
      fields: {
        _id: 1
      }
    })) {
      return RocketChat.Notifications.notifyUser(user._id, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('error-logged-user-not-in-room', {
          postProcess: 'sprintf',
          sprintf: [room]
        }, user.language)
      });
    }

    rid = roomObject._id;
  }

  Meteor.call('hideRoom', rid, error => {
    if (error) {
      return RocketChat.Notifications.notifyUser(user._id, 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__(error, null, user.language)
      });
    }
  });
}

RocketChat.slashCommands.add('hide', Hide, {
  description: 'Hide_room',
  params: '#room'
});
//////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-hide/server/hide.js");

/* Exports */
Package._define("rocketchat:slashcommands-hide");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-hide.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWhpZGUvc2VydmVyL2hpZGUuanMiXSwibmFtZXMiOlsiSGlkZSIsImNvbW1hbmQiLCJwYXJhbSIsIml0ZW0iLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJyb29tIiwidHJpbSIsInVzZXIiLCJNZXRlb3IiLCJyaWQiLCJzdHJpcHBlZFJvb20iLCJyZXBsYWNlIiwic3BsaXQiLCJ0eXBlIiwicm9vbU9iamVjdCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJmaW5kT25lIiwidCIsInVzZXJuYW1lcyIsIiRhbGwiLCJ1c2VybmFtZSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJmaWVsZHMiLCJjYWxsIiwiZXJyb3IiLCJzbGFzaENvbW1hbmRzIiwiYWRkIiwiZGVzY3JpcHRpb24iLCJwYXJhbXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTs7OztBQUlBLFNBQVNBLElBQVQsQ0FBY0MsT0FBZCxFQUF1QkMsS0FBdkIsRUFBOEJDLElBQTlCLEVBQW9DO0FBQ25DLE1BQUlGLFlBQVksTUFBWixJQUFzQixDQUFDRyxNQUFNQyxJQUFOLENBQVdILEtBQVgsRUFBa0JJLE1BQWxCLENBQTNCLEVBQXNEO0FBQ3JEO0FBQ0E7O0FBQ0QsUUFBTUMsT0FBT0wsTUFBTU0sSUFBTixFQUFiO0FBQ0EsUUFBTUMsT0FBT0MsT0FBT0QsSUFBUCxFQUFiLENBTG1DLENBTW5DOztBQUNBLE1BQUk7QUFBQ0U7QUFBRCxNQUFRUixJQUFaOztBQUNBLE1BQUlJLFNBQVMsRUFBYixFQUFpQjtBQUNoQixVQUFNLENBQUNLLFlBQUQsSUFBaUJMLEtBQUtNLE9BQUwsQ0FBYSxLQUFiLEVBQW9CLEVBQXBCLEVBQXdCQyxLQUF4QixDQUE4QixHQUE5QixDQUF2QjtBQUNBLFVBQU0sQ0FBQ0MsSUFBRCxJQUFTUixJQUFmO0FBRUEsVUFBTVMsYUFBYUQsU0FBUyxHQUFULEdBQWVFLFdBQVdDLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxhQUF4QixDQUFzQ1IsWUFBdEMsQ0FBZixHQUFxRUssV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JFLE9BQXhCLENBQWdDO0FBQ3ZIQyxTQUFHLEdBRG9IO0FBRXZIQyxpQkFBVztBQUFFQyxjQUFNLENBQUNmLEtBQUtnQixRQUFOLEVBQWdCYixZQUFoQjtBQUFSO0FBRjRHLEtBQWhDLENBQXhGOztBQUtBLFFBQUksQ0FBQ0ksVUFBTCxFQUFpQjtBQUNoQixhQUFPQyxXQUFXUyxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ2xCLEtBQUttQixHQUF6QyxFQUE4QyxTQUE5QyxFQUF5RDtBQUMvREEsYUFBS0MsT0FBT0MsRUFBUCxFQUQwRDtBQUUvRG5CLGFBQUtSLEtBQUtRLEdBRnFEO0FBRy9Eb0IsWUFBSSxJQUFJQyxJQUFKLEVBSDJEO0FBSS9EQyxhQUFLQyxRQUFRQyxFQUFSLENBQVcsc0JBQVgsRUFBbUM7QUFDdkNDLHVCQUFhLFNBRDBCO0FBRXZDQyxtQkFBUyxDQUFDOUIsSUFBRDtBQUY4QixTQUFuQyxFQUdGRSxLQUFLNkIsUUFISDtBQUowRCxPQUF6RCxDQUFQO0FBU0E7O0FBRUQsUUFBSSxDQUFDckIsV0FBV0MsTUFBWCxDQUFrQnFCLGFBQWxCLENBQWdDQyx3QkFBaEMsQ0FBeURqQyxLQUFLcUIsR0FBOUQsRUFBbUVuQixLQUFLbUIsR0FBeEUsRUFBNkU7QUFBRWEsY0FBUTtBQUFFYixhQUFLO0FBQVA7QUFBVixLQUE3RSxDQUFMLEVBQTJHO0FBQzFHLGFBQU9YLFdBQVdTLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DbEIsS0FBS21CLEdBQXpDLEVBQThDLFNBQTlDLEVBQXlEO0FBQy9EQSxhQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EbkIsYUFBS1IsS0FBS1EsR0FGcUQ7QUFHL0RvQixZQUFJLElBQUlDLElBQUosRUFIMkQ7QUFJL0RDLGFBQUtDLFFBQVFDLEVBQVIsQ0FBVywrQkFBWCxFQUE0QztBQUNoREMsdUJBQWEsU0FEbUM7QUFFaERDLG1CQUFTLENBQUM5QixJQUFEO0FBRnVDLFNBQTVDLEVBR0ZFLEtBQUs2QixRQUhIO0FBSjBELE9BQXpELENBQVA7QUFTQTs7QUFDRDNCLFVBQU1LLFdBQVdZLEdBQWpCO0FBQ0E7O0FBRURsQixTQUFPZ0MsSUFBUCxDQUFZLFVBQVosRUFBd0IvQixHQUF4QixFQUE2QmdDLFNBQVM7QUFDckMsUUFBSUEsS0FBSixFQUFXO0FBQ1YsYUFBTzFCLFdBQVdTLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DbEIsS0FBS21CLEdBQXpDLEVBQThDLFNBQTlDLEVBQXlEO0FBQy9EQSxhQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EbkIsYUFBS1IsS0FBS1EsR0FGcUQ7QUFHL0RvQixZQUFJLElBQUlDLElBQUosRUFIMkQ7QUFJL0RDLGFBQUtDLFFBQVFDLEVBQVIsQ0FBV1EsS0FBWCxFQUFrQixJQUFsQixFQUF3QmxDLEtBQUs2QixRQUE3QjtBQUowRCxPQUF6RCxDQUFQO0FBTUE7QUFDRCxHQVREO0FBVUE7O0FBRURyQixXQUFXMkIsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsTUFBN0IsRUFBcUM3QyxJQUFyQyxFQUEyQztBQUFFOEMsZUFBYSxXQUFmO0FBQTRCQyxVQUFRO0FBQXBDLENBQTNDLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy1oaWRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKlxuKiBIaWRlIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL2hpZGUgY29tbWFuZHNcbiogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiovXG5mdW5jdGlvbiBIaWRlKGNvbW1hbmQsIHBhcmFtLCBpdGVtKSB7XG5cdGlmIChjb21tYW5kICE9PSAnaGlkZScgfHwgIU1hdGNoLnRlc3QocGFyYW0sIFN0cmluZykpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3Qgcm9vbSA9IHBhcmFtLnRyaW0oKTtcblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cdC8vIGlmIHRoZXJlIGlzIG5vdCBhIHBhcmFtLCBoaWRlIHRoZSBjdXJyZW50IHJvb21cblx0bGV0IHtyaWR9ID0gaXRlbTtcblx0aWYgKHJvb20gIT09ICcnKSB7XG5cdFx0Y29uc3QgW3N0cmlwcGVkUm9vbV0gPSByb29tLnJlcGxhY2UoLyN8QC8sICcnKS5zcGxpdCgnICcpO1xuXHRcdGNvbnN0IFt0eXBlXSA9IHJvb207XG5cblx0XHRjb25zdCByb29tT2JqZWN0ID0gdHlwZSA9PT0gJyMnID8gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShzdHJpcHBlZFJvb20pIDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHR0OiAnZCcsXG5cdFx0XHR1c2VybmFtZXM6IHsgJGFsbDogW3VzZXIudXNlcm5hbWUsIHN0cmlwcGVkUm9vbV0gfVxuXHRcdH0pO1xuXG5cdFx0aWYgKCFyb29tT2JqZWN0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIodXNlci5faWQsICdtZXNzYWdlJywge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnQ2hhbm5lbF9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRzcHJpbnRmOiBbcm9vbV1cblx0XHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIuX2lkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKHVzZXIuX2lkLCAnbWVzc2FnZScsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdFx0dHM6IG5ldyBEYXRlLFxuXHRcdFx0XHRtc2c6IFRBUGkxOG4uX18oJ2Vycm9yLWxvZ2dlZC11c2VyLW5vdC1pbi1yb29tJywge1xuXHRcdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdFx0c3ByaW50ZjogW3Jvb21dXG5cdFx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0cmlkID0gcm9vbU9iamVjdC5faWQ7XG5cdH1cblxuXHRNZXRlb3IuY2FsbCgnaGlkZVJvb20nLCByaWQsIGVycm9yID0+IHtcblx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcih1c2VyLl9pZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKGVycm9yLCBudWxsLCB1c2VyLmxhbmd1YWdlKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgnaGlkZScsIEhpZGUsIHsgZGVzY3JpcHRpb246ICdIaWRlX3Jvb20nLCBwYXJhbXM6ICcjcm9vbScgfSk7XG4iXX0=
