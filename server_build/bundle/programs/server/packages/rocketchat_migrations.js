(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:migrations":{"migrations.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_migrations/migrations.js                                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);

/*
	Adds migration capabilities. Migrations are defined like:

	Migrations.add({
		up: function() {}, //*required* code to run to migrate upwards
		version: 1, //*required* number to identify migration order
		down: function() {}, //*optional* code to run to migrate downwards
		name: 'Something' //*optional* display name for the migration
	});

	The ordering of migrations is determined by the version you set.

	To run the migrations, set the MIGRATE environment variable to either
	'latest' or the version number you want to migrate to. Optionally, append
	',exit' if you want the migrations to exit the meteor process, e.g if you're
	migrating from a script (remember to pass the --once parameter).

	e.g:
	MIGRATE="latest" mrt # ensure we'll be at the latest version and run the app
	MIGRATE="latest,exit" mrt --once # ensure we'll be at the latest version and exit
	MIGRATE="2,exit" mrt --once # migrate to version 2 and exit

	Note: Migrations will lock ensuring only 1 app can be migrating at once. If
	a migration crashes, the control record in the migrations collection will
	remain locked and at the version it was at previously, however the db could
	be in an inconsistant state.
*/
// since we'll be at version 0 by default, we should have a migration set for it.
const DefaultMigration = {
  version: 0,

  up() {// @TODO: check if collection "migrations" exist
    // If exists, rename and rerun _migrateTo
  }

};
const Migrations = this.Migrations = {
  _list: [DefaultMigration],
  options: {
    // false disables logging
    log: true,
    // null or a function
    logger: null,
    // enable/disable info log "already at latest."
    logIfLatest: true,
    // lock will be valid for this amount of minutes
    lockExpiration: 5,
    // retry interval in seconds
    retryInterval: 10,
    // max number of attempts to retry unlock
    maxAttempts: 30,
    // migrations collection name
    collectionName: 'migrations' // collectionName: "rocketchat_migrations"

  },

  config(opts) {
    this.options = _.extend({}, this.options, opts);
  }

};
Migrations._collection = new Mongo.Collection(Migrations.options.collectionName);
/* Create a box around messages for displaying on a console.log */

function makeABox(message, color = 'red') {
  if (!_.isArray(message)) {
    message = message.split('\n');
  }

  const len = _(message).reduce(function (memo, msg) {
    return Math.max(memo, msg.length);
  }, 0) + 4;
  const text = message.map(msg => {
    return '|'[color] + s.lrpad(msg, len)[color] + '|'[color];
  }).join('\n');
  const topLine = '+'[color] + s.pad('', len, '-')[color] + '+'[color];
  const separator = '|'[color] + s.pad('', len, '') + '|'[color];
  const bottomLine = '+'[color] + s.pad('', len, '-')[color] + '+'[color];
  return `\n${topLine}\n${separator}\n${text}\n${separator}\n${bottomLine}\n`;
}
/*
	Logger factory function. Takes a prefix string and options object
	and uses an injected `logger` if provided, else falls back to
	Meteor's `Log` package.
	Will send a log object to the injected logger, on the following form:
		message: String
		level: String (info, warn, error, debug)
		tag: 'Migrations'
*/


function createLogger(prefix) {
  check(prefix, String); // Return noop if logging is disabled.

  if (Migrations.options.log === false) {
    return function () {};
  }

  return function (level, message) {
    check(level, Match.OneOf('info', 'error', 'warn', 'debug'));
    check(message, Match.OneOf(String, [String]));
    const logger = Migrations.options && Migrations.options.logger;

    if (logger && _.isFunction(logger)) {
      logger({
        level,
        message,
        tag: prefix
      });
    } else {
      Log[level]({
        message: `${prefix}: ${message}`
      });
    }
  };
} // collection holding the control record


const log = createLogger('Migrations');
['info', 'warn', 'error', 'debug'].forEach(function (level) {
  log[level] = _.partial(log, level);
}); // if (process.env.MIGRATE)
//   Migrations.migrateTo(process.env.MIGRATE);
// Add a new migration:
// {up: function *required
//  version: Number *required
//  down: function *optional
//  name: String *optional
// }

Migrations.add = function (migration) {
  if (typeof migration.up !== 'function') {
    throw new Meteor.Error('Migration must supply an up function.');
  }

  if (typeof migration.version !== 'number') {
    throw new Meteor.Error('Migration must supply a version number.');
  }

  if (migration.version <= 0) {
    throw new Meteor.Error('Migration version must be greater than 0');
  } // Freeze the migration object to make it hereafter immutable


  Object.freeze(migration);

  this._list.push(migration);

  this._list = _.sortBy(this._list, function (m) {
    return m.version;
  });
}; // Attempts to run the migrations using command in the form of:
// e.g 'latest', 'latest,exit', 2
// use 'XX,rerun' to re-run the migration at that version


Migrations.migrateTo = function (command) {
  if (_.isUndefined(command) || command === '' || this._list.length === 0) {
    throw new Error(`Cannot migrate using invalid command: ${command}`);
  }

  let version;
  let subcommand;

  if (typeof command === 'number') {
    version = command;
  } else {
    version = command.split(',')[0];
    subcommand = command.split(',')[1];
  }

  const maxAttempts = Migrations.options.maxAttempts;
  const retryInterval = Migrations.options.retryInterval;
  let migrated;

  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    if (version === 'latest') {
      migrated = this._migrateTo(_.last(this._list).version);
    } else {
      migrated = this._migrateTo(parseInt(version), subcommand === 'rerun');
    }

    if (migrated) {
      break;
    } else {
      let willRetry;

      if (attempts < maxAttempts) {
        willRetry = ` Trying again in ${retryInterval} seconds.`;

        Meteor._sleepForMs(retryInterval * 1000);
      } else {
        willRetry = '';
      }

      console.log(`Not migrating, control is locked. Attempt ${attempts}/${maxAttempts}.${willRetry}`.yellow);
    }
  }

  if (!migrated) {
    const control = this._getControl(); // Side effect: upserts control document.


    console.log(makeABox(['ERROR! SERVER STOPPED', '', 'Your database migration control is locked.', 'Please make sure you are running the latest version and try again.', 'If the problem persists, please contact support.', '', `This Rocket.Chat version: ${RocketChat.Info.version}`, `Database locked at version: ${control.version}`, `Database target version: ${version === 'latest' ? _.last(this._list).version : version}`, '', `Commit: ${RocketChat.Info.commit.hash}`, `Date: ${RocketChat.Info.commit.date}`, `Branch: ${RocketChat.Info.commit.branch}`, `Tag: ${RocketChat.Info.commit.tag}`]));
    process.exit(1);
  } // remember to run meteor with --once otherwise it will restart


  if (subcommand === 'exit') {
    process.exit(0);
  }
}; // just returns the current version


