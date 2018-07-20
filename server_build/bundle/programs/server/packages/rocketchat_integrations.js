(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var Babel = Package['babel-compiler'].Babel;
var BabelCompiler = Package['babel-compiler'].BabelCompiler;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var logger, integration, message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:integrations":{"lib":{"rocketchat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/lib/rocketchat.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.integrations = {
  outgoingEvents: {
    sendMessage: {
      label: 'Integrations_Outgoing_Type_SendMessage',
      value: 'sendMessage',
      use: {
        channel: true,
        triggerWords: true,
        targetRoom: false
      }
    },
    fileUploaded: {
      label: 'Integrations_Outgoing_Type_FileUploaded',
      value: 'fileUploaded',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomArchived: {
      label: 'Integrations_Outgoing_Type_RoomArchived',
      value: 'roomArchived',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomCreated: {
      label: 'Integrations_Outgoing_Type_RoomCreated',
      value: 'roomCreated',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomJoined: {
      label: 'Integrations_Outgoing_Type_RoomJoined',
      value: 'roomJoined',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomLeft: {
      label: 'Integrations_Outgoing_Type_RoomLeft',
      value: 'roomLeft',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    userCreated: {
      label: 'Integrations_Outgoing_Type_UserCreated',
      value: 'userCreated',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: true
      }
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"logger.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/logger.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals logger:true */

/* exported logger */
logger = new Logger('Integrations', {
  sections: {
    incoming: 'Incoming WebHook',
    outgoing: 'Outgoing WebHook'
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"validation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/lib/validation.js                                                          //
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
const scopedChannels = ['all_public_channels', 'all_private_groups', 'all_direct_messages'];
const validChannelChars = ['@', '#'];

function _verifyRequiredFields(integration) {
  if (!integration.event || !Match.test(integration.event, String) || integration.event.trim() === '' || !RocketChat.integrations.outgoingEvents[integration.event]) {
    throw new Meteor.Error('error-invalid-event-type', 'Invalid event type', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (!integration.username || !Match.test(integration.username, String) || integration.username.trim() === '') {
    throw new Meteor.Error('error-invalid-username', 'Invalid username', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (RocketChat.integrations.outgoingEvents[integration.event].use.targetRoom && !integration.targetRoom) {
    throw new Meteor.Error('error-invalid-targetRoom', 'Invalid Target Room', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (!Match.test(integration.urls, [String])) {
    throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  for (const [index, url] of integration.urls.entries()) {
    if (url.trim() === '') {
      delete integration.urls[index];
    }
  }

  integration.urls = _.without(integration.urls, [undefined]);

  if (integration.urls.length === 0) {
    throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }
}

function _verifyUserHasPermissionForChannels(integration, userId, channels) {
  for (let channel of channels) {
    if (scopedChannels.includes(channel)) {
      if (channel === 'all_public_channels') {// No special permissions needed to add integration to public channels
      } else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }
    } else {
      let record;
      const channelType = channel[0];
      channel = channel.substr(1);

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }

      if (!RocketChat.authz.hasAllPermission(userId, 'manage-integrations', 'manage-own-integrations') && !RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(record._id, userId, {
        fields: {
          _id: 1
        }
      })) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }
    }
  }
}

function _verifyRetryInformation(integration) {
  if (!integration.retryFailedCalls) {
    return;
  } // Don't allow negative retry counts


  integration.retryCount = integration.retryCount && parseInt(integration.retryCount) > 0 ? parseInt(integration.retryCount) : 4;
  integration.retryDelay = !integration.retryDelay || !integration.retryDelay.trim() ? 'powers-of-ten' : integration.retryDelay.toLowerCase();
}

RocketChat.integrations.validateOutgoing = function _validateOutgoing(integration, userId) {
  if (integration.channel && Match.test(integration.channel, String) && integration.channel.trim() === '') {
    delete integration.channel;
  } //Moved to it's own function to statisfy the complexity rule


  _verifyRequiredFields(integration);

  let channels = [];

  if (RocketChat.integrations.outgoingEvents[integration.event].use.channel) {
    if (!Match.test(integration.channel, String)) {
      throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
        function: 'validateOutgoing'
      });
    } else {
      channels = _.map(integration.channel.split(','), channel => s.trim(channel));

      for (const channel of channels) {
        if (!validChannelChars.includes(channel[0]) && !scopedChannels.includes(channel.toLowerCase())) {
          throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
            function: 'validateOutgoing'
          });
        }
      }
    }
  } else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
    throw new Meteor.Error('error-invalid-permissions', 'Invalid permission for required Integration creation.', {
      function: 'validateOutgoing'
    });
  }

  if (RocketChat.integrations.outgoingEvents[integration.event].use.triggerWords && integration.triggerWords) {
    if (!Match.test(integration.triggerWords, [String])) {
      throw new Meteor.Error('error-invalid-triggerWords', 'Invalid triggerWords', {
        function: 'validateOutgoing'
      });
    }

    integration.triggerWords.forEach((word, index) => {
      if (!word || word.trim() === '') {
        delete integration.triggerWords[index];
      }
    });
    integration.triggerWords = _.without(integration.triggerWords, [undefined]);
  } else {
    delete integration.triggerWords;
  }

  if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
    try {
      const babelOptions = Object.assign(Babel.getDefaultOptions({
        runtime: false
      }), {
        compact: true,
        minified: true,
        comments: false
      });
      integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
      integration.scriptError = undefined;
    } catch (e) {
      integration.scriptCompiled = undefined;
      integration.scriptError = _.pick(e, 'name', 'message', 'stack');
    }
  }

  if (typeof integration.runOnEdits !== 'undefined') {
    // Verify this value is only true/false
    integration.runOnEdits = integration.runOnEdits === true;
  }

  _verifyUserHasPermissionForChannels(integration, userId, channels);

  _verifyRetryInformation(integration);

  const user = RocketChat.models.Users.findOne({
    username: integration.username
  });

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user (did you delete the `rocket.cat` user?)', {
      function: 'validateOutgoing'
    });
  }

  integration.type = 'webhook-outgoing';
  integration.userId = user._id;
  integration.channel = channels;
  return integration;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"triggerHandler.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/lib/triggerHandler.js                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

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
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);
let vm;
module.watch(require("vm"), {
  default(v) {
    vm = v;
  }

}, 3);
let Fiber;
module.watch(require("fibers"), {
  default(v) {
    Fiber = v;
  }

}, 4);
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 5);
RocketChat.integrations.triggerHandler = new class RocketChatIntegrationHandler {
  constructor() {
    this.vm = vm;
    this.successResults = [200, 201, 202];
    this.compiledScripts = {};
    this.triggers = {};
    RocketChat.models.Integrations.find({
      type: 'webhook-outgoing'
    }).observe({
      added: record => {
        this.addIntegration(record);
      },
      changed: record => {
        this.removeIntegration(record);
        this.addIntegration(record);
      },
      removed: record => {
        this.removeIntegration(record);
      }
    });
  }

  addIntegration(record) {
    logger.outgoing.debug(`Adding the integration ${record.name} of the event ${record.event}!`);
    let channels;

    if (record.event && !RocketChat.integrations.outgoingEvents[record.event].use.channel) {
      logger.outgoing.debug('The integration doesnt rely on channels.'); //We don't use any channels, so it's special ;)

      channels = ['__any'];
    } else if (_.isEmpty(record.channel)) {
      logger.outgoing.debug('The integration had an empty channel property, so it is going on all the public channels.');
      channels = ['all_public_channels'];
    } else {
      logger.outgoing.debug('The integration is going on these channels:', record.channel);
      channels = [].concat(record.channel);
    }

    for (const channel of channels) {
      if (!this.triggers[channel]) {
        this.triggers[channel] = {};
      }

      this.triggers[channel][record._id] = record;
    }
  }

  removeIntegration(record) {
    for (const trigger of Object.values(this.triggers)) {
      delete trigger[record._id];
    }
  }

  isTriggerEnabled(trigger) {
    for (const trig of Object.values(this.triggers)) {
      if (trig[trigger._id]) {
        return trig[trigger._id].enabled;
      }
    }

    return false;
  }

  updateHistory({
    historyId,
    step,
    integration,
    event,
    data,
    triggerWord,
    ranPrepareScript,
    prepareSentMessage,
    processSentMessage,
    resultMessage,
    finished,
    url,
    httpCallData,
    httpError,
    httpResult,
    error,
    errorStack
  }) {
    const history = {
      type: 'outgoing-webhook',
      step
    }; // Usually is only added on initial insert

    if (integration) {
      history.integration = integration;
    } // Usually is only added on initial insert


    if (event) {
      history.event = event;
    }

    if (data) {
      history.data = (0, _objectSpread2.default)({}, data);

      if (data.user) {
        history.data.user = _.omit(data.user, ['services']);
      }

      if (data.room) {
        history.data.room = data.room;
      }
    }

    if (triggerWord) {
      history.triggerWord = triggerWord;
    }

    if (typeof ranPrepareScript !== 'undefined') {
      history.ranPrepareScript = ranPrepareScript;
    }

    if (prepareSentMessage) {
      history.prepareSentMessage = prepareSentMessage;
    }

    if (processSentMessage) {
      history.processSentMessage = processSentMessage;
    }

    if (resultMessage) {
      history.resultMessage = resultMessage;
    }

    if (typeof finished !== 'undefined') {
      history.finished = finished;
    }

    if (url) {
      history.url = url;
    }

    if (typeof httpCallData !== 'undefined') {
      history.httpCallData = httpCallData;
    }

    if (httpError) {
      history.httpError = httpError;
    }

    if (typeof httpResult !== 'undefined') {
      history.httpResult = JSON.stringify(httpResult, null, 2);
    }

    if (typeof error !== 'undefined') {
      history.error = error;
    }

    if (typeof errorStack !== 'undefined') {
      history.errorStack = errorStack;
    }

    if (historyId) {
      RocketChat.models.IntegrationHistory.update({
        _id: historyId
      }, {
        $set: history
      });
      return historyId;
    } else {
      history._createdAt = new Date();
      return RocketChat.models.IntegrationHistory.insert(Object.assign({
        _id: Random.id()
      }, history));
    }
  } //Trigger is the trigger, nameOrId is a string which is used to try and find a room, room is a room, message is a message, and data contains "user_name" if trigger.impersonateUser is truthful.


  sendMessage({
    trigger,
    nameOrId = '',
    room,
    message,
    data
  }) {
    let user; //Try to find the user who we are impersonating

    if (trigger.impersonateUser) {
      user = RocketChat.models.Users.findOneByUsername(data.user_name);
    } //If they don't exist (aka the trigger didn't contain a user) then we set the user based upon the
    //configured username for the integration since this is required at all times.


    if (!user) {
      user = RocketChat.models.Users.findOneByUsername(trigger.username);
    }

    let tmpRoom;

    if (nameOrId || trigger.targetRoom || message.channel) {
      tmpRoom = RocketChat.getRoomByNameOrIdWithOptionToJoin({
        currentUserId: user._id,
        nameOrId: nameOrId || message.channel || trigger.targetRoom,
        errorOnEmpty: false
      }) || room;
    } else {
      tmpRoom = room;
    } //If no room could be found, we won't be sending any messages but we'll warn in the logs


    if (!tmpRoom) {
      logger.outgoing.warn(`The Integration "${trigger.name}" doesn't have a room configured nor did it provide a room to send the message to.`);
      return;
    }

    logger.outgoing.debug(`Found a room for ${trigger.name} which is: ${tmpRoom.name} with a type of ${tmpRoom.t}`);
    message.bot = {
      i: trigger._id
    };
    const defaultValues = {
      alias: trigger.alias,
      avatar: trigger.avatar,
      emoji: trigger.emoji
    };

    if (tmpRoom.t === 'd') {
      message.channel = `@${tmpRoom._id}`;
    } else {
      message.channel = `#${tmpRoom._id}`;
    }

    message = processWebhookMessage(message, user, defaultValues);
    return message;
  }

  buildSandbox(store = {}) {
    const sandbox = {
      scriptTimeout(reject) {
        return setTimeout(() => reject('timed out'), 3000);
      },

      _,
      s,
      console,
      moment,
      Fiber,
      Promise,
      Store: {
        set: (key, val) => store[key] = val,
        get: key => store[key]
      },
      HTTP: (method, url, options) => {
        try {
          return {
            result: HTTP.call(method, url, options)
          };
        } catch (error) {
          return {
            error
          };
        }
      }
    };
    Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => {
      sandbox[k] = RocketChat.models[k];
    });
    return {
      store,
      sandbox
    };
  }

  getIntegrationScript(integration) {
    const compiledScript = this.compiledScripts[integration._id];

    if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
      return compiledScript.script;
    }

    const script = integration.scriptCompiled;
    const {
      store,
      sandbox
    } = this.buildSandbox();
    let vmScript;

    try {
      logger.outgoing.info('Will evaluate script of Trigger', integration.name);
      logger.outgoing.debug(script);
      vmScript = this.vm.createScript(script, 'script.js');
      vmScript.runInNewContext(sandbox);

      if (sandbox.Script) {
        this.compiledScripts[integration._id] = {
          script: new sandbox.Script(),
          store,
          _updatedAt: integration._updatedAt
        };
        return this.compiledScripts[integration._id].script;
      }
    } catch (e) {
      logger.outgoing.error(`Error evaluating Script in Trigger ${integration.name}:`);
      logger.outgoing.error(script.replace(/^/gm, '  '));
      logger.outgoing.error('Stack Trace:');
      logger.outgoing.error(e.stack.replace(/^/gm, '  '));
      throw new Meteor.Error('error-evaluating-script');
    }

    if (!sandbox.Script) {
      logger.outgoing.error(`Class "Script" not in Trigger ${integration.name}:`);
      throw new Meteor.Error('class-script-not-found');
    }
  }

  hasScriptAndMethod(integration, method) {
    if (integration.scriptEnabled !== true || !integration.scriptCompiled || integration.scriptCompiled.trim() === '') {
      return false;
    }

    let script;

    try {
      script = this.getIntegrationScript(integration);
    } catch (e) {
      return false;
    }

    return typeof script[method] !== 'undefined';
  }

  executeScript(integration, method, params, historyId) {
    let script;

    try {
      script = this.getIntegrationScript(integration);
    } catch (e) {
      this.updateHistory({
        historyId,
        step: 'execute-script-getting-script',
        error: true,
        errorStack: e
      });
      return;
    }

    if (!script[method]) {
      logger.outgoing.error(`Method "${method}" no found in the Integration "${integration.name}"`);
      this.updateHistory({
        historyId,
        step: `execute-script-no-method-${method}`
      });
      return;
    }

    try {
      const {
        sandbox
      } = this.buildSandbox(this.compiledScripts[integration._id].store);
      sandbox.script = script;
      sandbox.method = method;
      sandbox.params = params;
      this.updateHistory({
        historyId,
        step: `execute-script-before-running-${method}`
      });
      const result = Future.fromPromise(this.vm.runInNewContext(`
				new Promise((resolve, reject) => {
					Fiber(() => {
						scriptTimeout(reject);
						try {
							resolve(script[method](params))
						} catch(e) {
							reject(e);
						}
					}).run();
				}).catch((error) => { throw new Error(error); });
			`, sandbox, {
        timeout: 3000
      })).wait();
      logger.outgoing.debug(`Script method "${method}" result of the Integration "${integration.name}" is:`);
      logger.outgoing.debug(result);
      return result;
    } catch (e) {
      this.updateHistory({
        historyId,
        step: `execute-script-error-running-${method}`,
        error: true,
        errorStack: e.stack.replace(/^/gm, '  ')
      });
      logger.outgoing.error(`Error running Script in the Integration ${integration.name}:`);
      logger.outgoing.debug(integration.scriptCompiled.replace(/^/gm, '  ')); // Only output the compiled script if debugging is enabled, so the logs don't get spammed.

      logger.outgoing.error('Stack:');
      logger.outgoing.error(e.stack.replace(/^/gm, '  '));
      return;
    }
  }

  eventNameArgumentsToObject() {
    const argObject = {
      event: arguments[0]
    };

    switch (argObject.event) {
      case 'sendMessage':
        if (arguments.length >= 3) {
          argObject.message = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'fileUploaded':
        if (arguments.length >= 2) {
          const arghhh = arguments[1];
          argObject.user = arghhh.user;
          argObject.room = arghhh.room;
          argObject.message = arghhh.message;
        }

        break;

      case 'roomArchived':
        if (arguments.length >= 3) {
          argObject.room = arguments[1];
          argObject.user = arguments[2];
        }

        break;

      case 'roomCreated':
        if (arguments.length >= 3) {
          argObject.owner = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'roomJoined':
      case 'roomLeft':
        if (arguments.length >= 3) {
          argObject.user = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'userCreated':
        if (arguments.length >= 2) {
          argObject.user = arguments[1];
        }

        break;

      default:
        logger.outgoing.warn(`An Unhandled Trigger Event was called: ${argObject.event}`);
        argObject.event = undefined;
        break;
    }

    logger.outgoing.debug(`Got the event arguments for the event: ${argObject.event}`, argObject);
    return argObject;
  }

  mapEventArgsToData(data, {
    event,
    message,
    room,
    owner,
    user
  }) {
    switch (event) {
      case 'sendMessage':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.message_id = message._id;
        data.timestamp = message.ts;
        data.user_id = message.u._id;
        data.user_name = message.u.username;
        data.text = message.msg;

        if (message.alias) {
          data.alias = message.alias;
        }

        if (message.bot) {
          data.bot = message.bot;
        }

        if (message.editedAt) {
          data.isEdited = true;
        }

        break;

      case 'fileUploaded':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.message_id = message._id;
        data.timestamp = message.ts;
        data.user_id = message.u._id;
        data.user_name = message.u.username;
        data.text = message.msg;
        data.user = user;
        data.room = room;
        data.message = message;

        if (message.alias) {
          data.alias = message.alias;
        }

        if (message.bot) {
          data.bot = message.bot;
        }

        break;

      case 'roomCreated':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.timestamp = room.ts;
        data.user_id = owner._id;
        data.user_name = owner.username;
        data.owner = owner;
        data.room = room;
        break;

      case 'roomArchived':
      case 'roomJoined':
      case 'roomLeft':
        data.timestamp = new Date();
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.user_id = user._id;
        data.user_name = user.username;
        data.user = user;
        data.room = room;

        if (user.type === 'bot') {
          data.bot = true;
        }

        break;

      case 'userCreated':
        data.timestamp = user.createdAt;
        data.user_id = user._id;
        data.user_name = user.username;
        data.user = user;

        if (user.type === 'bot') {
          data.bot = true;
        }

        break;

      default:
        break;
    }
  }

  executeTriggers() {
    logger.outgoing.debug('Execute Trigger:', arguments[0]);
    const argObject = this.eventNameArgumentsToObject(...arguments);
    const {
      event,
      message,
      room
    } = argObject; //Each type of event should have an event and a room attached, otherwise we
    //wouldn't know how to handle the trigger nor would we have anywhere to send the
    //result of the integration

    if (!event) {
      return;
    }

    const triggersToExecute = [];
    logger.outgoing.debug('Starting search for triggers for the room:', room ? room._id : '__any');

    if (room) {
      switch (room.t) {
        case 'd':
          const id = room._id.replace(message.u._id, '');

          const username = _.without(room.usernames, message.u.username)[0];

          if (this.triggers[`@${id}`]) {
            for (const trigger of Object.values(this.triggers[`@${id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers.all_direct_messages) {
            for (const trigger of Object.values(this.triggers.all_direct_messages)) {
              triggersToExecute.push(trigger);
            }
          }

          if (id !== username && this.triggers[`@${username}`]) {
            for (const trigger of Object.values(this.triggers[`@${username}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;

        case 'c':
          if (this.triggers.all_public_channels) {
            for (const trigger of Object.values(this.triggers.all_public_channels)) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers[`#${room._id}`]) {
            for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (room._id !== room.name && this.triggers[`#${room.name}`]) {
            for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;

        default:
          if (this.triggers.all_private_groups) {
            for (const trigger of Object.values(this.triggers.all_private_groups)) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers[`#${room._id}`]) {
            for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (room._id !== room.name && this.triggers[`#${room.name}`]) {
            for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;
      }
    }

    if (this.triggers.__any) {
      //For outgoing integration which don't rely on rooms.
      for (const trigger of Object.values(this.triggers.__any)) {
        triggersToExecute.push(trigger);
      }
    }

    logger.outgoing.debug(`Found ${triggersToExecute.length} to iterate over and see if the match the event.`);

    for (const triggerToExecute of triggersToExecute) {
      logger.outgoing.debug(`Is "${triggerToExecute.name}" enabled, ${triggerToExecute.enabled}, and what is the event? ${triggerToExecute.event}`);

      if (triggerToExecute.enabled === true && triggerToExecute.event === event) {
        this.executeTrigger(triggerToExecute, argObject);
      }
    }
  }

  executeTrigger(trigger, argObject) {
    for (const url of trigger.urls) {
      this.executeTriggerUrl(url, trigger, argObject, 0);
    }
  }

  executeTriggerUrl(url, trigger, {
    event,
    message,
    room,
    owner,
    user
  }, theHistoryId, tries = 0) {
    if (!this.isTriggerEnabled(trigger)) {
      logger.outgoing.warn(`The trigger "${trigger.name}" is no longer enabled, stopping execution of it at try: ${tries}`);
      return;
    }

    logger.outgoing.debug(`Starting to execute trigger: ${trigger.name} (${trigger._id})`);
    let word; //Not all triggers/events support triggerWords

    if (RocketChat.integrations.outgoingEvents[event].use.triggerWords) {
      if (trigger.triggerWords && trigger.triggerWords.length > 0) {
        for (const triggerWord of trigger.triggerWords) {
          if (!trigger.triggerWordAnywhere && message.msg.indexOf(triggerWord) === 0) {
            word = triggerWord;
            break;
          } else if (trigger.triggerWordAnywhere && message.msg.includes(triggerWord)) {
            word = triggerWord;
            break;
          }
        } // Stop if there are triggerWords but none match


        if (!word) {
          logger.outgoing.debug(`The trigger word which "${trigger.name}" was expecting could not be found, not executing.`);
          return;
        }
      }
    }

    if (message && message.editedAt && !trigger.runOnEdits) {
      logger.outgoing.debug(`The trigger "${trigger.name}"'s run on edits is disabled and the message was edited.`);
      return;
    }

    const historyId = this.updateHistory({
      step: 'start-execute-trigger-url',
      integration: trigger,
      event
    });
    const data = {
      token: trigger.token,
      bot: false
    };

    if (word) {
      data.trigger_word = word;
    }

    this.mapEventArgsToData(data, {
      trigger,
      event,
      message,
      room,
      owner,
      user
    });
    this.updateHistory({
      historyId,
      step: 'mapped-args-to-data',
      data,
      triggerWord: word
    });
    logger.outgoing.info(`Will be executing the Integration "${trigger.name}" to the url: ${url}`);
    logger.outgoing.debug(data);
    let opts = {
      params: {},
      method: 'POST',
      url,
      data,
      auth: undefined,
      npmRequestOptions: {
        rejectUnauthorized: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs'),
        strictSSL: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs')
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
      }
    };

    if (this.hasScriptAndMethod(trigger, 'prepare_outgoing_request')) {
      opts = this.executeScript(trigger, 'prepare_outgoing_request', {
        request: opts
      }, historyId);
    }

    this.updateHistory({
      historyId,
      step: 'after-maybe-ran-prepare',
      ranPrepareScript: true
    });

    if (!opts) {
      this.updateHistory({
        historyId,
        step: 'after-prepare-no-opts',
        finished: true
      });
      return;
    }

    if (opts.message) {
      const prepareMessage = this.sendMessage({
        trigger,
        room,
        message: opts.message,
        data
      });
      this.updateHistory({
        historyId,
        step: 'after-prepare-send-message',
        prepareSentMessage: prepareMessage
      });
    }

    if (!opts.url || !opts.method) {
      this.updateHistory({
        historyId,
        step: 'after-prepare-no-url_or_method',
        finished: true
      });
      return;
    }

    this.updateHistory({
      historyId,
      step: 'pre-http-call',
      url: opts.url,
      httpCallData: opts.data
    });
    HTTP.call(opts.method, opts.url, opts, (error, result) => {
      if (!result) {
        logger.outgoing.warn(`Result for the Integration ${trigger.name} to ${url} is empty`);
      } else {
        logger.outgoing.info(`Status code for the Integration ${trigger.name} to ${url} is ${result.statusCode}`);
      }

      this.updateHistory({
        historyId,
        step: 'after-http-call',
        httpError: error,
        httpResult: result
      });

      if (this.hasScriptAndMethod(trigger, 'process_outgoing_response')) {
        const sandbox = {
          request: opts,
          response: {
            error,
            status_code: result ? result.statusCode : undefined,
            //These values will be undefined to close issues #4175, #5762, and #5896
            content: result ? result.data : undefined,
            content_raw: result ? result.content : undefined,
            headers: result ? result.headers : {}
          }
        };
        const scriptResult = this.executeScript(trigger, 'process_outgoing_response', sandbox, historyId);

        if (scriptResult && scriptResult.content) {
          const resultMessage = this.sendMessage({
            trigger,
            room,
            message: scriptResult.content,
            data
          });
          this.updateHistory({
            historyId,
            step: 'after-process-send-message',
            processSentMessage: resultMessage,
            finished: true
          });
          return;
        }

        if (scriptResult === false) {
          this.updateHistory({
            historyId,
            step: 'after-process-false-result',
            finished: true
          });
          return;
        }
      } // if the result contained nothing or wasn't a successful statusCode


      if (!result || !this.successResults.includes(result.statusCode)) {
        if (error) {
          logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
          logger.outgoing.error(error);
        }

        if (result) {
          logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
          logger.outgoing.error(result);

          if (result.statusCode === 410) {
            this.updateHistory({
              historyId,
              step: 'after-process-http-status-410',
              error: true
            });
            logger.outgoing.error(`Disabling the Integration "${trigger.name}" because the status code was 401 (Gone).`);
            RocketChat.models.Integrations.update({
              _id: trigger._id
            }, {
              $set: {
                enabled: false
              }
            });
            return;
          }

          if (result.statusCode === 500) {
            this.updateHistory({
              historyId,
              step: 'after-process-http-status-500',
              error: true
            });
            logger.outgoing.error(`Error "500" for the Integration "${trigger.name}" to ${url}.`);
            logger.outgoing.error(result.content);
            return;
          }
        }

        if (trigger.retryFailedCalls) {
          if (tries < trigger.retryCount && trigger.retryDelay) {
            this.updateHistory({
              historyId,
              error: true,
              step: `going-to-retry-${tries + 1}`
            });
            let waitTime;

            switch (trigger.retryDelay) {
              case 'powers-of-ten':
                // Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s, 27h46m40s, etc
                waitTime = Math.pow(10, tries + 2);
                break;

              case 'powers-of-two':
                // 2 seconds, 4 seconds, 8 seconds
                waitTime = Math.pow(2, tries + 1) * 1000;
                break;

              case 'increments-of-two':
                // 2 second, 4 seconds, 6 seconds, etc
                waitTime = (tries + 1) * 2 * 1000;
                break;

              default:
                const er = new Error('The integration\'s retryDelay setting is invalid.');
                this.updateHistory({
                  historyId,
                  step: 'failed-and-retry-delay-is-invalid',
                  error: true,
                  errorStack: er.stack
                });
                return;
            }

            logger.outgoing.info(`Trying the Integration ${trigger.name} to ${url} again in ${waitTime} milliseconds.`);
            Meteor.setTimeout(() => {
              this.executeTriggerUrl(url, trigger, {
                event,
                message,
                room,
                owner,
                user
              }, historyId, tries + 1);
            }, waitTime);
          } else {
            this.updateHistory({
              historyId,
              step: 'too-many-retries',
              error: true
            });
          }
        } else {
          this.updateHistory({
            historyId,
            step: 'failed-and-not-configured-to-retry',
            error: true
          });
        }

        return;
      } //process outgoing webhook response as a new message


      if (result && this.successResults.includes(result.statusCode)) {
        if (result && result.data && (result.data.text || result.data.attachments)) {
          const resultMsg = this.sendMessage({
            trigger,
            room,
            message: result.data,
            data
          });
          this.updateHistory({
            historyId,
            step: 'url-response-sent-message',
            resultMessage: resultMsg,
            finished: true
          });
        }
      }
    });
  }

  replay(integration, history) {
    if (!integration || integration.type !== 'webhook-outgoing') {
      throw new Meteor.Error('integration-type-must-be-outgoing', 'The integration type to replay must be an outgoing webhook.');
    }

    if (!history || !history.data) {
      throw new Meteor.Error('history-data-must-be-defined', 'The history data must be defined to replay an integration.');
    }

    const event = history.event;
    const message = RocketChat.models.Messages.findOneById(history.data.message_id);
    const room = RocketChat.models.Rooms.findOneById(history.data.channel_id);
    const user = RocketChat.models.Users.findOneById(history.data.user_id);
    let owner;

    if (history.data.owner && history.data.owner._id) {
      owner = RocketChat.models.Users.findOneById(history.data.owner._id);
    }

    this.executeTriggerUrl(history.url, integration, {
      event,
      message,
      room,
      owner,
      user
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Integrations.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/models/Integrations.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Integrations = new class Integrations extends RocketChat.models._Base {
  constructor() {
    super('integrations');
  }

  findByType(type, options) {
    if (type !== 'webhook-incoming' && type !== 'webhook-outgoing') {
      throw new Meteor.Error('invalid-type-to-find');
    }

    return this.find({
      type
    }, options);
  }

  disableByUserId(userId) {
    return this.update({
      userId
    }, {
      $set: {
        enabled: false
      }
    }, {
      multi: true
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"IntegrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/models/IntegrationHistory.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.IntegrationHistory = new class IntegrationHistory extends RocketChat.models._Base {
  constructor() {
    super('integration_history');
  }

  findByType(type, options) {
    if (type !== 'outgoing-webhook' || type !== 'incoming-webhook') {
      throw new Meteor.Error('invalid-integration-type');
    }

    return this.find({
      type
    }, options);
  }

  findByIntegrationId(id, options) {
    return this.find({
      'integration._id': id
    }, options);
  }

  findByIntegrationIdAndCreatedBy(id, creatorId, options) {
    return this.find({
      'integration._id': id,
      'integration._createdBy._id': creatorId
    }, options);
  }

  findOneByIntegrationIdAndHistoryId(integrationId, historyId) {
    return this.findOne({
      'integration._id': integrationId,
      _id: historyId
    });
  }

  findByEventName(event, options) {
    return this.find({
      event
    }, options);
  }

  findFailed(options) {
    return this.find({
      error: true
    }, options);
  }

  removeByIntegrationId(integrationId) {
    return this.remove({
      'integration._id': integrationId
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"integrations.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/publications/integrations.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('integrations', function _integrationPublication() {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
    return RocketChat.models.Integrations.find();
  } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
    return RocketChat.models.Integrations.find({
      '_createdBy._id': this.userId
    });
  } else {
    throw new Meteor.Error('not-authorized');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/publications/integrationHistory.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
    return RocketChat.models.IntegrationHistory.findByIntegrationId(integrationId, {
      sort: {
        _updatedAt: -1
      },
      limit
    });
  } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
    return RocketChat.models.IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, {
      sort: {
        _updatedAt: -1
      },
      limit
    });
  } else {
    throw new Meteor.Error('not-authorized');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"incoming":{"addIncomingIntegration.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/addIncomingIntegration.js                                 //
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
const validChannelChars = ['@', '#'];
Meteor.methods({
  addIncomingIntegration(integration) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'addIncomingIntegration'
      });
    }

    if (!_.isString(integration.channel)) {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'addIncomingIntegration'
      });
    }

    if (integration.channel.trim() === '') {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'addIncomingIntegration'
      });
    }

    const channels = _.map(integration.channel.split(','), channel => s.trim(channel));

    for (const channel of channels) {
      if (!validChannelChars.includes(channel[0])) {
        throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    if (!_.isString(integration.username) || integration.username.trim() === '') {
      throw new Meteor.Error('error-invalid-username', 'Invalid username', {
        method: 'addIncomingIntegration'
      });
    }

    if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
      try {
        let babelOptions = Babel.getDefaultOptions({
          runtime: false
        });
        babelOptions = _.extend(babelOptions, {
          compact: true,
          minified: true,
          comments: false
        });
        integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
        integration.scriptError = undefined;
      } catch (e) {
        integration.scriptCompiled = undefined;
        integration.scriptError = _.pick(e, 'name', 'message', 'stack');
      }
    }

    for (let channel of channels) {
      let record;
      const channelType = channel[0];
      channel = channel.substr(1);

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'addIncomingIntegration'
        });
      }

      if (!RocketChat.authz.hasAllPermission(this.userId, 'manage-integrations', 'manage-own-integrations') && !RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(record._id, this.userId, {
        fields: {
          _id: 1
        }
      })) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          method: 'addIncomingIntegration'
        });
      }
    }

    const user = RocketChat.models.Users.findOne({
      username: integration.username
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addIncomingIntegration'
      });
    }

    const token = Random.id(48);
    integration.type = 'webhook-incoming';
    integration.token = token;
    integration.channel = channels;
    integration.userId = user._id;
    integration._createdAt = new Date();
    integration._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    RocketChat.models.Roles.addUserRoles(user._id, 'bot');
    integration._id = RocketChat.models.Integrations.insert(integration);
    return integration;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateIncomingIntegration.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/updateIncomingIntegration.js                              //
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
const validChannelChars = ['@', '#'];
Meteor.methods({
  updateIncomingIntegration(integrationId, integration) {
    if (!_.isString(integration.channel) || integration.channel.trim() === '') {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'updateIncomingIntegration'
      });
    }

    const channels = _.map(integration.channel.split(','), channel => s.trim(channel));

    for (const channel of channels) {
      if (!validChannelChars.includes(channel[0])) {
        throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    let currentIntegration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne({
        _id: integrationId,
        '_createdBy._id': this.userId
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'updateIncomingIntegration'
      });
    }

    if (!currentIntegration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'updateIncomingIntegration'
      });
    }

    if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
      try {
        let babelOptions = Babel.getDefaultOptions({
          runtime: false
        });
        babelOptions = _.extend(babelOptions, {
          compact: true,
          minified: true,
          comments: false
        });
        integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
        integration.scriptError = undefined;
      } catch (e) {
        integration.scriptCompiled = undefined;
        integration.scriptError = _.pick(e, 'name', 'message', 'stack');
      }
    }

    for (let channel of channels) {
      const channelType = channel[0];
      channel = channel.substr(1);
      let record;

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'updateIncomingIntegration'
        });
      }

      if (!RocketChat.authz.hasAllPermission(this.userId, 'manage-integrations', 'manage-own-integrations') && !RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(record._id, this.userId, {
        fields: {
          _id: 1
        }
      })) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    const user = RocketChat.models.Users.findOne({
      username: currentIntegration.username
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-post-as-user', 'Invalid Post As User', {
        method: 'updateIncomingIntegration'
      });
    }

    RocketChat.models.Roles.addUserRoles(user._id, 'bot');
    RocketChat.models.Integrations.update(integrationId, {
      $set: {
        enabled: integration.enabled,
        name: integration.name,
        avatar: integration.avatar,
        emoji: integration.emoji,
        alias: integration.alias,
        channel: channels,
        script: integration.script,
        scriptEnabled: integration.scriptEnabled,
        scriptCompiled: integration.scriptCompiled,
        scriptError: integration.scriptError,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.Integrations.findOne(integrationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteIncomingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/deleteIncomingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  deleteIncomingIntegration(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'deleteIncomingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'deleteIncomingIntegration'
      });
    }

    RocketChat.models.Integrations.remove({
      _id: integrationId
    });
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"outgoing":{"addOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/addOutgoingIntegration.js                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  addOutgoingIntegration(integration) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      throw new Meteor.Error('not_authorized');
    }

    integration = RocketChat.integrations.validateOutgoing(integration, this.userId);
    integration._createdAt = new Date();
    integration._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    integration._id = RocketChat.models.Integrations.insert(integration);
    return integration;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/updateOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  updateOutgoingIntegration(integrationId, integration) {
    integration = RocketChat.integrations.validateOutgoing(integration, this.userId);

    if (!integration.token || integration.token.trim() === '') {
      throw new Meteor.Error('error-invalid-token', 'Invalid token', {
        method: 'updateOutgoingIntegration'
      });
    }

    let currentIntegration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne({
        _id: integrationId,
        '_createdBy._id': this.userId
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'updateOutgoingIntegration'
      });
    }

    if (!currentIntegration) {
      throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
    }

    RocketChat.models.Integrations.update(integrationId, {
      $set: {
        event: integration.event,
        enabled: integration.enabled,
        name: integration.name,
        avatar: integration.avatar,
        emoji: integration.emoji,
        alias: integration.alias,
        channel: integration.channel,
        targetRoom: integration.targetRoom,
        impersonateUser: integration.impersonateUser,
        username: integration.username,
        userId: integration.userId,
        urls: integration.urls,
        token: integration.token,
        script: integration.script,
        scriptEnabled: integration.scriptEnabled,
        scriptCompiled: integration.scriptCompiled,
        scriptError: integration.scriptError,
        triggerWords: integration.triggerWords,
        retryFailedCalls: integration.retryFailedCalls,
        retryCount: integration.retryCount,
        retryDelay: integration.retryDelay,
        triggerWordAnywhere: integration.triggerWordAnywhere,
        runOnEdits: integration.runOnEdits,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.Integrations.findOne(integrationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"replayOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/replayOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  replayOutgoingIntegration({
    integrationId,
    historyId
  }) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'replayOutgoingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'replayOutgoingIntegration'
      });
    }

    const history = RocketChat.models.IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

    if (!history) {
      throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', {
        method: 'replayOutgoingIntegration'
      });
    }

    RocketChat.integrations.triggerHandler.replay(integration, history);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/deleteOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  deleteOutgoingIntegration(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'deleteOutgoingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'deleteOutgoingIntegration'
      });
    }

    RocketChat.models.Integrations.remove({
      _id: integrationId
    });
    RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"clearIntegrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/clearIntegrationHistory.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  clearIntegrationHistory(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'clearIntegrationHistory'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'clearIntegrationHistory'
      });
    }

    RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api":{"api.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/api/api.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Fiber;
module.watch(require("fibers"), {
  default(v) {
    Fiber = v;
  }

}, 0);
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 1);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);
let vm;
module.watch(require("vm"), {
  default(v) {
    vm = v;
  }

}, 4);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 5);
const Api = new Restivus({
  enableCors: true,
  apiPath: 'hooks/',
  auth: {
    user() {
      const payloadKeys = Object.keys(this.bodyParams);
      const payloadIsWrapped = this.bodyParams && this.bodyParams.payload && payloadKeys.length === 1;

      if (payloadIsWrapped && this.request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        try {
          this.bodyParams = JSON.parse(this.bodyParams.payload);
        } catch ({
          message
        }) {
          return {
            error: {
              statusCode: 400,
              body: {
                success: false,
                error: message
              }
            }
          };
        }
      }

      this.integration = RocketChat.models.Integrations.findOne({
        _id: this.request.params.integrationId,
        token: decodeURIComponent(this.request.params.token)
      });

      if (!this.integration) {
        logger.incoming.info('Invalid integration id', this.request.params.integrationId, 'or token', this.request.params.token);
        return {
          error: {
            statusCode: 404,
            body: {
              success: false,
              error: 'Invalid integration id or token provided.'
            }
          }
        };
      }

      const user = RocketChat.models.Users.findOne({
        _id: this.integration.userId
      });
      return {
        user
      };
    }

  }
});
const compiledScripts = {};

