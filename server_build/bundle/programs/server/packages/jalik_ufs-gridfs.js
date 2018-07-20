(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var options;

var require = meteorInstall({"node_modules":{"meteor":{"jalik:ufs-gridfs":{"ufs-gridfs.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/jalik_ufs-gridfs/ufs-gridfs.js                                            //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
module.export({
  GridFSStore: () => GridFSStore
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

class GridFSStore extends UploadFS.Store {
  constructor(options) {
    // Default options
    options = _.extend({
      chunkSize: 1024 * 255,
      collectionName: 'uploadfs'
    }, options); // Check options

    if (typeof options.chunkSize !== "number") {
      throw new TypeError("GridFSStore: chunkSize is not a number");
    }

    if (typeof options.collectionName !== "string") {
      throw new TypeError("GridFSStore: collectionName is not a string");
    }

    super(options);
    this.chunkSize = options.chunkSize;
    this.collectionName = options.collectionName;

    if (Meteor.isServer) {
      let mongo = Package.mongo.MongoInternals.NpmModule;
      let db = Package.mongo.MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      let mongoStore = new mongo.GridFSBucket(db, {
        bucketName: options.collectionName,
        chunkSizeBytes: options.chunkSize
      });
      /**
       * Removes the file
       * @param fileId
       * @param callback
       */

      this.delete = function (fileId, callback) {
        if (typeof callback !== 'function') {
          callback = function (err) {
            if (err) {
              console.error(err);
            }
          };
        }

        return mongoStore.delete(fileId, callback);
      };
      /**
       * Returns the file read stream
       * @param fileId
       * @param file
       * @param options
       * @return {*}
       */


      this.getReadStream = function (fileId, file, options) {
        options = _.extend({}, options);
        return mongoStore.openDownloadStream(fileId, {
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
        let writeStream = mongoStore.openUploadStreamWithId(fileId, fileId, {
          chunkSizeBytes: this.chunkSize,
          contentType: file.type
        });
        writeStream.on('close', function () {
          writeStream.emit('finish');
        });
        return writeStream;
      };
    }
  }

}

// Add store to UFS namespace
UploadFS.store.GridFS = GridFSStore;
////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/jalik:ufs-gridfs/ufs-gridfs.js");

/* Exports */
Package._define("jalik:ufs-gridfs", exports);

})();

//# sourceURL=meteor://💻app/packages/jalik_ufs-gridfs.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzLWdyaWRmcy91ZnMtZ3JpZGZzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkdyaWRGU1N0b3JlIiwiXyIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJjaGVjayIsIk1ldGVvciIsIlVwbG9hZEZTIiwiU3RvcmUiLCJjb25zdHJ1Y3RvciIsIm9wdGlvbnMiLCJleHRlbmQiLCJjaHVua1NpemUiLCJjb2xsZWN0aW9uTmFtZSIsIlR5cGVFcnJvciIsImlzU2VydmVyIiwibW9uZ28iLCJQYWNrYWdlIiwiTW9uZ29JbnRlcm5hbHMiLCJOcG1Nb2R1bGUiLCJkYiIsImRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyIiwibW9uZ29TdG9yZSIsIkdyaWRGU0J1Y2tldCIsImJ1Y2tldE5hbWUiLCJjaHVua1NpemVCeXRlcyIsImRlbGV0ZSIsImZpbGVJZCIsImNhbGxiYWNrIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwiZ2V0UmVhZFN0cmVhbSIsImZpbGUiLCJvcGVuRG93bmxvYWRTdHJlYW0iLCJzdGFydCIsImVuZCIsImdldFdyaXRlU3RyZWFtIiwid3JpdGVTdHJlYW0iLCJvcGVuVXBsb2FkU3RyZWFtV2l0aElkIiwiY29udGVudFR5cGUiLCJ0eXBlIiwib24iLCJlbWl0Iiwic3RvcmUiLCJHcmlkRlMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGVBQVksTUFBSUE7QUFBakIsQ0FBZDs7QUFBNkMsSUFBSUMsQ0FBSjs7QUFBTUgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0YsSUFBRUcsQ0FBRixFQUFJO0FBQUNILFFBQUVHLENBQUY7QUFBSTs7QUFBVixDQUExQyxFQUFzRCxDQUF0RDtBQUF5RCxJQUFJQyxLQUFKO0FBQVVQLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxjQUFS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LENBQWUsT0FBZixFQUF3QixZQUFZO0FBQ2hDSixzQkFBWUssSUFBWixDQUFpQixRQUFqQjtBQUNILFNBRkQ7QUFHQSxlQUFPTCxXQUFQO0FBQ0gsT0FURDtBQVVIO0FBQ0o7O0FBL0UyQzs7QUFrRmhEO0FBQ0EvQixTQUFTcUMsS0FBVCxDQUFlQyxNQUFmLEdBQXdCN0MsV0FBeEIsQyIsImZpbGUiOiIvcGFja2FnZXMvamFsaWtfdWZzLWdyaWRmcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5pbXBvcnQge199IGZyb20gXCJtZXRlb3IvdW5kZXJzY29yZVwiO1xyXG5pbXBvcnQge2NoZWNrfSBmcm9tIFwibWV0ZW9yL2NoZWNrXCI7XHJcbmltcG9ydCB7TWV0ZW9yfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xyXG5pbXBvcnQge1VwbG9hZEZTfSBmcm9tIFwibWV0ZW9yL2phbGlrOnVmc1wiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBHcmlkRlMgc3RvcmVcclxuICogQHBhcmFtIG9wdGlvbnNcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR3JpZEZTU3RvcmUgZXh0ZW5kcyBVcGxvYWRGUy5TdG9yZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIC8vIERlZmF1bHQgb3B0aW9uc1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGNodW5rU2l6ZTogMTAyNCAqIDI1NSxcclxuICAgICAgICAgICAgY29sbGVjdGlvbk5hbWU6ICd1cGxvYWRmcydcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgb3B0aW9uc1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5jaHVua1NpemUgIT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdyaWRGU1N0b3JlOiBjaHVua1NpemUgaXMgbm90IGEgbnVtYmVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29sbGVjdGlvbk5hbWUgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdyaWRGU1N0b3JlOiBjb2xsZWN0aW9uTmFtZSBpcyBub3QgYSBzdHJpbmdcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdXBlcihvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5jaHVua1NpemUgPSBvcHRpb25zLmNodW5rU2l6ZTtcclxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gb3B0aW9ucy5jb2xsZWN0aW9uTmFtZTtcclxuXHJcbiAgICAgICAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xyXG4gICAgICAgICAgICBsZXQgbW9uZ28gPSBQYWNrYWdlLm1vbmdvLk1vbmdvSW50ZXJuYWxzLk5wbU1vZHVsZTtcclxuICAgICAgICAgICAgbGV0IGRiID0gUGFja2FnZS5tb25nby5Nb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLmRiO1xyXG4gICAgICAgICAgICBsZXQgbW9uZ29TdG9yZSA9IG5ldyBtb25nby5HcmlkRlNCdWNrZXQoZGIsIHtcclxuICAgICAgICAgICAgICAgIGJ1Y2tldE5hbWU6IG9wdGlvbnMuY29sbGVjdGlvbk5hbWUsXHJcbiAgICAgICAgICAgICAgICBjaHVua1NpemVCeXRlczogb3B0aW9ucy5jaHVua1NpemVcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogUmVtb3ZlcyB0aGUgZmlsZVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgdGhpcy5kZWxldGUgPSBmdW5jdGlvbiAoZmlsZUlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9uZ29TdG9yZS5kZWxldGUoZmlsZUlkLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogUmV0dXJucyB0aGUgZmlsZSByZWFkIHN0cmVhbVxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBvcHRpb25zXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4geyp9XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB0aGlzLmdldFJlYWRTdHJlYW0gPSBmdW5jdGlvbiAoZmlsZUlkLCBmaWxlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe30sIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vbmdvU3RvcmUub3BlbkRvd25sb2FkU3RyZWFtKGZpbGVJZCwge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBvcHRpb25zLnN0YXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgIGVuZDogb3B0aW9ucy5lbmRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAgICAgICAgICogQHBhcmFtIGZpbGVcclxuICAgICAgICAgICAgICogQHBhcmFtIG9wdGlvbnNcclxuICAgICAgICAgICAgICogQHJldHVybiB7Kn1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbiAoZmlsZUlkLCBmaWxlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgd3JpdGVTdHJlYW0gPSBtb25nb1N0b3JlLm9wZW5VcGxvYWRTdHJlYW1XaXRoSWQoZmlsZUlkLCBmaWxlSWQsIHtcclxuICAgICAgICAgICAgICAgICAgICBjaHVua1NpemVCeXRlczogdGhpcy5jaHVua1NpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGZpbGUudHlwZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB3cml0ZVN0cmVhbS5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVTdHJlYW0uZW1pdCgnZmluaXNoJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB3cml0ZVN0cmVhbTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXHJcblVwbG9hZEZTLnN0b3JlLkdyaWRGUyA9IEdyaWRGU1N0b3JlO1xyXG4iXX0=
