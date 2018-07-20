(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var Mailer;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:mailer":{"lib":{"Mailer.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/lib/Mailer.js                                                                //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
Mailer = {}; //eslint-disable-line
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/server/startup.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
Meteor.startup(function () {
  return RocketChat.models.Permissions.upsert('access-mailer', {
    $setOnInsert: {
      _id: 'access-mailer',
      roles: ['admin']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"Users.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/server/models/Users.js                                                       //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
RocketChat.models.Users.rocketMailUnsubscribe = function (_id, createdAt) {
  const query = {
    _id,
    createdAt: new Date(parseInt(createdAt))
  };
  const update = {
    $set: {
      'mailer.unsubscribed': true
    }
  };
  const affectedRows = this.update(query, update);
  console.log('[Mailer:Unsubscribe]', _id, createdAt, new Date(parseInt(createdAt)), affectedRows);
  return affectedRows;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"sendMail.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/server/functions/sendMail.js                                                 //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/*globals Mailer */
Mailer.sendMail = function (from, subject, body, dryrun, query) {
  const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

  if (!rfcMailPatternWithName.test(from)) {
    throw new Meteor.Error('error-invalid-from-address', 'Invalid from address', {
      'function': 'Mailer.sendMail'
    });
  }

  if (body.indexOf('[unsubscribe]') === -1) {
    throw new Meteor.Error('error-missing-unsubscribe-link', 'You must provide the [unsubscribe] link.', {
      'function': 'Mailer.sendMail'
    });
  }

  const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
  const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
  let userQuery = {
    'mailer.unsubscribed': {
      $exists: 0
    }
  };

  if (query) {
    userQuery = {
      $and: [userQuery, EJSON.parse(query)]
    };
  }

  if (dryrun) {
    return Meteor.users.find({
      'emails.address': from
    }).forEach(user => {
      let email = undefined;

      if (user.emails && user.emails[0] && user.emails[0].address) {
        email = user.emails[0].address;
      }

      const html = RocketChat.placeholders.replace(body, {
        unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', {
          _id: user._id,
          createdAt: user.createdAt.getTime()
        })),
        name: user.name,
        email
      });
      email = `${user.name} <${email}>`;

      if (rfcMailPatternWithName.test(email)) {
        Meteor.defer(function () {
          return Email.send({
            to: email,
            from,
            subject,
            html: header + html + footer
          });
        });
        return console.log(`Sending email to ${email}`);
      }
    });
  } else {
    return Meteor.users.find(userQuery).forEach(function (user) {
      let email = undefined;

      if (user.emails && user.emails[0] && user.emails[0].address) {
        email = user.emails[0].address;
      }

      const html = RocketChat.placeholders.replace(body, {
        unsubscribe: Meteor.absoluteUrl(FlowRouter.path('mailer/unsubscribe/:_id/:createdAt', {
          _id: user._id,
          createdAt: user.createdAt.getTime()
        })),
        name: user.name,
        email
      });
      email = `${user.name} <${email}>`;

      if (rfcMailPatternWithName.test(email)) {
        Meteor.defer(function () {
          return Email.send({
            to: email,
            from,
            subject,
            html: header + html + footer
          });
        });
        return console.log(`Sending email to ${email}`);
      }
    });
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unsubscribe.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/server/functions/unsubscribe.js                                              //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/* globals Mailer */
Mailer.unsubscribe = function (_id, createdAt) {
  if (_id && createdAt) {
    return RocketChat.models.Users.rocketMailUnsubscribe(_id, createdAt) === 1;
  }

  return false;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"sendMail.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/server/methods/sendMail.js                                                   //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/*globals Mailer */
Meteor.methods({
  'Mailer.sendMail'(from, subject, body, dryrun, query) {
    const userId = Meteor.userId();

    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'Mailer.sendMail'
      });
    }

    if (RocketChat.authz.hasRole(userId, 'admin') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'Mailer.sendMail'
      });
    }

    return Mailer.sendMail(from, subject, body, dryrun, query);
  }

}); //Limit setting username once per minute
//DDPRateLimiter.addRule
//	type: 'method'
//	name: 'Mailer.sendMail'
//	connectionId: -> return true
//	, 1, 60000
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unsubscribe.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_mailer/server/methods/unsubscribe.js                                                //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/*globals Mailer */
Meteor.methods({
  'Mailer:unsubscribe'(_id, createdAt) {
    return Mailer.unsubscribe(_id, createdAt);
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'Mailer:unsubscribe',

  connectionId() {
    return true;
  }

}, 1, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:mailer/lib/Mailer.js");
require("/node_modules/meteor/rocketchat:mailer/server/startup.js");
require("/node_modules/meteor/rocketchat:mailer/server/models/Users.js");
require("/node_modules/meteor/rocketchat:mailer/server/functions/sendMail.js");
require("/node_modules/meteor/rocketchat:mailer/server/functions/unsubscribe.js");
require("/node_modules/meteor/rocketchat:mailer/server/methods/sendMail.js");
require("/node_modules/meteor/rocketchat:mailer/server/methods/unsubscribe.js");

/* Exports */
Package._define("rocketchat:mailer", {
  Mailer: Mailer
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_mailer.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYWlsZXIvbGliL01haWxlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYWlsZXIvc2VydmVyL3N0YXJ0dXAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFpbGVyL3NlcnZlci9tb2RlbHMvVXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFpbGVyL3NlcnZlci9mdW5jdGlvbnMvc2VuZE1haWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFpbGVyL3NlcnZlci9mdW5jdGlvbnMvdW5zdWJzY3JpYmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFpbGVyL3NlcnZlci9tZXRob2RzL3NlbmRNYWlsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1haWxlci9zZXJ2ZXIvbWV0aG9kcy91bnN1YnNjcmliZS5qcyJdLCJuYW1lcyI6WyJNYWlsZXIiLCJNZXRlb3IiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlBlcm1pc3Npb25zIiwidXBzZXJ0IiwiJHNldE9uSW5zZXJ0IiwiX2lkIiwicm9sZXMiLCJVc2VycyIsInJvY2tldE1haWxVbnN1YnNjcmliZSIsImNyZWF0ZWRBdCIsInF1ZXJ5IiwiRGF0ZSIsInBhcnNlSW50IiwidXBkYXRlIiwiJHNldCIsImFmZmVjdGVkUm93cyIsImNvbnNvbGUiLCJsb2ciLCJzZW5kTWFpbCIsImZyb20iLCJzdWJqZWN0IiwiYm9keSIsImRyeXJ1biIsInJmY01haWxQYXR0ZXJuV2l0aE5hbWUiLCJ0ZXN0IiwiRXJyb3IiLCJpbmRleE9mIiwiaGVhZGVyIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZSIsInNldHRpbmdzIiwiZ2V0IiwiZm9vdGVyIiwidXNlclF1ZXJ5IiwiJGV4aXN0cyIsIiRhbmQiLCJFSlNPTiIsInBhcnNlIiwidXNlcnMiLCJmaW5kIiwiZm9yRWFjaCIsInVzZXIiLCJlbWFpbCIsInVuZGVmaW5lZCIsImVtYWlscyIsImFkZHJlc3MiLCJodG1sIiwidW5zdWJzY3JpYmUiLCJhYnNvbHV0ZVVybCIsIkZsb3dSb3V0ZXIiLCJwYXRoIiwiZ2V0VGltZSIsIm5hbWUiLCJkZWZlciIsIkVtYWlsIiwic2VuZCIsInRvIiwibWV0aG9kcyIsInVzZXJJZCIsIm1ldGhvZCIsImF1dGh6IiwiaGFzUm9sZSIsIkREUFJhdGVMaW1pdGVyIiwiYWRkUnVsZSIsInR5cGUiLCJjb25uZWN0aW9uSWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxTQUFTLEVBQVQsQyxDQUFZLHFCOzs7Ozs7Ozs7OztBQ0FaQyxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QixTQUFPQyxXQUFXQyxNQUFYLENBQWtCQyxXQUFsQixDQUE4QkMsTUFBOUIsQ0FBcUMsZUFBckMsRUFBc0Q7QUFDNURDLGtCQUFjO0FBQ2JDLFdBQUssZUFEUTtBQUViQyxhQUFPLENBQUMsT0FBRDtBQUZNO0FBRDhDLEdBQXRELENBQVA7QUFNQSxDQVBELEU7Ozs7Ozs7Ozs7O0FDQUFOLFdBQVdDLE1BQVgsQ0FBa0JNLEtBQWxCLENBQXdCQyxxQkFBeEIsR0FBZ0QsVUFBU0gsR0FBVCxFQUFjSSxTQUFkLEVBQXlCO0FBQ3hFLFFBQU1DLFFBQVE7QUFDYkwsT0FEYTtBQUViSSxlQUFXLElBQUlFLElBQUosQ0FBU0MsU0FBU0gsU0FBVCxDQUFUO0FBRkUsR0FBZDtBQUlBLFFBQU1JLFNBQVM7QUFDZEMsVUFBTTtBQUNMLDZCQUF1QjtBQURsQjtBQURRLEdBQWY7QUFLQSxRQUFNQyxlQUFlLEtBQUtGLE1BQUwsQ0FBWUgsS0FBWixFQUFtQkcsTUFBbkIsQ0FBckI7QUFDQUcsVUFBUUMsR0FBUixDQUFZLHNCQUFaLEVBQW9DWixHQUFwQyxFQUF5Q0ksU0FB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cEMsV0FBT1osT0FBT2tELFdBQVAsQ0FBbUIxQyxHQUFuQixFQUF3QkksU0FBeEIsQ0FBUDtBQUNBOztBQUhhLENBQWY7QUFNQXFELGVBQWVDLE9BQWYsQ0FBdUI7QUFDdEJDLFFBQU0sUUFEZ0I7QUFFdEJaLFFBQU0sb0JBRmdCOztBQUd0QmEsaUJBQWU7QUFDZCxXQUFPLElBQVA7QUFDQTs7QUFMcUIsQ0FBdkIsRUFNRyxDQU5ILEVBTU0sS0FOTixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X21haWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1haWxlciA9IHt9Oy8vZXNsaW50LWRpc2FibGUtbGluZVxuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ2FjY2Vzcy1tYWlsZXInLCB7XG5cdFx0JHNldE9uSW5zZXJ0OiB7XG5cdFx0XHRfaWQ6ICdhY2Nlc3MtbWFpbGVyJyxcblx0XHRcdHJvbGVzOiBbJ2FkbWluJ11cblx0XHR9XG5cdH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5yb2NrZXRNYWlsVW5zdWJzY3JpYmUgPSBmdW5jdGlvbihfaWQsIGNyZWF0ZWRBdCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWQsXG5cdFx0Y3JlYXRlZEF0OiBuZXcgRGF0ZShwYXJzZUludChjcmVhdGVkQXQpKVxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0J21haWxlci51bnN1YnNjcmliZWQnOiB0cnVlXG5cdFx0fVxuXHR9O1xuXHRjb25zdCBhZmZlY3RlZFJvd3MgPSB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcblx0Y29uc29sZS5sb2coJ1tNYWlsZXI6VW5zdWJzY3JpYmVdJywgX2lkLCBjcmVhdGVkQXQsIG5ldyBEYXRlKHBhcnNlSW50KGNyZWF0ZWRBdCkpLCBhZmZlY3RlZFJvd3MpO1xuXHRyZXR1cm4gYWZmZWN0ZWRSb3dzO1xufTtcbiIsIi8qZ2xvYmFscyBNYWlsZXIgKi9cbk1haWxlci5zZW5kTWFpbCA9IGZ1bmN0aW9uKGZyb20sIHN1YmplY3QsIGJvZHksIGRyeXJ1biwgcXVlcnkpIHtcblxuXHRjb25zdCByZmNNYWlsUGF0dGVybldpdGhOYW1lID0gL14oPzouKjwpPyhbYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqKSg/Oj4/KSQvO1xuXHRpZiAoIXJmY01haWxQYXR0ZXJuV2l0aE5hbWUudGVzdChmcm9tKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtZnJvbS1hZGRyZXNzJywgJ0ludmFsaWQgZnJvbSBhZGRyZXNzJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ01haWxlci5zZW5kTWFpbCdcblx0XHR9KTtcblx0fVxuXHRpZiAoYm9keS5pbmRleE9mKCdbdW5zdWJzY3JpYmVdJykgPT09IC0xKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWlzc2luZy11bnN1YnNjcmliZS1saW5rJywgJ1lvdSBtdXN0IHByb3ZpZGUgdGhlIFt1bnN1YnNjcmliZV0gbGluay4nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnTWFpbGVyLnNlbmRNYWlsJ1xuXHRcdH0pO1xuXHR9XG5cdGNvbnN0IGhlYWRlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0hlYWRlcicpIHx8ICcnKTtcblx0Y29uc3QgZm9vdGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfRm9vdGVyJykgfHwgJycpO1xuXG5cdGxldCB1c2VyUXVlcnkgPSB7ICdtYWlsZXIudW5zdWJzY3JpYmVkJzogeyAkZXhpc3RzOiAwIH0gfTtcblx0aWYgKHF1ZXJ5KSB7XG5cdFx0dXNlclF1ZXJ5ID0geyAkYW5kOiBbIHVzZXJRdWVyeSwgRUpTT04ucGFyc2UocXVlcnkpIF0gfTtcblx0fVxuXG5cdGlmIChkcnlydW4pIHtcblx0XHRyZXR1cm4gTWV0ZW9yLnVzZXJzLmZpbmQoe1xuXHRcdFx0J2VtYWlscy5hZGRyZXNzJzogZnJvbVxuXHRcdH0pLmZvckVhY2goKHVzZXIpID0+IHtcblx0XHRcdGxldCBlbWFpbCA9IHVuZGVmaW5lZDtcblx0XHRcdGlmICh1c2VyLmVtYWlscyAmJiB1c2VyLmVtYWlsc1swXSAmJiB1c2VyLmVtYWlsc1swXS5hZGRyZXNzKSB7XG5cdFx0XHRcdGVtYWlsID0gdXNlci5lbWFpbHNbMF0uYWRkcmVzcztcblx0XHRcdH1cblx0XHRcdGNvbnN0IGh0bWwgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKGJvZHksIHtcblx0XHRcdFx0dW5zdWJzY3JpYmU6IE1ldGVvci5hYnNvbHV0ZVVybChGbG93Um91dGVyLnBhdGgoJ21haWxlci91bnN1YnNjcmliZS86X2lkLzpjcmVhdGVkQXQnLCB7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHRjcmVhdGVkQXQ6IHVzZXIuY3JlYXRlZEF0LmdldFRpbWUoKVxuXHRcdFx0XHR9KSksXG5cdFx0XHRcdG5hbWU6IHVzZXIubmFtZSxcblx0XHRcdFx0ZW1haWxcblx0XHRcdH0pO1xuXHRcdFx0ZW1haWwgPSBgJHsgdXNlci5uYW1lIH0gPCR7IGVtYWlsIH0+YDtcblx0XHRcdGlmIChyZmNNYWlsUGF0dGVybldpdGhOYW1lLnRlc3QoZW1haWwpKSB7XG5cdFx0XHRcdE1ldGVvci5kZWZlcihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gRW1haWwuc2VuZCh7XG5cdFx0XHRcdFx0XHR0bzogZW1haWwsXG5cdFx0XHRcdFx0XHRmcm9tLFxuXHRcdFx0XHRcdFx0c3ViamVjdCxcblx0XHRcdFx0XHRcdGh0bWw6IGhlYWRlciArIGh0bWwgKyBmb290ZXJcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiBjb25zb2xlLmxvZyhgU2VuZGluZyBlbWFpbCB0byAkeyBlbWFpbCB9YCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIE1ldGVvci51c2Vycy5maW5kKHVzZXJRdWVyeSkuZm9yRWFjaChmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRsZXQgZW1haWwgPSB1bmRlZmluZWQ7XG5cdFx0XHRpZiAodXNlci5lbWFpbHMgJiYgdXNlci5lbWFpbHNbMF0gJiYgdXNlci5lbWFpbHNbMF0uYWRkcmVzcykge1xuXHRcdFx0XHRlbWFpbCA9IHVzZXIuZW1haWxzWzBdLmFkZHJlc3M7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBodG1sID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShib2R5LCB7XG5cdFx0XHRcdHVuc3Vic2NyaWJlOiBNZXRlb3IuYWJzb2x1dGVVcmwoRmxvd1JvdXRlci5wYXRoKCdtYWlsZXIvdW5zdWJzY3JpYmUvOl9pZC86Y3JlYXRlZEF0Jywge1xuXHRcdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdFx0Y3JlYXRlZEF0OiB1c2VyLmNyZWF0ZWRBdC5nZXRUaW1lKClcblx0XHRcdFx0fSkpLFxuXHRcdFx0XHRuYW1lOiB1c2VyLm5hbWUsXG5cdFx0XHRcdGVtYWlsXG5cdFx0XHR9KTtcblx0XHRcdGVtYWlsID0gYCR7IHVzZXIubmFtZSB9IDwkeyBlbWFpbCB9PmA7XG5cdFx0XHRpZiAocmZjTWFpbFBhdHRlcm5XaXRoTmFtZS50ZXN0KGVtYWlsKSkge1xuXHRcdFx0XHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIEVtYWlsLnNlbmQoe1xuXHRcdFx0XHRcdFx0dG86IGVtYWlsLFxuXHRcdFx0XHRcdFx0ZnJvbSxcblx0XHRcdFx0XHRcdHN1YmplY3QsXG5cdFx0XHRcdFx0XHRodG1sOiBoZWFkZXIgKyBodG1sICsgZm9vdGVyXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm4gY29uc29sZS5sb2coYFNlbmRpbmcgZW1haWwgdG8gJHsgZW1haWwgfWApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59O1xuIiwiLyogZ2xvYmFscyBNYWlsZXIgKi9cbk1haWxlci51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKF9pZCwgY3JlYXRlZEF0KSB7XG5cdGlmIChfaWQgJiYgY3JlYXRlZEF0KSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnJvY2tldE1haWxVbnN1YnNjcmliZShfaWQsIGNyZWF0ZWRBdCkgPT09IDE7XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufTtcbiIsIi8qZ2xvYmFscyBNYWlsZXIgKi9cbk1ldGVvci5tZXRob2RzKHtcblx0J01haWxlci5zZW5kTWFpbCcoZnJvbSwgc3ViamVjdCwgYm9keSwgZHJ5cnVuLCBxdWVyeSkge1xuXHRcdGNvbnN0IHVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcblx0XHRpZiAoIXVzZXJJZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAnTWFpbGVyLnNlbmRNYWlsJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlcklkLCAnYWRtaW4nKSAhPT0gdHJ1ZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ01haWxlci5zZW5kTWFpbCdcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRyZXR1cm4gTWFpbGVyLnNlbmRNYWlsKGZyb20sIHN1YmplY3QsIGJvZHksIGRyeXJ1biwgcXVlcnkpO1xuXHR9XG59KTtcblxuXG4vL0xpbWl0IHNldHRpbmcgdXNlcm5hbWUgb25jZSBwZXIgbWludXRlXG4vL0REUFJhdGVMaW1pdGVyLmFkZFJ1bGVcbi8vXHR0eXBlOiAnbWV0aG9kJ1xuLy9cdG5hbWU6ICdNYWlsZXIuc2VuZE1haWwnXG4vL1x0Y29ubmVjdGlvbklkOiAtPiByZXR1cm4gdHJ1ZVxuLy9cdCwgMSwgNjAwMDBcbiIsIi8qZ2xvYmFscyBNYWlsZXIgKi9cbk1ldGVvci5tZXRob2RzKHtcblx0J01haWxlcjp1bnN1YnNjcmliZScoX2lkLCBjcmVhdGVkQXQpIHtcblx0XHRyZXR1cm4gTWFpbGVyLnVuc3Vic2NyaWJlKF9pZCwgY3JlYXRlZEF0KTtcblx0fVxufSk7XG5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoe1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ01haWxlcjp1bnN1YnNjcmliZScsXG5cdGNvbm5lY3Rpb25JZCgpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSwgMSwgNjAwMDApO1xuIl19
