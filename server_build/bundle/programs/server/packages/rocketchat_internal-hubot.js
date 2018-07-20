(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var Hubot, HubotScripts, InternalHubot, InternalHubotReceiver, RocketChatAdapter;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:internal-hubot":{"hubot.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_internal-hubot/hubot.js                                                                        //
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
module.watch(require("coffeescript/register"));

const Hubot = Npm.require('hubot'); // Start a hubot, connected to our chat room.
// 'use strict'
// Log messages?


const DEBUG = false;
let InternalHubot = {};
const sendHelper = Meteor.bindEnvironment((robot, envelope, strings, map) => {
  while (strings.length > 0) {
    const string = strings.shift();

    if (typeof string === 'function') {
      string();
    } else {
      try {
        map(string);
      } catch (err) {
        if (DEBUG) {
          console.error(`Hubot error: ${err}`);
        }

        robot.logger.error(`RocketChat send error: ${err}`);
      }
    }
  }
}); // Monkey-patch Hubot to support private messages

Hubot.Response.prototype.priv = (...strings) => this.robot.adapter.priv(this.envelope, ...strings); // More monkey-patching


Hubot.Robot.prototype.loadAdapter = () => {}; // disable
// grrrr, Meteor.bindEnvironment doesn't preserve `this` apparently


const bind = function (f) {
  const g = Meteor.bindEnvironment((self, ...args) => f.apply(self, args));
  return function (...args) {
    return g(this, ...Array.from(args));
  };
};

class Robot extends Hubot.Robot {
  constructor(...args) {
    super(...(args || []));
    this.hear = bind(this.hear);
    this.respond = bind(this.respond);
    this.enter = bind(this.enter);
    this.leave = bind(this.leave);
    this.topic = bind(this.topic);
    this.error = bind(this.error);
    this.catchAll = bind(this.catchAll);
    this.user = Meteor.users.findOne({
      username: this.name
    }, {
      fields: {
        username: 1
      }
    });
  }

  loadAdapter() {
    return false;
  }

  hear(regex, callback) {
    return super.hear(regex, Meteor.bindEnvironment(callback));
  }

  respond(regex, callback) {
    return super.respond(regex, Meteor.bindEnvironment(callback));
  }

  enter(callback) {
    return super.enter(Meteor.bindEnvironment(callback));
  }

  leave(callback) {
    return super.leave(Meteor.bindEnvironment(callback));
  }

  topic(callback) {
    return super.topic(Meteor.bindEnvironment(callback));
  }

  error(callback) {
    return super.error(Meteor.bindEnvironment(callback));
  }

  catchAll(callback) {
    return super.catchAll(Meteor.bindEnvironment(callback));
  }

}

class RocketChatAdapter extends Hubot.Adapter {
  // Public: Raw method for sending data back to the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.
  send(envelope, ...strings) {
    if (DEBUG) {
      console.log('ROCKETCHATADAPTER -> send'.blue);
    } // console.log envelope, strings


    return sendHelper(this.robot, envelope, strings, string => {
      if (DEBUG) {
        console.log(`send ${envelope.room}: ${string} (${envelope.user.id})`);
      }

      return RocketChat.sendMessage(InternalHubot.user, {
        msg: string
      }, {
        _id: envelope.room
      });
    });
  } // Public: Raw method for sending emote data back to the chat source.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each message to send.
  //
  // Returns nothing.


  emote(envelope, ...strings) {
    if (DEBUG) {
      console.log('ROCKETCHATADAPTER -> emote'.blue);
    }

    return sendHelper(this.robot, envelope, strings, string => {
      if (DEBUG) {
        console.log(`emote ${envelope.rid}: ${string} (${envelope.u.username})`);
      }

      if (envelope.message.private) {
        return this.priv(envelope, `*** ${string} ***`);
      }

      return Meteor.call('sendMessage', {
        msg: string,
        rid: envelope.rid,
        action: true
      });
    });
  } // Priv: our extension -- send a PM to user


  priv(envelope, ...strings) {
    if (DEBUG) {
      console.log('ROCKETCHATADAPTER -> priv'.blue);
    }

    return sendHelper(this.robot, envelope, strings, function (string) {
      if (DEBUG) {
        console.log(`priv ${envelope.room}: ${string} (${envelope.user.id})`);
      }

      return Meteor.call('sendMessage', {
        u: {
          username: RocketChat.settings.get('InternalHubot_Username')
        },
        to: `${envelope.user.id}`,
        msg: string,
        rid: envelope.room
      });
    });
  } // Public: Raw method for building a reply and sending it back to the chat
  // source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more Strings for each reply to send.
  //
  // Returns nothing.


  reply(envelope, ...strings) {
    if (DEBUG) {
      console.log('ROCKETCHATADAPTER -> reply'.blue);
    }

    if (envelope.message.private) {
      return this.priv(envelope, ...strings);
    } else {
      return this.send(envelope, ...strings.map(str => `${envelope.user.name}: ${str}`));
    }
  } // Public: Raw method for setting a topic on the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One more more Strings to set as the topic.
  //
  // Returns nothing.


  topic()
  /*envelope, ...strings*/
  {
    if (DEBUG) {
      return console.log('ROCKETCHATADAPTER -> topic'.blue);
    }
  } // Public: Raw method for playing a sound in the chat source. Extend this.
  //
  // envelope - A Object with message, room and user details.
  // strings  - One or more strings for each play message to send.
  //
  // Returns nothing


  play()
  /*envelope, ...strings*/
  {
    if (DEBUG) {
      return console.log('ROCKETCHATADAPTER -> play'.blue);
    }
  } // Public: Raw method for invoking the bot to run. Extend this.
  //
  // Returns nothing.


  run() {
    if (DEBUG) {
      console.log('ROCKETCHATADAPTER -> run'.blue);
    }

    this.robot.emit('connected');
    return this.robot.brain.mergeData({});
  } // @robot.brain.emit 'loaded'
  // Public: Raw method for shutting the bot down. Extend this.
  //
  // Returns nothing.


  close() {
    if (DEBUG) {
      return console.log('ROCKETCHATADAPTER -> close'.blue);
    }
  }

}

const InternalHubotReceiver = message => {
  if (DEBUG) {
    console.log(message);
  }

  if (message.u.username !== InternalHubot.name) {
    const room = RocketChat.models.Rooms.findOneById(message.rid);
    const enabledForC = RocketChat.settings.get('InternalHubot_EnableForChannels');
    const enabledForD = RocketChat.settings.get('InternalHubot_EnableForDirectMessages');
    const enabledForP = RocketChat.settings.get('InternalHubot_EnableForPrivateGroups');
    const subscribedToP = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, InternalHubot.user._id);

    if (room.t === 'c' && enabledForC || room.t === 'd' && enabledForD || room.t === 'p' && enabledForP && subscribedToP) {
      const InternalHubotUser = new Hubot.User(message.u.username, {
        room: message.rid
      });
      const InternalHubotTextMessage = new Hubot.TextMessage(InternalHubotUser, message.msg, message._id);
      InternalHubot.adapter.receive(InternalHubotTextMessage);
    }
  }

  return message;
};

