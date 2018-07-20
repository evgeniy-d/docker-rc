(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var self;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:custom-sounds":{"server":{"startup":{"custom-sounds.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/startup/custom-sounds.js                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(function () {
  let storeType = 'GridFS';

  if (RocketChat.settings.get('CustomSounds_Storage_Type')) {
    storeType = RocketChat.settings.get('CustomSounds_Storage_Type');
  }

  const RocketChatStore = RocketChatFile[storeType];

  if (RocketChatStore == null) {
    throw new Error(`Invalid RocketChatStore type [${storeType}]`);
  }

  console.log(`Using ${storeType} for custom sounds storage`.green);
  let path = '~/uploads';

  if (RocketChat.settings.get('CustomSounds_FileSystemPath') != null) {
    if (RocketChat.settings.get('CustomSounds_FileSystemPath').trim() !== '') {
      path = RocketChat.settings.get('CustomSounds_FileSystemPath');
    }
  }

  this.RocketChatFileCustomSoundsInstance = new RocketChatStore({
    name: 'custom_sounds',
    absolutePath: path
  });
  self = this;
  return WebApp.connectHandlers.use('/custom-sounds/', Meteor.bindEnvironment(function (req, res
  /*, next*/
  ) {
    const params = {
      sound: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''))
    };

    if (_.isEmpty(params.sound)) {
      res.writeHead(403);
      res.write('Forbidden');
      res.end();
      return;
    }

    const file = RocketChatFileCustomSoundsInstance.getFileWithReadStream(params.sound);

    if (!file) {
      return;
    }

    res.setHeader('Content-Disposition', 'inline');
    let fileUploadDate = undefined;

    if (file.uploadDate != null) {
      fileUploadDate = file.uploadDate.toUTCString();
    }

    const reqModifiedHeader = req.headers['if-modified-since'];

    if (reqModifiedHeader != null) {
      if (reqModifiedHeader === fileUploadDate) {
        res.setHeader('Last-Modified', reqModifiedHeader);
        res.writeHead(304);
        res.end();
        return;
      }
    }

    res.setHeader('Cache-Control', 'public, max-age=0');
    res.setHeader('Expires', '-1');

    if (fileUploadDate != null) {
      res.setHeader('Last-Modified', fileUploadDate);
    } else {
      res.setHeader('Last-Modified', new Date().toUTCString());
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', file.length);
    file.readStream.pipe(res);
  }));
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/startup/permissions.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Meteor.startup(() => {
  if (RocketChat.models && RocketChat.models.Permissions) {
    RocketChat.models.Permissions.createOrUpdate('manage-sounds', ['admin']);
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/startup/settings.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
RocketChat.settings.addGroup('CustomSoundsFilesystem', function () {
  this.add('CustomSounds_Storage_Type', 'GridFS', {
    type: 'select',
    values: [{
      key: 'GridFS',
      i18nLabel: 'GridFS'
    }, {
      key: 'FileSystem',
      i18nLabel: 'FileSystem'
    }],
    i18nLabel: 'FileUpload_Storage_Type'
  });
  this.add('CustomSounds_FileSystemPath', '', {
    type: 'string',
    enableQuery: {
      _id: 'CustomSounds_Storage_Type',
      value: 'FileSystem'
    },
    i18nLabel: 'FileUpload_FileSystemPath'
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"CustomSounds.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/models/CustomSounds.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
class CustomSounds extends RocketChat.models._Base {
  constructor() {
    super('custom_sounds');
    this.tryEnsureIndex({
      'name': 1
    });
  } //find one


  findOneByID(_id, options) {
    return this.findOne(_id, options);
  } //find


  findByName(name, options) {
    const query = {
      name
    };
    return this.find(query, options);
  }

  findByNameExceptID(name, except, options) {
    const query = {
      _id: {
        $nin: [except]
      },
      name
    };
    return this.find(query, options);
  } //update


  setName(_id, name) {
    const update = {
      $set: {
        name
      }
    };
    return this.update({
      _id
    }, update);
  } // INSERT


  create(data) {
    return this.insert(data);
  } // REMOVE


  removeByID(_id) {
    return this.remove(_id);
  }

}

RocketChat.models.CustomSounds = new CustomSounds();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"customSounds.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/publications/customSounds.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('customSounds', function (filter, limit) {
  if (!this.userId) {
    return this.ready();
  }

  const fields = {
    name: 1,
    extension: 1
  };
  filter = s.trim(filter);
  const options = {
    fields,
    limit,
    sort: {
      name: 1
    }
  };

  if (filter) {
    const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
    return RocketChat.models.CustomSounds.findByName(filterReg, options);
  }

  return RocketChat.models.CustomSounds.find({}, options);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"deleteCustomSound.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/methods/deleteCustomSound.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* globals RocketChatFileCustomSoundsInstance */
Meteor.methods({
  deleteCustomSound(_id) {
    let sound = null;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-sounds')) {
      sound = RocketChat.models.CustomSounds.findOneByID(_id);
    } else {
      throw new Meteor.Error('not_authorized');
    }

    if (sound == null) {
      throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', {
        method: 'deleteCustomSound'
      });
    }

    RocketChatFileCustomSoundsInstance.deleteFile(`${sound._id}.${sound.extension}`);
    RocketChat.models.CustomSounds.removeByID(_id);
    RocketChat.Notifications.notifyAll('deleteCustomSound', {
      soundData: sound
    });
    return true;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertOrUpdateSound.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/methods/insertOrUpdateSound.js                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.methods({
  insertOrUpdateSound(soundData) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-sounds')) {
      throw new Meteor.Error('not_authorized');
    }

    if (!s.trim(soundData.name)) {
      throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
        method: 'insertOrUpdateSound',
        field: 'Name'
      });
    } //let nameValidation = new RegExp('^[0-9a-zA-Z-_+;.]+$');
    //allow all characters except colon, whitespace, comma, >, <, &, ", ', /, \, (, )
    //more practical than allowing specific sets of characters; also allows foreign languages


    const nameValidation = /[\s,:><&"'\/\\\(\)]/; //silently strip colon; this allows for uploading :soundname: as soundname

    soundData.name = soundData.name.replace(/:/g, '');

    if (nameValidation.test(soundData.name)) {
      throw new Meteor.Error('error-input-is-not-a-valid-field', `${soundData.name} is not a valid name`, {
        method: 'insertOrUpdateSound',
        input: soundData.name,
        field: 'Name'
      });
    }

    let matchingResults = [];

    if (soundData._id) {
      matchingResults = RocketChat.models.CustomSounds.findByNameExceptID(soundData.name, soundData._id).fetch();
    } else {
      matchingResults = RocketChat.models.CustomSounds.findByName(soundData.name).fetch();
    }

    if (matchingResults.length > 0) {
      throw new Meteor.Error('Custom_Sound_Error_Name_Already_In_Use', 'The custom sound name is already in use', {
        method: 'insertOrUpdateSound'
      });
    }

    if (!soundData._id) {
      //insert sound
      const createSound = {
        name: soundData.name,
        extension: soundData.extension
      };

      const _id = RocketChat.models.CustomSounds.create(createSound);

      createSound._id = _id;
      return _id;
    } else {
      //update sound
      if (soundData.newFile) {
        RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.previousExtension}`);
      }

      if (soundData.name !== soundData.previousName) {
        RocketChat.models.CustomSounds.setName(soundData._id, soundData.name);
        RocketChat.Notifications.notifyAll('updateCustomSound', {
          soundData
        });
      }

      return soundData._id;
    }
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"listCustomSounds.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/methods/listCustomSounds.js                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Meteor.methods({
  listCustomSounds() {
    return RocketChat.models.CustomSounds.find({}).fetch();
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"uploadCustomSound.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_custom-sounds/server/methods/uploadCustomSound.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/* globals RocketChatFileCustomSoundsInstance */
Meteor.methods({
  uploadCustomSound(binaryContent, contentType, soundData) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-sounds')) {
      throw new Meteor.Error('not_authorized');
    }

    const file = new Buffer(binaryContent, 'binary');
    const rs = RocketChatFile.bufferToStream(file);
    RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.extension}`);
    const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.${soundData.extension}`, contentType);
    ws.on('end', Meteor.bindEnvironment(() => Meteor.setTimeout(() => RocketChat.Notifications.notifyAll('updateCustomSound', {
      soundData
    }), 500)));
    rs.pipe(ws);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:custom-sounds/server/startup/custom-sounds.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/startup/permissions.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/models/CustomSounds.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/publications/customSounds.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/methods/deleteCustomSound.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/methods/insertOrUpdateSound.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/methods/listCustomSounds.js");
require("/node_modules/meteor/rocketchat:custom-sounds/server/methods/uploadCustomSound.js");

/* Exports */
Package._define("rocketchat:custom-sounds");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_custom-sounds.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjdXN0b20tc291bmRzL3NlcnZlci9zdGFydHVwL2N1c3RvbS1zb3VuZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y3VzdG9tLXNvdW5kcy9zZXJ2ZXIvc3RhcnR1cC9wZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjdXN0b20tc291bmRzL3NlcnZlci9zdGFydHVwL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmN1c3RvbS1zb3VuZHMvc2VydmVyL21vZGVscy9DdXN0b21Tb3VuZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y3VzdG9tLXNvdW5kcy9zZXJ2ZXIvcHVibGljYXRpb25zL2N1c3RvbVNvdW5kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjdXN0b20tc291bmRzL3NlcnZlci9tZXRob2RzL2RlbGV0ZUN1c3RvbVNvdW5kLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmN1c3RvbS1zb3VuZHMvc2VydmVyL21ldGhvZHMvaW5zZXJ0T3JVcGRhdGVTb3VuZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjdXN0b20tc291bmRzL3NlcnZlci9tZXRob2RzL2xpc3RDdXN0b21Tb3VuZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y3VzdG9tLXNvdW5kcy9zZXJ2ZXIvbWV0aG9kcy91cGxvYWRDdXN0b21Tb3VuZC5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJNZXRlb3IiLCJzdGFydHVwIiwic3RvcmVUeXBlIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiZ2V0IiwiUm9ja2V0Q2hhdFN0b3JlIiwiUm9ja2V0Q2hhdEZpbGUiLCJFcnJvciIsImNvbnNvbGUiLCJsb2ciLCJncmVlbiIsInBhdGgiLCJ0cmltIiwiUm9ja2V0Q2hhdEZpbGVDdXN0b21Tb3VuZHNJbnN0YW5jZSIsIm5hbWUiLCJhYnNvbHV0ZVBhdGgiLCJzZWxmIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwiYmluZEVudmlyb25tZW50IiwicmVxIiwicmVzIiwicGFyYW1zIiwic291bmQiLCJkZWNvZGVVUklDb21wb25lbnQiLCJ1cmwiLCJyZXBsYWNlIiwiaXNFbXB0eSIsIndyaXRlSGVhZCIsIndyaXRlIiwiZW5kIiwiZmlsZSIsImdldEZpbGVXaXRoUmVhZFN0cmVhbSIsInNldEhlYWRlciIsImZpbGVVcGxvYWREYXRlIiwidW5kZWZpbmVkIiwidXBsb2FkRGF0ZSIsInRvVVRDU3RyaW5nIiwicmVxTW9kaWZpZWRIZWFkZXIiLCJoZWFkZXJzIiwiRGF0ZSIsImxlbmd0aCIsInJlYWRTdHJlYW0iLCJwaXBlIiwibW9kZWxzIiwiUGVybWlzc2lvbnMiLCJjcmVhdGVPclVwZGF0ZSIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwidmFsdWUiLCJDdXN0b21Tb3VuZHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwidHJ5RW5zdXJlSW5kZXgiLCJmaW5kT25lQnlJRCIsIm9wdGlvbnMiLCJmaW5kT25lIiwiZmluZEJ5TmFtZSIsInF1ZXJ5IiwiZmluZCIsImZpbmRCeU5hbWVFeGNlcHRJRCIsImV4Y2VwdCIsIiRuaW4iLCJzZXROYW1lIiwidXBkYXRlIiwiJHNldCIsImNyZWF0ZSIsImRhdGEiLCJpbnNlcnQiLCJyZW1vdmVCeUlEIiwicmVtb3ZlIiwicyIsInB1Ymxpc2giLCJmaWx0ZXIiLCJsaW1pdCIsInVzZXJJZCIsInJlYWR5IiwiZmllbGRzIiwiZXh0ZW5zaW9uIiwic29ydCIsImZpbHRlclJlZyIsIlJlZ0V4cCIsImVzY2FwZVJlZ0V4cCIsIm1ldGhvZHMiLCJkZWxldGVDdXN0b21Tb3VuZCIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsIm1ldGhvZCIsImRlbGV0ZUZpbGUiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5QWxsIiwic291bmREYXRhIiwiaW5zZXJ0T3JVcGRhdGVTb3VuZCIsImZpZWxkIiwibmFtZVZhbGlkYXRpb24iLCJ0ZXN0IiwiaW5wdXQiLCJtYXRjaGluZ1Jlc3VsdHMiLCJmZXRjaCIsImNyZWF0ZVNvdW5kIiwibmV3RmlsZSIsInByZXZpb3VzRXh0ZW5zaW9uIiwicHJldmlvdXNOYW1lIiwibGlzdEN1c3RvbVNvdW5kcyIsInVwbG9hZEN1c3RvbVNvdW5kIiwiYmluYXJ5Q29udGVudCIsImNvbnRlbnRUeXBlIiwiQnVmZmVyIiwicnMiLCJidWZmZXJUb1N0cmVhbSIsIndzIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJvbiIsInNldFRpbWVvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFHTkMsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekIsTUFBSUMsWUFBWSxRQUFoQjs7QUFFQSxNQUFJQyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBSixFQUEwRDtBQUN6REgsZ0JBQVlDLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixDQUFaO0FBQ0E7O0FBRUQsUUFBTUMsa0JBQWtCQyxlQUFlTCxTQUFmLENBQXhCOztBQUVBLE1BQUlJLG1CQUFtQixJQUF2QixFQUE2QjtBQUM1QixVQUFNLElBQUlFLEtBQUosQ0FBVyxpQ0FBaUNOLFNBQVcsR0FB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RyxFQUFvRzRCLFdBQXBHLENBQVg7QUFDQUksT0FBR0UsRUFBSCxDQUFNLEtBQU4sRUFBYXhILE9BQU9xQixlQUFQLENBQXVCLE1BQ25DckIsT0FBT3lILFVBQVAsQ0FBa0IsTUFBTXRILFdBQVc4RixhQUFYLENBQXlCQyxTQUF6QixDQUFtQyxtQkFBbkMsRUFBd0Q7QUFBQ0M7QUFBRCxLQUF4RCxDQUF4QixFQUE4RixHQUE5RixDQURZLENBQWI7QUFJQWlCLE9BQUd2RSxJQUFILENBQVF5RSxFQUFSO0FBQ0E7O0FBaEJhLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9jdXN0b20tc291bmRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBSb2NrZXRDaGF0RmlsZUN1c3RvbVNvdW5kc0luc3RhbmNlICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdGxldCBzdG9yZVR5cGUgPSAnR3JpZEZTJztcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0N1c3RvbVNvdW5kc19TdG9yYWdlX1R5cGUnKSkge1xuXHRcdHN0b3JlVHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDdXN0b21Tb3VuZHNfU3RvcmFnZV9UeXBlJyk7XG5cdH1cblxuXHRjb25zdCBSb2NrZXRDaGF0U3RvcmUgPSBSb2NrZXRDaGF0RmlsZVtzdG9yZVR5cGVdO1xuXG5cdGlmIChSb2NrZXRDaGF0U3RvcmUgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBSb2NrZXRDaGF0U3RvcmUgdHlwZSBbJHsgc3RvcmVUeXBlIH1dYCk7XG5cdH1cblxuXHRjb25zb2xlLmxvZyhgVXNpbmcgJHsgc3RvcmVUeXBlIH0gZm9yIGN1c3RvbSBzb3VuZHMgc3RvcmFnZWAuZ3JlZW4pO1xuXG5cdGxldCBwYXRoID0gJ34vdXBsb2Fkcyc7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ3VzdG9tU291bmRzX0ZpbGVTeXN0ZW1QYXRoJykgIT0gbnVsbCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ3VzdG9tU291bmRzX0ZpbGVTeXN0ZW1QYXRoJykudHJpbSgpICE9PSAnJykge1xuXHRcdFx0cGF0aCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDdXN0b21Tb3VuZHNfRmlsZVN5c3RlbVBhdGgnKTtcblx0XHR9XG5cdH1cblxuXHR0aGlzLlJvY2tldENoYXRGaWxlQ3VzdG9tU291bmRzSW5zdGFuY2UgPSBuZXcgUm9ja2V0Q2hhdFN0b3JlKHtcblx0XHRuYW1lOiAnY3VzdG9tX3NvdW5kcycsXG5cdFx0YWJzb2x1dGVQYXRoOiBwYXRoXG5cdH0pO1xuXG5cdHNlbGYgPSB0aGlzO1xuXG5cdHJldHVybiBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL2N1c3RvbS1zb3VuZHMvJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihyZXEsIHJlcy8qLCBuZXh0Ki8pIHtcblx0XHRjb25zdCBwYXJhbXMgPVxuXHRcdFx0eyBzb3VuZDogZGVjb2RlVVJJQ29tcG9uZW50KHJlcS51cmwucmVwbGFjZSgvXlxcLy8sICcnKS5yZXBsYWNlKC9cXD8uKiQvLCAnJykpIH07XG5cblx0XHRpZiAoXy5pc0VtcHR5KHBhcmFtcy5zb3VuZCkpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDAzKTtcblx0XHRcdHJlcy53cml0ZSgnRm9yYmlkZGVuJyk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXRGaWxlQ3VzdG9tU291bmRzSW5zdGFuY2UuZ2V0RmlsZVdpdGhSZWFkU3RyZWFtKHBhcmFtcy5zb3VuZCk7XG5cdFx0aWYgKCFmaWxlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdpbmxpbmUnKTtcblxuXHRcdGxldCBmaWxlVXBsb2FkRGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAoZmlsZS51cGxvYWREYXRlICE9IG51bGwpIHtcblx0XHRcdGZpbGVVcGxvYWREYXRlID0gZmlsZS51cGxvYWREYXRlLnRvVVRDU3RyaW5nKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVxTW9kaWZpZWRIZWFkZXIgPSByZXEuaGVhZGVyc1snaWYtbW9kaWZpZWQtc2luY2UnXTtcblx0XHRpZiAocmVxTW9kaWZpZWRIZWFkZXIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHJlcU1vZGlmaWVkSGVhZGVyID09PSBmaWxlVXBsb2FkRGF0ZSkge1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgcmVxTW9kaWZpZWRIZWFkZXIpO1xuXHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwNCk7XG5cdFx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NhY2hlLUNvbnRyb2wnLCAncHVibGljLCBtYXgtYWdlPTAnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdFeHBpcmVzJywgJy0xJyk7XG5cdFx0aWYgKGZpbGVVcGxvYWREYXRlICE9IG51bGwpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlVXBsb2FkRGF0ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCkpO1xuXHRcdH1cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXVkaW8vbXBlZycpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5sZW5ndGgpO1xuXG5cdFx0ZmlsZS5yZWFkU3RyZWFtLnBpcGUocmVzKTtcblx0fSkpO1xufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdGlmIChSb2NrZXRDaGF0Lm1vZGVscyAmJiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucykge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCdtYW5hZ2Utc291bmRzJywgWydhZG1pbiddKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdDdXN0b21Tb3VuZHNGaWxlc3lzdGVtJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuYWRkKCdDdXN0b21Tb3VuZHNfU3RvcmFnZV9UeXBlJywgJ0dyaWRGUycsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHR2YWx1ZXM6IFt7XG5cdFx0XHRrZXk6ICdHcmlkRlMnLFxuXHRcdFx0aTE4bkxhYmVsOiAnR3JpZEZTJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0ZpbGVTeXN0ZW0nLFxuXHRcdFx0aTE4bkxhYmVsOiAnRmlsZVN5c3RlbSdcblx0XHR9XSxcblx0XHRpMThuTGFiZWw6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZSdcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0N1c3RvbVNvdW5kc19GaWxlU3lzdGVtUGF0aCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdF9pZDogJ0N1c3RvbVNvdW5kc19TdG9yYWdlX1R5cGUnLFxuXHRcdFx0dmFsdWU6ICdGaWxlU3lzdGVtJ1xuXHRcdH0sXG5cdFx0aTE4bkxhYmVsOiAnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCdcblx0fSk7XG59KTtcbiIsImNsYXNzIEN1c3RvbVNvdW5kcyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2N1c3RvbV9zb3VuZHMnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7XG5cdH1cblxuXHQvL2ZpbmQgb25lXG5cdGZpbmRPbmVCeUlEKF9pZCwgb3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUoX2lkLCBvcHRpb25zKTtcblx0fVxuXG5cdC8vZmluZFxuXHRmaW5kQnlOYW1lKG5hbWUsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdG5hbWVcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRmaW5kQnlOYW1lRXhjZXB0SUQobmFtZSwgZXhjZXB0LCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRfaWQ6IHsgJG5pbjogWyBleGNlcHQgXSB9LFxuXHRcdFx0bmFtZVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8vdXBkYXRlXG5cdHNldE5hbWUoX2lkLCBuYW1lKSB7XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRuYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7X2lkfSwgdXBkYXRlKTtcblx0fVxuXG5cdC8vIElOU0VSVFxuXHRjcmVhdGUoZGF0YSkge1xuXHRcdHJldHVybiB0aGlzLmluc2VydChkYXRhKTtcblx0fVxuXG5cblx0Ly8gUkVNT1ZFXG5cdHJlbW92ZUJ5SUQoX2lkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKF9pZCk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuQ3VzdG9tU291bmRzID0gbmV3IEN1c3RvbVNvdW5kcygpO1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5NZXRlb3IucHVibGlzaCgnY3VzdG9tU291bmRzJywgZnVuY3Rpb24oZmlsdGVyLCBsaW1pdCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdGNvbnN0IGZpZWxkcyA9IHtcblx0XHRuYW1lOiAxLFxuXHRcdGV4dGVuc2lvbjogMVxuXHR9O1xuXG5cdGZpbHRlciA9IHMudHJpbShmaWx0ZXIpO1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0ZmllbGRzLFxuXHRcdGxpbWl0LFxuXHRcdHNvcnQ6IHsgbmFtZTogMSB9XG5cdH07XG5cblx0aWYgKGZpbHRlcikge1xuXHRcdGNvbnN0IGZpbHRlclJlZyA9IG5ldyBSZWdFeHAocy5lc2NhcGVSZWdFeHAoZmlsdGVyKSwgJ2knKTtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuQ3VzdG9tU291bmRzLmZpbmRCeU5hbWUoZmlsdGVyUmVnLCBvcHRpb25zKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMuZmluZCh7fSwgb3B0aW9ucyk7XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdEZpbGVDdXN0b21Tb3VuZHNJbnN0YW5jZSAqL1xuTWV0ZW9yLm1ldGhvZHMoe1xuXHRkZWxldGVDdXN0b21Tb3VuZChfaWQpIHtcblx0XHRsZXQgc291bmQgPSBudWxsO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1zb3VuZHMnKSkge1xuXHRcdFx0c291bmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMuZmluZE9uZUJ5SUQoX2lkKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnKTtcblx0XHR9XG5cblx0XHRpZiAoc291bmQgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ3VzdG9tX1NvdW5kX0Vycm9yX0ludmFsaWRfU291bmQnLCAnSW52YWxpZCBzb3VuZCcsIHsgbWV0aG9kOiAnZGVsZXRlQ3VzdG9tU291bmQnIH0pO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXRGaWxlQ3VzdG9tU291bmRzSW5zdGFuY2UuZGVsZXRlRmlsZShgJHsgc291bmQuX2lkIH0uJHsgc291bmQuZXh0ZW5zaW9uIH1gKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMucmVtb3ZlQnlJRChfaWQpO1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlBbGwoJ2RlbGV0ZUN1c3RvbVNvdW5kJywge3NvdW5kRGF0YTogc291bmR9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdEZpbGVDdXN0b21Tb3VuZHNJbnN0YW5jZSAqL1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGluc2VydE9yVXBkYXRlU291bmQoc291bmREYXRhKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utc291bmRzJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzLnRyaW0oc291bmREYXRhLm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10aGUtZmllbGQtaXMtcmVxdWlyZWQnLCAnVGhlIGZpZWxkIE5hbWUgaXMgcmVxdWlyZWQnLCB7IG1ldGhvZDogJ2luc2VydE9yVXBkYXRlU291bmQnLCBmaWVsZDogJ05hbWUnIH0pO1xuXHRcdH1cblxuXHRcdC8vbGV0IG5hbWVWYWxpZGF0aW9uID0gbmV3IFJlZ0V4cCgnXlswLTlhLXpBLVotXys7Ll0rJCcpO1xuXG5cdFx0Ly9hbGxvdyBhbGwgY2hhcmFjdGVycyBleGNlcHQgY29sb24sIHdoaXRlc3BhY2UsIGNvbW1hLCA+LCA8LCAmLCBcIiwgJywgLywgXFwsICgsIClcblx0XHQvL21vcmUgcHJhY3RpY2FsIHRoYW4gYWxsb3dpbmcgc3BlY2lmaWMgc2V0cyBvZiBjaGFyYWN0ZXJzOyBhbHNvIGFsbG93cyBmb3JlaWduIGxhbmd1YWdlc1xuXHRcdGNvbnN0IG5hbWVWYWxpZGF0aW9uID0gL1tcXHMsOj48JlwiJ1xcL1xcXFxcXChcXCldLztcblxuXHRcdC8vc2lsZW50bHkgc3RyaXAgY29sb247IHRoaXMgYWxsb3dzIGZvciB1cGxvYWRpbmcgOnNvdW5kbmFtZTogYXMgc291bmRuYW1lXG5cdFx0c291bmREYXRhLm5hbWUgPSBzb3VuZERhdGEubmFtZS5yZXBsYWNlKC86L2csICcnKTtcblxuXHRcdGlmIChuYW1lVmFsaWRhdGlvbi50ZXN0KHNvdW5kRGF0YS5uYW1lKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW5wdXQtaXMtbm90LWEtdmFsaWQtZmllbGQnLCBgJHsgc291bmREYXRhLm5hbWUgfSBpcyBub3QgYSB2YWxpZCBuYW1lYCwgeyBtZXRob2Q6ICdpbnNlcnRPclVwZGF0ZVNvdW5kJywgaW5wdXQ6IHNvdW5kRGF0YS5uYW1lLCBmaWVsZDogJ05hbWUnIH0pO1xuXHRcdH1cblxuXHRcdGxldCBtYXRjaGluZ1Jlc3VsdHMgPSBbXTtcblxuXHRcdGlmIChzb3VuZERhdGEuX2lkKSB7XG5cdFx0XHRtYXRjaGluZ1Jlc3VsdHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMuZmluZEJ5TmFtZUV4Y2VwdElEKHNvdW5kRGF0YS5uYW1lLCBzb3VuZERhdGEuX2lkKS5mZXRjaCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYXRjaGluZ1Jlc3VsdHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMuZmluZEJ5TmFtZShzb3VuZERhdGEubmFtZSkuZmV0Y2goKTtcblx0XHR9XG5cblx0XHRpZiAobWF0Y2hpbmdSZXN1bHRzLmxlbmd0aCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0N1c3RvbV9Tb3VuZF9FcnJvcl9OYW1lX0FscmVhZHlfSW5fVXNlJywgJ1RoZSBjdXN0b20gc291bmQgbmFtZSBpcyBhbHJlYWR5IGluIHVzZScsIHsgbWV0aG9kOiAnaW5zZXJ0T3JVcGRhdGVTb3VuZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzb3VuZERhdGEuX2lkKSB7XG5cdFx0XHQvL2luc2VydCBzb3VuZFxuXHRcdFx0Y29uc3QgY3JlYXRlU291bmQgPSB7XG5cdFx0XHRcdG5hbWU6IHNvdW5kRGF0YS5uYW1lLFxuXHRcdFx0XHRleHRlbnNpb246IHNvdW5kRGF0YS5leHRlbnNpb25cblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IF9pZCA9IFJvY2tldENoYXQubW9kZWxzLkN1c3RvbVNvdW5kcy5jcmVhdGUoY3JlYXRlU291bmQpO1xuXHRcdFx0Y3JlYXRlU291bmQuX2lkID0gX2lkO1xuXG5cdFx0XHRyZXR1cm4gX2lkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvL3VwZGF0ZSBzb3VuZFxuXHRcdFx0aWYgKHNvdW5kRGF0YS5uZXdGaWxlKSB7XG5cdFx0XHRcdFJvY2tldENoYXRGaWxlQ3VzdG9tU291bmRzSW5zdGFuY2UuZGVsZXRlRmlsZShgJHsgc291bmREYXRhLl9pZCB9LiR7IHNvdW5kRGF0YS5wcmV2aW91c0V4dGVuc2lvbiB9YCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzb3VuZERhdGEubmFtZSAhPT0gc291bmREYXRhLnByZXZpb3VzTmFtZSkge1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMuc2V0TmFtZShzb3VuZERhdGEuX2lkLCBzb3VuZERhdGEubmFtZSk7XG5cdFx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlBbGwoJ3VwZGF0ZUN1c3RvbVNvdW5kJywge3NvdW5kRGF0YX0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc291bmREYXRhLl9pZDtcblx0XHR9XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRsaXN0Q3VzdG9tU291bmRzKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5DdXN0b21Tb3VuZHMuZmluZCh7fSkuZmV0Y2goKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFJvY2tldENoYXRGaWxlQ3VzdG9tU291bmRzSW5zdGFuY2UgKi9cbk1ldGVvci5tZXRob2RzKHtcblx0dXBsb2FkQ3VzdG9tU291bmQoYmluYXJ5Q29udGVudCwgY29udGVudFR5cGUsIHNvdW5kRGF0YSkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLXNvdW5kcycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGUgPSBuZXcgQnVmZmVyKGJpbmFyeUNvbnRlbnQsICdiaW5hcnknKTtcblxuXHRcdGNvbnN0IHJzID0gUm9ja2V0Q2hhdEZpbGUuYnVmZmVyVG9TdHJlYW0oZmlsZSk7XG5cdFx0Um9ja2V0Q2hhdEZpbGVDdXN0b21Tb3VuZHNJbnN0YW5jZS5kZWxldGVGaWxlKGAkeyBzb3VuZERhdGEuX2lkIH0uJHsgc291bmREYXRhLmV4dGVuc2lvbiB9YCk7XG5cdFx0Y29uc3Qgd3MgPSBSb2NrZXRDaGF0RmlsZUN1c3RvbVNvdW5kc0luc3RhbmNlLmNyZWF0ZVdyaXRlU3RyZWFtKGAkeyBzb3VuZERhdGEuX2lkIH0uJHsgc291bmREYXRhLmV4dGVuc2lvbiB9YCwgY29udGVudFR5cGUpO1xuXHRcdHdzLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+XG5cdFx0XHRNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5QWxsKCd1cGRhdGVDdXN0b21Tb3VuZCcsIHtzb3VuZERhdGF9KSwgNTAwKVxuXHRcdCkpO1xuXG5cdFx0cnMucGlwZSh3cyk7XG5cdH1cbn0pO1xuIl19
