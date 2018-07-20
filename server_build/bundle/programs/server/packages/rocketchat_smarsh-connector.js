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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:smarsh-connector":{"lib":{"rocketchat.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_smarsh-connector/lib/rocketchat.js                                                        //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.smarsh = {};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"settings.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_smarsh-connector/server/settings.js                                                       //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
module.watch(require("moment-timezone"));
RocketChat.settings.addGroup('Smarsh', function addSettings() {
  this.add('Smarsh_Enabled', false, {
    type: 'boolean',
    i18nLabel: 'Smarsh_Enabled',
    enableQuery: {
      _id: 'From_Email',
      value: {
        $exists: 1,
        $ne: ''
      }
    }
  });
  this.add('Smarsh_Email', '', {
    type: 'string',
    i18nLabel: 'Smarsh_Email',
    placeholder: 'email@domain.com'
  });
  this.add('Smarsh_MissingEmail_Email', 'no-email@example.com', {
    type: 'string',
    i18nLabel: 'Smarsh_MissingEmail_Email',
    placeholder: 'no-email@example.com'
  });
  const zoneValues = moment.tz.names().map(function _timeZonesToSettings(name) {
    return {
      key: name,
      i18nLabel: name
    };
  });
  this.add('Smarsh_Timezone', 'America/Los_Angeles', {
    type: 'select',
    values: zoneValues
  });
  this.add('Smarsh_Interval', 'every_30_minutes', {
    type: 'select',
    values: [{
      key: 'every_30_seconds',
      i18nLabel: 'every_30_seconds'
    }, {
      key: 'every_30_minutes',
      i18nLabel: 'every_30_minutes'
    }, {
      key: 'every_1_hours',
      i18nLabel: 'every_hour'
    }, {
      key: 'every_6_hours',
      i18nLabel: 'every_six_hours'
    }],
    enableQuery: {
      _id: 'From_Email',
      value: {
        $exists: 1,
        $ne: ''
      }
    }
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"SmarshHistory.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_smarsh-connector/server/models/SmarshHistory.js                                           //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.smarsh.History = new class extends RocketChat.models._Base {
  constructor() {
    super('smarsh_history');
  }

}();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"sendEmail.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_smarsh-connector/server/functions/sendEmail.js                                            //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.smarsh.sendEmail = data => {
  const attachments = [];

  if (data.files.length > 0) {
    _.each(data.files, fileId => {
      const file = RocketChat.models.Uploads.findOneById(fileId);

      if (file.store === 'rocketchat_uploads' || file.store === 'fileSystem') {
        const rs = UploadFS.getStore(file.store).getReadStream(fileId, file);
        attachments.push({
          filename: file.name,
          streamSource: rs
        });
      }
    });
  }

  Email.send({
    to: RocketChat.settings.get('Smarsh_Email'),
    from: RocketChat.settings.get('From_Email'),
    subject: data.subject,
    html: data.body,
    attachments
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"generateEml.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_smarsh-connector/server/functions/generateEml.js                                          //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
module.watch(require("moment-timezone"));
const start = '<table style="width: 100%; border: 1px solid; border-collapse: collapse; table-layout: fixed; margin-top: 10px; font-size: 12px; word-break: break-word;"><tbody>';
const end = '</tbody></table>';
const opentr = '<tr style="border: 1px solid;">';
const closetr = '</tr>';
const open20td = '<td style="border: 1px solid; text-align: center; width: 20%;">';
const open60td = '<td style="border: 1px solid; text-align: left; width: 60%; padding: 0 5px;">';
const closetd = '</td>';

function _getLink(attachment) {
  const url = attachment.title_link.replace(/ /g, '%20');

  if (Meteor.settings.public.sandstorm || url.match(/^(https?:)?\/\//i)) {
    return url;
  } else {
    return Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
  }
}

RocketChat.smarsh.generateEml = () => {
  Meteor.defer(() => {
    const smarshMissingEmail = RocketChat.settings.get('Smarsh_MissingEmail_Email');
    const timeZone = RocketChat.settings.get('Smarsh_Timezone');
    RocketChat.models.Rooms.find().forEach(room => {
      const smarshHistory = RocketChat.smarsh.History.findOne({
        _id: room._id
      });
      const query = {
        rid: room._id
      };

      if (smarshHistory) {
        query.ts = {
          $gt: smarshHistory.lastRan
        };
      }

      const date = new Date();
      const rows = [];
      const data = {
        users: [],
        msgs: 0,
        files: [],
        time: smarshHistory ? moment(date).diff(moment(smarshHistory.lastRan), 'minutes') : moment(date).diff(moment(room.ts), 'minutes'),
        room: room.name ? `#${room.name}` : `Direct Message Between: ${room.usernames.join(' & ')}`
      };
      RocketChat.models.Messages.find(query).forEach(message => {
        rows.push(opentr); //The timestamp

        rows.push(open20td);
        rows.push(moment(message.ts).tz(timeZone).format('YYYY-MM-DD HH-mm-ss z'));
        rows.push(closetd); //The sender

        rows.push(open20td);
        const sender = RocketChat.models.Users.findOne({
          _id: message.u._id
        });

        if (data.users.indexOf(sender._id) === -1) {
          data.users.push(sender._id);
        } //Get the user's email, can be nothing if it is an unconfigured bot account (like rocket.cat)


        if (sender.emails && sender.emails[0] && sender.emails[0].address) {
          rows.push(`${sender.name} &lt;${sender.emails[0].address}&gt;`);
        } else {
          rows.push(`${sender.name} &lt;${smarshMissingEmail}&gt;`);
        }

        rows.push(closetd); //The message

        rows.push(open60td);
        data.msgs++;

        if (message.t) {
          const messageType = RocketChat.MessageTypes.getType(message);

          if (messageType) {
            rows.push(TAPi18n.__(messageType.message, messageType.data ? messageType.data(message) : '', 'en'));
          } else {
            rows.push(`${message.msg} (${message.t})`);
          }
        } else if (message.file) {
          data.files.push(message.file._id);
          rows.push(`${message.attachments[0].title} (${_getLink(message.attachments[0])})`);
        } else if (message.attachments) {
          const attaches = [];

          _.each(message.attachments, function _loopThroughMessageAttachments(a) {
            if (a.image_url) {
              attaches.push(a.image_url);
            } //TODO: Verify other type of attachments which need to be handled that aren't file uploads and image urls
            // } else {
            // 	console.log(a);
            // }

          });

          rows.push(`${message.msg} (${attaches.join(', ')})`);
        } else {
          rows.push(message.msg);
        }

        rows.push(closetd);
        rows.push(closetr);
      });

      if (rows.length !== 0) {
        const result = start + rows.join('') + end;
        RocketChat.smarsh.History.upsert({
          _id: room._id
        }, {
          _id: room._id,
          lastRan: date,
          lastResult: result
        });
        RocketChat.smarsh.sendEmail({
          body: result,
          subject: `Rocket.Chat, ${data.users.length} Users, ${data.msgs} Messages, ${data.files.length} Files, ${data.time} Minutes, in ${data.room}`,
          files: data.files
        });
      }
    });
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_smarsh-connector/server/startup.js                                                        //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const smarshJobName = 'Smarsh EML Connector';

const _addSmarshSyncedCronJob = _.debounce(Meteor.bindEnvironment(function __addSmarshSyncedCronJobDebounced() {
  if (SyncedCron.nextScheduledAtDate(smarshJobName)) {
    SyncedCron.remove(smarshJobName);
  }

  if (RocketChat.settings.get('Smarsh_Enabled') && RocketChat.settings.get('Smarsh_Email') !== '' && RocketChat.settings.get('From_Email') !== '') {
    SyncedCron.add({
      name: smarshJobName,
      schedule: parser => parser.text(RocketChat.settings.get('Smarsh_Interval').replace(/_/g, ' ')),
      job: RocketChat.smarsh.generateEml
    });
  }
}), 500);

Meteor.startup(() => {
  Meteor.defer(() => {
    _addSmarshSyncedCronJob();

    RocketChat.settings.get('Smarsh_Interval', _addSmarshSyncedCronJob);
    RocketChat.settings.get('Smarsh_Enabled', _addSmarshSyncedCronJob);
    RocketChat.settings.get('Smarsh_Email', _addSmarshSyncedCronJob);
    RocketChat.settings.get('From_Email', _addSmarshSyncedCronJob);
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:smarsh-connector/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:smarsh-connector/server/settings.js");
require("/node_modules/meteor/rocketchat:smarsh-connector/server/models/SmarshHistory.js");
require("/node_modules/meteor/rocketchat:smarsh-connector/server/functions/sendEmail.js");
require("/node_modules/meteor/rocketchat:smarsh-connector/server/functions/generateEml.js");
require("/node_modules/meteor/rocketchat:smarsh-connector/server/startup.js");

/* Exports */
Package._define("rocketchat:smarsh-connector");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_smarsh-connector.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbWFyc2gtY29ubmVjdG9yL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNtYXJzaC1jb25uZWN0b3Ivc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNtYXJzaC1jb25uZWN0b3Ivc2VydmVyL21vZGVscy9TbWFyc2hIaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNtYXJzaC1jb25uZWN0b3Ivc2VydmVyL2Z1bmN0aW9ucy9zZW5kRW1haWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c21hcnNoLWNvbm5lY3Rvci9zZXJ2ZXIvZnVuY3Rpb25zL2dlbmVyYXRlRW1sLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNtYXJzaC1jb25uZWN0b3Ivc2VydmVyL3N0YXJ0dXAuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsInNtYXJzaCIsIm1vbWVudCIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZFNldHRpbmdzIiwiYWRkIiwidHlwZSIsImkxOG5MYWJlbCIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwidmFsdWUiLCIkZXhpc3RzIiwiJG5lIiwicGxhY2Vob2xkZXIiLCJ6b25lVmFsdWVzIiwidHoiLCJuYW1lcyIsIm1hcCIsIl90aW1lWm9uZXNUb1NldHRpbmdzIiwibmFtZSIsImtleSIsInZhbHVlcyIsIkhpc3RvcnkiLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwiXyIsInNlbmRFbWFpbCIsImRhdGEiLCJhdHRhY2htZW50cyIsImZpbGVzIiwibGVuZ3RoIiwiZWFjaCIsImZpbGVJZCIsImZpbGUiLCJVcGxvYWRzIiwiZmluZE9uZUJ5SWQiLCJzdG9yZSIsInJzIiwiVXBsb2FkRlMiLCJnZXRTdG9yZSIsImdldFJlYWRTdHJlYW0iLCJwdXNoIiwiZmlsZW5hbWUiLCJzdHJlYW1Tb3VyY2UiLCJFbWFpbCIsInNlbmQiLCJ0byIsImdldCIsImZyb20iLCJzdWJqZWN0IiwiaHRtbCIsImJvZHkiLCJzdGFydCIsImVuZCIsIm9wZW50ciIsImNsb3NldHIiLCJvcGVuMjB0ZCIsIm9wZW42MHRkIiwiY2xvc2V0ZCIsIl9nZXRMaW5rIiwiYXR0YWNobWVudCIsInVybCIsInRpdGxlX2xpbmsiLCJyZXBsYWNlIiwiTWV0ZW9yIiwicHVibGljIiwic2FuZHN0b3JtIiwibWF0Y2giLCJhYnNvbHV0ZVVybCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsImdlbmVyYXRlRW1sIiwiZGVmZXIiLCJzbWFyc2hNaXNzaW5nRW1haWwiLCJ0aW1lWm9uZSIsIlJvb21zIiwiZmluZCIsImZvckVhY2giLCJyb29tIiwic21hcnNoSGlzdG9yeSIsImZpbmRPbmUiLCJxdWVyeSIsInJpZCIsInRzIiwiJGd0IiwibGFzdFJhbiIsImRhdGUiLCJEYXRlIiwicm93cyIsInVzZXJzIiwibXNncyIsInRpbWUiLCJkaWZmIiwidXNlcm5hbWVzIiwiam9pbiIsIk1lc3NhZ2VzIiwibWVzc2FnZSIsImZvcm1hdCIsInNlbmRlciIsIlVzZXJzIiwidSIsImluZGV4T2YiLCJlbWFpbHMiLCJhZGRyZXNzIiwidCIsIm1lc3NhZ2VUeXBlIiwiTWVzc2FnZVR5cGVzIiwiZ2V0VHlwZSIsIlRBUGkxOG4iLCJfXyIsIm1zZyIsInRpdGxlIiwiYXR0YWNoZXMiLCJfbG9vcFRocm91Z2hNZXNzYWdlQXR0YWNobWVudHMiLCJhIiwiaW1hZ2VfdXJsIiwicmVzdWx0IiwidXBzZXJ0IiwibGFzdFJlc3VsdCIsInNtYXJzaEpvYk5hbWUiLCJfYWRkU21hcnNoU3luY2VkQ3JvbkpvYiIsImRlYm91bmNlIiwiYmluZEVudmlyb25tZW50IiwiX19hZGRTbWFyc2hTeW5jZWRDcm9uSm9iRGVib3VuY2VkIiwiU3luY2VkQ3JvbiIsIm5leHRTY2hlZHVsZWRBdERhdGUiLCJyZW1vdmUiLCJzY2hlZHVsZSIsInBhcnNlciIsInRleHQiLCJqb2IiLCJzdGFydHVwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLE1BQVgsR0FBb0IsRUFBcEIsQzs7Ozs7Ozs7Ozs7QUNBQSxJQUFJQyxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGFBQU9LLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFBeURKLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxpQkFBUixDQUFiO0FBR3BFTCxXQUFXUSxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixRQUE3QixFQUF1QyxTQUFTQyxXQUFULEdBQXVCO0FBQzdELE9BQUtDLEdBQUwsQ0FBUyxnQkFBVCxFQUEyQixLQUEzQixFQUFrQztBQUNqQ0MsVUFBTSxTQUQyQjtBQUVqQ0MsZUFBVyxnQkFGc0I7QUFHakNDLGlCQUFhO0FBQ1pDLFdBQUssWUFETztBQUVaQyxhQUFPO0FBQ05DLGlCQUFTLENBREg7QUFFTkMsYUFBSztBQUZDO0FBRks7QUFIb0IsR0FBbEM7QUFXQSxPQUFLUCxHQUFMLENBQVMsY0FBVCxFQUF5QixFQUF6QixFQUE2QjtBQUM1QkMsVUFBTSxRQURzQjtBQUU1QkMsZUFBVyxjQUZpQjtBQUc1Qk0saUJBQWE7QUFIZSxHQUE3QjtBQUtBLE9BQUtSLEdBQUwsQ0FBUywyQkFBVCxFQUFzQyxzQkFBdEMsRUFBOEQ7QUFDN0RDLFVBQU0sUUFEdUQ7QUFFN0RDLGVBQVcsMkJBRmtEO0FBRzdETSxpQkFBYTtBQUhnRCxHQUE5RDtBQU1BLFFBQU1DLGFBQWFsQixPQUFPbUIsRUFBUCxDQUFVQyxLQUFWLEdBQWtCQyxHQUFsQixDQUFzQixTQUFTQyxvQkFBVCxDQUE4QkMsSUFBOUIsRUFBb0M7QUFDNUUsV0FBTztBQUNOQyxXQUFLRCxJQURDO0FBRU5aLGlCQUFXWTtBQUZMLEtBQVA7QUFJQSxHQUxrQixDQUFuQjtBQU1BLE9BQUtkLEdBQUwsQ0FBUyxpQkFBVCxFQUE0QixxQkFBNUIsRUFBbUQ7QUFDbERDLFVBQU0sUUFENEM7QUFFbERlLFlBQVFQO0FBRjBDLEdBQW5EO0FBS0EsT0FBS1QsR0FBTCxDQUFTLGlCQUFULEVBQTRCLGtCQUE1QixFQUFnRDtBQUMvQ0MsVUFBTSxRQUR5QztBQUUvQ2UsWUFBUSxDQUFDO0FBQ1JELFdBQUssa0JBREc7QUFFUmIsaUJBQVc7QUFGSCxLQUFELEVBR0w7QUFDRmEsV0FBSyxrQkFESDtBQUVGYixpQkFBVztBQUZULEtBSEssRUFNTDtBQUNGYSxXQUFLLGVBREg7QUFFRmIsaUJBQVc7QUFGVCxLQU5LLEVBU0w7QUFDRmEsV0FBSyxlQURIO0FBRUZiLGlCQUFXO0FBRlQsS0FUSyxDQUZ1QztBQWUvQ0MsaUJBQWE7QUFDWkMsV0FBSyxZQURPO0FBRVpDLGFBQU87QUFDTkMsaUJBQVMsQ0FESDtBQUVOQyxhQUFLO0FBRkM7QUFGSztBQWZrQyxHQUFoRDtBQXVCQSxDQXpERCxFOzs7Ozs7Ozs7OztBQ0hBbEIsV0FBV0MsTUFBWCxDQUFrQjJCLE9BQWxCLEdBQTRCLElBQUksY0FBYzVCLFdBQVc2QixNQUFYLENBQWtCQyxLQUFoQyxDQUFzQztBQUNyRUMsZ0JBQWM7QUFDYixVQUFNLGdCQUFOO0FBQ0E7O0FBSG9FLENBQTFDLEVBQTVCLEM7Ozs7Ozs7Ozs7O0FDQUEsSUFBSUMsQ0FBSjs7QUFBTTdCLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUN5QixRQUFFekIsQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDs7QUFVTlAsV0FBV0MsTUFBWCxDQUFrQmdDLFNBQWxCLEdBQStCQyxJQUFELElBQVU7QUFDdkMsUUFBTUMsY0FBYyxFQUFwQjs7QUFFQSxNQUFJRCxLQUFLRSxLQUFMLENBQVdDLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFDMUJMLE1BQUVNLElBQUYsQ0FBT0osS0FBS0UsS0FBWixFQUFvQkcsTUFBRCxJQUFZO0FBQzlCLFlBQU1DLE9BQU94QyxXQUFXNkIsTUFBWCxDQUFrQlksT0FBbEIsQ0FBMEJDLFdBQTFCLENBQXNDSCxNQUF0QyxDQUFiOztBQUNBLFVBQUlDLEtBQUtHLEtBQUwsS0FBZSxvQkFBZixJQUF1Q0gsS0FBS0csS0FBTCxLQUFlLFlBQTFELEVBQXdFO0FBQ3ZFLGNBQU1DLEtBQUtDLFNBQVNDLFFBQVQsQ0FBa0JOLEtBQUtHLEtBQXZCLEVBQThCSSxhQUE5QixDQUE0Q1IsTUFBNUMsRUFBb0RDLElBQXBELENBQVg7QUFDQUwsb0JBQVlhLElBQVosQ0FBaUI7QUFDaEJDLG9CQUFVVCxLQUFLZixJQURDO0FBRWhCeUIsd0JBQWNOO0FBRkUsU0FBakI7QUFJQTtBQUNELEtBVEQ7QUFVQTs7QUFFRE8sUUFBTUMsSUFBTixDQUFXO0FBQ1ZDLFFBQUlyRCxXQUFXUSxRQUFYLENBQW9COEMsR0FBcEIsQ0FBd0IsY0FBeEIsQ0FETTtBQUVWQyxVQUFNdkQsV0FBV1EsUUFBWCxDQUFvQjhDLEdBQXBCLENBQXdCLFlBQXhCLENBRkk7QUFHVkUsYUFBU3RCLEtBQUtzQixPQUhKO0FBSVZDLFVBQU12QixLQUFLd0IsSUFKRDtBQUtWdkI7QUFMVSxHQUFYO0FBT0EsQ0F2QkQsQzs7Ozs7Ozs7Ozs7QUNWQSxJQUFJSCxDQUFKOztBQUFNN0IsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3lCLFFBQUV6QixDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlMLE1BQUo7QUFBV0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsYUFBT0ssQ0FBUDtBQUFTOztBQUFyQixDQUEvQixFQUFzRCxDQUF0RDtBQUF5REosT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWI7QUFJbEksTUFBTXNELFFBQVEsbUtBQWQ7QUFDQSxNQUFNQyxNQUFNLGtCQUFaO0FBQ0EsTUFBTUMsU0FBUyxpQ0FBZjtBQUNBLE1BQU1DLFVBQVUsT0FBaEI7QUFDQSxNQUFNQyxXQUFXLGlFQUFqQjtBQUNBLE1BQU1DLFdBQVcsK0VBQWpCO0FBQ0EsTUFBTUMsVUFBVSxPQUFoQjs7QUFFQSxTQUFTQyxRQUFULENBQWtCQyxVQUFsQixFQUE4QjtBQUM3QixRQUFNQyxNQUFNRCxXQUFXRSxVQUFYLENBQXNCQyxPQUF0QixDQUE4QixJQUE5QixFQUFvQyxLQUFwQyxDQUFaOztBQUVBLE1BQUlDLE9BQU8vRCxRQUFQLENBQWdCZ0UsTUFBaEIsQ0FBdUJDLFNBQXZCLElBQW9DTCxJQUFJTSxLQUFKLENBQVUsa0JBQVYsQ0FBeEMsRUFBdUU7QUFDdEUsV0FBT04sR0FBUDtBQUNBLEdBRkQsTUFFTztBQUNOLFdBQU9HLE9BQU9JLFdBQVAsR0FBcUJMLE9BQXJCLENBQTZCLEtBQTdCLEVBQW9DLEVBQXBDLElBQTBDTSwwQkFBMEJDLG9CQUFwRSxHQUEyRlQsR0FBbEc7QUFDQTtBQUNEOztBQUVEcEUsV0FBV0MsTUFBWCxDQUFrQjZFLFdBQWxCLEdBQWdDLE1BQU07QUFDckNQLFNBQU9RLEtBQVAsQ0FBYSxNQUFNO0FBQ2xCLFVBQU1DLHFCQUFxQmhGLFdBQVdRLFFBQVgsQ0FBb0I4QyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBM0I7QUFDQSxVQUFNMkIsV0FBV2pGLFdBQVdRLFFBQVgsQ0FBb0I4QyxHQUFwQixDQUF3QixpQkFBeEIsQ0FBakI7QUFFQXRELGVBQVc2QixNQUFYLENBQWtCcUQsS0FBbEIsQ0FBd0JDLElBQXhCLEdBQStCQyxPQUEvQixDQUF3Q0MsSUFBRCxJQUFVO0FBQ2hELFlBQU1DLGdCQUFnQnRGLFdBQVdDLE1BQVgsQ0FBa0IyQixPQUFsQixDQUEwQjJELE9BQTFCLENBQWtDO0FBQUV4RSxhQUFLc0UsS0FBS3RFO0FBQVosT0FBbEMsQ0FBdEI7QUFDQSxZQUFNeUUsUUFBUTtBQUFFQyxhQUFLSixLQUFLdEU7QUFBWixPQUFkOztBQUVBLFVBQUl1RSxhQUFKLEVBQW1CO0FBQ2xCRSxjQUFNRSxFQUFOLEdBQVc7QUFBRUMsZUFBS0wsY0FBY007QUFBckIsU0FBWDtBQUNBOztBQUVELFlBQU1DLE9BQU8sSUFBSUMsSUFBSixFQUFiO0FBQ0EsWUFBTUMsT0FBTyxFQUFiO0FBQ0EsWUFBTTdELE9BQU87QUFDWjhELGVBQU8sRUFESztBQUVaQyxjQUFNLENBRk07QUFHWjdELGVBQU8sRUFISztBQUlaOEQsY0FBTVosZ0JBQWdCcEYsT0FBTzJGLElBQVAsRUFBYU0sSUFBYixDQUFrQmpHLE9BQU9vRixjQUFjTSxPQUFyQixDQUFsQixFQUFpRCxTQUFqRCxDQUFoQixHQUE4RTFGLE9BQU8yRixJQUFQLEVBQWFNLElBQWIsQ0FBa0JqRyxPQUFPbUYsS0FBS0ssRUFBWixDQUFsQixFQUFtQyxTQUFuQyxDQUp4RTtBQUtaTCxjQUFNQSxLQUFLNUQsSUFBTCxHQUFhLElBQUk0RCxLQUFLNUQsSUFBTSxFQUE1QixHQUFpQywyQkFBMkI0RCxLQUFLZSxTQUFMLENBQWVDLElBQWYsQ0FBb0IsS0FBcEIsQ0FBNEI7QUFMbEYsT0FBYjtBQVFBckcsaUJBQVc2QixNQUFYLENBQWtCeUUsUUFBbEIsQ0FBMkJuQixJQUEzQixDQUFnQ0ssS0FBaEMsRUFBdUNKLE9BQXZDLENBQWdEbUIsT0FBRCxJQUFhO0FBQzNEUixhQUFLL0MsSUFBTCxDQUFVYSxNQUFWLEVBRDJELENBRzNEOztBQUNBa0MsYUFBSy9DLElBQUwsQ0FBVWUsUUFBVjtBQUNBZ0MsYUFBSy9DLElBQUwsQ0FBVTlDLE9BQU9xRyxRQUFRYixFQUFmLEVBQW1CckUsRUFBbkIsQ0FBc0I0RCxRQUF0QixFQUFnQ3VCLE1BQWhDLENBQXVDLHVCQUF2QyxDQUFWO0FBQ0FULGFBQUsvQyxJQUFMLENBQVVpQixPQUFWLEVBTjJELENBUTNEOztBQUNBOEIsYUFBSy9DLElBQUwsQ0FBVWUsUUFBVjtBQUNBLGNBQU0wQyxTQUFTekcsV0FBVzZCLE1BQVgsQ0FBa0I2RSxLQUFsQixDQUF3Qm5CLE9BQXhCLENBQWdDO0FBQUV4RSxlQUFLd0YsUUFBUUksQ0FBUixDQUFVNUY7QUFBakIsU0FBaEMsQ0FBZjs7QUFDQSxZQUFJbUIsS0FBSzhELEtBQUwsQ0FBV1ksT0FBWCxDQUFtQkgsT0FBTzFGLEdBQTFCLE1BQW1DLENBQUMsQ0FBeEMsRUFBMkM7QUFDMUNtQixlQUFLOEQsS0FBTCxDQUFXaEQsSUFBWCxDQUFnQnlELE9BQU8xRixHQUF2QjtBQUNBLFNBYjBELENBZTNEOzs7QUFDQSxZQUFJMEYsT0FBT0ksTUFBUCxJQUFpQkosT0FBT0ksTUFBUCxDQUFjLENBQWQsQ0FBakIsSUFBcUNKLE9BQU9JLE1BQVAsQ0FBYyxDQUFkLEVBQWlCQyxPQUExRCxFQUFtRTtBQUNsRWYsZUFBSy9DLElBQUwsQ0FBVyxHQUFHeUQsT0FBT2hGLElBQU0sUUFBUWdGLE9BQU9JLE1BQVAsQ0FBYyxDQUFkLEVBQWlCQyxPQUFTLE1BQTdEO0FBQ0EsU0FGRCxNQUVPO0FBQ05mLGVBQUsvQyxJQUFMLENBQVcsR0FBR3lELE9BQU9oRixJQUFNLFFBQVF1RCxrQkFBb0IsTUFBdkQ7QUFDQTs7QUFDRGUsYUFBSy9DLElBQUwsQ0FBVWlCLE9BQVYsRUFyQjJELENBdUIzRDs7QUFDQThCLGFBQUsvQyxJQUFMLENBQVVnQixRQUFWO0FBQ0E5QixhQUFLK0QsSUFBTDs7QUFDQSxZQUFJTSxRQUFRUSxDQUFaLEVBQWU7QUFDZCxnQkFBTUMsY0FBY2hILFdBQVdpSCxZQUFYLENBQXdCQyxPQUF4QixDQUFnQ1gsT0FBaEMsQ0FBcEI7O0FBQ0EsY0FBSVMsV0FBSixFQUFpQjtBQUNoQmpCLGlCQUFLL0MsSUFBTCxDQUFVbUUsUUFBUUMsRUFBUixDQUFXSixZQUFZVCxPQUF2QixFQUFnQ1MsWUFBWTlFLElBQVosR0FBbUI4RSxZQUFZOUUsSUFBWixDQUFpQnFFLE9BQWpCLENBQW5CLEdBQStDLEVBQS9FLEVBQW1GLElBQW5GLENBQVY7QUFDQSxXQUZELE1BRU87QUFDTlIsaUJBQUsvQyxJQUFMLENBQVcsR0FBR3VELFFBQVFjLEdBQUssS0FBS2QsUUFBUVEsQ0FBRyxHQUEzQztBQUNBO0FBQ0QsU0FQRCxNQU9PLElBQUlSLFFBQVEvRCxJQUFaLEVBQWtCO0FBQ3hCTixlQUFLRSxLQUFMLENBQVdZLElBQVgsQ0FBZ0J1RCxRQUFRL0QsSUFBUixDQUFhekIsR0FBN0I7QUFDQWdGLGVBQUsvQyxJQUFMLENBQVcsR0FBR3VELFFBQVFwRSxXQUFSLENBQW9CLENBQXBCLEVBQXVCbUYsS0FBTyxLQUFLcEQsU0FBU3FDLFFBQVFwRSxXQUFSLENBQW9CLENBQXBCLENBQVQsQ0FBa0MsR0FBbkY7QUFDQSxTQUhNLE1BR0EsSUFBSW9FLFFBQVFwRSxXQUFaLEVBQXlCO0FBQy9CLGdCQUFNb0YsV0FBVyxFQUFqQjs7QUFDQXZGLFlBQUVNLElBQUYsQ0FBT2lFLFFBQVFwRSxXQUFmLEVBQTRCLFNBQVNxRiw4QkFBVCxDQUF3Q0MsQ0FBeEMsRUFBMkM7QUFDdEUsZ0JBQUlBLEVBQUVDLFNBQU4sRUFBaUI7QUFDaEJILHVCQUFTdkUsSUFBVCxDQUFjeUUsRUFBRUMsU0FBaEI7QUFDQSxhQUhxRSxDQUl0RTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQVJEOztBQVVBM0IsZUFBSy9DLElBQUwsQ0FBVyxHQUFHdUQsUUFBUWMsR0FBSyxLQUFLRSxTQUFTbEIsSUFBVCxDQUFjLElBQWQsQ0FBcUIsR0FBckQ7QUFDQSxTQWJNLE1BYUE7QUFDTk4sZUFBSy9DLElBQUwsQ0FBVXVELFFBQVFjLEdBQWxCO0FBQ0E7O0FBQ0R0QixhQUFLL0MsSUFBTCxDQUFVaUIsT0FBVjtBQUVBOEIsYUFBSy9DLElBQUwsQ0FBVWMsT0FBVjtBQUNBLE9BdkREOztBQXlEQSxVQUFJaUMsS0FBSzFELE1BQUwsS0FBZ0IsQ0FBcEIsRUFBdUI7QUFDdEIsY0FBTXNGLFNBQVNoRSxRQUFRb0MsS0FBS00sSUFBTCxDQUFVLEVBQVYsQ0FBUixHQUF3QnpDLEdBQXZDO0FBRUE1RCxtQkFBV0MsTUFBWCxDQUFrQjJCLE9BQWxCLENBQTBCZ0csTUFBMUIsQ0FBaUM7QUFBRTdHLGVBQUtzRSxLQUFLdEU7QUFBWixTQUFqQyxFQUFvRDtBQUNuREEsZUFBS3NFLEtBQUt0RSxHQUR5QztBQUVuRDZFLG1CQUFTQyxJQUYwQztBQUduRGdDLHNCQUFZRjtBQUh1QyxTQUFwRDtBQU1BM0gsbUJBQVdDLE1BQVgsQ0FBa0JnQyxTQUFsQixDQUE0QjtBQUMzQnlCLGdCQUFNaUUsTUFEcUI7QUFFM0JuRSxtQkFBVSxnQkFBZ0J0QixLQUFLOEQsS0FBTCxDQUFXM0QsTUFBUSxXQUFXSCxLQUFLK0QsSUFBTSxjQUFjL0QsS0FBS0UsS0FBTCxDQUFXQyxNQUFRLFdBQVdILEtBQUtnRSxJQUFNLGdCQUFnQmhFLEtBQUttRCxJQUFNLEVBRjFIO0FBRzNCakQsaUJBQU9GLEtBQUtFO0FBSGUsU0FBNUI7QUFLQTtBQUNELEtBMUZEO0FBMkZBLEdBL0ZEO0FBZ0dBLENBakdELEM7Ozs7Ozs7Ozs7O0FDdEJBLElBQUlKLENBQUo7O0FBQU03QixPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDeUIsUUFBRXpCLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFHTixNQUFNdUgsZ0JBQWdCLHNCQUF0Qjs7QUFFQSxNQUFNQywwQkFBMEIvRixFQUFFZ0csUUFBRixDQUFXekQsT0FBTzBELGVBQVAsQ0FBdUIsU0FBU0MsaUNBQVQsR0FBNkM7QUFDOUcsTUFBSUMsV0FBV0MsbUJBQVgsQ0FBK0JOLGFBQS9CLENBQUosRUFBbUQ7QUFDbERLLGVBQVdFLE1BQVgsQ0FBa0JQLGFBQWxCO0FBQ0E7O0FBRUQsTUFBSTlILFdBQVdRLFFBQVgsQ0FBb0I4QyxHQUFwQixDQUF3QixnQkFBeEIsS0FBNkN0RCxXQUFXUSxRQUFYLENBQW9COEMsR0FBcEIsQ0FBd0IsY0FBeEIsTUFBNEMsRUFBekYsSUFBK0Z0RCxXQUFXUSxRQUFYLENBQW9COEMsR0FBcEIsQ0FBd0IsWUFBeEIsTUFBMEMsRUFBN0ksRUFBaUo7QUFDaEo2RSxlQUFXeEgsR0FBWCxDQUFlO0FBQ2RjLFlBQU1xRyxhQURRO0FBRWRRLGdCQUFXQyxNQUFELElBQVlBLE9BQU9DLElBQVAsQ0FBWXhJLFdBQVdRLFFBQVgsQ0FBb0I4QyxHQUFwQixDQUF3QixpQkFBeEIsRUFBMkNnQixPQUEzQyxDQUFtRCxJQUFuRCxFQUF5RCxHQUF6RCxDQUFaLENBRlI7QUFHZG1FLFdBQUt6SSxXQUFXQyxNQUFYLENBQWtCNkU7QUFIVCxLQUFmO0FBS0E7QUFDRCxDQVowQyxDQUFYLEVBWTVCLEdBWjRCLENBQWhDOztBQWNBUCxPQUFPbUUsT0FBUCxDQUFlLE1BQU07QUFDcEJuRSxTQUFPUSxLQUFQLENBQWEsTUFBTTtBQUNsQmdEOztBQUVBL0gsZUFBV1EsUUFBWCxDQUFvQjhDLEdBQXBCLENBQXdCLGlCQUF4QixFQUEyQ3lFLHVCQUEzQztBQUNBL0gsZUFBV1EsUUFBWCxDQUFvQjhDLEdBQXBCLENBQXdCLGdCQUF4QixFQUEwQ3lFLHVCQUExQztBQUNBL0gsZUFBV1EsUUFBWCxDQUFvQjhDLEdBQXBCLENBQXdCLGNBQXhCLEVBQXdDeUUsdUJBQXhDO0FBQ0EvSCxlQUFXUSxRQUFYLENBQW9COEMsR0FBcEIsQ0FBd0IsWUFBeEIsRUFBc0N5RSx1QkFBdEM7QUFDQSxHQVBEO0FBUUEsQ0FURCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NtYXJzaC1jb25uZWN0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LnNtYXJzaCA9IHt9O1xuIiwiaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuaW1wb3J0ICdtb21lbnQtdGltZXpvbmUnO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdTbWFyc2gnLCBmdW5jdGlvbiBhZGRTZXR0aW5ncygpIHtcblx0dGhpcy5hZGQoJ1NtYXJzaF9FbmFibGVkJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0aTE4bkxhYmVsOiAnU21hcnNoX0VuYWJsZWQnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRfaWQ6ICdGcm9tX0VtYWlsJyxcblx0XHRcdHZhbHVlOiB7XG5cdFx0XHRcdCRleGlzdHM6IDEsXG5cdFx0XHRcdCRuZTogJydcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHR0aGlzLmFkZCgnU21hcnNoX0VtYWlsJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRpMThuTGFiZWw6ICdTbWFyc2hfRW1haWwnLFxuXHRcdHBsYWNlaG9sZGVyOiAnZW1haWxAZG9tYWluLmNvbSdcblx0fSk7XG5cdHRoaXMuYWRkKCdTbWFyc2hfTWlzc2luZ0VtYWlsX0VtYWlsJywgJ25vLWVtYWlsQGV4YW1wbGUuY29tJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGkxOG5MYWJlbDogJ1NtYXJzaF9NaXNzaW5nRW1haWxfRW1haWwnLFxuXHRcdHBsYWNlaG9sZGVyOiAnbm8tZW1haWxAZXhhbXBsZS5jb20nXG5cdH0pO1xuXG5cdGNvbnN0IHpvbmVWYWx1ZXMgPSBtb21lbnQudHoubmFtZXMoKS5tYXAoZnVuY3Rpb24gX3RpbWVab25lc1RvU2V0dGluZ3MobmFtZSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRrZXk6IG5hbWUsXG5cdFx0XHRpMThuTGFiZWw6IG5hbWVcblx0XHR9O1xuXHR9KTtcblx0dGhpcy5hZGQoJ1NtYXJzaF9UaW1lem9uZScsICdBbWVyaWNhL0xvc19BbmdlbGVzJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdHZhbHVlczogem9uZVZhbHVlc1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnU21hcnNoX0ludGVydmFsJywgJ2V2ZXJ5XzMwX21pbnV0ZXMnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0dmFsdWVzOiBbe1xuXHRcdFx0a2V5OiAnZXZlcnlfMzBfc2Vjb25kcycsXG5cdFx0XHRpMThuTGFiZWw6ICdldmVyeV8zMF9zZWNvbmRzJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ2V2ZXJ5XzMwX21pbnV0ZXMnLFxuXHRcdFx0aTE4bkxhYmVsOiAnZXZlcnlfMzBfbWludXRlcydcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdldmVyeV8xX2hvdXJzJyxcblx0XHRcdGkxOG5MYWJlbDogJ2V2ZXJ5X2hvdXInXG5cdFx0fSwge1xuXHRcdFx0a2V5OiAnZXZlcnlfNl9ob3VycycsXG5cdFx0XHRpMThuTGFiZWw6ICdldmVyeV9zaXhfaG91cnMnXG5cdFx0fV0sXG5cdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdF9pZDogJ0Zyb21fRW1haWwnLFxuXHRcdFx0dmFsdWU6IHtcblx0XHRcdFx0JGV4aXN0czogMSxcblx0XHRcdFx0JG5lOiAnJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59KTtcbiIsIlJvY2tldENoYXQuc21hcnNoLkhpc3RvcnkgPSBuZXcgY2xhc3MgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdzbWFyc2hfaGlzdG9yeScpO1xuXHR9XG59O1xuIiwiLyogZ2xvYmFscyBVcGxvYWRGUyAqL1xuLy9FeHBlY3RzIHRoZSBmb2xsb3dpbmcgZGV0YWlsczpcbi8vIHtcbi8vIFx0Ym9keTogJzx0YWJsZT4nLFxuLy8gXHRzdWJqZWN0OiAnUm9ja2V0LkNoYXQsIDE3IFVzZXJzLCAyNCBNZXNzYWdlcywgMSBGaWxlLCA3OTk1MDQgTWludXRlcywgaW4gI3JhbmRvbScsXG4vLyAgZmlsZXM6IFsnaTNuYzlsM21uJ11cbi8vIH1cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblJvY2tldENoYXQuc21hcnNoLnNlbmRFbWFpbCA9IChkYXRhKSA9PiB7XG5cdGNvbnN0IGF0dGFjaG1lbnRzID0gW107XG5cblx0aWYgKGRhdGEuZmlsZXMubGVuZ3RoID4gMCkge1xuXHRcdF8uZWFjaChkYXRhLmZpbGVzLCAoZmlsZUlkKSA9PiB7XG5cdFx0XHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChmaWxlSWQpO1xuXHRcdFx0aWYgKGZpbGUuc3RvcmUgPT09ICdyb2NrZXRjaGF0X3VwbG9hZHMnIHx8IGZpbGUuc3RvcmUgPT09ICdmaWxlU3lzdGVtJykge1xuXHRcdFx0XHRjb25zdCBycyA9IFVwbG9hZEZTLmdldFN0b3JlKGZpbGUuc3RvcmUpLmdldFJlYWRTdHJlYW0oZmlsZUlkLCBmaWxlKTtcblx0XHRcdFx0YXR0YWNobWVudHMucHVzaCh7XG5cdFx0XHRcdFx0ZmlsZW5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRzdHJlYW1Tb3VyY2U6IHJzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0RW1haWwuc2VuZCh7XG5cdFx0dG86IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbWFyc2hfRW1haWwnKSxcblx0XHRmcm9tOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpLFxuXHRcdHN1YmplY3Q6IGRhdGEuc3ViamVjdCxcblx0XHRodG1sOiBkYXRhLmJvZHksXG5cdFx0YXR0YWNobWVudHNcblx0fSk7XG59O1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5pbXBvcnQgJ21vbWVudC10aW1lem9uZSc7XG5cbmNvbnN0IHN0YXJ0ID0gJzx0YWJsZSBzdHlsZT1cIndpZHRoOiAxMDAlOyBib3JkZXI6IDFweCBzb2xpZDsgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsgdGFibGUtbGF5b3V0OiBmaXhlZDsgbWFyZ2luLXRvcDogMTBweDsgZm9udC1zaXplOiAxMnB4OyB3b3JkLWJyZWFrOiBicmVhay13b3JkO1wiPjx0Ym9keT4nO1xuY29uc3QgZW5kID0gJzwvdGJvZHk+PC90YWJsZT4nO1xuY29uc3Qgb3BlbnRyID0gJzx0ciBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkO1wiPic7XG5jb25zdCBjbG9zZXRyID0gJzwvdHI+JztcbmNvbnN0IG9wZW4yMHRkID0gJzx0ZCBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHdpZHRoOiAyMCU7XCI+JztcbmNvbnN0IG9wZW42MHRkID0gJzx0ZCBzdHlsZT1cImJvcmRlcjogMXB4IHNvbGlkOyB0ZXh0LWFsaWduOiBsZWZ0OyB3aWR0aDogNjAlOyBwYWRkaW5nOiAwIDVweDtcIj4nO1xuY29uc3QgY2xvc2V0ZCA9ICc8L3RkPic7XG5cbmZ1bmN0aW9uIF9nZXRMaW5rKGF0dGFjaG1lbnQpIHtcblx0Y29uc3QgdXJsID0gYXR0YWNobWVudC50aXRsZV9saW5rLnJlcGxhY2UoLyAvZywgJyUyMCcpO1xuXG5cdGlmIChNZXRlb3Iuc2V0dGluZ3MucHVibGljLnNhbmRzdG9ybSB8fCB1cmwubWF0Y2goL14oaHR0cHM/Oik/XFwvXFwvL2kpKSB7XG5cdFx0cmV0dXJuIHVybDtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXFwvJC8sICcnKSArIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggKyB1cmw7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5zbWFyc2guZ2VuZXJhdGVFbWwgPSAoKSA9PiB7XG5cdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0Y29uc3Qgc21hcnNoTWlzc2luZ0VtYWlsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NtYXJzaF9NaXNzaW5nRW1haWxfRW1haWwnKTtcblx0XHRjb25zdCB0aW1lWm9uZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbWFyc2hfVGltZXpvbmUnKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQoKS5mb3JFYWNoKChyb29tKSA9PiB7XG5cdFx0XHRjb25zdCBzbWFyc2hIaXN0b3J5ID0gUm9ja2V0Q2hhdC5zbWFyc2guSGlzdG9yeS5maW5kT25lKHsgX2lkOiByb29tLl9pZCB9KTtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0geyByaWQ6IHJvb20uX2lkIH07XG5cblx0XHRcdGlmIChzbWFyc2hIaXN0b3J5KSB7XG5cdFx0XHRcdHF1ZXJ5LnRzID0geyAkZ3Q6IHNtYXJzaEhpc3RvcnkubGFzdFJhbiB9O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBkYXRlID0gbmV3IERhdGUoKTtcblx0XHRcdGNvbnN0IHJvd3MgPSBbXTtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHVzZXJzOiBbXSxcblx0XHRcdFx0bXNnczogMCxcblx0XHRcdFx0ZmlsZXM6IFtdLFxuXHRcdFx0XHR0aW1lOiBzbWFyc2hIaXN0b3J5ID8gbW9tZW50KGRhdGUpLmRpZmYobW9tZW50KHNtYXJzaEhpc3RvcnkubGFzdFJhbiksICdtaW51dGVzJykgOiBtb21lbnQoZGF0ZSkuZGlmZihtb21lbnQocm9vbS50cyksICdtaW51dGVzJyksXG5cdFx0XHRcdHJvb206IHJvb20ubmFtZSA/IGAjJHsgcm9vbS5uYW1lIH1gIDogYERpcmVjdCBNZXNzYWdlIEJldHdlZW46ICR7IHJvb20udXNlcm5hbWVzLmpvaW4oJyAmICcpIH1gXG5cdFx0XHR9O1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKHF1ZXJ5KS5mb3JFYWNoKChtZXNzYWdlKSA9PiB7XG5cdFx0XHRcdHJvd3MucHVzaChvcGVudHIpO1xuXG5cdFx0XHRcdC8vVGhlIHRpbWVzdGFtcFxuXHRcdFx0XHRyb3dzLnB1c2gob3BlbjIwdGQpO1xuXHRcdFx0XHRyb3dzLnB1c2gobW9tZW50KG1lc3NhZ2UudHMpLnR6KHRpbWVab25lKS5mb3JtYXQoJ1lZWVktTU0tREQgSEgtbW0tc3MgeicpKTtcblx0XHRcdFx0cm93cy5wdXNoKGNsb3NldGQpO1xuXG5cdFx0XHRcdC8vVGhlIHNlbmRlclxuXHRcdFx0XHRyb3dzLnB1c2gob3BlbjIwdGQpO1xuXHRcdFx0XHRjb25zdCBzZW5kZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHsgX2lkOiBtZXNzYWdlLnUuX2lkIH0pO1xuXHRcdFx0XHRpZiAoZGF0YS51c2Vycy5pbmRleE9mKHNlbmRlci5faWQpID09PSAtMSkge1xuXHRcdFx0XHRcdGRhdGEudXNlcnMucHVzaChzZW5kZXIuX2lkKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vR2V0IHRoZSB1c2VyJ3MgZW1haWwsIGNhbiBiZSBub3RoaW5nIGlmIGl0IGlzIGFuIHVuY29uZmlndXJlZCBib3QgYWNjb3VudCAobGlrZSByb2NrZXQuY2F0KVxuXHRcdFx0XHRpZiAoc2VuZGVyLmVtYWlscyAmJiBzZW5kZXIuZW1haWxzWzBdICYmIHNlbmRlci5lbWFpbHNbMF0uYWRkcmVzcykge1xuXHRcdFx0XHRcdHJvd3MucHVzaChgJHsgc2VuZGVyLm5hbWUgfSAmbHQ7JHsgc2VuZGVyLmVtYWlsc1swXS5hZGRyZXNzIH0mZ3Q7YCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cm93cy5wdXNoKGAkeyBzZW5kZXIubmFtZSB9ICZsdDskeyBzbWFyc2hNaXNzaW5nRW1haWwgfSZndDtgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyb3dzLnB1c2goY2xvc2V0ZCk7XG5cblx0XHRcdFx0Ly9UaGUgbWVzc2FnZVxuXHRcdFx0XHRyb3dzLnB1c2gob3BlbjYwdGQpO1xuXHRcdFx0XHRkYXRhLm1zZ3MrKztcblx0XHRcdFx0aWYgKG1lc3NhZ2UudCkge1xuXHRcdFx0XHRcdGNvbnN0IG1lc3NhZ2VUeXBlID0gUm9ja2V0Q2hhdC5NZXNzYWdlVHlwZXMuZ2V0VHlwZShtZXNzYWdlKTtcblx0XHRcdFx0XHRpZiAobWVzc2FnZVR5cGUpIHtcblx0XHRcdFx0XHRcdHJvd3MucHVzaChUQVBpMThuLl9fKG1lc3NhZ2VUeXBlLm1lc3NhZ2UsIG1lc3NhZ2VUeXBlLmRhdGEgPyBtZXNzYWdlVHlwZS5kYXRhKG1lc3NhZ2UpIDogJycsICdlbicpKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cm93cy5wdXNoKGAkeyBtZXNzYWdlLm1zZyB9ICgkeyBtZXNzYWdlLnQgfSlgKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSBpZiAobWVzc2FnZS5maWxlKSB7XG5cdFx0XHRcdFx0ZGF0YS5maWxlcy5wdXNoKG1lc3NhZ2UuZmlsZS5faWQpO1xuXHRcdFx0XHRcdHJvd3MucHVzaChgJHsgbWVzc2FnZS5hdHRhY2htZW50c1swXS50aXRsZSB9ICgkeyBfZ2V0TGluayhtZXNzYWdlLmF0dGFjaG1lbnRzWzBdKSB9KWApO1xuXHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2UuYXR0YWNobWVudHMpIHtcblx0XHRcdFx0XHRjb25zdCBhdHRhY2hlcyA9IFtdO1xuXHRcdFx0XHRcdF8uZWFjaChtZXNzYWdlLmF0dGFjaG1lbnRzLCBmdW5jdGlvbiBfbG9vcFRocm91Z2hNZXNzYWdlQXR0YWNobWVudHMoYSkge1xuXHRcdFx0XHRcdFx0aWYgKGEuaW1hZ2VfdXJsKSB7XG5cdFx0XHRcdFx0XHRcdGF0dGFjaGVzLnB1c2goYS5pbWFnZV91cmwpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly9UT0RPOiBWZXJpZnkgb3RoZXIgdHlwZSBvZiBhdHRhY2htZW50cyB3aGljaCBuZWVkIHRvIGJlIGhhbmRsZWQgdGhhdCBhcmVuJ3QgZmlsZSB1cGxvYWRzIGFuZCBpbWFnZSB1cmxzXG5cdFx0XHRcdFx0XHQvLyB9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gXHRjb25zb2xlLmxvZyhhKTtcblx0XHRcdFx0XHRcdC8vIH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdHJvd3MucHVzaChgJHsgbWVzc2FnZS5tc2cgfSAoJHsgYXR0YWNoZXMuam9pbignLCAnKSB9KWApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJvd3MucHVzaChtZXNzYWdlLm1zZyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cm93cy5wdXNoKGNsb3NldGQpO1xuXG5cdFx0XHRcdHJvd3MucHVzaChjbG9zZXRyKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAocm93cy5sZW5ndGggIT09IDApIHtcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gc3RhcnQgKyByb3dzLmpvaW4oJycpICsgZW5kO1xuXG5cdFx0XHRcdFJvY2tldENoYXQuc21hcnNoLkhpc3RvcnkudXBzZXJ0KHsgX2lkOiByb29tLl9pZCB9LCB7XG5cdFx0XHRcdFx0X2lkOiByb29tLl9pZCxcblx0XHRcdFx0XHRsYXN0UmFuOiBkYXRlLFxuXHRcdFx0XHRcdGxhc3RSZXN1bHQ6IHJlc3VsdFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRSb2NrZXRDaGF0LnNtYXJzaC5zZW5kRW1haWwoe1xuXHRcdFx0XHRcdGJvZHk6IHJlc3VsdCxcblx0XHRcdFx0XHRzdWJqZWN0OiBgUm9ja2V0LkNoYXQsICR7IGRhdGEudXNlcnMubGVuZ3RoIH0gVXNlcnMsICR7IGRhdGEubXNncyB9IE1lc3NhZ2VzLCAkeyBkYXRhLmZpbGVzLmxlbmd0aCB9IEZpbGVzLCAkeyBkYXRhLnRpbWUgfSBNaW51dGVzLCBpbiAkeyBkYXRhLnJvb20gfWAsXG5cdFx0XHRcdFx0ZmlsZXM6IGRhdGEuZmlsZXNcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufTtcbiIsIi8qIGdsb2JhbHMgU3luY2VkQ3JvbiAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmNvbnN0IHNtYXJzaEpvYk5hbWUgPSAnU21hcnNoIEVNTCBDb25uZWN0b3InO1xuXG5jb25zdCBfYWRkU21hcnNoU3luY2VkQ3JvbkpvYiA9IF8uZGVib3VuY2UoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiBfX2FkZFNtYXJzaFN5bmNlZENyb25Kb2JEZWJvdW5jZWQoKSB7XG5cdGlmIChTeW5jZWRDcm9uLm5leHRTY2hlZHVsZWRBdERhdGUoc21hcnNoSm9iTmFtZSkpIHtcblx0XHRTeW5jZWRDcm9uLnJlbW92ZShzbWFyc2hKb2JOYW1lKTtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU21hcnNoX0VuYWJsZWQnKSAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU21hcnNoX0VtYWlsJykgIT09ICcnICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJykgIT09ICcnKSB7XG5cdFx0U3luY2VkQ3Jvbi5hZGQoe1xuXHRcdFx0bmFtZTogc21hcnNoSm9iTmFtZSxcblx0XHRcdHNjaGVkdWxlOiAocGFyc2VyKSA9PiBwYXJzZXIudGV4dChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU21hcnNoX0ludGVydmFsJykucmVwbGFjZSgvXy9nLCAnICcpKSxcblx0XHRcdGpvYjogUm9ja2V0Q2hhdC5zbWFyc2guZ2VuZXJhdGVFbWxcblx0XHR9KTtcblx0fVxufSksIDUwMCk7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRfYWRkU21hcnNoU3luY2VkQ3JvbkpvYigpO1xuXG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NtYXJzaF9JbnRlcnZhbCcsIF9hZGRTbWFyc2hTeW5jZWRDcm9uSm9iKTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU21hcnNoX0VuYWJsZWQnLCBfYWRkU21hcnNoU3luY2VkQ3JvbkpvYik7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NtYXJzaF9FbWFpbCcsIF9hZGRTbWFyc2hTeW5jZWRDcm9uSm9iKTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcsIF9hZGRTbWFyc2hTeW5jZWRDcm9uSm9iKTtcblx0fSk7XG59KTtcbiJdfQ==
