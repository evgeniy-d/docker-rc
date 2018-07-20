(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var __coffeescriptShare, incrementCounter, decrementCounter, setCounter, deleteCounters;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/konecty_mongo-counter/counter.coffee.js                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var callCounter, getCounterCollection, _decrementCounter, _deleteCounters, _incrementCounter, _setCounter,                                                                
  __slice = [].slice;

getCounterCollection = function(collection) {
  return collection.rawCollection();
};

callCounter = function() {
  var Counters, args, collection, future, method, _ref;
  method = arguments[0], collection = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  Counters = getCounterCollection(collection);
  if (Meteor.wrapAsync != null) {
    return Meteor.wrapAsync(_.bind(Counters[method], Counters)).apply(null, args);
  } else {
    future = new (Npm.require(Npm.require('path').join('fibers', 'future')))();
    (_ref = Counters[method]).call.apply(_ref, [Counters].concat(__slice.call(args), [future.resolver()]));
    return future.wait();
  }
};

_deleteCounters = function(collection) {
  return callCounter('remove', collection, {}, {
    safe: true
  });
};

_incrementCounter = function(collection, counterName, amount) {
  var newDoc, _ref;
  if (amount == null) {
    amount = 1;
  }
  newDoc = callCounter('findAndModify', collection, {
    _id: counterName
  }, null, {
    $inc: {
      next_val: amount
    }
  }, {
    "new": true,
    upsert: true
  });
  return (newDoc != null ? (_ref = newDoc.value) != null ? _ref.next_val : void 0 : void 0) || newDoc.next_val;
};

_decrementCounter = function(collection, counterName, amount) {
  if (amount == null) {
    amount = 1;
  }
  return _incrementCounter(collection, counterName, -amount);
};

_setCounter = function(collection, counterName, value) {
  callCounter('update', collection, {
    _id: counterName
  }, {
    $set: {
      next_val: value
    }
  });
};

if (typeof Package !== "undefined" && Package !== null) {
  incrementCounter = _incrementCounter;
  decrementCounter = _decrementCounter;
  setCounter = _setCounter;
  deleteCounters = _deleteCounters;
} else {
  this.incrementCounter = _incrementCounter;
  this.decrementCounter = _decrementCounter;
  this.setCounter = _setCounter;
  this.deleteCounters = _deleteCounters;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/konecty_mongo-counter/tests.counter.coffee.js                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("konecty:mongo-counter", {
  incrementCounter: incrementCounter,
  decrementCounter: decrementCounter,
  setCounter: setCounter,
  deleteCounters: deleteCounters
});

})();
