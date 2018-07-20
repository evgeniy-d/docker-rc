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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:importer-hipchat-enterprise":{"info.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_importer-hipchat-enterprise/info.js                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  HipChatEnterpriseImporterInfo: () => HipChatEnterpriseImporterInfo
});
let ImporterInfo;
module.watch(require("meteor/rocketchat:importer"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 0);

class HipChatEnterpriseImporterInfo extends ImporterInfo {
  constructor() {
    super('hipchatenterprise', 'HipChat Enterprise', 'application/gzip', [{
      text: 'Importer_HipChatEnterprise_Information',
      href: 'https://rocket.chat/docs/administrator-guides/import/hipchat/enterprise/'
    }, {
      text: 'Importer_HipChatEnterprise_BetaWarning',
      href: 'https://github.com/RocketChat/Rocket.Chat/issues/new'
    }]);
  }

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"importer.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_importer-hipchat-enterprise/server/importer.js                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  HipChatEnterpriseImporter: () => HipChatEnterpriseImporter
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
let Readable;
module.watch(require("stream"), {
  Readable(v) {
    Readable = v;
  }

}, 1);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 2);

class HipChatEnterpriseImporter extends Base {
  constructor(info) {
    super(info);
    this.Readable = Readable;
    this.zlib = require('zlib');
    this.tarStream = require('tar-stream');
    this.extract = this.tarStream.extract();
    this.path = path;
    this.messages = new Map();
    this.directMessages = new Map();
  }

  prepare(dataURI, sentContentType, fileName) {
    super.prepare(dataURI, sentContentType, fileName);
    const tempUsers = [];
    const tempRooms = [];
    const tempMessages = new Map();
    const tempDirectMessages = new Map();
    const promise = new Promise((resolve, reject) => {
      this.extract.on('entry', Meteor.bindEnvironment((header, stream, next) => {
        if (header.name.indexOf('.json') !== -1) {
          const info = this.path.parse(header.name);
          stream.on('data', Meteor.bindEnvironment(chunk => {
            this.logger.debug(`Processing the file: ${header.name}`);
            const file = JSON.parse(chunk);

            if (info.base === 'users.json') {
              super.updateProgress(ProgressStep.PREPARING_USERS);

              for (const u of file) {
                tempUsers.push({
                  id: u.User.id,
                  email: u.User.email,
                  name: u.User.name,
                  username: u.User.mention_name,
                  avatar: u.User.avatar.replace(/\n/g, ''),
                  timezone: u.User.timezone,
                  isDeleted: u.User.is_deleted
                });
              }
            } else if (info.base === 'rooms.json') {
              super.updateProgress(ProgressStep.PREPARING_CHANNELS);

              for (const r of file) {
                tempRooms.push({
                  id: r.Room.id,
                  creator: r.Room.owner,
                  created: new Date(r.Room.created),
                  name: r.Room.name.replace(/ /g, '_').toLowerCase(),
                  isPrivate: r.Room.privacy === 'private',
                  isArchived: r.Room.is_archived,
                  topic: r.Room.topic
                });
              }
            } else if (info.base === 'history.json') {
              const dirSplit = info.dir.split('/'); //['.', 'users', '1']

              const roomIdentifier = `${dirSplit[1]}/${dirSplit[2]}`;

              if (dirSplit[1] === 'users') {
                const msgs = [];

                for (const m of file) {
                  if (m.PrivateUserMessage) {
                    msgs.push({
                      type: 'user',
                      id: `hipchatenterprise-${m.PrivateUserMessage.id}`,
                      senderId: m.PrivateUserMessage.sender.id,
                      receiverId: m.PrivateUserMessage.receiver.id,
                      text: m.PrivateUserMessage.message.indexOf('/me ') === -1 ? m.PrivateUserMessage.message : `${m.PrivateUserMessage.message.replace(/\/me /, '_')}_`,
                      ts: new Date(m.PrivateUserMessage.timestamp.split(' ')[0])
                    });
                  }
                }

                tempDirectMessages.set(roomIdentifier, msgs);
              } else if (dirSplit[1] === 'rooms') {
                const roomMsgs = [];

                for (const m of file) {
                  if (m.UserMessage) {
                    roomMsgs.push({
                      type: 'user',
                      id: `hipchatenterprise-${dirSplit[2]}-${m.UserMessage.id}`,
                      userId: m.UserMessage.sender.id,
                      text: m.UserMessage.message.indexOf('/me ') === -1 ? m.UserMessage.message : `${m.UserMessage.message.replace(/\/me /, '_')}_`,
                      ts: new Date(m.UserMessage.timestamp.split(' ')[0])
                    });
                  } else if (m.TopicRoomMessage) {
                    roomMsgs.push({
                      type: 'topic',
                      id: `hipchatenterprise-${dirSplit[2]}-${m.TopicRoomMessage.id}`,
                      userId: m.TopicRoomMessage.sender.id,
                      ts: new Date(m.TopicRoomMessage.timestamp.split(' ')[0]),
                      text: m.TopicRoomMessage.message
                    });
                  } else {
                    this.logger.warn('HipChat Enterprise importer isn\'t configured to handle this message:', m);
                  }
                }

                tempMessages.set(roomIdentifier, roomMsgs);
              } else {
                this.logger.warn(`HipChat Enterprise importer isn't configured to handle "${dirSplit[1]}" files.`);
              }
            } else {
              //What are these files!?
              this.logger.warn(`HipChat Enterprise importer doesn't know what to do with the file "${header.name}" :o`, info);
            }
          }));
          stream.on('end', () => next());
          stream.on('error', () => next());
        } else {
          next();
        }
      }));
      this.extract.on('error', err => {
        this.logger.warn('extract error:', err);
        reject();
      });
      this.extract.on('finish', Meteor.bindEnvironment(() => {
        // Insert the users record, eventually this might have to be split into several ones as well
        // if someone tries to import a several thousands users instance
        const usersId = this.collection.insert({
          'import': this.importRecord._id,
          'importer': this.name,
          'type': 'users',
          'users': tempUsers
        });
        this.users = this.collection.findOne(usersId);
        super.updateRecord({
          'count.users': tempUsers.length
        });
        super.addCountToTotal(tempUsers.length); // Insert the channels records.

        const channelsId = this.collection.insert({
          'import': this.importRecord._id,
          'importer': this.name,
          'type': 'channels',
          'channels': tempRooms
        });
        this.channels = this.collection.findOne(channelsId);
        super.updateRecord({
          'count.channels': tempRooms.length
        });
        super.addCountToTotal(tempRooms.length); // Save the messages records to the import record for `startImport` usage

        super.updateProgress(ProgressStep.PREPARING_MESSAGES);
        let messagesCount = 0;

        for (const [channel, msgs] of tempMessages.entries()) {
          if (!this.messages.get(channel)) {
            this.messages.set(channel, new Map());
          }

          messagesCount += msgs.length;
          super.updateRecord({
            'messagesstatus': channel
          });

          if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
            Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
              const messagesId = this.collection.insert({
                'import': this.importRecord._id,
                'importer': this.name,
                'type': 'messages',
                'name': `${channel}/${i}`,
                'messages': splitMsg
              });
              this.messages.get(channel).set(`${channel}.${i}`, this.collection.findOne(messagesId));
            });
          } else {
            const messagesId = this.collection.insert({
              'import': this.importRecord._id,
              'importer': this.name,
              'type': 'messages',
              'name': `${channel}`,
              'messages': msgs
            });
            this.messages.get(channel).set(channel, this.collection.findOne(messagesId));
          }
        }

        for (const [directMsgUser, msgs] of tempDirectMessages.entries()) {
          this.logger.debug(`Preparing the direct messages for: ${directMsgUser}`);

          if (!this.directMessages.get(directMsgUser)) {
            this.directMessages.set(directMsgUser, new Map());
          }

          messagesCount += msgs.length;
          super.updateRecord({
            'messagesstatus': directMsgUser
          });

          if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
            Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
              const messagesId = this.collection.insert({
                'import': this.importRecord._id,
                'importer': this.name,
                'type': 'directMessages',
                'name': `${directMsgUser}/${i}`,
                'messages': splitMsg
              });
              this.directMessages.get(directMsgUser).set(`${directMsgUser}.${i}`, this.collection.findOne(messagesId));
            });
          } else {
            const messagesId = this.collection.insert({
              'import': this.importRecord._id,
              'importer': this.name,
              'type': 'directMessages',
              'name': `${directMsgUser}`,
              'messages': msgs
            });
            this.directMessages.get(directMsgUser).set(directMsgUser, this.collection.findOne(messagesId));
          }
        }

        super.updateRecord({
          'count.messages': messagesCount,
          'messagesstatus': null
        });
        super.addCountToTotal(messagesCount); //Ensure we have some users, channels, and messages

        if (tempUsers.length === 0 || tempRooms.length === 0 || messagesCount === 0) {
          this.logger.warn(`The loaded users count ${tempUsers.length}, the loaded rooms ${tempRooms.length}, and the loaded messages ${messagesCount}`);
          super.updateProgress(ProgressStep.ERROR);
          reject();
          return;
        }

        const selectionUsers = tempUsers.map(u => new SelectionUser(u.id, u.username, u.email, u.isDeleted, false, true));
        const selectionChannels = tempRooms.map(r => new SelectionChannel(r.id, r.name, r.isArchived, true, r.isPrivate));
        const selectionMessages = this.importRecord.count.messages;
        super.updateProgress(ProgressStep.USER_SELECTION);
        resolve(new Selection(this.name, selectionUsers, selectionChannels, selectionMessages));
      })); //Wish I could make this cleaner :(

      const split = dataURI.split(',');
      const s = new this.Readable();
      s.push(new Buffer(split[split.length - 1], 'base64'));
      s.push(null);
      s.pipe(this.zlib.createGunzip()).pipe(this.extract);
    });
    return promise;
  }

  startImport(importSelection) {
    super.startImport(importSelection);
    const started = Date.now(); //Ensure we're only going to import the users that the user has selected

    for (const user of importSelection.users) {
      for (const u of this.users.users) {
        if (u.id === user.user_id) {
          u.do_import = user.do_import;
        }
      }
    }

    this.collection.update({
      _id: this.users._id
    }, {
      $set: {
        'users': this.users.users
      }
    }); //Ensure we're only importing the channels the user has selected.

    for (const channel of importSelection.channels) {
      for (const c of this.channels.channels) {
        if (c.id === channel.channel_id) {
          c.do_import = channel.do_import;
        }
      }
    }

    this.collection.update({
      _id: this.channels._id
    }, {
      $set: {
        'channels': this.channels.channels
      }
    });
    const startedByUserId = Meteor.userId();
    Meteor.defer(() => {
      super.updateProgress(ProgressStep.IMPORTING_USERS);

      try {
        //Import the users
        for (const u of this.users.users) {
          this.logger.debug(`Starting the user import: ${u.username} and are we importing them? ${u.do_import}`);

          if (!u.do_import) {
            continue;
          }

          Meteor.runAsUser(startedByUserId, () => {
            let existantUser = RocketChat.models.Users.findOneByEmailAddress(u.email); //If we couldn't find one by their email address, try to find an existing user by their username

            if (!existantUser) {
              existantUser = RocketChat.models.Users.findOneByUsername(u.username);
            }

            if (existantUser) {
              //since we have an existing user, let's try a few things
              u.rocketId = existantUser._id;
              RocketChat.models.Users.update({
                _id: u.rocketId
              }, {
                $addToSet: {
                  importIds: u.id
                }
              });
            } else {
              const userId = Accounts.createUser({
                email: u.email,
                password: Date.now() + u.name + u.email.toUpperCase()
              });
              Meteor.runAsUser(userId, () => {
                Meteor.call('setUsername', u.username, {
                  joinDefaultChannelsSilenced: true
                }); //TODO: Use moment timezone to calc the time offset - Meteor.call 'userSetUtcOffset', user.tz_offset / 3600

                RocketChat.models.Users.setName(userId, u.name); //TODO: Think about using a custom field for the users "title" field

                if (u.avatar) {
                  Meteor.call('setAvatarFromService', `data:image/png;base64,${u.avatar}`);
                } //Deleted users are 'inactive' users in Rocket.Chat


                if (u.deleted) {
                  Meteor.call('setUserActiveStatus', userId, false);
                }

                RocketChat.models.Users.update({
                  _id: userId
                }, {
                  $addToSet: {
                    importIds: u.id
                  }
                });
                u.rocketId = userId;
              });
            }

            super.addCountCompleted(1);
          });
        }

        this.collection.update({
          _id: this.users._id
        }, {
          $set: {
            'users': this.users.users
          }
        }); //Import the channels

        super.updateProgress(ProgressStep.IMPORTING_CHANNELS);

        for (const c of this.channels.channels) {
          if (!c.do_import) {
            continue;
          }

          Meteor.runAsUser(startedByUserId, () => {
            const existantRoom = RocketChat.models.Rooms.findOneByName(c.name); //If the room exists or the name of it is 'general', then we don't need to create it again

            if (existantRoom || c.name.toUpperCase() === 'GENERAL') {
              c.rocketId = c.name.toUpperCase() === 'GENERAL' ? 'GENERAL' : existantRoom._id;
              RocketChat.models.Rooms.update({
                _id: c.rocketId
              }, {
                $addToSet: {
                  importIds: c.id
                }
              });
            } else {
              //Find the rocketchatId of the user who created this channel
              let creatorId = startedByUserId;

              for (const u of this.users.users) {
                if (u.id === c.creator && u.do_import) {
                  creatorId = u.rocketId;
                }
              } //Create the channel


              Meteor.runAsUser(creatorId, () => {
                const roomInfo = Meteor.call(c.isPrivate ? 'createPrivateGroup' : 'createChannel', c.name, []);
                c.rocketId = roomInfo.rid;
              });
              RocketChat.models.Rooms.update({
                _id: c.rocketId
              }, {
                $set: {
                  ts: c.created,
                  topic: c.topic
                },
                $addToSet: {
                  importIds: c.id
                }
              });
            }

            super.addCountCompleted(1);
          });
        }

        this.collection.update({
          _id: this.channels._id
        }, {
          $set: {
            'channels': this.channels.channels
          }
        }); //Import the Messages

        super.updateProgress(ProgressStep.IMPORTING_MESSAGES);

        for (const [ch, messagesMap] of this.messages.entries()) {
          const hipChannel = this.getChannelFromRoomIdentifier(ch);

          if (!hipChannel.do_import) {
            continue;
          }

          const room = RocketChat.models.Rooms.findOneById(hipChannel.rocketId, {
            fields: {
              usernames: 1,
              t: 1,
              name: 1
            }
          });
          Meteor.runAsUser(startedByUserId, () => {
            for (const [msgGroupData, msgs] of messagesMap.entries()) {
              super.updateRecord({
                'messagesstatus': `${ch}/${msgGroupData}.${msgs.messages.length}`
              });

              for (const msg of msgs.messages) {
                if (isNaN(msg.ts)) {
                  this.logger.warn(`Timestamp on a message in ${ch}/${msgGroupData} is invalid`);
                  super.addCountCompleted(1);
                  continue;
                }

                const creator = this.getRocketUserFromUserId(msg.userId);

                if (creator) {
                  switch (msg.type) {
                    case 'user':
                      RocketChat.sendMessage(creator, {
                        _id: msg.id,
                        ts: msg.ts,
                        msg: msg.text,
                        rid: room._id,
                        u: {
                          _id: creator._id,
                          username: creator.username
                        }
                      }, room, true);
                      break;

                    case 'topic':
                      RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, msg.text, creator, {
                        _id: msg.id,
                        ts: msg.ts
                      });
                      break;
                  }
                }

                super.addCountCompleted(1);
              }
            }
          });
        } //Import the Direct Messages


        for (const [directMsgRoom, directMessagesMap] of this.directMessages.entries()) {
          const hipUser = this.getUserFromDirectMessageIdentifier(directMsgRoom);

          if (!hipUser.do_import) {
            continue;
          } //Verify this direct message user's room is valid (confusing but idk how else to explain it)


          if (!this.getRocketUserFromUserId(hipUser.id)) {
            continue;
          }

          for (const [msgGroupData, msgs] of directMessagesMap.entries()) {
            super.updateRecord({
              'messagesstatus': `${directMsgRoom}/${msgGroupData}.${msgs.messages.length}`
            });

            for (const msg of msgs.messages) {
              if (isNaN(msg.ts)) {
                this.logger.warn(`Timestamp on a message in ${directMsgRoom}/${msgGroupData} is invalid`);
                super.addCountCompleted(1);
                continue;
              } //make sure the message sender is a valid user inside rocket.chat


              const sender = this.getRocketUserFromUserId(msg.senderId);

              if (!sender) {
                continue;
              } //make sure the receiver of the message is a valid rocket.chat user


              const receiver = this.getRocketUserFromUserId(msg.receiverId);

              if (!receiver) {
                continue;
              }

              let room = RocketChat.models.Rooms.findOneById([receiver._id, sender._id].sort().join(''));

              if (!room) {
                Meteor.runAsUser(sender._id, () => {
                  const roomInfo = Meteor.call('createDirectMessage', receiver.username);
                  room = RocketChat.models.Rooms.findOneById(roomInfo.rid);
                });
              }

              Meteor.runAsUser(sender._id, () => {
                RocketChat.sendMessage(sender, {
                  _id: msg.id,
                  ts: msg.ts,
                  msg: msg.text,
                  rid: room._id,
                  u: {
                    _id: sender._id,
                    username: sender.username
                  }
                }, room, true);
              });
            }
          }
        }

        super.updateProgress(ProgressStep.FINISHING);
        super.updateProgress(ProgressStep.DONE);
      } catch (e) {
        this.logger.error(e);
        super.updateProgress(ProgressStep.ERROR);
      }

      const timeTook = Date.now() - started;
      this.logger.log(`HipChat Enterprise Import took ${timeTook} milliseconds.`);
    });
    return super.getProgress();
  }

  getSelection() {
    const selectionUsers = this.users.users.map(u => new SelectionUser(u.id, u.username, u.email, false, false, true));
    const selectionChannels = this.channels.channels.map(c => new SelectionChannel(c.id, c.name, false, true, c.isPrivate));
    const selectionMessages = this.importRecord.count.messages;
    return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
  }

  getChannelFromRoomIdentifier(roomIdentifier) {
    for (const ch of this.channels.channels) {
      if (`rooms/${ch.id}` === roomIdentifier) {
        return ch;
      }
    }
  }

  getUserFromDirectMessageIdentifier(directIdentifier) {
    for (const u of this.users.users) {
      if (`users/${u.id}` === directIdentifier) {
        return u;
      }
    }
  }

  getRocketUserFromUserId(userId) {
    for (const u of this.users.users) {
      if (u.id === userId) {
        return RocketChat.models.Users.findOneById(u.rocketId, {
          fields: {
            username: 1
          }
        });
      }
    }
  }

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"adder.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_importer-hipchat-enterprise/server/adder.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
let HipChatEnterpriseImporterInfo;
module.watch(require("../info"), {
  HipChatEnterpriseImporterInfo(v) {
    HipChatEnterpriseImporterInfo = v;
  }

}, 1);
let HipChatEnterpriseImporter;
module.watch(require("./importer"), {
  HipChatEnterpriseImporter(v) {
    HipChatEnterpriseImporter = v;
  }

}, 2);
Importers.add(new HipChatEnterpriseImporterInfo(), HipChatEnterpriseImporter);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:importer-hipchat-enterprise/info.js");
require("/node_modules/meteor/rocketchat:importer-hipchat-enterprise/server/importer.js");
require("/node_modules/meteor/rocketchat:importer-hipchat-enterprise/server/adder.js");

