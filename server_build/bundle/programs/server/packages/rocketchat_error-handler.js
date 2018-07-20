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

/* Package-scope variables */
var roomName, message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:error-handler":{"server":{"lib":{"RocketChat.ErrorHandler.js":function(){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/rocketchat_error-handler/server/lib/RocketChat.ErrorHandler.js   //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
class ErrorHandler {
  constructor() {
    this.reporting = false;
    this.rid = null;
    this.lastError = null;
    Meteor.startup(() => {
      this.registerHandlers();
      RocketChat.settings.get('Log_Exceptions_to_Channel', (key, value) => {
        this.rid = null;
        const roomName = value.trim();

        if (roomName) {
          this.rid = this.getRoomId(roomName);
        }

        if (this.rid) {
          this.reporting = true;
        } else {
          this.reporting = false;
        }
      });
    });
  }

  registerHandlers() {
    process.on('uncaughtException', Meteor.bindEnvironment(error => {
      if (!this.reporting) {
        return;
      }

      this.trackError(error.message, error.stack);
    }));
    const self = this;
    const originalMeteorDebug = Meteor._debug;

    Meteor._debug = function (message, stack) {
      if (!self.reporting) {
        return originalMeteorDebug.call(this, message, stack);
      }

      self.trackError(message, stack);
      return originalMeteorDebug.apply(this, arguments);
    };
  }

  getRoomId(roomName) {
    roomName = roomName.replace('#');
    const room = RocketChat.models.Rooms.findOneByName(roomName, {
      fields: {
        _id: 1,
        t: 1
      }
    });

    if (!room || room.t !== 'c' && room.t !== 'p') {
      return;
    }

    return room._id;
  }

  trackError(message, stack) {
    if (!this.reporting || !this.rid || this.lastError === message) {
      return;
    }

    this.lastError = message;
    const user = RocketChat.models.Users.findOneById('rocket.cat');

    if (stack) {
      message = `${message}\n\`\`\`\n${stack}\n\`\`\``;
    }

    RocketChat.sendMessage(user, {
      msg: message
    }, {
      _id: this.rid
    });
  }

}

RocketChat.ErrorHandler = new ErrorHandler();
///////////////////////////////////////////////////////////////////////////////

}},"startup":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/rocketchat_error-handler/server/startup/settings.js              //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
RocketChat.settings.addGroup('Logs', function () {
  this.add('Log_Exceptions_to_Channel', '', {
    type: 'string'
  });
});
///////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:error-handler/server/lib/RocketChat.ErrorHandler.js");
require("/node_modules/meteor/rocketchat:error-handler/server/startup/settings.js");

