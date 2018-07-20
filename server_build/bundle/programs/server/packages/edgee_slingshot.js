(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;

/* Package-scope variables */
var Slingshot, matchAllowedFileTypes;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/edgee_slingshot/packages/edgee_slingshot.js                                 //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/lib/restrictions.js                                  //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
/**                                                                              // 1
 * @module meteor-slingshot                                                      // 2
 */                                                                              // 3
                                                                                 // 4
Slingshot = {};                                                                  // 5
                                                                                 // 6
/* global matchAllowedFileTypes: true */                                         // 7
matchAllowedFileTypes = Match.OneOf(String, [String], RegExp, null);             // 8
                                                                                 // 9
/**                                                                              // 10
 * List of configured restrictions by name.                                      // 11
 *                                                                               // 12
 * @type {Object.<String, Function>}                                             // 13
 * @private                                                                      // 14
 */                                                                              // 15
                                                                                 // 16
Slingshot._restrictions = {};                                                    // 17
                                                                                 // 18
/**                                                                              // 19
 * Creates file upload restrictions for a specific directive.                    // 20
 *                                                                               // 21
 * @param {string} name - A unique identifier of the directive.                  // 22
 * @param {Object} restrictions - The file upload restrictions.                  // 23
 * @returns {Object}                                                             // 24
 */                                                                              // 25
                                                                                 // 26
Slingshot.fileRestrictions = function (name, restrictions) {                     // 27
  check(restrictions, {                                                          // 28
    authorize: Match.Optional(Function),                                         // 29
    maxSize: Match.Optional(Match.OneOf(Number, null)),                          // 30
    allowedFileTypes: Match.Optional(matchAllowedFileTypes)                      // 31
  });                                                                            // 32
                                                                                 // 33
  if (Meteor.isServer) {                                                         // 34
    var directive = Slingshot.getDirective(name);                                // 35
    if (directive) {                                                             // 36
      _.extend(directive._directive, restrictions);                              // 37
    }                                                                            // 38
  }                                                                              // 39
                                                                                 // 40
  return (Slingshot._restrictions[name] =                                        // 41
    _.extend(Slingshot._restrictions[name] || {}, restrictions));                // 42
};                                                                               // 43
                                                                                 // 44
/**                                                                              // 45
 * @param {string} name - The unique identifier of the directive to              // 46
 * retrieve the restrictions for.                                                // 47
 * @returns {Object}                                                             // 48
 */                                                                              // 49
                                                                                 // 50
Slingshot.getRestrictions = function (name) {                                    // 51
  return this._restrictions[name] || {};                                         // 52
};                                                                               // 53
                                                                                 // 54
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/lib/validators.js                                    //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Slingshot.Validators = {                                                         // 1
                                                                                 // 2
 /**                                                                             // 3
  *                                                                              // 4
  * @method checkAll                                                             // 5
  *                                                                              // 6
  * @throws Meteor.Error                                                         // 7
  *                                                                              // 8
  * @param {Object} context                                                      // 9
  * @param {FileInfo} file                                                       // 10
  * @param {Object} [meta]                                                       // 11
  * @param {Object} [restrictions]                                               // 12
  *                                                                              // 13
  * @returns {Boolean}                                                           // 14
  */                                                                             // 15
                                                                                 // 16
  checkAll: function (context, file, meta, restrictions) {                       // 17
    return this.checkFileSize(file.size, restrictions.maxSize) &&                // 18
      this.checkFileType(file.type, restrictions.allowedFileTypes) &&            // 19
      (typeof restrictions.authorize !== 'function' ||                           // 20
        restrictions.authorize.call(context, file, meta));                       // 21
  },                                                                             // 22
                                                                                 // 23
  /**                                                                            // 24
   * @throws Meteor.Error                                                        // 25
   *                                                                             // 26
   * @param {Number} size - Size of file in bytes.                               // 27
   * @param {Number} maxSize - Max size of file in bytes.                        // 28
   * @returns {boolean}                                                          // 29
   */                                                                            // 30
                                                                                 // 31
  checkFileSize: function (size, maxSize) {                                      // 32
    maxSize = Math.min(maxSize, Infinity);                                       // 33
                                                                                 // 34
    if (maxSize && size > maxSize)                                               // 35
      throw new Meteor.Error("Upload denied", "File exceeds allowed size of " +  // 36
      formatBytes(maxSize));                                                     // 37
                                                                                 // 38
    return true;                                                                 // 39
  },                                                                             // 40
                                                                                 // 41
  /**                                                                            // 42
   *                                                                             // 43
   * @throws Meteor.Error                                                        // 44
   *                                                                             // 45
   * @param {String} type - Mime type                                            // 46
   * @param {(RegExp|Array|String)} [allowed] - Allowed file type(s)             // 47
   * @returns {boolean}                                                          // 48
   */                                                                            // 49
                                                                                 // 50
  checkFileType: function (type, allowed) {                                      // 51
    if (allowed instanceof RegExp) {                                             // 52
                                                                                 // 53
      if (!allowed.test(type))                                                   // 54
        throw new Meteor.Error("Upload denied",                                  // 55
          type + " is not an allowed file type");                                // 56
                                                                                 // 57
      return true;                                                               // 58
    }                                                                            // 59
                                                                                 // 60
    if (_.isArray(allowed)) {                                                    // 61
      if (allowed.indexOf(type) < 0) {                                           // 62
        throw new Meteor.Error("Upload denied",                                  // 63
          type + " is not one of the followed allowed file types: " +            // 64
          allowed.join(", "));                                                   // 65
      }                                                                          // 66
                                                                                 // 67
      return true;                                                               // 68
    }                                                                            // 69
                                                                                 // 70
    if (allowed && allowed !== type) {                                           // 71
      throw new Meteor.Error("Upload denied", "Only files of type " + allowed +  // 72
        " can be uploaded");                                                     // 73
    }                                                                            // 74
                                                                                 // 75
    return true;                                                                 // 76
  }                                                                              // 77
};                                                                               // 78
                                                                                 // 79
