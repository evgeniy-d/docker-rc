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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-me":{"me.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////
//                                                                      //
// packages/rocketchat_slashcommands-me/me.js                           //
//                                                                      //
//////////////////////////////////////////////////////////////////////////
                                                                        //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

/*
 * Me is a named function that will replace /me commands
 * @param {Object} message - The message object
 */
RocketChat.slashCommands.add('me', function Me(command, params, item) {
  if (command !== 'me') {
    return;
  }

  if (s.trim(params)) {
    const msg = item;
    msg.msg = `_${params}_`;
    Meteor.call('sendMessage', msg);
  }
}, {
  description: 'Displays_action_text',
  params: 'your_message'
});
//////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-me/me.js");

/* Exports */
Package._define("rocketchat:slashcommands-me");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-me.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLW1lL21lLmpzIl0sIm5hbWVzIjpbInMiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIlJvY2tldENoYXQiLCJzbGFzaENvbW1hbmRzIiwiYWRkIiwiTWUiLCJjb21tYW5kIiwicGFyYW1zIiwiaXRlbSIsInRyaW0iLCJtc2ciLCJNZXRlb3IiLCJjYWxsIiwiZGVzY3JpcHRpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKO0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEOztBQUVOOzs7O0FBSUFDLFdBQVdDLGFBQVgsQ0FBeUJDLEdBQXpCLENBQTZCLElBQTdCLEVBQW1DLFNBQVNDLEVBQVQsQ0FBWUMsT0FBWixFQUFxQkMsTUFBckIsRUFBNkJDLElBQTdCLEVBQW1DO0FBQ3JFLE1BQUlGLFlBQVksSUFBaEIsRUFBc0I7QUFDckI7QUFDQTs7QUFFRCxNQUFJVixFQUFFYSxJQUFGLENBQU9GLE1BQVAsQ0FBSixFQUFvQjtBQUNuQixVQUFNRyxNQUFNRixJQUFaO0FBQ0FFLFFBQUlBLEdBQUosR0FBVyxJQUFJSCxNQUFRLEdBQXZCO0FBQ0FJLFdBQU9DLElBQVAsQ0FBWSxhQUFaLEVBQTJCRixHQUEzQjtBQUNBO0FBQ0QsQ0FWRCxFQVVHO0FBQ0ZHLGVBQWEsc0JBRFg7QUFFRk4sVUFBUTtBQUZOLENBVkgsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbGFzaGNvbW1hbmRzLW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG4vKlxuICogTWUgaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcmVwbGFjZSAvbWUgY29tbWFuZHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4gKi9cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ21lJywgZnVuY3Rpb24gTWUoY29tbWFuZCwgcGFyYW1zLCBpdGVtKSB7XG5cdGlmIChjb21tYW5kICE9PSAnbWUnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKHMudHJpbShwYXJhbXMpKSB7XG5cdFx0Y29uc3QgbXNnID0gaXRlbTtcblx0XHRtc2cubXNnID0gYF8keyBwYXJhbXMgfV9gO1xuXHRcdE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIG1zZyk7XG5cdH1cbn0sIHtcblx0ZGVzY3JpcHRpb246ICdEaXNwbGF5c19hY3Rpb25fdGV4dCcsXG5cdHBhcmFtczogJ3lvdXJfbWVzc2FnZSdcbn0pO1xuIl19
