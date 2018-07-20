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

/* Package-scope variables */
var Apps;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:apps":{"lib":{"Apps.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/lib/Apps.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Please see both server and client's repsective "orchestrator" file for the contents
Apps = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"storage":{"apps-logs-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-logs-model.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel
});

class AppsLogsModel extends RocketChat.models._Base {
  constructor() {
    super('apps_logs');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-model.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsModel: () => AppsModel
});

class AppsModel extends RocketChat.models._Base {
  constructor() {
    super('apps');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-persistence-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-persistence-model.js                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsPersistenceModel: () => AppsPersistenceModel
});

class AppsPersistenceModel extends RocketChat.models._Base {
  constructor() {
    super('apps_persistence');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/storage.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealStorage: () => AppRealStorage
});
let AppStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppStorage(v) {
    AppStorage = v;
  }

}, 0);

class AppRealStorage extends AppStorage {
  constructor(data) {
    super('mongodb');
    this.db = data;
  }

  create(item) {
    return new Promise((resolve, reject) => {
      item.createdAt = new Date();
      item.updatedAt = new Date();
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            id: item.id
          }, {
            'info.nameSlug': item.info.nameSlug
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        return reject(new Error('App already exists.'));
      }

      try {
        const id = this.db.insert(item);
        item._id = id;
        resolve(item);
      } catch (e) {
        reject(e);
      }
    });
  }

  retrieveOne(id) {
    return new Promise((resolve, reject) => {
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            _id: id
          }, {
            id
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        resolve(doc);
      } else {
        reject(new Error(`No App found by the id: ${id}`));
      }
    });
  }

  retrieveAll() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({}).fetch();
      } catch (e) {
        return reject(e);
      }

      const items = new Map();
      docs.forEach(i => items.set(i.id, i));
      resolve(items);
    });
  }

  update(item) {
    return new Promise((resolve, reject) => {
      try {
        this.db.update({
          id: item.id
        }, item);
      } catch (e) {
        return reject(e);
      }

      this.retrieveOne(item.id).then(updated => resolve(updated)).catch(err => reject(err));
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      try {
        this.db.remove({
          id
        });
      } catch (e) {
        return reject(e);
      }

      resolve({
        success: true
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel,
  AppsModel: () => AppsModel,
  AppsPersistenceModel: () => AppsPersistenceModel,
  AppRealLogsStorage: () => AppRealLogsStorage,
  AppRealStorage: () => AppRealStorage
});
let AppsLogsModel;
module.watch(require("./apps-logs-model"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  }

}, 0);
let AppsModel;
module.watch(require("./apps-model"), {
  AppsModel(v) {
    AppsModel = v;
  }

}, 1);
let AppsPersistenceModel;
module.watch(require("./apps-persistence-model"), {
  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  }

}, 2);
let AppRealLogsStorage;
module.watch(require("./logs-storage"), {
  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppRealStorage;
module.watch(require("./storage"), {
  AppRealStorage(v) {
    AppRealStorage = v;
  }

}, 4);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logs-storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/logs-storage.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealLogsStorage: () => AppRealLogsStorage
});
let AppConsole;
module.watch(require("@rocket.chat/apps-engine/server/logging"), {
  AppConsole(v) {
    AppConsole = v;
  }

}, 0);
let AppLogStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppLogStorage(v) {
    AppLogStorage = v;
  }

}, 1);

class AppRealLogsStorage extends AppLogStorage {
  constructor(model) {
    super('mongodb');
    this.db = model;
  }

  find() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find(...arguments).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

  storeEntries(appId, logger) {
    return new Promise((resolve, reject) => {
      const item = AppConsole.toStorageEntry(appId, logger);

      try {
        const id = this.db.insert(item);
        resolve(this.db.findOneById(id));
      } catch (e) {
        reject(e);
      }
    });
  }

  getEntriesFor(appId) {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({
          appId
        }).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

  removeEntriesFor(appId) {
    return new Promise((resolve, reject) => {
      try {
        this.db.remove({
          appId
        });
      } catch (e) {
        return reject(e);
      }

      resolve();
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"activation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/activation.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppActivationBridge: () => AppActivationBridge
});

class AppActivationBridge {
  constructor(orch) {
    this.orch = orch;
  }

  appAdded(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appAdded(app.getID()));
    });
  }

  appUpdated(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appUpdated(app.getID()));
    });
  }

  appRemoved(app) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appRemoved(app.getID()));
    });
  }

  appStatusChanged(app, status) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getNotifier().appStatusUpdated(app.getID(), status));
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bridges.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/bridges.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges
});
let AppBridges;
module.watch(require("@rocket.chat/apps-engine/server/bridges"), {
  AppBridges(v) {
    AppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppDetailChangesBridge;
module.watch(require("./details"), {
  AppDetailChangesBridge(v) {
    AppDetailChangesBridge = v;
  }

}, 2);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 3);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 4);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 5);
let AppListenerBridge;
module.watch(require("./listeners"), {
  AppListenerBridge(v) {
    AppListenerBridge = v;
  }

}, 6);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 7);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 8);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 9);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 10);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 11);

class RealAppBridges extends AppBridges {
  constructor(orch) {
    super();
    this._actBridge = new AppActivationBridge(orch);
    this._cmdBridge = new AppCommandsBridge(orch);
    this._detBridge = new AppDetailChangesBridge(orch);
    this._envBridge = new AppEnvironmentalVariableBridge(orch);
    this._httpBridge = new AppHttpBridge();
    this._lisnBridge = new AppListenerBridge(orch);
    this._msgBridge = new AppMessageBridge(orch);
    this._persistBridge = new AppPersistenceBridge(orch);
    this._roomBridge = new AppRoomBridge(orch);
    this._setsBridge = new AppSettingBridge(orch);
    this._userBridge = new AppUserBridge(orch);
  }

  getCommandBridge() {
    return this._cmdBridge;
  }

  getEnvironmentalVariableBridge() {
    return this._envBridge;
  }

  getHttpBridge() {
    return this._httpBridge;
  }

  getListenerBridge() {
    return this._lisnBridge;
  }

  getMessageBridge() {
    return this._msgBridge;
  }

  getPersistenceBridge() {
    return this._persistBridge;
  }

  getAppActivationBridge() {
    return this._actBridge;
  }

  getAppDetailChangesBridge() {
    return this._detBridge;
  }

  getRoomBridge() {
    return this._roomBridge;
  }

  getServerSettingBridge() {
    return this._setsBridge;
  }

  getUserBridge() {
    return this._userBridge;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/commands.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppCommandsBridge: () => AppCommandsBridge
});
let SlashCommandContext;
module.watch(require("@rocket.chat/apps-ts-definition/slashcommands"), {
  SlashCommandContext(v) {
    SlashCommandContext = v;
  }

}, 0);

class AppCommandsBridge {
  constructor(orch) {
    this.orch = orch;
    this.disabledCommands = new Map();
  }

  doesCommandExist(command, appId) {
    console.log(`The App ${appId} is checking if "${command}" command exists.`);

    if (typeof command !== 'string' || command.length === 0) {
      return false;
    }

    const cmd = command.toLowerCase();
    return typeof RocketChat.slashCommands.commands[cmd] === 'object' || this.disabledCommands.has(cmd);
  }

  enableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to enable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (!this.disabledCommands.has(cmd)) {
      throw new Error(`The command is not currently disabled: "${cmd}"`);
    }

    RocketChat.slashCommands.commands[cmd] = this.disabledCommands.get(cmd);
    this.disabledCommands.delete(cmd);
    this.orch.getNotifier().commandUpdated(cmd);
  }

  disableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to disable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (this.disabledCommands.has(cmd)) {
      // The command is already disabled, no need to disable it yet again
      return;
    }

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently: "${cmd}"`);
    }

    this.disabledCommands.set(cmd, RocketChat.slashCommands.commands[cmd]);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandDisabled(cmd);
  } // command: { command, paramsExample, i18nDescription, executor: function }


  modifyCommand(command, appId) {
    console.log(`The App ${appId} is attempting to modify the command: "${command}"`);

    this._verifyCommand(command);

    const cmd = command.toLowerCase();

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently (or it is disabled): "${cmd}"`);
    }

    const item = RocketChat.slashCommands.commands[cmd];
    item.params = command.paramsExample ? command.paramsExample : item.params;
    item.description = command.i18nDescription ? command.i18nDescription : item.params;
    item.callback = this._appCommandExecutor.bind(this);
    item.providesPreview = command.providesPreview;
    item.previewer = command.previewer ? this._appCommandPreviewer.bind(this) : item.previewer;
    item.previewCallback = command.executePreviewItem ? this._appCommandPreviewExecutor.bind(this) : item.previewCallback;
    RocketChat.slashCommands.commands[cmd] = item;
    this.orch.getNotifier().commandUpdated(cmd);
  }

  registerCommand(command, appId) {
    console.log(`The App ${appId} is registerin the command: "${command.command}"`);

    this._verifyCommand(command);

    const item = {
      command: command.command.toLowerCase(),
      params: command.paramsExample,
      description: command.i18nDescription,
      callback: this._appCommandExecutor.bind(this),
      providesPreview: command.providesPreview,
      previewer: !command.previewer ? undefined : this._appCommandPreviewer.bind(this),
      previewCallback: !command.executePreviewItem ? undefined : this._appCommandPreviewExecutor.bind(this)
    };
    RocketChat.slashCommands.commands[command.command.toLowerCase()] = item;
    this.orch.getNotifier().commandAdded(command.command.toLowerCase());
  }

  unregisterCommand(command, appId) {
    console.log(`The App ${appId} is unregistering the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();
    this.disabledCommands.delete(cmd);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandRemoved(cmd);
  }

  _verifyCommand(command) {
    if (typeof command !== 'object') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.command !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.i18nParamsExample && typeof command.i18nParamsExample !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.i18nDescription && typeof command.i18nDescription !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.providesPreview !== 'boolean') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.executor !== 'function') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }
  }

  _appCommandExecutor(command, parameters, message) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    Promise.await(this.orch.getManager().getCommandManager().executeCommand(command, context));
  }

  _appCommandPreviewer(command, parameters, message) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    return Promise.await(this.orch.getManager().getCommandManager().getPreviews(command, context));
  }

  _appCommandPreviewExecutor(command, parameters, message, preview) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    Promise.await(this.orch.getManager().getCommandManager().executePreview(command, preview, context));
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"environmental.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/environmental.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge
});

class AppEnvironmentalVariableBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
  }

  getValueByName(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the environmental variable value ${envVarName}.`);

      if (this.isReadable(envVarName, appId)) {
        return process.env[envVarName];
      }

      throw new Error(`The environmental variable "${envVarName}" is not readable.`);
    });
  }

  isReadable(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if the environmental variable is readable ${envVarName}.`);
      return this.allowed.includes(envVarName.toUpperCase());
    });
  }

  isSet(envVarName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if the environmental variable is set ${envVarName}.`);

      if (this.isReadable(envVarName, appId)) {
        return typeof process.env[envVarName] !== 'undefined';
      }

      throw new Error(`The environmental variable "${envVarName}" is not readable.`);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/messages.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessageBridge: () => AppMessageBridge
});

class AppMessageBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is creating a new message.`);
      let msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      Meteor.runAsUser(msg.u._id, () => {
        msg = Meteor.call('sendMessage', msg);
      });
      return msg._id;
    });
  }

  getById(messageId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the message: "${messageId}"`);
      return this.orch.getConverters().get('messages').convertById(messageId);
    });
  }

  update(message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating a message.`);

      if (!message.editor) {
        throw new Error('Invalid editor assigned to the message for the update.');
      }

      if (!message.id || !RocketChat.models.Messages.findOneById(message.id)) {
        throw new Error('A message must exist to update.');
      }

      const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      RocketChat.updateMessage(msg, editor);
    });
  }

  notifyUser(user, message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is notifying a user.`);
      const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
      RocketChat.Notifications.notifyUser(user.id, 'message', Object.assign(msg, {
        _id: Random.id(),
        ts: new Date(),
        u: undefined,
        editor: undefined
      }));
    });
  }

  notifyRoom(room, message, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is notifying a room's users.`);

      if (room) {
        const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
        const rmsg = Object.assign(msg, {
          _id: Random.id(),
          rid: room.id,
          ts: new Date(),
          u: undefined,
          editor: undefined
        });
        const users = RocketChat.models.Subscriptions.findByRoomIdWhenUserIdExists(room._id, {
          fields: {
            'u._id': 1
          }
        }).fetch().map(s => s.u._id);
        RocketChat.models.Users.findByIds(users, {
          fields: {
            _id: 1
          }
        }).fetch().forEach(({
          _id
        }) => RocketChat.Notifications.notifyUser(_id, 'message', rmsg));
      }
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"persistence.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/persistence.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppPersistenceBridge: () => AppPersistenceBridge
});

class AppPersistenceBridge {
  constructor(orch) {
    this.orch = orch;
  }

  purge(appId) {
    return Promise.asyncApply(() => {
      console.log(`The App's persistent storage is being purged: ${appId}`);
      this.orch.getPersistenceModel().remove({
        appId
      });
    });
  }

  create(data, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is storing a new object in their persistence.`, data);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      return this.orch.getPersistenceModel().insert({
        appId,
        data
      });
    });
  }

  createWithAssociations(data, associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is storing a new object in their persistence that is associated with some models.`, data, associations);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      return this.orch.getPersistenceModel().insert({
        appId,
        associations,
        data
      });
    });
  }

  readById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is reading their data in their persistence with the id: "${id}"`);
      const record = this.orch.getPersistenceModel().findOneById(id);
      return record.data;
    });
  }

  readByAssociations(associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is searching for records that are associated with the following:`, associations);
      const records = this.orch.getPersistenceModel().find({
        appId,
        associations: {
          $all: associations
        }
      }).fetch();
      return Array.isArray(records) ? records.map(r => r.data) : [];
    });
  }

  remove(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is removing one of their records by the id: "${id}"`);
      const record = this.orch.getPersistenceModel().findOne({
        _id: id,
        appId
      });

      if (!record) {
        return undefined;
      }

      this.orch.getPersistenceModel().remove({
        _id: id,
        appId
      });
      return record.data;
    });
  }

  removeByAssociations(associations, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is removing records with the following associations:`, associations);
      const query = {
        appId,
        associations: {
          $all: associations
        }
      };
      const records = this.orch.getPersistenceModel().find(query).fetch();

      if (!records) {
        return undefined;
      }

      this.orch.getPersistenceModel().remove(query);
      return Array.isArray(records) ? records.map(r => r.data) : [];
    });
  }

  update(id, data, upsert, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating the record "${id}" to:`, data);

      if (typeof data !== 'object') {
        throw new Error('Attempted to store an invalid data type, it must be an object.');
      }

      throw new Error('Not implemented.');
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/rooms.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomBridge: () => AppRoomBridge
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(room, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is creating a new room.`, room);
      const rcRoom = this.orch.getConverters().get('rooms').convertAppRoom(room);
      let method;

      switch (room.type) {
        case RoomType.CHANNEL:
          method = 'createChannel';
          break;

        case RoomType.PRIVATE_GROUP:
          method = 'createPrivateGroup';
          break;

        default:
          throw new Error('Only channels and private groups can be created.');
      }

      let rid;
      Meteor.runAsUser(room.creator.id, () => {
        const info = Meteor.call(method, rcRoom.members);
        rid = info.rid;
      });
      return rid;
    });
  }

  getById(roomId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the roomById: "${roomId}"`);
      return this.orch.getConverters().get('rooms').convertById(roomId);
    });
  }

  getByName(roomName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the roomByName: "${roomName}"`);
      return this.orch.getConverters().get('rooms').convertByName(roomName);
    });
  }

  getCreatorById(roomId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the room's creator by id: "${roomId}"`);
      const room = RocketChat.models.Rooms.findOneById(roomId);

      if (!room || !room.u || !room.u._id) {
        return undefined;
      }

      return this.orch.getConverters().get('users').convertById(room.u._id);
    });
  }

  getCreatorByName(roomName, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the room's creator by name: "${roomName}"`);
      const room = RocketChat.models.Rooms.findOneByName(roomName);

      if (!room || !room.u || !room.u._id) {
        return undefined;
      }

      return this.orch.getConverters().get('users').convertById(room.u._id);
    });
  }

  update(room, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating a room.`);

      if (!room.id || RocketChat.models.Rooms.findOneById(room.id)) {
        throw new Error('A room must exist to update.');
      }

      const rm = this.orch.getConverters().get('rooms').convertAppRoom(room);
      RocketChat.models.Rooms.update(rm._id, rm);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/settings.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingBridge: () => AppSettingBridge
});

class AppSettingBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowedGroups = [];
    this.disallowedSettings = ['Accounts_RegistrationForm_SecretURL', 'CROWD_APP_USERNAME', 'CROWD_APP_PASSWORD', 'Direct_Reply_Username', 'Direct_Reply_Password', 'SMTP_Username', 'SMTP_Password', 'FileUpload_S3_AWSAccessKeyId', 'FileUpload_S3_AWSSecretAccessKey', 'FileUpload_S3_BucketURL', 'FileUpload_GoogleStorage_Bucket', 'FileUpload_GoogleStorage_AccessId', 'FileUpload_GoogleStorage_Secret', 'GoogleVision_ServiceAccount', 'Allow_Invalid_SelfSigned_Certs', 'GoogleTagManager_id', 'Bugsnag_api_key', 'LDAP_CA_Cert', 'LDAP_Reject_Unauthorized', 'LDAP_Domain_Search_User', 'LDAP_Domain_Search_Password', 'Livechat_secret_token', 'Livechat_Knowledge_Apiai_Key', 'AutoTranslate_GoogleAPIKey', 'MapView_GMapsAPIKey', 'Meta_fb_app_id', 'Meta_google-site-verification', 'Meta_msvalidate01', 'Accounts_OAuth_Dolphin_secret', 'Accounts_OAuth_Drupal_secret', 'Accounts_OAuth_Facebook_secret', 'Accounts_OAuth_Github_secret', 'API_GitHub_Enterprise_URL', 'Accounts_OAuth_GitHub_Enterprise_secret', 'API_Gitlab_URL', 'Accounts_OAuth_Gitlab_secret', 'Accounts_OAuth_Google_secret', 'Accounts_OAuth_Linkedin_secret', 'Accounts_OAuth_Meteor_secret', 'Accounts_OAuth_Twitter_secret', 'API_Wordpress_URL', 'Accounts_OAuth_Wordpress_secret', 'Push_apn_passphrase', 'Push_apn_key', 'Push_apn_cert', 'Push_apn_dev_passphrase', 'Push_apn_dev_key', 'Push_apn_dev_cert', 'Push_gcm_api_key', 'Push_gcm_project_number', 'SAML_Custom_Default_cert', 'SAML_Custom_Default_private_key', 'SlackBridge_APIToken', 'Smarsh_Email', 'SMS_Twilio_Account_SID', 'SMS_Twilio_authToken'];
  }

  getAll(appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting all the settings.`);
      return RocketChat.models.Settings.find({
        _id: {
          $nin: this.disallowedSettings
        }
      }).fetch().map(s => {
        this.orch.getConverters().get('settings').convertToApp(s);
      });
    });
  }

  getOneById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the setting by id ${id}.`);

      if (!this.isReadableById(id, appId)) {
        throw new Error(`The setting "${id}" is not readable.`);
      }

      return this.orch.getConverters().get('settings').convertById(id);
    });
  }

  hideGroup(name, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is hidding the group ${name}.`);
      throw new Error('Method not implemented.');
    });
  }

  hideSetting(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is hidding the setting ${id}.`);

      if (!this.isReadableById(id, appId)) {
        throw new Error(`The setting "${id}" is not readable.`);
      }

      throw new Error('Method not implemented.');
    });
  }

  isReadableById(id, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is checking if they can read the setting ${id}.`);
      return !this.disallowedSettings.includes(id);
    });
  }

  updateOne(setting, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is updating the setting ${setting.id} .`);

      if (!this.isReadableById(setting.id, appId)) {
        throw new Error(`The setting "${setting.id}" is not readable.`);
      }

      throw new Error('Method not implemented.');
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/users.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUserBridge: () => AppUserBridge
});

class AppUserBridge {
  constructor(orch) {
    this.orch = orch;
  }

  getById(userId, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the userId: "${userId}"`);
      return this.orch.getConverters().get('users').convertById(userId);
    });
  }

  getByUsername(username, appId) {
    return Promise.asyncApply(() => {
      console.log(`The App ${appId} is getting the username: "${username}"`);
      return this.orch.getConverters().get('users').convertByUsername(username);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges,
  AppActivationBridge: () => AppActivationBridge,
  AppCommandsBridge: () => AppCommandsBridge,
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge,
  AppHttpBridge: () => AppHttpBridge,
  AppListenerBridge: () => AppListenerBridge,
  AppMessageBridge: () => AppMessageBridge,
  AppPersistenceBridge: () => AppPersistenceBridge,
  AppRoomBridge: () => AppRoomBridge,
  AppSettingBridge: () => AppSettingBridge,
  AppUserBridge: () => AppUserBridge
});
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 2);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 3);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 4);
let AppListenerBridge;
module.watch(require("./listeners"), {
  AppListenerBridge(v) {
    AppListenerBridge = v;
  }

}, 5);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 6);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 7);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 8);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 9);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 10);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"details.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/details.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppDetailChangesBridge: () => AppDetailChangesBridge
});

class AppDetailChangesBridge {
  constructor(orch) {
    this.orch = orch;
  }