/** Human readable data-size in bytes.                                           // 80
 *                                                                               // 81
 * @param size {Number}                                                          // 82
 * @returns {string}                                                             // 83
 */                                                                              // 84
                                                                                 // 85
function formatBytes(size) {                                                     // 86
  var units = ['Bytes', 'KB', 'MB', 'GB', 'TB'],                                 // 87
      unit = units.shift();                                                      // 88
                                                                                 // 89
  while (size >= 0x400 && units.length) {                                        // 90
    size /= 0x400;                                                               // 91
    unit = units.shift();                                                        // 92
  }                                                                              // 93
                                                                                 // 94
  return (Math.round(size * 100) / 100) + " " + unit;                            // 95
}                                                                                // 96
                                                                                 // 97
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/lib/directive.js                                     //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
/**                                                                              // 1
 * @callback Directive~authorize                                                 // 2
 *                                                                               // 3
 * The meteor method context is passed on to this function, including            // 4
 * this.userId                                                                   // 5
 *                                                                               // 6
 * @throws Meteor.Error                                                          // 7
 *                                                                               // 8
 * @param {{size: Number, type: String, name: String}} file - File to be         // 9
 * uploaded                                                                      // 10
 * @param {Object} [meta] - Meta information provided by the client.             // 11
 *                                                                               // 12
 * @returns Boolean Return true to authorize the requested upload.               // 13
 */                                                                              // 14
                                                                                 // 15
/**                                                                              // 16
 * @typedef {Object} Directive                                                   // 17
 *                                                                               // 18
 * @property {Number} maxSize - Maximum size in bytes                            // 19
 * @property {(string, Array.<String>, RegExp, null)} allowedFileTypes - MIME    // 20
 * types that can be uploaded. If null is passed, then all file types are        // 21
 * allowed.                                                                      // 22
 *                                                                               // 23
 * @property {Directive~authorize} authorize - Function to determine whether a   // 24
 * file-upload is authorized or not.                                             // 25
 *                                                                               // 26
 * @property {String} [cacheControl] - rfc2616 Cache-Control directive (if       // 27
 * applicable to the selected storage service)                                   // 28
 *                                                                               // 29
 * @property {String} [contentDisposition] - rfc2616 Content-Disposition         // 30
 * directive. Defaults to "inline; <uploaded file name>"                         // 31
 *                                                                               // 32
 * @property {String}                                                            // 33
 */                                                                              // 34
                                                                                 // 35
/**                                                                              // 36
 * @typedef {Object} FileInfo                                                    // 37
 *                                                                               // 38
 * @property {String} [name] - Given name to the file.                           // 39
 * @property {Number} size - File-size in bytes.                                 // 40
 * @property {String} [type] - mime type.                                        // 41
 *                                                                               // 42
 */                                                                              // 43
                                                                                 // 44
/**                                                                              // 45
 * @typedef {Object} UploadInstructions                                          // 46
 *                                                                               // 47
 * @property {String} upload - POST URL                                          // 48
 * @property {String} download - Download URL                                    // 49
 * @property {Array.<{name: String, value: Object}>} postData - POST data to be  // 50
 * transferred to storage service along with credentials.                        // 51
 */                                                                              // 52
                                                                                 // 53
/**                                                                              // 54
 * List of installed directives by name.                                         // 55
 *                                                                               // 56
 * @type {Object.<string, Directive>}                                            // 57
 * @private                                                                      // 58
 */                                                                              // 59
                                                                                 // 60
Slingshot._directives = {};                                                      // 61
                                                                                 // 62
/**                                                                              // 63
 * Creates file upload directive that defines a set of rule by which a file may  // 64
 * be uploaded.                                                                  // 65
 *                                                                               // 66
 * @param {string} name - A unique identifier of the directive.                  // 67
 * @param {Object} service - A storage service to use.                           // 68
 * @param {Directive} options                                                    // 69
 * @returns {Slingshot.Directive}                                                // 70
 */                                                                              // 71
                                                                                 // 72
