(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var Log = Package.logging.Log;
var colors = Package['nooitaf:colors'].colors;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var LoggerManager, message, Logger, SystemLogger;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:logger":{"server":{"server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_logger/server/server.js                                                                   //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  SystemLogger: () => SystemLogger,
  StdOut: () => StdOut,
  LoggerManager: () => LoggerManager,
  processString: () => processString,
  Logger: () => Logger
});

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
//TODO: change this global to import
module.runSetters(LoggerManager = new class extends EventEmitter {
  // eslint-disable-line no-undef
  constructor() {
    super();
    this.enabled = false;
    this.loggers = {};
    this.queue = [];
    this.showPackage = false;
    this.showFileAndLine = false;
    this.logLevel = 0;
  }

  register(logger) {
    if (!logger instanceof Logger) {
      return;
    }

    this.loggers[logger.name] = logger;
    this.emit('register', logger);
  }

  addToQueue(logger, args) {
    this.queue.push({
      logger,
      args
    });
  }

  dispatchQueue() {
    _.each(this.queue, item => item.logger._log.apply(item.logger, item.args));

    this.clearQueue();
  }

  clearQueue() {
    this.queue = [];
  }

  disable() {
    this.enabled = false;
  }

  enable(dispatchQueue = false) {
    this.enabled = true;
    return dispatchQueue === true ? this.dispatchQueue() : this.clearQueue();
  }

}());
const defaultTypes = {
  debug: {
    name: 'debug',
    color: 'blue',
    level: 2
  },
  log: {
    name: 'info',
    color: 'blue',
    level: 1
  },
  info: {
    name: 'info',
    color: 'blue',
    level: 1
  },
  success: {
    name: 'info',
    color: 'green',
    level: 1
  },
  warn: {
    name: 'warn',
    color: 'magenta',
    level: 1
  },
  error: {
    name: 'error',
    color: 'red',
    level: 0
  }
};

class _Logger {
  constructor(name, config = {}) {
    const self = this;
    this.name = name;
    this.config = Object.assign({}, config);

    if (LoggerManager.loggers && LoggerManager.loggers[this.name] != null) {
      LoggerManager.loggers[this.name].warn('Duplicated instance');
      return LoggerManager.loggers[this.name];
    }

    _.each(defaultTypes, (typeConfig, type) => {
      this[type] = function (...args) {
        return self._log.call(self, {
          section: this.__section,
          type,
          level: typeConfig.level,
          method: typeConfig.name,
          'arguments': args
        });
      };

      self[`${type}_box`] = function (...args) {
        return self._log.call(self, {
          section: this.__section,
          type,
          box: true,
          level: typeConfig.level,
          method: typeConfig.name,
          'arguments': args
        });
      };
    });

    if (this.config.methods) {
      _.each(this.config.methods, (typeConfig, method) => {
        if (this[method] != null) {
          self.warn(`Method ${method} already exists`);
        }

        if (defaultTypes[typeConfig.type] == null) {
          self.warn(`Method type ${typeConfig.type} does not exist`);
        }

        this[method] = function (...args) {
          return self._log.call(self, {
            section: this.__section,
            type: typeConfig.type,
            level: typeConfig.level != null ? typeConfig.level : defaultTypes[typeConfig.type] && defaultTypes[typeConfig.type].level,
            method,
            'arguments': args
          });
        };

        this[`${method}_box`] = function (...args) {
          return self._log.call(self, {
            section: this.__section,
            type: typeConfig.type,
            box: true,
            level: typeConfig.level != null ? typeConfig.level : defaultTypes[typeConfig.type] && defaultTypes[typeConfig.type].level,
            method,
            'arguments': args
          });
        };
      });
    }

    if (this.config.sections) {
      _.each(this.config.sections, (name, section) => {
        this[section] = {};

        _.each(defaultTypes, (typeConfig, type) => {
          self[section][type] = (...args) => this[type].apply({
            __section: name
          }, args);

          self[section][`${type}_box`] = (...args) => this[`${type}_box`].apply({
            __section: name
          }, args);
        });

        _.each(this.config.methods, (typeConfig, method) => {
          self[section][method] = (...args) => self[method].apply({
            __section: name
          }, args);

          self[section][`${method}_box`] = (...args) => self[`${method}_box`].apply({
            __section: name
          }, args);
        });
      });
    }

    LoggerManager.register(this);
  }

  getPrefix(options) {
    let prefix = `${this.name} ➔ ${options.method}`;

    if (options.section) {
      prefix = `${this.name} ➔ ${options.section}.${options.method}`;
    }

    const details = this._getCallerDetails();

    const detailParts = [];

    if (details['package'] && (LoggerManager.showPackage === true || options.type === 'error')) {
      detailParts.push(details['package']);
    }

    if (LoggerManager.showFileAndLine === true || options.type === 'error') {
      if (details.file != null && details.line != null) {
        detailParts.push(`${details.file}:${details.line}`);
      } else {
        if (details.file != null) {
          detailParts.push(details.file);
        }

        if (details.line != null) {
          detailParts.push(details.line);
        }
      }
    }

    if (defaultTypes[options.type]) {
      // format the message to a colored message
      prefix = prefix[defaultTypes[options.type].color];
    }

    if (detailParts.length > 0) {
      prefix = `${detailParts.join(' ')} ${prefix}`;
    }

    return prefix;
  }

