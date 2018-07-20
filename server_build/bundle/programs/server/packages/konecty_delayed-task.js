(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var __coffeescriptShare, DelayedTask;

(function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/konecty_delayed-task/packages/konecty_delayed-task.js                  //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
(function () {

//////////////////////////////////////////////////////////////////////////////////
//                                                                              //
// packages/konecty:delayed-task/konecty:delayed-task.coffee.js                 //
//                                                                              //
//////////////////////////////////////////////////////////////////////////////////
                                                                                //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var             
  __slice = [].slice;

new (DelayedTask = (function() {
  var count, timer;

  timer = null;

  count = 0;

  function DelayedTask() {
    var args, flushCount, fn, time;
    fn = arguments[0], time = arguments[1], flushCount = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    this.fn = fn;
    this.time = time != null ? time : 500;
    this.flushCount = flushCount != null ? flushCount : 0;
    this.args = args;
    return this;
  }

  DelayedTask.prototype.run = function() {
    var args, self;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    self = this;
    return Tracker.nonreactive(function() {
      var call;
      if (args.length > 0) {
        throw new Error('[DelayedTask] Tasks can\'t be called with arguments');
      }
      if (timer != null) {
        Meteor.clearTimeout(timer);
      }
      count++;
      call = function() {
        count = 0;
        return self.fn.apply(self, self.args);
      };
      if (self.flushCount > 0 && count >= self.flushCount) {
        return call();
      }
      return timer = Meteor.setTimeout(call, self.time);
    });
  };

  return DelayedTask;

})());
//////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("konecty:delayed-task", {
  DelayedTask: DelayedTask
});

})();