Slingshot.createDirective = function (name, service, options) {                  // 73
  if (_.has(Slingshot._directives, name))                                        // 74
    throw new Error("Directive '" + name + "' already exists");                  // 75
                                                                                 // 76
  var restrictions = Slingshot.getRestrictions(name);                            // 77
  _.defaults(options, restrictions);                                             // 78
                                                                                 // 79
  return (Slingshot._directives[name] =                                          // 80
    new Slingshot.Directive(service, options));                                  // 81
};                                                                               // 82
                                                                                 // 83
/**                                                                              // 84
 * @param {string} name - The unique identifier of the directive to be           // 85
 * retrieved.                                                                    // 86
 * @returns {Slingshot.Directive}                                                // 87
 */                                                                              // 88
                                                                                 // 89
Slingshot.getDirective = function (name) {                                       // 90
  return this._directives[name];                                                 // 91
};                                                                               // 92
                                                                                 // 93
/**                                                                              // 94
 * @param {Object} service                                                       // 95
 * @param {Directive} directive                                                  // 96
 * @constructor                                                                  // 97
 */                                                                              // 98
                                                                                 // 99
Slingshot.Directive = function (service, directive) {                            // 100
  check(this, Slingshot.Directive);                                              // 101
                                                                                 // 102
  //service does not have to be a plain-object, so checking fields individually  // 103
  check(service.directiveMatch, Object);                                         // 104
  check(service.upload, Function);                                               // 105
  check(service.maxSize, Match.Optional(Number));                                // 106
  check(service.allowedFileTypes, Match.Optional(matchAllowedFileTypes));        // 107
                                                                                 // 108
  _.defaults(directive, service.directiveDefault);                               // 109
                                                                                 // 110
  check(directive, _.extend({                                                    // 111
    authorize: Function,                                                         // 112
    maxSize: Match.Where(function (size) {                                       // 113
      check(size, Match.OneOf(Number, null));                                    // 114
                                                                                 // 115
      return !size || size > 0 && size <= (service.maxSize || Infinity);         // 116
    }),                                                                          // 117
    allowedFileTypes: matchAllowedFileTypes,                                     // 118
    cdn: Match.Optional(String)                                                  // 119
  }, service.directiveMatch));                                                   // 120
                                                                                 // 121
  /**                                                                            // 122
   * @method storageService                                                      // 123
   * @returns {Object}                                                           // 124
   */                                                                            // 125
                                                                                 // 126
  this.storageService = function () {                                            // 127
    return service;                                                              // 128
  };                                                                             // 129
                                                                                 // 130
  /**                                                                            // 131
   * @private                                                                    // 132
   * @property {Directive} _directive                                            // 133
   */                                                                            // 134
                                                                                 // 135
  this._directive = directive;                                                   // 136
};                                                                               // 137
                                                                                 // 138
_.extend(Slingshot.Directive.prototype, {                                        // 139
                                                                                 // 140
  /**                                                                            // 141
   * @param {{userId: String}} method                                            // 142
   * @param {FileInfo} file                                                      // 143
   * @param {Object} [meta]                                                      // 144
   *                                                                             // 145
   * @returns UploadInstructions                                                 // 146
   */                                                                            // 147
                                                                                 // 148
  getInstructions: function (method, file, meta) {                               // 149
    var instructions = this.storageService().upload(method, this._directive,     // 150
      file, meta);                                                               // 151
                                                                                 // 152
    check(instructions, {                                                        // 153
      upload: String,                                                            // 154
      download: String,                                                          // 155
      postData: [{                                                               // 156
        name: String,                                                            // 157
        value: Match.OneOf(String, Number, null)                                 // 158
      }],                                                                        // 159
      headers: Match.Optional(Object)                                            // 160
    });                                                                          // 161
                                                                                 // 162
    return instructions;                                                         // 163
  },                                                                             // 164
                                                                                 // 165
 /**                                                                             // 166
  *                                                                              // 167
  * @method requestAuthorization                                                 // 168
  *                                                                              // 169
  * @throws Meteor.Error                                                         // 170
  *                                                                              // 171
  * @param {Object} context                                                      // 172
  * @param {FileInfo} file                                                       // 173
  * @param {Object} [meta]                                                       // 174
  *                                                                              // 175
  * @returns {Boolean}                                                           // 176
  */                                                                             // 177
                                                                                 // 178
  requestAuthorization: function (context, file, meta) {                         // 179
    var validators = Slingshot.Validators,                                       // 180
        restrictions = _.pick(this._directive,                                   // 181
          ['authorize', 'maxSize', 'allowedFileTypes']                           // 182
        );                                                                       // 183
                                                                                 // 184
    return validators.checkAll(context, file, meta, restrictions);               // 185
  }                                                                              // 186
                                                                                 // 187
});                                                                              // 188
                                                                                 // 189
