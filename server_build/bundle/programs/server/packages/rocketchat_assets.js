(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var WebAppHashing = Package['webapp-hashing'].WebAppHashing;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:assets":{"server":{"assets.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_assets/server/assets.js                                                                  //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let sizeOf;
module.watch(require("image-size"), {
  default(v) {
    sizeOf = v;
  }

}, 1);
let mime;
module.watch(require("mime-type/with-db"), {
  default(v) {
    mime = v;
  }

}, 2);
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 3);
mime.extensions['image/vnd.microsoft.icon'] = ['ico'];
const RocketChatAssetsInstance = new RocketChatFile.GridFS({
  name: 'assets'
});
this.RocketChatAssetsInstance = RocketChatAssetsInstance;
const assets = {
  logo: {
    label: 'logo (svg, png, jpg)',
    defaultUrl: 'images/logo/logo.svg',
    constraints: {
      type: 'image',
      extensions: ['svg', 'png', 'jpg', 'jpeg'],
      width: undefined,
      height: undefined
    },
    wizard: {
      step: 3,
      order: 2
    }
  },
  background: {
    label: 'login background (svg, png, jpg)',
    defaultUrl: undefined,
    constraints: {
      type: 'image',
      extensions: ['svg', 'png', 'jpg', 'jpeg'],
      width: undefined,
      height: undefined
    }
  },
  favicon_ico: {
    label: 'favicon (ico)',
    defaultUrl: 'favicon.ico',
    constraints: {
      type: 'image',
      extensions: ['ico'],
      width: undefined,
      height: undefined
    }
  },
  favicon: {
    label: 'favicon (svg)',
    defaultUrl: 'images/logo/icon.svg',
    constraints: {
      type: 'image',
      extensions: ['svg'],
      width: undefined,
      height: undefined
    }
  },
  favicon_16: {
    label: 'favicon 16x16 (png)',
    defaultUrl: 'images/logo/favicon-16x16.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 16,
      height: 16
    }
  },
  favicon_32: {
    label: 'favicon 32x32 (png)',
    defaultUrl: 'images/logo/favicon-32x32.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 32,
      height: 32
    }
  },
  favicon_192: {
    label: 'android-chrome 192x192 (png)',
    defaultUrl: 'images/logo/android-chrome-192x192.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 192,
      height: 192
    }
  },
  favicon_512: {
    label: 'android-chrome 512x512 (png)',
    defaultUrl: 'images/logo/512x512.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 512,
      height: 512
    }
  },
  touchicon_180: {
    label: 'apple-touch-icon 180x180 (png)',
    defaultUrl: 'images/logo/apple-touch-icon.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 180,
      height: 180
    }
  },
  touchicon_180_pre: {
    label: 'apple-touch-icon-precomposed 180x180 (png)',
    defaultUrl: 'images/logo/apple-touch-icon-precomposed.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 180,
      height: 180
    }
  },
  tile_144: {
    label: 'mstile 144x144 (png)',
    defaultUrl: 'images/logo/mstile-144x144.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 144,
      height: 144
    }
  },
  tile_150: {
    label: 'mstile 150x150 (png)',
    defaultUrl: 'images/logo/mstile-150x150.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 150,
      height: 150
    }
  },
  tile_310_square: {
    label: 'mstile 310x310 (png)',
    defaultUrl: 'images/logo/mstile-310x310.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 310,
      height: 310
    }
  },
  tile_310_wide: {
    label: 'mstile 310x150 (png)',
    defaultUrl: 'images/logo/mstile-310x150.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 310,
      height: 150
    }
  },
  safari_pinned: {
    label: 'safari pinned tab (svg)',
    defaultUrl: 'images/logo/safari-pinned-tab.svg',
    constraints: {
      type: 'image',
      extensions: ['svg'],
      width: undefined,
      height: undefined
    }
  }
};
RocketChat.Assets = new class {
  get mime() {
    return mime;
  }

  get assets() {
    return assets;
  }

  setAsset(binaryContent, contentType, asset) {
    if (!assets[asset]) {
      throw new Meteor.Error('error-invalid-asset', 'Invalid asset', {
        function: 'RocketChat.Assets.setAsset'
      });
    }

    const extension = mime.extension(contentType);

    if (assets[asset].constraints.extensions.includes(extension) === false) {
      throw new Meteor.Error(contentType, `Invalid file type: ${contentType}`, {
        function: 'RocketChat.Assets.setAsset',
        errorTitle: 'error-invalid-file-type'
      });
    }

    const file = new Buffer(binaryContent, 'binary');

    if (assets[asset].constraints.width || assets[asset].constraints.height) {
      const dimensions = sizeOf(file);

      if (assets[asset].constraints.width && assets[asset].constraints.width !== dimensions.width) {
        throw new Meteor.Error('error-invalid-file-width', 'Invalid file width', {
          function: 'Invalid file width'
        });
      }

      if (assets[asset].constraints.height && assets[asset].constraints.height !== dimensions.height) {
        throw new Meteor.Error('error-invalid-file-height');
      }
    }

    const rs = RocketChatFile.bufferToStream(file);
    RocketChatAssetsInstance.deleteFile(asset);
    const ws = RocketChatAssetsInstance.createWriteStream(asset, contentType);
    ws.on('end', Meteor.bindEnvironment(function () {
      return Meteor.setTimeout(function () {
        const key = `Assets_${asset}`;
        const value = {
          url: `assets/${asset}.${extension}`,
          defaultUrl: assets[asset].defaultUrl
        };
        RocketChat.settings.updateById(key, value);
        return RocketChat.Assets.processAsset(key, value);
      }, 200);
    }));
    rs.pipe(ws);
  }

  unsetAsset(asset) {
    if (!assets[asset]) {
      throw new Meteor.Error('error-invalid-asset', 'Invalid asset', {
        function: 'RocketChat.Assets.unsetAsset'
      });
    }

    RocketChatAssetsInstance.deleteFile(asset);
    const key = `Assets_${asset}`;
    const value = {
      defaultUrl: assets[asset].defaultUrl
    };
    RocketChat.settings.updateById(key, value);
    RocketChat.Assets.processAsset(key, value);
  }

  refreshClients() {
    return process.emit('message', {
      refresh: 'client'
    });
  }

  processAsset(settingKey, settingValue) {
    if (settingKey.indexOf('Assets_') !== 0) {
      return;
    }

    const assetKey = settingKey.replace(/^Assets_/, '');
    const assetValue = assets[assetKey];

    if (!assetValue) {
      return;
    }

    if (!settingValue || !settingValue.url) {
      assetValue.cache = undefined;
      return;
    }

    const file = RocketChatAssetsInstance.getFileSync(assetKey);

    if (!file) {
      assetValue.cache = undefined;
      return;
    }

    const hash = crypto.createHash('sha1').update(file.buffer).digest('hex');
    const extension = settingValue.url.split('.').pop();
    return assetValue.cache = {
      path: `assets/${assetKey}.${extension}`,
      cacheable: false,
      sourceMapUrl: undefined,
      where: 'client',
      type: 'asset',
      content: file.buffer,
      extension,
      url: `/assets/${assetKey}.${extension}?${hash}`,
      size: file.length,
      uploadDate: file.uploadDate,
      contentType: file.contentType,
      hash
    };
  }

}();
RocketChat.settings.addGroup('Assets');
RocketChat.settings.add('Assets_SvgFavicon_Enable', true, {
  type: 'boolean',
  group: 'Assets',
  i18nLabel: 'Enable_Svg_Favicon'
});

function addAssetToSetting(key, value) {
  return RocketChat.settings.add(`Assets_${key}`, {
    defaultUrl: value.defaultUrl
  }, {
    type: 'asset',
    group: 'Assets',
    fileConstraints: value.constraints,
    i18nLabel: value.label,
    asset: key,
    public: true,
    wizard: value.wizard
  });
}

for (const key of Object.keys(assets)) {
  const value = assets[key];
  addAssetToSetting(key, value);
}

RocketChat.models.Settings.find().observe({
  added(record) {
    return RocketChat.Assets.processAsset(record._id, record.value);
  },

  changed(record) {
    return RocketChat.Assets.processAsset(record._id, record.value);
  },

  removed(record) {
    return RocketChat.Assets.processAsset(record._id, undefined);
  }

});
Meteor.startup(function () {
  return Meteor.setTimeout(function () {
    return process.emit('message', {
      refresh: 'client'
    });
  }, 200);
});
const calculateClientHash = WebAppHashing.calculateClientHash;

WebAppHashing.calculateClientHash = function (manifest, includeFilter, runtimeConfigOverride) {
  for (const key of Object.keys(assets)) {
    const value = assets[key];

    if (!value.cache && !value.defaultUrl) {
      continue;
    }

    let cache = {};

    if (value.cache) {
      cache = {
        path: value.cache.path,
        cacheable: value.cache.cacheable,
        sourceMapUrl: value.cache.sourceMapUrl,
        where: value.cache.where,
        type: value.cache.type,
        url: value.cache.url,
        size: value.cache.size,
        hash: value.cache.hash
      };
      WebAppInternals.staticFiles[`/__cordova/assets/${key}`] = value.cache;
      WebAppInternals.staticFiles[`/__cordova/assets/${key}.${value.cache.extension}`] = value.cache;
    } else {
      const extension = value.defaultUrl.split('.').pop();
      cache = {
        path: `assets/${key}.${extension}`,
        cacheable: false,
        sourceMapUrl: undefined,
        where: 'client',
        type: 'asset',
        url: `/assets/${key}.${extension}?v3`,
        hash: 'v3'
      };
      WebAppInternals.staticFiles[`/__cordova/assets/${key}`] = WebAppInternals.staticFiles[`/__cordova/${value.defaultUrl}`];
      WebAppInternals.staticFiles[`/__cordova/assets/${key}.${extension}`] = WebAppInternals.staticFiles[`/__cordova/${value.defaultUrl}`];
    }

    const manifestItem = _.findWhere(manifest, {
      path: key
    });

    if (manifestItem) {
      const index = manifest.indexOf(manifestItem);
      manifest[index] = cache;
    } else {
      manifest.push(cache);
    }
  }

  return calculateClientHash.call(this, manifest, includeFilter, runtimeConfigOverride);
};

