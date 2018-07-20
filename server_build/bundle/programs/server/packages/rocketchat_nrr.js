(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:nrr":{"nrr.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_nrr/nrr.js                                                     //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
let Template;
module.watch(require("meteor/templating"), {
  Template(v) {
    Template = v;
  }

}, 0);
let Blaze;
module.watch(require("meteor/blaze"), {
  Blaze(v) {
    Blaze = v;
  }

}, 1);
let HTML;
module.watch(require("meteor/htmljs"), {
  HTML(v) {
    HTML = v;
  }

}, 2);
let Spacebars;
module.watch(require("meteor/spacebars"), {
  Spacebars(v) {
    Spacebars = v;
  }

}, 3);
let Tracker;
module.watch(require("meteor/tracker"), {
  Tracker(v) {
    Tracker = v;
  }

}, 4);

Blaze.toHTMLWithDataNonReactive = function (content, data) {
  const makeCursorReactive = function (obj) {
    if (obj instanceof Meteor.Collection.Cursor) {
      return obj._depend({
        added: true,
        removed: true,
        changed: true
      });
    }
  };

  makeCursorReactive(data);

  if (data instanceof Spacebars.kw && Object.keys(data.hash).length > 0) {
    Object.keys(data.hash).forEach(key => {
      makeCursorReactive(data.hash[key]);
    });
    data = data.hash;
  }

  return Tracker.nonreactive(() => Blaze.toHTMLWithData(content, data));
};

Blaze.registerHelper('nrrargs', function () {
  return {
    _arguments: arguments
  };
});

Blaze.renderNonReactive = function (templateName, data) {
  const {
    _arguments
  } = this.parentView.dataVar.get();
  [templateName, data] = _arguments;
  return Tracker.nonreactive(() => {
    const view = new Blaze.View('nrr', () => {
      return HTML.Raw(Blaze.toHTMLWithDataNonReactive(Template[templateName], data));
    });
    view.onViewReady(() => {
      const {
        onViewReady
      } = Template[templateName];
      return onViewReady && onViewReady.call(view, data);
    });

    view._onViewRendered(() => {
      const {
        onViewRendered
      } = Template[templateName];
      return onViewRendered && onViewRendered.call(view, data);
    });

    return view;
  });
};

Blaze.registerHelper('nrr', Blaze.Template('nrr', Blaze.renderNonReactive));
////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:nrr/nrr.js");

/* Exports */
Package._define("rocketchat:nrr", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_nrr.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpucnIvbnJyLmpzIl0sIm5hbWVzIjpbIlRlbXBsYXRlIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsIkJsYXplIiwiSFRNTCIsIlNwYWNlYmFycyIsIlRyYWNrZXIiLCJ0b0hUTUxXaXRoRGF0YU5vblJlYWN0aXZlIiwiY29udGVudCIsImRhdGEiLCJtYWtlQ3Vyc29yUmVhY3RpdmUiLCJvYmoiLCJNZXRlb3IiLCJDb2xsZWN0aW9uIiwiQ3Vyc29yIiwiX2RlcGVuZCIsImFkZGVkIiwicmVtb3ZlZCIsImNoYW5nZWQiLCJrdyIsIk9iamVjdCIsImtleXMiLCJoYXNoIiwibGVuZ3RoIiwiZm9yRWFjaCIsImtleSIsIm5vbnJlYWN0aXZlIiwidG9IVE1MV2l0aERhdGEiLCJyZWdpc3RlckhlbHBlciIsIl9hcmd1bWVudHMiLCJhcmd1bWVudHMiLCJyZW5kZXJOb25SZWFjdGl2ZSIsInRlbXBsYXRlTmFtZSIsInBhcmVudFZpZXciLCJkYXRhVmFyIiwiZ2V0IiwidmlldyIsIlZpZXciLCJSYXciLCJvblZpZXdSZWFkeSIsImNhbGwiLCJfb25WaWV3UmVuZGVyZWQiLCJvblZpZXdSZW5kZXJlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLFFBQUo7QUFBYUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0gsV0FBU0ksQ0FBVCxFQUFXO0FBQUNKLGVBQVNJLENBQVQ7QUFBVzs7QUFBeEIsQ0FBMUMsRUFBb0UsQ0FBcEU7QUFBdUUsSUFBSUMsS0FBSjtBQUFVSixPQUFPQyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNFLFFBQU1ELENBQU4sRUFBUTtBQUFDQyxZQUFNRCxDQUFOO0FBQVE7O0FBQWxCLENBQXJDLEVBQXlELENBQXpEO0FBQTRELElBQUlFLElBQUo7QUFBU0wsT0FBT0MsS0FBUCxDQUFh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QUE0QnpCLE1BQU1MLFFBQU4sQ0FBZSxLQUFmLEVBQXNCSyxNQUFNNEIsaUJBQTVCLENBQTVCLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbnJyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG5ldy1jYXA6MCAqL1xuXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJ21ldGVvci90ZW1wbGF0aW5nJztcbmltcG9ydCB7IEJsYXplIH0gZnJvbSAnbWV0ZW9yL2JsYXplJztcbmltcG9ydCB7IEhUTUwgfSBmcm9tICdtZXRlb3IvaHRtbGpzJztcbmltcG9ydCB7IFNwYWNlYmFycyB9IGZyb20gJ21ldGVvci9zcGFjZWJhcnMnO1xuaW1wb3J0IHsgVHJhY2tlciB9IGZyb20gJ21ldGVvci90cmFja2VyJztcblxuQmxhemUudG9IVE1MV2l0aERhdGFOb25SZWFjdGl2ZSA9IGZ1bmN0aW9uKGNvbnRlbnQsIGRhdGEpIHtcblx0Y29uc3QgbWFrZUN1cnNvclJlYWN0aXZlID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0aWYgKG9iaiBpbnN0YW5jZW9mIE1ldGVvci5Db2xsZWN0aW9uLkN1cnNvcikge1xuXHRcdFx0cmV0dXJuIG9iai5fZGVwZW5kKHtcblx0XHRcdFx0YWRkZWQ6IHRydWUsXG5cdFx0XHRcdHJlbW92ZWQ6IHRydWUsXG5cdFx0XHRcdGNoYW5nZWQ6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0fTtcblxuXHRtYWtlQ3Vyc29yUmVhY3RpdmUoZGF0YSk7XG5cblx0aWYgKGRhdGEgaW5zdGFuY2VvZiBTcGFjZWJhcnMua3cgJiYgT2JqZWN0LmtleXMoZGF0YS5oYXNoKS5sZW5ndGggPiAwKSB7XG5cdFx0T2JqZWN0LmtleXMoZGF0YS5oYXNoKS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0XHRtYWtlQ3Vyc29yUmVhY3RpdmUoZGF0YS5oYXNoW2tleV0pO1xuXHRcdH0pO1xuXG5cdFx0ZGF0YSA9IGRhdGEuaGFzaDtcblx0fVxuXG5cdHJldHVybiBUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IEJsYXplLnRvSFRNTFdpdGhEYXRhKGNvbnRlbnQsIGRhdGEpKTtcbn07XG5cbkJsYXplLnJlZ2lzdGVySGVscGVyKCducnJhcmdzJywgZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0X2FyZ3VtZW50czogYXJndW1lbnRzXG5cdH07XG59KTtcblxuQmxhemUucmVuZGVyTm9uUmVhY3RpdmUgPSBmdW5jdGlvbih0ZW1wbGF0ZU5hbWUsIGRhdGEpIHtcblx0Y29uc3QgeyBfYXJndW1lbnRzIH0gPSB0aGlzLnBhcmVudFZpZXcuZGF0YVZhci5nZXQoKTtcblxuXHRbdGVtcGxhdGVOYW1lLCBkYXRhXSA9IF9hcmd1bWVudHM7XG5cblx0cmV0dXJuIFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuXHRcdGNvbnN0IHZpZXcgPSBuZXcgQmxhemUuVmlldygnbnJyJywgKCkgPT4ge1xuXHRcdFx0cmV0dXJuIEhUTUwuUmF3KEJsYXplLnRvSFRNTFdpdGhEYXRhTm9uUmVhY3RpdmUoVGVtcGxhdGVbdGVtcGxhdGVOYW1lXSwgZGF0YSkpO1xuXHRcdH0pO1xuXG5cdFx0dmlldy5vblZpZXdSZWFkeSgoKSA9PiB7XG5cdFx0XHRjb25zdCB7IG9uVmlld1JlYWR5IH0gPSBUZW1wbGF0ZVt0ZW1wbGF0ZU5hbWVdO1xuXHRcdFx0cmV0dXJuIG9uVmlld1JlYWR5ICYmIG9uVmlld1JlYWR5LmNhbGwodmlldywgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHR2aWV3Ll9vblZpZXdSZW5kZXJlZCgoKSA9PiB7XG5cdFx0XHRjb25zdCB7IG9uVmlld1JlbmRlcmVkIH0gPSBUZW1wbGF0ZVt0ZW1wbGF0ZU5hbWVdO1xuXHRcdFx0cmV0dXJuIG9uVmlld1JlbmRlcmVkICYmIG9uVmlld1JlbmRlcmVkLmNhbGwodmlldywgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdmlldztcblx0fSk7XG59O1xuXG5CbGF6ZS5yZWdpc3RlckhlbHBlcignbnJyJywgQmxhemUuVGVtcGxhdGUoJ25ycicsIEJsYXplLnJlbmRlck5vblJlYWN0aXZlKSk7XG4iXX0=
