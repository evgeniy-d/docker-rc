(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var OEmbed = Package['rocketchat:oembed'].OEmbed;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:spotify":{"lib":{"spotify.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_spotify/lib/spotify.js                                                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

const process = function (message, source, callback) {
  if (s.trim(source)) {
    // Separate text in code blocks and non code blocks
    const msgParts = source.split(/(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/);

    for (let index = 0; index < msgParts.length; index++) {
      // Verify if this part is code
      const part = msgParts[index];

      if ((part != null ? part.length > 0 : undefined) != null) {
        const codeMatch = part.match(/(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/);

        if (codeMatch == null) {
          callback(message, msgParts, index, part);
        }
      }
    }
  }
};

class Spotify {
  static transform(message) {
    let urls = [];

    if (Array.isArray(message.urls)) {
      urls = urls.concat(message.urls);
    }

    let changed = false;
    process(message, message.msg, function (message, msgParts, index, part) {
      const re = /(?:^|\s)spotify:([^:\s]+):([^:\s]+)(?::([^:\s]+))?(?::(\S+))?(?:\s|$)/g;
      let match;

      while (match = re.exec(part)) {
        const data = _.filter(match.slice(1), value => value != null);

        const path = _.map(data, value => _.escape(value)).join('/');

        const url = `https://open.spotify.com/${path}`;
        urls.push({
          url,
          'source': `spotify:${data.join(':')}`
        });
        changed = true;
      }
    }); // Re-mount message

    if (changed) {
      message.urls = urls;
    }

    return message;
  }

  static render(message) {
    process(message, message.html, function (message, msgParts, index, part) {
      if (Array.isArray(message.urls)) {
        for (const item of Array.from(message.urls)) {
          if (item.source) {
            const quotedSource = item.source.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
            const re = new RegExp(`(^|\\s)${quotedSource}(\\s|$)`, 'g');
            msgParts[index] = part.replace(re, `$1<a href="${item.url}" target="_blank">${item.source}</a>$2`);
          }
        }

        return message.html = msgParts.join('');
      }
    });
    return message;
  }

}

RocketChat.callbacks.add('beforeSaveMessage', Spotify.transform, RocketChat.callbacks.priority.LOW, 'spotify-save');
RocketChat.callbacks.add('renderMessage', Spotify.render, RocketChat.callbacks.priority.MEDIUM, 'spotify-render');
RocketChat.Spotify = Spotify;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:spotify/lib/spotify.js");

/* Exports */
Package._define("rocketchat:spotify");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_spotify.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzcG90aWZ5L2xpYi9zcG90aWZ5LmpzIl0sIm5hbWVzIjpbIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInMiLCJwcm9jZXNzIiwibWVzc2FnZSIsInNvdXJjZSIsImNhbGxiYWNrIiwidHJpbSIsIm1zZ1BhcnRzIiwic3BsaXQiLCJpbmRleCIsImxlbmd0aCIsInBhcnQiLCJ1bmRlZmluZWQiLCJjb2RlTWF0Y2giLCJtYXRjaCIsIlNwb3RpZnkiLCJ0cmFuc2Zvcm0iLCJ1cmxzIiwiQXJyYXkiLCJpc0FycmF5IiwiY29uY2F0IiwiY2hhbmdlZCIsIm1zZyIsInJlIiwiZXhlYyIsImRhdGEiLCJmaWx0ZXIiLCJzbGljZSIsInZhbHVlIiwicGF0aCIsIm1hcCIsImVzY2FwZSIsImpvaW4iLCJ1cmwiLCJwdXNoIiwicmVuZGVyIiwiaHRtbCIsIml0ZW0iLCJmcm9tIiwicXVvdGVkU291cmNlIiwicmVwbGFjZSIsIlJlZ0V4cCIsIlJvY2tldENoYXQiLCJjYWxsYmFja3MiLCJhZGQiLCJwcmlvcml0eSIsIkxPVyIsIk1FRElVTSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLENBQUo7QUFBTUwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFFBQUVELENBQUY7QUFBSTs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7O0FBT3BFLE1BQU1FLFVBQVUsVUFBU0MsT0FBVCxFQUFrQkMsTUFBbEIsRUFBMEJDLFFBQTFCLEVB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QUFiLEVBQWtCLGNBQWNjLEtBQUtKLEdBQUsscUJBQXFCSSxLQUFLakMsTUFBUSxRQUE1RSxDQUFsQjtBQUNBO0FBQ0Q7O0FBQ0QsZUFBT0QsUUFBUWlDLElBQVIsR0FBZTdCLFNBQVN5QixJQUFULENBQWMsRUFBZCxDQUF0QjtBQUNBO0FBQ0QsS0FYRDtBQWFBLFdBQU83QixPQUFQO0FBQ0E7O0FBOUNZOztBQWlEZHVDLFdBQVdDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLG1CQUF6QixFQUE4QzdCLFFBQVFDLFNBQXRELEVBQWlFMEIsV0FBV0MsU0FBWCxDQUFxQkUsUUFBckIsQ0FBOEJDLEdBQS9GLEVBQW9HLGNBQXBHO0FBQ0FKLFdBQVdDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGVBQXpCLEVBQTBDN0IsUUFBUW9CLE1BQWxELEVBQTBETyxXQUFXQyxTQUFYLENBQXFCRSxRQUFyQixDQUE4QkUsTUFBeEYsRUFBZ0csZ0JBQWhHO0FBQ0FMLFdBQVczQixPQUFYLEdBQXFCQSxPQUFyQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3Nwb3RpZnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogU3BvdGlmeSBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCBwcm9jZXNzIFNwb3RpZnkgbGlua3Mgb3Igc3ludGF4ZXMgKGV4OiBzcG90aWZ5OnRyYWNrOjFxNklLMWw0cXBZeWtPYVdhTEprV0cpXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuY29uc3QgcHJvY2VzcyA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHNvdXJjZSwgY2FsbGJhY2spIHtcblx0aWYgKHMudHJpbShzb3VyY2UpKSB7XG5cdFx0Ly8gU2VwYXJhdGUgdGV4dCBpbiBjb2RlIGJsb2NrcyBhbmQgbm9uIGNvZGUgYmxvY2tzXG5cdFx0Y29uc3QgbXNnUGFydHMgPSBzb3VyY2Uuc3BsaXQoLyhgYGBcXHcqW1xcbiBdP1tcXHNcXFNdKj9gYGArPyl8KGAoPzpbXmBdKylgKS8pO1xuXG5cdFx0Zm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG1zZ1BhcnRzLmxlbmd0aDsgaW5kZXgrKykge1xuXHRcdFx0Ly8gVmVyaWZ5IGlmIHRoaXMgcGFydCBpcyBjb2RlXG5cdFx0XHRjb25zdCBwYXJ0ID0gbXNnUGFydHNbaW5kZXhdO1xuXG5cdFx0XHRpZiAoKChwYXJ0ICE9IG51bGwgPyBwYXJ0Lmxlbmd0aCA+IDAgOiB1bmRlZmluZWQpICE9IG51bGwpKSB7XG5cdFx0XHRcdGNvbnN0IGNvZGVNYXRjaCA9IHBhcnQubWF0Y2goLyg/OmBgYChcXHcqKVtcXG4gXT8oW1xcc1xcU10qPylgYGArPyl8KD86YCg/OlteYF0rKWApLyk7XG5cdFx0XHRcdGlmIChjb2RlTWF0Y2ggPT0gbnVsbCkge1xuXHRcdFx0XHRcdGNhbGxiYWNrKG1lc3NhZ2UsIG1zZ1BhcnRzLCBpbmRleCwgcGFydCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG5jbGFzcyBTcG90aWZ5IHtcblx0c3RhdGljIHRyYW5zZm9ybShtZXNzYWdlKSB7XG5cdFx0bGV0IHVybHMgPSBbXTtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlLnVybHMpKSB7XG5cdFx0XHR1cmxzID0gdXJscy5jb25jYXQobWVzc2FnZS51cmxzKTtcblx0XHR9XG5cblx0XHRsZXQgY2hhbmdlZCA9IGZhbHNlO1xuXG5cdFx0cHJvY2VzcyhtZXNzYWdlLCBtZXNzYWdlLm1zZywgZnVuY3Rpb24obWVzc2FnZSwgbXNnUGFydHMsIGluZGV4LCBwYXJ0KSB7XG5cdFx0XHRjb25zdCByZSA9IC8oPzpefFxccylzcG90aWZ5OihbXjpcXHNdKyk6KFteOlxcc10rKSg/OjooW146XFxzXSspKT8oPzo6KFxcUyspKT8oPzpcXHN8JCkvZztcblxuXHRcdFx0bGV0IG1hdGNoO1xuXHRcdFx0d2hpbGUgKChtYXRjaCA9IHJlLmV4ZWMocGFydCkpKSB7XG5cdFx0XHRcdGNvbnN0IGRhdGEgPSBfLmZpbHRlcihtYXRjaC5zbGljZSgxKSwgdmFsdWUgPT4gdmFsdWUgIT0gbnVsbCk7XG5cdFx0XHRcdGNvbnN0IHBhdGggPSBfLm1hcChkYXRhLCB2YWx1ZSA9PiBfLmVzY2FwZSh2YWx1ZSkpLmpvaW4oJy8nKTtcblx0XHRcdFx0Y29uc3QgdXJsID0gYGh0dHBzOi8vb3Blbi5zcG90aWZ5LmNvbS8keyBwYXRoIH1gO1xuXHRcdFx0XHR1cmxzLnB1c2goe3VybCwgJ3NvdXJjZSc6IGBzcG90aWZ5OiR7IGRhdGEuam9pbignOicpIH1gfSk7XG5cdFx0XHRcdGNoYW5nZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0fSk7XG5cblx0XHQvLyBSZS1tb3VudCBtZXNzYWdlXG5cdFx0aWYgKGNoYW5nZWQpIHtcblx0XHRcdG1lc3NhZ2UudXJscyA9IHVybHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRzdGF0aWMgcmVuZGVyKG1lc3NhZ2UpIHtcblx0XHRwcm9jZXNzKG1lc3NhZ2UsIG1lc3NhZ2UuaHRtbCwgZnVuY3Rpb24obWVzc2FnZSwgbXNnUGFydHMsIGluZGV4LCBwYXJ0KSB7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlLnVybHMpKSB7XG5cdFx0XHRcdGZvciAoY29uc3QgaXRlbSBvZiBBcnJheS5mcm9tKG1lc3NhZ2UudXJscykpIHtcblx0XHRcdFx0XHRpZiAoaXRlbS5zb3VyY2UpIHtcblx0XHRcdFx0XHRcdGNvbnN0IHF1b3RlZFNvdXJjZSA9IGl0ZW0uc291cmNlLnJlcGxhY2UoL1tcXFxcXiQuKis/KClbXFxde318XS9nLCAnXFxcXCQmJyk7XG5cdFx0XHRcdFx0XHRjb25zdCByZSA9IG5ldyBSZWdFeHAoYChefFxcXFxzKSR7IHF1b3RlZFNvdXJjZSB9KFxcXFxzfCQpYCwgJ2cnKTtcblx0XHRcdFx0XHRcdG1zZ1BhcnRzW2luZGV4XSA9IHBhcnQucmVwbGFjZShyZSwgYCQxPGEgaHJlZj1cIiR7IGl0ZW0udXJsIH1cIiB0YXJnZXQ9XCJfYmxhbmtcIj4keyBpdGVtLnNvdXJjZSB9PC9hPiQyYCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtZXNzYWdlLmh0bWwgPSBtc2dQYXJ0cy5qb2luKCcnKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYmVmb3JlU2F2ZU1lc3NhZ2UnLCBTcG90aWZ5LnRyYW5zZm9ybSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnc3BvdGlmeS1zYXZlJyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ3JlbmRlck1lc3NhZ2UnLCBTcG90aWZ5LnJlbmRlciwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnc3BvdGlmeS1yZW5kZXInKTtcblJvY2tldENoYXQuU3BvdGlmeSA9IFNwb3RpZnk7XG4iXX0=
