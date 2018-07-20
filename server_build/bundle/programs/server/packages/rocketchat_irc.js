(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:irc":{"server":{"irc.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc.js                                                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Bridge;
module.watch(require("./irc-bridge"), {
  default(v) {
    Bridge = v;
  }

}, 0);

if (!!RocketChat.settings.get('IRC_Enabled') === true) {
  // Normalize the config values
  const config = {
    server: {
      protocol: RocketChat.settings.get('IRC_Protocol'),
      host: RocketChat.settings.get('IRC_Host'),
      port: RocketChat.settings.get('IRC_Port'),
      name: RocketChat.settings.get('IRC_Name'),
      description: RocketChat.settings.get('IRC_Description')
    },
    passwords: {
      local: RocketChat.settings.get('IRC_Local_Password'),
      peer: RocketChat.settings.get('IRC_Peer_Password')
    }
  };
  Meteor.ircBridge = new Bridge(config);
  Meteor.startup(() => {
    Meteor.ircBridge.init();
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods":{"resetIrcConnection.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/methods/resetIrcConnection.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Bridge;
module.watch(require("../irc-bridge"), {
  default(v) {
    Bridge = v;
  }

}, 0);
Meteor.methods({
  resetIrcConnection() {
    const ircEnabled = !!RocketChat.settings.get('IRC_Enabled') === true;

    if (Meteor.ircBridge) {
      Meteor.ircBridge.stop();

      if (!ircEnabled) {
        return {
          message: 'Connection_Closed',
          params: []
        };
      }
    }

    if (ircEnabled) {
      if (Meteor.ircBridge) {
        Meteor.ircBridge.init();
        return {
          message: 'Connection_Reset',
          params: []
        };
      } // Normalize the config values


      const config = {
        server: {
          protocol: RocketChat.settings.get('IRC_Protocol'),
          host: RocketChat.settings.get('IRC_Host'),
          port: RocketChat.settings.get('IRC_Port'),
          name: RocketChat.settings.get('IRC_Name'),
          description: RocketChat.settings.get('IRC_Description')
        },
        passwords: {
          local: RocketChat.settings.get('IRC_Local_Password'),
          peer: RocketChat.settings.get('IRC_Peer_Password')
        }
      };
      Meteor.ircBridge = new Bridge(config);
      Meteor.ircBridge.init();
      return {
        message: 'Connection_Reset',
        params: []
      };
    }

    throw new Meteor.Error(t('IRC_Federation_Disabled'));
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"irc-settings.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-settings.js                                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
Meteor.startup(function () {
  RocketChat.settings.addGroup('IRC_Federation', function () {
    this.add('IRC_Enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled',
      i18nDescription: 'IRC_Enabled',
      alert: 'IRC_Enabled_Alert'
    });
    this.add('IRC_Protocol', 'RFC2813', {
      type: 'select',
      i18nLabel: 'Protocol',
      i18nDescription: 'IRC_Protocol',
      values: [{
        key: 'RFC2813',
        i18nLabel: 'RFC2813'
      }]
    });
    this.add('IRC_Host', 'localhost', {
      type: 'string',
      i18nLabel: 'Host',
      i18nDescription: 'IRC_Host'
    });
    this.add('IRC_Port', 6667, {
      type: 'int',
      i18nLabel: 'Port',
      i18nDescription: 'IRC_Port'
    });
    this.add('IRC_Name', 'irc.rocket.chat', {
      type: 'string',
      i18nLabel: 'Name',
      i18nDescription: 'IRC_Name'
    });
    this.add('IRC_Description', 'Rocket.Chat IRC Bridge', {
      type: 'string',
      i18nLabel: 'Description',
      i18nDescription: 'IRC_Description'
    });
    this.add('IRC_Local_Password', 'password', {
      type: 'string',
      i18nLabel: 'Local_Password',
      i18nDescription: 'IRC_Local_Password'
    });
    this.add('IRC_Peer_Password', 'password', {
      type: 'string',
      i18nLabel: 'Peer_Password',
      i18nDescription: 'IRC_Peer_Password'
    });
    this.add('IRC_Reset_Connection', 'resetIrcConnection', {
      type: 'action',
      actionText: 'Reset_Connection',
      i18nLabel: 'Reset_Connection'
    });
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"irc-bridge":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/index.js                                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Queue;
module.watch(require("queue-fifo"), {
  default(v) {
    Queue = v;
  }

}, 0);
let servers;
module.watch(require("../servers"), {
  "*"(v) {
    servers = v;
  }

}, 1);
let peerCommandHandlers;
module.watch(require("./peerHandlers"), {
  "*"(v) {
    peerCommandHandlers = v;
  }

}, 2);
let localCommandHandlers;
module.watch(require("./localHandlers"), {
  "*"(v) {
    localCommandHandlers = v;
  }

}, 3);

class Bridge {
  constructor(config) {
    // General
    this.config = config; // Workaround for Rocket.Chat callbacks being called multiple times

    this.loggedInUsers = []; // Server

    const Server = servers[this.config.server.protocol];
    this.server = new Server(this.config);
    this.setupPeerHandlers();
    this.setupLocalHandlers(); // Command queue

    this.queue = new Queue();
    this.queueTimeout = 5;
  }

  init() {
    this.loggedInUsers = [];
    this.server.register();
    this.server.on('registered', () => {
      this.logQueue('Starting...');
      this.runQueue();
    });
  }

  stop() {
    this.server.disconnect();
  }
  /**
   * Log helper
   */


  log(message) {
    console.log(`[irc][bridge] ${message}`);
  }

  logQueue(message) {
    console.log(`[irc][bridge][queue] ${message}`);
  }
  /**
   *
   *
   * Queue
   *
   *
   */


  onMessageReceived(from, command, ...parameters) {
    this.queue.enqueue({
      from,
      command,
      parameters
    });
  }

  runQueue() {
    return Promise.asyncApply(() => {
      // If it is empty, skip and keep the queue going
      if (this.queue.isEmpty()) {
        return setTimeout(this.runQueue.bind(this), this.queueTimeout);
      } // Get the command


      const item = this.queue.dequeue();
      this.logQueue(`Processing "${item.command}" command from "${item.from}"`); // Handle the command accordingly

      switch (item.from) {
        case 'local':
          if (!localCommandHandlers[item.command]) {
            throw new Error(`Could not find handler for local:${item.command}`);
          }

          Promise.await(localCommandHandlers[item.command].apply(this, item.parameters));
          break;

        case 'peer':
          if (!peerCommandHandlers[item.command]) {
            throw new Error(`Could not find handler for peer:${item.command}`);
          }

          Promise.await(peerCommandHandlers[item.command].apply(this, item.parameters));
          break;
      } // Keep the queue going


      setTimeout(this.runQueue.bind(this), this.queueTimeout);
    });
  }
  /**
   *
   *
   * Peer
   *
   *
   */


  setupPeerHandlers() {
    this.server.on('peerCommand', cmd => {
      this.onMessageReceived('peer', cmd.identifier, cmd.args);
    });
  }
  /**
   *
   *
   * Local
   *
   *
   */


  setupLocalHandlers() {
    // Auth
    RocketChat.callbacks.add('afterValidateLogin', this.onMessageReceived.bind(this, 'local', 'onLogin'), RocketChat.callbacks.priority.LOW, 'irc-on-login');
    RocketChat.callbacks.add('afterCreateUser', this.onMessageReceived.bind(this, 'local', 'onCreateUser'), RocketChat.callbacks.priority.LOW, 'irc-on-create-user'); // Joining rooms or channels

    RocketChat.callbacks.add('afterCreateChannel', this.onMessageReceived.bind(this, 'local', 'onCreateRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-create-channel');
    RocketChat.callbacks.add('afterCreateRoom', this.onMessageReceived.bind(this, 'local', 'onCreateRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-create-room');
    RocketChat.callbacks.add('afterJoinRoom', this.onMessageReceived.bind(this, 'local', 'onJoinRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-join-room'); // Leaving rooms or channels

    RocketChat.callbacks.add('afterLeaveRoom', this.onMessageReceived.bind(this, 'local', 'onLeaveRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-leave-room'); // Chatting

    RocketChat.callbacks.add('afterSaveMessage', this.onMessageReceived.bind(this, 'local', 'onSaveMessage'), RocketChat.callbacks.priority.LOW, 'irc-on-save-message'); // Leaving

    RocketChat.callbacks.add('afterLogoutCleanUp', this.onMessageReceived.bind(this, 'local', 'onLogout'), RocketChat.callbacks.priority.LOW, 'irc-on-logout');
  }

  sendCommand(command, parameters) {
    this.server.emit('onReceiveFromLocal', command, parameters);
  }

}

module.exportDefault(Bridge);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"localHandlers":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/index.js                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  onCreateRoom: () => onCreateRoom,
  onJoinRoom: () => onJoinRoom,
  onLeaveRoom: () => onLeaveRoom,
  onLogin: () => onLogin,
  onLogout: () => onLogout,
  onSaveMessage: () => onSaveMessage,
  onCreateUser: () => onCreateUser
});
let onCreateRoom;
module.watch(require("./onCreateRoom"), {
  default(v) {
    onCreateRoom = v;
  }

}, 0);
let onJoinRoom;
module.watch(require("./onJoinRoom"), {
  default(v) {
    onJoinRoom = v;
  }

}, 1);
let onLeaveRoom;
module.watch(require("./onLeaveRoom"), {
  default(v) {
    onLeaveRoom = v;
  }

}, 2);
let onLogin;
module.watch(require("./onLogin"), {
  default(v) {
    onLogin = v;
  }

}, 3);
let onLogout;
module.watch(require("./onLogout"), {
  default(v) {
    onLogout = v;
  }

}, 4);
let onSaveMessage;
module.watch(require("./onSaveMessage"), {
  default(v) {
    onSaveMessage = v;
  }

}, 5);
let onCreateUser;
module.watch(require("./onCreateUser"), {
  default(v) {
    onCreateUser = v;
  }

}, 6);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onCreateRoom.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onCreateRoom.js                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnCreateRoom
});

function handleOnCreateRoom(user, room) {
  if (!room.usernames) {
    return this.log(`Room ${room.name} does not have a valid list of usernames`);
  }

  for (const username of room.usernames) {
    const user = RocketChat.models.Users.findOne({
      username
    });

    if (user.profile.irc.fromIRC) {
      this.sendCommand('joinChannel', {
        room,
        user
      });
    } else {
      this.sendCommand('joinedChannel', {
        room,
        user
      });
    }
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onCreateUser.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onCreateUser.js                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnCreateUser
});

function handleOnCreateUser(newUser) {
  if (!newUser) {
    return this.log('Invalid handleOnCreateUser call');
  }

  if (!newUser.username) {
    return this.log('Invalid handleOnCreateUser call (Missing username)');
  }

  if (this.loggedInUsers.indexOf(newUser._id) !== -1) {
    return this.log('Duplicate handleOnCreateUser call');
  }

  this.loggedInUsers.push(newUser._id);
  Meteor.users.update({
    _id: newUser._id
  }, {
    $set: {
      'profile.irc.fromIRC': false,
      'profile.irc.username': `${newUser.username}-rkt`,
      'profile.irc.nick': `${newUser.username}-rkt`,
      'profile.irc.hostname': 'rocket.chat'
    }
  });
  const user = RocketChat.models.Users.findOne({
    _id: newUser._id
  });
  this.sendCommand('registerUser', user);
  const rooms = RocketChat.models.Rooms.findWithUsername(user.username).fetch();
  rooms.forEach(room => this.sendCommand('joinedChannel', {
    room,
    user
  }));
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onJoinRoom.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onJoinRoom.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnJoinRoom
});

function handleOnJoinRoom(user, room) {
  this.sendCommand('joinedChannel', {
    room,
    user
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onLeaveRoom.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onLeaveRoom.js                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnLeaveRoom
});

function handleOnLeaveRoom(user, room) {
  this.sendCommand('leftChannel', {
    room,
    user
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onLogin.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onLogin.js                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnLogin
});

function handleOnLogin(login) {
  if (login.user === null) {
    return this.log('Invalid handleOnLogin call');
  }

  if (!login.user.username) {
    return this.log('Invalid handleOnLogin call (Missing username)');
  }

  if (this.loggedInUsers.indexOf(login.user._id) !== -1) {
    return this.log('Duplicate handleOnLogin call');
  }

  this.loggedInUsers.push(login.user._id);
  Meteor.users.update({
    _id: login.user._id
  }, {
    $set: {
      'profile.irc.fromIRC': false,
      'profile.irc.username': `${login.user.username}-rkt`,
      'profile.irc.nick': `${login.user.username}-rkt`,
      'profile.irc.hostname': 'rocket.chat'
    }
  });
  const user = RocketChat.models.Users.findOne({
    _id: login.user._id
  });
  this.sendCommand('registerUser', user);
  const rooms = RocketChat.models.Rooms.findWithUsername(user.username).fetch();
  rooms.forEach(room => this.sendCommand('joinedChannel', {
    room,
    user
  }));
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onLogout.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onLogout.js                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnLogout
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function handleOnLogout(user) {
  this.loggedInUsers = _.without(this.loggedInUsers, user._id);
  this.sendCommand('disconnected', {
    user
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"onSaveMessage.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/localHandlers/onSaveMessage.js                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleOnSaveMessage
});

function handleOnSaveMessage(message, to) {
  let toIdentification = ''; // Direct message

  if (to.t === 'd') {
    const subscriptions = RocketChat.models.Subscriptions.findByRoomId(to._id);
    subscriptions.forEach(subscription => {
      if (subscription.u.username !== to.username) {
        const userData = RocketChat.models.Users.findOne({
          username: subscription.u.username
        });

        if (userData) {
          if (userData.profile && userData.profile.irc && userData.profile.irc.nick) {
            toIdentification = userData.profile.irc.nick;
          } else {
            toIdentification = userData.username;
          }
        } else {
          toIdentification = subscription.u.username;
        }
      }
    });

    if (!toIdentification) {
      console.error('[irc][server] Target user not found');
      return;
    }
  } else {
    toIdentification = `#${to.name}`;
  }

  const user = RocketChat.models.Users.findOne({
    _id: message.u._id
  });
  this.sendCommand('sentMessage', {
    to: toIdentification,
    user,
    message: message.msg
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"peerHandlers":{"disconnected.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/disconnected.js                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleQUIT
});

function handleQUIT(args) {
  const user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  });
  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      status: 'offline'
    }
  });
  RocketChat.models.Rooms.removeUsernameFromAll(user.username);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/index.js                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  disconnected: () => disconnected,
  joinedChannel: () => joinedChannel,
  leftChannel: () => leftChannel,
  nickChanged: () => nickChanged,
  sentMessage: () => sentMessage,
  userRegistered: () => userRegistered
});
let disconnected;
module.watch(require("./disconnected"), {
  default(v) {
    disconnected = v;
  }

}, 0);
let joinedChannel;
module.watch(require("./joinedChannel"), {
  default(v) {
    joinedChannel = v;
  }

}, 1);
let leftChannel;
module.watch(require("./leftChannel"), {
  default(v) {
    leftChannel = v;
  }

}, 2);
let nickChanged;
module.watch(require("./nickChanged"), {
  default(v) {
    nickChanged = v;
  }

}, 3);
let sentMessage;
module.watch(require("./sentMessage"), {
  default(v) {
    sentMessage = v;
  }

}, 4);
let userRegistered;
module.watch(require("./userRegistered"), {
  default(v) {
    userRegistered = v;
  }

}, 5);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"joinedChannel.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/joinedChannel.js                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleJoinedChannel
});

function handleJoinedChannel(args) {
  const user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  });

  if (!user) {
    throw new Error(`Could not find a user with nick ${args.nick}`);
  }

  let room = RocketChat.models.Rooms.findOneByName(args.roomName);

  if (!room) {
    const createdRoom = RocketChat.createRoom('c', args.roomName, user.username, [
      /* usernames of the participants here */
    ]);
    room = RocketChat.models.Rooms.findOne({
      _id: createdRoom.rid
    });
    this.log(`${user.username} created room ${args.roomName}`);
  } else {
    RocketChat.addUserToRoom(room._id, user);
    this.log(`${user.username} joined room ${room.name}`);
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leftChannel.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/leftChannel.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleLeftChannel
});

function handleLeftChannel(args) {
  const user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  });

  if (!user) {
    throw new Error(`Could not find a user with nick ${args.nick}`);
  }

  const room = RocketChat.models.Rooms.findOneByName(args.roomName);

  if (!room) {
    throw new Error(`Could not find a room with name ${args.roomName}`);
  }

  this.log(`${user.username} left room ${room.name}`);
  RocketChat.removeUserFromRoom(room._id, user);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"nickChanged.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/nickChanged.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleNickChanged
});

function handleNickChanged(args) {
  const user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  });

  if (!user) {
    throw new Error(`Could not find an user with nick ${args.nick}`);
  }

  this.log(`${user.username} changed nick: ${args.nick} -> ${args.newNick}`); // Update on the database

  RocketChat.models.Users.update({
    _id: user._id
  }, {
    $set: {
      name: args.newNick,
      'profile.irc.nick': args.newNick
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sentMessage.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/sentMessage.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleSentMessage
});

/*
 *
 * Get direct chat room helper
 *
 *
 */
const getDirectRoom = (source, target) => {
  const rid = [source._id, target._id].sort().join('');
  RocketChat.models.Rooms.upsert({
    _id: rid
  }, {
    $set: {
      usernames: [source.username, target.username]
    },
    $setOnInsert: {
      t: 'd',
      msgs: 0,
      ts: new Date()
    }
  });
  RocketChat.models.Subscriptions.upsert({
    rid,
    'u._id': target._id
  }, {
    $setOnInsert: {
      name: source.username,
      t: 'd',
      open: false,
      alert: false,
      unread: 0,
      u: {
        _id: target._id,
        username: target.username
      }
    }
  });
  RocketChat.models.Subscriptions.upsert({
    rid,
    'u._id': source._id
  }, {
    $setOnInsert: {
      name: target.username,
      t: 'd',
      open: false,
      alert: false,
      unread: 0,
      u: {
        _id: source._id,
        username: source.username
      }
    }
  });
  return {
    _id: rid,
    t: 'd'
  };
};

function handleSentMessage(args) {
  const user = RocketChat.models.Users.findOne({
    'profile.irc.nick': args.nick
  });

  if (!user) {
    throw new Error(`Could not find a user with nick ${args.nick}`);
  }

  let room;

  if (args.roomName) {
    room = RocketChat.models.Rooms.findOneByName(args.roomName);
  } else {
    const recipientUser = RocketChat.models.Users.findOne({
      'profile.irc.nick': args.recipientNick
    });
    room = getDirectRoom(user, recipientUser);
  }

  const message = {
    msg: args.message,
    ts: new Date()
  };
  RocketChat.sendMessage(user, message, room);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"userRegistered.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/irc-bridge/peerHandlers/userRegistered.js                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  default: () => handleUserRegistered
});

function handleUserRegistered(args) {
  return Promise.asyncApply(() => {
    // Check if there is an user with the given username
    let user = RocketChat.models.Users.findOne({
      'profile.irc.username': args.username
    }); // If there is no user, create one...

    if (!user) {
      this.log(`Registering ${args.username} with nick: ${args.nick}`);
      const userToInsert = {
        name: args.nick,
        username: `${args.username}-irc`,
        status: 'online',
        utcOffset: 0,
        active: true,
        type: 'user',
        profile: {
          irc: {
            fromIRC: true,
            nick: args.nick,
            username: args.username,
            hostname: args.hostname
          }
        }
      };
      user = RocketChat.models.Users.create(userToInsert);
    } else {
      // ...otherwise, log the user in and update the information
      this.log(`Logging in ${args.username} with nick: ${args.nick}`);
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          status: 'online',
          'profile.irc.nick': args.nick,
          'profile.irc.username': args.username,
          'profile.irc.hostname': args.hostname
        }
      });
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"servers":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/servers/index.js                                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  RFC2813: () => RFC2813
});
let RFC2813;
module.watch(require("./RFC2813"), {
  default(v) {
    RFC2813 = v;
  }

}, 0);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RFC2813":{"codes.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/servers/RFC2813/codes.js                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/**
 * This file is part of https://github.com/martynsmith/node-irc
 * by https://github.com/martynsmith
 */
module.exports = {
  '001': {
    name: 'rpl_welcome',
    type: 'reply'
  },
  '002': {
    name: 'rpl_yourhost',
    type: 'reply'
  },
  '003': {
    name: 'rpl_created',
    type: 'reply'
  },
  '004': {
    name: 'rpl_myinfo',
    type: 'reply'
  },
  '005': {
    name: 'rpl_isupport',
    type: 'reply'
  },
  200: {
    name: 'rpl_tracelink',
    type: 'reply'
  },
  201: {
    name: 'rpl_traceconnecting',
    type: 'reply'
  },
  202: {
    name: 'rpl_tracehandshake',
    type: 'reply'
  },
  203: {
    name: 'rpl_traceunknown',
    type: 'reply'
  },
  204: {
    name: 'rpl_traceoperator',
    type: 'reply'
  },
  205: {
    name: 'rpl_traceuser',
    type: 'reply'
  },
  206: {
    name: 'rpl_traceserver',
    type: 'reply'
  },
  208: {
    name: 'rpl_tracenewtype',
    type: 'reply'
  },
  211: {
    name: 'rpl_statslinkinfo',
    type: 'reply'
  },
  212: {
    name: 'rpl_statscommands',
    type: 'reply'
  },
  213: {
    name: 'rpl_statscline',
    type: 'reply'
  },
  214: {
    name: 'rpl_statsnline',
    type: 'reply'
  },
  215: {
    name: 'rpl_statsiline',
    type: 'reply'
  },
  216: {
    name: 'rpl_statskline',
    type: 'reply'
  },
  218: {
    name: 'rpl_statsyline',
    type: 'reply'
  },
  219: {
    name: 'rpl_endofstats',
    type: 'reply'
  },
  221: {
    name: 'rpl_umodeis',
    type: 'reply'
  },
  241: {
    name: 'rpl_statslline',
    type: 'reply'
  },
  242: {
    name: 'rpl_statsuptime',
    type: 'reply'
  },
  243: {
    name: 'rpl_statsoline',
    type: 'reply'
  },
  244: {
    name: 'rpl_statshline',
    type: 'reply'
  },
  250: {
    name: 'rpl_statsconn',
    type: 'reply'
  },
  251: {
    name: 'rpl_luserclient',
    type: 'reply'
  },
  252: {
    name: 'rpl_luserop',
    type: 'reply'
  },
  253: {
    name: 'rpl_luserunknown',
    type: 'reply'
  },
  254: {
    name: 'rpl_luserchannels',
    type: 'reply'
  },
  255: {
    name: 'rpl_luserme',
    type: 'reply'
  },
  256: {
    name: 'rpl_adminme',
    type: 'reply'
  },
  257: {
    name: 'rpl_adminloc1',
    type: 'reply'
  },
  258: {
    name: 'rpl_adminloc2',
    type: 'reply'
  },
  259: {
    name: 'rpl_adminemail',
    type: 'reply'
  },
  261: {
    name: 'rpl_tracelog',
    type: 'reply'
  },
  265: {
    name: 'rpl_localusers',
    type: 'reply'
  },
  266: {
    name: 'rpl_globalusers',
    type: 'reply'
  },
  300: {
    name: 'rpl_none',
    type: 'reply'
  },
  301: {
    name: 'rpl_away',
    type: 'reply'
  },
  302: {
    name: 'rpl_userhost',
    type: 'reply'
  },
  303: {
    name: 'rpl_ison',
    type: 'reply'
  },
  305: {
    name: 'rpl_unaway',
    type: 'reply'
  },
  306: {
    name: 'rpl_nowaway',
    type: 'reply'
  },
  311: {
    name: 'rpl_whoisuser',
    type: 'reply'
  },
  312: {
    name: 'rpl_whoisserver',
    type: 'reply'
  },
  313: {
    name: 'rpl_whoisoperator',
    type: 'reply'
  },
  314: {
    name: 'rpl_whowasuser',
    type: 'reply'
  },
  315: {
    name: 'rpl_endofwho',
    type: 'reply'
  },
  317: {
    name: 'rpl_whoisidle',
    type: 'reply'
  },
  318: {
    name: 'rpl_endofwhois',
    type: 'reply'
  },
  319: {
    name: 'rpl_whoischannels',
    type: 'reply'
  },
  321: {
    name: 'rpl_liststart',
    type: 'reply'
  },
  322: {
    name: 'rpl_list',
    type: 'reply'
  },
  323: {
    name: 'rpl_listend',
    type: 'reply'
  },
  324: {
    name: 'rpl_channelmodeis',
    type: 'reply'
  },
  329: {
    name: 'rpl_creationtime',
    type: 'reply'
  },
  331: {
    name: 'rpl_notopic',
    type: 'reply'
  },
  332: {
    name: 'rpl_topic',
    type: 'reply'
  },
  333: {
    name: 'rpl_topicwhotime',
    type: 'reply'
  },
  341: {
    name: 'rpl_inviting',
    type: 'reply'
  },
  342: {
    name: 'rpl_summoning',
    type: 'reply'
  },
  351: {
    name: 'rpl_version',
    type: 'reply'
  },
  352: {
    name: 'rpl_whoreply',
    type: 'reply'
  },
  353: {
    name: 'rpl_namreply',
    type: 'reply'
  },
  364: {
    name: 'rpl_links',
    type: 'reply'
  },
  365: {
    name: 'rpl_endoflinks',
    type: 'reply'
  },
  366: {
    name: 'rpl_endofnames',
    type: 'reply'
  },
  367: {
    name: 'rpl_banlist',
    type: 'reply'
  },
  368: {
    name: 'rpl_endofbanlist',
    type: 'reply'
  },
  369: {
    name: 'rpl_endofwhowas',
    type: 'reply'
  },
  371: {
    name: 'rpl_info',
    type: 'reply'
  },
  372: {
    name: 'rpl_motd',
    type: 'reply'
  },
  374: {
    name: 'rpl_endofinfo',
    type: 'reply'
  },
  375: {
    name: 'rpl_motdstart',
    type: 'reply'
  },
  376: {
    name: 'rpl_endofmotd',
    type: 'reply'
  },
  381: {
    name: 'rpl_youreoper',
    type: 'reply'
  },
  382: {
    name: 'rpl_rehashing',
    type: 'reply'
  },
  391: {
    name: 'rpl_time',
    type: 'reply'
  },
  392: {
    name: 'rpl_usersstart',
    type: 'reply'
  },
  393: {
    name: 'rpl_users',
    type: 'reply'
  },
  394: {
    name: 'rpl_endofusers',
    type: 'reply'
  },
  395: {
    name: 'rpl_nousers',
    type: 'reply'
  },
  401: {
    name: 'err_nosuchnick',
    type: 'error'
  },
  402: {
    name: 'err_nosuchserver',
    type: 'error'
  },
  403: {
    name: 'err_nosuchchannel',
    type: 'error'
  },
  404: {
    name: 'err_cannotsendtochan',
    type: 'error'
  },
  405: {
    name: 'err_toomanychannels',
    type: 'error'
  },
  406: {
    name: 'err_wasnosuchnick',
    type: 'error'
  },
  407: {
    name: 'err_toomanytargets',
    type: 'error'
  },
  409: {
    name: 'err_noorigin',
    type: 'error'
  },
  411: {
    name: 'err_norecipient',
    type: 'error'
  },
  412: {
    name: 'err_notexttosend',
    type: 'error'
  },
  413: {
    name: 'err_notoplevel',
    type: 'error'
  },
  414: {
    name: 'err_wildtoplevel',
    type: 'error'
  },
  421: {
    name: 'err_unknowncommand',
    type: 'error'
  },
  422: {
    name: 'err_nomotd',
    type: 'error'
  },
  423: {
    name: 'err_noadmininfo',
    type: 'error'
  },
  424: {
    name: 'err_fileerror',
    type: 'error'
  },
  431: {
    name: 'err_nonicknamegiven',
    type: 'error'
  },
  432: {
    name: 'err_erroneusnickname',
    type: 'error'
  },
  433: {
    name: 'err_nicknameinuse',
    type: 'error'
  },
  436: {
    name: 'err_nickcollision',
    type: 'error'
  },
  441: {
    name: 'err_usernotinchannel',
    type: 'error'
  },
  442: {
    name: 'err_notonchannel',
    type: 'error'
  },
  443: {
    name: 'err_useronchannel',
    type: 'error'
  },
  444: {
    name: 'err_nologin',
    type: 'error'
  },
  445: {
    name: 'err_summondisabled',
    type: 'error'
  },
  446: {
    name: 'err_usersdisabled',
    type: 'error'
  },
  451: {
    name: 'err_notregistered',
    type: 'error'
  },
  461: {
    name: 'err_needmoreparams',
    type: 'error'
  },
  462: {
    name: 'err_alreadyregistred',
    type: 'error'
  },
  463: {
    name: 'err_nopermforhost',
    type: 'error'
  },
  464: {
    name: 'err_passwdmismatch',
    type: 'error'
  },
  465: {
    name: 'err_yourebannedcreep',
    type: 'error'
  },
  467: {
    name: 'err_keyset',
    type: 'error'
  },
  471: {
    name: 'err_channelisfull',
    type: 'error'
  },
  472: {
    name: 'err_unknownmode',
    type: 'error'
  },
  473: {
    name: 'err_inviteonlychan',
    type: 'error'
  },
  474: {
    name: 'err_bannedfromchan',
    type: 'error'
  },
  475: {
    name: 'err_badchannelkey',
    type: 'error'
  },
  481: {
    name: 'err_noprivileges',
    type: 'error'
  },
  482: {
    name: 'err_chanoprivsneeded',
    type: 'error'
  },
  483: {
    name: 'err_cantkillserver',
    type: 'error'
  },
  491: {
    name: 'err_nooperhost',
    type: 'error'
  },
  501: {
    name: 'err_umodeunknownflag',
    type: 'error'
  },
  502: {
    name: 'err_usersdontmatch',
    type: 'error'
  }
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/servers/RFC2813/index.js                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let net;
module.watch(require("net"), {
  default(v) {
    net = v;
  }

}, 0);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 1);
let EventEmitter;
module.watch(require("events"), {
  EventEmitter(v) {
    EventEmitter = v;
  }

}, 2);
let parseMessage;
module.watch(require("./parseMessage"), {
  default(v) {
    parseMessage = v;
  }

}, 3);
let peerCommandHandlers;
module.watch(require("./peerCommandHandlers"), {
  default(v) {
    peerCommandHandlers = v;
  }

}, 4);
let localCommandHandlers;
module.watch(require("./localCommandHandlers"), {
  default(v) {
    localCommandHandlers = v;
  }

}, 5);

