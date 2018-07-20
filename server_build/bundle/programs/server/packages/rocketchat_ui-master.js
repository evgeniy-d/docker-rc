(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Inject = Package['meteorhacks:inject-initial'].Inject;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:ui-master":{"server":{"inject.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/rocketchat_ui-master/server/inject.js                                                                 //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const renderDynamicCssList = _.debounce(Meteor.bindEnvironment(() => {
  // const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
  const colors = RocketChat.models.Settings.find({
    _id: /theme-color-rc/i
  }, {
    fields: {
      value: 1,
      editor: 1
    }
  }).fetch().filter(color => color && color.value);

  if (!colors) {
    return;
  }

  const css = colors.map(({
    _id,
    value,
    editor
  }) => {
    if (editor === 'expression') {
      return `--${_id.replace('theme-color-', '')}: var(--${value});`;
    }

    return `--${_id.replace('theme-color-', '')}: ${value};`;
  }).join('\n');
  Inject.rawBody('dynamic-variables', `<style id='css-variables'> :root {${css}}</style>`);
}), 500);

renderDynamicCssList(); // RocketChat.models.Settings.find({_id:'theme-custom-variables'}, {fields: { value: 1}}).observe({
// 	changed: renderDynamicCssList
// });

RocketChat.models.Settings.find({
  _id: /theme-color-rc/i
}, {
  fields: {
    value: 1
  }
}).observe({
  changed: renderDynamicCssList
});
Inject.rawHead('noreferrer', '<meta name="referrer" content="origin-when-crossorigin">');
Inject.rawHead('dynamic', `<script>${Assets.getText('server/dynamic-css.js')}</script>`);
Inject.rawBody('icons', Assets.getText('public/icons.svg'));
Inject.rawBody('page-loading-div', `
<div id="initial-page-loading" class="page-loading">
	<div class="loading-animation">
		<div class="bounce bounce1"></div>
		<div class="bounce bounce2"></div>
		<div class="bounce bounce3"></div>
	</div>
</div>`);

if (process.env.DISABLE_ANIMATION || process.env.TEST_MODE === 'true') {
  Inject.rawHead('disable-animation', `
	<style>
		body, body * {
			animation: none !important;
			transition: none !important;
		}
	</style>
	<script>
		window.DISABLE_ANIMATION = true;
	</script>
	`);
}

