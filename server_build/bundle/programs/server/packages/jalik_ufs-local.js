(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var options, file;

var require = meteorInstall({"node_modules":{"meteor":{"jalik:ufs-local":{"ufs-local.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/jalik_ufs-local/ufs-local.js                                                                    //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
module.export({
  LocalStore: () => LocalStore
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 1);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 3);

class LocalStore extends UploadFS.Store {
  constructor(options) {
    // Default options
    options = _.extend({
      mode: '0744',
      path: 'ufs/uploads',
      writeMode: '0744'
    }, options); // Check options

    if (typeof options.mode !== "string") {
      throw new TypeError("LocalStore: mode is not a string");
    }

    if (typeof options.path !== "string") {
      throw new TypeError("LocalStore: path is not a string");
    }

    if (typeof options.writeMode !== "string") {
      throw new TypeError("LocalStore: writeMode is not a string");
    }

    super(options);
    let self = this; // Private attributes

    let mode = options.mode;
    let path = options.path;
    let writeMode = options.writeMode;

    if (Meteor.isServer) {
      const fs = Npm.require('fs');

      fs.stat(path, function (err) {
        if (err) {
          const mkdirp = Npm.require('mkdirp'); // Create the directory


          mkdirp(path, {
            mode: mode
          }, function (err) {
            if (err) {
              console.error(`LocalStore: cannot create store at ${path} (${err.message})`);
            } else {
              console.info(`LocalStore: store created at ${path}`);
            }
          });
        } else {
          // Set directory permissions
          fs.chmod(path, mode, function (err) {
            err && console.error(`LocalStore: cannot set store permissions ${mode} (${err.message})`);
          });
        }
      });
    }
    /**
     * Returns the path or sub path
     * @param file
     * @return {string}
     */


    this.getPath = function (file) {
      return path + (file ? `/${file}` : '');
    };

    if (Meteor.isServer) {
      /**
       * Removes the file
       * @param fileId
       * @param callback
       */
      this.delete = function (fileId, callback) {
        let path = this.getFilePath(fileId);

        if (typeof callback !== 'function') {
          callback = function (err) {
            err && console.error(`LocalStore: cannot delete file "${fileId}" at ${path} (${err.message})`);
          };
        }

        const fs = Npm.require('fs');

        fs.stat(path, Meteor.bindEnvironment(function (err, stat) {
          if (!err && stat && stat.isFile()) {
            fs.unlink(path, Meteor.bindEnvironment(function () {
              self.getCollection().remove(fileId);
              callback.call(self);
            }));
          }
        }));
      };
      /**
       * Returns the file read stream
       * @param fileId
       * @param file
       * @param options
       * @return {*}
       */


      this.getReadStream = function (fileId, file, options) {
        const fs = Npm.require('fs');

        options = _.extend({}, options);
        return fs.createReadStream(self.getFilePath(fileId, file), {
          flags: 'r',
          encoding: null,
          autoClose: true,
          start: options.start,
          end: options.end
        });
      };
      /**
       * Returns the file write stream
       * @param fileId
       * @param file
       * @param options
       * @return {*}
       */


      this.getWriteStream = function (fileId, file, options) {
        const fs = Npm.require('fs');

        options = _.extend({}, options);
        return fs.createWriteStream(self.getFilePath(fileId, file), {
          flags: 'a',
          encoding: null,
          mode: writeMode,
          start: options.start
        });
      };
    }
  }
  /**
   * Returns the file path
   * @param fileId
   * @param file
   * @return {string}
   */


  getFilePath(fileId, file) {
    file = file || this.getCollection().findOne(fileId, {
      fields: {
        extension: 1
      }
    });
    return file && this.getPath(fileId + (file.extension ? `.${file.extension}` : ''));
  }

}

// Add store to UFS namespace
UploadFS.store.Local = LocalStore;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/jalik:ufs-local/ufs-local.js");

/* Exports */
Package._define("jalik:ufs-local", exports);

})();

//# sourceURL=meteor://💻app/packages/jalik_ufs-local.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzLWxvY2FsL3Vmcy1sb2NhbC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJMb2NhbFN0b3JlIiwiXyIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJjaGVjayIsIk1ldGVvciIsIlVwbG9hZEZTIiwiU3RvcmUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJleHRlbmQiLCJtb2RlIiwicGF0aCIsIndyaXRlTW9kZSIsIlR5cGVFcnJvciIsInNlbGYiLCJpc1NlcnZlciIsImZzIiwiTnBtIiwic3RhdCIsImVyciIsIm1rZGlycCIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJpbmZvIiwiY2htb2QiLCJnZXRQYXRoIiwiZmlsZSIsImRlbGV0ZSIsImZpbGVJZCIsImNhbGxiYWNrIiwiZ2V0RmlsZVBhdGgiLCJiaW5kRW52aXJvbm1lbnQiLCJpc0ZpbGUiLCJ1bmxpbmsiLCJnZXRDb2xsZWN0aW9uIiwicmVtb3ZlIiwiY2FsbCIsImdldFJlYWRTdHJlYW0iLCJjcmVhdGVSZWFkU3RyZWFtIiwiZmxhZ3MiLCJlbmNvZGluZyIsImF1dG9DbG9zZSIsInN0YXJ0IiwiZW5kIiwiZ2V0V3JpdGVTdHJlYW0iLCJjcmVhdGVXcml0ZVN0cmVhbSIsImZpbmRPbmUiLCJmaWVsZHMiLCJleHRlbnNpb24iLCJzdG9yZSIsIkxvY2FsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxjQUFXLE1BQUlBO0FBQWhCLENBQWQ7O0FBQTJDLElBQUlDLENBQUo7O0FBQU1ILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNGLElBQUVHLENBQUYsRUFBSTtBQUFDSCxRQUFFRyxDQUFGO0FBQUk7O0FBQVYsQ0FBMUMsRUFBc0QsQ0FBdEQ7QUFBeUQsSUFBSUMsS0FBSjtBQUFVUCxPQUFPSSxLQUFQLENBQWFD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REMsZUFBS3BDLFFBQVFvQztBQUwwQyxTQUFwRCxDQUFQO0FBT0gsT0FWRDtBQVlBOzs7Ozs7Ozs7QUFPQSxXQUFLQyxjQUFMLEdBQXNCLFVBQVVoQixNQUFWLEVBQWtCRixJQUFsQixFQUF3Qm5CLE9BQXhCLEVBQWlDO0FBQ25ELGNBQU1RLEtBQUtDLElBQUloQixPQUFKLENBQVksSUFBWixDQUFYOztBQUNBTyxrQkFBVVQsRUFBRVUsTUFBRixDQUFTLEVBQVQsRUFBYUQsT0FBYixDQUFWO0FBQ0EsZUFBT1EsR0FBRzhCLGlCQUFILENBQXFCaEMsS0FBS2lCLFdBQUwsQ0FBaUJGLE1BQWpCLEVBQXlCRixJQUF6QixDQUFyQixFQUFxRDtBQUN4RGEsaUJBQU8sR0FEaUQ7QUFFeERDLG9CQUFVLElBRjhDO0FBR3hEL0IsZ0JBQU1FLFNBSGtEO0FBSXhEK0IsaUJBQU9uQyxRQUFRbUM7QUFKeUMsU0FBckQsQ0FBUDtBQU1ILE9BVEQ7QUFVSDtBQUNKO0FBRUQ7Ozs7Ozs7O0FBTUFaLGNBQVlGLE1BQVosRUFBb0JGLElBQXBCLEVBQTBCO0FBQ3RCQSxXQUFPQSxRQUFRLEtBQUtRLGFBQUwsR0FBcUJZLE9BQXJCLENBQTZCbEIsTUFBN0IsRUFBcUM7QUFBQ21CLGNBQVE7QUFBQ0MsbUJBQVc7QUFBWjtBQUFULEtBQXJDLENBQWY7QUFDQSxXQUFPdEIsUUFBUSxLQUFLRCxPQUFMLENBQWFHLFVBQVVGLEtBQUtzQixTQUFMLEdBQWtCLElBQUd0QixLQUFLc0IsU0FBVyxFQUFyQyxHQUF5QyxFQUFuRCxDQUFiLENBQWY7QUFDSDs7QUF4STBDOztBQTJJL0M7QUFDQTVDLFNBQVM2QyxLQUFULENBQWVDLEtBQWYsR0FBdUJyRCxVQUF2QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9qYWxpa191ZnMtbG9jYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE3IEthcmwgU1RFSU5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICpcbiAqL1xuXG5pbXBvcnQge199IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCB7Y2hlY2t9IGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQge01ldGVvcn0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQge1VwbG9hZEZTfSBmcm9tICdtZXRlb3IvamFsaWs6dWZzJztcblxuXG4vKipcbiAqIEZpbGUgc3lzdGVtIHN0b3JlXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBMb2NhbFN0b3JlIGV4dGVuZHMgVXBsb2FkRlMuU3RvcmUge1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICAvLyBEZWZhdWx0IG9wdGlvbnNcbiAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKHtcbiAgICAgICAgICAgIG1vZGU6ICcwNzQ0JyxcbiAgICAgICAgICAgIHBhdGg6ICd1ZnMvdXBsb2FkcycsXG4gICAgICAgICAgICB3cml0ZU1vZGU6ICcwNzQ0J1xuICAgICAgICB9LCBvcHRpb25zKTtcblxuICAgICAgICAvLyBDaGVjayBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5tb2RlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTG9jYWxTdG9yZTogbW9kZSBpcyBub3QgYSBzdHJpbmdcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnBhdGggIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJMb2NhbFN0b3JlOiBwYXRoIGlzIG5vdCBhIHN0cmluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMud3JpdGVNb2RlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTG9jYWxTdG9yZTogd3JpdGVNb2RlIGlzIG5vdCBhIHN0cmluZ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gUHJpdmF0ZSBhdHRyaWJ1dGVzXG4gICAgICAgIGxldCBtb2RlID0gb3B0aW9ucy5tb2RlO1xuICAgICAgICBsZXQgcGF0aCA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgbGV0IHdyaXRlTW9kZSA9IG9wdGlvbnMud3JpdGVNb2RlO1xuXG4gICAgICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGZzID0gTnBtLnJlcXVpcmUoJ2ZzJyk7XG5cbiAgICAgICAgICAgIGZzLnN0YXQocGF0aCwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWtkaXJwID0gTnBtLnJlcXVpcmUoJ21rZGlycCcpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZGlyZWN0b3J5XG4gICAgICAgICAgICAgICAgICAgIG1rZGlycChwYXRoLCB7bW9kZTogbW9kZX0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBMb2NhbFN0b3JlOiBjYW5ub3QgY3JlYXRlIHN0b3JlIGF0ICR7cGF0aH0gKCR7ZXJyLm1lc3NhZ2V9KWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYExvY2FsU3RvcmU6IHN0b3JlIGNyZWF0ZWQgYXQgJHtwYXRofWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgZGlyZWN0b3J5IHBlcm1pc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGZzLmNobW9kKHBhdGgsIG1vZGUsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciAmJiBjb25zb2xlLmVycm9yKGBMb2NhbFN0b3JlOiBjYW5ub3Qgc2V0IHN0b3JlIHBlcm1pc3Npb25zICR7bW9kZX0gKCR7ZXJyLm1lc3NhZ2V9KWApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBwYXRoIG9yIHN1YiBwYXRoXG4gICAgICAgICAqIEBwYXJhbSBmaWxlXG4gICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuZ2V0UGF0aCA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gcGF0aCArIChmaWxlID8gYC8ke2ZpbGV9YCA6ICcnKTtcbiAgICAgICAgfTtcblxuXG4gICAgICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmVtb3ZlcyB0aGUgZmlsZVxuICAgICAgICAgICAgICogQHBhcmFtIGZpbGVJZFxuICAgICAgICAgICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gKGZpbGVJZCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHRoaXMuZ2V0RmlsZVBhdGgoZmlsZUlkKTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihgTG9jYWxTdG9yZTogY2Fubm90IGRlbGV0ZSBmaWxlIFwiJHtmaWxlSWR9XCIgYXQgJHtwYXRofSAoJHtlcnIubWVzc2FnZX0pYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgZnMgPSBOcG0ucmVxdWlyZSgnZnMnKTtcbiAgICAgICAgICAgICAgICBmcy5zdGF0KHBhdGgsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVyciwgc3RhdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBzdGF0ICYmIHN0YXQuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZzLnVubGluayhwYXRoLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmdldENvbGxlY3Rpb24oKS5yZW1vdmUoZmlsZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKHNlbGYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHRoZSBmaWxlIHJlYWQgc3RyZWFtXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAgICAgICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZ2V0UmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChmaWxlSWQsIGZpbGUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmcyA9IE5wbS5yZXF1aXJlKCdmcycpO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0oc2VsZi5nZXRGaWxlUGF0aChmaWxlSWQsIGZpbGUpLCB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzOiAncicsXG4gICAgICAgICAgICAgICAgICAgIGVuY29kaW5nOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBhdXRvQ2xvc2U6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBvcHRpb25zLnN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICBlbmQ6IG9wdGlvbnMuZW5kXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZVxuICAgICAgICAgICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgICAgICAgICAqIEByZXR1cm4geyp9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbiAoZmlsZUlkLCBmaWxlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnMgPSBOcG0ucmVxdWlyZSgnZnMnKTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmcy5jcmVhdGVXcml0ZVN0cmVhbShzZWxmLmdldEZpbGVQYXRoKGZpbGVJZCwgZmlsZSksIHtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3M6ICdhJyxcbiAgICAgICAgICAgICAgICAgICAgZW5jb2Rpbmc6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG1vZGU6IHdyaXRlTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IG9wdGlvbnMuc3RhcnRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBmaWxlIHBhdGhcbiAgICAgKiBAcGFyYW0gZmlsZUlkXG4gICAgICogQHBhcmFtIGZpbGVcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0RmlsZVBhdGgoZmlsZUlkLCBmaWxlKSB7XG4gICAgICAgIGZpbGUgPSBmaWxlIHx8IHRoaXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoZmlsZUlkLCB7ZmllbGRzOiB7ZXh0ZW5zaW9uOiAxfX0pO1xuICAgICAgICByZXR1cm4gZmlsZSAmJiB0aGlzLmdldFBhdGgoZmlsZUlkICsgKGZpbGUuZXh0ZW5zaW9uID8gYC4ke2ZpbGUuZXh0ZW5zaW9uIH1gIDogJycpKTtcbiAgICB9XG59XG5cbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXG5VcGxvYWRGUy5zdG9yZS5Mb2NhbCA9IExvY2FsU3RvcmU7XG4iXX0=
