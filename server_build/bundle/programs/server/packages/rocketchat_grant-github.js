(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:grant-github":{"server":{"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////
//                                                                                //
// packages/rocketchat_grant-github/server/index.js                               //
//                                                                                //
////////////////////////////////////////////////////////////////////////////////////
                                                                                  //
module.export({
  getUser: () => getUser
});
let Providers, GrantError;
module.watch(require("meteor/rocketchat:grant"), {
  Providers(v) {
    Providers = v;
  },

  GrantError(v) {
    GrantError = v;
  }

}, 0);
let HTTP;
module.watch(require("meteor/http"), {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
const userAgent = 'Meteor';

function getIdentity(accessToken) {
  try {
    return HTTP.get('https://api.github.com/user', {
      headers: {
        'User-Agent': userAgent
      },
      // http://developer.github.com/v3/#user-agent-required
      params: {
        access_token: accessToken
      }
    }).data;
  } catch (err) {
    throw new GrantError(`Failed to fetch identity from Github. ${err.message}`);
  }
}

function getEmails(accessToken) {
  try {
    return HTTP.get('https://api.github.com/user/emails', {
      headers: {
        'User-Agent': userAgent
      },
      // http://developer.github.com/v3/#user-agent-required
      params: {
        access_token: accessToken
      }
    }).data;
  } catch (err) {
    return [];
  }
}

function getUser(accessToken) {
  const identity = getIdentity(accessToken);
  const emails = getEmails(accessToken);
  const primaryEmail = (emails || []).find(email => email.primary === true);
  return {
    id: identity.id,
    email: identity.email || primaryEmail && primaryEmail.email || '',
    username: identity.login,
    emails,
    name: identity.name,
    avatar: identity.avatar_url
  };
}

// Register GitHub OAuth
Providers.register('github', {
  scope: ['user', 'user:email']
}, getUser);
////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:grant-github/server/index.js");

/* Exports */
Package._define("rocketchat:grant-github", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_grant-github.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFudC1naXRodWIvc2VydmVyL2luZGV4LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsImdldFVzZXIiLCJQcm92aWRlcnMiLCJHcmFudEVycm9yIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIkhUVFAiLCJ1c2VyQWdlbnQiLCJnZXRJZGVudGl0eSIsImFjY2Vzc1Rva2VuIiwiZ2V0IiwiaGVhZGVycyIsInBhcmFtcyIsImFjY2Vzc190b2tlbiIsImRhdGEiLCJlcnIiLCJtZXNzYWdlIiwiZ2V0RW1haWxzIiwiaWRlbnRpdHkiLCJlbWFpbHMiLCJwcmltYXJ5RW1haWwiLCJmaW5kIiwiZW1haWwiLCJwcmltYXJ5IiwiaWQiLCJ1c2VybmFtZSIsImxvZ2luIiwibmFtZSIsImF2YXRhciIsImF2YXRhcl91cmwiLCJyZWdpc3RlciIsInNjb3BlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLFdBQVEsTUFBSUE7QUFBYixDQUFkO0FBQXFDLElBQUlDLFNBQUosRUFBY0MsVUFBZDtBQUF5QkosT0FBT0ssS0FBUCxDQUFhQyxRQUFRLHlCQUFSLENBQWIsRUFBZ0Q7QUFBQ0gsWUFBVUksQ0FBVixFQUFZO0FBQUNKLGdCQUFVSSxDQUFWO0FBQVksR0FBMUI7O0FBQTJCSCxhQUFXRyxDQUFYLEVBQWE7QUFBQ0gsaUJBQVdHLENBQVg7QUFBYTs7QUFBdEQsQ0FBaEQsRUFBd0csQ0FBeEc7QUFBMkcsSUFBSUMsSUFBSjtBQUFTUixPQUFPSyxLQUFQLENBQWFDLFFBQVEsYUFBUixDQUFiLEVBQW9DO0FBQUNFLE9BQUtELENBQUwsRUFBTztBQUFDQyxXQUFLRCxDQUFMO0FBQU87O0FBQWhCLENBQXBDLEVBQXNELENBQXREO0FBR2xMLE1BQU1FLFlBQVksUUFBbEI7O0FBRUEsU0FBU0MsV0FBVCxDQUFxQkMsV0FBckIsRUFBa0M7QUFDakMsTUFBSTtBQUNILFdBQU9ILEtBQUtJLEdBQUwsQ0FDTiw2QkFETSxFQUN5QjtBQUM5QkMsZUFBUztBQUFFLHNCQUFjSjtBQUFoQixPQURxQjtBQUNRO0FBQ3RDSyxjQUFRO0FBQUVDLHNCQUFjSjtBQUFoQjtBQUZzQixLQUR6QixFQUlISyxJQUpKO0FBS0EsR0FORCxDQU1FLE9BQU9DLEdBQVAsRUFBWTtBQUNiLFVBQU0sSUFBSWIsVUFBSixDQUFnQix5Q0FBeUNhLElBQUlDLE9BQVMsRUFBdEUsQ0FBTjtBQUNBO0FBQ0Q7O0FBRUQsU0FBU0MsU0FBVCxDQUFtQlIsV0FBbkIsRUFBZ0M7QUFDL0IsTUFBSTtBQUNILFdBQU9ILEtBQUtJLEdBQUwsQ0FDTixvQ0FETSxFQUNnQztBQUNyQ0MsZUFBUztBQUFFLHNCQUFjSjtBQUFoQixPQUQ0QjtBQUNDO0FBQ3RDSyxjQUFRO0FBQUVDLHNCQUFjSjtBQUFoQjtBQUY2QixLQURoQyxFQUlISyxJQUpKO0FBS0EsR0FORCxDQU1FLE9BQU9DLEdBQVAsRUFBWTtBQUNiLFdBQU8sRUFBUDtBQUNBO0FBQ0Q7O0FBRU0sU0FBU2YsT0FBVCxDQUFpQlMsV0FBakIsRUFBOEI7QUFDcEMsUUFBTVMsV0FBV1YsWUFBWUMsV0FBWixDQUFqQjtBQUNBLFFBQU1VLFNBQVNGLFVBQVVSLFdBQVYsQ0FBZjtBQUNBLFFBQU1XLGVBQWUsQ0FBQ0QsVUFBVSxFQUFYLEVBQWVFLElBQWYsQ0FBb0JDLFNBQVNBLE1BQU1DLE9BQU4sS0FBa0IsSUFBL0MsQ0FBckI7QUFFQSxTQUFPO0FBQ05DLFFBQUlOLFNBQVNNLEVBRFA7QUFFTkYsV0FBT0osU0FBU0ksS0FBVCxJQUFtQkYsZ0JBQWdCQSxhQUFhRSxLQUFoRCxJQUEwRCxFQUYzRDtBQUdORyxjQUFVUCxTQUFTUSxLQUhiO0FBSU5QLFVBSk07QUFLTlEsVUFBTVQsU0FBU1MsSUFMVDtBQU1OQyxZQUFRVixTQUFTVztBQU5YLEdBQVA7QUFRQTs7QUFFRDtBQUNBNUIsVUFBVTZCLFFBQVYsQ0FBbUIsUUFBbkIsRUFBNkI7QUFBRUMsU0FBTyxDQUFDLE1BQUQsRUFBUyxZQUFUO0FBQVQsQ0FBN0IsRUFBZ0UvQixPQUFoRSxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2dyYW50LWdpdGh1Yi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3ZpZGVycywgR3JhbnRFcnJvciB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmdyYW50JztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG5cbmNvbnN0IHVzZXJBZ2VudCA9ICdNZXRlb3InO1xuXG5mdW5jdGlvbiBnZXRJZGVudGl0eShhY2Nlc3NUb2tlbikge1xuXHR0cnkge1xuXHRcdHJldHVybiBIVFRQLmdldChcblx0XHRcdCdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXInLCB7XG5cdFx0XHRcdGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiB1c2VyQWdlbnQgfSwgLy8gaHR0cDovL2RldmVsb3Blci5naXRodWIuY29tL3YzLyN1c2VyLWFnZW50LXJlcXVpcmVkXG5cdFx0XHRcdHBhcmFtczogeyBhY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VuIH1cblx0XHRcdH0pLmRhdGE7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHRocm93IG5ldyBHcmFudEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggaWRlbnRpdHkgZnJvbSBHaXRodWIuICR7IGVyci5tZXNzYWdlIH1gKTtcblx0fVxufVxuXG5mdW5jdGlvbiBnZXRFbWFpbHMoYWNjZXNzVG9rZW4pIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSFRUUC5nZXQoXG5cdFx0XHQnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS91c2VyL2VtYWlscycsIHtcblx0XHRcdFx0aGVhZGVyczogeyAnVXNlci1BZ2VudCc6IHVzZXJBZ2VudCB9LCAvLyBodHRwOi8vZGV2ZWxvcGVyLmdpdGh1Yi5jb20vdjMvI3VzZXItYWdlbnQtcmVxdWlyZWRcblx0XHRcdFx0cGFyYW1zOiB7IGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW4gfVxuXHRcdFx0fSkuZGF0YTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVc2VyKGFjY2Vzc1Rva2VuKSB7XG5cdGNvbnN0IGlkZW50aXR5ID0gZ2V0SWRlbnRpdHkoYWNjZXNzVG9rZW4pO1xuXHRjb25zdCBlbWFpbHMgPSBnZXRFbWFpbHMoYWNjZXNzVG9rZW4pO1xuXHRjb25zdCBwcmltYXJ5RW1haWwgPSAoZW1haWxzIHx8IFtdKS5maW5kKGVtYWlsID0+IGVtYWlsLnByaW1hcnkgPT09IHRydWUpO1xuXG5cdHJldHVybiB7XG5cdFx0aWQ6IGlkZW50aXR5LmlkLFxuXHRcdGVtYWlsOiBpZGVudGl0eS5lbWFpbCB8fCAocHJpbWFyeUVtYWlsICYmIHByaW1hcnlFbWFpbC5lbWFpbCkgfHwgJycsXG5cdFx0dXNlcm5hbWU6IGlkZW50aXR5LmxvZ2luLFxuXHRcdGVtYWlscyxcblx0XHRuYW1lOiBpZGVudGl0eS5uYW1lLFxuXHRcdGF2YXRhcjogaWRlbnRpdHkuYXZhdGFyX3VybFxuXHR9O1xufVxuXG4vLyBSZWdpc3RlciBHaXRIdWIgT0F1dGhcblByb3ZpZGVycy5yZWdpc3RlcignZ2l0aHViJywgeyBzY29wZTogWyd1c2VyJywgJ3VzZXI6ZW1haWwnXSB9LCBnZXRVc2VyKTtcbiJdfQ==