RocketChat.settings.get('Assets_SvgFavicon_Enable', (key, value) => {
  const standardFavicons = `
		<link rel="icon" sizes="16x16" type="image/png" href="assets/favicon_16.png" />
		<link rel="icon" sizes="32x32" type="image/png" href="assets/favicon_32.png" />`;

  if (value) {
    Inject.rawHead(key, `${standardFavicons}
			<link rel="icon" sizes="any" type="image/svg+xml" href="assets/favicon.svg" />`);
  } else {
    Inject.rawHead(key, standardFavicons);
  }
});
RocketChat.settings.get('theme-color-sidebar-background', (key, value) => {
  Inject.rawHead(key, `<meta name="msapplication-TileColor" content="${value}" />` + `<meta name="theme-color" content="${value}" />`);
});
RocketChat.settings.get('Accounts_ForgetUserSessionOnWindowClose', (key, value) => {
  if (value) {
    Inject.rawModHtml(key, html => {
      const script = `
				<script>
					if (Meteor._localStorage._data === undefined && window.sessionStorage) {
						Meteor._localStorage = window.sessionStorage;
					}
				</script>
			`;
      return html.replace(/<\/body>/, `${script}\n</body>`);
    });
  } else {
    Inject.rawModHtml(key, html => {
      return html;
    });
  }
});
RocketChat.settings.get('Site_Name', (key, value = 'Rocket.Chat') => {
  Inject.rawHead(key, `<title>${value}</title>` + `<meta name="application-name" content="${value}">` + `<meta name="apple-mobile-web-app-title" content="${value}">`);
});
RocketChat.settings.get('Meta_language', (key, value = '') => {
  Inject.rawHead(key, `<meta http-equiv="content-language" content="${value}">` + `<meta name="language" content="${value}">`);
});
RocketChat.settings.get('Meta_robots', (key, value = '') => {
  Inject.rawHead(key, `<meta name="robots" content="${value}">`);
});
RocketChat.settings.get('Meta_msvalidate01', (key, value = '') => {
  Inject.rawHead(key, `<meta name="msvalidate.01" content="${value}">`);
});
RocketChat.settings.get('Meta_google-site-verification', (key, value = '') => {
  Inject.rawHead(key, `<meta name="google-site-verification" content="${value}" />`);
});
RocketChat.settings.get('Meta_fb_app_id', (key, value = '') => {
  Inject.rawHead(key, `<meta property="fb:app_id" content="${value}">`);
});
RocketChat.settings.get('Meta_custom', (key, value = '') => {
  Inject.rawHead(key, value);
});
Meteor.defer(() => {
  let baseUrl;

  if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
    baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  } else {
    baseUrl = '/';
  }

  if (/\/$/.test(baseUrl) === false) {
    baseUrl += '/';
  }

  Inject.rawHead('base', `<base href="${baseUrl}">`);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:ui-master/server/inject.js");

/* Exports */
Package._define("rocketchat:ui-master");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_ui-master.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1aS1tYXN0ZXIvc2VydmVyL2luamVjdC5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJyZW5kZXJEeW5hbWljQ3NzTGlzdCIsImRlYm91bmNlIiwiTWV0ZW9yIiwiYmluZEVudmlyb25tZW50IiwiY29sb3JzIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlNldHRpbmdzIiwiZmluZCIsIl9pZCIsImZpZWxkcyIsInZhbHVlIiwiZWRpdG9yIiwiZmV0Y2giLCJmaWx0ZXIiLCJjb2xvciIsImNzcyIsIm1hcCIsInJlcGxhY2UiLCJqb2luIiwiSW5qZWN0IiwicmF3Qm9keSIsIm9ic2VydmUiLCJjaGFuZ2VkIiwicmF3SGVhZCIsIkFzc2V0cyIsImdldFRleHQiLCJwcm9jZXNzIiwiZW52IiwiRElTQUJMRV9BTklNQVRJT04iLCJURVNUX01PREUiLCJzZXR0aW5ncyIsImdldCIsImtleSIsInN0YW5kYXJkRmF2aWNvbnMiLCJyYXdNb2RIdG1sIiwiaHRtbCIsInNjcmlwdCIsImRlZmVyIiwiYmFzZVVybCIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTF9QQVRIX1BSRUZJWCIsInRyaW0iLCJ0ZXN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7O0FBR04sTUFBTUMsdUJBQXVCTixFQUFFTyxRQUFGLENBQVdDLE9BQU9DLGVBQVAsQ0FBdUIsTUFBTTtBQUNwRTtBQUNBLFFBQU1DLFNBQVNDLFdBQVdDLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyxJQUEzQixD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O0FBQ0EsQ0FGRDtBQUlBTixXQUFXMEIsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsZ0JBQXhCLEVBQTBDLENBQUNDLEdBQUQsRUFBTXRCLFFBQVEsRUFBZCxLQUFxQjtBQUM5RFMsU0FBT0ksT0FBUCxDQUFlUyxHQUFmLEVBQXFCLHVDQUF1Q3RCLEtBQU8sSUFBbkU7QUFDQSxDQUZEO0FBSUFOLFdBQVcwQixRQUFYLENBQW9CQyxHQUFwQixDQUF3QixhQUF4QixFQUF1QyxDQUFDQyxHQUFELEVBQU10QixRQUFRLEVBQWQsS0FBcUI7QUFDM0RTLFNBQU9JLE9BQVAsQ0FBZVMsR0FBZixFQUFvQnRCLEtBQXBCO0FBQ0EsQ0FGRDtBQUlBVCxPQUFPb0MsS0FBUCxDQUFhLE1BQU07QUFDbEIsTUFBSUMsT0FBSjs7QUFDQSxNQUFJQywwQkFBMEJDLG9CQUExQixJQUFrREQsMEJBQTBCQyxvQkFBMUIsQ0FBK0NDLElBQS9DLE9BQTBELEVBQWhILEVBQW9IO0FBQ25ISCxjQUFVQywwQkFBMEJDLG9CQUFwQztBQUNBLEdBRkQsTUFFTztBQUNORixjQUFVLEdBQVY7QUFDQTs7QUFDRCxNQUFJLE1BQU1JLElBQU4sQ0FBV0osT0FBWCxNQUF3QixLQUE1QixFQUFtQztBQUNsQ0EsZUFBVyxHQUFYO0FBQ0E7O0FBQ0RuQixTQUFPSSxPQUFQLENBQWUsTUFBZixFQUF3QixlQUFlZSxPQUFTLElBQWhEO0FBQ0EsQ0FYRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3VpLW1hc3Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgSW5qZWN0ICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuY29uc3QgcmVuZGVyRHluYW1pY0Nzc0xpc3QgPSBfLmRlYm91bmNlKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHQvLyBjb25zdCB2YXJpYWJsZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKHtfaWQ6J3RoZW1lLWN1c3RvbS12YXJpYWJsZXMnfSwge2ZpZWxkczogeyB2YWx1ZTogMX19KTtcblx0Y29uc3QgY29sb3JzID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZCh7X2lkOi90aGVtZS1jb2xvci1yYy9pfSwge2ZpZWxkczogeyB2YWx1ZTogMSwgZWRpdG9yOiAxfX0pLmZldGNoKCkuZmlsdGVyKGNvbG9yID0+IGNvbG9yICYmIGNvbG9yLnZhbHVlKTtcblxuXHRpZiAoIWNvbG9ycykge1xuXHRcdHJldHVybjtcblx0fVxuXHRjb25zdCBjc3MgPSBjb2xvcnMubWFwKCh7X2lkLCB2YWx1ZSwgZWRpdG9yfSkgPT4ge1xuXHRcdGlmIChlZGl0b3IgPT09ICdleHByZXNzaW9uJykge1xuXHRcdFx0cmV0dXJuIGAtLSR7IF9pZC5yZXBsYWNlKCd0aGVtZS1jb2xvci0nLCAnJykgfTogdmFyKC0tJHsgdmFsdWUgfSk7YDtcblx0XHR9XG5cdFx0cmV0dXJuIGAtLSR7IF9pZC5yZXBsYWNlKCd0aGVtZS1jb2xvci0nLCAnJykgfTogJHsgdmFsdWUgfTtgO1xuXHR9KS5qb2luKCdcXG4nKTtcblx0SW5qZWN0LnJhd0JvZHkoJ2R5bmFtaWMtdmFyaWFibGVzJywgYDxzdHlsZSBpZD0nY3NzLXZhcmlhYmxlcyc+IDpyb290IHskeyBjc3MgfX08L3N0eWxlPmApO1xufSksIDUwMCk7XG5cbnJlbmRlckR5bmFtaWNDc3NMaXN0KCk7XG5cbi8vIFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQoe19pZDondGhlbWUtY3VzdG9tLXZhcmlhYmxlcyd9LCB7ZmllbGRzOiB7IHZhbHVlOiAxfX0pLm9ic2VydmUoe1xuLy8gXHRjaGFuZ2VkOiByZW5kZXJEeW5hbWljQ3NzTGlzdFxuLy8gfSk7XG5cblJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQoe19pZDovdGhlbWUtY29sb3ItcmMvaX0sIHtmaWVsZHM6IHsgdmFsdWU6IDF9fSkub2JzZXJ2ZSh7XG5cdGNoYW5nZWQ6IHJlbmRlckR5bmFtaWNDc3NMaXN0XG59KTtcblxuSW5qZWN0LnJhd0hlYWQoJ25vcmVmZXJyZXInLCAnPG1ldGEgbmFtZT1cInJlZmVycmVyXCIgY29udGVudD1cIm9yaWdpbi13aGVuLWNyb3Nzb3JpZ2luXCI+Jyk7XG5JbmplY3QucmF3SGVhZCgnZHluYW1pYycsIGA8c2NyaXB0PiR7IEFzc2V0cy5nZXRUZXh0KCdzZXJ2ZXIvZHluYW1pYy1jc3MuanMnKSB9PC9zY3JpcHQ+YCk7XG5cbkluamVjdC5yYXdCb2R5KCdpY29ucycsIEFzc2V0cy5nZXRUZXh0KCdwdWJsaWMvaWNvbnMuc3ZnJykpO1xuXG5JbmplY3QucmF3Qm9keSgncGFnZS1sb2FkaW5nLWRpdicsIGBcbjxkaXYgaWQ9XCJpbml0aWFsLXBhZ2UtbG9hZGluZ1wiIGNsYXNzPVwicGFnZS1sb2FkaW5nXCI+XG5cdDxkaXYgY2xhc3M9XCJsb2FkaW5nLWFuaW1hdGlvblwiPlxuXHRcdDxkaXYgY2xhc3M9XCJib3VuY2UgYm91bmNlMVwiPjwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJib3VuY2UgYm91bmNlMlwiPjwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJib3VuY2UgYm91bmNlM1wiPjwvZGl2PlxuXHQ8L2Rpdj5cbjwvZGl2PmApO1xuXG5pZiAocHJvY2Vzcy5lbnYuRElTQUJMRV9BTklNQVRJT04gfHwgcHJvY2Vzcy5lbnYuVEVTVF9NT0RFID09PSAndHJ1ZScpIHtcblx0SW5qZWN0LnJhd0hlYWQoJ2Rpc2FibGUtYW5pbWF0aW9uJywgYFxuXHQ8c3R5bGU+XG5cdFx0Ym9keSwgYm9keSAqIHtcblx0XHRcdGFuaW1hdGlvbjogbm9uZSAhaW1wb3J0YW50O1xuXHRcdFx0dHJhbnNpdGlvbjogbm9uZSAhaW1wb3J0YW50O1xuXHRcdH1cblx0PC9zdHlsZT5cblx0PHNjcmlwdD5cblx0XHR3aW5kb3cuRElTQUJMRV9BTklNQVRJT04gPSB0cnVlO1xuXHQ8L3NjcmlwdD5cblx0YCk7XG59XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBc3NldHNfU3ZnRmF2aWNvbl9FbmFibGUnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRjb25zdCBzdGFuZGFyZEZhdmljb25zID0gYFxuXHRcdDxsaW5rIHJlbD1cImljb25cIiBzaXplcz1cIjE2eDE2XCIgdHlwZT1cImltYWdlL3BuZ1wiIGhyZWY9XCJhc3NldHMvZmF2aWNvbl8xNi5wbmdcIiAvPlxuXHRcdDxsaW5rIHJlbD1cImljb25cIiBzaXplcz1cIjMyeDMyXCIgdHlwZT1cImltYWdlL3BuZ1wiIGhyZWY9XCJhc3NldHMvZmF2aWNvbl8zMi5wbmdcIiAvPmA7XG5cblx0aWYgKHZhbHVlKSB7XG5cdFx0SW5qZWN0LnJhd0hlYWQoa2V5LFxuXHRcdFx0YCR7IHN0YW5kYXJkRmF2aWNvbnMgfVxuXHRcdFx0PGxpbmsgcmVsPVwiaWNvblwiIHNpemVzPVwiYW55XCIgdHlwZT1cImltYWdlL3N2Zyt4bWxcIiBocmVmPVwiYXNzZXRzL2Zhdmljb24uc3ZnXCIgLz5gKTtcblx0fSBlbHNlIHtcblx0XHRJbmplY3QucmF3SGVhZChrZXksIHN0YW5kYXJkRmF2aWNvbnMpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3RoZW1lLWNvbG9yLXNpZGViYXItYmFja2dyb3VuZCcsIChrZXksIHZhbHVlKSA9PiB7XG5cdEluamVjdC5yYXdIZWFkKGtleSwgYDxtZXRhIG5hbWU9XCJtc2FwcGxpY2F0aW9uLVRpbGVDb2xvclwiIGNvbnRlbnQ9XCIkeyB2YWx1ZSB9XCIgLz5gICtcblx0XHRcdFx0XHRcdGA8bWV0YSBuYW1lPVwidGhlbWUtY29sb3JcIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiIC8+YCk7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX0ZvcmdldFVzZXJTZXNzaW9uT25XaW5kb3dDbG9zZScsIChrZXksIHZhbHVlKSA9PiB7XG5cdGlmICh2YWx1ZSkge1xuXHRcdEluamVjdC5yYXdNb2RIdG1sKGtleSwgKGh0bWwpID0+IHtcblx0XHRcdGNvbnN0IHNjcmlwdCA9IGBcblx0XHRcdFx0PHNjcmlwdD5cblx0XHRcdFx0XHRpZiAoTWV0ZW9yLl9sb2NhbFN0b3JhZ2UuX2RhdGEgPT09IHVuZGVmaW5lZCAmJiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UpIHtcblx0XHRcdFx0XHRcdE1ldGVvci5fbG9jYWxTdG9yYWdlID0gd2luZG93LnNlc3Npb25TdG9yYWdlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0PC9zY3JpcHQ+XG5cdFx0XHRgO1xuXHRcdFx0cmV0dXJuIGh0bWwucmVwbGFjZSgvPFxcL2JvZHk+LywgYCR7IHNjcmlwdCB9XFxuPC9ib2R5PmApO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdEluamVjdC5yYXdNb2RIdG1sKGtleSwgKGh0bWwpID0+IHtcblx0XHRcdHJldHVybiBodG1sO1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NpdGVfTmFtZScsIChrZXksIHZhbHVlID0gJ1JvY2tldC5DaGF0JykgPT4ge1xuXHRJbmplY3QucmF3SGVhZChrZXksXG5cdFx0YDx0aXRsZT4keyB2YWx1ZSB9PC90aXRsZT5gICtcblx0XHRgPG1ldGEgbmFtZT1cImFwcGxpY2F0aW9uLW5hbWVcIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiPmAgK1xuXHRcdGA8bWV0YSBuYW1lPVwiYXBwbGUtbW9iaWxlLXdlYi1hcHAtdGl0bGVcIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiPmApO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXRhX2xhbmd1YWdlJywgKGtleSwgdmFsdWUgPSAnJykgPT4ge1xuXHRJbmplY3QucmF3SGVhZChrZXksXG5cdFx0YDxtZXRhIGh0dHAtZXF1aXY9XCJjb250ZW50LWxhbmd1YWdlXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gICtcblx0XHRgPG1ldGEgbmFtZT1cImxhbmd1YWdlXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWV0YV9yb2JvdHMnLCAoa2V5LCB2YWx1ZSA9ICcnKSA9PiB7XG5cdEluamVjdC5yYXdIZWFkKGtleSwgYDxtZXRhIG5hbWU9XCJyb2JvdHNcIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiPmApO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXRhX21zdmFsaWRhdGUwMScsIChrZXksIHZhbHVlID0gJycpID0+IHtcblx0SW5qZWN0LnJhd0hlYWQoa2V5LCBgPG1ldGEgbmFtZT1cIm1zdmFsaWRhdGUuMDFcIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiPmApO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXRhX2dvb2dsZS1zaXRlLXZlcmlmaWNhdGlvbicsIChrZXksIHZhbHVlID0gJycpID0+IHtcblx0SW5qZWN0LnJhd0hlYWQoa2V5LCBgPG1ldGEgbmFtZT1cImdvb2dsZS1zaXRlLXZlcmlmaWNhdGlvblwiIGNvbnRlbnQ9XCIkeyB2YWx1ZSB9XCIgLz5gKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWV0YV9mYl9hcHBfaWQnLCAoa2V5LCB2YWx1ZSA9ICcnKSA9PiB7XG5cdEluamVjdC5yYXdIZWFkKGtleSwgYDxtZXRhIHByb3BlcnR5PVwiZmI6YXBwX2lkXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWV0YV9jdXN0b20nLCAoa2V5LCB2YWx1ZSA9ICcnKSA9PiB7XG5cdEluamVjdC5yYXdIZWFkKGtleSwgdmFsdWUpO1xufSk7XG5cbk1ldGVvci5kZWZlcigoKSA9PiB7XG5cdGxldCBiYXNlVXJsO1xuXHRpZiAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWCAmJiBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYLnRyaW0oKSAhPT0gJycpIHtcblx0XHRiYXNlVXJsID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWDtcblx0fSBlbHNlIHtcblx0XHRiYXNlVXJsID0gJy8nO1xuXHR9XG5cdGlmICgvXFwvJC8udGVzdChiYXNlVXJsKSA9PT0gZmFsc2UpIHtcblx0XHRiYXNlVXJsICs9ICcvJztcblx0fVxuXHRJbmplY3QucmF3SGVhZCgnYmFzZScsIGA8YmFzZSBocmVmPVwiJHsgYmFzZVVybCB9XCI+YCk7XG59KTtcbiJdfQ==
