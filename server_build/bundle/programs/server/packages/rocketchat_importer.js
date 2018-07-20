(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:importer":{"server":{"classes":{"ImporterBase.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/classes/ImporterBase.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Base: () => Base
});
let Progress;
module.watch(require("./ImporterProgress"), {
  Progress(v) {
    Progress = v;
  }

}, 0);
let ProgressStep;
module.watch(require("../../lib/ImporterProgressStep"), {
  ProgressStep(v) {
    ProgressStep = v;
  }

}, 1);
let Selection;
module.watch(require("./ImporterSelection"), {
  Selection(v) {
    Selection = v;
  }

}, 2);
let Imports;
module.watch(require("../models/Imports"), {
  Imports(v) {
    Imports = v;
  }

}, 3);
let ImporterInfo;
module.watch(require("../../lib/ImporterInfo"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 4);
let RawImports;
module.watch(require("../models/RawImports"), {
  RawImports(v) {
    RawImports = v;
  }

}, 5);
let ImporterWebsocket;
module.watch(require("./ImporterWebsocket"), {
  ImporterWebsocket(v) {
    ImporterWebsocket = v;
  }

}, 6);
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 7);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 8);
let AdmZip;
module.watch(require("adm-zip"), {
  default(v) {
    AdmZip = v;
  }

}, 9);
let getFileType;
module.watch(require("file-type"), {
  default(v) {
    getFileType = v;
  }

}, 10);

class Base {
  /**
   * The max BSON object size we can store in MongoDB is 16777216 bytes
   * but for some reason the mongo instanace which comes with Meteor
   * errors out for anything close to that size. So, we are rounding it
   * down to 8000000 bytes.
   *
   * @param {any} item The item to calculate the BSON size of.
   * @returns {number} The size of the item passed in.
   * @static
   */
  static getBSONSize(item) {
    const {
      BSON
    } = require('bson');

    const bson = new BSON();
    return bson.calculateObjectSize(item);
  }
  /**
   * The max BSON object size we can store in MongoDB is 16777216 bytes
   * but for some reason the mongo instanace which comes with Meteor
   * errors out for anything close to that size. So, we are rounding it
   * down to 8000000 bytes.
   *
   * @returns {number} 8000000 bytes.
   */


  static getMaxBSONSize() {
    return 8000000;
  }
  /**
   * Splits the passed in array to at least one array which has a size that
   * is safe to store in the database.
   *
   * @param {any[]} theArray The array to split out
   * @returns {any[][]} The safe sized arrays
   * @static
   */


  static getBSONSafeArraysFromAnArray(theArray) {
    const BSONSize = Base.getBSONSize(theArray);
    const maxSize = Math.floor(theArray.length / Math.ceil(BSONSize / Base.getMaxBSONSize()));
    const safeArrays = [];
    let i = 0;

    while (i < theArray.length) {
      safeArrays.push(theArray.slice(i, i += maxSize));
    }

    return safeArrays;
  }
  /**
   * Constructs a new importer, adding an empty collection, AdmZip property, and empty users & channels
   *
   * @param {string} name The importer's name.
   * @param {string} description The i18n string which describes the importer
   * @param {string} mimeType The expected file type.
   */


  constructor(info) {
    if (!(info instanceof ImporterInfo)) {
      throw new Error('Information passed in must be a valid ImporterInfo instance.');
    }

    this.http = http;
    this.https = https;
    this.AdmZip = AdmZip;
    this.getFileType = getFileType;
    this.prepare = this.prepare.bind(this);
    this.startImport = this.startImport.bind(this);
    this.getSelection = this.getSelection.bind(this);
    this.getProgress = this.getProgress.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.addCountToTotal = this.addCountToTotal.bind(this);
    this.addCountCompleted = this.addCountCompleted.bind(this);
    this.updateRecord = this.updateRecord.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.info = info;
    this.logger = new Logger(`${this.info.name} Importer`, {});
    this.progress = new Progress(this.info.key, this.info.name);
    this.collection = RawImports;
    const importId = Imports.insert({
      'type': this.info.name,
      'ts': Date.now(),
      'status': this.progress.step,
      'valid': true,
      'user': Meteor.user()._id
    });
    this.importRecord = Imports.findOne(importId);
    this.users = {};
    this.channels = {};
    this.messages = {};
    this.oldSettings = {};
    this.logger.debug(`Constructed a new ${info.name} Importer.`);
  }
  /**
   * Takes the uploaded file and extracts the users, channels, and messages from it.
   *
   * @param {string} dataURI Base64 string of the uploaded file
   * @param {string} sentContentType The sent file type.
   * @param {string} fileName The name of the uploaded file.
   * @param {boolean} skipTypeCheck Optional property that says to not check the type provided.
   * @returns {Progress} The progress record of the import.
   */


  prepare(dataURI, sentContentType, fileName, skipTypeCheck) {
    if (!skipTypeCheck) {
      const fileType = this.getFileType(new Buffer(dataURI.split(',')[1], 'base64'));
      this.logger.debug('Uploaded file information is:', fileType);
      this.logger.debug('Expected file type is:', this.info.mimeType);

      if (!fileType || fileType.mime !== this.info.mimeType) {
        this.logger.warn(`Invalid file uploaded for the ${this.info.name} importer.`);
        this.updateProgress(ProgressStep.ERROR);
        throw new Meteor.Error('error-invalid-file-uploaded', `Invalid file uploaded to import ${this.info.name} data from.`, {
          step: 'prepare'
        });
      }
    }

    this.updateProgress(ProgressStep.PREPARING_STARTED);
    return this.updateRecord({
      'file': fileName
    });
  }
  /**
   * Starts the import process. The implementing method should defer
   * as soon as the selection is set, so the user who started the process
   * doesn't end up with a "locked" UI while Meteor waits for a response.
   * The returned object should be the progress.
   *
   * @param {Selection} importSelection The selection data.
   * @returns {Progress} The progress record of the import.
   */


  startImport(importSelection) {
    if (!(importSelection instanceof Selection)) {
      throw new Error(`Invalid Selection data provided to the ${this.info.name} importer.`);
    } else if (importSelection.users === undefined) {
      throw new Error(`Users in the selected data wasn't found, it must but at least an empty array for the ${this.info.name} importer.`);
    } else if (importSelection.channels === undefined) {
      throw new Error(`Channels in the selected data wasn't found, it must but at least an empty array for the ${this.info.name} importer.`);
    }

    return this.updateProgress(ProgressStep.IMPORTING_STARTED);
  }
  /**
   * Gets the Selection object for the import.
   *
   * @returns {Selection} The users and channels selection
   */


  getSelection() {
    throw new Error(`Invalid 'getSelection' called on ${this.info.name}, it must be overridden and super can not be called.`);
  }
  /**
   * Gets the progress of this import.
   *
   * @returns {Progress} The progress record of the import.
   */


  getProgress() {
    return this.progress;
  }
  /**
   * Updates the progress step of this importer.
   * It also changes some internal settings at various stages of the import.
   * This way the importer can adjust user/room information at will.
   *
   * @param {ProgressStep} step The progress step which this import is currently at.
   * @returns {Progress} The progress record of the import.
   */


  updateProgress(step) {
    this.progress.step = step;

    switch (step) {
      case ProgressStep.IMPORTING_STARTED:
        this.oldSettings.Accounts_AllowedDomainsList = RocketChat.models.Settings.findOneById('Accounts_AllowedDomainsList').value;
        RocketChat.models.Settings.updateValueById('Accounts_AllowedDomainsList', '');
        this.oldSettings.Accounts_AllowUsernameChange = RocketChat.models.Settings.findOneById('Accounts_AllowUsernameChange').value;
        RocketChat.models.Settings.updateValueById('Accounts_AllowUsernameChange', true);
        this.oldSettings.FileUpload_MaxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').value;
        RocketChat.models.Settings.updateValueById('FileUpload_MaxFileSize', -1);
        break;

      case ProgressStep.DONE:
      case ProgressStep.ERROR:
        RocketChat.models.Settings.updateValueById('Accounts_AllowedDomainsList', this.oldSettings.Accounts_AllowedDomainsList);
        RocketChat.models.Settings.updateValueById('Accounts_AllowUsernameChange', this.oldSettings.Accounts_AllowUsernameChange);
        RocketChat.models.Settings.updateValueById('FileUpload_MaxFileSize', this.oldSettings.FileUpload_MaxFileSize);
        break;
    }

    this.logger.debug(`${this.info.name} is now at ${step}.`);
    this.updateRecord({
      'status': this.progress.step
    });
    ImporterWebsocket.progressUpdated(this.progress);
    return this.progress;
  }
  /**
   * Adds the passed in value to the total amount of items needed to complete.
   *
   * @param {number} count The amount to add to the total count of items.
   * @returns {Progress} The progress record of the import.
   */


  addCountToTotal(count) {
    this.progress.count.total = this.progress.count.total + count;
    this.updateRecord({
      'count.total': this.progress.count.total
    });
    return this.progress;
  }
  /**
   * Adds the passed in value to the total amount of items completed.
   *
   * @param {number} count The amount to add to the total count of finished items.
   * @returns {Progress} The progress record of the import.
   */


  addCountCompleted(count) {
    this.progress.count.completed = this.progress.count.completed + count; //Only update the database every 500 records
    //Or the completed is greater than or equal to the total amount

    if (this.progress.count.completed % 500 === 0 || this.progress.count.completed >= this.progress.count.total) {
      this.updateRecord({
        'count.completed': this.progress.count.completed
      });
    }

    ImporterWebsocket.progressUpdated(this.progress);
    return this.progress;
  }
  /**
   * Updates the import record with the given fields being `set`.
   *
   * @param {any} fields The fields to set, it should be an object with key/values.
   * @returns {Imports} The import record.
   */


  updateRecord(fields) {
    Imports.update({
      _id: this.importRecord._id
    }, {
      $set: fields
    });
    this.importRecord = Imports.findOne(this.importRecord._id);
    return this.importRecord;
  }
  /**
   * Uploads the file to the storage.
   *
   * @param {any} details An object with details about the upload: `name`, `size`, `type`, and `rid`.
   * @param {string} fileUrl Url of the file to download/import.
   * @param {any} user The Rocket.Chat user.
   * @param {any} room The Rocket.Chat Room.
   * @param {Date} timeStamp The timestamp the file was uploaded
   */


  uploadFile(details, fileUrl, user, room, timeStamp) {
    this.logger.debug(`Uploading the file ${details.name} from ${fileUrl}.`);
    const requestModule = /https/i.test(fileUrl) ? this.https : this.http;
    const fileStore = FileUpload.getStore('Uploads');
    return requestModule.get(fileUrl, Meteor.bindEnvironment(function (res) {
      const rawData = [];
      res.on('data', chunk => rawData.push(chunk));
      res.on('end', Meteor.bindEnvironment(() => {
        fileStore.insert(details, Buffer.concat(rawData), function (err, file) {
          if (err) {
            throw new Error(err);
          } else {
            const url = file.url.replace(Meteor.absoluteUrl(), '/');
            const attachment = {
              title: file.name,
              title_link: url
            };

            if (/^image\/.+/.test(file.type)) {
              attachment.image_url = url;
              attachment.image_type = file.type;
              attachment.image_size = file.size;
              attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
            }

            if (/^audio\/.+/.test(file.type)) {
              attachment.audio_url = url;
              attachment.audio_type = file.type;
              attachment.audio_size = file.size;
            }

            if (/^video\/.+/.test(file.type)) {
              attachment.video_url = url;
              attachment.video_type = file.type;
              attachment.video_size = file.size;
            }

            const msg = {
              rid: details.rid,
              ts: timeStamp,
              msg: '',
              file: {
                _id: file._id
              },
              groupable: false,
              attachments: [attachment]
            };

            if (details.message_id != null && typeof details.message_id === 'string') {
              msg['_id'] = details.message_id;
            }

            return RocketChat.sendMessage(user, msg, room, true);
          }
        });
      }));
    }));
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ImporterProgress.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/classes/ImporterProgress.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Progress: () => Progress
});
let ProgressStep;
module.watch(require("../../lib/ImporterProgressStep"), {
  ProgressStep(v) {
    ProgressStep = v;
  }

}, 0);

