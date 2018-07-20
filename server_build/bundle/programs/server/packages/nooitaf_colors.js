(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var colors;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/nooitaf_colors/export.js                                 //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
this.colors = Npm.require('colors')
this.colors.enabled = true
colors = this.colors
delete this.colors

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("nooitaf:colors", {
  colors: colors
});

})();