class RFC2813 {
  constructor(config) {
    this.config = config; // Hold registered state

    this.registerSteps = [];
    this.isRegistered = false; // Hold peer server information

    this.serverPrefix = null; // Hold the buffer while receiving

    this.receiveBuffer = new Buffer('');
  }
  /**
   * Setup socket
   */


  setupSocket() {
    // Setup socket
    this.socket = new net.Socket();
    this.socket.setNoDelay();
    this.socket.setEncoding('utf-8');
    this.socket.setKeepAlive(true);
    this.socket.setTimeout(90000);
    this.socket.on('data', this.onReceiveFromPeer.bind(this));
    this.socket.on('connect', this.onConnect.bind(this));
    this.socket.on('error', err => console.log('[irc][server][err]', err));
    this.socket.on('timeout', () => this.log('Timeout'));
    this.socket.on('close', () => this.log('Connection Closed')); // Setup local

    this.on('onReceiveFromLocal', this.onReceiveFromLocal.bind(this));
  }
  /**
   * Log helper
   */


  log(message) {
    console.log(`[irc][server] ${message}`);
  }
  /**
   * Connect
   */


  register() {
    this.log(`Connecting to @${this.config.server.host}:${this.config.server.port}`);

    if (!this.socket) {
      this.setupSocket();
    }

    this.socket.connect(this.config.server.port, this.config.server.host);
  }
  /**
   * Disconnect
   */


  disconnect() {
    this.log('Disconnecting from server.');

    if (this.socket) {
      this.socket.destroy();
      this.socket = undefined;
    }

    this.isRegistered = false;
    this.registerSteps = [];
  }
  /**
   * Setup the server connection
   */


  onConnect() {
    this.log('Connected! Registering as server...');
    this.write({
      command: 'PASS',
      parameters: [this.config.passwords.local, '0210', 'ngircd']
    });
    this.write({
      command: 'SERVER',
      parameters: [this.config.server.name],
      trailer: this.config.server.description
    });
  }
  /**
   * Sends a command message through the socket
   */


  write(command) {
    let buffer = command.prefix ? `:${command.prefix} ` : '';
    buffer += command.command;

    if (command.parameters && command.parameters.length > 0) {
      buffer += ` ${command.parameters.join(' ')}`;
    }

    if (command.trailer) {
      buffer += ` :${command.trailer}`;
    }

    this.log(`Sending Command: ${buffer}`);
    return this.socket.write(`${buffer}\r\n`);
  }
  /**
   *
   *
   * Peer message handling
   *
   *
   */


  onReceiveFromPeer(chunk) {
    if (typeof chunk === 'string') {
      this.receiveBuffer += chunk;
    } else {
      this.receiveBuffer = Buffer.concat([this.receiveBuffer, chunk]);
    }

    const lines = this.receiveBuffer.toString().split(/\r\n|\r|\n|\u0007/); // eslint-disable-line no-control-regex
    // If the buffer does not end with \r\n, more chunks are coming

    if (lines.pop()) {
      return;
    } // Reset the buffer


    this.receiveBuffer = new Buffer('');
    lines.forEach(line => {
      if (line.length && !line.startsWith('\a')) {
        const parsedMessage = parseMessage(line);

        if (peerCommandHandlers[parsedMessage.command]) {
          this.log(`Handling peer message: ${line}`);
          const command = peerCommandHandlers[parsedMessage.command].call(this, parsedMessage);

          if (command) {
            this.log(`Emitting peer command to local: ${JSON.stringify(command)}`);
            this.emit('peerCommand', command);
          }
        } else {
          this.log(`Unhandled peer message: ${JSON.stringify(parsedMessage)}`);
        }
      }
    });
  }
  /**
   *
   *
   * Local message handling
   *
   *
   */


  onReceiveFromLocal(command, parameters) {
    if (localCommandHandlers[command]) {
      this.log(`Handling local command: ${command}`);
      localCommandHandlers[command].call(this, parameters);
    } else {
      this.log(`Unhandled local command: ${JSON.stringify(command)}`);
    }
  }

}

util.inherits(RFC2813, EventEmitter);
module.exportDefault(RFC2813);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"localCommandHandlers.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/servers/RFC2813/localCommandHandlers.js                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
function registerUser(parameters) {
  const {
    name,
    profile: {
      irc: {
        nick,
        username
      }
    }
  } = parameters;
  this.write({
    prefix: this.config.server.name,
    command: 'NICK',
    parameters: [nick, 1, username, 'irc.rocket.chat', 1, '+i'],
    trailer: name
  });
}

function joinChannel(parameters) {
  const {
    room: {
      name: roomName
    },
    user: {
      profile: {
        irc: {
          nick
        }
      }
    }
  } = parameters;
  this.write({
    prefix: this.config.server.name,
    command: 'NJOIN',
    parameters: [`#${roomName}`],
    trailer: nick
  });
}

function joinedChannel(parameters) {
  const {
    room: {
      name: roomName
    },
    user: {
      profile: {
        irc: {
          nick
        }
      }
    }
  } = parameters;
  this.write({
    prefix: nick,
    command: 'JOIN',
    parameters: [`#${roomName}`]
  });
}

function leftChannel(parameters) {
  const {
    room: {
      name: roomName
    },
    user: {
      profile: {
        irc: {
          nick
        }
      }
    }
  } = parameters;
  this.write({
    prefix: nick,
    command: 'PART',
    parameters: [`#${roomName}`]
  });
}

function sentMessage(parameters) {
  const {
    user: {
      profile: {
        irc: {
          nick
        }
      }
    },
    to,
    message
  } = parameters;
  this.write({
    prefix: nick,
    command: 'PRIVMSG',
    parameters: [to],
    trailer: message
  });
}

function disconnected(parameters) {
  const {
    user: {
      profile: {
        irc: {
          nick
        }
      }
    }
  } = parameters;
  this.write({
    prefix: nick,
    command: 'QUIT'
  });
}

