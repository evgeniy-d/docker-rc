(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var WebAppHashing = Package['webapp-hashing'].WebAppHashing;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:theme":{"server":{"server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_theme/server/server.js                                                                //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let less;
module.watch(require("less"), {
  default(v) {
    less = v;
  }

}, 1);
let Autoprefixer;
module.watch(require("less-plugin-autoprefix"), {
  default(v) {
    Autoprefixer = v;
  }

}, 2);
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 3);
const logger = new Logger('rocketchat:theme', {
  methods: {
    stop_rendering: {
      type: 'info'
    }
  }
});
WebApp.rawConnectHandlers.use(function (req, res, next) {
  const path = req.url.split('?')[0];
  const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

  if (path === `${prefix}/__cordova/theme.css` || path === `${prefix}/theme.css`) {
    const css = RocketChat.theme.getCss();
    const hash = crypto.createHash('sha1').update(css).digest('hex');
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    res.setHeader('ETag', `"${hash}"`);
    res.write(css);
    return res.end();
  } else {
    return next();
  }
});
const calculateClientHash = WebAppHashing.calculateClientHash;

WebAppHashing.calculateClientHash = function (manifest, includeFilter, runtimeConfigOverride) {
  const css = RocketChat.theme.getCss();

  if (css.trim() !== '') {
    const hash = crypto.createHash('sha1').update(css).digest('hex');

    let themeManifestItem = _.find(manifest, function (item) {
      return item.path === 'app/theme.css';
    });

    if (themeManifestItem == null) {
      themeManifestItem = {};
      manifest.push(themeManifestItem);
    }

    themeManifestItem.path = 'app/theme.css';
    themeManifestItem.type = 'css';
    themeManifestItem.cacheable = true;
    themeManifestItem.where = 'client';
    themeManifestItem.url = `/theme.css?${hash}`;
    themeManifestItem.size = css.length;
    themeManifestItem.hash = hash;
  }

  return calculateClientHash.call(this, manifest, includeFilter, runtimeConfigOverride);
};