Meteor.methods({                                                                 // 190
  /**                                                                            // 191
   * Requests to perform a file upload.                                          // 192
   *                                                                             // 193
   * @param {String} directiveName                                               // 194
   * @param {FileInfo} file                                                      // 195
   * @param {Object} [meta]                                                      // 196
   *                                                                             // 197
   * @returns {UploadInstructions}                                               // 198
   */                                                                            // 199
                                                                                 // 200
  "slingshot/uploadRequest": function (directiveName, file, meta) {              // 201
    check(directiveName, String);                                                // 202
    check(file, {                                                                // 203
      type: Match.Optional(Match.Where(function (type) {                         // 204
        check(type, String);                                                     // 205
        return !type || /^[^\/]+\/[^\/]+$/.test(type);                           // 206
      })),                                                                       // 207
      name: Match.Optional(String),                                              // 208
      size: Match.Where(function (size) {                                        // 209
        check(size, Number);                                                     // 210
        return size >= 0;                                                        // 211
      })                                                                         // 212
    });                                                                          // 213
                                                                                 // 214
    if (!file.type)                                                              // 215
      delete file.type;                                                          // 216
                                                                                 // 217
    check(meta, Match.Optional(Match.OneOf(Object, null)));                      // 218
                                                                                 // 219
    var directive = Slingshot.getDirective(directiveName);                       // 220
                                                                                 // 221
    if (!directive) {                                                            // 222
      throw new Meteor.Error("Invalid directive",                                // 223
        "The directive " + directiveName + " does not seem to exist");           // 224
    }                                                                            // 225
                                                                                 // 226
    if (!directive.requestAuthorization(this, file, meta)) {                     // 227
      throw new Meteor.Error("Unauthorized", "You are not allowed to " +         // 228
        "upload this file");                                                     // 229
    }                                                                            // 230
                                                                                 // 231
    return directive.getInstructions(this, file, meta);                          // 232
  }                                                                              // 233
});                                                                              // 234
                                                                                 // 235
function quoteString(string, quotes) {                                           // 236
  return quotes + string.replace(quotes, '\\' + quotes) + quotes;                // 237
}                                                                                // 238
                                                                                 // 239
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/lib/storage-policy.js                                //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
                                                                                 // 1
/**                                                                              // 2
 * @constructor                                                                  // 3
 */                                                                              // 4
                                                                                 // 5
