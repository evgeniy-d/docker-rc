(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var visionData;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:google-vision":{"server":{"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_google-vision/server/settings.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.startup(function () {
  RocketChat.settings.add('GoogleVision_Enable', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    public: true,
    enableQuery: {
      _id: 'FileUpload_Storage_Type',
      value: 'GoogleCloudStorage'
    }
  });
  RocketChat.settings.add('GoogleVision_ServiceAccount', '', {
    type: 'string',
    group: 'FileUpload',
    section: 'Google Vision',
    multiline: true,
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Max_Monthly_Calls', 0, {
    type: 'int',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Current_Month', 0, {
    type: 'int',
    group: 'FileUpload',
    section: 'Google Vision',
    hidden: true
  });
  RocketChat.settings.add('GoogleVision_Current_Month_Calls', 0, {
    type: 'int',
    group: 'FileUpload',
    section: 'Google Vision',
    blocked: true
  });
  RocketChat.settings.add('GoogleVision_Type_Document', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Type_Faces', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Type_Landmarks', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Type_Labels', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Type_Logos', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Type_Properties', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Type_SafeSearch', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
  RocketChat.settings.add('GoogleVision_Block_Adult_Images', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: [{
      _id: 'GoogleVision_Enable',
      value: true
    }, {
      _id: 'GoogleVision_Type_SafeSearch',
      value: true
    }]
  });
  RocketChat.settings.add('GoogleVision_Type_Similar', false, {
    type: 'boolean',
    group: 'FileUpload',
    section: 'Google Vision',
    enableQuery: {
      _id: 'GoogleVision_Enable',
      value: true
    }
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"googlevision.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_google-vision/server/googlevision.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
class GoogleVision {
  constructor() {
    this.storage = require('@google-cloud/storage');
    this.vision = require('@google-cloud/vision');
    this.storageClient = {};
    this.visionClient = {};
    this.enabled = RocketChat.settings.get('GoogleVision_Enable');
    this.serviceAccount = {};
    RocketChat.settings.get('GoogleVision_Enable', (key, value) => {
      this.enabled = value;
    });
    RocketChat.settings.get('GoogleVision_ServiceAccount', (key, value) => {
      try {
        this.serviceAccount = JSON.parse(value);
        this.storageClient = this.storage({
          credentials: this.serviceAccount
        });
        this.visionClient = this.vision({
          credentials: this.serviceAccount
        });
      } catch (e) {
        this.serviceAccount = {};
      }
    });
    RocketChat.settings.get('GoogleVision_Block_Adult_Images', (key, value) => {
      if (value) {
        RocketChat.callbacks.add('beforeSaveMessage', this.blockUnsafeImages.bind(this), RocketChat.callbacks.priority.MEDIUM, 'googlevision-blockunsafe');
      } else {
        RocketChat.callbacks.remove('beforeSaveMessage', 'googlevision-blockunsafe');
      }
    });
    RocketChat.callbacks.add('afterFileUpload', this.annotate.bind(this));
  }

  incCallCount(count) {
    const currentMonth = new Date().getMonth();
    const maxMonthlyCalls = RocketChat.settings.get('GoogleVision_Max_Monthly_Calls') || 0;

    if (maxMonthlyCalls > 0) {
      if (RocketChat.settings.get('GoogleVision_Current_Month') !== currentMonth) {
        RocketChat.settings.set('GoogleVision_Current_Month', currentMonth);

        if (count > maxMonthlyCalls) {
          return false;
        }
      } else if (count + (RocketChat.settings.get('GoogleVision_Current_Month_Calls') || 0) > maxMonthlyCalls) {
        return false;
      }
    }

    RocketChat.models.Settings.update({
      _id: 'GoogleVision_Current_Month_Calls'
    }, {
      $inc: {
        value: count
      }
    });
    return true;
  }

  blockUnsafeImages(message) {
    if (this.enabled && this.serviceAccount && message && message.file && message.file._id) {
      const file = RocketChat.models.Uploads.findOne({
        _id: message.file._id
      });

      if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'GoogleCloudStorage:Uploads' && file.GoogleStorage) {
        if (this.incCallCount(1)) {
          const bucket = this.storageClient.bucket(RocketChat.settings.get('FileUpload_GoogleStorage_Bucket'));
          const bucketFile = bucket.file(file.GoogleStorage.path);
          const results = Meteor.wrapAsync(this.visionClient.detectSafeSearch, this.visionClient)(bucketFile);

          if (results && results.adult === true) {
            FileUpload.getStore('Uploads').deleteById(file._id);
            const user = RocketChat.models.Users.findOneById(message.u && message.u._id);

            if (user) {
              RocketChat.Notifications.notifyUser(user._id, 'message', {
                _id: Random.id(),
                rid: message.rid,
                ts: new Date(),
                msg: TAPi18n.__('Adult_images_are_not_allowed', {}, user.language)
              });
            }

            throw new Meteor.Error('GoogleVisionError: Image blocked');
          }
        } else {
          console.error('Google Vision: Usage limit exceeded');
        }

        return message;
      }
    }
  }

  annotate({
    message
  }) {
    const visionTypes = [];

    if (RocketChat.settings.get('GoogleVision_Type_Document')) {
      visionTypes.push('document');
    }

    if (RocketChat.settings.get('GoogleVision_Type_Faces')) {
      visionTypes.push('faces');
    }

    if (RocketChat.settings.get('GoogleVision_Type_Landmarks')) {
      visionTypes.push('landmarks');
    }

    if (RocketChat.settings.get('GoogleVision_Type_Labels')) {
      visionTypes.push('labels');
    }

    if (RocketChat.settings.get('GoogleVision_Type_Logos')) {
      visionTypes.push('logos');
    }

    if (RocketChat.settings.get('GoogleVision_Type_Properties')) {
      visionTypes.push('properties');
    }

    if (RocketChat.settings.get('GoogleVision_Type_SafeSearch')) {
      visionTypes.push('safeSearch');
    }

    if (RocketChat.settings.get('GoogleVision_Type_Similar')) {
      visionTypes.push('similar');
    }

    if (this.enabled && this.serviceAccount && visionTypes.length > 0 && message.file && message.file._id) {
      const file = RocketChat.models.Uploads.findOne({
        _id: message.file._id
      });

      if (file && file.type && file.type.indexOf('image') !== -1 && file.store === 'GoogleCloudStorage:Uploads' && file.GoogleStorage) {
        if (this.incCallCount(visionTypes.length)) {
          const bucket = this.storageClient.bucket(RocketChat.settings.get('FileUpload_GoogleStorage_Bucket'));
          const bucketFile = bucket.file(file.GoogleStorage.path);
          this.visionClient.detect(bucketFile, visionTypes, Meteor.bindEnvironment((error, results) => {
            if (!error) {
              RocketChat.models.Messages.setGoogleVisionData(message._id, this.getAnnotations(visionTypes, results));
            } else {
              console.trace('GoogleVision error: ', error.stack);
            }
          }));
        } else {
          console.error('Google Vision: Usage limit exceeded');
        }
      }
    }
  }

  getAnnotations(visionTypes, visionData) {
    if (visionTypes.length === 1) {
      const _visionData = {};
      _visionData[`${visionTypes[0]}`] = visionData;
      visionData = _visionData;
    }

    const results = {};

    for (const index in visionData) {
      if (visionData.hasOwnProperty(index)) {
        switch (index) {
          case 'faces':
          case 'landmarks':
          case 'labels':
          case 'similar':
          case 'logos':
            results[index] = (results[index] || []).concat(visionData[index] || []);
            break;

          case 'safeSearch':
            results['safeSearch'] = visionData['safeSearch'];
            break;

          case 'properties':
            results['colors'] = visionData[index]['colors'];
            break;
        }
      }
    }

    return results;
  }

}

RocketChat.GoogleVision = new GoogleVision();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"Messages.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_google-vision/server/models/Messages.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Messages.setGoogleVisionData = function (messageId, visionData) {
  const updateObj = {};

  for (const index in visionData) {
    if (visionData.hasOwnProperty(index)) {
      updateObj[`attachments.0.${index}`] = visionData[index];
    }
  }

  return this.update({
    _id: messageId
  }, {
    $set: updateObj
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:google-vision/server/settings.js");
require("/node_modules/meteor/rocketchat:google-vision/server/googlevision.js");
require("/node_modules/meteor/rocketchat:google-vision/server/models/Messages.js");

/* Exports */
Package._define("rocketchat:google-vision");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_google-vision.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpnb29nbGUtdmlzaW9uL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpnb29nbGUtdmlzaW9uL3NlcnZlci9nb29nbGV2aXNpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z29vZ2xlLXZpc2lvbi9zZXJ2ZXIvbW9kZWxzL01lc3NhZ2VzLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGQiLCJ0eXBlIiwiZ3JvdXAiLCJzZWN0aW9uIiwicHVibGljIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsIm11bHRpbGluZSIsImhpZGRlbiIsImJsb2NrZWQiLCJHb29nbGVWaXNpb24iLCJjb25zdHJ1Y3RvciIsInN0b3JhZ2UiLCJyZXF1aXJlIiwidmlzaW9uIiwic3RvcmFnZUNsaWVudCIsInZpc2lvbkNsaWVudCIsImVuYWJsZWQiLCJnZXQiLCJzZXJ2aWNlQWNjb3VudCIsImtleSIsIkpTT04iLCJwYXJzZSIsImNyZWRlbnRpYWxzIiwiZSIsImNhbGxiYWNrcyIsImJsb2NrVW5zYWZlSW1hZ2VzIiwiYmluZCIsInByaW9yaXR5IiwiTUVESVVNIiwicmVtb3ZlIiwiYW5ub3RhdGUiLCJpbmNDYWxsQ291bnQiLCJjb3VudCIsImN1cnJlbnRNb250aCIsIkRhdGUiLCJnZXRNb250aCIsIm1heE1vbnRobHlDYWxscyIsInNldCIsIm1vZGVscyIsIlNldHRpbmdzIiwidXBkYXRlIiwiJGluYyIsIm1lc3NhZ2UiLCJmaWxlIiwiVXBsb2FkcyIsImZpbmRPbmUiLCJpbmRleE9mIiwic3RvcmUiLCJHb29nbGVTdG9yYWdlIiwiYnVja2V0IiwiYnVja2V0RmlsZSIsInBhdGgiLCJyZXN1bHRzIiwid3JhcEFzeW5jIiwiZGV0ZWN0U2FmZVNlYXJjaCIsImFkdWx0IiwiRmlsZVVwbG9hZCIsImdldFN0b3JlIiwiZGVsZXRlQnlJZCIsInVzZXIiLCJVc2VycyIsImZpbmRPbmVCeUlkIiwidSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiUmFuZG9tIiwiaWQiLCJyaWQiLCJ0cyIsIm1zZyIsIlRBUGkxOG4iLCJfXyIsImxhbmd1YWdlIiwiRXJyb3IiLCJjb25zb2xlIiwiZXJyb3IiLCJ2aXNpb25UeXBlcyIsInB1c2giLCJsZW5ndGgiLCJkZXRlY3QiLCJiaW5kRW52aXJvbm1lbnQiLCJNZXNzYWdlcyIsInNldEdvb2dsZVZpc2lvbkRhdGEiLCJnZXRBbm5vdGF0aW9ucyIsInRyYWNlIiwic3RhY2siLCJ2aXNpb25EYXRhIiwiX3Zpc2lvbkRhdGEiLCJpbmRleCIsImhhc093blByb3BlcnR5IiwiY29uY2F0IiwibWVzc2FnZUlkIiwidXBkYXRlT2JqIiwiJHNldCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IscUJBQXhCLEVBQStDLEtBQS9DLEVBQXNEO0FBQ3JEQyxVQUFNLFNBRCtDO0FBRXJEQyxXQUFPLFlBRjhDO0FBR3JEQyxhQUFTLGVBSDRDO0FBSXJEQyxZQUFRLElBSjZDO0FBS3JEQyxpQkFBYTtBQUFFQyxXQUFLLHlCQUFQO0FBQWtDQyxhQUFPO0FBQXpDO0FBTHdDLEdBQXREO0FBT0FULGFBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDZCQUF4QixFQUF1RCxFQUF2RCxFQUEyRDtBQUMxREMsVUFBTSxRQURvRDtBQUUxREMsV0FBTyxZQUZtRDtBQUcxREMsYUFBUyxlQUhpRDtBQUkxREssZUFBVyxJQUorQztBQUsxREgsaUJBQWE7QUFBRUMsV0FBSyxxQkFBUDtBQUE4QkMsYUFBTztBQUFyQztBQUw2QyxHQUEzRDtBQU9BVCxhQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixnQ0FBeEIs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S0FBS2hELE1BQUwsQ0FBWTtBQUFFcEMsU0FBS3VGO0FBQVAsR0FBWixFQUFnQztBQUFFRSxVQUFNRDtBQUFSLEdBQWhDLENBQVA7QUFDQSxDQVRELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZ29vZ2xlLXZpc2lvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnR29vZ2xlVmlzaW9uX0VuYWJsZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnRmlsZVVwbG9hZCcsXG5cdFx0c2VjdGlvbjogJ0dvb2dsZSBWaXNpb24nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsIHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJyB9XG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnR29vZ2xlVmlzaW9uX1NlcnZpY2VBY2NvdW50JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRtdWx0aWxpbmU6IHRydWUsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnR29vZ2xlVmlzaW9uX0VuYWJsZScsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdHb29nbGVWaXNpb25fTWF4X01vbnRobHlfQ2FsbHMnLCAwLCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0Z3JvdXA6ICdGaWxlVXBsb2FkJyxcblx0XHRzZWN0aW9uOiAnR29vZ2xlIFZpc2lvbicsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnR29vZ2xlVmlzaW9uX0VuYWJsZScsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdHb29nbGVWaXNpb25fQ3VycmVudF9Nb250aCcsIDAsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRoaWRkZW46IHRydWVcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdHb29nbGVWaXNpb25fQ3VycmVudF9Nb250aF9DYWxscycsIDAsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRibG9ja2VkOiB0cnVlXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnR29vZ2xlVmlzaW9uX1R5cGVfRG9jdW1lbnQnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdHb29nbGVWaXNpb25fRW5hYmxlJywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0dvb2dsZVZpc2lvbl9UeXBlX0ZhY2VzJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdGaWxlVXBsb2FkJyxcblx0XHRzZWN0aW9uOiAnR29vZ2xlIFZpc2lvbicsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnR29vZ2xlVmlzaW9uX0VuYWJsZScsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdHb29nbGVWaXNpb25fVHlwZV9MYW5kbWFya3MnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdHb29nbGVWaXNpb25fRW5hYmxlJywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0dvb2dsZVZpc2lvbl9UeXBlX0xhYmVscycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnRmlsZVVwbG9hZCcsXG5cdFx0c2VjdGlvbjogJ0dvb2dsZSBWaXNpb24nLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0dvb2dsZVZpc2lvbl9FbmFibGUnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnR29vZ2xlVmlzaW9uX1R5cGVfTG9nb3MnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdHb29nbGVWaXNpb25fRW5hYmxlJywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0dvb2dsZVZpc2lvbl9UeXBlX1Byb3BlcnRpZXMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdHb29nbGVWaXNpb25fRW5hYmxlJywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0dvb2dsZVZpc2lvbl9UeXBlX1NhZmVTZWFyY2gnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdHb29nbGVWaXNpb25fRW5hYmxlJywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0dvb2dsZVZpc2lvbl9CbG9ja19BZHVsdF9JbWFnZXMnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0ZpbGVVcGxvYWQnLFxuXHRcdHNlY3Rpb246ICdHb29nbGUgVmlzaW9uJyxcblx0XHRlbmFibGVRdWVyeTogW3sgX2lkOiAnR29vZ2xlVmlzaW9uX0VuYWJsZScsIHZhbHVlOiB0cnVlIH0sIHsgX2lkOiAnR29vZ2xlVmlzaW9uX1R5cGVfU2FmZVNlYXJjaCcsIHZhbHVlOiB0cnVlIH1dXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnR29vZ2xlVmlzaW9uX1R5cGVfU2ltaWxhcicsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnRmlsZVVwbG9hZCcsXG5cdFx0c2VjdGlvbjogJ0dvb2dsZSBWaXNpb24nLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0dvb2dsZVZpc2lvbl9FbmFibGUnLCB2YWx1ZTogdHJ1ZSB9XG5cdH0pO1xufSk7XG4iLCJjbGFzcyBHb29nbGVWaXNpb24ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnN0b3JhZ2UgPSByZXF1aXJlKCdAZ29vZ2xlLWNsb3VkL3N0b3JhZ2UnKTtcblx0XHR0aGlzLnZpc2lvbiA9IHJlcXVpcmUoJ0Bnb29nbGUtY2xvdWQvdmlzaW9uJyk7XG5cdFx0dGhpcy5zdG9yYWdlQ2xpZW50ID0ge307XG5cdFx0dGhpcy52aXNpb25DbGllbnQgPSB7fTtcblx0XHR0aGlzLmVuYWJsZWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX0VuYWJsZScpO1xuXHRcdHRoaXMuc2VydmljZUFjY291bnQgPSB7fTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX0VuYWJsZScsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHR0aGlzLmVuYWJsZWQgPSB2YWx1ZTtcblx0XHR9KTtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX1NlcnZpY2VBY2NvdW50JywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuc2VydmljZUFjY291bnQgPSBKU09OLnBhcnNlKHZhbHVlKTtcblx0XHRcdFx0dGhpcy5zdG9yYWdlQ2xpZW50ID0gdGhpcy5zdG9yYWdlKHsgY3JlZGVudGlhbHM6IHRoaXMuc2VydmljZUFjY291bnQgfSk7XG5cdFx0XHRcdHRoaXMudmlzaW9uQ2xpZW50ID0gdGhpcy52aXNpb24oeyBjcmVkZW50aWFsczogdGhpcy5zZXJ2aWNlQWNjb3VudCB9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhpcy5zZXJ2aWNlQWNjb3VudCA9IHt9O1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHb29nbGVWaXNpb25fQmxvY2tfQWR1bHRfSW1hZ2VzJywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2JlZm9yZVNhdmVNZXNzYWdlJywgdGhpcy5ibG9ja1Vuc2FmZUltYWdlcy5iaW5kKHRoaXMpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdnb29nbGV2aXNpb24tYmxvY2t1bnNhZmUnKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgnYmVmb3JlU2F2ZU1lc3NhZ2UnLCAnZ29vZ2xldmlzaW9uLWJsb2NrdW5zYWZlJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckZpbGVVcGxvYWQnLCB0aGlzLmFubm90YXRlLmJpbmQodGhpcykpO1xuXHR9XG5cblx0aW5jQ2FsbENvdW50KGNvdW50KSB7XG5cdFx0Y29uc3QgY3VycmVudE1vbnRoID0gbmV3IERhdGUoKS5nZXRNb250aCgpO1xuXHRcdGNvbnN0IG1heE1vbnRobHlDYWxscyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHb29nbGVWaXNpb25fTWF4X01vbnRobHlfQ2FsbHMnKSB8fCAwO1xuXHRcdGlmIChtYXhNb250aGx5Q2FsbHMgPiAwKSB7XG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0dvb2dsZVZpc2lvbl9DdXJyZW50X01vbnRoJykgIT09IGN1cnJlbnRNb250aCkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnNldCgnR29vZ2xlVmlzaW9uX0N1cnJlbnRfTW9udGgnLCBjdXJyZW50TW9udGgpO1xuXHRcdFx0XHRpZiAoY291bnQgPiBtYXhNb250aGx5Q2FsbHMpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoY291bnQgKyAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0dvb2dsZVZpc2lvbl9DdXJyZW50X01vbnRoX0NhbGxzJykgfHwgMCkgPiBtYXhNb250aGx5Q2FsbHMpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGUoeyBfaWQ6ICdHb29nbGVWaXNpb25fQ3VycmVudF9Nb250aF9DYWxscycgfSwgeyAkaW5jOiB7IHZhbHVlOiBjb3VudCB9IH0pO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0YmxvY2tVbnNhZmVJbWFnZXMobWVzc2FnZSkge1xuXHRcdGlmICh0aGlzLmVuYWJsZWQgJiYgdGhpcy5zZXJ2aWNlQWNjb3VudCAmJiBtZXNzYWdlICYmIG1lc3NhZ2UuZmlsZSAmJiBtZXNzYWdlLmZpbGUuX2lkKSB7XG5cdFx0XHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lKHsgX2lkOiBtZXNzYWdlLmZpbGUuX2lkIH0pO1xuXHRcdFx0aWYgKGZpbGUgJiYgZmlsZS50eXBlICYmIGZpbGUudHlwZS5pbmRleE9mKCdpbWFnZScpICE9PSAtMSAmJiBmaWxlLnN0b3JlID09PSAnR29vZ2xlQ2xvdWRTdG9yYWdlOlVwbG9hZHMnICYmIGZpbGUuR29vZ2xlU3RvcmFnZSkge1xuXHRcdFx0XHRpZiAodGhpcy5pbmNDYWxsQ291bnQoMSkpIHtcblx0XHRcdFx0XHRjb25zdCBidWNrZXQgPSB0aGlzLnN0b3JhZ2VDbGllbnQuYnVja2V0KFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0JykpO1xuXHRcdFx0XHRcdGNvbnN0IGJ1Y2tldEZpbGUgPSBidWNrZXQuZmlsZShmaWxlLkdvb2dsZVN0b3JhZ2UucGF0aCk7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IE1ldGVvci53cmFwQXN5bmModGhpcy52aXNpb25DbGllbnQuZGV0ZWN0U2FmZVNlYXJjaCwgdGhpcy52aXNpb25DbGllbnQpKGJ1Y2tldEZpbGUpO1xuXHRcdFx0XHRcdGlmIChyZXN1bHRzICYmIHJlc3VsdHMuYWR1bHQgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdEZpbGVVcGxvYWQuZ2V0U3RvcmUoJ1VwbG9hZHMnKS5kZWxldGVCeUlkKGZpbGUuX2lkKTtcblx0XHRcdFx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChtZXNzYWdlLnUgJiYgbWVzc2FnZS51Ll9pZCk7XG5cdFx0XHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcih1c2VyLl9pZCwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdFx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0XHRcdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0XHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdFx0XHRcdFx0XHRtc2c6IFRBUGkxOG4uX18oJ0FkdWx0X2ltYWdlc19hcmVfbm90X2FsbG93ZWQnLCB7fSwgdXNlci5sYW5ndWFnZSlcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdHb29nbGVWaXNpb25FcnJvcjogSW1hZ2UgYmxvY2tlZCcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdHb29nbGUgVmlzaW9uOiBVc2FnZSBsaW1pdCBleGNlZWRlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtZXNzYWdlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFubm90YXRlKHsgbWVzc2FnZSB9KSB7XG5cdFx0Y29uc3QgdmlzaW9uVHlwZXMgPSBbXTtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0dvb2dsZVZpc2lvbl9UeXBlX0RvY3VtZW50JykpIHtcblx0XHRcdHZpc2lvblR5cGVzLnB1c2goJ2RvY3VtZW50Jyk7XG5cdFx0fVxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX1R5cGVfRmFjZXMnKSkge1xuXHRcdFx0dmlzaW9uVHlwZXMucHVzaCgnZmFjZXMnKTtcblx0XHR9XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHb29nbGVWaXNpb25fVHlwZV9MYW5kbWFya3MnKSkge1xuXHRcdFx0dmlzaW9uVHlwZXMucHVzaCgnbGFuZG1hcmtzJyk7XG5cdFx0fVxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX1R5cGVfTGFiZWxzJykpIHtcblx0XHRcdHZpc2lvblR5cGVzLnB1c2goJ2xhYmVscycpO1xuXHRcdH1cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0dvb2dsZVZpc2lvbl9UeXBlX0xvZ29zJykpIHtcblx0XHRcdHZpc2lvblR5cGVzLnB1c2goJ2xvZ29zJyk7XG5cdFx0fVxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX1R5cGVfUHJvcGVydGllcycpKSB7XG5cdFx0XHR2aXNpb25UeXBlcy5wdXNoKCdwcm9wZXJ0aWVzJyk7XG5cdFx0fVxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX1R5cGVfU2FmZVNlYXJjaCcpKSB7XG5cdFx0XHR2aXNpb25UeXBlcy5wdXNoKCdzYWZlU2VhcmNoJyk7XG5cdFx0fVxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR29vZ2xlVmlzaW9uX1R5cGVfU2ltaWxhcicpKSB7XG5cdFx0XHR2aXNpb25UeXBlcy5wdXNoKCdzaW1pbGFyJyk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmVuYWJsZWQgJiYgdGhpcy5zZXJ2aWNlQWNjb3VudCAmJiB2aXNpb25UeXBlcy5sZW5ndGggPiAwICYmIG1lc3NhZ2UuZmlsZSAmJiBtZXNzYWdlLmZpbGUuX2lkKSB7XG5cdFx0XHRjb25zdCBmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lKHsgX2lkOiBtZXNzYWdlLmZpbGUuX2lkIH0pO1xuXHRcdFx0aWYgKGZpbGUgJiYgZmlsZS50eXBlICYmIGZpbGUudHlwZS5pbmRleE9mKCdpbWFnZScpICE9PSAtMSAmJiBmaWxlLnN0b3JlID09PSAnR29vZ2xlQ2xvdWRTdG9yYWdlOlVwbG9hZHMnICYmIGZpbGUuR29vZ2xlU3RvcmFnZSkge1xuXHRcdFx0XHRpZiAodGhpcy5pbmNDYWxsQ291bnQodmlzaW9uVHlwZXMubGVuZ3RoKSkge1xuXHRcdFx0XHRcdGNvbnN0IGJ1Y2tldCA9IHRoaXMuc3RvcmFnZUNsaWVudC5idWNrZXQoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9CdWNrZXQnKSk7XG5cdFx0XHRcdFx0Y29uc3QgYnVja2V0RmlsZSA9IGJ1Y2tldC5maWxlKGZpbGUuR29vZ2xlU3RvcmFnZS5wYXRoKTtcblx0XHRcdFx0XHR0aGlzLnZpc2lvbkNsaWVudC5kZXRlY3QoYnVja2V0RmlsZSwgdmlzaW9uVHlwZXMsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVycm9yLCByZXN1bHRzKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoIWVycm9yKSB7XG5cdFx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldEdvb2dsZVZpc2lvbkRhdGEobWVzc2FnZS5faWQsIHRoaXMuZ2V0QW5ub3RhdGlvbnModmlzaW9uVHlwZXMsIHJlc3VsdHMpKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUudHJhY2UoJ0dvb2dsZVZpc2lvbiBlcnJvcjogJywgZXJyb3Iuc3RhY2spO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdHb29nbGUgVmlzaW9uOiBVc2FnZSBsaW1pdCBleGNlZWRlZCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Z2V0QW5ub3RhdGlvbnModmlzaW9uVHlwZXMsIHZpc2lvbkRhdGEpIHtcblx0XHRpZiAodmlzaW9uVHlwZXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRjb25zdCBfdmlzaW9uRGF0YSA9IHt9O1xuXHRcdFx0X3Zpc2lvbkRhdGFbYCR7IHZpc2lvblR5cGVzWzBdIH1gXSA9IHZpc2lvbkRhdGE7XG5cdFx0XHR2aXNpb25EYXRhID0gX3Zpc2lvbkRhdGE7XG5cdFx0fVxuXHRcdGNvbnN0IHJlc3VsdHMgPSB7fTtcblx0XHRmb3IgKGNvbnN0IGluZGV4IGluIHZpc2lvbkRhdGEpIHtcblx0XHRcdGlmICh2aXNpb25EYXRhLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuXHRcdFx0XHRzd2l0Y2ggKGluZGV4KSB7XG5cdFx0XHRcdFx0Y2FzZSAnZmFjZXMnOlxuXHRcdFx0XHRcdGNhc2UgJ2xhbmRtYXJrcyc6XG5cdFx0XHRcdFx0Y2FzZSAnbGFiZWxzJzpcblx0XHRcdFx0XHRjYXNlICdzaW1pbGFyJzpcblx0XHRcdFx0XHRjYXNlICdsb2dvcyc6XG5cdFx0XHRcdFx0XHRyZXN1bHRzW2luZGV4XSA9IChyZXN1bHRzW2luZGV4XSB8fCBbXSkuY29uY2F0KHZpc2lvbkRhdGFbaW5kZXhdIHx8IFtdKTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ3NhZmVTZWFyY2gnOlxuXHRcdFx0XHRcdFx0cmVzdWx0c1snc2FmZVNlYXJjaCddID0gdmlzaW9uRGF0YVsnc2FmZVNlYXJjaCddO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAncHJvcGVydGllcyc6XG5cdFx0XHRcdFx0XHRyZXN1bHRzWydjb2xvcnMnXSA9IHZpc2lvbkRhdGFbaW5kZXhdWydjb2xvcnMnXTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHRzO1xuXHR9XG59XG5cblJvY2tldENoYXQuR29vZ2xlVmlzaW9uID0gbmV3IEdvb2dsZVZpc2lvbjtcbiIsIlJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldEdvb2dsZVZpc2lvbkRhdGEgPSBmdW5jdGlvbihtZXNzYWdlSWQsIHZpc2lvbkRhdGEpIHtcblx0Y29uc3QgdXBkYXRlT2JqID0ge307XG5cdGZvciAoY29uc3QgaW5kZXggaW4gdmlzaW9uRGF0YSkge1xuXHRcdGlmICh2aXNpb25EYXRhLmhhc093blByb3BlcnR5KGluZGV4KSkge1xuXHRcdFx0dXBkYXRlT2JqW2BhdHRhY2htZW50cy4wLiR7IGluZGV4IH1gXSA9IHZpc2lvbkRhdGFbaW5kZXhdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZDogbWVzc2FnZUlkIH0sIHsgJHNldDogdXBkYXRlT2JqIH0pO1xufTtcbiJdfQ==