/* Exports */
Package._define("rocketchat:error-handler");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_error-handler.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplcnJvci1oYW5kbGVyL3NlcnZlci9saWIvUm9ja2V0Q2hhdC5FcnJvckhhbmRsZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZXJyb3ItaGFuZGxlci9zZXJ2ZXIvc3RhcnR1cC9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJFcnJvckhhbmRsZXIiLCJjb25zdHJ1Y3RvciIsInJlcG9ydGluZyIsInJpZCIsImxhc3RFcnJvciIsIk1ldGVvciIsInN0YXJ0dXAiLCJyZWdpc3RlckhhbmRsZXJzIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiZ2V0Iiwia2V5IiwidmFsdWUiLCJyb29tTmFtZSIsInRyaW0iLCJnZXRSb29tSWQiLCJwcm9jZXNzIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJlcnJvciIsInRyYWNrRXJyb3IiLCJtZXNzYWdlIiwic3RhY2siLCJzZWxmIiwib3JpZ2luYWxNZXRlb3JEZWJ1ZyIsIl9kZWJ1ZyIsImNhbGwiLCJhcHBseSIsImFyZ3VtZW50cyIsInJlcGxhY2UiLCJyb29tIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwiZmllbGRzIiwiX2lkIiwidCIsInVzZXIiLCJVc2VycyIsImZpbmRPbmVCeUlkIiwic2VuZE1lc3NhZ2UiLCJtc2ciLCJhZGRHcm91cCIsImFkZCIsInR5cGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxNQUFNQSxZQUFOLENBQW1CO0FBQ2xCQyxnQkFBYztBQUNiLFNBQUtDLFNBQUwsR0FBaUIsS0FBakI7QUFDQSxTQUFLQyxHQUFMLEdBQVcsSUFBWDtBQUNBLFNBQUtDLFNBQUwsR0FBaUIsSUFBakI7QUFFQUMsV0FBT0MsT0FBUCxDQUFlLE1BQU07QUFDcEIsV0FBS0MsZ0JBQUw7QUFFQUMsaUJBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixFQUFxRCxDQUFDQyxHQUFELEVBQU1DLEtBQU4sS0FBZ0I7QUFDcEUsYUFBS1QsR0FBTCxHQUFXLElBQVg7QUFDQSxjQUFNVSxXQUFXRCxNQUFNRSxJQUFOLEVBQWpCOztBQUNBLFlBQUlELFFBQUosRUFBYztBQUNiLGVBQUtWLEdBQUwsR0FBVyxLQUFLWSxTQUFMLENBQWVGLFFBQWYsQ0FBWDtBQUNBOztBQUVELFlBQUksS0FBS1YsR0FBVCxFQUFjO0FBQ2IsZUFBS0QsU0FBTCxHQUFpQixJQUFqQjtBQUNBLFNBRkQsTUFFTztBQUNOLGVBQUtBLFNBQUwsR0FBaUIsS0FBakI7QUFDQTtBQUNELE9BWkQ7QUFhQSxLQWhCRDtBQWlCQTs7QUFFREsscUJBQW1CO0FBQ2xCUyxZQUFRQyxFQUFSLENBQVcsbUJBQVgsRUFBZ0NaLE9BQU9hLGVBQVAsQ0FBd0JDLEtBQUQsSUFBVztBQUNqRSxVQUFJLENBQUMsS0FBS2pCLFNBQVYsRUFBcUI7QUFDcEI7QUFDQTs7QUFDRCxXQUFLa0IsVUFBTCxDQUFnQkQsTUFBTUUsT0FBdEIsRUFBK0JGLE1BQU1HLEtBQXJDO0FBQ0EsS0FMK0IsQ0FBaEM7QUFPQSxVQUFNQyxPQUFPLElBQWI7QUFDQSxVQUFNQyxzQkFBc0JuQixPQUFPb0IsTUFBbkM7O0FBQ0FwQixXQUFPb0IsTUFBUCxHQUFnQixVQUFTSixPQUFULEVBQWtCQyxLQUFsQixFQUF5QjtBQUN4QyxVQUFJLENBQUNDLEtBQUtyQixTQUFWLEVBQXFCO0FBQ3BCLGVBQU9zQixvQkFBb0JFLElBQXBCLENBQXlCLElBQXpCLEVBQStCTCxPQUEvQixFQUF3Q0MsS0FBeEMsQ0FBUDtBQUNBOztBQUNEQyxXQUFLSCxVQUFMLENBQWdCQyxPQUFoQixFQUF5QkMsS0FBekI7QUFDQSxhQUFPRSxvQkFBb0JHLEtBQXBCLENBQTBCLElBQTFCLEVBQWdDQyxTQUFoQyxDQUFQO0FBQ0EsS0FORDtBQU9BOztBQUVEYixZQUFVRixRQUFWLEVBQW9CO0FBQ25CQSxlQUFXQSxTQUFTZ0IsT0FBVCxDQUFpQixHQUFqQixDQUFYO0FBQ0EsVUFBTUMsT0FBT3RCLFdBQVd1QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsYUFBeEIsQ0FBc0NwQixRQUF0QyxFQUFnRDtBQUFFcUIsY0FBUTtBQUFFQyxhQUFLLENBQVA7QUFBVUMsV0FBRztBQUFiO0FBQVYsS0FBaEQsQ0FBYjs7QUFDQSxRQUFJLENBQUNOLElBQUQsSUFBVUEsS0FBS00sQ0FBTCxLQUFXLEdBQVgsSUFBa0JOLEtBQUtNLENBQUwsS0FBVyxHQUEzQyxFQUFpRDtBQUNoRDtBQUNBOztBQUNELFdBQU9OLEtBQUtLLEdBQVo7QUFDQTs7QUFFRGYsYUFBV0MsT0FBWCxFQUFvQkMsS0FBcEIsRUFBMkI7QUFDMUIsUUFBSSxDQUFDLEtBQUtwQixTQUFOLElBQW1CLENBQUMsS0FBS0MsR0FBekIsSUFBZ0MsS0FBS0MsU0FBTCxLQUFtQmlCLE9BQXZELEVBQWdFO0FBQy9EO0FBQ0E7O0FBQ0QsU0FBS2pCLFNBQUwsR0FBaUJpQixPQUFqQjtBQUNBLFVBQU1nQixPQUFPN0IsV0FBV3VCLE1BQVgsQ0FBa0JPLEtBQWxCLENBQXdCQyxXQUF4QixDQUFvQyxZQUFwQyxDQUFiOztBQUVBLFFBQUlqQixLQUFKLEVBQVc7QUFDVkQsZ0JBQVcsR0FBR0EsT0FBUyxhQUFhQyxLQUFPLFVBQTNDO0FBQ0E7O0FBRURkLGVBQVdnQyxXQUFYLENBQXVCSCxJQUF2QixFQUE2QjtBQUFFSSxXQUFLcEI7QUFBUCxLQUE3QixFQUErQztBQUFFYyxXQUFLLEtBQUtoQztBQUFaLEtBQS9DO0FBQ0E7O0FBakVpQjs7QUFvRW5CSyxXQUFXUixZQUFYLEdBQTBCLElBQUlBLFlBQUosRUFBMUIsQzs7Ozs7Ozs7Ozs7QUNwRUFRLFdBQVdDLFFBQVgsQ0FBb0JpQyxRQUFwQixDQUE2QixNQUE3QixFQUFxQyxZQUFXO0FBQy9DLE9BQUtDLEdBQUwsQ0FBUywyQkFBVCxFQUFzQyxFQUF0QyxFQUEwQztBQUFFQyxVQUFNO0FBQVIsR0FBMUM7QUFDQSxDQUZELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZXJyb3ItaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIEVycm9ySGFuZGxlciB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMucmVwb3J0aW5nID0gZmFsc2U7XG5cdFx0dGhpcy5yaWQgPSBudWxsO1xuXHRcdHRoaXMubGFzdEVycm9yID0gbnVsbDtcblxuXHRcdE1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0XHRcdHRoaXMucmVnaXN0ZXJIYW5kbGVycygpO1xuXG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTG9nX0V4Y2VwdGlvbnNfdG9fQ2hhbm5lbCcsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRcdHRoaXMucmlkID0gbnVsbDtcblx0XHRcdFx0Y29uc3Qgcm9vbU5hbWUgPSB2YWx1ZS50cmltKCk7XG5cdFx0XHRcdGlmIChyb29tTmFtZSkge1xuXHRcdFx0XHRcdHRoaXMucmlkID0gdGhpcy5nZXRSb29tSWQocm9vbU5hbWUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHRoaXMucmlkKSB7XG5cdFx0XHRcdFx0dGhpcy5yZXBvcnRpbmcgPSB0cnVlO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMucmVwb3J0aW5nID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cmVnaXN0ZXJIYW5kbGVycygpIHtcblx0XHRwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVycm9yKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMucmVwb3J0aW5nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHRoaXMudHJhY2tFcnJvcihlcnJvci5tZXNzYWdlLCBlcnJvci5zdGFjayk7XG5cdFx0fSkpO1xuXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdFx0Y29uc3Qgb3JpZ2luYWxNZXRlb3JEZWJ1ZyA9IE1ldGVvci5fZGVidWc7XG5cdFx0TWV0ZW9yLl9kZWJ1ZyA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHN0YWNrKSB7XG5cdFx0XHRpZiAoIXNlbGYucmVwb3J0aW5nKSB7XG5cdFx0XHRcdHJldHVybiBvcmlnaW5hbE1ldGVvckRlYnVnLmNhbGwodGhpcywgbWVzc2FnZSwgc3RhY2spO1xuXHRcdFx0fVxuXHRcdFx0c2VsZi50cmFja0Vycm9yKG1lc3NhZ2UsIHN0YWNrKTtcblx0XHRcdHJldHVybiBvcmlnaW5hbE1ldGVvckRlYnVnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdGdldFJvb21JZChyb29tTmFtZSkge1xuXHRcdHJvb21OYW1lID0gcm9vbU5hbWUucmVwbGFjZSgnIycpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHJvb21OYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEsIHQ6IDEgfSB9KTtcblx0XHRpZiAoIXJvb20gfHwgKHJvb20udCAhPT0gJ2MnICYmIHJvb20udCAhPT0gJ3AnKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRyZXR1cm4gcm9vbS5faWQ7XG5cdH1cblxuXHR0cmFja0Vycm9yKG1lc3NhZ2UsIHN0YWNrKSB7XG5cdFx0aWYgKCF0aGlzLnJlcG9ydGluZyB8fCAhdGhpcy5yaWQgfHwgdGhpcy5sYXN0RXJyb3IgPT09IG1lc3NhZ2UpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5sYXN0RXJyb3IgPSBtZXNzYWdlO1xuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCgncm9ja2V0LmNhdCcpO1xuXG5cdFx0aWYgKHN0YWNrKSB7XG5cdFx0XHRtZXNzYWdlID0gYCR7IG1lc3NhZ2UgfVxcblxcYFxcYFxcYFxcbiR7IHN0YWNrIH1cXG5cXGBcXGBcXGBgO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2UodXNlciwgeyBtc2c6IG1lc3NhZ2UgfSwgeyBfaWQ6IHRoaXMucmlkIH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQuRXJyb3JIYW5kbGVyID0gbmV3IEVycm9ySGFuZGxlcjtcbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0xvZ3MnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5hZGQoJ0xvZ19FeGNlcHRpb25zX3RvX0NoYW5uZWwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJyB9KTtcbn0pO1xuIl19
