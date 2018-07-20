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
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var logger, rocketUser, slackMsgTxt;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slackbridge":{"server":{"logger.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_slackbridge/server/logger.js                                                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
/* globals logger:true */

/* exported logger */
logger = new Logger('SlackBridge', {
  sections: {
    connection: 'Connection',
    events: 'Events',
    class: 'Class',
    slack: 'Slack',
    rocket: 'Rocket'
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_slackbridge/server/settings.js                                                             //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Meteor.startup(function () {
  RocketChat.settings.addGroup('SlackBridge', function () {
    this.add('SlackBridge_Enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled',
      public: true
    });
    this.add('SlackBridge_APIToken', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'API_Token'
    });
    this.add('SlackBridge_AliasFormat', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'Alias_Format',
      i18nDescription: 'Alias_Format_Description'
    });
    this.add('SlackBridge_ExcludeBotnames', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'Exclude_Botnames',
      i18nDescription: 'Exclude_Botnames_Description'
    });
    this.add('SlackBridge_Out_Enabled', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      }
    });
    this.add('SlackBridge_Out_All', false, {
      type: 'boolean',
      enableQuery: [{
        _id: 'SlackBridge_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_Enabled',
        value: true
      }]
    });
    this.add('SlackBridge_Out_Channels', '', {
      type: 'roomPick',
      enableQuery: [{
        _id: 'SlackBridge_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_All',
        value: false
      }]
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slackbridge.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_slackbridge/server/slackbridge.js                                                          //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let SlackAdapter;
module.watch(require("./SlackAdapter.js"), {
  default(v) {
    SlackAdapter = v;
  }

}, 0);
let RocketAdapter;
module.watch(require("./RocketAdapter.js"), {
  default(v) {
    RocketAdapter = v;
  }

}, 1);

/**
 * SlackBridge interfaces between this Rocket installation and a remote Slack installation.
 */
class SlackBridge {
  constructor() {
    this.slack = new SlackAdapter(this);
    this.rocket = new RocketAdapter(this);
    this.reactionsMap = new Map(); //Sync object between rocket and slack

    this.connected = false;
    this.rocket.setSlack(this.slack);
    this.slack.setRocket(this.rocket);
    this.processSettings();
  }

  connect() {
    if (this.connected === false) {
      this.slack.connect(this.apiToken);

      if (RocketChat.settings.get('SlackBridge_Out_Enabled')) {
        this.rocket.connect();
      }

      this.connected = true;
      logger.connection.info('Enabled');
    }
  }

  disconnect() {
    if (this.connected === true) {
      this.rocket.disconnect();
      this.slack.disconnect();
      this.connected = false;
      logger.connection.info('Disabled');
    }
  }

  processSettings() {
    //Slack installation API token
    RocketChat.settings.get('SlackBridge_APIToken', (key, value) => {
      if (value !== this.apiToken) {
        this.apiToken = value;

        if (this.connected) {
          this.disconnect();
          this.connect();
        }
      }

      logger.class.debug(`Setting: ${key}`, value);
    }); //Import messages from Slack with an alias; %s is replaced by the username of the user. If empty, no alias will be used.

    RocketChat.settings.get('SlackBridge_AliasFormat', (key, value) => {
      this.aliasFormat = value;
      logger.class.debug(`Setting: ${key}`, value);
    }); //Do not propagate messages from bots whose name matches the regular expression above. If left empty, all messages from bots will be propagated.

    RocketChat.settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
      this.excludeBotnames = value;
      logger.class.debug(`Setting: ${key}`, value);
    }); //Is this entire SlackBridge enabled

    RocketChat.settings.get('SlackBridge_Enabled', (key, value) => {
      if (value && this.apiToken) {
        this.connect();
      } else {
        this.disconnect();
      }

      logger.class.debug(`Setting: ${key}`, value);
    });
  }

}

RocketChat.SlackBridge = new SlackBridge();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slackbridge_import.server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_slackbridge/server/slackbridge_import.server.js                                            //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
/* globals msgStream */
function SlackBridgeImport(command, params, item) {
  if (command !== 'slackbridge-import' || !Match.test(params, String)) {
    return;
  }

  const room = RocketChat.models.Rooms.findOneById(item.rid);
  const channel = room.name;
  const user = Meteor.users.findOne(Meteor.userId());
  msgStream.emit(item.rid, {
    _id: Random.id(),
    rid: item.rid,
    u: {
      username: 'rocket.cat'
    },
    ts: new Date(),
    msg: TAPi18n.__('SlackBridge_start', {
      postProcess: 'sprintf',
      sprintf: [user.username, channel]
    }, user.language)
  });

  try {
    RocketChat.SlackBridge.importMessages(item.rid, error => {
      if (error) {
        msgStream.emit(item.rid, {
          _id: Random.id(),
          rid: item.rid,
          u: {
            username: 'rocket.cat'
          },
          ts: new Date(),
          msg: TAPi18n.__('SlackBridge_error', {
            postProcess: 'sprintf',
            sprintf: [channel, error.message]
          }, user.language)
        });
      } else {
        msgStream.emit(item.rid, {
          _id: Random.id(),
          rid: item.rid,
          u: {
            username: 'rocket.cat'
          },
          ts: new Date(),
          msg: TAPi18n.__('SlackBridge_finish', {
            postProcess: 'sprintf',
            sprintf: [channel]
          }, user.language)
        });
      }
    });
  } catch (error) {
    msgStream.emit(item.rid, {
      _id: Random.id(),
      rid: item.rid,
      u: {
        username: 'rocket.cat'
      },
      ts: new Date(),
      msg: TAPi18n.__('SlackBridge_error', {
        postProcess: 'sprintf',
        sprintf: [channel, error.message]
      }, user.language)
    });
    throw error;
  }

  return SlackBridgeImport;
}

RocketChat.slashCommands.add('slackbridge-import', SlackBridgeImport);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RocketAdapter.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_slackbridge/server/RocketAdapter.js                                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  default: () => RocketAdapter
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

class RocketAdapter {
  constructor(slackBridge) {
    logger.rocket.debug('constructor');
    this.slackBridge = slackBridge;
    this.util = Npm.require('util');
    this.userTags = {};
    this.slack = {};
  }

  connect() {
    this.registerForEvents();
  }

  disconnect() {
    this.unregisterForEvents();
  }

  setSlack(slack) {
    this.slack = slack;
  }

  registerForEvents() {
    logger.rocket.debug('Register for events');
    RocketChat.callbacks.add('afterSaveMessage', this.onMessage.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Out');
    RocketChat.callbacks.add('afterDeleteMessage', this.onMessageDelete.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Delete');
    RocketChat.callbacks.add('setReaction', this.onSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_SetReaction');
    RocketChat.callbacks.add('unsetReaction', this.onUnSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_UnSetReaction');
  }

  unregisterForEvents() {
    logger.rocket.debug('Unregister for events');
    RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
    RocketChat.callbacks.remove('afterDeleteMessage', 'SlackBridge_Delete');
    RocketChat.callbacks.remove('setReaction', 'SlackBridge_SetReaction');
    RocketChat.callbacks.remove('unsetReaction', 'SlackBridge_UnSetReaction');
  }

  onMessageDelete(rocketMessageDeleted) {
    try {
      if (!this.slack.getSlackChannel(rocketMessageDeleted.rid)) {
        //This is on a channel that the rocket bot is not subscribed
        return;
      }

      logger.rocket.debug('onRocketMessageDelete', rocketMessageDeleted);
      this.slack.postDeleteMessage(rocketMessageDeleted);
    } catch (err) {
      logger.rocket.error('Unhandled error onMessageDelete', err);
    }
  }

  onSetReaction(rocketMsgID, reaction) {
    try {
      logger.rocket.debug('onRocketSetReaction');

      if (rocketMsgID && reaction) {
        if (this.slackBridge.reactionsMap.delete(`set${rocketMsgID}${reaction}`)) {
          //This was a Slack reaction, we don't need to tell Slack about it
          return;
        }

        const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);

        if (rocketMsg) {
          const slackChannel = this.slack.getSlackChannel(rocketMsg.rid);

          if (null != slackChannel) {
            const slackTS = this.slack.getTimeStamp(rocketMsg);
            this.slack.postReactionAdded(reaction.replace(/:/g, ''), slackChannel.id, slackTS);
          }
        }
      }
    } catch (err) {
      logger.rocket.error('Unhandled error onSetReaction', err);
    }
  }

  onUnSetReaction(rocketMsgID, reaction) {
    try {
      logger.rocket.debug('onRocketUnSetReaction');

      if (rocketMsgID && reaction) {
        if (this.slackBridge.reactionsMap.delete(`unset${rocketMsgID}${reaction}`)) {
          //This was a Slack unset reaction, we don't need to tell Slack about it
          return;
        }

        const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);

        if (rocketMsg) {
          const slackChannel = this.slack.getSlackChannel(rocketMsg.rid);

          if (null != slackChannel) {
            const slackTS = this.slack.getTimeStamp(rocketMsg);
            this.slack.postReactionRemove(reaction.replace(/:/g, ''), slackChannel.id, slackTS);
          }
        }
      }
    } catch (err) {
      logger.rocket.error('Unhandled error onUnSetReaction', err);
    }
  }

  onMessage(rocketMessage) {
    try {
      if (!this.slack.getSlackChannel(rocketMessage.rid)) {
        //This is on a channel that the rocket bot is not subscribed
        return;
      }

      logger.rocket.debug('onRocketMessage', rocketMessage);

      if (rocketMessage.editedAt) {
        //This is an Edit Event
        this.processMessageChanged(rocketMessage);
        return rocketMessage;
      } // Ignore messages originating from Slack


      if (rocketMessage._id.indexOf('slack-') === 0) {
        return rocketMessage;
      } //A new message from Rocket.Chat


      this.processSendMessage(rocketMessage);
    } catch (err) {
      logger.rocket.error('Unhandled error onMessage', err);
    }

    return rocketMessage;
  }

  processSendMessage(rocketMessage) {
    //Since we got this message, SlackBridge_Out_Enabled is true
    if (RocketChat.settings.get('SlackBridge_Out_All') === true) {
      this.slack.postMessage(this.slack.getSlackChannel(rocketMessage.rid), rocketMessage);
    } else {
      //They want to limit to certain groups
      const outSlackChannels = _.pluck(RocketChat.settings.get('SlackBridge_Out_Channels'), '_id') || []; //logger.rocket.debug('Out SlackChannels: ', outSlackChannels);

      if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
        this.slack.postMessage(this.slack.getSlackChannel(rocketMessage.rid), rocketMessage);
      }
    }
  }

  processMessageChanged(rocketMessage) {
    if (rocketMessage) {
      if (rocketMessage.updatedBySlack) {
        //We have already processed this
        delete rocketMessage.updatedBySlack;
        return;
      } //This was a change from Rocket.Chat


      const slackChannel = this.slack.getSlackChannel(rocketMessage.rid);
      this.slack.postMessageUpdate(slackChannel, rocketMessage);
    }
  }

  getChannel(slackMessage) {
    return slackMessage.channel ? this.findChannel(slackMessage.channel) || this.addChannel(slackMessage.channel) : null;
  }

  getUser(slackUser) {
    return slackUser ? this.findUser(slackUser) || this.addUser(slackUser) : null;
  }

  createRocketID(slackChannel, ts) {
    return `slack-${slackChannel}-${ts.replace(/\./g, '-')}`;
  }

  findChannel(slackChannelId) {
    return RocketChat.models.Rooms.findOneByImportId(slackChannelId);
  }

  addChannel(slackChannelID, hasRetried = false) {
    logger.rocket.debug('Adding Rocket.Chat channel from Slack', slackChannelID);
    let slackResults = null;
    let isGroup = false;

    if (slackChannelID.charAt(0) === 'C') {
      slackResults = HTTP.get('https://slack.com/api/channels.info', {
        params: {
          token: this.slackBridge.apiToken,
          channel: slackChannelID
        }
      });
    } else if (slackChannelID.charAt(0) === 'G') {
      slackResults = HTTP.get('https://slack.com/api/groups.info', {
        params: {
          token: this.slackBridge.apiToken,
          channel: slackChannelID
        }
      });
      isGroup = true;
    }

    if (slackResults && slackResults.data && slackResults.data.ok === true) {
      const rocketChannelData = isGroup ? slackResults.data.group : slackResults.data.channel;
      const existingRocketRoom = RocketChat.models.Rooms.findOneByName(rocketChannelData.name); // If the room exists, make sure we have its id in importIds

      if (existingRocketRoom || rocketChannelData.is_general) {
        rocketChannelData.rocketId = rocketChannelData.is_general ? 'GENERAL' : existingRocketRoom._id;
        RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
      } else {
        const rocketUsers = [];

        for (const member of rocketChannelData.members) {
          if (member !== rocketChannelData.creator) {
            const rocketUser = this.findUser(member) || this.addUser(member);

            if (rocketUser && rocketUser.username) {
              rocketUsers.push(rocketUser.username);
            }
          }
        }

        const rocketUserCreator = rocketChannelData.creator ? this.findUser(rocketChannelData.creator) || this.addUser(rocketChannelData.creator) : null;

        if (!rocketUserCreator) {
          logger.rocket.error('Could not fetch room creator information', rocketChannelData.creator);
          return;
        }

        try {
          const rocketChannel = RocketChat.createRoom(isGroup ? 'p' : 'c', rocketChannelData.name, rocketUserCreator.username, rocketUsers);
          rocketChannelData.rocketId = rocketChannel.rid;
        } catch (e) {
          if (!hasRetried) {
            logger.rocket.debug('Error adding channel from Slack. Will retry in 1s.', e.message); // If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.

            Meteor._sleepForMs(1000);

            return this.findChannel(slackChannelID) || this.addChannel(slackChannelID, true);
          } else {
            console.log(e.message);
          }
        }

        const roomUpdate = {
          ts: new Date(rocketChannelData.created * 1000)
        };
        let lastSetTopic = 0;

        if (!_.isEmpty(rocketChannelData.topic && rocketChannelData.topic.value)) {
          roomUpdate.topic = rocketChannelData.topic.value;
          lastSetTopic = rocketChannelData.topic.last_set;
        }

        if (!_.isEmpty(rocketChannelData.purpose && rocketChannelData.purpose.value) && rocketChannelData.purpose.last_set > lastSetTopic) {
          roomUpdate.topic = rocketChannelData.purpose.value;
        }

        RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
        this.slack.addSlackChannel(rocketChannelData.rocketId, slackChannelID);
      }

      return RocketChat.models.Rooms.findOneById(rocketChannelData.rocketId);
    }

    logger.rocket.debug('Channel not added');
    return;
  }

  findUser(slackUserID) {
    const rocketUser = RocketChat.models.Users.findOneByImportId(slackUserID);

    if (rocketUser && !this.userTags[slackUserID]) {
      this.userTags[slackUserID] = {
        slack: `<@${slackUserID}>`,
        rocket: `@${rocketUser.username}`
      };
    }

    return rocketUser;
  }

  addUser(slackUserID) {
    logger.rocket.debug('Adding Rocket.Chat user from Slack', slackUserID);
    const slackResults = HTTP.get('https://slack.com/api/users.info', {
      params: {
        token: this.slackBridge.apiToken,
        user: slackUserID
      }
    });

    if (slackResults && slackResults.data && slackResults.data.ok === true && slackResults.data.user) {
      const rocketUserData = slackResults.data.user;
      const isBot = rocketUserData.is_bot === true;
      const email = rocketUserData.profile && rocketUserData.profile.email || '';
      let existingRocketUser;

      if (!isBot) {
        existingRocketUser = RocketChat.models.Users.findOneByEmailAddress(email) || RocketChat.models.Users.findOneByUsername(rocketUserData.name);
      } else {
        existingRocketUser = RocketChat.models.Users.findOneByUsername(rocketUserData.name);
      }

      if (existingRocketUser) {
        rocketUserData.rocketId = existingRocketUser._id;
        rocketUserData.name = existingRocketUser.username;
      } else {
        const newUser = {
          password: Random.id(),
          username: rocketUserData.name
        };

        if (!isBot && email) {
          newUser.email = email;
        }

        if (isBot) {
          newUser.joinDefaultChannels = false;
        }

        rocketUserData.rocketId = Accounts.createUser(newUser);
        const userUpdate = {
          utcOffset: rocketUserData.tz_offset / 3600,
          // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
          roles: isBot ? ['bot'] : ['user']
        };

        if (rocketUserData.profile && rocketUserData.profile.real_name) {
          userUpdate['name'] = rocketUserData.profile.real_name;
        }

        if (rocketUserData.deleted) {
          userUpdate['active'] = false;
          userUpdate['services.resume.loginTokens'] = [];
        }

        RocketChat.models.Users.update({
          _id: rocketUserData.rocketId
        }, {
          $set: userUpdate
        });
        const user = RocketChat.models.Users.findOneById(rocketUserData.rocketId);
        let url = null;

        if (rocketUserData.profile) {
          if (rocketUserData.profile.image_original) {
            url = rocketUserData.profile.image_original;
          } else if (rocketUserData.profile.image_512) {
            url = rocketUserData.profile.image_512;
          }
        }

        if (url) {
          try {
            RocketChat.setUserAvatar(user, url, null, 'url');
          } catch (error) {
            logger.rocket.debug('Error setting user avatar', error.message);
          }
        }
      }

      const importIds = [rocketUserData.id];

      if (isBot && rocketUserData.profile && rocketUserData.profile.bot_id) {
        importIds.push(rocketUserData.profile.bot_id);
      }

      RocketChat.models.Users.addImportIds(rocketUserData.rocketId, importIds);

      if (!this.userTags[slackUserID]) {
        this.userTags[slackUserID] = {
          slack: `<@${slackUserID}>`,
          rocket: `@${rocketUserData.name}`
        };
      }

      return RocketChat.models.Users.findOneById(rocketUserData.rocketId);
    }

    logger.rocket.debug('User not added');
    return;
  }

  addAliasToMsg(rocketUserName, rocketMsgObj) {
    const aliasFormat = RocketChat.settings.get('SlackBridge_AliasFormat');

    if (aliasFormat) {
      const alias = this.util.format(aliasFormat, rocketUserName);

      if (alias !== rocketUserName) {
        rocketMsgObj.alias = alias;
      }
    }

    return rocketMsgObj;
  }

  createAndSaveMessage(rocketChannel, rocketUser, slackMessage, rocketMsgDataDefaults, isImporting) {
    if (slackMessage.type === 'message') {
      let rocketMsgObj = {};

      if (!_.isEmpty(slackMessage.subtype)) {
        rocketMsgObj = this.slack.processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);

        if (!rocketMsgObj) {
          return;
        }
      } else {
        rocketMsgObj = {
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
          rid: rocketChannel._id,
          u: {
            _id: rocketUser._id,
            username: rocketUser.username
          }
        };
        this.addAliasToMsg(rocketUser.username, rocketMsgObj);
      }

      _.extend(rocketMsgObj, rocketMsgDataDefaults);

      if (slackMessage.edited) {
        rocketMsgObj.editedAt = new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000);
      }

      if (slackMessage.subtype === 'bot_message') {
        rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
          fields: {
            username: 1
          }
        });
      }

      if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
        rocketMsgObj.pinned = true;
        rocketMsgObj.pinnedAt = Date.now;
        rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
      }

      if (slackMessage.subtype === 'bot_message') {
        Meteor.setTimeout(() => {
          if (slackMessage.bot_id && slackMessage.ts && !RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts)) {
            RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
          }
        }, 500);
      } else {
        logger.rocket.debug('Send message to Rocket.Chat');
        RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
      }
    }
  }

  convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt) {
    if (!_.isEmpty(slackMsgTxt)) {
      slackMsgTxt = slackMsgTxt.replace(/<!everyone>/g, '@all');
      slackMsgTxt = slackMsgTxt.replace(/<!channel>/g, '@all');
      slackMsgTxt = slackMsgTxt.replace(/<!here>/g, '@here');
      slackMsgTxt = slackMsgTxt.replace(/&gt;/g, '>');
      slackMsgTxt = slackMsgTxt.replace(/&lt;/g, '<');
      slackMsgTxt = slackMsgTxt.replace(/&amp;/g, '&');
      slackMsgTxt = slackMsgTxt.replace(/:simple_smile:/g, ':smile:');
      slackMsgTxt = slackMsgTxt.replace(/:memo:/g, ':pencil:');
      slackMsgTxt = slackMsgTxt.replace(/:piggy:/g, ':pig:');
      slackMsgTxt = slackMsgTxt.replace(/:uk:/g, ':gb:');
      slackMsgTxt = slackMsgTxt.replace(/<(http[s]?:[^>]*)>/g, '$1');
      slackMsgTxt.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, (match, userId) => {
        if (!this.userTags[userId]) {
          this.findUser(userId) || this.addUser(userId); // This adds userTags for the userId
        }

        const userTags = this.userTags[userId];

        if (userTags) {
          slackMsgTxt = slackMsgTxt.replace(userTags.slack, userTags.rocket);
        }
      });
    } else {
      slackMsgTxt = '';
    }

    return slackMsgTxt;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"SlackAdapter.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_slackbridge/server/SlackAdapter.js                                                         //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  default: () => SlackAdapter
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 1);
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

class SlackAdapter {
  constructor(slackBridge) {
    logger.slack.debug('constructor');
    this.slackBridge = slackBridge;
    this.slackClient = require('@slack/client');
    this.rtm = {}; //slack-client Real Time Messaging API

    this.apiToken = {}; //Slack API Token passed in via Connect
    //On Slack, a rocket integration bot will be added to slack channels, this is the list of those channels, key is Rocket Ch ID

    this.slackChannelRocketBotMembershipMap = new Map(); //Key=RocketChannelID, Value=SlackChannel

    this.rocket = {};
  }
  /**
   * Connect to the remote Slack server using the passed in token API and register for Slack events
   * @param apiToken
   */


  connect(apiToken) {
    this.apiToken = apiToken;
    const RTMClient = this.slackClient.RTMClient;

    if (RTMClient != null) {
      RTMClient.disconnect;
    }

    this.rtm = new RTMClient(this.apiToken);
    this.rtm.start();
    this.registerForEvents();
    Meteor.startup(() => {
      try {
        this.populateMembershipChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
      } catch (err) {
        logger.slack.error('Error attempting to connect to Slack', err);
        this.slackBridge.disconnect();
      }
    });
  }
  /**
   * Unregister for slack events and disconnect from Slack
   */


  disconnect() {
    this.rtm.disconnect && this.rtm.disconnect;
  }

  setRocket(rocket) {
    this.rocket = rocket;
  }

