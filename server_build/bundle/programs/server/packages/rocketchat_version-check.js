(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var SyncedCron = Package['percolate:synced-cron'].SyncedCron;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:version-check":{"server":{"server.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/rocketchat_version-check/server/server.js                                               //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let checkVersionUpdate;
module.watch(require("./functions/checkVersionUpdate"), {
  default(v) {
    checkVersionUpdate = v;
  }

}, 0);
module.watch(require("./methods/banner_dismiss"));
module.watch(require("./addSettings"));
const jobName = 'version_check';

if (SyncedCron.nextScheduledAtDate(jobName)) {
  SyncedCron.remove(jobName);
}

SyncedCron.add({
  name: jobName,
  schedule: parser => parser.text('at 2:00 am'),

  job() {
    checkVersionUpdate();
  }

});
SyncedCron.start();
Meteor.startup(() => {
  checkVersionUpdate();
}); // Send email to admins
// Save latest alert
// ENV var to disable the check for update for our cloud
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"addSettings.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/rocketchat_version-check/server/addSettings.js                                          //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
RocketChat.settings.addGroup('General', function () {
  this.section('Update', function () {
    this.add('Update_LatestAvailableVersion', '0.0.0', {
      type: 'string',
      readonly: true
    });
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"logger.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/rocketchat_version-check/server/logger.js                                               //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
module.exportDefault(new Logger('VersionCheck'));
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"functions":{"checkVersionUpdate.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/rocketchat_version-check/server/functions/checkVersionUpdate.js                         //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let semver;
module.watch(require("semver"), {
  default(v) {
    semver = v;
  }

}, 0);
let getNewUpdates;
module.watch(require("./getNewUpdates"), {
  default(v) {
    getNewUpdates = v;
  }

}, 1);
let logger;
module.watch(require("../logger"), {
  default(v) {
    logger = v;
  }

}, 2);
module.exportDefault(() => {
  logger.info('Checking for version updates');
  const {
    versions
  } = getNewUpdates();
  const update = {
    exists: false,
    lastestVersion: null,
    security: false
  };
  const lastCheckedVersion = RocketChat.settings.get('Update_LatestAvailableVersion');
  versions.forEach(version => {
    if (semver.lte(version.version, lastCheckedVersion)) {
      return;
    }

    if (semver.lte(version.version, RocketChat.Info.version)) {
      return;
    }

    update.exists = true;
    update.lastestVersion = version;

    if (version.security === true) {
      update.security = true;
    }
  });

  if (update.exists) {
    RocketChat.settings.updateById('Update_LatestAvailableVersion', update.lastestVersion.version);
    RocketChat.models.Roles.findUsersInRole('admin').forEach(adminUser => {
      const msg = {
        msg: `*${TAPi18n.__('Update_your_RocketChat', adminUser.language)}*\n${TAPi18n.__('New_version_available_(s)', update.lastestVersion.version, adminUser.language)}\n${update.lastestVersion.infoUrl}`,
        rid: [adminUser._id, 'rocket.cat'].sort().join('')
      };
      Meteor.runAsUser('rocket.cat', () => Meteor.call('sendMessage', msg));
      RocketChat.models.Users.addBannerById(adminUser._id, {
        id: 'versionUpdate',
        priority: 10,
        title: 'Update_your_RocketChat',
        text: 'New_version_available_(s)',
        textArguments: [update.lastestVersion.version],
        link: update.lastestVersion.infoUrl
      });
    });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

},"getNewUpdates.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/rocketchat_version-check/server/functions/getNewUpdates.js                              //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
let os;
module.watch(require("os"), {
  default(v) {
    os = v;
  }

}, 0);
let HTTP;
module.watch(require("meteor/http"), {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
module.exportDefault(() => {
  try {
    const uniqueID = RocketChat.models.Settings.findOne('uniqueID');

    const _oplogHandle = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle;

    const oplogEnabled = _oplogHandle && _oplogHandle.onOplogEntry && RocketChat.settings.get('Force_Disable_OpLog_For_Cache') !== true;
    const data = {
      uniqueId: uniqueID.value,
      installedAt: uniqueID.createdAt,
      version: RocketChat.Info.version,
      oplogEnabled,
      osType: os.type(),
      osPlatform: os.platform(),
      osArch: os.arch(),
      osRelease: os.release(),
      nodeVersion: process.version,
      deployMethod: process.env.DEPLOY_METHOD || 'tar',
      deployPlatform: process.env.DEPLOY_PLATFORM || 'selfinstall'
    };
    const result = HTTP.get('https://releases.rocket.chat/updates/check', {
      params: data
    });
    return result.data;
  } catch (error) {
    // There's no need to log this error
    // as it's pointless and the user
    // can't do anything about it anyways
    return {
      versions: [],
      alerts: []
    };
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"banner_dismiss.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/rocketchat_version-check/server/methods/banner_dismiss.js                               //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
Meteor.methods({
  'banner/dismiss'({
    id
  }) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'banner/dismiss'
      });
    }

    RocketChat.models.Users.removeBannerById(this.userId, {
      id
    });
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:version-check/server/server.js");

/* Exports */
Package._define("rocketchat:version-check", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_version-check.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp2ZXJzaW9uLWNoZWNrL3NlcnZlci9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dmVyc2lvbi1jaGVjay9zZXJ2ZXIvYWRkU2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dmVyc2lvbi1jaGVjay9zZXJ2ZXIvbG9nZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnZlcnNpb24tY2hlY2svc2VydmVyL2Z1bmN0aW9ucy9jaGVja1ZlcnNpb25VcGRhdGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dmVyc2lvbi1jaGVjay9zZXJ2ZXIvZnVuY3Rpb25zL2dldE5ld1VwZGF0ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dmVyc2lvbi1jaGVjay9zZXJ2ZXIvbWV0aG9kcy9iYW5uZXJfZGlzbWlzcy5qcyJdLCJuYW1lcyI6WyJjaGVja1ZlcnNpb25VcGRhdGUiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsImpvYk5hbWUiLCJTeW5jZWRDcm9uIiwibmV4dFNjaGVkdWxlZEF0RGF0ZSIsInJlbW92ZSIsImFkZCIsIm5hbWUiLCJzY2hlZHVsZSIsInBhcnNlciIsInRleHQiLCJqb2IiLCJzdGFydCIsIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsInNlY3Rpb24iLCJ0eXBlIiwicmVhZG9ubHkiLCJleHBvcnREZWZhdWx0IiwiTG9nZ2VyIiwic2VtdmVyIiwiZ2V0TmV3VXBkYXRlcyIsImxvZ2dlciIsImluZm8iLCJ2ZXJzaW9ucyIsInVwZGF0ZSIsImV4aXN0cyIsImxhc3Rlc3RWZXJzaW9uIiwic2VjdXJpdHkiLCJsYXN0Q2hlY2tlZFZlcnNpb24iLCJnZXQiLCJmb3JFYWNoIiwidmVyc2lvbiIsImx0ZSIsIkluZm8iLCJ1cGRhdGVCeUlkIiwibW9kZWxzIiwiUm9sZXMiLCJmaW5kVXNlcnNJblJvbGUiLCJhZG1pblVzZXIiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJsYW5ndWFnZSIsImluZm9VcmwiLCJyaWQiLCJfaWQiLCJzb3J0Iiwiam9pbiIsInJ1bkFzVXNlciIsImNhbGwiLCJVc2VycyIsImFkZEJhbm5lckJ5SWQiLCJpZCIsInByaW9yaXR5IiwidGl0bGUiLCJ0ZXh0QXJndW1lbnRzIiwibGluayIsIm9zIiwiSFRUUCIsInVuaXF1ZUlEIiwiU2V0dGluZ3MiLCJmaW5kT25lIiwiX29wbG9nSGFuZGxlIiwiTW9uZ29JbnRlcm5hbHMiLCJkZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlciIsIm1vbmdvIiwib3Bsb2dFbmFibGVkIiwib25PcGxvZ0VudHJ5IiwiZGF0YSIsInVuaXF1ZUlkIiwidmFsdWUiLCJpbnN0YWxsZWRBdCIsImNyZWF0ZWRBdCIsIm9zVHlwZSIsIm9zUGxhdGZvcm0iLCJwbGF0Zm9ybSIsIm9zQXJjaCIsImFyY2giLCJvc1JlbGVhc2UiLCJyZWxlYXNlIiwibm9kZVZlcnNpb24iLCJwcm9jZXNzIiwiZGVwbG95TWV0aG9kIiwiZW52IiwiREVQTE9ZX01FVEhPRCIsImRlcGxveVBsYXRmb3JtIiwiREVQTE9ZX1BMQVRGT1JNIiwicmVzdWx0IiwicGFyYW1zIiwiZXJyb3IiLCJhbGVydHMiLCJtZXRob2RzIiwidXNlcklkIiwiRXJyb3IiLCJtZXRob2QiLCJyZW1vdmVCYW5uZXJCeUlkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsa0JBQUo7QUFBdUJDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxnQ0FBUixDQUFiLEVBQXVEO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCx5QkFBbUJLLENBQW5CO0FBQXFCOztBQUFqQyxDQUF2RCxFQUEwRixDQUExRjtB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QUFJQTtBQUNELENBeENELEU7Ozs7Ozs7Ozs7O0FDQUFqRixPQUFPa0YsT0FBUCxDQUFlO0FBQ2QsbUJBQWlCO0FBQUV2QztBQUFGLEdBQWpCLEVBQXlCO0FBQ3hCLFFBQUksQ0FBQzNDLE9BQU9tRixNQUFQLEVBQUwsRUFBc0I7QUFDckIsWUFBTSxJQUFJbkYsT0FBT29GLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQUVDLGdCQUFRO0FBQVYsT0FBdkQsQ0FBTjtBQUNBOztBQUVEbkYsZUFBV3dCLE1BQVgsQ0FBa0JlLEtBQWxCLENBQXdCNkMsZ0JBQXhCLENBQXlDLEtBQUtILE1BQTlDLEVBQXNEO0FBQ3JEeEM7QUFEcUQsS0FBdEQ7QUFHQTs7QUFUYSxDQUFmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfdmVyc2lvbi1jaGVjay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgU3luY2VkQ3JvbiAqL1xuXG5pbXBvcnQgY2hlY2tWZXJzaW9uVXBkYXRlIGZyb20gJy4vZnVuY3Rpb25zL2NoZWNrVmVyc2lvblVwZGF0ZSc7XG5pbXBvcnQgJy4vbWV0aG9kcy9iYW5uZXJfZGlzbWlzcyc7XG5pbXBvcnQgJy4vYWRkU2V0dGluZ3MnO1xuXG5jb25zdCBqb2JOYW1lID0gJ3ZlcnNpb25fY2hlY2snO1xuXG5pZiAoU3luY2VkQ3Jvbi5uZXh0U2NoZWR1bGVkQXREYXRlKGpvYk5hbWUpKSB7XG5cdFN5bmNlZENyb24ucmVtb3ZlKGpvYk5hbWUpO1xufVxuXG5TeW5jZWRDcm9uLmFkZCh7XG5cdG5hbWU6IGpvYk5hbWUsXG5cdHNjaGVkdWxlOiBwYXJzZXIgPT4gcGFyc2VyLnRleHQoJ2F0IDI6MDAgYW0nKSxcblx0am9iKCkge1xuXHRcdGNoZWNrVmVyc2lvblVwZGF0ZSgpO1xuXHR9XG59KTtcblxuU3luY2VkQ3Jvbi5zdGFydCgpO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdGNoZWNrVmVyc2lvblVwZGF0ZSgpO1xufSk7XG5cbi8vIFNlbmQgZW1haWwgdG8gYWRtaW5zXG4vLyBTYXZlIGxhdGVzdCBhbGVydFxuLy8gRU5WIHZhciB0byBkaXNhYmxlIHRoZSBjaGVjayBmb3IgdXBkYXRlIGZvciBvdXIgY2xvdWRcbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0dlbmVyYWwnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5zZWN0aW9uKCdVcGRhdGUnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnVXBkYXRlX0xhdGVzdEF2YWlsYWJsZVZlcnNpb24nLCAnMC4wLjAnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHJlYWRvbmx5OiB0cnVlXG5cdFx0fSk7XG5cdH0pO1xufSk7XG4iLCJleHBvcnQgZGVmYXVsdCBuZXcgTG9nZ2VyKCdWZXJzaW9uQ2hlY2snKTtcbiIsImltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCBnZXROZXdVcGRhdGVzIGZyb20gJy4vZ2V0TmV3VXBkYXRlcyc7XG5pbXBvcnQgbG9nZ2VyIGZyb20gJy4uL2xvZ2dlcic7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcblx0bG9nZ2VyLmluZm8oJ0NoZWNraW5nIGZvciB2ZXJzaW9uIHVwZGF0ZXMnKTtcblxuXHRjb25zdCB7IHZlcnNpb25zIH0gPSBnZXROZXdVcGRhdGVzKCk7XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdGV4aXN0czogZmFsc2UsXG5cdFx0bGFzdGVzdFZlcnNpb246IG51bGwsXG5cdFx0c2VjdXJpdHk6IGZhbHNlXG5cdH07XG5cblx0Y29uc3QgbGFzdENoZWNrZWRWZXJzaW9uID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VwZGF0ZV9MYXRlc3RBdmFpbGFibGVWZXJzaW9uJyk7XG5cdHZlcnNpb25zLmZvckVhY2godmVyc2lvbiA9PiB7XG5cdFx0aWYgKHNlbXZlci5sdGUodmVyc2lvbi52ZXJzaW9uLCBsYXN0Q2hlY2tlZFZlcnNpb24pKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHNlbXZlci5sdGUodmVyc2lvbi52ZXJzaW9uLCBSb2NrZXRDaGF0LkluZm8udmVyc2lvbikpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR1cGRhdGUuZXhpc3RzID0gdHJ1ZTtcblx0XHR1cGRhdGUubGFzdGVzdFZlcnNpb24gPSB2ZXJzaW9uO1xuXG5cdFx0aWYgKHZlcnNpb24uc2VjdXJpdHkgPT09IHRydWUpIHtcblx0XHRcdHVwZGF0ZS5zZWN1cml0eSA9IHRydWU7XG5cdFx0fVxuXHR9KTtcblxuXHRpZiAodXBkYXRlLmV4aXN0cykge1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnVXBkYXRlX0xhdGVzdEF2YWlsYWJsZVZlcnNpb24nLCB1cGRhdGUubGFzdGVzdFZlcnNpb24udmVyc2lvbik7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZFVzZXJzSW5Sb2xlKCdhZG1pbicpLmZvckVhY2goYWRtaW5Vc2VyID0+IHtcblx0XHRcdGNvbnN0IG1zZyA9IHtcblx0XHRcdFx0bXNnOiBgKiR7IFRBUGkxOG4uX18oJ1VwZGF0ZV95b3VyX1JvY2tldENoYXQnLCBhZG1pblVzZXIubGFuZ3VhZ2UpIH0qXFxuJHsgVEFQaTE4bi5fXygnTmV3X3ZlcnNpb25fYXZhaWxhYmxlXyhzKScsIHVwZGF0ZS5sYXN0ZXN0VmVyc2lvbi52ZXJzaW9uLCBhZG1pblVzZXIubGFuZ3VhZ2UpIH1cXG4keyB1cGRhdGUubGFzdGVzdFZlcnNpb24uaW5mb1VybCB9YCxcblx0XHRcdFx0cmlkOiBbYWRtaW5Vc2VyLl9pZCwgJ3JvY2tldC5jYXQnXS5zb3J0KCkuam9pbignJylcblx0XHRcdH07XG5cblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIoJ3JvY2tldC5jYXQnLCAoKSA9PiBNZXRlb3IuY2FsbCgnc2VuZE1lc3NhZ2UnLCBtc2cpKTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuYWRkQmFubmVyQnlJZChhZG1pblVzZXIuX2lkLCB7XG5cdFx0XHRcdGlkOiAndmVyc2lvblVwZGF0ZScsXG5cdFx0XHRcdHByaW9yaXR5OiAxMCxcblx0XHRcdFx0dGl0bGU6ICdVcGRhdGVfeW91cl9Sb2NrZXRDaGF0Jyxcblx0XHRcdFx0dGV4dDogJ05ld192ZXJzaW9uX2F2YWlsYWJsZV8ocyknLFxuXHRcdFx0XHR0ZXh0QXJndW1lbnRzOiBbdXBkYXRlLmxhc3Rlc3RWZXJzaW9uLnZlcnNpb25dLFxuXHRcdFx0XHRsaW5rOiB1cGRhdGUubGFzdGVzdFZlcnNpb24uaW5mb1VybFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cbn07XG4iLCIvKiBnbG9iYWwgTW9uZ29JbnRlcm5hbHMgKi9cbmltcG9ydCBvcyBmcm9tICdvcyc7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuLy8gaW1wb3J0IGNoZWNrVXBkYXRlIGZyb20gJy4uL2NoZWNrVXBkYXRlJztcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4ge1xuXHR0cnkge1xuXHRcdGNvbnN0IHVuaXF1ZUlEID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZSgndW5pcXVlSUQnKTtcblx0XHRjb25zdCBfb3Bsb2dIYW5kbGUgPSBNb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLl9vcGxvZ0hhbmRsZTtcblx0XHRjb25zdCBvcGxvZ0VuYWJsZWQgPSBfb3Bsb2dIYW5kbGUgJiYgX29wbG9nSGFuZGxlLm9uT3Bsb2dFbnRyeSAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRm9yY2VfRGlzYWJsZV9PcExvZ19Gb3JfQ2FjaGUnKSAhPT0gdHJ1ZTtcblxuXHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHR1bmlxdWVJZDogdW5pcXVlSUQudmFsdWUsXG5cdFx0XHRpbnN0YWxsZWRBdDogdW5pcXVlSUQuY3JlYXRlZEF0LFxuXHRcdFx0dmVyc2lvbjogUm9ja2V0Q2hhdC5JbmZvLnZlcnNpb24sXG5cdFx0XHRvcGxvZ0VuYWJsZWQsXG5cdFx0XHRvc1R5cGU6IG9zLnR5cGUoKSxcblx0XHRcdG9zUGxhdGZvcm06IG9zLnBsYXRmb3JtKCksXG5cdFx0XHRvc0FyY2g6IG9zLmFyY2goKSxcblx0XHRcdG9zUmVsZWFzZTogb3MucmVsZWFzZSgpLFxuXHRcdFx0bm9kZVZlcnNpb246IHByb2Nlc3MudmVyc2lvbixcblx0XHRcdGRlcGxveU1ldGhvZDogcHJvY2Vzcy5lbnYuREVQTE9ZX01FVEhPRCB8fCAndGFyJyxcblx0XHRcdGRlcGxveVBsYXRmb3JtOiBwcm9jZXNzLmVudi5ERVBMT1lfUExBVEZPUk0gfHwgJ3NlbGZpbnN0YWxsJ1xuXHRcdH07XG5cblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmdldCgnaHR0cHM6Ly9yZWxlYXNlcy5yb2NrZXQuY2hhdC91cGRhdGVzL2NoZWNrJywge1xuXHRcdFx0cGFyYW1zOiBkYXRhXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmVzdWx0LmRhdGE7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0Ly8gVGhlcmUncyBubyBuZWVkIHRvIGxvZyB0aGlzIGVycm9yXG5cdFx0Ly8gYXMgaXQncyBwb2ludGxlc3MgYW5kIHRoZSB1c2VyXG5cdFx0Ly8gY2FuJ3QgZG8gYW55dGhpbmcgYWJvdXQgaXQgYW55d2F5c1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHZlcnNpb25zOiBbXSxcblx0XHRcdGFsZXJ0czogW11cblx0XHR9O1xuXHR9XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYmFubmVyL2Rpc21pc3MnKHsgaWQgfSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdiYW5uZXIvZGlzbWlzcycgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMucmVtb3ZlQmFubmVyQnlJZCh0aGlzLnVzZXJJZCwge1xuXHRcdFx0aWRcblx0XHR9KTtcblx0fVxufSk7XG4iXX0=
