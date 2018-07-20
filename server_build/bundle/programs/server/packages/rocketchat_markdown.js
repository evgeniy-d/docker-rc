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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:markdown":{"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/settings.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
Meteor.startup(() => {
  RocketChat.settings.add('Markdown_Parser', 'original', {
    type: 'select',
    values: [{
      key: 'disabled',
      i18nLabel: 'Disabled'
    }, {
      key: 'original',
      i18nLabel: 'Original'
    }, {
      key: 'marked',
      i18nLabel: 'Marked'
    }],
    group: 'Message',
    section: 'Markdown',
    public: true
  });
  const enableQueryOriginal = {
    _id: 'Markdown_Parser',
    value: 'original'
  };
  RocketChat.settings.add('Markdown_Headers', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryOriginal
  });
  RocketChat.settings.add('Markdown_SupportSchemesForLink', 'http,https', {
    type: 'string',
    group: 'Message',
    section: 'Markdown',
    public: true,
    i18nDescription: 'Markdown_SupportSchemesForLink_Description',
    enableQuery: enableQueryOriginal
  });
  const enableQueryMarked = {
    _id: 'Markdown_Parser',
    value: 'marked'
  };
  RocketChat.settings.add('Markdown_Marked_GFM', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Tables', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Breaks', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Pedantic', false, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: [{
      _id: 'Markdown_Parser',
      value: 'marked'
    }, {
      _id: 'Markdown_Marked_GFM',
      value: false
    }]
  });
  RocketChat.settings.add('Markdown_Marked_SmartLists', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
  RocketChat.settings.add('Markdown_Marked_Smartypants', true, {
    type: 'boolean',
    group: 'Message',
    section: 'Markdown',
    public: true,
    enableQuery: enableQueryMarked
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markdown.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/markdown.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Blaze;
module.watch(require("meteor/blaze"), {
  Blaze(v) {
    Blaze = v;
  }

}, 2);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 3);
let marked;
module.watch(require("./parser/marked/marked.js"), {
  marked(v) {
    marked = v;
  }

}, 4);
let original;
module.watch(require("./parser/original/original.js"), {
  original(v) {
    original = v;
  }

}, 5);
let code;
module.watch(require("./parser/original/code.js"), {
  code(v) {
    code = v;
  }

}, 6);
const parsers = {
  original,
  marked
};

class MarkdownClass {
  parse(text) {
    const message = {
      html: s.escapeHTML(text)
    };
    return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
  }

  parseNotEscaped(text) {
    const message = {
      html: text
    };
    return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
  }

  parseMessageNotEscaped(message) {
    const parser = RocketChat.settings.get('Markdown_Parser');

    if (parser === 'disabled') {
      return message;
    }

    if (typeof parsers[parser] === 'function') {
      return parsers[parser](message);
    }

    return parsers['original'](message);
  }

  mountTokensBack(message, useHtml = true) {
    if (message.tokens && message.tokens.length > 0) {
      for (const _ref of message.tokens) {
        const {
          token,
          text,
          noHtml
        } = _ref;
        message.html = message.html.replace(token, () => useHtml ? text : noHtml); // Uses lambda so doesn't need to escape $
      }
    }

    return message;
  }

  code(...args) {
    return code(...args);
  }

}

const Markdown = new MarkdownClass();
RocketChat.Markdown = Markdown; // renderMessage already did html escape

const MarkdownMessage = message => {
  if (s.trim(message != null ? message.html : undefined)) {
    message = Markdown.parseMessageNotEscaped(message);
  }

  return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
  Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
  Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parser":{"marked":{"marked.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/marked/marked.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  marked: () => marked
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);
let hljs;
module.watch(require("highlight.js"), {
  default(v) {
    hljs = v;
  }

}, 4);

let _marked;

module.watch(require("marked"), {
  default(v) {
    _marked = v;
  }

}, 5);
const renderer = new _marked.Renderer();
let msg = null;

renderer.code = function (code, lang, escaped) {
  if (this.options.highlight) {
    const out = this.options.highlight(code, lang);

    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  let text = null;

  if (!lang) {
    text = `<pre><code class="code-colors hljs">${escaped ? code : s.escapeHTML(code, true)}</code></pre>`;
  } else {
    text = `<pre><code class="code-colors hljs ${escape(lang, true)}">${escaped ? code : s.escapeHTML(code, true)}</code></pre>`;
  }

  if (_.isString(msg)) {
    return text;
  }

  const token = `=!=${Random.id()}=!=`;
  msg.tokens.push({
    highlight: true,
    token,
    text
  });
  return token;
};

renderer.codespan = function (text) {
  text = `<code class="code-colors inline">${text}</code>`;

  if (_.isString(msg)) {
    return text;
  }

  const token = `=!=${Random.id()}=!=`;
  msg.tokens.push({
    token,
    text
  });
  return token;
};

renderer.blockquote = function (quote) {
  return `<blockquote class="background-transparent-darker-before">${quote}</blockquote>`;
};

const highlight = function (code, lang) {
  if (!lang) {
    return code;
  }

  try {
    return hljs.highlight(lang, code).value;
  } catch (e) {
    // Unknown language
    return code;
  }
};

let gfm = null;
let tables = null;
let breaks = null;
let pedantic = null;
let smartLists = null;
let smartypants = null;

const marked = message => {
  msg = message;

  if (!msg.tokens) {
    msg.tokens = [];
  }

  if (gfm == null) {
    gfm = RocketChat.settings.get('Markdown_Marked_GFM');
  }

  if (tables == null) {
    tables = RocketChat.settings.get('Markdown_Marked_Tables');
  }

  if (breaks == null) {
    breaks = RocketChat.settings.get('Markdown_Marked_Breaks');
  }

  if (pedantic == null) {
    pedantic = RocketChat.settings.get('Markdown_Marked_Pedantic');
  }

  if (smartLists == null) {
    smartLists = RocketChat.settings.get('Markdown_Marked_SmartLists');
  }

  if (smartypants == null) {
    smartypants = RocketChat.settings.get('Markdown_Marked_Smartypants');
  }

  msg.html = _marked(s.unescapeHTML(msg.html), {
    gfm,
    tables,
    breaks,
    pedantic,
    smartLists,
    smartypants,
    renderer,
    sanitize: true,
    highlight
  });
  return msg;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"original":{"code.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/code.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  code: () => code
});
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let hljs;
module.watch(require("highlight.js"), {
  default(v) {
    hljs = v;
  }

}, 2);

const inlinecode = message => {
  // Support `text`
  return message.html = message.html.replace(/\`([^`\r\n]+)\`([<_*~]|\B|\b|$)/gm, (match, p1, p2) => {
    const token = ` =!=${Random.id()}=!=`;
    message.tokens.push({
      token,
      text: `<span class=\"copyonly\">\`</span><span><code class=\"code-colors inline\">${p1}</code></span><span class=\"copyonly\">\`</span>${p2}`,
      noHtml: match
    });
    return token;
  });
};

