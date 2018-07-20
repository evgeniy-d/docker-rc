(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var renderEmoji = Package['rocketchat:emoji'].renderEmoji;
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

/* Package-scope variables */
var isSet, isSetNotNull;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:emoji-custom":{"function-isSet.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/function-isSet.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals isSet:true, isSetNotNull:true */
//http://stackoverflow.com/a/26990347 function isSet() from Gajus
isSet = function (fn) {
  let value;

  try {
    value = fn();
  } catch (e) {
    value = undefined;
  } finally {
    return value !== undefined;
  }
};

isSetNotNull = function (fn) {
  let value;

  try {
    value = fn();
  } catch (e) {
    value = null;
  } finally {
    return value !== null && value !== undefined;
  }
};
/* exported isSet, isSetNotNull */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup":{"emoji-custom.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/startup/emoji-custom.js                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(function () {
  let storeType = 'GridFS';

  if (RocketChat.settings.get('EmojiUpload_Storage_Type')) {
    storeType = RocketChat.settings.get('EmojiUpload_Storage_Type');
  }

  const RocketChatStore = RocketChatFile[storeType];

  if (RocketChatStore == null) {
    throw new Error(`Invalid RocketChatStore type [${storeType}]`);
  }

  console.log(`Using ${storeType} for custom emoji storage`.green);
  let path = '~/uploads';

  if (RocketChat.settings.get('EmojiUpload_FileSystemPath') != null) {
    if (RocketChat.settings.get('EmojiUpload_FileSystemPath').trim() !== '') {
      path = RocketChat.settings.get('EmojiUpload_FileSystemPath');
    }
  }

  this.RocketChatFileEmojiCustomInstance = new RocketChatStore({
    name: 'custom_emoji',
    absolutePath: path
  });
  return WebApp.connectHandlers.use('/emoji-custom/', Meteor.bindEnvironment(function (req, res
  /*, next*/
  ) {
    const params = {
      emoji: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''))
    };

    if (_.isEmpty(params.emoji)) {
      res.writeHead(403);
      res.write('Forbidden');
      res.end();
      return;
    }

    const file = RocketChatFileEmojiCustomInstance.getFileWithReadStream(encodeURIComponent(params.emoji));
    res.setHeader('Content-Disposition', 'inline');

    if (file == null) {
      //use code from username initials renderer until file upload is complete
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=0');
      res.setHeader('Expires', '-1');
      res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');
      const reqModifiedHeader = req.headers['if-modified-since'];

      if (reqModifiedHeader != null) {
        if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
          res.writeHead(304);
          res.end();
          return;
        }
      }

      const color = '#000';
      const initials = '?';
      const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" style="width: 50px; height: 50px; background-color: ${color};">
	<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" font-family="Helvetica, Arial, Lucida Grande, sans-serif" style="font-weight: 400; font-size: 28px;">
		${initials}
	</text>
</svg>`;
      res.write(svg);
      res.end();
      return;
    }

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

    if (/^svg$/i.test(params.emoji.split('.').pop())) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    res.setHeader('Content-Length', file.length);
    file.readStream.pipe(res);
  }));
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/startup/settings.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.settings.addGroup('EmojiCustomFilesystem', function () {
  this.add('EmojiUpload_Storage_Type', 'GridFS', {
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
  this.add('EmojiUpload_FileSystemPath', '', {
    type: 'string',
    enableQuery: {
      _id: 'EmojiUpload_Storage_Type',
      value: 'FileSystem'
    },
    i18nLabel: 'FileUpload_FileSystemPath'
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"EmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/models/EmojiCustom.js                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
class EmojiCustom extends RocketChat.models._Base {
  constructor() {
    super('custom_emoji');
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'aliases': 1
    });
    this.tryEnsureIndex({
      'extension': 1
    });
  } //find one


  findOneByID(_id, options) {
    return this.findOne(_id, options);
  } //find


  findByNameOrAlias(emojiName, options) {
    let name = emojiName;

    if (typeof emojiName === 'string') {
      name = emojiName.replace(/:/g, '');
    }

    const query = {
      $or: [{
        name
      }, {
        aliases: name
      }]
    };
    return this.find(query, options);
  }

  findByNameOrAliasExceptID(name, except, options) {
    const query = {
      _id: {
        $nin: [except]
      },
      $or: [{
        name
      }, {
        aliases: name
      }]
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
  }

  setAliases(_id, aliases) {
    const update = {
      $set: {
        aliases
      }
    };
    return this.update({
      _id
    }, update);
  }

  setExtension(_id, extension) {
    const update = {
      $set: {
        extension
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

RocketChat.models.EmojiCustom = new EmojiCustom();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"fullEmojiData.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/publications/fullEmojiData.js                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('fullEmojiData', function (filter, limit) {
  if (!this.userId) {
    return this.ready();
  }

  const fields = {
    name: 1,
    aliases: 1,
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
    return RocketChat.models.EmojiCustom.findByNameOrAlias(filterReg, options);
  }

  return RocketChat.models.EmojiCustom.find({}, options);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"listEmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/listEmojiCustom.js                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  listEmojiCustom() {
    return RocketChat.models.EmojiCustom.find({}).fetch();
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteEmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/deleteEmojiCustom.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals RocketChatFileEmojiCustomInstance */
Meteor.methods({
  deleteEmojiCustom(emojiID) {
    let emoji = null;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
      emoji = RocketChat.models.EmojiCustom.findOneByID(emojiID);
    } else {
      throw new Meteor.Error('not_authorized');
    }

    if (emoji == null) {
      throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', {
        method: 'deleteEmojiCustom'
      });
    }

    RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emoji.name}.${emoji.extension}`));
    RocketChat.models.EmojiCustom.removeByID(emojiID);
    RocketChat.Notifications.notifyLogged('deleteEmojiCustom', {
      emojiData: emoji
    });
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertOrUpdateEmoji.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/insertOrUpdateEmoji.js                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
Meteor.methods({
  insertOrUpdateEmoji(emojiData) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
      throw new Meteor.Error('not_authorized');
    }

    if (!s.trim(emojiData.name)) {
      throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
        method: 'insertOrUpdateEmoji',
        field: 'Name'
      });
    } //allow all characters except colon, whitespace, comma, >, <, &, ", ', /, \, (, )
    //more practical than allowing specific sets of characters; also allows foreign languages


    const nameValidation = /[\s,:><&"'\/\\\(\)]/;
    const aliasValidation = /[:><&\|"'\/\\\(\)]/; //silently strip colon; this allows for uploading :emojiname: as emojiname

    emojiData.name = emojiData.name.replace(/:/g, '');
    emojiData.aliases = emojiData.aliases.replace(/:/g, '');

    if (nameValidation.test(emojiData.name)) {
      throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.name} is not a valid name`, {
        method: 'insertOrUpdateEmoji',
        input: emojiData.name,
        field: 'Name'
      });
    }

    if (emojiData.aliases) {
      if (aliasValidation.test(emojiData.aliases)) {
        throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.aliases} is not a valid alias set`, {
          method: 'insertOrUpdateEmoji',
          input: emojiData.aliases,
          field: 'Alias_Set'
        });
      }

      emojiData.aliases = emojiData.aliases.split(/[\s,]/);
      emojiData.aliases = emojiData.aliases.filter(Boolean);
      emojiData.aliases = _.without(emojiData.aliases, emojiData.name);
    } else {
      emojiData.aliases = [];
    }

    let matchingResults = [];

    if (emojiData._id) {
      matchingResults = RocketChat.models.EmojiCustom.findByNameOrAliasExceptID(emojiData.name, emojiData._id).fetch();

      for (const alias of emojiData.aliases) {
        matchingResults = matchingResults.concat(RocketChat.models.EmojiCustom.findByNameOrAliasExceptID(alias, emojiData._id).fetch());
      }
    } else {
      matchingResults = RocketChat.models.EmojiCustom.findByNameOrAlias(emojiData.name).fetch();

      for (const alias of emojiData.aliases) {
        matchingResults = matchingResults.concat(RocketChat.models.EmojiCustom.findByNameOrAlias(alias).fetch());
      }
    }

    if (matchingResults.length > 0) {
      throw new Meteor.Error('Custom_Emoji_Error_Name_Or_Alias_Already_In_Use', 'The custom emoji or one of its aliases is already in use', {
        method: 'insertOrUpdateEmoji'
      });
    }

    if (!emojiData._id) {
      //insert emoji
      const createEmoji = {
        name: emojiData.name,
        aliases: emojiData.aliases,
        extension: emojiData.extension
      };

      const _id = RocketChat.models.EmojiCustom.create(createEmoji);

      RocketChat.Notifications.notifyLogged('updateEmojiCustom', {
        emojiData: createEmoji
      });
      return _id;
    } else {
      //update emoji
      if (emojiData.newFile) {
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`));
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.extension}`));
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`));
        RocketChat.models.EmojiCustom.setExtension(emojiData._id, emojiData.extension);
      } else if (emojiData.name !== emojiData.previousName) {
        const rs = RocketChatFileEmojiCustomInstance.getFileWithReadStream(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`));

        if (rs !== null) {
          RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
          const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`), rs.contentType);
          ws.on('end', Meteor.bindEnvironment(() => RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`))));
          rs.readStream.pipe(ws);
        }
      }

      if (emojiData.name !== emojiData.previousName) {
        RocketChat.models.EmojiCustom.setName(emojiData._id, emojiData.name);
      }

      if (emojiData.aliases) {
        RocketChat.models.EmojiCustom.setAliases(emojiData._id, emojiData.aliases);
      } else {
        RocketChat.models.EmojiCustom.setAliases(emojiData._id, []);
      }

      RocketChat.Notifications.notifyLogged('updateEmojiCustom', {
        emojiData
      });
      return true;
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"uploadEmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/uploadEmojiCustom.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals RocketChatFileEmojiCustomInstance */
Meteor.methods({
  uploadEmojiCustom(binaryContent, contentType, emojiData) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
      throw new Meteor.Error('not_authorized');
    } //delete aliases for notification purposes. here, it is a string rather than an array


    delete emojiData.aliases;
    const file = new Buffer(binaryContent, 'binary');
    const rs = RocketChatFile.bufferToStream(file);
    RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
    const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`), contentType);
    ws.on('end', Meteor.bindEnvironment(() => Meteor.setTimeout(() => RocketChat.Notifications.notifyLogged('updateEmojiCustom', {
      emojiData
    }), 500)));
    rs.pipe(ws);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:emoji-custom/function-isSet.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/startup/emoji-custom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/models/EmojiCustom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/publications/fullEmojiData.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/listEmojiCustom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/deleteEmojiCustom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/insertOrUpdateEmoji.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/uploadEmojiCustom.js");

/* Exports */
Package._define("rocketchat:emoji-custom");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_emoji-custom.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vZnVuY3Rpb24taXNTZXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZW1vamktY3VzdG9tL3NlcnZlci9zdGFydHVwL2Vtb2ppLWN1c3RvbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZW1vamktY3VzdG9tL3NlcnZlci9tb2RlbHMvRW1vamlDdXN0b20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZW1vamktY3VzdG9tL3NlcnZlci9wdWJsaWNhdGlvbnMvZnVsbEVtb2ppRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL21ldGhvZHMvbGlzdEVtb2ppQ3VzdG9tLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmVtb2ppLWN1c3RvbS9zZXJ2ZXIvbWV0aG9kcy9kZWxldGVFbW9qaUN1c3RvbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL21ldGhvZHMvaW5zZXJ0T3JVcGRhdGVFbW9qaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL21ldGhvZHMvdXBsb2FkRW1vamlDdXN0b20uanMiXSwibmFtZXMiOlsiaXNTZXQiLCJmbiIsInZhbHVlIiwiZSIsInVuZGVmaW5lZCIsImlzU2V0Tm90TnVsbCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIk1ldGVvciIsInN0YXJ0dXAiLCJzdG9yZVR5cGUiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJSb2NrZXRDaGF0U3RvcmUiLCJSb2NrZXRDaGF0RmlsZSIsIkVycm9yIiwiY29uc29sZSIsImxvZyIsImdyZWVuIiwicGF0aCIsInRyaW0iLCJSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UiLCJuYW1lIiwiYWJzb2x1dGVQYXRoIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwiYmluZEVudmlyb25tZW50IiwicmVxIiwicmVzIiwicGFyYW1zIiwiZW1vamkiLCJkZWNvZGVVUklDb21wb25lbnQiLCJ1cmwiLCJyZXBsYWNlIiwiaXNFbXB0eSIsIndyaXRlSGVhZCIsIndyaXRlIiwiZW5kIiwiZmlsZSIsImdldEZpbGVXaXRoUmVhZFN0cmVhbSIsImVuY29kZVVSSUNvbXBvbmVudCIsInNldEhlYWRlciIsInJlcU1vZGlmaWVkSGVhZGVyIiwiaGVhZGVycyIsImNvbG9yIiwiaW5pdGlhbHMiLCJzdmciLCJmaWxlVXBsb2FkRGF0ZSIsInVwbG9hZERhdGUiLCJ0b1VUQ1N0cmluZyIsIkRhdGUiLCJ0ZXN0Iiwic3BsaXQiLCJwb3AiLCJsZW5ndGgiLCJyZWFkU3RyZWFtIiwicGlwZSIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwiRW1vamlDdXN0b20iLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwidHJ5RW5zdXJlSW5kZXgiLCJmaW5kT25lQnlJRCIsIm9wdGlvbnMiLCJmaW5kT25lIiwiZmluZEJ5TmFtZU9yQWxpYXMiLCJlbW9qaU5hbWUiLCJxdWVyeSIsIiRvciIsImFsaWFzZXMiLCJmaW5kIiwiZmluZEJ5TmFtZU9yQWxpYXNFeGNlcHRJRCIsImV4Y2VwdCIsIiRuaW4iLCJzZXROYW1lIiwidXBkYXRlIiwiJHNldCIsInNldEFsaWFzZXMiLCJzZXRFeHRlbnNpb24iLCJleHRlbnNpb24iLCJjcmVhdGUiLCJkYXRhIiwiaW5zZXJ0IiwicmVtb3ZlQnlJRCIsInJlbW92ZSIsInMiLCJwdWJsaXNoIiwiZmlsdGVyIiwibGltaXQiLCJ1c2VySWQiLCJyZWFkeSIsImZpZWxkcyIsInNvcnQiLCJmaWx0ZXJSZWciLCJSZWdFeHAiLCJlc2NhcGVSZWdFeHAiLCJtZXRob2RzIiwibGlzdEVtb2ppQ3VzdG9tIiwiZmV0Y2giLCJkZWxldGVFbW9qaUN1c3RvbSIsImVtb2ppSUQiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJtZXRob2QiLCJkZWxldGVGaWxlIiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeUxvZ2dlZCIsImVtb2ppRGF0YSIsImluc2VydE9yVXBkYXRlRW1vamkiLCJmaWVsZCIsIm5hbWVWYWxpZGF0aW9uIiwiYWxpYXNWYWxpZGF0aW9uIiwiaW5wdXQiLCJCb29sZWFuIiwid2l0aG91dCIsIm1hdGNoaW5nUmVzdWx0cyIsImFsaWFzIiwiY29uY2F0IiwiY3JlYXRlRW1vamkiLCJuZXdGaWxlIiwicHJldmlvdXNFeHRlbnNpb24iLCJwcmV2aW91c05hbWUiLCJycyIsIndzIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJjb250ZW50VHlwZSIsIm9uIiwidXBsb2FkRW1vamlDdXN0b20iLCJiaW5hcnlDb250ZW50IiwiQnVmZmVyIiwiYnVmZmVyVG9TdHJlYW0iLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0FBLFFBQVEsVUFBU0MsRUFBVCxFQUFhO0FBQ3BCLE1BQUlDLEtBQUo7O0FBQ0EsTUFBSTtBQUNIQSxZQUFRRCxJQUFSO0FBQ0EsR0FGRCxDQUVFLE9BQU9FLENBQVAsRUFBVTtBQUNYRCxZQUFRRSxTQUFSO0FBQ0EsR0FKRCxTQUlVO0FBQ1QsV0FBT0YsVUFBVUUsU0FBakI7QUFDQTtBQUNELENBVEQ7O0FBV0FDLGVBQWUsVUFBU0osRUFBVCxFQUFhO0FBQzNCLE1BQUlDLEtBQUo7O0FBQ0EsTUFBSTtBQUNIQSxZ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Q0FBZTtBQUNkK0Isb0JBQWtCQyxhQUFsQixFQUFpQ0gsV0FBakMsRUFBOENsQixTQUE5QyxFQUF5RDtBQUN4RCxRQUFJLENBQUMxRyxXQUFXb0csS0FBWCxDQUFpQkMsYUFBakIsQ0FBK0IsS0FBS2IsTUFBcEMsRUFBNEMsY0FBNUMsQ0FBTCxFQUFrRTtBQUNqRSxZQUFNLElBQUkzRixPQUFPUSxLQUFYLENBQWlCLGdCQUFqQixDQUFOO0FBQ0EsS0FIdUQsQ0FLeEQ7OztBQUNBLFdBQU9xRyxVQUFVdEMsT0FBakI7QUFDQSxVQUFNdkMsT0FBTyxJQUFJbUcsTUFBSixDQUFXRCxhQUFYLEVBQTBCLFFBQTFCLENBQWI7QUFFQSxVQUFNTixLQUFLckgsZUFBZTZILGNBQWYsQ0FBOEJwRyxJQUE5QixDQUFYO0FBQ0FsQixzQ0FBa0M0RixVQUFsQyxDQUE2Q3hFLG1CQUFvQixHQUFHMkUsVUFBVTlGLElBQU0sSUFBSThGLFVBQVU1QixTQUFXLEVBQWhFLENBQTdDO0FBQ0EsVUFBTTRDLEtBQUsvRyxrQ0FBa0NnSCxpQkFBbEMsQ0FBb0Q1RixtQkFBb0IsR0FBRzJFLFVBQVU5RixJQUFNLElBQUk4RixVQUFVNUIsU0FBVyxFQUFoRSxDQUFwRCxFQUF3SDhDLFdBQXhILENBQVg7QUFDQUYsT0FBR0csRUFBSCxDQUFNLEtBQU4sRUFBYWhJLE9BQU9vQixlQUFQLENBQXVCLE1BQ25DcEIsT0FBT3FJLFVBQVAsQ0FBa0IsTUFBTWxJLFdBQVd3RyxhQUFYLENBQXlCQyxZQUF6QixDQUFzQyxtQkFBdEMsRUFBMkQ7QUFBQ0M7QUFBRCxLQUEzRCxDQUF4QixFQUFpRyxHQUFqRyxDQURZLENBQWI7QUFJQWUsT0FBRzFFLElBQUgsQ0FBUTJFLEVBQVI7QUFDQTs7QUFsQmEsQ0FBZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2Vtb2ppLWN1c3RvbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgaXNTZXQ6dHJ1ZSwgaXNTZXROb3ROdWxsOnRydWUgKi9cbi8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjY5OTAzNDcgZnVuY3Rpb24gaXNTZXQoKSBmcm9tIEdhanVzXG5pc1NldCA9IGZ1bmN0aW9uKGZuKSB7XG5cdGxldCB2YWx1ZTtcblx0dHJ5IHtcblx0XHR2YWx1ZSA9IGZuKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR2YWx1ZSA9IHVuZGVmaW5lZDtcblx0fSBmaW5hbGx5IHtcblx0XHRyZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcblx0fVxufTtcblxuaXNTZXROb3ROdWxsID0gZnVuY3Rpb24oZm4pIHtcblx0bGV0IHZhbHVlO1xuXHR0cnkge1xuXHRcdHZhbHVlID0gZm4oKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHZhbHVlID0gbnVsbDtcblx0fSBmaW5hbGx5IHtcblx0XHRyZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZDtcblx0fVxufTtcblxuLyogZXhwb3J0ZWQgaXNTZXQsIGlzU2V0Tm90TnVsbCAqL1xuIiwiLyogZ2xvYmFscyBSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0bGV0IHN0b3JlVHlwZSA9ICdHcmlkRlMnO1xuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1vamlVcGxvYWRfU3RvcmFnZV9UeXBlJykpIHtcblx0XHRzdG9yZVR5cGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1vamlVcGxvYWRfU3RvcmFnZV9UeXBlJyk7XG5cdH1cblxuXHRjb25zdCBSb2NrZXRDaGF0U3RvcmUgPSBSb2NrZXRDaGF0RmlsZVtzdG9yZVR5cGVdO1xuXG5cdGlmIChSb2NrZXRDaGF0U3RvcmUgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBSb2NrZXRDaGF0U3RvcmUgdHlwZSBbJHsgc3RvcmVUeXBlIH1dYCk7XG5cdH1cblxuXHRjb25zb2xlLmxvZyhgVXNpbmcgJHsgc3RvcmVUeXBlIH0gZm9yIGN1c3RvbSBlbW9qaSBzdG9yYWdlYC5ncmVlbik7XG5cblx0bGV0IHBhdGggPSAnfi91cGxvYWRzJztcblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbW9qaVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcpICE9IG51bGwpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Vtb2ppVXBsb2FkX0ZpbGVTeXN0ZW1QYXRoJykudHJpbSgpICE9PSAnJykge1xuXHRcdFx0cGF0aCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbW9qaVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcpO1xuXHRcdH1cblx0fVxuXG5cdHRoaXMuUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlID0gbmV3IFJvY2tldENoYXRTdG9yZSh7XG5cdFx0bmFtZTogJ2N1c3RvbV9lbW9qaScsXG5cdFx0YWJzb2x1dGVQYXRoOiBwYXRoXG5cdH0pO1xuXG5cdHJldHVybiBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL2Vtb2ppLWN1c3RvbS8nLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKHJlcSwgcmVzLyosIG5leHQqLykge1xuXHRcdGNvbnN0IHBhcmFtcyA9XG5cdFx0XHR7ZW1vamk6IGRlY29kZVVSSUNvbXBvbmVudChyZXEudXJsLnJlcGxhY2UoL15cXC8vLCAnJykucmVwbGFjZSgvXFw/LiokLywgJycpKX07XG5cblx0XHRpZiAoXy5pc0VtcHR5KHBhcmFtcy5lbW9qaSkpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDAzKTtcblx0XHRcdHJlcy53cml0ZSgnRm9yYmlkZGVuJyk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5nZXRGaWxlV2l0aFJlYWRTdHJlYW0oZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtcy5lbW9qaSkpO1xuXG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdpbmxpbmUnKTtcblxuXHRcdGlmIChmaWxlID09IG51bGwpIHtcblx0XHRcdC8vdXNlIGNvZGUgZnJvbSB1c2VybmFtZSBpbml0aWFscyByZW5kZXJlciB1bnRpbCBmaWxlIHVwbG9hZCBpcyBjb21wbGV0ZVxuXHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2ltYWdlL3N2Zyt4bWwnKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NhY2hlLUNvbnRyb2wnLCAncHVibGljLCBtYXgtYWdlPTAnKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0V4cGlyZXMnLCAnLTEnKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCAnVGh1LCAwMSBKYW4gMjAxNSAwMDowMDowMCBHTVQnKTtcblxuXHRcdFx0Y29uc3QgcmVxTW9kaWZpZWRIZWFkZXIgPSByZXEuaGVhZGVyc1snaWYtbW9kaWZpZWQtc2luY2UnXTtcblx0XHRcdGlmIChyZXFNb2RpZmllZEhlYWRlciAhPSBudWxsKSB7XG5cdFx0XHRcdGlmIChyZXFNb2RpZmllZEhlYWRlciA9PT0gJ1RodSwgMDEgSmFuIDIwMTUgMDA6MDA6MDAgR01UJykge1xuXHRcdFx0XHRcdHJlcy53cml0ZUhlYWQoMzA0KTtcblx0XHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGNvbG9yID0gJyMwMDAnO1xuXHRcdFx0Y29uc3QgaW5pdGlhbHMgPSAnPyc7XG5cblx0XHRcdGNvbnN0IHN2ZyA9IGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiIHN0YW5kYWxvbmU9XCJub1wiPz5cbjxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHBvaW50ZXItZXZlbnRzPVwibm9uZVwiIHdpZHRoPVwiNTBcIiBoZWlnaHQ9XCI1MFwiIHN0eWxlPVwid2lkdGg6IDUwcHg7IGhlaWdodDogNTBweDsgYmFja2dyb3VuZC1jb2xvcjogJHsgY29sb3IgfTtcIj5cblx0PHRleHQgdGV4dC1hbmNob3I9XCJtaWRkbGVcIiB5PVwiNTAlXCIgeD1cIjUwJVwiIGR5PVwiMC4zNmVtXCIgcG9pbnRlci1ldmVudHM9XCJhdXRvXCIgZmlsbD1cIiNmZmZmZmZcIiBmb250LWZhbWlseT1cIkhlbHZldGljYSwgQXJpYWwsIEx1Y2lkYSBHcmFuZGUsIHNhbnMtc2VyaWZcIiBzdHlsZT1cImZvbnQtd2VpZ2h0OiA0MDA7IGZvbnQtc2l6ZTogMjhweDtcIj5cblx0XHQkeyBpbml0aWFscyB9XG5cdDwvdGV4dD5cbjwvc3ZnPmA7XG5cblx0XHRcdHJlcy53cml0ZShzdmcpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxldCBmaWxlVXBsb2FkRGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAoZmlsZS51cGxvYWREYXRlICE9IG51bGwpIHtcblx0XHRcdGZpbGVVcGxvYWREYXRlID0gZmlsZS51cGxvYWREYXRlLnRvVVRDU3RyaW5nKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVxTW9kaWZpZWRIZWFkZXIgPSByZXEuaGVhZGVyc1snaWYtbW9kaWZpZWQtc2luY2UnXTtcblx0XHRpZiAocmVxTW9kaWZpZWRIZWFkZXIgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHJlcU1vZGlmaWVkSGVhZGVyID09PSBmaWxlVXBsb2FkRGF0ZSkge1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgcmVxTW9kaWZpZWRIZWFkZXIpO1xuXHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwNCk7XG5cdFx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NhY2hlLUNvbnRyb2wnLCAncHVibGljLCBtYXgtYWdlPTAnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdFeHBpcmVzJywgJy0xJyk7XG5cdFx0aWYgKGZpbGVVcGxvYWREYXRlICE9IG51bGwpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlVXBsb2FkRGF0ZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCkpO1xuXHRcdH1cblx0XHRpZiAoL15zdmckL2kudGVzdChwYXJhbXMuZW1vamkuc3BsaXQoJy4nKS5wb3AoKSkpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9zdmcreG1sJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9qcGVnJyk7XG5cdFx0fVxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5sZW5ndGgpO1xuXG5cdFx0ZmlsZS5yZWFkU3RyZWFtLnBpcGUocmVzKTtcblx0fSkpO1xufSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdFbW9qaUN1c3RvbUZpbGVzeXN0ZW0nLCBmdW5jdGlvbigpIHtcblx0dGhpcy5hZGQoJ0Vtb2ppVXBsb2FkX1N0b3JhZ2VfVHlwZScsICdHcmlkRlMnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0dmFsdWVzOiBbe1xuXHRcdFx0a2V5OiAnR3JpZEZTJyxcblx0XHRcdGkxOG5MYWJlbDogJ0dyaWRGUydcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdGaWxlU3lzdGVtJyxcblx0XHRcdGkxOG5MYWJlbDogJ0ZpbGVTeXN0ZW0nXG5cdFx0fV0sXG5cdFx0aTE4bkxhYmVsOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnXG5cdH0pO1xuXG5cdHRoaXMuYWRkKCdFbW9qaVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdF9pZDogJ0Vtb2ppVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHR2YWx1ZTogJ0ZpbGVTeXN0ZW0nXG5cdFx0fSxcblx0XHRpMThuTGFiZWw6ICdGaWxlVXBsb2FkX0ZpbGVTeXN0ZW1QYXRoJ1xuXHR9KTtcbn0pO1xuIiwiY2xhc3MgRW1vamlDdXN0b20gZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdjdXN0b21fZW1vamknKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdhbGlhc2VzJzogMSB9KTtcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2V4dGVuc2lvbic6IDF9KTtcblx0fVxuXG5cdC8vZmluZCBvbmVcblx0ZmluZE9uZUJ5SUQoX2lkLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShfaWQsIG9wdGlvbnMpO1xuXHR9XG5cblx0Ly9maW5kXG5cdGZpbmRCeU5hbWVPckFsaWFzKGVtb2ppTmFtZSwgb3B0aW9ucykge1xuXHRcdGxldCBuYW1lID0gZW1vamlOYW1lO1xuXG5cdFx0aWYgKHR5cGVvZiBlbW9qaU5hbWUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRuYW1lID0gZW1vamlOYW1lLnJlcGxhY2UoLzovZywgJycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0JG9yOiBbXG5cdFx0XHRcdHtuYW1lfSxcblx0XHRcdFx0e2FsaWFzZXM6IG5hbWV9XG5cdFx0XHRdXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZEJ5TmFtZU9yQWxpYXNFeGNlcHRJRChuYW1lLCBleGNlcHQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdF9pZDogeyAkbmluOiBbIGV4Y2VwdCBdIH0sXG5cdFx0XHQkb3I6IFtcblx0XHRcdFx0e25hbWV9LFxuXHRcdFx0XHR7YWxpYXNlczogbmFtZX1cblx0XHRcdF1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXG5cdC8vdXBkYXRlXG5cdHNldE5hbWUoX2lkLCBuYW1lKSB7XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRuYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7X2lkfSwgdXBkYXRlKTtcblx0fVxuXG5cdHNldEFsaWFzZXMoX2lkLCBhbGlhc2VzKSB7XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRhbGlhc2VzXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7X2lkfSwgdXBkYXRlKTtcblx0fVxuXG5cdHNldEV4dGVuc2lvbihfaWQsIGV4dGVuc2lvbikge1xuXHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0ZXh0ZW5zaW9uXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7X2lkfSwgdXBkYXRlKTtcblx0fVxuXG5cdC8vIElOU0VSVFxuXHRjcmVhdGUoZGF0YSkge1xuXHRcdHJldHVybiB0aGlzLmluc2VydChkYXRhKTtcblx0fVxuXG5cblx0Ly8gUkVNT1ZFXG5cdHJlbW92ZUJ5SUQoX2lkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKF9pZCk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20gPSBuZXcgRW1vamlDdXN0b20oKTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuTWV0ZW9yLnB1Ymxpc2goJ2Z1bGxFbW9qaURhdGEnLCBmdW5jdGlvbihmaWx0ZXIsIGxpbWl0KSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0Y29uc3QgZmllbGRzID0ge1xuXHRcdG5hbWU6IDEsXG5cdFx0YWxpYXNlczogMSxcblx0XHRleHRlbnNpb246IDFcblx0fTtcblxuXHRmaWx0ZXIgPSBzLnRyaW0oZmlsdGVyKTtcblxuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGZpZWxkcyxcblx0XHRsaW1pdCxcblx0XHRzb3J0OiB7IG5hbWU6IDEgfVxuXHR9O1xuXG5cdGlmIChmaWx0ZXIpIHtcblx0XHRjb25zdCBmaWx0ZXJSZWcgPSBuZXcgUmVnRXhwKHMuZXNjYXBlUmVnRXhwKGZpbHRlciksICdpJyk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLmZpbmRCeU5hbWVPckFsaWFzKGZpbHRlclJlZywgb3B0aW9ucyk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uZmluZCh7fSwgb3B0aW9ucyk7XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0bGlzdEVtb2ppQ3VzdG9tKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kKHt9KS5mZXRjaCgpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlICovXG5NZXRlb3IubWV0aG9kcyh7XG5cdGRlbGV0ZUVtb2ppQ3VzdG9tKGVtb2ppSUQpIHtcblx0XHRsZXQgZW1vamkgPSBudWxsO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1lbW9qaScpKSB7XG5cdFx0XHRlbW9qaSA9IFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLmZpbmRPbmVCeUlEKGVtb2ppSUQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGlmIChlbW9qaSA9PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDdXN0b21fRW1vamlfRXJyb3JfSW52YWxpZF9FbW9qaScsICdJbnZhbGlkIGVtb2ppJywgeyBtZXRob2Q6ICdkZWxldGVFbW9qaUN1c3RvbScgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmRlbGV0ZUZpbGUoZW5jb2RlVVJJQ29tcG9uZW50KGAkeyBlbW9qaS5uYW1lIH0uJHsgZW1vamkuZXh0ZW5zaW9uIH1gKSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20ucmVtb3ZlQnlJRChlbW9qaUlEKTtcblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCdkZWxldGVFbW9qaUN1c3RvbScsIHtlbW9qaURhdGE6IGVtb2ppfSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0aW5zZXJ0T3JVcGRhdGVFbW9qaShlbW9qaURhdGEpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1lbW9qaScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGlmICghcy50cmltKGVtb2ppRGF0YS5uYW1lKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItdGhlLWZpZWxkLWlzLXJlcXVpcmVkJywgJ1RoZSBmaWVsZCBOYW1lIGlzIHJlcXVpcmVkJywgeyBtZXRob2Q6ICdpbnNlcnRPclVwZGF0ZUVtb2ppJywgZmllbGQ6ICdOYW1lJyB9KTtcblx0XHR9XG5cblx0XHQvL2FsbG93IGFsbCBjaGFyYWN0ZXJzIGV4Y2VwdCBjb2xvbiwgd2hpdGVzcGFjZSwgY29tbWEsID4sIDwsICYsIFwiLCAnLCAvLCBcXCwgKCwgKVxuXHRcdC8vbW9yZSBwcmFjdGljYWwgdGhhbiBhbGxvd2luZyBzcGVjaWZpYyBzZXRzIG9mIGNoYXJhY3RlcnM7IGFsc28gYWxsb3dzIGZvcmVpZ24gbGFuZ3VhZ2VzXG5cdFx0Y29uc3QgbmFtZVZhbGlkYXRpb24gPSAvW1xccyw6PjwmXCInXFwvXFxcXFxcKFxcKV0vO1xuXHRcdGNvbnN0IGFsaWFzVmFsaWRhdGlvbiA9IC9bOj48JlxcfFwiJ1xcL1xcXFxcXChcXCldLztcblxuXHRcdC8vc2lsZW50bHkgc3RyaXAgY29sb247IHRoaXMgYWxsb3dzIGZvciB1cGxvYWRpbmcgOmVtb2ppbmFtZTogYXMgZW1vamluYW1lXG5cdFx0ZW1vamlEYXRhLm5hbWUgPSBlbW9qaURhdGEubmFtZS5yZXBsYWNlKC86L2csICcnKTtcblx0XHRlbW9qaURhdGEuYWxpYXNlcyA9IGVtb2ppRGF0YS5hbGlhc2VzLnJlcGxhY2UoLzovZywgJycpO1xuXG5cdFx0aWYgKG5hbWVWYWxpZGF0aW9uLnRlc3QoZW1vamlEYXRhLm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnB1dC1pcy1ub3QtYS12YWxpZC1maWVsZCcsIGAkeyBlbW9qaURhdGEubmFtZSB9IGlzIG5vdCBhIHZhbGlkIG5hbWVgLCB7IG1ldGhvZDogJ2luc2VydE9yVXBkYXRlRW1vamknLCBpbnB1dDogZW1vamlEYXRhLm5hbWUsIGZpZWxkOiAnTmFtZScgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGVtb2ppRGF0YS5hbGlhc2VzKSB7XG5cdFx0XHRpZiAoYWxpYXNWYWxpZGF0aW9uLnRlc3QoZW1vamlEYXRhLmFsaWFzZXMpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWlucHV0LWlzLW5vdC1hLXZhbGlkLWZpZWxkJywgYCR7IGVtb2ppRGF0YS5hbGlhc2VzIH0gaXMgbm90IGEgdmFsaWQgYWxpYXMgc2V0YCwgeyBtZXRob2Q6ICdpbnNlcnRPclVwZGF0ZUVtb2ppJywgaW5wdXQ6IGVtb2ppRGF0YS5hbGlhc2VzLCBmaWVsZDogJ0FsaWFzX1NldCcgfSk7XG5cdFx0XHR9XG5cdFx0XHRlbW9qaURhdGEuYWxpYXNlcyA9IGVtb2ppRGF0YS5hbGlhc2VzLnNwbGl0KC9bXFxzLF0vKTtcblx0XHRcdGVtb2ppRGF0YS5hbGlhc2VzID0gZW1vamlEYXRhLmFsaWFzZXMuZmlsdGVyKEJvb2xlYW4pO1xuXHRcdFx0ZW1vamlEYXRhLmFsaWFzZXMgPSBfLndpdGhvdXQoZW1vamlEYXRhLmFsaWFzZXMsIGVtb2ppRGF0YS5uYW1lKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZW1vamlEYXRhLmFsaWFzZXMgPSBbXTtcblx0XHR9XG5cblx0XHRsZXQgbWF0Y2hpbmdSZXN1bHRzID0gW107XG5cblx0XHRpZiAoZW1vamlEYXRhLl9pZCkge1xuXHRcdFx0bWF0Y2hpbmdSZXN1bHRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uZmluZEJ5TmFtZU9yQWxpYXNFeGNlcHRJRChlbW9qaURhdGEubmFtZSwgZW1vamlEYXRhLl9pZCkuZmV0Y2goKTtcblx0XHRcdGZvciAoY29uc3QgYWxpYXMgb2YgZW1vamlEYXRhLmFsaWFzZXMpIHtcblx0XHRcdFx0bWF0Y2hpbmdSZXN1bHRzID0gbWF0Y2hpbmdSZXN1bHRzLmNvbmNhdChSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kQnlOYW1lT3JBbGlhc0V4Y2VwdElEKGFsaWFzLCBlbW9qaURhdGEuX2lkKS5mZXRjaCgpKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bWF0Y2hpbmdSZXN1bHRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uZmluZEJ5TmFtZU9yQWxpYXMoZW1vamlEYXRhLm5hbWUpLmZldGNoKCk7XG5cdFx0XHRmb3IgKGNvbnN0IGFsaWFzIG9mIGVtb2ppRGF0YS5hbGlhc2VzKSB7XG5cdFx0XHRcdG1hdGNoaW5nUmVzdWx0cyA9IG1hdGNoaW5nUmVzdWx0cy5jb25jYXQoUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uZmluZEJ5TmFtZU9yQWxpYXMoYWxpYXMpLmZldGNoKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChtYXRjaGluZ1Jlc3VsdHMubGVuZ3RoID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ3VzdG9tX0Vtb2ppX0Vycm9yX05hbWVfT3JfQWxpYXNfQWxyZWFkeV9Jbl9Vc2UnLCAnVGhlIGN1c3RvbSBlbW9qaSBvciBvbmUgb2YgaXRzIGFsaWFzZXMgaXMgYWxyZWFkeSBpbiB1c2UnLCB7IG1ldGhvZDogJ2luc2VydE9yVXBkYXRlRW1vamknIH0pO1xuXHRcdH1cblxuXHRcdGlmICghZW1vamlEYXRhLl9pZCkge1xuXHRcdFx0Ly9pbnNlcnQgZW1vamlcblx0XHRcdGNvbnN0IGNyZWF0ZUVtb2ppID0ge1xuXHRcdFx0XHRuYW1lOiBlbW9qaURhdGEubmFtZSxcblx0XHRcdFx0YWxpYXNlczogZW1vamlEYXRhLmFsaWFzZXMsXG5cdFx0XHRcdGV4dGVuc2lvbjogZW1vamlEYXRhLmV4dGVuc2lvblxuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3QgX2lkID0gUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uY3JlYXRlKGNyZWF0ZUVtb2ppKTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgndXBkYXRlRW1vamlDdXN0b20nLCB7ZW1vamlEYXRhOiBjcmVhdGVFbW9qaX0pO1xuXG5cdFx0XHRyZXR1cm4gX2lkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvL3VwZGF0ZSBlbW9qaVxuXHRcdFx0aWYgKGVtb2ppRGF0YS5uZXdGaWxlKSB7XG5cdFx0XHRcdFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5kZWxldGVGaWxlKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLm5hbWUgfS4keyBlbW9qaURhdGEuZXh0ZW5zaW9uIH1gKSk7XG5cdFx0XHRcdFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5kZWxldGVGaWxlKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLm5hbWUgfS4keyBlbW9qaURhdGEucHJldmlvdXNFeHRlbnNpb24gfWApKTtcblx0XHRcdFx0Um9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmRlbGV0ZUZpbGUoZW5jb2RlVVJJQ29tcG9uZW50KGAkeyBlbW9qaURhdGEucHJldmlvdXNOYW1lIH0uJHsgZW1vamlEYXRhLmV4dGVuc2lvbiB9YCkpO1xuXHRcdFx0XHRSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZGVsZXRlRmlsZShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5wcmV2aW91c05hbWUgfS4keyBlbW9qaURhdGEucHJldmlvdXNFeHRlbnNpb24gfWApKTtcblxuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5zZXRFeHRlbnNpb24oZW1vamlEYXRhLl9pZCwgZW1vamlEYXRhLmV4dGVuc2lvbik7XG5cdFx0XHR9IGVsc2UgaWYgKGVtb2ppRGF0YS5uYW1lICE9PSBlbW9qaURhdGEucHJldmlvdXNOYW1lKSB7XG5cdFx0XHRcdGNvbnN0IHJzID0gUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmdldEZpbGVXaXRoUmVhZFN0cmVhbShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5wcmV2aW91c05hbWUgfS4keyBlbW9qaURhdGEucHJldmlvdXNFeHRlbnNpb24gfWApKTtcblx0XHRcdFx0aWYgKHJzICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmRlbGV0ZUZpbGUoZW5jb2RlVVJJQ29tcG9uZW50KGAkeyBlbW9qaURhdGEubmFtZSB9LiR7IGVtb2ppRGF0YS5leHRlbnNpb24gfWApKTtcblx0XHRcdFx0XHRjb25zdCB3cyA9IFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5jcmVhdGVXcml0ZVN0cmVhbShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5uYW1lIH0uJHsgZW1vamlEYXRhLnByZXZpb3VzRXh0ZW5zaW9uIH1gKSwgcnMuY29udGVudFR5cGUpO1xuXHRcdFx0XHRcdHdzLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZGVsZXRlRmlsZShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5wcmV2aW91c05hbWUgfS4keyBlbW9qaURhdGEucHJldmlvdXNFeHRlbnNpb24gfWApKVxuXHRcdFx0XHRcdCkpO1xuXHRcdFx0XHRcdHJzLnJlYWRTdHJlYW0ucGlwZSh3cyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKGVtb2ppRGF0YS5uYW1lICE9PSBlbW9qaURhdGEucHJldmlvdXNOYW1lKSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLnNldE5hbWUoZW1vamlEYXRhLl9pZCwgZW1vamlEYXRhLm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZW1vamlEYXRhLmFsaWFzZXMpIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uc2V0QWxpYXNlcyhlbW9qaURhdGEuX2lkLCBlbW9qaURhdGEuYWxpYXNlcyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5zZXRBbGlhc2VzKGVtb2ppRGF0YS5faWQsIFtdKTtcblx0XHRcdH1cblxuXHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgndXBkYXRlRW1vamlDdXN0b20nLCB7ZW1vamlEYXRhfSk7XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZSAqL1xuTWV0ZW9yLm1ldGhvZHMoe1xuXHR1cGxvYWRFbW9qaUN1c3RvbShiaW5hcnlDb250ZW50LCBjb250ZW50VHlwZSwgZW1vamlEYXRhKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtZW1vamknKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnKTtcblx0XHR9XG5cblx0XHQvL2RlbGV0ZSBhbGlhc2VzIGZvciBub3RpZmljYXRpb24gcHVycG9zZXMuIGhlcmUsIGl0IGlzIGEgc3RyaW5nIHJhdGhlciB0aGFuIGFuIGFycmF5XG5cdFx0ZGVsZXRlIGVtb2ppRGF0YS5hbGlhc2VzO1xuXHRcdGNvbnN0IGZpbGUgPSBuZXcgQnVmZmVyKGJpbmFyeUNvbnRlbnQsICdiaW5hcnknKTtcblxuXHRcdGNvbnN0IHJzID0gUm9ja2V0Q2hhdEZpbGUuYnVmZmVyVG9TdHJlYW0oZmlsZSk7XG5cdFx0Um9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmRlbGV0ZUZpbGUoZW5jb2RlVVJJQ29tcG9uZW50KGAkeyBlbW9qaURhdGEubmFtZSB9LiR7IGVtb2ppRGF0YS5leHRlbnNpb24gfWApKTtcblx0XHRjb25zdCB3cyA9IFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5jcmVhdGVXcml0ZVN0cmVhbShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5uYW1lIH0uJHsgZW1vamlEYXRhLmV4dGVuc2lvbiB9YCksIGNvbnRlbnRUeXBlKTtcblx0XHR3cy5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PlxuXHRcdFx0TWV0ZW9yLnNldFRpbWVvdXQoKCkgPT4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgndXBkYXRlRW1vamlDdXN0b20nLCB7ZW1vamlEYXRhfSksIDUwMClcblx0XHQpKTtcblxuXHRcdHJzLnBpcGUod3MpO1xuXHR9XG59KTtcbiJdfQ==
