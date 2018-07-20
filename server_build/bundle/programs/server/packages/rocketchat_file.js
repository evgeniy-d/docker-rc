(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var RocketChatFile;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:file":{"file.server.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                          //
// packages/rocketchat_file/file.server.js                                                  //
//                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////
                                                                                            //
let Grid;
module.watch(require("gridfs-stream"), {
  default(v) {
    Grid = v;
  }

}, 0);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 1);
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 2);
let path;
module.watch(require("path"), {
  default(v) {
    path = v;
  }

}, 3);
let mkdirp;
module.watch(require("mkdirp"), {
  default(v) {
    mkdirp = v;
  }

}, 4);

// Fix problem with usernames being converted to object id
Grid.prototype.tryParseObjectId = function () {
  return false;
}; //TODO: REMOVE RocketChatFile from globals


RocketChatFile = {};

RocketChatFile.bufferToStream = function (buffer) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);
  return bufferStream;
};

RocketChatFile.dataURIParse = function (dataURI) {
  const imageData = dataURI.split(';base64,');
  return {
    image: imageData[1],
    contentType: imageData[0].replace('data:', '')
  };
};

RocketChatFile.addPassThrough = function (st, fn) {
  const pass = new stream.PassThrough();
  fn(pass, st);
  return pass;
};

RocketChatFile.GridFS = class {
  constructor(config = {}) {
    const {
      name = 'file',
      transformWrite
    } = config;
    this.name = name;
    this.transformWrite = transformWrite;
    const mongo = Package.mongo.MongoInternals.NpmModule;
    const db = Package.mongo.MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    this.store = new Grid(db, mongo);
    this.findOneSync = Meteor.wrapAsync(this.store.collection(this.name).findOne.bind(this.store.collection(this.name)));
    this.removeSync = Meteor.wrapAsync(this.store.remove.bind(this.store));
    this.countSync = Meteor.wrapAsync(this.store._col.count.bind(this.store._col));
    this.getFileSync = Meteor.wrapAsync(this.getFile.bind(this));
  }

  findOne(fileName) {
    return this.findOneSync({
      _id: fileName
    });
  }

  remove(fileName) {
    return this.removeSync({
      _id: fileName,
      root: this.name
    });
  }

  createWriteStream(fileName, contentType) {
    const self = this;
    let ws = this.store.createWriteStream({
      _id: fileName,
      filename: fileName,
      mode: 'w',
      root: this.name,
      content_type: contentType
    });

    if (self.transformWrite != null) {
      ws = RocketChatFile.addPassThrough(ws, function (rs, ws) {
        const file = {
          name: self.name,
          fileName,
          contentType
        };
        return self.transformWrite(file, rs, ws);
      });
    }

    ws.on('close', function () {
      return ws.emit('end');
    });
    return ws;
  }

  createReadStream(fileName) {
    return this.store.createReadStream({
      _id: fileName,
      root: this.name
    });
  }

  getFileWithReadStream(fileName) {
    const file = this.findOne(fileName);

    if (file == null) {
      return null;
    }

    const rs = this.createReadStream(fileName);
    return {
      readStream: rs,
      contentType: file.contentType,
      length: file.length,
      uploadDate: file.uploadDate
    };
  }

  getFile(fileName, cb) {
    const file = this.getFileWithReadStream(fileName);

    if (!file) {
      return cb();
    }

    const data = [];
    file.readStream.on('data', Meteor.bindEnvironment(function (chunk) {
      return data.push(chunk);
    }));
    return file.readStream.on('end', Meteor.bindEnvironment(function () {
      return cb(null, {
        buffer: Buffer.concat(data),
        contentType: file.contentType,
        length: file.length,
        uploadDate: file.uploadDate
      });
    }));
  }

  deleteFile(fileName) {
    const file = this.findOne(fileName);

    if (file == null) {
      return undefined;
    }

    return this.remove(fileName);
  }

};
RocketChatFile.FileSystem = class {
  constructor(config = {}) {
    let {
      absolutePath = '~/uploads'
    } = config;
    const {
      transformWrite
    } = config;
    this.transformWrite = transformWrite;

    if (absolutePath.split(path.sep)[0] === '~') {
      const homepath = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

      if (homepath != null) {
        absolutePath = absolutePath.replace('~', homepath);
      } else {
        throw new Error('Unable to resolve "~" in path');
      }
    }

    this.absolutePath = path.resolve(absolutePath);
    mkdirp.sync(this.absolutePath);
    this.statSync = Meteor.wrapAsync(fs.stat.bind(fs));
    this.unlinkSync = Meteor.wrapAsync(fs.unlink.bind(fs));
    this.getFileSync = Meteor.wrapAsync(this.getFile.bind(this));
  }

  createWriteStream(fileName, contentType) {
    const self = this;
    let ws = fs.createWriteStream(path.join(this.absolutePath, fileName));

    if (self.transformWrite != null) {
      ws = RocketChatFile.addPassThrough(ws, function (rs, ws) {
        const file = {
          fileName,
          contentType
        };
        return self.transformWrite(file, rs, ws);
      });
    }

    ws.on('close', function () {
      return ws.emit('end');
    });
    return ws;
  }

  createReadStream(fileName) {
    return fs.createReadStream(path.join(this.absolutePath, fileName));
  }

  stat(fileName) {
    return this.statSync(path.join(this.absolutePath, fileName));
  }

  remove(fileName) {
    return this.unlinkSync(path.join(this.absolutePath, fileName));
  }

  getFileWithReadStream(fileName) {
    try {
      const stat = this.stat(fileName);
      const rs = this.createReadStream(fileName);
      return {
        readStream: rs,
        // contentType: file.contentType
        length: stat.size
      };
    } catch (error1) {
      return null;
    }
  }

  getFile(fileName, cb) {
    const file = this.getFileWithReadStream(fileName);

    if (!file) {
      return cb();
    }

    const data = [];
    file.readStream.on('data', Meteor.bindEnvironment(function (chunk) {
      return data.push(chunk);
    }));
    return file.readStream.on('end', Meteor.bindEnvironment(function () {
      return {
        buffer: Buffer.concat(data)({
          contentType: file.contentType,
          length: file.length,
          uploadDate: file.uploadDate
        })
      };
    }));
  }

  deleteFile(fileName) {
    try {
      return this.remove(fileName);
    } catch (error1) {
      return null;
    }
  }

};
//////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:file/file.server.js");