class Progress {
  /**
   * Creates a new progress container for the importer.
   *
   * @param {string} key The unique key of the importer.
   * @param {string} name The name of the importer.
   */
  constructor(key, name) {
    this.key = key;
    this.name = name;
    this.step = ProgressStep.NEW;
    this.count = {
      completed: 0,
      total: 0
    };
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ImporterSelection.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/classes/ImporterSelection.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Selection: () => Selection
});

class Selection {
  /**
   * Constructs a new importer selection object.
   *
   * @param {string} name the name of the importer
   * @param {SelectionUser[]} users the users which can be selected
   * @param {SelectionChannel[]} channels the channels which can be selected
   * @param {number} message_count the number of messages
   */
  constructor(name, users, channels, message_count) {
    this.name = name;
    this.users = users;
    this.channels = channels;
    this.message_count = message_count;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ImporterSelectionChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/classes/ImporterSelectionChannel.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  SelectionChannel: () => SelectionChannel
});

class SelectionChannel {
  /**
   * Constructs a new selection channel.
   *
   * @param {string} channel_id the unique identifier of the channel
   * @param {string} name the name of the channel
   * @param {boolean} is_archived whether the channel was archived or not
   * @param {boolean} do_import whether we will be importing the channel or not
   * @param {boolean} is_private whether the channel is private or public
   */
  constructor(channel_id, name, is_archived, do_import, is_private) {
    this.channel_id = channel_id;
    this.name = name;
    this.is_archived = is_archived;
    this.do_import = do_import;
    this.is_private = is_private;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ImporterSelectionUser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/classes/ImporterSelectionUser.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  SelectionUser: () => SelectionUser
});

class SelectionUser {
  /**
   * Constructs a new selection user.
   *
   * @param {string} user_id the unique user identifier
   * @param {string} username the user's username
   * @param {string} email the user's email
   * @param {boolean} is_deleted whether the user was deleted or not
   * @param {boolean} is_bot whether the user is a bot or not
   * @param {boolean} do_import whether we are going to import this user or not
   */
  constructor(user_id, username, email, is_deleted, is_bot, do_import) {
    this.user_id = user_id;
    this.username = username;
    this.email = email;
    this.is_deleted = is_deleted;
    this.is_bot = is_bot;
    this.do_import = do_import;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ImporterWebsocket.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/classes/ImporterWebsocket.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ImporterWebsocket: () => ImporterWebsocket
});

class ImporterWebsocketDef {
  constructor() {
    this.streamer = new Meteor.Streamer('importers', {
      retransmit: false
    });
    this.streamer.allowRead('all');
    this.streamer.allowEmit('all');
    this.streamer.allowWrite('none');
  }
  /**
   * Called when the progress is updated.
   *
   * @param {Progress} progress The progress of the import.
   */


  progressUpdated(progress) {
    this.streamer.emit('progress', progress);
  }

}

const ImporterWebsocket = new ImporterWebsocketDef();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Imports.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/models/Imports.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Imports: () => Imports
});

class ImportsModel extends RocketChat.models._Base {
  constructor() {
    super('import');
  }

}

const Imports = new ImportsModel();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RawImports.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/models/RawImports.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  RawImports: () => RawImports
});

class RawImportsModel extends RocketChat.models._Base {
  constructor() {
    super('raw_imports');
  }

}

const RawImports = new RawImportsModel();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"getImportProgress.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/methods/getImportProgress.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
Meteor.methods({
  getImportProgress(key) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getImportProgress'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
      throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
        method: 'setupImporter'
      });
    }

    const importer = Importers.get(key);

    if (!importer) {
      throw new Meteor.Error('error-importer-not-defined', `The importer (${key}) has no import class defined.`, {
        method: 'getImportProgress'
      });
    }

    if (!importer.instance) {
      return undefined;
    }

    return importer.instance.getProgress();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getSelectionData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/methods/getSelectionData.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers, ProgressStep;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  },

  ProgressStep(v) {
    ProgressStep = v;
  }

}, 0);
Meteor.methods({
  getSelectionData(key) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getSelectionData'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
      throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
        method: 'setupImporter'
      });
    }

    const importer = Importers.get(key);

    if (!importer || !importer.instance) {
      throw new Meteor.Error('error-importer-not-defined', `The importer (${key}) has no import class defined.`, {
        method: 'getSelectionData'
      });
    }

    const progress = importer.instance.getProgress();

    switch (progress.step) {
      case ProgressStep.USER_SELECTION:
        return importer.instance.getSelection();

      default:
        return undefined;
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"prepareImport.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/methods/prepareImport.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
Meteor.methods({
  prepareImport(key, dataURI, contentType, fileName) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'prepareImport'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
      throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
        method: 'setupImporter'
      });
    }

    check(key, String);
    check(dataURI, String);
    check(fileName, String);
    const importer = Importers.get(key);

    if (!importer) {
      throw new Meteor.Error('error-importer-not-defined', `The importer (${key}) has no import class defined.`, {
        method: 'prepareImport'
      });
    }

    const results = importer.instance.prepare(dataURI, contentType, fileName);

    if (results instanceof Promise) {
      return results.catch(e => {
        throw new Meteor.Error(e);
      });
    } else {
      return results;
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"restartImport.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/methods/restartImport.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers, ProgressStep;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  },

  ProgressStep(v) {
    ProgressStep = v;
  }

}, 0);
Meteor.methods({
  restartImport(key) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'restartImport'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
      throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
        method: 'setupImporter'
      });
    }

    const importer = Importers.get(key);

    if (!importer) {
      throw new Meteor.Error('error-importer-not-defined', `The importer (${key}) has no import class defined.`, {
        method: 'restartImport'
      });
    }

    if (importer.instance) {
      importer.instance.updateProgress(ProgressStep.CANCELLED);
      importer.instance.updateRecord({
        valid: false
      });
      importer.instance = undefined;
    }

    importer.instance = new importer.importer(importer); // eslint-disable-line new-cap

    return importer.instance.getProgress();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setupImporter.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/methods/setupImporter.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
Meteor.methods({
  setupImporter(key) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setupImporter'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
      throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
        method: 'setupImporter'
      });
    }

    const importer = Importers.get(key);

    if (!importer) {
      console.warn(`Tried to setup ${name} as an importer.`);
      throw new Meteor.Error('error-importer-not-defined', 'The importer was not defined correctly, it is missing the Import class.', {
        method: 'setupImporter'
      });
    }

    if (importer.instance) {
      return importer.instance.getProgress();
    }

    importer.instance = new importer.importer(importer); //eslint-disable-line new-cap

    return importer.instance.getProgress();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startImport.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/methods/startImport.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers, Selection, SelectionChannel, SelectionUser;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  },

  Selection(v) {
    Selection = v;
  },

  SelectionChannel(v) {
    SelectionChannel = v;
  },

  SelectionUser(v) {
    SelectionUser = v;
  }

}, 0);
Meteor.methods({
  startImport(key, input) {
    // Takes name and object with users / channels selected to import
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'startImport'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'run-import')) {
      throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', {
        method: 'startImport'
      });
    }

    if (!key) {
      throw new Meteor.Error('error-invalid-importer', `No defined importer by: "${key}"`, {
        method: 'startImport'
      });
    }

    const importer = Importers.get(key);

    if (!importer || !importer.instance) {
      throw new Meteor.Error('error-importer-not-defined', `The importer (${key}) has no import class defined.`, {
        method: 'startImport'
      });
    }

    const usersSelection = input.users.map(user => new SelectionUser(user.user_id, user.username, user.email, user.is_deleted, user.is_bot, user.do_import));
    const channelsSelection = input.channels.map(channel => new SelectionChannel(channel.channel_id, channel.name, channel.is_archived, channel.do_import));
    const selection = new Selection(importer.name, usersSelection, channelsSelection);
    return importer.instance.startImport(selection);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"setImportsToInvalid.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/startup/setImportsToInvalid.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Imports;
module.watch(require("../models/Imports"), {
  Imports(v) {
    Imports = v;
  }

}, 0);
let RawImports;
module.watch(require("../models/RawImports"), {
  RawImports(v) {
    RawImports = v;
  }

}, 1);
Meteor.startup(function () {
  // Make sure all imports are marked as invalid, data clean up since you can't
  // restart an import at the moment.
  Imports.update({
    valid: {
      $ne: false
    }
  }, {
    $set: {
      valid: false
    }
  }, {
    multi: true
  }); // Clean up all the raw import data, since you can't restart an import at the moment

  try {
    RawImports.model.rawCollection().drop();
  } catch (e) {
    console.log('errror', e); //TODO: Remove
    // ignored
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/server/index.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Base: () => Base,
  Imports: () => Imports,
  Importers: () => Importers,
  ImporterInfo: () => ImporterInfo,
  ImporterWebsocket: () => ImporterWebsocket,
  Progress: () => Progress,
  ProgressStep: () => ProgressStep,
  RawImports: () => RawImports,
  Selection: () => Selection,
  SelectionChannel: () => SelectionChannel,
  SelectionUser: () => SelectionUser
});
let Base;
module.watch(require("./classes/ImporterBase"), {
  Base(v) {
    Base = v;
  }

}, 0);
let Imports;
module.watch(require("./models/Imports"), {
  Imports(v) {
    Imports = v;
  }

}, 1);
let Importers;
module.watch(require("../lib/Importers"), {
  Importers(v) {
    Importers = v;
  }

}, 2);
let ImporterInfo;
module.watch(require("../lib/ImporterInfo"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 3);
let ImporterWebsocket;
module.watch(require("./classes/ImporterWebsocket"), {
  ImporterWebsocket(v) {
    ImporterWebsocket = v;
  }

}, 4);
let Progress;
module.watch(require("./classes/ImporterProgress"), {
  Progress(v) {
    Progress = v;
  }

}, 5);
let ProgressStep;
module.watch(require("../lib/ImporterProgressStep"), {
  ProgressStep(v) {
    ProgressStep = v;
  }

}, 6);
let RawImports;
module.watch(require("./models/RawImports"), {
  RawImports(v) {
    RawImports = v;
  }

}, 7);
let Selection;
module.watch(require("./classes/ImporterSelection"), {
  Selection(v) {
    Selection = v;
  }

}, 8);
let SelectionChannel;
module.watch(require("./classes/ImporterSelectionChannel"), {
  SelectionChannel(v) {
    SelectionChannel = v;
  }

}, 9);
let SelectionUser;
module.watch(require("./classes/ImporterSelectionUser"), {
  SelectionUser(v) {
    SelectionUser = v;
  }

}, 10);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"ImporterInfo.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/lib/ImporterInfo.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ImporterInfo: () => ImporterInfo
});

