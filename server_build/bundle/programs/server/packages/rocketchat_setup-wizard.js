(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:setup-wizard":{"server":{"getSetupWizardParameters.js":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/rocketchat_setup-wizard/server/getSetupWizardParameters.js             //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
Meteor.methods({
  getSetupWizardParameters() {
    const userId = Meteor.userId();
    const userHasAdminRole = userId && RocketChat.authz.hasRole(userId, 'admin');

    if (!userHasAdminRole) {
      throw new Meteor.Error('error-not-allowed');
    }

    const settings = RocketChat.models.Settings.findSetupWizardSettings().fetch();
    const allowStandaloneServer = process.env.DEPLOY_PLATFORM !== 'rocket-cloud';
    return {
      settings,
      allowStandaloneServer
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:setup-wizard/server/getSetupWizardParameters.js");

/* Exports */
Package._define("rocketchat:setup-wizard");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_setup-wizard.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzZXR1cC13aXphcmQvc2VydmVyL2dldFNldHVwV2l6YXJkUGFyYW1ldGVycy5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJtZXRob2RzIiwiZ2V0U2V0dXBXaXphcmRQYXJhbWV0ZXJzIiwidXNlcklkIiwidXNlckhhc0FkbWluUm9sZSIsIlJvY2tldENoYXQiLCJhdXRoeiIsImhhc1JvbGUiLCJFcnJvciIsInNldHRpbmdzIiwibW9kZWxzIiwiU2V0dGluZ3MiLCJmaW5kU2V0dXBXaXphcmRTZXR0aW5ncyIsImZldGNoIiwiYWxsb3dTdGFuZGFsb25lU2VydmVyIiwicHJvY2VzcyIsImVudiIsIkRFUExPWV9QTEFURk9STSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWU7QUFDZEMsNkJBQTJCO0FBQzFCLFVBQU1DLFNBQVNILE9BQU9HLE1BQVAsRUFBZjtBQUNBLFVBQU1DLG1CQUFtQkQsVUFBVUUsV0FBV0MsS0FBWCxDQUFpQkMsT0FBakIsQ0FBeUJKLE1BQXpCLEVBQWlDLE9BQWpDLENBQW5DOztBQUVBLFFBQUksQ0FBQ0MsZ0JBQUwsRUFBdUI7QUFDdEIsWUFBTSxJQUFJSixPQUFPUSxLQUFYLENBQWlCLG1CQUFqQixDQUFOO0FBQ0E7O0FBRUQsVUFBTUMsV0FBV0osV0FBV0ssTUFBWCxDQUFrQkMsUUFBbEIsQ0FBMkJDLHVCQUEzQixHQUFxREMsS0FBckQsRUFBakI7QUFDQSxVQUFNQyx3QkFBd0JDLFFBQVFDLEdBQVIsQ0FBWUMsZUFBWixLQUFnQyxjQUE5RDtBQUVBLFdBQU87QUFDTlIsY0FETTtBQUVOSztBQUZNLEtBQVA7QUFJQTs7QUFoQmEsQ0FBZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NldHVwLXdpemFyZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5tZXRob2RzKHtcblx0Z2V0U2V0dXBXaXphcmRQYXJhbWV0ZXJzKCkge1xuXHRcdGNvbnN0IHVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcblx0XHRjb25zdCB1c2VySGFzQWRtaW5Sb2xlID0gdXNlcklkICYmIFJvY2tldENoYXQuYXV0aHouaGFzUm9sZSh1c2VySWQsICdhZG1pbicpO1xuXG5cdFx0aWYgKCF1c2VySGFzQWRtaW5Sb2xlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNldHRpbmdzID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZFNldHVwV2l6YXJkU2V0dGluZ3MoKS5mZXRjaCgpO1xuXHRcdGNvbnN0IGFsbG93U3RhbmRhbG9uZVNlcnZlciA9IHByb2Nlc3MuZW52LkRFUExPWV9QTEFURk9STSAhPT0gJ3JvY2tldC1jbG91ZCc7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c2V0dGluZ3MsXG5cdFx0XHRhbGxvd1N0YW5kYWxvbmVTZXJ2ZXJcblx0XHR9O1xuXHR9XG59KTtcbiJdfQ==