  _getCallerDetails() {
    const getStack = () => {
      // We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
      // core-parsed stack) since it's impossible to compose it with the use of
      // Error.prepareStackTrace used on the server for source maps.
      const {
        stack
      } = new Error();
      return stack;
    };

    const stack = getStack();

    if (!stack) {
      return {};
    }

    const lines = stack.split('\n').splice(1); // looking for the first line outside the logging package (or an
    // eval if we find that first)

    let line = lines[0];

    for (let index = 0, len = lines.length; index < len, index++; line = lines[index]) {
      if (line.match(/^\s*at eval \(eval/)) {
        return {
          file: 'eval'
        };
      }

      if (!line.match(/packages\/rocketchat_logger(?:\/|\.js)/)) {
        break;
      }
    }

    const details = {}; // The format for FF is 'functionName@filePath:lineNumber'
    // The format for V8 is 'functionName (packages/logging/logging.js:81)' or
    //                      'packages/logging/logging.js:81'

    const match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line);

    if (!match) {
      return details;
    }

    details.line = match[2].split(':')[0]; // Possible format: https://foo.bar.com/scripts/file.js?random=foobar
    // XXX: if you can write the following in better way, please do it
    // XXX: what about evals?

    details.file = match[1].split('/').slice(-1)[0].split('?')[0];
    const packageMatch = match[1].match(/packages\/([^\.\/]+)(?:\/|\.)/);

    if (packageMatch) {
      details['package'] = packageMatch[1];
    }

    return details;
  }

  makeABox(message, title) {
    if (!_.isArray(message)) {
      message = message.split('\n');
    }

    let len = 0;
    len = Math.max.apply(null, message.map(line => line.length));
    const topLine = `+--${s.pad('', len, '-')}--+`;
    const separator = `|  ${s.pad('', len, '')}  |`;
    let lines = [];
    lines.push(topLine);

    if (title) {
      lines.push(`|  ${s.lrpad(title, len)}  |`);
      lines.push(topLine);
    }

    lines.push(separator);
    lines = [...lines, ...message.map(line => `|  ${s.rpad(line, len)}  |`)];
    lines.push(separator);
    lines.push(topLine);
    return lines;
  }

  _log(options) {
    if (LoggerManager.enabled === false) {
      LoggerManager.addToQueue(this, arguments);
      return;
    }

    if (options.level == null) {
      options.level = 1;
    }

    if (LoggerManager.logLevel < options.level) {
      return;
    }

    const prefix = this.getPrefix(options);

    if (options.box === true && _.isString(options.arguments[0])) {
      let color = undefined;

      if (defaultTypes[options.type]) {
        color = defaultTypes[options.type].color;
      }

      const box = this.makeABox(options.arguments[0], options.arguments[1]);
      let subPrefix = '➔';

      if (color) {
        subPrefix = subPrefix[color];
      }

      console.log(subPrefix, prefix);
      box.forEach(line => {
        console.log(subPrefix, color ? line[color] : line);
      });
    } else {
      options.arguments.unshift(prefix);
      console.log.apply(console, options.arguments);
    }
  }

} // TODO: change this global to import


module.runSetters(Logger = global.Logger = _Logger);

const processString = function (string, date) {
  let obj;

  try {
    if (string[0] === '{') {
      obj = EJSON.parse(string);
    } else {
      obj = {
        message: string,
        time: date,
        level: 'info'
      };
    }

    return Log.format(obj, {
      color: true
    });
  } catch (error) {
    return string;
  }
}; // TODO: change this global to import


