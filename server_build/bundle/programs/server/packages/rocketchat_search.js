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
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var payload;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:search":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/index.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  searchProviderService: () => searchProviderService,
  SearchProvider: () => SearchProvider
});
module.watch(require("./model/provider"));
module.watch(require("./service/providerService.js"));
module.watch(require("./service/validationService.js"));
module.watch(require("./events/events.js"));
module.watch(require("./provider/defaultProvider.js"));
let searchProviderService;
module.watch(require("./service/providerService"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchProvider;
module.watch(require("./model/provider"), {
  default(v) {
    SearchProvider = v;
  }

}, 1);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"events":{"events.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/events/events.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let searchProviderService;
module.watch(require("../service/providerService"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 1);

class EventService {
  /*eslint no-unused-vars: [2, { "args": "none" }]*/
  _pushError(name, value, payload) {
    //TODO implement a (performant) cache
    SearchLogger.debug(`Error on event '${name}' with id '${value}'`);
  }

  promoteEvent(name, value, payload) {
    if (!(searchProviderService.activeProvider && searchProviderService.activeProvider.on(name, value, payload))) {
      this._pushError(name, value, payload);
    }
  }

}

const eventService = new EventService();
/**
 * Listen to message changes via Hooks
 */

RocketChat.callbacks.add('afterSaveMessage', function (m) {
  eventService.promoteEvent('message.save', m._id, m);
});
RocketChat.callbacks.add('afterDeleteMessage', function (m) {
  eventService.promoteEvent('message.delete', m._id);
});
/**
 * Listen to user and room changes via cursor
 */

RocketChat.models.Users.on('change', ({
  clientAction,
  id,
  data
}) => {
  switch (clientAction) {
    case 'updated':
    case 'inserted':
      const user = data || RocketChat.models.Users.findOneById(id);
      eventService.promoteEvent('user.save', id, user);
      break;

    case 'removed':
      eventService.promoteEvent('user.delete', id);
      break;
  }
});
RocketChat.models.Rooms.on('change', ({
  clientAction,
  id,
  data
}) => {
  switch (clientAction) {
    case 'updated':
    case 'inserted':
      const room = data || RocketChat.models.Rooms.findOneById(id);
      eventService.promoteEvent('room.save', id, room);
      break;

    case 'removed':
      eventService.promoteEvent('room.delete', id);
      break;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"logger":{"logger.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/logger/logger.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const SearchLogger = new Logger('Search Logger', {});
module.exportDefault(SearchLogger);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"model":{"provider.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/model/provider.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => SearchProvider
});
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 0);

/**
 * Setting Object in order to manage settings loading for providers and admin ui display
 */
class Setting {
  constructor(basekey, key, type, defaultValue, options = {}) {
    this._basekey = basekey;
    this.key = key;
    this.type = type;
    this.defaultValue = defaultValue;
    this.options = options;
    this._value = undefined;
  }

  get value() {
    return this._value;
  }
  /**
   * Id is generated based on baseKey and key
   * @returns {string}
   */


  get id() {
    return `Search.${this._basekey}.${this.key}`;
  }

  load() {
    this._value = RocketChat.settings.get(this.id);

    if (this._value === undefined) {
      this._value = this.defaultValue;
    }
  }

}
/**
 * Settings Object allows to manage Setting Objects
 */


class Settings {
  constructor(basekey) {
    this.basekey = basekey;
    this.settings = {};
  }

  add(key, type, defaultValue, options) {
    this.settings[key] = new Setting(this.basekey, key, type, defaultValue, options);
  }

  list() {
    return Object.keys(this.settings).map(key => this.settings[key]);
  }

  map() {
    return this.settings;
  }
  /**
   * return the value for key
   * @param key
   */


  get(key) {
    if (!this.settings[key]) {
      throw new Error('Setting is not set');
    }

    return this.settings[key].value;
  }
  /**
   * load currently stored values of all settings
   */


  load() {
    Object.keys(this.settings).forEach(key => {
      this.settings[key].load();
    });
  }

}

class SearchProvider {
  /**
   * Create search provider, key must match /^[a-z0-9]+$/
   * @param key
   */
  constructor(key) {
    if (!key.match(/^[A-z0-9]+$/)) {
      throw new Error(`cannot instantiate provider: ${key} does not match key-pattern`);
    }

    SearchLogger.info(`create search provider ${key}`);
    this._key = key;
    this._settings = new Settings(key);
  }
  /*--- basic params ---*/


  get key() {
    return this._key;
  }

  get i18nLabel() {
    return undefined;
  }

  get i18nDescription() {
    return undefined;
  }

  get iconName() {
    return 'magnifier';
  }

  get settings() {
    return this._settings.list();
  }

  get settingsAsMap() {
    return this._settings.map();
  }
  /*--- templates ---*/


  get resultTemplate() {
    return 'DefaultSearchResultTemplate';
  }

  get suggestionItemTemplate() {
    return 'DefaultSuggestionItemTemplate';
  }
  /*--- search functions ---*/

  /**
   * Search using the current search provider and check if results are valid for the user. The search result has
   * the format {messages:{start:0,numFound:1,docs:[{...}]},users:{...},rooms:{...}}
   * @param text the search text
   * @param context the context (uid, rid)
   * @param payload custom payload (e.g. for paging)
   * @param callback is used to return result an can be called with (error,result)
   */


  search(text, context, payload, callback) {
    throw new Error('Function search has to be implemented');
  }
  /**
   * Returns an ordered list of suggestions. The result should have at least the form [{text:string}]
   * @param text
   * @param context
   * @param payload
   * @param callback
   */


  suggest(text, context, payload, callback) {
    callback(null, []);
  }

  get supportsSuggestions() {
    return false;
  }
  /*--- triggers ---*/


  on(name, value) {
    return true;
  }
  /*--- livecycle ---*/


  run(reason, callback) {
    return new Promise((resolve, reject) => {
      this._settings.load();

      this.start(reason, resolve, reject);
    });
  }

  start(reason, resolve) {
    resolve();
  }

  stop(resolve) {
    resolve();
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"provider":{"defaultProvider.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/provider/defaultProvider.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let searchProviderService;
module.watch(require("../service/providerService"), {
  searchProviderService(v) {
    searchProviderService = v;
  }

}, 0);
let SearchProvider;
module.watch(require("../model/provider"), {
  default(v) {
    SearchProvider = v;
  }

}, 1);

/**
 * Implements the default provider (based on mongo db search)
 */
class DefaultProvider extends SearchProvider {
  /**
   * Enable settings: GlobalSearchEnabled, PageSize
   */
  constructor() {
    super('defaultProvider');

    this._settings.add('GlobalSearchEnabled', 'boolean', false, {
      i18nLabel: 'Global_Search',
      alert: 'This feature is currently in beta and could decrease the application performance! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
    });

    this._settings.add('PageSize', 'int', 10, {
      i18nLabel: 'Search_Page_Size'
    });
  }

  get i18nLabel() {
    return 'Default provider';
  }

  get i18nDescription() {
    return 'You_can_search_using_RegExp_eg';
  }
  /**
   * {@inheritDoc}
   * Uses Meteor function 'messageSearch'
   */


  search(text, context, payload = {}, callback) {
    const _rid = payload.searchAll ? undefined : context.rid;

    const _limit = payload.limit || this._settings.get('PageSize');

    Meteor.call('messageSearch', text, _rid, _limit, callback);
  }

} //register provider


searchProviderService.register(new DefaultProvider());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"service":{"providerService.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/service/providerService.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  searchProviderService: () => searchProviderService
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let validationService;
module.watch(require("../service/validationService"), {
  validationService(v) {
    validationService = v;
  }

}, 1);
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 2);

class SearchProviderService {
  constructor() {
    this.providers = {};
    this.activeProvider = undefined;
  }
  /**
   * Stop current provider (if there is one) and start the new
   * @param id the id of the provider which should be started
   * @param cb a possible callback if provider is active or not (currently not in use)
   */


  use(id) {
    return new Promise((resolve, reject) => {
      if (!this.providers[id]) {
        throw new Error(`provider ${id} cannot be found`);
      }

      let reason = 'switch';

      if (!this.activeProvider) {
        reason = 'startup';
      } else if (this.activeProvider.key === this.providers[id].key) {
        reason = 'update';
      }

      const stopProvider = () => {
        return new Promise((resolve, reject) => {
          if (this.activeProvider) {
            SearchLogger.debug(`Stopping provider '${this.activeProvider.key}'`);
            this.activeProvider.stop(resolve, reject);
          } else {
            resolve();
          }
        });
      };

      stopProvider().then(() => {
        this.activeProvider = undefined;
        SearchLogger.debug(`Start provider '${id}'`);

        try {
          this.providers[id].run(reason).then(() => {
            this.activeProvider = this.providers[id];
            resolve();
          }, reject);
        } catch (e) {
          reject(e);
        }
      }, reject);
    });
  }
  /**
   * Registers a search provider on system startup
   * @param provider
   */


  register(provider) {
    this.providers[provider.key] = provider;
  }
  /**
   * Starts the service (loads provider settings for admin ui, add lister not setting changes, enable current provider
   */


  start() {
    SearchLogger.debug('Load data for all providers');
    const providers = this.providers; //add settings for admininistration

    RocketChat.settings.addGroup('Search', function () {
      const self = this;
      self.add('Search.Provider', 'defaultProvider', {
        type: 'select',
        values: Object.keys(providers).map(key => {
          return {
            key,
            i18nLabel: providers[key].i18nLabel
          };
        }),
        public: true,
        i18nLabel: 'Search_Provider'
      });
      Object.keys(providers).filter(key => providers[key].settings && providers[key].settings.length > 0).forEach(function (key) {
        self.section(providers[key].i18nLabel, function () {
          providers[key].settings.forEach(setting => {
            const _options = (0, _objectSpread2.default)({
              type: setting.type
            }, setting.options);

            _options.enableQuery = _options.enableQuery || [];

            _options.enableQuery.push({
              _id: 'Search.Provider',
              value: key
            });

            this.add(setting.id, setting.defaultValue, _options);
          });
        });
      });
    }); //add listener to react on setting changes

    const configProvider = _.debounce(Meteor.bindEnvironment(() => {
      const providerId = RocketChat.settings.get('Search.Provider');

      if (providerId) {
        this.use(providerId); //TODO do something with success and errors
      }
    }), 1000);

    RocketChat.settings.get(/^Search\./, configProvider);
  }

}

const searchProviderService = new SearchProviderService();
Meteor.startup(() => {
  searchProviderService.start();
});
Meteor.methods({
  /**
   * Search using the current search provider and check if results are valid for the user. The search result has
   * the format {messages:{start:0,numFound:1,docs:[{...}]},users:{...},rooms:{...}}
   * @param text the search text
   * @param context the context (uid, rid)
   * @param payload custom payload (e.g. for paging)
   * @returns {*}
   */
  'rocketchatSearch.search'(text, context, payload) {
    return new Promise((resolve, reject) => {
      payload = payload !== null ? payload : undefined; //TODO is this cleanup necessary?

      try {
        if (!searchProviderService.activeProvider) {
          throw new Error('Provider currently not active');
        }

        SearchLogger.debug('search: ', `\n\tText:${text}\n\tContext:${JSON.stringify(context)}\n\tPayload:${JSON.stringify(payload)}`);
        searchProviderService.activeProvider.search(text, context, payload, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(validationService.validateSearchResult(data));
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  'rocketchatSearch.suggest'(text, context, payload) {
    return new Promise((resolve, reject) => {
      payload = payload !== null ? payload : undefined; //TODO is this cleanup necessary?

      try {
        if (!searchProviderService.activeProvider) {
          throw new Error('Provider currently not active');
        }

        SearchLogger.debug('suggest: ', `\n\tText:${text}\n\tContext:${JSON.stringify(context)}\n\tPayload:${JSON.stringify(payload)}`);
        searchProviderService.activeProvider.suggest(text, context, payload, (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Get the current provider with key, description, resultTemplate, suggestionItemTemplate and settings (as Map)
   * @returns {*}
   */
  'rocketchatSearch.getProvider'() {
    if (!searchProviderService.activeProvider) {
      return undefined;
    }

    return {
      key: searchProviderService.activeProvider.key,
      description: searchProviderService.activeProvider.i18nDescription,
      icon: searchProviderService.activeProvider.iconName,
      resultTemplate: searchProviderService.activeProvider.resultTemplate,
      supportsSuggestions: searchProviderService.activeProvider.supportsSuggestions,
      suggestionItemTemplate: searchProviderService.activeProvider.suggestionItemTemplate,
      settings: _.mapObject(searchProviderService.activeProvider.settingsAsMap, setting => {
        return setting.value;
      })
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validationService.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_search/server/service/validationService.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  validationService: () => validationService
});
let SearchLogger;
module.watch(require("../logger/logger"), {
  default(v) {
    SearchLogger = v;
  }

}, 0);

class ValidationService {
  constructor() {}

  validateSearchResult(result) {
    const subscriptionCache = {};

    const getSubscription = (rid, uid) => {
      if (!subscriptionCache.hasOwnProperty(rid)) {
        subscriptionCache[rid] = Meteor.call('canAccessRoom', rid, uid);
      }

      return subscriptionCache[rid];
    };

    const userCache = {};

    const getUsername = uid => {
      if (!userCache.hasOwnProperty(uid)) {
        try {
          userCache[uid] = RocketChat.models.Users.findById(uid).fetch()[0].username;
        } catch (e) {
          userCache[uid] = undefined;
        }
      }

      return userCache[uid];
    };

    const uid = Meteor.userId(); //get subscription for message

    if (result.message) {
      result.message.docs.forEach(msg => {
        const subscription = getSubscription(msg.rid, uid);

        if (subscription) {
          msg.r = {
            name: subscription.name,
            t: subscription.t
          };
          msg.username = getUsername(msg.user);
          msg.valid = true;
          SearchLogger.debug(`user ${uid} can access ${msg.rid} ( ${subscription.t === 'd' ? subscription.username : subscription.name} )`);
        } else {
          SearchLogger.debug(`user ${uid} can NOT access ${msg.rid}`);
        }
      });
      result.message.docs.filter(msg => {
        return msg.valid;
      });
    }

    if (result.room) {
      result.room.docs.forEach(room => {
        const subscription = getSubscription(room._id, uid);

        if (subscription) {
          room.valid = true;
          SearchLogger.debug(`user ${uid} can access ${room._id} ( ${subscription.t === 'd' ? subscription.username : subscription.name} )`);
        } else {
          SearchLogger.debug(`user ${uid} can NOT access ${room._id}`);
        }
      });
      result.room.docs.filter(room => {
        return room.valid;
      });
    }

    return result;
  }

}

const validationService = new ValidationService();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:search/server/index.js");

/* Exports */
Package._define("rocketchat:search", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_search.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNlYXJjaC9zZXJ2ZXIvZXZlbnRzL2V2ZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL2xvZ2dlci9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2VhcmNoL3NlcnZlci9tb2RlbC9wcm92aWRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL3Byb3ZpZGVyL2RlZmF1bHRQcm92aWRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZWFyY2gvc2VydmVyL3NlcnZpY2UvcHJvdmlkZXJTZXJ2aWNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNlYXJjaC9zZXJ2ZXIvc2VydmljZS92YWxpZGF0aW9uU2VydmljZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJzZWFyY2hQcm92aWRlclNlcnZpY2UiLCJTZWFyY2hQcm92aWRlciIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJkZWZhdWx0IiwiU2VhcmNoTG9nZ2VyIiwiRXZlbnRTZXJ2aWNlIiwiX3B1c2hFcnJvciIsIm5hbWUiLCJ2YWx1ZSIsInBheWxvYWQiLCJkZWJ1ZyIsInByb21vdGVFdmVudCIsImFjdGl2ZVByb3ZpZGVyIiwib24iLCJldmVudFNlcnZpY2UiLCJSb2NrZXRDaGF0IiwiY2FsbGJhY2tzIiwiYWRkIiwibSIsIl9pZCIsIm1vZGVscyIsIlVzZXJzIiwiY2xpZW50QWN0aW9uIiwiaWQiLCJkYXRhIiwidXNlciIsImZpbmRPbmVCeUlkIiwiUm9vbXMiLCJyb29tIiwiTG9nZ2VyIiwiZXhwb3J0RGVmYXVsdCIsIlNldHRpbmciLCJjb25zdHJ1Y3RvciIsImJhc2VrZXkiLCJrZXkiLCJ0eXBlIiwiZGVmYXVsdFZhbHVlIiwib3B0aW9ucyIsIl9iYXNla2V5IiwiX3ZhbHVlIiwidW5kZWZpbmVkIiwibG9hZCIsInNldHRpbmdzIiwiZ2V0IiwiU2V0dGluZ3MiLCJsaXN0IiwiT2JqZWN0Iiwia2V5cyIsIm1hcCIsIkVycm9yIiwiZm9yRWFjaCIsIm1hdGNoIiwiaW5mbyIsIl9rZXkiLCJfc2V0dGluZ3MiLCJpMThuTGFiZWwiLCJpMThuRGVzY3JpcHRpb24iLCJpY29uTmFtZSIsInNldHRpbmdzQXNNYXAiLCJyZXN1bHRUZW1wbGF0ZSIsInN1Z2dlc3Rpb25JdGVtVGVtcGxhdGUiLCJzZWFyY2giLCJ0ZXh0IiwiY29udGV4dCIsImNhbGxiYWNrIiwic3VnZ2VzdCIsInN1cHBvcnRzU3VnZ2VzdGlvbnMiLCJydW4iLCJyZWFzb24iLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInN0YXJ0Iiwic3RvcCIsIkRlZmF1bHRQcm92aWRlciIsImFsZXJ0IiwiX3JpZCIsInNlYXJjaEFsbCIsInJpZCIsIl9saW1pdCIsImxpbWl0IiwiTWV0ZW9yIiwiY2FsbCIsInJlZ2lzdGVyIiwiXyIsInZhbGlkYXRpb25TZXJ2aWNlIiwiU2VhcmNoUHJvdmlkZXJTZXJ2aWNlIiwicHJvdmlkZXJzIiwidXNlIiwic3RvcFByb3ZpZGVyIiwidGhlbiIsImUiLCJwcm92aWRlciIsImFkZEdyb3VwIiwic2VsZiIsInZhbHVlcyIsInB1YmxpYyIsImZpbHRlciIsImxlbmd0aCIsInNlY3Rpb24iLCJzZXR0aW5nIiwiX29wdGlvbnMiLCJlbmFibGVRdWVyeSIsInB1c2giLCJjb25maWdQcm92aWRlciIsImRlYm91bmNlIiwiYmluZEVudmlyb25tZW50IiwicHJvdmlkZXJJZCIsInN0YXJ0dXAiLCJtZXRob2RzIiwiSlNPTiIsInN0cmluZ2lmeSIsImVycm9yIiwidmFsaWRhdGVTZWFyY2hSZXN1bHQiLCJkZXNjcmlwdGlvbiIsImljb24iLCJtYXBPYmplY3QiLCJWYWxpZGF0aW9uU2VydmljZSIsInJlc3VsdCIsInN1YnNjcmlwdGlvbkNhY2hlIiwiZ2V0U3Vic2NyaXB0aW9uIiwidWlkIiwiaGFzT3duUHJvcGVydHkiLCJ1c2VyQ2FjaGUiLCJnZXRVc2VybmFtZSIsImZpbmRCeUlkIiwiZmV0Y2giLCJ1c2VybmFtZSIsInVzZXJJZCIsIm1lc3NhZ2UiLCJkb2NzIiwibXNnIiwic3Vic2NyaXB0aW9uIiwiciIsInQiLCJ2YWxpZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLHlCQUFzQixNQUFJQSxxQkFBM0I7QUFBaURDLGtCQUFlLE1BQUlBO0FBQXBFLENBQWQ7QUFBbUdILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxrQkFBUixDQUFiO0FBQTBDTCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsOEJBQVIsQ0FBYjtBQUFzREwsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLGdDQUFSLENBQWI7QUFBd0RMLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxvQkFBUixDQUFiO0FBQTRDTCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsK0JBQVIsQ0FBYjtBQUF1RCxJQUFJSCxxQkFBSjtBQUEwQkYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDJCQUFSLENBQWIsRUFBa0Q7QUFBQ0gsd0JBQXNCSSxDQUF0QixFQUF3QjtBQUFDSiw0QkFBc0JJLENBQXRCO0FBQXdCOztBQUFsRCxDQUFsRCxFQUFzRyxDQUF0RztBQUF5RyxJQUFJSCxjQUFKO0FBQW1CSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsa0JBQVIsQ0FBYixFQUF5QztBQUFDRSxVQUFRRCxDQUFSLEVBQVU7QUFBQ0gscUJBQWVHLENBQWY7QUFBaUI7O0FBQTdCLENBQXpDLEVBQXdFLENBQXhFLEU7Ozs7Ozs7Ozs7O0FDQXBmLElBQUlKLHFCQUFKO0FBQTBCRixPQUFPSSxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FB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OztBQUNBLFlBQUlXLFlBQUosRUFBa0I7QUFDakJ4RyxlQUFLMkcsS0FBTCxHQUFhLElBQWI7QUFDQW5JLHVCQUFhTSxLQUFiLENBQW9CLFFBQVErRyxHQUFLLGVBQWU3RixLQUFLVCxHQUFLLE1BQU1pSCxhQUFhRSxDQUFiLEtBQW1CLEdBQW5CLEdBQXlCRixhQUFhTCxRQUF0QyxHQUFpREssYUFBYTdILElBQU0sSUFBcEk7QUFDQSxTQUhELE1BR087QUFDTkgsdUJBQWFNLEtBQWIsQ0FBb0IsUUFBUStHLEdBQUssbUJBQW1CN0YsS0FBS1QsR0FBSyxFQUE5RDtBQUNBO0FBQ0QsT0FSRDtBQVVBbUcsYUFBTzFGLElBQVAsQ0FBWXNHLElBQVosQ0FBaUJqQyxNQUFqQixDQUF5QnJFLElBQUQsSUFBVTtBQUNqQyxlQUFPQSxLQUFLMkcsS0FBWjtBQUNBLE9BRkQ7QUFHQTs7QUFFRCxXQUFPakIsTUFBUDtBQUNBOztBQW5Fc0I7O0FBc0VqQixNQUFNakMsb0JBQW9CLElBQUlnQyxpQkFBSixFQUExQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NlYXJjaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi9tb2RlbC9wcm92aWRlcic7XG5pbXBvcnQgJy4vc2VydmljZS9wcm92aWRlclNlcnZpY2UuanMnO1xuaW1wb3J0ICcuL3NlcnZpY2UvdmFsaWRhdGlvblNlcnZpY2UuanMnO1xuaW1wb3J0ICcuL2V2ZW50cy9ldmVudHMuanMnO1xuaW1wb3J0ICcuL3Byb3ZpZGVyL2RlZmF1bHRQcm92aWRlci5qcyc7XG5cbmltcG9ydCB7c2VhcmNoUHJvdmlkZXJTZXJ2aWNlfSBmcm9tICcuL3NlcnZpY2UvcHJvdmlkZXJTZXJ2aWNlJztcbmltcG9ydCBTZWFyY2hQcm92aWRlciBmcm9tICcuL21vZGVsL3Byb3ZpZGVyJztcblxuZXhwb3J0IHtcblx0c2VhcmNoUHJvdmlkZXJTZXJ2aWNlLFxuXHRTZWFyY2hQcm92aWRlclxufTtcbiIsImltcG9ydCB7c2VhcmNoUHJvdmlkZXJTZXJ2aWNlfSBmcm9tICcuLi9zZXJ2aWNlL3Byb3ZpZGVyU2VydmljZSc7XG5pbXBvcnQgU2VhcmNoTG9nZ2VyIGZyb20gJy4uL2xvZ2dlci9sb2dnZXInO1xuXG5jbGFzcyBFdmVudFNlcnZpY2Uge1xuXG5cdC8qZXNsaW50IG5vLXVudXNlZC12YXJzOiBbMiwgeyBcImFyZ3NcIjogXCJub25lXCIgfV0qL1xuXHRfcHVzaEVycm9yKG5hbWUsIHZhbHVlLCBwYXlsb2FkKSB7XG5cdFx0Ly9UT0RPIGltcGxlbWVudCBhIChwZXJmb3JtYW50KSBjYWNoZVxuXHRcdFNlYXJjaExvZ2dlci5kZWJ1ZyhgRXJyb3Igb24gZXZlbnQgJyR7IG5hbWUgfScgd2l0aCBpZCAnJHsgdmFsdWUgfSdgKTtcblx0fVxuXG5cdHByb21vdGVFdmVudChuYW1lLCB2YWx1ZSwgcGF5bG9hZCkge1xuXHRcdGlmICghKHNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlciAmJiBzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIub24obmFtZSwgdmFsdWUsIHBheWxvYWQpKSkge1xuXHRcdFx0dGhpcy5fcHVzaEVycm9yKG5hbWUsIHZhbHVlLCBwYXlsb2FkKTtcblx0XHR9XG5cdH1cbn1cblxuY29uc3QgZXZlbnRTZXJ2aWNlID0gbmV3IEV2ZW50U2VydmljZSgpO1xuXG4vKipcbiAqIExpc3RlbiB0byBtZXNzYWdlIGNoYW5nZXMgdmlhIEhvb2tzXG4gKi9cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG0pIHtcblx0ZXZlbnRTZXJ2aWNlLnByb21vdGVFdmVudCgnbWVzc2FnZS5zYXZlJywgbS5faWQsIG0pO1xufSk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJEZWxldGVNZXNzYWdlJywgZnVuY3Rpb24obSkge1xuXHRldmVudFNlcnZpY2UucHJvbW90ZUV2ZW50KCdtZXNzYWdlLmRlbGV0ZScsIG0uX2lkKTtcbn0pO1xuXG4vKipcbiAqIExpc3RlbiB0byB1c2VyIGFuZCByb29tIGNoYW5nZXMgdmlhIGN1cnNvclxuICovXG5cblxuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMub24oJ2NoYW5nZScsICh7Y2xpZW50QWN0aW9uLCBpZCwgZGF0YX0pID0+IHtcblx0c3dpdGNoIChjbGllbnRBY3Rpb24pIHtcblx0XHRjYXNlICd1cGRhdGVkJzpcblx0XHRjYXNlICdpbnNlcnRlZCc6XG5cdFx0XHRjb25zdCB1c2VyID0gZGF0YSB8fCBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChpZCk7XG5cdFx0XHRldmVudFNlcnZpY2UucHJvbW90ZUV2ZW50KCd1c2VyLnNhdmUnLCBpZCwgdXNlcik7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ3JlbW92ZWQnOlxuXHRcdFx0ZXZlbnRTZXJ2aWNlLnByb21vdGVFdmVudCgndXNlci5kZWxldGUnLCBpZCk7XG5cdFx0XHRicmVhaztcblx0fVxufSk7XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLm9uKCdjaGFuZ2UnLCAoe2NsaWVudEFjdGlvbiwgaWQsIGRhdGF9KSA9PiB7XG5cdHN3aXRjaCAoY2xpZW50QWN0aW9uKSB7XG5cdFx0Y2FzZSAndXBkYXRlZCc6XG5cdFx0Y2FzZSAnaW5zZXJ0ZWQnOlxuXHRcdFx0Y29uc3Qgcm9vbSA9IGRhdGEgfHwgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoaWQpO1xuXHRcdFx0ZXZlbnRTZXJ2aWNlLnByb21vdGVFdmVudCgncm9vbS5zYXZlJywgaWQsIHJvb20pO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdyZW1vdmVkJzpcblx0XHRcdGV2ZW50U2VydmljZS5wcm9tb3RlRXZlbnQoJ3Jvb20uZGVsZXRlJywgaWQpO1xuXHRcdFx0YnJlYWs7XG5cdH1cbn0pO1xuIiwiY29uc3QgU2VhcmNoTG9nZ2VyID0gbmV3IExvZ2dlcignU2VhcmNoIExvZ2dlcicsIHt9KTtcbmV4cG9ydCBkZWZhdWx0IFNlYXJjaExvZ2dlcjtcbiIsIi8qZXNsaW50IG5vLXVudXNlZC12YXJzOiBbMiwgeyBcImFyZ3NcIjogXCJub25lXCIgfV0qL1xuaW1wb3J0IFNlYXJjaExvZ2dlciBmcm9tICcuLi9sb2dnZXIvbG9nZ2VyJztcblxuLyoqXG4gKiBTZXR0aW5nIE9iamVjdCBpbiBvcmRlciB0byBtYW5hZ2Ugc2V0dGluZ3MgbG9hZGluZyBmb3IgcHJvdmlkZXJzIGFuZCBhZG1pbiB1aSBkaXNwbGF5XG4gKi9cbmNsYXNzIFNldHRpbmcge1xuXHRjb25zdHJ1Y3RvcihiYXNla2V5LCBrZXksIHR5cGUsIGRlZmF1bHRWYWx1ZSwgb3B0aW9ucyA9IHt9KSB7XG5cdFx0dGhpcy5fYmFzZWtleSA9IGJhc2VrZXk7XG5cdFx0dGhpcy5rZXkgPSBrZXk7XG5cdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHR0aGlzLmRlZmF1bHRWYWx1ZSA9IGRlZmF1bHRWYWx1ZTtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHRcdHRoaXMuX3ZhbHVlID0gdW5kZWZpbmVkO1xuXHR9XG5cblx0Z2V0IHZhbHVlKCkge1xuXHRcdHJldHVybiB0aGlzLl92YWx1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBJZCBpcyBnZW5lcmF0ZWQgYmFzZWQgb24gYmFzZUtleSBhbmQga2V5XG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdCAqL1xuXHRnZXQgaWQoKSB7XG5cdFx0cmV0dXJuIGBTZWFyY2guJHsgdGhpcy5fYmFzZWtleSB9LiR7IHRoaXMua2V5IH1gO1xuXHR9XG5cblx0bG9hZCgpIHtcblx0XHR0aGlzLl92YWx1ZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KHRoaXMuaWQpO1xuXG5cdFx0aWYgKHRoaXMuX3ZhbHVlID09PSB1bmRlZmluZWQpIHsgdGhpcy5fdmFsdWUgPSB0aGlzLmRlZmF1bHRWYWx1ZTsgfVxuXHR9XG5cbn1cblxuLyoqXG4gKiBTZXR0aW5ncyBPYmplY3QgYWxsb3dzIHRvIG1hbmFnZSBTZXR0aW5nIE9iamVjdHNcbiAqL1xuY2xhc3MgU2V0dGluZ3Mge1xuXHRjb25zdHJ1Y3RvcihiYXNla2V5KSB7XG5cdFx0dGhpcy5iYXNla2V5ID0gYmFzZWtleTtcblx0XHR0aGlzLnNldHRpbmdzID0ge307XG5cdH1cblxuXHRhZGQoa2V5LCB0eXBlLCBkZWZhdWx0VmFsdWUsIG9wdGlvbnMpIHtcblx0XHR0aGlzLnNldHRpbmdzW2tleV0gPSBuZXcgU2V0dGluZyh0aGlzLmJhc2VrZXksIGtleSwgdHlwZSwgZGVmYXVsdFZhbHVlLCBvcHRpb25zKTtcblx0fVxuXG5cdGxpc3QoKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuc2V0dGluZ3MpLm1hcChrZXkgPT4gdGhpcy5zZXR0aW5nc1trZXldKTtcblx0fVxuXG5cdG1hcCgpIHtcblx0XHRyZXR1cm4gdGhpcy5zZXR0aW5ncztcblx0fVxuXG5cdC8qKlxuXHQgKiByZXR1cm4gdGhlIHZhbHVlIGZvciBrZXlcblx0ICogQHBhcmFtIGtleVxuXHQgKi9cblx0Z2V0KGtleSkge1xuXHRcdGlmICghdGhpcy5zZXR0aW5nc1trZXldKSB7IHRocm93IG5ldyBFcnJvcignU2V0dGluZyBpcyBub3Qgc2V0Jyk7IH1cblx0XHRyZXR1cm4gdGhpcy5zZXR0aW5nc1trZXldLnZhbHVlO1xuXHR9XG5cblx0LyoqXG5cdCAqIGxvYWQgY3VycmVudGx5IHN0b3JlZCB2YWx1ZXMgb2YgYWxsIHNldHRpbmdzXG5cdCAqL1xuXHRsb2FkKCkge1xuXHRcdE9iamVjdC5rZXlzKHRoaXMuc2V0dGluZ3MpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0dGhpcy5zZXR0aW5nc1trZXldLmxvYWQoKTtcblx0XHR9KTtcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWFyY2hQcm92aWRlciB7XG5cblx0LyoqXG5cdCAqIENyZWF0ZSBzZWFyY2ggcHJvdmlkZXIsIGtleSBtdXN0IG1hdGNoIC9eW2EtejAtOV0rJC9cblx0ICogQHBhcmFtIGtleVxuXHQgKi9cblx0Y29uc3RydWN0b3Ioa2V5KSB7XG5cblx0XHRpZiAoIWtleS5tYXRjaCgvXltBLXowLTldKyQvKSkgeyB0aHJvdyBuZXcgRXJyb3IoYGNhbm5vdCBpbnN0YW50aWF0ZSBwcm92aWRlcjogJHsga2V5IH0gZG9lcyBub3QgbWF0Y2gga2V5LXBhdHRlcm5gKTsgfVxuXG5cdFx0U2VhcmNoTG9nZ2VyLmluZm8oYGNyZWF0ZSBzZWFyY2ggcHJvdmlkZXIgJHsga2V5IH1gKTtcblxuXHRcdHRoaXMuX2tleSA9IGtleTtcblx0XHR0aGlzLl9zZXR0aW5ncyA9IG5ldyBTZXR0aW5ncyhrZXkpO1xuXHR9XG5cblx0LyotLS0gYmFzaWMgcGFyYW1zIC0tLSovXG5cdGdldCBrZXkoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2tleTtcblx0fVxuXG5cdGdldCBpMThuTGFiZWwoKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGdldCBpMThuRGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGdldCBpY29uTmFtZSgpIHtcblx0XHRyZXR1cm4gJ21hZ25pZmllcic7XG5cdH1cblxuXHRnZXQgc2V0dGluZ3MoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3NldHRpbmdzLmxpc3QoKTtcblx0fVxuXG5cdGdldCBzZXR0aW5nc0FzTWFwKCkge1xuXHRcdHJldHVybiB0aGlzLl9zZXR0aW5ncy5tYXAoKTtcblx0fVxuXG5cdC8qLS0tIHRlbXBsYXRlcyAtLS0qL1xuXHRnZXQgcmVzdWx0VGVtcGxhdGUoKSB7XG5cdFx0cmV0dXJuICdEZWZhdWx0U2VhcmNoUmVzdWx0VGVtcGxhdGUnO1xuXHR9XG5cblx0Z2V0IHN1Z2dlc3Rpb25JdGVtVGVtcGxhdGUoKSB7XG5cdFx0cmV0dXJuICdEZWZhdWx0U3VnZ2VzdGlvbkl0ZW1UZW1wbGF0ZSc7XG5cdH1cblxuXHQvKi0tLSBzZWFyY2ggZnVuY3Rpb25zIC0tLSovXG5cdC8qKlxuXHQgKiBTZWFyY2ggdXNpbmcgdGhlIGN1cnJlbnQgc2VhcmNoIHByb3ZpZGVyIGFuZCBjaGVjayBpZiByZXN1bHRzIGFyZSB2YWxpZCBmb3IgdGhlIHVzZXIuIFRoZSBzZWFyY2ggcmVzdWx0IGhhc1xuXHQgKiB0aGUgZm9ybWF0IHttZXNzYWdlczp7c3RhcnQ6MCxudW1Gb3VuZDoxLGRvY3M6W3suLi59XX0sdXNlcnM6ey4uLn0scm9vbXM6ey4uLn19XG5cdCAqIEBwYXJhbSB0ZXh0IHRoZSBzZWFyY2ggdGV4dFxuXHQgKiBAcGFyYW0gY29udGV4dCB0aGUgY29udGV4dCAodWlkLCByaWQpXG5cdCAqIEBwYXJhbSBwYXlsb2FkIGN1c3RvbSBwYXlsb2FkIChlLmcuIGZvciBwYWdpbmcpXG5cdCAqIEBwYXJhbSBjYWxsYmFjayBpcyB1c2VkIHRvIHJldHVybiByZXN1bHQgYW4gY2FuIGJlIGNhbGxlZCB3aXRoIChlcnJvcixyZXN1bHQpXG5cdCAqL1xuXHRzZWFyY2godGV4dCwgY29udGV4dCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0Z1bmN0aW9uIHNlYXJjaCBoYXMgdG8gYmUgaW1wbGVtZW50ZWQnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGFuIG9yZGVyZWQgbGlzdCBvZiBzdWdnZXN0aW9ucy4gVGhlIHJlc3VsdCBzaG91bGQgaGF2ZSBhdCBsZWFzdCB0aGUgZm9ybSBbe3RleHQ6c3RyaW5nfV1cblx0ICogQHBhcmFtIHRleHRcblx0ICogQHBhcmFtIGNvbnRleHRcblx0ICogQHBhcmFtIHBheWxvYWRcblx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdCAqL1xuXHRzdWdnZXN0KHRleHQsIGNvbnRleHQsIHBheWxvYWQsIGNhbGxiYWNrKSB7XG5cdFx0Y2FsbGJhY2sobnVsbCwgW10pO1xuXHR9XG5cblx0Z2V0IHN1cHBvcnRzU3VnZ2VzdGlvbnMoKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0LyotLS0gdHJpZ2dlcnMgLS0tKi9cblx0b24obmFtZSwgdmFsdWUpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8qLS0tIGxpdmVjeWNsZSAtLS0qL1xuXHRydW4ocmVhc29uLCBjYWxsYmFjaykge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLl9zZXR0aW5ncy5sb2FkKCk7XG5cdFx0XHR0aGlzLnN0YXJ0KHJlYXNvbiwgcmVzb2x2ZSwgcmVqZWN0KTtcblx0XHR9KTtcblx0fVxuXG5cdHN0YXJ0KHJlYXNvbiwgcmVzb2x2ZSkge1xuXHRcdHJlc29sdmUoKTtcblx0fVxuXG5cdHN0b3AocmVzb2x2ZSkge1xuXHRcdHJlc29sdmUoKTtcblx0fVxufVxuXG4iLCJpbXBvcnQge3NlYXJjaFByb3ZpZGVyU2VydmljZX0gZnJvbSAnLi4vc2VydmljZS9wcm92aWRlclNlcnZpY2UnO1xuaW1wb3J0IFNlYXJjaFByb3ZpZGVyIGZyb20gJy4uL21vZGVsL3Byb3ZpZGVyJztcblxuLyoqXG4gKiBJbXBsZW1lbnRzIHRoZSBkZWZhdWx0IHByb3ZpZGVyIChiYXNlZCBvbiBtb25nbyBkYiBzZWFyY2gpXG4gKi9cbmNsYXNzIERlZmF1bHRQcm92aWRlciBleHRlbmRzIFNlYXJjaFByb3ZpZGVyIHtcblxuXHQvKipcblx0ICogRW5hYmxlIHNldHRpbmdzOiBHbG9iYWxTZWFyY2hFbmFibGVkLCBQYWdlU2l6ZVxuXHQgKi9cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2RlZmF1bHRQcm92aWRlcicpO1xuXHRcdHRoaXMuX3NldHRpbmdzLmFkZCgnR2xvYmFsU2VhcmNoRW5hYmxlZCcsICdib29sZWFuJywgZmFsc2UsIHtcblx0XHRcdGkxOG5MYWJlbDogJ0dsb2JhbF9TZWFyY2gnLFxuXHRcdFx0YWxlcnQ6ICdUaGlzIGZlYXR1cmUgaXMgY3VycmVudGx5IGluIGJldGEgYW5kIGNvdWxkIGRlY3JlYXNlIHRoZSBhcHBsaWNhdGlvbiBwZXJmb3JtYW5jZSEgUGxlYXNlIHJlcG9ydCBidWdzIHRvIGdpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9pc3N1ZXMnXG5cdFx0fSk7XG5cdFx0dGhpcy5fc2V0dGluZ3MuYWRkKCdQYWdlU2l6ZScsICdpbnQnLCAxMCwge1xuXHRcdFx0aTE4bkxhYmVsOiAnU2VhcmNoX1BhZ2VfU2l6ZSdcblx0XHR9KTtcblx0fVxuXG5cdGdldCBpMThuTGFiZWwoKSB7XG5cdFx0cmV0dXJuICdEZWZhdWx0IHByb3ZpZGVyJztcblx0fVxuXG5cdGdldCBpMThuRGVzY3JpcHRpb24oKSB7XG5cdFx0cmV0dXJuICdZb3VfY2FuX3NlYXJjaF91c2luZ19SZWdFeHBfZWcnO1xuXHR9XG5cblx0LyoqXG5cdCAqIHtAaW5oZXJpdERvY31cblx0ICogVXNlcyBNZXRlb3IgZnVuY3Rpb24gJ21lc3NhZ2VTZWFyY2gnXG5cdCAqL1xuXHRzZWFyY2godGV4dCwgY29udGV4dCwgcGF5bG9hZCA9IHt9LCBjYWxsYmFjaykge1xuXG5cdFx0Y29uc3QgX3JpZCA9IHBheWxvYWQuc2VhcmNoQWxsID8gdW5kZWZpbmVkIDogY29udGV4dC5yaWQ7XG5cblx0XHRjb25zdCBfbGltaXQgPSBwYXlsb2FkLmxpbWl0IHx8IHRoaXMuX3NldHRpbmdzLmdldCgnUGFnZVNpemUnKTtcblxuXHRcdE1ldGVvci5jYWxsKCdtZXNzYWdlU2VhcmNoJywgdGV4dCwgX3JpZCwgX2xpbWl0LCBjYWxsYmFjayk7XG5cblx0fVxufVxuXG4vL3JlZ2lzdGVyIHByb3ZpZGVyXG5zZWFyY2hQcm92aWRlclNlcnZpY2UucmVnaXN0ZXIobmV3IERlZmF1bHRQcm92aWRlcigpKTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmltcG9ydCB7dmFsaWRhdGlvblNlcnZpY2V9IGZyb20gJy4uL3NlcnZpY2UvdmFsaWRhdGlvblNlcnZpY2UnO1xuaW1wb3J0IFNlYXJjaExvZ2dlciBmcm9tICcuLi9sb2dnZXIvbG9nZ2VyJztcblxuY2xhc3MgU2VhcmNoUHJvdmlkZXJTZXJ2aWNlIHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnByb3ZpZGVycyA9IHt9O1xuXHRcdHRoaXMuYWN0aXZlUHJvdmlkZXIgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogU3RvcCBjdXJyZW50IHByb3ZpZGVyIChpZiB0aGVyZSBpcyBvbmUpIGFuZCBzdGFydCB0aGUgbmV3XG5cdCAqIEBwYXJhbSBpZCB0aGUgaWQgb2YgdGhlIHByb3ZpZGVyIHdoaWNoIHNob3VsZCBiZSBzdGFydGVkXG5cdCAqIEBwYXJhbSBjYiBhIHBvc3NpYmxlIGNhbGxiYWNrIGlmIHByb3ZpZGVyIGlzIGFjdGl2ZSBvciBub3QgKGN1cnJlbnRseSBub3QgaW4gdXNlKVxuXHQgKi9cblx0dXNlKGlkKSB7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLnByb3ZpZGVyc1tpZF0pIHsgdGhyb3cgbmV3IEVycm9yKGBwcm92aWRlciAkeyBpZCB9IGNhbm5vdCBiZSBmb3VuZGApOyB9XG5cblx0XHRcdGxldCByZWFzb24gPSAnc3dpdGNoJztcblxuXHRcdFx0aWYgKCF0aGlzLmFjdGl2ZVByb3ZpZGVyKSB7XG5cdFx0XHRcdHJlYXNvbiA9ICdzdGFydHVwJztcblx0XHRcdH0gZWxzZSBpZiAodGhpcy5hY3RpdmVQcm92aWRlci5rZXkgPT09IHRoaXMucHJvdmlkZXJzW2lkXS5rZXkpIHtcblx0XHRcdFx0cmVhc29uID0gJ3VwZGF0ZSc7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHN0b3BQcm92aWRlciA9ICgpID0+IHtcblx0XHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0XHRpZiAodGhpcy5hY3RpdmVQcm92aWRlcikge1xuXG5cdFx0XHRcdFx0XHRTZWFyY2hMb2dnZXIuZGVidWcoYFN0b3BwaW5nIHByb3ZpZGVyICckeyB0aGlzLmFjdGl2ZVByb3ZpZGVyLmtleSB9J2ApO1xuXG5cdFx0XHRcdFx0XHR0aGlzLmFjdGl2ZVByb3ZpZGVyLnN0b3AocmVzb2x2ZSwgcmVqZWN0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRzdG9wUHJvdmlkZXIoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0dGhpcy5hY3RpdmVQcm92aWRlciA9IHVuZGVmaW5lZDtcblxuXHRcdFx0XHRTZWFyY2hMb2dnZXIuZGVidWcoYFN0YXJ0IHByb3ZpZGVyICckeyBpZCB9J2ApO1xuXG5cdFx0XHRcdHRyeSB7XG5cblx0XHRcdFx0XHR0aGlzLnByb3ZpZGVyc1tpZF0ucnVuKHJlYXNvbikudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHR0aGlzLmFjdGl2ZVByb3ZpZGVyID0gdGhpcy5wcm92aWRlcnNbaWRdO1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHRcdH0sIHJlamVjdCk7XG5cblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgcmVqZWN0KTtcblxuXHRcdH0pO1xuXG5cdH1cblxuXHQvKipcblx0ICogUmVnaXN0ZXJzIGEgc2VhcmNoIHByb3ZpZGVyIG9uIHN5c3RlbSBzdGFydHVwXG5cdCAqIEBwYXJhbSBwcm92aWRlclxuXHQgKi9cblx0cmVnaXN0ZXIocHJvdmlkZXIpIHtcblx0XHR0aGlzLnByb3ZpZGVyc1twcm92aWRlci5rZXldID0gcHJvdmlkZXI7XG5cdH1cblxuXHQvKipcblx0ICogU3RhcnRzIHRoZSBzZXJ2aWNlIChsb2FkcyBwcm92aWRlciBzZXR0aW5ncyBmb3IgYWRtaW4gdWksIGFkZCBsaXN0ZXIgbm90IHNldHRpbmcgY2hhbmdlcywgZW5hYmxlIGN1cnJlbnQgcHJvdmlkZXJcblx0ICovXG5cdHN0YXJ0KCkge1xuXHRcdFNlYXJjaExvZ2dlci5kZWJ1ZygnTG9hZCBkYXRhIGZvciBhbGwgcHJvdmlkZXJzJyk7XG5cblx0XHRjb25zdCBwcm92aWRlcnMgPSB0aGlzLnByb3ZpZGVycztcblxuXHRcdC8vYWRkIHNldHRpbmdzIGZvciBhZG1pbmluaXN0cmF0aW9uXG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnU2VhcmNoJywgZnVuY3Rpb24oKSB7XG5cblx0XHRcdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdFx0XHRzZWxmLmFkZCgnU2VhcmNoLlByb3ZpZGVyJywgJ2RlZmF1bHRQcm92aWRlcicsIHtcblx0XHRcdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0XHRcdHZhbHVlczogT2JqZWN0LmtleXMocHJvdmlkZXJzKS5tYXAoKGtleSkgPT4geyByZXR1cm4ge2tleSwgaTE4bkxhYmVsOiBwcm92aWRlcnNba2V5XS5pMThuTGFiZWx9OyB9KSxcblx0XHRcdFx0cHVibGljOiB0cnVlLFxuXHRcdFx0XHRpMThuTGFiZWw6ICdTZWFyY2hfUHJvdmlkZXInXG5cdFx0XHR9KTtcblxuXHRcdFx0T2JqZWN0LmtleXMocHJvdmlkZXJzKVxuXHRcdFx0XHQuZmlsdGVyKChrZXkpID0+IHByb3ZpZGVyc1trZXldLnNldHRpbmdzICYmIHByb3ZpZGVyc1trZXldLnNldHRpbmdzLmxlbmd0aCA+IDApXG5cdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0XHRcdHNlbGYuc2VjdGlvbihwcm92aWRlcnNba2V5XS5pMThuTGFiZWwsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0cHJvdmlkZXJzW2tleV0uc2V0dGluZ3MuZm9yRWFjaCgoc2V0dGluZykgPT4ge1xuXG5cdFx0XHRcdFx0XHRcdGNvbnN0IF9vcHRpb25zID0ge1xuXHRcdFx0XHRcdFx0XHRcdHR5cGU6IHNldHRpbmcudHlwZSxcblx0XHRcdFx0XHRcdFx0XHQuLi5zZXR0aW5nLm9wdGlvbnNcblx0XHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0XHRfb3B0aW9ucy5lbmFibGVRdWVyeSA9IF9vcHRpb25zLmVuYWJsZVF1ZXJ5IHx8IFtdO1xuXG5cdFx0XHRcdFx0XHRcdF9vcHRpb25zLmVuYWJsZVF1ZXJ5LnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdF9pZDogJ1NlYXJjaC5Qcm92aWRlcicsXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6IGtleVxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHR0aGlzLmFkZChzZXR0aW5nLmlkLCBzZXR0aW5nLmRlZmF1bHRWYWx1ZSwgX29wdGlvbnMpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly9hZGQgbGlzdGVuZXIgdG8gcmVhY3Qgb24gc2V0dGluZyBjaGFuZ2VzXG5cdFx0Y29uc3QgY29uZmlnUHJvdmlkZXIgPSBfLmRlYm91bmNlKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRcdFx0Y29uc3QgcHJvdmlkZXJJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTZWFyY2guUHJvdmlkZXInKTtcblxuXHRcdFx0aWYgKHByb3ZpZGVySWQpIHtcblx0XHRcdFx0dGhpcy51c2UocHJvdmlkZXJJZCk7Ly9UT0RPIGRvIHNvbWV0aGluZyB3aXRoIHN1Y2Nlc3MgYW5kIGVycm9yc1xuXHRcdFx0fVxuXG5cdFx0fSksIDEwMDApO1xuXG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15TZWFyY2hcXC4vLCBjb25maWdQcm92aWRlcik7XG5cdH1cblxufVxuXG5leHBvcnQgY29uc3Qgc2VhcmNoUHJvdmlkZXJTZXJ2aWNlID0gbmV3IFNlYXJjaFByb3ZpZGVyU2VydmljZSgpO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdHNlYXJjaFByb3ZpZGVyU2VydmljZS5zdGFydCgpO1xufSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0LyoqXG5cdCAqIFNlYXJjaCB1c2luZyB0aGUgY3VycmVudCBzZWFyY2ggcHJvdmlkZXIgYW5kIGNoZWNrIGlmIHJlc3VsdHMgYXJlIHZhbGlkIGZvciB0aGUgdXNlci4gVGhlIHNlYXJjaCByZXN1bHQgaGFzXG5cdCAqIHRoZSBmb3JtYXQge21lc3NhZ2VzOntzdGFydDowLG51bUZvdW5kOjEsZG9jczpbey4uLn1dfSx1c2Vyczp7Li4ufSxyb29tczp7Li4ufX1cblx0ICogQHBhcmFtIHRleHQgdGhlIHNlYXJjaCB0ZXh0XG5cdCAqIEBwYXJhbSBjb250ZXh0IHRoZSBjb250ZXh0ICh1aWQsIHJpZClcblx0ICogQHBhcmFtIHBheWxvYWQgY3VzdG9tIHBheWxvYWQgKGUuZy4gZm9yIHBhZ2luZylcblx0ICogQHJldHVybnMgeyp9XG5cdCAqL1xuXHQncm9ja2V0Y2hhdFNlYXJjaC5zZWFyY2gnKHRleHQsIGNvbnRleHQsIHBheWxvYWQpIHtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cblx0XHRcdHBheWxvYWQgPSBwYXlsb2FkICE9PSBudWxsID8gcGF5bG9hZCA6IHVuZGVmaW5lZDsvL1RPRE8gaXMgdGhpcyBjbGVhbnVwIG5lY2Vzc2FyeT9cblxuXHRcdFx0dHJ5IHtcblxuXHRcdFx0XHRpZiAoIXNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlcikge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignUHJvdmlkZXIgY3VycmVudGx5IG5vdCBhY3RpdmUnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdFNlYXJjaExvZ2dlci5kZWJ1Zygnc2VhcmNoOiAnLCBgXFxuXFx0VGV4dDokeyB0ZXh0IH1cXG5cXHRDb250ZXh0OiR7IEpTT04uc3RyaW5naWZ5KGNvbnRleHQpIH1cXG5cXHRQYXlsb2FkOiR7IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpIH1gKTtcblxuXHRcdFx0XHRzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIuc2VhcmNoKHRleHQsIGNvbnRleHQsIHBheWxvYWQsIChlcnJvciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSh2YWxpZGF0aW9uU2VydmljZS52YWxpZGF0ZVNlYXJjaFJlc3VsdChkYXRhKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmVqZWN0KGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9LFxuXHQncm9ja2V0Y2hhdFNlYXJjaC5zdWdnZXN0Jyh0ZXh0LCBjb250ZXh0LCBwYXlsb2FkKSB7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0cGF5bG9hZCA9IHBheWxvYWQgIT09IG51bGwgPyBwYXlsb2FkIDogdW5kZWZpbmVkOy8vVE9ETyBpcyB0aGlzIGNsZWFudXAgbmVjZXNzYXJ5P1xuXG5cdFx0XHR0cnkge1xuXG5cdFx0XHRcdGlmICghc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyKSB7IHRocm93IG5ldyBFcnJvcignUHJvdmlkZXIgY3VycmVudGx5IG5vdCBhY3RpdmUnKTsgfVxuXG5cdFx0XHRcdFNlYXJjaExvZ2dlci5kZWJ1Zygnc3VnZ2VzdDogJywgYFxcblxcdFRleHQ6JHsgdGV4dCB9XFxuXFx0Q29udGV4dDokeyBKU09OLnN0cmluZ2lmeShjb250ZXh0KSB9XFxuXFx0UGF5bG9hZDokeyBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSB9YCk7XG5cblx0XHRcdFx0c2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLnN1Z2dlc3QodGV4dCwgY29udGV4dCwgcGF5bG9hZCwgKGVycm9yLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKGRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0LyoqXG5cdCAqIEdldCB0aGUgY3VycmVudCBwcm92aWRlciB3aXRoIGtleSwgZGVzY3JpcHRpb24sIHJlc3VsdFRlbXBsYXRlLCBzdWdnZXN0aW9uSXRlbVRlbXBsYXRlIGFuZCBzZXR0aW5ncyAoYXMgTWFwKVxuXHQgKiBAcmV0dXJucyB7Kn1cblx0ICovXG5cdCdyb2NrZXRjaGF0U2VhcmNoLmdldFByb3ZpZGVyJygpIHtcblx0XHRpZiAoIXNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlcikgeyByZXR1cm4gdW5kZWZpbmVkOyB9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0a2V5OiBzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIua2V5LFxuXHRcdFx0ZGVzY3JpcHRpb246IHNlYXJjaFByb3ZpZGVyU2VydmljZS5hY3RpdmVQcm92aWRlci5pMThuRGVzY3JpcHRpb24sXG5cdFx0XHRpY29uOiBzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIuaWNvbk5hbWUsXG5cdFx0XHRyZXN1bHRUZW1wbGF0ZTogc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLnJlc3VsdFRlbXBsYXRlLFxuXHRcdFx0c3VwcG9ydHNTdWdnZXN0aW9uczogc2VhcmNoUHJvdmlkZXJTZXJ2aWNlLmFjdGl2ZVByb3ZpZGVyLnN1cHBvcnRzU3VnZ2VzdGlvbnMsXG5cdFx0XHRzdWdnZXN0aW9uSXRlbVRlbXBsYXRlOiBzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIuc3VnZ2VzdGlvbkl0ZW1UZW1wbGF0ZSxcblx0XHRcdHNldHRpbmdzOiBfLm1hcE9iamVjdChzZWFyY2hQcm92aWRlclNlcnZpY2UuYWN0aXZlUHJvdmlkZXIuc2V0dGluZ3NBc01hcCwgKHNldHRpbmcpID0+IHtcblx0XHRcdFx0cmV0dXJuIHNldHRpbmcudmFsdWU7XG5cdFx0XHR9KVxuXHRcdH07XG5cdH1cbn0pO1xuXG4iLCJpbXBvcnQgU2VhcmNoTG9nZ2VyIGZyb20gJy4uL2xvZ2dlci9sb2dnZXInO1xuXG5jbGFzcyBWYWxpZGF0aW9uU2VydmljZSB7XG5cdGNvbnN0cnVjdG9yKCkge31cblxuXHR2YWxpZGF0ZVNlYXJjaFJlc3VsdChyZXN1bHQpIHtcblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbkNhY2hlID0ge307XG5cblx0XHRjb25zdCBnZXRTdWJzY3JpcHRpb24gPSAocmlkLCB1aWQpID0+IHtcblx0XHRcdGlmICghc3Vic2NyaXB0aW9uQ2FjaGUuaGFzT3duUHJvcGVydHkocmlkKSkge1xuXHRcdFx0XHRzdWJzY3JpcHRpb25DYWNoZVtyaWRdID0gTWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCByaWQsIHVpZCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzdWJzY3JpcHRpb25DYWNoZVtyaWRdO1xuXHRcdH07XG5cblx0XHRjb25zdCB1c2VyQ2FjaGUgPSB7fTtcblxuXHRcdGNvbnN0IGdldFVzZXJuYW1lID0gKHVpZCkgPT4ge1xuXHRcdFx0aWYgKCF1c2VyQ2FjaGUuaGFzT3duUHJvcGVydHkodWlkKSkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHVzZXJDYWNoZVt1aWRdID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZEJ5SWQodWlkKS5mZXRjaCgpWzBdLnVzZXJuYW1lO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0dXNlckNhY2hlW3VpZF0gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB1c2VyQ2FjaGVbdWlkXTtcblx0XHR9O1xuXG5cdFx0Y29uc3QgdWlkID0gTWV0ZW9yLnVzZXJJZCgpO1xuXHRcdC8vZ2V0IHN1YnNjcmlwdGlvbiBmb3IgbWVzc2FnZVxuXHRcdGlmIChyZXN1bHQubWVzc2FnZSkge1xuXHRcdFx0cmVzdWx0Lm1lc3NhZ2UuZG9jcy5mb3JFYWNoKChtc2cpID0+IHtcblxuXHRcdFx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBnZXRTdWJzY3JpcHRpb24obXNnLnJpZCwgdWlkKTtcblxuXHRcdFx0XHRpZiAoc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRcdFx0bXNnLnIgPSB7bmFtZTogc3Vic2NyaXB0aW9uLm5hbWUsIHQ6IHN1YnNjcmlwdGlvbi50fTtcblx0XHRcdFx0XHRtc2cudXNlcm5hbWUgPSBnZXRVc2VybmFtZShtc2cudXNlcik7XG5cdFx0XHRcdFx0bXNnLnZhbGlkID0gdHJ1ZTtcblx0XHRcdFx0XHRTZWFyY2hMb2dnZXIuZGVidWcoYHVzZXIgJHsgdWlkIH0gY2FuIGFjY2VzcyAkeyBtc2cucmlkIH0gKCAkeyBzdWJzY3JpcHRpb24udCA9PT0gJ2QnID8gc3Vic2NyaXB0aW9uLnVzZXJuYW1lIDogc3Vic2NyaXB0aW9uLm5hbWUgfSApYCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0U2VhcmNoTG9nZ2VyLmRlYnVnKGB1c2VyICR7IHVpZCB9IGNhbiBOT1QgYWNjZXNzICR7IG1zZy5yaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmVzdWx0Lm1lc3NhZ2UuZG9jcy5maWx0ZXIoKG1zZykgPT4ge1xuXHRcdFx0XHRyZXR1cm4gbXNnLnZhbGlkO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlc3VsdC5yb29tKSB7XG5cdFx0XHRyZXN1bHQucm9vbS5kb2NzLmZvckVhY2goKHJvb20pID0+IHtcblx0XHRcdFx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gZ2V0U3Vic2NyaXB0aW9uKHJvb20uX2lkLCB1aWQpO1xuXHRcdFx0XHRpZiAoc3Vic2NyaXB0aW9uKSB7XG5cdFx0XHRcdFx0cm9vbS52YWxpZCA9IHRydWU7XG5cdFx0XHRcdFx0U2VhcmNoTG9nZ2VyLmRlYnVnKGB1c2VyICR7IHVpZCB9IGNhbiBhY2Nlc3MgJHsgcm9vbS5faWQgfSAoICR7IHN1YnNjcmlwdGlvbi50ID09PSAnZCcgPyBzdWJzY3JpcHRpb24udXNlcm5hbWUgOiBzdWJzY3JpcHRpb24ubmFtZSB9IClgKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRTZWFyY2hMb2dnZXIuZGVidWcoYHVzZXIgJHsgdWlkIH0gY2FuIE5PVCBhY2Nlc3MgJHsgcm9vbS5faWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmVzdWx0LnJvb20uZG9jcy5maWx0ZXIoKHJvb20pID0+IHtcblx0XHRcdFx0cmV0dXJuIHJvb20udmFsaWQ7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG59XG5cbmV4cG9ydCBjb25zdCB2YWxpZGF0aW9uU2VydmljZSA9IG5ldyBWYWxpZGF0aW9uU2VydmljZSgpO1xuIl19