  onAppSettingsChange(appId, setting) {
    try {
      this.orch.getNotifier().appSettingsChange(appId, setting);
    } catch (e) {
      console.warn('failed to notify about the setting change.', appId);
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"http.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/http.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppHttpBridge: () => AppHttpBridge
});

class AppHttpBridge {
  call(info) {
    if (!info.request.content && typeof info.request.data === 'object') {
      info.request.content = JSON.stringify(info.request.data);
    }

    console.log(`The App ${info.appId} is requesting from the outter webs:`, info);
    return new Promise((resolve, reject) => {
      HTTP.call(info.method, info.url, info.request, (e, result) => {
        return e ? reject(e.response) : resolve(result);
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"listeners.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/listeners.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppListenerBridge: () => AppListenerBridge
});

class AppListenerBridge {
  constructor(orch) {
    this.orch = orch;
  }

  messageEvent(inte, message) {
    return Promise.asyncApply(() => {
      const msg = this.orch.getConverters().get('messages').convertMessage(message);
      const result = Promise.await(this.orch.getManager().getListenerManager().executeListener(inte, msg));

      if (typeof result === 'boolean') {
        return result;
      } else {
        return this.orch.getConverters().get('messages').convertAppMessage(result);
      } // try {
      // } catch (e) {
      // 	console.log(`${ e.name }: ${ e.message }`);
      // 	console.log(e.stack);
      // }

    });
  }

  roomEvent(inte, room) {
    return Promise.asyncApply(() => {
      const rm = this.orch.getConverters().get('rooms').convertRoom(room);
      const result = Promise.await(this.orch.getManager().getListenerManager().executeListener(inte, rm));

      if (typeof result === 'boolean') {
        return result;
      } else {
        return this.orch.getConverters().get('rooms').convertAppRoom(result);
      } // try {
      // } catch (e) {
      // 	console.log(`${ e.name }: ${ e.message }`);
      // 	console.log(e.stack);
      // }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"communication":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/methods.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods
});

const waitToLoad = function (orch) {
  return new Promise(resolve => {
    let id = setInterval(() => {
      if (orch.isEnabled() && orch.isLoaded()) {
        clearInterval(id);
        id = -1;
        resolve();
      }
    }, 100);
  });
};

const waitToUnload = function (orch) {
  return new Promise(resolve => {
    let id = setInterval(() => {
      if (!orch.isEnabled() && !orch.isLoaded()) {
        clearInterval(id);
        id = -1;
        resolve();
      }
    }, 100);
  });
};

class AppMethods {
  constructor(orch) {
    this._orch = orch;

    this._addMethods();
  }

  isEnabled() {
    return typeof this._orch !== 'undefined' && this._orch.isEnabled();
  }

  isLoaded() {
    return typeof this._orch !== 'undefined' && this._orch.isEnabled() && this._orch.isLoaded();
  }

  _addMethods() {
    const instance = this;
    Meteor.methods({
      'apps/is-enabled'() {
        return instance.isEnabled();
      },

      'apps/is-loaded'() {
        return instance.isLoaded();
      },

      'apps/go-enable'() {
        if (!Meteor.userId()) {
          throw new Meteor.Error('error-invalid-user', 'Invalid user', {
            method: 'apps/go-enable'
          });
        }

        if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-apps')) {
          throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
            method: 'apps/go-enable'
          });
        }

        RocketChat.settings.set('Apps_Framework_enabled', true);
        Promise.await(waitToLoad(instance._orch));
      },

      'apps/go-disable'() {
        if (!Meteor.userId()) {
          throw new Meteor.Error('error-invalid-user', 'Invalid user', {
            method: 'apps/go-enable'
          });
        }

        if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-apps')) {
          throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
            method: 'apps/go-enable'
          });
        }

        RocketChat.settings.set('Apps_Framework_enabled', false);
        Promise.await(waitToUnload(instance._orch));
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rest.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/rest.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsRestApi: () => AppsRestApi
});

class AppsRestApi {
  constructor(orch, manager) {
    this._orch = orch;
    this._manager = manager;
    this.api = new RocketChat.API.ApiClass({
      version: 'apps',
      useDefaultAuth: true,
      prettyJson: false,
      enableCors: false,
      auth: RocketChat.API.getUserAuth()
    });
    this.addManagementRoutes();
  }

  _handleFile(request, fileField) {
    const Busboy = Npm.require('busboy');

    const busboy = new Busboy({
      headers: request.headers
    });
    return Meteor.wrapAsync(callback => {
      busboy.on('file', Meteor.bindEnvironment((fieldname, file) => {
        if (fieldname !== fileField) {
          return callback(new Meteor.Error('invalid-field', `Expected the field "${fileField}" but got "${fieldname}" instead.`));
        }

        const fileData = [];
        file.on('data', Meteor.bindEnvironment(data => {
          fileData.push(data);
        }));
        file.on('end', Meteor.bindEnvironment(() => callback(undefined, Buffer.concat(fileData))));
      }));
      request.pipe(busboy);
    })();
  }

  addManagementRoutes() {
    const orchestrator = this._orch;
    const manager = this._manager;
    const fileHandler = this._handleFile;
    this.api.addRoute('', {
      authRequired: true
    }, {
      get() {
        const apps = manager.get().map(prl => {
          const info = prl.getInfo();
          info.languages = prl.getStorageItem().languageContent;
          info.status = prl.getStatus();
          return info;
        });
        return RocketChat.API.v1.success({
          apps
        });
      },

      post() {
        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const aff = Promise.await(manager.add(buff.toString('base64'), false));
        const info = aff.getAppInfo(); // If there are compiler errors, there won't be an App to get the status of

        if (aff.getApp()) {
          info.status = aff.getApp().getStatus();
        } else {
          info.status = 'compiler_error';
        }

        return RocketChat.API.v1.success({
          app: info,
          implemented: aff.getImplementedInferfaces(),
          compilerErrors: aff.getCompilerErrors()
        });
      }

    });
    this.api.addRoute('languages', {
      authRequired: false
    }, {
      get() {
        const apps = manager.get().map(prl => {
          return {
            id: prl.getID(),
            languages: prl.getStorageItem().languageContent
          };
        });
        return RocketChat.API.v1.success({
          apps
        });
      }

    });
    this.api.addRoute(':id', {
      authRequired: true
    }, {
      get() {
        console.log('Getting:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log('Updating:', this.urlParams.id); // TODO: Verify permissions

        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const aff = Promise.await(manager.update(buff.toString('base64')));
        const info = aff.getAppInfo(); // Should the updated version have compiler errors, no App will be returned

        if (aff.getApp()) {
          info.status = aff.getApp().getStatus();
        } else {
          info.status = 'compiler_error';
        }

        return RocketChat.API.v1.success({
          app: info,
          implemented: aff.getImplementedInferfaces(),
          compilerErrors: aff.getCompilerErrors()
        });
      },

      delete() {
        console.log('Uninstalling:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          Promise.await(manager.remove(prl.getID()));
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/icon', {
      authRequired: true
    }, {
      get() {
        console.log('Getting the App\'s Icon:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          return RocketChat.API.v1.success({
            iconFileContent: info.iconFileContent
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/languages', {
      authRequired: false
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s languages..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const languages = prl.getStorageItem().languageContent || {};
          return RocketChat.API.v1.success({
            languages
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/logs', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s logs..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const {
            offset,
            count
          } = this.getPaginationItems();
          const {
            sort,
            fields,
            query
          } = this.parseJsonQuery();
          const ourQuery = Object.assign({}, query, {
            appId: prl.getID()
          });
          const options = {
            sort: sort ? sort : {
              _updatedAt: -1
            },
            skip: offset,
            limit: count,
            fields
          };
          const logs = Promise.await(orchestrator.getLogStorage().find(ourQuery, options));
          return RocketChat.API.v1.success({
            logs
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/settings', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s settings..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const settings = Object.assign({}, prl.getStorageItem().settings);
          Object.keys(settings).forEach(k => {
            if (settings[k].hidden) {
              delete settings[k];
            }
          });
          return RocketChat.API.v1.success({
            settings
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log(`Updating ${this.urlParams.id}'s settings..`);

        if (!this.bodyParams || !this.bodyParams.settings) {
          return RocketChat.API.v1.failure('The settings to update must be present.');
        }

        const prl = manager.getOneById(this.urlParams.id);

        if (!prl) {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }

        const settings = prl.getStorageItem().settings;
        const updated = [];
        this.bodyParams.settings.forEach(s => {
          if (settings[s.id]) {
            Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, s)); // Updating?

            updated.push(s);
          }
        });
        return RocketChat.API.v1.success({
          updated
        });
      }

    });
    this.api.addRoute(':id/settings/:settingId', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        try {
          const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);
          RocketChat.API.v1.success({
            setting
          });
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      },

      post() {
        console.log(`Updating the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        if (!this.bodyParams.setting) {
          return RocketChat.API.v1.failure('Setting to update to must be present on the posted body.');
        }

        try {
          Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting));
          return RocketChat.API.v1.success();
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      }

    });
    this.api.addRoute(':id/status', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s status..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          return RocketChat.API.v1.success({
            status: prl.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
          return RocketChat.API.v1.failure('Invalid status provided, it must be "status" field and a string.');
        }

        console.log(`Updating ${this.urlParams.id}'s status...`, this.bodyParams.status);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));
          return RocketChat.API.v1.success({
            status: result.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"websockets.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/websockets.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEvents: () => AppEvents,
  AppServerListener: () => AppServerListener,
  AppServerNotifier: () => AppServerNotifier
});
let AppStatus, AppStatusUtils;
module.watch(require("@rocket.chat/apps-ts-definition/AppStatus"), {
  AppStatus(v) {
    AppStatus = v;
  },

  AppStatusUtils(v) {
    AppStatusUtils = v;
  }

}, 0);
const AppEvents = Object.freeze({
  APP_ADDED: 'app/added',
  APP_REMOVED: 'app/removed',
  APP_UPDATED: 'app/updated',
  APP_STATUS_CHANGE: 'app/statusUpdate',
  APP_SETTING_UPDATED: 'app/settingUpdated',
  COMMAND_ADDED: 'command/added',
  COMMAND_DISABLED: 'command/disabled',
  COMMAND_UPDATED: 'command/updated',
  COMMAND_REMOVED: 'command/removed'
});

class AppServerListener {
  constructor(orch, engineStreamer, clientStreamer, received) {
    this.orch = orch;
    this.engineStreamer = engineStreamer;
    this.clientStreamer = clientStreamer;
    this.received = received;
    this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
    this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
    this.engineStreamer.on(AppEvents.APP_UPDATED, this.onAppUpdated.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
  }

  onAppAdded(appId) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getManager().loadOne(appId));
      this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
    });
  }

  onAppStatusUpdated({
    appId,
    status
  }) {
    return Promise.asyncApply(() => {
      this.received.set(`${AppEvents.APP_STATUS_CHANGE}_${appId}`, {
        appId,
        status,
        when: new Date()
      });

      if (AppStatusUtils.isEnabled(status)) {
        Promise.await(this.orch.getManager().enable(appId));
        this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
          appId,
          status
        });
      } else if (AppStatusUtils.isDisabled(status)) {
        Promise.await(this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status));
        this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
          appId,
          status
        });
      }
    });
  }

  onAppSettingUpdated({
    appId,
    setting
  }) {
    return Promise.asyncApply(() => {
      this.received.set(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`, {
        appId,
        setting,
        when: new Date()
      });
      Promise.await(this.orch.getManager().getSettingsManager().updateAppSetting(appId, setting));
      this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId
      });
    });
  }

  onAppUpdated(appId) {
    return Promise.asyncApply(() => {
      this.received.set(`${AppEvents.APP_UPDATED}_${appId}`, {
        appId,
        when: new Date()
      });
      const storageItem = Promise.await(this.orch.getStorage().retrieveOne(appId));
      Promise.await(this.orch.getManager().update(storageItem.zip));
      this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
    });
  }

  onAppRemoved(appId) {
    return Promise.asyncApply(() => {
      Promise.await(this.orch.getManager().remove(appId));
      this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
    });
  }

  onCommandAdded(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
    });
  }

  onCommandDisabled(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    });
  }

  onCommandUpdated(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    });
  }

  onCommandRemoved(command) {
    return Promise.asyncApply(() => {
      this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    });
  }

}

class AppServerNotifier {
  constructor(orch) {
    this.engineStreamer = new Meteor.Streamer('apps-engine', {
      retransmit: false
    });
    this.engineStreamer.serverOnly = true;
    this.engineStreamer.allowRead('none');
    this.engineStreamer.allowEmit('all');
    this.engineStreamer.allowWrite('none'); // This is used to broadcast to the web clients

    this.clientStreamer = new Meteor.Streamer('apps', {
      retransmit: false
    });
    this.clientStreamer.serverOnly = true;
    this.clientStreamer.allowRead('all');
    this.clientStreamer.allowEmit('all');
    this.clientStreamer.allowWrite('none');
    this.received = new Map();
    this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.received);
  }

  appAdded(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_ADDED, appId);
      this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
    });
  }

  appRemoved(appId) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.APP_REMOVED, appId);
      this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
    });
  }

  appUpdated(appId) {
    return Promise.asyncApply(() => {
      if (this.received.has(`${AppEvents.APP_UPDATED}_${appId}`)) {
        this.received.delete(`${AppEvents.APP_UPDATED}_${appId}`);
        return;
      }

      this.engineStreamer.emit(AppEvents.APP_UPDATED, appId);
      this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
    });
  }

  appStatusUpdated(appId, status) {
    return Promise.asyncApply(() => {
      if (this.received.has(`${AppEvents.APP_STATUS_CHANGE}_${appId}`)) {
        const details = this.received.get(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);

        if (details.status === status) {
          this.received.delete(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);
          return;
        }
      }

      this.engineStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      });
      this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      });
    });
  }

  appSettingsChange(appId, setting) {
    return Promise.asyncApply(() => {
      if (this.received.has(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`)) {
        this.received.delete(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`);
        return;
      }

      this.engineStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId,
        setting
      });
      this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
        appId
      });
    });
  }

  commandAdded(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_ADDED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
    });
  }

  commandDisabled(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_DISABLED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    });
  }

  commandUpdated(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_UPDATED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    });
  }

  commandRemoved(command) {
    return Promise.asyncApply(() => {
      this.engineStreamer.emit(AppEvents.COMMAND_REMOVED, command);
      this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/index.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods,
  AppsRestApi: () => AppsRestApi,
  AppEvents: () => AppEvents,
  AppServerNotifier: () => AppServerNotifier,
  AppServerListener: () => AppServerListener
});
let AppMethods;
module.watch(require("./methods"), {
  AppMethods(v) {
    AppMethods = v;
  }

}, 0);
let AppsRestApi;
module.watch(require("./rest"), {
  AppsRestApi(v) {
    AppsRestApi = v;
  }

}, 1);
let AppEvents, AppServerNotifier, AppServerListener;
module.watch(require("./websockets"), {
  AppEvents(v) {
    AppEvents = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  },

  AppServerListener(v) {
    AppServerListener = v;
  }

}, 2);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"converters":{"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/messages.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter
});

class AppMessagesConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(msgId) {
    const msg = RocketChat.models.Messages.getOneById(msgId);
    return this.convertMessage(msg);
  }

  convertMessage(msgObj) {
    if (!msgObj) {
      return undefined;
    }

    const room = this.orch.getConverters().get('rooms').convertById(msgObj.rid);
    let sender;

    if (msgObj.u && msgObj.u._id) {
      sender = this.orch.getConverters().get('users').convertById(msgObj.u._id);

      if (!sender) {
        sender = this.orch.getConverters().get('users').convertToApp(msgObj.u);
      }
    }

    let editor;

    if (msgObj.editedBy) {
      editor = this.orch.getConverters().get('users').convertById(msgObj.editedBy._id);
    }

    const attachments = this._convertAttachmentsToApp(msgObj.attachments);

    return {
      id: msgObj._id,
      room,
      sender,
      text: msgObj.msg,
      createdAt: msgObj.ts,
      updatedAt: msgObj._updatedAt,
      editor,
      editedAt: msgObj.editedAt,
      emoji: msgObj.emoji,
      avatarUrl: msgObj.avatar,
      alias: msgObj.alias,
      customFields: msgObj.customFields,
      attachments
    };
  }

  convertAppMessage(message) {
    if (!message) {
      return undefined;
    }

    const room = RocketChat.models.Rooms.findOneById(message.room.id);

    if (!room) {
      throw new Error('Invalid room provided on the message.');
    }

    let u;

    if (message.sender && message.sender.id) {
      const user = RocketChat.models.Users.findOneById(message.sender.id);

      if (user) {
        u = {
          _id: user._id,
          username: user.username,
          name: user.name
        };
      } else {
        u = {
          _id: message.sender.id,
          username: message.sender.username,
          name: message.sender.name
        };
      }
    }

    let editedBy;

    if (message.editor) {
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      editedBy = {
        _id: editor._id,
        username: editor.username
      };
    }

    const attachments = this._convertAppAttachments(message.attachments);

    return {
      _id: message.id || Random.id(),
      rid: room._id,
      u,
      msg: message.text,
      ts: message.createdAt || new Date(),
      _updatedAt: message.updatedAt || new Date(),
      editedBy,
      editedAt: message.editedAt,
      emoji: message.emoji,
      avatar: message.avatarUrl,
      alias: message.alias,
      customFields: message.customFields,
      attachments
    };
  }

  _convertAppAttachments(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        ts: attachment.timestamp,
        message_link: attachment.timestampLink,
        thumb_url: attachment.thumbnailUrl,
        author_name: attachment.author ? attachment.author.name : undefined,
        author_link: attachment.author ? attachment.author.link : undefined,
        author_icon: attachment.author ? attachment.author.icon : undefined,
        title: attachment.title ? attachment.title.value : undefined,
        title_link: attachment.title ? attachment.title.link : undefined,
        title_link_download: attachment.title ? attachment.title.displayDownloadLink : undefined,
        image_url: attachment.imageUrl,
        audio_url: attachment.audioUrl,
        video_url: attachment.videoUrl,
        fields: attachment.fields,
        type: attachment.type,
        description: attachment.description
      };
    }).map(a => {
      Object.keys(a).forEach(k => {
        if (typeof a[k] === 'undefined') {
          delete a[k];
        }
      });
      return a;
    });
  }

  _convertAttachmentsToApp(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      let author;

      if (attachment.author_name || attachment.author_link || attachment.author_icon) {
        author = {
          name: attachment.author_name,
          link: attachment.author_link,
          icon: attachment.author_icon
        };
      }

      let title;

      if (attachment.title || attachment.title_link || attachment.title_link_download) {
        title = {
          value: attachment.title,
          link: attachment.title_link,
          displayDownloadLink: attachment.title_link_download
        };
      }

      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        timestamp: attachment.ts,
        timestampLink: attachment.message_link,
        thumbnailUrl: attachment.thumb_url,
        author,
        title,
        imageUrl: attachment.image_url,
        audioUrl: attachment.audio_url,
        videoUrl: attachment.video_url,
        fields: attachment.fields,
        type: attachment.type,
        description: attachment.description
      };
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/rooms.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomsConverter: () => AppRoomsConverter
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(roomId) {
    const room = RocketChat.models.Rooms.findOneById(roomId);
    return this.convertRoom(room);
  }

  convertByName(roomName) {
    const room = RocketChat.models.Rooms.findOneByName(roomName);
    return this.convertRoom(room);
  }

  convertAppRoom(room) {
    if (!room) {
      return undefined;
    }

    let u;

    if (room.creator) {
      const creator = RocketChat.models.Users.findOneById(room.creator.id);
      u = {
        _id: creator._id,
        username: creator.username
      };
    }

    return {
      _id: room.id,
      fname: room.displayName,
      name: room.slugifiedName,
      t: room.type,
      u,
      members: room.members,
      default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
      ro: typeof room.isReadOnly === 'undefined' ? false : room.isReadOnly,
      sysMes: typeof room.displaySystemMessages === 'undefined' ? true : room.displaySystemMessages,
      msgs: room.messageCount || 0,
      ts: room.createdAt,
      _updatedAt: room.updatedAt,
      lm: room.lastModifiedAt
    };
  }

  convertRoom(room) {
    if (!room) {
      return undefined;
    }

    let creator;

    if (room.u) {
      creator = this.orch.getConverters().get('users').convertById(room.u._id);
    }

    return {
      id: room._id,
      displayName: room.fname,
      slugifiedName: room.name,
      type: this._convertTypeToApp(room.t),
      creator,
      members: room.members,
      isDefault: typeof room.default === 'undefined' ? false : room.default,
      isReadOnly: typeof room.ro === 'undefined' ? false : room.ro,
      displaySystemMessages: typeof room.sysMes === 'undefined' ? true : room.sysMes,
      messageCount: room.msgs,
      createdAt: room.ts,
      updatedAt: room._updatedAt,
      lastModifiedAt: room.lm,
      customFields: {}
    };
  }

  _convertTypeToApp(typeChar) {
    switch (typeChar) {
      case 'c':
        return RoomType.CHANNEL;

      case 'p':
        return RoomType.PRIVATE_GROUP;

      case 'd':
        return RoomType.DIRECT_MESSAGE;

      case 'lc':
        return RoomType.LIVE_CHAT;

      default:
        return typeChar;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/settings.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingsConverter: () => AppSettingsConverter
});
let SettingType;
module.watch(require("@rocket.chat/apps-ts-definition/settings"), {
  SettingType(v) {
    SettingType = v;
  }

}, 0);

class AppSettingsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(settingId) {
    const setting = RocketChat.models.Settings.findOneById(settingId);
    return this.convertToApp(setting);
  }

  convertToApp(setting) {
    return {
      id: setting._id,
      type: this._convertTypeToApp(setting.type),
      packageValue: setting.packageValue,
      values: setting.values,
      value: setting.value,
      public: setting.public,
      hidden: setting.hidden,
      group: setting.group,
      i18nLabel: setting.i18nLabel,
      i18nDescription: setting.i18nDescription,
      createdAt: setting.ts,
      updatedAt: setting._updatedAt
    };
  }

  _convertTypeToApp(type) {
    switch (type) {
      case 'boolean':
        return SettingType.BOOLEAN;

      case 'code':
        return SettingType.CODE;

      case 'color':
        return SettingType.COLOR;

      case 'font':
        return SettingType.FONT;

      case 'int':
        return SettingType.NUMBER;

      case 'select':
        return SettingType.SELECT;

      case 'string':
        return SettingType.STRING;

      default:
        return type;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/users.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUsersConverter: () => AppUsersConverter
});
let UserStatusConnection, UserType;
module.watch(require("@rocket.chat/apps-ts-definition/users"), {
  UserStatusConnection(v) {
    UserStatusConnection = v;
  },

  UserType(v) {
    UserType = v;
  }

}, 0);

class AppUsersConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(userId) {
    const user = RocketChat.models.Users.findOneById(userId);
    return this.convertToApp(user);
  }

  convertByUsername(username) {
    const user = RocketChat.models.Users.findOneByUsername(username);
    return this.convertToApp(user);
  }

  convertToApp(user) {
    if (!user) {
      return undefined;
    }

    const type = this._convertUserTypeToEnum(user.type);

    const statusConnection = this._convertStatusConnectionToEnum(user.username, user._id, user.statusConnection);

    return {
      id: user._id,
      username: user.username,
      emails: user.emails,
      type,
      isEnabled: user.active,
      name: user.name,
      roles: user.roles,
      status: user.status,
      statusConnection,
      utcOffset: user.utcOffset,
      createdAt: user.createdAt,
      updatedAt: user._updatedAt,
      lastLoginAt: user.lastLogin
    };
  }

  _convertUserTypeToEnum(type) {
    switch (type) {
      case 'user':
        return UserType.USER;

      case 'bot':
        return UserType.BOT;

      case '':
      case undefined:
        return UserType.UNKNOWN;

      default:
        console.warn(`A new user type has been added that the Apps don't know about? "${type}"`);
        return type.toUpperCase();
    }
  }

  _convertStatusConnectionToEnum(username, userId, status) {
    switch (status) {
      case 'offline':
        return UserStatusConnection.OFFLINE;

      case 'online':
        return UserStatusConnection.ONLINE;

      case 'away':
        return UserStatusConnection.AWAY;

      case 'busy':
        return UserStatusConnection.BUSY;

      case undefined:
        // This is needed for Livechat guests and Rocket.Cat user.
        return UserStatusConnection.UNDEFINED;

      default:
        console.warn(`The user ${username} (${userId}) does not have a valid status (offline, online, away, or busy). It is currently: "${status}"`);
        return !status ? UserStatusConnection.OFFLINE : status.toUpperCase();
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/index.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter,
  AppRoomsConverter: () => AppRoomsConverter,
  AppSettingsConverter: () => AppSettingsConverter,
  AppUsersConverter: () => AppUsersConverter
});
let AppMessagesConverter;
module.watch(require("./messages"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  }

}, 0);
let AppRoomsConverter;
module.watch(require("./rooms"), {
  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  }

}, 1);
let AppSettingsConverter;
module.watch(require("./settings"), {
  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  }

}, 2);
let AppUsersConverter;
module.watch(require("./users"), {
  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 3);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"orchestrator.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/orchestrator.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppMethods, AppsRestApi, AppServerNotifier;
module.watch(require("./communication"), {
  AppMethods(v) {
    AppMethods = v;
  },

  AppsRestApi(v) {
    AppsRestApi = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  }

}, 1);
let AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter;
module.watch(require("./converters"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  },

  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  },

  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  },

  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 2);
let AppsLogsModel, AppsModel, AppsPersistenceModel, AppRealStorage, AppRealLogsStorage;
module.watch(require("./storage"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  },

  AppsModel(v) {
    AppsModel = v;
  },

  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  },

  AppRealStorage(v) {
    AppRealStorage = v;
  },

  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppManager;
module.watch(require("@rocket.chat/apps-engine/server/AppManager"), {
  AppManager(v) {
    AppManager = v;
  }

}, 4);

class AppServerOrchestrator {
  constructor() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      RocketChat.models.Permissions.createOrUpdate('manage-apps', ['admin']);
    }

    this._model = new AppsModel();
    this._logModel = new AppsLogsModel();
    this._persistModel = new AppsPersistenceModel();
    this._storage = new AppRealStorage(this._model);
    this._logStorage = new AppRealLogsStorage(this._logModel);
    this._converters = new Map();

    this._converters.set('messages', new AppMessagesConverter(this));

    this._converters.set('rooms', new AppRoomsConverter(this));

    this._converters.set('settings', new AppSettingsConverter(this));

    this._converters.set('users', new AppUsersConverter(this));

    this._bridges = new RealAppBridges(this);
    this._manager = new AppManager(this._storage, this._logStorage, this._bridges);
    this._communicators = new Map();

    this._communicators.set('methods', new AppMethods(this));

    this._communicators.set('notifier', new AppServerNotifier(this));

    this._communicators.set('restapi', new AppsRestApi(this, this._manager));
  }

  getModel() {
    return this._model;
  }

  getPersistenceModel() {
    return this._persistModel;
  }

  getStorage() {
    return this._storage;
  }

  getLogStorage() {
    return this._logStorage;
  }

  getConverters() {
    return this._converters;
  }

  getBridges() {
    return this._bridges;
  }

  getNotifier() {
    return this._communicators.get('notifier');
  }

  getManager() {
    return this._manager;
  }

  isEnabled() {
    return RocketChat.settings.get('Apps_Framework_enabled');
  }

  isLoaded() {
    return this.getManager().areAppsLoaded();
  }

  load() {
    // Don't try to load it again if it has
    // already been loaded
    if (this.isLoaded()) {
      return;
    }

    this._manager.load().then(affs => console.log(`Loaded the Apps Framework and loaded a total of ${affs.length} Apps!`)).catch(err => console.warn('Failed to load the Apps Framework and Apps!', err));
  }

  unload() {
    // Don't try to unload it if it's already been
    // unlaoded or wasn't unloaded to start with
    if (!this.isLoaded()) {
      return;
    }

    this._manager.unload().then(() => console.log('Unloaded the Apps Framework.')).catch(err => console.warn('Failed to unload the Apps Framework!', err));
  }

}

RocketChat.settings.add('Apps_Framework_enabled', false, {
  type: 'boolean',
  hidden: true
});
RocketChat.settings.get('Apps_Framework_enabled', (key, isEnabled) => {
  // In case this gets called before `Meteor.startup`
  if (!global.Apps) {
    return;
  }

  if (isEnabled) {
    global.Apps.load();
  } else {
    global.Apps.unload();
  }
});
Meteor.startup(function _appServerOrchestrator() {
  global.Apps = new AppServerOrchestrator();

  if (global.Apps.isEnabled()) {
    global.Apps.load();
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"@rocket.chat":{"apps-engine":{"server":{"storage":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/storage/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppLogStorage_1 = require("./AppLogStorage");
exports.AppLogStorage = AppLogStorage_1.AppLogStorage;
const AppStorage_1 = require("./AppStorage");
exports.AppStorage = AppStorage_1.AppStorage;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"logging":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/logging/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppConsole_1 = require("./AppConsole");
exports.AppConsole = AppConsole_1.AppConsole;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/bridges/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppBridges_1 = require("./AppBridges");
exports.AppBridges = AppBridges_1.AppBridges;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppManager.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/AppManager.js                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bridges_1 = require("./bridges");
const compiler_1 = require("./compiler");
const managers_1 = require("./managers");
const DisabledApp_1 = require("./misc/DisabledApp");
const ProxiedApp_1 = require("./ProxiedApp");
const storage_1 = require("./storage");
const AppStatus_1 = require("@rocket.chat/apps-ts-definition/AppStatus");
const metadata_1 = require("@rocket.chat/apps-ts-definition/metadata");
class AppManager {
    constructor(rlStorage, logStorage, rlBridges) {
        // Singleton style. There can only ever be one AppManager instance
        if (typeof AppManager.Instance !== 'undefined') {
            throw new Error('There is already a valid AppManager instance.');
        }
        if (rlStorage instanceof storage_1.AppStorage) {
            this.storage = rlStorage;
        }
        else {
            throw new Error('Invalid instance of the AppStorage.');
        }
        if (logStorage instanceof storage_1.AppLogStorage) {
            this.logStorage = logStorage;
        }
        else {
            throw new Error('Invalid instance of the AppLogStorage.');
        }
        if (rlBridges instanceof bridges_1.AppBridges) {
            this.bridges = rlBridges;
        }
        else {
            throw new Error('Invalid instance of the AppBridges');
        }
        this.apps = new Map();
        this.parser = new compiler_1.AppPackageParser();
        this.compiler = new compiler_1.AppCompiler();
        this.accessorManager = new managers_1.AppAccessorManager(this);
        this.listenerManager = new managers_1.AppListenerManger(this);
        this.commandManager = new managers_1.AppSlashCommandManager(this);
        this.settingsManager = new managers_1.AppSettingsManager(this);
        this.isLoaded = false;
        AppManager.Instance = this;
    }
    /** Gets the instance of the storage connector. */
    getStorage() {
        return this.storage;
    }
    /** Gets the instance of the log storage connector. */
    getLogStorage() {
        return this.logStorage;
    }
    /** Gets the instance of the App package parser. */
    getParser() {
        return this.parser;
    }
    /** Gets the compiler instance. */
    getCompiler() {
        return this.compiler;
    }
    /** Gets the accessor manager instance. */
    getAccessorManager() {
        return this.accessorManager;
    }
    /** Gets the instance of the Bridge manager. */
    getBridges() {
        return this.bridges;
    }
    /** Gets the instance of the listener manager. */
    getListenerManager() {
        return this.listenerManager;
    }
    /** Gets the command manager's instance. */
    getCommandManager() {
        return this.commandManager;
    }
    /** Gets the manager of the settings, updates and getting. */
    getSettingsManager() {
        return this.settingsManager;
    }
    /** Gets whether the Apps have been loaded or not. */
    areAppsLoaded() {
        return this.isLoaded;
    }
    /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            // You can not load the AppManager system again
            // if it has already been loaded.
            if (this.isLoaded) {
                return;
            }
            const items = yield this.storage.retrieveAll();
            const affs = new Array();
            for (const item of items.values()) {
                const aff = new compiler_1.AppFabricationFulfillment();
                try {
                    const result = yield this.getParser().parseZip(this.getCompiler(), item.zip);
                    aff.setAppInfo(result.info);
                    aff.setImplementedInterfaces(result.implemented.getValues());
                    aff.setCompilerErrors(result.compilerErrors);
                    if (result.compilerErrors.length > 0) {
                        throw new Error(`Failed to compile due to ${result.compilerErrors.length} errors.`);
                    }
                    item.compiled = result.compiledFiles;
                    const app = this.getCompiler().toSandBox(this, item);
                    this.apps.set(item.id, app);
                    aff.setApp(app);
                }
                catch (e) {
                    console.warn(`Error while compiling the App "${item.info.name} (${item.id})":`);
                    console.error(e);
                    const app = DisabledApp_1.DisabledApp.createNew(item.info, AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED);
                    app.getLogger().error(e);
                    this.logStorage.storeEntries(app.getID(), app.getLogger());
                    const prl = new ProxiedApp_1.ProxiedApp(this, item, app, () => '');
                    this.apps.set(item.id, prl);
                    aff.setApp(prl);
                }
                affs.push(aff);
            }
            // Let's initialize them
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    // Usually if an App is disabled before it's initialized,
                    // then something (such as an error) occured while
                    // it was compiled or something similar.
                    continue;
                }
                yield this.initializeApp(items.get(rl.getID()), rl, true);
            }
            // Let's ensure the required settings are all set
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    continue;
                }
                if (!this.areRequiredSettingsSet(rl.getStorageItem())) {
                    yield rl.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED);
                }
            }
            // Now let's enable the apps which were once enabled
            // but are not currently disabled.
            for (const rl of this.apps.values()) {
                if (!AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus()) && AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                    yield this.enableApp(items.get(rl.getID()), rl, true, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
                }
            }
            this.isLoaded = true;
            return affs;
        });
    }
    unload(isManual) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the AppManager hasn't been loaded yet, then
            // there is nothing to unload
            if (!this.isLoaded) {
                return;
            }
            for (const rl of this.apps.values()) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    continue;
                }
                else if (rl.getStatus() === AppStatus_1.AppStatus.INITIALIZED) {
                    this.listenerManager.unregisterListeners(rl);
                    this.commandManager.unregisterCommands(rl.getID());
                    this.accessorManager.purifyApp(rl.getID());
                    continue;
                }
                yield this.disable(rl.getID(), isManual);
            }
            // Remove all the apps from the system now that we have unloaded everything
            this.apps.clear();
            this.isLoaded = false;
        });
    }
    /** Gets the Apps which match the filter passed in. */
    get(filter) {
        let rls = new Array();
        if (typeof filter === 'undefined') {
            this.apps.forEach((rl) => rls.push(rl));
            return rls;
        }
        let nothing = true;
        if (typeof filter.enabled === 'boolean' && filter.enabled) {
            this.apps.forEach((rl) => {
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (typeof filter.disabled === 'boolean' && filter.disabled) {
            this.apps.forEach((rl) => {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (nothing) {
            this.apps.forEach((rl) => rls.push(rl));
        }
        if (typeof filter.ids !== 'undefined') {
            rls = rls.filter((rl) => filter.ids.includes(rl.getID()));
        }
        if (typeof filter.name === 'string') {
            rls = rls.filter((rl) => rl.getName() === filter.name);
        }
        else if (filter.name instanceof RegExp) {
            rls = rls.filter((rl) => filter.name.test(rl.getName()));
        }
        return rls;
    }
    /** Gets a single App by the id passed in. */
    getOneById(appId) {
        return this.apps.get(appId);
    }
    enable(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                throw new Error('The App is already enabled.');
            }
            if (rl.getStatus() === AppStatus_1.AppStatus.COMPILER_ERROR_DISABLED) {
                throw new Error('The App had compiler errors, can not enable it.');
            }
            const storageItem = yield this.storage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not enable an App with the id of "${id}" as it doesn't exist.`);
            }
            const isSetup = yield this.runStartUpProcess(storageItem, rl, true, false);
            if (isSetup) {
                storageItem.status = rl.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                this.storage.update(storageItem);
            }
            return isSetup;
        });
    }
    disable(id, isManual = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const rl = this.apps.get(id);
            if (!rl) {
                throw new Error(`No App by the id "${id}" exists.`);
            }
            if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                throw new Error(`No App by the id of "${id}" is enabled."`);
            }
            const storageItem = yield this.storage.retrieveOne(id);
            if (!storageItem) {
                throw new Error(`Could not disable an App with the id of "${id}" as it doesn't exist.`);
            }
            try {
                yield rl.call(metadata_1.AppMethod.ONDISABLE, this.accessorManager.getConfigurationModify(storageItem.id));
            }
            catch (e) {
                console.warn('Error while disabling:', e);
            }
            this.listenerManager.unregisterListeners(rl);
            this.commandManager.unregisterCommands(storageItem.id);
            this.accessorManager.purifyApp(storageItem.id);
            if (isManual) {
                yield rl.setStatus(AppStatus_1.AppStatus.MANUALLY_DISABLED);
            }
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            storageItem.status = rl.getStatus();
            this.storage.update(storageItem);
            return true;
        });
    }
    add(zipContentsBase64d, enable = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().parseZip(this.getCompiler(), zipContentsBase64d);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            aff.setCompilerErrors(result.compilerErrors);
            if (result.compilerErrors.length > 0) {
                return aff;
            }
            const created = yield this.storage.create({
                id: result.info.id,
                info: result.info,
                status: AppStatus_1.AppStatus.UNKNOWN,
                zip: zipContentsBase64d,
                compiled: result.compiledFiles,
                languageContent: result.languageContent,
                settings: {},
                implemented: result.implemented.getValues(),
            });
            if (!created) {
                throw new Error('Failed to create the App, the storage did not return it.');
            }
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = this.getCompiler().toSandBox(this, created);
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Let everyone know that the App has been added
            try {
                yield this.bridges.getAppActivationBridge().appAdded(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            // Should enable === true, then we go through the entire start up process
            // Otherwise, we only initialize it.
            if (enable) {
                // Start up the app
                yield this.runStartUpProcess(created, app, false, false);
            }
            else {
                yield this.initializeApp(created, app, true);
            }
            return aff;
        });
    }
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this.apps.get(id);
            if (AppStatus_1.AppStatusUtils.isEnabled(app.getStatus())) {
                yield this.disable(id);
            }
            this.listenerManager.unregisterListeners(app);
            this.commandManager.unregisterCommands(app.getID());
            this.accessorManager.purifyApp(app.getID());
            yield this.bridges.getPersistenceBridge().purge(app.getID());
            yield this.logStorage.removeEntriesFor(app.getID());
            yield this.storage.remove(app.getID());
            // Let everyone know that the App has been removed
            try {
                yield this.bridges.getAppActivationBridge().appRemoved(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            this.apps.delete(app.getID());
            return app;
        });
    }
    update(zipContentsBase64d) {
        return __awaiter(this, void 0, void 0, function* () {
            const aff = new compiler_1.AppFabricationFulfillment();
            const result = yield this.getParser().parseZip(this.getCompiler(), zipContentsBase64d);
            aff.setAppInfo(result.info);
            aff.setImplementedInterfaces(result.implemented.getValues());
            aff.setCompilerErrors(result.compilerErrors);
            if (result.compilerErrors.length > 0) {
                return aff;
            }
            const old = yield this.storage.retrieveOne(result.info.id);
            if (!old) {
                throw new Error('Can not update an App that does not currently exist.');
            }
            // Attempt to disable it, if it wasn't enabled then it will error and we don't care
            try {
                yield this.disable(old.id);
            }
            catch (e) {
                // We don't care
            }
            // TODO: We could show what new interfaces have been added
            const stored = yield this.storage.update({
                createdAt: old.createdAt,
                id: result.info.id,
                info: result.info,
                status: this.apps.get(old.id).getStatus(),
                zip: zipContentsBase64d,
                compiled: result.compiledFiles,
                languageContent: result.languageContent,
                settings: old.settings,
                implemented: result.implemented.getValues(),
            });
            // Now that is has all been compiled, let's get the
            // the App instance from the source.
            const app = this.getCompiler().toSandBox(this, stored);
            // Store it temporarily so we can access it else where
            this.apps.set(app.getID(), app);
            aff.setApp(app);
            // Start up the app
            yield this.runStartUpProcess(stored, app, false, true);
            // Let everyone know that the App has been updated
            try {
                yield this.bridges.getAppActivationBridge().appUpdated(app);
            }
            catch (e) {
                // If an error occurs during this, oh well.
            }
            return aff;
        });
    }
    getLanguageContent() {
        const langs = {};
        this.apps.forEach((rl) => {
            const content = rl.getStorageItem().languageContent;
            Object.keys(content).forEach((key) => {
                langs[key] = Object.assign(langs[key] || {}, content[key]);
            });
        });
        return langs;
    }
    changeStatus(appId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (status) {
                case AppStatus_1.AppStatus.MANUALLY_DISABLED:
                case AppStatus_1.AppStatus.MANUALLY_ENABLED:
                    break;
                default:
                    throw new Error('Invalid status to change an App to, must be manually disabled or enabled.');
            }
            const rl = this.apps.get(appId);
            if (!rl) {
                throw new Error('Can not change the status of an App which does not currently exist.');
            }
            if (AppStatus_1.AppStatusUtils.isEnabled(status)) {
                // Then enable it
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    throw new Error('Can not enable an App which is already enabled.');
                }
                yield this.enable(rl.getID());
            }
            else {
                if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    throw new Error('Can not disable an App which is not enabled.');
                }
                yield this.disable(rl.getID(), true);
            }
            return rl;
        });
    }
    /**
     * Goes through the entire loading up process. WARNING: Do not use. ;)
     *
     * @param appId the id of the application to load
     */
    loadOne(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.storage.retrieveOne(appId);
            if (!item) {
                throw new Error(`No App found by the id of: "${appId}"`);
            }
            this.apps.set(item.id, this.getCompiler().toSandBox(this, item));
            const rl = this.apps.get(item.id);
            yield this.initializeApp(item, rl, false);
            if (!this.areRequiredSettingsSet(item)) {
                yield rl.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED);
            }
            if (!AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus()) && AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                yield this.enableApp(item, rl, false, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
            }
            return this.apps.get(item.id);
        });
    }
    runStartUpProcess(storageItem, app, isManual, silenceStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            if (app.getStatus() !== AppStatus_1.AppStatus.INITIALIZED) {
                const isInitialized = yield this.initializeApp(storageItem, app, true, silenceStatus);
                if (!isInitialized) {
                    return false;
                }
            }
            if (!this.areRequiredSettingsSet(storageItem)) {
                yield app.setStatus(AppStatus_1.AppStatus.INVALID_SETTINGS_DISABLED, silenceStatus);
                return false;
            }
            const isEnabled = yield this.enableApp(storageItem, app, true, isManual, silenceStatus);
            if (!isEnabled) {
                return false;
            }
            return true;
        });
    }
    initializeApp(storageItem, app, saveToDb = true, silenceStatus = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            const configExtend = this.getAccessorManager().getConfigurationExtend(storageItem.id);
            const envRead = this.getAccessorManager().getEnvironmentRead(storageItem.id);
            try {
                yield app.call(metadata_1.AppMethod.INITIALIZE, configExtend, envRead);
                result = true;
                yield app.setStatus(AppStatus_1.AppStatus.INITIALIZED, silenceStatus);
            }
            catch (e) {
                if (e.name === 'NotEnoughMethodArgumentsError') {
                    console.warn('Please report the following error:');
                }
                console.error(e);
                this.commandManager.unregisterCommands(storageItem.id);
                result = false;
                yield app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED, silenceStatus);
            }
            if (saveToDb) {
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                storageItem.status = app.getStatus();
                this.storage.update(storageItem);
            }
            return result;
        });
    }
    /**
     * Determines if the App's required settings are set or not.
     * Should a packageValue be provided and not empty, then it's considered set.
     */
    areRequiredSettingsSet(storageItem) {
        let result = true;
        for (const setk of Object.keys(storageItem.settings)) {
            const sett = storageItem.settings[setk];
            // If it's not required, ignore
            if (!sett.required) {
                continue;
            }
            if (sett.value !== 'undefined' || sett.packageValue !== 'undefined') {
                continue;
            }
            result = false;
        }
        return result;
    }
    enableApp(storageItem, app, saveToDb = true, isManual, silenceStatus = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let enable;
            try {
                enable = (yield app.call(metadata_1.AppMethod.ONENABLE, this.getAccessorManager().getEnvironmentRead(storageItem.id), this.getAccessorManager().getConfigurationModify(storageItem.id)));
                yield app.setStatus(isManual ? AppStatus_1.AppStatus.MANUALLY_ENABLED : AppStatus_1.AppStatus.AUTO_ENABLED, silenceStatus);
            }
            catch (e) {
                enable = false;
                if (e.name === 'NotEnoughMethodArgumentsError') {
                    console.warn('Please report the following error:');
                }
                console.error(e);
                yield app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED, silenceStatus);
            }
            if (enable) {
                this.commandManager.registerCommands(app.getID());
                this.listenerManager.registerListeners(app);
            }
            else {
                this.commandManager.unregisterCommands(app.getID());
            }
            if (saveToDb) {
                storageItem.status = app.getStatus();
                // This is async, but we don't care since it only updates in the database
                // and it should not mutate any properties we care about
                this.storage.update(storageItem);
            }
            return enable;
        });
    }
}
exports.AppManager = AppManager;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"apps-ts-definition":{"slashcommands":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/slashcommands/index.js            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ISlashCommandPreview_1 = require("./ISlashCommandPreview");
exports.SlashCommandPreviewItemType = ISlashCommandPreview_1.SlashCommandPreviewItemType;
const SlashCommandContext_1 = require("./SlashCommandContext");
exports.SlashCommandContext = SlashCommandContext_1.SlashCommandContext;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"rooms":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/rooms/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RoomType_1 = require("./RoomType");
exports.RoomType = RoomType_1.RoomType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppStatus.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/AppStatus.js                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppStatus;
(function (AppStatus) {
    /** The status is known, aka not been constructed the proper way. */
    AppStatus["UNKNOWN"] = "unknown";
    /** The App has been constructed but that's it. */
    AppStatus["CONSTRUCTED"] = "constructed";
    /** The App's `initialize()` was called and returned true. */
    AppStatus["INITIALIZED"] = "initialized";
    /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
    AppStatus["AUTO_ENABLED"] = "auto_enabled";
    /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
    AppStatus["MANUALLY_ENABLED"] = "manually_enabled";
    /**
     * The App was disabled due to an error while attempting to compile it.
     * An attempt to enable it again will fail, as it needs to be updated.
     */
    AppStatus["COMPILER_ERROR_DISABLED"] = "compiler_error_disabled";
    /** The App was disabled due to an unrecoverable error being thrown. */
    AppStatus["ERROR_DISABLED"] = "error_disabled";
    /** The App was manually disabled by a user. */
    AppStatus["MANUALLY_DISABLED"] = "manually_disabled";
    AppStatus["INVALID_SETTINGS_DISABLED"] = "invalid_settings_disabled";
    /** The App was disabled due to other circumstances. */
    AppStatus["DISABLED"] = "disabled";
})(AppStatus = exports.AppStatus || (exports.AppStatus = {}));
class AppStatusUtilsDef {
    isEnabled(status) {
        switch (status) {
            case AppStatus.AUTO_ENABLED:
            case AppStatus.MANUALLY_ENABLED:
                return true;
            default:
                return false;
        }
    }
    isDisabled(status) {
        switch (status) {
            case AppStatus.COMPILER_ERROR_DISABLED:
            case AppStatus.ERROR_DISABLED:
            case AppStatus.MANUALLY_DISABLED:
            case AppStatus.INVALID_SETTINGS_DISABLED:
            case AppStatus.DISABLED:
                return true;
            default:
                return false;
        }
    }
}
exports.AppStatusUtilsDef = AppStatusUtilsDef;
exports.AppStatusUtils = new AppStatusUtilsDef();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/settings/index.js                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SettingType_1 = require("./SettingType");
exports.SettingType = SettingType_1.SettingType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/users/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserStatusConnection_1 = require("./UserStatusConnection");
exports.UserStatusConnection = UserStatusConnection_1.UserStatusConnection;
const UserType_1 = require("./UserType");
exports.UserType = UserType_1.UserType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:apps/lib/Apps.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-logs-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-persistence-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/storage.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/index.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/activation.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/bridges.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/commands.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/environmental.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/persistence.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/users.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/index.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/methods.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/rest.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/websockets.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/index.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/users.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/index.js");
require("/node_modules/meteor/rocketchat:apps/server/orchestrator.js");

/* Exports */
Package._define("rocketchat:apps", {
  Apps: Apps
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_apps.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL2xpYi9BcHBzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1sb2dzLW1vZGVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1tb2RlbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9zdG9yYWdlL2FwcHMtcGVyc2lzdGVuY2UtbW9kZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9sb2dzLXN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9hY3RpdmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvYnJpZGdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2NvbW1hbmRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvZW52aXJvbm1lbnRhbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL21lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvcGVyc2lzdGVuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2RldGFpbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9odHRwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvbGlzdGVuZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb21tdW5pY2F0aW9uL3Jlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29tbXVuaWNhdGlvbi93ZWJzb2NrZXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy9tZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL3Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbnZlcnRlcnMvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy91c2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL29yY2hlc3RyYXRvci5qcyJdLCJuYW1lcyI6WyJBcHBzIiwibW9kdWxlIiwiZXhwb3J0IiwiQXBwc0xvZ3NNb2RlbCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwiQXBwc01vZGVsIiwiQXBwc1BlcnNpc3RlbmNlTW9kZWwiLCJBcHBSZWFsU3RvcmFnZSIsIkFwcFN0b3JhZ2UiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiZGF0YSIsImRiIiwiY3JlYXRlIiwiaXRlbSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY3JlYXRlZEF0IiwiRGF0ZSIsInVwZGF0ZWRBdCIsImRvYyIsImZpbmRPbmUiLCIkb3IiLCJpZCIsImluZm8iLCJuYW1lU2x1ZyIsImUiLCJFcnJvciIsImluc2VydCIsIl9pZCIsInJldHJpZXZlT25lIiwicmV0cmlldmVBbGwiLCJkb2NzIiwiZmluZCIsImZldGNoIiwiaXRlbXMiLCJNYXAiLCJmb3JFYWNoIiwiaSIsInNldCIsInVwZGF0ZSIsInRoZW4iLCJ1cGRhdGVkIiwiY2F0Y2giLCJlcnIiLCJyZW1vdmUiLCJzdWNjZXNzIiwiQXBwUmVhbExvZ3NTdG9yYWdlIiwiQXBwQ29uc29sZSIsIkFwcExvZ1N0b3JhZ2UiLCJtb2RlbCIsImFyZ3VtZW50cyIsInN0b3JlRW50cmllcyIsImFwcElkIiwibG9nZ2VyIiwidG9TdG9yYWdlRW50cnkiLCJmaW5kT25lQnlJZCIsImdldEVudHJpZXNGb3IiLCJyZW1vdmVFbnRyaWVzRm9yIiwiQXBwQWN0aXZhdGlvbkJyaWRnZSIsIm9yY2giLCJhcHBBZGRlZCIsImFwcCIsImdldE5vdGlmaWVyIiwiZ2V0SUQiLCJhcHBVcGRhdGVkIiwiYXBwUmVtb3ZlZCIsImFwcFN0YXR1c0NoYW5nZWQiLCJzdGF0dXMiLCJhcHBTdGF0dXNVcGRhdGVkIiwiUmVhbEFwcEJyaWRnZXMiLCJBcHBCcmlkZ2VzIiwiQXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSIsIkFwcENvbW1hbmRzQnJpZGdlIiwiQXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIiwiQXBwSHR0cEJyaWRnZSIsIkFwcExpc3RlbmVyQnJpZGdlIiwiQXBwTWVzc2FnZUJyaWRnZSIsIkFwcFBlcnNpc3RlbmNlQnJpZGdlIiwiQXBwUm9vbUJyaWRnZSIsIkFwcFNldHRpbmdCcmlkZ2UiLCJBcHBVc2VyQnJpZGdlIiwiX2FjdEJyaWRnZSIsIl9jbWRCcmlkZ2UiLCJfZGV0QnJpZGdlIiwiX2VudkJyaWRnZSIsIl9odHRwQnJpZGdlIiwiX2xpc25CcmlkZ2UiLCJfbXNnQnJpZGdlIiwiX3BlcnNpc3RCcmlkZ2UiLCJfcm9vbUJyaWRnZSIsIl9zZXRzQnJpZGdlIiwiX3VzZXJCcmlkZ2UiLCJnZXRDb21tYW5kQnJpZGdlIiwiZ2V0RW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIiwiZ2V0SHR0cEJyaWRnZSIsImdldExpc3RlbmVyQnJpZGdlIiwiZ2V0TWVzc2FnZUJyaWRnZSIsImdldFBlcnNpc3RlbmNlQnJpZGdlIiwiZ2V0QXBwQWN0aXZhdGlvbkJyaWRnZSIsImdldEFwcERldGFpbENoYW5nZXNCcmlkZ2UiLCJnZXRSb29tQnJpZGdlIiwiZ2V0U2VydmVyU2V0dGluZ0JyaWRnZSIsImdldFVzZXJCcmlkZ2UiLCJTbGFzaENvbW1hbmRDb250ZXh0IiwiZGlzYWJsZWRDb21tYW5kcyIsImRvZXNDb21tYW5kRXhpc3QiLCJjb21tYW5kIiwiY29uc29sZSIsImxvZyIsImxlbmd0aCIsImNtZCIsInRvTG93ZXJDYXNlIiwic2xhc2hDb21tYW5kcyIsImNvbW1hbmRzIiwiaGFzIiwiZW5hYmxlQ29tbWFuZCIsInRyaW0iLCJnZXQiLCJkZWxldGUiLCJjb21tYW5kVXBkYXRlZCIsImRpc2FibGVDb21tYW5kIiwiY29tbWFuZERpc2FibGVkIiwibW9kaWZ5Q29tbWFuZCIsIl92ZXJpZnlDb21tYW5kIiwicGFyYW1zIiwicGFyYW1zRXhhbXBsZSIsImRlc2NyaXB0aW9uIiwiaTE4bkRlc2NyaXB0aW9uIiwiY2FsbGJhY2siLCJfYXBwQ29tbWFuZEV4ZWN1dG9yIiwiYmluZCIsInByb3ZpZGVzUHJldmlldyIsInByZXZpZXdlciIsIl9hcHBDb21tYW5kUHJldmlld2VyIiwicHJldmlld0NhbGxiYWNrIiwiZXhlY3V0ZVByZXZpZXdJdGVtIiwiX2FwcENvbW1hbmRQcmV2aWV3RXhlY3V0b3IiLCJyZWdpc3RlckNvbW1hbmQiLCJ1bmRlZmluZWQiLCJjb21tYW5kQWRkZWQiLCJ1bnJlZ2lzdGVyQ29tbWFuZCIsImNvbW1hbmRSZW1vdmVkIiwiaTE4blBhcmFtc0V4YW1wbGUiLCJleGVjdXRvciIsInBhcmFtZXRlcnMiLCJtZXNzYWdlIiwidXNlciIsImdldENvbnZlcnRlcnMiLCJjb252ZXJ0QnlJZCIsIk1ldGVvciIsInVzZXJJZCIsInJvb20iLCJyaWQiLCJzcGxpdCIsImNvbnRleHQiLCJPYmplY3QiLCJmcmVlemUiLCJhd2FpdCIsImdldE1hbmFnZXIiLCJnZXRDb21tYW5kTWFuYWdlciIsImV4ZWN1dGVDb21tYW5kIiwiZ2V0UHJldmlld3MiLCJwcmV2aWV3IiwiZXhlY3V0ZVByZXZpZXciLCJhbGxvd2VkIiwiZ2V0VmFsdWVCeU5hbWUiLCJlbnZWYXJOYW1lIiwiaXNSZWFkYWJsZSIsInByb2Nlc3MiLCJlbnYiLCJpbmNsdWRlcyIsInRvVXBwZXJDYXNlIiwiaXNTZXQiLCJtc2ciLCJjb252ZXJ0QXBwTWVzc2FnZSIsInJ1bkFzVXNlciIsInUiLCJjYWxsIiwiZ2V0QnlJZCIsIm1lc3NhZ2VJZCIsImVkaXRvciIsIk1lc3NhZ2VzIiwiVXNlcnMiLCJ1cGRhdGVNZXNzYWdlIiwibm90aWZ5VXNlciIsIk5vdGlmaWNhdGlvbnMiLCJhc3NpZ24iLCJSYW5kb20iLCJ0cyIsIm5vdGlmeVJvb20iLCJybXNnIiwidXNlcnMiLCJTdWJzY3JpcHRpb25zIiwiZmluZEJ5Um9vbUlkV2hlblVzZXJJZEV4aXN0cyIsImZpZWxkcyIsIm1hcCIsInMiLCJmaW5kQnlJZHMiLCJwdXJnZSIsImdldFBlcnNpc3RlbmNlTW9kZWwiLCJjcmVhdGVXaXRoQXNzb2NpYXRpb25zIiwiYXNzb2NpYXRpb25zIiwicmVhZEJ5SWQiLCJyZWNvcmQiLCJyZWFkQnlBc3NvY2lhdGlvbnMiLCJyZWNvcmRzIiwiJGFsbCIsIkFycmF5IiwiaXNBcnJheSIsInIiLCJyZW1vdmVCeUFzc29jaWF0aW9ucyIsInF1ZXJ5IiwidXBzZXJ0IiwiUm9vbVR5cGUiLCJyY1Jvb20iLCJjb252ZXJ0QXBwUm9vbSIsIm1ldGhvZCIsInR5cGUiLCJDSEFOTkVMIiwiUFJJVkFURV9HUk9VUCIsImNyZWF0b3IiLCJtZW1iZXJzIiwicm9vbUlkIiwiZ2V0QnlOYW1lIiwicm9vbU5hbWUiLCJjb252ZXJ0QnlOYW1lIiwiZ2V0Q3JlYXRvckJ5SWQiLCJSb29tcyIsImdldENyZWF0b3JCeU5hbWUiLCJmaW5kT25lQnlOYW1lIiwicm0iLCJhbGxvd2VkR3JvdXBzIiwiZGlzYWxsb3dlZFNldHRpbmdzIiwiZ2V0QWxsIiwiU2V0dGluZ3MiLCIkbmluIiwiY29udmVydFRvQXBwIiwiZ2V0T25lQnlJZCIsImlzUmVhZGFibGVCeUlkIiwiaGlkZUdyb3VwIiwibmFtZSIsImhpZGVTZXR0aW5nIiwidXBkYXRlT25lIiwic2V0dGluZyIsImdldEJ5VXNlcm5hbWUiLCJ1c2VybmFtZSIsImNvbnZlcnRCeVVzZXJuYW1lIiwib25BcHBTZXR0aW5nc0NoYW5nZSIsImFwcFNldHRpbmdzQ2hhbmdlIiwid2FybiIsInJlcXVlc3QiLCJjb250ZW50IiwiSlNPTiIsInN0cmluZ2lmeSIsIkhUVFAiLCJ1cmwiLCJyZXN1bHQiLCJyZXNwb25zZSIsIm1lc3NhZ2VFdmVudCIsImludGUiLCJjb252ZXJ0TWVzc2FnZSIsImdldExpc3RlbmVyTWFuYWdlciIsImV4ZWN1dGVMaXN0ZW5lciIsInJvb21FdmVudCIsImNvbnZlcnRSb29tIiwiQXBwTWV0aG9kcyIsIndhaXRUb0xvYWQiLCJzZXRJbnRlcnZhbCIsImlzRW5hYmxlZCIsImlzTG9hZGVkIiwiY2xlYXJJbnRlcnZhbCIsIndhaXRUb1VubG9hZCIsIl9vcmNoIiwiX2FkZE1ldGhvZHMiLCJpbnN0YW5jZSIsIm1ldGhvZHMiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJzZXR0aW5ncyIsIkFwcHNSZXN0QXBpIiwibWFuYWdlciIsIl9tYW5hZ2VyIiwiYXBpIiwiQVBJIiwiQXBpQ2xhc3MiLCJ2ZXJzaW9uIiwidXNlRGVmYXVsdEF1dGgiLCJwcmV0dHlKc29uIiwiZW5hYmxlQ29ycyIsImF1dGgiLCJnZXRVc2VyQXV0aCIsImFkZE1hbmFnZW1lbnRSb3V0ZXMiLCJfaGFuZGxlRmlsZSIsImZpbGVGaWVsZCIsIkJ1c2JveSIsIk5wbSIsImJ1c2JveSIsImhlYWRlcnMiLCJ3cmFwQXN5bmMiLCJvbiIsImJpbmRFbnZpcm9ubWVudCIsImZpZWxkbmFtZSIsImZpbGUiLCJmaWxlRGF0YSIsInB1c2giLCJCdWZmZXIiLCJjb25jYXQiLCJwaXBlIiwib3JjaGVzdHJhdG9yIiwiZmlsZUhhbmRsZXIiLCJhZGRSb3V0ZSIsImF1dGhSZXF1aXJlZCIsImFwcHMiLCJwcmwiLCJnZXRJbmZvIiwibGFuZ3VhZ2VzIiwiZ2V0U3RvcmFnZUl0ZW0iLCJsYW5ndWFnZUNvbnRlbnQiLCJnZXRTdGF0dXMiLCJ2MSIsInBvc3QiLCJidWZmIiwiYm9keVBhcmFtcyIsIm5wbVJlcXVlc3RPcHRpb25zIiwiZW5jb2RpbmciLCJzdGF0dXNDb2RlIiwiZmFpbHVyZSIsImVycm9yIiwiZnJvbSIsImFmZiIsImFkZCIsInRvU3RyaW5nIiwiZ2V0QXBwSW5mbyIsImdldEFwcCIsImltcGxlbWVudGVkIiwiZ2V0SW1wbGVtZW50ZWRJbmZlcmZhY2VzIiwiY29tcGlsZXJFcnJvcnMiLCJnZXRDb21waWxlckVycm9ycyIsInVybFBhcmFtcyIsIm5vdEZvdW5kIiwiaWNvbkZpbGVDb250ZW50Iiwib2Zmc2V0IiwiY291bnQiLCJnZXRQYWdpbmF0aW9uSXRlbXMiLCJzb3J0IiwicGFyc2VKc29uUXVlcnkiLCJvdXJRdWVyeSIsIm9wdGlvbnMiLCJfdXBkYXRlZEF0Iiwic2tpcCIsImxpbWl0IiwibG9ncyIsImdldExvZ1N0b3JhZ2UiLCJrZXlzIiwiayIsImhpZGRlbiIsImdldFNldHRpbmdzTWFuYWdlciIsInVwZGF0ZUFwcFNldHRpbmciLCJzZXR0aW5nSWQiLCJnZXRBcHBTZXR0aW5nIiwiY2hhbmdlU3RhdHVzIiwiQXBwRXZlbnRzIiwiQXBwU2VydmVyTGlzdGVuZXIiLCJBcHBTZXJ2ZXJOb3RpZmllciIsIkFwcFN0YXR1cyIsIkFwcFN0YXR1c1V0aWxzIiwiQVBQX0FEREVEIiwiQVBQX1JFTU9WRUQiLCJBUFBfVVBEQVRFRCIsIkFQUF9TVEFUVVNfQ0hBTkdFIiwiQVBQX1NFVFRJTkdfVVBEQVRFRCIsIkNPTU1BTkRfQURERUQiLCJDT01NQU5EX0RJU0FCTEVEIiwiQ09NTUFORF9VUERBVEVEIiwiQ09NTUFORF9SRU1PVkVEIiwiZW5naW5lU3RyZWFtZXIiLCJjbGllbnRTdHJlYW1lciIsInJlY2VpdmVkIiwib25BcHBBZGRlZCIsIm9uQXBwU3RhdHVzVXBkYXRlZCIsIm9uQXBwU2V0dGluZ1VwZGF0ZWQiLCJvbkFwcFJlbW92ZWQiLCJvbkFwcFVwZGF0ZWQiLCJvbkNvbW1hbmRBZGRlZCIsIm9uQ29tbWFuZERpc2FibGVkIiwib25Db21tYW5kVXBkYXRlZCIsIm9uQ29tbWFuZFJlbW92ZWQiLCJsb2FkT25lIiwiZW1pdCIsIndoZW4iLCJlbmFibGUiLCJpc0Rpc2FibGVkIiwiZGlzYWJsZSIsIk1BTlVBTExZX0RJU0FCTEVEIiwic3RvcmFnZUl0ZW0iLCJnZXRTdG9yYWdlIiwiemlwIiwiU3RyZWFtZXIiLCJyZXRyYW5zbWl0Iiwic2VydmVyT25seSIsImFsbG93UmVhZCIsImFsbG93RW1pdCIsImFsbG93V3JpdGUiLCJsaXN0ZW5lciIsImRldGFpbHMiLCJBcHBNZXNzYWdlc0NvbnZlcnRlciIsIm1zZ0lkIiwibXNnT2JqIiwic2VuZGVyIiwiZWRpdGVkQnkiLCJhdHRhY2htZW50cyIsIl9jb252ZXJ0QXR0YWNobWVudHNUb0FwcCIsInRleHQiLCJlZGl0ZWRBdCIsImVtb2ppIiwiYXZhdGFyVXJsIiwiYXZhdGFyIiwiYWxpYXMiLCJjdXN0b21GaWVsZHMiLCJfY29udmVydEFwcEF0dGFjaG1lbnRzIiwiYXR0YWNobWVudCIsImNvbGxhcHNlZCIsImNvbG9yIiwidGltZXN0YW1wIiwibWVzc2FnZV9saW5rIiwidGltZXN0YW1wTGluayIsInRodW1iX3VybCIsInRodW1ibmFpbFVybCIsImF1dGhvcl9uYW1lIiwiYXV0aG9yIiwiYXV0aG9yX2xpbmsiLCJsaW5rIiwiYXV0aG9yX2ljb24iLCJpY29uIiwidGl0bGUiLCJ2YWx1ZSIsInRpdGxlX2xpbmsiLCJ0aXRsZV9saW5rX2Rvd25sb2FkIiwiZGlzcGxheURvd25sb2FkTGluayIsImltYWdlX3VybCIsImltYWdlVXJsIiwiYXVkaW9fdXJsIiwiYXVkaW9VcmwiLCJ2aWRlb191cmwiLCJ2aWRlb1VybCIsImEiLCJBcHBSb29tc0NvbnZlcnRlciIsImZuYW1lIiwiZGlzcGxheU5hbWUiLCJzbHVnaWZpZWROYW1lIiwidCIsImRlZmF1bHQiLCJpc0RlZmF1bHQiLCJybyIsImlzUmVhZE9ubHkiLCJzeXNNZXMiLCJkaXNwbGF5U3lzdGVtTWVzc2FnZXMiLCJtc2dzIiwibWVzc2FnZUNvdW50IiwibG0iLCJsYXN0TW9kaWZpZWRBdCIsIl9jb252ZXJ0VHlwZVRvQXBwIiwidHlwZUNoYXIiLCJESVJFQ1RfTUVTU0FHRSIsIkxJVkVfQ0hBVCIsIkFwcFNldHRpbmdzQ29udmVydGVyIiwiU2V0dGluZ1R5cGUiLCJwYWNrYWdlVmFsdWUiLCJ2YWx1ZXMiLCJwdWJsaWMiLCJncm91cCIsImkxOG5MYWJlbCIsIkJPT0xFQU4iLCJDT0RFIiwiQ09MT1IiLCJGT05UIiwiTlVNQkVSIiwiU0VMRUNUIiwiU1RSSU5HIiwiQXBwVXNlcnNDb252ZXJ0ZXIiLCJVc2VyU3RhdHVzQ29ubmVjdGlvbiIsIlVzZXJUeXBlIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJfY29udmVydFVzZXJUeXBlVG9FbnVtIiwic3RhdHVzQ29ubmVjdGlvbiIsIl9jb252ZXJ0U3RhdHVzQ29ubmVjdGlvblRvRW51bSIsImVtYWlscyIsImFjdGl2ZSIsInJvbGVzIiwidXRjT2Zmc2V0IiwibGFzdExvZ2luQXQiLCJsYXN0TG9naW4iLCJVU0VSIiwiQk9UIiwiVU5LTk9XTiIsIk9GRkxJTkUiLCJPTkxJTkUiLCJBV0FZIiwiQlVTWSIsIlVOREVGSU5FRCIsIkFwcE1hbmFnZXIiLCJBcHBTZXJ2ZXJPcmNoZXN0cmF0b3IiLCJQZXJtaXNzaW9ucyIsImNyZWF0ZU9yVXBkYXRlIiwiX21vZGVsIiwiX2xvZ01vZGVsIiwiX3BlcnNpc3RNb2RlbCIsIl9zdG9yYWdlIiwiX2xvZ1N0b3JhZ2UiLCJfY29udmVydGVycyIsIl9icmlkZ2VzIiwiX2NvbW11bmljYXRvcnMiLCJnZXRNb2RlbCIsImdldEJyaWRnZXMiLCJhcmVBcHBzTG9hZGVkIiwibG9hZCIsImFmZnMiLCJ1bmxvYWQiLCJrZXkiLCJnbG9iYWwiLCJzdGFydHVwIiwiX2FwcFNlcnZlck9yY2hlc3RyYXRvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0FBLE9BQU8sRUFBUCxDOzs7Ozs7Ozs7OztBQ0RBQyxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsaUJBQWMsTUFBSUE7QUFBbkIsQ0FBZDs7QUFB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O0FBYUFoWCxPQUFPbVgsT0FBUCxDQUFlLFNBQVNDLHNCQUFULEdBQWtDO0FBQ2hERixTQUFPN2dCLElBQVAsR0FBYyxJQUFJMmYscUJBQUosRUFBZDs7QUFFQSxNQUFJa0IsT0FBTzdnQixJQUFQLENBQVlrUixTQUFaLEVBQUosRUFBNkI7QUFDNUIyUCxXQUFPN2dCLElBQVAsQ0FBWXlnQixJQUFaO0FBQ0E7QUFDRCxDQU5ELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfYXBwcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFBsZWFzZSBzZWUgYm90aCBzZXJ2ZXIgYW5kIGNsaWVudCdzIHJlcHNlY3RpdmUgXCJvcmNoZXN0cmF0b3JcIiBmaWxlIGZvciB0aGUgY29udGVudHNcbkFwcHMgPSB7fTtcbiIsImV4cG9ydCBjbGFzcyBBcHBzTG9nc01vZGVsIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignYXBwc19sb2dzJyk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBzTW9kZWwgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdhcHBzJyk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBzUGVyc2lzdGVuY2VNb2RlbCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2FwcHNfcGVyc2lzdGVuY2UnKTtcblx0fVxufVxuIiwiaW1wb3J0IHsgQXBwU3RvcmFnZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvc3RvcmFnZSc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSZWFsU3RvcmFnZSBleHRlbmRzIEFwcFN0b3JhZ2Uge1xuXHRjb25zdHJ1Y3RvcihkYXRhKSB7XG5cdFx0c3VwZXIoJ21vbmdvZGInKTtcblx0XHR0aGlzLmRiID0gZGF0YTtcblx0fVxuXG5cdGNyZWF0ZShpdGVtKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGl0ZW0uY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcblx0XHRcdGl0ZW0udXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuXHRcdFx0bGV0IGRvYztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9jID0gdGhpcy5kYi5maW5kT25lKHsgJG9yOiBbeyBpZDogaXRlbS5pZCB9LCB7ICdpbmZvLm5hbWVTbHVnJzogaXRlbS5pbmZvLm5hbWVTbHVnIH1dIH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZG9jKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QobmV3IEVycm9yKCdBcHAgYWxyZWFkeSBleGlzdHMuJykpO1xuXHRcdFx0fVxuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBpZCA9IHRoaXMuZGIuaW5zZXJ0KGl0ZW0pO1xuXHRcdFx0XHRpdGVtLl9pZCA9IGlkO1xuXG5cdFx0XHRcdHJlc29sdmUoaXRlbSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHJldHJpZXZlT25lKGlkKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBkb2M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvYyA9IHRoaXMuZGIuZmluZE9uZSh7ICRvcjogWyB7X2lkOiBpZCB9LCB7IGlkIH0gXX0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZG9jKSB7XG5cdFx0XHRcdHJlc29sdmUoZG9jKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQ6ICR7IGlkIH1gKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXRyaWV2ZUFsbCgpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0bGV0IGRvY3M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvY3MgPSB0aGlzLmRiLmZpbmQoe30pLmZldGNoKCk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGl0ZW1zID0gbmV3IE1hcCgpO1xuXG5cdFx0XHRkb2NzLmZvckVhY2goKGkpID0+IGl0ZW1zLnNldChpLmlkLCBpKSk7XG5cblx0XHRcdHJlc29sdmUoaXRlbXMpO1xuXHRcdH0pO1xuXHR9XG5cblx0dXBkYXRlKGl0ZW0pIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dGhpcy5kYi51cGRhdGUoeyBpZDogaXRlbS5pZCB9LCBpdGVtKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5yZXRyaWV2ZU9uZShpdGVtLmlkKS50aGVuKCh1cGRhdGVkKSA9PiByZXNvbHZlKHVwZGF0ZWQpKS5jYXRjaCgoZXJyKSA9PiByZWplY3QoZXJyKSk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZW1vdmUoaWQpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dGhpcy5kYi5yZW1vdmUoeyBpZCB9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0cmVzb2x2ZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcHNMb2dzTW9kZWwgfSBmcm9tICcuL2FwcHMtbG9ncy1tb2RlbCc7XG5pbXBvcnQgeyBBcHBzTW9kZWwgfSBmcm9tICcuL2FwcHMtbW9kZWwnO1xuaW1wb3J0IHsgQXBwc1BlcnNpc3RlbmNlTW9kZWwgfSBmcm9tICcuL2FwcHMtcGVyc2lzdGVuY2UtbW9kZWwnO1xuaW1wb3J0IHsgQXBwUmVhbExvZ3NTdG9yYWdlIH0gZnJvbSAnLi9sb2dzLXN0b3JhZ2UnO1xuaW1wb3J0IHsgQXBwUmVhbFN0b3JhZ2UgfSBmcm9tICcuL3N0b3JhZ2UnO1xuXG5leHBvcnQgeyBBcHBzTG9nc01vZGVsLCBBcHBzTW9kZWwsIEFwcHNQZXJzaXN0ZW5jZU1vZGVsLCBBcHBSZWFsTG9nc1N0b3JhZ2UsIEFwcFJlYWxTdG9yYWdlIH07XG4iLCJpbXBvcnQgeyBBcHBDb25zb2xlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9sb2dnaW5nJztcbmltcG9ydCB7IEFwcExvZ1N0b3JhZ2UgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL3N0b3JhZ2UnO1xuXG5leHBvcnQgY2xhc3MgQXBwUmVhbExvZ3NTdG9yYWdlIGV4dGVuZHMgQXBwTG9nU3RvcmFnZSB7XG5cdGNvbnN0cnVjdG9yKG1vZGVsKSB7XG5cdFx0c3VwZXIoJ21vbmdvZGInKTtcblx0XHR0aGlzLmRiID0gbW9kZWw7XG5cdH1cblxuXHRmaW5kKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRsZXQgZG9jcztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9jcyA9IHRoaXMuZGIuZmluZCguLi5hcmd1bWVudHMpLmZldGNoKCk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc29sdmUoZG9jcyk7XG5cdFx0fSk7XG5cdH1cblxuXHRzdG9yZUVudHJpZXMoYXBwSWQsIGxvZ2dlcikge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRjb25zdCBpdGVtID0gQXBwQ29uc29sZS50b1N0b3JhZ2VFbnRyeShhcHBJZCwgbG9nZ2VyKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLmRiLmluc2VydChpdGVtKTtcblxuXHRcdFx0XHRyZXNvbHZlKHRoaXMuZGIuZmluZE9uZUJ5SWQoaWQpKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmVqZWN0KGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Z2V0RW50cmllc0ZvcihhcHBJZCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRsZXQgZG9jcztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0ZG9jcyA9IHRoaXMuZGIuZmluZCh7IGFwcElkIH0pLmZldGNoKCk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc29sdmUoZG9jcyk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZW1vdmVFbnRyaWVzRm9yKGFwcElkKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuZGIucmVtb3ZlKHsgYXBwSWQgfSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc29sdmUoKTtcblx0XHR9KTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcEFjdGl2YXRpb25CcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGFzeW5jIGFwcEFkZGVkKGFwcCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcEFkZGVkKGFwcC5nZXRJRCgpKTtcblx0fVxuXG5cdGFzeW5jIGFwcFVwZGF0ZWQoYXBwKSB7XG5cdFx0YXdhaXQgdGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwVXBkYXRlZChhcHAuZ2V0SUQoKSk7XG5cdH1cblxuXHRhc3luYyBhcHBSZW1vdmVkKGFwcCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcFJlbW92ZWQoYXBwLmdldElEKCkpO1xuXHR9XG5cblx0YXN5bmMgYXBwU3RhdHVzQ2hhbmdlZChhcHAsIHN0YXR1cykge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcFN0YXR1c1VwZGF0ZWQoYXBwLmdldElEKCksIHN0YXR1cyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcEJyaWRnZXMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL2JyaWRnZXMnO1xuXG5pbXBvcnQgeyBBcHBBY3RpdmF0aW9uQnJpZGdlIH0gZnJvbSAnLi9hY3RpdmF0aW9uJztcbmltcG9ydCB7IEFwcERldGFpbENoYW5nZXNCcmlkZ2UgfSBmcm9tICcuL2RldGFpbHMnO1xuaW1wb3J0IHsgQXBwQ29tbWFuZHNCcmlkZ2UgfSBmcm9tICcuL2NvbW1hbmRzJztcbmltcG9ydCB7IEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSB9IGZyb20gJy4vZW52aXJvbm1lbnRhbCc7XG5pbXBvcnQgeyBBcHBIdHRwQnJpZGdlIH0gZnJvbSAnLi9odHRwJztcbmltcG9ydCB7IEFwcExpc3RlbmVyQnJpZGdlIH0gZnJvbSAnLi9saXN0ZW5lcnMnO1xuaW1wb3J0IHsgQXBwTWVzc2FnZUJyaWRnZSB9IGZyb20gJy4vbWVzc2FnZXMnO1xuaW1wb3J0IHsgQXBwUGVyc2lzdGVuY2VCcmlkZ2UgfSBmcm9tICcuL3BlcnNpc3RlbmNlJztcbmltcG9ydCB7IEFwcFJvb21CcmlkZ2UgfSBmcm9tICcuL3Jvb21zJztcbmltcG9ydCB7IEFwcFNldHRpbmdCcmlkZ2UgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEFwcFVzZXJCcmlkZ2UgfSBmcm9tICcuL3VzZXJzJztcblxuZXhwb3J0IGNsYXNzIFJlYWxBcHBCcmlkZ2VzIGV4dGVuZHMgQXBwQnJpZGdlcyB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fYWN0QnJpZGdlID0gbmV3IEFwcEFjdGl2YXRpb25CcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fY21kQnJpZGdlID0gbmV3IEFwcENvbW1hbmRzQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2RldEJyaWRnZSA9IG5ldyBBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2VudkJyaWRnZSA9IG5ldyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5faHR0cEJyaWRnZSA9IG5ldyBBcHBIdHRwQnJpZGdlKCk7XG5cdFx0dGhpcy5fbGlzbkJyaWRnZSA9IG5ldyBBcHBMaXN0ZW5lckJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9tc2dCcmlkZ2UgPSBuZXcgQXBwTWVzc2FnZUJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9wZXJzaXN0QnJpZGdlID0gbmV3IEFwcFBlcnNpc3RlbmNlQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX3Jvb21CcmlkZ2UgPSBuZXcgQXBwUm9vbUJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9zZXRzQnJpZGdlID0gbmV3IEFwcFNldHRpbmdCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fdXNlckJyaWRnZSA9IG5ldyBBcHBVc2VyQnJpZGdlKG9yY2gpO1xuXHR9XG5cblx0Z2V0Q29tbWFuZEJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fY21kQnJpZGdlO1xuXHR9XG5cblx0Z2V0RW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9lbnZCcmlkZ2U7XG5cdH1cblxuXHRnZXRIdHRwQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9odHRwQnJpZGdlO1xuXHR9XG5cblx0Z2V0TGlzdGVuZXJCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2xpc25CcmlkZ2U7XG5cdH1cblxuXHRnZXRNZXNzYWdlQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9tc2dCcmlkZ2U7XG5cdH1cblxuXHRnZXRQZXJzaXN0ZW5jZUJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fcGVyc2lzdEJyaWRnZTtcblx0fVxuXG5cdGdldEFwcEFjdGl2YXRpb25CcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2FjdEJyaWRnZTtcblx0fVxuXG5cdGdldEFwcERldGFpbENoYW5nZXNCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2RldEJyaWRnZTtcblx0fVxuXG5cdGdldFJvb21CcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3Jvb21CcmlkZ2U7XG5cdH1cblxuXHRnZXRTZXJ2ZXJTZXR0aW5nQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9zZXRzQnJpZGdlO1xuXHR9XG5cblx0Z2V0VXNlckJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fdXNlckJyaWRnZTtcblx0fVxufVxuIiwiaW1wb3J0IHsgU2xhc2hDb21tYW5kQ29udGV4dCB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLXRzLWRlZmluaXRpb24vc2xhc2hjb21tYW5kcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBDb21tYW5kc0JyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcyA9IG5ldyBNYXAoKTtcblx0fVxuXG5cdGRvZXNDb21tYW5kRXhpc3QoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNoZWNraW5nIGlmIFwiJHsgY29tbWFuZCB9XCIgY29tbWFuZCBleGlzdHMuYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdHJldHVybiB0eXBlb2YgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPT09ICdvYmplY3QnIHx8IHRoaXMuZGlzYWJsZWRDb21tYW5kcy5oYXMoY21kKTtcblx0fVxuXG5cdGVuYWJsZUNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGF0dGVtcHRpbmcgdG8gZW5hYmxlIHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQgfVwiYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBtdXN0IGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoIXRoaXMuZGlzYWJsZWRDb21tYW5kcy5oYXMoY21kKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgY29tbWFuZCBpcyBub3QgY3VycmVudGx5IGRpc2FibGVkOiBcIiR7IGNtZCB9XCJgKTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9IHRoaXMuZGlzYWJsZWRDb21tYW5kcy5nZXQoY21kKTtcblx0XHR0aGlzLmRpc2FibGVkQ29tbWFuZHMuZGVsZXRlKGNtZCk7XG5cblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kVXBkYXRlZChjbWQpO1xuXHR9XG5cblx0ZGlzYWJsZUNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGF0dGVtcHRpbmcgdG8gZGlzYWJsZSB0aGUgY29tbWFuZDogXCIkeyBjb21tYW5kIH1cImApO1xuXG5cdFx0aWYgKHR5cGVvZiBjb21tYW5kICE9PSAnc3RyaW5nJyB8fCBjb21tYW5kLnRyaW0oKS5sZW5ndGggPT09IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgbXVzdCBiZSBhIHN0cmluZy4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRoaXMuZGlzYWJsZWRDb21tYW5kcy5oYXMoY21kKSkge1xuXHRcdFx0Ly8gVGhlIGNvbW1hbmQgaXMgYWxyZWFkeSBkaXNhYmxlZCwgbm8gbmVlZCB0byBkaXNhYmxlIGl0IHlldCBhZ2FpblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYENvbW1hbmQgZG9lcyBub3QgZXhpc3QgaW4gdGhlIHN5c3RlbSBjdXJyZW50bHk6IFwiJHsgY21kIH1cImApO1xuXHRcdH1cblxuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcy5zZXQoY21kLCBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSk7XG5cdFx0ZGVsZXRlIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdO1xuXG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZERpc2FibGVkKGNtZCk7XG5cdH1cblxuXHQvLyBjb21tYW5kOiB7IGNvbW1hbmQsIHBhcmFtc0V4YW1wbGUsIGkxOG5EZXNjcmlwdGlvbiwgZXhlY3V0b3I6IGZ1bmN0aW9uIH1cblx0bW9kaWZ5Q29tbWFuZChjb21tYW5kLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgYXR0ZW1wdGluZyB0byBtb2RpZnkgdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZCB9XCJgKTtcblxuXHRcdHRoaXMuX3ZlcmlmeUNvbW1hbmQoY29tbWFuZCk7XG5cblx0XHRjb25zdCBjbWQgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHR5cGVvZiBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgQ29tbWFuZCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgc3lzdGVtIGN1cnJlbnRseSAob3IgaXQgaXMgZGlzYWJsZWQpOiBcIiR7IGNtZCB9XCJgKTtcblx0XHR9XG5cblx0XHRjb25zdCBpdGVtID0gUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF07XG5cdFx0aXRlbS5wYXJhbXMgPSBjb21tYW5kLnBhcmFtc0V4YW1wbGUgPyBjb21tYW5kLnBhcmFtc0V4YW1wbGUgOiBpdGVtLnBhcmFtcztcblx0XHRpdGVtLmRlc2NyaXB0aW9uID0gY29tbWFuZC5pMThuRGVzY3JpcHRpb24gPyBjb21tYW5kLmkxOG5EZXNjcmlwdGlvbiA6IGl0ZW0ucGFyYW1zO1xuXHRcdGl0ZW0uY2FsbGJhY2sgPSB0aGlzLl9hcHBDb21tYW5kRXhlY3V0b3IuYmluZCh0aGlzKTtcblx0XHRpdGVtLnByb3ZpZGVzUHJldmlldyA9IGNvbW1hbmQucHJvdmlkZXNQcmV2aWV3O1xuXHRcdGl0ZW0ucHJldmlld2VyID0gY29tbWFuZC5wcmV2aWV3ZXIgPyB0aGlzLl9hcHBDb21tYW5kUHJldmlld2VyLmJpbmQodGhpcykgOiBpdGVtLnByZXZpZXdlcjtcblx0XHRpdGVtLnByZXZpZXdDYWxsYmFjayA9IGNvbW1hbmQuZXhlY3V0ZVByZXZpZXdJdGVtID8gdGhpcy5fYXBwQ29tbWFuZFByZXZpZXdFeGVjdXRvci5iaW5kKHRoaXMpIDogaXRlbS5wcmV2aWV3Q2FsbGJhY2s7XG5cblx0XHRSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9IGl0ZW07XG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuY29tbWFuZFVwZGF0ZWQoY21kKTtcblx0fVxuXG5cdHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgcmVnaXN0ZXJpbiB0aGUgY29tbWFuZDogXCIkeyBjb21tYW5kLmNvbW1hbmQgfVwiYCk7XG5cblx0XHR0aGlzLl92ZXJpZnlDb21tYW5kKGNvbW1hbmQpO1xuXG5cdFx0Y29uc3QgaXRlbSA9IHtcblx0XHRcdGNvbW1hbmQ6IGNvbW1hbmQuY29tbWFuZC50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0cGFyYW1zOiBjb21tYW5kLnBhcmFtc0V4YW1wbGUsXG5cdFx0XHRkZXNjcmlwdGlvbjogY29tbWFuZC5pMThuRGVzY3JpcHRpb24sXG5cdFx0XHRjYWxsYmFjazogdGhpcy5fYXBwQ29tbWFuZEV4ZWN1dG9yLmJpbmQodGhpcyksXG5cdFx0XHRwcm92aWRlc1ByZXZpZXc6IGNvbW1hbmQucHJvdmlkZXNQcmV2aWV3LFxuXHRcdFx0cHJldmlld2VyOiAhY29tbWFuZC5wcmV2aWV3ZXIgPyB1bmRlZmluZWQgOiB0aGlzLl9hcHBDb21tYW5kUHJldmlld2VyLmJpbmQodGhpcyksXG5cdFx0XHRwcmV2aWV3Q2FsbGJhY2s6ICFjb21tYW5kLmV4ZWN1dGVQcmV2aWV3SXRlbSA/IHVuZGVmaW5lZCA6IHRoaXMuX2FwcENvbW1hbmRQcmV2aWV3RXhlY3V0b3IuYmluZCh0aGlzKVxuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY29tbWFuZC5jb21tYW5kLnRvTG93ZXJDYXNlKCldID0gaXRlbTtcblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kQWRkZWQoY29tbWFuZC5jb21tYW5kLnRvTG93ZXJDYXNlKCkpO1xuXHR9XG5cblx0dW5yZWdpc3RlckNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVucmVnaXN0ZXJpbmcgdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZCB9XCJgKTtcblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ3N0cmluZycgfHwgY29tbWFuZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIG11c3QgYmUgYSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcy5kZWxldGUoY21kKTtcblx0XHRkZWxldGUgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF07XG5cblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kUmVtb3ZlZChjbWQpO1xuXHR9XG5cblx0X3ZlcmlmeUNvbW1hbmQoY29tbWFuZCkge1xuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ29iamVjdCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZC5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbW1hbmQuaTE4blBhcmFtc0V4YW1wbGUgJiYgdHlwZW9mIGNvbW1hbmQuaTE4blBhcmFtc0V4YW1wbGUgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgU2xhc2ggQ29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIGl0IG11c3QgYmUgYSB2YWxpZCBJU2xhc2hDb21tYW5kIG9iamVjdC4nKTtcblx0XHR9XG5cblx0XHRpZiAoY29tbWFuZC5pMThuRGVzY3JpcHRpb24gJiYgdHlwZW9mIGNvbW1hbmQuaTE4bkRlc2NyaXB0aW9uICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBjb21tYW5kLnByb3ZpZGVzUHJldmlldyAhPT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgU2xhc2ggQ29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIGl0IG11c3QgYmUgYSB2YWxpZCBJU2xhc2hDb21tYW5kIG9iamVjdC4nKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQuZXhlY3V0b3IgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblx0fVxuXG5cdF9hcHBDb21tYW5kRXhlY3V0b3IoY29tbWFuZCwgcGFyYW1ldGVycywgbWVzc2FnZSkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChNZXRlb3IudXNlcklkKCkpO1xuXHRcdGNvbnN0IHJvb20gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChtZXNzYWdlLnJpZCk7XG5cdFx0Y29uc3QgcGFyYW1zID0gcGFyYW1ldGVycy5sZW5ndGggPT09IDAgfHwgcGFyYW1ldGVycyA9PT0gJyAnID8gW10gOiBwYXJhbWV0ZXJzLnNwbGl0KCcgJyk7XG5cblx0XHRjb25zdCBjb250ZXh0ID0gbmV3IFNsYXNoQ29tbWFuZENvbnRleHQoT2JqZWN0LmZyZWV6ZSh1c2VyKSwgT2JqZWN0LmZyZWV6ZShyb29tKSwgT2JqZWN0LmZyZWV6ZShwYXJhbXMpKTtcblx0XHRQcm9taXNlLmF3YWl0KHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0Q29tbWFuZE1hbmFnZXIoKS5leGVjdXRlQ29tbWFuZChjb21tYW5kLCBjb250ZXh0KSk7XG5cdH1cblxuXHRfYXBwQ29tbWFuZFByZXZpZXdlcihjb21tYW5kLCBwYXJhbWV0ZXJzLCBtZXNzYWdlKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKG1lc3NhZ2UucmlkKTtcblx0XHRjb25zdCBwYXJhbXMgPSBwYXJhbWV0ZXJzLmxlbmd0aCA9PT0gMCB8fCBwYXJhbWV0ZXJzID09PSAnICcgPyBbXSA6IHBhcmFtZXRlcnMuc3BsaXQoJyAnKTtcblxuXHRcdGNvbnN0IGNvbnRleHQgPSBuZXcgU2xhc2hDb21tYW5kQ29udGV4dChPYmplY3QuZnJlZXplKHVzZXIpLCBPYmplY3QuZnJlZXplKHJvb20pLCBPYmplY3QuZnJlZXplKHBhcmFtcykpO1xuXHRcdHJldHVybiBQcm9taXNlLmF3YWl0KHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0Q29tbWFuZE1hbmFnZXIoKS5nZXRQcmV2aWV3cyhjb21tYW5kLCBjb250ZXh0KSk7XG5cdH1cblxuXHRfYXBwQ29tbWFuZFByZXZpZXdFeGVjdXRvcihjb21tYW5kLCBwYXJhbWV0ZXJzLCBtZXNzYWdlLCBwcmV2aWV3KSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKG1lc3NhZ2UucmlkKTtcblx0XHRjb25zdCBwYXJhbXMgPSBwYXJhbWV0ZXJzLmxlbmd0aCA9PT0gMCB8fCBwYXJhbWV0ZXJzID09PSAnICcgPyBbXSA6IHBhcmFtZXRlcnMuc3BsaXQoJyAnKTtcblxuXHRcdGNvbnN0IGNvbnRleHQgPSBuZXcgU2xhc2hDb21tYW5kQ29udGV4dChPYmplY3QuZnJlZXplKHVzZXIpLCBPYmplY3QuZnJlZXplKHJvb20pLCBPYmplY3QuZnJlZXplKHBhcmFtcykpO1xuXHRcdFByb21pc2UuYXdhaXQodGhpcy5vcmNoLmdldE1hbmFnZXIoKS5nZXRDb21tYW5kTWFuYWdlcigpLmV4ZWN1dGVQcmV2aWV3KGNvbW1hbmQsIHByZXZpZXcsIGNvbnRleHQpKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHRcdHRoaXMuYWxsb3dlZCA9IFsnTk9ERV9FTlYnLCAnUk9PVF9VUkwnLCAnSU5TVEFOQ0VfSVAnXTtcblx0fVxuXG5cdGFzeW5jIGdldFZhbHVlQnlOYW1lKGVudlZhck5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIHZhbHVlICR7IGVudlZhck5hbWUgfS5gKTtcblxuXHRcdGlmICh0aGlzLmlzUmVhZGFibGUoZW52VmFyTmFtZSwgYXBwSWQpKSB7XG5cdFx0XHRyZXR1cm4gcHJvY2Vzcy5lbnZbZW52VmFyTmFtZV07XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBcIiR7IGVudlZhck5hbWUgfVwiIGlzIG5vdCByZWFkYWJsZS5gKTtcblx0fVxuXG5cdGFzeW5jIGlzUmVhZGFibGUoZW52VmFyTmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNoZWNraW5nIGlmIHRoZSBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIGlzIHJlYWRhYmxlICR7IGVudlZhck5hbWUgfS5gKTtcblxuXHRcdHJldHVybiB0aGlzLmFsbG93ZWQuaW5jbHVkZXMoZW52VmFyTmFtZS50b1VwcGVyQ2FzZSgpKTtcblx0fVxuXG5cdGFzeW5jIGlzU2V0KGVudlZhck5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjaGVja2luZyBpZiB0aGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBpcyBzZXQgJHsgZW52VmFyTmFtZSB9LmApO1xuXG5cdFx0aWYgKHRoaXMuaXNSZWFkYWJsZShlbnZWYXJOYW1lLCBhcHBJZCkpIHtcblx0XHRcdHJldHVybiB0eXBlb2YgcHJvY2Vzcy5lbnZbZW52VmFyTmFtZV0gIT09ICd1bmRlZmluZWQnO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGVudmlyb25tZW50YWwgdmFyaWFibGUgXCIkeyBlbnZWYXJOYW1lIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBNZXNzYWdlQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRhc3luYyBjcmVhdGUobWVzc2FnZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNyZWF0aW5nIGEgbmV3IG1lc3NhZ2UuYCk7XG5cblx0XHRsZXQgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEFwcE1lc3NhZ2UobWVzc2FnZSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKG1zZy51Ll9pZCwgKCkgPT4ge1xuXHRcdFx0bXNnID0gTWV0ZW9yLmNhbGwoJ3NlbmRNZXNzYWdlJywgbXNnKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBtc2cuX2lkO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlJZChtZXNzYWdlSWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSBtZXNzYWdlOiBcIiR7IG1lc3NhZ2VJZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QnlJZChtZXNzYWdlSWQpO1xuXHR9XG5cblx0YXN5bmMgdXBkYXRlKG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1cGRhdGluZyBhIG1lc3NhZ2UuYCk7XG5cblx0XHRpZiAoIW1lc3NhZ2UuZWRpdG9yKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZWRpdG9yIGFzc2lnbmVkIHRvIHRoZSBtZXNzYWdlIGZvciB0aGUgdXBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGlmICghbWVzc2FnZS5pZCB8fCAhUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobWVzc2FnZS5pZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQSBtZXNzYWdlIG11c3QgZXhpc3QgdG8gdXBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpO1xuXHRcdGNvbnN0IGVkaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuZWRpdG9yLmlkKTtcblxuXHRcdFJvY2tldENoYXQudXBkYXRlTWVzc2FnZShtc2csIGVkaXRvcik7XG5cdH1cblxuXHRhc3luYyBub3RpZnlVc2VyKHVzZXIsIG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBub3RpZnlpbmcgYSB1c2VyLmApO1xuXG5cdFx0Y29uc3QgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEFwcE1lc3NhZ2UobWVzc2FnZSk7XG5cblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcih1c2VyLmlkLCAnbWVzc2FnZScsIE9iamVjdC5hc3NpZ24obXNnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHR1OiB1bmRlZmluZWQsXG5cdFx0XHRlZGl0b3I6IHVuZGVmaW5lZFxuXHRcdH0pKTtcblx0fVxuXG5cdGFzeW5jIG5vdGlmeVJvb20ocm9vbSwgbWVzc2FnZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIG5vdGlmeWluZyBhIHJvb20ncyB1c2Vycy5gKTtcblxuXHRcdGlmIChyb29tKSB7XG5cdFx0XHRjb25zdCBtc2cgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QXBwTWVzc2FnZShtZXNzYWdlKTtcblx0XHRcdGNvbnN0IHJtc2cgPSBPYmplY3QuYXNzaWduKG1zZywge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRyaWQ6IHJvb20uaWQsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHR1OiB1bmRlZmluZWQsXG5cdFx0XHRcdGVkaXRvcjogdW5kZWZpbmVkXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgdXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRCeVJvb21JZFdoZW5Vc2VySWRFeGlzdHMocm9vbS5faWQsIHsgZmllbGRzOiB7ICd1Ll9pZCc6IDEgfSB9KVxuXHRcdFx0XHQuZmV0Y2goKVxuXHRcdFx0XHQubWFwKHMgPT4gcy51Ll9pZCk7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kQnlJZHModXNlcnMsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pXG5cdFx0XHRcdC5mZXRjaCgpXG5cdFx0XHRcdC5mb3JFYWNoKCh7IF9pZCB9KSA9PlxuXHRcdFx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKF9pZCwgJ21lc3NhZ2UnLCBybXNnKVxuXHRcdFx0XHQpO1xuXHRcdH1cblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcFBlcnNpc3RlbmNlQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRhc3luYyBwdXJnZShhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwJ3MgcGVyc2lzdGVudCBzdG9yYWdlIGlzIGJlaW5nIHB1cmdlZDogJHsgYXBwSWQgfWApO1xuXG5cdFx0dGhpcy5vcmNoLmdldFBlcnNpc3RlbmNlTW9kZWwoKS5yZW1vdmUoeyBhcHBJZCB9KTtcblx0fVxuXG5cdGFzeW5jIGNyZWF0ZShkYXRhLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgc3RvcmluZyBhIG5ldyBvYmplY3QgaW4gdGhlaXIgcGVyc2lzdGVuY2UuYCwgZGF0YSk7XG5cblx0XHRpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHRlZCB0byBzdG9yZSBhbiBpbnZhbGlkIGRhdGEgdHlwZSwgaXQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuaW5zZXJ0KHsgYXBwSWQsIGRhdGEgfSk7XG5cdH1cblxuXHRhc3luYyBjcmVhdGVXaXRoQXNzb2NpYXRpb25zKGRhdGEsIGFzc29jaWF0aW9ucywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHN0b3JpbmcgYSBuZXcgb2JqZWN0IGluIHRoZWlyIHBlcnNpc3RlbmNlIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoIHNvbWUgbW9kZWxzLmAsIGRhdGEsIGFzc29jaWF0aW9ucyk7XG5cblx0XHRpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHRlZCB0byBzdG9yZSBhbiBpbnZhbGlkIGRhdGEgdHlwZSwgaXQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuaW5zZXJ0KHsgYXBwSWQsIGFzc29jaWF0aW9ucywgZGF0YSB9KTtcblx0fVxuXG5cdGFzeW5jIHJlYWRCeUlkKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgcmVhZGluZyB0aGVpciBkYXRhIGluIHRoZWlyIHBlcnNpc3RlbmNlIHdpdGggdGhlIGlkOiBcIiR7IGlkIH1cImApO1xuXG5cdFx0Y29uc3QgcmVjb3JkID0gdGhpcy5vcmNoLmdldFBlcnNpc3RlbmNlTW9kZWwoKS5maW5kT25lQnlJZChpZCk7XG5cblx0XHRyZXR1cm4gcmVjb3JkLmRhdGE7XG5cdH1cblxuXHRhc3luYyByZWFkQnlBc3NvY2lhdGlvbnMoYXNzb2NpYXRpb25zLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgc2VhcmNoaW5nIGZvciByZWNvcmRzIHRoYXQgYXJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgZm9sbG93aW5nOmAsIGFzc29jaWF0aW9ucyk7XG5cblx0XHRjb25zdCByZWNvcmRzID0gdGhpcy5vcmNoLmdldFBlcnNpc3RlbmNlTW9kZWwoKS5maW5kKHtcblx0XHRcdGFwcElkLFxuXHRcdFx0YXNzb2NpYXRpb25zOiB7ICRhbGw6IGFzc29jaWF0aW9ucyB9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KHJlY29yZHMpID8gcmVjb3Jkcy5tYXAoKHIpID0+IHIuZGF0YSkgOiBbXTtcblx0fVxuXG5cdGFzeW5jIHJlbW92ZShpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlbW92aW5nIG9uZSBvZiB0aGVpciByZWNvcmRzIGJ5IHRoZSBpZDogXCIkeyBpZCB9XCJgKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZE9uZSh7IF9pZDogaWQsIGFwcElkIH0pO1xuXG5cdFx0aWYgKCFyZWNvcmQpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0dGhpcy5vcmNoLmdldFBlcnNpc3RlbmNlTW9kZWwoKS5yZW1vdmUoeyBfaWQ6IGlkLCBhcHBJZCB9KTtcblxuXHRcdHJldHVybiByZWNvcmQuZGF0YTtcblx0fVxuXG5cdGFzeW5jIHJlbW92ZUJ5QXNzb2NpYXRpb25zKGFzc29jaWF0aW9ucywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlbW92aW5nIHJlY29yZHMgd2l0aCB0aGUgZm9sbG93aW5nIGFzc29jaWF0aW9uczpgLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRhcHBJZCxcblx0XHRcdGFzc29jaWF0aW9uczoge1xuXHRcdFx0XHQkYWxsOiBhc3NvY2lhdGlvbnNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3QgcmVjb3JkcyA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZChxdWVyeSkuZmV0Y2goKTtcblxuXHRcdGlmICghcmVjb3Jkcykge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHR0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLnJlbW92ZShxdWVyeSk7XG5cblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShyZWNvcmRzKSA/IHJlY29yZHMubWFwKChyKSA9PiByLmRhdGEpIDogW107XG5cdH1cblxuXHRhc3luYyB1cGRhdGUoaWQsIGRhdGEsIHVwc2VydCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVwZGF0aW5nIHRoZSByZWNvcmQgXCIkeyBpZCB9XCIgdG86YCwgZGF0YSk7XG5cblx0XHRpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHRlZCB0byBzdG9yZSBhbiBpbnZhbGlkIGRhdGEgdHlwZSwgaXQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJvb21UeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9yb29tcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSb29tQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRhc3luYyBjcmVhdGUocm9vbSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNyZWF0aW5nIGEgbmV3IHJvb20uYCwgcm9vbSk7XG5cblx0XHRjb25zdCByY1Jvb20gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QXBwUm9vbShyb29tKTtcblx0XHRsZXQgbWV0aG9kO1xuXG5cdFx0c3dpdGNoIChyb29tLnR5cGUpIHtcblx0XHRcdGNhc2UgUm9vbVR5cGUuQ0hBTk5FTDpcblx0XHRcdFx0bWV0aG9kID0gJ2NyZWF0ZUNoYW5uZWwnO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgUm9vbVR5cGUuUFJJVkFURV9HUk9VUDpcblx0XHRcdFx0bWV0aG9kID0gJ2NyZWF0ZVByaXZhdGVHcm91cCc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdPbmx5IGNoYW5uZWxzIGFuZCBwcml2YXRlIGdyb3VwcyBjYW4gYmUgY3JlYXRlZC4nKTtcblx0XHR9XG5cblx0XHRsZXQgcmlkO1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIocm9vbS5jcmVhdG9yLmlkLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBpbmZvID0gTWV0ZW9yLmNhbGwobWV0aG9kLCByY1Jvb20ubWVtYmVycyk7XG5cdFx0XHRyaWQgPSBpbmZvLnJpZDtcblx0XHR9KTtcblxuXHRcdHJldHVybiByaWQ7XG5cdH1cblxuXHRhc3luYyBnZXRCeUlkKHJvb21JZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb21CeUlkOiBcIiR7IHJvb21JZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlJZChyb29tSWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlOYW1lKHJvb21OYW1lLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgcm9vbUJ5TmFtZTogXCIkeyByb29tTmFtZSB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QnlOYW1lKHJvb21OYW1lKTtcblx0fVxuXG5cdGFzeW5jIGdldENyZWF0b3JCeUlkKHJvb21JZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb20ncyBjcmVhdG9yIGJ5IGlkOiBcIiR7IHJvb21JZCB9XCJgKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8ICFyb29tLnUgfHwgIXJvb20udS5faWQpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKHJvb20udS5faWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0Q3JlYXRvckJ5TmFtZShyb29tTmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHJvb20ncyBjcmVhdG9yIGJ5IG5hbWU6IFwiJHsgcm9vbU5hbWUgfVwiYCk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShyb29tTmFtZSk7XG5cblx0XHRpZiAoIXJvb20gfHwgIXJvb20udSB8fCAhcm9vbS51Ll9pZCkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5SWQocm9vbS51Ll9pZCk7XG5cdH1cblxuXHRhc3luYyB1cGRhdGUocm9vbSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVwZGF0aW5nIGEgcm9vbS5gKTtcblxuXHRcdGlmICghcm9vbS5pZCB8fCBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tLmlkKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBIHJvb20gbXVzdCBleGlzdCB0byB1cGRhdGUuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm0gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QXBwUm9vbShyb29tKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZShybS5faWQsIHJtKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcFNldHRpbmdCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmFsbG93ZWRHcm91cHMgPSBbXTtcblx0XHR0aGlzLmRpc2FsbG93ZWRTZXR0aW5ncyA9IFtcblx0XHRcdCdBY2NvdW50c19SZWdpc3RyYXRpb25Gb3JtX1NlY3JldFVSTCcsICdDUk9XRF9BUFBfVVNFUk5BTUUnLCAnQ1JPV0RfQVBQX1BBU1NXT1JEJywgJ0RpcmVjdF9SZXBseV9Vc2VybmFtZScsXG5cdFx0XHQnRGlyZWN0X1JlcGx5X1Bhc3N3b3JkJywgJ1NNVFBfVXNlcm5hbWUnLCAnU01UUF9QYXNzd29yZCcsICdGaWxlVXBsb2FkX1MzX0FXU0FjY2Vzc0tleUlkJywgJ0ZpbGVVcGxvYWRfUzNfQVdTU2VjcmV0QWNjZXNzS2V5Jyxcblx0XHRcdCdGaWxlVXBsb2FkX1MzX0J1Y2tldFVSTCcsICdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0JywgJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9BY2Nlc3NJZCcsXG5cdFx0XHQnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1NlY3JldCcsICdHb29nbGVWaXNpb25fU2VydmljZUFjY291bnQnLCAnQWxsb3dfSW52YWxpZF9TZWxmU2lnbmVkX0NlcnRzJywgJ0dvb2dsZVRhZ01hbmFnZXJfaWQnLFxuXHRcdFx0J0J1Z3NuYWdfYXBpX2tleScsICdMREFQX0NBX0NlcnQnLCAnTERBUF9SZWplY3RfVW5hdXRob3JpemVkJywgJ0xEQVBfRG9tYWluX1NlYXJjaF9Vc2VyJywgJ0xEQVBfRG9tYWluX1NlYXJjaF9QYXNzd29yZCcsXG5cdFx0XHQnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9LZXknLCAnQXV0b1RyYW5zbGF0ZV9Hb29nbGVBUElLZXknLCAnTWFwVmlld19HTWFwc0FQSUtleScsXG5cdFx0XHQnTWV0YV9mYl9hcHBfaWQnLCAnTWV0YV9nb29nbGUtc2l0ZS12ZXJpZmljYXRpb24nLCAnTWV0YV9tc3ZhbGlkYXRlMDEnLCAnQWNjb3VudHNfT0F1dGhfRG9scGhpbl9zZWNyZXQnLFxuXHRcdFx0J0FjY291bnRzX09BdXRoX0RydXBhbF9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfRmFjZWJvb2tfc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX0dpdGh1Yl9zZWNyZXQnLCAnQVBJX0dpdEh1Yl9FbnRlcnByaXNlX1VSTCcsXG5cdFx0XHQnQWNjb3VudHNfT0F1dGhfR2l0SHViX0VudGVycHJpc2Vfc2VjcmV0JywgJ0FQSV9HaXRsYWJfVVJMJywgJ0FjY291bnRzX09BdXRoX0dpdGxhYl9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfR29vZ2xlX3NlY3JldCcsXG5cdFx0XHQnQWNjb3VudHNfT0F1dGhfTGlua2VkaW5fc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX01ldGVvcl9zZWNyZXQnLCAnQWNjb3VudHNfT0F1dGhfVHdpdHRlcl9zZWNyZXQnLCAnQVBJX1dvcmRwcmVzc19VUkwnLFxuXHRcdFx0J0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19zZWNyZXQnLCAnUHVzaF9hcG5fcGFzc3BocmFzZScsICdQdXNoX2Fwbl9rZXknLCAnUHVzaF9hcG5fY2VydCcsICdQdXNoX2Fwbl9kZXZfcGFzc3BocmFzZScsXG5cdFx0XHQnUHVzaF9hcG5fZGV2X2tleScsICdQdXNoX2Fwbl9kZXZfY2VydCcsICdQdXNoX2djbV9hcGlfa2V5JywgJ1B1c2hfZ2NtX3Byb2plY3RfbnVtYmVyJywgJ1NBTUxfQ3VzdG9tX0RlZmF1bHRfY2VydCcsXG5cdFx0XHQnU0FNTF9DdXN0b21fRGVmYXVsdF9wcml2YXRlX2tleScsICdTbGFja0JyaWRnZV9BUElUb2tlbicsICdTbWFyc2hfRW1haWwnLCAnU01TX1R3aWxpb19BY2NvdW50X1NJRCcsICdTTVNfVHdpbGlvX2F1dGhUb2tlbidcblx0XHRdO1xuXHR9XG5cblx0YXN5bmMgZ2V0QWxsKGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIGFsbCB0aGUgc2V0dGluZ3MuYCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZCh7IF9pZDogeyAkbmluOiB0aGlzLmRpc2FsbG93ZWRTZXR0aW5ncyB9IH0pLmZldGNoKCkubWFwKChzKSA9PiB7XG5cdFx0XHR0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnc2V0dGluZ3MnKS5jb252ZXJ0VG9BcHAocyk7XG5cdFx0fSk7XG5cdH1cblxuXHRhc3luYyBnZXRPbmVCeUlkKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgc2V0dGluZyBieSBpZCAkeyBpZCB9LmApO1xuXG5cdFx0aWYgKCF0aGlzLmlzUmVhZGFibGVCeUlkKGlkLCBhcHBJZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIHNldHRpbmcgXCIkeyBpZCB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnc2V0dGluZ3MnKS5jb252ZXJ0QnlJZChpZCk7XG5cdH1cblxuXHRhc3luYyBoaWRlR3JvdXAobmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGhpZGRpbmcgdGhlIGdyb3VwICR7IG5hbWUgfS5gKTtcblxuXHRcdHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcblx0fVxuXG5cdGFzeW5jIGhpZGVTZXR0aW5nKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgaGlkZGluZyB0aGUgc2V0dGluZyAkeyBpZCB9LmApO1xuXG5cdFx0aWYgKCF0aGlzLmlzUmVhZGFibGVCeUlkKGlkLCBhcHBJZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIHNldHRpbmcgXCIkeyBpZCB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcblx0fVxuXG5cdGFzeW5jIGlzUmVhZGFibGVCeUlkKGlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgY2hlY2tpbmcgaWYgdGhleSBjYW4gcmVhZCB0aGUgc2V0dGluZyAkeyBpZCB9LmApO1xuXG5cdFx0cmV0dXJuICF0aGlzLmRpc2FsbG93ZWRTZXR0aW5ncy5pbmNsdWRlcyhpZCk7XG5cdH1cblxuXHRhc3luYyB1cGRhdGVPbmUoc2V0dGluZywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVwZGF0aW5nIHRoZSBzZXR0aW5nICR7IHNldHRpbmcuaWQgfSAuYCk7XG5cblx0XHRpZiAoIXRoaXMuaXNSZWFkYWJsZUJ5SWQoc2V0dGluZy5pZCwgYXBwSWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBzZXR0aW5nIFwiJHsgc2V0dGluZy5pZCB9XCIgaXMgbm90IHJlYWRhYmxlLmApO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcignTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC4nKTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcFVzZXJCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGFzeW5jIGdldEJ5SWQodXNlcklkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgdXNlcklkOiBcIiR7IHVzZXJJZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZCh1c2VySWQpO1xuXHR9XG5cblx0YXN5bmMgZ2V0QnlVc2VybmFtZSh1c2VybmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHVzZXJuYW1lOiBcIiR7IHVzZXJuYW1lIH1cImApO1xuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblx0fVxufVxuIiwiaW1wb3J0IHsgUmVhbEFwcEJyaWRnZXMgfSBmcm9tICcuL2JyaWRnZXMnO1xuaW1wb3J0IHsgQXBwQWN0aXZhdGlvbkJyaWRnZSB9IGZyb20gJy4vYWN0aXZhdGlvbic7XG5pbXBvcnQgeyBBcHBDb21tYW5kc0JyaWRnZSB9IGZyb20gJy4vY29tbWFuZHMnO1xuaW1wb3J0IHsgQXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIH0gZnJvbSAnLi9lbnZpcm9ubWVudGFsJztcbmltcG9ydCB7IEFwcEh0dHBCcmlkZ2UgfSBmcm9tICcuL2h0dHAnO1xuaW1wb3J0IHsgQXBwTGlzdGVuZXJCcmlkZ2UgfSBmcm9tICcuL2xpc3RlbmVycyc7XG5pbXBvcnQgeyBBcHBNZXNzYWdlQnJpZGdlIH0gZnJvbSAnLi9tZXNzYWdlcyc7XG5pbXBvcnQgeyBBcHBQZXJzaXN0ZW5jZUJyaWRnZSB9IGZyb20gJy4vcGVyc2lzdGVuY2UnO1xuaW1wb3J0IHsgQXBwUm9vbUJyaWRnZSB9IGZyb20gJy4vcm9vbXMnO1xuaW1wb3J0IHsgQXBwU2V0dGluZ0JyaWRnZSB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgQXBwVXNlckJyaWRnZSB9IGZyb20gJy4vdXNlcnMnO1xuXG5leHBvcnQge1xuXHRSZWFsQXBwQnJpZGdlcyxcblx0QXBwQWN0aXZhdGlvbkJyaWRnZSxcblx0QXBwQ29tbWFuZHNCcmlkZ2UsXG5cdEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSxcblx0QXBwSHR0cEJyaWRnZSxcblx0QXBwTGlzdGVuZXJCcmlkZ2UsXG5cdEFwcE1lc3NhZ2VCcmlkZ2UsXG5cdEFwcFBlcnNpc3RlbmNlQnJpZGdlLFxuXHRBcHBSb29tQnJpZGdlLFxuXHRBcHBTZXR0aW5nQnJpZGdlLFxuXHRBcHBVc2VyQnJpZGdlXG59O1xuIiwiZXhwb3J0IGNsYXNzIEFwcERldGFpbENoYW5nZXNCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdG9uQXBwU2V0dGluZ3NDaGFuZ2UoYXBwSWQsIHNldHRpbmcpIHtcblx0XHR0cnkge1xuXHRcdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwU2V0dGluZ3NDaGFuZ2UoYXBwSWQsIHNldHRpbmcpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUud2FybignZmFpbGVkIHRvIG5vdGlmeSBhYm91dCB0aGUgc2V0dGluZyBjaGFuZ2UuJywgYXBwSWQpO1xuXHRcdH1cblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcEh0dHBCcmlkZ2Uge1xuXHRjYWxsKGluZm8pIHtcblx0XHRpZiAoIWluZm8ucmVxdWVzdC5jb250ZW50ICYmIHR5cGVvZiBpbmZvLnJlcXVlc3QuZGF0YSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdGluZm8ucmVxdWVzdC5jb250ZW50ID0gSlNPTi5zdHJpbmdpZnkoaW5mby5yZXF1ZXN0LmRhdGEpO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGluZm8uYXBwSWQgfSBpcyByZXF1ZXN0aW5nIGZyb20gdGhlIG91dHRlciB3ZWJzOmAsIGluZm8pO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdEhUVFAuY2FsbChpbmZvLm1ldGhvZCwgaW5mby51cmwsIGluZm8ucmVxdWVzdCwgKGUsIHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gZSA/IHJlamVjdChlLnJlc3BvbnNlKSA6IHJlc29sdmUocmVzdWx0KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwTGlzdGVuZXJCcmlkZ2Uge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGFzeW5jIG1lc3NhZ2VFdmVudChpbnRlLCBtZXNzYWdlKSB7XG5cdFx0Y29uc3QgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydE1lc3NhZ2UobWVzc2FnZSk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5nZXRMaXN0ZW5lck1hbmFnZXIoKS5leGVjdXRlTGlzdGVuZXIoaW50ZSwgbXNnKTtcblxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QXBwTWVzc2FnZShyZXN1bHQpO1xuXHRcdH1cblx0XHQvLyB0cnkge1xuXG5cdFx0Ly8gfSBjYXRjaCAoZSkge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coYCR7IGUubmFtZSB9OiAkeyBlLm1lc3NhZ2UgfWApO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coZS5zdGFjayk7XG5cdFx0Ly8gfVxuXHR9XG5cblx0YXN5bmMgcm9vbUV2ZW50KGludGUsIHJvb20pIHtcblx0XHRjb25zdCBybSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRSb29tKHJvb20pO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0TGlzdGVuZXJNYW5hZ2VyKCkuZXhlY3V0ZUxpc3RlbmVyKGludGUsIHJtKTtcblxuXHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QXBwUm9vbShyZXN1bHQpO1xuXHRcdH1cblx0XHQvLyB0cnkge1xuXG5cdFx0Ly8gfSBjYXRjaCAoZSkge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coYCR7IGUubmFtZSB9OiAkeyBlLm1lc3NhZ2UgfWApO1xuXHRcdC8vIFx0Y29uc29sZS5sb2coZS5zdGFjayk7XG5cdFx0Ly8gfVxuXHR9XG59XG4iLCJjb25zdCB3YWl0VG9Mb2FkID0gZnVuY3Rpb24ob3JjaCkge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRsZXQgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAob3JjaC5pc0VuYWJsZWQoKSAmJiBvcmNoLmlzTG9hZGVkKCkpIHtcblx0XHRcdFx0Y2xlYXJJbnRlcnZhbChpZCk7XG5cdFx0XHRcdGlkID0gLTE7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH1cblx0XHR9LCAxMDApO1xuXHR9KTtcbn07XG5cbmNvbnN0IHdhaXRUb1VubG9hZCA9IGZ1bmN0aW9uKG9yY2gpIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0bGV0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuXHRcdFx0aWYgKCFvcmNoLmlzRW5hYmxlZCgpICYmICFvcmNoLmlzTG9hZGVkKCkpIHtcblx0XHRcdFx0Y2xlYXJJbnRlcnZhbChpZCk7XG5cdFx0XHRcdGlkID0gLTE7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH1cblx0XHR9LCAxMDApO1xuXHR9KTtcbn07XG5cbmV4cG9ydCBjbGFzcyBBcHBNZXRob2RzIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMuX29yY2ggPSBvcmNoO1xuXG5cdFx0dGhpcy5fYWRkTWV0aG9kcygpO1xuXHR9XG5cblx0aXNFbmFibGVkKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fb3JjaCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fb3JjaC5pc0VuYWJsZWQoKTtcblx0fVxuXG5cdGlzTG9hZGVkKCkge1xuXHRcdHJldHVybiB0eXBlb2YgdGhpcy5fb3JjaCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fb3JjaC5pc0VuYWJsZWQoKSAmJiB0aGlzLl9vcmNoLmlzTG9hZGVkKCk7XG5cdH1cblxuXHRfYWRkTWV0aG9kcygpIHtcblx0XHRjb25zdCBpbnN0YW5jZSA9IHRoaXM7XG5cblx0XHRNZXRlb3IubWV0aG9kcyh7XG5cdFx0XHQnYXBwcy9pcy1lbmFibGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIGluc3RhbmNlLmlzRW5hYmxlZCgpO1xuXHRcdFx0fSxcblxuXHRcdFx0J2FwcHMvaXMtbG9hZGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIGluc3RhbmNlLmlzTG9hZGVkKCk7XG5cdFx0XHR9LFxuXG5cdFx0XHQnYXBwcy9nby1lbmFibGUnKCkge1xuXHRcdFx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdFx0XHRtZXRob2Q6ICdhcHBzL2dvLWVuYWJsZSdcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ21hbmFnZS1hcHBzJykpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0XHRtZXRob2Q6ICdhcHBzL2dvLWVuYWJsZSdcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3Muc2V0KCdBcHBzX0ZyYW1ld29ya19lbmFibGVkJywgdHJ1ZSk7XG5cblx0XHRcdFx0UHJvbWlzZS5hd2FpdCh3YWl0VG9Mb2FkKGluc3RhbmNlLl9vcmNoKSk7XG5cdFx0XHR9LFxuXG5cdFx0XHQnYXBwcy9nby1kaXNhYmxlJygpIHtcblx0XHRcdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRcdFx0bWV0aG9kOiAnYXBwcy9nby1lbmFibGUnXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdtYW5hZ2UtYXBwcycpKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRcdFx0bWV0aG9kOiAnYXBwcy9nby1lbmFibGUnXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnNldCgnQXBwc19GcmFtZXdvcmtfZW5hYmxlZCcsIGZhbHNlKTtcblxuXHRcdFx0XHRQcm9taXNlLmF3YWl0KHdhaXRUb1VubG9hZChpbnN0YW5jZS5fb3JjaCkpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwc1Jlc3RBcGkge1xuXHRjb25zdHJ1Y3RvcihvcmNoLCBtYW5hZ2VyKSB7XG5cdFx0dGhpcy5fb3JjaCA9IG9yY2g7XG5cdFx0dGhpcy5fbWFuYWdlciA9IG1hbmFnZXI7XG5cdFx0dGhpcy5hcGkgPSBuZXcgUm9ja2V0Q2hhdC5BUEkuQXBpQ2xhc3Moe1xuXHRcdFx0dmVyc2lvbjogJ2FwcHMnLFxuXHRcdFx0dXNlRGVmYXVsdEF1dGg6IHRydWUsXG5cdFx0XHRwcmV0dHlKc29uOiBmYWxzZSxcblx0XHRcdGVuYWJsZUNvcnM6IGZhbHNlLFxuXHRcdFx0YXV0aDogUm9ja2V0Q2hhdC5BUEkuZ2V0VXNlckF1dGgoKVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRNYW5hZ2VtZW50Um91dGVzKCk7XG5cdH1cblxuXHRfaGFuZGxlRmlsZShyZXF1ZXN0LCBmaWxlRmllbGQpIHtcblx0XHRjb25zdCBCdXNib3kgPSBOcG0ucmVxdWlyZSgnYnVzYm95Jyk7XG5cdFx0Y29uc3QgYnVzYm95ID0gbmV3IEJ1c2JveSh7IGhlYWRlcnM6IHJlcXVlc3QuaGVhZGVycyB9KTtcblxuXHRcdHJldHVybiBNZXRlb3Iud3JhcEFzeW5jKChjYWxsYmFjaykgPT4ge1xuXHRcdFx0YnVzYm95Lm9uKCdmaWxlJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZmllbGRuYW1lLCBmaWxlKSA9PiB7XG5cdFx0XHRcdGlmIChmaWVsZG5hbWUgIT09IGZpbGVGaWVsZCkge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpZWxkJywgYEV4cGVjdGVkIHRoZSBmaWVsZCBcIiR7IGZpbGVGaWVsZCB9XCIgYnV0IGdvdCBcIiR7IGZpZWxkbmFtZSB9XCIgaW5zdGVhZC5gKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBmaWxlRGF0YSA9IFtdO1xuXHRcdFx0XHRmaWxlLm9uKCdkYXRhJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZGF0YSkgPT4ge1xuXHRcdFx0XHRcdGZpbGVEYXRhLnB1c2goZGF0YSk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHRmaWxlLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IGNhbGxiYWNrKHVuZGVmaW5lZCwgQnVmZmVyLmNvbmNhdChmaWxlRGF0YSkpKSk7XG5cdFx0XHR9KSk7XG5cblx0XHRcdHJlcXVlc3QucGlwZShidXNib3kpO1xuXHRcdH0pKCk7XG5cdH1cblxuXHRhZGRNYW5hZ2VtZW50Um91dGVzKCkge1xuXHRcdGNvbnN0IG9yY2hlc3RyYXRvciA9IHRoaXMuX29yY2g7XG5cdFx0Y29uc3QgbWFuYWdlciA9IHRoaXMuX21hbmFnZXI7XG5cdFx0Y29uc3QgZmlsZUhhbmRsZXIgPSB0aGlzLl9oYW5kbGVGaWxlO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc3QgYXBwcyA9IG1hbmFnZXIuZ2V0KCkubWFwKHBybCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgaW5mbyA9IHBybC5nZXRJbmZvKCk7XG5cdFx0XHRcdFx0aW5mby5sYW5ndWFnZXMgPSBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5sYW5ndWFnZUNvbnRlbnQ7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBwcmwuZ2V0U3RhdHVzKCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gaW5mbztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHBzIH0pO1xuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGxldCBidWZmO1xuXG5cdFx0XHRcdGlmICh0aGlzLmJvZHlQYXJhbXMudXJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdHRVQnLCB0aGlzLmJvZHlQYXJhbXMudXJsLCB7IG5wbVJlcXVlc3RPcHRpb25zOiB7IGVuY29kaW5nOiAnYmFzZTY0JyB9fSk7XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0LnN0YXR1c0NvZGUgIT09IDIwMCB8fCAhcmVzdWx0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddIHx8IHJlc3VsdC5oZWFkZXJzWydjb250ZW50LXR5cGUnXSAhPT0gJ2FwcGxpY2F0aW9uL3ppcCcpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHsgZXJyb3I6ICdJbnZhbGlkIHVybC4gSXQgZG9lc25cXCd0IGV4aXN0IG9yIGlzIG5vdCBcImFwcGxpY2F0aW9uL3ppcFwiLicgfSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YnVmZiA9IEJ1ZmZlci5mcm9tKHJlc3VsdC5jb250ZW50LCAnYmFzZTY0Jyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YnVmZiA9IGZpbGVIYW5kbGVyKHRoaXMucmVxdWVzdCwgJ2FwcCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCFidWZmKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoeyBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgYSBmaWxlIHRvIGluc3RhbGwgZm9yIHRoZSBBcHAuICd9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGFmZiA9IFByb21pc2UuYXdhaXQobWFuYWdlci5hZGQoYnVmZi50b1N0cmluZygnYmFzZTY0JyksIGZhbHNlKSk7XG5cdFx0XHRcdGNvbnN0IGluZm8gPSBhZmYuZ2V0QXBwSW5mbygpO1xuXG5cdFx0XHRcdC8vIElmIHRoZXJlIGFyZSBjb21waWxlciBlcnJvcnMsIHRoZXJlIHdvbid0IGJlIGFuIEFwcCB0byBnZXQgdGhlIHN0YXR1cyBvZlxuXHRcdFx0XHRpZiAoYWZmLmdldEFwcCgpKSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBhZmYuZ2V0QXBwKCkuZ2V0U3RhdHVzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSAnY29tcGlsZXJfZXJyb3InO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGFwcDogaW5mbyxcblx0XHRcdFx0XHRpbXBsZW1lbnRlZDogYWZmLmdldEltcGxlbWVudGVkSW5mZXJmYWNlcygpLFxuXHRcdFx0XHRcdGNvbXBpbGVyRXJyb3JzOiBhZmYuZ2V0Q29tcGlsZXJFcnJvcnMoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCdsYW5ndWFnZXMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zdCBhcHBzID0gbWFuYWdlci5nZXQoKS5tYXAocHJsID0+IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0aWQ6IHBybC5nZXRJRCgpLFxuXHRcdFx0XHRcdFx0bGFuZ3VhZ2VzOiBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5sYW5ndWFnZUNvbnRlbnRcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGFwcHMgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnR2V0dGluZzonLCB0aGlzLnVybFBhcmFtcy5pZCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdGNvbnN0IGluZm8gPSBwcmwuZ2V0SW5mbygpO1xuXHRcdFx0XHRcdGluZm8uc3RhdHVzID0gcHJsLmdldFN0YXR1cygpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHA6IGluZm8gfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwb3N0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnVXBkYXRpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHQvLyBUT0RPOiBWZXJpZnkgcGVybWlzc2lvbnNcblxuXHRcdFx0XHRsZXQgYnVmZjtcblxuXHRcdFx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLnVybCkge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgdGhpcy5ib2R5UGFyYW1zLnVybCwgeyBucG1SZXF1ZXN0T3B0aW9uczogeyBlbmNvZGluZzogJ2Jhc2U2NCcgfX0pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3VsdC5zdGF0dXNDb2RlICE9PSAyMDAgfHwgIXJlc3VsdC5oZWFkZXJzWydjb250ZW50LXR5cGUnXSB8fCByZXN1bHQuaGVhZGVyc1snY29udGVudC10eXBlJ10gIT09ICdhcHBsaWNhdGlvbi96aXAnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7IGVycm9yOiAnSW52YWxpZCB1cmwuIEl0IGRvZXNuXFwndCBleGlzdCBvciBpcyBub3QgXCJhcHBsaWNhdGlvbi96aXBcIi4nIH0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJ1ZmYgPSBCdWZmZXIuZnJvbShyZXN1bHQuY29udGVudCwgJ2Jhc2U2NCcpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJ1ZmYgPSBmaWxlSGFuZGxlcih0aGlzLnJlcXVlc3QsICdhcHAnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghYnVmZikge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHsgZXJyb3I6ICdGYWlsZWQgdG8gZ2V0IGEgZmlsZSB0byBpbnN0YWxsIGZvciB0aGUgQXBwLiAnfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBhZmYgPSBQcm9taXNlLmF3YWl0KG1hbmFnZXIudXBkYXRlKGJ1ZmYudG9TdHJpbmcoJ2Jhc2U2NCcpKSk7XG5cdFx0XHRcdGNvbnN0IGluZm8gPSBhZmYuZ2V0QXBwSW5mbygpO1xuXG5cdFx0XHRcdC8vIFNob3VsZCB0aGUgdXBkYXRlZCB2ZXJzaW9uIGhhdmUgY29tcGlsZXIgZXJyb3JzLCBubyBBcHAgd2lsbCBiZSByZXR1cm5lZFxuXHRcdFx0XHRpZiAoYWZmLmdldEFwcCgpKSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBhZmYuZ2V0QXBwKCkuZ2V0U3RhdHVzKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSAnY29tcGlsZXJfZXJyb3InO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGFwcDogaW5mbyxcblx0XHRcdFx0XHRpbXBsZW1lbnRlZDogYWZmLmdldEltcGxlbWVudGVkSW5mZXJmYWNlcygpLFxuXHRcdFx0XHRcdGNvbXBpbGVyRXJyb3JzOiBhZmYuZ2V0Q29tcGlsZXJFcnJvcnMoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRkZWxldGUoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdVbmluc3RhbGxpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIucmVtb3ZlKHBybC5nZXRJRCgpKSk7XG5cblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgYXBwOiBpbmZvIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL2ljb24nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdHZXR0aW5nIHRoZSBBcHBcXCdzIEljb246JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgaWNvbkZpbGVDb250ZW50OiBpbmZvLmljb25GaWxlQ29udGVudCB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZC9sYW5ndWFnZXMnLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3MgbGFuZ3VhZ2VzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgbGFuZ3VhZ2VzID0gcHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50IHx8IHt9O1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBsYW5ndWFnZXMgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvbG9ncycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYEdldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIGxvZ3MuLmApO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0XHRcdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRcdFx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IGFwcElkOiBwcmwuZ2V0SUQoKSB9KTtcblx0XHRcdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRcdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRcdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRcdFx0XHRmaWVsZHNcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0Y29uc3QgbG9ncyA9IFByb21pc2UuYXdhaXQob3JjaGVzdHJhdG9yLmdldExvZ1N0b3JhZ2UoKS5maW5kKG91clF1ZXJ5LCBvcHRpb25zKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGxvZ3MgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvc2V0dGluZ3MnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5ncy4uYCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdGNvbnN0IHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgcHJsLmdldFN0b3JhZ2VJdGVtKCkuc2V0dGluZ3MpO1xuXG5cdFx0XHRcdFx0T2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goKGspID0+IHtcblx0XHRcdFx0XHRcdGlmIChzZXR0aW5nc1trXS5oaWRkZW4pIHtcblx0XHRcdFx0XHRcdFx0ZGVsZXRlIHNldHRpbmdzW2tdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzZXR0aW5ncyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBVcGRhdGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc2V0dGluZ3MuLmApO1xuXHRcdFx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcyB8fCAhdGhpcy5ib2R5UGFyYW1zLnNldHRpbmdzKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBzZXR0aW5ncyB0byB1cGRhdGUgbXVzdCBiZSBwcmVzZW50LicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAoIXBybCkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3Qgc2V0dGluZ3MgPSBwcmwuZ2V0U3RvcmFnZUl0ZW0oKS5zZXR0aW5ncztcblxuXHRcdFx0XHRjb25zdCB1cGRhdGVkID0gW107XG5cdFx0XHRcdHRoaXMuYm9keVBhcmFtcy5zZXR0aW5ncy5mb3JFYWNoKChzKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHNldHRpbmdzW3MuaWRdKSB7XG5cdFx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyh0aGlzLnVybFBhcmFtcy5pZCwgcykpO1xuXHRcdFx0XHRcdFx0Ly8gVXBkYXRpbmc/XG5cdFx0XHRcdFx0XHR1cGRhdGVkLnB1c2gocyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVwZGF0ZWQgfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL3NldHRpbmdzLzpzZXR0aW5nSWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nIHRoZSBBcHAgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHNldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuc2V0dGluZ0lkIH1gKTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnN0IHNldHRpbmcgPSBtYW5hZ2VyLmdldFNldHRpbmdzTWFuYWdlcigpLmdldEFwcFNldHRpbmcodGhpcy51cmxQYXJhbXMuaWQsIHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCk7XG5cblx0XHRcdFx0XHRSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgc2V0dGluZyB9KTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIHNldHRpbmcgZm91bmQnKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBTZXR0aW5nIGZvdW5kIG9uIHRoZSBBcHAgYnkgdGhlIGlkIG9mOiBcIiR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9XCJgKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKGUubWVzc2FnZS5pbmNsdWRlcygnTm8gQXBwIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBVcGRhdGluZyB0aGUgQXBwICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9YCk7XG5cblx0XHRcdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuc2V0dGluZykge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdTZXR0aW5nIHRvIHVwZGF0ZSB0byBtdXN0IGJlIHByZXNlbnQgb24gdGhlIHBvc3RlZCBib2R5LicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRQcm9taXNlLmF3YWl0KG1hbmFnZXIuZ2V0U2V0dGluZ3NNYW5hZ2VyKCkudXBkYXRlQXBwU2V0dGluZyh0aGlzLnVybFBhcmFtcy5pZCwgdGhpcy5ib2R5UGFyYW1zLnNldHRpbmcpKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCdObyBzZXR0aW5nIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gU2V0dGluZyBmb3VuZCBvbiB0aGUgQXBwIGJ5IHRoZSBpZCBvZjogXCIkeyB0aGlzLnVybFBhcmFtcy5zZXR0aW5nSWQgfVwiYCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIEFwcCBmb3VuZCcpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvc3RhdHVzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc3RhdHVzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzdGF0dXM6IHBybC5nZXRTdGF0dXMoKSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnN0YXR1cyB8fCB0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnN0YXR1cyAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBzdGF0dXMgcHJvdmlkZWQsIGl0IG11c3QgYmUgXCJzdGF0dXNcIiBmaWVsZCBhbmQgYSBzdHJpbmcuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZyhgVXBkYXRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHN0YXR1cy4uLmAsIHRoaXMuYm9keVBhcmFtcy5zdGF0dXMpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBQcm9taXNlLmF3YWl0KG1hbmFnZXIuY2hhbmdlU3RhdHVzKHBybC5nZXRJRCgpLCB0aGlzLmJvZHlQYXJhbXMuc3RhdHVzKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHN0YXR1czogcmVzdWx0LmdldFN0YXR1cygpIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcFN0YXR1cywgQXBwU3RhdHVzVXRpbHMgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL0FwcFN0YXR1cyc7XG5cbmV4cG9ydCBjb25zdCBBcHBFdmVudHMgPSBPYmplY3QuZnJlZXplKHtcblx0QVBQX0FEREVEOiAnYXBwL2FkZGVkJyxcblx0QVBQX1JFTU9WRUQ6ICdhcHAvcmVtb3ZlZCcsXG5cdEFQUF9VUERBVEVEOiAnYXBwL3VwZGF0ZWQnLFxuXHRBUFBfU1RBVFVTX0NIQU5HRTogJ2FwcC9zdGF0dXNVcGRhdGUnLFxuXHRBUFBfU0VUVElOR19VUERBVEVEOiAnYXBwL3NldHRpbmdVcGRhdGVkJyxcblx0Q09NTUFORF9BRERFRDogJ2NvbW1hbmQvYWRkZWQnLFxuXHRDT01NQU5EX0RJU0FCTEVEOiAnY29tbWFuZC9kaXNhYmxlZCcsXG5cdENPTU1BTkRfVVBEQVRFRDogJ2NvbW1hbmQvdXBkYXRlZCcsXG5cdENPTU1BTkRfUkVNT1ZFRDogJ2NvbW1hbmQvcmVtb3ZlZCdcbn0pO1xuXG5leHBvcnQgY2xhc3MgQXBwU2VydmVyTGlzdGVuZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoLCBlbmdpbmVTdHJlYW1lciwgY2xpZW50U3RyZWFtZXIsIHJlY2VpdmVkKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyID0gZW5naW5lU3RyZWFtZXI7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lciA9IGNsaWVudFN0cmVhbWVyO1xuXHRcdHRoaXMucmVjZWl2ZWQgPSByZWNlaXZlZDtcblxuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9BRERFRCwgdGhpcy5vbkFwcEFkZGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB0aGlzLm9uQXBwU3RhdHVzVXBkYXRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB0aGlzLm9uQXBwU2V0dGluZ1VwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQVBQX1JFTU9WRUQsIHRoaXMub25BcHBSZW1vdmVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9VUERBVEVELCB0aGlzLm9uQXBwVXBkYXRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCB0aGlzLm9uQ29tbWFuZEFkZGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIHRoaXMub25Db21tYW5kRGlzYWJsZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9VUERBVEVELCB0aGlzLm9uQ29tbWFuZFVwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9SRU1PVkVELCB0aGlzLm9uQ29tbWFuZFJlbW92ZWQuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRhc3luYyBvbkFwcEFkZGVkKGFwcElkKSB7XG5cdFx0YXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5sb2FkT25lKGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9BRERFRCwgYXBwSWQpO1xuXHR9XG5cblx0YXN5bmMgb25BcHBTdGF0dXNVcGRhdGVkKHsgYXBwSWQsIHN0YXR1cyB9KSB7XG5cdFx0dGhpcy5yZWNlaXZlZC5zZXQoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gLCB7IGFwcElkLCBzdGF0dXMsIHdoZW46IG5ldyBEYXRlKCkgfSk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcblx0XHRcdGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZW5hYmxlKGFwcElkKTtcblx0XHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UsIHsgYXBwSWQsIHN0YXR1cyB9KTtcblx0XHR9IGVsc2UgaWYgKEFwcFN0YXR1c1V0aWxzLmlzRGlzYWJsZWQoc3RhdHVzKSkge1xuXHRcdFx0YXdhaXQgdGhpcy5vcmNoLmdldE1hbmFnZXIoKS5kaXNhYmxlKGFwcElkLCBBcHBTdGF0dXMuTUFOVUFMTFlfRElTQUJMRUQgPT09IHN0YXR1cyk7XG5cdFx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB7IGFwcElkLCBzdGF0dXMgfSk7XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgb25BcHBTZXR0aW5nVXBkYXRlZCh7IGFwcElkLCBzZXR0aW5nIH0pIHtcblx0XHR0aGlzLnJlY2VpdmVkLnNldChgJHsgQXBwRXZlbnRzLkFQUF9TRVRUSU5HX1VQREFURUQgfV8keyBhcHBJZCB9XyR7IHNldHRpbmcuaWQgfWAsIHsgYXBwSWQsIHNldHRpbmcsIHdoZW46IG5ldyBEYXRlKCkgfSk7XG5cblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmdldFNldHRpbmdzTWFuYWdlcigpLnVwZGF0ZUFwcFNldHRpbmcoYXBwSWQsIHNldHRpbmcpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCwgeyBhcHBJZCB9KTtcblx0fVxuXG5cdGFzeW5jIG9uQXBwVXBkYXRlZChhcHBJZCkge1xuXHRcdHRoaXMucmVjZWl2ZWQuc2V0KGAkeyBBcHBFdmVudHMuQVBQX1VQREFURUQgfV8keyBhcHBJZCB9YCwgeyBhcHBJZCwgd2hlbjogbmV3IERhdGUoKSB9KTtcblxuXHRcdGNvbnN0IHN0b3JhZ2VJdGVtID0gYXdhaXQgdGhpcy5vcmNoLmdldFN0b3JhZ2UoKS5yZXRyaWV2ZU9uZShhcHBJZCk7XG5cblx0XHRhd2FpdCB0aGlzLm9yY2guZ2V0TWFuYWdlcigpLnVwZGF0ZShzdG9yYWdlSXRlbS56aXApO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1VQREFURUQsIGFwcElkKTtcblx0fVxuXG5cdGFzeW5jIG9uQXBwUmVtb3ZlZChhcHBJZCkge1xuXHRcdGF3YWl0IHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkucmVtb3ZlKGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9SRU1PVkVELCBhcHBJZCk7XG5cdH1cblxuXHRhc3luYyBvbkNvbW1hbmRBZGRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCBjb21tYW5kKTtcblx0fVxuXG5cdGFzeW5jIG9uQ29tbWFuZERpc2FibGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgb25Db21tYW5kVXBkYXRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgb25Db21tYW5kUmVtb3ZlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIGNvbW1hbmQpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBTZXJ2ZXJOb3RpZmllciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyID0gbmV3IE1ldGVvci5TdHJlYW1lcignYXBwcy1lbmdpbmUnLCB7IHJldHJhbnNtaXQ6IGZhbHNlIH0pO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuc2VydmVyT25seSA9IHRydWU7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5hbGxvd1JlYWQoJ25vbmUnKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5hbGxvd1dyaXRlKCdub25lJyk7XG5cblx0XHQvLyBUaGlzIGlzIHVzZWQgdG8gYnJvYWRjYXN0IHRvIHRoZSB3ZWIgY2xpZW50c1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIgPSBuZXcgTWV0ZW9yLlN0cmVhbWVyKCdhcHBzJywgeyByZXRyYW5zbWl0OiBmYWxzZSB9KTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLnNlcnZlck9ubHkgPSB0cnVlO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuYWxsb3dSZWFkKCdhbGwnKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5hbGxvd1dyaXRlKCdub25lJyk7XG5cblx0XHR0aGlzLnJlY2VpdmVkID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMubGlzdGVuZXIgPSBuZXcgQXBwU2VydmVyTGlzdGVuZXIob3JjaCwgdGhpcy5lbmdpbmVTdHJlYW1lciwgdGhpcy5jbGllbnRTdHJlYW1lciwgdGhpcy5yZWNlaXZlZCk7XG5cdH1cblxuXHRhc3luYyBhcHBBZGRlZChhcHBJZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX0FEREVELCBhcHBJZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfQURERUQsIGFwcElkKTtcblx0fVxuXG5cdGFzeW5jIGFwcFJlbW92ZWQoYXBwSWQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9SRU1PVkVELCBhcHBJZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfUkVNT1ZFRCwgYXBwSWQpO1xuXHR9XG5cblx0YXN5bmMgYXBwVXBkYXRlZChhcHBJZCkge1xuXHRcdGlmICh0aGlzLnJlY2VpdmVkLmhhcyhgJHsgQXBwRXZlbnRzLkFQUF9VUERBVEVEIH1fJHsgYXBwSWQgfWApKSB7XG5cdFx0XHR0aGlzLnJlY2VpdmVkLmRlbGV0ZShgJHsgQXBwRXZlbnRzLkFQUF9VUERBVEVEIH1fJHsgYXBwSWQgfWApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1VQREFURUQsIGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9VUERBVEVELCBhcHBJZCk7XG5cdH1cblxuXHRhc3luYyBhcHBTdGF0dXNVcGRhdGVkKGFwcElkLCBzdGF0dXMpIHtcblx0XHRpZiAodGhpcy5yZWNlaXZlZC5oYXMoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gKSkge1xuXHRcdFx0Y29uc3QgZGV0YWlscyA9IHRoaXMucmVjZWl2ZWQuZ2V0KGAkeyBBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UgfV8keyBhcHBJZCB9YCk7XG5cdFx0XHRpZiAoZGV0YWlscy5zdGF0dXMgPT09IHN0YXR1cykge1xuXHRcdFx0XHR0aGlzLnJlY2VpdmVkLmRlbGV0ZShgJHsgQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFIH1fJHsgYXBwSWQgfWApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSwgeyBhcHBJZCwgc3RhdHVzIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UsIHsgYXBwSWQsIHN0YXR1cyB9KTtcblx0fVxuXG5cdGFzeW5jIGFwcFNldHRpbmdzQ2hhbmdlKGFwcElkLCBzZXR0aW5nKSB7XG5cdFx0aWYgKHRoaXMucmVjZWl2ZWQuaGFzKGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCkpIHtcblx0XHRcdHRoaXMucmVjZWl2ZWQuZGVsZXRlKGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB7IGFwcElkLCBzZXR0aW5nIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCwgeyBhcHBJZCB9KTtcblx0fVxuXG5cdGFzeW5jIGNvbW1hbmRBZGRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCBjb21tYW5kKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfQURERUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0YXN5bmMgY29tbWFuZERpc2FibGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9ESVNBQkxFRCwgY29tbWFuZCk7XG5cdH1cblxuXHRhc3luYyBjb21tYW5kVXBkYXRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9VUERBVEVELCBjb21tYW5kKTtcblx0fVxuXG5cdGFzeW5jIGNvbW1hbmRSZW1vdmVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfUkVNT1ZFRCwgY29tbWFuZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIGNvbW1hbmQpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBNZXRob2RzfSBmcm9tICcuL21ldGhvZHMnO1xuaW1wb3J0IHsgQXBwc1Jlc3RBcGkgfSBmcm9tICcuL3Jlc3QnO1xuaW1wb3J0IHsgQXBwRXZlbnRzLCBBcHBTZXJ2ZXJOb3RpZmllciwgQXBwU2VydmVyTGlzdGVuZXIgfSBmcm9tICcuL3dlYnNvY2tldHMnO1xuXG5leHBvcnQge1xuXHRBcHBNZXRob2RzLFxuXHRBcHBzUmVzdEFwaSxcblx0QXBwRXZlbnRzLFxuXHRBcHBTZXJ2ZXJOb3RpZmllcixcblx0QXBwU2VydmVyTGlzdGVuZXJcbn07XG4iLCJleHBvcnQgY2xhc3MgQXBwTWVzc2FnZXNDb252ZXJ0ZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGNvbnZlcnRCeUlkKG1zZ0lkKSB7XG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZ2V0T25lQnlJZChtc2dJZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0TWVzc2FnZShtc2cpO1xuXHR9XG5cblx0Y29udmVydE1lc3NhZ2UobXNnT2JqKSB7XG5cdFx0aWYgKCFtc2dPYmopIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKG1zZ09iai5yaWQpO1xuXG5cdFx0bGV0IHNlbmRlcjtcblx0XHRpZiAobXNnT2JqLnUgJiYgbXNnT2JqLnUuX2lkKSB7XG5cdFx0XHRzZW5kZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlJZChtc2dPYmoudS5faWQpO1xuXG5cdFx0XHRpZiAoIXNlbmRlcikge1xuXHRcdFx0XHRzZW5kZXIgPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0VG9BcHAobXNnT2JqLnUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBlZGl0b3I7XG5cdFx0aWYgKG1zZ09iai5lZGl0ZWRCeSkge1xuXHRcdFx0ZWRpdG9yID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5SWQobXNnT2JqLmVkaXRlZEJ5Ll9pZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0YWNobWVudHMgPSB0aGlzLl9jb252ZXJ0QXR0YWNobWVudHNUb0FwcChtc2dPYmouYXR0YWNobWVudHMpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBtc2dPYmouX2lkLFxuXHRcdFx0cm9vbSxcblx0XHRcdHNlbmRlcixcblx0XHRcdHRleHQ6IG1zZ09iai5tc2csXG5cdFx0XHRjcmVhdGVkQXQ6IG1zZ09iai50cyxcblx0XHRcdHVwZGF0ZWRBdDogbXNnT2JqLl91cGRhdGVkQXQsXG5cdFx0XHRlZGl0b3IsXG5cdFx0XHRlZGl0ZWRBdDogbXNnT2JqLmVkaXRlZEF0LFxuXHRcdFx0ZW1vamk6IG1zZ09iai5lbW9qaSxcblx0XHRcdGF2YXRhclVybDogbXNnT2JqLmF2YXRhcixcblx0XHRcdGFsaWFzOiBtc2dPYmouYWxpYXMsXG5cdFx0XHRjdXN0b21GaWVsZHM6IG1zZ09iai5jdXN0b21GaWVsZHMsXG5cdFx0XHRhdHRhY2htZW50c1xuXHRcdH07XG5cdH1cblxuXHRjb252ZXJ0QXBwTWVzc2FnZShtZXNzYWdlKSB7XG5cdFx0aWYgKCFtZXNzYWdlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJvb20uaWQpO1xuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcm9vbSBwcm92aWRlZCBvbiB0aGUgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRsZXQgdTtcblx0XHRpZiAobWVzc2FnZS5zZW5kZXIgJiYgbWVzc2FnZS5zZW5kZXIuaWQpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChtZXNzYWdlLnNlbmRlci5pZCk7XG5cblx0XHRcdGlmICh1c2VyKSB7XG5cdFx0XHRcdHUgPSB7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZSxcblx0XHRcdFx0XHRuYW1lOiB1c2VyLm5hbWVcblx0XHRcdFx0fTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHUgPSB7XG5cdFx0XHRcdFx0X2lkOiBtZXNzYWdlLnNlbmRlci5pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogbWVzc2FnZS5zZW5kZXIudXNlcm5hbWUsXG5cdFx0XHRcdFx0bmFtZTogbWVzc2FnZS5zZW5kZXIubmFtZVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBlZGl0ZWRCeTtcblx0XHRpZiAobWVzc2FnZS5lZGl0b3IpIHtcblx0XHRcdGNvbnN0IGVkaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuZWRpdG9yLmlkKTtcblx0XHRcdGVkaXRlZEJ5ID0ge1xuXHRcdFx0XHRfaWQ6IGVkaXRvci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBlZGl0b3IudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0YWNobWVudHMgPSB0aGlzLl9jb252ZXJ0QXBwQXR0YWNobWVudHMobWVzc2FnZS5hdHRhY2htZW50cyk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2lkOiBtZXNzYWdlLmlkIHx8IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiByb29tLl9pZCxcblx0XHRcdHUsXG5cdFx0XHRtc2c6IG1lc3NhZ2UudGV4dCxcblx0XHRcdHRzOiBtZXNzYWdlLmNyZWF0ZWRBdCB8fCBuZXcgRGF0ZSgpLFxuXHRcdFx0X3VwZGF0ZWRBdDogbWVzc2FnZS51cGRhdGVkQXQgfHwgbmV3IERhdGUoKSxcblx0XHRcdGVkaXRlZEJ5LFxuXHRcdFx0ZWRpdGVkQXQ6IG1lc3NhZ2UuZWRpdGVkQXQsXG5cdFx0XHRlbW9qaTogbWVzc2FnZS5lbW9qaSxcblx0XHRcdGF2YXRhcjogbWVzc2FnZS5hdmF0YXJVcmwsXG5cdFx0XHRhbGlhczogbWVzc2FnZS5hbGlhcyxcblx0XHRcdGN1c3RvbUZpZWxkczogbWVzc2FnZS5jdXN0b21GaWVsZHMsXG5cdFx0XHRhdHRhY2htZW50c1xuXHRcdH07XG5cdH1cblxuXHRfY29udmVydEFwcEF0dGFjaG1lbnRzKGF0dGFjaG1lbnRzKSB7XG5cdFx0aWYgKHR5cGVvZiBhdHRhY2htZW50cyA9PT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoYXR0YWNobWVudHMpKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHJldHVybiBhdHRhY2htZW50cy5tYXAoKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbGxhcHNlZDogYXR0YWNobWVudC5jb2xsYXBzZWQsXG5cdFx0XHRcdGNvbG9yOiBhdHRhY2htZW50LmNvbG9yLFxuXHRcdFx0XHR0ZXh0OiBhdHRhY2htZW50LnRleHQsXG5cdFx0XHRcdHRzOiBhdHRhY2htZW50LnRpbWVzdGFtcCxcblx0XHRcdFx0bWVzc2FnZV9saW5rOiBhdHRhY2htZW50LnRpbWVzdGFtcExpbmssXG5cdFx0XHRcdHRodW1iX3VybDogYXR0YWNobWVudC50aHVtYm5haWxVcmwsXG5cdFx0XHRcdGF1dGhvcl9uYW1lOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLm5hbWUgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGF1dGhvcl9saW5rOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLmxpbmsgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGF1dGhvcl9pY29uOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLmljb24gOiB1bmRlZmluZWQsXG5cdFx0XHRcdHRpdGxlOiBhdHRhY2htZW50LnRpdGxlID8gYXR0YWNobWVudC50aXRsZS52YWx1ZSA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGVfbGluazogYXR0YWNobWVudC50aXRsZSA/IGF0dGFjaG1lbnQudGl0bGUubGluayA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGVfbGlua19kb3dubG9hZDogYXR0YWNobWVudC50aXRsZSA/IGF0dGFjaG1lbnQudGl0bGUuZGlzcGxheURvd25sb2FkTGluayA6IHVuZGVmaW5lZCxcblx0XHRcdFx0aW1hZ2VfdXJsOiBhdHRhY2htZW50LmltYWdlVXJsLFxuXHRcdFx0XHRhdWRpb191cmw6IGF0dGFjaG1lbnQuYXVkaW9VcmwsXG5cdFx0XHRcdHZpZGVvX3VybDogYXR0YWNobWVudC52aWRlb1VybCxcblx0XHRcdFx0ZmllbGRzOiBhdHRhY2htZW50LmZpZWxkcyxcblx0XHRcdFx0dHlwZTogYXR0YWNobWVudC50eXBlLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogYXR0YWNobWVudC5kZXNjcmlwdGlvblxuXHRcdFx0fTtcblx0XHR9KS5tYXAoKGEpID0+IHtcblx0XHRcdE9iamVjdC5rZXlzKGEpLmZvckVhY2goKGspID0+IHtcblx0XHRcdFx0aWYgKHR5cGVvZiBhW2tdID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdGRlbGV0ZSBhW2tdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fSk7XG5cdH1cblxuXHRfY29udmVydEF0dGFjaG1lbnRzVG9BcHAoYXR0YWNobWVudHMpIHtcblx0XHRpZiAodHlwZW9mIGF0dGFjaG1lbnRzID09PSAndW5kZWZpbmVkJyB8fCAhQXJyYXkuaXNBcnJheShhdHRhY2htZW50cykpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF0dGFjaG1lbnRzLm1hcCgoYXR0YWNobWVudCkgPT4ge1xuXHRcdFx0bGV0IGF1dGhvcjtcblx0XHRcdGlmIChhdHRhY2htZW50LmF1dGhvcl9uYW1lIHx8IGF0dGFjaG1lbnQuYXV0aG9yX2xpbmsgfHwgYXR0YWNobWVudC5hdXRob3JfaWNvbikge1xuXHRcdFx0XHRhdXRob3IgPSB7XG5cdFx0XHRcdFx0bmFtZTogYXR0YWNobWVudC5hdXRob3JfbmFtZSxcblx0XHRcdFx0XHRsaW5rOiBhdHRhY2htZW50LmF1dGhvcl9saW5rLFxuXHRcdFx0XHRcdGljb246IGF0dGFjaG1lbnQuYXV0aG9yX2ljb25cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IHRpdGxlO1xuXHRcdFx0aWYgKGF0dGFjaG1lbnQudGl0bGUgfHwgYXR0YWNobWVudC50aXRsZV9saW5rIHx8IGF0dGFjaG1lbnQudGl0bGVfbGlua19kb3dubG9hZCkge1xuXHRcdFx0XHR0aXRsZSA9IHtcblx0XHRcdFx0XHR2YWx1ZTogYXR0YWNobWVudC50aXRsZSxcblx0XHRcdFx0XHRsaW5rOiBhdHRhY2htZW50LnRpdGxlX2xpbmssXG5cdFx0XHRcdFx0ZGlzcGxheURvd25sb2FkTGluazogYXR0YWNobWVudC50aXRsZV9saW5rX2Rvd25sb2FkXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbGxhcHNlZDogYXR0YWNobWVudC5jb2xsYXBzZWQsXG5cdFx0XHRcdGNvbG9yOiBhdHRhY2htZW50LmNvbG9yLFxuXHRcdFx0XHR0ZXh0OiBhdHRhY2htZW50LnRleHQsXG5cdFx0XHRcdHRpbWVzdGFtcDogYXR0YWNobWVudC50cyxcblx0XHRcdFx0dGltZXN0YW1wTGluazogYXR0YWNobWVudC5tZXNzYWdlX2xpbmssXG5cdFx0XHRcdHRodW1ibmFpbFVybDogYXR0YWNobWVudC50aHVtYl91cmwsXG5cdFx0XHRcdGF1dGhvcixcblx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdGltYWdlVXJsOiBhdHRhY2htZW50LmltYWdlX3VybCxcblx0XHRcdFx0YXVkaW9Vcmw6IGF0dGFjaG1lbnQuYXVkaW9fdXJsLFxuXHRcdFx0XHR2aWRlb1VybDogYXR0YWNobWVudC52aWRlb191cmwsXG5cdFx0XHRcdGZpZWxkczogYXR0YWNobWVudC5maWVsZHMsXG5cdFx0XHRcdHR5cGU6IGF0dGFjaG1lbnQudHlwZSxcblx0XHRcdFx0ZGVzY3JpcHRpb246IGF0dGFjaG1lbnQuZGVzY3JpcHRpb25cblx0XHRcdH07XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJvb21UeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9yb29tcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSb29tc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQocm9vbUlkKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb21JZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0Um9vbShyb29tKTtcblx0fVxuXG5cdGNvbnZlcnRCeU5hbWUocm9vbU5hbWUpIHtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShyb29tTmFtZSk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0Um9vbShyb29tKTtcblx0fVxuXG5cdGNvbnZlcnRBcHBSb29tKHJvb20pIHtcblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0bGV0IHU7XG5cdFx0aWYgKHJvb20uY3JlYXRvcikge1xuXHRcdFx0Y29uc3QgY3JlYXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvb20uY3JlYXRvci5pZCk7XG5cdFx0XHR1ID0ge1xuXHRcdFx0XHRfaWQ6IGNyZWF0b3IuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogY3JlYXRvci51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2lkOiByb29tLmlkLFxuXHRcdFx0Zm5hbWU6IHJvb20uZGlzcGxheU5hbWUsXG5cdFx0XHRuYW1lOiByb29tLnNsdWdpZmllZE5hbWUsXG5cdFx0XHR0OiByb29tLnR5cGUsXG5cdFx0XHR1LFxuXHRcdFx0bWVtYmVyczogcm9vbS5tZW1iZXJzLFxuXHRcdFx0ZGVmYXVsdDogdHlwZW9mIHJvb20uaXNEZWZhdWx0ID09PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogcm9vbS5pc0RlZmF1bHQsXG5cdFx0XHRybzogdHlwZW9mIHJvb20uaXNSZWFkT25seSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHJvb20uaXNSZWFkT25seSxcblx0XHRcdHN5c01lczogdHlwZW9mIHJvb20uZGlzcGxheVN5c3RlbU1lc3NhZ2VzID09PSAndW5kZWZpbmVkJyA/IHRydWUgOiByb29tLmRpc3BsYXlTeXN0ZW1NZXNzYWdlcyxcblx0XHRcdG1zZ3M6IHJvb20ubWVzc2FnZUNvdW50IHx8IDAsXG5cdFx0XHR0czogcm9vbS5jcmVhdGVkQXQsXG5cdFx0XHRfdXBkYXRlZEF0OiByb29tLnVwZGF0ZWRBdCxcblx0XHRcdGxtOiByb29tLmxhc3RNb2RpZmllZEF0XG5cdFx0fTtcblx0fVxuXG5cdGNvbnZlcnRSb29tKHJvb20pIHtcblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGNyZWF0b3I7XG5cdFx0aWYgKHJvb20udSkge1xuXHRcdFx0Y3JlYXRvciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKHJvb20udS5faWQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogcm9vbS5faWQsXG5cdFx0XHRkaXNwbGF5TmFtZTogcm9vbS5mbmFtZSxcblx0XHRcdHNsdWdpZmllZE5hbWU6IHJvb20ubmFtZSxcblx0XHRcdHR5cGU6IHRoaXMuX2NvbnZlcnRUeXBlVG9BcHAocm9vbS50KSxcblx0XHRcdGNyZWF0b3IsXG5cdFx0XHRtZW1iZXJzOiByb29tLm1lbWJlcnMsXG5cdFx0XHRpc0RlZmF1bHQ6IHR5cGVvZiByb29tLmRlZmF1bHQgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiByb29tLmRlZmF1bHQsXG5cdFx0XHRpc1JlYWRPbmx5OiB0eXBlb2Ygcm9vbS5ybyA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHJvb20ucm8sXG5cdFx0XHRkaXNwbGF5U3lzdGVtTWVzc2FnZXM6IHR5cGVvZiByb29tLnN5c01lcyA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogcm9vbS5zeXNNZXMsXG5cdFx0XHRtZXNzYWdlQ291bnQ6IHJvb20ubXNncyxcblx0XHRcdGNyZWF0ZWRBdDogcm9vbS50cyxcblx0XHRcdHVwZGF0ZWRBdDogcm9vbS5fdXBkYXRlZEF0LFxuXHRcdFx0bGFzdE1vZGlmaWVkQXQ6IHJvb20ubG0sXG5cdFx0XHRjdXN0b21GaWVsZHM6IHt9XG5cdFx0fTtcblx0fVxuXG5cdF9jb252ZXJ0VHlwZVRvQXBwKHR5cGVDaGFyKSB7XG5cdFx0c3dpdGNoICh0eXBlQ2hhcikge1xuXHRcdFx0Y2FzZSAnYyc6XG5cdFx0XHRcdHJldHVybiBSb29tVHlwZS5DSEFOTkVMO1xuXHRcdFx0Y2FzZSAncCc6XG5cdFx0XHRcdHJldHVybiBSb29tVHlwZS5QUklWQVRFX0dST1VQO1xuXHRcdFx0Y2FzZSAnZCc6XG5cdFx0XHRcdHJldHVybiBSb29tVHlwZS5ESVJFQ1RfTUVTU0FHRTtcblx0XHRcdGNhc2UgJ2xjJzpcblx0XHRcdFx0cmV0dXJuIFJvb21UeXBlLkxJVkVfQ0hBVDtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiB0eXBlQ2hhcjtcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IFNldHRpbmdUeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9zZXR0aW5ncyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBTZXR0aW5nc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQoc2V0dGluZ0lkKSB7XG5cdFx0Y29uc3Qgc2V0dGluZyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmVCeUlkKHNldHRpbmdJZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0VG9BcHAoc2V0dGluZyk7XG5cdH1cblxuXHRjb252ZXJ0VG9BcHAoc2V0dGluZykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogc2V0dGluZy5faWQsXG5cdFx0XHR0eXBlOiB0aGlzLl9jb252ZXJ0VHlwZVRvQXBwKHNldHRpbmcudHlwZSksXG5cdFx0XHRwYWNrYWdlVmFsdWU6IHNldHRpbmcucGFja2FnZVZhbHVlLFxuXHRcdFx0dmFsdWVzOiBzZXR0aW5nLnZhbHVlcyxcblx0XHRcdHZhbHVlOiBzZXR0aW5nLnZhbHVlLFxuXHRcdFx0cHVibGljOiBzZXR0aW5nLnB1YmxpYyxcblx0XHRcdGhpZGRlbjogc2V0dGluZy5oaWRkZW4sXG5cdFx0XHRncm91cDogc2V0dGluZy5ncm91cCxcblx0XHRcdGkxOG5MYWJlbDogc2V0dGluZy5pMThuTGFiZWwsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246IHNldHRpbmcuaTE4bkRlc2NyaXB0aW9uLFxuXHRcdFx0Y3JlYXRlZEF0OiBzZXR0aW5nLnRzLFxuXHRcdFx0dXBkYXRlZEF0OiBzZXR0aW5nLl91cGRhdGVkQXRcblx0XHR9O1xuXHR9XG5cblx0X2NvbnZlcnRUeXBlVG9BcHAodHlwZSkge1xuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSAnYm9vbGVhbic6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5CT09MRUFOO1xuXHRcdFx0Y2FzZSAnY29kZSc6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5DT0RFO1xuXHRcdFx0Y2FzZSAnY29sb3InOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuQ09MT1I7XG5cdFx0XHRjYXNlICdmb250Jzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLkZPTlQ7XG5cdFx0XHRjYXNlICdpbnQnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuTlVNQkVSO1xuXHRcdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLlNFTEVDVDtcblx0XHRcdGNhc2UgJ3N0cmluZyc6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5TVFJJTkc7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdHlwZTtcblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IFVzZXJTdGF0dXNDb25uZWN0aW9uLCBVc2VyVHlwZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLXRzLWRlZmluaXRpb24vdXNlcnMnO1xuXG5leHBvcnQgY2xhc3MgQXBwVXNlcnNDb252ZXJ0ZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGNvbnZlcnRCeUlkKHVzZXJJZCkge1xuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXG5cdFx0cmV0dXJuIHRoaXMuY29udmVydFRvQXBwKHVzZXIpO1xuXHR9XG5cblx0Y29udmVydEJ5VXNlcm5hbWUodXNlcm5hbWUpIHtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXG5cdFx0cmV0dXJuIHRoaXMuY29udmVydFRvQXBwKHVzZXIpO1xuXHR9XG5cblx0Y29udmVydFRvQXBwKHVzZXIpIHtcblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHlwZSA9IHRoaXMuX2NvbnZlcnRVc2VyVHlwZVRvRW51bSh1c2VyLnR5cGUpO1xuXHRcdGNvbnN0IHN0YXR1c0Nvbm5lY3Rpb24gPSB0aGlzLl9jb252ZXJ0U3RhdHVzQ29ubmVjdGlvblRvRW51bSh1c2VyLnVzZXJuYW1lLCB1c2VyLl9pZCwgdXNlci5zdGF0dXNDb25uZWN0aW9uKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogdXNlci5faWQsXG5cdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZSxcblx0XHRcdGVtYWlsczogdXNlci5lbWFpbHMsXG5cdFx0XHR0eXBlLFxuXHRcdFx0aXNFbmFibGVkOiB1c2VyLmFjdGl2ZSxcblx0XHRcdG5hbWU6IHVzZXIubmFtZSxcblx0XHRcdHJvbGVzOiB1c2VyLnJvbGVzLFxuXHRcdFx0c3RhdHVzOiB1c2VyLnN0YXR1cyxcblx0XHRcdHN0YXR1c0Nvbm5lY3Rpb24sXG5cdFx0XHR1dGNPZmZzZXQ6IHVzZXIudXRjT2Zmc2V0LFxuXHRcdFx0Y3JlYXRlZEF0OiB1c2VyLmNyZWF0ZWRBdCxcblx0XHRcdHVwZGF0ZWRBdDogdXNlci5fdXBkYXRlZEF0LFxuXHRcdFx0bGFzdExvZ2luQXQ6IHVzZXIubGFzdExvZ2luXG5cdFx0fTtcblx0fVxuXG5cdF9jb252ZXJ0VXNlclR5cGVUb0VudW0odHlwZSkge1xuXHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0Y2FzZSAndXNlcic6XG5cdFx0XHRcdHJldHVybiBVc2VyVHlwZS5VU0VSO1xuXHRcdFx0Y2FzZSAnYm90Jzpcblx0XHRcdFx0cmV0dXJuIFVzZXJUeXBlLkJPVDtcblx0XHRcdGNhc2UgJyc6XG5cdFx0XHRjYXNlIHVuZGVmaW5lZDpcblx0XHRcdFx0cmV0dXJuIFVzZXJUeXBlLlVOS05PV047XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRjb25zb2xlLndhcm4oYEEgbmV3IHVzZXIgdHlwZSBoYXMgYmVlbiBhZGRlZCB0aGF0IHRoZSBBcHBzIGRvbid0IGtub3cgYWJvdXQ/IFwiJHsgdHlwZSB9XCJgKTtcblx0XHRcdFx0cmV0dXJuIHR5cGUudG9VcHBlckNhc2UoKTtcblx0XHR9XG5cdH1cblxuXHRfY29udmVydFN0YXR1c0Nvbm5lY3Rpb25Ub0VudW0odXNlcm5hbWUsIHVzZXJJZCwgc3RhdHVzKSB7XG5cdFx0c3dpdGNoIChzdGF0dXMpIHtcblx0XHRcdGNhc2UgJ29mZmxpbmUnOlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uT0ZGTElORTtcblx0XHRcdGNhc2UgJ29ubGluZSc6XG5cdFx0XHRcdHJldHVybiBVc2VyU3RhdHVzQ29ubmVjdGlvbi5PTkxJTkU7XG5cdFx0XHRjYXNlICdhd2F5Jzpcblx0XHRcdFx0cmV0dXJuIFVzZXJTdGF0dXNDb25uZWN0aW9uLkFXQVk7XG5cdFx0XHRjYXNlICdidXN5Jzpcblx0XHRcdFx0cmV0dXJuIFVzZXJTdGF0dXNDb25uZWN0aW9uLkJVU1k7XG5cdFx0XHRjYXNlIHVuZGVmaW5lZDpcblx0XHRcdFx0Ly8gVGhpcyBpcyBuZWVkZWQgZm9yIExpdmVjaGF0IGd1ZXN0cyBhbmQgUm9ja2V0LkNhdCB1c2VyLlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uVU5ERUZJTkVEO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0Y29uc29sZS53YXJuKGBUaGUgdXNlciAkeyB1c2VybmFtZSB9ICgkeyB1c2VySWQgfSkgZG9lcyBub3QgaGF2ZSBhIHZhbGlkIHN0YXR1cyAob2ZmbGluZSwgb25saW5lLCBhd2F5LCBvciBidXN5KS4gSXQgaXMgY3VycmVudGx5OiBcIiR7IHN0YXR1cyB9XCJgKTtcblx0XHRcdFx0cmV0dXJuICFzdGF0dXMgPyBVc2VyU3RhdHVzQ29ubmVjdGlvbi5PRkZMSU5FIDogc3RhdHVzLnRvVXBwZXJDYXNlKCk7XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBNZXNzYWdlc0NvbnZlcnRlciB9IGZyb20gJy4vbWVzc2FnZXMnO1xuaW1wb3J0IHsgQXBwUm9vbXNDb252ZXJ0ZXIgfSBmcm9tICcuL3Jvb21zJztcbmltcG9ydCB7IEFwcFNldHRpbmdzQ29udmVydGVyIH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyBBcHBVc2Vyc0NvbnZlcnRlciB9IGZyb20gJy4vdXNlcnMnO1xuXG5leHBvcnQge1xuXHRBcHBNZXNzYWdlc0NvbnZlcnRlcixcblx0QXBwUm9vbXNDb252ZXJ0ZXIsXG5cdEFwcFNldHRpbmdzQ29udmVydGVyLFxuXHRBcHBVc2Vyc0NvbnZlcnRlclxufTtcbiIsImltcG9ydCB7IFJlYWxBcHBCcmlkZ2VzIH0gZnJvbSAnLi9icmlkZ2VzJztcbmltcG9ydCB7IEFwcE1ldGhvZHMsIEFwcHNSZXN0QXBpLCBBcHBTZXJ2ZXJOb3RpZmllciB9IGZyb20gJy4vY29tbXVuaWNhdGlvbic7XG5pbXBvcnQgeyBBcHBNZXNzYWdlc0NvbnZlcnRlciwgQXBwUm9vbXNDb252ZXJ0ZXIsIEFwcFNldHRpbmdzQ29udmVydGVyLCBBcHBVc2Vyc0NvbnZlcnRlciB9IGZyb20gJy4vY29udmVydGVycyc7XG5pbXBvcnQgeyBBcHBzTG9nc01vZGVsLCBBcHBzTW9kZWwsIEFwcHNQZXJzaXN0ZW5jZU1vZGVsLCBBcHBSZWFsU3RvcmFnZSwgQXBwUmVhbExvZ3NTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuaW1wb3J0IHsgQXBwTWFuYWdlciB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvQXBwTWFuYWdlcic7XG5cbmNsYXNzIEFwcFNlcnZlck9yY2hlc3RyYXRvciB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdGlmIChSb2NrZXRDaGF0Lm1vZGVscyAmJiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucykge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ21hbmFnZS1hcHBzJywgWydhZG1pbiddKTtcblx0XHR9XG5cblx0XHR0aGlzLl9tb2RlbCA9IG5ldyBBcHBzTW9kZWwoKTtcblx0XHR0aGlzLl9sb2dNb2RlbCA9IG5ldyBBcHBzTG9nc01vZGVsKCk7XG5cdFx0dGhpcy5fcGVyc2lzdE1vZGVsID0gbmV3IEFwcHNQZXJzaXN0ZW5jZU1vZGVsKCk7XG5cdFx0dGhpcy5fc3RvcmFnZSA9IG5ldyBBcHBSZWFsU3RvcmFnZSh0aGlzLl9tb2RlbCk7XG5cdFx0dGhpcy5fbG9nU3RvcmFnZSA9IG5ldyBBcHBSZWFsTG9nc1N0b3JhZ2UodGhpcy5fbG9nTW9kZWwpO1xuXG5cdFx0dGhpcy5fY29udmVydGVycyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLl9jb252ZXJ0ZXJzLnNldCgnbWVzc2FnZXMnLCBuZXcgQXBwTWVzc2FnZXNDb252ZXJ0ZXIodGhpcykpO1xuXHRcdHRoaXMuX2NvbnZlcnRlcnMuc2V0KCdyb29tcycsIG5ldyBBcHBSb29tc0NvbnZlcnRlcih0aGlzKSk7XG5cdFx0dGhpcy5fY29udmVydGVycy5zZXQoJ3NldHRpbmdzJywgbmV3IEFwcFNldHRpbmdzQ29udmVydGVyKHRoaXMpKTtcblx0XHR0aGlzLl9jb252ZXJ0ZXJzLnNldCgndXNlcnMnLCBuZXcgQXBwVXNlcnNDb252ZXJ0ZXIodGhpcykpO1xuXG5cdFx0dGhpcy5fYnJpZGdlcyA9IG5ldyBSZWFsQXBwQnJpZGdlcyh0aGlzKTtcblxuXHRcdHRoaXMuX21hbmFnZXIgPSBuZXcgQXBwTWFuYWdlcih0aGlzLl9zdG9yYWdlLCB0aGlzLl9sb2dTdG9yYWdlLCB0aGlzLl9icmlkZ2VzKTtcblxuXHRcdHRoaXMuX2NvbW11bmljYXRvcnMgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5fY29tbXVuaWNhdG9ycy5zZXQoJ21ldGhvZHMnLCBuZXcgQXBwTWV0aG9kcyh0aGlzKSk7XG5cdFx0dGhpcy5fY29tbXVuaWNhdG9ycy5zZXQoJ25vdGlmaWVyJywgbmV3IEFwcFNlcnZlck5vdGlmaWVyKHRoaXMpKTtcblx0XHR0aGlzLl9jb21tdW5pY2F0b3JzLnNldCgncmVzdGFwaScsIG5ldyBBcHBzUmVzdEFwaSh0aGlzLCB0aGlzLl9tYW5hZ2VyKSk7XG5cdH1cblxuXHRnZXRNb2RlbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbW9kZWw7XG5cdH1cblxuXHRnZXRQZXJzaXN0ZW5jZU1vZGVsKCkge1xuXHRcdHJldHVybiB0aGlzLl9wZXJzaXN0TW9kZWw7XG5cdH1cblxuXHRnZXRTdG9yYWdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9zdG9yYWdlO1xuXHR9XG5cblx0Z2V0TG9nU3RvcmFnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbG9nU3RvcmFnZTtcblx0fVxuXG5cdGdldENvbnZlcnRlcnMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NvbnZlcnRlcnM7XG5cdH1cblxuXHRnZXRCcmlkZ2VzKCkge1xuXHRcdHJldHVybiB0aGlzLl9icmlkZ2VzO1xuXHR9XG5cblx0Z2V0Tm90aWZpZXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NvbW11bmljYXRvcnMuZ2V0KCdub3RpZmllcicpO1xuXHR9XG5cblx0Z2V0TWFuYWdlcigpIHtcblx0XHRyZXR1cm4gdGhpcy5fbWFuYWdlcjtcblx0fVxuXG5cdGlzRW5hYmxlZCgpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FwcHNfRnJhbWV3b3JrX2VuYWJsZWQnKTtcblx0fVxuXG5cdGlzTG9hZGVkKCkge1xuXHRcdHJldHVybiB0aGlzLmdldE1hbmFnZXIoKS5hcmVBcHBzTG9hZGVkKCk7XG5cdH1cblxuXHRsb2FkKCkge1xuXHRcdC8vIERvbid0IHRyeSB0byBsb2FkIGl0IGFnYWluIGlmIGl0IGhhc1xuXHRcdC8vIGFscmVhZHkgYmVlbiBsb2FkZWRcblx0XHRpZiAodGhpcy5pc0xvYWRlZCgpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fbWFuYWdlci5sb2FkKClcblx0XHRcdC50aGVuKChhZmZzKSA9PiBjb25zb2xlLmxvZyhgTG9hZGVkIHRoZSBBcHBzIEZyYW1ld29yayBhbmQgbG9hZGVkIGEgdG90YWwgb2YgJHsgYWZmcy5sZW5ndGggfSBBcHBzIWApKVxuXHRcdFx0LmNhdGNoKChlcnIpID0+IGNvbnNvbGUud2FybignRmFpbGVkIHRvIGxvYWQgdGhlIEFwcHMgRnJhbWV3b3JrIGFuZCBBcHBzIScsIGVycikpO1xuXHR9XG5cblx0dW5sb2FkKCkge1xuXHRcdC8vIERvbid0IHRyeSB0byB1bmxvYWQgaXQgaWYgaXQncyBhbHJlYWR5IGJlZW5cblx0XHQvLyB1bmxhb2RlZCBvciB3YXNuJ3QgdW5sb2FkZWQgdG8gc3RhcnQgd2l0aFxuXHRcdGlmICghdGhpcy5pc0xvYWRlZCgpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fbWFuYWdlci51bmxvYWQoKVxuXHRcdFx0LnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ1VubG9hZGVkIHRoZSBBcHBzIEZyYW1ld29yay4nKSlcblx0XHRcdC5jYXRjaCgoZXJyKSA9PiBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byB1bmxvYWQgdGhlIEFwcHMgRnJhbWV3b3JrIScsIGVycikpO1xuXHR9XG59XG5cblJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdBcHBzX0ZyYW1ld29ya19lbmFibGVkJywgZmFsc2UsIHtcblx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRoaWRkZW46IHRydWVcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQXBwc19GcmFtZXdvcmtfZW5hYmxlZCcsIChrZXksIGlzRW5hYmxlZCkgPT4ge1xuXHQvLyBJbiBjYXNlIHRoaXMgZ2V0cyBjYWxsZWQgYmVmb3JlIGBNZXRlb3Iuc3RhcnR1cGBcblx0aWYgKCFnbG9iYWwuQXBwcykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmIChpc0VuYWJsZWQpIHtcblx0XHRnbG9iYWwuQXBwcy5sb2FkKCk7XG5cdH0gZWxzZSB7XG5cdFx0Z2xvYmFsLkFwcHMudW5sb2FkKCk7XG5cdH1cbn0pO1xuXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbiBfYXBwU2VydmVyT3JjaGVzdHJhdG9yKCkge1xuXHRnbG9iYWwuQXBwcyA9IG5ldyBBcHBTZXJ2ZXJPcmNoZXN0cmF0b3IoKTtcblxuXHRpZiAoZ2xvYmFsLkFwcHMuaXNFbmFibGVkKCkpIHtcblx0XHRnbG9iYWwuQXBwcy5sb2FkKCk7XG5cdH1cbn0pO1xuIl19
