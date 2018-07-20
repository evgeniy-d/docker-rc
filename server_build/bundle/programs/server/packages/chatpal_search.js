(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var Inject = Package['meteorhacks:inject-initial'].Inject;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var date;

var require = meteorInstall({"node_modules":{"meteor":{"chatpal:search":{"server":{"provider":{"provider.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/chatpal_search/server/provider/provider.js                                                            //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let searchProviderService;
module.watch(require("meteor/rocketchat:search"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchProvider;
module.watch(require("meteor/rocketchat:search"), {
  SearchProvider(v) {
    SearchProvider = v;
  }

}, 1);
let Index;
module.watch(require("./index"), {
  default(v) {
    Index = v;
  }

}, 2);
let ChatpalLogger;
module.watch(require("../utils/logger"), {
  default(v) {
    ChatpalLogger = v;
  }

}, 3);

/**
 * The chatpal search provider enables chatpal search. An appropriate backedn has to be specified by settings.
 */
class ChatpalProvider extends SearchProvider {
  /**
   * Create chatpal provider with some settings for backend and ui
   */
  constructor() {
    super('chatpalProvider');
    this.chatpalBaseUrl = 'https://beta.chatpal.io/v1';

    this._settings.add('Backend', 'select', 'cloud', {
      values: [{
        key: 'cloud',
        i18nLabel: 'Cloud Service'
      }, {
        key: 'onsite',
        i18nLabel: 'On-Site'
      }],
      i18nLabel: 'Chatpal_Backend',
      i18nDescription: 'Chatpal_Backend_Description'
    });

    this._settings.add('API_Key', 'string', '', {
      enableQuery: [{
        _id: 'Search.chatpalProvider.Backend',
        value: 'cloud'
      }],
      i18nLabel: 'Chatpal_API_Key',
      i18nDescription: 'Chatpal_API_Key_Description'
    });

    this._settings.add('Base_URL', 'string', '', {
      enableQuery: [{
        _id: 'Search.chatpalProvider.Backend',
        value: 'onsite'
      }],
      i18nLabel: 'Chatpal_Base_URL',
      i18nDescription: 'Chatpal_Base_URL_Description'
    });

    this._settings.add('HTTP_Headers', 'string', '', {
      enableQuery: [{
        _id: 'Search.chatpalProvider.Backend',
        value: 'onsite'
      }],
      multiline: true,
      i18nLabel: 'Chatpal_HTTP_Headers',
      i18nDescription: 'Chatpal_HTTP_Headers_Description'
    });

    this._settings.add('Main_Language', 'select', 'en', {
      values: [{
        key: 'en',
        i18nLabel: 'English'
      }, {
        key: 'none',
        i18nLabel: 'Language_Not_set'
      }, {
        key: 'cs',
        i18nLabel: 'Czech'
      }, {
        key: 'de',
        i18nLabel: 'Deutsch'
      }, {
        key: 'el',
        i18nLabel: 'Greek'
      }, {
        key: 'es',
        i18nLabel: 'Spanish'
      }, {
        key: 'fi',
        i18nLabel: 'Finish'
      }, {
        key: 'fr',
        i18nLabel: 'French'
      }, {
        key: 'hu',
        i18nLabel: 'Hungarian'
      }, {
        key: 'it',
        i18nLabel: 'Italian'
      }, {
        key: 'nl',
        i18nLabel: 'Dutsch'
      }, {
        key: 'pl',
        i18nLabel: 'Polish'
      }, {
        key: 'pt',
        i18nLabel: 'Portuguese'
      }, {
        key: 'pt_BR',
        i18nLabel: 'Brasilian'
      }, {
        key: 'ro',
        i18nLabel: 'Romanian'
      }, {
        key: 'ru',
        i18nLabel: 'Russian'
      }, {
        key: 'sv',
        i18nLabel: 'Swedisch'
      }, {
        key: 'tr',
        i18nLabel: 'Turkish'
      }, {
        key: 'uk',
        i18nLabel: 'Ukrainian'
      }],
      i18nLabel: 'Chatpal_Main_Language',
      i18nDescription: 'Chatpal_Main_Language_Description'
    });

    this._settings.add('DefaultResultType', 'select', 'All', {
      values: [{
        key: 'All',
        i18nLabel: 'All'
      }, {
        key: 'Messages',
        i18nLabel: 'Messages'
      }],
      i18nLabel: 'Chatpal_Default_Result_Type',
      i18nDescription: 'Chatpal_Default_Result_Type_Description'
    });

    this._settings.add('PageSize', 'int', 15, {
      i18nLabel: 'Search_Page_Size'
    });

    this._settings.add('SuggestionEnabled', 'boolean', true, {
      i18nLabel: 'Chatpal_Suggestion_Enabled',
      alert: 'This feature is currently in beta and will be extended in the future'
    });

    this._settings.add('BatchSize', 'int', 100, {
      i18nLabel: 'Chatpal_Batch_Size',
      i18nDescription: 'Chatpal_Batch_Size_Description'
    });

    this._settings.add('TimeoutSize', 'int', 5000, {
      i18nLabel: 'Chatpal_Timeout_Size',
      i18nDescription: 'Chatpal_Timeout_Size_Description'
    });

    this._settings.add('WindowSize', 'int', 48, {
      i18nLabel: 'Chatpal_Window_Size',
      i18nDescription: 'Chatpal_Window_Size_Description'
    });
  }

  get i18nLabel() {
    return 'Chatpal Provider';
  }

  get iconName() {
    return 'chatpal-logo-icon-darkblue';
  }

  get resultTemplate() {
    return 'ChatpalSearchResultTemplate';
  }

  get suggestionItemTemplate() {
    return 'ChatpalSuggestionItemTemplate';
  }

  get supportsSuggestions() {
    return this._settings.get('SuggestionEnabled');
  }
  /**
   * indexing for messages, rooms and users
   * @inheritDoc
   */


  on(name, value, payload) {
    if (!this.index) {
      this.indexFail = true;
      return false;
    }

    switch (name) {
      case 'message.save':
        return this.index.indexDoc('message', payload);

      case 'user.save':
        return this.index.indexDoc('user', payload);

      case 'room.save':
        return this.index.indexDoc('room', payload);

      case 'message.delete':
        return this.index.removeDoc('message', value);

      case 'user.delete':
        return this.index.removeDoc('user', value);

      case 'room.delete':
        return this.index.removeDoc('room', value);
    }

    return true;
  }
  /**
   * Check if the index has to be deleted and completely new reindexed
   * @param reason the reason for the provider start
   * @returns {boolean}
   * @private
   */


  _checkForClear(reason) {
    if (reason === 'startup') {
      return false;
    }

    if (reason === 'switch') {
      return true;
    }

    return this._indexConfig.backendtype !== this._settings.get('Backend') || this._indexConfig.backendtype === 'onsite' && this._indexConfig.baseurl !== (this._settings.get('Base_URL').endsWith('/') ? this._settings.get('Base_URL').slice(0, -1) : this._settings.get('Base_URL')) || this._indexConfig.backendtype === 'cloud' && this._indexConfig.httpOptions.headers['X-Api-Key'] !== this._settings.get('API_Key') || this._indexConfig.language !== this._settings.get('Main_Language');
  }
  /**
   * parse string to object that can be used as header for HTTP calls
   * @returns {{}}
   * @private
   */


  _parseHeaders() {
    const headers = {};

    const sh = this._settings.get('HTTP_Headers').split('\n');

    sh.forEach(function (d) {
      const ds = d.split(':');

      if (ds.length === 2 && ds[0].trim() !== '') {
        headers[ds[0]] = ds[1];
      }
    });
    return headers;
  }
  /**
   * ping if configuration has been set correctly
   * @param config
   * @param resolve if ping was successfull
   * @param reject if some error occurs
   * @param timeout until ping is repeated
   * @private
   */


  _ping(config, resolve, reject, timeout = 5000) {
    const maxTimeout = 200000;
    const stats = Index.ping(config);

    if (stats) {
      ChatpalLogger.debug('ping was successfull');
      resolve({
        config,
        stats
      });
    } else {
      ChatpalLogger.warn(`ping failed, retry in ${timeout} ms`);
      this._pingTimeout = Meteor.setTimeout(() => {
        this._ping(config, resolve, reject, Math.min(maxTimeout, 2 * timeout));
      }, timeout);
    }
  }
  /**
   * Get index config based on settings
   * @param callback
   * @private
   */


  _getIndexConfig() {
    return new Promise((resolve, reject) => {
      const config = {
        backendtype: this._settings.get('Backend')
      };

      if (this._settings.get('Backend') === 'cloud') {
        config.baseurl = this.chatpalBaseUrl;
        config.language = this._settings.get('Main_Language');
        config.searchpath = '/search/search';
        config.updatepath = '/search/update';
        config.pingpath = '/search/ping';
        config.clearpath = '/search/clear';
        config.suggestionpath = '/search/suggest';
        config.httpOptions = {
          headers: {
            'X-Api-Key': this._settings.get('API_Key')
          }
        };
      } else {
        config.baseurl = this._settings.get('Base_URL').endsWith('/') ? this._settings.get('Base_URL').slice(0, -1) : this._settings.get('Base_URL');
        config.language = this._settings.get('Main_Language');
        config.searchpath = '/chatpal/search';
        config.updatepath = '/chatpal/update';
        config.pingpath = '/chatpal/ping';
        config.clearpath = '/chatpal/clear';
        config.suggestionpath = '/chatpal/suggest';
        config.httpOptions = {
          headers: this._parseHeaders()
        };
      }

      config.batchSize = this._settings.get('BatchSize');
      config.timeout = this._settings.get('TimeoutSize');
      config.windowSize = this._settings.get('WindowSize');

      this._ping(config, resolve, reject);
    });
  }
  /**
   * @inheritDoc
   * @param callback
   */


  stop(resolve) {
    ChatpalLogger.info('Provider stopped');
    Meteor.clearTimeout(this._pingTimeout);
    this.indexFail = false;
    this.index && this.index.stop();
    resolve();
  }
  /**
   * @inheritDoc
   * @param reason
   * @param resolve
   * @param reject
   */


  start(reason, resolve, reject) {
    const clear = this._checkForClear(reason);

    ChatpalLogger.debug(`clear = ${clear} with reason '${reason}'`);

    this._getIndexConfig().then(server => {
      this._indexConfig = server.config;
      this._stats = server.stats;
      ChatpalLogger.debug('config:', JSON.stringify(this._indexConfig, null, 2));
      ChatpalLogger.debug('stats:', JSON.stringify(this._stats, null, 2));
      this.index = new Index(this._indexConfig, this.indexFail || clear, this._stats.message.oldest || new Date().valueOf());
      resolve();
    }, reject);
  }
  /**
   * returns a list of rooms that are allowed to see by current user
   * @param context
   * @private
   */


  _getAcl(context) {
    return RocketChat.models.Subscriptions.find({
      'u._id': context.uid
    }).fetch().map(room => room.rid);
  }
  /**
   * @inheritDoc
   * @returns {*}
   */


  search(text, context, payload, callback) {
    if (!this.index) {
      return callback({
        msg: 'Chatpal_currently_not_active'
      });
    }

    const type = payload.resultType === 'All' ? ['message', 'user', 'room'] : ['message'];
    this.index.query(text, this._settings.get('Main_Language'), this._getAcl(context), type, payload.start || 0, payload.rows || this._settings.get('PageSize'), callback);
  }
  /**
   * @inheritDoc
   */


  suggest(text, context, payload, callback) {
    if (!this.index) {
      return callback({
        msg: 'Chatpal_currently_not_active'
      });
    }

    const type = payload.resultType === 'All' ? ['message', 'user', 'room'] : ['message'];
    this.index.suggest(text, this._settings.get('Main_Language'), this._getAcl(context), type, callback);
  }

}

searchProviderService.register(new ChatpalProvider());
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/chatpal_search/server/provider/index.js                                                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  default: () => Index
});
let ChatpalLogger;
module.watch(require("../utils/logger"), {
  default(v) {
    ChatpalLogger = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);

/**
 * Enables HTTP functions on Chatpal Backend
 */
class Backend {
  constructor(options) {
    this._options = options;
  }
  /**
   * index a set of Sorl documents
   * @param docs
   * @returns {boolean}
   */


  index(docs) {
    const options = (0, _objectSpread2.default)({
      data: docs,
      params: {
        language: this._options.language
      }
    }, this._options.httpOptions);

    try {
      const response = HTTP.call('POST', `${this._options.baseurl}${this._options.updatepath}`, options);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        ChatpalLogger.debug(`indexed ${docs.length} documents`, JSON.stringify(response.data, null, 2));
      } else {
        throw new Error(response);
      }
    } catch (e) {
      //TODO how to deal with this
      ChatpalLogger.error('indexing failed', JSON.stringify(e, null, 2));
      return false;
    }
  }
  /**
   * remove an entry by type and id
   * @param type
   * @param id
   * @returns {boolean}
   */


  remove(type, id) {
    ChatpalLogger.debug(`Remove ${type}(${id}) from Index`);
    const options = (0, _objectSpread2.default)({
      data: {
        delete: {
          query: `id:${id} AND type:${type}`
        },
        commit: {}
      }
    }, this._options.httpOptions);

    try {
      const response = HTTP.call('POST', this._options.baseurl + this._options.clearpath, options);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      return false;
    }
  }

  count(type) {
    return this.query({
      type,
      rows: 0,
      text: '*'
    })[type].numFound;
  }
  /**
   * query with params
   * @param params
   * @param callback
   */


  query(params, callback) {
    const options = (0, _objectSpread2.default)({
      params
    }, this._options.httpOptions);
    ChatpalLogger.debug('query: ', JSON.stringify(options, null, 2));

    try {
      if (callback) {
        HTTP.call('POST', this._options.baseurl + this._options.searchpath, options, (err, result) => {
          if (err) {
            return callback(err);
          }

          callback(undefined, result.data);
        });
      } else {
        const response = HTTP.call('POST', this._options.baseurl + this._options.searchpath, options);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          return response.data;
        } else {
          throw new Error(response);
        }
      }
    } catch (e) {
      ChatpalLogger.error('query failed', JSON.stringify(e, null, 2));
      throw e;
    }
  }

  suggest(params, callback) {
    const options = (0, _objectSpread2.default)({
      params
    }, this._options.httpOptions);
    HTTP.call('POST', this._options.baseurl + this._options.suggestionpath, options, (err, result) => {
      if (err) {
        return callback(err);
      }

      try {
        callback(undefined, result.data.suggestion);
      } catch (e) {
        callback(e);
      }
    });
  }

  clear() {
    ChatpalLogger.debug('Clear Index');
    const options = (0, _objectSpread2.default)({
      data: {
        delete: {
          query: '*:*'
        },
        commit: {}
      }
    }, this._options.httpOptions);

    try {
      const response = HTTP.call('POST', this._options.baseurl + this._options.clearpath, options);
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      return false;
    }
  }
  /**
   * statically ping with configuration
   * @param options
   * @returns {boolean}
   */


  static ping(config) {
    const options = (0, _objectSpread2.default)({
      params: {
        stats: true
      }
    }, config.httpOptions);

    try {
      const response = HTTP.call('GET', config.baseurl + config.pingpath, options);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data.stats;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

}
/**
 * Enabled batch indexing
 */


class BatchIndexer {
  constructor(size, func, ...rest) {
    this._size = size;
    this._func = func;
    this._rest = rest;
    this._values = [];
  }

  add(value) {
    this._values.push(value);

    if (this._values.length === this._size) {
      this.flush();
    }
  }

  flush() {
    this._func(this._values, this._rest); //TODO if flush does not work


    this._values = [];
  }

}
/**
 * Provides index functions to chatpal provider
 */


class Index {
  /**
   * Creates Index Stub
   * @param options
   * @param clear if a complete reindex should be done
   */
  constructor(options, clear, date) {
    this._id = Random.id();
    this._backend = new Backend(options);
    this._options = options;
    this._batchIndexer = new BatchIndexer(this._options.batchSize || 100, values => this._backend.index(values));

    this._bootstrap(clear, date);
  }
  /**
   * prepare solr documents
   * @param type
   * @param doc
   * @returns {*}
   * @private
   */


  _getIndexDocument(type, doc) {
    switch (type) {
      case 'message':
        return {
          id: doc._id,
          rid: doc.rid,
          user: doc.u._id,
          created: doc.ts,
          updated: doc._updatedAt,
          text: doc.msg,
          type
        };

      case 'room':
        return {
          id: doc._id,
          rid: doc._id,
          created: doc.createdAt,
          updated: doc.lm ? doc.lm : doc._updatedAt,
          type,
          room_name: doc.name,
          room_announcement: doc.announcement,
          room_description: doc.description,
          room_topic: doc.topic
        };

      case 'user':
        return {
          id: doc._id,
          created: doc.createdAt,
          updated: doc._updatedAt,
          type,
          user_username: doc.username,
          user_name: doc.name,
          user_email: doc.emails && doc.emails.map(e => {
            return e.address;
          })
        };

      default:
        throw new Error(`Cannot index type '${type}'`);
    }
  }
  /**
   * return true if there are messages in the databases which has been created before *date*
   * @param date
   * @returns {boolean}
   * @private
   */


  _existsDataOlderThan(date) {
    return RocketChat.models.Messages.model.find({
      ts: {
        $lt: new Date(date)
      },
      t: {
        $exists: false
      }
    }, {
      limit: 1
    }).fetch().length > 0;
  }

  _doesRoomCountDiffer() {
    return RocketChat.models.Rooms.find({
      t: {
        $ne: 'd'
      }
    }).count() !== this._backend.count('room');
  }

  _doesUserCountDiffer() {
    return Meteor.users.find({
      active: true
    }).count() !== this._backend.count('user');
  }
  /**
   * Index users by using a database cursor
   */


  _indexUsers() {
    const cursor = Meteor.users.find({
      active: true
    });
    ChatpalLogger.debug(`Start indexing ${cursor.count()} users`);
    cursor.forEach(user => {
      this.indexDoc('user', user, false);
    });
    ChatpalLogger.info(`Users indexed successfully (index-id: ${this._id})`);
  }
  /**
   * Index rooms by database cursor
   * @private
   */


  _indexRooms() {
    const cursor = RocketChat.models.Rooms.find({
      t: {
        $ne: 'd'
      }
    });
    ChatpalLogger.debug(`Start indexing ${cursor.count()} rooms`);
    cursor.forEach(room => {
      this.indexDoc('room', room, false);
    });
    ChatpalLogger.info(`Rooms indexed successfully (index-id: ${this._id})`);
  }

  _indexMessages(date, gap) {
    const start = new Date(date - gap);
    const end = new Date(date);
    const cursor = RocketChat.models.Messages.model.find({
      ts: {
        $gt: start,
        $lt: end
      },
      t: {
        $exists: false
      }
    });
    ChatpalLogger.debug(`Start indexing ${cursor.count()} messages between ${start.toString()} and ${end.toString()}`);
    cursor.forEach(message => {
      this.indexDoc('message', message, false);
    });
    ChatpalLogger.info(`Messages between ${start.toString()} and ${end.toString()} indexed successfully (index-id: ${this._id})`);
    return start.getTime();
  }

  _run(date, resolve, reject) {
    this._running = true;

    if (this._existsDataOlderThan(date) && !this._break) {
      Meteor.setTimeout(() => {
        date = this._indexMessages(date, (this._options.windowSize || 24) * 3600000);

        this._run(date, resolve, reject);
      }, this._options.timeout || 1000);
    } else if (this._break) {
      ChatpalLogger.info(`stopped bootstrap (index-id: ${this._id})`);

      this._batchIndexer.flush();

      this._running = false;
      resolve();
    } else {
      ChatpalLogger.info(`No messages older than already indexed date ${new Date(date).toString()}`);

      if (this._doesUserCountDiffer() && !this._break) {
        this._indexUsers();
      } else {
        ChatpalLogger.info('Users already indexed');
      }

      if (this._doesRoomCountDiffer() && !this._break) {
        this._indexRooms();
      } else {
        ChatpalLogger.info('Rooms already indexed');
      }

      this._batchIndexer.flush();

      ChatpalLogger.info(`finished bootstrap (index-id: ${this._id})`);
      this._running = false;
      resolve();
    }
  }

  _bootstrap(clear, date) {
    ChatpalLogger.info('Start bootstrapping');
    return new Promise((resolve, reject) => {
      if (clear) {
        this._backend.clear();

        date = new Date().getTime();
      }

      this._run(date, resolve, reject);
    });
  }

  static ping(options) {
    return Backend.ping(options);
  }

  stop() {
    this._break = true;
  }

  reindex() {
    if (!this._running) {
      this._bootstrap(true);
    }
  }

  indexDoc(type, doc, flush = true) {
    this._batchIndexer.add(this._getIndexDocument(type, doc));

    if (flush) {
      this._batchIndexer.flush();
    }

    return true;
  }

  removeDoc(type, id) {
    return this._backend.remove(type, id);
  }

  query(text, language, acl, type, start, rows, callback, params = {}) {
    this._backend.query((0, _objectSpread2.default)({
      text,
      language,
      acl,
      type,
      start,
      rows
    }, params), callback);
  }

  suggest(text, language, acl, type, callback) {
    this._backend.suggest({
      text,
      language,
      acl,
      type
    }, callback);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"utils":{"logger.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/chatpal_search/server/utils/logger.js                                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
const ChatpalLogger = new Logger('Chatpal Logger', {});
module.exportDefault(ChatpalLogger);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/chatpal_search/server/utils/utils.js                                                                  //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.methods({
  'chatpalUtilsCreateKey'(email) {
    try {
      const response = HTTP.call('POST', 'https://beta.chatpal.io/v1/account', {
        data: {
          email,
          tier: 'free'
        }
      });

      if (response.statusCode === 201) {
        return response.data.key;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  },

  'chatpalUtilsGetTaC'(lang) {
    try {
      const response = HTTP.call('GET', `https://beta.chatpal.io/v1/terms/${lang}.html`);

      if (response.statusCode === 200) {
        return response.content;
      } else {
        return undefined;
      }
    } catch (e) {
      return false;
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"asset":{"config.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/chatpal_search/server/asset/config.js                                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
/* globals Inject */
Inject.rawBody('chatpal-enter', Assets.getText('server/asset/chatpal-enter.svg'));
Inject.rawBody('chatpal-logo-icon-darkblue', Assets.getText('server/asset/chatpal-logo-icon-darkblue.svg'));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/chatpal:search/server/provider/provider.js");
require("/node_modules/meteor/chatpal:search/server/provider/index.js");
require("/node_modules/meteor/chatpal:search/server/utils/logger.js");
require("/node_modules/meteor/chatpal:search/server/utils/utils.js");
require("/node_modules/meteor/chatpal:search/server/asset/config.js");

/* Exports */
Package._define("chatpal:search");

})();

//# sourceURL=meteor://💻app/packages/chatpal_search.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2hhdHBhbDpzZWFyY2gvc2VydmVyL3Byb3ZpZGVyL3Byb3ZpZGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9jaGF0cGFsOnNlYXJjaC9zZXJ2ZXIvcHJvdmlkZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NoYXRwYWw6c2VhcmNoL3NlcnZlci91dGlscy9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NoYXRwYWw6c2VhcmNoL3NlcnZlci91dGlscy91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2hhdHBhbDpzZWFyY2gvc2VydmVyL2Fzc2V0L2NvbmZpZy5qcyJdLCJuYW1lcyI6WyJzZWFyY2hQcm92aWRlclNlcnZpY2UiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiU2VhcmNoUHJvdmlkZXIiLCJJbmRleCIsImRlZmF1bHQiLCJDaGF0cGFsTG9nZ2VyIiwiQ2hhdHBhbFByb3ZpZGVyIiwiY29uc3RydWN0b3IiLCJjaGF0cGFsQmFzZVVybCIsIl9zZXR0aW5ncyIsImFkZCIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImkxOG5EZXNjcmlwdGlvbiIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwidmFsdWUiLCJtdWx0aWxpbmUiLCJhbGVydCIsImljb25OYW1lIiwicmVzdWx0VGVtcGxhdGUiLCJzdWdnZXN0aW9uSXRlbVRlbXBsYXRlIiwic3VwcG9ydHNTdWdnZXN0aW9ucyIsImdldCIsIm9uIiwibmFtZSIsInBheWxvYWQiLCJpbmRleCIsImluZGV4RmFpbCIsImluZGV4RG9jIiwicmVtb3ZlRG9jIiwiX2NoZWNrRm9yQ2xlYXIiLCJyZWFzb24iLCJfaW5kZXhDb25maWciLCJiYWNrZW5kdHlwZSIsImJhc2V1cmwiLCJlbmRzV2l0aCIsInNsaWNlIiwiaHR0cE9wdGlvbnMiLCJoZWFkZXJzIiwibGFuZ3VhZ2UiLCJfcGFyc2VIZWFkZXJzIiwic2giLCJzcGxpdCIsImZvckVhY2giLCJkIiwiZHMiLCJsZW5ndGgiLCJ0cmltIiwiX3BpbmciLCJjb25maWciLCJyZXNvbHZlIiwicmVqZWN0IiwidGltZW91dCIsIm1heFRpbWVvdXQiLCJzdGF0cyIsInBpbmciLCJkZWJ1ZyIsIndhcm4iLCJfcGluZ1RpbWVvdXQiLCJNZXRlb3IiLCJzZXRUaW1lb3V0IiwiTWF0aCIsIm1pbiIsIl9nZXRJbmRleENvbmZpZyIsIlByb21pc2UiLCJzZWFyY2hwYXRoIiwidXBkYXRlcGF0aCIsInBpbmdwYXRoIiwiY2xlYXJwYXRoIiwic3VnZ2VzdGlvbnBhdGgiLCJiYXRjaFNpemUiLCJ3aW5kb3dTaXplIiwic3RvcCIsImluZm8iLCJjbGVhclRpbWVvdXQiLCJzdGFydCIsImNsZWFyIiwidGhlbiIsInNlcnZlciIsIl9zdGF0cyIsIkpTT04iLCJzdHJpbmdpZnkiLCJtZXNzYWdlIiwib2xkZXN0IiwiRGF0ZSIsInZhbHVlT2YiLCJfZ2V0QWNsIiwiY29udGV4dCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJTdWJzY3JpcHRpb25zIiwiZmluZCIsInVpZCIsImZldGNoIiwibWFwIiwicm9vbSIsInJpZCIsInNlYXJjaCIsInRleHQiLCJjYWxsYmFjayIsIm1zZyIsInR5cGUiLCJyZXN1bHRUeXBlIiwicXVlcnkiLCJyb3dzIiwic3VnZ2VzdCIsInJlZ2lzdGVyIiwiZXhwb3J0IiwiUmFuZG9tIiwiQmFja2VuZCIsIm9wdGlvbnMiLCJfb3B0aW9ucyIsImRvY3MiLCJkYXRhIiwicGFyYW1zIiwicmVzcG9uc2UiLCJIVFRQIiwiY2FsbCIsInN0YXR1c0NvZGUiLCJFcnJvciIsImUiLCJlcnJvciIsInJlbW92ZSIsImlkIiwiZGVsZXRlIiwiY29tbWl0IiwiY291bnQiLCJudW1Gb3VuZCIsImVyciIsInJlc3VsdCIsInVuZGVmaW5lZCIsInN1Z2dlc3Rpb24iLCJCYXRjaEluZGV4ZXIiLCJzaXplIiwiZnVuYyIsInJlc3QiLCJfc2l6ZSIsIl9mdW5jIiwiX3Jlc3QiLCJfdmFsdWVzIiwicHVzaCIsImZsdXNoIiwiZGF0ZSIsIl9iYWNrZW5kIiwiX2JhdGNoSW5kZXhlciIsIl9ib290c3RyYXAiLCJfZ2V0SW5kZXhEb2N1bWVudCIsImRvYyIsInVzZXIiLCJ1IiwiY3JlYXRlZCIsInRzIiwidXBkYXRlZCIsIl91cGRhdGVkQXQiLCJjcmVhdGVkQXQiLCJsbSIsInJvb21fbmFtZSIsInJvb21fYW5ub3VuY2VtZW50IiwiYW5ub3VuY2VtZW50Iiwicm9vbV9kZXNjcmlwdGlvbiIsImRlc2NyaXB0aW9uIiwicm9vbV90b3BpYyIsInRvcGljIiwidXNlcl91c2VybmFtZSIsInVzZXJuYW1lIiwidXNlcl9uYW1lIiwidXNlcl9lbWFpbCIsImVtYWlscyIsImFkZHJlc3MiLCJfZXhpc3RzRGF0YU9sZGVyVGhhbiIsIk1lc3NhZ2VzIiwibW9kZWwiLCIkbHQiLCJ0IiwiJGV4aXN0cyIsImxpbWl0IiwiX2RvZXNSb29tQ291bnREaWZmZXIiLCJSb29tcyIsIiRuZSIsIl9kb2VzVXNlckNvdW50RGlmZmVyIiwidXNlcnMiLCJhY3RpdmUiLCJfaW5kZXhVc2VycyIsImN1cnNvciIsIl9pbmRleFJvb21zIiwiX2luZGV4TWVzc2FnZXMiLCJnYXAiLCJlbmQiLCIkZ3QiLCJ0b1N0cmluZyIsImdldFRpbWUiLCJfcnVuIiwiX3J1bm5pbmciLCJfYnJlYWsiLCJyZWluZGV4IiwiYWNsIiwiTG9nZ2VyIiwiZXhwb3J0RGVmYXVsdCIsIm1ldGhvZHMiLCJlbWFpbCIsInRpZXIiLCJsYW5nIiwiY29udGVudCIsIkluamVjdCIsInJhd0JvZHkiLCJBc3NldHMiLCJnZXRUZXh0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxxQkFBSjtBQUEwQkMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDBCQUFSLENBQWIsRUFBaUQ7QUFBQ0gsd0JBQXNCSSxDQUF0QixFQUF3QjtBQUFDSiw0QkFBc0JJLENBQXRCO0FBQXdCOztB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QUFPQyxPQUFQLENBQWUsNEJBQWYsRUFBNkNDLE9BQU9DLE9BQVAsQ0FBZSw2Q0FBZixDQUE3QyxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9jaGF0cGFsX3NlYXJjaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7c2VhcmNoUHJvdmlkZXJTZXJ2aWNlfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpzZWFyY2gnO1xuaW1wb3J0IHtTZWFyY2hQcm92aWRlcn0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6c2VhcmNoJztcbmltcG9ydCBJbmRleCBmcm9tICcuL2luZGV4JztcbmltcG9ydCBDaGF0cGFsTG9nZ2VyIGZyb20gJy4uL3V0aWxzL2xvZ2dlcic7XG5cbi8qKlxuICogVGhlIGNoYXRwYWwgc2VhcmNoIHByb3ZpZGVyIGVuYWJsZXMgY2hhdHBhbCBzZWFyY2guIEFuIGFwcHJvcHJpYXRlIGJhY2tlZG4gaGFzIHRvIGJlIHNwZWNpZmllZCBieSBzZXR0aW5ncy5cbiAqL1xuY2xhc3MgQ2hhdHBhbFByb3ZpZGVyIGV4dGVuZHMgU2VhcmNoUHJvdmlkZXIge1xuXG5cdC8qKlxuXHQgKiBDcmVhdGUgY2hhdHBhbCBwcm92aWRlciB3aXRoIHNvbWUgc2V0dGluZ3MgZm9yIGJhY2tlbmQgYW5kIHVpXG5cdCAqL1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignY2hhdHBhbFByb3ZpZGVyJyk7XG5cblx0XHR0aGlzLmNoYXRwYWxCYXNlVXJsID0gJ2h0dHBzOi8vYmV0YS5jaGF0cGFsLmlvL3YxJztcblxuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnQmFja2VuZCcsICdzZWxlY3QnLCAnY2xvdWQnLCB7XG5cdFx0XHR2YWx1ZXM6W1xuXHRcdFx0XHR7a2V5OiAnY2xvdWQnLCBpMThuTGFiZWw6ICdDbG91ZCBTZXJ2aWNlJ30sXG5cdFx0XHRcdHtrZXk6ICdvbnNpdGUnLCBpMThuTGFiZWw6ICdPbi1TaXRlJ31cblx0XHRcdF0sXG5cdFx0XHRpMThuTGFiZWw6ICdDaGF0cGFsX0JhY2tlbmQnLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnQ2hhdHBhbF9CYWNrZW5kX0Rlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnQVBJX0tleScsICdzdHJpbmcnLCAnJywge1xuXHRcdFx0ZW5hYmxlUXVlcnk6W3tcblx0XHRcdFx0X2lkOiAnU2VhcmNoLmNoYXRwYWxQcm92aWRlci5CYWNrZW5kJyxcblx0XHRcdFx0dmFsdWU6ICdjbG91ZCdcblx0XHRcdH1dLFxuXHRcdFx0aTE4bkxhYmVsOiAnQ2hhdHBhbF9BUElfS2V5Jyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0NoYXRwYWxfQVBJX0tleV9EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0XHR0aGlzLl9zZXR0aW5ncy5hZGQoJ0Jhc2VfVVJMJywgJ3N0cmluZycsICcnLCB7XG5cdFx0XHRlbmFibGVRdWVyeTpbe1xuXHRcdFx0XHRfaWQ6ICdTZWFyY2guY2hhdHBhbFByb3ZpZGVyLkJhY2tlbmQnLFxuXHRcdFx0XHR2YWx1ZTogJ29uc2l0ZSdcblx0XHRcdH1dLFxuXHRcdFx0aTE4bkxhYmVsOiAnQ2hhdHBhbF9CYXNlX1VSTCcsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdDaGF0cGFsX0Jhc2VfVVJMX0Rlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnSFRUUF9IZWFkZXJzJywgJ3N0cmluZycsICcnLCB7XG5cdFx0XHRlbmFibGVRdWVyeTpbe1xuXHRcdFx0XHRfaWQ6ICdTZWFyY2guY2hhdHBhbFByb3ZpZGVyLkJhY2tlbmQnLFxuXHRcdFx0XHR2YWx1ZTogJ29uc2l0ZSdcblx0XHRcdH1dLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0aTE4bkxhYmVsOiAnQ2hhdHBhbF9IVFRQX0hlYWRlcnMnLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnQ2hhdHBhbF9IVFRQX0hlYWRlcnNfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0dGhpcy5fc2V0dGluZ3MuYWRkKCdNYWluX0xhbmd1YWdlJywgJ3NlbGVjdCcsICdlbicsIHtcblx0XHRcdHZhbHVlczogW1xuXHRcdFx0XHR7a2V5OiAnZW4nLCBpMThuTGFiZWw6ICdFbmdsaXNoJ30sXG5cdFx0XHRcdHtrZXk6ICdub25lJywgaTE4bkxhYmVsOiAnTGFuZ3VhZ2VfTm90X3NldCd9LFxuXHRcdFx0XHR7a2V5OiAnY3MnLCBpMThuTGFiZWw6ICdDemVjaCd9LFxuXHRcdFx0XHR7a2V5OiAnZGUnLCBpMThuTGFiZWw6ICdEZXV0c2NoJ30sXG5cdFx0XHRcdHtrZXk6ICdlbCcsIGkxOG5MYWJlbDogJ0dyZWVrJ30sXG5cdFx0XHRcdHtrZXk6ICdlcycsIGkxOG5MYWJlbDogJ1NwYW5pc2gnfSxcblx0XHRcdFx0e2tleTogJ2ZpJywgaTE4bkxhYmVsOiAnRmluaXNoJ30sXG5cdFx0XHRcdHtrZXk6ICdmcicsIGkxOG5MYWJlbDogJ0ZyZW5jaCd9LFxuXHRcdFx0XHR7a2V5OiAnaHUnLCBpMThuTGFiZWw6ICdIdW5nYXJpYW4nfSxcblx0XHRcdFx0e2tleTogJ2l0JywgaTE4bkxhYmVsOiAnSXRhbGlhbid9LFxuXHRcdFx0XHR7a2V5OiAnbmwnLCBpMThuTGFiZWw6ICdEdXRzY2gnfSxcblx0XHRcdFx0e2tleTogJ3BsJywgaTE4bkxhYmVsOiAnUG9saXNoJ30sXG5cdFx0XHRcdHtrZXk6ICdwdCcsIGkxOG5MYWJlbDogJ1BvcnR1Z3Vlc2UnfSxcblx0XHRcdFx0e2tleTogJ3B0X0JSJywgaTE4bkxhYmVsOiAnQnJhc2lsaWFuJ30sXG5cdFx0XHRcdHtrZXk6ICdybycsIGkxOG5MYWJlbDogJ1JvbWFuaWFuJ30sXG5cdFx0XHRcdHtrZXk6ICdydScsIGkxOG5MYWJlbDogJ1J1c3NpYW4nfSxcblx0XHRcdFx0e2tleTogJ3N2JywgaTE4bkxhYmVsOiAnU3dlZGlzY2gnfSxcblx0XHRcdFx0e2tleTogJ3RyJywgaTE4bkxhYmVsOiAnVHVya2lzaCd9LFxuXHRcdFx0XHR7a2V5OiAndWsnLCBpMThuTGFiZWw6ICdVa3JhaW5pYW4nfVxuXHRcdFx0XSxcblx0XHRcdGkxOG5MYWJlbDogJ0NoYXRwYWxfTWFpbl9MYW5ndWFnZScsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdDaGF0cGFsX01haW5fTGFuZ3VhZ2VfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0dGhpcy5fc2V0dGluZ3MuYWRkKCdEZWZhdWx0UmVzdWx0VHlwZScsICdzZWxlY3QnLCAnQWxsJywge1xuXHRcdFx0dmFsdWVzOiBbXG5cdFx0XHRcdHtrZXk6ICdBbGwnLCBpMThuTGFiZWw6ICdBbGwnfSxcblx0XHRcdFx0e2tleTogJ01lc3NhZ2VzJywgaTE4bkxhYmVsOiAnTWVzc2FnZXMnfVxuXHRcdFx0XSxcblx0XHRcdGkxOG5MYWJlbDogJ0NoYXRwYWxfRGVmYXVsdF9SZXN1bHRfVHlwZScsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdDaGF0cGFsX0RlZmF1bHRfUmVzdWx0X1R5cGVfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0dGhpcy5fc2V0dGluZ3MuYWRkKCdQYWdlU2l6ZScsICdpbnQnLCAxNSwge1xuXHRcdFx0aTE4bkxhYmVsOiAnU2VhcmNoX1BhZ2VfU2l6ZSdcblx0XHR9KTtcblx0XHR0aGlzLl9zZXR0aW5ncy5hZGQoJ1N1Z2dlc3Rpb25FbmFibGVkJywgJ2Jvb2xlYW4nLCB0cnVlLCB7XG5cdFx0XHRpMThuTGFiZWw6ICdDaGF0cGFsX1N1Z2dlc3Rpb25fRW5hYmxlZCcsXG5cdFx0XHRhbGVydDogJ1RoaXMgZmVhdHVyZSBpcyBjdXJyZW50bHkgaW4gYmV0YSBhbmQgd2lsbCBiZSBleHRlbmRlZCBpbiB0aGUgZnV0dXJlJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnQmF0Y2hTaXplJywgJ2ludCcsIDEwMCwge1xuXHRcdFx0aTE4bkxhYmVsOiAnQ2hhdHBhbF9CYXRjaF9TaXplJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0NoYXRwYWxfQmF0Y2hfU2l6ZV9EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0XHR0aGlzLl9zZXR0aW5ncy5hZGQoJ1RpbWVvdXRTaXplJywgJ2ludCcsIDUwMDAsIHtcblx0XHRcdGkxOG5MYWJlbDogJ0NoYXRwYWxfVGltZW91dF9TaXplJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0NoYXRwYWxfVGltZW91dF9TaXplX0Rlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnV2luZG93U2l6ZScsICdpbnQnLCA0OCwge1xuXHRcdFx0aTE4bkxhYmVsOiAnQ2hhdHBhbF9XaW5kb3dfU2l6ZScsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdDaGF0cGFsX1dpbmRvd19TaXplX0Rlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHR9XG5cblx0Z2V0IGkxOG5MYWJlbCgpIHtcblx0XHRyZXR1cm4gJ0NoYXRwYWwgUHJvdmlkZXInO1xuXHR9XG5cblx0Z2V0IGljb25OYW1lKCkge1xuXHRcdHJldHVybiAnY2hhdHBhbC1sb2dvLWljb24tZGFya2JsdWUnO1xuXHR9XG5cblx0Z2V0IHJlc3VsdFRlbXBsYXRlKCkge1xuXHRcdHJldHVybiAnQ2hhdHBhbFNlYXJjaFJlc3VsdFRlbXBsYXRlJztcblx0fVxuXG5cdGdldCBzdWdnZXN0aW9uSXRlbVRlbXBsYXRlKCkge1xuXHRcdHJldHVybiAnQ2hhdHBhbFN1Z2dlc3Rpb25JdGVtVGVtcGxhdGUnO1xuXHR9XG5cblx0Z2V0IHN1cHBvcnRzU3VnZ2VzdGlvbnMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3NldHRpbmdzLmdldCgnU3VnZ2VzdGlvbkVuYWJsZWQnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBpbmRleGluZyBmb3IgbWVzc2FnZXMsIHJvb21zIGFuZCB1c2Vyc1xuXHQgKiBAaW5oZXJpdERvY1xuXHQgKi9cblx0b24obmFtZSwgdmFsdWUsIHBheWxvYWQpIHtcblxuXHRcdGlmICghdGhpcy5pbmRleCkge1xuXHRcdFx0dGhpcy5pbmRleEZhaWwgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHN3aXRjaCAobmFtZSkge1xuXHRcdFx0Y2FzZSAnbWVzc2FnZS5zYXZlJzogcmV0dXJuIHRoaXMuaW5kZXguaW5kZXhEb2MoJ21lc3NhZ2UnLCBwYXlsb2FkKTtcblx0XHRcdGNhc2UgJ3VzZXIuc2F2ZSc6IHJldHVybiB0aGlzLmluZGV4LmluZGV4RG9jKCd1c2VyJywgcGF5bG9hZCk7XG5cdFx0XHRjYXNlICdyb29tLnNhdmUnOiByZXR1cm4gdGhpcy5pbmRleC5pbmRleERvYygncm9vbScsIHBheWxvYWQpO1xuXHRcdFx0Y2FzZSAnbWVzc2FnZS5kZWxldGUnOiByZXR1cm4gdGhpcy5pbmRleC5yZW1vdmVEb2MoJ21lc3NhZ2UnLCB2YWx1ZSk7XG5cdFx0XHRjYXNlICd1c2VyLmRlbGV0ZSc6IHJldHVybiB0aGlzLmluZGV4LnJlbW92ZURvYygndXNlcicsIHZhbHVlKTtcblx0XHRcdGNhc2UgJ3Jvb20uZGVsZXRlJzogcmV0dXJuIHRoaXMuaW5kZXgucmVtb3ZlRG9jKCdyb29tJywgdmFsdWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENoZWNrIGlmIHRoZSBpbmRleCBoYXMgdG8gYmUgZGVsZXRlZCBhbmQgY29tcGxldGVseSBuZXcgcmVpbmRleGVkXG5cdCAqIEBwYXJhbSByZWFzb24gdGhlIHJlYXNvbiBmb3IgdGhlIHByb3ZpZGVyIHN0YXJ0XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2NoZWNrRm9yQ2xlYXIocmVhc29uKSB7XG5cblx0XHRpZiAocmVhc29uID09PSAnc3RhcnR1cCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0XHRpZiAocmVhc29uID09PSAnc3dpdGNoJykgeyByZXR1cm4gdHJ1ZTsgfVxuXG5cdFx0cmV0dXJuIHRoaXMuX2luZGV4Q29uZmlnLmJhY2tlbmR0eXBlICE9PSB0aGlzLl9zZXR0aW5ncy5nZXQoJ0JhY2tlbmQnKSB8fFxuXHRcdFx0KHRoaXMuX2luZGV4Q29uZmlnLmJhY2tlbmR0eXBlID09PSAnb25zaXRlJyAmJiB0aGlzLl9pbmRleENvbmZpZy5iYXNldXJsICE9PSAodGhpcy5fc2V0dGluZ3MuZ2V0KCdCYXNlX1VSTCcpLmVuZHNXaXRoKCcvJykgPyB0aGlzLl9zZXR0aW5ncy5nZXQoJ0Jhc2VfVVJMJykuc2xpY2UoMCwgLTEpIDogdGhpcy5fc2V0dGluZ3MuZ2V0KCdCYXNlX1VSTCcpKSkgfHxcblx0XHRcdCh0aGlzLl9pbmRleENvbmZpZy5iYWNrZW5kdHlwZSA9PT0gJ2Nsb3VkJyAmJiB0aGlzLl9pbmRleENvbmZpZy5odHRwT3B0aW9ucy5oZWFkZXJzWydYLUFwaS1LZXknXSAhPT0gdGhpcy5fc2V0dGluZ3MuZ2V0KCdBUElfS2V5JykpIHx8XG5cdFx0XHR0aGlzLl9pbmRleENvbmZpZy5sYW5ndWFnZSAhPT0gdGhpcy5fc2V0dGluZ3MuZ2V0KCdNYWluX0xhbmd1YWdlJyk7XG5cdH1cblxuXHQvKipcblx0ICogcGFyc2Ugc3RyaW5nIHRvIG9iamVjdCB0aGF0IGNhbiBiZSB1c2VkIGFzIGhlYWRlciBmb3IgSFRUUCBjYWxsc1xuXHQgKiBAcmV0dXJucyB7e319XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfcGFyc2VIZWFkZXJzKCkge1xuXHRcdGNvbnN0IGhlYWRlcnMgPSB7fTtcblx0XHRjb25zdCBzaCA9IHRoaXMuX3NldHRpbmdzLmdldCgnSFRUUF9IZWFkZXJzJykuc3BsaXQoJ1xcbicpO1xuXHRcdHNoLmZvckVhY2goZnVuY3Rpb24oZCkge1xuXHRcdFx0Y29uc3QgZHMgPSBkLnNwbGl0KCc6Jyk7XG5cdFx0XHRpZiAoZHMubGVuZ3RoID09PSAyICYmIGRzWzBdLnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdFx0aGVhZGVyc1tkc1swXV0gPSBkc1sxXTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gaGVhZGVycztcblx0fVxuXG5cdC8qKlxuXHQgKiBwaW5nIGlmIGNvbmZpZ3VyYXRpb24gaGFzIGJlZW4gc2V0IGNvcnJlY3RseVxuXHQgKiBAcGFyYW0gY29uZmlnXG5cdCAqIEBwYXJhbSByZXNvbHZlIGlmIHBpbmcgd2FzIHN1Y2Nlc3NmdWxsXG5cdCAqIEBwYXJhbSByZWplY3QgaWYgc29tZSBlcnJvciBvY2N1cnNcblx0ICogQHBhcmFtIHRpbWVvdXQgdW50aWwgcGluZyBpcyByZXBlYXRlZFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X3BpbmcoY29uZmlnLCByZXNvbHZlLCByZWplY3QsIHRpbWVvdXQgPSA1MDAwKSB7XG5cblx0XHRjb25zdCBtYXhUaW1lb3V0ID0gMjAwMDAwO1xuXG5cdFx0Y29uc3Qgc3RhdHMgPSBJbmRleC5waW5nKGNvbmZpZyk7XG5cblx0XHRpZiAoc3RhdHMpIHtcblx0XHRcdENoYXRwYWxMb2dnZXIuZGVidWcoJ3Bpbmcgd2FzIHN1Y2Nlc3NmdWxsJyk7XG5cdFx0XHRyZXNvbHZlKHtjb25maWcsIHN0YXRzfSk7XG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0Q2hhdHBhbExvZ2dlci53YXJuKGBwaW5nIGZhaWxlZCwgcmV0cnkgaW4gJHsgdGltZW91dCB9IG1zYCk7XG5cblx0XHRcdHRoaXMuX3BpbmdUaW1lb3V0ID0gTWV0ZW9yLnNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHR0aGlzLl9waW5nKGNvbmZpZywgcmVzb2x2ZSwgcmVqZWN0LCBNYXRoLm1pbihtYXhUaW1lb3V0LCAyKnRpbWVvdXQpKTtcblx0XHRcdH0sIHRpbWVvdXQpO1xuXHRcdH1cblxuXHR9XG5cblx0LyoqXG5cdCAqIEdldCBpbmRleCBjb25maWcgYmFzZWQgb24gc2V0dGluZ3Ncblx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0SW5kZXhDb25maWcoKSB7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgY29uZmlnID0ge1xuXHRcdFx0XHRiYWNrZW5kdHlwZTogdGhpcy5fc2V0dGluZ3MuZ2V0KCdCYWNrZW5kJylcblx0XHRcdH07XG5cblx0XHRcdGlmICh0aGlzLl9zZXR0aW5ncy5nZXQoJ0JhY2tlbmQnKSA9PT0gJ2Nsb3VkJykge1xuXHRcdFx0XHRjb25maWcuYmFzZXVybCA9IHRoaXMuY2hhdHBhbEJhc2VVcmw7XG5cdFx0XHRcdGNvbmZpZy5sYW5ndWFnZSA9IHRoaXMuX3NldHRpbmdzLmdldCgnTWFpbl9MYW5ndWFnZScpO1xuXHRcdFx0XHRjb25maWcuc2VhcmNocGF0aCA9ICcvc2VhcmNoL3NlYXJjaCc7XG5cdFx0XHRcdGNvbmZpZy51cGRhdGVwYXRoID0gJy9zZWFyY2gvdXBkYXRlJztcblx0XHRcdFx0Y29uZmlnLnBpbmdwYXRoID0gJy9zZWFyY2gvcGluZyc7XG5cdFx0XHRcdGNvbmZpZy5jbGVhcnBhdGggPSAnL3NlYXJjaC9jbGVhcic7XG5cdFx0XHRcdGNvbmZpZy5zdWdnZXN0aW9ucGF0aCA9ICcvc2VhcmNoL3N1Z2dlc3QnO1xuXHRcdFx0XHRjb25maWcuaHR0cE9wdGlvbnMgPSB7XG5cdFx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdFx0J1gtQXBpLUtleSc6IHRoaXMuX3NldHRpbmdzLmdldCgnQVBJX0tleScpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uZmlnLmJhc2V1cmwgPSB0aGlzLl9zZXR0aW5ncy5nZXQoJ0Jhc2VfVVJMJykuZW5kc1dpdGgoJy8nKSA/IHRoaXMuX3NldHRpbmdzLmdldCgnQmFzZV9VUkwnKS5zbGljZSgwLCAtMSkgOiB0aGlzLl9zZXR0aW5ncy5nZXQoJ0Jhc2VfVVJMJyk7XG5cdFx0XHRcdGNvbmZpZy5sYW5ndWFnZSA9IHRoaXMuX3NldHRpbmdzLmdldCgnTWFpbl9MYW5ndWFnZScpO1xuXHRcdFx0XHRjb25maWcuc2VhcmNocGF0aCA9ICcvY2hhdHBhbC9zZWFyY2gnO1xuXHRcdFx0XHRjb25maWcudXBkYXRlcGF0aCA9ICcvY2hhdHBhbC91cGRhdGUnO1xuXHRcdFx0XHRjb25maWcucGluZ3BhdGggPSAnL2NoYXRwYWwvcGluZyc7XG5cdFx0XHRcdGNvbmZpZy5jbGVhcnBhdGggPSAnL2NoYXRwYWwvY2xlYXInO1xuXHRcdFx0XHRjb25maWcuc3VnZ2VzdGlvbnBhdGggPSAnL2NoYXRwYWwvc3VnZ2VzdCc7XG5cdFx0XHRcdGNvbmZpZy5odHRwT3B0aW9ucyA9IHtcblx0XHRcdFx0XHRoZWFkZXJzOiB0aGlzLl9wYXJzZUhlYWRlcnMoKVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25maWcuYmF0Y2hTaXplID0gdGhpcy5fc2V0dGluZ3MuZ2V0KCdCYXRjaFNpemUnKTtcblx0XHRcdGNvbmZpZy50aW1lb3V0ID0gdGhpcy5fc2V0dGluZ3MuZ2V0KCdUaW1lb3V0U2l6ZScpO1xuXHRcdFx0Y29uZmlnLndpbmRvd1NpemUgPSB0aGlzLl9zZXR0aW5ncy5nZXQoJ1dpbmRvd1NpemUnKTtcblxuXHRcdFx0dGhpcy5fcGluZyhjb25maWcsIHJlc29sdmUsIHJlamVjdCk7XG5cdFx0fSk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBAaW5oZXJpdERvY1xuXHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0ICovXG5cdHN0b3AocmVzb2x2ZSkge1xuXHRcdENoYXRwYWxMb2dnZXIuaW5mbygnUHJvdmlkZXIgc3RvcHBlZCcpO1xuXHRcdE1ldGVvci5jbGVhclRpbWVvdXQodGhpcy5fcGluZ1RpbWVvdXQpO1xuXHRcdHRoaXMuaW5kZXhGYWlsID0gZmFsc2U7XG5cdFx0dGhpcy5pbmRleCAmJiB0aGlzLmluZGV4LnN0b3AoKTtcblx0XHRyZXNvbHZlKCk7XG5cdH1cblxuXHQvKipcblx0ICogQGluaGVyaXREb2Ncblx0ICogQHBhcmFtIHJlYXNvblxuXHQgKiBAcGFyYW0gcmVzb2x2ZVxuXHQgKiBAcGFyYW0gcmVqZWN0XG5cdCAqL1xuXHRzdGFydChyZWFzb24sIHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0Y29uc3QgY2xlYXIgPSB0aGlzLl9jaGVja0ZvckNsZWFyKHJlYXNvbik7XG5cblx0XHRDaGF0cGFsTG9nZ2VyLmRlYnVnKGBjbGVhciA9ICR7IGNsZWFyIH0gd2l0aCByZWFzb24gJyR7IHJlYXNvbiB9J2ApO1xuXG5cdFx0dGhpcy5fZ2V0SW5kZXhDb25maWcoKS50aGVuKChzZXJ2ZXIpID0+IHtcblx0XHRcdHRoaXMuX2luZGV4Q29uZmlnID0gc2VydmVyLmNvbmZpZztcblxuXHRcdFx0dGhpcy5fc3RhdHMgPSBzZXJ2ZXIuc3RhdHM7XG5cblx0XHRcdENoYXRwYWxMb2dnZXIuZGVidWcoJ2NvbmZpZzonLCBKU09OLnN0cmluZ2lmeSh0aGlzLl9pbmRleENvbmZpZywgbnVsbCwgMikpO1xuXHRcdFx0Q2hhdHBhbExvZ2dlci5kZWJ1Zygnc3RhdHM6JywgSlNPTi5zdHJpbmdpZnkodGhpcy5fc3RhdHMsIG51bGwsIDIpKTtcblxuXHRcdFx0dGhpcy5pbmRleCA9IG5ldyBJbmRleCh0aGlzLl9pbmRleENvbmZpZywgdGhpcy5pbmRleEZhaWwgfHwgY2xlYXIsIHRoaXMuX3N0YXRzLm1lc3NhZ2Uub2xkZXN0IHx8IG5ldyBEYXRlKCkudmFsdWVPZigpKTtcblxuXHRcdFx0cmVzb2x2ZSgpO1xuXHRcdH0sIHJlamVjdCk7XG5cdH1cblxuXHQvKipcblx0ICogcmV0dXJucyBhIGxpc3Qgb2Ygcm9vbXMgdGhhdCBhcmUgYWxsb3dlZCB0byBzZWUgYnkgY3VycmVudCB1c2VyXG5cdCAqIEBwYXJhbSBjb250ZXh0XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZ2V0QWNsKGNvbnRleHQpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kKHsndS5faWQnOiBjb250ZXh0LnVpZH0pLmZldGNoKCkubWFwKHJvb20gPT4gcm9vbS5yaWQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEBpbmhlcml0RG9jXG5cdCAqIEByZXR1cm5zIHsqfVxuXHQgKi9cblx0c2VhcmNoKHRleHQsIGNvbnRleHQsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG5cblx0XHRpZiAoIXRoaXMuaW5kZXgpIHsgcmV0dXJuIGNhbGxiYWNrKHttc2c6J0NoYXRwYWxfY3VycmVudGx5X25vdF9hY3RpdmUnfSk7IH1cblxuXHRcdGNvbnN0IHR5cGUgPSBwYXlsb2FkLnJlc3VsdFR5cGUgPT09ICdBbGwnID8gWydtZXNzYWdlJywgJ3VzZXInLCAncm9vbSddIDogWydtZXNzYWdlJ107XG5cblx0XHR0aGlzLmluZGV4LnF1ZXJ5KFxuXHRcdFx0dGV4dCxcblx0XHRcdHRoaXMuX3NldHRpbmdzLmdldCgnTWFpbl9MYW5ndWFnZScpLFxuXHRcdFx0dGhpcy5fZ2V0QWNsKGNvbnRleHQpLFxuXHRcdFx0dHlwZSxcblx0XHRcdHBheWxvYWQuc3RhcnQgfHwgMCxcblx0XHRcdHBheWxvYWQucm93cyB8fCB0aGlzLl9zZXR0aW5ncy5nZXQoJ1BhZ2VTaXplJyksXG5cdFx0XHRjYWxsYmFja1xuXHRcdCk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBAaW5oZXJpdERvY1xuXHQgKi9cblx0c3VnZ2VzdCh0ZXh0LCBjb250ZXh0LCBwYXlsb2FkLCBjYWxsYmFjaykge1xuXG5cdFx0aWYgKCF0aGlzLmluZGV4KSB7IHJldHVybiBjYWxsYmFjayh7bXNnOidDaGF0cGFsX2N1cnJlbnRseV9ub3RfYWN0aXZlJ30pOyB9XG5cblx0XHRjb25zdCB0eXBlID0gcGF5bG9hZC5yZXN1bHRUeXBlID09PSAnQWxsJyA/IFsnbWVzc2FnZScsICd1c2VyJywgJ3Jvb20nXSA6IFsnbWVzc2FnZSddO1xuXG5cdFx0dGhpcy5pbmRleC5zdWdnZXN0KFxuXHRcdFx0dGV4dCxcblx0XHRcdHRoaXMuX3NldHRpbmdzLmdldCgnTWFpbl9MYW5ndWFnZScpLFxuXHRcdFx0dGhpcy5fZ2V0QWNsKGNvbnRleHQpLFxuXHRcdFx0dHlwZSxcblx0XHRcdGNhbGxiYWNrXG5cdFx0KTtcblx0fVxufVxuXG5zZWFyY2hQcm92aWRlclNlcnZpY2UucmVnaXN0ZXIobmV3IENoYXRwYWxQcm92aWRlcigpKTtcbiIsImltcG9ydCBDaGF0cGFsTG9nZ2VyIGZyb20gJy4uL3V0aWxzL2xvZ2dlcic7XG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICdtZXRlb3IvcmFuZG9tJztcblxuLyoqXG4gKiBFbmFibGVzIEhUVFAgZnVuY3Rpb25zIG9uIENoYXRwYWwgQmFja2VuZFxuICovXG5jbGFzcyBCYWNrZW5kIHtcblxuXHRjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG5cdFx0dGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG5cdH1cblxuXHQvKipcblx0ICogaW5kZXggYSBzZXQgb2YgU29ybCBkb2N1bWVudHNcblx0ICogQHBhcmFtIGRvY3Ncblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRpbmRleChkb2NzKSB7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdGRhdGE6ZG9jcyxcblx0XHRcdHBhcmFtczp7bGFuZ3VhZ2U6dGhpcy5fb3B0aW9ucy5sYW5ndWFnZX0sXG5cdFx0XHQuLi50aGlzLl9vcHRpb25zLmh0dHBPcHRpb25zXG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5jYWxsKCdQT1NUJywgYCR7IHRoaXMuX29wdGlvbnMuYmFzZXVybCB9JHsgdGhpcy5fb3B0aW9ucy51cGRhdGVwYXRoIH1gLCBvcHRpb25zKTtcblxuXHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgPCAzMDApIHtcblx0XHRcdFx0Q2hhdHBhbExvZ2dlci5kZWJ1ZyhgaW5kZXhlZCAkeyBkb2NzLmxlbmd0aCB9IGRvY3VtZW50c2AsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmRhdGEsIG51bGwsIDIpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihyZXNwb25zZSk7XG5cdFx0XHR9XG5cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvL1RPRE8gaG93IHRvIGRlYWwgd2l0aCB0aGlzXG5cdFx0XHRDaGF0cGFsTG9nZ2VyLmVycm9yKCdpbmRleGluZyBmYWlsZWQnLCBKU09OLnN0cmluZ2lmeShlLCBudWxsLCAyKSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdH1cblxuXHQvKipcblx0ICogcmVtb3ZlIGFuIGVudHJ5IGJ5IHR5cGUgYW5kIGlkXG5cdCAqIEBwYXJhbSB0eXBlXG5cdCAqIEBwYXJhbSBpZFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdHJlbW92ZSh0eXBlLCBpZCkge1xuXHRcdENoYXRwYWxMb2dnZXIuZGVidWcoYFJlbW92ZSAkeyB0eXBlIH0oJHsgaWQgfSkgZnJvbSBJbmRleGApO1xuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdGRhdGE6e1xuXHRcdFx0XHRkZWxldGU6IHtcblx0XHRcdFx0XHRxdWVyeTogYGlkOiR7IGlkIH0gQU5EIHR5cGU6JHsgdHlwZSB9YFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb21taXQ6e31cblx0XHRcdH0sXG5cdFx0XHQuLi50aGlzLl9vcHRpb25zLmh0dHBPcHRpb25zXG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IEhUVFAuY2FsbCgnUE9TVCcsIHRoaXMuX29wdGlvbnMuYmFzZXVybCArIHRoaXMuX29wdGlvbnMuY2xlYXJwYXRoLCBvcHRpb25zKTtcblxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLnN0YXR1c0NvZGUgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgPCAzMDA7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGNvdW50KHR5cGUpIHtcblx0XHRyZXR1cm4gdGhpcy5xdWVyeSh7dHlwZSwgcm93czowLCB0ZXh0OicqJ30pW3R5cGVdLm51bUZvdW5kO1xuXHR9XG5cblx0LyoqXG5cdCAqIHF1ZXJ5IHdpdGggcGFyYW1zXG5cdCAqIEBwYXJhbSBwYXJhbXNcblx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdCAqL1xuXHRxdWVyeShwYXJhbXMsIGNhbGxiYWNrKSB7XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0cGFyYW1zLFxuXHRcdFx0Li4udGhpcy5fb3B0aW9ucy5odHRwT3B0aW9uc1xuXHRcdH07XG5cblx0XHRDaGF0cGFsTG9nZ2VyLmRlYnVnKCdxdWVyeTogJywgSlNPTi5zdHJpbmdpZnkob3B0aW9ucywgbnVsbCwgMikpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChjYWxsYmFjaykge1xuXHRcdFx0XHRIVFRQLmNhbGwoJ1BPU1QnLCB0aGlzLl9vcHRpb25zLmJhc2V1cmwgKyB0aGlzLl9vcHRpb25zLnNlYXJjaHBhdGgsIG9wdGlvbnMsIChlcnIsIHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnIpIHsgcmV0dXJuIGNhbGxiYWNrKGVycik7IH1cblxuXHRcdFx0XHRcdGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzdWx0LmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmNhbGwoJ1BPU1QnLCB0aGlzLl9vcHRpb25zLmJhc2V1cmwgKyB0aGlzLl9vcHRpb25zLnNlYXJjaHBhdGgsIG9wdGlvbnMpO1xuXG5cdFx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID49IDIwMCAmJiByZXNwb25zZS5zdGF0dXNDb2RlIDwgMzAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdENoYXRwYWxMb2dnZXIuZXJyb3IoJ3F1ZXJ5IGZhaWxlZCcsIEpTT04uc3RyaW5naWZ5KGUsIG51bGwsIDIpKTtcblx0XHRcdHRocm93IGU7XG5cdFx0fVxuXHR9XG5cblx0c3VnZ2VzdChwYXJhbXMsIGNhbGxiYWNrKSB7XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0cGFyYW1zLFxuXHRcdFx0Li4udGhpcy5fb3B0aW9ucy5odHRwT3B0aW9uc1xuXHRcdH07XG5cblx0XHRIVFRQLmNhbGwoJ1BPU1QnLCB0aGlzLl9vcHRpb25zLmJhc2V1cmwgKyB0aGlzLl9vcHRpb25zLnN1Z2dlc3Rpb25wYXRoLCBvcHRpb25zLCAoZXJyLCByZXN1bHQpID0+IHtcblx0XHRcdGlmIChlcnIpIHsgcmV0dXJuIGNhbGxiYWNrKGVycik7IH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y2FsbGJhY2sodW5kZWZpbmVkLCByZXN1bHQuZGF0YS5zdWdnZXN0aW9uKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y2FsbGJhY2soZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRjbGVhcigpIHtcblx0XHRDaGF0cGFsTG9nZ2VyLmRlYnVnKCdDbGVhciBJbmRleCcpO1xuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdGRhdGE6e1xuXHRcdFx0XHRkZWxldGU6IHtcblx0XHRcdFx0XHRxdWVyeTogJyo6Kidcblx0XHRcdFx0fSxcblx0XHRcdFx0Y29tbWl0Ont9XG5cdFx0XHR9LCAuLi50aGlzLl9vcHRpb25zLmh0dHBPcHRpb25zXG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IEhUVFAuY2FsbCgnUE9TVCcsIHRoaXMuX29wdGlvbnMuYmFzZXVybCArIHRoaXMuX29wdGlvbnMuY2xlYXJwYXRoLCBvcHRpb25zKTtcblxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLnN0YXR1c0NvZGUgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgPCAzMDA7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBzdGF0aWNhbGx5IHBpbmcgd2l0aCBjb25maWd1cmF0aW9uXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0c3RhdGljIHBpbmcoY29uZmlnKSB7XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdHN0YXRzOnRydWVcblx0XHRcdH0sXG5cdFx0XHQuLi5jb25maWcuaHR0cE9wdGlvbnNcblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5jYWxsKCdHRVQnLCBjb25maWcuYmFzZXVybCArIGNvbmZpZy5waW5ncGF0aCwgb3B0aW9ucyk7XG5cblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID49IDIwMCAmJiByZXNwb25zZS5zdGF0dXNDb2RlIDwgMzAwKSB7XG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhLnN0YXRzO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxufVxuXG4vKipcbiAqIEVuYWJsZWQgYmF0Y2ggaW5kZXhpbmdcbiAqL1xuY2xhc3MgQmF0Y2hJbmRleGVyIHtcblxuXHRjb25zdHJ1Y3RvcihzaXplLCBmdW5jLCAuLi5yZXN0KSB7XG5cdFx0dGhpcy5fc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5fZnVuYyA9IGZ1bmM7XG5cdFx0dGhpcy5fcmVzdCA9IHJlc3Q7XG5cdFx0dGhpcy5fdmFsdWVzID0gW107XG5cdH1cblxuXHRhZGQodmFsdWUpIHtcblx0XHR0aGlzLl92YWx1ZXMucHVzaCh2YWx1ZSk7XG5cdFx0aWYgKHRoaXMuX3ZhbHVlcy5sZW5ndGggPT09IHRoaXMuX3NpemUpIHtcblx0XHRcdHRoaXMuZmx1c2goKTtcblx0XHR9XG5cdH1cblxuXHRmbHVzaCgpIHtcblx0XHR0aGlzLl9mdW5jKHRoaXMuX3ZhbHVlcywgdGhpcy5fcmVzdCk7Ly9UT0RPIGlmIGZsdXNoIGRvZXMgbm90IHdvcmtcblx0XHR0aGlzLl92YWx1ZXMgPSBbXTtcblx0fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGluZGV4IGZ1bmN0aW9ucyB0byBjaGF0cGFsIHByb3ZpZGVyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluZGV4IHtcblxuXHQvKipcblx0ICogQ3JlYXRlcyBJbmRleCBTdHViXG5cdCAqIEBwYXJhbSBvcHRpb25zXG5cdCAqIEBwYXJhbSBjbGVhciBpZiBhIGNvbXBsZXRlIHJlaW5kZXggc2hvdWxkIGJlIGRvbmVcblx0ICovXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMsIGNsZWFyLCBkYXRlKSB7XG5cblx0XHR0aGlzLl9pZCA9IFJhbmRvbS5pZCgpO1xuXG5cdFx0dGhpcy5fYmFja2VuZCA9IG5ldyBCYWNrZW5kKG9wdGlvbnMpO1xuXG5cdFx0dGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG5cblx0XHR0aGlzLl9iYXRjaEluZGV4ZXIgPSBuZXcgQmF0Y2hJbmRleGVyKHRoaXMuX29wdGlvbnMuYmF0Y2hTaXplIHx8IDEwMCwgKHZhbHVlcykgPT4gdGhpcy5fYmFja2VuZC5pbmRleCh2YWx1ZXMpKTtcblxuXHRcdHRoaXMuX2Jvb3RzdHJhcChjbGVhciwgZGF0ZSk7XG5cdH1cblxuXHQvKipcblx0ICogcHJlcGFyZSBzb2xyIGRvY3VtZW50c1xuXHQgKiBAcGFyYW0gdHlwZVxuXHQgKiBAcGFyYW0gZG9jXG5cdCAqIEByZXR1cm5zIHsqfVxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0X2dldEluZGV4RG9jdW1lbnQodHlwZSwgZG9jKSB7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdtZXNzYWdlJzpcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRpZDogZG9jLl9pZCxcblx0XHRcdFx0XHRyaWQ6IGRvYy5yaWQsXG5cdFx0XHRcdFx0dXNlcjogZG9jLnUuX2lkLFxuXHRcdFx0XHRcdGNyZWF0ZWQ6IGRvYy50cyxcblx0XHRcdFx0XHR1cGRhdGVkOiBkb2MuX3VwZGF0ZWRBdCxcblx0XHRcdFx0XHR0ZXh0OiBkb2MubXNnLFxuXHRcdFx0XHRcdHR5cGVcblx0XHRcdFx0fTtcblx0XHRcdGNhc2UgJ3Jvb20nOlxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGlkOiBkb2MuX2lkLFxuXHRcdFx0XHRcdHJpZDogZG9jLl9pZCxcblx0XHRcdFx0XHRjcmVhdGVkOiBkb2MuY3JlYXRlZEF0LFxuXHRcdFx0XHRcdHVwZGF0ZWQ6IGRvYy5sbSA/IGRvYy5sbSA6IGRvYy5fdXBkYXRlZEF0LFxuXHRcdFx0XHRcdHR5cGUsXG5cdFx0XHRcdFx0cm9vbV9uYW1lOiBkb2MubmFtZSxcblx0XHRcdFx0XHRyb29tX2Fubm91bmNlbWVudDogZG9jLmFubm91bmNlbWVudCxcblx0XHRcdFx0XHRyb29tX2Rlc2NyaXB0aW9uOiBkb2MuZGVzY3JpcHRpb24sXG5cdFx0XHRcdFx0cm9vbV90b3BpYzogZG9jLnRvcGljXG5cdFx0XHRcdH07XG5cdFx0XHRjYXNlICd1c2VyJzpcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRpZDogZG9jLl9pZCxcblx0XHRcdFx0XHRjcmVhdGVkOiBkb2MuY3JlYXRlZEF0LFxuXHRcdFx0XHRcdHVwZGF0ZWQ6IGRvYy5fdXBkYXRlZEF0LFxuXHRcdFx0XHRcdHR5cGUsXG5cdFx0XHRcdFx0dXNlcl91c2VybmFtZTogZG9jLnVzZXJuYW1lLFxuXHRcdFx0XHRcdHVzZXJfbmFtZTogZG9jLm5hbWUsXG5cdFx0XHRcdFx0dXNlcl9lbWFpbDogZG9jLmVtYWlscyAmJiBkb2MuZW1haWxzLm1hcCgoZSkgPT4geyByZXR1cm4gZS5hZGRyZXNzOyB9KVxuXHRcdFx0XHR9O1xuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgaW5kZXggdHlwZSAnJHsgdHlwZSB9J2ApO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiByZXR1cm4gdHJ1ZSBpZiB0aGVyZSBhcmUgbWVzc2FnZXMgaW4gdGhlIGRhdGFiYXNlcyB3aGljaCBoYXMgYmVlbiBjcmVhdGVkIGJlZm9yZSAqZGF0ZSpcblx0ICogQHBhcmFtIGRhdGVcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRfZXhpc3RzRGF0YU9sZGVyVGhhbihkYXRlKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLm1vZGVsLmZpbmQoe3RzOnskbHQ6IG5ldyBEYXRlKGRhdGUpfSwgdDp7JGV4aXN0czpmYWxzZX19LCB7bGltaXQ6MX0pLmZldGNoKCkubGVuZ3RoID4gMDtcblx0fVxuXG5cdF9kb2VzUm9vbUNvdW50RGlmZmVyKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKHt0OnskbmU6J2QnfX0pLmNvdW50KCkgIT09IHRoaXMuX2JhY2tlbmQuY291bnQoJ3Jvb20nKTtcblx0fVxuXG5cdF9kb2VzVXNlckNvdW50RGlmZmVyKCkge1xuXHRcdHJldHVybiBNZXRlb3IudXNlcnMuZmluZCh7YWN0aXZlOnRydWV9KS5jb3VudCgpICE9PSB0aGlzLl9iYWNrZW5kLmNvdW50KCd1c2VyJyk7XG5cdH1cblxuXHQvKipcblx0ICogSW5kZXggdXNlcnMgYnkgdXNpbmcgYSBkYXRhYmFzZSBjdXJzb3Jcblx0ICovXG5cdF9pbmRleFVzZXJzKCkge1xuXHRcdGNvbnN0IGN1cnNvciA9IE1ldGVvci51c2Vycy5maW5kKHthY3RpdmU6dHJ1ZX0pO1xuXG5cdFx0Q2hhdHBhbExvZ2dlci5kZWJ1ZyhgU3RhcnQgaW5kZXhpbmcgJHsgY3Vyc29yLmNvdW50KCkgfSB1c2Vyc2ApO1xuXG5cdFx0Y3Vyc29yLmZvckVhY2goKHVzZXIpID0+IHtcblx0XHRcdHRoaXMuaW5kZXhEb2MoJ3VzZXInLCB1c2VyLCBmYWxzZSk7XG5cdFx0fSk7XG5cblx0XHRDaGF0cGFsTG9nZ2VyLmluZm8oYFVzZXJzIGluZGV4ZWQgc3VjY2Vzc2Z1bGx5IChpbmRleC1pZDogJHsgdGhpcy5faWQgfSlgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBJbmRleCByb29tcyBieSBkYXRhYmFzZSBjdXJzb3Jcblx0ICogQHByaXZhdGVcblx0ICovXG5cdF9pbmRleFJvb21zKCkge1xuXHRcdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQoe3Q6eyRuZTonZCd9fSk7XG5cblx0XHRDaGF0cGFsTG9nZ2VyLmRlYnVnKGBTdGFydCBpbmRleGluZyAkeyBjdXJzb3IuY291bnQoKSB9IHJvb21zYCk7XG5cblx0XHRjdXJzb3IuZm9yRWFjaCgocm9vbSkgPT4ge1xuXHRcdFx0dGhpcy5pbmRleERvYygncm9vbScsIHJvb20sIGZhbHNlKTtcblx0XHR9KTtcblxuXHRcdENoYXRwYWxMb2dnZXIuaW5mbyhgUm9vbXMgaW5kZXhlZCBzdWNjZXNzZnVsbHkgKGluZGV4LWlkOiAkeyB0aGlzLl9pZCB9KWApO1xuXHR9XG5cblx0X2luZGV4TWVzc2FnZXMoZGF0ZSwgZ2FwKSB7XG5cblx0XHRjb25zdCBzdGFydCA9IG5ldyBEYXRlKGRhdGUgLSBnYXApO1xuXHRcdGNvbnN0IGVuZCA9IG5ldyBEYXRlKGRhdGUpO1xuXG5cdFx0Y29uc3QgY3Vyc29yID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMubW9kZWwuZmluZCh7dHM6eyRndDogc3RhcnQsICRsdDogZW5kfSwgdDp7JGV4aXN0czpmYWxzZX19KTtcblxuXHRcdENoYXRwYWxMb2dnZXIuZGVidWcoYFN0YXJ0IGluZGV4aW5nICR7IGN1cnNvci5jb3VudCgpIH0gbWVzc2FnZXMgYmV0d2VlbiAkeyBzdGFydC50b1N0cmluZygpIH0gYW5kICR7IGVuZC50b1N0cmluZygpIH1gKTtcblxuXHRcdGN1cnNvci5mb3JFYWNoKChtZXNzYWdlKSA9PiB7XG5cdFx0XHR0aGlzLmluZGV4RG9jKCdtZXNzYWdlJywgbWVzc2FnZSwgZmFsc2UpO1xuXHRcdH0pO1xuXG5cdFx0Q2hhdHBhbExvZ2dlci5pbmZvKGBNZXNzYWdlcyBiZXR3ZWVuICR7IHN0YXJ0LnRvU3RyaW5nKCkgfSBhbmQgJHsgZW5kLnRvU3RyaW5nKCkgfSBpbmRleGVkIHN1Y2Nlc3NmdWxseSAoaW5kZXgtaWQ6ICR7IHRoaXMuX2lkIH0pYCk7XG5cblx0XHRyZXR1cm4gc3RhcnQuZ2V0VGltZSgpO1xuXHR9XG5cblx0X3J1bihkYXRlLCByZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdHRoaXMuX3J1bm5pbmcgPSB0cnVlO1xuXG5cdFx0aWYgKHRoaXMuX2V4aXN0c0RhdGFPbGRlclRoYW4oZGF0ZSkgJiYgIXRoaXMuX2JyZWFrKSB7XG5cblx0XHRcdE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0ZGF0ZSA9IHRoaXMuX2luZGV4TWVzc2FnZXMoZGF0ZSwgKHRoaXMuX29wdGlvbnMud2luZG93U2l6ZSB8fCAyNCkgKiAzNjAwMDAwKTtcblxuXHRcdFx0XHR0aGlzLl9ydW4oZGF0ZSwgcmVzb2x2ZSwgcmVqZWN0KTtcblxuXHRcdFx0fSwgdGhpcy5fb3B0aW9ucy50aW1lb3V0IHx8IDEwMDApO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5fYnJlYWspIHtcblx0XHRcdENoYXRwYWxMb2dnZXIuaW5mbyhgc3RvcHBlZCBib290c3RyYXAgKGluZGV4LWlkOiAkeyB0aGlzLl9pZCB9KWApO1xuXG5cdFx0XHR0aGlzLl9iYXRjaEluZGV4ZXIuZmx1c2goKTtcblxuXHRcdFx0dGhpcy5fcnVubmluZyA9IGZhbHNlO1xuXG5cdFx0XHRyZXNvbHZlKCk7XG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0Q2hhdHBhbExvZ2dlci5pbmZvKGBObyBtZXNzYWdlcyBvbGRlciB0aGFuIGFscmVhZHkgaW5kZXhlZCBkYXRlICR7IG5ldyBEYXRlKGRhdGUpLnRvU3RyaW5nKCkgfWApO1xuXG5cdFx0XHRpZiAodGhpcy5fZG9lc1VzZXJDb3VudERpZmZlcigpICYmICF0aGlzLl9icmVhaykge1xuXHRcdFx0XHR0aGlzLl9pbmRleFVzZXJzKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRDaGF0cGFsTG9nZ2VyLmluZm8oJ1VzZXJzIGFscmVhZHkgaW5kZXhlZCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5fZG9lc1Jvb21Db3VudERpZmZlcigpICYmICF0aGlzLl9icmVhaykge1xuXHRcdFx0XHR0aGlzLl9pbmRleFJvb21zKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRDaGF0cGFsTG9nZ2VyLmluZm8oJ1Jvb21zIGFscmVhZHkgaW5kZXhlZCcpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9iYXRjaEluZGV4ZXIuZmx1c2goKTtcblxuXHRcdFx0Q2hhdHBhbExvZ2dlci5pbmZvKGBmaW5pc2hlZCBib290c3RyYXAgKGluZGV4LWlkOiAkeyB0aGlzLl9pZCB9KWApO1xuXG5cdFx0XHR0aGlzLl9ydW5uaW5nID0gZmFsc2U7XG5cblx0XHRcdHJlc29sdmUoKTtcblx0XHR9XG5cdH1cblxuXHRfYm9vdHN0cmFwKGNsZWFyLCBkYXRlKSB7XG5cblx0XHRDaGF0cGFsTG9nZ2VyLmluZm8oJ1N0YXJ0IGJvb3RzdHJhcHBpbmcnKTtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cblx0XHRcdGlmIChjbGVhcikge1xuXHRcdFx0XHR0aGlzLl9iYWNrZW5kLmNsZWFyKCk7XG5cdFx0XHRcdGRhdGUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fcnVuKGRhdGUsIHJlc29sdmUsIHJlamVjdCk7XG5cblx0XHR9KTtcblx0fVxuXG5cdHN0YXRpYyBwaW5nKG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gQmFja2VuZC5waW5nKG9wdGlvbnMpO1xuXHR9XG5cblx0c3RvcCgpIHtcblx0XHR0aGlzLl9icmVhayA9IHRydWU7XG5cdH1cblxuXHRyZWluZGV4KCkge1xuXHRcdGlmICghdGhpcy5fcnVubmluZykge1xuXHRcdFx0dGhpcy5fYm9vdHN0cmFwKHRydWUpO1xuXHRcdH1cblx0fVxuXG5cdGluZGV4RG9jKHR5cGUsIGRvYywgZmx1c2ggPSB0cnVlKSB7XG5cdFx0dGhpcy5fYmF0Y2hJbmRleGVyLmFkZCh0aGlzLl9nZXRJbmRleERvY3VtZW50KHR5cGUsIGRvYykpO1xuXG5cdFx0aWYgKGZsdXNoKSB7IHRoaXMuX2JhdGNoSW5kZXhlci5mbHVzaCgpOyB9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHJlbW92ZURvYyh0eXBlLCBpZCkge1xuXHRcdHJldHVybiB0aGlzLl9iYWNrZW5kLnJlbW92ZSh0eXBlLCBpZCk7XG5cdH1cblxuXHRxdWVyeSh0ZXh0LCBsYW5ndWFnZSwgYWNsLCB0eXBlLCBzdGFydCwgcm93cywgY2FsbGJhY2ssIHBhcmFtcyA9IHt9KSB7XG5cdFx0dGhpcy5fYmFja2VuZC5xdWVyeSh7XG5cdFx0XHR0ZXh0LFxuXHRcdFx0bGFuZ3VhZ2UsXG5cdFx0XHRhY2wsXG5cdFx0XHR0eXBlLFxuXHRcdFx0c3RhcnQsXG5cdFx0XHRyb3dzLFxuXHRcdFx0Li4ucGFyYW1zXG5cdFx0fSwgY2FsbGJhY2spO1xuXHR9XG5cblx0c3VnZ2VzdCh0ZXh0LCBsYW5ndWFnZSwgYWNsLCB0eXBlLCBjYWxsYmFjaykge1xuXHRcdHRoaXMuX2JhY2tlbmQuc3VnZ2VzdCh7XG5cdFx0XHR0ZXh0LFxuXHRcdFx0bGFuZ3VhZ2UsXG5cdFx0XHRhY2wsXG5cdFx0XHR0eXBlXG5cdFx0fSwgY2FsbGJhY2spO1xuXHR9XG5cbn1cbiIsImNvbnN0IENoYXRwYWxMb2dnZXIgPSBuZXcgTG9nZ2VyKCdDaGF0cGFsIExvZ2dlcicsIHt9KTtcbmV4cG9ydCBkZWZhdWx0IENoYXRwYWxMb2dnZXI7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdjaGF0cGFsVXRpbHNDcmVhdGVLZXknKGVtYWlsKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5jYWxsKCdQT1NUJywgJ2h0dHBzOi8vYmV0YS5jaGF0cGFsLmlvL3YxL2FjY291bnQnLCB7ZGF0YToge2VtYWlsLCB0aWVyOiAnZnJlZSd9fSk7XG5cdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAxKSB7XG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhLmtleTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9LFxuXHQnY2hhdHBhbFV0aWxzR2V0VGFDJyhsYW5nKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5jYWxsKCdHRVQnLCBgaHR0cHM6Ly9iZXRhLmNoYXRwYWwuaW8vdjEvdGVybXMvJHsgbGFuZyB9Lmh0bWxgKTtcblx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID09PSAyMDApIHtcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmNvbnRlbnQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBJbmplY3QgKi9cblxuSW5qZWN0LnJhd0JvZHkoJ2NoYXRwYWwtZW50ZXInLCBBc3NldHMuZ2V0VGV4dCgnc2VydmVyL2Fzc2V0L2NoYXRwYWwtZW50ZXIuc3ZnJykpO1xuSW5qZWN0LnJhd0JvZHkoJ2NoYXRwYWwtbG9nby1pY29uLWRhcmtibHVlJywgQXNzZXRzLmdldFRleHQoJ3NlcnZlci9hc3NldC9jaGF0cGFsLWxvZ28taWNvbi1kYXJrYmx1ZS5zdmcnKSk7XG4iXX0=
