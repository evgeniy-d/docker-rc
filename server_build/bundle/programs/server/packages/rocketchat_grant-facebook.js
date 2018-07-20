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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:grant-facebook":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/rocketchat_grant-facebook/server/index.js                                      //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
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
const version = 'v2.10';

function getIdentity(accessToken, fields) {
  try {
    return HTTP.get(`https://graph.facebook.com/${version}/me`, {
      headers: {
        'User-Agent': userAgent
      },
      params: {
        access_token: accessToken,
        fields: fields.join(',')
      }
    }).data;
  } catch (err) {
    throw new GrantError(`Failed to fetch identity from Facebook. ${err.message}`);
  }
}

function getPicture(accessToken) {
  try {
    return HTTP.get(`https://graph.facebook.com/${version}/me/picture`, {
      headers: {
        'User-Agent': userAgent
      },
      params: {
        redirect: false,
        height: 200,
        width: 200,
        type: 'normal',
        access_token: accessToken
      }
    }).data;
  } catch (err) {
    throw new GrantError(`Failed to fetch profile picture from Facebook. ${err.message}`);
  }
}

function getUser(accessToken) {
  const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name'];
  const identity = getIdentity(accessToken, whitelisted);
  const avatar = getPicture(accessToken);
  const username = identity.name.toLowerCase().replace(' ', '.');
  return {
    id: identity.id,
    email: identity.email,
    username,
    name: `${identity.first_name} ${identity.last_name}`,
    avatar: avatar.data.url
  };
}

// Register Facebook OAuth
Providers.register('facebook', {
  scope: ['public_profile', 'email']
}, getUser);
/////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:grant-facebook/server/index.js");

