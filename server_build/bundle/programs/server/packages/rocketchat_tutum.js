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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:tutum":{"startup.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/rocketchat_tutum/startup.js                                                                 //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
/* Examples

DOCKERCLOUD_REDIS_HOST=redis://:password@host:6379
DOCKERCLOUD_CLIENT_NAME=mywebsite
DOCKERCLOUD_CLIENT_HOST=mywebsite.dotcloud.com
*/
if (process.env.DOCKERCLOUD_REDIS_HOST != null) {
  const redis = require('redis');

  const client = redis.createClient(process.env.DOCKERCLOUD_REDIS_HOST);
  client.on('error', err => console.log('Redis error ->', err));
  client.del(`frontend:${process.env.DOCKERCLOUD_CLIENT_HOST}`);
  client.rpush(`frontend:${process.env.DOCKERCLOUD_CLIENT_HOST}`, process.env.DOCKERCLOUD_CLIENT_NAME);
  const port = process.env.PORT || 3000;
  client.rpush(`frontend:${process.env.DOCKERCLOUD_CLIENT_HOST}`, `http://${process.env.DOCKERCLOUD_IP_ADDRESS.split('/')[0]}:${port}`); // removes the redis entry in 90 seconds on a SIGTERM

  process.on('SIGTERM', () => client.expire(`frontend:${process.env.DOCKERCLOUD_CLIENT_HOST}`, 90));
  process.on('SIGINT', () => client.expire(`frontend:${process.env.DOCKERCLOUD_CLIENT_HOST}`, 90));
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:tutum/startup.js");

/* Exports */
Package._define("rocketchat:tutum");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_tutum.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0dXR1bS9zdGFydHVwLmpzIl0sIm5hbWVzIjpbInByb2Nlc3MiLCJlbnYiLCJET0NLRVJDTE9VRF9SRURJU19IT1NUIiwicmVkaXMiLCJyZXF1aXJlIiwiY2xpZW50IiwiY3JlYXRlQ2xpZW50Iiwib24iLCJlcnIiLCJjb25zb2xlIiwibG9nIiwiZGVsIiwiRE9DS0VSQ0xPVURfQ0xJRU5UX0hPU1QiLCJycHVzaCIsIkRPQ0tFUkNMT1VEX0NMSUVOVF9OQU1FIiwicG9ydCIsIlBPUlQiLCJET0NLRVJDTE9VRF9JUF9BRERSRVNTIiwic3BsaXQiLCJleHBpcmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O0FBT0EsSUFBSUEsUUFBUUMsR0FBUixDQUFZQyxzQkFBWixJQUFzQyxJQUExQyxFQUFnRDtBQUMvQyxRQUFNQyxRQUFRQyxRQUFRLE9BQVIsQ0FBZDs7QUFFQSxRQUFNQyxTQUFTRixNQUFNRyxZQUFOLENBQW1CTixRQUFRQyxHQUFSLENBQVlDLHNCQUEvQixDQUFmO0FBRUFHLFNBQU9FLEVBQVAsQ0FBVSxPQUFWLEVBQW1CQyxPQUFPQyxRQUFRQyxHQUFSLENBQVksZ0JBQVosRUFBOEJGLEdBQTlCLENBQTFCO0FBRUFILFNBQU9NLEdBQVAsQ0FBWSxZQUFZWCxRQUFRQyxHQUFSLENBQVlXLHVCQUF5QixFQUE3RDtBQUNBUCxTQUFPUSxLQUFQLENBQWMsWUFBWWIsUUFBUUMsR0FBUixDQUFZVyx1QkFBeUIsRUFBL0QsRUFBa0VaLFFBQVFDLEdBQVIsQ0FBWWEsdUJBQTlFO0FBRUEsUUFBTUMsT0FBT2YsUUFBUUMsR0FBUixDQUFZZSxJQUFaLElBQW9CLElBQWpDO0FBQ0FYLFNBQU9RLEtBQVAsQ0FBYyxZQUFZYixRQUFRQyxHQUFSLENBQVlXLHVCQUF5QixFQUEvRCxFQUFtRSxVQUFVWixRQUFRQyxHQUFSLENBQVlnQixzQkFBWixDQUFtQ0MsS0FBbkMsQ0FBeUMsR0FBekMsRUFBOEMsQ0FBOUMsQ0FBa0QsSUFBSUgsSUFBTSxFQUF6SSxFQVgrQyxDQWEvQzs7QUFDQWYsVUFBUU8sRUFBUixDQUFXLFNBQVgsRUFBc0IsTUFBTUYsT0FBT2MsTUFBUCxDQUFlLFlBQVluQixRQUFRQyxHQUFSLENBQVlXLHVCQUF5QixFQUFoRSxFQUFtRSxFQUFuRSxDQUE1QjtBQUVBWixVQUFRTyxFQUFSLENBQVcsUUFBWCxFQUFxQixNQUFNRixPQUFPYyxNQUFQLENBQWUsWUFBWW5CLFFBQVFDLEdBQVIsQ0FBWVcsdUJBQXlCLEVBQWhFLEVBQW1FLEVBQW5FLENBQTNCO0FBQ0EsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF90dXR1bS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEV4YW1wbGVzXG5cbkRPQ0tFUkNMT1VEX1JFRElTX0hPU1Q9cmVkaXM6Ly86cGFzc3dvcmRAaG9zdDo2Mzc5XG5ET0NLRVJDTE9VRF9DTElFTlRfTkFNRT1teXdlYnNpdGVcbkRPQ0tFUkNMT1VEX0NMSUVOVF9IT1NUPW15d2Vic2l0ZS5kb3RjbG91ZC5jb21cbiovXG5cbmlmIChwcm9jZXNzLmVudi5ET0NLRVJDTE9VRF9SRURJU19IT1NUICE9IG51bGwpIHtcblx0Y29uc3QgcmVkaXMgPSByZXF1aXJlKCdyZWRpcycpO1xuXG5cdGNvbnN0IGNsaWVudCA9IHJlZGlzLmNyZWF0ZUNsaWVudChwcm9jZXNzLmVudi5ET0NLRVJDTE9VRF9SRURJU19IT1NUKTtcblxuXHRjbGllbnQub24oJ2Vycm9yJywgZXJyID0+IGNvbnNvbGUubG9nKCdSZWRpcyBlcnJvciAtPicsIGVycikpO1xuXG5cdGNsaWVudC5kZWwoYGZyb250ZW5kOiR7IHByb2Nlc3MuZW52LkRPQ0tFUkNMT1VEX0NMSUVOVF9IT1NUIH1gKTtcblx0Y2xpZW50LnJwdXNoKGBmcm9udGVuZDokeyBwcm9jZXNzLmVudi5ET0NLRVJDTE9VRF9DTElFTlRfSE9TVCB9YCwgcHJvY2Vzcy5lbnYuRE9DS0VSQ0xPVURfQ0xJRU5UX05BTUUpO1xuXG5cdGNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5QT1JUIHx8IDMwMDA7XG5cdGNsaWVudC5ycHVzaChgZnJvbnRlbmQ6JHsgcHJvY2Vzcy5lbnYuRE9DS0VSQ0xPVURfQ0xJRU5UX0hPU1QgfWAsIGBodHRwOi8vJHsgcHJvY2Vzcy5lbnYuRE9DS0VSQ0xPVURfSVBfQUREUkVTUy5zcGxpdCgnLycpWzBdIH06JHsgcG9ydCB9YCk7XG5cblx0Ly8gcmVtb3ZlcyB0aGUgcmVkaXMgZW50cnkgaW4gOTAgc2Vjb25kcyBvbiBhIFNJR1RFUk1cblx0cHJvY2Vzcy5vbignU0lHVEVSTScsICgpID0+IGNsaWVudC5leHBpcmUoYGZyb250ZW5kOiR7IHByb2Nlc3MuZW52LkRPQ0tFUkNMT1VEX0NMSUVOVF9IT1NUIH1gLCA5MCkpO1xuXG5cdHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IGNsaWVudC5leHBpcmUoYGZyb250ZW5kOiR7IHByb2Nlc3MuZW52LkRPQ0tFUkNMT1VEX0NMSUVOVF9IT1NUIH1gLCA5MCkpO1xufVxuIl19