/* Exports */
Package._define("rocketchat:file", {
  RocketChatFile: RocketChatFile
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_file.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlL2ZpbGUuc2VydmVyLmpzIl0sIm5hbWVzIjpbIkdyaWQiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInN0cmVhbSIsImZzIiwicGF0aCIsIm1rZGlycCIsInByb3RvdHlwZSIsInRyeVBhcnNlT2JqZWN0SWQiLCJSb2NrZXRDaGF0RmlsZSIsImJ1ZmZlclRvU3RyZWFtIiwiYnVmZmVyIiwiYnVmZmVyU3RyZWFtIiwiUGFzc1Rocm91Z2giLCJlbmQiLCJkYXRhVVJJUGFyc2UiLCJkYXRhVVJJIiwiaW1hZ2VEYXRhIiwic3BsaXQiLCJpbWFnZSIsImNvbnRlbnRUeXBlIiwicmVwbGFjZSIsImFkZFBhc3NUaHJvdWdoIiwic3QiLCJmbiIsInBhc3MiLCJHcmlkRlMiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsIm5hbWUiLCJ0cmFuc2Zvcm1Xcml0ZSIsIm1vbmdvIiwiUGFja2FnZSIsIk1vbmdvSW50ZXJuYWxzIiwiTnBtTW9kdWxlIiwiZGIiLCJkZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlciIsInN0b3JlIiwiZmluZE9uZVN5bmMiLCJNZXRlb3IiLCJ3cmFwQXN5bmMiLCJjb2xsZWN0aW9uIiwiZmluZE9uZSIsImJpbmQiLCJyZW1vdmVTeW5jIiwicmVtb3ZlIiwiY291bnRTeW5jIiwiX2NvbCIsImNvdW50IiwiZ2V0RmlsZVN5bmMiLCJnZXRGaWxlIiwiZmlsZU5hbWUiLCJfaWQiLCJyb290IiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJzZWxmIiwid3MiLCJmaWxlbmFtZSIsIm1vZGUiLCJjb250ZW50X3R5cGUiLCJycyIsImZpbGUiLCJvbiIsImVtaXQiLCJjcmVhdGVSZWFkU3RyZWFtIiwiZ2V0RmlsZVdpdGhSZWFkU3RyZWFtIiwicmVhZFN0cmVhbSIsImxlbmd0aCIsInVwbG9hZERhdGUiLCJjYiIsImRhdGEiLCJiaW5kRW52aXJvbm1lbnQiLCJjaHVuayIsInB1c2giLCJCdWZmZXIiLCJjb25jYXQiLCJkZWxldGVGaWxlIiwidW5kZWZpbmVkIiwiRmlsZVN5c3RlbSIsImFic29sdXRlUGF0aCIsInNlcCIsImhvbWVwYXRoIiwicHJvY2VzcyIsImVudiIsIkhPTUUiLCJIT01FUEFUSCIsIlVTRVJQUk9GSUxFIiwiRXJyb3IiLCJyZXNvbHZlIiwic3luYyIsInN0YXRTeW5jIiwic3RhdCIsInVubGlua1N5bmMiLCJ1bmxpbmsiLCJqb2luIiwic2l6ZSIsImVycm9yMSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLElBQUo7QUFBU0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsV0FBS0ssQ0FBTDtBQUFPOztBQUFuQixDQUF0QyxFQUEyRCxDQUEzRDtBQUE4RCxJQUFJQyxNQUFKO0FBQVdMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLGFBQU9ELENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFBeUQsSUFBSUUsRUFBSjtBQUFPTixPQUFPQyxLQUFQLENBQWFDLFFBQVEsSUFBUixDQUFiLEVBQTJCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDRSxTQUFHRixDQUFIO0FBQUs7O0FBQWpCLENBQTNCLEVBQThDLENBQTlDO0FBQWlELElBQUlHLElBQUo7QUFBU1AsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLE1BQVIsQ0FBYixFQUE2QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0csV0FBS0gsQ0FBTDtBQUFPOztBQUFuQixDQUE3QixFQUFrRCxDQUFsRDtBQUFxRCxJQUFJSSxNQUFKO0FBQVdSLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNJLGFBQU9KLENBQVA7QUFBUzs7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LFFBQVIsRUFBa0JrQixFQUFsQixFQUFzQjtBQUNyQixVQUFNUixPQUFPLEtBQUtJLHFCQUFMLENBQTJCZCxRQUEzQixDQUFiOztBQUNBLFFBQUksQ0FBQ1UsSUFBTCxFQUFXO0FBQ1YsYUFBT1EsSUFBUDtBQUNBOztBQUNELFVBQU1DLE9BQU8sRUFBYjtBQUNBVCxTQUFLSyxVQUFMLENBQWdCSixFQUFoQixDQUFtQixNQUFuQixFQUEyQnZCLE9BQU9nQyxlQUFQLENBQXVCLFVBQVNDLEtBQVQsRUFBZ0I7QUFDakUsYUFBT0YsS0FBS0csSUFBTCxDQUFVRCxLQUFWLENBQVA7QUFDQSxLQUYwQixDQUEzQjtBQUdBLFdBQU9YLEtBQUtLLFVBQUwsQ0FBZ0JKLEVBQWhCLENBQW1CLEtBQW5CLEVBQTBCdkIsT0FBT2dDLGVBQVAsQ0FBdUIsWUFBVztBQUNsRSxhQUFPO0FBQ041RCxnQkFBUStELE9BQU9DLE1BQVAsQ0FBY0wsSUFBZCxFQUFvQjtBQUMzQmxELHVCQUFheUMsS0FBS3pDLFdBRFM7QUFFM0IrQyxrQkFBUU4sS0FBS00sTUFGYztBQUczQkMsc0JBQVlQLEtBQUtPO0FBSFUsU0FBcEI7QUFERixPQUFQO0FBT0EsS0FSZ0MsQ0FBMUIsQ0FBUDtBQVNBOztBQUVEUSxhQUFXekIsUUFBWCxFQUFxQjtBQUNwQixRQUFJO0FBQ0gsYUFBTyxLQUFLTixNQUFMLENBQVlNLFFBQVosQ0FBUDtBQUNBLEtBRkQsQ0FFRSxPQUFPNkMsTUFBUCxFQUFlO0FBQ2hCLGFBQU8sSUFBUDtBQUNBO0FBQ0Q7O0FBM0ZnQyxDQUFsQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2ZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR3JpZCBmcm9tICdncmlkZnMtc3RyZWFtJztcbmltcG9ydCBzdHJlYW0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBta2RpcnAgZnJvbSAnbWtkaXJwJztcblxuLy8gRml4IHByb2JsZW0gd2l0aCB1c2VybmFtZXMgYmVpbmcgY29udmVydGVkIHRvIG9iamVjdCBpZFxuR3JpZC5wcm90b3R5cGUudHJ5UGFyc2VPYmplY3RJZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZmFsc2U7XG59O1xuLy9UT0RPOiBSRU1PVkUgUm9ja2V0Q2hhdEZpbGUgZnJvbSBnbG9iYWxzXG5Sb2NrZXRDaGF0RmlsZSA9IHt9O1xuXG5Sb2NrZXRDaGF0RmlsZS5idWZmZXJUb1N0cmVhbSA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xuXHRjb25zdCBidWZmZXJTdHJlYW0gPSBuZXcgc3RyZWFtLlBhc3NUaHJvdWdoKCk7XG5cdGJ1ZmZlclN0cmVhbS5lbmQoYnVmZmVyKTtcblx0cmV0dXJuIGJ1ZmZlclN0cmVhbTtcbn07XG5cblJvY2tldENoYXRGaWxlLmRhdGFVUklQYXJzZSA9IGZ1bmN0aW9uKGRhdGFVUkkpIHtcblx0Y29uc3QgaW1hZ2VEYXRhID0gZGF0YVVSSS5zcGxpdCgnO2Jhc2U2NCwnKTtcblx0cmV0dXJuIHtcblx0XHRpbWFnZTogaW1hZ2VEYXRhWzFdLFxuXHRcdGNvbnRlbnRUeXBlOiBpbWFnZURhdGFbMF0ucmVwbGFjZSgnZGF0YTonLCAnJylcblx0fTtcbn07XG5cblJvY2tldENoYXRGaWxlLmFkZFBhc3NUaHJvdWdoID0gZnVuY3Rpb24oc3QsIGZuKSB7XG5cdGNvbnN0IHBhc3MgPSBuZXcgc3RyZWFtLlBhc3NUaHJvdWdoKCk7XG5cdGZuKHBhc3MsIHN0KTtcblx0cmV0dXJuIHBhc3M7XG59O1xuXG5Sb2NrZXRDaGF0RmlsZS5HcmlkRlMgPSBjbGFzcyB7XG5cdGNvbnN0cnVjdG9yKGNvbmZpZyA9IHt9KSB7XG5cdFx0Y29uc3Qge25hbWUgPSAnZmlsZScsIHRyYW5zZm9ybVdyaXRlfSA9IGNvbmZpZztcblxuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0dGhpcy50cmFuc2Zvcm1Xcml0ZSA9IHRyYW5zZm9ybVdyaXRlO1xuXHRcdGNvbnN0IG1vbmdvID0gUGFja2FnZS5tb25nby5Nb25nb0ludGVybmFscy5OcG1Nb2R1bGU7XG5cdFx0Y29uc3QgZGIgPSBQYWNrYWdlLm1vbmdvLk1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKCkubW9uZ28uZGI7XG5cdFx0dGhpcy5zdG9yZSA9IG5ldyBHcmlkKGRiLCBtb25nbyk7XG5cdFx0dGhpcy5maW5kT25lU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5zdG9yZS5jb2xsZWN0aW9uKHRoaXMubmFtZSkuZmluZE9uZS5iaW5kKHRoaXMuc3RvcmUuY29sbGVjdGlvbih0aGlzLm5hbWUpKSk7XG5cdFx0dGhpcy5yZW1vdmVTeW5jID0gTWV0ZW9yLndyYXBBc3luYyh0aGlzLnN0b3JlLnJlbW92ZS5iaW5kKHRoaXMuc3RvcmUpKTtcblx0XHR0aGlzLmNvdW50U3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5zdG9yZS5fY29sLmNvdW50LmJpbmQodGhpcy5zdG9yZS5fY29sKSk7XG5cdFx0dGhpcy5nZXRGaWxlU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5nZXRGaWxlLmJpbmQodGhpcykpO1xuXHR9XG5cblx0ZmluZE9uZShmaWxlTmFtZSkge1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmVTeW5jKHtcblx0XHRcdF9pZDogZmlsZU5hbWVcblx0XHR9KTtcblx0fVxuXG5cdHJlbW92ZShmaWxlTmFtZSkge1xuXHRcdHJldHVybiB0aGlzLnJlbW92ZVN5bmMoe1xuXHRcdFx0X2lkOiBmaWxlTmFtZSxcblx0XHRcdHJvb3Q6IHRoaXMubmFtZVxuXHRcdH0pO1xuXHR9XG5cblx0Y3JlYXRlV3JpdGVTdHJlYW0oZmlsZU5hbWUsIGNvbnRlbnRUeXBlKSB7XG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdFx0bGV0IHdzID0gdGhpcy5zdG9yZS5jcmVhdGVXcml0ZVN0cmVhbSh7XG5cdFx0XHRfaWQ6IGZpbGVOYW1lLFxuXHRcdFx0ZmlsZW5hbWU6IGZpbGVOYW1lLFxuXHRcdFx0bW9kZTogJ3cnLFxuXHRcdFx0cm9vdDogdGhpcy5uYW1lLFxuXHRcdFx0Y29udGVudF90eXBlOiBjb250ZW50VHlwZVxuXHRcdH0pO1xuXHRcdGlmIChzZWxmLnRyYW5zZm9ybVdyaXRlICE9IG51bGwpIHtcblx0XHRcdHdzID0gUm9ja2V0Q2hhdEZpbGUuYWRkUGFzc1Rocm91Z2god3MsIGZ1bmN0aW9uKHJzLCB3cykge1xuXHRcdFx0XHRjb25zdCBmaWxlID0ge1xuXHRcdFx0XHRcdG5hbWU6IHNlbGYubmFtZSxcblx0XHRcdFx0XHRmaWxlTmFtZSxcblx0XHRcdFx0XHRjb250ZW50VHlwZVxuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXR1cm4gc2VsZi50cmFuc2Zvcm1Xcml0ZShmaWxlLCBycywgd3MpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHdzLm9uKCdjbG9zZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHdzLmVtaXQoJ2VuZCcpO1xuXHRcdH0pO1xuXHRcdHJldHVybiB3cztcblx0fVxuXG5cdGNyZWF0ZVJlYWRTdHJlYW0oZmlsZU5hbWUpIHtcblx0XHRyZXR1cm4gdGhpcy5zdG9yZS5jcmVhdGVSZWFkU3RyZWFtKHtcblx0XHRcdF9pZDogZmlsZU5hbWUsXG5cdFx0XHRyb290OiB0aGlzLm5hbWVcblx0XHR9KTtcblx0fVxuXG5cdGdldEZpbGVXaXRoUmVhZFN0cmVhbShmaWxlTmFtZSkge1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLmZpbmRPbmUoZmlsZU5hbWUpO1xuXHRcdGlmIChmaWxlID09IG51bGwpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRjb25zdCBycyA9IHRoaXMuY3JlYXRlUmVhZFN0cmVhbShmaWxlTmFtZSk7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlYWRTdHJlYW06IHJzLFxuXHRcdFx0Y29udGVudFR5cGU6IGZpbGUuY29udGVudFR5cGUsXG5cdFx0XHRsZW5ndGg6IGZpbGUubGVuZ3RoLFxuXHRcdFx0dXBsb2FkRGF0ZTogZmlsZS51cGxvYWREYXRlXG5cdFx0fTtcblx0fVxuXG5cdGdldEZpbGUoZmlsZU5hbWUsIGNiKSB7XG5cdFx0Y29uc3QgZmlsZSA9IHRoaXMuZ2V0RmlsZVdpdGhSZWFkU3RyZWFtKGZpbGVOYW1lKTtcblx0XHRpZiAoIWZpbGUpIHtcblx0XHRcdHJldHVybiBjYigpO1xuXHRcdH1cblx0XHRjb25zdCBkYXRhID0gW107XG5cdFx0ZmlsZS5yZWFkU3RyZWFtLm9uKCdkYXRhJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihjaHVuaykge1xuXHRcdFx0cmV0dXJuIGRhdGEucHVzaChjaHVuayk7XG5cdFx0fSkpO1xuXHRcdHJldHVybiBmaWxlLnJlYWRTdHJlYW0ub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gY2IobnVsbCwge1xuXHRcdFx0XHRidWZmZXI6IEJ1ZmZlci5jb25jYXQoZGF0YSksXG5cdFx0XHRcdGNvbnRlbnRUeXBlOiBmaWxlLmNvbnRlbnRUeXBlLFxuXHRcdFx0XHRsZW5ndGg6IGZpbGUubGVuZ3RoLFxuXHRcdFx0XHR1cGxvYWREYXRlOiBmaWxlLnVwbG9hZERhdGVcblx0XHRcdH0pO1xuXHRcdH0pKTtcblx0fVxuXG5cdGRlbGV0ZUZpbGUoZmlsZU5hbWUpIHtcblx0XHRjb25zdCBmaWxlID0gdGhpcy5maW5kT25lKGZpbGVOYW1lKTtcblx0XHRpZiAoZmlsZSA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoZmlsZU5hbWUpO1xuXHR9XG5cblxufTtcblxuUm9ja2V0Q2hhdEZpbGUuRmlsZVN5c3RlbSA9IGNsYXNzIHtcblx0Y29uc3RydWN0b3IoY29uZmlnID0ge30pIHtcblx0XHRsZXQge2Fic29sdXRlUGF0aCA9ICd+L3VwbG9hZHMnfSA9IGNvbmZpZztcblx0XHRjb25zdCB7dHJhbnNmb3JtV3JpdGV9ID0gY29uZmlnO1xuXG5cdFx0dGhpcy50cmFuc2Zvcm1Xcml0ZSA9IHRyYW5zZm9ybVdyaXRlO1xuXHRcdGlmIChhYnNvbHV0ZVBhdGguc3BsaXQocGF0aC5zZXApWzBdID09PSAnficpIHtcblx0XHRcdGNvbnN0IGhvbWVwYXRoID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5IT01FUEFUSCB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcblx0XHRcdGlmIChob21lcGF0aCAhPSBudWxsKSB7XG5cdFx0XHRcdGFic29sdXRlUGF0aCA9IGFic29sdXRlUGF0aC5yZXBsYWNlKCd+JywgaG9tZXBhdGgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gcmVzb2x2ZSBcIn5cIiBpbiBwYXRoJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuYWJzb2x1dGVQYXRoID0gcGF0aC5yZXNvbHZlKGFic29sdXRlUGF0aCk7XG5cdFx0bWtkaXJwLnN5bmModGhpcy5hYnNvbHV0ZVBhdGgpO1xuXHRcdHRoaXMuc3RhdFN5bmMgPSBNZXRlb3Iud3JhcEFzeW5jKGZzLnN0YXQuYmluZChmcykpO1xuXHRcdHRoaXMudW5saW5rU3luYyA9IE1ldGVvci53cmFwQXN5bmMoZnMudW5saW5rLmJpbmQoZnMpKTtcblx0XHR0aGlzLmdldEZpbGVTeW5jID0gTWV0ZW9yLndyYXBBc3luYyh0aGlzLmdldEZpbGUuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRjcmVhdGVXcml0ZVN0cmVhbShmaWxlTmFtZSwgY29udGVudFR5cGUpIHtcblx0XHRjb25zdCBzZWxmID0gdGhpcztcblx0XHRsZXQgd3MgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShwYXRoLmpvaW4odGhpcy5hYnNvbHV0ZVBhdGgsIGZpbGVOYW1lKSk7XG5cdFx0aWYgKHNlbGYudHJhbnNmb3JtV3JpdGUgIT0gbnVsbCkge1xuXHRcdFx0d3MgPSBSb2NrZXRDaGF0RmlsZS5hZGRQYXNzVGhyb3VnaCh3cywgZnVuY3Rpb24ocnMsIHdzKSB7XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSB7XG5cdFx0XHRcdFx0ZmlsZU5hbWUsXG5cdFx0XHRcdFx0Y29udGVudFR5cGVcblx0XHRcdFx0fTtcblx0XHRcdFx0cmV0dXJuIHNlbGYudHJhbnNmb3JtV3JpdGUoZmlsZSwgcnMsIHdzKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0XHR3cy5vbignY2xvc2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB3cy5lbWl0KCdlbmQnKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gd3M7XG5cdH1cblxuXHRjcmVhdGVSZWFkU3RyZWFtKGZpbGVOYW1lKSB7XG5cdFx0cmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aC5qb2luKHRoaXMuYWJzb2x1dGVQYXRoLCBmaWxlTmFtZSkpO1xuXHR9XG5cblx0c3RhdChmaWxlTmFtZSkge1xuXHRcdHJldHVybiB0aGlzLnN0YXRTeW5jKHBhdGguam9pbih0aGlzLmFic29sdXRlUGF0aCwgZmlsZU5hbWUpKTtcblx0fVxuXG5cdHJlbW92ZShmaWxlTmFtZSkge1xuXHRcdHJldHVybiB0aGlzLnVubGlua1N5bmMocGF0aC5qb2luKHRoaXMuYWJzb2x1dGVQYXRoLCBmaWxlTmFtZSkpO1xuXHR9XG5cblx0Z2V0RmlsZVdpdGhSZWFkU3RyZWFtKGZpbGVOYW1lKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHN0YXQgPSB0aGlzLnN0YXQoZmlsZU5hbWUpO1xuXHRcdFx0Y29uc3QgcnMgPSB0aGlzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZU5hbWUpO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cmVhZFN0cmVhbTogcnMsXG5cdFx0XHRcdC8vIGNvbnRlbnRUeXBlOiBmaWxlLmNvbnRlbnRUeXBlXG5cdFx0XHRcdGxlbmd0aDogc3RhdC5zaXplXG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yMSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0Z2V0RmlsZShmaWxlTmFtZSwgY2IpIHtcblx0XHRjb25zdCBmaWxlID0gdGhpcy5nZXRGaWxlV2l0aFJlYWRTdHJlYW0oZmlsZU5hbWUpO1xuXHRcdGlmICghZmlsZSkge1xuXHRcdFx0cmV0dXJuIGNiKCk7XG5cdFx0fVxuXHRcdGNvbnN0IGRhdGEgPSBbXTtcblx0XHRmaWxlLnJlYWRTdHJlYW0ub24oJ2RhdGEnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKGNodW5rKSB7XG5cdFx0XHRyZXR1cm4gZGF0YS5wdXNoKGNodW5rKTtcblx0XHR9KSk7XG5cdFx0cmV0dXJuIGZpbGUucmVhZFN0cmVhbS5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJ1ZmZlcjogQnVmZmVyLmNvbmNhdChkYXRhKSh7XG5cdFx0XHRcdFx0Y29udGVudFR5cGU6IGZpbGUuY29udGVudFR5cGUsXG5cdFx0XHRcdFx0bGVuZ3RoOiBmaWxlLmxlbmd0aCxcblx0XHRcdFx0XHR1cGxvYWREYXRlOiBmaWxlLnVwbG9hZERhdGVcblx0XHRcdFx0fSlcblx0XHRcdH07XG5cdFx0fSkpO1xuXHR9XG5cblx0ZGVsZXRlRmlsZShmaWxlTmFtZSkge1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoZmlsZU5hbWUpO1xuXHRcdH0gY2F0Y2ggKGVycm9yMSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG59O1xuIl19
