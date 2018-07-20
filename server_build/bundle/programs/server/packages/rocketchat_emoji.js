(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var renderMessageBody = Package['rocketchat:ui-message'].renderMessageBody;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var renderEmoji;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:emoji":{"client":{"rocketchat.js":function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/rocketchat_emoji/client/rocketchat.js                    //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
RocketChat.emoji = {
  packages: {
    base: {
      emojiCategories: {
        recent: 'Frequently_Used'
      },
      emojisByCategory: {
        recent: []
      },
      toneList: {},

      render(html) {
        return html;
      }

    }
  },
  list: {}
};
///////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:emoji/client/rocketchat.js");

/* Exports */
Package._define("rocketchat:emoji", {
  renderEmoji: renderEmoji
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_emoji.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS9jbGllbnQvcm9ja2V0Y2hhdC5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0IiwiZW1vamkiLCJwYWNrYWdlcyIsImJhc2UiLCJlbW9qaUNhdGVnb3JpZXMiLCJyZWNlbnQiLCJlbW9qaXNCeUNhdGVnb3J5IiwidG9uZUxpc3QiLCJyZW5kZXIiLCJodG1sIiwibGlzdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsS0FBWCxHQUFtQjtBQUNsQkMsWUFBVTtBQUNUQyxVQUFNO0FBQ0xDLHVCQUFpQjtBQUFFQyxnQkFBUTtBQUFWLE9BRFo7QUFFTEMsd0JBQWtCO0FBQ2pCRCxnQkFBUTtBQURTLE9BRmI7QUFLTEUsZ0JBQVUsRUFMTDs7QUFNTEMsYUFBT0MsSUFBUCxFQUFhO0FBQ1osZUFBT0EsSUFBUDtBQUNBOztBQVJJO0FBREcsR0FEUTtBQWFsQkMsUUFBTTtBQWJZLENBQW5CLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZW1vamkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LmVtb2ppID0ge1xuXHRwYWNrYWdlczoge1xuXHRcdGJhc2U6IHtcblx0XHRcdGVtb2ppQ2F0ZWdvcmllczogeyByZWNlbnQ6ICdGcmVxdWVudGx5X1VzZWQnIH0sXG5cdFx0XHRlbW9qaXNCeUNhdGVnb3J5OiB7XG5cdFx0XHRcdHJlY2VudDogW11cblx0XHRcdH0sXG5cdFx0XHR0b25lTGlzdDoge30sXG5cdFx0XHRyZW5kZXIoaHRtbCkge1xuXHRcdFx0XHRyZXR1cm4gaHRtbDtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGxpc3Q6IHt9XG59O1xuIl19