/* Exports */
Package._define("rocketchat:grant-facebook", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_grant-facebook.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFudC1mYWNlYm9vay9zZXJ2ZXIvaW5kZXguanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiZ2V0VXNlciIsIlByb3ZpZGVycyIsIkdyYW50RXJyb3IiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiSFRUUCIsInVzZXJBZ2VudCIsInZlcnNpb24iLCJnZXRJZGVudGl0eSIsImFjY2Vzc1Rva2VuIiwiZmllbGRzIiwiZ2V0IiwiaGVhZGVycyIsInBhcmFtcyIsImFjY2Vzc190b2tlbiIsImpvaW4iLCJkYXRhIiwiZXJyIiwibWVzc2FnZSIsImdldFBpY3R1cmUiLCJyZWRpcmVjdCIsImhlaWdodCIsIndpZHRoIiwidHlwZSIsIndoaXRlbGlzdGVkIiwiaWRlbnRpdHkiLCJhdmF0YXIiLCJ1c2VybmFtZSIsIm5hbWUiLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJpZCIsImVtYWlsIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInVybCIsInJlZ2lzdGVyIiwic2NvcGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsV0FBUSxNQUFJQTtBQUFiLENBQWQ7QUFBcUMsSUFBSUMsU0FBSixFQUFjQyxVQUFkO0FBQXlCSixPQUFPSyxLQUFQLENBQWFDLFFBQVEseUJBQVIsQ0FBYixFQUFnRDtBQUFDSCxZQUFVSSxDQUFWLEVBQVk7QUFBQ0osZ0JBQVVJLENBQVY7QUFBWSxHQUExQjs7QUFBMkJILGFBQVdHLENBQVgsRUFBYTtBQUFDSCxpQkFBV0csQ0FBWDtBQUFhOztBQUF0RCxDQUFoRCxFQUF3RyxDQUF4RztBQUEyRyxJQUFJQyxJQUFKO0FBQVNSLE9BQU9LLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWIsRUFBb0M7QUFBQ0UsT0FBS0QsQ0FBTCxFQUFPO0FBQUNDLFdBQUtELENBQUw7QUFBTzs7QUFBaEIsQ0FBcEMsRUFBc0QsQ0FBdEQ7QUFHbEwsTUFBTUUsWUFBWSxRQUFsQjtBQUNBLE1BQU1DLFVBQVUsT0FBaEI7O0FBRUEsU0FBU0MsV0FBVCxDQUFxQkMsV0FBckIsRUFBa0NDLE1BQWxDLEVBQTBDO0FBQ3pDLE1BQUk7QUFDSCxXQUFPTCxLQUFLTSxHQUFMLENBQ0wsOEJBQThCSixPQUFTLEtBRGxDLEVBQ3dDO0FBQzdDSyxlQUFTO0FBQUUsc0JBQWNOO0FBQWhCLE9BRG9DO0FBRTdDTyxjQUFRO0FBQ1BDLHNCQUFjTCxXQURQO0FBRVBDLGdCQUFRQSxPQUFPSyxJQUFQLENBQVksR0FBWjtBQUZEO0FBRnFDLEtBRHhDLEVBT0hDLElBUEo7QUFRQSxHQVRELENBU0UsT0FBT0MsR0FBUCxFQUFZO0FBQ2IsVUFBTSxJQUFJaEIsVUFBSixDQUFnQiwyQ0FBMkNnQixJQUFJQyxPQUFTLEVBQXhFLENBQU47QUFDQTtBQUNEOztBQUVELFNBQVNDLFVBQVQsQ0FBb0JWLFdBQXBCLEVBQWlDO0FBQ2hDLE1BQUk7QUFDSCxXQUFPSixLQUFLTSxHQUFMLENBQ0wsOEJBQThCSixPQUFTLGFBRGxDLEVBQ2dEO0FBQ3JESyxlQUFTO0FBQUUsc0JBQWNOO0FBQWhCLE9BRDRDO0FBRXJETyxjQUFRO0FBQ1BPLGtCQUFVLEtBREg7QUFFUEMsZ0JBQVEsR0FGRDtBQUdQQyxlQUFPLEdBSEE7QUFJUEMsY0FBTSxRQUpDO0FBS1BULHNCQUFjTDtBQUxQO0FBRjZDLEtBRGhELEVBVUhPLElBVko7QUFXQSxHQVpELENBWUUsT0FBT0MsR0FBUCxFQUFZO0FBQ2IsVUFBTSxJQUFJaEIsVUFBSixDQUFnQixrREFBa0RnQixJQUFJQyxPQUFTLEVBQS9FLENBQU47QUFDQTtBQUNEOztBQUVNLFNBQVNuQixPQUFULENBQWlCVSxXQUFqQixFQUE4QjtBQUNwQyxRQUFNZSxjQUFjLENBQUMsSUFBRCxFQUFPLE9BQVAsRUFBZ0IsTUFBaEIsRUFBd0IsWUFBeEIsRUFBc0MsV0FBdEMsQ0FBcEI7QUFDQSxRQUFNQyxXQUFXakIsWUFBWUMsV0FBWixFQUF5QmUsV0FBekIsQ0FBakI7QUFDQSxRQUFNRSxTQUFTUCxXQUFXVixXQUFYLENBQWY7QUFDQSxRQUFNa0IsV0FBV0YsU0FBU0csSUFBVCxDQUFjQyxXQUFkLEdBQTRCQyxPQUE1QixDQUFvQyxHQUFwQyxFQUF5QyxHQUF6QyxDQUFqQjtBQUVBLFNBQU87QUFDTkMsUUFBSU4sU0FBU00sRUFEUDtBQUVOQyxXQUFPUCxTQUFTTyxLQUZWO0FBR05MLFlBSE07QUFJTkMsVUFBTyxHQUFHSCxTQUFTUSxVQUFZLElBQUlSLFNBQVNTLFNBQVcsRUFKakQ7QUFLTlIsWUFBUUEsT0FBT1YsSUFBUCxDQUFZbUI7QUFMZCxHQUFQO0FBT0E7O0FBRUQ7QUFDQW5DLFVBQVVvQyxRQUFWLENBQW1CLFVBQW5CLEVBQStCO0FBQUVDLFNBQU8sQ0FBQyxnQkFBRCxFQUFtQixPQUFuQjtBQUFULENBQS9CLEVBQXVFdEMsT0FBdkUsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9ncmFudC1mYWNlYm9vay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3ZpZGVycywgR3JhbnRFcnJvciB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmdyYW50JztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG5cbmNvbnN0IHVzZXJBZ2VudCA9ICdNZXRlb3InO1xuY29uc3QgdmVyc2lvbiA9ICd2Mi4xMCc7XG5cbmZ1bmN0aW9uIGdldElkZW50aXR5KGFjY2Vzc1Rva2VuLCBmaWVsZHMpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSFRUUC5nZXQoXG5cdFx0XHRgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vJHsgdmVyc2lvbiB9L21lYCwge1xuXHRcdFx0XHRoZWFkZXJzOiB7ICdVc2VyLUFnZW50JzogdXNlckFnZW50IH0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdGFjY2Vzc190b2tlbjogYWNjZXNzVG9rZW4sXG5cdFx0XHRcdFx0ZmllbGRzOiBmaWVsZHMuam9pbignLCcpXG5cdFx0XHRcdH1cblx0XHRcdH0pLmRhdGE7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdHRocm93IG5ldyBHcmFudEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggaWRlbnRpdHkgZnJvbSBGYWNlYm9vay4gJHsgZXJyLm1lc3NhZ2UgfWApO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldFBpY3R1cmUoYWNjZXNzVG9rZW4pIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSFRUUC5nZXQoXG5cdFx0XHRgaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vJHsgdmVyc2lvbiB9L21lL3BpY3R1cmVgLCB7XG5cdFx0XHRcdGhlYWRlcnM6IHsgJ1VzZXItQWdlbnQnOiB1c2VyQWdlbnQgfSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0cmVkaXJlY3Q6IGZhbHNlLFxuXHRcdFx0XHRcdGhlaWdodDogMjAwLFxuXHRcdFx0XHRcdHdpZHRoOiAyMDAsXG5cdFx0XHRcdFx0dHlwZTogJ25vcm1hbCcsXG5cdFx0XHRcdFx0YWNjZXNzX3Rva2VuOiBhY2Nlc3NUb2tlblxuXHRcdFx0XHR9XG5cdFx0XHR9KS5kYXRhO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHR0aHJvdyBuZXcgR3JhbnRFcnJvcihgRmFpbGVkIHRvIGZldGNoIHByb2ZpbGUgcGljdHVyZSBmcm9tIEZhY2Vib29rLiAkeyBlcnIubWVzc2FnZSB9YCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVzZXIoYWNjZXNzVG9rZW4pIHtcblx0Y29uc3Qgd2hpdGVsaXN0ZWQgPSBbJ2lkJywgJ2VtYWlsJywgJ25hbWUnLCAnZmlyc3RfbmFtZScsICdsYXN0X25hbWUnXTtcblx0Y29uc3QgaWRlbnRpdHkgPSBnZXRJZGVudGl0eShhY2Nlc3NUb2tlbiwgd2hpdGVsaXN0ZWQpO1xuXHRjb25zdCBhdmF0YXIgPSBnZXRQaWN0dXJlKGFjY2Vzc1Rva2VuKTtcblx0Y29uc3QgdXNlcm5hbWUgPSBpZGVudGl0eS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICcuJyk7XG5cblx0cmV0dXJuIHtcblx0XHRpZDogaWRlbnRpdHkuaWQsXG5cdFx0ZW1haWw6IGlkZW50aXR5LmVtYWlsLFxuXHRcdHVzZXJuYW1lLFxuXHRcdG5hbWU6IGAkeyBpZGVudGl0eS5maXJzdF9uYW1lIH0gJHsgaWRlbnRpdHkubGFzdF9uYW1lIH1gLFxuXHRcdGF2YXRhcjogYXZhdGFyLmRhdGEudXJsXG5cdH07XG59XG5cbi8vIFJlZ2lzdGVyIEZhY2Vib29rIE9BdXRoXG5Qcm92aWRlcnMucmVnaXN0ZXIoJ2ZhY2Vib29rJywgeyBzY29wZTogWydwdWJsaWNfcHJvZmlsZScsICdlbWFpbCddIH0sIGdldFVzZXIpO1xuIl19
