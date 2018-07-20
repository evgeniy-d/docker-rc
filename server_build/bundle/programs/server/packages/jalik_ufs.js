(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var extension, options, path;

var require = meteorInstall({"node_modules":{"meteor":{"jalik:ufs":{"ufs.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs.js                                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
const module1 = module;
module1.export({
  UploadFS: () => UploadFS
});

let _;

module1.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module1.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Mongo;
module1.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 2);
let MIME;
module1.watch(require("./ufs-mime"), {
  MIME(v) {
    MIME = v;
  }

}, 3);
let Random;
module1.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 4);
let Tokens;
module1.watch(require("./ufs-tokens"), {
  Tokens(v) {
    Tokens = v;
  }

}, 5);
let Config;
module1.watch(require("./ufs-config"), {
  Config(v) {
    Config = v;
  }

}, 6);
let Filter;
module1.watch(require("./ufs-filter"), {
  Filter(v) {
    Filter = v;
  }

}, 7);
let Store;
module1.watch(require("./ufs-store"), {
  Store(v) {
    Store = v;
  }

}, 8);
let StorePermissions;
module1.watch(require("./ufs-store-permissions"), {
  StorePermissions(v) {
    StorePermissions = v;
  }

}, 9);
let Uploader;
module1.watch(require("./ufs-uploader"), {
  Uploader(v) {
    Uploader = v;
  }

}, 10);
let stores = {};
const UploadFS = {
  /**
   * Contains all stores
   */
  store: {},

  /**
   * Collection of tokens
   */
  tokens: Tokens,

  /**
   * Adds the "etag" attribute to files
   * @param where
   */
  addETagAttributeToFiles(where) {
    _.each(this.getStores(), store => {
      const files = store.getCollection(); // By default update only files with no path set

      files.find(where || {
        etag: null
      }, {
        fields: {
          _id: 1
        }
      }).forEach(file => {
        files.direct.update(file._id, {
          $set: {
            etag: this.generateEtag()
          }
        });
      });
    });
  },

  /**
   * Adds the MIME type for an extension
   * @param extension
   * @param mime
   */
  addMimeType(extension, mime) {
    MIME[extension.toLowerCase()] = mime;
  },

  /**
   * Adds the "path" attribute to files
   * @param where
   */
  addPathAttributeToFiles(where) {
    _.each(this.getStores(), store => {
      const files = store.getCollection(); // By default update only files with no path set

      files.find(where || {
        path: null
      }, {
        fields: {
          _id: 1
        }
      }).forEach(file => {
        files.direct.update(file._id, {
          $set: {
            path: store.getFileRelativeURL(file._id)
          }
        });
      });
    });
  },

  /**
   * Registers the store
   * @param store
   */
  addStore(store) {
    if (!(store instanceof Store)) {
      throw new TypeError(`ufs: store is not an instance of UploadFS.Store.`);
    }

    stores[store.getName()] = store;
  },

  /**
   * Generates a unique ETag
   * @return {string}
   */
  generateEtag() {
    return Random.id();
  },

  /**
   * Returns the MIME type of the extension
   * @param extension
   * @returns {*}
   */
  getMimeType(extension) {
    extension = extension.toLowerCase();
    return MIME[extension];
  },

  /**
   * Returns all MIME types
   */
  getMimeTypes() {
    return MIME;
  },

  /**
   * Returns the store by its name
   * @param name
   * @return {UploadFS.Store}
   */
  getStore(name) {
    return stores[name];
  },

  /**
   * Returns all stores
   * @return {object}
   */
  getStores() {
    return stores;
  },

  /**
   * Returns the temporary file path
   * @param fileId
   * @return {string}
   */
  getTempFilePath(fileId) {
    return `${this.config.tmpDir}/${fileId}`;
  },

  /**
   * Imports a file from a URL
   * @param url
   * @param file
   * @param store
   * @param callback
   */
  importFromURL(url, file, store, callback) {
    if (typeof store === 'string') {
      Meteor.call('ufsImportURL', url, file, store, callback);
    } else if (typeof store === 'object') {
      store.importFromURL(url, file, callback);
    }
  },

  /**
   * Returns file and data as ArrayBuffer for each files in the event
   * @deprecated
   * @param event
   * @param callback
   */
  readAsArrayBuffer(event, callback) {
    console.error('UploadFS.readAsArrayBuffer is deprecated, see https://github.com/jalik/jalik-ufs#uploading-from-a-file');
  },

  /**
   * Opens a dialog to select a single file
   * @param callback
   */
  selectFile(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;

    input.onchange = ev => {
      let files = ev.target.files;
      callback.call(UploadFS, files[0]);
    }; // Fix for iOS/Safari


    const div = document.createElement('div');
    div.className = 'ufs-file-selector';
    div.style = 'display:none; height:0; width:0; overflow: hidden;';
    div.appendChild(input);
    document.body.appendChild(div); // Trigger file selection

    input.click();
  },

  /**
   * Opens a dialog to select multiple files
   * @param callback
   */
  selectFiles(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = ev => {
      const files = ev.target.files;

      for (let i = 0; i < files.length; i += 1) {
        callback.call(UploadFS, files[i]);
      }
    }; // Fix for iOS/Safari


    const div = document.createElement('div');
    div.className = 'ufs-file-selector';
    div.style = 'display:none; height:0; width:0; overflow: hidden;';
    div.appendChild(input);
    document.body.appendChild(div); // Trigger file selection

    input.click();
  }

};

if (Meteor.isClient) {
  require('./ufs-template-helpers');
}

if (Meteor.isServer) {
  require('./ufs-methods');

  require('./ufs-server');
}
/**
 * UploadFS Configuration
 * @type {Config}
 */


UploadFS.config = new Config(); // Add classes to global namespace

UploadFS.Config = Config;
UploadFS.Filter = Filter;
UploadFS.Store = Store;
UploadFS.StorePermissions = StorePermissions;
UploadFS.Uploader = Uploader;

if (Meteor.isServer) {
  // Expose the module globally
  if (typeof global !== 'undefined') {
    global['UploadFS'] = UploadFS;
  }
} else if (Meteor.isClient) {
  // Expose the module globally
  if (typeof window !== 'undefined') {
    window.UploadFS = UploadFS;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-config.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-config.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Config: () => Config
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let StorePermissions;
module.watch(require("./ufs-store-permissions"), {
  StorePermissions(v) {
    StorePermissions = v;
  }

}, 2);

class Config {
  constructor(options) {
    // Default options
    options = _.extend({
      defaultStorePermissions: null,
      https: false,
      simulateReadDelay: 0,
      simulateUploadSpeed: 0,
      simulateWriteDelay: 0,
      storesPath: 'ufs',
      tmpDir: '/tmp/ufs',
      tmpDirPermissions: '0700'
    }, options); // Check options

    if (options.defaultStorePermissions && !(options.defaultStorePermissions instanceof StorePermissions)) {
      throw new TypeError('Config: defaultStorePermissions is not an instance of StorePermissions');
    }

    if (typeof options.https !== 'boolean') {
      throw new TypeError('Config: https is not a function');
    }

    if (typeof options.simulateReadDelay !== 'number') {
      throw new TypeError('Config: simulateReadDelay is not a number');
    }

    if (typeof options.simulateUploadSpeed !== 'number') {
      throw new TypeError('Config: simulateUploadSpeed is not a number');
    }

    if (typeof options.simulateWriteDelay !== 'number') {
      throw new TypeError('Config: simulateWriteDelay is not a number');
    }

    if (typeof options.storesPath !== 'string') {
      throw new TypeError('Config: storesPath is not a string');
    }

    if (typeof options.tmpDir !== 'string') {
      throw new TypeError('Config: tmpDir is not a string');
    }

    if (typeof options.tmpDirPermissions !== 'string') {
      throw new TypeError('Config: tmpDirPermissions is not a string');
    }
    /**
     * Default store permissions
     * @type {UploadFS.StorePermissions}
     */


    this.defaultStorePermissions = options.defaultStorePermissions;
    /**
     * Use or not secured protocol in URLS
     * @type {boolean}
     */

    this.https = options.https;
    /**
     * The simulation read delay
     * @type {Number}
     */

    this.simulateReadDelay = parseInt(options.simulateReadDelay);
    /**
     * The simulation upload speed
     * @type {Number}
     */

    this.simulateUploadSpeed = parseInt(options.simulateUploadSpeed);
    /**
     * The simulation write delay
     * @type {Number}
     */

    this.simulateWriteDelay = parseInt(options.simulateWriteDelay);
    /**
     * The URL root path of stores
     * @type {string}
     */

    this.storesPath = options.storesPath;
    /**
     * The temporary directory of uploading files
     * @type {string}
     */

    this.tmpDir = options.tmpDir;
    /**
     * The permissions of the temporary directory
     * @type {string}
     */

    this.tmpDirPermissions = options.tmpDirPermissions;
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-filter.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-filter.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Filter: () => Filter
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);

class Filter {
  constructor(options) {
    const self = this; // Default options

    options = _.extend({
      contentTypes: null,
      extensions: null,
      minSize: 1,
      maxSize: 0,
      onCheck: this.onCheck
    }, options); // Check options

    if (options.contentTypes && !(options.contentTypes instanceof Array)) {
      throw new TypeError("Filter: contentTypes is not an Array");
    }

    if (options.extensions && !(options.extensions instanceof Array)) {
      throw new TypeError("Filter: extensions is not an Array");
    }

    if (typeof options.minSize !== "number") {
      throw new TypeError("Filter: minSize is not a number");
    }

    if (typeof options.maxSize !== "number") {
      throw new TypeError("Filter: maxSize is not a number");
    }

    if (options.onCheck && typeof options.onCheck !== "function") {
      throw new TypeError("Filter: onCheck is not a function");
    } // Public attributes


    self.options = options;

    _.each(['onCheck'], method => {
      if (typeof options[method] === 'function') {
        self[method] = options[method];
      }
    });
  }
  /**
   * Checks the file
   * @param file
   */


  check(file) {
    if (typeof file !== "object" || !file) {
      throw new Meteor.Error('invalid-file', "File is not valid");
    } // Check size


    if (file.size <= 0 || file.size < this.getMinSize()) {
      throw new Meteor.Error('file-too-small', `File size is too small (min = ${this.getMinSize()})`);
    }

    if (this.getMaxSize() > 0 && file.size > this.getMaxSize()) {
      throw new Meteor.Error('file-too-large', `File size is too large (max = ${this.getMaxSize()})`);
    } // Check extension


    if (this.getExtensions() && !_.contains(this.getExtensions(), file.extension)) {
      throw new Meteor.Error('invalid-file-extension', `File extension "${file.extension}" is not accepted`);
    } // Check content type


    if (this.getContentTypes() && !this.isContentTypeInList(file.type, this.getContentTypes())) {
      throw new Meteor.Error('invalid-file-type', `File type "${file.type}" is not accepted`);
    } // Apply custom check


    if (typeof this.onCheck === 'function' && !this.onCheck(file)) {
      throw new Meteor.Error('invalid-file', "File does not match filter");
    }
  }
  /**
   * Returns the allowed content types
   * @return {Array}
   */


  getContentTypes() {
    return this.options.contentTypes;
  }
  /**
   * Returns the allowed extensions
   * @return {Array}
   */


  getExtensions() {
    return this.options.extensions;
  }
  /**
   * Returns the maximum file size
   * @return {Number}
   */


  getMaxSize() {
    return this.options.maxSize;
  }
  /**
   * Returns the minimum file size
   * @return {Number}
   */


  getMinSize() {
    return this.options.minSize;
  }
  /**
   * Checks if content type is in the given list
   * @param type
   * @param list
   * @return {boolean}
   */


  isContentTypeInList(type, list) {
    if (typeof type === 'string' && list instanceof Array) {
      if (_.contains(list, type)) {
        return true;
      } else {
        let wildCardGlob = '/*';

        let wildcards = _.filter(list, item => {
          return item.indexOf(wildCardGlob) > 0;
        });

        if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
          return true;
        }
      }
    }

    return false;
  }
  /**
   * Checks if the file matches filter
   * @param file
   * @return {boolean}
   */


  isValid(file) {
    let result = true;

    try {
      this.check(file);
    } catch (err) {
      result = false;
    }

    return result;
  }
  /**
   * Executes custom checks
   * @param file
   * @return {boolean}
   */


  onCheck(file) {
    return true;
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-methods.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-methods.js                                                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 1);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let UploadFS;
module.watch(require("./ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 3);
let Filter;
module.watch(require("./ufs-filter"), {
  Filter(v) {
    Filter = v;
  }

}, 4);
let Tokens;
module.watch(require("./ufs-tokens"), {
  Tokens(v) {
    Tokens = v;
  }

}, 5);

const fs = Npm.require('fs');

const http = Npm.require('http');

const https = Npm.require('https');

const Future = Npm.require('fibers/future');

if (Meteor.isServer) {
  Meteor.methods({
    /**
     * Completes the file transfer
     * @param fileId
     * @param storeName
     * @param token
     */
    ufsComplete(fileId, storeName, token) {
      check(fileId, String);
      check(storeName, String);
      check(token, String); // Get store

      let store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Check token


      if (!store.checkToken(token, fileId)) {
        throw new Meteor.Error('invalid-token', "Token is not valid");
      }

      let fut = new Future();
      let tmpFile = UploadFS.getTempFilePath(fileId);

      const removeTempFile = function () {
        fs.unlink(tmpFile, function (err) {
          err && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err.message})`);
        });
      };

      try {
        // todo check if temp file exists
        // Get file
        let file = store.getCollection().findOne({
          _id: fileId
        }); // Validate file before moving to the store

        store.validate(file); // Get the temp file

        let rs = fs.createReadStream(tmpFile, {
          flags: 'r',
          encoding: null,
          autoClose: true
        }); // Clean upload if error occurs

        rs.on('error', Meteor.bindEnvironment(function (err) {
          console.error(err);
          store.getCollection().remove({
            _id: fileId
          });
          fut.throw(err);
        })); // Save file in the store

        store.write(rs, fileId, Meteor.bindEnvironment(function (err, file) {
          removeTempFile();

          if (err) {
            fut.throw(err);
          } else {
            // File has been fully uploaded
            // so we don't need to keep the token anymore.
            // Also this ensure that the file cannot be modified with extra chunks later.
            Tokens.remove({
              fileId: fileId
            });
            fut.return(file);
          }
        }));
      } catch (err) {
        // If write failed, remove the file
        store.getCollection().remove({
          _id: fileId
        }); // removeTempFile(); // todo remove temp file on error or try again ?

        fut.throw(err);
      }

      return fut.wait();
    },

    /**
     * Creates the file and returns the file upload token
     * @param file
     * @return {{fileId: string, token: *, url: *}}
     */
    ufsCreate(file) {
      check(file, Object);

      if (typeof file.name !== 'string' || !file.name.length) {
        throw new Meteor.Error('invalid-file-name', "file name is not valid");
      }

      if (typeof file.store !== 'string' || !file.store.length) {
        throw new Meteor.Error('invalid-store', "store is not valid");
      } // Get store


      let store = UploadFS.getStore(file.store);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Set default info


      file.complete = false;
      file.uploading = false;
      file.extension = file.name && file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2).toLowerCase(); // Assign file MIME type based on the extension

      if (file.extension && !file.type) {
        file.type = UploadFS.getMimeType(file.extension) || 'application/octet-stream';
      }

      file.progress = 0;
      file.size = parseInt(file.size) || 0;
      file.userId = file.userId || this.userId; // Check if the file matches store filter

      let filter = store.getFilter();

      if (filter instanceof Filter) {
        filter.check(file);
      } // Create the file


      let fileId = store.create(file);
      let token = store.createToken(fileId);
      let uploadUrl = store.getURL(`${fileId}?token=${token}`);
      return {
        fileId: fileId,
        token: token,
        url: uploadUrl
      };
    },

    /**
     * Deletes a file
     * @param fileId
     * @param storeName
     * @param token
     * @returns {*}
     */
    ufsDelete(fileId, storeName, token) {
      check(fileId, String);
      check(storeName, String);
      check(token, String); // Check store

      let store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Ignore files that does not exist


      if (store.getCollection().find({
        _id: fileId
      }).count() === 0) {
        return 1;
      } // Check token


      if (!store.checkToken(token, fileId)) {
        throw new Meteor.Error('invalid-token', "Token is not valid");
      }

      return store.getCollection().remove({
        _id: fileId
      });
    },

    /**
     * Imports a file from the URL
     * @param url
     * @param file
     * @param storeName
     * @return {*}
     */
    ufsImportURL(url, file, storeName) {
      check(url, String);
      check(file, Object);
      check(storeName, String); // Check URL

      if (typeof url !== 'string' || url.length <= 0) {
        throw new Meteor.Error('invalid-url', "The url is not valid");
      } // Check file


      if (typeof file !== 'object' || file === null) {
        throw new Meteor.Error('invalid-file', "The file is not valid");
      } // Check store


      const store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', 'The store does not exist');
      } // Extract file info


      if (!file.name) {
        file.name = url.replace(/\?.*$/, '').split('/').pop();
      }

      if (file.name && !file.extension) {
        file.extension = file.name && file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2).toLowerCase();
      }

      if (file.extension && !file.type) {
        // Assign file MIME type based on the extension
        file.type = UploadFS.getMimeType(file.extension) || 'application/octet-stream';
      } // Check if file is valid


      if (store.getFilter() instanceof Filter) {
        store.getFilter().check(file);
      }

      if (file.originalUrl) {
        console.warn(`ufs: The "originalUrl" attribute is automatically set when importing a file from a URL`);
      } // Add original URL


      file.originalUrl = url; // Create the file

      file.complete = false;
      file.uploading = true;
      file.progress = 0;
      file._id = store.create(file);
      let fut = new Future();
      let proto; // Detect protocol to use

      if (/http:\/\//i.test(url)) {
        proto = http;
      } else if (/https:\/\//i.test(url)) {
        proto = https;
      }

      this.unblock(); // Download file

      proto.get(url, Meteor.bindEnvironment(function (res) {
        // Save the file in the store
        store.write(res, file._id, function (err, file) {
          if (err) {
            fut.throw(err);
          } else {
            fut.return(file);
          }
        });
      })).on('error', function (err) {
        fut.throw(err);
      });
      return fut.wait();
    },

    /**
     * Marks the file uploading as stopped
     * @param fileId
     * @param storeName
     * @param token
     * @returns {*}
     */
    ufsStop(fileId, storeName, token) {
      check(fileId, String);
      check(storeName, String);
      check(token, String); // Check store

      const store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Check file


      const file = store.getCollection().find({
        _id: fileId
      }, {
        fields: {
          userId: 1
        }
      });

      if (!file) {
        throw new Meteor.Error('invalid-file', "File not found");
      } // Check token


      if (!store.checkToken(token, fileId)) {
        throw new Meteor.Error('invalid-token', "Token is not valid");
      }

      return store.getCollection().update({
        _id: fileId
      }, {
        $set: {
          uploading: false
        }
      });
    }

  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-mime.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-mime.js                                                                                //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  MIME: () => MIME
});
const MIME = {
  // application
  '7z': 'application/x-7z-compressed',
  'arc': 'application/octet-stream',
  'ai': 'application/postscript',
  'bin': 'application/octet-stream',
  'bz': 'application/x-bzip',
  'bz2': 'application/x-bzip2',
  'eps': 'application/postscript',
  'exe': 'application/octet-stream',
  'gz': 'application/x-gzip',
  'gzip': 'application/x-gzip',
  'js': 'application/javascript',
  'json': 'application/json',
  'ogx': 'application/ogg',
  'pdf': 'application/pdf',
  'ps': 'application/postscript',
  'psd': 'application/octet-stream',
  'rar': 'application/x-rar-compressed',
  'rev': 'application/x-rar-compressed',
  'swf': 'application/x-shockwave-flash',
  'tar': 'application/x-tar',
  'xhtml': 'application/xhtml+xml',
  'xml': 'application/xml',
  'zip': 'application/zip',
  // audio
  'aif': 'audio/aiff',
  'aifc': 'audio/aiff',
  'aiff': 'audio/aiff',
  'au': 'audio/basic',
  'flac': 'audio/flac',
  'midi': 'audio/midi',
  'mp2': 'audio/mpeg',
  'mp3': 'audio/mpeg',
  'mpa': 'audio/mpeg',
  'oga': 'audio/ogg',
  'ogg': 'audio/ogg',
  'opus': 'audio/ogg',
  'ra': 'audio/vnd.rn-realaudio',
  'spx': 'audio/ogg',
  'wav': 'audio/x-wav',
  'weba': 'audio/webm',
  'wma': 'audio/x-ms-wma',
  // image
  'avs': 'image/avs-video',
  'bmp': 'image/x-windows-bmp',
  'gif': 'image/gif',
  'ico': 'image/vnd.microsoft.icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpg',
  'mjpg': 'image/x-motion-jpeg',
  'pic': 'image/pic',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  // text
  'css': 'text/css',
  'csv': 'text/csv',
  'html': 'text/html',
  'txt': 'text/plain',
  // video
  'avi': 'video/avi',
  'dv': 'video/x-dv',
  'flv': 'video/x-flv',
  'mov': 'video/quicktime',
  'mp4': 'video/mp4',
  'mpeg': 'video/mpeg',
  'mpg': 'video/mpg',
  'ogv': 'video/ogg',
  'vdo': 'video/vdo',
  'webm': 'video/webm',
  'wmv': 'video/x-ms-wmv',
  // specific to vendors
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'odb': 'application/vnd.oasis.opendocument.database',
  'odc': 'application/vnd.oasis.opendocument.chart',
  'odf': 'application/vnd.oasis.opendocument.formula',
  'odg': 'application/vnd.oasis.opendocument.graphics',
  'odi': 'application/vnd.oasis.opendocument.image',
  'odm': 'application/vnd.oasis.opendocument.text-master',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odt': 'application/vnd.oasis.opendocument.text',
  'otg': 'application/vnd.oasis.opendocument.graphics-template',
  'otp': 'application/vnd.oasis.opendocument.presentation-template',
  'ots': 'application/vnd.oasis.opendocument.spreadsheet-template',
  'ott': 'application/vnd.oasis.opendocument.text-template',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-server.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 2);
let UploadFS;
module.watch(require("./ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 3);

if (Meteor.isServer) {
  const domain = Npm.require('domain');

  const fs = Npm.require('fs');

  const http = Npm.require('http');

  const https = Npm.require('https');

  const mkdirp = Npm.require('mkdirp');

  const stream = Npm.require('stream');

  const URL = Npm.require('url');

  const zlib = Npm.require('zlib');

  Meteor.startup(() => {
    let path = UploadFS.config.tmpDir;
    let mode = UploadFS.config.tmpDirPermissions;
    fs.stat(path, err => {
      if (err) {
        // Create the temp directory
        mkdirp(path, {
          mode: mode
        }, err => {
          if (err) {
            console.error(`ufs: cannot create temp directory at "${path}" (${err.message})`);
          } else {
            console.log(`ufs: temp directory created at "${path}"`);
          }
        });
      } else {
        // Set directory permissions
        fs.chmod(path, mode, err => {
          err && console.error(`ufs: cannot set temp directory permissions ${mode} (${err.message})`);
        });
      }
    });
  }); // Create domain to handle errors
  // and possibly avoid server crashes.

  let d = domain.create();
  d.on('error', err => {
    console.error('ufs: ' + err.message);
  }); // Listen HTTP requests to serve files

  WebApp.connectHandlers.use((req, res, next) => {
    // Quick check to see if request should be catch
    if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
      next();
      return;
    } // Remove store path


    let parsedUrl = URL.parse(req.url);
    let path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1);

    let allowCORS = () => {
      // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    };

    if (req.method === "OPTIONS") {
      let regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
      let match = regExp.exec(path); // Request is not valid

      if (match === null) {
        res.writeHead(400);
        res.end();
        return;
      } // Get store


      let store = UploadFS.getStore(match[1]);

      if (!store) {
        res.writeHead(404);
        res.end();
        return;
      } // If a store is found, go ahead and allow the origin


      allowCORS();
      next();
    } else if (req.method === 'POST') {
      // Get store
      let regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
      let match = regExp.exec(path); // Request is not valid

      if (match === null) {
        res.writeHead(400);
        res.end();
        return;
      } // Get store


      let store = UploadFS.getStore(match[1]);

      if (!store) {
        res.writeHead(404);
        res.end();
        return;
      } // If a store is found, go ahead and allow the origin


      allowCORS(); // Get file

      let fileId = match[2];

      if (store.getCollection().find({
        _id: fileId
      }).count() === 0) {
        res.writeHead(404);
        res.end();
        return;
      } // Check upload token


      if (!store.checkToken(req.query.token, fileId)) {
        res.writeHead(403);
        res.end();
        return;
      }

      let tmpFile = UploadFS.getTempFilePath(fileId);
      let ws = fs.createWriteStream(tmpFile, {
        flags: 'a'
      });
      let fields = {
        uploading: true
      };
      let progress = parseFloat(req.query.progress);

      if (!isNaN(progress) && progress > 0) {
        fields.progress = Math.min(progress, 1);
      }

      req.on('data', chunk => {
        ws.write(chunk);
      });
      req.on('error', err => {
        res.writeHead(500);
        res.end();
      });
      req.on('end', Meteor.bindEnvironment(() => {
        // Update completed state without triggering hooks
        store.getCollection().direct.update({
          _id: fileId
        }, {
          $set: fields
        });
        ws.end();
      }));
      ws.on('error', err => {
        console.error(`ufs: cannot write chunk of file "${fileId}" (${err.message})`);
        fs.unlink(tmpFile, err => {
          err && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err.message})`);
        });
        res.writeHead(500);
        res.end();
      });
      ws.on('finish', () => {
        res.writeHead(204, {
          "Content-Type": 'text/plain'
        });
        res.end();
      });
    } else if (req.method === 'GET') {
      // Get store, file Id and file name
      let regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)(?:\/([^\/\?]+))?$');
      let match = regExp.exec(path); // Avoid 504 Gateway timeout error
      // if file is not handled by UploadFS.

      if (match === null) {
        next();
        return;
      } // Get store


      const storeName = match[1];
      const store = UploadFS.getStore(storeName);

      if (!store) {
        res.writeHead(404);
        res.end();
        return;
      }

      if (store.onRead !== null && store.onRead !== undefined && typeof store.onRead !== 'function') {
        console.error(`ufs: Store.onRead is not a function in store "${storeName}"`);
        res.writeHead(500);
        res.end();
        return;
      } // Remove file extension from file Id


      let index = match[2].indexOf('.');
      let fileId = index !== -1 ? match[2].substr(0, index) : match[2]; // Get file from database

      const file = store.getCollection().findOne({
        _id: fileId
      });

      if (!file) {
        res.writeHead(404);
        res.end();
        return;
      } // Simulate read speed


      if (UploadFS.config.simulateReadDelay) {
        Meteor._sleepForMs(UploadFS.config.simulateReadDelay);
      }

      d.run(() => {
        // Check if the file can be accessed
        if (store.onRead.call(store, fileId, file, req, res) !== false) {
          let options = {};
          let status = 200; // Prepare response headers

          let headers = {
            'Content-Type': file.type,
            'Content-Length': file.size
          }; // Add ETag header

          if (typeof file.etag === 'string') {
            headers['ETag'] = file.etag;
          } // Add Last-Modified header


          if (file.modifiedAt instanceof Date) {
            headers['Last-Modified'] = file.modifiedAt.toUTCString();
          } else if (file.uploadedAt instanceof Date) {
            headers['Last-Modified'] = file.uploadedAt.toUTCString();
          } // Parse request headers


          if (typeof req.headers === 'object') {
            // Compare ETag
            if (req.headers['if-none-match']) {
              if (file.etag === req.headers['if-none-match']) {
                res.writeHead(304); // Not Modified

                res.end();
                return;
              }
            } // Compare file modification date


            if (req.headers['if-modified-since']) {
              const modifiedSince = new Date(req.headers['if-modified-since']);

              if (file.modifiedAt instanceof Date && file.modifiedAt > modifiedSince || file.uploadedAt instanceof Date && file.uploadedAt > modifiedSince) {
                res.writeHead(304); // Not Modified

                res.end();
                return;
              }
            } // Support range request


            if (typeof req.headers.range === 'string') {
              const range = req.headers.range; // Range is not valid

              if (!range) {
                res.writeHead(416);
                res.end();
                return;
              }

              const total = file.size;
              const unit = range.substr(0, range.indexOf("="));

              if (unit !== "bytes") {
                res.writeHead(416);
                res.end();
                return;
              }

              const ranges = range.substr(unit.length).replace(/[^0-9\-,]/, '').split(',');

              if (ranges.length > 1) {//todo: support multipart ranges: https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
              } else {
                const r = ranges[0].split("-");
                const start = parseInt(r[0], 10);
                const end = r[1] ? parseInt(r[1], 10) : total - 1; // Range is not valid

                if (start < 0 || end >= total || start > end) {
                  res.writeHead(416);
                  res.end();
                  return;
                } // Update headers


                headers['Content-Range'] = `bytes ${start}-${end}/${total}`;
                headers['Content-Length'] = end - start + 1;
                options.start = start;
                options.end = end;
              }

              status = 206; // partial content
            }
          } else {
            headers['Accept-Ranges'] = "bytes";
          } // Open the file stream


          const rs = store.getReadStream(fileId, file, options);
          const ws = new stream.PassThrough();
          rs.on('error', Meteor.bindEnvironment(err => {
            store.onReadError.call(store, err, fileId, file);
            res.end();
          }));
          ws.on('error', Meteor.bindEnvironment(err => {
            store.onReadError.call(store, err, fileId, file);
            res.end();
          }));
          ws.on('close', () => {
            // Close output stream at the end
            ws.emit('end');
          }); // Transform stream

          store.transformRead(rs, ws, fileId, file, req, headers); // Parse request headers

          if (typeof req.headers === 'object') {
            // Compress data using if needed (ignore audio/video as they are already compressed)
            if (typeof req.headers['accept-encoding'] === 'string' && !/^(audio|video)/.test(file.type)) {
              let accept = req.headers['accept-encoding']; // Compress with gzip

              if (accept.match(/\bgzip\b/)) {
                headers['Content-Encoding'] = 'gzip';
                delete headers['Content-Length'];
                res.writeHead(status, headers);
                ws.pipe(zlib.createGzip()).pipe(res);
                return;
              } // Compress with deflate
              else if (accept.match(/\bdeflate\b/)) {
                  headers['Content-Encoding'] = 'deflate';
                  delete headers['Content-Length'];
                  res.writeHead(status, headers);
                  ws.pipe(zlib.createDeflate()).pipe(res);
                  return;
                }
            }
          } // Send raw data


          if (!headers['Content-Encoding']) {
            res.writeHead(status, headers);
            ws.pipe(res);
          }
        } else {
          res.end();
        }
      });
    } else {
      next();
    }
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-store-permissions.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-store-permissions.js                                                                   //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  StorePermissions: () => StorePermissions
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);

class StorePermissions {
  constructor(options) {
    // Default options
    options = _.extend({
      insert: null,
      remove: null,
      update: null
    }, options); // Check options

    if (options.insert && typeof options.insert !== 'function') {
      throw new TypeError("StorePermissions: insert is not a function");
    }

    if (options.remove && typeof options.remove !== 'function') {
      throw new TypeError("StorePermissions: remove is not a function");
    }

    if (options.update && typeof options.update !== 'function') {
      throw new TypeError("StorePermissions: update is not a function");
    } // Public attributes


    this.actions = {
      insert: options.insert,
      remove: options.remove,
      update: options.update
    };
  }
  /**
   * Checks the permission for the action
   * @param action
   * @param userId
   * @param file
   * @param fields
   * @param modifiers
   * @return {*}
   */


  check(action, userId, file, fields, modifiers) {
    if (typeof this.actions[action] === 'function') {
      return this.actions[action](userId, file, fields, modifiers);
    }

    return true; // by default allow all
  }
  /**
   * Checks the insert permission
   * @param userId
   * @param file
   * @returns {*}
   */


  checkInsert(userId, file) {
    return this.check('insert', userId, file);
  }
  /**
   * Checks the remove permission
   * @param userId
   * @param file
   * @returns {*}
   */


  checkRemove(userId, file) {
    return this.check('remove', userId, file);
  }
  /**
   * Checks the update permission
   * @param userId
   * @param file
   * @param fields
   * @param modifiers
   * @returns {*}
   */


  checkUpdate(userId, file, fields, modifiers) {
    return this.check('update', userId, file, fields, modifiers);
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-store.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-store.js                                                                               //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Store: () => Store
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 1);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 3);
let UploadFS;
module.watch(require("./ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 4);
let Filter;
module.watch(require("./ufs-filter"), {
  Filter(v) {
    Filter = v;
  }

}, 5);
let StorePermissions;
module.watch(require("./ufs-store-permissions"), {
  StorePermissions(v) {
    StorePermissions = v;
  }

}, 6);
let Tokens;
module.watch(require("./ufs-tokens"), {
  Tokens(v) {
    Tokens = v;
  }

}, 7);

class Store {
  constructor(options) {
    let self = this; // Default options

    options = _.extend({
      collection: null,
      filter: null,
      name: null,
      onCopyError: this.onCopyError,
      onFinishUpload: this.onFinishUpload,
      onRead: this.onRead,
      onReadError: this.onReadError,
      onValidate: this.onValidate,
      onWriteError: this.onWriteError,
      permissions: null,
      transformRead: null,
      transformWrite: null
    }, options); // Check options

    if (!(options.collection instanceof Mongo.Collection)) {
      throw new TypeError('Store: collection is not a Mongo.Collection');
    }

    if (options.filter && !(options.filter instanceof Filter)) {
      throw new TypeError('Store: filter is not a UploadFS.Filter');
    }

    if (typeof options.name !== 'string') {
      throw new TypeError('Store: name is not a string');
    }

    if (UploadFS.getStore(options.name)) {
      throw new TypeError('Store: name already exists');
    }

    if (options.onCopyError && typeof options.onCopyError !== 'function') {
      throw new TypeError('Store: onCopyError is not a function');
    }

    if (options.onFinishUpload && typeof options.onFinishUpload !== 'function') {
      throw new TypeError('Store: onFinishUpload is not a function');
    }

    if (options.onRead && typeof options.onRead !== 'function') {
      throw new TypeError('Store: onRead is not a function');
    }

    if (options.onReadError && typeof options.onReadError !== 'function') {
      throw new TypeError('Store: onReadError is not a function');
    }

    if (options.onWriteError && typeof options.onWriteError !== 'function') {
      throw new TypeError('Store: onWriteError is not a function');
    }

    if (options.permissions && !(options.permissions instanceof StorePermissions)) {
      throw new TypeError('Store: permissions is not a UploadFS.StorePermissions');
    }

    if (options.transformRead && typeof options.transformRead !== 'function') {
      throw new TypeError('Store: transformRead is not a function');
    }

    if (options.transformWrite && typeof options.transformWrite !== 'function') {
      throw new TypeError('Store: transformWrite is not a function');
    }

    if (options.onValidate && typeof options.onValidate !== 'function') {
      throw new TypeError('Store: onValidate is not a function');
    } // Public attributes


    self.options = options;
    self.permissions = options.permissions;

    _.each(['onCopyError', 'onFinishUpload', 'onRead', 'onReadError', 'onWriteError', 'onValidate'], method => {
      if (typeof options[method] === 'function') {
        self[method] = options[method];
      }
    }); // Add the store to the list


    UploadFS.addStore(self); // Set default permissions

    if (!(self.permissions instanceof StorePermissions)) {
      // Uses custom default permissions or UFS default permissions
      if (UploadFS.config.defaultStorePermissions instanceof StorePermissions) {
        self.permissions = UploadFS.config.defaultStorePermissions;
      } else {
        self.permissions = new StorePermissions();
        console.warn(`ufs: permissions are not defined for store "${options.name}"`);
      }
    }

    if (Meteor.isServer) {
      /**
       * Checks token validity
       * @param token
       * @param fileId
       * @returns {boolean}
       */
      self.checkToken = function (token, fileId) {
        check(token, String);
        check(fileId, String);
        return Tokens.find({
          value: token,
          fileId: fileId
        }).count() === 1;
      };
      /**
       * Copies the file to a store
       * @param fileId
       * @param store
       * @param callback
       */


      self.copy = function (fileId, store, callback) {
        check(fileId, String);

        if (!(store instanceof Store)) {
          throw new TypeError('store is not an instance of UploadFS.Store');
        } // Get original file


        let file = self.getCollection().findOne({
          _id: fileId
        });

        if (!file) {
          throw new Meteor.Error('file-not-found', 'File not found');
        } // Silently ignore the file if it does not match filter


        const filter = store.getFilter();

        if (filter instanceof Filter && !filter.isValid(file)) {
          return;
        } // Prepare copy


        let copy = _.omit(file, '_id', 'url');

        copy.originalStore = self.getName();
        copy.originalId = fileId; // Create the copy

        let copyId = store.create(copy); // Get original stream

        let rs = self.getReadStream(fileId, file); // Catch errors to avoid app crashing

        rs.on('error', Meteor.bindEnvironment(function (err) {
          callback.call(self, err, null);
        })); // Copy file data

        store.write(rs, copyId, Meteor.bindEnvironment(function (err) {
          if (err) {
            self.getCollection().remove({
              _id: copyId
            });
            self.onCopyError.call(self, err, fileId, file);
          }

          if (typeof callback === 'function') {
            callback.call(self, err, copyId, copy, store);
          }
        }));
      };
      /**
       * Creates the file in the collection
       * @param file
       * @param callback
       * @return {string}
       */


      self.create = function (file, callback) {
        check(file, Object);
        file.store = self.options.name; // assign store to file

        return self.getCollection().insert(file, callback);
      };
      /**
       * Creates a token for the file (only needed for client side upload)
       * @param fileId
       * @returns {*}
       */


      self.createToken = function (fileId) {
        let token = self.generateToken(); // Check if token exists

        if (Tokens.find({
          fileId: fileId
        }).count()) {
          Tokens.update({
            fileId: fileId
          }, {
            $set: {
              createdAt: new Date(),
              value: token
            }
          });
        } else {
          Tokens.insert({
            createdAt: new Date(),
            fileId: fileId,
            value: token
          });
        }

        return token;
      };
      /**
       * Writes the file to the store
       * @param rs
       * @param fileId
       * @param callback
       */


      self.write = function (rs, fileId, callback) {
        let file = self.getCollection().findOne({
          _id: fileId
        });
        let ws = self.getWriteStream(fileId, file);
        let errorHandler = Meteor.bindEnvironment(function (err) {
          self.getCollection().remove({
            _id: fileId
          });
          self.onWriteError.call(self, err, fileId, file);
          callback.call(self, err);
        });
        ws.on('error', errorHandler);
        ws.on('finish', Meteor.bindEnvironment(function () {
          let size = 0;
          let readStream = self.getReadStream(fileId, file);
          readStream.on('error', Meteor.bindEnvironment(function (error) {
            callback.call(self, error, null);
          }));
          readStream.on('data', Meteor.bindEnvironment(function (data) {
            size += data.length;
          }));
          readStream.on('end', Meteor.bindEnvironment(function () {
            // Set file attribute
            file.complete = true;
            file.etag = UploadFS.generateEtag();
            file.path = self.getFileRelativeURL(fileId);
            file.progress = 1;
            file.size = size;
            file.token = self.generateToken();
            file.uploading = false;
            file.uploadedAt = new Date();
            file.url = self.getFileURL(fileId); // Execute callback

            if (typeof self.onFinishUpload === 'function') {
              self.onFinishUpload.call(self, file);
            } // Sets the file URL when file transfer is complete,
            // this way, the image will loads entirely.


            self.getCollection().direct.update({
              _id: fileId
            }, {
              $set: {
                complete: file.complete,
                etag: file.etag,
                path: file.path,
                progress: file.progress,
                size: file.size,
                token: file.token,
                uploading: file.uploading,
                uploadedAt: file.uploadedAt,
                url: file.url
              }
            }); // Return file info

            callback.call(self, null, file); // Simulate write speed

            if (UploadFS.config.simulateWriteDelay) {
              Meteor._sleepForMs(UploadFS.config.simulateWriteDelay);
            } // Copy file to other stores


            if (self.options.copyTo instanceof Array) {
              for (let i = 0; i < self.options.copyTo.length; i += 1) {
                let store = self.options.copyTo[i];

                if (!store.getFilter() || store.getFilter().isValid(file)) {
                  self.copy(fileId, store);
                }
              }
            }
          }));
        })); // Execute transformation

        self.transformWrite(rs, ws, fileId, file);
      };
    }

    if (Meteor.isServer) {
      const fs = Npm.require('fs');

      const collection = self.getCollection(); // Code executed after removing file

      collection.after.remove(function (userId, file) {
        // Remove associated tokens
        Tokens.remove({
          fileId: file._id
        });

        if (self.options.copyTo instanceof Array) {
          for (let i = 0; i < self.options.copyTo.length; i += 1) {
            // Remove copies in stores
            self.options.copyTo[i].getCollection().remove({
              originalId: file._id
            });
          }
        }
      }); // Code executed before inserting file

      collection.before.insert(function (userId, file) {
        if (!self.permissions.checkInsert(userId, file)) {
          throw new Meteor.Error('forbidden', "Forbidden");
        }
      }); // Code executed before updating file

      collection.before.update(function (userId, file, fields, modifiers) {
        if (!self.permissions.checkUpdate(userId, file, fields, modifiers)) {
          throw new Meteor.Error('forbidden', "Forbidden");
        }
      }); // Code executed before removing file

      collection.before.remove(function (userId, file) {
        if (!self.permissions.checkRemove(userId, file)) {
          throw new Meteor.Error('forbidden', "Forbidden");
        } // Delete the physical file in the store


        self.delete(file._id);
        let tmpFile = UploadFS.getTempFilePath(file._id); // Delete the temp file

        fs.stat(tmpFile, function (err) {
          !err && fs.unlink(tmpFile, function (err) {
            err && console.error(`ufs: cannot delete temp file at ${tmpFile} (${err.message})`);
          });
        });
      });
    }
  }
  /**
   * Deletes a file async
   * @param fileId
   * @param callback
   */


  delete(fileId, callback) {
    throw new Error('delete is not implemented');
  }
  /**
   * Generates a random token
   * @param pattern
   * @return {string}
   */


  generateToken(pattern) {
    return (pattern || 'xyxyxyxyxy').replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0,
          v = c === 'x' ? r : r & 0x3 | 0x8;
      let s = v.toString(16);
      return Math.round(Math.random()) ? s.toUpperCase() : s;
    });
  }
  /**
   * Returns the collection
   * @return {Mongo.Collection}
   */


  getCollection() {
    return this.options.collection;
  }
  /**
   * Returns the file URL
   * @param fileId
   * @return {string|null}
   */


  getFileRelativeURL(fileId) {
    let file = this.getCollection().findOne(fileId, {
      fields: {
        name: 1
      }
    });
    return file ? this.getRelativeURL(`${fileId}/${file.name}`) : null;
  }
  /**
   * Returns the file URL
   * @param fileId
   * @return {string|null}
   */


  getFileURL(fileId) {
    let file = this.getCollection().findOne(fileId, {
      fields: {
        name: 1
      }
    });
    return file ? this.getURL(`${fileId}/${file.name}`) : null;
  }
  /**
   * Returns the file filter
   * @return {UploadFS.Filter}
   */


  getFilter() {
    return this.options.filter;
  }
  /**
   * Returns the store name
   * @return {string}
   */


  getName() {
    return this.options.name;
  }
  /**
   * Returns the file read stream
   * @param fileId
   * @param file
   */


  getReadStream(fileId, file) {
    throw new Error('Store.getReadStream is not implemented');
  }
  /**
   * Returns the store relative URL
   * @param path
   * @return {string}
   */


  getRelativeURL(path) {
    const rootUrl = Meteor.absoluteUrl().replace(/\/+$/, '');
    const rootPath = rootUrl.replace(/^[a-z]+:\/\/[^/]+\/*/gi, '');
    const storeName = this.getName();
    path = String(path).replace(/\/$/, '').trim();
    return encodeURI(`${rootPath}/${UploadFS.config.storesPath}/${storeName}/${path}`);
  }
  /**
   * Returns the store absolute URL
   * @param path
   * @return {string}
   */


  getURL(path) {
    const rootUrl = Meteor.absoluteUrl({
      secure: UploadFS.config.https
    }).replace(/\/+$/, '');
    const storeName = this.getName();
    path = String(path).replace(/\/$/, '').trim();
    return encodeURI(`${rootUrl}/${UploadFS.config.storesPath}/${storeName}/${path}`);
  }
  /**
   * Returns the file write stream
   * @param fileId
   * @param file
   */


  getWriteStream(fileId, file) {
    throw new Error('getWriteStream is not implemented');
  }
  /**
   * Completes the file upload
   * @param url
   * @param file
   * @param callback
   */


  importFromURL(url, file, callback) {
    Meteor.call('ufsImportURL', url, file, this.getName(), callback);
  }
  /**
   * Called when a copy error happened
   * @param err
   * @param fileId
   * @param file
   */


  onCopyError(err, fileId, file) {
    console.error(`ufs: cannot copy file "${fileId}" (${err.message})`, err);
  }
  /**
   * Called when a file has been uploaded
   * @param file
   */


  onFinishUpload(file) {}
  /**
   * Called when a file is read from the store
   * @param fileId
   * @param file
   * @param request
   * @param response
   * @return boolean
   */


  onRead(fileId, file, request, response) {
    return true;
  }
  /**
   * Called when a read error happened
   * @param err
   * @param fileId
   * @param file
   * @return boolean
   */


  onReadError(err, fileId, file) {
    console.error(`ufs: cannot read file "${fileId}" (${err.message})`, err);
  }
  /**
   * Called when file is being validated
   * @param file
   */


  onValidate(file) {}
  /**
   * Called when a write error happened
   * @param err
   * @param fileId
   * @param file
   * @return boolean
   */


  onWriteError(err, fileId, file) {
    console.error(`ufs: cannot write file "${fileId}" (${err.message})`, err);
  }
  /**
   * Sets the store permissions
   * @param permissions
   */


  setPermissions(permissions) {
    if (!(permissions instanceof StorePermissions)) {
      throw new TypeError("Permissions is not an instance of UploadFS.StorePermissions");
    }

    this.permissions = permissions;
  }
  /**
   * Transforms the file on reading
   * @param readStream
   * @param writeStream
   * @param fileId
   * @param file
   * @param request
   * @param headers
   */


  transformRead(readStream, writeStream, fileId, file, request, headers) {
    if (typeof this.options.transformRead === 'function') {
      this.options.transformRead.call(this, readStream, writeStream, fileId, file, request, headers);
    } else {
      readStream.pipe(writeStream);
    }
  }
  /**
   * Transforms the file on writing
   * @param readStream
   * @param writeStream
   * @param fileId
   * @param file
   */


  transformWrite(readStream, writeStream, fileId, file) {
    if (typeof this.options.transformWrite === 'function') {
      this.options.transformWrite.call(this, readStream, writeStream, fileId, file);
    } else {
      readStream.pipe(writeStream);
    }
  }
  /**
   * Validates the file
   * @param file
   */


  validate(file) {
    if (typeof this.onValidate === 'function') {
      this.onValidate(file);
    }
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-template-helpers.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-template-helpers.js                                                                    //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let Template;
module.watch(require("meteor/templating"), {
  Template(v) {
    Template = v;
  }

}, 0);

let isMIME = function (type, mime) {
  return typeof type === 'string' && typeof mime === 'string' && mime.indexOf(type + '/') === 0;
};

Template.registerHelper('isApplication', function (type) {
  return isMIME('application', this.type || type);
});
Template.registerHelper('isAudio', function (type) {
  return isMIME('audio', this.type || type);
});
Template.registerHelper('isImage', function (type) {
  return isMIME('image', this.type || type);
});
Template.registerHelper('isText', function (type) {
  return isMIME('text', this.type || type);
});
Template.registerHelper('isVideo', function (type) {
  return isMIME('video', this.type || type);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-tokens.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-tokens.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Tokens: () => Tokens
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Tokens = new Mongo.Collection('ufsTokens');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-uploader.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-uploader.js                                                                            //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Uploader: () => Uploader
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Store;
module.watch(require("./ufs-store"), {
  Store(v) {
    Store = v;
  }

}, 2);

class Uploader {
  constructor(options) {
    let self = this; // Set default options

    options = _.extend({
      adaptive: true,
      capacity: 0.9,
      chunkSize: 16 * 1024,
      data: null,
      file: null,
      maxChunkSize: 4 * 1024 * 1000,
      maxTries: 5,
      onAbort: this.onAbort,
      onComplete: this.onComplete,
      onCreate: this.onCreate,
      onError: this.onError,
      onProgress: this.onProgress,
      onStart: this.onStart,
      onStop: this.onStop,
      retryDelay: 2000,
      store: null,
      transferDelay: 100
    }, options); // Check options

    if (typeof options.adaptive !== 'boolean') {
      throw new TypeError('adaptive is not a number');
    }

    if (typeof options.capacity !== 'number') {
      throw new TypeError('capacity is not a number');
    }

    if (options.capacity <= 0 || options.capacity > 1) {
      throw new RangeError('capacity must be a float between 0.1 and 1.0');
    }

    if (typeof options.chunkSize !== 'number') {
      throw new TypeError('chunkSize is not a number');
    }

    if (!(options.data instanceof Blob) && !(options.data instanceof File)) {
      throw new TypeError('data is not an Blob or File');
    }

    if (options.file === null || typeof options.file !== 'object') {
      throw new TypeError('file is not an object');
    }

    if (typeof options.maxChunkSize !== 'number') {
      throw new TypeError('maxChunkSize is not a number');
    }

    if (typeof options.maxTries !== 'number') {
      throw new TypeError('maxTries is not a number');
    }

    if (typeof options.retryDelay !== 'number') {
      throw new TypeError('retryDelay is not a number');
    }

    if (typeof options.transferDelay !== 'number') {
      throw new TypeError('transferDelay is not a number');
    }

    if (typeof options.onAbort !== 'function') {
      throw new TypeError('onAbort is not a function');
    }

    if (typeof options.onComplete !== 'function') {
      throw new TypeError('onComplete is not a function');
    }

    if (typeof options.onCreate !== 'function') {
      throw new TypeError('onCreate is not a function');
    }

    if (typeof options.onError !== 'function') {
      throw new TypeError('onError is not a function');
    }

    if (typeof options.onProgress !== 'function') {
      throw new TypeError('onProgress is not a function');
    }

    if (typeof options.onStart !== 'function') {
      throw new TypeError('onStart is not a function');
    }

    if (typeof options.onStop !== 'function') {
      throw new TypeError('onStop is not a function');
    }

    if (typeof options.store !== 'string' && !(options.store instanceof Store)) {
      throw new TypeError('store must be the name of the store or an instance of UploadFS.Store');
    } // Public attributes


    self.adaptive = options.adaptive;
    self.capacity = parseFloat(options.capacity);
    self.chunkSize = parseInt(options.chunkSize);
    self.maxChunkSize = parseInt(options.maxChunkSize);
    self.maxTries = parseInt(options.maxTries);
    self.retryDelay = parseInt(options.retryDelay);
    self.transferDelay = parseInt(options.transferDelay);
    self.onAbort = options.onAbort;
    self.onComplete = options.onComplete;
    self.onCreate = options.onCreate;
    self.onError = options.onError;
    self.onProgress = options.onProgress;
    self.onStart = options.onStart;
    self.onStop = options.onStop; // Private attributes

    let store = options.store;
    let data = options.data;
    let capacityMargin = 0.1;
    let file = options.file;
    let fileId = null;
    let offset = 0;
    let loaded = 0;
    let total = data.size;
    let tries = 0;
    let postUrl = null;
    let token = null;
    let complete = false;
    let uploading = false;
    let timeA = null;
    let timeB = null;
    let elapsedTime = 0;
    let startTime = 0; // Keep only the name of the store

    if (store instanceof Store) {
      store = store.getName();
    } // Assign file to store


    file.store = store;

    function finish() {
      // Finish the upload by telling the store the upload is complete
      Meteor.call('ufsComplete', fileId, store, token, function (err, uploadedFile) {
        if (err) {
          self.onError(err, file);
          self.abort();
        } else if (uploadedFile) {
          uploading = false;
          complete = true;
          file = uploadedFile;
          self.onComplete(uploadedFile);
        }
      });
    }
    /**
     * Aborts the current transfer
     */


    self.abort = function () {
      // Remove the file from database
      Meteor.call('ufsDelete', fileId, store, token, function (err, result) {
        if (err) {
          self.onError(err, file);
        }
      }); // Reset uploader status

      uploading = false;
      fileId = null;
      offset = 0;
      tries = 0;
      loaded = 0;
      complete = false;
      startTime = null;
      self.onAbort(file);
    };
    /**
     * Returns the average speed in bytes per second
     * @returns {number}
     */


    self.getAverageSpeed = function () {
      let seconds = self.getElapsedTime() / 1000;
      return self.getLoaded() / seconds;
    };
    /**
     * Returns the elapsed time in milliseconds
     * @returns {number}
     */


    self.getElapsedTime = function () {
      if (startTime && self.isUploading()) {
        return elapsedTime + (Date.now() - startTime);
      }

      return elapsedTime;
    };
    /**
     * Returns the file
     * @return {object}
     */


    self.getFile = function () {
      return file;
    };
    /**
     * Returns the loaded bytes
     * @return {number}
     */


    self.getLoaded = function () {
      return loaded;
    };
    /**
     * Returns current progress
     * @return {number}
     */


    self.getProgress = function () {
      return Math.min(loaded / total * 100 / 100, 1.0);
    };
    /**
     * Returns the remaining time in milliseconds
     * @returns {number}
     */


    self.getRemainingTime = function () {
      let averageSpeed = self.getAverageSpeed();
      let remainingBytes = total - self.getLoaded();
      return averageSpeed && remainingBytes ? Math.max(remainingBytes / averageSpeed, 0) : 0;
    };
    /**
     * Returns the upload speed in bytes per second
     * @returns {number}
     */


    self.getSpeed = function () {
      if (timeA && timeB && self.isUploading()) {
        let seconds = (timeB - timeA) / 1000;
        return self.chunkSize / seconds;
      }

      return 0;
    };
    /**
     * Returns the total bytes
     * @return {number}
     */


    self.getTotal = function () {
      return total;
    };
    /**
     * Checks if the transfer is complete
     * @return {boolean}
     */


    self.isComplete = function () {
      return complete;
    };
    /**
     * Checks if the transfer is active
     * @return {boolean}
     */


    self.isUploading = function () {
      return uploading;
    };
    /**
     * Reads a portion of file
     * @param start
     * @param length
     * @param callback
     * @returns {Blob}
     */


    self.readChunk = function (start, length, callback) {
      if (typeof callback != 'function') {
        throw new Error('readChunk is missing callback');
      }

      try {
        let end; // Calculate the chunk size

        if (length && start + length > total) {
          end = total;
        } else {
          end = start + length;
        } // Get chunk


        let chunk = data.slice(start, end); // Pass chunk to callback

        callback.call(self, null, chunk);
      } catch (err) {
        console.error('read error', err); // Retry to read chunk

        Meteor.setTimeout(function () {
          if (tries < self.maxTries) {
            tries += 1;
            self.readChunk(start, length, callback);
          }
        }, self.retryDelay);
      }
    };
    /**
     * Sends a file chunk to the store
     */


    self.sendChunk = function () {
      if (!complete && startTime !== null) {
        if (offset < total) {
          let chunkSize = self.chunkSize; // Use adaptive length

          if (self.adaptive && timeA && timeB && timeB > timeA) {
            let duration = (timeB - timeA) / 1000;
            let max = self.capacity * (1 + capacityMargin);
            let min = self.capacity * (1 - capacityMargin);

            if (duration >= max) {
              chunkSize = Math.abs(Math.round(chunkSize * (max - duration)));
            } else if (duration < min) {
              chunkSize = Math.round(chunkSize * (min / duration));
            } // Limit to max chunk size


            if (self.maxChunkSize > 0 && chunkSize > self.maxChunkSize) {
              chunkSize = self.maxChunkSize;
            }
          } // Limit to max chunk size


          if (self.maxChunkSize > 0 && chunkSize > self.maxChunkSize) {
            chunkSize = self.maxChunkSize;
          } // Reduce chunk size to fit total


          if (offset + chunkSize > total) {
            chunkSize = total - offset;
          } // Prepare the chunk


          self.readChunk(offset, chunkSize, function (err, chunk) {
            if (err) {
              self.onError(err, file);
              return;
            }

            let xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4) {
                if (_.contains([200, 201, 202, 204], xhr.status)) {
                  timeB = Date.now();
                  offset += chunkSize;
                  loaded += chunkSize; // Send next chunk

                  self.onProgress(file, self.getProgress()); // Finish upload

                  if (loaded >= total) {
                    elapsedTime = Date.now() - startTime;
                    finish();
                  } else {
                    Meteor.setTimeout(self.sendChunk, self.transferDelay);
                  }
                } else if (!_.contains([402, 403, 404, 500], xhr.status)) {
                  // Retry until max tries is reach
                  // But don't retry if these errors occur
                  if (tries <= self.maxTries) {
                    tries += 1; // Wait before retrying

                    Meteor.setTimeout(self.sendChunk, self.retryDelay);
                  } else {
                    self.abort();
                  }
                } else {
                  self.abort();
                }
              }
            }; // Calculate upload progress


            let progress = (offset + chunkSize) / total; // let formData = new FormData();
            // formData.append('progress', progress);
            // formData.append('chunk', chunk);

            let url = `${postUrl}&progress=${progress}`;
            timeA = Date.now();
            timeB = null;
            uploading = true; // Send chunk to the store

            xhr.open('POST', url, true);
            xhr.send(chunk);
          });
        }
      }
    };
    /**
     * Starts or resumes the transfer
     */


    self.start = function () {
      if (!fileId) {
        // Create the file document and get the token
        // that allows the user to send chunks to the store.
        Meteor.call('ufsCreate', _.extend({}, file), function (err, result) {
          if (err) {
            self.onError(err, file);
          } else if (result) {
            token = result.token;
            postUrl = result.url;
            fileId = result.fileId;
            file._id = result.fileId;
            self.onCreate(file);
            tries = 0;
            startTime = Date.now();
            self.onStart(file);
            self.sendChunk();
          }
        });
      } else if (!uploading && !complete) {
        // Resume uploading
        tries = 0;
        startTime = Date.now();
        self.onStart(file);
        self.sendChunk();
      }
    };
    /**
     * Stops the transfer
     */


    self.stop = function () {
      if (uploading) {
        // Update elapsed time
        elapsedTime = Date.now() - startTime;
        startTime = null;
        uploading = false;
        self.onStop(file);
        Meteor.call('ufsStop', fileId, store, token, function (err, result) {
          if (err) {
            self.onError(err, file);
          }
        });
      }
    };
  }
  /**
   * Called when the file upload is aborted
   * @param file
   */


  onAbort(file) {}
  /**
   * Called when the file upload is complete
   * @param file
   */


  onComplete(file) {}
  /**
   * Called when the file is created in the collection
   * @param file
   */


  onCreate(file) {}
  /**
   * Called when an error occurs during file upload
   * @param err
   * @param file
   */


  onError(err, file) {
    console.error(`ufs: ${err.message}`);
  }
  /**
   * Called when a file chunk has been sent
   * @param file
   * @param progress is a float from 0.0 to 1.0
   */


  onProgress(file, progress) {}
  /**
   * Called when the file upload starts
   * @param file
   */


  onStart(file) {}
  /**
   * Called when the file upload stops
   * @param file
   */


  onStop(file) {}

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/jalik:ufs/ufs.js");

/* Exports */
Package._define("jalik:ufs", exports);

})();

//# sourceURL=meteor://💻app/packages/jalik_ufs.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy1jb25maWcuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtZmlsdGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9qYWxpazp1ZnMvdWZzLW1ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtbWltZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy1zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtc3RvcmUtcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtc3RvcmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtdGVtcGxhdGUtaGVscGVycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy10b2tlbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtdXBsb2FkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsImV4cG9ydCIsIlVwbG9hZEZTIiwiXyIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJNZXRlb3IiLCJNb25nbyIsIk1JTUUiLCJSYW5kb20iLCJUb2tlbnMiLCJDb25maWciLCJGaWx0ZXIiLCJTdG9yZSIsIlN0b3JlUGVybWlzc2lvbnMiLCJVcGxvYWRlciIsInN0b3JlcyIsInN0b3JlIiwidG9rZW5zIiwiYWRkRVRhZ0F0dHJpYnV0ZVRvRmlsZXMiLCJ3aGVyZSIsImVhY2giLCJnZXRTdG9yZXMiLCJmaWxlcyIsImdldENvbGxlY3Rpb24iLCJmaW5kIiwiZXRhZyIsImZpZWxkcyIsIl9pZCIsImZvckVhY2giLCJmaWxlIiwiZGlyZWN0IiwidXBkYXRlIiwiJHNldCIsImdlbmVyYXRlRXRhZyIsImFkZE1pbWVUeXBlIiwiZXh0ZW5zaW9uIiwibWltZSIsInRvTG93ZXJDYXNlIiwiYWRkUGF0aEF0dHJpYnV0ZVRvRmlsZXMiLCJwYXRoIiwiZ2V0RmlsZVJlbGF0aXZlVVJMIiwiYWRkU3RvcmUiLCJUeXBlRXJyb3IiLCJnZXROYW1lIiwiaWQiLCJnZXRNaW1lVHlwZSIsImdldE1pbWVUeXBlcyIsImdldFN0b3JlIiwibmFtZSIsImdldFRlbXBGaWxlUGF0aCIsImZpbGVJZCIsImNvbmZpZyIsInRtcERpciIsImltcG9ydEZyb21VUkwiLCJ1cmwiLCJjYWxsYmFjayIsImNhbGwiLCJyZWFkQXNBcnJheUJ1ZmZlciIsImV2ZW50IiwiY29uc29sZSIsImVycm9yIiwic2VsZWN0RmlsZSIsImlucHV0IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidHlwZSIsIm11bHRpcGxlIiwib25jaGFuZ2UiLCJldiIsInRhcmdldCIsImRpdiIsImNsYXNzTmFtZSIsInN0eWxlIiwiYXBwZW5kQ2hpbGQiLCJib2R5IiwiY2xpY2siLCJzZWxlY3RGaWxlcyIsImkiLCJsZW5ndGgiLCJpc0NsaWVudCIsImlzU2VydmVyIiwiZ2xvYmFsIiwid2luZG93IiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiZXh0ZW5kIiwiZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMiLCJodHRwcyIsInNpbXVsYXRlUmVhZERlbGF5Iiwic2ltdWxhdGVVcGxvYWRTcGVlZCIsInNpbXVsYXRlV3JpdGVEZWxheSIsInN0b3Jlc1BhdGgiLCJ0bXBEaXJQZXJtaXNzaW9ucyIsInBhcnNlSW50Iiwic2VsZiIsImNvbnRlbnRUeXBlcyIsImV4dGVuc2lvbnMiLCJtaW5TaXplIiwibWF4U2l6ZSIsIm9uQ2hlY2siLCJBcnJheSIsIm1ldGhvZCIsImNoZWNrIiwiRXJyb3IiLCJzaXplIiwiZ2V0TWluU2l6ZSIsImdldE1heFNpemUiLCJnZXRFeHRlbnNpb25zIiwiY29udGFpbnMiLCJnZXRDb250ZW50VHlwZXMiLCJpc0NvbnRlbnRUeXBlSW5MaXN0IiwibGlzdCIsIndpbGRDYXJkR2xvYiIsIndpbGRjYXJkcyIsImZpbHRlciIsIml0ZW0iLCJpbmRleE9mIiwicmVwbGFjZSIsImlzVmFsaWQiLCJyZXN1bHQiLCJlcnIiLCJmcyIsIk5wbSIsImh0dHAiLCJGdXR1cmUiLCJtZXRob2RzIiwidWZzQ29tcGxldGUiLCJzdG9yZU5hbWUiLCJ0b2tlbiIsIlN0cmluZyIsImNoZWNrVG9rZW4iLCJmdXQiLCJ0bXBGaWxlIiwicmVtb3ZlVGVtcEZpbGUiLCJ1bmxpbmsiLCJtZXNzYWdlIiwiZmluZE9uZSIsInZhbGlkYXRlIiwicnMiLCJjcmVhdGVSZWFkU3RyZWFtIiwiZmxhZ3MiLCJlbmNvZGluZyIsImF1dG9DbG9zZSIsIm9uIiwiYmluZEVudmlyb25tZW50IiwicmVtb3ZlIiwidGhyb3ciLCJ3cml0ZSIsInJldHVybiIsIndhaXQiLCJ1ZnNDcmVhdGUiLCJPYmplY3QiLCJjb21wbGV0ZSIsInVwbG9hZGluZyIsInN1YnN0ciIsImxhc3RJbmRleE9mIiwicHJvZ3Jlc3MiLCJ1c2VySWQiLCJnZXRGaWx0ZXIiLCJjcmVhdGUiLCJjcmVhdGVUb2tlbiIsInVwbG9hZFVybCIsImdldFVSTCIsInVmc0RlbGV0ZSIsImNvdW50IiwidWZzSW1wb3J0VVJMIiwic3BsaXQiLCJwb3AiLCJvcmlnaW5hbFVybCIsIndhcm4iLCJwcm90byIsInRlc3QiLCJ1bmJsb2NrIiwiZ2V0IiwicmVzIiwidWZzU3RvcCIsIldlYkFwcCIsImRvbWFpbiIsIm1rZGlycCIsInN0cmVhbSIsIlVSTCIsInpsaWIiLCJzdGFydHVwIiwibW9kZSIsInN0YXQiLCJsb2ciLCJjaG1vZCIsImQiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJyZXEiLCJuZXh0IiwicGFyc2VkVXJsIiwicGFyc2UiLCJwYXRobmFtZSIsImFsbG93Q09SUyIsInNldEhlYWRlciIsInJlZ0V4cCIsIlJlZ0V4cCIsIm1hdGNoIiwiZXhlYyIsIndyaXRlSGVhZCIsImVuZCIsInF1ZXJ5Iiwid3MiLCJjcmVhdGVXcml0ZVN0cmVhbSIsInBhcnNlRmxvYXQiLCJpc05hTiIsIk1hdGgiLCJtaW4iLCJjaHVuayIsIm9uUmVhZCIsInVuZGVmaW5lZCIsImluZGV4IiwiX3NsZWVwRm9yTXMiLCJydW4iLCJzdGF0dXMiLCJoZWFkZXJzIiwibW9kaWZpZWRBdCIsIkRhdGUiLCJ0b1VUQ1N0cmluZyIsInVwbG9hZGVkQXQiLCJtb2RpZmllZFNpbmNlIiwicmFuZ2UiLCJ0b3RhbCIsInVuaXQiLCJyYW5nZXMiLCJyIiwic3RhcnQiLCJnZXRSZWFkU3RyZWFtIiwiUGFzc1Rocm91Z2giLCJvblJlYWRFcnJvciIsImVtaXQiLCJ0cmFuc2Zvcm1SZWFkIiwiYWNjZXB0IiwicGlwZSIsImNyZWF0ZUd6aXAiLCJjcmVhdGVEZWZsYXRlIiwiaW5zZXJ0IiwiYWN0aW9ucyIsImFjdGlvbiIsIm1vZGlmaWVycyIsImNoZWNrSW5zZXJ0IiwiY2hlY2tSZW1vdmUiLCJjaGVja1VwZGF0ZSIsImNvbGxlY3Rpb24iLCJvbkNvcHlFcnJvciIsIm9uRmluaXNoVXBsb2FkIiwib25WYWxpZGF0ZSIsIm9uV3JpdGVFcnJvciIsInBlcm1pc3Npb25zIiwidHJhbnNmb3JtV3JpdGUiLCJDb2xsZWN0aW9uIiwidmFsdWUiLCJjb3B5Iiwib21pdCIsIm9yaWdpbmFsU3RvcmUiLCJvcmlnaW5hbElkIiwiY29weUlkIiwiZ2VuZXJhdGVUb2tlbiIsImNyZWF0ZWRBdCIsImdldFdyaXRlU3RyZWFtIiwiZXJyb3JIYW5kbGVyIiwicmVhZFN0cmVhbSIsImRhdGEiLCJnZXRGaWxlVVJMIiwiY29weVRvIiwiYWZ0ZXIiLCJiZWZvcmUiLCJkZWxldGUiLCJwYXR0ZXJuIiwiYyIsInJhbmRvbSIsInMiLCJ0b1N0cmluZyIsInJvdW5kIiwidG9VcHBlckNhc2UiLCJnZXRSZWxhdGl2ZVVSTCIsInJvb3RVcmwiLCJhYnNvbHV0ZVVybCIsInJvb3RQYXRoIiwidHJpbSIsImVuY29kZVVSSSIsInNlY3VyZSIsInJlcXVlc3QiLCJyZXNwb25zZSIsInNldFBlcm1pc3Npb25zIiwid3JpdGVTdHJlYW0iLCJUZW1wbGF0ZSIsImlzTUlNRSIsInJlZ2lzdGVySGVscGVyIiwiYWRhcHRpdmUiLCJjYXBhY2l0eSIsImNodW5rU2l6ZSIsIm1heENodW5rU2l6ZSIsIm1heFRyaWVzIiwib25BYm9ydCIsIm9uQ29tcGxldGUiLCJvbkNyZWF0ZSIsIm9uRXJyb3IiLCJvblByb2dyZXNzIiwib25TdGFydCIsIm9uU3RvcCIsInJldHJ5RGVsYXkiLCJ0cmFuc2ZlckRlbGF5IiwiUmFuZ2VFcnJvciIsIkJsb2IiLCJGaWxlIiwiY2FwYWNpdHlNYXJnaW4iLCJvZmZzZXQiLCJsb2FkZWQiLCJ0cmllcyIsInBvc3RVcmwiLCJ0aW1lQSIsInRpbWVCIiwiZWxhcHNlZFRpbWUiLCJzdGFydFRpbWUiLCJmaW5pc2giLCJ1cGxvYWRlZEZpbGUiLCJhYm9ydCIsImdldEF2ZXJhZ2VTcGVlZCIsInNlY29uZHMiLCJnZXRFbGFwc2VkVGltZSIsImdldExvYWRlZCIsImlzVXBsb2FkaW5nIiwibm93IiwiZ2V0RmlsZSIsImdldFByb2dyZXNzIiwiZ2V0UmVtYWluaW5nVGltZSIsImF2ZXJhZ2VTcGVlZCIsInJlbWFpbmluZ0J5dGVzIiwibWF4IiwiZ2V0U3BlZWQiLCJnZXRUb3RhbCIsImlzQ29tcGxldGUiLCJyZWFkQ2h1bmsiLCJzbGljZSIsInNldFRpbWVvdXQiLCJzZW5kQ2h1bmsiLCJkdXJhdGlvbiIsImFicyIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsIm9wZW4iLCJzZW5kIiwic3RvcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU1BLFVBQVFDLE1BQWQ7QUFBcUJELFFBQVFFLE1BQVIsQ0FBZTtBQUFDQyxZQUFTLE1BQUlBO0FBQWQsQ0FBZjs7QUFBd0Ms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QUFjaEcsS0FBSzBHLEdBQUwsS0FBYVQsU0FBM0I7QUFDQUEsb0JBQVksSUFBWjtBQUNBbkssb0JBQVksS0FBWjtBQUNBM0QsYUFBS2dOLE1BQUwsQ0FBWWpSLElBQVo7QUFFQXhCLGVBQU9tRCxJQUFQLENBQVksU0FBWixFQUF1Qk4sTUFBdkIsRUFBK0JsQyxLQUEvQixFQUFzQ2dILEtBQXRDLEVBQTZDLFVBQVVSLEdBQVYsRUFBZUQsTUFBZixFQUF1QjtBQUNoRSxjQUFJQyxHQUFKLEVBQVM7QUFDTDFCLGlCQUFLNk0sT0FBTCxDQUFhbkwsR0FBYixFQUFrQjNGLElBQWxCO0FBQ0g7QUFDSixTQUpEO0FBS0g7QUFDSixLQWREO0FBZUg7QUFFRDs7Ozs7O0FBSUEyUSxVQUFRM1EsSUFBUixFQUFjLENBQ2I7QUFFRDs7Ozs7O0FBSUE0USxhQUFXNVEsSUFBWCxFQUFpQixDQUNoQjtBQUVEOzs7Ozs7QUFJQTZRLFdBQVM3USxJQUFULEVBQWUsQ0FDZDtBQUVEOzs7Ozs7O0FBS0E4USxVQUFRbkwsR0FBUixFQUFhM0YsSUFBYixFQUFtQjtBQUNmOEIsWUFBUUMsS0FBUixDQUFlLFFBQU80RCxJQUFJZSxPQUFRLEVBQWxDO0FBQ0g7QUFFRDs7Ozs7OztBQUtBcUssYUFBVy9RLElBQVgsRUFBaUIrSCxRQUFqQixFQUEyQixDQUMxQjtBQUVEOzs7Ozs7QUFJQWlKLFVBQVFoUixJQUFSLEVBQWMsQ0FDYjtBQUVEOzs7Ozs7QUFJQWlSLFNBQU9qUixJQUFQLEVBQWEsQ0FDWjs7QUEzZWlCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2phbGlrX3Vmcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5pbXBvcnQge199IGZyb20gXCJtZXRlb3IvdW5kZXJzY29yZVwiO1xyXG5pbXBvcnQge01ldGVvcn0gZnJvbSBcIm1ldGVvci9tZXRlb3JcIjtcclxuaW1wb3J0IHtNb25nb30gZnJvbSBcIm1ldGVvci9tb25nb1wiO1xyXG5pbXBvcnQge01JTUV9IGZyb20gXCIuL3Vmcy1taW1lXCI7XHJcbmltcG9ydCB7UmFuZG9tfSBmcm9tIFwibWV0ZW9yL3JhbmRvbVwiO1xyXG5pbXBvcnQge1Rva2Vuc30gZnJvbSBcIi4vdWZzLXRva2Vuc1wiO1xyXG5pbXBvcnQge0NvbmZpZ30gZnJvbSBcIi4vdWZzLWNvbmZpZ1wiO1xyXG5pbXBvcnQge0ZpbHRlcn0gZnJvbSBcIi4vdWZzLWZpbHRlclwiO1xyXG5pbXBvcnQge1N0b3JlfSBmcm9tIFwiLi91ZnMtc3RvcmVcIjtcclxuaW1wb3J0IHtTdG9yZVBlcm1pc3Npb25zfSBmcm9tIFwiLi91ZnMtc3RvcmUtcGVybWlzc2lvbnNcIjtcclxuaW1wb3J0IHtVcGxvYWRlcn0gZnJvbSBcIi4vdWZzLXVwbG9hZGVyXCI7XHJcblxyXG5cclxubGV0IHN0b3JlcyA9IHt9O1xyXG5cclxuZXhwb3J0IGNvbnN0IFVwbG9hZEZTID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udGFpbnMgYWxsIHN0b3Jlc1xyXG4gICAgICovXHJcbiAgICBzdG9yZToge30sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb2xsZWN0aW9uIG9mIHRva2Vuc1xyXG4gICAgICovXHJcbiAgICB0b2tlbnM6IFRva2VucyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgdGhlIFwiZXRhZ1wiIGF0dHJpYnV0ZSB0byBmaWxlc1xyXG4gICAgICogQHBhcmFtIHdoZXJlXHJcbiAgICAgKi9cclxuICAgIGFkZEVUYWdBdHRyaWJ1dGVUb0ZpbGVzKHdoZXJlKSB7XHJcbiAgICAgICAgXy5lYWNoKHRoaXMuZ2V0U3RvcmVzKCksIChzdG9yZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlcyA9IHN0b3JlLmdldENvbGxlY3Rpb24oKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEJ5IGRlZmF1bHQgdXBkYXRlIG9ubHkgZmlsZXMgd2l0aCBubyBwYXRoIHNldFxyXG4gICAgICAgICAgICBmaWxlcy5maW5kKHdoZXJlIHx8IHtldGFnOiBudWxsfSwge2ZpZWxkczoge19pZDogMX19KS5mb3JFYWNoKChmaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5kaXJlY3QudXBkYXRlKGZpbGUuX2lkLCB7JHNldDoge2V0YWc6IHRoaXMuZ2VuZXJhdGVFdGFnKCl9fSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgdGhlIE1JTUUgdHlwZSBmb3IgYW4gZXh0ZW5zaW9uXHJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uXHJcbiAgICAgKiBAcGFyYW0gbWltZVxyXG4gICAgICovXHJcbiAgICBhZGRNaW1lVHlwZShleHRlbnNpb24sIG1pbWUpIHtcclxuICAgICAgICBNSU1FW2V4dGVuc2lvbi50b0xvd2VyQ2FzZSgpXSA9IG1pbWU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyB0aGUgXCJwYXRoXCIgYXR0cmlidXRlIHRvIGZpbGVzXHJcbiAgICAgKiBAcGFyYW0gd2hlcmVcclxuICAgICAqL1xyXG4gICAgYWRkUGF0aEF0dHJpYnV0ZVRvRmlsZXMod2hlcmUpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5nZXRTdG9yZXMoKSwgKHN0b3JlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gc3RvcmUuZ2V0Q29sbGVjdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCB1cGRhdGUgb25seSBmaWxlcyB3aXRoIG5vIHBhdGggc2V0XHJcbiAgICAgICAgICAgIGZpbGVzLmZpbmQod2hlcmUgfHwge3BhdGg6IG51bGx9LCB7ZmllbGRzOiB7X2lkOiAxfX0pLmZvckVhY2goKGZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLmRpcmVjdC51cGRhdGUoZmlsZS5faWQsIHskc2V0OiB7cGF0aDogc3RvcmUuZ2V0RmlsZVJlbGF0aXZlVVJMKGZpbGUuX2lkKX19KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXJzIHRoZSBzdG9yZVxyXG4gICAgICogQHBhcmFtIHN0b3JlXHJcbiAgICAgKi9cclxuICAgIGFkZFN0b3JlKHN0b3JlKSB7XHJcbiAgICAgICAgaWYgKCEoc3RvcmUgaW5zdGFuY2VvZiBTdG9yZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgdWZzOiBzdG9yZSBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgVXBsb2FkRlMuU3RvcmUuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0b3Jlc1tzdG9yZS5nZXROYW1lKCldID0gc3RvcmU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGVzIGEgdW5pcXVlIEVUYWdcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2VuZXJhdGVFdGFnKCkge1xyXG4gICAgICAgIHJldHVybiBSYW5kb20uaWQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBNSU1FIHR5cGUgb2YgdGhlIGV4dGVuc2lvblxyXG4gICAgICogQHBhcmFtIGV4dGVuc2lvblxyXG4gICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgKi9cclxuICAgIGdldE1pbWVUeXBlKGV4dGVuc2lvbikge1xyXG4gICAgICAgIGV4dGVuc2lvbiA9IGV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIHJldHVybiBNSU1FW2V4dGVuc2lvbl07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbGwgTUlNRSB0eXBlc1xyXG4gICAgICovXHJcbiAgICBnZXRNaW1lVHlwZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIE1JTUU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgc3RvcmUgYnkgaXRzIG5hbWVcclxuICAgICAqIEBwYXJhbSBuYW1lXHJcbiAgICAgKiBAcmV0dXJuIHtVcGxvYWRGUy5TdG9yZX1cclxuICAgICAqL1xyXG4gICAgZ2V0U3RvcmUobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBzdG9yZXNbbmFtZV07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbGwgc3RvcmVzXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAgICAgKi9cclxuICAgIGdldFN0b3JlcygpIHtcclxuICAgICAgICByZXR1cm4gc3RvcmVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHRlbXBvcmFyeSBmaWxlIHBhdGhcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0VGVtcEZpbGVQYXRoKGZpbGVJZCkge1xyXG4gICAgICAgIHJldHVybiBgJHt0aGlzLmNvbmZpZy50bXBEaXJ9LyR7ZmlsZUlkfWA7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW1wb3J0cyBhIGZpbGUgZnJvbSBhIFVSTFxyXG4gICAgICogQHBhcmFtIHVybFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSBzdG9yZVxyXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIGltcG9ydEZyb21VUkwodXJsLCBmaWxlLCBzdG9yZSwgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAodHlwZW9mIHN0b3JlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBNZXRlb3IuY2FsbCgndWZzSW1wb3J0VVJMJywgdXJsLCBmaWxlLCBzdG9yZSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc3RvcmUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHN0b3JlLmltcG9ydEZyb21VUkwodXJsLCBmaWxlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgZmlsZSBhbmQgZGF0YSBhcyBBcnJheUJ1ZmZlciBmb3IgZWFjaCBmaWxlcyBpbiB0aGUgZXZlbnRcclxuICAgICAqIEBkZXByZWNhdGVkXHJcbiAgICAgKiBAcGFyYW0gZXZlbnRcclxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgICByZWFkQXNBcnJheUJ1ZmZlciAoZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignVXBsb2FkRlMucmVhZEFzQXJyYXlCdWZmZXIgaXMgZGVwcmVjYXRlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYWxpay9qYWxpay11ZnMjdXBsb2FkaW5nLWZyb20tYS1maWxlJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlbnMgYSBkaWFsb2cgdG8gc2VsZWN0IGEgc2luZ2xlIGZpbGVcclxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgICBzZWxlY3RGaWxlKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgIGlucHV0LnR5cGUgPSAnZmlsZSc7XHJcbiAgICAgICAgaW5wdXQubXVsdGlwbGUgPSBmYWxzZTtcclxuICAgICAgICBpbnB1dC5vbmNoYW5nZSA9IChldikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZmlsZXMgPSBldi50YXJnZXQuZmlsZXM7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoVXBsb2FkRlMsIGZpbGVzWzBdKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEZpeCBmb3IgaU9TL1NhZmFyaVxyXG4gICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSAndWZzLWZpbGUtc2VsZWN0b3InO1xyXG4gICAgICAgIGRpdi5zdHlsZSA9ICdkaXNwbGF5Om5vbmU7IGhlaWdodDowOyB3aWR0aDowOyBvdmVyZmxvdzogaGlkZGVuOyc7XHJcbiAgICAgICAgZGl2LmFwcGVuZENoaWxkKGlucHV0KTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XHJcbiAgICAgICAgLy8gVHJpZ2dlciBmaWxlIHNlbGVjdGlvblxyXG4gICAgICAgIGlucHV0LmNsaWNrKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlbnMgYSBkaWFsb2cgdG8gc2VsZWN0IG11bHRpcGxlIGZpbGVzXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgc2VsZWN0RmlsZXMoY2FsbGJhY2spIHtcclxuICAgICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgaW5wdXQudHlwZSA9ICdmaWxlJztcclxuICAgICAgICBpbnB1dC5tdWx0aXBsZSA9IHRydWU7XHJcbiAgICAgICAgaW5wdXQub25jaGFuZ2UgPSAoZXYpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSBldi50YXJnZXQuZmlsZXM7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKFVwbG9hZEZTLCBmaWxlc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEZpeCBmb3IgaU9TL1NhZmFyaVxyXG4gICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSAndWZzLWZpbGUtc2VsZWN0b3InO1xyXG4gICAgICAgIGRpdi5zdHlsZSA9ICdkaXNwbGF5Om5vbmU7IGhlaWdodDowOyB3aWR0aDowOyBvdmVyZmxvdzogaGlkZGVuOyc7XHJcbiAgICAgICAgZGl2LmFwcGVuZENoaWxkKGlucHV0KTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XHJcbiAgICAgICAgLy8gVHJpZ2dlciBmaWxlIHNlbGVjdGlvblxyXG4gICAgICAgIGlucHV0LmNsaWNrKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5cclxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xyXG4gICAgcmVxdWlyZSgnLi91ZnMtdGVtcGxhdGUtaGVscGVycycpO1xyXG59XHJcbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuICAgIHJlcXVpcmUoJy4vdWZzLW1ldGhvZHMnKTtcclxuICAgIHJlcXVpcmUoJy4vdWZzLXNlcnZlcicpO1xyXG59XHJcblxyXG4vKipcclxuICogVXBsb2FkRlMgQ29uZmlndXJhdGlvblxyXG4gKiBAdHlwZSB7Q29uZmlnfVxyXG4gKi9cclxuVXBsb2FkRlMuY29uZmlnID0gbmV3IENvbmZpZygpO1xyXG5cclxuLy8gQWRkIGNsYXNzZXMgdG8gZ2xvYmFsIG5hbWVzcGFjZVxyXG5VcGxvYWRGUy5Db25maWcgPSBDb25maWc7XHJcblVwbG9hZEZTLkZpbHRlciA9IEZpbHRlcjtcclxuVXBsb2FkRlMuU3RvcmUgPSBTdG9yZTtcclxuVXBsb2FkRlMuU3RvcmVQZXJtaXNzaW9ucyA9IFN0b3JlUGVybWlzc2lvbnM7XHJcblVwbG9hZEZTLlVwbG9hZGVyID0gVXBsb2FkZXI7XHJcblxyXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XHJcbiAgICAvLyBFeHBvc2UgdGhlIG1vZHVsZSBnbG9iYWxseVxyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgZ2xvYmFsWydVcGxvYWRGUyddID0gVXBsb2FkRlM7XHJcbiAgICB9XHJcbn1cclxuZWxzZSBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XHJcbiAgICAvLyBFeHBvc2UgdGhlIG1vZHVsZSBnbG9iYWxseVxyXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgd2luZG93LlVwbG9hZEZTID0gVXBsb2FkRlM7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge199IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcclxuaW1wb3J0IHtNZXRlb3J9IGZyb20gJ21ldGVvci9tZXRlb3InO1xyXG5pbXBvcnQge1N0b3JlUGVybWlzc2lvbnN9IGZyb20gJy4vdWZzLXN0b3JlLXBlcm1pc3Npb25zJztcclxuXHJcblxyXG4vKipcclxuICogVXBsb2FkRlMgY29uZmlndXJhdGlvblxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENvbmZpZyB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIC8vIERlZmF1bHQgb3B0aW9uc1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGRlZmF1bHRTdG9yZVBlcm1pc3Npb25zOiBudWxsLFxyXG4gICAgICAgICAgICBodHRwczogZmFsc2UsXHJcbiAgICAgICAgICAgIHNpbXVsYXRlUmVhZERlbGF5OiAwLFxyXG4gICAgICAgICAgICBzaW11bGF0ZVVwbG9hZFNwZWVkOiAwLFxyXG4gICAgICAgICAgICBzaW11bGF0ZVdyaXRlRGVsYXk6IDAsXHJcbiAgICAgICAgICAgIHN0b3Jlc1BhdGg6ICd1ZnMnLFxyXG4gICAgICAgICAgICB0bXBEaXI6ICcvdG1wL3VmcycsXHJcbiAgICAgICAgICAgIHRtcERpclBlcm1pc3Npb25zOiAnMDcwMCdcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgb3B0aW9uc1xyXG4gICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRTdG9yZVBlcm1pc3Npb25zICYmICEob3B0aW9ucy5kZWZhdWx0U3RvcmVQZXJtaXNzaW9ucyBpbnN0YW5jZW9mIFN0b3JlUGVybWlzc2lvbnMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbmZpZzogZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgaXMgbm90IGFuIGluc3RhbmNlIG9mIFN0b3JlUGVybWlzc2lvbnMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmh0dHBzICE9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29uZmlnOiBodHRwcyBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc2ltdWxhdGVSZWFkRGVsYXkgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbmZpZzogc2ltdWxhdGVSZWFkRGVsYXkgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zaW11bGF0ZVVwbG9hZFNwZWVkICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25maWc6IHNpbXVsYXRlVXBsb2FkU3BlZWQgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zaW11bGF0ZVdyaXRlRGVsYXkgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbmZpZzogc2ltdWxhdGVXcml0ZURlbGF5IGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3RvcmVzUGF0aCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29uZmlnOiBzdG9yZXNQYXRoIGlzIG5vdCBhIHN0cmluZycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG1wRGlyICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25maWc6IHRtcERpciBpcyBub3QgYSBzdHJpbmcnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRtcERpclBlcm1pc3Npb25zICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25maWc6IHRtcERpclBlcm1pc3Npb25zIGlzIG5vdCBhIHN0cmluZycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBzdG9yZSBwZXJtaXNzaW9uc1xyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRGUy5TdG9yZVBlcm1pc3Npb25zfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgPSBvcHRpb25zLmRlZmF1bHRTdG9yZVBlcm1pc3Npb25zO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFVzZSBvciBub3Qgc2VjdXJlZCBwcm90b2NvbCBpbiBVUkxTXHJcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5odHRwcyA9IG9wdGlvbnMuaHR0cHM7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHNpbXVsYXRpb24gcmVhZCBkZWxheVxyXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaW11bGF0ZVJlYWREZWxheSA9IHBhcnNlSW50KG9wdGlvbnMuc2ltdWxhdGVSZWFkRGVsYXkpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBzaW11bGF0aW9uIHVwbG9hZCBzcGVlZFxyXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaW11bGF0ZVVwbG9hZFNwZWVkID0gcGFyc2VJbnQob3B0aW9ucy5zaW11bGF0ZVVwbG9hZFNwZWVkKTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGUgc2ltdWxhdGlvbiB3cml0ZSBkZWxheVxyXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaW11bGF0ZVdyaXRlRGVsYXkgPSBwYXJzZUludChvcHRpb25zLnNpbXVsYXRlV3JpdGVEZWxheSk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIFVSTCByb290IHBhdGggb2Ygc3RvcmVzXHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0b3Jlc1BhdGggPSBvcHRpb25zLnN0b3Jlc1BhdGg7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHRlbXBvcmFyeSBkaXJlY3Rvcnkgb2YgdXBsb2FkaW5nIGZpbGVzXHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRtcERpciA9IG9wdGlvbnMudG1wRGlyO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBwZXJtaXNzaW9ucyBvZiB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeVxyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50bXBEaXJQZXJtaXNzaW9ucyA9IG9wdGlvbnMudG1wRGlyUGVybWlzc2lvbnM7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcbmltcG9ydCB7X30gZnJvbSBcIm1ldGVvci91bmRlcnNjb3JlXCI7XHJcbmltcG9ydCB7TWV0ZW9yfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaWxlIGZpbHRlclxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEZpbHRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBEZWZhdWx0IG9wdGlvbnNcclxuICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe1xyXG4gICAgICAgICAgICBjb250ZW50VHlwZXM6IG51bGwsXHJcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IG51bGwsXHJcbiAgICAgICAgICAgIG1pblNpemU6IDEsXHJcbiAgICAgICAgICAgIG1heFNpemU6IDAsXHJcbiAgICAgICAgICAgIG9uQ2hlY2s6IHRoaXMub25DaGVja1xyXG4gICAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBvcHRpb25zXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY29udGVudFR5cGVzICYmICEob3B0aW9ucy5jb250ZW50VHlwZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZpbHRlcjogY29udGVudFR5cGVzIGlzIG5vdCBhbiBBcnJheVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZXh0ZW5zaW9ucyAmJiAhKG9wdGlvbnMuZXh0ZW5zaW9ucyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmlsdGVyOiBleHRlbnNpb25zIGlzIG5vdCBhbiBBcnJheVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1pblNpemUgIT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZpbHRlcjogbWluU2l6ZSBpcyBub3QgYSBudW1iZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5tYXhTaXplICE9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGaWx0ZXI6IG1heFNpemUgaXMgbm90IGEgbnVtYmVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5vbkNoZWNrICYmIHR5cGVvZiBvcHRpb25zLm9uQ2hlY2sgIT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmlsdGVyOiBvbkNoZWNrIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHVibGljIGF0dHJpYnV0ZXNcclxuICAgICAgICBzZWxmLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIF8uZWFjaChbXHJcbiAgICAgICAgICAgICdvbkNoZWNrJ1xyXG4gICAgICAgIF0sIChtZXRob2QpID0+IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW21ldGhvZF0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHNlbGZbbWV0aG9kXSA9IG9wdGlvbnNbbWV0aG9kXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHRoZSBmaWxlXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBjaGVjayhmaWxlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmaWxlICE9PSBcIm9iamVjdFwiIHx8ICFmaWxlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZScsIFwiRmlsZSBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIHNpemVcclxuICAgICAgICBpZiAoZmlsZS5zaXplIDw9IDAgfHwgZmlsZS5zaXplIDwgdGhpcy5nZXRNaW5TaXplKCkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZmlsZS10b28tc21hbGwnLCBgRmlsZSBzaXplIGlzIHRvbyBzbWFsbCAobWluID0gJHt0aGlzLmdldE1pblNpemUoKX0pYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmdldE1heFNpemUoKSA+IDAgJiYgZmlsZS5zaXplID4gdGhpcy5nZXRNYXhTaXplKCkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZmlsZS10b28tbGFyZ2UnLCBgRmlsZSBzaXplIGlzIHRvbyBsYXJnZSAobWF4ID0gJHt0aGlzLmdldE1heFNpemUoKX0pYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIGV4dGVuc2lvblxyXG4gICAgICAgIGlmICh0aGlzLmdldEV4dGVuc2lvbnMoKSAmJiAhXy5jb250YWlucyh0aGlzLmdldEV4dGVuc2lvbnMoKSwgZmlsZS5leHRlbnNpb24pKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZS1leHRlbnNpb24nLCBgRmlsZSBleHRlbnNpb24gXCIke2ZpbGUuZXh0ZW5zaW9ufVwiIGlzIG5vdCBhY2NlcHRlZGApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDaGVjayBjb250ZW50IHR5cGVcclxuICAgICAgICBpZiAodGhpcy5nZXRDb250ZW50VHlwZXMoKSAmJiAhdGhpcy5pc0NvbnRlbnRUeXBlSW5MaXN0KGZpbGUudHlwZSwgdGhpcy5nZXRDb250ZW50VHlwZXMoKSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWxlLXR5cGUnLCBgRmlsZSB0eXBlIFwiJHtmaWxlLnR5cGV9XCIgaXMgbm90IGFjY2VwdGVkYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEFwcGx5IGN1c3RvbSBjaGVja1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vbkNoZWNrID09PSAnZnVuY3Rpb24nICYmICF0aGlzLm9uQ2hlY2soZmlsZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWxlJywgXCJGaWxlIGRvZXMgbm90IG1hdGNoIGZpbHRlclwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBhbGxvd2VkIGNvbnRlbnQgdHlwZXNcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBnZXRDb250ZW50VHlwZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb250ZW50VHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBhbGxvd2VkIGV4dGVuc2lvbnNcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBnZXRFeHRlbnNpb25zKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIG1heGltdW0gZmlsZSBzaXplXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldE1heFNpemUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tYXhTaXplO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbWluaW11bSBmaWxlIHNpemVcclxuICAgICAqIEByZXR1cm4ge051bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0TWluU2l6ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm1pblNpemU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgaWYgY29udGVudCB0eXBlIGlzIGluIHRoZSBnaXZlbiBsaXN0XHJcbiAgICAgKiBAcGFyYW0gdHlwZVxyXG4gICAgICogQHBhcmFtIGxpc3RcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGlzQ29udGVudFR5cGVJbkxpc3QodHlwZSwgbGlzdCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgJiYgbGlzdCBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKGxpc3QsIHR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCB3aWxkQ2FyZEdsb2IgPSAnLyonO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdpbGRjYXJkcyA9IF8uZmlsdGVyKGxpc3QsIChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaW5kZXhPZih3aWxkQ2FyZEdsb2IpID4gMDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKHdpbGRjYXJkcywgdHlwZS5yZXBsYWNlKC8oXFwvLiopJC8sIHdpbGRDYXJkR2xvYikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIGlmIHRoZSBmaWxlIG1hdGNoZXMgZmlsdGVyXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgaXNWYWxpZChmaWxlKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5jaGVjayhmaWxlKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyBjdXN0b20gY2hlY2tzXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgb25DaGVjayhmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge199IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcclxuaW1wb3J0IHtjaGVja30gZnJvbSAnbWV0ZW9yL2NoZWNrJztcclxuaW1wb3J0IHtNZXRlb3J9IGZyb20gJ21ldGVvci9tZXRlb3InO1xyXG5pbXBvcnQge1VwbG9hZEZTfSBmcm9tICcuL3Vmcyc7XHJcbmltcG9ydCB7RmlsdGVyfSBmcm9tICcuL3Vmcy1maWx0ZXInO1xyXG5pbXBvcnQge1Rva2Vuc30gZnJvbSAnLi91ZnMtdG9rZW5zJztcclxuXHJcbmNvbnN0IGZzID0gTnBtLnJlcXVpcmUoJ2ZzJyk7XHJcbmNvbnN0IGh0dHAgPSBOcG0ucmVxdWlyZSgnaHR0cCcpO1xyXG5jb25zdCBodHRwcyA9IE5wbS5yZXF1aXJlKCdodHRwcycpO1xyXG5jb25zdCBGdXR1cmUgPSBOcG0ucmVxdWlyZSgnZmliZXJzL2Z1dHVyZScpO1xyXG5cclxuXHJcbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuICAgIE1ldGVvci5tZXRob2RzKHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tcGxldGVzIHRoZSBmaWxlIHRyYW5zZmVyXHJcbiAgICAgICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICAgICAqIEBwYXJhbSBzdG9yZU5hbWVcclxuICAgICAgICAgKiBAcGFyYW0gdG9rZW5cclxuICAgICAgICAgKi9cclxuICAgICAgICB1ZnNDb21wbGV0ZShmaWxlSWQsIHN0b3JlTmFtZSwgdG9rZW4pIHtcclxuICAgICAgICAgICAgY2hlY2soZmlsZUlkLCBTdHJpbmcpO1xyXG4gICAgICAgICAgICBjaGVjayhzdG9yZU5hbWUsIFN0cmluZyk7XHJcbiAgICAgICAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlXHJcbiAgICAgICAgICAgIGxldCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKHN0b3JlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc3RvcmUnLCBcIlN0b3JlIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBDaGVjayB0b2tlblxyXG4gICAgICAgICAgICBpZiAoIXN0b3JlLmNoZWNrVG9rZW4odG9rZW4sIGZpbGVJZCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdG9rZW4nLCBcIlRva2VuIGlzIG5vdCB2YWxpZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGZ1dCA9IG5ldyBGdXR1cmUoKTtcclxuICAgICAgICAgICAgbGV0IHRtcEZpbGUgPSBVcGxvYWRGUy5nZXRUZW1wRmlsZVBhdGgoZmlsZUlkKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZVRlbXBGaWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZnMudW5saW5rKHRtcEZpbGUsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihgdWZzOiBjYW5ub3QgZGVsZXRlIHRlbXAgZmlsZSBcIiR7dG1wRmlsZX1cIiAoJHtlcnIubWVzc2FnZX0pYCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyB0b2RvIGNoZWNrIGlmIHRlbXAgZmlsZSBleGlzdHNcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgZmlsZVxyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBzdG9yZS5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSBmaWxlIGJlZm9yZSBtb3ZpbmcgdG8gdGhlIHN0b3JlXHJcbiAgICAgICAgICAgICAgICBzdG9yZS52YWxpZGF0ZShmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHRlbXAgZmlsZVxyXG4gICAgICAgICAgICAgICAgbGV0IHJzID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3M6ICdyJyxcclxuICAgICAgICAgICAgICAgICAgICBlbmNvZGluZzogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBhdXRvQ2xvc2U6IHRydWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENsZWFuIHVwbG9hZCBpZiBlcnJvciBvY2N1cnNcclxuICAgICAgICAgICAgICAgIHJzLm9uKCdlcnJvcicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICBzdG9yZS5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1dC50aHJvdyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgZmlsZSBpbiB0aGUgc3RvcmVcclxuICAgICAgICAgICAgICAgIHN0b3JlLndyaXRlKHJzLCBmaWxlSWQsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVyciwgZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVRlbXBGaWxlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnV0LnRocm93KGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlsZSBoYXMgYmVlbiBmdWxseSB1cGxvYWRlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGtlZXAgdGhlIHRva2VuIGFueW1vcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsc28gdGhpcyBlbnN1cmUgdGhhdCB0aGUgZmlsZSBjYW5ub3QgYmUgbW9kaWZpZWQgd2l0aCBleHRyYSBjaHVua3MgbGF0ZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFRva2Vucy5yZW1vdmUoe2ZpbGVJZDogZmlsZUlkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1dC5yZXR1cm4oZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHdyaXRlIGZhaWxlZCwgcmVtb3ZlIHRoZSBmaWxlXHJcbiAgICAgICAgICAgICAgICBzdG9yZS5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlVGVtcEZpbGUoKTsgLy8gdG9kbyByZW1vdmUgdGVtcCBmaWxlIG9uIGVycm9yIG9yIHRyeSBhZ2FpbiA/XHJcbiAgICAgICAgICAgICAgICBmdXQudGhyb3coZXJyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZnV0LndhaXQoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDcmVhdGVzIHRoZSBmaWxlIGFuZCByZXR1cm5zIHRoZSBmaWxlIHVwbG9hZCB0b2tlblxyXG4gICAgICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgICAgICogQHJldHVybiB7e2ZpbGVJZDogc3RyaW5nLCB0b2tlbjogKiwgdXJsOiAqfX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB1ZnNDcmVhdGUoZmlsZSkge1xyXG4gICAgICAgICAgICBjaGVjayhmaWxlLCBPYmplY3QpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWxlLm5hbWUgIT09ICdzdHJpbmcnIHx8ICFmaWxlLm5hbWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpbGUtbmFtZScsIFwiZmlsZSBuYW1lIGlzIG5vdCB2YWxpZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpbGUuc3RvcmUgIT09ICdzdHJpbmcnIHx8ICFmaWxlLnN0b3JlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1zdG9yZScsIFwic3RvcmUgaXMgbm90IHZhbGlkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIEdldCBzdG9yZVxyXG4gICAgICAgICAgICBsZXQgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShmaWxlLnN0b3JlKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1zdG9yZScsIFwiU3RvcmUgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgZGVmYXVsdCBpbmZvXHJcbiAgICAgICAgICAgIGZpbGUuY29tcGxldGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgZmlsZS51cGxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgZmlsZS5leHRlbnNpb24gPSBmaWxlLm5hbWUgJiYgZmlsZS5uYW1lLnN1YnN0cigofi1maWxlLm5hbWUubGFzdEluZGV4T2YoJy4nKSA+Pj4gMCkgKyAyKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAvLyBBc3NpZ24gZmlsZSBNSU1FIHR5cGUgYmFzZWQgb24gdGhlIGV4dGVuc2lvblxyXG4gICAgICAgICAgICBpZiAoZmlsZS5leHRlbnNpb24gJiYgIWZpbGUudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgZmlsZS50eXBlID0gVXBsb2FkRlMuZ2V0TWltZVR5cGUoZmlsZS5leHRlbnNpb24pIHx8ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSAwO1xyXG4gICAgICAgICAgICBmaWxlLnNpemUgPSBwYXJzZUludChmaWxlLnNpemUpIHx8IDA7XHJcbiAgICAgICAgICAgIGZpbGUudXNlcklkID0gZmlsZS51c2VySWQgfHwgdGhpcy51c2VySWQ7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgZmlsZSBtYXRjaGVzIHN0b3JlIGZpbHRlclxyXG4gICAgICAgICAgICBsZXQgZmlsdGVyID0gc3RvcmUuZ2V0RmlsdGVyKCk7XHJcbiAgICAgICAgICAgIGlmIChmaWx0ZXIgaW5zdGFuY2VvZiBGaWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGZpbHRlci5jaGVjayhmaWxlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBmaWxlXHJcbiAgICAgICAgICAgIGxldCBmaWxlSWQgPSBzdG9yZS5jcmVhdGUoZmlsZSk7XHJcbiAgICAgICAgICAgIGxldCB0b2tlbiA9IHN0b3JlLmNyZWF0ZVRva2VuKGZpbGVJZCk7XHJcbiAgICAgICAgICAgIGxldCB1cGxvYWRVcmwgPSBzdG9yZS5nZXRVUkwoYCR7ZmlsZUlkfT90b2tlbj0ke3Rva2VufWApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIGZpbGVJZDogZmlsZUlkLFxyXG4gICAgICAgICAgICAgICAgdG9rZW46IHRva2VuLFxyXG4gICAgICAgICAgICAgICAgdXJsOiB1cGxvYWRVcmxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZWxldGVzIGEgZmlsZVxyXG4gICAgICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAgICAgKiBAcGFyYW0gc3RvcmVOYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHRva2VuXHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdWZzRGVsZXRlKGZpbGVJZCwgc3RvcmVOYW1lLCB0b2tlbikge1xyXG4gICAgICAgICAgICBjaGVjayhmaWxlSWQsIFN0cmluZyk7XHJcbiAgICAgICAgICAgIGNoZWNrKHN0b3JlTmFtZSwgU3RyaW5nKTtcclxuICAgICAgICAgICAgY2hlY2sodG9rZW4sIFN0cmluZyk7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBzdG9yZVxyXG4gICAgICAgICAgICBsZXQgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXN0b3JlJywgXCJTdG9yZSBub3QgZm91bmRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWdub3JlIGZpbGVzIHRoYXQgZG9lcyBub3QgZXhpc3RcclxuICAgICAgICAgICAgaWYgKHN0b3JlLmdldENvbGxlY3Rpb24oKS5maW5kKHtfaWQ6IGZpbGVJZH0pLmNvdW50KCkgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRva2VuXHJcbiAgICAgICAgICAgIGlmICghc3RvcmUuY2hlY2tUb2tlbih0b2tlbiwgZmlsZUlkKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC10b2tlbicsIFwiVG9rZW4gaXMgbm90IHZhbGlkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzdG9yZS5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEltcG9ydHMgYSBmaWxlIGZyb20gdGhlIFVSTFxyXG4gICAgICAgICAqIEBwYXJhbSB1cmxcclxuICAgICAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICAgICAqIEBwYXJhbSBzdG9yZU5hbWVcclxuICAgICAgICAgKiBAcmV0dXJuIHsqfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHVmc0ltcG9ydFVSTCh1cmwsIGZpbGUsIHN0b3JlTmFtZSkge1xyXG4gICAgICAgICAgICBjaGVjayh1cmwsIFN0cmluZyk7XHJcbiAgICAgICAgICAgIGNoZWNrKGZpbGUsIE9iamVjdCk7XHJcbiAgICAgICAgICAgIGNoZWNrKHN0b3JlTmFtZSwgU3RyaW5nKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIFVSTFxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHVybCAhPT0gJ3N0cmluZycgfHwgdXJsLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXVybCcsIFwiVGhlIHVybCBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZmlsZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpbGUgIT09ICdvYmplY3QnIHx8IGZpbGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZScsIFwiVGhlIGZpbGUgaXMgbm90IHZhbGlkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHN0b3JlXHJcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUoc3RvcmVOYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1zdG9yZScsICdUaGUgc3RvcmUgZG9lcyBub3QgZXhpc3QnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRXh0cmFjdCBmaWxlIGluZm9cclxuICAgICAgICAgICAgaWYgKCFmaWxlLm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGZpbGUubmFtZSA9IHVybC5yZXBsYWNlKC9cXD8uKiQvLCAnJykuc3BsaXQoJy8nKS5wb3AoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZmlsZS5uYW1lICYmICFmaWxlLmV4dGVuc2lvbikge1xyXG4gICAgICAgICAgICAgICAgZmlsZS5leHRlbnNpb24gPSBmaWxlLm5hbWUgJiYgZmlsZS5uYW1lLnN1YnN0cigofi1maWxlLm5hbWUubGFzdEluZGV4T2YoJy4nKSA+Pj4gMCkgKyAyKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbiAmJiAhZmlsZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBc3NpZ24gZmlsZSBNSU1FIHR5cGUgYmFzZWQgb24gdGhlIGV4dGVuc2lvblxyXG4gICAgICAgICAgICAgICAgZmlsZS50eXBlID0gVXBsb2FkRlMuZ2V0TWltZVR5cGUoZmlsZS5leHRlbnNpb24pIHx8ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGZpbGUgaXMgdmFsaWRcclxuICAgICAgICAgICAgaWYgKHN0b3JlLmdldEZpbHRlcigpIGluc3RhbmNlb2YgRmlsdGVyKSB7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5nZXRGaWx0ZXIoKS5jaGVjayhmaWxlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZpbGUub3JpZ2luYWxVcmwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgdWZzOiBUaGUgXCJvcmlnaW5hbFVybFwiIGF0dHJpYnV0ZSBpcyBhdXRvbWF0aWNhbGx5IHNldCB3aGVuIGltcG9ydGluZyBhIGZpbGUgZnJvbSBhIFVSTGApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgb3JpZ2luYWwgVVJMXHJcbiAgICAgICAgICAgIGZpbGUub3JpZ2luYWxVcmwgPSB1cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGZpbGVcclxuICAgICAgICAgICAgZmlsZS5jb21wbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmaWxlLnVwbG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSAwO1xyXG4gICAgICAgICAgICBmaWxlLl9pZCA9IHN0b3JlLmNyZWF0ZShmaWxlKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBmdXQgPSBuZXcgRnV0dXJlKCk7XHJcbiAgICAgICAgICAgIGxldCBwcm90bztcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVjdCBwcm90b2NvbCB0byB1c2VcclxuICAgICAgICAgICAgaWYgKC9odHRwOlxcL1xcLy9pLnRlc3QodXJsKSkge1xyXG4gICAgICAgICAgICAgICAgcHJvdG8gPSBodHRwO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9odHRwczpcXC9cXC8vaS50ZXN0KHVybCkpIHtcclxuICAgICAgICAgICAgICAgIHByb3RvID0gaHR0cHM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudW5ibG9jaygpO1xyXG5cclxuICAgICAgICAgICAgLy8gRG93bmxvYWQgZmlsZVxyXG4gICAgICAgICAgICBwcm90by5nZXQodXJsLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChyZXMpIHtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGZpbGUgaW4gdGhlIHN0b3JlXHJcbiAgICAgICAgICAgICAgICBzdG9yZS53cml0ZShyZXMsIGZpbGUuX2lkLCBmdW5jdGlvbiAoZXJyLCBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdXQudGhyb3coZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdXQucmV0dXJuKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KSkub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgZnV0LnRocm93KGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gZnV0LndhaXQoKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBNYXJrcyB0aGUgZmlsZSB1cGxvYWRpbmcgYXMgc3RvcHBlZFxyXG4gICAgICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAgICAgKiBAcGFyYW0gc3RvcmVOYW1lXHJcbiAgICAgICAgICogQHBhcmFtIHRva2VuXHJcbiAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdWZzU3RvcChmaWxlSWQsIHN0b3JlTmFtZSwgdG9rZW4pIHtcclxuICAgICAgICAgICAgY2hlY2soZmlsZUlkLCBTdHJpbmcpO1xyXG4gICAgICAgICAgICBjaGVjayhzdG9yZU5hbWUsIFN0cmluZyk7XHJcbiAgICAgICAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgc3RvcmVcclxuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXN0b3JlJywgXCJTdG9yZSBub3QgZm91bmRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZmlsZVxyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gc3RvcmUuZ2V0Q29sbGVjdGlvbigpLmZpbmQoe19pZDogZmlsZUlkfSwge2ZpZWxkczoge3VzZXJJZDogMX19KTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpbGUnLCBcIkZpbGUgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRva2VuXHJcbiAgICAgICAgICAgIGlmICghc3RvcmUuY2hlY2tUb2tlbih0b2tlbiwgZmlsZUlkKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC10b2tlbicsIFwiVG9rZW4gaXMgbm90IHZhbGlkXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RvcmUuZ2V0Q29sbGVjdGlvbigpLnVwZGF0ZSh7X2lkOiBmaWxlSWR9LCB7XHJcbiAgICAgICAgICAgICAgICAkc2V0OiB7dXBsb2FkaW5nOiBmYWxzZX1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG4vKipcclxuICogTUlNRSB0eXBlcyBhbmQgZXh0ZW5zaW9uc1xyXG4gKi9cclxuZXhwb3J0IGNvbnN0IE1JTUUgPSB7XHJcblxyXG4gICAgLy8gYXBwbGljYXRpb25cclxuICAgICc3eic6ICdhcHBsaWNhdGlvbi94LTd6LWNvbXByZXNzZWQnLFxyXG4gICAgJ2FyYyc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxyXG4gICAgJ2FpJzogJ2FwcGxpY2F0aW9uL3Bvc3RzY3JpcHQnLFxyXG4gICAgJ2Jpbic6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxyXG4gICAgJ2J6JzogJ2FwcGxpY2F0aW9uL3gtYnppcCcsXHJcbiAgICAnYnoyJzogJ2FwcGxpY2F0aW9uL3gtYnppcDInLFxyXG4gICAgJ2Vwcyc6ICdhcHBsaWNhdGlvbi9wb3N0c2NyaXB0JyxcclxuICAgICdleGUnOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcclxuICAgICdneic6ICdhcHBsaWNhdGlvbi94LWd6aXAnLFxyXG4gICAgJ2d6aXAnOiAnYXBwbGljYXRpb24veC1nemlwJyxcclxuICAgICdqcyc6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcclxuICAgICdqc29uJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgJ29neCc6ICdhcHBsaWNhdGlvbi9vZ2cnLFxyXG4gICAgJ3BkZic6ICdhcHBsaWNhdGlvbi9wZGYnLFxyXG4gICAgJ3BzJzogJ2FwcGxpY2F0aW9uL3Bvc3RzY3JpcHQnLFxyXG4gICAgJ3BzZCc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxyXG4gICAgJ3Jhcic6ICdhcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkJyxcclxuICAgICdyZXYnOiAnYXBwbGljYXRpb24veC1yYXItY29tcHJlc3NlZCcsXHJcbiAgICAnc3dmJzogJ2FwcGxpY2F0aW9uL3gtc2hvY2t3YXZlLWZsYXNoJyxcclxuICAgICd0YXInOiAnYXBwbGljYXRpb24veC10YXInLFxyXG4gICAgJ3hodG1sJzogJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcsXHJcbiAgICAneG1sJzogJ2FwcGxpY2F0aW9uL3htbCcsXHJcbiAgICAnemlwJzogJ2FwcGxpY2F0aW9uL3ppcCcsXHJcblxyXG4gICAgLy8gYXVkaW9cclxuICAgICdhaWYnOiAnYXVkaW8vYWlmZicsXHJcbiAgICAnYWlmYyc6ICdhdWRpby9haWZmJyxcclxuICAgICdhaWZmJzogJ2F1ZGlvL2FpZmYnLFxyXG4gICAgJ2F1JzogJ2F1ZGlvL2Jhc2ljJyxcclxuICAgICdmbGFjJzogJ2F1ZGlvL2ZsYWMnLFxyXG4gICAgJ21pZGknOiAnYXVkaW8vbWlkaScsXHJcbiAgICAnbXAyJzogJ2F1ZGlvL21wZWcnLFxyXG4gICAgJ21wMyc6ICdhdWRpby9tcGVnJyxcclxuICAgICdtcGEnOiAnYXVkaW8vbXBlZycsXHJcbiAgICAnb2dhJzogJ2F1ZGlvL29nZycsXHJcbiAgICAnb2dnJzogJ2F1ZGlvL29nZycsXHJcbiAgICAnb3B1cyc6ICdhdWRpby9vZ2cnLFxyXG4gICAgJ3JhJzogJ2F1ZGlvL3ZuZC5ybi1yZWFsYXVkaW8nLFxyXG4gICAgJ3NweCc6ICdhdWRpby9vZ2cnLFxyXG4gICAgJ3dhdic6ICdhdWRpby94LXdhdicsXHJcbiAgICAnd2ViYSc6ICdhdWRpby93ZWJtJyxcclxuICAgICd3bWEnOiAnYXVkaW8veC1tcy13bWEnLFxyXG5cclxuICAgIC8vIGltYWdlXHJcbiAgICAnYXZzJzogJ2ltYWdlL2F2cy12aWRlbycsXHJcbiAgICAnYm1wJzogJ2ltYWdlL3gtd2luZG93cy1ibXAnLFxyXG4gICAgJ2dpZic6ICdpbWFnZS9naWYnLFxyXG4gICAgJ2ljbyc6ICdpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nLFxyXG4gICAgJ2pwZWcnOiAnaW1hZ2UvanBlZycsXHJcbiAgICAnanBnJzogJ2ltYWdlL2pwZycsXHJcbiAgICAnbWpwZyc6ICdpbWFnZS94LW1vdGlvbi1qcGVnJyxcclxuICAgICdwaWMnOiAnaW1hZ2UvcGljJyxcclxuICAgICdwbmcnOiAnaW1hZ2UvcG5nJyxcclxuICAgICdzdmcnOiAnaW1hZ2Uvc3ZnK3htbCcsXHJcbiAgICAndGlmJzogJ2ltYWdlL3RpZmYnLFxyXG4gICAgJ3RpZmYnOiAnaW1hZ2UvdGlmZicsXHJcblxyXG4gICAgLy8gdGV4dFxyXG4gICAgJ2Nzcyc6ICd0ZXh0L2NzcycsXHJcbiAgICAnY3N2JzogJ3RleHQvY3N2JyxcclxuICAgICdodG1sJzogJ3RleHQvaHRtbCcsXHJcbiAgICAndHh0JzogJ3RleHQvcGxhaW4nLFxyXG5cclxuICAgIC8vIHZpZGVvXHJcbiAgICAnYXZpJzogJ3ZpZGVvL2F2aScsXHJcbiAgICAnZHYnOiAndmlkZW8veC1kdicsXHJcbiAgICAnZmx2JzogJ3ZpZGVvL3gtZmx2JyxcclxuICAgICdtb3YnOiAndmlkZW8vcXVpY2t0aW1lJyxcclxuICAgICdtcDQnOiAndmlkZW8vbXA0JyxcclxuICAgICdtcGVnJzogJ3ZpZGVvL21wZWcnLFxyXG4gICAgJ21wZyc6ICd2aWRlby9tcGcnLFxyXG4gICAgJ29ndic6ICd2aWRlby9vZ2cnLFxyXG4gICAgJ3Zkbyc6ICd2aWRlby92ZG8nLFxyXG4gICAgJ3dlYm0nOiAndmlkZW8vd2VibScsXHJcbiAgICAnd212JzogJ3ZpZGVvL3gtbXMtd212JyxcclxuXHJcbiAgICAvLyBzcGVjaWZpYyB0byB2ZW5kb3JzXHJcbiAgICAnZG9jJzogJ2FwcGxpY2F0aW9uL21zd29yZCcsXHJcbiAgICAnZG9jeCc6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCcsXHJcbiAgICAnb2RiJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuZGF0YWJhc2UnLFxyXG4gICAgJ29kYyc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmNoYXJ0JyxcclxuICAgICdvZGYnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5mb3JtdWxhJyxcclxuICAgICdvZGcnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5ncmFwaGljcycsXHJcbiAgICAnb2RpJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuaW1hZ2UnLFxyXG4gICAgJ29kbSc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQtbWFzdGVyJyxcclxuICAgICdvZHAnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb24nLFxyXG4gICAgJ29kcyc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0JyxcclxuICAgICdvZHQnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0JyxcclxuICAgICdvdGcnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5ncmFwaGljcy10ZW1wbGF0ZScsXHJcbiAgICAnb3RwJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQucHJlc2VudGF0aW9uLXRlbXBsYXRlJyxcclxuICAgICdvdHMnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5zcHJlYWRzaGVldC10ZW1wbGF0ZScsXHJcbiAgICAnb3R0JzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC10ZW1wbGF0ZScsXHJcbiAgICAncHB0JzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1wb3dlcnBvaW50JyxcclxuICAgICdwcHR4JzogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5wcmVzZW50YXRpb24nLFxyXG4gICAgJ3hscyc6ICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnLFxyXG4gICAgJ3hsc3gnOiAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQnXHJcbn07XHJcbiIsIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5pbXBvcnQge199IGZyb20gXCJtZXRlb3IvdW5kZXJzY29yZVwiO1xyXG5pbXBvcnQge01ldGVvcn0gZnJvbSBcIm1ldGVvci9tZXRlb3JcIjtcclxuaW1wb3J0IHtXZWJBcHB9IGZyb20gXCJtZXRlb3Ivd2ViYXBwXCI7XHJcbmltcG9ydCB7VXBsb2FkRlN9IGZyb20gXCIuL3Vmc1wiO1xyXG5cclxuXHJcbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuXHJcbiAgICBjb25zdCBkb21haW4gPSBOcG0ucmVxdWlyZSgnZG9tYWluJyk7XHJcbiAgICBjb25zdCBmcyA9IE5wbS5yZXF1aXJlKCdmcycpO1xyXG4gICAgY29uc3QgaHR0cCA9IE5wbS5yZXF1aXJlKCdodHRwJyk7XHJcbiAgICBjb25zdCBodHRwcyA9IE5wbS5yZXF1aXJlKCdodHRwcycpO1xyXG4gICAgY29uc3QgbWtkaXJwID0gTnBtLnJlcXVpcmUoJ21rZGlycCcpO1xyXG4gICAgY29uc3Qgc3RyZWFtID0gTnBtLnJlcXVpcmUoJ3N0cmVhbScpO1xyXG4gICAgY29uc3QgVVJMID0gTnBtLnJlcXVpcmUoJ3VybCcpO1xyXG4gICAgY29uc3QgemxpYiA9IE5wbS5yZXF1aXJlKCd6bGliJyk7XHJcblxyXG5cclxuICAgIE1ldGVvci5zdGFydHVwKCgpID0+IHtcclxuICAgICAgICBsZXQgcGF0aCA9IFVwbG9hZEZTLmNvbmZpZy50bXBEaXI7XHJcbiAgICAgICAgbGV0IG1vZGUgPSBVcGxvYWRGUy5jb25maWcudG1wRGlyUGVybWlzc2lvbnM7XHJcblxyXG4gICAgICAgIGZzLnN0YXQocGF0aCwgKGVycikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHRlbXAgZGlyZWN0b3J5XHJcbiAgICAgICAgICAgICAgICBta2RpcnAocGF0aCwge21vZGU6IG1vZGV9LCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGB1ZnM6IGNhbm5vdCBjcmVhdGUgdGVtcCBkaXJlY3RvcnkgYXQgXCIke3BhdGh9XCIgKCR7ZXJyLm1lc3NhZ2V9KWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGB1ZnM6IHRlbXAgZGlyZWN0b3J5IGNyZWF0ZWQgYXQgXCIke3BhdGh9XCJgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFNldCBkaXJlY3RvcnkgcGVybWlzc2lvbnNcclxuICAgICAgICAgICAgICAgIGZzLmNobW9kKHBhdGgsIG1vZGUsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihgdWZzOiBjYW5ub3Qgc2V0IHRlbXAgZGlyZWN0b3J5IHBlcm1pc3Npb25zICR7bW9kZX0gKCR7ZXJyLm1lc3NhZ2V9KWApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBkb21haW4gdG8gaGFuZGxlIGVycm9yc1xyXG4gICAgLy8gYW5kIHBvc3NpYmx5IGF2b2lkIHNlcnZlciBjcmFzaGVzLlxyXG4gICAgbGV0IGQgPSBkb21haW4uY3JlYXRlKCk7XHJcblxyXG4gICAgZC5vbignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcigndWZzOiAnICsgZXJyLm1lc3NhZ2UpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTGlzdGVuIEhUVFAgcmVxdWVzdHMgdG8gc2VydmUgZmlsZXNcclxuICAgIFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgIC8vIFF1aWNrIGNoZWNrIHRvIHNlZSBpZiByZXF1ZXN0IHNob3VsZCBiZSBjYXRjaFxyXG4gICAgICAgIGlmIChyZXEudXJsLmluZGV4T2YoVXBsb2FkRlMuY29uZmlnLnN0b3Jlc1BhdGgpID09PSAtMSkge1xyXG4gICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBzdG9yZSBwYXRoXHJcbiAgICAgICAgbGV0IHBhcnNlZFVybCA9IFVSTC5wYXJzZShyZXEudXJsKTtcclxuICAgICAgICBsZXQgcGF0aCA9IHBhcnNlZFVybC5wYXRobmFtZS5zdWJzdHIoVXBsb2FkRlMuY29uZmlnLnN0b3Jlc1BhdGgubGVuZ3RoICsgMSk7XHJcblxyXG4gICAgICAgIGxldCBhbGxvd0NPUlMgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsIHJlcS5oZWFkZXJzLm9yaWdpbik7XHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsIFwiUE9TVFwiKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiLCBcIipcIik7XHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCIsIFwiQ29udGVudC1UeXBlXCIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xyXG4gICAgICAgICAgICBsZXQgcmVnRXhwID0gbmV3IFJlZ0V4cCgnXlxcLyhbXlxcL1xcP10rKVxcLyhbXlxcL1xcP10rKSQnKTtcclxuICAgICAgICAgICAgbGV0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXF1ZXN0IGlzIG5vdCB2YWxpZFxyXG4gICAgICAgICAgICBpZiAobWF0Y2ggPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlXHJcbiAgICAgICAgICAgIGxldCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKG1hdGNoWzFdKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBhIHN0b3JlIGlzIGZvdW5kLCBnbyBhaGVhZCBhbmQgYWxsb3cgdGhlIG9yaWdpblxyXG4gICAgICAgICAgICBhbGxvd0NPUlMoKTtcclxuXHJcbiAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAocmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCBzdG9yZVxyXG4gICAgICAgICAgICBsZXQgcmVnRXhwID0gbmV3IFJlZ0V4cCgnXlxcLyhbXlxcL1xcP10rKVxcLyhbXlxcL1xcP10rKSQnKTtcclxuICAgICAgICAgICAgbGV0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXF1ZXN0IGlzIG5vdCB2YWxpZFxyXG4gICAgICAgICAgICBpZiAobWF0Y2ggPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlXHJcbiAgICAgICAgICAgIGxldCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKG1hdGNoWzFdKTtcclxuICAgICAgICAgICAgaWYgKCFzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBhIHN0b3JlIGlzIGZvdW5kLCBnbyBhaGVhZCBhbmQgYWxsb3cgdGhlIG9yaWdpblxyXG4gICAgICAgICAgICBhbGxvd0NPUlMoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBmaWxlXHJcbiAgICAgICAgICAgIGxldCBmaWxlSWQgPSBtYXRjaFsyXTtcclxuICAgICAgICAgICAgaWYgKHN0b3JlLmdldENvbGxlY3Rpb24oKS5maW5kKHtfaWQ6IGZpbGVJZH0pLmNvdW50KCkgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA0KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgdXBsb2FkIHRva2VuXHJcbiAgICAgICAgICAgIGlmICghc3RvcmUuY2hlY2tUb2tlbihyZXEucXVlcnkudG9rZW4sIGZpbGVJZCkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAzKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHRtcEZpbGUgPSBVcGxvYWRGUy5nZXRUZW1wRmlsZVBhdGgoZmlsZUlkKTtcclxuICAgICAgICAgICAgbGV0IHdzID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odG1wRmlsZSwge2ZsYWdzOiAnYSd9KTtcclxuICAgICAgICAgICAgbGV0IGZpZWxkcyA9IHt1cGxvYWRpbmc6IHRydWV9O1xyXG4gICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUZsb2F0KHJlcS5xdWVyeS5wcm9ncmVzcyk7XHJcbiAgICAgICAgICAgIGlmICghaXNOYU4ocHJvZ3Jlc3MpICYmIHByb2dyZXNzID4gMCkge1xyXG4gICAgICAgICAgICAgICAgZmllbGRzLnByb2dyZXNzID0gTWF0aC5taW4ocHJvZ3Jlc3MsIDEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXEub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcclxuICAgICAgICAgICAgICAgIHdzLndyaXRlKGNodW5rKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlcS5vbignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXEub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIGNvbXBsZXRlZCBzdGF0ZSB3aXRob3V0IHRyaWdnZXJpbmcgaG9va3NcclxuICAgICAgICAgICAgICAgIHN0b3JlLmdldENvbGxlY3Rpb24oKS5kaXJlY3QudXBkYXRlKHtfaWQ6IGZpbGVJZH0sIHskc2V0OiBmaWVsZHN9KTtcclxuICAgICAgICAgICAgICAgIHdzLmVuZCgpO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIHdzLm9uKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IHdyaXRlIGNodW5rIG9mIGZpbGUgXCIke2ZpbGVJZH1cIiAoJHtlcnIubWVzc2FnZX0pYCk7XHJcbiAgICAgICAgICAgICAgICBmcy51bmxpbmsodG1wRmlsZSwgKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVyciAmJiBjb25zb2xlLmVycm9yKGB1ZnM6IGNhbm5vdCBkZWxldGUgdGVtcCBmaWxlIFwiJHt0bXBGaWxlfVwiICgke2Vyci5tZXNzYWdlfSlgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDApO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgd3Mub24oJ2ZpbmlzaCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMjA0LCB7XCJDb250ZW50LVR5cGVcIjogJ3RleHQvcGxhaW4nfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChyZXEubWV0aG9kID09PSAnR0VUJykge1xyXG4gICAgICAgICAgICAvLyBHZXQgc3RvcmUsIGZpbGUgSWQgYW5kIGZpbGUgbmFtZVxyXG4gICAgICAgICAgICBsZXQgcmVnRXhwID0gbmV3IFJlZ0V4cCgnXlxcLyhbXlxcL1xcP10rKVxcLyhbXlxcL1xcP10rKSg/OlxcLyhbXlxcL1xcP10rKSk/JCcpO1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSByZWdFeHAuZXhlYyhwYXRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEF2b2lkIDUwNCBHYXRld2F5IHRpbWVvdXQgZXJyb3JcclxuICAgICAgICAgICAgLy8gaWYgZmlsZSBpcyBub3QgaGFuZGxlZCBieSBVcGxvYWRGUy5cclxuICAgICAgICAgICAgaWYgKG1hdGNoID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBzdG9yZVxyXG4gICAgICAgICAgICBjb25zdCBzdG9yZU5hbWUgPSBtYXRjaFsxXTtcclxuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RvcmUub25SZWFkICE9PSBudWxsICYmIHN0b3JlLm9uUmVhZCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBzdG9yZS5vblJlYWQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogU3RvcmUub25SZWFkIGlzIG5vdCBhIGZ1bmN0aW9uIGluIHN0b3JlIFwiJHtzdG9yZU5hbWV9XCJgKTtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGZpbGUgZXh0ZW5zaW9uIGZyb20gZmlsZSBJZFxyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSBtYXRjaFsyXS5pbmRleE9mKCcuJyk7XHJcbiAgICAgICAgICAgIGxldCBmaWxlSWQgPSBpbmRleCAhPT0gLTEgPyBtYXRjaFsyXS5zdWJzdHIoMCwgaW5kZXgpIDogbWF0Y2hbMl07XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgZmlsZSBmcm9tIGRhdGFiYXNlXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBzdG9yZS5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNpbXVsYXRlIHJlYWQgc3BlZWRcclxuICAgICAgICAgICAgaWYgKFVwbG9hZEZTLmNvbmZpZy5zaW11bGF0ZVJlYWREZWxheSkge1xyXG4gICAgICAgICAgICAgICAgTWV0ZW9yLl9zbGVlcEZvck1zKFVwbG9hZEZTLmNvbmZpZy5zaW11bGF0ZVJlYWREZWxheSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGQucnVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBmaWxlIGNhbiBiZSBhY2Nlc3NlZFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlLm9uUmVhZC5jYWxsKHN0b3JlLCBmaWxlSWQsIGZpbGUsIHJlcSwgcmVzKSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3B0aW9ucyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzdGF0dXMgPSAyMDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXBhcmUgcmVzcG9uc2UgaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBoZWFkZXJzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogZmlsZS50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1MZW5ndGgnOiBmaWxlLnNpemVcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgRVRhZyBoZWFkZXJcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZpbGUuZXRhZyA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snRVRhZyddID0gZmlsZS5ldGFnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIExhc3QtTW9kaWZpZWQgaGVhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUubW9kaWZpZWRBdCBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snTGFzdC1Nb2RpZmllZCddID0gZmlsZS5tb2RpZmllZEF0LnRvVVRDU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGZpbGUudXBsb2FkZWRBdCBpbnN0YW5jZW9mIERhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snTGFzdC1Nb2RpZmllZCddID0gZmlsZS51cGxvYWRlZEF0LnRvVVRDU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSByZXF1ZXN0IGhlYWRlcnNcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlcS5oZWFkZXJzID09PSAnb2JqZWN0Jykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBFVGFnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXEuaGVhZGVyc1snaWYtbm9uZS1tYXRjaCddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZS5ldGFnID09PSByZXEuaGVhZGVyc1snaWYtbm9uZS1tYXRjaCddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgzMDQpOyAvLyBOb3QgTW9kaWZpZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGZpbGUgbW9kaWZpY2F0aW9uIGRhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcS5oZWFkZXJzWydpZi1tb2RpZmllZC1zaW5jZSddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb2RpZmllZFNpbmNlID0gbmV3IERhdGUocmVxLmhlYWRlcnNbJ2lmLW1vZGlmaWVkLXNpbmNlJ10pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoZmlsZS5tb2RpZmllZEF0IGluc3RhbmNlb2YgRGF0ZSAmJiBmaWxlLm1vZGlmaWVkQXQgPiBtb2RpZmllZFNpbmNlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IGZpbGUudXBsb2FkZWRBdCBpbnN0YW5jZW9mIERhdGUgJiYgZmlsZS51cGxvYWRlZEF0ID4gbW9kaWZpZWRTaW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMzA0KTsgLy8gTm90IE1vZGlmaWVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VwcG9ydCByYW5nZSByZXF1ZXN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVxLmhlYWRlcnMucmFuZ2UgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IHJlcS5oZWFkZXJzLnJhbmdlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJhbmdlIGlzIG5vdCB2YWxpZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyYW5nZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDE2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gZmlsZS5zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdW5pdCA9IHJhbmdlLnN1YnN0cigwLCByYW5nZS5pbmRleE9mKFwiPVwiKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuaXQgIT09IFwiYnl0ZXNcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDE2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlcyA9IHJhbmdlLnN1YnN0cih1bml0Lmxlbmd0aCkucmVwbGFjZSgvW14wLTlcXC0sXS8sICcnKS5zcGxpdCgnLCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYW5nZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdG9kbzogc3VwcG9ydCBtdWx0aXBhcnQgcmFuZ2VzOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9IVFRQL1JhbmdlX3JlcXVlc3RzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHIgPSByYW5nZXNbMF0uc3BsaXQoXCItXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gcGFyc2VJbnQoclswXSwgMTApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IHJbMV0gPyBwYXJzZUludChyWzFdLCAxMCkgOiB0b3RhbCAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJhbmdlIGlzIG5vdCB2YWxpZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydCA8IDAgfHwgZW5kID49IHRvdGFsIHx8IHN0YXJ0ID4gZW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDE2KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtUmFuZ2UnXSA9IGBieXRlcyAke3N0YXJ0fS0ke2VuZH0vJHt0b3RhbH1gO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSBlbmQgLSBzdGFydCArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdGFydCA9IHN0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZW5kID0gZW5kO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzID0gMjA2OyAvLyBwYXJ0aWFsIGNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0FjY2VwdC1SYW5nZXMnXSA9IFwiYnl0ZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9wZW4gdGhlIGZpbGUgc3RyZWFtXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcnMgPSBzdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGVJZCwgZmlsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgd3MgPSBuZXcgc3RyZWFtLlBhc3NUaHJvdWdoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJzLm9uKCdlcnJvcicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yZS5vblJlYWRFcnJvci5jYWxsKHN0b3JlLCBlcnIsIGZpbGVJZCwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgd3Mub24oJ2Vycm9yJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlLm9uUmVhZEVycm9yLmNhbGwoc3RvcmUsIGVyciwgZmlsZUlkLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB3cy5vbignY2xvc2UnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsb3NlIG91dHB1dCBzdHJlYW0gYXQgdGhlIGVuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5lbWl0KCdlbmQnKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJhbnNmb3JtIHN0cmVhbVxyXG4gICAgICAgICAgICAgICAgICAgIHN0b3JlLnRyYW5zZm9ybVJlYWQocnMsIHdzLCBmaWxlSWQsIGZpbGUsIHJlcSwgaGVhZGVycyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHJlcXVlc3QgaGVhZGVyc1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVxLmhlYWRlcnMgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXByZXNzIGRhdGEgdXNpbmcgaWYgbmVlZGVkIChpZ25vcmUgYXVkaW8vdmlkZW8gYXMgdGhleSBhcmUgYWxyZWFkeSBjb21wcmVzc2VkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlcS5oZWFkZXJzWydhY2NlcHQtZW5jb2RpbmcnXSA9PT0gJ3N0cmluZycgJiYgIS9eKGF1ZGlvfHZpZGVvKS8udGVzdChmaWxlLnR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgYWNjZXB0ID0gcmVxLmhlYWRlcnNbJ2FjY2VwdC1lbmNvZGluZyddO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXByZXNzIHdpdGggZ3ppcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjY2VwdC5tYXRjaCgvXFxiZ3ppcFxcYi8pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snQ29udGVudC1FbmNvZGluZyddID0gJ2d6aXAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBoZWFkZXJzWydDb250ZW50LUxlbmd0aCddO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cy5waXBlKHpsaWIuY3JlYXRlR3ppcCgpKS5waXBlKHJlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcHJlc3Mgd2l0aCBkZWZsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChhY2NlcHQubWF0Y2goL1xcYmRlZmxhdGVcXGIvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtRW5jb2RpbmcnXSA9ICdkZWZsYXRlJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgaGVhZGVyc1snQ29udGVudC1MZW5ndGgnXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKHN0YXR1cywgaGVhZGVycyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd3MucGlwZSh6bGliLmNyZWF0ZURlZmxhdGUoKSkucGlwZShyZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VuZCByYXcgZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghaGVhZGVyc1snQ29udGVudC1FbmNvZGluZyddKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd3MucGlwZShyZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5pbXBvcnQge199IGZyb20gXCJtZXRlb3IvdW5kZXJzY29yZVwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBTdG9yZSBwZXJtaXNzaW9uc1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFN0b3JlUGVybWlzc2lvbnMge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBEZWZhdWx0IG9wdGlvbnNcclxuICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe1xyXG4gICAgICAgICAgICBpbnNlcnQ6IG51bGwsXHJcbiAgICAgICAgICAgIHJlbW92ZTogbnVsbCxcclxuICAgICAgICAgICAgdXBkYXRlOiBudWxsXHJcbiAgICAgICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIG9wdGlvbnNcclxuICAgICAgICBpZiAob3B0aW9ucy5pbnNlcnQgJiYgdHlwZW9mIG9wdGlvbnMuaW5zZXJ0ICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdG9yZVBlcm1pc3Npb25zOiBpbnNlcnQgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLnJlbW92ZSAmJiB0eXBlb2Ygb3B0aW9ucy5yZW1vdmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0b3JlUGVybWlzc2lvbnM6IHJlbW92ZSBpcyBub3QgYSBmdW5jdGlvblwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMudXBkYXRlICYmIHR5cGVvZiBvcHRpb25zLnVwZGF0ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3RvcmVQZXJtaXNzaW9uczogdXBkYXRlIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHVibGljIGF0dHJpYnV0ZXNcclxuICAgICAgICB0aGlzLmFjdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGluc2VydDogb3B0aW9ucy5pbnNlcnQsXHJcbiAgICAgICAgICAgIHJlbW92ZTogb3B0aW9ucy5yZW1vdmUsXHJcbiAgICAgICAgICAgIHVwZGF0ZTogb3B0aW9ucy51cGRhdGUsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyB0aGUgcGVybWlzc2lvbiBmb3IgdGhlIGFjdGlvblxyXG4gICAgICogQHBhcmFtIGFjdGlvblxyXG4gICAgICogQHBhcmFtIHVzZXJJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSBmaWVsZHNcclxuICAgICAqIEBwYXJhbSBtb2RpZmllcnNcclxuICAgICAqIEByZXR1cm4geyp9XHJcbiAgICAgKi9cclxuICAgIGNoZWNrKGFjdGlvbiwgdXNlcklkLCBmaWxlLCBmaWVsZHMsIG1vZGlmaWVycykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5hY3Rpb25zW2FjdGlvbl0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aW9uc1thY3Rpb25dKHVzZXJJZCwgZmlsZSwgZmllbGRzLCBtb2RpZmllcnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gYnkgZGVmYXVsdCBhbGxvdyBhbGxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyB0aGUgaW5zZXJ0IHBlcm1pc3Npb25cclxuICAgICAqIEBwYXJhbSB1c2VySWRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAqL1xyXG4gICAgY2hlY2tJbnNlcnQodXNlcklkLCBmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hlY2soJ2luc2VydCcsIHVzZXJJZCwgZmlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgdGhlIHJlbW92ZSBwZXJtaXNzaW9uXHJcbiAgICAgKiBAcGFyYW0gdXNlcklkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgKi9cclxuICAgIGNoZWNrUmVtb3ZlKHVzZXJJZCwgZmlsZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNoZWNrKCdyZW1vdmUnLCB1c2VySWQsIGZpbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHRoZSB1cGRhdGUgcGVybWlzc2lvblxyXG4gICAgICogQHBhcmFtIHVzZXJJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSBmaWVsZHNcclxuICAgICAqIEBwYXJhbSBtb2RpZmllcnNcclxuICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICovXHJcbiAgICBjaGVja1VwZGF0ZSh1c2VySWQsIGZpbGUsIGZpZWxkcywgbW9kaWZpZXJzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hlY2soJ3VwZGF0ZScsIHVzZXJJZCwgZmlsZSwgZmllbGRzLCBtb2RpZmllcnMpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5pbXBvcnQge199IGZyb20gXCJtZXRlb3IvdW5kZXJzY29yZVwiO1xyXG5pbXBvcnQge2NoZWNrfSBmcm9tIFwibWV0ZW9yL2NoZWNrXCI7XHJcbmltcG9ydCB7TWV0ZW9yfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xyXG5pbXBvcnQge01vbmdvfSBmcm9tIFwibWV0ZW9yL21vbmdvXCI7XHJcbmltcG9ydCB7VXBsb2FkRlN9IGZyb20gXCIuL3Vmc1wiO1xyXG5pbXBvcnQge0ZpbHRlcn0gZnJvbSBcIi4vdWZzLWZpbHRlclwiO1xyXG5pbXBvcnQge1N0b3JlUGVybWlzc2lvbnN9IGZyb20gXCIuL3Vmcy1zdG9yZS1wZXJtaXNzaW9uc1wiO1xyXG5pbXBvcnQge1Rva2Vuc30gZnJvbSBcIi4vdWZzLXRva2Vuc1wiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaWxlIHN0b3JlXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3RvcmUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIERlZmF1bHQgb3B0aW9uc1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb246IG51bGwsXHJcbiAgICAgICAgICAgIGZpbHRlcjogbnVsbCxcclxuICAgICAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICAgICAgb25Db3B5RXJyb3I6IHRoaXMub25Db3B5RXJyb3IsXHJcbiAgICAgICAgICAgIG9uRmluaXNoVXBsb2FkOiB0aGlzLm9uRmluaXNoVXBsb2FkLFxyXG4gICAgICAgICAgICBvblJlYWQ6IHRoaXMub25SZWFkLFxyXG4gICAgICAgICAgICBvblJlYWRFcnJvcjogdGhpcy5vblJlYWRFcnJvcixcclxuICAgICAgICAgICAgb25WYWxpZGF0ZTogdGhpcy5vblZhbGlkYXRlLFxyXG4gICAgICAgICAgICBvbldyaXRlRXJyb3I6IHRoaXMub25Xcml0ZUVycm9yLFxyXG4gICAgICAgICAgICBwZXJtaXNzaW9uczogbnVsbCxcclxuICAgICAgICAgICAgdHJhbnNmb3JtUmVhZDogbnVsbCxcclxuICAgICAgICAgICAgdHJhbnNmb3JtV3JpdGU6IG51bGxcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgb3B0aW9uc1xyXG4gICAgICAgIGlmICghKG9wdGlvbnMuY29sbGVjdGlvbiBpbnN0YW5jZW9mIE1vbmdvLkNvbGxlY3Rpb24pKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBjb2xsZWN0aW9uIGlzIG5vdCBhIE1vbmdvLkNvbGxlY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVyICYmICEob3B0aW9ucy5maWx0ZXIgaW5zdGFuY2VvZiBGaWx0ZXIpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBmaWx0ZXIgaXMgbm90IGEgVXBsb2FkRlMuRmlsdGVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5uYW1lICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogbmFtZSBpcyBub3QgYSBzdHJpbmcnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKFVwbG9hZEZTLmdldFN0b3JlKG9wdGlvbnMubmFtZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IG5hbWUgYWxyZWFkeSBleGlzdHMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMub25Db3B5RXJyb3IgJiYgdHlwZW9mIG9wdGlvbnMub25Db3B5RXJyb3IgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IG9uQ29weUVycm9yIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLm9uRmluaXNoVXBsb2FkICYmIHR5cGVvZiBvcHRpb25zLm9uRmluaXNoVXBsb2FkICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBvbkZpbmlzaFVwbG9hZCBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5vblJlYWQgJiYgdHlwZW9mIG9wdGlvbnMub25SZWFkICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBvblJlYWQgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMub25SZWFkRXJyb3IgJiYgdHlwZW9mIG9wdGlvbnMub25SZWFkRXJyb3IgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IG9uUmVhZEVycm9yIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLm9uV3JpdGVFcnJvciAmJiB0eXBlb2Ygb3B0aW9ucy5vbldyaXRlRXJyb3IgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IG9uV3JpdGVFcnJvciBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5wZXJtaXNzaW9ucyAmJiAhKG9wdGlvbnMucGVybWlzc2lvbnMgaW5zdGFuY2VvZiBTdG9yZVBlcm1pc3Npb25zKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogcGVybWlzc2lvbnMgaXMgbm90IGEgVXBsb2FkRlMuU3RvcmVQZXJtaXNzaW9ucycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy50cmFuc2Zvcm1SZWFkICYmIHR5cGVvZiBvcHRpb25zLnRyYW5zZm9ybVJlYWQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IHRyYW5zZm9ybVJlYWQgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMudHJhbnNmb3JtV3JpdGUgJiYgdHlwZW9mIG9wdGlvbnMudHJhbnNmb3JtV3JpdGUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IHRyYW5zZm9ybVdyaXRlIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLm9uVmFsaWRhdGUgJiYgdHlwZW9mIG9wdGlvbnMub25WYWxpZGF0ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogb25WYWxpZGF0ZSBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHVibGljIGF0dHJpYnV0ZXNcclxuICAgICAgICBzZWxmLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIHNlbGYucGVybWlzc2lvbnMgPSBvcHRpb25zLnBlcm1pc3Npb25zO1xyXG4gICAgICAgIF8uZWFjaChbXHJcbiAgICAgICAgICAgICdvbkNvcHlFcnJvcicsXHJcbiAgICAgICAgICAgICdvbkZpbmlzaFVwbG9hZCcsXHJcbiAgICAgICAgICAgICdvblJlYWQnLFxyXG4gICAgICAgICAgICAnb25SZWFkRXJyb3InLFxyXG4gICAgICAgICAgICAnb25Xcml0ZUVycm9yJyxcclxuICAgICAgICAgICAgJ29uVmFsaWRhdGUnXHJcbiAgICAgICAgXSwgKG1ldGhvZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNbbWV0aG9kXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgc2VsZlttZXRob2RdID0gb3B0aW9uc1ttZXRob2RdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0aGUgc3RvcmUgdG8gdGhlIGxpc3RcclxuICAgICAgICBVcGxvYWRGUy5hZGRTdG9yZShzZWxmKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IGRlZmF1bHQgcGVybWlzc2lvbnNcclxuICAgICAgICBpZiAoIShzZWxmLnBlcm1pc3Npb25zIGluc3RhbmNlb2YgU3RvcmVQZXJtaXNzaW9ucykpIHtcclxuICAgICAgICAgICAgLy8gVXNlcyBjdXN0b20gZGVmYXVsdCBwZXJtaXNzaW9ucyBvciBVRlMgZGVmYXVsdCBwZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICBpZiAoVXBsb2FkRlMuY29uZmlnLmRlZmF1bHRTdG9yZVBlcm1pc3Npb25zIGluc3RhbmNlb2YgU3RvcmVQZXJtaXNzaW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5wZXJtaXNzaW9ucyA9IFVwbG9hZEZTLmNvbmZpZy5kZWZhdWx0U3RvcmVQZXJtaXNzaW9ucztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucGVybWlzc2lvbnMgPSBuZXcgU3RvcmVQZXJtaXNzaW9ucygpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGB1ZnM6IHBlcm1pc3Npb25zIGFyZSBub3QgZGVmaW5lZCBmb3Igc3RvcmUgXCIke29wdGlvbnMubmFtZX1cImApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ2hlY2tzIHRva2VuIHZhbGlkaXR5XHJcbiAgICAgICAgICAgICAqIEBwYXJhbSB0b2tlblxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgc2VsZi5jaGVja1Rva2VuID0gZnVuY3Rpb24gKHRva2VuLCBmaWxlSWQpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgY2hlY2soZmlsZUlkLCBTdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2Vucy5maW5kKHt2YWx1ZTogdG9rZW4sIGZpbGVJZDogZmlsZUlkfSkuY291bnQoKSA9PT0gMTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDb3BpZXMgdGhlIGZpbGUgdG8gYSBzdG9yZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBzdG9yZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGYuY29weSA9IGZ1bmN0aW9uIChmaWxlSWQsIHN0b3JlLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgY2hlY2soZmlsZUlkLCBTdHJpbmcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghKHN0b3JlIGluc3RhbmNlb2YgU3RvcmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignc3RvcmUgaXMgbm90IGFuIGluc3RhbmNlIG9mIFVwbG9hZEZTLlN0b3JlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgb3JpZ2luYWwgZmlsZVxyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBzZWxmLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZmlsZS1ub3QtZm91bmQnLCAnRmlsZSBub3QgZm91bmQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFNpbGVudGx5IGlnbm9yZSB0aGUgZmlsZSBpZiBpdCBkb2VzIG5vdCBtYXRjaCBmaWx0ZXJcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IHN0b3JlLmdldEZpbHRlcigpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpbHRlciBpbnN0YW5jZW9mIEZpbHRlciAmJiAhZmlsdGVyLmlzVmFsaWQoZmlsZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJlcGFyZSBjb3B5XHJcbiAgICAgICAgICAgICAgICBsZXQgY29weSA9IF8ub21pdChmaWxlLCAnX2lkJywgJ3VybCcpO1xyXG4gICAgICAgICAgICAgICAgY29weS5vcmlnaW5hbFN0b3JlID0gc2VsZi5nZXROYW1lKCk7XHJcbiAgICAgICAgICAgICAgICBjb3B5Lm9yaWdpbmFsSWQgPSBmaWxlSWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb3B5XHJcbiAgICAgICAgICAgICAgICBsZXQgY29weUlkID0gc3RvcmUuY3JlYXRlKGNvcHkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEdldCBvcmlnaW5hbCBzdHJlYW1cclxuICAgICAgICAgICAgICAgIGxldCBycyA9IHNlbGYuZ2V0UmVhZFN0cmVhbShmaWxlSWQsIGZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhdGNoIGVycm9ycyB0byBhdm9pZCBhcHAgY3Jhc2hpbmdcclxuICAgICAgICAgICAgICAgIHJzLm9uKCdlcnJvcicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoc2VsZiwgZXJyLCBudWxsKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb3B5IGZpbGUgZGF0YVxyXG4gICAgICAgICAgICAgICAgc3RvcmUud3JpdGUocnMsIGNvcHlJZCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmdldENvbGxlY3Rpb24oKS5yZW1vdmUoe19pZDogY29weUlkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25Db3B5RXJyb3IuY2FsbChzZWxmLCBlcnIsIGZpbGVJZCwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBlcnIsIGNvcHlJZCwgY29weSwgc3RvcmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDcmVhdGVzIHRoZSBmaWxlIGluIHRoZSBjb2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzZWxmLmNyZWF0ZSA9IGZ1bmN0aW9uIChmaWxlLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgY2hlY2soZmlsZSwgT2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIGZpbGUuc3RvcmUgPSBzZWxmLm9wdGlvbnMubmFtZTsgLy8gYXNzaWduIHN0b3JlIHRvIGZpbGVcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmdldENvbGxlY3Rpb24oKS5pbnNlcnQoZmlsZSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENyZWF0ZXMgYSB0b2tlbiBmb3IgdGhlIGZpbGUgKG9ubHkgbmVlZGVkIGZvciBjbGllbnQgc2lkZSB1cGxvYWQpXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAgICAgICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzZWxmLmNyZWF0ZVRva2VuID0gZnVuY3Rpb24gKGZpbGVJZCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHRva2VuID0gc2VsZi5nZW5lcmF0ZVRva2VuKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdG9rZW4gZXhpc3RzXHJcbiAgICAgICAgICAgICAgICBpZiAoVG9rZW5zLmZpbmQoe2ZpbGVJZDogZmlsZUlkfSkuY291bnQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIFRva2Vucy51cGRhdGUoe2ZpbGVJZDogZmlsZUlkfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2V0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdG9rZW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBUb2tlbnMuaW5zZXJ0KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlSWQ6IGZpbGVJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRva2VuXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogV3JpdGVzIHRoZSBmaWxlIHRvIHRoZSBzdG9yZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gcnNcclxuICAgICAgICAgICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGYud3JpdGUgPSBmdW5jdGlvbiAocnMsIGZpbGVJZCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGxldCBmaWxlID0gc2VsZi5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcclxuICAgICAgICAgICAgICAgIGxldCB3cyA9IHNlbGYuZ2V0V3JpdGVTdHJlYW0oZmlsZUlkLCBmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3JIYW5kbGVyID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub25Xcml0ZUVycm9yLmNhbGwoc2VsZiwgZXJyLCBmaWxlSWQsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoc2VsZiwgZXJyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHdzLm9uKCdlcnJvcicsIGVycm9ySGFuZGxlcik7XHJcbiAgICAgICAgICAgICAgICB3cy5vbignZmluaXNoJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNpemUgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByZWFkU3RyZWFtID0gc2VsZi5nZXRSZWFkU3RyZWFtKGZpbGVJZCwgZmlsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJlYWRTdHJlYW0ub24oJ2Vycm9yJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlYWRTdHJlYW0ub24oJ2RhdGEnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemUgKz0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlYWRTdHJlYW0ub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgZmlsZSBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5jb21wbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuZXRhZyA9IFVwbG9hZEZTLmdlbmVyYXRlRXRhZygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnBhdGggPSBzZWxmLmdldEZpbGVSZWxhdGl2ZVVSTChmaWxlSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnByb2dyZXNzID0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zaXplID0gc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS50b2tlbiA9IHNlbGYuZ2VuZXJhdGVUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnVwbG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnVwbG9hZGVkQXQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnVybCA9IHNlbGYuZ2V0RmlsZVVSTChmaWxlSWQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNlbGYub25GaW5pc2hVcGxvYWQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25GaW5pc2hVcGxvYWQuY2FsbChzZWxmLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0cyB0aGUgZmlsZSBVUkwgd2hlbiBmaWxlIHRyYW5zZmVyIGlzIGNvbXBsZXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdheSwgdGhlIGltYWdlIHdpbGwgbG9hZHMgZW50aXJlbHkuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZ2V0Q29sbGVjdGlvbigpLmRpcmVjdC51cGRhdGUoe19pZDogZmlsZUlkfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNldDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmaWxlLmNvbXBsZXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV0YWc6IGZpbGUuZXRhZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBmaWxlLnBhdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IGZpbGUucHJvZ3Jlc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiBmaWxlLnRva2VuLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwbG9hZGluZzogZmlsZS51cGxvYWRpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkZWRBdDogZmlsZS51cGxvYWRlZEF0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogZmlsZS51cmxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gZmlsZSBpbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoc2VsZiwgbnVsbCwgZmlsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTaW11bGF0ZSB3cml0ZSBzcGVlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoVXBsb2FkRlMuY29uZmlnLnNpbXVsYXRlV3JpdGVEZWxheSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTWV0ZW9yLl9zbGVlcEZvck1zKFVwbG9hZEZTLmNvbmZpZy5zaW11bGF0ZVdyaXRlRGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDb3B5IGZpbGUgdG8gb3RoZXIgc3RvcmVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLm9wdGlvbnMuY29weVRvIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5vcHRpb25zLmNvcHlUby5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdG9yZSA9IHNlbGYub3B0aW9ucy5jb3B5VG9baV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc3RvcmUuZ2V0RmlsdGVyKCkgfHwgc3RvcmUuZ2V0RmlsdGVyKCkuaXNWYWxpZChmaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvcHkoZmlsZUlkLCBzdG9yZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgdHJhbnNmb3JtYXRpb25cclxuICAgICAgICAgICAgICAgIHNlbGYudHJhbnNmb3JtV3JpdGUocnMsIHdzLCBmaWxlSWQsIGZpbGUpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xyXG4gICAgICAgICAgICBjb25zdCBmcyA9IE5wbS5yZXF1aXJlKCdmcycpO1xyXG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0aW9uID0gc2VsZi5nZXRDb2xsZWN0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb2RlIGV4ZWN1dGVkIGFmdGVyIHJlbW92aW5nIGZpbGVcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5hZnRlci5yZW1vdmUoZnVuY3Rpb24gKHVzZXJJZCwgZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGFzc29jaWF0ZWQgdG9rZW5zXHJcbiAgICAgICAgICAgICAgICBUb2tlbnMucmVtb3ZlKHtmaWxlSWQ6IGZpbGUuX2lkfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYub3B0aW9ucy5jb3B5VG8gaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5vcHRpb25zLmNvcHlUby5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgY29waWVzIGluIHN0b3Jlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9wdGlvbnMuY29weVRvW2ldLmdldENvbGxlY3Rpb24oKS5yZW1vdmUoe29yaWdpbmFsSWQ6IGZpbGUuX2lkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENvZGUgZXhlY3V0ZWQgYmVmb3JlIGluc2VydGluZyBmaWxlXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYmVmb3JlLmluc2VydChmdW5jdGlvbiAodXNlcklkLCBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYucGVybWlzc2lvbnMuY2hlY2tJbnNlcnQodXNlcklkLCBmaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ZvcmJpZGRlbicsIFwiRm9yYmlkZGVuXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENvZGUgZXhlY3V0ZWQgYmVmb3JlIHVwZGF0aW5nIGZpbGVcclxuICAgICAgICAgICAgY29sbGVjdGlvbi5iZWZvcmUudXBkYXRlKGZ1bmN0aW9uICh1c2VySWQsIGZpbGUsIGZpZWxkcywgbW9kaWZpZXJzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYucGVybWlzc2lvbnMuY2hlY2tVcGRhdGUodXNlcklkLCBmaWxlLCBmaWVsZHMsIG1vZGlmaWVycykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdmb3JiaWRkZW4nLCBcIkZvcmJpZGRlblwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb2RlIGV4ZWN1dGVkIGJlZm9yZSByZW1vdmluZyBmaWxlXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYmVmb3JlLnJlbW92ZShmdW5jdGlvbiAodXNlcklkLCBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYucGVybWlzc2lvbnMuY2hlY2tSZW1vdmUodXNlcklkLCBmaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ZvcmJpZGRlbicsIFwiRm9yYmlkZGVuXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgcGh5c2ljYWwgZmlsZSBpbiB0aGUgc3RvcmVcclxuICAgICAgICAgICAgICAgIHNlbGYuZGVsZXRlKGZpbGUuX2lkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdG1wRmlsZSA9IFVwbG9hZEZTLmdldFRlbXBGaWxlUGF0aChmaWxlLl9pZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRGVsZXRlIHRoZSB0ZW1wIGZpbGVcclxuICAgICAgICAgICAgICAgIGZzLnN0YXQodG1wRmlsZSwgZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICFlcnIgJiYgZnMudW5saW5rKHRtcEZpbGUsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyICYmIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IGRlbGV0ZSB0ZW1wIGZpbGUgYXQgJHt0bXBGaWxlfSAoJHtlcnIubWVzc2FnZX0pYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVsZXRlcyBhIGZpbGUgYXN5bmNcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgICBkZWxldGUoZmlsZUlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZGVsZXRlIGlzIG5vdCBpbXBsZW1lbnRlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGVzIGEgcmFuZG9tIHRva2VuXHJcbiAgICAgKiBAcGFyYW0gcGF0dGVyblxyXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZVRva2VuKHBhdHRlcm4pIHtcclxuICAgICAgICByZXR1cm4gKHBhdHRlcm4gfHwgJ3h5eHl4eXh5eHknKS5yZXBsYWNlKC9beHldL2csIChjKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIGxldCBzID0gdi50b1N0cmluZygxNik7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpID8gcy50b1VwcGVyQ2FzZSgpIDogcztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGNvbGxlY3Rpb25cclxuICAgICAqIEByZXR1cm4ge01vbmdvLkNvbGxlY3Rpb259XHJcbiAgICAgKi9cclxuICAgIGdldENvbGxlY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb2xsZWN0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgZmlsZSBVUkxcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICBnZXRGaWxlUmVsYXRpdmVVUkwoZmlsZUlkKSB7XHJcbiAgICAgICAgbGV0IGZpbGUgPSB0aGlzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKGZpbGVJZCwge2ZpZWxkczoge25hbWU6IDF9fSk7XHJcbiAgICAgICAgcmV0dXJuIGZpbGUgPyB0aGlzLmdldFJlbGF0aXZlVVJMKGAke2ZpbGVJZH0vJHtmaWxlLm5hbWV9YCkgOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgZmlsZSBVUkxcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICBnZXRGaWxlVVJMKGZpbGVJZCkge1xyXG4gICAgICAgIGxldCBmaWxlID0gdGhpcy5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZShmaWxlSWQsIHtmaWVsZHM6IHtuYW1lOiAxfX0pO1xyXG4gICAgICAgIHJldHVybiBmaWxlID8gdGhpcy5nZXRVUkwoYCR7ZmlsZUlkfS8ke2ZpbGUubmFtZX1gKSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBmaWxlIGZpbHRlclxyXG4gICAgICogQHJldHVybiB7VXBsb2FkRlMuRmlsdGVyfVxyXG4gICAgICovXHJcbiAgICBnZXRGaWx0ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5maWx0ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBzdG9yZSBuYW1lXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldE5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgZmlsZSByZWFkIHN0cmVhbVxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgZ2V0UmVhZFN0cmVhbShmaWxlSWQsIGZpbGUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0b3JlLmdldFJlYWRTdHJlYW0gaXMgbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBzdG9yZSByZWxhdGl2ZSBVUkxcclxuICAgICAqIEBwYXJhbSBwYXRoXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldFJlbGF0aXZlVVJMKHBhdGgpIHtcclxuICAgICAgICBjb25zdCByb290VXJsID0gTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XHJcbiAgICAgICAgY29uc3Qgcm9vdFBhdGggPSByb290VXJsLnJlcGxhY2UoL15bYS16XSs6XFwvXFwvW14vXStcXC8qL2dpLCAnJyk7XHJcbiAgICAgICAgY29uc3Qgc3RvcmVOYW1lID0gdGhpcy5nZXROYW1lKCk7XHJcbiAgICAgICAgcGF0aCA9IFN0cmluZyhwYXRoKS5yZXBsYWNlKC9cXC8kLywgJycpLnRyaW0oKTtcclxuICAgICAgICByZXR1cm4gZW5jb2RlVVJJKGAke3Jvb3RQYXRofS8ke1VwbG9hZEZTLmNvbmZpZy5zdG9yZXNQYXRofS8ke3N0b3JlTmFtZX0vJHtwYXRofWApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgc3RvcmUgYWJzb2x1dGUgVVJMXHJcbiAgICAgKiBAcGFyYW0gcGF0aFxyXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXRVUkwocGF0aCkge1xyXG4gICAgICAgIGNvbnN0IHJvb3RVcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoe3NlY3VyZTogVXBsb2FkRlMuY29uZmlnLmh0dHBzfSkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XHJcbiAgICAgICAgY29uc3Qgc3RvcmVOYW1lID0gdGhpcy5nZXROYW1lKCk7XHJcbiAgICAgICAgcGF0aCA9IFN0cmluZyhwYXRoKS5yZXBsYWNlKC9cXC8kLywgJycpLnRyaW0oKTtcclxuICAgICAgICByZXR1cm4gZW5jb2RlVVJJKGAke3Jvb3RVcmx9LyR7VXBsb2FkRlMuY29uZmlnLnN0b3Jlc1BhdGh9LyR7c3RvcmVOYW1lfS8ke3BhdGh9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBmaWxlIHdyaXRlIHN0cmVhbVxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgZ2V0V3JpdGVTdHJlYW0oZmlsZUlkLCBmaWxlKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdnZXRXcml0ZVN0cmVhbSBpcyBub3QgaW1wbGVtZW50ZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbXBsZXRlcyB0aGUgZmlsZSB1cGxvYWRcclxuICAgICAqIEBwYXJhbSB1cmxcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgaW1wb3J0RnJvbVVSTCh1cmwsIGZpbGUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgTWV0ZW9yLmNhbGwoJ3Vmc0ltcG9ydFVSTCcsIHVybCwgZmlsZSwgdGhpcy5nZXROYW1lKCksIGNhbGxiYWNrKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIGEgY29weSBlcnJvciBoYXBwZW5lZFxyXG4gICAgICogQHBhcmFtIGVyclxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgb25Db3B5RXJyb3IoZXJyLCBmaWxlSWQsIGZpbGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGB1ZnM6IGNhbm5vdCBjb3B5IGZpbGUgXCIke2ZpbGVJZH1cIiAoJHtlcnIubWVzc2FnZX0pYCwgZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIGEgZmlsZSBoYXMgYmVlbiB1cGxvYWRlZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgb25GaW5pc2hVcGxvYWQoZmlsZSkge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gYSBmaWxlIGlzIHJlYWQgZnJvbSB0aGUgc3RvcmVcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKiBAcGFyYW0gcmVxdWVzdFxyXG4gICAgICogQHBhcmFtIHJlc3BvbnNlXHJcbiAgICAgKiBAcmV0dXJuIGJvb2xlYW5cclxuICAgICAqL1xyXG4gICAgb25SZWFkKGZpbGVJZCwgZmlsZSwgcmVxdWVzdCwgcmVzcG9uc2UpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIGEgcmVhZCBlcnJvciBoYXBwZW5lZFxyXG4gICAgICogQHBhcmFtIGVyclxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEByZXR1cm4gYm9vbGVhblxyXG4gICAgICovXHJcbiAgICBvblJlYWRFcnJvcihlcnIsIGZpbGVJZCwgZmlsZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IHJlYWQgZmlsZSBcIiR7ZmlsZUlkfVwiICgke2Vyci5tZXNzYWdlfSlgLCBlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gZmlsZSBpcyBiZWluZyB2YWxpZGF0ZWRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIG9uVmFsaWRhdGUoZmlsZSkge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gYSB3cml0ZSBlcnJvciBoYXBwZW5lZFxyXG4gICAgICogQHBhcmFtIGVyclxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEByZXR1cm4gYm9vbGVhblxyXG4gICAgICovXHJcbiAgICBvbldyaXRlRXJyb3IoZXJyLCBmaWxlSWQsIGZpbGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKGB1ZnM6IGNhbm5vdCB3cml0ZSBmaWxlIFwiJHtmaWxlSWR9XCIgKCR7ZXJyLm1lc3NhZ2V9KWAsIGVycik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSBzdG9yZSBwZXJtaXNzaW9uc1xyXG4gICAgICogQHBhcmFtIHBlcm1pc3Npb25zXHJcbiAgICAgKi9cclxuICAgIHNldFBlcm1pc3Npb25zKHBlcm1pc3Npb25zKSB7XHJcbiAgICAgICAgaWYgKCEocGVybWlzc2lvbnMgaW5zdGFuY2VvZiBTdG9yZVBlcm1pc3Npb25zKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUGVybWlzc2lvbnMgaXMgbm90IGFuIGluc3RhbmNlIG9mIFVwbG9hZEZTLlN0b3JlUGVybWlzc2lvbnNcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGVybWlzc2lvbnMgPSBwZXJtaXNzaW9ucztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYW5zZm9ybXMgdGhlIGZpbGUgb24gcmVhZGluZ1xyXG4gICAgICogQHBhcmFtIHJlYWRTdHJlYW1cclxuICAgICAqIEBwYXJhbSB3cml0ZVN0cmVhbVxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSByZXF1ZXN0XHJcbiAgICAgKiBAcGFyYW0gaGVhZGVyc1xyXG4gICAgICovXHJcbiAgICB0cmFuc2Zvcm1SZWFkKHJlYWRTdHJlYW0sIHdyaXRlU3RyZWFtLCBmaWxlSWQsIGZpbGUsIHJlcXVlc3QsIGhlYWRlcnMpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50cmFuc2Zvcm1SZWFkID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2Zvcm1SZWFkLmNhbGwodGhpcywgcmVhZFN0cmVhbSwgd3JpdGVTdHJlYW0sIGZpbGVJZCwgZmlsZSwgcmVxdWVzdCwgaGVhZGVycyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVhZFN0cmVhbS5waXBlKHdyaXRlU3RyZWFtKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2Zvcm1zIHRoZSBmaWxlIG9uIHdyaXRpbmdcclxuICAgICAqIEBwYXJhbSByZWFkU3RyZWFtXHJcbiAgICAgKiBAcGFyYW0gd3JpdGVTdHJlYW1cclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIHRyYW5zZm9ybVdyaXRlKHJlYWRTdHJlYW0sIHdyaXRlU3RyZWFtLCBmaWxlSWQsIGZpbGUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50cmFuc2Zvcm1Xcml0ZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNmb3JtV3JpdGUuY2FsbCh0aGlzLCByZWFkU3RyZWFtLCB3cml0ZVN0cmVhbSwgZmlsZUlkLCBmaWxlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZWFkU3RyZWFtLnBpcGUod3JpdGVTdHJlYW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbGlkYXRlcyB0aGUgZmlsZVxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgdmFsaWRhdGUoZmlsZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vblZhbGlkYXRlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub25WYWxpZGF0ZShmaWxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge1RlbXBsYXRlfSBmcm9tICdtZXRlb3IvdGVtcGxhdGluZyc7XHJcblxyXG5cclxubGV0IGlzTUlNRSA9IGZ1bmN0aW9uICh0eXBlLCBtaW1lKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnXHJcbiAgICAgICAgJiYgdHlwZW9mIG1pbWUgPT09ICdzdHJpbmcnXHJcbiAgICAgICAgJiYgbWltZS5pbmRleE9mKHR5cGUgKyAnLycpID09PSAwO1xyXG59O1xyXG5cclxuVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2lzQXBwbGljYXRpb24nLCBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgcmV0dXJuIGlzTUlNRSgnYXBwbGljYXRpb24nLCB0aGlzLnR5cGUgfHwgdHlwZSk7XHJcbn0pO1xyXG5cclxuVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2lzQXVkaW8nLCBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgcmV0dXJuIGlzTUlNRSgnYXVkaW8nLCB0aGlzLnR5cGUgfHwgdHlwZSk7XHJcbn0pO1xyXG5cclxuVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2lzSW1hZ2UnLCBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgcmV0dXJuIGlzTUlNRSgnaW1hZ2UnLCB0aGlzLnR5cGUgfHwgdHlwZSk7XHJcbn0pO1xyXG5cclxuVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2lzVGV4dCcsIGZ1bmN0aW9uICh0eXBlKSB7XHJcbiAgICByZXR1cm4gaXNNSU1FKCd0ZXh0JywgdGhpcy50eXBlIHx8IHR5cGUpO1xyXG59KTtcclxuXHJcblRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKCdpc1ZpZGVvJywgZnVuY3Rpb24gKHR5cGUpIHtcclxuICAgIHJldHVybiBpc01JTUUoJ3ZpZGVvJywgdGhpcy50eXBlIHx8IHR5cGUpO1xyXG59KTtcclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge01vbmdvfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xyXG5cclxuLyoqXHJcbiAqIENvbGxlY3Rpb24gb2YgdXBsb2FkIHRva2Vuc1xyXG4gKiBAdHlwZSB7TW9uZ28uQ29sbGVjdGlvbn1cclxuICovXHJcbmV4cG9ydCBjb25zdCBUb2tlbnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbigndWZzVG9rZW5zJyk7XHJcbiIsIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5cclxuaW1wb3J0IHtffSBmcm9tICdtZXRlb3IvdW5kZXJzY29yZSc7XHJcbmltcG9ydCB7TWV0ZW9yfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcclxuaW1wb3J0IHtTdG9yZX0gZnJvbSAnLi91ZnMtc3RvcmUnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaWxlIHVwbG9hZGVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVXBsb2FkZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcclxuICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe1xyXG4gICAgICAgICAgICBhZGFwdGl2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgY2FwYWNpdHk6IDAuOSxcclxuICAgICAgICAgICAgY2h1bmtTaXplOiAxNiAqIDEwMjQsXHJcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXHJcbiAgICAgICAgICAgIGZpbGU6IG51bGwsXHJcbiAgICAgICAgICAgIG1heENodW5rU2l6ZTogNCAqIDEwMjQgKiAxMDAwLFxyXG4gICAgICAgICAgICBtYXhUcmllczogNSxcclxuICAgICAgICAgICAgb25BYm9ydDogdGhpcy5vbkFib3J0LFxyXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiB0aGlzLm9uQ29tcGxldGUsXHJcbiAgICAgICAgICAgIG9uQ3JlYXRlOiB0aGlzLm9uQ3JlYXRlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0aGlzLm9uRXJyb3IsXHJcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3M6IHRoaXMub25Qcm9ncmVzcyxcclxuICAgICAgICAgICAgb25TdGFydDogdGhpcy5vblN0YXJ0LFxyXG4gICAgICAgICAgICBvblN0b3A6IHRoaXMub25TdG9wLFxyXG4gICAgICAgICAgICByZXRyeURlbGF5OiAyMDAwLFxyXG4gICAgICAgICAgICBzdG9yZTogbnVsbCxcclxuICAgICAgICAgICAgdHJhbnNmZXJEZWxheTogMTAwXHJcbiAgICAgICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIG9wdGlvbnNcclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuYWRhcHRpdmUgIT09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhZGFwdGl2ZSBpcyBub3QgYSBudW1iZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNhcGFjaXR5ICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjYXBhY2l0eSBpcyBub3QgYSBudW1iZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2FwYWNpdHkgPD0gMCB8fCBvcHRpb25zLmNhcGFjaXR5ID4gMSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignY2FwYWNpdHkgbXVzdCBiZSBhIGZsb2F0IGJldHdlZW4gMC4xIGFuZCAxLjAnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmNodW5rU2l6ZSAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignY2h1bmtTaXplIGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShvcHRpb25zLmRhdGEgaW5zdGFuY2VvZiBCbG9iKSAmJiAhKG9wdGlvbnMuZGF0YSBpbnN0YW5jZW9mIEZpbGUpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RhdGEgaXMgbm90IGFuIEJsb2Igb3IgRmlsZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5maWxlID09PSBudWxsIHx8IHR5cGVvZiBvcHRpb25zLmZpbGUgIT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ZpbGUgaXMgbm90IGFuIG9iamVjdCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMubWF4Q2h1bmtTaXplICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtYXhDaHVua1NpemUgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5tYXhUcmllcyAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbWF4VHJpZXMgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5yZXRyeURlbGF5ICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdyZXRyeURlbGF5IGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudHJhbnNmZXJEZWxheSAhPT0gJ251bWJlcicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndHJhbnNmZXJEZWxheSBpcyBub3QgYSBudW1iZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uQWJvcnQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb25BYm9ydCBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25Db21wbGV0ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvbkNvbXBsZXRlIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbkNyZWF0ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvbkNyZWF0ZSBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25FcnJvciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvbkVycm9yIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vblByb2dyZXNzICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29uUHJvZ3Jlc3MgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uU3RhcnQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb25TdGFydCBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25TdG9wICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29uU3RvcCBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3RvcmUgIT09ICdzdHJpbmcnICYmICEob3B0aW9ucy5zdG9yZSBpbnN0YW5jZW9mIFN0b3JlKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdG9yZSBtdXN0IGJlIHRoZSBuYW1lIG9mIHRoZSBzdG9yZSBvciBhbiBpbnN0YW5jZSBvZiBVcGxvYWRGUy5TdG9yZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHVibGljIGF0dHJpYnV0ZXNcclxuICAgICAgICBzZWxmLmFkYXB0aXZlID0gb3B0aW9ucy5hZGFwdGl2ZTtcclxuICAgICAgICBzZWxmLmNhcGFjaXR5ID0gcGFyc2VGbG9hdChvcHRpb25zLmNhcGFjaXR5KTtcclxuICAgICAgICBzZWxmLmNodW5rU2l6ZSA9IHBhcnNlSW50KG9wdGlvbnMuY2h1bmtTaXplKTtcclxuICAgICAgICBzZWxmLm1heENodW5rU2l6ZSA9IHBhcnNlSW50KG9wdGlvbnMubWF4Q2h1bmtTaXplKTtcclxuICAgICAgICBzZWxmLm1heFRyaWVzID0gcGFyc2VJbnQob3B0aW9ucy5tYXhUcmllcyk7XHJcbiAgICAgICAgc2VsZi5yZXRyeURlbGF5ID0gcGFyc2VJbnQob3B0aW9ucy5yZXRyeURlbGF5KTtcclxuICAgICAgICBzZWxmLnRyYW5zZmVyRGVsYXkgPSBwYXJzZUludChvcHRpb25zLnRyYW5zZmVyRGVsYXkpO1xyXG4gICAgICAgIHNlbGYub25BYm9ydCA9IG9wdGlvbnMub25BYm9ydDtcclxuICAgICAgICBzZWxmLm9uQ29tcGxldGUgPSBvcHRpb25zLm9uQ29tcGxldGU7XHJcbiAgICAgICAgc2VsZi5vbkNyZWF0ZSA9IG9wdGlvbnMub25DcmVhdGU7XHJcbiAgICAgICAgc2VsZi5vbkVycm9yID0gb3B0aW9ucy5vbkVycm9yO1xyXG4gICAgICAgIHNlbGYub25Qcm9ncmVzcyA9IG9wdGlvbnMub25Qcm9ncmVzcztcclxuICAgICAgICBzZWxmLm9uU3RhcnQgPSBvcHRpb25zLm9uU3RhcnQ7XHJcbiAgICAgICAgc2VsZi5vblN0b3AgPSBvcHRpb25zLm9uU3RvcDtcclxuXHJcbiAgICAgICAgLy8gUHJpdmF0ZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgbGV0IHN0b3JlID0gb3B0aW9ucy5zdG9yZTtcclxuICAgICAgICBsZXQgZGF0YSA9IG9wdGlvbnMuZGF0YTtcclxuICAgICAgICBsZXQgY2FwYWNpdHlNYXJnaW4gPSAwLjE7XHJcbiAgICAgICAgbGV0IGZpbGUgPSBvcHRpb25zLmZpbGU7XHJcbiAgICAgICAgbGV0IGZpbGVJZCA9IG51bGw7XHJcbiAgICAgICAgbGV0IG9mZnNldCA9IDA7XHJcbiAgICAgICAgbGV0IGxvYWRlZCA9IDA7XHJcbiAgICAgICAgbGV0IHRvdGFsID0gZGF0YS5zaXplO1xyXG4gICAgICAgIGxldCB0cmllcyA9IDA7XHJcbiAgICAgICAgbGV0IHBvc3RVcmwgPSBudWxsO1xyXG4gICAgICAgIGxldCB0b2tlbiA9IG51bGw7XHJcbiAgICAgICAgbGV0IGNvbXBsZXRlID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IHVwbG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgdGltZUEgPSBudWxsO1xyXG4gICAgICAgIGxldCB0aW1lQiA9IG51bGw7XHJcblxyXG4gICAgICAgIGxldCBlbGFwc2VkVGltZSA9IDA7XHJcbiAgICAgICAgbGV0IHN0YXJ0VGltZSA9IDA7XHJcblxyXG4gICAgICAgIC8vIEtlZXAgb25seSB0aGUgbmFtZSBvZiB0aGUgc3RvcmVcclxuICAgICAgICBpZiAoc3RvcmUgaW5zdGFuY2VvZiBTdG9yZSkge1xyXG4gICAgICAgICAgICBzdG9yZSA9IHN0b3JlLmdldE5hbWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFzc2lnbiBmaWxlIHRvIHN0b3JlXHJcbiAgICAgICAgZmlsZS5zdG9yZSA9IHN0b3JlO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBmaW5pc2goKSB7XHJcbiAgICAgICAgICAgIC8vIEZpbmlzaCB0aGUgdXBsb2FkIGJ5IHRlbGxpbmcgdGhlIHN0b3JlIHRoZSB1cGxvYWQgaXMgY29tcGxldGVcclxuICAgICAgICAgICAgTWV0ZW9yLmNhbGwoJ3Vmc0NvbXBsZXRlJywgZmlsZUlkLCBzdG9yZSwgdG9rZW4sIGZ1bmN0aW9uIChlcnIsIHVwbG9hZGVkRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub25FcnJvcihlcnIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHVwbG9hZGVkRmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlID0gdXBsb2FkZWRGaWxlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub25Db21wbGV0ZSh1cGxvYWRlZEZpbGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEFib3J0cyB0aGUgY3VycmVudCB0cmFuc2ZlclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuYWJvcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgZmlsZSBmcm9tIGRhdGFiYXNlXHJcbiAgICAgICAgICAgIE1ldGVvci5jYWxsKCd1ZnNEZWxldGUnLCBmaWxlSWQsIHN0b3JlLCB0b2tlbiwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkVycm9yKGVyciwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVzZXQgdXBsb2FkZXIgc3RhdHVzXHJcbiAgICAgICAgICAgIHVwbG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmaWxlSWQgPSBudWxsO1xyXG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICB0cmllcyA9IDA7XHJcbiAgICAgICAgICAgIGxvYWRlZCA9IDA7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHN0YXJ0VGltZSA9IG51bGw7XHJcbiAgICAgICAgICAgIHNlbGYub25BYm9ydChmaWxlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBhdmVyYWdlIHNwZWVkIGluIGJ5dGVzIHBlciBzZWNvbmRcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0QXZlcmFnZVNwZWVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBsZXQgc2Vjb25kcyA9IHNlbGYuZ2V0RWxhcHNlZFRpbWUoKSAvIDEwMDA7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmdldExvYWRlZCgpIC8gc2Vjb25kcztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBlbGFwc2VkIHRpbWUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgICAgICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLmdldEVsYXBzZWRUaW1lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc3RhcnRUaW1lICYmIHNlbGYuaXNVcGxvYWRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsYXBzZWRUaW1lICsgKERhdGUubm93KCkgLSBzdGFydFRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBlbGFwc2VkVGltZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBmaWxlXHJcbiAgICAgICAgICogQHJldHVybiB7b2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0RmlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbGU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0aGUgbG9hZGVkIGJ5dGVzXHJcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0TG9hZGVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbG9hZGVkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgY3VycmVudCBwcm9ncmVzc1xyXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLmdldFByb2dyZXNzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5taW4oKGxvYWRlZCAvIHRvdGFsKSAqIDEwMCAvIDEwMCwgMS4wKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSByZW1haW5pbmcgdGltZSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0UmVtYWluaW5nVGltZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgbGV0IGF2ZXJhZ2VTcGVlZCA9IHNlbGYuZ2V0QXZlcmFnZVNwZWVkKCk7XHJcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdCeXRlcyA9IHRvdGFsIC0gc2VsZi5nZXRMb2FkZWQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGF2ZXJhZ2VTcGVlZCAmJiByZW1haW5pbmdCeXRlcyA/IE1hdGgubWF4KHJlbWFpbmluZ0J5dGVzIC8gYXZlcmFnZVNwZWVkLCAwKSA6IDA7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0aGUgdXBsb2FkIHNwZWVkIGluIGJ5dGVzIHBlciBzZWNvbmRcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0U3BlZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aW1lQSAmJiB0aW1lQiAmJiBzZWxmLmlzVXBsb2FkaW5nKCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzZWNvbmRzID0gKHRpbWVCIC0gdGltZUEpIC8gMTAwMDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmNodW5rU2l6ZSAvIHNlY29uZHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0aGUgdG90YWwgYnl0ZXNcclxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5nZXRUb3RhbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENoZWNrcyBpZiB0aGUgdHJhbnNmZXIgaXMgY29tcGxldGVcclxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuaXNDb21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENoZWNrcyBpZiB0aGUgdHJhbnNmZXIgaXMgYWN0aXZlXHJcbiAgICAgICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLmlzVXBsb2FkaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkaW5nO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJlYWRzIGEgcG9ydGlvbiBvZiBmaWxlXHJcbiAgICAgICAgICogQHBhcmFtIHN0YXJ0XHJcbiAgICAgICAgICogQHBhcmFtIGxlbmd0aFxyXG4gICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtCbG9ifVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYucmVhZENodW5rID0gZnVuY3Rpb24gKHN0YXJ0LCBsZW5ndGgsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZWFkQ2h1bmsgaXMgbWlzc2luZyBjYWxsYmFjaycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZW5kO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY2h1bmsgc2l6ZVxyXG4gICAgICAgICAgICAgICAgaWYgKGxlbmd0aCAmJiBzdGFydCArIGxlbmd0aCA+IHRvdGFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gdG90YWw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZCA9IHN0YXJ0ICsgbGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IGNodW5rXHJcbiAgICAgICAgICAgICAgICBsZXQgY2h1bmsgPSBkYXRhLnNsaWNlKHN0YXJ0LCBlbmQpO1xyXG4gICAgICAgICAgICAgICAgLy8gUGFzcyBjaHVuayB0byBjYWxsYmFja1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBudWxsLCBjaHVuayk7XHJcblxyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3JlYWQgZXJyb3InLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmV0cnkgdG8gcmVhZCBjaHVua1xyXG4gICAgICAgICAgICAgICAgTWV0ZW9yLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmllcyA8IHNlbGYubWF4VHJpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZXMgKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWFkQ2h1bmsoc3RhcnQsIGxlbmd0aCwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIHNlbGYucmV0cnlEZWxheSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZW5kcyBhIGZpbGUgY2h1bmsgdG8gdGhlIHN0b3JlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5zZW5kQ2h1bmsgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICghY29tcGxldGUgJiYgc3RhcnRUaW1lICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgdG90YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2h1bmtTaXplID0gc2VsZi5jaHVua1NpemU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVzZSBhZGFwdGl2ZSBsZW5ndGhcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5hZGFwdGl2ZSAmJiB0aW1lQSAmJiB0aW1lQiAmJiB0aW1lQiA+IHRpbWVBKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkdXJhdGlvbiA9ICh0aW1lQiAtIHRpbWVBKSAvIDEwMDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXggPSBzZWxmLmNhcGFjaXR5ICogKDEgKyBjYXBhY2l0eU1hcmdpbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtaW4gPSBzZWxmLmNhcGFjaXR5ICogKDEgLSBjYXBhY2l0eU1hcmdpbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHVyYXRpb24gPj0gbWF4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVua1NpemUgPSBNYXRoLmFicyhNYXRoLnJvdW5kKGNodW5rU2l6ZSAqIChtYXggLSBkdXJhdGlvbikpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZHVyYXRpb24gPCBtaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rU2l6ZSA9IE1hdGgucm91bmQoY2h1bmtTaXplICogKG1pbiAvIGR1cmF0aW9uKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTGltaXQgdG8gbWF4IGNodW5rIHNpemVcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYubWF4Q2h1bmtTaXplID4gMCAmJiBjaHVua1NpemUgPiBzZWxmLm1heENodW5rU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmtTaXplID0gc2VsZi5tYXhDaHVua1NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIExpbWl0IHRvIG1heCBjaHVuayBzaXplXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYubWF4Q2h1bmtTaXplID4gMCAmJiBjaHVua1NpemUgPiBzZWxmLm1heENodW5rU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVua1NpemUgPSBzZWxmLm1heENodW5rU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlZHVjZSBjaHVuayBzaXplIHRvIGZpdCB0b3RhbFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgKyBjaHVua1NpemUgPiB0b3RhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVua1NpemUgPSB0b3RhbCAtIG9mZnNldDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXBhcmUgdGhlIGNodW5rXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWFkQ2h1bmsob2Zmc2V0LCBjaHVua1NpemUsIGZ1bmN0aW9uIChlcnIsIGNodW5rKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25FcnJvcihlcnIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXy5jb250YWlucyhbMjAwLCAyMDEsIDIwMiwgMjA0XSwgeGhyLnN0YXR1cykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZUIgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gY2h1bmtTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKz0gY2h1bmtTaXplO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VuZCBuZXh0IGNodW5rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25Qcm9ncmVzcyhmaWxlLCBzZWxmLmdldFByb2dyZXNzKCkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluaXNoIHVwbG9hZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkID49IHRvdGFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGFwc2VkVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaW5pc2goKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1ldGVvci5zZXRUaW1lb3V0KHNlbGYuc2VuZENodW5rLCBzZWxmLnRyYW5zZmVyRGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFfLmNvbnRhaW5zKFs0MDIsIDQwMywgNDA0LCA1MDBdLCB4aHIuc3RhdHVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXRyeSB1bnRpbCBtYXggdHJpZXMgaXMgcmVhY2hcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnV0IGRvbid0IHJldHJ5IGlmIHRoZXNlIGVycm9ycyBvY2N1clxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHJpZXMgPD0gc2VsZi5tYXhUcmllcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJpZXMgKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdhaXQgYmVmb3JlIHJldHJ5aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZXRlb3Iuc2V0VGltZW91dChzZWxmLnNlbmRDaHVuaywgc2VsZi5yZXRyeURlbGF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB1cGxvYWQgcHJvZ3Jlc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gKG9mZnNldCArIGNodW5rU2l6ZSkgLyB0b3RhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGV0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvcm1EYXRhLmFwcGVuZCgncHJvZ3Jlc3MnLCBwcm9ncmVzcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvcm1EYXRhLmFwcGVuZCgnY2h1bmsnLCBjaHVuayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBgJHtwb3N0VXJsfSZwcm9ncmVzcz0ke3Byb2dyZXNzfWA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lQSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVCID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgY2h1bmsgdG8gdGhlIHN0b3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHhoci5vcGVuKCdQT1NUJywgdXJsLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLnNlbmQoY2h1bmspO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU3RhcnRzIG9yIHJlc3VtZXMgdGhlIHRyYW5zZmVyXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFmaWxlSWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZmlsZSBkb2N1bWVudCBhbmQgZ2V0IHRoZSB0b2tlblxyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBhbGxvd3MgdGhlIHVzZXIgdG8gc2VuZCBjaHVua3MgdG8gdGhlIHN0b3JlLlxyXG4gICAgICAgICAgICAgICAgTWV0ZW9yLmNhbGwoJ3Vmc0NyZWF0ZScsIF8uZXh0ZW5kKHt9LCBmaWxlKSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uRXJyb3IoZXJyLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHJlc3VsdC50b2tlbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdFVybCA9IHJlc3VsdC51cmw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJZCA9IHJlc3VsdC5maWxlSWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuX2lkID0gcmVzdWx0LmZpbGVJZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkNyZWF0ZShmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJpZXMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uU3RhcnQoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2VuZENodW5rKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXVwbG9hZGluZyAmJiAhY29tcGxldGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlc3VtZSB1cGxvYWRpbmdcclxuICAgICAgICAgICAgICAgIHRyaWVzID0gMDtcclxuICAgICAgICAgICAgICAgIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm9uU3RhcnQoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNlbmRDaHVuaygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU3RvcHMgdGhlIHRyYW5zZmVyXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodXBsb2FkaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgZWxhcHNlZCB0aW1lXHJcbiAgICAgICAgICAgICAgICBlbGFwc2VkVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XHJcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdXBsb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm9uU3RvcChmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBNZXRlb3IuY2FsbCgndWZzU3RvcCcsIGZpbGVJZCwgc3RvcmUsIHRva2VuLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25FcnJvcihlcnIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBmaWxlIHVwbG9hZCBpcyBhYm9ydGVkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvbkFib3J0KGZpbGUpIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBmaWxlIHVwbG9hZCBpcyBjb21wbGV0ZVxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgb25Db21wbGV0ZShmaWxlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgZmlsZSBpcyBjcmVhdGVkIGluIHRoZSBjb2xsZWN0aW9uXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvbkNyZWF0ZShmaWxlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiBhbiBlcnJvciBvY2N1cnMgZHVyaW5nIGZpbGUgdXBsb2FkXHJcbiAgICAgKiBAcGFyYW0gZXJyXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvbkVycm9yKGVyciwgZmlsZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogJHtlcnIubWVzc2FnZX1gKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIGEgZmlsZSBjaHVuayBoYXMgYmVlbiBzZW50XHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHBhcmFtIHByb2dyZXNzIGlzIGEgZmxvYXQgZnJvbSAwLjAgdG8gMS4wXHJcbiAgICAgKi9cclxuICAgIG9uUHJvZ3Jlc3MoZmlsZSwgcHJvZ3Jlc3MpIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBmaWxlIHVwbG9hZCBzdGFydHNcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIG9uU3RhcnQoZmlsZSkge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGZpbGUgdXBsb2FkIHN0b3BzXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvblN0b3AoZmlsZSkge1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