Slingshot.StoragePolicy = function () {                                          // 6
                                                                                 // 7
  /**                                                                            // 8
   * @type {{[expiration]: String, conditions: Array.<(Object|Array)>}}          // 9
   */                                                                            // 10
                                                                                 // 11
  var policy = {conditions: []};                                                 // 12
                                                                                 // 13
  var self = this;                                                               // 14
                                                                                 // 15
  _.extend(self, {                                                               // 16
                                                                                 // 17
    /** Set policy expiration time (as an absolute value).                       // 18
     *                                                                           // 19
     * Subsequent calls override previous expiration values.                     // 20
     *                                                                           // 21
     * @param {Date} deadline                                                    // 22
     *                                                                           // 23
     * @returns {Slingshot.StoragePolicy}                                        // 24
     */                                                                          // 25
                                                                                 // 26
    expire: function (deadline) {                                                // 27
      check(deadline, Date);                                                     // 28
                                                                                 // 29
      policy.expiration = deadline.toISOString();                                // 30
                                                                                 // 31
      return self;                                                               // 32
    },                                                                           // 33
                                                                                 // 34
                                                                                 // 35
    /** Adds a constraint in which a property must equal a value.                // 36
     *                                                                           // 37
     * @param {(String|Object.<String, String>)} property                        // 38
     * @param {String} [value]                                                   // 39
     *                                                                           // 40
     * @returns {Slingshot.StoragePolicy}                                        // 41
     */                                                                          // 42
                                                                                 // 43
    match: function (property, value) {                                          // 44
      if (_.isObject(property)) {                                                // 45
        _.each(property, function (value, property) {                            // 46
          self.match(property, value);                                           // 47
        });                                                                      // 48
      }                                                                          // 49
      else if (property && !_.isUndefined(value)) {                              // 50
        var constraint = {};                                                     // 51
                                                                                 // 52
        constraint[property] = value;                                            // 53
                                                                                 // 54
        policy.conditions.push(constraint);                                      // 55
      }                                                                          // 56
                                                                                 // 57
      return self;                                                               // 58
    },                                                                           // 59
                                                                                 // 60
    /** Set expiration time to a future value (relative from now)                // 61
     *                                                                           // 62
     * Subsequent calls override previous expiration values.                     // 63
     *                                                                           // 64
     * @param {Number} ms - Number of milliseconds in the future.                // 65
     *                                                                           // 66
     * @return {Slingshot.StoragePolicy}                                         // 67
     */                                                                          // 68
                                                                                 // 69
    expireIn: function (ms) {                                                    // 70
      return self.expire(new Date(Date.now() + ms));                             // 71
    },                                                                           // 72
                                                                                 // 73
    /** Adds a starts-with constraint.                                           // 74
     *                                                                           // 75
     * @param {string} field - Name of the field without the preceding '$'       // 76
     * @param {string} constraint - Value that the field must start with         // 77
     * @returns {Slingshot.StoragePolicy}                                        // 78
     */                                                                          // 79
                                                                                 // 80
    startsWith: function (field, constraint) {                                   // 81
      policy.conditions.push(["starts-with", "$" + field, constraint]);          // 82
      return self;                                                               // 83
    },                                                                           // 84
                                                                                 // 85
    /** Adds a file-size constraint                                              // 86
     *                                                                           // 87
     * @param minimum {Number} Minimum file-size                                 // 88
     * @param maximum {Number} Maximum file-size                                 // 89
     * @returns {Slingshot.StoragePolicy}                                        // 90
     */                                                                          // 91
                                                                                 // 92
    contentLength: function (minimum, maximum) {                                 // 93
      policy.conditions.push(["content-length-range", minimum, maximum]);        // 94
      return self;                                                               // 95
    },                                                                           // 96
                                                                                 // 97
    /**                                                                          // 98
     * @returns {string}                                                         // 99
     */                                                                          // 100
                                                                                 // 101
    stringify: function (encoding) {                                             // 102
      /* global Buffer: false */                                                 // 103
      return Buffer(JSON.stringify(policy), "utf-8")                             // 104
        .toString(encoding || "base64");                                         // 105
    }                                                                            // 106
  });                                                                            // 107
};                                                                               // 108
                                                                                 // 109
                                                                                 // 110
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/services/aws-s3.js                                   //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Slingshot.S3Storage = {                                                          // 1
                                                                                 // 2
  accessId: "AWSAccessKeyId",                                                    // 3
  secretKey: "AWSSecretAccessKey",                                               // 4
                                                                                 // 5
  directiveMatch: {                                                              // 6
    bucket: String,                                                              // 7
    bucketUrl: Match.OneOf(String, Function),                                    // 8
                                                                                 // 9
    region: Match.Where(function (region) {                                      // 10
      check(region, String);                                                     // 11
                                                                                 // 12
      return /^[a-z]{2}-\w+-\d+$/.test(region);                                  // 13
    }),                                                                          // 14
                                                                                 // 15
    AWSAccessKeyId: String,                                                      // 16
    AWSSecretAccessKey: String,                                                  // 17
                                                                                 // 18
    acl: Match.Optional(Match.Where(function (acl) {                             // 19
      check(acl, String);                                                        // 20
                                                                                 // 21
      return [                                                                   // 22
          "private",                                                             // 23
          "public-read",                                                         // 24
          "public-read-write",                                                   // 25
          "authenticated-read",                                                  // 26
          "bucket-owner-read",                                                   // 27
          "bucket-owner-full-control",                                           // 28
          "log-delivery-write"                                                   // 29
        ].indexOf(acl) >= 0;                                                     // 30
    })),                                                                         // 31
                                                                                 // 32
    key: Match.OneOf(String, Function),                                          // 33
                                                                                 // 34
    expire: Match.Where(function (expire) {                                      // 35
      check(expire, Number);                                                     // 36
                                                                                 // 37
      return expire > 0;                                                         // 38
    }),                                                                          // 39
                                                                                 // 40
    cacheControl: Match.Optional(String),                                        // 41
    contentDisposition: Match.Optional(Match.OneOf(String, Function, null))      // 42
  },                                                                             // 43
                                                                                 // 44
  directiveDefault: _.chain(Meteor.settings)                                     // 45
    .pick("AWSAccessKeyId", "AWSSecretAccessKey")                                // 46
    .extend({                                                                    // 47
      bucket: Meteor.settings.S3Bucket,                                          // 48
      bucketUrl: function (bucket, region) {                                     // 49
        var bucketDomain = "s3-" + region + ".amazonaws.com";                    // 50
        if (region === "us-east-1")                                              // 51
          bucketDomain = "s3.amazonaws.com";                                     // 52
                                                                                 // 53
        if (bucket.indexOf(".") !== -1)                                          // 54
          return "https://" + bucketDomain + "/" + bucket;                       // 55
                                                                                 // 56
        return "https://" + bucket + "." + bucketDomain;                         // 57
      },                                                                         // 58
      region: Meteor.settings.AWSRegion || "us-east-1",                          // 59
      expire: 5 * 60 * 1000 //in 5 minutes                                       // 60
    })                                                                           // 61
    .value(),                                                                    // 62
                                                                                 // 63
  getContentDisposition: function (method, directive, file, meta) {              // 64
    var getContentDisposition = directive.contentDisposition;                    // 65
                                                                                 // 66
    if (!_.isFunction(getContentDisposition)) {                                  // 67
      getContentDisposition = function () {                                      // 68
        var filename = file.name && encodeURIComponent(file.name);               // 69
                                                                                 // 70
        return directive.contentDisposition || filename &&                       // 71
          "inline; filename=\"" + filename + "\"; filename*=utf-8''" +           // 72
          filename;                                                              // 73
      };                                                                         // 74
    }                                                                            // 75
                                                                                 // 76
    return getContentDisposition.call(method, file, meta);                       // 77
  },                                                                             // 78
                                                                                 // 79
  /**                                                                            // 80
   *                                                                             // 81
   * @param {{userId: String}} method                                            // 82
   * @param {Directive} directive                                                // 83
   * @param {FileInfo} file                                                      // 84
   * @param {Object} [meta]                                                      // 85
   *                                                                             // 86
   * @returns {UploadInstructions}                                               // 87
   */                                                                            // 88
                                                                                 // 89
  upload: function (method, directive, file, meta) {                             // 90
    var policy = new Slingshot.StoragePolicy()                                   // 91
          .expireIn(directive.expire)                                            // 92
          .contentLength(0, Math.min(file.size, directive.maxSize || Infinity)), // 93
                                                                                 // 94
        payload = {                                                              // 95
          key: _.isFunction(directive.key) ?                                     // 96
            directive.key.call(method, file, meta) : directive.key,              // 97
                                                                                 // 98
          bucket: directive.bucket,                                              // 99
                                                                                 // 100
          "Content-Type": file.type,                                             // 101
          "acl": directive.acl,                                                  // 102
                                                                                 // 103
          "Cache-Control": directive.cacheControl,                               // 104
          "Content-Disposition": this.getContentDisposition(method, directive,   // 105
            file, meta)                                                          // 106
        },                                                                       // 107
                                                                                 // 108
        bucketUrl = _.isFunction(directive.bucketUrl) ?                          // 109
          directive.bucketUrl(directive.bucket, directive.region) :              // 110
          directive.bucketUrl,                                                   // 111
                                                                                 // 112
        downloadUrl = [                                                          // 113
          (directive.cdn || bucketUrl),                                          // 114
          payload.key                                                            // 115
        ].map(function (part) {                                                  // 116
            return part.replace(/\/+$/, '');                                     // 117
          }).join("/");                                                          // 118
                                                                                 // 119
    this.applySignature(payload, policy, directive);                             // 120
                                                                                 // 121
    return {                                                                     // 122
      upload: bucketUrl,                                                         // 123
      download: downloadUrl,                                                     // 124
      postData: [{                                                               // 125
        name: "key",                                                             // 126
        value: payload.key                                                       // 127
      }].concat(_.chain(payload).omit("key").map(function (value, name) {        // 128
          return !_.isUndefined(value) && {                                      // 129
              name: name,                                                        // 130
              value: value                                                       // 131
            };                                                                   // 132
        }).compact().value())                                                    // 133
    };                                                                           // 134
  },                                                                             // 135
                                                                                 // 136
  /** Applies signature an upload payload                                        // 137
   *                                                                             // 138
   * @param {Object} payload - Data to be upload along with file                 // 139
   * @param {Slingshot.StoragePolicy} policy                                     // 140
   * @param {Directive} directive                                                // 141
   */                                                                            // 142
                                                                                 // 143
  applySignature: function (payload, policy, directive) {                        // 144
    var now =  new Date(),                                                       // 145
        today = now.getUTCFullYear() + formatNumber(now.getUTCMonth() + 1, 2) +  // 146
          formatNumber(now.getUTCDate(), 2),                                     // 147
        service = "s3";                                                          // 148
                                                                                 // 149
    _.extend(payload, {                                                          // 150
      "x-amz-algorithm": "AWS4-HMAC-SHA256",                                     // 151
      "x-amz-credential": [                                                      // 152
        directive[this.accessId],                                                // 153
        today,                                                                   // 154
        directive.region,                                                        // 155
        service,                                                                 // 156
        "aws4_request"                                                           // 157
      ].join("/"),                                                               // 158
      "x-amz-date": today + "T000000Z"                                           // 159
    });                                                                          // 160
                                                                                 // 161
    payload.policy = policy.match(payload).stringify();                          // 162
    payload["x-amz-signature"] = this.signAwsV4(payload.policy,                  // 163
      directive[this.secretKey], today, directive.region, service);              // 164
  },                                                                             // 165
                                                                                 // 166
  /** Generate a AWS Signature Version 4                                         // 167
   *                                                                             // 168
   * @param {String} policy - Base64 encoded policy to sign.                     // 169
   * @param {String} secretKey - AWSSecretAccessKey                              // 170
   * @param {String} date - Signature date (yyyymmdd)                            // 171
   * @param {String} region - AWS Data-Center region                             // 172
   * @param {String} service - type of service to use                            // 173
   * @returns {String} hex encoded HMAC-256 signature                            // 174
   */                                                                            // 175
                                                                                 // 176
  signAwsV4: function (policy, secretKey, date, region, service) {               // 177
    var dateKey = hmac256("AWS4" + secretKey, date),                             // 178
        dateRegionKey = hmac256(dateKey, region),                                // 179
        dateRegionServiceKey= hmac256(dateRegionKey, service),                   // 180
        signingKey = hmac256(dateRegionServiceKey, "aws4_request");              // 181
                                                                                 // 182
    return hmac256(signingKey, policy, "hex");                                   // 183
  }                                                                              // 184
};                                                                               // 185
                                                                                 // 186
