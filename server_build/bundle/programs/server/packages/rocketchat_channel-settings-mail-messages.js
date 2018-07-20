(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:channel-settings-mail-messages":{"server":{"lib":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_channel-settings-mail-messages/server/lib/startup.js                        //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.startup(function () {
  const permission = {
    _id: 'mail-messages',
    roles: ['admin']
  };
  return RocketChat.models.Permissions.upsert(permission._id, {
    $setOnInsert: permission
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"mailMessages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_channel-settings-mail-messages/server/methods/mailMessages.js               //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 1);
Meteor.methods({
  'mailMessages'(data) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'mailMessages'
      });
    }

    check(data, Match.ObjectIncluding({
      rid: String,
      to_users: [String],
      to_emails: String,
      subject: String,
      messages: [String],
      language: String
    }));
    const room = Meteor.call('canAccessRoom', data.rid, Meteor.userId());

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'mailMessages'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'mail-messages')) {
      throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed', {
        method: 'mailMessages',
        action: 'Mailing'
      });
    }

    const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

    const emails = _.compact(data.to_emails.trim().split(','));

    const missing = [];

    if (data.to_users.length > 0) {
      _.each(data.to_users, username => {
        const user = RocketChat.models.Users.findOneByUsername(username);

        if (user && user.emails && user.emails[0] && user.emails[0].address) {
          emails.push(user.emails[0].address);
        } else {
          missing.push(username);
        }
      });
    }

    console.log('Sending messages to e-mails: ', emails);

    _.each(emails, email => {
      if (!rfcMailPatternWithName.test(email.trim())) {
        throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
          method: 'mailMessages',
          email
        });
      }
    });

    const user = Meteor.user();
    const email = user.emails && user.emails[0] && user.emails[0].address;
    data.language = data.language.split('-').shift().toLowerCase();

    if (data.language !== 'en') {
      const localeFn = Meteor.call('loadLocale', data.language);

      if (localeFn) {
        Function(localeFn).call({
          moment
        });
        moment.locale(data.language);
      }
    }

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const html = RocketChat.models.Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
      sort: {
        ts: 1
      }
    }).map(function (message) {
      const dateTime = moment(message.ts).locale(data.language).format('L LT');
      return `<p style='margin-bottom: 5px'><b>${message.u.username}</b> <span style='color: #aaa; font-size: 12px'>${dateTime}</span><br/>${RocketChat.Message.parse(message, data.language)}</p>`;
    }).join('');
    Meteor.defer(function () {
      Email.send({
        to: emails,
        from: RocketChat.settings.get('From_Email'),
        replyTo: email,
        subject: data.subject,
        html: header + html + footer
      });
      return console.log(`Sending email to ${emails.join(', ')}`);
    });
    return {
      success: true,
      missing
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:channel-settings-mail-messages/server/lib/startup.js");
require("/node_modules/meteor/rocketchat:channel-settings-mail-messages/server/methods/mailMessages.js");

/* Exports */
Package._define("rocketchat:channel-settings-mail-messages");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_channel-settings-mail-messages.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzLW1haWwtbWVzc2FnZXMvc2VydmVyL2xpYi9zdGFydHVwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3MtbWFpbC1tZXNzYWdlcy9zZXJ2ZXIvbWV0aG9kcy9tYWlsTWVzc2FnZXMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsInBlcm1pc3Npb24iLCJfaWQiLCJyb2xlcyIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJQZXJtaXNzaW9ucyIsInVwc2VydCIsIiRzZXRPbkluc2VydCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIm1vbWVudCIsIm1ldGhvZHMiLCJkYXRhIiwidXNlcklkIiwiRXJyb3IiLCJtZXRob2QiLCJjaGVjayIsIk1hdGNoIiwiT2JqZWN0SW5jbHVkaW5nIiwicmlkIiwiU3RyaW5nIiwidG9fdXNlcnMiLCJ0b19lbWFpbHMiLCJzdWJqZWN0IiwibWVzc2FnZXMiLCJsYW5ndWFnZSIsInJvb20iLCJjYWxsIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiYWN0aW9uIiwicmZjTWFpbFBhdHRlcm5XaXRoTmFtZSIsImVtYWlscyIsImNvbXBhY3QiLCJ0cmltIiwic3BsaXQiLCJtaXNzaW5nIiwibGVuZ3RoIiwiZWFjaCIsInVzZXJuYW1lIiwidXNlciIsIlVzZXJzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJhZGRyZXNzIiwicHVzaCIsImNvbnNvbGUiLCJsb2ciLCJlbWFpbCIsInRlc3QiLCJzaGlmdCIsInRvTG93ZXJDYXNlIiwibG9jYWxlRm4iLCJGdW5jdGlvbiIsImxvY2FsZSIsImhlYWRlciIsInBsYWNlaG9sZGVycyIsInJlcGxhY2UiLCJzZXR0aW5ncyIsImdldCIsImZvb3RlciIsImh0bWwiLCJNZXNzYWdlcyIsImZpbmRCeVJvb21JZEFuZE1lc3NhZ2VJZHMiLCJzb3J0IiwidHMiLCJtYXAiLCJtZXNzYWdlIiwiZGF0ZVRpbWUiLCJmb3JtYXQiLCJ1IiwiTWVzc2FnZSIsInBhcnNlIiwiam9pbiIsImRlZmVyIiwiRW1haWwiLCJzZW5kIiwidG8iLCJmcm9tIiwicmVwbHlUbyIsInN1Y2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekIsUUFBTUMsYUFBYTtBQUNsQkMsU0FBSyxlQURhO0FBRWxCQyxXQUFPLENBQUMsT0FBRDtBQUZXLEdBQW5CO0FBSUEsU0FBT0MsV0FBV0MsTUFBWCxDQUFrQkMsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDTixXQUFXQyxHQUFoRCxFQUFxRDtBQUMzRE0sa0JBQWNQO0FBRDZDLEdBQXJELENBQVA7QUFHQSxDQVJELEU7Ozs7Ozs7Ozs7O0FDQUEsSUFBSVEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxNQUFKO0FBQVdMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLGFBQU9ELENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFHekVmLE9BQU9pQixPQUFQLENBQWU7QUFDZCxpQkFBZUMsSUFBZixFQUFxQjtBQUNwQixRQUFJLENBQUNsQixPQUFPbUIsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSW5CLE9BQU9vQixLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1REMsZ0JBQVE7QUFEb0QsT0FBdkQsQ0FBTjtBQUdBOztBQUNEQyxVQUFNSixJQUFOLEVBQVlLLE1BQU1DLGVBQU4sQ0FBc0I7QUFDakND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QUtXLE9BSko7QUFLVnFDLGNBQU1OLFNBQVNNLElBQVQsR0FBZ0JEO0FBTFosT0FBWDtBQU9BLGFBQU9kLFFBQVFDLEdBQVIsQ0FBYSxvQkFBb0JkLE9BQU93QyxJQUFQLENBQVksSUFBWixDQUFtQixFQUFwRCxDQUFQO0FBQ0EsS0FURDtBQVVBLFdBQU87QUFDTk8sZUFBUyxJQURIO0FBRU4zQztBQUZNLEtBQVA7QUFJQTs7QUFuRmEsQ0FBZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2NoYW5uZWwtc2V0dGluZ3MtbWFpbC1tZXNzYWdlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRjb25zdCBwZXJtaXNzaW9uID0ge1xuXHRcdF9pZDogJ21haWwtbWVzc2FnZXMnLFxuXHRcdHJvbGVzOiBbJ2FkbWluJ11cblx0fTtcblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLnVwc2VydChwZXJtaXNzaW9uLl9pZCwge1xuXHRcdCRzZXRPbkluc2VydDogcGVybWlzc2lvblxuXHR9KTtcbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J21haWxNZXNzYWdlcycoZGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRtZXRob2Q6ICdtYWlsTWVzc2FnZXMnXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y2hlY2soZGF0YSwgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdHJpZDogU3RyaW5nLFxuXHRcdFx0dG9fdXNlcnM6IFtTdHJpbmddLFxuXHRcdFx0dG9fZW1haWxzOiBTdHJpbmcsXG5cdFx0XHRzdWJqZWN0OiBTdHJpbmcsXG5cdFx0XHRtZXNzYWdlczogW1N0cmluZ10sXG5cdFx0XHRsYW5ndWFnZTogU3RyaW5nXG5cdFx0fSkpO1xuXHRcdGNvbnN0IHJvb20gPSBNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIGRhdGEucmlkLCBNZXRlb3IudXNlcklkKCkpO1xuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnbWFpbE1lc3NhZ2VzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ21haWwtbWVzc2FnZXMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ01haWxpbmcgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ21haWxNZXNzYWdlcycsXG5cdFx0XHRcdGFjdGlvbjogJ01haWxpbmcnXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y29uc3QgcmZjTWFpbFBhdHRlcm5XaXRoTmFtZSA9IC9eKD86Lio8KT8oW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKikoPzo+PykkLztcblx0XHRjb25zdCBlbWFpbHMgPSBfLmNvbXBhY3QoZGF0YS50b19lbWFpbHMudHJpbSgpLnNwbGl0KCcsJykpO1xuXHRcdGNvbnN0IG1pc3NpbmcgPSBbXTtcblx0XHRpZiAoZGF0YS50b191c2Vycy5sZW5ndGggPiAwKSB7XG5cdFx0XHRfLmVhY2goZGF0YS50b191c2VycywgKHVzZXJuYW1lKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSk7XG5cdFx0XHRcdGlmICh1c2VyICYmIHVzZXIuZW1haWxzICYmIHVzZXIuZW1haWxzWzBdICYmIHVzZXIuZW1haWxzWzBdLmFkZHJlc3MpIHtcblx0XHRcdFx0XHRlbWFpbHMucHVzaCh1c2VyLmVtYWlsc1swXS5hZGRyZXNzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRtaXNzaW5nLnB1c2godXNlcm5hbWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y29uc29sZS5sb2coJ1NlbmRpbmcgbWVzc2FnZXMgdG8gZS1tYWlsczogJywgZW1haWxzKTtcblx0XHRfLmVhY2goZW1haWxzLCAoZW1haWwpID0+IHtcblx0XHRcdGlmICghcmZjTWFpbFBhdHRlcm5XaXRoTmFtZS50ZXN0KGVtYWlsLnRyaW0oKSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1lbWFpbCcsIGBJbnZhbGlkIGVtYWlsICR7IGVtYWlsIH1gLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnbWFpbE1lc3NhZ2VzJyxcblx0XHRcdFx0XHRlbWFpbFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblx0XHRjb25zdCBlbWFpbCA9IHVzZXIuZW1haWxzICYmIHVzZXIuZW1haWxzWzBdICYmIHVzZXIuZW1haWxzWzBdLmFkZHJlc3M7XG5cdFx0ZGF0YS5sYW5ndWFnZSA9IGRhdGEubGFuZ3VhZ2Uuc3BsaXQoJy0nKS5zaGlmdCgpLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKGRhdGEubGFuZ3VhZ2UgIT09ICdlbicpIHtcblx0XHRcdGNvbnN0IGxvY2FsZUZuID0gTWV0ZW9yLmNhbGwoJ2xvYWRMb2NhbGUnLCBkYXRhLmxhbmd1YWdlKTtcblx0XHRcdGlmIChsb2NhbGVGbikge1xuXHRcdFx0XHRGdW5jdGlvbihsb2NhbGVGbikuY2FsbCh7bW9tZW50fSk7XG5cdFx0XHRcdG1vbWVudC5sb2NhbGUoZGF0YS5sYW5ndWFnZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGVhZGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfSGVhZGVyJykgfHwgJycpO1xuXHRcdGNvbnN0IGZvb3RlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0Zvb3RlcicpIHx8ICcnKTtcblx0XHRjb25zdCBodG1sID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZEJ5Um9vbUlkQW5kTWVzc2FnZUlkcyhkYXRhLnJpZCwgZGF0YS5tZXNzYWdlcywge1xuXHRcdFx0c29ydDoge1x0dHM6IDEgfVxuXHRcdH0pLm1hcChmdW5jdGlvbihtZXNzYWdlKSB7XG5cdFx0XHRjb25zdCBkYXRlVGltZSA9IG1vbWVudChtZXNzYWdlLnRzKS5sb2NhbGUoZGF0YS5sYW5ndWFnZSkuZm9ybWF0KCdMIExUJyk7XG5cdFx0XHRyZXR1cm4gYDxwIHN0eWxlPSdtYXJnaW4tYm90dG9tOiA1cHgnPjxiPiR7IG1lc3NhZ2UudS51c2VybmFtZSB9PC9iPiA8c3BhbiBzdHlsZT0nY29sb3I6ICNhYWE7IGZvbnQtc2l6ZTogMTJweCc+JHsgZGF0ZVRpbWUgfTwvc3Bhbj48YnIvPiR7IFJvY2tldENoYXQuTWVzc2FnZS5wYXJzZShtZXNzYWdlLCBkYXRhLmxhbmd1YWdlKSB9PC9wPmA7XG5cdFx0fSkuam9pbignJyk7XG5cblx0XHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0XHRFbWFpbC5zZW5kKHtcblx0XHRcdFx0dG86IGVtYWlscyxcblx0XHRcdFx0ZnJvbTogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKSxcblx0XHRcdFx0cmVwbHlUbzogZW1haWwsXG5cdFx0XHRcdHN1YmplY3Q6IGRhdGEuc3ViamVjdCxcblx0XHRcdFx0aHRtbDogaGVhZGVyICsgaHRtbCArIGZvb3RlclxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coYFNlbmRpbmcgZW1haWwgdG8gJHsgZW1haWxzLmpvaW4oJywgJykgfWApO1xuXHRcdH0pO1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0bWlzc2luZ1xuXHRcdH07XG5cdH1cbn0pO1xuIl19
