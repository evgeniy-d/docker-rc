(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:user-data-download":{"server":{"startup":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_user-data-download/server/startup/settings.js                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.settings.addGroup('UserDataDownload', function () {
  this.add('UserData_EnableDownload', true, {
    type: 'boolean',
    public: true,
    i18nLabel: 'UserData_EnableDownload'
  });
  this.add('UserData_FileSystemPath', '', {
    type: 'string',
    public: true,
    i18nLabel: 'UserData_FileSystemPath'
  });
  this.add('UserData_FileSystemZipPath', '', {
    type: 'string',
    public: true,
    i18nLabel: 'UserData_FileSystemZipPath'
  });
  this.add('UserData_ProcessingFrequency', 15, {
    type: 'int',
    public: true,
    i18nLabel: 'UserData_ProcessingFrequency'
  });
  this.add('UserData_MessageLimitPerRequest', 100, {
    type: 'int',
    public: true,
    i18nLabel: 'UserData_MessageLimitPerRequest'
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cronProcessDownloads.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_user-data-download/server/cronProcessDownloads.js                                         //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 1);
let archiver;
module.watch(require("archiver"), {
  default(v) {
    archiver = v;
  }

}, 2);
let zipFolder = '/tmp/zipFiles';

if (RocketChat.settings.get('UserData_FileSystemZipPath') != null) {
  if (RocketChat.settings.get('UserData_FileSystemZipPath').trim() !== '') {
    zipFolder = RocketChat.settings.get('UserData_FileSystemZipPath');
  }
}

let processingFrequency = 15;

if (RocketChat.settings.get('UserData_ProcessingFrequency') > 0) {
  processingFrequency = RocketChat.settings.get('UserData_ProcessingFrequency');
}

const startFile = function (fileName, content) {
  fs.writeFileSync(fileName, content);
};

const writeToFile = function (fileName, content) {
  fs.appendFileSync(fileName, content);
};

const createDir = function (folderName) {
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
};

const loadUserSubscriptions = function (exportOperation) {
  exportOperation.roomList = [];
  const exportUserId = exportOperation.userId;
  const cursor = RocketChat.models.Subscriptions.findByUserId(exportUserId);
  cursor.forEach(subscription => {
    const roomId = subscription.rid;
    const roomData = RocketChat.models.Rooms.findOneById(roomId);
    let roomName = roomData.name ? roomData.name : roomId;
    let userId = null;

    if (subscription.t === 'd') {
      userId = roomId.replace(exportUserId, '');
      const userData = RocketChat.models.Users.findOneById(userId);

      if (userData) {
        roomName = userData.name;
      }
    }

    const fileName = exportOperation.fullExport ? roomId : roomName;
    const fileType = exportOperation.fullExport ? 'json' : 'html';
    const targetFile = `${fileName}.${fileType}`;
    exportOperation.roomList.push({
      roomId,
      roomName,
      userId,
      exportedCount: 0,
      status: 'pending',
      targetFile,
      type: subscription.t
    });
  });

  if (exportOperation.fullExport) {
    exportOperation.status = 'exporting-rooms';
  } else {
    exportOperation.status = 'exporting';
  }
};

const getAttachmentData = function (attachment) {
  const attachmentData = {
    type: attachment.type,
    title: attachment.title,
    title_link: attachment.title_link,
    image_url: attachment.image_url,
    audio_url: attachment.audio_url,
    video_url: attachment.video_url,
    message_link: attachment.message_link,
    image_type: attachment.image_type,
    image_size: attachment.image_size,
    video_size: attachment.video_size,
    video_type: attachment.video_type,
    audio_size: attachment.audio_size,
    audio_type: attachment.audio_type,
    url: null,
    remote: false,
    fileId: null,
    fileName: null
  };
  const url = attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url || attachment.message_link;

  if (url) {
    attachmentData.url = url;
    const urlMatch = /\:\/\//.exec(url);

    if (urlMatch && urlMatch.length > 0) {
      attachmentData.remote = true;
    } else {
      const match = /^\/([^\/]+)\/([^\/]+)\/(.*)/.exec(url);

      if (match && match[2]) {
        const file = RocketChat.models.Uploads.findOneById(match[2]);

        if (file) {
          attachmentData.fileId = file._id;
          attachmentData.fileName = file.name;
        }
      }
    }
  }

  return attachmentData;
};

const addToFileList = function (exportOperation, attachment) {
  const targetFile = path.join(exportOperation.assetsPath, `${attachment.fileId}-${attachment.fileName}`);
  const attachmentData = {
    url: attachment.url,
    copied: false,
    remote: attachment.remote,
    fileId: attachment.fileId,
    fileName: attachment.fileName,
    targetFile
  };
  exportOperation.fileList.push(attachmentData);
};

const getMessageData = function (msg, exportOperation) {
  const attachments = [];

  if (msg.attachments) {
    msg.attachments.forEach(attachment => {
      const attachmentData = getAttachmentData(attachment);
      attachments.push(attachmentData);
      addToFileList(exportOperation, attachmentData);
    });
  }

  const messageObject = {
    msg: msg.msg,
    username: msg.u.username,
    ts: msg.ts
  };

  if (attachments && attachments.length > 0) {
    messageObject.attachments = attachments;
  }

  if (msg.t) {
    messageObject.type = msg.t;
  }

  if (msg.u.name) {
    messageObject.name = msg.u.name;
  }

  return messageObject;
};

const copyFile = function (exportOperation, attachmentData) {
  if (attachmentData.copied || attachmentData.remote || !attachmentData.fileId) {
    attachmentData.copied = true;
    return;
  }

  const file = RocketChat.models.Uploads.findOneById(attachmentData.fileId);

  if (file) {
    if (FileUpload.copy(file, attachmentData.targetFile)) {
      attachmentData.copied = true;
    }
  }
};

const continueExportingRoom = function (exportOperation, exportOpRoomData) {
  createDir(exportOperation.exportPath);
  createDir(exportOperation.assetsPath);
  const filePath = path.join(exportOperation.exportPath, exportOpRoomData.targetFile);

  if (exportOpRoomData.status === 'pending') {
    exportOpRoomData.status = 'exporting';
    startFile(filePath, '');

    if (!exportOperation.fullExport) {
      writeToFile(filePath, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
    }
  }

  let limit = 100;

  if (RocketChat.settings.get('UserData_MessageLimitPerRequest') > 0) {
    limit = RocketChat.settings.get('UserData_MessageLimitPerRequest');
  }

  const skip = exportOpRoomData.exportedCount;
  const cursor = RocketChat.models.Messages.findByRoomId(exportOpRoomData.roomId, {
    limit,
    skip
  });
  const count = cursor.count();
  cursor.forEach(msg => {
    const messageObject = getMessageData(msg, exportOperation);

    if (exportOperation.fullExport) {
      const messageString = JSON.stringify(messageObject);
      writeToFile(filePath, `${messageString}\n`);
    } else {
      const messageType = msg.t;
      const userName = msg.u.username || msg.u.name;
      const timestamp = msg.ts ? new Date(msg.ts).toUTCString() : '';
      let message = msg.msg;

      switch (messageType) {
        case 'uj':
          message = TAPi18n.__('User_joined_channel');
          break;

        case 'ul':
          message = TAPi18n.__('User_left');
          break;

        case 'au':
          message = TAPi18n.__('User_added_by', {
            user_added: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'r':
          message = TAPi18n.__('Room_name_changed', {
            room_name: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'ru':
          message = TAPi18n.__('User_removed_by', {
            user_removed: msg.msg,
            user_by: msg.u.username
          });
          break;

        case 'wm':
          message = TAPi18n.__('Welcome', {
            user: msg.u.username
          });
          break;

        case 'livechat-close':
          message = TAPi18n.__('Conversation_finished');
          break;
      }

      if (message !== msg.msg) {
        message = `<i>${message}</i>`;
      }

      writeToFile(filePath, `<p><strong>${userName}</strong> (${timestamp}):<br/>`);
      writeToFile(filePath, message);

      if (messageObject.attachments && messageObject.attachments.length > 0) {
        messageObject.attachments.forEach(attachment => {
          if (attachment.type === 'file') {
            const description = attachment.description || attachment.title || TAPi18n.__('Message_Attachments');

            const assetUrl = `./assets/${attachment.fileId}-${attachment.fileName}`;
            const link = `<br/><a href="${assetUrl}">${description}</a>`;
            writeToFile(filePath, link);
          }
        });
      }

      writeToFile(filePath, '</p>');
    }

    exportOpRoomData.exportedCount++;
  });

  if (count <= exportOpRoomData.exportedCount) {
    exportOpRoomData.status = 'completed';
    return true;
  }

  return false;
};

const isExportComplete = function (exportOperation) {
  const incomplete = exportOperation.roomList.some(exportOpRoomData => {
    return exportOpRoomData.status !== 'completed';
  });
  return !incomplete;
};

const isDownloadFinished = function (exportOperation) {
  const anyDownloadPending = exportOperation.fileList.some(fileData => {
    return !fileData.copied && !fileData.remote;
  });
  return !anyDownloadPending;
};

const sendEmail = function (userId) {
  const lastFile = RocketChat.models.UserDataFiles.findLastFileByUser(userId);

  if (lastFile) {
    const userData = RocketChat.models.Users.findOneById(userId);

    if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
      const emailAddress = `${userData.name} <${userData.emails[0].address}>`;
      const fromAddress = RocketChat.settings.get('From_Email');

      const subject = TAPi18n.__('UserDataDownload_EmailSubject');

      const download_link = lastFile.url;

      const body = TAPi18n.__('UserDataDownload_EmailBody', {
        download_link
      });

      const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

      if (rfcMailPatternWithName.test(emailAddress)) {
        Meteor.defer(function () {
          return Email.send({
            to: emailAddress,
            from: fromAddress,
            subject,
            html: body
          });
        });
        return console.log(`Sending email to ${emailAddress}`);
      }
    }
  }
};

const makeZipFile = function (exportOperation) {
  createDir(zipFolder);
  const targetFile = path.join(zipFolder, `${exportOperation.userId}.zip`);

  if (fs.existsSync(targetFile)) {
    exportOperation.status = 'uploading';
    return;
  }

  const output = fs.createWriteStream(targetFile);
  exportOperation.generatedFile = targetFile;
  const archive = archiver('zip');
  output.on('close', () => {});
  archive.on('error', err => {
    throw err;
  });
  archive.pipe(output);
  archive.directory(exportOperation.exportPath, false);
  archive.finalize();
};

const uploadZipFile = function (exportOperation, callback) {
  const userDataStore = FileUpload.getStore('UserDataFiles');
  const filePath = exportOperation.generatedFile;
  const stat = Meteor.wrapAsync(fs.stat)(filePath);
  const stream = fs.createReadStream(filePath);
  const contentType = 'application/zip';
  const size = stat.size;
  const userId = exportOperation.userId;
  const user = RocketChat.models.Users.findOneById(userId);
  const userDisplayName = user ? user.name : userId;
  const utcDate = new Date().toISOString().split('T')[0];
  const newFileName = encodeURIComponent(`${utcDate}-${userDisplayName}.zip`);
  const details = {
    userId,
    type: contentType,
    size,
    name: newFileName
  };
  userDataStore.insert(details, stream, err => {
    if (err) {
      throw new Meteor.Error('invalid-file', 'Invalid Zip File', {
        method: 'cronProcessDownloads.uploadZipFile'
      });
    } else {
      callback();
    }
  });
};

const generateChannelsFile = function (exportOperation) {
  if (exportOperation.fullExport) {
    const fileName = path.join(exportOperation.exportPath, 'channels.json');
    startFile(fileName, '');
    exportOperation.roomList.forEach(roomData => {
      const newRoomData = {
        roomId: roomData.roomId,
        roomName: roomData.roomName,
        type: roomData.type
      };
      const messageString = JSON.stringify(newRoomData);
      writeToFile(fileName, `${messageString}\n`);
    });
  }

  exportOperation.status = 'exporting';
};

const continueExportOperation = function (exportOperation) {
  if (exportOperation.status === 'completed') {
    return;
  }

  if (!exportOperation.roomList) {
    loadUserSubscriptions(exportOperation);
  }

  try {
    if (exportOperation.status === 'exporting-rooms') {
      generateChannelsFile(exportOperation);
    } //Run every room on every request, to avoid missing new messages on the rooms that finished first.


    if (exportOperation.status === 'exporting') {
      exportOperation.roomList.forEach(exportOpRoomData => {
        continueExportingRoom(exportOperation, exportOpRoomData);
      });

      if (isExportComplete(exportOperation)) {
        exportOperation.status = 'downloading';
        return;
      }
    }

    if (exportOperation.status === 'downloading') {
      exportOperation.fileList.forEach(attachmentData => {
        copyFile(exportOperation, attachmentData);
      });

      if (isDownloadFinished(exportOperation)) {
        const targetFile = path.join(zipFolder, `${exportOperation.userId}.zip`);

        if (fs.existsSync(targetFile)) {
          fs.unlinkSync(targetFile);
        }

        exportOperation.status = 'compressing';
        return;
      }
    }

    if (exportOperation.status === 'compressing') {
      makeZipFile(exportOperation);
      return;
    }

    if (exportOperation.status === 'uploading') {
      uploadZipFile(exportOperation, () => {
        exportOperation.status = 'completed';
        RocketChat.models.ExportOperations.updateOperation(exportOperation);
      });
      return;
    }
  } catch (e) {
    console.error(e);
  }
};

function processDataDownloads() {
  const cursor = RocketChat.models.ExportOperations.findAllPending({
    limit: 1
  });
  cursor.forEach(exportOperation => {
    if (exportOperation.status === 'completed') {
      return;
    }

    continueExportOperation(exportOperation);
    RocketChat.models.ExportOperations.updateOperation(exportOperation);

    if (exportOperation.status === 'completed') {
      sendEmail(exportOperation.userId);
    }
  });
}

Meteor.startup(function () {
  Meteor.defer(function () {
    processDataDownloads();
    SyncedCron.add({
      name: 'Generate download files for user data',
      schedule: parser => parser.cron(`*/${processingFrequency} * * * *`),
      job: processDataDownloads
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:user-data-download/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:user-data-download/server/cronProcessDownloads.js");

/* Exports */
Package._define("rocketchat:user-data-download");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_user-data-download.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1c2VyLWRhdGEtZG93bmxvYWQvc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dXNlci1kYXRhLWRvd25sb2FkL3NlcnZlci9jcm9uUHJvY2Vzc0Rvd25sb2Fkcy5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJwdWJsaWMiLCJpMThuTGFiZWwiLCJmcyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicGF0aCIsImFyY2hpdmVyIiwiemlwRm9sZGVyIiwiZ2V0IiwidHJpbSIsInByb2Nlc3NpbmdGcmVxdWVuY3kiLCJzdGFydEZpbGUiLCJmaWxlTmFtZSIsImNvbnRlbnQiLCJ3cml0ZUZpbGVTeW5jIiwid3JpdGVUb0ZpbGUiLCJhcHBlbmRGaWxlU3luYyIsImNyZWF0ZURpciIsImZvbGRlck5hbWUiLCJleGlzdHNTeW5jIiwibWtkaXJTeW5jIiwibG9hZFVzZXJTdWJzY3JpcHRpb25zIiwiZXhwb3J0T3BlcmF0aW9uIiwicm9vbUxpc3QiLCJleHBvcnRVc2VySWQiLCJ1c2VySWQiLCJjdXJzb3IiLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwiZmluZEJ5VXNlcklkIiwiZm9yRWFjaCIsInN1YnNjcmlwdGlvbiIsInJvb21JZCIsInJpZCIsInJvb21EYXRhIiwiUm9vbXMiLCJmaW5kT25lQnlJZCIsInJvb21OYW1lIiwibmFtZSIsInQiLCJyZXBsYWNlIiwidXNlckRhdGEiLCJVc2VycyIsImZ1bGxFeHBvcnQiLCJmaWxlVHlwZSIsInRhcmdldEZpbGUiLCJwdXNoIiwiZXhwb3J0ZWRDb3VudCIsInN0YXR1cyIsImdldEF0dGFjaG1lbnREYXRhIiwiYXR0YWNobWVudCIsImF0dGFjaG1lbnREYXRhIiwidGl0bGUiLCJ0aXRsZV9saW5rIiwiaW1hZ2VfdXJsIiwiYXVkaW9fdXJsIiwidmlkZW9fdXJsIiwibWVzc2FnZV9saW5rIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJ2aWRlb19zaXplIiwidmlkZW9fdHlwZSIsImF1ZGlvX3NpemUiLCJhdWRpb190eXBlIiwidXJsIiwicmVtb3RlIiwiZmlsZUlkIiwidXJsTWF0Y2giLCJleGVjIiwibGVuZ3RoIiwibWF0Y2giLCJmaWxlIiwiVXBsb2FkcyIsIl9pZCIsImFkZFRvRmlsZUxpc3QiLCJqb2luIiwiYXNzZXRzUGF0aCIsImNvcGllZCIsImZpbGVMaXN0IiwiZ2V0TWVzc2FnZURhdGEiLCJtc2ciLCJhdHRhY2htZW50cyIsIm1lc3NhZ2VPYmplY3QiLCJ1c2VybmFtZSIsInUiLCJ0cyIsImNvcHlGaWxlIiwiRmlsZVVwbG9hZCIsImNvcHkiLCJjb250aW51ZUV4cG9ydGluZ1Jvb20iLCJleHBvcnRPcFJvb21EYXRhIiwiZXhwb3J0UGF0aCIsImZpbGVQYXRoIiwibGltaXQiLCJza2lwIiwiTWVzc2FnZXMiLCJmaW5kQnlSb29tSWQiLCJjb3VudCIsIm1lc3NhZ2VTdHJpbmciLCJKU09OIiwic3RyaW5naWZ5IiwibWVzc2FnZVR5cGUiLCJ1c2VyTmFtZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJ0b1VUQ1N0cmluZyIsIm1lc3NhZ2UiLCJUQVBpMThuIiwiX18iLCJ1c2VyX2FkZGVkIiwidXNlcl9ieSIsInJvb21fbmFtZSIsInVzZXJfcmVtb3ZlZCIsInVzZXIiLCJkZXNjcmlwdGlvbiIsImFzc2V0VXJsIiwibGluayIsImlzRXhwb3J0Q29tcGxldGUiLCJpbmNvbXBsZXRlIiwic29tZSIsImlzRG93bmxvYWRGaW5pc2hlZCIsImFueURvd25sb2FkUGVuZGluZyIsImZpbGVEYXRhIiwic2VuZEVtYWlsIiwibGFzdEZpbGUiLCJVc2VyRGF0YUZpbGVzIiwiZmluZExhc3RGaWxlQnlVc2VyIiwiZW1haWxzIiwiYWRkcmVzcyIsImVtYWlsQWRkcmVzcyIsImZyb21BZGRyZXNzIiwic3ViamVjdCIsImRvd25sb2FkX2xpbmsiLCJib2R5IiwicmZjTWFpbFBhdHRlcm5XaXRoTmFtZSIsInRlc3QiLCJNZXRlb3IiLCJkZWZlciIsIkVtYWlsIiwic2VuZCIsInRvIiwiZnJvbSIsImh0bWwiLCJjb25zb2xlIiwibG9nIiwibWFrZVppcEZpbGUiLCJvdXRwdXQiLCJjcmVhdGVXcml0ZVN0cmVhbSIsImdlbmVyYXRlZEZpbGUiLCJhcmNoaXZlIiwib24iLCJlcnIiLCJwaXBlIiwiZGlyZWN0b3J5IiwiZmluYWxpemUiLCJ1cGxvYWRaaXBGaWxlIiwiY2FsbGJhY2siLCJ1c2VyRGF0YVN0b3JlIiwiZ2V0U3RvcmUiLCJzdGF0Iiwid3JhcEFzeW5jIiwic3RyZWFtIiwiY3JlYXRlUmVhZFN0cmVhbSIsImNvbnRlbnRUeXBlIiwic2l6ZSIsInVzZXJEaXNwbGF5TmFtZSIsInV0Y0RhdGUiLCJ0b0lTT1N0cmluZyIsInNwbGl0IiwibmV3RmlsZU5hbWUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZXRhaWxzIiwiaW5zZXJ0IiwiRXJyb3IiLCJtZXRob2QiLCJnZW5lcmF0ZUNoYW5uZWxzRmlsZSIsIm5ld1Jvb21EYXRhIiwiY29udGludWVFeHBvcnRPcGVyYXRpb24iLCJ1bmxpbmtTeW5jIiwiRXhwb3J0T3BlcmF0aW9ucyIsInVwZGF0ZU9wZXJhdGlvbiIsImUiLCJlcnJvciIsInByb2Nlc3NEYXRhRG93bmxvYWRzIiwiZmluZEFsbFBlbmRpbmciLCJzdGFydHVwIiwiU3luY2VkQ3JvbiIsInNjaGVkdWxlIiwicGFyc2VyIiwiY3JvbiIsImpvYiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsUUFBWCxDQUFvQkMsUUFBcEIsQ0FBNkIsa0JBQTdCLEVBQWlELFlBQVc7QUFFM0QsT0FBS0MsR0FBTCxDQUFTLHlCQUFULEVBQW9DLElBQXBDLEVBQTBDO0FBQ3pDQyxVQUFNLFNBRG1DO0FBRXpDQyxZQUFRLElBRmlDO0FBR3pDQyxlQUFXO0FBSDhC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MEIsTUFBaEIsS0FBMkIsV0FBL0IsRUFBNEM7QUFDM0M7QUFDQTs7QUFFRGlJLDRCQUF3QjNKLGVBQXhCO0FBQ0E5QixlQUFXbUMsTUFBWCxDQUFrQndKLGdCQUFsQixDQUFtQ0MsZUFBbkMsQ0FBbUQ5SixlQUFuRDs7QUFFQSxRQUFJQSxnQkFBZ0IwQixNQUFoQixLQUEyQixXQUEvQixFQUE0QztBQUMzQzJFLGdCQUFVckcsZ0JBQWdCRyxNQUExQjtBQUNBO0FBQ0QsR0FYRDtBQVlBOztBQUVEK0csT0FBT2lELE9BQVAsQ0FBZSxZQUFXO0FBQ3pCakQsU0FBT0MsS0FBUCxDQUFhLFlBQVc7QUFDdkI4QztBQUVBRyxlQUFXL0wsR0FBWCxDQUFlO0FBQ2QyQyxZQUFNLHVDQURRO0FBRWRxSixnQkFBV0MsTUFBRCxJQUFZQSxPQUFPQyxJQUFQLENBQWEsS0FBS25MLG1CQUFxQixVQUF2QyxDQUZSO0FBR2RvTCxXQUFLUDtBQUhTLEtBQWY7QUFLQSxHQVJEO0FBU0EsQ0FWRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3VzZXItZGF0YS1kb3dubG9hZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ1VzZXJEYXRhRG93bmxvYWQnLCBmdW5jdGlvbigpIHtcblxuXHR0aGlzLmFkZCgnVXNlckRhdGFfRW5hYmxlRG93bmxvYWQnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdVc2VyRGF0YV9FbmFibGVEb3dubG9hZCdcblx0fSk7XG5cblx0dGhpcy5hZGQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1QYXRoJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVXNlckRhdGFfRmlsZVN5c3RlbVBhdGgnXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdVc2VyRGF0YV9GaWxlU3lzdGVtWmlwUGF0aCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJ1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnVXNlckRhdGFfUHJvY2Vzc2luZ0ZyZXF1ZW5jeScsIDE1LCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX1Byb2Nlc3NpbmdGcmVxdWVuY3knXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdVc2VyRGF0YV9NZXNzYWdlTGltaXRQZXJSZXF1ZXN0JywgMTAwLCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1VzZXJEYXRhX01lc3NhZ2VMaW1pdFBlclJlcXVlc3QnXG5cdH0pO1xuXG5cbn0pO1xuIiwiLyogZ2xvYmFscyBTeW5jZWRDcm9uICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBhcmNoaXZlciBmcm9tICdhcmNoaXZlcic7XG5cbmxldCB6aXBGb2xkZXIgPSAnL3RtcC96aXBGaWxlcyc7XG5pZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJykgIT0gbnVsbCkge1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX0ZpbGVTeXN0ZW1aaXBQYXRoJykudHJpbSgpICE9PSAnJykge1xuXHRcdHppcEZvbGRlciA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVc2VyRGF0YV9GaWxlU3lzdGVtWmlwUGF0aCcpO1xuXHR9XG59XG5cbmxldCBwcm9jZXNzaW5nRnJlcXVlbmN5ID0gMTU7XG5pZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX1Byb2Nlc3NpbmdGcmVxdWVuY3knKSA+IDApIHtcblx0cHJvY2Vzc2luZ0ZyZXF1ZW5jeSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVc2VyRGF0YV9Qcm9jZXNzaW5nRnJlcXVlbmN5Jyk7XG59XG5cbmNvbnN0IHN0YXJ0RmlsZSA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBjb250ZW50KSB7XG5cdGZzLndyaXRlRmlsZVN5bmMoZmlsZU5hbWUsIGNvbnRlbnQpO1xufTtcblxuY29uc3Qgd3JpdGVUb0ZpbGUgPSBmdW5jdGlvbihmaWxlTmFtZSwgY29udGVudCkge1xuXHRmcy5hcHBlbmRGaWxlU3luYyhmaWxlTmFtZSwgY29udGVudCk7XG59O1xuXG5jb25zdCBjcmVhdGVEaXIgPSBmdW5jdGlvbihmb2xkZXJOYW1lKSB7XG5cdGlmICghZnMuZXhpc3RzU3luYyhmb2xkZXJOYW1lKSkge1xuXHRcdGZzLm1rZGlyU3luYyhmb2xkZXJOYW1lKTtcblx0fVxufTtcblxuY29uc3QgbG9hZFVzZXJTdWJzY3JpcHRpb25zID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdCA9IFtdO1xuXG5cdGNvbnN0IGV4cG9ydFVzZXJJZCA9IGV4cG9ydE9wZXJhdGlvbi51c2VySWQ7XG5cdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5VXNlcklkKGV4cG9ydFVzZXJJZCk7XG5cdGN1cnNvci5mb3JFYWNoKChzdWJzY3JpcHRpb24pID0+IHtcblx0XHRjb25zdCByb29tSWQgPSBzdWJzY3JpcHRpb24ucmlkO1xuXHRcdGNvbnN0IHJvb21EYXRhID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0XHRsZXQgcm9vbU5hbWUgPSByb29tRGF0YS5uYW1lID8gcm9vbURhdGEubmFtZSA6IHJvb21JZDtcblx0XHRsZXQgdXNlcklkID0gbnVsbDtcblxuXHRcdGlmIChzdWJzY3JpcHRpb24udCA9PT0gJ2QnKSB7XG5cdFx0XHR1c2VySWQgPSByb29tSWQucmVwbGFjZShleHBvcnRVc2VySWQsICcnKTtcblx0XHRcdGNvbnN0IHVzZXJEYXRhID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRcdFx0aWYgKHVzZXJEYXRhKSB7XG5cdFx0XHRcdHJvb21OYW1lID0gdXNlckRhdGEubmFtZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBmaWxlTmFtZSA9IGV4cG9ydE9wZXJhdGlvbi5mdWxsRXhwb3J0ID8gcm9vbUlkIDogcm9vbU5hbWU7XG5cdFx0Y29uc3QgZmlsZVR5cGUgPSBleHBvcnRPcGVyYXRpb24uZnVsbEV4cG9ydCA/ICdqc29uJyA6ICdodG1sJztcblx0XHRjb25zdCB0YXJnZXRGaWxlID0gYCR7IGZpbGVOYW1lIH0uJHsgZmlsZVR5cGUgfWA7XG5cblx0XHRleHBvcnRPcGVyYXRpb24ucm9vbUxpc3QucHVzaCh7XG5cdFx0XHRyb29tSWQsXG5cdFx0XHRyb29tTmFtZSxcblx0XHRcdHVzZXJJZCxcblx0XHRcdGV4cG9ydGVkQ291bnQ6IDAsXG5cdFx0XHRzdGF0dXM6ICdwZW5kaW5nJyxcblx0XHRcdHRhcmdldEZpbGUsXG5cdFx0XHR0eXBlOiBzdWJzY3JpcHRpb24udFxuXHRcdH0pO1xuXHR9KTtcblxuXHRpZiAoZXhwb3J0T3BlcmF0aW9uLmZ1bGxFeHBvcnQpIHtcblx0XHRleHBvcnRPcGVyYXRpb24uc3RhdHVzID0gJ2V4cG9ydGluZy1yb29tcyc7XG5cdH0gZWxzZSB7XG5cdFx0ZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9ICdleHBvcnRpbmcnO1xuXHR9XG59O1xuXG5jb25zdCBnZXRBdHRhY2htZW50RGF0YSA9IGZ1bmN0aW9uKGF0dGFjaG1lbnQpIHtcblx0Y29uc3QgYXR0YWNobWVudERhdGEgPSB7XG5cdFx0dHlwZSA6IGF0dGFjaG1lbnQudHlwZSxcblx0XHR0aXRsZTogYXR0YWNobWVudC50aXRsZSxcblx0XHR0aXRsZV9saW5rOiBhdHRhY2htZW50LnRpdGxlX2xpbmssXG5cdFx0aW1hZ2VfdXJsOiBhdHRhY2htZW50LmltYWdlX3VybCxcblx0XHRhdWRpb191cmw6IGF0dGFjaG1lbnQuYXVkaW9fdXJsLFxuXHRcdHZpZGVvX3VybDogYXR0YWNobWVudC52aWRlb191cmwsXG5cdFx0bWVzc2FnZV9saW5rOiBhdHRhY2htZW50Lm1lc3NhZ2VfbGluayxcblx0XHRpbWFnZV90eXBlOiBhdHRhY2htZW50LmltYWdlX3R5cGUsXG5cdFx0aW1hZ2Vfc2l6ZTogYXR0YWNobWVudC5pbWFnZV9zaXplLFxuXHRcdHZpZGVvX3NpemU6IGF0dGFjaG1lbnQudmlkZW9fc2l6ZSxcblx0XHR2aWRlb190eXBlOiBhdHRhY2htZW50LnZpZGVvX3R5cGUsXG5cdFx0YXVkaW9fc2l6ZTogYXR0YWNobWVudC5hdWRpb19zaXplLFxuXHRcdGF1ZGlvX3R5cGU6IGF0dGFjaG1lbnQuYXVkaW9fdHlwZSxcblx0XHR1cmw6IG51bGwsXG5cdFx0cmVtb3RlOiBmYWxzZSxcblx0XHRmaWxlSWQ6IG51bGwsXG5cdFx0ZmlsZU5hbWU6IG51bGxcblx0fTtcblxuXHRjb25zdCB1cmwgPSBhdHRhY2htZW50LnRpdGxlX2xpbmsgfHwgYXR0YWNobWVudC5pbWFnZV91cmwgfHwgYXR0YWNobWVudC5hdWRpb191cmwgfHwgYXR0YWNobWVudC52aWRlb191cmwgfHwgYXR0YWNobWVudC5tZXNzYWdlX2xpbms7XG5cdGlmICh1cmwpIHtcblx0XHRhdHRhY2htZW50RGF0YS51cmwgPSB1cmw7XG5cblx0XHRjb25zdCB1cmxNYXRjaCA9IC9cXDpcXC9cXC8vLmV4ZWModXJsKTtcblx0XHRpZiAodXJsTWF0Y2ggJiYgdXJsTWF0Y2gubGVuZ3RoID4gMCkge1xuXHRcdFx0YXR0YWNobWVudERhdGEucmVtb3RlID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgbWF0Y2ggPSAvXlxcLyhbXlxcL10rKVxcLyhbXlxcL10rKVxcLyguKikvLmV4ZWModXJsKTtcblxuXHRcdFx0aWYgKG1hdGNoICYmIG1hdGNoWzJdKSB7XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKG1hdGNoWzJdKTtcblxuXHRcdFx0XHRpZiAoZmlsZSkge1xuXHRcdFx0XHRcdGF0dGFjaG1lbnREYXRhLmZpbGVJZCA9IGZpbGUuX2lkO1xuXHRcdFx0XHRcdGF0dGFjaG1lbnREYXRhLmZpbGVOYW1lID0gZmlsZS5uYW1lO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGF0dGFjaG1lbnREYXRhO1xufTtcblxuY29uc3QgYWRkVG9GaWxlTGlzdCA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbiwgYXR0YWNobWVudCkge1xuXHRjb25zdCB0YXJnZXRGaWxlID0gcGF0aC5qb2luKGV4cG9ydE9wZXJhdGlvbi5hc3NldHNQYXRoLCBgJHsgYXR0YWNobWVudC5maWxlSWQgfS0keyBhdHRhY2htZW50LmZpbGVOYW1lIH1gKTtcblxuXHRjb25zdCBhdHRhY2htZW50RGF0YSA9IHtcblx0XHR1cmw6IGF0dGFjaG1lbnQudXJsLFxuXHRcdGNvcGllZDogZmFsc2UsXG5cdFx0cmVtb3RlOiBhdHRhY2htZW50LnJlbW90ZSxcblx0XHRmaWxlSWQ6IGF0dGFjaG1lbnQuZmlsZUlkLFxuXHRcdGZpbGVOYW1lOiBhdHRhY2htZW50LmZpbGVOYW1lLFxuXHRcdHRhcmdldEZpbGVcblx0fTtcblxuXHRleHBvcnRPcGVyYXRpb24uZmlsZUxpc3QucHVzaChhdHRhY2htZW50RGF0YSk7XG59O1xuXG5jb25zdCBnZXRNZXNzYWdlRGF0YSA9IGZ1bmN0aW9uKG1zZywgZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGNvbnN0IGF0dGFjaG1lbnRzID0gW107XG5cblx0aWYgKG1zZy5hdHRhY2htZW50cykge1xuXHRcdG1zZy5hdHRhY2htZW50cy5mb3JFYWNoKChhdHRhY2htZW50KSA9PiB7XG5cdFx0XHRjb25zdCBhdHRhY2htZW50RGF0YSA9IGdldEF0dGFjaG1lbnREYXRhKGF0dGFjaG1lbnQpO1xuXG5cdFx0XHRhdHRhY2htZW50cy5wdXNoKGF0dGFjaG1lbnREYXRhKTtcblx0XHRcdGFkZFRvRmlsZUxpc3QoZXhwb3J0T3BlcmF0aW9uLCBhdHRhY2htZW50RGF0YSk7XG5cdFx0fSk7XG5cdH1cblxuXHRjb25zdCBtZXNzYWdlT2JqZWN0ID0ge1xuXHRcdG1zZzogbXNnLm1zZyxcblx0XHR1c2VybmFtZTogbXNnLnUudXNlcm5hbWUsXG5cdFx0dHM6IG1zZy50c1xuXHR9O1xuXG5cdGlmIChhdHRhY2htZW50cyAmJiBhdHRhY2htZW50cy5sZW5ndGggPiAwKSB7XG5cdFx0bWVzc2FnZU9iamVjdC5hdHRhY2htZW50cyA9IGF0dGFjaG1lbnRzO1xuXHR9XG5cdGlmIChtc2cudCkge1xuXHRcdG1lc3NhZ2VPYmplY3QudHlwZSA9IG1zZy50O1xuXHR9XG5cdGlmIChtc2cudS5uYW1lKSB7XG5cdFx0bWVzc2FnZU9iamVjdC5uYW1lID0gbXNnLnUubmFtZTtcblx0fVxuXG5cdHJldHVybiBtZXNzYWdlT2JqZWN0O1xufTtcblxuY29uc3QgY29weUZpbGUgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24sIGF0dGFjaG1lbnREYXRhKSB7XG5cdGlmIChhdHRhY2htZW50RGF0YS5jb3BpZWQgfHwgYXR0YWNobWVudERhdGEucmVtb3RlIHx8ICFhdHRhY2htZW50RGF0YS5maWxlSWQpIHtcblx0XHRhdHRhY2htZW50RGF0YS5jb3BpZWQgPSB0cnVlO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKGF0dGFjaG1lbnREYXRhLmZpbGVJZCk7XG5cblx0aWYgKGZpbGUpIHtcblx0XHRpZiAoRmlsZVVwbG9hZC5jb3B5KGZpbGUsIGF0dGFjaG1lbnREYXRhLnRhcmdldEZpbGUpKSB7XG5cdFx0XHRhdHRhY2htZW50RGF0YS5jb3BpZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxufTtcblxuY29uc3QgY29udGludWVFeHBvcnRpbmdSb29tID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uLCBleHBvcnRPcFJvb21EYXRhKSB7XG5cdGNyZWF0ZURpcihleHBvcnRPcGVyYXRpb24uZXhwb3J0UGF0aCk7XG5cdGNyZWF0ZURpcihleHBvcnRPcGVyYXRpb24uYXNzZXRzUGF0aCk7XG5cblx0Y29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZXhwb3J0T3BlcmF0aW9uLmV4cG9ydFBhdGgsIGV4cG9ydE9wUm9vbURhdGEudGFyZ2V0RmlsZSk7XG5cblx0aWYgKGV4cG9ydE9wUm9vbURhdGEuc3RhdHVzID09PSAncGVuZGluZycpIHtcblx0XHRleHBvcnRPcFJvb21EYXRhLnN0YXR1cyA9ICdleHBvcnRpbmcnO1xuXHRcdHN0YXJ0RmlsZShmaWxlUGF0aCwgJycpO1xuXHRcdGlmICghZXhwb3J0T3BlcmF0aW9uLmZ1bGxFeHBvcnQpIHtcblx0XHRcdHdyaXRlVG9GaWxlKGZpbGVQYXRoLCAnPG1ldGEgaHR0cC1lcXVpdj1cImNvbnRlbnQtdHlwZVwiIGNvbnRlbnQ9XCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLThcIj4nKTtcblx0XHR9XG5cdH1cblxuXHRsZXQgbGltaXQgPSAxMDA7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVXNlckRhdGFfTWVzc2FnZUxpbWl0UGVyUmVxdWVzdCcpID4gMCkge1xuXHRcdGxpbWl0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VzZXJEYXRhX01lc3NhZ2VMaW1pdFBlclJlcXVlc3QnKTtcblx0fVxuXG5cdGNvbnN0IHNraXAgPSBleHBvcnRPcFJvb21EYXRhLmV4cG9ydGVkQ291bnQ7XG5cblx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZEJ5Um9vbUlkKGV4cG9ydE9wUm9vbURhdGEucm9vbUlkLCB7IGxpbWl0LCBza2lwIH0pO1xuXHRjb25zdCBjb3VudCA9IGN1cnNvci5jb3VudCgpO1xuXG5cdGN1cnNvci5mb3JFYWNoKChtc2cpID0+IHtcblx0XHRjb25zdCBtZXNzYWdlT2JqZWN0ID0gZ2V0TWVzc2FnZURhdGEobXNnLCBleHBvcnRPcGVyYXRpb24pO1xuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5mdWxsRXhwb3J0KSB7XG5cdFx0XHRjb25zdCBtZXNzYWdlU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZU9iamVjdCk7XG5cdFx0XHR3cml0ZVRvRmlsZShmaWxlUGF0aCwgYCR7IG1lc3NhZ2VTdHJpbmcgfVxcbmApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBtZXNzYWdlVHlwZSA9IG1zZy50O1xuXHRcdFx0Y29uc3QgdXNlck5hbWUgPSBtc2cudS51c2VybmFtZSB8fCBtc2cudS5uYW1lO1xuXHRcdFx0Y29uc3QgdGltZXN0YW1wID0gbXNnLnRzID8gbmV3IERhdGUobXNnLnRzKS50b1VUQ1N0cmluZygpIDogJyc7XG5cdFx0XHRsZXQgbWVzc2FnZSA9IG1zZy5tc2c7XG5cblx0XHRcdHN3aXRjaCAobWVzc2FnZVR5cGUpIHtcblx0XHRcdFx0Y2FzZSAndWonOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdVc2VyX2pvaW5lZF9jaGFubmVsJyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3VsJzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnVXNlcl9sZWZ0Jyk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2F1Jzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnVXNlcl9hZGRlZF9ieScsIHt1c2VyX2FkZGVkIDogbXNnLm1zZywgdXNlcl9ieSA6IG1zZy51LnVzZXJuYW1lIH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyJzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnUm9vbV9uYW1lX2NoYW5nZWQnLCB7IHJvb21fbmFtZTogbXNnLm1zZywgdXNlcl9ieTogbXNnLnUudXNlcm5hbWUgfSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3J1Jzpcblx0XHRcdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnVXNlcl9yZW1vdmVkX2J5Jywge3VzZXJfcmVtb3ZlZCA6IG1zZy5tc2csIHVzZXJfYnkgOiBtc2cudS51c2VybmFtZSB9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnd20nOlxuXHRcdFx0XHRcdG1lc3NhZ2UgPSBUQVBpMThuLl9fKCdXZWxjb21lJywge3VzZXI6IG1zZy51LnVzZXJuYW1lIH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdsaXZlY2hhdC1jbG9zZSc6XG5cdFx0XHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ0NvbnZlcnNhdGlvbl9maW5pc2hlZCcpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAobWVzc2FnZSAhPT0gbXNnLm1zZykge1xuXHRcdFx0XHRtZXNzYWdlID0gYDxpPiR7IG1lc3NhZ2UgfTwvaT5gO1xuXHRcdFx0fVxuXG5cdFx0XHR3cml0ZVRvRmlsZShmaWxlUGF0aCwgYDxwPjxzdHJvbmc+JHsgdXNlck5hbWUgfTwvc3Ryb25nPiAoJHsgdGltZXN0YW1wIH0pOjxici8+YCk7XG5cdFx0XHR3cml0ZVRvRmlsZShmaWxlUGF0aCwgbWVzc2FnZSk7XG5cblx0XHRcdGlmIChtZXNzYWdlT2JqZWN0LmF0dGFjaG1lbnRzICYmIG1lc3NhZ2VPYmplY3QuYXR0YWNobWVudHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRtZXNzYWdlT2JqZWN0LmF0dGFjaG1lbnRzLmZvckVhY2goKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdFx0XHRpZiAoYXR0YWNobWVudC50eXBlID09PSAnZmlsZScpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGRlc2NyaXB0aW9uID0gYXR0YWNobWVudC5kZXNjcmlwdGlvbiB8fCBhdHRhY2htZW50LnRpdGxlIHx8IFRBUGkxOG4uX18oJ01lc3NhZ2VfQXR0YWNobWVudHMnKTtcblxuXHRcdFx0XHRcdFx0Y29uc3QgYXNzZXRVcmwgPSBgLi9hc3NldHMvJHsgYXR0YWNobWVudC5maWxlSWQgfS0keyBhdHRhY2htZW50LmZpbGVOYW1lIH1gO1xuXHRcdFx0XHRcdFx0Y29uc3QgbGluayA9IGA8YnIvPjxhIGhyZWY9XCIkeyBhc3NldFVybCB9XCI+JHsgZGVzY3JpcHRpb24gfTwvYT5gO1xuXHRcdFx0XHRcdFx0d3JpdGVUb0ZpbGUoZmlsZVBhdGgsIGxpbmspO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHdyaXRlVG9GaWxlKGZpbGVQYXRoLCAnPC9wPicpO1xuXHRcdH1cblxuXHRcdGV4cG9ydE9wUm9vbURhdGEuZXhwb3J0ZWRDb3VudCsrO1xuXHR9KTtcblxuXHRpZiAoY291bnQgPD0gZXhwb3J0T3BSb29tRGF0YS5leHBvcnRlZENvdW50KSB7XG5cdFx0ZXhwb3J0T3BSb29tRGF0YS5zdGF0dXMgPSAnY29tcGxldGVkJztcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn07XG5cbmNvbnN0IGlzRXhwb3J0Q29tcGxldGUgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24pIHtcblx0Y29uc3QgaW5jb21wbGV0ZSA9IGV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdC5zb21lKChleHBvcnRPcFJvb21EYXRhKSA9PiB7XG5cdFx0cmV0dXJuIGV4cG9ydE9wUm9vbURhdGEuc3RhdHVzICE9PSAnY29tcGxldGVkJztcblx0fSk7XG5cblx0cmV0dXJuICFpbmNvbXBsZXRlO1xufTtcblxuY29uc3QgaXNEb3dubG9hZEZpbmlzaGVkID0gZnVuY3Rpb24oZXhwb3J0T3BlcmF0aW9uKSB7XG5cdGNvbnN0IGFueURvd25sb2FkUGVuZGluZyA9IGV4cG9ydE9wZXJhdGlvbi5maWxlTGlzdC5zb21lKChmaWxlRGF0YSkgPT4ge1xuXHRcdHJldHVybiAhZmlsZURhdGEuY29waWVkICYmICFmaWxlRGF0YS5yZW1vdGU7XG5cdH0pO1xuXG5cdHJldHVybiAhYW55RG93bmxvYWRQZW5kaW5nO1xufTtcblxuY29uc3Qgc2VuZEVtYWlsID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdGNvbnN0IGxhc3RGaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlckRhdGFGaWxlcy5maW5kTGFzdEZpbGVCeVVzZXIodXNlcklkKTtcblx0aWYgKGxhc3RGaWxlKSB7XG5cdFx0Y29uc3QgdXNlckRhdGEgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXG5cdFx0aWYgKHVzZXJEYXRhICYmIHVzZXJEYXRhLmVtYWlscyAmJiB1c2VyRGF0YS5lbWFpbHNbMF0gJiYgdXNlckRhdGEuZW1haWxzWzBdLmFkZHJlc3MpIHtcblx0XHRcdGNvbnN0IGVtYWlsQWRkcmVzcyA9IGAkeyB1c2VyRGF0YS5uYW1lIH0gPCR7IHVzZXJEYXRhLmVtYWlsc1swXS5hZGRyZXNzIH0+YDtcblx0XHRcdGNvbnN0IGZyb21BZGRyZXNzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKTtcblx0XHRcdGNvbnN0IHN1YmplY3QgPSBUQVBpMThuLl9fKCdVc2VyRGF0YURvd25sb2FkX0VtYWlsU3ViamVjdCcpO1xuXG5cdFx0XHRjb25zdCBkb3dubG9hZF9saW5rID0gbGFzdEZpbGUudXJsO1xuXHRcdFx0Y29uc3QgYm9keSA9IFRBUGkxOG4uX18oJ1VzZXJEYXRhRG93bmxvYWRfRW1haWxCb2R5JywgeyBkb3dubG9hZF9saW5rIH0pO1xuXG5cdFx0XHRjb25zdCByZmNNYWlsUGF0dGVybldpdGhOYW1lID0gL14oPzouKjwpPyhbYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqKSg/Oj4/KSQvO1xuXG5cdFx0XHRpZiAocmZjTWFpbFBhdHRlcm5XaXRoTmFtZS50ZXN0KGVtYWlsQWRkcmVzcykpIHtcblx0XHRcdFx0TWV0ZW9yLmRlZmVyKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiBFbWFpbC5zZW5kKHtcblx0XHRcdFx0XHRcdHRvOiBlbWFpbEFkZHJlc3MsXG5cdFx0XHRcdFx0XHRmcm9tOiBmcm9tQWRkcmVzcyxcblx0XHRcdFx0XHRcdHN1YmplY3QsXG5cdFx0XHRcdFx0XHRodG1sOiBib2R5XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHJldHVybiBjb25zb2xlLmxvZyhgU2VuZGluZyBlbWFpbCB0byAkeyBlbWFpbEFkZHJlc3MgfWApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuY29uc3QgbWFrZVppcEZpbGUgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24pIHtcblx0Y3JlYXRlRGlyKHppcEZvbGRlcik7XG5cblx0Y29uc3QgdGFyZ2V0RmlsZSA9IHBhdGguam9pbih6aXBGb2xkZXIsIGAkeyBleHBvcnRPcGVyYXRpb24udXNlcklkIH0uemlwYCk7XG5cdGlmIChmcy5leGlzdHNTeW5jKHRhcmdldEZpbGUpKSB7XG5cdFx0ZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9ICd1cGxvYWRpbmcnO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IG91dHB1dCA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRhcmdldEZpbGUpO1xuXG5cdGV4cG9ydE9wZXJhdGlvbi5nZW5lcmF0ZWRGaWxlID0gdGFyZ2V0RmlsZTtcblxuXHRjb25zdCBhcmNoaXZlID0gYXJjaGl2ZXIoJ3ppcCcpO1xuXG5cdG91dHB1dC5vbignY2xvc2UnLCAoKSA9PiB7XG5cdH0pO1xuXG5cdGFyY2hpdmUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuXHRcdHRocm93IGVycjtcblx0fSk7XG5cblx0YXJjaGl2ZS5waXBlKG91dHB1dCk7XG5cdGFyY2hpdmUuZGlyZWN0b3J5KGV4cG9ydE9wZXJhdGlvbi5leHBvcnRQYXRoLCBmYWxzZSk7XG5cdGFyY2hpdmUuZmluYWxpemUoKTtcbn07XG5cbmNvbnN0IHVwbG9hZFppcEZpbGUgPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24sIGNhbGxiYWNrKSB7XG5cdGNvbnN0IHVzZXJEYXRhU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVc2VyRGF0YUZpbGVzJyk7XG5cdGNvbnN0IGZpbGVQYXRoID0gZXhwb3J0T3BlcmF0aW9uLmdlbmVyYXRlZEZpbGU7XG5cblx0Y29uc3Qgc3RhdCA9IE1ldGVvci53cmFwQXN5bmMoZnMuc3RhdCkoZmlsZVBhdGgpO1xuXHRjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcblxuXHRjb25zdCBjb250ZW50VHlwZSA9ICdhcHBsaWNhdGlvbi96aXAnO1xuXHRjb25zdCBzaXplID0gc3RhdC5zaXplO1xuXG5cdGNvbnN0IHVzZXJJZCA9IGV4cG9ydE9wZXJhdGlvbi51c2VySWQ7XG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXHRjb25zdCB1c2VyRGlzcGxheU5hbWUgPSB1c2VyID8gdXNlci5uYW1lIDogdXNlcklkO1xuXHRjb25zdCB1dGNEYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG5cblx0Y29uc3QgbmV3RmlsZU5hbWUgPSBlbmNvZGVVUklDb21wb25lbnQoYCR7IHV0Y0RhdGUgfS0keyB1c2VyRGlzcGxheU5hbWUgfS56aXBgKTtcblxuXHRjb25zdCBkZXRhaWxzID0ge1xuXHRcdHVzZXJJZCxcblx0XHR0eXBlOiBjb250ZW50VHlwZSxcblx0XHRzaXplLFxuXHRcdG5hbWU6IG5ld0ZpbGVOYW1lXG5cdH07XG5cblx0dXNlckRhdGFTdG9yZS5pbnNlcnQoZGV0YWlscywgc3RyZWFtLCAoZXJyKSA9PiB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWxlJywgJ0ludmFsaWQgWmlwIEZpbGUnLCB7IG1ldGhvZDogJ2Nyb25Qcm9jZXNzRG93bmxvYWRzLnVwbG9hZFppcEZpbGUnIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjYWxsYmFjaygpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5jb25zdCBnZW5lcmF0ZUNoYW5uZWxzRmlsZSA9IGZ1bmN0aW9uKGV4cG9ydE9wZXJhdGlvbikge1xuXHRpZiAoZXhwb3J0T3BlcmF0aW9uLmZ1bGxFeHBvcnQpIHtcblx0XHRjb25zdCBmaWxlTmFtZSA9IHBhdGguam9pbihleHBvcnRPcGVyYXRpb24uZXhwb3J0UGF0aCwgJ2NoYW5uZWxzLmpzb24nKTtcblx0XHRzdGFydEZpbGUoZmlsZU5hbWUsICcnKTtcblxuXHRcdGV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdC5mb3JFYWNoKChyb29tRGF0YSkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3Um9vbURhdGEgPSB7XG5cdFx0XHRcdHJvb21JZDogcm9vbURhdGEucm9vbUlkLFxuXHRcdFx0XHRyb29tTmFtZTogcm9vbURhdGEucm9vbU5hbWUsXG5cdFx0XHRcdHR5cGU6IHJvb21EYXRhLnR5cGVcblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IG1lc3NhZ2VTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShuZXdSb29tRGF0YSk7XG5cdFx0XHR3cml0ZVRvRmlsZShmaWxlTmFtZSwgYCR7IG1lc3NhZ2VTdHJpbmcgfVxcbmApO1xuXHRcdH0pO1xuXHR9XG5cblx0ZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9ICdleHBvcnRpbmcnO1xufTtcblxuY29uc3QgY29udGludWVFeHBvcnRPcGVyYXRpb24gPSBmdW5jdGlvbihleHBvcnRPcGVyYXRpb24pIHtcblx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKCFleHBvcnRPcGVyYXRpb24ucm9vbUxpc3QpIHtcblx0XHRsb2FkVXNlclN1YnNjcmlwdGlvbnMoZXhwb3J0T3BlcmF0aW9uKTtcblx0fVxuXG5cdHRyeSB7XG5cblx0XHRpZiAoZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9PT0gJ2V4cG9ydGluZy1yb29tcycpIHtcblx0XHRcdGdlbmVyYXRlQ2hhbm5lbHNGaWxlKGV4cG9ydE9wZXJhdGlvbik7XG5cdFx0fVxuXG5cdFx0Ly9SdW4gZXZlcnkgcm9vbSBvbiBldmVyeSByZXF1ZXN0LCB0byBhdm9pZCBtaXNzaW5nIG5ldyBtZXNzYWdlcyBvbiB0aGUgcm9vbXMgdGhhdCBmaW5pc2hlZCBmaXJzdC5cblx0XHRpZiAoZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9PT0gJ2V4cG9ydGluZycpIHtcblx0XHRcdGV4cG9ydE9wZXJhdGlvbi5yb29tTGlzdC5mb3JFYWNoKChleHBvcnRPcFJvb21EYXRhKSA9PiB7XG5cdFx0XHRcdGNvbnRpbnVlRXhwb3J0aW5nUm9vbShleHBvcnRPcGVyYXRpb24sIGV4cG9ydE9wUm9vbURhdGEpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChpc0V4cG9ydENvbXBsZXRlKGV4cG9ydE9wZXJhdGlvbikpIHtcblx0XHRcdFx0ZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9ICdkb3dubG9hZGluZyc7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9PT0gJ2Rvd25sb2FkaW5nJykge1xuXHRcdFx0ZXhwb3J0T3BlcmF0aW9uLmZpbGVMaXN0LmZvckVhY2goKGF0dGFjaG1lbnREYXRhKSA9PiB7XG5cdFx0XHRcdGNvcHlGaWxlKGV4cG9ydE9wZXJhdGlvbiwgYXR0YWNobWVudERhdGEpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChpc0Rvd25sb2FkRmluaXNoZWQoZXhwb3J0T3BlcmF0aW9uKSkge1xuXHRcdFx0XHRjb25zdCB0YXJnZXRGaWxlID0gcGF0aC5qb2luKHppcEZvbGRlciwgYCR7IGV4cG9ydE9wZXJhdGlvbi51c2VySWQgfS56aXBgKTtcblx0XHRcdFx0aWYgKGZzLmV4aXN0c1N5bmModGFyZ2V0RmlsZSkpIHtcblx0XHRcdFx0XHRmcy51bmxpbmtTeW5jKHRhcmdldEZpbGUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9ICdjb21wcmVzc2luZyc7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9PT0gJ2NvbXByZXNzaW5nJykge1xuXHRcdFx0bWFrZVppcEZpbGUoZXhwb3J0T3BlcmF0aW9uKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoZXhwb3J0T3BlcmF0aW9uLnN0YXR1cyA9PT0gJ3VwbG9hZGluZycpIHtcblx0XHRcdHVwbG9hZFppcEZpbGUoZXhwb3J0T3BlcmF0aW9uLCAoKSA9PiB7XG5cdFx0XHRcdGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPSAnY29tcGxldGVkJztcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuRXhwb3J0T3BlcmF0aW9ucy51cGRhdGVPcGVyYXRpb24oZXhwb3J0T3BlcmF0aW9uKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fSBjYXRjaCAoZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHByb2Nlc3NEYXRhRG93bmxvYWRzKCkge1xuXHRjb25zdCBjdXJzb3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5FeHBvcnRPcGVyYXRpb25zLmZpbmRBbGxQZW5kaW5nKHtsaW1pdDogMX0pO1xuXHRjdXJzb3IuZm9yRWFjaCgoZXhwb3J0T3BlcmF0aW9uKSA9PiB7XG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29udGludWVFeHBvcnRPcGVyYXRpb24oZXhwb3J0T3BlcmF0aW9uKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5FeHBvcnRPcGVyYXRpb25zLnVwZGF0ZU9wZXJhdGlvbihleHBvcnRPcGVyYXRpb24pO1xuXG5cdFx0aWYgKGV4cG9ydE9wZXJhdGlvbi5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSB7XG5cdFx0XHRzZW5kRW1haWwoZXhwb3J0T3BlcmF0aW9uLnVzZXJJZCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdE1ldGVvci5kZWZlcihmdW5jdGlvbigpIHtcblx0XHRwcm9jZXNzRGF0YURvd25sb2FkcygpO1xuXG5cdFx0U3luY2VkQ3Jvbi5hZGQoe1xuXHRcdFx0bmFtZTogJ0dlbmVyYXRlIGRvd25sb2FkIGZpbGVzIGZvciB1c2VyIGRhdGEnLFxuXHRcdFx0c2NoZWR1bGU6IChwYXJzZXIpID0+IHBhcnNlci5jcm9uKGAqLyR7IHByb2Nlc3NpbmdGcmVxdWVuY3kgfSAqICogKiAqYCksXG5cdFx0XHRqb2I6IHByb2Nlc3NEYXRhRG93bmxvYWRzXG5cdFx0fSk7XG5cdH0pO1xufSk7XG4iXX0=
