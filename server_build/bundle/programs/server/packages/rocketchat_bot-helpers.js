(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Accounts = Package['accounts-base'].Accounts;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var fieldsSetting;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:bot-helpers":{"server":{"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/rocketchat_bot-helpers/server/index.js                                                    //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * BotHelpers helps bots
 * "private" properties use meteor collection cursors, so they stay reactive
 * "public" properties use getters to fetch and filter collections as array
 */
class BotHelpers {
  constructor() {
    this.queries = {
      online: {
        'status': {
          $ne: 'offline'
        }
      },
      users: {
        'roles': {
          $not: {
            $all: ['bot']
          }
        }
      }
    };
  } // setup collection cursors with array of fields from setting


  setupCursors(fieldsSetting) {
    this.userFields = {};

    if (typeof fieldsSetting === 'string') {
      fieldsSetting = fieldsSetting.split(',');
    }

    fieldsSetting.forEach(n => {
      this.userFields[n.trim()] = 1;
    });
    this._allUsers = RocketChat.models.Users.find(this.queries.users, {
      fields: this.userFields
    });
    this._onlineUsers = RocketChat.models.Users.find({
      $and: [this.queries.users, this.queries.online]
    }, {
      fields: this.userFields
    });
  } // request methods or props as arguments to Meteor.call


  request(prop, ...params) {
    if (typeof this[prop] === 'undefined') {
      return null;
    } else if (typeof this[prop] === 'function') {
      return this[prop](...params);
    } else {
      return this[prop];
    }
  }

  addUserToRole(userName, roleName) {
    Meteor.call('authorization:addUserToRole', roleName, userName);
  }

  removeUserFromRole(userName, roleName) {
    Meteor.call('authorization:removeUserFromRole', roleName, userName);
  }

  addUserToRoom(userName, room) {
    const foundRoom = RocketChat.models.Rooms.findOneByIdOrName(room);

    if (!_.isObject(foundRoom)) {
      throw new Meteor.Error('invalid-channel');
    }

    const data = {};
    data.rid = foundRoom._id;
    data.username = userName;
    Meteor.call('addUserToRoom', data);
  }

  removeUserFromRoom(userName, room) {
    const foundRoom = RocketChat.models.Rooms.findOneByIdOrName(room);

    if (!_.isObject(foundRoom)) {
      throw new Meteor.Error('invalid-channel');
    }

    const data = {};
    data.rid = foundRoom._id;
    data.username = userName;
    Meteor.call('removeUserFromRoom', data);
  } // generic error whenever property access insufficient to fill request


  requestError() {
    throw new Meteor.Error('error-not-allowed', 'Bot request not allowed', {
      method: 'botRequest',
      action: 'bot_request'
    });
  } // "public" properties accessed by getters
  // allUsers / onlineUsers return whichever properties are enabled by settings


  get allUsers() {
    if (!Object.keys(this.userFields).length) {
      this.requestError();
      return false;
    } else {
      return this._allUsers.fetch();
    }
  }

  get onlineUsers() {
    if (!Object.keys(this.userFields).length) {
      this.requestError();
      return false;
    } else {
      return this._onlineUsers.fetch();
    }
  }

  get allUsernames() {
    if (!this.userFields.hasOwnProperty('username')) {
      this.requestError();
      return false;
    } else {
      return this._allUsers.fetch().map(user => user.username);
    }
  }

  get onlineUsernames() {
    if (!this.userFields.hasOwnProperty('username')) {
      this.requestError();
      return false;
    } else {
      return this._onlineUsers.fetch().map(user => user.username);
    }
  }

  get allNames() {
    if (!this.userFields.hasOwnProperty('name')) {
      this.requestError();
      return false;
    } else {
      return this._allUsers.fetch().map(user => user.name);
    }
  }

  get onlineNames() {
    if (!this.userFields.hasOwnProperty('name')) {
      this.requestError();
      return false;
    } else {
      return this._onlineUsers.fetch().map(user => user.name);
    }
  }

  get allIDs() {
    if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
      this.requestError();
      return false;
    } else {
      return this._allUsers.fetch().map(user => {
        return {
          'id': user._id,
          'name': user.username
        };
      });
    }
  }

  get onlineIDs() {
    if (!this.userFields.hasOwnProperty('_id') || !this.userFields.hasOwnProperty('username')) {
      this.requestError();
      return false;
    } else {
      return this._onlineUsers.fetch().map(user => {
        return {
          'id': user._id,
          'name': user.username
        };
      });
    }
  }

} // add class to meteor methods