RocketChat.theme = new class {
  constructor() {
    this.variables = {};
    this.packageCallbacks = [];
    this.files = ['server/colors.less'];
    this.customCSS = '';
    RocketChat.settings.add('css', '');
    RocketChat.settings.addGroup('Layout');
    RocketChat.settings.onload('css', Meteor.bindEnvironment((key, value, initialLoad) => {
      if (!initialLoad) {
        Meteor.startup(function () {
          process.emit('message', {
            refresh: 'client'
          });
        });
      }
    }));
    this.compileDelayed = _.debounce(Meteor.bindEnvironment(this.compile.bind(this)), 100);
    Meteor.startup(() => {
      RocketChat.settings.onAfterInitialLoad(() => {
        RocketChat.settings.get(/^theme-./, Meteor.bindEnvironment((key, value) => {
          if (key === 'theme-custom-css' && value != null) {
            this.customCSS = value;
          } else {
            const name = key.replace(/^theme-[a-z]+-/, '');

            if (this.variables[name] != null) {
              this.variables[name].value = value;
            }
          }

          this.compileDelayed();
        }));
      });
    });
  }

  compile() {
    let content = [this.getVariablesAsLess()];
    content.push(...this.files.map(name => Assets.getText(name)));
    content.push(...this.packageCallbacks.map(name => name()));
    content.push(this.customCSS);
    content = content.join('\n');
    const options = {
      compress: true,
      plugins: [new Autoprefixer()]
    };
    const start = Date.now();
    return less.render(content, options, function (err, data) {
      logger.stop_rendering(Date.now() - start);

      if (err != null) {
        return console.log(err);
      }

      RocketChat.settings.updateById('css', data.css);
      return Meteor.startup(function () {
        return Meteor.setTimeout(function () {
          return process.emit('message', {
            refresh: 'client'
          });
        }, 200);
      });
    });
  }

  addColor(name, value, section, properties) {
    const config = {
      group: 'Colors',
      type: 'color',
      editor: 'color',
      public: true,
      properties,
      section
    };
    return RocketChat.settings.add(`theme-color-${name}`, value, config);
  }

  addVariable(type, name, value, section, persist = true, editor, allowedTypes, property) {
    this.variables[name] = {
      type,
      value
    };

    if (persist) {
      const config = {
        group: 'Layout',
        type,
        editor: editor || type,
        section,
        'public': true,
        allowedTypes,
        property
      };
      return RocketChat.settings.add(`theme-${type}-${name}`, value, config);
    }
  }

  addPublicColor(name, value, section, editor = 'color', property) {
    return this.addVariable('color', name, value, section, true, editor, ['color', 'expression'], property);
  }

  addPublicFont(name, value) {
    return this.addVariable('font', name, value, 'Fonts', true);
  }

  getVariablesAsObject() {
    return Object.keys(this.variables).reduce((obj, name) => {
      obj[name] = this.variables[name].value;
      return obj;
    }, {});
  }

  getVariablesAsLess() {
    return Object.keys(this.variables).map(name => {
      const variable = this.variables[name];
      return `@${name}: ${variable.value};`;
    }).join('\n');
  }

  addPackageAsset(cb) {
    this.packageCallbacks.push(cb);
    return this.compileDelayed();
  }

  getCss() {
    return RocketChat.settings.get('css') || '';
  }

}();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"variables.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/rocketchat_theme/server/variables.js                                                             //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
// TODO: Define registers/getters/setters for packages to work with established
// 			heirarchy of colors instead of making duplicate definitions
// TODO: Settings pages to show simple separation of major/minor/addon colors
// TODO: Get major colours as swatches for minor colors in minicolors plugin
// TODO: Minicolors settings to use rgb for alphas, hex otherwise
// TODO: Add setting toggle to use defaults for minor colours and hide settings
// New colors, used for shades on solid backgrounds
// Defined range of transparencies reduces random colour variances
// Major colors form the core of the scheme
// Names changed to reflect usage, comments show pre-refactor names
const reg = /--(rc-color-.*?): (.*?);/igm;
const colors = [...Assets.getText('client/imports/general/variables.css').match(reg)].map(color => {
  const [name, value] = color.split(': ');
  return [name.replace('--', ''), value.replace(';', '')];
});
colors.forEach(([key, color]) => {
  if (/var/.test(color)) {
    const [, value] = color.match(/var\(--(.*?)\)/i);
    return RocketChat.theme.addPublicColor(key, value, 'Colors', 'expression');
  }

  RocketChat.theme.addPublicColor(key, color, 'Colors');
});
const majorColors = {
  'content-background-color': '#FFFFFF',
  'primary-background-color': '#04436A',
  'primary-font-color': '#444444',
  'primary-action-color': '#13679A',
  // was action-buttons-color
  'secondary-background-color': '#F4F4F4',
  'secondary-font-color': '#A0A0A0',
  'secondary-action-color': '#DDDDDD',
  'component-color': '#EAEAEA',
  'success-color': '#4dff4d',
  'pending-color': '#FCB316',
  'error-color': '#BC2031',
  'selection-color': '#02ACEC',
  'attention-color': '#9C27B0'
}; // Minor colours implement major colours by default, but can be overruled

const minorColors = {
  'tertiary-background-color': '@component-color',
  'tertiary-font-color': '@transparent-lightest',
  'link-font-color': '@primary-action-color',
  'info-font-color': '@secondary-font-color',
  'custom-scrollbar-color': '@transparent-darker',
  'status-online': '@success-color',
  'status-away': '@pending-color',
  'status-busy': '@error-color',
  'status-offline': '@transparent-darker'
}; // Bulk-add settings for color scheme