const codeblocks = message => {
  // Count occurencies of ```
  const count = (message.html.match(/```/g) || []).length;

  if (count) {
    // Check if we need to add a final ```
    if (count % 2 > 0) {
      message.html = `${message.html}\n\`\`\``;
      message.msg = `${message.msg}\n\`\`\``;
    } // Separate text in code blocks and non code blocks


    const msgParts = message.html.split(/(^.*)(```(?:[a-zA-Z]+)?(?:(?:.|\r|\n)*?)```)(.*\n?)$/gm);

    for (let index = 0; index < msgParts.length; index++) {
      // Verify if this part is code
      const part = msgParts[index];
      const codeMatch = part.match(/^```[\r\n]*(.*[\r\n\ ]?)[\r\n]*([\s\S]*?)```+?$/);

      if (codeMatch != null) {
        // Process highlight if this part is code
        const singleLine = codeMatch[0].indexOf('\n') === -1;
        const lang = !singleLine && Array.from(hljs.listLanguages()).includes(s.trim(codeMatch[1])) ? s.trim(codeMatch[1]) : '';
        const code = singleLine ? s.unescapeHTML(codeMatch[1]) : lang === '' ? s.unescapeHTML(codeMatch[1] + codeMatch[2]) : s.unescapeHTML(codeMatch[2]);
        const result = lang === '' ? hljs.highlightAuto(lang + code) : hljs.highlight(lang, code);
        const token = `=!=${Random.id()}=!=`;
        message.tokens.push({
          highlight: true,
          token,
          text: `<pre><code class='code-colors hljs ${result.language}'><span class='copyonly'>\`\`\`<br></span>${result.value}<span class='copyonly'><br>\`\`\`</span></code></pre>`,
          noHtml: codeMatch[0]
        });
        msgParts[index] = token;
      } else {
        msgParts[index] = part;
      }
    } // Re-mount message


    return message.html = msgParts.join('');
  }
};

const code = message => {
  if (s.trim(message.html)) {
    if (message.tokens == null) {
      message.tokens = [];
    }

    codeblocks(message);
    inlinecode(message);
  }

  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markdown.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/markdown.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  markdown: () => markdown
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 1);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 2);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 3);

