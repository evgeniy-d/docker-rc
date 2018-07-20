(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-asciiarts":{"gimme.js":function(){

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/rocketchat_slashcommands-asciiarts/gimme.js               //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
/*
* Gimme is a named function that will replace /gimme commands
* @param {Object} message - The message object
*/
function Gimme(command, params, item) {
  if (command === 'gimme') {
    const msg = item;
    msg.msg = `༼ つ ◕_◕ ༽つ ${params}`;
    Meteor.call('sendMessage', msg);
  }
}

RocketChat.slashCommands.add('gimme', Gimme, {
  description: 'Slash_Gimme_Description',
  params: 'your_message_optional'
});
////////////////////////////////////////////////////////////////////////

},"lenny.js":function(){

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/rocketchat_slashcommands-asciiarts/lenny.js               //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
/*
* Lenny is a named function that will replace /lenny commands
* @param {Object} message - The message object
*/
function LennyFace(command, params, item) {
  if (command === 'lennyface') {
    const msg = item;
    msg.msg = `${params} ( ͡° ͜ʖ ͡°)`;
    Meteor.call('sendMessage', msg);
  }
}

RocketChat.slashCommands.add('lennyface', LennyFace, {
  description: 'Slash_LennyFace_Description',
  params: 'your_message_optional'
});
////////////////////////////////////////////////////////////////////////

},"shrug.js":function(){

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/rocketchat_slashcommands-asciiarts/shrug.js               //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
/*
* Shrug is a named function that will replace /shrug commands
* @param {Object} message - The message object
*/
function Shrug(command, params, item) {
  if (command === 'shrug') {
    const msg = item;
    msg.msg = `${params} ¯\\_(ツ)_/¯`;
    Meteor.call('sendMessage', msg);
  }
}

RocketChat.slashCommands.add('shrug', Shrug, {
  description: 'Slash_Shrug_Description',
  params: 'your_message_optional'
});
////////////////////////////////////////////////////////////////////////

},"tableflip.js":function(){

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/rocketchat_slashcommands-asciiarts/tableflip.js           //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
/*
* Tableflip is a named function that will replace /Tableflip commands
* @param {Object} message - The message object
*/
function Tableflip(command, params, item) {
  if (command === 'tableflip') {
    const msg = item;
    msg.msg = `${params} (╯°□°）╯︵ ┻━┻`;
    Meteor.call('sendMessage', msg);
  }
}

RocketChat.slashCommands.add('tableflip', Tableflip, {
  description: 'Slash_Tableflip_Description',
  params: 'your_message_optional'
});
////////////////////////////////////////////////////////////////////////

},"unflip.js":function(){

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/rocketchat_slashcommands-asciiarts/unflip.js              //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
/*
* Unflip is a named function that will replace /unflip commands
* @param {Object} message - The message object
*/
function Unflip(command, params, item) {
  if (command === 'unflip') {
    const msg = item;
    msg.msg = `${params} ┬─┬ ノ( ゜-゜ノ)`;
    Meteor.call('sendMessage', msg);
  }
}

RocketChat.slashCommands.add('unflip', Unflip, {
  description: 'Slash_TableUnflip_Description',
  params: 'your_message_optional'
});
////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-asciiarts/gimme.js");
require("/node_modules/meteor/rocketchat:slashcommands-asciiarts/lenny.js");
require("/node_modules/meteor/rocketchat:slashcommands-asciiarts/shrug.js");
require("/node_modules/meteor/rocketchat:slashcommands-asciiarts/tableflip.js");
require("/node_modules/meteor/rocketchat:slashcommands-asciiarts/unflip.js");

/* Exports */
Package._define("rocketchat:slashcommands-asciiarts");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-asciiarts.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWFzY2lpYXJ0cy9naW1tZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWFzY2lpYXJ0cy9sZW5ueS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWFzY2lpYXJ0cy9zaHJ1Zy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWFzY2lpYXJ0cy90YWJsZWZsaXAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhc2hjb21tYW5kcy1hc2NpaWFydHMvdW5mbGlwLmpzIl0sIm5hbWVzIjpbIkdpbW1lIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJtc2ciLCJNZXRlb3IiLCJjYWxsIiwiUm9ja2V0Q2hhdCIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJkZXNjcmlwdGlvbiIsIkxlbm55RmFjZSIsIlNocnVnIiwiVGFibGVmbGlwIiwiVW5mbGlwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFNQSxTQUFTQSxLQUFULENBQWVDLE9BQWYsRUFBd0JDLE1BQXhCLEVBQWdDQyxJQUFoQyxFQUFzQztBQUNyQyxNQUFJRixZQUFZLE9BQWhCLEVBQXlCO0FBQ3hCLFVBQU1HLE1BQU1ELElBQVo7QUFDQUMsUUFBSUEsR0FBSixHQUFXLGNBQWNGLE1BQVEsRUFBakM7QUFDQUcsV0FBT0MsSUFBUCxDQUFZLGFBQVosRUFBMkJGLEdBQTNCO0FBQ0E7QUFDRDs7QUFFREcsV0FBV0MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsT0FBN0IsRUFBc0NULEtBQXRDLEVBQTZDO0FBQzVDVSxlQUFhLHlCQUQrQjtBQUU1Q1IsVUFBUTtBQUZvQyxDQUE3QyxFOzs7Ozs7Ozs7OztBQ2RBOzs7O0FBTUEsU0FBU1MsU0FBVCxDQUFtQlYsT0FBbkIsRUFBNEJDLE1BQTVCLEVBQW9DQyxJQUFwQyxFQUEwQztBQUN6QyxNQUFJRixZQUFZLFdBQWhCLEVBQTZCO0FBQzVCLFVBQU1HLE1BQU1ELElBQVo7QUFDQUMsUUFBSUEsR0FBSixHQUFXLEdBQUdGLE1BQVEsY0FBdEI7QUFDQUcsV0FBT0MsSUFBUCxDQUFZLGFBQVosRUFBMkJGLEdBQTNCO0FBQ0E7QUFDRDs7QUFFREcsV0FBV0MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsV0FBN0IsRUFBMENFLFNBQTFDLEVBQXFEO0FBQ3BERCxlQUFhLDZCQUR1QztBQUVwRFIsVUFBUTtBQUY0QyxDQUFyRCxFOzs7Ozs7Ozs7OztBQ2RBOzs7O0FBTUEsU0FBU1UsS0FBVCxDQUFlWCxPQUFmLEVBQXdCQyxNQUF4QixFQUFnQ0MsSUFBaEMsRUFBc0M7QUFDckMsTUFBSUYsWUFBWSxPQUFoQixFQUF5QjtBQUN4QixVQUFNRyxNQUFNRCxJQUFaO0FBQ0FDLFFBQUlBLEdBQUosR0FBVyxHQUFHRixNQUFRLGFBQXRCO0FBQ0FHLFdBQU9DLElBQVAsQ0FBWSxhQUFaLEVBQTJCRixHQUEzQjtBQUNBO0FBQ0Q7O0FBRURHLFdBQVdDLGFBQVgsQ0FBeUJDLEdBQXpCLENBQTZCLE9BQTdCLEVBQXNDRyxLQUF0QyxFQUE2QztBQUM1Q0YsZUFBYSx5QkFEK0I7QUFFNUNSLFVBQVE7QUFGb0MsQ0FBN0MsRTs7Ozs7Ozs7Ozs7QUNkQTs7OztBQU1BLFNBQVNXLFNBQVQsQ0FBbUJaLE9BQW5CLEVBQTRCQyxNQUE1QixFQUFvQ0MsSUFBcEMsRUFBMEM7QUFDekMsTUFBSUYsWUFBWSxXQUFoQixFQUE2QjtBQUM1QixVQUFNRyxNQUFNRCxJQUFaO0FBQ0FDLFFBQUlBLEdBQUosR0FBVyxHQUFHRixNQUFRLGVBQXRCO0FBQ0FHLFdBQU9DLElBQVAsQ0FBWSxhQUFaLEVBQTJCRixHQUEzQjtBQUNBO0FBQ0Q7O0FBRURHLFdBQVdDLGFBQVgsQ0FBeUJDLEdBQXpCLENBQTZCLFdBQTdCLEVBQTBDSSxTQUExQyxFQUFxRDtBQUNwREgsZUFBYSw2QkFEdUM7QUFFcERSLFVBQVE7QUFGNEMsQ0FBckQsRTs7Ozs7Ozs7Ozs7QUNkQTs7OztBQU1BLFNBQVNZLE1BQVQsQ0FBZ0JiLE9BQWhCLEVBQXlCQyxNQUF6QixFQUFpQ0MsSUFBakMsRUFBdUM7QUFDdEMsTUFBSUYsWUFBWSxRQUFoQixFQUEwQjtBQUN6QixVQUFNRyxNQUFNRCxJQUFaO0FBQ0FDLFFBQUlBLEdBQUosR0FBVyxHQUFHRixNQUFRLGVBQXRCO0FBQ0FHLFdBQU9DLElBQVAsQ0FBWSxhQUFaLEVBQTJCRixHQUEzQjtBQUNBO0FBQ0Q7O0FBRURHLFdBQVdDLGFBQVgsQ0FBeUJDLEdBQXpCLENBQTZCLFFBQTdCLEVBQXVDSyxNQUF2QyxFQUErQztBQUM5Q0osZUFBYSwrQkFEaUM7QUFFOUNSLFVBQVE7QUFGc0MsQ0FBL0MsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbGFzaGNvbW1hbmRzLWFzY2lpYXJ0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIEdpbW1lIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL2dpbW1lIGNvbW1hbmRzXG4qIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4qL1xuXG5cbmZ1bmN0aW9uIEdpbW1lKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCA9PT0gJ2dpbW1lJykge1xuXHRcdGNvbnN0IG1zZyA9IGl0ZW07XG5cdFx0bXNnLm1zZyA9IGDgvLwg44GkIOKXlV/il5Ug4Ly944GkICR7IHBhcmFtcyB9YDtcblx0XHRNZXRlb3IuY2FsbCgnc2VuZE1lc3NhZ2UnLCBtc2cpO1xuXHR9XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ2dpbW1lJywgR2ltbWUsIHtcblx0ZGVzY3JpcHRpb246ICdTbGFzaF9HaW1tZV9EZXNjcmlwdGlvbicsXG5cdHBhcmFtczogJ3lvdXJfbWVzc2FnZV9vcHRpb25hbCdcbn0pO1xuIiwiLypcbiogTGVubnkgaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcmVwbGFjZSAvbGVubnkgY29tbWFuZHNcbiogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiovXG5cblxuZnVuY3Rpb24gTGVubnlGYWNlKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCA9PT0gJ2xlbm55ZmFjZScpIHtcblx0XHRjb25zdCBtc2cgPSBpdGVtO1xuXHRcdG1zZy5tc2cgPSBgJHsgcGFyYW1zIH0gKCDNocKwIM2cypYgzaHCsClgO1xuXHRcdE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIG1zZyk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgnbGVubnlmYWNlJywgTGVubnlGYWNlLCB7XG5cdGRlc2NyaXB0aW9uOiAnU2xhc2hfTGVubnlGYWNlX0Rlc2NyaXB0aW9uJyxcblx0cGFyYW1zOiAneW91cl9tZXNzYWdlX29wdGlvbmFsJ1xufSk7XG4iLCIvKlxuKiBTaHJ1ZyBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCByZXBsYWNlIC9zaHJ1ZyBjb21tYW5kc1xuKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuKi9cblxuXG5mdW5jdGlvbiBTaHJ1Zyhjb21tYW5kLCBwYXJhbXMsIGl0ZW0pIHtcblx0aWYgKGNvbW1hbmQgPT09ICdzaHJ1ZycpIHtcblx0XHRjb25zdCBtc2cgPSBpdGVtO1xuXHRcdG1zZy5tc2cgPSBgJHsgcGFyYW1zIH0gwq9cXFxcXyjjg4QpXy/Cr2A7XG5cdFx0TWV0ZW9yLmNhbGwoJ3NlbmRNZXNzYWdlJywgbXNnKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdzaHJ1ZycsIFNocnVnLCB7XG5cdGRlc2NyaXB0aW9uOiAnU2xhc2hfU2hydWdfRGVzY3JpcHRpb24nLFxuXHRwYXJhbXM6ICd5b3VyX21lc3NhZ2Vfb3B0aW9uYWwnXG59KTtcbiIsIi8qXG4qIFRhYmxlZmxpcCBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCByZXBsYWNlIC9UYWJsZWZsaXAgY29tbWFuZHNcbiogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiovXG5cblxuZnVuY3Rpb24gVGFibGVmbGlwKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCA9PT0gJ3RhYmxlZmxpcCcpIHtcblx0XHRjb25zdCBtc2cgPSBpdGVtO1xuXHRcdG1zZy5tc2cgPSBgJHsgcGFyYW1zIH0gKOKVr8Kw4pahwrDvvInila/vuLUg4pS74pSB4pS7YDtcblx0XHRNZXRlb3IuY2FsbCgnc2VuZE1lc3NhZ2UnLCBtc2cpO1xuXHR9XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ3RhYmxlZmxpcCcsIFRhYmxlZmxpcCwge1xuXHRkZXNjcmlwdGlvbjogJ1NsYXNoX1RhYmxlZmxpcF9EZXNjcmlwdGlvbicsXG5cdHBhcmFtczogJ3lvdXJfbWVzc2FnZV9vcHRpb25hbCdcbn0pO1xuIiwiLypcbiogVW5mbGlwIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL3VuZmxpcCBjb21tYW5kc1xuKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuKi9cblxuXG5mdW5jdGlvbiBVbmZsaXAoY29tbWFuZCwgcGFyYW1zLCBpdGVtKSB7XG5cdGlmIChjb21tYW5kID09PSAndW5mbGlwJykge1xuXHRcdGNvbnN0IG1zZyA9IGl0ZW07XG5cdFx0bXNnLm1zZyA9IGAkeyBwYXJhbXMgfSDilKzilIDilKwg44OOKCDjgpwt44Kc44OOKWA7XG5cdFx0TWV0ZW9yLmNhbGwoJ3NlbmRNZXNzYWdlJywgbXNnKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCd1bmZsaXAnLCBVbmZsaXAsIHtcblx0ZGVzY3JpcHRpb246ICdTbGFzaF9UYWJsZVVuZmxpcF9EZXNjcmlwdGlvbicsXG5cdHBhcmFtczogJ3lvdXJfbWVzc2FnZV9vcHRpb25hbCdcbn0pO1xuIl19