  registerForEvents() {
    logger.slack.debug('Register for events');
    this.rtm.on('authenticated', () => {
      logger.slack.info('Connected to Slack');
    });
    this.rtm.on('unable_to_rtm_start', () => {
      this.slackBridge.disconnect();
    });
    this.rtm.on('disconnected', () => {
      logger.slack.info('Disconnected from Slack');
      this.slackBridge.disconnect();
    });
    /**
    * Event fired when someone messages a channel the bot is in
    * {
    *	type: 'message',
    * 	channel: [channel_id],
    * 	user: [user_id],
    * 	text: [message],
    * 	ts: [ts.milli],
    * 	team: [team_id],
    * 	subtype: [message_subtype],
    * 	inviter: [message_subtype = 'group_join|channel_join' -> user_id]
    * }
    **/

    this.rtm.on('message', Meteor.bindEnvironment(slackMessage => {
      logger.slack.debug('OnSlackEvent-MESSAGE: ', slackMessage);

      if (slackMessage) {
        try {
          this.onMessage(slackMessage);
        } catch (err) {
          logger.slack.error('Unhandled error onMessage', err);
        }
      }
    }));
    this.rtm.on('reaction_added', Meteor.bindEnvironment(reactionMsg => {
      logger.slack.debug('OnSlackEvent-REACTION_ADDED: ', reactionMsg);

      if (reactionMsg) {
        try {
          this.onReactionAdded(reactionMsg);
        } catch (err) {
          logger.slack.error('Unhandled error onReactionAdded', err);
        }
      }
    }));
    this.rtm.on('reaction_removed', Meteor.bindEnvironment(reactionMsg => {
      logger.slack.debug('OnSlackEvent-REACTION_REMOVED: ', reactionMsg);

      if (reactionMsg) {
        try {
          this.onReactionRemoved(reactionMsg);
        } catch (err) {
          logger.slack.error('Unhandled error onReactionRemoved', err);
        }
      }
    }));
    /**
     * Event fired when someone creates a public channel
     * {
    *	type: 'channel_created',
    *	channel: {
    *		id: [channel_id],
    *		is_channel: true,
    *		name: [channel_name],
    *		created: [ts],
    *		creator: [user_id],
    *		is_shared: false,
    *		is_org_shared: false
    *	},
    *	event_ts: [ts.milli]
    * }
     **/

    this.rtm.on('channel_created', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when the bot joins a public channel
     * {
    * 	type: 'channel_joined',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_channel: true,
    * 		created: [ts],
    * 		creator: [user_id],
    * 		is_archived: false,
    * 		is_general: false,
    * 		is_member: true,
    * 		last_read: [ts.milli],
    * 		latest: [message_obj],
    * 		unread_count: 0,
    * 		unread_count_display: 0,
    * 		members: [ user_ids ],
    * 		topic: {
    * 			value: [channel_topic],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		},
    * 		purpose: {
    * 			value: [channel_purpose],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		}
    * 	}
    * }
     **/

    this.rtm.on('channel_joined', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when the bot leaves (or is removed from) a public channel
     * {
    * 	type: 'channel_left',
    * 	channel: [channel_id]
    * }
     **/

    this.rtm.on('channel_left', Meteor.bindEnvironment(channelLeftMsg => {
      logger.slack.debug('OnSlackEvent-CHANNEL_LEFT: ', channelLeftMsg);

      if (channelLeftMsg) {
        try {
          this.onChannelLeft(channelLeftMsg);
        } catch (err) {
          logger.slack.error('Unhandled error onChannelLeft', err);
        }
      }
    }));
    /**
     * Event fired when an archived channel is deleted by an admin
     * {
    * 	type: 'channel_deleted',
    * 	channel: [channel_id],
    *	event_ts: [ts.milli]
    * }
     **/

    this.rtm.on('channel_deleted', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when the channel has its name changed
     * {
    * 	type: 'channel_rename',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_channel: true,
    * 		created: [ts]
    * 	},
    *	event_ts: [ts.milli]
    * }
     **/

    this.rtm.on('channel_rename', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when the bot joins a private channel
     * {
    * 	type: 'group_joined',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_group: true,
    * 		created: [ts],
    * 		creator: [user_id],
    * 		is_archived: false,
    * 		is_mpim: false,
    * 		is_open: true,
    * 		last_read: [ts.milli],
    * 		latest: [message_obj],
    * 		unread_count: 0,
    * 		unread_count_display: 0,
    * 		members: [ user_ids ],
    * 		topic: {
    * 			value: [channel_topic],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		},
    * 		purpose: {
    * 			value: [channel_purpose],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		}
    * 	}
    * }
     **/

    this.rtm.on('group_joined', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when the bot leaves (or is removed from) a private channel
     * {
    * 	type: 'group_left',
    * 	channel: [channel_id]
    * }
     **/

    this.rtm.on('group_left', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when the private channel has its name changed
     * {
    * 	type: 'group_rename',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_group: true,
    * 		created: [ts]
    * 	},
    *	event_ts: [ts.milli]
    * }
     **/

    this.rtm.on('group_rename', Meteor.bindEnvironment(() => {}));
    /**
     * Event fired when a new user joins the team
     * {
    * 	type: 'team_join',
    * 	user:
    * 	{
    * 		id: [user_id],
    * 		team_id: [team_id],
    * 		name: [user_name],
    * 		deleted: false,
    * 		status: null,
    * 		color: [color_code],
    * 		real_name: '',
    * 		tz: [timezone],
    * 		tz_label: [timezone_label],
    * 		tz_offset: [timezone_offset],
    * 		profile:
    * 		{
    * 			avatar_hash: '',
    * 			real_name: '',
    * 			real_name_normalized: '',
    * 			email: '',
    * 			image_24: '',
    * 			image_32: '',
    * 			image_48: '',
    * 			image_72: '',
    * 			image_192: '',
    * 			image_512: '',
    * 			fields: null
    * 		},
    * 		is_admin: false,
    * 		is_owner: false,
    * 		is_primary_owner: false,
    * 		is_restricted: false,
    * 		is_ultra_restricted: false,
    * 		is_bot: false,
    * 		presence: [user_presence]
    * 	},
    * 	cache_ts: [ts]
    * }
     **/

    this.rtm.on('team_join', Meteor.bindEnvironment(() => {}));
  }
  /*
   https://api.slack.com/events/reaction_removed
   */


  onReactionRemoved(slackReactionMsg) {
    if (slackReactionMsg) {
      const rocketUser = this.rocket.getUser(slackReactionMsg.user); //Lets find our Rocket originated message

      let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

      if (!rocketMsg) {
        //Must have originated from Slack
        const rocketID = this.rocket.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
        rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
      }

      if (rocketMsg && rocketUser) {
        const rocketReaction = `:${slackReactionMsg.reaction}:`; //If the Rocket user has already been removed, then this is an echo back from slack

        if (rocketMsg.reactions) {
          const theReaction = rocketMsg.reactions[rocketReaction];

          if (theReaction) {
            if (theReaction.usernames.indexOf(rocketUser.username) === -1) {
              return; //Reaction already removed
            }
          }
        } else {
          //Reaction already removed
          return;
        } //Stash this away to key off it later so we don't send it back to Slack


        this.slackBridge.reactionsMap.set(`unset${rocketMsg._id}${rocketReaction}`, rocketUser);
        logger.slack.debug('Removing reaction from Slack');
        Meteor.runAsUser(rocketUser._id, () => {
          Meteor.call('setReaction', rocketReaction, rocketMsg._id);
        });
      }
    }
  }
  /*
   https://api.slack.com/events/reaction_added
   */


  onReactionAdded(slackReactionMsg) {
    if (slackReactionMsg) {
      const rocketUser = this.rocket.getUser(slackReactionMsg.user);

      if (rocketUser.roles.includes('bot')) {
        return;
      } //Lets find our Rocket originated message


      let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

      if (!rocketMsg) {
        //Must have originated from Slack
        const rocketID = this.rocket.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
        rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
      }

      if (rocketMsg && rocketUser) {
        const rocketReaction = `:${slackReactionMsg.reaction}:`; //If the Rocket user has already reacted, then this is Slack echoing back to us

        if (rocketMsg.reactions) {
          const theReaction = rocketMsg.reactions[rocketReaction];

          if (theReaction) {
            if (theReaction.usernames.indexOf(rocketUser.username) !== -1) {
              return; //Already reacted
            }
          }
        } //Stash this away to key off it later so we don't send it back to Slack


        this.slackBridge.reactionsMap.set(`set${rocketMsg._id}${rocketReaction}`, rocketUser);
        logger.slack.debug('Adding reaction from Slack');
        Meteor.runAsUser(rocketUser._id, () => {
          Meteor.call('setReaction', rocketReaction, rocketMsg._id);
        });
      }
    }
  }

  onChannelLeft(channelLeftMsg) {
    this.removeSlackChannel(channelLeftMsg.channel);
  }
  /**
   * We have received a message from slack and we need to save/delete/update it into rocket
   * https://api.slack.com/events/message
   */


  onMessage(slackMessage, isImporting) {
    if (slackMessage.subtype) {
      switch (slackMessage.subtype) {
        case 'message_deleted':
          this.processMessageDeleted(slackMessage);
          break;

        case 'message_changed':
          this.processMessageChanged(slackMessage);
          break;

        case 'channel_join':
          this.processChannelJoin(slackMessage);
          break;

        default:
          //Keeping backwards compatability for now, refactor later
          this.processNewMessage(slackMessage, isImporting);
      }
    } else {
      //Simple message
      this.processNewMessage(slackMessage, isImporting);
    }
  }

  postGetChannelInfo(slackChID) {
    logger.slack.debug('Getting slack channel info', slackChID);
    const response = HTTP.get('https://slack.com/api/channels.info', {
      params: {
        token: this.apiToken,
        channel: slackChID
      }
    });

    if (response && response.data) {
      return response.data.channel;
    }
  }

  postFindChannel(rocketChannelName) {
    logger.slack.debug('Searching for Slack channel or group', rocketChannelName);
    let response = HTTP.get('https://slack.com/api/channels.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
      for (const channel of response.data.channels) {
        if (channel.name === rocketChannelName && channel.is_member === true) {
          return channel;
        }
      }
    }

    response = HTTP.get('https://slack.com/api/groups.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
      for (const group of response.data.groups) {
        if (group.name === rocketChannelName) {
          return group;
        }
      }
    }
  }
  /**
   * Retrieves the Slack TS from a Rocket msg that originated from Slack
   * @param rocketMsg
   * @returns Slack TS or undefined if not a message that originated from slack
   * @private
   */


  getTimeStamp(rocketMsg) {
    //slack-G3KJGGE15-1483081061-000169
    let slackTS;

    let index = rocketMsg._id.indexOf('slack-');

    if (index === 0) {
      //This is a msg that originated from Slack
      slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
      index = slackTS.indexOf('-');
      slackTS = slackTS.substr(index + 1, slackTS.length);
      slackTS = slackTS.replace('-', '.');
    } else {
      //This probably originated as a Rocket msg, but has been sent to Slack
      slackTS = rocketMsg.slackTs;
    }

    return slackTS;
  }
  /**
   * Adds a slack channel to our collection that the rocketbot is a member of on slack
   * @param rocketChID
   * @param slackChID
   */


  addSlackChannel(rocketChID, slackChID) {
    const ch = this.getSlackChannel(rocketChID);

    if (null == ch) {
      this.slackChannelRocketBotMembershipMap.set(rocketChID, {
        id: slackChID,
        family: slackChID.charAt(0) === 'C' ? 'channels' : 'groups'
      });
    }
  }

  removeSlackChannel(slackChID) {
    const keys = this.slackChannelRocketBotMembershipMap.keys();
    let slackChannel;
    let key;

    while ((key = keys.next().value) != null) {
      slackChannel = this.slackChannelRocketBotMembershipMap.get(key);

      if (slackChannel.id === slackChID) {
        //Found it, need to delete it
        this.slackChannelRocketBotMembershipMap.delete(key);
        break;
      }
    }
  }

  getSlackChannel(rocketChID) {
    return this.slackChannelRocketBotMembershipMap.get(rocketChID);
  }

  populateMembershipChannelMapByChannels() {
    const response = HTTP.get('https://slack.com/api/channels.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
      for (const slackChannel of response.data.channels) {
        const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackChannel.name, {
          fields: {
            _id: 1
          }
        });

        if (rocketchat_room) {
          if (slackChannel.is_member) {
            this.addSlackChannel(rocketchat_room._id, slackChannel.id);
          }
        }
      }
    }
  }

  populateMembershipChannelMapByGroups() {
    const response = HTTP.get('https://slack.com/api/groups.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
      for (const slackGroup of response.data.groups) {
        const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackGroup.name, {
          fields: {
            _id: 1
          }
        });

        if (rocketchat_room) {
          if (slackGroup.is_member) {
            this.addSlackChannel(rocketchat_room._id, slackGroup.id);
          }
        }
      }
    }
  }

  populateMembershipChannelMap() {
    logger.slack.debug('Populating channel map');
    this.populateMembershipChannelMapByChannels();
    this.populateMembershipChannelMapByGroups();
  }
  /*
   https://api.slack.com/methods/reactions.add
   */


  postReactionAdded(reaction, slackChannel, slackTS) {
    if (reaction && slackChannel && slackTS) {
      const data = {
        token: this.apiToken,
        name: reaction,
        channel: slackChannel,
        timestamp: slackTS
      };
      logger.slack.debug('Posting Add Reaction to Slack');
      const postResult = HTTP.post('https://slack.com/api/reactions.add', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.slack.debug('Reaction added to Slack');
      }
    }
  }
  /*
   https://api.slack.com/methods/reactions.remove
   */


  postReactionRemove(reaction, slackChannel, slackTS) {
    if (reaction && slackChannel && slackTS) {
      const data = {
        token: this.apiToken,
        name: reaction,
        channel: slackChannel,
        timestamp: slackTS
      };
      logger.slack.debug('Posting Remove Reaction to Slack');
      const postResult = HTTP.post('https://slack.com/api/reactions.remove', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.slack.debug('Reaction removed from Slack');
      }
    }
  }

