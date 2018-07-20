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
var message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:importer-slack":{"info.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_importer-slack/info.js                                                                  //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  SlackImporterInfo: () => SlackImporterInfo
});
let ImporterInfo;
module.watch(require("meteor/rocketchat:importer"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 0);

class SlackImporterInfo extends ImporterInfo {
  constructor() {
    super('slack', 'Slack', 'application/zip');
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"importer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_importer-slack/server/importer.js                                                       //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
var _interopRequireDefault = require("@babel/runtime/helpers/builtin/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/builtin/objectSpread"));

module.export({
  SlackImporter: () => SlackImporter
});
let Base, ProgressStep, Selection, SelectionChannel, SelectionUser;
module.watch(require("meteor/rocketchat:importer"), {
  Base(v) {
    Base = v;
  },

  ProgressStep(v) {
    ProgressStep = v;
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

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);

class SlackImporter extends Base {
  constructor(info) {
    super(info);
    this.userTags = [];
    this.bots = {};
  }

  prepare(dataURI, sentContentType, fileName) {
    super.prepare(dataURI, sentContentType, fileName);
    const {
      image
    } = RocketChatFile.dataURIParse(dataURI);
    const zip = new this.AdmZip(new Buffer(image, 'base64'));
    const zipEntries = zip.getEntries();
    let tempChannels = [];
    let tempUsers = [];
    const tempMessages = {};
    zipEntries.forEach(entry => {
      if (entry.entryName.indexOf('__MACOSX') > -1) {
        return this.logger.debug(`Ignoring the file: ${entry.entryName}`);
      }

      if (entry.entryName === 'channels.json') {
        super.updateProgress(ProgressStep.PREPARING_CHANNELS);
        tempChannels = JSON.parse(entry.getData().toString()).filter(channel => channel.creator != null);
        return;
      }

      if (entry.entryName === 'users.json') {
        super.updateProgress(ProgressStep.PREPARING_USERS);
        tempUsers = JSON.parse(entry.getData().toString());
        tempUsers.forEach(user => {
          if (user.is_bot) {
            this.bots[user.profile.bot_id] = user;
          }
        });
        return;
      }

      if (!entry.isDirectory && entry.entryName.indexOf('/') > -1) {
        const item = entry.entryName.split('/');
        const channelName = item[0];
        const msgGroupData = item[1].split('.')[0];
        tempMessages[channelName] = tempMessages[channelName] || {};

        try {
          tempMessages[channelName][msgGroupData] = JSON.parse(entry.getData().toString());
        } catch (error) {
          this.logger.warn(`${entry.entryName} is not a valid JSON file! Unable to import it.`);
        }
      }
    }); // Insert the users record, eventually this might have to be split into several ones as well
    // if someone tries to import a several thousands users instance

    const usersId = this.collection.insert({
      'import': this.importRecord._id,
      'importer': this.name,
      'type': 'users',
      'users': tempUsers
    });
    this.users = this.collection.findOne(usersId);
    this.updateRecord({
      'count.users': tempUsers.length
    });
    this.addCountToTotal(tempUsers.length); // Insert the channels records.

    const channelsId = this.collection.insert({
      'import': this.importRecord._id,
      'importer': this.name,
      'type': 'channels',
      'channels': tempChannels
    });
    this.channels = this.collection.findOne(channelsId);
    this.updateRecord({
      'count.channels': tempChannels.length
    });
    this.addCountToTotal(tempChannels.length); // Insert the messages records

    super.updateProgress(ProgressStep.PREPARING_MESSAGES);
    let messagesCount = 0;
    Object.keys(tempMessages).forEach(channel => {
      const messagesObj = tempMessages[channel];
      this.messages[channel] = this.messages[channel] || {};
      Object.keys(messagesObj).forEach(date => {
        const msgs = messagesObj[date];
        messagesCount += msgs.length;
        this.updateRecord({
          'messagesstatus': `${channel}/${date}`
        });

        if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
          const tmp = Base.getBSONSafeArraysFromAnArray(msgs);
          Object.keys(tmp).forEach(i => {
            const splitMsg = tmp[i];
            const messagesId = this.collection.insert({
              'import': this.importRecord._id,
              'importer': this.name,
              'type': 'messages',
              'name': `${channel}/${date}.${i}`,
              'messages': splitMsg
            });
            this.messages[channel][`${date}.${i}`] = this.collection.findOne(messagesId);
          });
        } else {
          const messagesId = this.collection.insert({
            'import': this.importRecord._id,
            'importer': this.name,
            'type': 'messages',
            'name': `${channel}/${date}`,
            'messages': msgs
          });
          this.messages[channel][date] = this.collection.findOne(messagesId);
        }
      });
    });
    this.updateRecord({
      'count.messages': messagesCount,
      'messagesstatus': null
    });
    this.addCountToTotal(messagesCount);

    if ([tempUsers.length, tempChannels.length, messagesCount].some(e => e === 0)) {
      this.logger.warn(`The loaded users count ${tempUsers.length}, the loaded channels ${tempChannels.length}, and the loaded messages ${messagesCount}`);
      console.log(`The loaded users count ${tempUsers.length}, the loaded channels ${tempChannels.length}, and the loaded messages ${messagesCount}`);
      super.updateProgress(ProgressStep.ERROR);
      return this.getProgress();
    }

    const selectionUsers = tempUsers.map(user => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
    const selectionChannels = tempChannels.map(channel => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
    const selectionMessages = this.importRecord.count.messages;
    super.updateProgress(ProgressStep.USER_SELECTION);
    return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
  }

  startImport(importSelection) {
    super.startImport(importSelection);
    const start = Date.now();
    Object.keys(importSelection.users).forEach(key => {
      const user = importSelection.users[key];
      Object.keys(this.users.users).forEach(k => {
        const u = this.users.users[k];

        if (u.id === user.user_id) {
          u.do_import = user.do_import;
        }
      });
    });
    this.collection.update({
      _id: this.users._id
    }, {
      $set: {
        'users': this.users.users
      }
    });
    Object.keys(importSelection.channels).forEach(key => {
      const channel = importSelection.channels[key];
      Object.keys(this.channels.channels).forEach(k => {
        const c = this.channels.channels[k];

        if (c.id === channel.channel_id) {
          c.do_import = channel.do_import;
        }
      });
    });
    this.collection.update({
      _id: this.channels._id
    }, {
      $set: {
        'channels': this.channels.channels
      }
    });
    const startedByUserId = Meteor.userId();
    Meteor.defer(() => {
      try {
        super.updateProgress(ProgressStep.IMPORTING_USERS);
        this.users.users.forEach(user => {
          if (!user.do_import) {
            return;
          }

          Meteor.runAsUser(startedByUserId, () => {
            const existantUser = RocketChat.models.Users.findOneByEmailAddress(user.profile.email) || RocketChat.models.Users.findOneByUsername(user.name);

            if (existantUser) {
              user.rocketId = existantUser._id;
              RocketChat.models.Users.update({
                _id: user.rocketId
              }, {
                $addToSet: {
                  importIds: user.id
                }
              });
              this.userTags.push({
                slack: `<@${user.id}>`,
                slackLong: `<@${user.id}|${user.name}>`,
                rocket: `@${existantUser.username}`
              });
            } else {
              const userId = user.profile.email ? Accounts.createUser({
                email: user.profile.email,
                password: Date.now() + user.name + user.profile.email.toUpperCase()
              }) : Accounts.createUser({
                username: user.name,
                password: Date.now() + user.name,
                joinDefaultChannelsSilenced: true
              });
              Meteor.runAsUser(userId, () => {
                Meteor.call('setUsername', user.name, {
                  joinDefaultChannelsSilenced: true
                });
                const url = user.profile.image_original || user.profile.image_512;

                try {
                  Meteor.call('setAvatarFromService', url, undefined, 'url');
                } catch (error) {
                  this.logger.warn(`Failed to set ${user.name}'s avatar from url ${url}`);
                  console.log(`Failed to set ${user.name}'s avatar from url ${url}`);
                } // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600


                if (user.tz_offset) {
                  Meteor.call('userSetUtcOffset', user.tz_offset / 3600);
                }
              });
              RocketChat.models.Users.update({
                _id: userId
              }, {
                $addToSet: {
                  importIds: user.id
                }
              });

              if (user.profile.real_name) {
                RocketChat.models.Users.setName(userId, user.profile.real_name);
              } //Deleted users are 'inactive' users in Rocket.Chat


              if (user.deleted) {
                Meteor.call('setUserActiveStatus', userId, false);
              }

              user.rocketId = userId;
              this.userTags.push({
                slack: `<@${user.id}>`,
                slackLong: `<@${user.id}|${user.name}>`,
                rocket: `@${user.name}`
              });
            }

            this.addCountCompleted(1);
          });
        });
        this.collection.update({
          _id: this.users._id
        }, {
          $set: {
            'users': this.users.users
          }
        });
        super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
        this.channels.channels.forEach(channel => {
          if (!channel.do_import) {
            return;
          }

          Meteor.runAsUser(startedByUserId, () => {
            const existantRoom = RocketChat.models.Rooms.findOneByName(channel.name);

            if (existantRoom || channel.is_general) {
              if (channel.is_general && existantRoom && channel.name !== existantRoom.name) {
                Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channel.name);
              }

              channel.rocketId = channel.is_general ? 'GENERAL' : existantRoom._id;
              RocketChat.models.Rooms.update({
                _id: channel.rocketId
              }, {
                $addToSet: {
                  importIds: channel.id
                }
              });
            } else {
              const users = channel.members.reduce((ret, member) => {
                if (member !== channel.creator) {
                  const user = this.getRocketUser(member);

                  if (user && user.username) {
                    ret.push(user.username);
                  }
                }

                return ret;
              }, []);
              let userId = startedByUserId;
              this.users.users.forEach(user => {
                if (user.id === channel.creator && user.do_import) {
                  userId = user.rocketId;
                }
              });
              Meteor.runAsUser(userId, () => {
                const returned = Meteor.call('createChannel', channel.name, users);
                channel.rocketId = returned.rid;
              }); // @TODO implement model specific function

              const roomUpdate = {
                ts: new Date(channel.created * 1000)
              };

              if (!_.isEmpty(channel.topic && channel.topic.value)) {
                roomUpdate.topic = channel.topic.value;
              }

              if (!_.isEmpty(channel.purpose && channel.purpose.value)) {
                roomUpdate.description = channel.purpose.value;
              }

              RocketChat.models.Rooms.update({
                _id: channel.rocketId
              }, {
                $set: roomUpdate,
                $addToSet: {
                  importIds: channel.id
                }
              });
            }

            this.addCountCompleted(1);
          });
        });
        this.collection.update({
          _id: this.channels._id
        }, {
          $set: {
            'channels': this.channels.channels
          }
        });
        const missedTypes = {};
        const ignoreTypes = {
          'bot_add': true,
          'file_comment': true,
          'file_mention': true
        };
        super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
        Object.keys(this.messages).forEach(channel => {
          const messagesObj = this.messages[channel];
          Meteor.runAsUser(startedByUserId, () => {
            const slackChannel = this.getSlackChannelFromName(channel);

            if (!slackChannel || !slackChannel.do_import) {
              return;
            }

            const room = RocketChat.models.Rooms.findOneById(slackChannel.rocketId, {
              fields: {
                usernames: 1,
                t: 1,
                name: 1
              }
            });
            Object.keys(messagesObj).forEach(date => {
              const msgs = messagesObj[date];
              msgs.messages.forEach(message => {
                this.updateRecord({
                  'messagesstatus': `${channel}/${date}.${msgs.messages.length}`
                });
                const msgDataDefaults = {
                  _id: `slack-${slackChannel.id}-${message.ts.replace(/\./g, '-')}`,
                  ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
                }; // Process the reactions

                if (message.reactions && message.reactions.length > 0) {
                  msgDataDefaults.reactions = {};
                  message.reactions.forEach(reaction => {
                    reaction.name = `:${reaction.name}:`;
                    msgDataDefaults.reactions[reaction.name] = {
                      usernames: []
                    };
                    reaction.users.forEach(u => {
                      const rcUser = this.getRocketUser(u);

                      if (!rcUser) {
                        return;
                      }

                      msgDataDefaults.reactions[reaction.name].usernames.push(rcUser.username);
                    });

                    if (msgDataDefaults.reactions[reaction.name].usernames.length === 0) {
                      delete msgDataDefaults.reactions[reaction.name];
                    }
                  });
                }

                if (message.type === 'message') {
                  if (message.subtype) {
                    if (message.subtype === 'channel_join') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'channel_leave') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'me_message') {
                      const msgObj = (0, _objectSpread2.default)({}, msgDataDefaults, {
                        msg: `_${this.convertSlackMessageToRocketChat(message.text)}_`
                      });
                      RocketChat.sendMessage(this.getRocketUser(message.user), msgObj, room, true);
                    } else if (message.subtype === 'bot_message' || message.subtype === 'slackbot_response') {
                      const botUser = RocketChat.models.Users.findOneById('rocket.cat', {
                        fields: {
                          username: 1
                        }
                      });
                      const botUsername = this.bots[message.bot_id] ? this.bots[message.bot_id].name : message.username;
                      const msgObj = (0, _objectSpread2.default)({}, msgDataDefaults, {
                        msg: this.convertSlackMessageToRocketChat(message.text),
                        rid: room._id,
                        bot: true,
                        attachments: message.attachments,
                        username: botUsername || undefined
                      });

                      if (message.edited) {
                        msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
                        const editedBy = this.getRocketUser(message.edited.user);

                        if (editedBy) {
                          msgObj.editedBy = {
                            _id: editedBy._id,
                            username: editedBy.username
                          };
                        }
                      }

                      if (message.icons) {
                        msgObj.emoji = message.icons.emoji;
                      }

                      RocketChat.sendMessage(botUser, msgObj, room, true);
                    } else if (message.subtype === 'channel_purpose') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', room._id, message.purpose, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'channel_topic') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'channel_name') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(room._id, message.name, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'pinned_item') {
                      if (message.attachments) {
                        const msgObj = (0, _objectSpread2.default)({}, msgDataDefaults, {
                          attachments: [{
                            'text': this.convertSlackMessageToRocketChat(message.attachments[0].text),
                            'author_name': message.attachments[0].author_subname,
                            'author_icon': getAvatarUrlFromUsername(message.attachments[0].author_subname)
                          }]
                        });
                        RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', room._id, '', this.getRocketUser(message.user), msgObj);
                      } else {
                        //TODO: make this better
                        this.logger.debug('Pinned item with no attachment, needs work.'); //RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUser(message.user), msgDataDefaults
                      }
                    } else if (message.subtype === 'file_share') {
                      if (message.file && message.file.url_private_download !== undefined) {
                        const details = {
                          message_id: `slack-${message.ts.replace(/\./g, '-')}`,
                          name: message.file.name,
                          size: message.file.size,
                          type: message.file.mimetype,
                          rid: room._id
                        };
                        this.uploadFile(details, message.file.url_private_download, this.getRocketUser(message.user), room, new Date(parseInt(message.ts.split('.')[0]) * 1000));
                      }
                    } else if (!missedTypes[message.subtype] && !ignoreTypes[message.subtype]) {
                      missedTypes[message.subtype] = message;
                    }
                  } else {
                    const user = this.getRocketUser(message.user);

                    if (user) {
                      const msgObj = (0, _objectSpread2.default)({}, msgDataDefaults, {
                        msg: this.convertSlackMessageToRocketChat(message.text),
                        rid: room._id,
                        u: {
                          _id: user._id,
                          username: user.username
                        }
                      });

                      if (message.edited) {
                        msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
                        const editedBy = this.getRocketUser(message.edited.user);

                        if (editedBy) {
                          msgObj.editedBy = {
                            _id: editedBy._id,
                            username: editedBy.username
                          };
                        }
                      }

                      try {
                        RocketChat.sendMessage(this.getRocketUser(message.user), msgObj, room, true);
                      } catch (e) {
                        this.logger.warn(`Failed to import the message: ${msgDataDefaults._id}`);
                      }
                    }
                  }
                }

                this.addCountCompleted(1);
              });
            });
          });
        });

        if (!_.isEmpty(missedTypes)) {
          console.log('Missed import types:', missedTypes);
        }

        super.updateProgress(ProgressStep.FINISHING);
        this.channels.channels.forEach(channel => {
          if (channel.do_import && channel.is_archived) {
            Meteor.runAsUser(startedByUserId, function () {
              Meteor.call('archiveRoom', channel.rocketId);
            });
          }
        });
        super.updateProgress(ProgressStep.DONE);
        this.logger.log(`Import took ${Date.now() - start} milliseconds.`);
      } catch (e) {
        this.logger.error(e);
        super.updateProgress(ProgressStep.ERROR);
      }
    });
    return this.getProgress();
  }

  getSlackChannelFromName(channelName) {
    return this.channels.channels.find(channel => channel.name === channelName);
  }

  getRocketUser(slackId) {
    const user = this.users.users.find(user => user.id === slackId);

    if (user) {
      return RocketChat.models.Users.findOneById(user.rocketId, {
        fields: {
          username: 1,
          name: 1
        }
      });
    }
  }

  convertSlackMessageToRocketChat(message) {
    if (message) {
      message = message.replace(/<!everyone>/g, '@all');
      message = message.replace(/<!channel>/g, '@all');
      message = message.replace(/<!here>/g, '@here');
      message = message.replace(/&gt;/g, '>');
      message = message.replace(/&lt;/g, '<');
      message = message.replace(/&amp;/g, '&');
      message = message.replace(/:simple_smile:/g, ':smile:');
      message = message.replace(/:memo:/g, ':pencil:');
      message = message.replace(/:piggy:/g, ':pig:');
      message = message.replace(/:uk:/g, ':gb:');
      message = message.replace(/<(http[s]?:[^>]*)>/g, '$1');

      for (const userReplace of Array.from(this.userTags)) {
        message = message.replace(userReplace.slack, userReplace.rocket);
        message = message.replace(userReplace.slackLong, userReplace.rocket);
      }
    } else {
      message = '';
    }

    return message;
  }

  getSelection() {
    const selectionUsers = this.users.users.map(user => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
    const selectionChannels = this.channels.channels.map(channel => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
    return new Selection(this.name, selectionUsers, selectionChannels, this.importRecord.count.messages);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"adder.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_importer-slack/server/adder.js                                                          //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
let SlackImporterInfo;
module.watch(require("../info"), {
  SlackImporterInfo(v) {
    SlackImporterInfo = v;
  }

}, 1);
let SlackImporter;
module.watch(require("./importer"), {
  SlackImporter(v) {
    SlackImporter = v;
  }

}, 2);
Importers.add(new SlackImporterInfo(), SlackImporter);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:importer-slack/info.js");
require("/node_modules/meteor/rocketchat:importer-slack/server/importer.js");
require("/node_modules/meteor/rocketchat:importer-slack/server/adder.js");

/* Exports */
Package._define("rocketchat:importer-slack");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_importer-slack.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1zbGFjay9pbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyLXNsYWNrL3NlcnZlci9pbXBvcnRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1zbGFjay9zZXJ2ZXIvYWRkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiU2xhY2tJbXBvcnRlckluZm8iLCJJbXBvcnRlckluZm8iLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiY29uc3RydWN0b3IiLCJTbGFja0ltcG9ydGVyIiwiQmFzZSIsIlByb2dyZXNzU3RlcCIsIlNlbGVjdGlvbiIsIlNlbGVjdGlvbkNoYW5uZWwiLCJTZWxlY3Rpb25Vc2VyIiwiXyIsImRlZmF1bHQiLCJpbmZvIiwidXNlclRhZ3MiLCJib3RzIiwicHJlcGFyZSIsImRhdGFVUkkiLCJzZW50Q29udGVudFR5cGUiLCJmaWxlTmFtZSIsImltYWdlIiwiUm9ja2V0Q2hhdEZpbGUiLCJkYXRhVVJJUGFyc2UiLCJ6aXAiLCJBZG1aaXAiLCJCdWZmZXIiLCJ6aXBFbnRyaWVzIiwiZ2V0RW50cmllcyIsInRlbXBDaGFubmVscyIsInRlbXBVc2VycyIsInRlbXBNZXNzYWdlcyIsImZvckVhY2giLCJlbnRyeSIsImVudHJ5TmFtZSIsImluZGV4T2YiLCJsb2dnZXIiLCJkZWJ1ZyIsInVwZGF0ZVByb2dyZXNzIiwiUFJFUEFSSU5HX0NIQU5ORUxTIiwiSlNPTiIsInBhcnNlIiwiZ2V0RGF0YSIsInRvU3RyaW5nIiwiZmlsdGVyIiwiY2hhbm5lbCIsImNyZWF0b3IiLCJQUkVQQVJJTkdfVVNFUlMiLCJ1c2VyIiwiaXNfYm90IiwicHJvZmlsZSIsImJvdF9pZCIsImlzRGlyZWN0b3J5IiwiaXRlbSIsInNwbGl0IiwiY2hhbm5lbE5hbWUiLCJtc2dHcm91cERhdGEiLCJlcnJvciIsIndhcm4iLCJ1c2Vyc0lkIiwiY29sbGVjdGlvbiIsImluc2VydCIsImltcG9ydFJlY29yZCIsIl9pZCIsIm5hbWUiLCJ1c2VycyIsImZpbmRPbmUiLCJ1cGRhdGVSZWNvcmQiLCJsZW5ndGgiLCJhZGRDb3VudFRvVG90YWwiLCJjaGFubmVsc0lkIiwiY2hhbm5lbHMiLCJQUkVQQVJJTkdfTUVTU0FHRVMiLCJtZXNzYWdlc0NvdW50IiwiT2JqZWN0Iiwia2V5cyIsIm1lc3NhZ2VzT2JqIiwibWVzc2FnZXMiLCJkYXRlIiwibXNncyIsImdldEJTT05TaXplIiwiZ2V0TWF4QlNPTlNpemUiLCJ0bXAiLCJnZXRCU09OU2FmZUFycmF5c0Zyb21BbkFycmF5IiwiaSIsInNwbGl0TXNnIiwibWVzc2FnZXNJZCIsInNvbWUiLCJlIiwiY29uc29sZSIsImxvZyIsIkVSUk9SIiwiZ2V0UHJvZ3Jlc3MiLCJzZWxlY3Rpb25Vc2VycyIsIm1hcCIsImlkIiwiZW1haWwiLCJkZWxldGVkIiwic2VsZWN0aW9uQ2hhbm5lbHMiLCJpc19hcmNoaXZlZCIsInNlbGVjdGlvbk1lc3NhZ2VzIiwiY291bnQiLCJVU0VSX1NFTEVDVElPTiIsInN0YXJ0SW1wb3J0IiwiaW1wb3J0U2VsZWN0aW9uIiwic3RhcnQiLCJEYXRlIiwibm93Iiwia2V5IiwiayIsInUiLCJ1c2VyX2lkIiwiZG9faW1wb3J0IiwidXBkYXRlIiwiJHNldCIsImMiLCJjaGFubmVsX2lkIiwic3RhcnRlZEJ5VXNlcklkIiwiTWV0ZW9yIiwidXNlcklkIiwiZGVmZXIiLCJJTVBPUlRJTkdfVVNFUlMiLCJydW5Bc1VzZXIiLCJleGlzdGFudFVzZXIiLCJSb2NrZXRDaGF0IiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kT25lQnlFbWFpbEFkZHJlc3MiLCJmaW5kT25lQnlVc2VybmFtZSIsInJvY2tldElkIiwiJGFkZFRvU2V0IiwiaW1wb3J0SWRzIiwicHVzaCIsInNsYWNrIiwic2xhY2tMb25nIiwicm9ja2V0IiwidXNlcm5hbWUiLCJBY2NvdW50cyIsImNyZWF0ZVVzZXIiLCJwYXNzd29yZCIsInRvVXBwZXJDYXNlIiwiam9pbkRlZmF1bHRDaGFubmVsc1NpbGVuY2VkIiwiY2FsbCIsInVybCIsImltYWdlX29yaWdpbmFsIiwiaW1hZ2VfNTEyIiwidW5kZWZpbmVkIiwidHpfb2Zmc2V0IiwicmVhbF9uYW1lIiwic2V0TmFtZSIsImFkZENvdW50Q29tcGxldGVkIiwiSU1QT1JUSU5HX0NIQU5ORUxTIiwiZXhpc3RhbnRSb29tIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwiaXNfZ2VuZXJhbCIsIm1lbWJlcnMiLCJyZWR1Y2UiLCJyZXQiLCJtZW1iZXIiLCJnZXRSb2NrZXRVc2VyIiwicmV0dXJuZWQiLCJyaWQiLCJyb29tVXBkYXRlIiwidHMiLCJjcmVhdGVkIiwiaXNFbXB0eSIsInRvcGljIiwidmFsdWUiLCJwdXJwb3NlIiwiZGVzY3JpcHRpb24iLCJtaXNzZWRUeXBlcyIsImlnbm9yZVR5cGVzIiwiSU1QT1JUSU5HX01FU1NBR0VTIiwic2xhY2tDaGFubmVsIiwiZ2V0U2xhY2tDaGFubmVsRnJvbU5hbWUiLCJyb29tIiwiZmluZE9uZUJ5SWQiLCJmaWVsZHMiLCJ1c2VybmFtZXMiLCJ0IiwibWVzc2FnZSIsIm1zZ0RhdGFEZWZhdWx0cyIsInJlcGxhY2UiLCJwYXJzZUludCIsInJlYWN0aW9ucyIsInJlYWN0aW9uIiwicmNVc2VyIiwidHlwZSIsInN1YnR5cGUiLCJNZXNzYWdlcyIsImNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIiLCJjcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlciIsIm1zZ09iaiIsIm1zZyIsImNvbnZlcnRTbGFja01lc3NhZ2VUb1JvY2tldENoYXQiLCJ0ZXh0Iiwic2VuZE1lc3NhZ2UiLCJib3RVc2VyIiwiYm90VXNlcm5hbWUiLCJib3QiLCJhdHRhY2htZW50cyIsImVkaXRlZCIsImVkaXRlZEF0IiwiZWRpdGVkQnkiLCJpY29ucyIsImVtb2ppIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJjcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIiLCJhdXRob3Jfc3VibmFtZSIsImdldEF2YXRhclVybEZyb21Vc2VybmFtZSIsImNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJmaWxlIiwidXJsX3ByaXZhdGVfZG93bmxvYWQiLCJkZXRhaWxzIiwibWVzc2FnZV9pZCIsInNpemUiLCJtaW1ldHlwZSIsInVwbG9hZEZpbGUiLCJGSU5JU0hJTkciLCJET05FIiwiZmluZCIsInNsYWNrSWQiLCJ1c2VyUmVwbGFjZSIsIkFycmF5IiwiZnJvbSIsImdldFNlbGVjdGlvbiIsIkltcG9ydGVycyIsImFkZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MscUJBQWtCLE1BQUlBO0FBQXZCLENBQWQ7QUFBeUQsSUFBSUMsWUFBSjtBQUFpQkgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0YsZUFBYUcsQ0FBYixFQUFlO0FBQUNILG1CQUFhRyxDQUFiO0FBQWU7O0FBQWhDLENBQW5ELEVBQXFGLENBQXJGOztBQUVuRSxNQUFNSixpQkFBTixTQUFnQ0MsWUFBaEMsQ0FBNkM7QUFDbkRJLGdCQUFjO0FBQ2IsVUFBTSxPQUFOLEVBQWUsT0FBZixFQUF3QixpQkFBeEI7QUFDQTs7QUFIa0QsQzs7Ozs7Ozs7Ozs7Ozs7O0FDRnBEUCxPQUFPQyxNQUFQLENBQWM7QUFBQ08saUJBQWMsTUFBSUE7QUFBbkIsQ0FBZDtBQUFpRCxJQUFJQyxJQUFKLEVBQVNDLFlBQVQsRUFBc0JDLFNBQXRCLEVBQWdDQyxnQkFBaEMsRUFBaURDLGFBQWpEO0FBQStEYixPQUFPSSxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDSSxPQUFLSCxDQUFMLEVBQU87QUFBQ0csV0FBS0gsQ0FBTDtBQUFPLEdBQWhCOztBQUFp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QUEwRSxLQUExRSxDQUF0QyxDQUExQjtBQUNBLFdBQU8sSUFBSTFGLFNBQUosQ0FBYyxLQUFLdUQsSUFBbkIsRUFBeUI2QixjQUF6QixFQUF5Q0ssaUJBQXpDLEVBQTRELEtBQUtwQyxZQUFMLENBQWtCdUMsS0FBbEIsQ0FBd0J4QixRQUFwRixDQUFQO0FBQ0E7O0FBcmVzQyxDOzs7Ozs7Ozs7OztBQ1Z4QyxJQUFJc0osU0FBSjtBQUFjck8sT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ2dPLFlBQVUvTixDQUFWLEVBQVk7QUFBQytOLGdCQUFVL04sQ0FBVjtBQUFZOztBQUExQixDQUFuRCxFQUErRSxDQUEvRTtBQUFrRixJQUFJSixpQkFBSjtBQUFzQkYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLFNBQVIsQ0FBYixFQUFnQztBQUFDSCxvQkFBa0JJLENBQWxCLEVBQW9CO0FBQUNKLHdCQUFrQkksQ0FBbEI7QUFBb0I7O0FBQTFDLENBQWhDLEVBQTRFLENBQTVFO0FBQStFLElBQUlFLGFBQUo7QUFBa0JSLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0csZ0JBQWNGLENBQWQsRUFBZ0I7QUFBQ0Usb0JBQWNGLENBQWQ7QUFBZ0I7O0FBQWxDLENBQW5DLEVBQXVFLENBQXZFO0FBSXZOK04sVUFBVUMsR0FBVixDQUFjLElBQUlwTyxpQkFBSixFQUFkLEVBQXVDTSxhQUF2QyxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2ltcG9ydGVyLXNsYWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW1wb3J0ZXJJbmZvIH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuXG5leHBvcnQgY2xhc3MgU2xhY2tJbXBvcnRlckluZm8gZXh0ZW5kcyBJbXBvcnRlckluZm8ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignc2xhY2snLCAnU2xhY2snLCAnYXBwbGljYXRpb24vemlwJyk7XG5cdH1cbn1cbiIsImltcG9ydCB7XG5cdEJhc2UsXG5cdFByb2dyZXNzU3RlcCxcblx0U2VsZWN0aW9uLFxuXHRTZWxlY3Rpb25DaGFubmVsLFxuXHRTZWxlY3Rpb25Vc2VyXG59IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmV4cG9ydCBjbGFzcyBTbGFja0ltcG9ydGVyIGV4dGVuZHMgQmFzZSB7XG5cdGNvbnN0cnVjdG9yKGluZm8pIHtcblx0XHRzdXBlcihpbmZvKTtcblx0XHR0aGlzLnVzZXJUYWdzID0gW107XG5cdFx0dGhpcy5ib3RzID0ge307XG5cdH1cblxuXHRwcmVwYXJlKGRhdGFVUkksIHNlbnRDb250ZW50VHlwZSwgZmlsZU5hbWUpIHtcblx0XHRzdXBlci5wcmVwYXJlKGRhdGFVUkksIHNlbnRDb250ZW50VHlwZSwgZmlsZU5hbWUpO1xuXG5cdFx0Y29uc3QgeyBpbWFnZSB9ID0gUm9ja2V0Q2hhdEZpbGUuZGF0YVVSSVBhcnNlKGRhdGFVUkkpO1xuXHRcdGNvbnN0IHppcCA9IG5ldyB0aGlzLkFkbVppcChuZXcgQnVmZmVyKGltYWdlLCAnYmFzZTY0JykpO1xuXHRcdGNvbnN0IHppcEVudHJpZXMgPSB6aXAuZ2V0RW50cmllcygpO1xuXG5cdFx0bGV0IHRlbXBDaGFubmVscyA9IFtdO1xuXHRcdGxldCB0ZW1wVXNlcnMgPSBbXTtcblx0XHRjb25zdCB0ZW1wTWVzc2FnZXMgPSB7fTtcblxuXHRcdHppcEVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG5cdFx0XHRpZiAoZW50cnkuZW50cnlOYW1lLmluZGV4T2YoJ19fTUFDT1NYJykgPiAtMSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5sb2dnZXIuZGVidWcoYElnbm9yaW5nIHRoZSBmaWxlOiAkeyBlbnRyeS5lbnRyeU5hbWUgfWApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZW50cnkuZW50cnlOYW1lID09PSAnY2hhbm5lbHMuanNvbicpIHtcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLlBSRVBBUklOR19DSEFOTkVMUyk7XG5cdFx0XHRcdHRlbXBDaGFubmVscyA9IEpTT04ucGFyc2UoZW50cnkuZ2V0RGF0YSgpLnRvU3RyaW5nKCkpLmZpbHRlcihjaGFubmVsID0+IGNoYW5uZWwuY3JlYXRvciAhPSBudWxsKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZW50cnkuZW50cnlOYW1lID09PSAndXNlcnMuanNvbicpIHtcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLlBSRVBBUklOR19VU0VSUyk7XG5cdFx0XHRcdHRlbXBVc2VycyA9IEpTT04ucGFyc2UoZW50cnkuZ2V0RGF0YSgpLnRvU3RyaW5nKCkpO1xuXG5cdFx0XHRcdHRlbXBVc2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xuXHRcdFx0XHRcdGlmICh1c2VyLmlzX2JvdCkge1xuXHRcdFx0XHRcdFx0dGhpcy5ib3RzW3VzZXIucHJvZmlsZS5ib3RfaWRdID0gdXNlcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFlbnRyeS5pc0RpcmVjdG9yeSAmJiBlbnRyeS5lbnRyeU5hbWUuaW5kZXhPZignLycpID4gLTEpIHtcblx0XHRcdFx0Y29uc3QgaXRlbSA9IGVudHJ5LmVudHJ5TmFtZS5zcGxpdCgnLycpO1xuXHRcdFx0XHRjb25zdCBjaGFubmVsTmFtZSA9IGl0ZW1bMF07XG5cdFx0XHRcdGNvbnN0IG1zZ0dyb3VwRGF0YSA9IGl0ZW1bMV0uc3BsaXQoJy4nKVswXTtcblx0XHRcdFx0dGVtcE1lc3NhZ2VzW2NoYW5uZWxOYW1lXSA9IHRlbXBNZXNzYWdlc1tjaGFubmVsTmFtZV0gfHwge307XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0ZW1wTWVzc2FnZXNbY2hhbm5lbE5hbWVdW21zZ0dyb3VwRGF0YV0gPSBKU09OLnBhcnNlKGVudHJ5LmdldERhdGEoKS50b1N0cmluZygpKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGAkeyBlbnRyeS5lbnRyeU5hbWUgfSBpcyBub3QgYSB2YWxpZCBKU09OIGZpbGUhIFVuYWJsZSB0byBpbXBvcnQgaXQuYCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEluc2VydCB0aGUgdXNlcnMgcmVjb3JkLCBldmVudHVhbGx5IHRoaXMgbWlnaHQgaGF2ZSB0byBiZSBzcGxpdCBpbnRvIHNldmVyYWwgb25lcyBhcyB3ZWxsXG5cdFx0Ly8gaWYgc29tZW9uZSB0cmllcyB0byBpbXBvcnQgYSBzZXZlcmFsIHRob3VzYW5kcyB1c2VycyBpbnN0YW5jZVxuXHRcdGNvbnN0IHVzZXJzSWQgPSB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHsgJ2ltcG9ydCc6IHRoaXMuaW1wb3J0UmVjb3JkLl9pZCwgJ2ltcG9ydGVyJzogdGhpcy5uYW1lLCAndHlwZSc6ICd1c2VycycsICd1c2Vycyc6IHRlbXBVc2VycyB9KTtcblx0XHR0aGlzLnVzZXJzID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUodXNlcnNJZCk7XG5cdFx0dGhpcy51cGRhdGVSZWNvcmQoeyAnY291bnQudXNlcnMnOiB0ZW1wVXNlcnMubGVuZ3RoIH0pO1xuXHRcdHRoaXMuYWRkQ291bnRUb1RvdGFsKHRlbXBVc2Vycy5sZW5ndGgpO1xuXG5cdFx0Ly8gSW5zZXJ0IHRoZSBjaGFubmVscyByZWNvcmRzLlxuXHRcdGNvbnN0IGNoYW5uZWxzSWQgPSB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHsgJ2ltcG9ydCc6IHRoaXMuaW1wb3J0UmVjb3JkLl9pZCwgJ2ltcG9ydGVyJzogdGhpcy5uYW1lLCAndHlwZSc6ICdjaGFubmVscycsICdjaGFubmVscyc6IHRlbXBDaGFubmVscyB9KTtcblx0XHR0aGlzLmNoYW5uZWxzID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUoY2hhbm5lbHNJZCk7XG5cdFx0dGhpcy51cGRhdGVSZWNvcmQoeyAnY291bnQuY2hhbm5lbHMnOiB0ZW1wQ2hhbm5lbHMubGVuZ3RoIH0pO1xuXHRcdHRoaXMuYWRkQ291bnRUb1RvdGFsKHRlbXBDaGFubmVscy5sZW5ndGgpO1xuXG5cdFx0Ly8gSW5zZXJ0IHRoZSBtZXNzYWdlcyByZWNvcmRzXG5cdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLlBSRVBBUklOR19NRVNTQUdFUyk7XG5cblx0XHRsZXQgbWVzc2FnZXNDb3VudCA9IDA7XG5cdFx0T2JqZWN0LmtleXModGVtcE1lc3NhZ2VzKS5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdFx0Y29uc3QgbWVzc2FnZXNPYmogPSB0ZW1wTWVzc2FnZXNbY2hhbm5lbF07XG5cdFx0XHR0aGlzLm1lc3NhZ2VzW2NoYW5uZWxdID0gdGhpcy5tZXNzYWdlc1tjaGFubmVsXSB8fCB7fTtcblxuXHRcdFx0T2JqZWN0LmtleXMobWVzc2FnZXNPYmopLmZvckVhY2goZGF0ZSA9PiB7XG5cdFx0XHRcdGNvbnN0IG1zZ3MgPSBtZXNzYWdlc09ialtkYXRlXTtcblx0XHRcdFx0bWVzc2FnZXNDb3VudCArPSBtc2dzLmxlbmd0aDtcblx0XHRcdFx0dGhpcy51cGRhdGVSZWNvcmQoeyAnbWVzc2FnZXNzdGF0dXMnOiBgJHsgY2hhbm5lbCB9LyR7IGRhdGUgfWAgfSk7XG5cdFx0XHRcdGlmIChCYXNlLmdldEJTT05TaXplKG1zZ3MpID4gQmFzZS5nZXRNYXhCU09OU2l6ZSgpKSB7XG5cdFx0XHRcdFx0Y29uc3QgdG1wID0gQmFzZS5nZXRCU09OU2FmZUFycmF5c0Zyb21BbkFycmF5KG1zZ3MpO1xuXHRcdFx0XHRcdE9iamVjdC5rZXlzKHRtcCkuZm9yRWFjaChpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IHNwbGl0TXNnID0gdG1wW2ldO1xuXHRcdFx0XHRcdFx0Y29uc3QgbWVzc2FnZXNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ21lc3NhZ2VzJywgJ25hbWUnOiBgJHsgY2hhbm5lbCB9LyR7IGRhdGUgfS4keyBpIH1gLCAnbWVzc2FnZXMnOiBzcGxpdE1zZyB9KTtcblx0XHRcdFx0XHRcdHRoaXMubWVzc2FnZXNbY2hhbm5lbF1bYCR7IGRhdGUgfS4keyBpIH1gXSA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKG1lc3NhZ2VzSWQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IG1lc3NhZ2VzSWQgPSB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHsgJ2ltcG9ydCc6IHRoaXMuaW1wb3J0UmVjb3JkLl9pZCwgJ2ltcG9ydGVyJzogdGhpcy5uYW1lLCAndHlwZSc6ICdtZXNzYWdlcycsICduYW1lJzogYCR7IGNoYW5uZWwgfS8keyBkYXRlIH1gLCAnbWVzc2FnZXMnOiBtc2dzIH0pO1xuXHRcdFx0XHRcdHRoaXMubWVzc2FnZXNbY2hhbm5lbF1bZGF0ZV0gPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShtZXNzYWdlc0lkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnVwZGF0ZVJlY29yZCh7ICdjb3VudC5tZXNzYWdlcyc6IG1lc3NhZ2VzQ291bnQsICdtZXNzYWdlc3N0YXR1cyc6IG51bGwgfSk7XG5cdFx0dGhpcy5hZGRDb3VudFRvVG90YWwobWVzc2FnZXNDb3VudCk7XG5cblx0XHRpZiAoW3RlbXBVc2Vycy5sZW5ndGgsIHRlbXBDaGFubmVscy5sZW5ndGgsIG1lc3NhZ2VzQ291bnRdLnNvbWUoZSA9PiBlID09PSAwKSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgVGhlIGxvYWRlZCB1c2VycyBjb3VudCAkeyB0ZW1wVXNlcnMubGVuZ3RoIH0sIHRoZSBsb2FkZWQgY2hhbm5lbHMgJHsgdGVtcENoYW5uZWxzLmxlbmd0aCB9LCBhbmQgdGhlIGxvYWRlZCBtZXNzYWdlcyAkeyBtZXNzYWdlc0NvdW50IH1gKTtcblx0XHRcdGNvbnNvbGUubG9nKGBUaGUgbG9hZGVkIHVzZXJzIGNvdW50ICR7IHRlbXBVc2Vycy5sZW5ndGggfSwgdGhlIGxvYWRlZCBjaGFubmVscyAkeyB0ZW1wQ2hhbm5lbHMubGVuZ3RoIH0sIGFuZCB0aGUgbG9hZGVkIG1lc3NhZ2VzICR7IG1lc3NhZ2VzQ291bnQgfWApO1xuXHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkVSUk9SKTtcblx0XHRcdHJldHVybiB0aGlzLmdldFByb2dyZXNzKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2VsZWN0aW9uVXNlcnMgPSB0ZW1wVXNlcnMubWFwKHVzZXIgPT4gbmV3IFNlbGVjdGlvblVzZXIodXNlci5pZCwgdXNlci5uYW1lLCB1c2VyLnByb2ZpbGUuZW1haWwsIHVzZXIuZGVsZXRlZCwgdXNlci5pc19ib3QsICF1c2VyLmlzX2JvdCkpO1xuXHRcdGNvbnN0IHNlbGVjdGlvbkNoYW5uZWxzID0gdGVtcENoYW5uZWxzLm1hcChjaGFubmVsID0+IG5ldyBTZWxlY3Rpb25DaGFubmVsKGNoYW5uZWwuaWQsIGNoYW5uZWwubmFtZSwgY2hhbm5lbC5pc19hcmNoaXZlZCwgdHJ1ZSwgZmFsc2UpKTtcblx0XHRjb25zdCBzZWxlY3Rpb25NZXNzYWdlcyA9IHRoaXMuaW1wb3J0UmVjb3JkLmNvdW50Lm1lc3NhZ2VzO1xuXHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5VU0VSX1NFTEVDVElPTik7XG5cblx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvbih0aGlzLm5hbWUsIHNlbGVjdGlvblVzZXJzLCBzZWxlY3Rpb25DaGFubmVscywgc2VsZWN0aW9uTWVzc2FnZXMpO1xuXHR9XG5cblx0c3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKSB7XG5cdFx0c3VwZXIuc3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKTtcblx0XHRjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG5cblx0XHRPYmplY3Qua2V5cyhpbXBvcnRTZWxlY3Rpb24udXNlcnMpLmZvckVhY2goa2V5ID0+IHtcblx0XHRcdGNvbnN0IHVzZXIgPSBpbXBvcnRTZWxlY3Rpb24udXNlcnNba2V5XTtcblx0XHRcdE9iamVjdC5rZXlzKHRoaXMudXNlcnMudXNlcnMpLmZvckVhY2goayA9PiB7XG5cdFx0XHRcdGNvbnN0IHUgPSB0aGlzLnVzZXJzLnVzZXJzW2tdO1xuXHRcdFx0XHRpZiAodS5pZCA9PT0gdXNlci51c2VyX2lkKSB7XG5cdFx0XHRcdFx0dS5kb19pbXBvcnQgPSB1c2VyLmRvX2ltcG9ydDtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5jb2xsZWN0aW9uLnVwZGF0ZSh7IF9pZDogdGhpcy51c2Vycy5faWQgfSwgeyAkc2V0OiB7ICd1c2Vycyc6IHRoaXMudXNlcnMudXNlcnMgfX0pO1xuXG5cdFx0T2JqZWN0LmtleXMoaW1wb3J0U2VsZWN0aW9uLmNoYW5uZWxzKS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0XHRjb25zdCBjaGFubmVsID0gaW1wb3J0U2VsZWN0aW9uLmNoYW5uZWxzW2tleV07XG5cdFx0XHRPYmplY3Qua2V5cyh0aGlzLmNoYW5uZWxzLmNoYW5uZWxzKS5mb3JFYWNoKGsgPT4ge1xuXHRcdFx0XHRjb25zdCBjID0gdGhpcy5jaGFubmVscy5jaGFubmVsc1trXTtcblx0XHRcdFx0aWYgKGMuaWQgPT09IGNoYW5uZWwuY2hhbm5lbF9pZCkge1xuXHRcdFx0XHRcdGMuZG9faW1wb3J0ID0gY2hhbm5lbC5kb19pbXBvcnQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMuY2hhbm5lbHMuX2lkIH0sIHsgJHNldDogeyAnY2hhbm5lbHMnOiB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzIH19KTtcblxuXHRcdGNvbnN0IHN0YXJ0ZWRCeVVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19VU0VSUyk7XG5cdFx0XHRcdHRoaXMudXNlcnMudXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdFx0XHRpZiAoIXVzZXIuZG9faW1wb3J0KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGV4aXN0YW50VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUVtYWlsQWRkcmVzcyh1c2VyLnByb2ZpbGUuZW1haWwpIHx8IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXIubmFtZSk7XG5cdFx0XHRcdFx0XHRpZiAoZXhpc3RhbnRVc2VyKSB7XG5cdFx0XHRcdFx0XHRcdHVzZXIucm9ja2V0SWQgPSBleGlzdGFudFVzZXIuX2lkO1xuXHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIucm9ja2V0SWQgfSwgeyAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiB1c2VyLmlkIH0gfSk7XG5cdFx0XHRcdFx0XHRcdHRoaXMudXNlclRhZ3MucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0c2xhY2s6IGA8QCR7IHVzZXIuaWQgfT5gLFxuXHRcdFx0XHRcdFx0XHRcdHNsYWNrTG9uZzogYDxAJHsgdXNlci5pZCB9fCR7IHVzZXIubmFtZSB9PmAsXG5cdFx0XHRcdFx0XHRcdFx0cm9ja2V0OiBgQCR7IGV4aXN0YW50VXNlci51c2VybmFtZSB9YFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHVzZXJJZCA9IHVzZXIucHJvZmlsZS5lbWFpbCA/IEFjY291bnRzLmNyZWF0ZVVzZXIoeyBlbWFpbDogdXNlci5wcm9maWxlLmVtYWlsLCBwYXNzd29yZDogRGF0ZS5ub3coKSArIHVzZXIubmFtZSArIHVzZXIucHJvZmlsZS5lbWFpbC50b1VwcGVyQ2FzZSgpIH0pIDogQWNjb3VudHMuY3JlYXRlVXNlcih7IHVzZXJuYW1lOiB1c2VyLm5hbWUsIHBhc3N3b3JkOiBEYXRlLm5vdygpICsgdXNlci5uYW1lLCBqb2luRGVmYXVsdENoYW5uZWxzU2lsZW5jZWQ6IHRydWUgfSk7XG5cdFx0XHRcdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFVzZXJuYW1lJywgdXNlci5uYW1lLCB7IGpvaW5EZWZhdWx0Q2hhbm5lbHNTaWxlbmNlZDogdHJ1ZSB9KTtcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHVybCA9IHVzZXIucHJvZmlsZS5pbWFnZV9vcmlnaW5hbCB8fCB1c2VyLnByb2ZpbGUuaW1hZ2VfNTEyO1xuXHRcdFx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0QXZhdGFyRnJvbVNlcnZpY2UnLCB1cmwsIHVuZGVmaW5lZCwgJ3VybCcpO1xuXHRcdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBGYWlsZWQgdG8gc2V0ICR7IHVzZXIubmFtZSB9J3MgYXZhdGFyIGZyb20gdXJsICR7IHVybCB9YCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgRmFpbGVkIHRvIHNldCAkeyB1c2VyLm5hbWUgfSdzIGF2YXRhciBmcm9tIHVybCAkeyB1cmwgfWApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdC8vIFNsYWNrJ3MgaXMgLTE4MDAwIHdoaWNoIHRyYW5zbGF0ZXMgdG8gUm9ja2V0LkNoYXQncyBhZnRlciBkaXZpZGluZyBieSAzNjAwXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHVzZXIudHpfb2Zmc2V0KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgndXNlclNldFV0Y09mZnNldCcsIHVzZXIudHpfb2Zmc2V0IC8gMzYwMCk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy51cGRhdGUoeyBfaWQ6IHVzZXJJZCB9LCB7ICRhZGRUb1NldDogeyBpbXBvcnRJZHM6IHVzZXIuaWQgfSB9KTtcblxuXHRcdFx0XHRcdFx0XHRpZiAodXNlci5wcm9maWxlLnJlYWxfbmFtZSkge1xuXHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldE5hbWUodXNlcklkLCB1c2VyLnByb2ZpbGUucmVhbF9uYW1lKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vRGVsZXRlZCB1c2VycyBhcmUgJ2luYWN0aXZlJyB1c2VycyBpbiBSb2NrZXQuQ2hhdFxuXHRcdFx0XHRcdFx0XHRpZiAodXNlci5kZWxldGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFVzZXJBY3RpdmVTdGF0dXMnLCB1c2VySWQsIGZhbHNlKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHVzZXIucm9ja2V0SWQgPSB1c2VySWQ7XG5cdFx0XHRcdFx0XHRcdHRoaXMudXNlclRhZ3MucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0c2xhY2s6IGA8QCR7IHVzZXIuaWQgfT5gLFxuXHRcdFx0XHRcdFx0XHRcdHNsYWNrTG9uZzogYDxAJHsgdXNlci5pZCB9fCR7IHVzZXIubmFtZSB9PmAsXG5cdFx0XHRcdFx0XHRcdFx0cm9ja2V0OiBgQCR7IHVzZXIubmFtZSB9YFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dGhpcy5hZGRDb3VudENvbXBsZXRlZCgxKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMudXNlcnMuX2lkIH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH19KTtcblxuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuSU1QT1JUSU5HX0NIQU5ORUxTKTtcblx0XHRcdFx0dGhpcy5jaGFubmVscy5jaGFubmVscy5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdFx0XHRcdGlmICghY2hhbm5lbC5kb19pbXBvcnQpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyIChzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGV4aXN0YW50Um9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY2hhbm5lbC5uYW1lKTtcblx0XHRcdFx0XHRcdGlmIChleGlzdGFudFJvb20gfHwgY2hhbm5lbC5pc19nZW5lcmFsKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChjaGFubmVsLmlzX2dlbmVyYWwgJiYgZXhpc3RhbnRSb29tICYmIGNoYW5uZWwubmFtZSAhPT0gZXhpc3RhbnRSb29tLm5hbWUpIHtcblx0XHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsICdHRU5FUkFMJywgJ3Jvb21OYW1lJywgY2hhbm5lbC5uYW1lKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGNoYW5uZWwucm9ja2V0SWQgPSBjaGFubmVsLmlzX2dlbmVyYWwgPyAnR0VORVJBTCcgOiBleGlzdGFudFJvb20uX2lkO1xuXHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGUoeyBfaWQ6IGNoYW5uZWwucm9ja2V0SWQgfSwgeyAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiBjaGFubmVsLmlkIH0gfSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB1c2VycyA9IGNoYW5uZWwubWVtYmVyc1xuXHRcdFx0XHRcdFx0XHRcdC5yZWR1Y2UoKHJldCwgbWVtYmVyKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVtYmVyICE9PSBjaGFubmVsLmNyZWF0b3IpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0Um9ja2V0VXNlcihtZW1iZXIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodXNlciAmJiB1c2VyLnVzZXJuYW1lKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0LnB1c2godXNlci51c2VybmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdFx0XHRcdFx0fSwgW10pO1xuXHRcdFx0XHRcdFx0XHRsZXQgdXNlcklkID0gc3RhcnRlZEJ5VXNlcklkO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVzZXJzLnVzZXJzLmZvckVhY2godXNlciA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHVzZXIuaWQgPT09IGNoYW5uZWwuY3JlYXRvciAmJiB1c2VyLmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dXNlcklkID0gdXNlci5yb2NrZXRJZDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHJldHVybmVkID0gTWV0ZW9yLmNhbGwoJ2NyZWF0ZUNoYW5uZWwnLCBjaGFubmVsLm5hbWUsIHVzZXJzKTtcblx0XHRcdFx0XHRcdFx0XHRjaGFubmVsLnJvY2tldElkID0gcmV0dXJuZWQucmlkO1xuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHQvLyBAVE9ETyBpbXBsZW1lbnQgbW9kZWwgc3BlY2lmaWMgZnVuY3Rpb25cblx0XHRcdFx0XHRcdFx0Y29uc3Qgcm9vbVVwZGF0ZSA9IHtcblx0XHRcdFx0XHRcdFx0XHR0czogbmV3IERhdGUoY2hhbm5lbC5jcmVhdGVkICogMTAwMClcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0aWYgKCFfLmlzRW1wdHkoY2hhbm5lbC50b3BpYyAmJiBjaGFubmVsLnRvcGljLnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRcdHJvb21VcGRhdGUudG9waWMgPSBjaGFubmVsLnRvcGljLnZhbHVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmICghXy5pc0VtcHR5KGNoYW5uZWwucHVycG9zZSAmJiBjaGFubmVsLnB1cnBvc2UudmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0cm9vbVVwZGF0ZS5kZXNjcmlwdGlvbiA9IGNoYW5uZWwucHVycG9zZS52YWx1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGUoeyBfaWQ6IGNoYW5uZWwucm9ja2V0SWQgfSwgeyAkc2V0OiByb29tVXBkYXRlLCAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiBjaGFubmVsLmlkIH0gfSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aGlzLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0dGhpcy5jb2xsZWN0aW9uLnVwZGF0ZSh7IF9pZDogdGhpcy5jaGFubmVscy5faWQgfSwgeyAkc2V0OiB7ICdjaGFubmVscyc6IHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMgfX0pO1xuXG5cdFx0XHRcdGNvbnN0IG1pc3NlZFR5cGVzID0ge307XG5cdFx0XHRcdGNvbnN0IGlnbm9yZVR5cGVzID0geyAnYm90X2FkZCc6IHRydWUsICdmaWxlX2NvbW1lbnQnOiB0cnVlLCAnZmlsZV9tZW50aW9uJzogdHJ1ZSB9O1xuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuSU1QT1JUSU5HX01FU1NBR0VTKTtcblx0XHRcdFx0T2JqZWN0LmtleXModGhpcy5tZXNzYWdlcykuZm9yRWFjaChjaGFubmVsID0+IHtcblx0XHRcdFx0XHRjb25zdCBtZXNzYWdlc09iaiA9IHRoaXMubWVzc2FnZXNbY2hhbm5lbF07XG5cblx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgKCkgPT57XG5cdFx0XHRcdFx0XHRjb25zdCBzbGFja0NoYW5uZWwgPSB0aGlzLmdldFNsYWNrQ2hhbm5lbEZyb21OYW1lKGNoYW5uZWwpO1xuXHRcdFx0XHRcdFx0aWYgKCFzbGFja0NoYW5uZWwgfHwgIXNsYWNrQ2hhbm5lbC5kb19pbXBvcnQpIHsgcmV0dXJuOyB9XG5cdFx0XHRcdFx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoc2xhY2tDaGFubmVsLnJvY2tldElkLCB7IGZpZWxkczogeyB1c2VybmFtZXM6IDEsIHQ6IDEsIG5hbWU6IDEgfSB9KTtcblx0XHRcdFx0XHRcdE9iamVjdC5rZXlzKG1lc3NhZ2VzT2JqKS5mb3JFYWNoKGRhdGUgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtc2dzID0gbWVzc2FnZXNPYmpbZGF0ZV07XG5cdFx0XHRcdFx0XHRcdG1zZ3MubWVzc2FnZXMuZm9yRWFjaChtZXNzYWdlID0+IHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZVJlY29yZCh7ICdtZXNzYWdlc3N0YXR1cyc6IGAkeyBjaGFubmVsIH0vJHsgZGF0ZSB9LiR7IG1zZ3MubWVzc2FnZXMubGVuZ3RoIH1gIH0pO1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IG1zZ0RhdGFEZWZhdWx0cyA9e1xuXHRcdFx0XHRcdFx0XHRcdFx0X2lkOiBgc2xhY2stJHsgc2xhY2tDaGFubmVsLmlkIH0tJHsgbWVzc2FnZS50cy5yZXBsYWNlKC9cXC4vZywgJy0nKSB9YCxcblx0XHRcdFx0XHRcdFx0XHRcdHRzOiBuZXcgRGF0ZShwYXJzZUludChtZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMClcblx0XHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly8gUHJvY2VzcyB0aGUgcmVhY3Rpb25zXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UucmVhY3Rpb25zICYmIG1lc3NhZ2UucmVhY3Rpb25zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdFx0XHRcdG1zZ0RhdGFEZWZhdWx0cy5yZWFjdGlvbnMgPSB7fTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0bWVzc2FnZS5yZWFjdGlvbnMuZm9yRWFjaChyZWFjdGlvbiA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlYWN0aW9uLm5hbWUgPSBgOiR7IHJlYWN0aW9uLm5hbWUgfTpgO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dEYXRhRGVmYXVsdHMucmVhY3Rpb25zW3JlYWN0aW9uLm5hbWVdID0geyB1c2VybmFtZXM6IFtdIH07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0cmVhY3Rpb24udXNlcnMuZm9yRWFjaCh1ID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCByY1VzZXIgPSB0aGlzLmdldFJvY2tldFVzZXIodSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFyY1VzZXIpIHsgcmV0dXJuOyB9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dEYXRhRGVmYXVsdHMucmVhY3Rpb25zW3JlYWN0aW9uLm5hbWVdLnVzZXJuYW1lcy5wdXNoKHJjVXNlci51c2VybmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtc2dEYXRhRGVmYXVsdHMucmVhY3Rpb25zW3JlYWN0aW9uLm5hbWVdLnVzZXJuYW1lcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWxldGUgbXNnRGF0YURlZmF1bHRzLnJlYWN0aW9uc1tyZWFjdGlvbi5uYW1lXTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UudHlwZSA9PT0gJ21lc3NhZ2UnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5zdWJ0eXBlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXNzYWdlLnN1YnR5cGUgPT09ICdjaGFubmVsX2pvaW4nKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VySm9pbldpdGhSb29tSWRBbmRVc2VyKHJvb20uX2lkLCB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgbXNnRGF0YURlZmF1bHRzKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAobWVzc2FnZS5zdWJ0eXBlID09PSAnY2hhbm5lbF9sZWF2ZScpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlcikpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVVzZXJMZWF2ZVdpdGhSb29tSWRBbmRVc2VyKHJvb20uX2lkLCB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgbXNnRGF0YURlZmF1bHRzKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAobWVzc2FnZS5zdWJ0eXBlID09PSAnbWVfbWVzc2FnZScpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBtc2dPYmogPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuLi5tc2dEYXRhRGVmYXVsdHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2c6IGBfJHsgdGhpcy5jb252ZXJ0U2xhY2tNZXNzYWdlVG9Sb2NrZXRDaGF0KG1lc3NhZ2UudGV4dCkgfV9gXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dPYmosIHJvb20sIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2Uuc3VidHlwZSA9PT0gJ2JvdF9tZXNzYWdlJyB8fCBtZXNzYWdlLnN1YnR5cGUgPT09ICdzbGFja2JvdF9yZXNwb25zZScpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBib3RVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoJ3JvY2tldC5jYXQnLCB7IGZpZWxkczogeyB1c2VybmFtZTogMSB9fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgYm90VXNlcm5hbWUgPSB0aGlzLmJvdHNbbWVzc2FnZS5ib3RfaWRdID8gdGhpcy5ib3RzW21lc3NhZ2UuYm90X2lkXS5uYW1lIDogbWVzc2FnZS51c2VybmFtZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBtc2dPYmogPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuLi5tc2dEYXRhRGVmYXVsdHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2c6IHRoaXMuY29udmVydFNsYWNrTWVzc2FnZVRvUm9ja2V0Q2hhdChtZXNzYWdlLnRleHQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmlkOiByb29tLl9pZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJvdDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGF0dGFjaG1lbnRzOiBtZXNzYWdlLmF0dGFjaG1lbnRzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IGJvdFVzZXJuYW1lIHx8IHVuZGVmaW5lZFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5lZGl0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1zZ09iai5lZGl0ZWRBdCA9IG5ldyBEYXRlKHBhcnNlSW50KG1lc3NhZ2UuZWRpdGVkLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBlZGl0ZWRCeSA9IHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLmVkaXRlZC51c2VyKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChlZGl0ZWRCeSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dPYmouZWRpdGVkQnkgPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0X2lkOiBlZGl0ZWRCeS5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IGVkaXRlZEJ5LnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UuaWNvbnMpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1zZ09iai5lbW9qaSA9IG1lc3NhZ2UuaWNvbnMuZW1vamk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UoYm90VXNlciwgbXNnT2JqLCByb29tLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChtZXNzYWdlLnN1YnR5cGUgPT09ICdjaGFubmVsX3B1cnBvc2UnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX2Rlc2NyaXB0aW9uJywgcm9vbS5faWQsIG1lc3NhZ2UucHVycG9zZSwgdGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlciksIG1zZ0RhdGFEZWZhdWx0cyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2Uuc3VidHlwZSA9PT0gJ2NoYW5uZWxfdG9waWMnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX3RvcGljJywgcm9vbS5faWQsIG1lc3NhZ2UudG9waWMsIHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dEYXRhRGVmYXVsdHMpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChtZXNzYWdlLnN1YnR5cGUgPT09ICdjaGFubmVsX25hbWUnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIocm9vbS5faWQsIG1lc3NhZ2UubmFtZSwgdGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlciksIG1zZ0RhdGFEZWZhdWx0cyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2Uuc3VidHlwZSA9PT0gJ3Bpbm5lZF9pdGVtJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXNzYWdlLmF0dGFjaG1lbnRzKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBtc2dPYmogPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC4uLm1zZ0RhdGFEZWZhdWx0cyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXR0YWNobWVudHM6IFt7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0J3RleHQnOiB0aGlzLmNvbnZlcnRTbGFja01lc3NhZ2VUb1JvY2tldENoYXQobWVzc2FnZS5hdHRhY2htZW50c1swXS50ZXh0KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnYXV0aG9yX25hbWUnIDogbWVzc2FnZS5hdHRhY2htZW50c1swXS5hdXRob3Jfc3VibmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQnYXV0aG9yX2ljb24nIDogZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lKG1lc3NhZ2UuYXR0YWNobWVudHNbMF0uYXV0aG9yX3N1Ym5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1dXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcignbWVzc2FnZV9waW5uZWQnLCByb29tLl9pZCwgJycsIHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dPYmopO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvL1RPRE86IG1ha2UgdGhpcyBiZXR0ZXJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKCdQaW5uZWQgaXRlbSB3aXRoIG5vIGF0dGFjaG1lbnQsIG5lZWRzIHdvcmsuJyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvL1JvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIgJ21lc3NhZ2VfcGlubmVkJywgcm9vbS5faWQsICcnLCBAZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dEYXRhRGVmYXVsdHNcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAobWVzc2FnZS5zdWJ0eXBlID09PSAnZmlsZV9zaGFyZScpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5maWxlICYmIG1lc3NhZ2UuZmlsZS51cmxfcHJpdmF0ZV9kb3dubG9hZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBkZXRhaWxzID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtZXNzYWdlX2lkOiBgc2xhY2stJHsgbWVzc2FnZS50cy5yZXBsYWNlKC9cXC4vZywgJy0nKSB9YCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogbWVzc2FnZS5maWxlLm5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHNpemU6IG1lc3NhZ2UuZmlsZS5zaXplLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0eXBlOiBtZXNzYWdlLmZpbGUubWltZXR5cGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJpZDogcm9vbS5faWRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnVwbG9hZEZpbGUoZGV0YWlscywgbWVzc2FnZS5maWxlLnVybF9wcml2YXRlX2Rvd25sb2FkLCB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgcm9vbSwgbmV3IERhdGUocGFyc2VJbnQobWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoIW1pc3NlZFR5cGVzW21lc3NhZ2Uuc3VidHlwZV0gJiYgIWlnbm9yZVR5cGVzW21lc3NhZ2Uuc3VidHlwZV0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtaXNzZWRUeXBlc1ttZXNzYWdlLnN1YnR5cGVdID0gbWVzc2FnZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IG1zZ09iaiA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC4uLm1zZ0RhdGFEZWZhdWx0cyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1zZzogdGhpcy5jb252ZXJ0U2xhY2tNZXNzYWdlVG9Sb2NrZXRDaGF0KG1lc3NhZ2UudGV4dCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyaWQ6IHJvb20uX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5lZGl0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1zZ09iai5lZGl0ZWRBdCA9IG5ldyBEYXRlKHBhcnNlSW50KG1lc3NhZ2UuZWRpdGVkLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBlZGl0ZWRCeSA9IHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLmVkaXRlZC51c2VyKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChlZGl0ZWRCeSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dPYmouZWRpdGVkQnkgPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0X2lkOiBlZGl0ZWRCeS5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IGVkaXRlZEJ5LnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UodGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlciksIG1zZ09iaiwgcm9vbSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybihgRmFpbGVkIHRvIGltcG9ydCB0aGUgbWVzc2FnZTogJHsgbXNnRGF0YURlZmF1bHRzLl9pZCB9YCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5hZGRDb3VudENvbXBsZXRlZCgxKTtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0aWYgKCFfLmlzRW1wdHkobWlzc2VkVHlwZXMpKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ01pc3NlZCBpbXBvcnQgdHlwZXM6JywgbWlzc2VkVHlwZXMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkZJTklTSElORyk7XG5cblx0XHRcdFx0dGhpcy5jaGFubmVscy5jaGFubmVscy5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdFx0XHRcdGlmIChjaGFubmVsLmRvX2ltcG9ydCAmJiBjaGFubmVsLmlzX2FyY2hpdmVkKSB7XG5cdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdhcmNoaXZlUm9vbScsIGNoYW5uZWwucm9ja2V0SWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkRPTkUpO1xuXG5cdFx0XHRcdHRoaXMubG9nZ2VyLmxvZyhgSW1wb3J0IHRvb2sgJHsgRGF0ZS5ub3coKSAtIHN0YXJ0IH0gbWlsbGlzZWNvbmRzLmApO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihlKTtcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkVSUk9SKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiB0aGlzLmdldFByb2dyZXNzKCk7XG5cdH1cblxuXHRnZXRTbGFja0NoYW5uZWxGcm9tTmFtZShjaGFubmVsTmFtZSkge1xuXHRcdHJldHVybiB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzLmZpbmQoY2hhbm5lbCA9PiBjaGFubmVsLm5hbWUgPT09IGNoYW5uZWxOYW1lKTtcblx0fVxuXG5cdGdldFJvY2tldFVzZXIoc2xhY2tJZCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLnVzZXJzLnVzZXJzLmZpbmQodXNlciA9PiB1c2VyLmlkID09PSBzbGFja0lkKTtcblxuXHRcdGlmICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlci5yb2NrZXRJZCwgeyBmaWVsZHM6IHsgdXNlcm5hbWU6IDEsIG5hbWU6IDEgfX0pO1xuXHRcdH1cblx0fVxuXG5cdGNvbnZlcnRTbGFja01lc3NhZ2VUb1JvY2tldENoYXQobWVzc2FnZSkge1xuXHRcdGlmIChtZXNzYWdlKSB7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC88IWV2ZXJ5b25lPi9nLCAnQGFsbCcpO1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvPCFjaGFubmVsPi9nLCAnQGFsbCcpO1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvPCFoZXJlPi9nLCAnQGhlcmUnKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLyZndDsvZywgJz4nKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLyZsdDsvZywgJzwnKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC86c2ltcGxlX3NtaWxlOi9nLCAnOnNtaWxlOicpO1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvOm1lbW86L2csICc6cGVuY2lsOicpO1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvOnBpZ2d5Oi9nLCAnOnBpZzonKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzp1azovZywgJzpnYjonKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzwoaHR0cFtzXT86W14+XSopPi9nLCAnJDEnKTtcblxuXHRcdFx0Zm9yIChjb25zdCB1c2VyUmVwbGFjZSBvZiBBcnJheS5mcm9tKHRoaXMudXNlclRhZ3MpKSB7XG5cdFx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UodXNlclJlcGxhY2Uuc2xhY2ssIHVzZXJSZXBsYWNlLnJvY2tldCk7XG5cdFx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UodXNlclJlcGxhY2Uuc2xhY2tMb25nLCB1c2VyUmVwbGFjZS5yb2NrZXQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtZXNzYWdlID0gJyc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRnZXRTZWxlY3Rpb24oKSB7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uVXNlcnMgPSB0aGlzLnVzZXJzLnVzZXJzLm1hcCh1c2VyID0+IG5ldyBTZWxlY3Rpb25Vc2VyKHVzZXIuaWQsIHVzZXIubmFtZSwgdXNlci5wcm9maWxlLmVtYWlsLCB1c2VyLmRlbGV0ZWQsIHVzZXIuaXNfYm90LCAhdXNlci5pc19ib3QpKTtcblx0XHRjb25zdCBzZWxlY3Rpb25DaGFubmVscyA9IHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMubWFwKGNoYW5uZWwgPT4gbmV3IFNlbGVjdGlvbkNoYW5uZWwoY2hhbm5lbC5pZCwgY2hhbm5lbC5uYW1lLCBjaGFubmVsLmlzX2FyY2hpdmVkLCB0cnVlLCBmYWxzZSkpO1xuXHRcdHJldHVybiBuZXcgU2VsZWN0aW9uKHRoaXMubmFtZSwgc2VsZWN0aW9uVXNlcnMsIHNlbGVjdGlvbkNoYW5uZWxzLCB0aGlzLmltcG9ydFJlY29yZC5jb3VudC5tZXNzYWdlcyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEltcG9ydGVycyB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcbmltcG9ydCB7IFNsYWNrSW1wb3J0ZXJJbmZvIH0gZnJvbSAnLi4vaW5mbyc7XG5pbXBvcnQgeyBTbGFja0ltcG9ydGVyIH0gZnJvbSAnLi9pbXBvcnRlcic7XG5cbkltcG9ydGVycy5hZGQobmV3IFNsYWNrSW1wb3J0ZXJJbmZvKCksIFNsYWNrSW1wb3J0ZXIpO1xuIl19