Slingshot.S3Storage.TempCredentials = _.defaults({                               // 187
                                                                                 // 188
  directiveMatch: _.chain(Slingshot.S3Storage.directiveMatch)                    // 189
    .omit("AWSAccessKeyId", "AWSSecretAccessKey")                                // 190
    .extend({                                                                    // 191
      temporaryCredentials: Function                                             // 192
    })                                                                           // 193
    .value(),                                                                    // 194
                                                                                 // 195
  directiveDefault: _.omit(Slingshot.S3Storage.directiveDefault,                 // 196
    "AWSAccessKeyId", "AWSSecretAccessKey"),                                     // 197
                                                                                 // 198
  applySignature: function (payload, policy, directive) {                        // 199
    var credentials = directive.temporaryCredentials(directive.expire);          // 200
                                                                                 // 201
    check(credentials, Match.ObjectIncluding({                                   // 202
      AccessKeyId: Slingshot.S3Storage.directiveMatch.AWSAccessKeyId,            // 203
      SecretAccessKey: Slingshot.S3Storage.directiveMatch.AWSSecretAccessKey,    // 204
      SessionToken: String                                                       // 205
    }));                                                                         // 206
                                                                                 // 207
    payload["x-amz-security-token"] = credentials.SessionToken;                  // 208
                                                                                 // 209
    return Slingshot.S3Storage.applySignature                                    // 210
      .call(this, payload, policy, _.defaults({                                  // 211
        AWSAccessKeyId: credentials.AccessKeyId,                                 // 212
        AWSSecretAccessKey: credentials.SecretAccessKey                          // 213
      }, directive));                                                            // 214
  }                                                                              // 215
}, Slingshot.S3Storage);                                                         // 216
                                                                                 // 217
                                                                                 // 218
