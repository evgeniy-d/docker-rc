(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:ui-admin":{"publications":{"adminRooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/rocketchat_ui-admin/publications/adminRooms.js                                //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
Meteor.publish('adminRooms', function (filter, types, limit) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'view-room-administration') !== true) {
    return this.ready();
  }

  if (!_.isArray(types)) {
    types = [];
  }

  const options = {
    fields: {
      name: 1,
      t: 1,
      cl: 1,
      u: 1,
      usernames: 1,
      muted: 1,
      ro: 1,
      default: 1,
      topic: 1,
      msgs: 1,
      archived: 1,
      tokenpass: 1
    },
    limit,
    sort: {
      default: -1,
      name: 1
    }
  };
  filter = s.trim(filter);

  if (filter && types.length) {
    // CACHE: can we stop using publications here?
    return RocketChat.models.Rooms.findByNameContainingAndTypes(filter, types, options);
  } else if (types.length) {
    // CACHE: can we stop using publications here?
    return RocketChat.models.Rooms.findByTypes(types, options);
  } else {
    // CACHE: can we stop using publications here?
    return RocketChat.models.Rooms.findByNameContaining(filter, options);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:ui-admin/publications/adminRooms.js");

/* Exports */
Package._define("rocketchat:ui-admin");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_ui-admin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1aS1hZG1pbi9wdWJsaWNhdGlvbnMvYWRtaW5Sb29tcy5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzIiwiTWV0ZW9yIiwicHVibGlzaCIsImZpbHRlciIsInR5cGVzIiwibGltaXQiLCJ1c2VySWQiLCJyZWFkeSIsIlJvY2tldENoYXQiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJpc0FycmF5Iiwib3B0aW9ucyIsImZpZWxkcyIsIm5hbWUiLCJ0IiwiY2wiLCJ1IiwidXNlcm5hbWVzIiwibXV0ZWQiLCJybyIsInRvcGljIiwibXNncyIsImFyY2hpdmVkIiwidG9rZW5wYXNzIiwic29ydCIsInRyaW0iLCJsZW5ndGgiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRCeU5hbWVDb250YWluaW5nQW5kVHlwZXMiLCJmaW5kQnlUeXBlcyIsImZpbmRCeU5hbWVDb250YWluaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLENBQUo7QUFBTUwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFFBQUVELENBQUY7QUFBSTs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7QUFHcEVFLE9BQU9DLE9BQVAsQ0FBZSxZQUFmLEVBQTZCLFVBQVNDLE1BQVQsRUFBaUJDLEtBQWpCLEVBQXdCQyxLQUF4QixFQUErQjtBQUMzRCxNQUFJLENBQUMsS0FBS0MsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUtDLEtBQUwsRUFBUDtBQUNBOztBQUNELE1BQUlDLFdBQVdDLEtBQVgsQ0FBaUJDLGFBQWpCLENBQStCLEtBQUtKLE1BQXBDLEVBQTRDLDBCQUE1QyxNQUE0RSxJQUFoRixFQUFzRjtBQUNyRixXQUFPLEtBQUtDLEtBQUwsRUFBUDtBQUNBOztBQUNELE1BQUksQ0FBQ2IsRUFBRWlCLE9BQUYsQ0FBVVAsS0FBVixDQUFMLEVBQXVCO0FBQ3RCQSxZQUFRLEVBQVI7QUFDQTs7QUFFRCxRQUFNUSxVQUFVO0FBQ2ZDLFlBQVE7QUFDUEMsWUFBTSxDQURDO0FBRVBDLFNBQUcsQ0FGSTtBQUdQQyxVQUFJLENBSEc7QUFJUEMsU0FBRyxDQUpJO0FBS1BDLGlCQUFXLENBTEo7QUFNUEMsYUFBTyxDQU5BO0FBT1BDLFVBQUksQ0FQRztBQVFQdEIsZUFBUyxDQVJGO0FBU1B1QixhQUFPLENBVEE7QUFVUEMsWUFBTSxDQVZDO0FBV1BDLGdCQUFVLENBWEg7QUFZUEMsaUJBQVc7QUFaSixLQURPO0FBZWZuQixTQWZlO0FBZ0Jmb0IsVUFBTTtBQUNMM0IsZUFBUyxDQUFDLENBREw7QUFFTGdCLFlBQU07QUFGRDtBQWhCUyxHQUFoQjtBQXNCQVgsV0FBU0gsRUFBRTBCLElBQUYsQ0FBT3ZCLE1BQVAsQ0FBVDs7QUFDQSxNQUFJQSxVQUFVQyxNQUFNdUIsTUFBcEIsRUFBNEI7QUFDM0I7QUFDQSxXQUFPbkIsV0FBV29CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyw0QkFBeEIsQ0FBcUQzQixNQUFyRCxFQUE2REMsS0FBN0QsRUFBb0VRLE9BQXBFLENBQVA7QUFDQSxHQUhELE1BR08sSUFBSVIsTUFBTXVCLE1BQVYsRUFBa0I7QUFDeEI7QUFDQSxXQUFPbkIsV0FBV29CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCRSxXQUF4QixDQUFvQzNCLEtBQXBDLEVBQTJDUSxPQUEzQyxDQUFQO0FBQ0EsR0FITSxNQUdBO0FBQ047QUFDQSxXQUFPSixXQUFXb0IsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JHLG9CQUF4QixDQUE2QzdCLE1BQTdDLEVBQXFEUyxPQUFyRCxDQUFQO0FBQ0E7QUFDRCxDQTVDRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3VpLWFkbWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbk1ldGVvci5wdWJsaXNoKCdhZG1pblJvb21zJywgZnVuY3Rpb24oZmlsdGVyLCB0eXBlcywgbGltaXQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpICE9PSB0cnVlKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXHRpZiAoIV8uaXNBcnJheSh0eXBlcykpIHtcblx0XHR0eXBlcyA9IFtdO1xuXHR9XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdG5hbWU6IDEsXG5cdFx0XHR0OiAxLFxuXHRcdFx0Y2w6IDEsXG5cdFx0XHR1OiAxLFxuXHRcdFx0dXNlcm5hbWVzOiAxLFxuXHRcdFx0bXV0ZWQ6IDEsXG5cdFx0XHRybzogMSxcblx0XHRcdGRlZmF1bHQ6IDEsXG5cdFx0XHR0b3BpYzogMSxcblx0XHRcdG1zZ3M6IDEsXG5cdFx0XHRhcmNoaXZlZDogMSxcblx0XHRcdHRva2VucGFzczogMVxuXHRcdH0sXG5cdFx0bGltaXQsXG5cdFx0c29ydDoge1xuXHRcdFx0ZGVmYXVsdDogLTEsXG5cdFx0XHRuYW1lOiAxXG5cdFx0fVxuXHR9O1xuXG5cdGZpbHRlciA9IHMudHJpbShmaWx0ZXIpO1xuXHRpZiAoZmlsdGVyICYmIHR5cGVzLmxlbmd0aCkge1xuXHRcdC8vIENBQ0hFOiBjYW4gd2Ugc3RvcCB1c2luZyBwdWJsaWNhdGlvbnMgaGVyZT9cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5TmFtZUNvbnRhaW5pbmdBbmRUeXBlcyhmaWx0ZXIsIHR5cGVzLCBvcHRpb25zKTtcblx0fSBlbHNlIGlmICh0eXBlcy5sZW5ndGgpIHtcblx0XHQvLyBDQUNIRTogY2FuIHdlIHN0b3AgdXNpbmcgcHVibGljYXRpb25zIGhlcmU/XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGVzKHR5cGVzLCBvcHRpb25zKTtcblx0fSBlbHNlIHtcblx0XHQvLyBDQUNIRTogY2FuIHdlIHN0b3AgdXNpbmcgcHVibGljYXRpb25zIGhlcmU/XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeU5hbWVDb250YWluaW5nKGZpbHRlciwgb3B0aW9ucyk7XG5cdH1cbn0pO1xuIl19
