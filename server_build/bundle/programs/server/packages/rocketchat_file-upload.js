(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var Slingshot = Package['edgee:slingshot'].Slingshot;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var FileUpload, FileUploadBase, file, options, fileUploadHandler;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:file-upload":{"globalFileRestrictions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/globalFileRestrictions.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
const slingShotConfig = {
  authorize(file
  /*, metaContext*/
  ) {
    //Deny uploads if user is not logged in.
    if (!this.userId) {
      throw new Meteor.Error('login-required', 'Please login before posting files');
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      throw new Meteor.Error(TAPi18n.__('error-invalid-file-type'));
    }

    const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize');

    if (maxFileSize >= -1 && maxFileSize < file.size) {
      throw new Meteor.Error(TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }));
    }

    return true;
  },

  maxSize: 0,
  allowedFileTypes: null
};
Slingshot.fileRestrictions('rocketchat-uploads', slingShotConfig);
Slingshot.fileRestrictions('rocketchat-uploads-gs', slingShotConfig);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUpload.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
let maxFileSize = 0;
FileUpload = {
  validateFileUpload(file) {
    if (!Match.test(file.rid, String)) {
      return false;
    } // livechat users can upload files but they don't have an userId


    const user = file.userId ? Meteor.user() : null;
    const room = RocketChat.models.Rooms.findOneById(file.rid);
    const directMessageAllow = RocketChat.settings.get('FileUpload_Enabled_Direct');
    const fileUploadAllowed = RocketChat.settings.get('FileUpload_Enabled');

    if (RocketChat.authz.canAccessRoom(room, user, file) !== true) {
      return false;
    }

    const language = user ? user.language : 'en';

    if (!fileUploadAllowed) {
      const reason = TAPi18n.__('FileUpload_Disabled', language);

      throw new Meteor.Error('error-file-upload-disabled', reason);
    }

    if (!directMessageAllow && room.t === 'd') {
      const reason = TAPi18n.__('File_not_allowed_direct_messages', language);

      throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
    } // -1 maxFileSize means there is no limit


    if (maxFileSize >= -1 && file.size > maxFileSize) {
      const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }, language);

      throw new Meteor.Error('error-file-too-large', reason);
    }

    if (maxFileSize > 0) {
      if (file.size > maxFileSize) {
        const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
          size: filesize(maxFileSize)
        }, language);

        throw new Meteor.Error('error-file-too-large', reason);
      }
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      const reason = TAPi18n.__('File_type_is_not_accepted', language);

      throw new Meteor.Error('error-invalid-file-type', reason);
    }

    return true;
  }

};
RocketChat.settings.get('FileUpload_MaxFileSize', function (key, value) {
  try {
    maxFileSize = parseInt(value);
  } catch (e) {
    maxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileUploadBase.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUploadBase.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
  insert(userId, doc) {
    if (userId) {
      return true;
    } // allow inserts from slackbridge (message_id = slack-timestamp-milli)


    if (doc && doc.message_id && doc.message_id.indexOf('slack-') === 0) {
      return true;
    } // allow inserts to the UserDataFiles store


    if (doc && doc.store && doc.store.split(':').pop() === 'UserDataFiles') {
      return true;
    }

    if (RocketChat.authz.canAccessRoom(null, null, doc)) {
      return true;
    }

    return false;
  },

  update(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  },

  remove(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  }

});
FileUploadBase = class FileUploadBase {
  constructor(store, meta, file) {
    this.id = Random.id();
    this.meta = meta;
    this.file = file;
    this.store = store;
  }

  getProgress() {}

  getFileName() {
    return this.meta.name;
  }

  start(callback) {
    this.handler = new UploadFS.Uploader({
      store: this.store,
      data: this.file,
      file: this.meta,
      onError: err => {
        return callback(err);
      },
      onComplete: fileData => {
        const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');

        file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');
        return callback(null, file, this.store.options.name);
      }
    });

    this.handler.onProgress = (file, progress) => {
      this.onProgress(progress);
    };

    return this.handler.start();
  }

  onProgress() {}

  stop() {
    return this.handler.stop();
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/FileUpload.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FileUploadClass: () => FileUploadClass
});
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 1);
let mime;
module.watch(require("mime-type/with-db"), {
  default(v) {
    mime = v;
  }

}, 2);
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 3);
let sharp;
module.watch(require("sharp"), {
  default(v) {
    sharp = v;
  }

}, 4);
let Cookies;
module.watch(require("meteor/ostrio:cookies"), {
  Cookies(v) {
    Cookies = v;
  }

}, 5);
const cookie = new Cookies();
Object.assign(FileUpload, {
  handlers: {},

  configureUploadsStore(store, name, options) {
    const type = name.split(':').pop();
    const stores = UploadFS.getStores();
    delete stores[name];
    return new UploadFS.store[store](Object.assign({
      name
    }, options, FileUpload[`default${type}`]()));
  },

  defaultUploads() {
    return {
      collection: RocketChat.models.Uploads.model,
      filter: new UploadFS.Filter({
        onCheck: FileUpload.validateFileUpload
      }),

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/${file.rid}/${file.userId}/${file._id}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  defaultAvatars() {
    return {
      collection: RocketChat.models.Avatars.model,

      // filter: new UploadFS.Filter({
      // 	onCheck: FileUpload.validateFileUpload
      // }),
      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/avatars/${file.userId}`;
      },

      onValidate: FileUpload.avatarsOnValidate,
      onFinishUpload: FileUpload.avatarsOnFinishUpload
    };
  },

  defaultUserDataFiles() {
    return {
      collection: RocketChat.models.UserDataFiles.model,

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/userData/${file.userId}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  avatarsOnValidate(file) {
    if (RocketChat.settings.get('Accounts_AvatarResize') !== true) {
      return;
    }

    const tempFilePath = UploadFS.getTempFilePath(file._id);
    const height = RocketChat.settings.get('Accounts_AvatarSize');
    const future = new Future();
    const s = sharp(tempFilePath);
    s.rotate(); // Get metadata to resize the image the first time to keep "inside" the dimensions
    // then resize again to create the canvas around

    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      if (!metadata) {
        metadata = {};
      }

      s.toFormat(sharp.format.jpeg).resize(Math.min(height || 0, metadata.width || Infinity), Math.min(height || 0, metadata.height || Infinity)).pipe(sharp().resize(height, height).background('#FFFFFF').embed()) // Use buffer to get the result in memory then replace the existing file
      // There is no option to override a file using this library
      .toBuffer().then(Meteor.bindEnvironment(outputBuffer => {
        fs.writeFile(tempFilePath, outputBuffer, Meteor.bindEnvironment(err => {
          if (err != null) {
            console.error(err);
          }

          const size = fs.lstatSync(tempFilePath).size;
          this.getCollection().direct.update({
            _id: file._id
          }, {
            $set: {
              size
            }
          });
          future.return();
        }));
      }));
    }));
    return future.wait();
  },

  resizeImagePreview(file) {
    file = RocketChat.models.Uploads.findOneById(file._id);
    file = FileUpload.addExtensionTo(file);

    const image = FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);

    const transformer = sharp().resize(32, 32).max().jpeg().blur();
    const result = transformer.toBuffer().then(out => out.toString('base64'));
    image.pipe(transformer);
    return result;
  },

  uploadsOnValidate(file) {
    if (!/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
      return;
    }

    const tmpFile = UploadFS.getTempFilePath(file._id);
    const fut = new Future();
    const s = sharp(tmpFile);
    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      if (err != null) {
        console.error(err);
        return fut.return();
      }

      const identify = {
        format: metadata.format,
        size: {
          width: metadata.width,
          height: metadata.height
        }
      };

      if (metadata.orientation == null) {
        return fut.return();
      }

      s.rotate().toFile(`${tmpFile}.tmp`).then(Meteor.bindEnvironment(() => {
        fs.unlink(tmpFile, Meteor.bindEnvironment(() => {
          fs.rename(`${tmpFile}.tmp`, tmpFile, Meteor.bindEnvironment(() => {
            const size = fs.lstatSync(tmpFile).size;
            this.getCollection().direct.update({
              _id: file._id
            }, {
              $set: {
                size,
                identify
              }
            });
            fut.return();
          }));
        }));
      })).catch(err => {
        console.error(err);
        fut.return();
      });
    }));
    return fut.wait();
  },

  avatarsOnFinishUpload(file) {
    // update file record to match user's username
    const user = RocketChat.models.Users.findOneById(file.userId);
    const oldAvatar = RocketChat.models.Avatars.findOneByName(user.username);

    if (oldAvatar) {
      RocketChat.models.Avatars.deleteFile(oldAvatar._id);
    }

    RocketChat.models.Avatars.updateFileNameById(file._id, user.username); // console.log('upload finished ->', file);
  },

  requestCanAccessFiles({
    headers = {},
    query = {}
  }) {
    if (!RocketChat.settings.get('FileUpload_ProtectFiles')) {
      return true;
    }

    let {
      rc_uid,
      rc_token,
      rc_rid,
      rc_room_type
    } = query;

    if (!rc_uid && headers.cookie) {
      rc_uid = cookie.get('rc_uid', headers.cookie);
      rc_token = cookie.get('rc_token', headers.cookie);
      rc_rid = cookie.get('rc_rid', headers.cookie);
      rc_room_type = cookie.get('rc_room_type', headers.cookie);
    }

    const isAuthorizedByCookies = rc_uid && rc_token && RocketChat.models.Users.findOneByIdAndLoginToken(rc_uid, rc_token);
    const isAuthorizedByHeaders = headers['x-user-id'] && headers['x-auth-token'] && RocketChat.models.Users.findOneByIdAndLoginToken(headers['x-user-id'], headers['x-auth-token']);
    const isAuthorizedByRoom = rc_room_type && RocketChat.roomTypes.getConfig(rc_room_type).canAccessUploadedFile({
      rc_uid,
      rc_rid,
      rc_token
    });
    return isAuthorizedByCookies || isAuthorizedByHeaders || isAuthorizedByRoom;
  },

  addExtensionTo(file) {
    if (mime.lookup(file.name) === file.type) {
      return file;
    }

    const ext = mime.extension(file.type);

    if (ext && false === new RegExp(`\.${ext}$`, 'i').test(file.name)) {
      file.name = `${file.name}.${ext}`;
    }

    return file;
  },

  getStore(modelName) {
    const storageType = RocketChat.settings.get('FileUpload_Storage_Type');
    const handlerName = `${storageType}:${modelName}`;
    return this.getStoreByName(handlerName);
  },

  getStoreByName(handlerName) {
    if (this.handlers[handlerName] == null) {
      console.error(`Upload handler "${handlerName}" does not exists`);
    }

    return this.handlers[handlerName];
  },

  get(file, req, res, next) {
    const store = this.getStoreByName(file.store);

    if (store && store.get) {
      return store.get(file, req, res, next);
    }

    res.writeHead(404);
    res.end();
  },

  copy(file, targetFile) {
    const store = this.getStoreByName(file.store);
    const out = fs.createWriteStream(targetFile);
    file = FileUpload.addExtensionTo(file);

    if (store.copy) {
      store.copy(file, out);
      return true;
    }

    return false;
  }

});

class FileUploadClass {
  constructor({
    name,
    model,
    store,
    get,
    insert,
    getStore,
    copy
  }) {
    this.name = name;
    this.model = model || this.getModelFromName();
    this._store = store || UploadFS.getStore(name);
    this.get = get;
    this.copy = copy;

    if (insert) {
      this.insert = insert;
    }

    if (getStore) {
      this.getStore = getStore;
    }

    FileUpload.handlers[name] = this;
  }

  getStore() {
    return this._store;
  }

  get store() {
    return this.getStore();
  }

  set store(store) {
    this._store = store;
  }

  getModelFromName() {
    return RocketChat.models[this.name.split(':')[1]];
  }

  delete(fileId) {
    if (this.store && this.store.delete) {
      this.store.delete(fileId);
    }

    return this.model.deleteFile(fileId);
  }

  deleteById(fileId) {
    const file = this.model.findOneById(fileId);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  deleteByName(fileName) {
    const file = this.model.findOneByName(fileName);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  insert(fileData, streamOrBuffer, cb) {
    fileData.size = parseInt(fileData.size) || 0; // Check if the fileData matches store filter

    const filter = this.store.getFilter();

    if (filter && filter.check) {
      filter.check(fileData);
    }

    const fileId = this.store.create(fileData);
    const token = this.store.createToken(fileId);
    const tmpFile = UploadFS.getTempFilePath(fileId);

    try {
      if (streamOrBuffer instanceof stream) {
        streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
      } else if (streamOrBuffer instanceof Buffer) {
        fs.writeFileSync(tmpFile, streamOrBuffer);
      } else {
        throw new Error('Invalid file type');
      }

      const file = Meteor.call('ufsComplete', fileId, this.name, token);

      if (cb) {
        cb(null, file);
      }

      return file;
    } catch (e) {
      if (cb) {
        cb(e);
      } else {
        throw e;
      }
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/proxy.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 0);
let URL;
module.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
const logger = new Logger('UploadProxy');
WebApp.connectHandlers.stack.unshift({
  route: '',
  handle: Meteor.bindEnvironment(function (req, res, next) {
    // Quick check to see if request should be catch
    if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
      return next();
    }

    logger.debug('Upload URL:', req.url);

    if (req.method !== 'POST') {
      return next();
    } // Remove store path


    const parsedUrl = URL.parse(req.url);
    const path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1); // Get store

    const regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
    const match = regExp.exec(path); // Request is not valid

    if (match === null) {
      res.writeHead(400);
      res.end();
      return;
    } // Get store


    const store = UploadFS.getStore(match[1]);

    if (!store) {
      res.writeHead(404);
      res.end();
      return;
    } // Get file


    const fileId = match[2];
    const file = store.getCollection().findOne({
      _id: fileId
    });

    if (file === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (file.instanceId === InstanceStatus.id()) {
      logger.debug('Correct instance');
      return next();
    } // Proxy to other instance


    const instance = InstanceStatus.getCollection().findOne({
      _id: file.instanceId
    });

    if (instance == null) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (instance.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
      instance.extraInformation.host = 'localhost';
    }

    logger.debug('Wrong instance, proxing to:', `${instance.extraInformation.host}:${instance.extraInformation.port}`);
    const options = {
      hostname: instance.extraInformation.host,
      port: instance.extraInformation.port,
      path: req.originalUrl,
      method: 'POST'
    };
    const proxy = http.request(options, function (proxy_res) {
      proxy_res.pipe(res, {
        end: true
      });
    });
    req.pipe(proxy, {
      end: true
    });
  })
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requests.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/requests.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals FileUpload, WebApp */
WebApp.connectHandlers.use('/file-upload/', function (req, res, next) {
  const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

  if (match[1]) {
    const file = RocketChat.models.Uploads.findOneById(match[1]);

    if (file) {
      if (!Meteor.settings.public.sandstorm && !FileUpload.requestCanAccessFiles(req)) {
        res.writeHead(403);
        return res.end();
      }

      res.setHeader('Content-Security-Policy', 'default-src \'none\'');
      return FileUpload.get(file, req, res, next);
    }
  }

  res.writeHead(404);
  res.end();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"config":{"_configUploadStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/_configUploadStorage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
module.watch(require("./AmazonS3.js"));
module.watch(require("./FileSystem.js"));
module.watch(require("./GoogleStorage.js"));
module.watch(require("./GridFS.js"));
module.watch(require("./Webdav.js"));
module.watch(require("./Slingshot_DEPRECATED.js"));

const configStore = _.debounce(() => {
  const store = RocketChat.settings.get('FileUpload_Storage_Type');

  if (store) {
    console.log('Setting default file store to', store);
    UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
    UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
    UploadFS.getStores().UserDataFiles = UploadFS.getStore(`${store}:UserDataFiles`);
  }
}, 1000);

RocketChat.settings.get(/^FileUpload_/, configStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"AmazonS3.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/AmazonS3.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/AmazonS3/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    const storeType = file.store.split(':').pop();

    if (RocketChat.settings.get(`FileUpload_S3_Proxy_${storeType}`)) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(res));
    } else {
      res.removeHeader('Content-Length');
      res.setHeader('Location', fileUrl);
      res.writeHead(302);
      res.end();
    }
  } else {
    res.end();
  }
};

const copy = function (file, out) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    const request = /^https:/.test(fileUrl) ? https : http;
    request.get(fileUrl, fileRes => fileRes.pipe(out));
  } else {
    out.end();
  }
};

const AmazonS3Uploads = new FileUploadClass({
  name: 'AmazonS3:Uploads',
  get,
  copy // store setted bellow

});
const AmazonS3Avatars = new FileUploadClass({
  name: 'AmazonS3:Avatars',
  get,
  copy // store setted bellow

});
const AmazonS3UserDataFiles = new FileUploadClass({
  name: 'AmazonS3:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
  const Region = RocketChat.settings.get('FileUpload_S3_Region');
  const SignatureVersion = RocketChat.settings.get('FileUpload_S3_SignatureVersion');
  const ForcePathStyle = RocketChat.settings.get('FileUpload_S3_ForcePathStyle'); // const CDN = RocketChat.settings.get('FileUpload_S3_CDN');

  const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

  if (!Bucket) {
    return;
  }

  const config = {
    connection: {
      signatureVersion: SignatureVersion,
      s3ForcePathStyle: ForcePathStyle,
      params: {
        Bucket,
        ACL: Acl
      },
      region: Region
    },
    URLExpiryTimeSpan
  };

  if (AWSAccessKeyId) {
    config.connection.accessKeyId = AWSAccessKeyId;
  }

  if (AWSSecretAccessKey) {
    config.connection.secretAccessKey = AWSSecretAccessKey;
  }

  if (BucketURL) {
    config.connection.endpoint = BucketURL;
  }

  AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
  AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
  AmazonS3UserDataFiles.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3UserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileSystem.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/FileSystem.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 1);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 2);
const FileSystemUploads = new FileUploadClass({
  name: 'FileSystem:Uploads',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  },

  copy(file, out) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(out);
      }
    } catch (e) {
      out.end();
      return;
    }
  }

});
const FileSystemAvatars = new FileUploadClass({
  name: 'FileSystem:Avatars',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});
const FileSystemUserDataFiles = new FileUploadClass({
  name: 'FileSystem:UserDataFiles',

  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});

const createFileSystemStore = _.debounce(function () {
  const options = {
    path: RocketChat.settings.get('FileUpload_FileSystemPath') //'/tmp/uploads/photos',

  };
  FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
  FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
  FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options); // DEPRECATED backwards compatibililty (remove)

  UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GoogleStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GoogleStorage.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/GoogleStorage/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      const storeType = file.store.split(':').pop();

      if (RocketChat.settings.get(`FileUpload_GoogleStorage_Proxy_${storeType}`)) {
        const request = /^https:/.test(fileUrl) ? https : http;
        request.get(fileUrl, fileRes => fileRes.pipe(res));
      } else {
        res.removeHeader('Content-Length');
        res.setHeader('Location', fileUrl);
        res.writeHead(302);
        res.end();
      }
    } else {
      res.end();
    }
  });
};

const copy = function (file, out) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(out));
    } else {
      out.end();
    }
  });
};

const GoogleCloudStorageUploads = new FileUploadClass({
  name: 'GoogleCloudStorage:Uploads',
  get,
  copy // store setted bellow

});
const GoogleCloudStorageAvatars = new FileUploadClass({
  name: 'GoogleCloudStorage:Avatars',
  get,
  copy // store setted bellow

});
const GoogleCloudStorageUserDataFiles = new FileUploadClass({
  name: 'GoogleCloudStorage:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

  if (!bucket || !accessId || !secret) {
    return;
  }

  const config = {
    connection: {
      credentials: {
        client_email: accessId,
        private_key: secret
      }
    },
    bucket,
    URLExpiryTimeSpan
  };
  GoogleCloudStorageUploads.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUploads.name, config);
  GoogleCloudStorageAvatars.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageAvatars.name, config);
  GoogleCloudStorageUserDataFiles.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GridFS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GridFS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 0);
let zlib;
module.watch(require("zlib"), {
  default(v) {
    zlib = v;
  }

}, 1);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 2);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 3);
const logger = new Logger('FileUpload');

function ExtractRange(options) {
  if (!(this instanceof ExtractRange)) {
    return new ExtractRange(options);
  }

  this.start = options.start;
  this.stop = options.stop;
  this.bytes_read = 0;
  stream.Transform.call(this, options);
}

util.inherits(ExtractRange, stream.Transform);

ExtractRange.prototype._transform = function (chunk, enc, cb) {
  if (this.bytes_read > this.stop) {
    // done reading
    this.end();
  } else if (this.bytes_read + chunk.length < this.start) {// this chunk is still before the start byte
  } else {
    let start;
    let stop;

    if (this.start <= this.bytes_read) {
      start = 0;
    } else {
      start = this.start - this.bytes_read;
    }

    if (this.stop - this.bytes_read + 1 < chunk.length) {
      stop = this.stop - this.bytes_read + 1;
    } else {
      stop = chunk.length;
    }

    const newchunk = chunk.slice(start, stop);
    this.push(newchunk);
  }

  this.bytes_read += chunk.length;
  cb();
};

const getByteRange = function (header) {
  if (header) {
    const matches = header.match(/(\d+)-(\d+)/);

    if (matches) {
      return {
        start: parseInt(matches[1], 10),
        stop: parseInt(matches[2], 10)
      };
    }
  }

  return null;
}; // code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310


const readFromGridFS = function (storeName, fileId, file, req, res) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  const ws = new stream.PassThrough();
  [rs, ws].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    res.end();
  }));
  ws.on('close', function () {
    // Close output stream at the end
    ws.emit('end');
  });
  const accept = req.headers['accept-encoding'] || ''; // Transform stream

  store.transformRead(rs, ws, fileId, file, req);
  const range = getByteRange(req.headers.range);
  let out_of_range = false;

  if (range) {
    out_of_range = range.start > file.size || range.stop <= range.start || range.stop > file.size;
  } // Compress data using gzip


  if (accept.match(/\bgzip\b/) && range === null) {
    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createGzip()).pipe(res);
  } else if (accept.match(/\bdeflate\b/) && range === null) {
    // Compress data using deflate
    res.setHeader('Content-Encoding', 'deflate');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createDeflate()).pipe(res);
  } else if (range && out_of_range) {
    // out of range request, return 416
    res.removeHeader('Content-Length');
    res.removeHeader('Content-Type');
    res.removeHeader('Content-Disposition');
    res.removeHeader('Last-Modified');
    res.setHeader('Content-Range', `bytes */${file.size}`);
    res.writeHead(416);
    res.end();
  } else if (range) {
    res.setHeader('Content-Range', `bytes ${range.start}-${range.stop}/${file.size}`);
    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', range.stop - range.start + 1);
    res.writeHead(206);
    logger.debug('File upload extracting range');
    ws.pipe(new ExtractRange({
      start: range.start,
      stop: range.stop
    })).pipe(res);
  } else {
    res.writeHead(200);
    ws.pipe(res);
  }
};

const copyFromGridFS = function (storeName, fileId, file, out) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  [rs, out].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    out.end();
  }));
  rs.pipe(out);
};

FileUpload.configureUploadsStore('GridFS', 'GridFS:Uploads', {
  collectionName: 'rocketchat_uploads'
});
FileUpload.configureUploadsStore('GridFS', 'GridFS:UserDataFiles', {
  collectionName: 'rocketchat_userDataFiles'
}); // DEPRECATED: backwards compatibility (remove)

UploadFS.getStores()['rocketchat_uploads'] = UploadFS.getStores()['GridFS:Uploads'];
FileUpload.configureUploadsStore('GridFS', 'GridFS:Avatars', {
  collectionName: 'rocketchat_avatars'
});
new FileUploadClass({
  name: 'GridFS:Uploads',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  },

  copy(file, out) {
    copyFromGridFS(file.store, file._id, file, out);
  }

});
new FileUploadClass({
  name: 'GridFS:UserDataFiles',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  },

  copy(file, out) {
    copyFromGridFS(file.store, file._id, file, out);
  }

});
new FileUploadClass({
  name: 'GridFS:Avatars',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    return readFromGridFS(file.store, file._id, file, req, res);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Slingshot_DEPRECATED.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/Slingshot_DEPRECATED.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const configureSlingshot = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const cdn = RocketChat.settings.get('FileUpload_S3_CDN');
  const region = RocketChat.settings.get('FileUpload_S3_Region');
  const bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');
  delete Slingshot._directives['rocketchat-uploads'];

  if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
    if (Slingshot._directives['rocketchat-uploads']) {
      delete Slingshot._directives['rocketchat-uploads'];
    }

    const config = {
      bucket,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          AmazonS3: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'AmazonS3:Uploads', file, upload);
        return path;
      },

      AWSAccessKeyId: accessKey,
      AWSSecretAccessKey: secretKey
    };

    if (!_.isEmpty(acl)) {
      config.acl = acl;
    }

    if (!_.isEmpty(cdn)) {
      config.cdn = cdn;
    }

    if (!_.isEmpty(region)) {
      config.region = region;
    }

    if (!_.isEmpty(bucketUrl)) {
      config.bucketUrl = bucketUrl;
    }

    try {
      Slingshot.createDirective('rocketchat-uploads', Slingshot.S3Storage, config);
    } catch (e) {
      console.error('Error configuring S3 ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);
RocketChat.settings.get(/^FileUpload_S3_/, configureSlingshot);

const createGoogleStorageDirective = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  delete Slingshot._directives['rocketchat-uploads-gs'];

  if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
    if (Slingshot._directives['rocketchat-uploads-gs']) {
      delete Slingshot._directives['rocketchat-uploads-gs'];
    }

    const config = {
      bucket,
      GoogleAccessId: accessId,
      GoogleSecretKey: secret,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          GoogleStorage: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'GoogleCloudStorage:Uploads', file, upload);
        return path;
      }

    };

    try {
      Slingshot.createDirective('rocketchat-uploads-gs', Slingshot.GoogleCloud, config);
    } catch (e) {
      console.error('Error configuring GoogleCloudStorage ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get(/^FileUpload_GoogleStorage_/, createGoogleStorageDirective);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Webdav.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/Webdav.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/Webdav/server.js"));

const get = function (file, req, res) {
  this.store.getReadStream(file._id, file).pipe(res);
};

const copy = function (file, out) {
  this.store.getReadStream(file._id, file).pipe(out);
};

const WebdavUploads = new FileUploadClass({
  name: 'Webdav:Uploads',
  get,
  copy // store setted bellow

});
const WebdavAvatars = new FileUploadClass({
  name: 'Webdav:Avatars',
  get,
  copy // store setted bellow

});
const WebdavUserDataFiles = new FileUploadClass({
  name: 'Webdav:UserDataFiles',
  get,
  copy // store setted bellow

});

const configure = _.debounce(function () {
  const uploadFolderPath = RocketChat.settings.get('FileUpload_Webdav_Upload_Folder_Path');
  const server = RocketChat.settings.get('FileUpload_Webdav_Server_URL');
  const username = RocketChat.settings.get('FileUpload_Webdav_Username');
  const password = RocketChat.settings.get('FileUpload_Webdav_Password');

  if (!server || !username || !password) {
    return;
  }

  const config = {
    connection: {
      credentials: {
        server,
        username,
        password
      }
    },
    uploadFolderPath
  };
  WebdavUploads.store = FileUpload.configureUploadsStore('Webdav', WebdavUploads.name, config);
  WebdavAvatars.store = FileUpload.configureUploadsStore('Webdav', WebdavAvatars.name, config);
  WebdavUserDataFiles.store = FileUpload.configureUploadsStore('Webdav', WebdavUserDataFiles.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_Webdav_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"sendFileMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/sendFileMessage.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'sendFileMessage'(roomId, store, file, msgData = {}) {
    return Promise.asyncApply(() => {
      if (!Meteor.userId()) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
          method: 'sendFileMessage'
        });
      }

      const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

      if (!room) {
        return false;
      }

      check(msgData, {
        avatar: Match.Optional(String),
        emoji: Match.Optional(String),
        alias: Match.Optional(String),
        groupable: Match.Optional(Boolean),
        msg: Match.Optional(String)
      });
      RocketChat.models.Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));
      const fileUrl = `/file-upload/${file._id}/${encodeURI(file.name)}`;
      const attachment = {
        title: file.name,
        type: 'file',
        description: file.description,
        title_link: fileUrl,
        title_link_download: true
      };

      if (/^image\/.+/.test(file.type)) {
        attachment.image_url = fileUrl;
        attachment.image_type = file.type;
        attachment.image_size = file.size;

        if (file.identify && file.identify.size) {
          attachment.image_dimensions = file.identify.size;
        }

        attachment.image_preview = Promise.await(FileUpload.resizeImagePreview(file));
      } else if (/^audio\/.+/.test(file.type)) {
        attachment.audio_url = fileUrl;
        attachment.audio_type = file.type;
        attachment.audio_size = file.size;
      } else if (/^video\/.+/.test(file.type)) {
        attachment.video_url = fileUrl;
        attachment.video_type = file.type;
        attachment.video_size = file.size;
      }

      const user = Meteor.user();
      let msg = Object.assign({
        _id: Random.id(),
        rid: roomId,
        ts: new Date(),
        msg: '',
        file: {
          _id: file._id,
          name: file.name,
          type: file.type
        },
        groupable: false,
        attachments: [attachment]
      }, msgData);
      msg = Meteor.call('sendMessage', msg);
      Meteor.defer(() => RocketChat.callbacks.run('afterFileUpload', {
        user,
        room,
        message: msg
      }));
      return msg;
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getS3FileUrl.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/getS3FileUrl.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UploadFS */
let protectedFiles;
RocketChat.settings.get('FileUpload_ProtectFiles', function (key, value) {
  protectedFiles = value;
});
Meteor.methods({
  getS3FileUrl(fileId) {
    if (protectedFiles && !Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendFileMessage'
      });
    }

    const file = RocketChat.models.Uploads.findOneById(fileId);
    return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/startup/settings.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('FileUpload', function () {
  this.add('FileUpload_Enabled', true, {
    type: 'boolean',
    public: true
  });
  this.add('FileUpload_MaxFileSize', 2097152, {
    type: 'int',
    public: true
  });
  this.add('FileUpload_MediaTypeWhiteList', 'image/*,audio/*,video/*,application/zip,application/x-rar-compressed,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', {
    type: 'string',
    public: true,
    i18nDescription: 'FileUpload_MediaTypeWhiteListDescription'
  });
  this.add('FileUpload_ProtectFiles', true, {
    type: 'boolean',
    public: true,
    i18nDescription: 'FileUpload_ProtectFilesDescription'
  });
  this.add('FileUpload_Storage_Type', 'GridFS', {
    type: 'select',
    values: [{
      key: 'GridFS',
      i18nLabel: 'GridFS'
    }, {
      key: 'AmazonS3',
      i18nLabel: 'AmazonS3'
    }, {
      key: 'GoogleCloudStorage',
      i18nLabel: 'GoogleCloudStorage'
    }, {
      key: 'Webdav',
      i18nLabel: 'WebDAV'
    }, {
      key: 'FileSystem',
      i18nLabel: 'FileSystem'
    }],
    public: true
  });
  this.section('Amazon S3', function () {
    this.add('FileUpload_S3_Bucket', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Acl', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSAccessKeyId', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSSecretAccessKey', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_CDN', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Region', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_BucketURL', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'Override_URL_to_which_files_are_uploaded_This_url_also_used_for_downloads_unless_a_CDN_is_given.'
    });
    this.add('FileUpload_S3_SignatureVersion', 'v4', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_ForcePathStyle', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_URLExpiryTimeSpan', 120, {
      type: 'int',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'FileUpload_S3_URLExpiryTimeSpan_Description'
    });
    this.add('FileUpload_S3_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
  });
  this.section('Google Cloud Storage', function () {
    this.add('FileUpload_GoogleStorage_Bucket', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_AccessId', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Secret', '', {
      type: 'string',
      multiline: true,
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
  });
  this.section('File System', function () {
    this.add('FileUpload_FileSystemPath', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'FileSystem'
      }
    });
  });
  this.section('WebDAV', function () {
    this.add('FileUpload_Webdav_Upload_Folder_Path', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Server_URL', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Username', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Password', '', {
      type: 'password',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Proxy_Avatars', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
    this.add('FileUpload_Webdav_Proxy_Uploads', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'Webdav'
      }
    });
  });
  this.add('FileUpload_Enabled_Direct', true, {
    type: 'boolean',
    public: true
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"ufs":{"AmazonS3":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/AmazonS3/server.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AmazonS3Store: () => AmazonS3Store
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
let S3;
module.watch(require("aws-sdk/clients/s3"), {
  default(v) {
    S3 = v;
  }

}, 2);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 3);

class AmazonS3Store extends UploadFS.Store {
  constructor(options) {
    // Default options
    // options.secretAccessKey,
    // options.accessKeyId,
    // options.region,
    // options.sslEnabled // optional
    options = _.extend({
      httpOptions: {
        timeout: 6000,
        agent: false
      }
    }, options);
    super(options);
    const classOptions = options;
    const s3 = new S3(options.connection);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.AmazonS3) {
        return file.AmazonS3.path;
      } // Compatibility
      // TODO: Migration


      if (file.s3) {
        return file.s3.path + file._id;
      }
    };

    this.getRedirectURL = function (file) {
      const params = {
        Key: this.getPath(file),
        Expires: classOptions.URLExpiryTimeSpan
      };
      return s3.getSignedUrl('getObject', params);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.AmazonS3 = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      const params = {
        Key: this.getPath(file)
      };
      s3.deleteObject(params, (err, data) => {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const params = {
        Key: this.getPath(file)
      };

      if (options.start && options.end) {
        params.Range = `${options.start} - ${options.end}`;
      }

      return s3.getObject(params).createReadStream();
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      const writeStream = new stream.PassThrough();
      writeStream.length = file.size;
      writeStream.on('newListener', (event, listener) => {
        if (event === 'finish') {
          process.nextTick(() => {
            writeStream.removeListener(event, listener);
            writeStream.on('real_finish', listener);
          });
        }
      });
      s3.putObject({
        Key: this.getPath(file),
        Body: writeStream,
        ContentType: file.type,
        ContentDisposition: `inline; filename="${encodeURI(file.name)}"`
      }, error => {
        if (error) {
          console.error(error);
        }

        writeStream.emit('real_finish');
      });
      return writeStream;
    };
  }

}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"GoogleStorage":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/GoogleStorage/server.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  GoogleStorageStore: () => GoogleStorageStore
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);
let gcStorage;
module.watch(require("@google-cloud/storage"), {
  default(v) {
    gcStorage = v;
  }

}, 1);

class GoogleStorageStore extends UploadFS.Store {
  constructor(options) {
    super(options);
    const gcs = gcStorage(options.connection);
    this.bucket = gcs.bucket(options.bucket);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.GoogleStorage) {
        return file.GoogleStorage.path;
      } // Compatibility
      // TODO: Migration


      if (file.googleCloudStorage) {
        return file.googleCloudStorage.path + file._id;
      }
    };

    this.getRedirectURL = function (file, callback) {
      const params = {
        action: 'read',
        responseDisposition: 'inline',
        expires: Date.now() + this.options.URLExpiryTimeSpan * 1000
      };
      this.bucket.file(this.getPath(file)).getSignedUrl(params, callback);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.GoogleStorage = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      this.bucket.file(this.getPath(file)).delete(function (err, data) {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const config = {};

      if (options.start != null) {
        config.start = options.start;
      }

      if (options.end != null) {
        config.end = options.end;
      }

      return this.bucket.file(this.getPath(file)).createReadStream(config);
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      return this.bucket.file(this.getPath(file)).createWriteStream({
        gzip: false,
        metadata: {
          contentType: file.type,
          contentDisposition: `inline; filename=${file.name}` // metadata: {
          // 	custom: 'metadata'
          // }

        }
      });
    };
  }

}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"Webdav":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/Webdav/server.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  WebdavStore: () => WebdavStore
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);
let Webdav;
module.watch(require("webdav"), {
  default(v) {
    Webdav = v;
  }

}, 1);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 2);

class WebdavStore extends UploadFS.Store {
  constructor(options) {
    super(options);
    const client = new Webdav(options.connection.credentials.server, options.connection.credentials.username, options.connection.credentials.password);

    options.getPath = function (file) {
      if (options.uploadFolderPath[options.uploadFolderPath.length - 1] !== '/') {
        options.uploadFolderPath += '/';
      }

      return options.uploadFolderPath + file._id;
    };

    client.stat(options.uploadFolderPath).catch(function (err) {
      if (err.status === '404') {
        client.createDirectory(options.uploadFolderPath);
      }
    });
    /**
     * Returns the file path
     * @param file
     * @return {string}
     */

    this.getPath = function (file) {
      if (file.Webdav) {
        return file.Webdav.path;
      }
    };
    /**
     * Creates the file in the col lection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.Webdav = {
        path: options.getPath(file)
      };
      file.store = this.options.name;
      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      client.deleteFile(this.getPath(file), (err, data) => {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const range = {};

      if (options.start != null) {
        range.start = options.start;
      }

      if (options.end != null) {
        range.end = options.end;
      }

      return client.createReadStream(this.getPath(file), options);
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @return {*}
     */


    this.getWriteStream = function (fileId, file) {
      const writeStream = new stream.PassThrough();
      const webdavStream = client.createWriteStream(this.getPath(file)); //TODO remove timeout when UploadFS bug resolved

      const newListenerCallback = (event, listener) => {
        if (event === 'finish') {
          process.nextTick(() => {
            writeStream.removeListener(event, listener);
            writeStream.removeListener('newListener', newListenerCallback);
            writeStream.on(event, function () {
              setTimeout(listener, 500);
            });
          });
        }
      };

      writeStream.on('newListener', newListenerCallback);
      writeStream.pipe(webdavStream);
      return writeStream;
    };
  }

}

// Add store to UFS namespace
UploadFS.store.Webdav = WebdavStore;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:file-upload/globalFileRestrictions.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUploadBase.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/proxy.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/requests.js");
require("/node_modules/meteor/rocketchat:file-upload/server/config/_configUploadStorage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/sendFileMessage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/getS3FileUrl.js");
require("/node_modules/meteor/rocketchat:file-upload/server/startup/settings.js");

/* Exports */
Package._define("rocketchat:file-upload", {
  fileUploadHandler: fileUploadHandler,
  FileUpload: FileUpload
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_file-upload.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9nbG9iYWxGaWxlUmVzdHJpY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkQmFzZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL0ZpbGVVcGxvYWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2xpYi9wcm94eS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL3JlcXVlc3RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvX2NvbmZpZ1VwbG9hZFN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9BbWF6b25TMy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvY29uZmlnL0ZpbGVTeXN0ZW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9Hb29nbGVTdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvR3JpZEZTLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvU2xpbmdzaG90X0RFUFJFQ0FURUQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9XZWJkYXYuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL21ldGhvZHMvc2VuZEZpbGVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9tZXRob2RzL2dldFMzRmlsZVVybC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvc3RhcnR1cC9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC91ZnMvQW1hem9uUzMvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3Vmcy9Hb29nbGVTdG9yYWdlL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC91ZnMvV2ViZGF2L3NlcnZlci5qcyJdLCJuYW1lcyI6WyJmaWxlc2l6ZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2Iiwic2xpbmdTaG90Q29uZmlnIiwiYXV0aG9yaXplIiwiZmlsZSIsInVzZXJJZCIsIk1ldGVvciIsIkVycm9yIiwiUm9ja2V0Q2hhdCIsImZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUiLCJ0eXBlIiwiVEFQaTE4biIsIl9fIiwibWF4RmlsZVNpemUiLCJzZXR0aW5ncyIsImdldCIsInNpemUiLCJtYXhTaXplIiwiYWxsb3dlZEZpbGVUeXBlcyIsIlNsaW5nc2hvdCIsImZpbGVSZXN0cmljdGlvbnMiLCJGaWxlVXBsb2FkIiwidmFsaWRhdGVGaWxlVXBsb2FkIiwiTWF0Y2giLCJ0ZXN0IiwicmlkIiwiU3RyaW5nIiwidXNlciIsInJvb20iLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUlkIiwiZGlyZWN0TWVzc2FnZUFsbG93IiwiZmlsZVVwbG9hZEFsbG93ZWQiLCJhdXRoeiIsImNhbkFjY2Vzc1Jvb20iLCJsYW5ndWFnZSIsInJlYXNvbiIsInQiLCJrZXkiLCJ2YWx1ZSIsInBhcnNlSW50IiwiZSIsIlNldHRpbmdzIiwicGFja2FnZVZhbHVlIiwiXyIsIlVwbG9hZEZTIiwiY29uZmlnIiwiZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMiLCJTdG9yZVBlcm1pc3Npb25zIiwiaW5zZXJ0IiwiZG9jIiwibWVzc2FnZV9pZCIsImluZGV4T2YiLCJzdG9yZSIsInNwbGl0IiwicG9wIiwidXBkYXRlIiwiaGFzUGVybWlzc2lvbiIsInJlbW92ZSIsIkZpbGVVcGxvYWRCYXNlIiwiY29uc3RydWN0b3IiLCJtZXRhIiwiaWQiLCJSYW5kb20iLCJnZXRQcm9ncmVzcyIsImdldEZpbGVOYW1lIiwibmFtZSIsInN0YXJ0IiwiY2FsbGJhY2siLCJoYW5kbGVyIiwiVXBsb2FkZXIiLCJkYXRhIiwib25FcnJvciIsImVyciIsIm9uQ29tcGxldGUiLCJmaWxlRGF0YSIsInBpY2siLCJ1cmwiLCJyZXBsYWNlIiwiYWJzb2x1dGVVcmwiLCJvcHRpb25zIiwib25Qcm9ncmVzcyIsInByb2dyZXNzIiwic3RvcCIsImV4cG9ydCIsIkZpbGVVcGxvYWRDbGFzcyIsImZzIiwic3RyZWFtIiwibWltZSIsIkZ1dHVyZSIsInNoYXJwIiwiQ29va2llcyIsImNvb2tpZSIsIk9iamVjdCIsImFzc2lnbiIsImhhbmRsZXJzIiwiY29uZmlndXJlVXBsb2Fkc1N0b3JlIiwic3RvcmVzIiwiZ2V0U3RvcmVzIiwiZGVmYXVsdFVwbG9hZHMiLCJjb2xsZWN0aW9uIiwiVXBsb2FkcyIsIm1vZGVsIiwiZmlsdGVyIiwiRmlsdGVyIiwib25DaGVjayIsImdldFBhdGgiLCJfaWQiLCJvblZhbGlkYXRlIiwidXBsb2Fkc09uVmFsaWRhdGUiLCJvblJlYWQiLCJmaWxlSWQiLCJyZXEiLCJyZXMiLCJyZXF1ZXN0Q2FuQWNjZXNzRmlsZXMiLCJ3cml0ZUhlYWQiLCJzZXRIZWFkZXIiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZWZhdWx0QXZhdGFycyIsIkF2YXRhcnMiLCJhdmF0YXJzT25WYWxpZGF0ZSIsIm9uRmluaXNoVXBsb2FkIiwiYXZhdGFyc09uRmluaXNoVXBsb2FkIiwiZGVmYXVsdFVzZXJEYXRhRmlsZXMiLCJVc2VyRGF0YUZpbGVzIiwidGVtcEZpbGVQYXRoIiwiZ2V0VGVtcEZpbGVQYXRoIiwiaGVpZ2h0IiwiZnV0dXJlIiwicyIsInJvdGF0ZSIsIm1ldGFkYXRhIiwiYmluZEVudmlyb25tZW50IiwidG9Gb3JtYXQiLCJmb3JtYXQiLCJqcGVnIiwicmVzaXplIiwiTWF0aCIsIm1pbiIsIndpZHRoIiwiSW5maW5pdHkiLCJwaXBlIiwiYmFja2dyb3VuZCIsImVtYmVkIiwidG9CdWZmZXIiLCJ0aGVuIiwib3V0cHV0QnVmZmVyIiwid3JpdGVGaWxlIiwiY29uc29sZSIsImVycm9yIiwibHN0YXRTeW5jIiwiZ2V0Q29sbGVjdGlvbiIsImRpcmVjdCIsIiRzZXQiLCJyZXR1cm4iLCJ3YWl0IiwicmVzaXplSW1hZ2VQcmV2aWV3IiwiYWRkRXh0ZW5zaW9uVG8iLCJpbWFnZSIsImdldFN0b3JlIiwiX3N0b3JlIiwiZ2V0UmVhZFN0cmVhbSIsInRyYW5zZm9ybWVyIiwibWF4IiwiYmx1ciIsInJlc3VsdCIsIm91dCIsInRvU3RyaW5nIiwidG1wRmlsZSIsImZ1dCIsImlkZW50aWZ5Iiwib3JpZW50YXRpb24iLCJ0b0ZpbGUiLCJ1bmxpbmsiLCJyZW5hbWUiLCJjYXRjaCIsIlVzZXJzIiwib2xkQXZhdGFyIiwiZmluZE9uZUJ5TmFtZSIsInVzZXJuYW1lIiwiZGVsZXRlRmlsZSIsInVwZGF0ZUZpbGVOYW1lQnlJZCIsImhlYWRlcnMiLCJxdWVyeSIsInJjX3VpZCIsInJjX3Rva2VuIiwicmNfcmlkIiwicmNfcm9vbV90eXBlIiwiaXNBdXRob3JpemVkQnlDb29raWVzIiwiZmluZE9uZUJ5SWRBbmRMb2dpblRva2VuIiwiaXNBdXRob3JpemVkQnlIZWFkZXJzIiwiaXNBdXRob3JpemVkQnlSb29tIiwicm9vbVR5cGVzIiwiZ2V0Q29uZmlnIiwiY2FuQWNjZXNzVXBsb2FkZWRGaWxlIiwibG9va3VwIiwiZXh0IiwiZXh0ZW5zaW9uIiwiUmVnRXhwIiwibW9kZWxOYW1lIiwic3RvcmFnZVR5cGUiLCJoYW5kbGVyTmFtZSIsImdldFN0b3JlQnlOYW1lIiwibmV4dCIsImVuZCIsImNvcHkiLCJ0YXJnZXRGaWxlIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJnZXRNb2RlbEZyb21OYW1lIiwiZGVsZXRlIiwiZGVsZXRlQnlJZCIsImRlbGV0ZUJ5TmFtZSIsImZpbGVOYW1lIiwic3RyZWFtT3JCdWZmZXIiLCJjYiIsImdldEZpbHRlciIsImNoZWNrIiwiY3JlYXRlIiwidG9rZW4iLCJjcmVhdGVUb2tlbiIsIkJ1ZmZlciIsIndyaXRlRmlsZVN5bmMiLCJjYWxsIiwiaHR0cCIsIlVSTCIsImxvZ2dlciIsIkxvZ2dlciIsIldlYkFwcCIsImNvbm5lY3RIYW5kbGVycyIsInN0YWNrIiwidW5zaGlmdCIsInJvdXRlIiwiaGFuZGxlIiwic3RvcmVzUGF0aCIsImRlYnVnIiwibWV0aG9kIiwicGFyc2VkVXJsIiwicGFyc2UiLCJwYXRoIiwicGF0aG5hbWUiLCJzdWJzdHIiLCJsZW5ndGgiLCJyZWdFeHAiLCJtYXRjaCIsImV4ZWMiLCJmaW5kT25lIiwidW5kZWZpbmVkIiwiaW5zdGFuY2VJZCIsIkluc3RhbmNlU3RhdHVzIiwiaW5zdGFuY2UiLCJleHRyYUluZm9ybWF0aW9uIiwiaG9zdCIsInByb2Nlc3MiLCJlbnYiLCJJTlNUQU5DRV9JUCIsImlzRG9ja2VyIiwicG9ydCIsImhvc3RuYW1lIiwib3JpZ2luYWxVcmwiLCJwcm94eSIsInJlcXVlc3QiLCJwcm94eV9yZXMiLCJ1c2UiLCJwdWJsaWMiLCJzYW5kc3Rvcm0iLCJjb25maWdTdG9yZSIsImRlYm91bmNlIiwibG9nIiwiaHR0cHMiLCJmaWxlVXJsIiwiZ2V0UmVkaXJlY3RVUkwiLCJzdG9yZVR5cGUiLCJmaWxlUmVzIiwicmVtb3ZlSGVhZGVyIiwiQW1hem9uUzNVcGxvYWRzIiwiQW1hem9uUzNBdmF0YXJzIiwiQW1hem9uUzNVc2VyRGF0YUZpbGVzIiwiY29uZmlndXJlIiwiQnVja2V0IiwiQWNsIiwiQVdTQWNjZXNzS2V5SWQiLCJBV1NTZWNyZXRBY2Nlc3NLZXkiLCJVUkxFeHBpcnlUaW1lU3BhbiIsIlJlZ2lvbiIsIlNpZ25hdHVyZVZlcnNpb24iLCJGb3JjZVBhdGhTdHlsZSIsIkJ1Y2tldFVSTCIsImNvbm5lY3Rpb24iLCJzaWduYXR1cmVWZXJzaW9uIiwiczNGb3JjZVBhdGhTdHlsZSIsInBhcmFtcyIsIkFDTCIsInJlZ2lvbiIsImFjY2Vzc0tleUlkIiwic2VjcmV0QWNjZXNzS2V5IiwiZW5kcG9pbnQiLCJGaWxlU3lzdGVtVXBsb2FkcyIsImZpbGVQYXRoIiwiZ2V0RmlsZVBhdGgiLCJzdGF0Iiwid3JhcEFzeW5jIiwiaXNGaWxlIiwidXBsb2FkZWRBdCIsInRvVVRDU3RyaW5nIiwiRmlsZVN5c3RlbUF2YXRhcnMiLCJGaWxlU3lzdGVtVXNlckRhdGFGaWxlcyIsImNyZWF0ZUZpbGVTeXN0ZW1TdG9yZSIsIkdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMiLCJHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzIiwiR29vZ2xlQ2xvdWRTdG9yYWdlVXNlckRhdGFGaWxlcyIsImJ1Y2tldCIsImFjY2Vzc0lkIiwic2VjcmV0IiwiY3JlZGVudGlhbHMiLCJjbGllbnRfZW1haWwiLCJwcml2YXRlX2tleSIsInpsaWIiLCJ1dGlsIiwiRXh0cmFjdFJhbmdlIiwiYnl0ZXNfcmVhZCIsIlRyYW5zZm9ybSIsImluaGVyaXRzIiwicHJvdG90eXBlIiwiX3RyYW5zZm9ybSIsImNodW5rIiwiZW5jIiwibmV3Y2h1bmsiLCJzbGljZSIsInB1c2giLCJnZXRCeXRlUmFuZ2UiLCJoZWFkZXIiLCJtYXRjaGVzIiwicmVhZEZyb21HcmlkRlMiLCJzdG9yZU5hbWUiLCJycyIsIndzIiwiUGFzc1Rocm91Z2giLCJmb3JFYWNoIiwib24iLCJvblJlYWRFcnJvciIsImVtaXQiLCJhY2NlcHQiLCJ0cmFuc2Zvcm1SZWFkIiwicmFuZ2UiLCJvdXRfb2ZfcmFuZ2UiLCJjcmVhdGVHemlwIiwiY3JlYXRlRGVmbGF0ZSIsImNvcHlGcm9tR3JpZEZTIiwiY29sbGVjdGlvbk5hbWUiLCJjb25maWd1cmVTbGluZ3Nob3QiLCJhY2wiLCJhY2Nlc3NLZXkiLCJzZWNyZXRLZXkiLCJjZG4iLCJidWNrZXRVcmwiLCJfZGlyZWN0aXZlcyIsImlzRW1wdHkiLCJtZXRhQ29udGV4dCIsInVwbG9hZCIsIkFtYXpvblMzIiwiaW5zZXJ0RmlsZUluaXQiLCJjcmVhdGVEaXJlY3RpdmUiLCJTM1N0b3JhZ2UiLCJtZXNzYWdlIiwiY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSIsIkdvb2dsZUFjY2Vzc0lkIiwiR29vZ2xlU2VjcmV0S2V5IiwiR29vZ2xlU3RvcmFnZSIsIkdvb2dsZUNsb3VkIiwiV2ViZGF2VXBsb2FkcyIsIldlYmRhdkF2YXRhcnMiLCJXZWJkYXZVc2VyRGF0YUZpbGVzIiwidXBsb2FkRm9sZGVyUGF0aCIsInNlcnZlciIsInBhc3N3b3JkIiwibWV0aG9kcyIsInJvb21JZCIsIm1zZ0RhdGEiLCJhdmF0YXIiLCJPcHRpb25hbCIsImVtb2ppIiwiYWxpYXMiLCJncm91cGFibGUiLCJCb29sZWFuIiwibXNnIiwidXBkYXRlRmlsZUNvbXBsZXRlIiwib21pdCIsImVuY29kZVVSSSIsImF0dGFjaG1lbnQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwidGl0bGVfbGluayIsInRpdGxlX2xpbmtfZG93bmxvYWQiLCJpbWFnZV91cmwiLCJpbWFnZV90eXBlIiwiaW1hZ2Vfc2l6ZSIsImltYWdlX2RpbWVuc2lvbnMiLCJpbWFnZV9wcmV2aWV3IiwiYXVkaW9fdXJsIiwiYXVkaW9fdHlwZSIsImF1ZGlvX3NpemUiLCJ2aWRlb191cmwiLCJ2aWRlb190eXBlIiwidmlkZW9fc2l6ZSIsInRzIiwiRGF0ZSIsImF0dGFjaG1lbnRzIiwiZGVmZXIiLCJjYWxsYmFja3MiLCJydW4iLCJwcm90ZWN0ZWRGaWxlcyIsImdldFMzRmlsZVVybCIsImFkZEdyb3VwIiwiYWRkIiwiaTE4bkRlc2NyaXB0aW9uIiwidmFsdWVzIiwiaTE4bkxhYmVsIiwic2VjdGlvbiIsImVuYWJsZVF1ZXJ5IiwicHJpdmF0ZSIsIm11bHRpbGluZSIsIkFtYXpvblMzU3RvcmUiLCJTMyIsIlN0b3JlIiwiZXh0ZW5kIiwiaHR0cE9wdGlvbnMiLCJ0aW1lb3V0IiwiYWdlbnQiLCJjbGFzc09wdGlvbnMiLCJzMyIsIktleSIsIkV4cGlyZXMiLCJnZXRTaWduZWRVcmwiLCJkZWxldGVPYmplY3QiLCJSYW5nZSIsImdldE9iamVjdCIsImNyZWF0ZVJlYWRTdHJlYW0iLCJnZXRXcml0ZVN0cmVhbSIsIndyaXRlU3RyZWFtIiwiZXZlbnQiLCJsaXN0ZW5lciIsIm5leHRUaWNrIiwicmVtb3ZlTGlzdGVuZXIiLCJwdXRPYmplY3QiLCJCb2R5IiwiQ29udGVudFR5cGUiLCJDb250ZW50RGlzcG9zaXRpb24iLCJHb29nbGVTdG9yYWdlU3RvcmUiLCJnY1N0b3JhZ2UiLCJnY3MiLCJnb29nbGVDbG91ZFN0b3JhZ2UiLCJhY3Rpb24iLCJyZXNwb25zZURpc3Bvc2l0aW9uIiwiZXhwaXJlcyIsIm5vdyIsImd6aXAiLCJjb250ZW50VHlwZSIsImNvbnRlbnREaXNwb3NpdGlvbiIsIldlYmRhdlN0b3JlIiwiV2ViZGF2IiwiY2xpZW50Iiwic3RhdHVzIiwiY3JlYXRlRGlyZWN0b3J5Iiwid2ViZGF2U3RyZWFtIiwibmV3TGlzdGVuZXJDYWxsYmFjayIsInNldFRpbWVvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxRQUFKO0FBQWFDLE9BQU9DLEtBQVAsQ0FBYUMsUUFB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QVlJLGNBQVosQ0FBMkIsYUFBM0IsRUFBMENzQixtQkFBMUM7QUFDQTFCLHdCQUFZcEcsRUFBWixDQUFlcUcsS0FBZixFQUFzQixZQUFXO0FBQ2hDMEIseUJBQVd6QixRQUFYLEVBQXFCLEdBQXJCO0FBQ0EsYUFGRDtBQUdBLFdBTkQ7QUFPQTtBQUNELE9BVkQ7O0FBV0FGLGtCQUFZcEcsRUFBWixDQUFlLGFBQWYsRUFBOEI4SCxtQkFBOUI7QUFFQTFCLGtCQUFZelMsSUFBWixDQUFpQmtVLFlBQWpCO0FBQ0EsYUFBT3pCLFdBQVA7QUFDQSxLQXBCRDtBQXNCQTs7QUExSDhDOztBQTZIaEQ7QUFDQXpZLFNBQVNRLEtBQVQsQ0FBZXNaLE1BQWYsR0FBd0JELFdBQXhCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZmlsZS11cGxvYWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIFNsaW5nc2hvdCAqL1xuXG5pbXBvcnQgZmlsZXNpemUgZnJvbSAnZmlsZXNpemUnO1xuXG5jb25zdCBzbGluZ1Nob3RDb25maWcgPSB7XG5cdGF1dGhvcml6ZShmaWxlLyosIG1ldGFDb250ZXh0Ki8pIHtcblx0XHQvL0RlbnkgdXBsb2FkcyBpZiB1c2VyIGlzIG5vdCBsb2dnZWQgaW4uXG5cdFx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbG9naW4tcmVxdWlyZWQnLCAnUGxlYXNlIGxvZ2luIGJlZm9yZSBwb3N0aW5nIGZpbGVzJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUoZmlsZS50eXBlKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihUQVBpMThuLl9fKCdlcnJvci1pbnZhbGlkLWZpbGUtdHlwZScpKTtcblx0XHR9XG5cblx0XHRjb25zdCBtYXhGaWxlU2l6ZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX01heEZpbGVTaXplJyk7XG5cblx0XHRpZiAobWF4RmlsZVNpemUgPj0gLTEgJiYgbWF4RmlsZVNpemUgPCBmaWxlLnNpemUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoVEFQaTE4bi5fXygnRmlsZV9leGNlZWRzX2FsbG93ZWRfc2l6ZV9vZl9ieXRlcycsIHsgc2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpIH0pKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0bWF4U2l6ZTogMCxcblx0YWxsb3dlZEZpbGVUeXBlczogbnVsbFxufTtcblxuU2xpbmdzaG90LmZpbGVSZXN0cmljdGlvbnMoJ3JvY2tldGNoYXQtdXBsb2FkcycsIHNsaW5nU2hvdENvbmZpZyk7XG5TbGluZ3Nob3QuZmlsZVJlc3RyaWN0aW9ucygncm9ja2V0Y2hhdC11cGxvYWRzLWdzJywgc2xpbmdTaG90Q29uZmlnKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZDp0cnVlICovXG4vKiBleHBvcnRlZCBGaWxlVXBsb2FkICovXG5cbmltcG9ydCBmaWxlc2l6ZSBmcm9tICdmaWxlc2l6ZSc7XG5cbmxldCBtYXhGaWxlU2l6ZSA9IDA7XG5cbkZpbGVVcGxvYWQgPSB7XG5cdHZhbGlkYXRlRmlsZVVwbG9hZChmaWxlKSB7XG5cdFx0aWYgKCFNYXRjaC50ZXN0KGZpbGUucmlkLCBTdHJpbmcpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdC8vIGxpdmVjaGF0IHVzZXJzIGNhbiB1cGxvYWQgZmlsZXMgYnV0IHRoZXkgZG9uJ3QgaGF2ZSBhbiB1c2VySWRcblx0XHRjb25zdCB1c2VyID0gZmlsZS51c2VySWQgPyBNZXRlb3IudXNlcigpIDogbnVsbDtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmlsZS5yaWQpO1xuXHRcdGNvbnN0IGRpcmVjdE1lc3NhZ2VBbGxvdyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0VuYWJsZWRfRGlyZWN0Jyk7XG5cdFx0Y29uc3QgZmlsZVVwbG9hZEFsbG93ZWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9FbmFibGVkJyk7XG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouY2FuQWNjZXNzUm9vbShyb29tLCB1c2VyLCBmaWxlKSAhPT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRjb25zdCBsYW5ndWFnZSA9IHVzZXIgPyB1c2VyLmxhbmd1YWdlIDogJ2VuJztcblx0XHRpZiAoIWZpbGVVcGxvYWRBbGxvd2VkKSB7XG5cdFx0XHRjb25zdCByZWFzb24gPSBUQVBpMThuLl9fKCdGaWxlVXBsb2FkX0Rpc2FibGVkJywgbGFuZ3VhZ2UpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZmlsZS11cGxvYWQtZGlzYWJsZWQnLCByZWFzb24pO1xuXHRcdH1cblxuXHRcdGlmICghZGlyZWN0TWVzc2FnZUFsbG93ICYmIHJvb20udCA9PT0gJ2QnKSB7XG5cdFx0XHRjb25zdCByZWFzb24gPSBUQVBpMThuLl9fKCdGaWxlX25vdF9hbGxvd2VkX2RpcmVjdF9tZXNzYWdlcycsIGxhbmd1YWdlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWRpcmVjdC1tZXNzYWdlLWZpbGUtdXBsb2FkLW5vdC1hbGxvd2VkJywgcmVhc29uKTtcblx0XHR9XG5cblx0XHQvLyAtMSBtYXhGaWxlU2l6ZSBtZWFucyB0aGVyZSBpcyBubyBsaW1pdFxuXHRcdGlmIChtYXhGaWxlU2l6ZSA+PSAtMSAmJiBmaWxlLnNpemUgPiBtYXhGaWxlU2l6ZSkge1xuXHRcdFx0Y29uc3QgcmVhc29uID0gVEFQaTE4bi5fXygnRmlsZV9leGNlZWRzX2FsbG93ZWRfc2l6ZV9vZl9ieXRlcycsIHtcblx0XHRcdFx0c2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpXG5cdFx0XHR9LCBsYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1maWxlLXRvby1sYXJnZScsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0aWYgKG1heEZpbGVTaXplID4gMCkge1xuXHRcdFx0aWYgKGZpbGUuc2l6ZSA+IG1heEZpbGVTaXplKSB7XG5cdFx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfZXhjZWVkc19hbGxvd2VkX3NpemVfb2ZfYnl0ZXMnLCB7XG5cdFx0XHRcdFx0c2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpXG5cdFx0XHRcdH0sIGxhbmd1YWdlKTtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZmlsZS10b28tbGFyZ2UnLCByZWFzb24pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5maWxlVXBsb2FkSXNWYWxpZENvbnRlbnRUeXBlKGZpbGUudHlwZSkpIHtcblx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVfdHlwZV9pc19ub3RfYWNjZXB0ZWQnLCBsYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWZpbGUtdHlwZScsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn07XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX01heEZpbGVTaXplJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHR0cnkge1xuXHRcdG1heEZpbGVTaXplID0gcGFyc2VJbnQodmFsdWUpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0bWF4RmlsZVNpemUgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lQnlJZCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScpLnBhY2thZ2VWYWx1ZTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWRCYXNlOnRydWUsIFVwbG9hZEZTICovXG4vKiBleHBvcnRlZCBGaWxlVXBsb2FkQmFzZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblVwbG9hZEZTLmNvbmZpZy5kZWZhdWx0U3RvcmVQZXJtaXNzaW9ucyA9IG5ldyBVcGxvYWRGUy5TdG9yZVBlcm1pc3Npb25zKHtcblx0aW5zZXJ0KHVzZXJJZCwgZG9jKSB7XG5cdFx0aWYgKHVzZXJJZCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gYWxsb3cgaW5zZXJ0cyBmcm9tIHNsYWNrYnJpZGdlIChtZXNzYWdlX2lkID0gc2xhY2stdGltZXN0YW1wLW1pbGxpKVxuXHRcdGlmIChkb2MgJiYgZG9jLm1lc3NhZ2VfaWQgJiYgZG9jLm1lc3NhZ2VfaWQuaW5kZXhPZignc2xhY2stJykgPT09IDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIGFsbG93IGluc2VydHMgdG8gdGhlIFVzZXJEYXRhRmlsZXMgc3RvcmVcblx0XHRpZiAoZG9jICYmIGRvYy5zdG9yZSAmJiBkb2Muc3RvcmUuc3BsaXQoJzonKS5wb3AoKSA9PT0gJ1VzZXJEYXRhRmlsZXMnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5jYW5BY2Nlc3NSb29tKG51bGwsIG51bGwsIGRvYykpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0dXBkYXRlKHVzZXJJZCwgZG9jKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdkZWxldGUtbWVzc2FnZScsIGRvYy5yaWQpIHx8IChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9BbGxvd0RlbGV0aW5nJykgJiYgdXNlcklkID09PSBkb2MudXNlcklkKTtcblx0fSxcblx0cmVtb3ZlKHVzZXJJZCwgZG9jKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdkZWxldGUtbWVzc2FnZScsIGRvYy5yaWQpIHx8IChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9BbGxvd0RlbGV0aW5nJykgJiYgdXNlcklkID09PSBkb2MudXNlcklkKTtcblx0fVxufSk7XG5cblxuRmlsZVVwbG9hZEJhc2UgPSBjbGFzcyBGaWxlVXBsb2FkQmFzZSB7XG5cdGNvbnN0cnVjdG9yKHN0b3JlLCBtZXRhLCBmaWxlKSB7XG5cdFx0dGhpcy5pZCA9IFJhbmRvbS5pZCgpO1xuXHRcdHRoaXMubWV0YSA9IG1ldGE7XG5cdFx0dGhpcy5maWxlID0gZmlsZTtcblx0XHR0aGlzLnN0b3JlID0gc3RvcmU7XG5cdH1cblxuXHRnZXRQcm9ncmVzcygpIHtcblxuXHR9XG5cblx0Z2V0RmlsZU5hbWUoKSB7XG5cdFx0cmV0dXJuIHRoaXMubWV0YS5uYW1lO1xuXHR9XG5cblx0c3RhcnQoY2FsbGJhY2spIHtcblx0XHR0aGlzLmhhbmRsZXIgPSBuZXcgVXBsb2FkRlMuVXBsb2FkZXIoe1xuXHRcdFx0c3RvcmU6IHRoaXMuc3RvcmUsXG5cdFx0XHRkYXRhOiB0aGlzLmZpbGUsXG5cdFx0XHRmaWxlOiB0aGlzLm1ldGEsXG5cdFx0XHRvbkVycm9yOiAoZXJyKSA9PiB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhlcnIpO1xuXHRcdFx0fSxcblx0XHRcdG9uQ29tcGxldGU6IChmaWxlRGF0YSkgPT4ge1xuXHRcdFx0XHRjb25zdCBmaWxlID0gXy5waWNrKGZpbGVEYXRhLCAnX2lkJywgJ3R5cGUnLCAnc2l6ZScsICduYW1lJywgJ2lkZW50aWZ5JywgJ2Rlc2NyaXB0aW9uJyk7XG5cblx0XHRcdFx0ZmlsZS51cmwgPSBmaWxlRGF0YS51cmwucmVwbGFjZShNZXRlb3IuYWJzb2x1dGVVcmwoKSwgJy8nKTtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIGZpbGUsIHRoaXMuc3RvcmUub3B0aW9ucy5uYW1lKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuaGFuZGxlci5vblByb2dyZXNzID0gKGZpbGUsIHByb2dyZXNzKSA9PiB7XG5cdFx0XHR0aGlzLm9uUHJvZ3Jlc3MocHJvZ3Jlc3MpO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5oYW5kbGVyLnN0YXJ0KCk7XG5cdH1cblxuXHRvblByb2dyZXNzKCkge31cblxuXHRzdG9wKCkge1xuXHRcdHJldHVybiB0aGlzLmhhbmRsZXIuc3RvcCgpO1xuXHR9XG59O1xuIiwiLyogZ2xvYmFscyBVcGxvYWRGUyAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IG1pbWUgZnJvbSAnbWltZS10eXBlL3dpdGgtZGInO1xuaW1wb3J0IEZ1dHVyZSBmcm9tICdmaWJlcnMvZnV0dXJlJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgeyBDb29raWVzIH0gZnJvbSAnbWV0ZW9yL29zdHJpbzpjb29raWVzJztcblxuY29uc3QgY29va2llID0gbmV3IENvb2tpZXMoKTtcblxuT2JqZWN0LmFzc2lnbihGaWxlVXBsb2FkLCB7XG5cdGhhbmRsZXJzOiB7fSxcblxuXHRjb25maWd1cmVVcGxvYWRzU3RvcmUoc3RvcmUsIG5hbWUsIG9wdGlvbnMpIHtcblx0XHRjb25zdCB0eXBlID0gbmFtZS5zcGxpdCgnOicpLnBvcCgpO1xuXHRcdGNvbnN0IHN0b3JlcyA9IFVwbG9hZEZTLmdldFN0b3JlcygpO1xuXHRcdGRlbGV0ZSBzdG9yZXNbbmFtZV07XG5cblx0XHRyZXR1cm4gbmV3IFVwbG9hZEZTLnN0b3JlW3N0b3JlXShPYmplY3QuYXNzaWduKHtcblx0XHRcdG5hbWVcblx0XHR9LCBvcHRpb25zLCBGaWxlVXBsb2FkW2BkZWZhdWx0JHsgdHlwZSB9YF0oKSkpO1xuXHR9LFxuXG5cdGRlZmF1bHRVcGxvYWRzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2xsZWN0aW9uOiBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLm1vZGVsLFxuXHRcdFx0ZmlsdGVyOiBuZXcgVXBsb2FkRlMuRmlsdGVyKHtcblx0XHRcdFx0b25DaGVjazogRmlsZVVwbG9hZC52YWxpZGF0ZUZpbGVVcGxvYWRcblx0XHRcdH0pLFxuXHRcdFx0Z2V0UGF0aChmaWxlKSB7XG5cdFx0XHRcdHJldHVybiBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS91cGxvYWRzLyR7IGZpbGUucmlkIH0vJHsgZmlsZS51c2VySWQgfS8keyBmaWxlLl9pZCB9YDtcblx0XHRcdH0sXG5cdFx0XHRvblZhbGlkYXRlOiBGaWxlVXBsb2FkLnVwbG9hZHNPblZhbGlkYXRlLFxuXHRcdFx0b25SZWFkKGZpbGVJZCwgZmlsZSwgcmVxLCByZXMpIHtcblx0XHRcdFx0aWYgKCFGaWxlVXBsb2FkLnJlcXVlc3RDYW5BY2Nlc3NGaWxlcyhyZXEpKSB7XG5cdFx0XHRcdFx0cmVzLndyaXRlSGVhZCg0MDMpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ2NvbnRlbnQtZGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWU9XCIkeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9XCJgKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRkZWZhdWx0QXZhdGFycygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29sbGVjdGlvbjogUm9ja2V0Q2hhdC5tb2RlbHMuQXZhdGFycy5tb2RlbCxcblx0XHRcdC8vIGZpbHRlcjogbmV3IFVwbG9hZEZTLkZpbHRlcih7XG5cdFx0XHQvLyBcdG9uQ2hlY2s6IEZpbGVVcGxvYWQudmFsaWRhdGVGaWxlVXBsb2FkXG5cdFx0XHQvLyB9KSxcblx0XHRcdGdldFBhdGgoZmlsZSkge1xuXHRcdFx0XHRyZXR1cm4gYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpIH0vYXZhdGFycy8keyBmaWxlLnVzZXJJZCB9YDtcblx0XHRcdH0sXG5cdFx0XHRvblZhbGlkYXRlOiBGaWxlVXBsb2FkLmF2YXRhcnNPblZhbGlkYXRlLFxuXHRcdFx0b25GaW5pc2hVcGxvYWQ6IEZpbGVVcGxvYWQuYXZhdGFyc09uRmluaXNoVXBsb2FkXG5cdFx0fTtcblx0fSxcblxuXHRkZWZhdWx0VXNlckRhdGFGaWxlcygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y29sbGVjdGlvbjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlckRhdGFGaWxlcy5tb2RlbCxcblx0XHRcdGdldFBhdGgoZmlsZSkge1xuXHRcdFx0XHRyZXR1cm4gYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpIH0vdXBsb2Fkcy91c2VyRGF0YS8keyBmaWxlLnVzZXJJZCB9YDtcblx0XHRcdH0sXG5cdFx0XHRvblZhbGlkYXRlOiBGaWxlVXBsb2FkLnVwbG9hZHNPblZhbGlkYXRlLFxuXHRcdFx0b25SZWFkKGZpbGVJZCwgZmlsZSwgcmVxLCByZXMpIHtcblx0XHRcdFx0aWYgKCFGaWxlVXBsb2FkLnJlcXVlc3RDYW5BY2Nlc3NGaWxlcyhyZXEpKSB7XG5cdFx0XHRcdFx0cmVzLndyaXRlSGVhZCg0MDMpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ2NvbnRlbnQtZGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWU9XCIkeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9XCJgKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRhdmF0YXJzT25WYWxpZGF0ZShmaWxlKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19BdmF0YXJSZXNpemUnKSAhPT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRlbXBGaWxlUGF0aCA9IFVwbG9hZEZTLmdldFRlbXBGaWxlUGF0aChmaWxlLl9pZCk7XG5cblx0XHRjb25zdCBoZWlnaHQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWNjb3VudHNfQXZhdGFyU2l6ZScpO1xuXHRcdGNvbnN0IGZ1dHVyZSA9IG5ldyBGdXR1cmUoKTtcblxuXHRcdGNvbnN0IHMgPSBzaGFycCh0ZW1wRmlsZVBhdGgpO1xuXHRcdHMucm90YXRlKCk7XG5cdFx0Ly8gR2V0IG1ldGFkYXRhIHRvIHJlc2l6ZSB0aGUgaW1hZ2UgdGhlIGZpcnN0IHRpbWUgdG8ga2VlcCBcImluc2lkZVwiIHRoZSBkaW1lbnNpb25zXG5cdFx0Ly8gdGhlbiByZXNpemUgYWdhaW4gdG8gY3JlYXRlIHRoZSBjYW52YXMgYXJvdW5kXG5cblx0XHRzLm1ldGFkYXRhKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVyciwgbWV0YWRhdGEpID0+IHtcblx0XHRcdGlmICghbWV0YWRhdGEpIHtcblx0XHRcdFx0bWV0YWRhdGEgPSB7fTtcblx0XHRcdH1cblxuXHRcdFx0cy50b0Zvcm1hdChzaGFycC5mb3JtYXQuanBlZylcblx0XHRcdFx0LnJlc2l6ZShNYXRoLm1pbihoZWlnaHQgfHwgMCwgbWV0YWRhdGEud2lkdGggfHwgSW5maW5pdHkpLCBNYXRoLm1pbihoZWlnaHQgfHwgMCwgbWV0YWRhdGEuaGVpZ2h0IHx8IEluZmluaXR5KSlcblx0XHRcdFx0LnBpcGUoc2hhcnAoKVxuXHRcdFx0XHRcdC5yZXNpemUoaGVpZ2h0LCBoZWlnaHQpXG5cdFx0XHRcdFx0LmJhY2tncm91bmQoJyNGRkZGRkYnKVxuXHRcdFx0XHRcdC5lbWJlZCgpXG5cdFx0XHRcdClcblx0XHRcdFx0Ly8gVXNlIGJ1ZmZlciB0byBnZXQgdGhlIHJlc3VsdCBpbiBtZW1vcnkgdGhlbiByZXBsYWNlIHRoZSBleGlzdGluZyBmaWxlXG5cdFx0XHRcdC8vIFRoZXJlIGlzIG5vIG9wdGlvbiB0byBvdmVycmlkZSBhIGZpbGUgdXNpbmcgdGhpcyBsaWJyYXJ5XG5cdFx0XHRcdC50b0J1ZmZlcigpXG5cdFx0XHRcdC50aGVuKE1ldGVvci5iaW5kRW52aXJvbm1lbnQob3V0cHV0QnVmZmVyID0+IHtcblx0XHRcdFx0XHRmcy53cml0ZUZpbGUodGVtcEZpbGVQYXRoLCBvdXRwdXRCdWZmZXIsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZXJyID0+IHtcblx0XHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCBzaXplID0gZnMubHN0YXRTeW5jKHRlbXBGaWxlUGF0aCkuc2l6ZTtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0Q29sbGVjdGlvbigpLmRpcmVjdC51cGRhdGUoe19pZDogZmlsZS5faWR9LCB7JHNldDoge3NpemV9fSk7XG5cdFx0XHRcdFx0XHRmdXR1cmUucmV0dXJuKCk7XG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHR9KSk7XG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIGZ1dHVyZS53YWl0KCk7XG5cdH0sXG5cblx0cmVzaXplSW1hZ2VQcmV2aWV3KGZpbGUpIHtcblx0XHRmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChmaWxlLl9pZCk7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cdFx0Y29uc3QgaW1hZ2UgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJykuX3N0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpO1xuXG5cdFx0Y29uc3QgdHJhbnNmb3JtZXIgPSBzaGFycCgpXG5cdFx0XHQucmVzaXplKDMyLCAzMilcblx0XHRcdC5tYXgoKVxuXHRcdFx0LmpwZWcoKVxuXHRcdFx0LmJsdXIoKTtcblx0XHRjb25zdCByZXN1bHQgPSB0cmFuc2Zvcm1lci50b0J1ZmZlcigpLnRoZW4oKG91dCkgPT4gb3V0LnRvU3RyaW5nKCdiYXNlNjQnKSk7XG5cdFx0aW1hZ2UucGlwZSh0cmFuc2Zvcm1lcik7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHR1cGxvYWRzT25WYWxpZGF0ZShmaWxlKSB7XG5cdFx0aWYgKCEvXmltYWdlXFwvKCh4LXdpbmRvd3MtKT9ibXB8cD9qcGVnfHBuZykkLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB0bXBGaWxlID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGUuX2lkKTtcblxuXHRcdGNvbnN0IGZ1dCA9IG5ldyBGdXR1cmUoKTtcblxuXHRcdGNvbnN0IHMgPSBzaGFycCh0bXBGaWxlKTtcblx0XHRzLm1ldGFkYXRhKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVyciwgbWV0YWRhdGEpID0+IHtcblx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdHJldHVybiBmdXQucmV0dXJuKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGlkZW50aWZ5ID0ge1xuXHRcdFx0XHRmb3JtYXQ6IG1ldGFkYXRhLmZvcm1hdCxcblx0XHRcdFx0c2l6ZToge1xuXHRcdFx0XHRcdHdpZHRoOiBtZXRhZGF0YS53aWR0aCxcblx0XHRcdFx0XHRoZWlnaHQ6IG1ldGFkYXRhLmhlaWdodFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAobWV0YWRhdGEub3JpZW50YXRpb24gPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gZnV0LnJldHVybigpO1xuXHRcdFx0fVxuXG5cdFx0XHRzLnJvdGF0ZSgpXG5cdFx0XHRcdC50b0ZpbGUoYCR7IHRtcEZpbGUgfS50bXBgKVxuXHRcdFx0XHQudGhlbihNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRmcy51bmxpbmsodG1wRmlsZSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRmcy5yZW5hbWUoYCR7IHRtcEZpbGUgfS50bXBgLCB0bXBGaWxlLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc2l6ZSA9IGZzLmxzdGF0U3luYyh0bXBGaWxlKS5zaXplO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmdldENvbGxlY3Rpb24oKS5kaXJlY3QudXBkYXRlKHtfaWQ6IGZpbGUuX2lkfSwge1xuXHRcdFx0XHRcdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRcdFx0XHRcdHNpemUsXG5cdFx0XHRcdFx0XHRcdFx0XHRpZGVudGlmeVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGZ1dC5yZXR1cm4oKTtcblx0XHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0pKS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHRcdGZ1dC5yZXR1cm4oKTtcblx0XHRcdFx0fSk7XG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIGZ1dC53YWl0KCk7XG5cdH0sXG5cblx0YXZhdGFyc09uRmluaXNoVXBsb2FkKGZpbGUpIHtcblx0XHQvLyB1cGRhdGUgZmlsZSByZWNvcmQgdG8gbWF0Y2ggdXNlcidzIHVzZXJuYW1lXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKGZpbGUudXNlcklkKTtcblx0XHRjb25zdCBvbGRBdmF0YXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLmZpbmRPbmVCeU5hbWUodXNlci51c2VybmFtZSk7XG5cdFx0aWYgKG9sZEF2YXRhcikge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuQXZhdGFycy5kZWxldGVGaWxlKG9sZEF2YXRhci5faWQpO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLnVwZGF0ZUZpbGVOYW1lQnlJZChmaWxlLl9pZCwgdXNlci51c2VybmFtZSk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ3VwbG9hZCBmaW5pc2hlZCAtPicsIGZpbGUpO1xuXHR9LFxuXG5cdHJlcXVlc3RDYW5BY2Nlc3NGaWxlcyh7IGhlYWRlcnMgPSB7fSwgcXVlcnkgPSB7fSB9KSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXMnKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0bGV0IHsgcmNfdWlkLCByY190b2tlbiwgcmNfcmlkLCByY19yb29tX3R5cGUgfSA9IHF1ZXJ5O1xuXG5cdFx0aWYgKCFyY191aWQgJiYgaGVhZGVycy5jb29raWUpIHtcblx0XHRcdHJjX3VpZCA9IGNvb2tpZS5nZXQoJ3JjX3VpZCcsIGhlYWRlcnMuY29va2llKTtcblx0XHRcdHJjX3Rva2VuID0gY29va2llLmdldCgncmNfdG9rZW4nLCBoZWFkZXJzLmNvb2tpZSk7XG5cdFx0XHRyY19yaWQgPSBjb29raWUuZ2V0KCdyY19yaWQnLCBoZWFkZXJzLmNvb2tpZSk7XG5cdFx0XHRyY19yb29tX3R5cGUgPSBjb29raWUuZ2V0KCdyY19yb29tX3R5cGUnLCBoZWFkZXJzLmNvb2tpZSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaXNBdXRob3JpemVkQnlDb29raWVzID0gcmNfdWlkICYmIHJjX3Rva2VuICYmIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkQW5kTG9naW5Ub2tlbihyY191aWQsIHJjX3Rva2VuKTtcblx0XHRjb25zdCBpc0F1dGhvcml6ZWRCeUhlYWRlcnMgPSBoZWFkZXJzWyd4LXVzZXItaWQnXSAmJiBoZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZEFuZExvZ2luVG9rZW4oaGVhZGVyc1sneC11c2VyLWlkJ10sIGhlYWRlcnNbJ3gtYXV0aC10b2tlbiddKTtcblx0XHRjb25zdCBpc0F1dGhvcml6ZWRCeVJvb20gPSByY19yb29tX3R5cGUgJiYgUm9ja2V0Q2hhdC5yb29tVHlwZXMuZ2V0Q29uZmlnKHJjX3Jvb21fdHlwZSkuY2FuQWNjZXNzVXBsb2FkZWRGaWxlKHsgcmNfdWlkLCByY19yaWQsIHJjX3Rva2VuIH0pO1xuXHRcdHJldHVybiBpc0F1dGhvcml6ZWRCeUNvb2tpZXMgfHwgaXNBdXRob3JpemVkQnlIZWFkZXJzIHx8IGlzQXV0aG9yaXplZEJ5Um9vbTtcblx0fSxcblx0YWRkRXh0ZW5zaW9uVG8oZmlsZSkge1xuXHRcdGlmIChtaW1lLmxvb2t1cChmaWxlLm5hbWUpID09PSBmaWxlLnR5cGUpIHtcblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGV4dCA9IG1pbWUuZXh0ZW5zaW9uKGZpbGUudHlwZSk7XG5cdFx0aWYgKGV4dCAmJiBmYWxzZSA9PT0gbmV3IFJlZ0V4cChgXFwuJHsgZXh0IH0kYCwgJ2knKS50ZXN0KGZpbGUubmFtZSkpIHtcblx0XHRcdGZpbGUubmFtZSA9IGAkeyBmaWxlLm5hbWUgfS4keyBleHQgfWA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZpbGU7XG5cdH0sXG5cblx0Z2V0U3RvcmUobW9kZWxOYW1lKSB7XG5cdFx0Y29uc3Qgc3RvcmFnZVR5cGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblx0XHRjb25zdCBoYW5kbGVyTmFtZSA9IGAkeyBzdG9yYWdlVHlwZSB9OiR7IG1vZGVsTmFtZSB9YDtcblxuXHRcdHJldHVybiB0aGlzLmdldFN0b3JlQnlOYW1lKGhhbmRsZXJOYW1lKTtcblx0fSxcblxuXHRnZXRTdG9yZUJ5TmFtZShoYW5kbGVyTmFtZSkge1xuXHRcdGlmICh0aGlzLmhhbmRsZXJzW2hhbmRsZXJOYW1lXSA9PSBudWxsKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBVcGxvYWQgaGFuZGxlciBcIiR7IGhhbmRsZXJOYW1lIH1cIiBkb2VzIG5vdCBleGlzdHNgKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuaGFuZGxlcnNbaGFuZGxlck5hbWVdO1xuXHR9LFxuXG5cdGdldChmaWxlLCByZXEsIHJlcywgbmV4dCkge1xuXHRcdGNvbnN0IHN0b3JlID0gdGhpcy5nZXRTdG9yZUJ5TmFtZShmaWxlLnN0b3JlKTtcblx0XHRpZiAoc3RvcmUgJiYgc3RvcmUuZ2V0KSB7XG5cdFx0XHRyZXR1cm4gc3RvcmUuZ2V0KGZpbGUsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9XG5cdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdHJlcy5lbmQoKTtcblx0fSxcblxuXHRjb3B5KGZpbGUsIHRhcmdldEZpbGUpIHtcblx0XHRjb25zdCBzdG9yZSA9IHRoaXMuZ2V0U3RvcmVCeU5hbWUoZmlsZS5zdG9yZSk7XG5cdFx0Y29uc3Qgb3V0ID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGFyZ2V0RmlsZSk7XG5cblx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdGlmIChzdG9yZS5jb3B5KSB7XG5cdFx0XHRzdG9yZS5jb3B5KGZpbGUsIG91dCk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn0pO1xuXG5leHBvcnQgY2xhc3MgRmlsZVVwbG9hZENsYXNzIHtcblx0Y29uc3RydWN0b3IoeyBuYW1lLCBtb2RlbCwgc3RvcmUsIGdldCwgaW5zZXJ0LCBnZXRTdG9yZSwgY29weSB9KSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLm1vZGVsID0gbW9kZWwgfHwgdGhpcy5nZXRNb2RlbEZyb21OYW1lKCk7XG5cdFx0dGhpcy5fc3RvcmUgPSBzdG9yZSB8fCBVcGxvYWRGUy5nZXRTdG9yZShuYW1lKTtcblx0XHR0aGlzLmdldCA9IGdldDtcblx0XHR0aGlzLmNvcHkgPSBjb3B5O1xuXG5cdFx0aWYgKGluc2VydCkge1xuXHRcdFx0dGhpcy5pbnNlcnQgPSBpbnNlcnQ7XG5cdFx0fVxuXG5cdFx0aWYgKGdldFN0b3JlKSB7XG5cdFx0XHR0aGlzLmdldFN0b3JlID0gZ2V0U3RvcmU7XG5cdFx0fVxuXG5cdFx0RmlsZVVwbG9hZC5oYW5kbGVyc1tuYW1lXSA9IHRoaXM7XG5cdH1cblxuXHRnZXRTdG9yZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fc3RvcmU7XG5cdH1cblxuXHRnZXQgc3RvcmUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0U3RvcmUoKTtcblx0fVxuXG5cdHNldCBzdG9yZShzdG9yZSkge1xuXHRcdHRoaXMuX3N0b3JlID0gc3RvcmU7XG5cdH1cblxuXHRnZXRNb2RlbEZyb21OYW1lKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVsc1t0aGlzLm5hbWUuc3BsaXQoJzonKVsxXV07XG5cdH1cblxuXHRkZWxldGUoZmlsZUlkKSB7XG5cdFx0aWYgKHRoaXMuc3RvcmUgJiYgdGhpcy5zdG9yZS5kZWxldGUpIHtcblx0XHRcdHRoaXMuc3RvcmUuZGVsZXRlKGZpbGVJZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubW9kZWwuZGVsZXRlRmlsZShmaWxlSWQpO1xuXHR9XG5cblx0ZGVsZXRlQnlJZChmaWxlSWQpIHtcblx0XHRjb25zdCBmaWxlID0gdGhpcy5tb2RlbC5maW5kT25lQnlJZChmaWxlSWQpO1xuXG5cdFx0aWYgKCFmaWxlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlQnlOYW1lKGZpbGUuc3RvcmUpO1xuXG5cdFx0cmV0dXJuIHN0b3JlLmRlbGV0ZShmaWxlLl9pZCk7XG5cdH1cblxuXHRkZWxldGVCeU5hbWUoZmlsZU5hbWUpIHtcblx0XHRjb25zdCBmaWxlID0gdGhpcy5tb2RlbC5maW5kT25lQnlOYW1lKGZpbGVOYW1lKTtcblxuXHRcdGlmICghZmlsZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0b3JlID0gRmlsZVVwbG9hZC5nZXRTdG9yZUJ5TmFtZShmaWxlLnN0b3JlKTtcblxuXHRcdHJldHVybiBzdG9yZS5kZWxldGUoZmlsZS5faWQpO1xuXHR9XG5cblx0aW5zZXJ0KGZpbGVEYXRhLCBzdHJlYW1PckJ1ZmZlciwgY2IpIHtcblx0XHRmaWxlRGF0YS5zaXplID0gcGFyc2VJbnQoZmlsZURhdGEuc2l6ZSkgfHwgMDtcblxuXHRcdC8vIENoZWNrIGlmIHRoZSBmaWxlRGF0YSBtYXRjaGVzIHN0b3JlIGZpbHRlclxuXHRcdGNvbnN0IGZpbHRlciA9IHRoaXMuc3RvcmUuZ2V0RmlsdGVyKCk7XG5cdFx0aWYgKGZpbHRlciAmJiBmaWx0ZXIuY2hlY2spIHtcblx0XHRcdGZpbHRlci5jaGVjayhmaWxlRGF0YSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZUlkID0gdGhpcy5zdG9yZS5jcmVhdGUoZmlsZURhdGEpO1xuXHRcdGNvbnN0IHRva2VuID0gdGhpcy5zdG9yZS5jcmVhdGVUb2tlbihmaWxlSWQpO1xuXHRcdGNvbnN0IHRtcEZpbGUgPSBVcGxvYWRGUy5nZXRUZW1wRmlsZVBhdGgoZmlsZUlkKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRpZiAoc3RyZWFtT3JCdWZmZXIgaW5zdGFuY2VvZiBzdHJlYW0pIHtcblx0XHRcdFx0c3RyZWFtT3JCdWZmZXIucGlwZShmcy5jcmVhdGVXcml0ZVN0cmVhbSh0bXBGaWxlKSk7XG5cdFx0XHR9IGVsc2UgaWYgKHN0cmVhbU9yQnVmZmVyIGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cdFx0XHRcdGZzLndyaXRlRmlsZVN5bmModG1wRmlsZSwgc3RyZWFtT3JCdWZmZXIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGZpbGUgdHlwZScpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBmaWxlID0gTWV0ZW9yLmNhbGwoJ3Vmc0NvbXBsZXRlJywgZmlsZUlkLCB0aGlzLm5hbWUsIHRva2VuKTtcblxuXHRcdFx0aWYgKGNiKSB7XG5cdFx0XHRcdGNiKG51bGwsIGZpbGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmlsZTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoY2IpIHtcblx0XHRcdFx0Y2IoZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuIiwiLyogZ2xvYmFscyBVcGxvYWRGUywgSW5zdGFuY2VTdGF0dXMgKi9cblxuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgVVJMIGZyb20gJ3VybCc7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ1VwbG9hZFByb3h5Jyk7XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMuc3RhY2sudW5zaGlmdCh7XG5cdHJvdXRlOiAnJyxcblx0aGFuZGxlOiBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cdFx0Ly8gUXVpY2sgY2hlY2sgdG8gc2VlIGlmIHJlcXVlc3Qgc2hvdWxkIGJlIGNhdGNoXG5cdFx0aWYgKHJlcS51cmwuaW5kZXhPZihVcGxvYWRGUy5jb25maWcuc3RvcmVzUGF0aCkgPT09IC0xKSB7XG5cdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdH1cblxuXHRcdGxvZ2dlci5kZWJ1ZygnVXBsb2FkIFVSTDonLCByZXEudXJsKTtcblxuXHRcdGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fVxuXG5cdFx0Ly8gUmVtb3ZlIHN0b3JlIHBhdGhcblx0XHRjb25zdCBwYXJzZWRVcmwgPSBVUkwucGFyc2UocmVxLnVybCk7XG5cdFx0Y29uc3QgcGF0aCA9IHBhcnNlZFVybC5wYXRobmFtZS5zdWJzdHIoVXBsb2FkRlMuY29uZmlnLnN0b3Jlc1BhdGgubGVuZ3RoICsgMSk7XG5cblx0XHQvLyBHZXQgc3RvcmVcblx0XHRjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKCdeXFwvKFteXFwvXFw/XSspXFwvKFteXFwvXFw/XSspJCcpO1xuXHRcdGNvbnN0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aCk7XG5cblx0XHQvLyBSZXF1ZXN0IGlzIG5vdCB2YWxpZFxuXHRcdGlmIChtYXRjaCA9PT0gbnVsbCkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDApO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIEdldCBzdG9yZVxuXHRcdGNvbnN0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUobWF0Y2hbMV0pO1xuXHRcdGlmICghc3RvcmUpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBHZXQgZmlsZVxuXHRcdGNvbnN0IGZpbGVJZCA9IG1hdGNoWzJdO1xuXHRcdGNvbnN0IGZpbGUgPSBzdG9yZS5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcblx0XHRpZiAoZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGUuaW5zdGFuY2VJZCA9PT0gSW5zdGFuY2VTdGF0dXMuaWQoKSkge1xuXHRcdFx0bG9nZ2VyLmRlYnVnKCdDb3JyZWN0IGluc3RhbmNlJyk7XG5cdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdH1cblxuXHRcdC8vIFByb3h5IHRvIG90aGVyIGluc3RhbmNlXG5cdFx0Y29uc3QgaW5zdGFuY2UgPSBJbnN0YW5jZVN0YXR1cy5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlLmluc3RhbmNlSWR9KTtcblxuXHRcdGlmIChpbnN0YW5jZSA9PSBudWxsKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKGluc3RhbmNlLmV4dHJhSW5mb3JtYXRpb24uaG9zdCA9PT0gcHJvY2Vzcy5lbnYuSU5TVEFOQ0VfSVAgJiYgUm9ja2V0Q2hhdC5pc0RvY2tlcigpID09PSBmYWxzZSkge1xuXHRcdFx0aW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5ob3N0ID0gJ2xvY2FsaG9zdCc7XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLmRlYnVnKCdXcm9uZyBpbnN0YW5jZSwgcHJveGluZyB0bzonLCBgJHsgaW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5ob3N0IH06JHsgaW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5wb3J0IH1gKTtcblxuXHRcdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0XHRob3N0bmFtZTogaW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5ob3N0LFxuXHRcdFx0cG9ydDogaW5zdGFuY2UuZXh0cmFJbmZvcm1hdGlvbi5wb3J0LFxuXHRcdFx0cGF0aDogcmVxLm9yaWdpbmFsVXJsLFxuXHRcdFx0bWV0aG9kOiAnUE9TVCdcblx0XHR9O1xuXG5cdFx0Y29uc3QgcHJveHkgPSBodHRwLnJlcXVlc3Qob3B0aW9ucywgZnVuY3Rpb24ocHJveHlfcmVzKSB7XG5cdFx0XHRwcm94eV9yZXMucGlwZShyZXMsIHtcblx0XHRcdFx0ZW5kOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJlcS5waXBlKHByb3h5LCB7XG5cdFx0XHRlbmQ6IHRydWVcblx0XHR9KTtcblx0fSlcbn0pO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkLCBXZWJBcHAgKi9cblxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoJy9maWxlLXVwbG9hZC8nLFx0ZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblxuXHRjb25zdCBtYXRjaCA9IC9eXFwvKFteXFwvXSspXFwvKC4qKS8uZXhlYyhyZXEudXJsKTtcblxuXHRpZiAobWF0Y2hbMV0pIHtcblx0XHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChtYXRjaFsxXSk7XG5cblx0XHRpZiAoZmlsZSkge1xuXHRcdFx0aWYgKCFNZXRlb3Iuc2V0dGluZ3MucHVibGljLnNhbmRzdG9ybSAmJiAhRmlsZVVwbG9hZC5yZXF1ZXN0Q2FuQWNjZXNzRmlsZXMocmVxKSkge1xuXHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRcdHJldHVybiByZXMuZW5kKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JywgJ2RlZmF1bHQtc3JjIFxcJ25vbmVcXCcnKTtcblx0XHRcdHJldHVybiBGaWxlVXBsb2FkLmdldChmaWxlLCByZXEsIHJlcywgbmV4dCk7XG5cdFx0fVxuXHR9XG5cblx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRyZXMuZW5kKCk7XG59KTtcbiIsIi8qIGdsb2JhbHMgVXBsb2FkRlMgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgJy4vQW1hem9uUzMuanMnO1xuaW1wb3J0ICcuL0ZpbGVTeXN0ZW0uanMnO1xuaW1wb3J0ICcuL0dvb2dsZVN0b3JhZ2UuanMnO1xuaW1wb3J0ICcuL0dyaWRGUy5qcyc7XG5pbXBvcnQgJy4vV2ViZGF2LmpzJztcbmltcG9ydCAnLi9TbGluZ3Nob3RfREVQUkVDQVRFRC5qcyc7XG5cbmNvbnN0IGNvbmZpZ1N0b3JlID0gXy5kZWJvdW5jZSgoKSA9PiB7XG5cdGNvbnN0IHN0b3JlID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyk7XG5cblx0aWYgKHN0b3JlKSB7XG5cdFx0Y29uc29sZS5sb2coJ1NldHRpbmcgZGVmYXVsdCBmaWxlIHN0b3JlIHRvJywgc3RvcmUpO1xuXHRcdFVwbG9hZEZTLmdldFN0b3JlcygpLkF2YXRhcnMgPSBVcGxvYWRGUy5nZXRTdG9yZShgJHsgc3RvcmUgfTpBdmF0YXJzYCk7XG5cdFx0VXBsb2FkRlMuZ2V0U3RvcmVzKCkuVXBsb2FkcyA9IFVwbG9hZEZTLmdldFN0b3JlKGAkeyBzdG9yZSB9OlVwbG9hZHNgKTtcblx0XHRVcGxvYWRGUy5nZXRTdG9yZXMoKS5Vc2VyRGF0YUZpbGVzID0gVXBsb2FkRlMuZ2V0U3RvcmUoYCR7IHN0b3JlIH06VXNlckRhdGFGaWxlc2ApO1xuXHR9XG59LCAxMDAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkXy8sIGNvbmZpZ1N0b3JlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB7IEZpbGVVcGxvYWRDbGFzcyB9IGZyb20gJy4uL2xpYi9GaWxlVXBsb2FkJztcbmltcG9ydCAnLi4vLi4vdWZzL0FtYXpvblMzL3NlcnZlci5qcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5cbmNvbnN0IGdldCA9IGZ1bmN0aW9uKGZpbGUsIHJlcSwgcmVzKSB7XG5cdGNvbnN0IGZpbGVVcmwgPSB0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUpO1xuXG5cdGlmIChmaWxlVXJsKSB7XG5cdFx0Y29uc3Qgc3RvcmVUeXBlID0gZmlsZS5zdG9yZS5zcGxpdCgnOicpLnBvcCgpO1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldChgRmlsZVVwbG9hZF9TM19Qcm94eV8keyBzdG9yZVR5cGUgfWApKSB7XG5cdFx0XHRjb25zdCByZXF1ZXN0ID0gL15odHRwczovLnRlc3QoZmlsZVVybCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShyZXMpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgZmlsZVVybCk7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDMwMik7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlcy5lbmQoKTtcblx0fVxufTtcblxuY29uc3QgY29weSA9IGZ1bmN0aW9uKGZpbGUsIG91dCkge1xuXHRjb25zdCBmaWxlVXJsID0gdGhpcy5zdG9yZS5nZXRSZWRpcmVjdFVSTChmaWxlKTtcblxuXHRpZiAoZmlsZVVybCkge1xuXHRcdGNvbnN0IHJlcXVlc3QgPSAvXmh0dHBzOi8udGVzdChmaWxlVXJsKSA/IGh0dHBzIDogaHR0cDtcblx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShvdXQpKTtcblx0fSBlbHNlIHtcblx0XHRvdXQuZW5kKCk7XG5cdH1cbn07XG5cbmNvbnN0IEFtYXpvblMzVXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnQW1hem9uUzM6VXBsb2FkcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgQW1hem9uUzNBdmF0YXJzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdBbWF6b25TMzpBdmF0YXJzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBBbWF6b25TM1VzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0FtYXpvblMzOlVzZXJEYXRhRmlsZXMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IGNvbmZpZ3VyZSA9IF8uZGVib3VuY2UoZnVuY3Rpb24oKSB7XG5cdGNvbnN0IEJ1Y2tldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0J1Y2tldCcpO1xuXHRjb25zdCBBY2wgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BY2wnKTtcblx0Y29uc3QgQVdTQWNjZXNzS2V5SWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NBY2Nlc3NLZXlJZCcpO1xuXHRjb25zdCBBV1NTZWNyZXRBY2Nlc3NLZXkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NTZWNyZXRBY2Nlc3NLZXknKTtcblx0Y29uc3QgVVJMRXhwaXJ5VGltZVNwYW4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3BhbicpO1xuXHRjb25zdCBSZWdpb24gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19SZWdpb24nKTtcblx0Y29uc3QgU2lnbmF0dXJlVmVyc2lvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1NpZ25hdHVyZVZlcnNpb24nKTtcblx0Y29uc3QgRm9yY2VQYXRoU3R5bGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19Gb3JjZVBhdGhTdHlsZScpO1xuXHQvLyBjb25zdCBDRE4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19DRE4nKTtcblx0Y29uc3QgQnVja2V0VVJMID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0VVJMJyk7XG5cblx0aWYgKCFCdWNrZXQpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBjb25maWcgPSB7XG5cdFx0Y29ubmVjdGlvbjoge1xuXHRcdFx0c2lnbmF0dXJlVmVyc2lvbjogU2lnbmF0dXJlVmVyc2lvbixcblx0XHRcdHMzRm9yY2VQYXRoU3R5bGU6IEZvcmNlUGF0aFN0eWxlLFxuXHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdEJ1Y2tldCxcblx0XHRcdFx0QUNMOiBBY2xcblx0XHRcdH0sXG5cdFx0XHRyZWdpb246IFJlZ2lvblxuXHRcdH0sXG5cdFx0VVJMRXhwaXJ5VGltZVNwYW5cblx0fTtcblxuXHRpZiAoQVdTQWNjZXNzS2V5SWQpIHtcblx0XHRjb25maWcuY29ubmVjdGlvbi5hY2Nlc3NLZXlJZCA9IEFXU0FjY2Vzc0tleUlkO1xuXHR9XG5cblx0aWYgKEFXU1NlY3JldEFjY2Vzc0tleSkge1xuXHRcdGNvbmZpZy5jb25uZWN0aW9uLnNlY3JldEFjY2Vzc0tleSA9IEFXU1NlY3JldEFjY2Vzc0tleTtcblx0fVxuXG5cdGlmIChCdWNrZXRVUkwpIHtcblx0XHRjb25maWcuY29ubmVjdGlvbi5lbmRwb2ludCA9IEJ1Y2tldFVSTDtcblx0fVxuXG5cdEFtYXpvblMzVXBsb2Fkcy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdBbWF6b25TMycsIEFtYXpvblMzVXBsb2Fkcy5uYW1lLCBjb25maWcpO1xuXHRBbWF6b25TM0F2YXRhcnMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnQW1hem9uUzMnLCBBbWF6b25TM0F2YXRhcnMubmFtZSwgY29uZmlnKTtcblx0QW1hem9uUzNVc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0FtYXpvblMzJywgQW1hem9uUzNVc2VyRGF0YUZpbGVzLm5hbWUsIGNvbmZpZyk7XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfUzNfLywgY29uZmlndXJlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCwgVXBsb2FkRlMgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuXG5jb25zdCBGaWxlU3lzdGVtVXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnRmlsZVN5c3RlbTpVcGxvYWRzJyxcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xuXG5cdGdldChmaWxlLCByZXEsIHJlcykge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5zdG9yZS5nZXRGaWxlUGF0aChmaWxlLl9pZCwgZmlsZSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3RhdCA9IE1ldGVvci53cmFwQXN5bmMoZnMuc3RhdCkoZmlsZVBhdGgpO1xuXG5cdFx0XHRpZiAoc3RhdCAmJiBzdGF0LmlzRmlsZSgpKSB7XG5cdFx0XHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgZmlsZS51cGxvYWRlZEF0LnRvVVRDU3RyaW5nKCkpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLnR5cGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRcdFx0dGhpcy5zdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGUuX2lkLCBmaWxlKS5waXBlKHJlcyk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fSxcblxuXHRjb3B5KGZpbGUsIG91dCkge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5zdG9yZS5nZXRGaWxlUGF0aChmaWxlLl9pZCwgZmlsZSk7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXQgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQpKGZpbGVQYXRoKTtcblxuXHRcdFx0aWYgKHN0YXQgJiYgc3RhdC5pc0ZpbGUoKSkge1xuXHRcdFx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUob3V0KTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRvdXQuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgRmlsZVN5c3RlbUF2YXRhcnMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0ZpbGVTeXN0ZW06QXZhdGFycycsXG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHRoaXMuc3RvcmUuZ2V0RmlsZVBhdGgoZmlsZS5faWQsIGZpbGUpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXQgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQpKGZpbGVQYXRoKTtcblxuXHRcdFx0aWYgKHN0YXQgJiYgc3RhdC5pc0ZpbGUoKSkge1xuXHRcdFx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUocmVzKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgRmlsZVN5c3RlbVVzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0ZpbGVTeXN0ZW06VXNlckRhdGFGaWxlcycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLnN0b3JlLmdldEZpbGVQYXRoKGZpbGUuX2lkLCBmaWxlKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdGF0ID0gTWV0ZW9yLndyYXBBc3luYyhmcy5zdGF0KShmaWxlUGF0aCk7XG5cblx0XHRcdGlmIChzdGF0ICYmIHN0YXQuaXNGaWxlKCkpIHtcblx0XHRcdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JyckeyBlbmNvZGVVUklDb21wb25lbnQoZmlsZS5uYW1lKSB9YCk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGZpbGUudHlwZSk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgZmlsZS5zaXplKTtcblxuXHRcdFx0XHR0aGlzLnN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpLnBpcGUocmVzKTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgY3JlYXRlRmlsZVN5c3RlbVN0b3JlID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRwYXRoOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcpIC8vJy90bXAvdXBsb2Fkcy9waG90b3MnLFxuXHR9O1xuXG5cdEZpbGVTeXN0ZW1VcGxvYWRzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbVVwbG9hZHMubmFtZSwgb3B0aW9ucyk7XG5cdEZpbGVTeXN0ZW1BdmF0YXJzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbUF2YXRhcnMubmFtZSwgb3B0aW9ucyk7XG5cdEZpbGVTeXN0ZW1Vc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbVVzZXJEYXRhRmlsZXMubmFtZSwgb3B0aW9ucyk7XG5cblx0Ly8gREVQUkVDQVRFRCBiYWNrd2FyZHMgY29tcGF0aWJpbGlsdHkgKHJlbW92ZSlcblx0VXBsb2FkRlMuZ2V0U3RvcmVzKClbJ2ZpbGVTeXN0ZW0nXSA9IFVwbG9hZEZTLmdldFN0b3JlcygpW0ZpbGVTeXN0ZW1VcGxvYWRzLm5hbWVdO1xufSwgNTAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfRmlsZVN5c3RlbVBhdGgnLCBjcmVhdGVGaWxlU3lzdGVtU3RvcmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuaW1wb3J0ICcuLi8uLi91ZnMvR29vZ2xlU3RvcmFnZS9zZXJ2ZXIuanMnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5jb25zdCBnZXQgPSBmdW5jdGlvbihmaWxlLCByZXEsIHJlcykge1xuXHR0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUsIChlcnIsIGZpbGVVcmwpID0+IHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVVcmwpIHtcblx0XHRcdGNvbnN0IHN0b3JlVHlwZSA9IGZpbGUuc3RvcmUuc3BsaXQoJzonKS5wb3AoKTtcblx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldChgRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1Byb3h5XyR7IHN0b3JlVHlwZSB9YCkpIHtcblx0XHRcdFx0Y29uc3QgcmVxdWVzdCA9IC9eaHR0cHM6Ly50ZXN0KGZpbGVVcmwpID8gaHR0cHMgOiBodHRwO1xuXHRcdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShyZXMpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJyk7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgZmlsZVVybCk7XG5cdFx0XHRcdHJlcy53cml0ZUhlYWQoMzAyKTtcblx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmNvbnN0IGNvcHkgPSBmdW5jdGlvbihmaWxlLCBvdXQpIHtcblx0dGhpcy5zdG9yZS5nZXRSZWRpcmVjdFVSTChmaWxlLCAoZXJyLCBmaWxlVXJsKSA9PiB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdH1cblxuXHRcdGlmIChmaWxlVXJsKSB7XG5cdFx0XHRjb25zdCByZXF1ZXN0ID0gL15odHRwczovLnRlc3QoZmlsZVVybCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShvdXQpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b3V0LmVuZCgpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5jb25zdCBHb29nbGVDbG91ZFN0b3JhZ2VVcGxvYWRzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHb29nbGVDbG91ZFN0b3JhZ2U6VXBsb2FkcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgR29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnR29vZ2xlQ2xvdWRTdG9yYWdlOkF2YXRhcnMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IEdvb2dsZUNsb3VkU3RvcmFnZVVzZXJEYXRhRmlsZXMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dvb2dsZUNsb3VkU3RvcmFnZTpVc2VyRGF0YUZpbGVzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBjb25maWd1cmUgPSBfLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuXHRjb25zdCBidWNrZXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0J1Y2tldCcpO1xuXHRjb25zdCBhY2Nlc3NJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQWNjZXNzSWQnKTtcblx0Y29uc3Qgc2VjcmV0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9TZWNyZXQnKTtcblx0Y29uc3QgVVJMRXhwaXJ5VGltZVNwYW4gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19VUkxFeHBpcnlUaW1lU3BhbicpO1xuXG5cdGlmICghYnVja2V0IHx8ICFhY2Nlc3NJZCB8fCAhc2VjcmV0KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgY29uZmlnID0ge1xuXHRcdGNvbm5lY3Rpb246IHtcblx0XHRcdGNyZWRlbnRpYWxzOiB7XG5cdFx0XHRcdGNsaWVudF9lbWFpbDogYWNjZXNzSWQsXG5cdFx0XHRcdHByaXZhdGVfa2V5OiBzZWNyZXRcblx0XHRcdH1cblx0XHR9LFxuXHRcdGJ1Y2tldCxcblx0XHRVUkxFeHBpcnlUaW1lU3BhblxuXHR9O1xuXG5cdEdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR29vZ2xlU3RvcmFnZScsIEdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMubmFtZSwgY29uZmlnKTtcblx0R29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHb29nbGVTdG9yYWdlJywgR29vZ2xlQ2xvdWRTdG9yYWdlQXZhdGFycy5uYW1lLCBjb25maWcpO1xuXHRHb29nbGVDbG91ZFN0b3JhZ2VVc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0dvb2dsZVN0b3JhZ2UnLCBHb29nbGVDbG91ZFN0b3JhZ2VVc2VyRGF0YUZpbGVzLm5hbWUsIGNvbmZpZyk7XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV8vLCBjb25maWd1cmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkLCBVcGxvYWRGUyAqL1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuaW1wb3J0IHpsaWIgZnJvbSAnemxpYic7XG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcblxuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdGaWxlVXBsb2FkJyk7XG5cbmZ1bmN0aW9uIEV4dHJhY3RSYW5nZShvcHRpb25zKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBFeHRyYWN0UmFuZ2UpKSB7XG5cdFx0cmV0dXJuIG5ldyBFeHRyYWN0UmFuZ2Uob3B0aW9ucyk7XG5cdH1cblxuXHR0aGlzLnN0YXJ0ID0gb3B0aW9ucy5zdGFydDtcblx0dGhpcy5zdG9wID0gb3B0aW9ucy5zdG9wO1xuXHR0aGlzLmJ5dGVzX3JlYWQgPSAwO1xuXG5cdHN0cmVhbS5UcmFuc2Zvcm0uY2FsbCh0aGlzLCBvcHRpb25zKTtcbn1cbnV0aWwuaW5oZXJpdHMoRXh0cmFjdFJhbmdlLCBzdHJlYW0uVHJhbnNmb3JtKTtcblxuXG5FeHRyYWN0UmFuZ2UucHJvdG90eXBlLl90cmFuc2Zvcm0gPSBmdW5jdGlvbihjaHVuaywgZW5jLCBjYikge1xuXHRpZiAodGhpcy5ieXRlc19yZWFkID4gdGhpcy5zdG9wKSB7XG5cdFx0Ly8gZG9uZSByZWFkaW5nXG5cdFx0dGhpcy5lbmQoKTtcblx0fSBlbHNlIGlmICh0aGlzLmJ5dGVzX3JlYWQgKyBjaHVuay5sZW5ndGggPCB0aGlzLnN0YXJ0KSB7XG5cdFx0Ly8gdGhpcyBjaHVuayBpcyBzdGlsbCBiZWZvcmUgdGhlIHN0YXJ0IGJ5dGVcblx0fSBlbHNlIHtcblx0XHRsZXQgc3RhcnQ7XG5cdFx0bGV0IHN0b3A7XG5cblx0XHRpZiAodGhpcy5zdGFydCA8PSB0aGlzLmJ5dGVzX3JlYWQpIHtcblx0XHRcdHN0YXJ0ID0gMDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RhcnQgPSB0aGlzLnN0YXJ0IC0gdGhpcy5ieXRlc19yZWFkO1xuXHRcdH1cblx0XHRpZiAoKHRoaXMuc3RvcCAtIHRoaXMuYnl0ZXNfcmVhZCArIDEpIDwgY2h1bmsubGVuZ3RoKSB7XG5cdFx0XHRzdG9wID0gdGhpcy5zdG9wIC0gdGhpcy5ieXRlc19yZWFkICsgMTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RvcCA9IGNodW5rLmxlbmd0aDtcblx0XHR9XG5cdFx0Y29uc3QgbmV3Y2h1bmsgPSBjaHVuay5zbGljZShzdGFydCwgc3RvcCk7XG5cdFx0dGhpcy5wdXNoKG5ld2NodW5rKTtcblx0fVxuXHR0aGlzLmJ5dGVzX3JlYWQgKz0gY2h1bmsubGVuZ3RoO1xuXHRjYigpO1xufTtcblxuXG5jb25zdCBnZXRCeXRlUmFuZ2UgPSBmdW5jdGlvbihoZWFkZXIpIHtcblx0aWYgKGhlYWRlcikge1xuXHRcdGNvbnN0IG1hdGNoZXMgPSBoZWFkZXIubWF0Y2goLyhcXGQrKS0oXFxkKykvKTtcblx0XHRpZiAobWF0Y2hlcykge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3RhcnQ6IHBhcnNlSW50KG1hdGNoZXNbMV0sIDEwKSxcblx0XHRcdFx0c3RvcDogcGFyc2VJbnQobWF0Y2hlc1syXSwgMTApXG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5cbi8vIGNvZGUgZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2phbGlrL2phbGlrLXVmcy9ibG9iL21hc3Rlci91ZnMtc2VydmVyLmpzI0wzMTBcbmNvbnN0IHJlYWRGcm9tR3JpZEZTID0gZnVuY3Rpb24oc3RvcmVOYW1lLCBmaWxlSWQsIGZpbGUsIHJlcSwgcmVzKSB7XG5cdGNvbnN0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUoc3RvcmVOYW1lKTtcblx0Y29uc3QgcnMgPSBzdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGVJZCwgZmlsZSk7XG5cdGNvbnN0IHdzID0gbmV3IHN0cmVhbS5QYXNzVGhyb3VnaCgpO1xuXG5cdFtycywgd3NdLmZvckVhY2goc3RyZWFtID0+IHN0cmVhbS5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcblx0XHRzdG9yZS5vblJlYWRFcnJvci5jYWxsKHN0b3JlLCBlcnIsIGZpbGVJZCwgZmlsZSk7XG5cdFx0cmVzLmVuZCgpO1xuXHR9KSk7XG5cblx0d3Mub24oJ2Nsb3NlJywgZnVuY3Rpb24oKSB7XG5cdFx0Ly8gQ2xvc2Ugb3V0cHV0IHN0cmVhbSBhdCB0aGUgZW5kXG5cdFx0d3MuZW1pdCgnZW5kJyk7XG5cdH0pO1xuXG5cdGNvbnN0IGFjY2VwdCA9IHJlcS5oZWFkZXJzWydhY2NlcHQtZW5jb2RpbmcnXSB8fCAnJztcblxuXHQvLyBUcmFuc2Zvcm0gc3RyZWFtXG5cdHN0b3JlLnRyYW5zZm9ybVJlYWQocnMsIHdzLCBmaWxlSWQsIGZpbGUsIHJlcSk7XG5cdGNvbnN0IHJhbmdlID0gZ2V0Qnl0ZVJhbmdlKHJlcS5oZWFkZXJzLnJhbmdlKTtcblx0bGV0IG91dF9vZl9yYW5nZSA9IGZhbHNlO1xuXHRpZiAocmFuZ2UpIHtcblx0XHRvdXRfb2ZfcmFuZ2UgPSAocmFuZ2Uuc3RhcnQgPiBmaWxlLnNpemUpIHx8IChyYW5nZS5zdG9wIDw9IHJhbmdlLnN0YXJ0KSB8fCAocmFuZ2Uuc3RvcCA+IGZpbGUuc2l6ZSk7XG5cdH1cblxuXHQvLyBDb21wcmVzcyBkYXRhIHVzaW5nIGd6aXBcblx0aWYgKGFjY2VwdC5tYXRjaCgvXFxiZ3ppcFxcYi8pICYmIHJhbmdlID09PSBudWxsKSB7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1FbmNvZGluZycsICdnemlwJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdFx0d3MucGlwZSh6bGliLmNyZWF0ZUd6aXAoKSkucGlwZShyZXMpO1xuXHR9IGVsc2UgaWYgKGFjY2VwdC5tYXRjaCgvXFxiZGVmbGF0ZVxcYi8pICYmIHJhbmdlID09PSBudWxsKSB7XG5cdFx0Ly8gQ29tcHJlc3MgZGF0YSB1c2luZyBkZWZsYXRlXG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1FbmNvZGluZycsICdkZWZsYXRlJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdFx0d3MucGlwZSh6bGliLmNyZWF0ZURlZmxhdGUoKSkucGlwZShyZXMpO1xuXHR9IGVsc2UgaWYgKHJhbmdlICYmIG91dF9vZl9yYW5nZSkge1xuXHRcdC8vIG91dCBvZiByYW5nZSByZXF1ZXN0LCByZXR1cm4gNDE2XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LVR5cGUnKTtcblx0XHRyZXMucmVtb3ZlSGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignTGFzdC1Nb2RpZmllZCcpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtUmFuZ2UnLCBgYnl0ZXMgKi8keyBmaWxlLnNpemUgfWApO1xuXHRcdHJlcy53cml0ZUhlYWQoNDE2KTtcblx0XHRyZXMuZW5kKCk7XG5cdH0gZWxzZSBpZiAocmFuZ2UpIHtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVJhbmdlJywgYGJ5dGVzICR7IHJhbmdlLnN0YXJ0IH0tJHsgcmFuZ2Uuc3RvcCB9LyR7IGZpbGUuc2l6ZSB9YCk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1MZW5ndGgnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIHJhbmdlLnN0b3AgLSByYW5nZS5zdGFydCArIDEpO1xuXHRcdHJlcy53cml0ZUhlYWQoMjA2KTtcblx0XHRsb2dnZXIuZGVidWcoJ0ZpbGUgdXBsb2FkIGV4dHJhY3RpbmcgcmFuZ2UnKTtcblx0XHR3cy5waXBlKG5ldyBFeHRyYWN0UmFuZ2UoeyBzdGFydDogcmFuZ2Uuc3RhcnQsIHN0b3A6IHJhbmdlLnN0b3AgfSkpLnBpcGUocmVzKTtcblx0fSBlbHNlIHtcblx0XHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdFx0d3MucGlwZShyZXMpO1xuXHR9XG59O1xuXG5jb25zdCBjb3B5RnJvbUdyaWRGUyA9IGZ1bmN0aW9uKHN0b3JlTmFtZSwgZmlsZUlkLCBmaWxlLCBvdXQpIHtcblx0Y29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xuXHRjb25zdCBycyA9IHN0b3JlLmdldFJlYWRTdHJlYW0oZmlsZUlkLCBmaWxlKTtcblxuXHRbcnMsIG91dF0uZm9yRWFjaChzdHJlYW0gPT4gc3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuXHRcdHN0b3JlLm9uUmVhZEVycm9yLmNhbGwoc3RvcmUsIGVyciwgZmlsZUlkLCBmaWxlKTtcblx0XHRvdXQuZW5kKCk7XG5cdH0pKTtcblxuXHRycy5waXBlKG91dCk7XG59O1xuXG5GaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR3JpZEZTJywgJ0dyaWRGUzpVcGxvYWRzJywge1xuXHRjb2xsZWN0aW9uTmFtZTogJ3JvY2tldGNoYXRfdXBsb2Fkcydcbn0pO1xuXG5GaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR3JpZEZTJywgJ0dyaWRGUzpVc2VyRGF0YUZpbGVzJywge1xuXHRjb2xsZWN0aW9uTmFtZTogJ3JvY2tldGNoYXRfdXNlckRhdGFGaWxlcydcbn0pO1xuXG4vLyBERVBSRUNBVEVEOiBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSAocmVtb3ZlKVxuVXBsb2FkRlMuZ2V0U3RvcmVzKClbJ3JvY2tldGNoYXRfdXBsb2FkcyddID0gVXBsb2FkRlMuZ2V0U3RvcmVzKClbJ0dyaWRGUzpVcGxvYWRzJ107XG5cbkZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdHcmlkRlMnLCAnR3JpZEZTOkF2YXRhcnMnLCB7XG5cdGNvbGxlY3Rpb25OYW1lOiAncm9ja2V0Y2hhdF9hdmF0YXJzJ1xufSk7XG5cblxubmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHcmlkRlM6VXBsb2FkcycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgZmlsZS50eXBlKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRyZXR1cm4gcmVhZEZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIHJlcSwgcmVzKTtcblx0fSxcblxuXHRjb3B5KGZpbGUsIG91dCkge1xuXHRcdGNvcHlGcm9tR3JpZEZTKGZpbGUuc3RvcmUsIGZpbGUuX2lkLCBmaWxlLCBvdXQpO1xuXHR9XG59KTtcblxubmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHcmlkRlM6VXNlckRhdGFGaWxlcycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCBmaWxlLnVwbG9hZGVkQXQudG9VVENTdHJpbmcoKSk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgZmlsZS50eXBlKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRyZXR1cm4gcmVhZEZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIHJlcSwgcmVzKTtcblx0fSxcblxuXHRjb3B5KGZpbGUsIG91dCkge1xuXHRcdGNvcHlGcm9tR3JpZEZTKGZpbGUuc3RvcmUsIGZpbGUuX2lkLCBmaWxlLCBvdXQpO1xuXHR9XG59KTtcblxubmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHcmlkRlM6QXZhdGFycycsXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRyZXR1cm4gcmVhZEZyb21HcmlkRlMoZmlsZS5zdG9yZSwgZmlsZS5faWQsIGZpbGUsIHJlcSwgcmVzKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIFNsaW5nc2hvdCwgRmlsZVVwbG9hZCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmNvbnN0IGNvbmZpZ3VyZVNsaW5nc2hvdCA9IF8uZGVib3VuY2UoKCkgPT4ge1xuXHRjb25zdCB0eXBlID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyk7XG5cdGNvbnN0IGJ1Y2tldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0J1Y2tldCcpO1xuXHRjb25zdCBhY2wgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BY2wnKTtcblx0Y29uc3QgYWNjZXNzS2V5ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQVdTQWNjZXNzS2V5SWQnKTtcblx0Y29uc3Qgc2VjcmV0S2V5ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQVdTU2VjcmV0QWNjZXNzS2V5Jyk7XG5cdGNvbnN0IGNkbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0NETicpO1xuXHRjb25zdCByZWdpb24gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19SZWdpb24nKTtcblx0Y29uc3QgYnVja2V0VXJsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0VVJMJyk7XG5cblx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzJ107XG5cblx0aWYgKHR5cGUgPT09ICdBbWF6b25TMycgJiYgIV8uaXNFbXB0eShidWNrZXQpICYmICFfLmlzRW1wdHkoYWNjZXNzS2V5KSAmJiAhXy5pc0VtcHR5KHNlY3JldEtleSkpIHtcblx0XHRpZiAoU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMnXSkge1xuXHRcdFx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzJ107XG5cdFx0fVxuXHRcdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRcdGJ1Y2tldCxcblx0XHRcdGtleShmaWxlLCBtZXRhQ29udGV4dCkge1xuXHRcdFx0XHRjb25zdCBpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0XHRjb25zdCBwYXRoID0gYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpIH0vdXBsb2Fkcy8keyBtZXRhQ29udGV4dC5yaWQgfS8keyB0aGlzLnVzZXJJZCB9LyR7IGlkIH1gO1xuXG5cdFx0XHRcdGNvbnN0IHVwbG9hZCA9IHtcblx0XHRcdFx0XHRfaWQ6IGlkLFxuXHRcdFx0XHRcdHJpZDogbWV0YUNvbnRleHQucmlkLFxuXHRcdFx0XHRcdEFtYXpvblMzOiB7XG5cdFx0XHRcdFx0XHRwYXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuaW5zZXJ0RmlsZUluaXQodGhpcy51c2VySWQsICdBbWF6b25TMzpVcGxvYWRzJywgZmlsZSwgdXBsb2FkKTtcblxuXHRcdFx0XHRyZXR1cm4gcGF0aDtcblx0XHRcdH0sXG5cdFx0XHRBV1NBY2Nlc3NLZXlJZDogYWNjZXNzS2V5LFxuXHRcdFx0QVdTU2VjcmV0QWNjZXNzS2V5OiBzZWNyZXRLZXlcblx0XHR9O1xuXG5cdFx0aWYgKCFfLmlzRW1wdHkoYWNsKSkge1xuXHRcdFx0Y29uZmlnLmFjbCA9IGFjbDtcblx0XHR9XG5cblx0XHRpZiAoIV8uaXNFbXB0eShjZG4pKSB7XG5cdFx0XHRjb25maWcuY2RuID0gY2RuO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KHJlZ2lvbikpIHtcblx0XHRcdGNvbmZpZy5yZWdpb24gPSByZWdpb247XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzRW1wdHkoYnVja2V0VXJsKSkge1xuXHRcdFx0Y29uZmlnLmJ1Y2tldFVybCA9IGJ1Y2tldFVybDtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0U2xpbmdzaG90LmNyZWF0ZURpcmVjdGl2ZSgncm9ja2V0Y2hhdC11cGxvYWRzJywgU2xpbmdzaG90LlMzU3RvcmFnZSwgY29uZmlnKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBjb25maWd1cmluZyBTMyAtPicsIGUubWVzc2FnZSk7XG5cdFx0fVxuXHR9XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLCBjb25maWd1cmVTbGluZ3Nob3QpO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkX1MzXy8sIGNvbmZpZ3VyZVNsaW5nc2hvdCk7XG5cblxuXG5jb25zdCBjcmVhdGVHb29nbGVTdG9yYWdlRGlyZWN0aXZlID0gXy5kZWJvdW5jZSgoKSA9PiB7XG5cdGNvbnN0IHR5cGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblx0Y29uc3QgYnVja2V0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9CdWNrZXQnKTtcblx0Y29uc3QgYWNjZXNzSWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0FjY2Vzc0lkJyk7XG5cdGNvbnN0IHNlY3JldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0Jyk7XG5cblx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzLWdzJ107XG5cblx0aWYgKHR5cGUgPT09ICdHb29nbGVDbG91ZFN0b3JhZ2UnICYmICFfLmlzRW1wdHkoc2VjcmV0KSAmJiAhXy5pc0VtcHR5KGFjY2Vzc0lkKSAmJiAhXy5pc0VtcHR5KGJ1Y2tldCkpIHtcblx0XHRpZiAoU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnXSkge1xuXHRcdFx0ZGVsZXRlIFNsaW5nc2hvdC5fZGlyZWN0aXZlc1sncm9ja2V0Y2hhdC11cGxvYWRzLWdzJ107XG5cdFx0fVxuXG5cdFx0Y29uc3QgY29uZmlnID0ge1xuXHRcdFx0YnVja2V0LFxuXHRcdFx0R29vZ2xlQWNjZXNzSWQ6IGFjY2Vzc0lkLFxuXHRcdFx0R29vZ2xlU2VjcmV0S2V5OiBzZWNyZXQsXG5cdFx0XHRrZXkoZmlsZSwgbWV0YUNvbnRleHQpIHtcblx0XHRcdFx0Y29uc3QgaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdFx0Y29uc3QgcGF0aCA9IGAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSB9L3VwbG9hZHMvJHsgbWV0YUNvbnRleHQucmlkIH0vJHsgdGhpcy51c2VySWQgfS8keyBpZCB9YDtcblxuXHRcdFx0XHRjb25zdCB1cGxvYWQgPSB7XG5cdFx0XHRcdFx0X2lkOiBpZCxcblx0XHRcdFx0XHRyaWQ6IG1ldGFDb250ZXh0LnJpZCxcblx0XHRcdFx0XHRHb29nbGVTdG9yYWdlOiB7XG5cdFx0XHRcdFx0XHRwYXRoXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuaW5zZXJ0RmlsZUluaXQodGhpcy51c2VySWQsICdHb29nbGVDbG91ZFN0b3JhZ2U6VXBsb2FkcycsIGZpbGUsIHVwbG9hZCk7XG5cblx0XHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRTbGluZ3Nob3QuY3JlYXRlRGlyZWN0aXZlKCdyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnLCBTbGluZ3Nob3QuR29vZ2xlQ2xvdWQsIGNvbmZpZyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgY29uZmlndXJpbmcgR29vZ2xlQ2xvdWRTdG9yYWdlIC0+JywgZS5tZXNzYWdlKTtcblx0XHR9XG5cdH1cbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsIGNyZWF0ZUdvb2dsZVN0b3JhZ2VEaXJlY3RpdmUpO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfLywgY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgeyBGaWxlVXBsb2FkQ2xhc3MgfSBmcm9tICcuLi9saWIvRmlsZVVwbG9hZCc7XG5pbXBvcnQgJy4uLy4uL3Vmcy9XZWJkYXYvc2VydmVyLmpzJztcblxuY29uc3QgZ2V0ID0gZnVuY3Rpb24oZmlsZSwgcmVxLCByZXMpIHtcblx0dGhpcy5zdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGUuX2lkLCBmaWxlKS5waXBlKHJlcyk7XG59O1xuXG5jb25zdCBjb3B5ID0gZnVuY3Rpb24oZmlsZSwgb3V0KSB7XG5cdHRoaXMuc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlLl9pZCwgZmlsZSkucGlwZShvdXQpO1xufTtcblxuY29uc3QgV2ViZGF2VXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnV2ViZGF2OlVwbG9hZHMnLFxuXHRnZXQsXG5cdGNvcHlcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xufSk7XG5cbmNvbnN0IFdlYmRhdkF2YXRhcnMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ1dlYmRhdjpBdmF0YXJzJyxcblx0Z2V0LFxuXHRjb3B5XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBXZWJkYXZVc2VyRGF0YUZpbGVzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdXZWJkYXY6VXNlckRhdGFGaWxlcycsXG5cdGdldCxcblx0Y29weVxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgY29uZmlndXJlID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0Y29uc3QgdXBsb2FkRm9sZGVyUGF0aCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1dlYmRhdl9VcGxvYWRfRm9sZGVyX1BhdGgnKTtcblx0Y29uc3Qgc2VydmVyID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfV2ViZGF2X1NlcnZlcl9VUkwnKTtcblx0Y29uc3QgdXNlcm5hbWUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9XZWJkYXZfVXNlcm5hbWUnKTtcblx0Y29uc3QgcGFzc3dvcmQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9XZWJkYXZfUGFzc3dvcmQnKTtcblxuXHRpZiAoIXNlcnZlciB8fCAhdXNlcm5hbWUgfHwgIXBhc3N3b3JkKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgY29uZmlnID0ge1xuXHRcdGNvbm5lY3Rpb246IHtcblx0XHRcdGNyZWRlbnRpYWxzOiB7XG5cdFx0XHRcdHNlcnZlcixcblx0XHRcdFx0dXNlcm5hbWUsXG5cdFx0XHRcdHBhc3N3b3JkXG5cdFx0XHR9XG5cdFx0fSxcblx0XHR1cGxvYWRGb2xkZXJQYXRoXG5cdH07XG5cblx0V2ViZGF2VXBsb2Fkcy5zdG9yZSA9IEZpbGVVcGxvYWQuY29uZmlndXJlVXBsb2Fkc1N0b3JlKCdXZWJkYXYnLCBXZWJkYXZVcGxvYWRzLm5hbWUsIGNvbmZpZyk7XG5cdFdlYmRhdkF2YXRhcnMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnV2ViZGF2JywgV2ViZGF2QXZhdGFycy5uYW1lLCBjb25maWcpO1xuXHRXZWJkYXZVc2VyRGF0YUZpbGVzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ1dlYmRhdicsIFdlYmRhdlVzZXJEYXRhRmlsZXMubmFtZSwgY29uZmlnKTtcbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eRmlsZVVwbG9hZF9XZWJkYXZfLywgY29uZmlndXJlKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGFzeW5jICdzZW5kRmlsZU1lc3NhZ2UnKHJvb21JZCwgc3RvcmUsIGZpbGUsIG1zZ0RhdGEgPSB7fSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzZW5kRmlsZU1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIHJvb21JZCwgTWV0ZW9yLnVzZXJJZCgpKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNoZWNrKG1zZ0RhdGEsIHtcblx0XHRcdGF2YXRhcjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdGVtb2ppOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0YWxpYXM6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRncm91cGFibGU6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXHRcdFx0bXNnOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLnVwZGF0ZUZpbGVDb21wbGV0ZShmaWxlLl9pZCwgTWV0ZW9yLnVzZXJJZCgpLCBfLm9taXQoZmlsZSwgJ19pZCcpKTtcblxuXHRcdGNvbnN0IGZpbGVVcmwgPSBgL2ZpbGUtdXBsb2FkLyR7IGZpbGUuX2lkIH0vJHsgZW5jb2RlVVJJKGZpbGUubmFtZSkgfWA7XG5cblx0XHRjb25zdCBhdHRhY2htZW50ID0ge1xuXHRcdFx0dGl0bGU6IGZpbGUubmFtZSxcblx0XHRcdHR5cGU6ICdmaWxlJyxcblx0XHRcdGRlc2NyaXB0aW9uOiBmaWxlLmRlc2NyaXB0aW9uLFxuXHRcdFx0dGl0bGVfbGluazogZmlsZVVybCxcblx0XHRcdHRpdGxlX2xpbmtfZG93bmxvYWQ6IHRydWVcblx0XHR9O1xuXG5cdFx0aWYgKC9eaW1hZ2VcXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3VybCA9IGZpbGVVcmw7XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3R5cGUgPSBmaWxlLnR5cGU7XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0XHRpZiAoZmlsZS5pZGVudGlmeSAmJiBmaWxlLmlkZW50aWZ5LnNpemUpIHtcblx0XHRcdFx0YXR0YWNobWVudC5pbWFnZV9kaW1lbnNpb25zID0gZmlsZS5pZGVudGlmeS5zaXplO1xuXHRcdFx0fVxuXHRcdFx0YXR0YWNobWVudC5pbWFnZV9wcmV2aWV3ID0gYXdhaXQgRmlsZVVwbG9hZC5yZXNpemVJbWFnZVByZXZpZXcoZmlsZSk7XG5cdFx0fSBlbHNlIGlmICgvXmF1ZGlvXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0YXR0YWNobWVudC5hdWRpb191cmwgPSBmaWxlVXJsO1xuXHRcdFx0YXR0YWNobWVudC5hdWRpb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0YXR0YWNobWVudC5hdWRpb19zaXplID0gZmlsZS5zaXplO1xuXHRcdH0gZWxzZSBpZiAoL152aWRlb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdXJsID0gZmlsZVVybDtcblx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdGF0dGFjaG1lbnQudmlkZW9fc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblx0XHRsZXQgbXNnID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiByb29tSWQsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdG1zZzogJycsXG5cdFx0XHRmaWxlOiB7XG5cdFx0XHRcdF9pZDogZmlsZS5faWQsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0dHlwZTogZmlsZS50eXBlXG5cdFx0XHR9LFxuXHRcdFx0Z3JvdXBhYmxlOiBmYWxzZSxcblx0XHRcdGF0dGFjaG1lbnRzOiBbYXR0YWNobWVudF1cblx0XHR9LCBtc2dEYXRhKTtcblxuXHRcdG1zZyA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIG1zZyk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4gUm9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdhZnRlckZpbGVVcGxvYWQnLCB7IHVzZXIsIHJvb20sIG1lc3NhZ2U6IG1zZyB9KSk7XG5cblx0XHRyZXR1cm4gbXNnO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgVXBsb2FkRlMgKi9cblxubGV0IHByb3RlY3RlZEZpbGVzO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXMnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdHByb3RlY3RlZEZpbGVzID0gdmFsdWU7XG59KTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRTM0ZpbGVVcmwoZmlsZUlkKSB7XG5cdFx0aWYgKHByb3RlY3RlZEZpbGVzICYmICFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ3NlbmRGaWxlTWVzc2FnZScgfSk7XG5cdFx0fVxuXHRcdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKGZpbGVJZCk7XG5cblx0XHRyZXR1cm4gVXBsb2FkRlMuZ2V0U3RvcmUoJ0FtYXpvblMzOlVwbG9hZHMnKS5nZXRSZWRpcmVjdFVSTChmaWxlKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdGaWxlVXBsb2FkJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0VuYWJsZWQnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScsIDIwOTcxNTIsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfTWVkaWFUeXBlV2hpdGVMaXN0JywgJ2ltYWdlLyosYXVkaW8vKix2aWRlby8qLGFwcGxpY2F0aW9uL3ppcCxhcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkLGFwcGxpY2F0aW9uL3BkZix0ZXh0L3BsYWluLGFwcGxpY2F0aW9uL21zd29yZCxhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCcsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRmlsZVVwbG9hZF9NZWRpYVR5cGVXaGl0ZUxpc3REZXNjcmlwdGlvbidcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUHJvdGVjdEZpbGVzJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXNEZXNjcmlwdGlvbidcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJywgJ0dyaWRGUycsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHR2YWx1ZXM6IFt7XG5cdFx0XHRrZXk6ICdHcmlkRlMnLFxuXHRcdFx0aTE4bkxhYmVsOiAnR3JpZEZTJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0FtYXpvblMzJyxcblx0XHRcdGkxOG5MYWJlbDogJ0FtYXpvblMzJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0dvb2dsZUNsb3VkU3RvcmFnZScsXG5cdFx0XHRpMThuTGFiZWw6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0fSwge1xuXHRcdFx0a2V5OiAnV2ViZGF2Jyxcblx0XHRcdGkxOG5MYWJlbDogJ1dlYkRBVidcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdGaWxlU3lzdGVtJyxcblx0XHRcdGkxOG5MYWJlbDogJ0ZpbGVTeXN0ZW0nXG5cdFx0fV0sXG5cdFx0cHVibGljOiB0cnVlXG5cdH0pO1xuXG5cdHRoaXMuc2VjdGlvbignQW1hem9uIFMzJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0FjbCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19BV1NBY2Nlc3NLZXlJZCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19BV1NTZWNyZXRBY2Nlc3NLZXknLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQ0ROJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX1JlZ2lvbicsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19CdWNrZXRVUkwnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnT3ZlcnJpZGVfVVJMX3RvX3doaWNoX2ZpbGVzX2FyZV91cGxvYWRlZF9UaGlzX3VybF9hbHNvX3VzZWRfZm9yX2Rvd25sb2Fkc191bmxlc3NfYV9DRE5faXNfZ2l2ZW4uJ1xuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX1NpZ25hdHVyZVZlcnNpb24nLCAndjQnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19Gb3JjZVBhdGhTdHlsZScsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfVVJMRXhwaXJ5VGltZVNwYW4nLCAxMjAsIHtcblx0XHRcdHR5cGU6ICdpbnQnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fSxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0ZpbGVVcGxvYWRfUzNfVVJMRXhwaXJ5VGltZVNwYW5fRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfUHJveHlfQXZhdGFycycsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfUHJveHlfVXBsb2FkcycsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXG5cdHRoaXMuc2VjdGlvbignR29vZ2xlIENsb3VkIFN0b3JhZ2UnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0J1Y2tldCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHByaXZhdGU6IHRydWUsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQWNjZXNzSWQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRwcml2YXRlOiB0cnVlLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0dvb2dsZUNsb3VkU3RvcmFnZSdcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1NlY3JldCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdG11bHRpbGluZTogdHJ1ZSxcblx0XHRcdHByaXZhdGU6IHRydWUsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfUHJveHlfQXZhdGFycycsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfUHJveHlfVXBsb2FkcycsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLnNlY3Rpb24oJ0ZpbGUgU3lzdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfRmlsZVN5c3RlbVBhdGgnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnRmlsZVN5c3RlbSdcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdXZWJEQVYnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9XZWJkYXZfVXBsb2FkX0ZvbGRlcl9QYXRoJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ1dlYmRhdidcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9XZWJkYXZfU2VydmVyX1VSTCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdXZWJkYXYnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfV2ViZGF2X1VzZXJuYW1lJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ1dlYmRhdidcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9XZWJkYXZfUGFzc3dvcmQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3Bhc3N3b3JkJyxcblx0XHRcdHByaXZhdGU6IHRydWUsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnV2ViZGF2J1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1dlYmRhdl9Qcm94eV9BdmF0YXJzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdXZWJkYXYnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfV2ViZGF2X1Byb3h5X1VwbG9hZHMnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ1dlYmRhdidcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfRW5hYmxlZF9EaXJlY3QnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcbn0pO1xuIiwiaW1wb3J0IHtVcGxvYWRGU30gZnJvbSAnbWV0ZW9yL2phbGlrOnVmcyc7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBTMyBmcm9tICdhd3Mtc2RrL2NsaWVudHMvczMnO1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuXG4vKipcbiAqIEFtYXpvblMzIHN0b3JlXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBBbWF6b25TM1N0b3JlIGV4dGVuZHMgVXBsb2FkRlMuU3RvcmUge1xuXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHQvLyBEZWZhdWx0IG9wdGlvbnNcblx0XHQvLyBvcHRpb25zLnNlY3JldEFjY2Vzc0tleSxcblx0XHQvLyBvcHRpb25zLmFjY2Vzc0tleUlkLFxuXHRcdC8vIG9wdGlvbnMucmVnaW9uLFxuXHRcdC8vIG9wdGlvbnMuc3NsRW5hYmxlZCAvLyBvcHRpb25hbFxuXG5cdFx0b3B0aW9ucyA9IF8uZXh0ZW5kKHtcblx0XHRcdGh0dHBPcHRpb25zOiB7XG5cdFx0XHRcdHRpbWVvdXQ6IDYwMDAsXG5cdFx0XHRcdGFnZW50OiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sIG9wdGlvbnMpO1xuXG5cdFx0c3VwZXIob3B0aW9ucyk7XG5cblx0XHRjb25zdCBjbGFzc09wdGlvbnMgPSBvcHRpb25zO1xuXG5cdFx0Y29uc3QgczMgPSBuZXcgUzMob3B0aW9ucy5jb25uZWN0aW9uKTtcblxuXHRcdG9wdGlvbnMuZ2V0UGF0aCA9IG9wdGlvbnMuZ2V0UGF0aCB8fCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRyZXR1cm4gZmlsZS5faWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UGF0aCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGlmIChmaWxlLkFtYXpvblMzKSB7XG5cdFx0XHRcdHJldHVybiBmaWxlLkFtYXpvblMzLnBhdGg7XG5cdFx0XHR9XG5cdFx0XHQvLyBDb21wYXRpYmlsaXR5XG5cdFx0XHQvLyBUT0RPOiBNaWdyYXRpb25cblx0XHRcdGlmIChmaWxlLnMzKSB7XG5cdFx0XHRcdHJldHVybiBmaWxlLnMzLnBhdGggKyBmaWxlLl9pZDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRSZWRpcmVjdFVSTCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHtcblx0XHRcdFx0S2V5OiB0aGlzLmdldFBhdGgoZmlsZSksXG5cdFx0XHRcdEV4cGlyZXM6IGNsYXNzT3B0aW9ucy5VUkxFeHBpcnlUaW1lU3BhblxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHMzLmdldFNpZ25lZFVybCgnZ2V0T2JqZWN0JywgcGFyYW1zKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlcyB0aGUgZmlsZSBpbiB0aGUgY29sbGVjdGlvblxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICogQHJldHVybiB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNoZWNrKGZpbGUsIE9iamVjdCk7XG5cblx0XHRcdGlmIChmaWxlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHRcdGZpbGUuX2lkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZpbGUuQW1hem9uUzMgPSB7XG5cdFx0XHRcdHBhdGg6IHRoaXMub3B0aW9ucy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRmaWxlLnN0b3JlID0gdGhpcy5vcHRpb25zLm5hbWU7IC8vIGFzc2lnbiBzdG9yZSB0byBmaWxlXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRDb2xsZWN0aW9uKCkuaW5zZXJ0KGZpbGUsIGNhbGxiYWNrKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlcyB0aGUgZmlsZVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKi9cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKGZpbGVJZCwgY2FsbGJhY2spIHtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xuXHRcdFx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdFx0XHRLZXk6IHRoaXMuZ2V0UGF0aChmaWxlKVxuXHRcdFx0fTtcblxuXHRcdFx0czMuZGVsZXRlT2JqZWN0KHBhcmFtcywgKGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBkYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHJlYWQgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0UmVhZFN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZSwgb3B0aW9ucyA9IHt9KSB7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7XG5cdFx0XHRcdEtleTogdGhpcy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAob3B0aW9ucy5zdGFydCAmJiBvcHRpb25zLmVuZCkge1xuXHRcdFx0XHRwYXJhbXMuUmFuZ2UgPSBgJHsgb3B0aW9ucy5zdGFydCB9IC0gJHsgb3B0aW9ucy5lbmQgfWA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzMy5nZXRPYmplY3QocGFyYW1zKS5jcmVhdGVSZWFkU3RyZWFtKCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbihmaWxlSWQsIGZpbGUvKiwgb3B0aW9ucyovKSB7XG5cdFx0XHRjb25zdCB3cml0ZVN0cmVhbSA9IG5ldyBzdHJlYW0uUGFzc1Rocm91Z2goKTtcblx0XHRcdHdyaXRlU3RyZWFtLmxlbmd0aCA9IGZpbGUuc2l6ZTtcblxuXHRcdFx0d3JpdGVTdHJlYW0ub24oJ25ld0xpc3RlbmVyJywgKGV2ZW50LCBsaXN0ZW5lcikgPT4ge1xuXHRcdFx0XHRpZiAoZXZlbnQgPT09ICdmaW5pc2gnKSB7XG5cdFx0XHRcdFx0cHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpO1xuXHRcdFx0XHRcdFx0d3JpdGVTdHJlYW0ub24oJ3JlYWxfZmluaXNoJywgbGlzdGVuZXIpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0czMucHV0T2JqZWN0KHtcblx0XHRcdFx0S2V5OiB0aGlzLmdldFBhdGgoZmlsZSksXG5cdFx0XHRcdEJvZHk6IHdyaXRlU3RyZWFtLFxuXHRcdFx0XHRDb250ZW50VHlwZTogZmlsZS50eXBlLFxuXHRcdFx0XHRDb250ZW50RGlzcG9zaXRpb246IGBpbmxpbmU7IGZpbGVuYW1lPVwiJHsgZW5jb2RlVVJJKGZpbGUubmFtZSkgfVwiYFxuXG5cdFx0XHR9LCAoZXJyb3IpID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3cml0ZVN0cmVhbS5lbWl0KCdyZWFsX2ZpbmlzaCcpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB3cml0ZVN0cmVhbTtcblx0XHR9O1xuXHR9XG59XG5cbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXG5VcGxvYWRGUy5zdG9yZS5BbWF6b25TMyA9IEFtYXpvblMzU3RvcmU7XG4iLCJpbXBvcnQge1VwbG9hZEZTfSBmcm9tICdtZXRlb3IvamFsaWs6dWZzJztcbmltcG9ydCBnY1N0b3JhZ2UgZnJvbSAnQGdvb2dsZS1jbG91ZC9zdG9yYWdlJztcblxuLyoqXG4gKiBHb29nbGVTdG9yYWdlIHN0b3JlXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBHb29nbGVTdG9yYWdlU3RvcmUgZXh0ZW5kcyBVcGxvYWRGUy5TdG9yZSB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKG9wdGlvbnMpO1xuXG5cdFx0Y29uc3QgZ2NzID0gZ2NTdG9yYWdlKG9wdGlvbnMuY29ubmVjdGlvbik7XG5cdFx0dGhpcy5idWNrZXQgPSBnY3MuYnVja2V0KG9wdGlvbnMuYnVja2V0KTtcblxuXHRcdG9wdGlvbnMuZ2V0UGF0aCA9IG9wdGlvbnMuZ2V0UGF0aCB8fCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRyZXR1cm4gZmlsZS5faWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UGF0aCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGlmIChmaWxlLkdvb2dsZVN0b3JhZ2UpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuR29vZ2xlU3RvcmFnZS5wYXRoO1xuXHRcdFx0fVxuXHRcdFx0Ly8gQ29tcGF0aWJpbGl0eVxuXHRcdFx0Ly8gVE9ETzogTWlncmF0aW9uXG5cdFx0XHRpZiAoZmlsZS5nb29nbGVDbG91ZFN0b3JhZ2UpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuZ29vZ2xlQ2xvdWRTdG9yYWdlLnBhdGggKyBmaWxlLl9pZDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRSZWRpcmVjdFVSTCA9IGZ1bmN0aW9uKGZpbGUsIGNhbGxiYWNrKSB7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7XG5cdFx0XHRcdGFjdGlvbjogJ3JlYWQnLFxuXHRcdFx0XHRyZXNwb25zZURpc3Bvc2l0aW9uOiAnaW5saW5lJyxcblx0XHRcdFx0ZXhwaXJlczogRGF0ZS5ub3coKSt0aGlzLm9wdGlvbnMuVVJMRXhwaXJ5VGltZVNwYW4qMTAwMFxuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5idWNrZXQuZmlsZSh0aGlzLmdldFBhdGgoZmlsZSkpLmdldFNpZ25lZFVybChwYXJhbXMsIGNhbGxiYWNrKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlcyB0aGUgZmlsZSBpbiB0aGUgY29sbGVjdGlvblxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICogQHJldHVybiB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNoZWNrKGZpbGUsIE9iamVjdCk7XG5cblx0XHRcdGlmIChmaWxlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHRcdGZpbGUuX2lkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZpbGUuR29vZ2xlU3RvcmFnZSA9IHtcblx0XHRcdFx0cGF0aDogdGhpcy5vcHRpb25zLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGZpbGUuc3RvcmUgPSB0aGlzLm9wdGlvbnMubmFtZTsgLy8gYXNzaWduIHN0b3JlIHRvIGZpbGVcblx0XHRcdHJldHVybiB0aGlzLmdldENvbGxlY3Rpb24oKS5pbnNlcnQoZmlsZSwgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmVzIHRoZSBmaWxlXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBjYWxsYmFja1xuXHRcdCAqL1xuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oZmlsZUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XG5cdFx0XHR0aGlzLmJ1Y2tldC5maWxlKHRoaXMuZ2V0UGF0aChmaWxlKSkuZGVsZXRlKGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBkYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHJlYWQgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0UmVhZFN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZSwgb3B0aW9ucyA9IHt9KSB7XG5cdFx0XHRjb25zdCBjb25maWcgPSB7fTtcblxuXHRcdFx0aWYgKG9wdGlvbnMuc3RhcnQgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25maWcuc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAob3B0aW9ucy5lbmQgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25maWcuZW5kID0gb3B0aW9ucy5lbmQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzLmJ1Y2tldC5maWxlKHRoaXMuZ2V0UGF0aChmaWxlKSkuY3JlYXRlUmVhZFN0cmVhbShjb25maWcpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHdyaXRlIHN0cmVhbVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gZmlsZVxuXHRcdCAqIEBwYXJhbSBvcHRpb25zXG5cdFx0ICogQHJldHVybiB7Kn1cblx0XHQgKi9cblx0XHR0aGlzLmdldFdyaXRlU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLyosIG9wdGlvbnMqLykge1xuXHRcdFx0cmV0dXJuIHRoaXMuYnVja2V0LmZpbGUodGhpcy5nZXRQYXRoKGZpbGUpKS5jcmVhdGVXcml0ZVN0cmVhbSh7XG5cdFx0XHRcdGd6aXA6IGZhbHNlLFxuXHRcdFx0XHRtZXRhZGF0YToge1xuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiBmaWxlLnR5cGUsXG5cdFx0XHRcdFx0Y29udGVudERpc3Bvc2l0aW9uOiBgaW5saW5lOyBmaWxlbmFtZT0keyBmaWxlLm5hbWUgfWBcblx0XHRcdFx0XHQvLyBtZXRhZGF0YToge1xuXHRcdFx0XHRcdC8vIFx0Y3VzdG9tOiAnbWV0YWRhdGEnXG5cdFx0XHRcdFx0Ly8gfVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XG59XG5cbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXG5VcGxvYWRGUy5zdG9yZS5Hb29nbGVTdG9yYWdlID0gR29vZ2xlU3RvcmFnZVN0b3JlO1xuIiwiaW1wb3J0IHtVcGxvYWRGU30gZnJvbSAnbWV0ZW9yL2phbGlrOnVmcyc7XG5pbXBvcnQgV2ViZGF2IGZyb20gJ3dlYmRhdic7XG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG4vKipcbiAqIFdlYkRBViBzdG9yZVxuICogQHBhcmFtIG9wdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5leHBvcnQgY2xhc3MgV2ViZGF2U3RvcmUgZXh0ZW5kcyBVcGxvYWRGUy5TdG9yZSB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXG5cdFx0c3VwZXIob3B0aW9ucyk7XG5cblxuXHRcdGNvbnN0IGNsaWVudCA9IG5ldyBXZWJkYXYoXG5cdFx0XHRvcHRpb25zLmNvbm5lY3Rpb24uY3JlZGVudGlhbHMuc2VydmVyLFxuXHRcdFx0b3B0aW9ucy5jb25uZWN0aW9uLmNyZWRlbnRpYWxzLnVzZXJuYW1lLFxuXHRcdFx0b3B0aW9ucy5jb25uZWN0aW9uLmNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuXHRcdCk7XG5cblx0XHRvcHRpb25zLmdldFBhdGggPSBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRpZiAob3B0aW9ucy51cGxvYWRGb2xkZXJQYXRoW29wdGlvbnMudXBsb2FkRm9sZGVyUGF0aC5sZW5ndGgtMV0gIT09ICcvJykge1xuXHRcdFx0XHRvcHRpb25zLnVwbG9hZEZvbGRlclBhdGggKz0gJy8nO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG9wdGlvbnMudXBsb2FkRm9sZGVyUGF0aCArIGZpbGUuX2lkO1xuXHRcdH07XG5cblx0XHRjbGllbnQuc3RhdChvcHRpb25zLnVwbG9hZEZvbGRlclBhdGgpLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuXHRcdFx0aWYgKGVyci5zdGF0dXMgPT09ICc0MDQnKSB7XG5cdFx0XHRcdGNsaWVudC5jcmVhdGVEaXJlY3Rvcnkob3B0aW9ucy51cGxvYWRGb2xkZXJQYXRoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgcGF0aFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHJldHVybiB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0UGF0aCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGlmIChmaWxlLldlYmRhdikge1xuXHRcdFx0XHRyZXR1cm4gZmlsZS5XZWJkYXYucGF0aDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlcyB0aGUgZmlsZSBpbiB0aGUgY29sIGxlY3Rpb25cblx0XHQgKiBAcGFyYW0gZmlsZVxuXHRcdCAqIEBwYXJhbSBjYWxsYmFja1xuXHRcdCAqIEByZXR1cm4ge3N0cmluZ31cblx0XHQgKi9cblx0XHR0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKGZpbGUsIGNhbGxiYWNrKSB7XG5cdFx0XHRjaGVjayhmaWxlLCBPYmplY3QpO1xuXG5cdFx0XHRpZiAoZmlsZS5faWQgPT0gbnVsbCkge1xuXHRcdFx0XHRmaWxlLl9pZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmaWxlLldlYmRhdiA9IHtcblx0XHRcdFx0cGF0aDogb3B0aW9ucy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRmaWxlLnN0b3JlID0gdGhpcy5vcHRpb25zLm5hbWU7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRDb2xsZWN0aW9uKCkuaW5zZXJ0KGZpbGUsIGNhbGxiYWNrKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlcyB0aGUgZmlsZVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKi9cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKGZpbGVJZCwgY2FsbGJhY2spIHtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xuXHRcdFx0Y2xpZW50LmRlbGV0ZUZpbGUodGhpcy5nZXRQYXRoKGZpbGUpLCAoZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIGRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgcmVhZCBzdHJlYW1cblx0XHQgKiBAcGFyYW0gZmlsZUlkXG5cdFx0ICogQHBhcmFtIGZpbGVcblx0XHQgKiBAcGFyYW0gb3B0aW9uc1xuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRSZWFkU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLCBvcHRpb25zID0ge30pIHtcblx0XHRcdGNvbnN0IHJhbmdlID0ge307XG5cblx0XHRcdGlmIChvcHRpb25zLnN0YXJ0ICE9IG51bGwpIHtcblx0XHRcdFx0cmFuZ2Uuc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAob3B0aW9ucy5lbmQgIT0gbnVsbCkge1xuXHRcdFx0XHRyYW5nZS5lbmQgPSBvcHRpb25zLmVuZDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBjbGllbnQuY3JlYXRlUmVhZFN0cmVhbSh0aGlzLmdldFBhdGgoZmlsZSksIG9wdGlvbnMpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHdyaXRlIHN0cmVhbVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gZmlsZVxuXHRcdCAqIEByZXR1cm4geyp9XG5cdFx0ICovXG5cdFx0dGhpcy5nZXRXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZSkge1xuXHRcdFx0Y29uc3Qgd3JpdGVTdHJlYW0gPSBuZXcgc3RyZWFtLlBhc3NUaHJvdWdoKCk7XG5cdFx0XHRjb25zdCB3ZWJkYXZTdHJlYW0gPSBjbGllbnQuY3JlYXRlV3JpdGVTdHJlYW0odGhpcy5nZXRQYXRoKGZpbGUpKTtcblxuXHRcdFx0Ly9UT0RPIHJlbW92ZSB0aW1lb3V0IHdoZW4gVXBsb2FkRlMgYnVnIHJlc29sdmVkXG5cdFx0XHRjb25zdCBuZXdMaXN0ZW5lckNhbGxiYWNrID0gKGV2ZW50LCBsaXN0ZW5lcikgPT4ge1xuXHRcdFx0XHRpZiAoZXZlbnQgPT09ICdmaW5pc2gnKSB7XG5cdFx0XHRcdFx0cHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpO1xuXHRcdFx0XHRcdFx0d3JpdGVTdHJlYW0ucmVtb3ZlTGlzdGVuZXIoJ25ld0xpc3RlbmVyJywgbmV3TGlzdGVuZXJDYWxsYmFjayk7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5vbihldmVudCwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQobGlzdGVuZXIsIDUwMCk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdHdyaXRlU3RyZWFtLm9uKCduZXdMaXN0ZW5lcicsIG5ld0xpc3RlbmVyQ2FsbGJhY2spO1xuXG5cdFx0XHR3cml0ZVN0cmVhbS5waXBlKHdlYmRhdlN0cmVhbSk7XG5cdFx0XHRyZXR1cm4gd3JpdGVTdHJlYW07XG5cdFx0fTtcblxuXHR9XG59XG5cbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXG5VcGxvYWRGUy5zdG9yZS5XZWJkYXYgPSBXZWJkYXZTdG9yZTtcbiJdfQ==