module.exportDefault({
  registerUser,
  joinChannel,
  joinedChannel,
  leftChannel,
  sentMessage,
  disconnected
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parseMessage.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/servers/RFC2813/parseMessage.js                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/**
 * This file is part of https://github.com/martynsmith/node-irc
 * by https://github.com/martynsmith
 */
const replyFor = require('./codes');
/**
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 * @param {String} line Raw message from IRC server.
 * @return {Object} A parsed message object.
 */


module.exports = function parseMessage(line) {
  const message = {};
  let match; // Parse prefix

  match = line.match(/^:([^ ]+) +/);

  if (match) {
    message.prefix = match[1];
    line = line.replace(/^:[^ ]+ +/, '');
    match = message.prefix.match(/^([_a-zA-Z0-9\~\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/);

    if (match) {
      message.nick = match[1];
      message.user = match[3];
      message.host = match[4];
    } else {
      message.server = message.prefix;
    }
  } // Parse command


  match = line.match(/^([^ ]+) */);
  message.command = match[1];
  message.rawCommand = match[1];
  message.commandType = 'normal';
  line = line.replace(/^[^ ]+ +/, '');

  if (replyFor[message.rawCommand]) {
    message.command = replyFor[message.rawCommand].name;
    message.commandType = replyFor[message.rawCommand].type;
  }

  message.args = [];
  let middle;
  let trailing; // Parse parameters

  if (line.search(/^:|\s+:/) !== -1) {
    match = line.match(/(.*?)(?:^:|\s+:)(.*)/);
    middle = match[1].trimRight();
    trailing = match[2];
  } else {
    middle = line;
  }

  if (middle.length) {
    message.args = middle.split(/ +/);
  }

  if (typeof trailing !== 'undefined' && trailing.length) {
    message.args.push(trailing);
  }

  return message;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"peerCommandHandlers.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/rocketchat_irc/server/servers/RFC2813/peerCommandHandlers.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
function PASS() {
  this.log('Received PASS command, continue registering...');
  this.registerSteps.push('PASS');
}

function SERVER(parsedMessage) {
  this.log('Received SERVER command, waiting for first PING...');
  this.serverPrefix = parsedMessage.prefix;
  this.registerSteps.push('SERVER');
}

function PING() {
  if (!this.isRegistered && this.registerSteps.length === 2) {
    this.log('Received first PING command, server is registered!');
    this.isRegistered = true;
    this.emit('registered');
  }

  this.write({
    prefix: this.config.server.name,
    command: 'PONG',
    parameters: [this.config.server.name]
  });
}

function NICK(parsedMessage) {
  let command; // Check if the message comes from the server,
  // which means it is a new user

  if (parsedMessage.prefix === this.serverPrefix) {
    command = {
      identifier: 'userRegistered',
      args: {
        nick: parsedMessage.args[0],
        username: parsedMessage.args[2],
        host: parsedMessage.args[3],
        name: parsedMessage.args[6]
      }
    };
  } else {
    // Otherwise, it is a nick change
    command = {
      identifier: 'nickChanged',
      args: {
        nick: parsedMessage.nick,
        newNick: parsedMessage.args[0]
      }
    };
  }

  return command;
}

function JOIN(parsedMessage) {
  const command = {
    identifier: 'joinedChannel',
    args: {
      roomName: parsedMessage.args[0].substring(1),
      nick: parsedMessage.prefix
    }
  };
  return command;
}

function PART(parsedMessage) {
  const command = {
    identifier: 'leftChannel',
    args: {
      roomName: parsedMessage.args[0].substring(1),
      nick: parsedMessage.prefix
    }
  };
  return command;
}

function PRIVMSG(parsedMessage) {
  const command = {
    identifier: 'sentMessage',
    args: {
      nick: parsedMessage.prefix,
      message: parsedMessage.args[1]
    }
  };

  if (parsedMessage.args[0][0] === '#') {
    command.args.roomName = parsedMessage.args[0].substring(1);
  } else {
    command.args.recipientNick = parsedMessage.args[0];
  }

  return command;
}

function QUIT(parsedMessage) {
  const command = {
    identifier: 'disconnected',
    args: {
      nick: parsedMessage.prefix
    }
  };
  return command;
}

module.exportDefault({
  PASS,
  SERVER,
  PING,
  NICK,
  JOIN,
  PART,
  PRIVMSG,
  QUIT
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"queue-fifo":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/rocketchat_irc/node_modules/queue-fifo/package.json                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "queue-fifo";
exports.version = "0.2.4";
exports.main = "index.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/rocketchat_irc/node_modules/queue-fifo/index.js                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/**
 * @fileOverview Implementation of a queue (FIFO) data structure
 * @author Jason S. Jones
 * @license MIT
 */

(function() {
    'use strict';

    /***********************************************************
     * Queue Data Structure
     *
     * This is a 'queue' data structure that implements the notion
     * of a 'First in First Out', or FIFO, protocol.  The underlying data
     * structure is a doubly linked list.  This linked list data structure
     * does all the heavy lifting, enabling this implementation to be a
     * simple wrapper around the linked list to leverage the applicable
     * methods and properties.  This provides a very clean and simple
     * implementation for this queue data structure.
     *
     ***********************************************************/

    // bring in the one dependency which will be the underlying
    // data structure for this queue implementation
    var LinkedList = require('dbly-linked-list');

    /**
     * Creates a new queue instance and initializes the underlying data
     * structure
     *
     * @constructor
     */
    function Queue() {
        this._list = new LinkedList();
    }

    /* Functions attached to the Queue prototype.  All queue instances
     * will share these methods, meaning there will NOT be copies made for each
     * instance.  This will be a huge memory savings since there may be several
     * different queue instances.
     */
    Queue.prototype = {

        /**
         * Determines if the queue is empty
         *
         * @returns {boolean} true if the queue is empty, false otherwise
         */
        isEmpty: function() {
            return this._list.isEmpty();
        },

        /**
         * Returns the size, or number of items in the queue
         *
         * @returns {number} the number of items in the queue
         */
        size: function() {
            return this._list.getSize();
        },

        /**
         * Clears the queue of all data
         */
        clear: function () {
            return this._list.clear();
        },

        /**
         * Adds a new item containing 'data' to the back of the queue
         *
         * @param {object} data the data to add to the back of the queue
         */
        enqueue: function (data) {
            return this._list.insert(data);
        },

        /**
         * Removes the item from the front of the queue
         *
         * @returns {object} the item, or data, from the front of the queue
         */
        dequeue: function () {
            return this._list.removeFirst().getData();
        },

        /**
         * Returns the data of the item at the front of the queue,
         * but does not remove it
         *
         * @returns {object} the item, or data, from the top of the stack
         */
        peek: function () {
            return this._list.getHeadNode().getData();
        }
    };

    // export the constructor fn to make it available for use outside
    // this file
    module.exports = Queue;
}());

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:irc/server/irc.js");
require("/node_modules/meteor/rocketchat:irc/server/methods/resetIrcConnection.js");
require("/node_modules/meteor/rocketchat:irc/server/irc-settings.js");

/* Exports */
Package._define("rocketchat:irc");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_irc.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL2lyYy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL21ldGhvZHMvcmVzZXRJcmNDb25uZWN0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLXNldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLWJyaWRnZS9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL2lyYy1icmlkZ2UvbG9jYWxIYW5kbGVycy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL2lyYy1icmlkZ2UvbG9jYWxIYW5kbGVycy9vbkNyZWF0ZVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aXJjL3NlcnZlci9pcmMtYnJpZGdlL2xvY2FsSGFuZGxlcnMvb25DcmVhdGVVc2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLWJyaWRnZS9sb2NhbEhhbmRsZXJzL29uSm9pblJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aXJjL3NlcnZlci9pcmMtYnJpZGdlL2xvY2FsSGFuZGxlcnMvb25MZWF2ZVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aXJjL3NlcnZlci9pcmMtYnJpZGdlL2xvY2FsSGFuZGxlcnMvb25Mb2dpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL2lyYy1icmlkZ2UvbG9jYWxIYW5kbGVycy9vbkxvZ291dC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL2lyYy1icmlkZ2UvbG9jYWxIYW5kbGVycy9vblNhdmVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLWJyaWRnZS9wZWVySGFuZGxlcnMvZGlzY29ubmVjdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLWJyaWRnZS9wZWVySGFuZGxlcnMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aXJjL3NlcnZlci9pcmMtYnJpZGdlL3BlZXJIYW5kbGVycy9qb2luZWRDaGFubmVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLWJyaWRnZS9wZWVySGFuZGxlcnMvbGVmdENoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aXJjL3NlcnZlci9pcmMtYnJpZGdlL3BlZXJIYW5kbGVycy9uaWNrQ2hhbmdlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL2lyYy1icmlkZ2UvcGVlckhhbmRsZXJzL3NlbnRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvaXJjLWJyaWRnZS9wZWVySGFuZGxlcnMvdXNlclJlZ2lzdGVyZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aXJjL3NlcnZlci9zZXJ2ZXJzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvc2VydmVycy9SRkMyODEzL2NvZGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvc2VydmVycy9SRkMyODEzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvc2VydmVycy9SRkMyODEzL2xvY2FsQ29tbWFuZEhhbmRsZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmlyYy9zZXJ2ZXIvc2VydmVycy9SRkMyODEzL3BhcnNlTWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppcmMvc2VydmVyL3NlcnZlcnMvUkZDMjgxMy9wZWVyQ29tbWFuZEhhbmRsZXJzLmpzIl0sIm5hbWVzIjpbIkJyaWRnZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiZ2V0IiwiY29uZmlnIiwic2VydmVyIiwicHJvdG9jb2wiLCJob3N0IiwicG9ydCIsIm5hbWUiLCJkZXNjcmlwdGlvbiIsInBhc3N3b3JkcyIsImxvY2FsIiwicGVlciIsIk1ldGVvciIsImlyY0JyaWRnZSIsInN0YXJ0dXAiLCJpbml0IiwibWV0aG9kcyIsInJlc2V0SXJjQ29ubmVjdGlvbiIsImlyY0VuYWJsZWQiLCJzdG9wIiwibWVzc2FnZSIsInBhcmFtcyIsIkVycm9yIiwidCIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSIsImkxOG5MYWJlbCIsImkxOG5EZXNjcmlwdGlvbiIsImFsZXJ0IiwidmFsdWVzIiwia2V5IiwiYWN0aW9uVGV4dCIsIlF1ZXVlIiwic2VydmVycyIsInBlZXJDb21tYW5kSGFuZGxlcnMiLCJsb2NhbENvbW1hbmRIYW5kbGVycyIsImNvbnN0cnVjdG9yIiwibG9nZ2VkSW5Vc2VycyIsIlNlcnZlciIsInNldHVwUGVlckhhbmRsZXJzIiwic2V0dXBMb2NhbEhhbmRsZXJzIiwicXVldWUiLCJxdWV1ZVRpbWVvdXQiLCJyZWdpc3RlciIsIm9uIiwibG9nUXVldWUiLCJydW5RdWV1ZSIsImRpc2Nvbm5lY3QiLCJsb2ciLCJjb25zb2xlIiwib25NZXNzYWdlUmVjZWl2ZWQiLCJmcm9tIiwiY29tbWFuZCIsInBhcmFtZXRlcnMiLCJlbnF1ZXVlIiwiaXNFbXB0eSIsInNldFRpbWVvdXQiLCJiaW5kIiwiaXRlbSIsImRlcXVldWUiLCJhcHBseSIsImNtZCIsImlkZW50aWZpZXIiLCJhcmdzIiwiY2FsbGJhY2tzIiwicHJpb3JpdHkiLCJMT1ciLCJzZW5kQ29tbWFuZCIsImVtaXQiLCJleHBvcnREZWZhdWx0IiwiZXhwb3J0Iiwib25DcmVhdGVSb29tIiwib25Kb2luUm9vbSIsIm9uTGVhdmVSb29tIiwib25Mb2dpbiIsIm9uTG9nb3V0Iiwib25TYXZlTWVzc2FnZSIsIm9uQ3JlYXRlVXNlciIsImhhbmRsZU9uQ3JlYXRlUm9vbSIsInVzZXIiLCJyb29tIiwidXNlcm5hbWVzIiwidXNlcm5hbWUiLCJtb2RlbHMiLCJVc2VycyIsImZpbmRPbmUiLCJwcm9maWxlIiwiaXJjIiwiZnJvbUlSQyIsImhhbmRsZU9uQ3JlYXRlVXNlciIsIm5ld1VzZXIiLCJpbmRleE9mIiwiX2lkIiwicHVzaCIsInVzZXJzIiwidXBkYXRlIiwiJHNldCIsInJvb21zIiwiUm9vbXMiLCJmaW5kV2l0aFVzZXJuYW1lIiwiZmV0Y2giLCJmb3JFYWNoIiwiaGFuZGxlT25Kb2luUm9vbSIsImhhbmRsZU9uTGVhdmVSb29tIiwiaGFuZGxlT25Mb2dpbiIsImxvZ2luIiwiaGFuZGxlT25Mb2dvdXQiLCJfIiwid2l0aG91dCIsImhhbmRsZU9uU2F2ZU1lc3NhZ2UiLCJ0byIsInRvSWRlbnRpZmljYXRpb24iLCJzdWJzY3JpcHRpb25zIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRCeVJvb21JZCIsInN1YnNjcmlwdGlvbiIsInUiLCJ1c2VyRGF0YSIsIm5pY2siLCJlcnJvciIsIm1zZyIsImhhbmRsZVFVSVQiLCJzdGF0dXMiLCJyZW1vdmVVc2VybmFtZUZyb21BbGwiLCJkaXNjb25uZWN0ZWQiLCJqb2luZWRDaGFubmVsIiwibGVmdENoYW5uZWwiLCJuaWNrQ2hhbmdlZCIsInNlbnRNZXNzYWdlIiwidXNlclJlZ2lzdGVyZWQiLCJoYW5kbGVKb2luZWRDaGFubmVsIiwiZmluZE9uZUJ5TmFtZSIsInJvb21OYW1lIiwiY3JlYXRlZFJvb20iLCJjcmVhdGVSb29tIiwicmlkIiwiYWRkVXNlclRvUm9vbSIsImhhbmRsZUxlZnRDaGFubmVsIiwicmVtb3ZlVXNlckZyb21Sb29tIiwiaGFuZGxlTmlja0NoYW5nZWQiLCJuZXdOaWNrIiwiaGFuZGxlU2VudE1lc3NhZ2UiLCJnZXREaXJlY3RSb29tIiwic291cmNlIiwidGFyZ2V0Iiwic29ydCIsImpvaW4iLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJtc2dzIiwidHMiLCJEYXRlIiwib3BlbiIsInVucmVhZCIsInJlY2lwaWVudFVzZXIiLCJyZWNpcGllbnROaWNrIiwic2VuZE1lc3NhZ2UiLCJoYW5kbGVVc2VyUmVnaXN0ZXJlZCIsInVzZXJUb0luc2VydCIsInV0Y09mZnNldCIsImFjdGl2ZSIsImhvc3RuYW1lIiwiY3JlYXRlIiwiUkZDMjgxMyIsImV4cG9ydHMiLCJuZXQiLCJ1dGlsIiwiRXZlbnRFbWl0dGVyIiwicGFyc2VNZXNzYWdlIiwicmVnaXN0ZXJTdGVwcyIsImlzUmVnaXN0ZXJlZCIsInNlcnZlclByZWZpeCIsInJlY2VpdmVCdWZmZXIiLCJCdWZmZXIiLCJzZXR1cFNvY2tldCIsInNvY2tldCIsIlNvY2tldCIsInNldE5vRGVsYXkiLCJzZXRFbmNvZGluZyIsInNldEtlZXBBbGl2ZSIsIm9uUmVjZWl2ZUZyb21QZWVyIiwib25Db25uZWN0IiwiZXJyIiwib25SZWNlaXZlRnJvbUxvY2FsIiwiY29ubmVjdCIsImRlc3Ryb3kiLCJ1bmRlZmluZWQiLCJ3cml0ZSIsInRyYWlsZXIiLCJidWZmZXIiLCJwcmVmaXgiLCJsZW5ndGgiLCJjaHVuayIsImNvbmNhdCIsImxpbmVzIiwidG9TdHJpbmciLCJzcGxpdCIsInBvcCIsImxpbmUiLCJzdGFydHNXaXRoIiwicGFyc2VkTWVzc2FnZSIsImNhbGwiLCJKU09OIiwic3RyaW5naWZ5IiwiaW5oZXJpdHMiLCJyZWdpc3RlclVzZXIiLCJqb2luQ2hhbm5lbCIsInJlcGx5Rm9yIiwibWF0Y2giLCJyZXBsYWNlIiwicmF3Q29tbWFuZCIsImNvbW1hbmRUeXBlIiwibWlkZGxlIiwidHJhaWxpbmciLCJzZWFyY2giLCJ0cmltUmlnaHQiLCJQQVNTIiwiU0VSVkVSIiwiUElORyIsIk5JQ0siLCJKT0lOIiwic3Vic3RyaW5nIiwiUEFSVCIsIlBSSVZNU0ciLCJRVUlUIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLE1BQUo7QUFBV0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFQUFxQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsYUFBT0ssQ0FBUDtBQUFTOztBQUFyQixDQUFyQyxFQUE0RCxDQUE1RDs7QUFFWCxJQUFJLENBQUMsQ0FBQ0MsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsYUFBeEIsQ0FBRixLQUE2QyxJQUFqRCxFQUF1RDtBQUN0RDtBQUNBLFFBQU1DLFNBQVM7QUFDZEMsWUFBUTtBQUNQQyxnQkFBVUwsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsY0FBeEIsQ0FESDtBQUVQSSxZQUFNTixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QixDQUZDO0FBR1BLLFlBQU1QLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBSEM7QUFJUE0sWUFBTVIsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FKQztBQUtQTyxtQkFBYVQsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsaUJBQXhCO0FBTE4sS0FETTtBQVFkUSxlQUFXO0FBQ1ZDLGFBQU9YLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG9CQUF4QixDQURHO0FBRVZVLFlBQU1aLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QjtBQUZJO0FBUkcsR0FBZjtBQWNBVyxTQUFPQyxTQUFQLEdBQW1CLElBQUlwQixNQUFKLENBQVdTLE1BQVgsQ0FBbkI7QUFFQVUsU0FBT0UsT0FBUCxDQUFlLE1BQU07QUFDcEJGLFdBQU9DLFNBQVAsQ0FBaUJFLElBQWpCO0FBQ0EsR0FGRDtBQUdBLEM7Ozs7Ozs7Ozs7O0FDdkJELElBQUl0QixNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGFBQU9LLENBQVA7QUFBUzs7QUFBckIsQ0FBdEMsRUFBNkQsQ0FBN0Q7QUFFWGMsT0FBT0ksT0FBUCxDQUFlO0FBQ2RDLHVCQUFxQjtBQUNwQixVQUFNQyxhQUFjLENBQUMsQ0FBQ25CLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLGFBQXhCLENBQUgsS0FBK0MsSUFBbEU7O0FBRUEsUUFBSVcsT0FBT0MsU0FBWCxFQUFzQjtBQUNyQkQsYUFBT0MsU0FBUCxDQUFpQk0sSUFBakI7O0FBQ0EsVUFBSSxDQUFDRCxVQUFMLEVBQWlCO0FBQ2hCLGVBQU87QUFDTkUsbUJBQVMsbUJBREg7QUFFTkMsa0JBQVE7QUFGRixTQUFQO0FBSUE7QUFDRDs7QUFFRCxRQUFJSCxVQUFKLEVBQWdCO0FBQ2YsVUFBSU4sT0FBT0MsU0FBWCxFQUFzQjtBQUNyQkQsZUFBT0MsU0FBUCxDQUFpQkUsSUFBakI7QUFDQSxlQUFPO0FBQ05LLG1CQUFTLGtCQURIO0FBRU5DLGtCQUFRO0FBRkYsU0FBUDtBQUlBLE9BUGMsQ0FTZjs7O0FBQ0EsWUFBTW5CLFNBQVM7QUFDZEMsZ0JBQVE7QUFDUEMsb0JBQVVMLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLGNBQXhCLENBREg7QUFFUEksZ0JBQU1OLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBRkM7QUFHUEssZ0JBQU1QLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBSEM7QUFJUE0sZ0JBQU1SLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBSkM7QUFLUE8sdUJBQWFULFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLGlCQUF4QjtBQUxOLFNBRE07QUFRZFEsbUJBQVc7QUFDVkMsaUJBQU9YLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG9CQUF4QixDQURHO0FBRVZVLGdCQUFNWixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixtQkFBeEI7QUFGSTtBQVJHLE9BQWY7QUFjQVcsYUFBT0MsU0FBUCxHQUFtQixJQUFJcEIsTUFBSixDQUFXUyxNQUFYLENBQW5CO0FBQ0FVLGFBQU9DLFNBQVAsQ0FBaUJFLElBQWpCO0FBRUEsYUFBTztBQUNOSyxpQkFBUyxrQkFESDtBQUVOQyxnQkFBUTtBQUZGLE9BQVA7QUFJQTs7QUFFRCxVQUFNLElBQUlULE9BQU9VLEtBQVgsQ0FBaUJDLEVBQUUseUJBQUYsQ0FBakIsQ0FBTjtBQUNBOztBQWhEYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDRkFYLE9BQU9FLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCZixhQUFXQyxRQUFYLENBQW9Cd0IsUUFBcEIsQ0FBNkIsZ0JBQTdCLEVBQStDLFlBQVc7QUFDekQsU0FBS0MsR0FBTCxDQUFTLGFBQVQsRUFBd0IsS0FBeEIsRUFBK0I7QUFDOUJDLFlBQU0sU0FEd0I7QUFFOUJDLGlCQUFXLFNBRm1CO0FBRzlCQyx1QkFBaUIsYUFIYTtBQUk5QkMsYUFBTztBQUp1QixLQUEvQjtBQU9BLFNBQUtKLEdBQUwsQ0FBUyxjQUFULEVBQXlCLFNBQXpCLEVBQW9DO0FBQ25DQyxZQUFNLFFBRDZCO0FBRW5DQyxpQkFBVyxVQUZ3QjtBQUduQ0MsdUJBQWlCLGNBSGtCO0FBSW5DRSxjQUFRLENBQ1A7QUFDQ0MsYUFBSyxTQUROO0FBRUNKLG1CQUFXO0FBRlosT0FETztBQUoyQixLQUFwQztBQVlBLFNBQUtGLEdBQUwsQ0FBUyxVQUFULEVBQXFCLFdBQXJCLEVBQWtDO0FBQ2pDQyxZQUFNLFFBRDJCO0FBRWpDQyxpQkFBVyxNQUZzQjtBQUdqQ0MsdUJBQWlCO0FBSGdCLEtBQWxDO0FBTUEsU0FBS0gsR0FBTCxDQUFTLFVBQVQsRUFBcUIsSUFBckIsRUFBMkI7QUFDMUJDLFlBQU0sS0FEb0I7QUFFMUJDLGlCQUFXLE1BRmU7QUFHMUJDLHVCQUFpQjtBQUhTLEtBQTNCO0FBTUEsU0FBS0gsR0FBTCxDQUFTLFVBQVQsRUFBcUIsaUJBQXJCLEVBQXdDO0FBQ3ZDQyxZQUFNLFFBRGlDO0FBRXZDQyxpQkFBVyxNQUY0QjtBQUd2Q0MsdUJBQWlCO0FBSHNCLEtBQXhDO0FBTUEsU0FBS0gsR0FBTCxDQUFTLGlCQUFULEVBQTRCLHdCQUE1QixFQUFzRDtBQUNyREMsWUFBTSxRQUQrQztBQUVyREMsaUJBQVcsYUFGMEM7QUFHckRDLHVCQUFpQjtBQUhvQyxLQUF0RDtBQU1BLFNBQUtILEdBQUwsQ0FBUyxvQkFBVCxFQUErQixVQUEvQixFQUEyQztBQUMxQ0MsWUFBTSxRQURvQztBQUUxQ0MsaUJBQVcsZ0JBRitCO0FBRzFDQyx1QkFBaUI7QUFIeUIsS0FBM0M7QUFNQSxTQUFLSCxHQUFMLENBQVMsbUJBQVQsRUFBOEIsVUFBOUIsRUFBMEM7QUFDekNDLFlBQU0sUUFEbUM7QUFFekNDLGlCQUFXLGVBRjhCO0FBR3pDQyx1QkFBaUI7QUFId0IsS0FBMUM7QUFNQSxTQUFLSCxHQUFMLENBQVMsc0JBQVQsRUFBaUMsb0JBQWpDLEVBQXVEO0FBQ3REQyxZQUFNLFFBRGdEO0FBRXRETSxrQkFBWSxrQkFGMEM7QUFHdERMLGlCQUFXO0FBSDJDLEtBQXZEO0FBS0EsR0E3REQ7QUE4REEsQ0EvREQsRTs7Ozs7Ozs7Ozs7QUNBQSxJQUFJTSxLQUFKO0FBQVV2QyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDbUMsWUFBTW5DLENBQU47QUFBUTs7QUFBcEIsQ0FBbkMsRUFBeUQsQ0FBekQ7QUFBNEQsSUFBSW9DLE9BQUo7QUFBWXhDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQyxNQUFJRSxDQUFKLEVBQU07QUFBQ29DLGNBQVFwQyxDQUFSO0FBQVU7O0FBQWxCLENBQW5DLEVBQXVELENBQXZEO0FBQTBELElBQUlxQyxtQkFBSjtBQUF3QnpDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUMsTUFBSUUsQ0FBSixFQUFNO0FBQUNxQywwQkFBb0JyQyxDQUFwQjtBQUFzQjs7QUFBOUIsQ0FBdkMsRUFBdUUsQ0FBdkU7QUFBMEUsSUFBSXNDLG9CQUFKO0FBQXlCMUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWIsRUFBd0M7QUFBQyxNQUFJRSxDQUFKLEVBQU07QUFBQ3NDLDJCQUFxQnRDLENBQXJCO0FBQXVCOztBQUEvQixDQUF4QyxFQUF5RSxDQUF6RTs7QUFLdlEsTUFBTUwsTUFBTixDQUFhO0FBQ1o0QyxjQUFZbkMsTUFBWixFQUFvQjtBQUNuQjtBQUNBLFNBQUtBLE1BQUwsR0FBY0EsTUFBZCxDQUZtQixDQUluQjs7QUFDQSxTQUFLb0MsYUFBTCxHQUFxQixFQUFyQixDQUxtQixDQU9uQjs7QUFDQSxVQUFNQyxTQUFTTCxRQUFRLEtBQUtoQyxNQUFMLENBQVlDLE1BQVosQ0FBbUJDLFFBQTNCLENBQWY7QUFFQSxTQUFLRCxNQUFMLEdBQWMsSUFBSW9DLE1BQUosQ0FBVyxLQUFLckMsTUFBaEIsQ0FBZDtBQUVBLFNBQUtzQyxpQkFBTDtBQUNBLFNBQUtDLGtCQUFMLEdBYm1CLENBZW5COztBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJVCxLQUFKLEVBQWI7QUFDQSxTQUFLVSxZQUFMLEdBQW9CLENBQXBCO0FBQ0E7O0FBRUQ1QixTQUFPO0FBQ04sU0FBS3VCLGFBQUwsR0FBcUIsRUFBckI7QUFDQSxTQUFLbkMsTUFBTCxDQUFZeUMsUUFBWjtBQUVBLFNBQUt6QyxNQUFMLENBQVkwQyxFQUFaLENBQWUsWUFBZixFQUE2QixNQUFNO0FBQ2xDLFdBQUtDLFFBQUwsQ0FBYyxhQUFkO0FBRUEsV0FBS0MsUUFBTDtBQUNBLEtBSkQ7QUFLQTs7QUFFRDVCLFNBQU87QUFDTixTQUFLaEIsTUFBTCxDQUFZNkMsVUFBWjtBQUNBO0FBRUQ7Ozs7O0FBR0FDLE1BQUk3QixPQUFKLEVBQWE7QUFDWjhCLFlBQVFELEdBQVIsQ0FBYSxpQkFBaUI3QixPQUFTLEVBQXZDO0FBQ0E7O0FBRUQwQixXQUFTMUIsT0FBVCxFQUFrQjtBQUNqQjhCLFlBQVFELEdBQVIsQ0FBYSx3QkFBd0I3QixPQUFTLEVBQTlDO0FBQ0E7QUFFRDs7Ozs7Ozs7O0FBT0ErQixvQkFBa0JDLElBQWxCLEVBQXdCQyxPQUF4QixFQUFpQyxHQUFHQyxVQUFwQyxFQUFnRDtBQUMvQyxTQUFLWixLQUFMLENBQVdhLE9BQVgsQ0FBbUI7QUFBRUgsVUFBRjtBQUFRQyxhQUFSO0FBQWlCQztBQUFqQixLQUFuQjtBQUNBOztBQUVLUCxVQUFOO0FBQUEsb0NBQWlCO0FBQ2hCO0FBQ0EsVUFBSSxLQUFLTCxLQUFMLENBQVdjLE9BQVgsRUFBSixFQUEwQjtBQUN6QixlQUFPQyxXQUFXLEtBQUtWLFFBQUwsQ0FBY1csSUFBZCxDQUFtQixJQUFuQixDQUFYLEVBQXFDLEtBQUtmLFlBQTFDLENBQVA7QUFDQSxPQUplLENBTWhCOzs7QUFDQSxZQUFNZ0IsT0FBTyxLQUFLakIsS0FBTCxDQUFXa0IsT0FBWCxFQUFiO0FBRUEsV0FBS2QsUUFBTCxDQUFlLGVBQWVhLEtBQUtOLE9BQVMsbUJBQW1CTSxLQUFLUCxJQUFNLEdBQTFFLEVBVGdCLENBV2hCOztBQUNBLGNBQVFPLEtBQUtQLElBQWI7QUFDQyxhQUFLLE9BQUw7QUFDQyxjQUFJLENBQUNoQixxQkFBcUJ1QixLQUFLTixPQUExQixDQUFMLEVBQXlDO0FBQ3hDLGtCQUFNLElBQUkvQixLQUFKLENBQVcsb0NBQW9DcUMsS0FBS04sT0FBUyxFQUE3RCxDQUFOO0FBQ0E7O0FBRUQsd0JBQU1qQixxQkFBcUJ1QixLQUFLTixPQUExQixFQUFtQ1EsS0FBbkMsQ0FBeUMsSUFBekMsRUFBK0NGLEtBQUtMLFVBQXBELENBQU47QUFDQTs7QUFDRCxhQUFLLE1BQUw7QUFDQyxjQUFJLENBQUNuQixvQkFBb0J3QixLQUFLTixPQUF6QixDQUFMLEVBQXdDO0FBQ3ZDLGtCQUFNLElBQUkvQixLQUFKLENBQVcsbUNBQW1DcUMsS0FBS04sT0FBUyxFQUE1RCxDQUFOO0FBQ0E7O0FBRUQsd0JBQU1sQixvQkFBb0J3QixLQUFLTixPQUF6QixFQUFrQ1EsS0FBbEMsQ0FBd0MsSUFBeEMsRUFBOENGLEtBQUtMLFVBQW5ELENBQU47QUFDQTtBQWRGLE9BWmdCLENBNkJoQjs7O0FBQ0FHLGlCQUFXLEtBQUtWLFFBQUwsQ0FBY1csSUFBZCxDQUFtQixJQUFuQixDQUFYLEVBQXFDLEtBQUtmLFlBQTFDO0FBQ0EsS0EvQkQ7QUFBQTtBQWlDQTs7Ozs7Ozs7O0FBT0FILHNCQUFvQjtBQUNuQixTQUFLckMsTUFBTCxDQUFZMEMsRUFBWixDQUFlLGFBQWYsRUFBK0JpQixHQUFELElBQVM7QUFDdEMsV0FBS1gsaUJBQUwsQ0FBdUIsTUFBdkIsRUFBK0JXLElBQUlDLFVBQW5DLEVBQStDRCxJQUFJRSxJQUFuRDtBQUNBLEtBRkQ7QUFHQTtBQUVEOzs7Ozs7Ozs7QUFPQXZCLHVCQUFxQjtBQUNwQjtBQUNBMUMsZUFBV2tFLFNBQVgsQ0FBcUJ4QyxHQUFyQixDQUF5QixvQkFBekIsRUFBK0MsS0FBSzBCLGlCQUFMLENBQXVCTyxJQUF2QixDQUE0QixJQUE1QixFQUFrQyxPQUFsQyxFQUEyQyxTQUEzQyxDQUEvQyxFQUFzRzNELFdBQVdrRSxTQUFYLENBQXFCQyxRQUFyQixDQUE4QkMsR0FBcEksRUFBeUksY0FBekk7QUFDQXBFLGVBQVdrRSxTQUFYLENBQXFCeEMsR0FBckIsQ0FBeUIsaUJBQXpCLEVBQTRDLEtBQUswQixpQkFBTCxDQUF1Qk8sSUFBdkIsQ0FBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsY0FBM0MsQ0FBNUMsRUFBd0czRCxXQUFXa0UsU0FBWCxDQUFxQkMsUUFBckIsQ0FBOEJDLEdBQXRJLEVBQTJJLG9CQUEzSSxFQUhvQixDQUlwQjs7QUFDQXBFLGVBQVdrRSxTQUFYLENBQXFCeEMsR0FBckIsQ0FBeUIsb0JBQXpCLEVBQStDLEtBQUswQixpQkFBTCxDQUF1Qk8sSUFBdkIsQ0FBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsY0FBM0MsQ0FBL0MsRUFBMkczRCxXQUFXa0UsU0FBWCxDQUFxQkMsUUFBckIsQ0FBOEJDLEdBQXpJLEVBQThJLHVCQUE5STtBQUNBcEUsZUFBV2tFLFNBQVgsQ0FBcUJ4QyxHQUFyQixDQUF5QixpQkFBekIsRUFBNEMsS0FBSzBCLGlCQUFMLENBQXVCTyxJQUF2QixDQUE0QixJQUE1QixFQUFrQyxPQUFsQyxFQUEyQyxjQUEzQyxDQUE1QyxFQUF3RzNELFdBQVdrRSxTQUFYLENBQXFCQyxRQUFyQixDQUE4QkMsR0FBdEksRUFBMkksb0JBQTNJO0FBQ0FwRSxlQUFXa0UsU0FBWCxDQUFxQnhDLEdBQXJCLENBQXlCLGVBQXpCLEVBQTBDLEtBQUswQixpQkFBTCxDQUF1Qk8sSUFBdkIsQ0FBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsWUFBM0MsQ0FBMUMsRUFBb0czRCxXQUFXa0UsU0FBWCxDQUFxQkMsUUFBckIsQ0FBOEJDLEdBQWxJLEVBQXVJLGtCQUF2SSxFQVBvQixDQVFwQjs7QUFDQXBFLGVBQVdrRSxTQUFYLENBQXFCeEMsR0FBckIsQ0FBeUIsZ0JBQXpCLEVBQTJDLEtBQUswQixpQkFBTCxDQUF1Qk8sSUFBdkIsQ0FBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsYUFBM0MsQ0FBM0MsRUFBc0czRCxXQUFXa0UsU0FBWCxDQUFxQkMsUUFBckIsQ0FBOEJDLEdBQXBJLEVBQXlJLG1CQUF6SSxFQVRvQixDQVVwQjs7QUFDQXBFLGVBQVdrRSxTQUFYLENBQXFCeEMsR0FBckIsQ0FBeUIsa0JBQXpCLEVBQTZDLEtBQUswQixpQkFBTCxDQUF1Qk8sSUFBdkIsQ0FBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsZUFBM0MsQ0FBN0MsRUFBMEczRCxXQUFXa0UsU0FBWCxDQUFxQkMsUUFBckIsQ0FBOEJDLEdBQXhJLEVBQTZJLHFCQUE3SSxFQVhvQixDQVlwQjs7QUFDQXBFLGVBQVdrRSxTQUFYLENBQXFCeEMsR0FBckIsQ0FBeUIsb0JBQXpCLEVBQStDLEtBQUswQixpQkFBTCxDQUF1Qk8sSUFBdkIsQ0FBNEIsSUFBNUIsRUFBa0MsT0FBbEMsRUFBMkMsVUFBM0MsQ0FBL0MsRUFBdUczRCxXQUFXa0UsU0FBWCxDQUFxQkMsUUFBckIsQ0FBOEJDLEdBQXJJLEVBQTBJLGVBQTFJO0FBQ0E7O0FBRURDLGNBQVlmLE9BQVosRUFBcUJDLFVBQXJCLEVBQWlDO0FBQ2hDLFNBQUtuRCxNQUFMLENBQVlrRSxJQUFaLENBQWlCLG9CQUFqQixFQUF1Q2hCLE9BQXZDLEVBQWdEQyxVQUFoRDtBQUNBOztBQWpJVzs7QUFMYjVELE9BQU80RSxhQUFQLENBeUllN0UsTUF6SWYsRTs7Ozs7Ozs7Ozs7QUNBQUMsT0FBTzZFLE1BQVAsQ0FBYztBQUFDQyxnQkFBYSxNQUFJQSxZQUFsQjtBQUErQkMsY0FBVyxNQUFJQSxVQUE5QztBQUF5REMsZUFBWSxNQUFJQSxXQUF6RTtBQUFxRkMsV0FBUSxNQUFJQSxPQUFqRztBQUF5R0MsWUFBUyxNQUFJQSxRQUF0SDtBQUErSEMsaUJBQWMsTUFBSUEsYUFBako7QUFBK0pDLGdCQUFhLE1BQUlBO0FBQWhMLENBQWQ7QUFBNk0sSUFBSU4sWUFBSjtBQUFpQjlFLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEUsbUJBQWExRSxDQUFiO0FBQWU7O0FBQTNCLENBQXZDLEVBQW9FLENBQXBFO0FBQXVFLElBQUkyRSxVQUFKO0FBQWUvRSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMkUsaUJBQVczRSxDQUFYO0FBQWE7O0FBQXpCLENBQXJDLEVBQWdFLENBQWhFO0FBQW1FLElBQUk0RSxXQUFKO0FBQWdCaEYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzRFLGtCQUFZNUUsQ0FBWjtBQUFjOztBQUExQixDQUF0QyxFQUFrRSxDQUFsRTtBQUFxRSxJQUFJNkUsT0FBSjtBQUFZakYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFdBQVIsQ0FBYixFQUFrQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzZFLGNBQVE3RSxDQUFSO0FBQVU7O0FBQXRCLENBQWxDLEVBQTBELENBQTFEO0FBQTZELElBQUk4RSxRQUFKO0FBQWFsRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDOEUsZUFBUzlFLENBQVQ7QUFBVzs7QUFBdkIsQ0FBbkMsRUFBNEQsQ0FBNUQ7QUFBK0QsSUFBSStFLGFBQUo7QUFBa0JuRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsaUJBQVIsQ0FBYixFQUF3QztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQytFLG9CQUFjL0UsQ0FBZDtBQUFnQjs7QUFBNUIsQ0FBeEMsRUFBc0UsQ0FBdEU7QUFBeUUsSUFBSWdGLFlBQUo7QUFBaUJwRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsZ0JBQVIsQ0FBYixFQUF1QztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ2dGLG1CQUFhaEYsQ0FBYjtBQUFlOztBQUEzQixDQUF2QyxFQUFvRSxDQUFwRSxFOzs7Ozs7Ozs7OztBQ0E3c0JKLE9BQU82RSxNQUFQLENBQWM7QUFBQzFFLFdBQVEsTUFBSWtGO0FBQWIsQ0FBZDs7QUFBZSxTQUFTQSxrQkFBVCxDQUE0QkMsSUFBNUIsRUFBa0NDLElBQWxDLEVBQXdDO0FBQ3RELE1BQUksQ0FBQ0EsS0FBS0MsU0FBVixFQUFxQjtBQUNwQixXQUFPLEtBQUtqQyxHQUFMLENBQVUsUUFBUWdDLEtBQUsxRSxJQUFNLDBDQUE3QixDQUFQO0FBQ0E7O0FBRUQsT0FBSyxNQUFNNEUsUUFBWCxJQUF1QkYsS0FBS0MsU0FBNUIsRUFBdUM7QUFDdEMsVUFBTUYsT0FBT2pGLFdBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsT0FBeEIsQ0FBZ0M7QUFBRUg7QUFBRixLQUFoQyxDQUFiOztBQUVBLFFBQUlILEtBQUtPLE9BQUwsQ0FBYUMsR0FBYixDQUFpQkMsT0FBckIsRUFBOEI7QUFDN0IsV0FBS3JCLFdBQUwsQ0FBaUIsYUFBakIsRUFBZ0M7QUFBRWEsWUFBRjtBQUFRRDtBQUFSLE9BQWhDO0FBQ0EsS0FGRCxNQUVPO0FBQ04sV0FBS1osV0FBTCxDQUFpQixlQUFqQixFQUFrQztBQUFFYSxZQUFGO0FBQVFEO0FBQVIsT0FBbEM7QUFDQTtBQUNEO0FBQ0QsQzs7Ozs7Ozs7Ozs7QUNkRHRGLE9BQU82RSxNQUFQLENBQWM7QUFBQzFFLFdBQVEsTUFBSTZGO0FBQWIsQ0FBZDs7QUFBZSxTQUFTQSxrQkFBVCxDQUE0QkMsT0FBNUIsRUFBcUM7QUFDbkQsTUFBSSxDQUFDQSxPQUFMLEVBQWM7QUFDYixXQUFPLEtBQUsxQyxHQUFMLENBQVMsaUNBQVQsQ0FBUDtBQUNBOztBQUNELE1BQUksQ0FBQzBDLFFBQVFSLFFBQWIsRUFBdUI7QUFDdEIsV0FBTyxLQUFLbEMsR0FBTCxDQUFTLG9EQUFULENBQVA7QUFDQTs7QUFDRCxNQUFJLEtBQUtYLGFBQUwsQ0FBbUJzRCxPQUFuQixDQUEyQkQsUUFBUUUsR0FBbkMsTUFBNEMsQ0FBQyxDQUFqRCxFQUFvRDtBQUNuRCxXQUFPLEtBQUs1QyxHQUFMLENBQVMsbUNBQVQsQ0FBUDtBQUNBOztBQUVELE9BQUtYLGFBQUwsQ0FBbUJ3RCxJQUFuQixDQUF3QkgsUUFBUUUsR0FBaEM7QUFFQWpGLFNBQU9tRixLQUFQLENBQWFDLE1BQWIsQ0FBb0I7QUFBRUgsU0FBS0YsUUFBUUU7QUFBZixHQUFwQixFQUEwQztBQUN6Q0ksVUFBTTtBQUNMLDZCQUF1QixLQURsQjtBQUVMLDhCQUF5QixHQUFHTixRQUFRUixRQUFVLE1BRnpDO0FBR0wsMEJBQXFCLEdBQUdRLFFBQVFSLFFBQVUsTUFIckM7QUFJTCw4QkFBd0I7QUFKbkI7QUFEbUMsR0FBMUM7QUFTQSxRQUFNSCxPQUFPakYsV0FBV3FGLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxPQUF4QixDQUFnQztBQUM1Q08sU0FBS0YsUUFBUUU7QUFEK0IsR0FBaEMsQ0FBYjtBQUlBLE9BQUt6QixXQUFMLENBQWlCLGNBQWpCLEVBQWlDWSxJQUFqQztBQUVBLFFBQU1rQixRQUFRbkcsV0FBV3FGLE1BQVgsQ0FBa0JlLEtBQWxCLENBQXdCQyxnQkFBeEIsQ0FBeUNwQixLQUFLRyxRQUE5QyxFQUF3RGtCLEtBQXhELEVBQWQ7QUFFQUgsUUFBTUksT0FBTixDQUFjckIsUUFBUSxLQUFLYixXQUFMLENBQWlCLGVBQWpCLEVBQWtDO0FBQUVhLFFBQUY7QUFBUUQ7QUFBUixHQUFsQyxDQUF0QjtBQUNBLEM7Ozs7Ozs7Ozs7O0FDL0JEdEYsT0FBTzZFLE1BQVAsQ0FBYztBQUFDMUUsV0FBUSxNQUFJMEc7QUFBYixDQUFkOztBQUFlLFNBQVNBLGdCQUFULENBQTBCdkIsSUFBMUIsRUFBZ0NDLElBQWhDLEVBQXNDO0FBQ3BELE9BQUtiLFdBQUwsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRWEsUUFBRjtBQUFRRDtBQUFSLEdBQWxDO0FBQ0EsQzs7Ozs7Ozs7Ozs7QUNGRHRGLE9BQU82RSxNQUFQLENBQWM7QUFBQzFFLFdBQVEsTUFBSTJHO0FBQWIsQ0FBZDs7QUFBZSxTQUFTQSxpQkFBVCxDQUEyQnhCLElBQTNCLEVBQWlDQyxJQUFqQyxFQUF1QztBQUNyRCxPQUFLYixXQUFMLENBQWlCLGFBQWpCLEVBQWdDO0FBQUVhLFFBQUY7QUFBUUQ7QUFBUixHQUFoQztBQUNBLEM7Ozs7Ozs7Ozs7O0FDRkR0RixPQUFPNkUsTUFBUCxDQUFjO0FBQUMxRSxXQUFRLE1BQUk0RztBQUFiLENBQWQ7O0FBQWUsU0FBU0EsYUFBVCxDQUF1QkMsS0FBdkIsRUFBOEI7QUFDNUMsTUFBSUEsTUFBTTFCLElBQU4sS0FBZSxJQUFuQixFQUF5QjtBQUN4QixXQUFPLEtBQUsvQixHQUFMLENBQVMsNEJBQVQsQ0FBUDtBQUNBOztBQUNELE1BQUksQ0FBQ3lELE1BQU0xQixJQUFOLENBQVdHLFFBQWhCLEVBQTBCO0FBQ3pCLFdBQU8sS0FBS2xDLEdBQUwsQ0FBUywrQ0FBVCxDQUFQO0FBQ0E7O0FBQ0QsTUFBSSxLQUFLWCxhQUFMLENBQW1Cc0QsT0FBbkIsQ0FBMkJjLE1BQU0xQixJQUFOLENBQVdhLEdBQXRDLE1BQStDLENBQUMsQ0FBcEQsRUFBdUQ7QUFDdEQsV0FBTyxLQUFLNUMsR0FBTCxDQUFTLDhCQUFULENBQVA7QUFDQTs7QUFFRCxPQUFLWCxhQUFMLENBQW1Cd0QsSUFBbkIsQ0FBd0JZLE1BQU0xQixJQUFOLENBQVdhLEdBQW5DO0FBRUFqRixTQUFPbUYsS0FBUCxDQUFhQyxNQUFiLENBQW9CO0FBQUVILFNBQUthLE1BQU0xQixJQUFOLENBQVdhO0FBQWxCLEdBQXBCLEVBQTZDO0FBQzVDSSxVQUFNO0FBQ0wsNkJBQXVCLEtBRGxCO0FBRUwsOEJBQXlCLEdBQUdTLE1BQU0xQixJQUFOLENBQVdHLFFBQVUsTUFGNUM7QUFHTCwwQkFBcUIsR0FBR3VCLE1BQU0xQixJQUFOLENBQVdHLFFBQVUsTUFIeEM7QUFJTCw4QkFBd0I7QUFKbkI7QUFEc0MsR0FBN0M7QUFTQSxRQUFNSCxPQUFPakYsV0FBV3FGLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxPQUF4QixDQUFnQztBQUM1Q08sU0FBS2EsTUFBTTFCLElBQU4sQ0FBV2E7QUFENEIsR0FBaEMsQ0FBYjtBQUlBLE9BQUt6QixXQUFMLENBQWlCLGNBQWpCLEVBQWlDWSxJQUFqQztBQUVBLFFBQU1rQixRQUFRbkcsV0FBV3FGLE1BQVgsQ0FBa0JlLEtBQWxCLENBQXdCQyxnQkFBeEIsQ0FBeUNwQixLQUFLRyxRQUE5QyxFQUF3RGtCLEtBQXhELEVBQWQ7QUFFQUgsUUFBTUksT0FBTixDQUFjckIsUUFBUSxLQUFLYixXQUFMLENBQWlCLGVBQWpCLEVBQWtDO0FBQUVhLFFBQUY7QUFBUUQ7QUFBUixHQUFsQyxDQUF0QjtBQUNBLEM7Ozs7Ozs7Ozs7O0FDL0JEdEYsT0FBTzZFLE1BQVAsQ0FBYztBQUFDMUUsV0FBUSxNQUFJOEc7QUFBYixDQUFkOztBQUE0QyxJQUFJQyxDQUFKOztBQUFNbEgsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzhHLFFBQUU5RyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEOztBQUVuQyxTQUFTNkcsY0FBVCxDQUF3QjNCLElBQXhCLEVBQThCO0FBQzVDLE9BQUsxQyxhQUFMLEdBQXFCc0UsRUFBRUMsT0FBRixDQUFVLEtBQUt2RSxhQUFmLEVBQThCMEMsS0FBS2EsR0FBbkMsQ0FBckI7QUFFQSxPQUFLekIsV0FBTCxDQUFpQixjQUFqQixFQUFpQztBQUFFWTtBQUFGLEdBQWpDO0FBQ0EsQzs7Ozs7Ozs7Ozs7QUNORHRGLE9BQU82RSxNQUFQLENBQWM7QUFBQzFFLFdBQVEsTUFBSWlIO0FBQWIsQ0FBZDs7QUFBZSxTQUFTQSxtQkFBVCxDQUE2QjFGLE9BQTdCLEVBQXNDMkYsRUFBdEMsRUFBMEM7QUFDeEQsTUFBSUMsbUJBQW1CLEVBQXZCLENBRHdELENBRXhEOztBQUNBLE1BQUlELEdBQUd4RixDQUFILEtBQVMsR0FBYixFQUFrQjtBQUNqQixVQUFNMEYsZ0JBQWdCbEgsV0FBV3FGLE1BQVgsQ0FBa0I4QixhQUFsQixDQUFnQ0MsWUFBaEMsQ0FBNkNKLEdBQUdsQixHQUFoRCxDQUF0QjtBQUNBb0Isa0JBQWNYLE9BQWQsQ0FBdUJjLFlBQUQsSUFBa0I7QUFDdkMsVUFBSUEsYUFBYUMsQ0FBYixDQUFlbEMsUUFBZixLQUE0QjRCLEdBQUc1QixRQUFuQyxFQUE2QztBQUM1QyxjQUFNbUMsV0FBV3ZILFdBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsT0FBeEIsQ0FBZ0M7QUFBRUgsb0JBQVVpQyxhQUFhQyxDQUFiLENBQWVsQztBQUEzQixTQUFoQyxDQUFqQjs7QUFDQSxZQUFJbUMsUUFBSixFQUFjO0FBQ2IsY0FBSUEsU0FBUy9CLE9BQVQsSUFBb0IrQixTQUFTL0IsT0FBVCxDQUFpQkMsR0FBckMsSUFBNEM4QixTQUFTL0IsT0FBVCxDQUFpQkMsR0FBakIsQ0FBcUIrQixJQUFyRSxFQUEyRTtBQUMxRVAsK0JBQW1CTSxTQUFTL0IsT0FBVCxDQUFpQkMsR0FBakIsQ0FBcUIrQixJQUF4QztBQUNBLFdBRkQsTUFFTztBQUNOUCwrQkFBbUJNLFNBQVNuQyxRQUE1QjtBQUNBO0FBQ0QsU0FORCxNQU1PO0FBQ042Qiw2QkFBbUJJLGFBQWFDLENBQWIsQ0FBZWxDLFFBQWxDO0FBQ0E7QUFDRDtBQUNELEtBYkQ7O0FBZUEsUUFBSSxDQUFDNkIsZ0JBQUwsRUFBdUI7QUFDdEI5RCxjQUFRc0UsS0FBUixDQUFjLHFDQUFkO0FBQ0E7QUFDQTtBQUNELEdBckJELE1BcUJPO0FBQ05SLHVCQUFvQixJQUFJRCxHQUFHeEcsSUFBTSxFQUFqQztBQUNBOztBQUVELFFBQU15RSxPQUFPakYsV0FBV3FGLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxPQUF4QixDQUFnQztBQUFFTyxTQUFLekUsUUFBUWlHLENBQVIsQ0FBVXhCO0FBQWpCLEdBQWhDLENBQWI7QUFFQSxPQUFLekIsV0FBTCxDQUFpQixhQUFqQixFQUFnQztBQUFFMkMsUUFBSUMsZ0JBQU47QUFBd0JoQyxRQUF4QjtBQUE4QjVELGFBQVNBLFFBQVFxRztBQUEvQyxHQUFoQztBQUNBLEM7Ozs7Ozs7Ozs7O0FDL0JEL0gsT0FBTzZFLE1BQVAsQ0FBYztBQUFDMUUsV0FBUSxNQUFJNkg7QUFBYixDQUFkOztBQUFlLFNBQVNBLFVBQVQsQ0FBb0IxRCxJQUFwQixFQUEwQjtBQUN4QyxRQUFNZ0IsT0FBT2pGLFdBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsT0FBeEIsQ0FBZ0M7QUFDNUMsd0JBQW9CdEIsS0FBS3VEO0FBRG1CLEdBQWhDLENBQWI7QUFJQTNHLFNBQU9tRixLQUFQLENBQWFDLE1BQWIsQ0FBb0I7QUFBRUgsU0FBS2IsS0FBS2E7QUFBWixHQUFwQixFQUF1QztBQUN0Q0ksVUFBTTtBQUNMMEIsY0FBUTtBQURIO0FBRGdDLEdBQXZDO0FBTUE1SCxhQUFXcUYsTUFBWCxDQUFrQmUsS0FBbEIsQ0FBd0J5QixxQkFBeEIsQ0FBOEM1QyxLQUFLRyxRQUFuRDtBQUNBLEM7Ozs7Ozs7Ozs7O0FDWkR6RixPQUFPNkUsTUFBUCxDQUFjO0FBQUNzRCxnQkFBYSxNQUFJQSxZQUFsQjtBQUErQkMsaUJBQWMsTUFBSUEsYUFBakQ7QUFBK0RDLGVBQVksTUFBSUEsV0FBL0U7QUFBMkZDLGVBQVksTUFBSUEsV0FBM0c7QUFBdUhDLGVBQVksTUFBSUEsV0FBdkk7QUFBbUpDLGtCQUFlLE1BQUlBO0FBQXRLLENBQWQ7QUFBcU0sSUFBSUwsWUFBSjtBQUFpQm5JLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDK0gsbUJBQWEvSCxDQUFiO0FBQWU7O0FBQTNCLENBQXZDLEVBQW9FLENBQXBFO0FBQXVFLElBQUlnSSxhQUFKO0FBQWtCcEksT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGlCQUFSLENBQWIsRUFBd0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNnSSxvQkFBY2hJLENBQWQ7QUFBZ0I7O0FBQTVCLENBQXhDLEVBQXNFLENBQXRFO0FBQXlFLElBQUlpSSxXQUFKO0FBQWdCckksT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ2lJLGtCQUFZakksQ0FBWjtBQUFjOztBQUExQixDQUF0QyxFQUFrRSxDQUFsRTtBQUFxRSxJQUFJa0ksV0FBSjtBQUFnQnRJLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNrSSxrQkFBWWxJLENBQVo7QUFBYzs7QUFBMUIsQ0FBdEMsRUFBa0UsQ0FBbEU7QUFBcUUsSUFBSW1JLFdBQUo7QUFBZ0J2SSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDbUksa0JBQVluSSxDQUFaO0FBQWM7O0FBQTFCLENBQXRDLEVBQWtFLENBQWxFO0FBQXFFLElBQUlvSSxjQUFKO0FBQW1CeEksT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGtCQUFSLENBQWIsRUFBeUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNvSSxxQkFBZXBJLENBQWY7QUFBaUI7O0FBQTdCLENBQXpDLEVBQXdFLENBQXhFLEU7Ozs7Ozs7Ozs7O0FDQTFvQkosT0FBTzZFLE1BQVAsQ0FBYztBQUFDMUUsV0FBUSxNQUFJc0k7QUFBYixDQUFkOztBQUFlLFNBQVNBLG1CQUFULENBQTZCbkUsSUFBN0IsRUFBbUM7QUFDakQsUUFBTWdCLE9BQU9qRixXQUFXcUYsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLE9BQXhCLENBQWdDO0FBQzVDLHdCQUFvQnRCLEtBQUt1RDtBQURtQixHQUFoQyxDQUFiOztBQUlBLE1BQUksQ0FBQ3ZDLElBQUwsRUFBVztBQUNWLFVBQU0sSUFBSTFELEtBQUosQ0FBVyxtQ0FBbUMwQyxLQUFLdUQsSUFBTSxFQUF6RCxDQUFOO0FBQ0E7O0FBRUQsTUFBSXRDLE9BQU9sRixXQUFXcUYsTUFBWCxDQUFrQmUsS0FBbEIsQ0FBd0JpQyxhQUF4QixDQUFzQ3BFLEtBQUtxRSxRQUEzQyxDQUFYOztBQUVBLE1BQUksQ0FBQ3BELElBQUwsRUFBVztBQUNWLFVBQU1xRCxjQUFjdkksV0FBV3dJLFVBQVgsQ0FBc0IsR0FBdEIsRUFBMkJ2RSxLQUFLcUUsUUFBaEMsRUFBMENyRCxLQUFLRyxRQUEvQyxFQUF5RDtBQUFFO0FBQUYsS0FBekQsQ0FBcEI7QUFDQUYsV0FBT2xGLFdBQVdxRixNQUFYLENBQWtCZSxLQUFsQixDQUF3QmIsT0FBeEIsQ0FBZ0M7QUFBRU8sV0FBS3lDLFlBQVlFO0FBQW5CLEtBQWhDLENBQVA7QUFFQSxTQUFLdkYsR0FBTCxDQUFVLEdBQUcrQixLQUFLRyxRQUFVLGlCQUFpQm5CLEtBQUtxRSxRQUFVLEVBQTVEO0FBQ0EsR0FMRCxNQUtPO0FBQ050SSxlQUFXMEksYUFBWCxDQUF5QnhELEtBQUtZLEdBQTlCLEVBQW1DYixJQUFuQztBQUVBLFNBQUsvQixHQUFMLENBQVUsR0FBRytCLEtBQUtHLFFBQVUsZ0JBQWdCRixLQUFLMUUsSUFBTSxFQUF2RDtBQUNBO0FBQ0QsQzs7Ozs7Ozs7Ozs7QUNyQkRiLE9BQU82RSxNQUFQLENBQWM7QUFBQzFFLFdBQVEsTUFBSTZJO0FBQWIsQ0FBZDs7QUFBZSxTQUFTQSxpQkFBVCxDQUEyQjFFLElBQTNCLEVBQWlDO0FBQy9DLFFBQU1nQixPQUFPakYsV0FBV3FGLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxPQUF4QixDQUFnQztBQUM1Qyx3QkFBb0J0QixLQUFLdUQ7QUFEbUIsR0FBaEMsQ0FBYjs7QUFJQSxNQUFJLENBQUN2QyxJQUFMLEVBQVc7QUFDVixVQUFNLElBQUkxRCxLQUFKLENBQVcsbUNBQW1DMEMsS0FBS3VELElBQU0sRUFBekQsQ0FBTjtBQUNBOztBQUVELFFBQU10QyxPQUFPbEYsV0FBV3FGLE1BQVgsQ0FBa0JlLEtBQWxCLENBQXdCaUMsYUFBeEIsQ0FBc0NwRSxLQUFLcUUsUUFBM0MsQ0FBYjs7QUFFQSxNQUFJLENBQUNwRCxJQUFMLEVBQVc7QUFDVixVQUFNLElBQUkzRCxLQUFKLENBQVcsbUNBQW1DMEMsS0FBS3FFLFFBQVUsRUFBN0QsQ0FBTjtBQUNBOztBQUVELE9BQUtwRixHQUFMLENBQVUsR0FBRytCLEtBQUtHLFFBQVUsY0FBY0YsS0FBSzFFLElBQU0sRUFBckQ7QUFDQVIsYUFBVzRJLGtCQUFYLENBQThCMUQsS0FBS1ksR0FBbkMsRUFBd0NiLElBQXhDO0FBQ0EsQzs7Ozs7Ozs7Ozs7QUNqQkR0RixPQUFPNkUsTUFBUCxDQUFjO0FBQUMxRSxXQUFRLE1BQUkrSTtBQUFiLENBQWQ7O0FBQWUsU0FBU0EsaUJBQVQsQ0FBMkI1RSxJQUEzQixFQUFpQztBQUMvQyxRQUFNZ0IsT0FBT2pGLFdBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsT0FBeEIsQ0FBZ0M7QUFDNUMsd0JBQW9CdEIsS0FBS3VEO0FBRG1CLEdBQWhDLENBQWI7O0FBSUEsTUFBSSxDQUFDdkMsSUFBTCxFQUFXO0FBQ1YsVUFBTSxJQUFJMUQsS0FBSixDQUFXLG9DQUFvQzBDLEtBQUt1RCxJQUFNLEVBQTFELENBQU47QUFDQTs7QUFFRCxPQUFLdEUsR0FBTCxDQUFVLEdBQUcrQixLQUFLRyxRQUFVLGtCQUFrQm5CLEtBQUt1RCxJQUFNLE9BQU92RCxLQUFLNkUsT0FBUyxFQUE5RSxFQVQrQyxDQVcvQzs7QUFDQTlJLGFBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QlcsTUFBeEIsQ0FBK0I7QUFBRUgsU0FBS2IsS0FBS2E7QUFBWixHQUEvQixFQUFrRDtBQUNqREksVUFBTTtBQUNMMUYsWUFBTXlELEtBQUs2RSxPQUROO0FBRUwsMEJBQW9CN0UsS0FBSzZFO0FBRnBCO0FBRDJDLEdBQWxEO0FBTUEsQzs7Ozs7Ozs7Ozs7QUNsQkRuSixPQUFPNkUsTUFBUCxDQUFjO0FBQUMxRSxXQUFRLE1BQUlpSjtBQUFiLENBQWQ7O0FBQUE7Ozs7OztBQU1BLE1BQU1DLGdCQUFnQixDQUFDQyxNQUFELEVBQVNDLE1BQVQsS0FBb0I7QUFDekMsUUFBTVQsTUFBTSxDQUFFUSxPQUFPbkQsR0FBVCxFQUFjb0QsT0FBT3BELEdBQXJCLEVBQTJCcUQsSUFBM0IsR0FBa0NDLElBQWxDLENBQXVDLEVBQXZDLENBQVo7QUFFQXBKLGFBQVdxRixNQUFYLENBQWtCZSxLQUFsQixDQUF3QmlELE1BQXhCLENBQStCO0FBQUV2RCxTQUFLMkM7QUFBUCxHQUEvQixFQUE2QztBQUM1Q3ZDLFVBQU07QUFDTGYsaUJBQVcsQ0FBQzhELE9BQU83RCxRQUFSLEVBQWtCOEQsT0FBTzlELFFBQXpCO0FBRE4sS0FEc0M7QUFJNUNrRSxrQkFBYztBQUNiOUgsU0FBRyxHQURVO0FBRWIrSCxZQUFNLENBRk87QUFHYkMsVUFBSSxJQUFJQyxJQUFKO0FBSFM7QUFKOEIsR0FBN0M7QUFXQXpKLGFBQVdxRixNQUFYLENBQWtCOEIsYUFBbEIsQ0FBZ0NrQyxNQUFoQyxDQUF1QztBQUFDWixPQUFEO0FBQU0sYUFBU1MsT0FBT3BEO0FBQXRCLEdBQXZDLEVBQW1FO0FBQ2xFd0Qsa0JBQWM7QUFDYjlJLFlBQU15SSxPQUFPN0QsUUFEQTtBQUViNUQsU0FBRyxHQUZVO0FBR2JrSSxZQUFNLEtBSE87QUFJYjVILGFBQU8sS0FKTTtBQUtiNkgsY0FBUSxDQUxLO0FBTWJyQyxTQUFHO0FBQ0Z4QixhQUFLb0QsT0FBT3BELEdBRFY7QUFFRlYsa0JBQVU4RCxPQUFPOUQ7QUFGZjtBQU5VO0FBRG9ELEdBQW5FO0FBY0FwRixhQUFXcUYsTUFBWCxDQUFrQjhCLGFBQWxCLENBQWdDa0MsTUFBaEMsQ0FBdUM7QUFBQ1osT0FBRDtBQUFNLGFBQVNRLE9BQU9uRDtBQUF0QixHQUF2QyxFQUFtRTtBQUNsRXdELGtCQUFjO0FBQ2I5SSxZQUFNMEksT0FBTzlELFFBREE7QUFFYjVELFNBQUcsR0FGVTtBQUdia0ksWUFBTSxLQUhPO0FBSWI1SCxhQUFPLEtBSk07QUFLYjZILGNBQVEsQ0FMSztBQU1ickMsU0FBRztBQUNGeEIsYUFBS21ELE9BQU9uRCxHQURWO0FBRUZWLGtCQUFVNkQsT0FBTzdEO0FBRmY7QUFOVTtBQURvRCxHQUFuRTtBQWNBLFNBQU87QUFDTlUsU0FBSzJDLEdBREM7QUFFTmpILE9BQUc7QUFGRyxHQUFQO0FBSUEsQ0E5Q0Q7O0FBZ0RlLFNBQVN1SCxpQkFBVCxDQUEyQjlFLElBQTNCLEVBQWlDO0FBQy9DLFFBQU1nQixPQUFPakYsV0FBV3FGLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxPQUF4QixDQUFnQztBQUM1Qyx3QkFBb0J0QixLQUFLdUQ7QUFEbUIsR0FBaEMsQ0FBYjs7QUFJQSxNQUFJLENBQUN2QyxJQUFMLEVBQVc7QUFDVixVQUFNLElBQUkxRCxLQUFKLENBQVcsbUNBQW1DMEMsS0FBS3VELElBQU0sRUFBekQsQ0FBTjtBQUNBOztBQUVELE1BQUl0QyxJQUFKOztBQUVBLE1BQUlqQixLQUFLcUUsUUFBVCxFQUFtQjtBQUNsQnBELFdBQU9sRixXQUFXcUYsTUFBWCxDQUFrQmUsS0FBbEIsQ0FBd0JpQyxhQUF4QixDQUFzQ3BFLEtBQUtxRSxRQUEzQyxDQUFQO0FBQ0EsR0FGRCxNQUVPO0FBQ04sVUFBTXNCLGdCQUFnQjVKLFdBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsT0FBeEIsQ0FBZ0M7QUFDckQsMEJBQW9CdEIsS0FBSzRGO0FBRDRCLEtBQWhDLENBQXRCO0FBSUEzRSxXQUFPOEQsY0FBYy9ELElBQWQsRUFBb0IyRSxhQUFwQixDQUFQO0FBQ0E7O0FBRUQsUUFBTXZJLFVBQVU7QUFDZnFHLFNBQUt6RCxLQUFLNUMsT0FESztBQUVmbUksUUFBSSxJQUFJQyxJQUFKO0FBRlcsR0FBaEI7QUFLQXpKLGFBQVc4SixXQUFYLENBQXVCN0UsSUFBdkIsRUFBNkI1RCxPQUE3QixFQUFzQzZELElBQXRDO0FBQ0EsQzs7Ozs7Ozs7Ozs7QUNqRkR2RixPQUFPNkUsTUFBUCxDQUFjO0FBQUMxRSxXQUFRLE1BQUlpSztBQUFiLENBQWQ7O0FBQWUsU0FBZUEsb0JBQWYsQ0FBb0M5RixJQUFwQztBQUFBLGtDQUEwQztBQUN4RDtBQUNBLFFBQUlnQixPQUFPakYsV0FBV3FGLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxPQUF4QixDQUFnQztBQUMxQyw4QkFBd0J0QixLQUFLbUI7QUFEYSxLQUFoQyxDQUFYLENBRndELENBTXhEOztBQUNBLFFBQUksQ0FBQ0gsSUFBTCxFQUFXO0FBQ1YsV0FBSy9CLEdBQUwsQ0FBVSxlQUFlZSxLQUFLbUIsUUFBVSxlQUFlbkIsS0FBS3VELElBQU0sRUFBbEU7QUFFQSxZQUFNd0MsZUFBZTtBQUNwQnhKLGNBQU15RCxLQUFLdUQsSUFEUztBQUVwQnBDLGtCQUFXLEdBQUduQixLQUFLbUIsUUFBVSxNQUZUO0FBR3BCd0MsZ0JBQVEsUUFIWTtBQUlwQnFDLG1CQUFXLENBSlM7QUFLcEJDLGdCQUFRLElBTFk7QUFNcEJ2SSxjQUFNLE1BTmM7QUFPcEI2RCxpQkFBUztBQUNSQyxlQUFLO0FBQ0pDLHFCQUFTLElBREw7QUFFSjhCLGtCQUFNdkQsS0FBS3VELElBRlA7QUFHSnBDLHNCQUFVbkIsS0FBS21CLFFBSFg7QUFJSitFLHNCQUFVbEcsS0FBS2tHO0FBSlg7QUFERztBQVBXLE9BQXJCO0FBaUJBbEYsYUFBT2pGLFdBQVdxRixNQUFYLENBQWtCQyxLQUFsQixDQUF3QjhFLE1BQXhCLENBQStCSixZQUEvQixDQUFQO0FBQ0EsS0FyQkQsTUFxQk87QUFDTjtBQUNBLFdBQUs5RyxHQUFMLENBQVUsY0FBY2UsS0FBS21CLFFBQVUsZUFBZW5CLEtBQUt1RCxJQUFNLEVBQWpFO0FBRUEzRyxhQUFPbUYsS0FBUCxDQUFhQyxNQUFiLENBQW9CO0FBQUVILGFBQUtiLEtBQUthO0FBQVosT0FBcEIsRUFBdUM7QUFDdENJLGNBQU07QUFDTDBCLGtCQUFRLFFBREg7QUFFTCw4QkFBb0IzRCxLQUFLdUQsSUFGcEI7QUFHTCxrQ0FBd0J2RCxLQUFLbUIsUUFIeEI7QUFJTCxrQ0FBd0JuQixLQUFLa0c7QUFKeEI7QUFEZ0MsT0FBdkM7QUFRQTtBQUNELEdBekNjO0FBQUEsQzs7Ozs7Ozs7Ozs7QUNBZnhLLE9BQU82RSxNQUFQLENBQWM7QUFBQzZGLFdBQVEsTUFBSUE7QUFBYixDQUFkO0FBQXFDLElBQUlBLE9BQUo7QUFBWTFLLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxXQUFSLENBQWIsRUFBa0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNzSyxjQUFRdEssQ0FBUjtBQUFVOztBQUF0QixDQUFsQyxFQUEwRCxDQUExRCxFOzs7Ozs7Ozs7OztBQ0FqRDs7OztBQUtBSixPQUFPMkssT0FBUCxHQUFpQjtBQUNoQixTQUFPO0FBQ045SixVQUFNLGFBREE7QUFFTm1CLFVBQU07QUFGQSxHQURTO0FBS2hCLFNBQU87QUFDTm5CLFVBQU0sY0FEQTtBQUVObUIsVUFBTTtBQUZBLEdBTFM7QUFTaEIsU0FBTztBQUNObkIsVUFBTSxhQURBO0FBRU5tQixVQUFNO0FBRkEsR0FUUztBQWFoQixTQUFPO0FBQ05uQixVQUFNLFlBREE7QUFFTm1CLFVBQU07QUFGQSxHQWJTO0FBaUJoQixTQUFPO0FBQ05uQixVQUFNLGNBREE7QUFFTm1CLFVBQU07QUFGQSxHQWpCUztBQXFCaEIsT0FBSztBQUNKbkIsVUFBTSxlQURGO0FBRUptQixVQUFNO0FBRkYsR0FyQlc7QUF5QmhCLE9BQUs7QUFDSm5CLFVBQU0scUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXpCVztBQTZCaEIsT0FBSztBQUNKbkIsVUFBTSxvQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN0JXO0FBaUNoQixPQUFLO0FBQ0puQixVQUFNLGtCQURGO0FBRUptQixVQUFNO0FBRkYsR0FqQ1c7QUFxQ2hCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXJDVztBQXlDaEIsT0FBSztBQUNKbkIsVUFBTSxlQURGO0FBRUptQixVQUFNO0FBRkYsR0F6Q1c7QUE2Q2hCLE9BQUs7QUFDSm5CLFVBQU0saUJBREY7QUFFSm1CLFVBQU07QUFGRixHQTdDVztBQWlEaEIsT0FBSztBQUNKbkIsVUFBTSxrQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBakRXO0FBcURoQixPQUFLO0FBQ0puQixVQUFNLG1CQURGO0FBRUptQixVQUFNO0FBRkYsR0FyRFc7QUF5RGhCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXpEVztBQTZEaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN0RXO0FBaUVoQixPQUFLO0FBQ0puQixVQUFNLGdCQURGO0FBRUptQixVQUFNO0FBRkYsR0FqRVc7QUFxRWhCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXJFVztBQXlFaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBekVXO0FBNkVoQixPQUFLO0FBQ0puQixVQUFNLGdCQURGO0FBRUptQixVQUFNO0FBRkYsR0E3RVc7QUFpRmhCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQWpGVztBQXFGaEIsT0FBSztBQUNKbkIsVUFBTSxhQURGO0FBRUptQixVQUFNO0FBRkYsR0FyRlc7QUF5RmhCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXpGVztBQTZGaEIsT0FBSztBQUNKbkIsVUFBTSxpQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN0ZXO0FBaUdoQixPQUFLO0FBQ0puQixVQUFNLGdCQURGO0FBRUptQixVQUFNO0FBRkYsR0FqR1c7QUFxR2hCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXJHVztBQXlHaEIsT0FBSztBQUNKbkIsVUFBTSxlQURGO0FBRUptQixVQUFNO0FBRkYsR0F6R1c7QUE2R2hCLE9BQUs7QUFDSm5CLFVBQU0saUJBREY7QUFFSm1CLFVBQU07QUFGRixHQTdHVztBQWlIaEIsT0FBSztBQUNKbkIsVUFBTSxhQURGO0FBRUptQixVQUFNO0FBRkYsR0FqSFc7QUFxSGhCLE9BQUs7QUFDSm5CLFVBQU0sa0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXJIVztBQXlIaEIsT0FBSztBQUNKbkIsVUFBTSxtQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBekhXO0FBNkhoQixPQUFLO0FBQ0puQixVQUFNLGFBREY7QUFFSm1CLFVBQU07QUFGRixHQTdIVztBQWlJaEIsT0FBSztBQUNKbkIsVUFBTSxhQURGO0FBRUptQixVQUFNO0FBRkYsR0FqSVc7QUFxSWhCLE9BQUs7QUFDSm5CLFVBQU0sZUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBcklXO0FBeUloQixPQUFLO0FBQ0puQixVQUFNLGVBREY7QUFFSm1CLFVBQU07QUFGRixHQXpJVztBQTZJaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN0lXO0FBaUpoQixPQUFLO0FBQ0puQixVQUFNLGNBREY7QUFFSm1CLFVBQU07QUFGRixHQWpKVztBQXFKaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBckpXO0FBeUpoQixPQUFLO0FBQ0puQixVQUFNLGlCQURGO0FBRUptQixVQUFNO0FBRkYsR0F6Slc7QUE2SmhCLE9BQUs7QUFDSm5CLFVBQU0sVUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN0pXO0FBaUtoQixPQUFLO0FBQ0puQixVQUFNLFVBREY7QUFFSm1CLFVBQU07QUFGRixHQWpLVztBQXFLaEIsT0FBSztBQUNKbkIsVUFBTSxjQURGO0FBRUptQixVQUFNO0FBRkYsR0FyS1c7QUF5S2hCLE9BQUs7QUFDSm5CLFVBQU0sVUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBektXO0FBNktoQixPQUFLO0FBQ0puQixVQUFNLFlBREY7QUFFSm1CLFVBQU07QUFGRixHQTdLVztBQWlMaEIsT0FBSztBQUNKbkIsVUFBTSxhQURGO0FBRUptQixVQUFNO0FBRkYsR0FqTFc7QUFxTGhCLE9BQUs7QUFDSm5CLFVBQU0sZUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBckxXO0FBeUxoQixPQUFLO0FBQ0puQixVQUFNLGlCQURGO0FBRUptQixVQUFNO0FBRkYsR0F6TFc7QUE2TGhCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQTdMVztBQWlNaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBak1XO0FBcU1oQixPQUFLO0FBQ0puQixVQUFNLGNBREY7QUFFSm1CLFVBQU07QUFGRixHQXJNVztBQXlNaEIsT0FBSztBQUNKbkIsVUFBTSxlQURGO0FBRUptQixVQUFNO0FBRkYsR0F6TVc7QUE2TWhCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQTdNVztBQWlOaEIsT0FBSztBQUNKbkIsVUFBTSxtQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBak5XO0FBcU5oQixPQUFLO0FBQ0puQixVQUFNLGVBREY7QUFFSm1CLFVBQU07QUFGRixHQXJOVztBQXlOaEIsT0FBSztBQUNKbkIsVUFBTSxVQURGO0FBRUptQixVQUFNO0FBRkYsR0F6Tlc7QUE2TmhCLE9BQUs7QUFDSm5CLFVBQU0sYUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN05XO0FBaU9oQixPQUFLO0FBQ0puQixVQUFNLG1CQURGO0FBRUptQixVQUFNO0FBRkYsR0FqT1c7QUFxT2hCLE9BQUs7QUFDSm5CLFVBQU0sa0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXJPVztBQXlPaEIsT0FBSztBQUNKbkIsVUFBTSxhQURGO0FBRUptQixVQUFNO0FBRkYsR0F6T1c7QUE2T2hCLE9BQUs7QUFDSm5CLFVBQU0sV0FERjtBQUVKbUIsVUFBTTtBQUZGLEdBN09XO0FBaVBoQixPQUFLO0FBQ0puQixVQUFNLGtCQURGO0FBRUptQixVQUFNO0FBRkYsR0FqUFc7QUFxUGhCLE9BQUs7QUFDSm5CLFVBQU0sY0FERjtBQUVKbUIsVUFBTTtBQUZGLEdBclBXO0FBeVBoQixPQUFLO0FBQ0puQixVQUFNLGVBREY7QUFFSm1CLFVBQU07QUFGRixHQXpQVztBQTZQaEIsT0FBSztBQUNKbkIsVUFBTSxhQURGO0FBRUptQixVQUFNO0FBRkYsR0E3UFc7QUFpUWhCLE9BQUs7QUFDSm5CLFVBQU0sY0FERjtBQUVKbUIsVUFBTTtBQUZGLEdBalFXO0FBcVFoQixPQUFLO0FBQ0puQixVQUFNLGNBREY7QUFFSm1CLFVBQU07QUFGRixHQXJRVztBQXlRaEIsT0FBSztBQUNKbkIsVUFBTSxXQURGO0FBRUptQixVQUFNO0FBRkYsR0F6UVc7QUE2UWhCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQTdRVztBQWlSaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBalJXO0FBcVJoQixPQUFLO0FBQ0puQixVQUFNLGFBREY7QUFFSm1CLFVBQU07QUFGRixHQXJSVztBQXlSaEIsT0FBSztBQUNKbkIsVUFBTSxrQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBelJXO0FBNlJoQixPQUFLO0FBQ0puQixVQUFNLGlCQURGO0FBRUptQixVQUFNO0FBRkYsR0E3Ulc7QUFpU2hCLE9BQUs7QUFDSm5CLFVBQU0sVUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBalNXO0FBcVNoQixPQUFLO0FBQ0puQixVQUFNLFVBREY7QUFFSm1CLFVBQU07QUFGRixHQXJTVztBQXlTaEIsT0FBSztBQUNKbkIsVUFBTSxlQURGO0FBRUptQixVQUFNO0FBRkYsR0F6U1c7QUE2U2hCLE9BQUs7QUFDSm5CLFVBQU0sZUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN1NXO0FBaVRoQixPQUFLO0FBQ0puQixVQUFNLGVBREY7QUFFSm1CLFVBQU07QUFGRixHQWpUVztBQXFUaEIsT0FBSztBQUNKbkIsVUFBTSxlQURGO0FBRUptQixVQUFNO0FBRkYsR0FyVFc7QUF5VGhCLE9BQUs7QUFDSm5CLFVBQU0sZUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBelRXO0FBNlRoQixPQUFLO0FBQ0puQixVQUFNLFVBREY7QUFFSm1CLFVBQU07QUFGRixHQTdUVztBQWlVaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBalVXO0FBcVVoQixPQUFLO0FBQ0puQixVQUFNLFdBREY7QUFFSm1CLFVBQU07QUFGRixHQXJVVztBQXlVaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBelVXO0FBNlVoQixPQUFLO0FBQ0puQixVQUFNLGFBREY7QUFFSm1CLFVBQU07QUFGRixHQTdVVztBQWlWaEIsT0FBSztBQUNKbkIsVUFBTSxnQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBalZXO0FBcVZoQixPQUFLO0FBQ0puQixVQUFNLGtCQURGO0FBRUptQixVQUFNO0FBRkYsR0FyVlc7QUF5VmhCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXpWVztBQTZWaEIsT0FBSztBQUNKbkIsVUFBTSxzQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN1ZXO0FBaVdoQixPQUFLO0FBQ0puQixVQUFNLHFCQURGO0FBRUptQixVQUFNO0FBRkYsR0FqV1c7QUFxV2hCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXJXVztBQXlXaEIsT0FBSztBQUNKbkIsVUFBTSxvQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBeldXO0FBNldoQixPQUFLO0FBQ0puQixVQUFNLGNBREY7QUFFSm1CLFVBQU07QUFGRixHQTdXVztBQWlYaEIsT0FBSztBQUNKbkIsVUFBTSxpQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBalhXO0FBcVhoQixPQUFLO0FBQ0puQixVQUFNLGtCQURGO0FBRUptQixVQUFNO0FBRkYsR0FyWFc7QUF5WGhCLE9BQUs7QUFDSm5CLFVBQU0sZ0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXpYVztBQTZYaEIsT0FBSztBQUNKbkIsVUFBTSxrQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN1hXO0FBaVloQixPQUFLO0FBQ0puQixVQUFNLG9CQURGO0FBRUptQixVQUFNO0FBRkYsR0FqWVc7QUFxWWhCLE9BQUs7QUFDSm5CLFVBQU0sWUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBcllXO0FBeVloQixPQUFLO0FBQ0puQixVQUFNLGlCQURGO0FBRUptQixVQUFNO0FBRkYsR0F6WVc7QUE2WWhCLE9BQUs7QUFDSm5CLFVBQU0sZUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN1lXO0FBaVpoQixPQUFLO0FBQ0puQixVQUFNLHFCQURGO0FBRUptQixVQUFNO0FBRkYsR0FqWlc7QUFxWmhCLE9BQUs7QUFDSm5CLFVBQU0sc0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXJaVztBQXlaaEIsT0FBSztBQUNKbkIsVUFBTSxtQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBelpXO0FBNlpoQixPQUFLO0FBQ0puQixVQUFNLG1CQURGO0FBRUptQixVQUFNO0FBRkYsR0E3Wlc7QUFpYWhCLE9BQUs7QUFDSm5CLFVBQU0sc0JBREY7QUFFSm1CLFVBQU07QUFGRixHQWphVztBQXFhaEIsT0FBSztBQUNKbkIsVUFBTSxrQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBcmFXO0FBeWFoQixPQUFLO0FBQ0puQixVQUFNLG1CQURGO0FBRUptQixVQUFNO0FBRkYsR0F6YVc7QUE2YWhCLE9BQUs7QUFDSm5CLFVBQU0sYUFERjtBQUVKbUIsVUFBTTtBQUZGLEdBN2FXO0FBaWJoQixPQUFLO0FBQ0puQixVQUFNLG9CQURGO0FBRUptQixVQUFNO0FBRkYsR0FqYlc7QUFxYmhCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXJiVztBQXliaEIsT0FBSztBQUNKbkIsVUFBTSxtQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBemJXO0FBNmJoQixPQUFLO0FBQ0puQixVQUFNLG9CQURGO0FBRUptQixVQUFNO0FBRkYsR0E3Ylc7QUFpY2hCLE9BQUs7QUFDSm5CLFVBQU0sc0JBREY7QUFFSm1CLFVBQU07QUFGRixHQWpjVztBQXFjaEIsT0FBSztBQUNKbkIsVUFBTSxtQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBcmNXO0FBeWNoQixPQUFLO0FBQ0puQixVQUFNLG9CQURGO0FBRUptQixVQUFNO0FBRkYsR0F6Y1c7QUE2Y2hCLE9BQUs7QUFDSm5CLFVBQU0sc0JBREY7QUFFSm1CLFVBQU07QUFGRixHQTdjVztBQWlkaEIsT0FBSztBQUNKbkIsVUFBTSxZQURGO0FBRUptQixVQUFNO0FBRkYsR0FqZFc7QUFxZGhCLE9BQUs7QUFDSm5CLFVBQU0sbUJBREY7QUFFSm1CLFVBQU07QUFGRixHQXJkVztBQXlkaEIsT0FBSztBQUNKbkIsVUFBTSxpQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBemRXO0FBNmRoQixPQUFLO0FBQ0puQixVQUFNLG9CQURGO0FBRUptQixVQUFNO0FBRkYsR0E3ZFc7QUFpZWhCLE9BQUs7QUFDSm5CLFVBQU0sb0JBREY7QUFFSm1CLFVBQU07QUFGRixHQWplVztBQXFlaEIsT0FBSztBQUNKbkIsVUFBTSxtQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBcmVXO0FBeWVoQixPQUFLO0FBQ0puQixVQUFNLGtCQURGO0FBRUptQixVQUFNO0FBRkYsR0F6ZVc7QUE2ZWhCLE9BQUs7QUFDSm5CLFVBQU0sc0JBREY7QUFFSm1CLFVBQU07QUFGRixHQTdlVztBQWlmaEIsT0FBSztBQUNKbkIsVUFBTSxvQkFERjtBQUVKbUIsVUFBTTtBQUZGLEdBamZXO0FBcWZoQixPQUFLO0FBQ0puQixVQUFNLGdCQURGO0FBRUptQixVQUFNO0FBRkYsR0FyZlc7QUF5ZmhCLE9BQUs7QUFDSm5CLFVBQU0sc0JBREY7QUFFSm1CLFVBQU07QUFGRixHQXpmVztBQTZmaEIsT0FBSztBQUNKbkIsVUFBTSxvQkFERjtBQUVKbUIsVUFBTTtBQUZGO0FBN2ZXLENBQWpCLEM7Ozs7Ozs7Ozs7O0FDTEEsSUFBSTRJLEdBQUo7QUFBUTVLLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxLQUFSLENBQWIsRUFBNEI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUN3SyxVQUFJeEssQ0FBSjtBQUFNOztBQUFsQixDQUE1QixFQUFnRCxDQUFoRDtBQUFtRCxJQUFJeUssSUFBSjtBQUFTN0ssT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE1BQVIsQ0FBYixFQUE2QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ3lLLFdBQUt6SyxDQUFMO0FBQU87O0FBQW5CLENBQTdCLEVBQWtELENBQWxEO0FBQXFELElBQUkwSyxZQUFKO0FBQWlCOUssT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDNEssZUFBYTFLLENBQWIsRUFBZTtBQUFDMEssbUJBQWExSyxDQUFiO0FBQWU7O0FBQWhDLENBQS9CLEVBQWlFLENBQWpFO0FBQW9FLElBQUkySyxZQUFKO0FBQWlCL0ssT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGdCQUFSLENBQWIsRUFBdUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUMySyxtQkFBYTNLLENBQWI7QUFBZTs7QUFBM0IsQ0FBdkMsRUFBb0UsQ0FBcEU7QUFBdUUsSUFBSXFDLG1CQUFKO0FBQXdCekMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFSLENBQWIsRUFBOEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNxQywwQkFBb0JyQyxDQUFwQjtBQUFzQjs7QUFBbEMsQ0FBOUMsRUFBa0YsQ0FBbEY7QUFBcUYsSUFBSXNDLG9CQUFKO0FBQXlCMUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHdCQUFSLENBQWIsRUFBK0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNzQywyQkFBcUJ0QyxDQUFyQjtBQUF1Qjs7QUFBbkMsQ0FBL0MsRUFBb0YsQ0FBcEY7O0FBUzVhLE1BQU1zSyxPQUFOLENBQWM7QUFDYi9ILGNBQVluQyxNQUFaLEVBQW9CO0FBQ25CLFNBQUtBLE1BQUwsR0FBY0EsTUFBZCxDQURtQixDQUduQjs7QUFDQSxTQUFLd0ssYUFBTCxHQUFxQixFQUFyQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsS0FBcEIsQ0FMbUIsQ0FPbkI7O0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixJQUFwQixDQVJtQixDQVVuQjs7QUFDQSxTQUFLQyxhQUFMLEdBQXFCLElBQUlDLE1BQUosQ0FBVyxFQUFYLENBQXJCO0FBRUE7QUFFRDs7Ozs7QUFHQUMsZ0JBQWM7QUFDYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFJVixJQUFJVyxNQUFSLEVBQWQ7QUFDQSxTQUFLRCxNQUFMLENBQVlFLFVBQVo7QUFDQSxTQUFLRixNQUFMLENBQVlHLFdBQVosQ0FBd0IsT0FBeEI7QUFDQSxTQUFLSCxNQUFMLENBQVlJLFlBQVosQ0FBeUIsSUFBekI7QUFDQSxTQUFLSixNQUFMLENBQVl2SCxVQUFaLENBQXVCLEtBQXZCO0FBRUEsU0FBS3VILE1BQUwsQ0FBWW5JLEVBQVosQ0FBZSxNQUFmLEVBQXVCLEtBQUt3SSxpQkFBTCxDQUF1QjNILElBQXZCLENBQTRCLElBQTVCLENBQXZCO0FBRUEsU0FBS3NILE1BQUwsQ0FBWW5JLEVBQVosQ0FBZSxTQUFmLEVBQTBCLEtBQUt5SSxTQUFMLENBQWU1SCxJQUFmLENBQW9CLElBQXBCLENBQTFCO0FBQ0EsU0FBS3NILE1BQUwsQ0FBWW5JLEVBQVosQ0FBZSxPQUFmLEVBQXlCMEksR0FBRCxJQUFTckksUUFBUUQsR0FBUixDQUFZLG9CQUFaLEVBQWtDc0ksR0FBbEMsQ0FBakM7QUFDQSxTQUFLUCxNQUFMLENBQVluSSxFQUFaLENBQWUsU0FBZixFQUEwQixNQUFNLEtBQUtJLEdBQUwsQ0FBUyxTQUFULENBQWhDO0FBQ0EsU0FBSytILE1BQUwsQ0FBWW5JLEVBQVosQ0FBZSxPQUFmLEVBQXdCLE1BQU0sS0FBS0ksR0FBTCxDQUFTLG1CQUFULENBQTlCLEVBYmEsQ0FjYjs7QUFDQSxTQUFLSixFQUFMLENBQVEsb0JBQVIsRUFBOEIsS0FBSzJJLGtCQUFMLENBQXdCOUgsSUFBeEIsQ0FBNkIsSUFBN0IsQ0FBOUI7QUFDQTtBQUVEOzs7OztBQUdBVCxNQUFJN0IsT0FBSixFQUFhO0FBQ1o4QixZQUFRRCxHQUFSLENBQWEsaUJBQWlCN0IsT0FBUyxFQUF2QztBQUNBO0FBRUQ7Ozs7O0FBR0F3QixhQUFXO0FBQ1YsU0FBS0ssR0FBTCxDQUFVLGtCQUFrQixLQUFLL0MsTUFBTCxDQUFZQyxNQUFaLENBQW1CRSxJQUFNLElBQUksS0FBS0gsTUFBTCxDQUFZQyxNQUFaLENBQW1CRyxJQUFNLEVBQWxGOztBQUVBLFFBQUksQ0FBQyxLQUFLMEssTUFBVixFQUFrQjtBQUNqQixXQUFLRCxXQUFMO0FBQ0E7O0FBRUQsU0FBS0MsTUFBTCxDQUFZUyxPQUFaLENBQW9CLEtBQUt2TCxNQUFMLENBQVlDLE1BQVosQ0FBbUJHLElBQXZDLEVBQTZDLEtBQUtKLE1BQUwsQ0FBWUMsTUFBWixDQUFtQkUsSUFBaEU7QUFDQTtBQUVEOzs7OztBQUdBMkMsZUFBYTtBQUNaLFNBQUtDLEdBQUwsQ0FBUyw0QkFBVDs7QUFFQSxRQUFJLEtBQUsrSCxNQUFULEVBQWlCO0FBQ2hCLFdBQUtBLE1BQUwsQ0FBWVUsT0FBWjtBQUNBLFdBQUtWLE1BQUwsR0FBY1csU0FBZDtBQUNBOztBQUNELFNBQUtoQixZQUFMLEdBQW9CLEtBQXBCO0FBQ0EsU0FBS0QsYUFBTCxHQUFxQixFQUFyQjtBQUNBO0FBRUQ7Ozs7O0FBR0FZLGNBQVk7QUFDWCxTQUFLckksR0FBTCxDQUFTLHFDQUFUO0FBRUEsU0FBSzJJLEtBQUwsQ0FBVztBQUNWdkksZUFBUyxNQURDO0FBRVZDLGtCQUFZLENBQUUsS0FBS3BELE1BQUwsQ0FBWU8sU0FBWixDQUFzQkMsS0FBeEIsRUFBK0IsTUFBL0IsRUFBdUMsUUFBdkM7QUFGRixLQUFYO0FBS0EsU0FBS2tMLEtBQUwsQ0FBVztBQUNWdkksZUFBUyxRQURDO0FBQ1NDLGtCQUFZLENBQUUsS0FBS3BELE1BQUwsQ0FBWUMsTUFBWixDQUFtQkksSUFBckIsQ0FEckI7QUFFVnNMLGVBQVMsS0FBSzNMLE1BQUwsQ0FBWUMsTUFBWixDQUFtQks7QUFGbEIsS0FBWDtBQUlBO0FBRUQ7Ozs7O0FBR0FvTCxRQUFNdkksT0FBTixFQUFlO0FBQ2QsUUFBSXlJLFNBQVN6SSxRQUFRMEksTUFBUixHQUFrQixJQUFJMUksUUFBUTBJLE1BQVEsR0FBdEMsR0FBMkMsRUFBeEQ7QUFDQUQsY0FBVXpJLFFBQVFBLE9BQWxCOztBQUVBLFFBQUlBLFFBQVFDLFVBQVIsSUFBc0JELFFBQVFDLFVBQVIsQ0FBbUIwSSxNQUFuQixHQUE0QixDQUF0RCxFQUF5RDtBQUN4REYsZ0JBQVcsSUFBSXpJLFFBQVFDLFVBQVIsQ0FBbUI2RixJQUFuQixDQUF3QixHQUF4QixDQUE4QixFQUE3QztBQUNBOztBQUVELFFBQUk5RixRQUFRd0ksT0FBWixFQUFxQjtBQUNwQkMsZ0JBQVcsS0FBS3pJLFFBQVF3SSxPQUFTLEVBQWpDO0FBQ0E7O0FBRUQsU0FBSzVJLEdBQUwsQ0FBVSxvQkFBb0I2SSxNQUFRLEVBQXRDO0FBRUEsV0FBTyxLQUFLZCxNQUFMLENBQVlZLEtBQVosQ0FBbUIsR0FBR0UsTUFBUSxNQUE5QixDQUFQO0FBQ0E7QUFFRDs7Ozs7Ozs7O0FBT0FULG9CQUFrQlksS0FBbEIsRUFBeUI7QUFDeEIsUUFBSSxPQUFRQSxLQUFSLEtBQW1CLFFBQXZCLEVBQWlDO0FBQ2hDLFdBQUtwQixhQUFMLElBQXNCb0IsS0FBdEI7QUFDQSxLQUZELE1BRU87QUFDTixXQUFLcEIsYUFBTCxHQUFxQkMsT0FBT29CLE1BQVAsQ0FBYyxDQUFDLEtBQUtyQixhQUFOLEVBQXFCb0IsS0FBckIsQ0FBZCxDQUFyQjtBQUNBOztBQUVELFVBQU1FLFFBQVEsS0FBS3RCLGFBQUwsQ0FBbUJ1QixRQUFuQixHQUE4QkMsS0FBOUIsQ0FBb0MsbUJBQXBDLENBQWQsQ0FQd0IsQ0FPZ0Q7QUFFeEU7O0FBQ0EsUUFBSUYsTUFBTUcsR0FBTixFQUFKLEVBQWlCO0FBQ2hCO0FBQ0EsS0FadUIsQ0FjeEI7OztBQUNBLFNBQUt6QixhQUFMLEdBQXFCLElBQUlDLE1BQUosQ0FBVyxFQUFYLENBQXJCO0FBRUFxQixVQUFNN0YsT0FBTixDQUFlaUcsSUFBRCxJQUFVO0FBQ3ZCLFVBQUlBLEtBQUtQLE1BQUwsSUFBZSxDQUFDTyxLQUFLQyxVQUFMLENBQWdCLElBQWhCLENBQXBCLEVBQTJDO0FBQzFDLGNBQU1DLGdCQUFnQmhDLGFBQWE4QixJQUFiLENBQXRCOztBQUVBLFlBQUlwSyxvQkFBb0JzSyxjQUFjcEosT0FBbEMsQ0FBSixFQUFnRDtBQUMvQyxlQUFLSixHQUFMLENBQVUsMEJBQTBCc0osSUFBTSxFQUExQztBQUVBLGdCQUFNbEosVUFBVWxCLG9CQUFvQnNLLGNBQWNwSixPQUFsQyxFQUEyQ3FKLElBQTNDLENBQWdELElBQWhELEVBQXNERCxhQUF0RCxDQUFoQjs7QUFFQSxjQUFJcEosT0FBSixFQUFhO0FBQ1osaUJBQUtKLEdBQUwsQ0FBVSxtQ0FBbUMwSixLQUFLQyxTQUFMLENBQWV2SixPQUFmLENBQXlCLEVBQXRFO0FBQ0EsaUJBQUtnQixJQUFMLENBQVUsYUFBVixFQUF5QmhCLE9BQXpCO0FBQ0E7QUFDRCxTQVRELE1BU087QUFDTixlQUFLSixHQUFMLENBQVUsMkJBQTJCMEosS0FBS0MsU0FBTCxDQUFlSCxhQUFmLENBQStCLEVBQXBFO0FBQ0E7QUFDRDtBQUNELEtBakJEO0FBa0JBO0FBRUQ7Ozs7Ozs7OztBQU9BakIscUJBQW1CbkksT0FBbkIsRUFBNEJDLFVBQTVCLEVBQXdDO0FBQ3ZDLFFBQUlsQixxQkFBcUJpQixPQUFyQixDQUFKLEVBQW1DO0FBQ2xDLFdBQUtKLEdBQUwsQ0FBVSwyQkFBMkJJLE9BQVMsRUFBOUM7QUFFQWpCLDJCQUFxQmlCLE9BQXJCLEVBQThCcUosSUFBOUIsQ0FBbUMsSUFBbkMsRUFBeUNwSixVQUF6QztBQUVBLEtBTEQsTUFLTztBQUNOLFdBQUtMLEdBQUwsQ0FBVSw0QkFBNEIwSixLQUFLQyxTQUFMLENBQWV2SixPQUFmLENBQXlCLEVBQS9EO0FBQ0E7QUFDRDs7QUF4S1k7O0FBMktka0gsS0FBS3NDLFFBQUwsQ0FBY3pDLE9BQWQsRUFBdUJJLFlBQXZCO0FBcExBOUssT0FBTzRFLGFBQVAsQ0FzTGU4RixPQXRMZixFOzs7Ozs7Ozs7OztBQ0FBLFNBQVMwQyxZQUFULENBQXNCeEosVUFBdEIsRUFBa0M7QUFDakMsUUFBTTtBQUFFL0MsUUFBRjtBQUFRZ0YsYUFBUztBQUFFQyxXQUFLO0FBQUUrQixZQUFGO0FBQVFwQztBQUFSO0FBQVA7QUFBakIsTUFBaUQ3QixVQUF2RDtBQUVBLE9BQUtzSSxLQUFMLENBQVc7QUFDVkcsWUFBUSxLQUFLN0wsTUFBTCxDQUFZQyxNQUFaLENBQW1CSSxJQURqQjtBQUVWOEMsYUFBUyxNQUZDO0FBRU9DLGdCQUFZLENBQUVpRSxJQUFGLEVBQVEsQ0FBUixFQUFXcEMsUUFBWCxFQUFxQixpQkFBckIsRUFBd0MsQ0FBeEMsRUFBMkMsSUFBM0MsQ0FGbkI7QUFHVjBHLGFBQVN0TDtBQUhDLEdBQVg7QUFLQTs7QUFFRCxTQUFTd00sV0FBVCxDQUFxQnpKLFVBQXJCLEVBQWlDO0FBQ2hDLFFBQU07QUFDTDJCLFVBQU07QUFBRTFFLFlBQU04SDtBQUFSLEtBREQ7QUFFTHJELFVBQU07QUFBRU8sZUFBUztBQUFFQyxhQUFLO0FBQUUrQjtBQUFGO0FBQVA7QUFBWDtBQUZELE1BR0ZqRSxVQUhKO0FBS0EsT0FBS3NJLEtBQUwsQ0FBVztBQUNWRyxZQUFRLEtBQUs3TCxNQUFMLENBQVlDLE1BQVosQ0FBbUJJLElBRGpCO0FBRVY4QyxhQUFTLE9BRkM7QUFFUUMsZ0JBQVksQ0FBRyxJQUFJK0UsUUFBVSxFQUFqQixDQUZwQjtBQUdWd0QsYUFBU3RFO0FBSEMsR0FBWDtBQUtBOztBQUVELFNBQVNPLGFBQVQsQ0FBdUJ4RSxVQUF2QixFQUFtQztBQUNsQyxRQUFNO0FBQ0wyQixVQUFNO0FBQUUxRSxZQUFNOEg7QUFBUixLQUREO0FBRUxyRCxVQUFNO0FBQUVPLGVBQVM7QUFBRUMsYUFBSztBQUFFK0I7QUFBRjtBQUFQO0FBQVg7QUFGRCxNQUdGakUsVUFISjtBQUtBLE9BQUtzSSxLQUFMLENBQVc7QUFDVkcsWUFBUXhFLElBREU7QUFFVmxFLGFBQVMsTUFGQztBQUVPQyxnQkFBWSxDQUFHLElBQUkrRSxRQUFVLEVBQWpCO0FBRm5CLEdBQVg7QUFJQTs7QUFFRCxTQUFTTixXQUFULENBQXFCekUsVUFBckIsRUFBaUM7QUFDaEMsUUFBTTtBQUNMMkIsVUFBTTtBQUFFMUUsWUFBTThIO0FBQVIsS0FERDtBQUVMckQsVUFBTTtBQUFFTyxlQUFTO0FBQUVDLGFBQUs7QUFBRStCO0FBQUY7QUFBUDtBQUFYO0FBRkQsTUFHRmpFLFVBSEo7QUFLQSxPQUFLc0ksS0FBTCxDQUFXO0FBQ1ZHLFlBQVF4RSxJQURFO0FBRVZsRSxhQUFTLE1BRkM7QUFFT0MsZ0JBQVksQ0FBRyxJQUFJK0UsUUFBVSxFQUFqQjtBQUZuQixHQUFYO0FBSUE7O0FBRUQsU0FBU0osV0FBVCxDQUFxQjNFLFVBQXJCLEVBQWlDO0FBQ2hDLFFBQU07QUFDTDBCLFVBQU07QUFBRU8sZUFBUztBQUFFQyxhQUFLO0FBQUUrQjtBQUFGO0FBQVA7QUFBWCxLQUREO0FBRUxSLE1BRks7QUFHTDNGO0FBSEssTUFJRmtDLFVBSko7QUFNQSxPQUFLc0ksS0FBTCxDQUFXO0FBQ1ZHLFlBQVF4RSxJQURFO0FBRVZsRSxhQUFTLFNBRkM7QUFFVUMsZ0JBQVksQ0FBRXlELEVBQUYsQ0FGdEI7QUFHVjhFLGFBQVN6SztBQUhDLEdBQVg7QUFLQTs7QUFFRCxTQUFTeUcsWUFBVCxDQUFzQnZFLFVBQXRCLEVBQWtDO0FBQ2pDLFFBQU07QUFDTDBCLFVBQU07QUFBRU8sZUFBUztBQUFFQyxhQUFLO0FBQUUrQjtBQUFGO0FBQVA7QUFBWDtBQURELE1BRUZqRSxVQUZKO0FBSUEsT0FBS3NJLEtBQUwsQ0FBVztBQUNWRyxZQUFReEUsSUFERTtBQUVWbEUsYUFBUztBQUZDLEdBQVg7QUFJQTs7QUF0RUQzRCxPQUFPNEUsYUFBUCxDQXdFZTtBQUFFd0ksY0FBRjtBQUFnQkMsYUFBaEI7QUFBNkJqRixlQUE3QjtBQUE0Q0MsYUFBNUM7QUFBeURFLGFBQXpEO0FBQXNFSjtBQUF0RSxDQXhFZixFOzs7Ozs7Ozs7OztBQ0FBOzs7O0FBS0EsTUFBTW1GLFdBQVdwTixRQUFRLFNBQVIsQ0FBakI7QUFFQTs7Ozs7Ozs7OztBQVFBRixPQUFPMkssT0FBUCxHQUFpQixTQUFTSSxZQUFULENBQXNCOEIsSUFBdEIsRUFBNEI7QUFDNUMsUUFBTW5MLFVBQVUsRUFBaEI7QUFDQSxNQUFJNkwsS0FBSixDQUY0QyxDQUk1Qzs7QUFDQUEsVUFBUVYsS0FBS1UsS0FBTCxDQUFXLGFBQVgsQ0FBUjs7QUFDQSxNQUFJQSxLQUFKLEVBQVc7QUFDVjdMLFlBQVEySyxNQUFSLEdBQWlCa0IsTUFBTSxDQUFOLENBQWpCO0FBQ0FWLFdBQU9BLEtBQUtXLE9BQUwsQ0FBYSxXQUFiLEVBQTBCLEVBQTFCLENBQVA7QUFDQUQsWUFBUTdMLFFBQVEySyxNQUFSLENBQWVrQixLQUFmLENBQXFCLGlEQUFyQixDQUFSOztBQUNBLFFBQUlBLEtBQUosRUFBVztBQUNWN0wsY0FBUW1HLElBQVIsR0FBZTBGLE1BQU0sQ0FBTixDQUFmO0FBQ0E3TCxjQUFRNEQsSUFBUixHQUFlaUksTUFBTSxDQUFOLENBQWY7QUFDQTdMLGNBQVFmLElBQVIsR0FBZTRNLE1BQU0sQ0FBTixDQUFmO0FBQ0EsS0FKRCxNQUlPO0FBQ043TCxjQUFRakIsTUFBUixHQUFpQmlCLFFBQVEySyxNQUF6QjtBQUNBO0FBQ0QsR0FqQjJDLENBbUI1Qzs7O0FBQ0FrQixVQUFRVixLQUFLVSxLQUFMLENBQVcsWUFBWCxDQUFSO0FBQ0E3TCxVQUFRaUMsT0FBUixHQUFrQjRKLE1BQU0sQ0FBTixDQUFsQjtBQUNBN0wsVUFBUStMLFVBQVIsR0FBcUJGLE1BQU0sQ0FBTixDQUFyQjtBQUNBN0wsVUFBUWdNLFdBQVIsR0FBc0IsUUFBdEI7QUFDQWIsU0FBT0EsS0FBS1csT0FBTCxDQUFhLFVBQWIsRUFBeUIsRUFBekIsQ0FBUDs7QUFFQSxNQUFJRixTQUFTNUwsUUFBUStMLFVBQWpCLENBQUosRUFBa0M7QUFDakMvTCxZQUFRaUMsT0FBUixHQUFrQjJKLFNBQVM1TCxRQUFRK0wsVUFBakIsRUFBNkI1TSxJQUEvQztBQUNBYSxZQUFRZ00sV0FBUixHQUFzQkosU0FBUzVMLFFBQVErTCxVQUFqQixFQUE2QnpMLElBQW5EO0FBQ0E7O0FBRUROLFVBQVE0QyxJQUFSLEdBQWUsRUFBZjtBQUNBLE1BQUlxSixNQUFKO0FBQ0EsTUFBSUMsUUFBSixDQWpDNEMsQ0FtQzVDOztBQUNBLE1BQUlmLEtBQUtnQixNQUFMLENBQVksU0FBWixNQUEyQixDQUFDLENBQWhDLEVBQW1DO0FBQ2xDTixZQUFRVixLQUFLVSxLQUFMLENBQVcsc0JBQVgsQ0FBUjtBQUNBSSxhQUFTSixNQUFNLENBQU4sRUFBU08sU0FBVCxFQUFUO0FBQ0FGLGVBQVdMLE1BQU0sQ0FBTixDQUFYO0FBQ0EsR0FKRCxNQUlPO0FBQ05JLGFBQVNkLElBQVQ7QUFDQTs7QUFFRCxNQUFJYyxPQUFPckIsTUFBWCxFQUFtQjtBQUNsQjVLLFlBQVE0QyxJQUFSLEdBQWVxSixPQUFPaEIsS0FBUCxDQUFhLElBQWIsQ0FBZjtBQUNBOztBQUVELE1BQUksT0FBUWlCLFFBQVIsS0FBc0IsV0FBdEIsSUFBcUNBLFNBQVN0QixNQUFsRCxFQUEwRDtBQUN6RDVLLFlBQVE0QyxJQUFSLENBQWE4QixJQUFiLENBQWtCd0gsUUFBbEI7QUFDQTs7QUFFRCxTQUFPbE0sT0FBUDtBQUNBLENBckRELEM7Ozs7Ozs7Ozs7O0FDZkEsU0FBU3FNLElBQVQsR0FBZ0I7QUFDZixPQUFLeEssR0FBTCxDQUFTLGdEQUFUO0FBRUEsT0FBS3lILGFBQUwsQ0FBbUI1RSxJQUFuQixDQUF3QixNQUF4QjtBQUNBOztBQUVELFNBQVM0SCxNQUFULENBQWdCakIsYUFBaEIsRUFBK0I7QUFDOUIsT0FBS3hKLEdBQUwsQ0FBUyxvREFBVDtBQUVBLE9BQUsySCxZQUFMLEdBQW9CNkIsY0FBY1YsTUFBbEM7QUFFQSxPQUFLckIsYUFBTCxDQUFtQjVFLElBQW5CLENBQXdCLFFBQXhCO0FBQ0E7O0FBRUQsU0FBUzZILElBQVQsR0FBZ0I7QUFDZixNQUFJLENBQUMsS0FBS2hELFlBQU4sSUFBc0IsS0FBS0QsYUFBTCxDQUFtQnNCLE1BQW5CLEtBQThCLENBQXhELEVBQTJEO0FBQzFELFNBQUsvSSxHQUFMLENBQVMsb0RBQVQ7QUFFQSxTQUFLMEgsWUFBTCxHQUFvQixJQUFwQjtBQUVBLFNBQUt0RyxJQUFMLENBQVUsWUFBVjtBQUNBOztBQUVELE9BQUt1SCxLQUFMLENBQVc7QUFDVkcsWUFBUSxLQUFLN0wsTUFBTCxDQUFZQyxNQUFaLENBQW1CSSxJQURqQjtBQUVWOEMsYUFBUyxNQUZDO0FBR1ZDLGdCQUFZLENBQUUsS0FBS3BELE1BQUwsQ0FBWUMsTUFBWixDQUFtQkksSUFBckI7QUFIRixHQUFYO0FBS0E7O0FBRUQsU0FBU3FOLElBQVQsQ0FBY25CLGFBQWQsRUFBNkI7QUFDNUIsTUFBSXBKLE9BQUosQ0FENEIsQ0FHNUI7QUFDQTs7QUFDQSxNQUFJb0osY0FBY1YsTUFBZCxLQUF5QixLQUFLbkIsWUFBbEMsRUFBZ0Q7QUFDL0N2SCxjQUFVO0FBQ1RVLGtCQUFZLGdCQURIO0FBRVRDLFlBQU07QUFDTHVELGNBQU1rRixjQUFjekksSUFBZCxDQUFtQixDQUFuQixDQUREO0FBRUxtQixrQkFBVXNILGNBQWN6SSxJQUFkLENBQW1CLENBQW5CLENBRkw7QUFHTDNELGNBQU1vTSxjQUFjekksSUFBZCxDQUFtQixDQUFuQixDQUhEO0FBSUx6RCxjQUFNa00sY0FBY3pJLElBQWQsQ0FBbUIsQ0FBbkI7QUFKRDtBQUZHLEtBQVY7QUFTQSxHQVZELE1BVU87QUFBRTtBQUNSWCxjQUFVO0FBQ1RVLGtCQUFZLGFBREg7QUFFVEMsWUFBTTtBQUNMdUQsY0FBTWtGLGNBQWNsRixJQURmO0FBRUxzQixpQkFBUzRELGNBQWN6SSxJQUFkLENBQW1CLENBQW5CO0FBRko7QUFGRyxLQUFWO0FBT0E7O0FBRUQsU0FBT1gsT0FBUDtBQUNBOztBQUVELFNBQVN3SyxJQUFULENBQWNwQixhQUFkLEVBQTZCO0FBQzVCLFFBQU1wSixVQUFVO0FBQ2ZVLGdCQUFZLGVBREc7QUFFZkMsVUFBTTtBQUNMcUUsZ0JBQVVvRSxjQUFjekksSUFBZCxDQUFtQixDQUFuQixFQUFzQjhKLFNBQXRCLENBQWdDLENBQWhDLENBREw7QUFFTHZHLFlBQU1rRixjQUFjVjtBQUZmO0FBRlMsR0FBaEI7QUFRQSxTQUFPMUksT0FBUDtBQUNBOztBQUVELFNBQVMwSyxJQUFULENBQWN0QixhQUFkLEVBQTZCO0FBQzVCLFFBQU1wSixVQUFVO0FBQ2ZVLGdCQUFZLGFBREc7QUFFZkMsVUFBTTtBQUNMcUUsZ0JBQVVvRSxjQUFjekksSUFBZCxDQUFtQixDQUFuQixFQUFzQjhKLFNBQXRCLENBQWdDLENBQWhDLENBREw7QUFFTHZHLFlBQU1rRixjQUFjVjtBQUZmO0FBRlMsR0FBaEI7QUFRQSxTQUFPMUksT0FBUDtBQUNBOztBQUVELFNBQVMySyxPQUFULENBQWlCdkIsYUFBakIsRUFBZ0M7QUFDL0IsUUFBTXBKLFVBQVU7QUFDZlUsZ0JBQVksYUFERztBQUVmQyxVQUFNO0FBQ0x1RCxZQUFNa0YsY0FBY1YsTUFEZjtBQUVMM0ssZUFBU3FMLGNBQWN6SSxJQUFkLENBQW1CLENBQW5CO0FBRko7QUFGUyxHQUFoQjs7QUFRQSxNQUFJeUksY0FBY3pJLElBQWQsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsTUFBNkIsR0FBakMsRUFBc0M7QUFDckNYLFlBQVFXLElBQVIsQ0FBYXFFLFFBQWIsR0FBd0JvRSxjQUFjekksSUFBZCxDQUFtQixDQUFuQixFQUFzQjhKLFNBQXRCLENBQWdDLENBQWhDLENBQXhCO0FBQ0EsR0FGRCxNQUVPO0FBQ056SyxZQUFRVyxJQUFSLENBQWE0RixhQUFiLEdBQTZCNkMsY0FBY3pJLElBQWQsQ0FBbUIsQ0FBbkIsQ0FBN0I7QUFDQTs7QUFFRCxTQUFPWCxPQUFQO0FBQ0E7O0FBRUQsU0FBUzRLLElBQVQsQ0FBY3hCLGFBQWQsRUFBNkI7QUFDNUIsUUFBTXBKLFVBQVU7QUFDZlUsZ0JBQVksY0FERztBQUVmQyxVQUFNO0FBQ0x1RCxZQUFNa0YsY0FBY1Y7QUFEZjtBQUZTLEdBQWhCO0FBT0EsU0FBTzFJLE9BQVA7QUFDQTs7QUE3R0QzRCxPQUFPNEUsYUFBUCxDQStHZTtBQUFFbUosTUFBRjtBQUFRQyxRQUFSO0FBQWdCQyxNQUFoQjtBQUFzQkMsTUFBdEI7QUFBNEJDLE1BQTVCO0FBQWtDRSxNQUFsQztBQUF3Q0MsU0FBeEM7QUFBaURDO0FBQWpELENBL0dmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfaXJjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJyaWRnZSBmcm9tICcuL2lyYy1icmlkZ2UnO1xuXG5pZiAoISFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSVJDX0VuYWJsZWQnKSA9PT0gdHJ1ZSkge1xuXHQvLyBOb3JtYWxpemUgdGhlIGNvbmZpZyB2YWx1ZXNcblx0Y29uc3QgY29uZmlnID0ge1xuXHRcdHNlcnZlcjoge1xuXHRcdFx0cHJvdG9jb2w6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJUkNfUHJvdG9jb2wnKSxcblx0XHRcdGhvc3Q6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJUkNfSG9zdCcpLFxuXHRcdFx0cG9ydDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0lSQ19Qb3J0JyksXG5cdFx0XHRuYW1lOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSVJDX05hbWUnKSxcblx0XHRcdGRlc2NyaXB0aW9uOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSVJDX0Rlc2NyaXB0aW9uJylcblx0XHR9LFxuXHRcdHBhc3N3b3Jkczoge1xuXHRcdFx0bG9jYWw6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJUkNfTG9jYWxfUGFzc3dvcmQnKSxcblx0XHRcdHBlZXI6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJUkNfUGVlcl9QYXNzd29yZCcpXG5cdFx0fVxuXHR9O1xuXG5cdE1ldGVvci5pcmNCcmlkZ2UgPSBuZXcgQnJpZGdlKGNvbmZpZyk7XG5cblx0TWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRcdE1ldGVvci5pcmNCcmlkZ2UuaW5pdCgpO1xuXHR9KTtcbn1cbiIsImltcG9ydCBCcmlkZ2UgZnJvbSAnLi4vaXJjLWJyaWRnZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0cmVzZXRJcmNDb25uZWN0aW9uKCkge1xuXHRcdGNvbnN0IGlyY0VuYWJsZWQgPSAoISFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSVJDX0VuYWJsZWQnKSkgPT09IHRydWU7XG5cblx0XHRpZiAoTWV0ZW9yLmlyY0JyaWRnZSkge1xuXHRcdFx0TWV0ZW9yLmlyY0JyaWRnZS5zdG9wKCk7XG5cdFx0XHRpZiAoIWlyY0VuYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRtZXNzYWdlOiAnQ29ubmVjdGlvbl9DbG9zZWQnLFxuXHRcdFx0XHRcdHBhcmFtczogW11cblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaXJjRW5hYmxlZCkge1xuXHRcdFx0aWYgKE1ldGVvci5pcmNCcmlkZ2UpIHtcblx0XHRcdFx0TWV0ZW9yLmlyY0JyaWRnZS5pbml0KCk7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0bWVzc2FnZTogJ0Nvbm5lY3Rpb25fUmVzZXQnLFxuXHRcdFx0XHRcdHBhcmFtczogW11cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gTm9ybWFsaXplIHRoZSBjb25maWcgdmFsdWVzXG5cdFx0XHRjb25zdCBjb25maWcgPSB7XG5cdFx0XHRcdHNlcnZlcjoge1xuXHRcdFx0XHRcdHByb3RvY29sOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSVJDX1Byb3RvY29sJyksXG5cdFx0XHRcdFx0aG9zdDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0lSQ19Ib3N0JyksXG5cdFx0XHRcdFx0cG9ydDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0lSQ19Qb3J0JyksXG5cdFx0XHRcdFx0bmFtZTogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0lSQ19OYW1lJyksXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJUkNfRGVzY3JpcHRpb24nKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwYXNzd29yZHM6IHtcblx0XHRcdFx0XHRsb2NhbDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0lSQ19Mb2NhbF9QYXNzd29yZCcpLFxuXHRcdFx0XHRcdHBlZXI6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJUkNfUGVlcl9QYXNzd29yZCcpXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdE1ldGVvci5pcmNCcmlkZ2UgPSBuZXcgQnJpZGdlKGNvbmZpZyk7XG5cdFx0XHRNZXRlb3IuaXJjQnJpZGdlLmluaXQoKTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bWVzc2FnZTogJ0Nvbm5lY3Rpb25fUmVzZXQnLFxuXHRcdFx0XHRwYXJhbXM6IFtdXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IodCgnSVJDX0ZlZGVyYXRpb25fRGlzYWJsZWQnKSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0lSQ19GZWRlcmF0aW9uJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ0lSQ19FbmFibGVkJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGkxOG5MYWJlbDogJ0VuYWJsZWQnLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnSVJDX0VuYWJsZWQnLFxuXHRcdFx0YWxlcnQ6ICdJUkNfRW5hYmxlZF9BbGVydCdcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdJUkNfUHJvdG9jb2wnLCAnUkZDMjgxMycsIHtcblx0XHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdFx0aTE4bkxhYmVsOiAnUHJvdG9jb2wnLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnSVJDX1Byb3RvY29sJyxcblx0XHRcdHZhbHVlczogW1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0a2V5OiAnUkZDMjgxMycsXG5cdFx0XHRcdFx0aTE4bkxhYmVsOiAnUkZDMjgxMydcblx0XHRcdFx0fVxuXHRcdFx0XVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ0lSQ19Ib3N0JywgJ2xvY2FsaG9zdCcsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0aTE4bkxhYmVsOiAnSG9zdCcsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdJUkNfSG9zdCdcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdJUkNfUG9ydCcsIDY2NjcsIHtcblx0XHRcdHR5cGU6ICdpbnQnLFxuXHRcdFx0aTE4bkxhYmVsOiAnUG9ydCcsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdJUkNfUG9ydCdcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdJUkNfTmFtZScsICdpcmMucm9ja2V0LmNoYXQnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGkxOG5MYWJlbDogJ05hbWUnLFxuXHRcdFx0aTE4bkRlc2NyaXB0aW9uOiAnSVJDX05hbWUnXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnSVJDX0Rlc2NyaXB0aW9uJywgJ1JvY2tldC5DaGF0IElSQyBCcmlkZ2UnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGkxOG5MYWJlbDogJ0Rlc2NyaXB0aW9uJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0lSQ19EZXNjcmlwdGlvbidcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdJUkNfTG9jYWxfUGFzc3dvcmQnLCAncGFzc3dvcmQnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGkxOG5MYWJlbDogJ0xvY2FsX1Bhc3N3b3JkJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0lSQ19Mb2NhbF9QYXNzd29yZCdcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdJUkNfUGVlcl9QYXNzd29yZCcsICdwYXNzd29yZCcsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0aTE4bkxhYmVsOiAnUGVlcl9QYXNzd29yZCcsXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdJUkNfUGVlcl9QYXNzd29yZCdcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdJUkNfUmVzZXRfQ29ubmVjdGlvbicsICdyZXNldElyY0Nvbm5lY3Rpb24nLCB7XG5cdFx0XHR0eXBlOiAnYWN0aW9uJyxcblx0XHRcdGFjdGlvblRleHQ6ICdSZXNldF9Db25uZWN0aW9uJyxcblx0XHRcdGkxOG5MYWJlbDogJ1Jlc2V0X0Nvbm5lY3Rpb24nXG5cdFx0fSk7XG5cdH0pO1xufSk7XG4iLCJpbXBvcnQgUXVldWUgZnJvbSAncXVldWUtZmlmbyc7XG5pbXBvcnQgKiBhcyBzZXJ2ZXJzIGZyb20gJy4uL3NlcnZlcnMnO1xuaW1wb3J0ICogYXMgcGVlckNvbW1hbmRIYW5kbGVycyBmcm9tICcuL3BlZXJIYW5kbGVycyc7XG5pbXBvcnQgKiBhcyBsb2NhbENvbW1hbmRIYW5kbGVycyBmcm9tICcuL2xvY2FsSGFuZGxlcnMnO1xuXG5jbGFzcyBCcmlkZ2Uge1xuXHRjb25zdHJ1Y3Rvcihjb25maWcpIHtcblx0XHQvLyBHZW5lcmFsXG5cdFx0dGhpcy5jb25maWcgPSBjb25maWc7XG5cblx0XHQvLyBXb3JrYXJvdW5kIGZvciBSb2NrZXQuQ2hhdCBjYWxsYmFja3MgYmVpbmcgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG5cdFx0dGhpcy5sb2dnZWRJblVzZXJzID0gW107XG5cblx0XHQvLyBTZXJ2ZXJcblx0XHRjb25zdCBTZXJ2ZXIgPSBzZXJ2ZXJzW3RoaXMuY29uZmlnLnNlcnZlci5wcm90b2NvbF07XG5cblx0XHR0aGlzLnNlcnZlciA9IG5ldyBTZXJ2ZXIodGhpcy5jb25maWcpO1xuXG5cdFx0dGhpcy5zZXR1cFBlZXJIYW5kbGVycygpO1xuXHRcdHRoaXMuc2V0dXBMb2NhbEhhbmRsZXJzKCk7XG5cblx0XHQvLyBDb21tYW5kIHF1ZXVlXG5cdFx0dGhpcy5xdWV1ZSA9IG5ldyBRdWV1ZSgpO1xuXHRcdHRoaXMucXVldWVUaW1lb3V0ID0gNTtcblx0fVxuXG5cdGluaXQoKSB7XG5cdFx0dGhpcy5sb2dnZWRJblVzZXJzID0gW107XG5cdFx0dGhpcy5zZXJ2ZXIucmVnaXN0ZXIoKTtcblxuXHRcdHRoaXMuc2VydmVyLm9uKCdyZWdpc3RlcmVkJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5sb2dRdWV1ZSgnU3RhcnRpbmcuLi4nKTtcblxuXHRcdFx0dGhpcy5ydW5RdWV1ZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0c3RvcCgpIHtcblx0XHR0aGlzLnNlcnZlci5kaXNjb25uZWN0KCk7XG5cdH1cblxuXHQvKipcblx0ICogTG9nIGhlbHBlclxuXHQgKi9cblx0bG9nKG1lc3NhZ2UpIHtcblx0XHRjb25zb2xlLmxvZyhgW2lyY11bYnJpZGdlXSAkeyBtZXNzYWdlIH1gKTtcblx0fVxuXG5cdGxvZ1F1ZXVlKG1lc3NhZ2UpIHtcblx0XHRjb25zb2xlLmxvZyhgW2lyY11bYnJpZGdlXVtxdWV1ZV0gJHsgbWVzc2FnZSB9YCk7XG5cdH1cblxuXHQvKipcblx0ICpcblx0ICpcblx0ICogUXVldWVcblx0ICpcblx0ICpcblx0ICovXG5cdG9uTWVzc2FnZVJlY2VpdmVkKGZyb20sIGNvbW1hbmQsIC4uLnBhcmFtZXRlcnMpIHtcblx0XHR0aGlzLnF1ZXVlLmVucXVldWUoeyBmcm9tLCBjb21tYW5kLCBwYXJhbWV0ZXJzIH0pO1xuXHR9XG5cblx0YXN5bmMgcnVuUXVldWUoKSB7XG5cdFx0Ly8gSWYgaXQgaXMgZW1wdHksIHNraXAgYW5kIGtlZXAgdGhlIHF1ZXVlIGdvaW5nXG5cdFx0aWYgKHRoaXMucXVldWUuaXNFbXB0eSgpKSB7XG5cdFx0XHRyZXR1cm4gc2V0VGltZW91dCh0aGlzLnJ1blF1ZXVlLmJpbmQodGhpcyksIHRoaXMucXVldWVUaW1lb3V0KTtcblx0XHR9XG5cblx0XHQvLyBHZXQgdGhlIGNvbW1hbmRcblx0XHRjb25zdCBpdGVtID0gdGhpcy5xdWV1ZS5kZXF1ZXVlKCk7XG5cblx0XHR0aGlzLmxvZ1F1ZXVlKGBQcm9jZXNzaW5nIFwiJHsgaXRlbS5jb21tYW5kIH1cIiBjb21tYW5kIGZyb20gXCIkeyBpdGVtLmZyb20gfVwiYCk7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGNvbW1hbmQgYWNjb3JkaW5nbHlcblx0XHRzd2l0Y2ggKGl0ZW0uZnJvbSkge1xuXHRcdFx0Y2FzZSAnbG9jYWwnOlxuXHRcdFx0XHRpZiAoIWxvY2FsQ29tbWFuZEhhbmRsZXJzW2l0ZW0uY29tbWFuZF0pIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kIGhhbmRsZXIgZm9yIGxvY2FsOiR7IGl0ZW0uY29tbWFuZCB9YCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhd2FpdCBsb2NhbENvbW1hbmRIYW5kbGVyc1tpdGVtLmNvbW1hbmRdLmFwcGx5KHRoaXMsIGl0ZW0ucGFyYW1ldGVycyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAncGVlcic6XG5cdFx0XHRcdGlmICghcGVlckNvbW1hbmRIYW5kbGVyc1tpdGVtLmNvbW1hbmRdKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBoYW5kbGVyIGZvciBwZWVyOiR7IGl0ZW0uY29tbWFuZCB9YCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhd2FpdCBwZWVyQ29tbWFuZEhhbmRsZXJzW2l0ZW0uY29tbWFuZF0uYXBwbHkodGhpcywgaXRlbS5wYXJhbWV0ZXJzKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0Ly8gS2VlcCB0aGUgcXVldWUgZ29pbmdcblx0XHRzZXRUaW1lb3V0KHRoaXMucnVuUXVldWUuYmluZCh0aGlzKSwgdGhpcy5xdWV1ZVRpbWVvdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqXG5cdCAqXG5cdCAqIFBlZXJcblx0ICpcblx0ICpcblx0ICovXG5cdHNldHVwUGVlckhhbmRsZXJzKCkge1xuXHRcdHRoaXMuc2VydmVyLm9uKCdwZWVyQ29tbWFuZCcsIChjbWQpID0+IHtcblx0XHRcdHRoaXMub25NZXNzYWdlUmVjZWl2ZWQoJ3BlZXInLCBjbWQuaWRlbnRpZmllciwgY21kLmFyZ3MpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqXG5cdCAqXG5cdCAqIExvY2FsXG5cdCAqXG5cdCAqXG5cdCAqL1xuXHRzZXR1cExvY2FsSGFuZGxlcnMoKSB7XG5cdFx0Ly8gQXV0aFxuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJWYWxpZGF0ZUxvZ2luJywgdGhpcy5vbk1lc3NhZ2VSZWNlaXZlZC5iaW5kKHRoaXMsICdsb2NhbCcsICdvbkxvZ2luJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2lyYy1vbi1sb2dpbicpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJDcmVhdGVVc2VyJywgdGhpcy5vbk1lc3NhZ2VSZWNlaXZlZC5iaW5kKHRoaXMsICdsb2NhbCcsICdvbkNyZWF0ZVVzZXInKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnaXJjLW9uLWNyZWF0ZS11c2VyJyk7XG5cdFx0Ly8gSm9pbmluZyByb29tcyBvciBjaGFubmVsc1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJDcmVhdGVDaGFubmVsJywgdGhpcy5vbk1lc3NhZ2VSZWNlaXZlZC5iaW5kKHRoaXMsICdsb2NhbCcsICdvbkNyZWF0ZVJvb20nKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnaXJjLW9uLWNyZWF0ZS1jaGFubmVsJyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckNyZWF0ZVJvb20nLCB0aGlzLm9uTWVzc2FnZVJlY2VpdmVkLmJpbmQodGhpcywgJ2xvY2FsJywgJ29uQ3JlYXRlUm9vbScpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdpcmMtb24tY3JlYXRlLXJvb20nKTtcblx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVySm9pblJvb20nLCB0aGlzLm9uTWVzc2FnZVJlY2VpdmVkLmJpbmQodGhpcywgJ2xvY2FsJywgJ29uSm9pblJvb20nKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnaXJjLW9uLWpvaW4tcm9vbScpO1xuXHRcdC8vIExlYXZpbmcgcm9vbXMgb3IgY2hhbm5lbHNcblx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyTGVhdmVSb29tJywgdGhpcy5vbk1lc3NhZ2VSZWNlaXZlZC5iaW5kKHRoaXMsICdsb2NhbCcsICdvbkxlYXZlUm9vbScpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdpcmMtb24tbGVhdmUtcm9vbScpO1xuXHRcdC8vIENoYXR0aW5nXG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgdGhpcy5vbk1lc3NhZ2VSZWNlaXZlZC5iaW5kKHRoaXMsICdsb2NhbCcsICdvblNhdmVNZXNzYWdlJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2lyYy1vbi1zYXZlLW1lc3NhZ2UnKTtcblx0XHQvLyBMZWF2aW5nXG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckxvZ291dENsZWFuVXAnLCB0aGlzLm9uTWVzc2FnZVJlY2VpdmVkLmJpbmQodGhpcywgJ2xvY2FsJywgJ29uTG9nb3V0JyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2lyYy1vbi1sb2dvdXQnKTtcblx0fVxuXG5cdHNlbmRDb21tYW5kKGNvbW1hbmQsIHBhcmFtZXRlcnMpIHtcblx0XHR0aGlzLnNlcnZlci5lbWl0KCdvblJlY2VpdmVGcm9tTG9jYWwnLCBjb21tYW5kLCBwYXJhbWV0ZXJzKTtcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBCcmlkZ2U7XG4iLCJpbXBvcnQgb25DcmVhdGVSb29tIGZyb20gJy4vb25DcmVhdGVSb29tJztcbmltcG9ydCBvbkpvaW5Sb29tIGZyb20gJy4vb25Kb2luUm9vbSc7XG5pbXBvcnQgb25MZWF2ZVJvb20gZnJvbSAnLi9vbkxlYXZlUm9vbSc7XG5pbXBvcnQgb25Mb2dpbiBmcm9tICcuL29uTG9naW4nO1xuaW1wb3J0IG9uTG9nb3V0IGZyb20gJy4vb25Mb2dvdXQnO1xuaW1wb3J0IG9uU2F2ZU1lc3NhZ2UgZnJvbSAnLi9vblNhdmVNZXNzYWdlJztcbmltcG9ydCBvbkNyZWF0ZVVzZXIgZnJvbSAnLi9vbkNyZWF0ZVVzZXInO1xuXG5leHBvcnQgeyBvbkNyZWF0ZVJvb20sIG9uSm9pblJvb20sIG9uTGVhdmVSb29tLCBvbkxvZ2luLCBvbkxvZ291dCwgb25TYXZlTWVzc2FnZSwgb25DcmVhdGVVc2VyIH07XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBoYW5kbGVPbkNyZWF0ZVJvb20odXNlciwgcm9vbSkge1xuXHRpZiAoIXJvb20udXNlcm5hbWVzKSB7XG5cdFx0cmV0dXJuIHRoaXMubG9nKGBSb29tICR7IHJvb20ubmFtZSB9IGRvZXMgbm90IGhhdmUgYSB2YWxpZCBsaXN0IG9mIHVzZXJuYW1lc2ApO1xuXHR9XG5cblx0Zm9yIChjb25zdCB1c2VybmFtZSBvZiByb29tLnVzZXJuYW1lcykge1xuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHsgdXNlcm5hbWUgfSk7XG5cblx0XHRpZiAodXNlci5wcm9maWxlLmlyYy5mcm9tSVJDKSB7XG5cdFx0XHR0aGlzLnNlbmRDb21tYW5kKCdqb2luQ2hhbm5lbCcsIHsgcm9vbSwgdXNlciB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZW5kQ29tbWFuZCgnam9pbmVkQ2hhbm5lbCcsIHsgcm9vbSwgdXNlciB9KTtcblx0XHR9XG5cdH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhhbmRsZU9uQ3JlYXRlVXNlcihuZXdVc2VyKSB7XG5cdGlmICghbmV3VXNlcikge1xuXHRcdHJldHVybiB0aGlzLmxvZygnSW52YWxpZCBoYW5kbGVPbkNyZWF0ZVVzZXIgY2FsbCcpO1xuXHR9XG5cdGlmICghbmV3VXNlci51c2VybmFtZSkge1xuXHRcdHJldHVybiB0aGlzLmxvZygnSW52YWxpZCBoYW5kbGVPbkNyZWF0ZVVzZXIgY2FsbCAoTWlzc2luZyB1c2VybmFtZSknKTtcblx0fVxuXHRpZiAodGhpcy5sb2dnZWRJblVzZXJzLmluZGV4T2YobmV3VXNlci5faWQpICE9PSAtMSkge1xuXHRcdHJldHVybiB0aGlzLmxvZygnRHVwbGljYXRlIGhhbmRsZU9uQ3JlYXRlVXNlciBjYWxsJyk7XG5cdH1cblxuXHR0aGlzLmxvZ2dlZEluVXNlcnMucHVzaChuZXdVc2VyLl9pZCk7XG5cblx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh7IF9pZDogbmV3VXNlci5faWQgfSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCdwcm9maWxlLmlyYy5mcm9tSVJDJzogZmFsc2UsXG5cdFx0XHQncHJvZmlsZS5pcmMudXNlcm5hbWUnOiBgJHsgbmV3VXNlci51c2VybmFtZSB9LXJrdGAsXG5cdFx0XHQncHJvZmlsZS5pcmMubmljayc6IGAkeyBuZXdVc2VyLnVzZXJuYW1lIH0tcmt0YCxcblx0XHRcdCdwcm9maWxlLmlyYy5ob3N0bmFtZSc6ICdyb2NrZXQuY2hhdCdcblx0XHR9XG5cdH0pO1xuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHRfaWQ6IG5ld1VzZXIuX2lkXG5cdH0pO1xuXG5cdHRoaXMuc2VuZENvbW1hbmQoJ3JlZ2lzdGVyVXNlcicsIHVzZXIpO1xuXG5cdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZFdpdGhVc2VybmFtZSh1c2VyLnVzZXJuYW1lKS5mZXRjaCgpO1xuXG5cdHJvb21zLmZvckVhY2gocm9vbSA9PiB0aGlzLnNlbmRDb21tYW5kKCdqb2luZWRDaGFubmVsJywgeyByb29tLCB1c2VyIH0pKTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhhbmRsZU9uSm9pblJvb20odXNlciwgcm9vbSkge1xuXHR0aGlzLnNlbmRDb21tYW5kKCdqb2luZWRDaGFubmVsJywgeyByb29tLCB1c2VyIH0pO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaGFuZGxlT25MZWF2ZVJvb20odXNlciwgcm9vbSkge1xuXHR0aGlzLnNlbmRDb21tYW5kKCdsZWZ0Q2hhbm5lbCcsIHsgcm9vbSwgdXNlciB9KTtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhhbmRsZU9uTG9naW4obG9naW4pIHtcblx0aWYgKGxvZ2luLnVzZXIgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gdGhpcy5sb2coJ0ludmFsaWQgaGFuZGxlT25Mb2dpbiBjYWxsJyk7XG5cdH1cblx0aWYgKCFsb2dpbi51c2VyLnVzZXJuYW1lKSB7XG5cdFx0cmV0dXJuIHRoaXMubG9nKCdJbnZhbGlkIGhhbmRsZU9uTG9naW4gY2FsbCAoTWlzc2luZyB1c2VybmFtZSknKTtcblx0fVxuXHRpZiAodGhpcy5sb2dnZWRJblVzZXJzLmluZGV4T2YobG9naW4udXNlci5faWQpICE9PSAtMSkge1xuXHRcdHJldHVybiB0aGlzLmxvZygnRHVwbGljYXRlIGhhbmRsZU9uTG9naW4gY2FsbCcpO1xuXHR9XG5cblx0dGhpcy5sb2dnZWRJblVzZXJzLnB1c2gobG9naW4udXNlci5faWQpO1xuXG5cdE1ldGVvci51c2Vycy51cGRhdGUoeyBfaWQ6IGxvZ2luLnVzZXIuX2lkIH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHQncHJvZmlsZS5pcmMuZnJvbUlSQyc6IGZhbHNlLFxuXHRcdFx0J3Byb2ZpbGUuaXJjLnVzZXJuYW1lJzogYCR7IGxvZ2luLnVzZXIudXNlcm5hbWUgfS1ya3RgLFxuXHRcdFx0J3Byb2ZpbGUuaXJjLm5pY2snOiBgJHsgbG9naW4udXNlci51c2VybmFtZSB9LXJrdGAsXG5cdFx0XHQncHJvZmlsZS5pcmMuaG9zdG5hbWUnOiAncm9ja2V0LmNoYXQnXG5cdFx0fVxuXHR9KTtcblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0X2lkOiBsb2dpbi51c2VyLl9pZFxuXHR9KTtcblxuXHR0aGlzLnNlbmRDb21tYW5kKCdyZWdpc3RlclVzZXInLCB1c2VyKTtcblxuXHRjb25zdCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRXaXRoVXNlcm5hbWUodXNlci51c2VybmFtZSkuZmV0Y2goKTtcblxuXHRyb29tcy5mb3JFYWNoKHJvb20gPT4gdGhpcy5zZW5kQ29tbWFuZCgnam9pbmVkQ2hhbm5lbCcsIHsgcm9vbSwgdXNlciB9KSk7XG59XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaGFuZGxlT25Mb2dvdXQodXNlcikge1xuXHR0aGlzLmxvZ2dlZEluVXNlcnMgPSBfLndpdGhvdXQodGhpcy5sb2dnZWRJblVzZXJzLCB1c2VyLl9pZCk7XG5cblx0dGhpcy5zZW5kQ29tbWFuZCgnZGlzY29ubmVjdGVkJywgeyB1c2VyIH0pO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaGFuZGxlT25TYXZlTWVzc2FnZShtZXNzYWdlLCB0bykge1xuXHRsZXQgdG9JZGVudGlmaWNhdGlvbiA9ICcnO1xuXHQvLyBEaXJlY3QgbWVzc2FnZVxuXHRpZiAodG8udCA9PT0gJ2QnKSB7XG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9ucyA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkKHRvLl9pZCk7XG5cdFx0c3Vic2NyaXB0aW9ucy5mb3JFYWNoKChzdWJzY3JpcHRpb24pID0+IHtcblx0XHRcdGlmIChzdWJzY3JpcHRpb24udS51c2VybmFtZSAhPT0gdG8udXNlcm5hbWUpIHtcblx0XHRcdFx0Y29uc3QgdXNlckRhdGEgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHsgdXNlcm5hbWU6IHN1YnNjcmlwdGlvbi51LnVzZXJuYW1lIH0pO1xuXHRcdFx0XHRpZiAodXNlckRhdGEpIHtcblx0XHRcdFx0XHRpZiAodXNlckRhdGEucHJvZmlsZSAmJiB1c2VyRGF0YS5wcm9maWxlLmlyYyAmJiB1c2VyRGF0YS5wcm9maWxlLmlyYy5uaWNrKSB7XG5cdFx0XHRcdFx0XHR0b0lkZW50aWZpY2F0aW9uID0gdXNlckRhdGEucHJvZmlsZS5pcmMubmljaztcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dG9JZGVudGlmaWNhdGlvbiA9IHVzZXJEYXRhLnVzZXJuYW1lO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0b0lkZW50aWZpY2F0aW9uID0gc3Vic2NyaXB0aW9uLnUudXNlcm5hbWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmICghdG9JZGVudGlmaWNhdGlvbikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignW2lyY11bc2VydmVyXSBUYXJnZXQgdXNlciBub3QgZm91bmQnKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0dG9JZGVudGlmaWNhdGlvbiA9IGAjJHsgdG8ubmFtZSB9YDtcblx0fVxuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHsgX2lkOiBtZXNzYWdlLnUuX2lkIH0pO1xuXG5cdHRoaXMuc2VuZENvbW1hbmQoJ3NlbnRNZXNzYWdlJywgeyB0bzogdG9JZGVudGlmaWNhdGlvbiwgdXNlciwgbWVzc2FnZTogbWVzc2FnZS5tc2cgfSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBoYW5kbGVRVUlUKGFyZ3MpIHtcblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdCdwcm9maWxlLmlyYy5uaWNrJzogYXJncy5uaWNrXG5cdH0pO1xuXG5cdE1ldGVvci51c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHRzdGF0dXM6ICdvZmZsaW5lJ1xuXHRcdH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucmVtb3ZlVXNlcm5hbWVGcm9tQWxsKHVzZXIudXNlcm5hbWUpO1xufVxuIiwiaW1wb3J0IGRpc2Nvbm5lY3RlZCBmcm9tICcuL2Rpc2Nvbm5lY3RlZCc7XG5pbXBvcnQgam9pbmVkQ2hhbm5lbCBmcm9tICcuL2pvaW5lZENoYW5uZWwnO1xuaW1wb3J0IGxlZnRDaGFubmVsIGZyb20gJy4vbGVmdENoYW5uZWwnO1xuaW1wb3J0IG5pY2tDaGFuZ2VkIGZyb20gJy4vbmlja0NoYW5nZWQnO1xuaW1wb3J0IHNlbnRNZXNzYWdlIGZyb20gJy4vc2VudE1lc3NhZ2UnO1xuaW1wb3J0IHVzZXJSZWdpc3RlcmVkIGZyb20gJy4vdXNlclJlZ2lzdGVyZWQnO1xuXG5leHBvcnQgeyBkaXNjb25uZWN0ZWQsIGpvaW5lZENoYW5uZWwsIGxlZnRDaGFubmVsLCBuaWNrQ2hhbmdlZCwgc2VudE1lc3NhZ2UsIHVzZXJSZWdpc3RlcmVkIH07XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBoYW5kbGVKb2luZWRDaGFubmVsKGFyZ3MpIHtcblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdCdwcm9maWxlLmlyYy5uaWNrJzogYXJncy5uaWNrXG5cdH0pO1xuXG5cdGlmICghdXNlcikge1xuXHRcdHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbmQgYSB1c2VyIHdpdGggbmljayAkeyBhcmdzLm5pY2sgfWApO1xuXHR9XG5cblx0bGV0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKGFyZ3Mucm9vbU5hbWUpO1xuXG5cdGlmICghcm9vbSkge1xuXHRcdGNvbnN0IGNyZWF0ZWRSb29tID0gUm9ja2V0Q2hhdC5jcmVhdGVSb29tKCdjJywgYXJncy5yb29tTmFtZSwgdXNlci51c2VybmFtZSwgWyAvKiB1c2VybmFtZXMgb2YgdGhlIHBhcnRpY2lwYW50cyBoZXJlICovXSk7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUoeyBfaWQ6IGNyZWF0ZWRSb29tLnJpZCB9KTtcblxuXHRcdHRoaXMubG9nKGAkeyB1c2VyLnVzZXJuYW1lIH0gY3JlYXRlZCByb29tICR7IGFyZ3Mucm9vbU5hbWUgfWApO1xuXHR9IGVsc2Uge1xuXHRcdFJvY2tldENoYXQuYWRkVXNlclRvUm9vbShyb29tLl9pZCwgdXNlcik7XG5cblx0XHR0aGlzLmxvZyhgJHsgdXNlci51c2VybmFtZSB9IGpvaW5lZCByb29tICR7IHJvb20ubmFtZSB9YCk7XG5cdH1cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGhhbmRsZUxlZnRDaGFubmVsKGFyZ3MpIHtcblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdCdwcm9maWxlLmlyYy5uaWNrJzogYXJncy5uaWNrXG5cdH0pO1xuXG5cdGlmICghdXNlcikge1xuXHRcdHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbmQgYSB1c2VyIHdpdGggbmljayAkeyBhcmdzLm5pY2sgfWApO1xuXHR9XG5cblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoYXJncy5yb29tTmFtZSk7XG5cblx0aWYgKCFyb29tKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBhIHJvb20gd2l0aCBuYW1lICR7IGFyZ3Mucm9vbU5hbWUgfWApO1xuXHR9XG5cblx0dGhpcy5sb2coYCR7IHVzZXIudXNlcm5hbWUgfSBsZWZ0IHJvb20gJHsgcm9vbS5uYW1lIH1gKTtcblx0Um9ja2V0Q2hhdC5yZW1vdmVVc2VyRnJvbVJvb20ocm9vbS5faWQsIHVzZXIpO1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaGFuZGxlTmlja0NoYW5nZWQoYXJncykge1xuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0J3Byb2ZpbGUuaXJjLm5pY2snOiBhcmdzLm5pY2tcblx0fSk7XG5cblx0aWYgKCF1c2VyKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBhbiB1c2VyIHdpdGggbmljayAkeyBhcmdzLm5pY2sgfWApO1xuXHR9XG5cblx0dGhpcy5sb2coYCR7IHVzZXIudXNlcm5hbWUgfSBjaGFuZ2VkIG5pY2s6ICR7IGFyZ3MubmljayB9IC0+ICR7IGFyZ3MubmV3TmljayB9YCk7XG5cblx0Ly8gVXBkYXRlIG9uIHRoZSBkYXRhYmFzZVxuXHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHRuYW1lOiBhcmdzLm5ld05pY2ssXG5cdFx0XHQncHJvZmlsZS5pcmMubmljayc6IGFyZ3MubmV3Tmlja1xuXHRcdH1cblx0fSk7XG59XG4iLCIvKlxuICpcbiAqIEdldCBkaXJlY3QgY2hhdCByb29tIGhlbHBlclxuICpcbiAqXG4gKi9cbmNvbnN0IGdldERpcmVjdFJvb20gPSAoc291cmNlLCB0YXJnZXQpID0+IHtcblx0Y29uc3QgcmlkID0gWyBzb3VyY2UuX2lkLCB0YXJnZXQuX2lkIF0uc29ydCgpLmpvaW4oJycpO1xuXG5cdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwc2VydCh7IF9pZDogcmlkIH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHR1c2VybmFtZXM6IFtzb3VyY2UudXNlcm5hbWUsIHRhcmdldC51c2VybmFtZV1cblx0XHR9LFxuXHRcdCRzZXRPbkluc2VydDoge1xuXHRcdFx0dDogJ2QnLFxuXHRcdFx0bXNnczogMCxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0fVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwc2VydCh7cmlkLCAndS5faWQnOiB0YXJnZXQuX2lkfSwge1xuXHRcdCRzZXRPbkluc2VydDoge1xuXHRcdFx0bmFtZTogc291cmNlLnVzZXJuYW1lLFxuXHRcdFx0dDogJ2QnLFxuXHRcdFx0b3BlbjogZmFsc2UsXG5cdFx0XHRhbGVydDogZmFsc2UsXG5cdFx0XHR1bnJlYWQ6IDAsXG5cdFx0XHR1OiB7XG5cdFx0XHRcdF9pZDogdGFyZ2V0Ll9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHRhcmdldC51c2VybmFtZVxuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cHNlcnQoe3JpZCwgJ3UuX2lkJzogc291cmNlLl9pZH0sIHtcblx0XHQkc2V0T25JbnNlcnQ6IHtcblx0XHRcdG5hbWU6IHRhcmdldC51c2VybmFtZSxcblx0XHRcdHQ6ICdkJyxcblx0XHRcdG9wZW46IGZhbHNlLFxuXHRcdFx0YWxlcnQ6IGZhbHNlLFxuXHRcdFx0dW5yZWFkOiAwLFxuXHRcdFx0dToge1xuXHRcdFx0XHRfaWQ6IHNvdXJjZS5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBzb3VyY2UudXNlcm5hbWVcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0X2lkOiByaWQsXG5cdFx0dDogJ2QnXG5cdH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBoYW5kbGVTZW50TWVzc2FnZShhcmdzKSB7XG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHQncHJvZmlsZS5pcmMubmljayc6IGFyZ3Mubmlja1xuXHR9KTtcblxuXHRpZiAoIXVzZXIpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaW5kIGEgdXNlciB3aXRoIG5pY2sgJHsgYXJncy5uaWNrIH1gKTtcblx0fVxuXG5cdGxldCByb29tO1xuXG5cdGlmIChhcmdzLnJvb21OYW1lKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoYXJncy5yb29tTmFtZSk7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgcmVjaXBpZW50VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0J3Byb2ZpbGUuaXJjLm5pY2snOiBhcmdzLnJlY2lwaWVudE5pY2tcblx0XHR9KTtcblxuXHRcdHJvb20gPSBnZXREaXJlY3RSb29tKHVzZXIsIHJlY2lwaWVudFVzZXIpO1xuXHR9XG5cblx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRtc2c6IGFyZ3MubWVzc2FnZSxcblx0XHR0czogbmV3IERhdGUoKVxuXHR9O1xuXG5cdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UodXNlciwgbWVzc2FnZSwgcm9vbSk7XG59XG4iLCJleHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVVc2VyUmVnaXN0ZXJlZChhcmdzKSB7XG5cdC8vIENoZWNrIGlmIHRoZXJlIGlzIGFuIHVzZXIgd2l0aCB0aGUgZ2l2ZW4gdXNlcm5hbWVcblx0bGV0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHtcblx0XHQncHJvZmlsZS5pcmMudXNlcm5hbWUnOiBhcmdzLnVzZXJuYW1lXG5cdH0pO1xuXG5cdC8vIElmIHRoZXJlIGlzIG5vIHVzZXIsIGNyZWF0ZSBvbmUuLi5cblx0aWYgKCF1c2VyKSB7XG5cdFx0dGhpcy5sb2coYFJlZ2lzdGVyaW5nICR7IGFyZ3MudXNlcm5hbWUgfSB3aXRoIG5pY2s6ICR7IGFyZ3MubmljayB9YCk7XG5cblx0XHRjb25zdCB1c2VyVG9JbnNlcnQgPSB7XG5cdFx0XHRuYW1lOiBhcmdzLm5pY2ssXG5cdFx0XHR1c2VybmFtZTogYCR7IGFyZ3MudXNlcm5hbWUgfS1pcmNgLFxuXHRcdFx0c3RhdHVzOiAnb25saW5lJyxcblx0XHRcdHV0Y09mZnNldDogMCxcblx0XHRcdGFjdGl2ZTogdHJ1ZSxcblx0XHRcdHR5cGU6ICd1c2VyJyxcblx0XHRcdHByb2ZpbGU6IHtcblx0XHRcdFx0aXJjOiB7XG5cdFx0XHRcdFx0ZnJvbUlSQzogdHJ1ZSxcblx0XHRcdFx0XHRuaWNrOiBhcmdzLm5pY2ssXG5cdFx0XHRcdFx0dXNlcm5hbWU6IGFyZ3MudXNlcm5hbWUsXG5cdFx0XHRcdFx0aG9zdG5hbWU6IGFyZ3MuaG9zdG5hbWVcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuY3JlYXRlKHVzZXJUb0luc2VydCk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gLi4ub3RoZXJ3aXNlLCBsb2cgdGhlIHVzZXIgaW4gYW5kIHVwZGF0ZSB0aGUgaW5mb3JtYXRpb25cblx0XHR0aGlzLmxvZyhgTG9nZ2luZyBpbiAkeyBhcmdzLnVzZXJuYW1lIH0gd2l0aCBuaWNrOiAkeyBhcmdzLm5pY2sgfWApO1xuXG5cdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh7IF9pZDogdXNlci5faWQgfSwge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRzdGF0dXM6ICdvbmxpbmUnLFxuXHRcdFx0XHQncHJvZmlsZS5pcmMubmljayc6IGFyZ3Mubmljayxcblx0XHRcdFx0J3Byb2ZpbGUuaXJjLnVzZXJuYW1lJzogYXJncy51c2VybmFtZSxcblx0XHRcdFx0J3Byb2ZpbGUuaXJjLmhvc3RuYW1lJzogYXJncy5ob3N0bmFtZVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59XG4iLCJpbXBvcnQgUkZDMjgxMyBmcm9tICcuL1JGQzI4MTMnO1xuXG5leHBvcnQgeyBSRkMyODEzIH07XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJ0eW5zbWl0aC9ub2RlLWlyY1xuICogYnkgaHR0cHM6Ly9naXRodWIuY29tL21hcnR5bnNtaXRoXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdCcwMDEnOiB7XG5cdFx0bmFtZTogJ3JwbF93ZWxjb21lJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdCcwMDInOiB7XG5cdFx0bmFtZTogJ3JwbF95b3VyaG9zdCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQnMDAzJzoge1xuXHRcdG5hbWU6ICdycGxfY3JlYXRlZCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQnMDA0Jzoge1xuXHRcdG5hbWU6ICdycGxfbXlpbmZvJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdCcwMDUnOiB7XG5cdFx0bmFtZTogJ3JwbF9pc3VwcG9ydCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMDA6IHtcblx0XHRuYW1lOiAncnBsX3RyYWNlbGluaycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMDE6IHtcblx0XHRuYW1lOiAncnBsX3RyYWNlY29ubmVjdGluZycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMDI6IHtcblx0XHRuYW1lOiAncnBsX3RyYWNlaGFuZHNoYWtlJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDIwMzoge1xuXHRcdG5hbWU6ICdycGxfdHJhY2V1bmtub3duJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDIwNDoge1xuXHRcdG5hbWU6ICdycGxfdHJhY2VvcGVyYXRvcicsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMDU6IHtcblx0XHRuYW1lOiAncnBsX3RyYWNldXNlcicsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMDY6IHtcblx0XHRuYW1lOiAncnBsX3RyYWNlc2VydmVyJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDIwODoge1xuXHRcdG5hbWU6ICdycGxfdHJhY2VuZXd0eXBlJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDIxMToge1xuXHRcdG5hbWU6ICdycGxfc3RhdHNsaW5raW5mbycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMTI6IHtcblx0XHRuYW1lOiAncnBsX3N0YXRzY29tbWFuZHMnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjEzOiB7XG5cdFx0bmFtZTogJ3JwbF9zdGF0c2NsaW5lJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDIxNDoge1xuXHRcdG5hbWU6ICdycGxfc3RhdHNubGluZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMTU6IHtcblx0XHRuYW1lOiAncnBsX3N0YXRzaWxpbmUnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjE2OiB7XG5cdFx0bmFtZTogJ3JwbF9zdGF0c2tsaW5lJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDIxODoge1xuXHRcdG5hbWU6ICdycGxfc3RhdHN5bGluZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyMTk6IHtcblx0XHRuYW1lOiAncnBsX2VuZG9mc3RhdHMnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjIxOiB7XG5cdFx0bmFtZTogJ3JwbF91bW9kZWlzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDI0MToge1xuXHRcdG5hbWU6ICdycGxfc3RhdHNsbGluZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyNDI6IHtcblx0XHRuYW1lOiAncnBsX3N0YXRzdXB0aW1lJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDI0Mzoge1xuXHRcdG5hbWU6ICdycGxfc3RhdHNvbGluZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyNDQ6IHtcblx0XHRuYW1lOiAncnBsX3N0YXRzaGxpbmUnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjUwOiB7XG5cdFx0bmFtZTogJ3JwbF9zdGF0c2Nvbm4nLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjUxOiB7XG5cdFx0bmFtZTogJ3JwbF9sdXNlcmNsaWVudCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyNTI6IHtcblx0XHRuYW1lOiAncnBsX2x1c2Vyb3AnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjUzOiB7XG5cdFx0bmFtZTogJ3JwbF9sdXNlcnVua25vd24nLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjU0OiB7XG5cdFx0bmFtZTogJ3JwbF9sdXNlcmNoYW5uZWxzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDI1NToge1xuXHRcdG5hbWU6ICdycGxfbHVzZXJtZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQyNTY6IHtcblx0XHRuYW1lOiAncnBsX2FkbWlubWUnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjU3OiB7XG5cdFx0bmFtZTogJ3JwbF9hZG1pbmxvYzEnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjU4OiB7XG5cdFx0bmFtZTogJ3JwbF9hZG1pbmxvYzInLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjU5OiB7XG5cdFx0bmFtZTogJ3JwbF9hZG1pbmVtYWlsJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDI2MToge1xuXHRcdG5hbWU6ICdycGxfdHJhY2Vsb2cnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MjY1OiB7XG5cdFx0bmFtZTogJ3JwbF9sb2NhbHVzZXJzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDI2Njoge1xuXHRcdG5hbWU6ICdycGxfZ2xvYmFsdXNlcnMnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzAwOiB7XG5cdFx0bmFtZTogJ3JwbF9ub25lJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDMwMToge1xuXHRcdG5hbWU6ICdycGxfYXdheScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMDI6IHtcblx0XHRuYW1lOiAncnBsX3VzZXJob3N0Jyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDMwMzoge1xuXHRcdG5hbWU6ICdycGxfaXNvbicsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMDU6IHtcblx0XHRuYW1lOiAncnBsX3VuYXdheScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMDY6IHtcblx0XHRuYW1lOiAncnBsX25vd2F3YXknLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzExOiB7XG5cdFx0bmFtZTogJ3JwbF93aG9pc3VzZXInLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzEyOiB7XG5cdFx0bmFtZTogJ3JwbF93aG9pc3NlcnZlcicsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMTM6IHtcblx0XHRuYW1lOiAncnBsX3dob2lzb3BlcmF0b3InLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzE0OiB7XG5cdFx0bmFtZTogJ3JwbF93aG93YXN1c2VyJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDMxNToge1xuXHRcdG5hbWU6ICdycGxfZW5kb2Z3aG8nLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzE3OiB7XG5cdFx0bmFtZTogJ3JwbF93aG9pc2lkbGUnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzE4OiB7XG5cdFx0bmFtZTogJ3JwbF9lbmRvZndob2lzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDMxOToge1xuXHRcdG5hbWU6ICdycGxfd2hvaXNjaGFubmVscycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMjE6IHtcblx0XHRuYW1lOiAncnBsX2xpc3RzdGFydCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMjI6IHtcblx0XHRuYW1lOiAncnBsX2xpc3QnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzIzOiB7XG5cdFx0bmFtZTogJ3JwbF9saXN0ZW5kJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDMyNDoge1xuXHRcdG5hbWU6ICdycGxfY2hhbm5lbG1vZGVpcycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMjk6IHtcblx0XHRuYW1lOiAncnBsX2NyZWF0aW9udGltZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMzE6IHtcblx0XHRuYW1lOiAncnBsX25vdG9waWMnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzMyOiB7XG5cdFx0bmFtZTogJ3JwbF90b3BpYycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzMzM6IHtcblx0XHRuYW1lOiAncnBsX3RvcGljd2hvdGltZScsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzNDE6IHtcblx0XHRuYW1lOiAncnBsX2ludml0aW5nJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM0Mjoge1xuXHRcdG5hbWU6ICdycGxfc3VtbW9uaW5nJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM1MToge1xuXHRcdG5hbWU6ICdycGxfdmVyc2lvbicsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzNTI6IHtcblx0XHRuYW1lOiAncnBsX3dob3JlcGx5Jyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM1Mzoge1xuXHRcdG5hbWU6ICdycGxfbmFtcmVwbHknLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzY0OiB7XG5cdFx0bmFtZTogJ3JwbF9saW5rcycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzNjU6IHtcblx0XHRuYW1lOiAncnBsX2VuZG9mbGlua3MnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzY2OiB7XG5cdFx0bmFtZTogJ3JwbF9lbmRvZm5hbWVzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM2Nzoge1xuXHRcdG5hbWU6ICdycGxfYmFubGlzdCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzNjg6IHtcblx0XHRuYW1lOiAncnBsX2VuZG9mYmFubGlzdCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzNjk6IHtcblx0XHRuYW1lOiAncnBsX2VuZG9md2hvd2FzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM3MToge1xuXHRcdG5hbWU6ICdycGxfaW5mbycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzNzI6IHtcblx0XHRuYW1lOiAncnBsX21vdGQnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0Mzc0OiB7XG5cdFx0bmFtZTogJ3JwbF9lbmRvZmluZm8nLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0Mzc1OiB7XG5cdFx0bmFtZTogJ3JwbF9tb3Rkc3RhcnQnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0Mzc2OiB7XG5cdFx0bmFtZTogJ3JwbF9lbmRvZm1vdGQnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzgxOiB7XG5cdFx0bmFtZTogJ3JwbF95b3VyZW9wZXInLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzgyOiB7XG5cdFx0bmFtZTogJ3JwbF9yZWhhc2hpbmcnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0MzkxOiB7XG5cdFx0bmFtZTogJ3JwbF90aW1lJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM5Mjoge1xuXHRcdG5hbWU6ICdycGxfdXNlcnNzdGFydCcsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzOTM6IHtcblx0XHRuYW1lOiAncnBsX3VzZXJzJyxcblx0XHR0eXBlOiAncmVwbHknXG5cdH0sXG5cdDM5NDoge1xuXHRcdG5hbWU6ICdycGxfZW5kb2Z1c2VycycsXG5cdFx0dHlwZTogJ3JlcGx5J1xuXHR9LFxuXHQzOTU6IHtcblx0XHRuYW1lOiAncnBsX25vdXNlcnMnLFxuXHRcdHR5cGU6ICdyZXBseSdcblx0fSxcblx0NDAxOiB7XG5cdFx0bmFtZTogJ2Vycl9ub3N1Y2huaWNrJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQwMjoge1xuXHRcdG5hbWU6ICdlcnJfbm9zdWNoc2VydmVyJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQwMzoge1xuXHRcdG5hbWU6ICdlcnJfbm9zdWNoY2hhbm5lbCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0MDQ6IHtcblx0XHRuYW1lOiAnZXJyX2Nhbm5vdHNlbmR0b2NoYW4nLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDA1OiB7XG5cdFx0bmFtZTogJ2Vycl90b29tYW55Y2hhbm5lbHMnLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDA2OiB7XG5cdFx0bmFtZTogJ2Vycl93YXNub3N1Y2huaWNrJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQwNzoge1xuXHRcdG5hbWU6ICdlcnJfdG9vbWFueXRhcmdldHMnLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDA5OiB7XG5cdFx0bmFtZTogJ2Vycl9ub29yaWdpbicsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0MTE6IHtcblx0XHRuYW1lOiAnZXJyX25vcmVjaXBpZW50Jyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQxMjoge1xuXHRcdG5hbWU6ICdlcnJfbm90ZXh0dG9zZW5kJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQxMzoge1xuXHRcdG5hbWU6ICdlcnJfbm90b3BsZXZlbCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0MTQ6IHtcblx0XHRuYW1lOiAnZXJyX3dpbGR0b3BsZXZlbCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0MjE6IHtcblx0XHRuYW1lOiAnZXJyX3Vua25vd25jb21tYW5kJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQyMjoge1xuXHRcdG5hbWU6ICdlcnJfbm9tb3RkJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQyMzoge1xuXHRcdG5hbWU6ICdlcnJfbm9hZG1pbmluZm8nLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDI0OiB7XG5cdFx0bmFtZTogJ2Vycl9maWxlZXJyb3InLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDMxOiB7XG5cdFx0bmFtZTogJ2Vycl9ub25pY2tuYW1lZ2l2ZW4nLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDMyOiB7XG5cdFx0bmFtZTogJ2Vycl9lcnJvbmV1c25pY2tuYW1lJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQzMzoge1xuXHRcdG5hbWU6ICdlcnJfbmlja25hbWVpbnVzZScsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0MzY6IHtcblx0XHRuYW1lOiAnZXJyX25pY2tjb2xsaXNpb24nLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDQxOiB7XG5cdFx0bmFtZTogJ2Vycl91c2Vybm90aW5jaGFubmVsJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ0Mjoge1xuXHRcdG5hbWU6ICdlcnJfbm90b25jaGFubmVsJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ0Mzoge1xuXHRcdG5hbWU6ICdlcnJfdXNlcm9uY2hhbm5lbCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0NDQ6IHtcblx0XHRuYW1lOiAnZXJyX25vbG9naW4nLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDQ1OiB7XG5cdFx0bmFtZTogJ2Vycl9zdW1tb25kaXNhYmxlZCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0NDY6IHtcblx0XHRuYW1lOiAnZXJyX3VzZXJzZGlzYWJsZWQnLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDUxOiB7XG5cdFx0bmFtZTogJ2Vycl9ub3RyZWdpc3RlcmVkJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ2MToge1xuXHRcdG5hbWU6ICdlcnJfbmVlZG1vcmVwYXJhbXMnLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDYyOiB7XG5cdFx0bmFtZTogJ2Vycl9hbHJlYWR5cmVnaXN0cmVkJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ2Mzoge1xuXHRcdG5hbWU6ICdlcnJfbm9wZXJtZm9yaG9zdCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0NjQ6IHtcblx0XHRuYW1lOiAnZXJyX3Bhc3N3ZG1pc21hdGNoJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ2NToge1xuXHRcdG5hbWU6ICdlcnJfeW91cmViYW5uZWRjcmVlcCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0Njc6IHtcblx0XHRuYW1lOiAnZXJyX2tleXNldCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0NzE6IHtcblx0XHRuYW1lOiAnZXJyX2NoYW5uZWxpc2Z1bGwnLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDcyOiB7XG5cdFx0bmFtZTogJ2Vycl91bmtub3dubW9kZScsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0NzM6IHtcblx0XHRuYW1lOiAnZXJyX2ludml0ZW9ubHljaGFuJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ3NDoge1xuXHRcdG5hbWU6ICdlcnJfYmFubmVkZnJvbWNoYW4nLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NDc1OiB7XG5cdFx0bmFtZTogJ2Vycl9iYWRjaGFubmVsa2V5Jyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ4MToge1xuXHRcdG5hbWU6ICdlcnJfbm9wcml2aWxlZ2VzJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ4Mjoge1xuXHRcdG5hbWU6ICdlcnJfY2hhbm9wcml2c25lZWRlZCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ0ODM6IHtcblx0XHRuYW1lOiAnZXJyX2NhbnRraWxsc2VydmVyJyxcblx0XHR0eXBlOiAnZXJyb3InXG5cdH0sXG5cdDQ5MToge1xuXHRcdG5hbWU6ICdlcnJfbm9vcGVyaG9zdCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9LFxuXHQ1MDE6IHtcblx0XHRuYW1lOiAnZXJyX3Vtb2RldW5rbm93bmZsYWcnLFxuXHRcdHR5cGU6ICdlcnJvcidcblx0fSxcblx0NTAyOiB7XG5cdFx0bmFtZTogJ2Vycl91c2Vyc2RvbnRtYXRjaCcsXG5cdFx0dHlwZTogJ2Vycm9yJ1xuXHR9XG59O1xuIiwiaW1wb3J0IG5ldCBmcm9tICduZXQnO1xuaW1wb3J0IHV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuXG5pbXBvcnQgcGFyc2VNZXNzYWdlIGZyb20gJy4vcGFyc2VNZXNzYWdlJztcblxuaW1wb3J0IHBlZXJDb21tYW5kSGFuZGxlcnMgZnJvbSAnLi9wZWVyQ29tbWFuZEhhbmRsZXJzJztcbmltcG9ydCBsb2NhbENvbW1hbmRIYW5kbGVycyBmcm9tICcuL2xvY2FsQ29tbWFuZEhhbmRsZXJzJztcblxuY2xhc3MgUkZDMjgxMyB7XG5cdGNvbnN0cnVjdG9yKGNvbmZpZykge1xuXHRcdHRoaXMuY29uZmlnID0gY29uZmlnO1xuXG5cdFx0Ly8gSG9sZCByZWdpc3RlcmVkIHN0YXRlXG5cdFx0dGhpcy5yZWdpc3RlclN0ZXBzID0gW107XG5cdFx0dGhpcy5pc1JlZ2lzdGVyZWQgPSBmYWxzZTtcblxuXHRcdC8vIEhvbGQgcGVlciBzZXJ2ZXIgaW5mb3JtYXRpb25cblx0XHR0aGlzLnNlcnZlclByZWZpeCA9IG51bGw7XG5cblx0XHQvLyBIb2xkIHRoZSBidWZmZXIgd2hpbGUgcmVjZWl2aW5nXG5cdFx0dGhpcy5yZWNlaXZlQnVmZmVyID0gbmV3IEJ1ZmZlcignJyk7XG5cblx0fVxuXG5cdC8qKlxuXHQgKiBTZXR1cCBzb2NrZXRcblx0ICovXG5cdHNldHVwU29ja2V0KCkge1xuXHRcdC8vIFNldHVwIHNvY2tldFxuXHRcdHRoaXMuc29ja2V0ID0gbmV3IG5ldC5Tb2NrZXQoKTtcblx0XHR0aGlzLnNvY2tldC5zZXROb0RlbGF5KCk7XG5cdFx0dGhpcy5zb2NrZXQuc2V0RW5jb2RpbmcoJ3V0Zi04Jyk7XG5cdFx0dGhpcy5zb2NrZXQuc2V0S2VlcEFsaXZlKHRydWUpO1xuXHRcdHRoaXMuc29ja2V0LnNldFRpbWVvdXQoOTAwMDApO1xuXG5cdFx0dGhpcy5zb2NrZXQub24oJ2RhdGEnLCB0aGlzLm9uUmVjZWl2ZUZyb21QZWVyLmJpbmQodGhpcykpO1xuXG5cdFx0dGhpcy5zb2NrZXQub24oJ2Nvbm5lY3QnLCB0aGlzLm9uQ29ubmVjdC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLnNvY2tldC5vbignZXJyb3InLCAoZXJyKSA9PiBjb25zb2xlLmxvZygnW2lyY11bc2VydmVyXVtlcnJdJywgZXJyKSk7XG5cdFx0dGhpcy5zb2NrZXQub24oJ3RpbWVvdXQnLCAoKSA9PiB0aGlzLmxvZygnVGltZW91dCcpKTtcblx0XHR0aGlzLnNvY2tldC5vbignY2xvc2UnLCAoKSA9PiB0aGlzLmxvZygnQ29ubmVjdGlvbiBDbG9zZWQnKSk7XG5cdFx0Ly8gU2V0dXAgbG9jYWxcblx0XHR0aGlzLm9uKCdvblJlY2VpdmVGcm9tTG9jYWwnLCB0aGlzLm9uUmVjZWl2ZUZyb21Mb2NhbC5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBMb2cgaGVscGVyXG5cdCAqL1xuXHRsb2cobWVzc2FnZSkge1xuXHRcdGNvbnNvbGUubG9nKGBbaXJjXVtzZXJ2ZXJdICR7IG1lc3NhZ2UgfWApO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbm5lY3Rcblx0ICovXG5cdHJlZ2lzdGVyKCkge1xuXHRcdHRoaXMubG9nKGBDb25uZWN0aW5nIHRvIEAkeyB0aGlzLmNvbmZpZy5zZXJ2ZXIuaG9zdCB9OiR7IHRoaXMuY29uZmlnLnNlcnZlci5wb3J0IH1gKTtcblxuXHRcdGlmICghdGhpcy5zb2NrZXQpIHtcblx0XHRcdHRoaXMuc2V0dXBTb2NrZXQoKTtcblx0XHR9XG5cblx0XHR0aGlzLnNvY2tldC5jb25uZWN0KHRoaXMuY29uZmlnLnNlcnZlci5wb3J0LCB0aGlzLmNvbmZpZy5zZXJ2ZXIuaG9zdCk7XG5cdH1cblxuXHQvKipcblx0ICogRGlzY29ubmVjdFxuXHQgKi9cblx0ZGlzY29ubmVjdCgpIHtcblx0XHR0aGlzLmxvZygnRGlzY29ubmVjdGluZyBmcm9tIHNlcnZlci4nKTtcblxuXHRcdGlmICh0aGlzLnNvY2tldCkge1xuXHRcdFx0dGhpcy5zb2NrZXQuZGVzdHJveSgpO1xuXHRcdFx0dGhpcy5zb2NrZXQgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHRoaXMuaXNSZWdpc3RlcmVkID0gZmFsc2U7XG5cdFx0dGhpcy5yZWdpc3RlclN0ZXBzID0gW107XG5cdH1cblxuXHQvKipcblx0ICogU2V0dXAgdGhlIHNlcnZlciBjb25uZWN0aW9uXG5cdCAqL1xuXHRvbkNvbm5lY3QoKSB7XG5cdFx0dGhpcy5sb2coJ0Nvbm5lY3RlZCEgUmVnaXN0ZXJpbmcgYXMgc2VydmVyLi4uJyk7XG5cblx0XHR0aGlzLndyaXRlKHtcblx0XHRcdGNvbW1hbmQ6ICdQQVNTJyxcblx0XHRcdHBhcmFtZXRlcnM6IFsgdGhpcy5jb25maWcucGFzc3dvcmRzLmxvY2FsLCAnMDIxMCcsICduZ2lyY2QnIF1cblx0XHR9KTtcblxuXHRcdHRoaXMud3JpdGUoe1xuXHRcdFx0Y29tbWFuZDogJ1NFUlZFUicsIHBhcmFtZXRlcnM6IFsgdGhpcy5jb25maWcuc2VydmVyLm5hbWUgXSxcblx0XHRcdHRyYWlsZXI6IHRoaXMuY29uZmlnLnNlcnZlci5kZXNjcmlwdGlvblxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNlbmRzIGEgY29tbWFuZCBtZXNzYWdlIHRocm91Z2ggdGhlIHNvY2tldFxuXHQgKi9cblx0d3JpdGUoY29tbWFuZCkge1xuXHRcdGxldCBidWZmZXIgPSBjb21tYW5kLnByZWZpeCA/IGA6JHsgY29tbWFuZC5wcmVmaXggfSBgIDogJyc7XG5cdFx0YnVmZmVyICs9IGNvbW1hbmQuY29tbWFuZDtcblxuXHRcdGlmIChjb21tYW5kLnBhcmFtZXRlcnMgJiYgY29tbWFuZC5wYXJhbWV0ZXJzLmxlbmd0aCA+IDApIHtcblx0XHRcdGJ1ZmZlciArPSBgICR7IGNvbW1hbmQucGFyYW1ldGVycy5qb2luKCcgJykgfWA7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbW1hbmQudHJhaWxlcikge1xuXHRcdFx0YnVmZmVyICs9IGAgOiR7IGNvbW1hbmQudHJhaWxlciB9YDtcblx0XHR9XG5cblx0XHR0aGlzLmxvZyhgU2VuZGluZyBDb21tYW5kOiAkeyBidWZmZXIgfWApO1xuXG5cdFx0cmV0dXJuIHRoaXMuc29ja2V0LndyaXRlKGAkeyBidWZmZXIgfVxcclxcbmApO1xuXHR9XG5cblx0LyoqXG5cdCAqXG5cdCAqXG5cdCAqIFBlZXIgbWVzc2FnZSBoYW5kbGluZ1xuXHQgKlxuXHQgKlxuXHQgKi9cblx0b25SZWNlaXZlRnJvbVBlZXIoY2h1bmspIHtcblx0XHRpZiAodHlwZW9mIChjaHVuaykgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aGlzLnJlY2VpdmVCdWZmZXIgKz0gY2h1bms7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucmVjZWl2ZUJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoW3RoaXMucmVjZWl2ZUJ1ZmZlciwgY2h1bmtdKTtcblx0XHR9XG5cblx0XHRjb25zdCBsaW5lcyA9IHRoaXMucmVjZWl2ZUJ1ZmZlci50b1N0cmluZygpLnNwbGl0KC9cXHJcXG58XFxyfFxcbnxcXHUwMDA3Lyk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29udHJvbC1yZWdleFxuXG5cdFx0Ly8gSWYgdGhlIGJ1ZmZlciBkb2VzIG5vdCBlbmQgd2l0aCBcXHJcXG4sIG1vcmUgY2h1bmtzIGFyZSBjb21pbmdcblx0XHRpZiAobGluZXMucG9wKCkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBSZXNldCB0aGUgYnVmZmVyXG5cdFx0dGhpcy5yZWNlaXZlQnVmZmVyID0gbmV3IEJ1ZmZlcignJyk7XG5cblx0XHRsaW5lcy5mb3JFYWNoKChsaW5lKSA9PiB7XG5cdFx0XHRpZiAobGluZS5sZW5ndGggJiYgIWxpbmUuc3RhcnRzV2l0aCgnXFxhJykpIHtcblx0XHRcdFx0Y29uc3QgcGFyc2VkTWVzc2FnZSA9IHBhcnNlTWVzc2FnZShsaW5lKTtcblxuXHRcdFx0XHRpZiAocGVlckNvbW1hbmRIYW5kbGVyc1twYXJzZWRNZXNzYWdlLmNvbW1hbmRdKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2coYEhhbmRsaW5nIHBlZXIgbWVzc2FnZTogJHsgbGluZSB9YCk7XG5cblx0XHRcdFx0XHRjb25zdCBjb21tYW5kID0gcGVlckNvbW1hbmRIYW5kbGVyc1twYXJzZWRNZXNzYWdlLmNvbW1hbmRdLmNhbGwodGhpcywgcGFyc2VkTWVzc2FnZSk7XG5cblx0XHRcdFx0XHRpZiAoY29tbWFuZCkge1xuXHRcdFx0XHRcdFx0dGhpcy5sb2coYEVtaXR0aW5nIHBlZXIgY29tbWFuZCB0byBsb2NhbDogJHsgSlNPTi5zdHJpbmdpZnkoY29tbWFuZCkgfWApO1xuXHRcdFx0XHRcdFx0dGhpcy5lbWl0KCdwZWVyQ29tbWFuZCcsIGNvbW1hbmQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZyhgVW5oYW5kbGVkIHBlZXIgbWVzc2FnZTogJHsgSlNPTi5zdHJpbmdpZnkocGFyc2VkTWVzc2FnZSkgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICpcblx0ICpcblx0ICogTG9jYWwgbWVzc2FnZSBoYW5kbGluZ1xuXHQgKlxuXHQgKlxuXHQgKi9cblx0b25SZWNlaXZlRnJvbUxvY2FsKGNvbW1hbmQsIHBhcmFtZXRlcnMpIHtcblx0XHRpZiAobG9jYWxDb21tYW5kSGFuZGxlcnNbY29tbWFuZF0pIHtcblx0XHRcdHRoaXMubG9nKGBIYW5kbGluZyBsb2NhbCBjb21tYW5kOiAkeyBjb21tYW5kIH1gKTtcblxuXHRcdFx0bG9jYWxDb21tYW5kSGFuZGxlcnNbY29tbWFuZF0uY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmxvZyhgVW5oYW5kbGVkIGxvY2FsIGNvbW1hbmQ6ICR7IEpTT04uc3RyaW5naWZ5KGNvbW1hbmQpIH1gKTtcblx0XHR9XG5cdH1cbn1cblxudXRpbC5pbmhlcml0cyhSRkMyODEzLCBFdmVudEVtaXR0ZXIpO1xuXG5leHBvcnQgZGVmYXVsdCBSRkMyODEzO1xuIiwiZnVuY3Rpb24gcmVnaXN0ZXJVc2VyKHBhcmFtZXRlcnMpIHtcblx0Y29uc3QgeyBuYW1lLCBwcm9maWxlOiB7IGlyYzogeyBuaWNrLCB1c2VybmFtZSB9IH0gfSA9IHBhcmFtZXRlcnM7XG5cblx0dGhpcy53cml0ZSh7XG5cdFx0cHJlZml4OiB0aGlzLmNvbmZpZy5zZXJ2ZXIubmFtZSxcblx0XHRjb21tYW5kOiAnTklDSycsIHBhcmFtZXRlcnM6IFsgbmljaywgMSwgdXNlcm5hbWUsICdpcmMucm9ja2V0LmNoYXQnLCAxLCAnK2knIF0sXG5cdFx0dHJhaWxlcjogbmFtZVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gam9pbkNoYW5uZWwocGFyYW1ldGVycykge1xuXHRjb25zdCB7XG5cdFx0cm9vbTogeyBuYW1lOiByb29tTmFtZSB9LFxuXHRcdHVzZXI6IHsgcHJvZmlsZTogeyBpcmM6IHsgbmljayB9IH0gfVxuXHR9ID0gcGFyYW1ldGVycztcblxuXHR0aGlzLndyaXRlKHtcblx0XHRwcmVmaXg6IHRoaXMuY29uZmlnLnNlcnZlci5uYW1lLFxuXHRcdGNvbW1hbmQ6ICdOSk9JTicsIHBhcmFtZXRlcnM6IFsgYCMkeyByb29tTmFtZSB9YCBdLFxuXHRcdHRyYWlsZXI6IG5pY2tcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGpvaW5lZENoYW5uZWwocGFyYW1ldGVycykge1xuXHRjb25zdCB7XG5cdFx0cm9vbTogeyBuYW1lOiByb29tTmFtZSB9LFxuXHRcdHVzZXI6IHsgcHJvZmlsZTogeyBpcmM6IHsgbmljayB9IH0gfVxuXHR9ID0gcGFyYW1ldGVycztcblxuXHR0aGlzLndyaXRlKHtcblx0XHRwcmVmaXg6IG5pY2ssXG5cdFx0Y29tbWFuZDogJ0pPSU4nLCBwYXJhbWV0ZXJzOiBbIGAjJHsgcm9vbU5hbWUgfWAgXVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gbGVmdENoYW5uZWwocGFyYW1ldGVycykge1xuXHRjb25zdCB7XG5cdFx0cm9vbTogeyBuYW1lOiByb29tTmFtZSB9LFxuXHRcdHVzZXI6IHsgcHJvZmlsZTogeyBpcmM6IHsgbmljayB9IH0gfVxuXHR9ID0gcGFyYW1ldGVycztcblxuXHR0aGlzLndyaXRlKHtcblx0XHRwcmVmaXg6IG5pY2ssXG5cdFx0Y29tbWFuZDogJ1BBUlQnLCBwYXJhbWV0ZXJzOiBbIGAjJHsgcm9vbU5hbWUgfWAgXVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gc2VudE1lc3NhZ2UocGFyYW1ldGVycykge1xuXHRjb25zdCB7XG5cdFx0dXNlcjogeyBwcm9maWxlOiB7IGlyYzogeyBuaWNrIH0gfSB9LFxuXHRcdHRvLFxuXHRcdG1lc3NhZ2Vcblx0fSA9IHBhcmFtZXRlcnM7XG5cblx0dGhpcy53cml0ZSh7XG5cdFx0cHJlZml4OiBuaWNrLFxuXHRcdGNvbW1hbmQ6ICdQUklWTVNHJywgcGFyYW1ldGVyczogWyB0byBdLFxuXHRcdHRyYWlsZXI6IG1lc3NhZ2Vcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGRpc2Nvbm5lY3RlZChwYXJhbWV0ZXJzKSB7XG5cdGNvbnN0IHtcblx0XHR1c2VyOiB7IHByb2ZpbGU6IHsgaXJjOiB7IG5pY2sgfSB9IH1cblx0fSA9IHBhcmFtZXRlcnM7XG5cblx0dGhpcy53cml0ZSh7XG5cdFx0cHJlZml4OiBuaWNrLFxuXHRcdGNvbW1hbmQ6ICdRVUlUJ1xuXHR9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgeyByZWdpc3RlclVzZXIsIGpvaW5DaGFubmVsLCBqb2luZWRDaGFubmVsLCBsZWZ0Q2hhbm5lbCwgc2VudE1lc3NhZ2UsIGRpc2Nvbm5lY3RlZCB9O1xuIiwiLyoqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBodHRwczovL2dpdGh1Yi5jb20vbWFydHluc21pdGgvbm9kZS1pcmNcbiAqIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJ0eW5zbWl0aFxuICovXG5cbmNvbnN0IHJlcGx5Rm9yID0gcmVxdWlyZSgnLi9jb2RlcycpO1xuXG4vKipcbiAqIHBhcnNlTWVzc2FnZShsaW5lLCBzdHJpcENvbG9ycylcbiAqXG4gKiB0YWtlcyBhIHJhdyBcImxpbmVcIiBmcm9tIHRoZSBJUkMgc2VydmVyIGFuZCB0dXJucyBpdCBpbnRvIGFuIG9iamVjdCB3aXRoXG4gKiB1c2VmdWwga2V5c1xuICogQHBhcmFtIHtTdHJpbmd9IGxpbmUgUmF3IG1lc3NhZ2UgZnJvbSBJUkMgc2VydmVyLlxuICogQHJldHVybiB7T2JqZWN0fSBBIHBhcnNlZCBtZXNzYWdlIG9iamVjdC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZU1lc3NhZ2UobGluZSkge1xuXHRjb25zdCBtZXNzYWdlID0ge307XG5cdGxldCBtYXRjaDtcblxuXHQvLyBQYXJzZSBwcmVmaXhcblx0bWF0Y2ggPSBsaW5lLm1hdGNoKC9eOihbXiBdKykgKy8pO1xuXHRpZiAobWF0Y2gpIHtcblx0XHRtZXNzYWdlLnByZWZpeCA9IG1hdGNoWzFdO1xuXHRcdGxpbmUgPSBsaW5lLnJlcGxhY2UoL146W14gXSsgKy8sICcnKTtcblx0XHRtYXRjaCA9IG1lc3NhZ2UucHJlZml4Lm1hdGNoKC9eKFtfYS16QS1aMC05XFx+XFxbXFxdXFxcXGBee318LV0qKSghKFteQF0rKUAoLiopKT8kLyk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHRtZXNzYWdlLm5pY2sgPSBtYXRjaFsxXTtcblx0XHRcdG1lc3NhZ2UudXNlciA9IG1hdGNoWzNdO1xuXHRcdFx0bWVzc2FnZS5ob3N0ID0gbWF0Y2hbNF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2Uuc2VydmVyID0gbWVzc2FnZS5wcmVmaXg7XG5cdFx0fVxuXHR9XG5cblx0Ly8gUGFyc2UgY29tbWFuZFxuXHRtYXRjaCA9IGxpbmUubWF0Y2goL14oW14gXSspICovKTtcblx0bWVzc2FnZS5jb21tYW5kID0gbWF0Y2hbMV07XG5cdG1lc3NhZ2UucmF3Q29tbWFuZCA9IG1hdGNoWzFdO1xuXHRtZXNzYWdlLmNvbW1hbmRUeXBlID0gJ25vcm1hbCc7XG5cdGxpbmUgPSBsaW5lLnJlcGxhY2UoL15bXiBdKyArLywgJycpO1xuXG5cdGlmIChyZXBseUZvclttZXNzYWdlLnJhd0NvbW1hbmRdKSB7XG5cdFx0bWVzc2FnZS5jb21tYW5kID0gcmVwbHlGb3JbbWVzc2FnZS5yYXdDb21tYW5kXS5uYW1lO1xuXHRcdG1lc3NhZ2UuY29tbWFuZFR5cGUgPSByZXBseUZvclttZXNzYWdlLnJhd0NvbW1hbmRdLnR5cGU7XG5cdH1cblxuXHRtZXNzYWdlLmFyZ3MgPSBbXTtcblx0bGV0IG1pZGRsZTtcblx0bGV0IHRyYWlsaW5nO1xuXG5cdC8vIFBhcnNlIHBhcmFtZXRlcnNcblx0aWYgKGxpbmUuc2VhcmNoKC9eOnxcXHMrOi8pICE9PSAtMSkge1xuXHRcdG1hdGNoID0gbGluZS5tYXRjaCgvKC4qPykoPzpeOnxcXHMrOikoLiopLyk7XG5cdFx0bWlkZGxlID0gbWF0Y2hbMV0udHJpbVJpZ2h0KCk7XG5cdFx0dHJhaWxpbmcgPSBtYXRjaFsyXTtcblx0fSBlbHNlIHtcblx0XHRtaWRkbGUgPSBsaW5lO1xuXHR9XG5cblx0aWYgKG1pZGRsZS5sZW5ndGgpIHtcblx0XHRtZXNzYWdlLmFyZ3MgPSBtaWRkbGUuc3BsaXQoLyArLyk7XG5cdH1cblxuXHRpZiAodHlwZW9mICh0cmFpbGluZykgIT09ICd1bmRlZmluZWQnICYmIHRyYWlsaW5nLmxlbmd0aCkge1xuXHRcdG1lc3NhZ2UuYXJncy5wdXNoKHRyYWlsaW5nKTtcblx0fVxuXG5cdHJldHVybiBtZXNzYWdlO1xufTtcbiIsImZ1bmN0aW9uIFBBU1MoKSB7XG5cdHRoaXMubG9nKCdSZWNlaXZlZCBQQVNTIGNvbW1hbmQsIGNvbnRpbnVlIHJlZ2lzdGVyaW5nLi4uJyk7XG5cblx0dGhpcy5yZWdpc3RlclN0ZXBzLnB1c2goJ1BBU1MnKTtcbn1cblxuZnVuY3Rpb24gU0VSVkVSKHBhcnNlZE1lc3NhZ2UpIHtcblx0dGhpcy5sb2coJ1JlY2VpdmVkIFNFUlZFUiBjb21tYW5kLCB3YWl0aW5nIGZvciBmaXJzdCBQSU5HLi4uJyk7XG5cblx0dGhpcy5zZXJ2ZXJQcmVmaXggPSBwYXJzZWRNZXNzYWdlLnByZWZpeDtcblxuXHR0aGlzLnJlZ2lzdGVyU3RlcHMucHVzaCgnU0VSVkVSJyk7XG59XG5cbmZ1bmN0aW9uIFBJTkcoKSB7XG5cdGlmICghdGhpcy5pc1JlZ2lzdGVyZWQgJiYgdGhpcy5yZWdpc3RlclN0ZXBzLmxlbmd0aCA9PT0gMikge1xuXHRcdHRoaXMubG9nKCdSZWNlaXZlZCBmaXJzdCBQSU5HIGNvbW1hbmQsIHNlcnZlciBpcyByZWdpc3RlcmVkIScpO1xuXG5cdFx0dGhpcy5pc1JlZ2lzdGVyZWQgPSB0cnVlO1xuXG5cdFx0dGhpcy5lbWl0KCdyZWdpc3RlcmVkJyk7XG5cdH1cblxuXHR0aGlzLndyaXRlKHtcblx0XHRwcmVmaXg6IHRoaXMuY29uZmlnLnNlcnZlci5uYW1lLFxuXHRcdGNvbW1hbmQ6ICdQT05HJyxcblx0XHRwYXJhbWV0ZXJzOiBbIHRoaXMuY29uZmlnLnNlcnZlci5uYW1lIF1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIE5JQ0socGFyc2VkTWVzc2FnZSkge1xuXHRsZXQgY29tbWFuZDtcblxuXHQvLyBDaGVjayBpZiB0aGUgbWVzc2FnZSBjb21lcyBmcm9tIHRoZSBzZXJ2ZXIsXG5cdC8vIHdoaWNoIG1lYW5zIGl0IGlzIGEgbmV3IHVzZXJcblx0aWYgKHBhcnNlZE1lc3NhZ2UucHJlZml4ID09PSB0aGlzLnNlcnZlclByZWZpeCkge1xuXHRcdGNvbW1hbmQgPSB7XG5cdFx0XHRpZGVudGlmaWVyOiAndXNlclJlZ2lzdGVyZWQnLFxuXHRcdFx0YXJnczoge1xuXHRcdFx0XHRuaWNrOiBwYXJzZWRNZXNzYWdlLmFyZ3NbMF0sXG5cdFx0XHRcdHVzZXJuYW1lOiBwYXJzZWRNZXNzYWdlLmFyZ3NbMl0sXG5cdFx0XHRcdGhvc3Q6IHBhcnNlZE1lc3NhZ2UuYXJnc1szXSxcblx0XHRcdFx0bmFtZTogcGFyc2VkTWVzc2FnZS5hcmdzWzZdXG5cdFx0XHR9XG5cdFx0fTtcblx0fSBlbHNlIHsgLy8gT3RoZXJ3aXNlLCBpdCBpcyBhIG5pY2sgY2hhbmdlXG5cdFx0Y29tbWFuZCA9IHtcblx0XHRcdGlkZW50aWZpZXI6ICduaWNrQ2hhbmdlZCcsXG5cdFx0XHRhcmdzOiB7XG5cdFx0XHRcdG5pY2s6IHBhcnNlZE1lc3NhZ2Uubmljayxcblx0XHRcdFx0bmV3TmljazogcGFyc2VkTWVzc2FnZS5hcmdzWzBdXG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiBjb21tYW5kO1xufVxuXG5mdW5jdGlvbiBKT0lOKHBhcnNlZE1lc3NhZ2UpIHtcblx0Y29uc3QgY29tbWFuZCA9IHtcblx0XHRpZGVudGlmaWVyOiAnam9pbmVkQ2hhbm5lbCcsXG5cdFx0YXJnczoge1xuXHRcdFx0cm9vbU5hbWU6IHBhcnNlZE1lc3NhZ2UuYXJnc1swXS5zdWJzdHJpbmcoMSksXG5cdFx0XHRuaWNrOiBwYXJzZWRNZXNzYWdlLnByZWZpeFxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gY29tbWFuZDtcbn1cblxuZnVuY3Rpb24gUEFSVChwYXJzZWRNZXNzYWdlKSB7XG5cdGNvbnN0IGNvbW1hbmQgPSB7XG5cdFx0aWRlbnRpZmllcjogJ2xlZnRDaGFubmVsJyxcblx0XHRhcmdzOiB7XG5cdFx0XHRyb29tTmFtZTogcGFyc2VkTWVzc2FnZS5hcmdzWzBdLnN1YnN0cmluZygxKSxcblx0XHRcdG5pY2s6IHBhcnNlZE1lc3NhZ2UucHJlZml4XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBjb21tYW5kO1xufVxuXG5mdW5jdGlvbiBQUklWTVNHKHBhcnNlZE1lc3NhZ2UpIHtcblx0Y29uc3QgY29tbWFuZCA9IHtcblx0XHRpZGVudGlmaWVyOiAnc2VudE1lc3NhZ2UnLFxuXHRcdGFyZ3M6IHtcblx0XHRcdG5pY2s6IHBhcnNlZE1lc3NhZ2UucHJlZml4LFxuXHRcdFx0bWVzc2FnZTogcGFyc2VkTWVzc2FnZS5hcmdzWzFdXG5cdFx0fVxuXHR9O1xuXG5cdGlmIChwYXJzZWRNZXNzYWdlLmFyZ3NbMF1bMF0gPT09ICcjJykge1xuXHRcdGNvbW1hbmQuYXJncy5yb29tTmFtZSA9IHBhcnNlZE1lc3NhZ2UuYXJnc1swXS5zdWJzdHJpbmcoMSk7XG5cdH0gZWxzZSB7XG5cdFx0Y29tbWFuZC5hcmdzLnJlY2lwaWVudE5pY2sgPSBwYXJzZWRNZXNzYWdlLmFyZ3NbMF07XG5cdH1cblxuXHRyZXR1cm4gY29tbWFuZDtcbn1cblxuZnVuY3Rpb24gUVVJVChwYXJzZWRNZXNzYWdlKSB7XG5cdGNvbnN0IGNvbW1hbmQgPSB7XG5cdFx0aWRlbnRpZmllcjogJ2Rpc2Nvbm5lY3RlZCcsXG5cdFx0YXJnczoge1xuXHRcdFx0bmljazogcGFyc2VkTWVzc2FnZS5wcmVmaXhcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIGNvbW1hbmQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgUEFTUywgU0VSVkVSLCBQSU5HLCBOSUNLLCBKT0lOLCBQQVJULCBQUklWTVNHLCBRVUlUIH07XG4iXX0=
