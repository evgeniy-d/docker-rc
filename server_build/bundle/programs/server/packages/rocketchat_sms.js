(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:sms":{"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_sms/settings.js                                                //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
Meteor.startup(function () {
  RocketChat.settings.addGroup('SMS', function () {
    this.add('SMS_Enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled'
    });
    this.add('SMS_Service', 'twilio', {
      type: 'select',
      values: [{
        key: 'twilio',
        i18nLabel: 'Twilio'
      }],
      i18nLabel: 'Service'
    });
    this.section('Twilio', function () {
      this.add('SMS_Twilio_Account_SID', '', {
        type: 'string',
        enableQuery: {
          _id: 'SMS_Service',
          value: 'twilio'
        },
        i18nLabel: 'Account_SID'
      });
      this.add('SMS_Twilio_authToken', '', {
        type: 'string',
        enableQuery: {
          _id: 'SMS_Service',
          value: 'twilio'
        },
        i18nLabel: 'Auth_Token'
      });
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////

},"SMS.js":function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_sms/SMS.js                                                     //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
/* globals RocketChat */
RocketChat.SMS = {
  enabled: false,
  services: {},
  accountSid: null,
  authToken: null,
  fromNumber: null,

  registerService(name, service) {
    this.services[name] = service;
  },

  getService(name) {
    if (!this.services[name]) {
      throw new Meteor.Error('error-sms-service-not-configured');
    }

    return new this.services[name](this.accountSid, this.authToken, this.fromNumber);
  }

};
RocketChat.settings.get('SMS_Enabled', function (key, value) {
  RocketChat.SMS.enabled = value;
});
////////////////////////////////////////////////////////////////////////////////////////

},"services":{"twilio.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_sms/services/twilio.js                                         //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
let twilio;
module.watch(require("twilio"), {
  default(v) {
    twilio = v;
  }

}, 0);

class Twilio {
  constructor() {
    this.accountSid = RocketChat.settings.get('SMS_Twilio_Account_SID');
    this.authToken = RocketChat.settings.get('SMS_Twilio_authToken');
  }

  parse(data) {
    let numMedia = 0;
    const returnData = {
      from: data.From,
      to: data.To,
      body: data.Body,
      extra: {
        toCountry: data.ToCountry,
        toState: data.ToState,
        toCity: data.ToCity,
        toZip: data.ToZip,
        fromCountry: data.FromCountry,
        fromState: data.FromState,
        fromCity: data.FromCity,
        fromZip: data.FromZip
      }
    };

    if (data.NumMedia) {
      numMedia = parseInt(data.NumMedia, 10);
    }

    if (isNaN(numMedia)) {
      console.error(`Error parsing NumMedia ${data.NumMedia}`);
      return returnData;
    }

    returnData.media = [];

    for (let mediaIndex = 0; mediaIndex < numMedia; mediaIndex++) {
      const media = {
        'url': '',
        'contentType': ''
      };
      const mediaUrl = data[`MediaUrl${mediaIndex}`];
      const contentType = data[`MediaContentType${mediaIndex}`];
      media.url = mediaUrl;
      media.contentType = contentType;
      returnData.media.push(media);
    }

    return returnData;
  }

  send(fromNumber, toNumber, message) {
    const client = twilio(this.accountSid, this.authToken);
    client.messages.create({
      to: toNumber,
      from: fromNumber,
      body: message
    });
  }

  response()
  /* message */
  {
    return {
      headers: {
        'Content-Type': 'text/xml'
      },
      body: '<Response></Response>'
    };
  }

  error(error) {
    let message = '';

    if (error.reason) {
      message = `<Message>${error.reason}</Message>`;
    }

    return {
      headers: {
        'Content-Type': 'text/xml'
      },
      body: `<Response>${message}</Response>`
    };
  }

}

RocketChat.SMS.registerService('twilio', Twilio);
////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:sms/settings.js");
require("/node_modules/meteor/rocketchat:sms/SMS.js");
require("/node_modules/meteor/rocketchat:sms/services/twilio.js");

/* Exports */
Package._define("rocketchat:sms");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_sms.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbXMvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c21zL1NNUy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbXMvc2VydmljZXMvdHdpbGlvLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJpMThuTGFiZWwiLCJ2YWx1ZXMiLCJrZXkiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsIlNNUyIsImVuYWJsZWQiLCJzZXJ2aWNlcyIsImFjY291bnRTaWQiLCJhdXRoVG9rZW4iLCJmcm9tTnVtYmVyIiwicmVnaXN0ZXJTZXJ2aWNlIiwibmFtZSIsInNlcnZpY2UiLCJnZXRTZXJ2aWNlIiwiRXJyb3IiLCJnZXQiLCJ0d2lsaW8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIlR3aWxpbyIsImNvbnN0cnVjdG9yIiwicGFyc2UiLCJkYXRhIiwibnVtTWVkaWEiLCJyZXR1cm5EYXRhIiwiZnJvbSIsIkZyb20iLCJ0byIsIlRvIiwiYm9keSIsIkJvZHkiLCJleHRyYSIsInRvQ291bnRyeSIsIlRvQ291bnRyeSIsInRvU3RhdGUiLCJUb1N0YXRlIiwidG9DaXR5IiwiVG9DaXR5IiwidG9aaXAiLCJUb1ppcCIsImZyb21Db3VudHJ5IiwiRnJvbUNvdW50cnkiLCJmcm9tU3RhdGUiLCJGcm9tU3RhdGUiLCJmcm9tQ2l0eSIsIkZyb21DaXR5IiwiZnJvbVppcCIsIkZyb21aaXAiLCJOdW1NZWRpYSIsInBhcnNlSW50IiwiaXNOYU4iLCJjb25zb2xlIiwiZXJyb3IiLCJtZWRpYSIsIm1lZGlhSW5kZXgiLCJtZWRpYVVybCIsImNvbnRlbnRUeXBlIiwidXJsIiwicHVzaCIsInNlbmQiLCJ0b051bWJlciIsIm1lc3NhZ2UiLCJjbGllbnQiLCJtZXNzYWdlcyIsImNyZWF0ZSIsInJlc3BvbnNlIiwiaGVhZGVycyIsInJlYXNvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsUUFBcEIsQ0FBNkIsS0FBN0IsRUFBb0MsWUFBVztBQUM5QyxTQUFLQyxHQUFMLENBQVMsYUFBVCxFQUF3QixLQUF4QixFQUErQjtBQUM5QkMsWUFBTSxTQUR3QjtBQUU5QkMsaUJBQVc7QUFGbUIsS0FBL0I7QUFLQSxTQUFLRixHQUFMLENBQVMsYUFBVCxFQUF3QixRQUF4QixFQUFrQztBQUNqQ0MsWUFBTSxRQUQyQjtBQUVqQ0UsY0FBUSxDQUFDO0FBQ1JDLGFBQUssUUFERztBQUVSRixtQkFBVztBQUZILE9BQUQsQ0FGeUI7QUFNakNBLGlCQUFXO0FBTnNCLEtBQWxDO0FBU0EsU0FBS0csT0FBTCxDQUFhLFFBQWIsRUFBdUIsWUFBVztBQUNqQyxXQUFLTCxHQUFMLENBQVMsd0JBQVQsRUFBbUMsRUFBbkMsRUFBdUM7QUFDdENDLGNBQU0sUUFEZ0M7QUFFdENLLHFCQUFhO0FBQ1pDLGVBQUssYUFETztBQUVaQyxpQkFBTztBQUZLLFNBRnlCO0FBTXRDTixtQkFBVztBQU4yQixPQUF2QztBQVFBLFdBQUtGLEdBQUwsQ0FBUyxzQkFBVCxFQUFpQyxFQUFqQyxFQUFxQztBQUNwQ0MsY0FBTSxRQUQ4QjtBQUVwQ0sscUJBQWE7QUFDWkMsZUFBSyxhQURPO0FBRVpDLGlCQUFPO0FBRkssU0FGdUI7QUFNcENOLG1CQUFXO0FBTnlCLE9BQXJDO0FBUUEsS0FqQkQ7QUFrQkEsR0FqQ0Q7QUFrQ0EsQ0FuQ0QsRTs7Ozs7Ozs7Ozs7QUNBQTtBQUNBTCxXQUFXWSxHQUFYLEdBQWlCO0FBQ2hCQyxXQUFTLEtBRE87QUFFaEJDLFlBQVUsRUFGTTtBQUdoQkMsY0FBWSxJQUhJO0FBSWhCQyxhQUFXLElBSks7QUFLaEJDLGNBQVksSUFMSTs7QUFPaEJDLGtCQUFnQkMsSUFBaEIsRUFBc0JDLE9BQXRCLEVBQStCO0FBQzlCLFNBQUtOLFFBQUwsQ0FBY0ssSUFBZCxJQUFzQkMsT0FBdEI7QUFDQSxHQVRlOztBQVdoQkMsYUFBV0YsSUFBWCxFQUFpQjtBQUNoQixRQUFJLENBQUMsS0FBS0wsUUFBTCxDQUFjSyxJQUFkLENBQUwsRUFBMEI7QUFDekIsWUFBTSxJQUFJckIsT0FBT3dCLEtBQVgsQ0FBaUIsa0NBQWpCLENBQU47QUFDQTs7QUFDRCxXQUFPLElBQUksS0FBS1IsUUFBTCxDQUFjSyxJQUFkLENBQUosQ0FBd0IsS0FBS0osVUFBN0IsRUFBeUMsS0FBS0MsU0FBOUMsRUFBeUQsS0FBS0MsVUFBOUQsQ0FBUDtBQUNBOztBQWhCZSxDQUFqQjtBQW1CQWpCLFdBQVdDLFFBQVgsQ0FBb0JzQixHQUFwQixDQUF3QixhQUF4QixFQUF1QyxVQUFTaEIsR0FBVCxFQUFjSSxLQUFkLEVBQXFCO0FBQzNEWCxhQUFXWSxHQUFYLENBQWVDLE9BQWYsR0FBeUJGLEtBQXpCO0FBQ0EsQ0FGRCxFOzs7Ozs7Ozs7OztBQ3BCQSxJQUFJYSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGFBQU9LLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7O0FBR1gsTUFBTUMsTUFBTixDQUFhO0FBQ1pDLGdCQUFjO0FBQ2IsU0FBS2hCLFVBQUwsR0FBa0JmLFdBQVdDLFFBQVgsQ0FBb0JzQixHQUFwQixDQUF3Qix3QkFBeEIsQ0FBbEI7QUFDQSxTQUFLUCxTQUFMLEdBQWlCaEIsV0FBV0MsUUFBWCxDQUFvQnNCLEdBQXBCLENBQXdCLHNCQUF4QixDQUFqQjtBQUNBOztBQUNEUyxRQUFNQyxJQUFOLEVBQVk7QUFDWCxRQUFJQyxXQUFXLENBQWY7QUFFQSxVQUFNQyxhQUFhO0FBQ2xCQyxZQUFNSCxLQUFLSSxJQURPO0FBRWxCQyxVQUFJTCxLQUFLTSxFQUZTO0FBR2xCQyxZQUFNUCxLQUFLUSxJQUhPO0FBS2xCQyxhQUFPO0FBQ05DLG1CQUFXVixLQUFLVyxTQURWO0FBRU5DLGlCQUFTWixLQUFLYSxPQUZSO0FBR05DLGdCQUFRZCxLQUFLZSxNQUhQO0FBSU5DLGVBQU9oQixLQUFLaUIsS0FKTjtBQUtOQyxxQkFBYWxCLEtBQUttQixXQUxaO0FBTU5DLG1CQUFXcEIsS0FBS3FCLFNBTlY7QUFPTkMsa0JBQVV0QixLQUFLdUIsUUFQVDtBQVFOQyxpQkFBU3hCLEtBQUt5QjtBQVJSO0FBTFcsS0FBbkI7O0FBaUJBLFFBQUl6QixLQUFLMEIsUUFBVCxFQUFtQjtBQUNsQnpCLGlCQUFXMEIsU0FBUzNCLEtBQUswQixRQUFkLEVBQXdCLEVBQXhCLENBQVg7QUFDQTs7QUFFRCxRQUFJRSxNQUFNM0IsUUFBTixDQUFKLEVBQXFCO0FBQ3BCNEIsY0FBUUMsS0FBUixDQUFlLDBCQUEwQjlCLEtBQUswQixRQUFVLEVBQXhEO0FBQ0EsYUFBT3hCLFVBQVA7QUFDQTs7QUFFREEsZUFBVzZCLEtBQVgsR0FBbUIsRUFBbkI7O0FBRUEsU0FBSyxJQUFJQyxhQUFhLENBQXRCLEVBQXlCQSxhQUFhL0IsUUFBdEMsRUFBZ0QrQixZQUFoRCxFQUE4RDtBQUM3RCxZQUFNRCxRQUFRO0FBQ2IsZUFBTyxFQURNO0FBRWIsdUJBQWU7QUFGRixPQUFkO0FBS0EsWUFBTUUsV0FBV2pDLEtBQU0sV0FBV2dDLFVBQVksRUFBN0IsQ0FBakI7QUFDQSxZQUFNRSxjQUFjbEMsS0FBTSxtQkFBbUJnQyxVQUFZLEVBQXJDLENBQXBCO0FBRUFELFlBQU1JLEdBQU4sR0FBWUYsUUFBWjtBQUNBRixZQUFNRyxXQUFOLEdBQW9CQSxXQUFwQjtBQUVBaEMsaUJBQVc2QixLQUFYLENBQWlCSyxJQUFqQixDQUFzQkwsS0FBdEI7QUFDQTs7QUFFRCxXQUFPN0IsVUFBUDtBQUNBOztBQUNEbUMsT0FBS3JELFVBQUwsRUFBaUJzRCxRQUFqQixFQUEyQkMsT0FBM0IsRUFBb0M7QUFDbkMsVUFBTUMsU0FBU2pELE9BQU8sS0FBS1QsVUFBWixFQUF3QixLQUFLQyxTQUE3QixDQUFmO0FBRUF5RCxXQUFPQyxRQUFQLENBQWdCQyxNQUFoQixDQUF1QjtBQUN0QnJDLFVBQUlpQyxRQURrQjtBQUV0Qm5DLFlBQU1uQixVQUZnQjtBQUd0QnVCLFlBQU1nQztBQUhnQixLQUF2QjtBQUtBOztBQUNESTtBQUFTO0FBQWU7QUFDdkIsV0FBTztBQUNOQyxlQUFTO0FBQ1Isd0JBQWdCO0FBRFIsT0FESDtBQUlOckMsWUFBTTtBQUpBLEtBQVA7QUFNQTs7QUFDRHVCLFFBQU1BLEtBQU4sRUFBYTtBQUNaLFFBQUlTLFVBQVUsRUFBZDs7QUFDQSxRQUFJVCxNQUFNZSxNQUFWLEVBQWtCO0FBQ2pCTixnQkFBVyxZQUFZVCxNQUFNZSxNQUFRLFlBQXJDO0FBQ0E7O0FBQ0QsV0FBTztBQUNORCxlQUFTO0FBQ1Isd0JBQWdCO0FBRFIsT0FESDtBQUlOckMsWUFBTyxhQUFhZ0MsT0FBUztBQUp2QixLQUFQO0FBTUE7O0FBakZXOztBQW9GYnhFLFdBQVdZLEdBQVgsQ0FBZU0sZUFBZixDQUErQixRQUEvQixFQUF5Q1ksTUFBekMsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnU01TJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ1NNU19FbmFibGVkJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGkxOG5MYWJlbDogJ0VuYWJsZWQnXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU01TX1NlcnZpY2UnLCAndHdpbGlvJywge1xuXHRcdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0XHR2YWx1ZXM6IFt7XG5cdFx0XHRcdGtleTogJ3R3aWxpbycsXG5cdFx0XHRcdGkxOG5MYWJlbDogJ1R3aWxpbydcblx0XHRcdH1dLFxuXHRcdFx0aTE4bkxhYmVsOiAnU2VydmljZSdcblx0XHR9KTtcblxuXHRcdHRoaXMuc2VjdGlvbignVHdpbGlvJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmFkZCgnU01TX1R3aWxpb19BY2NvdW50X1NJRCcsICcnLCB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRcdF9pZDogJ1NNU19TZXJ2aWNlJyxcblx0XHRcdFx0XHR2YWx1ZTogJ3R3aWxpbydcblx0XHRcdFx0fSxcblx0XHRcdFx0aTE4bkxhYmVsOiAnQWNjb3VudF9TSUQnXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuYWRkKCdTTVNfVHdpbGlvX2F1dGhUb2tlbicsICcnLCB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRcdF9pZDogJ1NNU19TZXJ2aWNlJyxcblx0XHRcdFx0XHR2YWx1ZTogJ3R3aWxpbydcblx0XHRcdFx0fSxcblx0XHRcdFx0aTE4bkxhYmVsOiAnQXV0aF9Ub2tlbidcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIiwiLyogZ2xvYmFscyBSb2NrZXRDaGF0ICovXG5Sb2NrZXRDaGF0LlNNUyA9IHtcblx0ZW5hYmxlZDogZmFsc2UsXG5cdHNlcnZpY2VzOiB7fSxcblx0YWNjb3VudFNpZDogbnVsbCxcblx0YXV0aFRva2VuOiBudWxsLFxuXHRmcm9tTnVtYmVyOiBudWxsLFxuXG5cdHJlZ2lzdGVyU2VydmljZShuYW1lLCBzZXJ2aWNlKSB7XG5cdFx0dGhpcy5zZXJ2aWNlc1tuYW1lXSA9IHNlcnZpY2U7XG5cdH0sXG5cblx0Z2V0U2VydmljZShuYW1lKSB7XG5cdFx0aWYgKCF0aGlzLnNlcnZpY2VzW25hbWVdKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zbXMtc2VydmljZS1ub3QtY29uZmlndXJlZCcpO1xuXHRcdH1cblx0XHRyZXR1cm4gbmV3IHRoaXMuc2VydmljZXNbbmFtZV0odGhpcy5hY2NvdW50U2lkLCB0aGlzLmF1dGhUb2tlbiwgdGhpcy5mcm9tTnVtYmVyKTtcblx0fVxufTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NNU19FbmFibGVkJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRSb2NrZXRDaGF0LlNNUy5lbmFibGVkID0gdmFsdWU7XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdCAqL1xuaW1wb3J0IHR3aWxpbyBmcm9tICd0d2lsaW8nO1xuXG5jbGFzcyBUd2lsaW8ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmFjY291bnRTaWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU01TX1R3aWxpb19BY2NvdW50X1NJRCcpO1xuXHRcdHRoaXMuYXV0aFRva2VuID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NNU19Ud2lsaW9fYXV0aFRva2VuJyk7XG5cdH1cblx0cGFyc2UoZGF0YSkge1xuXHRcdGxldCBudW1NZWRpYSA9IDA7XG5cblx0XHRjb25zdCByZXR1cm5EYXRhID0ge1xuXHRcdFx0ZnJvbTogZGF0YS5Gcm9tLFxuXHRcdFx0dG86IGRhdGEuVG8sXG5cdFx0XHRib2R5OiBkYXRhLkJvZHksXG5cblx0XHRcdGV4dHJhOiB7XG5cdFx0XHRcdHRvQ291bnRyeTogZGF0YS5Ub0NvdW50cnksXG5cdFx0XHRcdHRvU3RhdGU6IGRhdGEuVG9TdGF0ZSxcblx0XHRcdFx0dG9DaXR5OiBkYXRhLlRvQ2l0eSxcblx0XHRcdFx0dG9aaXA6IGRhdGEuVG9aaXAsXG5cdFx0XHRcdGZyb21Db3VudHJ5OiBkYXRhLkZyb21Db3VudHJ5LFxuXHRcdFx0XHRmcm9tU3RhdGU6IGRhdGEuRnJvbVN0YXRlLFxuXHRcdFx0XHRmcm9tQ2l0eTogZGF0YS5Gcm9tQ2l0eSxcblx0XHRcdFx0ZnJvbVppcDogZGF0YS5Gcm9tWmlwXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmIChkYXRhLk51bU1lZGlhKSB7XG5cdFx0XHRudW1NZWRpYSA9IHBhcnNlSW50KGRhdGEuTnVtTWVkaWEsIDEwKTtcblx0XHR9XG5cblx0XHRpZiAoaXNOYU4obnVtTWVkaWEpKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIE51bU1lZGlhICR7IGRhdGEuTnVtTWVkaWEgfWApO1xuXHRcdFx0cmV0dXJuIHJldHVybkRhdGE7XG5cdFx0fVxuXG5cdFx0cmV0dXJuRGF0YS5tZWRpYSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgbWVkaWFJbmRleCA9IDA7IG1lZGlhSW5kZXggPCBudW1NZWRpYTsgbWVkaWFJbmRleCsrKSB7XG5cdFx0XHRjb25zdCBtZWRpYSA9IHtcblx0XHRcdFx0J3VybCc6ICcnLFxuXHRcdFx0XHQnY29udGVudFR5cGUnOiAnJ1xuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3QgbWVkaWFVcmwgPSBkYXRhW2BNZWRpYVVybCR7IG1lZGlhSW5kZXggfWBdO1xuXHRcdFx0Y29uc3QgY29udGVudFR5cGUgPSBkYXRhW2BNZWRpYUNvbnRlbnRUeXBlJHsgbWVkaWFJbmRleCB9YF07XG5cblx0XHRcdG1lZGlhLnVybCA9IG1lZGlhVXJsO1xuXHRcdFx0bWVkaWEuY29udGVudFR5cGUgPSBjb250ZW50VHlwZTtcblxuXHRcdFx0cmV0dXJuRGF0YS5tZWRpYS5wdXNoKG1lZGlhKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmV0dXJuRGF0YTtcblx0fVxuXHRzZW5kKGZyb21OdW1iZXIsIHRvTnVtYmVyLCBtZXNzYWdlKSB7XG5cdFx0Y29uc3QgY2xpZW50ID0gdHdpbGlvKHRoaXMuYWNjb3VudFNpZCwgdGhpcy5hdXRoVG9rZW4pO1xuXG5cdFx0Y2xpZW50Lm1lc3NhZ2VzLmNyZWF0ZSh7XG5cdFx0XHR0bzogdG9OdW1iZXIsXG5cdFx0XHRmcm9tOiBmcm9tTnVtYmVyLFxuXHRcdFx0Ym9keTogbWVzc2FnZVxuXHRcdH0pO1xuXHR9XG5cdHJlc3BvbnNlKC8qIG1lc3NhZ2UgKi8pIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnQ29udGVudC1UeXBlJzogJ3RleHQveG1sJ1xuXHRcdFx0fSxcblx0XHRcdGJvZHk6ICc8UmVzcG9uc2U+PC9SZXNwb25zZT4nXG5cdFx0fTtcblx0fVxuXHRlcnJvcihlcnJvcikge1xuXHRcdGxldCBtZXNzYWdlID0gJyc7XG5cdFx0aWYgKGVycm9yLnJlYXNvbikge1xuXHRcdFx0bWVzc2FnZSA9IGA8TWVzc2FnZT4keyBlcnJvci5yZWFzb24gfTwvTWVzc2FnZT5gO1xuXHRcdH1cblx0XHRyZXR1cm4ge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnQ29udGVudC1UeXBlJzogJ3RleHQveG1sJ1xuXHRcdFx0fSxcblx0XHRcdGJvZHk6IGA8UmVzcG9uc2U+JHsgbWVzc2FnZSB9PC9SZXNwb25zZT5gXG5cdFx0fTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0LlNNUy5yZWdpc3RlclNlcnZpY2UoJ3R3aWxpbycsIFR3aWxpbyk7XG4iXX0=