function buildSandbox(store = {}) {
  const sandbox = {
    scriptTimeout(reject) {
      return setTimeout(() => reject('timed out'), 3000);
    },

    _,
    s,
    console,
    moment,
    Fiber,
    Promise,
    Livechat: RocketChat.Livechat,
    Store: {
      set(key, val) {
        return store[key] = val;
      },

      get(key) {
        return store[key];
      }

    },

    HTTP(method, url, options) {
      try {
        return {
          result: HTTP.call(method, url, options)
        };
      } catch (error) {
        return {
          error
        };
      }
    }

  };
  Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => sandbox[k] = RocketChat.models[k]);
  return {
    store,
    sandbox
  };
}

function getIntegrationScript(integration) {
  const compiledScript = compiledScripts[integration._id];

  if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
    return compiledScript.script;
  }

  const script = integration.scriptCompiled;
  const {
    sandbox,
    store
  } = buildSandbox();

  try {
    logger.incoming.info('Will evaluate script of Trigger', integration.name);
    logger.incoming.debug(script);
    const vmScript = vm.createScript(script, 'script.js');
    vmScript.runInNewContext(sandbox);

    if (sandbox.Script) {
      compiledScripts[integration._id] = {
        script: new sandbox.Script(),
        store,
        _updatedAt: integration._updatedAt
      };
      return compiledScripts[integration._id].script;
    }
  } catch ({
    stack
  }) {
    logger.incoming.error('[Error evaluating Script in Trigger', integration.name, ':]');
    logger.incoming.error(script.replace(/^/gm, '  '));
    logger.incoming.error('[Stack:]');
    logger.incoming.error(stack.replace(/^/gm, '  '));
    throw RocketChat.API.v1.failure('error-evaluating-script');
  }

  if (!sandbox.Script) {
    logger.incoming.error('[Class "Script" not in Trigger', integration.name, ']');
    throw RocketChat.API.v1.failure('class-script-not-found');
  }
}

function createIntegration(options, user) {
  logger.incoming.info('Add integration', options.name);
  logger.incoming.debug(options);
  Meteor.runAsUser(user._id, function () {
    switch (options['event']) {
      case 'newMessageOnChannel':
        if (options.data == null) {
          options.data = {};
        }

        if (options.data.channel_name != null && options.data.channel_name.indexOf('#') === -1) {
          options.data.channel_name = `#${options.data.channel_name}`;
        }

        return Meteor.call('addOutgoingIntegration', {
          username: 'rocket.cat',
          urls: [options.target_url],
          name: options.name,
          channel: options.data.channel_name,
          triggerWords: options.data.trigger_words
        });

      case 'newMessageToUser':
        if (options.data.username.indexOf('@') === -1) {
          options.data.username = `@${options.data.username}`;
        }

        return Meteor.call('addOutgoingIntegration', {
          username: 'rocket.cat',
          urls: [options.target_url],
          name: options.name,
          channel: options.data.username,
          triggerWords: options.data.trigger_words
        });
    }
  });
  return RocketChat.API.v1.success();
}

function removeIntegration(options, user) {
  logger.incoming.info('Remove integration');
  logger.incoming.debug(options);
  const integrationToRemove = RocketChat.models.Integrations.findOne({
    urls: options.target_url
  });
  Meteor.runAsUser(user._id, () => {
    return Meteor.call('deleteOutgoingIntegration', integrationToRemove._id);
  });
  return RocketChat.API.v1.success();
}

function executeIntegrationRest() {
  logger.incoming.info('Post integration:', this.integration.name);
  logger.incoming.debug('@urlParams:', this.urlParams);
  logger.incoming.debug('@bodyParams:', this.bodyParams);

  if (this.integration.enabled !== true) {
    return {
      statusCode: 503,
      body: 'Service Unavailable'
    };
  }

  const defaultValues = {
    channel: this.integration.channel,
    alias: this.integration.alias,
    avatar: this.integration.avatar,
    emoji: this.integration.emoji
  };

  if (this.integration.scriptEnabled && this.integration.scriptCompiled && this.integration.scriptCompiled.trim() !== '') {
    let script;

    try {
      script = getIntegrationScript(this.integration);
    } catch (e) {
      logger.incoming.warn(e);
      return RocketChat.API.v1.failure(e.message);
    }

    this.request.setEncoding('utf8');
    const content_raw = this.request.read();
    const request = {
      url: {
        hash: this.request._parsedUrl.hash,
        search: this.request._parsedUrl.search,
        query: this.queryParams,
        pathname: this.request._parsedUrl.pathname,
        path: this.request._parsedUrl.path
      },
      url_raw: this.request.url,
      url_params: this.urlParams,
      content: this.bodyParams,
      content_raw,
      headers: this.request.headers,
      body: this.request.body,
      user: {
        _id: this.user._id,
        name: this.user.name,
        username: this.user.username
      }
    };

    try {
      const {
        sandbox
      } = buildSandbox(compiledScripts[this.integration._id].store);
      sandbox.script = script;
      sandbox.request = request;
      const result = Future.fromPromise(vm.runInNewContext(`
				new Promise((resolve, reject) => {
					Fiber(() => {
						scriptTimeout(reject);
						try {
							resolve(script.process_incoming_request({ request: request }));
						} catch(e) {
							reject(e);
						}
					}).run();
				}).catch((error) => { throw new Error(error); });
			`, sandbox, {
        timeout: 3000
      })).wait();

      if (!result) {
        logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':] No data');
        return RocketChat.API.v1.success();
      } else if (result && result.error) {
        return RocketChat.API.v1.failure(result.error);
      }

      this.bodyParams = result && result.content;
      this.scriptResponse = result.response;

      if (result.user) {
        this.user = result.user;
      }

      logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':]');
      logger.incoming.debug('result', this.bodyParams);
    } catch ({
      stack
    }) {
      logger.incoming.error('[Error running Script in Trigger', this.integration.name, ':]');
      logger.incoming.error(this.integration.scriptCompiled.replace(/^/gm, '  '));
      logger.incoming.error('[Stack:]');
      logger.incoming.error(stack.replace(/^/gm, '  '));
      return RocketChat.API.v1.failure('error-running-script');
    }
  } // TODO: Turn this into an option on the integrations - no body means a success
  // TODO: Temporary fix for https://github.com/RocketChat/Rocket.Chat/issues/7770 until the above is implemented


  if (!this.bodyParams || _.isEmpty(this.bodyParams) && !this.integration.scriptEnabled) {
    // return RocketChat.API.v1.failure('body-empty');
    return RocketChat.API.v1.success();
  }

  this.bodyParams.bot = {
    i: this.integration._id
  };

  try {
    const message = processWebhookMessage(this.bodyParams, this.user, defaultValues);

    if (_.isEmpty(message)) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    if (this.scriptResponse) {
      logger.incoming.debug('response', this.scriptResponse);
    }

    return RocketChat.API.v1.success(this.scriptResponse);
  } catch ({
    error,
    message
  }) {
    return RocketChat.API.v1.failure(error || message);
  }
}

function addIntegrationRest() {
  return createIntegration(this.bodyParams, this.user);
}

function removeIntegrationRest() {
  return removeIntegration(this.bodyParams, this.user);
}

function integrationSampleRest() {
  logger.incoming.info('Sample Integration');
  return {
    statusCode: 200,
    body: [{
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 1',
      trigger_word: 'Sample'
    }, {
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 2',
      trigger_word: 'Sample'
    }, {
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 3',
      trigger_word: 'Sample'
    }]
  };
}

function integrationInfoRest() {
  logger.incoming.info('Info integration');
  return {
    statusCode: 200,
    body: {
      success: true
    }
  };
}