Migrations.getVersion = function () {
  return this._getControl().version;
}; // migrates to the specific version passed in


Migrations._migrateTo = function (version, rerun) {
  const self = this;

  const control = this._getControl(); // Side effect: upserts control document.


  let currentVersion = control.version;

  if (lock() === false) {
    // log.info('Not migrating, control is locked.');
    // Warning
    return false;
  }

  if (rerun) {
    log.info(`Rerunning version ${version}`);
    migrate('up', this._findIndexByVersion(version));
    log.info('Finished migrating.');
    unlock();
    return true;
  }

  if (currentVersion === version) {
    if (this.options.logIfLatest) {
      log.info(`Not migrating, already at version ${version}`);
    }

    unlock();
    return true;
  }

  const startIdx = this._findIndexByVersion(currentVersion);

  const endIdx = this._findIndexByVersion(version); // log.info('startIdx:' + startIdx + ' endIdx:' + endIdx);


  log.info(`Migrating from version ${this._list[startIdx].version} -> ${this._list[endIdx].version}`); // run the actual migration

  function migrate(direction, idx) {
    const migration = self._list[idx];

    if (typeof migration[direction] !== 'function') {
      unlock();
      throw new Meteor.Error(`Cannot migrate ${direction} on version ${migration.version}`);
    }

    function maybeName() {
      return migration.name ? ` (${migration.name})` : '';
    }

    log.info(`Running ${direction}() on version ${migration.version}${maybeName()}`);

    try {
      migration[direction](migration);
    } catch (e) {
      console.log(makeABox(['ERROR! SERVER STOPPED', '', 'Your database migration failed:', e.message, '', 'Please make sure you are running the latest version and try again.', 'If the problem persists, please contact support.', '', `This Rocket.Chat version: ${RocketChat.Info.version}`, `Database locked at version: ${control.version}`, `Database target version: ${version}`, '', `Commit: ${RocketChat.Info.commit.hash}`, `Date: ${RocketChat.Info.commit.date}`, `Branch: ${RocketChat.Info.commit.branch}`, `Tag: ${RocketChat.Info.commit.tag}`]));
      process.exit(1);
    }
  } // Returns true if lock was acquired.


  function lock() {
    const date = new Date();
    const dateMinusInterval = moment(date).subtract(self.options.lockExpiration, 'minutes').toDate();
    const build = RocketChat.Info ? RocketChat.Info.build.date : date; // This is atomic. The selector ensures only one caller at a time will see
    // the unlocked control, and locking occurs in the same update's modifier.
    // All other simultaneous callers will get false back from the update.

    return self._collection.update({
      _id: 'control',
      $or: [{
        locked: false
      }, {
        lockedAt: {
          $lt: dateMinusInterval
        }
      }, {
        buildAt: {
          $ne: build
        }
      }]
    }, {
      $set: {
        locked: true,
        lockedAt: date,
        buildAt: build
      }
    }) === 1;
  } // Side effect: saves version.


  function unlock() {
    self._setControl({
      locked: false,
      version: currentVersion
    });
  }

  if (currentVersion < version) {
    for (let i = startIdx; i < endIdx; i++) {
      migrate('up', i + 1);
      currentVersion = self._list[i + 1].version;

      self._setControl({
        locked: true,
        version: currentVersion
      });
    }
  } else {
    for (let i = startIdx; i > endIdx; i--) {
      migrate('down', i);
      currentVersion = self._list[i - 1].version;

      self._setControl({
        locked: true,
        version: currentVersion
      });
    }
  }

  unlock();
  log.info('Finished migrating.');
}; // gets the current control record, optionally creating it if non-existant


Migrations._getControl = function () {
  const control = this._collection.findOne({
    _id: 'control'
  });

  return control || this._setControl({
    version: 0,
    locked: false
  });
}; // sets the control record


Migrations._setControl = function (control) {
  // be quite strict
  check(control.version, Number);
  check(control.locked, Boolean);

  this._collection.update({
    _id: 'control'
  }, {
    $set: {
      version: control.version,
      locked: control.locked
    }
  }, {
    upsert: true
  });

  return control;
}; // returns the migration index in _list or throws if not found


Migrations._findIndexByVersion = function (version) {
  for (let i = 0; i < this._list.length; i++) {
    if (this._list[i].version === version) {
      return i;
    }
  }

  throw new Meteor.Error(`Can't find migration version ${version}`);
}; //reset (mainly intended for tests)


Migrations._reset = function () {
  this._list = [{
    version: 0,

    up() {}

  }];

  this._collection.remove({});
};

RocketChat.Migrations = Migrations;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:migrations/migrations.js");