function formatNumber(num, digits) {                                             // 219
  var string = String(num);                                                      // 220
                                                                                 // 221
  return Array(digits - string.length + 1).join("0").concat(string);             // 222
}                                                                                // 223
                                                                                 // 224
var crypto = Npm.require("crypto");                                              // 225
                                                                                 // 226
function hmac256(key, data, encoding) {                                          // 227
  /* global Buffer: false */                                                     // 228
  return crypto                                                                  // 229
    .createHmac("sha256", key)                                                   // 230
    .update(new Buffer(data, "utf-8"))                                           // 231
    .digest(encoding);                                                           // 232
}                                                                                // 233
                                                                                 // 234
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/services/google-cloud.js                             //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
//GoogleCloud is based on the very same api as AWS S3, so we extend it:          // 1
                                                                                 // 2
Slingshot.GoogleCloud = _.defaults({                                             // 3
                                                                                 // 4
  accessId: "GoogleAccessId",                                                    // 5
  secretKey: "GoogleSecretKey",                                                  // 6
                                                                                 // 7
  directiveMatch: _.chain(Slingshot.S3Storage.directiveMatch)                    // 8
    .omit(Slingshot.S3Storage.accessId, Slingshot.S3Storage.secretKey, "region") // 9
    .extend({                                                                    // 10
      GoogleAccessId: String,                                                    // 11
      GoogleSecretKey: String,                                                   // 12
                                                                                 // 13
      acl: Match.Optional(Match.Where(function (acl) {                           // 14
        check(acl, String);                                                      // 15
                                                                                 // 16
        return [                                                                 // 17
            "project-private",                                                   // 18
            "private",                                                           // 19
            "public-read",                                                       // 20
            "public-read-write",                                                 // 21
            "authenticated-read",                                                // 22
            "bucket-owner-read",                                                 // 23
            "bucket-owner-full-control"                                          // 24
          ].indexOf(acl) >= 0;                                                   // 25
      }))                                                                        // 26
    })                                                                           // 27
    .value(),                                                                    // 28
                                                                                 // 29
  directiveDefault:  _.chain(Meteor.settings)                                    // 30
    .pick("GoogleAccessId")                                                      // 31
    .extend(Slingshot.S3Storage.directiveDefault, {                              // 32
      bucketUrl: function (bucket) {                                             // 33
        return "https://" + bucket + ".storage.googleapis.com";                  // 34
      }                                                                          // 35
    })                                                                           // 36
    .omit(Slingshot.S3Storage.accessId, Slingshot.S3Storage.secretKey, "region") // 37
    .value(),                                                                    // 38
                                                                                 // 39
  applySignature: function (payload, policy, directive) {                        // 40
    payload[this.accessId] = directive[this.accessId];                           // 41
    payload.policy = policy.match(_.omit(payload, this.accessId)).stringify();   // 42
    payload.signature = this.sign(directive[this.secretKey], payload.policy);    // 43
  },                                                                             // 44
                                                                                 // 45
  /**                                                                            // 46
   * @param {String} secretKey - pem private key                                 // 47
   * @param {String} policy                                                      // 48
   * @returns {*|String}                                                         // 49
   */                                                                            // 50
                                                                                 // 51
  sign: function (secretKey, policy) {                                           // 52
    return Npm.require("crypto")                                                 // 53
      .createSign('RSA-SHA256')                                                  // 54
      .update(policy)                                                            // 55
      .sign(secretKey, "base64");                                                // 56
  }                                                                              // 57
}, Slingshot.S3Storage);                                                         // 58
                                                                                 // 59
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/edgee:slingshot/services/rackspace.js                                //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Slingshot.RackspaceFiles = {                                                     // 1
                                                                                 // 2
  directiveMatch: {                                                              // 3
    RackspaceAccountId: String,                                                  // 4
    RackspaceMetaDataKey: String,                                                // 5
    container: String,                                                           // 6
    region: String,                                                              // 7
    pathPrefix: Match.OneOf(String, Function),                                   // 8
    expire: Match.Where(function (expire) {                                      // 9
      check(expire, Number);                                                     // 10
                                                                                 // 11
      return expire > 0;                                                         // 12
    }),                                                                          // 13
    deleteAt: Match.Optional(Date),                                              // 14
    deleteAfter: Match.Optional(Number)                                          // 15
  },                                                                             // 16
                                                                                 // 17
  directiveDefault: _.chain(Meteor.settings)                                     // 18
    .pick("RackspaceAccountId", "RackspaceMetaDataKey")                          // 19
    .extend({                                                                    // 20
      region: "iad3",                                                            // 21
      expire: 5 * 60 * 1000 //in 5 minutes                                       // 22
    })                                                                           // 23
    .value(),                                                                    // 24
                                                                                 // 25
  version: "v1",                                                                 // 26
                                                                                 // 27
  path: function (directive, prefix) {                                           // 28
    return "/" + [                                                               // 29
      this.version,                                                              // 30
      "MossoCloudFS_" + directive.RackspaceAccountId,                            // 31
      directive.container,                                                       // 32
      prefix                                                                     // 33
    ].join("/").replace(/\/+/, "/");                                             // 34
  },                                                                             // 35
                                                                                 // 36
  pathPrefix: function (method, directive, file, meta) {                         // 37
    if ("pathPrefix" in directive) {                                             // 38
      return (_.isFunction(directive.pathPrefix) ?                               // 39
        directive.pathPrefix.call(method, file, meta) : directive.pathPrefix);   // 40
    }                                                                            // 41
    else {                                                                       // 42
      return "";                                                                 // 43
    }                                                                            // 44
  },                                                                             // 45
                                                                                 // 46
  host: function (region) {                                                      // 47
    return "https://storage101." + region + ".clouddrive.com";                   // 48
  },                                                                             // 49
                                                                                 // 50
  maxSize: 0x140000000, //5GB                                                    // 51
                                                                                 // 52
  upload: function (method, directive, file, meta) {                             // 53
    var pathPrefix = this.pathPrefix(method, directive, file, meta),             // 54
        path = this.path(directive, pathPrefix),                                 // 55
        host = this.host(directive.region),                                      // 56
        url = host + path,                                                       // 57
        data = [                                                                 // 58
          {                                                                      // 59
            name: "redirect",                                                    // 60
            value: ""                                                            // 61
          },                                                                     // 62
          {                                                                      // 63
            name: "max_file_size",                                               // 64
            value: Math.min(file.size, directive.maxSize || this.maxSize)        // 65
          },                                                                     // 66
          {                                                                      // 67
            name: "max_file_count",                                              // 68
            value: 1                                                             // 69
          },                                                                     // 70
          {                                                                      // 71
            name: "expires",                                                     // 72
            value: Date.now() + directive.expire                                 // 73
          }                                                                      // 74
        ];                                                                       // 75
                                                                                 // 76
    data.push({                                                                  // 77
        name: "signature",                                                       // 78
        value: this.sign(directive.RackspaceMetaDataKey, path, data)             // 79
    });                                                                          // 80
                                                                                 // 81
    if ("deleteAt" in directive)                                                 // 82
      data.push({                                                                // 83
        name: "x_delete_at",                                                     // 84
        value: directive.deleteAt.getTime()                                      // 85
      });                                                                        // 86
                                                                                 // 87
    if ("deleteAfter" in directive)                                              // 88
      data.push({                                                                // 89
        name: "x_delete_after",                                                  // 90
        value: Math.round(directive.deleteAfter / 1000)                          // 91
      });                                                                        // 92
                                                                                 // 93
    var cdn = directive.cdn;                                                     // 94
                                                                                 // 95
    return {                                                                     // 96
      upload: url,                                                               // 97
      download: (cdn && cdn + "/" + pathPrefix || host + path) + file.name,      // 98
      postData: data                                                             // 99
    };                                                                           // 100
  },                                                                             // 101
                                                                                 // 102
  sign: function (secretkey, path, data) {                                       // 103
    /* global Buffer: false */                                                   // 104
    var policy = path + "\n" + _.pluck(data, "value").join("\n");                // 105
                                                                                 // 106
    return Npm.require("crypto")                                                 // 107
      .createHmac("sha1", secretkey)                                             // 108
      .update(new Buffer(policy, "utf-8"))                                       // 109
      .digest("hex");                                                            // 110
  }                                                                              // 111
                                                                                 // 112
};                                                                               // 113
                                                                                 // 114
///////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("edgee:slingshot", {
  Slingshot: Slingshot
});

})();
