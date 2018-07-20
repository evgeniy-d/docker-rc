(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-topic":{"topic.js":function(){

//////////////////////////////////////////////////////////////////////////////////////
//                                                                                  //
// packages/rocketchat_slashcommands-topic/topic.js                                 //
//                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////
                                                                                    //
/*
 * Join is a named function that will replace /topic commands
 * @param {Object} message - The message object
 */
function Topic(command, params, item) {
  if (command === 'topic') {
    if (Meteor.isClient && RocketChat.authz.hasAtLeastOnePermission('edit-room', item.rid) || Meteor.isServer && RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', item.rid)) {
      Meteor.call('saveRoomSettings', item.rid, 'roomTopic', params, err => {
        if (err) {
          if (Meteor.isClient) {
            return handleError(err);
          } else {
            throw err;
          }
        }

        if (Meteor.isClient) {
          RocketChat.callbacks.run('roomTopicChanged', ChatRoom.findOne(item.rid));
        }
      });
    }
  }
}

RocketChat.slashCommands.add('topic', Topic, {
  description: 'Slash_Topic_Description',
  params: 'Slash_Topic_Params'
});
//////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-topic/topic.js");

/* Exports */
Package._define("rocketchat:slashcommands-topic");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-topic.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLXRvcGljL3RvcGljLmpzIl0sIm5hbWVzIjpbIlRvcGljIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJNZXRlb3IiLCJpc0NsaWVudCIsIlJvY2tldENoYXQiLCJhdXRoeiIsImhhc0F0TGVhc3RPbmVQZXJtaXNzaW9uIiwicmlkIiwiaXNTZXJ2ZXIiLCJoYXNQZXJtaXNzaW9uIiwidXNlcklkIiwiY2FsbCIsImVyciIsImhhbmRsZUVycm9yIiwiY2FsbGJhY2tzIiwicnVuIiwiQ2hhdFJvb20iLCJmaW5kT25lIiwic2xhc2hDb21tYW5kcyIsImFkZCIsImRlc2NyaXB0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFLQSxTQUFTQSxLQUFULENBQWVDLE9BQWYsRUFBd0JDLE1BQXhCLEVBQWdDQyxJQUFoQyxFQUFzQztBQUNyQyxNQUFJRixZQUFZLE9BQWhCLEVBQXlCO0FBQ3hCLFFBQUlHLE9BQU9DLFFBQVAsSUFBbUJDLFdBQVdDLEtBQVgsQ0FBaUJDLHVCQUFqQixDQUF5QyxXQUF6QyxFQUFzREwsS0FBS00sR0FBM0QsQ0FBbkIsSUFBdUZMLE9BQU9NLFFBQVAsSUFBbUJKLFdBQVdDLEtBQVgsQ0FBaUJJLGFBQWpCLENBQStCUCxPQUFPUSxNQUFQLEVBQS9CLEVBQWdELFdBQWhELEVBQTZEVCxLQUFLTSxHQUFsRSxDQUE5RyxFQUF1TDtBQUN0TEwsYUFBT1MsSUFBUCxDQUFZLGtCQUFaLEVBQWdDVixLQUFLTSxHQUFyQyxFQUEwQyxXQUExQyxFQUF1RFAsTUFBdkQsRUFBZ0VZLEdBQUQsSUFBUztBQUN2RSxZQUFJQSxHQUFKLEVBQVM7QUFDUixjQUFJVixPQUFPQyxRQUFYLEVBQXFCO0FBQ3BCLG1CQUFPVSxZQUFZRCxHQUFaLENBQVA7QUFDQSxXQUZELE1BRU87QUFDTixrQkFBTUEsR0FBTjtBQUNBO0FBQ0Q7O0FBRUQsWUFBSVYsT0FBT0MsUUFBWCxFQUFxQjtBQUNwQkMscUJBQVdVLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGtCQUF6QixFQUE2Q0MsU0FBU0MsT0FBVCxDQUFpQmhCLEtBQUtNLEdBQXRCLENBQTdDO0FBQ0E7QUFDRCxPQVpEO0FBYUE7QUFDRDtBQUNEOztBQUVESCxXQUFXYyxhQUFYLENBQXlCQyxHQUF6QixDQUE2QixPQUE3QixFQUFzQ3JCLEtBQXRDLEVBQTZDO0FBQzVDc0IsZUFBYSx5QkFEK0I7QUFFNUNwQixVQUFRO0FBRm9DLENBQTdDLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy10b3BpYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBKb2luIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL3RvcGljIGNvbW1hbmRzXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5cbmZ1bmN0aW9uIFRvcGljKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCA9PT0gJ3RvcGljJykge1xuXHRcdGlmIChNZXRlb3IuaXNDbGllbnQgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNBdExlYXN0T25lUGVybWlzc2lvbignZWRpdC1yb29tJywgaXRlbS5yaWQpIHx8IChNZXRlb3IuaXNTZXJ2ZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2VkaXQtcm9vbScsIGl0ZW0ucmlkKSkpIHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgaXRlbS5yaWQsICdyb29tVG9waWMnLCBwYXJhbXMsIChlcnIpID0+IHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdGlmIChNZXRlb3IuaXNDbGllbnQpIHtcblx0XHRcdFx0XHRcdHJldHVybiBoYW5kbGVFcnJvcihlcnIpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBlcnI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bigncm9vbVRvcGljQ2hhbmdlZCcsIENoYXRSb29tLmZpbmRPbmUoaXRlbS5yaWQpKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ3RvcGljJywgVG9waWMsIHtcblx0ZGVzY3JpcHRpb246ICdTbGFzaF9Ub3BpY19EZXNjcmlwdGlvbicsXG5cdHBhcmFtczogJ1NsYXNoX1RvcGljX1BhcmFtcydcbn0pO1xuIl19