/* Exports */
Package._define("rocketchat:migrations");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_migrations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptaWdyYXRpb25zL21pZ3JhdGlvbnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwicyIsIm1vbWVudCIsIkRlZmF1bHRNaWdyYXRpb24iLCJ2ZXJzaW9uIiwidXAiLCJNaWdyYXRpb25zIiwiX2xpc3QiLCJvcHRpb25zIiwibG9nIiwibG9nZ2VyIiwibG9nSWZMYXRlc3QiLCJsb2NrRXhwaXJhdGlvbiIsInJldHJ5SW50ZXJ2YWwiLCJtYXhBdHRlbXB0cyIsImNvbGxlY3Rpb25OYW1lIiwiY29uZmlnIiwib3B0cyIsImV4dGVuZCIsIl9jb2xsZWN0aW9uIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwibWFrZUFCb3giLCJtZXNzYWdlIiwiY29sb3IiLCJpc0FycmF5Iiwic3BsaXQiLCJsZW4iLCJyZWR1Y2UiLCJtZW1vIiwibXNnIiwiTWF0aCIsIm1heCIsImxlbmd0aCIsInRleHQiLCJtYXAiLCJscnBhZCIsImpvaW4iLCJ0b3BMaW5lIiwicGFkIiwic2VwYXJhdG9yIiwiYm90dG9tTGluZSIsImNyZWF0ZUxvZ2dlciIsInByZWZpeCIsImNoZWNrIiwiU3RyaW5nIiwibGV2ZWwiLCJNYXRjaCIsIk9uZU9mIiwiaXNGdW5jdGlvbiIsInRhZyIsIkxvZyIsImZvckVhY2giLCJwYXJ0aWFsIiwiYWRkIiwibWlncmF0aW9uIiwiTWV0ZW9yIiwiRXJyb3IiLCJPYmplY3QiLCJmcmVlemUiLCJwdXNoIiwic29ydEJ5IiwibSIsIm1pZ3JhdGVUbyIsImNvbW1hbmQiLCJpc1VuZGVmaW5lZCIsInN1YmNvbW1hbmQiLCJtaWdyYXRlZCIsImF0dGVtcHRzIiwiX21pZ3JhdGVUbyIsImxhc3QiLCJwYXJzZUludCIsIndpbGxSZXRyeSIsIl9zbGVlcEZvck1zIiwiY29uc29sZSIsInllbGxvdyIsImNvbnRyb2wiLCJfZ2V0Q29udHJvbCIsIlJvY2tldENoYXQiLCJJbmZvIiwiY29tbWl0IiwiaGFzaCIsImRhdGUiLCJicmFuY2giLCJwcm9jZXNzIiwiZXhpdCIsImdldFZlcnNpb24iLCJyZXJ1biIsInNlbGYiLCJjdXJyZW50VmVyc2lvbiIsImxvY2siLCJpbmZvIiwibWlncmF0ZSIsIl9maW5kSW5kZXhCeVZlcnNpb24iLCJ1bmxvY2siLCJzdGFydElkeCIsImVuZElkeCIsImRpcmVjdGlvbiIsImlkeCIsIm1heWJlTmFtZSIsIm5hbWUiLCJlIiwiRGF0ZSIsImRhdGVNaW51c0ludGVydmFsIiwic3VidHJhY3QiLCJ0b0RhdGUiLCJidWlsZCIsInVwZGF0ZSIsIl9pZCIsIiRvciIsImxvY2tlZCIsImxvY2tlZEF0IiwiJGx0IiwiYnVpbGRBdCIsIiRuZSIsIiRzZXQiLCJfc2V0Q29udHJvbCIsImkiLCJmaW5kT25lIiwiTnVtYmVyIiwiQm9vbGVhbiIsInVwc2VydCIsIl9yZXNldCIsInJlbW92ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlDLENBQUo7QUFBTUwsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFFBQUVELENBQUY7QUFBSTs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7QUFBK0QsSUFBSUUsTUFBSjtBQUFXTixPQUFPQyxLQUFQLENBQWFDLFFBQVEsUUFBUixDQUFiLEVBQStCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDRSxhQUFPRixDQUFQO0FBQVM7O0FBQXJCLENBQS9CLEVBQXNELENBQXREOztBQUs5STs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBO0FBQ0EsTUFB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Ii8qIGVzbGludCBuby11c2UtYmVmb3JlLWRlZmluZTowICovXG4vKiBnbG9iYWxzIExvZyovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50Jztcbi8qXG5cdEFkZHMgbWlncmF0aW9uIGNhcGFiaWxpdGllcy4gTWlncmF0aW9ucyBhcmUgZGVmaW5lZCBsaWtlOlxuXG5cdE1pZ3JhdGlvbnMuYWRkKHtcblx0XHR1cDogZnVuY3Rpb24oKSB7fSwgLy8qcmVxdWlyZWQqIGNvZGUgdG8gcnVuIHRvIG1pZ3JhdGUgdXB3YXJkc1xuXHRcdHZlcnNpb246IDEsIC8vKnJlcXVpcmVkKiBudW1iZXIgdG8gaWRlbnRpZnkgbWlncmF0aW9uIG9yZGVyXG5cdFx0ZG93bjogZnVuY3Rpb24oKSB7fSwgLy8qb3B0aW9uYWwqIGNvZGUgdG8gcnVuIHRvIG1pZ3JhdGUgZG93bndhcmRzXG5cdFx0bmFtZTogJ1NvbWV0aGluZycgLy8qb3B0aW9uYWwqIGRpc3BsYXkgbmFtZSBmb3IgdGhlIG1pZ3JhdGlvblxuXHR9KTtcblxuXHRUaGUgb3JkZXJpbmcgb2YgbWlncmF0aW9ucyBpcyBkZXRlcm1pbmVkIGJ5IHRoZSB2ZXJzaW9uIHlvdSBzZXQuXG5cblx0VG8gcnVuIHRoZSBtaWdyYXRpb25zLCBzZXQgdGhlIE1JR1JBVEUgZW52aXJvbm1lbnQgdmFyaWFibGUgdG8gZWl0aGVyXG5cdCdsYXRlc3QnIG9yIHRoZSB2ZXJzaW9uIG51bWJlciB5b3Ugd2FudCB0byBtaWdyYXRlIHRvLiBPcHRpb25hbGx5LCBhcHBlbmRcblx0JyxleGl0JyBpZiB5b3Ugd2FudCB0aGUgbWlncmF0aW9ucyB0byBleGl0IHRoZSBtZXRlb3IgcHJvY2VzcywgZS5nIGlmIHlvdSdyZVxuXHRtaWdyYXRpbmcgZnJvbSBhIHNjcmlwdCAocmVtZW1iZXIgdG8gcGFzcyB0aGUgLS1vbmNlIHBhcmFtZXRlcikuXG5cblx0ZS5nOlxuXHRNSUdSQVRFPVwibGF0ZXN0XCIgbXJ0ICMgZW5zdXJlIHdlJ2xsIGJlIGF0IHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgcnVuIHRoZSBhcHBcblx0TUlHUkFURT1cImxhdGVzdCxleGl0XCIgbXJ0IC0tb25jZSAjIGVuc3VyZSB3ZSdsbCBiZSBhdCB0aGUgbGF0ZXN0IHZlcnNpb24gYW5kIGV4aXRcblx0TUlHUkFURT1cIjIsZXhpdFwiIG1ydCAtLW9uY2UgIyBtaWdyYXRlIHRvIHZlcnNpb24gMiBhbmQgZXhpdFxuXG5cdE5vdGU6IE1pZ3JhdGlvbnMgd2lsbCBsb2NrIGVuc3VyaW5nIG9ubHkgMSBhcHAgY2FuIGJlIG1pZ3JhdGluZyBhdCBvbmNlLiBJZlxuXHRhIG1pZ3JhdGlvbiBjcmFzaGVzLCB0aGUgY29udHJvbCByZWNvcmQgaW4gdGhlIG1pZ3JhdGlvbnMgY29sbGVjdGlvbiB3aWxsXG5cdHJlbWFpbiBsb2NrZWQgYW5kIGF0IHRoZSB2ZXJzaW9uIGl0IHdhcyBhdCBwcmV2aW91c2x5LCBob3dldmVyIHRoZSBkYiBjb3VsZFxuXHRiZSBpbiBhbiBpbmNvbnNpc3RhbnQgc3RhdGUuXG4qL1xuXG4vLyBzaW5jZSB3ZSdsbCBiZSBhdCB2ZXJzaW9uIDAgYnkgZGVmYXVsdCwgd2Ugc2hvdWxkIGhhdmUgYSBtaWdyYXRpb24gc2V0IGZvciBpdC5cbmNvbnN0IERlZmF1bHRNaWdyYXRpb24gPSB7XG5cdHZlcnNpb246IDAsXG5cdHVwKCkge1xuXHRcdC8vIEBUT0RPOiBjaGVjayBpZiBjb2xsZWN0aW9uIFwibWlncmF0aW9uc1wiIGV4aXN0XG5cdFx0Ly8gSWYgZXhpc3RzLCByZW5hbWUgYW5kIHJlcnVuIF9taWdyYXRlVG9cblx0fVxufTtcblxuY29uc3QgTWlncmF0aW9ucyA9IHRoaXMuTWlncmF0aW9ucyA9IHtcblx0X2xpc3Q6IFtEZWZhdWx0TWlncmF0aW9uXSxcblx0b3B0aW9uczoge1xuXHRcdC8vIGZhbHNlIGRpc2FibGVzIGxvZ2dpbmdcblx0XHRsb2c6IHRydWUsXG5cdFx0Ly8gbnVsbCBvciBhIGZ1bmN0aW9uXG5cdFx0bG9nZ2VyOiBudWxsLFxuXHRcdC8vIGVuYWJsZS9kaXNhYmxlIGluZm8gbG9nIFwiYWxyZWFkeSBhdCBsYXRlc3QuXCJcblx0XHRsb2dJZkxhdGVzdDogdHJ1ZSxcblx0XHQvLyBsb2NrIHdpbGwgYmUgdmFsaWQgZm9yIHRoaXMgYW1vdW50IG9mIG1pbnV0ZXNcblx0XHRsb2NrRXhwaXJhdGlvbjogNSxcblx0XHQvLyByZXRyeSBpbnRlcnZhbCBpbiBzZWNvbmRzXG5cdFx0cmV0cnlJbnRlcnZhbDogMTAsXG5cdFx0Ly8gbWF4IG51bWJlciBvZiBhdHRlbXB0cyB0byByZXRyeSB1bmxvY2tcblx0XHRtYXhBdHRlbXB0czogMzAsXG5cdFx0Ly8gbWlncmF0aW9ucyBjb2xsZWN0aW9uIG5hbWVcblx0XHRjb2xsZWN0aW9uTmFtZTogJ21pZ3JhdGlvbnMnXG5cdFx0Ly8gY29sbGVjdGlvbk5hbWU6IFwicm9ja2V0Y2hhdF9taWdyYXRpb25zXCJcblx0fSxcblx0Y29uZmlnKG9wdHMpIHtcblx0XHR0aGlzLm9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRzKTtcblx0fVxufTtcblxuTWlncmF0aW9ucy5fY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKE1pZ3JhdGlvbnMub3B0aW9ucy5jb2xsZWN0aW9uTmFtZSk7XG5cbi8qIENyZWF0ZSBhIGJveCBhcm91bmQgbWVzc2FnZXMgZm9yIGRpc3BsYXlpbmcgb24gYSBjb25zb2xlLmxvZyAqL1xuZnVuY3Rpb24gbWFrZUFCb3gobWVzc2FnZSwgY29sb3IgPSAncmVkJykge1xuXHRpZiAoIV8uaXNBcnJheShtZXNzYWdlKSkge1xuXHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnNwbGl0KCdcXG4nKTtcblx0fVxuXHRjb25zdCBsZW4gPSBfKG1lc3NhZ2UpLnJlZHVjZShmdW5jdGlvbihtZW1vLCBtc2cpIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgobWVtbywgbXNnLmxlbmd0aCk7XG5cdH0sIDApICsgNDtcblx0Y29uc3QgdGV4dCA9IG1lc3NhZ2UubWFwKChtc2cpID0+IHtcblx0XHRyZXR1cm4gJ3wnIFtjb2xvcl0gKyBzLmxycGFkKG1zZywgbGVuKVtjb2xvcl0gKyAnfCcgW2NvbG9yXTtcblx0fSkuam9pbignXFxuJyk7XG5cdGNvbnN0IHRvcExpbmUgPSAnKycgW2NvbG9yXSArIHMucGFkKCcnLCBsZW4sICctJylbY29sb3JdICsgJysnIFtjb2xvcl07XG5cdGNvbnN0IHNlcGFyYXRvciA9ICd8JyBbY29sb3JdICsgcy5wYWQoJycsIGxlbiwgJycpICsgJ3wnIFtjb2xvcl07XG5cdGNvbnN0IGJvdHRvbUxpbmUgPSAnKycgW2NvbG9yXSArIHMucGFkKCcnLCBsZW4sICctJylbY29sb3JdICsgJysnIFtjb2xvcl07XG5cdHJldHVybiBgXFxuJHsgdG9wTGluZSB9XFxuJHsgc2VwYXJhdG9yIH1cXG4keyB0ZXh0IH1cXG4keyBzZXBhcmF0b3IgfVxcbiR7IGJvdHRvbUxpbmUgfVxcbmA7XG59XG5cbi8qXG5cdExvZ2dlciBmYWN0b3J5IGZ1bmN0aW9uLiBUYWtlcyBhIHByZWZpeCBzdHJpbmcgYW5kIG9wdGlvbnMgb2JqZWN0XG5cdGFuZCB1c2VzIGFuIGluamVjdGVkIGBsb2dnZXJgIGlmIHByb3ZpZGVkLCBlbHNlIGZhbGxzIGJhY2sgdG9cblx0TWV0ZW9yJ3MgYExvZ2AgcGFja2FnZS5cblx0V2lsbCBzZW5kIGEgbG9nIG9iamVjdCB0byB0aGUgaW5qZWN0ZWQgbG9nZ2VyLCBvbiB0aGUgZm9sbG93aW5nIGZvcm06XG5cdFx0bWVzc2FnZTogU3RyaW5nXG5cdFx0bGV2ZWw6IFN0cmluZyAoaW5mbywgd2FybiwgZXJyb3IsIGRlYnVnKVxuXHRcdHRhZzogJ01pZ3JhdGlvbnMnXG4qL1xuZnVuY3Rpb24gY3JlYXRlTG9nZ2VyKHByZWZpeCkge1xuXHRjaGVjayhwcmVmaXgsIFN0cmluZyk7XG5cblx0Ly8gUmV0dXJuIG5vb3AgaWYgbG9nZ2luZyBpcyBkaXNhYmxlZC5cblx0aWYgKE1pZ3JhdGlvbnMub3B0aW9ucy5sb2cgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCkge307XG5cdH1cblxuXHRyZXR1cm4gZnVuY3Rpb24obGV2ZWwsIG1lc3NhZ2UpIHtcblx0XHRjaGVjayhsZXZlbCwgTWF0Y2guT25lT2YoJ2luZm8nLCAnZXJyb3InLCAnd2FybicsICdkZWJ1ZycpKTtcblx0XHRjaGVjayhtZXNzYWdlLCBNYXRjaC5PbmVPZihTdHJpbmcsIFtTdHJpbmddKSk7XG5cblx0XHRjb25zdCBsb2dnZXIgPSBNaWdyYXRpb25zLm9wdGlvbnMgJiYgTWlncmF0aW9ucy5vcHRpb25zLmxvZ2dlcjtcblxuXHRcdGlmIChsb2dnZXIgJiYgXy5pc0Z1bmN0aW9uKGxvZ2dlcikpIHtcblxuXHRcdFx0bG9nZ2VyKHtcblx0XHRcdFx0bGV2ZWwsXG5cdFx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRcdHRhZzogcHJlZml4XG5cdFx0XHR9KTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRMb2dbbGV2ZWxdKHtcblx0XHRcdFx0bWVzc2FnZTogYCR7IHByZWZpeCB9OiAkeyBtZXNzYWdlIH1gXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59XG5cbi8vIGNvbGxlY3Rpb24gaG9sZGluZyB0aGUgY29udHJvbCByZWNvcmRcblxuY29uc3QgbG9nID0gY3JlYXRlTG9nZ2VyKCdNaWdyYXRpb25zJyk7XG5cblsnaW5mbycsICd3YXJuJywgJ2Vycm9yJywgJ2RlYnVnJ10uZm9yRWFjaChmdW5jdGlvbihsZXZlbCkge1xuXHRsb2dbbGV2ZWxdID0gXy5wYXJ0aWFsKGxvZywgbGV2ZWwpO1xufSk7XG5cbi8vIGlmIChwcm9jZXNzLmVudi5NSUdSQVRFKVxuLy8gICBNaWdyYXRpb25zLm1pZ3JhdGVUbyhwcm9jZXNzLmVudi5NSUdSQVRFKTtcblxuLy8gQWRkIGEgbmV3IG1pZ3JhdGlvbjpcbi8vIHt1cDogZnVuY3Rpb24gKnJlcXVpcmVkXG4vLyAgdmVyc2lvbjogTnVtYmVyICpyZXF1aXJlZFxuLy8gIGRvd246IGZ1bmN0aW9uICpvcHRpb25hbFxuLy8gIG5hbWU6IFN0cmluZyAqb3B0aW9uYWxcbi8vIH1cbk1pZ3JhdGlvbnMuYWRkID0gZnVuY3Rpb24obWlncmF0aW9uKSB7XG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnVwICE9PSAnZnVuY3Rpb24nKSB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ01pZ3JhdGlvbiBtdXN0IHN1cHBseSBhbiB1cCBmdW5jdGlvbi4nKTsgfVxuXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnZlcnNpb24gIT09ICdudW1iZXInKSB7IHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ01pZ3JhdGlvbiBtdXN0IHN1cHBseSBhIHZlcnNpb24gbnVtYmVyLicpOyB9XG5cblx0aWYgKG1pZ3JhdGlvbi52ZXJzaW9uIDw9IDApIHsgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignTWlncmF0aW9uIHZlcnNpb24gbXVzdCBiZSBncmVhdGVyIHRoYW4gMCcpOyB9XG5cblx0Ly8gRnJlZXplIHRoZSBtaWdyYXRpb24gb2JqZWN0IHRvIG1ha2UgaXQgaGVyZWFmdGVyIGltbXV0YWJsZVxuXHRPYmplY3QuZnJlZXplKG1pZ3JhdGlvbik7XG5cblx0dGhpcy5fbGlzdC5wdXNoKG1pZ3JhdGlvbik7XG5cdHRoaXMuX2xpc3QgPSBfLnNvcnRCeSh0aGlzLl9saXN0LCBmdW5jdGlvbihtKSB7XG5cdFx0cmV0dXJuIG0udmVyc2lvbjtcblx0fSk7XG59O1xuXG4vLyBBdHRlbXB0cyB0byBydW4gdGhlIG1pZ3JhdGlvbnMgdXNpbmcgY29tbWFuZCBpbiB0aGUgZm9ybSBvZjpcbi8vIGUuZyAnbGF0ZXN0JywgJ2xhdGVzdCxleGl0JywgMlxuLy8gdXNlICdYWCxyZXJ1bicgdG8gcmUtcnVuIHRoZSBtaWdyYXRpb24gYXQgdGhhdCB2ZXJzaW9uXG5NaWdyYXRpb25zLm1pZ3JhdGVUbyA9IGZ1bmN0aW9uKGNvbW1hbmQpIHtcblx0aWYgKF8uaXNVbmRlZmluZWQoY29tbWFuZCkgfHwgY29tbWFuZCA9PT0gJycgfHwgdGhpcy5fbGlzdC5sZW5ndGggPT09IDApIHsgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgbWlncmF0ZSB1c2luZyBpbnZhbGlkIGNvbW1hbmQ6ICR7IGNvbW1hbmQgfWApOyB9XG5cblx0bGV0IHZlcnNpb247XG5cdGxldCBzdWJjb21tYW5kO1xuXHRpZiAodHlwZW9mIGNvbW1hbmQgPT09ICdudW1iZXInKSB7XG5cdFx0dmVyc2lvbiA9IGNvbW1hbmQ7XG5cdH0gZWxzZSB7XG5cdFx0dmVyc2lvbiA9IGNvbW1hbmQuc3BsaXQoJywnKVswXTtcblx0XHRzdWJjb21tYW5kID0gY29tbWFuZC5zcGxpdCgnLCcpWzFdO1xuXHR9XG5cblx0Y29uc3QgbWF4QXR0ZW1wdHMgPSBNaWdyYXRpb25zLm9wdGlvbnMubWF4QXR0ZW1wdHM7XG5cdGNvbnN0IHJldHJ5SW50ZXJ2YWwgPSBNaWdyYXRpb25zLm9wdGlvbnMucmV0cnlJbnRlcnZhbDtcblx0bGV0IG1pZ3JhdGVkO1xuXHRmb3IgKGxldCBhdHRlbXB0cyA9IDE7IGF0dGVtcHRzIDw9IG1heEF0dGVtcHRzOyBhdHRlbXB0cysrKSB7XG5cdFx0aWYgKHZlcnNpb24gPT09ICdsYXRlc3QnKSB7XG5cdFx0XHRtaWdyYXRlZCA9IHRoaXMuX21pZ3JhdGVUbyhfLmxhc3QodGhpcy5fbGlzdCkudmVyc2lvbik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1pZ3JhdGVkID0gdGhpcy5fbWlncmF0ZVRvKHBhcnNlSW50KHZlcnNpb24pLCAoc3ViY29tbWFuZCA9PT0gJ3JlcnVuJykpO1xuXHRcdH1cblx0XHRpZiAobWlncmF0ZWQpIHtcblx0XHRcdGJyZWFrO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZXQgd2lsbFJldHJ5O1xuXHRcdFx0aWYgKGF0dGVtcHRzIDwgbWF4QXR0ZW1wdHMpIHtcblx0XHRcdFx0d2lsbFJldHJ5ID0gYCBUcnlpbmcgYWdhaW4gaW4gJHsgcmV0cnlJbnRlcnZhbCB9IHNlY29uZHMuYDtcblx0XHRcdFx0TWV0ZW9yLl9zbGVlcEZvck1zKHJldHJ5SW50ZXJ2YWwgKiAxMDAwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdpbGxSZXRyeSA9ICcnO1xuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS5sb2coYE5vdCBtaWdyYXRpbmcsIGNvbnRyb2wgaXMgbG9ja2VkLiBBdHRlbXB0ICR7IGF0dGVtcHRzIH0vJHsgbWF4QXR0ZW1wdHMgfS4keyB3aWxsUmV0cnkgfWAueWVsbG93KTtcblx0XHR9XG5cdH1cblx0aWYgKCFtaWdyYXRlZCkge1xuXHRcdGNvbnN0IGNvbnRyb2wgPSB0aGlzLl9nZXRDb250cm9sKCk7IC8vIFNpZGUgZWZmZWN0OiB1cHNlcnRzIGNvbnRyb2wgZG9jdW1lbnQuXG5cdFx0Y29uc29sZS5sb2cobWFrZUFCb3goW1xuXHRcdFx0J0VSUk9SISBTRVJWRVIgU1RPUFBFRCcsXG5cdFx0XHQnJyxcblx0XHRcdCdZb3VyIGRhdGFiYXNlIG1pZ3JhdGlvbiBjb250cm9sIGlzIGxvY2tlZC4nLFxuXHRcdFx0J1BsZWFzZSBtYWtlIHN1cmUgeW91IGFyZSBydW5uaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgdHJ5IGFnYWluLicsXG5cdFx0XHQnSWYgdGhlIHByb2JsZW0gcGVyc2lzdHMsIHBsZWFzZSBjb250YWN0IHN1cHBvcnQuJyxcblx0XHRcdCcnLFxuXHRcdFx0YFRoaXMgUm9ja2V0LkNoYXQgdmVyc2lvbjogJHsgUm9ja2V0Q2hhdC5JbmZvLnZlcnNpb24gfWAsXG5cdFx0XHRgRGF0YWJhc2UgbG9ja2VkIGF0IHZlcnNpb246ICR7IGNvbnRyb2wudmVyc2lvbiB9YCxcblx0XHRcdGBEYXRhYmFzZSB0YXJnZXQgdmVyc2lvbjogJHsgdmVyc2lvbiA9PT0gJ2xhdGVzdCcgPyBfLmxhc3QodGhpcy5fbGlzdCkudmVyc2lvbiA6IHZlcnNpb24gfWAsXG5cdFx0XHQnJyxcblx0XHRcdGBDb21taXQ6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQuaGFzaCB9YCxcblx0XHRcdGBEYXRlOiAkeyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmRhdGUgfWAsXG5cdFx0XHRgQnJhbmNoOiAkeyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmJyYW5jaCB9YCxcblx0XHRcdGBUYWc6ICR7IFJvY2tldENoYXQuSW5mby5jb21taXQudGFnIH1gXG5cdFx0XSkpO1xuXHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0fVxuXG5cdC8vIHJlbWVtYmVyIHRvIHJ1biBtZXRlb3Igd2l0aCAtLW9uY2Ugb3RoZXJ3aXNlIGl0IHdpbGwgcmVzdGFydFxuXHRpZiAoc3ViY29tbWFuZCA9PT0gJ2V4aXQnKSB7IHByb2Nlc3MuZXhpdCgwKTsgfVxufTtcblxuLy8ganVzdCByZXR1cm5zIHRoZSBjdXJyZW50IHZlcnNpb25cbk1pZ3JhdGlvbnMuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fZ2V0Q29udHJvbCgpLnZlcnNpb247XG59O1xuXG4vLyBtaWdyYXRlcyB0byB0aGUgc3BlY2lmaWMgdmVyc2lvbiBwYXNzZWQgaW5cbk1pZ3JhdGlvbnMuX21pZ3JhdGVUbyA9IGZ1bmN0aW9uKHZlcnNpb24sIHJlcnVuKSB7XG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXHRjb25zdCBjb250cm9sID0gdGhpcy5fZ2V0Q29udHJvbCgpOyAvLyBTaWRlIGVmZmVjdDogdXBzZXJ0cyBjb250cm9sIGRvY3VtZW50LlxuXHRsZXQgY3VycmVudFZlcnNpb24gPSBjb250cm9sLnZlcnNpb247XG5cblx0aWYgKGxvY2soKSA9PT0gZmFsc2UpIHtcblx0XHQvLyBsb2cuaW5mbygnTm90IG1pZ3JhdGluZywgY29udHJvbCBpcyBsb2NrZWQuJyk7XG5cdFx0Ly8gV2FybmluZ1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGlmIChyZXJ1bikge1xuXHRcdGxvZy5pbmZvKGBSZXJ1bm5pbmcgdmVyc2lvbiAkeyB2ZXJzaW9uIH1gKTtcblx0XHRtaWdyYXRlKCd1cCcsIHRoaXMuX2ZpbmRJbmRleEJ5VmVyc2lvbih2ZXJzaW9uKSk7XG5cdFx0bG9nLmluZm8oJ0ZpbmlzaGVkIG1pZ3JhdGluZy4nKTtcblx0XHR1bmxvY2soKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdGlmIChjdXJyZW50VmVyc2lvbiA9PT0gdmVyc2lvbikge1xuXHRcdGlmICh0aGlzLm9wdGlvbnMubG9nSWZMYXRlc3QpIHtcblx0XHRcdGxvZy5pbmZvKGBOb3QgbWlncmF0aW5nLCBhbHJlYWR5IGF0IHZlcnNpb24gJHsgdmVyc2lvbiB9YCk7XG5cdFx0fVxuXHRcdHVubG9jaygpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0Y29uc3Qgc3RhcnRJZHggPSB0aGlzLl9maW5kSW5kZXhCeVZlcnNpb24oY3VycmVudFZlcnNpb24pO1xuXHRjb25zdCBlbmRJZHggPSB0aGlzLl9maW5kSW5kZXhCeVZlcnNpb24odmVyc2lvbik7XG5cblx0Ly8gbG9nLmluZm8oJ3N0YXJ0SWR4OicgKyBzdGFydElkeCArICcgZW5kSWR4OicgKyBlbmRJZHgpO1xuXHRsb2cuaW5mbyhgTWlncmF0aW5nIGZyb20gdmVyc2lvbiAkeyB0aGlzLl9saXN0W3N0YXJ0SWR4XS52ZXJzaW9uIH0gLT4gJHsgdGhpcy5fbGlzdFtlbmRJZHhdLnZlcnNpb24gfWApO1xuXG5cdC8vIHJ1biB0aGUgYWN0dWFsIG1pZ3JhdGlvblxuXHRmdW5jdGlvbiBtaWdyYXRlKGRpcmVjdGlvbiwgaWR4KSB7XG5cdFx0Y29uc3QgbWlncmF0aW9uID0gc2VsZi5fbGlzdFtpZHhdO1xuXG5cdFx0aWYgKHR5cGVvZiBtaWdyYXRpb25bZGlyZWN0aW9uXSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dW5sb2NrKCk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGBDYW5ub3QgbWlncmF0ZSAkeyBkaXJlY3Rpb24gfSBvbiB2ZXJzaW9uICR7IG1pZ3JhdGlvbi52ZXJzaW9uIH1gKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBtYXliZU5hbWUoKSB7XG5cdFx0XHRyZXR1cm4gbWlncmF0aW9uLm5hbWUgPyBgICgkeyBtaWdyYXRpb24ubmFtZSB9KWAgOiAnJztcblx0XHR9XG5cblx0XHRsb2cuaW5mbyhgUnVubmluZyAkeyBkaXJlY3Rpb24gfSgpIG9uIHZlcnNpb24gJHsgbWlncmF0aW9uLnZlcnNpb24gfSR7IG1heWJlTmFtZSgpIH1gKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRtaWdyYXRpb25bZGlyZWN0aW9uXShtaWdyYXRpb24pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUubG9nKG1ha2VBQm94KFtcblx0XHRcdFx0J0VSUk9SISBTRVJWRVIgU1RPUFBFRCcsXG5cdFx0XHRcdCcnLFxuXHRcdFx0XHQnWW91ciBkYXRhYmFzZSBtaWdyYXRpb24gZmFpbGVkOicsXG5cdFx0XHRcdGUubWVzc2FnZSxcblx0XHRcdFx0JycsXG5cdFx0XHRcdCdQbGVhc2UgbWFrZSBzdXJlIHlvdSBhcmUgcnVubmluZyB0aGUgbGF0ZXN0IHZlcnNpb24gYW5kIHRyeSBhZ2Fpbi4nLFxuXHRcdFx0XHQnSWYgdGhlIHByb2JsZW0gcGVyc2lzdHMsIHBsZWFzZSBjb250YWN0IHN1cHBvcnQuJyxcblx0XHRcdFx0JycsXG5cdFx0XHRcdGBUaGlzIFJvY2tldC5DaGF0IHZlcnNpb246ICR7IFJvY2tldENoYXQuSW5mby52ZXJzaW9uIH1gLFxuXHRcdFx0XHRgRGF0YWJhc2UgbG9ja2VkIGF0IHZlcnNpb246ICR7IGNvbnRyb2wudmVyc2lvbiB9YCxcblx0XHRcdFx0YERhdGFiYXNlIHRhcmdldCB2ZXJzaW9uOiAkeyB2ZXJzaW9uIH1gLFxuXHRcdFx0XHQnJyxcblx0XHRcdFx0YENvbW1pdDogJHsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC5oYXNoIH1gLFxuXHRcdFx0XHRgRGF0ZTogJHsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC5kYXRlIH1gLFxuXHRcdFx0XHRgQnJhbmNoOiAkeyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmJyYW5jaCB9YCxcblx0XHRcdFx0YFRhZzogJHsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC50YWcgfWBcblx0XHRcdF0pKTtcblx0XHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm5zIHRydWUgaWYgbG9jayB3YXMgYWNxdWlyZWQuXG5cdGZ1bmN0aW9uIGxvY2soKSB7XG5cdFx0Y29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0Y29uc3QgZGF0ZU1pbnVzSW50ZXJ2YWwgPSBtb21lbnQoZGF0ZSkuc3VidHJhY3Qoc2VsZi5vcHRpb25zLmxvY2tFeHBpcmF0aW9uLCAnbWludXRlcycpLnRvRGF0ZSgpO1xuXHRcdGNvbnN0IGJ1aWxkID0gUm9ja2V0Q2hhdC5JbmZvID8gUm9ja2V0Q2hhdC5JbmZvLmJ1aWxkLmRhdGUgOiBkYXRlO1xuXG5cdFx0Ly8gVGhpcyBpcyBhdG9taWMuIFRoZSBzZWxlY3RvciBlbnN1cmVzIG9ubHkgb25lIGNhbGxlciBhdCBhIHRpbWUgd2lsbCBzZWVcblx0XHQvLyB0aGUgdW5sb2NrZWQgY29udHJvbCwgYW5kIGxvY2tpbmcgb2NjdXJzIGluIHRoZSBzYW1lIHVwZGF0ZSdzIG1vZGlmaWVyLlxuXHRcdC8vIEFsbCBvdGhlciBzaW11bHRhbmVvdXMgY2FsbGVycyB3aWxsIGdldCBmYWxzZSBiYWNrIGZyb20gdGhlIHVwZGF0ZS5cblx0XHRyZXR1cm4gc2VsZi5fY29sbGVjdGlvbi51cGRhdGUoe1xuXHRcdFx0X2lkOiAnY29udHJvbCcsXG5cdFx0XHQkb3I6IFt7XG5cdFx0XHRcdGxvY2tlZDogZmFsc2Vcblx0XHRcdH0sIHtcblx0XHRcdFx0bG9ja2VkQXQ6IHtcblx0XHRcdFx0XHQkbHQ6IGRhdGVNaW51c0ludGVydmFsXG5cdFx0XHRcdH1cblx0XHRcdH0sIHtcblx0XHRcdFx0YnVpbGRBdDoge1xuXHRcdFx0XHRcdCRuZTogYnVpbGRcblx0XHRcdFx0fVxuXHRcdFx0fV1cblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGxvY2tlZDogdHJ1ZSxcblx0XHRcdFx0bG9ja2VkQXQ6IGRhdGUsXG5cdFx0XHRcdGJ1aWxkQXQ6IGJ1aWxkXG5cdFx0XHR9XG5cdFx0fSkgPT09IDE7XG5cdH1cblxuXG5cdC8vIFNpZGUgZWZmZWN0OiBzYXZlcyB2ZXJzaW9uLlxuXHRmdW5jdGlvbiB1bmxvY2soKSB7XG5cdFx0c2VsZi5fc2V0Q29udHJvbCh7XG5cdFx0XHRsb2NrZWQ6IGZhbHNlLFxuXHRcdFx0dmVyc2lvbjogY3VycmVudFZlcnNpb25cblx0XHR9KTtcblx0fVxuXG5cdGlmIChjdXJyZW50VmVyc2lvbiA8IHZlcnNpb24pIHtcblx0XHRmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCBlbmRJZHg7IGkrKykge1xuXHRcdFx0bWlncmF0ZSgndXAnLCBpICsgMSk7XG5cdFx0XHRjdXJyZW50VmVyc2lvbiA9IHNlbGYuX2xpc3RbaSArIDFdLnZlcnNpb247XG5cdFx0XHRzZWxmLl9zZXRDb250cm9sKHtcblx0XHRcdFx0bG9ja2VkOiB0cnVlLFxuXHRcdFx0XHR2ZXJzaW9uOiBjdXJyZW50VmVyc2lvblxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA+IGVuZElkeDsgaS0tKSB7XG5cdFx0XHRtaWdyYXRlKCdkb3duJywgaSk7XG5cdFx0XHRjdXJyZW50VmVyc2lvbiA9IHNlbGYuX2xpc3RbaSAtIDFdLnZlcnNpb247XG5cdFx0XHRzZWxmLl9zZXRDb250cm9sKHtcblx0XHRcdFx0bG9ja2VkOiB0cnVlLFxuXHRcdFx0XHR2ZXJzaW9uOiBjdXJyZW50VmVyc2lvblxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0dW5sb2NrKCk7XG5cdGxvZy5pbmZvKCdGaW5pc2hlZCBtaWdyYXRpbmcuJyk7XG59O1xuXG4vLyBnZXRzIHRoZSBjdXJyZW50IGNvbnRyb2wgcmVjb3JkLCBvcHRpb25hbGx5IGNyZWF0aW5nIGl0IGlmIG5vbi1leGlzdGFudFxuTWlncmF0aW9ucy5fZ2V0Q29udHJvbCA9IGZ1bmN0aW9uKCkge1xuXHRjb25zdCBjb250cm9sID0gdGhpcy5fY29sbGVjdGlvbi5maW5kT25lKHtcblx0XHRfaWQ6ICdjb250cm9sJ1xuXHR9KTtcblxuXHRyZXR1cm4gY29udHJvbCB8fCB0aGlzLl9zZXRDb250cm9sKHtcblx0XHR2ZXJzaW9uOiAwLFxuXHRcdGxvY2tlZDogZmFsc2Vcblx0fSk7XG59O1xuXG4vLyBzZXRzIHRoZSBjb250cm9sIHJlY29yZFxuTWlncmF0aW9ucy5fc2V0Q29udHJvbCA9IGZ1bmN0aW9uKGNvbnRyb2wpIHtcblx0Ly8gYmUgcXVpdGUgc3RyaWN0XG5cdGNoZWNrKGNvbnRyb2wudmVyc2lvbiwgTnVtYmVyKTtcblx0Y2hlY2soY29udHJvbC5sb2NrZWQsIEJvb2xlYW4pO1xuXG5cdHRoaXMuX2NvbGxlY3Rpb24udXBkYXRlKHtcblx0XHRfaWQ6ICdjb250cm9sJ1xuXHR9LCB7XG5cdFx0JHNldDoge1xuXHRcdFx0dmVyc2lvbjogY29udHJvbC52ZXJzaW9uLFxuXHRcdFx0bG9ja2VkOiBjb250cm9sLmxvY2tlZFxuXHRcdH1cblx0fSwge1xuXHRcdHVwc2VydDogdHJ1ZVxuXHR9KTtcblxuXHRyZXR1cm4gY29udHJvbDtcbn07XG5cbi8vIHJldHVybnMgdGhlIG1pZ3JhdGlvbiBpbmRleCBpbiBfbGlzdCBvciB0aHJvd3MgaWYgbm90IGZvdW5kXG5NaWdyYXRpb25zLl9maW5kSW5kZXhCeVZlcnNpb24gPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbGlzdC5sZW5ndGg7IGkrKykge1xuXHRcdGlmICh0aGlzLl9saXN0W2ldLnZlcnNpb24gPT09IHZlcnNpb24pIHsgcmV0dXJuIGk7IH1cblx0fVxuXG5cdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoYENhbid0IGZpbmQgbWlncmF0aW9uIHZlcnNpb24gJHsgdmVyc2lvbiB9YCk7XG59O1xuXG4vL3Jlc2V0IChtYWlubHkgaW50ZW5kZWQgZm9yIHRlc3RzKVxuTWlncmF0aW9ucy5fcmVzZXQgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fbGlzdCA9IFt7XG5cdFx0dmVyc2lvbjogMCxcblx0XHR1cCgpIHt9XG5cdH1dO1xuXHR0aGlzLl9jb2xsZWN0aW9uLnJlbW92ZSh7fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lk1pZ3JhdGlvbnMgPSBNaWdyYXRpb25zO1xuIl19
