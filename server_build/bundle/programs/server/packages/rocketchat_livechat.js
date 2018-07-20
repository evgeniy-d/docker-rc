(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Autoupdate = Package.autoupdate.Autoupdate;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var Streamer = Package['rocketchat:streamer'].Streamer;
var UserPresence = Package['konecty:user-presence'].UserPresence;
var UserPresenceMonitor = Package['konecty:user-presence'].UserPresenceMonitor;
var UserPresenceEvents = Package['konecty:user-presence'].UserPresenceEvents;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var department, emailSettings, self, _id, agents, username, agent, exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:livechat":{"livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/livechat.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
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
WebApp = Package.webapp.WebApp;
const Autoupdate = Package.autoupdate.Autoupdate;
WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
  const reqUrl = url.parse(req.url);

  if (reqUrl.pathname !== '/') {
    return next();
  }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  let domainWhiteList = RocketChat.settings.get('Livechat_AllowedDomainsList');

  if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
    domainWhiteList = _.map(domainWhiteList.split(','), function (domain) {
      return domain.trim();
    });
    const referer = url.parse(req.headers.referer);

    if (!_.contains(domainWhiteList, referer.host)) {
      res.setHeader('X-FRAME-OPTIONS', 'DENY');
      return next();
    }

    res.setHeader('X-FRAME-OPTIONS', `ALLOW-FROM ${referer.protocol}//${referer.host}`);
  }

  const head = Assets.getText('public/head.html');
  let baseUrl;

  if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
    baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  } else {
    baseUrl = '/';
  }

  if (/\/$/.test(baseUrl) === false) {
    baseUrl += '/';
  }

  const html = `<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="${baseUrl}livechat/livechat.css?_dc=${Autoupdate.autoupdateVersion}">
			<script type="text/javascript">
				__meteor_runtime_config__ = ${JSON.stringify(__meteor_runtime_config__)};
			</script>

			<base href="${baseUrl}">

			${head}
		</head>
		<body>
			<script type="text/javascript" src="${baseUrl}livechat/livechat.js?_dc=${Autoupdate.autoupdateVersion}"></script>
		</body>
	</html>`;
  res.write(html);
  res.end();
}));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/startup.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(() => {
  RocketChat.roomTypes.setRoomFind('l', _id => {
    return RocketChat.models.Rooms.findLivechatById(_id);
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user) {
    return room && room.t === 'l' && user && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user, extraData) {
    if (!room && extraData && extraData.rid) {
      room = RocketChat.models.Rooms.findOneById(extraData.rid);
    }

    return room && room.t === 'l' && extraData && extraData.visitorToken && room.v && room.v.token === extraData.visitorToken;
  });
  RocketChat.callbacks.add('beforeLeaveRoom', function (user, room) {
    if (room.t !== 'l') {
      return user;
    }

    throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
      lng: user.language || RocketChat.settings.get('language') || 'en'
    }));
  }, RocketChat.callbacks.priority.LOW, 'cant-leave-room');
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/visitorStatus.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceEvents */
Meteor.startup(() => {
  UserPresenceEvents.on('setStatus', (session, status, metadata) => {
    if (metadata && metadata.visitor) {
      RocketChat.models.LivechatInquiry.updateVisitorStatus(metadata.visitor, status);
      RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomType.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/roomType.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatRoomType;
module.watch(require("../imports/LivechatRoomType"), {
  default(v) {
    LivechatRoomType = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("./models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);

class LivechatRoomTypeServer extends LivechatRoomType {
  getMsgSender(senderId) {
    return LivechatVisitors.findOneById(senderId);
  }
  /**
   * Returns details to use on notifications
   *
   * @param {object} room
   * @param {object} user
   * @param {string} notificationMessage
   * @return {object} Notification details
   */


  getNotificationDetails(room, user, notificationMessage) {
    const title = `[livechat] ${this.roomName(room)}`;
    const text = notificationMessage;
    return {
      title,
      text
    };
  }

  canAccessUploadedFile({
    rc_token,
    rc_rid
  } = {}) {
    return rc_token && rc_rid && RocketChat.models.Rooms.findOneOpenByVisitorToken(rc_token, rc_rid);
  }

}

RocketChat.roomTypes.add(new LivechatRoomTypeServer());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hooks":{"externalMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/externalMessage.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let knowledgeEnabled = false;
let apiaiKey = '';
let apiaiLanguage = 'en';
RocketChat.settings.get('Livechat_Knowledge_Enabled', function (key, value) {
  knowledgeEnabled = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
  apiaiKey = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
  apiaiLanguage = value;
});
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  }

  if (!knowledgeEnabled) {
    return message;
  }

  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return message;
  } // if the message hasn't a token, it was not sent by the visitor, so ignore it


  if (!message.token) {
    return message;
  }

  Meteor.defer(() => {
    try {
      const response = HTTP.post('https://api.api.ai/api/query?v=20150910', {
        data: {
          query: message.msg,
          lang: apiaiLanguage,
          sessionId: room._id
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${apiaiKey}`
        }
      });

      if (response.data && response.data.status.code === 200 && !_.isEmpty(response.data.result.fulfillment.speech)) {
        RocketChat.models.LivechatExternalMessage.insert({
          rid: message.rid,
          msg: response.data.result.fulfillment.speech,
          orig: message._id,
          ts: new Date()
        });
      }
    } catch (e) {
      SystemLogger.error('Error using Api.ai ->', e);
    }
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'externalWebHook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leadCapture.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/leadCapture.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

function validateMessage(message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return false;
  } // message valid only if it is a livechat room


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return false;
  } // if the message hasn't a token, it was NOT sent from the visitor, so ignore it


  if (!message.token) {
    return false;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return false;
  }

  return true;
}

RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  if (!validateMessage(message, room)) {
    return message;
  }

  const phoneRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_phone_regex'), 'g');
  const msgPhones = message.msg.match(phoneRegexp);
  const emailRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_email_regex'), 'gi');
  const msgEmails = message.msg.match(emailRegexp);

  if (msgEmails || msgPhones) {
    LivechatVisitors.saveGuestEmailPhoneById(room.v._id, msgEmails, msgPhones);
    RocketChat.callbacks.run('livechat.leadCapture', room);
  }

  return message;
}, RocketChat.callbacks.priority.LOW, 'leadCapture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markRoomResponded.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/markRoomResponded.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  } // check if room is yet awaiting for response


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.waitingResponse)) {
    return message;
  } // if the message has a token, it was sent by the visitor, so ignore it


  if (message.token) {
    return message;
  }

  Meteor.defer(() => {
    const now = new Date();
    RocketChat.models.Rooms.setResponseByRoomId(room._id, {
      user: {
        _id: message.u._id,
        username: message.u.username
      },
      responseDate: now,
      responseTime: (now.getTime() - room.ts) / 1000
    });
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'markRoomResponded');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"offlineMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/offlineMessage.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('livechat.offlineMessage', data => {
  if (!RocketChat.settings.get('Livechat_webhook_on_offline_msg')) {
    return data;
  }

  const postData = {
    type: 'LivechatOfflineMessage',
    sentAt: new Date(),
    visitor: {
      name: data.name,
      email: data.email
    },
    message: data.message
  };
  RocketChat.Livechat.sendRequest(postData);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-email-offline-message');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RDStation.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/RDStation.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function sendToRDStation(room) {
  if (!RocketChat.settings.get('Livechat_RDStation_Token')) {
    return room;
  }

  const livechatData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);

  if (!livechatData.visitor.email) {
    return room;
  }

  const options = {
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      token_rdstation: RocketChat.settings.get('Livechat_RDStation_Token'),
      identificador: 'rocketchat-livechat',
      client_id: livechatData.visitor._id,
      email: livechatData.visitor.email
    }
  };
  options.data.nome = livechatData.visitor.name || livechatData.visitor.username;

  if (livechatData.visitor.phone) {
    options.data.telefone = livechatData.visitor.phone;
  }

  if (livechatData.tags) {
    options.data.tags = livechatData.tags;
  }

  Object.keys(livechatData.customFields || {}).forEach(field => {
    options.data[field] = livechatData.customFields[field];
  });
  Object.keys(livechatData.visitor.customFields || {}).forEach(field => {
    options.data[field] = livechatData.visitor.customFields[field];
  });

  try {
    HTTP.call('POST', 'https://www.rdstation.com.br/api/1.3/conversions', options);
  } catch (e) {
    console.error('Error sending lead to RD Station ->', e);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-close-room');
RocketChat.callbacks.add('livechat.saveInfo', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-save-info');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToCRM.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToCRM.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const msgNavType = 'livechat_navigation_history';

const sendMessageType = msgType => {
  const sendNavHistory = RocketChat.settings.get('Livechat_Visitor_navigation_as_a_message') && RocketChat.settings.get('Send_visitor_navigation_history_livechat_webhook_request');
  return sendNavHistory && msgType === msgNavType;
};

function sendToCRM(type, room, includeMessages = true) {
  const postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);
  postData.type = type;
  postData.messages = [];
  let messages;

  if (typeof includeMessages === 'boolean' && includeMessages) {
    messages = RocketChat.models.Messages.findVisibleByRoomId(room._id, {
      sort: {
        ts: 1
      }
    });
  } else if (includeMessages instanceof Array) {
    messages = includeMessages;
  }

  if (messages) {
    messages.forEach(message => {
      if (message.t && !sendMessageType(message.t)) {
        return;
      }

      const msg = {
        _id: message._id,
        username: message.u.username,
        msg: message.msg,
        ts: message.ts,
        editedAt: message.editedAt
      };

      if (message.u.username !== postData.visitor.username) {
        msg.agentId = message.u._id;
      }

      if (message.t === msgNavType) {
        msg.navigation = message.navigation;
      }

      postData.messages.push(msg);
    });
  }

  const response = RocketChat.Livechat.sendRequest(postData);

  if (response && response.data && response.data.data) {
    RocketChat.models.Rooms.saveCRMDataByRoomId(room._id, response.data.data);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_close')) {
    return room;
  }

  return sendToCRM('LivechatSession', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-close-room');
RocketChat.callbacks.add('livechat.saveInfo', room => {
  // Do not send to CRM if the chat is still open
  if (room.open) {
    return room;
  }

  return sendToCRM('LivechatEdit', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-save-info');
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // only call webhook if it is a livechat room
  if (room.t !== 'l' || room.v == null || room.v.token == null) {
    return message;
  } // if the message has a token, it was sent from the visitor
  // if not, it was sent from the agent


  if (message.token) {
    if (!RocketChat.settings.get('Livechat_webhook_on_visitor_message')) {
      return message;
    }
  } else if (!RocketChat.settings.get('Livechat_webhook_on_agent_message')) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips
  // unless the settings that handle with visitor navigation history are enabled


  if (message.t && !sendMessageType(message.t)) {
    return message;
  }

  sendToCRM('Message', room, [message]);
  return message;
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-message');
RocketChat.callbacks.add('livechat.leadCapture', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_capture')) {
    return room;
  }

  return sendToCRM('LeadCapture', room, false);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-lead-capture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToFacebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToFacebook.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.settings.get('Livechat_Facebook_Enabled') || !RocketChat.settings.get('Livechat_Facebook_API_Key')) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.facebook && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  OmniChannel.reply({
    page: room.facebook.page.id,
    token: room.v.token,
    text: message.msg
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageToFacebook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addAgent.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    return RocketChat.Livechat.addAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addManager.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addManager'
      });
    }

    return RocketChat.Livechat.addManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeLivechatStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/changeLivechatStatus.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:changeLivechatStatus'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:changeLivechatStatus'
      });
    }

    const user = Meteor.user();
    const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';
    return RocketChat.models.Users.setLivechatStatus(user._id, newStatus);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeByVisitor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeByVisitor.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:closeByVisitor'({
    roomId,
    token
  }) {
    const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(token, roomId);

    if (!room || !room.open) {
      return false;
    }

    const visitor = LivechatVisitors.getVisitorByToken(token);
    const language = visitor && visitor.language || RocketChat.settings.get('language') || 'en';
    return RocketChat.Livechat.closeRoom({
      visitor,
      room,
      comment: TAPi18n.__('Closed_by_visitor', {
        lng: language
      })
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeRoom.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:closeRoom'(roomId, comment) {
    const userId = Meteor.userId();

    if (!userId || !RocketChat.authz.hasPermission(userId, 'close-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'l') {
      throw new Meteor.Error('room-not-found', 'Room not found', {
        method: 'livechat:closeRoom'
      });
    }

    const user = Meteor.user();
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, {
      _id: 1
    });

    if (!subscription && !RocketChat.authz.hasPermission(userId, 'close-others-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    return RocketChat.Livechat.closeRoom({
      user,
      room,
      comment
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/facebook.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
Meteor.methods({
  'livechat:facebook'(options) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    try {
      switch (options.action) {
        case 'initialState':
          {
            return {
              enabled: RocketChat.settings.get('Livechat_Facebook_Enabled'),
              hasToken: !!RocketChat.settings.get('Livechat_Facebook_API_Key')
            };
          }

        case 'enable':
          {
            const result = OmniChannel.enable();

            if (!result.success) {
              return result;
            }

            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', true);
          }

        case 'disable':
          {
            OmniChannel.disable();
            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', false);
          }

        case 'list-pages':
          {
            return OmniChannel.listPages();
          }

        case 'subscribe':
          {
            return OmniChannel.subscribe(options.page);
          }

        case 'unsubscribe':
          {
            return OmniChannel.unsubscribe(options.page);
          }
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        if (e.response.data.error.error) {
          throw new Meteor.Error(e.response.data.error.error, e.response.data.error.message);
        }

        if (e.response.data.error.response) {
          throw new Meteor.Error('integration-error', e.response.data.error.response.error.message);
        }

        if (e.response.data.error.message) {
          throw new Meteor.Error('integration-error', e.response.data.error.message);
        }
      }

      console.error('Error contacting omni.rocket.chat:', e);
      throw new Meteor.Error('integration-error', e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getCustomFields.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getCustomFields.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getCustomFields'() {
    return RocketChat.models.LivechatCustomField.find().fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAgentData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getAgentData.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:getAgentData'({
    roomId,
    token
  }) {
    check(roomId, String);
    check(token, String);
    const room = RocketChat.models.Rooms.findOneById(roomId);
    const visitor = LivechatVisitors.getVisitorByToken(token); // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    if (!room.servedBy) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(room.servedBy._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getInitialData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getInitialData.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:getInitialData'(visitorToken) {
    const info = {
      enabled: null,
      title: null,
      color: null,
      registrationForm: null,
      room: null,
      visitor: null,
      triggers: [],
      departments: [],
      allowSwitchingDepartments: null,
      online: true,
      offlineColor: null,
      offlineMessage: null,
      offlineSuccessMessage: null,
      offlineUnavailableMessage: null,
      displayOfflineForm: null,
      videoCall: null,
      fileUpload: null,
      conversationFinishedMessage: null,
      nameFieldRegistrationForm: null,
      emailFieldRegistrationForm: null
    };
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        v: 1,
        servedBy: 1
      }
    }).fetch();

    if (room && room.length > 0) {
      info.room = room[0];
    }

    const visitor = LivechatVisitors.getVisitorByToken(visitorToken, {
      fields: {
        name: 1,
        username: 1,
        visitorEmails: 1
      }
    });

    if (room) {
      info.visitor = visitor;
    }

    const initSettings = RocketChat.Livechat.getInitSettings();
    info.title = initSettings.Livechat_title;
    info.color = initSettings.Livechat_title_color;
    info.enabled = initSettings.Livechat_enabled;
    info.registrationForm = initSettings.Livechat_registration_form;
    info.offlineTitle = initSettings.Livechat_offline_title;
    info.offlineColor = initSettings.Livechat_offline_title_color;
    info.offlineMessage = initSettings.Livechat_offline_message;
    info.offlineSuccessMessage = initSettings.Livechat_offline_success_message;
    info.offlineUnavailableMessage = initSettings.Livechat_offline_form_unavailable;
    info.displayOfflineForm = initSettings.Livechat_display_offline_form;
    info.language = initSettings.Language;
    info.videoCall = initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true;
    info.fileUpload = initSettings.Livechat_fileupload_enabled && initSettings.FileUpload_Enabled;
    info.transcript = initSettings.Livechat_enable_transcript;
    info.transcriptMessage = initSettings.Livechat_transcript_message;
    info.conversationFinishedMessage = initSettings.Livechat_conversation_finished_message;
    info.nameFieldRegistrationForm = initSettings.Livechat_name_field_registration_form;
    info.emailFieldRegistrationForm = initSettings.Livechat_email_field_registration_form;
    info.agentData = room && room[0] && room[0].servedBy && RocketChat.models.Users.getAgentInfo(room[0].servedBy._id);
    RocketChat.models.LivechatTrigger.findEnabled().forEach(trigger => {
      info.triggers.push(_.pick(trigger, '_id', 'actions', 'conditions'));
    });
    RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach(department => {
      info.departments.push(department);
    });
    info.allowSwitchingDepartments = initSettings.Livechat_allow_switching_departments;
    info.online = RocketChat.models.Users.findOnlineAgents().count() > 0;
    return info;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getNextAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getNextAgent.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getNextAgent'({
    token,
    department
  }) {
    check(token, String);
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(token).fetch();

    if (room && room.length > 0) {
      return;
    }

    if (!department) {
      const requireDeparment = RocketChat.Livechat.getRequiredDepartment();

      if (requireDeparment) {
        department = requireDeparment._id;
      }
    }

    const agent = RocketChat.Livechat.getNextAgent(department);

    if (!agent) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(agent.agentId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadHistory.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loadHistory.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loadHistory'({
    token,
    rid,
    end,
    limit = 20,
    ls
  }) {
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!visitor) {
      return;
    }

    return RocketChat.loadMessageHistory({
      userId: visitor._id,
      rid,
      end,
      limit,
      ls
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginByToken.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loginByToken.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loginByToken'(token) {
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!visitor) {
      return;
    }

    return {
      _id: visitor._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/pageVisited.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:pageVisited'(token, room, pageInfo) {
    RocketChat.Livechat.savePageHistory(token, room, pageInfo);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"registerGuest.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/registerGuest.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:registerGuest'({
    token,
    name,
    email,
    department
  } = {}) {
    const userId = RocketChat.Livechat.registerGuest.call(this, {
      token,
      name,
      email,
      department
    }); // update visited page history to not expire

    RocketChat.models.Messages.keepHistoryForToken(token);
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        token: 1,
        name: 1,
        username: 1,
        visitorEmails: 1
      }
    }); //If it's updating an existing visitor, it must also update the roomInfo

    const cursor = RocketChat.models.Rooms.findOpenByVisitorToken(token);
    cursor.forEach(room => {
      RocketChat.Livechat.saveRoomInfo(room, visitor);
    });
    return {
      userId,
      visitor
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeAgent'
      });
    }

    return RocketChat.Livechat.removeAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeCustomField.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeCustomField'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeCustomField'
      });
    }

    check(_id, String);
    const customField = RocketChat.models.LivechatCustomField.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!customField) {
      throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', {
        method: 'livechat:removeCustomField'
      });
    }

    return RocketChat.models.LivechatCustomField.removeById(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeDepartment.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeDepartment'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.Livechat.removeDepartment(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeManager.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.Livechat.removeManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeTrigger.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeTrigger'(triggerId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeTrigger'
      });
    }

    check(triggerId, String);
    return RocketChat.models.LivechatTrigger.removeById(triggerId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeRoom.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeRoom'(rid) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'livechat:removeRoom'
      });
    }

    if (room.t !== 'l') {
      throw new Meteor.Error('error-this-is-not-a-livechat-room', 'This is not a Livechat room', {
        method: 'livechat:removeRoom'
      });
    }

    if (room.open) {
      throw new Meteor.Error('error-room-is-not-closed', 'Room is not closed', {
        method: 'livechat:removeRoom'
      });
    }

    RocketChat.models.Messages.removeByRoomId(rid);
    RocketChat.models.Subscriptions.removeByRoomId(rid);
    return RocketChat.models.Rooms.removeById(rid);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveAppearance.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveAppearance'(settings) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveAppearance'
      });
    }

    const validSettings = ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email', 'Livechat_conversation_finished_message', 'Livechat_registration_form', 'Livechat_name_field_registration_form', 'Livechat_email_field_registration_form'];
    const valid = settings.every(setting => {
      return validSettings.indexOf(setting._id) !== -1;
    });

    if (!valid) {
      throw new Meteor.Error('invalid-setting');
    }

    settings.forEach(setting => {
      RocketChat.settings.updateById(setting._id, setting.value);
    });
    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveCustomField.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveCustomField'(_id, customFieldData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      check(_id, String);
    }

    check(customFieldData, Match.ObjectIncluding({
      field: String,
      label: String,
      scope: String,
      visibility: String
    }));

    if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
      throw new Meteor.Error('error-invalid-custom-field-nmae', 'Invalid custom field name. Use only letters, numbers, hyphens and underscores.', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      const customField = RocketChat.models.LivechatCustomField.findOneById(_id);

      if (!customField) {
        throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', {
          method: 'livechat:saveCustomField'
        });
      }
    }

    return RocketChat.models.LivechatCustomField.createOrUpdateCustomField(_id, customFieldData.field, customFieldData.label, customFieldData.scope, customFieldData.visibility);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveDepartment.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    }

    return RocketChat.Livechat.saveDepartment(_id, departmentData, departmentAgents);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveInfo.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveInfo'(guestData, roomData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    check(guestData, Match.ObjectIncluding({
      _id: String,
      name: Match.Optional(String),
      email: Match.Optional(String),
      phone: Match.Optional(String)
    }));
    check(roomData, Match.ObjectIncluding({
      _id: String,
      topic: Match.Optional(String),
      tags: Match.Optional(String)
    }));
    const room = RocketChat.models.Rooms.findOneById(roomData._id, {
      fields: {
        t: 1,
        servedBy: 1
      }
    });

    if (room == null || room.t !== 'l') {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'livechat:saveInfo'
      });
    }

    if ((!room.servedBy || room.servedBy._id !== Meteor.userId()) && !RocketChat.authz.hasPermission(Meteor.userId(), 'save-others-livechat-room-info')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    const ret = RocketChat.Livechat.saveGuest(guestData) && RocketChat.Livechat.saveRoomInfo(roomData, guestData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveInfo', RocketChat.models.Rooms.findOneById(roomData._id));
    });
    return ret;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveIntegration.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveIntegration.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.methods({
  'livechat:saveIntegration'(values) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveIntegration'
      });
    }

    if (typeof values['Livechat_webhookUrl'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhookUrl', s.trim(values['Livechat_webhookUrl']));
    }

    if (typeof values['Livechat_secret_token'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_secret_token', s.trim(values['Livechat_secret_token']));
    }

    if (typeof values['Livechat_webhook_on_close'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_close', !!values['Livechat_webhook_on_close']);
    }

    if (typeof values['Livechat_webhook_on_offline_msg'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_offline_msg', !!values['Livechat_webhook_on_offline_msg']);
    }

    if (typeof values['Livechat_webhook_on_visitor_message'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_visitor_message', !!values['Livechat_webhook_on_visitor_message']);
    }

    if (typeof values['Livechat_webhook_on_agent_message'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_agent_message', !!values['Livechat_webhook_on_agent_message']);
    }

    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveSurveyFeedback.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveSurveyFeedback.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
Meteor.methods({
  'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
    check(visitorToken, String);
    check(visitorRoom, String);
    check(formData, [Match.ObjectIncluding({
      name: String,
      value: String
    })]);
    const visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    const room = RocketChat.models.Rooms.findOneById(visitorRoom);

    if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
      const updateData = {};

      for (const item of formData) {
        if (_.contains(['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'], item.name) && _.contains(['1', '2', '3', '4', '5'], item.value)) {
          updateData[item.name] = item.value;
        } else if (item.name === 'additionalFeedback') {
          updateData[item.name] = item.value;
        }
      }

      if (!_.isEmpty(updateData)) {
        return RocketChat.models.Rooms.updateSurveyFeedbackById(room._id, updateData);
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveTrigger.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveTrigger'(trigger) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveTrigger'
      });
    }

    check(trigger, {
      _id: Match.Maybe(String),
      name: String,
      description: String,
      enabled: Boolean,
      conditions: Array,
      actions: Array
    });

    if (trigger._id) {
      return RocketChat.models.LivechatTrigger.updateById(trigger._id, trigger);
    } else {
      return RocketChat.models.LivechatTrigger.insert(trigger);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searchAgent.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/searchAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'livechat:searchAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:searchAgent'
      });
    }

    if (!username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'livechat:searchAgent'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:searchAgent'
      });
    }

    return user;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessageLivechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendMessageLivechat.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  sendMessageLivechat({
    token,
    _id,
    rid,
    msg,
    attachments
  }, agent) {
    check(token, String);
    check(_id, String);
    check(rid, String);
    check(msg, String);
    check(agent, Match.Maybe({
      agentId: String,
      username: String
    }));
    const guest = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        name: 1,
        username: 1,
        department: 1,
        token: 1
      }
    });

    if (!guest) {
      throw new Meteor.Error('invalid-token');
    }

    return RocketChat.Livechat.sendMessage({
      guest,
      message: {
        _id,
        rid,
        msg,
        token,
        attachments
      },
      agent
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendFileLivechatMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendFileLivechatMessage.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'sendFileLivechatMessage'(roomId, visitorToken, file, msgData = {}) {
    return Promise.asyncApply(() => {
      const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

      if (!visitor) {
        return false;
      }

      const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(visitorToken, roomId);

      if (!room) {
        return false;
      }

      check(msgData, {
        avatar: Match.Optional(String),
        emoji: Match.Optional(String),
        alias: Match.Optional(String),
        groupable: Match.Optional(Boolean),
        msg: Match.Optional(String)
      });
      const fileUrl = `/file-upload/${file._id}/${encodeURI(file.name)}`;
      const attachment = {
        title: file.name,
        type: 'file',
        description: file.description,
        title_link: fileUrl,
        title_link_download: true
      };

      if (/^image\/.+/.test(file.type)) {
        attachment.image_url = fileUrl;
        attachment.image_type = file.type;
        attachment.image_size = file.size;

        if (file.identify && file.identify.size) {
          attachment.image_dimensions = file.identify.size;
        }

        attachment.image_preview = Promise.await(FileUpload.resizeImagePreview(file));
      } else if (/^audio\/.+/.test(file.type)) {
        attachment.audio_url = fileUrl;
        attachment.audio_type = file.type;
        attachment.audio_size = file.size;
      } else if (/^video\/.+/.test(file.type)) {
        attachment.video_url = fileUrl;
        attachment.video_type = file.type;
        attachment.video_size = file.size;
      }

      const msg = Object.assign({
        _id: Random.id(),
        rid: roomId,
        ts: new Date(),
        msg: '',
        file: {
          _id: file._id,
          name: file.name,
          type: file.type
        },
        groupable: false,
        attachments: [attachment],
        token: visitorToken
      }, msgData);
      return Meteor.call('sendMessageLivechat', msg);
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendOfflineMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendOfflineMessage.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let dns;
module.watch(require("dns"), {
  default(v) {
    dns = v;
  }

}, 0);
Meteor.methods({
  'livechat:sendOfflineMessage'(data) {
    check(data, {
      name: String,
      email: String,
      message: String
    });

    if (!RocketChat.settings.get('Livechat_display_offline_form')) {
      return false;
    }

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const message = `${data.message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
    const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${data.name}</p>
			<p><strong>Visitor email:</strong> ${data.email}</p>
			<p><strong>Message:</strong><br>${message}</p>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    if (RocketChat.settings.get('Livechat_validate_offline_email')) {
      const emailDomain = data.email.substr(data.email.lastIndexOf('@') + 1);

      try {
        Meteor.wrapAsync(dns.resolveMx)(emailDomain);
      } catch (e) {
        throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', {
          method: 'livechat:sendOfflineMessage'
        });
      }
    }

    Meteor.defer(() => {
      Email.send({
        to: RocketChat.settings.get('Livechat_offline_email'),
        from: `${data.name} - ${data.email} <${fromEmail}>`,
        replyTo: `${data.name} <${data.email}>`,
        subject: `Livechat offline message from ${data.name}: ${`${data.message}`.substring(0, 20)}`,
        html: header + html + footer
      });
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.offlineMessage', data);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendOfflineMessage',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setCustomField.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:setCustomField'(token, key, value, overwrite = true) {
    const customField = RocketChat.models.LivechatCustomField.findOneById(key);

    if (customField) {
      if (customField.scope === 'room') {
        return RocketChat.models.Rooms.updateLivechatDataByToken(token, key, value, overwrite);
      } else {
        // Save in user
        return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
      }
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setDepartmentForVisitor.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setDepartmentForVisitor.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:setDepartmentForVisitor'({
    token,
    department
  } = {}) {
    RocketChat.Livechat.setDepartmentForGuest.call(this, {
      token,
      department
    }); // update visited page history to not expire

    RocketChat.models.Messages.keepHistoryForToken(token);
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startVideoCall.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/startVideoCall.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */
Meteor.methods({
  'livechat:startVideoCall'(roomId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeByVisitor'
      });
    }

    const guest = Meteor.user();
    const message = {
      _id: Random.id(),
      rid: roomId || Random.id(),
      msg: '',
      ts: new Date()
    };
    const {
      room
    } = RocketChat.Livechat.getRoom(guest, message, {
      jitsiTimeout: new Date(Date.now() + 3600 * 1000)
    });
    message.rid = room._id;
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
      actionLinks: [{
        icon: 'icon-videocam',
        i18nLabel: 'Accept',
        method_id: 'createLivechatCall',
        params: ''
      }, {
        icon: 'icon-cancel',
        i18nLabel: 'Decline',
        method_id: 'denyLivechatCall',
        params: ''
      }]
    });
    return {
      roomId: room._id,
      domain: RocketChat.settings.get('Jitsi_Domain'),
      jitsiRoom: RocketChat.settings.get('Jitsi_URL_Room_Prefix') + RocketChat.settings.get('uniqueID') + roomId
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startFileUploadRoom.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/startFileUploadRoom.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:startFileUploadRoom'(roomId, token) {
    const guest = LivechatVisitors.getVisitorByToken(token);
    const message = {
      _id: Random.id(),
      rid: roomId || Random.id(),
      msg: '',
      ts: new Date(),
      token: guest.token
    };
    return RocketChat.Livechat.getRoom(guest, message);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"transfer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/transfer.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:transfer'(transferData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:transfer'
      });
    }

    check(transferData, {
      roomId: String,
      userId: Match.Optional(String),
      departmentId: Match.Optional(String)
    });
    const room = RocketChat.models.Rooms.findOneById(transferData.roomId);
    const guest = LivechatVisitors.findOneById(room.v._id);
    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, Meteor.userId(), {
      fields: {
        _id: 1
      }
    });

    if (!subscription && !RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:transfer'
      });
    }

    return RocketChat.Livechat.transfer(room, guest, transferData);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webhookTest.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/webhookTest.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals HTTP */
const postCatchError = Meteor.wrapAsync(function (url, options, resolve) {
  HTTP.post(url, options, function (err, res) {
    if (err) {
      resolve(null, err.response);
    } else {
      resolve(null, res);
    }
  });
});
Meteor.methods({
  'livechat:webhookTest'() {
    this.unblock();
    const sampleData = {
      type: 'LivechatSession',
      _id: 'fasd6f5a4sd6f8a4sdf',
      label: 'title',
      topic: 'asiodojf',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      tags: ['tag1', 'tag2', 'tag3'],
      customFields: {
        productId: '123456'
      },
      visitor: {
        _id: '',
        name: 'visitor name',
        username: 'visitor-username',
        department: 'department',
        email: 'email@address.com',
        phone: '192873192873',
        ip: '123.456.7.89',
        browser: 'Chrome',
        os: 'Linux',
        customFields: {
          customerId: '123456'
        }
      },
      agent: {
        _id: 'asdf89as6df8',
        username: 'agent.username',
        name: 'Agent Name',
        email: 'agent@email.com'
      },
      messages: [{
        username: 'visitor-username',
        msg: 'message content',
        ts: new Date()
      }, {
        username: 'agent.username',
        agentId: 'asdf89as6df8',
        msg: 'message content from agent',
        ts: new Date()
      }]
    };
    const options = {
      headers: {
        'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
      },
      data: sampleData
    };
    const response = postCatchError(RocketChat.settings.get('Livechat_webhookUrl'), options);
    console.log('response ->', response);

    if (response && response.statusCode && response.statusCode === 200) {
      return true;
    } else {
      throw new Meteor.Error('error-invalid-webhook-response');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"takeInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/takeInquiry.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:takeInquiry'(inquiryId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:takeInquiry'
      });
    }

    const inquiry = RocketChat.models.LivechatInquiry.findOneById(inquiryId);

    if (!inquiry || inquiry.status === 'taken') {
      throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', {
        method: 'livechat:takeInquiry'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());
    const agent = {
      agentId: user._id,
      username: user.username
    }; // add subscription

    const subscriptionData = {
      rid: inquiry.rid,
      name: inquiry.name,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Subscriptions.insert(subscriptionData);
    RocketChat.models.Rooms.incUsersCountById(inquiry.rid); // update room

    const room = RocketChat.models.Rooms.findOneById(inquiry.rid);
    RocketChat.models.Rooms.changeAgentByRoomId(inquiry.rid, agent);
    room.servedBy = {
      _id: agent.agentId,
      username: agent.username
    }; // mark inquiry as taken

    RocketChat.models.LivechatInquiry.takeInquiry(inquiry._id); // remove sending message from guest widget
    // dont check if setting is true, because if settingwas switched off inbetween  guest entered pool,
    // and inquiry being taken, message would not be switched off.

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('connected', room._id, user);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    }); // return room corresponding to inquiry (for redirecting agent to the room route)

    return inquiry;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"returnAsInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/returnAsInquiry.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:returnAsInquiry'(rid) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    } // //delete agent and room subscription


    RocketChat.models.Subscriptions.removeByRoomId(rid); // find inquiry corresponding to room

    const inquiry = RocketChat.models.LivechatInquiry.findOne({
      rid
    }); // mark inquiry as open

    return RocketChat.models.LivechatInquiry.openInquiry(inquiry._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveOfficeHours.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveOfficeHours'(day, start, finish, open) {
    RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendTranscript.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendTranscript.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:sendTranscript'(token, rid, email) {
    check(rid, String);
    check(email, String);
    const room = RocketChat.models.Rooms.findOneById(rid);
    const visitor = LivechatVisitors.getVisitorByToken(token);
    const userLanguage = visitor && visitor.language || RocketChat.settings.get('language') || 'en'; // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    const messages = RocketChat.models.Messages.findVisibleByRoomIdNotContainingTypes(rid, ['livechat_navigation_history'], {
      sort: {
        'ts': 1
      }
    });
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    let html = '<div> <hr>';
    messages.forEach(message => {
      if (message.t && ['command', 'livechat-close', 'livechat_video_call'].indexOf(message.t) !== -1) {
        return;
      }

      let author;

      if (message.u._id === visitor._id) {
        author = TAPi18n.__('You', {
          lng: userLanguage
        });
      } else {
        author = message.u.username;
      }

      const datetime = moment(message.ts).locale(userLanguage).format('LLL');
      const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
      html = html + singleMessage;
    });
    html = `${html}</div>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    emailSettings = {
      to: email,
      from: fromEmail,
      replyTo: fromEmail,
      subject: TAPi18n.__('Transcript_of_your_livechat_conversation', {
        lng: userLanguage
      }),
      html: header + html + footer
    };
    Meteor.defer(() => {
      Email.send(emailSettings);
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.sendTranscript', messages, email);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendTranscript',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Users.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Users.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Sets an user as (non)operator
 * @param {string} _id - User's _id
 * @param {boolean} operator - Flag to set as operator or not
 */
RocketChat.models.Users.setOperator = function (_id, operator) {
  const update = {
    $set: {
      operator
    }
  };
  return this.update(_id, update);
};
/**
 * Gets all online agents
 * @return
 */


RocketChat.models.Users.findOnlineAgents = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find an online agent by his username
 * @return
 */


RocketChat.models.Users.findOneOnlineAgentByUsername = function (username) {
  const query = {
    username,
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.findOne(query);
};
/**
 * Gets all agents
 * @return
 */


RocketChat.models.Users.findAgents = function () {
  const query = {
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find online users from a list
 * @param {array} userList - array of usernames
 * @return
 */


RocketChat.models.Users.findOnlineUserFromList = function (userList) {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent',
    username: {
      $in: [].concat(userList)
    }
  };
  return this.find(query);
};
/**
 * Get next user agent in order
 * @return {object} User from db
 */


RocketChat.models.Users.getNextAgent = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  const collectionObj = this.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
  const sort = {
    livechatCount: 1,
    username: 1
  };
  const update = {
    $inc: {
      livechatCount: 1
    }
  };
  const user = findAndModify(query, sort, update);

  if (user && user.value) {
    return {
      agentId: user.value._id,
      username: user.value.username
    };
  } else {
    return null;
  }
};
/**
 * Change user's livechat status
 * @param {string} token - Visitor token
 */


RocketChat.models.Users.setLivechatStatus = function (userId, status) {
  const query = {
    '_id': userId
  };
  const update = {
    $set: {
      'statusLivechat': status
    }
  };
  return this.update(query, update);
};
/**
 * change all livechat agents livechat status to "not-available"
 */


RocketChat.models.Users.closeOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'not-available');
  });
};
/**
 * change all livechat agents livechat status to "available"
 */


RocketChat.models.Users.openOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'available');
  });
};

RocketChat.models.Users.getAgentInfo = function (agentId) {
  const query = {
    _id: agentId
  };
  const options = {
    fields: {
      name: 1,
      username: 1,
      phone: 1,
      customFields: 1
    }
  };

  if (RocketChat.settings.get('Livechat_show_agent_email')) {
    options.fields.emails = 1;
  }

  return this.findOne(query, options);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Rooms.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function (_id, surveyFeedback) {
  const query = {
    _id
  };
  const update = {
    $set: {
      surveyFeedback
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function (token, key, value, overwrite = true) {
  const query = {
    'v.token': token,
    open: true
  };

  if (!overwrite) {
    const room = this.findOne(query, {
      fields: {
        livechatData: 1
      }
    });

    if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
      return true;
    }
  }

  const update = {
    $set: {
      [`livechatData.${key}`]: value
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.findLivechat = function (filter = {}, offset = 0, limit = 20) {
  const query = _.extend(filter, {
    t: 'l'
  });

  return this.find(query, {
    sort: {
      ts: -1
    },
    offset,
    limit
  });
};

RocketChat.models.Rooms.findLivechatById = function (_id, fields) {
  const options = {};

  if (fields) {
    options.fields = fields;
  }

  const query = {
    t: 'l',
    _id
  };
  return this.findOne(query, options);
};

RocketChat.models.Rooms.findLivechatById = function (_id, fields) {
  const options = {};

  if (fields) {
    options.fields = fields;
  }

  const query = {
    t: 'l',
    _id
  };
  return this.findOne(query, options);
};
/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */


RocketChat.models.Rooms.updateLivechatRoomCount = function () {
  const settingsRaw = RocketChat.models.Settings.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
  const query = {
    _id: 'Livechat_Room_Count'
  };
  const update = {
    $inc: {
      value: 1
    }
  };
  const livechatCount = findAndModify(query, null, update);
  return livechatCount.value.value;
};

RocketChat.models.Rooms.findOpenByVisitorToken = function (visitorToken, options) {
  const query = {
    open: true,
    'v.token': visitorToken
  };
  return this.find(query, options);
};

RocketChat.models.Rooms.findByVisitorToken = function (visitorToken) {
  const query = {
    'v.token': visitorToken
  };
  return this.find(query);
};

RocketChat.models.Rooms.findByVisitorId = function (visitorId) {
  const query = {
    'v._id': visitorId
  };
  return this.find(query);
};

RocketChat.models.Rooms.findOneOpenByVisitorToken = function (token, roomId) {
  const query = {
    _id: roomId,
    open: true,
    'v.token': token
  };
  return this.findOne(query);
};

RocketChat.models.Rooms.setResponseByRoomId = function (roomId, response) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      responseBy: {
        _id: response.user._id,
        username: response.user.username
      },
      responseDate: response.responseDate,
      responseTime: response.responseTime
    },
    $unset: {
      waitingResponse: 1
    }
  });
};

RocketChat.models.Rooms.closeByRoomId = function (roomId, closeInfo) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      closer: closeInfo.closer,
      closedBy: closeInfo.closedBy,
      closedAt: closeInfo.closedAt,
      chatDuration: closeInfo.chatDuration,
      'v.status': 'offline'
    },
    $unset: {
      open: 1
    }
  });
};

RocketChat.models.Rooms.findOpenByAgent = function (userId) {
  const query = {
    open: true,
    'servedBy._id': userId
  };
  return this.find(query);
};

RocketChat.models.Rooms.changeAgentByRoomId = function (roomId, newAgent) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      servedBy: {
        _id: newAgent.agentId,
        username: newAgent.username
      }
    }
  };
  this.update(query, update);
};

RocketChat.models.Rooms.saveCRMDataByRoomId = function (roomId, crmData) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      crmData
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateVisitorStatus = function (token, status) {
  const query = {
    'v.token': token,
    open: true
  };
  const update = {
    $set: {
      'v.status': status
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Messages.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.keepHistoryForToken = function (token) {
  return this.update({
    'navigation.token': token,
    expireAt: {
      $exists: true
    }
  }, {
    $unset: {
      expireAt: 1
    }
  }, {
    multi: true
  });
};

RocketChat.models.Messages.setRoomIdByToken = function (token, rid) {
  return this.update({
    'navigation.token': token,
    rid: null
  }, {
    $set: {
      rid
    }
  }, {
    multi: true
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatExternalMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatExternalMessage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatExternalMessage extends RocketChat.models._Base {
  constructor() {
    super('livechat_external_message');

    if (Meteor.isClient) {
      this._initModel('livechat_external_message');
    }
  } // FIND


  findByRoomId(roomId, sort = {
    ts: -1
  }) {
    const query = {
      rid: roomId
    };
    return this.find(query, {
      sort
    });
  }

}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatCustomField.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Custom Fields model
 */
class LivechatCustomField extends RocketChat.models._Base {
  constructor() {
    super('livechat_custom_field');
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  createOrUpdateCustomField(_id, field, label, scope, visibility, extraData) {
    const record = {
      label,
      scope,
      visibility
    };

    _.extend(record, extraData);

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      record._id = field;
      _id = this.insert(record);
    }

    return record;
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

}

RocketChat.models.LivechatCustomField = new LivechatCustomField();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartment.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartment.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartment extends RocketChat.models._Base {
  constructor() {
    super('livechat_department');
    this.tryEnsureIndex({
      numAgents: 1,
      enabled: 1
    });
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findByDepartmentId(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }

  createOrUpdateDepartment(_id, {
    enabled,
    name,
    description,
    showOnRegistration
  }, agents) {
    agents = [].concat(agents);
    const record = {
      enabled,
      name,
      description,
      numAgents: agents.length,
      showOnRegistration
    };

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      _id = this.insert(record);
    }

    const savedAgents = _.pluck(RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');

    const agentsToSave = _.pluck(agents, 'agentId'); // remove other agents


    _.difference(savedAgents, agentsToSave).forEach(agentId => {
      RocketChat.models.LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
    });

    agents.forEach(agent => {
      RocketChat.models.LivechatDepartmentAgents.saveAgent({
        agentId: agent.agentId,
        departmentId: _id,
        username: agent.username,
        count: agent.count ? parseInt(agent.count) : 0,
        order: agent.order ? parseInt(agent.order) : 0
      });
    });
    return _.extend(record, {
      _id
    });
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

  findEnabledWithAgents() {
    const query = {
      numAgents: {
        $gt: 0
      },
      enabled: true
    };
    return this.find(query);
  }

}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartmentAgents.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartmentAgents.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartmentAgents extends RocketChat.models._Base {
  constructor() {
    super('livechat_department_agents');
  }

  findByDepartmentId(departmentId) {
    return this.find({
      departmentId
    });
  }

  saveAgent(agent) {
    return this.upsert({
      agentId: agent.agentId,
      departmentId: agent.departmentId
    }, {
      $set: {
        username: agent.username,
        count: parseInt(agent.count),
        order: parseInt(agent.order)
      }
    });
  }

  removeByDepartmentIdAndAgentId(departmentId, agentId) {
    this.remove({
      departmentId,
      agentId
    });
  }

  getNextAgentForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return;
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const sort = {
      count: 1,
      order: 1,
      username: 1
    };
    const update = {
      $inc: {
        count: 1
      }
    };
    const collectionObj = this.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
    const agent = findAndModify(query, sort, update);

    if (agent && agent.value) {
      return {
        agentId: agent.value.agentId,
        username: agent.value.username
      };
    } else {
      return null;
    }
  }

  getOnlineForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return [];
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const depAgents = this.find(query);

    if (depAgents) {
      return depAgents;
    } else {
      return [];
    }
  }

  findUsersInQueue(usersList) {
    const query = {};

    if (!_.isEmpty(usersList)) {
      query.username = {
        $in: usersList
      };
    }

    const options = {
      sort: {
        departmentId: 1,
        count: 1,
        order: 1,
        username: 1
      }
    };
    return this.find(query, options);
  }

  replaceUsernameOfAgentByUserId(userId, username) {
    const query = {
      'agentId': userId
    };
    const update = {
      $set: {
        username
      }
    };
    return this.update(query, update, {
      multi: true
    });
  }

}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatPageVisited.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Page Visited model
 */
class LivechatPageVisited extends RocketChat.models._Base {
  constructor() {
    super('livechat_page_visited');
    this.tryEnsureIndex({
      'token': 1
    });
    this.tryEnsureIndex({
      'ts': 1
    }); // keep history for 1 month if the visitor does not register

    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  saveByToken(token, pageInfo) {
    // keep history of unregistered visitors for 1 month
    const keepHistoryMiliseconds = 2592000000;
    return this.insert({
      token,
      page: pageInfo,
      ts: new Date(),
      expireAt: new Date().getTime() + keepHistoryMiliseconds
    });
  }

  findByToken(token) {
    return this.find({
      token
    }, {
      sort: {
        ts: -1
      },
      limit: 20
    });
  }

  keepHistoryForToken(token) {
    return this.update({
      token,
      expireAt: {
        $exists: true
      }
    }, {
      $unset: {
        expireAt: 1
      }
    }, {
      multi: true
    });
  }

}

RocketChat.models.LivechatPageVisited = new LivechatPageVisited();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatTrigger.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Trigger model
 */
class LivechatTrigger extends RocketChat.models._Base {
  constructor() {
    super('livechat_trigger');
  }

  updateById(_id, data) {
    return this.update({
      _id
    }, {
      $set: data
    });
  }

  removeAll() {
    return this.remove({});
  }

  findById(_id) {
    return this.find({
      _id
    });
  }

  removeById(_id) {
    return this.remove({
      _id
    });
  }

  findEnabled() {
    return this.find({
      enabled: true
    });
  }

}

RocketChat.models.LivechatTrigger = new LivechatTrigger();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"indexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/indexes.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Rooms.tryEnsureIndex({
    open: 1
  }, {
    sparse: 1
  });
  RocketChat.models.Users.tryEnsureIndex({
    'visitorEmails.address': 1
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatInquiry.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatInquiry extends RocketChat.models._Base {
  constructor() {
    super('livechat_inquiry');
    this.tryEnsureIndex({
      'rid': 1
    }); // room id corresponding to this inquiry

    this.tryEnsureIndex({
      'name': 1
    }); // name of the inquiry (client name for now)

    this.tryEnsureIndex({
      'message': 1
    }); // message sent by the client

    this.tryEnsureIndex({
      'ts': 1
    }); // timestamp

    this.tryEnsureIndex({
      'agents': 1
    }); // Id's of the agents who can see the inquiry (handle departments)

    this.tryEnsureIndex({
      'status': 1
    }); // 'open', 'taken'
  }

  findOneById(inquiryId) {
    return this.findOne({
      _id: inquiryId
    });
  }
  /*
   * mark the inquiry as taken
   */


  takeInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'taken'
      }
    });
  }
  /*
   * mark the inquiry as closed
   */


  closeByRoomId(roomId, closeInfo) {
    return this.update({
      rid: roomId
    }, {
      $set: {
        status: 'closed',
        closer: closeInfo.closer,
        closedBy: closeInfo.closedBy,
        closedAt: closeInfo.closedAt,
        chatDuration: closeInfo.chatDuration
      }
    });
  }
  /*
   * mark inquiry as open
   */


  openInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'open'
      }
    });
  }
  /*
   * return the status of the inquiry (open or taken)
   */


  getStatus(inquiryId) {
    return this.findOne({
      '_id': inquiryId
    }).status;
  }

  updateVisitorStatus(token, status) {
    const query = {
      'v.token': token,
      status: 'open'
    };
    const update = {
      $set: {
        'v.status': status
      }
    };
    return this.update(query, update);
  }

}

RocketChat.models.LivechatInquiry = new LivechatInquiry();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatOfficeHour.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatOfficeHour.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);

class LivechatOfficeHour extends RocketChat.models._Base {
  constructor() {
    super('livechat_office_hour');
    this.tryEnsureIndex({
      'day': 1
    }); // the day of the week monday - sunday

    this.tryEnsureIndex({
      'start': 1
    }); // the opening hours of the office

    this.tryEnsureIndex({
      'finish': 1
    }); // the closing hours of the office

    this.tryEnsureIndex({
      'open': 1
    }); // whether or not the offices are open on this day
    // if there is nothing in the collection, add defaults

    if (this.find().count() === 0) {
      this.insert({
        'day': 'Monday',
        'start': '08:00',
        'finish': '20:00',
        'code': 1,
        'open': true
      });
      this.insert({
        'day': 'Tuesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 2,
        'open': true
      });
      this.insert({
        'day': 'Wednesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 3,
        'open': true
      });
      this.insert({
        'day': 'Thursday',
        'start': '08:00',
        'finish': '20:00',
        'code': 4,
        'open': true
      });
      this.insert({
        'day': 'Friday',
        'start': '08:00',
        'finish': '20:00',
        'code': 5,
        'open': true
      });
      this.insert({
        'day': 'Saturday',
        'start': '08:00',
        'finish': '20:00',
        'code': 6,
        'open': false
      });
      this.insert({
        'day': 'Sunday',
        'start': '08:00',
        'finish': '20:00',
        'code': 0,
        'open': false
      });
    }
  }
  /*
   * update the given days start and finish times and whether the office is open on that day
   */


  updateHours(day, newStart, newFinish, newOpen) {
    this.update({
      day
    }, {
      $set: {
        start: newStart,
        finish: newFinish,
        open: newOpen
      }
    });
  }
  /*
   * Check if the current server time (utc) is within the office hours of that day
   * returns true or false
   */


  isNowWithinHours() {
    // get current time on server in utc
    // var ct = moment().utc();
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm'); // console.log(finish.isBefore(start));

    if (finish.isBefore(start)) {
      // finish.day(finish.day()+1);
      finish.add(1, 'days');
    }

    const result = currentTime.isBetween(start, finish); // inBetween  check

    return result;
  }

  isOpeningTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    return start.isSame(currentTime, 'minute');
  }

  isClosingTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    }

    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm');
    return finish.isSame(currentTime, 'minute');
  }

}

RocketChat.models.LivechatOfficeHour = new LivechatOfficeHour();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatVisitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatVisitors.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

class LivechatVisitors extends RocketChat.models._Base {
  constructor() {
    super('livechat_visitor');
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  getVisitorByToken(token, options) {
    const query = {
      token
    };
    return this.findOne(query, options);
  }
  /**
   * Find visitors by _id
   * @param {string} token - Visitor token
   */


  findById(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  findVisitorByToken(token) {
    const query = {
      token
    };
    return this.find(query);
  }

  updateLivechatDataByToken(token, key, value, overwrite = true) {
    const query = {
      token
    };

    if (!overwrite) {
      const user = this.findOne(query, {
        fields: {
          livechatData: 1
        }
      });

      if (user.livechatData && typeof user.livechatData[key] !== 'undefined') {
        return true;
      }
    }

    const update = {
      $set: {
        [`livechatData.${key}`]: value
      }
    };
    return this.update(query, update);
  }
  /**
   * Find a visitor by their phone number
   * @return {object} User from db
   */


  findOneVisitorByPhone(phone) {
    const query = {
      'phone.phoneNumber': phone
    };
    return this.findOne(query);
  }
  /**
   * Get the next visitor name
   * @return {string} The next visitor name
   */


  getNextVisitorUsername() {
    const settingsRaw = RocketChat.models.Settings.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
    const query = {
      _id: 'Livechat_guest_count'
    };
    const update = {
      $inc: {
        value: 1
      }
    };
    const livechatCount = findAndModify(query, null, update);
    return `guest-${livechatCount.value.value + 1}`;
  }

  updateById(_id, update) {
    return this.update({
      _id
    }, update);
  }

  saveGuestById(_id, data) {
    const setData = {};
    const unsetData = {};

    if (data.name) {
      if (!_.isEmpty(s.trim(data.name))) {
        setData.name = s.trim(data.name);
      } else {
        unsetData.name = 1;
      }
    }

    if (data.email) {
      if (!_.isEmpty(s.trim(data.email))) {
        setData.visitorEmails = [{
          address: s.trim(data.email)
        }];
      } else {
        unsetData.visitorEmails = 1;
      }
    }

    if (data.phone) {
      if (!_.isEmpty(s.trim(data.phone))) {
        setData.phone = [{
          phoneNumber: s.trim(data.phone)
        }];
      } else {
        unsetData.phone = 1;
      }
    }

    const update = {};

    if (!_.isEmpty(setData)) {
      update.$set = setData;
    }

    if (!_.isEmpty(unsetData)) {
      update.$unset = unsetData;
    }

    if (_.isEmpty(update)) {
      return true;
    }

    return this.update({
      _id
    }, update);
  }

  findOneGuestByEmailAddress(emailAddress) {
    const query = {
      'visitorEmails.address': new RegExp(`^${s.escapeRegExp(emailAddress)}$`, 'i')
    };
    return this.findOne(query);
  }

  saveGuestEmailPhoneById(_id, emails, phones) {
    const update = {
      $addToSet: {}
    };
    const saveEmail = [].concat(emails).filter(email => email && email.trim()).map(email => {
      return {
        address: email
      };
    });

    if (saveEmail.length > 0) {
      update.$addToSet.visitorEmails = {
        $each: saveEmail
      };
    }

    const savePhone = [].concat(phones).filter(phone => phone && phone.trim().replace(/[^\d]/g, '')).map(phone => {
      return {
        phoneNumber: phone
      };
    });

    if (savePhone.length > 0) {
      update.$addToSet.phone = {
        $each: savePhone
      };
    }

    if (!update.$addToSet.visitorEmails && !update.$addToSet.phone) {
      return;
    }

    return this.update({
      _id
    }, update);
  }

}

module.exportDefault(new LivechatVisitors());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"Livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/Livechat.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let UAParser;
module.watch(require("ua-parser-js"), {
  default(v) {
    UAParser = v;
  }

}, 2);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 3);
RocketChat.Livechat = {
  historyMonitorType: 'url',
  logger: new Logger('Livechat', {
    sections: {
      webhook: 'Webhook'
    }
  }),

  getNextAgent(department) {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'External') {
      for (let i = 0; i < 10; i++) {
        try {
          const queryString = department ? `?departmentId=${department}` : '';
          const result = HTTP.call('GET', `${RocketChat.settings.get('Livechat_External_Queue_URL')}${queryString}`, {
            headers: {
              'User-Agent': 'RocketChat Server',
              'Accept': 'application/json',
              'X-RocketChat-Secret-Token': RocketChat.settings.get('Livechat_External_Queue_Token')
            }
          });

          if (result && result.data && result.data.username) {
            const agent = RocketChat.models.Users.findOneOnlineAgentByUsername(result.data.username);

            if (agent) {
              return {
                agentId: agent._id,
                username: agent.username
              };
            }
          }
        } catch (e) {
          console.error('Error requesting agent from external queue.', e);
          break;
        }
      }

      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    } else if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
    }

    return RocketChat.models.Users.getNextAgent();
  },

  getAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(department);
    } else {
      return RocketChat.models.Users.findAgents();
    }
  },

  getOnlineAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(department);
    } else {
      return RocketChat.models.Users.findOnlineAgents();
    }
  },

  getRequiredDepartment(onlineRequired = true) {
    const departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
    return departments.fetch().find(dept => {
      if (!dept.showOnRegistration) {
        return false;
      }

      if (!onlineRequired) {
        return true;
      }

      const onlineAgents = RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
      return onlineAgents.count() > 0;
    });
  },

  getRoom(guest, message, roomInfo, agent) {
    let room = RocketChat.models.Rooms.findOneById(message.rid);
    let newRoom = false;

    if (room && !room.open) {
      message.rid = Random.id();
      room = null;
    }

    if (room == null) {
      // if no department selected verify if there is at least one active and pick the first
      if (!agent && !guest.department) {
        const department = this.getRequiredDepartment();

        if (department) {
          guest.department = department._id;
        }
      } // delegate room creation to QueueMethods


      const routingMethod = RocketChat.settings.get('Livechat_Routing_Method');
      room = RocketChat.QueueMethods[routingMethod](guest, message, roomInfo, agent);
      newRoom = true;
    }

    if (!room || room.v.token !== guest.token) {
      throw new Meteor.Error('cannot-access-room');
    }

    if (newRoom) {
      RocketChat.models.Messages.setRoomIdByToken(guest.token, room._id);
    }

    return {
      room,
      newRoom
    };
  },

  sendMessage({
    guest,
    message,
    roomInfo,
    agent
  }) {
    const {
      room,
      newRoom
    } = this.getRoom(guest, message, roomInfo, agent);

    if (guest.name) {
      message.alias = guest.name;
    } // return messages;


    return _.extend(RocketChat.sendMessage(guest, message, room), {
      newRoom,
      showConnecting: this.showConnecting()
    });
  },

  registerGuest({
    token,
    name,
    email,
    department,
    phone,
    username
  } = {}) {
    check(token, String);
    let userId;
    const updateUser = {
      $set: {
        token
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      userId = user._id;
    } else {
      if (!username) {
        username = LivechatVisitors.getNextVisitorUsername();
      }

      let existingUser = null;

      if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
        userId = existingUser._id;
      } else {
        const userData = {
          username,
          department
        };

        if (this.connection) {
          userData.userAgent = this.connection.httpHeaders['user-agent'];
          userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
          userData.host = this.connection.httpHeaders.host;
        }

        userId = LivechatVisitors.insert(userData);
      }
    }

    if (phone) {
      updateUser.$set.phone = [{
        phoneNumber: phone.number
      }];
    }

    if (email && email.trim() !== '') {
      updateUser.$set.visitorEmails = [{
        address: email
      }];
    }

    if (name) {
      updateUser.$set.name = name;
    }

    LivechatVisitors.updateById(userId, updateUser);
    return userId;
  },

  setDepartmentForGuest({
    token,
    department
  } = {}) {
    check(token, String);
    const updateUser = {
      $set: {
        department
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      return Meteor.users.update(user._id, updateUser);
    }

    return false;
  },

  saveGuest({
    _id,
    name,
    email,
    phone
  }) {
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    if (phone) {
      updateData.phone = phone;
    }

    const ret = LivechatVisitors.saveGuestById(_id, updateData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveGuest', updateData);
    });
    return ret;
  },

  closeRoom({
    user,
    visitor,
    room,
    comment
  }) {
    const now = new Date();
    const closeData = {
      closedAt: now,
      chatDuration: (now.getTime() - room.ts) / 1000
    };

    if (user) {
      closeData.closer = 'user';
      closeData.closedBy = {
        _id: user._id,
        username: user.username
      };
    } else if (visitor) {
      closeData.closer = 'visitor';
      closeData.closedBy = {
        _id: visitor._id,
        username: visitor.username
      };
    }

    RocketChat.models.Rooms.closeByRoomId(room._id, closeData);
    RocketChat.models.LivechatInquiry.closeByRoomId(room._id, closeData);
    const message = {
      t: 'livechat-close',
      msg: comment,
      groupable: false
    };
    RocketChat.sendMessage(user, message, room);

    if (room.servedBy) {
      RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, room.servedBy._id);
    }

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('promptTranscript', room._id, closeData.closedBy);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.closeRoom', room);
    });
    return true;
  },

  getInitSettings() {
    const settings = {};
    RocketChat.models.Settings.findNotHiddenPublic(['Livechat_title', 'Livechat_title_color', 'Livechat_enabled', 'Livechat_registration_form', 'Livechat_allow_switching_departments', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_form_unavailable', 'Livechat_display_offline_form', 'Livechat_videocall_enabled', 'Jitsi_Enabled', 'Language', 'Livechat_enable_transcript', 'Livechat_transcript_message', 'Livechat_fileupload_enabled', 'FileUpload_Enabled', 'Livechat_conversation_finished_message', 'Livechat_name_field_registration_form', 'Livechat_email_field_registration_form']).forEach(setting => {
      settings[setting._id] = setting.value;
    });
    return settings;
  },

  saveRoomInfo(roomData, guestData) {
    if ((roomData.topic != null || roomData.tags != null) && !RocketChat.models.Rooms.setTopicAndTagsById(roomData._id, roomData.topic, roomData.tags)) {
      return false;
    }

    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveRoom', roomData);
    });

    if (!_.isEmpty(guestData.name)) {
      return RocketChat.models.Rooms.setFnameById(roomData._id, guestData.name) && RocketChat.models.Subscriptions.updateDisplayNameByRoomId(roomData._id, guestData.name);
    }
  },

  closeOpenChats(userId, comment) {
    const user = RocketChat.models.Users.findOneById(userId);
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      this.closeRoom({
        user,
        room,
        comment
      });
    });
  },

  forwardOpenChats(userId) {
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      const guest = LivechatVisitors.findOneById(room.v._id);
      this.transfer(room, guest, {
        departmentId: guest.department
      });
    });
  },

  savePageHistory(token, roomId, pageInfo) {
    if (pageInfo.change === RocketChat.Livechat.historyMonitorType) {
      const user = RocketChat.models.Users.findOneById('rocket.cat');
      const pageTitle = pageInfo.title;
      const pageUrl = pageInfo.location.href;
      const extraData = {
        navigation: {
          page: pageInfo,
          token
        }
      };

      if (!roomId) {
        // keep history of unregistered visitors for 1 month
        const keepHistoryMiliseconds = 2592000000;
        extraData.expireAt = new Date().getTime() + keepHistoryMiliseconds;
      }

      if (!RocketChat.settings.get('Livechat_Visitor_navigation_as_a_message')) {
        extraData._hidden = true;
      }

      return RocketChat.models.Messages.createNavigationHistoryWithRoomIdMessageAndUser(roomId, `${pageTitle} - ${pageUrl}`, user, extraData);
    }

    return;
  },

  transfer(room, guest, transferData) {
    let agent;

    if (transferData.userId) {
      const user = RocketChat.models.Users.findOneById(transferData.userId);
      agent = {
        agentId: user._id,
        username: user.username
      };
    } else {
      agent = RocketChat.Livechat.getNextAgent(transferData.departmentId);
    }

    const servedBy = room.servedBy;

    if (agent && agent.agentId !== servedBy._id) {
      RocketChat.models.Rooms.changeAgentByRoomId(room._id, agent);
      const subscriptionData = {
        rid: room._id,
        name: guest.name || guest.username,
        alert: true,
        open: true,
        unread: 1,
        userMentions: 1,
        groupMentions: 0,
        u: {
          _id: agent.agentId,
          username: agent.username
        },
        t: 'l',
        desktopNotifications: 'all',
        mobilePushNotifications: 'all',
        emailNotifications: 'all'
      };
      RocketChat.models.Subscriptions.removeByRoomIdAndUserId(room._id, servedBy._id);
      RocketChat.models.Subscriptions.insert(subscriptionData);
      RocketChat.models.Rooms.incUsersCountById(room._id);
      RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, {
        _id: servedBy._id,
        username: servedBy.username
      });
      RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, {
        _id: agent.agentId,
        username: agent.username
      });
      RocketChat.Livechat.stream.emit(room._id, {
        type: 'agentData',
        data: RocketChat.models.Users.getAgentInfo(agent.agentId)
      });
      return true;
    }

    return false;
  },

  sendRequest(postData, callback, trying = 1) {
    try {
      const options = {
        headers: {
          'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
        },
        data: postData
      };
      return HTTP.post(RocketChat.settings.get('Livechat_webhookUrl'), options);
    } catch (e) {
      RocketChat.Livechat.logger.webhook.error(`Response error on ${trying} try ->`, e); // try 10 times after 10 seconds each

      if (trying < 10) {
        RocketChat.Livechat.logger.webhook.warn('Will try again in 10 seconds ...');
        trying++;
        setTimeout(Meteor.bindEnvironment(() => {
          RocketChat.Livechat.sendRequest(postData, callback, trying);
        }), 10000);
      }
    }
  },

  getLivechatRoomGuestInfo(room) {
    const visitor = LivechatVisitors.findOneById(room.v._id);
    const agent = RocketChat.models.Users.findOneById(room.servedBy && room.servedBy._id);
    const ua = new UAParser();
    ua.setUA(visitor.userAgent);
    const postData = {
      _id: room._id,
      label: room.fname || room.label,
      // using same field for compatibility
      topic: room.topic,
      createdAt: room.ts,
      lastMessageAt: room.lm,
      tags: room.tags,
      customFields: room.livechatData,
      visitor: {
        _id: visitor._id,
        token: visitor.token,
        name: visitor.name,
        username: visitor.username,
        email: null,
        phone: null,
        department: visitor.department,
        ip: visitor.ip,
        os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
        browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
        customFields: visitor.livechatData
      }
    };

    if (agent) {
      postData.agent = {
        _id: agent._id,
        username: agent.username,
        name: agent.name,
        email: null
      };

      if (agent.emails && agent.emails.length > 0) {
        postData.agent.email = agent.emails[0].address;
      }
    }

    if (room.crmData) {
      postData.crmData = room.crmData;
    }

    if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
      postData.visitor.email = visitor.visitorEmails;
    }

    if (visitor.phone && visitor.phone.length > 0) {
      postData.visitor.phone = visitor.phone;
    }

    return postData;
  },

  addAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addAgent'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, true);
      RocketChat.models.Users.setLivechatStatus(user._id, 'available');
      return user;
    }

    return false;
  },

  addManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addManager'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-manager')) {
      return user;
    }

    return false;
  },

  removeAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeAgent'
      });
    }

    if (RocketChat.authz.removeUserFromRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, false);
      RocketChat.models.Users.setLivechatStatus(user._id, 'not-available');
      return true;
    }

    return false;
  },

  removeManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.authz.removeUserFromRoles(user._id, 'livechat-manager');
  },

  saveDepartment(_id, departmentData, departmentAgents) {
    check(_id, Match.Maybe(String));
    check(departmentData, {
      enabled: Boolean,
      name: String,
      description: Match.Optional(String),
      showOnRegistration: Boolean
    });
    check(departmentAgents, [Match.ObjectIncluding({
      agentId: String,
      username: String
    })]);

    if (_id) {
      const department = RocketChat.models.LivechatDepartment.findOneById(_id);

      if (!department) {
        throw new Meteor.Error('error-department-not-found', 'Department not found', {
          method: 'livechat:saveDepartment'
        });
      }
    }

    return RocketChat.models.LivechatDepartment.createOrUpdateDepartment(_id, departmentData, departmentAgents);
  },

  removeDepartment(_id) {
    check(_id, String);
    const department = RocketChat.models.LivechatDepartment.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!department) {
      throw new Meteor.Error('department-not-found', 'Department not found', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.models.LivechatDepartment.removeById(_id);
  },

  showConnecting() {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool') {
      return RocketChat.settings.get('Livechat_open_inquiery_show_connecting');
    } else {
      return false;
    }
  }

};
RocketChat.Livechat.stream = new Meteor.Streamer('livechat-room');
RocketChat.Livechat.stream.allowRead((roomId, extraData) => {
  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (!room) {
    console.warn(`Invalid eventName: "${roomId}"`);
    return false;
  }

  if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
    return true;
  }

  return false;
});
RocketChat.settings.get('Livechat_history_monitor_type', (key, value) => {
  RocketChat.Livechat.historyMonitorType = value;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QueueMethods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/QueueMethods.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.QueueMethods = {
  /* Least Amount Queuing method:
   *
   * default method where the agent with the least number
   * of open chats is paired with the incoming livechat
   */
  'Least_Amount'(guest, message, roomInfo, agent) {
    if (!agent) {
      agent = RocketChat.Livechat.getNextAgent(guest.department);

      if (!agent) {
        throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
      }
    }

    RocketChat.models.Rooms.updateLivechatRoomCount();

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      usersCount: 1,
      lm: new Date(),
      fname: roomInfo && roomInfo.fname || guest.name || guest.username,
      // usernames: [agent.username, guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      servedBy: {
        _id: agent.agentId,
        username: agent.username
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    const subscriptionData = {
      rid: message.rid,
      fname: guest.name || guest.username,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Rooms.insert(room);
    RocketChat.models.Subscriptions.insert(subscriptionData);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    });
    return room;
  },

  /* Guest Pool Queuing Method:
   *
   * An incomming livechat is created as an Inquiry
   * which is picked up from an agent.
   * An Inquiry is visible to all agents (TODO: in the correct department)
      *
   * A room is still created with the initial message, but it is occupied by
   * only the client until paired with an agent
   */
  'Guest_Pool'(guest, message, roomInfo) {
    let agents = RocketChat.Livechat.getOnlineAgents(guest.department);

    if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
      agents = RocketChat.Livechat.getAgents(guest.department);
    }

    if (agents.count() === 0) {
      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    }

    RocketChat.models.Rooms.updateLivechatRoomCount();
    const agentIds = [];
    agents.forEach(agent => {
      if (guest.department) {
        agentIds.push(agent.agentId);
      } else {
        agentIds.push(agent._id);
      }
    });
    const inquiry = {
      rid: message.rid,
      message: message.msg,
      name: guest.name || guest.username,
      ts: new Date(),
      department: guest.department,
      agents: agentIds,
      status: 'open',
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      t: 'l'
    };

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      usersCount: 0,
      lm: new Date(),
      fname: guest.name || guest.username,
      // usernames: [guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    RocketChat.models.LivechatInquiry.insert(inquiry);
    RocketChat.models.Rooms.insert(room);
    return room;
  },

  'External'(guest, message, roomInfo, agent) {
    return this['Least_Amount'](guest, message, roomInfo, agent); // eslint-disable-line
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OfficeClock.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OfficeClock.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Every minute check if office closed
Meteor.setInterval(function () {
  if (RocketChat.settings.get('Livechat_enable_office_hours')) {
    if (RocketChat.models.LivechatOfficeHour.isOpeningTime()) {
      RocketChat.models.Users.openOffice();
    } else if (RocketChat.models.LivechatOfficeHour.isClosingTime()) {
      RocketChat.models.Users.closeOffice();
    }
  }
}, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OmniChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OmniChannel.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const gatewayURL = 'https://omni.rocket.chat';
module.exportDefault({
  enable() {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      },
      data: {
        url: RocketChat.settings.get('Site_Url')
      }
    });
    return result.data;
  },

  disable() {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      }
    });
    return result.data;
  },

  listPages() {
    const result = HTTP.call('GET', `${gatewayURL}/facebook/pages`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  subscribe(pageId) {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  unsubscribe(pageId) {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  reply({
    page,
    token,
    text
  }) {
    return HTTP.call('POST', `${gatewayURL}/facebook/reply`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      },
      data: {
        page,
        token,
        text
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"sendMessageBySMS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/sendMessageBySMS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("./models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.SMS.enabled) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.sms && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  const SMSService = RocketChat.SMS.getService(RocketChat.settings.get('SMS_Service'));

  if (!SMSService) {
    return message;
  }

  const visitor = LivechatVisitors.getVisitorByToken(room.v.token);

  if (!visitor || !visitor.phone || visitor.phone.length === 0) {
    return message;
  }

  SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg);
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageBySms');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unclosedLivechats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/unclosedLivechats.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceMonitor */
let agentsHandler;
let monitorAgents = false;
let actionTimeout = 60000;
const onlineAgents = {
  users: {},
  queue: {},

  add(userId) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
      delete this.queue[userId];
    }

    this.users[userId] = 1;
  },

  remove(userId, callback) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
    }

    this.queue[userId] = setTimeout(Meteor.bindEnvironment(() => {
      callback();
      delete this.users[userId];
      delete this.queue[userId];
    }), actionTimeout);
  },

  exists(userId) {
    return !!this.users[userId];
  }

};

function runAgentLeaveAction(userId) {
  const action = RocketChat.settings.get('Livechat_agent_leave_action');

  if (action === 'close') {
    return RocketChat.Livechat.closeOpenChats(userId, RocketChat.settings.get('Livechat_agent_leave_comment'));
  } else if (action === 'forward') {
    return RocketChat.Livechat.forwardOpenChats(userId);
  }
}

RocketChat.settings.get('Livechat_agent_leave_action_timeout', function (key, value) {
  actionTimeout = value * 1000;
});
RocketChat.settings.get('Livechat_agent_leave_action', function (key, value) {
  monitorAgents = value;

  if (value !== 'none') {
    if (!agentsHandler) {
      agentsHandler = RocketChat.models.Users.findOnlineAgents().observeChanges({
        added(id) {
          onlineAgents.add(id);
        },

        changed(id, fields) {
          if (fields.statusLivechat && fields.statusLivechat === 'not-available') {
            onlineAgents.remove(id, () => {
              runAgentLeaveAction(id);
            });
          } else {
            onlineAgents.add(id);
          }
        },

        removed(id) {
          onlineAgents.remove(id, () => {
            runAgentLeaveAction(id);
          });
        }

      });
    }
  } else if (agentsHandler) {
    agentsHandler.stop();
    agentsHandler = null;
  }
});
UserPresenceMonitor.onSetUserStatus((user, status
/*, statusConnection*/
) => {
  if (!monitorAgents) {
    return;
  }

  if (onlineAgents.exists(user._id)) {
    if (status === 'offline' || user.statusLivechat === 'not-available') {
      onlineAgents.remove(user._id, () => {
        runAgentLeaveAction(user._id);
      });
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"customFields.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/customFields.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('livechat:customFields', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (s.trim(_id)) {
    return RocketChat.models.LivechatCustomField.find({
      _id
    });
  }

  return RocketChat.models.LivechatCustomField.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"departmentAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/departmentAgents.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departmentAgents', function (departmentId) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  return RocketChat.models.LivechatDepartmentAgents.find({
    departmentId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"externalMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/externalMessages.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:externalMessages', function (roomId) {
  return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAgents.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:agents', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-agent').observeChanges({
    added(id, fields) {
      self.added('agentUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('agentUsers', id, fields);
    },

    removed(id) {
      self.removed('agentUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAppearance.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:appearance', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  const query = {
    _id: {
      $in: ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email', 'Livechat_conversation_finished_message', 'Livechat_registration_form', 'Livechat_name_field_registration_form', 'Livechat_email_field_registration_form']
    }
  };
  const self = this;
  const handle = RocketChat.models.Settings.find(query).observeChanges({
    added(id, fields) {
      self.added('livechatAppearance', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatAppearance', id, fields);
    },

    removed(id) {
      self.removed('livechatAppearance', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatDepartments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatDepartments.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departments', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatDepartment.findByDepartmentId(_id);
  } else {
    return RocketChat.models.LivechatDepartment.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatIntegration.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatIntegration.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:integration', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  const self = this;
  const handle = RocketChat.models.Settings.findByIds(['Livechat_webhookUrl', 'Livechat_secret_token', 'Livechat_webhook_on_close', 'Livechat_webhook_on_offline_msg', 'Livechat_webhook_on_visitor_message', 'Livechat_webhook_on_agent_message']).observeChanges({
    added(id, fields) {
      self.added('livechatIntegration', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatIntegration', id, fields);
    },

    removed(id) {
      self.removed('livechatIntegration', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatManagers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatManagers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:managers', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-manager').observeChanges({
    added(id, fields) {
      self.added('managerUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('managerUsers', id, fields);
    },

    removed(id) {
      self.removed('managerUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatRooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatRooms.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:rooms', function (filter = {}, offset = 0, limit = 20) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  check(filter, {
    name: Match.Maybe(String),
    // room name to filter
    agent: Match.Maybe(String),
    // agent _id who is serving
    status: Match.Maybe(String),
    // either 'opened' or 'closed'
    from: Match.Maybe(Date),
    to: Match.Maybe(Date)
  });
  const query = {};

  if (filter.name) {
    query.label = new RegExp(filter.name, 'i');
  }

  if (filter.agent) {
    query['servedBy._id'] = filter.agent;
  }

  if (filter.status) {
    if (filter.status === 'opened') {
      query.open = true;
    } else {
      query.open = {
        $exists: false
      };
    }
  }

  if (filter.from) {
    query.ts = {
      $gte: filter.from
    };
  }

  if (filter.to) {
    filter.to.setDate(filter.to.getDate() + 1);
    filter.to.setSeconds(filter.to.getSeconds() - 1);

    if (!query.ts) {
      query.ts = {};
    }

    query.ts.$lte = filter.to;
  }

  const self = this;
  const handle = RocketChat.models.Rooms.findLivechat(query, offset, limit).observeChanges({
    added(id, fields) {
      self.added('livechatRoom', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatRoom', id, fields);
    },

    removed(id) {
      self.removed('livechatRoom', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatQueue.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatQueue.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:queue', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  } // let sort = { count: 1, sort: 1, username: 1 };
  // let onlineUsers = {};
  // let handleUsers = RocketChat.models.Users.findOnlineAgents().observeChanges({
  // 	added(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.added('livechatQueueUser', id, fields);
  // 	},
  // 	changed(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.changed('livechatQueueUser', id, fields);
  // 	},
  // 	removed(id) {
  // 		this.removed('livechatQueueUser', id);
  // 	}
  // });


  const self = this;
  const handleDepts = RocketChat.models.LivechatDepartmentAgents.findUsersInQueue().observeChanges({
    added(id, fields) {
      self.added('livechatQueueUser', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatQueueUser', id, fields);
    },

    removed(id) {
      self.removed('livechatQueueUser', id);
    }

  });
  this.ready();
  this.onStop(() => {
    // handleUsers.stop();
    handleDepts.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatTriggers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatTriggers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:triggers', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatTrigger.findById(_id);
  } else {
    return RocketChat.models.LivechatTrigger.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorHistory.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorHistory', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);
  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, this.userId, {
    fields: {
      _id: 1
    }
  });

  if (!subscription) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  const self = this;

  if (room && room.v && room.v._id) {
    const handle = RocketChat.models.Rooms.findByVisitorId(room.v._id).observeChanges({
      added(id, fields) {
        self.added('visitor_history', id, fields);
      },

      changed(id, fields) {
        self.changed('visitor_history', id, fields);
      },

      removed(id) {
        self.removed('visitor_history', id);
      }

    });
    self.ready();
    self.onStop(function () {
      handle.stop();
    });
  } else {
    self.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorInfo.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorInfo.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.publish('livechat:visitorInfo', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room && room.v && room.v._id) {
    return LivechatVisitors.findById(room.v._id);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorPageVisited.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorPageVisited', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  const self = this;
  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room) {
    const handle = RocketChat.models.Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history').observeChanges({
      added(id, fields) {
        self.added('visitor_navigation_history', id, fields);
      },

      changed(id, fields) {
        self.changed('visitor_navigation_history', id, fields);
      },

      removed(id) {
        self.removed('visitor_navigation_history', id);
      }

    });
    self.ready();
    self.onStop(function () {
      handle.stop();
    });
  } else {
    self.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatInquiries.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatInquiries.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:inquiry', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  const query = {
    agents: this.userId,
    status: 'open'
  };
  return RocketChat.models.LivechatInquiry.find(query);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatOfficeHours.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:officeHour', function () {
  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  return RocketChat.models.LivechatOfficeHour.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/api.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../imports/server/rest/departments.js"));
module.watch(require("../imports/server/rest/facebook.js"));
module.watch(require("../imports/server/rest/sms.js"));
module.watch(require("../imports/server/rest/users.js"));
module.watch(require("../imports/server/rest/messages.js"));
module.watch(require("../imports/server/rest/visitors.js"));
module.watch(require("../imports/server/rest/upload.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"permissions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/permissions.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(() => {
  const roles = _.pluck(RocketChat.models.Roles.find().fetch(), 'name');

  if (roles.indexOf('livechat-agent') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-agent');
  }

  if (roles.indexOf('livechat-manager') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-manager');
  }

  if (roles.indexOf('livechat-guest') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-guest');
  }

  if (RocketChat.models && RocketChat.models.Permissions) {
    RocketChat.models.Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messageTypes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/messageTypes.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.MessageTypes.registerType({
  id: 'livechat_navigation_history',
  system: true,
  message: 'New_visitor_navigation',

  data(message) {
    if (!message.navigation || !message.navigation.page) {
      return;
    }

    return {
      history: `${(message.navigation.page.title ? `${message.navigation.page.title} - ` : '') + message.navigation.page.location.href}`
    };
  }

});
RocketChat.MessageTypes.registerType({
  id: 'livechat_video_call',
  system: true,
  message: 'New_videocall_request'
});
RocketChat.actionLinks.register('createLivechatCall', function (message, params, instance) {
  if (Meteor.isClient) {
    instance.tabBar.open('video');
  }
});
RocketChat.actionLinks.register('denyLivechatCall', function (message
/*, params*/
) {
  if (Meteor.isServer) {
    const user = Meteor.user();
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
    RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', {
      _id: message._id
    });
    const language = user.language || RocketChat.settings.get('language') || 'en';
    RocketChat.Livechat.closeRoom({
      user,
      room: RocketChat.models.Rooms.findOneById(message.rid),
      comment: TAPi18n.__('Videocall_declined', {
        lng: language
      })
    });
    Meteor.defer(() => {
      RocketChat.models.Messages.setHiddenById(message._id);
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/config.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.settings.addGroup('Livechat');
  RocketChat.settings.add('Livechat_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title', 'Rocket.Chat', {
    type: 'string',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title_color', '#C1272D', {
    type: 'color',
    editor: 'color',
    allowedTypes: ['color', 'expression'],
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_display_offline_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Display_offline_form'
  });
  RocketChat.settings.add('Livechat_validate_offline_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Validate_email_address'
  });
  RocketChat.settings.add('Livechat_offline_form_unavailable', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_form_unavailable_message'
  });
  RocketChat.settings.add('Livechat_offline_title', 'Leave a message', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Title'
  });
  RocketChat.settings.add('Livechat_offline_title_color', '#666666', {
    type: 'color',
    editor: 'color',
    allowedTypes: ['color', 'expression'],
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Color'
  });
  RocketChat.settings.add('Livechat_offline_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Instructions',
    i18nDescription: 'Instructions_to_your_visitor_fill_the_form_to_send_a_message'
  });
  RocketChat.settings.add('Livechat_offline_email', '', {
    type: 'string',
    group: 'Livechat',
    i18nLabel: 'Email_address_to_send_offline_messages',
    section: 'Offline'
  });
  RocketChat.settings.add('Livechat_offline_success_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_success_message'
  });
  RocketChat.settings.add('Livechat_allow_switching_departments', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Allow_switching_departments'
  });
  RocketChat.settings.add('Livechat_show_agent_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_agent_email'
  });
  RocketChat.settings.add('Livechat_conversation_finished_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Conversation_finished_message'
  });
  RocketChat.settings.add('Livechat_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_preregistration_form'
  });
  RocketChat.settings.add('Livechat_name_field_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_name_field'
  });
  RocketChat.settings.add('Livechat_email_field_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_email_field'
  });
  RocketChat.settings.add('Livechat_guest_count', 1, {
    type: 'int',
    group: 'Livechat'
  });
  RocketChat.settings.add('Livechat_Room_Count', 1, {
    type: 'int',
    group: 'Livechat',
    i18nLabel: 'Livechat_room_count'
  });
  RocketChat.settings.add('Livechat_agent_leave_action', 'none', {
    type: 'select',
    group: 'Livechat',
    values: [{
      key: 'none',
      i18nLabel: 'None'
    }, {
      key: 'forward',
      i18nLabel: 'Forward'
    }, {
      key: 'close',
      i18nLabel: 'Close'
    }],
    i18nLabel: 'How_to_handle_open_sessions_when_agent_goes_offline'
  });
  RocketChat.settings.add('Livechat_agent_leave_action_timeout', 60, {
    type: 'int',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: {
        $ne: 'none'
      }
    },
    i18nLabel: 'How_long_to_wait_after_agent_goes_offline',
    i18nDescription: 'Time_in_seconds'
  });
  RocketChat.settings.add('Livechat_agent_leave_comment', '', {
    type: 'string',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: 'close'
    },
    i18nLabel: 'Comment_to_leave_on_closing_session'
  });
  RocketChat.settings.add('Livechat_webhookUrl', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Webhook_URL'
  });
  RocketChat.settings.add('Livechat_secret_token', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Secret_token'
  });
  RocketChat.settings.add('Livechat_webhook_on_close', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_chat_close'
  });
  RocketChat.settings.add('Livechat_webhook_on_offline_msg', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_offline_messages'
  });
  RocketChat.settings.add('Livechat_webhook_on_visitor_message', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_visitor_message'
  });
  RocketChat.settings.add('Livechat_webhook_on_agent_message', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_agent_message'
  });
  RocketChat.settings.add('Send_visitor_navigation_history_livechat_webhook_request', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_visitor_navigation_history_on_request',
    i18nDescription: 'Feature_Depends_on_Livechat_Visitor_navigation_as_a_message_to_be_enabled',
    enableQuery: {
      _id: 'Livechat_Visitor_navigation_as_a_message',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_webhook_on_capture', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_lead_capture'
  });
  RocketChat.settings.add('Livechat_lead_email_regex', '\\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\\.)+[A-Z]{2,4}\\b', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_email_regex'
  });
  RocketChat.settings.add('Livechat_lead_phone_regex', '((?:\\([0-9]{1,3}\\)|[0-9]{2})[ \\-]*?[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$)|[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$))', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_phone_regex'
  });
  RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Enabled'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Key'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Language', 'en', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Language'
  });
  RocketChat.settings.add('Livechat_history_monitor_type', 'url', {
    type: 'select',
    group: 'Livechat',
    i18nLabel: 'Monitor_history_for_changes_on',
    values: [{
      key: 'url',
      i18nLabel: 'Page_URL'
    }, {
      key: 'title',
      i18nLabel: 'Page_title'
    }]
  });
  RocketChat.settings.add('Livechat_Visitor_navigation_as_a_message', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Send_Visitor_navigation_history_as_a_message'
  });
  RocketChat.settings.add('Livechat_enable_office_hours', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Office_hours_enabled'
  });
  RocketChat.settings.add('Livechat_continuous_sound_notification_new_livechat_room', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Continuous_sound_notifications_for_new_livechat_room'
  });
  RocketChat.settings.add('Livechat_videocall_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Videocall_enabled',
    i18nDescription: 'Beta_feature_Depends_on_Video_Conference_to_be_enabled',
    enableQuery: {
      _id: 'Jitsi_Enabled',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_fileupload_enabled', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'FileUpload_Enabled',
    enableQuery: {
      _id: 'FileUpload_Enabled',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_enable_transcript', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_Enabled'
  });
  RocketChat.settings.add('Livechat_transcript_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_message',
    enableQuery: {
      _id: 'Livechat_enable_transcript',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_open_inquiery_show_connecting', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_open_inquiery_show_connecting',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_AllowedDomainsList', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_AllowedDomainsList',
    i18nDescription: 'Domains_allowed_to_embed_the_livechat_widget'
  });
  RocketChat.settings.add('Livechat_Facebook_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Facebook'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Secret', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_RDStation_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'RD Station',
    i18nLabel: 'RDStation_Token'
  });
  RocketChat.settings.add('Livechat_Routing_Method', 'Least_Amount', {
    type: 'select',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    values: [{
      key: 'External',
      i18nLabel: 'External_Service'
    }, {
      key: 'Least_Amount',
      i18nLabel: 'Least_Amount'
    }, {
      key: 'Guest_Pool',
      i18nLabel: 'Guest_Pool'
    }]
  });
  RocketChat.settings.add('Livechat_guest_pool_with_no_agents', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Routing',
    i18nLabel: 'Accept_with_no_online_agents',
    i18nDescription: 'Accept_incoming_livechat_requests_even_if_there_are_no_online_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_show_queue_list_link', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    i18nLabel: 'Show_queue_list_to_all_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: {
        $ne: 'External'
      }
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_URL', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'External_Queue_Service_URL',
    i18nDescription: 'For_more_details_please_check_our_docs',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'Secret_token',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"imports":{"LivechatRoomType.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/LivechatRoomType.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => LivechatRoomType
});
let RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext;
module.watch(require("meteor/rocketchat:lib"), {
  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  },

  UiTextContext(v) {
    UiTextContext = v;
  }

}, 0);

class LivechatRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'live',
      path: '/live/:id'
    });
  }

  action(params) {
    openRoom('l', params.id);
  }

  link(sub) {
    return {
      id: sub.rid
    };
  }

}

class LivechatRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'l',
      order: 5,
      icon: 'livechat',
      label: 'Livechat',
      route: new LivechatRoomRoute()
    });
    this.notSubscribedTpl = {
      template: 'livechatNotSubscribed'
    };
  }

  findRoom(identifier) {
    return ChatRoom.findOne({
      _id: identifier
    });
  }

  roomName(roomData) {
    return roomData.name || roomData.fname || roomData.label;
  }

  condition() {
    return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
  }

  canSendMessage(roomId) {
    const room = ChatRoom.findOne({
      _id: roomId
    }, {
      fields: {
        open: 1
      }
    });
    return room && room.open === true;
  }

  getUserStatus(roomId) {
    const room = Session.get(`roomData${roomId}`);

    if (room) {
      return room.v && room.v.status;
    }

    const inquiry = LivechatInquiry.findOne({
      rid: roomId
    });
    return inquiry && inquiry.v && inquiry.v.status;
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.JOIN_CODE:
        return false;

      default:
        return true;
    }
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Livechat_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Hide_Livechat_Warning';

      default:
        return '';
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"rest":{"departments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/departments.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('livechat/department', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success({
      departments: RocketChat.models.LivechatDepartment.find().fetch()
    });
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });
      const department = RocketChat.Livechat.saveDepartment(null, this.bodyParams.department, this.bodyParams.agents);

      if (department) {
        return RocketChat.API.v1.success({
          department,
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: department._id
          }).fetch()
        });
      }

      RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/department/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      return RocketChat.API.v1.success({
        department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
        agents: RocketChat.models.LivechatDepartmentAgents.find({
          departmentId: this.urlParams._id
        }).fetch()
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  put() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });

      if (RocketChat.Livechat.saveDepartment(this.urlParams._id, this.bodyParams.department, this.bodyParams.agents)) {
        return RocketChat.API.v1.success({
          department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: this.urlParams._id
          }).fetch()
        });
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });

      if (RocketChat.Livechat.removeDepartment(this.urlParams._id)) {
        return RocketChat.API.v1.success();
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/facebook.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);

/**
 * @api {post} /livechat/facebook Send Facebook message
 * @apiName Facebook
 * @apiGroup Livechat
 *
 * @apiParam {String} mid Facebook message id
 * @apiParam {String} page Facebook pages id
 * @apiParam {String} token Facebook user's token
 * @apiParam {String} first_name Facebook user's first name
 * @apiParam {String} last_name Facebook user's last name
 * @apiParam {String} [text] Facebook message text
 * @apiParam {String} [attachments] Facebook message attachments
 */
RocketChat.API.v1.addRoute('livechat/facebook', {
  post() {
    if (!this.bodyParams.text && !this.bodyParams.attachments) {
      return {
        success: false
      };
    }

    if (!this.request.headers['x-hub-signature']) {
      return {
        success: false
      };
    }

    if (!RocketChat.settings.get('Livechat_Facebook_Enabled')) {
      return {
        success: false,
        error: 'Integration disabled'
      };
    } // validate if request come from omni


    const signature = crypto.createHmac('sha1', RocketChat.settings.get('Livechat_Facebook_API_Secret')).update(JSON.stringify(this.request.body)).digest('hex');

    if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
      return {
        success: false,
        error: 'Invalid signature'
      };
    }

    const sendMessage = {
      message: {
        _id: this.bodyParams.mid
      },
      roomInfo: {
        facebook: {
          page: this.bodyParams.page
        }
      }
    };
    let visitor = LivechatVisitors.getVisitorByToken(this.bodyParams.token);

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = this.bodyParams.token;
      const userId = RocketChat.Livechat.registerGuest({
        token: sendMessage.message.token,
        name: `${this.bodyParams.first_name} ${this.bodyParams.last_name}`
      });
      visitor = RocketChat.models.Users.findOneById(userId);
    }

    sendMessage.message.msg = this.bodyParams.text;
    sendMessage.guest = visitor;

    try {
      return {
        sucess: true,
        message: RocketChat.Livechat.sendMessage(sendMessage)
      };
    } catch (e) {
      console.error('Error using Facebook ->', e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/messages.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/messages', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.visitor) {
      return RocketChat.API.v1.failure('Body param "visitor" is required');
    }

    if (!this.bodyParams.visitor.token) {
      return RocketChat.API.v1.failure('Body param "visitor.token" is required');
    }

    if (!this.bodyParams.messages) {
      return RocketChat.API.v1.failure('Body param "messages" is required');
    }

    if (!(this.bodyParams.messages instanceof Array)) {
      return RocketChat.API.v1.failure('Body param "messages" is not an array');
    }

    if (this.bodyParams.messages.length === 0) {
      return RocketChat.API.v1.failure('Body param "messages" is empty');
    }

    const visitorToken = this.bodyParams.visitor.token;
    let visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    let rid;

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken).fetch();

      if (rooms && rooms.length > 0) {
        rid = rooms[0]._id;
      } else {
        rid = Random.id();
      }
    } else {
      rid = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest(this.bodyParams.visitor);
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    const sentMessages = this.bodyParams.messages.map(message => {
      const sendMessage = {
        guest: visitor,
        message: {
          _id: Random.id(),
          rid,
          token: visitorToken,
          msg: message.msg
        }
      };
      const sentMessage = RocketChat.Livechat.sendMessage(sendMessage);
      return {
        username: sentMessage.u.username,
        msg: sentMessage.msg,
        ts: sentMessage.ts
      };
    });
    return RocketChat.API.v1.success({
      messages: sentMessages
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/sms.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/sms-incoming/:service', {
  post() {
    const SMSService = RocketChat.SMS.getService(this.urlParams.service);
    const sms = SMSService.parse(this.bodyParams);
    let visitor = LivechatVisitors.findOneVisitorByPhone(sms.from);
    const sendMessage = {
      message: {
        _id: Random.id()
      },
      roomInfo: {
        sms: {
          from: sms.to
        }
      }
    };

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest({
        username: sms.from.replace(/[^0-9]/g, ''),
        token: sendMessage.message.token,
        phone: {
          number: sms.from
        }
      });
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    sendMessage.message.msg = sms.body;
    sendMessage.guest = visitor;
    sendMessage.message.attachments = sms.media.map(curr => {
      const attachment = {
        message_link: curr.url
      };
      const contentType = curr.contentType;

      switch (contentType.substr(0, contentType.indexOf('/'))) {
        case 'image':
          attachment.image_url = curr.url;
          break;

        case 'video':
          attachment.video_url = curr.url;
          break;

        case 'audio':
          attachment.audio_url = curr.url;
          break;
      }

      return attachment;
    });

    try {
      const message = SMSService.response.call(this, RocketChat.Livechat.sendMessage(sendMessage));
      Meteor.defer(() => {
        if (sms.extra) {
          if (sms.extra.fromCountry) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
          }

          if (sms.extra.fromState) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
          }

          if (sms.extra.fromCity) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
          }
        }
      });
      return message;
    } catch (e) {
      return SMSService.error.call(this, e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"upload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/upload.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 0);
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 1);
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 2);
RocketChat.API.v1.addRoute('livechat/upload/:rid', {
  post() {
    if (!this.request.headers['x-visitor-token']) {
      return RocketChat.API.v1.unauthorized();
    }

    const visitorToken = this.request.headers['x-visitor-token'];
    const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

    if (!visitor) {
      return RocketChat.API.v1.unauthorized();
    }

    const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(visitorToken, this.urlParams.rid);

    if (!room) {
      return RocketChat.API.v1.unauthorized();
    }

    const busboy = new Busboy({
      headers: this.request.headers
    });
    const files = [];
    const fields = {};
    Meteor.wrapAsync(callback => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname !== 'file') {
          return files.push(new Meteor.Error('invalid-field'));
        }

        const fileDate = [];
        file.on('data', data => fileDate.push(data));
        file.on('end', () => {
          files.push({
            fieldname,
            file,
            filename,
            encoding,
            mimetype,
            fileBuffer: Buffer.concat(fileDate)
          });
        });
      });
      busboy.on('field', (fieldname, value) => fields[fieldname] = value);
      busboy.on('finish', Meteor.bindEnvironment(() => callback()));
      this.request.pipe(busboy);
    })();

    if (files.length === 0) {
      return RocketChat.API.v1.failure('File required');
    }

    if (files.length > 1) {
      return RocketChat.API.v1.failure('Just 1 file is allowed');
    }

    const file = files[0];

    if (!RocketChat.fileUploadIsValidContentType(file.mimetype)) {
      return RocketChat.API.v1.failure({
        reason: 'error-type-not-allowed'
      });
    }

    const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize', function (key, value) {
      try {
        return parseInt(value);
      } catch (e) {
        return RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
      }
    }); // -1 maxFileSize means there is no limit

    if (maxFileSize >= -1 && file.fileBuffer.length > maxFileSize) {
      return RocketChat.API.v1.failure({
        reason: 'error-size-not-allowed',
        sizeAllowed: filesize(maxFileSize)
      });
    }

    const fileStore = FileUpload.getStore('Uploads');
    const details = {
      name: file.filename,
      size: file.fileBuffer.length,
      type: file.mimetype,
      rid: this.urlParams.rid,
      visitorToken
    };
    const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);
    uploadedFile.description = fields.description;
    delete fields.description;
    RocketChat.API.v1.success(Meteor.call('sendFileLivechatMessage', this.urlParams.rid, visitorToken, uploadedFile, fields));
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/users.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/users/:type', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      const users = RocketChat.authz.getUsersInRole(role);
      return RocketChat.API.v1.success({
        users: users.fetch().map(user => _.pick(user, '_id', 'username', 'name', 'status', 'statusLivechat'))
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      check(this.bodyParams, {
        username: String
      });

      if (this.urlParams.type === 'agent') {
        const user = RocketChat.Livechat.addAgent(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else if (this.urlParams.type === 'manager') {
        const user = RocketChat.Livechat.addManager(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/users/:type/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure('User not found');
      }

      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      if (user.roles.indexOf(role) !== -1) {
        return RocketChat.API.v1.success({
          user: _.pick(user, '_id', 'username')
        });
      }

      return RocketChat.API.v1.success({
        user: null
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure();
      }

      if (this.urlParams.type === 'agent') {
        if (RocketChat.Livechat.removeAgent(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else if (this.urlParams.type === 'manager') {
        if (RocketChat.Livechat.removeManager(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/visitors.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    const visitor = LivechatVisitors.getVisitorByToken(this.urlParams.visitorToken);
    return RocketChat.API.v1.success(visitor);
  }

});
RocketChat.API.v1.addRoute('livechat/visitor/:visitorToken/room', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(this.urlParams.visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        servedBy: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      rooms
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"ua-parser-js":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/package.json                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "ua-parser-js";
exports.version = "0.7.17";
exports.main = "src/ua-parser.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"src":{"ua-parser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/src/ua-parser.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * UAParser.js v0.7.17
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
 * Dual licensed under GPLv2 & MIT
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.17',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var margedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    margedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    margedRegexes[i] = regexes[i];
                }
            }
            return margedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            //var result = {},
            var i = 0, j, k, p, q, matches, match;//, args = arguments;

            /*// construct object barebones
            for (p = 0; p < args[1].length; p++) {
                q = args[1][p];
                result[typeof q === OBJ_TYPE ? q[0] : q] = undefined;
            }*/

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
            // console.log(this);
            //return this;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser
            ], [NAME, VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
            ], [NAME, VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i
                                                                                // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p)/i                                                      // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w+)*/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w+)*/i                                                       // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w+)*/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)\s/i                                          // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel xl|pixel)\s/i                                   // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+(\w+)\s+build\/hm\1/i,                                    // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w)?)\s+build/i,    // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+)?)\s+build/i      // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)?(?:[\s_]*[\w\s]+)?)\s+build/i          // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu Tablet
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, TABLET]], [

            /android.+a000(1)\s+build/i                                         // OnePlus
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Venue[\d\s]*)\s+build/i                          // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(zte)?.+(k\d{2})\s+build/i                        // ZTE K Series Tablet
            ], [[VENDOR, 'ZTE'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2}x?.*)\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(.+)\s+build/i          // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?.+)\s+build/i                                // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?.+)\s+build/i                         // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_?)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-?)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(.*\b)\s+build/i             // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q.+)\s+build/i                           // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /(android.+)[;\/].+build/i                                          // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]


        /*//////////////////////////
            // TODO: move to string map
            ////////////////////////////

            /(C6603)/i                                                          // Sony Xperia Z C6603
            ], [[MODEL, 'Xperia Z C6603'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [
            /(C6903)/i                                                          // Sony Xperia Z 1
            ], [[MODEL, 'Xperia Z 1'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /(SM-G900[F|H])/i                                                   // Samsung Galaxy S5
            ], [[MODEL, 'Galaxy S5'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G7102)/i                                                       // Samsung Galaxy Grand 2
            ], [[MODEL, 'Galaxy Grand 2'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G530H)/i                                                       // Samsung Galaxy Grand Prime
            ], [[MODEL, 'Galaxy Grand Prime'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G313HZ)/i                                                      // Samsung Galaxy V
            ], [[MODEL, 'Galaxy V'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T805)/i                                                        // Samsung Galaxy Tab S 10.5
            ], [[MODEL, 'Galaxy Tab S 10.5'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [
            /(SM-G800F)/i                                                       // Samsung Galaxy S5 Mini
            ], [[MODEL, 'Galaxy S5 Mini'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T311)/i                                                        // Samsung Galaxy Tab 3 8.0
            ], [[MODEL, 'Galaxy Tab 3 8.0'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [

            /(T3C)/i                                                            // Advan Vandroid T3C
            ], [MODEL, [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN T1J\+)/i                                                    // Advan Vandroid T1J+
            ], [[MODEL, 'Vandroid T1J+'], [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN S4A)/i                                                      // Advan Vandroid S4A
            ], [[MODEL, 'Vandroid S4A'], [VENDOR, 'Advan'], [TYPE, MOBILE]], [

            /(V972M)/i                                                          // ZTE V972M
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [

            /(i-mobile)\s(IQ\s[\d\.]+)/i                                        // i-mobile IQ
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(IQ6.3)/i                                                          // i-mobile IQ IQ 6.3
            ], [[MODEL, 'IQ 6.3'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [
            /(i-mobile)\s(i-style\s[\d\.]+)/i                                   // i-mobile i-STYLE
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(i-STYLE2.1)/i                                                     // i-mobile i-STYLE 2.1
            ], [[MODEL, 'i-STYLE 2.1'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [

            /(mobiistar touch LAI 512)/i                                        // mobiistar touch LAI 512
            ], [[MODEL, 'Touch LAI 512'], [VENDOR, 'mobiistar'], [TYPE, MOBILE]], [

            /////////////
            // END TODO
            ///////////*/

        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s]+\w)*/i,                  // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                  // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]+(?:.*os\s([\w]+)\slike\smac|;\sopera)/i                 // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    /*
    var Browser = function (name, version) {
        this[NAME] = name;
        this[VERSION] = version;
    };
    var CPU = function (arch) {
        this[ARCHITECTURE] = arch;
    };
    var Device = function (vendor, model, type) {
        this[VENDOR] = vendor;
        this[MODEL] = model;
        this[TYPE] = type;
    };
    var Engine = Browser;
    var OS = Browser;
    */
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;
        //var browser = new Browser();
        //var cpu = new CPU();
        //var device = new Device();
        //var engine = new Engine();
        //var os = new OS();

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            //browser = new Browser();
            //cpu = new CPU();
            //device = new Device();
            //engine = new Engine();
            //os = new OS();
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };
    //UAParser.Utils = util;

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        // TODO: test!!!!!!!!
        /*
        if (require && require.main === module && process) {
            // cli
            var jsonize = function (arr) {
                var res = [];
                for (var i in arr) {
                    res.push(new UAParser(arr[i]).getResult());
                }
                process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            };
            if (process.stdin.isTTY) {
                // via args
                jsonize(process.argv.slice(2));
            } else {
                // via pipe
                var str = '';
                process.stdin.on('readable', function() {
                    var read = process.stdin.read();
                    if (read !== null) {
                        str += read;
                    }
                });
                process.stdin.on('end', function () {
                    jsonize(str.replace(/\n$/, '').split('\n'));
                });
            }
        }
        */
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if (typeof $ !== UNDEF_TYPE) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:livechat/livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/startup.js");
require("/node_modules/meteor/rocketchat:livechat/server/visitorStatus.js");
require("/node_modules/meteor/rocketchat:livechat/permissions.js");
require("/node_modules/meteor/rocketchat:livechat/messageTypes.js");
require("/node_modules/meteor/rocketchat:livechat/config.js");
require("/node_modules/meteor/rocketchat:livechat/server/roomType.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/externalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/leadCapture.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/markRoomResponded.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/offlineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/RDStation.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToCRM.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToFacebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/changeLivechatStatus.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeByVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/facebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getCustomFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getAgentData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getInitialData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getNextAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loadHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loginByToken.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/pageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/registerGuest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveSurveyFeedback.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/searchAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendMessageLivechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendFileLivechatMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendOfflineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setDepartmentForVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/startVideoCall.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/startFileUploadRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/transfer.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/webhookTest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/takeInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/returnAsInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendTranscript.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Users.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatExternalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/indexes.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatOfficeHour.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/Livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/QueueMethods.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/OfficeClock.js");
require("/node_modules/meteor/rocketchat:livechat/server/sendMessageBySMS.js");
require("/node_modules/meteor/rocketchat:livechat/server/unclosedLivechats.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/customFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/departmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/externalMessages.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatDepartments.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatManagers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatRooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatQueue.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatTriggers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatInquiries.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/api.js");

/* Exports */
Package._define("rocketchat:livechat");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_livechat.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9saXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvc3RhcnR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvdmlzaXRvclN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL2V4dGVybmFsTWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvbGVhZENhcHR1cmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL21hcmtSb29tUmVzcG9uZGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9vZmZsaW5lTWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvUkRTdGF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9zZW5kVG9DUk0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL3NlbmRUb0ZhY2Vib29rLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2FkZEFnZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2FkZE1hbmFnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvY2hhbmdlTGl2ZWNoYXRTdGF0dXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvY2xvc2VCeVZpc2l0b3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvY2xvc2VSb29tLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2ZhY2Vib29rLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2dldEN1c3RvbUZpZWxkcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXRBZ2VudERhdGEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZ2V0SW5pdGlhbERhdGEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZ2V0TmV4dEFnZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2xvYWRIaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2xvZ2luQnlUb2tlbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9wYWdlVmlzaXRlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZWdpc3Rlckd1ZXN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZUFnZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZUN1c3RvbUZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZURlcGFydG1lbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlTWFuYWdlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZW1vdmVUcmlnZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUFwcGVhcmFuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUN1c3RvbUZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVEZXBhcnRtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVJbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVJbnRlZ3JhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zYXZlU3VydmV5RmVlZGJhY2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZVRyaWdnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2VhcmNoQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2VuZE1lc3NhZ2VMaXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kRmlsZUxpdmVjaGF0TWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kT2ZmbGluZU1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2V0Q3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2V0RGVwYXJ0bWVudEZvclZpc2l0b3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc3RhcnRWaWRlb0NhbGwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc3RhcnRGaWxlVXBsb2FkUm9vbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy90cmFuc2Zlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy93ZWJob29rVGVzdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy90YWtlSW5xdWlyeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZXR1cm5Bc0lucXVpcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZU9mZmljZUhvdXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NlbmRUcmFuc2NyaXB0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvVXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9Sb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL01lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdEN1c3RvbUZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXREZXBhcnRtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRQYWdlVmlzaXRlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VHJpZ2dlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL2luZGV4ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdElucXVpcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdE9mZmljZUhvdXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9saWIvTGl2ZWNoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2xpYi9RdWV1ZU1ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2xpYi9PZmZpY2VDbG9jay5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbGliL09tbmlDaGFubmVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9zZW5kTWVzc2FnZUJ5U01TLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci91bmNsb3NlZExpdmVjaGF0cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2N1c3RvbUZpZWxkcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2RlcGFydG1lbnRBZ2VudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9leHRlcm5hbE1lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRBZ2VudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdEFwcGVhcmFuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdERlcGFydG1lbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRJbnRlZ3JhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0TWFuYWdlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdFJvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRRdWV1ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0VHJpZ2dlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy92aXNpdG9ySGlzdG9yeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL3Zpc2l0b3JJbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvdmlzaXRvclBhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRJbnF1aXJpZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdE9mZmljZUhvdXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvbWVzc2FnZVR5cGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2NvbmZpZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL0xpdmVjaGF0Um9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC9kZXBhcnRtZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L2ZhY2Vib29rLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3QvbWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC9zbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC91cGxvYWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC91c2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L3Zpc2l0b3JzLmpzIl0sIm5hbWVzIjpbIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInVybCIsIldlYkFwcCIsIlBhY2thZ2UiLCJ3ZWJhcHAiLCJBdXRvdXBkYXRlIiwiYXV0b3VwZGF0ZSIsImNvbm5lY3RIYW5kbGVycyIsInVzZSIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsInJlcSIsInJlcyIsIm5leHQiLCJyZXFVcmwiLCJwYXJzZSIsInBhdGhuYW1lIiwic2V0SGVhZGVyIiwiZG9tYWluV2hpdGVMaXN0IiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiZ2V0IiwiaGVhZGVycyIsInJlZmVyZXIiLCJpc0VtcHR5IiwidHJpbSIsIm1hcCIsInNwbGl0IiwiZG9tYWluIiwiY29udGFpbnMiLCJob3N0IiwicHJvdG9jb2wiLCJoZWFkIiwiQXNzZXRzIiwiZ2V0VGV4dCIsImJhc2VVcmwiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwiUk9PVF9VUkxfUEFUSF9QUkVGSVgiLCJ0ZXN0IiwiaHRtbCIsImF1dG91cGRhdGVWZXJzaW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsIndyaXRlIiwiZW5kIiwic3RhcnR1cCIsInJvb21UeXBlcyIsInNldFJvb21GaW5kIiwiX2lkIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kTGl2ZWNoYXRCeUlkIiwiYXV0aHoiLCJhZGRSb29tQWNjZXNzVmFsaWRhdG9yIiwicm9vbSIsInVzZXIiLCJ0IiwiaGFzUGVybWlzc2lvbiIsImV4dHJhRGF0YSIsInJpZCIsImZpbmRPbmVCeUlkIiwidmlzaXRvclRva2VuIiwidG9rZW4iLCJjYWxsYmFja3MiLCJhZGQiLCJFcnJvciIsIlRBUGkxOG4iLCJfXyIsImxuZyIsImxhbmd1YWdlIiwicHJpb3JpdHkiLCJMT1ciLCJVc2VyUHJlc2VuY2VFdmVudHMiLCJvbiIsInNlc3Npb24iLCJzdGF0dXMiLCJtZXRhZGF0YSIsInZpc2l0b3IiLCJMaXZlY2hhdElucXVpcnkiLCJ1cGRhdGVWaXNpdG9yU3RhdHVzIiwiTGl2ZWNoYXRSb29tVHlwZSIsIkxpdmVjaGF0VmlzaXRvcnMiLCJMaXZlY2hhdFJvb21UeXBlU2VydmVyIiwiZ2V0TXNnU2VuZGVyIiwic2VuZGVySWQiLCJnZXROb3RpZmljYXRpb25EZXRhaWxzIiwibm90aWZpY2F0aW9uTWVzc2FnZSIsInRpdGxlIiwicm9vbU5hbWUiLCJ0ZXh0IiwiY2FuQWNjZXNzVXBsb2FkZWRGaWxlIiwicmNfdG9rZW4iLCJyY19yaWQiLCJmaW5kT25lT3BlbkJ5VmlzaXRvclRva2VuIiwia25vd2xlZGdlRW5hYmxlZCIsImFwaWFpS2V5IiwiYXBpYWlMYW5ndWFnZSIsImtleSIsInZhbHVlIiwibWVzc2FnZSIsImVkaXRlZEF0IiwiZGVmZXIiLCJyZXNwb25zZSIsIkhUVFAiLCJwb3N0IiwiZGF0YSIsInF1ZXJ5IiwibXNnIiwibGFuZyIsInNlc3Npb25JZCIsImNvZGUiLCJyZXN1bHQiLCJmdWxmaWxsbWVudCIsInNwZWVjaCIsIkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlIiwiaW5zZXJ0Iiwib3JpZyIsInRzIiwiRGF0ZSIsImUiLCJTeXN0ZW1Mb2dnZXIiLCJlcnJvciIsInZhbGlkYXRlTWVzc2FnZSIsInBob25lUmVnZXhwIiwiUmVnRXhwIiwibXNnUGhvbmVzIiwibWF0Y2giLCJlbWFpbFJlZ2V4cCIsIm1zZ0VtYWlscyIsInNhdmVHdWVzdEVtYWlsUGhvbmVCeUlkIiwicnVuIiwid2FpdGluZ1Jlc3BvbnNlIiwibm93Iiwic2V0UmVzcG9uc2VCeVJvb21JZCIsInUiLCJ1c2VybmFtZSIsInJlc3BvbnNlRGF0ZSIsInJlc3BvbnNlVGltZSIsImdldFRpbWUiLCJwb3N0RGF0YSIsInR5cGUiLCJzZW50QXQiLCJuYW1lIiwiZW1haWwiLCJMaXZlY2hhdCIsInNlbmRSZXF1ZXN0IiwiTUVESVVNIiwic2VuZFRvUkRTdGF0aW9uIiwibGl2ZWNoYXREYXRhIiwiZ2V0TGl2ZWNoYXRSb29tR3Vlc3RJbmZvIiwib3B0aW9ucyIsInRva2VuX3Jkc3RhdGlvbiIsImlkZW50aWZpY2Fkb3IiLCJjbGllbnRfaWQiLCJub21lIiwicGhvbmUiLCJ0ZWxlZm9uZSIsInRhZ3MiLCJPYmplY3QiLCJrZXlzIiwiY3VzdG9tRmllbGRzIiwiZm9yRWFjaCIsImZpZWxkIiwiY2FsbCIsImNvbnNvbGUiLCJtc2dOYXZUeXBlIiwic2VuZE1lc3NhZ2VUeXBlIiwibXNnVHlwZSIsInNlbmROYXZIaXN0b3J5Iiwic2VuZFRvQ1JNIiwiaW5jbHVkZU1lc3NhZ2VzIiwibWVzc2FnZXMiLCJNZXNzYWdlcyIsImZpbmRWaXNpYmxlQnlSb29tSWQiLCJzb3J0IiwiQXJyYXkiLCJhZ2VudElkIiwibmF2aWdhdGlvbiIsInB1c2giLCJzYXZlQ1JNRGF0YUJ5Um9vbUlkIiwib3BlbiIsIk9tbmlDaGFubmVsIiwiZmFjZWJvb2siLCJyZXBseSIsInBhZ2UiLCJpZCIsIm1ldGhvZHMiLCJ1c2VySWQiLCJtZXRob2QiLCJhZGRBZ2VudCIsImFkZE1hbmFnZXIiLCJuZXdTdGF0dXMiLCJzdGF0dXNMaXZlY2hhdCIsIlVzZXJzIiwic2V0TGl2ZWNoYXRTdGF0dXMiLCJyb29tSWQiLCJnZXRWaXNpdG9yQnlUb2tlbiIsImNsb3NlUm9vbSIsImNvbW1lbnQiLCJzdWJzY3JpcHRpb24iLCJTdWJzY3JpcHRpb25zIiwiZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkIiwiYWN0aW9uIiwiZW5hYmxlZCIsImhhc1Rva2VuIiwiZW5hYmxlIiwic3VjY2VzcyIsInVwZGF0ZUJ5SWQiLCJkaXNhYmxlIiwibGlzdFBhZ2VzIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJMaXZlY2hhdEN1c3RvbUZpZWxkIiwiZmluZCIsImZldGNoIiwiY2hlY2siLCJTdHJpbmciLCJzZXJ2ZWRCeSIsImdldEFnZW50SW5mbyIsImluZm8iLCJjb2xvciIsInJlZ2lzdHJhdGlvbkZvcm0iLCJ0cmlnZ2VycyIsImRlcGFydG1lbnRzIiwiYWxsb3dTd2l0Y2hpbmdEZXBhcnRtZW50cyIsIm9ubGluZSIsIm9mZmxpbmVDb2xvciIsIm9mZmxpbmVNZXNzYWdlIiwib2ZmbGluZVN1Y2Nlc3NNZXNzYWdlIiwib2ZmbGluZVVuYXZhaWxhYmxlTWVzc2FnZSIsImRpc3BsYXlPZmZsaW5lRm9ybSIsInZpZGVvQ2FsbCIsImZpbGVVcGxvYWQiLCJjb252ZXJzYXRpb25GaW5pc2hlZE1lc3NhZ2UiLCJuYW1lRmllbGRSZWdpc3RyYXRpb25Gb3JtIiwiZW1haWxGaWVsZFJlZ2lzdHJhdGlvbkZvcm0iLCJmaW5kT3BlbkJ5VmlzaXRvclRva2VuIiwiZmllbGRzIiwiY2wiLCJ1c2VybmFtZXMiLCJsZW5ndGgiLCJ2aXNpdG9yRW1haWxzIiwiaW5pdFNldHRpbmdzIiwiZ2V0SW5pdFNldHRpbmdzIiwiTGl2ZWNoYXRfdGl0bGUiLCJMaXZlY2hhdF90aXRsZV9jb2xvciIsIkxpdmVjaGF0X2VuYWJsZWQiLCJMaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybSIsIm9mZmxpbmVUaXRsZSIsIkxpdmVjaGF0X29mZmxpbmVfdGl0bGUiLCJMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yIiwiTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlIiwiTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UiLCJMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUiLCJMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybSIsIkxhbmd1YWdlIiwiTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQiLCJKaXRzaV9FbmFibGVkIiwiTGl2ZWNoYXRfZmlsZXVwbG9hZF9lbmFibGVkIiwiRmlsZVVwbG9hZF9FbmFibGVkIiwidHJhbnNjcmlwdCIsIkxpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0IiwidHJhbnNjcmlwdE1lc3NhZ2UiLCJMaXZlY2hhdF90cmFuc2NyaXB0X21lc3NhZ2UiLCJMaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZSIsIkxpdmVjaGF0X25hbWVfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0iLCJMaXZlY2hhdF9lbWFpbF9maWVsZF9yZWdpc3RyYXRpb25fZm9ybSIsImFnZW50RGF0YSIsIkxpdmVjaGF0VHJpZ2dlciIsImZpbmRFbmFibGVkIiwidHJpZ2dlciIsInBpY2siLCJMaXZlY2hhdERlcGFydG1lbnQiLCJmaW5kRW5hYmxlZFdpdGhBZ2VudHMiLCJkZXBhcnRtZW50IiwiTGl2ZWNoYXRfYWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzIiwiZmluZE9ubGluZUFnZW50cyIsImNvdW50IiwicmVxdWlyZURlcGFybWVudCIsImdldFJlcXVpcmVkRGVwYXJ0bWVudCIsImFnZW50IiwiZ2V0TmV4dEFnZW50IiwibGltaXQiLCJscyIsImxvYWRNZXNzYWdlSGlzdG9yeSIsInBhZ2VJbmZvIiwic2F2ZVBhZ2VIaXN0b3J5IiwicmVnaXN0ZXJHdWVzdCIsImtlZXBIaXN0b3J5Rm9yVG9rZW4iLCJjdXJzb3IiLCJzYXZlUm9vbUluZm8iLCJyZW1vdmVBZ2VudCIsImN1c3RvbUZpZWxkIiwicmVtb3ZlQnlJZCIsInJlbW92ZURlcGFydG1lbnQiLCJyZW1vdmVNYW5hZ2VyIiwidHJpZ2dlcklkIiwicmVtb3ZlQnlSb29tSWQiLCJ2YWxpZFNldHRpbmdzIiwidmFsaWQiLCJldmVyeSIsInNldHRpbmciLCJpbmRleE9mIiwiY3VzdG9tRmllbGREYXRhIiwiTWF0Y2giLCJPYmplY3RJbmNsdWRpbmciLCJsYWJlbCIsInNjb3BlIiwidmlzaWJpbGl0eSIsImNyZWF0ZU9yVXBkYXRlQ3VzdG9tRmllbGQiLCJkZXBhcnRtZW50RGF0YSIsImRlcGFydG1lbnRBZ2VudHMiLCJzYXZlRGVwYXJ0bWVudCIsImd1ZXN0RGF0YSIsInJvb21EYXRhIiwiT3B0aW9uYWwiLCJ0b3BpYyIsInJldCIsInNhdmVHdWVzdCIsInMiLCJ2YWx1ZXMiLCJ2aXNpdG9yUm9vbSIsImZvcm1EYXRhIiwidW5kZWZpbmVkIiwidXBkYXRlRGF0YSIsIml0ZW0iLCJ1cGRhdGVTdXJ2ZXlGZWVkYmFja0J5SWQiLCJNYXliZSIsImRlc2NyaXB0aW9uIiwiQm9vbGVhbiIsImNvbmRpdGlvbnMiLCJhY3Rpb25zIiwiaXNTdHJpbmciLCJmaW5kT25lQnlVc2VybmFtZSIsInNlbmRNZXNzYWdlTGl2ZWNoYXQiLCJhdHRhY2htZW50cyIsImd1ZXN0Iiwic2VuZE1lc3NhZ2UiLCJmaWxlIiwibXNnRGF0YSIsImF2YXRhciIsImVtb2ppIiwiYWxpYXMiLCJncm91cGFibGUiLCJmaWxlVXJsIiwiZW5jb2RlVVJJIiwiYXR0YWNobWVudCIsInRpdGxlX2xpbmsiLCJ0aXRsZV9saW5rX2Rvd25sb2FkIiwiaW1hZ2VfdXJsIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJzaXplIiwiaWRlbnRpZnkiLCJpbWFnZV9kaW1lbnNpb25zIiwiaW1hZ2VfcHJldmlldyIsIkZpbGVVcGxvYWQiLCJyZXNpemVJbWFnZVByZXZpZXciLCJhdWRpb191cmwiLCJhdWRpb190eXBlIiwiYXVkaW9fc2l6ZSIsInZpZGVvX3VybCIsInZpZGVvX3R5cGUiLCJ2aWRlb19zaXplIiwiYXNzaWduIiwiUmFuZG9tIiwiZG5zIiwiaGVhZGVyIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZSIsImZvb3RlciIsImZyb21FbWFpbCIsImVtYWlsRG9tYWluIiwic3Vic3RyIiwibGFzdEluZGV4T2YiLCJ3cmFwQXN5bmMiLCJyZXNvbHZlTXgiLCJFbWFpbCIsInNlbmQiLCJ0byIsImZyb20iLCJyZXBseVRvIiwic3ViamVjdCIsInN1YnN0cmluZyIsIkREUFJhdGVMaW1pdGVyIiwiYWRkUnVsZSIsImNvbm5lY3Rpb25JZCIsIm92ZXJ3cml0ZSIsInVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4iLCJzZXREZXBhcnRtZW50Rm9yR3Vlc3QiLCJnZXRSb29tIiwiaml0c2lUaW1lb3V0IiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsImFjdGlvbkxpbmtzIiwiaWNvbiIsImkxOG5MYWJlbCIsIm1ldGhvZF9pZCIsInBhcmFtcyIsImppdHNpUm9vbSIsInRyYW5zZmVyRGF0YSIsImRlcGFydG1lbnRJZCIsImhhc1JvbGUiLCJ0cmFuc2ZlciIsInBvc3RDYXRjaEVycm9yIiwicmVzb2x2ZSIsImVyciIsInVuYmxvY2siLCJzYW1wbGVEYXRhIiwiY3JlYXRlZEF0IiwibGFzdE1lc3NhZ2VBdCIsInByb2R1Y3RJZCIsImlwIiwiYnJvd3NlciIsIm9zIiwiY3VzdG9tZXJJZCIsImxvZyIsInN0YXR1c0NvZGUiLCJpbnF1aXJ5SWQiLCJpbnF1aXJ5Iiwic3Vic2NyaXB0aW9uRGF0YSIsImFsZXJ0IiwidW5yZWFkIiwidXNlck1lbnRpb25zIiwiZ3JvdXBNZW50aW9ucyIsImRlc2t0b3BOb3RpZmljYXRpb25zIiwibW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMiLCJlbWFpbE5vdGlmaWNhdGlvbnMiLCJpbmNVc2Vyc0NvdW50QnlJZCIsImNoYW5nZUFnZW50QnlSb29tSWQiLCJ0YWtlSW5xdWlyeSIsImNyZWF0ZUNvbW1hbmRXaXRoUm9vbUlkQW5kVXNlciIsInN0cmVhbSIsImVtaXQiLCJmaW5kT25lIiwib3BlbklucXVpcnkiLCJkYXkiLCJzdGFydCIsImZpbmlzaCIsIkxpdmVjaGF0T2ZmaWNlSG91ciIsInVwZGF0ZUhvdXJzIiwibW9tZW50IiwidXNlckxhbmd1YWdlIiwiZmluZFZpc2libGVCeVJvb21JZE5vdENvbnRhaW5pbmdUeXBlcyIsImF1dGhvciIsImRhdGV0aW1lIiwibG9jYWxlIiwiZm9ybWF0Iiwic2luZ2xlTWVzc2FnZSIsImVtYWlsU2V0dGluZ3MiLCJzZXRPcGVyYXRvciIsIm9wZXJhdG9yIiwidXBkYXRlIiwiJHNldCIsIiRleGlzdHMiLCIkbmUiLCJyb2xlcyIsImZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUiLCJmaW5kQWdlbnRzIiwiZmluZE9ubGluZVVzZXJGcm9tTGlzdCIsInVzZXJMaXN0IiwiJGluIiwiY29uY2F0IiwiY29sbGVjdGlvbk9iaiIsIm1vZGVsIiwicmF3Q29sbGVjdGlvbiIsImZpbmRBbmRNb2RpZnkiLCJsaXZlY2hhdENvdW50IiwiJGluYyIsImNsb3NlT2ZmaWNlIiwic2VsZiIsIm9wZW5PZmZpY2UiLCJlbWFpbHMiLCJzdXJ2ZXlGZWVkYmFjayIsImZpbmRMaXZlY2hhdCIsImZpbHRlciIsIm9mZnNldCIsImV4dGVuZCIsInVwZGF0ZUxpdmVjaGF0Um9vbUNvdW50Iiwic2V0dGluZ3NSYXciLCJTZXR0aW5ncyIsImZpbmRCeVZpc2l0b3JUb2tlbiIsImZpbmRCeVZpc2l0b3JJZCIsInZpc2l0b3JJZCIsInJlc3BvbnNlQnkiLCIkdW5zZXQiLCJjbG9zZUJ5Um9vbUlkIiwiY2xvc2VJbmZvIiwiY2xvc2VyIiwiY2xvc2VkQnkiLCJjbG9zZWRBdCIsImNoYXREdXJhdGlvbiIsImZpbmRPcGVuQnlBZ2VudCIsIm5ld0FnZW50IiwiY3JtRGF0YSIsImV4cGlyZUF0IiwibXVsdGkiLCJzZXRSb29tSWRCeVRva2VuIiwiX0Jhc2UiLCJjb25zdHJ1Y3RvciIsImlzQ2xpZW50IiwiX2luaXRNb2RlbCIsImZpbmRCeVJvb21JZCIsInJlY29yZCIsInJlbW92ZSIsInRyeUVuc3VyZUluZGV4IiwibnVtQWdlbnRzIiwiZmluZEJ5RGVwYXJ0bWVudElkIiwiY3JlYXRlT3JVcGRhdGVEZXBhcnRtZW50Iiwic2hvd09uUmVnaXN0cmF0aW9uIiwiYWdlbnRzIiwic2F2ZWRBZ2VudHMiLCJwbHVjayIsIkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyIsImFnZW50c1RvU2F2ZSIsImRpZmZlcmVuY2UiLCJyZW1vdmVCeURlcGFydG1lbnRJZEFuZEFnZW50SWQiLCJzYXZlQWdlbnQiLCJwYXJzZUludCIsIm9yZGVyIiwiJGd0IiwidXBzZXJ0IiwiZ2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudCIsIm9ubGluZVVzZXJzIiwib25saW5lVXNlcm5hbWVzIiwiZ2V0T25saW5lRm9yRGVwYXJ0bWVudCIsImRlcEFnZW50cyIsImZpbmRVc2Vyc0luUXVldWUiLCJ1c2Vyc0xpc3QiLCJyZXBsYWNlVXNlcm5hbWVPZkFnZW50QnlVc2VySWQiLCJMaXZlY2hhdFBhZ2VWaXNpdGVkIiwic3BhcnNlIiwiZXhwaXJlQWZ0ZXJTZWNvbmRzIiwic2F2ZUJ5VG9rZW4iLCJrZWVwSGlzdG9yeU1pbGlzZWNvbmRzIiwiZmluZEJ5VG9rZW4iLCJyZW1vdmVBbGwiLCJmaW5kQnlJZCIsImdldFN0YXR1cyIsIm5ld1N0YXJ0IiwibmV3RmluaXNoIiwibmV3T3BlbiIsImlzTm93V2l0aGluSG91cnMiLCJjdXJyZW50VGltZSIsInV0YyIsInRvZGF5c09mZmljZUhvdXJzIiwiaXNCZWZvcmUiLCJpc0JldHdlZW4iLCJpc09wZW5pbmdUaW1lIiwiaXNTYW1lIiwiaXNDbG9zaW5nVGltZSIsImZpbmRWaXNpdG9yQnlUb2tlbiIsImZpbmRPbmVWaXNpdG9yQnlQaG9uZSIsImdldE5leHRWaXNpdG9yVXNlcm5hbWUiLCJzYXZlR3Vlc3RCeUlkIiwic2V0RGF0YSIsInVuc2V0RGF0YSIsImFkZHJlc3MiLCJwaG9uZU51bWJlciIsImZpbmRPbmVHdWVzdEJ5RW1haWxBZGRyZXNzIiwiZW1haWxBZGRyZXNzIiwiZXNjYXBlUmVnRXhwIiwicGhvbmVzIiwiJGFkZFRvU2V0Iiwic2F2ZUVtYWlsIiwiJGVhY2giLCJzYXZlUGhvbmUiLCJleHBvcnREZWZhdWx0IiwiVUFQYXJzZXIiLCJoaXN0b3J5TW9uaXRvclR5cGUiLCJsb2dnZXIiLCJMb2dnZXIiLCJzZWN0aW9ucyIsIndlYmhvb2siLCJpIiwicXVlcnlTdHJpbmciLCJnZXRBZ2VudHMiLCJnZXRPbmxpbmVBZ2VudHMiLCJvbmxpbmVSZXF1aXJlZCIsImRlcHQiLCJvbmxpbmVBZ2VudHMiLCJyb29tSW5mbyIsIm5ld1Jvb20iLCJyb3V0aW5nTWV0aG9kIiwiUXVldWVNZXRob2RzIiwic2hvd0Nvbm5lY3RpbmciLCJ1cGRhdGVVc2VyIiwiZXhpc3RpbmdVc2VyIiwidXNlckRhdGEiLCJjb25uZWN0aW9uIiwidXNlckFnZW50IiwiaHR0cEhlYWRlcnMiLCJjbGllbnRBZGRyZXNzIiwibnVtYmVyIiwidXNlcnMiLCJjbG9zZURhdGEiLCJoaWRlQnlSb29tSWRBbmRVc2VySWQiLCJmaW5kTm90SGlkZGVuUHVibGljIiwic2V0VG9waWNBbmRUYWdzQnlJZCIsInNldEZuYW1lQnlJZCIsInVwZGF0ZURpc3BsYXlOYW1lQnlSb29tSWQiLCJjbG9zZU9wZW5DaGF0cyIsImZvcndhcmRPcGVuQ2hhdHMiLCJjaGFuZ2UiLCJwYWdlVGl0bGUiLCJwYWdlVXJsIiwibG9jYXRpb24iLCJocmVmIiwiX2hpZGRlbiIsImNyZWF0ZU5hdmlnYXRpb25IaXN0b3J5V2l0aFJvb21JZE1lc3NhZ2VBbmRVc2VyIiwicmVtb3ZlQnlSb29tSWRBbmRVc2VySWQiLCJjcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlciIsImNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIiLCJjYWxsYmFjayIsInRyeWluZyIsIndhcm4iLCJzZXRUaW1lb3V0IiwidWEiLCJzZXRVQSIsImZuYW1lIiwibG0iLCJnZXRPUyIsInZlcnNpb24iLCJnZXRCcm93c2VyIiwiYWRkVXNlclJvbGVzIiwicmVtb3ZlVXNlckZyb21Sb2xlcyIsIlN0cmVhbWVyIiwiYWxsb3dSZWFkIiwibXNncyIsInVzZXJzQ291bnQiLCJhZ2VudElkcyIsInNldEludGVydmFsIiwiZ2F0ZXdheVVSTCIsInBhZ2VJZCIsIlNNUyIsInNtcyIsIlNNU1NlcnZpY2UiLCJnZXRTZXJ2aWNlIiwiYWdlbnRzSGFuZGxlciIsIm1vbml0b3JBZ2VudHMiLCJhY3Rpb25UaW1lb3V0IiwicXVldWUiLCJjbGVhclRpbWVvdXQiLCJleGlzdHMiLCJydW5BZ2VudExlYXZlQWN0aW9uIiwib2JzZXJ2ZUNoYW5nZXMiLCJhZGRlZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwic3RvcCIsIlVzZXJQcmVzZW5jZU1vbml0b3IiLCJvblNldFVzZXJTdGF0dXMiLCJwdWJsaXNoIiwiaGFuZGxlIiwiZ2V0VXNlcnNJblJvbGUiLCJyZWFkeSIsIm9uU3RvcCIsImZpbmRCeUlkcyIsIiRndGUiLCJzZXREYXRlIiwiZ2V0RGF0ZSIsInNldFNlY29uZHMiLCJnZXRTZWNvbmRzIiwiJGx0ZSIsImhhbmRsZURlcHRzIiwiZmluZEJ5Um9vbUlkQW5kVHlwZSIsIlJvbGVzIiwiY3JlYXRlT3JVcGRhdGUiLCJQZXJtaXNzaW9ucyIsIk1lc3NhZ2VUeXBlcyIsInJlZ2lzdGVyVHlwZSIsInN5c3RlbSIsImhpc3RvcnkiLCJyZWdpc3RlciIsImluc3RhbmNlIiwidGFiQmFyIiwiaXNTZXJ2ZXIiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5Um9vbSIsInNldEhpZGRlbkJ5SWQiLCJhZGRHcm91cCIsImdyb3VwIiwicHVibGljIiwiZWRpdG9yIiwiYWxsb3dlZFR5cGVzIiwic2VjdGlvbiIsImkxOG5EZXNjcmlwdGlvbiIsImVuYWJsZVF1ZXJ5IiwiZXhwb3J0IiwiUm9vbVNldHRpbmdzRW51bSIsIlJvb21UeXBlQ29uZmlnIiwiUm9vbVR5cGVSb3V0ZUNvbmZpZyIsIlVpVGV4dENvbnRleHQiLCJMaXZlY2hhdFJvb21Sb3V0ZSIsInBhdGgiLCJvcGVuUm9vbSIsImxpbmsiLCJzdWIiLCJpZGVudGlmaWVyIiwicm91dGUiLCJub3RTdWJzY3JpYmVkVHBsIiwidGVtcGxhdGUiLCJmaW5kUm9vbSIsIkNoYXRSb29tIiwiY29uZGl0aW9uIiwiaGFzQWxsUGVybWlzc2lvbiIsImNhblNlbmRNZXNzYWdlIiwiZ2V0VXNlclN0YXR1cyIsIlNlc3Npb24iLCJhbGxvd1Jvb21TZXR0aW5nQ2hhbmdlIiwiSk9JTl9DT0RFIiwiZ2V0VWlUZXh0IiwiY29udGV4dCIsIkhJREVfV0FSTklORyIsIkxFQVZFX1dBUk5JTkciLCJBUEkiLCJ2MSIsImFkZFJvdXRlIiwiYXV0aFJlcXVpcmVkIiwidW5hdXRob3JpemVkIiwiYm9keVBhcmFtcyIsImZhaWx1cmUiLCJ1cmxQYXJhbXMiLCJwdXQiLCJkZWxldGUiLCJjcnlwdG8iLCJyZXF1ZXN0Iiwic2lnbmF0dXJlIiwiY3JlYXRlSG1hYyIsImJvZHkiLCJkaWdlc3QiLCJtaWQiLCJyb29tcyIsImZpcnN0X25hbWUiLCJsYXN0X25hbWUiLCJzdWNlc3MiLCJzZW50TWVzc2FnZXMiLCJzZW50TWVzc2FnZSIsInNlcnZpY2UiLCJtZWRpYSIsImN1cnIiLCJtZXNzYWdlX2xpbmsiLCJjb250ZW50VHlwZSIsImV4dHJhIiwiZnJvbUNvdW50cnkiLCJmcm9tU3RhdGUiLCJmcm9tQ2l0eSIsIkJ1c2JveSIsImZpbGVzaXplIiwiYnVzYm95IiwiZmlsZXMiLCJmaWVsZG5hbWUiLCJmaWxlbmFtZSIsImVuY29kaW5nIiwibWltZXR5cGUiLCJmaWxlRGF0ZSIsImZpbGVCdWZmZXIiLCJCdWZmZXIiLCJwaXBlIiwiZmlsZVVwbG9hZElzVmFsaWRDb250ZW50VHlwZSIsInJlYXNvbiIsIm1heEZpbGVTaXplIiwicGFja2FnZVZhbHVlIiwic2l6ZUFsbG93ZWQiLCJmaWxlU3RvcmUiLCJnZXRTdG9yZSIsImRldGFpbHMiLCJ1cGxvYWRlZEZpbGUiLCJiaW5kIiwicm9sZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsR0FBSjtBQUFRTCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsS0FBUixDQUFiLEVBQTRCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDQyxVQUFJRCxDQUFKO0FBQU07O0FBQWxCLENBQTVCLEVBQWdELENBQWhEO0FBSXRFRSxTQUFTQyxRQUFRQyxNQUFSLENBQWVGLE1BQXhCO0FBQ0EsTUFBTUcsYUFBYUYsUUFBUUcsVUFBUixDQUFtQkQsVUFBdEM7QUFFQUgsT0FBT0ssZUFBUCxDQUF1QkMsR0FBdkIsQ0FBMkIsV0FBM0IsRUFBd0NDLE9BQU9DLGVBQVAsQ0FBdUIsQ0FBQ0MsR0FBRCxFQUFNQyxHQUFOLEVBQVdDLElBQVgsS0FBb0I7QUFDbEYsUUFBTUMsU0FBU2IsSUFBSWMsS0FBSixDQUFVSixJQUFJVixHQUFkLENBQWY7O0FBQ0EsTUFBSWEsT0FBT0UsUUFBUCxLQUFvQixHQUF4QixFQUE2QjtBQUM1QixXQUFPSCxNQUFQO0FBQ0E7O0FBQ0RELE1BQUlLLFNBQUosQ0FBYyxjQUFkLEVBQThCLDBCQUE5QjtBQUVBLE1BQUlDLGtCQUFrQkMsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsNkJBQXhCLENBQXRC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ZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2xpdmVjaGF0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBXZWJBcHA6dHJ1ZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5cbldlYkFwcCA9IFBhY2thZ2Uud2ViYXBwLldlYkFwcDtcbmNvbnN0IEF1dG91cGRhdGUgPSBQYWNrYWdlLmF1dG91cGRhdGUuQXV0b3VwZGF0ZTtcblxuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoJy9saXZlY2hhdCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdGNvbnN0IHJlcVVybCA9IHVybC5wYXJzZShyZXEudXJsKTtcblx0aWYgKHJlcVVybC5wYXRobmFtZSAhPT0gJy8nKSB7XG5cdFx0cmV0dXJuIG5leHQoKTtcblx0fVxuXHRyZXMuc2V0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04Jyk7XG5cblx0bGV0IGRvbWFpbldoaXRlTGlzdCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9BbGxvd2VkRG9tYWluc0xpc3QnKTtcblx0aWYgKHJlcS5oZWFkZXJzLnJlZmVyZXIgJiYgIV8uaXNFbXB0eShkb21haW5XaGl0ZUxpc3QudHJpbSgpKSkge1xuXHRcdGRvbWFpbldoaXRlTGlzdCA9IF8ubWFwKGRvbWFpbldoaXRlTGlzdC5zcGxpdCgnLCcpLCBmdW5jdGlvbihkb21haW4pIHtcblx0XHRcdHJldHVybiBkb21haW4udHJpbSgpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgcmVmZXJlciA9IHVybC5wYXJzZShyZXEuaGVhZGVycy5yZWZlcmVyKTtcblx0XHRpZiAoIV8uY29udGFpbnMoZG9tYWluV2hpdGVMaXN0LCByZWZlcmVyLmhvc3QpKSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdYLUZSQU1FLU9QVElPTlMnLCAnREVOWScpO1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdYLUZSQU1FLU9QVElPTlMnLCBgQUxMT1ctRlJPTSAkeyByZWZlcmVyLnByb3RvY29sIH0vLyR7IHJlZmVyZXIuaG9zdCB9YCk7XG5cdH1cblxuXHRjb25zdCBoZWFkID0gQXNzZXRzLmdldFRleHQoJ3B1YmxpYy9oZWFkLmh0bWwnKTtcblxuXHRsZXQgYmFzZVVybDtcblx0aWYgKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggJiYgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWC50cmltKCkgIT09ICcnKSB7XG5cdFx0YmFzZVVybCA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVg7XG5cdH0gZWxzZSB7XG5cdFx0YmFzZVVybCA9ICcvJztcblx0fVxuXHRpZiAoL1xcLyQvLnRlc3QoYmFzZVVybCkgPT09IGZhbHNlKSB7XG5cdFx0YmFzZVVybCArPSAnLyc7XG5cdH1cblxuXHRjb25zdCBodG1sID0gYDxodG1sPlxuXHRcdDxoZWFkPlxuXHRcdFx0PGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGNsYXNzPVwiX19tZXRlb3ItY3NzX19cIiBocmVmPVwiJHsgYmFzZVVybCB9bGl2ZWNoYXQvbGl2ZWNoYXQuY3NzP19kYz0keyBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIH1cIj5cblx0XHRcdDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiPlxuXHRcdFx0XHRfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fID0gJHsgSlNPTi5zdHJpbmdpZnkoX19tZXRlb3JfcnVudGltZV9jb25maWdfXykgfTtcblx0XHRcdDwvc2NyaXB0PlxuXG5cdFx0XHQ8YmFzZSBocmVmPVwiJHsgYmFzZVVybCB9XCI+XG5cblx0XHRcdCR7IGhlYWQgfVxuXHRcdDwvaGVhZD5cblx0XHQ8Ym9keT5cblx0XHRcdDxzY3JpcHQgdHlwZT1cInRleHQvamF2YXNjcmlwdFwiIHNyYz1cIiR7IGJhc2VVcmwgfWxpdmVjaGF0L2xpdmVjaGF0LmpzP19kYz0keyBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIH1cIj48L3NjcmlwdD5cblx0XHQ8L2JvZHk+XG5cdDwvaHRtbD5gO1xuXG5cdHJlcy53cml0ZShodG1sKTtcblx0cmVzLmVuZCgpO1xufSkpO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRSb2NrZXRDaGF0LnJvb21UeXBlcy5zZXRSb29tRmluZCgnbCcsIChfaWQpID0+IHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZExpdmVjaGF0QnlJZChfaWQpO1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IoZnVuY3Rpb24ocm9vbSwgdXNlcikge1xuXHRcdHJldHVybiByb29tICYmIHJvb20udCA9PT0gJ2wnICYmIHVzZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHVzZXIuX2lkLCAndmlldy1saXZlY2hhdC1yb29tcycpO1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IoZnVuY3Rpb24ocm9vbSwgdXNlciwgZXh0cmFEYXRhKSB7XG5cdFx0aWYgKCFyb29tICYmIGV4dHJhRGF0YSAmJiBleHRyYURhdGEucmlkKSB7XG5cdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZXh0cmFEYXRhLnJpZCk7XG5cdFx0fVxuXHRcdHJldHVybiByb29tICYmIHJvb20udCA9PT0gJ2wnICYmIGV4dHJhRGF0YSAmJiBleHRyYURhdGEudmlzaXRvclRva2VuICYmIHJvb20udiAmJiByb29tLnYudG9rZW4gPT09IGV4dHJhRGF0YS52aXNpdG9yVG9rZW47XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYmVmb3JlTGVhdmVSb29tJywgZnVuY3Rpb24odXNlciwgcm9vbSkge1xuXHRcdGlmIChyb29tLnQgIT09ICdsJykge1xuXHRcdFx0cmV0dXJuIHVzZXI7XG5cdFx0fVxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoVEFQaTE4bi5fXygnWW91X2NhbnRfbGVhdmVfYV9saXZlY2hhdF9yb29tX1BsZWFzZV91c2VfdGhlX2Nsb3NlX2J1dHRvbicsIHtcblx0XHRcdGxuZzogdXNlci5sYW5ndWFnZSB8fCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnbGFuZ3VhZ2UnKSB8fCAnZW4nXG5cdFx0fSkpO1xuXHR9LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdjYW50LWxlYXZlLXJvb20nKTtcbn0pO1xuIiwiLyogZ2xvYmFscyBVc2VyUHJlc2VuY2VFdmVudHMgKi9cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0VXNlclByZXNlbmNlRXZlbnRzLm9uKCdzZXRTdGF0dXMnLCAoc2Vzc2lvbiwgc3RhdHVzLCBtZXRhZGF0YSkgPT4ge1xuXHRcdGlmIChtZXRhZGF0YSAmJiBtZXRhZGF0YS52aXNpdG9yKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkudXBkYXRlVmlzaXRvclN0YXR1cyhtZXRhZGF0YS52aXNpdG9yLCBzdGF0dXMpO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlVmlzaXRvclN0YXR1cyhtZXRhZGF0YS52aXNpdG9yLCBzdGF0dXMpO1xuXHRcdH1cblx0fSk7XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFJvb21UeXBlIGZyb20gJy4uL2ltcG9ydHMvTGl2ZWNoYXRSb29tVHlwZSc7XG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuY2xhc3MgTGl2ZWNoYXRSb29tVHlwZVNlcnZlciBleHRlbmRzIExpdmVjaGF0Um9vbVR5cGUge1xuXHRnZXRNc2dTZW5kZXIoc2VuZGVySWQpIHtcblx0XHRyZXR1cm4gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZChzZW5kZXJJZCk7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyBkZXRhaWxzIHRvIHVzZSBvbiBub3RpZmljYXRpb25zXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSByb29tXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB1c2VyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBub3RpZmljYXRpb25NZXNzYWdlXG5cdCAqIEByZXR1cm4ge29iamVjdH0gTm90aWZpY2F0aW9uIGRldGFpbHNcblx0ICovXG5cdGdldE5vdGlmaWNhdGlvbkRldGFpbHMocm9vbSwgdXNlciwgbm90aWZpY2F0aW9uTWVzc2FnZSkge1xuXHRcdGNvbnN0IHRpdGxlID0gYFtsaXZlY2hhdF0gJHsgdGhpcy5yb29tTmFtZShyb29tKSB9YDtcblx0XHRjb25zdCB0ZXh0ID0gbm90aWZpY2F0aW9uTWVzc2FnZTtcblxuXHRcdHJldHVybiB7IHRpdGxlLCB0ZXh0IH07XG5cdH1cblxuXHRjYW5BY2Nlc3NVcGxvYWRlZEZpbGUoeyByY190b2tlbiwgcmNfcmlkIH0gPSB7fSkge1xuXHRcdHJldHVybiByY190b2tlbiAmJiByY19yaWQgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbihyY190b2tlbiwgcmNfcmlkKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0LnJvb21UeXBlcy5hZGQobmV3IExpdmVjaGF0Um9vbVR5cGVTZXJ2ZXIoKSk7XG4iLCIvKiBnbG9iYWxzIEhUVFAsIFN5c3RlbUxvZ2dlciAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmxldCBrbm93bGVkZ2VFbmFibGVkID0gZmFsc2U7XG5sZXQgYXBpYWlLZXkgPSAnJztcbmxldCBhcGlhaUxhbmd1YWdlID0gJ2VuJztcblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Lbm93bGVkZ2VfRW5hYmxlZCcsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0a25vd2xlZGdlRW5hYmxlZCA9IHZhbHVlO1xufSk7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0tleScsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0YXBpYWlLZXkgPSB2YWx1ZTtcbn0pO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9MYW5ndWFnZScsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0YXBpYWlMYW5ndWFnZSA9IHZhbHVlO1xufSk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmICghbWVzc2FnZSB8fCBtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRpZiAoIWtub3dsZWRnZUVuYWJsZWQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGlmICghKHR5cGVvZiByb29tLnQgIT09ICd1bmRlZmluZWQnICYmIHJvb20udCA9PT0gJ2wnICYmIHJvb20udiAmJiByb29tLnYudG9rZW4pKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXNuJ3QgYSB0b2tlbiwgaXQgd2FzIG5vdCBzZW50IGJ5IHRoZSB2aXNpdG9yLCBzbyBpZ25vcmUgaXRcblx0aWYgKCFtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IEhUVFAucG9zdCgnaHR0cHM6Ly9hcGkuYXBpLmFpL2FwaS9xdWVyeT92PTIwMTUwOTEwJywge1xuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0cXVlcnk6IG1lc3NhZ2UubXNnLFxuXHRcdFx0XHRcdGxhbmc6IGFwaWFpTGFuZ3VhZ2UsXG5cdFx0XHRcdFx0c2Vzc2lvbklkOiByb29tLl9pZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04Jyxcblx0XHRcdFx0XHQnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgYXBpYWlLZXkgfWBcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuc3RhdHVzLmNvZGUgPT09IDIwMCAmJiAhXy5pc0VtcHR5KHJlc3BvbnNlLmRhdGEucmVzdWx0LmZ1bGZpbGxtZW50LnNwZWVjaCkpIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UuaW5zZXJ0KHtcblx0XHRcdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0XHRcdG1zZzogcmVzcG9uc2UuZGF0YS5yZXN1bHQuZnVsZmlsbG1lbnQuc3BlZWNoLFxuXHRcdFx0XHRcdG9yaWc6IG1lc3NhZ2UuX2lkLFxuXHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFN5c3RlbUxvZ2dlci5lcnJvcignRXJyb3IgdXNpbmcgQXBpLmFpIC0+JywgZSk7XG5cdFx0fVxuXHR9KTtcblxuXHRyZXR1cm4gbWVzc2FnZTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2V4dGVybmFsV2ViSG9vaycpO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vLi4vc2VydmVyL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuZnVuY3Rpb24gdmFsaWRhdGVNZXNzYWdlKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmIChtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gbWVzc2FnZSB2YWxpZCBvbmx5IGlmIGl0IGlzIGEgbGl2ZWNoYXQgcm9vbVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhc24ndCBhIHRva2VuLCBpdCB3YXMgTk9UIHNlbnQgZnJvbSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmICghbWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHR5cGUgbWVhbnMgaXQgaXMgYSBzcGVjaWFsIG1lc3NhZ2UgKGxpa2UgdGhlIGNsb3NpbmcgY29tbWVudCksIHNvIHNraXBzXG5cdGlmIChtZXNzYWdlLnQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHRpZiAoIXZhbGlkYXRlTWVzc2FnZShtZXNzYWdlLCByb29tKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Y29uc3QgcGhvbmVSZWdleHAgPSBuZXcgUmVnRXhwKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9sZWFkX3Bob25lX3JlZ2V4JyksICdnJyk7XG5cdGNvbnN0IG1zZ1Bob25lcyA9IG1lc3NhZ2UubXNnLm1hdGNoKHBob25lUmVnZXhwKTtcblxuXHRjb25zdCBlbWFpbFJlZ2V4cCA9IG5ldyBSZWdFeHAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2xlYWRfZW1haWxfcmVnZXgnKSwgJ2dpJyk7XG5cdGNvbnN0IG1zZ0VtYWlscyA9IG1lc3NhZ2UubXNnLm1hdGNoKGVtYWlsUmVnZXhwKTtcblxuXHRpZiAobXNnRW1haWxzIHx8IG1zZ1Bob25lcykge1xuXHRcdExpdmVjaGF0VmlzaXRvcnMuc2F2ZUd1ZXN0RW1haWxQaG9uZUJ5SWQocm9vbS52Ll9pZCwgbXNnRW1haWxzLCBtc2dQaG9uZXMpO1xuXG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5sZWFkQ2FwdHVyZScsIHJvb20pO1xuXHR9XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdsZWFkQ2FwdHVyZScpO1xuIiwiUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHQvLyBza2lwcyB0aGlzIGNhbGxiYWNrIGlmIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWRcblx0aWYgKCFtZXNzYWdlIHx8IG1lc3NhZ2UuZWRpdGVkQXQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGNoZWNrIGlmIHJvb20gaXMgeWV0IGF3YWl0aW5nIGZvciByZXNwb25zZVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLndhaXRpbmdSZXNwb25zZSkpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHRva2VuLCBpdCB3YXMgc2VudCBieSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0UmVzcG9uc2VCeVJvb21JZChyb29tLl9pZCwge1xuXHRcdFx0dXNlcjoge1xuXHRcdFx0XHRfaWQ6IG1lc3NhZ2UudS5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBtZXNzYWdlLnUudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHRyZXNwb25zZURhdGU6IG5vdyxcblx0XHRcdHJlc3BvbnNlVGltZTogKG5vdy5nZXRUaW1lKCkgLSByb29tLnRzKSAvIDEwMDBcblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdtYXJrUm9vbVJlc3BvbmRlZCcpO1xuIiwiUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5vZmZsaW5lTWVzc2FnZScsIChkYXRhKSA9PiB7XG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnKSkge1xuXHRcdHJldHVybiBkYXRhO1xuXHR9XG5cblx0Y29uc3QgcG9zdERhdGEgPSB7XG5cdFx0dHlwZTogJ0xpdmVjaGF0T2ZmbGluZU1lc3NhZ2UnLFxuXHRcdHNlbnRBdDogbmV3IERhdGUoKSxcblx0XHR2aXNpdG9yOiB7XG5cdFx0XHRuYW1lOiBkYXRhLm5hbWUsXG5cdFx0XHRlbWFpbDogZGF0YS5lbWFpbFxuXHRcdH0sXG5cdFx0bWVzc2FnZTogZGF0YS5tZXNzYWdlXG5cdH07XG5cblx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kUmVxdWVzdChwb3N0RGF0YSk7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1zZW5kLWVtYWlsLW9mZmxpbmUtbWVzc2FnZScpO1xuIiwiZnVuY3Rpb24gc2VuZFRvUkRTdGF0aW9uKHJvb20pIHtcblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUkRTdGF0aW9uX1Rva2VuJykpIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdGNvbnN0IGxpdmVjaGF0RGF0YSA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TGl2ZWNoYXRSb29tR3Vlc3RJbmZvKHJvb20pO1xuXG5cdGlmICghbGl2ZWNoYXREYXRhLnZpc2l0b3IuZW1haWwpIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdH0sXG5cdFx0ZGF0YToge1xuXHRcdFx0dG9rZW5fcmRzdGF0aW9uOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUkRTdGF0aW9uX1Rva2VuJyksXG5cdFx0XHRpZGVudGlmaWNhZG9yOiAncm9ja2V0Y2hhdC1saXZlY2hhdCcsXG5cdFx0XHRjbGllbnRfaWQ6IGxpdmVjaGF0RGF0YS52aXNpdG9yLl9pZCxcblx0XHRcdGVtYWlsOiBsaXZlY2hhdERhdGEudmlzaXRvci5lbWFpbFxuXHRcdH1cblx0fTtcblxuXHRvcHRpb25zLmRhdGEubm9tZSA9IGxpdmVjaGF0RGF0YS52aXNpdG9yLm5hbWUgfHwgbGl2ZWNoYXREYXRhLnZpc2l0b3IudXNlcm5hbWU7XG5cblx0aWYgKGxpdmVjaGF0RGF0YS52aXNpdG9yLnBob25lKSB7XG5cdFx0b3B0aW9ucy5kYXRhLnRlbGVmb25lID0gbGl2ZWNoYXREYXRhLnZpc2l0b3IucGhvbmU7XG5cdH1cblxuXHRpZiAobGl2ZWNoYXREYXRhLnRhZ3MpIHtcblx0XHRvcHRpb25zLmRhdGEudGFncyA9IGxpdmVjaGF0RGF0YS50YWdzO1xuXHR9XG5cblx0T2JqZWN0LmtleXMobGl2ZWNoYXREYXRhLmN1c3RvbUZpZWxkcyB8fCB7fSkuZm9yRWFjaChmaWVsZCA9PiB7XG5cdFx0b3B0aW9ucy5kYXRhW2ZpZWxkXSA9IGxpdmVjaGF0RGF0YS5jdXN0b21GaWVsZHNbZmllbGRdO1xuXHR9KTtcblxuXHRPYmplY3Qua2V5cyhsaXZlY2hhdERhdGEudmlzaXRvci5jdXN0b21GaWVsZHMgfHwge30pLmZvckVhY2goZmllbGQgPT4ge1xuXHRcdG9wdGlvbnMuZGF0YVtmaWVsZF0gPSBsaXZlY2hhdERhdGEudmlzaXRvci5jdXN0b21GaWVsZHNbZmllbGRdO1xuXHR9KTtcblxuXHR0cnkge1xuXHRcdEhUVFAuY2FsbCgnUE9TVCcsICdodHRwczovL3d3dy5yZHN0YXRpb24uY29tLmJyL2FwaS8xLjMvY29udmVyc2lvbnMnLCBvcHRpb25zKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbGVhZCB0byBSRCBTdGF0aW9uIC0+JywgZSk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbTtcbn1cblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5jbG9zZVJvb20nLCBzZW5kVG9SRFN0YXRpb24sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXJkLXN0YXRpb24tY2xvc2Utcm9vbScpO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2xpdmVjaGF0LnNhdmVJbmZvJywgc2VuZFRvUkRTdGF0aW9uLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1yZC1zdGF0aW9uLXNhdmUtaW5mbycpO1xuIiwiY29uc3QgbXNnTmF2VHlwZSA9ICdsaXZlY2hhdF9uYXZpZ2F0aW9uX2hpc3RvcnknO1xuXG5jb25zdCBzZW5kTWVzc2FnZVR5cGUgPSAobXNnVHlwZSkgPT4ge1xuXHRjb25zdCBzZW5kTmF2SGlzdG9yeSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9WaXNpdG9yX25hdmlnYXRpb25fYXNfYV9tZXNzYWdlJykgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NlbmRfdmlzaXRvcl9uYXZpZ2F0aW9uX2hpc3RvcnlfbGl2ZWNoYXRfd2ViaG9va19yZXF1ZXN0Jyk7XG5cblx0cmV0dXJuIHNlbmROYXZIaXN0b3J5ICYmIG1zZ1R5cGUgPT09IG1zZ05hdlR5cGU7XG59O1xuXG5mdW5jdGlvbiBzZW5kVG9DUk0odHlwZSwgcm9vbSwgaW5jbHVkZU1lc3NhZ2VzID0gdHJ1ZSkge1xuXHRjb25zdCBwb3N0RGF0YSA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TGl2ZWNoYXRSb29tR3Vlc3RJbmZvKHJvb20pO1xuXG5cdHBvc3REYXRhLnR5cGUgPSB0eXBlO1xuXG5cdHBvc3REYXRhLm1lc3NhZ2VzID0gW107XG5cblx0bGV0IG1lc3NhZ2VzO1xuXHRpZiAodHlwZW9mIGluY2x1ZGVNZXNzYWdlcyA9PT0gJ2Jvb2xlYW4nICYmIGluY2x1ZGVNZXNzYWdlcykge1xuXHRcdG1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZFZpc2libGVCeVJvb21JZChyb29tLl9pZCwgeyBzb3J0OiB7IHRzOiAxIH0gfSk7XG5cdH0gZWxzZSBpZiAoaW5jbHVkZU1lc3NhZ2VzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRtZXNzYWdlcyA9IGluY2x1ZGVNZXNzYWdlcztcblx0fVxuXG5cdGlmIChtZXNzYWdlcykge1xuXHRcdG1lc3NhZ2VzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcblx0XHRcdGlmIChtZXNzYWdlLnQgJiYgIXNlbmRNZXNzYWdlVHlwZShtZXNzYWdlLnQpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG1zZyA9IHtcblx0XHRcdFx0X2lkOiBtZXNzYWdlLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IG1lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0bXNnOiBtZXNzYWdlLm1zZyxcblx0XHRcdFx0dHM6IG1lc3NhZ2UudHMsXG5cdFx0XHRcdGVkaXRlZEF0OiBtZXNzYWdlLmVkaXRlZEF0XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAobWVzc2FnZS51LnVzZXJuYW1lICE9PSBwb3N0RGF0YS52aXNpdG9yLnVzZXJuYW1lKSB7XG5cdFx0XHRcdG1zZy5hZ2VudElkID0gbWVzc2FnZS51Ll9pZDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG1lc3NhZ2UudCA9PT0gbXNnTmF2VHlwZSkge1xuXHRcdFx0XHRtc2cubmF2aWdhdGlvbiA9IG1lc3NhZ2UubmF2aWdhdGlvbjtcblx0XHRcdH1cblxuXHRcdFx0cG9zdERhdGEubWVzc2FnZXMucHVzaChtc2cpO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29uc3QgcmVzcG9uc2UgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRSZXF1ZXN0KHBvc3REYXRhKTtcblxuXHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLmRhdGEpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zYXZlQ1JNRGF0YUJ5Um9vbUlkKHJvb20uX2lkLCByZXNwb25zZS5kYXRhLmRhdGEpO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQuY2xvc2VSb29tJywgKHJvb20pID0+IHtcblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZScpKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRyZXR1cm4gc2VuZFRvQ1JNKCdMaXZlY2hhdFNlc3Npb24nLCByb29tKTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXNlbmQtY3JtLWNsb3NlLXJvb20nKTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5zYXZlSW5mbycsIChyb29tKSA9PiB7XG5cdC8vIERvIG5vdCBzZW5kIHRvIENSTSBpZiB0aGUgY2hhdCBpcyBzdGlsbCBvcGVuXG5cdGlmIChyb29tLm9wZW4pIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdHJldHVybiBzZW5kVG9DUk0oJ0xpdmVjaGF0RWRpdCcsIHJvb20pO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1jcm0tc2F2ZS1pbmZvJyk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gb25seSBjYWxsIHdlYmhvb2sgaWYgaXQgaXMgYSBsaXZlY2hhdCByb29tXG5cdGlmIChyb29tLnQgIT09ICdsJyB8fCByb29tLnYgPT0gbnVsbCB8fCByb29tLnYudG9rZW4gPT0gbnVsbCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzIGEgdG9rZW4sIGl0IHdhcyBzZW50IGZyb20gdGhlIHZpc2l0b3Jcblx0Ly8gaWYgbm90LCBpdCB3YXMgc2VudCBmcm9tIHRoZSBhZ2VudFxuXHRpZiAobWVzc2FnZS50b2tlbikge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJykpIHtcblx0XHRcdHJldHVybiBtZXNzYWdlO1xuXHRcdH1cblx0fSBlbHNlIGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fYWdlbnRfbWVzc2FnZScpKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblx0Ly8gaWYgdGhlIG1lc3NhZ2UgaGFzIGEgdHlwZSBtZWFucyBpdCBpcyBhIHNwZWNpYWwgbWVzc2FnZSAobGlrZSB0aGUgY2xvc2luZyBjb21tZW50KSwgc28gc2tpcHNcblx0Ly8gdW5sZXNzIHRoZSBzZXR0aW5ncyB0aGF0IGhhbmRsZSB3aXRoIHZpc2l0b3IgbmF2aWdhdGlvbiBoaXN0b3J5IGFyZSBlbmFibGVkXG5cdGlmIChtZXNzYWdlLnQgJiYgIXNlbmRNZXNzYWdlVHlwZShtZXNzYWdlLnQpKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRzZW5kVG9DUk0oJ01lc3NhZ2UnLCByb29tLCBbbWVzc2FnZV0pO1xuXHRyZXR1cm4gbWVzc2FnZTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXNlbmQtY3JtLW1lc3NhZ2UnKTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5sZWFkQ2FwdHVyZScsIChyb29tKSA9PiB7XG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2FwdHVyZScpKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblx0cmV0dXJuIHNlbmRUb0NSTSgnTGVhZENhcHR1cmUnLCByb29tLCBmYWxzZSk7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1zZW5kLWNybS1sZWFkLWNhcHR1cmUnKTtcbiIsImltcG9ydCBPbW5pQ2hhbm5lbCBmcm9tICcuLi9saWIvT21uaUNoYW5uZWwnO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcpIHx8ICFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBvbmx5IHNlbmQgdGhlIHNtcyBieSBTTVMgaWYgaXQgaXMgYSBsaXZlY2hhdCByb29tIHdpdGggU01TIHNldCB0byB0cnVlXG5cdGlmICghKHR5cGVvZiByb29tLnQgIT09ICd1bmRlZmluZWQnICYmIHJvb20udCA9PT0gJ2wnICYmIHJvb20uZmFjZWJvb2sgJiYgcm9vbS52ICYmIHJvb20udi50b2tlbikpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHRva2VuLCBpdCB3YXMgc2VudCBmcm9tIHRoZSB2aXNpdG9yLCBzbyBpZ25vcmUgaXRcblx0aWYgKG1lc3NhZ2UudG9rZW4pIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHR5cGUgbWVhbnMgaXQgaXMgYSBzcGVjaWFsIG1lc3NhZ2UgKGxpa2UgdGhlIGNsb3NpbmcgY29tbWVudCksIHNvIHNraXBzXG5cdGlmIChtZXNzYWdlLnQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdE9tbmlDaGFubmVsLnJlcGx5KHtcblx0XHRwYWdlOiByb29tLmZhY2Vib29rLnBhZ2UuaWQsXG5cdFx0dG9rZW46IHJvb20udi50b2tlbixcblx0XHR0ZXh0OiBtZXNzYWdlLm1zZ1xuXHR9KTtcblxuXHRyZXR1cm4gbWVzc2FnZTtcblxufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnc2VuZE1lc3NhZ2VUb0ZhY2Vib29rJyk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDphZGRBZ2VudCcodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmFkZEFnZW50KHVzZXJuYW1lKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDphZGRNYW5hZ2VyJyh1c2VybmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDphZGRNYW5hZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5hZGRNYW5hZ2VyKHVzZXJuYW1lKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpjaGFuZ2VMaXZlY2hhdFN0YXR1cycoKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjaGFuZ2VMaXZlY2hhdFN0YXR1cycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRjb25zdCBuZXdTdGF0dXMgPSB1c2VyLnN0YXR1c0xpdmVjaGF0ID09PSAnYXZhaWxhYmxlJyA/ICdub3QtYXZhaWxhYmxlJyA6ICdhdmFpbGFibGUnO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldExpdmVjaGF0U3RhdHVzKHVzZXIuX2lkLCBuZXdTdGF0dXMpO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Y2xvc2VCeVZpc2l0b3InKHsgcm9vbUlkLCB0b2tlbiB9KSB7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVPcGVuQnlWaXNpdG9yVG9rZW4odG9rZW4sIHJvb21JZCk7XG5cblx0XHRpZiAoIXJvb20gfHwgIXJvb20ub3Blbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuKTtcblxuXHRcdGNvbnN0IGxhbmd1YWdlID0gKHZpc2l0b3IgJiYgdmlzaXRvci5sYW5ndWFnZSkgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJztcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlUm9vbSh7XG5cdFx0XHR2aXNpdG9yLFxuXHRcdFx0cm9vbSxcblx0XHRcdGNvbW1lbnQ6IFRBUGkxOG4uX18oJ0Nsb3NlZF9ieV92aXNpdG9yJywgeyBsbmc6IGxhbmd1YWdlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Y2xvc2VSb29tJyhyb29tSWQsIGNvbW1lbnQpIHtcblx0XHRjb25zdCB1c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0aWYgKCF1c2VySWQgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VySWQsICdjbG9zZS1saXZlY2hhdC1yb29tJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZVJvb20nIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyb29tLW5vdC1mb3VuZCcsICdSb29tIG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2xvc2VSb29tJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb21JZCwgdXNlci5faWQsIHsgX2lkOiAxIH0pO1xuXHRcdGlmICghc3Vic2NyaXB0aW9uICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlcklkLCAnY2xvc2Utb3RoZXJzLWxpdmVjaGF0LXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmNsb3NlUm9vbScgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuY2xvc2VSb29tKHtcblx0XHRcdHVzZXIsXG5cdFx0XHRyb29tLFxuXHRcdFx0Y29tbWVudFxuXHRcdH0pO1xuXHR9XG59KTtcbiIsImltcG9ydCBPbW5pQ2hhbm5lbCBmcm9tICcuLi9saWIvT21uaUNoYW5uZWwnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpmYWNlYm9vaycob3B0aW9ucykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDphZGRBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdHN3aXRjaCAob3B0aW9ucy5hY3Rpb24pIHtcblx0XHRcdFx0Y2FzZSAnaW5pdGlhbFN0YXRlJzoge1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRlbmFibGVkOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcpLFxuXHRcdFx0XHRcdFx0aGFzVG9rZW46ICEhUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdlbmFibGUnOiB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gT21uaUNoYW5uZWwuZW5hYmxlKCk7XG5cblx0XHRcdFx0XHRpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnLCB0cnVlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ2Rpc2FibGUnOiB7XG5cdFx0XHRcdFx0T21uaUNoYW5uZWwuZGlzYWJsZSgpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcsIGZhbHNlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ2xpc3QtcGFnZXMnOiB7XG5cdFx0XHRcdFx0cmV0dXJuIE9tbmlDaGFubmVsLmxpc3RQYWdlcygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnc3Vic2NyaWJlJzoge1xuXHRcdFx0XHRcdHJldHVybiBPbW5pQ2hhbm5lbC5zdWJzY3JpYmUob3B0aW9ucy5wYWdlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ3Vuc3Vic2NyaWJlJzoge1xuXHRcdFx0XHRcdHJldHVybiBPbW5pQ2hhbm5lbC51bnN1YnNjcmliZShvcHRpb25zLnBhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUucmVzcG9uc2UgJiYgZS5yZXNwb25zZS5kYXRhICYmIGUucmVzcG9uc2UuZGF0YS5lcnJvcikge1xuXHRcdFx0XHRpZiAoZS5yZXNwb25zZS5kYXRhLmVycm9yLmVycm9yKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlLnJlc3BvbnNlLmRhdGEuZXJyb3IuZXJyb3IsIGUucmVzcG9uc2UuZGF0YS5lcnJvci5tZXNzYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZS5yZXNwb25zZS5kYXRhLmVycm9yLnJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW50ZWdyYXRpb24tZXJyb3InLCBlLnJlc3BvbnNlLmRhdGEuZXJyb3IucmVzcG9uc2UuZXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGUucmVzcG9uc2UuZGF0YS5lcnJvci5tZXNzYWdlKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW50ZWdyYXRpb24tZXJyb3InLCBlLnJlc3BvbnNlLmRhdGEuZXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNvbnRhY3Rpbmcgb21uaS5yb2NrZXQuY2hhdDonLCBlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludGVncmF0aW9uLWVycm9yJywgZS5lcnJvcik7XG5cdFx0fVxuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmdldEN1c3RvbUZpZWxkcycoKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZCgpLmZldGNoKCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpnZXRBZ2VudERhdGEnKHsgcm9vbUlkLCB0b2tlbiB9KSB7XG5cdFx0Y2hlY2socm9vbUlkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb21JZCk7XG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4pO1xuXG5cdFx0Ly8gYWxsb3cgdG8gb25seSB1c2VyIHRvIHNlbmQgdHJhbnNjcmlwdHMgZnJvbSB0aGVpciBvd24gY2hhdHNcblx0XHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnbCcgfHwgIXJvb20udiB8fCByb29tLnYudG9rZW4gIT09IHZpc2l0b3IudG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nKTtcblx0XHR9XG5cblx0XHRpZiAoIXJvb20uc2VydmVkQnkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKHJvb20uc2VydmVkQnkuX2lkKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpnZXRJbml0aWFsRGF0YScodmlzaXRvclRva2VuKSB7XG5cdFx0Y29uc3QgaW5mbyA9IHtcblx0XHRcdGVuYWJsZWQ6IG51bGwsXG5cdFx0XHR0aXRsZTogbnVsbCxcblx0XHRcdGNvbG9yOiBudWxsLFxuXHRcdFx0cmVnaXN0cmF0aW9uRm9ybTogbnVsbCxcblx0XHRcdHJvb206IG51bGwsXG5cdFx0XHR2aXNpdG9yOiBudWxsLFxuXHRcdFx0dHJpZ2dlcnM6IFtdLFxuXHRcdFx0ZGVwYXJ0bWVudHM6IFtdLFxuXHRcdFx0YWxsb3dTd2l0Y2hpbmdEZXBhcnRtZW50czogbnVsbCxcblx0XHRcdG9ubGluZTogdHJ1ZSxcblx0XHRcdG9mZmxpbmVDb2xvcjogbnVsbCxcblx0XHRcdG9mZmxpbmVNZXNzYWdlOiBudWxsLFxuXHRcdFx0b2ZmbGluZVN1Y2Nlc3NNZXNzYWdlOiBudWxsLFxuXHRcdFx0b2ZmbGluZVVuYXZhaWxhYmxlTWVzc2FnZTogbnVsbCxcblx0XHRcdGRpc3BsYXlPZmZsaW5lRm9ybTogbnVsbCxcblx0XHRcdHZpZGVvQ2FsbDogbnVsbCxcblx0XHRcdGZpbGVVcGxvYWQ6IG51bGwsXG5cdFx0XHRjb252ZXJzYXRpb25GaW5pc2hlZE1lc3NhZ2U6IG51bGwsXG5cdFx0XHRuYW1lRmllbGRSZWdpc3RyYXRpb25Gb3JtOiBudWxsLFxuXHRcdFx0ZW1haWxGaWVsZFJlZ2lzdHJhdGlvbkZvcm06IG51bGxcblx0XHR9O1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvclRva2VuLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dDogMSxcblx0XHRcdFx0Y2w6IDEsXG5cdFx0XHRcdHU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lczogMSxcblx0XHRcdFx0djogMSxcblx0XHRcdFx0c2VydmVkQnk6IDFcblx0XHRcdH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0aWYgKHJvb20gJiYgcm9vbS5sZW5ndGggPiAwKSB7XG5cdFx0XHRpbmZvLnJvb20gPSByb29tWzBdO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxLFxuXHRcdFx0XHR2aXNpdG9yRW1haWxzOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAocm9vbSkge1xuXHRcdFx0aW5mby52aXNpdG9yID0gdmlzaXRvcjtcblx0XHR9XG5cblx0XHRjb25zdCBpbml0U2V0dGluZ3MgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldEluaXRTZXR0aW5ncygpO1xuXG5cdFx0aW5mby50aXRsZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF90aXRsZTtcblx0XHRpbmZvLmNvbG9yID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3RpdGxlX2NvbG9yO1xuXHRcdGluZm8uZW5hYmxlZCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9lbmFibGVkO1xuXHRcdGluZm8ucmVnaXN0cmF0aW9uRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybTtcblx0XHRpbmZvLm9mZmxpbmVUaXRsZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX3RpdGxlO1xuXHRcdGluZm8ub2ZmbGluZUNvbG9yID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3I7XG5cdFx0aW5mby5vZmZsaW5lTWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2U7XG5cdFx0aW5mby5vZmZsaW5lU3VjY2Vzc01lc3NhZ2UgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2U7XG5cdFx0aW5mby5vZmZsaW5lVW5hdmFpbGFibGVNZXNzYWdlID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZTtcblx0XHRpbmZvLmRpc3BsYXlPZmZsaW5lRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybTtcblx0XHRpbmZvLmxhbmd1YWdlID0gaW5pdFNldHRpbmdzLkxhbmd1YWdlO1xuXHRcdGluZm8udmlkZW9DYWxsID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3ZpZGVvY2FsbF9lbmFibGVkID09PSB0cnVlICYmIGluaXRTZXR0aW5ncy5KaXRzaV9FbmFibGVkID09PSB0cnVlO1xuXHRcdGluZm8uZmlsZVVwbG9hZCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9maWxldXBsb2FkX2VuYWJsZWQgJiYgaW5pdFNldHRpbmdzLkZpbGVVcGxvYWRfRW5hYmxlZDtcblx0XHRpbmZvLnRyYW5zY3JpcHQgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQ7XG5cdFx0aW5mby50cmFuc2NyaXB0TWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF90cmFuc2NyaXB0X21lc3NhZ2U7XG5cdFx0aW5mby5jb252ZXJzYXRpb25GaW5pc2hlZE1lc3NhZ2UgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfY29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2U7XG5cdFx0aW5mby5uYW1lRmllbGRSZWdpc3RyYXRpb25Gb3JtID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X25hbWVfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm07XG5cdFx0aW5mby5lbWFpbEZpZWxkUmVnaXN0cmF0aW9uRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9lbWFpbF9maWVsZF9yZWdpc3RyYXRpb25fZm9ybTtcblxuXHRcdGluZm8uYWdlbnREYXRhID0gcm9vbSAmJiByb29tWzBdICYmIHJvb21bMF0uc2VydmVkQnkgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKHJvb21bMF0uc2VydmVkQnkuX2lkKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5maW5kRW5hYmxlZCgpLmZvckVhY2goKHRyaWdnZXIpID0+IHtcblx0XHRcdGluZm8udHJpZ2dlcnMucHVzaChfLnBpY2sodHJpZ2dlciwgJ19pZCcsICdhY3Rpb25zJywgJ2NvbmRpdGlvbnMnKSk7XG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZEVuYWJsZWRXaXRoQWdlbnRzKCkuZm9yRWFjaCgoZGVwYXJ0bWVudCkgPT4ge1xuXHRcdFx0aW5mby5kZXBhcnRtZW50cy5wdXNoKGRlcGFydG1lbnQpO1xuXHRcdH0pO1xuXHRcdGluZm8uYWxsb3dTd2l0Y2hpbmdEZXBhcnRtZW50cyA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9hbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHM7XG5cblx0XHRpbmZvLm9ubGluZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKS5jb3VudCgpID4gMDtcblx0XHRyZXR1cm4gaW5mbztcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpnZXROZXh0QWdlbnQnKHsgdG9rZW4sIGRlcGFydG1lbnQgfSkge1xuXHRcdGNoZWNrKHRva2VuLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odG9rZW4pLmZldGNoKCk7XG5cblx0XHRpZiAocm9vbSAmJiByb29tLmxlbmd0aCA+IDApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIWRlcGFydG1lbnQpIHtcblx0XHRcdGNvbnN0IHJlcXVpcmVEZXBhcm1lbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldFJlcXVpcmVkRGVwYXJ0bWVudCgpO1xuXHRcdFx0aWYgKHJlcXVpcmVEZXBhcm1lbnQpIHtcblx0XHRcdFx0ZGVwYXJ0bWVudCA9IHJlcXVpcmVEZXBhcm1lbnQuX2lkO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IGFnZW50ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXROZXh0QWdlbnQoZGVwYXJ0bWVudCk7XG5cdFx0aWYgKCFhZ2VudCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8oYWdlbnQuYWdlbnRJZCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpsb2FkSGlzdG9yeScoeyB0b2tlbiwgcmlkLCBlbmQsIGxpbWl0ID0gMjAsIGxzfSkge1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghdmlzaXRvcikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LmxvYWRNZXNzYWdlSGlzdG9yeSh7IHVzZXJJZDogdmlzaXRvci5faWQsIHJpZCwgZW5kLCBsaW1pdCwgbHMgfSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpsb2dpbkJ5VG9rZW4nKHRva2VuKSB7XG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCF2aXNpdG9yKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF9pZDogdmlzaXRvci5faWRcblx0XHR9O1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnBhZ2VWaXNpdGVkJyh0b2tlbiwgcm9vbSwgcGFnZUluZm8pIHtcblx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVQYWdlSGlzdG9yeSh0b2tlbiwgcm9vbSwgcGFnZUluZm8pO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVnaXN0ZXJHdWVzdCcoeyB0b2tlbiwgbmFtZSwgZW1haWwsIGRlcGFydG1lbnQgfSA9IHt9KSB7XG5cdFx0Y29uc3QgdXNlcklkID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZWdpc3Rlckd1ZXN0LmNhbGwodGhpcywge1xuXHRcdFx0dG9rZW4sXG5cdFx0XHRuYW1lLFxuXHRcdFx0ZW1haWwsXG5cdFx0XHRkZXBhcnRtZW50XG5cdFx0fSk7XG5cblx0XHQvLyB1cGRhdGUgdmlzaXRlZCBwYWdlIGhpc3RvcnkgdG8gbm90IGV4cGlyZVxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmtlZXBIaXN0b3J5Rm9yVG9rZW4odG9rZW4pO1xuXG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHR0b2tlbjogMSxcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRcdHZpc2l0b3JFbWFpbHM6IDFcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vSWYgaXQncyB1cGRhdGluZyBhbiBleGlzdGluZyB2aXNpdG9yLCBpdCBtdXN0IGFsc28gdXBkYXRlIHRoZSByb29tSW5mb1xuXHRcdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odG9rZW4pO1xuXHRcdGN1cnNvci5mb3JFYWNoKChyb29tKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVSb29tSW5mbyhyb29tLCB2aXNpdG9yKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR1c2VySWQsXG5cdFx0XHR2aXNpdG9yXG5cdFx0fTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVBZ2VudCcodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZUFnZW50KHVzZXJuYW1lKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVDdXN0b21GaWVsZCcoX2lkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayhfaWQsIFN0cmluZyk7XG5cblx0XHRjb25zdCBjdXN0b21GaWVsZCA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZE9uZUJ5SWQoX2lkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghY3VzdG9tRmllbGQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY3VzdG9tLWZpZWxkJywgJ0N1c3RvbSBmaWVsZCBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUN1c3RvbUZpZWxkJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5yZW1vdmVCeUlkKF9pZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlRGVwYXJ0bWVudCcoX2lkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZURlcGFydG1lbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZURlcGFydG1lbnQoX2lkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVNYW5hZ2VyJyh1c2VybmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVNYW5hZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVNYW5hZ2VyKHVzZXJuYW1lKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZW1vdmVUcmlnZ2VyJyh0cmlnZ2VySWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlVHJpZ2dlcicgfSk7XG5cdFx0fVxuXG5cdFx0Y2hlY2sodHJpZ2dlcklkLCBTdHJpbmcpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5yZW1vdmVCeUlkKHRyaWdnZXJJZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlUm9vbScocmlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdyZW1vdmUtY2xvc2VkLWxpdmVjaGF0LXJvb21zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVSb29tJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlUm9vbSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyb29tLnQgIT09ICdsJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItdGhpcy1pcy1ub3QtYS1saXZlY2hhdC1yb29tJywgJ1RoaXMgaXMgbm90IGEgTGl2ZWNoYXQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlUm9vbSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyb29tLm9wZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20taXMtbm90LWNsb3NlZCcsICdSb29tIGlzIG5vdCBjbG9zZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZVJvb20nXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5yZW1vdmVCeVJvb21JZChyaWQpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMucmVtb3ZlQnlSb29tSWQocmlkKTtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucmVtb3ZlQnlJZChyaWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVBcHBlYXJhbmNlJyhzZXR0aW5ncykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlQXBwZWFyYW5jZScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmFsaWRTZXR0aW5ncyA9IFtcblx0XHRcdCdMaXZlY2hhdF90aXRsZScsXG5cdFx0XHQnTGl2ZWNoYXRfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnLFxuXHRcdFx0J0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZW1haWwnLFxuXHRcdFx0J0xpdmVjaGF0X2NvbnZlcnNhdGlvbl9maW5pc2hlZF9tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfbmFtZV9maWVsZF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfZW1haWxfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0nXG5cdFx0XTtcblxuXHRcdGNvbnN0IHZhbGlkID0gc2V0dGluZ3MuZXZlcnkoKHNldHRpbmcpID0+IHtcblx0XHRcdHJldHVybiB2YWxpZFNldHRpbmdzLmluZGV4T2Yoc2V0dGluZy5faWQpICE9PSAtMTtcblx0XHR9KTtcblxuXHRcdGlmICghdmFsaWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc2V0dGluZycpO1xuXHRcdH1cblxuXHRcdHNldHRpbmdzLmZvckVhY2goKHNldHRpbmcpID0+IHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZChzZXR0aW5nLl9pZCwgc2V0dGluZy52YWx1ZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm47XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCIsIFwiTWF0Y2guT3B0aW9uYWxcIl19XSAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlQ3VzdG9tRmllbGQnKF9pZCwgY3VzdG9tRmllbGREYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y2hlY2soX2lkLCBTdHJpbmcpO1xuXHRcdH1cblxuXHRcdGNoZWNrKGN1c3RvbUZpZWxkRGF0YSwgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHsgZmllbGQ6IFN0cmluZywgbGFiZWw6IFN0cmluZywgc2NvcGU6IFN0cmluZywgdmlzaWJpbGl0eTogU3RyaW5nIH0pKTtcblxuXHRcdGlmICghL15bMC05YS16QS1aLV9dKyQvLnRlc3QoY3VzdG9tRmllbGREYXRhLmZpZWxkKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jdXN0b20tZmllbGQtbm1hZScsICdJbnZhbGlkIGN1c3RvbSBmaWVsZCBuYW1lLiBVc2Ugb25seSBsZXR0ZXJzLCBudW1iZXJzLCBoeXBoZW5zIGFuZCB1bmRlcnNjb3Jlcy4nLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y29uc3QgY3VzdG9tRmllbGQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmRPbmVCeUlkKF9pZCk7XG5cdFx0XHRpZiAoIWN1c3RvbUZpZWxkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY3VzdG9tLWZpZWxkJywgJ0N1c3RvbSBGaWVsZCBOb3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuY3JlYXRlT3JVcGRhdGVDdXN0b21GaWVsZChfaWQsIGN1c3RvbUZpZWxkRGF0YS5maWVsZCwgY3VzdG9tRmllbGREYXRhLmxhYmVsLCBjdXN0b21GaWVsZERhdGEuc2NvcGUsIGN1c3RvbUZpZWxkRGF0YS52aXNpYmlsaXR5KTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cyk7XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCIsIFwiTWF0Y2guT3B0aW9uYWxcIl19XSAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlSW5mbycoZ3Vlc3REYXRhLCByb29tRGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayhndWVzdERhdGEsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRfaWQ6IFN0cmluZyxcblx0XHRcdG5hbWU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRlbWFpbDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdHBob25lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSkpO1xuXG5cdFx0Y2hlY2socm9vbURhdGEsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRfaWQ6IFN0cmluZyxcblx0XHRcdHRvcGljOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0dGFnczogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tRGF0YS5faWQsIHtmaWVsZHM6IHt0OiAxLCBzZXJ2ZWRCeTogMX19KTtcblxuXHRcdGlmIChyb29tID09IG51bGwgfHwgcm9vbS50ICE9PSAnbCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoKCFyb29tLnNlcnZlZEJ5IHx8IHJvb20uc2VydmVkQnkuX2lkICE9PSBNZXRlb3IudXNlcklkKCkpICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnc2F2ZS1vdGhlcnMtbGl2ZWNoYXQtcm9vbS1pbmZvJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlSW5mbycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmV0ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlR3Vlc3QoZ3Vlc3REYXRhKSAmJiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVSb29tSW5mbyhyb29tRGF0YSwgZ3Vlc3REYXRhKTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNhdmVJbmZvJywgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbURhdGEuX2lkKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9XG59KTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZUludGVncmF0aW9uJyh2YWx1ZXMpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va1VybCddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rVXJsJywgcy50cmltKHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va1VybCddKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3NlY3JldF90b2tlbiddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCBzLnRyaW0odmFsdWVzWydMaXZlY2hhdF9zZWNyZXRfdG9rZW4nXSkpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCAhIXZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZSddKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZyddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnXSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fdmlzaXRvcl9tZXNzYWdlJ10pO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZCgnTGl2ZWNoYXRfd2ViaG9va19vbl9hZ2VudF9tZXNzYWdlJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fYWdlbnRfbWVzc2FnZSddKTtcblx0XHR9XG5cblx0XHRyZXR1cm47XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCJdfV0gKi9cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlU3VydmV5RmVlZGJhY2snKHZpc2l0b3JUb2tlbiwgdmlzaXRvclJvb20sIGZvcm1EYXRhKSB7XG5cdFx0Y2hlY2sodmlzaXRvclRva2VuLCBTdHJpbmcpO1xuXHRcdGNoZWNrKHZpc2l0b3JSb29tLCBTdHJpbmcpO1xuXHRcdGNoZWNrKGZvcm1EYXRhLCBbTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHsgbmFtZTogU3RyaW5nLCB2YWx1ZTogU3RyaW5nIH0pXSk7XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih2aXNpdG9yVG9rZW4pO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZCh2aXNpdG9yUm9vbSk7XG5cblx0XHRpZiAodmlzaXRvciAhPT0gdW5kZWZpbmVkICYmIHJvb20gIT09IHVuZGVmaW5lZCAmJiByb29tLnYgIT09IHVuZGVmaW5lZCAmJiByb29tLnYudG9rZW4gPT09IHZpc2l0b3IudG9rZW4pIHtcblx0XHRcdGNvbnN0IHVwZGF0ZURhdGEgPSB7fTtcblx0XHRcdGZvciAoY29uc3QgaXRlbSBvZiBmb3JtRGF0YSkge1xuXHRcdFx0XHRpZiAoXy5jb250YWlucyhbJ3NhdGlzZmFjdGlvbicsICdhZ2VudEtub3dsZWRnZScsICdhZ2VudFJlc3Bvc2l2ZW5lc3MnLCAnYWdlbnRGcmllbmRsaW5lc3MnXSwgaXRlbS5uYW1lKSAmJiBfLmNvbnRhaW5zKFsnMScsICcyJywgJzMnLCAnNCcsICc1J10sIGl0ZW0udmFsdWUpKSB7XG5cdFx0XHRcdFx0dXBkYXRlRGF0YVtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcblx0XHRcdFx0fSBlbHNlIGlmIChpdGVtLm5hbWUgPT09ICdhZGRpdGlvbmFsRmVlZGJhY2snKSB7XG5cdFx0XHRcdFx0dXBkYXRlRGF0YVtpdGVtLm5hbWVdID0gaXRlbS52YWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKCFfLmlzRW1wdHkodXBkYXRlRGF0YSkpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZVN1cnZleUZlZWRiYWNrQnlJZChyb29tLl9pZCwgdXBkYXRlRGF0YSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVUcmlnZ2VyJyh0cmlnZ2VyKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVUcmlnZ2VyJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayh0cmlnZ2VyLCB7XG5cdFx0XHRfaWQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRkZXNjcmlwdGlvbjogU3RyaW5nLFxuXHRcdFx0ZW5hYmxlZDogQm9vbGVhbixcblx0XHRcdGNvbmRpdGlvbnM6IEFycmF5LFxuXHRcdFx0YWN0aW9uczogQXJyYXlcblx0XHR9KTtcblxuXHRcdGlmICh0cmlnZ2VyLl9pZCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci51cGRhdGVCeUlkKHRyaWdnZXIuX2lkLCB0cmlnZ2VyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5pbnNlcnQodHJpZ2dlcik7XG5cdFx0fVxuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzZWFyY2hBZ2VudCcodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2VhcmNoQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghdXNlcm5hbWUgfHwgIV8uaXNTdHJpbmcodXNlcm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWFyZ3VtZW50cycsICdJbnZhbGlkIGFyZ3VtZW50cycsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2VhcmNoQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzZWFyY2hBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVzZXI7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdHNlbmRNZXNzYWdlTGl2ZWNoYXQoeyB0b2tlbiwgX2lkLCByaWQsIG1zZywgYXR0YWNobWVudHMgfSwgYWdlbnQpIHtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblx0XHRjaGVjayhfaWQsIFN0cmluZyk7XG5cdFx0Y2hlY2socmlkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKG1zZywgU3RyaW5nKTtcblxuXHRcdGNoZWNrKGFnZW50LCBNYXRjaC5NYXliZSh7XG5cdFx0XHRhZ2VudElkOiBTdHJpbmcsXG5cdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgZ3Vlc3QgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRcdGRlcGFydG1lbnQ6IDEsXG5cdFx0XHRcdHRva2VuOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAoIWd1ZXN0KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRva2VuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZE1lc3NhZ2Uoe1xuXHRcdFx0Z3Vlc3QsXG5cdFx0XHRtZXNzYWdlOiB7XG5cdFx0XHRcdF9pZCxcblx0XHRcdFx0cmlkLFxuXHRcdFx0XHRtc2csXG5cdFx0XHRcdHRva2VuLFxuXHRcdFx0XHRhdHRhY2htZW50c1xuXHRcdFx0fSxcblx0XHRcdGFnZW50XG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGFzeW5jICdzZW5kRmlsZUxpdmVjaGF0TWVzc2FnZScocm9vbUlkLCB2aXNpdG9yVG9rZW4sIGZpbGUsIG1zZ0RhdGEgPSB7fSkge1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbik7XG5cblx0XHRpZiAoIXZpc2l0b3IpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbih2aXNpdG9yVG9rZW4sIHJvb21JZCk7XG5cblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjaGVjayhtc2dEYXRhLCB7XG5cdFx0XHRhdmF0YXI6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRlbW9qaTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdGFsaWFzOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0Z3JvdXBhYmxlOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdG1zZzogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgZmlsZVVybCA9IGAvZmlsZS11cGxvYWQvJHsgZmlsZS5faWQgfS8keyBlbmNvZGVVUkkoZmlsZS5uYW1lKSB9YDtcblxuXHRcdGNvbnN0IGF0dGFjaG1lbnQgPSB7XG5cdFx0XHR0aXRsZTogZmlsZS5uYW1lLFxuXHRcdFx0dHlwZTogJ2ZpbGUnLFxuXHRcdFx0ZGVzY3JpcHRpb246IGZpbGUuZGVzY3JpcHRpb24sXG5cdFx0XHR0aXRsZV9saW5rOiBmaWxlVXJsLFxuXHRcdFx0dGl0bGVfbGlua19kb3dubG9hZDogdHJ1ZVxuXHRcdH07XG5cblx0XHRpZiAoL15pbWFnZVxcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdXJsID0gZmlsZVVybDtcblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdGF0dGFjaG1lbnQuaW1hZ2Vfc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHRcdGlmIChmaWxlLmlkZW50aWZ5ICYmIGZpbGUuaWRlbnRpZnkuc2l6ZSkge1xuXHRcdFx0XHRhdHRhY2htZW50LmltYWdlX2RpbWVuc2lvbnMgPSBmaWxlLmlkZW50aWZ5LnNpemU7XG5cdFx0XHR9XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3ByZXZpZXcgPSBhd2FpdCBGaWxlVXBsb2FkLnJlc2l6ZUltYWdlUHJldmlldyhmaWxlKTtcblx0XHR9IGVsc2UgaWYgKC9eYXVkaW9cXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRhdHRhY2htZW50LmF1ZGlvX3VybCA9IGZpbGVVcmw7XG5cdFx0XHRhdHRhY2htZW50LmF1ZGlvX3R5cGUgPSBmaWxlLnR5cGU7XG5cdFx0XHRhdHRhY2htZW50LmF1ZGlvX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0fSBlbHNlIGlmICgvXnZpZGVvXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0YXR0YWNobWVudC52aWRlb191cmwgPSBmaWxlVXJsO1xuXHRcdFx0YXR0YWNobWVudC52aWRlb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0YXR0YWNobWVudC52aWRlb19zaXplID0gZmlsZS5zaXplO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IE9iamVjdC5hc3NpZ24oe1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogcm9vbUlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRtc2c6ICcnLFxuXHRcdFx0ZmlsZToge1xuXHRcdFx0XHRfaWQ6IGZpbGUuX2lkLFxuXHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdHR5cGU6IGZpbGUudHlwZVxuXHRcdFx0fSxcblx0XHRcdGdyb3VwYWJsZTogZmFsc2UsXG5cdFx0XHRhdHRhY2htZW50czogW2F0dGFjaG1lbnRdLFxuXHRcdFx0dG9rZW46IHZpc2l0b3JUb2tlblxuXHRcdH0sIG1zZ0RhdGEpO1xuXG5cdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZUxpdmVjaGF0JywgbXNnKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIEREUFJhdGVMaW1pdGVyICovXG5pbXBvcnQgZG5zIGZyb20gJ2Rucyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNlbmRPZmZsaW5lTWVzc2FnZScoZGF0YSkge1xuXHRcdGNoZWNrKGRhdGEsIHtcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdGVtYWlsOiBTdHJpbmcsXG5cdFx0XHRtZXNzYWdlOiBTdHJpbmdcblx0XHR9KTtcblxuXHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJykpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBoZWFkZXIgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbWFpbF9IZWFkZXInKSB8fCAnJyk7XG5cdFx0Y29uc3QgZm9vdGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfRm9vdGVyJykgfHwgJycpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IChgJHsgZGF0YS5tZXNzYWdlIH1gKS5yZXBsYWNlKC8oW14+XFxyXFxuXT8pKFxcclxcbnxcXG5cXHJ8XFxyfFxcbikvZywgJyQxJyArICc8YnI+JyArICckMicpO1xuXG5cdFx0Y29uc3QgaHRtbCA9IGBcblx0XHRcdDxoMT5OZXcgbGl2ZWNoYXQgbWVzc2FnZTwvaDE+XG5cdFx0XHQ8cD48c3Ryb25nPlZpc2l0b3IgbmFtZTo8L3N0cm9uZz4gJHsgZGF0YS5uYW1lIH08L3A+XG5cdFx0XHQ8cD48c3Ryb25nPlZpc2l0b3IgZW1haWw6PC9zdHJvbmc+ICR7IGRhdGEuZW1haWwgfTwvcD5cblx0XHRcdDxwPjxzdHJvbmc+TWVzc2FnZTo8L3N0cm9uZz48YnI+JHsgbWVzc2FnZSB9PC9wPmA7XG5cblx0XHRsZXQgZnJvbUVtYWlsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKS5tYXRjaCgvXFxiW0EtWjAtOS5fJSstXStAKD86W0EtWjAtOS1dK1xcLikrW0EtWl17Miw0fVxcYi9pKTtcblxuXHRcdGlmIChmcm9tRW1haWwpIHtcblx0XHRcdGZyb21FbWFpbCA9IGZyb21FbWFpbFswXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZnJvbUVtYWlsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3ZhbGlkYXRlX29mZmxpbmVfZW1haWwnKSkge1xuXHRcdFx0Y29uc3QgZW1haWxEb21haW4gPSBkYXRhLmVtYWlsLnN1YnN0cihkYXRhLmVtYWlsLmxhc3RJbmRleE9mKCdAJykgKyAxKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0TWV0ZW9yLndyYXBBc3luYyhkbnMucmVzb2x2ZU14KShlbWFpbERvbWFpbik7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtZW1haWwtYWRkcmVzcycsICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNlbmRPZmZsaW5lTWVzc2FnZScgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdEVtYWlsLnNlbmQoe1xuXHRcdFx0XHR0bzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X29mZmxpbmVfZW1haWwnKSxcblx0XHRcdFx0ZnJvbTogYCR7IGRhdGEubmFtZSB9IC0gJHsgZGF0YS5lbWFpbCB9IDwkeyBmcm9tRW1haWwgfT5gLFxuXHRcdFx0XHRyZXBseVRvOiBgJHsgZGF0YS5uYW1lIH0gPCR7IGRhdGEuZW1haWwgfT5gLFxuXHRcdFx0XHRzdWJqZWN0OiBgTGl2ZWNoYXQgb2ZmbGluZSBtZXNzYWdlIGZyb20gJHsgZGF0YS5uYW1lIH06ICR7IChgJHsgZGF0YS5tZXNzYWdlIH1gKS5zdWJzdHJpbmcoMCwgMjApIH1gLFxuXHRcdFx0XHRodG1sOiBoZWFkZXIgKyBodG1sICsgZm9vdGVyXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0Lm9mZmxpbmVNZXNzYWdlJywgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoe1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ2xpdmVjaGF0OnNlbmRPZmZsaW5lTWVzc2FnZScsXG5cdGNvbm5lY3Rpb25JZCgpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSwgMSwgNTAwMCk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJyh0b2tlbiwga2V5LCB2YWx1ZSwgb3ZlcndyaXRlID0gdHJ1ZSkge1xuXHRcdGNvbnN0IGN1c3RvbUZpZWxkID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kT25lQnlJZChrZXkpO1xuXHRcdGlmIChjdXN0b21GaWVsZCkge1xuXHRcdFx0aWYgKGN1c3RvbUZpZWxkLnNjb3BlID09PSAncm9vbScpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBTYXZlIGluIHVzZXJcblx0XHRcdFx0cmV0dXJuIExpdmVjaGF0VmlzaXRvcnMudXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbih0b2tlbiwga2V5LCB2YWx1ZSwgb3ZlcndyaXRlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzZXREZXBhcnRtZW50Rm9yVmlzaXRvcicoeyB0b2tlbiwgZGVwYXJ0bWVudCB9ID0ge30pIHtcblx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnNldERlcGFydG1lbnRGb3JHdWVzdC5jYWxsKHRoaXMsIHtcblx0XHRcdHRva2VuLFxuXHRcdFx0ZGVwYXJ0bWVudFxuXHRcdH0pO1xuXG5cdFx0Ly8gdXBkYXRlIHZpc2l0ZWQgcGFnZSBoaXN0b3J5IHRvIG5vdCBleHBpcmVcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5rZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIi8qIGVzbGludCBuZXctY2FwOiBbMiwge1wiY2FwSXNOZXdFeGNlcHRpb25zXCI6IFtcIk1ENVwiXX1dICovXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzdGFydFZpZGVvQ2FsbCcocm9vbUlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZUJ5VmlzaXRvcicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZ3Vlc3QgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IHJvb21JZCB8fCBSYW5kb20uaWQoKSxcblx0XHRcdG1zZzogJycsXG5cdFx0XHR0czogbmV3IERhdGUoKVxuXHRcdH07XG5cblx0XHRjb25zdCB7IHJvb20gfSA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0Um9vbShndWVzdCwgbWVzc2FnZSwgeyBqaXRzaVRpbWVvdXQ6IG5ldyBEYXRlKERhdGUubm93KCkgKyAzNjAwICogMTAwMCkgfSk7XG5cdFx0bWVzc2FnZS5yaWQgPSByb29tLl9pZDtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ2xpdmVjaGF0X3ZpZGVvX2NhbGwnLCByb29tLl9pZCwgJycsIGd1ZXN0LCB7XG5cdFx0XHRhY3Rpb25MaW5rczogW1xuXHRcdFx0XHR7IGljb246ICdpY29uLXZpZGVvY2FtJywgaTE4bkxhYmVsOiAnQWNjZXB0JywgbWV0aG9kX2lkOiAnY3JlYXRlTGl2ZWNoYXRDYWxsJywgcGFyYW1zOiAnJyB9LFxuXHRcdFx0XHR7IGljb246ICdpY29uLWNhbmNlbCcsIGkxOG5MYWJlbDogJ0RlY2xpbmUnLCBtZXRob2RfaWQ6ICdkZW55TGl2ZWNoYXRDYWxsJywgcGFyYW1zOiAnJyB9XG5cdFx0XHRdXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cm9vbUlkOiByb29tLl9pZCxcblx0XHRcdGRvbWFpbjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ppdHNpX0RvbWFpbicpLFxuXHRcdFx0aml0c2lSb29tOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSml0c2lfVVJMX1Jvb21fUHJlZml4JykgKyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSArIHJvb21JZFxuXHRcdH07XG5cdH1cbn0pO1xuXG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnN0YXJ0RmlsZVVwbG9hZFJvb20nKHJvb21JZCwgdG9rZW4pIHtcblx0XHRjb25zdCBndWVzdCA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4pO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IHJvb21JZCB8fCBSYW5kb20uaWQoKSxcblx0XHRcdG1zZzogJycsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdHRva2VuOiBndWVzdC50b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRSb29tKGd1ZXN0LCBtZXNzYWdlKTtcblx0fVxufSk7XG4iLCIvKiBlc2xpbnQgbmV3LWNhcDogWzIsIHtcImNhcElzTmV3RXhjZXB0aW9uc1wiOiBbXCJNYXRjaC5PcHRpb25hbFwiXX1dICovXG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6dHJhbnNmZXInKHRyYW5zZmVyRGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnRyYW5zZmVyJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayh0cmFuc2ZlckRhdGEsIHtcblx0XHRcdHJvb21JZDogU3RyaW5nLFxuXHRcdFx0dXNlcklkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0ZGVwYXJ0bWVudElkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQodHJhbnNmZXJEYXRhLnJvb21JZCk7XG5cblx0XHRjb25zdCBndWVzdCA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZUJ5SWQocm9vbS52Ll9pZCk7XG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgTWV0ZW9yLnVzZXJJZCgpLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblx0XHRpZiAoIXN1YnNjcmlwdGlvbiAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKE1ldGVvci51c2VySWQoKSwgJ2xpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnRyYW5zZmVyJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC50cmFuc2Zlcihyb29tLCBndWVzdCwgdHJhbnNmZXJEYXRhKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIEhUVFAgKi9cbmNvbnN0IHBvc3RDYXRjaEVycm9yID0gTWV0ZW9yLndyYXBBc3luYyhmdW5jdGlvbih1cmwsIG9wdGlvbnMsIHJlc29sdmUpIHtcblx0SFRUUC5wb3N0KHVybCwgb3B0aW9ucywgZnVuY3Rpb24oZXJyLCByZXMpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRyZXNvbHZlKG51bGwsIGVyci5yZXNwb25zZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc29sdmUobnVsbCwgcmVzKTtcblx0XHR9XG5cdH0pO1xufSk7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OndlYmhvb2tUZXN0JygpIHtcblx0XHR0aGlzLnVuYmxvY2soKTtcblxuXHRcdGNvbnN0IHNhbXBsZURhdGEgPSB7XG5cdFx0XHR0eXBlOiAnTGl2ZWNoYXRTZXNzaW9uJyxcblx0XHRcdF9pZDogJ2Zhc2Q2ZjVhNHNkNmY4YTRzZGYnLFxuXHRcdFx0bGFiZWw6ICd0aXRsZScsXG5cdFx0XHR0b3BpYzogJ2FzaW9kb2pmJyxcblx0XHRcdGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcblx0XHRcdGxhc3RNZXNzYWdlQXQ6IG5ldyBEYXRlKCksXG5cdFx0XHR0YWdzOiBbXG5cdFx0XHRcdCd0YWcxJyxcblx0XHRcdFx0J3RhZzInLFxuXHRcdFx0XHQndGFnMydcblx0XHRcdF0sXG5cdFx0XHRjdXN0b21GaWVsZHM6IHtcblx0XHRcdFx0cHJvZHVjdElkOiAnMTIzNDU2J1xuXHRcdFx0fSxcblx0XHRcdHZpc2l0b3I6IHtcblx0XHRcdFx0X2lkOiAnJyxcblx0XHRcdFx0bmFtZTogJ3Zpc2l0b3IgbmFtZScsXG5cdFx0XHRcdHVzZXJuYW1lOiAndmlzaXRvci11c2VybmFtZScsXG5cdFx0XHRcdGRlcGFydG1lbnQ6ICdkZXBhcnRtZW50Jyxcblx0XHRcdFx0ZW1haWw6ICdlbWFpbEBhZGRyZXNzLmNvbScsXG5cdFx0XHRcdHBob25lOiAnMTkyODczMTkyODczJyxcblx0XHRcdFx0aXA6ICcxMjMuNDU2LjcuODknLFxuXHRcdFx0XHRicm93c2VyOiAnQ2hyb21lJyxcblx0XHRcdFx0b3M6ICdMaW51eCcsXG5cdFx0XHRcdGN1c3RvbUZpZWxkczoge1xuXHRcdFx0XHRcdGN1c3RvbWVySWQ6ICcxMjM0NTYnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRhZ2VudDoge1xuXHRcdFx0XHRfaWQ6ICdhc2RmODlhczZkZjgnLFxuXHRcdFx0XHR1c2VybmFtZTogJ2FnZW50LnVzZXJuYW1lJyxcblx0XHRcdFx0bmFtZTogJ0FnZW50IE5hbWUnLFxuXHRcdFx0XHRlbWFpbDogJ2FnZW50QGVtYWlsLmNvbSdcblx0XHRcdH0sXG5cdFx0XHRtZXNzYWdlczogW3tcblx0XHRcdFx0dXNlcm5hbWU6ICd2aXNpdG9yLXVzZXJuYW1lJyxcblx0XHRcdFx0bXNnOiAnbWVzc2FnZSBjb250ZW50Jyxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKClcblx0XHRcdH0sIHtcblx0XHRcdFx0dXNlcm5hbWU6ICdhZ2VudC51c2VybmFtZScsXG5cdFx0XHRcdGFnZW50SWQ6ICdhc2RmODlhczZkZjgnLFxuXHRcdFx0XHRtc2c6ICdtZXNzYWdlIGNvbnRlbnQgZnJvbSBhZ2VudCcsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0XHR9XVxuXHRcdH07XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnWC1Sb2NrZXRDaGF0LUxpdmVjaGF0LVRva2VuJzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3NlY3JldF90b2tlbicpXG5cdFx0XHR9LFxuXHRcdFx0ZGF0YTogc2FtcGxlRGF0YVxuXHRcdH07XG5cblx0XHRjb25zdCByZXNwb25zZSA9IHBvc3RDYXRjaEVycm9yKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rVXJsJyksIG9wdGlvbnMpO1xuXG5cdFx0Y29uc29sZS5sb2coJ3Jlc3BvbnNlIC0+JywgcmVzcG9uc2UpO1xuXG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLnN0YXR1c0NvZGUgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC13ZWJob29rLXJlc3BvbnNlJyk7XG5cdFx0fVxuXHR9XG59KTtcblxuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6dGFrZUlucXVpcnknKGlucXVpcnlJZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnRha2VJbnF1aXJ5JyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBpbnF1aXJ5ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LmZpbmRPbmVCeUlkKGlucXVpcnlJZCk7XG5cblx0XHRpZiAoIWlucXVpcnkgfHwgaW5xdWlyeS5zdGF0dXMgPT09ICd0YWtlbicpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ0lucXVpcnkgYWxyZWFkeSB0YWtlbicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dGFrZUlucXVpcnknIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChNZXRlb3IudXNlcklkKCkpO1xuXG5cdFx0Y29uc3QgYWdlbnQgPSB7XG5cdFx0XHRhZ2VudElkOiB1c2VyLl9pZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdC8vIGFkZCBzdWJzY3JpcHRpb25cblx0XHRjb25zdCBzdWJzY3JpcHRpb25EYXRhID0ge1xuXHRcdFx0cmlkOiBpbnF1aXJ5LnJpZCxcblx0XHRcdG5hbWU6IGlucXVpcnkubmFtZSxcblx0XHRcdGFsZXJ0OiB0cnVlLFxuXHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdHVucmVhZDogMSxcblx0XHRcdHVzZXJNZW50aW9uczogMSxcblx0XHRcdGdyb3VwTWVudGlvbnM6IDAsXG5cdFx0XHR1OiB7XG5cdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0ZW1haWxOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmluc2VydChzdWJzY3JpcHRpb25EYXRhKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5pbmNVc2Vyc0NvdW50QnlJZChpbnF1aXJ5LnJpZCk7XG5cblx0XHQvLyB1cGRhdGUgcm9vbVxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpbnF1aXJ5LnJpZCk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jaGFuZ2VBZ2VudEJ5Um9vbUlkKGlucXVpcnkucmlkLCBhZ2VudCk7XG5cblx0XHRyb29tLnNlcnZlZEJ5ID0ge1xuXHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdC8vIG1hcmsgaW5xdWlyeSBhcyB0YWtlblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS50YWtlSW5xdWlyeShpbnF1aXJ5Ll9pZCk7XG5cblx0XHQvLyByZW1vdmUgc2VuZGluZyBtZXNzYWdlIGZyb20gZ3Vlc3Qgd2lkZ2V0XG5cdFx0Ly8gZG9udCBjaGVjayBpZiBzZXR0aW5nIGlzIHRydWUsIGJlY2F1c2UgaWYgc2V0dGluZ3dhcyBzd2l0Y2hlZCBvZmYgaW5iZXR3ZWVuICBndWVzdCBlbnRlcmVkIHBvb2wsXG5cdFx0Ly8gYW5kIGlucXVpcnkgYmVpbmcgdGFrZW4sIG1lc3NhZ2Ugd291bGQgbm90IGJlIHN3aXRjaGVkIG9mZi5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVDb21tYW5kV2l0aFJvb21JZEFuZFVzZXIoJ2Nvbm5lY3RlZCcsIHJvb20uX2lkLCB1c2VyKTtcblxuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtLmVtaXQocm9vbS5faWQsIHtcblx0XHRcdHR5cGU6ICdhZ2VudERhdGEnLFxuXHRcdFx0ZGF0YTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpXG5cdFx0fSk7XG5cblx0XHQvLyByZXR1cm4gcm9vbSBjb3JyZXNwb25kaW5nIHRvIGlucXVpcnkgKGZvciByZWRpcmVjdGluZyBhZ2VudCB0byB0aGUgcm9vbSByb3V0ZSlcblx0XHRyZXR1cm4gaW5xdWlyeTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpyZXR1cm5Bc0lucXVpcnknKHJpZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVEZXBhcnRtZW50JyB9KTtcblx0XHR9XG5cblx0XHQvLyAvL2RlbGV0ZSBhZ2VudCBhbmQgcm9vbSBzdWJzY3JpcHRpb25cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnJlbW92ZUJ5Um9vbUlkKHJpZCk7XG5cblx0XHQvLyBmaW5kIGlucXVpcnkgY29ycmVzcG9uZGluZyB0byByb29tXG5cdFx0Y29uc3QgaW5xdWlyeSA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5maW5kT25lKHtyaWR9KTtcblxuXHRcdC8vIG1hcmsgaW5xdWlyeSBhcyBvcGVuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5vcGVuSW5xdWlyeShpbnF1aXJ5Ll9pZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZU9mZmljZUhvdXJzJyhkYXksIHN0YXJ0LCBmaW5pc2gsIG9wZW4pIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIudXBkYXRlSG91cnMoZGF5LCBzdGFydCwgZmluaXNoLCBvcGVuKTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIGVtYWlsU2V0dGluZ3MsIEREUFJhdGVMaW1pdGVyICovXG4vKiBTZW5kIGEgdHJhbnNjcmlwdCBvZiB0aGUgcm9vbSBjb252ZXJzdGF0aW9uIHRvIHRoZSBnaXZlbiBlbWFpbCAqL1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuXG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNlbmRUcmFuc2NyaXB0Jyh0b2tlbiwgcmlkLCBlbWFpbCkge1xuXHRcdGNoZWNrKHJpZCwgU3RyaW5nKTtcblx0XHRjaGVjayhlbWFpbCwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4pO1xuXHRcdGNvbnN0IHVzZXJMYW5ndWFnZSA9ICh2aXNpdG9yICYmIHZpc2l0b3IubGFuZ3VhZ2UpIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbic7XG5cblx0XHQvLyBhbGxvdyB0byBvbmx5IHVzZXIgdG8gc2VuZCB0cmFuc2NyaXB0cyBmcm9tIHRoZWlyIG93biBjaGF0c1xuXHRcdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdsJyB8fCAhcm9vbS52IHx8IHJvb20udi50b2tlbiAhPT0gdG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRWaXNpYmxlQnlSb29tSWROb3RDb250YWluaW5nVHlwZXMocmlkLCBbJ2xpdmVjaGF0X25hdmlnYXRpb25faGlzdG9yeSddLCB7IHNvcnQ6IHsgJ3RzJyA6IDEgfX0pO1xuXHRcdGNvbnN0IGhlYWRlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0hlYWRlcicpIHx8ICcnKTtcblx0XHRjb25zdCBmb290ZXIgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbWFpbF9Gb290ZXInKSB8fCAnJyk7XG5cblx0XHRsZXQgaHRtbCA9ICc8ZGl2PiA8aHI+Jztcblx0XHRtZXNzYWdlcy5mb3JFYWNoKG1lc3NhZ2UgPT4ge1xuXHRcdFx0aWYgKG1lc3NhZ2UudCAmJiBbJ2NvbW1hbmQnLCAnbGl2ZWNoYXQtY2xvc2UnLCAnbGl2ZWNoYXRfdmlkZW9fY2FsbCddLmluZGV4T2YobWVzc2FnZS50KSAhPT0gLTEpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgYXV0aG9yO1xuXHRcdFx0aWYgKG1lc3NhZ2UudS5faWQgPT09IHZpc2l0b3IuX2lkKSB7XG5cdFx0XHRcdGF1dGhvciA9IFRBUGkxOG4uX18oJ1lvdScsIHsgbG5nOiB1c2VyTGFuZ3VhZ2UgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhdXRob3IgPSBtZXNzYWdlLnUudXNlcm5hbWU7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGRhdGV0aW1lID0gbW9tZW50KG1lc3NhZ2UudHMpLmxvY2FsZSh1c2VyTGFuZ3VhZ2UpLmZvcm1hdCgnTExMJyk7XG5cdFx0XHRjb25zdCBzaW5nbGVNZXNzYWdlID0gYFxuXHRcdFx0XHQ8cD48c3Ryb25nPiR7IGF1dGhvciB9PC9zdHJvbmc+ICA8ZW0+JHsgZGF0ZXRpbWUgfTwvZW0+PC9wPlxuXHRcdFx0XHQ8cD4keyBtZXNzYWdlLm1zZyB9PC9wPlxuXHRcdFx0YDtcblx0XHRcdGh0bWwgPSBodG1sICsgc2luZ2xlTWVzc2FnZTtcblx0XHR9KTtcblxuXHRcdGh0bWwgPSBgJHsgaHRtbCB9PC9kaXY+YDtcblxuXHRcdGxldCBmcm9tRW1haWwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpLm1hdGNoKC9cXGJbQS1aMC05Ll8lKy1dK0AoPzpbQS1aMC05LV0rXFwuKStbQS1aXXsyLDR9XFxiL2kpO1xuXG5cdFx0aWYgKGZyb21FbWFpbCkge1xuXHRcdFx0ZnJvbUVtYWlsID0gZnJvbUVtYWlsWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmcm9tRW1haWwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRnJvbV9FbWFpbCcpO1xuXHRcdH1cblxuXHRcdGVtYWlsU2V0dGluZ3MgPSB7XG5cdFx0XHR0bzogZW1haWwsXG5cdFx0XHRmcm9tOiBmcm9tRW1haWwsXG5cdFx0XHRyZXBseVRvOiBmcm9tRW1haWwsXG5cdFx0XHRzdWJqZWN0OiBUQVBpMThuLl9fKCdUcmFuc2NyaXB0X29mX3lvdXJfbGl2ZWNoYXRfY29udmVyc2F0aW9uJywgeyBsbmc6IHVzZXJMYW5ndWFnZSB9KSxcblx0XHRcdGh0bWw6IGhlYWRlciArIGh0bWwgKyBmb290ZXJcblx0XHR9O1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdEVtYWlsLnNlbmQoZW1haWxTZXR0aW5ncyk7XG5cdFx0fSk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5zZW5kVHJhbnNjcmlwdCcsIG1lc3NhZ2VzLCBlbWFpbCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoe1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ2xpdmVjaGF0OnNlbmRUcmFuc2NyaXB0Jyxcblx0Y29ubmVjdGlvbklkKCkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59LCAxLCA1MDAwKTtcbiIsIi8qKlxuICogU2V0cyBhbiB1c2VyIGFzIChub24pb3BlcmF0b3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBfaWQgLSBVc2VyJ3MgX2lkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wZXJhdG9yIC0gRmxhZyB0byBzZXQgYXMgb3BlcmF0b3Igb3Igbm90XG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldE9wZXJhdG9yID0gZnVuY3Rpb24oX2lkLCBvcGVyYXRvcikge1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0b3BlcmF0b3Jcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKF9pZCwgdXBkYXRlKTtcbn07XG5cbi8qKlxuICogR2V0cyBhbGwgb25saW5lIGFnZW50c1xuICogQHJldHVyblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lQWdlbnRzID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHN0YXR1czoge1xuXHRcdFx0JGV4aXN0czogdHJ1ZSxcblx0XHRcdCRuZTogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHRzdGF0dXNMaXZlY2hhdDogJ2F2YWlsYWJsZScsXG5cdFx0cm9sZXM6ICdsaXZlY2hhdC1hZ2VudCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cbi8qKlxuICogRmluZCBhbiBvbmxpbmUgYWdlbnQgYnkgaGlzIHVzZXJuYW1lXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUgPSBmdW5jdGlvbih1c2VybmFtZSkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHR1c2VybmFtZSxcblx0XHRzdGF0dXM6IHtcblx0XHRcdCRleGlzdHM6IHRydWUsXG5cdFx0XHQkbmU6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0c3RhdHVzTGl2ZWNoYXQ6ICdhdmFpbGFibGUnLFxuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG59O1xuXG4vKipcbiAqIEdldHMgYWxsIGFnZW50c1xuICogQHJldHVyblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kQWdlbnRzID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG4vKipcbiAqIEZpbmQgb25saW5lIHVzZXJzIGZyb20gYSBsaXN0XG4gKiBAcGFyYW0ge2FycmF5fSB1c2VyTGlzdCAtIGFycmF5IG9mIHVzZXJuYW1lc1xuICogQHJldHVyblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lVXNlckZyb21MaXN0ID0gZnVuY3Rpb24odXNlckxpc3QpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0c3RhdHVzOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlLFxuXHRcdFx0JG5lOiAnb2ZmbGluZSdcblx0XHR9LFxuXHRcdHN0YXR1c0xpdmVjaGF0OiAnYXZhaWxhYmxlJyxcblx0XHRyb2xlczogJ2xpdmVjaGF0LWFnZW50Jyxcblx0XHR1c2VybmFtZToge1xuXHRcdFx0JGluOiBbXS5jb25jYXQodXNlckxpc3QpXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuLyoqXG4gKiBHZXQgbmV4dCB1c2VyIGFnZW50IGluIG9yZGVyXG4gKiBAcmV0dXJuIHtvYmplY3R9IFVzZXIgZnJvbSBkYlxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXROZXh0QWdlbnQgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0c3RhdHVzOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlLFxuXHRcdFx0JG5lOiAnb2ZmbGluZSdcblx0XHR9LFxuXHRcdHN0YXR1c0xpdmVjaGF0OiAnYXZhaWxhYmxlJyxcblx0XHRyb2xlczogJ2xpdmVjaGF0LWFnZW50J1xuXHR9O1xuXG5cdGNvbnN0IGNvbGxlY3Rpb25PYmogPSB0aGlzLm1vZGVsLnJhd0NvbGxlY3Rpb24oKTtcblx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoY29sbGVjdGlvbk9iai5maW5kQW5kTW9kaWZ5LCBjb2xsZWN0aW9uT2JqKTtcblxuXHRjb25zdCBzb3J0ID0ge1xuXHRcdGxpdmVjaGF0Q291bnQ6IDEsXG5cdFx0dXNlcm5hbWU6IDFcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JGluYzoge1xuXHRcdFx0bGl2ZWNoYXRDb3VudDogMVxuXHRcdH1cblx0fTtcblxuXHRjb25zdCB1c2VyID0gZmluZEFuZE1vZGlmeShxdWVyeSwgc29ydCwgdXBkYXRlKTtcblx0aWYgKHVzZXIgJiYgdXNlci52YWx1ZSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhZ2VudElkOiB1c2VyLnZhbHVlLl9pZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnZhbHVlLnVzZXJuYW1lXG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufTtcblxuLyoqXG4gKiBDaGFuZ2UgdXNlcidzIGxpdmVjaGF0IHN0YXR1c1xuICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRMaXZlY2hhdFN0YXR1cyA9IGZ1bmN0aW9uKHVzZXJJZCwgc3RhdHVzKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCdfaWQnOiB1c2VySWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0J3N0YXR1c0xpdmVjaGF0Jzogc3RhdHVzXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cbi8qKlxuICogY2hhbmdlIGFsbCBsaXZlY2hhdCBhZ2VudHMgbGl2ZWNoYXQgc3RhdHVzIHRvIFwibm90LWF2YWlsYWJsZVwiXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmNsb3NlT2ZmaWNlID0gZnVuY3Rpb24oKSB7XG5cdHNlbGYgPSB0aGlzO1xuXHRzZWxmLmZpbmRBZ2VudHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGFnZW50KSB7XG5cdFx0c2VsZi5zZXRMaXZlY2hhdFN0YXR1cyhhZ2VudC5faWQsICdub3QtYXZhaWxhYmxlJyk7XG5cdH0pO1xufTtcblxuLyoqXG4gKiBjaGFuZ2UgYWxsIGxpdmVjaGF0IGFnZW50cyBsaXZlY2hhdCBzdGF0dXMgdG8gXCJhdmFpbGFibGVcIlxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5vcGVuT2ZmaWNlID0gZnVuY3Rpb24oKSB7XG5cdHNlbGYgPSB0aGlzO1xuXHRzZWxmLmZpbmRBZ2VudHMoKS5mb3JFYWNoKGZ1bmN0aW9uKGFnZW50KSB7XG5cdFx0c2VsZi5zZXRMaXZlY2hhdFN0YXR1cyhhZ2VudC5faWQsICdhdmFpbGFibGUnKTtcblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8gPSBmdW5jdGlvbihhZ2VudElkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogYWdlbnRJZFxuXHR9O1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0ZmllbGRzOiB7XG5cdFx0XHRuYW1lOiAxLFxuXHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRwaG9uZTogMSxcblx0XHRcdGN1c3RvbUZpZWxkczogMVxuXHRcdH1cblx0fTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnKSkge1xuXHRcdG9wdGlvbnMuZmllbGRzLmVtYWlscyA9IDE7XG5cdH1cblxuXHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlU3VydmV5RmVlZGJhY2tCeUlkID0gZnVuY3Rpb24oX2lkLCBzdXJ2ZXlGZWVkYmFjaykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0c3VydmV5RmVlZGJhY2tcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCBrZXksIHZhbHVlLCBvdmVyd3JpdGUgPSB0cnVlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2LnRva2VuJzogdG9rZW4sXG5cdFx0b3BlbjogdHJ1ZVxuXHR9O1xuXG5cdGlmICghb3ZlcndyaXRlKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMuZmluZE9uZShxdWVyeSwgeyBmaWVsZHM6IHsgbGl2ZWNoYXREYXRhOiAxIH0gfSk7XG5cdFx0aWYgKHJvb20ubGl2ZWNoYXREYXRhICYmIHR5cGVvZiByb29tLmxpdmVjaGF0RGF0YVtrZXldICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdFtgbGl2ZWNoYXREYXRhLiR7IGtleSB9YF06IHZhbHVlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdCA9IGZ1bmN0aW9uKGZpbHRlciA9IHt9LCBvZmZzZXQgPSAwLCBsaW1pdCA9IDIwKSB7XG5cdGNvbnN0IHF1ZXJ5ID0gXy5leHRlbmQoZmlsdGVyLCB7XG5cdFx0dDogJ2wnXG5cdH0pO1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnksIHsgc29ydDogeyB0czogLSAxIH0sIG9mZnNldCwgbGltaXQgfSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kTGl2ZWNoYXRCeUlkID0gZnVuY3Rpb24oX2lkLCBmaWVsZHMpIHtcblx0Y29uc3Qgb3B0aW9ucyA9IHt9O1xuXG5cdGlmIChmaWVsZHMpIHtcblx0XHRvcHRpb25zLmZpZWxkcyA9IGZpZWxkcztcblx0fVxuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHQ6ICdsJyxcblx0XHRfaWRcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdEJ5SWQgPSBmdW5jdGlvbihfaWQsIGZpZWxkcykge1xuXHRjb25zdCBvcHRpb25zID0ge307XG5cblx0aWYgKGZpZWxkcykge1xuXHRcdG9wdGlvbnMuZmllbGRzID0gZmllbGRzO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0dDogJ2wnLFxuXHRcdF9pZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIG5leHQgdmlzaXRvciBuYW1lXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBuZXh0IHZpc2l0b3IgbmFtZVxuICovXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVMaXZlY2hhdFJvb21Db3VudCA9IGZ1bmN0aW9uKCkge1xuXHRjb25zdCBzZXR0aW5nc1JhdyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLm1vZGVsLnJhd0NvbGxlY3Rpb24oKTtcblx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoc2V0dGluZ3NSYXcuZmluZEFuZE1vZGlmeSwgc2V0dGluZ3NSYXcpO1xuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogJ0xpdmVjaGF0X1Jvb21fQ291bnQnXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRpbmM6IHtcblx0XHRcdHZhbHVlOiAxXG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IGxpdmVjaGF0Q291bnQgPSBmaW5kQW5kTW9kaWZ5KHF1ZXJ5LCBudWxsLCB1cGRhdGUpO1xuXG5cdHJldHVybiBsaXZlY2hhdENvdW50LnZhbHVlLnZhbHVlO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHZpc2l0b3JUb2tlbiwgb3B0aW9ucykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRvcGVuOiB0cnVlLFxuXHRcdCd2LnRva2VuJzogdmlzaXRvclRva2VuXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgb3B0aW9ucyk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlWaXNpdG9yVG9rZW4gPSBmdW5jdGlvbih2aXNpdG9yVG9rZW4pIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0J3YudG9rZW4nOiB2aXNpdG9yVG9rZW5cblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVZpc2l0b3JJZCA9IGZ1bmN0aW9uKHZpc2l0b3JJZCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHQndi5faWQnOiB2aXNpdG9ySWRcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVPcGVuQnlWaXNpdG9yVG9rZW4gPSBmdW5jdGlvbih0b2tlbiwgcm9vbUlkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogcm9vbUlkLFxuXHRcdG9wZW46IHRydWUsXG5cdFx0J3YudG9rZW4nOiB0b2tlblxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0UmVzcG9uc2VCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgcmVzcG9uc2UpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHRfaWQ6IHJvb21JZFxuXHR9LCB7XG5cdFx0JHNldDoge1xuXHRcdFx0cmVzcG9uc2VCeToge1xuXHRcdFx0XHRfaWQ6IHJlc3BvbnNlLnVzZXIuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogcmVzcG9uc2UudXNlci51c2VybmFtZVxuXHRcdFx0fSxcblx0XHRcdHJlc3BvbnNlRGF0ZTogcmVzcG9uc2UucmVzcG9uc2VEYXRlLFxuXHRcdFx0cmVzcG9uc2VUaW1lOiByZXNwb25zZS5yZXNwb25zZVRpbWVcblx0XHR9LFxuXHRcdCR1bnNldDoge1xuXHRcdFx0d2FpdGluZ1Jlc3BvbnNlOiAxXG5cdFx0fVxuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmNsb3NlQnlSb29tSWQgPSBmdW5jdGlvbihyb29tSWQsIGNsb3NlSW5mbykge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdF9pZDogcm9vbUlkXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHRjbG9zZXI6IGNsb3NlSW5mby5jbG9zZXIsXG5cdFx0XHRjbG9zZWRCeTogY2xvc2VJbmZvLmNsb3NlZEJ5LFxuXHRcdFx0Y2xvc2VkQXQ6IGNsb3NlSW5mby5jbG9zZWRBdCxcblx0XHRcdGNoYXREdXJhdGlvbjogY2xvc2VJbmZvLmNoYXREdXJhdGlvbixcblx0XHRcdCd2LnN0YXR1cyc6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0JHVuc2V0OiB7XG5cdFx0XHRvcGVuOiAxXG5cdFx0fVxuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlBZ2VudCA9IGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRvcGVuOiB0cnVlLFxuXHRcdCdzZXJ2ZWRCeS5faWQnOiB1c2VySWRcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmNoYW5nZUFnZW50QnlSb29tSWQgPSBmdW5jdGlvbihyb29tSWQsIG5ld0FnZW50KSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogcm9vbUlkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRzZXJ2ZWRCeToge1xuXHRcdFx0XHRfaWQ6IG5ld0FnZW50LmFnZW50SWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBuZXdBZ2VudC51c2VybmFtZVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnNhdmVDUk1EYXRhQnlSb29tSWQgPSBmdW5jdGlvbihyb29tSWQsIGNybURhdGEpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiByb29tSWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGNybURhdGFcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlVmlzaXRvclN0YXR1cyA9IGZ1bmN0aW9uKHRva2VuLCBzdGF0dXMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0J3YudG9rZW4nOiB0b2tlbixcblx0XHRvcGVuOiB0cnVlXG5cdH07XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCd2LnN0YXR1cyc6IHN0YXR1c1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMua2VlcEhpc3RvcnlGb3JUb2tlbiA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0J25hdmlnYXRpb24udG9rZW4nOiB0b2tlbixcblx0XHRleHBpcmVBdDoge1xuXHRcdFx0JGV4aXN0czogdHJ1ZVxuXHRcdH1cblx0fSwge1xuXHRcdCR1bnNldDoge1xuXHRcdFx0ZXhwaXJlQXQ6IDFcblx0XHR9XG5cdH0sIHtcblx0XHRtdWx0aTogdHJ1ZVxuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFJvb21JZEJ5VG9rZW4gPSBmdW5jdGlvbih0b2tlbiwgcmlkKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0J25hdmlnYXRpb24udG9rZW4nOiB0b2tlbixcblx0XHRyaWQ6IG51bGxcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHJpZFxuXHRcdH1cblx0fSwge1xuXHRcdG11bHRpOiB0cnVlXG5cdH0pO1xufTtcbiIsImNsYXNzIExpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfZXh0ZXJuYWxfbWVzc2FnZScpO1xuXG5cdFx0aWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRcdFx0dGhpcy5faW5pdE1vZGVsKCdsaXZlY2hhdF9leHRlcm5hbF9tZXNzYWdlJyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kQnlSb29tSWQocm9vbUlkLCBzb3J0ID0geyB0czogLTEgfSkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyByaWQ6IHJvb21JZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBzb3J0IH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlID0gbmV3IExpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBMaXZlY2hhdCBDdXN0b20gRmllbGRzIG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0Q3VzdG9tRmllbGQgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9jdXN0b21fZmllbGQnKTtcblx0fVxuXG5cdC8vIEZJTkRcblx0ZmluZE9uZUJ5SWQoX2lkLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRjcmVhdGVPclVwZGF0ZUN1c3RvbUZpZWxkKF9pZCwgZmllbGQsIGxhYmVsLCBzY29wZSwgdmlzaWJpbGl0eSwgZXh0cmFEYXRhKSB7XG5cdFx0Y29uc3QgcmVjb3JkID0ge1xuXHRcdFx0bGFiZWwsXG5cdFx0XHRzY29wZSxcblx0XHRcdHZpc2liaWxpdHlcblx0XHR9O1xuXG5cdFx0Xy5leHRlbmQocmVjb3JkLCBleHRyYURhdGEpO1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0dGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiByZWNvcmQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlY29yZC5faWQgPSBmaWVsZDtcblx0XHRcdF9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlY29yZDtcblx0fVxuXG5cdC8vIFJFTU9WRVxuXHRyZW1vdmVCeUlkKF9pZCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyBfaWQgfTtcblxuXHRcdHJldHVybiB0aGlzLnJlbW92ZShxdWVyeSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZCA9IG5ldyBMaXZlY2hhdEN1c3RvbUZpZWxkKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBMaXZlY2hhdCBEZXBhcnRtZW50IG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0RGVwYXJ0bWVudCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2RlcGFydG1lbnQnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoe1xuXHRcdFx0bnVtQWdlbnRzOiAxLFxuXHRcdFx0ZW5hYmxlZDogMVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kT25lQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRCeURlcGFydG1lbnRJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudChfaWQsIHsgZW5hYmxlZCwgbmFtZSwgZGVzY3JpcHRpb24sIHNob3dPblJlZ2lzdHJhdGlvbiB9LCBhZ2VudHMpIHtcblx0XHRhZ2VudHMgPSBbXS5jb25jYXQoYWdlbnRzKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHtcblx0XHRcdGVuYWJsZWQsXG5cdFx0XHRuYW1lLFxuXHRcdFx0ZGVzY3JpcHRpb24sXG5cdFx0XHRudW1BZ2VudHM6IGFnZW50cy5sZW5ndGgsXG5cdFx0XHRzaG93T25SZWdpc3RyYXRpb25cblx0XHR9O1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0dGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiByZWNvcmQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdF9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2F2ZWRBZ2VudHMgPSBfLnBsdWNrKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kQnlEZXBhcnRtZW50SWQoX2lkKS5mZXRjaCgpLCAnYWdlbnRJZCcpO1xuXHRcdGNvbnN0IGFnZW50c1RvU2F2ZSA9IF8ucGx1Y2soYWdlbnRzLCAnYWdlbnRJZCcpO1xuXG5cdFx0Ly8gcmVtb3ZlIG90aGVyIGFnZW50c1xuXHRcdF8uZGlmZmVyZW5jZShzYXZlZEFnZW50cywgYWdlbnRzVG9TYXZlKS5mb3JFYWNoKChhZ2VudElkKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMucmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkKF9pZCwgYWdlbnRJZCk7XG5cdFx0fSk7XG5cblx0XHRhZ2VudHMuZm9yRWFjaCgoYWdlbnQpID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5zYXZlQWdlbnQoe1xuXHRcdFx0XHRhZ2VudElkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHRkZXBhcnRtZW50SWQ6IF9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lLFxuXHRcdFx0XHRjb3VudDogYWdlbnQuY291bnQgPyBwYXJzZUludChhZ2VudC5jb3VudCkgOiAwLFxuXHRcdFx0XHRvcmRlcjogYWdlbnQub3JkZXIgPyBwYXJzZUludChhZ2VudC5vcmRlcikgOiAwXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBfLmV4dGVuZChyZWNvcmQsIHsgX2lkIH0pO1xuXHR9XG5cblx0Ly8gUkVNT1ZFXG5cdHJlbW92ZUJ5SWQoX2lkKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHF1ZXJ5KTtcblx0fVxuXG5cdGZpbmRFbmFibGVkV2l0aEFnZW50cygpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdG51bUFnZW50czogeyAkZ3Q6IDAgfSxcblx0XHRcdGVuYWJsZWQ6IHRydWVcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudCA9IG5ldyBMaXZlY2hhdERlcGFydG1lbnQoKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuLyoqXG4gKiBMaXZlY2hhdCBEZXBhcnRtZW50IG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2RlcGFydG1lbnRfYWdlbnRzJyk7XG5cdH1cblxuXHRmaW5kQnlEZXBhcnRtZW50SWQoZGVwYXJ0bWVudElkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IGRlcGFydG1lbnRJZCB9KTtcblx0fVxuXG5cdHNhdmVBZ2VudChhZ2VudCkge1xuXHRcdHJldHVybiB0aGlzLnVwc2VydCh7XG5cdFx0XHRhZ2VudElkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0ZGVwYXJ0bWVudElkOiBhZ2VudC5kZXBhcnRtZW50SWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZSxcblx0XHRcdFx0Y291bnQ6IHBhcnNlSW50KGFnZW50LmNvdW50KSxcblx0XHRcdFx0b3JkZXI6IHBhcnNlSW50KGFnZW50Lm9yZGVyKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkKGRlcGFydG1lbnRJZCwgYWdlbnRJZCkge1xuXHRcdHRoaXMucmVtb3ZlKHsgZGVwYXJ0bWVudElkLCBhZ2VudElkIH0pO1xuXHR9XG5cblx0Z2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudChkZXBhcnRtZW50SWQpIHtcblx0XHRjb25zdCBhZ2VudHMgPSB0aGlzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpLmZldGNoKCk7XG5cblx0XHRpZiAoYWdlbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZVVzZXJGcm9tTGlzdChfLnBsdWNrKGFnZW50cywgJ3VzZXJuYW1lJykpO1xuXG5cdFx0Y29uc3Qgb25saW5lVXNlcm5hbWVzID0gXy5wbHVjayhvbmxpbmVVc2Vycy5mZXRjaCgpLCAndXNlcm5hbWUnKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0ZGVwYXJ0bWVudElkLFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0JGluOiBvbmxpbmVVc2VybmFtZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3Qgc29ydCA9IHtcblx0XHRcdGNvdW50OiAxLFxuXHRcdFx0b3JkZXI6IDEsXG5cdFx0XHR1c2VybmFtZTogMVxuXHRcdH07XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JGluYzoge1xuXHRcdFx0XHRjb3VudDogMVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBjb2xsZWN0aW9uT2JqID0gdGhpcy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdFx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoY29sbGVjdGlvbk9iai5maW5kQW5kTW9kaWZ5LCBjb2xsZWN0aW9uT2JqKTtcblxuXHRcdGNvbnN0IGFnZW50ID0gZmluZEFuZE1vZGlmeShxdWVyeSwgc29ydCwgdXBkYXRlKTtcblx0XHRpZiAoYWdlbnQgJiYgYWdlbnQudmFsdWUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFnZW50SWQ6IGFnZW50LnZhbHVlLmFnZW50SWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC52YWx1ZS51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0Z2V0T25saW5lRm9yRGVwYXJ0bWVudChkZXBhcnRtZW50SWQpIHtcblx0XHRjb25zdCBhZ2VudHMgPSB0aGlzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpLmZldGNoKCk7XG5cblx0XHRpZiAoYWdlbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZVVzZXJGcm9tTGlzdChfLnBsdWNrKGFnZW50cywgJ3VzZXJuYW1lJykpO1xuXG5cdFx0Y29uc3Qgb25saW5lVXNlcm5hbWVzID0gXy5wbHVjayhvbmxpbmVVc2Vycy5mZXRjaCgpLCAndXNlcm5hbWUnKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0ZGVwYXJ0bWVudElkLFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0JGluOiBvbmxpbmVVc2VybmFtZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3QgZGVwQWdlbnRzID0gdGhpcy5maW5kKHF1ZXJ5KTtcblxuXHRcdGlmIChkZXBBZ2VudHMpIHtcblx0XHRcdHJldHVybiBkZXBBZ2VudHM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cdH1cblxuXHRmaW5kVXNlcnNJblF1ZXVlKHVzZXJzTGlzdCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge307XG5cblx0XHRpZiAoIV8uaXNFbXB0eSh1c2Vyc0xpc3QpKSB7XG5cdFx0XHRxdWVyeS51c2VybmFtZSA9IHtcblx0XHRcdFx0JGluOiB1c2Vyc0xpc3Rcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0ZGVwYXJ0bWVudElkOiAxLFxuXHRcdFx0XHRjb3VudDogMSxcblx0XHRcdFx0b3JkZXI6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0cmVwbGFjZVVzZXJuYW1lT2ZBZ2VudEJ5VXNlcklkKHVzZXJJZCwgdXNlcm5hbWUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsnYWdlbnRJZCc6IHVzZXJJZH07XG5cblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHVzZXJuYW1lXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlLCB7IG11bHRpOiB0cnVlIH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyA9IG5ldyBMaXZlY2hhdERlcGFydG1lbnRBZ2VudHMoKTtcbiIsIi8qKlxuICogTGl2ZWNoYXQgUGFnZSBWaXNpdGVkIG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0UGFnZVZpc2l0ZWQgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9wYWdlX3Zpc2l0ZWQnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndG9rZW4nOiAxIH0pO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndHMnOiAxIH0pO1xuXG5cdFx0Ly8ga2VlcCBoaXN0b3J5IGZvciAxIG1vbnRoIGlmIHRoZSB2aXNpdG9yIGRvZXMgbm90IHJlZ2lzdGVyXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdleHBpcmVBdCc6IDEgfSwgeyBzcGFyc2U6IDEsIGV4cGlyZUFmdGVyU2Vjb25kczogMCB9KTtcblx0fVxuXG5cdHNhdmVCeVRva2VuKHRva2VuLCBwYWdlSW5mbykge1xuXHRcdC8vIGtlZXAgaGlzdG9yeSBvZiB1bnJlZ2lzdGVyZWQgdmlzaXRvcnMgZm9yIDEgbW9udGhcblx0XHRjb25zdCBrZWVwSGlzdG9yeU1pbGlzZWNvbmRzID0gMjU5MjAwMDAwMDtcblxuXHRcdHJldHVybiB0aGlzLmluc2VydCh7XG5cdFx0XHR0b2tlbixcblx0XHRcdHBhZ2U6IHBhZ2VJbmZvLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRleHBpcmVBdDogbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBrZWVwSGlzdG9yeU1pbGlzZWNvbmRzXG5cdFx0fSk7XG5cdH1cblxuXHRmaW5kQnlUb2tlbih0b2tlbikge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyB0b2tlbiB9LCB7IHNvcnQgOiB7IHRzOiAtMSB9LCBsaW1pdDogMjAgfSk7XG5cdH1cblxuXHRrZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHRcdHRva2VuLFxuXHRcdFx0ZXhwaXJlQXQ6IHtcblx0XHRcdFx0JGV4aXN0czogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sIHtcblx0XHRcdCR1bnNldDoge1xuXHRcdFx0XHRleHBpcmVBdDogMVxuXHRcdFx0fVxuXHRcdH0sIHtcblx0XHRcdG11bHRpOiB0cnVlXG5cdFx0fSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRQYWdlVmlzaXRlZCA9IG5ldyBMaXZlY2hhdFBhZ2VWaXNpdGVkKCk7XG4iLCIvKipcbiAqIExpdmVjaGF0IFRyaWdnZXIgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXRUcmlnZ2VyIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfdHJpZ2dlcicpO1xuXHR9XG5cblx0dXBkYXRlQnlJZChfaWQsIGRhdGEpIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiBkYXRhIH0pO1xuXHR9XG5cblx0cmVtb3ZlQWxsKCkge1xuXHRcdHJldHVybiB0aGlzLnJlbW92ZSh7fSk7XG5cdH1cblxuXHRmaW5kQnlJZChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgX2lkIH0pO1xuXHR9XG5cblx0cmVtb3ZlQnlJZChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoeyBfaWQgfSk7XG5cdH1cblxuXHRmaW5kRW5hYmxlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgZW5hYmxlZDogdHJ1ZSB9KTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIgPSBuZXcgTGl2ZWNoYXRUcmlnZ2VyKCk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudHJ5RW5zdXJlSW5kZXgoeyBvcGVuOiAxIH0sIHsgc3BhcnNlOiAxIH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy50cnlFbnN1cmVJbmRleCh7ICd2aXNpdG9yRW1haWxzLmFkZHJlc3MnOiAxIH0pO1xufSk7XG4iLCJjbGFzcyBMaXZlY2hhdElucXVpcnkgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9pbnF1aXJ5Jyk7XG5cblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3JpZCc6IDEgfSk7IC8vIHJvb20gaWQgY29ycmVzcG9uZGluZyB0byB0aGlzIGlucXVpcnlcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ25hbWUnOiAxIH0pOyAvLyBuYW1lIG9mIHRoZSBpbnF1aXJ5IChjbGllbnQgbmFtZSBmb3Igbm93KVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbWVzc2FnZSc6IDEgfSk7IC8vIG1lc3NhZ2Ugc2VudCBieSB0aGUgY2xpZW50XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICd0cyc6IDEgfSk7IC8vIHRpbWVzdGFtcFxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnYWdlbnRzJzogMX0pOyAvLyBJZCdzIG9mIHRoZSBhZ2VudHMgd2hvIGNhbiBzZWUgdGhlIGlucXVpcnkgKGhhbmRsZSBkZXBhcnRtZW50cylcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3N0YXR1cyc6IDF9KTsgLy8gJ29wZW4nLCAndGFrZW4nXG5cdH1cblxuXHRmaW5kT25lQnlJZChpbnF1aXJ5SWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHsgX2lkOiBpbnF1aXJ5SWQgfSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIHRoZSBpbnF1aXJ5IGFzIHRha2VuXG5cdCAqL1xuXHR0YWtlSW5xdWlyeShpbnF1aXJ5SWQpIHtcblx0XHR0aGlzLnVwZGF0ZSh7XG5cdFx0XHQnX2lkJzogaW5xdWlyeUlkXG5cdFx0fSwge1xuXHRcdFx0JHNldDogeyBzdGF0dXM6ICd0YWtlbicgfVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogbWFyayB0aGUgaW5xdWlyeSBhcyBjbG9zZWRcblx0ICovXG5cdGNsb3NlQnlSb29tSWQocm9vbUlkLCBjbG9zZUluZm8pIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdFx0cmlkOiByb29tSWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHN0YXR1czogJ2Nsb3NlZCcsXG5cdFx0XHRcdGNsb3NlcjogY2xvc2VJbmZvLmNsb3Nlcixcblx0XHRcdFx0Y2xvc2VkQnk6IGNsb3NlSW5mby5jbG9zZWRCeSxcblx0XHRcdFx0Y2xvc2VkQXQ6IGNsb3NlSW5mby5jbG9zZWRBdCxcblx0XHRcdFx0Y2hhdER1cmF0aW9uOiBjbG9zZUluZm8uY2hhdER1cmF0aW9uXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIGlucXVpcnkgYXMgb3BlblxuXHQgKi9cblx0b3BlbklucXVpcnkoaW5xdWlyeUlkKSB7XG5cdFx0dGhpcy51cGRhdGUoe1xuXHRcdFx0J19pZCc6IGlucXVpcnlJZFxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHsgc3RhdHVzOiAnb3BlbicgfVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogcmV0dXJuIHRoZSBzdGF0dXMgb2YgdGhlIGlucXVpcnkgKG9wZW4gb3IgdGFrZW4pXG5cdCAqL1xuXHRnZXRTdGF0dXMoaW5xdWlyeUlkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZSh7J19pZCc6IGlucXVpcnlJZH0pLnN0YXR1cztcblx0fVxuXG5cdHVwZGF0ZVZpc2l0b3JTdGF0dXModG9rZW4sIHN0YXR1cykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3YudG9rZW4nOiB0b2tlbixcblx0XHRcdHN0YXR1czogJ29wZW4nXG5cdFx0fTtcblxuXHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0J3Yuc3RhdHVzJzogc3RhdHVzXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkgPSBuZXcgTGl2ZWNoYXRJbnF1aXJ5KCk7XG4iLCJpbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbmNsYXNzIExpdmVjaGF0T2ZmaWNlSG91ciBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X29mZmljZV9ob3VyJyk7XG5cblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2RheSc6IDEgfSk7IC8vIHRoZSBkYXkgb2YgdGhlIHdlZWsgbW9uZGF5IC0gc3VuZGF5XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdzdGFydCc6IDEgfSk7IC8vIHRoZSBvcGVuaW5nIGhvdXJzIG9mIHRoZSBvZmZpY2Vcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2ZpbmlzaCc6IDEgfSk7IC8vIHRoZSBjbG9zaW5nIGhvdXJzIG9mIHRoZSBvZmZpY2Vcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ29wZW4nOiAxIH0pOyAvLyB3aGV0aGVyIG9yIG5vdCB0aGUgb2ZmaWNlcyBhcmUgb3BlbiBvbiB0aGlzIGRheVxuXG5cdFx0Ly8gaWYgdGhlcmUgaXMgbm90aGluZyBpbiB0aGUgY29sbGVjdGlvbiwgYWRkIGRlZmF1bHRzXG5cdFx0aWYgKHRoaXMuZmluZCgpLmNvdW50KCkgPT09IDApIHtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdNb25kYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAxLCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1R1ZXNkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAyLCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1dlZG5lc2RheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDMsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnVGh1cnNkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiA0LCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ0ZyaWRheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDUsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnU2F0dXJkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiA2LCAnb3BlbicgOiBmYWxzZSB9KTtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdTdW5kYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAwLCAnb3BlbicgOiBmYWxzZSB9KTtcblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgKiB1cGRhdGUgdGhlIGdpdmVuIGRheXMgc3RhcnQgYW5kIGZpbmlzaCB0aW1lcyBhbmQgd2hldGhlciB0aGUgb2ZmaWNlIGlzIG9wZW4gb24gdGhhdCBkYXlcblx0ICovXG5cdHVwZGF0ZUhvdXJzKGRheSwgbmV3U3RhcnQsIG5ld0ZpbmlzaCwgbmV3T3Blbikge1xuXHRcdHRoaXMudXBkYXRlKHtcblx0XHRcdGRheVxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0c3RhcnQ6IG5ld1N0YXJ0LFxuXHRcdFx0XHRmaW5pc2g6IG5ld0ZpbmlzaCxcblx0XHRcdFx0b3BlbjogbmV3T3BlblxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc2VydmVyIHRpbWUgKHV0YykgaXMgd2l0aGluIHRoZSBvZmZpY2UgaG91cnMgb2YgdGhhdCBkYXlcblx0ICogcmV0dXJucyB0cnVlIG9yIGZhbHNlXG5cdCAqL1xuXHRpc05vd1dpdGhpbkhvdXJzKCkge1xuXHRcdC8vIGdldCBjdXJyZW50IHRpbWUgb24gc2VydmVyIGluIHV0Y1xuXHRcdC8vIHZhciBjdCA9IG1vbWVudCgpLnV0YygpO1xuXHRcdGNvbnN0IGN1cnJlbnRUaW1lID0gbW9tZW50LnV0Yyhtb21lbnQoKS51dGMoKS5mb3JtYXQoJ2RkZGQ6SEg6bW0nKSwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGdldCB0b2RheXMgb2ZmaWNlIGhvdXJzIGZyb20gZGJcblx0XHRjb25zdCB0b2RheXNPZmZpY2VIb3VycyA9IHRoaXMuZmluZE9uZSh7ZGF5OiBjdXJyZW50VGltZS5mb3JtYXQoJ2RkZGQnKX0pO1xuXHRcdGlmICghdG9kYXlzT2ZmaWNlSG91cnMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBpZiBvZmZpY2VzIGFyZSBvcGVuIHRvZGF5XG5cdFx0aWYgKHRvZGF5c09mZmljZUhvdXJzLm9wZW4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnQgPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5zdGFydCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblx0XHRjb25zdCBmaW5pc2ggPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5maW5pc2ggfWAsICdkZGRkOkhIOm1tJyk7XG5cblx0XHQvLyBjb25zb2xlLmxvZyhmaW5pc2guaXNCZWZvcmUoc3RhcnQpKTtcblx0XHRpZiAoZmluaXNoLmlzQmVmb3JlKHN0YXJ0KSkge1xuXHRcdFx0Ly8gZmluaXNoLmRheShmaW5pc2guZGF5KCkrMSk7XG5cdFx0XHRmaW5pc2guYWRkKDEsICdkYXlzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzdWx0ID0gY3VycmVudFRpbWUuaXNCZXR3ZWVuKHN0YXJ0LCBmaW5pc2gpO1xuXG5cdFx0Ly8gaW5CZXR3ZWVuICBjaGVja1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRpc09wZW5pbmdUaW1lKCkge1xuXHRcdC8vIGdldCBjdXJyZW50IHRpbWUgb24gc2VydmVyIGluIHV0Y1xuXHRcdGNvbnN0IGN1cnJlbnRUaW1lID0gbW9tZW50LnV0Yyhtb21lbnQoKS51dGMoKS5mb3JtYXQoJ2RkZGQ6SEg6bW0nKSwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGdldCB0b2RheXMgb2ZmaWNlIGhvdXJzIGZyb20gZGJcblx0XHRjb25zdCB0b2RheXNPZmZpY2VIb3VycyA9IHRoaXMuZmluZE9uZSh7ZGF5OiBjdXJyZW50VGltZS5mb3JtYXQoJ2RkZGQnKX0pO1xuXHRcdGlmICghdG9kYXlzT2ZmaWNlSG91cnMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBpZiBvZmZpY2VzIGFyZSBvcGVuIHRvZGF5XG5cdFx0aWYgKHRvZGF5c09mZmljZUhvdXJzLm9wZW4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnQgPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5zdGFydCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdHJldHVybiBzdGFydC5pc1NhbWUoY3VycmVudFRpbWUsICdtaW51dGUnKTtcblx0fVxuXG5cdGlzQ2xvc2luZ1RpbWUoKSB7XG5cdFx0Ly8gZ2V0IGN1cnJlbnQgdGltZSBvbiBzZXJ2ZXIgaW4gdXRjXG5cdFx0Y29uc3QgY3VycmVudFRpbWUgPSBtb21lbnQudXRjKG1vbWVudCgpLnV0YygpLmZvcm1hdCgnZGRkZDpISDptbScpLCAnZGRkZDpISDptbScpO1xuXG5cdFx0Ly8gZ2V0IHRvZGF5cyBvZmZpY2UgaG91cnMgZnJvbSBkYlxuXHRcdGNvbnN0IHRvZGF5c09mZmljZUhvdXJzID0gdGhpcy5maW5kT25lKHtkYXk6IGN1cnJlbnRUaW1lLmZvcm1hdCgnZGRkZCcpfSk7XG5cdFx0aWYgKCF0b2RheXNPZmZpY2VIb3Vycykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmlzaCA9IG1vbWVudC51dGMoYCR7IHRvZGF5c09mZmljZUhvdXJzLmRheSB9OiR7IHRvZGF5c09mZmljZUhvdXJzLmZpbmlzaCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdHJldHVybiBmaW5pc2guaXNTYW1lKGN1cnJlbnRUaW1lLCAnbWludXRlJyk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyID0gbmV3IExpdmVjaGF0T2ZmaWNlSG91cigpO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbmNsYXNzIExpdmVjaGF0VmlzaXRvcnMgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF92aXNpdG9yJyk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB2aXNpdG9yIGJ5IHRva2VuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cblx0ICovXG5cdGdldFZpc2l0b3JCeVRva2VuKHRva2VuLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR0b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBGaW5kIHZpc2l0b3JzIGJ5IF9pZFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBWaXNpdG9yIHRva2VuXG5cdCAqL1xuXHRmaW5kQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdF9pZFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuXHQgKi9cblx0ZmluZFZpc2l0b3JCeVRva2VuKHRva2VuKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR0b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcblx0fVxuXG5cdHVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSA9IHRydWUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdHRva2VuXG5cdFx0fTtcblxuXHRcdGlmICghb3ZlcndyaXRlKSB7XG5cdFx0XHRjb25zdCB1c2VyID0gdGhpcy5maW5kT25lKHF1ZXJ5LCB7IGZpZWxkczogeyBsaXZlY2hhdERhdGE6IDEgfSB9KTtcblx0XHRcdGlmICh1c2VyLmxpdmVjaGF0RGF0YSAmJiB0eXBlb2YgdXNlci5saXZlY2hhdERhdGFba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRbYGxpdmVjaGF0RGF0YS4keyBrZXkgfWBdOiB2YWx1ZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG5cdH1cblxuXHQvKipcblx0ICogRmluZCBhIHZpc2l0b3IgYnkgdGhlaXIgcGhvbmUgbnVtYmVyXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVXNlciBmcm9tIGRiXG5cdCAqL1xuXHRmaW5kT25lVmlzaXRvckJ5UGhvbmUocGhvbmUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdCdwaG9uZS5waG9uZU51bWJlcic6IHBob25lXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgbmV4dCB2aXNpdG9yIG5hbWVcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgbmV4dCB2aXNpdG9yIG5hbWVcblx0ICovXG5cdGdldE5leHRWaXNpdG9yVXNlcm5hbWUoKSB7XG5cdFx0Y29uc3Qgc2V0dGluZ3NSYXcgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdFx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoc2V0dGluZ3NSYXcuZmluZEFuZE1vZGlmeSwgc2V0dGluZ3NSYXcpO1xuXG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRfaWQ6ICdMaXZlY2hhdF9ndWVzdF9jb3VudCdcblx0XHR9O1xuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JGluYzoge1xuXHRcdFx0XHR2YWx1ZTogMVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBsaXZlY2hhdENvdW50ID0gZmluZEFuZE1vZGlmeShxdWVyeSwgbnVsbCwgdXBkYXRlKTtcblxuXHRcdHJldHVybiBgZ3Vlc3QtJHsgbGl2ZWNoYXRDb3VudC52YWx1ZS52YWx1ZSArIDEgfWA7XG5cdH1cblxuXHR1cGRhdGVCeUlkKF9pZCwgdXBkYXRlKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkIH0sIHVwZGF0ZSk7XG5cdH1cblxuXHRzYXZlR3Vlc3RCeUlkKF9pZCwgZGF0YSkge1xuXHRcdGNvbnN0IHNldERhdGEgPSB7fTtcblx0XHRjb25zdCB1bnNldERhdGEgPSB7fTtcblxuXHRcdGlmIChkYXRhLm5hbWUpIHtcblx0XHRcdGlmICghXy5pc0VtcHR5KHMudHJpbShkYXRhLm5hbWUpKSkge1xuXHRcdFx0XHRzZXREYXRhLm5hbWUgPSBzLnRyaW0oZGF0YS5uYW1lKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVuc2V0RGF0YS5uYW1lID0gMTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGF0YS5lbWFpbCkge1xuXHRcdFx0aWYgKCFfLmlzRW1wdHkocy50cmltKGRhdGEuZW1haWwpKSkge1xuXHRcdFx0XHRzZXREYXRhLnZpc2l0b3JFbWFpbHMgPSBbXG5cdFx0XHRcdFx0eyBhZGRyZXNzOiBzLnRyaW0oZGF0YS5lbWFpbCkgfVxuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dW5zZXREYXRhLnZpc2l0b3JFbWFpbHMgPSAxO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkYXRhLnBob25lKSB7XG5cdFx0XHRpZiAoIV8uaXNFbXB0eShzLnRyaW0oZGF0YS5waG9uZSkpKSB7XG5cdFx0XHRcdHNldERhdGEucGhvbmUgPSBbXG5cdFx0XHRcdFx0eyBwaG9uZU51bWJlcjogcy50cmltKGRhdGEucGhvbmUpIH1cblx0XHRcdFx0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVuc2V0RGF0YS5waG9uZSA9IDE7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0ge307XG5cblx0XHRpZiAoIV8uaXNFbXB0eShzZXREYXRhKSkge1xuXHRcdFx0dXBkYXRlLiRzZXQgPSBzZXREYXRhO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KHVuc2V0RGF0YSkpIHtcblx0XHRcdHVwZGF0ZS4kdW5zZXQgPSB1bnNldERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKF8uaXNFbXB0eSh1cGRhdGUpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgdXBkYXRlKTtcblx0fVxuXG5cdGZpbmRPbmVHdWVzdEJ5RW1haWxBZGRyZXNzKGVtYWlsQWRkcmVzcykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3Zpc2l0b3JFbWFpbHMuYWRkcmVzcyc6IG5ldyBSZWdFeHAoYF4keyBzLmVzY2FwZVJlZ0V4cChlbWFpbEFkZHJlc3MpIH0kYCwgJ2knKVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5KTtcblx0fVxuXG5cdHNhdmVHdWVzdEVtYWlsUGhvbmVCeUlkKF9pZCwgZW1haWxzLCBwaG9uZXMpIHtcblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkYWRkVG9TZXQ6IHt9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHNhdmVFbWFpbCA9IFtdLmNvbmNhdChlbWFpbHMpXG5cdFx0XHQuZmlsdGVyKGVtYWlsID0+IGVtYWlsICYmIGVtYWlsLnRyaW0oKSlcblx0XHRcdC5tYXAoZW1haWwgPT4ge1xuXHRcdFx0XHRyZXR1cm4geyBhZGRyZXNzOiBlbWFpbCB9O1xuXHRcdFx0fSk7XG5cblx0XHRpZiAoc2F2ZUVtYWlsLmxlbmd0aCA+IDApIHtcblx0XHRcdHVwZGF0ZS4kYWRkVG9TZXQudmlzaXRvckVtYWlscyA9IHsgJGVhY2g6IHNhdmVFbWFpbCB9O1xuXHRcdH1cblxuXHRcdGNvbnN0IHNhdmVQaG9uZSA9IFtdLmNvbmNhdChwaG9uZXMpXG5cdFx0XHQuZmlsdGVyKHBob25lID0+IHBob25lICYmIHBob25lLnRyaW0oKS5yZXBsYWNlKC9bXlxcZF0vZywgJycpKVxuXHRcdFx0Lm1hcChwaG9uZSA9PiB7XG5cdFx0XHRcdHJldHVybiB7IHBob25lTnVtYmVyOiBwaG9uZSB9O1xuXHRcdFx0fSk7XG5cblx0XHRpZiAoc2F2ZVBob25lLmxlbmd0aCA+IDApIHtcblx0XHRcdHVwZGF0ZS4kYWRkVG9TZXQucGhvbmUgPSB7ICRlYWNoOiBzYXZlUGhvbmUgfTtcblx0XHR9XG5cblx0XHRpZiAoIXVwZGF0ZS4kYWRkVG9TZXQudmlzaXRvckVtYWlscyAmJiAhdXBkYXRlLiRhZGRUb1NldC5waG9uZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZCB9LCB1cGRhdGUpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMaXZlY2hhdFZpc2l0b3JzKCk7XG4iLCIvKiBnbG9iYWxzIEhUVFAgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuaW1wb3J0IFVBUGFyc2VyIGZyb20gJ3VhLXBhcnNlci1qcyc7XG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuTGl2ZWNoYXQgPSB7XG5cdGhpc3RvcnlNb25pdG9yVHlwZTogJ3VybCcsXG5cblx0bG9nZ2VyOiBuZXcgTG9nZ2VyKCdMaXZlY2hhdCcsIHtcblx0XHRzZWN0aW9uczoge1xuXHRcdFx0d2ViaG9vazogJ1dlYmhvb2snXG5cdFx0fVxuXHR9KSxcblxuXHRnZXROZXh0QWdlbnQoZGVwYXJ0bWVudCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKSA9PT0gJ0V4dGVybmFsJykge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgcXVlcnlTdHJpbmcgPSBkZXBhcnRtZW50ID8gYD9kZXBhcnRtZW50SWQ9JHsgZGVwYXJ0bWVudCB9YCA6ICcnO1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9FeHRlcm5hbF9RdWV1ZV9VUkwnKSB9JHsgcXVlcnlTdHJpbmcgfWAsIHtcblx0XHRcdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRcdFx0J1VzZXItQWdlbnQnOiAnUm9ja2V0Q2hhdCBTZXJ2ZXInLFxuXHRcdFx0XHRcdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdFx0XHQnWC1Sb2NrZXRDaGF0LVNlY3JldC1Ub2tlbic6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9FeHRlcm5hbF9RdWV1ZV9Ub2tlbicpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0ICYmIHJlc3VsdC5kYXRhICYmIHJlc3VsdC5kYXRhLnVzZXJuYW1lKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBhZ2VudCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUocmVzdWx0LmRhdGEudXNlcm5hbWUpO1xuXG5cdFx0XHRcdFx0XHRpZiAoYWdlbnQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRhZ2VudElkOiBhZ2VudC5faWQsXG5cdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgcmVxdWVzdGluZyBhZ2VudCBmcm9tIGV4dGVybmFsIHF1ZXVlLicsIGUpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1hZ2VudC1vbmxpbmUnLCAnU29ycnksIG5vIG9ubGluZSBhZ2VudHMnKTtcblx0XHR9IGVsc2UgaWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZ2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudChkZXBhcnRtZW50KTtcblx0XHR9XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldE5leHRBZ2VudCgpO1xuXHR9LFxuXHRnZXRBZ2VudHMoZGVwYXJ0bWVudCkge1xuXHRcdGlmIChkZXBhcnRtZW50KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRBZ2VudHMoKTtcblx0XHR9XG5cdH0sXG5cdGdldE9ubGluZUFnZW50cyhkZXBhcnRtZW50KSB7XG5cdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZ2V0T25saW5lRm9yRGVwYXJ0bWVudChkZXBhcnRtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKTtcblx0XHR9XG5cdH0sXG5cdGdldFJlcXVpcmVkRGVwYXJ0bWVudChvbmxpbmVSZXF1aXJlZCA9IHRydWUpIHtcblx0XHRjb25zdCBkZXBhcnRtZW50cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kRW5hYmxlZFdpdGhBZ2VudHMoKTtcblxuXHRcdHJldHVybiBkZXBhcnRtZW50cy5mZXRjaCgpLmZpbmQoKGRlcHQpID0+IHtcblx0XHRcdGlmICghZGVwdC5zaG93T25SZWdpc3RyYXRpb24pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFvbmxpbmVSZXF1aXJlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG9ubGluZUFnZW50cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5nZXRPbmxpbmVGb3JEZXBhcnRtZW50KGRlcHQuX2lkKTtcblx0XHRcdHJldHVybiBvbmxpbmVBZ2VudHMuY291bnQoKSA+IDA7XG5cdFx0fSk7XG5cdH0sXG5cdGdldFJvb20oZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCkge1xuXHRcdGxldCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpO1xuXHRcdGxldCBuZXdSb29tID0gZmFsc2U7XG5cblx0XHRpZiAocm9vbSAmJiAhcm9vbS5vcGVuKSB7XG5cdFx0XHRtZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0cm9vbSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdFx0Ly8gaWYgbm8gZGVwYXJ0bWVudCBzZWxlY3RlZCB2ZXJpZnkgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIGFjdGl2ZSBhbmQgcGljayB0aGUgZmlyc3Rcblx0XHRcdGlmICghYWdlbnQgJiYgIWd1ZXN0LmRlcGFydG1lbnQpIHtcblx0XHRcdFx0Y29uc3QgZGVwYXJ0bWVudCA9IHRoaXMuZ2V0UmVxdWlyZWREZXBhcnRtZW50KCk7XG5cblx0XHRcdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdFx0XHRndWVzdC5kZXBhcnRtZW50ID0gZGVwYXJ0bWVudC5faWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gZGVsZWdhdGUgcm9vbSBjcmVhdGlvbiB0byBRdWV1ZU1ldGhvZHNcblx0XHRcdGNvbnN0IHJvdXRpbmdNZXRob2QgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKTtcblx0XHRcdHJvb20gPSBSb2NrZXRDaGF0LlF1ZXVlTWV0aG9kc1tyb3V0aW5nTWV0aG9kXShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KTtcblxuXHRcdFx0bmV3Um9vbSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udi50b2tlbiAhPT0gZ3Vlc3QudG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Nhbm5vdC1hY2Nlc3Mtcm9vbScpO1xuXHRcdH1cblxuXHRcdGlmIChuZXdSb29tKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRSb29tSWRCeVRva2VuKGd1ZXN0LnRva2VuLCByb29tLl9pZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHsgcm9vbSwgbmV3Um9vbSB9O1xuXHR9LFxuXHRzZW5kTWVzc2FnZSh7IGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQgfSkge1xuXHRcdGNvbnN0IHsgcm9vbSwgbmV3Um9vbSB9ID0gdGhpcy5nZXRSb29tKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpO1xuXHRcdGlmIChndWVzdC5uYW1lKSB7XG5cdFx0XHRtZXNzYWdlLmFsaWFzID0gZ3Vlc3QubmFtZTtcblx0XHR9XG5cblx0XHQvLyByZXR1cm4gbWVzc2FnZXM7XG5cdFx0cmV0dXJuIF8uZXh0ZW5kKFJvY2tldENoYXQuc2VuZE1lc3NhZ2UoZ3Vlc3QsIG1lc3NhZ2UsIHJvb20pLCB7IG5ld1Jvb20sIHNob3dDb25uZWN0aW5nOiB0aGlzLnNob3dDb25uZWN0aW5nKCkgfSk7XG5cdH0sXG5cdHJlZ2lzdGVyR3Vlc3QoeyB0b2tlbiwgbmFtZSwgZW1haWwsIGRlcGFydG1lbnQsIHBob25lLCB1c2VybmFtZSB9ID0ge30pIHtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblxuXHRcdGxldCB1c2VySWQ7XG5cdFx0Y29uc3QgdXBkYXRlVXNlciA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0dG9rZW5cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3QgdXNlciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKHVzZXIpIHtcblx0XHRcdHVzZXJJZCA9IHVzZXIuX2lkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIXVzZXJuYW1lKSB7XG5cdFx0XHRcdHVzZXJuYW1lID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXROZXh0VmlzaXRvclVzZXJuYW1lKCk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBleGlzdGluZ1VzZXIgPSBudWxsO1xuXG5cdFx0XHRpZiAocy50cmltKGVtYWlsKSAhPT0gJycgJiYgKGV4aXN0aW5nVXNlciA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZUd1ZXN0QnlFbWFpbEFkZHJlc3MoZW1haWwpKSkge1xuXHRcdFx0XHR1c2VySWQgPSBleGlzdGluZ1VzZXIuX2lkO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgdXNlckRhdGEgPSB7XG5cdFx0XHRcdFx0dXNlcm5hbWUsXG5cdFx0XHRcdFx0ZGVwYXJ0bWVudFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGlmICh0aGlzLmNvbm5lY3Rpb24pIHtcblx0XHRcdFx0XHR1c2VyRGF0YS51c2VyQWdlbnQgPSB0aGlzLmNvbm5lY3Rpb24uaHR0cEhlYWRlcnNbJ3VzZXItYWdlbnQnXTtcblx0XHRcdFx0XHR1c2VyRGF0YS5pcCA9IHRoaXMuY29ubmVjdGlvbi5odHRwSGVhZGVyc1sneC1yZWFsLWlwJ10gfHwgdGhpcy5jb25uZWN0aW9uLmh0dHBIZWFkZXJzWyd4LWZvcndhcmRlZC1mb3InXSB8fCB0aGlzLmNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcztcblx0XHRcdFx0XHR1c2VyRGF0YS5ob3N0ID0gdGhpcy5jb25uZWN0aW9uLmh0dHBIZWFkZXJzLmhvc3Q7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR1c2VySWQgPSBMaXZlY2hhdFZpc2l0b3JzLmluc2VydCh1c2VyRGF0YSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHBob25lKSB7XG5cdFx0XHR1cGRhdGVVc2VyLiRzZXQucGhvbmUgPSBbXG5cdFx0XHRcdHsgcGhvbmVOdW1iZXI6IHBob25lLm51bWJlciB9XG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdGlmIChlbWFpbCAmJiBlbWFpbC50cmltKCkgIT09ICcnKSB7XG5cdFx0XHR1cGRhdGVVc2VyLiRzZXQudmlzaXRvckVtYWlscyA9IFtcblx0XHRcdFx0eyBhZGRyZXNzOiBlbWFpbCB9XG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdGlmIChuYW1lKSB7XG5cdFx0XHR1cGRhdGVVc2VyLiRzZXQubmFtZSA9IG5hbWU7XG5cdFx0fVxuXG5cdFx0TGl2ZWNoYXRWaXNpdG9ycy51cGRhdGVCeUlkKHVzZXJJZCwgdXBkYXRlVXNlcik7XG5cblx0XHRyZXR1cm4gdXNlcklkO1xuXHR9LFxuXHRzZXREZXBhcnRtZW50Rm9yR3Vlc3QoeyB0b2tlbiwgZGVwYXJ0bWVudCB9ID0ge30pIHtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVwZGF0ZVVzZXIgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGRlcGFydG1lbnRcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3QgdXNlciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRcdGlmICh1c2VyKSB7XG5cdFx0XHRyZXR1cm4gTWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwgdXBkYXRlVXNlcik7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0c2F2ZUd1ZXN0KHsgX2lkLCBuYW1lLCBlbWFpbCwgcGhvbmUgfSkge1xuXHRcdGNvbnN0IHVwZGF0ZURhdGEgPSB7fTtcblxuXHRcdGlmIChuYW1lKSB7XG5cdFx0XHR1cGRhdGVEYXRhLm5hbWUgPSBuYW1lO1xuXHRcdH1cblx0XHRpZiAoZW1haWwpIHtcblx0XHRcdHVwZGF0ZURhdGEuZW1haWwgPSBlbWFpbDtcblx0XHR9XG5cdFx0aWYgKHBob25lKSB7XG5cdFx0XHR1cGRhdGVEYXRhLnBob25lID0gcGhvbmU7XG5cdFx0fVxuXHRcdGNvbnN0IHJldCA9IExpdmVjaGF0VmlzaXRvcnMuc2F2ZUd1ZXN0QnlJZChfaWQsIHVwZGF0ZURhdGEpO1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQuc2F2ZUd1ZXN0JywgdXBkYXRlRGF0YSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdGNsb3NlUm9vbSh7IHVzZXIsIHZpc2l0b3IsIHJvb20sIGNvbW1lbnQgfSkge1xuXHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG5cblx0XHRjb25zdCBjbG9zZURhdGEgPSB7XG5cdFx0XHRjbG9zZWRBdDogbm93LFxuXHRcdFx0Y2hhdER1cmF0aW9uOiAobm93LmdldFRpbWUoKSAtIHJvb20udHMpIC8gMTAwMFxuXHRcdH07XG5cblx0XHRpZiAodXNlcikge1xuXHRcdFx0Y2xvc2VEYXRhLmNsb3NlciA9ICd1c2VyJztcblx0XHRcdGNsb3NlRGF0YS5jbG9zZWRCeSA9IHtcblx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fSBlbHNlIGlmICh2aXNpdG9yKSB7XG5cdFx0XHRjbG9zZURhdGEuY2xvc2VyID0gJ3Zpc2l0b3InO1xuXHRcdFx0Y2xvc2VEYXRhLmNsb3NlZEJ5ID0ge1xuXHRcdFx0XHRfaWQ6IHZpc2l0b3IuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogdmlzaXRvci51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jbG9zZUJ5Um9vbUlkKHJvb20uX2lkLCBjbG9zZURhdGEpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5jbG9zZUJ5Um9vbUlkKHJvb20uX2lkLCBjbG9zZURhdGEpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IHtcblx0XHRcdHQ6ICdsaXZlY2hhdC1jbG9zZScsXG5cdFx0XHRtc2c6IGNvbW1lbnQsXG5cdFx0XHRncm91cGFibGU6IGZhbHNlXG5cdFx0fTtcblxuXHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UodXNlciwgbWVzc2FnZSwgcm9vbSk7XG5cblx0XHRpZiAocm9vbS5zZXJ2ZWRCeSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5oaWRlQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHJvb20uc2VydmVkQnkuX2lkKTtcblx0XHR9XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlQ29tbWFuZFdpdGhSb29tSWRBbmRVc2VyKCdwcm9tcHRUcmFuc2NyaXB0Jywgcm9vbS5faWQsIGNsb3NlRGF0YS5jbG9zZWRCeSk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5jbG9zZVJvb20nLCByb29tKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXG5cdGdldEluaXRTZXR0aW5ncygpIHtcblx0XHRjb25zdCBzZXR0aW5ncyA9IHt9O1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE5vdEhpZGRlblB1YmxpYyhbXG5cdFx0XHQnTGl2ZWNoYXRfdGl0bGUnLFxuXHRcdFx0J0xpdmVjaGF0X3RpdGxlX2NvbG9yJyxcblx0XHRcdCdMaXZlY2hhdF9lbmFibGVkJyxcblx0XHRcdCdMaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfYWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfc3VjY2Vzc19tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLFxuXHRcdFx0J0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJyxcblx0XHRcdCdMaXZlY2hhdF92aWRlb2NhbGxfZW5hYmxlZCcsXG5cdFx0XHQnSml0c2lfRW5hYmxlZCcsXG5cdFx0XHQnTGFuZ3VhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0Jyxcblx0XHRcdCdMaXZlY2hhdF90cmFuc2NyaXB0X21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X2ZpbGV1cGxvYWRfZW5hYmxlZCcsXG5cdFx0XHQnRmlsZVVwbG9hZF9FbmFibGVkJyxcblx0XHRcdCdMaXZlY2hhdF9jb252ZXJzYXRpb25fZmluaXNoZWRfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfbmFtZV9maWVsZF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfZW1haWxfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0nXG5cblx0XHRdKS5mb3JFYWNoKChzZXR0aW5nKSA9PiB7XG5cdFx0XHRzZXR0aW5nc1tzZXR0aW5nLl9pZF0gPSBzZXR0aW5nLnZhbHVlO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHNldHRpbmdzO1xuXHR9LFxuXG5cdHNhdmVSb29tSW5mbyhyb29tRGF0YSwgZ3Vlc3REYXRhKSB7XG5cdFx0aWYgKChyb29tRGF0YS50b3BpYyAhPSBudWxsIHx8IHJvb21EYXRhLnRhZ3MgIT0gbnVsbCkgJiYgIVJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFRvcGljQW5kVGFnc0J5SWQocm9vbURhdGEuX2lkLCByb29tRGF0YS50b3BpYywgcm9vbURhdGEudGFncykpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5zYXZlUm9vbScsIHJvb21EYXRhKTtcblx0XHR9KTtcblxuXHRcdGlmICghXy5pc0VtcHR5KGd1ZXN0RGF0YS5uYW1lKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEZuYW1lQnlJZChyb29tRGF0YS5faWQsIGd1ZXN0RGF0YS5uYW1lKSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZURpc3BsYXlOYW1lQnlSb29tSWQocm9vbURhdGEuX2lkLCBndWVzdERhdGEubmFtZSk7XG5cdFx0fVxuXHR9LFxuXG5cdGNsb3NlT3BlbkNoYXRzKHVzZXJJZCwgY29tbWVudCkge1xuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VySWQpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlBZ2VudCh1c2VySWQpLmZvckVhY2goKHJvb20pID0+IHtcblx0XHRcdHRoaXMuY2xvc2VSb29tKHsgdXNlciwgcm9vbSwgY29tbWVudH0pO1xuXHRcdH0pO1xuXHR9LFxuXG5cdGZvcndhcmRPcGVuQ2hhdHModXNlcklkKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeUFnZW50KHVzZXJJZCkuZm9yRWFjaCgocm9vbSkgPT4ge1xuXHRcdFx0Y29uc3QgZ3Vlc3QgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVCeUlkKHJvb20udi5faWQpO1xuXHRcdFx0dGhpcy50cmFuc2Zlcihyb29tLCBndWVzdCwgeyBkZXBhcnRtZW50SWQ6IGd1ZXN0LmRlcGFydG1lbnQgfSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c2F2ZVBhZ2VIaXN0b3J5KHRva2VuLCByb29tSWQsIHBhZ2VJbmZvKSB7XG5cdFx0aWYgKHBhZ2VJbmZvLmNoYW5nZSA9PT0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5oaXN0b3J5TW9uaXRvclR5cGUpIHtcblxuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKCdyb2NrZXQuY2F0Jyk7XG5cblx0XHRcdGNvbnN0IHBhZ2VUaXRsZSA9IHBhZ2VJbmZvLnRpdGxlO1xuXHRcdFx0Y29uc3QgcGFnZVVybCA9IHBhZ2VJbmZvLmxvY2F0aW9uLmhyZWY7XG5cdFx0XHRjb25zdCBleHRyYURhdGEgPSB7XG5cdFx0XHRcdG5hdmlnYXRpb246IHtcblx0XHRcdFx0XHRwYWdlOiBwYWdlSW5mbyxcblx0XHRcdFx0XHR0b2tlblxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0XHQvLyBrZWVwIGhpc3Rvcnkgb2YgdW5yZWdpc3RlcmVkIHZpc2l0b3JzIGZvciAxIG1vbnRoXG5cdFx0XHRcdGNvbnN0IGtlZXBIaXN0b3J5TWlsaXNlY29uZHMgPSAyNTkyMDAwMDAwO1xuXHRcdFx0XHRleHRyYURhdGEuZXhwaXJlQXQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIGtlZXBIaXN0b3J5TWlsaXNlY29uZHM7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X1Zpc2l0b3JfbmF2aWdhdGlvbl9hc19hX21lc3NhZ2UnKSkge1xuXHRcdFx0XHRleHRyYURhdGEuX2hpZGRlbiA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVOYXZpZ2F0aW9uSGlzdG9yeVdpdGhSb29tSWRNZXNzYWdlQW5kVXNlcihyb29tSWQsIGAkeyBwYWdlVGl0bGUgfSAtICR7IHBhZ2VVcmwgfWAsIHVzZXIsIGV4dHJhRGF0YSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuO1xuXHR9LFxuXG5cdHRyYW5zZmVyKHJvb20sIGd1ZXN0LCB0cmFuc2ZlckRhdGEpIHtcblx0XHRsZXQgYWdlbnQ7XG5cblx0XHRpZiAodHJhbnNmZXJEYXRhLnVzZXJJZCkge1xuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRyYW5zZmVyRGF0YS51c2VySWQpO1xuXHRcdFx0YWdlbnQgPSB7XG5cdFx0XHRcdGFnZW50SWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWdlbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldE5leHRBZ2VudCh0cmFuc2ZlckRhdGEuZGVwYXJ0bWVudElkKTtcblx0XHR9XG5cblx0XHRjb25zdCBzZXJ2ZWRCeSA9IHJvb20uc2VydmVkQnk7XG5cblx0XHRpZiAoYWdlbnQgJiYgYWdlbnQuYWdlbnRJZCAhPT0gc2VydmVkQnkuX2lkKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jaGFuZ2VBZ2VudEJ5Um9vbUlkKHJvb20uX2lkLCBhZ2VudCk7XG5cblx0XHRcdGNvbnN0IHN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdG5hbWU6IGd1ZXN0Lm5hbWUgfHwgZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRcdGFsZXJ0OiB0cnVlLFxuXHRcdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0XHR1bnJlYWQ6IDEsXG5cdFx0XHRcdHVzZXJNZW50aW9uczogMSxcblx0XHRcdFx0Z3JvdXBNZW50aW9uczogMCxcblx0XHRcdFx0dToge1xuXHRcdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdFx0fSxcblx0XHRcdFx0dDogJ2wnLFxuXHRcdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRcdG1vYmlsZVB1c2hOb3RpZmljYXRpb25zOiAnYWxsJyxcblx0XHRcdFx0ZW1haWxOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHRcdFx0fTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMucmVtb3ZlQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHNlcnZlZEJ5Ll9pZCk7XG5cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuaW5zZXJ0KHN1YnNjcmlwdGlvbkRhdGEpO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuaW5jVXNlcnNDb3VudEJ5SWQocm9vbS5faWQpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlcihyb29tLl9pZCwgeyBfaWQ6IHNlcnZlZEJ5Ll9pZCwgdXNlcm5hbWU6IHNlcnZlZEJ5LnVzZXJuYW1lIH0pO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckpvaW5XaXRoUm9vbUlkQW5kVXNlcihyb29tLl9pZCwgeyBfaWQ6IGFnZW50LmFnZW50SWQsIHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZSB9KTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0uZW1pdChyb29tLl9pZCwge1xuXHRcdFx0XHR0eXBlOiAnYWdlbnREYXRhJyxcblx0XHRcdFx0ZGF0YTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHNlbmRSZXF1ZXN0KHBvc3REYXRhLCBjYWxsYmFjaywgdHJ5aW5nID0gMSkge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0J1gtUm9ja2V0Q2hhdC1MaXZlY2hhdC1Ub2tlbic6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRkYXRhOiBwb3N0RGF0YVxuXHRcdFx0fTtcblx0XHRcdHJldHVybiBIVFRQLnBvc3QoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnKSwgb3B0aW9ucyk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5sb2dnZXIud2ViaG9vay5lcnJvcihgUmVzcG9uc2UgZXJyb3Igb24gJHsgdHJ5aW5nIH0gdHJ5IC0+YCwgZSk7XG5cdFx0XHQvLyB0cnkgMTAgdGltZXMgYWZ0ZXIgMTAgc2Vjb25kcyBlYWNoXG5cdFx0XHRpZiAodHJ5aW5nIDwgMTApIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5sb2dnZXIud2ViaG9vay53YXJuKCdXaWxsIHRyeSBhZ2FpbiBpbiAxMCBzZWNvbmRzIC4uLicpO1xuXHRcdFx0XHR0cnlpbmcrKztcblx0XHRcdFx0c2V0VGltZW91dChNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRSZXF1ZXN0KHBvc3REYXRhLCBjYWxsYmFjaywgdHJ5aW5nKTtcblx0XHRcdFx0fSksIDEwMDAwKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0Z2V0TGl2ZWNoYXRSb29tR3Vlc3RJbmZvKHJvb20pIHtcblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZChyb29tLnYuX2lkKTtcblx0XHRjb25zdCBhZ2VudCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvb20uc2VydmVkQnkgJiYgcm9vbS5zZXJ2ZWRCeS5faWQpO1xuXG5cdFx0Y29uc3QgdWEgPSBuZXcgVUFQYXJzZXIoKTtcblx0XHR1YS5zZXRVQSh2aXNpdG9yLnVzZXJBZ2VudCk7XG5cblx0XHRjb25zdCBwb3N0RGF0YSA9IHtcblx0XHRcdF9pZDogcm9vbS5faWQsXG5cdFx0XHRsYWJlbDogcm9vbS5mbmFtZSB8fCByb29tLmxhYmVsLCAvLyB1c2luZyBzYW1lIGZpZWxkIGZvciBjb21wYXRpYmlsaXR5XG5cdFx0XHR0b3BpYzogcm9vbS50b3BpYyxcblx0XHRcdGNyZWF0ZWRBdDogcm9vbS50cyxcblx0XHRcdGxhc3RNZXNzYWdlQXQ6IHJvb20ubG0sXG5cdFx0XHR0YWdzOiByb29tLnRhZ3MsXG5cdFx0XHRjdXN0b21GaWVsZHM6IHJvb20ubGl2ZWNoYXREYXRhLFxuXHRcdFx0dmlzaXRvcjoge1xuXHRcdFx0XHRfaWQ6IHZpc2l0b3IuX2lkLFxuXHRcdFx0XHR0b2tlbjogdmlzaXRvci50b2tlbixcblx0XHRcdFx0bmFtZTogdmlzaXRvci5uYW1lLFxuXHRcdFx0XHR1c2VybmFtZTogdmlzaXRvci51c2VybmFtZSxcblx0XHRcdFx0ZW1haWw6IG51bGwsXG5cdFx0XHRcdHBob25lOiBudWxsLFxuXHRcdFx0XHRkZXBhcnRtZW50OiB2aXNpdG9yLmRlcGFydG1lbnQsXG5cdFx0XHRcdGlwOiB2aXNpdG9yLmlwLFxuXHRcdFx0XHRvczogdWEuZ2V0T1MoKS5uYW1lICYmIChgJHsgdWEuZ2V0T1MoKS5uYW1lIH0gJHsgdWEuZ2V0T1MoKS52ZXJzaW9uIH1gKSxcblx0XHRcdFx0YnJvd3NlcjogdWEuZ2V0QnJvd3NlcigpLm5hbWUgJiYgKGAkeyB1YS5nZXRCcm93c2VyKCkubmFtZSB9ICR7IHVhLmdldEJyb3dzZXIoKS52ZXJzaW9uIH1gKSxcblx0XHRcdFx0Y3VzdG9tRmllbGRzOiB2aXNpdG9yLmxpdmVjaGF0RGF0YVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAoYWdlbnQpIHtcblx0XHRcdHBvc3REYXRhLmFnZW50ID0ge1xuXHRcdFx0XHRfaWQ6IGFnZW50Ll9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lLFxuXHRcdFx0XHRuYW1lOiBhZ2VudC5uYW1lLFxuXHRcdFx0XHRlbWFpbDogbnVsbFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGFnZW50LmVtYWlscyAmJiBhZ2VudC5lbWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRwb3N0RGF0YS5hZ2VudC5lbWFpbCA9IGFnZW50LmVtYWlsc1swXS5hZGRyZXNzO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChyb29tLmNybURhdGEpIHtcblx0XHRcdHBvc3REYXRhLmNybURhdGEgPSByb29tLmNybURhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKHZpc2l0b3IudmlzaXRvckVtYWlscyAmJiB2aXNpdG9yLnZpc2l0b3JFbWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0cG9zdERhdGEudmlzaXRvci5lbWFpbCA9IHZpc2l0b3IudmlzaXRvckVtYWlscztcblx0XHR9XG5cdFx0aWYgKHZpc2l0b3IucGhvbmUgJiYgdmlzaXRvci5waG9uZS5sZW5ndGggPiAwKSB7XG5cdFx0XHRwb3N0RGF0YS52aXNpdG9yLnBob25lID0gdmlzaXRvci5waG9uZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcG9zdERhdGE7XG5cdH0sXG5cblx0YWRkQWdlbnQodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDphZGRBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtYWdlbnQnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0T3BlcmF0b3IodXNlci5faWQsIHRydWUpO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0TGl2ZWNoYXRTdGF0dXModXNlci5faWQsICdhdmFpbGFibGUnKTtcblx0XHRcdHJldHVybiB1c2VyO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRhZGRNYW5hZ2VyKHVzZXJuYW1lKSB7XG5cdFx0Y2hlY2sodXNlcm5hbWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkTWFuYWdlcicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gdXNlcjtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0cmVtb3ZlQWdlbnQodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtYWdlbnQnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0T3BlcmF0b3IodXNlci5faWQsIGZhbHNlKTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldExpdmVjaGF0U3RhdHVzKHVzZXIuX2lkLCAnbm90LWF2YWlsYWJsZScpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHJlbW92ZU1hbmFnZXIodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZU1hbmFnZXInIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXModXNlci5faWQsICdsaXZlY2hhdC1tYW5hZ2VyJyk7XG5cdH0sXG5cblx0c2F2ZURlcGFydG1lbnQoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cykge1xuXHRcdGNoZWNrKF9pZCwgTWF0Y2guTWF5YmUoU3RyaW5nKSk7XG5cblx0XHRjaGVjayhkZXBhcnRtZW50RGF0YSwge1xuXHRcdFx0ZW5hYmxlZDogQm9vbGVhbixcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdGRlc2NyaXB0aW9uOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0c2hvd09uUmVnaXN0cmF0aW9uOiBCb29sZWFuXG5cdFx0fSk7XG5cblx0XHRjaGVjayhkZXBhcnRtZW50QWdlbnRzLCBbXG5cdFx0XHRNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0XHRhZ2VudElkOiBTdHJpbmcsXG5cdFx0XHRcdHVzZXJuYW1lOiBTdHJpbmdcblx0XHRcdH0pXG5cdFx0XSk7XG5cblx0XHRpZiAoX2lkKSB7XG5cdFx0XHRjb25zdCBkZXBhcnRtZW50ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRPbmVCeUlkKF9pZCk7XG5cdFx0XHRpZiAoIWRlcGFydG1lbnQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZGVwYXJ0bWVudC1ub3QtZm91bmQnLCAnRGVwYXJ0bWVudCBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVEZXBhcnRtZW50JyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudChfaWQsIGRlcGFydG1lbnREYXRhLCBkZXBhcnRtZW50QWdlbnRzKTtcblx0fSxcblxuXHRyZW1vdmVEZXBhcnRtZW50KF9pZCkge1xuXHRcdGNoZWNrKF9pZCwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IGRlcGFydG1lbnQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZE9uZUJ5SWQoX2lkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghZGVwYXJ0bWVudCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZGVwYXJ0bWVudC1ub3QtZm91bmQnLCAnRGVwYXJ0bWVudCBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZURlcGFydG1lbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQucmVtb3ZlQnlJZChfaWQpO1xuXHR9LFxuXG5cdHNob3dDb25uZWN0aW5nKCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKSA9PT0gJ0d1ZXN0X1Bvb2wnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X29wZW5faW5xdWllcnlfc2hvd19jb25uZWN0aW5nJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn07XG5cblJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtID0gbmV3IE1ldGVvci5TdHJlYW1lcignbGl2ZWNoYXQtcm9vbScpO1xuXG5Sb2NrZXRDaGF0LkxpdmVjaGF0LnN0cmVhbS5hbGxvd1JlYWQoKHJvb21JZCwgZXh0cmFEYXRhKSA9PiB7XG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXHRpZiAoIXJvb20pIHtcblx0XHRjb25zb2xlLndhcm4oYEludmFsaWQgZXZlbnROYW1lOiBcIiR7IHJvb21JZCB9XCJgKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0aWYgKHJvb20udCA9PT0gJ2wnICYmIGV4dHJhRGF0YSAmJiBleHRyYURhdGEudG9rZW4gJiYgcm9vbS52LnRva2VuID09PSBleHRyYURhdGEudG9rZW4pIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2hpc3RvcnlfbW9uaXRvcl90eXBlJywgKGtleSwgdmFsdWUpID0+IHtcblx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5oaXN0b3J5TW9uaXRvclR5cGUgPSB2YWx1ZTtcbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblJvY2tldENoYXQuUXVldWVNZXRob2RzID0ge1xuXHQvKiBMZWFzdCBBbW91bnQgUXVldWluZyBtZXRob2Q6XG5cdCAqXG5cdCAqIGRlZmF1bHQgbWV0aG9kIHdoZXJlIHRoZSBhZ2VudCB3aXRoIHRoZSBsZWFzdCBudW1iZXJcblx0ICogb2Ygb3BlbiBjaGF0cyBpcyBwYWlyZWQgd2l0aCB0aGUgaW5jb21pbmcgbGl2ZWNoYXRcblx0ICovXG5cdCdMZWFzdF9BbW91bnQnKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpIHtcblx0XHRpZiAoIWFnZW50KSB7XG5cdFx0XHRhZ2VudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TmV4dEFnZW50KGd1ZXN0LmRlcGFydG1lbnQpO1xuXHRcdFx0aWYgKCFhZ2VudCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1hZ2VudC1vbmxpbmUnLCAnU29ycnksIG5vIG9ubGluZSBhZ2VudHMnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVMaXZlY2hhdFJvb21Db3VudCgpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IF8uZXh0ZW5kKHtcblx0XHRcdF9pZDogbWVzc2FnZS5yaWQsXG5cdFx0XHRtc2dzOiAxLFxuXHRcdFx0dXNlcnNDb3VudDogMSxcblx0XHRcdGxtOiBuZXcgRGF0ZSgpLFxuXHRcdFx0Zm5hbWU6IChyb29tSW5mbyAmJiByb29tSW5mby5mbmFtZSkgfHwgZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdC8vIHVzZXJuYW1lczogW2FnZW50LnVzZXJuYW1lLCBndWVzdC51c2VybmFtZV0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdHY6IHtcblx0XHRcdFx0X2lkOiBndWVzdC5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBndWVzdC51c2VybmFtZSxcblx0XHRcdFx0dG9rZW46IG1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdHN0YXR1czogZ3Vlc3Quc3RhdHVzIHx8ICdvbmxpbmUnXG5cdFx0XHR9LFxuXHRcdFx0c2VydmVkQnk6IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHRjbDogZmFsc2UsXG5cdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0d2FpdGluZ1Jlc3BvbnNlOiB0cnVlXG5cdFx0fSwgcm9vbUluZm8pO1xuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9uRGF0YSA9IHtcblx0XHRcdHJpZDogbWVzc2FnZS5yaWQsXG5cdFx0XHRmbmFtZTogZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdGFsZXJ0OiB0cnVlLFxuXHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdHVucmVhZDogMSxcblx0XHRcdHVzZXJNZW50aW9uczogMSxcblx0XHRcdGdyb3VwTWVudGlvbnM6IDAsXG5cdFx0XHR1OiB7XG5cdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0ZW1haWxOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5pbnNlcnQocm9vbSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmluc2VydChzdWJzY3JpcHRpb25EYXRhKTtcblxuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtLmVtaXQocm9vbS5faWQsIHtcblx0XHRcdHR5cGU6ICdhZ2VudERhdGEnLFxuXHRcdFx0ZGF0YTogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKGFnZW50LmFnZW50SWQpXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcm9vbTtcblx0fSxcblx0LyogR3Vlc3QgUG9vbCBRdWV1aW5nIE1ldGhvZDpcblx0ICpcblx0ICogQW4gaW5jb21taW5nIGxpdmVjaGF0IGlzIGNyZWF0ZWQgYXMgYW4gSW5xdWlyeVxuXHQgKiB3aGljaCBpcyBwaWNrZWQgdXAgZnJvbSBhbiBhZ2VudC5cblx0ICogQW4gSW5xdWlyeSBpcyB2aXNpYmxlIHRvIGFsbCBhZ2VudHMgKFRPRE86IGluIHRoZSBjb3JyZWN0IGRlcGFydG1lbnQpXG4gICAgICpcblx0ICogQSByb29tIGlzIHN0aWxsIGNyZWF0ZWQgd2l0aCB0aGUgaW5pdGlhbCBtZXNzYWdlLCBidXQgaXQgaXMgb2NjdXBpZWQgYnlcblx0ICogb25seSB0aGUgY2xpZW50IHVudGlsIHBhaXJlZCB3aXRoIGFuIGFnZW50XG5cdCAqL1xuXHQnR3Vlc3RfUG9vbCcoZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvKSB7XG5cdFx0bGV0IGFnZW50cyA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0T25saW5lQWdlbnRzKGd1ZXN0LmRlcGFydG1lbnQpO1xuXG5cdFx0aWYgKGFnZW50cy5jb3VudCgpID09PSAwICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9ndWVzdF9wb29sX3dpdGhfbm9fYWdlbnRzJykpIHtcblx0XHRcdGFnZW50cyA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0QWdlbnRzKGd1ZXN0LmRlcGFydG1lbnQpO1xuXHRcdH1cblxuXHRcdGlmIChhZ2VudHMuY291bnQoKSA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm8tYWdlbnQtb25saW5lJywgJ1NvcnJ5LCBubyBvbmxpbmUgYWdlbnRzJyk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlTGl2ZWNoYXRSb29tQ291bnQoKTtcblxuXHRcdGNvbnN0IGFnZW50SWRzID0gW107XG5cblx0XHRhZ2VudHMuZm9yRWFjaCgoYWdlbnQpID0+IHtcblx0XHRcdGlmIChndWVzdC5kZXBhcnRtZW50KSB7XG5cdFx0XHRcdGFnZW50SWRzLnB1c2goYWdlbnQuYWdlbnRJZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhZ2VudElkcy5wdXNoKGFnZW50Ll9pZCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRjb25zdCBpbnF1aXJ5ID0ge1xuXHRcdFx0cmlkOiBtZXNzYWdlLnJpZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UubXNnLFxuXHRcdFx0bmFtZTogZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0ZGVwYXJ0bWVudDogZ3Vlc3QuZGVwYXJ0bWVudCxcblx0XHRcdGFnZW50czogYWdlbnRJZHMsXG5cdFx0XHRzdGF0dXM6ICdvcGVuJyxcblx0XHRcdHY6IHtcblx0XHRcdFx0X2lkOiBndWVzdC5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBndWVzdC51c2VybmFtZSxcblx0XHRcdFx0dG9rZW46IG1lc3NhZ2UudG9rZW4sXG5cdFx0XHRcdHN0YXR1czogZ3Vlc3Quc3RhdHVzIHx8ICdvbmxpbmUnXG5cdFx0XHR9LFxuXHRcdFx0dDogJ2wnXG5cdFx0fTtcblxuXHRcdGNvbnN0IHJvb20gPSBfLmV4dGVuZCh7XG5cdFx0XHRfaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bXNnczogMSxcblx0XHRcdHVzZXJzQ291bnQ6IDAsXG5cdFx0XHRsbTogbmV3IERhdGUoKSxcblx0XHRcdGZuYW1lOiBndWVzdC5uYW1lIHx8IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0Ly8gdXNlcm5hbWVzOiBbZ3Vlc3QudXNlcm5hbWVdLFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHR2OiB7XG5cdFx0XHRcdF9pZDogZ3Vlc3QuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRcdHRva2VuOiBtZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRzdGF0dXM6IGd1ZXN0LnN0YXR1c1xuXHRcdFx0fSxcblx0XHRcdGNsOiBmYWxzZSxcblx0XHRcdG9wZW46IHRydWUsXG5cdFx0XHR3YWl0aW5nUmVzcG9uc2U6IHRydWVcblx0XHR9LCByb29tSW5mbyk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuaW5zZXJ0KGlucXVpcnkpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmluc2VydChyb29tKTtcblxuXHRcdHJldHVybiByb29tO1xuXHR9LFxuXHQnRXh0ZXJuYWwnKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpIHtcblx0XHRyZXR1cm4gdGhpc1snTGVhc3RfQW1vdW50J10oZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0fVxufTtcbiIsIi8vIEV2ZXJ5IG1pbnV0ZSBjaGVjayBpZiBvZmZpY2UgY2xvc2VkXG5NZXRlb3Iuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfZW5hYmxlX29mZmljZV9ob3VycycpKSB7XG5cdFx0aWYgKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0T2ZmaWNlSG91ci5pc09wZW5pbmdUaW1lKCkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLm9wZW5PZmZpY2UoKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0T2ZmaWNlSG91ci5pc0Nsb3NpbmdUaW1lKCkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmNsb3NlT2ZmaWNlKCk7XG5cdFx0fVxuXHR9XG59LCA2MDAwMCk7XG4iLCJjb25zdCBnYXRld2F5VVJMID0gJ2h0dHBzOi8vb21uaS5yb2NrZXQuY2hhdCc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcblx0ZW5hYmxlKCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnUE9TVCcsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svZW5hYmxlYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YCxcblx0XHRcdFx0J2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdFx0fSxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0dXJsOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2l0ZV9VcmwnKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHRkaXNhYmxlKCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnREVMRVRFJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9lbmFibGVgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gLFxuXHRcdFx0XHQnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdGxpc3RQYWdlcygpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0dFVCcsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svcGFnZXNgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdHN1YnNjcmliZShwYWdlSWQpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ1BPU1QnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL3BhZ2UvJHsgcGFnZUlkIH0vc3Vic2NyaWJlYCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YFxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiByZXN1bHQuZGF0YTtcblx0fSxcblxuXHR1bnN1YnNjcmliZShwYWdlSWQpIHtcblx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0RFTEVURScsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svcGFnZS8keyBwYWdlSWQgfS9zdWJzY3JpYmVgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdHJlcGx5KHsgcGFnZSwgdG9rZW4sIHRleHQgfSkge1xuXHRcdHJldHVybiBIVFRQLmNhbGwoJ1BPU1QnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL3JlcGx5YCwge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnYXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSB9YFxuXHRcdFx0fSxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0cGFnZSxcblx0XHRcdFx0dG9rZW4sXG5cdFx0XHRcdHRleHRcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlLCByb29tKSB7XG5cdC8vIHNraXBzIHRoaXMgY2FsbGJhY2sgaWYgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZFxuXHRpZiAobWVzc2FnZS5lZGl0ZWRBdCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LlNNUy5lbmFibGVkKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBvbmx5IHNlbmQgdGhlIHNtcyBieSBTTVMgaWYgaXQgaXMgYSBsaXZlY2hhdCByb29tIHdpdGggU01TIHNldCB0byB0cnVlXG5cdGlmICghKHR5cGVvZiByb29tLnQgIT09ICd1bmRlZmluZWQnICYmIHJvb20udCA9PT0gJ2wnICYmIHJvb20uc21zICYmIHJvb20udiAmJiByb29tLnYudG9rZW4pKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgZnJvbSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0eXBlIG1lYW5zIGl0IGlzIGEgc3BlY2lhbCBtZXNzYWdlIChsaWtlIHRoZSBjbG9zaW5nIGNvbW1lbnQpLCBzbyBza2lwc1xuXHRpZiAobWVzc2FnZS50KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRjb25zdCBTTVNTZXJ2aWNlID0gUm9ja2V0Q2hhdC5TTVMuZ2V0U2VydmljZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU01TX1NlcnZpY2UnKSk7XG5cblx0aWYgKCFTTVNTZXJ2aWNlKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbihyb29tLnYudG9rZW4pO1xuXG5cdGlmICghdmlzaXRvciB8fCAhdmlzaXRvci5waG9uZSB8fCB2aXNpdG9yLnBob25lLmxlbmd0aCA9PT0gMCkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0U01TU2VydmljZS5zZW5kKHJvb20uc21zLmZyb20sIHZpc2l0b3IucGhvbmVbMF0ucGhvbmVOdW1iZXIsIG1lc3NhZ2UubXNnKTtcblxuXHRyZXR1cm4gbWVzc2FnZTtcblxufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnc2VuZE1lc3NhZ2VCeVNtcycpO1xuIiwiLyogZ2xvYmFscyBVc2VyUHJlc2VuY2VNb25pdG9yICovXG5cbmxldCBhZ2VudHNIYW5kbGVyO1xubGV0IG1vbml0b3JBZ2VudHMgPSBmYWxzZTtcbmxldCBhY3Rpb25UaW1lb3V0ID0gNjAwMDA7XG5cbmNvbnN0IG9ubGluZUFnZW50cyA9IHtcblx0dXNlcnM6IHt9LFxuXHRxdWV1ZToge30sXG5cblx0YWRkKHVzZXJJZCkge1xuXHRcdGlmICh0aGlzLnF1ZXVlW3VzZXJJZF0pIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnF1ZXVlW3VzZXJJZF0pO1xuXHRcdFx0ZGVsZXRlIHRoaXMucXVldWVbdXNlcklkXTtcblx0XHR9XG5cdFx0dGhpcy51c2Vyc1t1c2VySWRdID0gMTtcblx0fSxcblxuXHRyZW1vdmUodXNlcklkLCBjYWxsYmFjaykge1xuXHRcdGlmICh0aGlzLnF1ZXVlW3VzZXJJZF0pIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnF1ZXVlW3VzZXJJZF0pO1xuXHRcdH1cblx0XHR0aGlzLnF1ZXVlW3VzZXJJZF0gPSBzZXRUaW1lb3V0KE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRcdFx0Y2FsbGJhY2soKTtcblxuXHRcdFx0ZGVsZXRlIHRoaXMudXNlcnNbdXNlcklkXTtcblx0XHRcdGRlbGV0ZSB0aGlzLnF1ZXVlW3VzZXJJZF07XG5cdFx0fSksIGFjdGlvblRpbWVvdXQpO1xuXHR9LFxuXG5cdGV4aXN0cyh1c2VySWQpIHtcblx0XHRyZXR1cm4gISF0aGlzLnVzZXJzW3VzZXJJZF07XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHJ1bkFnZW50TGVhdmVBY3Rpb24odXNlcklkKSB7XG5cdGNvbnN0IGFjdGlvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nKTtcblx0aWYgKGFjdGlvbiA9PT0gJ2Nsb3NlJykge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlT3BlbkNoYXRzKHVzZXJJZCwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2NvbW1lbnQnKSk7XG5cdH0gZWxzZSBpZiAoYWN0aW9uID09PSAnZm9yd2FyZCcpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5mb3J3YXJkT3BlbkNoYXRzKHVzZXJJZCk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2FjdGlvbl90aW1lb3V0JywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRhY3Rpb25UaW1lb3V0ID0gdmFsdWUgKiAxMDAwO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdG1vbml0b3JBZ2VudHMgPSB2YWx1ZTtcblx0aWYgKHZhbHVlICE9PSAnbm9uZScpIHtcblx0XHRpZiAoIWFnZW50c0hhbmRsZXIpIHtcblx0XHRcdGFnZW50c0hhbmRsZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25saW5lQWdlbnRzKCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdFx0XHRhZGRlZChpZCkge1xuXHRcdFx0XHRcdG9ubGluZUFnZW50cy5hZGQoaWQpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0XHRpZiAoZmllbGRzLnN0YXR1c0xpdmVjaGF0ICYmIGZpZWxkcy5zdGF0dXNMaXZlY2hhdCA9PT0gJ25vdC1hdmFpbGFibGUnKSB7XG5cdFx0XHRcdFx0XHRvbmxpbmVBZ2VudHMucmVtb3ZlKGlkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHJ1bkFnZW50TGVhdmVBY3Rpb24oaWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdG9ubGluZUFnZW50cy5hZGQoaWQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0XHRcdG9ubGluZUFnZW50cy5yZW1vdmUoaWQsICgpID0+IHtcblx0XHRcdFx0XHRcdHJ1bkFnZW50TGVhdmVBY3Rpb24oaWQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0gZWxzZSBpZiAoYWdlbnRzSGFuZGxlcikge1xuXHRcdGFnZW50c0hhbmRsZXIuc3RvcCgpO1xuXHRcdGFnZW50c0hhbmRsZXIgPSBudWxsO1xuXHR9XG59KTtcblxuVXNlclByZXNlbmNlTW9uaXRvci5vblNldFVzZXJTdGF0dXMoKHVzZXIsIHN0YXR1cy8qLCBzdGF0dXNDb25uZWN0aW9uKi8pID0+IHtcblx0aWYgKCFtb25pdG9yQWdlbnRzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChvbmxpbmVBZ2VudHMuZXhpc3RzKHVzZXIuX2lkKSkge1xuXHRcdGlmIChzdGF0dXMgPT09ICdvZmZsaW5lJyB8fCB1c2VyLnN0YXR1c0xpdmVjaGF0ID09PSAnbm90LWF2YWlsYWJsZScpIHtcblx0XHRcdG9ubGluZUFnZW50cy5yZW1vdmUodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0cnVuQWdlbnRMZWF2ZUFjdGlvbih1c2VyLl9pZCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5NZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6Y3VzdG9tRmllbGRzJywgZnVuY3Rpb24oX2lkKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmN1c3RvbUZpZWxkcycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpjdXN0b21GaWVsZHMnIH0pKTtcblx0fVxuXG5cdGlmIChzLnRyaW0oX2lkKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmQoeyBfaWQgfSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kKCk7XG5cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmRlcGFydG1lbnRBZ2VudHMnLCBmdW5jdGlvbihkZXBhcnRtZW50SWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6ZGVwYXJ0bWVudEFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LXJvb21zJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmRlcGFydG1lbnRBZ2VudHMnIH0pKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZCB9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmV4dGVybmFsTWVzc2FnZXMnLCBmdW5jdGlvbihyb29tSWQpIHtcblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlLmZpbmRCeVJvb21JZChyb29tSWQpO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6YWdlbnRzJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphZ2VudHMnIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUoJ2xpdmVjaGF0LWFnZW50Jykub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2FnZW50VXNlcnMnLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdhZ2VudFVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ2FnZW50VXNlcnMnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHRzZWxmLnJlYWR5KCk7XG5cblx0c2VsZi5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDphcHBlYXJhbmNlJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFwcGVhcmFuY2UnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFwcGVhcmFuY2UnIH0pKTtcblx0fVxuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDoge1xuXHRcdFx0JGluOiBbXG5cdFx0XHRcdCdMaXZlY2hhdF90aXRsZScsXG5cdFx0XHRcdCdMaXZlY2hhdF90aXRsZV9jb2xvcicsXG5cdFx0XHRcdCdMaXZlY2hhdF9zaG93X2FnZW50X2VtYWlsJyxcblx0XHRcdFx0J0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2UnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZW1haWwnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfY29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2UnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfcmVnaXN0cmF0aW9uX2Zvcm0nLFxuXHRcdFx0XHQnTGl2ZWNoYXRfbmFtZV9maWVsZF9yZWdpc3RyYXRpb25fZm9ybScsXG5cdFx0XHRcdCdMaXZlY2hhdF9lbWFpbF9maWVsZF9yZWdpc3RyYXRpb25fZm9ybSdcblx0XHRcdF1cblx0XHR9XG5cdH07XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZChxdWVyeSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdEFwcGVhcmFuY2UnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdGhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6ZGVwYXJ0bWVudHMnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKF9pZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kQnlEZXBhcnRtZW50SWQoX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmQoKTtcblx0fVxuXG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDppbnRlZ3JhdGlvbicsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDppbnRlZ3JhdGlvbicgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW50ZWdyYXRpb24nIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRCeUlkcyhbJ0xpdmVjaGF0X3dlYmhvb2tVcmwnLCAnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCAnTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZycsICdMaXZlY2hhdF93ZWJob29rX29uX3Zpc2l0b3JfbWVzc2FnZScsICdMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnXSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0SW50ZWdyYXRpb24nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdsaXZlY2hhdEludGVncmF0aW9uJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ2xpdmVjaGF0SW50ZWdyYXRpb24nLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHRzZWxmLnJlYWR5KCk7XG5cblx0c2VsZi5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDptYW5hZ2VycycsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDptYW5hZ2VycycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LXJvb21zJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0Om1hbmFnZXJzJyB9KSk7XG5cdH1cblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGUgPSBSb2NrZXRDaGF0LmF1dGh6LmdldFVzZXJzSW5Sb2xlKCdsaXZlY2hhdC1tYW5hZ2VyJykub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ21hbmFnZXJVc2VycycsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ21hbmFnZXJVc2VycycsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdtYW5hZ2VyVXNlcnMnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHRzZWxmLnJlYWR5KCk7XG5cblx0c2VsZi5vblN0b3AoZnVuY3Rpb24oKSB7XG5cdFx0aGFuZGxlLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpyb29tcycsIGZ1bmN0aW9uKGZpbHRlciA9IHt9LCBvZmZzZXQgPSAwLCBsaW1pdCA9IDIwKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnJvb21zJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cm9vbXMnIH0pKTtcblx0fVxuXG5cdGNoZWNrKGZpbHRlciwge1xuXHRcdG5hbWU6IE1hdGNoLk1heWJlKFN0cmluZyksIC8vIHJvb20gbmFtZSB0byBmaWx0ZXJcblx0XHRhZ2VudDogTWF0Y2guTWF5YmUoU3RyaW5nKSwgLy8gYWdlbnQgX2lkIHdobyBpcyBzZXJ2aW5nXG5cdFx0c3RhdHVzOiBNYXRjaC5NYXliZShTdHJpbmcpLCAvLyBlaXRoZXIgJ29wZW5lZCcgb3IgJ2Nsb3NlZCdcblx0XHRmcm9tOiBNYXRjaC5NYXliZShEYXRlKSxcblx0XHR0bzogTWF0Y2guTWF5YmUoRGF0ZSlcblx0fSk7XG5cblx0Y29uc3QgcXVlcnkgPSB7fTtcblx0aWYgKGZpbHRlci5uYW1lKSB7XG5cdFx0cXVlcnkubGFiZWwgPSBuZXcgUmVnRXhwKGZpbHRlci5uYW1lLCAnaScpO1xuXHR9XG5cdGlmIChmaWx0ZXIuYWdlbnQpIHtcblx0XHRxdWVyeVsnc2VydmVkQnkuX2lkJ10gPSBmaWx0ZXIuYWdlbnQ7XG5cdH1cblx0aWYgKGZpbHRlci5zdGF0dXMpIHtcblx0XHRpZiAoZmlsdGVyLnN0YXR1cyA9PT0gJ29wZW5lZCcpIHtcblx0XHRcdHF1ZXJ5Lm9wZW4gPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRxdWVyeS5vcGVuID0geyAkZXhpc3RzOiBmYWxzZSB9O1xuXHRcdH1cblx0fVxuXHRpZiAoZmlsdGVyLmZyb20pIHtcblx0XHRxdWVyeS50cyA9IHtcblx0XHRcdCRndGU6IGZpbHRlci5mcm9tXG5cdFx0fTtcblx0fVxuXHRpZiAoZmlsdGVyLnRvKSB7XG5cdFx0ZmlsdGVyLnRvLnNldERhdGUoZmlsdGVyLnRvLmdldERhdGUoKSArIDEpO1xuXHRcdGZpbHRlci50by5zZXRTZWNvbmRzKGZpbHRlci50by5nZXRTZWNvbmRzKCkgLSAxKTtcblxuXHRcdGlmICghcXVlcnkudHMpIHtcblx0XHRcdHF1ZXJ5LnRzID0ge307XG5cdFx0fVxuXHRcdHF1ZXJ5LnRzLiRsdGUgPSBmaWx0ZXIudG87XG5cdH1cblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kTGl2ZWNoYXQocXVlcnksIG9mZnNldCwgbGltaXQpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRhZGRlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmFkZGVkKCdsaXZlY2hhdFJvb20nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdsaXZlY2hhdFJvb20nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnbGl2ZWNoYXRSb29tJywgaWQpO1xuXHRcdH1cblx0fSk7XG5cblx0dGhpcy5yZWFkeSgpO1xuXG5cdHRoaXMub25TdG9wKCgpID0+IHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnF1ZXVlJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnF1ZXVlJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnF1ZXVlJyB9KSk7XG5cdH1cblxuXHQvLyBsZXQgc29ydCA9IHsgY291bnQ6IDEsIHNvcnQ6IDEsIHVzZXJuYW1lOiAxIH07XG5cdC8vIGxldCBvbmxpbmVVc2VycyA9IHt9O1xuXG5cdC8vIGxldCBoYW5kbGVVc2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdC8vIFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHQvLyBcdFx0b25saW5lVXNlcnNbZmllbGRzLnVzZXJuYW1lXSA9IDE7XG5cdC8vIFx0XHQvLyB0aGlzLmFkZGVkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkLCBmaWVsZHMpO1xuXHQvLyBcdH0sXG5cdC8vIFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdC8vIFx0XHRvbmxpbmVVc2Vyc1tmaWVsZHMudXNlcm5hbWVdID0gMTtcblx0Ly8gXHRcdC8vIHRoaXMuY2hhbmdlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCwgZmllbGRzKTtcblx0Ly8gXHR9LFxuXHQvLyBcdHJlbW92ZWQoaWQpIHtcblx0Ly8gXHRcdHRoaXMucmVtb3ZlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCk7XG5cdC8vIFx0fVxuXHQvLyB9KTtcblxuXHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRjb25zdCBoYW5kbGVEZXB0cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kVXNlcnNJblF1ZXVlKCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0UXVldWVVc2VyJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuY2hhbmdlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdC8vIGhhbmRsZVVzZXJzLnN0b3AoKTtcblx0XHRoYW5kbGVEZXB0cy5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dHJpZ2dlcnMnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dHJpZ2dlcnMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnRyaWdnZXJzJyB9KSk7XG5cdH1cblxuXHRpZiAoX2lkICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLmZpbmRCeUlkKF9pZCk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5maW5kKCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnZpc2l0b3JIaXN0b3J5JywgZnVuY3Rpb24oeyByaWQ6IHJvb21JZCB9KSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JIaXN0b3J5JyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JIaXN0b3J5JyB9KSk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgdGhpcy51c2VySWQsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRpZiAoIXN1YnNjcmlwdGlvbikge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGlmIChyb29tICYmIHJvb20udiAmJiByb29tLnYuX2lkKSB7XG5cdFx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VmlzaXRvcklkKHJvb20udi5faWQpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0c2VsZi5hZGRlZCgndmlzaXRvcl9oaXN0b3J5JywgaWQsIGZpZWxkcyk7XG5cdFx0XHR9LFxuXHRcdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRcdHNlbGYuY2hhbmdlZCgndmlzaXRvcl9oaXN0b3J5JywgaWQsIGZpZWxkcyk7XG5cdFx0XHR9LFxuXHRcdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0XHRzZWxmLnJlbW92ZWQoJ3Zpc2l0b3JfaGlzdG9yeScsIGlkKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHNlbGYucmVhZHkoKTtcblxuXHRcdHNlbGYub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdFx0aGFuZGxlLnN0b3AoKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRzZWxmLnJlYWR5KCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dmlzaXRvckluZm8nLCBmdW5jdGlvbih7IHJpZDogcm9vbUlkIH0pIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckluZm8nIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckluZm8nIH0pKTtcblx0fVxuXG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdGlmIChyb29tICYmIHJvb20udiAmJiByb29tLnYuX2lkKSB7XG5cdFx0cmV0dXJuIExpdmVjaGF0VmlzaXRvcnMuZmluZEJ5SWQocm9vbS52Ll9pZCk7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dmlzaXRvclBhZ2VWaXNpdGVkJywgZnVuY3Rpb24oeyByaWQ6IHJvb21JZCB9KSB7XG5cblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvclBhZ2VWaXNpdGVkJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JQYWdlVmlzaXRlZCcgfSkpO1xuXHR9XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdGlmIChyb29tKSB7XG5cdFx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZEJ5Um9vbUlkQW5kVHlwZShyb29tLl9pZCwgJ2xpdmVjaGF0X25hdmlnYXRpb25faGlzdG9yeScpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0c2VsZi5hZGRlZCgndmlzaXRvcl9uYXZpZ2F0aW9uX2hpc3RvcnknLCBpZCwgZmllbGRzKTtcblx0XHRcdH0sXG5cdFx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdFx0c2VsZi5jaGFuZ2VkKCd2aXNpdG9yX25hdmlnYXRpb25faGlzdG9yeScsIGlkLCBmaWVsZHMpO1xuXHRcdFx0fSxcblx0XHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdFx0c2VsZi5yZW1vdmVkKCd2aXNpdG9yX25hdmlnYXRpb25faGlzdG9yeScsIGlkKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHNlbGYucmVhZHkoKTtcblxuXHRcdHNlbGYub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdFx0aGFuZGxlLnN0b3AoKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRzZWxmLnJlYWR5KCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmlucXVpcnknLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW5xdWlyeScgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDppbnF1aXJ5JyB9KSk7XG5cdH1cblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRhZ2VudHM6IHRoaXMudXNlcklkLFxuXHRcdHN0YXR1czogJ29wZW4nXG5cdH07XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5maW5kKHF1ZXJ5KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0Om9mZmljZUhvdXInLCBmdW5jdGlvbigpIHtcblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDphZ2VudHMnIH0pKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdE9mZmljZUhvdXIuZmluZCgpO1xufSk7XG4iLCJpbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3QvZGVwYXJ0bWVudHMuanMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L2ZhY2Vib29rLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC9zbXMuanMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L3VzZXJzLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC9tZXNzYWdlcy5qcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3QvdmlzaXRvcnMuanMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L3VwbG9hZC5qcyc7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRjb25zdCByb2xlcyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZCgpLmZldGNoKCksICduYW1lJyk7XG5cdGlmIChyb2xlcy5pbmRleE9mKCdsaXZlY2hhdC1hZ2VudCcpID09PSAtMSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmNyZWF0ZU9yVXBkYXRlKCdsaXZlY2hhdC1hZ2VudCcpO1xuXHR9XG5cdGlmIChyb2xlcy5pbmRleE9mKCdsaXZlY2hhdC1tYW5hZ2VyJykgPT09IC0xKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY3JlYXRlT3JVcGRhdGUoJ2xpdmVjaGF0LW1hbmFnZXInKTtcblx0fVxuXHRpZiAocm9sZXMuaW5kZXhPZignbGl2ZWNoYXQtZ3Vlc3QnKSA9PT0gLTEpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZSgnbGl2ZWNoYXQtZ3Vlc3QnKTtcblx0fVxuXHRpZiAoUm9ja2V0Q2hhdC5tb2RlbHMgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgndmlldy1sLXJvb20nLCBbJ2xpdmVjaGF0LWFnZW50JywgJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicsIFsnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgndmlldy1saXZlY2hhdC1yb29tcycsIFsnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgnY2xvc2UtbGl2ZWNoYXQtcm9vbScsIFsnbGl2ZWNoYXQtYWdlbnQnLCAnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgnY2xvc2Utb3RoZXJzLWxpdmVjaGF0LXJvb20nLCBbJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ3NhdmUtb3RoZXJzLWxpdmVjaGF0LXJvb20taW5mbycsIFsnbGl2ZWNoYXQtbWFuYWdlciddKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0Lk1lc3NhZ2VUeXBlcy5yZWdpc3RlclR5cGUoe1xuXHRpZDogJ2xpdmVjaGF0X25hdmlnYXRpb25faGlzdG9yeScsXG5cdHN5c3RlbTogdHJ1ZSxcblx0bWVzc2FnZTogJ05ld192aXNpdG9yX25hdmlnYXRpb24nLFxuXHRkYXRhKG1lc3NhZ2UpIHtcblx0XHRpZiAoIW1lc3NhZ2UubmF2aWdhdGlvbiB8fCAhbWVzc2FnZS5uYXZpZ2F0aW9uLnBhZ2UpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0cmV0dXJuIHtcblx0XHRcdGhpc3Rvcnk6IGAkeyAobWVzc2FnZS5uYXZpZ2F0aW9uLnBhZ2UudGl0bGUgPyBgJHsgbWVzc2FnZS5uYXZpZ2F0aW9uLnBhZ2UudGl0bGUgfSAtIGAgOiAnJykgKyBtZXNzYWdlLm5hdmlnYXRpb24ucGFnZS5sb2NhdGlvbi5ocmVmIH1gXG5cdFx0fTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuTWVzc2FnZVR5cGVzLnJlZ2lzdGVyVHlwZSh7XG5cdGlkOiAnbGl2ZWNoYXRfdmlkZW9fY2FsbCcsXG5cdHN5c3RlbTogdHJ1ZSxcblx0bWVzc2FnZTogJ05ld192aWRlb2NhbGxfcmVxdWVzdCdcbn0pO1xuXG5Sb2NrZXRDaGF0LmFjdGlvbkxpbmtzLnJlZ2lzdGVyKCdjcmVhdGVMaXZlY2hhdENhbGwnLCBmdW5jdGlvbihtZXNzYWdlLCBwYXJhbXMsIGluc3RhbmNlKSB7XG5cdGlmIChNZXRlb3IuaXNDbGllbnQpIHtcblx0XHRpbnN0YW5jZS50YWJCYXIub3BlbigndmlkZW8nKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuYWN0aW9uTGlua3MucmVnaXN0ZXIoJ2RlbnlMaXZlY2hhdENhbGwnLCBmdW5jdGlvbihtZXNzYWdlLyosIHBhcmFtcyovKSB7XG5cdGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ2NvbW1hbmQnLCBtZXNzYWdlLnJpZCwgJ2VuZENhbGwnLCB1c2VyKTtcblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5Um9vbShtZXNzYWdlLnJpZCwgJ2RlbGV0ZU1lc3NhZ2UnLCB7IF9pZDogbWVzc2FnZS5faWQgfSk7XG5cblx0XHRjb25zdCBsYW5ndWFnZSA9IHVzZXIubGFuZ3VhZ2UgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJztcblxuXHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuY2xvc2VSb29tKHtcblx0XHRcdHVzZXIsXG5cdFx0XHRyb29tOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJpZCksXG5cdFx0XHRjb21tZW50OiBUQVBpMThuLl9fKCdWaWRlb2NhbGxfZGVjbGluZWQnLCB7IGxuZzogbGFuZ3VhZ2UgfSlcblx0XHR9KTtcblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0SGlkZGVuQnlJZChtZXNzYWdlLl9pZCk7XG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0xpdmVjaGF0Jyk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnTGl2ZWNoYXQnLCBwdWJsaWM6IHRydWUgfSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RpdGxlJywgJ1JvY2tldC5DaGF0JywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSB9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RpdGxlX2NvbG9yJywgJyNDMTI3MkQnLCB7XG5cdFx0dHlwZTogJ2NvbG9yJyxcblx0XHRlZGl0b3I6ICdjb2xvcicsXG5cdFx0YWxsb3dlZFR5cGVzOiBbJ2NvbG9yJywgJ2V4cHJlc3Npb24nXSxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ0Rpc3BsYXlfb2ZmbGluZV9mb3JtJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdmFsaWRhdGVfb2ZmbGluZV9lbWFpbCcsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdWYWxpZGF0ZV9lbWFpbF9hZGRyZXNzJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ09mZmxpbmVfZm9ybV91bmF2YWlsYWJsZV9tZXNzYWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZScsICdMZWF2ZSBhIG1lc3NhZ2UnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdUaXRsZSdcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yJywgJyM2NjY2NjYnLCB7XG5cdFx0dHlwZTogJ2NvbG9yJyxcblx0XHRlZGl0b3I6ICdjb2xvcicsXG5cdFx0YWxsb3dlZFR5cGVzOiBbJ2NvbG9yJywgJ2V4cHJlc3Npb24nXSxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ0NvbG9yJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdJbnN0cnVjdGlvbnMnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0luc3RydWN0aW9uc190b195b3VyX3Zpc2l0b3JfZmlsbF90aGVfZm9ybV90b19zZW5kX2FfbWVzc2FnZSdcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX2VtYWlsJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRpMThuTGFiZWw6ICdFbWFpbF9hZGRyZXNzX3RvX3NlbmRfb2ZmbGluZV9tZXNzYWdlcycsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnT2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHMnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnQWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzJyB9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnU2hvd19hZ2VudF9lbWFpbCcgfSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2NvbnZlcnNhdGlvbl9maW5pc2hlZF9tZXNzYWdlJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnQ29udmVyc2F0aW9uX2ZpbmlzaGVkX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybScsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1Nob3dfcHJlcmVnaXN0cmF0aW9uX2Zvcm0nXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9uYW1lX2ZpZWxkX3JlZ2lzdHJhdGlvbl9mb3JtJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnU2hvd19uYW1lX2ZpZWxkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZW1haWxfZmllbGRfcmVnaXN0cmF0aW9uX2Zvcm0nLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdTaG93X2VtYWlsX2ZpZWxkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfZ3Vlc3RfY291bnQnLCAxLCB7IHR5cGU6ICdpbnQnLCBncm91cDogJ0xpdmVjaGF0JyB9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfUm9vbV9Db3VudCcsIDEsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRpMThuTGFiZWw6ICdMaXZlY2hhdF9yb29tX2NvdW50J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgJ25vbmUnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7IGtleTogJ25vbmUnLCBpMThuTGFiZWw6ICdOb25lJyB9LFxuXHRcdFx0eyBrZXk6ICdmb3J3YXJkJywgaTE4bkxhYmVsOiAnRm9yd2FyZCcgfSxcblx0XHRcdHsga2V5OiAnY2xvc2UnLCBpMThuTGFiZWw6ICdDbG9zZScgfVxuXHRcdF0sXG5cdFx0aTE4bkxhYmVsOiAnSG93X3RvX2hhbmRsZV9vcGVuX3Nlc3Npb25zX3doZW5fYWdlbnRfZ29lc19vZmZsaW5lJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uX3RpbWVvdXQnLCA2MCwge1xuXHRcdHR5cGU6ICdpbnQnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2FjdGlvbicsIHZhbHVlOiB7ICRuZTogJ25vbmUnIH0gfSxcblx0XHRpMThuTGFiZWw6ICdIb3dfbG9uZ190b193YWl0X2FmdGVyX2FnZW50X2dvZXNfb2ZmbGluZScsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnVGltZV9pbl9zZWNvbmRzJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfY29tbWVudCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgdmFsdWU6ICdjbG9zZScgfSxcblx0XHRpMThuTGFiZWw6ICdDb21tZW50X3RvX2xlYXZlX29uX2Nsb3Npbmdfc2Vzc2lvbidcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1dlYmhvb2tfVVJMJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZWNyZXRfdG9rZW4nXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9yZXF1ZXN0X29uX2NoYXRfY2xvc2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9yZXF1ZXN0X29uX29mZmxpbmVfbWVzc2FnZXMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX3Zpc2l0b3JfbWVzc2FnZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlbmRfcmVxdWVzdF9vbl92aXNpdG9yX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF93ZWJob29rX29uX2FnZW50X21lc3NhZ2UnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fYWdlbnRfbWVzc2FnZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ1NlbmRfdmlzaXRvcl9uYXZpZ2F0aW9uX2hpc3RvcnlfbGl2ZWNoYXRfd2ViaG9va19yZXF1ZXN0JywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF92aXNpdG9yX25hdmlnYXRpb25faGlzdG9yeV9vbl9yZXF1ZXN0Jyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdGZWF0dXJlX0RlcGVuZHNfb25fTGl2ZWNoYXRfVmlzaXRvcl9uYXZpZ2F0aW9uX2FzX2FfbWVzc2FnZV90b19iZV9lbmFibGVkJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdMaXZlY2hhdF9WaXNpdG9yX25hdmlnYXRpb25fYXNfYV9tZXNzYWdlJywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfd2ViaG9va19vbl9jYXB0dXJlJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9yZXF1ZXN0X29uX2xlYWRfY2FwdHVyZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2xlYWRfZW1haWxfcmVnZXgnLCAnXFxcXGJbQS1aMC05Ll8lKy1dK0AoPzpbQS1aMC05LV0rXFxcXC4pK1tBLVpdezIsNH1cXFxcYicsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdMZWFkX2NhcHR1cmVfZW1haWxfcmVnZXgnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9sZWFkX3Bob25lX3JlZ2V4JywgJygoPzpcXFxcKFswLTldezEsM31cXFxcKXxbMC05XXsyfSlbIFxcXFwtXSo/WzAtOV17NCw1fSg/OltcXFxcLVxcXFxzXFxcXF9dezEsMn0pP1swLTldezR9KD86KD89W14wLTldKXwkKXxbMC05XXs0LDV9KD86W1xcXFwtXFxcXHNcXFxcX117MSwyfSk/WzAtOV17NH0oPzooPz1bXjAtOV0pfCQpKScsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdMZWFkX2NhcHR1cmVfcGhvbmVfcmVnZXgnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9Lbm93bGVkZ2VfRW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdLbm93bGVkZ2VfQmFzZScsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0VuYWJsZWQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9Lbm93bGVkZ2VfQXBpYWlfS2V5JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnS25vd2xlZGdlX0Jhc2UnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdBcGlhaV9LZXknXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9Lbm93bGVkZ2VfQXBpYWlfTGFuZ3VhZ2UnLCAnZW4nLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0tub3dsZWRnZV9CYXNlJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnQXBpYWlfTGFuZ3VhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9oaXN0b3J5X21vbml0b3JfdHlwZScsICd1cmwnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0aTE4bkxhYmVsOiAnTW9uaXRvcl9oaXN0b3J5X2Zvcl9jaGFuZ2VzX29uJyxcblx0XHR2YWx1ZXM6IFtcblx0XHRcdHsga2V5OiAndXJsJywgaTE4bkxhYmVsOiAnUGFnZV9VUkwnIH0sXG5cdFx0XHR7IGtleTogJ3RpdGxlJywgaTE4bkxhYmVsOiAnUGFnZV90aXRsZScgfVxuXHRcdF1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X1Zpc2l0b3JfbmF2aWdhdGlvbl9hc19hX21lc3NhZ2UnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnU2VuZF9WaXNpdG9yX25hdmlnYXRpb25faGlzdG9yeV9hc19hX21lc3NhZ2UnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9lbmFibGVfb2ZmaWNlX2hvdXJzJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ09mZmljZV9ob3Vyc19lbmFibGVkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfY29udGludW91c19zb3VuZF9ub3RpZmljYXRpb25fbmV3X2xpdmVjaGF0X3Jvb20nLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnQ29udGludW91c19zb3VuZF9ub3RpZmljYXRpb25zX2Zvcl9uZXdfbGl2ZWNoYXRfcm9vbSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3ZpZGVvY2FsbF9lbmFibGVkJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1ZpZGVvY2FsbF9lbmFibGVkJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdCZXRhX2ZlYXR1cmVfRGVwZW5kc19vbl9WaWRlb19Db25mZXJlbmNlX3RvX2JlX2VuYWJsZWQnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0ppdHNpX0VuYWJsZWQnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9maWxldXBsb2FkX2VuYWJsZWQnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdGaWxlVXBsb2FkX0VuYWJsZWQnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0ZpbGVVcGxvYWRfRW5hYmxlZCcsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0JywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfRW5hYmxlZCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfbWVzc2FnZScsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdMaXZlY2hhdF9vcGVuX2lucXVpZXJ5X3Nob3dfY29ubmVjdGluZycsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCB2YWx1ZTogJ0d1ZXN0X1Bvb2wnIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0xpdmVjaGF0X0FsbG93ZWREb21haW5zTGlzdCcsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRG9tYWluc19hbGxvd2VkX3RvX2VtYmVkX3RoZV9saXZlY2hhdF93aWRnZXQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdJZl95b3VfZG9udF9oYXZlX29uZV9zZW5kX2FuX2VtYWlsX3RvX29tbmlfcm9ja2V0Y2hhdF90b19nZXRfeW91cnMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9GYWNlYm9va19BUElfU2VjcmV0JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnRmFjZWJvb2snLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0lmX3lvdV9kb250X2hhdmVfb25lX3NlbmRfYW5fZW1haWxfdG9fb21uaV9yb2NrZXRjaGF0X3RvX2dldF95b3Vycydcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X1JEU3RhdGlvbl9Ub2tlbicsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiBmYWxzZSxcblx0XHRzZWN0aW9uOiAnUkQgU3RhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnUkRTdGF0aW9uX1Rva2VuJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCAnTGVhc3RfQW1vdW50Jywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7a2V5OiAnRXh0ZXJuYWwnLCBpMThuTGFiZWw6ICdFeHRlcm5hbF9TZXJ2aWNlJ30sXG5cdFx0XHR7a2V5OiAnTGVhc3RfQW1vdW50JywgaTE4bkxhYmVsOiAnTGVhc3RfQW1vdW50J30sXG5cdFx0XHR7a2V5OiAnR3Vlc3RfUG9vbCcsIGkxOG5MYWJlbDogJ0d1ZXN0X1Bvb2wnfVxuXHRcdF1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2d1ZXN0X3Bvb2xfd2l0aF9ub19hZ2VudHMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnQWNjZXB0X3dpdGhfbm9fb25saW5lX2FnZW50cycsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnQWNjZXB0X2luY29taW5nX2xpdmVjaGF0X3JlcXVlc3RzX2V2ZW5faWZfdGhlcmVfYXJlX25vX29ubGluZV9hZ2VudHMnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdHdWVzdF9Qb29sJyB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9zaG93X3F1ZXVlX2xpc3RfbGluaycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnU2hvd19xdWV1ZV9saXN0X3RvX2FsbF9hZ2VudHMnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6IHsgJG5lOiAnRXh0ZXJuYWwnIH0gfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRXh0ZXJuYWxfUXVldWVfVVJMJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IGZhbHNlLFxuXHRcdHNlY3Rpb246ICdSb3V0aW5nJyxcblx0XHRpMThuTGFiZWw6ICdFeHRlcm5hbF9RdWV1ZV9TZXJ2aWNlX1VSTCcsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRm9yX21vcmVfZGV0YWlsc19wbGVhc2VfY2hlY2tfb3VyX2RvY3MnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdFeHRlcm5hbCcgfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRXh0ZXJuYWxfUXVldWVfVG9rZW4nLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogZmFsc2UsXG5cdFx0c2VjdGlvbjogJ1JvdXRpbmcnLFxuXHRcdGkxOG5MYWJlbDogJ1NlY3JldF90b2tlbicsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnLCB2YWx1ZTogJ0V4dGVybmFsJyB9XG5cdH0pO1xufSk7XG4iLCIvKiBnbG9iYWxzIG9wZW5Sb29tLCBMaXZlY2hhdElucXVpcnkgKi9cbmltcG9ydCB7IFJvb21TZXR0aW5nc0VudW0sIFJvb21UeXBlQ29uZmlnLCBSb29tVHlwZVJvdXRlQ29uZmlnLCBVaVRleHRDb250ZXh0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuY2xhc3MgTGl2ZWNoYXRSb29tUm91dGUgZXh0ZW5kcyBSb29tVHlwZVJvdXRlQ29uZmlnIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0bmFtZTogJ2xpdmUnLFxuXHRcdFx0cGF0aDogJy9saXZlLzppZCdcblx0XHR9KTtcblx0fVxuXG5cdGFjdGlvbihwYXJhbXMpIHtcblx0XHRvcGVuUm9vbSgnbCcsIHBhcmFtcy5pZCk7XG5cdH1cblxuXHRsaW5rKHN1Yikge1xuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogc3ViLnJpZFxuXHRcdH07XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGl2ZWNoYXRSb29tVHlwZSBleHRlbmRzIFJvb21UeXBlQ29uZmlnIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0aWRlbnRpZmllcjogJ2wnLFxuXHRcdFx0b3JkZXI6IDUsXG5cdFx0XHRpY29uOiAnbGl2ZWNoYXQnLFxuXHRcdFx0bGFiZWw6ICdMaXZlY2hhdCcsXG5cdFx0XHRyb3V0ZTogbmV3IExpdmVjaGF0Um9vbVJvdXRlKClcblx0XHR9KTtcblxuXHRcdHRoaXMubm90U3Vic2NyaWJlZFRwbCA9IHtcblx0XHRcdHRlbXBsYXRlOiAnbGl2ZWNoYXROb3RTdWJzY3JpYmVkJ1xuXHRcdH07XG5cdH1cblxuXHRmaW5kUm9vbShpZGVudGlmaWVyKSB7XG5cdFx0cmV0dXJuIENoYXRSb29tLmZpbmRPbmUoe19pZDogaWRlbnRpZmllcn0pO1xuXHR9XG5cblx0cm9vbU5hbWUocm9vbURhdGEpIHtcblx0XHRyZXR1cm4gcm9vbURhdGEubmFtZSB8fCByb29tRGF0YS5mbmFtZSB8fCByb29tRGF0YS5sYWJlbDtcblx0fVxuXG5cdGNvbmRpdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2VuYWJsZWQnKSAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc0FsbFBlcm1pc3Npb24oJ3ZpZXctbC1yb29tJyk7XG5cdH1cblxuXHRjYW5TZW5kTWVzc2FnZShyb29tSWQpIHtcblx0XHRjb25zdCByb29tID0gQ2hhdFJvb20uZmluZE9uZSh7X2lkOiByb29tSWR9LCB7ZmllbGRzOiB7b3BlbjogMX19KTtcblx0XHRyZXR1cm4gcm9vbSAmJiByb29tLm9wZW4gPT09IHRydWU7XG5cdH1cblxuXHRnZXRVc2VyU3RhdHVzKHJvb21JZCkge1xuXHRcdGNvbnN0IHJvb20gPSBTZXNzaW9uLmdldChgcm9vbURhdGEkeyByb29tSWQgfWApO1xuXHRcdGlmIChyb29tKSB7XG5cdFx0XHRyZXR1cm4gcm9vbS52ICYmIHJvb20udi5zdGF0dXM7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaW5xdWlyeSA9IExpdmVjaGF0SW5xdWlyeS5maW5kT25lKHsgcmlkOiByb29tSWQgfSk7XG5cdFx0cmV0dXJuIGlucXVpcnkgJiYgaW5xdWlyeS52ICYmIGlucXVpcnkudi5zdGF0dXM7XG5cdH1cblxuXHRhbGxvd1Jvb21TZXR0aW5nQ2hhbmdlKHJvb20sIHNldHRpbmcpIHtcblx0XHRzd2l0Y2ggKHNldHRpbmcpIHtcblx0XHRcdGNhc2UgUm9vbVNldHRpbmdzRW51bS5KT0lOX0NPREU6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdGdldFVpVGV4dChjb250ZXh0KSB7XG5cdFx0c3dpdGNoIChjb250ZXh0KSB7XG5cdFx0XHRjYXNlIFVpVGV4dENvbnRleHQuSElERV9XQVJOSU5HOlxuXHRcdFx0XHRyZXR1cm4gJ0hpZGVfTGl2ZWNoYXRfV2FybmluZyc7XG5cdFx0XHRjYXNlIFVpVGV4dENvbnRleHQuTEVBVkVfV0FSTklORzpcblx0XHRcdFx0cmV0dXJuICdIaWRlX0xpdmVjaGF0X1dhcm5pbmcnO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdH1cblx0fVxufVxuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L2RlcGFydG1lbnQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZGVwYXJ0bWVudHM6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kKCkuZmV0Y2goKVxuXHRcdH0pO1xuXHR9LFxuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHRcdGRlcGFydG1lbnQ6IE9iamVjdCxcblx0XHRcdFx0YWdlbnRzOiBBcnJheVxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGRlcGFydG1lbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVEZXBhcnRtZW50KG51bGwsIHRoaXMuYm9keVBhcmFtcy5kZXBhcnRtZW50LCB0aGlzLmJvZHlQYXJhbXMuYWdlbnRzKTtcblxuXHRcdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGRlcGFydG1lbnQsXG5cdFx0XHRcdFx0YWdlbnRzOiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZDogZGVwYXJ0bWVudC5faWQgfSkuZmV0Y2goKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Um9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUpO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9kZXBhcnRtZW50LzpfaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdF9pZDogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRkZXBhcnRtZW50OiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKSxcblx0XHRcdFx0YWdlbnRzOiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZDogdGhpcy51cmxQYXJhbXMuX2lkIH0pLmZldGNoKClcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fSxcblx0cHV0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdFx0ZGVwYXJ0bWVudDogT2JqZWN0LFxuXHRcdFx0XHRhZ2VudHM6IEFycmF5XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQodGhpcy51cmxQYXJhbXMuX2lkLCB0aGlzLmJvZHlQYXJhbXMuZGVwYXJ0bWVudCwgdGhpcy5ib2R5UGFyYW1zLmFnZW50cykpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGRlcGFydG1lbnQ6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kT25lQnlJZCh0aGlzLnVybFBhcmFtcy5faWQpLFxuXHRcdFx0XHRcdGFnZW50czogUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmQoeyBkZXBhcnRtZW50SWQ6IHRoaXMudXJsUGFyYW1zLl9pZCB9KS5mZXRjaCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fSxcblx0ZGVsZXRlKCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVEZXBhcnRtZW50KHRoaXMudXJsUGFyYW1zLl9pZCkpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiaW1wb3J0IGNyeXB0byBmcm9tICdjcnlwdG8nO1xuXG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG4vKipcbiAqIEBhcGkge3Bvc3R9IC9saXZlY2hhdC9mYWNlYm9vayBTZW5kIEZhY2Vib29rIG1lc3NhZ2VcbiAqIEBhcGlOYW1lIEZhY2Vib29rXG4gKiBAYXBpR3JvdXAgTGl2ZWNoYXRcbiAqXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gbWlkIEZhY2Vib29rIG1lc3NhZ2UgaWRcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBwYWdlIEZhY2Vib29rIHBhZ2VzIGlkXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gdG9rZW4gRmFjZWJvb2sgdXNlcidzIHRva2VuXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gZmlyc3RfbmFtZSBGYWNlYm9vayB1c2VyJ3MgZmlyc3QgbmFtZVxuICogQGFwaVBhcmFtIHtTdHJpbmd9IGxhc3RfbmFtZSBGYWNlYm9vayB1c2VyJ3MgbGFzdCBuYW1lXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gW3RleHRdIEZhY2Vib29rIG1lc3NhZ2UgdGV4dFxuICogQGFwaVBhcmFtIHtTdHJpbmd9IFthdHRhY2htZW50c10gRmFjZWJvb2sgbWVzc2FnZSBhdHRhY2htZW50c1xuICovXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvZmFjZWJvb2snLCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudGV4dCAmJiAhdGhpcy5ib2R5UGFyYW1zLmF0dGFjaG1lbnRzKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWh1Yi1zaWduYXR1cmUnXSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2Vcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcpKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0ZXJyb3I6ICdJbnRlZ3JhdGlvbiBkaXNhYmxlZCdcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gdmFsaWRhdGUgaWYgcmVxdWVzdCBjb21lIGZyb20gb21uaVxuXHRcdGNvbnN0IHNpZ25hdHVyZSA9IGNyeXB0by5jcmVhdGVIbWFjKCdzaGExJywgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9TZWNyZXQnKSkudXBkYXRlKEpTT04uc3RyaW5naWZ5KHRoaXMucmVxdWVzdC5ib2R5KSkuZGlnZXN0KCdoZXgnKTtcblx0XHRpZiAodGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtaHViLXNpZ25hdHVyZSddICE9PSBgc2hhMT0keyBzaWduYXR1cmUgfWApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogJ0ludmFsaWQgc2lnbmF0dXJlJ1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRjb25zdCBzZW5kTWVzc2FnZSA9IHtcblx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0X2lkOiB0aGlzLmJvZHlQYXJhbXMubWlkXG5cdFx0XHR9LFxuXHRcdFx0cm9vbUluZm86IHtcblx0XHRcdFx0ZmFjZWJvb2s6IHtcblx0XHRcdFx0XHRwYWdlOiB0aGlzLmJvZHlQYXJhbXMucGFnZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRsZXQgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odGhpcy5ib2R5UGFyYW1zLnRva2VuKTtcblx0XHRpZiAodmlzaXRvcikge1xuXHRcdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHZpc2l0b3IudG9rZW4pLmZldGNoKCk7XG5cdFx0XHRpZiAocm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IHJvb21zWzBdLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuID0gdmlzaXRvci50b2tlbjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4gPSB0aGlzLmJvZHlQYXJhbXMudG9rZW47XG5cblx0XHRcdGNvbnN0IHVzZXJJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdCh7XG5cdFx0XHRcdHRva2VuOiBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRuYW1lOiBgJHsgdGhpcy5ib2R5UGFyYW1zLmZpcnN0X25hbWUgfSAkeyB0aGlzLmJvZHlQYXJhbXMubGFzdF9uYW1lIH1gXG5cdFx0XHR9KTtcblxuXHRcdFx0dmlzaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cdFx0fVxuXG5cdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5tc2cgPSB0aGlzLmJvZHlQYXJhbXMudGV4dDtcblx0XHRzZW5kTWVzc2FnZS5ndWVzdCA9IHZpc2l0b3I7XG5cblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjZXNzOiB0cnVlLFxuXHRcdFx0XHRtZXNzYWdlOiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHNlbmRNZXNzYWdlKVxuXHRcdFx0fTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciB1c2luZyBGYWNlYm9vayAtPicsIGUpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvbWVzc2FnZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnZpc2l0b3IpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwidmlzaXRvclwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnZpc2l0b3IudG9rZW4pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwidmlzaXRvci50b2tlblwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VzKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm1lc3NhZ2VzXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cdFx0aWYgKCEodGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm1lc3NhZ2VzXCIgaXMgbm90IGFuIGFycmF5Jyk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm1lc3NhZ2VzXCIgaXMgZW1wdHknKTtcblx0XHR9XG5cblx0XHRjb25zdCB2aXNpdG9yVG9rZW4gPSB0aGlzLmJvZHlQYXJhbXMudmlzaXRvci50b2tlbjtcblxuXHRcdGxldCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih2aXNpdG9yVG9rZW4pO1xuXHRcdGxldCByaWQ7XG5cdFx0aWYgKHZpc2l0b3IpIHtcblx0XHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeVZpc2l0b3JUb2tlbih2aXNpdG9yVG9rZW4pLmZldGNoKCk7XG5cdFx0XHRpZiAocm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRyaWQgPSByb29tc1swXS5faWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHRjb25zdCB2aXNpdG9ySWQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnJlZ2lzdGVyR3Vlc3QodGhpcy5ib2R5UGFyYW1zLnZpc2l0b3IpO1xuXHRcdFx0dmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZmluZE9uZUJ5SWQodmlzaXRvcklkKTtcblx0XHR9XG5cblx0XHRjb25zdCBzZW50TWVzc2FnZXMgPSB0aGlzLmJvZHlQYXJhbXMubWVzc2FnZXMubWFwKChtZXNzYWdlKSA9PiB7XG5cdFx0XHRjb25zdCBzZW5kTWVzc2FnZSA9IHtcblx0XHRcdFx0Z3Vlc3Q6IHZpc2l0b3IsXG5cdFx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHJpZCxcblx0XHRcdFx0XHR0b2tlbjogdmlzaXRvclRva2VuLFxuXHRcdFx0XHRcdG1zZzogbWVzc2FnZS5tc2dcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdGNvbnN0IHNlbnRNZXNzYWdlID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kTWVzc2FnZShzZW5kTWVzc2FnZSk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1c2VybmFtZTogc2VudE1lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0bXNnOiBzZW50TWVzc2FnZS5tc2csXG5cdFx0XHRcdHRzOiBzZW50TWVzc2FnZS50c1xuXHRcdFx0fTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzOiBzZW50TWVzc2FnZXNcblx0XHR9KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvc21zLWluY29taW5nLzpzZXJ2aWNlJywge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IFNNU1NlcnZpY2UgPSBSb2NrZXRDaGF0LlNNUy5nZXRTZXJ2aWNlKHRoaXMudXJsUGFyYW1zLnNlcnZpY2UpO1xuXG5cdFx0Y29uc3Qgc21zID0gU01TU2VydmljZS5wYXJzZSh0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0bGV0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVWaXNpdG9yQnlQaG9uZShzbXMuZnJvbSk7XG5cblx0XHRjb25zdCBzZW5kTWVzc2FnZSA9IHtcblx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKVxuXHRcdFx0fSxcblx0XHRcdHJvb21JbmZvOiB7XG5cdFx0XHRcdHNtczoge1xuXHRcdFx0XHRcdGZyb206IHNtcy50b1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmICh2aXNpdG9yKSB7XG5cdFx0XHRjb25zdCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvci50b2tlbikuZmV0Y2goKTtcblxuXHRcdFx0aWYgKHJvb21zICYmIHJvb21zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSByb29tc1swXS5faWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0fVxuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiA9IHZpc2l0b3IudG9rZW47XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuID0gUmFuZG9tLmlkKCk7XG5cblx0XHRcdGNvbnN0IHZpc2l0b3JJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdCh7XG5cdFx0XHRcdHVzZXJuYW1lOiBzbXMuZnJvbS5yZXBsYWNlKC9bXjAtOV0vZywgJycpLFxuXHRcdFx0XHR0b2tlbjogc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbixcblx0XHRcdFx0cGhvbmU6IHtcblx0XHRcdFx0XHRudW1iZXI6IHNtcy5mcm9tXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZCh2aXNpdG9ySWQpO1xuXHRcdH1cblxuXHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UubXNnID0gc21zLmJvZHk7XG5cdFx0c2VuZE1lc3NhZ2UuZ3Vlc3QgPSB2aXNpdG9yO1xuXG5cdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5hdHRhY2htZW50cyA9IHNtcy5tZWRpYS5tYXAoY3VyciA9PiB7XG5cdFx0XHRjb25zdCBhdHRhY2htZW50ID0ge1xuXHRcdFx0XHRtZXNzYWdlX2xpbms6IGN1cnIudXJsXG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBjb250ZW50VHlwZSA9IGN1cnIuY29udGVudFR5cGU7XG5cdFx0XHRzd2l0Y2ggKGNvbnRlbnRUeXBlLnN1YnN0cigwLCBjb250ZW50VHlwZS5pbmRleE9mKCcvJykpKSB7XG5cdFx0XHRcdGNhc2UgJ2ltYWdlJzpcblx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX3VybCA9IGN1cnIudXJsO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd2aWRlbyc6XG5cdFx0XHRcdFx0YXR0YWNobWVudC52aWRlb191cmwgPSBjdXJyLnVybDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnYXVkaW8nOlxuXHRcdFx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fdXJsID0gY3Vyci51cmw7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhdHRhY2htZW50O1xuXHRcdH0pO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2UgPSBTTVNTZXJ2aWNlLnJlc3BvbnNlLmNhbGwodGhpcywgUm9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kTWVzc2FnZShzZW5kTWVzc2FnZSkpO1xuXG5cdFx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0XHRpZiAoc21zLmV4dHJhKSB7XG5cdFx0XHRcdFx0aWYgKHNtcy5leHRyYS5mcm9tQ291bnRyeSkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJywgc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiwgJ2NvdW50cnknLCBzbXMuZXh0cmEuZnJvbUNvdW50cnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc21zLmV4dHJhLmZyb21TdGF0ZSkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJywgc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiwgJ3N0YXRlJywgc21zLmV4dHJhLmZyb21TdGF0ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzbXMuZXh0cmEuZnJvbUNpdHkpIHtcblx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdsaXZlY2hhdDpzZXRDdXN0b21GaWVsZCcsIHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4sICdjaXR5Jywgc21zLmV4dHJhLmZyb21DaXR5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gU01TU2VydmljZS5lcnJvci5jYWxsKHRoaXMsIGUpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgQnVzYm95IGZyb20gJ2J1c2JveSc7XG5pbXBvcnQgZmlsZXNpemUgZnJvbSAnZmlsZXNpemUnO1xuaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vLi4vLi4vc2VydmVyL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L3VwbG9hZC86cmlkJywge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtdmlzaXRvci10b2tlbiddKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmlzaXRvclRva2VuID0gdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtdmlzaXRvci10b2tlbiddO1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbik7XG5cblx0XHRpZiAoIXZpc2l0b3IpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbih2aXNpdG9yVG9rZW4sIHRoaXMudXJsUGFyYW1zLnJpZCk7XG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgYnVzYm95ID0gbmV3IEJ1c2JveSh7IGhlYWRlcnM6IHRoaXMucmVxdWVzdC5oZWFkZXJzIH0pO1xuXHRcdGNvbnN0IGZpbGVzID0gW107XG5cdFx0Y29uc3QgZmllbGRzID0ge307XG5cblx0XHRNZXRlb3Iud3JhcEFzeW5jKChjYWxsYmFjaykgPT4ge1xuXHRcdFx0YnVzYm95Lm9uKCdmaWxlJywgKGZpZWxkbmFtZSwgZmlsZSwgZmlsZW5hbWUsIGVuY29kaW5nLCBtaW1ldHlwZSkgPT4ge1xuXHRcdFx0XHRpZiAoZmllbGRuYW1lICE9PSAnZmlsZScpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmlsZXMucHVzaChuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpZWxkJykpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgZmlsZURhdGUgPSBbXTtcblx0XHRcdFx0ZmlsZS5vbignZGF0YScsIGRhdGEgPT4gZmlsZURhdGUucHVzaChkYXRhKSk7XG5cblx0XHRcdFx0ZmlsZS5vbignZW5kJywgKCkgPT4ge1xuXHRcdFx0XHRcdGZpbGVzLnB1c2goeyBmaWVsZG5hbWUsIGZpbGUsIGZpbGVuYW1lLCBlbmNvZGluZywgbWltZXR5cGUsIGZpbGVCdWZmZXI6IEJ1ZmZlci5jb25jYXQoZmlsZURhdGUpIH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRidXNib3kub24oJ2ZpZWxkJywgKGZpZWxkbmFtZSwgdmFsdWUpID0+IGZpZWxkc1tmaWVsZG5hbWVdID0gdmFsdWUpO1xuXG5cdFx0XHRidXNib3kub24oJ2ZpbmlzaCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4gY2FsbGJhY2soKSkpO1xuXG5cdFx0XHR0aGlzLnJlcXVlc3QucGlwZShidXNib3kpO1xuXHRcdH0pKCk7XG5cblx0XHRpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnRmlsZSByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGlmIChmaWxlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSnVzdCAxIGZpbGUgaXMgYWxsb3dlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGUgPSBmaWxlc1swXTtcblxuXHRcdGlmICghUm9ja2V0Q2hhdC5maWxlVXBsb2FkSXNWYWxpZENvbnRlbnRUeXBlKGZpbGUubWltZXR5cGUpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7XG5cdFx0XHRcdHJlYXNvbjogJ2Vycm9yLXR5cGUtbm90LWFsbG93ZWQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBtYXhGaWxlU2l6ZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX01heEZpbGVTaXplJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHBhcnNlSW50KHZhbHVlKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmVCeUlkKCdGaWxlVXBsb2FkX01heEZpbGVTaXplJykucGFja2FnZVZhbHVlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gLTEgbWF4RmlsZVNpemUgbWVhbnMgdGhlcmUgaXMgbm8gbGltaXRcblx0XHRpZiAobWF4RmlsZVNpemUgPj0gLTEgJiYgZmlsZS5maWxlQnVmZmVyLmxlbmd0aCA+IG1heEZpbGVTaXplKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7XG5cdFx0XHRcdHJlYXNvbjogJ2Vycm9yLXNpemUtbm90LWFsbG93ZWQnLFxuXHRcdFx0XHRzaXplQWxsb3dlZDogZmlsZXNpemUobWF4RmlsZVNpemUpXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJyk7XG5cblx0XHRjb25zdCBkZXRhaWxzID0ge1xuXHRcdFx0bmFtZTogZmlsZS5maWxlbmFtZSxcblx0XHRcdHNpemU6IGZpbGUuZmlsZUJ1ZmZlci5sZW5ndGgsXG5cdFx0XHR0eXBlOiBmaWxlLm1pbWV0eXBlLFxuXHRcdFx0cmlkOiB0aGlzLnVybFBhcmFtcy5yaWQsXG5cdFx0XHR2aXNpdG9yVG9rZW5cblx0XHR9O1xuXG5cdFx0Y29uc3QgdXBsb2FkZWRGaWxlID0gTWV0ZW9yLndyYXBBc3luYyhmaWxlU3RvcmUuaW5zZXJ0LmJpbmQoZmlsZVN0b3JlKSkoZGV0YWlscywgZmlsZS5maWxlQnVmZmVyKTtcblxuXHRcdHVwbG9hZGVkRmlsZS5kZXNjcmlwdGlvbiA9IGZpZWxkcy5kZXNjcmlwdGlvbjtcblxuXHRcdGRlbGV0ZSBmaWVsZHMuZGVzY3JpcHRpb247XG5cdFx0Um9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhNZXRlb3IuY2FsbCgnc2VuZEZpbGVMaXZlY2hhdE1lc3NhZ2UnLCB0aGlzLnVybFBhcmFtcy5yaWQsIHZpc2l0b3JUb2tlbiwgdXBsb2FkZWRGaWxlLCBmaWVsZHMpKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L3VzZXJzLzp0eXBlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHR0eXBlOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgcm9sZTtcblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdHJvbGUgPSAnbGl2ZWNoYXQtYWdlbnQnO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1tYW5hZ2VyJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUocm9sZSk7XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0dXNlcnM6IHVzZXJzLmZldGNoKCkubWFwKHVzZXIgPT4gXy5waWNrKHVzZXIsICdfaWQnLCAndXNlcm5hbWUnLCAnbmFtZScsICdzdGF0dXMnLCAnc3RhdHVzTGl2ZWNoYXQnKSlcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fSxcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHR0eXBlOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdFx0dXNlcm5hbWU6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmFkZEFnZW50KHRoaXMuYm9keVBhcmFtcy51c2VybmFtZSk7XG5cdFx0XHRcdGlmICh1c2VyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdtYW5hZ2VyJykge1xuXHRcdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5hZGRNYW5hZ2VyKHRoaXMuYm9keVBhcmFtcy51c2VybmFtZSk7XG5cdFx0XHRcdGlmICh1c2VyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyAnSW52YWxpZCB0eXBlJztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvdXNlcnMvOnR5cGUvOl9pZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0dHlwZTogU3RyaW5nLFxuXHRcdFx0XHRfaWQ6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVybFBhcmFtcy5faWQpO1xuXG5cdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1VzZXIgbm90IGZvdW5kJyk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCByb2xlO1xuXG5cdFx0XHRpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ2FnZW50Jykge1xuXHRcdFx0XHRyb2xlID0gJ2xpdmVjaGF0LWFnZW50Jztcblx0XHRcdH0gZWxzZSBpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ21hbmFnZXInKSB7XG5cdFx0XHRcdHJvbGUgPSAnbGl2ZWNoYXQtbWFuYWdlcic7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyAnSW52YWxpZCB0eXBlJztcblx0XHRcdH1cblxuXHRcdFx0aWYgKHVzZXIucm9sZXMuaW5kZXhPZihyb2xlKSAhPT0gLTEpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdHVzZXI6IF8ucGljayh1c2VyLCAnX2lkJywgJ3VzZXJuYW1lJylcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0dXNlcjogbnVsbFxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9LFxuXHRkZWxldGUoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRcdF9pZDogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLl9pZCk7XG5cblx0XHRcdGlmICghdXNlcikge1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ2FnZW50Jykge1xuXHRcdFx0XHRpZiAoUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVBZ2VudCh1c2VyLnVzZXJuYW1lKSkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ21hbmFnZXInKSB7XG5cdFx0XHRcdGlmIChSb2NrZXRDaGF0LkxpdmVjaGF0LnJlbW92ZU1hbmFnZXIodXNlci51c2VybmFtZSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyAnSW52YWxpZCB0eXBlJztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vLi4vLi4vc2VydmVyL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L3Zpc2l0b3IvOnZpc2l0b3JUb2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0aGlzLnVybFBhcmFtcy52aXNpdG9yVG9rZW4pO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHZpc2l0b3IpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L3Zpc2l0b3IvOnZpc2l0b3JUb2tlbi9yb29tJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeVZpc2l0b3JUb2tlbih0aGlzLnVybFBhcmFtcy52aXNpdG9yVG9rZW4sIHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRuYW1lOiAxLFxuXHRcdFx0XHR0OiAxLFxuXHRcdFx0XHRjbDogMSxcblx0XHRcdFx0dTogMSxcblx0XHRcdFx0dXNlcm5hbWVzOiAxLFxuXHRcdFx0XHRzZXJ2ZWRCeTogMVxuXHRcdFx0fVxuXHRcdH0pLmZldGNoKCk7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyByb29tcyB9KTtcblx0fVxufSk7XG4iXX0=
