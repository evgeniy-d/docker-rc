(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MeteorX = Package['meteorhacks:meteorx'].MeteorX;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var EJSON = Package.ejson.EJSON;
var DDPCommon = Package['ddp-common'].DDPCommon;
var _ = Package.underscore._;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var Email = Package.email.Email;
var EmailInternals = Package.email.EmailInternals;
var Random = Package.random.Random;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var Kadira, BaseErrorModel, Retry, HaveAsyncCallback, UniqueId, DefaultUniqueId, OptimizedApply, Ntp, WaitTimeBuilder, OplogCheck, Tracer, TracerStore, KadiraModel, MethodsModel, PubsubModel, collectionName, SystemModel, ErrorModel, DocSzCache, DocSzCacheItem, wrapServer, wrapSession, wrapSubscription, wrapOplogObserveDriver, wrapPollingObserveDriver, wrapMultiplexer, wrapForCountingObservers, wrapStringifyDDP, hijackDBOps, TrackUncaughtExceptions, TrackMeteorDebug, setLabels;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/common/unify.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Kadira = {};
Kadira.options = {};

if(Meteor.wrapAsync) {
  Kadira._wrapAsync = Meteor.wrapAsync;
} else {
  Kadira._wrapAsync = Meteor._wrapAsync;
}

if(Meteor.isServer) {
  var EventEmitter = Npm.require('events').EventEmitter;
  var eventBus = new EventEmitter();
  eventBus.setMaxListeners(0);

  var buildArgs = function(args) {
    args = _.toArray(args);
    var eventName = args[0] + '-' + args[1];
    var args = args.slice(2);
    args.unshift(eventName);
    return args;
  };
  
  Kadira.EventBus = {};
  _.each(['on', 'emit', 'removeListener', 'removeAllListeners'], function(m) {
    Kadira.EventBus[m] = function() {
      var args = buildArgs(arguments);
      return eventBus[m].apply(eventBus, args);
    };
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/models/base_error.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
BaseErrorModel = function(options) {
  this._filters = [];
};

BaseErrorModel.prototype.addFilter = function(filter) {
  if(typeof filter === 'function') {
    this._filters.push(filter);
  } else {
    throw new Error("Error filter must be a function");
  }
};

BaseErrorModel.prototype.removeFilter = function(filter) {
  var index = this._filters.indexOf(filter);
  if(index >= 0) {
    this._filters.splice(index, 1);
  }
};

BaseErrorModel.prototype.applyFilters = function(type, message, error, subType) {
  for(var lc=0; lc<this._filters.length; lc++) {
    var filter = this._filters[lc];
    try {
      var validated = filter(type, message, error, subType);
      if(!validated) return false;
    } catch (ex) {
      // we need to remove this filter
      // we may ended up in a error cycle
      this._filters.splice(lc, 1);
      throw new Error("an error thrown from a filter you've suplied", ex.message);
    }
  }

  return true;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/jobs.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Jobs = Kadira.Jobs = {};

Jobs.getAsync = function(id, callback) {
  Kadira.coreApi.getJob(id)
    .then(function(data) {
      callback(null, data);
    })
    .catch(function(err) {
      callback(err)
    });
};


Jobs.setAsync = function(id, changes, callback) {
  Kadira.coreApi.updateJob(id, changes)
    .then(function(data) {
      callback(null, data);
    })
    .catch(function(err) {
      callback(err)
    });
};

Jobs.set = Kadira._wrapAsync(Jobs.setAsync);
Jobs.get = Kadira._wrapAsync(Jobs.getAsync);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/retry.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Retry logic with an exponential backoff.
//
// options:
//  baseTimeout: time for initial reconnect attempt (ms).
//  exponent: exponential factor to increase timeout each attempt.
//  maxTimeout: maximum time between retries (ms).
//  minCount: how many times to reconnect "instantly".
//  minTimeout: time to wait for the first `minCount` retries (ms).
//  fuzz: factor to randomize retry times by (to avoid retry storms).

//TODO: remove this class and use Meteor Retry in a later version of meteor.

Retry = function (options) {
  var self = this;
  _.extend(self, _.defaults(_.clone(options || {}), {
    baseTimeout: 1000, // 1 second
    exponent: 2.2,
    // The default is high-ish to ensure a server can recover from a
    // failure caused by load.
    maxTimeout: 5 * 60000, // 5 minutes
    minTimeout: 10,
    minCount: 2,
    fuzz: 0.5 // +- 25%
  }));
  self.retryTimer = null;
};

_.extend(Retry.prototype, {

  // Reset a pending retry, if any.
  clear: function () {
    var self = this;
    if(self.retryTimer)
      clearTimeout(self.retryTimer);
    self.retryTimer = null;
  },

  // Calculate how long to wait in milliseconds to retry, based on the
  // `count` of which retry this is.
  _timeout: function (count) {
    var self = this;

    if(count < self.minCount)
      return self.minTimeout;

    var timeout = Math.min(
      self.maxTimeout,
      self.baseTimeout * Math.pow(self.exponent, count));
    // fuzz the timeout randomly, to avoid reconnect storms when a
    // server goes down.
    timeout = timeout * ((Random.fraction() * self.fuzz) +
                         (1 - self.fuzz/2));
    return Math.ceil(timeout);
  },

  // Call `fn` after a delay, based on the `count` of which retry this is.
  retryLater: function (count, fn) {
    var self = this;
    var timeout = self._timeout(count);
    if(self.retryTimer)
      clearTimeout(self.retryTimer);

    self.retryTimer = setTimeout(fn, timeout);
    return timeout;
  }

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/utils.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');

HaveAsyncCallback = function(args) {
  var lastArg = args[args.length -1];
  return (typeof lastArg) == 'function';
};

UniqueId = function(start) {
  this.id = 0;
}

UniqueId.prototype.get = function() {
  return "" + this.id++;
};

DefaultUniqueId = new UniqueId();

// Optimized version of apply which tries to call as possible as it can
// Then fall back to apply
// This is because, v8 is very slow to invoke apply.
OptimizedApply = function OptimizedApply(context, fn, args) {
  var a = args;
  switch(a.length) {
    case 0:
      return fn.call(context);
    case 1:
      return fn.call(context, a[0]);
    case 2:
      return fn.call(context, a[0], a[1]);
    case 3:
      return fn.call(context, a[0], a[1], a[2]);
    case 4:
      return fn.call(context, a[0], a[1], a[2], a[3]);
    case 5:
      return fn.call(context, a[0], a[1], a[2], a[3], a[4]);
    default:
      return fn.apply(context, a);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/ntp.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = getLogger();

Ntp = function (endpoint) {
  this.setEndpoint(endpoint);
  this.diff = 0;
  this.synced = false;
  this.reSyncCount = 0;
  this.reSync = new Retry({
    baseTimeout: 1000*60,
    maxTimeout: 1000*60*10,
    minCount: 0
  });
}

Ntp._now = function() {
  var now = Date.now();
  if(typeof now == 'number') {
    return now;
  } else if(now instanceof Date) {
    // some extenal JS libraries override Date.now and returns a Date object
    // which directly affect us. So we need to prepare for that
    return now.getTime();
  } else {
    // trust me. I've seen now === undefined
    return (new Date()).getTime();
  }
};

Ntp.prototype.setEndpoint = function(endpoint) {
  this.endpoint = endpoint + '/simplentp/sync';
};

Ntp.prototype.getTime = function() {
  return Ntp._now() + Math.round(this.diff);
};

Ntp.prototype.syncTime = function(localTime) {
  return localTime + Math.ceil(this.diff);
};

Ntp.prototype.sync = function() {
  logger('init sync');
  var self = this;
  var retryCount = 0;
  var retry = new Retry({
    baseTimeout: 1000*20,
    maxTimeout: 1000*60,
    minCount: 1,
    minTimeout: 0
  });
  syncTime();

  function syncTime () {
    if(retryCount<5) {
      logger('attempt time sync with server', retryCount);
      // if we send 0 to the retryLater, cacheDns will run immediately
      retry.retryLater(retryCount++, cacheDns);
    } else {
      logger('maximum retries reached');
      self.reSync.retryLater(self.reSyncCount++, function () {
        var args = [].slice.call(arguments);
        self.sync.apply(self, args);
      });
    }
  }

  // first attempt is to cache dns. So, calculation does not
  // include DNS resolution time
  function cacheDns () {
    self.getServerTime(function(err) {
      if(!err) {
        calculateTimeDiff();
      } else {
        syncTime();
      }
    });
  }

  function calculateTimeDiff () {
    var clientStartTime = (new Date()).getTime();
    self.getServerTime(function(err, serverTime) {
      if(!err && serverTime) {
        // (Date.now() + clientStartTime)/2 : Midpoint between req and res
        var networkTime = ((new Date()).getTime() - clientStartTime)/2
        var serverStartTime = serverTime - networkTime;
        self.diff = serverStartTime - clientStartTime;
        self.synced = true;
        // we need to send 1 into retryLater.
        self.reSync.retryLater(self.reSyncCount++, function () {
          var args = [].slice.call(arguments);
          self.sync.apply(self, args);
        });
        logger('successfully updated diff value', self.diff);
      } else {
        syncTime();
      }
    });
  }
}

Ntp.prototype.getServerTime = function(callback) {
  var self = this;

  if(Meteor.isServer) {
    var Fiber = Npm.require('fibers');
    new Fiber(function() {
      HTTP.get(self.endpoint, function (err, res) {
        if(err) {
          callback(err);
        } else {
          var serverTime = parseInt(res.content)
          callback(null, serverTime);
        }
      });
    }).run();
  } else {
    $.ajax({
      type: 'GET',
      url: self.endpoint,
      success: function(serverTime) {
        callback(null, parseInt(serverTime));
      },
      error: function(err) {
        callback(err);
      }
    });
  }
};

function getLogger() {
  if(Meteor.isServer) {
    return Npm.require('debug')("kadira:ntp");
  } else {
    return function(message) {
      var canLogKadira =
        Meteor._localStorage.getItem('LOG_KADIRA') !== null
        && typeof console !== 'undefined';

      if(canLogKadira) {
        if(message) {
          message = "kadira:ntp " + message;
          arguments[0] = message;
        }
        console.log.apply(console, arguments);
      }
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/wait_time_builder.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var WAITON_MESSAGE_FIELDS = ['msg', 'id', 'method', 'name', 'waitTime'];

// This is way how we can build waitTime and it's breakdown
WaitTimeBuilder = function() {
  this._waitListStore = {};
  this._currentProcessingMessages = {};
  this._messageCache = {};
};

WaitTimeBuilder.prototype.register = function(session, msgId) {
  var self = this;
  var mainKey = self._getMessageKey(session.id, msgId);

  var inQueue = session.inQueue || [];
  if(typeof inQueue.toArray === 'function') {
    // latest version of Meteor uses a double-ended-queue for the inQueue
    // info: https://www.npmjs.com/package/double-ended-queue
    inQueue = inQueue.toArray();
  }

  var waitList = inQueue.map(function(msg) {
    var key = self._getMessageKey(session.id, msg.id);
    return self._getCacheMessage(key, msg);
  });

  waitList = waitList || [];

  //add currently processing ddp message if exists
  var currentlyProcessingMessage = this._currentProcessingMessages[session.id];
  if(currentlyProcessingMessage) {
    var key = self._getMessageKey(session.id, currentlyProcessingMessage.id);
    waitList.unshift(this._getCacheMessage(key, currentlyProcessingMessage));
  }

  this._waitListStore[mainKey] = waitList;
};

WaitTimeBuilder.prototype.build = function(session, msgId) {
  var mainKey = this._getMessageKey(session.id, msgId);
  var waitList = this._waitListStore[mainKey] || [];
  delete this._waitListStore[mainKey];

  var filteredWaitList =  waitList.map(this._cleanCacheMessage.bind(this));
  return filteredWaitList;
};

WaitTimeBuilder.prototype._getMessageKey = function(sessionId, msgId) {
  return sessionId + "::" + msgId;
};

WaitTimeBuilder.prototype._getCacheMessage = function(key, msg) {
  var self = this;
  var cachedMessage = self._messageCache[key];
  if(!cachedMessage) {
    self._messageCache[key] = cachedMessage = _.pick(msg, WAITON_MESSAGE_FIELDS);
    cachedMessage._key = key;
    cachedMessage._registered = 1;
  } else {
    cachedMessage._registered++;
  }

  return cachedMessage;
};

WaitTimeBuilder.prototype._cleanCacheMessage = function(msg) {
  msg._registered--;
  if(msg._registered == 0) {
    delete this._messageCache[msg._key];
  }

  // need to send a clean set of objects
  // otherwise register can go with this
  return _.pick(msg, WAITON_MESSAGE_FIELDS);
};

WaitTimeBuilder.prototype.trackWaitTime = function(session, msg, unblock) {
  var self = this;
  var started = Date.now();
  self._currentProcessingMessages[session.id] = msg;

  var unblocked = false;
  var wrappedUnblock = function() {
    if(!unblocked) {
      var waitTime = Date.now() - started;
      var key = self._getMessageKey(session.id, msg.id);
      var cachedMessage = self._messageCache[key];
      if(cachedMessage) {
        cachedMessage.waitTime = waitTime;
      }
      delete self._currentProcessingMessages[session.id];
      unblocked = true;
      unblock();
    }
  };

  return wrappedUnblock;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/check_for_oplog.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// expose for testing purpose
OplogCheck = {};

OplogCheck._070 = function(cursorDescription) {
  var options = cursorDescription.options;
  if (options.limit) {
    return {
      code: "070_LIMIT_NOT_SUPPORTED",
      reason: "Meteor 0.7.0 does not support limit with oplog.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  };

  var exists$ = _.any(cursorDescription.selector, function (value, field) {
    if (field.substr(0, 1) === '$')
      return true;
  });

  if(exists$) {
    return {
      code: "070_$_NOT_SUPPORTED",
      reason: "Meteor 0.7.0 supports only equal checks with oplog.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  };

  var onlyScalers = _.all(cursorDescription.selector, function (value, field) {
    return typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      value instanceof Meteor.Collection.ObjectID;
  });

  if(!onlyScalers) {
    return {
      code: "070_ONLY_SCALERS",
      reason: "Meteor 0.7.0 only supports scalers as comparators.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  }

  return true;
};

OplogCheck._071 = function(cursorDescription) {
  var options = cursorDescription.options;
  var matcher = new Minimongo.Matcher(cursorDescription.selector);
  if (options.limit) {
    return {
      code: "071_LIMIT_NOT_SUPPORTED",
      reason: "Meteor 0.7.1 does not support limit with oplog.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  };

  return true;
};


OplogCheck.env = function() {
  if(!process.env.MONGO_OPLOG_URL) {
    return {
      code: "NO_ENV",
      reason: "You haven't added oplog support for your the Meteor app.",
      solution: "Add oplog support for your Meteor app. see: http://goo.gl/Co1jJc"
    }
  } else {
    return true;
  }
};

OplogCheck.disableOplog = function(cursorDescription) {
  if(cursorDescription.options._disableOplog) {
    return {
      code: "DISABLE_OPLOG",
      reason: "You've disable oplog for this cursor explicitly with _disableOplog option."
    };
  } else {
    return true;
  }
};

// when creating Minimongo.Matcher object, if that's throws an exception
// meteor won't do the oplog support
OplogCheck.miniMongoMatcher = function(cursorDescription) {
  if(Minimongo.Matcher) {
    try {
      var matcher = new Minimongo.Matcher(cursorDescription.selector);
      return true;
    } catch(ex) {
      return {
        code: "MINIMONGO_MATCHER_ERROR",
        reason: "There's something wrong in your mongo query: " +  ex.message,
        solution: "Check your selector and change it accordingly."
      };
    }
  } else {
    // If there is no Minimongo.Matcher, we don't need to check this
    return true;
  }
};

OplogCheck.miniMongoSorter = function(cursorDescription) {
  var matcher = new Minimongo.Matcher(cursorDescription.selector);
  if(Minimongo.Sorter && cursorDescription.options.sort) {
    try {
      var sorter = new Minimongo.Sorter(
        cursorDescription.options.sort,
        { matcher: matcher }
      );
      return true;
    } catch(ex) {
      return {
        code: "MINIMONGO_SORTER_ERROR",
        reason: "Some of your sort specifiers are not supported: " + ex.message,
        solution: "Check your sort specifiers and chage them accordingly."
      }
    }
  } else {
    return true;
  }
};

OplogCheck.fields = function(cursorDescription) {
  var options = cursorDescription.options;
  if(options.fields) {
    try {
      LocalCollection._checkSupportedProjection(options.fields);
      return true;
    } catch (e) {
      if (e.name === "MinimongoError") {
        return {
          code: "NOT_SUPPORTED_FIELDS",
          reason: "Some of the field filters are not supported: " + e.message,
          solution: "Try removing those field filters."
        };
      } else {
        throw e;
      }
    }
  }
  return true;
};

OplogCheck.skip = function(cursorDescription) {
  if(cursorDescription.options.skip) {
    return {
      code: "SKIP_NOT_SUPPORTED",
      reason: "Skip does not support with oplog.",
      solution: "Try to avoid using skip. Use range queries instead: http://goo.gl/b522Av"
    };
  }

  return true;
};

OplogCheck.where = function(cursorDescription) {
  var matcher = new Minimongo.Matcher(cursorDescription.selector);
  if(matcher.hasWhere()) {
    return {
      code: "WHERE_NOT_SUPPORTED",
      reason: "Meteor does not support queries with $where.",
      solution: "Try to remove $where from your query. Use some alternative."
    }
  };

  return true;
};

OplogCheck.geo = function(cursorDescription) {
  var matcher = new Minimongo.Matcher(cursorDescription.selector);

  if(matcher.hasGeoQuery()) {
    return {
      code: "GEO_NOT_SUPPORTED",
      reason: "Meteor does not support queries with geo partial operators.",
      solution: "Try to remove geo partial operators from your query if possible."
    }
  };

  return true;
};

OplogCheck.limitButNoSort = function(cursorDescription) {
  var options = cursorDescription.options;

  if((options.limit && !options.sort)) {
    return {
      code: "LIMIT_NO_SORT",
      reason: "Meteor oplog implementation does not support limit without a sort specifier.",
      solution: "Try adding a sort specifier."
    }
  };

  return true;
};

OplogCheck.olderVersion = function(cursorDescription, driver) {
  if(driver && !driver.constructor.cursorSupported) {
    return {
      code: "OLDER_VERSION",
      reason: "Your Meteor version does not have oplog support.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    };
  }
  return true;
};

OplogCheck.gitCheckout = function(cursorDescription, driver) {
  if(!Meteor.release) {
    return {
      code: "GIT_CHECKOUT",
      reason: "Seems like your Meteor version is based on a Git checkout and it doesn't have the oplog support.",
      solution: "Try to upgrade your Meteor version."
    };
  }
  return true;
};

var preRunningMatchers = [
  OplogCheck.env,
  OplogCheck.disableOplog,
  OplogCheck.miniMongoMatcher
];

var globalMatchers = [
  OplogCheck.fields,
  OplogCheck.skip,
  OplogCheck.where,
  OplogCheck.geo,
  OplogCheck.limitButNoSort,
  OplogCheck.miniMongoSorter,
  OplogCheck.olderVersion,
  OplogCheck.gitCheckout
];

var versionMatchers = [
  [/^0\.7\.1/, OplogCheck._071],
  [/^0\.7\.0/, OplogCheck._070],
];

Kadira.checkWhyNoOplog = function(cursorDescription, observerDriver) {
  if(typeof Minimongo == 'undefined') {
    return {
      code: "CANNOT_DETECT",
      reason: "You are running an older Meteor version and Kadira can't check oplog state.",
      solution: "Try updating your Meteor app"
    }
  }

  var result = runMatchers(preRunningMatchers, cursorDescription, observerDriver);
  if(result !== true) {
    return result;
  }

  var meteorVersion = Meteor.release;
  for(var lc=0; lc<versionMatchers.length; lc++) {
    var matcherInfo = versionMatchers[lc];
    if(matcherInfo[0].test(meteorVersion)) {
      var matched = matcherInfo[1](cursorDescription, observerDriver);
      if(matched !== true) {
        return matched;
      }
    }
  }

  result = runMatchers(globalMatchers, cursorDescription, observerDriver);
  if(result !== true) {
    return result;
  }

  return {
    code: "OPLOG_SUPPORTED",
    reason: "This query should support oplog. It's weird if it's not.",
    solution: "Please contact Kadira support and let's discuss."
  };
};

function runMatchers(matcherList, cursorDescription, observerDriver) {
  for(var lc=0; lc<matcherList.length; lc++) {
    var matcher = matcherList[lc];
    var matched = matcher(cursorDescription, observerDriver);
    if(matched !== true) {
      return matched;
    }
  }
  return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/tracer/tracer.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fibers = Npm.require('fibers');
var eventLogger = Npm.require('debug')('kadira:tracer');
var REPITITIVE_EVENTS = {'db': true, 'http': true, 'email': true, 'wait': true, 'async': true};

Tracer = function Tracer() {
  this._filters = [];
};

//In the future, we might wan't to track inner fiber events too.
//Then we can't serialize the object with methods
//That's why we use this method of returning the data
Tracer.prototype.start = function(session, msg) {
  var traceInfo = {
    _id: session.id + "::" + msg.id,
    session: session.id,
    userId: session.userId,
    id: msg.id,
    events: []
  };

  if(msg.msg == 'method') {
    traceInfo.type = 'method';
    traceInfo.name = msg.method;
  } else if(msg.msg == 'sub') {
    traceInfo.type = 'sub';
    traceInfo.name = msg.name;
  } else {
    return null;
  }

  return traceInfo;
};

Tracer.prototype.event = function(traceInfo, type, data) {
  // do not allow to proceed, if already completed or errored
  var lastEvent = this.getLastEvent(traceInfo);
  if(lastEvent && ['complete', 'error'].indexOf(lastEvent.type) >= 0) {
    return false;
  }

  //expecting a end event
  var eventId = true;

  //specially handling for repitivive events like db, http
  if(REPITITIVE_EVENTS[type]) {
    //can't accept a new start event
    if(traceInfo._lastEventId) {
      return false;
    }
    eventId = traceInfo._lastEventId = DefaultUniqueId.get();
  }

  var event = {type: type, at: Ntp._now()};
  if(data) {
    var info = _.pick(traceInfo, 'type', 'name')
    event.data = this._applyFilters(type, data, info, "start");;
  }

  traceInfo.events.push(event);

  eventLogger("%s %s", type, traceInfo._id);
  return eventId;
};

Tracer.prototype.eventEnd = function(traceInfo, eventId, data) {
  if(traceInfo._lastEventId && traceInfo._lastEventId == eventId) {
    var lastEvent = this.getLastEvent(traceInfo);
    var type = lastEvent.type + 'end';
    var event = {type: type, at: Ntp._now()};
    if(data) {
      var info = _.pick(traceInfo, 'type', 'name')
      event.data = this._applyFilters(type, data, info, "end");;
    }
    traceInfo.events.push(event);
    eventLogger("%s %s", type, traceInfo._id);

    traceInfo._lastEventId = null;
    return true;
  } else {
    return false;
  }
};

Tracer.prototype.getLastEvent = function(traceInfo) {
  return traceInfo.events[traceInfo.events.length -1]
};

Tracer.prototype.endLastEvent = function(traceInfo) {
  var lastEvent = this.getLastEvent(traceInfo);
  if(lastEvent && !/end$/.test(lastEvent.type)) {
    traceInfo.events.push({
      type: lastEvent.type + 'end',
      at: Ntp._now()
    });
    return true;
  }
  return false;
};

Tracer.prototype.buildTrace = function(traceInfo) {
  var firstEvent = traceInfo.events[0];
  var lastEvent = traceInfo.events[traceInfo.events.length - 1];
  var processedEvents = [];

  if(firstEvent.type != 'start') {
    console.warn('Kadira: trace is not started yet');
    return null;
  } else if(lastEvent.type != 'complete' && lastEvent.type != 'error') {
    //trace is not completed or errored yet
    console.warn('Kadira: trace is not completed or errored yet');
    return null;
  } else {
    //build the metrics
    traceInfo.errored = lastEvent.type == 'error';
    traceInfo.at = firstEvent.at;

    var metrics = {
      total: lastEvent.at - firstEvent.at,
    };

    var totalNonCompute = 0;

    firstEvent = ['start', 0];
    if(traceInfo.events[0].data) firstEvent.push(traceInfo.events[0].data);
    processedEvents.push(firstEvent);

    for(var lc=1; lc < traceInfo.events.length - 1; lc += 2) {
      var prevEventEnd = traceInfo.events[lc-1];
      var startEvent = traceInfo.events[lc];
      var endEvent = traceInfo.events[lc+1];
      var computeTime = startEvent.at - prevEventEnd.at;
      if(computeTime > 0) processedEvents.push(['compute', computeTime]);
      if(!endEvent) {
        console.error('Kadira: no end event for type: ', startEvent.type);
        return null;
      } else if(endEvent.type != startEvent.type + 'end') {
        console.error('Kadira: endevent type mismatch: ', startEvent.type, endEvent.type, JSON.stringify(traceInfo));
        return null;
      } else {
        var elapsedTimeForEvent = endEvent.at - startEvent.at
        var currentEvent = [startEvent.type, elapsedTimeForEvent];
        currentEvent.push(_.extend({}, startEvent.data, endEvent.data));
        processedEvents.push(currentEvent);
        metrics[startEvent.type] = metrics[startEvent.type] || 0;
        metrics[startEvent.type] += elapsedTimeForEvent;
        totalNonCompute += elapsedTimeForEvent;
      }
    }

    computeTime = lastEvent.at - traceInfo.events[traceInfo.events.length - 2];
    if(computeTime > 0) processedEvents.push(['compute', computeTime]);

    var lastEventData = [lastEvent.type, 0];
    if(lastEvent.data) lastEventData.push(lastEvent.data);
    processedEvents.push(lastEventData);

    metrics.compute = metrics.total - totalNonCompute;
    traceInfo.metrics = metrics;
    traceInfo.events = processedEvents;
    traceInfo.isEventsProcessed = true;
    return traceInfo;
  }
};

Tracer.prototype.addFilter = function(filterFn) {
  this._filters.push(filterFn);
};

Tracer.prototype._applyFilters = function(eventType, data, info) {
  this._filters.forEach(function(filterFn) {
    data = filterFn(eventType, _.clone(data), info);
  });

  return data;
};

Kadira.tracer = new Tracer();
// need to expose Tracer to provide default set of filters
Kadira.Tracer = Tracer;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/tracer/default_filters.js                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// strip sensitive data sent to kadia engine.
// possible to limit types by providing an array of types to strip
// possible types are: "start", "db", "http", "email"
Tracer.stripSensitive = function stripSensitive(typesToStrip, receiverType, name) {
  typesToStrip =  typesToStrip || [];

  var strippedTypes = {};
  typesToStrip.forEach(function(type) {
    strippedTypes[type] = true;
  });

  return function (type, data, info) {
    if(typesToStrip.length > 0 && !strippedTypes[type])
      return data;

    if(receiverType && receiverType != info.type)
      return data;

    if(name && name != info.name)
      return data;

    if(type == "start") {
      data.params = "[stripped]";
    } else if(type == "db") {
      data.selector = "[stripped]";
    } else if(type == "http") {
      data.url = "[stripped]";
    } else if(type == "email") {
      ["from", "to", "cc", "bcc", "replyTo"].forEach(function(item) {
        if(data[item]) {
          data[item] = "[stripped]";
        }
      });
    }

    return data;
  };
};

// strip selectors only from the given list of collection names
Tracer.stripSelectors = function stripSelectors(collectionList, receiverType, name) {
  collectionList = collectionList || [];

  var collMap = {};
  collectionList.forEach(function(collName) {
    collMap[collName] = true;
  });

  return function(type, data, info) {
    if(type != "db" || (data && !collMap[data.coll])) {
      return data
    }

    if(receiverType && receiverType != info.type)
      return data;

    if(name && name != info.name)
      return data;

    data.selector = "[stripped]";
    return data;
  };
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/tracer/tracer_store.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = Npm.require('debug')('kadira:ts');

TracerStore = function TracerStore(options) {
  options = options || {};

  this.maxTotalPoints = options.maxTotalPoints || 30;
  this.interval = options.interval || 1000 * 60;
  this.archiveEvery = options.archiveEvery || this.maxTotalPoints / 6;

  //store max total on the past 30 minutes (or past 30 items)
  this.maxTotals = {};
  //store the max trace of the current interval
  this.currentMaxTrace = {};
  //archive for the traces
  this.traceArchive = [];

  this.processedCnt = {};

  //group errors by messages between an interval
  this.errorMap = {};
};

TracerStore.prototype.addTrace = function(trace) {
  var kind = [trace.type, trace.name].join('::');
  if(!this.currentMaxTrace[kind]) {
    this.currentMaxTrace[kind] = EJSON.clone(trace);
  } else if(this.currentMaxTrace[kind].metrics.total < trace.metrics.total) {
    this.currentMaxTrace[kind] = EJSON.clone(trace);
  } else if(trace.errored) {
    this._handleErrors(trace);
  }
};

TracerStore.prototype.collectTraces = function() {
  var traces = this.traceArchive;
  this.traceArchive = [];

  // convert at(timestamp) into the actual serverTime
  traces.forEach(function(trace) {
    trace.at = Kadira.syncedDate.syncTime(trace.at);
  });
  return traces;
};

TracerStore.prototype.start = function() {
  this._timeoutHandler = setInterval(this.processTraces.bind(this), this.interval);
};

TracerStore.prototype.stop = function() {
  if(this._timeoutHandler) {
    clearInterval(this._timeoutHandler);
  }
};

TracerStore.prototype._handleErrors = function(trace) {
  // sending error requests as it is
  var lastEvent = trace.events[trace.events.length -1];
  if(lastEvent && lastEvent[2]) {
    var error = lastEvent[2].error;

    // grouping errors occured (reset after processTraces)
    var errorKey = [trace.type, trace.name, error.message].join("::");
    if(!this.errorMap[errorKey]) {
      var erroredTrace = EJSON.clone(trace);
      this.errorMap[errorKey] = erroredTrace;

      this.traceArchive.push(erroredTrace);
    }
  } else {
    logger('last events is not an error: ', JSON.stringify(trace.events));
  }
};

TracerStore.prototype.processTraces = function() {
  var self = this;
  var kinds = _.union(
    _.keys(this.maxTotals),
    _.keys(this.currentMaxTrace)
  );

  kinds.forEach(function(kind) {
    self.processedCnt[kind] = self.processedCnt[kind] || 0;
    var currentMaxTrace = self.currentMaxTrace[kind];
    var currentMaxTotal = currentMaxTrace? currentMaxTrace.metrics.total : 0;

    self.maxTotals[kind] = self.maxTotals[kind] || [];
    //add the current maxPoint
    self.maxTotals[kind].push(currentMaxTotal);
    var exceedingPoints = self.maxTotals[kind].length - self.maxTotalPoints;
    if(exceedingPoints > 0) {
      self.maxTotals[kind].splice(0, exceedingPoints);
    }

    var archiveDefault = (self.processedCnt[kind] % self.archiveEvery) == 0;
    self.processedCnt[kind]++;

    var canArchive = archiveDefault
      || self._isTraceOutlier(kind, currentMaxTrace);

    if(canArchive && currentMaxTrace) {
      self.traceArchive.push(currentMaxTrace);
    }

    //reset currentMaxTrace
    self.currentMaxTrace[kind] = null;
  });

  //reset the errorMap
  self.errorMap = {};
};

TracerStore.prototype._isTraceOutlier = function(kind, trace) {
  if(trace) {
    var dataSet = this.maxTotals[kind];
    return this._isOutlier(dataSet, trace.metrics.total, 3);
  } else {
    return false;
  }
};

/*
  Data point must exists in the dataSet
*/
TracerStore.prototype._isOutlier = function(dataSet, dataPoint, maxMadZ) {
  var median = this._getMedian(dataSet);
  var mad = this._calculateMad(dataSet, median);
  var madZ = this._funcMedianDeviation(median)(dataPoint) / mad;

  return madZ > maxMadZ;
};

TracerStore.prototype._getMedian = function(dataSet) {
  var sortedDataSet = _.clone(dataSet).sort(function(a, b) {
    return a-b;
  });
  return this._pickQuartile(sortedDataSet, 2);
};

TracerStore.prototype._pickQuartile = function(dataSet, num) {
  var pos = ((dataSet.length + 1) * num) / 4;
  if(pos % 1 == 0) {
    return dataSet[pos -1];
  } else {
    pos = pos - (pos % 1);
    return (dataSet[pos -1] + dataSet[pos])/2
  }
};

TracerStore.prototype._calculateMad = function(dataSet, median) {
  var medianDeviations = _.map(dataSet, this._funcMedianDeviation(median));
  var mad = this._getMedian(medianDeviations);

  return mad;
};

TracerStore.prototype._funcMedianDeviation = function(median) {
  return function(x) {
    return Math.abs(median - x);
  };
};

TracerStore.prototype._getMean = function(dataPoints) {
  if(dataPoints.length > 0) {
    var total = 0;
    dataPoints.forEach(function(point) {
      total += point;
    });
    return total/dataPoints.length;
  } else {
    return 0;
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/models/0model.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
KadiraModel = function() {

};

KadiraModel.prototype._getDateId = function(timestamp) {
  var remainder = timestamp % (1000 * 60);
  var dateId = timestamp - remainder;
  return dateId;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/models/methods.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var METHOD_METRICS_FIELDS = ['wait', 'db', 'http', 'email', 'async', 'compute', 'total'];

MethodsModel = function (metricsThreshold) {
  var self = this;

  this.methodMetricsByMinute = {};
  this.errorMap = {};

  this._metricsThreshold = _.extend({
    "wait": 100,
    "db": 100,
    "http": 1000,
    "email": 100,
    "async": 100,
    "compute": 100,
    "total": 200
  }, metricsThreshold || {});

  //store max time elapsed methods for each method, event(metrics-field)
  this.maxEventTimesForMethods = {};

  this.tracerStore = new TracerStore({
    interval: 1000 * 60, //process traces every minute
    maxTotalPoints: 30, //for 30 minutes
    archiveEvery: 5 //always trace for every 5 minutes,
  });

  this.tracerStore.start();
};

_.extend(MethodsModel.prototype, KadiraModel.prototype);

MethodsModel.prototype._getMetrics = function(timestamp, method) {
  var dateId = this._getDateId(timestamp);

  if(!this.methodMetricsByMinute[dateId]) {
    this.methodMetricsByMinute[dateId] = {
      methods: {}
    };
  }

  var methods = this.methodMetricsByMinute[dateId].methods;

  //initialize method
  if(!methods[method]) {
    methods[method] = {
      count: 0,
      errors: 0,
      fetchedDocSize: 0,
      sentMsgSize: 0
    };

    METHOD_METRICS_FIELDS.forEach(function(field) {
      methods[method][field] = 0;
    });
  }

  return this.methodMetricsByMinute[dateId].methods[method];
};

MethodsModel.prototype.setStartTime = function(timestamp) {
  this.metricsByMinute[dateId].startTime = timestamp;
}

MethodsModel.prototype.processMethod = function(methodTrace) {
  var dateId = this._getDateId(methodTrace.at);

  //append metrics to previous values
  this._appendMetrics(dateId, methodTrace);
  if(methodTrace.errored) {
    this.methodMetricsByMinute[dateId].methods[methodTrace.name].errors ++
  }

  this.tracerStore.addTrace(methodTrace);
};

MethodsModel.prototype._appendMetrics = function(id, methodTrace) {
  var methodMetrics = this._getMetrics(id, methodTrace.name)

  // startTime needs to be converted into serverTime before sending
  if(!this.methodMetricsByMinute[id].startTime){
    this.methodMetricsByMinute[id].startTime = methodTrace.at;
  }

  //merge
  METHOD_METRICS_FIELDS.forEach(function(field) {
    var value = methodTrace.metrics[field];
    if(value > 0) {
      methodMetrics[field] += value;
    }
  });

  methodMetrics.count++;
  this.methodMetricsByMinute[id].endTime = methodTrace.metrics.at;
};

MethodsModel.prototype.trackDocSize = function(method, size) {
  var timestamp = Ntp._now();
  var dateId = this._getDateId(timestamp);

  var methodMetrics = this._getMetrics(dateId, method);
  methodMetrics.fetchedDocSize += size;
}

MethodsModel.prototype.trackMsgSize = function(method, size) {
  var timestamp = Ntp._now();
  var dateId = this._getDateId(timestamp);

  var methodMetrics = this._getMetrics(dateId, method);
  methodMetrics.sentMsgSize += size;
}

/*
  There are two types of data

  1. methodMetrics - metrics about the methods (for every 10 secs)
  2. methodRequests - raw method request. normally max, min for every 1 min and errors always
*/
MethodsModel.prototype.buildPayload = function(buildDetailedInfo) {
  var payload = {
    methodMetrics: [],
    methodRequests: []
  };

  //handling metrics
  var methodMetricsByMinute = this.methodMetricsByMinute;
  this.methodMetricsByMinute = {};

  //create final paylod for methodMetrics
  for(var key in methodMetricsByMinute) {
    var methodMetrics = methodMetricsByMinute[key];
    // converting startTime into the actual serverTime
    var startTime = methodMetrics.startTime;
    methodMetrics.startTime = Kadira.syncedDate.syncTime(startTime);

    for(var methodName in methodMetrics.methods) {
      METHOD_METRICS_FIELDS.forEach(function(field) {
        methodMetrics.methods[methodName][field] /=
          methodMetrics.methods[methodName].count;
      });
    }

    payload.methodMetrics.push(methodMetricsByMinute[key]);
  }

  //collect traces and send them with the payload
  payload.methodRequests = this.tracerStore.collectTraces();

  return payload;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/models/pubsub.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = Npm.require('debug')('kadira:pubsub');

PubsubModel = function() {
  this.metricsByMinute = {};
  this.subscriptions = {};

  this.tracerStore = new TracerStore({
    interval: 1000 * 60, //process traces every minute
    maxTotalPoints: 30, //for 30 minutes
    archiveEvery: 5 //always trace for every 5 minutes,
  });

  this.tracerStore.start();
}

PubsubModel.prototype._trackSub = function(session, msg) {
  logger('SUB:', session.id, msg.id, msg.name, msg.params);
  var publication = this._getPublicationName(msg.name);
  var subscriptionId = msg.id;
  var timestamp = Ntp._now();
  var metrics = this._getMetrics(timestamp, publication);

  metrics.subs++;
  this.subscriptions[msg.id] = {
    // We use localTime here, because when we used synedTime we might get
    // minus or more than we've expected
    //   (before serverTime diff changed overtime)
    startTime: timestamp,
    publication: publication,
    params: msg.params,
    id: msg.id
  };

  //set session startedTime
  session._startTime = session._startTime || timestamp;
};

_.extend(PubsubModel.prototype, KadiraModel.prototype);

PubsubModel.prototype._trackUnsub = function(session, sub) {
  logger('UNSUB:', session.id, sub._subscriptionId);
  var publication = this._getPublicationName(sub._name);
  var subscriptionId = sub._subscriptionId;
  var subscriptionState = this.subscriptions[subscriptionId];

  var startTime = null;
  //sometime, we don't have these states
  if(subscriptionState) {
    startTime = subscriptionState.startTime;
  } else {
    //if this is null subscription, which is started automatically
    //hence, we don't have a state
    startTime = session._startTime;
  }

  //in case, we can't get the startTime
  if(startTime) {
    var timestamp = Ntp._now();
    var metrics = this._getMetrics(timestamp, publication);
    //track the count
    if(sub._name != null) {
      // we can't track subs for `null` publications.
      // so we should not track unsubs too
      metrics.unsubs++;
    }
    //use the current date to get the lifeTime of the subscription
    metrics.lifeTime += timestamp - startTime;
    //this is place we can clean the subscriptionState if exists
    delete this.subscriptions[subscriptionId];
  }
};

PubsubModel.prototype._trackReady = function(session, sub, trace) {
  logger('READY:', session.id, sub._subscriptionId);
  //use the current time to track the response time
  var publication = this._getPublicationName(sub._name);
  var subscriptionId = sub._subscriptionId;
  var timestamp = Ntp._now();
  var metrics = this._getMetrics(timestamp, publication);

  var subscriptionState = this.subscriptions[subscriptionId];
  if(subscriptionState && !subscriptionState.readyTracked) {
    metrics.resTime += timestamp - subscriptionState.startTime;
    subscriptionState.readyTracked = true;
  }

  if(trace) {
    this.tracerStore.addTrace(trace);
  }
};

PubsubModel.prototype._trackError = function(session, sub, trace) {
  logger('ERROR:', session.id, sub._subscriptionId);
  //use the current time to track the response time
  var publication = this._getPublicationName(sub._name);
  var subscriptionId = sub._subscriptionId;
  var timestamp = Ntp._now();
  var metrics = this._getMetrics(timestamp, publication);

  metrics.errors++;

  if(trace) {
    this.tracerStore.addTrace(trace);
  }
};

PubsubModel.prototype._getMetrics = function(timestamp, publication) {
  var dateId = this._getDateId(timestamp);

  if(!this.metricsByMinute[dateId]) {
    this.metricsByMinute[dateId] = {
      // startTime needs to be convert to serverTime before sending to the server
      startTime: timestamp,
      pubs: {}
    };
  }

  if(!this.metricsByMinute[dateId].pubs[publication]) {
    this.metricsByMinute[dateId].pubs[publication] = {
      subs: 0,
      unsubs: 0,
      resTime: 0,
      activeSubs: 0,
      activeDocs: 0,
      lifeTime: 0,
      totalObservers: 0,
      cachedObservers: 0,
      createdObservers: 0,
      deletedObservers: 0,
      errors: 0,
      observerLifetime: 0,
      polledDocuments: 0,
      oplogUpdatedDocuments: 0,
      oplogInsertedDocuments: 0,
      oplogDeletedDocuments: 0,
      initiallyAddedDocuments: 0,
      liveAddedDocuments: 0,
      liveChangedDocuments: 0,
      liveRemovedDocuments: 0,
      polledDocSize: 0,
      fetchedDocSize: 0,
      initiallyFetchedDocSize: 0,
      liveFetchedDocSize: 0,
      initiallySentMsgSize: 0,
      liveSentMsgSize: 0
    };
  }

  return this.metricsByMinute[dateId].pubs[publication];
};

PubsubModel.prototype._getPublicationName = function(name) {
  return name || "null(autopublish)";
};

PubsubModel.prototype._getSubscriptionInfo = function() {
  var self = this;
  var activeSubs = {};
  var activeDocs = {};
  var totalDocsSent = {};
  var totalDataSent = {};
  var totalObservers = {};
  var cachedObservers = {};

  for(var sessionId in Meteor.default_server.sessions) {
    var session = Meteor.default_server.sessions[sessionId];
    _.each(session._namedSubs, countSubData);
    _.each(session._universalSubs, countSubData);
  }

  var avgObserverReuse = {};
  _.each(totalObservers, function(value, publication) {
    avgObserverReuse[publication] = cachedObservers[publication] / totalObservers[publication];
  });

  return {
    activeSubs: activeSubs,
    activeDocs: activeDocs,
    avgObserverReuse: avgObserverReuse
  };

  function countSubData (sub) {
    var publication = self._getPublicationName(sub._name);
    countSubscriptions(sub, publication);
    countDocuments(sub, publication);
    countObservers(sub, publication);
  }

  function countSubscriptions (sub, publication) {
    activeSubs[publication] = activeSubs[publication] || 0;
    activeSubs[publication]++;
  }

  function countDocuments (sub, publication) {
    activeDocs[publication] = activeDocs[publication] || 0;
    for(collectionName in sub._documents) {
      activeDocs[publication] += _.keys(sub._documents[collectionName]).length;
    }
  }

  function countObservers(sub, publication) {
    totalObservers[publication] = totalObservers[publication] || 0;
    cachedObservers[publication] = cachedObservers[publication] || 0;

    totalObservers[publication] += sub._totalObservers;
    cachedObservers[publication] += sub._cachedObservers;
  }
}

PubsubModel.prototype.buildPayload = function(buildDetailInfo) {
  var metricsByMinute = this.metricsByMinute;
  this.metricsByMinute = {};

  var payload = {
    pubMetrics: []
  };

  var subscriptionData = this._getSubscriptionInfo();
  var activeSubs = subscriptionData.activeSubs;
  var activeDocs = subscriptionData.activeDocs;
  var avgObserverReuse = subscriptionData.avgObserverReuse;

  //to the averaging
  for(var dateId in metricsByMinute) {
    var dateMetrics = metricsByMinute[dateId];
    // We need to convert startTime into actual serverTime
    dateMetrics.startTime = Kadira.syncedDate.syncTime(dateMetrics.startTime);

    for(var publication in metricsByMinute[dateId].pubs) {
      var singlePubMetrics = metricsByMinute[dateId].pubs[publication];
      // We only calculate resTime for new subscriptions
      singlePubMetrics.resTime /= singlePubMetrics.subs;
      singlePubMetrics.resTime = singlePubMetrics.resTime || 0;
      // We only track lifeTime in the unsubs
      singlePubMetrics.lifeTime /= singlePubMetrics.unsubs;
      singlePubMetrics.lifeTime = singlePubMetrics.lifeTime || 0;

      // Count the average for observer lifetime
      if(singlePubMetrics.deletedObservers > 0) {
        singlePubMetrics.observerLifetime /= singlePubMetrics.deletedObservers;
      }

      // If there are two ore more dateIds, we will be using the currentCount for all of them.
      // We can come up with a better solution later on.
      singlePubMetrics.activeSubs = activeSubs[publication] || 0;
      singlePubMetrics.activeDocs = activeDocs[publication] || 0;
      singlePubMetrics.avgObserverReuse = avgObserverReuse[publication] || 0;
    }

    payload.pubMetrics.push(metricsByMinute[dateId]);
  }

  //collect traces and send them with the payload
  payload.pubRequests = this.tracerStore.collectTraces();

  return payload;
};

PubsubModel.prototype.incrementHandleCount = function(trace, isCached) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(trace.name);
  var publication = this._getMetrics(timestamp, publicationName);

  var session = Meteor.default_server.sessions[trace.session];
  if(session) {
    var sub = session._namedSubs[trace.id];
    if(sub) {
      sub._totalObservers = sub._totalObservers || 0;
      sub._cachedObservers = sub._cachedObservers || 0;
    }
  }
  // not sure, we need to do this? But I don't need to break the however
  sub = sub || {_totalObservers:0 , _cachedObservers: 0};

  publication.totalObservers++;
  sub._totalObservers++;
  if(isCached) {
    publication.cachedObservers++;
    sub._cachedObservers++;
  }
}

PubsubModel.prototype.trackCreatedObserver = function(info) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(info.name);
  var publication = this._getMetrics(timestamp, publicationName);
  publication.createdObservers++;
}

PubsubModel.prototype.trackDeletedObserver = function(info) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(info.name);
  var publication = this._getMetrics(timestamp, publicationName);
  publication.deletedObservers++;
  publication.observerLifetime += (new Date()).getTime() - info.startTime;
}

PubsubModel.prototype.trackDocumentChanges = function(info, op) {
  // It's possibel that info to be null
  // Specially when getting changes at the very begining.
  // This may be false, but nice to have a check
  if(!info) {
    return
  }

  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(info.name);
  var publication = this._getMetrics(timestamp, publicationName);
  if(op.op === "d") {
    publication.oplogDeletedDocuments++;
  } else if(op.op === "i") {
    publication.oplogInsertedDocuments++;
  } else if(op.op === "u") {
    publication.oplogUpdatedDocuments++;
  }
}

PubsubModel.prototype.trackPolledDocuments = function(info, count) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(info.name);
  var publication = this._getMetrics(timestamp, publicationName);
  publication.polledDocuments += count;
}

PubsubModel.prototype.trackLiveUpdates = function(info, type, count) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(info.name);
  var publication = this._getMetrics(timestamp, publicationName);

  if(type === "_addPublished") {
    publication.liveAddedDocuments += count;
  } else if(type === "_removePublished") {
    publication.liveRemovedDocuments += count;
  } else if(type === "_changePublished") {
    publication.liveChangedDocuments += count;
  } else if(type === "_initialAdds") {
    publication.initiallyAddedDocuments += count;
  } else {
    throw new Error("Kadira: Unknown live update type");
  }
}

PubsubModel.prototype.trackDocSize = function(name, type, size) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(name);
  var publication = this._getMetrics(timestamp, publicationName);

  if(type === "polledFetches") {
    publication.polledDocSize += size;
  } else if(type === "liveFetches") {
    publication.liveFetchedDocSize += size;
  } else if(type === "cursorFetches") {
    publication.fetchedDocSize += size;
  } else if(type === "initialFetches") {
    publication.initiallyFetchedDocSize += size;
  } else {
    throw new Error("Kadira: Unknown docs fetched type");
  }
}

PubsubModel.prototype.trackMsgSize = function(name, type, size) {
  var timestamp = Ntp._now();
  var publicationName = this._getPublicationName(name);
  var publication = this._getMetrics(timestamp, publicationName);

  if(type === "liveSent") {
    publication.liveSentMsgSize += size;
  } else if(type === "initialSent") {
    publication.initiallySentMsgSize += size;
  } else {
    throw new Error("Kadira: Unknown docs fetched type");
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/models/system.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var os = Npm.require('os');
var usage = Npm.require('pidusage');
var EventLoopMonitor = Npm.require('evloop-monitor');

SystemModel = function () {
  var self = this;
  this.startTime = Ntp._now();
  this.newSessions = 0;
  this.sessionTimeout = 1000 * 60 * 30; //30 min

  this.usageLookup = Kadira._wrapAsync(usage.stat.bind(usage));
  this.evloopMonitor = new EventLoopMonitor(200);
  this.evloopMonitor.start();
}

_.extend(SystemModel.prototype, KadiraModel.prototype);

SystemModel.prototype.buildPayload = function() {
  var metrics = {};
  var now = Ntp._now();
  metrics.startTime = Kadira.syncedDate.syncTime(this.startTime);
  metrics.endTime = Kadira.syncedDate.syncTime(now);

  metrics.sessions = _.keys(Meteor.default_server.sessions).length;
  metrics.memory = process.memoryUsage().rss / (1024*1024);
  metrics.newSessions = this.newSessions;
  this.newSessions = 0;

  var usage = this.getUsage();
  metrics.pcpu = usage.cpu;
  if(usage.cpuInfo) {
    metrics.cputime = usage.cpuInfo.cpuTime;
    metrics.pcpuUser = usage.cpuInfo.pcpuUser;
    metrics.pcpuSystem = usage.cpuInfo.pcpuSystem;
  }

  // track eventloop blockness
  metrics.pctEvloopBlock = this.evloopMonitor.status().pctBlock;

  this.startTime = now;
  return {systemMetrics: [metrics]};
};

SystemModel.prototype.getUsage = function() {
  var usage = this.usageLookup(process.pid) || {};
  Kadira.docSzCache.setPcpu(usage.cpu);
  return usage;
};

SystemModel.prototype.handleSessionActivity = function(msg, session) {
  if(msg.msg === 'connect' && !msg.session) {
    this.countNewSession(session);
  } else if(['sub', 'method'].indexOf(msg.msg) != -1) {
    if(!this.isSessionActive(session)) {
      this.countNewSession(session);
    }
  }
  session._activeAt = Date.now();
}

SystemModel.prototype.countNewSession = function(session) {
  if(!isLocalAddress(session.socket)) {
    this.newSessions++;
  }
}

SystemModel.prototype.isSessionActive = function(session) {
  var inactiveTime = Date.now() - session._activeAt;
  return inactiveTime < this.sessionTimeout;
}

// ------------------------------------------------------------------------- //

// http://regex101.com/r/iF3yR3/2
var isLocalHostRegex = /^(?:.*\.local|localhost)(?:\:\d+)?|127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/;

// http://regex101.com/r/hM5gD8/1
var isLocalAddressRegex = /^127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/;

function isLocalAddress (socket) {
  var host = socket.headers['host'];
  if(host) return isLocalHostRegex.test(host);
  var address = socket.headers['x-forwarded-for'] || socket.remoteAddress;
  if(address) return isLocalAddressRegex.test(address);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/models/errors.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
ErrorModel = function (appId) {
  BaseErrorModel.call(this);
  var self = this;
  this.appId = appId;
  this.errors = {};
  this.startTime = Date.now();
  this.maxErrors = 10;
}

_.extend(ErrorModel.prototype, KadiraModel.prototype);
_.extend(ErrorModel.prototype, BaseErrorModel.prototype);

ErrorModel.prototype.buildPayload = function() {
  var metrics = _.values(this.errors);
  this.startTime = Ntp._now();

  _.each(metrics, function (metric) {
    metric.startTime = Kadira.syncedDate.syncTime(metric.startTime)
  });

  this.errors = {};
  return {errors: metrics};
};

ErrorModel.prototype.errorCount = function () {
  return _.values(this.errors).length;
};

ErrorModel.prototype.trackError = function(ex, trace) {
  var key = trace.type + ':' + ex.message;
  if(this.errors[key]) {
    this.errors[key].count++;
  } else if (this.errorCount() < this.maxErrors) {
    var errorDef = this._formatError(ex, trace);
    if(this.applyFilters(errorDef.type, errorDef.name, ex, errorDef.subType)) {
      this.errors[key] = this._formatError(ex, trace);
    }
  }
};

ErrorModel.prototype._formatError = function(ex, trace) {
  var time = Date.now();
  var stack = ex.stack;

  // to get Meteor's Error details
  if(ex.details) {
    stack = "Details: " + ex.details + "\r\n" + stack;
  }

  // Update trace's error event with the next stack
  var errorEvent = trace.events && trace.events[trace.events.length -1];
  var errorObject = errorEvent && errorEvent[2] && errorEvent[2].error;

  if(errorObject) {
    errorObject.stack = stack;
  }

  return {
    appId: this.appId,
    name: ex.message,
    type: trace.type,
    startTime: time,
    subType: trace.subType || trace.name,
    trace: trace,
    stacks: [{stack: stack}],
    count: 1,
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/docsize_cache.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var LRU = Npm.require('lru-cache');
var crypto = Npm.require('crypto');
var jsonStringify = Npm.require('json-stringify-safe');

DocSzCache = function (maxItems, maxValues) {
  this.items = new LRU({max: maxItems});
  this.maxValues = maxValues;
  this.cpuUsage = 0;
}

// This is called from SystemModel.prototype.getUsage and saves cpu usage.
DocSzCache.prototype.setPcpu = function (pcpu) {
  this.cpuUsage = pcpu;
};

DocSzCache.prototype.getSize = function (coll, query, opts, data) {
  // If the dataset is null or empty we can't calculate the size
  // Do not process this data and return 0 as the document size.
  if (!(data && (data.length || (data.size && data.size())))) {
    return 0;
  }

  var key = this.getKey(coll, query, opts);
  var item = this.items.get(key);

  if (!item) {
    item = new DocSzCacheItem(this.maxValues);
    this.items.set(key, item);
  }

  if (this.needsUpdate(item)) {
    var doc = {};
    if(typeof data.get === 'function'){
      // This is an IdMap
      data.forEach(function(element){
        doc = element;
        return false; // return false to stop loop. We only need one doc.
      })
    } else {
      doc = data[0];
    }
    var size = Buffer.byteLength(jsonStringify(doc), 'utf8');
    item.addData(size);
  }

  return item.getValue();
};

DocSzCache.prototype.getKey = function (coll, query, opts) {
  return jsonStringify([coll, query, opts]);
};

// returns a score between 0 and 1 for a cache item
// this score is determined by:
//  * availalbe cache item slots
//  * time since last updated
//  * cpu usage of the application
DocSzCache.prototype.getItemScore = function (item) {
  return [
    (item.maxValues - item.values.length)/item.maxValues,
    (Date.now() - item.updated) / 60000,
    (100 - this.cpuUsage) / 100,
  ].map(function (score) {
    return score > 1 ? 1 : score;
  }).reduce(function (total, score) {
    return (total || 0) + score;
  }) / 3;
};

DocSzCache.prototype.needsUpdate = function (item) {
  // handle newly made items
  if (!item.values.length) {
    return true;
  }

  var currentTime = Date.now();
  var timeSinceUpdate = currentTime - item.updated;
  if (timeSinceUpdate > 1000*60) {
    return true;
  }

  return this.getItemScore(item) > 0.5;
};


DocSzCacheItem = function (maxValues) {
  this.maxValues = maxValues;
  this.updated = 0;
  this.values = [];
}

DocSzCacheItem.prototype.addData = function (value) {
  this.values.push(value);
  this.updated = Date.now();

  if (this.values.length > this.maxValues) {
    this.values.shift();
  }
};

DocSzCacheItem.prototype.getValue = function () {
  function sortNumber(a, b) {
    return a - b;
  }
  var sorted = this.values.sort(sortNumber);
  var median = 0;

  if (sorted.length % 2 === 0) {
    var idx = sorted.length / 2;
    median = (sorted[idx] + sorted[idx-1]) / 2;
  } else {
    var idx = Math.floor(sorted.length / 2);
    median = sorted[idx];
  }

  return median;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/kadira.js                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var hostname = Npm.require('os').hostname();
var logger = Npm.require('debug')('kadira:apm');
var Fibers = Npm.require('fibers');

var KadiraCore = Npm.require('kadira-core').Kadira;

Kadira.models = {};
Kadira.options = {};
Kadira.env = {
  currentSub: null, // keep current subscription inside ddp
  kadiraInfo: new Meteor.EnvironmentVariable(),
};
Kadira.waitTimeBuilder = new WaitTimeBuilder();
Kadira.errors = [];
Kadira.errors.addFilter = Kadira.errors.push.bind(Kadira.errors);

Kadira.models.methods = new MethodsModel();
Kadira.models.pubsub = new PubsubModel();
Kadira.models.system = new SystemModel();
Kadira.docSzCache = new DocSzCache(100000, 10);


Kadira.connect = function(appId, appSecret, options) {
  options = options || {};
  options.appId = appId;
  options.appSecret = appSecret;
  options.payloadTimeout = options.payloadTimeout || 1000 * 20;
  options.endpoint = options.endpoint || "https://enginex.kadira.io";
  options.clientEngineSyncDelay = options.clientEngineSyncDelay || 10000;
  options.thresholds = options.thresholds || {};
  options.isHostNameSet = !!options.hostname;
  options.hostname = options.hostname || hostname;
  options.proxy = options.proxy || null;

  if(options.documentSizeCacheSize) {
    Kadira.docSzCache = new DocSzCache(options.documentSizeCacheSize, 10);
  }

  // remove trailing slash from endpoint url (if any)
  if(_.last(options.endpoint) === '/') {
    options.endpoint = options.endpoint.substr(0, options.endpoint.length - 1);
  }

  // error tracking is enabled by default
  if(options.enableErrorTracking === undefined) {
    options.enableErrorTracking = true;
  }

  Kadira.options = options;
  Kadira.options.authHeaders = {
    'KADIRA-APP-ID': Kadira.options.appId,
    'KADIRA-APP-SECRET': Kadira.options.appSecret
  };

  Kadira.syncedDate = new Ntp(options.endpoint);
  Kadira.syncedDate.sync();
  Kadira.models.error = new ErrorModel(appId);

  // handle pre-added filters
  var addFilterFn = Kadira.models.error.addFilter.bind(Kadira.models.error);
  Kadira.errors.forEach(addFilterFn);
  Kadira.errors = Kadira.models.error;

  // setting runtime info, which will be sent to kadira
  __meteor_runtime_config__.kadira = {
    appId: appId,
    endpoint: options.endpoint,
    clientEngineSyncDelay: options.clientEngineSyncDelay,
  };

  if(options.enableErrorTracking) {
    Kadira.enableErrorTracking();
  } else {
    Kadira.disableErrorTracking();
  }

  if(appId && appSecret) {
    options.appId = options.appId.trim();
    options.appSecret = options.appSecret.trim();

    Kadira.coreApi = new KadiraCore({
      appId: options.appId,
      appSecret: options.appSecret,
      endpoint: options.endpoint,
      hostname: options.hostname
    });

    Kadira.coreApi._checkAuth()
      .then(function() {
        logger('connected to app: ', appId);
        console.log('Kadira: Successfully connected');
        Kadira._sendAppStats();
        Kadira._schedulePayloadSend();
      })
      .catch(function(err) {
        console.log('Kadira: authentication failed - check your appId & appSecret')
      });
  } else {
    throw new Error('Kadira: required appId and appSecret');
  }

  // start tracking errors
  Meteor.startup(function () {
    TrackUncaughtExceptions();
    TrackMeteorDebug();
  })

  Meteor.publish(null, function () {
    var options = __meteor_runtime_config__.kadira;
    this.added('kadira_settings', Random.id(), options);
    this.ready();
  });

  // notify we've connected
  Kadira.connected = true;
};

//track how many times we've sent the data (once per minute)
Kadira._buildPayload = function () {
  var payload = {host: Kadira.options.hostname};
  var buildDetailedInfo = Kadira._isDetailedInfo();
  _.extend(payload, Kadira.models.methods.buildPayload(buildDetailedInfo));
  _.extend(payload, Kadira.models.pubsub.buildPayload(buildDetailedInfo));
  _.extend(payload, Kadira.models.system.buildPayload());
  if(Kadira.options.enableErrorTracking) {
    _.extend(payload, Kadira.models.error.buildPayload());
  }

  return payload;
}

Kadira._countDataSent = 0;
Kadira._detailInfoSentInterval = Math.ceil((1000*60) / Kadira.options.payloadTimeout);
Kadira._isDetailedInfo = function () {
  return (Kadira._countDataSent++ % Kadira._detailInfoSentInterval) == 0;
}

Kadira._sendAppStats = function () {
  var appStats = {};
  appStats.release = Meteor.release;
  appStats.protocolVersion = '1.0.0';
  appStats.packageVersions = [];
  appStats.appVersions = {
    webapp: __meteor_runtime_config__['autoupdateVersion'],
    refreshable: __meteor_runtime_config__['autoupdateVersionRefreshable'],
    cordova: __meteor_runtime_config__['autoupdateVersionCordova']
  }

  // TODO get version number for installed packages
  _.each(Package, function (v, name) {
    appStats.packageVersions.push({name: name, version: null});
  });

  Kadira.coreApi.sendData({
    startTime: new Date(),
    appStats: appStats
  }).catch(function(err) {
    console.error('Kadira Error on sending appStats:', err.message);
  });
}

Kadira._schedulePayloadSend = function () {
  setTimeout(function () {
    Kadira._sendPayload(Kadira._schedulePayloadSend);
  }, Kadira.options.payloadTimeout);
}

Kadira._sendPayload = function (callback) {
  new Fibers(function() {
    var payload = Kadira._buildPayload();
    Kadira.coreApi.sendData(payload)
    .then(callback)
    .catch(function(err) {
      console.log('Kadira Error:', err.message);
      callback();
    });
  }).run();
}

// this return the __kadiraInfo from the current Fiber by default
// if called with 2nd argument as true, it will get the kadira info from
// Meteor.EnvironmentVariable
//
// WARNNING: returned info object is the reference object.
//  Changing it might cause issues when building traces. So use with care
Kadira._getInfo = function(currentFiber, useEnvironmentVariable) {
  currentFiber = currentFiber || Fibers.current;
  if(currentFiber) {
    if(useEnvironmentVariable) {
      return Kadira.env.kadiraInfo.get();
    }
    return currentFiber.__kadiraInfo;
  }
};

// this does not clone the info object. So, use with care
Kadira._setInfo = function(info) {
  Fibers.current.__kadiraInfo = info;
};

Kadira.enableErrorTracking = function () {
  __meteor_runtime_config__.kadira.enableErrorTracking = true;
  Kadira.options.enableErrorTracking = true;
};

Kadira.disableErrorTracking = function () {
  __meteor_runtime_config__.kadira.enableErrorTracking = false;
  Kadira.options.enableErrorTracking = false;
};

Kadira.trackError = function (type, message, options) {
  if(Kadira.options.enableErrorTracking && type && message) {
    options = options || {};
    options.subType = options.subType || 'server';
    options.stacks = options.stacks || '';
    var error = {message: message, stack: options.stacks};
    var trace = {
      type: type,
      subType: options.subType,
      name: message,
      errored: true,
      at: Kadira.syncedDate.getTime(),
      events: [['start', 0, {}], ['error', 0, {error: error}]],
      metrics: {total: 0}
    };
    Kadira.models.error.trackError(error, trace);
  }
}

Kadira.ignoreErrorTracking = function (err) {
  err._skipKadira = true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/wrap_server.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');

wrapServer = function(serverProto) {
  var originalHandleConnect = serverProto._handleConnect
  serverProto._handleConnect = function(socket, msg) {
    originalHandleConnect.call(this, socket, msg);
    var session = socket._meteorSession;
    // sometimes it is possible for _meteorSession to be undefined
    // one such reason would be if DDP versions are not matching
    // if then, we should not process it
    if(!session) {
      return;
    }

    Kadira.EventBus.emit('system', 'createSession', msg, socket._meteorSession);

    if(Kadira.connected) {
      Kadira.models.system.handleSessionActivity(msg, socket._meteorSession);
    }
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/wrap_session.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
wrapSession = function(sessionProto) {
  var originalProcessMessage = sessionProto.processMessage;
  sessionProto.processMessage = function(msg) {
    if(true) {
      var kadiraInfo = {
        session: this.id,
        userId: this.userId
      };

      if(msg.msg == 'method' || msg.msg == 'sub') {
        kadiraInfo.trace = Kadira.tracer.start(this, msg);
        Kadira.waitTimeBuilder.register(this, msg.id);

        //use JSON stringify to save the CPU
        var startData = { userId: this.userId, params: JSON.stringify(msg.params) };
        Kadira.tracer.event(kadiraInfo.trace, 'start', startData);
        var waitEventId = Kadira.tracer.event(kadiraInfo.trace, 'wait', {}, kadiraInfo);
        msg._waitEventId = waitEventId;
        msg.__kadiraInfo = kadiraInfo;

        if(msg.msg == 'sub') {
          // start tracking inside processMessage allows us to indicate
          // wait time as well
          Kadira.EventBus.emit('pubsub', 'subReceived', this, msg);
          Kadira.models.pubsub._trackSub(this, msg);
        }
      }

      // Update session last active time
      Kadira.EventBus.emit('system', 'ddpMessageReceived', this, msg);
      Kadira.models.system.handleSessionActivity(msg, this);
    }

    return originalProcessMessage.call(this, msg);
  };

  //adding the method context to the current fiber
  var originalMethodHandler = sessionProto.protocol_handlers.method;
  sessionProto.protocol_handlers.method = function(msg, unblock) {
    var self = this;
    //add context
    var kadiraInfo = msg.__kadiraInfo;
    if(kadiraInfo) {
      Kadira._setInfo(kadiraInfo);

      // end wait event
      var waitList = Kadira.waitTimeBuilder.build(this, msg.id);
      Kadira.tracer.eventEnd(kadiraInfo.trace, msg._waitEventId, {waitOn: waitList});

      unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);
      var response = Kadira.env.kadiraInfo.withValue(kadiraInfo, function () {
        return originalMethodHandler.call(self, msg, unblock);
      });
      unblock();
    } else {
      var response = originalMethodHandler.call(self, msg, unblock);
    }

    return response;
  };

  //to capture the currently processing message
  var orginalSubHandler = sessionProto.protocol_handlers.sub;
  sessionProto.protocol_handlers.sub = function(msg, unblock) {
    var self = this;
    //add context
    var kadiraInfo = msg.__kadiraInfo;
    if(kadiraInfo) {
      Kadira._setInfo(kadiraInfo);

      // end wait event
      var waitList = Kadira.waitTimeBuilder.build(this, msg.id);
      Kadira.tracer.eventEnd(kadiraInfo.trace, msg._waitEventId, {waitOn: waitList});

      unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);
      var response = Kadira.env.kadiraInfo.withValue(kadiraInfo, function () {
        return orginalSubHandler.call(self, msg, unblock);
      });
      unblock();
    } else {
      var response = orginalSubHandler.call(self, msg, unblock);
    }

    return response;
  };

  //to capture the currently processing message
  var orginalUnSubHandler = sessionProto.protocol_handlers.unsub;
  sessionProto.protocol_handlers.unsub = function(msg, unblock) {
    unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);
    var response = orginalUnSubHandler.call(this, msg, unblock);
    unblock();
    return response;
  };

  //track method ending (to get the result of error)
  var originalSend = sessionProto.send;
  sessionProto.send = function(msg) {
    if(msg.msg == 'result') {
      var kadiraInfo = Kadira._getInfo();
      if(kadiraInfo) {
        if(msg.error) {
          var error = _.pick(msg.error, ['message', 'stack']);

          // pick the error from the wrapped method handler
          if(kadiraInfo && kadiraInfo.currentError) {
            // the error stack is wrapped so Meteor._debug can identify
            // this as a method error.
            error = _.pick(kadiraInfo.currentError, ['message', 'stack']);
            // see wrapMethodHanderForErrors() method def for more info
            if(error.stack && error.stack.stack) {
              error.stack = error.stack.stack;
            }
          }

          Kadira.tracer.endLastEvent(kadiraInfo.trace);
          Kadira.tracer.event(kadiraInfo.trace, 'error', {error: error});
        } else {
          var isForced = Kadira.tracer.endLastEvent(kadiraInfo.trace);
          if (isForced) {
            console.warn('Kadira endevent forced complete', JSON.stringify(kadiraInfo.trace.events));
          };
          Kadira.tracer.event(kadiraInfo.trace, 'complete');
        }

        //processing the message
        var trace = Kadira.tracer.buildTrace(kadiraInfo.trace);
        Kadira.EventBus.emit('method', 'methodCompleted', trace, this);
        Kadira.models.methods.processMethod(trace);

        // error may or may not exist and error tracking can be disabled
        if(error && Kadira.options.enableErrorTracking) {
          Kadira.models.error.trackError(error, trace);
        }

        //clean and make sure, fiber is clean
        //not sure we need to do this, but a preventive measure
        Kadira._setInfo(null);
      }
    }

    return originalSend.call(this, msg);
  };
};

// wrap existing method handlers for capturing errors
_.each(Meteor.default_server.method_handlers, function(handler, name) {
  wrapMethodHanderForErrors(name, handler, Meteor.default_server.method_handlers);
});

// wrap future method handlers for capturing errors
var originalMeteorMethods = Meteor.methods;
Meteor.methods = function(methodMap) {
  _.each(methodMap, function(handler, name) {
    wrapMethodHanderForErrors(name, handler, methodMap);
  });
  originalMeteorMethods(methodMap);
};


function wrapMethodHanderForErrors(name, originalHandler, methodMap) {
  methodMap[name] = function() {
    try{
      return originalHandler.apply(this, arguments);
    } catch(ex) {
      if(ex && Kadira._getInfo()) {
        // sometimes error may be just an string or a primitive
        // in that case, we need to make it a psuedo error
        if(typeof ex !== 'object') {
          ex = {message: ex, stack: ex};
        }
        // Now we are marking this error to get tracked via methods
        // But, this also triggers a Meteor.debug call and 
        // it only gets the stack
        // We also track Meteor.debug errors and want to stop 
        // tracking this error. That's why we do this
        // See Meteor.debug error tracking code for more
        ex.stack = {stack: ex.stack, source: 'method'};
        Kadira._getInfo().currentError = ex;
      }
      throw ex;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/wrap_subscription.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');

wrapSubscription = function(subscriptionProto) {
  // If the ready event runs outside the Fiber, Kadira._getInfo() doesn't work.
  // we need some other way to store kadiraInfo so we can use it at ready hijack.
  var originalRunHandler = subscriptionProto._runHandler;
  subscriptionProto._runHandler = function() {
    var kadiraInfo = Kadira._getInfo();
    if (kadiraInfo) {
      this.__kadiraInfo = kadiraInfo;
    };
    originalRunHandler.call(this);
  }

  var originalReady = subscriptionProto.ready;
  subscriptionProto.ready = function() {
    // meteor has a field called `_ready` which tracks this
    // but we need to make it future proof
    if(!this._apmReadyTracked) {
      var kadiraInfo = Kadira._getInfo() || this.__kadiraInfo;
      delete this.__kadiraInfo;
      //sometime .ready can be called in the context of the method
      //then we have some problems, that's why we are checking this
      //eg:- Accounts.createUser
      if(kadiraInfo && this._subscriptionId == kadiraInfo.trace.id) {
        var isForced = Kadira.tracer.endLastEvent(kadiraInfo.trace);
        if (isForced) {
          console.warn('Kadira endevent forced complete', JSON.stringify(kadiraInfo.trace.events));
        };
        Kadira.tracer.event(kadiraInfo.trace, 'complete');
        var trace = Kadira.tracer.buildTrace(kadiraInfo.trace);
      }

      Kadira.EventBus.emit('pubsub', 'subCompleted', trace, this._session, this);
      Kadira.models.pubsub._trackReady(this._session, this, trace);
      this._apmReadyTracked = true;
    }

    // we still pass the control to the original implementation
    // since multiple ready calls are handled by itself
    originalReady.call(this);
  };

  var originalError = subscriptionProto.error;
  subscriptionProto.error = function(err) {
    var kadiraInfo = Kadira._getInfo();

    if(kadiraInfo && this._subscriptionId == kadiraInfo.trace.id) {
      Kadira.tracer.endLastEvent(kadiraInfo.trace);

      var errorForApm = _.pick(err, 'message', 'stack');
      Kadira.tracer.event(kadiraInfo.trace, 'error', {error: errorForApm});
      var trace = Kadira.tracer.buildTrace(kadiraInfo.trace);

      Kadira.models.pubsub._trackError(this._session, this, trace);

      // error tracking can be disabled and if there is a trace
      // trace should be avaialble all the time, but it won't
      // if something wrong happened on the trace building
      if(Kadira.options.enableErrorTracking && trace) {
        Kadira.models.error.trackError(err, trace);
      }
    }

    // wrap error stack so Meteor._debug can identify and ignore it
    err.stack = {stack: err.stack, source: 'subscription'};
    originalError.call(this, err);
  };

  var originalDeactivate = subscriptionProto._deactivate;
  subscriptionProto._deactivate = function() {
    Kadira.EventBus.emit('pubsub', 'subDeactivated', this._session, this);
    Kadira.models.pubsub._trackUnsub(this._session, this);
    originalDeactivate.call(this);
  };

  //adding the currenSub env variable
  ['added', 'changed', 'removed'].forEach(function(funcName) {
    var originalFunc = subscriptionProto[funcName];
    subscriptionProto[funcName] = function(collectionName, id, fields) {
      var self = this;

      // we need to run this code in a fiber and that's how we track
      // subscription info. May be we can figure out, some other way to do this
      // We use this currently to get the publication info when tracking message
      // sizes at wrap_ddp_stringify.js
      Kadira.env.currentSub = self;
      var res = originalFunc.call(self, collectionName, id, fields);
      Kadira.env.currentSub = null;

      return res;
    };
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/wrap_observers.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
wrapOplogObserveDriver = function(proto) {
  // Track the polled documents. This is reflect to the RAM size and
  // for the CPU usage directly
  var originalPublishNewResults = proto._publishNewResults;
  proto._publishNewResults = function(newResults, newBuffer) {
    var coll = this._cursorDescription.collectionName;
    var query = this._cursorDescription.selector;
    var opts = this._cursorDescription.options;
    var docSize = Kadira.docSzCache.getSize(coll, query, opts, newResults);
    var docSize = Kadira.docSzCache.getSize(coll, query, opts, newBuffer);
    var count = newResults.size() + newBuffer.size();
    if(this._ownerInfo) {
      Kadira.models.pubsub.trackPolledDocuments(this._ownerInfo, count);
      Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, "polledFetches", docSize*count);
    } else {
      this._polledDocuments = count;
      this._docSize = {
        polledFetches: docSize*count
      }
    }
    return originalPublishNewResults.call(this, newResults, newBuffer);
  };

  var originalHandleOplogEntryQuerying = proto._handleOplogEntryQuerying;
  proto._handleOplogEntryQuerying = function(op) {
    Kadira.models.pubsub.trackDocumentChanges(this._ownerInfo, op);
    return originalHandleOplogEntryQuerying.call(this, op);
  };

  var originalHandleOplogEntrySteadyOrFetching = proto._handleOplogEntrySteadyOrFetching;
  proto._handleOplogEntrySteadyOrFetching = function(op) {
    Kadira.models.pubsub.trackDocumentChanges(this._ownerInfo, op);
    return originalHandleOplogEntrySteadyOrFetching.call(this, op);
  };

  // track live updates
  ['_addPublished', '_removePublished', '_changePublished'].forEach(function(fnName) {
    var originalFn = proto[fnName];
    proto[fnName] = function(a, b, c) {
      if(this._ownerInfo) {
        Kadira.models.pubsub.trackLiveUpdates(this._ownerInfo, fnName, 1);

        if(fnName === "_addPublished") {
          var coll = this._cursorDescription.collectionName;
          var query = this._cursorDescription.selector;
          var opts = this._cursorDescription.options;
          var docSize = Kadira.docSzCache.getSize(coll, query, opts, [b]);

          Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, "liveFetches", docSize);
        }
      } else {
        // If there is no ownerInfo, that means this is the initial adds
        if(!this._liveUpdatesCounts) {
          this._liveUpdatesCounts = {
            _initialAdds: 0
          };
        }

        this._liveUpdatesCounts._initialAdds++;

        if(fnName === "_addPublished") {
          if(!this._docSize) {
            this._docSize = {
              initialFetches: 0
            };
          }

          if(!this._docSize.initialFetches) {
            this._docSize.initialFetches = 0;
          }

          var coll = this._cursorDescription.collectionName;
          var query = this._cursorDescription.selector;
          var opts = this._cursorDescription.options;
          var docSize = Kadira.docSzCache.getSize(coll, query, opts, [b]);

          this._docSize.initialFetches += docSize;
        }
      }

      return originalFn.call(this, a, b, c);
    };
  });

  var originalStop = proto.stop;
  proto.stop = function() {
    if(this._ownerInfo && this._ownerInfo.type === 'sub') {
      Kadira.EventBus.emit('pubsub', 'observerDeleted', this._ownerInfo);
      Kadira.models.pubsub.trackDeletedObserver(this._ownerInfo);
    }

    return originalStop.call(this);
  };
};

wrapPollingObserveDriver = function(proto) {
  var originalPollMongo = proto._pollMongo;
  proto._pollMongo = function() {
    var start = Date.now();
    originalPollMongo.call(this);

    // Current result is stored in the following variable.
    // So, we can use that
    // Sometimes, it's possible to get size as undefined.
    // May be something with different version. We don't need to worry about
    // this now
    var count = 0;
    var docSize = 0;

    if(this._results && this._results.size) {
      count = this._results.size() || 0;

      var coll = this._cursorDescription.collectionName;
      var query = this._cursorDescription.selector;
      var opts = this._cursorDescription.options;

      docSize = Kadira.docSzCache.getSize(coll, query, opts, this._results._map)*count;
    }

    if(this._ownerInfo) {
      Kadira.models.pubsub.trackPolledDocuments(this._ownerInfo, count);
      Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, "polledFetches", docSize);
    } else {
      this._polledDocuments = count;
      this._polledDocSize = docSize;
    }
  };

  var originalStop = proto.stop;
  proto.stop = function() {
    if(this._ownerInfo && this._ownerInfo.type === 'sub') {
      Kadira.EventBus.emit('pubsub', 'observerDeleted', this._ownerInfo);
      Kadira.models.pubsub.trackDeletedObserver(this._ownerInfo);
    }

    return originalStop.call(this);
  };
};

wrapMultiplexer = function(proto) {
  var originalInitalAdd = proto.addHandleAndSendInitialAdds;
   proto.addHandleAndSendInitialAdds = function(handle) {
    if(!this._firstInitialAddTime) {
      this._firstInitialAddTime = Date.now();
    }

    handle._wasMultiplexerReady = this._ready();
    handle._queueLength = this._queue._taskHandles.length;

    if(!handle._wasMultiplexerReady) {
      handle._elapsedPollingTime = Date.now() - this._firstInitialAddTime;
    }
    return originalInitalAdd.call(this, handle);
  };
};

wrapForCountingObservers = function() {
  // to count observers
  var mongoConnectionProto = MeteorX.MongoConnection.prototype;
  var originalObserveChanges = mongoConnectionProto._observeChanges;
  mongoConnectionProto._observeChanges = function(cursorDescription, ordered, callbacks) {
    var ret = originalObserveChanges.call(this, cursorDescription, ordered, callbacks);
    // get the Kadira Info via the Meteor.EnvironmentalVariable
    var kadiraInfo = Kadira._getInfo(null, true);

    if(kadiraInfo && ret._multiplexer) {
      if(!ret._multiplexer.__kadiraTracked) {
        // new multiplexer
        ret._multiplexer.__kadiraTracked = true;
        Kadira.EventBus.emit('pubsub', 'newSubHandleCreated', kadiraInfo.trace);
        Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, false);
        if(kadiraInfo.trace.type == 'sub') {
          var ownerInfo = {
            type: kadiraInfo.trace.type,
            name: kadiraInfo.trace.name,
            startTime: (new Date()).getTime()
          };

          var observerDriver = ret._multiplexer._observeDriver;
          observerDriver._ownerInfo = ownerInfo;
          Kadira.EventBus.emit('pubsub', 'observerCreated', ownerInfo);
          Kadira.models.pubsub.trackCreatedObserver(ownerInfo);

          // We need to send initially polled documents if there are
          if(observerDriver._polledDocuments) {
            Kadira.models.pubsub.trackPolledDocuments(ownerInfo, observerDriver._polledDocuments);
            observerDriver._polledDocuments = 0;
          }

          // We need to send initially polled documents if there are
          if(observerDriver._polledDocSize) {
            Kadira.models.pubsub.trackDocSize(ownerInfo.name, "polledFetches", observerDriver._polledDocSize);
            observerDriver._polledDocSize = 0;
          }

          // Process _liveUpdatesCounts
          _.each(observerDriver._liveUpdatesCounts, function(count, key) {
            Kadira.models.pubsub.trackLiveUpdates(ownerInfo, key, count);
          });

          // Process docSize
          _.each(observerDriver._docSize, function(count, key) {
            Kadira.models.pubsub.trackDocSize(ownerInfo.name, key, count);
          });
        }
      } else {
        Kadira.EventBus.emit('pubsub', 'cachedSubHandleCreated', kadiraInfo.trace);
        Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, true);
      }
    }

    return ret;
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/wrap_ddp_stringify.js                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
wrapStringifyDDP = function() {
  var originalStringifyDDP = DDPCommon.stringifyDDP;

  DDPCommon.stringifyDDP = function(msg) {
    var msgString = originalStringifyDDP(msg);
    var msgSize = Buffer.byteLength(msgString, 'utf8');

    var kadiraInfo = Kadira._getInfo(null, true);

    if(kadiraInfo) {
      if(kadiraInfo.trace.type === 'method') {
        Kadira.models.methods.trackMsgSize(kadiraInfo.trace.name, msgSize);
      }

      return msgString;
    }

    // 'currentSub' is set when we wrap Subscription object and override
    // handlers for 'added', 'changed', 'removed' events. (see lib/hijack/wrap_subscription.js)
    if(Kadira.env.currentSub) {
      if(Kadira.env.currentSub.__kadiraInfo){
        Kadira.models.pubsub.trackMsgSize(Kadira.env.currentSub._name, "initialSent", msgSize);
        return msgString;
      }
      Kadira.models.pubsub.trackMsgSize(Kadira.env.currentSub._name, "liveSent", msgSize);
      return msgString;
    }

    Kadira.models.methods.trackMsgSize("<not-a-method-or-a-pub>", msgSize);
    return msgString;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/instrument.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var logger = Npm.require('debug')('kadira:hijack:instrument');

var instrumented = false;
Kadira._startInstrumenting = function(callback) {
  if(instrumented) {
    callback();
    return;
  }

  instrumented = true;
  wrapStringifyDDP()
  MeteorX.onReady(function() {
    //instrumenting session
    wrapServer(MeteorX.Server.prototype);
    wrapSession(MeteorX.Session.prototype);
    wrapSubscription(MeteorX.Subscription.prototype);

    if(MeteorX.MongoOplogDriver) {
      wrapOplogObserveDriver(MeteorX.MongoOplogDriver.prototype);
    }

    if(MeteorX.MongoPollingDriver) {
      wrapPollingObserveDriver(MeteorX.MongoPollingDriver.prototype);
    }

    if(MeteorX.Multiplexer) {
      wrapMultiplexer(MeteorX.Multiplexer.prototype);
    }

    wrapForCountingObservers();
    hijackDBOps();

    setLabels();
    callback();
  });
};

// We need to instrument this rightaway and it's okay
// One reason for this is to call `setLables()` function
// Otherwise, CPU profile can't see all our custom labeling
if (process.env.KADIRA_APP_ID && process.env.KADIRA_APP_SECRET) {
  Kadira._startInstrumenting(function() {
    console.log('Kadira: completed instrumenting the app')
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/db.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// This hijack is important to make sure, collections created before
// we hijack dbOps, even gets tracked.
//  Meteor does not simply expose MongoConnection object to the client
//  It picks methods which are necessory and make a binded object and
//  assigned to the Mongo.Collection
//  so, even we updated prototype, we can't track those collections
//  but, this will fix it.
var originalOpen = MongoInternals.RemoteCollectionDriver.prototype.open;
MongoInternals.RemoteCollectionDriver.prototype.open = function open(name) {
  var self = this;
  var ret = originalOpen.call(self, name);

  _.each(ret, function(fn, m) {
    // make sure, it's in the actual mongo connection object
    // meteorhacks:mongo-collection-utils package add some arbitary methods
    // which does not exist in the mongo connection
    if(self.mongo[m]) {
      ret[m] = function() {
        Array.prototype.unshift.call(arguments, name);
        return OptimizedApply(self.mongo, self.mongo[m], arguments);
      };
    }
  });

  return ret;
};

hijackDBOps = function hijackDBOps() {
  var mongoConnectionProto = MeteorX.MongoConnection.prototype;
  //findOne is handled by find - so no need to track it
  //upsert is handles by update
  ['find', 'update', 'remove', 'insert', '_ensureIndex', '_dropIndex'].forEach(function(func) {
    var originalFunc = mongoConnectionProto[func];
    mongoConnectionProto[func] = function(collName, selector, mod, options) {
      var payload = {
        coll: collName,
        func: func,
      };

      if(func == 'insert') {
        //add nothing more to the payload
      } else if(func == '_ensureIndex' || func == '_dropIndex') {
        //add index
        payload.index = JSON.stringify(selector);
      } else if(func == 'update' && options && options.upsert) {
        payload.func = 'upsert';
        payload.selector = JSON.stringify(selector);
      } else {
        //all the other functions have selectors
        payload.selector = JSON.stringify(selector);
      }

      var kadiraInfo = Kadira._getInfo();
      if(kadiraInfo) {
        var eventId = Kadira.tracer.event(kadiraInfo.trace, 'db', payload);
      }

      //this cause V8 to avoid any performance optimizations, but this is must to use
      //otherwise, if the error adds try catch block our logs get messy and didn't work
      //see: issue #6
      try{
        var ret = originalFunc.apply(this, arguments);
        //handling functions which can be triggered with an asyncCallback
        var endOptions = {};

        if(HaveAsyncCallback(arguments)) {
          endOptions.async = true;
        }

        if(func == 'update') {
          // upsert only returns an object when called `upsert` directly
          // otherwise it only act an update command
          if(options && options.upsert && typeof ret == 'object') {
            endOptions.updatedDocs = ret.numberAffected;
            endOptions.insertedId = ret.insertedId;
          } else {
            endOptions.updatedDocs = ret;
          }
        } else if(func == 'remove') {
          endOptions.removedDocs = ret;
        }

        if(eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endOptions);
        }
      } catch(ex) {
        if(eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});
        }
        throw ex;
      }

      return ret;
    };
  });

  var cursorProto = MeteorX.MongoCursor.prototype;
  ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe', 'rewind'].forEach(function(type) {
    var originalFunc = cursorProto[type];
    cursorProto[type] = function() {
      var cursorDescription = this._cursorDescription;
      var payload = {
        coll: cursorDescription.collectionName,
        selector: JSON.stringify(cursorDescription.selector),
        func: type,
        cursor: true
      };

      if(cursorDescription.options) {
        var cursorOptions = _.pick(cursorDescription.options, ['fields', 'sort', 'limit']);
        for(var field in cursorOptions) {
          var value = cursorOptions[field]
          if(typeof value == 'object') {
            value = JSON.stringify(value);
          }
          payload[field] = value;
        }
      };

      var kadiraInfo = Kadira._getInfo();
      if(kadiraInfo) {
        var eventId = Kadira.tracer.event(kadiraInfo.trace, 'db', payload);
      }

      try{
        var ret = originalFunc.apply(this, arguments);

        var endData = {};
        if(type == 'observeChanges' || type == 'observe') {
          var observerDriver;
          endData.oplog = false;
          // get data written by the multiplexer
          endData.wasMultiplexerReady = ret._wasMultiplexerReady;
          endData.queueLength = ret._queueLength;
          endData.elapsedPollingTime = ret._elapsedPollingTime;

          if(ret._multiplexer) {
            // older meteor versions done not have an _multiplexer value
            observerDriver = ret._multiplexer._observeDriver;
            if(observerDriver) {
              observerDriver = ret._multiplexer._observeDriver;
              var observerDriverClass = observerDriver.constructor;
              var usesOplog = typeof observerDriverClass.cursorSupported == 'function';
              endData.oplog = usesOplog;
              var size = 0;
              ret._multiplexer._cache.docs.forEach(function() {size++});
              endData.noOfCachedDocs = size;

              // if multiplexerWasNotReady, we need to get the time spend for the polling
              if(!ret._wasMultiplexerReady) {
                endData.initialPollingTime = observerDriver._lastPollTime;
              }
            }
          }

          if(!endData.oplog) {
            // let's try to find the reason
            var reasonInfo = Kadira.checkWhyNoOplog(cursorDescription, observerDriver);
            endData.noOplogCode = reasonInfo.code;
            endData.noOplogReason = reasonInfo.reason;
            endData.noOplogSolution = reasonInfo.solution;
          }
        } else if(type == 'fetch' || type == 'map'){
          //for other cursor operation

          endData.docsFetched = ret.length;

          if(type == 'fetch') {
            var coll = cursorDescription.collectionName;
            var query = cursorDescription.selector;
            var opts = cursorDescription.options;
            var docSize = Kadira.docSzCache.getSize(coll, query, opts, ret) * ret.length;
            endData.docSize = docSize;

            if(kadiraInfo) {
              if(kadiraInfo.trace.type === 'method') {
                Kadira.models.methods.trackDocSize(kadiraInfo.trace.name, docSize);
              } else if(kadiraInfo.trace.type === 'sub') {
                Kadira.models.pubsub.trackDocSize(kadiraInfo.trace.name, "cursorFetches", docSize);
              }
            } else {
              // Fetch with no kadira info are tracked as from a null method
              Kadira.models.methods.trackDocSize("<not-a-method-or-a-pub>", docSize);
            }

            // TODO: Add doc size tracking to `map` as well.
          }
        }

        if(eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endData);
        }
        return ret;
      } catch(ex) {
        if(eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});
        }
        throw ex;
      }
    };
  });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/http.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var originalCall = HTTP.call;

HTTP.call = function(method, url) {
  var kadiraInfo = Kadira._getInfo();
  if(kadiraInfo) {
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'http', {method: method, url: url});
  }

  try {
    var response = originalCall.apply(this, arguments);

    //if the user supplied an asynCallback, we don't have a response object and it handled asynchronously
    //we need to track it down to prevent issues like: #3
    var endOptions = HaveAsyncCallback(arguments)? {async: true}: {statusCode: response.statusCode};
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endOptions);
    }
    return response;
  } catch(ex) {
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});
    }
    throw ex;
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/email.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var originalSend = Email.send;

Email.send = function(options) {
  var kadiraInfo = Kadira._getInfo();
  if(kadiraInfo) {
    var data = _.pick(options, 'from', 'to', 'cc', 'bcc', 'replyTo');
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'email', data);
  }
  try {
    var ret = originalSend.call(this, options);
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId);
    }
    return ret;
  } catch(ex) {
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});
    }
    throw ex;
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/async.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fibers = Npm.require('fibers');

var originalYield = Fibers.yield;
Fibers.yield = function() {
  var kadiraInfo = Kadira._getInfo();
  if(kadiraInfo) {
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'async');;
    if(eventId) {
      Fibers.current._apmEventId = eventId;
    }
  }

  return originalYield();
};

var originalRun = Fibers.prototype.run;
Fibers.prototype.run = function(val) {
  if(this._apmEventId) {
    var kadiraInfo = Kadira._getInfo(this);
    if(kadiraInfo) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, this._apmEventId);
      this._apmEventId = null;
    }
  }
  return originalRun.call(this, val);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/error.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
TrackUncaughtExceptions = function () {
  process.on('uncaughtException', function (err) {
    // skip errors with `_skipKadira` flag
    if(err._skipKadira) {
      return;
    }

    // let the server crash normally if error tracking is disabled
    if(!Kadira.options.enableErrorTracking) {
      printErrorAndKill(err);
    }

    // looking for already tracked errors and throw them immediately
    // throw error immediately if kadira is not ready
    if(err._tracked || !Kadira.connected) {
      printErrorAndKill(err);
    }

    var trace = getTrace(err, 'server-crash', 'uncaughtException');
    Kadira.models.error.trackError(err, trace);
    Kadira._sendPayload(function () {
      clearTimeout(timer);

      // error successfully reported to kadira, show it and continue
      console.error('Uncaught exception:', err.stack);
    });

    var timer = setTimeout(function () {
      throwError(err);
    }, 1000*10);

    function throwError(err) {
      // sometimes error came back from a fiber.
      // But we don't fibers to track that error for us
      // That's why we throw the error on the nextTick
      process.nextTick(function() {
        // we need to mark this error where we really need to throw
        err._tracked = true;
        printErrorAndKill(err);
      });
    }
  });

  function printErrorAndKill(err) {
    // since we are capturing error, we are also on the error message.
    // so developers think we are also reponsible for the error.
    // But we are not. This will fix that.
    console.error(err.stack);
    process.exit(7);
  }
}

TrackMeteorDebug = function () {
  var originalMeteorDebug = Meteor._debug;
  Meteor._debug = function (message, stack) {
    if(!Kadira.options.enableErrorTracking) {
      return originalMeteorDebug.call(this, message, stack);
    }

    // We've changed `stack` into an object at method and sub handlers so we can
    // ignore them here. These errors are already tracked so don't track again.
    if(stack && stack.stack) {
      stack = stack.stack
    } else {
      // only send to the server, if only connected to kadira
      if(Kadira.connected) {
        var error = new Error(message);
        error.stack = stack;
        var trace = getTrace(error, 'server-internal', 'Meteor._debug');
        Kadira.models.error.trackError(error, trace);
      }
    }

    return originalMeteorDebug.apply(this, arguments);
  }
}

function getTrace(err, type, subType) {
  return {
    type: type,
    subType: subType,
    name: err.message,
    errored: true,
    at: Kadira.syncedDate.getTime(),
    events: [
      ['start', 0, {}],
      ['error', 0, {error: {message: err.message, stack: err.stack}}]
    ],
    metrics: {
      total: 0
    }
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/hijack/set_labels.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
setLabels = function () {
  // name Session.prototype.send
  var originalSend = MeteorX.Session.prototype.send;
  MeteorX.Session.prototype.send = function kadira_Session_send (msg) {
    return originalSend.call(this, msg);
  }

  // name Multiplexer initial adds
  var originalSendAdds = MeteorX.Multiplexer.prototype._sendAdds;
  MeteorX.Multiplexer.prototype._sendAdds = function kadira_Multiplexer_sendAdds (handle) {
    return originalSendAdds.call(this, handle);
  }

  // name MongoConnection insert
  var originalMongoInsert = MeteorX.MongoConnection.prototype._insert;
  MeteorX.MongoConnection.prototype._insert = function kadira_MongoConnection_insert (coll, doc, cb) {
    return originalMongoInsert.call(this, coll, doc, cb);
  }

  // name MongoConnection update
  var originalMongoUpdate = MeteorX.MongoConnection.prototype._update;
  MeteorX.MongoConnection.prototype._update = function kadira_MongoConnection_update (coll, selector, mod, options, cb) {
    return originalMongoUpdate.call(this, coll, selector, mod, options, cb);
  }

  // name MongoConnection remove
  var originalMongoRemove = MeteorX.MongoConnection.prototype._remove;
  MeteorX.MongoConnection.prototype._remove = function kadira_MongoConnection_remove (coll, selector, cb) {
    return originalMongoRemove.call(this, coll, selector, cb);
  }

  // name Pubsub added
  var originalPubsubAdded = MeteorX.Session.prototype.sendAdded;
  MeteorX.Session.prototype.sendAdded = function kadira_Session_sendAdded (coll, id, fields) {
    return originalPubsubAdded.call(this, coll, id, fields);
  }

  // name Pubsub changed
  var originalPubsubChanged = MeteorX.Session.prototype.sendChanged;
  MeteorX.Session.prototype.sendChanged = function kadira_Session_sendChanged (coll, id, fields) {
    return originalPubsubChanged.call(this, coll, id, fields);
  }

  // name Pubsub removed
  var originalPubsubRemoved = MeteorX.Session.prototype.sendRemoved;
  MeteorX.Session.prototype.sendRemoved = function kadira_Session_sendRemoved (coll, id) {
    return originalPubsubRemoved.call(this, coll, id);
  }

  // name MongoCursor forEach
  var originalCursorForEach = MeteorX.MongoCursor.prototype.forEach;
  MeteorX.MongoCursor.prototype.forEach = function kadira_Cursor_forEach () {
    return originalCursorForEach.apply(this, arguments);
  }

  // name MongoCursor map
  var originalCursorMap = MeteorX.MongoCursor.prototype.map;
  MeteorX.MongoCursor.prototype.map = function kadira_Cursor_map () {
    return originalCursorMap.apply(this, arguments);
  }

  // name MongoCursor fetch
  var originalCursorFetch = MeteorX.MongoCursor.prototype.fetch;
  MeteorX.MongoCursor.prototype.fetch = function kadira_Cursor_fetch () {
    return originalCursorFetch.apply(this, arguments);
  }

  // name MongoCursor count
  var originalCursorCount = MeteorX.MongoCursor.prototype.count;
  MeteorX.MongoCursor.prototype.count = function kadira_Cursor_count () {
    return originalCursorCount.apply(this, arguments);
  }

  // name MongoCursor observeChanges
  var originalCursorObserveChanges = MeteorX.MongoCursor.prototype.observeChanges;
  MeteorX.MongoCursor.prototype.observeChanges = function kadira_Cursor_observeChanges () {
    return originalCursorObserveChanges.apply(this, arguments);
  }

  // name MongoCursor observe
  var originalCursorObserve = MeteorX.MongoCursor.prototype.observe;
  MeteorX.MongoCursor.prototype.observe = function kadira_Cursor_observe () {
    return originalCursorObserve.apply(this, arguments);
  }

  // name MongoCursor rewind
  var originalCursorRewind = MeteorX.MongoCursor.prototype.rewind;
  MeteorX.MongoCursor.prototype.rewind = function kadira_Cursor_rewind () {
    return originalCursorRewind.apply(this, arguments);
  }

  // name CrossBar listen
  var originalCrossbarListen = DDPServer._Crossbar.prototype.listen;
  DDPServer._Crossbar.prototype.listen = function kadira_Crossbar_listen (trigger, callback) {
    return originalCrossbarListen.call(this, trigger, callback);
  }

  // name CrossBar fire
  var originalCrossbarFire = DDPServer._Crossbar.prototype.fire;
  DDPServer._Crossbar.prototype.fire = function kadira_Crossbar_fire (notification) {
    return originalCrossbarFire.call(this, notification);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/environment_variables.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Kadira._parseEnv = function (env) {
  var options = {};
  for(var name in env) {
    var info = Kadira._parseEnv._options[name];
    var value = env[name];
    if(info && value) {
      options[info.name] = info.parser(value);
    }
  }

  return options;
};


Kadira._parseEnv.parseInt = function (str) {
  var num = parseInt(str);
  if(num || num === 0) return num;
  throw new Error('Kadira: Match Error: "'+num+'" is not a number');
};


Kadira._parseEnv.parseBool = function (str) {
  str = str.toLowerCase();
  if(str === 'true') return true;
  if(str === 'false') return false;
  throw new Error('Kadira: Match Error: '+str+' is not a boolean');
};


Kadira._parseEnv.parseUrl = function (str) {
  return str;
};


Kadira._parseEnv.parseString = function (str) {
  return str;
};


Kadira._parseEnv._options = {
  // delay to send the initial ping to the kadira engine after page loads
  KADIRA_OPTIONS_CLIENT_ENGINE_SYNC_DELAY: {
    name: 'clientEngineSyncDelay',
    parser: Kadira._parseEnv.parseInt,
  },
  // time between sending errors to the engine
  KADIRA_OPTIONS_ERROR_DUMP_INTERVAL: {
    name: 'errorDumpInterval',
    parser: Kadira._parseEnv.parseInt,
  },
  // no of errors allowed in a given interval
  KADIRA_OPTIONS_MAX_ERRORS_PER_INTERVAL: {
    name: 'maxErrorsPerInterval',
    parser: Kadira._parseEnv.parseInt,
  },
  // a zone.js specific option to collect the full stack trace(which is not much useful)
  KADIRA_OPTIONS_COLLECT_ALL_STACKS: {
    name: 'collectAllStacks',
    parser: Kadira._parseEnv.parseBool,
  },
  // enable error tracking (which is turned on by default)
  KADIRA_OPTIONS_ENABLE_ERROR_TRACKING: {
    name: 'enableErrorTracking',
    parser: Kadira._parseEnv.parseBool,
  },
  // kadira engine endpoint
  KADIRA_OPTIONS_ENDPOINT: {
    name: 'endpoint',
    parser: Kadira._parseEnv.parseUrl,
  },
  // define the hostname of the current running process
  KADIRA_OPTIONS_HOSTNAME: {
    name: 'hostname',
    parser: Kadira._parseEnv.parseString,
  },
  // interval between sending data to the kadira engine from the server
  KADIRA_OPTIONS_PAYLOAD_TIMEOUT: {
    name: 'payloadTimeout',
    parser: Kadira._parseEnv.parseInt,
  },
  // set HTTP/HTTPS proxy
  KADIRA_OPTIONS_PROXY: {
    name: 'proxy',
    parser: Kadira._parseEnv.parseUrl,
  },
  // number of items cached for tracking document size
  KADIRA_OPTIONS_DOCUMENT_SIZE_CACHE_SIZE: {
    name: 'documentSizeCacheSize',
    parser: Kadira._parseEnv.parseInt,
  },
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/auto_connect.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Kadira._connectWithEnv = function() {
  if(process.env.KADIRA_APP_ID && process.env.KADIRA_APP_SECRET) {
    var options = Kadira._parseEnv(process.env);

    Kadira.connect(
      process.env.KADIRA_APP_ID,
      process.env.KADIRA_APP_SECRET,
      options
    );

    Kadira.connect = function() {
      throw new Error('Kadira has been already connected using credentials from Environment Variables');
    };
  }
};


Kadira._connectWithSettings = function () {
  if(
    Meteor.settings.kadira &&
    Meteor.settings.kadira.appId &&
    Meteor.settings.kadira.appSecret
  ) {
    Kadira.connect(
      Meteor.settings.kadira.appId,
      Meteor.settings.kadira.appSecret,
      Meteor.settings.kadira.options || {}
    );

    Kadira.connect = function() {
      throw new Error('Kadira has been already connected using credentials from Meteor.settings');
    };
  }
};


// Try to connect automatically
Kadira._connectWithEnv();
Kadira._connectWithSettings();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/common/default_error_filters.js                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var commonErrRegExps = [
  /connection timeout\. no (\w*) heartbeat received/i,
  /INVALID_STATE_ERR/i,
];

Kadira.errorFilters = {
  filterValidationErrors: function(type, message, err) {
    if(err && err instanceof Meteor.Error) {
      return false;
    } else {
      return true;
    }
  },

  filterCommonMeteorErrors: function(type, message) {
    for(var lc=0; lc<commonErrRegExps.length; lc++) {
      var regExp = commonErrRegExps[lc];
      if(regExp.test(message)) {
        return false;
      }
    }
    return true;
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_monitoring/lib/common/send.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Kadira.send = function (payload, path, callback) {
  if(!Kadira.connected)  {
    throw new Error("You need to connect with Kadira first, before sending messages!");
  }

  path = (path.substr(0, 1) != '/')? "/" + path : path;
  var endpoint = Kadira.options.endpoint + path;
  var retryCount = 0;
  var retry = new Retry({
    minCount: 1,
    minTimeout: 0,
    baseTimeout: 1000*5,
    maxTimeout: 1000*60,
  });

  var sendFunction = Kadira._getSendFunction();
  tryToSend();

  function tryToSend(err) {
    if(retryCount < 5) {
      retry.retryLater(retryCount++, send);
    } else {
      console.warn('Error sending error traces to kadira server');
      if(callback) callback(err);
    }
  }

  function send() {
    sendFunction(endpoint, payload, function(err, content, statusCode) {
      if(err) {
        tryToSend(err);
      } else if(statusCode == 200){
        if(callback) callback(null, content);
      } else {
        if(callback) callback(new Meteor.Error(statusCode, content));
      }
    });
  }
};

Kadira._getSendFunction = function() {
  return (Meteor.isServer)? Kadira._serverSend : Kadira._clientSend;
};

Kadira._clientSend = function (endpoint, payload, callback) {
  $.ajax({
    type: 'POST',
    url: endpoint,
    contentType: 'application/json',
    data: JSON.stringify(payload),
    error: function(err) {
      callback(err);
    },
    success: function(data) {
      callback(null, data, 200);
    }
  }); 
}

Kadira._serverSend = function (endpoint, payload, callback) {
  callback = callback || function() {};
  var Fiber = Npm.require('fibers');
  new Fiber(function() {
    var httpOptions = {
      data: payload,
      headers: Kadira.options.authHeaders
    };

    HTTP.call('POST', endpoint, httpOptions, function(err, res) {
      if(res) {
        var content = (res.statusCode == 200)? res.data : res.content;
        callback(null, content, res.statusCode);
      } else {
        callback(err);
      }  
    });
  }).run();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("rocketchat:monitoring", {
  Kadira: Kadira
});

})();