  postDeleteMessage(rocketMessage) {
    if (rocketMessage) {
      const slackChannel = this.getSlackChannel(rocketMessage.rid);

      if (slackChannel != null) {
        const data = {
          token: this.apiToken,
          ts: this.getTimeStamp(rocketMessage),
          channel: this.getSlackChannel(rocketMessage.rid).id,
          as_user: true
        };
        logger.slack.debug('Post Delete Message to Slack', data);
        const postResult = HTTP.post('https://slack.com/api/chat.delete', {
          params: data
        });

        if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
          logger.slack.debug('Message deleted on Slack');
        }
      }
    }
  }

  postMessage(slackChannel, rocketMessage) {
    if (slackChannel && slackChannel.id) {
      let iconUrl = getAvatarUrlFromUsername(rocketMessage.u && rocketMessage.u.username);

      if (iconUrl) {
        iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
      }

      const data = {
        token: this.apiToken,
        text: rocketMessage.msg,
        channel: slackChannel.id,
        username: rocketMessage.u && rocketMessage.u.username,
        icon_url: iconUrl,
        link_names: 1
      };
      logger.slack.debug('Post Message To Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.postMessage', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.message && postResult.data.message.bot_id && postResult.data.message.ts) {
        RocketChat.models.Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.data.message.bot_id, postResult.data.message.ts);
        logger.slack.debug(`RocketMsgID=${rocketMessage._id} SlackMsgID=${postResult.data.message.ts} SlackBotID=${postResult.data.message.bot_id}`);
      }
    }
  }
  /*
   https://api.slack.com/methods/chat.update
   */


  postMessageUpdate(slackChannel, rocketMessage) {
    if (slackChannel && slackChannel.id) {
      const data = {
        token: this.apiToken,
        ts: this.getTimeStamp(rocketMessage),
        channel: slackChannel.id,
        text: rocketMessage.msg,
        as_user: true
      };
      logger.slack.debug('Post UpdateMessage To Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.update', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.slack.debug('Message updated on Slack');
      }
    }
  }

  processChannelJoin(slackMessage) {
    logger.slack.debug('Channel join', slackMessage.channel.id);
    const rocketCh = this.rocket.addChannel(slackMessage.channel);

    if (null != rocketCh) {
      this.addSlackChannel(rocketCh._id, slackMessage.channel);
    }
  }
  /*
   https://api.slack.com/events/message/message_deleted
   */


  processMessageDeleted(slackMessage) {
    if (slackMessage.previous_message) {
      const rocketChannel = this.rocket.getChannel(slackMessage);
      const rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
        fields: {
          username: 1
        }
      });

      if (rocketChannel && rocketUser) {
        //Find the Rocket message to delete
        let rocketMsgObj = RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.previous_message.bot_id, slackMessage.previous_message.ts);

        if (!rocketMsgObj) {
          //Must have been a Slack originated msg
          const _id = this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts);

          rocketMsgObj = RocketChat.models.Messages.findOneById(_id);
        }

        if (rocketMsgObj) {
          RocketChat.deleteMessage(rocketMsgObj, rocketUser);
          logger.slack.debug('Rocket message deleted by Slack');
        }
      }
    }
  }
  /*
   https://api.slack.com/events/message/message_changed
   */


  processMessageChanged(slackMessage) {
    if (slackMessage.previous_message) {
      const currentMsg = RocketChat.models.Messages.findOneById(this.rocket.createRocketID(slackMessage.channel, slackMessage.message.ts)); //Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)

      if (currentMsg && slackMessage.message.text !== currentMsg.msg) {
        const rocketChannel = this.rocket.getChannel(slackMessage);
        const rocketUser = slackMessage.previous_message.user ? this.rocket.findUser(slackMessage.previous_message.user) || this.rocket.addUser(slackMessage.previous_message.user) : null;
        const rocketMsgObj = {
          //@TODO _id
          _id: this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
          rid: rocketChannel._id,
          msg: this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.message.text),
          updatedBySlack: true //We don't want to notify slack about this change since Slack initiated it

        };
        RocketChat.updateMessage(rocketMsgObj, rocketUser);
        logger.slack.debug('Rocket message updated by Slack');
      }
    }
  }
  /*
   This method will get refactored and broken down into single responsibilities
   */


  processNewMessage(slackMessage, isImporting) {
    const rocketChannel = this.rocket.getChannel(slackMessage);
    let rocketUser = null;

    if (slackMessage.subtype === 'bot_message') {
      rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
        fields: {
          username: 1
        }
      });
    } else {
      rocketUser = slackMessage.user ? this.rocket.findUser(slackMessage.user) || this.rocket.addUser(slackMessage.user) : null;
    }

    if (rocketChannel && rocketUser) {
      const msgDataDefaults = {
        _id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000)
      };

      if (isImporting) {
        msgDataDefaults['imported'] = 'slackbridge';
      }

      try {
        this.rocket.createAndSaveMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, isImporting);
      } catch (e) {
        // http://www.mongodb.org/about/contributors/error-codes/
        // 11000 == duplicate key error
        if (e.name === 'MongoError' && e.code === 11000) {
          return;
        }

        throw e;
      }
    }
  }

  processBotMessage(rocketChannel, slackMessage) {
    const excludeBotNames = RocketChat.settings.get('SlackBridge_Botnames');

    if (slackMessage.username !== undefined && excludeBotNames && slackMessage.username.match(excludeBotNames)) {
      return;
    }

    const rocketMsgObj = {
      msg: this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
      rid: rocketChannel._id,
      bot: true,
      attachments: slackMessage.attachments,
      username: slackMessage.username || slackMessage.bot_id
    };
    this.rocket.addAliasToMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);

    if (slackMessage.icons) {
      rocketMsgObj.emoji = slackMessage.icons.emoji;
    }

    return rocketMsgObj;
  }

  processMeMessage(rocketUser, slackMessage) {
    return this.rocket.addAliasToMsg(rocketUser.username, {
      msg: `_${this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text)}_`
    });
  }

  processChannelJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (isImporting) {
      RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rocketChannel._id, rocketUser, {
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
        imported: 'slackbridge'
      });
    } else {
      RocketChat.addUserToRoom(rocketChannel._id, rocketUser);
    }
  }

  processGroupJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (slackMessage.inviter) {
      const inviter = slackMessage.inviter ? this.rocket.findUser(slackMessage.inviter) || this.rocket.addUser(slackMessage.inviter) : null;

      if (isImporting) {
        RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rocketChannel._id, rocketUser, {
          ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
          u: {
            _id: inviter._id,
            username: inviter.username
          },
          imported: 'slackbridge'
        });
      } else {
        RocketChat.addUserToRoom(rocketChannel._id, rocketUser, inviter);
      }
    }
  }

  processLeaveMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (isImporting) {
      RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rocketChannel._id, rocketUser, {
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
        imported: 'slackbridge'
      });
    } else {
      RocketChat.removeUserFromRoom(rocketChannel._id, rocketUser);
    }
  }

  processTopicMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (isImporting) {
      RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, {
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
        imported: 'slackbridge'
      });
    } else {
      RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
    }
  }

  processPurposeMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (isImporting) {
      RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, {
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
        imported: 'slackbridge'
      });
    } else {
      RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
    }
  }

  processNameMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (isImporting) {
      RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rocketChannel._id, slackMessage.name, rocketUser, {
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
        imported: 'slackbridge'
      });
    } else {
      RocketChat.saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
    }
  }

  processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (slackMessage.file && slackMessage.file.url_private_download !== undefined) {
      const details = {
        message_id: `slack-${slackMessage.ts.replace(/\./g, '-')}`,
        name: slackMessage.file.name,
        size: slackMessage.file.size,
        type: slackMessage.file.mimetype,
        rid: rocketChannel._id
      };
      return this.uploadFileFromSlack(details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
    }
  }

  processPinnedItemMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    if (slackMessage.attachments && slackMessage.attachments[0] && slackMessage.attachments[0].text) {
      const rocketMsgObj = {
        rid: rocketChannel._id,
        t: 'message_pinned',
        msg: '',
        u: {
          _id: rocketUser._id,
          username: rocketUser.username
        },
        attachments: [{
          'text': this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.attachments[0].text),
          'author_name': slackMessage.attachments[0].author_subname,
          'author_icon': getAvatarUrlFromUsername(slackMessage.attachments[0].author_subname),
          'ts': new Date(parseInt(slackMessage.attachments[0].ts.split('.')[0]) * 1000)
        }]
      };

      if (!isImporting) {
        RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${slackMessage.attachments[0].channel_id}-${slackMessage.attachments[0].ts.replace(/\./g, '-')}`, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
      }

      return rocketMsgObj;
    } else {
      logger.slack.error('Pinned item with no attachment');
    }
  }

  processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    switch (slackMessage.subtype) {
      case 'bot_message':
        return this.processBotMessage(rocketChannel, slackMessage);

      case 'me_message':
        return this.processMeMessage(rocketUser, slackMessage);

      case 'channel_join':
        return this.processChannelJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'group_join':
        return this.processGroupJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'channel_leave':
      case 'group_leave':
        return this.processLeaveMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'channel_topic':
      case 'group_topic':
        return this.processTopicMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'channel_purpose':
      case 'group_purpose':
        return this.processPurposeMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'channel_name':
      case 'group_name':
        return this.processNameMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'channel_archive':
      case 'group_archive':
        if (!isImporting) {
          RocketChat.archiveRoom(rocketChannel);
        }

        return;

      case 'channel_unarchive':
      case 'group_unarchive':
        if (!isImporting) {
          RocketChat.unarchiveRoom(rocketChannel);
        }

        return;

      case 'file_share':
        return this.processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'file_comment':
        logger.slack.error('File comment not implemented');
        return;

      case 'file_mention':
        logger.slack.error('File mentioned not implemented');
        return;

      case 'pinned_item':
        return this.processPinnedItemMessage(rocketChannel, rocketUser, slackMessage, isImporting);

      case 'unpinned_item':
        logger.slack.error('Unpinned item not implemented');
        return;
    }
  }
  /**
  Uploads the file to the storage.
  @param [Object] details an object with details about the upload. name, size, type, and rid
  @param [String] fileUrl url of the file to download/import
  @param [Object] user the Rocket.Chat user
  @param [Object] room the Rocket.Chat room
  @param [Date] timeStamp the timestamp the file was uploaded
  **/
  //details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);


  uploadFileFromSlack(details, slackFileURL, rocketUser, rocketChannel, timeStamp, isImporting) {
    const requestModule = /https/i.test(slackFileURL) ? https : http;
    const parsedUrl = url.parse(slackFileURL, true);
    parsedUrl.headers = {
      'Authorization': `Bearer ${this.apiToken}`
    };
    requestModule.get(parsedUrl, Meteor.bindEnvironment(stream => {
      const fileStore = FileUpload.getStore('Uploads');
      fileStore.insert(details, stream, (err, file) => {
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
            attachment.image_dimensions = file.identify && file.identify.size;
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

          if (isImporting) {
            msg.imported = 'slackbridge';
          }

          if (details.message_id && typeof details.message_id === 'string') {
            msg['_id'] = details.message_id;
          }

          return RocketChat.sendMessage(rocketUser, msg, rocketChannel, true);
        }
      });
    }));
  }

  importFromHistory(family, options) {
    logger.slack.debug('Importing messages history');
    const response = HTTP.get(`https://slack.com/api/${family}.history`, {
      params: _.extend({
        token: this.apiToken
      }, options)
    });

    if (response && response.data && _.isArray(response.data.messages) && response.data.messages.length > 0) {
      let latest = 0;

      for (const message of response.data.messages.reverse()) {
        logger.slack.debug('MESSAGE: ', message);

        if (!latest || message.ts > latest) {
          latest = message.ts;
        }

        message.channel = options.channel;
        this.onMessage(message, true);
      }

      return {
        has_more: response.data.has_more,
        ts: latest
      };
    }
  }

  copyChannelInfo(rid, channelMap) {
    logger.slack.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
    const response = HTTP.get(`https://slack.com/api/${channelMap.family}.info`, {
      params: {
        token: this.apiToken,
        channel: channelMap.id
      }
    });

    if (response && response.data) {
      const data = channelMap.family === 'channels' ? response.data.channel : response.data.group;

      if (data && _.isArray(data.members) && data.members.length > 0) {
        for (const member of data.members) {
          const user = this.rocket.findUser(member) || this.rocket.addUser(member);

          if (user) {
            logger.slack.debug('Adding user to room', user.username, rid);
            RocketChat.addUserToRoom(rid, user, null, true);
          }
        }
      }

      let topic = '';
      let topic_last_set = 0;
      let topic_creator = null;

      if (data && data.topic && data.topic.value) {
        topic = data.topic.value;
        topic_last_set = data.topic.last_set;
        topic_creator = data.topic.creator;
      }

      if (data && data.purpose && data.purpose.value) {
        if (topic_last_set) {
          if (topic_last_set < data.purpose.last_set) {
            topic = data.purpose.topic;
            topic_creator = data.purpose.creator;
          }
        } else {
          topic = data.purpose.topic;
          topic_creator = data.purpose.creator;
        }
      }

      if (topic) {
        const creator = this.rocket.findUser(topic_creator) || this.rocket.addUser(topic_creator);
        logger.slack.debug('Setting room topic', rid, topic, creator.username);
        RocketChat.saveRoomTopic(rid, topic, creator, false);
      }
    }
  }

  copyPins(rid, channelMap) {
    const response = HTTP.get('https://slack.com/api/pins.list', {
      params: {
        token: this.apiToken,
        channel: channelMap.id
      }
    });

    if (response && response.data && _.isArray(response.data.items) && response.data.items.length > 0) {
      for (const pin of response.data.items) {
        if (pin.message) {
          const user = this.rocket.findUser(pin.message.user);
          const msgObj = {
            rid,
            t: 'message_pinned',
            msg: '',
            u: {
              _id: user._id,
              username: user.username
            },
            attachments: [{
              'text': this.rocket.convertSlackMsgTxtToRocketTxtFormat(pin.message.text),
              'author_name': user.username,
              'author_icon': getAvatarUrlFromUsername(user.username),
              'ts': new Date(parseInt(pin.message.ts.split('.')[0]) * 1000)
            }]
          };
          RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${pin.channel}-${pin.message.ts.replace(/\./g, '-')}`, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
        }
      }
    }
  }

  importMessages(rid, callback) {
    logger.slack.info('importMessages: ', rid);
    const rocketchat_room = RocketChat.models.Rooms.findOneById(rid);

    if (rocketchat_room) {
      if (this.getSlackChannel(rid)) {
        this.copyChannelInfo(rid, this.getSlackChannel(rid));
        logger.slack.debug('Importing messages from Slack to Rocket.Chat', this.getSlackChannel(rid), rid);
        let results = this.importFromHistory(this.getSlackChannel(rid).family, {
          channel: this.getSlackChannel(rid).id,
          oldest: 1
        });

        while (results && results.has_more) {
          results = this.importFromHistory(this.getSlackChannel(rid).family, {
            channel: this.getSlackChannel(rid).id,
            oldest: results.ts
          });
        }

        logger.slack.debug('Pinning Slack channel messages to Rocket.Chat', this.getSlackChannel(rid), rid);
        this.copyPins(rid, this.getSlackChannel(rid));
        return callback();
      } else {
        const slack_room = this.postFindChannel(rocketchat_room.name);

        if (slack_room) {
          this.addSlackChannel(rid, slack_room.id);
          return this.importMessages(rid, callback);
        } else {
          logger.slack.error('Could not find Slack room with specified name', rocketchat_room.name);
          return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
        }
      }
    } else {
      logger.slack.error('Could not find Rocket.Chat room with specified id', rid);
      return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slackbridge/server/logger.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/settings.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/slackbridge.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/slackbridge_import.server.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/RocketAdapter.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/SlackAdapter.js");

/* Exports */
Package._define("rocketchat:slackbridge");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slackbridge.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFja2JyaWRnZS9zZXJ2ZXIvbG9nZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNsYWNrYnJpZGdlL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFja2JyaWRnZS9zZXJ2ZXIvc2xhY2ticmlkZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhY2ticmlkZ2Uvc2VydmVyL3NsYWNrYnJpZGdlX2ltcG9ydC5zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhY2ticmlkZ2Uvc2VydmVyL1JvY2tldEFkYXB0ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhY2ticmlkZ2Uvc2VydmVyL1NsYWNrQWRhcHRlci5qcyJdLCJuYW1lcyI6WyJsb2dnZXIiLCJMb2dnZXIiLCJzZWN0aW9ucyIsImNvbm5lY3Rpb24iLCJldmVudHMiLCJjbGFzcyIsInNsYWNrIiwicm9ja2V0IiwiTWV0ZW9yIiwic3RhcnR1cCIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSIsImkxOG5MYWJlbCIsInB1YmxpYyIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwidmFsdWUiLCJpMThuRGVzY3JpcHRpb24iLCJTbGFja0FkYXB0ZXIiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIlJvY2tldEFkYXB0ZXIiLCJTbGFja0JyaWRnZSIsImNvbnN0cnVjdG9yIiwicmVhY3Rpb25zTWFwIiwiTWFwIiwiY29ubmVjdGVkIiwic2V0U2xhY2siLCJzZXRSb2NrZXQiLCJwcm9jZXNzU2V0dGluZ3MiLCJjb25uZWN0IiwiYXBpVG9rZW4iLCJnZXQiLCJpbmZvIiwiZGlzY29ubmVjdCIsImtleSIsImRlYnVnIiwiYWxpYXNGb3JtYXQiLCJleGNsdWRlQm90bmFtZXMiLCJTbGFja0JyaWRnZUltcG9ydCIsImNvbW1hbmQiLCJwYXJhbXMiLCJpdGVtIiwiTWF0Y2giLCJ0ZXN0IiwiU3RyaW5nIiwicm9vbSIsIm1vZGVscyIsIlJvb21zIiwiZmluZE9uZUJ5SWQiLCJyaWQiLCJjaGFubmVsIiwibmFtZSIsInVzZXIiLCJ1c2VycyIsImZpbmRPbmUiLCJ1c2VySWQiLCJtc2dTdHJlYW0iLCJlbWl0IiwiUmFuZG9tIiwiaWQiLCJ1IiwidXNlcm5hbWUiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsImltcG9ydE1lc3NhZ2VzIiwiZXJyb3IiLCJtZXNzYWdlIiwic2xhc2hDb21tYW5kcyIsImV4cG9ydCIsIl8iLCJzbGFja0JyaWRnZSIsInV0aWwiLCJOcG0iLCJ1c2VyVGFncyIsInJlZ2lzdGVyRm9yRXZlbnRzIiwidW5yZWdpc3RlckZvckV2ZW50cyIsImNhbGxiYWNrcyIsIm9uTWVzc2FnZSIsImJpbmQiLCJwcmlvcml0eSIsIkxPVyIsIm9uTWVzc2FnZURlbGV0ZSIsIm9uU2V0UmVhY3Rpb24iLCJvblVuU2V0UmVhY3Rpb24iLCJyZW1vdmUiLCJyb2NrZXRNZXNzYWdlRGVsZXRlZCIsImdldFNsYWNrQ2hhbm5lbCIsInBvc3REZWxldGVNZXNzYWdlIiwiZXJyIiwicm9ja2V0TXNnSUQiLCJyZWFjdGlvbiIsImRlbGV0ZSIsInJvY2tldE1zZyIsIk1lc3NhZ2VzIiwic2xhY2tDaGFubmVsIiwic2xhY2tUUyIsImdldFRpbWVTdGFtcCIsInBvc3RSZWFjdGlvbkFkZGVkIiwicmVwbGFjZSIsInBvc3RSZWFjdGlvblJlbW92ZSIsInJvY2tldE1lc3NhZ2UiLCJlZGl0ZWRBdCIsInByb2Nlc3NNZXNzYWdlQ2hhbmdlZCIsImluZGV4T2YiLCJwcm9jZXNzU2VuZE1lc3NhZ2UiLCJwb3N0TWVzc2FnZSIsIm91dFNsYWNrQ2hhbm5lbHMiLCJwbHVjayIsInVwZGF0ZWRCeVNsYWNrIiwicG9zdE1lc3NhZ2VVcGRhdGUiLCJnZXRDaGFubmVsIiwic2xhY2tNZXNzYWdlIiwiZmluZENoYW5uZWwiLCJhZGRDaGFubmVsIiwiZ2V0VXNlciIsInNsYWNrVXNlciIsImZpbmRVc2VyIiwiYWRkVXNlciIsImNyZWF0ZVJvY2tldElEIiwic2xhY2tDaGFubmVsSWQiLCJmaW5kT25lQnlJbXBvcnRJZCIsInNsYWNrQ2hhbm5lbElEIiwiaGFzUmV0cmllZCIsInNsYWNrUmVzdWx0cyIsImlzR3JvdXAiLCJjaGFyQXQiLCJIVFRQIiwidG9rZW4iLCJkYXRhIiwib2siLCJyb2NrZXRDaGFubmVsRGF0YSIsImdyb3VwIiwiZXhpc3RpbmdSb2NrZXRSb29tIiwiZmluZE9uZUJ5TmFtZSIsImlzX2dlbmVyYWwiLCJyb2NrZXRJZCIsImFkZEltcG9ydElkcyIsInJvY2tldFVzZXJzIiwibWVtYmVyIiwibWVtYmVycyIsImNyZWF0b3IiLCJyb2NrZXRVc2VyIiwicHVzaCIsInJvY2tldFVzZXJDcmVhdG9yIiwicm9ja2V0Q2hhbm5lbCIsImNyZWF0ZVJvb20iLCJlIiwiX3NsZWVwRm9yTXMiLCJjb25zb2xlIiwibG9nIiwicm9vbVVwZGF0ZSIsImNyZWF0ZWQiLCJsYXN0U2V0VG9waWMiLCJpc0VtcHR5IiwidG9waWMiLCJsYXN0X3NldCIsInB1cnBvc2UiLCJhZGRTbGFja0NoYW5uZWwiLCJzbGFja1VzZXJJRCIsIlVzZXJzIiwicm9ja2V0VXNlckRhdGEiLCJpc0JvdCIsImlzX2JvdCIsImVtYWlsIiwicHJvZmlsZSIsImV4aXN0aW5nUm9ja2V0VXNlciIsImZpbmRPbmVCeUVtYWlsQWRkcmVzcyIsImZpbmRPbmVCeVVzZXJuYW1lIiwibmV3VXNlciIsInBhc3N3b3JkIiwiam9pbkRlZmF1bHRDaGFubmVscyIsIkFjY291bnRzIiwiY3JlYXRlVXNlciIsInVzZXJVcGRhdGUiLCJ1dGNPZmZzZXQiLCJ0el9vZmZzZXQiLCJyb2xlcyIsInJlYWxfbmFtZSIsImRlbGV0ZWQiLCJ1cGRhdGUiLCIkc2V0IiwidXJsIiwiaW1hZ2Vfb3JpZ2luYWwiLCJpbWFnZV81MTIiLCJzZXRVc2VyQXZhdGFyIiwiaW1wb3J0SWRzIiwiYm90X2lkIiwiYWRkQWxpYXNUb01zZyIsInJvY2tldFVzZXJOYW1lIiwicm9ja2V0TXNnT2JqIiwiYWxpYXMiLCJmb3JtYXQiLCJjcmVhdGVBbmRTYXZlTWVzc2FnZSIsInJvY2tldE1zZ0RhdGFEZWZhdWx0cyIsImlzSW1wb3J0aW5nIiwic3VidHlwZSIsInByb2Nlc3NTdWJ0eXBlZE1lc3NhZ2UiLCJjb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdCIsInRleHQiLCJleHRlbmQiLCJlZGl0ZWQiLCJwYXJzZUludCIsInNwbGl0IiwiZmllbGRzIiwicGlubmVkX3RvIiwicGlubmVkIiwicGlubmVkQXQiLCJub3ciLCJwaW5uZWRCeSIsInBpY2siLCJzZXRUaW1lb3V0IiwiZmluZE9uZUJ5U2xhY2tCb3RJZEFuZFNsYWNrVHMiLCJzZW5kTWVzc2FnZSIsInNsYWNrTXNnVHh0IiwibWF0Y2giLCJodHRwIiwiaHR0cHMiLCJzbGFja0NsaWVudCIsInJ0bSIsInNsYWNrQ2hhbm5lbFJvY2tldEJvdE1lbWJlcnNoaXBNYXAiLCJSVE1DbGllbnQiLCJzdGFydCIsInBvcHVsYXRlTWVtYmVyc2hpcENoYW5uZWxNYXAiLCJvbiIsImJpbmRFbnZpcm9ubWVudCIsInJlYWN0aW9uTXNnIiwib25SZWFjdGlvbkFkZGVkIiwib25SZWFjdGlvblJlbW92ZWQiLCJjaGFubmVsTGVmdE1zZyIsIm9uQ2hhbm5lbExlZnQiLCJzbGFja1JlYWN0aW9uTXNnIiwiZmluZE9uZUJ5U2xhY2tUcyIsInJvY2tldElEIiwicm9ja2V0UmVhY3Rpb24iLCJyZWFjdGlvbnMiLCJ0aGVSZWFjdGlvbiIsInVzZXJuYW1lcyIsInNldCIsInJ1bkFzVXNlciIsImNhbGwiLCJpbmNsdWRlcyIsInJlbW92ZVNsYWNrQ2hhbm5lbCIsInByb2Nlc3NNZXNzYWdlRGVsZXRlZCIsInByb2Nlc3NDaGFubmVsSm9pbiIsInByb2Nlc3NOZXdNZXNzYWdlIiwicG9zdEdldENoYW5uZWxJbmZvIiwic2xhY2tDaElEIiwicmVzcG9uc2UiLCJwb3N0RmluZENoYW5uZWwiLCJyb2NrZXRDaGFubmVsTmFtZSIsImlzQXJyYXkiLCJjaGFubmVscyIsImxlbmd0aCIsImlzX21lbWJlciIsImdyb3VwcyIsImluZGV4Iiwic3Vic3RyIiwic2xhY2tUcyIsInJvY2tldENoSUQiLCJjaCIsImZhbWlseSIsImtleXMiLCJuZXh0IiwicG9wdWxhdGVNZW1iZXJzaGlwQ2hhbm5lbE1hcEJ5Q2hhbm5lbHMiLCJyb2NrZXRjaGF0X3Jvb20iLCJwb3B1bGF0ZU1lbWJlcnNoaXBDaGFubmVsTWFwQnlHcm91cHMiLCJzbGFja0dyb3VwIiwidGltZXN0YW1wIiwicG9zdFJlc3VsdCIsInBvc3QiLCJzdGF0dXNDb2RlIiwiYXNfdXNlciIsImljb25VcmwiLCJnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUiLCJhYnNvbHV0ZVVybCIsImljb25fdXJsIiwibGlua19uYW1lcyIsInNldFNsYWNrQm90SWRBbmRTbGFja1RzIiwicm9ja2V0Q2giLCJwcmV2aW91c19tZXNzYWdlIiwiZGVsZXRlTWVzc2FnZSIsImN1cnJlbnRNc2ciLCJ1cGRhdGVNZXNzYWdlIiwibXNnRGF0YURlZmF1bHRzIiwiY29kZSIsInByb2Nlc3NCb3RNZXNzYWdlIiwiZXhjbHVkZUJvdE5hbWVzIiwidW5kZWZpbmVkIiwiYm90IiwiYXR0YWNobWVudHMiLCJpY29ucyIsImVtb2ppIiwicHJvY2Vzc01lTWVzc2FnZSIsInByb2Nlc3NDaGFubmVsSm9pbk1lc3NhZ2UiLCJjcmVhdGVVc2VySm9pbldpdGhSb29tSWRBbmRVc2VyIiwiaW1wb3J0ZWQiLCJhZGRVc2VyVG9Sb29tIiwicHJvY2Vzc0dyb3VwSm9pbk1lc3NhZ2UiLCJpbnZpdGVyIiwiY3JlYXRlVXNlckFkZGVkV2l0aFJvb21JZEFuZFVzZXIiLCJwcm9jZXNzTGVhdmVNZXNzYWdlIiwiY3JlYXRlVXNlckxlYXZlV2l0aFJvb21JZEFuZFVzZXIiLCJyZW1vdmVVc2VyRnJvbVJvb20iLCJwcm9jZXNzVG9waWNNZXNzYWdlIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJzYXZlUm9vbVRvcGljIiwicHJvY2Vzc1B1cnBvc2VNZXNzYWdlIiwicHJvY2Vzc05hbWVNZXNzYWdlIiwiY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyIiwic2F2ZVJvb21OYW1lIiwicHJvY2Vzc1NoYXJlTWVzc2FnZSIsImZpbGUiLCJ1cmxfcHJpdmF0ZV9kb3dubG9hZCIsImRldGFpbHMiLCJtZXNzYWdlX2lkIiwic2l6ZSIsIm1pbWV0eXBlIiwidXBsb2FkRmlsZUZyb21TbGFjayIsInByb2Nlc3NQaW5uZWRJdGVtTWVzc2FnZSIsInQiLCJhdXRob3Jfc3VibmFtZSIsInNldFBpbm5lZEJ5SWRBbmRVc2VySWQiLCJjaGFubmVsX2lkIiwiYXJjaGl2ZVJvb20iLCJ1bmFyY2hpdmVSb29tIiwic2xhY2tGaWxlVVJMIiwidGltZVN0YW1wIiwicmVxdWVzdE1vZHVsZSIsInBhcnNlZFVybCIsInBhcnNlIiwiaGVhZGVycyIsInN0cmVhbSIsImZpbGVTdG9yZSIsIkZpbGVVcGxvYWQiLCJnZXRTdG9yZSIsImluc2VydCIsIkVycm9yIiwiYXR0YWNobWVudCIsInRpdGxlIiwidGl0bGVfbGluayIsImltYWdlX3VybCIsImltYWdlX3R5cGUiLCJpbWFnZV9zaXplIiwiaW1hZ2VfZGltZW5zaW9ucyIsImlkZW50aWZ5IiwiYXVkaW9fdXJsIiwiYXVkaW9fdHlwZSIsImF1ZGlvX3NpemUiLCJ2aWRlb191cmwiLCJ2aWRlb190eXBlIiwidmlkZW9fc2l6ZSIsImdyb3VwYWJsZSIsImltcG9ydEZyb21IaXN0b3J5Iiwib3B0aW9ucyIsIm1lc3NhZ2VzIiwibGF0ZXN0IiwicmV2ZXJzZSIsImhhc19tb3JlIiwiY29weUNoYW5uZWxJbmZvIiwiY2hhbm5lbE1hcCIsInRvcGljX2xhc3Rfc2V0IiwidG9waWNfY3JlYXRvciIsImNvcHlQaW5zIiwiaXRlbXMiLCJwaW4iLCJtc2dPYmoiLCJjYWxsYmFjayIsInJlc3VsdHMiLCJvbGRlc3QiLCJzbGFja19yb29tIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7QUFFQUEsU0FBUyxJQUFJQyxNQUFKLENBQVcsYUFBWCxFQUEwQjtBQUNsQ0MsWUFBVTtBQUNUQyxnQkFBWSxZQURIO0FBRVRDLFlBQVEsUUFGQztBQUdUQyxXQUFPLE9BSEU7QUFJVEMsV0FBTyxPQUpFO0FBS1RDLFlBQVE7QUFMQztBQUR3QixDQUExQixDQUFULEM7Ozs7Ozs7Ozs7O0FDSEFDLE9BQU9DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCQyxhQUFXQyxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixhQUE3QixFQUE0QyxZQUFXO0FBQ3RELFNBQUtDLEdBQUwsQ0FBUyxxQkFBVCxFQUFnQyxLQUFoQyxFQUF1QztBQUN0Q0MsWUFBTSxTQURnQztBQUV0Q0MsaUJBQVcsU0FGMkI7QUFHdENDLGNBQVE7QUFIOEIsS0FBdkM7QUFNQSxTQUFLSCxHQUFMLENBQVMsc0JBQVQsRUFBaUMsRUFBakMsRUFBcUM7QUFDcENDLFlBQU0sUUFEOEI7QUFFcENHLG1CQUFhO0FBQ1pDLGFBQUsscUJBRE87QUFFWkMsZUFBTztBQUZLLE9BRnVCO0FBTXBDSixpQkFBVztBQU55QixLQUFyQztBQVNBLFNBQUtGLEdBQUwsQ0FBUyx5QkFBVCxFQUFvQyxFQUFwQyxFQUF3QztBQUN2Q0MsWUFBTSxRQURpQztBQUV2Q0csbUJBQWE7QUFDWkMsYUFBSyxxQkFETztBQUVaQyxlQUFPO0FBRkssT0FGMEI7QUFNdkNKLGlCQUFXLGNBTjRCO0FBT3ZDSyx1QkFBaUI7QUFQc0IsS0FBeEM7QUFVQSxTQUFLUCxHQUFMLENBQVMsNkJBQVQsRUFBd0MsRUFBeEMsRUFBNEM7QUFDM0NDLFlBQU0sUUFE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VSxTQUFTLElBQUluWCxPQUFPcVYsS0FBWCxDQUFpQiw0QkFBakIsRUFBK0MsK0NBQS9DLENBQVQsQ0FBUDtBQUNBO0FBQ0Q7QUFDRCxLQXhCRCxNQXdCTztBQUNON1YsYUFBT00sS0FBUCxDQUFhd0UsS0FBYixDQUFtQixtREFBbkIsRUFBd0V0QixHQUF4RTtBQUNBLGFBQU9tVSxTQUFTLElBQUluWCxPQUFPcVYsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsQ0FBVCxDQUFQO0FBQ0E7QUFDRDs7QUE1a0NnQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NsYWNrYnJpZGdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBsb2dnZXI6dHJ1ZSAqL1xuLyogZXhwb3J0ZWQgbG9nZ2VyICovXG5cbmxvZ2dlciA9IG5ldyBMb2dnZXIoJ1NsYWNrQnJpZGdlJywge1xuXHRzZWN0aW9uczoge1xuXHRcdGNvbm5lY3Rpb246ICdDb25uZWN0aW9uJyxcblx0XHRldmVudHM6ICdFdmVudHMnLFxuXHRcdGNsYXNzOiAnQ2xhc3MnLFxuXHRcdHNsYWNrOiAnU2xhY2snLFxuXHRcdHJvY2tldDogJ1JvY2tldCdcblx0fVxufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnU2xhY2tCcmlkZ2UnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRpMThuTGFiZWw6ICdFbmFibGVkJyxcblx0XHRcdHB1YmxpYzogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ1NsYWNrQnJpZGdlX0FQSVRva2VuJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkxhYmVsOiAnQVBJX1Rva2VuJ1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkxhYmVsOiAnQWxpYXNfRm9ybWF0Jyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0FsaWFzX0Zvcm1hdF9EZXNjcmlwdGlvbidcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdTbGFja0JyaWRnZV9FeGNsdWRlQm90bmFtZXMnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdTbGFja0JyaWRnZV9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpMThuTGFiZWw6ICdFeGNsdWRlX0JvdG5hbWVzJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0V4Y2x1ZGVfQm90bmFtZXNfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0FsbCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdF9pZDogJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH1dXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0NoYW5uZWxzJywgJycsIHtcblx0XHRcdHR5cGU6ICdyb29tUGljaycsXG5cdFx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdF9pZDogJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH0sIHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfT3V0X0FsbCcsXG5cdFx0XHRcdHZhbHVlOiBmYWxzZVxuXHRcdFx0fV1cblx0XHR9KTtcblx0fSk7XG59KTtcbiIsIi8qIGdsb2JhbHMgbG9nZ2VyICovXG5cbmltcG9ydCBTbGFja0FkYXB0ZXIgZnJvbSAnLi9TbGFja0FkYXB0ZXIuanMnO1xuaW1wb3J0IFJvY2tldEFkYXB0ZXIgZnJvbSAnLi9Sb2NrZXRBZGFwdGVyLmpzJztcblxuLyoqXG4gKiBTbGFja0JyaWRnZSBpbnRlcmZhY2VzIGJldHdlZW4gdGhpcyBSb2NrZXQgaW5zdGFsbGF0aW9uIGFuZCBhIHJlbW90ZSBTbGFjayBpbnN0YWxsYXRpb24uXG4gKi9cbmNsYXNzIFNsYWNrQnJpZGdlIHtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnNsYWNrID0gbmV3IFNsYWNrQWRhcHRlcih0aGlzKTtcblx0XHR0aGlzLnJvY2tldCA9IG5ldyBSb2NrZXRBZGFwdGVyKHRoaXMpO1xuXHRcdHRoaXMucmVhY3Rpb25zTWFwID0gbmV3IE1hcCgpO1x0Ly9TeW5jIG9iamVjdCBiZXR3ZWVuIHJvY2tldCBhbmQgc2xhY2tcblxuXHRcdHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG5cdFx0dGhpcy5yb2NrZXQuc2V0U2xhY2sodGhpcy5zbGFjayk7XG5cdFx0dGhpcy5zbGFjay5zZXRSb2NrZXQodGhpcy5yb2NrZXQpO1xuXG5cdFx0dGhpcy5wcm9jZXNzU2V0dGluZ3MoKTtcblx0fVxuXG5cdGNvbm5lY3QoKSB7XG5cdFx0aWYgKHRoaXMuY29ubmVjdGVkID09PSBmYWxzZSkge1xuXG5cdFx0XHR0aGlzLnNsYWNrLmNvbm5lY3QodGhpcy5hcGlUb2tlbik7XG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJykpIHtcblx0XHRcdFx0dGhpcy5yb2NrZXQuY29ubmVjdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG5cdFx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdFbmFibGVkJyk7XG5cdFx0fVxuXHR9XG5cblx0ZGlzY29ubmVjdCgpIHtcblx0XHRpZiAodGhpcy5jb25uZWN0ZWQgPT09IHRydWUpIHtcblx0XHRcdHRoaXMucm9ja2V0LmRpc2Nvbm5lY3QoKTtcblx0XHRcdHRoaXMuc2xhY2suZGlzY29ubmVjdCgpO1xuXHRcdFx0dGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcblx0XHRcdGxvZ2dlci5jb25uZWN0aW9uLmluZm8oJ0Rpc2FibGVkJyk7XG5cdFx0fVxuXHR9XG5cblx0cHJvY2Vzc1NldHRpbmdzKCkge1xuXHRcdC8vU2xhY2sgaW5zdGFsbGF0aW9uIEFQSSB0b2tlblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9BUElUb2tlbicsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRpZiAodmFsdWUgIT09IHRoaXMuYXBpVG9rZW4pIHtcblx0XHRcdFx0dGhpcy5hcGlUb2tlbiA9IHZhbHVlO1xuXHRcdFx0XHRpZiAodGhpcy5jb25uZWN0ZWQpIHtcblx0XHRcdFx0XHR0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHRcdFx0XHR0aGlzLmNvbm5lY3QoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoYFNldHRpbmc6ICR7IGtleSB9YCwgdmFsdWUpO1xuXHRcdH0pO1xuXG5cdFx0Ly9JbXBvcnQgbWVzc2FnZXMgZnJvbSBTbGFjayB3aXRoIGFuIGFsaWFzOyAlcyBpcyByZXBsYWNlZCBieSB0aGUgdXNlcm5hbWUgb2YgdGhlIHVzZXIuIElmIGVtcHR5LCBubyBhbGlhcyB3aWxsIGJlIHVzZWQuXG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0JywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHRoaXMuYWxpYXNGb3JtYXQgPSB2YWx1ZTtcblx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZyhgU2V0dGluZzogJHsga2V5IH1gLCB2YWx1ZSk7XG5cdFx0fSk7XG5cblx0XHQvL0RvIG5vdCBwcm9wYWdhdGUgbWVzc2FnZXMgZnJvbSBib3RzIHdob3NlIG5hbWUgbWF0Y2hlcyB0aGUgcmVndWxhciBleHByZXNzaW9uIGFib3ZlLiBJZiBsZWZ0IGVtcHR5LCBhbGwgbWVzc2FnZXMgZnJvbSBib3RzIHdpbGwgYmUgcHJvcGFnYXRlZC5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfRXhjbHVkZUJvdG5hbWVzJywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHRoaXMuZXhjbHVkZUJvdG5hbWVzID0gdmFsdWU7XG5cdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoYFNldHRpbmc6ICR7IGtleSB9YCwgdmFsdWUpO1xuXHRcdH0pO1xuXG5cdFx0Ly9JcyB0aGlzIGVudGlyZSBTbGFja0JyaWRnZSBlbmFibGVkXG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX0VuYWJsZWQnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0aWYgKHZhbHVlICYmIHRoaXMuYXBpVG9rZW4pIHtcblx0XHRcdFx0dGhpcy5jb25uZWN0KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHRcdH1cblx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZyhgU2V0dGluZzogJHsga2V5IH1gLCB2YWx1ZSk7XG5cdFx0fSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5TbGFja0JyaWRnZSA9IG5ldyBTbGFja0JyaWRnZTtcbiIsIi8qIGdsb2JhbHMgbXNnU3RyZWFtICovXG5mdW5jdGlvbiBTbGFja0JyaWRnZUltcG9ydChjb21tYW5kLCBwYXJhbXMsIGl0ZW0pIHtcblx0aWYgKGNvbW1hbmQgIT09ICdzbGFja2JyaWRnZS1pbXBvcnQnIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpdGVtLnJpZCk7XG5cdGNvbnN0IGNoYW5uZWwgPSByb29tLm5hbWU7XG5cdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShNZXRlb3IudXNlcklkKCkpO1xuXG5cdG1zZ1N0cmVhbS5lbWl0KGl0ZW0ucmlkLCB7XG5cdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdHU6IHsgdXNlcm5hbWU6ICdyb2NrZXQuY2F0JyB9LFxuXHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdG1zZzogVEFQaTE4bi5fXygnU2xhY2tCcmlkZ2Vfc3RhcnQnLCB7XG5cdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0c3ByaW50ZjogW3VzZXIudXNlcm5hbWUsIGNoYW5uZWxdXG5cdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0fSk7XG5cblx0dHJ5IHtcblx0XHRSb2NrZXRDaGF0LlNsYWNrQnJpZGdlLmltcG9ydE1lc3NhZ2VzKGl0ZW0ucmlkLCBlcnJvciA9PiB7XG5cdFx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdFx0bXNnU3RyZWFtLmVtaXQoaXRlbS5yaWQsIHtcblx0XHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdFx0dTogeyB1c2VybmFtZTogJ3JvY2tldC5jYXQnIH0sXG5cdFx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKCdTbGFja0JyaWRnZV9lcnJvcicsIHtcblx0XHRcdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdFx0XHRzcHJpbnRmOiBbY2hhbm5lbCwgZXJyb3IubWVzc2FnZV1cblx0XHRcdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZ1N0cmVhbS5lbWl0KGl0ZW0ucmlkLCB7XG5cdFx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHRcdHU6IHsgdXNlcm5hbWU6ICdyb2NrZXQuY2F0JyB9LFxuXHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnU2xhY2tCcmlkZ2VfZmluaXNoJywge1xuXHRcdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRcdHNwcmludGY6IFtjaGFubmVsXVxuXHRcdFx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdG1zZ1N0cmVhbS5lbWl0KGl0ZW0ucmlkLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHU6IHsgdXNlcm5hbWU6ICdyb2NrZXQuY2F0JyB9LFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1NsYWNrQnJpZGdlX2Vycm9yJywge1xuXHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRzcHJpbnRmOiBbY2hhbm5lbCwgZXJyb3IubWVzc2FnZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdFx0dGhyb3cgZXJyb3I7XG5cdH1cblx0cmV0dXJuIFNsYWNrQnJpZGdlSW1wb3J0O1xufVxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdzbGFja2JyaWRnZS1pbXBvcnQnLCBTbGFja0JyaWRnZUltcG9ydCk7XG4iLCIvKiBnbG9iYWxzIGxvZ2dlciovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSb2NrZXRBZGFwdGVyIHtcblx0Y29uc3RydWN0b3Ioc2xhY2tCcmlkZ2UpIHtcblx0XHRsb2dnZXIucm9ja2V0LmRlYnVnKCdjb25zdHJ1Y3RvcicpO1xuXHRcdHRoaXMuc2xhY2tCcmlkZ2UgPSBzbGFja0JyaWRnZTtcblx0XHR0aGlzLnV0aWwgPSBOcG0ucmVxdWlyZSgndXRpbCcpO1xuXG5cdFx0dGhpcy51c2VyVGFncyA9IHt9O1xuXHRcdHRoaXMuc2xhY2sgPSB7fTtcblx0fVxuXG5cdGNvbm5lY3QoKSB7XG5cdFx0dGhpcy5yZWdpc3RlckZvckV2ZW50cygpO1xuXHR9XG5cblx0ZGlzY29ubmVjdCgpIHtcblx0XHR0aGlzLnVucmVnaXN0ZXJGb3JFdmVudHMoKTtcblx0fVxuXG5cdHNldFNsYWNrKHNsYWNrKSB7XG5cdFx0dGhpcy5zbGFjayA9IHNsYWNrO1xuXHR9XG5cblx0cmVnaXN0ZXJGb3JFdmVudHMoKSB7XG5cdFx0bG9nZ2VyLnJvY2tldC5kZWJ1ZygnUmVnaXN0ZXIgZm9yIGV2ZW50cycpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIHRoaXMub25NZXNzYWdlLmJpbmQodGhpcyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ1NsYWNrQnJpZGdlX091dCcpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJEZWxldGVNZXNzYWdlJywgdGhpcy5vbk1lc3NhZ2VEZWxldGUuYmluZCh0aGlzKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnU2xhY2tCcmlkZ2VfRGVsZXRlJyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdzZXRSZWFjdGlvbicsIHRoaXMub25TZXRSZWFjdGlvbi5iaW5kKHRoaXMpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdTbGFja0JyaWRnZV9TZXRSZWFjdGlvbicpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgndW5zZXRSZWFjdGlvbicsIHRoaXMub25VblNldFJlYWN0aW9uLmJpbmQodGhpcyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ1NsYWNrQnJpZGdlX1VuU2V0UmVhY3Rpb24nKTtcblx0fVxuXG5cdHVucmVnaXN0ZXJGb3JFdmVudHMoKSB7XG5cdFx0bG9nZ2VyLnJvY2tldC5kZWJ1ZygnVW5yZWdpc3RlciBmb3IgZXZlbnRzJyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucmVtb3ZlKCdhZnRlclNhdmVNZXNzYWdlJywgJ1NsYWNrQnJpZGdlX091dCcpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgnYWZ0ZXJEZWxldGVNZXNzYWdlJywgJ1NsYWNrQnJpZGdlX0RlbGV0ZScpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgnc2V0UmVhY3Rpb24nLCAnU2xhY2tCcmlkZ2VfU2V0UmVhY3Rpb24nKTtcblx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5yZW1vdmUoJ3Vuc2V0UmVhY3Rpb24nLCAnU2xhY2tCcmlkZ2VfVW5TZXRSZWFjdGlvbicpO1xuXHR9XG5cblx0b25NZXNzYWdlRGVsZXRlKHJvY2tldE1lc3NhZ2VEZWxldGVkKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGlmICghIHRoaXMuc2xhY2suZ2V0U2xhY2tDaGFubmVsKHJvY2tldE1lc3NhZ2VEZWxldGVkLnJpZCkpIHtcblx0XHRcdFx0Ly9UaGlzIGlzIG9uIGEgY2hhbm5lbCB0aGF0IHRoZSByb2NrZXQgYm90IGlzIG5vdCBzdWJzY3JpYmVkXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGxvZ2dlci5yb2NrZXQuZGVidWcoJ29uUm9ja2V0TWVzc2FnZURlbGV0ZScsIHJvY2tldE1lc3NhZ2VEZWxldGVkKTtcblxuXHRcdFx0dGhpcy5zbGFjay5wb3N0RGVsZXRlTWVzc2FnZShyb2NrZXRNZXNzYWdlRGVsZXRlZCk7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRsb2dnZXIucm9ja2V0LmVycm9yKCdVbmhhbmRsZWQgZXJyb3Igb25NZXNzYWdlRGVsZXRlJywgZXJyKTtcblx0XHR9XG5cdH1cblxuXHRvblNldFJlYWN0aW9uKHJvY2tldE1zZ0lELCByZWFjdGlvbikge1xuXHRcdHRyeSB7XG5cdFx0XHRsb2dnZXIucm9ja2V0LmRlYnVnKCdvblJvY2tldFNldFJlYWN0aW9uJyk7XG5cblx0XHRcdGlmIChyb2NrZXRNc2dJRCAmJiByZWFjdGlvbikge1xuXHRcdFx0XHRpZiAodGhpcy5zbGFja0JyaWRnZS5yZWFjdGlvbnNNYXAuZGVsZXRlKGBzZXQkeyByb2NrZXRNc2dJRCB9JHsgcmVhY3Rpb24gfWApKSB7XG5cdFx0XHRcdFx0Ly9UaGlzIHdhcyBhIFNsYWNrIHJlYWN0aW9uLCB3ZSBkb24ndCBuZWVkIHRvIHRlbGwgU2xhY2sgYWJvdXQgaXRcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc3Qgcm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQocm9ja2V0TXNnSUQpO1xuXHRcdFx0XHRpZiAocm9ja2V0TXNnKSB7XG5cdFx0XHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5zbGFjay5nZXRTbGFja0NoYW5uZWwocm9ja2V0TXNnLnJpZCk7XG5cdFx0XHRcdFx0aWYgKG51bGwgIT0gc2xhY2tDaGFubmVsKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBzbGFja1RTID0gdGhpcy5zbGFjay5nZXRUaW1lU3RhbXAocm9ja2V0TXNnKTtcblx0XHRcdFx0XHRcdHRoaXMuc2xhY2sucG9zdFJlYWN0aW9uQWRkZWQocmVhY3Rpb24ucmVwbGFjZSgvOi9nLCAnJyksIHNsYWNrQ2hhbm5lbC5pZCwgc2xhY2tUUyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRsb2dnZXIucm9ja2V0LmVycm9yKCdVbmhhbmRsZWQgZXJyb3Igb25TZXRSZWFjdGlvbicsIGVycik7XG5cdFx0fVxuXHR9XG5cblx0b25VblNldFJlYWN0aW9uKHJvY2tldE1zZ0lELCByZWFjdGlvbikge1xuXHRcdHRyeSB7XG5cdFx0XHRsb2dnZXIucm9ja2V0LmRlYnVnKCdvblJvY2tldFVuU2V0UmVhY3Rpb24nKTtcblxuXHRcdFx0aWYgKHJvY2tldE1zZ0lEICYmIHJlYWN0aW9uKSB7XG5cdFx0XHRcdGlmICh0aGlzLnNsYWNrQnJpZGdlLnJlYWN0aW9uc01hcC5kZWxldGUoYHVuc2V0JHsgcm9ja2V0TXNnSUQgfSR7IHJlYWN0aW9uIH1gKSkge1xuXHRcdFx0XHRcdC8vVGhpcyB3YXMgYSBTbGFjayB1bnNldCByZWFjdGlvbiwgd2UgZG9uJ3QgbmVlZCB0byB0ZWxsIFNsYWNrIGFib3V0IGl0XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3Qgcm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQocm9ja2V0TXNnSUQpO1xuXHRcdFx0XHRpZiAocm9ja2V0TXNnKSB7XG5cdFx0XHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5zbGFjay5nZXRTbGFja0NoYW5uZWwocm9ja2V0TXNnLnJpZCk7XG5cdFx0XHRcdFx0aWYgKG51bGwgIT0gc2xhY2tDaGFubmVsKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBzbGFja1RTID0gdGhpcy5zbGFjay5nZXRUaW1lU3RhbXAocm9ja2V0TXNnKTtcblx0XHRcdFx0XHRcdHRoaXMuc2xhY2sucG9zdFJlYWN0aW9uUmVtb3ZlKHJlYWN0aW9uLnJlcGxhY2UoLzovZywgJycpLCBzbGFja0NoYW5uZWwuaWQsIHNsYWNrVFMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0bG9nZ2VyLnJvY2tldC5lcnJvcignVW5oYW5kbGVkIGVycm9yIG9uVW5TZXRSZWFjdGlvbicsIGVycik7XG5cdFx0fVxuXHR9XG5cblx0b25NZXNzYWdlKHJvY2tldE1lc3NhZ2UpIHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKCEgdGhpcy5zbGFjay5nZXRTbGFja0NoYW5uZWwocm9ja2V0TWVzc2FnZS5yaWQpKSB7XG5cdFx0XHRcdC8vVGhpcyBpcyBvbiBhIGNoYW5uZWwgdGhhdCB0aGUgcm9ja2V0IGJvdCBpcyBub3Qgc3Vic2NyaWJlZFxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRsb2dnZXIucm9ja2V0LmRlYnVnKCdvblJvY2tldE1lc3NhZ2UnLCByb2NrZXRNZXNzYWdlKTtcblxuXHRcdFx0aWYgKHJvY2tldE1lc3NhZ2UuZWRpdGVkQXQpIHtcblx0XHRcdFx0Ly9UaGlzIGlzIGFuIEVkaXQgRXZlbnRcblx0XHRcdFx0dGhpcy5wcm9jZXNzTWVzc2FnZUNoYW5nZWQocm9ja2V0TWVzc2FnZSk7XG5cdFx0XHRcdHJldHVybiByb2NrZXRNZXNzYWdlO1xuXHRcdFx0fVxuXHRcdFx0Ly8gSWdub3JlIG1lc3NhZ2VzIG9yaWdpbmF0aW5nIGZyb20gU2xhY2tcblx0XHRcdGlmIChyb2NrZXRNZXNzYWdlLl9pZC5pbmRleE9mKCdzbGFjay0nKSA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gcm9ja2V0TWVzc2FnZTtcblx0XHRcdH1cblxuXHRcdFx0Ly9BIG5ldyBtZXNzYWdlIGZyb20gUm9ja2V0LkNoYXRcblx0XHRcdHRoaXMucHJvY2Vzc1NlbmRNZXNzYWdlKHJvY2tldE1lc3NhZ2UpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0bG9nZ2VyLnJvY2tldC5lcnJvcignVW5oYW5kbGVkIGVycm9yIG9uTWVzc2FnZScsIGVycik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJvY2tldE1lc3NhZ2U7XG5cdH1cblxuXHRwcm9jZXNzU2VuZE1lc3NhZ2Uocm9ja2V0TWVzc2FnZSkge1xuXHRcdC8vU2luY2Ugd2UgZ290IHRoaXMgbWVzc2FnZSwgU2xhY2tCcmlkZ2VfT3V0X0VuYWJsZWQgaXMgdHJ1ZVxuXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9PdXRfQWxsJykgPT09IHRydWUpIHtcblx0XHRcdHRoaXMuc2xhY2sucG9zdE1lc3NhZ2UodGhpcy5zbGFjay5nZXRTbGFja0NoYW5uZWwocm9ja2V0TWVzc2FnZS5yaWQpLCByb2NrZXRNZXNzYWdlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly9UaGV5IHdhbnQgdG8gbGltaXQgdG8gY2VydGFpbiBncm91cHNcblx0XHRcdGNvbnN0IG91dFNsYWNrQ2hhbm5lbHMgPSBfLnBsdWNrKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9PdXRfQ2hhbm5lbHMnKSwgJ19pZCcpIHx8IFtdO1xuXHRcdFx0Ly9sb2dnZXIucm9ja2V0LmRlYnVnKCdPdXQgU2xhY2tDaGFubmVsczogJywgb3V0U2xhY2tDaGFubmVscyk7XG5cdFx0XHRpZiAob3V0U2xhY2tDaGFubmVscy5pbmRleE9mKHJvY2tldE1lc3NhZ2UucmlkKSAhPT0gLTEpIHtcblx0XHRcdFx0dGhpcy5zbGFjay5wb3N0TWVzc2FnZSh0aGlzLnNsYWNrLmdldFNsYWNrQ2hhbm5lbChyb2NrZXRNZXNzYWdlLnJpZCksIHJvY2tldE1lc3NhZ2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NNZXNzYWdlQ2hhbmdlZChyb2NrZXRNZXNzYWdlKSB7XG5cdFx0aWYgKHJvY2tldE1lc3NhZ2UpIHtcblx0XHRcdGlmIChyb2NrZXRNZXNzYWdlLnVwZGF0ZWRCeVNsYWNrKSB7XG5cdFx0XHRcdC8vV2UgaGF2ZSBhbHJlYWR5IHByb2Nlc3NlZCB0aGlzXG5cdFx0XHRcdGRlbGV0ZSByb2NrZXRNZXNzYWdlLnVwZGF0ZWRCeVNsYWNrO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vVGhpcyB3YXMgYSBjaGFuZ2UgZnJvbSBSb2NrZXQuQ2hhdFxuXHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5zbGFjay5nZXRTbGFja0NoYW5uZWwocm9ja2V0TWVzc2FnZS5yaWQpO1xuXHRcdFx0dGhpcy5zbGFjay5wb3N0TWVzc2FnZVVwZGF0ZShzbGFja0NoYW5uZWwsIHJvY2tldE1lc3NhZ2UpO1xuXHRcdH1cblx0fVxuXG5cblx0Z2V0Q2hhbm5lbChzbGFja01lc3NhZ2UpIHtcblx0XHRyZXR1cm4gc2xhY2tNZXNzYWdlLmNoYW5uZWwgPyB0aGlzLmZpbmRDaGFubmVsKHNsYWNrTWVzc2FnZS5jaGFubmVsKSB8fCB0aGlzLmFkZENoYW5uZWwoc2xhY2tNZXNzYWdlLmNoYW5uZWwpIDogbnVsbDtcblx0fVxuXG5cdGdldFVzZXIoc2xhY2tVc2VyKSB7XG5cdFx0cmV0dXJuIHNsYWNrVXNlciA/IHRoaXMuZmluZFVzZXIoc2xhY2tVc2VyKSB8fCB0aGlzLmFkZFVzZXIoc2xhY2tVc2VyKSA6IG51bGw7XG5cdH1cblxuXHRjcmVhdGVSb2NrZXRJRChzbGFja0NoYW5uZWwsIHRzKSB7XG5cdFx0cmV0dXJuIGBzbGFjay0keyBzbGFja0NoYW5uZWwgfS0keyB0cy5yZXBsYWNlKC9cXC4vZywgJy0nKSB9YDtcblx0fVxuXG5cdGZpbmRDaGFubmVsKHNsYWNrQ2hhbm5lbElkKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUltcG9ydElkKHNsYWNrQ2hhbm5lbElkKTtcblx0fVxuXG5cdGFkZENoYW5uZWwoc2xhY2tDaGFubmVsSUQsIGhhc1JldHJpZWQgPSBmYWxzZSkge1xuXHRcdGxvZ2dlci5yb2NrZXQuZGVidWcoJ0FkZGluZyBSb2NrZXQuQ2hhdCBjaGFubmVsIGZyb20gU2xhY2snLCBzbGFja0NoYW5uZWxJRCk7XG5cdFx0bGV0IHNsYWNrUmVzdWx0cyA9IG51bGw7XG5cdFx0bGV0IGlzR3JvdXAgPSBmYWxzZTtcblx0XHRpZiAoc2xhY2tDaGFubmVsSUQuY2hhckF0KDApID09PSAnQycpIHtcblx0XHRcdHNsYWNrUmVzdWx0cyA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvY2hhbm5lbHMuaW5mbycsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLnNsYWNrQnJpZGdlLmFwaVRva2VuLCBjaGFubmVsOiBzbGFja0NoYW5uZWxJRCB9IH0pO1xuXHRcdH0gZWxzZSBpZiAoc2xhY2tDaGFubmVsSUQuY2hhckF0KDApID09PSAnRycpIHtcblx0XHRcdHNsYWNrUmVzdWx0cyA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvZ3JvdXBzLmluZm8nLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5zbGFja0JyaWRnZS5hcGlUb2tlbiwgY2hhbm5lbDogc2xhY2tDaGFubmVsSUQgfSB9KTtcblx0XHRcdGlzR3JvdXAgPSB0cnVlO1xuXHRcdH1cblx0XHRpZiAoc2xhY2tSZXN1bHRzICYmIHNsYWNrUmVzdWx0cy5kYXRhICYmIHNsYWNrUmVzdWx0cy5kYXRhLm9rID09PSB0cnVlKSB7XG5cdFx0XHRjb25zdCByb2NrZXRDaGFubmVsRGF0YSA9IGlzR3JvdXAgPyBzbGFja1Jlc3VsdHMuZGF0YS5ncm91cCA6IHNsYWNrUmVzdWx0cy5kYXRhLmNoYW5uZWw7XG5cdFx0XHRjb25zdCBleGlzdGluZ1JvY2tldFJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHJvY2tldENoYW5uZWxEYXRhLm5hbWUpO1xuXG5cdFx0XHQvLyBJZiB0aGUgcm9vbSBleGlzdHMsIG1ha2Ugc3VyZSB3ZSBoYXZlIGl0cyBpZCBpbiBpbXBvcnRJZHNcblx0XHRcdGlmIChleGlzdGluZ1JvY2tldFJvb20gfHwgcm9ja2V0Q2hhbm5lbERhdGEuaXNfZ2VuZXJhbCkge1xuXHRcdFx0XHRyb2NrZXRDaGFubmVsRGF0YS5yb2NrZXRJZCA9IHJvY2tldENoYW5uZWxEYXRhLmlzX2dlbmVyYWwgPyAnR0VORVJBTCcgOiBleGlzdGluZ1JvY2tldFJvb20uX2lkO1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5hZGRJbXBvcnRJZHMocm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQsIHJvY2tldENoYW5uZWxEYXRhLmlkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHJvY2tldFVzZXJzID0gW107XG5cdFx0XHRcdGZvciAoY29uc3QgbWVtYmVyIG9mIHJvY2tldENoYW5uZWxEYXRhLm1lbWJlcnMpIHtcblx0XHRcdFx0XHRpZiAobWVtYmVyICE9PSByb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yKSB7XG5cdFx0XHRcdFx0XHRjb25zdCByb2NrZXRVc2VyID0gdGhpcy5maW5kVXNlcihtZW1iZXIpIHx8IHRoaXMuYWRkVXNlcihtZW1iZXIpO1xuXHRcdFx0XHRcdFx0aWYgKHJvY2tldFVzZXIgJiYgcm9ja2V0VXNlci51c2VybmFtZSkge1xuXHRcdFx0XHRcdFx0XHRyb2NrZXRVc2Vycy5wdXNoKHJvY2tldFVzZXIudXNlcm5hbWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCByb2NrZXRVc2VyQ3JlYXRvciA9IHJvY2tldENoYW5uZWxEYXRhLmNyZWF0b3IgPyB0aGlzLmZpbmRVc2VyKHJvY2tldENoYW5uZWxEYXRhLmNyZWF0b3IpIHx8IHRoaXMuYWRkVXNlcihyb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yKSA6IG51bGw7XG5cdFx0XHRcdGlmICghcm9ja2V0VXNlckNyZWF0b3IpIHtcblx0XHRcdFx0XHRsb2dnZXIucm9ja2V0LmVycm9yKCdDb3VsZCBub3QgZmV0Y2ggcm9vbSBjcmVhdG9yIGluZm9ybWF0aW9uJywgcm9ja2V0Q2hhbm5lbERhdGEuY3JlYXRvcik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCByb2NrZXRDaGFubmVsID0gUm9ja2V0Q2hhdC5jcmVhdGVSb29tKGlzR3JvdXAgPyAncCcgOiAnYycsIHJvY2tldENoYW5uZWxEYXRhLm5hbWUsIHJvY2tldFVzZXJDcmVhdG9yLnVzZXJuYW1lLCByb2NrZXRVc2Vycyk7XG5cdFx0XHRcdFx0cm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQgPSByb2NrZXRDaGFubmVsLnJpZDtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGlmICghaGFzUmV0cmllZCkge1xuXHRcdFx0XHRcdFx0bG9nZ2VyLnJvY2tldC5kZWJ1ZygnRXJyb3IgYWRkaW5nIGNoYW5uZWwgZnJvbSBTbGFjay4gV2lsbCByZXRyeSBpbiAxcy4nLCBlLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0Ly8gSWYgZmlyc3QgdGltZSB0cnlpbmcgdG8gY3JlYXRlIGNoYW5uZWwgZmFpbHMsIGNvdWxkIGJlIGJlY2F1c2Ugb2YgbXVsdGlwbGUgbWVzc2FnZXMgcmVjZWl2ZWQgYXQgdGhlIHNhbWUgdGltZS4gVHJ5IGFnYWluIG9uY2UgYWZ0ZXIgMXMuXG5cdFx0XHRcdFx0XHRNZXRlb3IuX3NsZWVwRm9yTXMoMTAwMCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcy5maW5kQ2hhbm5lbChzbGFja0NoYW5uZWxJRCkgfHwgdGhpcy5hZGRDaGFubmVsKHNsYWNrQ2hhbm5lbElELCB0cnVlKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZS5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCByb29tVXBkYXRlID0ge1xuXHRcdFx0XHRcdHRzOiBuZXcgRGF0ZShyb2NrZXRDaGFubmVsRGF0YS5jcmVhdGVkICogMTAwMClcblx0XHRcdFx0fTtcblx0XHRcdFx0bGV0IGxhc3RTZXRUb3BpYyA9IDA7XG5cdFx0XHRcdGlmICghXy5pc0VtcHR5KHJvY2tldENoYW5uZWxEYXRhLnRvcGljICYmIHJvY2tldENoYW5uZWxEYXRhLnRvcGljLnZhbHVlKSkge1xuXHRcdFx0XHRcdHJvb21VcGRhdGUudG9waWMgPSByb2NrZXRDaGFubmVsRGF0YS50b3BpYy52YWx1ZTtcblx0XHRcdFx0XHRsYXN0U2V0VG9waWMgPSByb2NrZXRDaGFubmVsRGF0YS50b3BpYy5sYXN0X3NldDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIV8uaXNFbXB0eShyb2NrZXRDaGFubmVsRGF0YS5wdXJwb3NlICYmIHJvY2tldENoYW5uZWxEYXRhLnB1cnBvc2UudmFsdWUpICYmIHJvY2tldENoYW5uZWxEYXRhLnB1cnBvc2UubGFzdF9zZXQgPiBsYXN0U2V0VG9waWMpIHtcblx0XHRcdFx0XHRyb29tVXBkYXRlLnRvcGljID0gcm9ja2V0Q2hhbm5lbERhdGEucHVycG9zZS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5hZGRJbXBvcnRJZHMocm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQsIHJvY2tldENoYW5uZWxEYXRhLmlkKTtcblx0XHRcdFx0dGhpcy5zbGFjay5hZGRTbGFja0NoYW5uZWwocm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQsIHNsYWNrQ2hhbm5lbElEKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb2NrZXRDaGFubmVsRGF0YS5yb2NrZXRJZCk7XG5cdFx0fVxuXHRcdGxvZ2dlci5yb2NrZXQuZGVidWcoJ0NoYW5uZWwgbm90IGFkZGVkJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZmluZFVzZXIoc2xhY2tVc2VySUQpIHtcblx0XHRjb25zdCByb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SW1wb3J0SWQoc2xhY2tVc2VySUQpO1xuXHRcdGlmIChyb2NrZXRVc2VyICYmICF0aGlzLnVzZXJUYWdzW3NsYWNrVXNlcklEXSkge1xuXHRcdFx0dGhpcy51c2VyVGFnc1tzbGFja1VzZXJJRF0gPSB7IHNsYWNrOiBgPEAkeyBzbGFja1VzZXJJRCB9PmAsIHJvY2tldDogYEAkeyByb2NrZXRVc2VyLnVzZXJuYW1lIH1gIH07XG5cdFx0fVxuXHRcdHJldHVybiByb2NrZXRVc2VyO1xuXHR9XG5cblx0YWRkVXNlcihzbGFja1VzZXJJRCkge1xuXHRcdGxvZ2dlci5yb2NrZXQuZGVidWcoJ0FkZGluZyBSb2NrZXQuQ2hhdCB1c2VyIGZyb20gU2xhY2snLCBzbGFja1VzZXJJRCk7XG5cdFx0Y29uc3Qgc2xhY2tSZXN1bHRzID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS91c2Vycy5pbmZvJywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuc2xhY2tCcmlkZ2UuYXBpVG9rZW4sIHVzZXI6IHNsYWNrVXNlcklEIH0gfSk7XG5cdFx0aWYgKHNsYWNrUmVzdWx0cyAmJiBzbGFja1Jlc3VsdHMuZGF0YSAmJiBzbGFja1Jlc3VsdHMuZGF0YS5vayA9PT0gdHJ1ZSAmJiBzbGFja1Jlc3VsdHMuZGF0YS51c2VyKSB7XG5cdFx0XHRjb25zdCByb2NrZXRVc2VyRGF0YSA9IHNsYWNrUmVzdWx0cy5kYXRhLnVzZXI7XG5cdFx0XHRjb25zdCBpc0JvdCA9IHJvY2tldFVzZXJEYXRhLmlzX2JvdCA9PT0gdHJ1ZTtcblx0XHRcdGNvbnN0IGVtYWlsID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZSAmJiByb2NrZXRVc2VyRGF0YS5wcm9maWxlLmVtYWlsIHx8ICcnO1xuXHRcdFx0bGV0IGV4aXN0aW5nUm9ja2V0VXNlcjtcblx0XHRcdGlmICghaXNCb3QpIHtcblx0XHRcdFx0ZXhpc3RpbmdSb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5RW1haWxBZGRyZXNzKGVtYWlsKSB8fCBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShyb2NrZXRVc2VyRGF0YS5uYW1lKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGV4aXN0aW5nUm9ja2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHJvY2tldFVzZXJEYXRhLm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXhpc3RpbmdSb2NrZXRVc2VyKSB7XG5cdFx0XHRcdHJvY2tldFVzZXJEYXRhLnJvY2tldElkID0gZXhpc3RpbmdSb2NrZXRVc2VyLl9pZDtcblx0XHRcdFx0cm9ja2V0VXNlckRhdGEubmFtZSA9IGV4aXN0aW5nUm9ja2V0VXNlci51c2VybmFtZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IG5ld1VzZXIgPSB7XG5cdFx0XHRcdFx0cGFzc3dvcmQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiByb2NrZXRVc2VyRGF0YS5uYW1lXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKCFpc0JvdCAmJiBlbWFpbCkge1xuXHRcdFx0XHRcdG5ld1VzZXIuZW1haWwgPSBlbWFpbDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChpc0JvdCkge1xuXHRcdFx0XHRcdG5ld1VzZXIuam9pbkRlZmF1bHRDaGFubmVscyA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cm9ja2V0VXNlckRhdGEucm9ja2V0SWQgPSBBY2NvdW50cy5jcmVhdGVVc2VyKG5ld1VzZXIpO1xuXHRcdFx0XHRjb25zdCB1c2VyVXBkYXRlID0ge1xuXHRcdFx0XHRcdHV0Y09mZnNldDogcm9ja2V0VXNlckRhdGEudHpfb2Zmc2V0IC8gMzYwMCwgLy8gU2xhY2sncyBpcyAtMTgwMDAgd2hpY2ggdHJhbnNsYXRlcyB0byBSb2NrZXQuQ2hhdCdzIGFmdGVyIGRpdmlkaW5nIGJ5IDM2MDAsXG5cdFx0XHRcdFx0cm9sZXM6IGlzQm90ID8gWyAnYm90JyBdIDogWyAndXNlcicgXVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmIChyb2NrZXRVc2VyRGF0YS5wcm9maWxlICYmIHJvY2tldFVzZXJEYXRhLnByb2ZpbGUucmVhbF9uYW1lKSB7XG5cdFx0XHRcdFx0dXNlclVwZGF0ZVsnbmFtZSddID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZS5yZWFsX25hbWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocm9ja2V0VXNlckRhdGEuZGVsZXRlZCkge1xuXHRcdFx0XHRcdHVzZXJVcGRhdGVbJ2FjdGl2ZSddID0gZmFsc2U7XG5cdFx0XHRcdFx0dXNlclVwZGF0ZVsnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJ10gPSBbXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnVwZGF0ZSh7IF9pZDogcm9ja2V0VXNlckRhdGEucm9ja2V0SWQgfSwgeyAkc2V0OiB1c2VyVXBkYXRlIH0pO1xuXG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChyb2NrZXRVc2VyRGF0YS5yb2NrZXRJZCk7XG5cblx0XHRcdFx0bGV0IHVybCA9IG51bGw7XG5cdFx0XHRcdGlmIChyb2NrZXRVc2VyRGF0YS5wcm9maWxlKSB7XG5cdFx0XHRcdFx0aWYgKHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuaW1hZ2Vfb3JpZ2luYWwpIHtcblx0XHRcdFx0XHRcdHVybCA9IHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuaW1hZ2Vfb3JpZ2luYWw7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChyb2NrZXRVc2VyRGF0YS5wcm9maWxlLmltYWdlXzUxMikge1xuXHRcdFx0XHRcdFx0dXJsID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZS5pbWFnZV81MTI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh1cmwpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zZXRVc2VyQXZhdGFyKHVzZXIsIHVybCwgbnVsbCwgJ3VybCcpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIucm9ja2V0LmRlYnVnKCdFcnJvciBzZXR0aW5nIHVzZXIgYXZhdGFyJywgZXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGltcG9ydElkcyA9IFsgcm9ja2V0VXNlckRhdGEuaWQgXTtcblx0XHRcdGlmIChpc0JvdCAmJiByb2NrZXRVc2VyRGF0YS5wcm9maWxlICYmIHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuYm90X2lkKSB7XG5cdFx0XHRcdGltcG9ydElkcy5wdXNoKHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuYm90X2lkKTtcblx0XHRcdH1cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmFkZEltcG9ydElkcyhyb2NrZXRVc2VyRGF0YS5yb2NrZXRJZCwgaW1wb3J0SWRzKTtcblx0XHRcdGlmICghdGhpcy51c2VyVGFnc1tzbGFja1VzZXJJRF0pIHtcblx0XHRcdFx0dGhpcy51c2VyVGFnc1tzbGFja1VzZXJJRF0gPSB7IHNsYWNrOiBgPEAkeyBzbGFja1VzZXJJRCB9PmAsIHJvY2tldDogYEAkeyByb2NrZXRVc2VyRGF0YS5uYW1lIH1gIH07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocm9ja2V0VXNlckRhdGEucm9ja2V0SWQpO1xuXHRcdH1cblx0XHRsb2dnZXIucm9ja2V0LmRlYnVnKCdVc2VyIG5vdCBhZGRlZCcpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGFkZEFsaWFzVG9Nc2cocm9ja2V0VXNlck5hbWUsIHJvY2tldE1zZ09iaikge1xuXHRcdGNvbnN0IGFsaWFzRm9ybWF0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0Jyk7XG5cdFx0aWYgKGFsaWFzRm9ybWF0KSB7XG5cdFx0XHRjb25zdCBhbGlhcyA9IHRoaXMudXRpbC5mb3JtYXQoYWxpYXNGb3JtYXQsIHJvY2tldFVzZXJOYW1lKTtcblxuXHRcdFx0aWYgKGFsaWFzICE9PSByb2NrZXRVc2VyTmFtZSkge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmouYWxpYXMgPSBhbGlhcztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcm9ja2V0TXNnT2JqO1xuXHR9XG5cblx0Y3JlYXRlQW5kU2F2ZU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCByb2NrZXRNc2dEYXRhRGVmYXVsdHMsIGlzSW1wb3J0aW5nKSB7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS50eXBlID09PSAnbWVzc2FnZScpIHtcblx0XHRcdGxldCByb2NrZXRNc2dPYmogPSB7fTtcblx0XHRcdGlmICghXy5pc0VtcHR5KHNsYWNrTWVzc2FnZS5zdWJ0eXBlKSkge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmogPSB0aGlzLnNsYWNrLnByb2Nlc3NTdWJ0eXBlZE1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZyk7XG5cdFx0XHRcdGlmICghcm9ja2V0TXNnT2JqKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmogPSB7XG5cdFx0XHRcdFx0bXNnOiB0aGlzLmNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTWVzc2FnZS50ZXh0KSxcblx0XHRcdFx0XHRyaWQ6IHJvY2tldENoYW5uZWwuX2lkLFxuXHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdF9pZDogcm9ja2V0VXNlci5faWQsXG5cdFx0XHRcdFx0XHR1c2VybmFtZTogcm9ja2V0VXNlci51c2VybmFtZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0aGlzLmFkZEFsaWFzVG9Nc2cocm9ja2V0VXNlci51c2VybmFtZSwgcm9ja2V0TXNnT2JqKTtcblx0XHRcdH1cblx0XHRcdF8uZXh0ZW5kKHJvY2tldE1zZ09iaiwgcm9ja2V0TXNnRGF0YURlZmF1bHRzKTtcblx0XHRcdGlmIChzbGFja01lc3NhZ2UuZWRpdGVkKSB7XG5cdFx0XHRcdHJvY2tldE1zZ09iai5lZGl0ZWRBdCA9IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS5lZGl0ZWQudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKTtcblx0XHRcdH1cblx0XHRcdGlmIChzbGFja01lc3NhZ2Uuc3VidHlwZSA9PT0gJ2JvdF9tZXNzYWdlJykge1xuXHRcdFx0XHRyb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoJ3JvY2tldC5jYXQnLCB7IGZpZWxkczogeyB1c2VybmFtZTogMSB9IH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2xhY2tNZXNzYWdlLnBpbm5lZF90byAmJiBzbGFja01lc3NhZ2UucGlubmVkX3RvLmluZGV4T2Yoc2xhY2tNZXNzYWdlLmNoYW5uZWwpICE9PSAtMSkge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmoucGlubmVkID0gdHJ1ZTtcblx0XHRcdFx0cm9ja2V0TXNnT2JqLnBpbm5lZEF0ID0gRGF0ZS5ub3c7XG5cdFx0XHRcdHJvY2tldE1zZ09iai5waW5uZWRCeSA9IF8ucGljayhyb2NrZXRVc2VyLCAnX2lkJywgJ3VzZXJuYW1lJyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2xhY2tNZXNzYWdlLnN1YnR5cGUgPT09ICdib3RfbWVzc2FnZScpIHtcblx0XHRcdFx0TWV0ZW9yLnNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdGlmIChzbGFja01lc3NhZ2UuYm90X2lkICYmIHNsYWNrTWVzc2FnZS50cyAmJiAhUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5U2xhY2tCb3RJZEFuZFNsYWNrVHMoc2xhY2tNZXNzYWdlLmJvdF9pZCwgc2xhY2tNZXNzYWdlLnRzKSkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zZW5kTWVzc2FnZShyb2NrZXRVc2VyLCByb2NrZXRNc2dPYmosIHJvY2tldENoYW5uZWwsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSwgNTAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxvZ2dlci5yb2NrZXQuZGVidWcoJ1NlbmQgbWVzc2FnZSB0byBSb2NrZXQuQ2hhdCcpO1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHJvY2tldFVzZXIsIHJvY2tldE1zZ09iaiwgcm9ja2V0Q2hhbm5lbCwgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQoc2xhY2tNc2dUeHQpIHtcblx0XHRpZiAoIV8uaXNFbXB0eShzbGFja01zZ1R4dCkpIHtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvPCFldmVyeW9uZT4vZywgJ0BhbGwnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvPCFjaGFubmVsPi9nLCAnQGFsbCcpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC88IWhlcmU+L2csICdAaGVyZScpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLyZsdDsvZywgJzwnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvJmFtcDsvZywgJyYnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvOnNpbXBsZV9zbWlsZTovZywgJzpzbWlsZTonKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvOm1lbW86L2csICc6cGVuY2lsOicpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC86cGlnZ3k6L2csICc6cGlnOicpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC86dWs6L2csICc6Z2I6Jyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLzwoaHR0cFtzXT86W14+XSopPi9nLCAnJDEnKTtcblxuXHRcdFx0c2xhY2tNc2dUeHQucmVwbGFjZSgvKD86PEApKFthLXpBLVowLTldKykoPzpcXHwuKyk/KD86PikvZywgKG1hdGNoLCB1c2VySWQpID0+IHtcblx0XHRcdFx0aWYgKCF0aGlzLnVzZXJUYWdzW3VzZXJJZF0pIHtcblx0XHRcdFx0XHR0aGlzLmZpbmRVc2VyKHVzZXJJZCkgfHwgdGhpcy5hZGRVc2VyKHVzZXJJZCk7IC8vIFRoaXMgYWRkcyB1c2VyVGFncyBmb3IgdGhlIHVzZXJJZFxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IHVzZXJUYWdzID0gdGhpcy51c2VyVGFnc1t1c2VySWRdO1xuXHRcdFx0XHRpZiAodXNlclRhZ3MpIHtcblx0XHRcdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UodXNlclRhZ3Muc2xhY2ssIHVzZXJUYWdzLnJvY2tldCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzbGFja01zZ1R4dCA9ICcnO1xuXHRcdH1cblx0XHRyZXR1cm4gc2xhY2tNc2dUeHQ7XG5cdH1cblxufVxuIiwiLyogZ2xvYmFscyBsb2dnZXIqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2xhY2tBZGFwdGVyIHtcblxuXHRjb25zdHJ1Y3RvcihzbGFja0JyaWRnZSkge1xuXHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnY29uc3RydWN0b3InKTtcblx0XHR0aGlzLnNsYWNrQnJpZGdlID0gc2xhY2tCcmlkZ2U7XG5cdFx0dGhpcy5zbGFja0NsaWVudCA9IHJlcXVpcmUoJ0BzbGFjay9jbGllbnQnKTtcblx0XHR0aGlzLnJ0bSA9IHt9O1x0Ly9zbGFjay1jbGllbnQgUmVhbCBUaW1lIE1lc3NhZ2luZyBBUElcblx0XHR0aGlzLmFwaVRva2VuID0ge307XHQvL1NsYWNrIEFQSSBUb2tlbiBwYXNzZWQgaW4gdmlhIENvbm5lY3Rcblx0XHQvL09uIFNsYWNrLCBhIHJvY2tldCBpbnRlZ3JhdGlvbiBib3Qgd2lsbCBiZSBhZGRlZCB0byBzbGFjayBjaGFubmVscywgdGhpcyBpcyB0aGUgbGlzdCBvZiB0aG9zZSBjaGFubmVscywga2V5IGlzIFJvY2tldCBDaCBJRFxuXHRcdHRoaXMuc2xhY2tDaGFubmVsUm9ja2V0Qm90TWVtYmVyc2hpcE1hcCA9IG5ldyBNYXAoKTsgLy9LZXk9Um9ja2V0Q2hhbm5lbElELCBWYWx1ZT1TbGFja0NoYW5uZWxcblx0XHR0aGlzLnJvY2tldCA9IHt9O1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbm5lY3QgdG8gdGhlIHJlbW90ZSBTbGFjayBzZXJ2ZXIgdXNpbmcgdGhlIHBhc3NlZCBpbiB0b2tlbiBBUEkgYW5kIHJlZ2lzdGVyIGZvciBTbGFjayBldmVudHNcblx0ICogQHBhcmFtIGFwaVRva2VuXG5cdCAqL1xuXHRjb25uZWN0KGFwaVRva2VuKSB7XG5cdFx0dGhpcy5hcGlUb2tlbiA9IGFwaVRva2VuO1xuXG5cdFx0Y29uc3QgUlRNQ2xpZW50ID0gdGhpcy5zbGFja0NsaWVudC5SVE1DbGllbnQ7XG5cdFx0aWYgKFJUTUNsaWVudCAhPSBudWxsKSB7XG5cdFx0XHRSVE1DbGllbnQuZGlzY29ubmVjdDtcblx0XHR9XG5cdFx0dGhpcy5ydG0gPSBuZXcgUlRNQ2xpZW50KHRoaXMuYXBpVG9rZW4pO1xuXHRcdHRoaXMucnRtLnN0YXJ0KCk7XG5cdFx0dGhpcy5yZWdpc3RlckZvckV2ZW50cygpO1xuXG5cdFx0TWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dGhpcy5wb3B1bGF0ZU1lbWJlcnNoaXBDaGFubmVsTWFwKCk7IC8vIElmIHJ1biBvdXRzaWRlIG9mIE1ldGVvci5zdGFydHVwLCBIVFRQIGlzIG5vdCBkZWZpbmVkXG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0bG9nZ2VyLnNsYWNrLmVycm9yKCdFcnJvciBhdHRlbXB0aW5nIHRvIGNvbm5lY3QgdG8gU2xhY2snLCBlcnIpO1xuXHRcdFx0XHR0aGlzLnNsYWNrQnJpZGdlLmRpc2Nvbm5lY3QoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBVbnJlZ2lzdGVyIGZvciBzbGFjayBldmVudHMgYW5kIGRpc2Nvbm5lY3QgZnJvbSBTbGFja1xuXHQgKi9cblx0ZGlzY29ubmVjdCgpIHtcblx0XHR0aGlzLnJ0bS5kaXNjb25uZWN0ICYmIHRoaXMucnRtLmRpc2Nvbm5lY3Q7XG5cdH1cblxuXHRzZXRSb2NrZXQocm9ja2V0KSB7XG5cdFx0dGhpcy5yb2NrZXQgPSByb2NrZXQ7XG5cdH1cblxuXHRyZWdpc3RlckZvckV2ZW50cygpIHtcblx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1JlZ2lzdGVyIGZvciBldmVudHMnKTtcblx0XHR0aGlzLnJ0bS5vbignYXV0aGVudGljYXRlZCcsICgpID0+IHtcblx0XHRcdGxvZ2dlci5zbGFjay5pbmZvKCdDb25uZWN0ZWQgdG8gU2xhY2snKTtcblx0XHR9KTtcblxuXHRcdHRoaXMucnRtLm9uKCd1bmFibGVfdG9fcnRtX3N0YXJ0JywgKCkgPT4ge1xuXHRcdFx0dGhpcy5zbGFja0JyaWRnZS5kaXNjb25uZWN0KCk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnJ0bS5vbignZGlzY29ubmVjdGVkJywgKCkgPT4ge1xuXHRcdFx0bG9nZ2VyLnNsYWNrLmluZm8oJ0Rpc2Nvbm5lY3RlZCBmcm9tIFNsYWNrJyk7XG5cdFx0XHR0aGlzLnNsYWNrQnJpZGdlLmRpc2Nvbm5lY3QoKTtcblx0XHR9KTtcblxuXHRcdC8qKlxuXHRcdCogRXZlbnQgZmlyZWQgd2hlbiBzb21lb25lIG1lc3NhZ2VzIGEgY2hhbm5lbCB0aGUgYm90IGlzIGluXG5cdFx0KiB7XG5cdFx0Klx0dHlwZTogJ21lc3NhZ2UnLFxuXHRcdCogXHRjaGFubmVsOiBbY2hhbm5lbF9pZF0sXG5cdFx0KiBcdHVzZXI6IFt1c2VyX2lkXSxcblx0XHQqIFx0dGV4dDogW21lc3NhZ2VdLFxuXHRcdCogXHR0czogW3RzLm1pbGxpXSxcblx0XHQqIFx0dGVhbTogW3RlYW1faWRdLFxuXHRcdCogXHRzdWJ0eXBlOiBbbWVzc2FnZV9zdWJ0eXBlXSxcblx0XHQqIFx0aW52aXRlcjogW21lc3NhZ2Vfc3VidHlwZSA9ICdncm91cF9qb2lufGNoYW5uZWxfam9pbicgLT4gdXNlcl9pZF1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbignbWVzc2FnZScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKHNsYWNrTWVzc2FnZSkgPT4ge1xuXHRcdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdPblNsYWNrRXZlbnQtTUVTU0FHRTogJywgc2xhY2tNZXNzYWdlKTtcblx0XHRcdGlmIChzbGFja01lc3NhZ2UpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aGlzLm9uTWVzc2FnZShzbGFja01lc3NhZ2UpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRsb2dnZXIuc2xhY2suZXJyb3IoJ1VuaGFuZGxlZCBlcnJvciBvbk1lc3NhZ2UnLCBlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkpO1xuXG5cdFx0dGhpcy5ydG0ub24oJ3JlYWN0aW9uX2FkZGVkJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgocmVhY3Rpb25Nc2cpID0+IHtcblx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnT25TbGFja0V2ZW50LVJFQUNUSU9OX0FEREVEOiAnLCByZWFjdGlvbk1zZyk7XG5cdFx0XHRpZiAocmVhY3Rpb25Nc2cpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aGlzLm9uUmVhY3Rpb25BZGRlZChyZWFjdGlvbk1zZyk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdGxvZ2dlci5zbGFjay5lcnJvcignVW5oYW5kbGVkIGVycm9yIG9uUmVhY3Rpb25BZGRlZCcsIGVycik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KSk7XG5cblx0XHR0aGlzLnJ0bS5vbigncmVhY3Rpb25fcmVtb3ZlZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKHJlYWN0aW9uTXNnKSA9PiB7XG5cdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ09uU2xhY2tFdmVudC1SRUFDVElPTl9SRU1PVkVEOiAnLCByZWFjdGlvbk1zZyk7XG5cdFx0XHRpZiAocmVhY3Rpb25Nc2cpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aGlzLm9uUmVhY3Rpb25SZW1vdmVkKHJlYWN0aW9uTXNnKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLnNsYWNrLmVycm9yKCdVbmhhbmRsZWQgZXJyb3Igb25SZWFjdGlvblJlbW92ZWQnLCBlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSkpO1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgZmlyZWQgd2hlbiBzb21lb25lIGNyZWF0ZXMgYSBwdWJsaWMgY2hhbm5lbFxuXHRcdCAqIHtcblx0XHQqXHR0eXBlOiAnY2hhbm5lbF9jcmVhdGVkJyxcblx0XHQqXHRjaGFubmVsOiB7XG5cdFx0Klx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCpcdFx0aXNfY2hhbm5lbDogdHJ1ZSxcblx0XHQqXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCpcdFx0Y3JlYXRlZDogW3RzXSxcblx0XHQqXHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqXHRcdGlzX3NoYXJlZDogZmFsc2UsXG5cdFx0Klx0XHRpc19vcmdfc2hhcmVkOiBmYWxzZVxuXHRcdCpcdH0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQgKiovXG5cdFx0dGhpcy5ydG0ub24oJ2NoYW5uZWxfY3JlYXRlZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBqb2lucyBhIHB1YmxpYyBjaGFubmVsXG5cdFx0ICoge1xuXHRcdCogXHR0eXBlOiAnY2hhbm5lbF9qb2luZWQnLFxuXHRcdCogXHRjaGFubmVsOiB7XG5cdFx0KiBcdFx0aWQ6IFtjaGFubmVsX2lkXSxcblx0XHQqIFx0XHRuYW1lOiBbY2hhbm5lbF9uYW1lXSxcblx0XHQqIFx0XHRpc19jaGFubmVsOiB0cnVlLFxuXHRcdCogXHRcdGNyZWF0ZWQ6IFt0c10sXG5cdFx0KiBcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdGlzX2FyY2hpdmVkOiBmYWxzZSxcblx0XHQqIFx0XHRpc19nZW5lcmFsOiBmYWxzZSxcblx0XHQqIFx0XHRpc19tZW1iZXI6IHRydWUsXG5cdFx0KiBcdFx0bGFzdF9yZWFkOiBbdHMubWlsbGldLFxuXHRcdCogXHRcdGxhdGVzdDogW21lc3NhZ2Vfb2JqXSxcblx0XHQqIFx0XHR1bnJlYWRfY291bnQ6IDAsXG5cdFx0KiBcdFx0dW5yZWFkX2NvdW50X2Rpc3BsYXk6IDAsXG5cdFx0KiBcdFx0bWVtYmVyczogWyB1c2VyX2lkcyBdLFxuXHRcdCogXHRcdHRvcGljOiB7XG5cdFx0KiBcdFx0XHR2YWx1ZTogW2NoYW5uZWxfdG9waWNdLFxuXHRcdCogXHRcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdFx0bGFzdF9zZXQ6IDBcblx0XHQqIFx0XHR9LFxuXHRcdCogXHRcdHB1cnBvc2U6IHtcblx0XHQqIFx0XHRcdHZhbHVlOiBbY2hhbm5lbF9wdXJwb3NlXSxcblx0XHQqIFx0XHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqIFx0XHRcdGxhc3Rfc2V0OiAwXG5cdFx0KiBcdFx0fVxuXHRcdCogXHR9XG5cdFx0KiB9XG5cdFx0ICoqL1xuXHRcdHRoaXMucnRtLm9uKCdjaGFubmVsX2pvaW5lZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBsZWF2ZXMgKG9yIGlzIHJlbW92ZWQgZnJvbSkgYSBwdWJsaWMgY2hhbm5lbFxuXHRcdCAqIHtcblx0XHQqIFx0dHlwZTogJ2NoYW5uZWxfbGVmdCcsXG5cdFx0KiBcdGNoYW5uZWw6IFtjaGFubmVsX2lkXVxuXHRcdCogfVxuXHRcdCAqKi9cblx0XHR0aGlzLnJ0bS5vbignY2hhbm5lbF9sZWZ0JywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoY2hhbm5lbExlZnRNc2cpID0+IHtcblx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnT25TbGFja0V2ZW50LUNIQU5ORUxfTEVGVDogJywgY2hhbm5lbExlZnRNc2cpO1xuXHRcdFx0aWYgKGNoYW5uZWxMZWZ0TXNnKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dGhpcy5vbkNoYW5uZWxMZWZ0KGNoYW5uZWxMZWZ0TXNnKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLnNsYWNrLmVycm9yKCdVbmhhbmRsZWQgZXJyb3Igb25DaGFubmVsTGVmdCcsIGVycik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXG5cdFx0fSkpO1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgZmlyZWQgd2hlbiBhbiBhcmNoaXZlZCBjaGFubmVsIGlzIGRlbGV0ZWQgYnkgYW4gYWRtaW5cblx0XHQgKiB7XG5cdFx0KiBcdHR5cGU6ICdjaGFubmVsX2RlbGV0ZWQnLFxuXHRcdCogXHRjaGFubmVsOiBbY2hhbm5lbF9pZF0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQgKiovXG5cdFx0dGhpcy5ydG0ub24oJ2NoYW5uZWxfZGVsZXRlZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGNoYW5uZWwgaGFzIGl0cyBuYW1lIGNoYW5nZWRcblx0XHQgKiB7XG5cdFx0KiBcdHR5cGU6ICdjaGFubmVsX3JlbmFtZScsXG5cdFx0KiBcdGNoYW5uZWw6IHtcblx0XHQqIFx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCogXHRcdGlzX2NoYW5uZWw6IHRydWUsXG5cdFx0KiBcdFx0Y3JlYXRlZDogW3RzXVxuXHRcdCogXHR9LFxuXHRcdCpcdGV2ZW50X3RzOiBbdHMubWlsbGldXG5cdFx0KiB9XG5cdFx0ICoqL1xuXHRcdHRoaXMucnRtLm9uKCdjaGFubmVsX3JlbmFtZScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBqb2lucyBhIHByaXZhdGUgY2hhbm5lbFxuXHRcdCAqIHtcblx0XHQqIFx0dHlwZTogJ2dyb3VwX2pvaW5lZCcsXG5cdFx0KiBcdGNoYW5uZWw6IHtcblx0XHQqIFx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCogXHRcdGlzX2dyb3VwOiB0cnVlLFxuXHRcdCogXHRcdGNyZWF0ZWQ6IFt0c10sXG5cdFx0KiBcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdGlzX2FyY2hpdmVkOiBmYWxzZSxcblx0XHQqIFx0XHRpc19tcGltOiBmYWxzZSxcblx0XHQqIFx0XHRpc19vcGVuOiB0cnVlLFxuXHRcdCogXHRcdGxhc3RfcmVhZDogW3RzLm1pbGxpXSxcblx0XHQqIFx0XHRsYXRlc3Q6IFttZXNzYWdlX29ial0sXG5cdFx0KiBcdFx0dW5yZWFkX2NvdW50OiAwLFxuXHRcdCogXHRcdHVucmVhZF9jb3VudF9kaXNwbGF5OiAwLFxuXHRcdCogXHRcdG1lbWJlcnM6IFsgdXNlcl9pZHMgXSxcblx0XHQqIFx0XHR0b3BpYzoge1xuXHRcdCogXHRcdFx0dmFsdWU6IFtjaGFubmVsX3RvcGljXSxcblx0XHQqIFx0XHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqIFx0XHRcdGxhc3Rfc2V0OiAwXG5cdFx0KiBcdFx0fSxcblx0XHQqIFx0XHRwdXJwb3NlOiB7XG5cdFx0KiBcdFx0XHR2YWx1ZTogW2NoYW5uZWxfcHVycG9zZV0sXG5cdFx0KiBcdFx0XHRjcmVhdG9yOiBbdXNlcl9pZF0sXG5cdFx0KiBcdFx0XHRsYXN0X3NldDogMFxuXHRcdCogXHRcdH1cblx0XHQqIFx0fVxuXHRcdCogfVxuXHRcdCAqKi9cblx0XHR0aGlzLnJ0bS5vbignZ3JvdXBfam9pbmVkJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0ICogRXZlbnQgZmlyZWQgd2hlbiB0aGUgYm90IGxlYXZlcyAob3IgaXMgcmVtb3ZlZCBmcm9tKSBhIHByaXZhdGUgY2hhbm5lbFxuXHRcdCAqIHtcblx0XHQqIFx0dHlwZTogJ2dyb3VwX2xlZnQnLFxuXHRcdCogXHRjaGFubmVsOiBbY2hhbm5lbF9pZF1cblx0XHQqIH1cblx0XHQgKiovXG5cdFx0dGhpcy5ydG0ub24oJ2dyb3VwX2xlZnQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQgKiBFdmVudCBmaXJlZCB3aGVuIHRoZSBwcml2YXRlIGNoYW5uZWwgaGFzIGl0cyBuYW1lIGNoYW5nZWRcblx0XHQgKiB7XG5cdFx0KiBcdHR5cGU6ICdncm91cF9yZW5hbWUnLFxuXHRcdCogXHRjaGFubmVsOiB7XG5cdFx0KiBcdFx0aWQ6IFtjaGFubmVsX2lkXSxcblx0XHQqIFx0XHRuYW1lOiBbY2hhbm5lbF9uYW1lXSxcblx0XHQqIFx0XHRpc19ncm91cDogdHJ1ZSxcblx0XHQqIFx0XHRjcmVhdGVkOiBbdHNdXG5cdFx0KiBcdH0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQgKiovXG5cdFx0dGhpcy5ydG0ub24oJ2dyb3VwX3JlbmFtZScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCAqIEV2ZW50IGZpcmVkIHdoZW4gYSBuZXcgdXNlciBqb2lucyB0aGUgdGVhbVxuXHRcdCAqIHtcblx0XHQqIFx0dHlwZTogJ3RlYW1fam9pbicsXG5cdFx0KiBcdHVzZXI6XG5cdFx0KiBcdHtcblx0XHQqIFx0XHRpZDogW3VzZXJfaWRdLFxuXHRcdCogXHRcdHRlYW1faWQ6IFt0ZWFtX2lkXSxcblx0XHQqIFx0XHRuYW1lOiBbdXNlcl9uYW1lXSxcblx0XHQqIFx0XHRkZWxldGVkOiBmYWxzZSxcblx0XHQqIFx0XHRzdGF0dXM6IG51bGwsXG5cdFx0KiBcdFx0Y29sb3I6IFtjb2xvcl9jb2RlXSxcblx0XHQqIFx0XHRyZWFsX25hbWU6ICcnLFxuXHRcdCogXHRcdHR6OiBbdGltZXpvbmVdLFxuXHRcdCogXHRcdHR6X2xhYmVsOiBbdGltZXpvbmVfbGFiZWxdLFxuXHRcdCogXHRcdHR6X29mZnNldDogW3RpbWV6b25lX29mZnNldF0sXG5cdFx0KiBcdFx0cHJvZmlsZTpcblx0XHQqIFx0XHR7XG5cdFx0KiBcdFx0XHRhdmF0YXJfaGFzaDogJycsXG5cdFx0KiBcdFx0XHRyZWFsX25hbWU6ICcnLFxuXHRcdCogXHRcdFx0cmVhbF9uYW1lX25vcm1hbGl6ZWQ6ICcnLFxuXHRcdCogXHRcdFx0ZW1haWw6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfMjQ6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfMzI6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfNDg6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfNzI6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfMTkyOiAnJyxcblx0XHQqIFx0XHRcdGltYWdlXzUxMjogJycsXG5cdFx0KiBcdFx0XHRmaWVsZHM6IG51bGxcblx0XHQqIFx0XHR9LFxuXHRcdCogXHRcdGlzX2FkbWluOiBmYWxzZSxcblx0XHQqIFx0XHRpc19vd25lcjogZmFsc2UsXG5cdFx0KiBcdFx0aXNfcHJpbWFyeV9vd25lcjogZmFsc2UsXG5cdFx0KiBcdFx0aXNfcmVzdHJpY3RlZDogZmFsc2UsXG5cdFx0KiBcdFx0aXNfdWx0cmFfcmVzdHJpY3RlZDogZmFsc2UsXG5cdFx0KiBcdFx0aXNfYm90OiBmYWxzZSxcblx0XHQqIFx0XHRwcmVzZW5jZTogW3VzZXJfcHJlc2VuY2VdXG5cdFx0KiBcdH0sXG5cdFx0KiBcdGNhY2hlX3RzOiBbdHNdXG5cdFx0KiB9XG5cdFx0ICoqL1xuXHRcdHRoaXMucnRtLm9uKCd0ZWFtX2pvaW4nLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL2V2ZW50cy9yZWFjdGlvbl9yZW1vdmVkXG5cdCAqL1xuXHRvblJlYWN0aW9uUmVtb3ZlZChzbGFja1JlYWN0aW9uTXNnKSB7XG5cdFx0aWYgKHNsYWNrUmVhY3Rpb25Nc2cpIHtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSB0aGlzLnJvY2tldC5nZXRVc2VyKHNsYWNrUmVhY3Rpb25Nc2cudXNlcik7XG5cdFx0XHQvL0xldHMgZmluZCBvdXIgUm9ja2V0IG9yaWdpbmF0ZWQgbWVzc2FnZVxuXHRcdFx0bGV0IHJvY2tldE1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeVNsYWNrVHMoc2xhY2tSZWFjdGlvbk1zZy5pdGVtLnRzKTtcblxuXHRcdFx0aWYgKCFyb2NrZXRNc2cpIHtcblx0XHRcdFx0Ly9NdXN0IGhhdmUgb3JpZ2luYXRlZCBmcm9tIFNsYWNrXG5cdFx0XHRcdGNvbnN0IHJvY2tldElEID0gdGhpcy5yb2NrZXQuY3JlYXRlUm9ja2V0SUQoc2xhY2tSZWFjdGlvbk1zZy5pdGVtLmNoYW5uZWwsIHNsYWNrUmVhY3Rpb25Nc2cuaXRlbS50cyk7XG5cdFx0XHRcdHJvY2tldE1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHJvY2tldElEKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJvY2tldE1zZyAmJiByb2NrZXRVc2VyKSB7XG5cdFx0XHRcdGNvbnN0IHJvY2tldFJlYWN0aW9uID0gYDokeyBzbGFja1JlYWN0aW9uTXNnLnJlYWN0aW9uIH06YDtcblxuXHRcdFx0XHQvL0lmIHRoZSBSb2NrZXQgdXNlciBoYXMgYWxyZWFkeSBiZWVuIHJlbW92ZWQsIHRoZW4gdGhpcyBpcyBhbiBlY2hvIGJhY2sgZnJvbSBzbGFja1xuXHRcdFx0XHRpZiAocm9ja2V0TXNnLnJlYWN0aW9ucykge1xuXHRcdFx0XHRcdGNvbnN0IHRoZVJlYWN0aW9uID0gcm9ja2V0TXNnLnJlYWN0aW9uc1tyb2NrZXRSZWFjdGlvbl07XG5cdFx0XHRcdFx0aWYgKHRoZVJlYWN0aW9uKSB7XG5cdFx0XHRcdFx0XHRpZiAodGhlUmVhY3Rpb24udXNlcm5hbWVzLmluZGV4T2Yocm9ja2V0VXNlci51c2VybmFtZSkgPT09IC0xKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybjsgLy9SZWFjdGlvbiBhbHJlYWR5IHJlbW92ZWRcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly9SZWFjdGlvbiBhbHJlYWR5IHJlbW92ZWRcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL1N0YXNoIHRoaXMgYXdheSB0byBrZXkgb2ZmIGl0IGxhdGVyIHNvIHdlIGRvbid0IHNlbmQgaXQgYmFjayB0byBTbGFja1xuXHRcdFx0XHR0aGlzLnNsYWNrQnJpZGdlLnJlYWN0aW9uc01hcC5zZXQoYHVuc2V0JHsgcm9ja2V0TXNnLl9pZCB9JHsgcm9ja2V0UmVhY3Rpb24gfWAsIHJvY2tldFVzZXIpO1xuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1JlbW92aW5nIHJlYWN0aW9uIGZyb20gU2xhY2snKTtcblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihyb2NrZXRVc2VyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRSZWFjdGlvbicsIHJvY2tldFJlYWN0aW9uLCByb2NrZXRNc2cuX2lkKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9ldmVudHMvcmVhY3Rpb25fYWRkZWRcblx0ICovXG5cdG9uUmVhY3Rpb25BZGRlZChzbGFja1JlYWN0aW9uTXNnKSB7XG5cdFx0aWYgKHNsYWNrUmVhY3Rpb25Nc2cpIHtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSB0aGlzLnJvY2tldC5nZXRVc2VyKHNsYWNrUmVhY3Rpb25Nc2cudXNlcik7XG5cblx0XHRcdGlmIChyb2NrZXRVc2VyLnJvbGVzLmluY2x1ZGVzKCdib3QnKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vTGV0cyBmaW5kIG91ciBSb2NrZXQgb3JpZ2luYXRlZCBtZXNzYWdlXG5cdFx0XHRsZXQgcm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5U2xhY2tUcyhzbGFja1JlYWN0aW9uTXNnLml0ZW0udHMpO1xuXG5cdFx0XHRpZiAoIXJvY2tldE1zZykge1xuXHRcdFx0XHQvL011c3QgaGF2ZSBvcmlnaW5hdGVkIGZyb20gU2xhY2tcblx0XHRcdFx0Y29uc3Qgcm9ja2V0SUQgPSB0aGlzLnJvY2tldC5jcmVhdGVSb2NrZXRJRChzbGFja1JlYWN0aW9uTXNnLml0ZW0uY2hhbm5lbCwgc2xhY2tSZWFjdGlvbk1zZy5pdGVtLnRzKTtcblx0XHRcdFx0cm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQocm9ja2V0SUQpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocm9ja2V0TXNnICYmIHJvY2tldFVzZXIpIHtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0UmVhY3Rpb24gPSBgOiR7IHNsYWNrUmVhY3Rpb25Nc2cucmVhY3Rpb24gfTpgO1xuXG5cdFx0XHRcdC8vSWYgdGhlIFJvY2tldCB1c2VyIGhhcyBhbHJlYWR5IHJlYWN0ZWQsIHRoZW4gdGhpcyBpcyBTbGFjayBlY2hvaW5nIGJhY2sgdG8gdXNcblx0XHRcdFx0aWYgKHJvY2tldE1zZy5yZWFjdGlvbnMpIHtcblx0XHRcdFx0XHRjb25zdCB0aGVSZWFjdGlvbiA9IHJvY2tldE1zZy5yZWFjdGlvbnNbcm9ja2V0UmVhY3Rpb25dO1xuXHRcdFx0XHRcdGlmICh0aGVSZWFjdGlvbikge1xuXHRcdFx0XHRcdFx0aWYgKHRoZVJlYWN0aW9uLnVzZXJuYW1lcy5pbmRleE9mKHJvY2tldFVzZXIudXNlcm5hbWUpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47IC8vQWxyZWFkeSByZWFjdGVkXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9TdGFzaCB0aGlzIGF3YXkgdG8ga2V5IG9mZiBpdCBsYXRlciBzbyB3ZSBkb24ndCBzZW5kIGl0IGJhY2sgdG8gU2xhY2tcblx0XHRcdFx0dGhpcy5zbGFja0JyaWRnZS5yZWFjdGlvbnNNYXAuc2V0KGBzZXQkeyByb2NrZXRNc2cuX2lkIH0keyByb2NrZXRSZWFjdGlvbiB9YCwgcm9ja2V0VXNlcik7XG5cdFx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnQWRkaW5nIHJlYWN0aW9uIGZyb20gU2xhY2snKTtcblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihyb2NrZXRVc2VyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRSZWFjdGlvbicsIHJvY2tldFJlYWN0aW9uLCByb2NrZXRNc2cuX2lkKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0b25DaGFubmVsTGVmdChjaGFubmVsTGVmdE1zZykge1xuXHRcdHRoaXMucmVtb3ZlU2xhY2tDaGFubmVsKGNoYW5uZWxMZWZ0TXNnLmNoYW5uZWwpO1xuXHR9XG5cdC8qKlxuXHQgKiBXZSBoYXZlIHJlY2VpdmVkIGEgbWVzc2FnZSBmcm9tIHNsYWNrIGFuZCB3ZSBuZWVkIHRvIHNhdmUvZGVsZXRlL3VwZGF0ZSBpdCBpbnRvIHJvY2tldFxuXHQgKiBodHRwczovL2FwaS5zbGFjay5jb20vZXZlbnRzL21lc3NhZ2Vcblx0ICovXG5cdG9uTWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKSB7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS5zdWJ0eXBlKSB7XG5cdFx0XHRzd2l0Y2ggKHNsYWNrTWVzc2FnZS5zdWJ0eXBlKSB7XG5cdFx0XHRcdGNhc2UgJ21lc3NhZ2VfZGVsZXRlZCc6XG5cdFx0XHRcdFx0dGhpcy5wcm9jZXNzTWVzc2FnZURlbGV0ZWQoc2xhY2tNZXNzYWdlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnbWVzc2FnZV9jaGFuZ2VkJzpcblx0XHRcdFx0XHR0aGlzLnByb2Nlc3NNZXNzYWdlQ2hhbmdlZChzbGFja01lc3NhZ2UpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdjaGFubmVsX2pvaW4nOlxuXHRcdFx0XHRcdHRoaXMucHJvY2Vzc0NoYW5uZWxKb2luKHNsYWNrTWVzc2FnZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0Ly9LZWVwaW5nIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5IGZvciBub3csIHJlZmFjdG9yIGxhdGVyXG5cdFx0XHRcdFx0dGhpcy5wcm9jZXNzTmV3TWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly9TaW1wbGUgbWVzc2FnZVxuXHRcdFx0dGhpcy5wcm9jZXNzTmV3TWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKTtcblx0XHR9XG5cdH1cblxuXHRwb3N0R2V0Q2hhbm5lbEluZm8oc2xhY2tDaElEKSB7XG5cdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdHZXR0aW5nIHNsYWNrIGNoYW5uZWwgaW5mbycsIHNsYWNrQ2hJRCk7XG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYW5uZWxzLmluZm8nLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogc2xhY2tDaElEIH0gfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhLmNoYW5uZWw7XG5cdFx0fVxuXHR9XG5cblx0cG9zdEZpbmRDaGFubmVsKHJvY2tldENoYW5uZWxOYW1lKSB7XG5cdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdTZWFyY2hpbmcgZm9yIFNsYWNrIGNoYW5uZWwgb3IgZ3JvdXAnLCByb2NrZXRDaGFubmVsTmFtZSk7XG5cdFx0bGV0IHJlc3BvbnNlID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9jaGFubmVscy5saXN0JywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiBfLmlzQXJyYXkocmVzcG9uc2UuZGF0YS5jaGFubmVscykgJiYgcmVzcG9uc2UuZGF0YS5jaGFubmVscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgcmVzcG9uc2UuZGF0YS5jaGFubmVscykge1xuXHRcdFx0XHRpZiAoY2hhbm5lbC5uYW1lID09PSByb2NrZXRDaGFubmVsTmFtZSAmJiBjaGFubmVsLmlzX21lbWJlciA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdHJldHVybiBjaGFubmVsO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJlc3BvbnNlID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9ncm91cHMubGlzdCcsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLmFwaVRva2VuIH0gfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEuZ3JvdXBzKSAmJiByZXNwb25zZS5kYXRhLmdyb3Vwcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGdyb3VwIG9mIHJlc3BvbnNlLmRhdGEuZ3JvdXBzKSB7XG5cdFx0XHRcdGlmIChncm91cC5uYW1lID09PSByb2NrZXRDaGFubmVsTmFtZSkge1xuXHRcdFx0XHRcdHJldHVybiBncm91cDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIFNsYWNrIFRTIGZyb20gYSBSb2NrZXQgbXNnIHRoYXQgb3JpZ2luYXRlZCBmcm9tIFNsYWNrXG5cdCAqIEBwYXJhbSByb2NrZXRNc2dcblx0ICogQHJldHVybnMgU2xhY2sgVFMgb3IgdW5kZWZpbmVkIGlmIG5vdCBhIG1lc3NhZ2UgdGhhdCBvcmlnaW5hdGVkIGZyb20gc2xhY2tcblx0ICogQHByaXZhdGVcblx0ICovXG5cdGdldFRpbWVTdGFtcChyb2NrZXRNc2cpIHtcblx0XHQvL3NsYWNrLUczS0pHR0UxNS0xNDgzMDgxMDYxLTAwMDE2OVxuXHRcdGxldCBzbGFja1RTO1xuXHRcdGxldCBpbmRleCA9IHJvY2tldE1zZy5faWQuaW5kZXhPZignc2xhY2stJyk7XG5cdFx0aWYgKGluZGV4ID09PSAwKSB7XG5cdFx0XHQvL1RoaXMgaXMgYSBtc2cgdGhhdCBvcmlnaW5hdGVkIGZyb20gU2xhY2tcblx0XHRcdHNsYWNrVFMgPSByb2NrZXRNc2cuX2lkLnN1YnN0cig2LCByb2NrZXRNc2cuX2lkLmxlbmd0aCk7XG5cdFx0XHRpbmRleCA9IHNsYWNrVFMuaW5kZXhPZignLScpO1xuXHRcdFx0c2xhY2tUUyA9IHNsYWNrVFMuc3Vic3RyKGluZGV4KzEsIHNsYWNrVFMubGVuZ3RoKTtcblx0XHRcdHNsYWNrVFMgPSBzbGFja1RTLnJlcGxhY2UoJy0nLCAnLicpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvL1RoaXMgcHJvYmFibHkgb3JpZ2luYXRlZCBhcyBhIFJvY2tldCBtc2csIGJ1dCBoYXMgYmVlbiBzZW50IHRvIFNsYWNrXG5cdFx0XHRzbGFja1RTID0gcm9ja2V0TXNnLnNsYWNrVHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHNsYWNrVFM7XG5cdH1cblxuXHQvKipcblx0ICogQWRkcyBhIHNsYWNrIGNoYW5uZWwgdG8gb3VyIGNvbGxlY3Rpb24gdGhhdCB0aGUgcm9ja2V0Ym90IGlzIGEgbWVtYmVyIG9mIG9uIHNsYWNrXG5cdCAqIEBwYXJhbSByb2NrZXRDaElEXG5cdCAqIEBwYXJhbSBzbGFja0NoSURcblx0ICovXG5cdGFkZFNsYWNrQ2hhbm5lbChyb2NrZXRDaElELCBzbGFja0NoSUQpIHtcblx0XHRjb25zdCBjaCA9IHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJvY2tldENoSUQpO1xuXHRcdGlmIChudWxsID09IGNoKSB7XG5cdFx0XHR0aGlzLnNsYWNrQ2hhbm5lbFJvY2tldEJvdE1lbWJlcnNoaXBNYXAuc2V0KHJvY2tldENoSUQsIHsgaWQ6IHNsYWNrQ2hJRCwgZmFtaWx5OiBzbGFja0NoSUQuY2hhckF0KDApID09PSAnQycgPyAnY2hhbm5lbHMnIDogJ2dyb3VwcycgfSk7XG5cdFx0fVxuXHR9XG5cblx0cmVtb3ZlU2xhY2tDaGFubmVsKHNsYWNrQ2hJRCkge1xuXHRcdGNvbnN0IGtleXMgPSB0aGlzLnNsYWNrQ2hhbm5lbFJvY2tldEJvdE1lbWJlcnNoaXBNYXAua2V5cygpO1xuXHRcdGxldCBzbGFja0NoYW5uZWw7XG5cdFx0bGV0IGtleTtcblx0XHR3aGlsZSAoKGtleSA9IGtleXMubmV4dCgpLnZhbHVlKSAhPSBudWxsKSB7XG5cdFx0XHRzbGFja0NoYW5uZWwgPSB0aGlzLnNsYWNrQ2hhbm5lbFJvY2tldEJvdE1lbWJlcnNoaXBNYXAuZ2V0KGtleSk7XG5cdFx0XHRpZiAoc2xhY2tDaGFubmVsLmlkID09PSBzbGFja0NoSUQpIHtcblx0XHRcdFx0Ly9Gb3VuZCBpdCwgbmVlZCB0byBkZWxldGUgaXRcblx0XHRcdFx0dGhpcy5zbGFja0NoYW5uZWxSb2NrZXRCb3RNZW1iZXJzaGlwTWFwLmRlbGV0ZShrZXkpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRnZXRTbGFja0NoYW5uZWwocm9ja2V0Q2hJRCkge1xuXHRcdHJldHVybiB0aGlzLnNsYWNrQ2hhbm5lbFJvY2tldEJvdE1lbWJlcnNoaXBNYXAuZ2V0KHJvY2tldENoSUQpO1xuXHR9XG5cblx0cG9wdWxhdGVNZW1iZXJzaGlwQ2hhbm5lbE1hcEJ5Q2hhbm5lbHMoKSB7XG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYW5uZWxzLmxpc3QnLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIF8uaXNBcnJheShyZXNwb25zZS5kYXRhLmNoYW5uZWxzKSAmJiByZXNwb25zZS5kYXRhLmNoYW5uZWxzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3Qgc2xhY2tDaGFubmVsIG9mIHJlc3BvbnNlLmRhdGEuY2hhbm5lbHMpIHtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0Y2hhdF9yb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZShzbGFja0NoYW5uZWwubmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0XHRcdGlmIChyb2NrZXRjaGF0X3Jvb20pIHtcblx0XHRcdFx0XHRpZiAoc2xhY2tDaGFubmVsLmlzX21lbWJlcikge1xuXHRcdFx0XHRcdFx0dGhpcy5hZGRTbGFja0NoYW5uZWwocm9ja2V0Y2hhdF9yb29tLl9pZCwgc2xhY2tDaGFubmVsLmlkKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwb3B1bGF0ZU1lbWJlcnNoaXBDaGFubmVsTWFwQnlHcm91cHMoKSB7XG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2dyb3Vwcy5saXN0JywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiBfLmlzQXJyYXkocmVzcG9uc2UuZGF0YS5ncm91cHMpICYmIHJlc3BvbnNlLmRhdGEuZ3JvdXBzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3Qgc2xhY2tHcm91cCBvZiByZXNwb25zZS5kYXRhLmdyb3Vwcykge1xuXHRcdFx0XHRjb25zdCByb2NrZXRjaGF0X3Jvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHNsYWNrR3JvdXAubmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0XHRcdGlmIChyb2NrZXRjaGF0X3Jvb20pIHtcblx0XHRcdFx0XHRpZiAoc2xhY2tHcm91cC5pc19tZW1iZXIpIHtcblx0XHRcdFx0XHRcdHRoaXMuYWRkU2xhY2tDaGFubmVsKHJvY2tldGNoYXRfcm9vbS5faWQsIHNsYWNrR3JvdXAuaWQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHBvcHVsYXRlTWVtYmVyc2hpcENoYW5uZWxNYXAoKSB7XG5cdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdQb3B1bGF0aW5nIGNoYW5uZWwgbWFwJyk7XG5cdFx0dGhpcy5wb3B1bGF0ZU1lbWJlcnNoaXBDaGFubmVsTWFwQnlDaGFubmVscygpO1xuXHRcdHRoaXMucG9wdWxhdGVNZW1iZXJzaGlwQ2hhbm5lbE1hcEJ5R3JvdXBzKCk7XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL21ldGhvZHMvcmVhY3Rpb25zLmFkZFxuXHQgKi9cblx0cG9zdFJlYWN0aW9uQWRkZWQocmVhY3Rpb24sIHNsYWNrQ2hhbm5lbCwgc2xhY2tUUykge1xuXHRcdGlmIChyZWFjdGlvbiAmJiBzbGFja0NoYW5uZWwgJiYgc2xhY2tUUykge1xuXHRcdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdFx0dG9rZW46IHRoaXMuYXBpVG9rZW4sXG5cdFx0XHRcdG5hbWU6IHJlYWN0aW9uLFxuXHRcdFx0XHRjaGFubmVsOiBzbGFja0NoYW5uZWwsXG5cdFx0XHRcdHRpbWVzdGFtcDogc2xhY2tUU1xuXHRcdFx0fTtcblxuXHRcdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdQb3N0aW5nIEFkZCBSZWFjdGlvbiB0byBTbGFjaycpO1xuXHRcdFx0Y29uc3QgcG9zdFJlc3VsdCA9IEhUVFAucG9zdCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL3JlYWN0aW9ucy5hZGQnLCB7IHBhcmFtczogZGF0YSB9KTtcblx0XHRcdGlmIChwb3N0UmVzdWx0LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBwb3N0UmVzdWx0LmRhdGEgJiYgcG9zdFJlc3VsdC5kYXRhLm9rID09PSB0cnVlKSB7XG5cdFx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnUmVhY3Rpb24gYWRkZWQgdG8gU2xhY2snKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL21ldGhvZHMvcmVhY3Rpb25zLnJlbW92ZVxuXHQgKi9cblx0cG9zdFJlYWN0aW9uUmVtb3ZlKHJlYWN0aW9uLCBzbGFja0NoYW5uZWwsIHNsYWNrVFMpIHtcblx0XHRpZiAocmVhY3Rpb24gJiYgc2xhY2tDaGFubmVsICYmIHNsYWNrVFMpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHRuYW1lOiByZWFjdGlvbixcblx0XHRcdFx0Y2hhbm5lbDogc2xhY2tDaGFubmVsLFxuXHRcdFx0XHR0aW1lc3RhbXA6IHNsYWNrVFNcblx0XHRcdH07XG5cblx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnUG9zdGluZyBSZW1vdmUgUmVhY3Rpb24gdG8gU2xhY2snKTtcblx0XHRcdGNvbnN0IHBvc3RSZXN1bHQgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9yZWFjdGlvbnMucmVtb3ZlJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1JlYWN0aW9uIHJlbW92ZWQgZnJvbSBTbGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHBvc3REZWxldGVNZXNzYWdlKHJvY2tldE1lc3NhZ2UpIHtcblx0XHRpZiAocm9ja2V0TWVzc2FnZSkge1xuXHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5nZXRTbGFja0NoYW5uZWwocm9ja2V0TWVzc2FnZS5yaWQpO1xuXG5cdFx0XHRpZiAoc2xhY2tDaGFubmVsICE9IG51bGwpIHtcblx0XHRcdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdFx0XHR0b2tlbjogdGhpcy5hcGlUb2tlbixcblx0XHRcdFx0XHR0czogdGhpcy5nZXRUaW1lU3RhbXAocm9ja2V0TWVzc2FnZSksXG5cdFx0XHRcdFx0Y2hhbm5lbDogdGhpcy5nZXRTbGFja0NoYW5uZWwocm9ja2V0TWVzc2FnZS5yaWQpLmlkLFxuXHRcdFx0XHRcdGFzX3VzZXI6IHRydWVcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1Bvc3QgRGVsZXRlIE1lc3NhZ2UgdG8gU2xhY2snLCBkYXRhKTtcblx0XHRcdFx0Y29uc3QgcG9zdFJlc3VsdCA9IEhUVFAucG9zdCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYXQuZGVsZXRlJywge3BhcmFtczogZGF0YX0pO1xuXHRcdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnTWVzc2FnZSBkZWxldGVkIG9uIFNsYWNrJyk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwb3N0TWVzc2FnZShzbGFja0NoYW5uZWwsIHJvY2tldE1lc3NhZ2UpIHtcblx0XHRpZiAoc2xhY2tDaGFubmVsICYmIHNsYWNrQ2hhbm5lbC5pZCkge1xuXHRcdFx0bGV0IGljb25VcmwgPSBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUocm9ja2V0TWVzc2FnZS51ICYmIHJvY2tldE1lc3NhZ2UudS51c2VybmFtZSk7XG5cdFx0XHRpZiAoaWNvblVybCkge1xuXHRcdFx0XHRpY29uVXJsID0gTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXFwvJC8sICcnKSArIGljb25Vcmw7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0XHR0b2tlbjogdGhpcy5hcGlUb2tlbixcblx0XHRcdFx0dGV4dDogcm9ja2V0TWVzc2FnZS5tc2csXG5cdFx0XHRcdGNoYW5uZWw6IHNsYWNrQ2hhbm5lbC5pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHJvY2tldE1lc3NhZ2UudSAmJiByb2NrZXRNZXNzYWdlLnUudXNlcm5hbWUsXG5cdFx0XHRcdGljb25fdXJsOiBpY29uVXJsLFxuXHRcdFx0XHRsaW5rX25hbWVzOiAxXG5cdFx0XHR9O1xuXHRcdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdQb3N0IE1lc3NhZ2UgVG8gU2xhY2snLCBkYXRhKTtcblx0XHRcdGNvbnN0IHBvc3RSZXN1bHQgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9jaGF0LnBvc3RNZXNzYWdlJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlICYmIHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLmJvdF9pZCAmJiBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS50cykge1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRTbGFja0JvdElkQW5kU2xhY2tUcyhyb2NrZXRNZXNzYWdlLl9pZCwgcG9zdFJlc3VsdC5kYXRhLm1lc3NhZ2UuYm90X2lkLCBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS50cyk7XG5cdFx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZyhgUm9ja2V0TXNnSUQ9JHsgcm9ja2V0TWVzc2FnZS5faWQgfSBTbGFja01zZ0lEPSR7IHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLnRzIH0gU2xhY2tCb3RJRD0keyBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS5ib3RfaWQgfWApO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vbWV0aG9kcy9jaGF0LnVwZGF0ZVxuXHQgKi9cblx0cG9zdE1lc3NhZ2VVcGRhdGUoc2xhY2tDaGFubmVsLCByb2NrZXRNZXNzYWdlKSB7XG5cdFx0aWYgKHNsYWNrQ2hhbm5lbCAmJiBzbGFja0NoYW5uZWwuaWQpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHR0czogdGhpcy5nZXRUaW1lU3RhbXAocm9ja2V0TWVzc2FnZSksXG5cdFx0XHRcdGNoYW5uZWw6IHNsYWNrQ2hhbm5lbC5pZCxcblx0XHRcdFx0dGV4dDogcm9ja2V0TWVzc2FnZS5tc2csXG5cdFx0XHRcdGFzX3VzZXI6IHRydWVcblx0XHRcdH07XG5cdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1Bvc3QgVXBkYXRlTWVzc2FnZSBUbyBTbGFjaycsIGRhdGEpO1xuXHRcdFx0Y29uc3QgcG9zdFJlc3VsdCA9IEhUVFAucG9zdCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYXQudXBkYXRlJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ01lc3NhZ2UgdXBkYXRlZCBvbiBTbGFjaycpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NDaGFubmVsSm9pbihzbGFja01lc3NhZ2UpIHtcblx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ0NoYW5uZWwgam9pbicsIHNsYWNrTWVzc2FnZS5jaGFubmVsLmlkKTtcblx0XHRjb25zdCByb2NrZXRDaCA9IHRoaXMucm9ja2V0LmFkZENoYW5uZWwoc2xhY2tNZXNzYWdlLmNoYW5uZWwpO1xuXHRcdGlmIChudWxsICE9IHJvY2tldENoKSB7XG5cdFx0XHR0aGlzLmFkZFNsYWNrQ2hhbm5lbChyb2NrZXRDaC5faWQsIHNsYWNrTWVzc2FnZS5jaGFubmVsKTtcblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL2V2ZW50cy9tZXNzYWdlL21lc3NhZ2VfZGVsZXRlZFxuXHQgKi9cblx0cHJvY2Vzc01lc3NhZ2VEZWxldGVkKHNsYWNrTWVzc2FnZSkge1xuXHRcdGlmIChzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZSkge1xuXHRcdFx0Y29uc3Qgcm9ja2V0Q2hhbm5lbCA9IHRoaXMucm9ja2V0LmdldENoYW5uZWwoc2xhY2tNZXNzYWdlKTtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCgncm9ja2V0LmNhdCcsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH0gfSk7XG5cblx0XHRcdGlmIChyb2NrZXRDaGFubmVsICYmIHJvY2tldFVzZXIpIHtcblx0XHRcdFx0Ly9GaW5kIHRoZSBSb2NrZXQgbWVzc2FnZSB0byBkZWxldGVcblx0XHRcdFx0bGV0IHJvY2tldE1zZ09iaiA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzXG5cdFx0XHRcdFx0LmZpbmRPbmVCeVNsYWNrQm90SWRBbmRTbGFja1RzKHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLmJvdF9pZCwgc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudHMpO1xuXG5cdFx0XHRcdGlmICghcm9ja2V0TXNnT2JqKSB7XG5cdFx0XHRcdFx0Ly9NdXN0IGhhdmUgYmVlbiBhIFNsYWNrIG9yaWdpbmF0ZWQgbXNnXG5cdFx0XHRcdFx0Y29uc3QgX2lkID0gdGhpcy5yb2NrZXQuY3JlYXRlUm9ja2V0SUQoc2xhY2tNZXNzYWdlLmNoYW5uZWwsIHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLnRzKTtcblx0XHRcdFx0XHRyb2NrZXRNc2dPYmogPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChfaWQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHJvY2tldE1zZ09iaikge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuZGVsZXRlTWVzc2FnZShyb2NrZXRNc2dPYmosIHJvY2tldFVzZXIpO1xuXHRcdFx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnUm9ja2V0IG1lc3NhZ2UgZGVsZXRlZCBieSBTbGFjaycpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9ldmVudHMvbWVzc2FnZS9tZXNzYWdlX2NoYW5nZWRcblx0ICovXG5cdHByb2Nlc3NNZXNzYWdlQ2hhbmdlZChzbGFja01lc3NhZ2UpIHtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UpIHtcblx0XHRcdGNvbnN0IGN1cnJlbnRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLnJvY2tldC5jcmVhdGVSb2NrZXRJRChzbGFja01lc3NhZ2UuY2hhbm5lbCwgc2xhY2tNZXNzYWdlLm1lc3NhZ2UudHMpKTtcblxuXHRcdFx0Ly9Pbmx5IHByb2Nlc3MgdGhpcyBjaGFuZ2UsIGlmIGl0cyBhbiBhY3R1YWwgdXBkYXRlIChub3QganVzdCBTbGFjayByZXBlYXRpbmcgYmFjayBvdXIgUm9ja2V0IG9yaWdpbmFsIGNoYW5nZSlcblx0XHRcdGlmIChjdXJyZW50TXNnICYmIChzbGFja01lc3NhZ2UubWVzc2FnZS50ZXh0ICE9PSBjdXJyZW50TXNnLm1zZykpIHtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0Q2hhbm5lbCA9IHRoaXMucm9ja2V0LmdldENoYW5uZWwoc2xhY2tNZXNzYWdlKTtcblx0XHRcdFx0Y29uc3Qgcm9ja2V0VXNlciA9IHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLnVzZXIgPyB0aGlzLnJvY2tldC5maW5kVXNlcihzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZS51c2VyKSB8fCB0aGlzLnJvY2tldC5hZGRVc2VyKHNsYWNrTWVzc2FnZS5wcmV2aW91c19tZXNzYWdlLnVzZXIpIDogbnVsbDtcblxuXHRcdFx0XHRjb25zdCByb2NrZXRNc2dPYmogPSB7XG5cdFx0XHRcdFx0Ly9AVE9ETyBfaWRcblx0XHRcdFx0XHRfaWQ6IHRoaXMucm9ja2V0LmNyZWF0ZVJvY2tldElEKHNsYWNrTWVzc2FnZS5jaGFubmVsLCBzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZS50cyksXG5cdFx0XHRcdFx0cmlkOiByb2NrZXRDaGFubmVsLl9pZCxcblx0XHRcdFx0XHRtc2c6IHRoaXMucm9ja2V0LmNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTWVzc2FnZS5tZXNzYWdlLnRleHQpLFxuXHRcdFx0XHRcdHVwZGF0ZWRCeVNsYWNrOiB0cnVlXHQvL1dlIGRvbid0IHdhbnQgdG8gbm90aWZ5IHNsYWNrIGFib3V0IHRoaXMgY2hhbmdlIHNpbmNlIFNsYWNrIGluaXRpYXRlZCBpdFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFJvY2tldENoYXQudXBkYXRlTWVzc2FnZShyb2NrZXRNc2dPYmosIHJvY2tldFVzZXIpO1xuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1JvY2tldCBtZXNzYWdlIHVwZGF0ZWQgYnkgU2xhY2snKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgVGhpcyBtZXRob2Qgd2lsbCBnZXQgcmVmYWN0b3JlZCBhbmQgYnJva2VuIGRvd24gaW50byBzaW5nbGUgcmVzcG9uc2liaWxpdGllc1xuXHQgKi9cblx0cHJvY2Vzc05ld01lc3NhZ2Uoc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZykge1xuXHRcdGNvbnN0IHJvY2tldENoYW5uZWwgPSB0aGlzLnJvY2tldC5nZXRDaGFubmVsKHNsYWNrTWVzc2FnZSk7XG5cdFx0bGV0IHJvY2tldFVzZXIgPSBudWxsO1xuXHRcdGlmIChzbGFja01lc3NhZ2Uuc3VidHlwZSA9PT0gJ2JvdF9tZXNzYWdlJykge1xuXHRcdFx0cm9ja2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKCdyb2NrZXQuY2F0JywgeyBmaWVsZHM6IHsgdXNlcm5hbWU6IDEgfSB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cm9ja2V0VXNlciA9IHNsYWNrTWVzc2FnZS51c2VyID8gdGhpcy5yb2NrZXQuZmluZFVzZXIoc2xhY2tNZXNzYWdlLnVzZXIpIHx8IHRoaXMucm9ja2V0LmFkZFVzZXIoc2xhY2tNZXNzYWdlLnVzZXIpIDogbnVsbDtcblx0XHR9XG5cdFx0aWYgKHJvY2tldENoYW5uZWwgJiYgcm9ja2V0VXNlcikge1xuXHRcdFx0Y29uc3QgbXNnRGF0YURlZmF1bHRzID0ge1xuXHRcdFx0XHRfaWQ6IHRoaXMucm9ja2V0LmNyZWF0ZVJvY2tldElEKHNsYWNrTWVzc2FnZS5jaGFubmVsLCBzbGFja01lc3NhZ2UudHMpLFxuXHRcdFx0XHR0czogbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMClcblx0XHRcdH07XG5cdFx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0bXNnRGF0YURlZmF1bHRzWydpbXBvcnRlZCddID0gJ3NsYWNrYnJpZGdlJztcblx0XHRcdH1cblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMucm9ja2V0LmNyZWF0ZUFuZFNhdmVNZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgbXNnRGF0YURlZmF1bHRzLCBpc0ltcG9ydGluZyk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvYWJvdXQvY29udHJpYnV0b3JzL2Vycm9yLWNvZGVzL1xuXHRcdFx0XHQvLyAxMTAwMCA9PSBkdXBsaWNhdGUga2V5IGVycm9yXG5cdFx0XHRcdGlmIChlLm5hbWUgPT09ICdNb25nb0Vycm9yJyAmJiBlLmNvZGUgPT09IDExMDAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcm9jZXNzQm90TWVzc2FnZShyb2NrZXRDaGFubmVsLCBzbGFja01lc3NhZ2UpIHtcblx0XHRjb25zdCBleGNsdWRlQm90TmFtZXMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfQm90bmFtZXMnKTtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnVzZXJuYW1lICE9PSB1bmRlZmluZWQgJiYgZXhjbHVkZUJvdE5hbWVzICYmIHNsYWNrTWVzc2FnZS51c2VybmFtZS5tYXRjaChleGNsdWRlQm90TmFtZXMpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9ja2V0TXNnT2JqID0ge1xuXHRcdFx0bXNnOiB0aGlzLnJvY2tldC5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UudGV4dCksXG5cdFx0XHRyaWQ6IHJvY2tldENoYW5uZWwuX2lkLFxuXHRcdFx0Ym90OiB0cnVlLFxuXHRcdFx0YXR0YWNobWVudHM6IHNsYWNrTWVzc2FnZS5hdHRhY2htZW50cyxcblx0XHRcdHVzZXJuYW1lOiBzbGFja01lc3NhZ2UudXNlcm5hbWUgfHwgc2xhY2tNZXNzYWdlLmJvdF9pZFxuXHRcdH07XG5cdFx0dGhpcy5yb2NrZXQuYWRkQWxpYXNUb01zZyhzbGFja01lc3NhZ2UudXNlcm5hbWUgfHwgc2xhY2tNZXNzYWdlLmJvdF9pZCwgcm9ja2V0TXNnT2JqKTtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLmljb25zKSB7XG5cdFx0XHRyb2NrZXRNc2dPYmouZW1vamkgPSBzbGFja01lc3NhZ2UuaWNvbnMuZW1vamk7XG5cdFx0fVxuXHRcdHJldHVybiByb2NrZXRNc2dPYmo7XG5cdH1cblxuXHRwcm9jZXNzTWVNZXNzYWdlKHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSkge1xuXHRcdHJldHVybiB0aGlzLnJvY2tldC5hZGRBbGlhc1RvTXNnKHJvY2tldFVzZXIudXNlcm5hbWUsIHtcblx0XHRcdG1zZzogYF8keyB0aGlzLnJvY2tldC5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UudGV4dCkgfV9gXG5cdFx0fSk7XG5cdH1cblxuXHRwcm9jZXNzQ2hhbm5lbEpvaW5NZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpIHtcblx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIocm9ja2V0Q2hhbm5lbC5faWQsIHJvY2tldFVzZXIsIHsgdHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJyB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Um9ja2V0Q2hhdC5hZGRVc2VyVG9Sb29tKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyKTtcblx0XHR9XG5cdH1cblxuXHRwcm9jZXNzR3JvdXBKb2luTWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKSB7XG5cdFx0aWYgKHNsYWNrTWVzc2FnZS5pbnZpdGVyKSB7XG5cdFx0XHRjb25zdCBpbnZpdGVyID0gc2xhY2tNZXNzYWdlLmludml0ZXIgPyB0aGlzLnJvY2tldC5maW5kVXNlcihzbGFja01lc3NhZ2UuaW52aXRlcikgfHwgdGhpcy5yb2NrZXQuYWRkVXNlcihzbGFja01lc3NhZ2UuaW52aXRlcikgOiBudWxsO1xuXHRcdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVVzZXJBZGRlZFdpdGhSb29tSWRBbmRVc2VyKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyLCB7XG5cdFx0XHRcdFx0dHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLFxuXHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdF9pZDogaW52aXRlci5faWQsXG5cdFx0XHRcdFx0XHR1c2VybmFtZTogaW52aXRlci51c2VybmFtZVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0aW1wb3J0ZWQ6ICdzbGFja2JyaWRnZSdcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRSb2NrZXRDaGF0LmFkZFVzZXJUb1Jvb20ocm9ja2V0Q2hhbm5lbC5faWQsIHJvY2tldFVzZXIsIGludml0ZXIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NMZWF2ZU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZykge1xuXHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckxlYXZlV2l0aFJvb21JZEFuZFVzZXIocm9ja2V0Q2hhbm5lbC5faWQsIHJvY2tldFVzZXIsIHtcblx0XHRcdFx0dHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLFxuXHRcdFx0XHRpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJ1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdFJvY2tldENoYXQucmVtb3ZlVXNlckZyb21Sb29tKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyKTtcblx0XHR9XG5cdH1cblxuXHRwcm9jZXNzVG9waWNNZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpIHtcblx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tX2NoYW5nZWRfdG9waWMnLCByb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLnRvcGljLCByb2NrZXRVc2VyLCB7IHRzOiBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaW1wb3J0ZWQ6ICdzbGFja2JyaWRnZScgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Ub3BpYyhyb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLnRvcGljLCByb2NrZXRVc2VyLCBmYWxzZSk7XG5cdFx0fVxuXHR9XG5cblx0cHJvY2Vzc1B1cnBvc2VNZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpIHtcblx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tX2NoYW5nZWRfdG9waWMnLCByb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLnB1cnBvc2UsIHJvY2tldFVzZXIsIHsgdHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJyB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljKHJvY2tldENoYW5uZWwuX2lkLCBzbGFja01lc3NhZ2UucHVycG9zZSwgcm9ja2V0VXNlciwgZmFsc2UpO1xuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NOYW1lTWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKSB7XG5cdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIocm9ja2V0Q2hhbm5lbC5faWQsIHNsYWNrTWVzc2FnZS5uYW1lLCByb2NrZXRVc2VyLCB7IHRzOiBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaW1wb3J0ZWQ6ICdzbGFja2JyaWRnZScgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21OYW1lKHJvY2tldENoYW5uZWwuX2lkLCBzbGFja01lc3NhZ2UubmFtZSwgcm9ja2V0VXNlciwgZmFsc2UpO1xuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NTaGFyZU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZykge1xuXHRcdGlmIChzbGFja01lc3NhZ2UuZmlsZSAmJiBzbGFja01lc3NhZ2UuZmlsZS51cmxfcHJpdmF0ZV9kb3dubG9hZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBkZXRhaWxzID0ge1xuXHRcdFx0XHRtZXNzYWdlX2lkOiBgc2xhY2stJHsgc2xhY2tNZXNzYWdlLnRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gLFxuXHRcdFx0XHRuYW1lOiBzbGFja01lc3NhZ2UuZmlsZS5uYW1lLFxuXHRcdFx0XHRzaXplOiBzbGFja01lc3NhZ2UuZmlsZS5zaXplLFxuXHRcdFx0XHR0eXBlOiBzbGFja01lc3NhZ2UuZmlsZS5taW1ldHlwZSxcblx0XHRcdFx0cmlkOiByb2NrZXRDaGFubmVsLl9pZFxuXHRcdFx0fTtcblx0XHRcdHJldHVybiB0aGlzLnVwbG9hZEZpbGVGcm9tU2xhY2soZGV0YWlscywgc2xhY2tNZXNzYWdlLmZpbGUudXJsX3ByaXZhdGVfZG93bmxvYWQsIHJvY2tldFVzZXIsIHJvY2tldENoYW5uZWwsIG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpc0ltcG9ydGluZyk7XG5cdFx0fVxuXHR9XG5cblx0cHJvY2Vzc1Bpbm5lZEl0ZW1NZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpIHtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzICYmIHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXSAmJiBzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0udGV4dCkge1xuXHRcdFx0Y29uc3Qgcm9ja2V0TXNnT2JqID0ge1xuXHRcdFx0XHRyaWQ6IHJvY2tldENoYW5uZWwuX2lkLFxuXHRcdFx0XHR0OiAnbWVzc2FnZV9waW5uZWQnLFxuXHRcdFx0XHRtc2c6ICcnLFxuXHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0X2lkOiByb2NrZXRVc2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogcm9ja2V0VXNlci51c2VybmFtZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhdHRhY2htZW50czogW3tcblx0XHRcdFx0XHQndGV4dCcgOiB0aGlzLnJvY2tldC5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0udGV4dCksXG5cdFx0XHRcdFx0J2F1dGhvcl9uYW1lJyA6IHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS5hdXRob3Jfc3VibmFtZSxcblx0XHRcdFx0XHQnYXV0aG9yX2ljb24nIDogZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lKHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS5hdXRob3Jfc3VibmFtZSksXG5cdFx0XHRcdFx0J3RzJyA6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApXG5cdFx0XHRcdH1dXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoIWlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFBpbm5lZEJ5SWRBbmRVc2VySWQoYHNsYWNrLSR7IHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS5jaGFubmVsX2lkIH0tJHsgc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzWzBdLnRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gLCByb2NrZXRNc2dPYmoudSwgdHJ1ZSwgbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcm9ja2V0TXNnT2JqO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsb2dnZXIuc2xhY2suZXJyb3IoJ1Bpbm5lZCBpdGVtIHdpdGggbm8gYXR0YWNobWVudCcpO1xuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NTdWJ0eXBlZE1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZykge1xuXHRcdHN3aXRjaCAoc2xhY2tNZXNzYWdlLnN1YnR5cGUpIHtcblx0XHRcdGNhc2UgJ2JvdF9tZXNzYWdlJzpcblx0XHRcdFx0cmV0dXJuIHRoaXMucHJvY2Vzc0JvdE1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgc2xhY2tNZXNzYWdlKTtcblx0XHRcdGNhc2UgJ21lX21lc3NhZ2UnOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzTWVNZXNzYWdlKHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSk7XG5cdFx0XHRjYXNlICdjaGFubmVsX2pvaW4nOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzQ2hhbm5lbEpvaW5NZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpO1xuXHRcdFx0Y2FzZSAnZ3JvdXBfam9pbic6XG5cdFx0XHRcdHJldHVybiB0aGlzLnByb2Nlc3NHcm91cEpvaW5NZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF9sZWF2ZSc6XG5cdFx0XHRjYXNlICdncm91cF9sZWF2ZSc6XG5cdFx0XHRcdHJldHVybiB0aGlzLnByb2Nlc3NMZWF2ZU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZyk7XG5cdFx0XHRjYXNlICdjaGFubmVsX3RvcGljJzpcblx0XHRcdGNhc2UgJ2dyb3VwX3RvcGljJzpcblx0XHRcdFx0cmV0dXJuIHRoaXMucHJvY2Vzc1RvcGljTWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKTtcblx0XHRcdGNhc2UgJ2NoYW5uZWxfcHVycG9zZSc6XG5cdFx0XHRjYXNlICdncm91cF9wdXJwb3NlJzpcblx0XHRcdFx0cmV0dXJuIHRoaXMucHJvY2Vzc1B1cnBvc2VNZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF9uYW1lJzpcblx0XHRcdGNhc2UgJ2dyb3VwX25hbWUnOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzTmFtZU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZyk7XG5cdFx0XHRjYXNlICdjaGFubmVsX2FyY2hpdmUnOlxuXHRcdFx0Y2FzZSAnZ3JvdXBfYXJjaGl2ZSc6XG5cdFx0XHRcdGlmICghaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LmFyY2hpdmVSb29tKHJvY2tldENoYW5uZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgJ2NoYW5uZWxfdW5hcmNoaXZlJzpcblx0XHRcdGNhc2UgJ2dyb3VwX3VuYXJjaGl2ZSc6XG5cdFx0XHRcdGlmICghaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnVuYXJjaGl2ZVJvb20ocm9ja2V0Q2hhbm5lbCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnZmlsZV9zaGFyZSc6XG5cdFx0XHRcdHJldHVybiB0aGlzLnByb2Nlc3NTaGFyZU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZyk7XG5cdFx0XHRjYXNlICdmaWxlX2NvbW1lbnQnOlxuXHRcdFx0XHRsb2dnZXIuc2xhY2suZXJyb3IoJ0ZpbGUgY29tbWVudCBub3QgaW1wbGVtZW50ZWQnKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnZmlsZV9tZW50aW9uJzpcblx0XHRcdFx0bG9nZ2VyLnNsYWNrLmVycm9yKCdGaWxlIG1lbnRpb25lZCBub3QgaW1wbGVtZW50ZWQnKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAncGlubmVkX2l0ZW0nOlxuXHRcdFx0XHRyZXR1cm4gdGhpcy5wcm9jZXNzUGlubmVkSXRlbU1lc3NhZ2Uocm9ja2V0Q2hhbm5lbCwgcm9ja2V0VXNlciwgc2xhY2tNZXNzYWdlLCBpc0ltcG9ydGluZyk7XG5cdFx0XHRjYXNlICd1bnBpbm5lZF9pdGVtJzpcblx0XHRcdFx0bG9nZ2VyLnNsYWNrLmVycm9yKCdVbnBpbm5lZCBpdGVtIG5vdCBpbXBsZW1lbnRlZCcpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdFVwbG9hZHMgdGhlIGZpbGUgdG8gdGhlIHN0b3JhZ2UuXG5cdEBwYXJhbSBbT2JqZWN0XSBkZXRhaWxzIGFuIG9iamVjdCB3aXRoIGRldGFpbHMgYWJvdXQgdGhlIHVwbG9hZC4gbmFtZSwgc2l6ZSwgdHlwZSwgYW5kIHJpZFxuXHRAcGFyYW0gW1N0cmluZ10gZmlsZVVybCB1cmwgb2YgdGhlIGZpbGUgdG8gZG93bmxvYWQvaW1wb3J0XG5cdEBwYXJhbSBbT2JqZWN0XSB1c2VyIHRoZSBSb2NrZXQuQ2hhdCB1c2VyXG5cdEBwYXJhbSBbT2JqZWN0XSByb29tIHRoZSBSb2NrZXQuQ2hhdCByb29tXG5cdEBwYXJhbSBbRGF0ZV0gdGltZVN0YW1wIHRoZSB0aW1lc3RhbXAgdGhlIGZpbGUgd2FzIHVwbG9hZGVkXG5cdCoqL1xuXHQvL2RldGFpbHMsIHNsYWNrTWVzc2FnZS5maWxlLnVybF9wcml2YXRlX2Rvd25sb2FkLCByb2NrZXRVc2VyLCByb2NrZXRDaGFubmVsLCBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaXNJbXBvcnRpbmcpO1xuXHR1cGxvYWRGaWxlRnJvbVNsYWNrKGRldGFpbHMsIHNsYWNrRmlsZVVSTCwgcm9ja2V0VXNlciwgcm9ja2V0Q2hhbm5lbCwgdGltZVN0YW1wLCBpc0ltcG9ydGluZykge1xuXHRcdGNvbnN0IHJlcXVlc3RNb2R1bGUgPSAvaHR0cHMvaS50ZXN0KHNsYWNrRmlsZVVSTCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0Y29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHNsYWNrRmlsZVVSTCwgdHJ1ZSk7XG5cdFx0cGFyc2VkVXJsLmhlYWRlcnMgPSB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyB0aGlzLmFwaVRva2VuIH1gIH07XG5cdFx0cmVxdWVzdE1vZHVsZS5nZXQocGFyc2VkVXJsLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChzdHJlYW0pID0+IHtcblx0XHRcdGNvbnN0IGZpbGVTdG9yZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmUoJ1VwbG9hZHMnKTtcblxuXHRcdFx0ZmlsZVN0b3JlLmluc2VydChkZXRhaWxzLCBzdHJlYW0sIChlcnIsIGZpbGUpID0+IHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IHVybCA9IGZpbGUudXJsLnJlcGxhY2UoTWV0ZW9yLmFic29sdXRlVXJsKCksICcvJyk7XG5cdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudCA9IHtcblx0XHRcdFx0XHRcdHRpdGxlOiBmaWxlLm5hbWUsXG5cdFx0XHRcdFx0XHR0aXRsZV9saW5rOiB1cmxcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aWYgKC9eaW1hZ2VcXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX3VybCA9IHVybDtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2Vfc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfZGltZW5zaW9ucyA9IGZpbGUuaWRlbnRpZnkgJiYgZmlsZS5pZGVudGlmeS5zaXplO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoL15hdWRpb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fdXJsID0gdXJsO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb19zaXplID0gZmlsZS5zaXplO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoL152aWRlb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdXJsID0gdXJsO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC52aWRlb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC52aWRlb19zaXplID0gZmlsZS5zaXplO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IG1zZyA9IHtcblx0XHRcdFx0XHRcdHJpZDogZGV0YWlscy5yaWQsXG5cdFx0XHRcdFx0XHR0czogdGltZVN0YW1wLFxuXHRcdFx0XHRcdFx0bXNnOiAnJyxcblx0XHRcdFx0XHRcdGZpbGU6IHtcblx0XHRcdFx0XHRcdFx0X2lkOiBmaWxlLl9pZFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGdyb3VwYWJsZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRhdHRhY2htZW50czogW2F0dGFjaG1lbnRdXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFx0bXNnLmltcG9ydGVkID0gJ3NsYWNrYnJpZGdlJztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZGV0YWlscy5tZXNzYWdlX2lkICYmICh0eXBlb2YgZGV0YWlscy5tZXNzYWdlX2lkID09PSAnc3RyaW5nJykpIHtcblx0XHRcdFx0XHRcdG1zZ1snX2lkJ10gPSBkZXRhaWxzLm1lc3NhZ2VfaWQ7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuc2VuZE1lc3NhZ2Uocm9ja2V0VXNlciwgbXNnLCByb2NrZXRDaGFubmVsLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSkpO1xuXHR9XG5cblx0aW1wb3J0RnJvbUhpc3RvcnkoZmFtaWx5LCBvcHRpb25zKSB7XG5cdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdJbXBvcnRpbmcgbWVzc2FnZXMgaGlzdG9yeScpO1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQoYGh0dHBzOi8vc2xhY2suY29tL2FwaS8keyBmYW1pbHkgfS5oaXN0b3J5YCwgeyBwYXJhbXM6IF8uZXh0ZW5kKHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSwgb3B0aW9ucykgfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEubWVzc2FnZXMpICYmIHJlc3BvbnNlLmRhdGEubWVzc2FnZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0bGV0IGxhdGVzdCA9IDA7XG5cdFx0XHRmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgcmVzcG9uc2UuZGF0YS5tZXNzYWdlcy5yZXZlcnNlKCkpIHtcblx0XHRcdFx0bG9nZ2VyLnNsYWNrLmRlYnVnKCdNRVNTQUdFOiAnLCBtZXNzYWdlKTtcblx0XHRcdFx0aWYgKCFsYXRlc3QgfHwgbWVzc2FnZS50cyA+IGxhdGVzdCkge1xuXHRcdFx0XHRcdGxhdGVzdCA9IG1lc3NhZ2UudHM7XG5cdFx0XHRcdH1cblx0XHRcdFx0bWVzc2FnZS5jaGFubmVsID0gb3B0aW9ucy5jaGFubmVsO1xuXHRcdFx0XHR0aGlzLm9uTWVzc2FnZShtZXNzYWdlLCB0cnVlKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB7IGhhc19tb3JlOiByZXNwb25zZS5kYXRhLmhhc19tb3JlLCB0czogbGF0ZXN0IH07XG5cdFx0fVxuXHR9XG5cblx0Y29weUNoYW5uZWxJbmZvKHJpZCwgY2hhbm5lbE1hcCkge1xuXHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnQ29weWluZyB1c2VycyBmcm9tIFNsYWNrIGNoYW5uZWwgdG8gUm9ja2V0LkNoYXQnLCBjaGFubmVsTWFwLmlkLCByaWQpO1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQoYGh0dHBzOi8vc2xhY2suY29tL2FwaS8keyBjaGFubmVsTWFwLmZhbWlseSB9LmluZm9gLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogY2hhbm5lbE1hcC5pZCB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRjb25zdCBkYXRhID0gY2hhbm5lbE1hcC5mYW1pbHkgPT09ICdjaGFubmVscycgPyByZXNwb25zZS5kYXRhLmNoYW5uZWwgOiByZXNwb25zZS5kYXRhLmdyb3VwO1xuXHRcdFx0aWYgKGRhdGEgJiYgXy5pc0FycmF5KGRhdGEubWVtYmVycykgJiYgZGF0YS5tZW1iZXJzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Zm9yIChjb25zdCBtZW1iZXIgb2YgZGF0YS5tZW1iZXJzKSB7XG5cdFx0XHRcdFx0Y29uc3QgdXNlciA9IHRoaXMucm9ja2V0LmZpbmRVc2VyKG1lbWJlcikgfHwgdGhpcy5yb2NrZXQuYWRkVXNlcihtZW1iZXIpO1xuXHRcdFx0XHRcdGlmICh1c2VyKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ0FkZGluZyB1c2VyIHRvIHJvb20nLCB1c2VyLnVzZXJuYW1lLCByaWQpO1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5hZGRVc2VyVG9Sb29tKHJpZCwgdXNlciwgbnVsbCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxldCB0b3BpYyA9ICcnO1xuXHRcdFx0bGV0IHRvcGljX2xhc3Rfc2V0ID0gMDtcblx0XHRcdGxldCB0b3BpY19jcmVhdG9yID0gbnVsbDtcblx0XHRcdGlmIChkYXRhICYmIGRhdGEudG9waWMgJiYgZGF0YS50b3BpYy52YWx1ZSkge1xuXHRcdFx0XHR0b3BpYyA9IGRhdGEudG9waWMudmFsdWU7XG5cdFx0XHRcdHRvcGljX2xhc3Rfc2V0ID0gZGF0YS50b3BpYy5sYXN0X3NldDtcblx0XHRcdFx0dG9waWNfY3JlYXRvciA9IGRhdGEudG9waWMuY3JlYXRvcjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEgJiYgZGF0YS5wdXJwb3NlICYmIGRhdGEucHVycG9zZS52YWx1ZSkge1xuXHRcdFx0XHRpZiAodG9waWNfbGFzdF9zZXQpIHtcblx0XHRcdFx0XHRpZiAodG9waWNfbGFzdF9zZXQgPCBkYXRhLnB1cnBvc2UubGFzdF9zZXQpIHtcblx0XHRcdFx0XHRcdHRvcGljID0gZGF0YS5wdXJwb3NlLnRvcGljO1xuXHRcdFx0XHRcdFx0dG9waWNfY3JlYXRvciA9IGRhdGEucHVycG9zZS5jcmVhdG9yO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0b3BpYyA9IGRhdGEucHVycG9zZS50b3BpYztcblx0XHRcdFx0XHR0b3BpY19jcmVhdG9yID0gZGF0YS5wdXJwb3NlLmNyZWF0b3I7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHRvcGljKSB7XG5cdFx0XHRcdGNvbnN0IGNyZWF0b3IgPSB0aGlzLnJvY2tldC5maW5kVXNlcih0b3BpY19jcmVhdG9yKSB8fCB0aGlzLnJvY2tldC5hZGRVc2VyKHRvcGljX2NyZWF0b3IpO1xuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ1NldHRpbmcgcm9vbSB0b3BpYycsIHJpZCwgdG9waWMsIGNyZWF0b3IudXNlcm5hbWUpO1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMocmlkLCB0b3BpYywgY3JlYXRvciwgZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvcHlQaW5zKHJpZCwgY2hhbm5lbE1hcCkge1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9waW5zLmxpc3QnLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogY2hhbm5lbE1hcC5pZCB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIF8uaXNBcnJheShyZXNwb25zZS5kYXRhLml0ZW1zKSAmJiByZXNwb25zZS5kYXRhLml0ZW1zLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3QgcGluIG9mIHJlc3BvbnNlLmRhdGEuaXRlbXMpIHtcblx0XHRcdFx0aWYgKHBpbi5tZXNzYWdlKSB7XG5cdFx0XHRcdFx0Y29uc3QgdXNlciA9IHRoaXMucm9ja2V0LmZpbmRVc2VyKHBpbi5tZXNzYWdlLnVzZXIpO1xuXHRcdFx0XHRcdGNvbnN0IG1zZ09iaiA9IHtcblx0XHRcdFx0XHRcdHJpZCxcblx0XHRcdFx0XHRcdHQ6ICdtZXNzYWdlX3Bpbm5lZCcsXG5cdFx0XHRcdFx0XHRtc2c6ICcnLFxuXHRcdFx0XHRcdFx0dToge1xuXHRcdFx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnRzOiBbe1xuXHRcdFx0XHRcdFx0XHQndGV4dCcgOiB0aGlzLnJvY2tldC5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChwaW4ubWVzc2FnZS50ZXh0KSxcblx0XHRcdFx0XHRcdFx0J2F1dGhvcl9uYW1lJyA6IHVzZXIudXNlcm5hbWUsXG5cdFx0XHRcdFx0XHRcdCdhdXRob3JfaWNvbicgOiBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUodXNlci51c2VybmFtZSksXG5cdFx0XHRcdFx0XHRcdCd0cycgOiBuZXcgRGF0ZShwYXJzZUludChwaW4ubWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApXG5cdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRQaW5uZWRCeUlkQW5kVXNlcklkKGBzbGFjay0keyBwaW4uY2hhbm5lbCB9LSR7IHBpbi5tZXNzYWdlLnRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gLCBtc2dPYmoudSwgdHJ1ZSwgbmV3IERhdGUocGFyc2VJbnQocGluLm1lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpbXBvcnRNZXNzYWdlcyhyaWQsIGNhbGxiYWNrKSB7XG5cdFx0bG9nZ2VyLnNsYWNrLmluZm8oJ2ltcG9ydE1lc3NhZ2VzOiAnLCByaWQpO1xuXHRcdGNvbnN0IHJvY2tldGNoYXRfcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cdFx0aWYgKHJvY2tldGNoYXRfcm9vbSkge1xuXHRcdFx0aWYgKHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJpZCkpIHtcblx0XHRcdFx0dGhpcy5jb3B5Q2hhbm5lbEluZm8ocmlkLCB0aGlzLmdldFNsYWNrQ2hhbm5lbChyaWQpKTtcblxuXHRcdFx0XHRsb2dnZXIuc2xhY2suZGVidWcoJ0ltcG9ydGluZyBtZXNzYWdlcyBmcm9tIFNsYWNrIHRvIFJvY2tldC5DaGF0JywgdGhpcy5nZXRTbGFja0NoYW5uZWwocmlkKSwgcmlkKTtcblx0XHRcdFx0bGV0IHJlc3VsdHMgPSB0aGlzLmltcG9ydEZyb21IaXN0b3J5KHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJpZCkuZmFtaWx5LCB7IGNoYW5uZWw6IHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJpZCkuaWQsIG9sZGVzdDogMSB9KTtcblx0XHRcdFx0d2hpbGUgKHJlc3VsdHMgJiYgcmVzdWx0cy5oYXNfbW9yZSkge1xuXHRcdFx0XHRcdHJlc3VsdHMgPSB0aGlzLmltcG9ydEZyb21IaXN0b3J5KHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJpZCkuZmFtaWx5LCB7IGNoYW5uZWw6IHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJpZCkuaWQsIG9sZGVzdDogcmVzdWx0cy50cyB9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxvZ2dlci5zbGFjay5kZWJ1ZygnUGlubmluZyBTbGFjayBjaGFubmVsIG1lc3NhZ2VzIHRvIFJvY2tldC5DaGF0JywgdGhpcy5nZXRTbGFja0NoYW5uZWwocmlkKSwgcmlkKTtcblx0XHRcdFx0dGhpcy5jb3B5UGlucyhyaWQsIHRoaXMuZ2V0U2xhY2tDaGFubmVsKHJpZCkpO1xuXG5cdFx0XHRcdHJldHVybiBjYWxsYmFjaygpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3Qgc2xhY2tfcm9vbSA9IHRoaXMucG9zdEZpbmRDaGFubmVsKHJvY2tldGNoYXRfcm9vbS5uYW1lKTtcblx0XHRcdFx0aWYgKHNsYWNrX3Jvb20pIHtcblx0XHRcdFx0XHR0aGlzLmFkZFNsYWNrQ2hhbm5lbChyaWQsIHNsYWNrX3Jvb20uaWQpO1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmltcG9ydE1lc3NhZ2VzKHJpZCwgY2FsbGJhY2spO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxvZ2dlci5zbGFjay5lcnJvcignQ291bGQgbm90IGZpbmQgU2xhY2sgcm9vbSB3aXRoIHNwZWNpZmllZCBuYW1lJywgcm9ja2V0Y2hhdF9yb29tLm5hbWUpO1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zbGFjay1yb29tLW5vdC1mb3VuZCcsICdDb3VsZCBub3QgZmluZCBTbGFjayByb29tIHdpdGggc3BlY2lmaWVkIG5hbWUnKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLnNsYWNrLmVycm9yKCdDb3VsZCBub3QgZmluZCBSb2NrZXQuQ2hhdCByb29tIHdpdGggc3BlY2lmaWVkIGlkJywgcmlkKTtcblx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJykpO1xuXHRcdH1cblx0fVxuXG59XG5cbiJdfQ==