const botHelpers = new BotHelpers(); // init cursors with fields setting and update on setting change

RocketChat.settings.get('BotHelpers_userFields', function (settingKey, settingValue) {
  botHelpers.setupCursors(settingValue);
});
Meteor.methods({
  botRequest: (...args) => {
    const userID = Meteor.userId();

    if (userID && RocketChat.authz.hasRole(userID, 'bot')) {
      return botHelpers.request(...args);
    } else {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'botRequest'
      });
    }
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/rocketchat_bot-helpers/server/settings.js                                                 //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
Meteor.startup(function () {
  RocketChat.settings.addGroup('Bots', function () {
    this.add('BotHelpers_userFields', '_id, name, username, emails, language, utcOffset', {
      type: 'string',
      section: 'Helpers',
      i18nLabel: 'BotHelpers_userFields',
      i18nDescription: 'BotHelpers_userFields_Description'
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:bot-helpers/server/index.js");
require("/node_modules/meteor/rocketchat:bot-helpers/server/settings.js");

/* Exports */
Package._define("rocketchat:bot-helpers");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_bot-helpers.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpib3QtaGVscGVycy9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Ym90LWhlbHBlcnMvc2VydmVyL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIkJvdEhlbHBlcnMiLCJjb25zdHJ1Y3RvciIsInF1ZXJpZXMiLCJvbmxpbmUiLCIkbmUiLCJ1c2VycyIsIiRub3QiLCIkYWxsIiwic2V0dXBDdXJzb3JzIiwiZmllbGRzU2V0dGluZyIsInVzZXJGaWVsZHMiLCJzcGxpdCIsImZvckVhY2giLCJuIiwidHJpbSIsIl9hbGxVc2VycyIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJVc2VycyIsImZpbmQiLCJmaWVsZHMiLCJfb25saW5lVXNlcnMiLCIkYW5kIiwicmVxdWVzdCIsInByb3AiLCJwYXJhbXMiLCJhZGRVc2VyVG9Sb2xlIiwidXNlck5hbWUiLCJyb2xlTmFtZSIsIk1ldGVvciIsImNhbGwiLCJyZW1vdmVVc2VyRnJvbVJvbGUiLCJhZGRVc2VyVG9Sb29tIiwicm9vbSIsImZvdW5kUm9vbSIsIlJvb21zIiwiZmluZE9uZUJ5SWRPck5hbWUiLCJpc09iamVjdCIsIkVycm9yIiwiZGF0YSIsInJpZCIsIl9pZCIsInVzZXJuYW1lIiwicmVtb3ZlVXNlckZyb21Sb29tIiwicmVxdWVzdEVycm9yIiwibWV0aG9kIiwiYWN0aW9uIiwiYWxsVXNlcnMiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiZmV0Y2giLCJvbmxpbmVVc2VycyIsImFsbFVzZXJuYW1lcyIsImhhc093blByb3BlcnR5IiwibWFwIiwidXNlciIsIm9ubGluZVVzZXJuYW1lcyIsImFsbE5hbWVzIiwibmFtZSIsIm9ubGluZU5hbWVzIiwiYWxsSURzIiwib25saW5lSURzIiwiYm90SGVscGVycyIsInNldHRpbmdzIiwiZ2V0Iiwic2V0dGluZ0tleSIsInNldHRpbmdWYWx1ZSIsIm1ldGhvZHMiLCJib3RSZXF1ZXN0IiwiYXJncyIsInVzZXJJRCIsInVzZXJJZCIsImF1dGh6IiwiaGFzUm9sZSIsInN0YXJ0dXAiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJzZWN0aW9uIiwiaTE4bkxhYmVsIiwiaTE4bkRlc2NyaXB0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7O0FBRU47Ozs7O0FBS0EsTUFBTUMsVUFBTixDQUFpQjtBQUNoQkMsZ0JBQWM7QUFDYixTQUFLQyxPQUFMLEdBQWU7QUFDZEMsY0FBUTtBQUFFLGtCQUFVO0FBQUVDLGVBQUs7QUFBUDtBQUFaLE9BRE07QUFFZEMsYUFBTztBQUFFLGlCQUFTO0FBQUVDLGdCQUFNO0FBQUVDLGtCQUFNLENBQUMsS0FBRDtBQUFSO0FBQVI7QUFBWDtBQUZPLEtBQWY7QUFJQSxHQU5lLENBUWhCOzs7QUFDQUMsZUFBYUMsYUFBYixFQUE0QjtBQUMzQixTQUFLQyxVQUFMLEdBQWtCLEVBQWxCOztBQUNBLFFBQUksT0FBT0QsYUFBUCxLQUF5QixRQUE3QixFQUF1QztBQUN0Q0Esc0JBQWdCQSxjQUFjRSxLQUFkLENBQW9CLEdBQXBCLENBQWhCO0FBQ0E7O0FBQ0RGLGtCQUFjRyxPQUFkLENBQXVCQyxDQUFELElBQU87QUFDNUIsV0FBS0gsVUFBTCxDQUFnQkcsRUFBRUMsSUFBRixFQUFoQixJQUE0QixDQUE1QjtBQUNBLEtBRkQ7QUFHQSxTQUFLQyxTQUFMLEdBQWlCQyxXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsSUFBeEIsQ0FBNkIsS0FBS2pCLE9BQUwsQ0FBYUcsS0FBMUMsRUFBaUQ7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QVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QixFQUFpRCxVQUFTQyxVQUFULEVBQXFCQyxZQUFyQixFQUFtQztBQUNuRkosYUFBV3ZELFlBQVgsQ0FBd0IyRCxZQUF4QjtBQUNBLENBRkQ7QUFJQXRDLE9BQU91QyxPQUFQLENBQWU7QUFDZEMsY0FBWSxDQUFDLEdBQUdDLElBQUosS0FBYTtBQUN4QixVQUFNQyxTQUFTMUMsT0FBTzJDLE1BQVAsRUFBZjs7QUFDQSxRQUFJRCxVQUFVdkQsV0FBV3lELEtBQVgsQ0FBaUJDLE9BQWpCLENBQXlCSCxNQUF6QixFQUFpQyxLQUFqQyxDQUFkLEVBQXVEO0FBQ3RELGFBQU9SLFdBQVd4QyxPQUFYLENBQW1CLEdBQUcrQyxJQUF0QixDQUFQO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBTSxJQUFJekMsT0FBT1MsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRU8sZ0JBQVE7QUFBVixPQUF2RCxDQUFOO0FBQ0E7QUFDRDtBQVJhLENBQWYsRTs7Ozs7Ozs7Ozs7QUM3SkFoQixPQUFPOEMsT0FBUCxDQUFlLFlBQVc7QUFDekIzRCxhQUFXZ0QsUUFBWCxDQUFvQlksUUFBcEIsQ0FBNkIsTUFBN0IsRUFBcUMsWUFBVztBQUMvQyxTQUFLQyxHQUFMLENBQVMsdUJBQVQsRUFBa0Msa0RBQWxDLEVBQXNGO0FBQ3JGQyxZQUFNLFFBRCtFO0FBRXJGQyxlQUFTLFNBRjRFO0FBR3JGQyxpQkFBVyx1QkFIMEU7QUFJckZDLHVCQUFpQjtBQUpvRSxLQUF0RjtBQU1BLEdBUEQ7QUFRQSxDQVRELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfYm90LWhlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBCb3RIZWxwZXJzIGhlbHBzIGJvdHNcbiAqIFwicHJpdmF0ZVwiIHByb3BlcnRpZXMgdXNlIG1ldGVvciBjb2xsZWN0aW9uIGN1cnNvcnMsIHNvIHRoZXkgc3RheSByZWFjdGl2ZVxuICogXCJwdWJsaWNcIiBwcm9wZXJ0aWVzIHVzZSBnZXR0ZXJzIHRvIGZldGNoIGFuZCBmaWx0ZXIgY29sbGVjdGlvbnMgYXMgYXJyYXlcbiAqL1xuY2xhc3MgQm90SGVscGVycyB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMucXVlcmllcyA9IHtcblx0XHRcdG9ubGluZTogeyAnc3RhdHVzJzogeyAkbmU6ICdvZmZsaW5lJyB9IH0sXG5cdFx0XHR1c2VyczogeyAncm9sZXMnOiB7ICRub3Q6IHsgJGFsbDogWydib3QnXSB9IH0gfVxuXHRcdH07XG5cdH1cblxuXHQvLyBzZXR1cCBjb2xsZWN0aW9uIGN1cnNvcnMgd2l0aCBhcnJheSBvZiBmaWVsZHMgZnJvbSBzZXR0aW5nXG5cdHNldHVwQ3Vyc29ycyhmaWVsZHNTZXR0aW5nKSB7XG5cdFx0dGhpcy51c2VyRmllbGRzID0ge307XG5cdFx0aWYgKHR5cGVvZiBmaWVsZHNTZXR0aW5nID09PSAnc3RyaW5nJykge1xuXHRcdFx0ZmllbGRzU2V0dGluZyA9IGZpZWxkc1NldHRpbmcuc3BsaXQoJywnKTtcblx0XHR9XG5cdFx0ZmllbGRzU2V0dGluZy5mb3JFYWNoKChuKSA9PiB7XG5cdFx0XHR0aGlzLnVzZXJGaWVsZHNbbi50cmltKCldID0gMTtcblx0XHR9KTtcblx0XHR0aGlzLl9hbGxVc2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQodGhpcy5xdWVyaWVzLnVzZXJzLCB7IGZpZWxkczogdGhpcy51c2VyRmllbGRzIH0pO1xuXHRcdHRoaXMuX29ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZCh7ICRhbmQ6IFt0aGlzLnF1ZXJpZXMudXNlcnMsIHRoaXMucXVlcmllcy5vbmxpbmVdIH0sIHsgZmllbGRzOiB0aGlzLnVzZXJGaWVsZHMgfSk7XG5cdH1cblxuXHQvLyByZXF1ZXN0IG1ldGhvZHMgb3IgcHJvcHMgYXMgYXJndW1lbnRzIHRvIE1ldGVvci5jYWxsXG5cdHJlcXVlc3QocHJvcCwgLi4ucGFyYW1zKSB7XG5cdFx0aWYgKHR5cGVvZiB0aGlzW3Byb3BdID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgdGhpc1twcm9wXSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRoaXNbcHJvcF0oLi4ucGFyYW1zKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXNbcHJvcF07XG5cdFx0fVxuXHR9XG5cblx0YWRkVXNlclRvUm9sZSh1c2VyTmFtZSwgcm9sZU5hbWUpIHtcblx0XHRNZXRlb3IuY2FsbCgnYXV0aG9yaXphdGlvbjphZGRVc2VyVG9Sb2xlJywgcm9sZU5hbWUsIHVzZXJOYW1lKTtcblx0fVxuXG5cdHJlbW92ZVVzZXJGcm9tUm9sZSh1c2VyTmFtZSwgcm9sZU5hbWUpIHtcblx0XHRNZXRlb3IuY2FsbCgnYXV0aG9yaXphdGlvbjpyZW1vdmVVc2VyRnJvbVJvbGUnLCByb2xlTmFtZSwgdXNlck5hbWUpO1xuXHR9XG5cblx0YWRkVXNlclRvUm9vbSh1c2VyTmFtZSwgcm9vbSkge1xuXHRcdGNvbnN0IGZvdW5kUm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkT3JOYW1lKHJvb20pO1xuXG5cdFx0aWYgKCFfLmlzT2JqZWN0KGZvdW5kUm9vbSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtY2hhbm5lbCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGRhdGEgPSB7fTtcblx0XHRkYXRhLnJpZCA9IGZvdW5kUm9vbS5faWQ7XG5cdFx0ZGF0YS51c2VybmFtZSA9IHVzZXJOYW1lO1xuXHRcdE1ldGVvci5jYWxsKCdhZGRVc2VyVG9Sb29tJywgZGF0YSk7XG5cdH1cblxuXHRyZW1vdmVVc2VyRnJvbVJvb20odXNlck5hbWUsIHJvb20pIHtcblx0XHRjb25zdCBmb3VuZFJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZE9yTmFtZShyb29tKTtcblxuXHRcdGlmICghXy5pc09iamVjdChmb3VuZFJvb20pKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWNoYW5uZWwnKTtcblx0XHR9XG5cdFx0Y29uc3QgZGF0YSA9IHt9O1xuXHRcdGRhdGEucmlkID0gZm91bmRSb29tLl9pZDtcblx0XHRkYXRhLnVzZXJuYW1lID0gdXNlck5hbWU7XG5cdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVVzZXJGcm9tUm9vbScsIGRhdGEpO1xuXHR9XG5cblx0Ly8gZ2VuZXJpYyBlcnJvciB3aGVuZXZlciBwcm9wZXJ0eSBhY2Nlc3MgaW5zdWZmaWNpZW50IHRvIGZpbGwgcmVxdWVzdFxuXHRyZXF1ZXN0RXJyb3IoKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnQm90IHJlcXVlc3Qgbm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2JvdFJlcXVlc3QnLCBhY3Rpb246ICdib3RfcmVxdWVzdCcgfSk7XG5cdH1cblxuXHQvLyBcInB1YmxpY1wiIHByb3BlcnRpZXMgYWNjZXNzZWQgYnkgZ2V0dGVyc1xuXHQvLyBhbGxVc2VycyAvIG9ubGluZVVzZXJzIHJldHVybiB3aGljaGV2ZXIgcHJvcGVydGllcyBhcmUgZW5hYmxlZCBieSBzZXR0aW5nc1xuXHRnZXQgYWxsVXNlcnMoKSB7XG5cdFx0aWYgKCFPYmplY3Qua2V5cyh0aGlzLnVzZXJGaWVsZHMpLmxlbmd0aCkge1xuXHRcdFx0dGhpcy5yZXF1ZXN0RXJyb3IoKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbFVzZXJzLmZldGNoKCk7XG5cdFx0fVxuXHR9XG5cdGdldCBvbmxpbmVVc2VycygpIHtcblx0XHRpZiAoIU9iamVjdC5rZXlzKHRoaXMudXNlckZpZWxkcykubGVuZ3RoKSB7XG5cdFx0XHR0aGlzLnJlcXVlc3RFcnJvcigpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25saW5lVXNlcnMuZmV0Y2goKTtcblx0XHR9XG5cdH1cblx0Z2V0IGFsbFVzZXJuYW1lcygpIHtcblx0XHRpZiAoIXRoaXMudXNlckZpZWxkcy5oYXNPd25Qcm9wZXJ0eSgndXNlcm5hbWUnKSkge1xuXHRcdFx0dGhpcy5yZXF1ZXN0RXJyb3IoKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbFVzZXJzLmZldGNoKCkubWFwKCh1c2VyKSA9PiB1c2VyLnVzZXJuYW1lKTtcblx0XHR9XG5cdH1cblx0Z2V0IG9ubGluZVVzZXJuYW1lcygpIHtcblx0XHRpZiAoIXRoaXMudXNlckZpZWxkcy5oYXNPd25Qcm9wZXJ0eSgndXNlcm5hbWUnKSkge1xuXHRcdFx0dGhpcy5yZXF1ZXN0RXJyb3IoKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMuX29ubGluZVVzZXJzLmZldGNoKCkubWFwKCh1c2VyKSA9PiB1c2VyLnVzZXJuYW1lKTtcblx0XHR9XG5cdH1cblx0Z2V0IGFsbE5hbWVzKCkge1xuXHRcdGlmICghdGhpcy51c2VyRmllbGRzLmhhc093blByb3BlcnR5KCduYW1lJykpIHtcblx0XHRcdHRoaXMucmVxdWVzdEVycm9yKCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxVc2Vycy5mZXRjaCgpLm1hcCgodXNlcikgPT4gdXNlci5uYW1lKTtcblx0XHR9XG5cdH1cblx0Z2V0IG9ubGluZU5hbWVzKCkge1xuXHRcdGlmICghdGhpcy51c2VyRmllbGRzLmhhc093blByb3BlcnR5KCduYW1lJykpIHtcblx0XHRcdHRoaXMucmVxdWVzdEVycm9yKCk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLl9vbmxpbmVVc2Vycy5mZXRjaCgpLm1hcCgodXNlcikgPT4gdXNlci5uYW1lKTtcblx0XHR9XG5cdH1cblx0Z2V0IGFsbElEcygpIHtcblx0XHRpZiAoIXRoaXMudXNlckZpZWxkcy5oYXNPd25Qcm9wZXJ0eSgnX2lkJykgfHwgIXRoaXMudXNlckZpZWxkcy5oYXNPd25Qcm9wZXJ0eSgndXNlcm5hbWUnKSkge1xuXHRcdFx0dGhpcy5yZXF1ZXN0RXJyb3IoKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbFVzZXJzLmZldGNoKCkubWFwKCh1c2VyKSA9PiB7XG5cdFx0XHRcdHJldHVybiB7ICdpZCc6IHVzZXIuX2lkLCAnbmFtZSc6IHVzZXIudXNlcm5hbWUgfTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXHRnZXQgb25saW5lSURzKCkge1xuXHRcdGlmICghdGhpcy51c2VyRmllbGRzLmhhc093blByb3BlcnR5KCdfaWQnKSB8fCAhdGhpcy51c2VyRmllbGRzLmhhc093blByb3BlcnR5KCd1c2VybmFtZScpKSB7XG5cdFx0XHR0aGlzLnJlcXVlc3RFcnJvcigpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25saW5lVXNlcnMuZmV0Y2goKS5tYXAoKHVzZXIpID0+IHtcblx0XHRcdFx0cmV0dXJuIHsgJ2lkJzogdXNlci5faWQsICduYW1lJzogdXNlci51c2VybmFtZSB9O1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGFkZCBjbGFzcyB0byBtZXRlb3IgbWV0aG9kc1xuY29uc3QgYm90SGVscGVycyA9IG5ldyBCb3RIZWxwZXJzKCk7XG5cbi8vIGluaXQgY3Vyc29ycyB3aXRoIGZpZWxkcyBzZXR0aW5nIGFuZCB1cGRhdGUgb24gc2V0dGluZyBjaGFuZ2VcblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdCb3RIZWxwZXJzX3VzZXJGaWVsZHMnLCBmdW5jdGlvbihzZXR0aW5nS2V5LCBzZXR0aW5nVmFsdWUpIHtcblx0Ym90SGVscGVycy5zZXR1cEN1cnNvcnMoc2V0dGluZ1ZhbHVlKTtcbn0pO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGJvdFJlcXVlc3Q6ICguLi5hcmdzKSA9PiB7XG5cdFx0Y29uc3QgdXNlcklEID0gTWV0ZW9yLnVzZXJJZCgpO1xuXHRcdGlmICh1c2VySUQgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKHVzZXJJRCwgJ2JvdCcpKSB7XG5cdFx0XHRyZXR1cm4gYm90SGVscGVycy5yZXF1ZXN0KC4uLmFyZ3MpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdib3RSZXF1ZXN0JyB9KTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0JvdHMnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnQm90SGVscGVyc191c2VyRmllbGRzJywgJ19pZCwgbmFtZSwgdXNlcm5hbWUsIGVtYWlscywgbGFuZ3VhZ2UsIHV0Y09mZnNldCcsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0c2VjdGlvbjogJ0hlbHBlcnMnLFxuXHRcdFx0aTE4bkxhYmVsOiAnQm90SGVscGVyc191c2VyRmllbGRzJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0JvdEhlbHBlcnNfdXNlckZpZWxkc19EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0fSk7XG59KTtcbiJdfQ==