class HubotScripts {
  constructor(robot) {
    const modulesToLoad = ['hubot-help/src/help.coffee'];
    const customPath = RocketChat.settings.get('InternalHubot_PathToLoadCustomScripts');
    HubotScripts.load(`${__meteor_bootstrap__.serverDir}/npm/node_modules/meteor/rocketchat_internal-hubot/node_modules/`, modulesToLoad, robot);
    HubotScripts.load(customPath, RocketChat.settings.get('InternalHubot_ScriptsToLoad').split(',') || [], robot);
  }

  static load(path, scriptsToLoad, robot) {
    if (!path || !scriptsToLoad) {
      return;
    }

    scriptsToLoad.forEach(scriptFile => {
      try {
        scriptFile = s.trim(scriptFile);

        if (scriptFile === '') {
          return;
        } // delete require.cache[require.resolve(path+scriptFile)];


        const fn = Npm.require(path + scriptFile);

        if (typeof fn === 'function') {
          fn(robot);
        } else {
          fn.default(robot);
        }

        robot.parseHelp(path + scriptFile);
        console.log(`Loaded ${scriptFile}`.green);
      } catch (e) {
        console.log(`Can't load ${scriptFile}`.red);
        console.log(e);
      }
    });
  }

}

const init = _.debounce(Meteor.bindEnvironment(() => {
  if (RocketChat.settings.get('InternalHubot_Enabled')) {
    InternalHubot = new Robot(null, null, false, RocketChat.settings.get('InternalHubot_Username'));
    InternalHubot.alias = 'bot';
    InternalHubot.adapter = new RocketChatAdapter(InternalHubot);
    new HubotScripts(InternalHubot);
    InternalHubot.run();
    return RocketChat.callbacks.add('afterSaveMessage', InternalHubotReceiver, RocketChat.callbacks.priority.LOW, 'InternalHubot');
  } else {
    InternalHubot = {};
    return RocketChat.callbacks.remove('afterSaveMessage', 'InternalHubot');
  }
}), 1000);

