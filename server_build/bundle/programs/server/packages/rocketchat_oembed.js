(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var ECMAScript = Package.ecmascript.ECMAScript;
var changeCase = Package['konecty:change-case'].changeCase;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var OEmbed;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:oembed":{"server":{"server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_oembed/server/server.js                                                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
const module1 = module;

let _;

module1.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let URL;
module1.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
let querystring;
module1.watch(require("querystring"), {
  default(v) {
    querystring = v;
  }

}, 2);
let iconv;
module1.watch(require("iconv-lite"), {
  default(v) {
    iconv = v;
  }

}, 3);
let ipRangeCheck;
module1.watch(require("ip-range-check"), {
  default(v) {
    ipRangeCheck = v;
  }

}, 4);
let he;
module1.watch(require("he"), {
  default(v) {
    he = v;
  }

}, 5);
let jschardet;
module1.watch(require("jschardet"), {
  default(v) {
    jschardet = v;
  }

}, 6);
const request = HTTPInternals.NpmModules.request.module;
const OEmbed = {}; //  Detect encoding
//  Priority:
//  Detected == HTTP Header > Detected == HTML meta > HTTP Header > HTML meta > Detected > Default (utf-8)
//  See also: https://www.w3.org/International/questions/qa-html-encoding-declarations.en#quickanswer

const getCharset = function (contentType, body) {
  let detectedCharset;
  let httpHeaderCharset;
  let htmlMetaCharset;
  let result;
  contentType = contentType || '';
  const binary = body.toString('binary');
  const detected = jschardet.detect(binary);

  if (detected.confidence > 0.8) {
    detectedCharset = detected.encoding.toLowerCase();
  }

  const m1 = contentType.match(/charset=([\w\-]+)/i);

  if (m1) {
    httpHeaderCharset = m1[1].toLowerCase();
  }

  const m2 = binary.match(/<meta\b[^>]*charset=["']?([\w\-]+)/i);

  if (m2) {
    htmlMetaCharset = m2[1].toLowerCase();
  }

  if (detectedCharset) {
    if (detectedCharset === httpHeaderCharset) {
      result = httpHeaderCharset;
    } else if (detectedCharset === htmlMetaCharset) {
      result = htmlMetaCharset;
    }
  }

  if (!result) {
    result = httpHeaderCharset || htmlMetaCharset || detectedCharset;
  }

  return result || 'utf-8';
};

const toUtf8 = function (contentType, body) {
  return iconv.decode(body, getCharset(contentType, body));
};

const getUrlContent = function (urlObj, redirectCount = 5, callback) {
  if (_.isString(urlObj)) {
    urlObj = URL.parse(urlObj);
  }

  const parsedUrl = _.pick(urlObj, ['host', 'hash', 'pathname', 'protocol', 'port', 'query', 'search', 'hostname']);

  const ignoredHosts = RocketChat.settings.get('API_EmbedIgnoredHosts').replace(/\s/g, '').split(',') || [];

  if (ignoredHosts.includes(parsedUrl.hostname) || ipRangeCheck(parsedUrl.hostname, ignoredHosts)) {
    return callback();
  }

  const safePorts = RocketChat.settings.get('API_EmbedSafePorts').replace(/\s/g, '').split(',') || [];

  if (parsedUrl.port && safePorts.length > 0 && !safePorts.includes(parsedUrl.port)) {
    return callback();
  }

  const data = RocketChat.callbacks.run('oembed:beforeGetUrlContent', {
    urlObj,
    parsedUrl
  });

  if (data.attachments != null) {
    return callback(null, data);
  }

  const url = URL.format(data.urlObj);
  const opts = {
    url,
    strictSSL: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs'),
    gzip: true,
    maxRedirects: redirectCount,
    headers: {
      'User-Agent': RocketChat.settings.get('API_Embed_UserAgent')
    }
  };
  let headers = null;
  let statusCode = null;
  let error = null;
  const chunks = [];
  let chunksTotalLength = 0;
  const stream = request(opts);
  stream.on('response', function (response) {
    statusCode = response.statusCode;
    headers = response.headers;

    if (response.statusCode !== 200) {
      return stream.abort();
    }
  });
  stream.on('data', function (chunk) {
    chunks.push(chunk);
    chunksTotalLength += chunk.length;

    if (chunksTotalLength > 250000) {
      return stream.abort();
    }
  });
  stream.on('end', Meteor.bindEnvironment(function () {
    if (error != null) {
      return callback(null, {
        error,
        parsedUrl
      });
    }

    const buffer = Buffer.concat(chunks);
    return callback(null, {
      headers,
      body: toUtf8(headers['content-type'], buffer),
      parsedUrl,
      statusCode
    });
  }));
  return stream.on('error', function (err) {
    return error = err;
  });
};

OEmbed.getUrlMeta = function (url, withFragment) {
  const getUrlContentSync = Meteor.wrapAsync(getUrlContent);
  const urlObj = URL.parse(url);

  if (withFragment != null) {
    const queryStringObj = querystring.parse(urlObj.query);
    queryStringObj._escaped_fragment_ = '';
    urlObj.query = querystring.stringify(queryStringObj);
    let path = urlObj.pathname;

    if (urlObj.query != null) {
      path += `?${urlObj.query}`;
    }

    urlObj.path = path;
  }

  const content = getUrlContentSync(urlObj, 5);

  if (!content) {
    return;
  }

  if (content.attachments != null) {
    return content;
  }

  let metas = undefined;

  if (content && content.body) {
    metas = {};
    content.body.replace(/<title[^>]*>([^<]*)<\/title>/gmi, function (meta, title) {
      return metas.pageTitle != null ? metas.pageTitle : metas.pageTitle = he.unescape(title);
    });
    content.body.replace(/<meta[^>]*(?:name|property)=[']([^']*)['][^>]*\scontent=[']([^']*)['][^>]*>/gmi, function (meta, name, value) {
      let name1;
      return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
    });
    content.body.replace(/<meta[^>]*(?:name|property)=["]([^"]*)["][^>]*\scontent=["]([^"]*)["][^>]*>/gmi, function (meta, name, value) {
      let name1;
      return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
    });
    content.body.replace(/<meta[^>]*\scontent=[']([^']*)['][^>]*(?:name|property)=[']([^']*)['][^>]*>/gmi, function (meta, value, name) {
      let name1;
      return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
    });
    content.body.replace(/<meta[^>]*\scontent=["]([^"]*)["][^>]*(?:name|property)=["]([^"]*)["][^>]*>/gmi, function (meta, value, name) {
      let name1;
      return metas[name1 = changeCase.camelCase(name)] != null ? metas[name1] : metas[name1] = he.unescape(value);
    });

    if (metas.fragment === '!' && withFragment == null) {
      return OEmbed.getUrlMeta(url, true);
    }
  }

  let headers = undefined;
  let data = undefined;

  if (content && content.headers) {
    headers = {};
    const headerObj = content.headers;
    Object.keys(headerObj).forEach(header => {
      headers[changeCase.camelCase(header)] = headerObj[header];
    });
  }

  if (content && content.statusCode !== 200) {
    return data;
  }

  data = RocketChat.callbacks.run('oembed:afterParseContent', {
    meta: metas,
    headers,
    parsedUrl: content.parsedUrl,
    content
  });
  return data;
};

OEmbed.getUrlMetaWithCache = function (url, withFragment) {
  const cache = RocketChat.models.OEmbedCache.findOneById(url);

  if (cache != null) {
    return cache.data;
  }

  const data = OEmbed.getUrlMeta(url, withFragment);

  if (data != null) {
    try {
      RocketChat.models.OEmbedCache.createWithIdAndData(url, data);
    } catch (_error) {
      console.error('OEmbed duplicated record', url);
    }

    return data;
  }
};

const getRelevantHeaders = function (headersObj) {
  const headers = {};
  Object.keys(headersObj).forEach(key => {
    const value = headersObj[key];
    const lowerCaseKey = key.toLowerCase();

    if ((lowerCaseKey === 'contenttype' || lowerCaseKey === 'contentlength') && value && value.trim() !== '') {
      headers[key] = value;
    }
  });

  if (Object.keys(headers).length > 0) {
    return headers;
  }
};

const getRelevantMetaTags = function (metaObj) {
  const tags = {};
  Object.keys(metaObj).forEach(key => {
    const value = metaObj[key];

    if (/^(og|fb|twitter|oembed|msapplication).+|description|title|pageTitle$/.test(key.toLowerCase()) && value && value.trim() !== '') {
      tags[key] = value;
    }
  });

  if (Object.keys(tags).length > 0) {
    return tags;
  }
};

OEmbed.rocketUrlParser = function (message) {
  if (Array.isArray(message.urls)) {
    let attachments = [];
    let changed = false;
    message.urls.forEach(function (item) {
      if (item.ignoreParse === true) {
        return;
      }

      if (item.url.startsWith('grain://')) {
        changed = true;
        item.meta = {
          sandstorm: {
            grain: item.sandstormViewInfo
          }
        };
        return;
      }

      if (!/^https?:\/\//i.test(item.url)) {
        return;
      }

      const data = OEmbed.getUrlMetaWithCache(item.url);

      if (data != null) {
        if (data.attachments) {
          return attachments = _.union(attachments, data.attachments);
        } else {
          if (data.meta != null) {
            item.meta = getRelevantMetaTags(data.meta);
          }

          if (data.headers != null) {
            item.headers = getRelevantHeaders(data.headers);
          }

          item.parsedUrl = data.parsedUrl;
          return changed = true;
        }
      }
    });

    if (attachments.length) {
      RocketChat.models.Messages.setMessageAttachments(message._id, attachments);
    }

    if (changed === true) {
      RocketChat.models.Messages.setUrlsById(message._id, message.urls);
    }
  }

  return message;
};

RocketChat.settings.get('API_Embed', function (key, value) {
  if (value) {
    return RocketChat.callbacks.add('afterSaveMessage', OEmbed.rocketUrlParser, RocketChat.callbacks.priority.LOW, 'API_Embed');
  } else {
    return RocketChat.callbacks.remove('afterSaveMessage', 'API_Embed');
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"providers.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_oembed/server/providers.js                                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let URL;
module.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
let QueryString;
module.watch(require("querystring"), {
  default(v) {
    QueryString = v;
  }

}, 2);

class Providers {
  constructor() {
    this.providers = [];
  }

  static getConsumerUrl(provider, url) {
    const urlObj = URL.parse(provider.endPoint, true);
    urlObj.query['url'] = url;
    delete urlObj.search;
    return URL.format(urlObj);
  }

  registerProvider(provider) {
    return this.providers.push(provider);
  }

  getProviders() {
    return this.providers;
  }

  getProviderForUrl(url) {
    return _.find(this.providers, function (provider) {
      const candidate = _.find(provider.urls, function (re) {
        return re.test(url);
      });

      return candidate != null;
    });
  }

}

const providers = new Providers();
providers.registerProvider({
  urls: [new RegExp('https?://soundcloud.com/\\S+')],
  endPoint: 'https://soundcloud.com/oembed?format=json&maxheight=150'
});
providers.registerProvider({
  urls: [new RegExp('https?://vimeo.com/[^/]+'), new RegExp('https?://vimeo.com/channels/[^/]+/[^/]+'), new RegExp('https://vimeo.com/groups/[^/]+/videos/[^/]+')],
  endPoint: 'https://vimeo.com/api/oembed.json?maxheight=200'
});
providers.registerProvider({
  urls: [new RegExp('https?://www.youtube.com/\\S+'), new RegExp('https?://youtu.be/\\S+')],
  endPoint: 'https://www.youtube.com/oembed?maxheight=200'
});
providers.registerProvider({
  urls: [new RegExp('https?://www.rdio.com/\\S+'), new RegExp('https?://rd.io/\\S+')],
  endPoint: 'https://www.rdio.com/api/oembed/?format=json&maxheight=150'
});
providers.registerProvider({
  urls: [new RegExp('https?://www.slideshare.net/[^/]+/[^/]+')],
  endPoint: 'https://www.slideshare.net/api/oembed/2?format=json&maxheight=200'
});
providers.registerProvider({
  urls: [new RegExp('https?://www.dailymotion.com/video/\\S+')],
  endPoint: 'https://www.dailymotion.com/services/oembed?maxheight=200'
});
RocketChat.oembed = {};
RocketChat.oembed.providers = providers;
RocketChat.callbacks.add('oembed:beforeGetUrlContent', function (data) {
  if (data.parsedUrl != null) {
    const url = URL.format(data.parsedUrl);
    const provider = providers.getProviderForUrl(url);

    if (provider != null) {
      let consumerUrl = Providers.getConsumerUrl(provider, url);
      consumerUrl = URL.parse(consumerUrl, true);

      _.extend(data.parsedUrl, consumerUrl);

      data.urlObj.port = consumerUrl.port;
      data.urlObj.hostname = consumerUrl.hostname;
      data.urlObj.pathname = consumerUrl.pathname;
      data.urlObj.query = consumerUrl.query;
      delete data.urlObj.search;
      delete data.urlObj.host;
    }
  }

  return data;
}, RocketChat.callbacks.priority.MEDIUM, 'oembed-providers-before');
RocketChat.callbacks.add('oembed:afterParseContent', function (data) {
  if (data.parsedUrl && data.parsedUrl.query) {
    let queryString = data.parsedUrl.query;

    if (_.isString(data.parsedUrl.query)) {
      queryString = QueryString.parse(data.parsedUrl.query);
    }

    if (queryString.url != null) {
      const url = queryString.url;
      const provider = providers.getProviderForUrl(url);

      if (provider != null) {
        if (data.content && data.content.body) {
          try {
            const metas = JSON.parse(data.content.body);

            _.each(metas, function (value, key) {
              if (_.isString(value)) {
                return data.meta[changeCase.camelCase(`oembed_${key}`)] = value;
              }
            });

            data.meta['oembedUrl'] = url;
          } catch (error) {
            console.log(error);
          }
        }
      }
    }
  }

  return data;
}, RocketChat.callbacks.priority.MEDIUM, 'oembed-providers-after');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"jumpToMessage.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_oembed/server/jumpToMessage.js                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let URL;
module.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
let QueryString;
module.watch(require("querystring"), {
  default(v) {
    QueryString = v;
  }

}, 2);

const recursiveRemove = (message, deep = 1) => {
  if (message) {
    if ('attachments' in message && message.attachments !== null && deep < RocketChat.settings.get('Message_QuoteChainLimit')) {
      message.attachments.map(msg => recursiveRemove(msg, deep + 1));
    } else {
      delete message.attachments;
    }
  }

  return message;
};

RocketChat.callbacks.add('beforeSaveMessage', msg => {
  if (msg && msg.urls) {
    msg.urls.forEach(item => {
      if (item.url.indexOf(Meteor.absoluteUrl()) === 0) {
        const urlObj = URL.parse(item.url);

        if (urlObj.query) {
          const queryString = QueryString.parse(urlObj.query);

          if (_.isString(queryString.msg)) {
            // Jump-to query param
            const jumpToMessage = recursiveRemove(RocketChat.models.Messages.findOneById(queryString.msg));

            if (jumpToMessage) {
              msg.attachments = msg.attachments || [];
              msg.attachments.push({
                'text': jumpToMessage.msg,
                'translations': jumpToMessage.translations,
                'author_name': jumpToMessage.alias || jumpToMessage.u.username,
                'author_icon': getAvatarUrlFromUsername(jumpToMessage.u.username),
                'message_link': item.url,
                'attachments': jumpToMessage.attachments || [],
                'ts': jumpToMessage.ts
              });
              item.ignoreParse = true;
            }
          }
        }
      }
    });
  }

  return msg;
}, RocketChat.callbacks.priority.LOW, 'jumpToMessage');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"OEmbedCache.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_oembed/server/models/OEmbedCache.js                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.OEmbedCache = new class extends RocketChat.models._Base {
  constructor() {
    super('oembed_cache');
    this.tryEnsureIndex({
      'updatedAt': 1
    });
  } //FIND ONE


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  } //INSERT


  createWithIdAndData(_id, data) {
    const record = {
      _id,
      data,
      updatedAt: new Date()
    };
    record._id = this.insert(record);
    return record;
  } //REMOVE


  removeAfterDate(date) {
    const query = {
      updatedAt: {
        $lte: date
      }
    };
    return this.remove(query);
  }

}();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:oembed/server/server.js");
require("/node_modules/meteor/rocketchat:oembed/server/providers.js");
require("/node_modules/meteor/rocketchat:oembed/server/jumpToMessage.js");
require("/node_modules/meteor/rocketchat:oembed/server/models/OEmbedCache.js");

/* Exports */
Package._define("rocketchat:oembed", {
  OEmbed: OEmbed
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_oembed.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvZW1iZWQvc2VydmVyL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvZW1iZWQvc2VydmVyL3Byb3ZpZGVycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvZW1iZWQvc2VydmVyL2p1bXBUb01lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6b2VtYmVkL3NlcnZlci9tb2RlbHMvT0VtYmVkQ2FjaGUuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsIl8iLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIlVSTCIsInF1ZXJ5c3RyaW5nIiwiaWNvbnYiLCJpcFJhbmdlQ2hlY2siLCJoZSIsImpzY2hhcmRldCIsInJlcXVlc3QiLCJIVFRQSW50ZXJuYWxzIiwiTnBtTW9kdWxlcyIsIk9FbWJlZCIsImdldENoYXJzZXQiLCJjb250ZW50VHlwZSIsImJvZHkiLCJkZXRlY3RlZENoYXJzZXQiLCJodHRwSGVhZGVyQ2hhcnNldCIsImh0bWxNZXRhQ2hhcnNldCIsInJlc3VsdCIsImJpbmFyeSIsInRvU3RyaW5nIiwiZGV0ZWN0ZWQiLCJkZXRlY3QiLCJjb25maWRlbmNlIiwiZW5jb2RpbmciLCJ0b0xvd2VyQ2FzZSIsIm0xIiwibWF0Y2giLCJtMiIsInRvVXRmOCIsImRlY29kZSIsImdldFVybENvbnRlbnQiLCJ1cmxPYmoiLCJyZWRpcmVjdENvdW50IiwiY2FsbGJhY2siLCJpc1N0cmluZyIsInBhcnNlIiwicGFyc2VkVXJsIiwicGljayIsImlnbm9yZWRIb3N0cyIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsInJlcGxhY2UiLCJzcGxpdCIsImluY2x1ZGVzIiwiaG9zdG5hbWUiLCJzYWZlUG9ydHMiLCJwb3J0IiwibGVuZ3RoIiwiZGF0YSIsImNhbGxiYWNrcyIsInJ1biIsImF0dGFjaG1lbnRzIiwidXJsIiwiZm9ybWF0Iiwib3B0cyIsInN0cmljdFNTTCIsImd6aXAiLCJtYXhSZWRpcmVjdHMiLCJoZWFkZXJzIiwic3RhdHVzQ29kZSIsImVycm9yIiwiY2h1bmtzIiwiY2h1bmtzVG90YWxMZW5ndGgiLCJzdHJlYW0iLCJvbiIsInJlc3BvbnNlIiwiYWJvcnQiLCJjaHVuayIsInB1c2giLCJNZXRlb3IiLCJiaW5kRW52aXJvbm1lbnQiLCJidWZmZXIiLCJCdWZmZXIiLCJjb25jYXQiLCJlcnIiLCJnZXRVcmxNZXRhIiwid2l0aEZyYWdtZW50IiwiZ2V0VXJsQ29udGVudFN5bmMiLCJ3cmFwQXN5bmMiLCJxdWVyeVN0cmluZ09iaiIsInF1ZXJ5IiwiX2VzY2FwZWRfZnJhZ21lbnRfIiwic3RyaW5naWZ5IiwicGF0aCIsInBhdGhuYW1lIiwiY29udGVudCIsIm1ldGFzIiwidW5kZWZpbmVkIiwibWV0YSIsInRpdGxlIiwicGFnZVRpdGxlIiwidW5lc2NhcGUiLCJuYW1lIiwidmFsdWUiLCJuYW1lMSIsImNoYW5nZUNhc2UiLCJjYW1lbENhc2UiLCJmcmFnbWVudCIsImhlYWRlck9iaiIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwiaGVhZGVyIiwiZ2V0VXJsTWV0YVdpdGhDYWNoZSIsImNhY2hlIiwibW9kZWxzIiwiT0VtYmVkQ2FjaGUiLCJmaW5kT25lQnlJZCIsImNyZWF0ZVdpdGhJZEFuZERhdGEiLCJfZXJyb3IiLCJjb25zb2xlIiwiZ2V0UmVsZXZhbnRIZWFkZXJzIiwiaGVhZGVyc09iaiIsImtleSIsImxvd2VyQ2FzZUtleSIsInRyaW0iLCJnZXRSZWxldmFudE1ldGFUYWdzIiwibWV0YU9iaiIsInRhZ3MiLCJ0ZXN0Iiwicm9ja2V0VXJsUGFyc2VyIiwibWVzc2FnZSIsIkFycmF5IiwiaXNBcnJheSIsInVybHMiLCJjaGFuZ2VkIiwiaXRlbSIsImlnbm9yZVBhcnNlIiwic3RhcnRzV2l0aCIsInNhbmRzdG9ybSIsImdyYWluIiwic2FuZHN0b3JtVmlld0luZm8iLCJ1bmlvbiIsIk1lc3NhZ2VzIiwic2V0TWVzc2FnZUF0dGFjaG1lbnRzIiwiX2lkIiwic2V0VXJsc0J5SWQiLCJhZGQiLCJwcmlvcml0eSIsIkxPVyIsInJlbW92ZSIsIlF1ZXJ5U3RyaW5nIiwiUHJvdmlkZXJzIiwiY29uc3RydWN0b3IiLCJwcm92aWRlcnMiLCJnZXRDb25zdW1lclVybCIsInByb3ZpZGVyIiwiZW5kUG9pbnQiLCJzZWFyY2giLCJyZWdpc3RlclByb3ZpZGVyIiwiZ2V0UHJvdmlkZXJzIiwiZ2V0UHJvdmlkZXJGb3JVcmwiLCJmaW5kIiwiY2FuZGlkYXRlIiwicmUiLCJSZWdFeHAiLCJvZW1iZWQiLCJjb25zdW1lclVybCIsImV4dGVuZCIsImhvc3QiLCJNRURJVU0iLCJxdWVyeVN0cmluZyIsIkpTT04iLCJlYWNoIiwibG9nIiwicmVjdXJzaXZlUmVtb3ZlIiwiZGVlcCIsIm1hcCIsIm1zZyIsImluZGV4T2YiLCJhYnNvbHV0ZVVybCIsImp1bXBUb01lc3NhZ2UiLCJ0cmFuc2xhdGlvbnMiLCJhbGlhcyIsInUiLCJ1c2VybmFtZSIsImdldEF2YXRhclVybEZyb21Vc2VybmFtZSIsInRzIiwiX0Jhc2UiLCJ0cnlFbnN1cmVJbmRleCIsIm9wdGlvbnMiLCJmaW5kT25lIiwicmVjb3JkIiwidXBkYXRlZEF0IiwiRGF0ZSIsImluc2VydCIsInJlbW92ZUFmdGVyRGF0ZSIsImRhdGUiLCIkbHRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsTUFBTUEsVUFBUUMsTUFBZDs7QUFBcUIsSUFBSUMsQ0FBSjs7QUFBTUYsUUFBUUcsS0FBUixDQUFjQyxRQUFRLFlBQVIsQ0FBZCxFQUFvQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0osUUFBRUksQ0FBRjtBQUFJOztBQUFoQixDQUFwQyxFQUFzRCxDQUF0RDtBQUF5RCxJQUFJQyxHQUFKO0FBQVFQLFFBQVFHLEtBQVIsQ0FBY0MsUUFBUSxLQUFSLENBQWQsRUFBNkI7QUFBQ0Ms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QUFqQixFQUEwQjtBQUN6QixVQUFNcEcsUUFBUTtBQUNidUQ7QUFEYSxLQUFkO0FBR0EsV0FBTyxLQUFLOEMsT0FBTCxDQUFhckcsS0FBYixFQUFvQm9HLE9BQXBCLENBQVA7QUFDQSxHQVp3RSxDQWN6RTs7O0FBQ0F4RSxzQkFBb0IyQixHQUFwQixFQUF5QnZGLElBQXpCLEVBQStCO0FBQzlCLFVBQU1zSSxTQUFTO0FBQ2QvQyxTQURjO0FBRWR2RixVQUZjO0FBR2R1SSxpQkFBVyxJQUFJQyxJQUFKO0FBSEcsS0FBZjtBQUtBRixXQUFPL0MsR0FBUCxHQUFhLEtBQUtrRCxNQUFMLENBQVlILE1BQVosQ0FBYjtBQUNBLFdBQU9BLE1BQVA7QUFDQSxHQXZCd0UsQ0F5QnpFOzs7QUFDQUksa0JBQWdCQyxJQUFoQixFQUFzQjtBQUNyQixVQUFNM0csUUFBUTtBQUNidUcsaUJBQVc7QUFDVkssY0FBTUQ7QUFESTtBQURFLEtBQWQ7QUFLQSxXQUFPLEtBQUsvQyxNQUFMLENBQVk1RCxLQUFaLENBQVA7QUFDQTs7QUFqQ3dFLENBQTFDLEVBQWhDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfb2VtYmVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypnbG9iYWxzIEhUVFBJbnRlcm5hbHMsIGNoYW5nZUNhc2UgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IFVSTCBmcm9tICd1cmwnO1xuaW1wb3J0IHF1ZXJ5c3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCBpY29udiBmcm9tICdpY29udi1saXRlJztcbmltcG9ydCBpcFJhbmdlQ2hlY2sgZnJvbSAnaXAtcmFuZ2UtY2hlY2snO1xuaW1wb3J0IGhlIGZyb20gJ2hlJztcbmltcG9ydCBqc2NoYXJkZXQgZnJvbSAnanNjaGFyZGV0JztcblxuY29uc3QgcmVxdWVzdCA9IEhUVFBJbnRlcm5hbHMuTnBtTW9kdWxlcy5yZXF1ZXN0Lm1vZHVsZTtcbmNvbnN0IE9FbWJlZCA9IHt9O1xuXG4vLyAgRGV0ZWN0IGVuY29kaW5nXG4vLyAgUHJpb3JpdHk6XG4vLyAgRGV0ZWN0ZWQgPT0gSFRUUCBIZWFkZXIgPiBEZXRlY3RlZCA9PSBIVE1MIG1ldGEgPiBIVFRQIEhlYWRlciA+IEhUTUwgbWV0YSA+IERldGVjdGVkID4gRGVmYXVsdCAodXRmLTgpXG4vLyAgU2VlIGFsc286IGh0dHBzOi8vd3d3LnczLm9yZy9JbnRlcm5hdGlvbmFsL3F1ZXN0aW9ucy9xYS1odG1sLWVuY29kaW5nLWRlY2xhcmF0aW9ucy5lbiNxdWlja2Fuc3dlclxuY29uc3QgZ2V0Q2hhcnNldCA9IGZ1bmN0aW9uKGNvbnRlbnRUeXBlLCBib2R5KSB7XG5cdGxldCBkZXRlY3RlZENoYXJzZXQ7XG5cdGxldCBodHRwSGVhZGVyQ2hhcnNldDtcblx0bGV0IGh0bWxNZXRhQ2hhcnNldDtcblx0bGV0IHJlc3VsdDtcblxuXHRjb250ZW50VHlwZSA9IGNvbnRlbnRUeXBlIHx8ICcnO1xuXG5cdGNvbnN0IGJpbmFyeSA9IGJvZHkudG9TdHJpbmcoJ2JpbmFyeScpO1xuXHRjb25zdCBkZXRlY3RlZCA9IGpzY2hhcmRldC5kZXRlY3QoYmluYXJ5KTtcblx0aWYgKGRldGVjdGVkLmNvbmZpZGVuY2UgPiAwLjgpIHtcblx0XHRkZXRlY3RlZENoYXJzZXQgPSBkZXRlY3RlZC5lbmNvZGluZy50b0xvd2VyQ2FzZSgpO1xuXHR9XG5cdGNvbnN0IG0xID0gY29udGVudFR5cGUubWF0Y2goL2NoYXJzZXQ9KFtcXHdcXC1dKykvaSk7XG5cdGlmIChtMSkge1xuXHRcdGh0dHBIZWFkZXJDaGFyc2V0ID0gbTFbMV0udG9Mb3dlckNhc2UoKTtcblx0fVxuXHRjb25zdCBtMiA9IGJpbmFyeS5tYXRjaCgvPG1ldGFcXGJbXj5dKmNoYXJzZXQ9W1wiJ10/KFtcXHdcXC1dKykvaSk7XG5cdGlmIChtMikge1xuXHRcdGh0bWxNZXRhQ2hhcnNldCA9IG0yWzFdLnRvTG93ZXJDYXNlKCk7XG5cdH1cblx0aWYgKGRldGVjdGVkQ2hhcnNldCkge1xuXHRcdGlmIChkZXRlY3RlZENoYXJzZXQgPT09IGh0dHBIZWFkZXJDaGFyc2V0KSB7XG5cdFx0XHRyZXN1bHQgPSBodHRwSGVhZGVyQ2hhcnNldDtcblx0XHR9IGVsc2UgaWYgKGRldGVjdGVkQ2hhcnNldCA9PT0gaHRtbE1ldGFDaGFyc2V0KSB7XG5cdFx0XHRyZXN1bHQgPSBodG1sTWV0YUNoYXJzZXQ7XG5cdFx0fVxuXHR9XG5cdGlmICghcmVzdWx0KSB7XG5cdFx0cmVzdWx0ID0gaHR0cEhlYWRlckNoYXJzZXQgfHwgaHRtbE1ldGFDaGFyc2V0IHx8IGRldGVjdGVkQ2hhcnNldDtcblx0fVxuXHRyZXR1cm4gcmVzdWx0IHx8ICd1dGYtOCc7XG59O1xuXG5jb25zdCB0b1V0ZjggPSBmdW5jdGlvbihjb250ZW50VHlwZSwgYm9keSkge1xuXHRyZXR1cm4gaWNvbnYuZGVjb2RlKGJvZHksIGdldENoYXJzZXQoY29udGVudFR5cGUsIGJvZHkpKTtcbn07XG5cbmNvbnN0IGdldFVybENvbnRlbnQgPSBmdW5jdGlvbih1cmxPYmosIHJlZGlyZWN0Q291bnQgPSA1LCBjYWxsYmFjaykge1xuXG5cdGlmIChfLmlzU3RyaW5nKHVybE9iaikpIHtcblx0XHR1cmxPYmogPSBVUkwucGFyc2UodXJsT2JqKTtcblx0fVxuXG5cdGNvbnN0IHBhcnNlZFVybCA9IF8ucGljayh1cmxPYmosIFsnaG9zdCcsICdoYXNoJywgJ3BhdGhuYW1lJywgJ3Byb3RvY29sJywgJ3BvcnQnLCAncXVlcnknLCAnc2VhcmNoJywgJ2hvc3RuYW1lJ10pO1xuXHRjb25zdCBpZ25vcmVkSG9zdHMgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VtYmVkSWdub3JlZEhvc3RzJykucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpIHx8IFtdO1xuXHRpZiAoaWdub3JlZEhvc3RzLmluY2x1ZGVzKHBhcnNlZFVybC5ob3N0bmFtZSkgfHwgaXBSYW5nZUNoZWNrKHBhcnNlZFVybC5ob3N0bmFtZSwgaWdub3JlZEhvc3RzKSkge1xuXHRcdHJldHVybiBjYWxsYmFjaygpO1xuXHR9XG5cblx0Y29uc3Qgc2FmZVBvcnRzID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbWJlZFNhZmVQb3J0cycpLnJlcGxhY2UoL1xccy9nLCAnJykuc3BsaXQoJywnKSB8fCBbXTtcblx0aWYgKHBhcnNlZFVybC5wb3J0ICYmIHNhZmVQb3J0cy5sZW5ndGggPiAwICYmICghc2FmZVBvcnRzLmluY2x1ZGVzKHBhcnNlZFVybC5wb3J0KSkpIHtcblx0XHRyZXR1cm4gY2FsbGJhY2soKTtcblx0fVxuXG5cdGNvbnN0IGRhdGEgPSBSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ29lbWJlZDpiZWZvcmVHZXRVcmxDb250ZW50Jywge1xuXHRcdHVybE9iaixcblx0XHRwYXJzZWRVcmxcblx0fSk7XG5cdGlmIChkYXRhLmF0dGFjaG1lbnRzICE9IG51bGwpIHtcblx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgZGF0YSk7XG5cdH1cblx0Y29uc3QgdXJsID0gVVJMLmZvcm1hdChkYXRhLnVybE9iaik7XG5cdGNvbnN0IG9wdHMgPSB7XG5cdFx0dXJsLFxuXHRcdHN0cmljdFNTTDogIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBbGxvd19JbnZhbGlkX1NlbGZTaWduZWRfQ2VydHMnKSxcblx0XHRnemlwOiB0cnVlLFxuXHRcdG1heFJlZGlyZWN0czogcmVkaXJlY3RDb3VudCxcblx0XHRoZWFkZXJzOiB7XG5cdFx0XHQnVXNlci1BZ2VudCc6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfRW1iZWRfVXNlckFnZW50Jylcblx0XHR9XG5cdH07XG5cdGxldCBoZWFkZXJzID0gbnVsbDtcblx0bGV0IHN0YXR1c0NvZGUgPSBudWxsO1xuXHRsZXQgZXJyb3IgPSBudWxsO1xuXHRjb25zdCBjaHVua3MgPSBbXTtcblx0bGV0IGNodW5rc1RvdGFsTGVuZ3RoID0gMDtcblx0Y29uc3Qgc3RyZWFtID0gcmVxdWVzdChvcHRzKTtcblx0c3RyZWFtLm9uKCdyZXNwb25zZScsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0c3RhdHVzQ29kZSA9IHJlc3BvbnNlLnN0YXR1c0NvZGU7XG5cdFx0aGVhZGVycyA9IHJlc3BvbnNlLmhlYWRlcnM7XG5cdFx0aWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuXHRcdFx0cmV0dXJuIHN0cmVhbS5hYm9ydCgpO1xuXHRcdH1cblx0fSk7XG5cdHN0cmVhbS5vbignZGF0YScsIGZ1bmN0aW9uKGNodW5rKSB7XG5cdFx0Y2h1bmtzLnB1c2goY2h1bmspO1xuXHRcdGNodW5rc1RvdGFsTGVuZ3RoICs9IGNodW5rLmxlbmd0aDtcblx0XHRpZiAoY2h1bmtzVG90YWxMZW5ndGggPiAyNTAwMDApIHtcblx0XHRcdHJldHVybiBzdHJlYW0uYWJvcnQoKTtcblx0XHR9XG5cdH0pO1xuXHRzdHJlYW0ub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24oKSB7XG5cdFx0aWYgKGVycm9yICE9IG51bGwpIHtcblx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCB7XG5cdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRwYXJzZWRVcmxcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjb25zdCBidWZmZXIgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7XG5cdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIHtcblx0XHRcdGhlYWRlcnMsXG5cdFx0XHRib2R5OiB0b1V0ZjgoaGVhZGVyc1snY29udGVudC10eXBlJ10sIGJ1ZmZlciksXG5cdFx0XHRwYXJzZWRVcmwsXG5cdFx0XHRzdGF0dXNDb2RlXG5cdFx0fSk7XG5cdH0pKTtcblx0cmV0dXJuIHN0cmVhbS5vbignZXJyb3InLCBmdW5jdGlvbihlcnIpIHtcblx0XHRyZXR1cm4gZXJyb3IgPSBlcnI7XG5cdH0pO1xufTtcblxuT0VtYmVkLmdldFVybE1ldGEgPSBmdW5jdGlvbih1cmwsIHdpdGhGcmFnbWVudCkge1xuXHRjb25zdCBnZXRVcmxDb250ZW50U3luYyA9IE1ldGVvci53cmFwQXN5bmMoZ2V0VXJsQ29udGVudCk7XG5cdGNvbnN0IHVybE9iaiA9IFVSTC5wYXJzZSh1cmwpO1xuXHRpZiAod2l0aEZyYWdtZW50ICE9IG51bGwpIHtcblx0XHRjb25zdCBxdWVyeVN0cmluZ09iaiA9IHF1ZXJ5c3RyaW5nLnBhcnNlKHVybE9iai5xdWVyeSk7XG5cdFx0cXVlcnlTdHJpbmdPYmouX2VzY2FwZWRfZnJhZ21lbnRfID0gJyc7XG5cdFx0dXJsT2JqLnF1ZXJ5ID0gcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHF1ZXJ5U3RyaW5nT2JqKTtcblx0XHRsZXQgcGF0aCA9IHVybE9iai5wYXRobmFtZTtcblx0XHRpZiAodXJsT2JqLnF1ZXJ5ICE9IG51bGwpIHtcblx0XHRcdHBhdGggKz0gYD8keyB1cmxPYmoucXVlcnkgfWA7XG5cdFx0fVxuXHRcdHVybE9iai5wYXRoID0gcGF0aDtcblx0fVxuXHRjb25zdCBjb250ZW50ID0gZ2V0VXJsQ29udGVudFN5bmModXJsT2JqLCA1KTtcblx0aWYgKCFjb250ZW50KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChjb250ZW50LmF0dGFjaG1lbnRzICE9IG51bGwpIHtcblx0XHRyZXR1cm4gY29udGVudDtcblx0fVxuXHRsZXQgbWV0YXMgPSB1bmRlZmluZWQ7XG5cdGlmIChjb250ZW50ICYmIGNvbnRlbnQuYm9keSkge1xuXHRcdG1ldGFzID0ge307XG5cdFx0Y29udGVudC5ib2R5LnJlcGxhY2UoLzx0aXRsZVtePl0qPihbXjxdKik8XFwvdGl0bGU+L2dtaSwgZnVuY3Rpb24obWV0YSwgdGl0bGUpIHtcblx0XHRcdHJldHVybiBtZXRhcy5wYWdlVGl0bGUgIT0gbnVsbCA/IG1ldGFzLnBhZ2VUaXRsZSA6IG1ldGFzLnBhZ2VUaXRsZSA9IGhlLnVuZXNjYXBlKHRpdGxlKTtcblx0XHR9KTtcblx0XHRjb250ZW50LmJvZHkucmVwbGFjZSgvPG1ldGFbXj5dKig/Om5hbWV8cHJvcGVydHkpPVsnXShbXiddKilbJ11bXj5dKlxcc2NvbnRlbnQ9WyddKFteJ10qKVsnXVtePl0qPi9nbWksIGZ1bmN0aW9uKG1ldGEsIG5hbWUsIHZhbHVlKSB7XG5cdFx0XHRsZXQgbmFtZTE7XG5cdFx0XHRyZXR1cm4gbWV0YXNbbmFtZTEgPSBjaGFuZ2VDYXNlLmNhbWVsQ2FzZShuYW1lKV0gIT0gbnVsbCA/IG1ldGFzW25hbWUxXSA6IG1ldGFzW25hbWUxXSA9IGhlLnVuZXNjYXBlKHZhbHVlKTtcblx0XHR9KTtcblx0XHRjb250ZW50LmJvZHkucmVwbGFjZSgvPG1ldGFbXj5dKig/Om5hbWV8cHJvcGVydHkpPVtcIl0oW15cIl0qKVtcIl1bXj5dKlxcc2NvbnRlbnQ9W1wiXShbXlwiXSopW1wiXVtePl0qPi9nbWksIGZ1bmN0aW9uKG1ldGEsIG5hbWUsIHZhbHVlKSB7XG5cdFx0XHRsZXQgbmFtZTE7XG5cdFx0XHRyZXR1cm4gbWV0YXNbbmFtZTEgPSBjaGFuZ2VDYXNlLmNhbWVsQ2FzZShuYW1lKV0gIT0gbnVsbCA/IG1ldGFzW25hbWUxXSA6IG1ldGFzW25hbWUxXSA9IGhlLnVuZXNjYXBlKHZhbHVlKTtcblx0XHR9KTtcblx0XHRjb250ZW50LmJvZHkucmVwbGFjZSgvPG1ldGFbXj5dKlxcc2NvbnRlbnQ9WyddKFteJ10qKVsnXVtePl0qKD86bmFtZXxwcm9wZXJ0eSk9WyddKFteJ10qKVsnXVtePl0qPi9nbWksIGZ1bmN0aW9uKG1ldGEsIHZhbHVlLCBuYW1lKSB7XG5cdFx0XHRsZXQgbmFtZTE7XG5cdFx0XHRyZXR1cm4gbWV0YXNbbmFtZTEgPSBjaGFuZ2VDYXNlLmNhbWVsQ2FzZShuYW1lKV0gIT0gbnVsbCA/IG1ldGFzW25hbWUxXSA6IG1ldGFzW25hbWUxXSA9IGhlLnVuZXNjYXBlKHZhbHVlKTtcblx0XHR9KTtcblx0XHRjb250ZW50LmJvZHkucmVwbGFjZSgvPG1ldGFbXj5dKlxcc2NvbnRlbnQ9W1wiXShbXlwiXSopW1wiXVtePl0qKD86bmFtZXxwcm9wZXJ0eSk9W1wiXShbXlwiXSopW1wiXVtePl0qPi9nbWksIGZ1bmN0aW9uKG1ldGEsIHZhbHVlLCBuYW1lKSB7XG5cdFx0XHRsZXQgbmFtZTE7XG5cdFx0XHRyZXR1cm4gbWV0YXNbbmFtZTEgPSBjaGFuZ2VDYXNlLmNhbWVsQ2FzZShuYW1lKV0gIT0gbnVsbCA/IG1ldGFzW25hbWUxXSA6IG1ldGFzW25hbWUxXSA9IGhlLnVuZXNjYXBlKHZhbHVlKTtcblx0XHR9KTtcblx0XHRpZiAobWV0YXMuZnJhZ21lbnQgPT09ICchJyAmJiAod2l0aEZyYWdtZW50ID09IG51bGwpKSB7XG5cdFx0XHRyZXR1cm4gT0VtYmVkLmdldFVybE1ldGEodXJsLCB0cnVlKTtcblx0XHR9XG5cdH1cblx0bGV0IGhlYWRlcnMgPSB1bmRlZmluZWQ7XG5cdGxldCBkYXRhID0gdW5kZWZpbmVkO1xuXG5cblx0aWYgKGNvbnRlbnQgJiYgY29udGVudC5oZWFkZXJzKSB7XG5cdFx0aGVhZGVycyA9IHt9O1xuXHRcdGNvbnN0IGhlYWRlck9iaiA9IGNvbnRlbnQuaGVhZGVycztcblx0XHRPYmplY3Qua2V5cyhoZWFkZXJPYmopLmZvckVhY2goKGhlYWRlcikgPT4ge1xuXHRcdFx0aGVhZGVyc1tjaGFuZ2VDYXNlLmNhbWVsQ2FzZShoZWFkZXIpXSA9IGhlYWRlck9ialtoZWFkZXJdO1xuXHRcdH0pO1xuXHR9XG5cdGlmIChjb250ZW50ICYmIGNvbnRlbnQuc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cblx0ZGF0YSA9IFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignb2VtYmVkOmFmdGVyUGFyc2VDb250ZW50Jywge1xuXHRcdG1ldGE6IG1ldGFzLFxuXHRcdGhlYWRlcnMsXG5cdFx0cGFyc2VkVXJsOiBjb250ZW50LnBhcnNlZFVybCxcblx0XHRjb250ZW50XG5cdH0pO1xuXHRyZXR1cm4gZGF0YTtcbn07XG5cbk9FbWJlZC5nZXRVcmxNZXRhV2l0aENhY2hlID0gZnVuY3Rpb24odXJsLCB3aXRoRnJhZ21lbnQpIHtcblx0Y29uc3QgY2FjaGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5PRW1iZWRDYWNoZS5maW5kT25lQnlJZCh1cmwpO1xuXHRpZiAoY2FjaGUgIT0gbnVsbCkge1xuXHRcdHJldHVybiBjYWNoZS5kYXRhO1xuXHR9XG5cdGNvbnN0IGRhdGEgPSBPRW1iZWQuZ2V0VXJsTWV0YSh1cmwsIHdpdGhGcmFnbWVudCk7XG5cdGlmIChkYXRhICE9IG51bGwpIHtcblx0XHR0cnkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuT0VtYmVkQ2FjaGUuY3JlYXRlV2l0aElkQW5kRGF0YSh1cmwsIGRhdGEpO1xuXHRcdH0gY2F0Y2ggKF9lcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignT0VtYmVkIGR1cGxpY2F0ZWQgcmVjb3JkJywgdXJsKTtcblx0XHR9XG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cbn07XG5cbmNvbnN0IGdldFJlbGV2YW50SGVhZGVycyA9IGZ1bmN0aW9uKGhlYWRlcnNPYmopIHtcblx0Y29uc3QgaGVhZGVycyA9IHt9O1xuXHRPYmplY3Qua2V5cyhoZWFkZXJzT2JqKS5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRjb25zdCB2YWx1ZSA9IGhlYWRlcnNPYmpba2V5XTtcblx0XHRjb25zdCBsb3dlckNhc2VLZXkgPSBrZXkudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoKGxvd2VyQ2FzZUtleSA9PT0gJ2NvbnRlbnR0eXBlJyB8fCBsb3dlckNhc2VLZXkgPT09ICdjb250ZW50bGVuZ3RoJykgJiYgKHZhbHVlICYmIHZhbHVlLnRyaW0oKSAhPT0gJycpKSB7XG5cdFx0XHRoZWFkZXJzW2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cdH0pO1xuXG5cdGlmIChPYmplY3Qua2V5cyhoZWFkZXJzKS5sZW5ndGggPiAwKSB7XG5cdFx0cmV0dXJuIGhlYWRlcnM7XG5cdH1cbn07XG5cbmNvbnN0IGdldFJlbGV2YW50TWV0YVRhZ3MgPSBmdW5jdGlvbihtZXRhT2JqKSB7XG5cdGNvbnN0IHRhZ3MgPSB7fTtcblx0T2JqZWN0LmtleXMobWV0YU9iaikuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0Y29uc3QgdmFsdWUgPSBtZXRhT2JqW2tleV07XG5cdFx0aWYgKC9eKG9nfGZifHR3aXR0ZXJ8b2VtYmVkfG1zYXBwbGljYXRpb24pLit8ZGVzY3JpcHRpb258dGl0bGV8cGFnZVRpdGxlJC8udGVzdChrZXkudG9Mb3dlckNhc2UoKSkgJiYgKHZhbHVlICYmIHZhbHVlLnRyaW0oKSAhPT0gJycpKSB7XG5cdFx0XHR0YWdzW2tleV0gPSB2YWx1ZTtcblx0XHR9XG5cdH0pO1xuXG5cdGlmIChPYmplY3Qua2V5cyh0YWdzKS5sZW5ndGggPiAwKSB7XG5cdFx0cmV0dXJuIHRhZ3M7XG5cdH1cbn07XG5cbk9FbWJlZC5yb2NrZXRVcmxQYXJzZXIgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG5cdGlmIChBcnJheS5pc0FycmF5KG1lc3NhZ2UudXJscykpIHtcblx0XHRsZXQgYXR0YWNobWVudHMgPSBbXTtcblx0XHRsZXQgY2hhbmdlZCA9IGZhbHNlO1xuXHRcdG1lc3NhZ2UudXJscy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdGlmIChpdGVtLmlnbm9yZVBhcnNlID09PSB0cnVlKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGlmIChpdGVtLnVybC5zdGFydHNXaXRoKCdncmFpbjovLycpKSB7XG5cdFx0XHRcdGNoYW5nZWQgPSB0cnVlO1xuXHRcdFx0XHRpdGVtLm1ldGEgPSB7XG5cdFx0XHRcdFx0c2FuZHN0b3JtOiB7XG5cdFx0XHRcdFx0XHRncmFpbjogaXRlbS5zYW5kc3Rvcm1WaWV3SW5mb1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCEvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KGl0ZW0udXJsKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBkYXRhID0gT0VtYmVkLmdldFVybE1ldGFXaXRoQ2FjaGUoaXRlbS51cmwpO1xuXHRcdFx0aWYgKGRhdGEgIT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoZGF0YS5hdHRhY2htZW50cykge1xuXHRcdFx0XHRcdHJldHVybiBhdHRhY2htZW50cyA9IF8udW5pb24oYXR0YWNobWVudHMsIGRhdGEuYXR0YWNobWVudHMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChkYXRhLm1ldGEgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0aXRlbS5tZXRhID0gZ2V0UmVsZXZhbnRNZXRhVGFncyhkYXRhLm1ldGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZGF0YS5oZWFkZXJzICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdGl0ZW0uaGVhZGVycyA9IGdldFJlbGV2YW50SGVhZGVycyhkYXRhLmhlYWRlcnMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpdGVtLnBhcnNlZFVybCA9IGRhdGEucGFyc2VkVXJsO1xuXHRcdFx0XHRcdHJldHVybiBjaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGlmIChhdHRhY2htZW50cy5sZW5ndGgpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldE1lc3NhZ2VBdHRhY2htZW50cyhtZXNzYWdlLl9pZCwgYXR0YWNobWVudHMpO1xuXHRcdH1cblx0XHRpZiAoY2hhbmdlZCA9PT0gdHJ1ZSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0VXJsc0J5SWQobWVzc2FnZS5faWQsIG1lc3NhZ2UudXJscyk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBtZXNzYWdlO1xufTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbWJlZCcsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0aWYgKHZhbHVlKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIE9FbWJlZC5yb2NrZXRVcmxQYXJzZXIsIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ0FQSV9FbWJlZCcpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LmNhbGxiYWNrcy5yZW1vdmUoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCAnQVBJX0VtYmVkJyk7XG5cdH1cbn0pO1xuIiwiLypnbG9iYWxzIGNoYW5nZUNhc2UgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IFVSTCBmcm9tICd1cmwnO1xuaW1wb3J0IFF1ZXJ5U3RyaW5nIGZyb20gJ3F1ZXJ5c3RyaW5nJztcblxuY2xhc3MgUHJvdmlkZXJzIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5wcm92aWRlcnMgPSBbXTtcblx0fVxuXG5cdHN0YXRpYyBnZXRDb25zdW1lclVybChwcm92aWRlciwgdXJsKSB7XG5cdFx0Y29uc3QgdXJsT2JqID0gVVJMLnBhcnNlKHByb3ZpZGVyLmVuZFBvaW50LCB0cnVlKTtcblx0XHR1cmxPYmoucXVlcnlbJ3VybCddID0gdXJsO1xuXHRcdGRlbGV0ZSB1cmxPYmouc2VhcmNoO1xuXHRcdHJldHVybiBVUkwuZm9ybWF0KHVybE9iaik7XG5cdH1cblxuXHRyZWdpc3RlclByb3ZpZGVyKHByb3ZpZGVyKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuXHR9XG5cblx0Z2V0UHJvdmlkZXJzKCkge1xuXHRcdHJldHVybiB0aGlzLnByb3ZpZGVycztcblx0fVxuXG5cdGdldFByb3ZpZGVyRm9yVXJsKHVybCkge1xuXHRcdHJldHVybiBfLmZpbmQodGhpcy5wcm92aWRlcnMsIGZ1bmN0aW9uKHByb3ZpZGVyKSB7XG5cdFx0XHRjb25zdCBjYW5kaWRhdGUgPSBfLmZpbmQocHJvdmlkZXIudXJscywgZnVuY3Rpb24ocmUpIHtcblx0XHRcdFx0cmV0dXJuIHJlLnRlc3QodXJsKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGNhbmRpZGF0ZSAhPSBudWxsO1xuXHRcdH0pO1xuXHR9XG59XG5cbmNvbnN0IHByb3ZpZGVycyA9IG5ldyBQcm92aWRlcnMoKTtcblxucHJvdmlkZXJzLnJlZ2lzdGVyUHJvdmlkZXIoe1xuXHR1cmxzOiBbbmV3IFJlZ0V4cCgnaHR0cHM/Oi8vc291bmRjbG91ZC5jb20vXFxcXFMrJyldLFxuXHRlbmRQb2ludDogJ2h0dHBzOi8vc291bmRjbG91ZC5jb20vb2VtYmVkP2Zvcm1hdD1qc29uJm1heGhlaWdodD0xNTAnXG59KTtcblxucHJvdmlkZXJzLnJlZ2lzdGVyUHJvdmlkZXIoe1xuXHR1cmxzOiBbbmV3IFJlZ0V4cCgnaHR0cHM/Oi8vdmltZW8uY29tL1teL10rJyksIG5ldyBSZWdFeHAoJ2h0dHBzPzovL3ZpbWVvLmNvbS9jaGFubmVscy9bXi9dKy9bXi9dKycpLCBuZXcgUmVnRXhwKCdodHRwczovL3ZpbWVvLmNvbS9ncm91cHMvW14vXSsvdmlkZW9zL1teL10rJyldLFxuXHRlbmRQb2ludDogJ2h0dHBzOi8vdmltZW8uY29tL2FwaS9vZW1iZWQuanNvbj9tYXhoZWlnaHQ9MjAwJ1xufSk7XG5cbnByb3ZpZGVycy5yZWdpc3RlclByb3ZpZGVyKHtcblx0dXJsczogW25ldyBSZWdFeHAoJ2h0dHBzPzovL3d3dy55b3V0dWJlLmNvbS9cXFxcUysnKSwgbmV3IFJlZ0V4cCgnaHR0cHM/Oi8veW91dHUuYmUvXFxcXFMrJyldLFxuXHRlbmRQb2ludDogJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL29lbWJlZD9tYXhoZWlnaHQ9MjAwJ1xufSk7XG5cbnByb3ZpZGVycy5yZWdpc3RlclByb3ZpZGVyKHtcblx0dXJsczogW25ldyBSZWdFeHAoJ2h0dHBzPzovL3d3dy5yZGlvLmNvbS9cXFxcUysnKSwgbmV3IFJlZ0V4cCgnaHR0cHM/Oi8vcmQuaW8vXFxcXFMrJyldLFxuXHRlbmRQb2ludDogJ2h0dHBzOi8vd3d3LnJkaW8uY29tL2FwaS9vZW1iZWQvP2Zvcm1hdD1qc29uJm1heGhlaWdodD0xNTAnXG59KTtcblxucHJvdmlkZXJzLnJlZ2lzdGVyUHJvdmlkZXIoe1xuXHR1cmxzOiBbbmV3IFJlZ0V4cCgnaHR0cHM/Oi8vd3d3LnNsaWRlc2hhcmUubmV0L1teL10rL1teL10rJyldLFxuXHRlbmRQb2ludDogJ2h0dHBzOi8vd3d3LnNsaWRlc2hhcmUubmV0L2FwaS9vZW1iZWQvMj9mb3JtYXQ9anNvbiZtYXhoZWlnaHQ9MjAwJ1xufSk7XG5cbnByb3ZpZGVycy5yZWdpc3RlclByb3ZpZGVyKHtcblx0dXJsczogW25ldyBSZWdFeHAoJ2h0dHBzPzovL3d3dy5kYWlseW1vdGlvbi5jb20vdmlkZW8vXFxcXFMrJyldLFxuXHRlbmRQb2ludDogJ2h0dHBzOi8vd3d3LmRhaWx5bW90aW9uLmNvbS9zZXJ2aWNlcy9vZW1iZWQ/bWF4aGVpZ2h0PTIwMCdcbn0pO1xuXG5Sb2NrZXRDaGF0Lm9lbWJlZCA9IHt9O1xuXG5Sb2NrZXRDaGF0Lm9lbWJlZC5wcm92aWRlcnMgPSBwcm92aWRlcnM7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnb2VtYmVkOmJlZm9yZUdldFVybENvbnRlbnQnLCBmdW5jdGlvbihkYXRhKSB7XG5cdGlmIChkYXRhLnBhcnNlZFVybCAhPSBudWxsKSB7XG5cdFx0Y29uc3QgdXJsID0gVVJMLmZvcm1hdChkYXRhLnBhcnNlZFVybCk7XG5cdFx0Y29uc3QgcHJvdmlkZXIgPSBwcm92aWRlcnMuZ2V0UHJvdmlkZXJGb3JVcmwodXJsKTtcblx0XHRpZiAocHJvdmlkZXIgIT0gbnVsbCkge1xuXHRcdFx0bGV0IGNvbnN1bWVyVXJsID0gUHJvdmlkZXJzLmdldENvbnN1bWVyVXJsKHByb3ZpZGVyLCB1cmwpO1xuXHRcdFx0Y29uc3VtZXJVcmwgPSBVUkwucGFyc2UoY29uc3VtZXJVcmwsIHRydWUpO1xuXHRcdFx0Xy5leHRlbmQoZGF0YS5wYXJzZWRVcmwsIGNvbnN1bWVyVXJsKTtcblx0XHRcdGRhdGEudXJsT2JqLnBvcnQgPSBjb25zdW1lclVybC5wb3J0O1xuXHRcdFx0ZGF0YS51cmxPYmouaG9zdG5hbWUgPSBjb25zdW1lclVybC5ob3N0bmFtZTtcblx0XHRcdGRhdGEudXJsT2JqLnBhdGhuYW1lID0gY29uc3VtZXJVcmwucGF0aG5hbWU7XG5cdFx0XHRkYXRhLnVybE9iai5xdWVyeSA9IGNvbnN1bWVyVXJsLnF1ZXJ5O1xuXHRcdFx0ZGVsZXRlIGRhdGEudXJsT2JqLnNlYXJjaDtcblx0XHRcdGRlbGV0ZSBkYXRhLnVybE9iai5ob3N0O1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZGF0YTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ29lbWJlZC1wcm92aWRlcnMtYmVmb3JlJyk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnb2VtYmVkOmFmdGVyUGFyc2VDb250ZW50JywgZnVuY3Rpb24oZGF0YSkge1xuXHRpZiAoZGF0YS5wYXJzZWRVcmwgJiYgZGF0YS5wYXJzZWRVcmwucXVlcnkpIHtcblx0XHRsZXQgcXVlcnlTdHJpbmcgPSBkYXRhLnBhcnNlZFVybC5xdWVyeTtcblx0XHRpZiAoXy5pc1N0cmluZyhkYXRhLnBhcnNlZFVybC5xdWVyeSkpIHtcblx0XHRcdHF1ZXJ5U3RyaW5nID0gUXVlcnlTdHJpbmcucGFyc2UoZGF0YS5wYXJzZWRVcmwucXVlcnkpO1xuXHRcdH1cblx0XHRpZiAocXVlcnlTdHJpbmcudXJsICE9IG51bGwpIHtcblx0XHRcdGNvbnN0IHVybCA9IHF1ZXJ5U3RyaW5nLnVybDtcblx0XHRcdGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJzLmdldFByb3ZpZGVyRm9yVXJsKHVybCk7XG5cdFx0XHRpZiAocHJvdmlkZXIgIT0gbnVsbCkge1xuXHRcdFx0XHRpZiAoZGF0YS5jb250ZW50ICYmIGRhdGEuY29udGVudC5ib2R5KSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGNvbnN0IG1ldGFzID0gSlNPTi5wYXJzZShkYXRhLmNvbnRlbnQuYm9keSk7XG5cdFx0XHRcdFx0XHRfLmVhY2gobWV0YXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKF8uaXNTdHJpbmcodmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGRhdGEubWV0YVtjaGFuZ2VDYXNlLmNhbWVsQ2FzZShgb2VtYmVkXyR7IGtleSB9YCldID0gdmFsdWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0ZGF0YS5tZXRhWydvZW1iZWRVcmwnXSA9IHVybDtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gZGF0YTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ29lbWJlZC1wcm92aWRlcnMtYWZ0ZXInKTtcbiIsIi8qIGdsb2JhbHMgZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBVUkwgZnJvbSAndXJsJztcbmltcG9ydCBRdWVyeVN0cmluZyBmcm9tICdxdWVyeXN0cmluZyc7XG5cbmNvbnN0IHJlY3Vyc2l2ZVJlbW92ZSA9IChtZXNzYWdlLCBkZWVwID0gMSkgPT4ge1xuXHRpZiAobWVzc2FnZSkge1xuXHRcdGlmICgnYXR0YWNobWVudHMnIGluIG1lc3NhZ2UgJiYgbWVzc2FnZS5hdHRhY2htZW50cyAhPT0gbnVsbCAmJiBkZWVwIDwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01lc3NhZ2VfUXVvdGVDaGFpbkxpbWl0JykpIHtcblx0XHRcdG1lc3NhZ2UuYXR0YWNobWVudHMubWFwKChtc2cpID0+IHJlY3Vyc2l2ZVJlbW92ZShtc2csIGRlZXAgKyAxKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZShtZXNzYWdlLmF0dGFjaG1lbnRzKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG1lc3NhZ2U7XG59O1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2JlZm9yZVNhdmVNZXNzYWdlJywgKG1zZykgPT4ge1xuXHRpZiAobXNnICYmIG1zZy51cmxzKSB7XG5cdFx0bXNnLnVybHMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuXHRcdFx0aWYgKGl0ZW0udXJsLmluZGV4T2YoTWV0ZW9yLmFic29sdXRlVXJsKCkpID09PSAwKSB7XG5cdFx0XHRcdGNvbnN0IHVybE9iaiA9IFVSTC5wYXJzZShpdGVtLnVybCk7XG5cdFx0XHRcdGlmICh1cmxPYmoucXVlcnkpIHtcblx0XHRcdFx0XHRjb25zdCBxdWVyeVN0cmluZyA9IFF1ZXJ5U3RyaW5nLnBhcnNlKHVybE9iai5xdWVyeSk7XG5cdFx0XHRcdFx0aWYgKF8uaXNTdHJpbmcocXVlcnlTdHJpbmcubXNnKSkgeyAvLyBKdW1wLXRvIHF1ZXJ5IHBhcmFtXG5cdFx0XHRcdFx0XHRjb25zdCBqdW1wVG9NZXNzYWdlID0gcmVjdXJzaXZlUmVtb3ZlKFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHF1ZXJ5U3RyaW5nLm1zZykpO1xuXHRcdFx0XHRcdFx0aWYgKGp1bXBUb01lc3NhZ2UpIHtcblx0XHRcdFx0XHRcdFx0bXNnLmF0dGFjaG1lbnRzID0gbXNnLmF0dGFjaG1lbnRzIHx8IFtdO1xuXHRcdFx0XHRcdFx0XHRtc2cuYXR0YWNobWVudHMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0J3RleHQnIDoganVtcFRvTWVzc2FnZS5tc2csXG5cdFx0XHRcdFx0XHRcdFx0J3RyYW5zbGF0aW9ucyc6IGp1bXBUb01lc3NhZ2UudHJhbnNsYXRpb25zLFxuXHRcdFx0XHRcdFx0XHRcdCdhdXRob3JfbmFtZScgOiBqdW1wVG9NZXNzYWdlLmFsaWFzIHx8IGp1bXBUb01lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0XHRcdFx0XHQnYXV0aG9yX2ljb24nIDogZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lKGp1bXBUb01lc3NhZ2UudS51c2VybmFtZSksXG5cdFx0XHRcdFx0XHRcdFx0J21lc3NhZ2VfbGluaycgOiBpdGVtLnVybCxcblx0XHRcdFx0XHRcdFx0XHQnYXR0YWNobWVudHMnIDoganVtcFRvTWVzc2FnZS5hdHRhY2htZW50cyB8fCBbXSxcblx0XHRcdFx0XHRcdFx0XHQndHMnOiBqdW1wVG9NZXNzYWdlLnRzXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRpdGVtLmlnbm9yZVBhcnNlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gbXNnO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnanVtcFRvTWVzc2FnZScpO1xuIiwiXG5Sb2NrZXRDaGF0Lm1vZGVscy5PRW1iZWRDYWNoZSA9IG5ldyBjbGFzcyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ29lbWJlZF9jYWNoZScpO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndXBkYXRlZEF0JzogMSB9KTtcblx0fVxuXG5cdC8vRklORCBPTkVcblx0ZmluZE9uZUJ5SWQoX2lkLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRfaWRcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0Ly9JTlNFUlRcblx0Y3JlYXRlV2l0aElkQW5kRGF0YShfaWQsIGRhdGEpIHtcblx0XHRjb25zdCByZWNvcmQgPSB7XG5cdFx0XHRfaWQsXG5cdFx0XHRkYXRhLFxuXHRcdFx0dXBkYXRlZEF0OiBuZXcgRGF0ZVxuXHRcdH07XG5cdFx0cmVjb3JkLl9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0cmV0dXJuIHJlY29yZDtcblx0fVxuXG5cdC8vUkVNT1ZFXG5cdHJlbW92ZUFmdGVyRGF0ZShkYXRlKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR1cGRhdGVkQXQ6IHtcblx0XHRcdFx0JGx0ZTogZGF0ZVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHF1ZXJ5KTtcblx0fVxufTtcblxuXG4iXX0=