module.runSetters(SystemLogger = new Logger('System', {
  // eslint-disable-line no-undef
  methods: {
    startup: {
      type: 'success',
      level: 0
    }
  }
}));
const StdOut = new class extends EventEmitter {
  constructor() {
    super();
    const write = process.stdout.write;
    this.queue = [];

    process.stdout.write = (...args) => {
      write.apply(process.stdout, args);
      const date = new Date();
      const string = processString(args[0], date);
      const item = {
        id: Random.id(),
        string,
        ts: date
      };
      this.queue.push(item);

      if (typeof RocketChat !== 'undefined') {
        const limit = RocketChat.settings.get('Log_View_Limit');

        if (limit && this.queue.length > limit) {
          this.queue.shift();
        }
      }

      this.emit('write', string, item);
    };
  }

}();
Meteor.publish('stdout', function () {
  if (!this.userId || RocketChat.authz.hasPermission(this.userId, 'view-logs') !== true) {
    return this.ready();
  }

  StdOut.queue.forEach(item => {
    this.added('stdout', item.id, {
      string: item.string,
      ts: item.ts
    });
  });
  this.ready();
  StdOut.on('write', (string, item) => {
    this.added('stdout', item.id, {
      string: item.string,
      ts: item.ts
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:logger/server/server.js");

/* Exports */
Package._define("rocketchat:logger", {
  Logger: Logger,
  SystemLogger: SystemLogger,
  LoggerManager: LoggerManager
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_logger.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsb2dnZXIvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJTeXN0ZW1Mb2dnZXIiLCJTdGRPdXQiLCJMb2dnZXJNYW5hZ2VyIiwicHJvY2Vzc1N0cmluZyIsIkxvZ2dlciIsIl8iLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInMiLCJFdmVudEVtaXR0ZXIiLCJjb25zdHJ1Y3RvciIsImVuYWJsZWQiLCJsb2dnZXJzIiwicXVldWUiLCJzaG93UGFja2FnZSIsInNob3dGaWxlQW5kTGluZSIsImxvZ0xldmVsIiwicmVnaXN0ZXIiLCJsb2dnZXIiLCJuYW1lIiwiZW1pdCIsImFkZFRvUXVldWUiLCJhcmdzIiwicHVzaCIsImRpc3BhdGNoUXVldWUiLCJlYWNoIiwiaXRlbSIsIl9sb2ciLCJhcHBseSIsImNsZWFyUXVldWUiLCJkaXNhYmxlIiwiZW5hYmxlIiwiZGVmYXVsdFR5cGVzIiwiZGVidWciLCJjb2xvciIsImxldmVsIiwibG9nIiwiaW5mbyIsInN1Y2Nlc3MiLCJ3YXJuIiwiZXJyb3IiLCJfTG9nZ2VyIiwiY29uZmlnIiwic2VsZiIsIk9iamVjdCIsImFzc2lnbiIsInR5cGVDb25maWciLCJ0eXBlIiwiY2FsbCIsInNlY3Rpb24iLCJfX3NlY3Rpb24iLCJtZXRob2QiLCJib3giLCJtZXRob2RzIiwic2VjdGlvbnMiLCJnZXRQcmVmaXgiLCJvcHRpb25zIiwicHJlZml4IiwiZGV0YWlscyIsIl9nZXRDYWxsZXJEZXRhaWxzIiwiZGV0YWlsUGFydHMiLCJmaWxlIiwibGluZSIsImxlbmd0aCIsImpvaW4iLCJnZXRTdGFjayIsInN0YWNrIiwiRXJyb3IiLCJsaW5lcyIsInNwbGl0Iiwic3BsaWNlIiwiaW5kZXgiLCJsZW4iLCJtYXRjaCIsImV4ZWMiLCJzbGljZSIsInBhY2thZ2VNYXRjaCIsIm1ha2VBQm94IiwibWVzc2FnZSIsInRpdGxlIiwiaXNBcnJheSIsIk1hdGgiLCJtYXgiLCJtYXAiLCJ0b3BMaW5lIiwicGFkIiwic2VwYXJhdG9yIiwibHJwYWQiLCJycGFkIiwiYXJndW1lbnRzIiwiaXNTdHJpbmciLCJ1bmRlZmluZWQiLCJzdWJQcmVmaXgiLCJjb25zb2xlIiwiZm9yRWFjaCIsInVuc2hpZnQiLCJnbG9iYWwiLCJzdHJpbmciLCJkYXRlIiwib2JqIiwiRUpTT04iLCJwYXJzZSIsInRpbWUiLCJMb2ciLCJmb3JtYXQiLCJzdGFydHVwIiwid3JpdGUiLCJwcm9jZXNzIiwic3Rkb3V0IiwiRGF0ZSIsImlkIiwiUmFuZG9tIiwidHMiLCJSb2NrZXRDaGF0IiwibGltaXQiLCJzZXR0aW5ncyIsImdldCIsInNoaWZ0IiwiTWV0ZW9yIiwicHVibGlzaCIsInVzZXJJZCIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsInJlYWR5IiwiYWRkZWQiLCJvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MsZ0JBQWEsTUFBSUEsWUFBbEI7QUFBK0JDLFVBQU8sTUFBSUEsTUFBMUM7QUFBaURDLGlCQUFjLE1BQUlBLGFBQW5FO0FBQWlGQyxpQkFBYyxNQUFJQSxhQUFuRztBQUFpSEMsVUFBTyxNQUFJQTtBQUE1SCxDQUFkOztBQUFtSixJQUFJQyxDQUFKOztBQUFNUCxPQUFPUSxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDSixRQUFFSSxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLENBQUo7QUFBTVosT0FBT1EsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFFBQUVELENBQUY7QUFBSTs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7QUFJdk47QUFDQSxrQ0FBZ0IsSUFBSSxjQUFjRSxZQUFkLENBQTJCO0FBQUU7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QW1CLENBQUM1QixNQUFELEVBQVN2RSxJQUFULEtBQWtCO0FBQ3BDLFNBQUtrRyxLQUFMLENBQVcsUUFBWCxFQUFxQmxHLEtBQUtvRixFQUExQixFQUE4QjtBQUM3QmIsY0FBUXZFLEtBQUt1RSxNQURnQjtBQUU3QmUsVUFBSXRGLEtBQUtzRjtBQUZvQixLQUE5QjtBQUlBLEdBTEQ7QUFNQSxDQW5CRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2xvZ2dlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgRXZlbnRFbWl0dGVyIExvZ2dlck1hbmFnZXIgU3lzdGVtTG9nZ2VyIExvZyovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuLy9UT0RPOiBjaGFuZ2UgdGhpcyBnbG9iYWwgdG8gaW1wb3J0XG5Mb2dnZXJNYW5hZ2VyID0gbmV3IGNsYXNzIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuXHRcdHRoaXMubG9nZ2VycyA9IHt9O1xuXHRcdHRoaXMucXVldWUgPSBbXTtcblx0XHR0aGlzLnNob3dQYWNrYWdlID0gZmFsc2U7XG5cdFx0dGhpcy5zaG93RmlsZUFuZExpbmUgPSBmYWxzZTtcblx0XHR0aGlzLmxvZ0xldmVsID0gMDtcblx0fVxuXHRyZWdpc3Rlcihsb2dnZXIpIHtcblx0XHRpZiAoIWxvZ2dlciBpbnN0YW5jZW9mIExvZ2dlcikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLmxvZ2dlcnNbbG9nZ2VyLm5hbWVdID0gbG9nZ2VyO1xuXHRcdHRoaXMuZW1pdCgncmVnaXN0ZXInLCBsb2dnZXIpO1xuXHR9XG5cdGFkZFRvUXVldWUobG9nZ2VyLCBhcmdzKSB7XG5cdFx0dGhpcy5xdWV1ZS5wdXNoKHtcblx0XHRcdGxvZ2dlciwgYXJnc1xuXHRcdH0pO1xuXHR9XG5cdGRpc3BhdGNoUXVldWUoKSB7XG5cdFx0Xy5lYWNoKHRoaXMucXVldWUsIChpdGVtKSA9PiBpdGVtLmxvZ2dlci5fbG9nLmFwcGx5KGl0ZW0ubG9nZ2VyLCBpdGVtLmFyZ3MpKTtcblx0XHR0aGlzLmNsZWFyUXVldWUoKTtcblx0fVxuXHRjbGVhclF1ZXVlKCkge1xuXHRcdHRoaXMucXVldWUgPSBbXTtcblx0fVxuXG5cdGRpc2FibGUoKSB7XG5cdFx0dGhpcy5lbmFibGVkID0gZmFsc2U7XG5cdH1cblxuXHRlbmFibGUoZGlzcGF0Y2hRdWV1ZSA9IGZhbHNlKSB7XG5cdFx0dGhpcy5lbmFibGVkID0gdHJ1ZTtcblx0XHRyZXR1cm4gKGRpc3BhdGNoUXVldWUgPT09IHRydWUpID8gdGhpcy5kaXNwYXRjaFF1ZXVlKCkgOiB0aGlzLmNsZWFyUXVldWUoKTtcblx0fVxufTtcblxuXG5cbmNvbnN0IGRlZmF1bHRUeXBlcyA9IHtcblx0ZGVidWc6IHtcblx0XHRuYW1lOiAnZGVidWcnLFxuXHRcdGNvbG9yOiAnYmx1ZScsXG5cdFx0bGV2ZWw6IDJcblx0fSxcblx0bG9nOiB7XG5cdFx0bmFtZTogJ2luZm8nLFxuXHRcdGNvbG9yOiAnYmx1ZScsXG5cdFx0bGV2ZWw6IDFcblx0fSxcblx0aW5mbzoge1xuXHRcdG5hbWU6ICdpbmZvJyxcblx0XHRjb2xvcjogJ2JsdWUnLFxuXHRcdGxldmVsOiAxXG5cdH0sXG5cdHN1Y2Nlc3M6IHtcblx0XHRuYW1lOiAnaW5mbycsXG5cdFx0Y29sb3I6ICdncmVlbicsXG5cdFx0bGV2ZWw6IDFcblx0fSxcblx0d2Fybjoge1xuXHRcdG5hbWU6ICd3YXJuJyxcblx0XHRjb2xvcjogJ21hZ2VudGEnLFxuXHRcdGxldmVsOiAxXG5cdH0sXG5cdGVycm9yOiB7XG5cdFx0bmFtZTogJ2Vycm9yJyxcblx0XHRjb2xvcjogJ3JlZCcsXG5cdFx0bGV2ZWw6IDBcblx0fVxufTtcblxuY2xhc3MgX0xvZ2dlciB7XG5cdGNvbnN0cnVjdG9yKG5hbWUsIGNvbmZpZyA9IHt9KSB7XG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblxuXHRcdHRoaXMuY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnKTtcblx0XHRpZiAoTG9nZ2VyTWFuYWdlci5sb2dnZXJzICYmIExvZ2dlck1hbmFnZXIubG9nZ2Vyc1t0aGlzLm5hbWVdICE9IG51bGwpIHtcblx0XHRcdExvZ2dlck1hbmFnZXIubG9nZ2Vyc1t0aGlzLm5hbWVdLndhcm4oJ0R1cGxpY2F0ZWQgaW5zdGFuY2UnKTtcblx0XHRcdHJldHVybiBMb2dnZXJNYW5hZ2VyLmxvZ2dlcnNbdGhpcy5uYW1lXTtcblx0XHR9XG5cdFx0Xy5lYWNoKGRlZmF1bHRUeXBlcywgKHR5cGVDb25maWcsIHR5cGUpID0+IHtcblx0XHRcdHRoaXNbdHlwZV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cdFx0XHRcdHJldHVybiBzZWxmLl9sb2cuY2FsbChzZWxmLCB7XG5cdFx0XHRcdFx0c2VjdGlvbjogdGhpcy5fX3NlY3Rpb24sXG5cdFx0XHRcdFx0dHlwZSxcblx0XHRcdFx0XHRsZXZlbDogdHlwZUNvbmZpZy5sZXZlbCxcblx0XHRcdFx0XHRtZXRob2Q6IHR5cGVDb25maWcubmFtZSxcblx0XHRcdFx0XHQnYXJndW1lbnRzJzogYXJnc1xuXHRcdFx0XHR9KTtcblx0XHRcdH07XG5cblx0XHRcdHNlbGZbYCR7IHR5cGUgfV9ib3hgXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblx0XHRcdFx0cmV0dXJuIHNlbGYuX2xvZy5jYWxsKHNlbGYsIHtcblx0XHRcdFx0XHRzZWN0aW9uOiB0aGlzLl9fc2VjdGlvbixcblx0XHRcdFx0XHR0eXBlLFxuXHRcdFx0XHRcdGJveDogdHJ1ZSxcblx0XHRcdFx0XHRsZXZlbDogdHlwZUNvbmZpZy5sZXZlbCxcblx0XHRcdFx0XHRtZXRob2Q6IHR5cGVDb25maWcubmFtZSxcblx0XHRcdFx0XHQnYXJndW1lbnRzJzogYXJnc1xuXHRcdFx0XHR9KTtcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0aWYgKHRoaXMuY29uZmlnLm1ldGhvZHMpIHtcblx0XHRcdF8uZWFjaCh0aGlzLmNvbmZpZy5tZXRob2RzLCAodHlwZUNvbmZpZywgbWV0aG9kKSA9PiB7XG5cdFx0XHRcdGlmICh0aGlzW21ldGhvZF0gIT0gbnVsbCkge1xuXHRcdFx0XHRcdHNlbGYud2FybihgTWV0aG9kICR7IG1ldGhvZCB9IGFscmVhZHkgZXhpc3RzYCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdID09IG51bGwpIHtcblx0XHRcdFx0XHRzZWxmLndhcm4oYE1ldGhvZCB0eXBlICR7IHR5cGVDb25maWcudHlwZSB9IGRvZXMgbm90IGV4aXN0YCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpc1ttZXRob2RdID0gZnVuY3Rpb24oLi4uYXJncykge1xuXHRcdFx0XHRcdHJldHVybiBzZWxmLl9sb2cuY2FsbChzZWxmLCB7XG5cdFx0XHRcdFx0XHRzZWN0aW9uOiB0aGlzLl9fc2VjdGlvbixcblx0XHRcdFx0XHRcdHR5cGU6IHR5cGVDb25maWcudHlwZSxcblx0XHRcdFx0XHRcdGxldmVsOiB0eXBlQ29uZmlnLmxldmVsICE9IG51bGwgPyB0eXBlQ29uZmlnLmxldmVsIDogZGVmYXVsdFR5cGVzW3R5cGVDb25maWcudHlwZV0gJiYgZGVmYXVsdFR5cGVzW3R5cGVDb25maWcudHlwZV0ubGV2ZWwsXG5cdFx0XHRcdFx0XHRtZXRob2QsXG5cdFx0XHRcdFx0XHQnYXJndW1lbnRzJzogYXJnc1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHR0aGlzW2AkeyBtZXRob2QgfV9ib3hgXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblx0XHRcdFx0XHRyZXR1cm4gc2VsZi5fbG9nLmNhbGwoc2VsZiwge1xuXHRcdFx0XHRcdFx0c2VjdGlvbjogdGhpcy5fX3NlY3Rpb24sXG5cdFx0XHRcdFx0XHR0eXBlOiB0eXBlQ29uZmlnLnR5cGUsXG5cdFx0XHRcdFx0XHRib3g6IHRydWUsXG5cdFx0XHRcdFx0XHRsZXZlbDogdHlwZUNvbmZpZy5sZXZlbCAhPSBudWxsID8gdHlwZUNvbmZpZy5sZXZlbCA6IGRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdICYmIGRlZmF1bHRUeXBlc1t0eXBlQ29uZmlnLnR5cGVdLmxldmVsLFxuXHRcdFx0XHRcdFx0bWV0aG9kLFxuXHRcdFx0XHRcdFx0J2FyZ3VtZW50cyc6IGFyZ3Ncblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRpZiAodGhpcy5jb25maWcuc2VjdGlvbnMpIHtcblx0XHRcdF8uZWFjaCh0aGlzLmNvbmZpZy5zZWN0aW9ucywgKG5hbWUsIHNlY3Rpb24pID0+IHtcblx0XHRcdFx0dGhpc1tzZWN0aW9uXSA9IHt9O1xuXHRcdFx0XHRfLmVhY2goZGVmYXVsdFR5cGVzLCAodHlwZUNvbmZpZywgdHlwZSkgPT4ge1xuXHRcdFx0XHRcdHNlbGZbc2VjdGlvbl1bdHlwZV0gPSAoLi4uYXJncykgPT4gdGhpc1t0eXBlXS5hcHBseSh7X19zZWN0aW9uOiBuYW1lfSwgYXJncyk7XG5cdFx0XHRcdFx0c2VsZltzZWN0aW9uXVtgJHsgdHlwZSB9X2JveGBdID0gKC4uLmFyZ3MpID0+IHRoaXNbYCR7IHR5cGUgfV9ib3hgXS5hcHBseSh7X19zZWN0aW9uOiBuYW1lfSwgYXJncyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRfLmVhY2godGhpcy5jb25maWcubWV0aG9kcywgKHR5cGVDb25maWcsIG1ldGhvZCkgPT4ge1xuXHRcdFx0XHRcdHNlbGZbc2VjdGlvbl1bbWV0aG9kXSA9ICguLi5hcmdzKSA9PiBzZWxmW21ldGhvZF0uYXBwbHkoe19fc2VjdGlvbjogbmFtZX0sIGFyZ3MpO1xuXHRcdFx0XHRcdHNlbGZbc2VjdGlvbl1bYCR7IG1ldGhvZCB9X2JveGBdID0gKC4uLmFyZ3MpID0+IHNlbGZbYCR7IG1ldGhvZCB9X2JveGBdLmFwcGx5KHtfX3NlY3Rpb246IG5hbWV9LCBhcmdzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRMb2dnZXJNYW5hZ2VyLnJlZ2lzdGVyKHRoaXMpO1xuXHR9XG5cdGdldFByZWZpeChvcHRpb25zKSB7XG5cdFx0bGV0IHByZWZpeCA9IGAkeyB0aGlzLm5hbWUgfSDinpQgJHsgb3B0aW9ucy5tZXRob2QgfWA7XG5cdFx0aWYgKG9wdGlvbnMuc2VjdGlvbikge1xuXHRcdFx0cHJlZml4ID0gYCR7IHRoaXMubmFtZSB9IOKelCAkeyBvcHRpb25zLnNlY3Rpb24gfS4keyBvcHRpb25zLm1ldGhvZCB9YDtcblx0XHR9XG5cdFx0Y29uc3QgZGV0YWlscyA9IHRoaXMuX2dldENhbGxlckRldGFpbHMoKTtcblx0XHRjb25zdCBkZXRhaWxQYXJ0cyA9IFtdO1xuXHRcdGlmIChkZXRhaWxzWydwYWNrYWdlJ10gJiYgKExvZ2dlck1hbmFnZXIuc2hvd1BhY2thZ2UgPT09IHRydWUgfHwgb3B0aW9ucy50eXBlID09PSAnZXJyb3InKSkge1xuXHRcdFx0ZGV0YWlsUGFydHMucHVzaChkZXRhaWxzWydwYWNrYWdlJ10pO1xuXHRcdH1cblx0XHRpZiAoTG9nZ2VyTWFuYWdlci5zaG93RmlsZUFuZExpbmUgPT09IHRydWUgfHwgb3B0aW9ucy50eXBlID09PSAnZXJyb3InKSB7XG5cdFx0XHRpZiAoKGRldGFpbHMuZmlsZSAhPSBudWxsKSAmJiAoZGV0YWlscy5saW5lICE9IG51bGwpKSB7XG5cdFx0XHRcdGRldGFpbFBhcnRzLnB1c2goYCR7IGRldGFpbHMuZmlsZSB9OiR7IGRldGFpbHMubGluZSB9YCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoZGV0YWlscy5maWxlICE9IG51bGwpIHtcblx0XHRcdFx0XHRkZXRhaWxQYXJ0cy5wdXNoKGRldGFpbHMuZmlsZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRldGFpbHMubGluZSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0ZGV0YWlsUGFydHMucHVzaChkZXRhaWxzLmxpbmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChkZWZhdWx0VHlwZXNbb3B0aW9ucy50eXBlXSkge1xuXHRcdFx0Ly8gZm9ybWF0IHRoZSBtZXNzYWdlIHRvIGEgY29sb3JlZCBtZXNzYWdlXG5cdFx0XHRwcmVmaXggPSBwcmVmaXhbZGVmYXVsdFR5cGVzW29wdGlvbnMudHlwZV0uY29sb3JdO1xuXHRcdH1cblx0XHRpZiAoZGV0YWlsUGFydHMubGVuZ3RoID4gMCkge1xuXHRcdFx0cHJlZml4ID0gYCR7IGRldGFpbFBhcnRzLmpvaW4oJyAnKSB9ICR7IHByZWZpeCB9YDtcblx0XHR9XG5cdFx0cmV0dXJuIHByZWZpeDtcblx0fVxuXHRfZ2V0Q2FsbGVyRGV0YWlscygpIHtcblx0XHRjb25zdCBnZXRTdGFjayA9ICgpID0+IHtcblx0XHRcdC8vIFdlIGRvIE5PVCB1c2UgRXJyb3IucHJlcGFyZVN0YWNrVHJhY2UgaGVyZSAoYSBWOCBleHRlbnNpb24gdGhhdCBnZXRzIHVzIGFcblx0XHRcdC8vIGNvcmUtcGFyc2VkIHN0YWNrKSBzaW5jZSBpdCdzIGltcG9zc2libGUgdG8gY29tcG9zZSBpdCB3aXRoIHRoZSB1c2Ugb2Zcblx0XHRcdC8vIEVycm9yLnByZXBhcmVTdGFja1RyYWNlIHVzZWQgb24gdGhlIHNlcnZlciBmb3Igc291cmNlIG1hcHMuXG5cdFx0XHRjb25zdCB7c3RhY2t9ID0gbmV3IEVycm9yKCk7XG5cdFx0XHRyZXR1cm4gc3RhY2s7XG5cdFx0fTtcblx0XHRjb25zdCBzdGFjayA9IGdldFN0YWNrKCk7XG5cdFx0aWYgKCFzdGFjaykge1xuXHRcdFx0cmV0dXJuIHt9O1xuXHRcdH1cblx0XHRjb25zdCBsaW5lcyA9IHN0YWNrLnNwbGl0KCdcXG4nKS5zcGxpY2UoMSk7XG5cdFx0Ly8gbG9va2luZyBmb3IgdGhlIGZpcnN0IGxpbmUgb3V0c2lkZSB0aGUgbG9nZ2luZyBwYWNrYWdlIChvciBhblxuXHRcdC8vIGV2YWwgaWYgd2UgZmluZCB0aGF0IGZpcnN0KVxuXHRcdGxldCBsaW5lID0gbGluZXNbMF07XG5cdFx0Zm9yIChsZXQgaW5kZXggPSAwLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGluZGV4IDwgbGVuLCBpbmRleCsrOyBsaW5lID0gbGluZXNbaW5kZXhdKSB7XG5cdFx0XHRpZiAobGluZS5tYXRjaCgvXlxccyphdCBldmFsIFxcKGV2YWwvKSkge1xuXHRcdFx0XHRyZXR1cm4ge2ZpbGU6ICdldmFsJ307XG5cdFx0XHR9XG5cblx0XHRcdGlmICghbGluZS5tYXRjaCgvcGFja2FnZXNcXC9yb2NrZXRjaGF0X2xvZ2dlcig/OlxcL3xcXC5qcykvKSkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBkZXRhaWxzID0ge307XG5cdFx0Ly8gVGhlIGZvcm1hdCBmb3IgRkYgaXMgJ2Z1bmN0aW9uTmFtZUBmaWxlUGF0aDpsaW5lTnVtYmVyJ1xuXHRcdC8vIFRoZSBmb3JtYXQgZm9yIFY4IGlzICdmdW5jdGlvbk5hbWUgKHBhY2thZ2VzL2xvZ2dpbmcvbG9nZ2luZy5qczo4MSknIG9yXG5cdFx0Ly8gICAgICAgICAgICAgICAgICAgICAgJ3BhY2thZ2VzL2xvZ2dpbmcvbG9nZ2luZy5qczo4MSdcblx0XHRjb25zdCBtYXRjaCA9IC8oPzpbQChdfCBhdCApKFteKF0rPyk6KFswLTk6XSspKD86XFwpfCQpLy5leGVjKGxpbmUpO1xuXHRcdGlmICghbWF0Y2gpIHtcblx0XHRcdHJldHVybiBkZXRhaWxzO1xuXHRcdH1cblx0XHRkZXRhaWxzLmxpbmUgPSBtYXRjaFsyXS5zcGxpdCgnOicpWzBdO1xuXHRcdC8vIFBvc3NpYmxlIGZvcm1hdDogaHR0cHM6Ly9mb28uYmFyLmNvbS9zY3JpcHRzL2ZpbGUuanM/cmFuZG9tPWZvb2JhclxuXHRcdC8vIFhYWDogaWYgeW91IGNhbiB3cml0ZSB0aGUgZm9sbG93aW5nIGluIGJldHRlciB3YXksIHBsZWFzZSBkbyBpdFxuXHRcdC8vIFhYWDogd2hhdCBhYm91dCBldmFscz9cblx0XHRkZXRhaWxzLmZpbGUgPSBtYXRjaFsxXS5zcGxpdCgnLycpLnNsaWNlKC0xKVswXS5zcGxpdCgnPycpWzBdO1xuXHRcdGNvbnN0IHBhY2thZ2VNYXRjaCA9IG1hdGNoWzFdLm1hdGNoKC9wYWNrYWdlc1xcLyhbXlxcLlxcL10rKSg/OlxcL3xcXC4pLyk7XG5cdFx0aWYgKHBhY2thZ2VNYXRjaCkge1xuXHRcdFx0ZGV0YWlsc1sncGFja2FnZSddID0gcGFja2FnZU1hdGNoWzFdO1xuXHRcdH1cblx0XHRyZXR1cm4gZGV0YWlscztcblx0fVxuXHRtYWtlQUJveChtZXNzYWdlLCB0aXRsZSkge1xuXHRcdGlmICghXy5pc0FycmF5KG1lc3NhZ2UpKSB7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5zcGxpdCgnXFxuJyk7XG5cdFx0fVxuXHRcdGxldCBsZW4gPSAwO1xuXG5cdFx0bGVuID0gTWF0aC5tYXguYXBwbHkobnVsbCwgbWVzc2FnZS5tYXAobGluZSA9PiBsaW5lLmxlbmd0aCkpO1xuXG5cdFx0Y29uc3QgdG9wTGluZSA9IGArLS0keyBzLnBhZCgnJywgbGVuLCAnLScpIH0tLStgO1xuXHRcdGNvbnN0IHNlcGFyYXRvciA9IGB8ICAkeyBzLnBhZCgnJywgbGVuLCAnJykgfSAgfGA7XG5cdFx0bGV0IGxpbmVzID0gW107XG5cblx0XHRsaW5lcy5wdXNoKHRvcExpbmUpO1xuXHRcdGlmICh0aXRsZSkge1xuXHRcdFx0bGluZXMucHVzaChgfCAgJHsgcy5scnBhZCh0aXRsZSwgbGVuKSB9ICB8YCk7XG5cdFx0XHRsaW5lcy5wdXNoKHRvcExpbmUpO1xuXHRcdH1cblx0XHRsaW5lcy5wdXNoKHNlcGFyYXRvcik7XG5cblx0XHRsaW5lcyA9IFsuLi5saW5lcywgLi4ubWVzc2FnZS5tYXAobGluZSA9PiBgfCAgJHsgcy5ycGFkKGxpbmUsIGxlbikgfSAgfGApXTtcblxuXHRcdGxpbmVzLnB1c2goc2VwYXJhdG9yKTtcblx0XHRsaW5lcy5wdXNoKHRvcExpbmUpO1xuXHRcdHJldHVybiBsaW5lcztcblx0fVxuXG5cdF9sb2cob3B0aW9ucykge1xuXHRcdGlmIChMb2dnZXJNYW5hZ2VyLmVuYWJsZWQgPT09IGZhbHNlKSB7XG5cdFx0XHRMb2dnZXJNYW5hZ2VyLmFkZFRvUXVldWUodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKG9wdGlvbnMubGV2ZWwgPT0gbnVsbCkge1xuXHRcdFx0b3B0aW9ucy5sZXZlbCA9IDE7XG5cdFx0fVxuXG5cdFx0aWYgKExvZ2dlck1hbmFnZXIubG9nTGV2ZWwgPCBvcHRpb25zLmxldmVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgcHJlZml4ID0gdGhpcy5nZXRQcmVmaXgob3B0aW9ucyk7XG5cblx0XHRpZiAob3B0aW9ucy5ib3ggPT09IHRydWUgJiYgXy5pc1N0cmluZyhvcHRpb25zLmFyZ3VtZW50c1swXSkpIHtcblx0XHRcdGxldCBjb2xvciA9IHVuZGVmaW5lZDtcblx0XHRcdGlmIChkZWZhdWx0VHlwZXNbb3B0aW9ucy50eXBlXSkge1xuXHRcdFx0XHRjb2xvciA9IGRlZmF1bHRUeXBlc1tvcHRpb25zLnR5cGVdLmNvbG9yO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBib3ggPSB0aGlzLm1ha2VBQm94KG9wdGlvbnMuYXJndW1lbnRzWzBdLCBvcHRpb25zLmFyZ3VtZW50c1sxXSk7XG5cdFx0XHRsZXQgc3ViUHJlZml4ID0gJ+KelCc7XG5cdFx0XHRpZiAoY29sb3IpIHtcblx0XHRcdFx0c3ViUHJlZml4ID0gc3ViUHJlZml4W2NvbG9yXTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc29sZS5sb2coc3ViUHJlZml4LCBwcmVmaXgpO1xuXHRcdFx0Ym94LmZvckVhY2gobGluZSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHN1YlByZWZpeCwgY29sb3IgPyBsaW5lW2NvbG9yXTogbGluZSk7XG5cdFx0XHR9KTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRvcHRpb25zLmFyZ3VtZW50cy51bnNoaWZ0KHByZWZpeCk7XG5cdFx0XHRjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBvcHRpb25zLmFyZ3VtZW50cyk7XG5cdFx0fVxuXHR9XG59XG4vLyBUT0RPOiBjaGFuZ2UgdGhpcyBnbG9iYWwgdG8gaW1wb3J0XG5Mb2dnZXIgPSBnbG9iYWwuTG9nZ2VyID0gX0xvZ2dlcjtcbmNvbnN0IHByb2Nlc3NTdHJpbmcgPSBmdW5jdGlvbihzdHJpbmcsIGRhdGUpIHtcblx0bGV0IG9iajtcblx0dHJ5IHtcblx0XHRpZiAoc3RyaW5nWzBdID09PSAneycpIHtcblx0XHRcdG9iaiA9IEVKU09OLnBhcnNlKHN0cmluZyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9iaiA9IHtcblx0XHRcdFx0bWVzc2FnZTogc3RyaW5nLFxuXHRcdFx0XHR0aW1lOiBkYXRlLFxuXHRcdFx0XHRsZXZlbDogJ2luZm8nXG5cdFx0XHR9O1xuXHRcdH1cblx0XHRyZXR1cm4gTG9nLmZvcm1hdChvYmosIHtjb2xvcjogdHJ1ZX0pO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHJldHVybiBzdHJpbmc7XG5cdH1cbn07XG4vLyBUT0RPOiBjaGFuZ2UgdGhpcyBnbG9iYWwgdG8gaW1wb3J0XG5TeXN0ZW1Mb2dnZXIgPSBuZXcgTG9nZ2VyKCdTeXN0ZW0nLCB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWZcblx0bWV0aG9kczoge1xuXHRcdHN0YXJ0dXA6IHtcblx0XHRcdHR5cGU6ICdzdWNjZXNzJyxcblx0XHRcdGxldmVsOiAwXG5cdFx0fVxuXHR9XG59KTtcblxuXG5jb25zdCBTdGRPdXQgPSBuZXcgY2xhc3MgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXHRcdGNvbnN0IHdyaXRlID0gcHJvY2Vzcy5zdGRvdXQud3JpdGU7XG5cdFx0dGhpcy5xdWV1ZSA9IFtdO1xuXHRcdHByb2Nlc3Muc3Rkb3V0LndyaXRlID0gKC4uLmFyZ3MpID0+IHtcblx0XHRcdHdyaXRlLmFwcGx5KHByb2Nlc3Muc3Rkb3V0LCBhcmdzKTtcblx0XHRcdGNvbnN0IGRhdGUgPSBuZXcgRGF0ZTtcblx0XHRcdGNvbnN0IHN0cmluZyA9IHByb2Nlc3NTdHJpbmcoYXJnc1swXSwgZGF0ZSk7XG5cdFx0XHRjb25zdCBpdGVtID0ge1xuXHRcdFx0XHRpZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHN0cmluZyxcblx0XHRcdFx0dHM6IGRhdGVcblx0XHRcdH07XG5cdFx0XHR0aGlzLnF1ZXVlLnB1c2goaXRlbSk7XG5cblx0XHRcdGlmICh0eXBlb2YgUm9ja2V0Q2hhdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0Y29uc3QgbGltaXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTG9nX1ZpZXdfTGltaXQnKTtcblx0XHRcdFx0aWYgKGxpbWl0ICYmIHRoaXMucXVldWUubGVuZ3RoID4gbGltaXQpIHtcblx0XHRcdFx0XHR0aGlzLnF1ZXVlLnNoaWZ0KCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMuZW1pdCgnd3JpdGUnLCBzdHJpbmcsIGl0ZW0pO1xuXHRcdH07XG5cdH1cbn07XG5cblxuTWV0ZW9yLnB1Ymxpc2goJ3N0ZG91dCcsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbG9ncycpICE9PSB0cnVlKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdFN0ZE91dC5xdWV1ZS5mb3JFYWNoKGl0ZW0gPT4ge1xuXHRcdHRoaXMuYWRkZWQoJ3N0ZG91dCcsIGl0ZW0uaWQsIHtcblx0XHRcdHN0cmluZzogaXRlbS5zdHJpbmcsXG5cdFx0XHR0czogaXRlbS50c1xuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cdFN0ZE91dC5vbignd3JpdGUnLCAoc3RyaW5nLCBpdGVtKSA9PiB7XG5cdFx0dGhpcy5hZGRlZCgnc3Rkb3V0JywgaXRlbS5pZCwge1xuXHRcdFx0c3RyaW5nOiBpdGVtLnN0cmluZyxcblx0XHRcdHRzOiBpdGVtLnRzXG5cdFx0fSk7XG5cdH0pO1xufSk7XG5cblxuZXhwb3J0IHsgU3lzdGVtTG9nZ2VyLCBTdGRPdXQsIExvZ2dlck1hbmFnZXIsIHByb2Nlc3NTdHJpbmcsIExvZ2dlciB9O1xuIl19
