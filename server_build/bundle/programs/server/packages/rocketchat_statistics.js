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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:statistics":{"lib":{"rocketchat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/lib/rocketchat.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.statistics = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"models":{"Statistics.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/models/Statistics.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Statistics = new class extends RocketChat.models._Base {
  constructor() {
    super('statistics');
    this.tryEnsureIndex({
      'createdAt': 1
    });
  } // FIND ONE


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findLast() {
    const options = {
      sort: {
        createdAt: -1
      },
      limit: 1
    };
    const records = this.find({}, options).fetch();
    return records && records[0];
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"get.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/functions/get.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let os;
module.watch(require("os"), {
  default(v) {
    os = v;
  }

}, 1);
const wizardFields = ['Organization_Type', 'Organization_Name', 'Industry', 'Size', 'Country', 'Website', 'Site_Name', 'Language', 'Server_Type', 'Allow_Marketing_Emails'];

RocketChat.statistics.get = function _getStatistics() {
  const statistics = {}; // Setup Wizard

  statistics.wizard = {};
  wizardFields.forEach(field => {
    const record = RocketChat.models.Settings.findOne(field);

    if (record) {
      const wizardField = field.replace(/_/g, '').replace(field[0], field[0].toLowerCase());
      statistics.wizard[wizardField] = record.value;
    }
  }); // Version

  statistics.uniqueId = RocketChat.settings.get('uniqueID');

  if (RocketChat.models.Settings.findOne('uniqueID')) {
    statistics.installedAt = RocketChat.models.Settings.findOne('uniqueID').createdAt;
  }

  if (RocketChat.Info) {
    statistics.version = RocketChat.Info.version;
    statistics.tag = RocketChat.Info.tag;
    statistics.branch = RocketChat.Info.branch;
  } // User statistics


  statistics.totalUsers = Meteor.users.find().count();
  statistics.activeUsers = Meteor.users.find({
    active: true
  }).count();
  statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers;
  statistics.onlineUsers = Meteor.users.find({
    statusConnection: 'online'
  }).count();
  statistics.awayUsers = Meteor.users.find({
    statusConnection: 'away'
  }).count();
  statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers; // Room statistics

  statistics.totalRooms = RocketChat.models.Rooms.find().count();
  statistics.totalChannels = RocketChat.models.Rooms.findByType('c').count();
  statistics.totalPrivateGroups = RocketChat.models.Rooms.findByType('p').count();
  statistics.totalDirect = RocketChat.models.Rooms.findByType('d').count();
  statistics.totalLivechat = RocketChat.models.Rooms.findByType('l').count(); // Message statistics

  statistics.totalMessages = RocketChat.models.Messages.find().count();
  statistics.totalChannelMessages = _.reduce(RocketChat.models.Rooms.findByType('c', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countChannelMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalPrivateGroupMessages = _.reduce(RocketChat.models.Rooms.findByType('p', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countPrivateGroupMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalDirectMessages = _.reduce(RocketChat.models.Rooms.findByType('d', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countDirectMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalLivechatMessages = _.reduce(RocketChat.models.Rooms.findByType('l', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countLivechatMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.lastLogin = RocketChat.models.Users.getLastLogin();
  statistics.lastMessageSentAt = RocketChat.models.Messages.getLastTimestamp();
  statistics.lastSeenSubscription = RocketChat.models.Subscriptions.getLastSeen();
  statistics.os = {
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus()
  };
  statistics.process = {
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime()
  };
  statistics.deploy = {
    method: process.env.DEPLOY_METHOD || 'tar',
    platform: process.env.DEPLOY_PLATFORM || 'selfinstall'
  };
  statistics.migration = RocketChat.Migrations._getControl();
  statistics.instanceCount = InstanceStatus.getCollection().find({
    _updatedAt: {
      $gt: new Date(Date.now() - process.uptime() * 1000 - 2000)
    }
  }).count();

  if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry && RocketChat.settings.get('Force_Disable_OpLog_For_Cache') !== true) {
    statistics.oplogEnabled = true;
  }

  return statistics;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"save.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/functions/save.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.statistics.save = function () {
  const statistics = RocketChat.statistics.get();
  statistics.createdAt = new Date();
  RocketChat.models.Statistics.insert(statistics);
  return statistics;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"getStatistics.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/methods/getStatistics.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  getStatistics(refresh) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getStatistics'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getStatistics'
      });
    }

    if (refresh) {
      return RocketChat.statistics.save();
    } else {
      return RocketChat.models.Statistics.findLast();
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:statistics/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:statistics/server/models/Statistics.js");
require("/node_modules/meteor/rocketchat:statistics/server/functions/get.js");
require("/node_modules/meteor/rocketchat:statistics/server/functions/save.js");
require("/node_modules/meteor/rocketchat:statistics/server/methods/getStatistics.js");

/* Exports */
Package._define("rocketchat:statistics");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_statistics.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzdGF0aXN0aWNzL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnN0YXRpc3RpY3Mvc2VydmVyL21vZGVscy9TdGF0aXN0aWNzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnN0YXRpc3RpY3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RhdGlzdGljcy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RhdGlzdGljcy9zZXJ2ZXIvbWV0aG9kcy9nZXRTdGF0aXN0aWNzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzdGF0aXN0aWNzIiwibW9kZWxzIiwiU3RhdGlzdGljcyIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJ0cnlFbnN1cmVJbmRleCIsImZpbmRPbmVCeUlkIiwiX2lkIiwib3B0aW9ucyIsInF1ZXJ5IiwiZmluZE9uZSIsImZpbmRMYXN0Iiwic29ydCIsImNyZWF0ZWRBdCIsImxpbWl0IiwicmVjb3JkcyIsImZpbmQiLCJmZXRjaCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIm9zIiwid2l6YXJkRmllbGRzIiwiZ2V0IiwiX2dldFN0YXRpc3RpY3MiLCJ3aXphcmQiLCJmb3JFYWNoIiwiZmllbGQiLCJyZWNvcmQiLCJTZXR0aW5ncyIsIndpemFyZEZpZWxkIiwicmVwbGFjZSIsInRvTG93ZXJDYXNlIiwidmFsdWUiLCJ1bmlxdWVJZCIsInNldHRpbmdzIiwiaW5zdGFsbGVkQXQiLCJJbmZvIiwidmVyc2lvbiIsInRhZyIsImJyYW5jaCIsInRvdGFsVXNlcnMiLCJNZXRlb3IiLCJ1c2VycyIsImNvdW50IiwiYWN0aXZlVXNlcnMiLCJhY3RpdmUiLCJub25BY3RpdmVVc2VycyIsIm9ubGluZVVzZXJzIiwic3RhdHVzQ29ubmVjdGlvbiIsImF3YXlVc2VycyIsIm9mZmxpbmVVc2VycyIsInRvdGFsUm9vbXMiLCJSb29tcyIsInRvdGFsQ2hhbm5lbHMiLCJmaW5kQnlUeXBlIiwidG90YWxQcml2YXRlR3JvdXBzIiwidG90YWxEaXJlY3QiLCJ0b3RhbExpdmVjaGF0IiwidG90YWxNZXNzYWdlcyIsIk1lc3NhZ2VzIiwidG90YWxDaGFubmVsTWVzc2FnZXMiLCJyZWR1Y2UiLCJmaWVsZHMiLCJfY291bnRDaGFubmVsTWVzc2FnZXMiLCJudW0iLCJyb29tIiwibXNncyIsInRvdGFsUHJpdmF0ZUdyb3VwTWVzc2FnZXMiLCJfY291bnRQcml2YXRlR3JvdXBNZXNzYWdlcyIsInRvdGFsRGlyZWN0TWVzc2FnZXMiLCJfY291bnREaXJlY3RNZXNzYWdlcyIsInRvdGFsTGl2ZWNoYXRNZXNzYWdlcyIsIl9jb3VudExpdmVjaGF0TWVzc2FnZXMiLCJsYXN0TG9naW4iLCJVc2VycyIsImdldExhc3RMb2dpbiIsImxhc3RNZXNzYWdlU2VudEF0IiwiZ2V0TGFzdFRpbWVzdGFtcCIsImxhc3RTZWVuU3Vic2NyaXB0aW9uIiwiU3Vic2NyaXB0aW9ucyIsImdldExhc3RTZWVuIiwidHlwZSIsInBsYXRmb3JtIiwiYXJjaCIsInJlbGVhc2UiLCJ1cHRpbWUiLCJsb2FkYXZnIiwidG90YWxtZW0iLCJmcmVlbWVtIiwiY3B1cyIsInByb2Nlc3MiLCJub2RlVmVyc2lvbiIsInBpZCIsImRlcGxveSIsIm1ldGhvZCIsImVudiIsIkRFUExPWV9NRVRIT0QiLCJERVBMT1lfUExBVEZPUk0iLCJtaWdyYXRpb24iLCJNaWdyYXRpb25zIiwiX2dldENvbnRyb2wiLCJpbnN0YW5jZUNvdW50IiwiSW5zdGFuY2VTdGF0dXMiLCJnZXRDb2xsZWN0aW9uIiwiX3VwZGF0ZWRBdCIsIiRndCIsIkRhdGUiLCJub3ciLCJNb25nb0ludGVybmFscyIsImRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyIiwibW9uZ28iLCJfb3Bsb2dIYW5kbGUiLCJvbk9wbG9nRW50cnkiLCJvcGxvZ0VuYWJsZWQiLCJzYXZlIiwiaW5zZXJ0IiwibWV0aG9kcyIsImdldFN0YXRpc3RpY3MiLCJyZWZyZXNoIiwidXNlcklkIiwiRXJyb3IiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxVQUFYLEdBQXdCLEVBQXhCLEM7Ozs7Ozs7Ozs7O0FDQUFELFdBQVdFLE1BQVgsQ0FBa0JDLFVBQWxCLEdBQStCLElBQUksY0FBY0gsV0FBV0UsTUFBWCxDQUFrQkUsS0FBaEMsQ0FBc0M7QUFDeEVDLGdCQUFjO0FBQ2IsVUFBTSxZQUFOO0FBRUEsU0FBS0MsY0FBTCxDQUFvQjtBQUFFLG1CQUFhO0FBQWYsS0FBcEI7QUFDQSxHQUx1RSxDQU94RTs7O0FBQ0FDLGNBQVlDLEdBQVosRUFBaUJDLE9BQWpCLEVBQTBCO0FBQ3pCLFVBQU1DLFFBQVE7QUFBRUY7QUFBRixLQUFkO0FBQ0EsV0FBTyxLQUFLRyxPQUFMLENBQWFELEtBQWIsRUFBb0JELE9BQXBCLENBQVA7QUFDQTs7QUFFREcsYUFBVztBQUNWLFVBQU1ILFVBQVU7QUFDZkksWUFBTTtBQUNMQyxtQkFBVyxDQUFDO0FBRFAsT0FEUztBQUlmQyxhQUFPO0FBSlEsS0FBaEI7QUFNQSxVQUFNQyxVQUFVLEtBQUtDLElBQUwsQ0FBVSxFQUFWLEVBQWNSLE9BQWQsRUFBdUJTLEtBQXZCLEVBQWhCO0FBQ0EsV0FBT0YsV0FBV0EsUUFBUSxDQUFSLENBQWxCO0FBQ0E7O0FBdEJ1RSxDQUExQyxFQUEvQixDOzs7Ozs7Ozs7OztBQ0FBLElBQUlHLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFB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aWNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zdGF0aXN0aWNzID0ge307XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5TdGF0aXN0aWNzID0gbmV3IGNsYXNzIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignc3RhdGlzdGljcycpO1xuXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdjcmVhdGVkQXQnOiAxIH0pO1xuXHR9XG5cblx0Ly8gRklORCBPTkVcblx0ZmluZE9uZUJ5SWQoX2lkLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZExhc3QoKSB7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0Y3JlYXRlZEF0OiAtMVxuXHRcdFx0fSxcblx0XHRcdGxpbWl0OiAxXG5cdFx0fTtcblx0XHRjb25zdCByZWNvcmRzID0gdGhpcy5maW5kKHt9LCBvcHRpb25zKS5mZXRjaCgpO1xuXHRcdHJldHVybiByZWNvcmRzICYmIHJlY29yZHNbMF07XG5cdH1cbn07XG4iLCIvKiBnbG9iYWwgSW5zdGFuY2VTdGF0dXMsIE1vbmdvSW50ZXJuYWxzICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5cbmNvbnN0IHdpemFyZEZpZWxkcyA9IFtcblx0J09yZ2FuaXphdGlvbl9UeXBlJyxcblx0J09yZ2FuaXphdGlvbl9OYW1lJyxcblx0J0luZHVzdHJ5Jyxcblx0J1NpemUnLFxuXHQnQ291bnRyeScsXG5cdCdXZWJzaXRlJyxcblx0J1NpdGVfTmFtZScsXG5cdCdMYW5ndWFnZScsXG5cdCdTZXJ2ZXJfVHlwZScsXG5cdCdBbGxvd19NYXJrZXRpbmdfRW1haWxzJ1xuXTtcblxuUm9ja2V0Q2hhdC5zdGF0aXN0aWNzLmdldCA9IGZ1bmN0aW9uIF9nZXRTdGF0aXN0aWNzKCkge1xuXHRjb25zdCBzdGF0aXN0aWNzID0ge307XG5cblx0Ly8gU2V0dXAgV2l6YXJkXG5cdHN0YXRpc3RpY3Mud2l6YXJkID0ge307XG5cdHdpemFyZEZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcblx0XHRjb25zdCByZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKGZpZWxkKTtcblx0XHRpZiAocmVjb3JkKSB7XG5cdFx0XHRjb25zdCB3aXphcmRGaWVsZCA9IGZpZWxkLnJlcGxhY2UoL18vZywgJycpLnJlcGxhY2UoZmllbGRbMF0sIGZpZWxkWzBdLnRvTG93ZXJDYXNlKCkpO1xuXHRcdFx0c3RhdGlzdGljcy53aXphcmRbd2l6YXJkRmllbGRdID0gcmVjb3JkLnZhbHVlO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gVmVyc2lvblxuXHRzdGF0aXN0aWNzLnVuaXF1ZUlkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJyk7XG5cdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKCd1bmlxdWVJRCcpKSB7XG5cdFx0c3RhdGlzdGljcy5pbnN0YWxsZWRBdCA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmUoJ3VuaXF1ZUlEJykuY3JlYXRlZEF0O1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuSW5mbykge1xuXHRcdHN0YXRpc3RpY3MudmVyc2lvbiA9IFJvY2tldENoYXQuSW5mby52ZXJzaW9uO1xuXHRcdHN0YXRpc3RpY3MudGFnID0gUm9ja2V0Q2hhdC5JbmZvLnRhZztcblx0XHRzdGF0aXN0aWNzLmJyYW5jaCA9IFJvY2tldENoYXQuSW5mby5icmFuY2g7XG5cdH1cblxuXHQvLyBVc2VyIHN0YXRpc3RpY3Ncblx0c3RhdGlzdGljcy50b3RhbFVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoKS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLmFjdGl2ZVVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoeyBhY3RpdmU6IHRydWUgfSkuY291bnQoKTtcblx0c3RhdGlzdGljcy5ub25BY3RpdmVVc2VycyA9IHN0YXRpc3RpY3MudG90YWxVc2VycyAtIHN0YXRpc3RpY3MuYWN0aXZlVXNlcnM7XG5cdHN0YXRpc3RpY3Mub25saW5lVXNlcnMgPSBNZXRlb3IudXNlcnMuZmluZCh7IHN0YXR1c0Nvbm5lY3Rpb246ICdvbmxpbmUnIH0pLmNvdW50KCk7XG5cdHN0YXRpc3RpY3MuYXdheVVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoeyBzdGF0dXNDb25uZWN0aW9uOiAnYXdheScgfSkuY291bnQoKTtcblx0c3RhdGlzdGljcy5vZmZsaW5lVXNlcnMgPSBzdGF0aXN0aWNzLnRvdGFsVXNlcnMgLSBzdGF0aXN0aWNzLm9ubGluZVVzZXJzIC0gc3RhdGlzdGljcy5hd2F5VXNlcnM7XG5cblx0Ly8gUm9vbSBzdGF0aXN0aWNzXG5cdHN0YXRpc3RpY3MudG90YWxSb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQoKS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLnRvdGFsQ2hhbm5lbHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdjJykuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RhbFByaXZhdGVHcm91cHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdwJykuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RhbERpcmVjdCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2QnKS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLnRvdGFsTGl2ZWNoYXQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdsJykuY291bnQoKTtcblxuXHQvLyBNZXNzYWdlIHN0YXRpc3RpY3Ncblx0c3RhdGlzdGljcy50b3RhbE1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZCgpLmNvdW50KCk7XG5cdHN0YXRpc3RpY3MudG90YWxDaGFubmVsTWVzc2FnZXMgPSBfLnJlZHVjZShSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdjJywgeyBmaWVsZHM6IHsgJ21zZ3MnOiAxIH19KS5mZXRjaCgpLCBmdW5jdGlvbiBfY291bnRDaGFubmVsTWVzc2FnZXMobnVtLCByb29tKSB7IHJldHVybiBudW0gKyByb29tLm1zZ3M7IH0sIDApO1xuXHRzdGF0aXN0aWNzLnRvdGFsUHJpdmF0ZUdyb3VwTWVzc2FnZXMgPSBfLnJlZHVjZShSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdwJywgeyBmaWVsZHM6IHsgJ21zZ3MnOiAxIH19KS5mZXRjaCgpLCBmdW5jdGlvbiBfY291bnRQcml2YXRlR3JvdXBNZXNzYWdlcyhudW0sIHJvb20pIHsgcmV0dXJuIG51bSArIHJvb20ubXNnczsgfSwgMCk7XG5cdHN0YXRpc3RpY3MudG90YWxEaXJlY3RNZXNzYWdlcyA9IF8ucmVkdWNlKFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2QnLCB7IGZpZWxkczogeyAnbXNncyc6IDEgfX0pLmZldGNoKCksIGZ1bmN0aW9uIF9jb3VudERpcmVjdE1lc3NhZ2VzKG51bSwgcm9vbSkgeyByZXR1cm4gbnVtICsgcm9vbS5tc2dzOyB9LCAwKTtcblx0c3RhdGlzdGljcy50b3RhbExpdmVjaGF0TWVzc2FnZXMgPSBfLnJlZHVjZShSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdsJywgeyBmaWVsZHM6IHsgJ21zZ3MnOiAxIH19KS5mZXRjaCgpLCBmdW5jdGlvbiBfY291bnRMaXZlY2hhdE1lc3NhZ2VzKG51bSwgcm9vbSkgeyByZXR1cm4gbnVtICsgcm9vbS5tc2dzOyB9LCAwKTtcblxuXHRzdGF0aXN0aWNzLmxhc3RMb2dpbiA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldExhc3RMb2dpbigpO1xuXHRzdGF0aXN0aWNzLmxhc3RNZXNzYWdlU2VudEF0ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZ2V0TGFzdFRpbWVzdGFtcCgpO1xuXHRzdGF0aXN0aWNzLmxhc3RTZWVuU3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5nZXRMYXN0U2VlbigpO1xuXG5cdHN0YXRpc3RpY3Mub3MgPSB7XG5cdFx0dHlwZTogb3MudHlwZSgpLFxuXHRcdHBsYXRmb3JtOiBvcy5wbGF0Zm9ybSgpLFxuXHRcdGFyY2g6IG9zLmFyY2goKSxcblx0XHRyZWxlYXNlOiBvcy5yZWxlYXNlKCksXG5cdFx0dXB0aW1lOiBvcy51cHRpbWUoKSxcblx0XHRsb2FkYXZnOiBvcy5sb2FkYXZnKCksXG5cdFx0dG90YWxtZW06IG9zLnRvdGFsbWVtKCksXG5cdFx0ZnJlZW1lbTogb3MuZnJlZW1lbSgpLFxuXHRcdGNwdXM6IG9zLmNwdXMoKVxuXHR9O1xuXG5cdHN0YXRpc3RpY3MucHJvY2VzcyA9IHtcblx0XHRub2RlVmVyc2lvbjogcHJvY2Vzcy52ZXJzaW9uLFxuXHRcdHBpZDogcHJvY2Vzcy5waWQsXG5cdFx0dXB0aW1lOiBwcm9jZXNzLnVwdGltZSgpXG5cdH07XG5cblx0c3RhdGlzdGljcy5kZXBsb3kgPSB7XG5cdFx0bWV0aG9kOiBwcm9jZXNzLmVudi5ERVBMT1lfTUVUSE9EIHx8ICd0YXInLFxuXHRcdHBsYXRmb3JtOiBwcm9jZXNzLmVudi5ERVBMT1lfUExBVEZPUk0gfHwgJ3NlbGZpbnN0YWxsJ1xuXHR9O1xuXG5cdHN0YXRpc3RpY3MubWlncmF0aW9uID0gUm9ja2V0Q2hhdC5NaWdyYXRpb25zLl9nZXRDb250cm9sKCk7XG5cdHN0YXRpc3RpY3MuaW5zdGFuY2VDb3VudCA9IEluc3RhbmNlU3RhdHVzLmdldENvbGxlY3Rpb24oKS5maW5kKHsgX3VwZGF0ZWRBdDogeyAkZ3Q6IG5ldyBEYXRlKERhdGUubm93KCkgLSBwcm9jZXNzLnVwdGltZSgpICogMTAwMCAtIDIwMDApIH19KS5jb3VudCgpO1xuXG5cdGlmIChNb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLl9vcGxvZ0hhbmRsZSAmJiBNb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLl9vcGxvZ0hhbmRsZS5vbk9wbG9nRW50cnkgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZvcmNlX0Rpc2FibGVfT3BMb2dfRm9yX0NhY2hlJykgIT09IHRydWUpIHtcblx0XHRzdGF0aXN0aWNzLm9wbG9nRW5hYmxlZCA9IHRydWU7XG5cdH1cblxuXHRyZXR1cm4gc3RhdGlzdGljcztcbn07XG4iLCJSb2NrZXRDaGF0LnN0YXRpc3RpY3Muc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRjb25zdCBzdGF0aXN0aWNzID0gUm9ja2V0Q2hhdC5zdGF0aXN0aWNzLmdldCgpO1xuXHRzdGF0aXN0aWNzLmNyZWF0ZWRBdCA9IG5ldyBEYXRlO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5TdGF0aXN0aWNzLmluc2VydChzdGF0aXN0aWNzKTtcblx0cmV0dXJuIHN0YXRpc3RpY3M7XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRTdGF0aXN0aWNzKHJlZnJlc2gpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnZ2V0U3RhdGlzdGljcycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LXN0YXRpc3RpY3MnKSAhPT0gdHJ1ZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2dldFN0YXRpc3RpY3MnIH0pO1xuXHRcdH1cblxuXHRcdGlmIChyZWZyZXNoKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zdGF0aXN0aWNzLnNhdmUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuZmluZExhc3QoKTtcblx0XHR9XG5cdH1cbn0pO1xuIl19
