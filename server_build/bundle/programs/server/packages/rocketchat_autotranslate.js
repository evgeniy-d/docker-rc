(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var message, target;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:autotranslate":{"server":{"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/settings.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.startup(function () {
  RocketChat.settings.add('AutoTranslate_Enabled', false, {
    type: 'boolean',
    group: 'Message',
    section: 'AutoTranslate',
    public: true
  });
  RocketChat.settings.add('AutoTranslate_GoogleAPIKey', '', {
    type: 'string',
    group: 'Message',
    section: 'AutoTranslate',
    enableQuery: {
      _id: 'AutoTranslate_Enabled',
      value: true
    }
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"autotranslate.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/autotranslate.js                                                          //
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

class AutoTranslate {
  constructor() {
    this.languages = [];
    this.enabled = RocketChat.settings.get('AutoTranslate_Enabled');
    this.apiKey = RocketChat.settings.get('AutoTranslate_GoogleAPIKey');
    this.supportedLanguages = {};
    RocketChat.callbacks.add('afterSaveMessage', this.translateMessage.bind(this), RocketChat.callbacks.priority.MEDIUM, 'AutoTranslate');
    RocketChat.settings.get('AutoTranslate_Enabled', (key, value) => {
      this.enabled = value;
    });
    RocketChat.settings.get('AutoTranslate_GoogleAPIKey', (key, value) => {
      this.apiKey = value;
    });
  }

  tokenize(message) {
    if (!message.tokens || !Array.isArray(message.tokens)) {
      message.tokens = [];
    }

    message = this.tokenizeEmojis(message);
    message = this.tokenizeCode(message);
    message = this.tokenizeURLs(message);
    message = this.tokenizeMentions(message);
    return message;
  }

  tokenizeEmojis(message) {
    let count = message.tokens.length;
    message.msg = message.msg.replace(/:[+\w\d]+:/g, function (match) {
      const token = `<i class=notranslate>{${count++}}</i>`;
      message.tokens.push({
        token,
        text: match
      });
      return token;
    });
    return message;
  }

  tokenizeURLs(message) {
    let count = message.tokens.length;
    const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|'); // Support ![alt text](http://image url) and [text](http://link)

    message.msg = message.msg.replace(new RegExp(`(!?\\[)([^\\]]+)(\\]\\((?:${schemes}):\\/\\/[^\\)]+\\))`, 'gm'), function (match, pre, text, post) {
      const pretoken = `<i class=notranslate>{${count++}}</i>`;
      message.tokens.push({
        token: pretoken,
        text: pre
      });
      const posttoken = `<i class=notranslate>{${count++}}</i>`;
      message.tokens.push({
        token: posttoken,
        text: post
      });
      return pretoken + text + posttoken;
    }); // Support <http://link|Text>

    message.msg = message.msg.replace(new RegExp(`((?:<|&lt;)(?:${schemes}):\\/\\/[^\\|]+\\|)(.+?)(?=>|&gt;)((?:>|&gt;))`, 'gm'), function (match, pre, text, post) {
      const pretoken = `<i class=notranslate>{${count++}}</i>`;
      message.tokens.push({
        token: pretoken,
        text: pre
      });
      const posttoken = `<i class=notranslate>{${count++}}</i>`;
      message.tokens.push({
        token: posttoken,
        text: post
      });
      return pretoken + text + posttoken;
    });
    return message;
  }

  tokenizeCode(message) {
    let count = message.tokens.length;
    message.html = message.msg;
    message = RocketChat.Markdown.parseMessageNotEscaped(message);
    message.msg = message.html;

    for (const tokenIndex in message.tokens) {
      if (message.tokens.hasOwnProperty(tokenIndex)) {
        const token = message.tokens[tokenIndex].token;

        if (token.indexOf('notranslate') === -1) {
          const newToken = `<i class=notranslate>{${count++}}</i>`;
          message.msg = message.msg.replace(token, newToken);
          message.tokens[tokenIndex].token = newToken;
        }
      }
    }

    return message;
  }

  tokenizeMentions(message) {
    let count = message.tokens.length;

    if (message.mentions && message.mentions.length > 0) {
      message.mentions.forEach(mention => {
        message.msg = message.msg.replace(new RegExp(`(@${mention.username})`, 'gm'), match => {
          const token = `<i class=notranslate>{${count++}}</i>`;
          message.tokens.push({
            token,
            text: match
          });
          return token;
        });
      });
    }

    if (message.channels && message.channels.length > 0) {
      message.channels.forEach(channel => {
        message.msg = message.msg.replace(new RegExp(`(#${channel.name})`, 'gm'), match => {
          const token = `<i class=notranslate>{${count++}}</i>`;
          message.tokens.push({
            token,
            text: match
          });
          return token;
        });
      });
    }

    return message;
  }

  deTokenize(message) {
    if (message.tokens && message.tokens.length > 0) {
      for (const _ref of message.tokens) {
        const {
          token,
          text,
          noHtml
        } = _ref;
        message.msg = message.msg.replace(token, () => noHtml ? noHtml : text);
      }
    }

    return message.msg;
  }

  translateMessage(message, room, targetLanguage) {
    if (this.enabled && this.apiKey) {
      let targetLanguages;

      if (targetLanguage) {
        targetLanguages = [targetLanguage];
      } else {
        targetLanguages = RocketChat.models.Subscriptions.getAutoTranslateLanguagesByRoomAndNotUser(room._id, message.u && message.u._id);
      }

      if (message.msg) {
        Meteor.defer(() => {
          const translations = {};
          let targetMessage = Object.assign({}, message);
          targetMessage.html = s.escapeHTML(String(targetMessage.msg));
          targetMessage = this.tokenize(targetMessage);
          let msgs = targetMessage.msg.split('\n');
          msgs = msgs.map(msg => encodeURIComponent(msg));
          const query = `q=${msgs.join('&q=')}`;
          const supportedLanguages = this.getSupportedLanguages('en');
          targetLanguages.forEach(language => {
            if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, {
              language
            })) {
              language = language.substr(0, 2);
            }

            let result;

            try {
              result = HTTP.get('https://translation.googleapis.com/language/translate/v2', {
                params: {
                  key: this.apiKey,
                  target: language
                },
                query
              });
            } catch (e) {
              console.log('Error translating message', e);
              return message;
            }

            if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
              const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
              translations[language] = this.deTokenize(Object.assign({}, targetMessage, {
                msg: txt
              }));
            }
          });

          if (!_.isEmpty(translations)) {
            RocketChat.models.Messages.addTranslations(message._id, translations);
          }
        });
      }

      if (message.attachments && message.attachments.length > 0) {
        Meteor.defer(() => {
          for (const index in message.attachments) {
            if (message.attachments.hasOwnProperty(index)) {
              const attachment = message.attachments[index];
              const translations = {};

              if (attachment.description || attachment.text) {
                const query = `q=${encodeURIComponent(attachment.description || attachment.text)}`;
                const supportedLanguages = this.getSupportedLanguages('en');
                targetLanguages.forEach(language => {
                  if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, {
                    language
                  })) {
                    language = language.substr(0, 2);
                  }

                  const result = HTTP.get('https://translation.googleapis.com/language/translate/v2', {
                    params: {
                      key: this.apiKey,
                      target: language
                    },
                    query
                  });

                  if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
                    const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
                    translations[language] = txt;
                  }
                });

                if (!_.isEmpty(translations)) {
                  RocketChat.models.Messages.addAttachmentTranslations(message._id, index, translations);
                }
              }
            }
          }
        });
      }
    }

    return message;
  }

  getSupportedLanguages(target) {
    if (this.enabled && this.apiKey) {
      if (this.supportedLanguages[target]) {
        return this.supportedLanguages[target];
      }

      let result;
      const params = {
        key: this.apiKey
      };

      if (target) {
        params.target = target;
      }

      try {
        result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', {
          params
        });
      } catch (e) {
        if (e.response && e.response.statusCode === 400 && e.response.data && e.response.data.error && e.response.data.error.status === 'INVALID_ARGUMENT') {
          params.target = 'en';
          target = 'en';

          if (!this.supportedLanguages[target]) {
            result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', {
              params
            });
          }
        }
      } finally {
        if (this.supportedLanguages[target]) {
          return this.supportedLanguages[target];
        } else {
          this.supportedLanguages[target || 'en'] = result && result.data && result.data.data && result.data.data.languages;
          return this.supportedLanguages[target || 'en'];
        }
      }
    }
  }

}

