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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:importer-csv":{"info.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer-csv/info.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CsvImporterInfo: () => CsvImporterInfo
});
let ImporterInfo;
module.watch(require("meteor/rocketchat:importer"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 0);

class CsvImporterInfo extends ImporterInfo {
  constructor() {
    super('csv', 'CSV', 'application/zip', [{
      text: 'Importer_CSV_Information',
      href: 'https://rocket.chat/docs/administrator-guides/import/csv/'
    }]);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"importer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer-csv/server/importer.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CsvImporter: () => CsvImporter
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

class CsvImporter extends Base {
  constructor(info) {
    super(info);
    this.csvParser = require('csv-parse/lib/sync');
    this.messages = new Map();
  }

  prepare(dataURI, sentContentType, fileName) {
    super.prepare(dataURI, sentContentType, fileName);
    const uriResult = RocketChatFile.dataURIParse(dataURI);
    const zip = new this.AdmZip(new Buffer(uriResult.image, 'base64'));
    const zipEntries = zip.getEntries();
    let tempChannels = [];
    let tempUsers = [];
    const tempMessages = new Map();

    for (const entry of zipEntries) {
      this.logger.debug(`Entry: ${entry.entryName}`); //Ignore anything that has `__MACOSX` in it's name, as sadly these things seem to mess everything up

      if (entry.entryName.indexOf('__MACOSX') > -1) {
        this.logger.debug(`Ignoring the file: ${entry.entryName}`);
        continue;
      } //Directories are ignored, since they are "virtual" in a zip file


      if (entry.isDirectory) {
        this.logger.debug(`Ignoring the directory entry: ${entry.entryName}`);
        continue;
      } //Parse the channels


      if (entry.entryName.toLowerCase() === 'channels.csv') {
        super.updateProgress(ProgressStep.PREPARING_CHANNELS);
        const parsedChannels = this.csvParser(entry.getData().toString());
        tempChannels = parsedChannels.map(c => {
          return {
            id: c[0].trim().replace('.', '_'),
            name: c[0].trim(),
            creator: c[1].trim(),
            isPrivate: c[2].trim().toLowerCase() === 'private' ? true : false,
            members: c[3].trim().split(';').map(m => m.trim())
          };
        });
        continue;
      } //Parse the users


      if (entry.entryName.toLowerCase() === 'users.csv') {
        super.updateProgress(ProgressStep.PREPARING_USERS);
        const parsedUsers = this.csvParser(entry.getData().toString());
        tempUsers = parsedUsers.map(u => {
          return {
            id: u[0].trim().replace('.', '_'),
            username: u[0].trim(),
            email: u[1].trim(),
            name: u[2].trim()
          };
        });
        continue;
      } //Parse the messages


      if (entry.entryName.indexOf('/') > -1) {
        const item = entry.entryName.split('/'); //random/messages.csv

        const channelName = item[0]; //random

        const msgGroupData = item[1].split('.')[0]; //2015-10-04

        if (!tempMessages.get(channelName)) {
          tempMessages.set(channelName, new Map());
        }

        let msgs = [];

        try {
          msgs = this.csvParser(entry.getData().toString());
        } catch (e) {
          this.logger.warn(`The file ${entry.entryName} contains invalid syntax`, e);
          continue;
        }

        tempMessages.get(channelName).set(msgGroupData, msgs.map(m => {
          return {
            username: m[0],
            ts: m[1],
            text: m[2]
          };
        }));
        continue;
      }
    } // Insert the users record, eventually this might have to be split into several ones as well
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
      'channels': tempChannels
    });
    this.channels = this.collection.findOne(channelsId);
    super.updateRecord({
      'count.channels': tempChannels.length
    });
    super.addCountToTotal(tempChannels.length); // Save the messages records to the import record for `startImport` usage

    super.updateProgress(ProgressStep.PREPARING_MESSAGES);
    let messagesCount = 0;

    for (const [channel, messagesMap] of tempMessages.entries()) {
      if (!this.messages.get(channel)) {
        this.messages.set(channel, new Map());
      }

      for (const [msgGroupData, msgs] of messagesMap.entries()) {
        messagesCount += msgs.length;
        super.updateRecord({
          'messagesstatus': `${channel}/${msgGroupData}`
        });

        if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
          Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
            const messagesId = this.collection.insert({
              'import': this.importRecord._id,
              'importer': this.name,
              'type': 'messages',
              'name': `${channel}/${msgGroupData}.${i}`,
              'messages': splitMsg
            });
            this.messages.get(channel).set(`${msgGroupData}.${i}`, this.collection.findOne(messagesId));
          });
        } else {
          const messagesId = this.collection.insert({
            'import': this.importRecord._id,
            'importer': this.name,
            'type': 'messages',
            'name': `${channel}/${msgGroupData}`,
            'messages': msgs
          });
          this.messages.get(channel).set(msgGroupData, this.collection.findOne(messagesId));
        }
      }
    }

    super.updateRecord({
      'count.messages': messagesCount,
      'messagesstatus': null
    });
    super.addCountToTotal(messagesCount); //Ensure we have at least a single user, channel, or message

    if (tempUsers.length === 0 && tempChannels.length === 0 && messagesCount === 0) {
      this.logger.error('No users, channels, or messages found in the import file.');
      super.updateProgress(ProgressStep.ERROR);
      return super.getProgress();
    }

    const selectionUsers = tempUsers.map(u => new SelectionUser(u.id, u.username, u.email, false, false, true));
    const selectionChannels = tempChannels.map(c => new SelectionChannel(c.id, c.name, false, true, c.isPrivate));
    const selectionMessages = this.importRecord.count.messages;
    super.updateProgress(ProgressStep.USER_SELECTION);
    return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
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
                });
                RocketChat.models.Users.setName(userId, u.name);
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
                if (u.username === c.creator && u.do_import) {
                  creatorId = u.rocketId;
                }
              } //Create the channel


              Meteor.runAsUser(creatorId, () => {
                const roomInfo = Meteor.call(c.isPrivate ? 'createPrivateGroup' : 'createChannel', c.name, c.members);
                c.rocketId = roomInfo.rid;
              });
              RocketChat.models.Rooms.update({
                _id: c.rocketId
              }, {
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
        }); //If no channels file, collect channel map from DB for message-only import

        if (this.channels.channels.length === 0) {
          for (const cname of this.messages.keys()) {
            Meteor.runAsUser(startedByUserId, () => {
              const existantRoom = RocketChat.models.Rooms.findOneByName(cname);

              if (existantRoom || cname.toUpperCase() === 'GENERAL') {
                this.channels.channels.push({
                  id: cname.replace('.', '_'),
                  name: cname,
                  rocketId: cname.toUpperCase() === 'GENERAL' ? 'GENERAL' : existantRoom._id,
                  do_import: true
                });
              }
            });
          }
        } //If no users file, collect user map from DB for message-only import


        if (this.users.users.length === 0) {
          for (const [ch, messagesMap] of this.messages.entries()) {
            const csvChannel = this.getChannelFromName(ch);

            if (!csvChannel || !csvChannel.do_import) {
              continue;
            }

            Meteor.runAsUser(startedByUserId, () => {
              for (const msgs of messagesMap.values()) {
                for (const msg of msgs.messages) {
                  if (!this.getUserFromUsername(msg.username)) {
                    const user = RocketChat.models.Users.findOneByUsername(msg.username);

                    if (user) {
                      this.users.users.push({
                        rocketId: user._id,
                        username: user.username
                      });
                    }
                  }
                }
              }
            });
          }
        } //Import the Messages


        super.updateProgress(ProgressStep.IMPORTING_MESSAGES);

        for (const [ch, messagesMap] of this.messages.entries()) {
          const csvChannel = this.getChannelFromName(ch);

          if (!csvChannel || !csvChannel.do_import) {
            continue;
          }

          const room = RocketChat.models.Rooms.findOneById(csvChannel.rocketId, {
            fields: {
              usernames: 1,
              t: 1,
              name: 1
            }
          });
          Meteor.runAsUser(startedByUserId, () => {
            const timestamps = {};

            for (const [msgGroupData, msgs] of messagesMap.entries()) {
              super.updateRecord({
                'messagesstatus': `${ch}/${msgGroupData}.${msgs.messages.length}`
              });

              for (const msg of msgs.messages) {
                if (isNaN(new Date(parseInt(msg.ts)))) {
                  this.logger.warn(`Timestamp on a message in ${ch}/${msgGroupData} is invalid`);
                  super.addCountCompleted(1);
                  continue;
                }

                const creator = this.getUserFromUsername(msg.username);

                if (creator) {
                  let suffix = '';

                  if (timestamps[msg.ts] === undefined) {
                    timestamps[msg.ts] = 1;
                  } else {
                    suffix = `-${timestamps[msg.ts]}`;
                    timestamps[msg.ts] += 1;
                  }

                  const msgObj = {
                    _id: `csv-${csvChannel.id}-${msg.ts}${suffix}`,
                    ts: new Date(parseInt(msg.ts)),
                    msg: msg.text,
                    rid: room._id,
                    u: {
                      _id: creator._id,
                      username: creator.username
                    }
                  };
                  RocketChat.sendMessage(creator, msgObj, room, true);
                }

                super.addCountCompleted(1);
              }
            }
          });
        }

        super.updateProgress(ProgressStep.FINISHING);
        super.updateProgress(ProgressStep.DONE);
      } catch (e) {
        this.logger.error(e);
        super.updateProgress(ProgressStep.ERROR);
      }

      const timeTook = Date.now() - started;
      this.logger.log(`CSV Import took ${timeTook} milliseconds.`);
    });
    return super.getProgress();
  }

  getSelection() {
    const selectionUsers = this.users.users.map(u => new SelectionUser(u.id, u.username, u.email, false, false, true));
    const selectionChannels = this.channels.channels.map(c => new SelectionChannel(c.id, c.name, false, true, c.isPrivate));
    const selectionMessages = this.importRecord.count.messages;
    return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
  }

  getChannelFromName(channelName) {
    for (const ch of this.channels.channels) {
      if (ch.name === channelName) {
        return ch;
      }
    }
  }

  getUserFromUsername(username) {
    for (const u of this.users.users) {
      if (u.username === username) {
        return RocketChat.models.Users.findOneById(u.rocketId, {
          fields: {
            username: 1
          }
        });
      }
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"adder.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_importer-csv/server/adder.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
let CsvImporterInfo;
module.watch(require("../info"), {
  CsvImporterInfo(v) {
    CsvImporterInfo = v;
  }

}, 1);
let CsvImporter;
module.watch(require("./importer"), {
  CsvImporter(v) {
    CsvImporter = v;
  }

}, 2);
Importers.add(new CsvImporterInfo(), CsvImporter);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:importer-csv/info.js");
require("/node_modules/meteor/rocketchat:importer-csv/server/importer.js");
require("/node_modules/meteor/rocketchat:importer-csv/server/adder.js");

/* Exports */
Package._define("rocketchat:importer-csv");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_importer-csv.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1jc3YvaW5mby5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1jc3Yvc2VydmVyL2ltcG9ydGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyLWNzdi9zZXJ2ZXIvYWRkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiQ3N2SW1wb3J0ZXJJbmZvIiwiSW1wb3J0ZXJJbmZvIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsImNvbnN0cnVjdG9yIiwidGV4dCIsImhyZWYiLCJDc3ZJbXBvcnRlciIsIkJhc2UiLCJQcm9ncmVzc1N0ZXAiLCJTZWxlY3Rpb24iLCJTZWxlY3Rpb25DaGFubmVsIiwiU2VsZWN0aW9uVXNlciIsImluZm8iLCJjc3ZQYXJzZXIiLCJtZXNzYWdlcyIsIk1hcCIsInByZXBhcmUiLCJkYXRhVVJJIiwic2VudENvbnRlbnRUeXBlIiwiZmlsZU5hbWUiLCJ1cmlSZXN1bHQiLCJSb2NrZXRDaGF0RmlsZSIsImRhdGFVUklQYXJzZSIsInppcCIsIkFkbVppcCIsIkJ1ZmZlciIsImltYWdlIiwiemlwRW50cmllcyIsImdldEVudHJpZXMiLCJ0ZW1wQ2hhbm5lbHMiLCJ0ZW1wVXNlcnMiLCJ0ZW1wTWVzc2FnZXMiLCJlbnRyeSIsImxvZ2dlciIsImRlYnVnIiwiZW50cnlOYW1lIiwiaW5kZXhPZiIsImlzRGlyZWN0b3J5IiwidG9Mb3dlckNhc2UiLCJ1cGRhdGVQcm9ncmVzcyIsIlBSRVBBUklOR19DSEFOTkVMUyIsInBhcnNlZENoYW5uZWxzIiwiZ2V0RGF0YSIsInRvU3RyaW5nIiwibWFwIiwiYyIsImlkIiwidHJpbSIsInJlcGxhY2UiLCJuYW1lIiwiY3JlYXRvciIsImlzUHJpdmF0ZSIsIm1lbWJlcnMiLCJzcGxpdCIsIm0iLCJQUkVQQVJJTkdfVVNFUlMiLCJwYXJzZWRVc2VycyIsInUiLCJ1c2VybmFtZSIsImVtYWlsIiwiaXRlbSIsImNoYW5uZWxOYW1lIiwibXNnR3JvdXBEYXRhIiwiZ2V0Iiwic2V0IiwibXNncyIsImUiLCJ3YXJuIiwidHMiLCJ1c2Vyc0lkIiwiY29sbGVjdGlvbiIsImluc2VydCIsImltcG9ydFJlY29yZCIsIl9pZCIsInVzZXJzIiwiZmluZE9uZSIsInVwZGF0ZVJlY29yZCIsImxlbmd0aCIsImFkZENvdW50VG9Ub3RhbCIsImNoYW5uZWxzSWQiLCJjaGFubmVscyIsIlBSRVBBUklOR19NRVNTQUdFUyIsIm1lc3NhZ2VzQ291bnQiLCJjaGFubmVsIiwibWVzc2FnZXNNYXAiLCJlbnRyaWVzIiwiZ2V0QlNPTlNpemUiLCJnZXRNYXhCU09OU2l6ZSIsImdldEJTT05TYWZlQXJyYXlzRnJvbUFuQXJyYXkiLCJmb3JFYWNoIiwic3BsaXRNc2ciLCJpIiwibWVzc2FnZXNJZCIsImVycm9yIiwiRVJST1IiLCJnZXRQcm9ncmVzcyIsInNlbGVjdGlvblVzZXJzIiwic2VsZWN0aW9uQ2hhbm5lbHMiLCJzZWxlY3Rpb25NZXNzYWdlcyIsImNvdW50IiwiVVNFUl9TRUxFQ1RJT04iLCJzdGFydEltcG9ydCIsImltcG9ydFNlbGVjdGlvbiIsInN0YXJ0ZWQiLCJEYXRlIiwibm93IiwidXNlciIsInVzZXJfaWQiLCJkb19pbXBvcnQiLCJ1cGRhdGUiLCIkc2V0IiwiY2hhbm5lbF9pZCIsInN0YXJ0ZWRCeVVzZXJJZCIsIk1ldGVvciIsInVzZXJJZCIsImRlZmVyIiwiSU1QT1JUSU5HX1VTRVJTIiwicnVuQXNVc2VyIiwiZXhpc3RhbnRVc2VyIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5RW1haWxBZGRyZXNzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJyb2NrZXRJZCIsIiRhZGRUb1NldCIsImltcG9ydElkcyIsIkFjY291bnRzIiwiY3JlYXRlVXNlciIsInBhc3N3b3JkIiwidG9VcHBlckNhc2UiLCJjYWxsIiwiam9pbkRlZmF1bHRDaGFubmVsc1NpbGVuY2VkIiwic2V0TmFtZSIsImFkZENvdW50Q29tcGxldGVkIiwiSU1QT1JUSU5HX0NIQU5ORUxTIiwiZXhpc3RhbnRSb29tIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwiY3JlYXRvcklkIiwicm9vbUluZm8iLCJyaWQiLCJjbmFtZSIsImtleXMiLCJwdXNoIiwiY2giLCJjc3ZDaGFubmVsIiwiZ2V0Q2hhbm5lbEZyb21OYW1lIiwidmFsdWVzIiwibXNnIiwiZ2V0VXNlckZyb21Vc2VybmFtZSIsIklNUE9SVElOR19NRVNTQUdFUyIsInJvb20iLCJmaW5kT25lQnlJZCIsImZpZWxkcyIsInVzZXJuYW1lcyIsInQiLCJ0aW1lc3RhbXBzIiwiaXNOYU4iLCJwYXJzZUludCIsInN1ZmZpeCIsInVuZGVmaW5lZCIsIm1zZ09iaiIsInNlbmRNZXNzYWdlIiwiRklOSVNISU5HIiwiRE9ORSIsInRpbWVUb29rIiwibG9nIiwiZ2V0U2VsZWN0aW9uIiwiSW1wb3J0ZXJzIiwiYWRkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxtQkFBZ0IsTUFBSUE7QUFBckIsQ0FBZDtBQUFxRCxJQUFJQyxZQUFKO0FBQWlCSCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDRixlQUFhRyxDQUFiLEVBQWU7QUFBQ0gsbUJBQWFHLENBQWI7QUFBZTs7QUFBaEMsQ0FBbkQsRUFBcUYsQ0FBckY7O0FBRS9ELE1BQU1KLGVBQU4sU0FBOEJDLFlBQTlCLENBQTJDO0FBQ2pESSxnQkFBYztBQUNiLFVBQU0sS0FBTixFQUFhLEtBQWIsRUFBb0IsaUJBQXBCLEVBQXVDLENBQUM7QUFDdkNDLFlBQU0sMEJBRGlDO0FBRXZDQyxZQUFNO0FBRmlDLEtBQUQsQ0FBdkM7QUFJQTs7QUFOZ0QsQzs7Ozs7Ozs7Ozs7QUNGbERULE9BQU9DLE1BQVAsQ0FBYztBQUFDUyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7QUFBNkMsSUFBSUMsSUFBSixFQUFTQyxZQUFULEVBQXNCQyxTQUF0QixFQUFnQ0MsZ0JBQWhDLEVBQWlEQyxhQUFqRDtBQUErRGYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ00sT0FBS0wsQ0FBTCxFQUFPO0FBQUNLLFdBQUtMLENBQUw7QUFBTyxHQUFoQjs7QUFBaUJNLGVBQWFOLENBQWIsRUFBZTtBQUFDTSxtQkFBYU4sQ0FBYjtBQUFlLEdBQWhEOztBQUFpRE8sWUFBVVAsQ0FBVixFQUFZO0FBQUNPLGdCQUFVUCxDQUFWO0FBQVksR0FBMUU7O0FBQTJFUSxtQkFBaUJSLENBQWpCLEVBQW1CO0FBQUNRLHVCQUFpQlIsQ0FBakI7QUFBbUIsR0FBbEg7O0FBQW1IUyxnQkFBY1QsQ0FBZCxFQUFnQjtBQUFDUyxvQkFBY1QsQ0FBZDtBQUFnQjs7QUFBcEosQ0FBbkQsRUFBeU0sQ0FBek07O0FBUXJHLE1BQU1JLFdBQU4sU0FBMEJDLElBQTFCLENBQStCO0FBQ3JDSixjQUFZUyxJQUFaLEVBQWtCO0FBQ2pCLFVBQU1BLElBQU47QUFFQSxTQUFLQyxTQUFMLEdBQWlCWixRQUFRLG9CQUFSLENBQWpCO0FBQ0EsU0FBS2EsUUFBTCxHQUFnQixJQUFJQyxHQUFKLEVBQWhCO0FBQ0E7O0FBRURDLFVBQVFDLE9BQVIsRUFBaUJDLGVBQWpCLEVBQWtDQyxRQUFsQyxFQUE0QztBQUMzQyxVQUFNSCxPQUFOLENBQWNDLE9BQWQsRUFBdUJDLGVBQXZCLEVBQXdDQyxRQUF4QztBQUVBLFVBQU1DLFlBQVlDLGVBQWVDLFlBQWYsQ0FBNEJMLE9BQTVCLENBQWxCO0FBQ0EsVUFBTU0sTUFBTSxJQUFJLEtBQUtDLE1BQVQsQ0FBZ0IsSUFBSUMsTUFBSixDQUFXTCxVQUFVTSxLQUFyQixFQUE0QixRQUE1QixDQUFoQixDQUFaO0FBQ0EsVUFBTUMsYUFBYUosSUFBSUssVUFBSixFQUFuQjtBQUVBLFFBQUlDLGVBQWUsRUFBbkI7QUFDQSxRQUFJQyxZQUFZLEVBQWhCO0FBQ0EsVUFBTUMsZUFBZSxJQUFJaEIsR0FBSixFQUFyQjs7QUFDQSxTQUFLLE1BQU1pQixLQUFYLElBQW9CTCxVQUFwQixFQUFnQztBQUMvQixXQUFLTSxNQUFMLENBQVlDLEtBQVosQ0FBbUIsVUFBVUYsTUFBTUcsU0FBVyxFQUE5QyxFQUQrQixDQUcvQjs7QUFDQSxVQUFJSCxNQUFNRyxTQUFOLENBQWdCQyxPQUFoQixDQUF3QixVQUF4QixJQUFzQyxDQUFDLENBQTNDLEVBQThDO0FBQzdDLGFBQUtILE1BQUwsQ0FBWUMsS0FBWixDQUFtQixzQkFBc0JGLE1BQU1HLFNBQVcsRUFBMUQ7QUFDQTtBQUNBLE9BUDhCLENBUy9COzs7QUFDQSxVQUFJSCxNQUFNSyxXQUFWLEVBQXVCO0FBQ3RCLGFBQUtKLE1BQUwsQ0FBWUMsS0FBWixDQUFtQixpQ0FBaUNGLE1BQU1HLFNBQVcsRUFBckU7QUFDQTtBQUNBLE9BYjhCLENBZS9COzs7QUFDQSxVQUFJSCxNQUFNRyxTQUFOLENBQWdCRyxXQUFoQixPQUFrQyxjQUF0QyxFQUFzRDtBQUNyRCxjQUFNQyxjQUFOLENBQXFCL0IsYUFBYWdDLGtCQUFsQztBQUNBLGNBQU1DLGlCQUFpQixLQUFLNUIsU0FBTCxDQUFlbUIsTUFBTVUsT0FBTixHQUFnQkMsUUFBaEIsRUFBZixDQUF2QjtBQUNBZCx1QkFBZVksZUFBZUcsR0FBZixDQUFvQkMsQ0FBRCxJQUFPO0FBQ3hDLGlCQUFPO0FBQ05DLGdCQUFJRCxFQUFFLENBQUYsRUFBS0UsSUFBTCxHQUFZQyxPQUFaLENBQW9CLEdBQXBCLEVBQXlCLEdBQXpCLENBREU7QUFFTkMsa0JBQU1KLEVBQUUsQ0FBRixFQUFLRSxJQUFMLEVBRkE7QUFHTkcscUJBQVNMLEVBQUUsQ0FBRixFQUFLRSxJQUFMLEVBSEg7QUFJTkksdUJBQVdOLEVBQUUsQ0FBRixFQUFLRSxJQUFMLEdBQVlULFdBQVosT0FBOEIsU0FBOUIsR0FBMEMsSUFBMUMsR0FBaUQsS0FKdEQ7QUFLTmMscUJBQVNQLEVBQUUsQ0FBRixFQUFLRSxJQUFMLEdBQVlNLEtBQVosQ0FBa0IsR0FBbEIsRUFBdUJULEdBQXZCLENBQTRCVSxDQUFELElBQU9BLEVBQUVQLElBQUYsRUFBbEM7QUFMSCxXQUFQO0FBT0EsU0FSYyxDQUFmO0FBU0E7QUFDQSxPQTdCOEIsQ0ErQi9COzs7QUFDQSxVQUFJZixNQUFNRyxTQUFOLENBQWdCRyxXQUFoQixPQUFrQyxXQUF0QyxFQUFtRDtBQUNsRCxjQUFNQyxjQUFOLENBQXFCL0IsYUFBYStDLGVBQWxDO0FBQ0EsY0FBTUMsY0FBYyxLQUFLM0MsU0FBTCxDQUFlbUIsTUFBTVUsT0FBTixHQUFnQkMsUUFBaEIsRUFBZixDQUFwQjtBQUNBYixvQkFBWTBCLFlBQVlaLEdBQVosQ0FBaUJhLENBQUQsSUFBTztBQUFFLGlCQUFPO0FBQUVYLGdCQUFJVyxFQUFFLENBQUYsRUFBS1YsSUFBTCxHQUFZQyxPQUFaLENBQW9CLEdBQXBCLEVBQXlCLEdBQXpCLENBQU47QUFBcUNVLHNCQUFVRCxFQUFFLENBQUYsRUFBS1YsSUFBTCxFQUEvQztBQUE0RFksbUJBQU9GLEVBQUUsQ0FBRixFQUFLVixJQUFMLEVBQW5FO0FBQWdGRSxrQkFBTVEsRUFBRSxDQUFGLEVBQUtWLElBQUw7QUFBdEYsV0FBUDtBQUE2RyxTQUF0SSxDQUFaO0FBQ0E7QUFDQSxPQXJDOEIsQ0F1Qy9COzs7QUFDQSxVQUFJZixNQUFNRyxTQUFOLENBQWdCQyxPQUFoQixDQUF3QixHQUF4QixJQUErQixDQUFDLENBQXBDLEVBQXVDO0FBQ3RDLGNBQU13QixPQUFPNUIsTUFBTUcsU0FBTixDQUFnQmtCLEtBQWhCLENBQXNCLEdBQXRCLENBQWIsQ0FEc0MsQ0FDRzs7QUFDekMsY0FBTVEsY0FBY0QsS0FBSyxDQUFMLENBQXBCLENBRnNDLENBRVQ7O0FBQzdCLGNBQU1FLGVBQWVGLEtBQUssQ0FBTCxFQUFRUCxLQUFSLENBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFyQixDQUhzQyxDQUdNOztBQUU1QyxZQUFJLENBQUN0QixhQUFhZ0MsR0FBYixDQUFpQkYsV0FBakIsQ0FBTCxFQUFvQztBQUNuQzlCLHVCQUFhaUMsR0FBYixDQUFpQkgsV0FBakIsRUFBOEIsSUFBSTlDLEdBQUosRUFBOUI7QUFDQTs7QUFFRCxZQUFJa0QsT0FBTyxFQUFYOztBQUVBLFlBQUk7QUFDSEEsaUJBQU8sS0FBS3BELFNBQUwsQ0FBZW1CLE1BQU1VLE9BQU4sR0FBZ0JDLFFBQWhCLEVBQWYsQ0FBUDtBQUNBLFNBRkQsQ0FFRSxPQUFPdUIsQ0FBUCxFQUFVO0FBQ1gsZUFBS2pDLE1BQUwsQ0FBWWtDLElBQVosQ0FBa0IsWUFBWW5DLE1BQU1HLFNBQVcsMEJBQS9DLEVBQTBFK0IsQ0FBMUU7QUFDQTtBQUNBOztBQUVEbkMscUJBQWFnQyxHQUFiLENBQWlCRixXQUFqQixFQUE4QkcsR0FBOUIsQ0FBa0NGLFlBQWxDLEVBQWdERyxLQUFLckIsR0FBTCxDQUFVVSxDQUFELElBQU87QUFBRSxpQkFBTztBQUFFSSxzQkFBVUosRUFBRSxDQUFGLENBQVo7QUFBa0JjLGdCQUFJZCxFQUFFLENBQUYsQ0FBdEI7QUFBNEJsRCxrQkFBTWtELEVBQUUsQ0FBRjtBQUFsQyxXQUFQO0FBQWtELFNBQXBFLENBQWhEO0FBQ0E7QUFDQTtBQUNELEtBdkUwQyxDQXlFM0M7QUFDQTs7O0FBQ0EsVUFBTWUsVUFBVSxLQUFLQyxVQUFMLENBQWdCQyxNQUFoQixDQUF1QjtBQUFFLGdCQUFVLEtBQUtDLFlBQUwsQ0FBa0JDLEdBQTlCO0FBQW1DLGtCQUFZLEtBQUt4QixJQUFwRDtBQUEwRCxjQUFRLE9BQWxFO0FBQTJFLGVBQVNuQjtBQUFwRixLQUF2QixDQUFoQjtBQUNBLFNBQUs0QyxLQUFMLEdBQWEsS0FBS0osVUFBTCxDQUFnQkssT0FBaEIsQ0FBd0JOLE9BQXhCLENBQWI7QUFDQSxVQUFNTyxZQUFOLENBQW1CO0FBQUUscUJBQWU5QyxVQUFVK0M7QUFBM0IsS0FBbkI7QUFDQSxVQUFNQyxlQUFOLENBQXNCaEQsVUFBVStDLE1BQWhDLEVBOUUyQyxDQWdGM0M7O0FBQ0EsVUFBTUUsYUFBYSxLQUFLVCxVQUFMLENBQWdCQyxNQUFoQixDQUF1QjtBQUFFLGdCQUFVLEtBQUtDLFlBQUwsQ0FBa0JDLEdBQTlCO0FBQW1DLGtCQUFZLEtBQUt4QixJQUFwRDtBQUEwRCxjQUFRLFVBQWxFO0FBQThFLGtCQUFZcEI7QUFBMUYsS0FBdkIsQ0FBbkI7QUFDQSxTQUFLbUQsUUFBTCxHQUFnQixLQUFLVixVQUFMLENBQWdCSyxPQUFoQixDQUF3QkksVUFBeEIsQ0FBaEI7QUFDQSxVQUFNSCxZQUFOLENBQW1CO0FBQUUsd0JBQWtCL0MsYUFBYWdEO0FBQWpDLEtBQW5CO0FBQ0EsVUFBTUMsZUFBTixDQUFzQmpELGFBQWFnRCxNQUFuQyxFQXBGMkMsQ0FzRjNDOztBQUNBLFVBQU10QyxjQUFOLENBQXFCL0IsYUFBYXlFLGtCQUFsQztBQUNBLFFBQUlDLGdCQUFnQixDQUFwQjs7QUFDQSxTQUFLLE1BQU0sQ0FBQ0MsT0FBRCxFQUFVQyxXQUFWLENBQVgsSUFBcUNyRCxhQUFhc0QsT0FBYixFQUFyQyxFQUE2RDtBQUM1RCxVQUFJLENBQUMsS0FBS3ZFLFFBQUwsQ0FBY2lELEdBQWQsQ0FBa0JvQixPQUFsQixDQUFMLEVBQWlDO0FBQ2hDLGFBQUtyRSxRQUFMLENBQWNrRCxHQUFkLENBQWtCbUIsT0FBbEIsRUFBMkIsSUFBSXBFLEdBQUosRUFBM0I7QUFDQTs7QUFFRCxXQUFLLE1BQU0sQ0FBQytDLFlBQUQsRUFBZUcsSUFBZixDQUFYLElBQW1DbUIsWUFBWUMsT0FBWixFQUFuQyxFQUEwRDtBQUN6REgseUJBQWlCakIsS0FBS1ksTUFBdEI7QUFDQSxjQUFNRCxZQUFOLENBQW1CO0FBQUUsNEJBQW1CLEdBQUdPLE9BQVMsSUFBSXJCLFlBQWM7QUFBbkQsU0FBbkI7O0FBRUEsWUFBSXZELEtBQUsrRSxXQUFMLENBQWlCckIsSUFBakIsSUFBeUIxRCxLQUFLZ0YsY0FBTCxFQUE3QixFQUFvRDtBQUNuRGhGLGVBQUtpRiw0QkFBTCxDQUFrQ3ZCLElBQWxDLEVBQXdDd0IsT0FBeEMsQ0FBZ0QsQ0FBQ0MsUUFBRCxFQUFXQyxDQUFYLEtBQWlCO0FBQ2hFLGtCQUFNQyxhQUFhLEtBQUt0QixVQUFMLENBQWdCQyxNQUFoQixDQUF1QjtBQUFFLHdCQUFVLEtBQUtDLFlBQUwsQ0FBa0JDLEdBQTlCO0FBQW1DLDBCQUFZLEtBQUt4QixJQUFwRDtBQUEwRCxzQkFBUSxVQUFsRTtBQUE4RSxzQkFBUyxHQUFHa0MsT0FBUyxJQUFJckIsWUFBYyxJQUFJNkIsQ0FBRyxFQUE1SDtBQUErSCwwQkFBWUQ7QUFBM0ksYUFBdkIsQ0FBbkI7QUFDQSxpQkFBSzVFLFFBQUwsQ0FBY2lELEdBQWQsQ0FBa0JvQixPQUFsQixFQUEyQm5CLEdBQTNCLENBQWdDLEdBQUdGLFlBQWMsSUFBSTZCLENBQUcsRUFBeEQsRUFBMkQsS0FBS3JCLFVBQUwsQ0FBZ0JLLE9BQWhCLENBQXdCaUIsVUFBeEIsQ0FBM0Q7QUFDQSxXQUhEO0FBSUEsU0FMRCxNQUtPO0FBQ04sZ0JBQU1BLGFBQWEsS0FBS3RCLFVBQUwsQ0FBZ0JDLE1BQWhCLENBQXVCO0FBQUUsc0JBQVUsS0FBS0MsWUFBTCxDQUFrQkMsR0FBOUI7QUFBbUMsd0JBQVksS0FBS3hCLElBQXBEO0FBQTBELG9CQUFRLFVBQWxFO0FBQThFLG9CQUFTLEdBQUdrQyxPQUFTLElBQUlyQixZQUFjLEVBQXJIO0FBQXdILHdCQUFZRztBQUFwSSxXQUF2QixDQUFuQjtBQUNBLGVBQUtuRCxRQUFMLENBQWNpRCxHQUFkLENBQWtCb0IsT0FBbEIsRUFBMkJuQixHQUEzQixDQUErQkYsWUFBL0IsRUFBNkMsS0FBS1EsVUFBTCxDQUFnQkssT0FBaEIsQ0FBd0JpQixVQUF4QixDQUE3QztBQUNBO0FBQ0Q7QUFDRDs7QUFFRCxVQUFNaEIsWUFBTixDQUFtQjtBQUFFLHdCQUFrQk0sYUFBcEI7QUFBbUMsd0JBQWtCO0FBQXJELEtBQW5CO0FBQ0EsVUFBTUosZUFBTixDQUFzQkksYUFBdEIsRUEvRzJDLENBaUgzQzs7QUFDQSxRQUFJcEQsVUFBVStDLE1BQVYsS0FBcUIsQ0FBckIsSUFBMEJoRCxhQUFhZ0QsTUFBYixLQUF3QixDQUFsRCxJQUF1REssa0JBQWtCLENBQTdFLEVBQWdGO0FBQy9FLFdBQUtqRCxNQUFMLENBQVk0RCxLQUFaLENBQWtCLDJEQUFsQjtBQUNBLFlBQU10RCxjQUFOLENBQXFCL0IsYUFBYXNGLEtBQWxDO0FBQ0EsYUFBTyxNQUFNQyxXQUFOLEVBQVA7QUFDQTs7QUFFRCxVQUFNQyxpQkFBaUJsRSxVQUFVYyxHQUFWLENBQWVhLENBQUQsSUFBTyxJQUFJOUMsYUFBSixDQUFrQjhDLEVBQUVYLEVBQXBCLEVBQXdCVyxFQUFFQyxRQUExQixFQUFvQ0QsRUFBRUUsS0FBdEMsRUFBNkMsS0FBN0MsRUFBb0QsS0FBcEQsRUFBMkQsSUFBM0QsQ0FBckIsQ0FBdkI7QUFDQSxVQUFNc0Msb0JBQW9CcEUsYUFBYWUsR0FBYixDQUFrQkMsQ0FBRCxJQUFPLElBQUluQyxnQkFBSixDQUFxQm1DLEVBQUVDLEVBQXZCLEVBQTJCRCxFQUFFSSxJQUE3QixFQUFtQyxLQUFuQyxFQUEwQyxJQUExQyxFQUFnREosRUFBRU0sU0FBbEQsQ0FBeEIsQ0FBMUI7QUFDQSxVQUFNK0Msb0JBQW9CLEtBQUsxQixZQUFMLENBQWtCMkIsS0FBbEIsQ0FBd0JyRixRQUFsRDtBQUVBLFVBQU15QixjQUFOLENBQXFCL0IsYUFBYTRGLGNBQWxDO0FBQ0EsV0FBTyxJQUFJM0YsU0FBSixDQUFjLEtBQUt3QyxJQUFuQixFQUF5QitDLGNBQXpCLEVBQXlDQyxpQkFBekMsRUFBNERDLGlCQUE1RCxDQUFQO0FBQ0E7O0FBRURHLGNBQVlDLGVBQVosRUFBNkI7QUFDNUIsVUFBTUQsV0FBTixDQUFrQkMsZUFBbEI7QUFDQSxVQUFNQyxVQUFVQyxLQUFLQyxHQUFMLEVBQWhCLENBRjRCLENBSTVCOztBQUNBLFNBQUssTUFBTUMsSUFBWCxJQUFtQkosZ0JBQWdCNUIsS0FBbkMsRUFBMEM7QUFDekMsV0FBSyxNQUFNakIsQ0FBWCxJQUFnQixLQUFLaUIsS0FBTCxDQUFXQSxLQUEzQixFQUFrQztBQUNqQyxZQUFJakIsRUFBRVgsRUFBRixLQUFTNEQsS0FBS0MsT0FBbEIsRUFBMkI7QUFDMUJsRCxZQUFFbUQsU0FBRixHQUFjRixLQUFLRSxTQUFuQjtBQUNBO0FBQ0Q7QUFDRDs7QUFDRCxTQUFLdEMsVUFBTCxDQUFnQnVDLE1BQWhCLENBQXVCO0FBQUVwQyxXQUFLLEtBQUtDLEtBQUwsQ0FBV0Q7QUFBbEIsS0FBdkIsRUFBZ0Q7QUFBRXFDLFlBQU07QUFBRSxpQkFBUyxLQUFLcEMsS0FBTCxDQUFXQTtBQUF0QjtBQUFSLEtBQWhELEVBWjRCLENBYzVCOztBQUNBLFNBQUssTUFBTVMsT0FBWCxJQUFzQm1CLGdCQUFnQnRCLFFBQXRDLEVBQWdEO0FBQy9DLFdBQUssTUFBTW5DLENBQVgsSUFBZ0IsS0FBS21DLFFBQUwsQ0FBY0EsUUFBOUIsRUFBd0M7QUFDdkMsWUFBSW5DLEVBQUVDLEVBQUYsS0FBU3FDLFFBQVE0QixVQUFyQixFQUFpQztBQUNoQ2xFLFlBQUUrRCxTQUFGLEdBQWN6QixRQUFReUIsU0FBdEI7QUFDQTtBQUNEO0FBQ0Q7O0FBQ0QsU0FBS3RDLFVBQUwsQ0FBZ0J1QyxNQUFoQixDQUF1QjtBQUFFcEMsV0FBSyxLQUFLTyxRQUFMLENBQWNQO0FBQXJCLEtBQXZCLEVBQW1EO0FBQUVxQyxZQUFNO0FBQUUsb0JBQVksS0FBSzlCLFFBQUwsQ0FBY0E7QUFBNUI7QUFBUixLQUFuRDtBQUVBLFVBQU1nQyxrQkFBa0JDLE9BQU9DLE1BQVAsRUFBeEI7QUFDQUQsV0FBT0UsS0FBUCxDQUFhLE1BQU07QUFDbEIsWUFBTTVFLGNBQU4sQ0FBcUIvQixhQUFhNEcsZUFBbEM7O0FBRUEsVUFBSTtBQUNIO0FBQ0EsYUFBSyxNQUFNM0QsQ0FBWCxJQUFnQixLQUFLaUIsS0FBTCxDQUFXQSxLQUEzQixFQUFrQztBQUNqQyxjQUFJLENBQUNqQixFQUFFbUQsU0FBUCxFQUFrQjtBQUNqQjtBQUNBOztBQUVESyxpQkFBT0ksU0FBUCxDQUFpQkwsZUFBakIsRUFBa0MsTUFBTTtBQUN2QyxnQkFBSU0sZUFBZUMsV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLHFCQUF4QixDQUE4Q2pFLEVBQUVFLEtBQWhELENBQW5CLENBRHVDLENBR3ZDOztBQUNBLGdCQUFJLENBQUMyRCxZQUFMLEVBQW1CO0FBQ2xCQSw2QkFBZUMsV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JFLGlCQUF4QixDQUEwQ2xFLEVBQUVDLFFBQTVDLENBQWY7QUFDQTs7QUFFRCxnQkFBSTRELFlBQUosRUFBa0I7QUFDakI7QUFDQTdELGdCQUFFbUUsUUFBRixHQUFhTixhQUFhN0MsR0FBMUI7QUFDQThDLHlCQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QlosTUFBeEIsQ0FBK0I7QUFBRXBDLHFCQUFLaEIsRUFBRW1FO0FBQVQsZUFBL0IsRUFBb0Q7QUFBRUMsMkJBQVc7QUFBRUMsNkJBQVdyRSxFQUFFWDtBQUFmO0FBQWIsZUFBcEQ7QUFDQSxhQUpELE1BSU87QUFDTixvQkFBTW9FLFNBQVNhLFNBQVNDLFVBQVQsQ0FBb0I7QUFBRXJFLHVCQUFPRixFQUFFRSxLQUFYO0FBQWtCc0UsMEJBQVV6QixLQUFLQyxHQUFMLEtBQWFoRCxFQUFFUixJQUFmLEdBQXNCUSxFQUFFRSxLQUFGLENBQVF1RSxXQUFSO0FBQWxELGVBQXBCLENBQWY7QUFDQWpCLHFCQUFPSSxTQUFQLENBQWlCSCxNQUFqQixFQUF5QixNQUFNO0FBQzlCRCx1QkFBT2tCLElBQVAsQ0FBWSxhQUFaLEVBQTJCMUUsRUFBRUMsUUFBN0IsRUFBdUM7QUFBQzBFLCtDQUE2QjtBQUE5QixpQkFBdkM7QUFDQWIsMkJBQVdDLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCWSxPQUF4QixDQUFnQ25CLE1BQWhDLEVBQXdDekQsRUFBRVIsSUFBMUM7QUFDQXNFLDJCQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QlosTUFBeEIsQ0FBK0I7QUFBRXBDLHVCQUFLeUM7QUFBUCxpQkFBL0IsRUFBZ0Q7QUFBRVcsNkJBQVc7QUFBRUMsK0JBQVdyRSxFQUFFWDtBQUFmO0FBQWIsaUJBQWhEO0FBQ0FXLGtCQUFFbUUsUUFBRixHQUFhVixNQUFiO0FBQ0EsZUFMRDtBQU1BOztBQUVELGtCQUFNb0IsaUJBQU4sQ0FBd0IsQ0FBeEI7QUFDQSxXQXZCRDtBQXdCQTs7QUFDRCxhQUFLaEUsVUFBTCxDQUFnQnVDLE1BQWhCLENBQXVCO0FBQUVwQyxlQUFLLEtBQUtDLEtBQUwsQ0FBV0Q7QUFBbEIsU0FBdkIsRUFBZ0Q7QUFBRXFDLGdCQUFNO0FBQUUscUJBQVMsS0FBS3BDLEtBQUwsQ0FBV0E7QUFBdEI7QUFBUixTQUFoRCxFQWhDRyxDQWtDSDs7QUFDQSxjQUFNbkMsY0FBTixDQUFxQi9CLGFBQWErSCxrQkFBbEM7O0FBQ0EsYUFBSyxNQUFNMUYsQ0FBWCxJQUFnQixLQUFLbUMsUUFBTCxDQUFjQSxRQUE5QixFQUF3QztBQUN2QyxjQUFJLENBQUNuQyxFQUFFK0QsU0FBUCxFQUFrQjtBQUNqQjtBQUNBOztBQUVESyxpQkFBT0ksU0FBUCxDQUFpQkwsZUFBakIsRUFBa0MsTUFBTTtBQUN2QyxrQkFBTXdCLGVBQWVqQixXQUFXQyxNQUFYLENBQWtCaUIsS0FBbEIsQ0FBd0JDLGFBQXhCLENBQXNDN0YsRUFBRUksSUFBeEMsQ0FBckIsQ0FEdUMsQ0FFdkM7O0FBQ0EsZ0JBQUl1RixnQkFBZ0IzRixFQUFFSSxJQUFGLENBQU9pRixXQUFQLE9BQXlCLFNBQTdDLEVBQXdEO0FBQ3ZEckYsZ0JBQUUrRSxRQUFGLEdBQWEvRSxFQUFFSSxJQUFGLENBQU9pRixXQUFQLE9BQXlCLFNBQXpCLEdBQXFDLFNBQXJDLEdBQWlETSxhQUFhL0QsR0FBM0U7QUFDQThDLHlCQUFXQyxNQUFYLENBQWtCaUIsS0FBbEIsQ0FBd0I1QixNQUF4QixDQUErQjtBQUFFcEMscUJBQUs1QixFQUFFK0U7QUFBVCxlQUEvQixFQUFvRDtBQUFFQywyQkFBVztBQUFFQyw2QkFBV2pGLEVBQUVDO0FBQWY7QUFBYixlQUFwRDtBQUNBLGFBSEQsTUFHTztBQUNOO0FBQ0Esa0JBQUk2RixZQUFZM0IsZUFBaEI7O0FBQ0EsbUJBQUssTUFBTXZELENBQVgsSUFBZ0IsS0FBS2lCLEtBQUwsQ0FBV0EsS0FBM0IsRUFBa0M7QUFDakMsb0JBQUlqQixFQUFFQyxRQUFGLEtBQWViLEVBQUVLLE9BQWpCLElBQTRCTyxFQUFFbUQsU0FBbEMsRUFBNkM7QUFDNUMrQiw4QkFBWWxGLEVBQUVtRSxRQUFkO0FBQ0E7QUFDRCxlQVBLLENBU047OztBQUNBWCxxQkFBT0ksU0FBUCxDQUFpQnNCLFNBQWpCLEVBQTRCLE1BQU07QUFDakMsc0JBQU1DLFdBQVczQixPQUFPa0IsSUFBUCxDQUFZdEYsRUFBRU0sU0FBRixHQUFjLG9CQUFkLEdBQXFDLGVBQWpELEVBQWtFTixFQUFFSSxJQUFwRSxFQUEwRUosRUFBRU8sT0FBNUUsQ0FBakI7QUFDQVAsa0JBQUUrRSxRQUFGLEdBQWFnQixTQUFTQyxHQUF0QjtBQUNBLGVBSEQ7QUFLQXRCLHlCQUFXQyxNQUFYLENBQWtCaUIsS0FBbEIsQ0FBd0I1QixNQUF4QixDQUErQjtBQUFFcEMscUJBQUs1QixFQUFFK0U7QUFBVCxlQUEvQixFQUFvRDtBQUFFQywyQkFBVztBQUFFQyw2QkFBV2pGLEVBQUVDO0FBQWY7QUFBYixlQUFwRDtBQUNBOztBQUVELGtCQUFNd0YsaUJBQU4sQ0FBd0IsQ0FBeEI7QUFDQSxXQXpCRDtBQTBCQTs7QUFDRCxhQUFLaEUsVUFBTCxDQUFnQnVDLE1BQWhCLENBQXVCO0FBQUVwQyxlQUFLLEtBQUtPLFFBQUwsQ0FBY1A7QUFBckIsU0FBdkIsRUFBbUQ7QUFBRXFDLGdCQUFNO0FBQUUsd0JBQVksS0FBSzlCLFFBQUwsQ0FBY0E7QUFBNUI7QUFBUixTQUFuRCxFQXBFRyxDQXNFSDs7QUFDQSxZQUFJLEtBQUtBLFFBQUwsQ0FBY0EsUUFBZCxDQUF1QkgsTUFBdkIsS0FBa0MsQ0FBdEMsRUFBeUM7QUFDeEMsZUFBSyxNQUFNaUUsS0FBWCxJQUFvQixLQUFLaEksUUFBTCxDQUFjaUksSUFBZCxFQUFwQixFQUEwQztBQUN6QzlCLG1CQUFPSSxTQUFQLENBQWlCTCxlQUFqQixFQUFrQyxNQUFNO0FBQ3ZDLG9CQUFNd0IsZUFBZWpCLFdBQVdDLE1BQVgsQ0FBa0JpQixLQUFsQixDQUF3QkMsYUFBeEIsQ0FBc0NJLEtBQXRDLENBQXJCOztBQUNBLGtCQUFJTixnQkFBZ0JNLE1BQU1aLFdBQU4sT0FBd0IsU0FBNUMsRUFBdUQ7QUFDdEQscUJBQUtsRCxRQUFMLENBQWNBLFFBQWQsQ0FBdUJnRSxJQUF2QixDQUE0QjtBQUMzQmxHLHNCQUFJZ0csTUFBTTlGLE9BQU4sQ0FBYyxHQUFkLEVBQW1CLEdBQW5CLENBRHVCO0FBRTNCQyx3QkFBTTZGLEtBRnFCO0FBRzNCbEIsNEJBQVdrQixNQUFNWixXQUFOLE9BQXdCLFNBQXhCLEdBQW9DLFNBQXBDLEdBQWdETSxhQUFhL0QsR0FIN0M7QUFJM0JtQyw2QkFBVztBQUpnQixpQkFBNUI7QUFNQTtBQUNELGFBVkQ7QUFXQTtBQUNELFNBckZFLENBdUZIOzs7QUFDQSxZQUFJLEtBQUtsQyxLQUFMLENBQVdBLEtBQVgsQ0FBaUJHLE1BQWpCLEtBQTRCLENBQWhDLEVBQW1DO0FBQ2xDLGVBQUssTUFBTSxDQUFDb0UsRUFBRCxFQUFLN0QsV0FBTCxDQUFYLElBQWdDLEtBQUt0RSxRQUFMLENBQWN1RSxPQUFkLEVBQWhDLEVBQXlEO0FBQ3hELGtCQUFNNkQsYUFBYSxLQUFLQyxrQkFBTCxDQUF3QkYsRUFBeEIsQ0FBbkI7O0FBQ0EsZ0JBQUksQ0FBQ0MsVUFBRCxJQUFlLENBQUNBLFdBQVd0QyxTQUEvQixFQUEwQztBQUN6QztBQUNBOztBQUNESyxtQkFBT0ksU0FBUCxDQUFpQkwsZUFBakIsRUFBa0MsTUFBTTtBQUN2QyxtQkFBSyxNQUFNL0MsSUFBWCxJQUFtQm1CLFlBQVlnRSxNQUFaLEVBQW5CLEVBQXlDO0FBQ3hDLHFCQUFLLE1BQU1DLEdBQVgsSUFBa0JwRixLQUFLbkQsUUFBdkIsRUFBaUM7QUFDaEMsc0JBQUksQ0FBQyxLQUFLd0ksbUJBQUwsQ0FBeUJELElBQUkzRixRQUE3QixDQUFMLEVBQTZDO0FBQzVDLDBCQUFNZ0QsT0FBT2EsV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JFLGlCQUF4QixDQUEwQzBCLElBQUkzRixRQUE5QyxDQUFiOztBQUNBLHdCQUFJZ0QsSUFBSixFQUFVO0FBQ1QsMkJBQUtoQyxLQUFMLENBQVdBLEtBQVgsQ0FBaUJzRSxJQUFqQixDQUFzQjtBQUNyQnBCLGtDQUFVbEIsS0FBS2pDLEdBRE07QUFFckJmLGtDQUFVZ0QsS0FBS2hEO0FBRk0sdUJBQXRCO0FBSUE7QUFDRDtBQUNEO0FBQ0Q7QUFDRCxhQWREO0FBZUE7QUFDRCxTQTlHRSxDQWdISDs7O0FBQ0EsY0FBTW5CLGNBQU4sQ0FBcUIvQixhQUFhK0ksa0JBQWxDOztBQUNBLGFBQUssTUFBTSxDQUFDTixFQUFELEVBQUs3RCxXQUFMLENBQVgsSUFBZ0MsS0FBS3RFLFFBQUwsQ0FBY3VFLE9BQWQsRUFBaEMsRUFBeUQ7QUFDeEQsZ0JBQU02RCxhQUFhLEtBQUtDLGtCQUFMLENBQXdCRixFQUF4QixDQUFuQjs7QUFDQSxjQUFJLENBQUNDLFVBQUQsSUFBZSxDQUFDQSxXQUFXdEMsU0FBL0IsRUFBMEM7QUFDekM7QUFDQTs7QUFFRCxnQkFBTTRDLE9BQU9qQyxXQUFXQyxNQUFYLENBQWtCaUIsS0FBbEIsQ0FBd0JnQixXQUF4QixDQUFvQ1AsV0FBV3RCLFFBQS9DLEVBQXlEO0FBQUU4QixvQkFBUTtBQUFFQyx5QkFBVyxDQUFiO0FBQWdCQyxpQkFBRyxDQUFuQjtBQUFzQjNHLG9CQUFNO0FBQTVCO0FBQVYsV0FBekQsQ0FBYjtBQUNBZ0UsaUJBQU9JLFNBQVAsQ0FBaUJMLGVBQWpCLEVBQWtDLE1BQU07QUFDdkMsa0JBQU02QyxhQUFhLEVBQW5COztBQUNBLGlCQUFLLE1BQU0sQ0FBQy9GLFlBQUQsRUFBZUcsSUFBZixDQUFYLElBQW1DbUIsWUFBWUMsT0FBWixFQUFuQyxFQUEwRDtBQUN6RCxvQkFBTVQsWUFBTixDQUFtQjtBQUFFLGtDQUFtQixHQUFHcUUsRUFBSSxJQUFJbkYsWUFBYyxJQUFJRyxLQUFLbkQsUUFBTCxDQUFjK0QsTUFBUTtBQUF4RSxlQUFuQjs7QUFDQSxtQkFBSyxNQUFNd0UsR0FBWCxJQUFrQnBGLEtBQUtuRCxRQUF2QixFQUFpQztBQUNoQyxvQkFBSWdKLE1BQU0sSUFBSXRELElBQUosQ0FBU3VELFNBQVNWLElBQUlqRixFQUFiLENBQVQsQ0FBTixDQUFKLEVBQXVDO0FBQ3RDLHVCQUFLbkMsTUFBTCxDQUFZa0MsSUFBWixDQUFrQiw2QkFBNkI4RSxFQUFJLElBQUluRixZQUFjLGFBQXJFO0FBQ0Esd0JBQU13RSxpQkFBTixDQUF3QixDQUF4QjtBQUNBO0FBQ0E7O0FBRUQsc0JBQU1wRixVQUFVLEtBQUtvRyxtQkFBTCxDQUF5QkQsSUFBSTNGLFFBQTdCLENBQWhCOztBQUNBLG9CQUFJUixPQUFKLEVBQWE7QUFDWixzQkFBSThHLFNBQVMsRUFBYjs7QUFDQSxzQkFBSUgsV0FBV1IsSUFBSWpGLEVBQWYsTUFBdUI2RixTQUEzQixFQUFzQztBQUNyQ0osK0JBQVdSLElBQUlqRixFQUFmLElBQXFCLENBQXJCO0FBQ0EsbUJBRkQsTUFFTztBQUNONEYsNkJBQVUsSUFBSUgsV0FBV1IsSUFBSWpGLEVBQWYsQ0FBb0IsRUFBbEM7QUFDQXlGLCtCQUFXUixJQUFJakYsRUFBZixLQUFzQixDQUF0QjtBQUNBOztBQUNELHdCQUFNOEYsU0FBUztBQUNkekYseUJBQU0sT0FBT3lFLFdBQVdwRyxFQUFJLElBQUl1RyxJQUFJakYsRUFBSSxHQUFHNEYsTUFBUSxFQURyQztBQUVkNUYsd0JBQUksSUFBSW9DLElBQUosQ0FBU3VELFNBQVNWLElBQUlqRixFQUFiLENBQVQsQ0FGVTtBQUdkaUYseUJBQUtBLElBQUlqSixJQUhLO0FBSWR5SSx5QkFBS1csS0FBSy9FLEdBSkk7QUFLZGhCLHVCQUFHO0FBQ0ZnQiwyQkFBS3ZCLFFBQVF1QixHQURYO0FBRUZmLGdDQUFVUixRQUFRUTtBQUZoQjtBQUxXLG1CQUFmO0FBV0E2RCw2QkFBVzRDLFdBQVgsQ0FBdUJqSCxPQUF2QixFQUFnQ2dILE1BQWhDLEVBQXdDVixJQUF4QyxFQUE4QyxJQUE5QztBQUNBOztBQUVELHNCQUFNbEIsaUJBQU4sQ0FBd0IsQ0FBeEI7QUFDQTtBQUNEO0FBQ0QsV0FyQ0Q7QUFzQ0E7O0FBRUQsY0FBTS9GLGNBQU4sQ0FBcUIvQixhQUFhNEosU0FBbEM7QUFDQSxjQUFNN0gsY0FBTixDQUFxQi9CLGFBQWE2SixJQUFsQztBQUNBLE9BbktELENBbUtFLE9BQU9uRyxDQUFQLEVBQVU7QUFDWCxhQUFLakMsTUFBTCxDQUFZNEQsS0FBWixDQUFrQjNCLENBQWxCO0FBQ0EsY0FBTTNCLGNBQU4sQ0FBcUIvQixhQUFhc0YsS0FBbEM7QUFDQTs7QUFFRCxZQUFNd0UsV0FBVzlELEtBQUtDLEdBQUwsS0FBYUYsT0FBOUI7QUFDQSxXQUFLdEUsTUFBTCxDQUFZc0ksR0FBWixDQUFpQixtQkFBbUJELFFBQVUsZ0JBQTlDO0FBQ0EsS0E3S0Q7QUErS0EsV0FBTyxNQUFNdkUsV0FBTixFQUFQO0FBQ0E7O0FBRUR5RSxpQkFBZTtBQUNkLFVBQU14RSxpQkFBaUIsS0FBS3RCLEtBQUwsQ0FBV0EsS0FBWCxDQUFpQjlCLEdBQWpCLENBQXNCYSxDQUFELElBQU8sSUFBSTlDLGFBQUosQ0FBa0I4QyxFQUFFWCxFQUFwQixFQUF3QlcsRUFBRUMsUUFBMUIsRUFBb0NELEVBQUVFLEtBQXRDLEVBQTZDLEtBQTdDLEVBQW9ELEtBQXBELEVBQTJELElBQTNELENBQTVCLENBQXZCO0FBQ0EsVUFBTXNDLG9CQUFvQixLQUFLakIsUUFBTCxDQUFjQSxRQUFkLENBQXVCcEMsR0FBdkIsQ0FBNEJDLENBQUQsSUFBTyxJQUFJbkMsZ0JBQUosQ0FBcUJtQyxFQUFFQyxFQUF2QixFQUEyQkQsRUFBRUksSUFBN0IsRUFBbUMsS0FBbkMsRUFBMEMsSUFBMUMsRUFBZ0RKLEVBQUVNLFNBQWxELENBQWxDLENBQTFCO0FBQ0EsVUFBTStDLG9CQUFvQixLQUFLMUIsWUFBTCxDQUFrQjJCLEtBQWxCLENBQXdCckYsUUFBbEQ7QUFFQSxXQUFPLElBQUlMLFNBQUosQ0FBYyxLQUFLd0MsSUFBbkIsRUFBeUIrQyxjQUF6QixFQUF5Q0MsaUJBQXpDLEVBQTREQyxpQkFBNUQsQ0FBUDtBQUNBOztBQUVEaUQscUJBQW1CdEYsV0FBbkIsRUFBZ0M7QUFDL0IsU0FBSyxNQUFNb0YsRUFBWCxJQUFpQixLQUFLakUsUUFBTCxDQUFjQSxRQUEvQixFQUF5QztBQUN4QyxVQUFJaUUsR0FBR2hHLElBQUgsS0FBWVksV0FBaEIsRUFBNkI7QUFDNUIsZUFBT29GLEVBQVA7QUFDQTtBQUNEO0FBQ0Q7O0FBRURLLHNCQUFvQjVGLFFBQXBCLEVBQThCO0FBQzdCLFNBQUssTUFBTUQsQ0FBWCxJQUFnQixLQUFLaUIsS0FBTCxDQUFXQSxLQUEzQixFQUFrQztBQUNqQyxVQUFJakIsRUFBRUMsUUFBRixLQUFlQSxRQUFuQixFQUE2QjtBQUM1QixlQUFPNkQsV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JnQyxXQUF4QixDQUFvQ2hHLEVBQUVtRSxRQUF0QyxFQUFnRDtBQUFFOEIsa0JBQVE7QUFBRWhHLHNCQUFVO0FBQVo7QUFBVixTQUFoRCxDQUFQO0FBQ0E7QUFDRDtBQUNEOztBQXpXb0MsQzs7Ozs7Ozs7Ozs7QUNSdEMsSUFBSStHLFNBQUo7QUFBYzdLLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUN3SyxZQUFVdkssQ0FBVixFQUFZO0FBQUN1SyxnQkFBVXZLLENBQVY7QUFBWTs7QUFBMUIsQ0FBbkQsRUFBK0UsQ0FBL0U7QUFBa0YsSUFBSUosZUFBSjtBQUFvQkYsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLFNBQVIsQ0FBYixFQUFnQztBQUFDSCxrQkFBZ0JJLENBQWhCLEVBQWtCO0FBQUNKLHNCQUFnQkksQ0FBaEI7QUFBa0I7O0FBQXRDLENBQWhDLEVBQXdFLENBQXhFO0FBQTJFLElBQUlJLFdBQUo7QUFBZ0JWLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0ssY0FBWUosQ0FBWixFQUFjO0FBQUNJLGtCQUFZSixDQUFaO0FBQWM7O0FBQTlCLENBQW5DLEVBQW1FLENBQW5FO0FBSS9NdUssVUFBVUMsR0FBVixDQUFjLElBQUk1SyxlQUFKLEVBQWQsRUFBcUNRLFdBQXJDLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfaW1wb3J0ZXItY3N2LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW1wb3J0ZXJJbmZvIH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuXG5leHBvcnQgY2xhc3MgQ3N2SW1wb3J0ZXJJbmZvIGV4dGVuZHMgSW1wb3J0ZXJJbmZvIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2NzdicsICdDU1YnLCAnYXBwbGljYXRpb24vemlwJywgW3tcblx0XHRcdHRleHQ6ICdJbXBvcnRlcl9DU1ZfSW5mb3JtYXRpb24nLFxuXHRcdFx0aHJlZjogJ2h0dHBzOi8vcm9ja2V0LmNoYXQvZG9jcy9hZG1pbmlzdHJhdG9yLWd1aWRlcy9pbXBvcnQvY3N2Lydcblx0XHR9XSk7XG5cdH1cbn1cbiIsImltcG9ydCB7XG5cdEJhc2UsXG5cdFByb2dyZXNzU3RlcCxcblx0U2VsZWN0aW9uLFxuXHRTZWxlY3Rpb25DaGFubmVsLFxuXHRTZWxlY3Rpb25Vc2VyXG59IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcblxuZXhwb3J0IGNsYXNzIENzdkltcG9ydGVyIGV4dGVuZHMgQmFzZSB7XG5cdGNvbnN0cnVjdG9yKGluZm8pIHtcblx0XHRzdXBlcihpbmZvKTtcblxuXHRcdHRoaXMuY3N2UGFyc2VyID0gcmVxdWlyZSgnY3N2LXBhcnNlL2xpYi9zeW5jJyk7XG5cdFx0dGhpcy5tZXNzYWdlcyA9IG5ldyBNYXAoKTtcblx0fVxuXG5cdHByZXBhcmUoZGF0YVVSSSwgc2VudENvbnRlbnRUeXBlLCBmaWxlTmFtZSkge1xuXHRcdHN1cGVyLnByZXBhcmUoZGF0YVVSSSwgc2VudENvbnRlbnRUeXBlLCBmaWxlTmFtZSk7XG5cblx0XHRjb25zdCB1cmlSZXN1bHQgPSBSb2NrZXRDaGF0RmlsZS5kYXRhVVJJUGFyc2UoZGF0YVVSSSk7XG5cdFx0Y29uc3QgemlwID0gbmV3IHRoaXMuQWRtWmlwKG5ldyBCdWZmZXIodXJpUmVzdWx0LmltYWdlLCAnYmFzZTY0JykpO1xuXHRcdGNvbnN0IHppcEVudHJpZXMgPSB6aXAuZ2V0RW50cmllcygpO1xuXG5cdFx0bGV0IHRlbXBDaGFubmVscyA9IFtdO1xuXHRcdGxldCB0ZW1wVXNlcnMgPSBbXTtcblx0XHRjb25zdCB0ZW1wTWVzc2FnZXMgPSBuZXcgTWFwKCk7XG5cdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB6aXBFbnRyaWVzKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgRW50cnk6ICR7IGVudHJ5LmVudHJ5TmFtZSB9YCk7XG5cblx0XHRcdC8vSWdub3JlIGFueXRoaW5nIHRoYXQgaGFzIGBfX01BQ09TWGAgaW4gaXQncyBuYW1lLCBhcyBzYWRseSB0aGVzZSB0aGluZ3Mgc2VlbSB0byBtZXNzIGV2ZXJ5dGhpbmcgdXBcblx0XHRcdGlmIChlbnRyeS5lbnRyeU5hbWUuaW5kZXhPZignX19NQUNPU1gnKSA+IC0xKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmRlYnVnKGBJZ25vcmluZyB0aGUgZmlsZTogJHsgZW50cnkuZW50cnlOYW1lIH1gKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vRGlyZWN0b3JpZXMgYXJlIGlnbm9yZWQsIHNpbmNlIHRoZXkgYXJlIFwidmlydHVhbFwiIGluIGEgemlwIGZpbGVcblx0XHRcdGlmIChlbnRyeS5pc0RpcmVjdG9yeSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgSWdub3JpbmcgdGhlIGRpcmVjdG9yeSBlbnRyeTogJHsgZW50cnkuZW50cnlOYW1lIH1gKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vUGFyc2UgdGhlIGNoYW5uZWxzXG5cdFx0XHRpZiAoZW50cnkuZW50cnlOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdjaGFubmVscy5jc3YnKSB7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfQ0hBTk5FTFMpO1xuXHRcdFx0XHRjb25zdCBwYXJzZWRDaGFubmVscyA9IHRoaXMuY3N2UGFyc2VyKGVudHJ5LmdldERhdGEoKS50b1N0cmluZygpKTtcblx0XHRcdFx0dGVtcENoYW5uZWxzID0gcGFyc2VkQ2hhbm5lbHMubWFwKChjKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGlkOiBjWzBdLnRyaW0oKS5yZXBsYWNlKCcuJywgJ18nKSxcblx0XHRcdFx0XHRcdG5hbWU6IGNbMF0udHJpbSgpLFxuXHRcdFx0XHRcdFx0Y3JlYXRvcjogY1sxXS50cmltKCksXG5cdFx0XHRcdFx0XHRpc1ByaXZhdGU6IGNbMl0udHJpbSgpLnRvTG93ZXJDYXNlKCkgPT09ICdwcml2YXRlJyA/IHRydWUgOiBmYWxzZSxcblx0XHRcdFx0XHRcdG1lbWJlcnM6IGNbM10udHJpbSgpLnNwbGl0KCc7JykubWFwKChtKSA9PiBtLnRyaW0oKSlcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vUGFyc2UgdGhlIHVzZXJzXG5cdFx0XHRpZiAoZW50cnkuZW50cnlOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICd1c2Vycy5jc3YnKSB7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfVVNFUlMpO1xuXHRcdFx0XHRjb25zdCBwYXJzZWRVc2VycyA9IHRoaXMuY3N2UGFyc2VyKGVudHJ5LmdldERhdGEoKS50b1N0cmluZygpKTtcblx0XHRcdFx0dGVtcFVzZXJzID0gcGFyc2VkVXNlcnMubWFwKCh1KSA9PiB7IHJldHVybiB7IGlkOiB1WzBdLnRyaW0oKS5yZXBsYWNlKCcuJywgJ18nKSwgdXNlcm5hbWU6IHVbMF0udHJpbSgpLCBlbWFpbDogdVsxXS50cmltKCksIG5hbWU6IHVbMl0udHJpbSgpIH07IH0pO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly9QYXJzZSB0aGUgbWVzc2FnZXNcblx0XHRcdGlmIChlbnRyeS5lbnRyeU5hbWUuaW5kZXhPZignLycpID4gLTEpIHtcblx0XHRcdFx0Y29uc3QgaXRlbSA9IGVudHJ5LmVudHJ5TmFtZS5zcGxpdCgnLycpOyAvL3JhbmRvbS9tZXNzYWdlcy5jc3Zcblx0XHRcdFx0Y29uc3QgY2hhbm5lbE5hbWUgPSBpdGVtWzBdOyAvL3JhbmRvbVxuXHRcdFx0XHRjb25zdCBtc2dHcm91cERhdGEgPSBpdGVtWzFdLnNwbGl0KCcuJylbMF07IC8vMjAxNS0xMC0wNFxuXG5cdFx0XHRcdGlmICghdGVtcE1lc3NhZ2VzLmdldChjaGFubmVsTmFtZSkpIHtcblx0XHRcdFx0XHR0ZW1wTWVzc2FnZXMuc2V0KGNoYW5uZWxOYW1lLCBuZXcgTWFwKCkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IG1zZ3MgPSBbXTtcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdG1zZ3MgPSB0aGlzLmNzdlBhcnNlcihlbnRyeS5nZXREYXRhKCkudG9TdHJpbmcoKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBUaGUgZmlsZSAkeyBlbnRyeS5lbnRyeU5hbWUgfSBjb250YWlucyBpbnZhbGlkIHN5bnRheGAsIGUpO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGVtcE1lc3NhZ2VzLmdldChjaGFubmVsTmFtZSkuc2V0KG1zZ0dyb3VwRGF0YSwgbXNncy5tYXAoKG0pID0+IHsgcmV0dXJuIHsgdXNlcm5hbWU6IG1bMF0sIHRzOiBtWzFdLCB0ZXh0OiBtWzJdIH07IH0pKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSW5zZXJ0IHRoZSB1c2VycyByZWNvcmQsIGV2ZW50dWFsbHkgdGhpcyBtaWdodCBoYXZlIHRvIGJlIHNwbGl0IGludG8gc2V2ZXJhbCBvbmVzIGFzIHdlbGxcblx0XHQvLyBpZiBzb21lb25lIHRyaWVzIHRvIGltcG9ydCBhIHNldmVyYWwgdGhvdXNhbmRzIHVzZXJzIGluc3RhbmNlXG5cdFx0Y29uc3QgdXNlcnNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ3VzZXJzJywgJ3VzZXJzJzogdGVtcFVzZXJzIH0pO1xuXHRcdHRoaXMudXNlcnMgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZSh1c2Vyc0lkKTtcblx0XHRzdXBlci51cGRhdGVSZWNvcmQoeyAnY291bnQudXNlcnMnOiB0ZW1wVXNlcnMubGVuZ3RoIH0pO1xuXHRcdHN1cGVyLmFkZENvdW50VG9Ub3RhbCh0ZW1wVXNlcnMubGVuZ3RoKTtcblxuXHRcdC8vIEluc2VydCB0aGUgY2hhbm5lbHMgcmVjb3Jkcy5cblx0XHRjb25zdCBjaGFubmVsc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAnY2hhbm5lbHMnLCAnY2hhbm5lbHMnOiB0ZW1wQ2hhbm5lbHMgfSk7XG5cdFx0dGhpcy5jaGFubmVscyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKGNoYW5uZWxzSWQpO1xuXHRcdHN1cGVyLnVwZGF0ZVJlY29yZCh7ICdjb3VudC5jaGFubmVscyc6IHRlbXBDaGFubmVscy5sZW5ndGggfSk7XG5cdFx0c3VwZXIuYWRkQ291bnRUb1RvdGFsKHRlbXBDaGFubmVscy5sZW5ndGgpO1xuXG5cdFx0Ly8gU2F2ZSB0aGUgbWVzc2FnZXMgcmVjb3JkcyB0byB0aGUgaW1wb3J0IHJlY29yZCBmb3IgYHN0YXJ0SW1wb3J0YCB1c2FnZVxuXHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfTUVTU0FHRVMpO1xuXHRcdGxldCBtZXNzYWdlc0NvdW50ID0gMDtcblx0XHRmb3IgKGNvbnN0IFtjaGFubmVsLCBtZXNzYWdlc01hcF0gb2YgdGVtcE1lc3NhZ2VzLmVudHJpZXMoKSkge1xuXHRcdFx0aWYgKCF0aGlzLm1lc3NhZ2VzLmdldChjaGFubmVsKSkge1xuXHRcdFx0XHR0aGlzLm1lc3NhZ2VzLnNldChjaGFubmVsLCBuZXcgTWFwKCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGNvbnN0IFttc2dHcm91cERhdGEsIG1zZ3NdIG9mIG1lc3NhZ2VzTWFwLmVudHJpZXMoKSkge1xuXHRcdFx0XHRtZXNzYWdlc0NvdW50ICs9IG1zZ3MubGVuZ3RoO1xuXHRcdFx0XHRzdXBlci51cGRhdGVSZWNvcmQoeyAnbWVzc2FnZXNzdGF0dXMnOiBgJHsgY2hhbm5lbCB9LyR7IG1zZ0dyb3VwRGF0YSB9YCB9KTtcblxuXHRcdFx0XHRpZiAoQmFzZS5nZXRCU09OU2l6ZShtc2dzKSA+IEJhc2UuZ2V0TWF4QlNPTlNpemUoKSkge1xuXHRcdFx0XHRcdEJhc2UuZ2V0QlNPTlNhZmVBcnJheXNGcm9tQW5BcnJheShtc2dzKS5mb3JFYWNoKChzcGxpdE1zZywgaSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgbWVzc2FnZXNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ21lc3NhZ2VzJywgJ25hbWUnOiBgJHsgY2hhbm5lbCB9LyR7IG1zZ0dyb3VwRGF0YSB9LiR7IGkgfWAsICdtZXNzYWdlcyc6IHNwbGl0TXNnIH0pO1xuXHRcdFx0XHRcdFx0dGhpcy5tZXNzYWdlcy5nZXQoY2hhbm5lbCkuc2V0KGAkeyBtc2dHcm91cERhdGEgfS4keyBpIH1gLCB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShtZXNzYWdlc0lkKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgbWVzc2FnZXNJZCA9IHRoaXMuY29sbGVjdGlvbi5pbnNlcnQoeyAnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLCAnaW1wb3J0ZXInOiB0aGlzLm5hbWUsICd0eXBlJzogJ21lc3NhZ2VzJywgJ25hbWUnOiBgJHsgY2hhbm5lbCB9LyR7IG1zZ0dyb3VwRGF0YSB9YCwgJ21lc3NhZ2VzJzogbXNncyB9KTtcblx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzLmdldChjaGFubmVsKS5zZXQobXNnR3JvdXBEYXRhLCB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShtZXNzYWdlc0lkKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRzdXBlci51cGRhdGVSZWNvcmQoeyAnY291bnQubWVzc2FnZXMnOiBtZXNzYWdlc0NvdW50LCAnbWVzc2FnZXNzdGF0dXMnOiBudWxsIH0pO1xuXHRcdHN1cGVyLmFkZENvdW50VG9Ub3RhbChtZXNzYWdlc0NvdW50KTtcblxuXHRcdC8vRW5zdXJlIHdlIGhhdmUgYXQgbGVhc3QgYSBzaW5nbGUgdXNlciwgY2hhbm5lbCwgb3IgbWVzc2FnZVxuXHRcdGlmICh0ZW1wVXNlcnMubGVuZ3RoID09PSAwICYmIHRlbXBDaGFubmVscy5sZW5ndGggPT09IDAgJiYgbWVzc2FnZXNDb3VudCA9PT0gMCkge1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoJ05vIHVzZXJzLCBjaGFubmVscywgb3IgbWVzc2FnZXMgZm91bmQgaW4gdGhlIGltcG9ydCBmaWxlLicpO1xuXHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkVSUk9SKTtcblx0XHRcdHJldHVybiBzdXBlci5nZXRQcm9ncmVzcygpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlbGVjdGlvblVzZXJzID0gdGVtcFVzZXJzLm1hcCgodSkgPT4gbmV3IFNlbGVjdGlvblVzZXIodS5pZCwgdS51c2VybmFtZSwgdS5lbWFpbCwgZmFsc2UsIGZhbHNlLCB0cnVlKSk7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uQ2hhbm5lbHMgPSB0ZW1wQ2hhbm5lbHMubWFwKChjKSA9PiBuZXcgU2VsZWN0aW9uQ2hhbm5lbChjLmlkLCBjLm5hbWUsIGZhbHNlLCB0cnVlLCBjLmlzUHJpdmF0ZSkpO1xuXHRcdGNvbnN0IHNlbGVjdGlvbk1lc3NhZ2VzID0gdGhpcy5pbXBvcnRSZWNvcmQuY291bnQubWVzc2FnZXM7XG5cblx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuVVNFUl9TRUxFQ1RJT04pO1xuXHRcdHJldHVybiBuZXcgU2VsZWN0aW9uKHRoaXMubmFtZSwgc2VsZWN0aW9uVXNlcnMsIHNlbGVjdGlvbkNoYW5uZWxzLCBzZWxlY3Rpb25NZXNzYWdlcyk7XG5cdH1cblxuXHRzdGFydEltcG9ydChpbXBvcnRTZWxlY3Rpb24pIHtcblx0XHRzdXBlci5zdGFydEltcG9ydChpbXBvcnRTZWxlY3Rpb24pO1xuXHRcdGNvbnN0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuXG5cdFx0Ly9FbnN1cmUgd2UncmUgb25seSBnb2luZyB0byBpbXBvcnQgdGhlIHVzZXJzIHRoYXQgdGhlIHVzZXIgaGFzIHNlbGVjdGVkXG5cdFx0Zm9yIChjb25zdCB1c2VyIG9mIGltcG9ydFNlbGVjdGlvbi51c2Vycykge1xuXHRcdFx0Zm9yIChjb25zdCB1IG9mIHRoaXMudXNlcnMudXNlcnMpIHtcblx0XHRcdFx0aWYgKHUuaWQgPT09IHVzZXIudXNlcl9pZCkge1xuXHRcdFx0XHRcdHUuZG9faW1wb3J0ID0gdXNlci5kb19pbXBvcnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5jb2xsZWN0aW9uLnVwZGF0ZSh7IF9pZDogdGhpcy51c2Vycy5faWQgfSwgeyAkc2V0OiB7ICd1c2Vycyc6IHRoaXMudXNlcnMudXNlcnMgfX0pO1xuXG5cdFx0Ly9FbnN1cmUgd2UncmUgb25seSBpbXBvcnRpbmcgdGhlIGNoYW5uZWxzIHRoZSB1c2VyIGhhcyBzZWxlY3RlZC5cblx0XHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgaW1wb3J0U2VsZWN0aW9uLmNoYW5uZWxzKSB7XG5cdFx0XHRmb3IgKGNvbnN0IGMgb2YgdGhpcy5jaGFubmVscy5jaGFubmVscykge1xuXHRcdFx0XHRpZiAoYy5pZCA9PT0gY2hhbm5lbC5jaGFubmVsX2lkKSB7XG5cdFx0XHRcdFx0Yy5kb19pbXBvcnQgPSBjaGFubmVsLmRvX2ltcG9ydDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLmNvbGxlY3Rpb24udXBkYXRlKHsgX2lkOiB0aGlzLmNoYW5uZWxzLl9pZCB9LCB7ICRzZXQ6IHsgJ2NoYW5uZWxzJzogdGhpcy5jaGFubmVscy5jaGFubmVscyB9fSk7XG5cblx0XHRjb25zdCBzdGFydGVkQnlVc2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5JTVBPUlRJTkdfVVNFUlMpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHQvL0ltcG9ydCB0aGUgdXNlcnNcblx0XHRcdFx0Zm9yIChjb25zdCB1IG9mIHRoaXMudXNlcnMudXNlcnMpIHtcblx0XHRcdFx0XHRpZiAoIXUuZG9faW1wb3J0KSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0bGV0IGV4aXN0YW50VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUVtYWlsQWRkcmVzcyh1LmVtYWlsKTtcblxuXHRcdFx0XHRcdFx0Ly9JZiB3ZSBjb3VsZG4ndCBmaW5kIG9uZSBieSB0aGVpciBlbWFpbCBhZGRyZXNzLCB0cnkgdG8gZmluZCBhbiBleGlzdGluZyB1c2VyIGJ5IHRoZWlyIHVzZXJuYW1lXG5cdFx0XHRcdFx0XHRpZiAoIWV4aXN0YW50VXNlcikge1xuXHRcdFx0XHRcdFx0XHRleGlzdGFudFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1LnVzZXJuYW1lKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKGV4aXN0YW50VXNlcikge1xuXHRcdFx0XHRcdFx0XHQvL3NpbmNlIHdlIGhhdmUgYW4gZXhpc3RpbmcgdXNlciwgbGV0J3MgdHJ5IGEgZmV3IHRoaW5nc1xuXHRcdFx0XHRcdFx0XHR1LnJvY2tldElkID0gZXhpc3RhbnRVc2VyLl9pZDtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiB1LnJvY2tldElkIH0sIHsgJGFkZFRvU2V0OiB7IGltcG9ydElkczogdS5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgdXNlcklkID0gQWNjb3VudHMuY3JlYXRlVXNlcih7IGVtYWlsOiB1LmVtYWlsLCBwYXNzd29yZDogRGF0ZS5ub3coKSArIHUubmFtZSArIHUuZW1haWwudG9VcHBlckNhc2UoKSB9KTtcblx0XHRcdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0VXNlcm5hbWUnLCB1LnVzZXJuYW1lLCB7am9pbkRlZmF1bHRDaGFubmVsc1NpbGVuY2VkOiB0cnVlfSk7XG5cdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0TmFtZSh1c2VySWQsIHUubmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiB1c2VySWQgfSwgeyAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiB1LmlkIH0gfSk7XG5cdFx0XHRcdFx0XHRcdFx0dS5yb2NrZXRJZCA9IHVzZXJJZDtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHN1cGVyLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMudXNlcnMuX2lkIH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH19KTtcblxuXHRcdFx0XHQvL0ltcG9ydCB0aGUgY2hhbm5lbHNcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19DSEFOTkVMUyk7XG5cdFx0XHRcdGZvciAoY29uc3QgYyBvZiB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzKSB7XG5cdFx0XHRcdFx0aWYgKCFjLmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdGNvbnN0IGV4aXN0YW50Um9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoYy5uYW1lKTtcblx0XHRcdFx0XHRcdC8vSWYgdGhlIHJvb20gZXhpc3RzIG9yIHRoZSBuYW1lIG9mIGl0IGlzICdnZW5lcmFsJywgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGNyZWF0ZSBpdCBhZ2FpblxuXHRcdFx0XHRcdFx0aWYgKGV4aXN0YW50Um9vbSB8fCBjLm5hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0dFTkVSQUwnKSB7XG5cdFx0XHRcdFx0XHRcdGMucm9ja2V0SWQgPSBjLm5hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0dFTkVSQUwnID8gJ0dFTkVSQUwnIDogZXhpc3RhbnRSb29tLl9pZDtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHsgX2lkOiBjLnJvY2tldElkIH0sIHsgJGFkZFRvU2V0OiB7IGltcG9ydElkczogYy5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly9GaW5kIHRoZSByb2NrZXRjaGF0SWQgb2YgdGhlIHVzZXIgd2hvIGNyZWF0ZWQgdGhpcyBjaGFubmVsXG5cdFx0XHRcdFx0XHRcdGxldCBjcmVhdG9ySWQgPSBzdGFydGVkQnlVc2VySWQ7XG5cdFx0XHRcdFx0XHRcdGZvciAoY29uc3QgdSBvZiB0aGlzLnVzZXJzLnVzZXJzKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKHUudXNlcm5hbWUgPT09IGMuY3JlYXRvciAmJiB1LmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y3JlYXRvcklkID0gdS5yb2NrZXRJZDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvL0NyZWF0ZSB0aGUgY2hhbm5lbFxuXHRcdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKGNyZWF0b3JJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHJvb21JbmZvID0gTWV0ZW9yLmNhbGwoYy5pc1ByaXZhdGUgPyAnY3JlYXRlUHJpdmF0ZUdyb3VwJyA6ICdjcmVhdGVDaGFubmVsJywgYy5uYW1lLCBjLm1lbWJlcnMpO1xuXHRcdFx0XHRcdFx0XHRcdGMucm9ja2V0SWQgPSByb29tSW5mby5yaWQ7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZSh7IF9pZDogYy5yb2NrZXRJZCB9LCB7ICRhZGRUb1NldDogeyBpbXBvcnRJZHM6IGMuaWQgfSB9KTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0c3VwZXIuYWRkQ291bnRDb21wbGV0ZWQoMSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5jb2xsZWN0aW9uLnVwZGF0ZSh7IF9pZDogdGhpcy5jaGFubmVscy5faWQgfSwgeyAkc2V0OiB7ICdjaGFubmVscyc6IHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMgfX0pO1xuXG5cdFx0XHRcdC8vSWYgbm8gY2hhbm5lbHMgZmlsZSwgY29sbGVjdCBjaGFubmVsIG1hcCBmcm9tIERCIGZvciBtZXNzYWdlLW9ubHkgaW1wb3J0XG5cdFx0XHRcdGlmICh0aGlzLmNoYW5uZWxzLmNoYW5uZWxzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGZvciAoY29uc3QgY25hbWUgb2YgdGhpcy5tZXNzYWdlcy5rZXlzKCkpIHtcblx0XHRcdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIoc3RhcnRlZEJ5VXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGV4aXN0YW50Um9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY25hbWUpO1xuXHRcdFx0XHRcdFx0XHRpZiAoZXhpc3RhbnRSb29tIHx8IGNuYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdHRU5FUkFMJykge1xuXHRcdFx0XHRcdFx0XHRcdHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZDogY25hbWUucmVwbGFjZSgnLicsICdfJyksXG5cdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiBjbmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdHJvY2tldElkOiAoY25hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0dFTkVSQUwnID8gJ0dFTkVSQUwnIDogZXhpc3RhbnRSb29tLl9pZCksXG5cdFx0XHRcdFx0XHRcdFx0XHRkb19pbXBvcnQ6IHRydWVcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9JZiBubyB1c2VycyBmaWxlLCBjb2xsZWN0IHVzZXIgbWFwIGZyb20gREIgZm9yIG1lc3NhZ2Utb25seSBpbXBvcnRcblx0XHRcdFx0aWYgKHRoaXMudXNlcnMudXNlcnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBbY2gsIG1lc3NhZ2VzTWFwXSBvZiB0aGlzLm1lc3NhZ2VzLmVudHJpZXMoKSkge1xuXHRcdFx0XHRcdFx0Y29uc3QgY3N2Q2hhbm5lbCA9IHRoaXMuZ2V0Q2hhbm5lbEZyb21OYW1lKGNoKTtcblx0XHRcdFx0XHRcdGlmICghY3N2Q2hhbm5lbCB8fCAhY3N2Q2hhbm5lbC5kb19pbXBvcnQpIHtcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IG1zZ3Mgb2YgbWVzc2FnZXNNYXAudmFsdWVzKCkpIHtcblx0XHRcdFx0XHRcdFx0XHRmb3IgKGNvbnN0IG1zZyBvZiBtc2dzLm1lc3NhZ2VzKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoIXRoaXMuZ2V0VXNlckZyb21Vc2VybmFtZShtc2cudXNlcm5hbWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShtc2cudXNlcm5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMudXNlcnMudXNlcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyb2NrZXRJZDogdXNlci5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL0ltcG9ydCB0aGUgTWVzc2FnZXNcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19NRVNTQUdFUyk7XG5cdFx0XHRcdGZvciAoY29uc3QgW2NoLCBtZXNzYWdlc01hcF0gb2YgdGhpcy5tZXNzYWdlcy5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRjb25zdCBjc3ZDaGFubmVsID0gdGhpcy5nZXRDaGFubmVsRnJvbU5hbWUoY2gpO1xuXHRcdFx0XHRcdGlmICghY3N2Q2hhbm5lbCB8fCAhY3N2Q2hhbm5lbC5kb19pbXBvcnQpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChjc3ZDaGFubmVsLnJvY2tldElkLCB7IGZpZWxkczogeyB1c2VybmFtZXM6IDEsIHQ6IDEsIG5hbWU6IDEgfSB9KTtcblx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgdGltZXN0YW1wcyA9IHt9O1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCBbbXNnR3JvdXBEYXRhLCBtc2dzXSBvZiBtZXNzYWdlc01hcC5lbnRyaWVzKCkpIHtcblx0XHRcdFx0XHRcdFx0c3VwZXIudXBkYXRlUmVjb3JkKHsgJ21lc3NhZ2Vzc3RhdHVzJzogYCR7IGNoIH0vJHsgbXNnR3JvdXBEYXRhIH0uJHsgbXNncy5tZXNzYWdlcy5sZW5ndGggfWAgfSk7XG5cdFx0XHRcdFx0XHRcdGZvciAoY29uc3QgbXNnIG9mIG1zZ3MubWVzc2FnZXMpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoaXNOYU4obmV3IERhdGUocGFyc2VJbnQobXNnLnRzKSkpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBUaW1lc3RhbXAgb24gYSBtZXNzYWdlIGluICR7IGNoIH0vJHsgbXNnR3JvdXBEYXRhIH0gaXMgaW52YWxpZGApO1xuXHRcdFx0XHRcdFx0XHRcdFx0c3VwZXIuYWRkQ291bnRDb21wbGV0ZWQoMSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRjb25zdCBjcmVhdG9yID0gdGhpcy5nZXRVc2VyRnJvbVVzZXJuYW1lKG1zZy51c2VybmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNyZWF0b3IpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBzdWZmaXggPSAnJztcblx0XHRcdFx0XHRcdFx0XHRcdGlmICh0aW1lc3RhbXBzW21zZy50c10gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aW1lc3RhbXBzW21zZy50c10gPSAxO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c3VmZml4ID0gYC0keyB0aW1lc3RhbXBzW21zZy50c10gfWA7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRpbWVzdGFtcHNbbXNnLnRzXSArPSAxO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgbXNnT2JqID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRfaWQ6IGBjc3YtJHsgY3N2Q2hhbm5lbC5pZCB9LSR7IG1zZy50cyB9JHsgc3VmZml4IH1gLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0czogbmV3IERhdGUocGFyc2VJbnQobXNnLnRzKSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG1zZzogbXNnLnRleHQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfaWQ6IGNyZWF0b3IuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiBjcmVhdG9yLnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UoY3JlYXRvciwgbXNnT2JqLCByb29tLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRzdXBlci5hZGRDb3VudENvbXBsZXRlZCgxKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkZJTklTSElORyk7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5ET05FKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoZSk7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5FUlJPUik7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHRpbWVUb29rID0gRGF0ZS5ub3coKSAtIHN0YXJ0ZWQ7XG5cdFx0XHR0aGlzLmxvZ2dlci5sb2coYENTViBJbXBvcnQgdG9vayAkeyB0aW1lVG9vayB9IG1pbGxpc2Vjb25kcy5gKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBzdXBlci5nZXRQcm9ncmVzcygpO1xuXHR9XG5cblx0Z2V0U2VsZWN0aW9uKCkge1xuXHRcdGNvbnN0IHNlbGVjdGlvblVzZXJzID0gdGhpcy51c2Vycy51c2Vycy5tYXAoKHUpID0+IG5ldyBTZWxlY3Rpb25Vc2VyKHUuaWQsIHUudXNlcm5hbWUsIHUuZW1haWwsIGZhbHNlLCBmYWxzZSwgdHJ1ZSkpO1xuXHRcdGNvbnN0IHNlbGVjdGlvbkNoYW5uZWxzID0gdGhpcy5jaGFubmVscy5jaGFubmVscy5tYXAoKGMpID0+IG5ldyBTZWxlY3Rpb25DaGFubmVsKGMuaWQsIGMubmFtZSwgZmFsc2UsIHRydWUsIGMuaXNQcml2YXRlKSk7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uTWVzc2FnZXMgPSB0aGlzLmltcG9ydFJlY29yZC5jb3VudC5tZXNzYWdlcztcblxuXHRcdHJldHVybiBuZXcgU2VsZWN0aW9uKHRoaXMubmFtZSwgc2VsZWN0aW9uVXNlcnMsIHNlbGVjdGlvbkNoYW5uZWxzLCBzZWxlY3Rpb25NZXNzYWdlcyk7XG5cdH1cblxuXHRnZXRDaGFubmVsRnJvbU5hbWUoY2hhbm5lbE5hbWUpIHtcblx0XHRmb3IgKGNvbnN0IGNoIG9mIHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMpIHtcblx0XHRcdGlmIChjaC5uYW1lID09PSBjaGFubmVsTmFtZSkge1xuXHRcdFx0XHRyZXR1cm4gY2g7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Z2V0VXNlckZyb21Vc2VybmFtZSh1c2VybmFtZSkge1xuXHRcdGZvciAoY29uc3QgdSBvZiB0aGlzLnVzZXJzLnVzZXJzKSB7XG5cdFx0XHRpZiAodS51c2VybmFtZSA9PT0gdXNlcm5hbWUpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHUucm9ja2V0SWQsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH19KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsImltcG9ydCB7IEltcG9ydGVycyB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcbmltcG9ydCB7IENzdkltcG9ydGVySW5mbyB9IGZyb20gJy4uL2luZm8nO1xuaW1wb3J0IHsgQ3N2SW1wb3J0ZXIgfSBmcm9tICcuL2ltcG9ydGVyJztcblxuSW1wb3J0ZXJzLmFkZChuZXcgQ3N2SW1wb3J0ZXJJbmZvKCksIENzdkltcG9ydGVyKTtcbiJdfQ==