Api.addRoute(':integrationId/:userId/:token', {
  authRequired: true
}, {
  post: executeIntegrationRest,
  get: executeIntegrationRest
});
Api.addRoute(':integrationId/:token', {
  authRequired: true
}, {
  post: executeIntegrationRest,
  get: executeIntegrationRest
});
Api.addRoute('sample/:integrationId/:userId/:token', {
  authRequired: true
}, {
  get: integrationSampleRest
});
Api.addRoute('sample/:integrationId/:token', {
  authRequired: true
}, {
  get: integrationSampleRest
});
Api.addRoute('info/:integrationId/:userId/:token', {
  authRequired: true
}, {
  get: integrationInfoRest
});
Api.addRoute('info/:integrationId/:token', {
  authRequired: true
}, {
  get: integrationInfoRest
});
Api.addRoute('add/:integrationId/:userId/:token', {
  authRequired: true
}, {
  post: addIntegrationRest
});
Api.addRoute('add/:integrationId/:token', {
  authRequired: true
}, {
  post: addIntegrationRest
});
Api.addRoute('remove/:integrationId/:userId/:token', {
  authRequired: true
}, {
  post: removeIntegrationRest
});
Api.addRoute('remove/:integrationId/:token', {
  authRequired: true
}, {
  post: removeIntegrationRest
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"triggers.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/triggers.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const callbackHandler = function _callbackHandler(eventType) {
  return function _wrapperFunction() {
    return RocketChat.integrations.triggerHandler.executeTriggers(eventType, ...arguments);
  };
};

RocketChat.callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateUser', callbackHandler('userCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterLeaveRoom', callbackHandler('roomLeft'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), RocketChat.callbacks.priority.LOW);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"processWebhookMessage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/processWebhookMessage.js                                                   //
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

this.processWebhookMessage = function (messageObj, user, defaultValues = {
  channel: '',
  alias: '',
  avatar: '',
  emoji: ''
}, mustBeJoined = false) {
  const sentData = [];
  const channels = [].concat(messageObj.channel || messageObj.roomId || defaultValues.channel);

  for (const channel of channels) {
    const channelType = channel[0];
    let channelValue = channel.substr(1);
    let room;

    switch (channelType) {
      case '#':
        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          joinChannel: true
        });
        break;

      case '@':
        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          type: 'd'
        });
        break;

      default:
        channelValue = channelType + channelValue; //Try to find the room by id or name if they didn't include the prefix.

        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          joinChannel: true,
          errorOnEmpty: false
        });

        if (room) {
          break;
        } //We didn't get a room, let's try finding direct messages


        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          type: 'd',
          tryDirectByUserIdOnly: true
        });

        if (room) {
          break;
        } //No room, so throw an error


        throw new Meteor.Error('invalid-channel');
    }

    if (mustBeJoined && !RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, {
      fields: {
        _id: 1
      }
    })) {
      // throw new Meteor.Error('invalid-room', 'Invalid room provided to send a message to, must be joined.');
      throw new Meteor.Error('invalid-channel'); // Throwing the generic one so people can't "brute force" find rooms
    }

    if (messageObj.attachments && !_.isArray(messageObj.attachments)) {
      console.log('Attachments should be Array, ignoring value'.red, messageObj.attachments);
      messageObj.attachments = undefined;
    }

    const message = {
      alias: messageObj.username || messageObj.alias || defaultValues.alias,
      msg: s.trim(messageObj.text || messageObj.msg || ''),
      attachments: messageObj.attachments || [],
      parseUrls: messageObj.parseUrls !== undefined ? messageObj.parseUrls : !messageObj.attachments,
      bot: messageObj.bot,
      groupable: messageObj.groupable !== undefined ? messageObj.groupable : false
    };

    if (!_.isEmpty(messageObj.icon_url) || !_.isEmpty(messageObj.avatar)) {
      message.avatar = messageObj.icon_url || messageObj.avatar;
    } else if (!_.isEmpty(messageObj.icon_emoji) || !_.isEmpty(messageObj.emoji)) {
      message.emoji = messageObj.icon_emoji || messageObj.emoji;
    } else if (!_.isEmpty(defaultValues.avatar)) {
      message.avatar = defaultValues.avatar;
    } else if (!_.isEmpty(defaultValues.emoji)) {
      message.emoji = defaultValues.emoji;
    }

    if (_.isArray(message.attachments)) {
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];

        if (attachment.msg) {
          attachment.text = s.trim(attachment.msg);
          delete attachment.msg;
        }
      }
    }

    const messageReturn = RocketChat.sendMessage(user, message, room);
    sentData.push({
      channel,
      message: messageReturn
    });
  }

  return sentData;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:integrations/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:integrations/server/logger.js");
require("/node_modules/meteor/rocketchat:integrations/server/lib/validation.js");
require("/node_modules/meteor/rocketchat:integrations/server/models/Integrations.js");
require("/node_modules/meteor/rocketchat:integrations/server/models/IntegrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/publications/integrations.js");
require("/node_modules/meteor/rocketchat:integrations/server/publications/integrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/addIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/updateIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/deleteIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/addOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/updateOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/replayOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/deleteOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/clearIntegrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/api/api.js");
require("/node_modules/meteor/rocketchat:integrations/server/lib/triggerHandler.js");
require("/node_modules/meteor/rocketchat:integrations/server/triggers.js");
require("/node_modules/meteor/rocketchat:integrations/server/processWebhookMessage.js");