RocketChat.AutoTranslate = new AutoTranslate();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"permissions.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/permissions.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.startup(() => {
  if (RocketChat.models && RocketChat.models.Permissions) {
    if (!RocketChat.models.Permissions.findOne({
      _id: 'auto-translate'
    })) {
      RocketChat.models.Permissions.insert({
        _id: 'auto-translate',
        roles: ['admin']
      });
    }
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"Messages.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/models/Messages.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Messages.addTranslations = function (messageId, translations) {
  const updateObj = {};
  Object.keys(translations).forEach(key => {
    const translation = translations[key];
    updateObj[`translations.${key}`] = translation;
  });
  return this.update({
    _id: messageId
  }, {
    $set: updateObj
  });
};

RocketChat.models.Messages.addAttachmentTranslations = function (messageId, attachmentIndex, translations) {
  const updateObj = {};
  Object.keys(translations).forEach(key => {
    const translation = translations[key];
    updateObj[`attachments.${attachmentIndex}.translations.${key}`] = translation;
  });
  return this.update({
    _id: messageId
  }, {
    $set: updateObj
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/models/Subscriptions.js                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Subscriptions.updateAutoTranslateById = function (_id, autoTranslate) {
  const query = {
    _id
  };
  let update;

  if (autoTranslate) {
    update = {
      $set: {
        autoTranslate
      }
    };
  } else {
    update = {
      $unset: {
        autoTranslate: 1
      }
    };
  }

  return this.update(query, update);
};

RocketChat.models.Subscriptions.updateAutoTranslateLanguageById = function (_id, autoTranslateLanguage) {
  const query = {
    _id
  };
  const update = {
    $set: {
      autoTranslateLanguage
    }
  };
  return this.update(query, update);
};

RocketChat.models.Subscriptions.getAutoTranslateLanguagesByRoomAndNotUser = function (rid, userId) {
  const subscriptionsRaw = RocketChat.models.Subscriptions.model.rawCollection();
  const distinct = Meteor.wrapAsync(subscriptionsRaw.distinct, subscriptionsRaw);
  const query = {
    rid,
    'u._id': {
      $ne: userId
    },
    autoTranslate: true
  };
  return distinct('autoTranslateLanguage', query);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"saveSettings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/methods/saveSettings.js                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  'autoTranslate.saveSettings'(rid, field, value, options) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'saveAutoTranslateSettings'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'auto-translate')) {
      throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', {
        method: 'autoTranslate.saveSettings'
      });
    }

    check(rid, String);
    check(field, String);
    check(value, String);

    if (['autoTranslate', 'autoTranslateLanguage'].indexOf(field) === -1) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', {
        method: 'saveAutoTranslateSettings'
      });
    }

    const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());

    if (!subscription) {
      throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
        method: 'saveAutoTranslateSettings'
      });
    }

    switch (field) {
      case 'autoTranslate':
        RocketChat.models.Subscriptions.updateAutoTranslateById(subscription._id, value === '1' ? true : false);

        if (!subscription.autoTranslateLanguage && options.defaultLanguage) {
          RocketChat.models.Subscriptions.updateAutoTranslateLanguageById(subscription._id, options.defaultLanguage);
        }

        break;

      case 'autoTranslateLanguage':
        RocketChat.models.Subscriptions.updateAutoTranslateLanguageById(subscription._id, value);
        break;
    }

    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"translateMessage.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/methods/translateMessage.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  'autoTranslate.translateMessage'(message, targetLanguage) {
    const room = RocketChat.models.Rooms.findOneById(message && message.rid);

    if (message && room && RocketChat.AutoTranslate) {
      return RocketChat.AutoTranslate.translateMessage(message, room, targetLanguage);
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getSupportedLanguages.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_autotranslate/server/methods/getSupportedLanguages.js                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  'autoTranslate.getSupportedLanguages'(targetLanguage) {
    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'auto-translate')) {
      throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', {
        method: 'autoTranslate.saveSettings'
      });
    }

    return RocketChat.AutoTranslate.getSupportedLanguages(targetLanguage);
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'autoTranslate.getSupportedLanguages',

  userId()
  /*userId*/
  {
    return true;
  }

}, 5, 60000);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:autotranslate/server/settings.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/autotranslate.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/permissions.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/methods/saveSettings.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/methods/translateMessage.js");
require("/node_modules/meteor/rocketchat:autotranslate/server/methods/getSupportedLanguages.js");