/* Exports */
Package._define("rocketchat:importer-hipchat-enterprise");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_importer-hipchat-enterprise.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1oaXBjaGF0LWVudGVycHJpc2UvaW5mby5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1oaXBjaGF0LWVudGVycHJpc2Uvc2VydmVyL2ltcG9ydGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyLWhpcGNoYXQtZW50ZXJwcmlzZS9zZXJ2ZXIvYWRkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiSGlwQ2hhdEVudGVycHJpc2VJbXBvcnRlckluZm8iLCJJbXBvcnRlckluZm8iLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiY29uc3RydWN0b3IiLCJ0ZXh0IiwiaHJlZiIsIkhpcENoYXRFbnRlcnByaXNlSW1wb3J0ZXIiLCJCYXNlIiwiUHJvZ3Jlc3NTdGVwIiwiU2VsZWN0aW9uIiwiU2VsZWN0aW9uQ2hhbm5lbCIsIlNlbGVjdGlvblVzZXIiLCJSZWFkYWJsZSIsInBhdGgiLCJkZWZhdWx0IiwiaW5mbyIsInpsaWIiLCJ0YXJTdHJlYW0iLCJleHRyYWN0IiwibWVzc2FnZXMiLCJNYXAiLCJkaXJlY3RNZXNzYWdlcyIsInByZXBhcmUiLCJkYXRhVVJJIiwic2VudENvbnRlbnRUeXBlIiwiZmlsZU5hbWUiLCJ0ZW1wVXNlcnMiLCJ0ZW1wUm9vbXMiLCJ0ZW1wTWVzc2FnZXMiLCJ0ZW1wRGlyZWN0TWVzc2FnZXMiLCJwcm9taXNlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJvbiIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsImhlYWRlciIsInN0cmVhbSIsIm5leHQiLCJuYW1lIiwiaW5kZXhPZiIsInBhcnNlIiwiY2h1bmsiLCJsb2dnZXIiLCJkZWJ1ZyIsImZpbGUiLCJKU09OIiwiYmFzZSIsInVwZGF0ZVByb2dyZXNzIiwiUFJFUEFSSU5HX1VTRVJTIiwidSIsInB1c2giLCJpZCIsIlVzZXIiLCJlbWFpbCIsInVzZXJuYW1lIiwibWVudGlvbl9uYW1lIiwiYXZhdGFyIiwicmVwbGFjZSIsInRpbWV6b25lIiwiaXNEZWxldGVkIiwiaXNfZGVsZXRlZCIsIlBSRVBBUklOR19DSEFOTkVMUyIsInIiLCJSb29tIiwiY3JlYXRvciIsIm93bmVyIiwiY3JlYXRlZCIsIkRhdGUiLCJ0b0xvd2VyQ2FzZSIsImlzUHJpdmF0ZSIsInByaXZhY3kiLCJpc0FyY2hpdmVkIiwiaXNfYXJjaGl2ZWQiLCJ0b3BpYyIsImRpclNwbGl0IiwiZGlyIiwic3BsaXQiLCJyb29tSWRlbnRpZmllciIsIm1zZ3MiLCJtIiwiUHJpdmF0ZVVzZXJNZXNzYWdlIiwidHlwZSIsInNlbmRlcklkIiwic2VuZGVyIiwicmVjZWl2ZXJJZCIsInJlY2VpdmVyIiwibWVzc2FnZSIsInRzIiwidGltZXN0YW1wIiwic2V0Iiwicm9vbU1zZ3MiLCJVc2VyTWVzc2FnZSIsInVzZXJJZCIsIlRvcGljUm9vbU1lc3NhZ2UiLCJ3YXJuIiwiZXJyIiwidXNlcnNJZCIsImNvbGxlY3Rpb24iLCJpbnNlcnQiLCJpbXBvcnRSZWNvcmQiLCJfaWQiLCJ1c2VycyIsImZpbmRPbmUiLCJ1cGRhdGVSZWNvcmQiLCJsZW5ndGgiLCJhZGRDb3VudFRvVG90YWwiLCJjaGFubmVsc0lkIiwiY2hhbm5lbHMiLCJQUkVQQVJJTkdfTUVTU0FHRVMiLCJtZXNzYWdlc0NvdW50IiwiY2hhbm5lbCIsImVudHJpZXMiLCJnZXQiLCJnZXRCU09OU2l6ZSIsImdldE1heEJTT05TaXplIiwiZ2V0QlNPTlNhZmVBcnJheXNGcm9tQW5BcnJheSIsImZvckVhY2giLCJzcGxpdE1zZyIsImkiLCJtZXNzYWdlc0lkIiwiZGlyZWN0TXNnVXNlciIsIkVSUk9SIiwic2VsZWN0aW9uVXNlcnMiLCJtYXAiLCJzZWxlY3Rpb25DaGFubmVscyIsInNlbGVjdGlvbk1lc3NhZ2VzIiwiY291bnQiLCJVU0VSX1NFTEVDVElPTiIsInMiLCJCdWZmZXIiLCJwaXBlIiwiY3JlYXRlR3VuemlwIiwic3RhcnRJbXBvcnQiLCJpbXBvcnRTZWxlY3Rpb24iLCJzdGFydGVkIiwibm93IiwidXNlciIsInVzZXJfaWQiLCJkb19pbXBvcnQiLCJ1cGRhdGUiLCIkc2V0IiwiYyIsImNoYW5uZWxfaWQiLCJzdGFydGVkQnlVc2VySWQiLCJkZWZlciIsIklNUE9SVElOR19VU0VSUyIsInJ1bkFzVXNlciIsImV4aXN0YW50VXNlciIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJVc2VycyIsImZpbmRPbmVCeUVtYWlsQWRkcmVzcyIsImZpbmRPbmVCeVVzZXJuYW1lIiwicm9ja2V0SWQiLCIkYWRkVG9TZXQiLCJpbXBvcnRJZHMiLCJBY2NvdW50cyIsImNyZWF0ZVVzZXIiLCJwYXNzd29yZCIsInRvVXBwZXJDYXNlIiwiY2FsbCIsImpvaW5EZWZhdWx0Q2hhbm5lbHNTaWxlbmNlZCIsInNldE5hbWUiLCJkZWxldGVkIiwiYWRkQ291bnRDb21wbGV0ZWQiLCJJTVBPUlRJTkdfQ0hBTk5FTFMiLCJleGlzdGFudFJvb20iLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJjcmVhdG9ySWQiLCJyb29tSW5mbyIsInJpZCIsIklNUE9SVElOR19NRVNTQUdFUyIsImNoIiwibWVzc2FnZXNNYXAiLCJoaXBDaGFubmVsIiwiZ2V0Q2hhbm5lbEZyb21Sb29tSWRlbnRpZmllciIsInJvb20iLCJmaW5kT25lQnlJZCIsImZpZWxkcyIsInVzZXJuYW1lcyIsInQiLCJtc2dHcm91cERhdGEiLCJtc2ciLCJpc05hTiIsImdldFJvY2tldFVzZXJGcm9tVXNlcklkIiwic2VuZE1lc3NhZ2UiLCJNZXNzYWdlcyIsImNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyIiwiZGlyZWN0TXNnUm9vbSIsImRpcmVjdE1lc3NhZ2VzTWFwIiwiaGlwVXNlciIsImdldFVzZXJGcm9tRGlyZWN0TWVzc2FnZUlkZW50aWZpZXIiLCJzb3J0Iiwiam9pbiIsIkZJTklTSElORyIsIkRPTkUiLCJlIiwiZXJyb3IiLCJ0aW1lVG9vayIsImxvZyIsImdldFByb2dyZXNzIiwiZ2V0U2VsZWN0aW9uIiwiZGlyZWN0SWRlbnRpZmllciIsIkltcG9ydGVycyIsImFkZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsaUNBQThCLE1BQUlBO0FBQW5DLENBQWQ7QUFBaUYsSUFBSUMsWUFBSjtBQUFpQkgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0YsZUFBYUcsQ0FBYixFQUFlO0FBQUNILG1CQUFhRyxDQUFiO0FBQWU7O0FBQWhDLENBQW5ELEVBQXFGLENBQXJGOztBQUUzRixNQUFNSiw2QkFBTixTQUE0Q0MsWUFBNUMsQ0FBeUQ7QUFDL0RJLGdCQUFjO0FBQ2IsVUFBTSxtQkFBTixFQUEyQixvQkFBM0IsRUFBaUQsa0JBQWpELEVBQXFFLENBQ3BFO0FBQ0NDLFlBQU0sd0NBRFA7QUFFQ0MsWUFBTTtBQUZQLEtBRG9FLEVBSWpFO0FBQ0ZELFlBQU0sd0NBREo7QUFFRkMsWUFBTTtBQUZKLEtBSmlFLENBQXJFO0FBU0E7O0FBWDhELEM7Ozs7Ozs7Ozs7O0FDRmhFVCxPQUFPQyxNQUFQLENBQWM7QUFBQ1MsNkJBQTBCLE1BQUlBO0FBQS9CLENBQWQ7QUFBeUUsSUFBSUMsSUFBSixFQUFTQyxZQUFULEVBQXNCQyxTQUF0QixFQUFnQ0MsZ0JBQWhDLEVBQWlEQyxhQUFqRDtBQUErRGYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ00sT0FBS0wsQ0FBTCxFQUFPO0FBQUNLLFdBQUtMLENBQUw7QUFBTyxHQUFoQjs7QUFBaUJNLGVBQWFOLENBQWIsRUFBZTtBQUFDTSxtQkFBYU4sQ0FBYjtBQUFlLEdBQWhEOztBQUFpRE8sWUFBVVAsQ0FBVixFQUFZO0FBQUNPLGdCQUFVUCxDQUFWO0FBQVksR0FBMUU7O0FBQTJFUSxtQkFBaUJSLENBQWpCLEVBQW1CO0FBQUNR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RTtBQUFrRixJQUFJSiw2QkFBSjtBQUFrQ0YsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLFNBQVIsQ0FBYixFQUFnQztBQUFDSCxnQ0FBOEJJLENBQTlCLEVBQWdDO0FBQUNKLG9DQUE4QkksQ0FBOUI7QUFBZ0M7O0FBQWxFLENBQWhDLEVBQW9HLENBQXBHO0FBQXVHLElBQUlJLHlCQUFKO0FBQThCVixPQUFPSSxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNLLDRCQUEwQkosQ0FBMUIsRUFBNEI7QUFBQ0ksZ0NBQTBCSixDQUExQjtBQUE0Qjs7QUFBMUQsQ0FBbkMsRUFBK0YsQ0FBL0Y7QUFJdlE0TSxVQUFVQyxHQUFWLENBQWMsSUFBSWpOLDZCQUFKLEVBQWQsRUFBbURRLHlCQUFuRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2ltcG9ydGVyLWhpcGNoYXQtZW50ZXJwcmlzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEltcG9ydGVySW5mbyB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcblxuZXhwb3J0IGNsYXNzIEhpcENoYXRFbnRlcnByaXNlSW1wb3J0ZXJJbmZvIGV4dGVuZHMgSW1wb3J0ZXJJbmZvIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2hpcGNoYXRlbnRlcnByaXNlJywgJ0hpcENoYXQgRW50ZXJwcmlzZScsICdhcHBsaWNhdGlvbi9nemlwJywgW1xuXHRcdFx0e1xuXHRcdFx0XHR0ZXh0OiAnSW1wb3J0ZXJfSGlwQ2hhdEVudGVycHJpc2VfSW5mb3JtYXRpb24nLFxuXHRcdFx0XHRocmVmOiAnaHR0cHM6Ly9yb2NrZXQuY2hhdC9kb2NzL2FkbWluaXN0cmF0b3ItZ3VpZGVzL2ltcG9ydC9oaXBjaGF0L2VudGVycHJpc2UvJ1xuXHRcdFx0fSwge1xuXHRcdFx0XHR0ZXh0OiAnSW1wb3J0ZXJfSGlwQ2hhdEVudGVycHJpc2VfQmV0YVdhcm5pbmcnLFxuXHRcdFx0XHRocmVmOiAnaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzL25ldydcblx0XHRcdH1cblx0XHRdKTtcblx0fVxufVxuIiwiaW1wb3J0IHtcblx0QmFzZSxcblx0UHJvZ3Jlc3NTdGVwLFxuXHRTZWxlY3Rpb24sXG5cdFNlbGVjdGlvbkNoYW5uZWwsXG5cdFNlbGVjdGlvblVzZXJcbn0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuaW1wb3J0IHtSZWFkYWJsZX0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY2xhc3MgSGlwQ2hhdEVudGVycHJpc2VJbXBvcnRlciBleHRlbmRzIEJhc2Uge1xuXHRjb25zdHJ1Y3RvcihpbmZvKSB7XG5cdFx0c3VwZXIoaW5mbyk7XG5cblx0XHR0aGlzLlJlYWRhYmxlID0gUmVhZGFibGU7XG5cdFx0dGhpcy56bGliID0gcmVxdWlyZSgnemxpYicpO1xuXHRcdHRoaXMudGFyU3RyZWFtID0gcmVxdWlyZSgndGFyLXN0cmVhbScpO1xuXHRcdHRoaXMuZXh0cmFjdCA9IHRoaXMudGFyU3RyZWFtLmV4dHJhY3QoKTtcblx0XHR0aGlzLnBhdGggPSBwYXRoO1xuXHRcdHRoaXMubWVzc2FnZXMgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5kaXJlY3RNZXNzYWdlcyA9IG5ldyBNYXAoKTtcblx0fVxuXG5cdHByZXBhcmUoZGF0YVVSSSwgc2VudENvbnRlbnRUeXBlLCBmaWxlTmFtZSkge1xuXHRcdHN1cGVyLnByZXBhcmUoZGF0YVVSSSwgc2VudENvbnRlbnRUeXBlLCBmaWxlTmFtZSk7XG5cblx0XHRjb25zdCB0ZW1wVXNlcnMgPSBbXTtcblx0XHRjb25zdCB0ZW1wUm9vbXMgPSBbXTtcblx0XHRjb25zdCB0ZW1wTWVzc2FnZXMgPSBuZXcgTWFwKCk7XG5cdFx0Y29uc3QgdGVtcERpcmVjdE1lc3NhZ2VzID0gbmV3IE1hcCgpO1xuXHRcdGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHR0aGlzLmV4dHJhY3Qub24oJ2VudHJ5JywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoaGVhZGVyLCBzdHJlYW0sIG5leHQpID0+IHtcblx0XHRcdFx0aWYgKGhlYWRlci5uYW1lLmluZGV4T2YoJy5qc29uJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0Y29uc3QgaW5mbyA9IHRoaXMucGF0aC5wYXJzZShoZWFkZXIubmFtZSk7XG5cblx0XHRcdFx0XHRzdHJlYW0ub24oJ2RhdGEnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChjaHVuaykgPT4ge1xuXHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFByb2Nlc3NpbmcgdGhlIGZpbGU6ICR7IGhlYWRlci5uYW1lIH1gKTtcblx0XHRcdFx0XHRcdGNvbnN0IGZpbGUgPSBKU09OLnBhcnNlKGNodW5rKTtcblxuXHRcdFx0XHRcdFx0aWYgKGluZm8uYmFzZSA9PT0gJ3VzZXJzLmpzb24nKSB7XG5cdFx0XHRcdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfVVNFUlMpO1xuXHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHUgb2YgZmlsZSkge1xuXHRcdFx0XHRcdFx0XHRcdHRlbXBVc2Vycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdGlkOiB1LlVzZXIuaWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRlbWFpbDogdS5Vc2VyLmVtYWlsLFxuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogdS5Vc2VyLm5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogdS5Vc2VyLm1lbnRpb25fbmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdGF2YXRhcjogdS5Vc2VyLmF2YXRhci5yZXBsYWNlKC9cXG4vZywgJycpLFxuXHRcdFx0XHRcdFx0XHRcdFx0dGltZXpvbmU6IHUuVXNlci50aW1lem9uZSxcblx0XHRcdFx0XHRcdFx0XHRcdGlzRGVsZXRlZDogdS5Vc2VyLmlzX2RlbGV0ZWRcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmIChpbmZvLmJhc2UgPT09ICdyb29tcy5qc29uJykge1xuXHRcdFx0XHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuUFJFUEFSSU5HX0NIQU5ORUxTKTtcblx0XHRcdFx0XHRcdFx0Zm9yIChjb25zdCByIG9mIGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0XHR0ZW1wUm9vbXMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZDogci5Sb29tLmlkLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRvcjogci5Sb29tLm93bmVyLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRlZDogbmV3IERhdGUoci5Sb29tLmNyZWF0ZWQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZTogci5Sb29tLm5hbWUucmVwbGFjZSgvIC9nLCAnXycpLnRvTG93ZXJDYXNlKCksXG5cdFx0XHRcdFx0XHRcdFx0XHRpc1ByaXZhdGU6IHIuUm9vbS5wcml2YWN5ID09PSAncHJpdmF0ZScsXG5cdFx0XHRcdFx0XHRcdFx0XHRpc0FyY2hpdmVkOiByLlJvb20uaXNfYXJjaGl2ZWQsXG5cdFx0XHRcdFx0XHRcdFx0XHR0b3BpYzogci5Sb29tLnRvcGljXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoaW5mby5iYXNlID09PSAnaGlzdG9yeS5qc29uJykge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBkaXJTcGxpdCA9IGluZm8uZGlyLnNwbGl0KCcvJyk7IC8vWycuJywgJ3VzZXJzJywgJzEnXVxuXHRcdFx0XHRcdFx0XHRjb25zdCByb29tSWRlbnRpZmllciA9IGAkeyBkaXJTcGxpdFsxXSB9LyR7IGRpclNwbGl0WzJdIH1gO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChkaXJTcGxpdFsxXSA9PT0gJ3VzZXJzJykge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IG1zZ3MgPSBbXTtcblx0XHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IG0gb2YgZmlsZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG0uUHJpdmF0ZVVzZXJNZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1zZ3MucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHlwZTogJ3VzZXInLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlkOiBgaGlwY2hhdGVudGVycHJpc2UtJHsgbS5Qcml2YXRlVXNlck1lc3NhZ2UuaWQgfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c2VuZGVySWQ6IG0uUHJpdmF0ZVVzZXJNZXNzYWdlLnNlbmRlci5pZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZWNlaXZlcklkOiBtLlByaXZhdGVVc2VyTWVzc2FnZS5yZWNlaXZlci5pZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0ZXh0OiBtLlByaXZhdGVVc2VyTWVzc2FnZS5tZXNzYWdlLmluZGV4T2YoJy9tZSAnKSA9PT0gLTEgPyBtLlByaXZhdGVVc2VyTWVzc2FnZS5tZXNzYWdlIDogYCR7IG0uUHJpdmF0ZVVzZXJNZXNzYWdlLm1lc3NhZ2UucmVwbGFjZSgvXFwvbWUgLywgJ18nKSB9X2AsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHM6IG5ldyBEYXRlKG0uUHJpdmF0ZVVzZXJNZXNzYWdlLnRpbWVzdGFtcC5zcGxpdCgnICcpWzBdKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0dGVtcERpcmVjdE1lc3NhZ2VzLnNldChyb29tSWRlbnRpZmllciwgbXNncyk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoZGlyU3BsaXRbMV0gPT09ICdyb29tcycpIHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCByb29tTXNncyA9IFtdO1xuXG5cdFx0XHRcdFx0XHRcdFx0Zm9yIChjb25zdCBtIG9mIGZpbGUpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChtLlVzZXJNZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJvb21Nc2dzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6ICd1c2VyJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZDogYGhpcGNoYXRlbnRlcnByaXNlLSR7IGRpclNwbGl0WzJdIH0tJHsgbS5Vc2VyTWVzc2FnZS5pZCB9YCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1c2VySWQ6IG0uVXNlck1lc3NhZ2Uuc2VuZGVyLmlkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRleHQ6IG0uVXNlck1lc3NhZ2UubWVzc2FnZS5pbmRleE9mKCcvbWUgJykgPT09IC0xID8gbS5Vc2VyTWVzc2FnZS5tZXNzYWdlIDogYCR7IG0uVXNlck1lc3NhZ2UubWVzc2FnZS5yZXBsYWNlKC9cXC9tZSAvLCAnXycpIH1fYCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0czogbmV3IERhdGUobS5Vc2VyTWVzc2FnZS50aW1lc3RhbXAuc3BsaXQoJyAnKVswXSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG0uVG9waWNSb29tTWVzc2FnZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRyb29tTXNncy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0eXBlOiAndG9waWMnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlkOiBgaGlwY2hhdGVudGVycHJpc2UtJHsgZGlyU3BsaXRbMl0gfS0keyBtLlRvcGljUm9vbU1lc3NhZ2UuaWQgfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXNlcklkOiBtLlRvcGljUm9vbU1lc3NhZ2Uuc2VuZGVyLmlkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRzOiBuZXcgRGF0ZShtLlRvcGljUm9vbU1lc3NhZ2UudGltZXN0YW1wLnNwbGl0KCcgJylbMF0pLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRleHQ6IG0uVG9waWNSb29tTWVzc2FnZS5tZXNzYWdlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybignSGlwQ2hhdCBFbnRlcnByaXNlIGltcG9ydGVyIGlzblxcJ3QgY29uZmlndXJlZCB0byBoYW5kbGUgdGhpcyBtZXNzYWdlOicsIG0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR0ZW1wTWVzc2FnZXMuc2V0KHJvb21JZGVudGlmaWVyLCByb29tTXNncyk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybihgSGlwQ2hhdCBFbnRlcnByaXNlIGltcG9ydGVyIGlzbid0IGNvbmZpZ3VyZWQgdG8gaGFuZGxlIFwiJHsgZGlyU3BsaXRbMV0gfVwiIGZpbGVzLmApO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHQvL1doYXQgYXJlIHRoZXNlIGZpbGVzIT9cblx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybihgSGlwQ2hhdCBFbnRlcnByaXNlIGltcG9ydGVyIGRvZXNuJ3Qga25vdyB3aGF0IHRvIGRvIHdpdGggdGhlIGZpbGUgXCIkeyBoZWFkZXIubmFtZSB9XCIgOm9gLCBpbmZvKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0XHRzdHJlYW0ub24oJ2VuZCcsICgpID0+IG5leHQoKSk7XG5cdFx0XHRcdFx0c3RyZWFtLm9uKCdlcnJvcicsICgpID0+IG5leHQoKSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bmV4dCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KSk7XG5cblx0XHRcdHRoaXMuZXh0cmFjdC5vbignZXJyb3InLCAoZXJyKSA9PiB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oJ2V4dHJhY3QgZXJyb3I6JywgZXJyKTtcblx0XHRcdFx0cmVqZWN0KCk7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5leHRyYWN0Lm9uKCdmaW5pc2gnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0Ly8gSW5zZXJ0IHRoZSB1c2VycyByZWNvcmQsIGV2ZW50dWFsbHkgdGhpcyBtaWdodCBoYXZlIHRvIGJlIHNwbGl0IGludG8gc2V2ZXJhbCBvbmVzIGFzIHdlbGxcblx0XHRcdFx0Ly8gaWYgc29tZW9uZSB0cmllcyB0byBpbXBvcnQgYSBzZXZlcmFsIHRob3VzYW5kcyB1c2VycyBpbnN0YW5jZVxuXHRcdFx0XHRjb25zdCB1c2Vyc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAndXNlcnMnLCAndXNlcnMnOiB0ZW1wVXNlcnMgfSk7XG5cdFx0XHRcdHRoaXMudXNlcnMgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZSh1c2Vyc0lkKTtcblx0XHRcdFx0c3VwZXIudXBkYXRlUmVjb3JkKHsgJ2NvdW50LnVzZXJzJzogdGVtcFVzZXJzLmxlbmd0aCB9KTtcblx0XHRcdFx0c3VwZXIuYWRkQ291bnRUb1RvdGFsKHRlbXBVc2Vycy5sZW5ndGgpO1xuXG5cdFx0XHRcdC8vIEluc2VydCB0aGUgY2hhbm5lbHMgcmVjb3Jkcy5cblx0XHRcdFx0Y29uc3QgY2hhbm5lbHNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ2NoYW5uZWxzJywgJ2NoYW5uZWxzJzogdGVtcFJvb21zIH0pO1xuXHRcdFx0XHR0aGlzLmNoYW5uZWxzID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUoY2hhbm5lbHNJZCk7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVJlY29yZCh7ICdjb3VudC5jaGFubmVscyc6IHRlbXBSb29tcy5sZW5ndGggfSk7XG5cdFx0XHRcdHN1cGVyLmFkZENvdW50VG9Ub3RhbCh0ZW1wUm9vbXMubGVuZ3RoKTtcblxuXHRcdFx0XHQvLyBTYXZlIHRoZSBtZXNzYWdlcyByZWNvcmRzIHRvIHRoZSBpbXBvcnQgcmVjb3JkIGZvciBgc3RhcnRJbXBvcnRgIHVzYWdlXG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfTUVTU0FHRVMpO1xuXHRcdFx0XHRsZXQgbWVzc2FnZXNDb3VudCA9IDA7XG5cdFx0XHRcdGZvciAoY29uc3QgW2NoYW5uZWwsIG1zZ3NdIG9mIHRlbXBNZXNzYWdlcy5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRpZiAoIXRoaXMubWVzc2FnZXMuZ2V0KGNoYW5uZWwpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzLnNldChjaGFubmVsLCBuZXcgTWFwKCkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG1lc3NhZ2VzQ291bnQgKz0gbXNncy5sZW5ndGg7XG5cdFx0XHRcdFx0c3VwZXIudXBkYXRlUmVjb3JkKHsgJ21lc3NhZ2Vzc3RhdHVzJzogY2hhbm5lbCB9KTtcblxuXHRcdFx0XHRcdGlmIChCYXNlLmdldEJTT05TaXplKG1zZ3MpID4gQmFzZS5nZXRNYXhCU09OU2l6ZSgpKSB7XG5cdFx0XHRcdFx0XHRCYXNlLmdldEJTT05TYWZlQXJyYXlzRnJvbUFuQXJyYXkobXNncykuZm9yRWFjaCgoc3BsaXRNc2csIGkpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbWVzc2FnZXNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ21lc3NhZ2VzJywgJ25hbWUnOiBgJHsgY2hhbm5lbCB9LyR7IGkgfWAsICdtZXNzYWdlcyc6IHNwbGl0TXNnIH0pO1xuXHRcdFx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzLmdldChjaGFubmVsKS5zZXQoYCR7IGNoYW5uZWwgfS4keyBpIH1gLCB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShtZXNzYWdlc0lkKSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWVzc2FnZXNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ21lc3NhZ2VzJywgJ25hbWUnOiBgJHsgY2hhbm5lbCB9YCwgJ21lc3NhZ2VzJzogbXNncyB9KTtcblx0XHRcdFx0XHRcdHRoaXMubWVzc2FnZXMuZ2V0KGNoYW5uZWwpLnNldChjaGFubmVsLCB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShtZXNzYWdlc0lkKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yIChjb25zdCBbZGlyZWN0TXNnVXNlciwgbXNnc10gb2YgdGVtcERpcmVjdE1lc3NhZ2VzLmVudHJpZXMoKSkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBQcmVwYXJpbmcgdGhlIGRpcmVjdCBtZXNzYWdlcyBmb3I6ICR7IGRpcmVjdE1zZ1VzZXIgfWApO1xuXHRcdFx0XHRcdGlmICghdGhpcy5kaXJlY3RNZXNzYWdlcy5nZXQoZGlyZWN0TXNnVXNlcikpIHtcblx0XHRcdFx0XHRcdHRoaXMuZGlyZWN0TWVzc2FnZXMuc2V0KGRpcmVjdE1zZ1VzZXIsIG5ldyBNYXAoKSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bWVzc2FnZXNDb3VudCArPSBtc2dzLmxlbmd0aDtcblx0XHRcdFx0XHRzdXBlci51cGRhdGVSZWNvcmQoeyAnbWVzc2FnZXNzdGF0dXMnOiBkaXJlY3RNc2dVc2VyIH0pO1xuXG5cdFx0XHRcdFx0aWYgKEJhc2UuZ2V0QlNPTlNpemUobXNncykgPiBCYXNlLmdldE1heEJTT05TaXplKCkpIHtcblx0XHRcdFx0XHRcdEJhc2UuZ2V0QlNPTlNhZmVBcnJheXNGcm9tQW5BcnJheShtc2dzKS5mb3JFYWNoKChzcGxpdE1zZywgaSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zdCBtZXNzYWdlc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAnZGlyZWN0TWVzc2FnZXMnLCAnbmFtZSc6IGAkeyBkaXJlY3RNc2dVc2VyIH0vJHsgaSB9YCwgJ21lc3NhZ2VzJzogc3BsaXRNc2cgfSk7XG5cdFx0XHRcdFx0XHRcdHRoaXMuZGlyZWN0TWVzc2FnZXMuZ2V0KGRpcmVjdE1zZ1VzZXIpLnNldChgJHsgZGlyZWN0TXNnVXNlciB9LiR7IGkgfWAsIHRoaXMuY29sbGVjdGlvbi5maW5kT25lKG1lc3NhZ2VzSWQpKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zdCBtZXNzYWdlc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAnZGlyZWN0TWVzc2FnZXMnLCAnbmFtZSc6IGAkeyBkaXJlY3RNc2dVc2VyIH1gLCAnbWVzc2FnZXMnOiBtc2dzIH0pO1xuXHRcdFx0XHRcdFx0dGhpcy5kaXJlY3RNZXNzYWdlcy5nZXQoZGlyZWN0TXNnVXNlcikuc2V0KGRpcmVjdE1zZ1VzZXIsIHRoaXMuY29sbGVjdGlvbi5maW5kT25lKG1lc3NhZ2VzSWQpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRzdXBlci51cGRhdGVSZWNvcmQoeyAnY291bnQubWVzc2FnZXMnOiBtZXNzYWdlc0NvdW50LCAnbWVzc2FnZXNzdGF0dXMnOiBudWxsIH0pO1xuXHRcdFx0XHRzdXBlci5hZGRDb3VudFRvVG90YWwobWVzc2FnZXNDb3VudCk7XG5cblx0XHRcdFx0Ly9FbnN1cmUgd2UgaGF2ZSBzb21lIHVzZXJzLCBjaGFubmVscywgYW5kIG1lc3NhZ2VzXG5cdFx0XHRcdGlmICh0ZW1wVXNlcnMubGVuZ3RoID09PSAwIHx8IHRlbXBSb29tcy5sZW5ndGggPT09IDAgfHwgbWVzc2FnZXNDb3VudCA9PT0gMCkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYFRoZSBsb2FkZWQgdXNlcnMgY291bnQgJHsgdGVtcFVzZXJzLmxlbmd0aCB9LCB0aGUgbG9hZGVkIHJvb21zICR7IHRlbXBSb29tcy5sZW5ndGggfSwgYW5kIHRoZSBsb2FkZWQgbWVzc2FnZXMgJHsgbWVzc2FnZXNDb3VudCB9YCk7XG5cdFx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkVSUk9SKTtcblx0XHRcdFx0XHRyZWplY3QoKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBzZWxlY3Rpb25Vc2VycyA9IHRlbXBVc2Vycy5tYXAoKHUpID0+IG5ldyBTZWxlY3Rpb25Vc2VyKHUuaWQsIHUudXNlcm5hbWUsIHUuZW1haWwsIHUuaXNEZWxldGVkLCBmYWxzZSwgdHJ1ZSkpO1xuXHRcdFx0XHRjb25zdCBzZWxlY3Rpb25DaGFubmVscyA9IHRlbXBSb29tcy5tYXAoKHIpID0+IG5ldyBTZWxlY3Rpb25DaGFubmVsKHIuaWQsIHIubmFtZSwgci5pc0FyY2hpdmVkLCB0cnVlLCByLmlzUHJpdmF0ZSkpO1xuXHRcdFx0XHRjb25zdCBzZWxlY3Rpb25NZXNzYWdlcyA9IHRoaXMuaW1wb3J0UmVjb3JkLmNvdW50Lm1lc3NhZ2VzO1xuXG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5VU0VSX1NFTEVDVElPTik7XG5cblx0XHRcdFx0cmVzb2x2ZShuZXcgU2VsZWN0aW9uKHRoaXMubmFtZSwgc2VsZWN0aW9uVXNlcnMsIHNlbGVjdGlvbkNoYW5uZWxzLCBzZWxlY3Rpb25NZXNzYWdlcykpO1xuXHRcdFx0fSkpO1xuXG5cdFx0XHQvL1dpc2ggSSBjb3VsZCBtYWtlIHRoaXMgY2xlYW5lciA6KFxuXHRcdFx0Y29uc3Qgc3BsaXQgPSBkYXRhVVJJLnNwbGl0KCcsJyk7XG5cdFx0XHRjb25zdCBzID0gbmV3IHRoaXMuUmVhZGFibGU7XG5cdFx0XHRzLnB1c2gobmV3IEJ1ZmZlcihzcGxpdFtzcGxpdC5sZW5ndGggLSAxXSwgJ2Jhc2U2NCcpKTtcblx0XHRcdHMucHVzaChudWxsKTtcblx0XHRcdHMucGlwZSh0aGlzLnpsaWIuY3JlYXRlR3VuemlwKCkpLnBpcGUodGhpcy5leHRyYWN0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBwcm9taXNlO1xuXHR9XG5cblx0c3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKSB7XG5cdFx0c3VwZXIuc3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKTtcblx0XHRjb25zdCBzdGFydGVkID0gRGF0ZS5ub3coKTtcblxuXHRcdC8vRW5zdXJlIHdlJ3JlIG9ubHkgZ29pbmcgdG8gaW1wb3J0IHRoZSB1c2VycyB0aGF0IHRoZSB1c2VyIGhhcyBzZWxlY3RlZFxuXHRcdGZvciAoY29uc3QgdXNlciBvZiBpbXBvcnRTZWxlY3Rpb24udXNlcnMpIHtcblx0XHRcdGZvciAoY29uc3QgdSBvZiB0aGlzLnVzZXJzLnVzZXJzKSB7XG5cdFx0XHRcdGlmICh1LmlkID09PSB1c2VyLnVzZXJfaWQpIHtcblx0XHRcdFx0XHR1LmRvX2ltcG9ydCA9IHVzZXIuZG9faW1wb3J0O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMudXNlcnMuX2lkIH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH19KTtcblxuXHRcdC8vRW5zdXJlIHdlJ3JlIG9ubHkgaW1wb3J0aW5nIHRoZSBjaGFubmVscyB0aGUgdXNlciBoYXMgc2VsZWN0ZWQuXG5cdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGltcG9ydFNlbGVjdGlvbi5jaGFubmVscykge1xuXHRcdFx0Zm9yIChjb25zdCBjIG9mIHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMpIHtcblx0XHRcdFx0aWYgKGMuaWQgPT09IGNoYW5uZWwuY2hhbm5lbF9pZCkge1xuXHRcdFx0XHRcdGMuZG9faW1wb3J0ID0gY2hhbm5lbC5kb19pbXBvcnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5jb2xsZWN0aW9uLnVwZGF0ZSh7IF9pZDogdGhpcy5jaGFubmVscy5faWQgfSwgeyAkc2V0OiB7ICdjaGFubmVscyc6IHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMgfX0pO1xuXG5cdFx0Y29uc3Qgc3RhcnRlZEJ5VXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpO1xuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuSU1QT1JUSU5HX1VTRVJTKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Ly9JbXBvcnQgdGhlIHVzZXJzXG5cdFx0XHRcdGZvciAoY29uc3QgdSBvZiB0aGlzLnVzZXJzLnVzZXJzKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYFN0YXJ0aW5nIHRoZSB1c2VyIGltcG9ydDogJHsgdS51c2VybmFtZSB9IGFuZCBhcmUgd2UgaW1wb3J0aW5nIHRoZW0/ICR7IHUuZG9faW1wb3J0IH1gKTtcblx0XHRcdFx0XHRpZiAoIXUuZG9faW1wb3J0KSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0bGV0IGV4aXN0YW50VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUVtYWlsQWRkcmVzcyh1LmVtYWlsKTtcblxuXHRcdFx0XHRcdFx0Ly9JZiB3ZSBjb3VsZG4ndCBmaW5kIG9uZSBieSB0aGVpciBlbWFpbCBhZGRyZXNzLCB0cnkgdG8gZmluZCBhbiBleGlzdGluZyB1c2VyIGJ5IHRoZWlyIHVzZXJuYW1lXG5cdFx0XHRcdFx0XHRpZiAoIWV4aXN0YW50VXNlcikge1xuXHRcdFx0XHRcdFx0XHRleGlzdGFudFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1LnVzZXJuYW1lKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGV4aXN0YW50VXNlcikge1xuXHRcdFx0XHRcdFx0XHQvL3NpbmNlIHdlIGhhdmUgYW4gZXhpc3RpbmcgdXNlciwgbGV0J3MgdHJ5IGEgZmV3IHRoaW5nc1xuXHRcdFx0XHRcdFx0XHR1LnJvY2tldElkID0gZXhpc3RhbnRVc2VyLl9pZDtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiB1LnJvY2tldElkIH0sIHsgJGFkZFRvU2V0OiB7IGltcG9ydElkczogdS5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgdXNlcklkID0gQWNjb3VudHMuY3JlYXRlVXNlcih7IGVtYWlsOiB1LmVtYWlsLCBwYXNzd29yZDogRGF0ZS5ub3coKSArIHUubmFtZSArIHUuZW1haWwudG9VcHBlckNhc2UoKSB9KTtcblx0XHRcdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0VXNlcm5hbWUnLCB1LnVzZXJuYW1lLCB7am9pbkRlZmF1bHRDaGFubmVsc1NpbGVuY2VkOiB0cnVlfSk7XG5cdFx0XHRcdFx0XHRcdFx0Ly9UT0RPOiBVc2UgbW9tZW50IHRpbWV6b25lIHRvIGNhbGMgdGhlIHRpbWUgb2Zmc2V0IC0gTWV0ZW9yLmNhbGwgJ3VzZXJTZXRVdGNPZmZzZXQnLCB1c2VyLnR6X29mZnNldCAvIDM2MDBcblx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXROYW1lKHVzZXJJZCwgdS5uYW1lKTtcblx0XHRcdFx0XHRcdFx0XHQvL1RPRE86IFRoaW5rIGFib3V0IHVzaW5nIGEgY3VzdG9tIGZpZWxkIGZvciB0aGUgdXNlcnMgXCJ0aXRsZVwiIGZpZWxkXG5cblx0XHRcdFx0XHRcdFx0XHRpZiAodS5hdmF0YXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRBdmF0YXJGcm9tU2VydmljZScsIGBkYXRhOmltYWdlL3BuZztiYXNlNjQsJHsgdS5hdmF0YXIgfWApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdC8vRGVsZXRlZCB1c2VycyBhcmUgJ2luYWN0aXZlJyB1c2VycyBpbiBSb2NrZXQuQ2hhdFxuXHRcdFx0XHRcdFx0XHRcdGlmICh1LmRlbGV0ZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VyQWN0aXZlU3RhdHVzJywgdXNlcklkLCBmYWxzZSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiB1c2VySWQgfSwgeyAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiB1LmlkIH0gfSk7XG5cdFx0XHRcdFx0XHRcdFx0dS5yb2NrZXRJZCA9IHVzZXJJZDtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN1cGVyLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMudXNlcnMuX2lkIH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH19KTtcblxuXHRcdFx0XHQvL0ltcG9ydCB0aGUgY2hhbm5lbHNcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19DSEFOTkVMUyk7XG5cdFx0XHRcdGZvciAoY29uc3QgYyBvZiB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzKSB7XG5cdFx0XHRcdFx0aWYgKCFjLmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGV4aXN0YW50Um9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoYy5uYW1lKTtcblx0XHRcdFx0XHRcdC8vSWYgdGhlIHJvb20gZXhpc3RzIG9yIHRoZSBuYW1lIG9mIGl0IGlzICdnZW5lcmFsJywgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBpdCBhZ2FpblxuXHRcdFx0XHRcdFx0aWYgKGV4aXN0YW50Um9vbSB8fCBjLm5hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0dFTkVSQUwnKSB7XG5cdFx0XHRcdFx0XHRcdGMucm9ja2V0SWQgPSBjLm5hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0dFTkVSQUwnID8gJ0dFTkVSQUwnIDogZXhpc3RhbnRSb29tLl9pZDtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHsgX2lkOiBjLnJvY2tldElkIH0sIHsgJGFkZFRvU2V0OiB7IGltcG9ydElkczogYy5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly9GaW5kIHRoZSByb2NrZXRjaGF0SWQgb2YgdGhlIHVzZXIgd2hvIGNyZWF0ZWQgdGhpcyBjaGFubmVsXG5cdFx0XHRcdFx0XHRcdGxldCBjcmVhdG9ySWQgPSBzdGFydGVkQnlVc2VySWQ7XG5cdFx0XHRcdFx0XHRcdGZvciAoY29uc3QgdSBvZiB0aGlzLnVzZXJzLnVzZXJzKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHUuaWQgPT09IGMuY3JlYXRvciAmJiB1LmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRvcklkID0gdS5yb2NrZXRJZDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvL0NyZWF0ZSB0aGUgY2hhbm5lbFxuXHRcdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKGNyZWF0b3JJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHJvb21JbmZvID0gTWV0ZW9yLmNhbGwoYy5pc1ByaXZhdGUgPyAnY3JlYXRlUHJpdmF0ZUdyb3VwJyA6ICdjcmVhdGVDaGFubmVsJywgYy5uYW1lLCBbXSk7XG5cdFx0XHRcdFx0XHRcdFx0Yy5yb2NrZXRJZCA9IHJvb21JbmZvLnJpZDtcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHsgX2lkOiBjLnJvY2tldElkIH0sIHsgJHNldDogeyB0czogYy5jcmVhdGVkLCB0b3BpYzogYy50b3BpYyB9LCAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiBjLmlkIH0gfSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN1cGVyLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMuY2hhbm5lbHMuX2lkIH0sIHsgJHNldDogeyAnY2hhbm5lbHMnOiB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzIH19KTtcblxuXHRcdFx0XHQvL0ltcG9ydCB0aGUgTWVzc2FnZXNcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19NRVNTQUdFUyk7XG5cdFx0XHRcdGZvciAoY29uc3QgW2NoLCBtZXNzYWdlc01hcF0gb2YgdGhpcy5tZXNzYWdlcy5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRjb25zdCBoaXBDaGFubmVsID0gdGhpcy5nZXRDaGFubmVsRnJvbVJvb21JZGVudGlmaWVyKGNoKTtcblx0XHRcdFx0XHRpZiAoIWhpcENoYW5uZWwuZG9faW1wb3J0KSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoaGlwQ2hhbm5lbC5yb2NrZXRJZCwgeyBmaWVsZHM6IHsgdXNlcm5hbWVzOiAxLCB0OiAxLCBuYW1lOiAxIH0gfSk7XG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgW21zZ0dyb3VwRGF0YSwgbXNnc10gb2YgbWVzc2FnZXNNYXAuZW50cmllcygpKSB7XG5cdFx0XHRcdFx0XHRcdHN1cGVyLnVwZGF0ZVJlY29yZCh7ICdtZXNzYWdlc3N0YXR1cyc6IGAkeyBjaCB9LyR7IG1zZ0dyb3VwRGF0YSB9LiR7IG1zZ3MubWVzc2FnZXMubGVuZ3RoIH1gIH0pO1xuXHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IG1zZyBvZiBtc2dzLm1lc3NhZ2VzKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGlzTmFOKG1zZy50cykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYFRpbWVzdGFtcCBvbiBhIG1lc3NhZ2UgaW4gJHsgY2ggfS8keyBtc2dHcm91cERhdGEgfSBpcyBpbnZhbGlkYCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRzdXBlci5hZGRDb3VudENvbXBsZXRlZCgxKTtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGNyZWF0b3IgPSB0aGlzLmdldFJvY2tldFVzZXJGcm9tVXNlcklkKG1zZy51c2VySWQpO1xuXHRcdFx0XHRcdFx0XHRcdGlmIChjcmVhdG9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKG1zZy50eXBlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgJ3VzZXInOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UoY3JlYXRvciwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0X2lkOiBtc2cuaWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0czogbXNnLnRzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnOiBtc2cudGV4dCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdF9pZDogY3JlYXRvci5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiBjcmVhdG9yLnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSwgcm9vbSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgJ3RvcGljJzpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX3RvcGljJywgcm9vbS5faWQsIG1zZy50ZXh0LCBjcmVhdG9yLCB7IF9pZDogbXNnLmlkLCB0czogbXNnLnRzIH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdHN1cGVyLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL0ltcG9ydCB0aGUgRGlyZWN0IE1lc3NhZ2VzXG5cdFx0XHRcdGZvciAoY29uc3QgW2RpcmVjdE1zZ1Jvb20sIGRpcmVjdE1lc3NhZ2VzTWFwXSBvZiB0aGlzLmRpcmVjdE1lc3NhZ2VzLmVudHJpZXMoKSkge1xuXHRcdFx0XHRcdGNvbnN0IGhpcFVzZXIgPSB0aGlzLmdldFVzZXJGcm9tRGlyZWN0TWVzc2FnZUlkZW50aWZpZXIoZGlyZWN0TXNnUm9vbSk7XG5cdFx0XHRcdFx0aWYgKCFoaXBVc2VyLmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly9WZXJpZnkgdGhpcyBkaXJlY3QgbWVzc2FnZSB1c2VyJ3Mgcm9vbSBpcyB2YWxpZCAoY29uZnVzaW5nIGJ1dCBpZGsgaG93IGVsc2UgdG8gZXhwbGFpbiBpdClcblx0XHRcdFx0XHRpZiAoIXRoaXMuZ2V0Um9ja2V0VXNlckZyb21Vc2VySWQoaGlwVXNlci5pZCkpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZvciAoY29uc3QgW21zZ0dyb3VwRGF0YSwgbXNnc10gb2YgZGlyZWN0TWVzc2FnZXNNYXAuZW50cmllcygpKSB7XG5cdFx0XHRcdFx0XHRzdXBlci51cGRhdGVSZWNvcmQoeyAnbWVzc2FnZXNzdGF0dXMnOiBgJHsgZGlyZWN0TXNnUm9vbSB9LyR7IG1zZ0dyb3VwRGF0YSB9LiR7IG1zZ3MubWVzc2FnZXMubGVuZ3RoIH1gIH0pO1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCBtc2cgb2YgbXNncy5tZXNzYWdlcykge1xuXHRcdFx0XHRcdFx0XHRpZiAoaXNOYU4obXNnLnRzKSkge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYFRpbWVzdGFtcCBvbiBhIG1lc3NhZ2UgaW4gJHsgZGlyZWN0TXNnUm9vbSB9LyR7IG1zZ0dyb3VwRGF0YSB9IGlzIGludmFsaWRgKTtcblx0XHRcdFx0XHRcdFx0XHRzdXBlci5hZGRDb3VudENvbXBsZXRlZCgxKTtcblx0XHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vbWFrZSBzdXJlIHRoZSBtZXNzYWdlIHNlbmRlciBpcyBhIHZhbGlkIHVzZXIgaW5zaWRlIHJvY2tldC5jaGF0XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHNlbmRlciA9IHRoaXMuZ2V0Um9ja2V0VXNlckZyb21Vc2VySWQobXNnLnNlbmRlcklkKTtcblx0XHRcdFx0XHRcdFx0aWYgKCFzZW5kZXIpIHtcblx0XHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vbWFrZSBzdXJlIHRoZSByZWNlaXZlciBvZiB0aGUgbWVzc2FnZSBpcyBhIHZhbGlkIHJvY2tldC5jaGF0IHVzZXJcblx0XHRcdFx0XHRcdFx0Y29uc3QgcmVjZWl2ZXIgPSB0aGlzLmdldFJvY2tldFVzZXJGcm9tVXNlcklkKG1zZy5yZWNlaXZlcklkKTtcblx0XHRcdFx0XHRcdFx0aWYgKCFyZWNlaXZlcikge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bGV0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChbcmVjZWl2ZXIuX2lkLCBzZW5kZXIuX2lkXS5zb3J0KCkuam9pbignJykpO1xuXHRcdFx0XHRcdFx0XHRpZiAoIXJvb20pIHtcblx0XHRcdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHNlbmRlci5faWQsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHJvb21JbmZvID0gTWV0ZW9yLmNhbGwoJ2NyZWF0ZURpcmVjdE1lc3NhZ2UnLCByZWNlaXZlci51c2VybmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUluZm8ucmlkKTtcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIoc2VuZGVyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2Uoc2VuZGVyLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRfaWQ6IG1zZy5pZCxcblx0XHRcdFx0XHRcdFx0XHRcdHRzOiBtc2cudHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRtc2c6IG1zZy50ZXh0LFxuXHRcdFx0XHRcdFx0XHRcdFx0cmlkOiByb29tLl9pZCxcblx0XHRcdFx0XHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0X2lkOiBzZW5kZXIuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogc2VuZGVyLnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSwgcm9vbSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5GSU5JU0hJTkcpO1xuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuRE9ORSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKGUpO1xuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuRVJST1IpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB0aW1lVG9vayA9IERhdGUubm93KCkgLSBzdGFydGVkO1xuXHRcdFx0dGhpcy5sb2dnZXIubG9nKGBIaXBDaGF0IEVudGVycHJpc2UgSW1wb3J0IHRvb2sgJHsgdGltZVRvb2sgfSBtaWxsaXNlY29uZHMuYCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gc3VwZXIuZ2V0UHJvZ3Jlc3MoKTtcblx0fVxuXG5cdGdldFNlbGVjdGlvbigpIHtcblx0XHRjb25zdCBzZWxlY3Rpb25Vc2VycyA9IHRoaXMudXNlcnMudXNlcnMubWFwKCh1KSA9PiBuZXcgU2VsZWN0aW9uVXNlcih1LmlkLCB1LnVzZXJuYW1lLCB1LmVtYWlsLCBmYWxzZSwgZmFsc2UsIHRydWUpKTtcblx0XHRjb25zdCBzZWxlY3Rpb25DaGFubmVscyA9IHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMubWFwKChjKSA9PiBuZXcgU2VsZWN0aW9uQ2hhbm5lbChjLmlkLCBjLm5hbWUsIGZhbHNlLCB0cnVlLCBjLmlzUHJpdmF0ZSkpO1xuXHRcdGNvbnN0IHNlbGVjdGlvbk1lc3NhZ2VzID0gdGhpcy5pbXBvcnRSZWNvcmQuY291bnQubWVzc2FnZXM7XG5cblx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvbih0aGlzLm5hbWUsIHNlbGVjdGlvblVzZXJzLCBzZWxlY3Rpb25DaGFubmVscywgc2VsZWN0aW9uTWVzc2FnZXMpO1xuXHR9XG5cblx0Z2V0Q2hhbm5lbEZyb21Sb29tSWRlbnRpZmllcihyb29tSWRlbnRpZmllcikge1xuXHRcdGZvciAoY29uc3QgY2ggb2YgdGhpcy5jaGFubmVscy5jaGFubmVscykge1xuXHRcdFx0aWYgKGByb29tcy8keyBjaC5pZCB9YCA9PT0gcm9vbUlkZW50aWZpZXIpIHtcblx0XHRcdFx0cmV0dXJuIGNoO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGdldFVzZXJGcm9tRGlyZWN0TWVzc2FnZUlkZW50aWZpZXIoZGlyZWN0SWRlbnRpZmllcikge1xuXHRcdGZvciAoY29uc3QgdSBvZiB0aGlzLnVzZXJzLnVzZXJzKSB7XG5cdFx0XHRpZiAoYHVzZXJzLyR7IHUuaWQgfWAgPT09IGRpcmVjdElkZW50aWZpZXIpIHtcblx0XHRcdFx0cmV0dXJuIHU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Z2V0Um9ja2V0VXNlckZyb21Vc2VySWQodXNlcklkKSB7XG5cdFx0Zm9yIChjb25zdCB1IG9mIHRoaXMudXNlcnMudXNlcnMpIHtcblx0XHRcdGlmICh1LmlkID09PSB1c2VySWQpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHUucm9ja2V0SWQsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH19KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IEltcG9ydGVycyB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcbmltcG9ydCB7IEhpcENoYXRFbnRlcnByaXNlSW1wb3J0ZXJJbmZvIH0gZnJvbSAnLi4vaW5mbyc7XG5pbXBvcnQgeyBIaXBDaGF0RW50ZXJwcmlzZUltcG9ydGVyIH0gZnJvbSAnLi9pbXBvcnRlcic7XG5cbkltcG9ydGVycy5hZGQobmV3IEhpcENoYXRFbnRlcnByaXNlSW1wb3J0ZXJJbmZvKCksIEhpcENoYXRFbnRlcnByaXNlSW1wb3J0ZXIpO1xuIl19