class ImporterInfo {
  /**
   * Creates a new class which contains information about the importer.
   *
   * @param {string} key The unique key of this importer.
   * @param {string} name The i18n name.
   * @param {string} mimeType The type of file it expects.
   * @param {{ href: string, text: string }[]} warnings An array of warning objects. `{ href, text }`
   */
  constructor(key, name = '', mimeType = '', warnings = []) {
    this.key = key;
    this.name = name;
    this.mimeType = mimeType;
    this.warnings = warnings;
    this.importer = undefined;
    this.instance = undefined;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ImporterProgressStep.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/lib/ImporterProgressStep.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ProgressStep: () => ProgressStep
});
const ProgressStep = Object.freeze({
  NEW: 'importer_new',
  PREPARING_STARTED: 'importer_preparing_started',
  PREPARING_USERS: 'importer_preparing_users',
  PREPARING_CHANNELS: 'importer_preparing_channels',
  PREPARING_MESSAGES: 'importer_preparing_messages',
  USER_SELECTION: 'importer_user_selection',
  IMPORTING_STARTED: 'importer_importing_started',
  IMPORTING_USERS: 'importer_importing_users',
  IMPORTING_CHANNELS: 'importer_importing_channels',
  IMPORTING_MESSAGES: 'importer_importing_messages',
  FINISHING: 'importer_finishing',
  DONE: 'importer_done',
  ERROR: 'importer_import_failed',
  CANCELLED: 'importer_import_cancelled'
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Importers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer/lib/Importers.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Importers: () => Importers
});
let ImporterInfo;
module.watch(require("./ImporterInfo"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 0);

/** Container class which holds all of the importer details. */
class ImportersContainer {
  constructor() {
    this.importers = new Map();
  }
  /**
   * Adds an importer to the import collection. Adding it more than once will
   * overwrite the previous one.
   *
   * @param {ImporterInfo} info The information related to the importer.
   * @param {*} importer The class for the importer, will be undefined on the client.
   */


  add(info, importer) {
    if (!(info instanceof ImporterInfo)) {
      throw new Error('The importer must be a valid ImporterInfo instance.');
    }

    info.importer = importer;
    this.importers.set(info.key, info);
    return this.importers.get(info.key);
  }
  /**
   * Gets the importer information that is stored.
   *
   * @param {string} key The key of the importer.
   */


  get(key) {
    return this.importers.get(key);
  }
  /**
   * Gets all of the importers in array format.
   *
   * @returns {ImporterInfo[]} The array of importer information.
   */


  getAll() {
    return Array.from(this.importers.values());
  }

}

const Importers = new ImportersContainer();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:importer/server/classes/ImporterBase.js");
require("/node_modules/meteor/rocketchat:importer/server/classes/ImporterProgress.js");
require("/node_modules/meteor/rocketchat:importer/server/classes/ImporterSelection.js");
require("/node_modules/meteor/rocketchat:importer/server/classes/ImporterSelectionChannel.js");
require("/node_modules/meteor/rocketchat:importer/server/classes/ImporterSelectionUser.js");
require("/node_modules/meteor/rocketchat:importer/server/classes/ImporterWebsocket.js");
require("/node_modules/meteor/rocketchat:importer/lib/ImporterInfo.js");
require("/node_modules/meteor/rocketchat:importer/lib/ImporterProgressStep.js");
require("/node_modules/meteor/rocketchat:importer/lib/Importers.js");
require("/node_modules/meteor/rocketchat:importer/server/models/Imports.js");
require("/node_modules/meteor/rocketchat:importer/server/models/RawImports.js");
require("/node_modules/meteor/rocketchat:importer/server/methods/getImportProgress.js");
require("/node_modules/meteor/rocketchat:importer/server/methods/getSelectionData.js");
require("/node_modules/meteor/rocketchat:importer/server/methods/prepareImport.js");
require("/node_modules/meteor/rocketchat:importer/server/methods/restartImport.js");
require("/node_modules/meteor/rocketchat:importer/server/methods/setupImporter.js");
require("/node_modules/meteor/rocketchat:importer/server/methods/startImport.js");
require("/node_modules/meteor/rocketchat:importer/server/startup/setImportsToInvalid.js");
var exports = require("/node_modules/meteor/rocketchat:importer/server/index.js");

/* Exports */
Package._define("rocketchat:importer", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_importer.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvY2xhc3Nlcy9JbXBvcnRlckJhc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXIvc2VydmVyL2NsYXNzZXMvSW1wb3J0ZXJQcm9ncmVzcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvY2xhc3Nlcy9JbXBvcnRlclNlbGVjdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvY2xhc3Nlcy9JbXBvcnRlclNlbGVjdGlvbkNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXIvc2VydmVyL2NsYXNzZXMvSW1wb3J0ZXJTZWxlY3Rpb25Vc2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyL3NlcnZlci9jbGFzc2VzL0ltcG9ydGVyV2Vic29ja2V0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyL3NlcnZlci9tb2RlbHMvSW1wb3J0cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvbW9kZWxzL1Jhd0ltcG9ydHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXIvc2VydmVyL21ldGhvZHMvZ2V0SW1wb3J0UHJvZ3Jlc3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXIvc2VydmVyL21ldGhvZHMvZ2V0U2VsZWN0aW9uRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvbWV0aG9kcy9wcmVwYXJlSW1wb3J0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyL3NlcnZlci9tZXRob2RzL3Jlc3RhcnRJbXBvcnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXIvc2VydmVyL21ldGhvZHMvc2V0dXBJbXBvcnRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvbWV0aG9kcy9zdGFydEltcG9ydC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9zZXJ2ZXIvc3RhcnR1cC9zZXRJbXBvcnRzVG9JbnZhbGlkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9saWIvSW1wb3J0ZXJJbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyL2xpYi9JbXBvcnRlclByb2dyZXNzU3RlcC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci9saWIvSW1wb3J0ZXJzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkJhc2UiLCJQcm9ncmVzcyIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJQcm9ncmVzc1N0ZXAiLCJTZWxlY3Rpb24iLCJJbXBvcnRzIiwiSW1wb3J0ZXJJbmZvIiwiUmF3SW1wb3J0cyIsIkltcG9ydGVyV2Vic29ja2V0IiwiaHR0cCIsImRlZmF1bHQiLCJodHRwcyIsIkFkbVppcCIsImdldEZpbGVUeXBlIiwiZ2V0QlNPTlNpemUiLCJpdGVtIiwiQlNPTiIsImJzb24iLCJjYWxjdWxhdGVPYmplY3RTaXplIiwiZ2V0TWF4QlNPTlNpemUiLCJnZXRCU09OU2FmZUFycmF5c0Zyb21BbkFycmF5IiwidGhlQXJyYXkiLCJCU09OU2l6ZSIsIm1heFNpemUiLCJNYXRoIiwiZmxvb3IiLCJsZW5ndGgiLCJjZWlsIiwic2FmZUFycmF5cyIsImkiLCJwdXNoIiwic2xpY2UiLCJjb25zdHJ1Y3RvciIsImluZm8iLCJFcnJvciIsInByZXBhcmUiLCJiaW5kIiwic3RhcnRJbXBvcnQiLCJnZXRTZWxlY3Rpb24iLCJnZXRQcm9ncmVzcyIsInVwZGF0ZVByb2dyZXNzIiwiYWRkQ291bnRUb1RvdGFsIiwiYWRkQ291bnRDb21wbGV0ZWQiLCJ1cGRhdGVSZWNvcmQiLCJ1cGxvYWRGaWxlIiwibG9nZ2VyIiwiTG9nZ2VyIiwibmFtZSIsInByb2dyZXNzIiwia2V5IiwiY29sbGVjdGlvbiIsImltcG9ydElkIiwiaW5zZXJ0IiwiRGF0ZSIsIm5vdyIsInN0ZXAiLCJNZXRlb3IiLCJ1c2VyIiwiX2lkIiwiaW1wb3J0UmVjb3JkIiwiZmluZE9uZSIsInVzZXJzIiwiY2hhbm5lbHMiLCJtZXNzYWdlcyIsIm9sZFNldHRpbmdzIiwiZGVidWciLCJkYXRhVVJJIiwic2VudENvbnRlbnRUeXBlIiwiZmlsZU5hbWUiLCJza2lwVHlwZUNoZWNrIiwiZmlsZVR5cGUiLCJCdWZmZXIiLCJzcGxpdCIsIm1pbWVUeXBlIiwibWltZSIsIndhcm4iLCJFUlJPUiIsIlBSRVBBUklOR19TVEFSVEVEIiwiaW1wb3J0U2VsZWN0aW9uIiwidW5kZWZpbmVkIiwiSU1QT1JUSU5HX1NUQVJURUQiLCJBY2NvdW50c19BbGxvd2VkRG9tYWluc0xpc3QiLCJSb2NrZXRDaGF0IiwibW9kZWxzIiwiU2V0dGluZ3MiLCJmaW5kT25lQnlJZCIsInZhbHVlIiwidXBkYXRlVmFsdWVCeUlkIiwiQWNjb3VudHNfQWxsb3dVc2VybmFtZUNoYW5nZSIsIkZpbGVVcGxvYWRfTWF4RmlsZVNpemUiLCJET05FIiwicHJvZ3Jlc3NVcGRhdGVkIiwiY291bnQiLCJ0b3RhbCIsImNvbXBsZXRlZCIsImZpZWxkcyIsInVwZGF0ZSIsIiRzZXQiLCJkZXRhaWxzIiwiZmlsZVVybCIsInJvb20iLCJ0aW1lU3RhbXAiLCJyZXF1ZXN0TW9kdWxlIiwidGVzdCIsImZpbGVTdG9yZSIsIkZpbGVVcGxvYWQiLCJnZXRTdG9yZSIsImdldCIsImJpbmRFbnZpcm9ubWVudCIsInJlcyIsInJhd0RhdGEiLCJvbiIsImNodW5rIiwiY29uY2F0IiwiZXJyIiwiZmlsZSIsInVybCIsInJlcGxhY2UiLCJhYnNvbHV0ZVVybCIsImF0dGFjaG1lbnQiLCJ0aXRsZSIsInRpdGxlX2xpbmsiLCJ0eXBlIiwiaW1hZ2VfdXJsIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJzaXplIiwiaW1hZ2VfZGltZW5zaW9ucyIsImlkZW50aWZ5IiwiYXVkaW9fdXJsIiwiYXVkaW9fdHlwZSIsImF1ZGlvX3NpemUiLCJ2aWRlb191cmwiLCJ2aWRlb190eXBlIiwidmlkZW9fc2l6ZSIsIm1zZyIsInJpZCIsInRzIiwiZ3JvdXBhYmxlIiwiYXR0YWNobWVudHMiLCJtZXNzYWdlX2lkIiwic2VuZE1lc3NhZ2UiLCJORVciLCJtZXNzYWdlX2NvdW50IiwiU2VsZWN0aW9uQ2hhbm5lbCIsImNoYW5uZWxfaWQiLCJpc19hcmNoaXZlZCIsImRvX2ltcG9ydCIsImlzX3ByaXZhdGUiLCJTZWxlY3Rpb25Vc2VyIiwidXNlcl9pZCIsInVzZXJuYW1lIiwiZW1haWwiLCJpc19kZWxldGVkIiwiaXNfYm90IiwiSW1wb3J0ZXJXZWJzb2NrZXREZWYiLCJzdHJlYW1lciIsIlN0cmVhbWVyIiwicmV0cmFuc21pdCIsImFsbG93UmVhZCIsImFsbG93RW1pdCIsImFsbG93V3JpdGUiLCJlbWl0IiwiSW1wb3J0c01vZGVsIiwiX0Jhc2UiLCJSYXdJbXBvcnRzTW9kZWwiLCJJbXBvcnRlcnMiLCJtZXRob2RzIiwiZ2V0SW1wb3J0UHJvZ3Jlc3MiLCJ1c2VySWQiLCJtZXRob2QiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJpbXBvcnRlciIsImluc3RhbmNlIiwiZ2V0U2VsZWN0aW9uRGF0YSIsIlVTRVJfU0VMRUNUSU9OIiwicHJlcGFyZUltcG9ydCIsImNvbnRlbnRUeXBlIiwiY2hlY2siLCJTdHJpbmciLCJyZXN1bHRzIiwiUHJvbWlzZSIsImNhdGNoIiwiZSIsInJlc3RhcnRJbXBvcnQiLCJDQU5DRUxMRUQiLCJ2YWxpZCIsInNldHVwSW1wb3J0ZXIiLCJjb25zb2xlIiwiaW5wdXQiLCJ1c2Vyc1NlbGVjdGlvbiIsIm1hcCIsImNoYW5uZWxzU2VsZWN0aW9uIiwiY2hhbm5lbCIsInNlbGVjdGlvbiIsInN0YXJ0dXAiLCIkbmUiLCJtdWx0aSIsIm1vZGVsIiwicmF3Q29sbGVjdGlvbiIsImRyb3AiLCJsb2ciLCJ3YXJuaW5ncyIsIk9iamVjdCIsImZyZWV6ZSIsIlBSRVBBUklOR19VU0VSUyIsIlBSRVBBUklOR19DSEFOTkVMUyIsIlBSRVBBUklOR19NRVNTQUdFUyIsIklNUE9SVElOR19VU0VSUyIsIklNUE9SVElOR19DSEFOTkVMUyIsIklNUE9SVElOR19NRVNTQUdFUyIsIkZJTklTSElORyIsIkltcG9ydGVyc0NvbnRhaW5lciIsImltcG9ydGVycyIsIk1hcCIsImFkZCIsInNldCIsImdldEFsbCIsIkFycmF5IiwiZnJvbSIsInZhbHVlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxRQUFLLE1BQUlBO0FBQVYsQ0FBZDtBQUErQixJQUFJQyxRQUFKO0FBQWFILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxvQkFBUixDQUFiLEVBQTJDO0FBQUNGLFdBQVNHLENBQVQsRUFBVztBQUFDSCxlQUFTRyxDQUFUO0FBQVc7O0FBQXhCLENBQTNDLEVBQXFFLENBQXJFO0FBQXdFLElBQUlDLFlBQUo7QUFBaUJQLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxnQ0FBUixDQUFiLEVBQXVEO0FBQUNFLGVBQWFELENBQWIsRUFBZTtBQUFDQyxtQkFBYUQsQ0FBYjtBQUFlOztBQUFoQyxDQUF2RCxFQUF5RixDQUF6RjtB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a0JBQUosRUFBbEIsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9pbXBvcnRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb2dyZXNzIH0gZnJvbSAnLi9JbXBvcnRlclByb2dyZXNzJztcbmltcG9ydCB7IFByb2dyZXNzU3RlcCB9IGZyb20gJy4uLy4uL2xpYi9JbXBvcnRlclByb2dyZXNzU3RlcCc7XG5pbXBvcnQgeyBTZWxlY3Rpb24gfSBmcm9tICcuL0ltcG9ydGVyU2VsZWN0aW9uJztcbmltcG9ydCB7IEltcG9ydHMgfSBmcm9tICcuLi9tb2RlbHMvSW1wb3J0cyc7XG5pbXBvcnQgeyBJbXBvcnRlckluZm8gfSBmcm9tICcuLi8uLi9saWIvSW1wb3J0ZXJJbmZvJztcbmltcG9ydCB7IFJhd0ltcG9ydHMgfSBmcm9tICcuLi9tb2RlbHMvUmF3SW1wb3J0cyc7XG5pbXBvcnQgeyBJbXBvcnRlcldlYnNvY2tldCB9IGZyb20gJy4vSW1wb3J0ZXJXZWJzb2NrZXQnO1xuXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgQWRtWmlwIGZyb20gJ2FkbS16aXAnO1xuaW1wb3J0IGdldEZpbGVUeXBlIGZyb20gJ2ZpbGUtdHlwZSc7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgYWxsIG9mIHRoZSBpbXBvcnRlcnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlIHtcblx0LyoqXG5cdCAqIFRoZSBtYXggQlNPTiBvYmplY3Qgc2l6ZSB3ZSBjYW4gc3RvcmUgaW4gTW9uZ29EQiBpcyAxNjc3NzIxNiBieXRlc1xuXHQgKiBidXQgZm9yIHNvbWUgcmVhc29uIHRoZSBtb25nbyBpbnN0YW5hY2Ugd2hpY2ggY29tZXMgd2l0aCBNZXRlb3Jcblx0ICogZXJyb3JzIG91dCBmb3IgYW55dGhpbmcgY2xvc2UgdG8gdGhhdCBzaXplLiBTbywgd2UgYXJlIHJvdW5kaW5nIGl0XG5cdCAqIGRvd24gdG8gODAwMDAwMCBieXRlcy5cblx0ICpcblx0ICogQHBhcmFtIHthbnl9IGl0ZW0gVGhlIGl0ZW0gdG8gY2FsY3VsYXRlIHRoZSBCU09OIHNpemUgb2YuXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IFRoZSBzaXplIG9mIHRoZSBpdGVtIHBhc3NlZCBpbi5cblx0ICogQHN0YXRpY1xuXHQgKi9cblx0c3RhdGljIGdldEJTT05TaXplKGl0ZW0pIHtcblx0XHRjb25zdCB7IEJTT04gfSA9IHJlcXVpcmUoJ2Jzb24nKTtcblx0XHRjb25zdCBic29uID0gbmV3IEJTT04oKTtcblx0XHRyZXR1cm4gYnNvbi5jYWxjdWxhdGVPYmplY3RTaXplKGl0ZW0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBtYXggQlNPTiBvYmplY3Qgc2l6ZSB3ZSBjYW4gc3RvcmUgaW4gTW9uZ29EQiBpcyAxNjc3NzIxNiBieXRlc1xuXHQgKiBidXQgZm9yIHNvbWUgcmVhc29uIHRoZSBtb25nbyBpbnN0YW5hY2Ugd2hpY2ggY29tZXMgd2l0aCBNZXRlb3Jcblx0ICogZXJyb3JzIG91dCBmb3IgYW55dGhpbmcgY2xvc2UgdG8gdGhhdCBzaXplLiBTbywgd2UgYXJlIHJvdW5kaW5nIGl0XG5cdCAqIGRvd24gdG8gODAwMDAwMCBieXRlcy5cblx0ICpcblx0ICogQHJldHVybnMge251bWJlcn0gODAwMDAwMCBieXRlcy5cblx0ICovXG5cdHN0YXRpYyBnZXRNYXhCU09OU2l6ZSgpIHtcblx0XHRyZXR1cm4gODAwMDAwMDtcblx0fVxuXG5cdC8qKlxuXHQgKiBTcGxpdHMgdGhlIHBhc3NlZCBpbiBhcnJheSB0byBhdCBsZWFzdCBvbmUgYXJyYXkgd2hpY2ggaGFzIGEgc2l6ZSB0aGF0XG5cdCAqIGlzIHNhZmUgdG8gc3RvcmUgaW4gdGhlIGRhdGFiYXNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge2FueVtdfSB0aGVBcnJheSBUaGUgYXJyYXkgdG8gc3BsaXQgb3V0XG5cdCAqIEByZXR1cm5zIHthbnlbXVtdfSBUaGUgc2FmZSBzaXplZCBhcnJheXNcblx0ICogQHN0YXRpY1xuXHQgKi9cblx0c3RhdGljIGdldEJTT05TYWZlQXJyYXlzRnJvbUFuQXJyYXkodGhlQXJyYXkpIHtcblx0XHRjb25zdCBCU09OU2l6ZSA9IEJhc2UuZ2V0QlNPTlNpemUodGhlQXJyYXkpO1xuXHRcdGNvbnN0IG1heFNpemUgPSBNYXRoLmZsb29yKHRoZUFycmF5Lmxlbmd0aCAvIChNYXRoLmNlaWwoQlNPTlNpemUgLyBCYXNlLmdldE1heEJTT05TaXplKCkpKSk7XG5cdFx0Y29uc3Qgc2FmZUFycmF5cyA9IFtdO1xuXHRcdGxldCBpID0gMDtcblx0XHR3aGlsZSAoaSA8IHRoZUFycmF5Lmxlbmd0aCkge1xuXHRcdFx0c2FmZUFycmF5cy5wdXNoKHRoZUFycmF5LnNsaWNlKGksIChpICs9IG1heFNpemUpKSk7XG5cdFx0fVxuXHRcdHJldHVybiBzYWZlQXJyYXlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnN0cnVjdHMgYSBuZXcgaW1wb3J0ZXIsIGFkZGluZyBhbiBlbXB0eSBjb2xsZWN0aW9uLCBBZG1aaXAgcHJvcGVydHksIGFuZCBlbXB0eSB1c2VycyAmIGNoYW5uZWxzXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBpbXBvcnRlcidzIG5hbWUuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBkZXNjcmlwdGlvbiBUaGUgaTE4biBzdHJpbmcgd2hpY2ggZGVzY3JpYmVzIHRoZSBpbXBvcnRlclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbWltZVR5cGUgVGhlIGV4cGVjdGVkIGZpbGUgdHlwZS5cblx0ICovXG5cdGNvbnN0cnVjdG9yKGluZm8pIHtcblx0XHRpZiAoIShpbmZvIGluc3RhbmNlb2YgSW1wb3J0ZXJJbmZvKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbmZvcm1hdGlvbiBwYXNzZWQgaW4gbXVzdCBiZSBhIHZhbGlkIEltcG9ydGVySW5mbyBpbnN0YW5jZS4nKTtcblx0XHR9XG5cblx0XHR0aGlzLmh0dHAgPSBodHRwO1xuXHRcdHRoaXMuaHR0cHMgPSBodHRwcztcblx0XHR0aGlzLkFkbVppcCA9IEFkbVppcDtcblx0XHR0aGlzLmdldEZpbGVUeXBlID0gZ2V0RmlsZVR5cGU7XG5cblx0XHR0aGlzLnByZXBhcmUgPSB0aGlzLnByZXBhcmUuYmluZCh0aGlzKTtcblx0XHR0aGlzLnN0YXJ0SW1wb3J0ID0gdGhpcy5zdGFydEltcG9ydC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuZ2V0U2VsZWN0aW9uID0gdGhpcy5nZXRTZWxlY3Rpb24uYmluZCh0aGlzKTtcblx0XHR0aGlzLmdldFByb2dyZXNzID0gdGhpcy5nZXRQcm9ncmVzcy5iaW5kKHRoaXMpO1xuXHRcdHRoaXMudXBkYXRlUHJvZ3Jlc3MgPSB0aGlzLnVwZGF0ZVByb2dyZXNzLmJpbmQodGhpcyk7XG5cdFx0dGhpcy5hZGRDb3VudFRvVG90YWwgPSB0aGlzLmFkZENvdW50VG9Ub3RhbC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMuYWRkQ291bnRDb21wbGV0ZWQgPSB0aGlzLmFkZENvdW50Q29tcGxldGVkLmJpbmQodGhpcyk7XG5cdFx0dGhpcy51cGRhdGVSZWNvcmQgPSB0aGlzLnVwZGF0ZVJlY29yZC5iaW5kKHRoaXMpO1xuXHRcdHRoaXMudXBsb2FkRmlsZSA9IHRoaXMudXBsb2FkRmlsZS5iaW5kKHRoaXMpO1xuXG5cdFx0dGhpcy5pbmZvID0gaW5mbztcblxuXHRcdHRoaXMubG9nZ2VyID0gbmV3IExvZ2dlcihgJHsgdGhpcy5pbmZvLm5hbWUgfSBJbXBvcnRlcmAsIHt9KTtcblx0XHR0aGlzLnByb2dyZXNzID0gbmV3IFByb2dyZXNzKHRoaXMuaW5mby5rZXksIHRoaXMuaW5mby5uYW1lKTtcblx0XHR0aGlzLmNvbGxlY3Rpb24gPSBSYXdJbXBvcnRzO1xuXG5cdFx0Y29uc3QgaW1wb3J0SWQgPSBJbXBvcnRzLmluc2VydCh7ICd0eXBlJzogdGhpcy5pbmZvLm5hbWUsICd0cyc6IERhdGUubm93KCksICdzdGF0dXMnOiB0aGlzLnByb2dyZXNzLnN0ZXAsICd2YWxpZCc6IHRydWUsICd1c2VyJzogTWV0ZW9yLnVzZXIoKS5faWQgfSk7XG5cdFx0dGhpcy5pbXBvcnRSZWNvcmQgPSBJbXBvcnRzLmZpbmRPbmUoaW1wb3J0SWQpO1xuXG5cdFx0dGhpcy51c2VycyA9IHt9O1xuXHRcdHRoaXMuY2hhbm5lbHMgPSB7fTtcblx0XHR0aGlzLm1lc3NhZ2VzID0ge307XG5cdFx0dGhpcy5vbGRTZXR0aW5ncyA9IHt9O1xuXG5cdFx0dGhpcy5sb2dnZXIuZGVidWcoYENvbnN0cnVjdGVkIGEgbmV3ICR7IGluZm8ubmFtZSB9IEltcG9ydGVyLmApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRha2VzIHRoZSB1cGxvYWRlZCBmaWxlIGFuZCBleHRyYWN0cyB0aGUgdXNlcnMsIGNoYW5uZWxzLCBhbmQgbWVzc2FnZXMgZnJvbSBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGRhdGFVUkkgQmFzZTY0IHN0cmluZyBvZiB0aGUgdXBsb2FkZWQgZmlsZVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gc2VudENvbnRlbnRUeXBlIFRoZSBzZW50IGZpbGUgdHlwZS5cblx0ICogQHBhcmFtIHtzdHJpbmd9IGZpbGVOYW1lIFRoZSBuYW1lIG9mIHRoZSB1cGxvYWRlZCBmaWxlLlxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBUeXBlQ2hlY2sgT3B0aW9uYWwgcHJvcGVydHkgdGhhdCBzYXlzIHRvIG5vdCBjaGVjayB0aGUgdHlwZSBwcm92aWRlZC5cblx0ICogQHJldHVybnMge1Byb2dyZXNzfSBUaGUgcHJvZ3Jlc3MgcmVjb3JkIG9mIHRoZSBpbXBvcnQuXG5cdCAqL1xuXHRwcmVwYXJlKGRhdGFVUkksIHNlbnRDb250ZW50VHlwZSwgZmlsZU5hbWUsIHNraXBUeXBlQ2hlY2spIHtcblx0XHRpZiAoIXNraXBUeXBlQ2hlY2spIHtcblx0XHRcdGNvbnN0IGZpbGVUeXBlID0gdGhpcy5nZXRGaWxlVHlwZShuZXcgQnVmZmVyKGRhdGFVUkkuc3BsaXQoJywnKVsxXSwgJ2Jhc2U2NCcpKTtcblx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKCdVcGxvYWRlZCBmaWxlIGluZm9ybWF0aW9uIGlzOicsIGZpbGVUeXBlKTtcblx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKCdFeHBlY3RlZCBmaWxlIHR5cGUgaXM6JywgdGhpcy5pbmZvLm1pbWVUeXBlKTtcblxuXHRcdFx0aWYgKCFmaWxlVHlwZSB8fCAoZmlsZVR5cGUubWltZSAhPT0gdGhpcy5pbmZvLm1pbWVUeXBlKSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIGZpbGUgdXBsb2FkZWQgZm9yIHRoZSAkeyB0aGlzLmluZm8ubmFtZSB9IGltcG9ydGVyLmApO1xuXHRcdFx0XHR0aGlzLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5FUlJPUik7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtZmlsZS11cGxvYWRlZCcsIGBJbnZhbGlkIGZpbGUgdXBsb2FkZWQgdG8gaW1wb3J0ICR7IHRoaXMuaW5mby5uYW1lIH0gZGF0YSBmcm9tLmAsIHsgc3RlcDogJ3ByZXBhcmUnIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLlBSRVBBUklOR19TVEFSVEVEKTtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGVSZWNvcmQoeyAnZmlsZSc6IGZpbGVOYW1lIH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0YXJ0cyB0aGUgaW1wb3J0IHByb2Nlc3MuIFRoZSBpbXBsZW1lbnRpbmcgbWV0aG9kIHNob3VsZCBkZWZlclxuXHQgKiBhcyBzb29uIGFzIHRoZSBzZWxlY3Rpb24gaXMgc2V0LCBzbyB0aGUgdXNlciB3aG8gc3RhcnRlZCB0aGUgcHJvY2Vzc1xuXHQgKiBkb2Vzbid0IGVuZCB1cCB3aXRoIGEgXCJsb2NrZWRcIiBVSSB3aGlsZSBNZXRlb3Igd2FpdHMgZm9yIGEgcmVzcG9uc2UuXG5cdCAqIFRoZSByZXR1cm5lZCBvYmplY3Qgc2hvdWxkIGJlIHRoZSBwcm9ncmVzcy5cblx0ICpcblx0ICogQHBhcmFtIHtTZWxlY3Rpb259IGltcG9ydFNlbGVjdGlvbiBUaGUgc2VsZWN0aW9uIGRhdGEuXG5cdCAqIEByZXR1cm5zIHtQcm9ncmVzc30gVGhlIHByb2dyZXNzIHJlY29yZCBvZiB0aGUgaW1wb3J0LlxuXHQgKi9cblx0c3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKSB7XG5cdFx0aWYgKCEoaW1wb3J0U2VsZWN0aW9uIGluc3RhbmNlb2YgU2VsZWN0aW9uKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFNlbGVjdGlvbiBkYXRhIHByb3ZpZGVkIHRvIHRoZSAkeyB0aGlzLmluZm8ubmFtZSB9IGltcG9ydGVyLmApO1xuXHRcdH0gZWxzZSBpZiAoaW1wb3J0U2VsZWN0aW9uLnVzZXJzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVXNlcnMgaW4gdGhlIHNlbGVjdGVkIGRhdGEgd2Fzbid0IGZvdW5kLCBpdCBtdXN0IGJ1dCBhdCBsZWFzdCBhbiBlbXB0eSBhcnJheSBmb3IgdGhlICR7IHRoaXMuaW5mby5uYW1lIH0gaW1wb3J0ZXIuYCk7XG5cdFx0fSBlbHNlIGlmIChpbXBvcnRTZWxlY3Rpb24uY2hhbm5lbHMgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDaGFubmVscyBpbiB0aGUgc2VsZWN0ZWQgZGF0YSB3YXNuJ3QgZm91bmQsIGl0IG11c3QgYnV0IGF0IGxlYXN0IGFuIGVtcHR5IGFycmF5IGZvciB0aGUgJHsgdGhpcy5pbmZvLm5hbWUgfSBpbXBvcnRlci5gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuSU1QT1JUSU5HX1NUQVJURUQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgdGhlIFNlbGVjdGlvbiBvYmplY3QgZm9yIHRoZSBpbXBvcnQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHtTZWxlY3Rpb259IFRoZSB1c2VycyBhbmQgY2hhbm5lbHMgc2VsZWN0aW9uXG5cdCAqL1xuXHRnZXRTZWxlY3Rpb24oKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkICdnZXRTZWxlY3Rpb24nIGNhbGxlZCBvbiAkeyB0aGlzLmluZm8ubmFtZSB9LCBpdCBtdXN0IGJlIG92ZXJyaWRkZW4gYW5kIHN1cGVyIGNhbiBub3QgYmUgY2FsbGVkLmApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgdGhlIHByb2dyZXNzIG9mIHRoaXMgaW1wb3J0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7UHJvZ3Jlc3N9IFRoZSBwcm9ncmVzcyByZWNvcmQgb2YgdGhlIGltcG9ydC5cblx0ICovXG5cdGdldFByb2dyZXNzKCkge1xuXHRcdHJldHVybiB0aGlzLnByb2dyZXNzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhlIHByb2dyZXNzIHN0ZXAgb2YgdGhpcyBpbXBvcnRlci5cblx0ICogSXQgYWxzbyBjaGFuZ2VzIHNvbWUgaW50ZXJuYWwgc2V0dGluZ3MgYXQgdmFyaW91cyBzdGFnZXMgb2YgdGhlIGltcG9ydC5cblx0ICogVGhpcyB3YXkgdGhlIGltcG9ydGVyIGNhbiBhZGp1c3QgdXNlci9yb29tIGluZm9ybWF0aW9uIGF0IHdpbGwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7UHJvZ3Jlc3NTdGVwfSBzdGVwIFRoZSBwcm9ncmVzcyBzdGVwIHdoaWNoIHRoaXMgaW1wb3J0IGlzIGN1cnJlbnRseSBhdC5cblx0ICogQHJldHVybnMge1Byb2dyZXNzfSBUaGUgcHJvZ3Jlc3MgcmVjb3JkIG9mIHRoZSBpbXBvcnQuXG5cdCAqL1xuXHR1cGRhdGVQcm9ncmVzcyhzdGVwKSB7XG5cdFx0dGhpcy5wcm9ncmVzcy5zdGVwID0gc3RlcDtcblxuXHRcdHN3aXRjaCAoc3RlcCkge1xuXHRcdFx0Y2FzZSBQcm9ncmVzc1N0ZXAuSU1QT1JUSU5HX1NUQVJURUQ6XG5cdFx0XHRcdHRoaXMub2xkU2V0dGluZ3MuQWNjb3VudHNfQWxsb3dlZERvbWFpbnNMaXN0ID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZUJ5SWQoJ0FjY291bnRzX0FsbG93ZWREb21haW5zTGlzdCcpLnZhbHVlO1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZUJ5SWQoJ0FjY291bnRzX0FsbG93ZWREb21haW5zTGlzdCcsICcnKTtcblxuXHRcdFx0XHR0aGlzLm9sZFNldHRpbmdzLkFjY291bnRzX0FsbG93VXNlcm5hbWVDaGFuZ2UgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lQnlJZCgnQWNjb3VudHNfQWxsb3dVc2VybmFtZUNoYW5nZScpLnZhbHVlO1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZUJ5SWQoJ0FjY291bnRzX0FsbG93VXNlcm5hbWVDaGFuZ2UnLCB0cnVlKTtcblxuXHRcdFx0XHR0aGlzLm9sZFNldHRpbmdzLkZpbGVVcGxvYWRfTWF4RmlsZVNpemUgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lQnlJZCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScpLnZhbHVlO1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZUJ5SWQoJ0ZpbGVVcGxvYWRfTWF4RmlsZVNpemUnLCAtMSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBQcm9ncmVzc1N0ZXAuRE9ORTpcblx0XHRcdGNhc2UgUHJvZ3Jlc3NTdGVwLkVSUk9SOlxuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZUJ5SWQoJ0FjY291bnRzX0FsbG93ZWREb21haW5zTGlzdCcsIHRoaXMub2xkU2V0dGluZ3MuQWNjb3VudHNfQWxsb3dlZERvbWFpbnNMaXN0KTtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MudXBkYXRlVmFsdWVCeUlkKCdBY2NvdW50c19BbGxvd1VzZXJuYW1lQ2hhbmdlJywgdGhpcy5vbGRTZXR0aW5ncy5BY2NvdW50c19BbGxvd1VzZXJuYW1lQ2hhbmdlKTtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MudXBkYXRlVmFsdWVCeUlkKCdGaWxlVXBsb2FkX01heEZpbGVTaXplJywgdGhpcy5vbGRTZXR0aW5ncy5GaWxlVXBsb2FkX01heEZpbGVTaXplKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0dGhpcy5sb2dnZXIuZGVidWcoYCR7IHRoaXMuaW5mby5uYW1lIH0gaXMgbm93IGF0ICR7IHN0ZXAgfS5gKTtcblx0XHR0aGlzLnVwZGF0ZVJlY29yZCh7ICdzdGF0dXMnOiB0aGlzLnByb2dyZXNzLnN0ZXAgfSk7XG5cblx0XHRJbXBvcnRlcldlYnNvY2tldC5wcm9ncmVzc1VwZGF0ZWQodGhpcy5wcm9ncmVzcyk7XG5cblx0XHRyZXR1cm4gdGhpcy5wcm9ncmVzcztcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGRzIHRoZSBwYXNzZWQgaW4gdmFsdWUgdG8gdGhlIHRvdGFsIGFtb3VudCBvZiBpdGVtcyBuZWVkZWQgdG8gY29tcGxldGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudCBUaGUgYW1vdW50IHRvIGFkZCB0byB0aGUgdG90YWwgY291bnQgb2YgaXRlbXMuXG5cdCAqIEByZXR1cm5zIHtQcm9ncmVzc30gVGhlIHByb2dyZXNzIHJlY29yZCBvZiB0aGUgaW1wb3J0LlxuXHQgKi9cblx0YWRkQ291bnRUb1RvdGFsKGNvdW50KSB7XG5cdFx0dGhpcy5wcm9ncmVzcy5jb3VudC50b3RhbCA9IHRoaXMucHJvZ3Jlc3MuY291bnQudG90YWwgKyBjb3VudDtcblx0XHR0aGlzLnVwZGF0ZVJlY29yZCh7ICdjb3VudC50b3RhbCc6IHRoaXMucHJvZ3Jlc3MuY291bnQudG90YWwgfSk7XG5cblx0XHRyZXR1cm4gdGhpcy5wcm9ncmVzcztcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGRzIHRoZSBwYXNzZWQgaW4gdmFsdWUgdG8gdGhlIHRvdGFsIGFtb3VudCBvZiBpdGVtcyBjb21wbGV0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudCBUaGUgYW1vdW50IHRvIGFkZCB0byB0aGUgdG90YWwgY291bnQgb2YgZmluaXNoZWQgaXRlbXMuXG5cdCAqIEByZXR1cm5zIHtQcm9ncmVzc30gVGhlIHByb2dyZXNzIHJlY29yZCBvZiB0aGUgaW1wb3J0LlxuXHQgKi9cblx0YWRkQ291bnRDb21wbGV0ZWQoY291bnQpIHtcblx0XHR0aGlzLnByb2dyZXNzLmNvdW50LmNvbXBsZXRlZCA9IHRoaXMucHJvZ3Jlc3MuY291bnQuY29tcGxldGVkICsgY291bnQ7XG5cblx0XHQvL09ubHkgdXBkYXRlIHRoZSBkYXRhYmFzZSBldmVyeSA1MDAgcmVjb3Jkc1xuXHRcdC8vT3IgdGhlIGNvbXBsZXRlZCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHRvdGFsIGFtb3VudFxuXHRcdGlmICgoKHRoaXMucHJvZ3Jlc3MuY291bnQuY29tcGxldGVkICUgNTAwKSA9PT0gMCkgfHwgKHRoaXMucHJvZ3Jlc3MuY291bnQuY29tcGxldGVkID49IHRoaXMucHJvZ3Jlc3MuY291bnQudG90YWwpKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZVJlY29yZCh7ICdjb3VudC5jb21wbGV0ZWQnOiB0aGlzLnByb2dyZXNzLmNvdW50LmNvbXBsZXRlZCB9KTtcblx0XHR9XG5cblx0XHRJbXBvcnRlcldlYnNvY2tldC5wcm9ncmVzc1VwZGF0ZWQodGhpcy5wcm9ncmVzcyk7XG5cblx0XHRyZXR1cm4gdGhpcy5wcm9ncmVzcztcblx0fVxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSBpbXBvcnQgcmVjb3JkIHdpdGggdGhlIGdpdmVuIGZpZWxkcyBiZWluZyBgc2V0YC5cblx0ICpcblx0ICogQHBhcmFtIHthbnl9IGZpZWxkcyBUaGUgZmllbGRzIHRvIHNldCwgaXQgc2hvdWxkIGJlIGFuIG9iamVjdCB3aXRoIGtleS92YWx1ZXMuXG5cdCAqIEByZXR1cm5zIHtJbXBvcnRzfSBUaGUgaW1wb3J0IHJlY29yZC5cblx0ICovXG5cdHVwZGF0ZVJlY29yZChmaWVsZHMpIHtcblx0XHRJbXBvcnRzLnVwZGF0ZSh7IF9pZDogdGhpcy5pbXBvcnRSZWNvcmQuX2lkIH0sIHsgJHNldDogZmllbGRzIH0pO1xuXHRcdHRoaXMuaW1wb3J0UmVjb3JkID0gSW1wb3J0cy5maW5kT25lKHRoaXMuaW1wb3J0UmVjb3JkLl9pZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5pbXBvcnRSZWNvcmQ7XG5cdH1cblxuXHQvKipcblx0ICogVXBsb2FkcyB0aGUgZmlsZSB0byB0aGUgc3RvcmFnZS5cblx0ICpcblx0ICogQHBhcmFtIHthbnl9IGRldGFpbHMgQW4gb2JqZWN0IHdpdGggZGV0YWlscyBhYm91dCB0aGUgdXBsb2FkOiBgbmFtZWAsIGBzaXplYCwgYHR5cGVgLCBhbmQgYHJpZGAuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlVXJsIFVybCBvZiB0aGUgZmlsZSB0byBkb3dubG9hZC9pbXBvcnQuXG5cdCAqIEBwYXJhbSB7YW55fSB1c2VyIFRoZSBSb2NrZXQuQ2hhdCB1c2VyLlxuXHQgKiBAcGFyYW0ge2FueX0gcm9vbSBUaGUgUm9ja2V0LkNoYXQgUm9vbS5cblx0ICogQHBhcmFtIHtEYXRlfSB0aW1lU3RhbXAgVGhlIHRpbWVzdGFtcCB0aGUgZmlsZSB3YXMgdXBsb2FkZWRcblx0ICovXG5cdHVwbG9hZEZpbGUoZGV0YWlscywgZmlsZVVybCwgdXNlciwgcm9vbSwgdGltZVN0YW1wKSB7XG5cdFx0dGhpcy5sb2dnZXIuZGVidWcoYFVwbG9hZGluZyB0aGUgZmlsZSAkeyBkZXRhaWxzLm5hbWUgfSBmcm9tICR7IGZpbGVVcmwgfS5gKTtcblx0XHRjb25zdCByZXF1ZXN0TW9kdWxlID0gL2h0dHBzL2kudGVzdChmaWxlVXJsKSA/IHRoaXMuaHR0cHMgOiB0aGlzLmh0dHA7XG5cblx0XHRjb25zdCBmaWxlU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJyk7XG5cblx0XHRyZXR1cm4gcmVxdWVzdE1vZHVsZS5nZXQoZmlsZVVybCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihyZXMpIHtcblx0XHRcdGNvbnN0IHJhd0RhdGEgPSBbXTtcblx0XHRcdHJlcy5vbignZGF0YScsIGNodW5rID0+IHJhd0RhdGEucHVzaChjaHVuaykpO1xuXHRcdFx0cmVzLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0ZmlsZVN0b3JlLmluc2VydChkZXRhaWxzLCBCdWZmZXIuY29uY2F0KHJhd0RhdGEpLCBmdW5jdGlvbihlcnIsIGZpbGUpIHtcblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgdXJsID0gZmlsZS51cmwucmVwbGFjZShNZXRlb3IuYWJzb2x1dGVVcmwoKSwgJy8nKTtcblxuXHRcdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudCA9IHtcblx0XHRcdFx0XHRcdFx0dGl0bGU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRcdFx0dGl0bGVfbGluazogdXJsXG5cdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRpZiAoL15pbWFnZVxcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudC5pbWFnZV91cmwgPSB1cmw7XG5cdFx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudC5pbWFnZV9zaXplID0gZmlsZS5zaXplO1xuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX2RpbWVuc2lvbnMgPSBmaWxlLmlkZW50aWZ5ICE9IG51bGwgPyBmaWxlLmlkZW50aWZ5LnNpemUgOiB1bmRlZmluZWQ7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICgvXmF1ZGlvXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LmF1ZGlvX3VybCA9IHVybDtcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LmF1ZGlvX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICgvXnZpZGVvXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LnZpZGVvX3VybCA9IHVybDtcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudC52aWRlb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0XHRcdFx0XHRhdHRhY2htZW50LnZpZGVvX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNvbnN0IG1zZyA9IHtcblx0XHRcdFx0XHRcdFx0cmlkOiBkZXRhaWxzLnJpZCxcblx0XHRcdFx0XHRcdFx0dHM6IHRpbWVTdGFtcCxcblx0XHRcdFx0XHRcdFx0bXNnOiAnJyxcblx0XHRcdFx0XHRcdFx0ZmlsZToge1xuXHRcdFx0XHRcdFx0XHRcdF9pZDogZmlsZS5faWRcblx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0Z3JvdXBhYmxlOiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0YXR0YWNobWVudHM6IFthdHRhY2htZW50XVxuXHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0aWYgKChkZXRhaWxzLm1lc3NhZ2VfaWQgIT0gbnVsbCkgJiYgKHR5cGVvZiBkZXRhaWxzLm1lc3NhZ2VfaWQgPT09ICdzdHJpbmcnKSkge1xuXHRcdFx0XHRcdFx0XHRtc2dbJ19pZCddID0gZGV0YWlscy5tZXNzYWdlX2lkO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZW5kTWVzc2FnZSh1c2VyLCBtc2csIHJvb20sIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9KSk7XG5cdFx0fSkpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBQcm9ncmVzc1N0ZXAgfSBmcm9tICcuLi8uLi9saWIvSW1wb3J0ZXJQcm9ncmVzc1N0ZXAnO1xuXG5leHBvcnQgY2xhc3MgUHJvZ3Jlc3Mge1xuXHQvKipcblx0ICogQ3JlYXRlcyBhIG5ldyBwcm9ncmVzcyBjb250YWluZXIgZm9yIHRoZSBpbXBvcnRlci5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgdW5pcXVlIGtleSBvZiB0aGUgaW1wb3J0ZXIuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBpbXBvcnRlci5cblx0ICovXG5cdGNvbnN0cnVjdG9yKGtleSwgbmFtZSkge1xuXHRcdHRoaXMua2V5ID0ga2V5O1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5zdGVwID0gUHJvZ3Jlc3NTdGVwLk5FVztcblx0XHR0aGlzLmNvdW50ID0geyBjb21wbGV0ZWQ6IDAsIHRvdGFsOiAwIH07XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBTZWxlY3Rpb24ge1xuXHQvKipcblx0ICogQ29uc3RydWN0cyBhIG5ldyBpbXBvcnRlciBzZWxlY3Rpb24gb2JqZWN0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgaW1wb3J0ZXJcblx0ICogQHBhcmFtIHtTZWxlY3Rpb25Vc2VyW119IHVzZXJzIHRoZSB1c2VycyB3aGljaCBjYW4gYmUgc2VsZWN0ZWRcblx0ICogQHBhcmFtIHtTZWxlY3Rpb25DaGFubmVsW119IGNoYW5uZWxzIHRoZSBjaGFubmVscyB3aGljaCBjYW4gYmUgc2VsZWN0ZWRcblx0ICogQHBhcmFtIHtudW1iZXJ9IG1lc3NhZ2VfY291bnQgdGhlIG51bWJlciBvZiBtZXNzYWdlc1xuXHQgKi9cblx0Y29uc3RydWN0b3IobmFtZSwgdXNlcnMsIGNoYW5uZWxzLCBtZXNzYWdlX2NvdW50KSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLnVzZXJzID0gdXNlcnM7XG5cdFx0dGhpcy5jaGFubmVscyA9IGNoYW5uZWxzO1xuXHRcdHRoaXMubWVzc2FnZV9jb3VudCA9IG1lc3NhZ2VfY291bnQ7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBTZWxlY3Rpb25DaGFubmVsIHtcblx0LyoqXG5cdCAqIENvbnN0cnVjdHMgYSBuZXcgc2VsZWN0aW9uIGNoYW5uZWwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjaGFubmVsX2lkIHRoZSB1bmlxdWUgaWRlbnRpZmllciBvZiB0aGUgY2hhbm5lbFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgY2hhbm5lbFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzX2FyY2hpdmVkIHdoZXRoZXIgdGhlIGNoYW5uZWwgd2FzIGFyY2hpdmVkIG9yIG5vdFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGRvX2ltcG9ydCB3aGV0aGVyIHdlIHdpbGwgYmUgaW1wb3J0aW5nIHRoZSBjaGFubmVsIG9yIG5vdFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzX3ByaXZhdGUgd2hldGhlciB0aGUgY2hhbm5lbCBpcyBwcml2YXRlIG9yIHB1YmxpY1xuXHQgKi9cblx0Y29uc3RydWN0b3IoY2hhbm5lbF9pZCwgbmFtZSwgaXNfYXJjaGl2ZWQsIGRvX2ltcG9ydCwgaXNfcHJpdmF0ZSkge1xuXHRcdHRoaXMuY2hhbm5lbF9pZCA9IGNoYW5uZWxfaWQ7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLmlzX2FyY2hpdmVkID0gaXNfYXJjaGl2ZWQ7XG5cdFx0dGhpcy5kb19pbXBvcnQgPSBkb19pbXBvcnQ7XG5cdFx0dGhpcy5pc19wcml2YXRlID0gaXNfcHJpdmF0ZTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIFNlbGVjdGlvblVzZXIge1xuXHQvKipcblx0ICogQ29uc3RydWN0cyBhIG5ldyBzZWxlY3Rpb24gdXNlci5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHVzZXJfaWQgdGhlIHVuaXF1ZSB1c2VyIGlkZW50aWZpZXJcblx0ICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIHRoZSB1c2VyJ3MgdXNlcm5hbWVcblx0ICogQHBhcmFtIHtzdHJpbmd9IGVtYWlsIHRoZSB1c2VyJ3MgZW1haWxcblx0ICogQHBhcmFtIHtib29sZWFufSBpc19kZWxldGVkIHdoZXRoZXIgdGhlIHVzZXIgd2FzIGRlbGV0ZWQgb3Igbm90XG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNfYm90IHdoZXRoZXIgdGhlIHVzZXIgaXMgYSBib3Qgb3Igbm90XG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gZG9faW1wb3J0IHdoZXRoZXIgd2UgYXJlIGdvaW5nIHRvIGltcG9ydCB0aGlzIHVzZXIgb3Igbm90XG5cdCAqL1xuXHRjb25zdHJ1Y3Rvcih1c2VyX2lkLCB1c2VybmFtZSwgZW1haWwsIGlzX2RlbGV0ZWQsIGlzX2JvdCwgZG9faW1wb3J0KSB7XG5cdFx0dGhpcy51c2VyX2lkID0gdXNlcl9pZDtcblx0XHR0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG5cdFx0dGhpcy5lbWFpbCA9IGVtYWlsO1xuXHRcdHRoaXMuaXNfZGVsZXRlZCA9IGlzX2RlbGV0ZWQ7XG5cdFx0dGhpcy5pc19ib3QgPSBpc19ib3Q7XG5cdFx0dGhpcy5kb19pbXBvcnQgPSBkb19pbXBvcnQ7XG5cdH1cbn1cbiIsImNsYXNzIEltcG9ydGVyV2Vic29ja2V0RGVmIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zdHJlYW1lciA9IG5ldyBNZXRlb3IuU3RyZWFtZXIoJ2ltcG9ydGVycycsIHsgcmV0cmFuc21pdDogZmFsc2UgfSk7XG5cdFx0dGhpcy5zdHJlYW1lci5hbGxvd1JlYWQoJ2FsbCcpO1xuXHRcdHRoaXMuc3RyZWFtZXIuYWxsb3dFbWl0KCdhbGwnKTtcblx0XHR0aGlzLnN0cmVhbWVyLmFsbG93V3JpdGUoJ25vbmUnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDYWxsZWQgd2hlbiB0aGUgcHJvZ3Jlc3MgaXMgdXBkYXRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtQcm9ncmVzc30gcHJvZ3Jlc3MgVGhlIHByb2dyZXNzIG9mIHRoZSBpbXBvcnQuXG5cdCAqL1xuXHRwcm9ncmVzc1VwZGF0ZWQocHJvZ3Jlc3MpIHtcblx0XHR0aGlzLnN0cmVhbWVyLmVtaXQoJ3Byb2dyZXNzJywgcHJvZ3Jlc3MpO1xuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBJbXBvcnRlcldlYnNvY2tldCA9IG5ldyBJbXBvcnRlcldlYnNvY2tldERlZigpO1xuIiwiY2xhc3MgSW1wb3J0c01vZGVsIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignaW1wb3J0Jyk7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IEltcG9ydHMgPSBuZXcgSW1wb3J0c01vZGVsKCk7XG4iLCJjbGFzcyBSYXdJbXBvcnRzTW9kZWwgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdyYXdfaW1wb3J0cycpO1xuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBSYXdJbXBvcnRzID0gbmV3IFJhd0ltcG9ydHNNb2RlbCgpO1xuIiwiaW1wb3J0IHsgSW1wb3J0ZXJzIH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGdldEltcG9ydFByb2dyZXNzKGtleSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdnZXRJbXBvcnRQcm9ncmVzcycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAncnVuLWltcG9ydCcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnSW1wb3J0aW5nIGlzIG5vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdzZXR1cEltcG9ydGVyJ30pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGltcG9ydGVyID0gSW1wb3J0ZXJzLmdldChrZXkpO1xuXG5cdFx0aWYgKCFpbXBvcnRlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW1wb3J0ZXItbm90LWRlZmluZWQnLCBgVGhlIGltcG9ydGVyICgkeyBrZXkgfSkgaGFzIG5vIGltcG9ydCBjbGFzcyBkZWZpbmVkLmAsIHsgbWV0aG9kOiAnZ2V0SW1wb3J0UHJvZ3Jlc3MnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghaW1wb3J0ZXIuaW5zdGFuY2UpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGltcG9ydGVyLmluc3RhbmNlLmdldFByb2dyZXNzKCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IHtcblx0SW1wb3J0ZXJzLFxuXHRQcm9ncmVzc1N0ZXBcbn0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGdldFNlbGVjdGlvbkRhdGEoa2V5KSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2dldFNlbGVjdGlvbkRhdGEnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3J1bi1pbXBvcnQnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0ltcG9ydGluZyBpcyBub3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnc2V0dXBJbXBvcnRlcid9KTtcblx0XHR9XG5cblx0XHRjb25zdCBpbXBvcnRlciA9IEltcG9ydGVycy5nZXQoa2V5KTtcblxuXHRcdGlmICghaW1wb3J0ZXIgfHwgIWltcG9ydGVyLmluc3RhbmNlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbXBvcnRlci1ub3QtZGVmaW5lZCcsIGBUaGUgaW1wb3J0ZXIgKCR7IGtleSB9KSBoYXMgbm8gaW1wb3J0IGNsYXNzIGRlZmluZWQuYCwgeyBtZXRob2Q6ICdnZXRTZWxlY3Rpb25EYXRhJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBwcm9ncmVzcyA9IGltcG9ydGVyLmluc3RhbmNlLmdldFByb2dyZXNzKCk7XG5cblx0XHRzd2l0Y2ggKHByb2dyZXNzLnN0ZXApIHtcblx0XHRcdGNhc2UgUHJvZ3Jlc3NTdGVwLlVTRVJfU0VMRUNUSU9OOlxuXHRcdFx0XHRyZXR1cm4gaW1wb3J0ZXIuaW5zdGFuY2UuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgeyBJbXBvcnRlcnMgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDppbXBvcnRlcic7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0cHJlcGFyZUltcG9ydChrZXksIGRhdGFVUkksIGNvbnRlbnRUeXBlLCBmaWxlTmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdwcmVwYXJlSW1wb3J0JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdydW4taW1wb3J0JykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdJbXBvcnRpbmcgaXMgbm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ3NldHVwSW1wb3J0ZXInfSk7XG5cdFx0fVxuXG5cdFx0Y2hlY2soa2V5LCBTdHJpbmcpO1xuXHRcdGNoZWNrKGRhdGFVUkksIFN0cmluZyk7XG5cdFx0Y2hlY2soZmlsZU5hbWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCBpbXBvcnRlciA9IEltcG9ydGVycy5nZXQoa2V5KTtcblxuXHRcdGlmICghaW1wb3J0ZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWltcG9ydGVyLW5vdC1kZWZpbmVkJywgYFRoZSBpbXBvcnRlciAoJHsga2V5IH0pIGhhcyBubyBpbXBvcnQgY2xhc3MgZGVmaW5lZC5gLCB7IG1ldGhvZDogJ3ByZXBhcmVJbXBvcnQnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlc3VsdHMgPSBpbXBvcnRlci5pbnN0YW5jZS5wcmVwYXJlKGRhdGFVUkksIGNvbnRlbnRUeXBlLCBmaWxlTmFtZSk7XG5cblx0XHRpZiAocmVzdWx0cyBpbnN0YW5jZW9mIFByb21pc2UpIHtcblx0XHRcdHJldHVybiByZXN1bHRzLmNhdGNoKGUgPT4geyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGUpOyB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCB7XG5cdEltcG9ydGVycyxcblx0UHJvZ3Jlc3NTdGVwXG59IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRyZXN0YXJ0SW1wb3J0KGtleSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdyZXN0YXJ0SW1wb3J0JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdydW4taW1wb3J0JykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdJbXBvcnRpbmcgaXMgbm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ3NldHVwSW1wb3J0ZXInfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW1wb3J0ZXIgPSBJbXBvcnRlcnMuZ2V0KGtleSk7XG5cblx0XHRpZiAoIWltcG9ydGVyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbXBvcnRlci1ub3QtZGVmaW5lZCcsIGBUaGUgaW1wb3J0ZXIgKCR7IGtleSB9KSBoYXMgbm8gaW1wb3J0IGNsYXNzIGRlZmluZWQuYCwgeyBtZXRob2Q6ICdyZXN0YXJ0SW1wb3J0JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoaW1wb3J0ZXIuaW5zdGFuY2UpIHtcblx0XHRcdGltcG9ydGVyLmluc3RhbmNlLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5DQU5DRUxMRUQpO1xuXHRcdFx0aW1wb3J0ZXIuaW5zdGFuY2UudXBkYXRlUmVjb3JkKHsgdmFsaWQ6IGZhbHNlIH0pO1xuXHRcdFx0aW1wb3J0ZXIuaW5zdGFuY2UgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0aW1wb3J0ZXIuaW5zdGFuY2UgPSBuZXcgaW1wb3J0ZXIuaW1wb3J0ZXIoaW1wb3J0ZXIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5ldy1jYXBcblx0XHRyZXR1cm4gaW1wb3J0ZXIuaW5zdGFuY2UuZ2V0UHJvZ3Jlc3MoKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgeyBJbXBvcnRlcnMgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDppbXBvcnRlcic7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0c2V0dXBJbXBvcnRlcihrZXkpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnc2V0dXBJbXBvcnRlcicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAncnVuLWltcG9ydCcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnSW1wb3J0aW5nIGlzIG5vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdzZXR1cEltcG9ydGVyJ30pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGltcG9ydGVyID0gSW1wb3J0ZXJzLmdldChrZXkpO1xuXG5cdFx0aWYgKCFpbXBvcnRlcikge1xuXHRcdFx0Y29uc29sZS53YXJuKGBUcmllZCB0byBzZXR1cCAkeyBuYW1lIH0gYXMgYW4gaW1wb3J0ZXIuYCk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbXBvcnRlci1ub3QtZGVmaW5lZCcsICdUaGUgaW1wb3J0ZXIgd2FzIG5vdCBkZWZpbmVkIGNvcnJlY3RseSwgaXQgaXMgbWlzc2luZyB0aGUgSW1wb3J0IGNsYXNzLicsIHsgbWV0aG9kOiAnc2V0dXBJbXBvcnRlcicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGltcG9ydGVyLmluc3RhbmNlKSB7XG5cdFx0XHRyZXR1cm4gaW1wb3J0ZXIuaW5zdGFuY2UuZ2V0UHJvZ3Jlc3MoKTtcblx0XHR9XG5cblx0XHRpbXBvcnRlci5pbnN0YW5jZSA9IG5ldyBpbXBvcnRlci5pbXBvcnRlcihpbXBvcnRlcik7IC8vZXNsaW50LWRpc2FibGUtbGluZSBuZXctY2FwXG5cdFx0cmV0dXJuIGltcG9ydGVyLmluc3RhbmNlLmdldFByb2dyZXNzKCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IHtcblx0SW1wb3J0ZXJzLFxuXHRTZWxlY3Rpb24sXG5cdFNlbGVjdGlvbkNoYW5uZWwsXG5cdFNlbGVjdGlvblVzZXJcbn0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdHN0YXJ0SW1wb3J0KGtleSwgaW5wdXQpIHtcblx0XHQvLyBUYWtlcyBuYW1lIGFuZCBvYmplY3Qgd2l0aCB1c2VycyAvIGNoYW5uZWxzIHNlbGVjdGVkIHRvIGltcG9ydFxuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzdGFydEltcG9ydCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAncnVuLWltcG9ydCcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnSW1wb3J0aW5nIGlzIG5vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdzdGFydEltcG9ydCd9KTtcblx0XHR9XG5cblx0XHRpZiAoIWtleSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbXBvcnRlcicsIGBObyBkZWZpbmVkIGltcG9ydGVyIGJ5OiBcIiR7IGtleSB9XCJgLCB7IG1ldGhvZDogJ3N0YXJ0SW1wb3J0JyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBpbXBvcnRlciA9IEltcG9ydGVycy5nZXQoa2V5KTtcblxuXHRcdGlmICghaW1wb3J0ZXIgfHwgIWltcG9ydGVyLmluc3RhbmNlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbXBvcnRlci1ub3QtZGVmaW5lZCcsIGBUaGUgaW1wb3J0ZXIgKCR7IGtleSB9KSBoYXMgbm8gaW1wb3J0IGNsYXNzIGRlZmluZWQuYCwgeyBtZXRob2Q6ICdzdGFydEltcG9ydCcgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlcnNTZWxlY3Rpb24gPSBpbnB1dC51c2Vycy5tYXAodXNlciA9PiBuZXcgU2VsZWN0aW9uVXNlcih1c2VyLnVzZXJfaWQsIHVzZXIudXNlcm5hbWUsIHVzZXIuZW1haWwsIHVzZXIuaXNfZGVsZXRlZCwgdXNlci5pc19ib3QsIHVzZXIuZG9faW1wb3J0KSk7XG5cdFx0Y29uc3QgY2hhbm5lbHNTZWxlY3Rpb24gPSBpbnB1dC5jaGFubmVscy5tYXAoY2hhbm5lbCA9PiBuZXcgU2VsZWN0aW9uQ2hhbm5lbChjaGFubmVsLmNoYW5uZWxfaWQsIGNoYW5uZWwubmFtZSwgY2hhbm5lbC5pc19hcmNoaXZlZCwgY2hhbm5lbC5kb19pbXBvcnQpKTtcblxuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IG5ldyBTZWxlY3Rpb24oaW1wb3J0ZXIubmFtZSwgdXNlcnNTZWxlY3Rpb24sIGNoYW5uZWxzU2VsZWN0aW9uKTtcblx0XHRyZXR1cm4gaW1wb3J0ZXIuaW5zdGFuY2Uuc3RhcnRJbXBvcnQoc2VsZWN0aW9uKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgeyBJbXBvcnRzIH0gZnJvbSAnLi4vbW9kZWxzL0ltcG9ydHMnO1xuaW1wb3J0IHsgUmF3SW1wb3J0cyB9IGZyb20gJy4uL21vZGVscy9SYXdJbXBvcnRzJztcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdC8vIE1ha2Ugc3VyZSBhbGwgaW1wb3J0cyBhcmUgbWFya2VkIGFzIGludmFsaWQsIGRhdGEgY2xlYW4gdXAgc2luY2UgeW91IGNhbid0XG5cdC8vIHJlc3RhcnQgYW4gaW1wb3J0IGF0IHRoZSBtb21lbnQuXG5cdEltcG9ydHMudXBkYXRlKHsgdmFsaWQ6IHsgJG5lOiBmYWxzZSB9IH0sIHsgJHNldDogeyB2YWxpZDogZmFsc2UgfSB9LCB7IG11bHRpOiB0cnVlIH0pO1xuXG5cdC8vIENsZWFuIHVwIGFsbCB0aGUgcmF3IGltcG9ydCBkYXRhLCBzaW5jZSB5b3UgY2FuJ3QgcmVzdGFydCBhbiBpbXBvcnQgYXQgdGhlIG1vbWVudFxuXHR0cnkge1xuXHRcdFJhd0ltcG9ydHMubW9kZWwucmF3Q29sbGVjdGlvbigpLmRyb3AoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGNvbnNvbGUubG9nKCdlcnJyb3InLCBlKTsgLy9UT0RPOiBSZW1vdmVcblx0XHQvLyBpZ25vcmVkXG5cdH1cbn0pO1xuIiwiaW1wb3J0IHsgQmFzZSB9IGZyb20gJy4vY2xhc3Nlcy9JbXBvcnRlckJhc2UnO1xuaW1wb3J0IHsgSW1wb3J0cyB9IGZyb20gJy4vbW9kZWxzL0ltcG9ydHMnO1xuaW1wb3J0IHsgSW1wb3J0ZXJzIH0gZnJvbSAnLi4vbGliL0ltcG9ydGVycyc7XG5pbXBvcnQgeyBJbXBvcnRlckluZm8gfSBmcm9tICcuLi9saWIvSW1wb3J0ZXJJbmZvJztcbmltcG9ydCB7IEltcG9ydGVyV2Vic29ja2V0IH0gZnJvbSAnLi9jbGFzc2VzL0ltcG9ydGVyV2Vic29ja2V0JztcbmltcG9ydCB7IFByb2dyZXNzIH0gZnJvbSAnLi9jbGFzc2VzL0ltcG9ydGVyUHJvZ3Jlc3MnO1xuaW1wb3J0IHsgUHJvZ3Jlc3NTdGVwIH0gZnJvbSAnLi4vbGliL0ltcG9ydGVyUHJvZ3Jlc3NTdGVwJztcbmltcG9ydCB7IFJhd0ltcG9ydHMgfSBmcm9tICcuL21vZGVscy9SYXdJbXBvcnRzJztcbmltcG9ydCB7IFNlbGVjdGlvbiB9IGZyb20gJy4vY2xhc3Nlcy9JbXBvcnRlclNlbGVjdGlvbic7XG5pbXBvcnQgeyBTZWxlY3Rpb25DaGFubmVsIH0gZnJvbSAnLi9jbGFzc2VzL0ltcG9ydGVyU2VsZWN0aW9uQ2hhbm5lbCc7XG5pbXBvcnQgeyBTZWxlY3Rpb25Vc2VyIH0gZnJvbSAnLi9jbGFzc2VzL0ltcG9ydGVyU2VsZWN0aW9uVXNlcic7XG5cbmV4cG9ydCB7XG5cdEJhc2UsXG5cdEltcG9ydHMsXG5cdEltcG9ydGVycyxcblx0SW1wb3J0ZXJJbmZvLFxuXHRJbXBvcnRlcldlYnNvY2tldCxcblx0UHJvZ3Jlc3MsXG5cdFByb2dyZXNzU3RlcCxcblx0UmF3SW1wb3J0cyxcblx0U2VsZWN0aW9uLFxuXHRTZWxlY3Rpb25DaGFubmVsLFxuXHRTZWxlY3Rpb25Vc2VyXG59O1xuIiwiZXhwb3J0IGNsYXNzIEltcG9ydGVySW5mbyB7XG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgbmV3IGNsYXNzIHdoaWNoIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSBpbXBvcnRlci5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgdW5pcXVlIGtleSBvZiB0aGlzIGltcG9ydGVyLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgaTE4biBuYW1lLlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbWltZVR5cGUgVGhlIHR5cGUgb2YgZmlsZSBpdCBleHBlY3RzLlxuXHQgKiBAcGFyYW0ge3sgaHJlZjogc3RyaW5nLCB0ZXh0OiBzdHJpbmcgfVtdfSB3YXJuaW5ncyBBbiBhcnJheSBvZiB3YXJuaW5nIG9iamVjdHMuIGB7IGhyZWYsIHRleHQgfWBcblx0ICovXG5cdGNvbnN0cnVjdG9yKGtleSwgbmFtZSA9ICcnLCBtaW1lVHlwZSA9ICcnLCB3YXJuaW5ncyA9IFtdKSB7XG5cdFx0dGhpcy5rZXkgPSBrZXk7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLm1pbWVUeXBlID0gbWltZVR5cGU7XG5cdFx0dGhpcy53YXJuaW5ncyA9IHdhcm5pbmdzO1xuXG5cdFx0dGhpcy5pbXBvcnRlciA9IHVuZGVmaW5lZDtcblx0XHR0aGlzLmluc3RhbmNlID0gdW5kZWZpbmVkO1xuXHR9XG59XG4iLCIvKiogVGhlIHByb2dyZXNzIHN0ZXAgdGhhdCBhbiBpbXBvcnRlciBpcyBhdC4gKi9cbmV4cG9ydCBjb25zdCBQcm9ncmVzc1N0ZXAgPSBPYmplY3QuZnJlZXplKHtcblx0TkVXOiAnaW1wb3J0ZXJfbmV3Jyxcblx0UFJFUEFSSU5HX1NUQVJURUQ6ICdpbXBvcnRlcl9wcmVwYXJpbmdfc3RhcnRlZCcsXG5cdFBSRVBBUklOR19VU0VSUzogJ2ltcG9ydGVyX3ByZXBhcmluZ191c2VycycsXG5cdFBSRVBBUklOR19DSEFOTkVMUzogJ2ltcG9ydGVyX3ByZXBhcmluZ19jaGFubmVscycsXG5cdFBSRVBBUklOR19NRVNTQUdFUzogJ2ltcG9ydGVyX3ByZXBhcmluZ19tZXNzYWdlcycsXG5cdFVTRVJfU0VMRUNUSU9OOiAnaW1wb3J0ZXJfdXNlcl9zZWxlY3Rpb24nLFxuXHRJTVBPUlRJTkdfU1RBUlRFRDogJ2ltcG9ydGVyX2ltcG9ydGluZ19zdGFydGVkJyxcblx0SU1QT1JUSU5HX1VTRVJTOiAnaW1wb3J0ZXJfaW1wb3J0aW5nX3VzZXJzJyxcblx0SU1QT1JUSU5HX0NIQU5ORUxTOiAnaW1wb3J0ZXJfaW1wb3J0aW5nX2NoYW5uZWxzJyxcblx0SU1QT1JUSU5HX01FU1NBR0VTOiAnaW1wb3J0ZXJfaW1wb3J0aW5nX21lc3NhZ2VzJyxcblx0RklOSVNISU5HOiAnaW1wb3J0ZXJfZmluaXNoaW5nJyxcblx0RE9ORTogJ2ltcG9ydGVyX2RvbmUnLFxuXHRFUlJPUjogJ2ltcG9ydGVyX2ltcG9ydF9mYWlsZWQnLFxuXHRDQU5DRUxMRUQ6ICdpbXBvcnRlcl9pbXBvcnRfY2FuY2VsbGVkJ1xufSk7XG4iLCJpbXBvcnQgeyBJbXBvcnRlckluZm8gfSBmcm9tICcuL0ltcG9ydGVySW5mbyc7XG5cbi8qKiBDb250YWluZXIgY2xhc3Mgd2hpY2ggaG9sZHMgYWxsIG9mIHRoZSBpbXBvcnRlciBkZXRhaWxzLiAqL1xuY2xhc3MgSW1wb3J0ZXJzQ29udGFpbmVyIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5pbXBvcnRlcnMgPSBuZXcgTWFwKCk7XG5cdH1cblxuXHQvKipcblx0ICogQWRkcyBhbiBpbXBvcnRlciB0byB0aGUgaW1wb3J0IGNvbGxlY3Rpb24uIEFkZGluZyBpdCBtb3JlIHRoYW4gb25jZSB3aWxsXG5cdCAqIG92ZXJ3cml0ZSB0aGUgcHJldmlvdXMgb25lLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0ltcG9ydGVySW5mb30gaW5mbyBUaGUgaW5mb3JtYXRpb24gcmVsYXRlZCB0byB0aGUgaW1wb3J0ZXIuXG5cdCAqIEBwYXJhbSB7Kn0gaW1wb3J0ZXIgVGhlIGNsYXNzIGZvciB0aGUgaW1wb3J0ZXIsIHdpbGwgYmUgdW5kZWZpbmVkIG9uIHRoZSBjbGllbnQuXG5cdCAqL1xuXHRhZGQoaW5mbywgaW1wb3J0ZXIpIHtcblx0XHRpZiAoIShpbmZvIGluc3RhbmNlb2YgSW1wb3J0ZXJJbmZvKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgaW1wb3J0ZXIgbXVzdCBiZSBhIHZhbGlkIEltcG9ydGVySW5mbyBpbnN0YW5jZS4nKTtcblx0XHR9XG5cblx0XHRpbmZvLmltcG9ydGVyID0gaW1wb3J0ZXI7XG5cblx0XHR0aGlzLmltcG9ydGVycy5zZXQoaW5mby5rZXksIGluZm8pO1xuXG5cdFx0cmV0dXJuIHRoaXMuaW1wb3J0ZXJzLmdldChpbmZvLmtleSk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB0aGUgaW1wb3J0ZXIgaW5mb3JtYXRpb24gdGhhdCBpcyBzdG9yZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgaW1wb3J0ZXIuXG5cdCAqL1xuXHRnZXQoa2V5KSB7XG5cdFx0cmV0dXJuIHRoaXMuaW1wb3J0ZXJzLmdldChrZXkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldHMgYWxsIG9mIHRoZSBpbXBvcnRlcnMgaW4gYXJyYXkgZm9ybWF0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7SW1wb3J0ZXJJbmZvW119IFRoZSBhcnJheSBvZiBpbXBvcnRlciBpbmZvcm1hdGlvbi5cblx0ICovXG5cdGdldEFsbCgpIHtcblx0XHRyZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmltcG9ydGVycy52YWx1ZXMoKSk7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IEltcG9ydGVycyA9IG5ldyBJbXBvcnRlcnNDb250YWluZXIoKTtcbiJdfQ==