/* Exports */
Package._define("rocketchat:autotranslate");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_autotranslate.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRvdHJhbnNsYXRlL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRvdHJhbnNsYXRlL3NlcnZlci9hdXRvdHJhbnNsYXRlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dG90cmFuc2xhdGUvc2VydmVyL3Blcm1pc3Npb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dG90cmFuc2xhdGUvc2VydmVyL21vZGVscy9NZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRvdHJhbnNsYXRlL3NlcnZlci9tb2RlbHMvU3Vic2NyaXB0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRvdHJhbnNsYXRlL3NlcnZlci9tZXRob2RzL3NhdmVTZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRvdHJhbnNsYXRlL3NlcnZlci9tZXRob2RzL3RyYW5zbGF0ZU1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0b3RyYW5zbGF0ZS9zZXJ2ZXIvbWV0aG9kcy9nZXRTdXBwb3J0ZWRMYW5ndWFnZXMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImFkZCIsInR5cGUiLCJncm91cCIsInNlY3Rpb24iLCJwdWJsaWMiLCJlbmFibGVRdWVyeSIsIl9pZCIsInZhbHVlIiwiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicyIsIkF1dG9UcmFuc2xhdGUiLCJjb25zdHJ1Y3RvciIsImxhbmd1YWdlcyIsImVuYWJsZWQiLCJnZXQiLCJhcGlLZXkiLCJzdXBwb3J0ZWRMYW5ndWFnZXMiLCJjYWxsYmFja3MiLCJ0cmFuc2xhdGVNZXNzYWdlIiwiYmluZCIsInByaW9yaXR5IiwiTUVESVVNIiwia2V5IiwidG9rZW5pemUiLCJtZXNzYWdlIiwidG9rZW5zIiwiQXJyYXkiLCJpc0FycmF5IiwidG9rZW5pemVFbW9qaXMiLCJ0b2tlbml6ZUNvZGUiLCJ0b2tlbml6ZVVSTHMiLCJ0b2tlbml6ZU1lbnRpb25zIiwiY291bnQiLCJsZW5ndGgiLCJtc2ciLCJyZXBsYWNlIiwibWF0Y2giLCJ0b2tlbiIsInB1c2giLCJ0ZXh0Iiwic2NoZW1lcyIsInNwbGl0Iiwiam9pbiIsIlJlZ0V4cCIsInByZSIsInBvc3QiLCJwcmV0b2tlbiIsInBvc3R0b2tlbiIsImh0bWwiLCJNYXJrZG93biIsInBhcnNlTWVzc2FnZU5vdEVzY2FwZWQiLCJ0b2tlbkluZGV4IiwiaGFzT3duUHJvcGVydHkiLCJpbmRleE9mIiwibmV3VG9rZW4iLCJtZW50aW9ucyIsImZvckVhY2giLCJtZW50aW9uIiwidXNlcm5hbWUiLCJjaGFubmVscyIsImNoYW5uZWwiLCJuYW1lIiwiZGVUb2tlbml6ZSIsIm5vSHRtbCIsInJvb20iLCJ0YXJnZXRMYW5ndWFnZSIsInRhcmdldExhbmd1YWdlcyIsIm1vZGVscyIsIlN1YnNjcmlwdGlvbnMiLCJnZXRBdXRvVHJhbnNsYXRlTGFuZ3VhZ2VzQnlSb29tQW5kTm90VXNlciIsInUiLCJkZWZlciIsInRyYW5zbGF0aW9ucyIsInRhcmdldE1lc3NhZ2UiLCJPYmplY3QiLCJhc3NpZ24iLCJlc2NhcGVIVE1MIiwiU3RyaW5nIiwibXNncyIsIm1hcCIsImVuY29kZVVSSUNvbXBvbmVudCIsInF1ZXJ5IiwiZ2V0U3VwcG9ydGVkTGFuZ3VhZ2VzIiwibGFuZ3VhZ2UiLCJmaW5kV2hlcmUiLCJzdWJzdHIiLCJyZXN1bHQiLCJIVFRQIiwicGFyYW1zIiwidGFyZ2V0IiwiZSIsImNvbnNvbGUiLCJsb2ciLCJzdGF0dXNDb2RlIiwiZGF0YSIsInR4dCIsInRyYW5zbGF0aW9uIiwidHJhbnNsYXRlZFRleHQiLCJpc0VtcHR5IiwiTWVzc2FnZXMiLCJhZGRUcmFuc2xhdGlvbnMiLCJhdHRhY2htZW50cyIsImluZGV4IiwiYXR0YWNobWVudCIsImRlc2NyaXB0aW9uIiwiYWRkQXR0YWNobWVudFRyYW5zbGF0aW9ucyIsInJlc3BvbnNlIiwiZXJyb3IiLCJzdGF0dXMiLCJQZXJtaXNzaW9ucyIsImZpbmRPbmUiLCJpbnNlcnQiLCJyb2xlcyIsIm1lc3NhZ2VJZCIsInVwZGF0ZU9iaiIsImtleXMiLCJ1cGRhdGUiLCIkc2V0IiwiYXR0YWNobWVudEluZGV4IiwidXBkYXRlQXV0b1RyYW5zbGF0ZUJ5SWQiLCJhdXRvVHJhbnNsYXRlIiwiJHVuc2V0IiwidXBkYXRlQXV0b1RyYW5zbGF0ZUxhbmd1YWdlQnlJZCIsImF1dG9UcmFuc2xhdGVMYW5ndWFnZSIsInJpZCIsInVzZXJJZCIsInN1YnNjcmlwdGlvbnNSYXciLCJtb2RlbCIsInJhd0NvbGxlY3Rpb24iLCJkaXN0aW5jdCIsIndyYXBBc3luYyIsIiRuZSIsIm1ldGhvZHMiLCJmaWVsZCIsIm9wdGlvbnMiLCJFcnJvciIsIm1ldGhvZCIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsImNoZWNrIiwic3Vic2NyaXB0aW9uIiwiZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkIiwiZGVmYXVsdExhbmd1YWdlIiwiUm9vbXMiLCJmaW5kT25lQnlJZCIsIkREUFJhdGVMaW1pdGVyIiwiYWRkUnVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekJDLGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QixFQUFpRCxLQUFqRCxFQUF3RDtBQUFFQyxVQUFNLFNBQVI7QUFBbUJDLFdBQU8sU0FBMUI7QUFBcUNDLGFBQVMsZUFBOUM7QUFBK0RDLFlBQVE7QUFBdkUsR0FBeEQ7QUFDQU4sYUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIs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b3RyYW5zbGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnQXV0b1RyYW5zbGF0ZV9FbmFibGVkJywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBncm91cDogJ01lc3NhZ2UnLCBzZWN0aW9uOiAnQXV0b1RyYW5zbGF0ZScsIHB1YmxpYzogdHJ1ZSB9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0F1dG9UcmFuc2xhdGVfR29vZ2xlQVBJS2V5JywgJycsIHsgdHlwZTogJ3N0cmluZycsIGdyb3VwOiAnTWVzc2FnZScsIHNlY3Rpb246ICdBdXRvVHJhbnNsYXRlJywgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQXV0b1RyYW5zbGF0ZV9FbmFibGVkJywgdmFsdWU6IHRydWUgfSB9KTtcbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbmNsYXNzIEF1dG9UcmFuc2xhdGUge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmxhbmd1YWdlcyA9IFtdO1xuXHRcdHRoaXMuZW5hYmxlZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBdXRvVHJhbnNsYXRlX0VuYWJsZWQnKTtcblx0XHR0aGlzLmFwaUtleSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBdXRvVHJhbnNsYXRlX0dvb2dsZUFQSUtleScpO1xuXHRcdHRoaXMuc3VwcG9ydGVkTGFuZ3VhZ2VzID0ge307XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgdGhpcy50cmFuc2xhdGVNZXNzYWdlLmJpbmQodGhpcyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ0F1dG9UcmFuc2xhdGUnKTtcblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBdXRvVHJhbnNsYXRlX0VuYWJsZWQnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0dGhpcy5lbmFibGVkID0gdmFsdWU7XG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0F1dG9UcmFuc2xhdGVfR29vZ2xlQVBJS2V5JywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHRoaXMuYXBpS2V5ID0gdmFsdWU7XG5cdFx0fSk7XG5cdH1cblxuXHR0b2tlbml6ZShtZXNzYWdlKSB7XG5cdFx0aWYgKCFtZXNzYWdlLnRva2VucyB8fCAhQXJyYXkuaXNBcnJheShtZXNzYWdlLnRva2VucykpIHtcblx0XHRcdG1lc3NhZ2UudG9rZW5zID0gW107XG5cdFx0fVxuXHRcdG1lc3NhZ2UgPSB0aGlzLnRva2VuaXplRW1vamlzKG1lc3NhZ2UpO1xuXHRcdG1lc3NhZ2UgPSB0aGlzLnRva2VuaXplQ29kZShtZXNzYWdlKTtcblx0XHRtZXNzYWdlID0gdGhpcy50b2tlbml6ZVVSTHMobWVzc2FnZSk7XG5cdFx0bWVzc2FnZSA9IHRoaXMudG9rZW5pemVNZW50aW9ucyhtZXNzYWdlKTtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdHRva2VuaXplRW1vamlzKG1lc3NhZ2UpIHtcblx0XHRsZXQgY291bnQgPSBtZXNzYWdlLnRva2Vucy5sZW5ndGg7XG5cdFx0bWVzc2FnZS5tc2cgPSBtZXNzYWdlLm1zZy5yZXBsYWNlKC86WytcXHdcXGRdKzovZywgZnVuY3Rpb24obWF0Y2gpIHtcblx0XHRcdGNvbnN0IHRva2VuID0gYDxpIGNsYXNzPW5vdHJhbnNsYXRlPnskeyBjb3VudCsrIH19PC9pPmA7XG5cdFx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdFx0dG9rZW4sXG5cdFx0XHRcdHRleHQ6IG1hdGNoXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiB0b2tlbjtcblx0XHR9KTtcblxuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0dG9rZW5pemVVUkxzKG1lc3NhZ2UpIHtcblx0XHRsZXQgY291bnQgPSBtZXNzYWdlLnRva2Vucy5sZW5ndGg7XG5cblx0XHRjb25zdCBzY2hlbWVzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX1N1cHBvcnRTY2hlbWVzRm9yTGluaycpLnNwbGl0KCcsJykuam9pbignfCcpO1xuXG5cdFx0Ly8gU3VwcG9ydCAhW2FsdCB0ZXh0XShodHRwOi8vaW1hZ2UgdXJsKSBhbmQgW3RleHRdKGh0dHA6Ly9saW5rKVxuXHRcdG1lc3NhZ2UubXNnID0gbWVzc2FnZS5tc2cucmVwbGFjZShuZXcgUmVnRXhwKGAoIT9cXFxcWykoW15cXFxcXV0rKShcXFxcXVxcXFwoKD86JHsgc2NoZW1lcyB9KTpcXFxcL1xcXFwvW15cXFxcKV0rXFxcXCkpYCwgJ2dtJyksIGZ1bmN0aW9uKG1hdGNoLCBwcmUsIHRleHQsIHBvc3QpIHtcblx0XHRcdGNvbnN0IHByZXRva2VuID0gYDxpIGNsYXNzPW5vdHJhbnNsYXRlPnskeyBjb3VudCsrIH19PC9pPmA7XG5cdFx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdFx0dG9rZW46IHByZXRva2VuLFxuXHRcdFx0XHR0ZXh0OiBwcmVcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCBwb3N0dG9rZW4gPSBgPGkgY2xhc3M9bm90cmFuc2xhdGU+eyR7IGNvdW50KysgfX08L2k+YDtcblx0XHRcdG1lc3NhZ2UudG9rZW5zLnB1c2goe1xuXHRcdFx0XHR0b2tlbjogcG9zdHRva2VuLFxuXHRcdFx0XHR0ZXh0OiBwb3N0XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHByZXRva2VuICsgdGV4dCArIHBvc3R0b2tlbjtcblx0XHR9KTtcblxuXHRcdC8vIFN1cHBvcnQgPGh0dHA6Ly9saW5rfFRleHQ+XG5cdFx0bWVzc2FnZS5tc2cgPSBtZXNzYWdlLm1zZy5yZXBsYWNlKG5ldyBSZWdFeHAoYCgoPzo8fCZsdDspKD86JHsgc2NoZW1lcyB9KTpcXFxcL1xcXFwvW15cXFxcfF0rXFxcXHwpKC4rPykoPz0+fCZndDspKCg/Oj58Jmd0OykpYCwgJ2dtJyksIGZ1bmN0aW9uKG1hdGNoLCBwcmUsIHRleHQsIHBvc3QpIHtcblx0XHRcdGNvbnN0IHByZXRva2VuID0gYDxpIGNsYXNzPW5vdHJhbnNsYXRlPnskeyBjb3VudCsrIH19PC9pPmA7XG5cdFx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdFx0dG9rZW46IHByZXRva2VuLFxuXHRcdFx0XHR0ZXh0OiBwcmVcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCBwb3N0dG9rZW4gPSBgPGkgY2xhc3M9bm90cmFuc2xhdGU+eyR7IGNvdW50KysgfX08L2k+YDtcblx0XHRcdG1lc3NhZ2UudG9rZW5zLnB1c2goe1xuXHRcdFx0XHR0b2tlbjogcG9zdHRva2VuLFxuXHRcdFx0XHR0ZXh0OiBwb3N0XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHByZXRva2VuICsgdGV4dCArIHBvc3R0b2tlbjtcblx0XHR9KTtcblxuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0dG9rZW5pemVDb2RlKG1lc3NhZ2UpIHtcblx0XHRsZXQgY291bnQgPSBtZXNzYWdlLnRva2Vucy5sZW5ndGg7XG5cblx0XHRtZXNzYWdlLmh0bWwgPSBtZXNzYWdlLm1zZztcblx0XHRtZXNzYWdlID0gUm9ja2V0Q2hhdC5NYXJrZG93bi5wYXJzZU1lc3NhZ2VOb3RFc2NhcGVkKG1lc3NhZ2UpO1xuXHRcdG1lc3NhZ2UubXNnID0gbWVzc2FnZS5odG1sO1xuXG5cdFx0Zm9yIChjb25zdCB0b2tlbkluZGV4IGluIG1lc3NhZ2UudG9rZW5zKSB7XG5cdFx0XHRpZiAobWVzc2FnZS50b2tlbnMuaGFzT3duUHJvcGVydHkodG9rZW5JbmRleCkpIHtcblx0XHRcdFx0Y29uc3QgdG9rZW4gPSBtZXNzYWdlLnRva2Vuc1t0b2tlbkluZGV4XS50b2tlbjtcblx0XHRcdFx0aWYgKHRva2VuLmluZGV4T2YoJ25vdHJhbnNsYXRlJykgPT09IC0xKSB7XG5cdFx0XHRcdFx0Y29uc3QgbmV3VG9rZW4gPSBgPGkgY2xhc3M9bm90cmFuc2xhdGU+eyR7IGNvdW50KysgfX08L2k+YDtcblx0XHRcdFx0XHRtZXNzYWdlLm1zZyA9IG1lc3NhZ2UubXNnLnJlcGxhY2UodG9rZW4sIG5ld1Rva2VuKTtcblx0XHRcdFx0XHRtZXNzYWdlLnRva2Vuc1t0b2tlbkluZGV4XS50b2tlbiA9IG5ld1Rva2VuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHR0b2tlbml6ZU1lbnRpb25zKG1lc3NhZ2UpIHtcblx0XHRsZXQgY291bnQgPSBtZXNzYWdlLnRva2Vucy5sZW5ndGg7XG5cblx0XHRpZiAobWVzc2FnZS5tZW50aW9ucyAmJiBtZXNzYWdlLm1lbnRpb25zLmxlbmd0aCA+IDApIHtcblx0XHRcdG1lc3NhZ2UubWVudGlvbnMuZm9yRWFjaChtZW50aW9uID0+IHtcblx0XHRcdFx0bWVzc2FnZS5tc2cgPSBtZXNzYWdlLm1zZy5yZXBsYWNlKG5ldyBSZWdFeHAoYChAJHsgbWVudGlvbi51c2VybmFtZSB9KWAsICdnbScpLCBtYXRjaCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgdG9rZW4gPSBgPGkgY2xhc3M9bm90cmFuc2xhdGU+eyR7IGNvdW50KysgfX08L2k+YDtcblx0XHRcdFx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdFx0XHRcdHRva2VuLFxuXHRcdFx0XHRcdFx0dGV4dDogbWF0Y2hcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gdG9rZW47XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKG1lc3NhZ2UuY2hhbm5lbHMgJiYgbWVzc2FnZS5jaGFubmVscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRtZXNzYWdlLmNoYW5uZWxzLmZvckVhY2goY2hhbm5lbCA9PiB7XG5cdFx0XHRcdG1lc3NhZ2UubXNnID0gbWVzc2FnZS5tc2cucmVwbGFjZShuZXcgUmVnRXhwKGAoIyR7IGNoYW5uZWwubmFtZSB9KWAsICdnbScpLCBtYXRjaCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgdG9rZW4gPSBgPGkgY2xhc3M9bm90cmFuc2xhdGU+eyR7IGNvdW50KysgfX08L2k+YDtcblx0XHRcdFx0XHRtZXNzYWdlLnRva2Vucy5wdXNoKHtcblx0XHRcdFx0XHRcdHRva2VuLFxuXHRcdFx0XHRcdFx0dGV4dDogbWF0Y2hcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gdG9rZW47XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRkZVRva2VuaXplKG1lc3NhZ2UpIHtcblx0XHRpZiAobWVzc2FnZS50b2tlbnMgJiYgbWVzc2FnZS50b2tlbnMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCB7dG9rZW4sIHRleHQsIG5vSHRtbH0gb2YgbWVzc2FnZS50b2tlbnMpIHtcblx0XHRcdFx0bWVzc2FnZS5tc2cgPSBtZXNzYWdlLm1zZy5yZXBsYWNlKHRva2VuLCAoKSA9PiBub0h0bWwgPyBub0h0bWwgOiB0ZXh0KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG1lc3NhZ2UubXNnO1xuXHR9XG5cblx0dHJhbnNsYXRlTWVzc2FnZShtZXNzYWdlLCByb29tLCB0YXJnZXRMYW5ndWFnZSkge1xuXHRcdGlmICh0aGlzLmVuYWJsZWQgJiYgdGhpcy5hcGlLZXkpIHtcblx0XHRcdGxldCB0YXJnZXRMYW5ndWFnZXM7XG5cdFx0XHRpZiAodGFyZ2V0TGFuZ3VhZ2UpIHtcblx0XHRcdFx0dGFyZ2V0TGFuZ3VhZ2VzID0gWyB0YXJnZXRMYW5ndWFnZSBdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGFyZ2V0TGFuZ3VhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5nZXRBdXRvVHJhbnNsYXRlTGFuZ3VhZ2VzQnlSb29tQW5kTm90VXNlcihyb29tLl9pZCwgbWVzc2FnZS51ICYmIG1lc3NhZ2UudS5faWQpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKG1lc3NhZ2UubXNnKSB7XG5cdFx0XHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgdHJhbnNsYXRpb25zID0ge307XG5cdFx0XHRcdFx0bGV0IHRhcmdldE1lc3NhZ2UgPSBPYmplY3QuYXNzaWduKHt9LCBtZXNzYWdlKTtcblxuXHRcdFx0XHRcdHRhcmdldE1lc3NhZ2UuaHRtbCA9IHMuZXNjYXBlSFRNTChTdHJpbmcodGFyZ2V0TWVzc2FnZS5tc2cpKTtcblx0XHRcdFx0XHR0YXJnZXRNZXNzYWdlID0gdGhpcy50b2tlbml6ZSh0YXJnZXRNZXNzYWdlKTtcblxuXHRcdFx0XHRcdGxldCBtc2dzID0gdGFyZ2V0TWVzc2FnZS5tc2cuc3BsaXQoJ1xcbicpO1xuXHRcdFx0XHRcdG1zZ3MgPSBtc2dzLm1hcChtc2cgPT4gZW5jb2RlVVJJQ29tcG9uZW50KG1zZykpO1xuXHRcdFx0XHRcdGNvbnN0IHF1ZXJ5ID0gYHE9JHsgbXNncy5qb2luKCcmcT0nKSB9YDtcblxuXHRcdFx0XHRcdGNvbnN0IHN1cHBvcnRlZExhbmd1YWdlcyA9IHRoaXMuZ2V0U3VwcG9ydGVkTGFuZ3VhZ2VzKCdlbicpO1xuXHRcdFx0XHRcdHRhcmdldExhbmd1YWdlcy5mb3JFYWNoKGxhbmd1YWdlID0+IHtcblx0XHRcdFx0XHRcdGlmIChsYW5ndWFnZS5pbmRleE9mKCctJykgIT09IC0xICYmICFfLmZpbmRXaGVyZShzdXBwb3J0ZWRMYW5ndWFnZXMsIHsgbGFuZ3VhZ2UgfSkpIHtcblx0XHRcdFx0XHRcdFx0bGFuZ3VhZ2UgPSBsYW5ndWFnZS5zdWJzdHIoMCwgMik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRsZXQgcmVzdWx0O1xuXHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0cmVzdWx0ID0gSFRUUC5nZXQoJ2h0dHBzOi8vdHJhbnNsYXRpb24uZ29vZ2xlYXBpcy5jb20vbGFuZ3VhZ2UvdHJhbnNsYXRlL3YyJywgeyBwYXJhbXM6IHsga2V5OiB0aGlzLmFwaUtleSwgdGFyZ2V0OiBsYW5ndWFnZSB9LCBxdWVyeSB9KTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ0Vycm9yIHRyYW5zbGF0aW5nIG1lc3NhZ2UnLCBlKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAocmVzdWx0LnN0YXR1c0NvZGUgPT09IDIwMCAmJiByZXN1bHQuZGF0YSAmJiByZXN1bHQuZGF0YS5kYXRhICYmIHJlc3VsdC5kYXRhLmRhdGEudHJhbnNsYXRpb25zICYmIEFycmF5LmlzQXJyYXkocmVzdWx0LmRhdGEuZGF0YS50cmFuc2xhdGlvbnMpICYmIHJlc3VsdC5kYXRhLmRhdGEudHJhbnNsYXRpb25zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgdHh0ID0gcmVzdWx0LmRhdGEuZGF0YS50cmFuc2xhdGlvbnMubWFwKHRyYW5zbGF0aW9uID0+IHRyYW5zbGF0aW9uLnRyYW5zbGF0ZWRUZXh0KS5qb2luKCdcXG4nKTtcblx0XHRcdFx0XHRcdFx0dHJhbnNsYXRpb25zW2xhbmd1YWdlXSA9IHRoaXMuZGVUb2tlbml6ZShPYmplY3QuYXNzaWduKHt9LCB0YXJnZXRNZXNzYWdlLCB7IG1zZzogdHh0IH0pKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRpZiAoIV8uaXNFbXB0eSh0cmFuc2xhdGlvbnMpKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5hZGRUcmFuc2xhdGlvbnMobWVzc2FnZS5faWQsIHRyYW5zbGF0aW9ucyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG1lc3NhZ2UuYXR0YWNobWVudHMgJiYgbWVzc2FnZS5hdHRhY2htZW50cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBpbmRleCBpbiBtZXNzYWdlLmF0dGFjaG1lbnRzKSB7XG5cdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5hdHRhY2htZW50cy5oYXNPd25Qcm9wZXJ0eShpbmRleCkpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudCA9IG1lc3NhZ2UuYXR0YWNobWVudHNbaW5kZXhdO1xuXHRcdFx0XHRcdFx0XHRjb25zdCB0cmFuc2xhdGlvbnMgPSB7fTtcblx0XHRcdFx0XHRcdFx0aWYgKGF0dGFjaG1lbnQuZGVzY3JpcHRpb24gfHwgYXR0YWNobWVudC50ZXh0KSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgcXVlcnkgPSBgcT0keyBlbmNvZGVVUklDb21wb25lbnQoYXR0YWNobWVudC5kZXNjcmlwdGlvbiB8fCBhdHRhY2htZW50LnRleHQpIH1gO1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IHN1cHBvcnRlZExhbmd1YWdlcyA9IHRoaXMuZ2V0U3VwcG9ydGVkTGFuZ3VhZ2VzKCdlbicpO1xuXHRcdFx0XHRcdFx0XHRcdHRhcmdldExhbmd1YWdlcy5mb3JFYWNoKGxhbmd1YWdlID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChsYW5ndWFnZS5pbmRleE9mKCctJykgIT09IC0xICYmICFfLmZpbmRXaGVyZShzdXBwb3J0ZWRMYW5ndWFnZXMsIHsgbGFuZ3VhZ2UgfSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGFuZ3VhZ2UgPSBsYW5ndWFnZS5zdWJzdHIoMCwgMik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmdldCgnaHR0cHM6Ly90cmFuc2xhdGlvbi5nb29nbGVhcGlzLmNvbS9sYW5ndWFnZS90cmFuc2xhdGUvdjInLCB7IHBhcmFtczogeyBrZXk6IHRoaXMuYXBpS2V5LCB0YXJnZXQ6IGxhbmd1YWdlIH0sIHF1ZXJ5IH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcmVzdWx0LmRhdGEgJiYgcmVzdWx0LmRhdGEuZGF0YSAmJiByZXN1bHQuZGF0YS5kYXRhLnRyYW5zbGF0aW9ucyAmJiBBcnJheS5pc0FycmF5KHJlc3VsdC5kYXRhLmRhdGEudHJhbnNsYXRpb25zKSAmJiByZXN1bHQuZGF0YS5kYXRhLnRyYW5zbGF0aW9ucy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHR4dCA9IHJlc3VsdC5kYXRhLmRhdGEudHJhbnNsYXRpb25zLm1hcCh0cmFuc2xhdGlvbiA9PiB0cmFuc2xhdGlvbi50cmFuc2xhdGVkVGV4dCkuam9pbignXFxuJyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRyYW5zbGF0aW9uc1tsYW5ndWFnZV0gPSB0eHQ7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFfLmlzRW1wdHkodHJhbnNsYXRpb25zKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuYWRkQXR0YWNobWVudFRyYW5zbGF0aW9ucyhtZXNzYWdlLl9pZCwgaW5kZXgsIHRyYW5zbGF0aW9ucyk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRnZXRTdXBwb3J0ZWRMYW5ndWFnZXModGFyZ2V0KSB7XG5cdFx0aWYgKHRoaXMuZW5hYmxlZCAmJiB0aGlzLmFwaUtleSkge1xuXHRcdFx0aWYgKHRoaXMuc3VwcG9ydGVkTGFuZ3VhZ2VzW3RhcmdldF0pIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuc3VwcG9ydGVkTGFuZ3VhZ2VzW3RhcmdldF07XG5cdFx0XHR9XG5cblx0XHRcdGxldCByZXN1bHQ7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7IGtleTogdGhpcy5hcGlLZXkgfTtcblx0XHRcdGlmICh0YXJnZXQpIHtcblx0XHRcdFx0cGFyYW1zLnRhcmdldCA9IHRhcmdldDtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmVzdWx0ID0gSFRUUC5nZXQoJ2h0dHBzOi8vdHJhbnNsYXRpb24uZ29vZ2xlYXBpcy5jb20vbGFuZ3VhZ2UvdHJhbnNsYXRlL3YyL2xhbmd1YWdlcycsIHsgcGFyYW1zIH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoZS5yZXNwb25zZSAmJiBlLnJlc3BvbnNlLnN0YXR1c0NvZGUgPT09IDQwMCAmJiBlLnJlc3BvbnNlLmRhdGEgJiYgZS5yZXNwb25zZS5kYXRhLmVycm9yICYmIGUucmVzcG9uc2UuZGF0YS5lcnJvci5zdGF0dXMgPT09ICdJTlZBTElEX0FSR1VNRU5UJykge1xuXHRcdFx0XHRcdHBhcmFtcy50YXJnZXQgPSAnZW4nO1xuXHRcdFx0XHRcdHRhcmdldCA9ICdlbic7XG5cdFx0XHRcdFx0aWYgKCF0aGlzLnN1cHBvcnRlZExhbmd1YWdlc1t0YXJnZXRdKSB7XG5cdFx0XHRcdFx0XHRyZXN1bHQgPSBIVFRQLmdldCgnaHR0cHM6Ly90cmFuc2xhdGlvbi5nb29nbGVhcGlzLmNvbS9sYW5ndWFnZS90cmFuc2xhdGUvdjIvbGFuZ3VhZ2VzJywgeyBwYXJhbXMgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRpZiAodGhpcy5zdXBwb3J0ZWRMYW5ndWFnZXNbdGFyZ2V0XSkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnN1cHBvcnRlZExhbmd1YWdlc1t0YXJnZXRdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc3VwcG9ydGVkTGFuZ3VhZ2VzW3RhcmdldCB8fCAnZW4nXSA9IHJlc3VsdCAmJiByZXN1bHQuZGF0YSAmJiByZXN1bHQuZGF0YS5kYXRhICYmIHJlc3VsdC5kYXRhLmRhdGEubGFuZ3VhZ2VzO1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLnN1cHBvcnRlZExhbmd1YWdlc1t0YXJnZXQgfHwgJ2VuJ107XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5BdXRvVHJhbnNsYXRlID0gbmV3IEF1dG9UcmFuc2xhdGU7XG4iLCJNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdGlmIChSb2NrZXRDaGF0Lm1vZGVscyAmJiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucykge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZSh7IF9pZDogJ2F1dG8tdHJhbnNsYXRlJyB9KSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuaW5zZXJ0KHsgX2lkOiAnYXV0by10cmFuc2xhdGUnLCByb2xlczogWydhZG1pbiddIH0pO1xuXHRcdH1cblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5hZGRUcmFuc2xhdGlvbnMgPSBmdW5jdGlvbihtZXNzYWdlSWQsIHRyYW5zbGF0aW9ucykge1xuXHRjb25zdCB1cGRhdGVPYmogPSB7fTtcblx0T2JqZWN0LmtleXModHJhbnNsYXRpb25zKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRjb25zdCB0cmFuc2xhdGlvbiA9IHRyYW5zbGF0aW9uc1trZXldO1xuXHRcdHVwZGF0ZU9ialtgdHJhbnNsYXRpb25zLiR7IGtleSB9YF0gPSB0cmFuc2xhdGlvbjtcblx0fSk7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZDogbWVzc2FnZUlkIH0sIHsgJHNldDogdXBkYXRlT2JqIH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuYWRkQXR0YWNobWVudFRyYW5zbGF0aW9ucyA9IGZ1bmN0aW9uKG1lc3NhZ2VJZCwgYXR0YWNobWVudEluZGV4LCB0cmFuc2xhdGlvbnMpIHtcblx0Y29uc3QgdXBkYXRlT2JqID0ge307XG5cdE9iamVjdC5rZXlzKHRyYW5zbGF0aW9ucykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0Y29uc3QgdHJhbnNsYXRpb24gPSB0cmFuc2xhdGlvbnNba2V5XTtcblx0XHR1cGRhdGVPYmpbYGF0dGFjaG1lbnRzLiR7IGF0dGFjaG1lbnRJbmRleCB9LnRyYW5zbGF0aW9ucy4keyBrZXkgfWBdID0gdHJhbnNsYXRpb247XG5cdH0pO1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQ6IG1lc3NhZ2VJZCB9LCB7ICRzZXQ6IHVwZGF0ZU9iaiB9KTtcbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1dG9UcmFuc2xhdGVCeUlkID0gZnVuY3Rpb24oX2lkLCBhdXRvVHJhbnNsYXRlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXG5cdGxldCB1cGRhdGU7XG5cdGlmIChhdXRvVHJhbnNsYXRlKSB7XG5cdFx0dXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRhdXRvVHJhbnNsYXRlXG5cdFx0XHR9XG5cdFx0fTtcblx0fSBlbHNlIHtcblx0XHR1cGRhdGUgPSB7XG5cdFx0XHQkdW5zZXQ6IHtcblx0XHRcdFx0YXV0b1RyYW5zbGF0ZTogMVxuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1dG9UcmFuc2xhdGVMYW5ndWFnZUJ5SWQgPSBmdW5jdGlvbihfaWQsIGF1dG9UcmFuc2xhdGVMYW5ndWFnZSkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0YXV0b1RyYW5zbGF0ZUxhbmd1YWdlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZ2V0QXV0b1RyYW5zbGF0ZUxhbmd1YWdlc0J5Um9vbUFuZE5vdFVzZXIgPSBmdW5jdGlvbihyaWQsIHVzZXJJZCkge1xuXHRjb25zdCBzdWJzY3JpcHRpb25zUmF3ID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdGNvbnN0IGRpc3RpbmN0ID0gTWV0ZW9yLndyYXBBc3luYyhzdWJzY3JpcHRpb25zUmF3LmRpc3RpbmN0LCBzdWJzY3JpcHRpb25zUmF3KTtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cmlkLFxuXHRcdCd1Ll9pZCc6IHsgJG5lOiB1c2VySWQgfSxcblx0XHRhdXRvVHJhbnNsYXRlOiB0cnVlXG5cdH07XG5cdHJldHVybiBkaXN0aW5jdCgnYXV0b1RyYW5zbGF0ZUxhbmd1YWdlJywgcXVlcnkpO1xufTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2F1dG9UcmFuc2xhdGUuc2F2ZVNldHRpbmdzJyhyaWQsIGZpZWxkLCB2YWx1ZSwgb3B0aW9ucykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzYXZlQXV0b1RyYW5zbGF0ZVNldHRpbmdzJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhdXRvLXRyYW5zbGF0ZScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQXV0by1UcmFuc2xhdGUgaXMgbm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2F1dG9UcmFuc2xhdGUuc2F2ZVNldHRpbmdzJ30pO1xuXHRcdH1cblxuXHRcdGNoZWNrKHJpZCwgU3RyaW5nKTtcblx0XHRjaGVjayhmaWVsZCwgU3RyaW5nKTtcblx0XHRjaGVjayh2YWx1ZSwgU3RyaW5nKTtcblxuXHRcdGlmIChbJ2F1dG9UcmFuc2xhdGUnLCAnYXV0b1RyYW5zbGF0ZUxhbmd1YWdlJ10uaW5kZXhPZihmaWVsZCkgPT09IC0xKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXNldHRpbmdzJywgJ0ludmFsaWQgc2V0dGluZ3MgZmllbGQnLCB7IG1ldGhvZDogJ3NhdmVBdXRvVHJhbnNsYXRlU2V0dGluZ3MnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJpZCwgTWV0ZW9yLnVzZXJJZCgpKTtcblx0XHRpZiAoIXN1YnNjcmlwdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1zdWJzY3JpcHRpb24nLCAnSW52YWxpZCBzdWJzY3JpcHRpb24nLCB7IG1ldGhvZDogJ3NhdmVBdXRvVHJhbnNsYXRlU2V0dGluZ3MnIH0pO1xuXHRcdH1cblxuXHRcdHN3aXRjaCAoZmllbGQpIHtcblx0XHRcdGNhc2UgJ2F1dG9UcmFuc2xhdGUnOlxuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1dG9UcmFuc2xhdGVCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlID09PSAnMScgPyB0cnVlIDogZmFsc2UpO1xuXHRcdFx0XHRpZiAoIXN1YnNjcmlwdGlvbi5hdXRvVHJhbnNsYXRlTGFuZ3VhZ2UgJiYgb3B0aW9ucy5kZWZhdWx0TGFuZ3VhZ2UpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZUF1dG9UcmFuc2xhdGVMYW5ndWFnZUJ5SWQoc3Vic2NyaXB0aW9uLl9pZCwgb3B0aW9ucy5kZWZhdWx0TGFuZ3VhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnYXV0b1RyYW5zbGF0ZUxhbmd1YWdlJzpcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVBdXRvVHJhbnNsYXRlTGFuZ3VhZ2VCeUlkKHN1YnNjcmlwdGlvbi5faWQsIHZhbHVlKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0b1RyYW5zbGF0ZS50cmFuc2xhdGVNZXNzYWdlJyhtZXNzYWdlLCB0YXJnZXRMYW5ndWFnZSkge1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlICYmIG1lc3NhZ2UucmlkKTtcblx0XHRpZiAobWVzc2FnZSAmJiByb29tICYmIFJvY2tldENoYXQuQXV0b1RyYW5zbGF0ZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQXV0b1RyYW5zbGF0ZS50cmFuc2xhdGVNZXNzYWdlKG1lc3NhZ2UsIHJvb20sIHRhcmdldExhbmd1YWdlKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0b1RyYW5zbGF0ZS5nZXRTdXBwb3J0ZWRMYW5ndWFnZXMnKHRhcmdldExhbmd1YWdlKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYXV0by10cmFuc2xhdGUnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0F1dG8tVHJhbnNsYXRlIGlzIG5vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdhdXRvVHJhbnNsYXRlLnNhdmVTZXR0aW5ncyd9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BdXRvVHJhbnNsYXRlLmdldFN1cHBvcnRlZExhbmd1YWdlcyh0YXJnZXRMYW5ndWFnZSk7XG5cdH1cbn0pO1xuXG5ERFBSYXRlTGltaXRlci5hZGRSdWxlKHtcblx0dHlwZTogJ21ldGhvZCcsXG5cdG5hbWU6ICdhdXRvVHJhbnNsYXRlLmdldFN1cHBvcnRlZExhbmd1YWdlcycsXG5cdHVzZXJJZCgvKnVzZXJJZCovKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0sIDUsIDYwMDAwKTtcbiJdfQ==
