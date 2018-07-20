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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:mentions":{"server":{"server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_mentions/server/server.js                                                             //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let MentionsServer;
module.watch(require("./Mentions"), {
  default(v) {
    MentionsServer = v;
  }

}, 1);
const mention = new MentionsServer({
  pattern: () => RocketChat.settings.get('UTF8_Names_Validation'),
  messageMaxAll: () => RocketChat.settings.get('Message_MaxAll'),
  getUsers: usernames => Meteor.users.find({
    username: {
      $in: _.unique(usernames)
    }
  }, {
    fields: {
      _id: true,
      username: true,
      name: 1
    }
  }).fetch(),
  getUser: userId => RocketChat.models.Users.findOneById(userId),
  getTotalChannelMembers: rid => RocketChat.models.Subscriptions.findByRoomId(rid).count(),
  getChannels: channels => RocketChat.models.Rooms.find({
    name: {
      $in: _.unique(channels)
    },
    t: 'c'
  }, {
    fields: {
      _id: 1,
      name: 1
    }
  }).fetch(),

  onMaxRoomMembersExceeded({
    sender,
    rid
  }) {
    // Get the language of the user for the error notification.
    const language = this.getUser(sender._id).language;

    const msg = TAPi18n.__('Group_mentions_disabled_x_members', {
      total: this.messageMaxAll
    }, language);

    RocketChat.Notifications.notifyUser(sender._id, 'message', {
      _id: Random.id(),
      rid,
      ts: new Date(),
      msg,
      groupable: false
    }); // Also throw to stop propagation of 'sendMessage'.

    throw new Meteor.Error('error-action-not-allowed', msg, {
      method: 'filterATAllTag',
      action: msg
    });
  }

});
RocketChat.callbacks.add('beforeSaveMessage', message => mention.execute(message), RocketChat.callbacks.priority.HIGH, 'mentions');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods":{"getUserMentionsByChannel.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_mentions/server/methods/getUserMentionsByChannel.js                                   //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
Meteor.methods({
  getUserMentionsByChannel({
    roomId,
    options
  }) {
    check(roomId, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getUserMentionsByChannel'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getUserMentionsByChannel'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());
    return RocketChat.models.Messages.findVisibleByMentionAndRoomId(user.username, roomId, options).fetch();
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"Mentions.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_mentions/server/Mentions.js                                                           //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.export({
  default: () => MentionsServer
});
let Mentions;
module.watch(require("../Mentions"), {
  default(v) {
    Mentions = v;
  }

}, 0);

class MentionsServer extends Mentions {
  constructor(args) {
    super(args);
    this.messageMaxAll = args.messageMaxAll;
    this.getChannel = args.getChannel;
    this.getChannels = args.getChannels;
    this.getUsers = args.getUsers;
    this.getUser = args.getUser;
    this.getTotalChannelMembers = args.getTotalChannelMembers;

    this.onMaxRoomMembersExceeded = args.onMaxRoomMembersExceeded || (() => {});
  }

  set getUsers(m) {
    this._getUsers = m;
  }

  get getUsers() {
    return typeof this._getUsers === 'function' ? this._getUsers : () => this._getUsers;
  }

  set getChannels(m) {
    this._getChannels = m;
  }

  get getChannels() {
    return typeof this._getChannels === 'function' ? this._getChannels : () => this._getChannels;
  }

  set getChannel(m) {
    this._getChannel = m;
  }

  get getChannel() {
    return typeof this._getChannel === 'function' ? this._getChannel : () => this._getChannel;
  }

  set messageMaxAll(m) {
    this._messageMaxAll = m;
  }

  get messageMaxAll() {
    return typeof this._messageMaxAll === 'function' ? this._messageMaxAll() : this._messageMaxAll;
  }

  getUsersByMentions({
    msg,
    rid,
    u: sender
  }) {
    let mentions = this.getUserMentions(msg);
    const mentionsAll = [];
    const userMentions = [];
    mentions.forEach(m => {
      const mention = m.trim().substr(1);

      if (mention !== 'all' && mention !== 'here') {
        return userMentions.push(mention);
      }

      if (this.messageMaxAll > 0 && this.getTotalChannelMembers(rid) > this.messageMaxAll) {
        return this.onMaxRoomMembersExceeded({
          sender,
          rid
        });
      }

      mentionsAll.push({
        _id: mention,
        username: mention
      });
    });
    mentions = userMentions.length ? this.getUsers(userMentions) : [];
    return [...mentionsAll, ...mentions];
  }

  getChannelbyMentions({
    msg
  }) {
    const channels = this.getChannelMentions(msg);
    return this.getChannels(channels.map(c => c.trim().substr(1)));
  }

  execute(message) {
    const mentionsAll = this.getUsersByMentions(message);
    const channels = this.getChannelbyMentions(message);
    message.mentions = mentionsAll;
    message.channels = channels;
    return message;
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"Mentions.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_mentions/Mentions.js                                                                  //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
module.exportDefault(class {
  constructor({
    pattern,
    useRealName,
    me
  }) {
    this.pattern = pattern;
    this.useRealName = useRealName;
    this.me = me;
  }

  set me(m) {
    this._me = m;
  }

  get me() {
    return typeof this._me === 'function' ? this._me() : this._me;
  }

  set pattern(p) {
    this._pattern = p;
  }

  get pattern() {
    return typeof this._pattern === 'function' ? this._pattern() : this._pattern;
  }

  set useRealName(s) {
    this._useRealName = s;
  }

  get useRealName() {
    return typeof this._useRealName === 'function' ? this._useRealName() : this._useRealName;
  }

  get userMentionRegex() {
    return new RegExp(`(^|\\s)@(${this.pattern})`, 'gm');
  }

  get channelMentionRegex() {
    return new RegExp(`(^|\\s)#(${this.pattern})`, 'gm');
  }

  replaceUsers(str, message, me) {
    return str.replace(this.userMentionRegex, (match, prefix, username) => {
      if (['all', 'here'].includes(username)) {
        return `${prefix}<a class="mention-link mention-link-me mention-link-all">@${username}</a>`;
      }

      const mentionObj = message.mentions && message.mentions.find(m => m.username === username);

      if (message.temp == null && mentionObj == null) {
        return match;
      }

      const name = this.useRealName && mentionObj && s.escapeHTML(mentionObj.name);
      return `${prefix}<a class="mention-link ${username === me ? 'mention-link-me' : ''}" data-username="${username}" title="${name ? username : ''}">${name || `@${username}`}</a>`;
    });
  }

  replaceChannels(str, message) {
    //since apostrophe escaped contains # we need to unescape it
    return str.replace(/&#39;/g, '\'').replace(this.channelMentionRegex, (match, prefix, name) => {
      if (!message.temp && message.channels && !message.channels.find(c => c.name === name)) {
        return match;
      }

      return `${prefix}<a class="mention-link" data-channel="${name}">${`#${name}`}</a>`;
    });
  }

  getUserMentions(str) {
    return (str.match(this.userMentionRegex) || []).map(match => match.trim());
  }

  getChannelMentions(str) {
    return (str.match(this.channelMentionRegex) || []).map(match => match.trim());
  }

  parse(message) {
    let msg = message && message.html || '';

    if (!msg.trim()) {
      return message;
    }

    msg = this.replaceUsers(msg, message, this.me);
    msg = this.replaceChannels(msg, message, this.me);
    message.html = msg;
    return message;
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:mentions/server/server.js");
require("/node_modules/meteor/rocketchat:mentions/server/methods/getUserMentionsByChannel.js");

/* Exports */
Package._define("rocketchat:mentions");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_mentions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZW50aW9ucy9zZXJ2ZXIvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1lbnRpb25zL3NlcnZlci9tZXRob2RzL2dldFVzZXJNZW50aW9uc0J5Q2hhbm5lbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZW50aW9ucy9zZXJ2ZXIvTWVudGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVudGlvbnMvTWVudGlvbnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiTWVudGlvbnNTZXJ2ZXIiLCJtZW50aW9uIiwicGF0dGVybiIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsIm1lc3NhZ2VNYXhBbGwiLCJnZXRVc2VycyIsInVzZXJuYW1lcyIsIk1ldGVvciIsInVzZXJzIiwiZmluZCIsInVzZXJuYW1lIiwiJGluIiwidW5pcXVlIiwiZmllbGRzIiwiX2lkIiwibmFtZSIsImZldGNoIiwiZ2V0VXNlciIsInVzZXJJZCIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJnZXRUb3RhbENoYW5uZWxNZW1iZXJzIiwicmlkIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRCeVJvb21JZCIsImNvdW50IiwiZ2V0Q2hhbm5lbHMiLCJjaGFubmVscyIsIlJvb21zIiwidCIsIm9uTWF4Um9vbU1lbWJlcnNFeGNlZWRlZCIsInNlbmRlciIsImxhbmd1YWdlIiwibXNnIiwiVEFQaTE4biIsIl9fIiwidG90YWwiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5VXNlciIsIlJhbmRvbSIsImlkIiwidHMiLCJEYXRlIiwiZ3JvdXBhYmxlIiwiRXJyb3IiLCJtZXRob2QiLCJhY3Rpb24iLCJjYWxsYmFja3MiLCJhZGQiLCJtZXNzYWdlIiwiZXhlY3V0ZSIsInByaW9yaXR5IiwiSElHSCIsIm1ldGhvZHMiLCJnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwiLCJyb29tSWQiLCJvcHRpb25zIiwiY2hlY2siLCJTdHJpbmciLCJyb29tIiwidXNlciIsIk1lc3NhZ2VzIiwiZmluZFZpc2libGVCeU1lbnRpb25BbmRSb29tSWQiLCJleHBvcnQiLCJNZW50aW9ucyIsImNvbnN0cnVjdG9yIiwiYXJncyIsImdldENoYW5uZWwiLCJtIiwiX2dldFVzZXJzIiwiX2dldENoYW5uZWxzIiwiX2dldENoYW5uZWwiLCJfbWVzc2FnZU1heEFsbCIsImdldFVzZXJzQnlNZW50aW9ucyIsInUiLCJtZW50aW9ucyIsImdldFVzZXJNZW50aW9ucyIsIm1lbnRpb25zQWxsIiwidXNlck1lbnRpb25zIiwiZm9yRWFjaCIsInRyaW0iLCJzdWJzdHIiLCJwdXNoIiwibGVuZ3RoIiwiZ2V0Q2hhbm5lbGJ5TWVudGlvbnMiLCJnZXRDaGFubmVsTWVudGlvbnMiLCJtYXAiLCJjIiwicyIsImV4cG9ydERlZmF1bHQiLCJ1c2VSZWFsTmFtZSIsIm1lIiwiX21lIiwicCIsIl9wYXR0ZXJuIiwiX3VzZVJlYWxOYW1lIiwidXNlck1lbnRpb25SZWdleCIsIlJlZ0V4cCIsImNoYW5uZWxNZW50aW9uUmVnZXgiLCJyZXBsYWNlVXNlcnMiLCJzdHIiLCJyZXBsYWNlIiwibWF0Y2giLCJwcmVmaXgiLCJpbmNsdWRlcyIsIm1lbnRpb25PYmoiLCJ0ZW1wIiwiZXNjYXBlSFRNTCIsInJlcGxhY2VDaGFubmVscyIsInBhcnNlIiwiaHRtbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsY0FBSjtBQUFtQkwsT0FBT0Ms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SSxDQUFDN0UsSUFBSStDLElBQUosRUFBTCxFQUFpQjtBQUNoQixhQUFPL0IsT0FBUDtBQUNBOztBQUNEaEIsVUFBTSxLQUFLa0UsWUFBTCxDQUFrQmxFLEdBQWxCLEVBQXVCZ0IsT0FBdkIsRUFBZ0MsS0FBSzBDLEVBQXJDLENBQU47QUFDQTFELFVBQU0sS0FBSzJFLGVBQUwsQ0FBcUIzRSxHQUFyQixFQUEwQmdCLE9BQTFCLEVBQW1DLEtBQUswQyxFQUF4QyxDQUFOO0FBQ0ExQyxZQUFRNkQsSUFBUixHQUFlN0UsR0FBZjtBQUNBLFdBQU9nQixPQUFQO0FBQ0E7O0FBdEVtQixDQUxyQixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21lbnRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgTWVudGlvbnNTZXJ2ZXIgZnJvbSAnLi9NZW50aW9ucyc7XG5cbmNvbnN0IG1lbnRpb24gPSBuZXcgTWVudGlvbnNTZXJ2ZXIoe1xuXHRwYXR0ZXJuOiAoKSA9PiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVVRGOF9OYW1lc19WYWxpZGF0aW9uJyksXG5cdG1lc3NhZ2VNYXhBbGw6ICgpID0+IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX01heEFsbCcpLFxuXHRnZXRVc2VyczogKHVzZXJuYW1lcykgPT4gTWV0ZW9yLnVzZXJzLmZpbmQoeyB1c2VybmFtZTogeyRpbjogXy51bmlxdWUodXNlcm5hbWVzKX19LCB7IGZpZWxkczoge19pZDogdHJ1ZSwgdXNlcm5hbWU6IHRydWUsIG5hbWU6IDEgfX0pLmZldGNoKCksXG5cdGdldFVzZXI6ICh1c2VySWQpID0+IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCksXG5cdGdldFRvdGFsQ2hhbm5lbE1lbWJlcnM6IChyaWQpID0+IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkKHJpZCkuY291bnQoKSxcblx0Z2V0Q2hhbm5lbHM6IChjaGFubmVscykgPT4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZCh7IG5hbWU6IHskaW46IF8udW5pcXVlKGNoYW5uZWxzKX0sIHQ6ICdjJ1x0fSwgeyBmaWVsZHM6IHtfaWQ6IDEsIG5hbWU6IDEgfX0pLmZldGNoKCksXG5cdG9uTWF4Um9vbU1lbWJlcnNFeGNlZWRlZCh7IHNlbmRlciwgcmlkIH0pIHtcblx0XHQvLyBHZXQgdGhlIGxhbmd1YWdlIG9mIHRoZSB1c2VyIGZvciB0aGUgZXJyb3Igbm90aWZpY2F0aW9uLlxuXHRcdGNvbnN0IGxhbmd1YWdlID0gdGhpcy5nZXRVc2VyKHNlbmRlci5faWQpLmxhbmd1YWdlO1xuXHRcdGNvbnN0IG1zZyA9IFRBUGkxOG4uX18oJ0dyb3VwX21lbnRpb25zX2Rpc2FibGVkX3hfbWVtYmVycycsIHsgdG90YWw6IHRoaXMubWVzc2FnZU1heEFsbCB9LCBsYW5ndWFnZSk7XG5cblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihzZW5kZXIuX2lkLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2csXG5cdFx0XHRncm91cGFibGU6IGZhbHNlXG5cdFx0fSk7XG5cblx0XHQvLyBBbHNvIHRocm93IHRvIHN0b3AgcHJvcGFnYXRpb24gb2YgJ3NlbmRNZXNzYWdlJy5cblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCBtc2csIHtcblx0XHRcdG1ldGhvZDogJ2ZpbHRlckFUQWxsVGFnJyxcblx0XHRcdGFjdGlvbjogbXNnXG5cdFx0fSk7XG5cdH1cbn0pO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdiZWZvcmVTYXZlTWVzc2FnZScsIChtZXNzYWdlKSA9PiBtZW50aW9uLmV4ZWN1dGUobWVzc2FnZSksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkhJR0gsICdtZW50aW9ucycpO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwoeyByb29tSWQsIG9wdGlvbnMgfSkge1xuXHRcdGNoZWNrKHJvb21JZCwgU3RyaW5nKTtcblxuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBtZXRob2Q6ICdnZXRVc2VyTWVudGlvbnNCeUNoYW5uZWwnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChNZXRlb3IudXNlcklkKCkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRWaXNpYmxlQnlNZW50aW9uQW5kUm9vbUlkKHVzZXIudXNlcm5hbWUsIHJvb21JZCwgb3B0aW9ucykuZmV0Y2goKTtcblx0fVxufSk7XG4iLCIvKlxuKiBNZW50aW9ucyBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIE1lbnRpb25zXG4qIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4qL1xuaW1wb3J0IE1lbnRpb25zIGZyb20gJy4uL01lbnRpb25zJztcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1lbnRpb25zU2VydmVyIGV4dGVuZHMgTWVudGlvbnMge1xuXHRjb25zdHJ1Y3RvcihhcmdzKSB7XG5cdFx0c3VwZXIoYXJncyk7XG5cdFx0dGhpcy5tZXNzYWdlTWF4QWxsID0gYXJncy5tZXNzYWdlTWF4QWxsO1xuXHRcdHRoaXMuZ2V0Q2hhbm5lbCA9IGFyZ3MuZ2V0Q2hhbm5lbDtcblx0XHR0aGlzLmdldENoYW5uZWxzID0gYXJncy5nZXRDaGFubmVscztcblx0XHR0aGlzLmdldFVzZXJzID0gYXJncy5nZXRVc2Vycztcblx0XHR0aGlzLmdldFVzZXIgPSBhcmdzLmdldFVzZXI7XG5cdFx0dGhpcy5nZXRUb3RhbENoYW5uZWxNZW1iZXJzID0gYXJncy5nZXRUb3RhbENoYW5uZWxNZW1iZXJzO1xuXHRcdHRoaXMub25NYXhSb29tTWVtYmVyc0V4Y2VlZGVkID0gYXJncy5vbk1heFJvb21NZW1iZXJzRXhjZWVkZWQgfHwgKCgpID0+IHt9KTtcblx0fVxuXHRzZXQgZ2V0VXNlcnMobSkge1xuXHRcdHRoaXMuX2dldFVzZXJzID0gbTtcblx0fVxuXHRnZXQgZ2V0VXNlcnMoKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl9nZXRVc2VycyA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMuX2dldFVzZXJzIDogKCkgPT4gdGhpcy5fZ2V0VXNlcnM7XG5cdH1cblx0c2V0IGdldENoYW5uZWxzKG0pIHtcblx0XHR0aGlzLl9nZXRDaGFubmVscyA9IG07XG5cdH1cblx0Z2V0IGdldENoYW5uZWxzKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fZ2V0Q2hhbm5lbHMgPT09ICdmdW5jdGlvbicgPyB0aGlzLl9nZXRDaGFubmVscyA6ICgpID0+IHRoaXMuX2dldENoYW5uZWxzO1xuXHR9XG5cdHNldCBnZXRDaGFubmVsKG0pIHtcblx0XHR0aGlzLl9nZXRDaGFubmVsID0gbTtcblx0fVxuXHRnZXQgZ2V0Q2hhbm5lbCgpIHtcblx0XHRyZXR1cm4gdHlwZW9mIHRoaXMuX2dldENoYW5uZWwgPT09ICdmdW5jdGlvbicgPyB0aGlzLl9nZXRDaGFubmVsIDogKCkgPT4gdGhpcy5fZ2V0Q2hhbm5lbDtcblx0fVxuXHRzZXQgbWVzc2FnZU1heEFsbChtKSB7XG5cdFx0dGhpcy5fbWVzc2FnZU1heEFsbCA9IG07XG5cdH1cblx0Z2V0IG1lc3NhZ2VNYXhBbGwoKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl9tZXNzYWdlTWF4QWxsID09PSAnZnVuY3Rpb24nID8gdGhpcy5fbWVzc2FnZU1heEFsbCgpIDogdGhpcy5fbWVzc2FnZU1heEFsbDtcblx0fVxuXHRnZXRVc2Vyc0J5TWVudGlvbnMoe21zZywgcmlkLCB1OiBzZW5kZXJ9KSB7XG5cdFx0bGV0IG1lbnRpb25zID0gdGhpcy5nZXRVc2VyTWVudGlvbnMobXNnKTtcblx0XHRjb25zdCBtZW50aW9uc0FsbCA9IFtdO1xuXHRcdGNvbnN0IHVzZXJNZW50aW9ucyA9IFtdO1xuXG5cdFx0bWVudGlvbnMuZm9yRWFjaCgobSkgPT4ge1xuXHRcdFx0Y29uc3QgbWVudGlvbiA9IG0udHJpbSgpLnN1YnN0cigxKTtcblx0XHRcdGlmIChtZW50aW9uICE9PSAnYWxsJyAmJiBtZW50aW9uICE9PSAnaGVyZScpIHtcblx0XHRcdFx0cmV0dXJuIHVzZXJNZW50aW9ucy5wdXNoKG1lbnRpb24pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMubWVzc2FnZU1heEFsbCA+IDAgJiYgdGhpcy5nZXRUb3RhbENoYW5uZWxNZW1iZXJzKHJpZCkgPiB0aGlzLm1lc3NhZ2VNYXhBbGwpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMub25NYXhSb29tTWVtYmVyc0V4Y2VlZGVkKHsgc2VuZGVyLCByaWQgfSk7XG5cdFx0XHR9XG5cdFx0XHRtZW50aW9uc0FsbC5wdXNoKHtcblx0XHRcdFx0X2lkOiBtZW50aW9uLFxuXHRcdFx0XHR1c2VybmFtZTogbWVudGlvblxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0bWVudGlvbnMgPSB1c2VyTWVudGlvbnMubGVuZ3RoID8gdGhpcy5nZXRVc2Vycyh1c2VyTWVudGlvbnMpIDogW107XG5cdFx0cmV0dXJuIFsuLi5tZW50aW9uc0FsbCwgLi4ubWVudGlvbnNdO1xuXHR9XG5cdGdldENoYW5uZWxieU1lbnRpb25zKHttc2d9KSB7XG5cdFx0Y29uc3QgY2hhbm5lbHMgPSB0aGlzLmdldENoYW5uZWxNZW50aW9ucyhtc2cpO1xuXHRcdHJldHVybiB0aGlzLmdldENoYW5uZWxzKGNoYW5uZWxzLm1hcChjID0+IGMudHJpbSgpLnN1YnN0cigxKSkpO1xuXHR9XG5cdGV4ZWN1dGUobWVzc2FnZSkge1xuXHRcdGNvbnN0IG1lbnRpb25zQWxsID0gdGhpcy5nZXRVc2Vyc0J5TWVudGlvbnMobWVzc2FnZSk7XG5cdFx0Y29uc3QgY2hhbm5lbHMgPSB0aGlzLmdldENoYW5uZWxieU1lbnRpb25zKG1lc3NhZ2UpO1xuXG5cdFx0bWVzc2FnZS5tZW50aW9ucyA9IG1lbnRpb25zQWxsO1xuXHRcdG1lc3NhZ2UuY2hhbm5lbHMgPSBjaGFubmVscztcblxuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG59XG4iLCIvKlxuKiBNZW50aW9ucyBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIE1lbnRpb25zXG4qIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4qL1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXHRjb25zdHJ1Y3Rvcih7cGF0dGVybiwgdXNlUmVhbE5hbWUsIG1lfSkge1xuXHRcdHRoaXMucGF0dGVybiA9IHBhdHRlcm47XG5cdFx0dGhpcy51c2VSZWFsTmFtZSA9IHVzZVJlYWxOYW1lO1xuXHRcdHRoaXMubWUgPSBtZTtcblx0fVxuXHRzZXQgbWUobSkge1xuXHRcdHRoaXMuX21lID0gbTtcblx0fVxuXHRnZXQgbWUoKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl9tZSA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMuX21lKCkgOiB0aGlzLl9tZTtcblx0fVxuXHRzZXQgcGF0dGVybihwKSB7XG5cdFx0dGhpcy5fcGF0dGVybiA9IHA7XG5cdH1cblx0Z2V0IHBhdHRlcm4oKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl9wYXR0ZXJuID09PSAnZnVuY3Rpb24nID8gdGhpcy5fcGF0dGVybigpIDogdGhpcy5fcGF0dGVybjtcblx0fVxuXHRzZXQgdXNlUmVhbE5hbWUocykge1xuXHRcdHRoaXMuX3VzZVJlYWxOYW1lID0gcztcblx0fVxuXHRnZXQgdXNlUmVhbE5hbWUoKSB7XG5cdFx0cmV0dXJuIHR5cGVvZiB0aGlzLl91c2VSZWFsTmFtZSA9PT0gJ2Z1bmN0aW9uJyA/IHRoaXMuX3VzZVJlYWxOYW1lKCkgOiB0aGlzLl91c2VSZWFsTmFtZTtcblx0fVxuXHRnZXQgdXNlck1lbnRpb25SZWdleCgpIHtcblx0XHRyZXR1cm4gbmV3IFJlZ0V4cChgKF58XFxcXHMpQCgkeyB0aGlzLnBhdHRlcm4gfSlgLCAnZ20nKTtcblx0fVxuXHRnZXQgY2hhbm5lbE1lbnRpb25SZWdleCgpIHtcblx0XHRyZXR1cm4gbmV3IFJlZ0V4cChgKF58XFxcXHMpIygkeyB0aGlzLnBhdHRlcm4gfSlgLCAnZ20nKTtcblx0fVxuXHRyZXBsYWNlVXNlcnMoc3RyLCBtZXNzYWdlLCBtZSkge1xuXHRcdHJldHVybiBzdHIucmVwbGFjZSh0aGlzLnVzZXJNZW50aW9uUmVnZXgsIChtYXRjaCwgcHJlZml4LCB1c2VybmFtZSkgPT4ge1xuXHRcdFx0aWYgKFsnYWxsJywgJ2hlcmUnXS5pbmNsdWRlcyh1c2VybmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuIGAkeyBwcmVmaXggfTxhIGNsYXNzPVwibWVudGlvbi1saW5rIG1lbnRpb24tbGluay1tZSBtZW50aW9uLWxpbmstYWxsXCI+QCR7IHVzZXJuYW1lIH08L2E+YDtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbWVudGlvbk9iaiA9IG1lc3NhZ2UubWVudGlvbnMgJiYgbWVzc2FnZS5tZW50aW9ucy5maW5kKG0gPT4gbS51c2VybmFtZSA9PT0gdXNlcm5hbWUpO1xuXHRcdFx0aWYgKG1lc3NhZ2UudGVtcCA9PSBudWxsICYmIG1lbnRpb25PYmogPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBuYW1lID0gdGhpcy51c2VSZWFsTmFtZSAmJiBtZW50aW9uT2JqICYmIHMuZXNjYXBlSFRNTChtZW50aW9uT2JqLm5hbWUpO1xuXG5cdFx0XHRyZXR1cm4gYCR7IHByZWZpeCB9PGEgY2xhc3M9XCJtZW50aW9uLWxpbmsgJHsgdXNlcm5hbWUgPT09IG1lID8gJ21lbnRpb24tbGluay1tZScgOiAnJyB9XCIgZGF0YS11c2VybmFtZT1cIiR7IHVzZXJuYW1lIH1cIiB0aXRsZT1cIiR7IG5hbWUgPyB1c2VybmFtZSA6ICcnIH1cIj4keyBuYW1lIHx8IGBAJHsgdXNlcm5hbWUgfWAgfTwvYT5gO1xuXHRcdH0pO1xuXHR9XG5cdHJlcGxhY2VDaGFubmVscyhzdHIsIG1lc3NhZ2UpIHtcblx0XHQvL3NpbmNlIGFwb3N0cm9waGUgZXNjYXBlZCBjb250YWlucyAjIHdlIG5lZWQgdG8gdW5lc2NhcGUgaXRcblx0XHRyZXR1cm4gc3RyLnJlcGxhY2UoLyYjMzk7L2csICdcXCcnKS5yZXBsYWNlKHRoaXMuY2hhbm5lbE1lbnRpb25SZWdleCwgKG1hdGNoLCBwcmVmaXgsIG5hbWUpID0+IHtcblx0XHRcdGlmICghbWVzc2FnZS50ZW1wICYmIChtZXNzYWdlLmNoYW5uZWxzICYmICFtZXNzYWdlLmNoYW5uZWxzLmZpbmQoYyA9PiBjLm5hbWUgPT09IG5hbWUpKSkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2g7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBgJHsgcHJlZml4IH08YSBjbGFzcz1cIm1lbnRpb24tbGlua1wiIGRhdGEtY2hhbm5lbD1cIiR7IG5hbWUgfVwiPiR7IGAjJHsgbmFtZSB9YCB9PC9hPmA7XG5cdFx0fSk7XG5cdH1cblx0Z2V0VXNlck1lbnRpb25zKHN0cikge1xuXHRcdHJldHVybiAoc3RyLm1hdGNoKHRoaXMudXNlck1lbnRpb25SZWdleCkgfHwgW10pLm1hcChtYXRjaCA9PiBtYXRjaC50cmltKCkpO1xuXHR9XG5cdGdldENoYW5uZWxNZW50aW9ucyhzdHIpIHtcblx0XHRyZXR1cm4gKHN0ci5tYXRjaCh0aGlzLmNoYW5uZWxNZW50aW9uUmVnZXgpIHx8IFtdKS5tYXAobWF0Y2ggPT4gbWF0Y2gudHJpbSgpKTtcblx0fVxuXHRwYXJzZShtZXNzYWdlKSB7XG5cdFx0bGV0IG1zZyA9IChtZXNzYWdlICYmIG1lc3NhZ2UuaHRtbCkgfHwgJyc7XG5cdFx0aWYgKCFtc2cudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9XG5cdFx0bXNnID0gdGhpcy5yZXBsYWNlVXNlcnMobXNnLCBtZXNzYWdlLCB0aGlzLm1lKTtcblx0XHRtc2cgPSB0aGlzLnJlcGxhY2VDaGFubmVscyhtc2csIG1lc3NhZ2UsIHRoaXMubWUpO1xuXHRcdG1lc3NhZ2UuaHRtbCA9IG1zZztcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxufVxuIl19