const parseNotEscaped = function (msg, message) {
  if (message && message.tokens == null) {
    message.tokens = [];
  }

  const addAsToken = function (html) {
    const token = `=!=${Random.id()}=!=`;
    message.tokens.push({
      token,
      text: html
    });
    return token;
  };

  const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|');

  if (RocketChat.settings.get('Markdown_Headers')) {
    // Support # Text for h1
    msg = msg.replace(/^# (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h1>$1</h1>'); // Support # Text for h2

    msg = msg.replace(/^## (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h2>$1</h2>'); // Support # Text for h3

    msg = msg.replace(/^### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h3>$1</h3>'); // Support # Text for h4

    msg = msg.replace(/^#### (([\S\w\d-_\/\*\.,\\][ \u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]?)+)/gm, '<h4>$1</h4>');
  } // Support *text* to make bold


  msg = msg.replace(/(^|&gt;|[ >_~`])\*{1,2}([^\*\r\n]+)\*{1,2}([<_~`]|\B|\b|$)/gm, '$1<span class="copyonly">*</span><strong>$2</strong><span class="copyonly">*</span>$3'); // Support _text_ to make italics

  msg = msg.replace(/(^|&gt;|[ >*~`])\_{1,2}([^\_\r\n]+)\_{1,2}([<*~`]|\B|\b|$)/gm, '$1<span class="copyonly">_</span><em>$2</em><span class="copyonly">_</span>$3'); // Support ~text~ to strike through text

  msg = msg.replace(/(^|&gt;|[ >_*`])\~{1,2}([^~\r\n]+)\~{1,2}([<_*`]|\B|\b|$)/gm, '$1<span class="copyonly">~</span><strike>$2</strike><span class="copyonly">~</span>$3'); // Support for block quote
  // >>>
  // Text
  // <<<

  msg = msg.replace(/(?:&gt;){3}\n+([\s\S]*?)\n+(?:&lt;){3}/g, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;&gt;&gt;</span>$1<span class="copyonly">&lt;&lt;&lt;</span></blockquote>'); // Support >Text for quote

  msg = msg.replace(/^&gt;(.*)$/gm, '<blockquote class="background-transparent-darker-before"><span class="copyonly">&gt;</span>$1</blockquote>'); // Remove white-space around blockquote (prevent <br>). Because blockquote is block element.

  msg = msg.replace(/\s*<blockquote class="background-transparent-darker-before">/gm, '<blockquote class="background-transparent-darker-before">');
  msg = msg.replace(/<\/blockquote>\s*/gm, '</blockquote>'); // Remove new-line between blockquotes.

  msg = msg.replace(/<\/blockquote>\n<blockquote/gm, '</blockquote><blockquote'); // Support ![alt text](http://image url)

  msg = msg.replace(new RegExp(`!\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\)]+)\\)`, 'gm'), (match, title, url) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" title="${s.escapeHTML(title)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer"><div class="inline-image" style="background-image: url(${s.escapeHTML(url)});"></div></a>`);
  }); // Support [Text](http://link)

  msg = msg.replace(new RegExp(`\\[([^\\]]+)\\]\\(((?:${schemes}):\\/\\/[^\\)]+)\\)`, 'gm'), (match, title, url) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer">${s.escapeHTML(title)}</a>`);
  }); // Support <http://link|Text>

  msg = msg.replace(new RegExp(`(?:<|&lt;)((?:${schemes}):\\/\\/[^\\|]+)\\|(.+?)(?=>|&gt;)(?:>|&gt;)`, 'gm'), (match, url, title) => {
    const target = url.indexOf(Meteor.absoluteUrl()) === 0 ? '' : '_blank';
    return addAsToken(`<a href="${s.escapeHTML(url)}" target="${s.escapeHTML(target)}" rel="noopener noreferrer">${s.escapeHTML(title)}</a>`);
  });
  return msg;
};

const markdown = function (message) {
  message.html = parseNotEscaped(message.html, message);
  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"original.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_markdown/parser/original/original.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  original: () => original
});
let markdown;
module.watch(require("./markdown.js"), {
  markdown(v) {
    markdown = v;
  }

}, 0);
let code;
module.watch(require("./code.js"), {
  code(v) {
    code = v;
  }

}, 1);

const original = message => {
  // Parse markdown code
  message = code(message); // Parse markdown

  message = markdown(message); // Replace linebreak to br

  message.html = message.html.replace(/\n/gm, '<br>');
  return message;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:markdown/settings.js");
var exports = require("/node_modules/meteor/rocketchat:markdown/markdown.js");

/* Exports */
Package._define("rocketchat:markdown", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_markdown.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9tYXJrZG93bi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvbWFya2VkL21hcmtlZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvb3JpZ2luYWwvY29kZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptYXJrZG93bi9wYXJzZXIvb3JpZ2luYWwvbWFya2Rvd24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWFya2Rvd24vcGFyc2VyL29yaWdpbmFsL29yaWdpbmFsLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJSb2NrZXRDaGF0Iiwic3RhcnR1cCIsInNldHRpbmdzIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImdyb3VwIiwic2VjdGlvbiIsInB1YmxpYyIsImVuYWJsZVF1ZXJ5T3JpZ2luYWwiLCJfaWQiLCJ2YWx1ZSIsImVuYWJsZVF1ZXJ5IiwiaTE4bkRlc2NyaXB0aW9uIiwiZW5hYmxlUXVlcnlNYXJrZWQiLCJzIiwiZGVmYXVsdCIsIkJsYXplIiwibWFya2VkIiwib3JpZ2luYWwiLCJjb2RlIiwicGFyc2VycyIsIk1hcmtkb3duQ2xhc3MiLCJwYXJzZSIsInRleHQiLCJtZXNzYWdlIiwiaHRtbCIsImVzY2FwZUhUTUwiLCJtb3VudFRva2Vuc0JhY2siLCJwYXJzZU1lc3NhZ2VOb3RFc2NhcGVkIiwicGFyc2VOb3RFc2NhcGVkIiwicGFyc2VyIiwiZ2V0IiwidXNlSHRtbCIsInRva2VucyIsImxlbmd0aCIsInRva2VuIiwibm9IdG1sIiwicmVwbGFjZSIsImFyZ3MiLCJNYXJrZG93biIsIk1hcmtkb3duTWVzc2FnZSIsInRyaW0iLCJ1bmRlZmluZWQiLCJjYWxsYmFja3MiLCJwcmlvcml0eSIsIkhJR0giLCJpc0NsaWVudCIsInJlZ2lzdGVySGVscGVyIiwiZXhwb3J0IiwiUmFuZG9tIiwiXyIsImhsanMiLCJfbWFya2VkIiwicmVuZGVyZXIiLCJSZW5kZXJlciIsIm1zZyIsImxhbmciLCJlc2NhcGVkIiwib3B0aW9ucyIsImhpZ2hsaWdodCIsIm91dCIsImVzY2FwZSIsImlzU3RyaW5nIiwiaWQiLCJwdXNoIiwiY29kZXNwYW4iLCJibG9ja3F1b3RlIiwicXVvdGUiLCJlIiwiZ2ZtIiwidGFibGVzIiwiYnJlYWtzIiwicGVkYW50aWMiLCJzbWFydExpc3RzIiwic21hcnR5cGFudHMiLCJ1bmVzY2FwZUhUTUwiLCJzYW5pdGl6ZSIsImlubGluZWNvZGUiLCJtYXRjaCIsInAxIiwicDIiLCJjb2RlYmxvY2tzIiwiY291bnQiLCJtc2dQYXJ0cyIsInNwbGl0IiwiaW5kZXgiLCJwYXJ0IiwiY29kZU1hdGNoIiwic2luZ2xlTGluZSIsImluZGV4T2YiLCJBcnJheSIsImZyb20iLCJsaXN0TGFuZ3VhZ2VzIiwiaW5jbHVkZXMiLCJyZXN1bHQiLCJoaWdobGlnaHRBdXRvIiwibGFuZ3VhZ2UiLCJqb2luIiwibWFya2Rvd24iLCJhZGRBc1Rva2VuIiwic2NoZW1lcyIsIlJlZ0V4cCIsInRpdGxlIiwidXJsIiwidGFyZ2V0IiwiYWJzb2x1dGVVcmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0gsU0FBT0ksQ0FBUCxFQUFTO0FBQUNKLGFBQU9JLENBQVA7QUFBUzs7QUFBcEIsQ0FBdEMsRUFBNEQsQ0FBNUQ7QUFBK0QsSUFBSUMsVUFBSjtBQUFlSixPQUFPQyxLQUFQLENBQWFD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K0JBQStCMUYsRUFBRVksVUFBRixDQUFhNEUsS0FBYixDQUFxQixNQUFsSSxDQUFQO0FBQ0EsR0FISyxDQUFOO0FBS0EsU0FBTy9DLEdBQVA7QUFDQSxDQTNFRDs7QUE2RU8sTUFBTTJDLFdBQVcsVUFBUzFFLE9BQVQsRUFBa0I7QUFDekNBLFVBQVFDLElBQVIsR0FBZUksZ0JBQWdCTCxRQUFRQyxJQUF4QixFQUE4QkQsT0FBOUIsQ0FBZjtBQUNBLFNBQU9BLE9BQVA7QUFDQSxDQUhNLEM7Ozs7Ozs7Ozs7O0FDdEZQL0IsT0FBT3VELE1BQVAsQ0FBYztBQUFDOUIsWUFBUyxNQUFJQTtBQUFkLENBQWQ7QUFBdUMsSUFBSWdGLFFBQUo7QUFBYXpHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ3VHLFdBQVN0RyxDQUFULEVBQVc7QUFBQ3NHLGVBQVN0RyxDQUFUO0FBQVc7O0FBQXhCLENBQXRDLEVBQWdFLENBQWhFO0FBQW1FLElBQUl1QixJQUFKO0FBQVMxQixPQUFPQyxLQUFQLENBQWFDLFFBQVEsV0FBUixDQUFiLEVBQWtDO0FBQUN3QixPQUFLdkIsQ0FBTCxFQUFPO0FBQUN1QixXQUFLdkIsQ0FBTDtBQUFPOztBQUFoQixDQUFsQyxFQUFvRCxDQUFwRDs7QUFPekgsTUFBTXNCLFdBQVlNLE9BQUQsSUFBYTtBQUNwQztBQUNBQSxZQUFVTCxLQUFLSyxPQUFMLENBQVYsQ0FGb0MsQ0FJcEM7O0FBQ0FBLFlBQVUwRSxTQUFTMUUsT0FBVCxDQUFWLENBTG9DLENBT3BDOztBQUNBQSxVQUFRQyxJQUFSLEdBQWVELFFBQVFDLElBQVIsQ0FBYVksT0FBYixDQUFxQixNQUFyQixFQUE2QixNQUE3QixDQUFmO0FBRUEsU0FBT2IsT0FBUDtBQUNBLENBWE0sQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9tYXJrZG93bi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX1BhcnNlcicsICdvcmlnaW5hbCcsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHR2YWx1ZXM6IFt7XG5cdFx0XHRrZXk6ICdkaXNhYmxlZCcsXG5cdFx0XHRpMThuTGFiZWw6ICdEaXNhYmxlZCdcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdvcmlnaW5hbCcsXG5cdFx0XHRpMThuTGFiZWw6ICdPcmlnaW5hbCdcblx0XHR9LCB7XG5cdFx0XHRrZXk6ICdtYXJrZWQnLFxuXHRcdFx0aTE4bkxhYmVsOiAnTWFya2VkJ1xuXHRcdH1dLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0Y29uc3QgZW5hYmxlUXVlcnlPcmlnaW5hbCA9IHtfaWQ6ICdNYXJrZG93bl9QYXJzZXInLCB2YWx1ZTogJ29yaWdpbmFsJ307XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9IZWFkZXJzJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlPcmlnaW5hbFxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX1N1cHBvcnRTY2hlbWVzRm9yTGluaycsICdodHRwLGh0dHBzJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnTWFya2Rvd25fU3VwcG9ydFNjaGVtZXNGb3JMaW5rX0Rlc2NyaXB0aW9uJyxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlPcmlnaW5hbFxuXHR9KTtcblxuXHRjb25zdCBlbmFibGVRdWVyeU1hcmtlZCA9IHtfaWQ6ICdNYXJrZG93bl9QYXJzZXInLCB2YWx1ZTogJ21hcmtlZCd9O1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fTWFya2VkX0dGTScsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogZW5hYmxlUXVlcnlNYXJrZWRcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNYXJrZG93bl9NYXJrZWRfVGFibGVzJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU1hcmtlZFxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01hcmtkb3duX01hcmtlZF9CcmVha3MnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IGVuYWJsZVF1ZXJ5TWFya2VkXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fTWFya2VkX1BlZGFudGljJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdNZXNzYWdlJyxcblx0XHRzZWN0aW9uOiAnTWFya2Rvd24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdF9pZDogJ01hcmtkb3duX1BhcnNlcicsXG5cdFx0XHR2YWx1ZTogJ21hcmtlZCdcblx0XHR9LCB7XG5cdFx0XHRfaWQ6ICdNYXJrZG93bl9NYXJrZWRfR0ZNJyxcblx0XHRcdHZhbHVlOiBmYWxzZVxuXHRcdH1dXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fTWFya2VkX1NtYXJ0TGlzdHMnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTWVzc2FnZScsXG5cdFx0c2VjdGlvbjogJ01hcmtkb3duJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IGVuYWJsZVF1ZXJ5TWFya2VkXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTWFya2Rvd25fTWFya2VkX1NtYXJ0eXBhbnRzJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdHNlY3Rpb246ICdNYXJrZG93bicsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGVuYWJsZVF1ZXJ5OiBlbmFibGVRdWVyeU1hcmtlZFxuXHR9KTtcbn0pO1xuIiwiLypcbiAqIE1hcmtkb3duIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHBhcnNlIG1hcmtkb3duIHN5bnRheFxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiAqL1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBCbGF6ZSB9IGZyb20gJ21ldGVvci9ibGF6ZSc7XG5pbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuaW1wb3J0IHsgbWFya2VkIH0gZnJvbSAnLi9wYXJzZXIvbWFya2VkL21hcmtlZC5qcyc7XG5pbXBvcnQgeyBvcmlnaW5hbCB9IGZyb20gJy4vcGFyc2VyL29yaWdpbmFsL29yaWdpbmFsLmpzJztcblxuaW1wb3J0IHsgY29kZSB9IGZyb20gJy4vcGFyc2VyL29yaWdpbmFsL2NvZGUuanMnO1xuXG5jb25zdCBwYXJzZXJzID0ge1xuXHRvcmlnaW5hbCxcblx0bWFya2VkXG59O1xuXG5jbGFzcyBNYXJrZG93bkNsYXNzIHtcblx0cGFyc2UodGV4dCkge1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHRodG1sOiBzLmVzY2FwZUhUTUwodGV4dClcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLm1vdW50VG9rZW5zQmFjayh0aGlzLnBhcnNlTWVzc2FnZU5vdEVzY2FwZWQobWVzc2FnZSkpLmh0bWw7XG5cdH1cblxuXHRwYXJzZU5vdEVzY2FwZWQodGV4dCkge1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHRodG1sOiB0ZXh0XG5cdFx0fTtcblx0XHRyZXR1cm4gdGhpcy5tb3VudFRva2Vuc0JhY2sodGhpcy5wYXJzZU1lc3NhZ2VOb3RFc2NhcGVkKG1lc3NhZ2UpKS5odG1sO1xuXHR9XG5cblx0cGFyc2VNZXNzYWdlTm90RXNjYXBlZChtZXNzYWdlKSB7XG5cdFx0Y29uc3QgcGFyc2VyID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX1BhcnNlcicpO1xuXG5cdFx0aWYgKHBhcnNlciA9PT0gJ2Rpc2FibGVkJykge1xuXHRcdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwYXJzZXJzW3BhcnNlcl0gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiBwYXJzZXJzW3BhcnNlcl0obWVzc2FnZSk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJzZXJzWydvcmlnaW5hbCddKG1lc3NhZ2UpO1xuXHR9XG5cblx0bW91bnRUb2tlbnNCYWNrKG1lc3NhZ2UsIHVzZUh0bWwgPSB0cnVlKSB7XG5cdFx0aWYgKG1lc3NhZ2UudG9rZW5zICYmIG1lc3NhZ2UudG9rZW5zLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3Qge3Rva2VuLCB0ZXh0LCBub0h0bWx9IG9mIG1lc3NhZ2UudG9rZW5zKSB7XG5cdFx0XHRcdG1lc3NhZ2UuaHRtbCA9IG1lc3NhZ2UuaHRtbC5yZXBsYWNlKHRva2VuLCAoKSA9PiB1c2VIdG1sID8gdGV4dCA6IG5vSHRtbCk7IC8vIFVzZXMgbGFtYmRhIHNvIGRvZXNuJ3QgbmVlZCB0byBlc2NhcGUgJFxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Y29kZSguLi5hcmdzKSB7XG5cdFx0cmV0dXJuIGNvZGUoLi4uYXJncyk7XG5cdH1cbn1cblxuY29uc3QgTWFya2Rvd24gPSBuZXcgTWFya2Rvd25DbGFzcztcblJvY2tldENoYXQuTWFya2Rvd24gPSBNYXJrZG93bjtcblxuLy8gcmVuZGVyTWVzc2FnZSBhbHJlYWR5IGRpZCBodG1sIGVzY2FwZVxuY29uc3QgTWFya2Rvd25NZXNzYWdlID0gKG1lc3NhZ2UpID0+IHtcblx0aWYgKHMudHJpbShtZXNzYWdlICE9IG51bGwgPyBtZXNzYWdlLmh0bWwgOiB1bmRlZmluZWQpKSB7XG5cdFx0bWVzc2FnZSA9IE1hcmtkb3duLnBhcnNlTWVzc2FnZU5vdEVzY2FwZWQobWVzc2FnZSk7XG5cdH1cblxuXHRyZXR1cm4gbWVzc2FnZTtcbn07XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgncmVuZGVyTWVzc2FnZScsIE1hcmtkb3duTWVzc2FnZSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuSElHSCwgJ21hcmtkb3duJyk7XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcblx0QmxhemUucmVnaXN0ZXJIZWxwZXIoJ1JvY2tldENoYXRNYXJrZG93bicsIHRleHQgPT4gTWFya2Rvd24ucGFyc2UodGV4dCkpO1xuXHRCbGF6ZS5yZWdpc3RlckhlbHBlcignUm9ja2V0Q2hhdE1hcmtkb3duVW5lc2NhcGUnLCB0ZXh0ID0+IE1hcmtkb3duLnBhcnNlTm90RXNjYXBlZCh0ZXh0KSk7XG59XG4iLCJpbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcbmltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMnO1xuaW1wb3J0IF9tYXJrZWQgZnJvbSAnbWFya2VkJztcblxuY29uc3QgcmVuZGVyZXIgPSBuZXcgX21hcmtlZC5SZW5kZXJlcigpO1xuXG5sZXQgbXNnID0gbnVsbDtcblxucmVuZGVyZXIuY29kZSA9IGZ1bmN0aW9uKGNvZGUsIGxhbmcsIGVzY2FwZWQpIHtcblx0aWYgKHRoaXMub3B0aW9ucy5oaWdobGlnaHQpIHtcblx0XHRjb25zdCBvdXQgPSB0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KGNvZGUsIGxhbmcpO1xuXHRcdGlmIChvdXQgIT0gbnVsbCAmJiBvdXQgIT09IGNvZGUpIHtcblx0XHRcdGVzY2FwZWQgPSB0cnVlO1xuXHRcdFx0Y29kZSA9IG91dDtcblx0XHR9XG5cdH1cblxuXHRsZXQgdGV4dCA9IG51bGw7XG5cblx0aWYgKCFsYW5nKSB7XG5cdFx0dGV4dCA9IGA8cHJlPjxjb2RlIGNsYXNzPVwiY29kZS1jb2xvcnMgaGxqc1wiPiR7IChlc2NhcGVkID8gY29kZSA6IHMuZXNjYXBlSFRNTChjb2RlLCB0cnVlKSkgfTwvY29kZT48L3ByZT5gO1xuXHR9IGVsc2Uge1xuXHRcdHRleHQgPSBgPHByZT48Y29kZSBjbGFzcz1cImNvZGUtY29sb3JzIGhsanMgJHsgZXNjYXBlKGxhbmcsIHRydWUpIH1cIj4keyAoZXNjYXBlZCA/IGNvZGUgOiBzLmVzY2FwZUhUTUwoY29kZSwgdHJ1ZSkpIH08L2NvZGU+PC9wcmU+YDtcblx0fVxuXG5cdGlmIChfLmlzU3RyaW5nKG1zZykpIHtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxuXG5cdGNvbnN0IHRva2VuID0gYD0hPSR7IFJhbmRvbS5pZCgpIH09IT1gO1xuXHRtc2cudG9rZW5zLnB1c2goe1xuXHRcdGhpZ2hsaWdodDogdHJ1ZSxcblx0XHR0b2tlbixcblx0XHR0ZXh0XG5cdH0pO1xuXG5cdHJldHVybiB0b2tlbjtcbn07XG5cbnJlbmRlcmVyLmNvZGVzcGFuID0gZnVuY3Rpb24odGV4dCkge1xuXHR0ZXh0ID0gYDxjb2RlIGNsYXNzPVwiY29kZS1jb2xvcnMgaW5saW5lXCI+JHsgdGV4dCB9PC9jb2RlPmA7XG5cdGlmIChfLmlzU3RyaW5nKG1zZykpIHtcblx0XHRyZXR1cm4gdGV4dDtcblx0fVxuXG5cdGNvbnN0IHRva2VuID0gYD0hPSR7IFJhbmRvbS5pZCgpIH09IT1gO1xuXHRtc2cudG9rZW5zLnB1c2goe1xuXHRcdHRva2VuLFxuXHRcdHRleHRcblx0fSk7XG5cblx0cmV0dXJuIHRva2VuO1xufTtcblxucmVuZGVyZXIuYmxvY2txdW90ZSA9IGZ1bmN0aW9uKHF1b3RlKSB7XG5cdHJldHVybiBgPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj4keyBxdW90ZSB9PC9ibG9ja3F1b3RlPmA7XG59O1xuXG5jb25zdCBoaWdobGlnaHQgPSBmdW5jdGlvbihjb2RlLCBsYW5nKSB7XG5cdGlmICghbGFuZykge1xuXHRcdHJldHVybiBjb2RlO1xuXHR9XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGhsanMuaGlnaGxpZ2h0KGxhbmcsIGNvZGUpLnZhbHVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gVW5rbm93biBsYW5ndWFnZVxuXHRcdHJldHVybiBjb2RlO1xuXHR9XG59O1xuXG5sZXQgZ2ZtID0gbnVsbDtcbmxldCB0YWJsZXMgPSBudWxsO1xubGV0IGJyZWFrcyA9IG51bGw7XG5sZXQgcGVkYW50aWMgPSBudWxsO1xubGV0IHNtYXJ0TGlzdHMgPSBudWxsO1xubGV0IHNtYXJ0eXBhbnRzID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IG1hcmtlZCA9IChtZXNzYWdlKSA9PiB7XG5cdG1zZyA9IG1lc3NhZ2U7XG5cblx0aWYgKCFtc2cudG9rZW5zKSB7XG5cdFx0bXNnLnRva2VucyA9IFtdO1xuXHR9XG5cblx0aWYgKGdmbSA9PSBudWxsKSB7IGdmbSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfR0ZNJyk7IH1cblx0aWYgKHRhYmxlcyA9PSBudWxsKSB7IHRhYmxlcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfVGFibGVzJyk7IH1cblx0aWYgKGJyZWFrcyA9PSBudWxsKSB7IGJyZWFrcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9NYXJrZWRfQnJlYWtzJyk7IH1cblx0aWYgKHBlZGFudGljID09IG51bGwpIHsgcGVkYW50aWMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fTWFya2VkX1BlZGFudGljJyk7IH1cblx0aWYgKHNtYXJ0TGlzdHMgPT0gbnVsbCkgeyBzbWFydExpc3RzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX01hcmtlZF9TbWFydExpc3RzJyk7IH1cblx0aWYgKHNtYXJ0eXBhbnRzID09IG51bGwpIHsgc21hcnR5cGFudHMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWFya2Rvd25fTWFya2VkX1NtYXJ0eXBhbnRzJyk7IH1cblxuXHRtc2cuaHRtbCA9IF9tYXJrZWQocy51bmVzY2FwZUhUTUwobXNnLmh0bWwpLCB7XG5cdFx0Z2ZtLFxuXHRcdHRhYmxlcyxcblx0XHRicmVha3MsXG5cdFx0cGVkYW50aWMsXG5cdFx0c21hcnRMaXN0cyxcblx0XHRzbWFydHlwYW50cyxcblx0XHRyZW5kZXJlcixcblx0XHRzYW5pdGl6ZTogdHJ1ZSxcblx0XHRoaWdobGlnaHRcblx0fSk7XG5cblx0cmV0dXJuIG1zZztcbn07XG4iLCIvKlxuICogY29kZSgpIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHBhcnNlIGBpbmxpbmUgY29kZWAgYW5kIGBgYGNvZGVibG9ja2BgYCBzeW50YXhlc1xuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiAqL1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMnO1xuXG5jb25zdCBpbmxpbmVjb2RlID0gKG1lc3NhZ2UpID0+IHtcblx0Ly8gU3VwcG9ydCBgdGV4dGBcblx0cmV0dXJuIG1lc3NhZ2UuaHRtbCA9IG1lc3NhZ2UuaHRtbC5yZXBsYWNlKC9cXGAoW15gXFxyXFxuXSspXFxgKFs8Xyp+XXxcXEJ8XFxifCQpL2dtLCAobWF0Y2gsIHAxLCBwMikgPT4ge1xuXHRcdGNvbnN0IHRva2VuID0gYCA9IT0keyBSYW5kb20uaWQoKSB9PSE9YDtcblxuXHRcdG1lc3NhZ2UudG9rZW5zLnB1c2goe1xuXHRcdFx0dG9rZW4sXG5cdFx0XHR0ZXh0OiBgPHNwYW4gY2xhc3M9XFxcImNvcHlvbmx5XFxcIj5cXGA8L3NwYW4+PHNwYW4+PGNvZGUgY2xhc3M9XFxcImNvZGUtY29sb3JzIGlubGluZVxcXCI+JHsgcDEgfTwvY29kZT48L3NwYW4+PHNwYW4gY2xhc3M9XFxcImNvcHlvbmx5XFxcIj5cXGA8L3NwYW4+JHsgcDIgfWAsXG5cdFx0XHRub0h0bWw6IG1hdGNoXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdG9rZW47XG5cdH0pO1xufTtcblxuY29uc3QgY29kZWJsb2NrcyA9IChtZXNzYWdlKSA9PiB7XG5cdC8vIENvdW50IG9jY3VyZW5jaWVzIG9mIGBgYFxuXHRjb25zdCBjb3VudCA9IChtZXNzYWdlLmh0bWwubWF0Y2goL2BgYC9nKSB8fCBbXSkubGVuZ3RoO1xuXG5cdGlmIChjb3VudCkge1xuXG5cdFx0Ly8gQ2hlY2sgaWYgd2UgbmVlZCB0byBhZGQgYSBmaW5hbCBgYGBcblx0XHRpZiAoKGNvdW50ICUgMikgPiAwKSB7XG5cdFx0XHRtZXNzYWdlLmh0bWwgPSBgJHsgbWVzc2FnZS5odG1sIH1cXG5cXGBcXGBcXGBgO1xuXHRcdFx0bWVzc2FnZS5tc2cgPSBgJHsgbWVzc2FnZS5tc2cgfVxcblxcYFxcYFxcYGA7XG5cdFx0fVxuXG5cdFx0Ly8gU2VwYXJhdGUgdGV4dCBpbiBjb2RlIGJsb2NrcyBhbmQgbm9uIGNvZGUgYmxvY2tzXG5cdFx0Y29uc3QgbXNnUGFydHMgPSBtZXNzYWdlLmh0bWwuc3BsaXQoLyheLiopKGBgYCg/OlthLXpBLVpdKyk/KD86KD86LnxcXHJ8XFxuKSo/KWBgYCkoLipcXG4/KSQvZ20pO1xuXG5cdFx0Zm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG1zZ1BhcnRzLmxlbmd0aDsgaW5kZXgrKykge1xuXHRcdFx0Ly8gVmVyaWZ5IGlmIHRoaXMgcGFydCBpcyBjb2RlXG5cdFx0XHRjb25zdCBwYXJ0ID0gbXNnUGFydHNbaW5kZXhdO1xuXHRcdFx0Y29uc3QgY29kZU1hdGNoID0gcGFydC5tYXRjaCgvXmBgYFtcXHJcXG5dKiguKltcXHJcXG5cXCBdPylbXFxyXFxuXSooW1xcc1xcU10qPylgYGArPyQvKTtcblxuXHRcdFx0aWYgKGNvZGVNYXRjaCAhPSBudWxsKSB7XG5cdFx0XHRcdC8vIFByb2Nlc3MgaGlnaGxpZ2h0IGlmIHRoaXMgcGFydCBpcyBjb2RlXG5cdFx0XHRcdGNvbnN0IHNpbmdsZUxpbmUgPSBjb2RlTWF0Y2hbMF0uaW5kZXhPZignXFxuJykgPT09IC0xO1xuXHRcdFx0XHRjb25zdCBsYW5nID0gIXNpbmdsZUxpbmUgJiYgQXJyYXkuZnJvbShobGpzLmxpc3RMYW5ndWFnZXMoKSkuaW5jbHVkZXMocy50cmltKGNvZGVNYXRjaFsxXSkpID8gcy50cmltKGNvZGVNYXRjaFsxXSkgOiAnJztcblx0XHRcdFx0Y29uc3QgY29kZSA9XG5cdFx0XHRcdFx0c2luZ2xlTGluZSA/XG5cdFx0XHRcdFx0XHRzLnVuZXNjYXBlSFRNTChjb2RlTWF0Y2hbMV0pIDpcblx0XHRcdFx0XHRcdGxhbmcgPT09ICcnID9cblx0XHRcdFx0XHRcdFx0cy51bmVzY2FwZUhUTUwoY29kZU1hdGNoWzFdICsgY29kZU1hdGNoWzJdKSA6XG5cdFx0XHRcdFx0XHRcdHMudW5lc2NhcGVIVE1MKGNvZGVNYXRjaFsyXSk7XG5cblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gbGFuZyA9PT0gJycgPyBobGpzLmhpZ2hsaWdodEF1dG8oKGxhbmcgKyBjb2RlKSkgOiBobGpzLmhpZ2hsaWdodChsYW5nLCBjb2RlKTtcblx0XHRcdFx0Y29uc3QgdG9rZW4gPSBgPSE9JHsgUmFuZG9tLmlkKCkgfT0hPWA7XG5cblx0XHRcdFx0bWVzc2FnZS50b2tlbnMucHVzaCh7XG5cdFx0XHRcdFx0aGlnaGxpZ2h0OiB0cnVlLFxuXHRcdFx0XHRcdHRva2VuLFxuXHRcdFx0XHRcdHRleHQ6IGA8cHJlPjxjb2RlIGNsYXNzPSdjb2RlLWNvbG9ycyBobGpzICR7IHJlc3VsdC5sYW5ndWFnZSB9Jz48c3BhbiBjbGFzcz0nY29weW9ubHknPlxcYFxcYFxcYDxicj48L3NwYW4+JHsgcmVzdWx0LnZhbHVlIH08c3BhbiBjbGFzcz0nY29weW9ubHknPjxicj5cXGBcXGBcXGA8L3NwYW4+PC9jb2RlPjwvcHJlPmAsXG5cdFx0XHRcdFx0bm9IdG1sOiBjb2RlTWF0Y2hbMF1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bXNnUGFydHNbaW5kZXhdID0gdG9rZW47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2dQYXJ0c1tpbmRleF0gPSBwYXJ0O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFJlLW1vdW50IG1lc3NhZ2Vcblx0XHRyZXR1cm4gbWVzc2FnZS5odG1sID0gbXNnUGFydHMuam9pbignJyk7XG5cdH1cbn07XG5cbmV4cG9ydCBjb25zdCBjb2RlID0gKG1lc3NhZ2UpID0+IHtcblx0aWYgKHMudHJpbShtZXNzYWdlLmh0bWwpKSB7XG5cdFx0aWYgKG1lc3NhZ2UudG9rZW5zID09IG51bGwpIHtcblx0XHRcdG1lc3NhZ2UudG9rZW5zID0gW107XG5cdFx0fVxuXG5cdFx0Y29kZWJsb2NrcyhtZXNzYWdlKTtcblx0XHRpbmxpbmVjb2RlKG1lc3NhZ2UpO1xuXHR9XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59O1xuIiwiLypcbiAqIE1hcmtkb3duIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHBhcnNlIG1hcmtkb3duIHN5bnRheFxuICogQHBhcmFtIHtTdHJpbmd9IG1zZyAtIFRoZSBtZXNzYWdlIGh0bWxcbiAqL1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICdtZXRlb3IvcmFuZG9tJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5jb25zdCBwYXJzZU5vdEVzY2FwZWQgPSBmdW5jdGlvbihtc2csIG1lc3NhZ2UpIHtcblx0aWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50b2tlbnMgPT0gbnVsbCkge1xuXHRcdG1lc3NhZ2UudG9rZW5zID0gW107XG5cdH1cblxuXHRjb25zdCBhZGRBc1Rva2VuID0gZnVuY3Rpb24oaHRtbCkge1xuXHRcdGNvbnN0IHRva2VuID0gYD0hPSR7IFJhbmRvbS5pZCgpIH09IT1gO1xuXHRcdG1lc3NhZ2UudG9rZW5zLnB1c2goe1xuXHRcdFx0dG9rZW4sXG5cdFx0XHR0ZXh0OiBodG1sXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdG9rZW47XG5cdH07XG5cblx0Y29uc3Qgc2NoZW1lcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNYXJrZG93bl9TdXBwb3J0U2NoZW1lc0ZvckxpbmsnKS5zcGxpdCgnLCcpLmpvaW4oJ3wnKTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01hcmtkb3duX0hlYWRlcnMnKSkge1xuXHRcdC8vIFN1cHBvcnQgIyBUZXh0IGZvciBoMVxuXHRcdG1zZyA9IG1zZy5yZXBsYWNlKC9eIyAoKFtcXFNcXHdcXGQtX1xcL1xcKlxcLixcXFxcXVsgXFx1MDBhMFxcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyOFxcdTIwMjlcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXT8pKykvZ20sICc8aDE+JDE8L2gxPicpO1xuXG5cdFx0Ly8gU3VwcG9ydCAjIFRleHQgZm9yIGgyXG5cdFx0bXNnID0gbXNnLnJlcGxhY2UoL14jIyAoKFtcXFNcXHdcXGQtX1xcL1xcKlxcLixcXFxcXVsgXFx1MDBhMFxcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyOFxcdTIwMjlcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXT8pKykvZ20sICc8aDI+JDE8L2gyPicpO1xuXG5cdFx0Ly8gU3VwcG9ydCAjIFRleHQgZm9yIGgzXG5cdFx0bXNnID0gbXNnLnJlcGxhY2UoL14jIyMgKChbXFxTXFx3XFxkLV9cXC9cXCpcXC4sXFxcXF1bIFxcdTAwYTBcXHUxNjgwXFx1MTgwZVxcdTIwMDAtXFx1MjAwYVxcdTIwMjhcXHUyMDI5XFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1ZmVmZl0/KSspL2dtLCAnPGgzPiQxPC9oMz4nKTtcblxuXHRcdC8vIFN1cHBvcnQgIyBUZXh0IGZvciBoNFxuXHRcdG1zZyA9IG1zZy5yZXBsYWNlKC9eIyMjIyAoKFtcXFNcXHdcXGQtX1xcL1xcKlxcLixcXFxcXVsgXFx1MDBhMFxcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyOFxcdTIwMjlcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXT8pKykvZ20sICc8aDQ+JDE8L2g0PicpO1xuXHR9XG5cblx0Ly8gU3VwcG9ydCAqdGV4dCogdG8gbWFrZSBib2xkXG5cdG1zZyA9IG1zZy5yZXBsYWNlKC8oXnwmZ3Q7fFsgPl9+YF0pXFwqezEsMn0oW15cXCpcXHJcXG5dKylcXCp7MSwyfShbPF9+YF18XFxCfFxcYnwkKS9nbSwgJyQxPHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPio8L3NwYW4+PHN0cm9uZz4kMjwvc3Ryb25nPjxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj4qPC9zcGFuPiQzJyk7XG5cblx0Ly8gU3VwcG9ydCBfdGV4dF8gdG8gbWFrZSBpdGFsaWNzXG5cdG1zZyA9IG1zZy5yZXBsYWNlKC8oXnwmZ3Q7fFsgPip+YF0pXFxfezEsMn0oW15cXF9cXHJcXG5dKylcXF97MSwyfShbPCp+YF18XFxCfFxcYnwkKS9nbSwgJyQxPHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPl88L3NwYW4+PGVtPiQyPC9lbT48c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Xzwvc3Bhbj4kMycpO1xuXG5cdC8vIFN1cHBvcnQgfnRleHR+IHRvIHN0cmlrZSB0aHJvdWdoIHRleHRcblx0bXNnID0gbXNnLnJlcGxhY2UoLyhefCZndDt8WyA+XypgXSlcXH57MSwyfShbXn5cXHJcXG5dKylcXH57MSwyfShbPF8qYF18XFxCfFxcYnwkKS9nbSwgJyQxPHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPn48L3NwYW4+PHN0cmlrZT4kMjwvc3RyaWtlPjxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj5+PC9zcGFuPiQzJyk7XG5cblx0Ly8gU3VwcG9ydCBmb3IgYmxvY2sgcXVvdGVcblx0Ly8gPj4+XG5cdC8vIFRleHRcblx0Ly8gPDw8XG5cdG1zZyA9IG1zZy5yZXBsYWNlKC8oPzomZ3Q7KXszfVxcbisoW1xcc1xcU10qPylcXG4rKD86Jmx0Oyl7M30vZywgJzxibG9ja3F1b3RlIGNsYXNzPVwiYmFja2dyb3VuZC10cmFuc3BhcmVudC1kYXJrZXItYmVmb3JlXCI+PHNwYW4gY2xhc3M9XCJjb3B5b25seVwiPiZndDsmZ3Q7Jmd0Ozwvc3Bhbj4kMTxzcGFuIGNsYXNzPVwiY29weW9ubHlcIj4mbHQ7Jmx0OyZsdDs8L3NwYW4+PC9ibG9ja3F1b3RlPicpO1xuXG5cdC8vIFN1cHBvcnQgPlRleHQgZm9yIHF1b3RlXG5cdG1zZyA9IG1zZy5yZXBsYWNlKC9eJmd0OyguKikkL2dtLCAnPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj48c3BhbiBjbGFzcz1cImNvcHlvbmx5XCI+Jmd0Ozwvc3Bhbj4kMTwvYmxvY2txdW90ZT4nKTtcblxuXHQvLyBSZW1vdmUgd2hpdGUtc3BhY2UgYXJvdW5kIGJsb2NrcXVvdGUgKHByZXZlbnQgPGJyPikuIEJlY2F1c2UgYmxvY2txdW90ZSBpcyBibG9jayBlbGVtZW50LlxuXHRtc2cgPSBtc2cucmVwbGFjZSgvXFxzKjxibG9ja3F1b3RlIGNsYXNzPVwiYmFja2dyb3VuZC10cmFuc3BhcmVudC1kYXJrZXItYmVmb3JlXCI+L2dtLCAnPGJsb2NrcXVvdGUgY2xhc3M9XCJiYWNrZ3JvdW5kLXRyYW5zcGFyZW50LWRhcmtlci1iZWZvcmVcIj4nKTtcblx0bXNnID0gbXNnLnJlcGxhY2UoLzxcXC9ibG9ja3F1b3RlPlxccyovZ20sICc8L2Jsb2NrcXVvdGU+Jyk7XG5cblx0Ly8gUmVtb3ZlIG5ldy1saW5lIGJldHdlZW4gYmxvY2txdW90ZXMuXG5cdG1zZyA9IG1zZy5yZXBsYWNlKC88XFwvYmxvY2txdW90ZT5cXG48YmxvY2txdW90ZS9nbSwgJzwvYmxvY2txdW90ZT48YmxvY2txdW90ZScpO1xuXG5cdC8vIFN1cHBvcnQgIVthbHQgdGV4dF0oaHR0cDovL2ltYWdlIHVybClcblx0bXNnID0gbXNnLnJlcGxhY2UobmV3IFJlZ0V4cChgIVxcXFxbKFteXFxcXF1dKylcXFxcXVxcXFwoKCg/OiR7IHNjaGVtZXMgfSk6XFxcXC9cXFxcL1teXFxcXCldKylcXFxcKWAsICdnbScpLCAobWF0Y2gsIHRpdGxlLCB1cmwpID0+IHtcblx0XHRjb25zdCB0YXJnZXQgPSB1cmwuaW5kZXhPZihNZXRlb3IuYWJzb2x1dGVVcmwoKSkgPT09IDAgPyAnJyA6ICdfYmxhbmsnO1xuXHRcdHJldHVybiBhZGRBc1Rva2VuKGA8YSBocmVmPVwiJHsgcy5lc2NhcGVIVE1MKHVybCkgfVwiIHRpdGxlPVwiJHsgcy5lc2NhcGVIVE1MKHRpdGxlKSB9XCIgdGFyZ2V0PVwiJHsgcy5lc2NhcGVIVE1MKHRhcmdldCkgfVwiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj48ZGl2IGNsYXNzPVwiaW5saW5lLWltYWdlXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJHsgcy5lc2NhcGVIVE1MKHVybCkgfSk7XCI+PC9kaXY+PC9hPmApO1xuXHR9KTtcblxuXHQvLyBTdXBwb3J0IFtUZXh0XShodHRwOi8vbGluaylcblx0bXNnID0gbXNnLnJlcGxhY2UobmV3IFJlZ0V4cChgXFxcXFsoW15cXFxcXV0rKVxcXFxdXFxcXCgoKD86JHsgc2NoZW1lcyB9KTpcXFxcL1xcXFwvW15cXFxcKV0rKVxcXFwpYCwgJ2dtJyksIChtYXRjaCwgdGl0bGUsIHVybCkgPT4ge1xuXHRcdGNvbnN0IHRhcmdldCA9IHVybC5pbmRleE9mKE1ldGVvci5hYnNvbHV0ZVVybCgpKSA9PT0gMCA/ICcnIDogJ19ibGFuayc7XG5cdFx0cmV0dXJuIGFkZEFzVG9rZW4oYDxhIGhyZWY9XCIkeyBzLmVzY2FwZUhUTUwodXJsKSB9XCIgdGFyZ2V0PVwiJHsgcy5lc2NhcGVIVE1MKHRhcmdldCkgfVwiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj4keyBzLmVzY2FwZUhUTUwodGl0bGUpIH08L2E+YCk7XG5cdH0pO1xuXG5cdC8vIFN1cHBvcnQgPGh0dHA6Ly9saW5rfFRleHQ+XG5cdG1zZyA9IG1zZy5yZXBsYWNlKG5ldyBSZWdFeHAoYCg/Ojx8Jmx0OykoKD86JHsgc2NoZW1lcyB9KTpcXFxcL1xcXFwvW15cXFxcfF0rKVxcXFx8KC4rPykoPz0+fCZndDspKD86PnwmZ3Q7KWAsICdnbScpLCAobWF0Y2gsIHVybCwgdGl0bGUpID0+IHtcblx0XHRjb25zdCB0YXJnZXQgPSB1cmwuaW5kZXhPZihNZXRlb3IuYWJzb2x1dGVVcmwoKSkgPT09IDAgPyAnJyA6ICdfYmxhbmsnO1xuXHRcdHJldHVybiBhZGRBc1Rva2VuKGA8YSBocmVmPVwiJHsgcy5lc2NhcGVIVE1MKHVybCkgfVwiIHRhcmdldD1cIiR7IHMuZXNjYXBlSFRNTCh0YXJnZXQpIH1cIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+JHsgcy5lc2NhcGVIVE1MKHRpdGxlKSB9PC9hPmApO1xuXHR9KTtcblxuXHRyZXR1cm4gbXNnO1xufTtcblxuZXhwb3J0IGNvbnN0IG1hcmtkb3duID0gZnVuY3Rpb24obWVzc2FnZSkge1xuXHRtZXNzYWdlLmh0bWwgPSBwYXJzZU5vdEVzY2FwZWQobWVzc2FnZS5odG1sLCBtZXNzYWdlKTtcblx0cmV0dXJuIG1lc3NhZ2U7XG59O1xuIiwiLypcbiAqIE1hcmtkb3duIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHBhcnNlIG1hcmtkb3duIHN5bnRheFxuICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2UgLSBUaGUgbWVzc2FnZSBvYmplY3RcbiAqL1xuaW1wb3J0IHsgbWFya2Rvd24gfSBmcm9tICcuL21hcmtkb3duLmpzJztcbmltcG9ydCB7IGNvZGUgfSBmcm9tICcuL2NvZGUuanMnO1xuXG5leHBvcnQgY29uc3Qgb3JpZ2luYWwgPSAobWVzc2FnZSkgPT4ge1xuXHQvLyBQYXJzZSBtYXJrZG93biBjb2RlXG5cdG1lc3NhZ2UgPSBjb2RlKG1lc3NhZ2UpO1xuXG5cdC8vIFBhcnNlIG1hcmtkb3duXG5cdG1lc3NhZ2UgPSBtYXJrZG93bihtZXNzYWdlKTtcblxuXHQvLyBSZXBsYWNlIGxpbmVicmVhayB0byBiclxuXHRtZXNzYWdlLmh0bWwgPSBtZXNzYWdlLmh0bWwucmVwbGFjZSgvXFxuL2dtLCAnPGJyPicpO1xuXG5cdHJldHVybiBtZXNzYWdlO1xufTtcbiJdfQ==