Meteor.startup(function () {
  init();
  RocketChat.models.Settings.findByIds(['InternalHubot_Username', 'InternalHubot_Enabled', 'InternalHubot_ScriptsToLoad', 'InternalHubot_PathToLoadCustomScripts']).observe({
    changed() {
      return init();
    }

  }); // TODO useful when we have the ability to invalidate `require` cache
  // RocketChat.RateLimiter.limitMethod('reloadInternalHubot', 1, 5000, {
  // 	userId(/*userId*/) { return true; }
  // });
  // Meteor.methods({
  // 	reloadInternalHubot: () => init()
  // });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_internal-hubot/settings.js                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.settings.addGroup('InternalHubot', function () {
  this.add('InternalHubot_Enabled', false, {
    type: 'boolean',
    i18nLabel: 'Enabled'
  });
  this.add('InternalHubot_Username', 'rocket.cat', {
    type: 'string',
    i18nLabel: 'Username',
    i18nDescription: 'InternalHubot_Username_Description',
    'public': true
  });
  this.add('InternalHubot_ScriptsToLoad', '', {
    type: 'string'
  });
  this.add('InternalHubot_PathToLoadCustomScripts', '', {
    type: 'string'
  });
  this.add('InternalHubot_EnableForChannels', true, {
    type: 'boolean'
  });
  this.add('InternalHubot_EnableForDirectMessages', false, {
    type: 'boolean'
  });
  this.add('InternalHubot_EnableForPrivateGroups', false, {
    type: 'boolean'
  }); // this.add('InternalHubot_reload', 'reloadInternalHubot', {
  // 	type: 'action',
  // 	actionText: 'reload'
  // });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:internal-hubot/hubot.js");
require("/node_modules/meteor/rocketchat:internal-hubot/settings.js");

/* Exports */
Package._define("rocketchat:internal-hubot", {
  Hubot: Hubot,
  HubotScripts: HubotScripts,
  InternalHubot: InternalHubot,
  InternalHubotReceiver: InternalHubotReceiver,
  RocketChatAdapter: RocketChatAdapter
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_internal-hubot.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlcm5hbC1odWJvdC9odWJvdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlcm5hbC1odWJvdC9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzIiwiSHVib3QiLCJOcG0iLCJERUJVRyIsIkludGVybmFsSHVib3QiLCJzZW5kSGVscGVyIiwiTWV0ZW9yIiwiYmluZEVudmlyb25tZW50Iiwicm9ib3QiLCJlbnZlbG9wZSIsInN0cmluZ3MiLCJtYXAiLCJsZW5ndGgiLCJzdHJpbmciLCJzaGlmdCIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImxvZ2dlciIsIlJlc3BvbnNlIiwicHJvdG90eXBlIiwicHJpdiIsImFkYXB0ZXIiLCJSb2JvdCIsImxvYWRBZGFwdGVyIiwiYmluZCIsImYiLCJnIiwic2VsZiIsImFyZ3MiLCJhcHBseSIsIkFycmF5IiwiZnJvbSIsImNvbnN0cnVjdG9yIiwiaGVhciIsInJlc3BvbmQiLCJlbnRlciIsImxlYXZlIiwidG9waWMiLCJjYXRjaEFsbCIsInVzZXIiLCJ1c2VycyIsImZpbmRPbmUiLCJ1c2VybmFtZSIsIm5hbWUiLCJmaWVsZHMiLCJyZWdleCIsImNhbGxiYWNrIiwiUm9ja2V0Q2hhdEFkYXB0ZXIiLCJBZGFwdGVyIiwic2VuZCIsImxvZyIsImJsdWUiLCJyb29tIiwiaWQiLCJSb2NrZXRDaGF0Iiwic2VuZE1lc3NhZ2UiLCJtc2ciLCJfaWQiLCJlbW90ZSIsInJpZCIsInUiLCJtZXNzYWdlIiwicHJpdmF0ZSIsImNhbGwiLCJhY3Rpb24iLCJzZXR0aW5ncyIsImdldCIsInRvIiwicmVwbHkiLCJzdHIiLCJwbGF5IiwicnVuIiwiZW1pdCIsImJyYWluIiwibWVyZ2VEYXRhIiwiY2xvc2UiLCJJbnRlcm5hbEh1Ym90UmVjZWl2ZXIiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUlkIiwiZW5hYmxlZEZvckMiLCJlbmFibGVkRm9yRCIsImVuYWJsZWRGb3JQIiwic3Vic2NyaWJlZFRvUCIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJ0IiwiSW50ZXJuYWxIdWJvdFVzZXIiLCJVc2VyIiwiSW50ZXJuYWxIdWJvdFRleHRNZXNzYWdlIiwiVGV4dE1lc3NhZ2UiLCJyZWNlaXZlIiwiSHVib3RTY3JpcHRzIiwibW9kdWxlc1RvTG9hZCIsImN1c3RvbVBhdGgiLCJsb2FkIiwiX19tZXRlb3JfYm9vdHN0cmFwX18iLCJzZXJ2ZXJEaXIiLCJzcGxpdCIsInBhdGgiLCJzY3JpcHRzVG9Mb2FkIiwiZm9yRWFjaCIsInNjcmlwdEZpbGUiLCJ0cmltIiwiZm4iLCJwYXJzZUhlbHAiLCJncmVlbiIsImUiLCJyZWQiLCJpbml0IiwiZGVib3VuY2UiLCJhbGlhcyIsImNhbGxiYWNrcyIsImFkZCIsInByaW9yaXR5IiwiTE9XIiwicmVtb3ZlIiwic3RhcnR1cCIsIlNldHRpbmdzIiwiZmluZEJ5SWRzIiwib2JzZXJ2ZSIsImNoYW5nZWQiLCJhZGRHcm91cCIsInR5cGUiLCJpMThuTGFiZWwiLCJpMThuRGVzY3JpcHRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsQ0FBSjtBQUFNTCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0MsUUFBRUQsQ0FBRjtBQUFJOztBQUFoQixDQUExQyxFQUE0RCxDQUE1RDtBQUErREosT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFS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VSxVQUFNLFNBQVI7QUFBbUJDLGVBQVc7QUFBOUIsR0FBekM7QUFDQSxPQUFLWCxHQUFMLENBQVMsd0JBQVQsRUFBbUMsWUFBbkMsRUFBaUQ7QUFBRVUsVUFBTSxRQUFSO0FBQWtCQyxlQUFXLFVBQTdCO0FBQXlDQyxxQkFBaUIsb0NBQTFEO0FBQWdHLGNBQVU7QUFBMUcsR0FBakQ7QUFDQSxPQUFLWixHQUFMLENBQVMsNkJBQVQsRUFBd0MsRUFBeEMsRUFBNEM7QUFBRVUsVUFBTTtBQUFSLEdBQTVDO0FBQ0EsT0FBS1YsR0FBTCxDQUFTLHVDQUFULEVBQWtELEVBQWxELEVBQXNEO0FBQUVVLFVBQU07QUFBUixHQUF0RDtBQUNBLE9BQUtWLEdBQUwsQ0FBUyxpQ0FBVCxFQUE0QyxJQUE1QyxFQUFrRDtBQUFFVSxVQUFNO0FBQVIsR0FBbEQ7QUFDQSxPQUFLVixHQUFMLENBQVMsdUNBQVQsRUFBa0QsS0FBbEQsRUFBeUQ7QUFBRVUsVUFBTTtBQUFSLEdBQXpEO0FBQ0EsT0FBS1YsR0FBTCxDQUFTLHNDQUFULEVBQWlELEtBQWpELEVBQXdEO0FBQUVVLFVBQU07QUFBUixHQUF4RCxFQVB3RCxDQVF4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBWkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9pbnRlcm5hbC1odWJvdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgX19tZXRlb3JfYm9vdHN0cmFwX18gKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5pbXBvcnQgJ2NvZmZlZXNjcmlwdC9yZWdpc3Rlcic7XG5cbmNvbnN0IEh1Ym90ID0gTnBtLnJlcXVpcmUoJ2h1Ym90Jyk7XG5cbi8vIFN0YXJ0IGEgaHVib3QsIGNvbm5lY3RlZCB0byBvdXIgY2hhdCByb29tLlxuLy8gJ3VzZSBzdHJpY3QnXG4vLyBMb2cgbWVzc2FnZXM/XG5jb25zdCBERUJVRyA9IGZhbHNlO1xuXG5sZXQgSW50ZXJuYWxIdWJvdCA9IHt9O1xuXG5jb25zdCBzZW5kSGVscGVyID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgocm9ib3QsIGVudmVsb3BlLCBzdHJpbmdzLCBtYXApID0+e1xuXHR3aGlsZSAoc3RyaW5ncy5sZW5ndGggPiAwKSB7XG5cdFx0Y29uc3Qgc3RyaW5nID0gc3RyaW5ncy5zaGlmdCgpO1xuXHRcdGlmICh0eXBlb2Yoc3RyaW5nKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0c3RyaW5nKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdG1hcChzdHJpbmcpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGlmIChERUJVRykgeyBjb25zb2xlLmVycm9yKGBIdWJvdCBlcnJvcjogJHsgZXJyIH1gKTsgfVxuXHRcdFx0XHRyb2JvdC5sb2dnZXIuZXJyb3IoYFJvY2tldENoYXQgc2VuZCBlcnJvcjogJHsgZXJyIH1gKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0pO1xuXG4vLyBNb25rZXktcGF0Y2ggSHVib3QgdG8gc3VwcG9ydCBwcml2YXRlIG1lc3NhZ2VzXG5IdWJvdC5SZXNwb25zZS5wcm90b3R5cGUucHJpdiA9ICguLi5zdHJpbmdzKSA9PiB0aGlzLnJvYm90LmFkYXB0ZXIucHJpdih0aGlzLmVudmVsb3BlLCAuLi5zdHJpbmdzKTtcblxuLy8gTW9yZSBtb25rZXktcGF0Y2hpbmdcbkh1Ym90LlJvYm90LnByb3RvdHlwZS5sb2FkQWRhcHRlciA9ICgpID0+IHt9OyAvLyBkaXNhYmxlXG5cbi8vIGdycnJyLCBNZXRlb3IuYmluZEVudmlyb25tZW50IGRvZXNuJ3QgcHJlc2VydmUgYHRoaXNgIGFwcGFyZW50bHlcbmNvbnN0IGJpbmQgPSBmdW5jdGlvbihmKSB7XG5cdGNvbnN0IGcgPSBNZXRlb3IuYmluZEVudmlyb25tZW50KChzZWxmLCAuLi5hcmdzKSA9PiBmLmFwcGx5KHNlbGYsIGFyZ3MpKTtcblx0cmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHsgcmV0dXJuIGcodGhpcywgLi4uQXJyYXkuZnJvbShhcmdzKSk7IH07XG59O1xuXG5jbGFzcyBSb2JvdCBleHRlbmRzIEh1Ym90LlJvYm90IHtcblx0Y29uc3RydWN0b3IoLi4uYXJncykge1xuXHRcdHN1cGVyKC4uLihhcmdzIHx8IFtdKSk7XG5cdFx0dGhpcy5oZWFyID0gYmluZCh0aGlzLmhlYXIpO1xuXHRcdHRoaXMucmVzcG9uZCA9IGJpbmQodGhpcy5yZXNwb25kKTtcblx0XHR0aGlzLmVudGVyID0gYmluZCh0aGlzLmVudGVyKTtcblx0XHR0aGlzLmxlYXZlID0gYmluZCh0aGlzLmxlYXZlKTtcblx0XHR0aGlzLnRvcGljID0gYmluZCh0aGlzLnRvcGljKTtcblx0XHR0aGlzLmVycm9yID0gYmluZCh0aGlzLmVycm9yKTtcblx0XHR0aGlzLmNhdGNoQWxsID0gYmluZCh0aGlzLmNhdGNoQWxsKTtcblx0XHR0aGlzLnVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7dXNlcm5hbWU6IHRoaXMubmFtZX0sIHtmaWVsZHM6IHt1c2VybmFtZTogMX19KTtcblx0fVxuXHRsb2FkQWRhcHRlcigpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGhlYXIocmVnZXgsIGNhbGxiYWNrKSB7IHJldHVybiBzdXBlci5oZWFyKHJlZ2V4LCBNZXRlb3IuYmluZEVudmlyb25tZW50KGNhbGxiYWNrKSk7IH1cblx0cmVzcG9uZChyZWdleCwgY2FsbGJhY2spIHsgcmV0dXJuIHN1cGVyLnJlc3BvbmQocmVnZXgsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2spKTsgfVxuXHRlbnRlcihjYWxsYmFjaykgeyByZXR1cm4gc3VwZXIuZW50ZXIoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjaykpOyB9XG5cdGxlYXZlKGNhbGxiYWNrKSB7IHJldHVybiBzdXBlci5sZWF2ZShNZXRlb3IuYmluZEVudmlyb25tZW50KGNhbGxiYWNrKSk7IH1cblx0dG9waWMoY2FsbGJhY2spIHsgcmV0dXJuIHN1cGVyLnRvcGljKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2spKTsgfVxuXHRlcnJvcihjYWxsYmFjaykgeyByZXR1cm4gc3VwZXIuZXJyb3IoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjaykpOyB9XG5cdGNhdGNoQWxsKGNhbGxiYWNrKSB7IHJldHVybiBzdXBlci5jYXRjaEFsbChNZXRlb3IuYmluZEVudmlyb25tZW50KGNhbGxiYWNrKSk7IH1cbn1cblxuY2xhc3MgUm9ja2V0Q2hhdEFkYXB0ZXIgZXh0ZW5kcyBIdWJvdC5BZGFwdGVyIHtcblx0Ly8gUHVibGljOiBSYXcgbWV0aG9kIGZvciBzZW5kaW5nIGRhdGEgYmFjayB0byB0aGUgY2hhdCBzb3VyY2UuIEV4dGVuZCB0aGlzLlxuXHQvL1xuXHQvLyBlbnZlbG9wZSAtIEEgT2JqZWN0IHdpdGggbWVzc2FnZSwgcm9vbSBhbmQgdXNlciBkZXRhaWxzLlxuXHQvLyBzdHJpbmdzICAtIE9uZSBvciBtb3JlIFN0cmluZ3MgZm9yIGVhY2ggbWVzc2FnZSB0byBzZW5kLlxuXHQvL1xuXHQvLyBSZXR1cm5zIG5vdGhpbmcuXG5cdHNlbmQoZW52ZWxvcGUsIC4uLnN0cmluZ3MpIHtcblx0XHRpZiAoREVCVUcpIHsgY29uc29sZS5sb2coJ1JPQ0tFVENIQVRBREFQVEVSIC0+IHNlbmQnLmJsdWUpOyB9XG5cdFx0Ly8gY29uc29sZS5sb2cgZW52ZWxvcGUsIHN0cmluZ3Ncblx0XHRyZXR1cm4gc2VuZEhlbHBlcih0aGlzLnJvYm90LCBlbnZlbG9wZSwgc3RyaW5ncywgc3RyaW5nID0+IHtcblx0XHRcdGlmIChERUJVRykgeyBjb25zb2xlLmxvZyhgc2VuZCAkeyBlbnZlbG9wZS5yb29tIH06ICR7IHN0cmluZyB9ICgkeyBlbnZlbG9wZS51c2VyLmlkIH0pYCk7IH1cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKEludGVybmFsSHVib3QudXNlciwgeyBtc2c6IHN0cmluZyB9LCB7IF9pZDogZW52ZWxvcGUucm9vbSB9KTtcblx0XHR9KTtcblx0fVxuXG5cdC8vIFB1YmxpYzogUmF3IG1ldGhvZCBmb3Igc2VuZGluZyBlbW90ZSBkYXRhIGJhY2sgdG8gdGhlIGNoYXQgc291cmNlLlxuXHQvL1xuXHQvLyBlbnZlbG9wZSAtIEEgT2JqZWN0IHdpdGggbWVzc2FnZSwgcm9vbSBhbmQgdXNlciBkZXRhaWxzLlxuXHQvLyBzdHJpbmdzICAtIE9uZSBvciBtb3JlIFN0cmluZ3MgZm9yIGVhY2ggbWVzc2FnZSB0byBzZW5kLlxuXHQvL1xuXHQvLyBSZXR1cm5zIG5vdGhpbmcuXG5cdGVtb3RlKGVudmVsb3BlLCAuLi5zdHJpbmdzKSB7XG5cdFx0aWYgKERFQlVHKSB7IGNvbnNvbGUubG9nKCdST0NLRVRDSEFUQURBUFRFUiAtPiBlbW90ZScuYmx1ZSk7IH1cblx0XHRyZXR1cm4gc2VuZEhlbHBlcih0aGlzLnJvYm90LCBlbnZlbG9wZSwgc3RyaW5ncywgc3RyaW5nID0+IHtcblx0XHRcdGlmIChERUJVRykgeyBjb25zb2xlLmxvZyhgZW1vdGUgJHsgZW52ZWxvcGUucmlkIH06ICR7IHN0cmluZyB9ICgkeyBlbnZlbG9wZS51LnVzZXJuYW1lIH0pYCk7IH1cblx0XHRcdGlmIChlbnZlbG9wZS5tZXNzYWdlLnByaXZhdGUpIHsgcmV0dXJuIHRoaXMucHJpdihlbnZlbG9wZSwgYCoqKiAkeyBzdHJpbmcgfSAqKipgKTsgfVxuXHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIHtcblx0XHRcdFx0bXNnOiBzdHJpbmcsXG5cdFx0XHRcdHJpZDogZW52ZWxvcGUucmlkLFxuXHRcdFx0XHRhY3Rpb246IHRydWVcblx0XHRcdH1cblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBQcml2OiBvdXIgZXh0ZW5zaW9uIC0tIHNlbmQgYSBQTSB0byB1c2VyXG5cdHByaXYoZW52ZWxvcGUsIC4uLnN0cmluZ3MpIHtcblx0XHRpZiAoREVCVUcpIHsgY29uc29sZS5sb2coJ1JPQ0tFVENIQVRBREFQVEVSIC0+IHByaXYnLmJsdWUpOyB9XG5cdFx0cmV0dXJuIHNlbmRIZWxwZXIodGhpcy5yb2JvdCwgZW52ZWxvcGUsIHN0cmluZ3MsIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0aWYgKERFQlVHKSB7IGNvbnNvbGUubG9nKGBwcml2ICR7IGVudmVsb3BlLnJvb20gfTogJHsgc3RyaW5nIH0gKCR7IGVudmVsb3BlLnVzZXIuaWQgfSlgKTsgfVxuXHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIHtcblx0XHRcdFx0dToge1xuXHRcdFx0XHRcdHVzZXJuYW1lOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSW50ZXJuYWxIdWJvdF9Vc2VybmFtZScpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHRvOiBgJHsgZW52ZWxvcGUudXNlci5pZCB9YCxcblx0XHRcdFx0bXNnOiBzdHJpbmcsXG5cdFx0XHRcdHJpZDogZW52ZWxvcGUucm9vbVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBQdWJsaWM6IFJhdyBtZXRob2QgZm9yIGJ1aWxkaW5nIGEgcmVwbHkgYW5kIHNlbmRpbmcgaXQgYmFjayB0byB0aGUgY2hhdFxuXHQvLyBzb3VyY2UuIEV4dGVuZCB0aGlzLlxuXHQvL1xuXHQvLyBlbnZlbG9wZSAtIEEgT2JqZWN0IHdpdGggbWVzc2FnZSwgcm9vbSBhbmQgdXNlciBkZXRhaWxzLlxuXHQvLyBzdHJpbmdzICAtIE9uZSBvciBtb3JlIFN0cmluZ3MgZm9yIGVhY2ggcmVwbHkgdG8gc2VuZC5cblx0Ly9cblx0Ly8gUmV0dXJucyBub3RoaW5nLlxuXHRyZXBseShlbnZlbG9wZSwgLi4uc3RyaW5ncykge1xuXHRcdGlmIChERUJVRykgeyBjb25zb2xlLmxvZygnUk9DS0VUQ0hBVEFEQVBURVIgLT4gcmVwbHknLmJsdWUpOyB9XG5cdFx0aWYgKGVudmVsb3BlLm1lc3NhZ2UucHJpdmF0ZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMucHJpdihlbnZlbG9wZSwgLi4uc3RyaW5ncyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLnNlbmQoZW52ZWxvcGUsIC4uLnN0cmluZ3MubWFwKHN0ciA9PiBgJHsgZW52ZWxvcGUudXNlci5uYW1lIH06ICR7IHN0ciB9YCkpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFB1YmxpYzogUmF3IG1ldGhvZCBmb3Igc2V0dGluZyBhIHRvcGljIG9uIHRoZSBjaGF0IHNvdXJjZS4gRXh0ZW5kIHRoaXMuXG5cdC8vXG5cdC8vIGVudmVsb3BlIC0gQSBPYmplY3Qgd2l0aCBtZXNzYWdlLCByb29tIGFuZCB1c2VyIGRldGFpbHMuXG5cdC8vIHN0cmluZ3MgIC0gT25lIG1vcmUgbW9yZSBTdHJpbmdzIHRvIHNldCBhcyB0aGUgdG9waWMuXG5cdC8vXG5cdC8vIFJldHVybnMgbm90aGluZy5cblx0dG9waWMoLyplbnZlbG9wZSwgLi4uc3RyaW5ncyovKSB7XG5cdFx0aWYgKERFQlVHKSB7IHJldHVybiBjb25zb2xlLmxvZygnUk9DS0VUQ0hBVEFEQVBURVIgLT4gdG9waWMnLmJsdWUpOyB9XG5cdH1cblxuXHQvLyBQdWJsaWM6IFJhdyBtZXRob2QgZm9yIHBsYXlpbmcgYSBzb3VuZCBpbiB0aGUgY2hhdCBzb3VyY2UuIEV4dGVuZCB0aGlzLlxuXHQvL1xuXHQvLyBlbnZlbG9wZSAtIEEgT2JqZWN0IHdpdGggbWVzc2FnZSwgcm9vbSBhbmQgdXNlciBkZXRhaWxzLlxuXHQvLyBzdHJpbmdzICAtIE9uZSBvciBtb3JlIHN0cmluZ3MgZm9yIGVhY2ggcGxheSBtZXNzYWdlIHRvIHNlbmQuXG5cdC8vXG5cdC8vIFJldHVybnMgbm90aGluZ1xuXHRwbGF5KC8qZW52ZWxvcGUsIC4uLnN0cmluZ3MqLykge1xuXHRcdGlmIChERUJVRykgeyByZXR1cm4gY29uc29sZS5sb2coJ1JPQ0tFVENIQVRBREFQVEVSIC0+IHBsYXknLmJsdWUpOyB9XG5cdH1cblxuXHQvLyBQdWJsaWM6IFJhdyBtZXRob2QgZm9yIGludm9raW5nIHRoZSBib3QgdG8gcnVuLiBFeHRlbmQgdGhpcy5cblx0Ly9cblx0Ly8gUmV0dXJucyBub3RoaW5nLlxuXHRydW4oKSB7XG5cdFx0aWYgKERFQlVHKSB7IGNvbnNvbGUubG9nKCdST0NLRVRDSEFUQURBUFRFUiAtPiBydW4nLmJsdWUpOyB9XG5cdFx0dGhpcy5yb2JvdC5lbWl0KCdjb25uZWN0ZWQnKTtcblx0XHRyZXR1cm4gdGhpcy5yb2JvdC5icmFpbi5tZXJnZURhdGEoe30pO1xuXHR9XG5cdC8vIEByb2JvdC5icmFpbi5lbWl0ICdsb2FkZWQnXG5cblx0Ly8gUHVibGljOiBSYXcgbWV0aG9kIGZvciBzaHV0dGluZyB0aGUgYm90IGRvd24uIEV4dGVuZCB0aGlzLlxuXHQvL1xuXHQvLyBSZXR1cm5zIG5vdGhpbmcuXG5cdGNsb3NlKCkge1xuXHRcdGlmIChERUJVRykgeyByZXR1cm4gY29uc29sZS5sb2coJ1JPQ0tFVENIQVRBREFQVEVSIC0+IGNsb3NlJy5ibHVlKTsgfVxuXHR9XG59XG5cbmNvbnN0IEludGVybmFsSHVib3RSZWNlaXZlciA9IChtZXNzYWdlKSA9PiB7XG5cdGlmIChERUJVRykgeyBjb25zb2xlLmxvZyhtZXNzYWdlKTsgfVxuXHRpZiAobWVzc2FnZS51LnVzZXJuYW1lICE9PSBJbnRlcm5hbEh1Ym90Lm5hbWUpIHtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpO1xuXHRcdGNvbnN0IGVuYWJsZWRGb3JDID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ludGVybmFsSHVib3RfRW5hYmxlRm9yQ2hhbm5lbHMnKTtcblx0XHRjb25zdCBlbmFibGVkRm9yRCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJbnRlcm5hbEh1Ym90X0VuYWJsZUZvckRpcmVjdE1lc3NhZ2VzJyk7XG5cdFx0Y29uc3QgZW5hYmxlZEZvclAgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSW50ZXJuYWxIdWJvdF9FbmFibGVGb3JQcml2YXRlR3JvdXBzJyk7XG5cdFx0Y29uc3Qgc3Vic2NyaWJlZFRvUCA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCBJbnRlcm5hbEh1Ym90LnVzZXIuX2lkKTtcblxuXHRcdGlmIChcblx0XHRcdChyb29tLnQgPT09ICdjJyAmJiBlbmFibGVkRm9yQylcblx0XHRcdHx8IChyb29tLnQgPT09ICdkJyAmJiBlbmFibGVkRm9yRClcblx0XHRcdHx8IChyb29tLnQgPT09ICdwJyAmJiBlbmFibGVkRm9yUCAmJiBzdWJzY3JpYmVkVG9QKVxuXHRcdCkge1xuXHRcdFx0Y29uc3QgSW50ZXJuYWxIdWJvdFVzZXIgPSBuZXcgSHVib3QuVXNlcihtZXNzYWdlLnUudXNlcm5hbWUsIHtyb29tOiBtZXNzYWdlLnJpZH0pO1xuXHRcdFx0Y29uc3QgSW50ZXJuYWxIdWJvdFRleHRNZXNzYWdlID0gbmV3IEh1Ym90LlRleHRNZXNzYWdlKEludGVybmFsSHVib3RVc2VyLCBtZXNzYWdlLm1zZywgbWVzc2FnZS5faWQpO1xuXHRcdFx0SW50ZXJuYWxIdWJvdC5hZGFwdGVyLnJlY2VpdmUoSW50ZXJuYWxIdWJvdFRleHRNZXNzYWdlKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG1lc3NhZ2U7XG59O1xuXG5jbGFzcyBIdWJvdFNjcmlwdHMge1xuXHRjb25zdHJ1Y3Rvcihyb2JvdCkge1xuXHRcdGNvbnN0IG1vZHVsZXNUb0xvYWQgPSBbXG5cdFx0XHQnaHVib3QtaGVscC9zcmMvaGVscC5jb2ZmZWUnXG5cdFx0XTtcblx0XHRjb25zdCBjdXN0b21QYXRoID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ludGVybmFsSHVib3RfUGF0aFRvTG9hZEN1c3RvbVNjcmlwdHMnKTtcblx0XHRIdWJvdFNjcmlwdHMubG9hZChgJHsgX19tZXRlb3JfYm9vdHN0cmFwX18uc2VydmVyRGlyIH0vbnBtL25vZGVfbW9kdWxlcy9tZXRlb3Ivcm9ja2V0Y2hhdF9pbnRlcm5hbC1odWJvdC9ub2RlX21vZHVsZXMvYCwgbW9kdWxlc1RvTG9hZCwgcm9ib3QpO1xuXHRcdEh1Ym90U2NyaXB0cy5sb2FkKGN1c3RvbVBhdGgsIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJbnRlcm5hbEh1Ym90X1NjcmlwdHNUb0xvYWQnKS5zcGxpdCgnLCcpIHx8IFtdLCByb2JvdCk7XG5cdH1cblxuXHRzdGF0aWMgbG9hZChwYXRoLCBzY3JpcHRzVG9Mb2FkLCByb2JvdCkge1xuXHRcdGlmICghcGF0aCB8fCAhc2NyaXB0c1RvTG9hZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRzY3JpcHRzVG9Mb2FkLmZvckVhY2goc2NyaXB0RmlsZSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzY3JpcHRGaWxlID0gcy50cmltKHNjcmlwdEZpbGUpO1xuXHRcdFx0XHRpZiAoc2NyaXB0RmlsZSA9PT0gJycpIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gZGVsZXRlIHJlcXVpcmUuY2FjaGVbcmVxdWlyZS5yZXNvbHZlKHBhdGgrc2NyaXB0RmlsZSldO1xuXHRcdFx0XHRjb25zdCBmbiA9IE5wbS5yZXF1aXJlKHBhdGggKyBzY3JpcHRGaWxlKTtcblx0XHRcdFx0aWYgKHR5cGVvZihmbikgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRmbihyb2JvdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Zm4uZGVmYXVsdChyb2JvdCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cm9ib3QucGFyc2VIZWxwKHBhdGggKyBzY3JpcHRGaWxlKTtcblx0XHRcdFx0Y29uc29sZS5sb2coYExvYWRlZCAkeyBzY3JpcHRGaWxlIH1gLmdyZWVuKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYENhbid0IGxvYWQgJHsgc2NyaXB0RmlsZSB9YC5yZWQpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufVxuXG5jb25zdCBpbml0ID0gXy5kZWJvdW5jZShNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJbnRlcm5hbEh1Ym90X0VuYWJsZWQnKSkge1xuXHRcdEludGVybmFsSHVib3QgPSBuZXcgUm9ib3QobnVsbCwgbnVsbCwgZmFsc2UsIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdJbnRlcm5hbEh1Ym90X1VzZXJuYW1lJykpO1xuXHRcdEludGVybmFsSHVib3QuYWxpYXMgPSAnYm90Jztcblx0XHRJbnRlcm5hbEh1Ym90LmFkYXB0ZXIgPSBuZXcgUm9ja2V0Q2hhdEFkYXB0ZXIoSW50ZXJuYWxIdWJvdCk7XG5cdFx0bmV3IEh1Ym90U2NyaXB0cyhJbnRlcm5hbEh1Ym90KTtcblx0XHRJbnRlcm5hbEh1Ym90LnJ1bigpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBJbnRlcm5hbEh1Ym90UmVjZWl2ZXIsIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ0ludGVybmFsSHVib3QnKTtcblx0fSBlbHNlIHtcblx0XHRJbnRlcm5hbEh1Ym90ID0ge307XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgnYWZ0ZXJTYXZlTWVzc2FnZScsICdJbnRlcm5hbEh1Ym90Jyk7XG5cdH1cbn0pLCAxMDAwKTtcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdGluaXQoKTtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZEJ5SWRzKFsgJ0ludGVybmFsSHVib3RfVXNlcm5hbWUnLCAnSW50ZXJuYWxIdWJvdF9FbmFibGVkJywgJ0ludGVybmFsSHVib3RfU2NyaXB0c1RvTG9hZCcsICdJbnRlcm5hbEh1Ym90X1BhdGhUb0xvYWRDdXN0b21TY3JpcHRzJ10pLm9ic2VydmUoe1xuXHRcdGNoYW5nZWQoKSB7XG5cdFx0XHRyZXR1cm4gaW5pdCgpO1xuXHRcdH1cblx0fSk7XG5cdC8vIFRPRE8gdXNlZnVsIHdoZW4gd2UgaGF2ZSB0aGUgYWJpbGl0eSB0byBpbnZhbGlkYXRlIGByZXF1aXJlYCBjYWNoZVxuXHQvLyBSb2NrZXRDaGF0LlJhdGVMaW1pdGVyLmxpbWl0TWV0aG9kKCdyZWxvYWRJbnRlcm5hbEh1Ym90JywgMSwgNTAwMCwge1xuXHQvLyBcdHVzZXJJZCgvKnVzZXJJZCovKSB7IHJldHVybiB0cnVlOyB9XG5cdC8vIH0pO1xuXHQvLyBNZXRlb3IubWV0aG9kcyh7XG5cdC8vIFx0cmVsb2FkSW50ZXJuYWxIdWJvdDogKCkgPT4gaW5pdCgpXG5cdC8vIH0pO1xufSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdJbnRlcm5hbEh1Ym90JywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuYWRkKCdJbnRlcm5hbEh1Ym90X0VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGkxOG5MYWJlbDogJ0VuYWJsZWQnIH0pO1xuXHR0aGlzLmFkZCgnSW50ZXJuYWxIdWJvdF9Vc2VybmFtZScsICdyb2NrZXQuY2F0JywgeyB0eXBlOiAnc3RyaW5nJywgaTE4bkxhYmVsOiAnVXNlcm5hbWUnLCBpMThuRGVzY3JpcHRpb246ICdJbnRlcm5hbEh1Ym90X1VzZXJuYW1lX0Rlc2NyaXB0aW9uJywgJ3B1YmxpYyc6IHRydWUgfSk7XG5cdHRoaXMuYWRkKCdJbnRlcm5hbEh1Ym90X1NjcmlwdHNUb0xvYWQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJ30pO1xuXHR0aGlzLmFkZCgnSW50ZXJuYWxIdWJvdF9QYXRoVG9Mb2FkQ3VzdG9tU2NyaXB0cycsICcnLCB7IHR5cGU6ICdzdHJpbmcnIH0pO1xuXHR0aGlzLmFkZCgnSW50ZXJuYWxIdWJvdF9FbmFibGVGb3JDaGFubmVscycsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nIH0pO1xuXHR0aGlzLmFkZCgnSW50ZXJuYWxIdWJvdF9FbmFibGVGb3JEaXJlY3RNZXNzYWdlcycsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJyB9KTtcblx0dGhpcy5hZGQoJ0ludGVybmFsSHVib3RfRW5hYmxlRm9yUHJpdmF0ZUdyb3VwcycsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJyB9KTtcblx0Ly8gdGhpcy5hZGQoJ0ludGVybmFsSHVib3RfcmVsb2FkJywgJ3JlbG9hZEludGVybmFsSHVib3QnLCB7XG5cdC8vIFx0dHlwZTogJ2FjdGlvbicsXG5cdC8vIFx0YWN0aW9uVGV4dDogJ3JlbG9hZCdcblx0Ly8gfSk7XG59KTtcbiJdfQ==