Object.keys(majorColors).forEach(key => {
  const value = majorColors[key];
  RocketChat.theme.addPublicColor(key, value, 'Old Colors');
});
Object.keys(minorColors).forEach(key => {
  const value = minorColors[key];
  RocketChat.theme.addPublicColor(key, value, 'Old Colors (minor)', 'expression');
});
RocketChat.theme.addPublicFont('body-font-family', '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Helvetica Neue\', \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\', Arial, sans-serif');
RocketChat.settings.add('theme-custom-css', '', {
  group: 'Layout',
  type: 'code',
  code: 'text/css',
  multiline: true,
  section: 'Custom CSS',
  public: true
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:theme/server/server.js");
require("/node_modules/meteor/rocketchat:theme/server/variables.js");

/* Exports */
Package._define("rocketchat:theme");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_theme.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0aGVtZS9zZXJ2ZXIvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRoZW1lL3NlcnZlci92YXJpYWJsZXMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwibGVzcyIsIkF1dG9wcmVmaXhlciIsImNyeXB0byIsImxvZ2dlciIsIkxvZ2dlciIsIm1ldGhvZHMiLCJzdG9wX3JlbmRlcmluZyIsInR5cGUiLCJXZWJBcHAiLCJyYXdDb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJyZXEiLCJyZXMiLCJuZXh0IiwicGF0aCIsInVybCIsInNwbGl0IiwicHJlZml4IiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwiY3NzIiwiUm9ja2V0Q2hhdCIsInRoZW1lIiwiZ2V0Q3NzIiwiaGFzaCIsImNyZWF0ZUhhc2giLCJ1cGRhdGUiLCJkaWdlc3QiLCJzZXRIZWFkZXIiLCJ3cml0ZSIsImVuZCIsImNhbGN1bGF0ZUNsaWVudEhhc2giLCJXZWJBcHBIYXNoaW5nIiwibWFuaWZlc3QiLCJpbmNsdWRlRmlsdGVyIiwicnVudGltZUNvbmZpZ092ZXJyaWRlIiwidHJpbSIsInRoZW1lTWFuaWZlc3RJdGVtIiwiZmluZCIsIml0ZW0iLCJwdXNoIiwiY2FjaGVhYmxlIiwid2hlcmUiLCJzaXplIiwibGVuZ3RoIiwiY2FsbCIsImNvbnN0cnVjdG9yIiwidmFyaWFibGVzIiwicGFja2FnZUNhbGxiYWNrcyIsImZpbGVzIiwiY3VzdG9tQ1NTIiwic2V0dGluZ3MiLCJhZGQiLCJhZGRHcm91cCIsIm9ubG9hZCIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsImtleSIsInZhbHVlIiwiaW5pdGlhbExvYWQiLCJzdGFydHVwIiwicHJvY2VzcyIsImVtaXQiLCJyZWZyZXNoIiwiY29tcGlsZURlbGF5ZWQiLCJkZWJvdW5jZSIsImNvbXBpbGUiLCJiaW5kIiwib25BZnRlckluaXRpYWxMb2FkIiwiZ2V0IiwibmFtZSIsInJlcGxhY2UiLCJjb250ZW50IiwiZ2V0VmFyaWFibGVzQXNMZXNzIiwibWFwIiwiQXNzZXRzIiwiZ2V0VGV4dCIsImpvaW4iLCJvcHRpb25zIiwiY29tcHJlc3MiLCJwbHVnaW5zIiwic3RhcnQiLCJEYXRlIiwibm93IiwicmVuZGVyIiwiZXJyIiwiZGF0YSIsImNvbnNvbGUiLCJsb2ciLCJ1cGRhdGVCeUlkIiwic2V0VGltZW91dCIsImFkZENvbG9yIiwic2VjdGlvbiIsInByb3BlcnRpZXMiLCJjb25maWciLCJncm91cCIsImVkaXRvciIsInB1YmxpYyIsImFkZFZhcmlhYmxlIiwicGVyc2lzdCIsImFsbG93ZWRUeXBlcyIsInByb3BlcnR5IiwiYWRkUHVibGljQ29sb3IiLCJhZGRQdWJsaWNGb250IiwiZ2V0VmFyaWFibGVzQXNPYmplY3QiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwib2JqIiwidmFyaWFibGUiLCJhZGRQYWNrYWdlQXNzZXQiLCJjYiIsInJlZyIsImNvbG9ycyIsIm1hdGNoIiwiY29sb3IiLCJmb3JFYWNoIiwidGVzdCIsIm1ham9yQ29sb3JzIiwibWlub3JDb2xvcnMiLCJjb2RlIiwibXVsdGlsaW5lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsSUFBSjtBQUFTTCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsTUFBUixDQUFiLEVBQTZCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDQyxXQUFLRCxDQUFMO0FBQU87O0FBQW5CLENBQTdCLEVBQWtELENB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QWpCLENBQStCLGtCQUEvQixFQUFtRCwwTUFBbkQ7QUFFQWxGLFdBQVc4QixRQUFYLENBQW9CQyxHQUFwQixDQUF3QixrQkFBeEIsRUFBNEMsRUFBNUMsRUFBZ0Q7QUFDL0MyQyxTQUFPLFFBRHdDO0FBRS9DeEYsUUFBTSxNQUZ5QztBQUcvQ2lILFFBQU0sVUFIeUM7QUFJL0NDLGFBQVcsSUFKb0M7QUFLL0M3QixXQUFTLFlBTHNDO0FBTS9DSyxVQUFRO0FBTnVDLENBQWhELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfdGhlbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIFdlYkFwcEhhc2hpbmcgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgbGVzcyBmcm9tICdsZXNzJztcbmltcG9ydCBBdXRvcHJlZml4ZXIgZnJvbSAnbGVzcy1wbHVnaW4tYXV0b3ByZWZpeCc7XG5pbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ3JvY2tldGNoYXQ6dGhlbWUnLCB7XG5cdG1ldGhvZHM6IHtcblx0XHRzdG9wX3JlbmRlcmluZzoge1xuXHRcdFx0dHlwZTogJ2luZm8nXG5cdFx0fVxuXHR9XG59KTtcblxuV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblx0Y29uc3QgcGF0aCA9IHJlcS51cmwuc3BsaXQoJz8nKVswXTtcblx0Y29uc3QgcHJlZml4ID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCB8fCAnJztcblx0aWYgKHBhdGggPT09IGAkeyBwcmVmaXggfS9fX2NvcmRvdmEvdGhlbWUuY3NzYCB8fCBwYXRoID09PSBgJHsgcHJlZml4IH0vdGhlbWUuY3NzYCkge1xuXHRcdGNvbnN0IGNzcyA9IFJvY2tldENoYXQudGhlbWUuZ2V0Q3NzKCk7XG5cdFx0Y29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGExJykudXBkYXRlKGNzcykuZGlnZXN0KCdoZXgnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9jc3M7IGNoYXJzZXQ9VVRGLTgnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdFVGFnJywgYFwiJHsgaGFzaCB9XCJgKTtcblx0XHRyZXMud3JpdGUoY3NzKTtcblx0XHRyZXR1cm4gcmVzLmVuZCgpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBuZXh0KCk7XG5cdH1cbn0pO1xuXG5jb25zdCBjYWxjdWxhdGVDbGllbnRIYXNoID0gV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoO1xuXG5XZWJBcHBIYXNoaW5nLmNhbGN1bGF0ZUNsaWVudEhhc2ggPSBmdW5jdGlvbihtYW5pZmVzdCwgaW5jbHVkZUZpbHRlciwgcnVudGltZUNvbmZpZ092ZXJyaWRlKSB7XG5cdGNvbnN0IGNzcyA9IFJvY2tldENoYXQudGhlbWUuZ2V0Q3NzKCk7XG5cdGlmIChjc3MudHJpbSgpICE9PSAnJykge1xuXHRcdGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpLnVwZGF0ZShjc3MpLmRpZ2VzdCgnaGV4Jyk7XG5cdFx0bGV0IHRoZW1lTWFuaWZlc3RJdGVtID0gXy5maW5kKG1hbmlmZXN0LCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gaXRlbS5wYXRoID09PSAnYXBwL3RoZW1lLmNzcyc7XG5cdFx0fSk7XG5cdFx0aWYgKHRoZW1lTWFuaWZlc3RJdGVtID09IG51bGwpIHtcblx0XHRcdHRoZW1lTWFuaWZlc3RJdGVtID0ge307XG5cdFx0XHRtYW5pZmVzdC5wdXNoKHRoZW1lTWFuaWZlc3RJdGVtKTtcblx0XHR9XG5cdFx0dGhlbWVNYW5pZmVzdEl0ZW0ucGF0aCA9ICdhcHAvdGhlbWUuY3NzJztcblx0XHR0aGVtZU1hbmlmZXN0SXRlbS50eXBlID0gJ2Nzcyc7XG5cdFx0dGhlbWVNYW5pZmVzdEl0ZW0uY2FjaGVhYmxlID0gdHJ1ZTtcblx0XHR0aGVtZU1hbmlmZXN0SXRlbS53aGVyZSA9ICdjbGllbnQnO1xuXHRcdHRoZW1lTWFuaWZlc3RJdGVtLnVybCA9IGAvdGhlbWUuY3NzPyR7IGhhc2ggfWA7XG5cdFx0dGhlbWVNYW5pZmVzdEl0ZW0uc2l6ZSA9IGNzcy5sZW5ndGg7XG5cdFx0dGhlbWVNYW5pZmVzdEl0ZW0uaGFzaCA9IGhhc2g7XG5cdH1cblx0cmV0dXJuIGNhbGN1bGF0ZUNsaWVudEhhc2guY2FsbCh0aGlzLCBtYW5pZmVzdCwgaW5jbHVkZUZpbHRlciwgcnVudGltZUNvbmZpZ092ZXJyaWRlKTtcbn07XG5cblJvY2tldENoYXQudGhlbWUgPSBuZXcgY2xhc3Mge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnZhcmlhYmxlcyA9IHt9O1xuXHRcdHRoaXMucGFja2FnZUNhbGxiYWNrcyA9IFtdO1xuXHRcdHRoaXMuZmlsZXMgPSBbJ3NlcnZlci9jb2xvcnMubGVzcyddO1xuXHRcdHRoaXMuY3VzdG9tQ1NTID0gJyc7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ2NzcycsICcnKTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdMYXlvdXQnKTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLm9ubG9hZCgnY3NzJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoa2V5LCB2YWx1ZSwgaW5pdGlhbExvYWQpID0+IHtcblx0XHRcdGlmICghaW5pdGlhbExvYWQpIHtcblx0XHRcdFx0TWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cHJvY2Vzcy5lbWl0KCdtZXNzYWdlJywge1xuXHRcdFx0XHRcdFx0cmVmcmVzaDogJ2NsaWVudCdcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSkpO1xuXHRcdHRoaXMuY29tcGlsZURlbGF5ZWQgPSBfLmRlYm91bmNlKE1ldGVvci5iaW5kRW52aXJvbm1lbnQodGhpcy5jb21waWxlLmJpbmQodGhpcykpLCAxMDApO1xuXHRcdE1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3Mub25BZnRlckluaXRpYWxMb2FkKCgpID0+IHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL150aGVtZS0uLywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGlmIChrZXkgPT09ICd0aGVtZS1jdXN0b20tY3NzJyAmJiB2YWx1ZSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmN1c3RvbUNTUyA9IHZhbHVlO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb25zdCBuYW1lID0ga2V5LnJlcGxhY2UoL150aGVtZS1bYS16XSstLywgJycpO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMudmFyaWFibGVzW25hbWVdICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy52YXJpYWJsZXNbbmFtZV0udmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLmNvbXBpbGVEZWxheWVkKCk7XG5cdFx0XHRcdH0pKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29tcGlsZSgpIHtcblx0XHRsZXQgY29udGVudCA9IFt0aGlzLmdldFZhcmlhYmxlc0FzTGVzcygpXTtcblxuXHRcdGNvbnRlbnQucHVzaCguLi50aGlzLmZpbGVzLm1hcCgobmFtZSkgPT4gQXNzZXRzLmdldFRleHQobmFtZSkpKTtcblxuXHRcdGNvbnRlbnQucHVzaCguLi50aGlzLnBhY2thZ2VDYWxsYmFja3MubWFwKG5hbWUgPT4gbmFtZSgpKSk7XG5cblx0XHRjb250ZW50LnB1c2godGhpcy5jdXN0b21DU1MpO1xuXHRcdGNvbnRlbnQgPSBjb250ZW50LmpvaW4oJ1xcbicpO1xuXHRcdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0XHRjb21wcmVzczogdHJ1ZSxcblx0XHRcdHBsdWdpbnM6IFtuZXcgQXV0b3ByZWZpeGVyKCldXG5cdFx0fTtcblx0XHRjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG5cdFx0cmV0dXJuIGxlc3MucmVuZGVyKGNvbnRlbnQsIG9wdGlvbnMsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuXHRcdFx0bG9nZ2VyLnN0b3BfcmVuZGVyaW5nKERhdGUubm93KCkgLSBzdGFydCk7XG5cdFx0XHRpZiAoZXJyICE9IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHR9XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ2NzcycsIGRhdGEuY3NzKTtcblx0XHRcdHJldHVybiBNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIE1ldGVvci5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiBwcm9jZXNzLmVtaXQoJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdFx0XHRyZWZyZXNoOiAnY2xpZW50J1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9LCAyMDApO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRhZGRDb2xvcihuYW1lLCB2YWx1ZSwgc2VjdGlvbiwgcHJvcGVydGllcykge1xuXHRcdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRcdGdyb3VwOiAnQ29sb3JzJyxcblx0XHRcdHR5cGU6ICdjb2xvcicsXG5cdFx0XHRlZGl0b3I6ICdjb2xvcicsXG5cdFx0XHRwdWJsaWM6IHRydWUsXG5cdFx0XHRwcm9wZXJ0aWVzLFxuXHRcdFx0c2VjdGlvblxuXHRcdH07XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoYHRoZW1lLWNvbG9yLSR7IG5hbWUgfWAsIHZhbHVlLCBjb25maWcpO1xuXHR9XG5cblx0YWRkVmFyaWFibGUodHlwZSwgbmFtZSwgdmFsdWUsIHNlY3Rpb24sIHBlcnNpc3QgPSB0cnVlLCBlZGl0b3IsIGFsbG93ZWRUeXBlcywgcHJvcGVydHkpIHtcblx0XHR0aGlzLnZhcmlhYmxlc1tuYW1lXSA9IHtcblx0XHRcdHR5cGUsXG5cdFx0XHR2YWx1ZVxuXHRcdH07XG5cdFx0aWYgKHBlcnNpc3QpIHtcblx0XHRcdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRcdFx0Z3JvdXA6ICdMYXlvdXQnLFxuXHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRlZGl0b3I6IGVkaXRvciB8fCB0eXBlLFxuXHRcdFx0XHRzZWN0aW9uLFxuXHRcdFx0XHQncHVibGljJzogdHJ1ZSxcblx0XHRcdFx0YWxsb3dlZFR5cGVzLFxuXHRcdFx0XHRwcm9wZXJ0eVxuXHRcdFx0fTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLmFkZChgdGhlbWUtJHsgdHlwZSB9LSR7IG5hbWUgfWAsIHZhbHVlLCBjb25maWcpO1xuXHRcdH1cblxuXHR9XG5cblx0YWRkUHVibGljQ29sb3IobmFtZSwgdmFsdWUsIHNlY3Rpb24sIGVkaXRvciA9ICdjb2xvcicsIHByb3BlcnR5KSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkVmFyaWFibGUoJ2NvbG9yJywgbmFtZSwgdmFsdWUsIHNlY3Rpb24sIHRydWUsIGVkaXRvciwgWydjb2xvcicsICdleHByZXNzaW9uJ10sIHByb3BlcnR5KTtcblx0fVxuXG5cdGFkZFB1YmxpY0ZvbnQobmFtZSwgdmFsdWUpIHtcblx0XHRyZXR1cm4gdGhpcy5hZGRWYXJpYWJsZSgnZm9udCcsIG5hbWUsIHZhbHVlLCAnRm9udHMnLCB0cnVlKTtcblx0fVxuXG5cdGdldFZhcmlhYmxlc0FzT2JqZWN0KCkge1xuXHRcdHJldHVybiBPYmplY3Qua2V5cyh0aGlzLnZhcmlhYmxlcykucmVkdWNlKChvYmosIG5hbWUpID0+IHtcblx0XHRcdG9ialtuYW1lXSA9IHRoaXMudmFyaWFibGVzW25hbWVdLnZhbHVlO1xuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR9LCB7fSk7XG5cdH1cblxuXHRnZXRWYXJpYWJsZXNBc0xlc3MoKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudmFyaWFibGVzKS5tYXAoKG5hbWUpID0+IHtcblx0XHRcdGNvbnN0IHZhcmlhYmxlID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG5cdFx0XHRyZXR1cm4gYEAkeyBuYW1lIH06ICR7IHZhcmlhYmxlLnZhbHVlIH07YDtcblx0XHR9KS5qb2luKCdcXG4nKTtcblx0fVxuXG5cdGFkZFBhY2thZ2VBc3NldChjYikge1xuXHRcdHRoaXMucGFja2FnZUNhbGxiYWNrcy5wdXNoKGNiKTtcblx0XHRyZXR1cm4gdGhpcy5jb21waWxlRGVsYXllZCgpO1xuXHR9XG5cblx0Z2V0Q3NzKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnY3NzJykgfHwgJyc7XG5cdH1cblxufTtcbiIsIlxuLy8gVE9ETzogRGVmaW5lIHJlZ2lzdGVycy9nZXR0ZXJzL3NldHRlcnMgZm9yIHBhY2thZ2VzIHRvIHdvcmsgd2l0aCBlc3RhYmxpc2hlZFxuLy8gXHRcdFx0aGVpcmFyY2h5IG9mIGNvbG9ycyBpbnN0ZWFkIG9mIG1ha2luZyBkdXBsaWNhdGUgZGVmaW5pdGlvbnNcbi8vIFRPRE86IFNldHRpbmdzIHBhZ2VzIHRvIHNob3cgc2ltcGxlIHNlcGFyYXRpb24gb2YgbWFqb3IvbWlub3IvYWRkb24gY29sb3JzXG4vLyBUT0RPOiBHZXQgbWFqb3IgY29sb3VycyBhcyBzd2F0Y2hlcyBmb3IgbWlub3IgY29sb3JzIGluIG1pbmljb2xvcnMgcGx1Z2luXG4vLyBUT0RPOiBNaW5pY29sb3JzIHNldHRpbmdzIHRvIHVzZSByZ2IgZm9yIGFscGhhcywgaGV4IG90aGVyd2lzZVxuLy8gVE9ETzogQWRkIHNldHRpbmcgdG9nZ2xlIHRvIHVzZSBkZWZhdWx0cyBmb3IgbWlub3IgY29sb3VycyBhbmQgaGlkZSBzZXR0aW5nc1xuXG4vLyBOZXcgY29sb3JzLCB1c2VkIGZvciBzaGFkZXMgb24gc29saWQgYmFja2dyb3VuZHNcbi8vIERlZmluZWQgcmFuZ2Ugb2YgdHJhbnNwYXJlbmNpZXMgcmVkdWNlcyByYW5kb20gY29sb3VyIHZhcmlhbmNlc1xuLy8gTWFqb3IgY29sb3JzIGZvcm0gdGhlIGNvcmUgb2YgdGhlIHNjaGVtZVxuLy8gTmFtZXMgY2hhbmdlZCB0byByZWZsZWN0IHVzYWdlLCBjb21tZW50cyBzaG93IHByZS1yZWZhY3RvciBuYW1lc1xuXG5jb25zdCByZWcgPSAvLS0ocmMtY29sb3ItLio/KTogKC4qPyk7L2lnbTtcblxuY29uc3QgY29sb3JzID0gWy4uLkFzc2V0cy5nZXRUZXh0KCdjbGllbnQvaW1wb3J0cy9nZW5lcmFsL3ZhcmlhYmxlcy5jc3MnKS5tYXRjaChyZWcpXS5tYXAoY29sb3IgPT4ge1xuXHRjb25zdCBbbmFtZSwgdmFsdWVdID0gY29sb3Iuc3BsaXQoJzogJyk7XG5cdHJldHVybiBbbmFtZS5yZXBsYWNlKCctLScsICcnKSwgdmFsdWUucmVwbGFjZSgnOycsICcnKV07XG59KTtcblxuY29sb3JzLmZvckVhY2goKFtrZXksIGNvbG9yXSkgPT4gXHR7XG5cdGlmICgvdmFyLy50ZXN0KGNvbG9yKSkge1xuXHRcdGNvbnN0IFssIHZhbHVlXSA9IGNvbG9yLm1hdGNoKC92YXJcXCgtLSguKj8pXFwpL2kpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LnRoZW1lLmFkZFB1YmxpY0NvbG9yKGtleSwgdmFsdWUsICdDb2xvcnMnLCAnZXhwcmVzc2lvbicpO1xuXHR9XG5cdFJvY2tldENoYXQudGhlbWUuYWRkUHVibGljQ29sb3Ioa2V5LCBjb2xvciwgJ0NvbG9ycycpO1xufSk7XG5cbmNvbnN0IG1ham9yQ29sb3JzPSB7XG5cdCdjb250ZW50LWJhY2tncm91bmQtY29sb3InOiAnI0ZGRkZGRicsXG5cdCdwcmltYXJ5LWJhY2tncm91bmQtY29sb3InOiAnIzA0NDM2QScsXG5cdCdwcmltYXJ5LWZvbnQtY29sb3InOiAnIzQ0NDQ0NCcsXG5cdCdwcmltYXJ5LWFjdGlvbi1jb2xvcic6ICcjMTM2NzlBJywgLy8gd2FzIGFjdGlvbi1idXR0b25zLWNvbG9yXG5cdCdzZWNvbmRhcnktYmFja2dyb3VuZC1jb2xvcic6ICcjRjRGNEY0Jyxcblx0J3NlY29uZGFyeS1mb250LWNvbG9yJzogJyNBMEEwQTAnLFxuXHQnc2Vjb25kYXJ5LWFjdGlvbi1jb2xvcic6ICcjREREREREJyxcblx0J2NvbXBvbmVudC1jb2xvcic6ICcjRUFFQUVBJyxcblx0J3N1Y2Nlc3MtY29sb3InOiAnIzRkZmY0ZCcsXG5cdCdwZW5kaW5nLWNvbG9yJzogJyNGQ0IzMTYnLFxuXHQnZXJyb3ItY29sb3InOiAnI0JDMjAzMScsXG5cdCdzZWxlY3Rpb24tY29sb3InOiAnIzAyQUNFQycsXG5cdCdhdHRlbnRpb24tY29sb3InOiAnIzlDMjdCMCdcbn07XG5cbi8vIE1pbm9yIGNvbG91cnMgaW1wbGVtZW50IG1ham9yIGNvbG91cnMgYnkgZGVmYXVsdCwgYnV0IGNhbiBiZSBvdmVycnVsZWRcbmNvbnN0IG1pbm9yQ29sb3JzPSB7XG5cdCd0ZXJ0aWFyeS1iYWNrZ3JvdW5kLWNvbG9yJzogJ0Bjb21wb25lbnQtY29sb3InLFxuXHQndGVydGlhcnktZm9udC1jb2xvcic6ICdAdHJhbnNwYXJlbnQtbGlnaHRlc3QnLFxuXHQnbGluay1mb250LWNvbG9yJzogJ0BwcmltYXJ5LWFjdGlvbi1jb2xvcicsXG5cdCdpbmZvLWZvbnQtY29sb3InOiAnQHNlY29uZGFyeS1mb250LWNvbG9yJyxcblx0J2N1c3RvbS1zY3JvbGxiYXItY29sb3InOiAnQHRyYW5zcGFyZW50LWRhcmtlcicsXG5cdCdzdGF0dXMtb25saW5lJzogJ0BzdWNjZXNzLWNvbG9yJyxcblx0J3N0YXR1cy1hd2F5JzogJ0BwZW5kaW5nLWNvbG9yJyxcblx0J3N0YXR1cy1idXN5JzogJ0BlcnJvci1jb2xvcicsXG5cdCdzdGF0dXMtb2ZmbGluZSc6ICdAdHJhbnNwYXJlbnQtZGFya2VyJ1xufTtcblxuLy8gQnVsay1hZGQgc2V0dGluZ3MgZm9yIGNvbG9yIHNjaGVtZVxuT2JqZWN0LmtleXMobWFqb3JDb2xvcnMpLmZvckVhY2goKGtleSkgPT4ge1xuXHRjb25zdCB2YWx1ZSA9IG1ham9yQ29sb3JzW2tleV07XG5cdFJvY2tldENoYXQudGhlbWUuYWRkUHVibGljQ29sb3Ioa2V5LCB2YWx1ZSwgJ09sZCBDb2xvcnMnKTtcbn0pO1xuXG5PYmplY3Qua2V5cyhtaW5vckNvbG9ycykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdGNvbnN0IHZhbHVlID0gbWlub3JDb2xvcnNba2V5XTtcblx0Um9ja2V0Q2hhdC50aGVtZS5hZGRQdWJsaWNDb2xvcihrZXksIHZhbHVlLCAnT2xkIENvbG9ycyAobWlub3IpJywgJ2V4cHJlc3Npb24nKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnRoZW1lLmFkZFB1YmxpY0ZvbnQoJ2JvZHktZm9udC1mYW1pbHknLCAnLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcXCdTZWdvZSBVSVxcJywgUm9ib3RvLCBPeHlnZW4sIFVidW50dSwgQ2FudGFyZWxsLCBcXCdIZWx2ZXRpY2EgTmV1ZVxcJywgXFwnQXBwbGUgQ29sb3IgRW1vamlcXCcsIFxcJ1NlZ29lIFVJIEVtb2ppXFwnLCBcXCdTZWdvZSBVSSBTeW1ib2xcXCcsIFxcJ01laXJ5byBVSVxcJywgQXJpYWwsIHNhbnMtc2VyaWYnKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ3RoZW1lLWN1c3RvbS1jc3MnLCAnJywge1xuXHRncm91cDogJ0xheW91dCcsXG5cdHR5cGU6ICdjb2RlJyxcblx0Y29kZTogJ3RleHQvY3NzJyxcblx0bXVsdGlsaW5lOiB0cnVlLFxuXHRzZWN0aW9uOiAnQ3VzdG9tIENTUycsXG5cdHB1YmxpYzogdHJ1ZVxufSk7XG5cbiJdfQ==
