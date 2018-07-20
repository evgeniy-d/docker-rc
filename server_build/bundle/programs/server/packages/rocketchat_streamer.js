(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var DDPCommon = Package['ddp-common'].DDPCommon;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var EV, self, fn, eventName, args, Streamer;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:streamer":{"lib":{"ev.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_streamer/lib/ev.js                                                                 //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
/* globals EV:true */

/* exported EV */
EV = class EV {
  constructor() {
    this.handlers = {};
  }

  emit(event, ...args) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler.apply(this, args));
    }
  }

  emitWithScope(event, scope, ...args) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler.apply(scope, args));
    }
  }

  on(event, callback) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    this.handlers[event].push(callback);
  }

  once(event, callback) {
    self = this;
    self.on(event, function onetimeCallback() {
      callback.apply(this, arguments);
      self.removeListener(event, onetimeCallback);
    });
  }

  removeListener(event, callback) {
    if (this.handlers[event]) {
      const index = this.handlers[event].indexOf(callback);

      if (index > -1) {
        this.handlers[event].splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    this.handlers[event] = undefined;
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_streamer/server/server.js                                                          //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
/* globals EV */

/* eslint new-cap: false */
class StreamerCentral extends EV {
  constructor() {
    super();
    this.instances = {};
  }

}

Meteor.StreamerCentral = new StreamerCentral();
Meteor.Streamer = class Streamer extends EV {
  constructor(name, {
    retransmit = true,
    retransmitToSelf = false
  } = {}) {
    if (Meteor.StreamerCentral.instances[name]) {
      console.warn('Streamer instance already exists:', name);
      return Meteor.StreamerCentral.instances[name];
    }

    super();
    Meteor.StreamerCentral.instances[name] = this;
    this.name = name;
    this.retransmit = retransmit;
    this.retransmitToSelf = retransmitToSelf;
    this.subscriptions = [];
    this.subscriptionsByEventName = {};
    this.transformers = {};
    this.iniPublication();
    this.initMethod();
    this._allowRead = {};
    this._allowEmit = {};
    this._allowWrite = {};
    this.allowRead('none');
    this.allowEmit('all');
    this.allowWrite('none');
  }

  get name() {
    return this._name;
  }

  set name(name) {
    check(name, String);
    this._name = name;
  }

  get subscriptionName() {
    return `stream-${this.name}`;
  }

  get retransmit() {
    return this._retransmit;
  }

  set retransmit(retransmit) {
    check(retransmit, Boolean);
    this._retransmit = retransmit;
  }

  get retransmitToSelf() {
    return this._retransmitToSelf;
  }

  set retransmitToSelf(retransmitToSelf) {
    check(retransmitToSelf, Boolean);
    this._retransmitToSelf = retransmitToSelf;
  }

  allowRead(eventName, fn) {
    if (fn === undefined) {
      fn = eventName;
      eventName = '__all__';
    }

    if (typeof fn === 'function') {
      return this._allowRead[eventName] = fn;
    }

    if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
      console.error(`allowRead shortcut '${fn}' is invalid`);
    }

    if (fn === 'all' || fn === true) {
      return this._allowRead[eventName] = function () {
        return true;
      };
    }

    if (fn === 'none' || fn === false) {
      return this._allowRead[eventName] = function () {
        return false;
      };
    }

    if (fn === 'logged') {
      return this._allowRead[eventName] = function () {
        return Boolean(this.userId);
      };
    }
  }

  allowEmit(eventName, fn) {
    if (fn === undefined) {
      fn = eventName;
      eventName = '__all__';
    }

    if (typeof fn === 'function') {
      return this._allowEmit[eventName] = fn;
    }

    if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
      console.error(`allowRead shortcut '${fn}' is invalid`);
    }

    if (fn === 'all' || fn === true) {
      return this._allowEmit[eventName] = function () {
        return true;
      };
    }

    if (fn === 'none' || fn === false) {
      return this._allowEmit[eventName] = function () {
        return false;
      };
    }

    if (fn === 'logged') {
      return this._allowEmit[eventName] = function () {
        return Boolean(this.userId);
      };
    }
  }

  allowWrite(eventName, fn) {
    if (fn === undefined) {
      fn = eventName;
      eventName = '__all__';
    }

    if (typeof fn === 'function') {
      return this._allowWrite[eventName] = fn;
    }

    if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
      console.error(`allowWrite shortcut '${fn}' is invalid`);
    }

    if (fn === 'all' || fn === true) {
      return this._allowWrite[eventName] = function () {
        return true;
      };
    }

    if (fn === 'none' || fn === false) {
      return this._allowWrite[eventName] = function () {
        return false;
      };
    }

    if (fn === 'logged') {
      return this._allowWrite[eventName] = function () {
        return Boolean(this.userId);
      };
    }
  }

  isReadAllowed(scope, eventName, args) {
    if (this._allowRead[eventName]) {
      return this._allowRead[eventName].call(scope, eventName, ...args);
    }

    return this._allowRead['__all__'].call(scope, eventName, ...args);
  }

  isEmitAllowed(scope, eventName, ...args) {
    if (this._allowEmit[eventName]) {
      return this._allowEmit[eventName].call(scope, eventName, ...args);
    }

    return this._allowEmit['__all__'].call(scope, eventName, ...args);
  }

  isWriteAllowed(scope, eventName, args) {
    if (this._allowWrite[eventName]) {
      return this._allowWrite[eventName].call(scope, eventName, ...args);
    }

    return this._allowWrite['__all__'].call(scope, eventName, ...args);
  }

  addSubscription(subscription, eventName) {
    this.subscriptions.push(subscription);

    if (!this.subscriptionsByEventName[eventName]) {
      this.subscriptionsByEventName[eventName] = [];
    }

    this.subscriptionsByEventName[eventName].push(subscription);
  }

  removeSubscription(subscription, eventName) {
    const index = this.subscriptions.indexOf(subscription);

    if (index > -1) {
      this.subscriptions.splice(index, 1);
    }

    if (this.subscriptionsByEventName[eventName]) {
      const index = this.subscriptionsByEventName[eventName].indexOf(subscription);

      if (index > -1) {
        this.subscriptionsByEventName[eventName].splice(index, 1);
      }
    }
  }

  transform(eventName, fn) {
    if (typeof eventName === 'function') {
      fn = eventName;
      eventName = '__all__';
    }

    if (!this.transformers[eventName]) {
      this.transformers[eventName] = [];
    }

    this.transformers[eventName].push(fn);
  }

  applyTransformers(methodScope, eventName, args) {
    if (this.transformers['__all__']) {
      this.transformers['__all__'].forEach(transform => {
        args = transform.call(methodScope, eventName, args);
        methodScope.tranformed = true;

        if (!Array.isArray(args)) {
          args = [args];
        }
      });
    }

    if (this.transformers[eventName]) {
      this.transformers[eventName].forEach(transform => {
        args = transform.call(methodScope, ...args);
        methodScope.tranformed = true;

        if (!Array.isArray(args)) {
          args = [args];
        }
      });
    }

    return args;
  }

  iniPublication() {
    const stream = this;
    Meteor.publish(this.subscriptionName, function (eventName, options) {
      check(eventName, String);
      check(options, Match.OneOf(Boolean, {
        useCollection: Boolean,
        args: Array
      }));
      let useCollection,
          args = [];

      if (typeof options === 'boolean') {
        useCollection = options;
      } else {
        if (options.useCollection) {
          useCollection = options.useCollection;
        }

        if (options.args) {
          args = options.args;
        }
      }

      if (eventName.length === 0) {
        this.stop();
        return;
      }

      if (stream.isReadAllowed(this, eventName, args) !== true) {
        this.stop();
        return;
      }

      const subscription = {
        subscription: this,
        eventName: eventName
      };
      stream.addSubscription(subscription, eventName);
      this.onStop(() => {
        stream.removeSubscription(subscription, eventName);
      });

      if (useCollection === true) {
        // Collection compatibility
        this._session.sendAdded(stream.subscriptionName, 'id', {
          eventName: eventName
        });
      }

      this.ready();
    });
  }

  initMethod() {
    const stream = this;
    const method = {};

    method[this.subscriptionName] = function (eventName, ...args) {
      check(eventName, String);
      check(args, Array);
      this.unblock();

      if (stream.isWriteAllowed(this, eventName, args) !== true) {
        return;
      }

      const methodScope = {
        userId: this.userId,
        connection: this.connection,
        originalParams: args,
        tranformed: false
      };
      args = stream.applyTransformers(methodScope, eventName, args);
      stream.emitWithScope(eventName, methodScope, ...args);

      if (stream.retransmit === true) {
        stream._emit(eventName, args, this.connection, true);
      }
    };

    try {
      Meteor.methods(method);
    } catch (e) {
      console.error(e);
    }
  }

  _emit(eventName, args, origin, broadcast) {
    if (broadcast === true) {
      Meteor.StreamerCentral.emit('broadcast', this.name, eventName, args);
    }

    const subscriptions = this.subscriptionsByEventName[eventName];

    if (!Array.isArray(subscriptions)) {
      return;
    }

    subscriptions.forEach(subscription => {
      if (this.retransmitToSelf === false && origin && origin === subscription.subscription.connection) {
        return;
      }

      if (this.isEmitAllowed(subscription.subscription, eventName, ...args)) {
        subscription.subscription._session.sendChanged(this.subscriptionName, 'id', {
          eventName: eventName,
          args: args
        });
      }
    });
  }

  emit(eventName, ...args) {
    this._emit(eventName, args, undefined, true);
  }

  emitWithoutBroadcast(eventName, ...args) {
    this._emit(eventName, args, undefined, false);
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:streamer/lib/ev.js");
require("/node_modules/meteor/rocketchat:streamer/server/server.js");

/* Exports */
Package._define("rocketchat:streamer", {
  Streamer: Streamer
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_streamer.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzdHJlYW1lci9saWIvZXYuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RyZWFtZXIvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJFViIsImNvbnN0cnVjdG9yIiwiaGFuZGxlcnMiLCJlbWl0IiwiZXZlbnQiLCJhcmdzIiwiZm9yRWFjaCIsImhhbmRsZXIiLCJhcHBseSIsImVtaXRXaXRoU2NvcGUiLCJzY29wZSIsIm9uIiwiY2FsbGJhY2siLCJwdXNoIiwib25jZSIsInNlbGYiLCJvbmV0aW1lQ2FsbGJhY2siLCJhcmd1bWVudHMiLCJyZW1vdmVMaXN0ZW5lciIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInJlbW92ZUFsbExpc3RlbmVycyIsInVuZGVmaW5lZCIsIlN0cmVhbWVyQ2VudHJhbCIsImluc3RhbmNlcyIsIk1ldGVvciIsIlN0cmVhbWVyIiwibmFtZSIsInJldHJhbnNtaXQiLCJyZXRyYW5zbWl0VG9TZWxmIiwiY29uc29sZSIsIndhcm4iLCJzdWJzY3JpcHRpb25zIiwic3Vic2NyaXB0aW9uc0J5RXZlbnROYW1lIiwidHJhbnNmb3JtZXJzIiwiaW5pUHVibGljYXRpb24iLCJpbml0TWV0aG9kIiwiX2FsbG93UmVhZCIsIl9hbGxvd0VtaXQiLCJfYWxsb3dXcml0ZSIsImFsbG93UmVhZCIsImFsbG93RW1pdCIsImFsbG93V3JpdGUiLCJfbmFtZSIsImNoZWNrIiwiU3RyaW5nIiwic3Vic2NyaXB0aW9uTmFtZSIsIl9yZXRyYW5zbWl0IiwiQm9vbGVhbiIsIl9yZXRyYW5zbWl0VG9TZWxmIiwiZXZlbnROYW1lIiwiZm4iLCJlcnJvciIsInVzZXJJZCIsImlzUmVhZEFsbG93ZWQiLCJjYWxsIiwiaXNFbWl0QWxsb3dlZCIsImlzV3JpdGVBbGxvd2VkIiwiYWRkU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uIiwicmVtb3ZlU3Vic2NyaXB0aW9uIiwidHJhbnNmb3JtIiwiYXBwbHlUcmFuc2Zvcm1lcnMiLCJtZXRob2RTY29wZSIsInRyYW5mb3JtZWQiLCJBcnJheSIsImlzQXJyYXkiLCJzdHJlYW0iLCJwdWJsaXNoIiwib3B0aW9ucyIsIk1hdGNoIiwiT25lT2YiLCJ1c2VDb2xsZWN0aW9uIiwibGVuZ3RoIiwic3RvcCIsIm9uU3RvcCIsIl9zZXNzaW9uIiwic2VuZEFkZGVkIiwicmVhZHkiLCJtZXRob2QiLCJ1bmJsb2NrIiwiY29ubmVjdGlvbiIsIm9yaWdpbmFsUGFyYW1zIiwiX2VtaXQiLCJtZXRob2RzIiwiZSIsIm9yaWdpbiIsImJyb2FkY2FzdCIsInNlbmRDaGFuZ2VkIiwiZW1pdFdpdGhvdXRCcm9hZGNhc3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUNBO0FBRUFBLEtBQUssTUFBTUEsRUFBTixDQUFTO0FBQ2JDLGdCQUFjO0FBQ2IsU0FBS0MsUUFBTCxHQUFnQixFQUFoQjtBQUNBOztBQUVEQyxPQUFLQyxLQUFMLEVBQVksR0FBR0MsSUFBZixFQUFxQjtBQUNwQixRQUFJLEtBQUtILFFBQUwsQ0FBY0UsS0FBZCxDQUFKLEVBQTBCO0FBQ3pCLFdBQUtGLFFBQUwsQ0FBY0UsS0FBZCxFQUFxQkUsT0FBckIsQ0FBOEJDLE9BQUQsSUFBYUEsUUFBUUMsS0FBUixDQUFjLElBQWQsRUFBb0JILElBQXBCLENBQTFDO0FBQ0E7QUFDRDs7QUFFREksZ0JBQWNMLEtBQWQsRUFBcUJNLEtBQXJCLEVBQTRCLEdBQUdMLElBQS9CLEVBQXFDO0FBQ3BDLFFBQUksS0FBS0gsUUFBTCxDQUFjRSxLQUFkLENBQUosRUFBMEI7QUFDekIsV0FBS0YsUUFBTCxDQUFjRSxLQUFkLEVBQXFCRSxPQUFyQixDQUE4QkMsT0FBRCxJQUFhQSxRQUFRQyxLQUFSLENBQWNFLEtBQWQsRUFBcUJMLElBQXJCLENBQTFDO0FBQ0E7QUFDRDs7QUFFRE0sS0FBR1AsS0FBSCxFQUFVUSxRQUFWLEVBQW9CO0FBQ25CLFFB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TCxDQUE4QmlCLFNBQTlCLENBQXRCOztBQUNBLFFBQUksQ0FBQ2UsTUFBTUMsT0FBTixDQUFjbEMsYUFBZCxDQUFMLEVBQW1DO0FBQ2xDO0FBQ0E7O0FBRURBLGtCQUFjM0IsT0FBZCxDQUF1QnNELFlBQUQsSUFBa0I7QUFDdkMsVUFBSSxLQUFLOUIsZ0JBQUwsS0FBMEIsS0FBMUIsSUFBbUN5RCxNQUFuQyxJQUE2Q0EsV0FBVzNCLGFBQWFBLFlBQWIsQ0FBMEJzQixVQUF0RixFQUFrRztBQUNqRztBQUNBOztBQUVELFVBQUksS0FBS3pCLGFBQUwsQ0FBbUJHLGFBQWFBLFlBQWhDLEVBQThDVCxTQUE5QyxFQUF5RCxHQUFHOUMsSUFBNUQsQ0FBSixFQUF1RTtBQUN0RXVELHFCQUFhQSxZQUFiLENBQTBCaUIsUUFBMUIsQ0FBbUNZLFdBQW5DLENBQStDLEtBQUsxQyxnQkFBcEQsRUFBc0UsSUFBdEUsRUFBNEU7QUFDM0VJLHFCQUFXQSxTQURnRTtBQUUzRTlDLGdCQUFNQTtBQUZxRSxTQUE1RTtBQUlBO0FBQ0QsS0FYRDtBQVlBOztBQUVERixPQUFLZ0QsU0FBTCxFQUFnQixHQUFHOUMsSUFBbkIsRUFBeUI7QUFDeEIsU0FBSytFLEtBQUwsQ0FBV2pDLFNBQVgsRUFBc0I5QyxJQUF0QixFQUE0QmtCLFNBQTVCLEVBQXVDLElBQXZDO0FBQ0E7O0FBRURtRSx1QkFBcUJ2QyxTQUFyQixFQUFnQyxHQUFHOUMsSUFBbkMsRUFBeUM7QUFDeEMsU0FBSytFLEtBQUwsQ0FBV2pDLFNBQVgsRUFBc0I5QyxJQUF0QixFQUE0QmtCLFNBQTVCLEVBQXVDLEtBQXZDO0FBQ0E7O0FBaFgwQyxDQUE1QyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3N0cmVhbWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBFVjp0cnVlICovXG4vKiBleHBvcnRlZCBFViAqL1xuXG5FViA9IGNsYXNzIEVWIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5oYW5kbGVycyA9IHt9O1xuXHR9XG5cblx0ZW1pdChldmVudCwgLi4uYXJncykge1xuXHRcdGlmICh0aGlzLmhhbmRsZXJzW2V2ZW50XSkge1xuXHRcdFx0dGhpcy5oYW5kbGVyc1tldmVudF0uZm9yRWFjaCgoaGFuZGxlcikgPT4gaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKSk7XG5cdFx0fVxuXHR9XG5cblx0ZW1pdFdpdGhTY29wZShldmVudCwgc2NvcGUsIC4uLmFyZ3MpIHtcblx0XHRpZiAodGhpcy5oYW5kbGVyc1tldmVudF0pIHtcblx0XHRcdHRoaXMuaGFuZGxlcnNbZXZlbnRdLmZvckVhY2goKGhhbmRsZXIpID0+IGhhbmRsZXIuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcblx0XHR9XG5cdH1cblxuXHRvbihldmVudCwgY2FsbGJhY2spIHtcblx0XHRpZiAoIXRoaXMuaGFuZGxlcnNbZXZlbnRdKSB7XG5cdFx0XHR0aGlzLmhhbmRsZXJzW2V2ZW50XSA9IFtdO1xuXHRcdH1cblx0XHR0aGlzLmhhbmRsZXJzW2V2ZW50XS5wdXNoKGNhbGxiYWNrKTtcblx0fVxuXG5cdG9uY2UoZXZlbnQsIGNhbGxiYWNrKSB7XG5cdFx0c2VsZiA9IHRoaXM7XG5cdFx0c2VsZi5vbihldmVudCwgZnVuY3Rpb24gb25ldGltZUNhbGxiYWNrKCkge1xuXHRcdFx0Y2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdHNlbGYucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIG9uZXRpbWVDYWxsYmFjayk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZW1vdmVMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spIHtcblx0XHRpZih0aGlzLmhhbmRsZXJzW2V2ZW50XSkge1xuXHRcdFx0Y29uc3QgaW5kZXggPSB0aGlzLmhhbmRsZXJzW2V2ZW50XS5pbmRleE9mKGNhbGxiYWNrKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHRoaXMuaGFuZGxlcnNbZXZlbnRdLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG5cdFx0dGhpcy5oYW5kbGVyc1tldmVudF0gPSB1bmRlZmluZWQ7XG5cdH1cbn07XG4iLCIvKiBnbG9iYWxzIEVWICovXG4vKiBlc2xpbnQgbmV3LWNhcDogZmFsc2UgKi9cblxuY2xhc3MgU3RyZWFtZXJDZW50cmFsIGV4dGVuZHMgRVYge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5pbnN0YW5jZXMgPSB7fTtcblx0fVxufVxuXG5NZXRlb3IuU3RyZWFtZXJDZW50cmFsID0gbmV3IFN0cmVhbWVyQ2VudHJhbDtcblxuXG5NZXRlb3IuU3RyZWFtZXIgPSBjbGFzcyBTdHJlYW1lciBleHRlbmRzIEVWIHtcblx0Y29uc3RydWN0b3IobmFtZSwge3JldHJhbnNtaXQgPSB0cnVlLCByZXRyYW5zbWl0VG9TZWxmID0gZmFsc2V9ID0ge30pIHtcblx0XHRpZiAoTWV0ZW9yLlN0cmVhbWVyQ2VudHJhbC5pbnN0YW5jZXNbbmFtZV0pIHtcblx0XHRcdGNvbnNvbGUud2FybignU3RyZWFtZXIgaW5zdGFuY2UgYWxyZWFkeSBleGlzdHM6JywgbmFtZSk7XG5cdFx0XHRyZXR1cm4gTWV0ZW9yLlN0cmVhbWVyQ2VudHJhbC5pbnN0YW5jZXNbbmFtZV07XG5cdFx0fVxuXG5cdFx0c3VwZXIoKTtcblxuXHRcdE1ldGVvci5TdHJlYW1lckNlbnRyYWwuaW5zdGFuY2VzW25hbWVdID0gdGhpcztcblxuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy5yZXRyYW5zbWl0ID0gcmV0cmFuc21pdDtcblx0XHR0aGlzLnJldHJhbnNtaXRUb1NlbGYgPSByZXRyYW5zbWl0VG9TZWxmO1xuXG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zID0gW107XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zQnlFdmVudE5hbWUgPSB7fTtcblx0XHR0aGlzLnRyYW5zZm9ybWVycyA9IHt9O1xuXG5cdFx0dGhpcy5pbmlQdWJsaWNhdGlvbigpO1xuXHRcdHRoaXMuaW5pdE1ldGhvZCgpO1xuXG5cdFx0dGhpcy5fYWxsb3dSZWFkID0ge307XG5cdFx0dGhpcy5fYWxsb3dFbWl0ID0ge307XG5cdFx0dGhpcy5fYWxsb3dXcml0ZSA9IHt9O1xuXG5cdFx0dGhpcy5hbGxvd1JlYWQoJ25vbmUnKTtcblx0XHR0aGlzLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5hbGxvd1dyaXRlKCdub25lJyk7XG5cdH1cblxuXHRnZXQgbmFtZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fbmFtZTtcblx0fVxuXG5cdHNldCBuYW1lKG5hbWUpIHtcblx0XHRjaGVjayhuYW1lLCBTdHJpbmcpO1xuXHRcdHRoaXMuX25hbWUgPSBuYW1lO1xuXHR9XG5cblx0Z2V0IHN1YnNjcmlwdGlvbk5hbWUoKSB7XG5cdFx0cmV0dXJuIGBzdHJlYW0tJHt0aGlzLm5hbWV9YDtcblx0fVxuXG5cdGdldCByZXRyYW5zbWl0KCkge1xuXHRcdHJldHVybiB0aGlzLl9yZXRyYW5zbWl0O1xuXHR9XG5cblx0c2V0IHJldHJhbnNtaXQocmV0cmFuc21pdCkge1xuXHRcdGNoZWNrKHJldHJhbnNtaXQsIEJvb2xlYW4pO1xuXHRcdHRoaXMuX3JldHJhbnNtaXQgPSByZXRyYW5zbWl0O1xuXHR9XG5cblx0Z2V0IHJldHJhbnNtaXRUb1NlbGYoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3JldHJhbnNtaXRUb1NlbGY7XG5cdH1cblxuXHRzZXQgcmV0cmFuc21pdFRvU2VsZihyZXRyYW5zbWl0VG9TZWxmKSB7XG5cdFx0Y2hlY2socmV0cmFuc21pdFRvU2VsZiwgQm9vbGVhbik7XG5cdFx0dGhpcy5fcmV0cmFuc21pdFRvU2VsZiA9IHJldHJhbnNtaXRUb1NlbGY7XG5cdH1cblxuXHRhbGxvd1JlYWQoZXZlbnROYW1lLCBmbikge1xuXHRcdGlmIChmbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmbiA9IGV2ZW50TmFtZTtcblx0XHRcdGV2ZW50TmFtZSA9ICdfX2FsbF9fJztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dSZWFkW2V2ZW50TmFtZV0gPSBmbjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZuID09PSAnc3RyaW5nJyAmJiBbJ2FsbCcsICdub25lJywgJ2xvZ2dlZCddLmluZGV4T2YoZm4pID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgYWxsb3dSZWFkIHNob3J0Y3V0ICcke2ZufScgaXMgaW52YWxpZGApO1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ2FsbCcgfHwgZm4gPT09IHRydWUpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1JlYWRbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnbm9uZScgfHwgZm4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dSZWFkW2V2ZW50TmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoZm4gPT09ICdsb2dnZWQnKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dSZWFkW2V2ZW50TmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIEJvb2xlYW4odGhpcy51c2VySWQpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cblxuXHRhbGxvd0VtaXQoZXZlbnROYW1lLCBmbikge1xuXHRcdGlmIChmbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmbiA9IGV2ZW50TmFtZTtcblx0XHRcdGV2ZW50TmFtZSA9ICdfX2FsbF9fJztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dFbWl0W2V2ZW50TmFtZV0gPSBmbjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZuID09PSAnc3RyaW5nJyAmJiBbJ2FsbCcsICdub25lJywgJ2xvZ2dlZCddLmluZGV4T2YoZm4pID09PSAtMSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgYWxsb3dSZWFkIHNob3J0Y3V0ICcke2ZufScgaXMgaW52YWxpZGApO1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ2FsbCcgfHwgZm4gPT09IHRydWUpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd0VtaXRbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnbm9uZScgfHwgZm4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dFbWl0W2V2ZW50TmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoZm4gPT09ICdsb2dnZWQnKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dFbWl0W2V2ZW50TmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIEJvb2xlYW4odGhpcy51c2VySWQpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cblxuXHRhbGxvd1dyaXRlKGV2ZW50TmFtZSwgZm4pIHtcblx0XHRpZiAoZm4gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Zm4gPSBldmVudE5hbWU7XG5cdFx0XHRldmVudE5hbWUgPSAnX19hbGxfXyc7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93V3JpdGVbZXZlbnROYW1lXSA9IGZuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZm4gPT09ICdzdHJpbmcnICYmIFsnYWxsJywgJ25vbmUnLCAnbG9nZ2VkJ10uaW5kZXhPZihmbikgPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBhbGxvd1dyaXRlIHNob3J0Y3V0ICcke2ZufScgaXMgaW52YWxpZGApO1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ2FsbCcgfHwgZm4gPT09IHRydWUpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1dyaXRlW2V2ZW50TmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ25vbmUnIHx8IGZuID09PSBmYWxzZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93V3JpdGVbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ2xvZ2dlZCcpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1dyaXRlW2V2ZW50TmFtZV0gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIEJvb2xlYW4odGhpcy51c2VySWQpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH1cblxuXHRpc1JlYWRBbGxvd2VkKHNjb3BlLCBldmVudE5hbWUsIGFyZ3MpIHtcblx0XHRpZiAodGhpcy5fYWxsb3dSZWFkW2V2ZW50TmFtZV0pIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1JlYWRbZXZlbnROYW1lXS5jYWxsKHNjb3BlLCBldmVudE5hbWUsIC4uLmFyZ3MpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9hbGxvd1JlYWRbJ19fYWxsX18nXS5jYWxsKHNjb3BlLCBldmVudE5hbWUsIC4uLmFyZ3MpO1xuXHR9XG5cblx0aXNFbWl0QWxsb3dlZChzY29wZSwgZXZlbnROYW1lLCAuLi5hcmdzKSB7XG5cdFx0aWYgKHRoaXMuX2FsbG93RW1pdFtldmVudE5hbWVdKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dFbWl0W2V2ZW50TmFtZV0uY2FsbChzY29wZSwgZXZlbnROYW1lLCAuLi5hcmdzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5fYWxsb3dFbWl0WydfX2FsbF9fJ10uY2FsbChzY29wZSwgZXZlbnROYW1lLCAuLi5hcmdzKTtcblx0fVxuXG5cdGlzV3JpdGVBbGxvd2VkKHNjb3BlLCBldmVudE5hbWUsIGFyZ3MpIHtcblx0XHRpZiAodGhpcy5fYWxsb3dXcml0ZVtldmVudE5hbWVdKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dXcml0ZVtldmVudE5hbWVdLmNhbGwoc2NvcGUsIGV2ZW50TmFtZSwgLi4uYXJncyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuX2FsbG93V3JpdGVbJ19fYWxsX18nXS5jYWxsKHNjb3BlLCBldmVudE5hbWUsIC4uLmFyZ3MpO1xuXHR9XG5cblx0YWRkU3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvbiwgZXZlbnROYW1lKSB7XG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zLnB1c2goc3Vic2NyaXB0aW9uKTtcblxuXHRcdGlmICghdGhpcy5zdWJzY3JpcHRpb25zQnlFdmVudE5hbWVbZXZlbnROYW1lXSkge1xuXHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zQnlFdmVudE5hbWVbZXZlbnROYW1lXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMuc3Vic2NyaXB0aW9uc0J5RXZlbnROYW1lW2V2ZW50TmFtZV0ucHVzaChzdWJzY3JpcHRpb24pO1xuXHR9XG5cblx0cmVtb3ZlU3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvbiwgZXZlbnROYW1lKSB7XG5cdFx0Y29uc3QgaW5kZXggPSB0aGlzLnN1YnNjcmlwdGlvbnMuaW5kZXhPZihzdWJzY3JpcHRpb24pO1xuXHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5zdWJzY3JpcHRpb25zQnlFdmVudE5hbWVbZXZlbnROYW1lXSkge1xuXHRcdFx0Y29uc3QgaW5kZXggPSB0aGlzLnN1YnNjcmlwdGlvbnNCeUV2ZW50TmFtZVtldmVudE5hbWVdLmluZGV4T2Yoc3Vic2NyaXB0aW9uKTtcblx0XHRcdGlmIChpbmRleCA+IC0xKSB7XG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc0J5RXZlbnROYW1lW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0cmFuc2Zvcm0oZXZlbnROYW1lLCBmbikge1xuXHRcdGlmICh0eXBlb2YgZXZlbnROYW1lID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRmbiA9IGV2ZW50TmFtZTtcblx0XHRcdGV2ZW50TmFtZSA9ICdfX2FsbF9fJztcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMudHJhbnNmb3JtZXJzW2V2ZW50TmFtZV0pIHtcblx0XHRcdHRoaXMudHJhbnNmb3JtZXJzW2V2ZW50TmFtZV0gPSBbXTtcblx0XHR9XG5cblx0XHR0aGlzLnRyYW5zZm9ybWVyc1tldmVudE5hbWVdLnB1c2goZm4pO1xuXHR9XG5cblx0YXBwbHlUcmFuc2Zvcm1lcnMobWV0aG9kU2NvcGUsIGV2ZW50TmFtZSwgYXJncykge1xuXHRcdGlmICh0aGlzLnRyYW5zZm9ybWVyc1snX19hbGxfXyddKSB7XG5cdFx0XHR0aGlzLnRyYW5zZm9ybWVyc1snX19hbGxfXyddLmZvckVhY2goKHRyYW5zZm9ybSkgPT4ge1xuXHRcdFx0XHRhcmdzID0gdHJhbnNmb3JtLmNhbGwobWV0aG9kU2NvcGUsIGV2ZW50TmFtZSwgYXJncyk7XG5cdFx0XHRcdG1ldGhvZFNjb3BlLnRyYW5mb3JtZWQgPSB0cnVlO1xuXHRcdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkoYXJncykpIHtcblx0XHRcdFx0XHRhcmdzID0gW2FyZ3NdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy50cmFuc2Zvcm1lcnNbZXZlbnROYW1lXSkge1xuXHRcdFx0dGhpcy50cmFuc2Zvcm1lcnNbZXZlbnROYW1lXS5mb3JFYWNoKCh0cmFuc2Zvcm0pID0+IHtcblx0XHRcdFx0YXJncyA9IHRyYW5zZm9ybS5jYWxsKG1ldGhvZFNjb3BlLCAuLi5hcmdzKTtcblx0XHRcdFx0bWV0aG9kU2NvcGUudHJhbmZvcm1lZCA9IHRydWU7XG5cdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShhcmdzKSkge1xuXHRcdFx0XHRcdGFyZ3MgPSBbYXJnc107XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBhcmdzO1xuXHR9XG5cblx0aW5pUHVibGljYXRpb24oKSB7XG5cdFx0Y29uc3Qgc3RyZWFtID0gdGhpcztcblx0XHRNZXRlb3IucHVibGlzaCh0aGlzLnN1YnNjcmlwdGlvbk5hbWUsIGZ1bmN0aW9uKGV2ZW50TmFtZSwgb3B0aW9ucykge1xuXHRcdFx0Y2hlY2soZXZlbnROYW1lLCBTdHJpbmcpO1xuXHRcdFx0Y2hlY2sob3B0aW9ucywgTWF0Y2guT25lT2YoQm9vbGVhbiwge1xuXHRcdFx0XHR1c2VDb2xsZWN0aW9uOiBCb29sZWFuLFxuXHRcdFx0XHRhcmdzOiBBcnJheSxcblx0XHRcdH0pKTtcblxuXHRcdFx0bGV0IHVzZUNvbGxlY3Rpb24sIGFyZ3MgPSBbXTtcblxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zID09PSAnYm9vbGVhbicpIHtcblx0XHRcdFx0dXNlQ29sbGVjdGlvbiA9IG9wdGlvbnM7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAob3B0aW9ucy51c2VDb2xsZWN0aW9uKSB7XG5cdFx0XHRcdFx0dXNlQ29sbGVjdGlvbiA9IG9wdGlvbnMudXNlQ29sbGVjdGlvbjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChvcHRpb25zLmFyZ3MpIHtcblx0XHRcdFx0XHRhcmdzID0gb3B0aW9ucy5hcmdzO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChldmVudE5hbWUubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHRoaXMuc3RvcCgpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmIChzdHJlYW0uaXNSZWFkQWxsb3dlZCh0aGlzLCBldmVudE5hbWUsIGFyZ3MpICE9PSB0cnVlKSB7XG5cdFx0XHRcdHRoaXMuc3RvcCgpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IHtcblx0XHRcdFx0c3Vic2NyaXB0aW9uOiB0aGlzLFxuXHRcdFx0XHRldmVudE5hbWU6IGV2ZW50TmFtZVxuXHRcdFx0fTtcblxuXHRcdFx0c3RyZWFtLmFkZFN1YnNjcmlwdGlvbihzdWJzY3JpcHRpb24sIGV2ZW50TmFtZSk7XG5cblx0XHRcdHRoaXMub25TdG9wKCgpID0+IHtcblx0XHRcdFx0c3RyZWFtLnJlbW92ZVN1YnNjcmlwdGlvbihzdWJzY3JpcHRpb24sIGV2ZW50TmFtZSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKHVzZUNvbGxlY3Rpb24gPT09IHRydWUpIHtcblx0XHRcdFx0Ly8gQ29sbGVjdGlvbiBjb21wYXRpYmlsaXR5XG5cdFx0XHRcdHRoaXMuX3Nlc3Npb24uc2VuZEFkZGVkKHN0cmVhbS5zdWJzY3JpcHRpb25OYW1lLCAnaWQnLCB7XG5cdFx0XHRcdFx0ZXZlbnROYW1lOiBldmVudE5hbWVcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmVhZHkoKTtcblx0XHR9KTtcblx0fVxuXG5cdGluaXRNZXRob2QoKSB7XG5cdFx0Y29uc3Qgc3RyZWFtID0gdGhpcztcblx0XHRjb25zdCBtZXRob2QgPSB7fTtcblxuXHRcdG1ldGhvZFt0aGlzLnN1YnNjcmlwdGlvbk5hbWVdID0gZnVuY3Rpb24oZXZlbnROYW1lLCAuLi5hcmdzKSB7XG5cdFx0XHRjaGVjayhldmVudE5hbWUsIFN0cmluZyk7XG5cdFx0XHRjaGVjayhhcmdzLCBBcnJheSk7XG5cblx0XHRcdHRoaXMudW5ibG9jaygpO1xuXG5cdFx0XHRpZiAoc3RyZWFtLmlzV3JpdGVBbGxvd2VkKHRoaXMsIGV2ZW50TmFtZSwgYXJncykgIT09IHRydWUpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBtZXRob2RTY29wZSA9IHtcblx0XHRcdFx0dXNlcklkOiB0aGlzLnVzZXJJZCxcblx0XHRcdFx0Y29ubmVjdGlvbjogdGhpcy5jb25uZWN0aW9uLFxuXHRcdFx0XHRvcmlnaW5hbFBhcmFtczogYXJncyxcblx0XHRcdFx0dHJhbmZvcm1lZDogZmFsc2Vcblx0XHRcdH07XG5cblx0XHRcdGFyZ3MgPSBzdHJlYW0uYXBwbHlUcmFuc2Zvcm1lcnMobWV0aG9kU2NvcGUsIGV2ZW50TmFtZSwgYXJncyk7XG5cblx0XHRcdHN0cmVhbS5lbWl0V2l0aFNjb3BlKGV2ZW50TmFtZSwgbWV0aG9kU2NvcGUsIC4uLmFyZ3MpO1xuXG5cdFx0XHRpZiAoc3RyZWFtLnJldHJhbnNtaXQgPT09IHRydWUpIHtcblx0XHRcdFx0c3RyZWFtLl9lbWl0KGV2ZW50TmFtZSwgYXJncywgdGhpcy5jb25uZWN0aW9uLCB0cnVlKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdE1ldGVvci5tZXRob2RzKG1ldGhvZCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHR9XG5cdH1cblxuXHRfZW1pdChldmVudE5hbWUsIGFyZ3MsIG9yaWdpbiwgYnJvYWRjYXN0KSB7XG5cdFx0aWYgKGJyb2FkY2FzdCA9PT0gdHJ1ZSkge1xuXHRcdFx0TWV0ZW9yLlN0cmVhbWVyQ2VudHJhbC5lbWl0KCdicm9hZGNhc3QnLCB0aGlzLm5hbWUsIGV2ZW50TmFtZSwgYXJncyk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3Vic2NyaXB0aW9ucyA9IHRoaXMuc3Vic2NyaXB0aW9uc0J5RXZlbnROYW1lW2V2ZW50TmFtZV07XG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHN1YnNjcmlwdGlvbnMpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0c3Vic2NyaXB0aW9ucy5mb3JFYWNoKChzdWJzY3JpcHRpb24pID0+IHtcblx0XHRcdGlmICh0aGlzLnJldHJhbnNtaXRUb1NlbGYgPT09IGZhbHNlICYmIG9yaWdpbiAmJiBvcmlnaW4gPT09IHN1YnNjcmlwdGlvbi5zdWJzY3JpcHRpb24uY29ubmVjdGlvbikge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0aGlzLmlzRW1pdEFsbG93ZWQoc3Vic2NyaXB0aW9uLnN1YnNjcmlwdGlvbiwgZXZlbnROYW1lLCAuLi5hcmdzKSkge1xuXHRcdFx0XHRzdWJzY3JpcHRpb24uc3Vic2NyaXB0aW9uLl9zZXNzaW9uLnNlbmRDaGFuZ2VkKHRoaXMuc3Vic2NyaXB0aW9uTmFtZSwgJ2lkJywge1xuXHRcdFx0XHRcdGV2ZW50TmFtZTogZXZlbnROYW1lLFxuXHRcdFx0XHRcdGFyZ3M6IGFyZ3Ncblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRlbWl0KGV2ZW50TmFtZSwgLi4uYXJncykge1xuXHRcdHRoaXMuX2VtaXQoZXZlbnROYW1lLCBhcmdzLCB1bmRlZmluZWQsIHRydWUpO1xuXHR9XG5cblx0ZW1pdFdpdGhvdXRCcm9hZGNhc3QoZXZlbnROYW1lLCAuLi5hcmdzKSB7XG5cdFx0dGhpcy5fZW1pdChldmVudE5hbWUsIGFyZ3MsIHVuZGVmaW5lZCwgZmFsc2UpO1xuXHR9XG59O1xuIl19
