(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;

/* Package-scope variables */
var DDPCommon;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/dispatch_run-as-user/packages/dispatch_run-as-user.js                                             //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/dispatch:run-as-user/lib/pre.1.0.3.js                                                      //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// This code will go away in later versions of Meteor, this is just a "polyfill"                       // 1
// until the next release of Meteor maybe 1.0.3?                                                       // 2
//                                                                                                     // 3
if (typeof DDPCommon === 'undefined') {                                                                // 4
  DDPCommon = {};                                                                                      // 5
                                                                                                       // 6
  DDPCommon.MethodInvocation = function (options) {                                                    // 7
    var self = this;                                                                                   // 8
                                                                                                       // 9
    // true if we're running not the actual method, but a stub (that is,                               // 10
    // if we're on a client (which may be a browser, or in the future a                                // 11
    // server connecting to another server) and presently running a                                    // 12
    // simulation of a server-side method for latency compensation                                     // 13
    // purposes). not currently true except in a client such as a browser,                             // 14
    // since there's usually no point in running stubs unless you have a                               // 15
    // zero-latency connection to the user.                                                            // 16
                                                                                                       // 17
    /**                                                                                                // 18
     * @summary Access inside a method invocation.  Boolean value, true if this invocation is a stub.  // 19
     * @locus Anywhere                                                                                 // 20
     * @name  isSimulation                                                                             // 21
     * @memberOf MethodInvocation                                                                      // 22
     * @instance                                                                                       // 23
     * @type {Boolean}                                                                                 // 24
     */                                                                                                // 25
    this.isSimulation = options.isSimulation;                                                          // 26
                                                                                                       // 27
    // call this function to allow other method invocations (from the                                  // 28
    // same client) to continue running without waiting for this one to                                // 29
    // complete.                                                                                       // 30
    this._unblock = options.unblock || function () {};                                                 // 31
    this._calledUnblock = false;                                                                       // 32
                                                                                                       // 33
    // current user id                                                                                 // 34
                                                                                                       // 35
    /**                                                                                                // 36
     * @summary The id of the user that made this method call, or `null` if no user was logged in.     // 37
     * @locus Anywhere                                                                                 // 38
     * @name  userId                                                                                   // 39
     * @memberOf MethodInvocation                                                                      // 40
     * @instance                                                                                       // 41
     */                                                                                                // 42
    this.userId = options.userId;                                                                      // 43
                                                                                                       // 44
    // sets current user id in all appropriate server contexts and                                     // 45
    // reruns subscriptions                                                                            // 46
    this._setUserId = options.setUserId || function () {};                                             // 47
                                                                                                       // 48
    // On the server, the connection this method call came in on.                                      // 49
                                                                                                       // 50
    /**                                                                                                // 51
     * @summary Access inside a method invocation. The [connection](#meteor_onconnection) that this method was received on. `null` if the method is not associated with a connection, eg. a server initiated method call.
     * @locus Server                                                                                   // 53
     * @name  connection                                                                               // 54
     * @memberOf MethodInvocation                                                                      // 55
     * @instance                                                                                       // 56
     */                                                                                                // 57
    this.connection = options.connection;                                                              // 58
                                                                                                       // 59
    // The seed for randomStream value generation                                                      // 60
    this.randomSeed = options.randomSeed;                                                              // 61
                                                                                                       // 62
    // This is set by RandomStream.get; and holds the random stream state                              // 63
    this.randomStream = null;                                                                          // 64
  };                                                                                                   // 65
                                                                                                       // 66
  _.extend(DDPCommon.MethodInvocation.prototype, {                                                     // 67
    /**                                                                                                // 68
     * @summary Call inside a method invocation.  Allow subsequent method from this client to begin running in a new fiber.
     * @locus Server                                                                                   // 70
     * @memberOf MethodInvocation                                                                      // 71
     * @instance                                                                                       // 72
     */                                                                                                // 73
    unblock: function () {                                                                             // 74
      var self = this;                                                                                 // 75
      self._calledUnblock = true;                                                                      // 76
      self._unblock();                                                                                 // 77
    },                                                                                                 // 78
                                                                                                       // 79
    /**                                                                                                // 80
     * @summary Set the logged in user.                                                                // 81
     * @locus Server                                                                                   // 82
     * @memberOf MethodInvocation                                                                      // 83
     * @instance                                                                                       // 84
     * @param {String | null} userId The value that should be returned by `userId` on this connection. // 85
     */                                                                                                // 86
    setUserId: function (userId) {                                                                     // 87
      var self = this;                                                                                 // 88
      if (self._calledUnblock)                                                                         // 89
        throw new Error("Can't call setUserId in a method after calling unblock");                     // 90
      self.userId = userId;                                                                            // 91
      // self._setUserId(userId);                                                                      // 92
    }                                                                                                  // 93
                                                                                                       // 94
  });                                                                                                  // 95
}                                                                                                      // 96
                                                                                                       // 97
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/dispatch:run-as-user/lib/common.js                                                         //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// This file adds the actual "Meteor.runAsUser" and "Meteor.isRestricted" api                          // 1
//                                                                                                     // 2
// It's done by using a DDP method invocation, setting a user id and a                                 // 3
// "isRestricted" flag on it.                                                                          // 4
//                                                                                                     // 5
// If run inside of an existing DDP invocation a nested version will be created.                       // 6
                                                                                                       // 7
var restrictedMode = new Meteor.EnvironmentVariable();                                                 // 8
                                                                                                       // 9
/**                                                                                                    // 10
 * Returns true if inside a runAsUser user scope                                                       // 11
 * @return {Boolean} True if in a runAsUser user scope                                                 // 12
 */                                                                                                    // 13
Meteor.isRestricted = function () {                                                                    // 14
  return !!restrictedMode.get();                                                                       // 15
};                                                                                                     // 16
                                                                                                       // 17
/**                                                                                                    // 18
 * Run code restricted                                                                                 // 19
 * @param  {Function} f Code to run in restricted mode                                                 // 20
 * @return {Any}   Result of code running                                                              // 21
 */                                                                                                    // 22
Meteor.runRestricted = function(f) {                                                                   // 23
  if (Meteor.isRestricted()) {                                                                         // 24
    return f();                                                                                        // 25
  } else {                                                                                             // 26
    return restrictedMode.withValue(true, f);                                                          // 27
  }                                                                                                    // 28
};                                                                                                     // 29
                                                                                                       // 30
/**                                                                                                    // 31
 * Run code unrestricted                                                                               // 32
 * @param  {Function} f Code to run in restricted mode                                                 // 33
 * @return {Any}   Result of code running                                                              // 34
 */                                                                                                    // 35
Meteor.runUnrestricted = function(f) {                                                                 // 36
  if (Meteor.isRestricted()) {                                                                         // 37
    return restrictedMode.withValue(false, f);                                                         // 38
  } else {                                                                                             // 39
    f();                                                                                               // 40
  }                                                                                                    // 41
};                                                                                                     // 42
                                                                                                       // 43
/**                                                                                                    // 44
 * Run as a user                                                                                       // 45
 * @param  {String} userId The id of user to run as                                                    // 46
 * @param  {Function} f      Function to run as user                                                   // 47
 * @return {Any} Returns function result                                                               // 48
 */                                                                                                    // 49
Meteor.runAsUser = function (userId, f) {                                                              // 50
  var currentInvocation = DDP._CurrentInvocation.get();                                                // 51
                                                                                                       // 52
  // Create a new method invocation                                                                    // 53
  var invocation = new DDPCommon.MethodInvocation(                                                     // 54
    (currentInvocation) ? currentInvocation : {                                                        // 55
      connection: null                                                                                 // 56
    }                                                                                                  // 57
  );                                                                                                   // 58
                                                                                                       // 59
  // Now run as user on this invocation                                                                // 60
  invocation.setUserId(userId);                                                                        // 61
                                                                                                       // 62
  return DDP._CurrentInvocation.withValue(invocation, function () {                                    // 63
    return f.apply(invocation, [userId]);                                                              // 64
  });                                                                                                  // 65
};                                                                                                     // 66
                                                                                                       // 67
/**                                                                                                    // 68
 * Run as restricted user                                                                              // 69
 * @param  {Function} f Function to run unrestricted                                                   // 70
 * @return {Any}   Returns function result                                                             // 71
 */                                                                                                    // 72
Meteor.runAsRestrictedUser = function(userId, f) {                                                     // 73
  return Meteor.runRestricted(function() {                                                             // 74
    return Meteor.runAsUser(userId, f);                                                                // 75
  });                                                                                                  // 76
};                                                                                                     // 77
                                                                                                       // 78
var adminMode = new Meteor.EnvironmentVariable();                                                      // 79
                                                                                                       // 80
/**                                                                                                    // 81
 * Check if code is running isside an invocation / method                                              // 82
 */                                                                                                    // 83
Meteor.isAdmin = function() {                                                                          // 84
  return !!adminMode.get();                                                                            // 85
};                                                                                                     // 86
                                                                                                       // 87
/**                                                                                                    // 88
 * Make the function run outside invocation                                                            // 89
 */                                                                                                    // 90
Meteor.runAsAdmin = function(f) {                                                                      // 91
  if (Meteor.isAdmin()) {                                                                              // 92
    return f();                                                                                        // 93
  } else {                                                                                             // 94
    return adminMode.withValue(false, f);                                                              // 95
  }                                                                                                    // 96
};                                                                                                     // 97
                                                                                                       // 98
/**                                                                                                    // 99
 * Make sure code runs outside an invocation on the                                                    // 100
 * server                                                                                              // 101
 */                                                                                                    // 102
Meteor.runOutsideInvocation = function(f) {                                                            // 103
  if (Meteor.isServer && DDP._CurrentInvocation.get()) {                                               // 104
    DDP._CurrentInvocation.withValue(null, f);                                                         // 105
  } else {                                                                                             // 106
    f();                                                                                               // 107
  }                                                                                                    // 108
};                                                                                                     // 109
                                                                                                       // 110
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/dispatch:run-as-user/lib/collection.overwrites.js                                          //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// This file overwrites the default metoer Mongo.Collection modifiers: "insert",                       // 1
// "update", "remove"                                                                                  // 2
//                                                                                                     // 3
// The new methods are checking if Meteor is in "restricted" mode to apply                             // 4
// allow and deny rules if needed.                                                                     // 5
//                                                                                                     // 6
// This will allow us to run the modifiers inside of a "Meteor.runAsUser" with                         // 7
// security checks.                                                                                    // 8
_.each(['insert', 'update', 'remove'], function (method) {                                             // 9
                                                                                                       // 10
  var _super = Mongo.Collection.prototype[method];                                                     // 11
                                                                                                       // 12
  Mongo.Collection.prototype[method] = function ( /* arguments */ ) {                                  // 13
    var self = this;                                                                                   // 14
    var args = _.toArray(arguments);                                                                   // 15
                                                                                                       // 16
    // Check if this method is run in restricted mode and collection is                                // 17
    // restricted.                                                                                     // 18
    if (Meteor.isRestricted() && self._restricted) {                                                   // 19
                                                                                                       // 20
      var generatedId = null;                                                                          // 21
      if (method === 'insert' && !_.has(args[0], '_id')) {                                             // 22
        generatedId = self._makeNewID();                                                               // 23
      }                                                                                                // 24
                                                                                                       // 25
      // short circuit if there is no way it will pass.                                                // 26
      if (self._validators[method].allow.length === 0) {                                               // 27
        throw new Meteor.Error(                                                                        // 28
          403, 'Access denied. No allow validators set on restricted ' +                               // 29
          'collection for method \'' + method + '\'.');                                                // 30
      }                                                                                                // 31
                                                                                                       // 32
      var validatedMethodName =                                                                        // 33
        '_validated' + method.charAt(0).toUpperCase() + method.slice(1);                               // 34
      args.unshift(Meteor.userId());                                                                   // 35
                                                                                                       // 36
      if (method === 'insert') {                                                                       // 37
        args.push(generatedId);                                                                        // 38
                                                                                                       // 39
        self[validatedMethodName].apply(self, args);                                                   // 40
        // xxx: for now we return the id since self._validatedInsert doesn't                           // 41
        // yet return the new id                                                                       // 42
        return generatedId || args[0]._id;                                                             // 43
                                                                                                       // 44
      }                                                                                                // 45
                                                                                                       // 46
      return self[validatedMethodName].apply(self, args);                                              // 47
                                                                                                       // 48
    }                                                                                                  // 49
                                                                                                       // 50
    return _super.apply(self, args);                                                                   // 51
  };                                                                                                   // 52
                                                                                                       // 53
});                                                                                                    // 54
                                                                                                       // 55
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("dispatch:run-as-user");

})();