/* Exports */
Package._define("rocketchat:integrations");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_integrations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvbGliL3JvY2tldGNoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9saWIvdmFsaWRhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL2xpYi90cmlnZ2VySGFuZGxlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL21vZGVscy9JbnRlZ3JhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tb2RlbHMvSW50ZWdyYXRpb25IaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvcHVibGljYXRpb25zL2ludGVncmF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL3B1YmxpY2F0aW9ucy9pbnRlZ3JhdGlvbkhpc3RvcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL2FkZEluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL2FkZE91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL3VwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL2RlbGV0ZU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2NsZWFySW50ZWdyYXRpb25IaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvYXBpL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL3RyaWdnZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvcHJvY2Vzc1dlYmhvb2tNZXNzYWdlLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJpbnRlZ3JhdGlvbnMiLCJvdXRnb2luZ0V2ZW50cyIsInNlbmRNZXNzYWdlIiwibGFiZWwiLCJ2YWx1ZSIsInVzZSIsImNoYW5uZWwiLCJ0cmlnZ2VyV29yZHMiLCJ0YXJnZXRSb29tIiwiZmlsZVVwbG9hZGVkIiwicm9vbUFyY2hpdmVkIiwicm9vbUNyZWF0ZWQiLCJyb29tSm9pbmVkIiwicm9vbUxlZnQiLCJ1c2VyQ3JlYXRlZCIsImxvZ2dlciIsIkxvZ2dlciIsInNlY3Rpb25zIiwiaW5jb21pbmciLCJvdXRnb2luZyIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInMiLCJzY29wZWRDaGFubmVscyIsInZhbGlkQ2hhbm5lbENoYXJzIiwiX3ZlcmlmeVJlcXVpcmVkRmllbGRzIiwiaW50ZWdyYXRpb24iLCJldmVudCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsInRyaW0iLCJNZXRlb3IiLCJFcnJvciIsImZ1bmN0aW9uIiwidXNlcm5hbWUiLCJ1cmxzIiwiaW5kZXgiLCJ1cmwiLCJlbnRyaWVzIiwid2l0aG91dCIsInVuZGVmaW5lZCIsImxlbmd0aCIsIl92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzIiwidXNlcklkIiwiY2hhbm5lbHMiLCJpbmNsdWRlcyIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsInJlY29yZCIsImNoYW5uZWxUeXBlIiwic3Vic3RyIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lIiwiJG9yIiwiX2lkIiwibmFtZSIsIlVzZXJzIiwiaGFzQWxsUGVybWlzc2lvbiIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJmaWVsZHMiLCJfdmVyaWZ5UmV0cnlJbmZvcm1hdGlvbiIsInJldHJ5RmFpbGVkQ2FsbHMiLCJyZXRyeUNvdW50IiwicGFyc2VJbnQiLCJyZXRyeURlbGF5IiwidG9Mb3dlckNhc2UiLCJ2YWxpZGF0ZU91dGdvaW5nIiwiX3ZhbGlkYXRlT3V0Z29pbmciLCJtYXAiLCJzcGxpdCIsImZvckVhY2giLCJ3b3JkIiwic2NyaXB0RW5hYmxlZCIsInNjcmlwdCIsImJhYmVsT3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsIkJhYmVsIiwiZ2V0RGVmYXVsdE9wdGlvbnMiLCJydW50aW1lIiwiY29tcGFjdCIsIm1pbmlmaWVkIiwiY29tbWVudHMiLCJzY3JpcHRDb21waWxlZCIsImNvbXBpbGUiLCJjb2RlIiwic2NyaXB0RXJyb3IiLCJlIiwicGljayIsInJ1bk9uRWRpdHMiLCJ1c2VyIiwidHlwZSIsIm1vbWVudCIsInZtIiwiRmliZXIiLCJGdXR1cmUiLCJ0cmlnZ2VySGFuZGxlciIsIlJvY2tldENoYXRJbnRlZ3JhdGlvbkhhbmRsZXIiLCJjb25zdHJ1Y3RvciIsInN1Y2Nlc3NSZXN1bHRzIiwiY29tcGlsZWRTY3JpcHRzIiwidHJpZ2dlcnMiLCJJbnRlZ3JhdGlvbnMiLCJmaW5kIiwib2JzZXJ2ZSIsImFkZGVkIiwiYWRkSW50ZWdyYXRpb24iLCJjaGFuZ2VkIiwicmVtb3ZlSW50ZWdyYXRpb24iLCJyZW1vdmVkIiwiZGVidWciLCJpc0VtcHR5IiwiY29uY2F0IiwidHJpZ2dlciIsInZhbHVlcyIsImlzVHJpZ2dlckVuYWJsZWQiLCJ0cmlnIiwiZW5hYmxlZCIsInVwZGF0ZUhpc3RvcnkiLCJoaXN0b3J5SWQiLCJzdGVwIiwiZGF0YSIsInRyaWdnZXJXb3JkIiwicmFuUHJlcGFyZVNjcmlwdCIsInByZXBhcmVTZW50TWVzc2FnZSIsInByb2Nlc3NTZW50TWVzc2FnZSIsInJlc3VsdE1lc3NhZ2UiLCJmaW5pc2hlZCIsImh0dHBDYWxsRGF0YSIsImh0dHBFcnJvciIsImh0dHBSZXN1bHQiLCJlcnJvciIsImVycm9yU3RhY2siLCJoaXN0b3J5Iiwib21pdCIsInJvb20iLCJKU09OIiwic3RyaW5naWZ5IiwiSW50ZWdyYXRpb25IaXN0b3J5IiwidXBkYXRlIiwiJHNldCIsIl9jcmVhdGVkQXQiLCJEYXRlIiwiaW5zZXJ0IiwiUmFuZG9tIiwiaWQiLCJuYW1lT3JJZCIsIm1lc3NhZ2UiLCJpbXBlcnNvbmF0ZVVzZXIiLCJmaW5kT25lQnlVc2VybmFtZSIsInVzZXJfbmFtZSIsInRtcFJvb20iLCJnZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4iLCJjdXJyZW50VXNlcklkIiwiZXJyb3JPbkVtcHR5Iiwid2FybiIsInQiLCJib3QiLCJpIiwiZGVmYXVsdFZhbHVlcyIsImFsaWFzIiwiYXZhdGFyIiwiZW1vamkiLCJwcm9jZXNzV2ViaG9va01lc3NhZ2UiLCJidWlsZFNhbmRib3giLCJzdG9yZSIsInNhbmRib3giLCJzY3JpcHRUaW1lb3V0IiwicmVqZWN0Iiwic2V0VGltZW91dCIsImNvbnNvbGUiLCJQcm9taXNlIiwiU3RvcmUiLCJzZXQiLCJrZXkiLCJ2YWwiLCJnZXQiLCJIVFRQIiwibWV0aG9kIiwib3B0aW9ucyIsInJlc3VsdCIsImNhbGwiLCJrZXlzIiwiZmlsdGVyIiwiayIsInN0YXJ0c1dpdGgiLCJnZXRJbnRlZ3JhdGlvblNjcmlwdCIsImNvbXBpbGVkU2NyaXB0IiwiX3VwZGF0ZWRBdCIsInZtU2NyaXB0IiwiaW5mbyIsImNyZWF0ZVNjcmlwdCIsInJ1bkluTmV3Q29udGV4dCIsIlNjcmlwdCIsInJlcGxhY2UiLCJzdGFjayIsImhhc1NjcmlwdEFuZE1ldGhvZCIsImV4ZWN1dGVTY3JpcHQiLCJwYXJhbXMiLCJmcm9tUHJvbWlzZSIsInRpbWVvdXQiLCJ3YWl0IiwiZXZlbnROYW1lQXJndW1lbnRzVG9PYmplY3QiLCJhcmdPYmplY3QiLCJhcmd1bWVudHMiLCJhcmdoaGgiLCJvd25lciIsIm1hcEV2ZW50QXJnc1RvRGF0YSIsImNoYW5uZWxfaWQiLCJjaGFubmVsX25hbWUiLCJtZXNzYWdlX2lkIiwidGltZXN0YW1wIiwidHMiLCJ1c2VyX2lkIiwidSIsInRleHQiLCJtc2ciLCJlZGl0ZWRBdCIsImlzRWRpdGVkIiwiY3JlYXRlZEF0IiwiZXhlY3V0ZVRyaWdnZXJzIiwidHJpZ2dlcnNUb0V4ZWN1dGUiLCJ1c2VybmFtZXMiLCJwdXNoIiwiYWxsX2RpcmVjdF9tZXNzYWdlcyIsImFsbF9wdWJsaWNfY2hhbm5lbHMiLCJhbGxfcHJpdmF0ZV9ncm91cHMiLCJfX2FueSIsInRyaWdnZXJUb0V4ZWN1dGUiLCJleGVjdXRlVHJpZ2dlciIsImV4ZWN1dGVUcmlnZ2VyVXJsIiwidGhlSGlzdG9yeUlkIiwidHJpZXMiLCJ0cmlnZ2VyV29yZEFueXdoZXJlIiwiaW5kZXhPZiIsInRva2VuIiwidHJpZ2dlcl93b3JkIiwib3B0cyIsImF1dGgiLCJucG1SZXF1ZXN0T3B0aW9ucyIsInJlamVjdFVuYXV0aG9yaXplZCIsInNldHRpbmdzIiwic3RyaWN0U1NMIiwiaGVhZGVycyIsInJlcXVlc3QiLCJwcmVwYXJlTWVzc2FnZSIsInN0YXR1c0NvZGUiLCJyZXNwb25zZSIsInN0YXR1c19jb2RlIiwiY29udGVudCIsImNvbnRlbnRfcmF3Iiwic2NyaXB0UmVzdWx0Iiwid2FpdFRpbWUiLCJNYXRoIiwicG93IiwiZXIiLCJhdHRhY2htZW50cyIsInJlc3VsdE1zZyIsInJlcGxheSIsIk1lc3NhZ2VzIiwiZmluZE9uZUJ5SWQiLCJfQmFzZSIsImZpbmRCeVR5cGUiLCJkaXNhYmxlQnlVc2VySWQiLCJtdWx0aSIsImZpbmRCeUludGVncmF0aW9uSWQiLCJmaW5kQnlJbnRlZ3JhdGlvbklkQW5kQ3JlYXRlZEJ5IiwiY3JlYXRvcklkIiwiZmluZE9uZUJ5SW50ZWdyYXRpb25JZEFuZEhpc3RvcnlJZCIsImludGVncmF0aW9uSWQiLCJmaW5kQnlFdmVudE5hbWUiLCJmaW5kRmFpbGVkIiwicmVtb3ZlQnlJbnRlZ3JhdGlvbklkIiwicmVtb3ZlIiwicHVibGlzaCIsIl9pbnRlZ3JhdGlvblB1YmxpY2F0aW9uIiwicmVhZHkiLCJfaW50ZWdyYXRpb25IaXN0b3J5UHVibGljYXRpb24iLCJsaW1pdCIsInNvcnQiLCJtZXRob2RzIiwiYWRkSW5jb21pbmdJbnRlZ3JhdGlvbiIsImlzU3RyaW5nIiwiZXh0ZW5kIiwiX2NyZWF0ZWRCeSIsIlJvbGVzIiwiYWRkVXNlclJvbGVzIiwidXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbiIsImN1cnJlbnRJbnRlZ3JhdGlvbiIsIl91cGRhdGVkQnkiLCJkZWxldGVJbmNvbWluZ0ludGVncmF0aW9uIiwiYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbiIsInVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24iLCJyZXBsYXlPdXRnb2luZ0ludGVncmF0aW9uIiwiZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbiIsImNsZWFySW50ZWdyYXRpb25IaXN0b3J5IiwiQXBpIiwiUmVzdGl2dXMiLCJlbmFibGVDb3JzIiwiYXBpUGF0aCIsInBheWxvYWRLZXlzIiwiYm9keVBhcmFtcyIsInBheWxvYWRJc1dyYXBwZWQiLCJwYXlsb2FkIiwicGFyc2UiLCJib2R5Iiwic3VjY2VzcyIsImRlY29kZVVSSUNvbXBvbmVudCIsIkxpdmVjaGF0IiwiQVBJIiwidjEiLCJmYWlsdXJlIiwiY3JlYXRlSW50ZWdyYXRpb24iLCJydW5Bc1VzZXIiLCJ0YXJnZXRfdXJsIiwidHJpZ2dlcl93b3JkcyIsImludGVncmF0aW9uVG9SZW1vdmUiLCJleGVjdXRlSW50ZWdyYXRpb25SZXN0IiwidXJsUGFyYW1zIiwic2V0RW5jb2RpbmciLCJyZWFkIiwiaGFzaCIsIl9wYXJzZWRVcmwiLCJzZWFyY2giLCJxdWVyeSIsInF1ZXJ5UGFyYW1zIiwicGF0aG5hbWUiLCJwYXRoIiwidXJsX3JhdyIsInVybF9wYXJhbXMiLCJzY3JpcHRSZXNwb25zZSIsImFkZEludGVncmF0aW9uUmVzdCIsInJlbW92ZUludGVncmF0aW9uUmVzdCIsImludGVncmF0aW9uU2FtcGxlUmVzdCIsImludGVncmF0aW9uSW5mb1Jlc3QiLCJhZGRSb3V0ZSIsImF1dGhSZXF1aXJlZCIsInBvc3QiLCJjYWxsYmFja0hhbmRsZXIiLCJfY2FsbGJhY2tIYW5kbGVyIiwiZXZlbnRUeXBlIiwiX3dyYXBwZXJGdW5jdGlvbiIsImNhbGxiYWNrcyIsImFkZCIsInByaW9yaXR5IiwiTE9XIiwibWVzc2FnZU9iaiIsIm11c3RCZUpvaW5lZCIsInNlbnREYXRhIiwicm9vbUlkIiwiY2hhbm5lbFZhbHVlIiwiam9pbkNoYW5uZWwiLCJ0cnlEaXJlY3RCeVVzZXJJZE9ubHkiLCJpc0FycmF5IiwibG9nIiwicmVkIiwicGFyc2VVcmxzIiwiZ3JvdXBhYmxlIiwiaWNvbl91cmwiLCJpY29uX2Vtb2ppIiwiYXR0YWNobWVudCIsIm1lc3NhZ2VSZXR1cm4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLFlBQVgsR0FBMEI7QUFDekJDLGtCQUFnQjtBQUNmQyxpQkFBYTtBQUNaQyxhQUFPLHdDQURLO0FBRVpDLGFBQU8sYUFGSztBQUdaQyxXQUFLO0FBQ0pDLGlCQUFTLElBREw7QUFFSkMsc0JBQWMsSUFGVjtBQUdKQyxvQkFBWTtBQUhSO0FBSE8sS0FERTtBQVVmQyxrQkFBYztBQUNiTixhQUFPLHlDQURNO0FBRWJDLGFBQU8sY0FGTTtBQUdiQyxXQUFLO0FBQ0pDLGlCQUFTLElBREw7QUFFSkMsc0JBQWMsS0FGVjtBQUdKQyxvQkFBWTtBQUhSO0FBSFEsS0FWQztBQW1CZkUsa0JBQWM7QUFDYlAsYUFBTyx5Q0FETTtBQUViQyxhQUFPLGNBRk07QUFHYkMsV0FBSztBQUNKQyxpQkFBUyxLQURMO0FBRUpDLHNCQUFjLEtBRlY7QUFHSkMsb0JBQVk7QUFIUjtBQUhRLEtBbkJDO0FBNEJmRyxpQkFBYTtBQUNaUixhQUFPLHdDQURLO0FBRVpDLGFBQU8sYUFGSztBQUdaQyxXQUFLO0FBQ0pDLGlCQUFTLEtBREw7QUFFSkMsc0JBQWMsS0FGVjtBQUdKQyxvQkFBWTtBQUhSO0FBSE8sS0E1QkU7QUFxQ2ZJLGdCQUFZO0FBQ1hULGFBQU8sdUNBREk7QUFFWEMsYUFBTyxZQUZJO0FBR1hDLFdBQUs7QUFDSkMsaUJBQVMsSUFETDtBQUVKQyxzQkFBYyxLQUZWO0FBR0pDLG9CQUFZO0FBSFI7QUFITSxLQXJDRztBQThDZkssY0FBVTtBQUNUVixhQUFPLHFDQURFO0FBRVRDLGFBQU8sVUFGRTtBQUdUQyxXQUFLO0FBQ0pDLGlCQUFTLElBREw7QUFFSkMsc0JBQWMsS0FGVjtBQUdKQyxvQkFBWTtBQUhSO0FBSEksS0E5Q0s7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QUFkO0FBQ0E7O0FBRUQsU0FBT2IsUUFBUDtBQUNBLENBaEZELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfaW50ZWdyYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMgPSB7XG5cdG91dGdvaW5nRXZlbnRzOiB7XG5cdFx0c2VuZE1lc3NhZ2U6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfU2VuZE1lc3NhZ2UnLFxuXHRcdFx0dmFsdWU6ICdzZW5kTWVzc2FnZScsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogdHJ1ZSxcblx0XHRcdFx0dHJpZ2dlcldvcmRzOiB0cnVlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0ZmlsZVVwbG9hZGVkOiB7XG5cdFx0XHRsYWJlbDogJ0ludGVncmF0aW9uc19PdXRnb2luZ19UeXBlX0ZpbGVVcGxvYWRlZCcsXG5cdFx0XHR2YWx1ZTogJ2ZpbGVVcGxvYWRlZCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogdHJ1ZSxcblx0XHRcdFx0dHJpZ2dlcldvcmRzOiBmYWxzZSxcblx0XHRcdFx0dGFyZ2V0Um9vbTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJvb21BcmNoaXZlZDoge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9Sb29tQXJjaGl2ZWQnLFxuXHRcdFx0dmFsdWU6ICdyb29tQXJjaGl2ZWQnLFxuXHRcdFx0dXNlOiB7XG5cdFx0XHRcdGNoYW5uZWw6IGZhbHNlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cm9vbUNyZWF0ZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfUm9vbUNyZWF0ZWQnLFxuXHRcdFx0dmFsdWU6ICdyb29tQ3JlYXRlZCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogZmFsc2UsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyb29tSm9pbmVkOiB7XG5cdFx0XHRsYWJlbDogJ0ludGVncmF0aW9uc19PdXRnb2luZ19UeXBlX1Jvb21Kb2luZWQnLFxuXHRcdFx0dmFsdWU6ICdyb29tSm9pbmVkJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cm9vbUxlZnQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfUm9vbUxlZnQnLFxuXHRcdFx0dmFsdWU6ICdyb29tTGVmdCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogdHJ1ZSxcblx0XHRcdFx0dHJpZ2dlcldvcmRzOiBmYWxzZSxcblx0XHRcdFx0dGFyZ2V0Um9vbTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHVzZXJDcmVhdGVkOiB7XG5cdFx0XHRsYWJlbDogJ0ludGVncmF0aW9uc19PdXRnb2luZ19UeXBlX1VzZXJDcmVhdGVkJyxcblx0XHRcdHZhbHVlOiAndXNlckNyZWF0ZWQnLFxuXHRcdFx0dXNlOiB7XG5cdFx0XHRcdGNoYW5uZWw6IGZhbHNlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiB0cnVlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuIiwiLyogZ2xvYmFscyBsb2dnZXI6dHJ1ZSAqL1xuLyogZXhwb3J0ZWQgbG9nZ2VyICovXG5cbmxvZ2dlciA9IG5ldyBMb2dnZXIoJ0ludGVncmF0aW9ucycsIHtcblx0c2VjdGlvbnM6IHtcblx0XHRpbmNvbWluZzogJ0luY29taW5nIFdlYkhvb2snLFxuXHRcdG91dGdvaW5nOiAnT3V0Z29pbmcgV2ViSG9vaydcblx0fVxufSk7XG4iLCIvKiBnbG9iYWwgQmFiZWwgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuY29uc3Qgc2NvcGVkQ2hhbm5lbHMgPSBbJ2FsbF9wdWJsaWNfY2hhbm5lbHMnLCAnYWxsX3ByaXZhdGVfZ3JvdXBzJywgJ2FsbF9kaXJlY3RfbWVzc2FnZXMnXTtcbmNvbnN0IHZhbGlkQ2hhbm5lbENoYXJzID0gWydAJywgJyMnXTtcblxuZnVuY3Rpb24gX3ZlcmlmeVJlcXVpcmVkRmllbGRzKGludGVncmF0aW9uKSB7XG5cdGlmICghaW50ZWdyYXRpb24uZXZlbnQgfHwgIU1hdGNoLnRlc3QoaW50ZWdyYXRpb24uZXZlbnQsIFN0cmluZykgfHwgaW50ZWdyYXRpb24uZXZlbnQudHJpbSgpID09PSAnJyB8fCAhUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMub3V0Z29pbmdFdmVudHNbaW50ZWdyYXRpb24uZXZlbnRdKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1ldmVudC10eXBlJywgJ0ludmFsaWQgZXZlbnQgdHlwZScsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlSZXF1aXJlZEZpZWxkcycgfSk7XG5cdH1cblxuXHRpZiAoIWludGVncmF0aW9uLnVzZXJuYW1lIHx8ICFNYXRjaC50ZXN0KGludGVncmF0aW9uLnVzZXJuYW1lLCBTdHJpbmcpIHx8IGludGVncmF0aW9uLnVzZXJuYW1lLnRyaW0oKSA9PT0gJycpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXJuYW1lJywgJ0ludmFsaWQgdXNlcm5hbWUnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5UmVxdWlyZWRGaWVsZHMnIH0pO1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuaW50ZWdyYXRpb25zLm91dGdvaW5nRXZlbnRzW2ludGVncmF0aW9uLmV2ZW50XS51c2UudGFyZ2V0Um9vbSAmJiAhaW50ZWdyYXRpb24udGFyZ2V0Um9vbSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdGFyZ2V0Um9vbScsICdJbnZhbGlkIFRhcmdldCBSb29tJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVJlcXVpcmVkRmllbGRzJyB9KTtcblx0fVxuXG5cdGlmICghTWF0Y2gudGVzdChpbnRlZ3JhdGlvbi51cmxzLCBbU3RyaW5nXSkpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVybHMnLCAnSW52YWxpZCBVUkxzJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVJlcXVpcmVkRmllbGRzJyB9KTtcblx0fVxuXG5cdGZvciAoY29uc3QgW2luZGV4LCB1cmxdIG9mIGludGVncmF0aW9uLnVybHMuZW50cmllcygpKSB7XG5cdFx0aWYgKHVybC50cmltKCkgPT09ICcnKSB7XG5cdFx0XHRkZWxldGUgaW50ZWdyYXRpb24udXJsc1tpbmRleF07XG5cdFx0fVxuXHR9XG5cblx0aW50ZWdyYXRpb24udXJscyA9IF8ud2l0aG91dChpbnRlZ3JhdGlvbi51cmxzLCBbdW5kZWZpbmVkXSk7XG5cblx0aWYgKGludGVncmF0aW9uLnVybHMubGVuZ3RoID09PSAwKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11cmxzJywgJ0ludmFsaWQgVVJMcycsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlSZXF1aXJlZEZpZWxkcycgfSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gX3ZlcmlmeVVzZXJIYXNQZXJtaXNzaW9uRm9yQ2hhbm5lbHMoaW50ZWdyYXRpb24sIHVzZXJJZCwgY2hhbm5lbHMpIHtcblx0Zm9yIChsZXQgY2hhbm5lbCBvZiBjaGFubmVscykge1xuXHRcdGlmIChzY29wZWRDaGFubmVscy5pbmNsdWRlcyhjaGFubmVsKSkge1xuXHRcdFx0aWYgKGNoYW5uZWwgPT09ICdhbGxfcHVibGljX2NoYW5uZWxzJykge1xuXHRcdFx0XHQvLyBObyBzcGVjaWFsIHBlcm1pc3Npb25zIG5lZWRlZCB0byBhZGQgaW50ZWdyYXRpb24gdG8gcHVibGljIGNoYW5uZWxzXG5cdFx0XHR9IGVsc2UgaWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIENoYW5uZWwnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscycgfSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxldCByZWNvcmQ7XG5cdFx0XHRjb25zdCBjaGFubmVsVHlwZSA9IGNoYW5uZWxbMF07XG5cdFx0XHRjaGFubmVsID0gY2hhbm5lbC5zdWJzdHIoMSk7XG5cblx0XHRcdHN3aXRjaCAoY2hhbm5lbFR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnIyc6XG5cdFx0XHRcdFx0cmVjb3JkID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHRcdFx0XHQkb3I6IFtcblx0XHRcdFx0XHRcdFx0e19pZDogY2hhbm5lbH0sXG5cdFx0XHRcdFx0XHRcdHtuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdAJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e3VzZXJuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXJlY29yZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVVzZXJIYXNQZXJtaXNzaW9uRm9yQ2hhbm5lbHMnIH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzQWxsUGVybWlzc2lvbih1c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgJiYgIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJlY29yZC5faWQsIHVzZXJJZCwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgQ2hhbm5lbCcsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gX3ZlcmlmeVJldHJ5SW5mb3JtYXRpb24oaW50ZWdyYXRpb24pIHtcblx0aWYgKCFpbnRlZ3JhdGlvbi5yZXRyeUZhaWxlZENhbGxzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Ly8gRG9uJ3QgYWxsb3cgbmVnYXRpdmUgcmV0cnkgY291bnRzXG5cdGludGVncmF0aW9uLnJldHJ5Q291bnQgPSBpbnRlZ3JhdGlvbi5yZXRyeUNvdW50ICYmIHBhcnNlSW50KGludGVncmF0aW9uLnJldHJ5Q291bnQpID4gMCA/IHBhcnNlSW50KGludGVncmF0aW9uLnJldHJ5Q291bnQpIDogNDtcblx0aW50ZWdyYXRpb24ucmV0cnlEZWxheSA9ICFpbnRlZ3JhdGlvbi5yZXRyeURlbGF5IHx8ICFpbnRlZ3JhdGlvbi5yZXRyeURlbGF5LnRyaW0oKSA/ICdwb3dlcnMtb2YtdGVuJyA6IGludGVncmF0aW9uLnJldHJ5RGVsYXkudG9Mb3dlckNhc2UoKTtcbn1cblxuUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudmFsaWRhdGVPdXRnb2luZyA9IGZ1bmN0aW9uIF92YWxpZGF0ZU91dGdvaW5nKGludGVncmF0aW9uLCB1c2VySWQpIHtcblx0aWYgKGludGVncmF0aW9uLmNoYW5uZWwgJiYgTWF0Y2gudGVzdChpbnRlZ3JhdGlvbi5jaGFubmVsLCBTdHJpbmcpICYmIGludGVncmF0aW9uLmNoYW5uZWwudHJpbSgpID09PSAnJykge1xuXHRcdGRlbGV0ZSBpbnRlZ3JhdGlvbi5jaGFubmVsO1xuXHR9XG5cblx0Ly9Nb3ZlZCB0byBpdCdzIG93biBmdW5jdGlvbiB0byBzdGF0aXNmeSB0aGUgY29tcGxleGl0eSBydWxlXG5cdF92ZXJpZnlSZXF1aXJlZEZpZWxkcyhpbnRlZ3JhdGlvbik7XG5cblx0bGV0IGNoYW5uZWxzID0gW107XG5cdGlmIChSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tpbnRlZ3JhdGlvbi5ldmVudF0udXNlLmNoYW5uZWwpIHtcblx0XHRpZiAoIU1hdGNoLnRlc3QoaW50ZWdyYXRpb24uY2hhbm5lbCwgU3RyaW5nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgQ2hhbm5lbCcsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nJyB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2hhbm5lbHMgPSBfLm1hcChpbnRlZ3JhdGlvbi5jaGFubmVsLnNwbGl0KCcsJyksIChjaGFubmVsKSA9PiBzLnRyaW0oY2hhbm5lbCkpO1xuXG5cdFx0XHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRcdFx0aWYgKCF2YWxpZENoYW5uZWxDaGFycy5pbmNsdWRlcyhjaGFubmVsWzBdKSAmJiAhc2NvcGVkQ2hhbm5lbHMuaW5jbHVkZXMoY2hhbm5lbC50b0xvd2VyQ2FzZSgpKSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbC1zdGFydC13aXRoLWNoYXJzJywgJ0ludmFsaWQgY2hhbm5lbC4gU3RhcnQgd2l0aCBAIG9yICMnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZycgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSBpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBlcm1pc3Npb25zJywgJ0ludmFsaWQgcGVybWlzc2lvbiBmb3IgcmVxdWlyZWQgSW50ZWdyYXRpb24gY3JlYXRpb24uJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcnIH0pO1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuaW50ZWdyYXRpb25zLm91dGdvaW5nRXZlbnRzW2ludGVncmF0aW9uLmV2ZW50XS51c2UudHJpZ2dlcldvcmRzICYmIGludGVncmF0aW9uLnRyaWdnZXJXb3Jkcykge1xuXHRcdGlmICghTWF0Y2gudGVzdChpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHMsIFtTdHJpbmddKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC10cmlnZ2VyV29yZHMnLCAnSW52YWxpZCB0cmlnZ2VyV29yZHMnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZycgfSk7XG5cdFx0fVxuXG5cdFx0aW50ZWdyYXRpb24udHJpZ2dlcldvcmRzLmZvckVhY2goKHdvcmQsIGluZGV4KSA9PiB7XG5cdFx0XHRpZiAoIXdvcmQgfHwgd29yZC50cmltKCkgPT09ICcnKSB7XG5cdFx0XHRcdGRlbGV0ZSBpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHNbaW5kZXhdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aW50ZWdyYXRpb24udHJpZ2dlcldvcmRzID0gXy53aXRob3V0KGludGVncmF0aW9uLnRyaWdnZXJXb3JkcywgW3VuZGVmaW5lZF0pO1xuXHR9IGVsc2Uge1xuXHRcdGRlbGV0ZSBpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHM7XG5cdH1cblxuXHRpZiAoaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCA9PT0gdHJ1ZSAmJiBpbnRlZ3JhdGlvbi5zY3JpcHQgJiYgaW50ZWdyYXRpb24uc2NyaXB0LnRyaW0oKSAhPT0gJycpIHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgYmFiZWxPcHRpb25zID0gT2JqZWN0LmFzc2lnbihCYWJlbC5nZXREZWZhdWx0T3B0aW9ucyh7IHJ1bnRpbWU6IGZhbHNlIH0pLCB7IGNvbXBhY3Q6IHRydWUsIG1pbmlmaWVkOiB0cnVlLCBjb21tZW50czogZmFsc2UgfSk7XG5cblx0XHRcdGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkID0gQmFiZWwuY29tcGlsZShpbnRlZ3JhdGlvbi5zY3JpcHQsIGJhYmVsT3B0aW9ucykuY29kZTtcblx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gdW5kZWZpbmVkO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkID0gdW5kZWZpbmVkO1xuXHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0RXJyb3IgPSBfLnBpY2soZSwgJ25hbWUnLCAnbWVzc2FnZScsICdzdGFjaycpO1xuXHRcdH1cblx0fVxuXG5cdGlmICh0eXBlb2YgaW50ZWdyYXRpb24ucnVuT25FZGl0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHQvLyBWZXJpZnkgdGhpcyB2YWx1ZSBpcyBvbmx5IHRydWUvZmFsc2Vcblx0XHRpbnRlZ3JhdGlvbi5ydW5PbkVkaXRzID0gaW50ZWdyYXRpb24ucnVuT25FZGl0cyA9PT0gdHJ1ZTtcblx0fVxuXG5cdF92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzKGludGVncmF0aW9uLCB1c2VySWQsIGNoYW5uZWxzKTtcblx0X3ZlcmlmeVJldHJ5SW5mb3JtYXRpb24oaW50ZWdyYXRpb24pO1xuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHsgdXNlcm5hbWU6IGludGVncmF0aW9uLnVzZXJuYW1lIH0pO1xuXG5cdGlmICghdXNlcikge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXIgKGRpZCB5b3UgZGVsZXRlIHRoZSBgcm9ja2V0LmNhdGAgdXNlcj8pJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcnIH0pO1xuXHR9XG5cblx0aW50ZWdyYXRpb24udHlwZSA9ICd3ZWJob29rLW91dGdvaW5nJztcblx0aW50ZWdyYXRpb24udXNlcklkID0gdXNlci5faWQ7XG5cdGludGVncmF0aW9uLmNoYW5uZWwgPSBjaGFubmVscztcblxuXHRyZXR1cm4gaW50ZWdyYXRpb247XG59O1xuIiwiLyogZ2xvYmFsIGxvZ2dlciwgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcbmltcG9ydCB2bSBmcm9tICd2bSc7XG5pbXBvcnQgRmliZXIgZnJvbSAnZmliZXJzJztcbmltcG9ydCBGdXR1cmUgZnJvbSAnZmliZXJzL2Z1dHVyZSc7XG5cblJvY2tldENoYXQuaW50ZWdyYXRpb25zLnRyaWdnZXJIYW5kbGVyID0gbmV3IGNsYXNzIFJvY2tldENoYXRJbnRlZ3JhdGlvbkhhbmRsZXIge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnZtID0gdm07XG5cdFx0dGhpcy5zdWNjZXNzUmVzdWx0cyA9IFsyMDAsIDIwMSwgMjAyXTtcblx0XHR0aGlzLmNvbXBpbGVkU2NyaXB0cyA9IHt9O1xuXHRcdHRoaXMudHJpZ2dlcnMgPSB7fTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKHt0eXBlOiAnd2ViaG9vay1vdXRnb2luZyd9KS5vYnNlcnZlKHtcblx0XHRcdGFkZGVkOiAocmVjb3JkKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWRkSW50ZWdyYXRpb24ocmVjb3JkKTtcblx0XHRcdH0sXG5cblx0XHRcdGNoYW5nZWQ6IChyZWNvcmQpID0+IHtcblx0XHRcdFx0dGhpcy5yZW1vdmVJbnRlZ3JhdGlvbihyZWNvcmQpO1xuXHRcdFx0XHR0aGlzLmFkZEludGVncmF0aW9uKHJlY29yZCk7XG5cdFx0XHR9LFxuXG5cdFx0XHRyZW1vdmVkOiAocmVjb3JkKSA9PiB7XG5cdFx0XHRcdHRoaXMucmVtb3ZlSW50ZWdyYXRpb24ocmVjb3JkKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGFkZEludGVncmF0aW9uKHJlY29yZCkge1xuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhgQWRkaW5nIHRoZSBpbnRlZ3JhdGlvbiAkeyByZWNvcmQubmFtZSB9IG9mIHRoZSBldmVudCAkeyByZWNvcmQuZXZlbnQgfSFgKTtcblx0XHRsZXQgY2hhbm5lbHM7XG5cdFx0aWYgKHJlY29yZC5ldmVudCAmJiAhUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMub3V0Z29pbmdFdmVudHNbcmVjb3JkLmV2ZW50XS51c2UuY2hhbm5lbCkge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdUaGUgaW50ZWdyYXRpb24gZG9lc250IHJlbHkgb24gY2hhbm5lbHMuJyk7XG5cdFx0XHQvL1dlIGRvbid0IHVzZSBhbnkgY2hhbm5lbHMsIHNvIGl0J3Mgc3BlY2lhbCA7KVxuXHRcdFx0Y2hhbm5lbHMgPSBbJ19fYW55J107XG5cdFx0fSBlbHNlIGlmIChfLmlzRW1wdHkocmVjb3JkLmNoYW5uZWwpKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoJ1RoZSBpbnRlZ3JhdGlvbiBoYWQgYW4gZW1wdHkgY2hhbm5lbCBwcm9wZXJ0eSwgc28gaXQgaXMgZ29pbmcgb24gYWxsIHRoZSBwdWJsaWMgY2hhbm5lbHMuJyk7XG5cdFx0XHRjaGFubmVscyA9IFsnYWxsX3B1YmxpY19jaGFubmVscyddO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoJ1RoZSBpbnRlZ3JhdGlvbiBpcyBnb2luZyBvbiB0aGVzZSBjaGFubmVsczonLCByZWNvcmQuY2hhbm5lbCk7XG5cdFx0XHRjaGFubmVscyA9IFtdLmNvbmNhdChyZWNvcmQuY2hhbm5lbCk7XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRpZiAoIXRoaXMudHJpZ2dlcnNbY2hhbm5lbF0pIHtcblx0XHRcdFx0dGhpcy50cmlnZ2Vyc1tjaGFubmVsXSA9IHt9O1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnRyaWdnZXJzW2NoYW5uZWxdW3JlY29yZC5faWRdID0gcmVjb3JkO1xuXHRcdH1cblx0fVxuXG5cdHJlbW92ZUludGVncmF0aW9uKHJlY29yZCkge1xuXHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnMpKSB7XG5cdFx0XHRkZWxldGUgdHJpZ2dlcltyZWNvcmQuX2lkXTtcblx0XHR9XG5cdH1cblxuXHRpc1RyaWdnZXJFbmFibGVkKHRyaWdnZXIpIHtcblx0XHRmb3IgKGNvbnN0IHRyaWcgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzKSkge1xuXHRcdFx0aWYgKHRyaWdbdHJpZ2dlci5faWRdKSB7XG5cdFx0XHRcdHJldHVybiB0cmlnW3RyaWdnZXIuX2lkXS5lbmFibGVkO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXAsIGludGVncmF0aW9uLCBldmVudCwgZGF0YSwgdHJpZ2dlcldvcmQsIHJhblByZXBhcmVTY3JpcHQsIHByZXBhcmVTZW50TWVzc2FnZSwgcHJvY2Vzc1NlbnRNZXNzYWdlLCByZXN1bHRNZXNzYWdlLCBmaW5pc2hlZCwgdXJsLCBodHRwQ2FsbERhdGEsIGh0dHBFcnJvciwgaHR0cFJlc3VsdCwgZXJyb3IsIGVycm9yU3RhY2sgfSkge1xuXHRcdGNvbnN0IGhpc3RvcnkgPSB7XG5cdFx0XHR0eXBlOiAnb3V0Z29pbmctd2ViaG9vaycsXG5cdFx0XHRzdGVwXG5cdFx0fTtcblxuXHRcdC8vIFVzdWFsbHkgaXMgb25seSBhZGRlZCBvbiBpbml0aWFsIGluc2VydFxuXHRcdGlmIChpbnRlZ3JhdGlvbikge1xuXHRcdFx0aGlzdG9yeS5pbnRlZ3JhdGlvbiA9IGludGVncmF0aW9uO1xuXHRcdH1cblxuXHRcdC8vIFVzdWFsbHkgaXMgb25seSBhZGRlZCBvbiBpbml0aWFsIGluc2VydFxuXHRcdGlmIChldmVudCkge1xuXHRcdFx0aGlzdG9yeS5ldmVudCA9IGV2ZW50O1xuXHRcdH1cblxuXHRcdGlmIChkYXRhKSB7XG5cdFx0XHRoaXN0b3J5LmRhdGEgPSB7IC4uLmRhdGEgfTtcblxuXHRcdFx0aWYgKGRhdGEudXNlcikge1xuXHRcdFx0XHRoaXN0b3J5LmRhdGEudXNlciA9IF8ub21pdChkYXRhLnVzZXIsIFsnc2VydmljZXMnXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhLnJvb20pIHtcblx0XHRcdFx0aGlzdG9yeS5kYXRhLnJvb20gPSBkYXRhLnJvb207XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRyaWdnZXJXb3JkKSB7XG5cdFx0XHRoaXN0b3J5LnRyaWdnZXJXb3JkID0gdHJpZ2dlcldvcmQ7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiByYW5QcmVwYXJlU2NyaXB0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5yYW5QcmVwYXJlU2NyaXB0ID0gcmFuUHJlcGFyZVNjcmlwdDtcblx0XHR9XG5cblx0XHRpZiAocHJlcGFyZVNlbnRNZXNzYWdlKSB7XG5cdFx0XHRoaXN0b3J5LnByZXBhcmVTZW50TWVzc2FnZSA9IHByZXBhcmVTZW50TWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAocHJvY2Vzc1NlbnRNZXNzYWdlKSB7XG5cdFx0XHRoaXN0b3J5LnByb2Nlc3NTZW50TWVzc2FnZSA9IHByb2Nlc3NTZW50TWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAocmVzdWx0TWVzc2FnZSkge1xuXHRcdFx0aGlzdG9yeS5yZXN1bHRNZXNzYWdlID0gcmVzdWx0TWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZpbmlzaGVkICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5maW5pc2hlZCA9IGZpbmlzaGVkO1xuXHRcdH1cblxuXHRcdGlmICh1cmwpIHtcblx0XHRcdGhpc3RvcnkudXJsID0gdXJsO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgaHR0cENhbGxEYXRhICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5odHRwQ2FsbERhdGEgPSBodHRwQ2FsbERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKGh0dHBFcnJvcikge1xuXHRcdFx0aGlzdG9yeS5odHRwRXJyb3IgPSBodHRwRXJyb3I7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBodHRwUmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5odHRwUmVzdWx0ID0gSlNPTi5zdHJpbmdpZnkoaHR0cFJlc3VsdCwgbnVsbCwgMik7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBlcnJvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGhpc3RvcnkuZXJyb3IgPSBlcnJvcjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGVycm9yU3RhY2sgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRoaXN0b3J5LmVycm9yU3RhY2sgPSBlcnJvclN0YWNrO1xuXHRcdH1cblxuXHRcdGlmIChoaXN0b3J5SWQpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS51cGRhdGUoeyBfaWQ6IGhpc3RvcnlJZCB9LCB7ICRzZXQ6IGhpc3RvcnkgfSk7XG5cdFx0XHRyZXR1cm4gaGlzdG9yeUlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRoaXN0b3J5Ll9jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5pbnNlcnQoT2JqZWN0LmFzc2lnbih7IF9pZDogUmFuZG9tLmlkKCkgfSwgaGlzdG9yeSkpO1xuXHRcdH1cblx0fVxuXG5cdC8vVHJpZ2dlciBpcyB0aGUgdHJpZ2dlciwgbmFtZU9ySWQgaXMgYSBzdHJpbmcgd2hpY2ggaXMgdXNlZCB0byB0cnkgYW5kIGZpbmQgYSByb29tLCByb29tIGlzIGEgcm9vbSwgbWVzc2FnZSBpcyBhIG1lc3NhZ2UsIGFuZCBkYXRhIGNvbnRhaW5zIFwidXNlcl9uYW1lXCIgaWYgdHJpZ2dlci5pbXBlcnNvbmF0ZVVzZXIgaXMgdHJ1dGhmdWwuXG5cdHNlbmRNZXNzYWdlKHsgdHJpZ2dlciwgbmFtZU9ySWQgPSAnJywgcm9vbSwgbWVzc2FnZSwgZGF0YSB9KSB7XG5cdFx0bGV0IHVzZXI7XG5cdFx0Ly9UcnkgdG8gZmluZCB0aGUgdXNlciB3aG8gd2UgYXJlIGltcGVyc29uYXRpbmdcblx0XHRpZiAodHJpZ2dlci5pbXBlcnNvbmF0ZVVzZXIpIHtcblx0XHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShkYXRhLnVzZXJfbmFtZSk7XG5cdFx0fVxuXG5cdFx0Ly9JZiB0aGV5IGRvbid0IGV4aXN0IChha2EgdGhlIHRyaWdnZXIgZGlkbid0IGNvbnRhaW4gYSB1c2VyKSB0aGVuIHdlIHNldCB0aGUgdXNlciBiYXNlZCB1cG9uIHRoZVxuXHRcdC8vY29uZmlndXJlZCB1c2VybmFtZSBmb3IgdGhlIGludGVncmF0aW9uIHNpbmNlIHRoaXMgaXMgcmVxdWlyZWQgYXQgYWxsIHRpbWVzLlxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHRyaWdnZXIudXNlcm5hbWUpO1xuXHRcdH1cblxuXHRcdGxldCB0bXBSb29tO1xuXHRcdGlmIChuYW1lT3JJZCB8fCB0cmlnZ2VyLnRhcmdldFJvb20gfHwgbWVzc2FnZS5jaGFubmVsKSB7XG5cdFx0XHR0bXBSb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oeyBjdXJyZW50VXNlcklkOiB1c2VyLl9pZCwgbmFtZU9ySWQ6IG5hbWVPcklkIHx8IG1lc3NhZ2UuY2hhbm5lbCB8fCB0cmlnZ2VyLnRhcmdldFJvb20sIGVycm9yT25FbXB0eTogZmFsc2UgfSkgfHwgcm9vbTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dG1wUm9vbSA9IHJvb207XG5cdFx0fVxuXG5cdFx0Ly9JZiBubyByb29tIGNvdWxkIGJlIGZvdW5kLCB3ZSB3b24ndCBiZSBzZW5kaW5nIGFueSBtZXNzYWdlcyBidXQgd2UnbGwgd2FybiBpbiB0aGUgbG9nc1xuXHRcdGlmICghdG1wUm9vbSkge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLndhcm4oYFRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgZG9lc24ndCBoYXZlIGEgcm9vbSBjb25maWd1cmVkIG5vciBkaWQgaXQgcHJvdmlkZSBhIHJvb20gdG8gc2VuZCB0aGUgbWVzc2FnZSB0by5gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEZvdW5kIGEgcm9vbSBmb3IgJHsgdHJpZ2dlci5uYW1lIH0gd2hpY2ggaXM6ICR7IHRtcFJvb20ubmFtZSB9IHdpdGggYSB0eXBlIG9mICR7IHRtcFJvb20udCB9YCk7XG5cblx0XHRtZXNzYWdlLmJvdCA9IHsgaTogdHJpZ2dlci5faWQgfTtcblxuXHRcdGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB7XG5cdFx0XHRhbGlhczogdHJpZ2dlci5hbGlhcyxcblx0XHRcdGF2YXRhcjogdHJpZ2dlci5hdmF0YXIsXG5cdFx0XHRlbW9qaTogdHJpZ2dlci5lbW9qaVxuXHRcdH07XG5cblx0XHRpZiAodG1wUm9vbS50ID09PSAnZCcpIHtcblx0XHRcdG1lc3NhZ2UuY2hhbm5lbCA9IGBAJHsgdG1wUm9vbS5faWQgfWA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UuY2hhbm5lbCA9IGAjJHsgdG1wUm9vbS5faWQgfWA7XG5cdFx0fVxuXG5cdFx0bWVzc2FnZSA9IHByb2Nlc3NXZWJob29rTWVzc2FnZShtZXNzYWdlLCB1c2VyLCBkZWZhdWx0VmFsdWVzKTtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGJ1aWxkU2FuZGJveChzdG9yZSA9IHt9KSB7XG5cdFx0Y29uc3Qgc2FuZGJveCA9IHtcblx0XHRcdHNjcmlwdFRpbWVvdXQocmVqZWN0KSB7XG5cdFx0XHRcdHJldHVybiBzZXRUaW1lb3V0KCgpID0+IHJlamVjdCgndGltZWQgb3V0JyksIDMwMDApO1xuXHRcdFx0fSxcblx0XHRcdF8sXG5cdFx0XHRzLFxuXHRcdFx0Y29uc29sZSxcblx0XHRcdG1vbWVudCxcblx0XHRcdEZpYmVyLFxuXHRcdFx0UHJvbWlzZSxcblx0XHRcdFN0b3JlOiB7XG5cdFx0XHRcdHNldDogKGtleSwgdmFsKSA9PiBzdG9yZVtrZXldID0gdmFsLFxuXHRcdFx0XHRnZXQ6IChrZXkpID0+IHN0b3JlW2tleV1cblx0XHRcdH0sXG5cdFx0XHRIVFRQOiAobWV0aG9kLCB1cmwsIG9wdGlvbnMpID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0cmVzdWx0OiBIVFRQLmNhbGwobWV0aG9kLCB1cmwsIG9wdGlvbnMpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRyZXR1cm4geyBlcnJvciB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdE9iamVjdC5rZXlzKFJvY2tldENoYXQubW9kZWxzKS5maWx0ZXIoayA9PiAhay5zdGFydHNXaXRoKCdfJykpLmZvckVhY2goayA9PiB7XG5cdFx0XHRzYW5kYm94W2tdID0gUm9ja2V0Q2hhdC5tb2RlbHNba107XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4geyBzdG9yZSwgc2FuZGJveCB9O1xuXHR9XG5cblx0Z2V0SW50ZWdyYXRpb25TY3JpcHQoaW50ZWdyYXRpb24pIHtcblx0XHRjb25zdCBjb21waWxlZFNjcmlwdCA9IHRoaXMuY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF07XG5cdFx0aWYgKGNvbXBpbGVkU2NyaXB0ICYmICtjb21waWxlZFNjcmlwdC5fdXBkYXRlZEF0ID09PSAraW50ZWdyYXRpb24uX3VwZGF0ZWRBdCkge1xuXHRcdFx0cmV0dXJuIGNvbXBpbGVkU2NyaXB0LnNjcmlwdDtcblx0XHR9XG5cblx0XHRjb25zdCBzY3JpcHQgPSBpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZDtcblx0XHRjb25zdCB7IHN0b3JlLCBzYW5kYm94IH0gPSB0aGlzLmJ1aWxkU2FuZGJveCgpO1xuXG5cdFx0bGV0IHZtU2NyaXB0O1xuXHRcdHRyeSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuaW5mbygnV2lsbCBldmFsdWF0ZSBzY3JpcHQgb2YgVHJpZ2dlcicsIGludGVncmF0aW9uLm5hbWUpO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKHNjcmlwdCk7XG5cblx0XHRcdHZtU2NyaXB0ID0gdGhpcy52bS5jcmVhdGVTY3JpcHQoc2NyaXB0LCAnc2NyaXB0LmpzJyk7XG5cblx0XHRcdHZtU2NyaXB0LnJ1bkluTmV3Q29udGV4dChzYW5kYm94KTtcblxuXHRcdFx0aWYgKHNhbmRib3guU2NyaXB0KSB7XG5cdFx0XHRcdHRoaXMuY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF0gPSB7XG5cdFx0XHRcdFx0c2NyaXB0OiBuZXcgc2FuZGJveC5TY3JpcHQoKSxcblx0XHRcdFx0XHRzdG9yZSxcblx0XHRcdFx0XHRfdXBkYXRlZEF0OiBpbnRlZ3JhdGlvbi5fdXBkYXRlZEF0XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIHRoaXMuY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF0uc2NyaXB0O1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgZXZhbHVhdGluZyBTY3JpcHQgaW4gVHJpZ2dlciAkeyBpbnRlZ3JhdGlvbi5uYW1lIH06YCk7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3Ioc2NyaXB0LnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcignU3RhY2sgVHJhY2U6Jyk7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoZS5zdGFjay5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ldmFsdWF0aW5nLXNjcmlwdCcpO1xuXHRcdH1cblxuXHRcdGlmICghc2FuZGJveC5TY3JpcHQpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgQ2xhc3MgXCJTY3JpcHRcIiBub3QgaW4gVHJpZ2dlciAkeyBpbnRlZ3JhdGlvbi5uYW1lIH06YCk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdjbGFzcy1zY3JpcHQtbm90LWZvdW5kJyk7XG5cdFx0fVxuXHR9XG5cblx0aGFzU2NyaXB0QW5kTWV0aG9kKGludGVncmF0aW9uLCBtZXRob2QpIHtcblx0XHRpZiAoaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCAhPT0gdHJ1ZSB8fCAhaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQgfHwgaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQudHJpbSgpID09PSAnJykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGxldCBzY3JpcHQ7XG5cdFx0dHJ5IHtcblx0XHRcdHNjcmlwdCA9IHRoaXMuZ2V0SW50ZWdyYXRpb25TY3JpcHQoaW50ZWdyYXRpb24pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHlwZW9mIHNjcmlwdFttZXRob2RdICE9PSAndW5kZWZpbmVkJztcblx0fVxuXG5cdGV4ZWN1dGVTY3JpcHQoaW50ZWdyYXRpb24sIG1ldGhvZCwgcGFyYW1zLCBoaXN0b3J5SWQpIHtcblx0XHRsZXQgc2NyaXB0O1xuXHRcdHRyeSB7XG5cdFx0XHRzY3JpcHQgPSB0aGlzLmdldEludGVncmF0aW9uU2NyaXB0KGludGVncmF0aW9uKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdleGVjdXRlLXNjcmlwdC1nZXR0aW5nLXNjcmlwdCcsIGVycm9yOiB0cnVlLCBlcnJvclN0YWNrOiBlIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghc2NyaXB0W21ldGhvZF0pIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgTWV0aG9kIFwiJHsgbWV0aG9kIH1cIiBubyBmb3VuZCBpbiB0aGUgSW50ZWdyYXRpb24gXCIkeyBpbnRlZ3JhdGlvbi5uYW1lIH1cImApO1xuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiBgZXhlY3V0ZS1zY3JpcHQtbm8tbWV0aG9kLSR7IG1ldGhvZCB9YCB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgeyBzYW5kYm94IH0gPSB0aGlzLmJ1aWxkU2FuZGJveCh0aGlzLmNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdLnN0b3JlKTtcblx0XHRcdHNhbmRib3guc2NyaXB0ID0gc2NyaXB0O1xuXHRcdFx0c2FuZGJveC5tZXRob2QgPSBtZXRob2Q7XG5cdFx0XHRzYW5kYm94LnBhcmFtcyA9IHBhcmFtcztcblxuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiBgZXhlY3V0ZS1zY3JpcHQtYmVmb3JlLXJ1bm5pbmctJHsgbWV0aG9kIH1gIH0pO1xuXG5cdFx0XHRjb25zdCByZXN1bHQgPSBGdXR1cmUuZnJvbVByb21pc2UodGhpcy52bS5ydW5Jbk5ld0NvbnRleHQoYFxuXHRcdFx0XHRuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdFx0RmliZXIoKCkgPT4ge1xuXHRcdFx0XHRcdFx0c2NyaXB0VGltZW91dChyZWplY3QpO1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZShzY3JpcHRbbWV0aG9kXShwYXJhbXMpKVxuXHRcdFx0XHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KS5ydW4oKTtcblx0XHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7IHRocm93IG5ldyBFcnJvcihlcnJvcik7IH0pO1xuXHRcdFx0YCwgc2FuZGJveCwge1xuXHRcdFx0XHR0aW1lb3V0OiAzMDAwXG5cdFx0XHR9KSkud2FpdCgpO1xuXG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYFNjcmlwdCBtZXRob2QgXCIkeyBtZXRob2QgfVwiIHJlc3VsdCBvZiB0aGUgSW50ZWdyYXRpb24gXCIkeyBpbnRlZ3JhdGlvbi5uYW1lIH1cIiBpczpgKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhyZXN1bHQpO1xuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogYGV4ZWN1dGUtc2NyaXB0LWVycm9yLXJ1bm5pbmctJHsgbWV0aG9kIH1gLCBlcnJvcjogdHJ1ZSwgZXJyb3JTdGFjazogZS5zdGFjay5yZXBsYWNlKC9eL2dtLCAnICAnKSB9KTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgcnVubmluZyBTY3JpcHQgaW4gdGhlIEludGVncmF0aW9uICR7IGludGVncmF0aW9uLm5hbWUgfTpgKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZC5yZXBsYWNlKC9eL2dtLCAnICAnKSk7IC8vIE9ubHkgb3V0cHV0IHRoZSBjb21waWxlZCBzY3JpcHQgaWYgZGVidWdnaW5nIGlzIGVuYWJsZWQsIHNvIHRoZSBsb2dzIGRvbid0IGdldCBzcGFtbWVkLlxuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKCdTdGFjazonKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihlLnN0YWNrLnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cblxuXHRldmVudE5hbWVBcmd1bWVudHNUb09iamVjdCgpIHtcblx0XHRjb25zdCBhcmdPYmplY3QgPSB7XG5cdFx0XHRldmVudDogYXJndW1lbnRzWzBdXG5cdFx0fTtcblxuXHRcdHN3aXRjaCAoYXJnT2JqZWN0LmV2ZW50KSB7XG5cdFx0XHRjYXNlICdzZW5kTWVzc2FnZSc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcblx0XHRcdFx0XHRhcmdPYmplY3QubWVzc2FnZSA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0XHRhcmdPYmplY3Qucm9vbSA9IGFyZ3VtZW50c1syXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2ZpbGVVcGxvYWRlZCc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDIpIHtcblx0XHRcdFx0XHRjb25zdCBhcmdoaGggPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmdoaGgudXNlcjtcblx0XHRcdFx0XHRhcmdPYmplY3Qucm9vbSA9IGFyZ2hoaC5yb29tO1xuXHRcdFx0XHRcdGFyZ09iamVjdC5tZXNzYWdlID0gYXJnaGhoLm1lc3NhZ2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQXJjaGl2ZWQnOlxuXHRcdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnJvb20gPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmd1bWVudHNbMl07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQ3JlYXRlZCc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcblx0XHRcdFx0XHRhcmdPYmplY3Qub3duZXIgPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnJvb20gPSBhcmd1bWVudHNbMl07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tSm9pbmVkJzpcblx0XHRcdGNhc2UgJ3Jvb21MZWZ0Jzpcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuXHRcdFx0XHRcdGFyZ09iamVjdC51c2VyID0gYXJndW1lbnRzWzFdO1xuXHRcdFx0XHRcdGFyZ09iamVjdC5yb29tID0gYXJndW1lbnRzWzJdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlckNyZWF0ZWQnOlxuXHRcdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAyKSB7XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRsb2dnZXIub3V0Z29pbmcud2FybihgQW4gVW5oYW5kbGVkIFRyaWdnZXIgRXZlbnQgd2FzIGNhbGxlZDogJHsgYXJnT2JqZWN0LmV2ZW50IH1gKTtcblx0XHRcdFx0YXJnT2JqZWN0LmV2ZW50ID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEdvdCB0aGUgZXZlbnQgYXJndW1lbnRzIGZvciB0aGUgZXZlbnQ6ICR7IGFyZ09iamVjdC5ldmVudCB9YCwgYXJnT2JqZWN0KTtcblxuXHRcdHJldHVybiBhcmdPYmplY3Q7XG5cdH1cblxuXHRtYXBFdmVudEFyZ3NUb0RhdGEoZGF0YSwgeyBldmVudCwgbWVzc2FnZSwgcm9vbSwgb3duZXIsIHVzZXIgfSkge1xuXHRcdHN3aXRjaCAoZXZlbnQpIHtcblx0XHRcdGNhc2UgJ3NlbmRNZXNzYWdlJzpcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLm1lc3NhZ2VfaWQgPSBtZXNzYWdlLl9pZDtcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSBtZXNzYWdlLnRzO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSBtZXNzYWdlLnUuX2lkO1xuXHRcdFx0XHRkYXRhLnVzZXJfbmFtZSA9IG1lc3NhZ2UudS51c2VybmFtZTtcblx0XHRcdFx0ZGF0YS50ZXh0ID0gbWVzc2FnZS5tc2c7XG5cblx0XHRcdFx0aWYgKG1lc3NhZ2UuYWxpYXMpIHtcblx0XHRcdFx0XHRkYXRhLmFsaWFzID0gbWVzc2FnZS5hbGlhcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChtZXNzYWdlLmJvdCkge1xuXHRcdFx0XHRcdGRhdGEuYm90ID0gbWVzc2FnZS5ib3Q7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdFx0XHRcdGRhdGEuaXNFZGl0ZWQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZmlsZVVwbG9hZGVkJzpcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLm1lc3NhZ2VfaWQgPSBtZXNzYWdlLl9pZDtcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSBtZXNzYWdlLnRzO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSBtZXNzYWdlLnUuX2lkO1xuXHRcdFx0XHRkYXRhLnVzZXJfbmFtZSA9IG1lc3NhZ2UudS51c2VybmFtZTtcblx0XHRcdFx0ZGF0YS50ZXh0ID0gbWVzc2FnZS5tc2c7XG5cdFx0XHRcdGRhdGEudXNlciA9IHVzZXI7XG5cdFx0XHRcdGRhdGEucm9vbSA9IHJvb207XG5cdFx0XHRcdGRhdGEubWVzc2FnZSA9IG1lc3NhZ2U7XG5cblx0XHRcdFx0aWYgKG1lc3NhZ2UuYWxpYXMpIHtcblx0XHRcdFx0XHRkYXRhLmFsaWFzID0gbWVzc2FnZS5hbGlhcztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChtZXNzYWdlLmJvdCkge1xuXHRcdFx0XHRcdGRhdGEuYm90ID0gbWVzc2FnZS5ib3Q7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQ3JlYXRlZCc6XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9pZCA9IHJvb20uX2lkO1xuXHRcdFx0XHRkYXRhLmNoYW5uZWxfbmFtZSA9IHJvb20ubmFtZTtcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSByb29tLnRzO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSBvd25lci5faWQ7XG5cdFx0XHRcdGRhdGEudXNlcl9uYW1lID0gb3duZXIudXNlcm5hbWU7XG5cdFx0XHRcdGRhdGEub3duZXIgPSBvd25lcjtcblx0XHRcdFx0ZGF0YS5yb29tID0gcm9vbTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdyb29tQXJjaGl2ZWQnOlxuXHRcdFx0Y2FzZSAncm9vbUpvaW5lZCc6XG5cdFx0XHRjYXNlICdyb29tTGVmdCc6XG5cdFx0XHRcdGRhdGEudGltZXN0YW1wID0gbmV3IERhdGUoKTtcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSB1c2VyLl9pZDtcblx0XHRcdFx0ZGF0YS51c2VyX25hbWUgPSB1c2VyLnVzZXJuYW1lO1xuXHRcdFx0XHRkYXRhLnVzZXIgPSB1c2VyO1xuXHRcdFx0XHRkYXRhLnJvb20gPSByb29tO1xuXG5cdFx0XHRcdGlmICh1c2VyLnR5cGUgPT09ICdib3QnKSB7XG5cdFx0XHRcdFx0ZGF0YS5ib3QgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlckNyZWF0ZWQnOlxuXHRcdFx0XHRkYXRhLnRpbWVzdGFtcCA9IHVzZXIuY3JlYXRlZEF0O1xuXHRcdFx0XHRkYXRhLnVzZXJfaWQgPSB1c2VyLl9pZDtcblx0XHRcdFx0ZGF0YS51c2VyX25hbWUgPSB1c2VyLnVzZXJuYW1lO1xuXHRcdFx0XHRkYXRhLnVzZXIgPSB1c2VyO1xuXG5cdFx0XHRcdGlmICh1c2VyLnR5cGUgPT09ICdib3QnKSB7XG5cdFx0XHRcdFx0ZGF0YS5ib3QgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0ZXhlY3V0ZVRyaWdnZXJzKCkge1xuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZygnRXhlY3V0ZSBUcmlnZ2VyOicsIGFyZ3VtZW50c1swXSk7XG5cblx0XHRjb25zdCBhcmdPYmplY3QgPSB0aGlzLmV2ZW50TmFtZUFyZ3VtZW50c1RvT2JqZWN0KC4uLmFyZ3VtZW50cyk7XG5cdFx0Y29uc3QgeyBldmVudCwgbWVzc2FnZSwgcm9vbSB9ID0gYXJnT2JqZWN0O1xuXG5cdFx0Ly9FYWNoIHR5cGUgb2YgZXZlbnQgc2hvdWxkIGhhdmUgYW4gZXZlbnQgYW5kIGEgcm9vbSBhdHRhY2hlZCwgb3RoZXJ3aXNlIHdlXG5cdFx0Ly93b3VsZG4ndCBrbm93IGhvdyB0byBoYW5kbGUgdGhlIHRyaWdnZXIgbm9yIHdvdWxkIHdlIGhhdmUgYW55d2hlcmUgdG8gc2VuZCB0aGVcblx0XHQvL3Jlc3VsdCBvZiB0aGUgaW50ZWdyYXRpb25cblx0XHRpZiAoIWV2ZW50KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHJpZ2dlcnNUb0V4ZWN1dGUgPSBbXTtcblxuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZygnU3RhcnRpbmcgc2VhcmNoIGZvciB0cmlnZ2VycyBmb3IgdGhlIHJvb206Jywgcm9vbSA/IHJvb20uX2lkIDogJ19fYW55Jyk7XG5cdFx0aWYgKHJvb20pIHtcblx0XHRcdHN3aXRjaCAocm9vbS50KSB7XG5cdFx0XHRcdGNhc2UgJ2QnOlxuXHRcdFx0XHRcdGNvbnN0IGlkID0gcm9vbS5faWQucmVwbGFjZShtZXNzYWdlLnUuX2lkLCAnJyk7XG5cdFx0XHRcdFx0Y29uc3QgdXNlcm5hbWUgPSBfLndpdGhvdXQocm9vbS51c2VybmFtZXMsIG1lc3NhZ2UudS51c2VybmFtZSlbMF07XG5cblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vyc1tgQCR7IGlkIH1gXSkge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vyc1tgQCR7IGlkIH1gXSkpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vycy5hbGxfZGlyZWN0X21lc3NhZ2VzKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzLmFsbF9kaXJlY3RfbWVzc2FnZXMpKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlkICE9PSB1c2VybmFtZSAmJiB0aGlzLnRyaWdnZXJzW2BAJHsgdXNlcm5hbWUgfWBdKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzW2BAJHsgdXNlcm5hbWUgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRjYXNlICdjJzpcblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vycy5hbGxfcHVibGljX2NoYW5uZWxzKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzLmFsbF9wdWJsaWNfY2hhbm5lbHMpKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHJvb20uX2lkICE9PSByb29tLm5hbWUgJiYgdGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20ubmFtZSB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLm5hbWUgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGlmICh0aGlzLnRyaWdnZXJzLmFsbF9wcml2YXRlX2dyb3Vwcykge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vycy5hbGxfcHJpdmF0ZV9ncm91cHMpKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLl9pZCB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKHJvb20uX2lkICE9PSByb29tLm5hbWUgJiYgdGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20ubmFtZSB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYCMkeyByb29tLm5hbWUgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy50cmlnZ2Vycy5fX2FueSkge1xuXHRcdFx0Ly9Gb3Igb3V0Z29pbmcgaW50ZWdyYXRpb24gd2hpY2ggZG9uJ3QgcmVseSBvbiByb29tcy5cblx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnMuX19hbnkpKSB7XG5cdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBGb3VuZCAkeyB0cmlnZ2Vyc1RvRXhlY3V0ZS5sZW5ndGggfSB0byBpdGVyYXRlIG92ZXIgYW5kIHNlZSBpZiB0aGUgbWF0Y2ggdGhlIGV2ZW50LmApO1xuXG5cdFx0Zm9yIChjb25zdCB0cmlnZ2VyVG9FeGVjdXRlIG9mIHRyaWdnZXJzVG9FeGVjdXRlKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYElzIFwiJHsgdHJpZ2dlclRvRXhlY3V0ZS5uYW1lIH1cIiBlbmFibGVkLCAkeyB0cmlnZ2VyVG9FeGVjdXRlLmVuYWJsZWQgfSwgYW5kIHdoYXQgaXMgdGhlIGV2ZW50PyAkeyB0cmlnZ2VyVG9FeGVjdXRlLmV2ZW50IH1gKTtcblx0XHRcdGlmICh0cmlnZ2VyVG9FeGVjdXRlLmVuYWJsZWQgPT09IHRydWUgJiYgdHJpZ2dlclRvRXhlY3V0ZS5ldmVudCA9PT0gZXZlbnQpIHtcblx0XHRcdFx0dGhpcy5leGVjdXRlVHJpZ2dlcih0cmlnZ2VyVG9FeGVjdXRlLCBhcmdPYmplY3QpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGV4ZWN1dGVUcmlnZ2VyKHRyaWdnZXIsIGFyZ09iamVjdCkge1xuXHRcdGZvciAoY29uc3QgdXJsIG9mIHRyaWdnZXIudXJscykge1xuXHRcdFx0dGhpcy5leGVjdXRlVHJpZ2dlclVybCh1cmwsIHRyaWdnZXIsIGFyZ09iamVjdCwgMCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhlY3V0ZVRyaWdnZXJVcmwodXJsLCB0cmlnZ2VyLCB7IGV2ZW50LCBtZXNzYWdlLCByb29tLCBvd25lciwgdXNlciB9LCB0aGVIaXN0b3J5SWQsIHRyaWVzID0gMCkge1xuXHRcdGlmICghdGhpcy5pc1RyaWdnZXJFbmFibGVkKHRyaWdnZXIpKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcud2FybihgVGhlIHRyaWdnZXIgXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIGlzIG5vIGxvbmdlciBlbmFibGVkLCBzdG9wcGluZyBleGVjdXRpb24gb2YgaXQgYXQgdHJ5OiAkeyB0cmllcyB9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBTdGFydGluZyB0byBleGVjdXRlIHRyaWdnZXI6ICR7IHRyaWdnZXIubmFtZSB9ICgkeyB0cmlnZ2VyLl9pZCB9KWApO1xuXG5cdFx0bGV0IHdvcmQ7XG5cdFx0Ly9Ob3QgYWxsIHRyaWdnZXJzL2V2ZW50cyBzdXBwb3J0IHRyaWdnZXJXb3Jkc1xuXHRcdGlmIChSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tldmVudF0udXNlLnRyaWdnZXJXb3Jkcykge1xuXHRcdFx0aWYgKHRyaWdnZXIudHJpZ2dlcldvcmRzICYmIHRyaWdnZXIudHJpZ2dlcldvcmRzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyV29yZCBvZiB0cmlnZ2VyLnRyaWdnZXJXb3Jkcykge1xuXHRcdFx0XHRcdGlmICghdHJpZ2dlci50cmlnZ2VyV29yZEFueXdoZXJlICYmIG1lc3NhZ2UubXNnLmluZGV4T2YodHJpZ2dlcldvcmQpID09PSAwKSB7XG5cdFx0XHRcdFx0XHR3b3JkID0gdHJpZ2dlcldvcmQ7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRyaWdnZXIudHJpZ2dlcldvcmRBbnl3aGVyZSAmJiBtZXNzYWdlLm1zZy5pbmNsdWRlcyh0cmlnZ2VyV29yZCkpIHtcblx0XHRcdFx0XHRcdHdvcmQgPSB0cmlnZ2VyV29yZDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFN0b3AgaWYgdGhlcmUgYXJlIHRyaWdnZXJXb3JkcyBidXQgbm9uZSBtYXRjaFxuXHRcdFx0XHRpZiAoIXdvcmQpIHtcblx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYFRoZSB0cmlnZ2VyIHdvcmQgd2hpY2ggXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIHdhcyBleHBlY3RpbmcgY291bGQgbm90IGJlIGZvdW5kLCBub3QgZXhlY3V0aW5nLmApO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChtZXNzYWdlICYmIG1lc3NhZ2UuZWRpdGVkQXQgJiYgIXRyaWdnZXIucnVuT25FZGl0cykge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGBUaGUgdHJpZ2dlciBcIiR7IHRyaWdnZXIubmFtZSB9XCIncyBydW4gb24gZWRpdHMgaXMgZGlzYWJsZWQgYW5kIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWQuYCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGlzdG9yeUlkID0gdGhpcy51cGRhdGVIaXN0b3J5KHsgc3RlcDogJ3N0YXJ0LWV4ZWN1dGUtdHJpZ2dlci11cmwnLCBpbnRlZ3JhdGlvbjogdHJpZ2dlciwgZXZlbnQgfSk7XG5cblx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0dG9rZW46IHRyaWdnZXIudG9rZW4sXG5cdFx0XHRib3Q6IGZhbHNlXG5cdFx0fTtcblxuXHRcdGlmICh3b3JkKSB7XG5cdFx0XHRkYXRhLnRyaWdnZXJfd29yZCA9IHdvcmQ7XG5cdFx0fVxuXG5cdFx0dGhpcy5tYXBFdmVudEFyZ3NUb0RhdGEoZGF0YSwgeyB0cmlnZ2VyLCBldmVudCwgbWVzc2FnZSwgcm9vbSwgb3duZXIsIHVzZXIgfSk7XG5cdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnbWFwcGVkLWFyZ3MtdG8tZGF0YScsIGRhdGEsIHRyaWdnZXJXb3JkOiB3b3JkIH0pO1xuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmluZm8oYFdpbGwgYmUgZXhlY3V0aW5nIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgdG8gdGhlIHVybDogJHsgdXJsIH1gKTtcblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoZGF0YSk7XG5cblx0XHRsZXQgb3B0cyA9IHtcblx0XHRcdHBhcmFtczoge30sXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdHVybCxcblx0XHRcdGRhdGEsXG5cdFx0XHRhdXRoOiB1bmRlZmluZWQsXG5cdFx0XHRucG1SZXF1ZXN0T3B0aW9uczoge1xuXHRcdFx0XHRyZWplY3RVbmF1dGhvcml6ZWQ6ICFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQWxsb3dfSW52YWxpZF9TZWxmU2lnbmVkX0NlcnRzJyksXG5cdFx0XHRcdHN0cmljdFNTTDogIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBbGxvd19JbnZhbGlkX1NlbGZTaWduZWRfQ2VydHMnKVxuXHRcdFx0fSxcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvNDEuMC4yMjI3LjAgU2FmYXJpLzUzNy4zNidcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKHRoaXMuaGFzU2NyaXB0QW5kTWV0aG9kKHRyaWdnZXIsICdwcmVwYXJlX291dGdvaW5nX3JlcXVlc3QnKSkge1xuXHRcdFx0b3B0cyA9IHRoaXMuZXhlY3V0ZVNjcmlwdCh0cmlnZ2VyLCAncHJlcGFyZV9vdXRnb2luZ19yZXF1ZXN0JywgeyByZXF1ZXN0OiBvcHRzIH0sIGhpc3RvcnlJZCk7XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItbWF5YmUtcmFuLXByZXBhcmUnLCByYW5QcmVwYXJlU2NyaXB0OiB0cnVlIH0pO1xuXG5cdFx0aWYgKCFvcHRzKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcmVwYXJlLW5vLW9wdHMnLCBmaW5pc2hlZDogdHJ1ZSB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAob3B0cy5tZXNzYWdlKSB7XG5cdFx0XHRjb25zdCBwcmVwYXJlTWVzc2FnZSA9IHRoaXMuc2VuZE1lc3NhZ2UoeyB0cmlnZ2VyLCByb29tLCBtZXNzYWdlOiBvcHRzLm1lc3NhZ2UsIGRhdGEgfSk7XG5cdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcmVwYXJlLXNlbmQtbWVzc2FnZScsIHByZXBhcmVTZW50TWVzc2FnZTogcHJlcGFyZU1lc3NhZ2UgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFvcHRzLnVybCB8fCAhb3B0cy5tZXRob2QpIHtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByZXBhcmUtbm8tdXJsX29yX21ldGhvZCcsIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ3ByZS1odHRwLWNhbGwnLCB1cmw6IG9wdHMudXJsLCBodHRwQ2FsbERhdGE6IG9wdHMuZGF0YSB9KTtcblx0XHRIVFRQLmNhbGwob3B0cy5tZXRob2QsIG9wdHMudXJsLCBvcHRzLCAoZXJyb3IsIHJlc3VsdCkgPT4ge1xuXHRcdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLndhcm4oYFJlc3VsdCBmb3IgdGhlIEludGVncmF0aW9uICR7IHRyaWdnZXIubmFtZSB9IHRvICR7IHVybCB9IGlzIGVtcHR5YCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuaW5mbyhgU3RhdHVzIGNvZGUgZm9yIHRoZSBJbnRlZ3JhdGlvbiAkeyB0cmlnZ2VyLm5hbWUgfSB0byAkeyB1cmwgfSBpcyAkeyByZXN1bHQuc3RhdHVzQ29kZSB9YCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLWh0dHAtY2FsbCcsIGh0dHBFcnJvcjogZXJyb3IsIGh0dHBSZXN1bHQ6IHJlc3VsdCB9KTtcblxuXHRcdFx0aWYgKHRoaXMuaGFzU2NyaXB0QW5kTWV0aG9kKHRyaWdnZXIsICdwcm9jZXNzX291dGdvaW5nX3Jlc3BvbnNlJykpIHtcblx0XHRcdFx0Y29uc3Qgc2FuZGJveCA9IHtcblx0XHRcdFx0XHRyZXF1ZXN0OiBvcHRzLFxuXHRcdFx0XHRcdHJlc3BvbnNlOiB7XG5cdFx0XHRcdFx0XHRlcnJvcixcblx0XHRcdFx0XHRcdHN0YXR1c19jb2RlOiByZXN1bHQgPyByZXN1bHQuc3RhdHVzQ29kZSA6IHVuZGVmaW5lZCwgLy9UaGVzZSB2YWx1ZXMgd2lsbCBiZSB1bmRlZmluZWQgdG8gY2xvc2UgaXNzdWVzICM0MTc1LCAjNTc2MiwgYW5kICM1ODk2XG5cdFx0XHRcdFx0XHRjb250ZW50OiByZXN1bHQgPyByZXN1bHQuZGF0YSA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdGNvbnRlbnRfcmF3OiByZXN1bHQgPyByZXN1bHQuY29udGVudCA6IHVuZGVmaW5lZCxcblx0XHRcdFx0XHRcdGhlYWRlcnM6IHJlc3VsdCA/IHJlc3VsdC5oZWFkZXJzIDoge31cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29uc3Qgc2NyaXB0UmVzdWx0ID0gdGhpcy5leGVjdXRlU2NyaXB0KHRyaWdnZXIsICdwcm9jZXNzX291dGdvaW5nX3Jlc3BvbnNlJywgc2FuZGJveCwgaGlzdG9yeUlkKTtcblxuXHRcdFx0XHRpZiAoc2NyaXB0UmVzdWx0ICYmIHNjcmlwdFJlc3VsdC5jb250ZW50KSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0TWVzc2FnZSA9IHRoaXMuc2VuZE1lc3NhZ2UoeyB0cmlnZ2VyLCByb29tLCBtZXNzYWdlOiBzY3JpcHRSZXN1bHQuY29udGVudCwgZGF0YSB9KTtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcm9jZXNzLXNlbmQtbWVzc2FnZScsIHByb2Nlc3NTZW50TWVzc2FnZTogcmVzdWx0TWVzc2FnZSwgZmluaXNoZWQ6IHRydWUgfSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHNjcmlwdFJlc3VsdCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcm9jZXNzLWZhbHNlLXJlc3VsdCcsIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBpZiB0aGUgcmVzdWx0IGNvbnRhaW5lZCBub3RoaW5nIG9yIHdhc24ndCBhIHN1Y2Nlc3NmdWwgc3RhdHVzQ29kZVxuXHRcdFx0aWYgKCFyZXN1bHQgfHwgIXRoaXMuc3VjY2Vzc1Jlc3VsdHMuaW5jbHVkZXMocmVzdWx0LnN0YXR1c0NvZGUpKSB7XG5cdFx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgZm9yIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgdG8gJHsgdXJsIH0gaXM6YCk7XG5cdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGVycm9yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyZXN1bHQpIHtcblx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYEVycm9yIGZvciB0aGUgSW50ZWdyYXRpb24gXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIHRvICR7IHVybCB9IGlzOmApO1xuXHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihyZXN1bHQpO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3VsdC5zdGF0dXNDb2RlID09PSA0MTApIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByb2Nlc3MtaHR0cC1zdGF0dXMtNDEwJywgZXJyb3I6IHRydWUgfSk7XG5cdFx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoYERpc2FibGluZyB0aGUgSW50ZWdyYXRpb24gXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIGJlY2F1c2UgdGhlIHN0YXR1cyBjb2RlIHdhcyA0MDEgKEdvbmUpLmApO1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnVwZGF0ZSh7IF9pZDogdHJpZ2dlci5faWQgfSwgeyAkc2V0OiB7IGVuYWJsZWQ6IGZhbHNlIH19KTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0LnN0YXR1c0NvZGUgPT09IDUwMCkge1xuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItcHJvY2Vzcy1odHRwLXN0YXR1cy01MDAnLCBlcnJvcjogdHJ1ZSB9KTtcblx0XHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgXCI1MDBcIiBmb3IgdGhlIEludGVncmF0aW9uIFwiJHsgdHJpZ2dlci5uYW1lIH1cIiB0byAkeyB1cmwgfS5gKTtcblx0XHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihyZXN1bHQuY29udGVudCk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRyaWdnZXIucmV0cnlGYWlsZWRDYWxscykge1xuXHRcdFx0XHRcdGlmICh0cmllcyA8IHRyaWdnZXIucmV0cnlDb3VudCAmJiB0cmlnZ2VyLnJldHJ5RGVsYXkpIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgZXJyb3I6IHRydWUsIHN0ZXA6IGBnb2luZy10by1yZXRyeS0keyB0cmllcyArIDEgfWAgfSk7XG5cblx0XHRcdFx0XHRcdGxldCB3YWl0VGltZTtcblxuXHRcdFx0XHRcdFx0c3dpdGNoICh0cmlnZ2VyLnJldHJ5RGVsYXkpIHtcblx0XHRcdFx0XHRcdFx0Y2FzZSAncG93ZXJzLW9mLXRlbic6XG5cdFx0XHRcdFx0XHRcdFx0Ly8gVHJ5IGFnYWluIGluIDAuMXMsIDFzLCAxMHMsIDFtNDBzLCAxNm00MHMsIDJoNDZtNDBzLCAyN2g0Nm00MHMsIGV0Y1xuXHRcdFx0XHRcdFx0XHRcdHdhaXRUaW1lID0gTWF0aC5wb3coMTAsIHRyaWVzICsgMik7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ3Bvd2Vycy1vZi10d28nOlxuXHRcdFx0XHRcdFx0XHRcdC8vIDIgc2Vjb25kcywgNCBzZWNvbmRzLCA4IHNlY29uZHNcblx0XHRcdFx0XHRcdFx0XHR3YWl0VGltZSA9IE1hdGgucG93KDIsIHRyaWVzICsgMSkgKiAxMDAwO1xuXHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRjYXNlICdpbmNyZW1lbnRzLW9mLXR3byc6XG5cdFx0XHRcdFx0XHRcdFx0Ly8gMiBzZWNvbmQsIDQgc2Vjb25kcywgNiBzZWNvbmRzLCBldGNcblx0XHRcdFx0XHRcdFx0XHR3YWl0VGltZSA9ICh0cmllcyArIDEpICogMiAqIDEwMDA7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgZXIgPSBuZXcgRXJyb3IoJ1RoZSBpbnRlZ3JhdGlvblxcJ3MgcmV0cnlEZWxheSBzZXR0aW5nIGlzIGludmFsaWQuJyk7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnZmFpbGVkLWFuZC1yZXRyeS1kZWxheS1pcy1pbnZhbGlkJywgZXJyb3I6IHRydWUsIGVycm9yU3RhY2s6IGVyLnN0YWNrIH0pO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmluZm8oYFRyeWluZyB0aGUgSW50ZWdyYXRpb24gJHsgdHJpZ2dlci5uYW1lIH0gdG8gJHsgdXJsIH0gYWdhaW4gaW4gJHsgd2FpdFRpbWUgfSBtaWxsaXNlY29uZHMuYCk7XG5cdFx0XHRcdFx0XHRNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZXhlY3V0ZVRyaWdnZXJVcmwodXJsLCB0cmlnZ2VyLCB7IGV2ZW50LCBtZXNzYWdlLCByb29tLCBvd25lciwgdXNlciB9LCBoaXN0b3J5SWQsIHRyaWVzICsgMSk7XG5cdFx0XHRcdFx0XHR9LCB3YWl0VGltZSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ3Rvby1tYW55LXJldHJpZXMnLCBlcnJvcjogdHJ1ZSB9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnZmFpbGVkLWFuZC1ub3QtY29uZmlndXJlZC10by1yZXRyeScsIGVycm9yOiB0cnVlIH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3Byb2Nlc3Mgb3V0Z29pbmcgd2ViaG9vayByZXNwb25zZSBhcyBhIG5ldyBtZXNzYWdlXG5cdFx0XHRpZiAocmVzdWx0ICYmIHRoaXMuc3VjY2Vzc1Jlc3VsdHMuaW5jbHVkZXMocmVzdWx0LnN0YXR1c0NvZGUpKSB7XG5cdFx0XHRcdGlmIChyZXN1bHQgJiYgcmVzdWx0LmRhdGEgJiYgKHJlc3VsdC5kYXRhLnRleHQgfHwgcmVzdWx0LmRhdGEuYXR0YWNobWVudHMpKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0TXNnID0gdGhpcy5zZW5kTWVzc2FnZSh7IHRyaWdnZXIsIHJvb20sIG1lc3NhZ2U6IHJlc3VsdC5kYXRhLCBkYXRhIH0pO1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ3VybC1yZXNwb25zZS1zZW50LW1lc3NhZ2UnLCByZXN1bHRNZXNzYWdlOiByZXN1bHRNc2csIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXBsYXkoaW50ZWdyYXRpb24sIGhpc3RvcnkpIHtcblx0XHRpZiAoIWludGVncmF0aW9uIHx8IGludGVncmF0aW9uLnR5cGUgIT09ICd3ZWJob29rLW91dGdvaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW50ZWdyYXRpb24tdHlwZS1tdXN0LWJlLW91dGdvaW5nJywgJ1RoZSBpbnRlZ3JhdGlvbiB0eXBlIHRvIHJlcGxheSBtdXN0IGJlIGFuIG91dGdvaW5nIHdlYmhvb2suJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFoaXN0b3J5IHx8ICFoaXN0b3J5LmRhdGEpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2hpc3RvcnktZGF0YS1tdXN0LWJlLWRlZmluZWQnLCAnVGhlIGhpc3RvcnkgZGF0YSBtdXN0IGJlIGRlZmluZWQgdG8gcmVwbGF5IGFuIGludGVncmF0aW9uLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGV2ZW50ID0gaGlzdG9yeS5ldmVudDtcblx0XHRjb25zdCBtZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQoaGlzdG9yeS5kYXRhLm1lc3NhZ2VfaWQpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChoaXN0b3J5LmRhdGEuY2hhbm5lbF9pZCk7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKGhpc3RvcnkuZGF0YS51c2VyX2lkKTtcblx0XHRsZXQgb3duZXI7XG5cblx0XHRpZiAoaGlzdG9yeS5kYXRhLm93bmVyICYmIGhpc3RvcnkuZGF0YS5vd25lci5faWQpIHtcblx0XHRcdG93bmVyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoaGlzdG9yeS5kYXRhLm93bmVyLl9pZCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5leGVjdXRlVHJpZ2dlclVybChoaXN0b3J5LnVybCwgaW50ZWdyYXRpb24sIHsgZXZlbnQsIG1lc3NhZ2UsIHJvb20sIG93bmVyLCB1c2VyIH0pO1xuXHR9XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zID0gbmV3IGNsYXNzIEludGVncmF0aW9ucyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2ludGVncmF0aW9ucycpO1xuXHR9XG5cblx0ZmluZEJ5VHlwZSh0eXBlLCBvcHRpb25zKSB7XG5cdFx0aWYgKHR5cGUgIT09ICd3ZWJob29rLWluY29taW5nJyAmJiB0eXBlICE9PSAnd2ViaG9vay1vdXRnb2luZycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdHlwZS10by1maW5kJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IHR5cGUgfSwgb3B0aW9ucyk7XG5cdH1cblxuXHRkaXNhYmxlQnlVc2VySWQodXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHsgdXNlcklkIH0sIHsgJHNldDogeyBlbmFibGVkOiBmYWxzZSB9fSwgeyBtdWx0aTogdHJ1ZSB9KTtcblx0fVxufTtcbiIsIlJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeSA9IG5ldyBjbGFzcyBJbnRlZ3JhdGlvbkhpc3RvcnkgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdpbnRlZ3JhdGlvbl9oaXN0b3J5Jyk7XG5cdH1cblxuXHRmaW5kQnlUeXBlKHR5cGUsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSAhPT0gJ291dGdvaW5nLXdlYmhvb2snIHx8IHR5cGUgIT09ICdpbmNvbWluZy13ZWJob29rJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1pbnRlZ3JhdGlvbi10eXBlJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IHR5cGUgfSwgb3B0aW9ucyk7XG5cdH1cblxuXHRmaW5kQnlJbnRlZ3JhdGlvbklkKGlkLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7ICdpbnRlZ3JhdGlvbi5faWQnOiBpZCB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRCeUludGVncmF0aW9uSWRBbmRDcmVhdGVkQnkoaWQsIGNyZWF0b3JJZCwgb3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyAnaW50ZWdyYXRpb24uX2lkJzogaWQsICdpbnRlZ3JhdGlvbi5fY3JlYXRlZEJ5Ll9pZCc6IGNyZWF0b3JJZCB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRPbmVCeUludGVncmF0aW9uSWRBbmRIaXN0b3J5SWQoaW50ZWdyYXRpb25JZCwgaGlzdG9yeUlkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZSh7ICdpbnRlZ3JhdGlvbi5faWQnOiBpbnRlZ3JhdGlvbklkLCBfaWQ6IGhpc3RvcnlJZCB9KTtcblx0fVxuXG5cdGZpbmRCeUV2ZW50TmFtZShldmVudCwgb3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyBldmVudCB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRGYWlsZWQob3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyBlcnJvcjogdHJ1ZSB9LCBvcHRpb25zKTtcblx0fVxuXG5cdHJlbW92ZUJ5SW50ZWdyYXRpb25JZChpbnRlZ3JhdGlvbklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHsgJ2ludGVncmF0aW9uLl9pZCc6IGludGVncmF0aW9uSWQgfSk7XG5cdH1cbn07XG4iLCJNZXRlb3IucHVibGlzaCgnaW50ZWdyYXRpb25zJywgZnVuY3Rpb24gX2ludGVncmF0aW9uUHVibGljYXRpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZCgpO1xuXHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmQoeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9KTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdpbnRlZ3JhdGlvbkhpc3RvcnknLCBmdW5jdGlvbiBfaW50ZWdyYXRpb25IaXN0b3J5UHVibGljYXRpb24oaW50ZWdyYXRpb25JZCwgbGltaXQgPSAyNSkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5LmZpbmRCeUludGVncmF0aW9uSWQoaW50ZWdyYXRpb25JZCwgeyBzb3J0OiB7IF91cGRhdGVkQXQ6IC0xIH0sIGxpbWl0IH0pO1xuXHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5LmZpbmRCeUludGVncmF0aW9uSWRBbmRDcmVhdGVkQnkoaW50ZWdyYXRpb25JZCwgdGhpcy51c2VySWQsIHsgc29ydDogeyBfdXBkYXRlZEF0OiAtMSB9LCBsaW1pdCB9KTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbCBCYWJlbCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5jb25zdCB2YWxpZENoYW5uZWxDaGFycyA9IFsnQCcsICcjJ107XG5cbk1ldGVvci5tZXRob2RzKHtcblx0YWRkSW5jb21pbmdJbnRlZ3JhdGlvbihpbnRlZ3JhdGlvbikge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2FkZEluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc1N0cmluZyhpbnRlZ3JhdGlvbi5jaGFubmVsKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgY2hhbm5lbCcsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGludGVncmF0aW9uLmNoYW5uZWwudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgY2hhbm5lbCcsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2hhbm5lbHMgPSBfLm1hcChpbnRlZ3JhdGlvbi5jaGFubmVsLnNwbGl0KCcsJyksIChjaGFubmVsKSA9PiBzLnRyaW0oY2hhbm5lbCkpO1xuXG5cdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRpZiAoIXZhbGlkQ2hhbm5lbENoYXJzLmluY2x1ZGVzKGNoYW5uZWxbMF0pKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbC1zdGFydC13aXRoLWNoYXJzJywgJ0ludmFsaWQgY2hhbm5lbC4gU3RhcnQgd2l0aCBAIG9yICMnLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICghXy5pc1N0cmluZyhpbnRlZ3JhdGlvbi51c2VybmFtZSkgfHwgaW50ZWdyYXRpb24udXNlcm5hbWUudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VybmFtZScsICdJbnZhbGlkIHVzZXJuYW1lJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCA9PT0gdHJ1ZSAmJiBpbnRlZ3JhdGlvbi5zY3JpcHQgJiYgaW50ZWdyYXRpb24uc2NyaXB0LnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxldCBiYWJlbE9wdGlvbnMgPSBCYWJlbC5nZXREZWZhdWx0T3B0aW9ucyh7IHJ1bnRpbWU6IGZhbHNlIH0pO1xuXHRcdFx0XHRiYWJlbE9wdGlvbnMgPSBfLmV4dGVuZChiYWJlbE9wdGlvbnMsIHsgY29tcGFjdDogdHJ1ZSwgbWluaWZpZWQ6IHRydWUsIGNvbW1lbnRzOiBmYWxzZSB9KTtcblxuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IEJhYmVsLmNvbXBpbGUoaW50ZWdyYXRpb24uc2NyaXB0LCBiYWJlbE9wdGlvbnMpLmNvZGU7XG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gdW5kZWZpbmVkO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0RXJyb3IgPSBfLnBpY2soZSwgJ25hbWUnLCAnbWVzc2FnZScsICdzdGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAobGV0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRcdGxldCByZWNvcmQ7XG5cdFx0XHRjb25zdCBjaGFubmVsVHlwZSA9IGNoYW5uZWxbMF07XG5cdFx0XHRjaGFubmVsID0gY2hhbm5lbC5zdWJzdHIoMSk7XG5cblx0XHRcdHN3aXRjaCAoY2hhbm5lbFR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnIyc6XG5cdFx0XHRcdFx0cmVjb3JkID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHRcdFx0XHQkb3I6IFtcblx0XHRcdFx0XHRcdFx0e19pZDogY2hhbm5lbH0sXG5cdFx0XHRcdFx0XHRcdHtuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdAJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e3VzZXJuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXJlY29yZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc0FsbFBlcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgJiYgIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJlY29yZC5faWQsIHRoaXMudXNlcklkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwnLCAnSW52YWxpZCBDaGFubmVsJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7dXNlcm5hbWU6IGludGVncmF0aW9uLnVzZXJuYW1lfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2FkZEluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRva2VuID0gUmFuZG9tLmlkKDQ4KTtcblxuXHRcdGludGVncmF0aW9uLnR5cGUgPSAnd2ViaG9vay1pbmNvbWluZyc7XG5cdFx0aW50ZWdyYXRpb24udG9rZW4gPSB0b2tlbjtcblx0XHRpbnRlZ3JhdGlvbi5jaGFubmVsID0gY2hhbm5lbHM7XG5cdFx0aW50ZWdyYXRpb24udXNlcklkID0gdXNlci5faWQ7XG5cdFx0aW50ZWdyYXRpb24uX2NyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cdFx0aW50ZWdyYXRpb24uX2NyZWF0ZWRCeSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQsIHtmaWVsZHM6IHt1c2VybmFtZTogMX19KTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmFkZFVzZXJSb2xlcyh1c2VyLl9pZCwgJ2JvdCcpO1xuXG5cdFx0aW50ZWdyYXRpb24uX2lkID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmluc2VydChpbnRlZ3JhdGlvbik7XG5cblx0XHRyZXR1cm4gaW50ZWdyYXRpb247XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFsIEJhYmVsICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmNvbnN0IHZhbGlkQ2hhbm5lbENoYXJzID0gWydAJywgJyMnXTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHR1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uKGludGVncmF0aW9uSWQsIGludGVncmF0aW9uKSB7XG5cdFx0aWYgKCFfLmlzU3RyaW5nKGludGVncmF0aW9uLmNoYW5uZWwpIHx8IGludGVncmF0aW9uLmNoYW5uZWwudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgY2hhbm5lbCcsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY2hhbm5lbHMgPSBfLm1hcChpbnRlZ3JhdGlvbi5jaGFubmVsLnNwbGl0KCcsJyksIChjaGFubmVsKSA9PiBzLnRyaW0oY2hhbm5lbCkpO1xuXG5cdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRpZiAoIXZhbGlkQ2hhbm5lbENoYXJzLmluY2x1ZGVzKGNoYW5uZWxbMF0pKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbC1zdGFydC13aXRoLWNoYXJzJywgJ0ludmFsaWQgY2hhbm5lbC4gU3RhcnQgd2l0aCBAIG9yICMnLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBjdXJyZW50SW50ZWdyYXRpb247XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRjdXJyZW50SW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykpIHtcblx0XHRcdGN1cnJlbnRJbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKHsgX2lkOiBpbnRlZ3JhdGlvbklkLCAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnLCAnVW5hdXRob3JpemVkJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoIWN1cnJlbnRJbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCA9PT0gdHJ1ZSAmJiBpbnRlZ3JhdGlvbi5zY3JpcHQgJiYgaW50ZWdyYXRpb24uc2NyaXB0LnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxldCBiYWJlbE9wdGlvbnMgPSBCYWJlbC5nZXREZWZhdWx0T3B0aW9ucyh7IHJ1bnRpbWU6IGZhbHNlIH0pO1xuXHRcdFx0XHRiYWJlbE9wdGlvbnMgPSBfLmV4dGVuZChiYWJlbE9wdGlvbnMsIHsgY29tcGFjdDogdHJ1ZSwgbWluaWZpZWQ6IHRydWUsIGNvbW1lbnRzOiBmYWxzZSB9KTtcblxuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IEJhYmVsLmNvbXBpbGUoaW50ZWdyYXRpb24uc2NyaXB0LCBiYWJlbE9wdGlvbnMpLmNvZGU7XG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gdW5kZWZpbmVkO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0RXJyb3IgPSBfLnBpY2soZSwgJ25hbWUnLCAnbWVzc2FnZScsICdzdGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAobGV0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRcdGNvbnN0IGNoYW5uZWxUeXBlID0gY2hhbm5lbFswXTtcblx0XHRcdGNoYW5uZWwgPSBjaGFubmVsLnN1YnN0cigxKTtcblx0XHRcdGxldCByZWNvcmQ7XG5cblx0XHRcdHN3aXRjaCAoY2hhbm5lbFR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnIyc6XG5cdFx0XHRcdFx0cmVjb3JkID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHRcdFx0XHQkb3I6IFtcblx0XHRcdFx0XHRcdFx0e19pZDogY2hhbm5lbH0sXG5cdFx0XHRcdFx0XHRcdHtuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdAJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e3VzZXJuYW1lOiBjaGFubmVsfVxuXHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXJlY29yZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc0FsbFBlcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgJiYgIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJlY29yZC5faWQsIHRoaXMudXNlcklkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwnLCAnSW52YWxpZCBDaGFubmVsJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7IHVzZXJuYW1lOiBjdXJyZW50SW50ZWdyYXRpb24udXNlcm5hbWUgfSk7XG5cblx0XHRpZiAoIXVzZXIgfHwgIXVzZXIuX2lkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBvc3QtYXMtdXNlcicsICdJbnZhbGlkIFBvc3QgQXMgVXNlcicsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnYm90Jyk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMudXBkYXRlKGludGVncmF0aW9uSWQsIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0ZW5hYmxlZDogaW50ZWdyYXRpb24uZW5hYmxlZCxcblx0XHRcdFx0bmFtZTogaW50ZWdyYXRpb24ubmFtZSxcblx0XHRcdFx0YXZhdGFyOiBpbnRlZ3JhdGlvbi5hdmF0YXIsXG5cdFx0XHRcdGVtb2ppOiBpbnRlZ3JhdGlvbi5lbW9qaSxcblx0XHRcdFx0YWxpYXM6IGludGVncmF0aW9uLmFsaWFzLFxuXHRcdFx0XHRjaGFubmVsOiBjaGFubmVscyxcblx0XHRcdFx0c2NyaXB0OiBpbnRlZ3JhdGlvbi5zY3JpcHQsXG5cdFx0XHRcdHNjcmlwdEVuYWJsZWQ6IGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQsXG5cdFx0XHRcdHNjcmlwdENvbXBpbGVkOiBpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCxcblx0XHRcdFx0c2NyaXB0RXJyb3I6IGludGVncmF0aW9uLnNjcmlwdEVycm9yLFxuXHRcdFx0XHRfdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRfdXBkYXRlZEJ5OiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSlcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGRlbGV0ZUluY29taW5nSW50ZWdyYXRpb24oaW50ZWdyYXRpb25JZCkge1xuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQsIHsgZmllbGRzIDogeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnZGVsZXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICdkZWxldGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMucmVtb3ZlKHsgX2lkOiBpbnRlZ3JhdGlvbklkIH0pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRhZGRPdXRnb2luZ0ludGVncmF0aW9uKGludGVncmF0aW9uKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJylcblx0XHRcdCYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpXG5cdFx0XHQmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycsICdib3QnKVxuXHRcdFx0JiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudmFsaWRhdGVPdXRnb2luZyhpbnRlZ3JhdGlvbiwgdGhpcy51c2VySWQpO1xuXG5cdFx0aW50ZWdyYXRpb24uX2NyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cdFx0aW50ZWdyYXRpb24uX2NyZWF0ZWRCeSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQsIHtmaWVsZHM6IHt1c2VybmFtZTogMX19KTtcblx0XHRpbnRlZ3JhdGlvbi5faWQgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuaW5zZXJ0KGludGVncmF0aW9uKTtcblxuXHRcdHJldHVybiBpbnRlZ3JhdGlvbjtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdHVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24oaW50ZWdyYXRpb25JZCwgaW50ZWdyYXRpb24pIHtcblx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQuaW50ZWdyYXRpb25zLnZhbGlkYXRlT3V0Z29pbmcoaW50ZWdyYXRpb24sIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghaW50ZWdyYXRpb24udG9rZW4gfHwgaW50ZWdyYXRpb24udG9rZW4udHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC10b2tlbicsICdJbnZhbGlkIHRva2VuJywgeyBtZXRob2Q6ICd1cGRhdGVPdXRnb2luZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRsZXQgY3VycmVudEludGVncmF0aW9uO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0Y3VycmVudEludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRjdXJyZW50SW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogaW50ZWdyYXRpb25JZCwgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAndXBkYXRlT3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFjdXJyZW50SW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWRfaW50ZWdyYXRpb24nLCAnW21ldGhvZHNdIHVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24gLT4gaW50ZWdyYXRpb24gbm90IGZvdW5kJyk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnVwZGF0ZShpbnRlZ3JhdGlvbklkLCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGV2ZW50OiBpbnRlZ3JhdGlvbi5ldmVudCxcblx0XHRcdFx0ZW5hYmxlZDogaW50ZWdyYXRpb24uZW5hYmxlZCxcblx0XHRcdFx0bmFtZTogaW50ZWdyYXRpb24ubmFtZSxcblx0XHRcdFx0YXZhdGFyOiBpbnRlZ3JhdGlvbi5hdmF0YXIsXG5cdFx0XHRcdGVtb2ppOiBpbnRlZ3JhdGlvbi5lbW9qaSxcblx0XHRcdFx0YWxpYXM6IGludGVncmF0aW9uLmFsaWFzLFxuXHRcdFx0XHRjaGFubmVsOiBpbnRlZ3JhdGlvbi5jaGFubmVsLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBpbnRlZ3JhdGlvbi50YXJnZXRSb29tLFxuXHRcdFx0XHRpbXBlcnNvbmF0ZVVzZXI6IGludGVncmF0aW9uLmltcGVyc29uYXRlVXNlcixcblx0XHRcdFx0dXNlcm5hbWU6IGludGVncmF0aW9uLnVzZXJuYW1lLFxuXHRcdFx0XHR1c2VySWQ6IGludGVncmF0aW9uLnVzZXJJZCxcblx0XHRcdFx0dXJsczogaW50ZWdyYXRpb24udXJscyxcblx0XHRcdFx0dG9rZW46IGludGVncmF0aW9uLnRva2VuLFxuXHRcdFx0XHRzY3JpcHQ6IGludGVncmF0aW9uLnNjcmlwdCxcblx0XHRcdFx0c2NyaXB0RW5hYmxlZDogaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCxcblx0XHRcdFx0c2NyaXB0Q29tcGlsZWQ6IGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkLFxuXHRcdFx0XHRzY3JpcHRFcnJvcjogaW50ZWdyYXRpb24uc2NyaXB0RXJyb3IsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzLFxuXHRcdFx0XHRyZXRyeUZhaWxlZENhbGxzOiBpbnRlZ3JhdGlvbi5yZXRyeUZhaWxlZENhbGxzLFxuXHRcdFx0XHRyZXRyeUNvdW50OiBpbnRlZ3JhdGlvbi5yZXRyeUNvdW50LFxuXHRcdFx0XHRyZXRyeURlbGF5OiBpbnRlZ3JhdGlvbi5yZXRyeURlbGF5LFxuXHRcdFx0XHR0cmlnZ2VyV29yZEFueXdoZXJlOiBpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZEFueXdoZXJlLFxuXHRcdFx0XHRydW5PbkVkaXRzOiBpbnRlZ3JhdGlvbi5ydW5PbkVkaXRzLFxuXHRcdFx0XHRfdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRfdXBkYXRlZEJ5OiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSlcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdHJlcGxheU91dGdvaW5nSW50ZWdyYXRpb24oeyBpbnRlZ3JhdGlvbklkLCBoaXN0b3J5SWQgfSkge1xuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykgfHwgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgfHwgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnLCAnYm90JykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCwgeyBmaWVsZHM6IHsgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfX0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24nLCAnSW52YWxpZCBpbnRlZ3JhdGlvbicsIHsgbWV0aG9kOiAncmVwbGF5T3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGlzdG9yeSA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5maW5kT25lQnlJbnRlZ3JhdGlvbklkQW5kSGlzdG9yeUlkKGludGVncmF0aW9uLl9pZCwgaGlzdG9yeUlkKTtcblxuXHRcdGlmICghaGlzdG9yeSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbi1oaXN0b3J5JywgJ0ludmFsaWQgSW50ZWdyYXRpb24gSGlzdG9yeScsIHsgbWV0aG9kOiAncmVwbGF5T3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudHJpZ2dlckhhbmRsZXIucmVwbGF5KGludGVncmF0aW9uLCBoaXN0b3J5KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0ZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbihpbnRlZ3JhdGlvbklkKSB7XG5cdFx0bGV0IGludGVncmF0aW9uO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSB8fCBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSB8fCBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkLCB7IGZpZWxkczogeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMucmVtb3ZlKHsgX2lkOiBpbnRlZ3JhdGlvbklkIH0pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5yZW1vdmVCeUludGVncmF0aW9uSWQoaW50ZWdyYXRpb25JZCk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGNsZWFySW50ZWdyYXRpb25IaXN0b3J5KGludGVncmF0aW9uSWQpIHtcblx0XHRsZXQgaW50ZWdyYXRpb247XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnLCAnYm90JykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQsIHsgZmllbGRzOiB7ICdfY3JlYXRlZEJ5Ll9pZCc6IHRoaXMudXNlcklkIH19KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnLCAnVW5hdXRob3JpemVkJywgeyBtZXRob2Q6ICdjbGVhckludGVncmF0aW9uSGlzdG9yeScgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICdjbGVhckludGVncmF0aW9uSGlzdG9yeScgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5LnJlbW92ZUJ5SW50ZWdyYXRpb25JZChpbnRlZ3JhdGlvbklkKTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgTWV0ZW9yIFJlc3RpdnVzIGxvZ2dlciBwcm9jZXNzV2ViaG9va01lc3NhZ2UqL1xuLy8gVE9ETzogcmVtb3ZlIGdsb2JhbHNcblxuaW1wb3J0IEZpYmVyIGZyb20gJ2ZpYmVycyc7XG5pbXBvcnQgRnV0dXJlIGZyb20gJ2ZpYmVycy9mdXR1cmUnO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgdm0gZnJvbSAndm0nO1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuXG5jb25zdCBBcGkgPSBuZXcgUmVzdGl2dXMoe1xuXHRlbmFibGVDb3JzOiB0cnVlLFxuXHRhcGlQYXRoOiAnaG9va3MvJyxcblx0YXV0aDoge1xuXHRcdHVzZXIoKSB7XG5cdFx0XHRjb25zdCBwYXlsb2FkS2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRjb25zdCBwYXlsb2FkSXNXcmFwcGVkID0gKHRoaXMuYm9keVBhcmFtcyAmJiB0aGlzLmJvZHlQYXJhbXMucGF5bG9hZCkgJiYgcGF5bG9hZEtleXMubGVuZ3RoID09PSAxO1xuXHRcdFx0aWYgKHBheWxvYWRJc1dyYXBwZWQgJiYgdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddID09PSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJykge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHRoaXMuYm9keVBhcmFtcyA9IEpTT04ucGFyc2UodGhpcy5ib2R5UGFyYW1zLnBheWxvYWQpO1xuXHRcdFx0XHR9IGNhdGNoICh7bWVzc2FnZX0pIHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZXJyb3I6IHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwLFxuXHRcdFx0XHRcdFx0XHRib2R5OiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6IG1lc3NhZ2Vcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5pbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKHtcblx0XHRcdFx0X2lkOiB0aGlzLnJlcXVlc3QucGFyYW1zLmludGVncmF0aW9uSWQsXG5cdFx0XHRcdHRva2VuOiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5yZXF1ZXN0LnBhcmFtcy50b2tlbilcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoIXRoaXMuaW50ZWdyYXRpb24pIHtcblx0XHRcdFx0bG9nZ2VyLmluY29taW5nLmluZm8oJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQnLCB0aGlzLnJlcXVlc3QucGFyYW1zLmludGVncmF0aW9uSWQsICdvciB0b2tlbicsIHRoaXMucmVxdWVzdC5wYXJhbXMudG9rZW4pO1xuXG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0ZXJyb3I6IHtcblx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdFx0XHRcdGJvZHk6IHtcblx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdGVycm9yOiAnSW52YWxpZCBpbnRlZ3JhdGlvbiBpZCBvciB0b2tlbiBwcm92aWRlZC4nXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0XHRcdF9pZDogdGhpcy5pbnRlZ3JhdGlvbi51c2VySWRcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4geyB1c2VyIH07XG5cdFx0fVxuXHR9XG59KTtcblxuY29uc3QgY29tcGlsZWRTY3JpcHRzID0ge307XG5mdW5jdGlvbiBidWlsZFNhbmRib3goc3RvcmUgPSB7fSkge1xuXHRjb25zdCBzYW5kYm94ID0ge1xuXHRcdHNjcmlwdFRpbWVvdXQocmVqZWN0KSB7XG5cdFx0XHRyZXR1cm4gc2V0VGltZW91dCgoKSA9PiByZWplY3QoJ3RpbWVkIG91dCcpLCAzMDAwKTtcblx0XHR9LFxuXHRcdF8sXG5cdFx0cyxcblx0XHRjb25zb2xlLFxuXHRcdG1vbWVudCxcblx0XHRGaWJlcixcblx0XHRQcm9taXNlLFxuXHRcdExpdmVjaGF0OiBSb2NrZXRDaGF0LkxpdmVjaGF0LFxuXHRcdFN0b3JlOiB7XG5cdFx0XHRzZXQoa2V5LCB2YWwpIHtcblx0XHRcdFx0cmV0dXJuIHN0b3JlW2tleV0gPSB2YWw7XG5cdFx0XHR9LFxuXHRcdFx0Z2V0KGtleSkge1xuXHRcdFx0XHRyZXR1cm4gc3RvcmVba2V5XTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdEhUVFAobWV0aG9kLCB1cmwsIG9wdGlvbnMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0cmVzdWx0OiBIVFRQLmNhbGwobWV0aG9kLCB1cmwsIG9wdGlvbnMpXG5cdFx0XHRcdH07XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGVycm9yXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdE9iamVjdC5rZXlzKFJvY2tldENoYXQubW9kZWxzKS5maWx0ZXIoKGspID0+ICFrLnN0YXJ0c1dpdGgoJ18nKSkuZm9yRWFjaCgoaykgPT4gc2FuZGJveFtrXSA9IFJvY2tldENoYXQubW9kZWxzW2tdKTtcblx0cmV0dXJuIHsgc3RvcmUsIHNhbmRib3hcdH07XG59XG5cbmZ1bmN0aW9uIGdldEludGVncmF0aW9uU2NyaXB0KGludGVncmF0aW9uKSB7XG5cdGNvbnN0IGNvbXBpbGVkU2NyaXB0ID0gY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF07XG5cdGlmIChjb21waWxlZFNjcmlwdCAmJiArY29tcGlsZWRTY3JpcHQuX3VwZGF0ZWRBdCA9PT0gK2ludGVncmF0aW9uLl91cGRhdGVkQXQpIHtcblx0XHRyZXR1cm4gY29tcGlsZWRTY3JpcHQuc2NyaXB0O1xuXHR9XG5cblx0Y29uc3Qgc2NyaXB0ID0gaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQ7XG5cdGNvbnN0IHsgc2FuZGJveCwgc3RvcmUgfSA9IGJ1aWxkU2FuZGJveCgpO1xuXHR0cnkge1xuXHRcdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdXaWxsIGV2YWx1YXRlIHNjcmlwdCBvZiBUcmlnZ2VyJywgaW50ZWdyYXRpb24ubmFtZSk7XG5cdFx0bG9nZ2VyLmluY29taW5nLmRlYnVnKHNjcmlwdCk7XG5cblx0XHRjb25zdCB2bVNjcmlwdCA9IHZtLmNyZWF0ZVNjcmlwdChzY3JpcHQsICdzY3JpcHQuanMnKTtcblx0XHR2bVNjcmlwdC5ydW5Jbk5ld0NvbnRleHQoc2FuZGJveCk7XG5cdFx0aWYgKHNhbmRib3guU2NyaXB0KSB7XG5cdFx0XHRjb21waWxlZFNjcmlwdHNbaW50ZWdyYXRpb24uX2lkXSA9IHtcblx0XHRcdFx0c2NyaXB0OiBuZXcgc2FuZGJveC5TY3JpcHQoKSxcblx0XHRcdFx0c3RvcmUsXG5cdFx0XHRcdF91cGRhdGVkQXQ6IGludGVncmF0aW9uLl91cGRhdGVkQXRcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiBjb21waWxlZFNjcmlwdHNbaW50ZWdyYXRpb24uX2lkXS5zY3JpcHQ7XG5cdFx0fVxuXHR9IGNhdGNoICh7IHN0YWNrIH0pIHtcblx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3IoJ1tFcnJvciBldmFsdWF0aW5nIFNjcmlwdCBpbiBUcmlnZ2VyJywgaW50ZWdyYXRpb24ubmFtZSwgJzpdJyk7XG5cdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHNjcmlwdC5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKCdbU3RhY2s6XScpO1xuXHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcihzdGFjay5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0dGhyb3cgUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnZXJyb3ItZXZhbHVhdGluZy1zY3JpcHQnKTtcblx0fVxuXG5cdGlmICghc2FuZGJveC5TY3JpcHQpIHtcblx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3IoJ1tDbGFzcyBcIlNjcmlwdFwiIG5vdCBpbiBUcmlnZ2VyJywgaW50ZWdyYXRpb24ubmFtZSwgJ10nKTtcblx0XHR0aHJvdyBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdjbGFzcy1zY3JpcHQtbm90LWZvdW5kJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlSW50ZWdyYXRpb24ob3B0aW9ucywgdXNlcikge1xuXHRsb2dnZXIuaW5jb21pbmcuaW5mbygnQWRkIGludGVncmF0aW9uJywgb3B0aW9ucy5uYW1lKTtcblx0bG9nZ2VyLmluY29taW5nLmRlYnVnKG9wdGlvbnMpO1xuXG5cdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsIGZ1bmN0aW9uKCkge1xuXHRcdHN3aXRjaCAob3B0aW9uc1snZXZlbnQnXSkge1xuXHRcdFx0Y2FzZSAnbmV3TWVzc2FnZU9uQ2hhbm5lbCc6XG5cdFx0XHRcdGlmIChvcHRpb25zLmRhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdG9wdGlvbnMuZGF0YSA9IHt9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgob3B0aW9ucy5kYXRhLmNoYW5uZWxfbmFtZSAhPSBudWxsKSAmJiBvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lLmluZGV4T2YoJyMnKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lID0gYCMkeyBvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lIH1gO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBNZXRlb3IuY2FsbCgnYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbicsIHtcblx0XHRcdFx0XHR1c2VybmFtZTogJ3JvY2tldC5jYXQnLFxuXHRcdFx0XHRcdHVybHM6IFtvcHRpb25zLnRhcmdldF91cmxdLFxuXHRcdFx0XHRcdG5hbWU6IG9wdGlvbnMubmFtZSxcblx0XHRcdFx0XHRjaGFubmVsOiBvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lLFxuXHRcdFx0XHRcdHRyaWdnZXJXb3Jkczogb3B0aW9ucy5kYXRhLnRyaWdnZXJfd29yZHNcblx0XHRcdFx0fSk7XG5cdFx0XHRjYXNlICduZXdNZXNzYWdlVG9Vc2VyJzpcblx0XHRcdFx0aWYgKG9wdGlvbnMuZGF0YS51c2VybmFtZS5pbmRleE9mKCdAJykgPT09IC0xKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5kYXRhLnVzZXJuYW1lID0gYEAkeyBvcHRpb25zLmRhdGEudXNlcm5hbWUgfWA7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdhZGRPdXRnb2luZ0ludGVncmF0aW9uJywge1xuXHRcdFx0XHRcdHVzZXJuYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdFx0dXJsczogW29wdGlvbnMudGFyZ2V0X3VybF0sXG5cdFx0XHRcdFx0bmFtZTogb3B0aW9ucy5uYW1lLFxuXHRcdFx0XHRcdGNoYW5uZWw6IG9wdGlvbnMuZGF0YS51c2VybmFtZSxcblx0XHRcdFx0XHR0cmlnZ2VyV29yZHM6IG9wdGlvbnMuZGF0YS50cmlnZ2VyX3dvcmRzXG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cblx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSW50ZWdyYXRpb24ob3B0aW9ucywgdXNlcikge1xuXHRsb2dnZXIuaW5jb21pbmcuaW5mbygnUmVtb3ZlIGludGVncmF0aW9uJyk7XG5cdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZyhvcHRpb25zKTtcblxuXHRjb25zdCBpbnRlZ3JhdGlvblRvUmVtb3ZlID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoe1xuXHRcdHVybHM6IG9wdGlvbnMudGFyZ2V0X3VybFxuXHR9KTtcblxuXHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJywgaW50ZWdyYXRpb25Ub1JlbW92ZS5faWQpO1xuXHR9KTtcblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xufVxuXG5mdW5jdGlvbiBleGVjdXRlSW50ZWdyYXRpb25SZXN0KCkge1xuXHRsb2dnZXIuaW5jb21pbmcuaW5mbygnUG9zdCBpbnRlZ3JhdGlvbjonLCB0aGlzLmludGVncmF0aW9uLm5hbWUpO1xuXHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ0B1cmxQYXJhbXM6JywgdGhpcy51cmxQYXJhbXMpO1xuXHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ0Bib2R5UGFyYW1zOicsIHRoaXMuYm9keVBhcmFtcyk7XG5cblx0aWYgKHRoaXMuaW50ZWdyYXRpb24uZW5hYmxlZCAhPT0gdHJ1ZSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA1MDMsXG5cdFx0XHRib2R5OiAnU2VydmljZSBVbmF2YWlsYWJsZSdcblx0XHR9O1xuXHR9XG5cblx0Y29uc3QgZGVmYXVsdFZhbHVlcyA9IHtcblx0XHRjaGFubmVsOiB0aGlzLmludGVncmF0aW9uLmNoYW5uZWwsXG5cdFx0YWxpYXM6IHRoaXMuaW50ZWdyYXRpb24uYWxpYXMsXG5cdFx0YXZhdGFyOiB0aGlzLmludGVncmF0aW9uLmF2YXRhcixcblx0XHRlbW9qaTogdGhpcy5pbnRlZ3JhdGlvbi5lbW9qaVxuXHR9O1xuXG5cdGlmICh0aGlzLmludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQgJiYgdGhpcy5pbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCAmJiB0aGlzLmludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkLnRyaW0oKSAhPT0gJycpIHtcblx0XHRsZXQgc2NyaXB0O1xuXHRcdHRyeSB7XG5cdFx0XHRzY3JpcHQgPSBnZXRJbnRlZ3JhdGlvblNjcmlwdCh0aGlzLmludGVncmF0aW9uKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcud2FybihlKTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5yZXF1ZXN0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG5cdFx0Y29uc3QgY29udGVudF9yYXcgPSB0aGlzLnJlcXVlc3QucmVhZCgpO1xuXG5cdFx0Y29uc3QgcmVxdWVzdCA9IHtcblx0XHRcdHVybDoge1xuXHRcdFx0XHRoYXNoOiB0aGlzLnJlcXVlc3QuX3BhcnNlZFVybC5oYXNoLFxuXHRcdFx0XHRzZWFyY2g6IHRoaXMucmVxdWVzdC5fcGFyc2VkVXJsLnNlYXJjaCxcblx0XHRcdFx0cXVlcnk6IHRoaXMucXVlcnlQYXJhbXMsXG5cdFx0XHRcdHBhdGhuYW1lOiB0aGlzLnJlcXVlc3QuX3BhcnNlZFVybC5wYXRobmFtZSxcblx0XHRcdFx0cGF0aDogdGhpcy5yZXF1ZXN0Ll9wYXJzZWRVcmwucGF0aFxuXHRcdFx0fSxcblx0XHRcdHVybF9yYXc6IHRoaXMucmVxdWVzdC51cmwsXG5cdFx0XHR1cmxfcGFyYW1zOiB0aGlzLnVybFBhcmFtcyxcblx0XHRcdGNvbnRlbnQ6IHRoaXMuYm9keVBhcmFtcyxcblx0XHRcdGNvbnRlbnRfcmF3LFxuXHRcdFx0aGVhZGVyczogdGhpcy5yZXF1ZXN0LmhlYWRlcnMsXG5cdFx0XHRib2R5OiB0aGlzLnJlcXVlc3QuYm9keSxcblx0XHRcdHVzZXI6IHtcblx0XHRcdFx0X2lkOiB0aGlzLnVzZXIuX2lkLFxuXHRcdFx0XHRuYW1lOiB0aGlzLnVzZXIubmFtZSxcblx0XHRcdFx0dXNlcm5hbWU6IHRoaXMudXNlci51c2VybmFtZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgeyBzYW5kYm94IH0gPSBidWlsZFNhbmRib3goY29tcGlsZWRTY3JpcHRzW3RoaXMuaW50ZWdyYXRpb24uX2lkXS5zdG9yZSk7XG5cdFx0XHRzYW5kYm94LnNjcmlwdCA9IHNjcmlwdDtcblx0XHRcdHNhbmRib3gucmVxdWVzdCA9IHJlcXVlc3Q7XG5cblx0XHRcdGNvbnN0IHJlc3VsdCA9IEZ1dHVyZS5mcm9tUHJvbWlzZSh2bS5ydW5Jbk5ld0NvbnRleHQoYFxuXHRcdFx0XHRuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdFx0RmliZXIoKCkgPT4ge1xuXHRcdFx0XHRcdFx0c2NyaXB0VGltZW91dChyZWplY3QpO1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZShzY3JpcHQucHJvY2Vzc19pbmNvbWluZ19yZXF1ZXN0KHsgcmVxdWVzdDogcmVxdWVzdCB9KSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0XHRcdFx0cmVqZWN0KGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pLnJ1bigpO1xuXHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHsgdGhyb3cgbmV3IEVycm9yKGVycm9yKTsgfSk7XG5cdFx0XHRgLCBzYW5kYm94LCB7XG5cdFx0XHRcdHRpbWVvdXQ6IDMwMDBcblx0XHRcdH0pKS53YWl0KCk7XG5cblx0XHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRcdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZygnW1Byb2Nlc3MgSW5jb21pbmcgUmVxdWVzdCByZXN1bHQgb2YgVHJpZ2dlcicsIHRoaXMuaW50ZWdyYXRpb24ubmFtZSwgJzpdIE5vIGRhdGEnKTtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdH0gZWxzZSBpZiAocmVzdWx0ICYmIHJlc3VsdC5lcnJvcikge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShyZXN1bHQuZXJyb3IpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmJvZHlQYXJhbXMgPSByZXN1bHQgJiYgcmVzdWx0LmNvbnRlbnQ7XG5cdFx0XHR0aGlzLnNjcmlwdFJlc3BvbnNlID0gcmVzdWx0LnJlc3BvbnNlO1xuXHRcdFx0aWYgKHJlc3VsdC51c2VyKSB7XG5cdFx0XHRcdHRoaXMudXNlciA9IHJlc3VsdC51c2VyO1xuXHRcdFx0fVxuXG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ1tQcm9jZXNzIEluY29taW5nIFJlcXVlc3QgcmVzdWx0IG9mIFRyaWdnZXInLCB0aGlzLmludGVncmF0aW9uLm5hbWUsICc6XScpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmRlYnVnKCdyZXN1bHQnLCB0aGlzLmJvZHlQYXJhbXMpO1xuXHRcdH0gY2F0Y2ggKHtzdGFja30pIHtcblx0XHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcignW0Vycm9yIHJ1bm5pbmcgU2NyaXB0IGluIFRyaWdnZXInLCB0aGlzLmludGVncmF0aW9uLm5hbWUsICc6XScpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHRoaXMuaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQucmVwbGFjZSgvXi9nbSwgJyAgJykpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKCdbU3RhY2s6XScpO1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHN0YWNrLnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdlcnJvci1ydW5uaW5nLXNjcmlwdCcpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFRPRE86IFR1cm4gdGhpcyBpbnRvIGFuIG9wdGlvbiBvbiB0aGUgaW50ZWdyYXRpb25zIC0gbm8gYm9keSBtZWFucyBhIHN1Y2Nlc3Ncblx0Ly8gVE9ETzogVGVtcG9yYXJ5IGZpeCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzLzc3NzAgdW50aWwgdGhlIGFib3ZlIGlzIGltcGxlbWVudGVkXG5cdGlmICghdGhpcy5ib2R5UGFyYW1zIHx8IChfLmlzRW1wdHkodGhpcy5ib2R5UGFyYW1zKSAmJiAhdGhpcy5pbnRlZ3JhdGlvbi5zY3JpcHRFbmFibGVkKSkge1xuXHRcdC8vIHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdib2R5LWVtcHR5Jyk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxuXG5cdHRoaXMuYm9keVBhcmFtcy5ib3QgPSB7IGk6IHRoaXMuaW50ZWdyYXRpb24uX2lkIH07XG5cblx0dHJ5IHtcblx0XHRjb25zdCBtZXNzYWdlID0gcHJvY2Vzc1dlYmhvb2tNZXNzYWdlKHRoaXMuYm9keVBhcmFtcywgdGhpcy51c2VyLCBkZWZhdWx0VmFsdWVzKTtcblx0XHRpZiAoXy5pc0VtcHR5KG1lc3NhZ2UpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgndW5rbm93bi1lcnJvcicpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnNjcmlwdFJlc3BvbnNlKSB7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ3Jlc3BvbnNlJywgdGhpcy5zY3JpcHRSZXNwb25zZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3ModGhpcy5zY3JpcHRSZXNwb25zZSk7XG5cdH0gY2F0Y2ggKHsgZXJyb3IsIG1lc3NhZ2UgfSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGVycm9yIHx8IG1lc3NhZ2UpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGFkZEludGVncmF0aW9uUmVzdCgpIHtcblx0cmV0dXJuIGNyZWF0ZUludGVncmF0aW9uKHRoaXMuYm9keVBhcmFtcywgdGhpcy51c2VyKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSW50ZWdyYXRpb25SZXN0KCkge1xuXHRyZXR1cm4gcmVtb3ZlSW50ZWdyYXRpb24odGhpcy5ib2R5UGFyYW1zLCB0aGlzLnVzZXIpO1xufVxuXG5mdW5jdGlvbiBpbnRlZ3JhdGlvblNhbXBsZVJlc3QoKSB7XG5cdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdTYW1wbGUgSW50ZWdyYXRpb24nKTtcblx0cmV0dXJuIHtcblx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0Ym9keTogW1xuXHRcdFx0e1xuXHRcdFx0XHR0b2tlbjogUmFuZG9tLmlkKDI0KSxcblx0XHRcdFx0Y2hhbm5lbF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdGNoYW5uZWxfbmFtZTogJ2dlbmVyYWwnLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlLFxuXHRcdFx0XHR1c2VyX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0dXNlcl9uYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdHRleHQ6ICdTYW1wbGUgdGV4dCAxJyxcblx0XHRcdFx0dHJpZ2dlcl93b3JkOiAnU2FtcGxlJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHR0b2tlbjogUmFuZG9tLmlkKDI0KSxcblx0XHRcdFx0Y2hhbm5lbF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdGNoYW5uZWxfbmFtZTogJ2dlbmVyYWwnLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlLFxuXHRcdFx0XHR1c2VyX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0dXNlcl9uYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdHRleHQ6ICdTYW1wbGUgdGV4dCAyJyxcblx0XHRcdFx0dHJpZ2dlcl93b3JkOiAnU2FtcGxlJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHR0b2tlbjogUmFuZG9tLmlkKDI0KSxcblx0XHRcdFx0Y2hhbm5lbF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdGNoYW5uZWxfbmFtZTogJ2dlbmVyYWwnLFxuXHRcdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlLFxuXHRcdFx0XHR1c2VyX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0dXNlcl9uYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdHRleHQ6ICdTYW1wbGUgdGV4dCAzJyxcblx0XHRcdFx0dHJpZ2dlcl93b3JkOiAnU2FtcGxlJ1xuXHRcdFx0fVxuXHRcdF1cblx0fTtcbn1cblxuZnVuY3Rpb24gaW50ZWdyYXRpb25JbmZvUmVzdCgpIHtcblx0bG9nZ2VyLmluY29taW5nLmluZm8oJ0luZm8gaW50ZWdyYXRpb24nKTtcblx0cmV0dXJuIHtcblx0XHRzdGF0dXNDb2RlOiAyMDAsXG5cdFx0Ym9keToge1xuXHRcdFx0c3VjY2VzczogdHJ1ZVxuXHRcdH1cblx0fTtcbn1cblxuQXBpLmFkZFJvdXRlKCc6aW50ZWdyYXRpb25JZC86dXNlcklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdDogZXhlY3V0ZUludGVncmF0aW9uUmVzdCxcblx0Z2V0OiBleGVjdXRlSW50ZWdyYXRpb25SZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCc6aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IGV4ZWN1dGVJbnRlZ3JhdGlvblJlc3QsXG5cdGdldDogZXhlY3V0ZUludGVncmF0aW9uUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnc2FtcGxlLzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQ6IGludGVncmF0aW9uU2FtcGxlUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnc2FtcGxlLzppbnRlZ3JhdGlvbklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0OiBpbnRlZ3JhdGlvblNhbXBsZVJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJ2luZm8vOmludGVncmF0aW9uSWQvOnVzZXJJZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDogaW50ZWdyYXRpb25JbmZvUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnaW5mby86aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDogaW50ZWdyYXRpb25JbmZvUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnYWRkLzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0OiBhZGRJbnRlZ3JhdGlvblJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJ2FkZC86aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IGFkZEludGVncmF0aW9uUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgncmVtb3ZlLzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0OiByZW1vdmVJbnRlZ3JhdGlvblJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJ3JlbW92ZS86aW50ZWdyYXRpb25JZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IHJlbW92ZUludGVncmF0aW9uUmVzdFxufSk7XG4iLCJjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBmdW5jdGlvbiBfY2FsbGJhY2tIYW5kbGVyKGV2ZW50VHlwZSkge1xuXHRyZXR1cm4gZnVuY3Rpb24gX3dyYXBwZXJGdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudHJpZ2dlckhhbmRsZXIuZXhlY3V0ZVRyaWdnZXJzKGV2ZW50VHlwZSwgLi4uYXJndW1lbnRzKTtcblx0fTtcbn07XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGNhbGxiYWNrSGFuZGxlcignc2VuZE1lc3NhZ2UnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJDcmVhdGVDaGFubmVsJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tQ3JlYXRlZCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckNyZWF0ZVByaXZhdGVHcm91cCcsIGNhbGxiYWNrSGFuZGxlcigncm9vbUNyZWF0ZWQnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJDcmVhdGVVc2VyJywgY2FsbGJhY2tIYW5kbGVyKCd1c2VyQ3JlYXRlZCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckpvaW5Sb29tJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tSm9pbmVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyTGVhdmVSb29tJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tTGVmdCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclJvb21BcmNoaXZlZCcsIGNhbGxiYWNrSGFuZGxlcigncm9vbUFyY2hpdmVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyRmlsZVVwbG9hZCcsIGNhbGxiYWNrSGFuZGxlcignZmlsZVVwbG9hZGVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxudGhpcy5wcm9jZXNzV2ViaG9va01lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlT2JqLCB1c2VyLCBkZWZhdWx0VmFsdWVzID0geyBjaGFubmVsOiAnJywgYWxpYXM6ICcnLCBhdmF0YXI6ICcnLCBlbW9qaTogJycgfSwgbXVzdEJlSm9pbmVkID0gZmFsc2UpIHtcblx0Y29uc3Qgc2VudERhdGEgPSBbXTtcblx0Y29uc3QgY2hhbm5lbHMgPSBbXS5jb25jYXQobWVzc2FnZU9iai5jaGFubmVsIHx8IG1lc3NhZ2VPYmoucm9vbUlkIHx8IGRlZmF1bHRWYWx1ZXMuY2hhbm5lbCk7XG5cblx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0Y29uc3QgY2hhbm5lbFR5cGUgPSBjaGFubmVsWzBdO1xuXG5cdFx0bGV0IGNoYW5uZWxWYWx1ZSA9IGNoYW5uZWwuc3Vic3RyKDEpO1xuXHRcdGxldCByb29tO1xuXG5cdFx0c3dpdGNoIChjaGFubmVsVHlwZSkge1xuXHRcdFx0Y2FzZSAnIyc6XG5cdFx0XHRcdHJvb20gPSBSb2NrZXRDaGF0LmdldFJvb21CeU5hbWVPcklkV2l0aE9wdGlvblRvSm9pbih7IGN1cnJlbnRVc2VySWQ6IHVzZXIuX2lkLCBuYW1lT3JJZDogY2hhbm5lbFZhbHVlLCBqb2luQ2hhbm5lbDogdHJ1ZSB9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdAJzpcblx0XHRcdFx0cm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHsgY3VycmVudFVzZXJJZDogdXNlci5faWQsIG5hbWVPcklkOiBjaGFubmVsVmFsdWUsIHR5cGU6ICdkJyB9KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRjaGFubmVsVmFsdWUgPSBjaGFubmVsVHlwZSArIGNoYW5uZWxWYWx1ZTtcblxuXHRcdFx0XHQvL1RyeSB0byBmaW5kIHRoZSByb29tIGJ5IGlkIG9yIG5hbWUgaWYgdGhleSBkaWRuJ3QgaW5jbHVkZSB0aGUgcHJlZml4LlxuXHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oeyBjdXJyZW50VXNlcklkOiB1c2VyLl9pZCwgbmFtZU9ySWQ6IGNoYW5uZWxWYWx1ZSwgam9pbkNoYW5uZWw6IHRydWUsIGVycm9yT25FbXB0eTogZmFsc2UgfSk7XG5cdFx0XHRcdGlmIChyb29tKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL1dlIGRpZG4ndCBnZXQgYSByb29tLCBsZXQncyB0cnkgZmluZGluZyBkaXJlY3QgbWVzc2FnZXNcblx0XHRcdFx0cm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHsgY3VycmVudFVzZXJJZDogdXNlci5faWQsIG5hbWVPcklkOiBjaGFubmVsVmFsdWUsIHR5cGU6ICdkJywgdHJ5RGlyZWN0QnlVc2VySWRPbmx5OiB0cnVlIH0pO1xuXHRcdFx0XHRpZiAocm9vbSkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9ObyByb29tLCBzbyB0aHJvdyBhbiBlcnJvclxuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWNoYW5uZWwnKTtcblx0XHR9XG5cblx0XHRpZiAobXVzdEJlSm9pbmVkICYmICFSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgdXNlci5faWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pKSB7XG5cdFx0XHQvLyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tIHByb3ZpZGVkIHRvIHNlbmQgYSBtZXNzYWdlIHRvLCBtdXN0IGJlIGpvaW5lZC4nKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtY2hhbm5lbCcpOyAvLyBUaHJvd2luZyB0aGUgZ2VuZXJpYyBvbmUgc28gcGVvcGxlIGNhbid0IFwiYnJ1dGUgZm9yY2VcIiBmaW5kIHJvb21zXG5cdFx0fVxuXG5cdFx0aWYgKG1lc3NhZ2VPYmouYXR0YWNobWVudHMgJiYgIV8uaXNBcnJheShtZXNzYWdlT2JqLmF0dGFjaG1lbnRzKSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ0F0dGFjaG1lbnRzIHNob3VsZCBiZSBBcnJheSwgaWdub3JpbmcgdmFsdWUnLnJlZCwgbWVzc2FnZU9iai5hdHRhY2htZW50cyk7XG5cdFx0XHRtZXNzYWdlT2JqLmF0dGFjaG1lbnRzID0gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHRhbGlhczogbWVzc2FnZU9iai51c2VybmFtZSB8fCBtZXNzYWdlT2JqLmFsaWFzIHx8IGRlZmF1bHRWYWx1ZXMuYWxpYXMsXG5cdFx0XHRtc2c6IHMudHJpbShtZXNzYWdlT2JqLnRleHQgfHwgbWVzc2FnZU9iai5tc2cgfHwgJycpLFxuXHRcdFx0YXR0YWNobWVudHM6IG1lc3NhZ2VPYmouYXR0YWNobWVudHMgfHwgW10sXG5cdFx0XHRwYXJzZVVybHM6IG1lc3NhZ2VPYmoucGFyc2VVcmxzICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlT2JqLnBhcnNlVXJscyA6ICFtZXNzYWdlT2JqLmF0dGFjaG1lbnRzLFxuXHRcdFx0Ym90OiBtZXNzYWdlT2JqLmJvdCxcblx0XHRcdGdyb3VwYWJsZTogKG1lc3NhZ2VPYmouZ3JvdXBhYmxlICE9PSB1bmRlZmluZWQpID8gbWVzc2FnZU9iai5ncm91cGFibGUgOiBmYWxzZVxuXHRcdH07XG5cblx0XHRpZiAoIV8uaXNFbXB0eShtZXNzYWdlT2JqLmljb25fdXJsKSB8fCAhXy5pc0VtcHR5KG1lc3NhZ2VPYmouYXZhdGFyKSkge1xuXHRcdFx0bWVzc2FnZS5hdmF0YXIgPSBtZXNzYWdlT2JqLmljb25fdXJsIHx8IG1lc3NhZ2VPYmouYXZhdGFyO1xuXHRcdH0gZWxzZSBpZiAoIV8uaXNFbXB0eShtZXNzYWdlT2JqLmljb25fZW1vamkpIHx8ICFfLmlzRW1wdHkobWVzc2FnZU9iai5lbW9qaSkpIHtcblx0XHRcdG1lc3NhZ2UuZW1vamkgPSBtZXNzYWdlT2JqLmljb25fZW1vamkgfHwgbWVzc2FnZU9iai5lbW9qaTtcblx0XHR9IGVsc2UgaWYgKCFfLmlzRW1wdHkoZGVmYXVsdFZhbHVlcy5hdmF0YXIpKSB7XG5cdFx0XHRtZXNzYWdlLmF2YXRhciA9IGRlZmF1bHRWYWx1ZXMuYXZhdGFyO1xuXHRcdH0gZWxzZSBpZiAoIV8uaXNFbXB0eShkZWZhdWx0VmFsdWVzLmVtb2ppKSkge1xuXHRcdFx0bWVzc2FnZS5lbW9qaSA9IGRlZmF1bHRWYWx1ZXMuZW1vamk7XG5cdFx0fVxuXG5cdFx0aWYgKF8uaXNBcnJheShtZXNzYWdlLmF0dGFjaG1lbnRzKSkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBtZXNzYWdlLmF0dGFjaG1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBtZXNzYWdlLmF0dGFjaG1lbnRzW2ldO1xuXHRcdFx0XHRpZiAoYXR0YWNobWVudC5tc2cpIHtcblx0XHRcdFx0XHRhdHRhY2htZW50LnRleHQgPSBzLnRyaW0oYXR0YWNobWVudC5tc2cpO1xuXHRcdFx0XHRcdGRlbGV0ZSBhdHRhY2htZW50Lm1zZztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2VSZXR1cm4gPSBSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHVzZXIsIG1lc3NhZ2UsIHJvb20pO1xuXHRcdHNlbnREYXRhLnB1c2goeyBjaGFubmVsLCBtZXNzYWdlOiBtZXNzYWdlUmV0dXJuIH0pO1xuXHR9XG5cblx0cmV0dXJuIHNlbnREYXRhO1xufTtcbiJdfQ==