Meteor.methods({
  refreshClients() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'refreshClients'
      });
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'manage-assets');

    if (!hasPermission) {
      throw new Meteor.Error('error-action-not-allowed', 'Managing assets not allowed', {
        method: 'refreshClients',
        action: 'Managing_assets'
      });
    }

    return RocketChat.Assets.refreshClients();
  },

  unsetAsset(asset) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unsetAsset'
      });
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'manage-assets');

    if (!hasPermission) {
      throw new Meteor.Error('error-action-not-allowed', 'Managing assets not allowed', {
        method: 'unsetAsset',
        action: 'Managing_assets'
      });
    }

    return RocketChat.Assets.unsetAsset(asset);
  },

  setAsset(binaryContent, contentType, asset) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setAsset'
      });
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'manage-assets');

    if (!hasPermission) {
      throw new Meteor.Error('error-action-not-allowed', 'Managing assets not allowed', {
        method: 'setAsset',
        action: 'Managing_assets'
      });
    }

    RocketChat.Assets.setAsset(binaryContent, contentType, asset);
  }

});
WebApp.connectHandlers.use('/assets/', Meteor.bindEnvironment(function (req, res, next) {
  const params = {
    asset: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')).replace(/\.[^.]*$/, '')
  };
  const file = assets[params.asset] && assets[params.asset].cache;

  if (!file) {
    if (assets[params.asset] && assets[params.asset].defaultUrl) {
      req.url = `/${assets[params.asset].defaultUrl}`;
      WebAppInternals.staticFilesMiddleware(WebAppInternals.staticFiles, req, res, next);
    } else {
      res.writeHead(404);
      res.end();
    }

    return;
  }

  const reqModifiedHeader = req.headers['if-modified-since'];

  if (reqModifiedHeader) {
    if (reqModifiedHeader === (file.uploadDate && file.uploadDate.toUTCString())) {
      res.setHeader('Last-Modified', reqModifiedHeader);
      res.writeHead(304);
      res.end();
      return;
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=0');
  res.setHeader('Expires', '-1');
  res.setHeader('Last-Modified', file.uploadDate && file.uploadDate.toUTCString() || new Date().toUTCString());
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Length', file.size);
  res.writeHead(200);
  res.end(file.content);
}));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:assets/server/assets.js");

/* Exports */
Package._define("rocketchat:assets");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_assets.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphc3NldHMvc2VydmVyL2Fzc2V0cy5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzaXplT2YiLCJtaW1lIiwiY3J5cHRvIiwiZXh0ZW5zaW9ucyIsIlJvY2tldENoYXRBc3NldHNJbnN0YW5jZSIsIlJvY2tldENoYXRGaWxlIiwiR3JpZEZTIiwibmFtZSIsImFzc2V0cyIsImxvZ28iLCJsYWJlbCIsImRlZmF1bHRVcmwiLCJjb25zdHJhaW50cyIsInR5cGUiLCJ3aWR0aCIsInVuZGVmaW5lZCIsImhlaWdodCIsIndpemFyZCIsInN0ZXAiLCJvcmRlciIsImJhY2tncm91bmQiLCJmYXZpY29uX2ljbyIsImZhdmljb24iLCJmYXZpY29uXzE2IiwiZmF2aWNvbl8zMiIsImZhdmljb25fMTkyIiwiZmF2aWNvbl81MTIiLCJ0b3VjaGljb25fMTgwIiwidG91Y2hpY29uXzE4MF9wcmUiLCJ0aWxlXzE0NCIsInRpbGVfMTUwIiwidGlsZV8zMTBfc3F1YXJlIiwidGlsZV8zMTBfd2lkZSIsInNhZmFyaV9waW5uZWQiLCJSb2NrZXRDaGF0IiwiQXNzZXRzIiwic2V0QXNzZXQiLCJiaW5hcnlDb250ZW50IiwiY29udGVudFR5cGUiLCJhc3NldCIsIk1ldGVvciIsIkVycm9yIiwiZnVuY3Rpb24iLCJleHRlbnNpb24iLCJpbmNsdWRlcyIsImVycm9yVGl0bGUiLCJmaWxlIiwiQnVmZmVyIiwiZGltZW5zaW9ucyIsInJzIiwiYnVmZmVyVG9TdHJlYW0iLCJkZWxldGVGaWxlIiwid3MiLCJjcmVhdGVXcml0ZVN0cmVhbSIsIm9uIiwiYmluZEVudmlyb25tZW50Iiwic2V0VGltZW91dCIsImtleSIsInZhbHVlIiwidXJsIiwic2V0dGluZ3MiLCJ1cGRhdGVCeUlkIiwicHJvY2Vzc0Fzc2V0IiwicGlwZSIsInVuc2V0QXNzZXQiLCJyZWZyZXNoQ2xpZW50cyIsInByb2Nlc3MiLCJlbWl0IiwicmVmcmVzaCIsInNldHRpbmdLZXkiLCJzZXR0aW5nVmFsdWUiLCJpbmRleE9mIiwiYXNzZXRLZXkiLCJyZXBsYWNlIiwiYXNzZXRWYWx1ZSIsImNhY2hlIiwiZ2V0RmlsZVN5bmMiLCJoYXNoIiwiY3JlYXRlSGFzaCIsInVwZGF0ZSIsImJ1ZmZlciIsImRpZ2VzdCIsInNwbGl0IiwicG9wIiwicGF0aCIsImNhY2hlYWJsZSIsInNvdXJjZU1hcFVybCIsIndoZXJlIiwiY29udGVudCIsInNpemUiLCJsZW5ndGgiLCJ1cGxvYWREYXRlIiwiYWRkR3JvdXAiLCJhZGQiLCJncm91cCIsImkxOG5MYWJlbCIsImFkZEFzc2V0VG9TZXR0aW5nIiwiZmlsZUNvbnN0cmFpbnRzIiwicHVibGljIiwiT2JqZWN0Iiwia2V5cyIsIm1vZGVscyIsIlNldHRpbmdzIiwiZmluZCIsIm9ic2VydmUiLCJhZGRlZCIsInJlY29yZCIsIl9pZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwic3RhcnR1cCIsImNhbGN1bGF0ZUNsaWVudEhhc2giLCJXZWJBcHBIYXNoaW5nIiwibWFuaWZlc3QiLCJpbmNsdWRlRmlsdGVyIiwicnVudGltZUNvbmZpZ092ZXJyaWRlIiwiV2ViQXBwSW50ZXJuYWxzIiwic3RhdGljRmlsZXMiLCJtYW5pZmVzdEl0ZW0iLCJmaW5kV2hlcmUiLCJpbmRleCIsInB1c2giLCJjYWxsIiwibWV0aG9kcyIsInVzZXJJZCIsIm1ldGhvZCIsImhhc1Blcm1pc3Npb24iLCJhdXRoeiIsImFjdGlvbiIsIldlYkFwcCIsImNvbm5lY3RIYW5kbGVycyIsInVzZSIsInJlcSIsInJlcyIsIm5leHQiLCJwYXJhbXMiLCJkZWNvZGVVUklDb21wb25lbnQiLCJzdGF0aWNGaWxlc01pZGRsZXdhcmUiLCJ3cml0ZUhlYWQiLCJlbmQiLCJyZXFNb2RpZmllZEhlYWRlciIsImhlYWRlcnMiLCJ0b1VUQ1N0cmluZyIsInNldEhlYWRlciIsIkRhdGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsTUFBSjtBQUFXTCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDQyxhQUFPRCxDQUFQO0FBQVM7O0FBQXJCLENBQW5DLEVBQTBELENBQTFEO0FBQTZELElBQUlFLElBQUo7QUFBU04sT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNFLFdBQUtGLENBQUw7QUFBTzs7QUFBbkIsQ0FBMUMsRUFBK0QsQ0FBL0Q7QUFBa0UsSUFBSUcsTUFBSjtBQUFXUCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsUUFBUixDQUFiLEVBQStCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDRyxhQUFPSCxDQUFQO0FBQVM7O0FBQXJCLENBQS9CLEVBQXNELENBQXREO0FBTzVORSxLQUFLRSxVQUFMLENBQWdCLDBCQUFoQixJQUE4QyxDQUFDLEtBQUQsQ0FBOUM7QUFFQSxNQUFNQywyQkFBMkIsSUFBSUMsZUFBZUMsTUFBbkIsQ0FBMEI7QUFDMURDLFFBQU07QUFEb0QsQ0FBMUIsQ0FBakM7QUFJQSxLQUFLSCx3QkFBTCxHQUFnQ0Esd0JBQWhDO0FBRUEsTUFBTUksU0FBUztBQUNkQyxRQUFNO0FBQ0xDLFdBQU8sc0JBREY7QUFFTEMsZ0JBQVksc0JBRlA7QUFHTEMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLE1BQXRCLENBRkE7QUFHWlcsYUFBT0MsU0FISztBQUlaQyxjQUFRRDtBQUpJLEtBSFI7QUFTTEUsWUFBUTtBQUNQQyxZQUFNLENBREM7QUFFUEMsYUFBTztBQUZBO0FBVEgsR0FEUTtBQWVkQyxjQUFZO0FBQ1hWLFdBQU8sa0NBREk7QUFFWEMsZ0JBQVlJLFNBRkQ7QUFHWEgsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLE1BQXRCLENBRkE7QUFHWlcsYUFBT0MsU0FISztBQUlaQyxjQUFRRDtBQUpJO0FBSEYsR0FmRTtBQXlCZE0sZUFBYTtBQUNaWCxXQUFPLGVBREs7QUFFWkMsZ0JBQVksYUFGQTtBQUdaQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBT0MsU0FISztBQUlaQyxjQUFRRDtBQUpJO0FBSEQsR0F6QkM7QUFtQ2RPLFdBQVM7QUFDUlosV0FBTyxlQURDO0FBRVJDLGdCQUFZLHNCQUZKO0FBR1JDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPQyxTQUhLO0FBSVpDLGNBQVFEO0FBSkk7QUFITCxHQW5DSztBQTZDZFEsY0FBWTtBQUNYYixXQUFPLHFCQURJO0FBRVhDLGdCQUFZLCtCQUZEO0FBR1hDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEVBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEYsR0E3Q0U7QUF1RGRRLGNBQVk7QUFDWGQsV0FBTyxxQkFESTtBQUVYQyxnQkFBWSwrQkFGRDtBQUdYQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBTyxFQUhLO0FBSVpFLGNBQVE7QUFKSTtBQUhGLEdBdkRFO0FBaUVkUyxlQUFhO0FBQ1pmLFdBQU8sOEJBREs7QUFFWkMsZ0JBQVksd0NBRkE7QUFHWkMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFIRCxHQWpFQztBQTJFZFUsZUFBYTtBQUNaaEIsV0FBTyw4QkFESztBQUVaQyxnQkFBWSx5QkFGQTtBQUdaQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBTyxHQUhLO0FBSVpFLGNBQVE7QUFKSTtBQUhELEdBM0VDO0FBcUZkVyxpQkFBZTtBQUNkakIsV0FBTyxnQ0FETztBQUVkQyxnQkFBWSxrQ0FGRTtBQUdkQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBTyxHQUhLO0FBSVpFLGNBQVE7QUFKSTtBQUhDLEdBckZEO0FBK0ZkWSxxQkFBbUI7QUFDbEJsQixXQUFPLDRDQURXO0FBRWxCQyxnQkFBWSw4Q0FGTTtBQUdsQkMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFISyxHQS9GTDtBQXlHZGEsWUFBVTtBQUNUbkIsV0FBTyxzQkFERTtBQUVUQyxnQkFBWSxnQ0FGSDtBQUdUQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBTyxHQUhLO0FBSVpFLGNBQVE7QUFKSTtBQUhKLEdBekdJO0FBbUhkYyxZQUFVO0FBQ1RwQixXQUFPLHNCQURFO0FBRVRDLGdCQUFZLGdDQUZIO0FBR1RDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEdBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEosR0FuSEk7QUE2SGRlLG1CQUFpQjtBQUNoQnJCLFdBQU8sc0JBRFM7QUFFaEJDLGdCQUFZLGdDQUZJO0FBR2hCQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBTyxHQUhLO0FBSVpFLGNBQVE7QUFKSTtBQUhHLEdBN0hIO0FBdUlkZ0IsaUJBQWU7QUFDZHRCLFdBQU8sc0JBRE87QUFFZEMsZ0JBQVksZ0NBRkU7QUFHZEMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFIQyxHQXZJRDtBQWlKZGlCLGlCQUFlO0FBQ2R2QixXQUFPLHlCQURPO0FBRWRDLGdCQUFZLG1DQUZFO0FBR2RDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPQyxTQUhLO0FBSVpDLGNBQVFEO0FBSkk7QUFIQztBQWpKRCxDQUFmO0FBNkpBbUIsV0FBV0MsTUFBWCxHQUFvQixJQUFLLE1BQU07QUFDOUIsTUFBSWxDLElBQUosR0FBVztBQUNWLFdBQU9BLElBQVA7QUFDQTs7QUFFRCxNQUFJTyxNQUFKLEdBQWE7QUFDWixXQUFPQSxNQUFQO0FBQ0E7O0FBRUQ0QixXQUFTQyxhQUFULEVBQXdCQyxXQUF4QixFQUFxQ0MsS0FBckMsRUFBNEM7QUFDM0MsUUFBSSxDQUFDL0IsT0FBTytCLEtBQVAsQ0FBTCxFQUFvQjtBQUNuQixZQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIscUJBQWpCLEVBQXdDLGVBQXhDLEVBQXlEO0FBQzlEQyxrQkFBVTtBQURvRCxPQUF6RCxDQUFOO0FBR0E7O0FBRUQsVUFBTUMsWUFBWTFDLEtBQUswQyxTQUFMLENBQWVMLFdBQWYsQ0FBbEI7O0FBQ0EsUUFBSTlCLE9BQU8rQixLQUFQLEVBQWMzQixXQUFkLENBQTBCVCxVQUExQixDQUFxQ3lDLFFBQXJDLENBQThDRCxTQUE5QyxNQUE2RCxLQUFqRSxFQUF3RTtBQUN2RSxZQUFNLElBQUlILE9BQU9DLEtBQVgsQ0FBaUJILFdBQWpCLEVBQStCLHNCQUFzQkEsV0FBYSxFQUFsRSxFQUFxRTtBQUMxRUksa0JBQVUsNEJBRGdFO0FBRTFFRyxvQkFBWTtBQUY4RCxPQUFyRSxDQUFOO0FBSUE7O0FBRUQsVUFBTUMsT0FBTyxJQUFJQyxNQUFKLENBQVdWLGFBQVgsRUFBMEIsUUFBMUIsQ0FBYjs7QUFDQSxRQUFJN0IsT0FBTytCLEtBQVAsRUFBYzNCLFdBQWQsQ0FBMEJFLEtBQTFCLElBQW1DTixPQUFPK0IsS0FBUCxFQUFjM0IsV0FBZCxDQUEwQkksTUFBakUsRUFBeUU7QUFDeEUsWUFBTWdDLGFBQWFoRCxPQUFPOEMsSUFBUCxDQUFuQjs7QUFDQSxVQUFJdEMsT0FBTytCLEtBQVAsRUFBYzNCLFdBQWQsQ0FBMEJFLEtBQTFCLElBQW1DTixPQUFPK0IsS0FBUCxFQUFjM0IsV0FBZCxDQUEwQkUsS0FBMUIsS0FBb0NrQyxXQUFXbEMsS0FBdEYsRUFBNkY7QUFDNUYsY0FBTSxJQUFJMEIsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsb0JBQTdDLEVBQW1FO0FBQ3hFQyxvQkFBVTtBQUQ4RCxTQUFuRSxDQUFOO0FBR0E7O0FBQ0QsVUFBSWxDLE9BQU8rQixLQUFQLEVBQWMzQixXQUFkLENBQTBCSSxNQUExQixJQUFvQ1IsT0FBTytCLEtBQVAsRUFBYzNCLFdBQWQsQ0FBMEJJLE1BQTFCLEtBQXFDZ0MsV0FBV2hDLE1BQXhGLEVBQWdHO0FBQy9GLGNBQU0sSUFBSXdCLE9BQU9DLEtBQVgsQ0FBaUIsMkJBQWpCLENBQU47QUFDQTtBQUNEOztBQUVELFVBQU1RLEtBQUs1QyxlQUFlNkMsY0FBZixDQUE4QkosSUFBOUIsQ0FBWDtBQUNBMUMsNkJBQXlCK0MsVUFBekIsQ0FBb0NaLEtBQXBDO0FBRUEsVUFBTWEsS0FBS2hELHlCQUF5QmlELGlCQUF6QixDQUEyQ2QsS0FBM0MsRUFBa0RELFdBQWxELENBQVg7QUFDQWMsT0FBR0UsRUFBSCxDQUFNLEtBQU4sRUFBYWQsT0FBT2UsZUFBUCxDQUF1QixZQUFXO0FBQzlDLGFBQU9mLE9BQU9nQixVQUFQLENBQWtCLFlBQVc7QUFDbkMsY0FBTUMsTUFBTyxVQUFVbEIsS0FBTyxFQUE5QjtBQUNBLGNBQU1tQixRQUFRO0FBQ2JDLGVBQU0sVUFBVXBCLEtBQU8sSUFBSUksU0FBVyxFQUR6QjtBQUViaEMsc0JBQVlILE9BQU8rQixLQUFQLEVBQWM1QjtBQUZiLFNBQWQ7QUFLQXVCLG1CQUFXMEIsUUFBWCxDQUFvQkMsVUFBcEIsQ0FBK0JKLEdBQS9CLEVBQW9DQyxLQUFwQztBQUNBLGVBQU94QixXQUFXQyxNQUFYLENBQWtCMkIsWUFBbEIsQ0FBK0JMLEdBQS9CLEVBQW9DQyxLQUFwQyxDQUFQO0FBQ0EsT0FUTSxFQVNKLEdBVEksQ0FBUDtBQVVBLEtBWFksQ0FBYjtBQWFBVCxPQUFHYyxJQUFILENBQVFYLEVBQVI7QUFDQTs7QUFFRFksYUFBV3pCLEtBQVgsRUFBa0I7QUFDakIsUUFBSSxDQUFDL0IsT0FBTytCLEtBQVAsQ0FBTCxFQUFvQjtBQUNuQixZQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIscUJBQWpCLEVBQXdDLGVBQXhDLEVBQXlEO0FBQzlEQyxrQkFBVTtBQURvRCxPQUF6RCxDQUFOO0FBR0E7O0FBRUR0Qyw2QkFBeUIrQyxVQUF6QixDQUFvQ1osS0FBcEM7QUFDQSxVQUFNa0IsTUFBTyxVQUFVbEIsS0FBTyxFQUE5QjtBQUNBLFVBQU1tQixRQUFRO0FBQ2IvQyxrQkFBWUgsT0FBTytCLEtBQVAsRUFBYzVCO0FBRGIsS0FBZDtBQUlBdUIsZUFBVzBCLFFBQVgsQ0FBb0JDLFVBQXBCLENBQStCSixHQUEvQixFQUFvQ0MsS0FBcEM7QUFDQXhCLGVBQVdDLE1BQVgsQ0FBa0IyQixZQUFsQixDQUErQkwsR0FBL0IsRUFBb0NDLEtBQXBDO0FBQ0E7O0FBRURPLG1CQUFpQjtBQUNoQixXQUFPQyxRQUFRQyxJQUFSLENBQWEsU0FBYixFQUF3QjtBQUM5QkMsZUFBUztBQURxQixLQUF4QixDQUFQO0FBR0E7O0FBRUROLGVBQWFPLFVBQWIsRUFBeUJDLFlBQXpCLEVBQXVDO0FBQ3RDLFFBQUlELFdBQVdFLE9BQVgsQ0FBbUIsU0FBbkIsTUFBa0MsQ0FBdEMsRUFBeUM7QUFDeEM7QUFDQTs7QUFFRCxVQUFNQyxXQUFXSCxXQUFXSSxPQUFYLENBQW1CLFVBQW5CLEVBQStCLEVBQS9CLENBQWpCO0FBQ0EsVUFBTUMsYUFBYWxFLE9BQU9nRSxRQUFQLENBQW5COztBQUVBLFFBQUksQ0FBQ0UsVUFBTCxFQUFpQjtBQUNoQjtBQUNBOztBQUVELFFBQUksQ0FBQ0osWUFBRCxJQUFpQixDQUFDQSxhQUFhWCxHQUFuQyxFQUF3QztBQUN2Q2UsaUJBQVdDLEtBQVgsR0FBbUI1RCxTQUFuQjtBQUNBO0FBQ0E7O0FBRUQsVUFBTStCLE9BQU8xQyx5QkFBeUJ3RSxXQUF6QixDQUFxQ0osUUFBckMsQ0FBYjs7QUFDQSxRQUFJLENBQUMxQixJQUFMLEVBQVc7QUFDVjRCLGlCQUFXQyxLQUFYLEdBQW1CNUQsU0FBbkI7QUFDQTtBQUNBOztBQUVELFVBQU04RCxPQUFPM0UsT0FBTzRFLFVBQVAsQ0FBa0IsTUFBbEIsRUFBMEJDLE1BQTFCLENBQWlDakMsS0FBS2tDLE1BQXRDLEVBQThDQyxNQUE5QyxDQUFxRCxLQUFyRCxDQUFiO0FBQ0EsVUFBTXRDLFlBQVkyQixhQUFhWCxHQUFiLENBQWlCdUIsS0FBakIsQ0FBdUIsR0FBdkIsRUFBNEJDLEdBQTVCLEVBQWxCO0FBRUEsV0FBT1QsV0FBV0MsS0FBWCxHQUFtQjtBQUN6QlMsWUFBTyxVQUFVWixRQUFVLElBQUk3QixTQUFXLEVBRGpCO0FBRXpCMEMsaUJBQVcsS0FGYztBQUd6QkMsb0JBQWN2RSxTQUhXO0FBSXpCd0UsYUFBTyxRQUprQjtBQUt6QjFFLFlBQU0sT0FMbUI7QUFNekIyRSxlQUFTMUMsS0FBS2tDLE1BTlc7QUFPekJyQyxlQVB5QjtBQVF6QmdCLFdBQU0sV0FBV2EsUUFBVSxJQUFJN0IsU0FBVyxJQUFJa0MsSUFBTSxFQVIzQjtBQVN6QlksWUFBTTNDLEtBQUs0QyxNQVRjO0FBVXpCQyxrQkFBWTdDLEtBQUs2QyxVQVZRO0FBV3pCckQsbUJBQWFRLEtBQUtSLFdBWE87QUFZekJ1QztBQVp5QixLQUExQjtBQWNBOztBQXhINkIsQ0FBWCxFQUFwQjtBQTJIQTNDLFdBQVcwQixRQUFYLENBQW9CZ0MsUUFBcEIsQ0FBNkIsUUFBN0I7QUFFQTFELFdBQVcwQixRQUFYLENBQW9CaUMsR0FBcEIsQ0FBd0IsMEJBQXhCLEVBQW9ELElBQXBELEVBQTBEO0FBQ3pEaEYsUUFBTSxTQURtRDtBQUV6RGlGLFNBQU8sUUFGa0Q7QUFHekRDLGFBQVc7QUFIOEMsQ0FBMUQ7O0FBTUEsU0FBU0MsaUJBQVQsQ0FBMkJ2QyxHQUEzQixFQUFnQ0MsS0FBaEMsRUFBdUM7QUFDdEMsU0FBT3hCLFdBQVcwQixRQUFYLENBQW9CaUMsR0FBcEIsQ0FBeUIsVUFBVXBDLEdBQUssRUFBeEMsRUFBMkM7QUFDakQ5QyxnQkFBWStDLE1BQU0vQztBQUQrQixHQUEzQyxFQUVKO0FBQ0ZFLFVBQU0sT0FESjtBQUVGaUYsV0FBTyxRQUZMO0FBR0ZHLHFCQUFpQnZDLE1BQU05QyxXQUhyQjtBQUlGbUYsZUFBV3JDLE1BQU1oRCxLQUpmO0FBS0Y2QixXQUFPa0IsR0FMTDtBQU1GeUMsWUFBUSxJQU5OO0FBT0ZqRixZQUFReUMsTUFBTXpDO0FBUFosR0FGSSxDQUFQO0FBV0E7O0FBRUQsS0FBSyxNQUFNd0MsR0FBWCxJQUFrQjBDLE9BQU9DLElBQVAsQ0FBWTVGLE1BQVosQ0FBbEIsRUFBdUM7QUFDdEMsUUFBTWtELFFBQVFsRCxPQUFPaUQsR0FBUCxDQUFkO0FBQ0F1QyxvQkFBa0J2QyxHQUFsQixFQUF1QkMsS0FBdkI7QUFDQTs7QUFFRHhCLFdBQVdtRSxNQUFYLENBQWtCQyxRQUFsQixDQUEyQkMsSUFBM0IsR0FBa0NDLE9BQWxDLENBQTBDO0FBQ3pDQyxRQUFNQyxNQUFOLEVBQWM7QUFDYixXQUFPeEUsV0FBV0MsTUFBWCxDQUFrQjJCLFlBQWxCLENBQStCNEMsT0FBT0MsR0FBdEMsRUFBMkNELE9BQU9oRCxLQUFsRCxDQUFQO0FBQ0EsR0FId0M7O0FBS3pDa0QsVUFBUUYsTUFBUixFQUFnQjtBQUNmLFdBQU94RSxXQUFXQyxNQUFYLENBQWtCMkIsWUFBbEIsQ0FBK0I0QyxPQUFPQyxHQUF0QyxFQUEyQ0QsT0FBT2hELEtBQWxELENBQVA7QUFDQSxHQVB3Qzs7QUFTekNtRCxVQUFRSCxNQUFSLEVBQWdCO0FBQ2YsV0FBT3hFLFdBQVdDLE1BQVgsQ0FBa0IyQixZQUFsQixDQUErQjRDLE9BQU9DLEdBQXRDLEVBQTJDNUYsU0FBM0MsQ0FBUDtBQUNBOztBQVh3QyxDQUExQztBQWNBeUIsT0FBT3NFLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCLFNBQU90RSxPQUFPZ0IsVUFBUCxDQUFrQixZQUFXO0FBQ25DLFdBQU9VLFFBQVFDLElBQVIsQ0FBYSxTQUFiLEVBQXdCO0FBQzlCQyxlQUFTO0FBRHFCLEtBQXhCLENBQVA7QUFHQSxHQUpNLEVBSUosR0FKSSxDQUFQO0FBS0EsQ0FORDtBQVFBLE1BQU0yQyxzQkFBc0JDLGNBQWNELG1CQUExQzs7QUFFQUMsY0FBY0QsbUJBQWQsR0FBb0MsVUFBU0UsUUFBVCxFQUFtQkMsYUFBbkIsRUFBa0NDLHFCQUFsQyxFQUF5RDtBQUM1RixPQUFLLE1BQU0xRCxHQUFYLElBQWtCMEMsT0FBT0MsSUFBUCxDQUFZNUYsTUFBWixDQUFsQixFQUF1QztBQUN0QyxVQUFNa0QsUUFBUWxELE9BQU9pRCxHQUFQLENBQWQ7O0FBQ0EsUUFBSSxDQUFDQyxNQUFNaUIsS0FBUCxJQUFnQixDQUFDakIsTUFBTS9DLFVBQTNCLEVBQXVDO0FBQ3RDO0FBQ0E7O0FBRUQsUUFBSWdFLFFBQVEsRUFBWjs7QUFDQSxRQUFJakIsTUFBTWlCLEtBQVYsRUFBaUI7QUFDaEJBLGNBQVE7QUFDUFMsY0FBTTFCLE1BQU1pQixLQUFOLENBQVlTLElBRFg7QUFFUEMsbUJBQVczQixNQUFNaUIsS0FBTixDQUFZVSxTQUZoQjtBQUdQQyxzQkFBYzVCLE1BQU1pQixLQUFOLENBQVlXLFlBSG5CO0FBSVBDLGVBQU83QixNQUFNaUIsS0FBTixDQUFZWSxLQUpaO0FBS1AxRSxjQUFNNkMsTUFBTWlCLEtBQU4sQ0FBWTlELElBTFg7QUFNUDhDLGFBQUtELE1BQU1pQixLQUFOLENBQVloQixHQU5WO0FBT1A4QixjQUFNL0IsTUFBTWlCLEtBQU4sQ0FBWWMsSUFQWDtBQVFQWixjQUFNbkIsTUFBTWlCLEtBQU4sQ0FBWUU7QUFSWCxPQUFSO0FBVUF1QyxzQkFBZ0JDLFdBQWhCLENBQTZCLHFCQUFxQjVELEdBQUssRUFBdkQsSUFBNERDLE1BQU1pQixLQUFsRTtBQUNBeUMsc0JBQWdCQyxXQUFoQixDQUE2QixxQkFBcUI1RCxHQUFLLElBQUlDLE1BQU1pQixLQUFOLENBQVloQyxTQUFXLEVBQWxGLElBQXVGZSxNQUFNaUIsS0FBN0Y7QUFDQSxLQWJELE1BYU87QUFDTixZQUFNaEMsWUFBWWUsTUFBTS9DLFVBQU4sQ0FBaUJ1RSxLQUFqQixDQUF1QixHQUF2QixFQUE0QkMsR0FBNUIsRUFBbEI7QUFDQVIsY0FBUTtBQUNQUyxjQUFPLFVBQVUzQixHQUFLLElBQUlkLFNBQVcsRUFEOUI7QUFFUDBDLG1CQUFXLEtBRko7QUFHUEMsc0JBQWN2RSxTQUhQO0FBSVB3RSxlQUFPLFFBSkE7QUFLUDFFLGNBQU0sT0FMQztBQU1QOEMsYUFBTSxXQUFXRixHQUFLLElBQUlkLFNBQVcsS0FOOUI7QUFPUGtDLGNBQU07QUFQQyxPQUFSO0FBVUF1QyxzQkFBZ0JDLFdBQWhCLENBQTZCLHFCQUFxQjVELEdBQUssRUFBdkQsSUFBNEQyRCxnQkFBZ0JDLFdBQWhCLENBQTZCLGNBQWMzRCxNQUFNL0MsVUFBWSxFQUE3RCxDQUE1RDtBQUNBeUcsc0JBQWdCQyxXQUFoQixDQUE2QixxQkFBcUI1RCxHQUFLLElBQUlkLFNBQVcsRUFBdEUsSUFBMkV5RSxnQkFBZ0JDLFdBQWhCLENBQTZCLGNBQWMzRCxNQUFNL0MsVUFBWSxFQUE3RCxDQUEzRTtBQUNBOztBQUVELFVBQU0yRyxlQUFlNUgsRUFBRTZILFNBQUYsQ0FBWU4sUUFBWixFQUFzQjtBQUMxQzdCLFlBQU0zQjtBQURvQyxLQUF0QixDQUFyQjs7QUFJQSxRQUFJNkQsWUFBSixFQUFrQjtBQUNqQixZQUFNRSxRQUFRUCxTQUFTMUMsT0FBVCxDQUFpQitDLFlBQWpCLENBQWQ7QUFDQUwsZUFBU08sS0FBVCxJQUFrQjdDLEtBQWxCO0FBQ0EsS0FIRCxNQUdPO0FBQ05zQyxlQUFTUSxJQUFULENBQWM5QyxLQUFkO0FBQ0E7QUFDRDs7QUFFRCxTQUFPb0Msb0JBQW9CVyxJQUFwQixDQUF5QixJQUF6QixFQUErQlQsUUFBL0IsRUFBeUNDLGFBQXpDLEVBQXdEQyxxQkFBeEQsQ0FBUDtBQUNBLENBbEREOztBQW9EQTNFLE9BQU9tRixPQUFQLENBQWU7QUFDZDFELG1CQUFpQjtBQUNoQixRQUFJLENBQUN6QixPQUFPb0YsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSXBGLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEb0YsZ0JBQVE7QUFEb0QsT0FBdkQsQ0FBTjtBQUdBOztBQUVELFVBQU1DLGdCQUFnQjVGLFdBQVc2RixLQUFYLENBQWlCRCxhQUFqQixDQUErQnRGLE9BQU9vRixNQUFQLEVBQS9CLEVBQWdELGVBQWhELENBQXRCOztBQUNBLFFBQUksQ0FBQ0UsYUFBTCxFQUFvQjtBQUNuQixZQUFNLElBQUl0RixPQUFPQyxLQUFYLENBQWlCLDBCQUFqQixFQUE2Qyw2QkFBN0MsRUFBNEU7QUFDakZvRixnQkFBUSxnQkFEeUU7QUFFakZHLGdCQUFRO0FBRnlFLE9BQTVFLENBQU47QUFJQTs7QUFFRCxXQUFPOUYsV0FBV0MsTUFBWCxDQUFrQjhCLGNBQWxCLEVBQVA7QUFDQSxHQWpCYTs7QUFtQmRELGFBQVd6QixLQUFYLEVBQWtCO0FBQ2pCLFFBQUksQ0FBQ0MsT0FBT29GLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlwRixPQUFPQyxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1RG9GLGdCQUFRO0FBRG9ELE9BQXZELENBQU47QUFHQTs7QUFFRCxVQUFNQyxnQkFBZ0I1RixXQUFXNkYsS0FBWCxDQUFpQkQsYUFBakIsQ0FBK0J0RixPQUFPb0YsTUFBUCxFQUEvQixFQUFnRCxlQUFoRCxDQUF0Qjs7QUFDQSxRQUFJLENBQUNFLGFBQUwsRUFBb0I7QUFDbkIsWUFBTSxJQUFJdEYsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNkJBQTdDLEVBQTRFO0FBQ2pGb0YsZ0JBQVEsWUFEeUU7QUFFakZHLGdCQUFRO0FBRnlFLE9BQTVFLENBQU47QUFJQTs7QUFFRCxXQUFPOUYsV0FBV0MsTUFBWCxDQUFrQjZCLFVBQWxCLENBQTZCekIsS0FBN0IsQ0FBUDtBQUNBLEdBbkNhOztBQXFDZEgsV0FBU0MsYUFBVCxFQUF3QkMsV0FBeEIsRUFBcUNDLEtBQXJDLEVBQTRDO0FBQzNDLFFBQUksQ0FBQ0MsT0FBT29GLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlwRixPQUFPQyxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1RG9GLGdCQUFRO0FBRG9ELE9BQXZELENBQU47QUFHQTs7QUFFRCxVQUFNQyxnQkFBZ0I1RixXQUFXNkYsS0FBWCxDQUFpQkQsYUFBakIsQ0FBK0J0RixPQUFPb0YsTUFBUCxFQUEvQixFQUFnRCxlQUFoRCxDQUF0Qjs7QUFDQSxRQUFJLENBQUNFLGFBQUwsRUFBb0I7QUFDbkIsWUFBTSxJQUFJdEYsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNkJBQTdDLEVBQTRFO0FBQ2pGb0YsZ0JBQVEsVUFEeUU7QUFFakZHLGdCQUFRO0FBRnlFLE9BQTVFLENBQU47QUFJQTs7QUFFRDlGLGVBQVdDLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyxhQUEzQixFQUEwQ0MsV0FBMUMsRUFBdURDLEtBQXZEO0FBQ0E7O0FBckRhLENBQWY7QUF3REEwRixPQUFPQyxlQUFQLENBQXVCQyxHQUF2QixDQUEyQixVQUEzQixFQUF1QzNGLE9BQU9lLGVBQVAsQ0FBdUIsVUFBUzZFLEdBQVQsRUFBY0MsR0FBZCxFQUFtQkMsSUFBbkIsRUFBeUI7QUFDdEYsUUFBTUMsU0FBUztBQUNkaEcsV0FBT2lHLG1CQUFtQkosSUFBSXpFLEdBQUosQ0FBUWMsT0FBUixDQUFnQixLQUFoQixFQUF1QixFQUF2QixFQUEyQkEsT0FBM0IsQ0FBbUMsT0FBbkMsRUFBNEMsRUFBNUMsQ0FBbkIsRUFBb0VBLE9BQXBFLENBQTRFLFVBQTVFLEVBQXdGLEVBQXhGO0FBRE8sR0FBZjtBQUlBLFFBQU0zQixPQUFPdEMsT0FBTytILE9BQU9oRyxLQUFkLEtBQXdCL0IsT0FBTytILE9BQU9oRyxLQUFkLEVBQXFCb0MsS0FBMUQ7O0FBRUEsTUFBSSxDQUFDN0IsSUFBTCxFQUFXO0FBQ1YsUUFBSXRDLE9BQU8rSCxPQUFPaEcsS0FBZCxLQUF3Qi9CLE9BQU8rSCxPQUFPaEcsS0FBZCxFQUFxQjVCLFVBQWpELEVBQTZEO0FBQzVEeUgsVUFBSXpFLEdBQUosR0FBVyxJQUFJbkQsT0FBTytILE9BQU9oRyxLQUFkLEVBQXFCNUIsVUFBWSxFQUFoRDtBQUNBeUcsc0JBQWdCcUIscUJBQWhCLENBQXNDckIsZ0JBQWdCQyxXQUF0RCxFQUFtRWUsR0FBbkUsRUFBd0VDLEdBQXhFLEVBQTZFQyxJQUE3RTtBQUNBLEtBSEQsTUFHTztBQUNORCxVQUFJSyxTQUFKLENBQWMsR0FBZDtBQUNBTCxVQUFJTSxHQUFKO0FBQ0E7O0FBRUQ7QUFDQTs7QUFFRCxRQUFNQyxvQkFBb0JSLElBQUlTLE9BQUosQ0FBWSxtQkFBWixDQUExQjs7QUFDQSxNQUFJRCxpQkFBSixFQUF1QjtBQUN0QixRQUFJQSx1QkFBdUI5RixLQUFLNkMsVUFBTCxJQUFtQjdDLEtBQUs2QyxVQUFMLENBQWdCbUQsV0FBaEIsRUFBMUMsQ0FBSixFQUE4RTtBQUM3RVQsVUFBSVUsU0FBSixDQUFjLGVBQWQsRUFBK0JILGlCQUEvQjtBQUNBUCxVQUFJSyxTQUFKLENBQWMsR0FBZDtBQUNBTCxVQUFJTSxHQUFKO0FBQ0E7QUFDQTtBQUNEOztBQUVETixNQUFJVSxTQUFKLENBQWMsZUFBZCxFQUErQixtQkFBL0I7QUFDQVYsTUFBSVUsU0FBSixDQUFjLFNBQWQsRUFBeUIsSUFBekI7QUFDQVYsTUFBSVUsU0FBSixDQUFjLGVBQWQsRUFBZ0NqRyxLQUFLNkMsVUFBTCxJQUFtQjdDLEtBQUs2QyxVQUFMLENBQWdCbUQsV0FBaEIsRUFBcEIsSUFBc0QsSUFBSUUsSUFBSixHQUFXRixXQUFYLEVBQXJGO0FBQ0FULE1BQUlVLFNBQUosQ0FBYyxjQUFkLEVBQThCakcsS0FBS1IsV0FBbkM7QUFDQStGLE1BQUlVLFNBQUosQ0FBYyxnQkFBZCxFQUFnQ2pHLEtBQUsyQyxJQUFyQztBQUNBNEMsTUFBSUssU0FBSixDQUFjLEdBQWQ7QUFDQUwsTUFBSU0sR0FBSixDQUFRN0YsS0FBSzBDLE9BQWI7QUFDQSxDQXBDc0MsQ0FBdkMsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hc3NldHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgV2ViQXBwSGFzaGluZywgV2ViQXBwSW50ZXJuYWxzICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuaW1wb3J0IHNpemVPZiBmcm9tICdpbWFnZS1zaXplJztcbmltcG9ydCBtaW1lIGZyb20gJ21pbWUtdHlwZS93aXRoLWRiJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxubWltZS5leHRlbnNpb25zWydpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nXSA9IFsnaWNvJ107XG5cbmNvbnN0IFJvY2tldENoYXRBc3NldHNJbnN0YW5jZSA9IG5ldyBSb2NrZXRDaGF0RmlsZS5HcmlkRlMoe1xuXHRuYW1lOiAnYXNzZXRzJ1xufSk7XG5cbnRoaXMuUm9ja2V0Q2hhdEFzc2V0c0luc3RhbmNlID0gUm9ja2V0Q2hhdEFzc2V0c0luc3RhbmNlO1xuXG5jb25zdCBhc3NldHMgPSB7XG5cdGxvZ286IHtcblx0XHRsYWJlbDogJ2xvZ28gKHN2ZywgcG5nLCBqcGcpJyxcblx0XHRkZWZhdWx0VXJsOiAnaW1hZ2VzL2xvZ28vbG9nby5zdmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydzdmcnLCAncG5nJywgJ2pwZycsICdqcGVnJ10sXG5cdFx0XHR3aWR0aDogdW5kZWZpbmVkLFxuXHRcdFx0aGVpZ2h0OiB1bmRlZmluZWRcblx0XHR9LFxuXHRcdHdpemFyZDoge1xuXHRcdFx0c3RlcDogMyxcblx0XHRcdG9yZGVyOiAyXG5cdFx0fVxuXHR9LFxuXHRiYWNrZ3JvdW5kOiB7XG5cdFx0bGFiZWw6ICdsb2dpbiBiYWNrZ3JvdW5kIChzdmcsIHBuZywganBnKScsXG5cdFx0ZGVmYXVsdFVybDogdW5kZWZpbmVkLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydzdmcnLCAncG5nJywgJ2pwZycsICdqcGVnJ10sXG5cdFx0XHR3aWR0aDogdW5kZWZpbmVkLFxuXHRcdFx0aGVpZ2h0OiB1bmRlZmluZWRcblx0XHR9XG5cdH0sXG5cdGZhdmljb25faWNvOiB7XG5cdFx0bGFiZWw6ICdmYXZpY29uIChpY28pJyxcblx0XHRkZWZhdWx0VXJsOiAnZmF2aWNvbi5pY28nLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydpY28nXSxcblx0XHRcdHdpZHRoOiB1bmRlZmluZWQsXG5cdFx0XHRoZWlnaHQ6IHVuZGVmaW5lZFxuXHRcdH1cblx0fSxcblx0ZmF2aWNvbjoge1xuXHRcdGxhYmVsOiAnZmF2aWNvbiAoc3ZnKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2ljb24uc3ZnJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsnc3ZnJ10sXG5cdFx0XHR3aWR0aDogdW5kZWZpbmVkLFxuXHRcdFx0aGVpZ2h0OiB1bmRlZmluZWRcblx0XHR9XG5cdH0sXG5cdGZhdmljb25fMTY6IHtcblx0XHRsYWJlbDogJ2Zhdmljb24gMTZ4MTYgKHBuZyknLFxuXHRcdGRlZmF1bHRVcmw6ICdpbWFnZXMvbG9nby9mYXZpY29uLTE2eDE2LnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDE2LFxuXHRcdFx0aGVpZ2h0OiAxNlxuXHRcdH1cblx0fSxcblx0ZmF2aWNvbl8zMjoge1xuXHRcdGxhYmVsOiAnZmF2aWNvbiAzMngzMiAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2Zhdmljb24tMzJ4MzIucG5nJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsncG5nJ10sXG5cdFx0XHR3aWR0aDogMzIsXG5cdFx0XHRoZWlnaHQ6IDMyXG5cdFx0fVxuXHR9LFxuXHRmYXZpY29uXzE5Mjoge1xuXHRcdGxhYmVsOiAnYW5kcm9pZC1jaHJvbWUgMTkyeDE5MiAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsncG5nJ10sXG5cdFx0XHR3aWR0aDogMTkyLFxuXHRcdFx0aGVpZ2h0OiAxOTJcblx0XHR9XG5cdH0sXG5cdGZhdmljb25fNTEyOiB7XG5cdFx0bGFiZWw6ICdhbmRyb2lkLWNocm9tZSA1MTJ4NTEyIChwbmcpJyxcblx0XHRkZWZhdWx0VXJsOiAnaW1hZ2VzL2xvZ28vNTEyeDUxMi5wbmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydwbmcnXSxcblx0XHRcdHdpZHRoOiA1MTIsXG5cdFx0XHRoZWlnaHQ6IDUxMlxuXHRcdH1cblx0fSxcblx0dG91Y2hpY29uXzE4MDoge1xuXHRcdGxhYmVsOiAnYXBwbGUtdG91Y2gtaWNvbiAxODB4MTgwIChwbmcpJyxcblx0XHRkZWZhdWx0VXJsOiAnaW1hZ2VzL2xvZ28vYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydwbmcnXSxcblx0XHRcdHdpZHRoOiAxODAsXG5cdFx0XHRoZWlnaHQ6IDE4MFxuXHRcdH1cblx0fSxcblx0dG91Y2hpY29uXzE4MF9wcmU6IHtcblx0XHRsYWJlbDogJ2FwcGxlLXRvdWNoLWljb24tcHJlY29tcG9zZWQgMTgweDE4MCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2FwcGxlLXRvdWNoLWljb24tcHJlY29tcG9zZWQucG5nJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsncG5nJ10sXG5cdFx0XHR3aWR0aDogMTgwLFxuXHRcdFx0aGVpZ2h0OiAxODBcblx0XHR9XG5cdH0sXG5cdHRpbGVfMTQ0OiB7XG5cdFx0bGFiZWw6ICdtc3RpbGUgMTQ0eDE0NCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL21zdGlsZS0xNDR4MTQ0LnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDE0NCxcblx0XHRcdGhlaWdodDogMTQ0XG5cdFx0fVxuXHR9LFxuXHR0aWxlXzE1MDoge1xuXHRcdGxhYmVsOiAnbXN0aWxlIDE1MHgxNTAgKHBuZyknLFxuXHRcdGRlZmF1bHRVcmw6ICdpbWFnZXMvbG9nby9tc3RpbGUtMTUweDE1MC5wbmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydwbmcnXSxcblx0XHRcdHdpZHRoOiAxNTAsXG5cdFx0XHRoZWlnaHQ6IDE1MFxuXHRcdH1cblx0fSxcblx0dGlsZV8zMTBfc3F1YXJlOiB7XG5cdFx0bGFiZWw6ICdtc3RpbGUgMzEweDMxMCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL21zdGlsZS0zMTB4MzEwLnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDMxMCxcblx0XHRcdGhlaWdodDogMzEwXG5cdFx0fVxuXHR9LFxuXHR0aWxlXzMxMF93aWRlOiB7XG5cdFx0bGFiZWw6ICdtc3RpbGUgMzEweDE1MCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL21zdGlsZS0zMTB4MTUwLnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDMxMCxcblx0XHRcdGhlaWdodDogMTUwXG5cdFx0fVxuXHR9LFxuXHRzYWZhcmlfcGlubmVkOiB7XG5cdFx0bGFiZWw6ICdzYWZhcmkgcGlubmVkIHRhYiAoc3ZnKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL3NhZmFyaS1waW5uZWQtdGFiLnN2ZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3N2ZyddLFxuXHRcdFx0d2lkdGg6IHVuZGVmaW5lZCxcblx0XHRcdGhlaWdodDogdW5kZWZpbmVkXG5cdFx0fVxuXHR9XG59O1xuXG5Sb2NrZXRDaGF0LkFzc2V0cyA9IG5ldyAoY2xhc3Mge1xuXHRnZXQgbWltZSgpIHtcblx0XHRyZXR1cm4gbWltZTtcblx0fVxuXG5cdGdldCBhc3NldHMoKSB7XG5cdFx0cmV0dXJuIGFzc2V0cztcblx0fVxuXG5cdHNldEFzc2V0KGJpbmFyeUNvbnRlbnQsIGNvbnRlbnRUeXBlLCBhc3NldCkge1xuXHRcdGlmICghYXNzZXRzW2Fzc2V0XSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hc3NldCcsICdJbnZhbGlkIGFzc2V0Jywge1xuXHRcdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuQXNzZXRzLnNldEFzc2V0J1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZXh0ZW5zaW9uID0gbWltZS5leHRlbnNpb24oY29udGVudFR5cGUpO1xuXHRcdGlmIChhc3NldHNbYXNzZXRdLmNvbnN0cmFpbnRzLmV4dGVuc2lvbnMuaW5jbHVkZXMoZXh0ZW5zaW9uKSA9PT0gZmFsc2UpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoY29udGVudFR5cGUsIGBJbnZhbGlkIGZpbGUgdHlwZTogJHsgY29udGVudFR5cGUgfWAsIHtcblx0XHRcdFx0ZnVuY3Rpb246ICdSb2NrZXRDaGF0LkFzc2V0cy5zZXRBc3NldCcsXG5cdFx0XHRcdGVycm9yVGl0bGU6ICdlcnJvci1pbnZhbGlkLWZpbGUtdHlwZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGUgPSBuZXcgQnVmZmVyKGJpbmFyeUNvbnRlbnQsICdiaW5hcnknKTtcblx0XHRpZiAoYXNzZXRzW2Fzc2V0XS5jb25zdHJhaW50cy53aWR0aCB8fCBhc3NldHNbYXNzZXRdLmNvbnN0cmFpbnRzLmhlaWdodCkge1xuXHRcdFx0Y29uc3QgZGltZW5zaW9ucyA9IHNpemVPZihmaWxlKTtcblx0XHRcdGlmIChhc3NldHNbYXNzZXRdLmNvbnN0cmFpbnRzLndpZHRoICYmIGFzc2V0c1thc3NldF0uY29uc3RyYWludHMud2lkdGggIT09IGRpbWVuc2lvbnMud2lkdGgpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWxlLXdpZHRoJywgJ0ludmFsaWQgZmlsZSB3aWR0aCcsIHtcblx0XHRcdFx0XHRmdW5jdGlvbjogJ0ludmFsaWQgZmlsZSB3aWR0aCdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYXNzZXRzW2Fzc2V0XS5jb25zdHJhaW50cy5oZWlnaHQgJiYgYXNzZXRzW2Fzc2V0XS5jb25zdHJhaW50cy5oZWlnaHQgIT09IGRpbWVuc2lvbnMuaGVpZ2h0KSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtZmlsZS1oZWlnaHQnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBycyA9IFJvY2tldENoYXRGaWxlLmJ1ZmZlclRvU3RyZWFtKGZpbGUpO1xuXHRcdFJvY2tldENoYXRBc3NldHNJbnN0YW5jZS5kZWxldGVGaWxlKGFzc2V0KTtcblxuXHRcdGNvbnN0IHdzID0gUm9ja2V0Q2hhdEFzc2V0c0luc3RhbmNlLmNyZWF0ZVdyaXRlU3RyZWFtKGFzc2V0LCBjb250ZW50VHlwZSk7XG5cdFx0d3Mub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gTWV0ZW9yLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnN0IGtleSA9IGBBc3NldHNfJHsgYXNzZXQgfWA7XG5cdFx0XHRcdGNvbnN0IHZhbHVlID0ge1xuXHRcdFx0XHRcdHVybDogYGFzc2V0cy8keyBhc3NldCB9LiR7IGV4dGVuc2lvbiB9YCxcblx0XHRcdFx0XHRkZWZhdWx0VXJsOiBhc3NldHNbYXNzZXRdLmRlZmF1bHRVcmxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoa2V5LCB2YWx1ZSk7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQoa2V5LCB2YWx1ZSk7XG5cdFx0XHR9LCAyMDApO1xuXHRcdH0pKTtcblxuXHRcdHJzLnBpcGUod3MpO1xuXHR9XG5cblx0dW5zZXRBc3NldChhc3NldCkge1xuXHRcdGlmICghYXNzZXRzW2Fzc2V0XSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hc3NldCcsICdJbnZhbGlkIGFzc2V0Jywge1xuXHRcdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuQXNzZXRzLnVuc2V0QXNzZXQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0QXNzZXRzSW5zdGFuY2UuZGVsZXRlRmlsZShhc3NldCk7XG5cdFx0Y29uc3Qga2V5ID0gYEFzc2V0c18keyBhc3NldCB9YDtcblx0XHRjb25zdCB2YWx1ZSA9IHtcblx0XHRcdGRlZmF1bHRVcmw6IGFzc2V0c1thc3NldF0uZGVmYXVsdFVybFxuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoa2V5LCB2YWx1ZSk7XG5cdFx0Um9ja2V0Q2hhdC5Bc3NldHMucHJvY2Vzc0Fzc2V0KGtleSwgdmFsdWUpO1xuXHR9XG5cblx0cmVmcmVzaENsaWVudHMoKSB7XG5cdFx0cmV0dXJuIHByb2Nlc3MuZW1pdCgnbWVzc2FnZScsIHtcblx0XHRcdHJlZnJlc2g6ICdjbGllbnQnXG5cdFx0fSk7XG5cdH1cblxuXHRwcm9jZXNzQXNzZXQoc2V0dGluZ0tleSwgc2V0dGluZ1ZhbHVlKSB7XG5cdFx0aWYgKHNldHRpbmdLZXkuaW5kZXhPZignQXNzZXRzXycpICE9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXNzZXRLZXkgPSBzZXR0aW5nS2V5LnJlcGxhY2UoL15Bc3NldHNfLywgJycpO1xuXHRcdGNvbnN0IGFzc2V0VmFsdWUgPSBhc3NldHNbYXNzZXRLZXldO1xuXG5cdFx0aWYgKCFhc3NldFZhbHVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCFzZXR0aW5nVmFsdWUgfHwgIXNldHRpbmdWYWx1ZS51cmwpIHtcblx0XHRcdGFzc2V0VmFsdWUuY2FjaGUgPSB1bmRlZmluZWQ7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXRBc3NldHNJbnN0YW5jZS5nZXRGaWxlU3luYyhhc3NldEtleSk7XG5cdFx0aWYgKCFmaWxlKSB7XG5cdFx0XHRhc3NldFZhbHVlLmNhY2hlID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpLnVwZGF0ZShmaWxlLmJ1ZmZlcikuZGlnZXN0KCdoZXgnKTtcblx0XHRjb25zdCBleHRlbnNpb24gPSBzZXR0aW5nVmFsdWUudXJsLnNwbGl0KCcuJykucG9wKCk7XG5cblx0XHRyZXR1cm4gYXNzZXRWYWx1ZS5jYWNoZSA9IHtcblx0XHRcdHBhdGg6IGBhc3NldHMvJHsgYXNzZXRLZXkgfS4keyBleHRlbnNpb24gfWAsXG5cdFx0XHRjYWNoZWFibGU6IGZhbHNlLFxuXHRcdFx0c291cmNlTWFwVXJsOiB1bmRlZmluZWQsXG5cdFx0XHR3aGVyZTogJ2NsaWVudCcsXG5cdFx0XHR0eXBlOiAnYXNzZXQnLFxuXHRcdFx0Y29udGVudDogZmlsZS5idWZmZXIsXG5cdFx0XHRleHRlbnNpb24sXG5cdFx0XHR1cmw6IGAvYXNzZXRzLyR7IGFzc2V0S2V5IH0uJHsgZXh0ZW5zaW9uIH0/JHsgaGFzaCB9YCxcblx0XHRcdHNpemU6IGZpbGUubGVuZ3RoLFxuXHRcdFx0dXBsb2FkRGF0ZTogZmlsZS51cGxvYWREYXRlLFxuXHRcdFx0Y29udGVudFR5cGU6IGZpbGUuY29udGVudFR5cGUsXG5cdFx0XHRoYXNoXG5cdFx0fTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0Fzc2V0cycpO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnQXNzZXRzX1N2Z0Zhdmljb25fRW5hYmxlJywgdHJ1ZSwge1xuXHR0eXBlOiAnYm9vbGVhbicsXG5cdGdyb3VwOiAnQXNzZXRzJyxcblx0aTE4bkxhYmVsOiAnRW5hYmxlX1N2Z19GYXZpY29uJ1xufSk7XG5cbmZ1bmN0aW9uIGFkZEFzc2V0VG9TZXR0aW5nKGtleSwgdmFsdWUpIHtcblx0cmV0dXJuIFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBBc3NldHNfJHsga2V5IH1gLCB7XG5cdFx0ZGVmYXVsdFVybDogdmFsdWUuZGVmYXVsdFVybFxuXHR9LCB7XG5cdFx0dHlwZTogJ2Fzc2V0Jyxcblx0XHRncm91cDogJ0Fzc2V0cycsXG5cdFx0ZmlsZUNvbnN0cmFpbnRzOiB2YWx1ZS5jb25zdHJhaW50cyxcblx0XHRpMThuTGFiZWw6IHZhbHVlLmxhYmVsLFxuXHRcdGFzc2V0OiBrZXksXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHdpemFyZDogdmFsdWUud2l6YXJkXG5cdH0pO1xufVxuXG5mb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhhc3NldHMpKSB7XG5cdGNvbnN0IHZhbHVlID0gYXNzZXRzW2tleV07XG5cdGFkZEFzc2V0VG9TZXR0aW5nKGtleSwgdmFsdWUpO1xufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKCkub2JzZXJ2ZSh7XG5cdGFkZGVkKHJlY29yZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQocmVjb3JkLl9pZCwgcmVjb3JkLnZhbHVlKTtcblx0fSxcblxuXHRjaGFuZ2VkKHJlY29yZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQocmVjb3JkLl9pZCwgcmVjb3JkLnZhbHVlKTtcblx0fSxcblxuXHRyZW1vdmVkKHJlY29yZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQocmVjb3JkLl9pZCwgdW5kZWZpbmVkKTtcblx0fVxufSk7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gTWV0ZW9yLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHByb2Nlc3MuZW1pdCgnbWVzc2FnZScsIHtcblx0XHRcdHJlZnJlc2g6ICdjbGllbnQnXG5cdFx0fSk7XG5cdH0sIDIwMCk7XG59KTtcblxuY29uc3QgY2FsY3VsYXRlQ2xpZW50SGFzaCA9IFdlYkFwcEhhc2hpbmcuY2FsY3VsYXRlQ2xpZW50SGFzaDtcblxuV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoID0gZnVuY3Rpb24obWFuaWZlc3QsIGluY2x1ZGVGaWx0ZXIsIHJ1bnRpbWVDb25maWdPdmVycmlkZSkge1xuXHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhhc3NldHMpKSB7XG5cdFx0Y29uc3QgdmFsdWUgPSBhc3NldHNba2V5XTtcblx0XHRpZiAoIXZhbHVlLmNhY2hlICYmICF2YWx1ZS5kZWZhdWx0VXJsKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRsZXQgY2FjaGUgPSB7fTtcblx0XHRpZiAodmFsdWUuY2FjaGUpIHtcblx0XHRcdGNhY2hlID0ge1xuXHRcdFx0XHRwYXRoOiB2YWx1ZS5jYWNoZS5wYXRoLFxuXHRcdFx0XHRjYWNoZWFibGU6IHZhbHVlLmNhY2hlLmNhY2hlYWJsZSxcblx0XHRcdFx0c291cmNlTWFwVXJsOiB2YWx1ZS5jYWNoZS5zb3VyY2VNYXBVcmwsXG5cdFx0XHRcdHdoZXJlOiB2YWx1ZS5jYWNoZS53aGVyZSxcblx0XHRcdFx0dHlwZTogdmFsdWUuY2FjaGUudHlwZSxcblx0XHRcdFx0dXJsOiB2YWx1ZS5jYWNoZS51cmwsXG5cdFx0XHRcdHNpemU6IHZhbHVlLmNhY2hlLnNpemUsXG5cdFx0XHRcdGhhc2g6IHZhbHVlLmNhY2hlLmhhc2hcblx0XHRcdH07XG5cdFx0XHRXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvYXNzZXRzLyR7IGtleSB9YF0gPSB2YWx1ZS5jYWNoZTtcblx0XHRcdFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc1tgL19fY29yZG92YS9hc3NldHMvJHsga2V5IH0uJHsgdmFsdWUuY2FjaGUuZXh0ZW5zaW9uIH1gXSA9IHZhbHVlLmNhY2hlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBleHRlbnNpb24gPSB2YWx1ZS5kZWZhdWx0VXJsLnNwbGl0KCcuJykucG9wKCk7XG5cdFx0XHRjYWNoZSA9IHtcblx0XHRcdFx0cGF0aDogYGFzc2V0cy8keyBrZXkgfS4keyBleHRlbnNpb24gfWAsXG5cdFx0XHRcdGNhY2hlYWJsZTogZmFsc2UsXG5cdFx0XHRcdHNvdXJjZU1hcFVybDogdW5kZWZpbmVkLFxuXHRcdFx0XHR3aGVyZTogJ2NsaWVudCcsXG5cdFx0XHRcdHR5cGU6ICdhc3NldCcsXG5cdFx0XHRcdHVybDogYC9hc3NldHMvJHsga2V5IH0uJHsgZXh0ZW5zaW9uIH0/djNgLFxuXHRcdFx0XHRoYXNoOiAndjMnXG5cdFx0XHR9O1xuXG5cdFx0XHRXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvYXNzZXRzLyR7IGtleSB9YF0gPSBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvJHsgdmFsdWUuZGVmYXVsdFVybCB9YF07XG5cdFx0XHRXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvYXNzZXRzLyR7IGtleSB9LiR7IGV4dGVuc2lvbiB9YF0gPSBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvJHsgdmFsdWUuZGVmYXVsdFVybCB9YF07XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWFuaWZlc3RJdGVtID0gXy5maW5kV2hlcmUobWFuaWZlc3QsIHtcblx0XHRcdHBhdGg6IGtleVxuXHRcdH0pO1xuXG5cdFx0aWYgKG1hbmlmZXN0SXRlbSkge1xuXHRcdFx0Y29uc3QgaW5kZXggPSBtYW5pZmVzdC5pbmRleE9mKG1hbmlmZXN0SXRlbSk7XG5cdFx0XHRtYW5pZmVzdFtpbmRleF0gPSBjYWNoZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWFuaWZlc3QucHVzaChjYWNoZSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGNhbGN1bGF0ZUNsaWVudEhhc2guY2FsbCh0aGlzLCBtYW5pZmVzdCwgaW5jbHVkZUZpbHRlciwgcnVudGltZUNvbmZpZ092ZXJyaWRlKTtcbn07XG5cbk1ldGVvci5tZXRob2RzKHtcblx0cmVmcmVzaENsaWVudHMoKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3JlZnJlc2hDbGllbnRzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGFzUGVybWlzc2lvbiA9IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdtYW5hZ2UtYXNzZXRzJyk7XG5cdFx0aWYgKCFoYXNQZXJtaXNzaW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTWFuYWdpbmcgYXNzZXRzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdyZWZyZXNoQ2xpZW50cycsXG5cdFx0XHRcdGFjdGlvbjogJ01hbmFnaW5nX2Fzc2V0cydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5yZWZyZXNoQ2xpZW50cygpO1xuXHR9LFxuXG5cdHVuc2V0QXNzZXQoYXNzZXQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAndW5zZXRBc3NldCdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhc1Blcm1pc3Npb24gPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnbWFuYWdlLWFzc2V0cycpO1xuXHRcdGlmICghaGFzUGVybWlzc2lvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ01hbmFnaW5nIGFzc2V0cyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAndW5zZXRBc3NldCcsXG5cdFx0XHRcdGFjdGlvbjogJ01hbmFnaW5nX2Fzc2V0cydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy51bnNldEFzc2V0KGFzc2V0KTtcblx0fSxcblxuXHRzZXRBc3NldChiaW5hcnlDb250ZW50LCBjb250ZW50VHlwZSwgYXNzZXQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2V0QXNzZXQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBoYXNQZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ21hbmFnZS1hc3NldHMnKTtcblx0XHRpZiAoIWhhc1Blcm1pc3Npb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdNYW5hZ2luZyBhc3NldHMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NldEFzc2V0Jyxcblx0XHRcdFx0YWN0aW9uOiAnTWFuYWdpbmdfYXNzZXRzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5Bc3NldHMuc2V0QXNzZXQoYmluYXJ5Q29udGVudCwgY29udGVudFR5cGUsIGFzc2V0KTtcblx0fVxufSk7XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKCcvYXNzZXRzLycsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdGFzc2V0OiBkZWNvZGVVUklDb21wb25lbnQocmVxLnVybC5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcPy4qJC8sICcnKSkucmVwbGFjZSgvXFwuW14uXSokLywgJycpXG5cdH07XG5cblx0Y29uc3QgZmlsZSA9IGFzc2V0c1twYXJhbXMuYXNzZXRdICYmIGFzc2V0c1twYXJhbXMuYXNzZXRdLmNhY2hlO1xuXG5cdGlmICghZmlsZSkge1xuXHRcdGlmIChhc3NldHNbcGFyYW1zLmFzc2V0XSAmJiBhc3NldHNbcGFyYW1zLmFzc2V0XS5kZWZhdWx0VXJsKSB7XG5cdFx0XHRyZXEudXJsID0gYC8keyBhc3NldHNbcGFyYW1zLmFzc2V0XS5kZWZhdWx0VXJsIH1gO1xuXHRcdFx0V2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzTWlkZGxld2FyZShXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXMsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHJlcU1vZGlmaWVkSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2lmLW1vZGlmaWVkLXNpbmNlJ107XG5cdGlmIChyZXFNb2RpZmllZEhlYWRlcikge1xuXHRcdGlmIChyZXFNb2RpZmllZEhlYWRlciA9PT0gKGZpbGUudXBsb2FkRGF0ZSAmJiBmaWxlLnVwbG9hZERhdGUudG9VVENTdHJpbmcoKSkpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCByZXFNb2RpZmllZEhlYWRlcik7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDMwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0cmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICdwdWJsaWMsIG1heC1hZ2U9MCcpO1xuXHRyZXMuc2V0SGVhZGVyKCdFeHBpcmVzJywgJy0xJyk7XG5cdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCAoZmlsZS51cGxvYWREYXRlICYmIGZpbGUudXBsb2FkRGF0ZS50b1VUQ1N0cmluZygpKSB8fCBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCkpO1xuXHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLmNvbnRlbnRUeXBlKTtcblx0cmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBmaWxlLnNpemUpO1xuXHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdHJlcy5lbmQoZmlsZS5jb250ZW50KTtcbn0pKTtcbiJdfQ==
