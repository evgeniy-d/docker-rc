(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EventState = Package['raix:eventstate'].EventState;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var Random = Package.random.Random;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Push, checkClientSecurity, _matchToken, _replaceToken, _removeToken, initPushUpdates;

var require = meteorInstall({"node_modules":{"meteor":{"raix:push":{"lib":{"common":{"main.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/raix_push/lib/common/main.js                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// The push object is an event emitter
Push = new EventState(); // Client-side security warnings, used to check options

checkClientSecurity = function (options) {
  // Warn if certificates or keys are added here on client. We dont allow the
  // user to do this for security reasons.
  if (options.apn && options.apn.certData) {
    throw new Error('Push.init: Dont add your APN certificate in client code!');
  }

  if (options.apn && options.apn.keyData) {
    throw new Error('Push.init: Dont add your APN key in client code!');
  }

  if (options.apn && options.apn.passphrase) {
    throw new Error('Push.init: Dont add your APN passphrase in client code!');
  }

  if (options.gcm && options.gcm.apiKey) {
    throw new Error('Push.init: Dont add your GCM api key in client code!');
  }
}; // DEPRECATED


Push.init = function () {
  console.warn('Push.init have been deprecated in favor of "config.push.json" please migrate');
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"notifications.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/raix_push/lib/common/notifications.js                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// This is the match pattern for tokens
_matchToken = Match.OneOf({
  apn: String
}, {
  gcm: String
}); // Notifications collection

Push.notifications = new Mongo.Collection('_raix_push_notifications'); // This is a general function to validate that the data added to notifications
// is in the correct format. If not this function will throw errors

var _validateDocument = function (notification) {
  // Check the general notification
  check(notification, {
    from: String,
    title: String,
    text: String,
    sent: Match.Optional(Boolean),
    sending: Match.Optional(Match.Integer),
    badge: Match.Optional(Match.Integer),
    sound: Match.Optional(String),
    notId: Match.Optional(Match.Integer),
    contentAvailable: Match.Optional(Match.Integer),
    apn: Match.Optional({
      from: Match.Optional(String),
      title: Match.Optional(String),
      text: Match.Optional(String),
      badge: Match.Optional(Match.Integer),
      sound: Match.Optional(String),
      notId: Match.Optional(Match.Integer),
      category: Match.Optional(String)
    }),
    gcm: Match.Optional({
      from: Match.Optional(String),
      title: Match.Optional(String),
      text: Match.Optional(String),
      image: Match.Optional(String),
      style: Match.Optional(String),
      summaryText: Match.Optional(String),
      picture: Match.Optional(String),
      badge: Match.Optional(Match.Integer),
      sound: Match.Optional(String),
      notId: Match.Optional(Match.Integer)
    }),
    query: Match.Optional(String),
    token: Match.Optional(_matchToken),
    tokens: Match.Optional([_matchToken]),
    payload: Match.Optional(Object),
    delayUntil: Match.Optional(Date),
    createdAt: Date,
    createdBy: Match.OneOf(String, null)
  }); // Make sure a token selector or query have been set

  if (!notification.token && !notification.tokens && !notification.query) {
    throw new Error('No token selector or query found');
  } // If tokens array is set it should not be empty


  if (notification.tokens && !notification.tokens.length) {
    throw new Error('No tokens in array');
  }
};

Push.send = function (options) {
  // If on the client we set the user id - on the server we need an option
  // set or we default to "<SERVER>" as the creator of the notification
  // If current user not set see if we can set it to the logged in user
  // this will only run on the client if Meteor.userId is available
  var currentUser = Meteor.isClient && Meteor.userId && Meteor.userId() || Meteor.isServer && (options.createdBy || '<SERVER>') || null; // Rig the notification object

  var notification = _.extend({
    createdAt: new Date(),
    createdBy: currentUser
  }, _.pick(options, 'from', 'title', 'text')); // Add extra


  _.extend(notification, _.pick(options, 'payload', 'badge', 'sound', 'notId', 'delayUntil'));

  if (Match.test(options.apn, Object)) {
    notification.apn = _.pick(options.apn, 'from', 'title', 'text', 'badge', 'sound', 'notId', 'category');
  }

  if (Match.test(options.gcm, Object)) {
    notification.gcm = _.pick(options.gcm, 'image', 'style', 'summaryText', 'picture', 'from', 'title', 'text', 'badge', 'sound', 'notId');
  } // Set one token selector, this can be token, array of tokens or query


  if (options.query) {
    // Set query to the json string version fixing #43 and #39
    notification.query = JSON.stringify(options.query);
  } else if (options.token) {
    // Set token
    notification.token = options.token;
  } else if (options.tokens) {
    // Set tokens
    notification.tokens = options.tokens;
  } //console.log(options);


  if (typeof options.contentAvailable !== 'undefined') {
    notification.contentAvailable = options.contentAvailable;
  }

  notification.sent = false;
  notification.sending = 0; // Validate the notification

  _validateDocument(notification); // Try to add the notification to send, we return an id to keep track


  return Push.notifications.insert(notification);
};

Push.allow = function (rules) {
  if (rules.send) {
    Push.notifications.allow({
      'insert': function (userId, notification) {
        // Validate the notification
        _validateDocument(notification); // Set the user defined "send" rules


        return rules.send.apply(this, [userId, notification]);
      }
    });
  }
};

Push.deny = function (rules) {
  if (rules.send) {
    Push.notifications.deny({
      'insert': function (userId, notification) {
        // Validate the notification
        _validateDocument(notification); // Set the user defined "send" rules


        return rules.send.apply(this, [userId, notification]);
      }
    });
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"push.api.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/raix_push/lib/server/push.api.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/*
  A general purpose user CordovaPush
  ios, android, mail, twitter?, facebook?, sms?, snailMail? :)

  Phonegap generic :
  https://github.com/phonegap-build/PushPlugin
 */
// getText / getBinary
Push.setBadge = function ()
/* id, count */
{// throw new Error('Push.setBadge not implemented on the server');
};

var isConfigured = false;

var sendWorker = function (task, interval) {
  if (typeof Push.Log === 'function') {
    Push.Log('Push: Send worker started, using interval:', interval);
  }

  if (Push.debug) {
    console.log('Push: Send worker started, using interval: ' + interval);
  }

  return Meteor.setInterval(function () {
    // xxx: add exponential backoff on error
    try {
      task();
    } catch (error) {
      if (typeof Push.Log === 'function') {
        Push.Log('Push: Error while sending:', error.message);
      }

      if (Push.debug) {
        console.log('Push: Error while sending: ' + error.message);
      }
    }
  }, interval);
};

Push.Configure = function (options) {
  var self = this;
  options = _.extend({
    sendTimeout: 60000 // Timeout period for notification send

  }, options); // https://npmjs.org/package/apn
  // After requesting the certificate from Apple, export your private key as
  // a .p12 file anddownload the .cer file from the iOS Provisioning Portal.
  // gateway.push.apple.com, port 2195
  // gateway.sandbox.push.apple.com, port 2195
  // Now, in the directory containing cert.cer and key.p12 execute the
  // following commands to generate your .pem files:
  // $ openssl x509 -in cert.cer -inform DER -outform PEM -out cert.pem
  // $ openssl pkcs12 -in key.p12 -out key.pem -nodes
  // Block multiple calls

  if (isConfigured) {
    throw new Error('Push.Configure should not be called more than once!');
  }

  isConfigured = true; // Add debug info

  if (Push.debug) {
    console.log('Push.Configure', options);
  } // This function is called when a token is replaced on a device - normally
  // this should not happen, but if it does we should take action on it


  _replaceToken = function (currentToken, newToken) {
    // console.log('Replace token: ' + currentToken + ' -- ' + newToken);
    // If the server gets a token event its passing in the current token and
    // the new value - if new value is undefined this empty the token
    self.emitState('token', currentToken, newToken);
  }; // Rig the removeToken callback


  _removeToken = function (token) {
    // console.log('Remove token: ' + token);
    // Invalidate the token
    self.emitState('token', token, null);
  };

  if (options.apn) {
    if (Push.debug) {
      console.log('Push: APN configured');
    } // Allow production to be a general option for push notifications


    if (options.production === Boolean(options.production)) {
      options.apn.production = options.production;
    } // Give the user warnings about development settings


    if (options.apn.development) {
      // This flag is normally set by the configuration file
      console.warn('WARNING: Push APN is using development key and certificate');
    } else {
      // We check the apn gateway i the options, we could risk shipping
      // server into production while using the production configuration.
      // On the other hand we could be in development but using the production
      // configuration. And finally we could have configured an unknown apn
      // gateway (this could change in the future - but a warning about typos
      // can save hours of debugging)
      //
      // Warn about gateway configurations - it's more a guide
      if (options.apn.gateway) {
        if (options.apn.gateway === 'gateway.sandbox.push.apple.com') {
          // Using the development sandbox
          console.warn('WARNING: Push APN is in development mode');
        } else if (options.apn.gateway === 'gateway.push.apple.com') {
          // In production - but warn if we are running on localhost
          if (/http:\/\/localhost/.test(Meteor.absoluteUrl())) {
            console.warn('WARNING: Push APN is configured to production mode - but server is running' + ' from localhost');
          }
        } else {
          // Warn about gateways we dont know about
          console.warn('WARNING: Push APN unkown gateway "' + options.apn.gateway + '"');
        }
      } else {
        if (options.apn.production) {
          if (/http:\/\/localhost/.test(Meteor.absoluteUrl())) {
            console.warn('WARNING: Push APN is configured to production mode - but server is running' + ' from localhost');
          }
        } else {
          console.warn('WARNING: Push APN is in development mode');
        }
      }
    } // Check certificate data


    if (!options.apn.certData || !options.apn.certData.length) {
      console.error('ERROR: Push server could not find certData');
    } // Check key data


    if (!options.apn.keyData || !options.apn.keyData.length) {
      console.error('ERROR: Push server could not find keyData');
    } // Rig apn connection


    var apn = Npm.require('apn');

    var apnConnection = new apn.Connection(options.apn); // Listen to transmission errors - should handle the same way as feedback.

    apnConnection.on('transmissionError', Meteor.bindEnvironment(function (errCode, notification, recipient) {
      if (Push.debug) {
        console.log('Got error code %d for token %s', errCode, notification.token);
      }

      if ([2, 5, 8].indexOf(errCode) >= 0) {
        // Invalid token errors...
        _removeToken({
          apn: notification.token
        });
      }
    })); // XXX: should we do a test of the connection? It would be nice to know
    // That the server/certificates/network are correct configured
    // apnConnection.connect().then(function() {
    //     console.info('CHECK: Push APN connection OK');
    // }, function(err) {
    //     console.warn('CHECK: Push APN connection FAILURE');
    // });
    // Note: the above code spoils the connection - investigate how to
    // shutdown/close it.

    self.sendAPN = function (userToken, notification) {
      if (Match.test(notification.apn, Object)) {
        notification = _.extend({}, notification, notification.apn);
      } // console.log('sendAPN', notification.from, userToken, notification.title, notification.text,
      // notification.badge, notification.priority);


      var priority = notification.priority || notification.priority === 0 ? notification.priority : 10;
      var myDevice = new apn.Device(userToken);
      var note = new apn.Notification();
      note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.

      if (typeof notification.badge !== 'undefined') {
        note.badge = notification.badge;
      }

      if (typeof notification.sound !== 'undefined') {
        note.sound = notification.sound;
      } //console.log(notification.contentAvailable);
      //console.log("lala2");
      //console.log(notification);


      if (typeof notification.contentAvailable !== 'undefined') {
        //console.log("lala");
        note.setContentAvailable(notification.contentAvailable); //console.log(note);
      } // adds category support for iOS8 custom actions as described here:
      // https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/
      // RemoteNotificationsPG/Chapters/IPhoneOSClientImp.html#//apple_ref/doc/uid/TP40008194-CH103-SW36


      if (typeof notification.category !== 'undefined') {
        note.category = notification.category;
      }

      note.alert = {
        body: notification.text
      };

      if (typeof notification.title !== 'undefined') {
        note.alert.title = notification.title;
      } // Allow the user to set payload data


      note.payload = notification.payload ? {
        ejson: EJSON.stringify(notification.payload)
      } : {};
      note.payload.messageFrom = notification.from;
      note.priority = priority; // Store the token on the note so we can reference it if there was an error

      note.token = userToken; // console.log('I:Send message to: ' + userToken + ' count=' + count);

      apnConnection.pushNotification(note, myDevice);
    };

    var initFeedback = function () {
      var apn = Npm.require('apn'); // console.log('Init feedback');


      var feedbackOptions = {
        'batchFeedback': true,
        // Time in SECONDS
        'interval': 5,
        production: !options.apn.development,
        cert: options.certData,
        key: options.keyData,
        passphrase: options.passphrase
      };
      var feedback = new apn.Feedback(feedbackOptions);
      feedback.on('feedback', function (devices) {
        devices.forEach(function (item) {
          // Do something with item.device and item.time;
          // console.log('A:PUSH FEEDBACK ' + item.device + ' - ' + item.time);
          // The app is most likely removed from the device, we should
          // remove the token
          _removeToken({
            apn: item.device
          });
        });
      });
      feedback.start();
    }; // Init feedback from apn server
    // This will help keep the appCollection up-to-date, it will help update
    // and remove token from appCollection.


    initFeedback();
  } // EO ios notification


  if (options.gcm && options.gcm.apiKey) {
    if (Push.debug) {
      console.log('GCM configured');
    } //self.sendGCM = function(options.from, userTokens, options.title, options.text, options.badge, options.priority) {


    self.sendGCM = function (userTokens, notification) {
      if (Match.test(notification.gcm, Object)) {
        notification = _.extend({}, notification, notification.gcm);
      } // Make sure userTokens are an array of strings


      if (userTokens === '' + userTokens) {
        userTokens = [userTokens];
      } // Check if any tokens in there to send


      if (!userTokens.length) {
        if (Push.debug) {
          console.log('sendGCM no push tokens found');
        }

        return;
      }

      if (Push.debug) {
        console.log('sendGCM', userTokens, notification);
      }

      var gcm = Npm.require('node-gcm');

      var Fiber = Npm.require('fibers'); // Allow user to set payload


      var data = notification.payload ? {
        ejson: EJSON.stringify(notification.payload)
      } : {};
      data.title = notification.title;
      data.message = notification.text; // Set image

      if (typeof notification.image !== 'undefined') {
        data.image = notification.image;
      } // Set extra details


      if (typeof notification.badge !== 'undefined') {
        data.msgcnt = notification.badge;
      }

      if (typeof notification.sound !== 'undefined') {
        data.soundname = notification.sound;
      }

      if (typeof notification.notId !== 'undefined') {
        data.notId = notification.notId;
      }

      if (typeof notification.style !== 'undefined') {
        data.style = notification.style;
      }

      if (typeof notification.summaryText !== 'undefined') {
        data.summaryText = notification.summaryText;
      }

      if (typeof notification.picture !== 'undefined') {
        data.picture = notification.picture;
      } //var message = new gcm.Message();


      var message = new gcm.Message({
        collapseKey: notification.from,
        //    delayWhileIdle: true,
        //    timeToLive: 4,
        //    restricted_package_name: 'dk.gi2.app'
        data: data
      });

      if (Push.debug) {
        console.log('Create GCM Sender using "' + options.gcm.apiKey + '"');
      }

      var sender = new gcm.Sender(options.gcm.apiKey);

      _.each(userTokens, function (value
      /*, key */
      ) {
        if (Push.debug) {
          console.log('A:Send message to: ' + value);
        }
      });
      /*message.addData('title', title);
      message.addData('message', text);
      message.addData('msgcnt', '1');
      message.collapseKey = 'sitDrift';
      message.delayWhileIdle = true;
      message.timeToLive = 3;*/
      // /**
      //  * Parameters: message-literal, userTokens-array, No. of retries, callback-function
      //  */


      var userToken = userTokens.length === 1 ? userTokens[0] : null;
      sender.send(message, userTokens, 5, function (err, result) {
        if (err) {
          if (Push.debug) {
            console.log('ANDROID ERROR: result of sender: ' + result);
          }
        } else {
          if (result === null) {
            if (Push.debug) {
              console.log('ANDROID: Result of sender is null');
            }

            return;
          }

          if (Push.debug) {
            console.log('ANDROID: Result of sender: ' + JSON.stringify(result));
          }

          if (result.canonical_ids === 1 && userToken) {
            // jshint ignore:line
            // This is an old device, token is replaced
            Fiber(function (self) {
              // Run in fiber
              try {
                self.callback(self.oldToken, self.newToken);
              } catch (err) {}
            }).run({
              oldToken: {
                gcm: userToken
              },
              newToken: {
                gcm: result.results[0].registration_id
              },
              // jshint ignore:line
              callback: _replaceToken
            }); //_replaceToken({ gcm: userToken }, { gcm: result.results[0].registration_id });
          } // We cant send to that token - might not be registred
          // ask the user to remove the token from the list


          if (result.failure !== 0 && userToken) {
            // This is an old device, token is replaced
            Fiber(function (self) {
              // Run in fiber
              try {
                self.callback(self.token);
              } catch (err) {}
            }).run({
              token: {
                gcm: userToken
              },
              callback: _removeToken
            }); //_replaceToken({ gcm: userToken }, { gcm: result.results[0].registration_id });
          }
        }
      }); // /** Use the following line if you want to send the message without retries
      // sender.sendNoRetry(message, userTokens, function (result) {
      //     console.log('ANDROID: ' + JSON.stringify(result));
      // });
      // **/
    }; // EO sendAndroid

  } // EO Android
  // Universal send function


  var _querySend = function (query, options) {
    var countApn = [];
    var countGcm = [];
    Push.appCollection.find(query).forEach(function (app) {
      if (Push.debug) {
        console.log('send to token', app.token);
      }

      if (app.token.apn) {
        countApn.push(app._id); // Send to APN

        if (self.sendAPN) {
          self.sendAPN(app.token.apn, options);
        }
      } else if (app.token.gcm) {
        countGcm.push(app._id); // Send to GCM
        // We do support multiple here - so we should construct an array
        // and send it bulk - Investigate limit count of id's

        if (self.sendGCM) {
          self.sendGCM(app.token.gcm, options);
        }
      } else {
        throw new Error('Push.send got a faulty query');
      }
    });

    if (Push.debug) {
      console.log('Push: Sent message "' + options.title + '" to ' + countApn.length + ' ios apps ' + countGcm.length + ' android apps'); // Add some verbosity about the send result, making sure the developer
      // understands what just happened.

      if (!countApn.length && !countGcm.length) {
        if (Push.appCollection.find().count() === 0) {
          console.log('Push, GUIDE: The "Push.appCollection" is empty -' + ' No clients have registred on the server yet...');
        }
      } else if (!countApn.length) {
        if (Push.appCollection.find({
          'token.apn': {
            $exists: true
          }
        }).count() === 0) {
          console.log('Push, GUIDE: The "Push.appCollection" - No APN clients have registred on the server yet...');
        }
      } else if (!countGcm.length) {
        if (Push.appCollection.find({
          'token.gcm': {
            $exists: true
          }
        }).count() === 0) {
          console.log('Push, GUIDE: The "Push.appCollection" - No GCM clients have registred on the server yet...');
        }
      }
    }

    return {
      apn: countApn,
      gcm: countGcm
    };
  };

  self.serverSend = function (options) {
    options = options || {
      badge: 0
    };
    var query; // Check basic options

    if (options.from !== '' + options.from) {
      throw new Error('Push.send: option "from" not a string');
    }

    if (options.title !== '' + options.title) {
      throw new Error('Push.send: option "title" not a string');
    }

    if (options.text !== '' + options.text) {
      throw new Error('Push.send: option "text" not a string');
    }

    if (options.token || options.tokens) {
      // The user set one token or array of tokens
      var tokenList = options.token ? [options.token] : options.tokens;

      if (Push.debug) {
        console.log('Push: Send message "' + options.title + '" via token(s)', tokenList);
      }

      query = {
        $or: [// XXX: Test this query: can we hand in a list of push tokens?
        {
          $and: [{
            token: {
              $in: tokenList
            }
          }, // And is not disabled
          {
            enabled: {
              $ne: false
            }
          }]
        }, // XXX: Test this query: does this work on app id?
        {
          $and: [{
            _id: {
              $in: tokenList
            }
          }, // one of the app ids
          {
            $or: [{
              'token.apn': {
                $exists: true
              }
            }, // got apn token
            {
              'token.gcm': {
                $exists: true
              } // got gcm token

            }]
          }, // And is not disabled
          {
            enabled: {
              $ne: false
            }
          }]
        }]
      };
    } else if (options.query) {
      if (Push.debug) {
        console.log('Push: Send message "' + options.title + '" via query', options.query);
      }

      query = {
        $and: [options.query, // query object
        {
          $or: [{
            'token.apn': {
              $exists: true
            }
          }, // got apn token
          {
            'token.gcm': {
              $exists: true
            } // got gcm token

          }]
        }, // And is not disabled
        {
          enabled: {
            $ne: false
          }
        }]
      };
    }

    if (query) {
      // Convert to querySend and return status
      return _querySend(query, options);
    } else {
      throw new Error('Push.send: please set option "token"/"tokens" or "query"');
    }
  }; // This interval will allow only one notification to be sent at a time, it
  // will check for new notifications at every `options.sendInterval`
  // (default interval is 15000 ms)
  //
  // It looks in notifications collection to see if theres any pending
  // notifications, if so it will try to reserve the pending notification.
  // If successfully reserved the send is started.
  //
  // If notification.query is type string, it's assumed to be a json string
  // version of the query selector. Making it able to carry `$` properties in
  // the mongo collection.
  //
  // Pr. default notifications are removed from the collection after send have
  // completed. Setting `options.keepNotifications` will update and keep the
  // notification eg. if needed for historical reasons.
  //
  // After the send have completed a "send" event will be emitted with a
  // status object containing notification id and the send result object.
  //


  var isSendingNotification = false;

  if (options.sendInterval !== null) {
    // This will require index since we sort notifications by createdAt
    Push.notifications._ensureIndex({
      createdAt: 1
    });

    Push.notifications._ensureIndex({
      sent: 1
    });

    Push.notifications._ensureIndex({
      sending: 1
    });

    Push.notifications._ensureIndex({
      delayUntil: 1
    });

    var sendNotification = function (notification) {
      // Reserve notification
      var now = +new Date();
      var timeoutAt = now + options.sendTimeout;
      var reserved = Push.notifications.update({
        _id: notification._id,
        sent: false,
        // xxx: need to make sure this is set on create
        sending: {
          $lt: now
        }
      }, {
        $set: {
          sending: timeoutAt
        }
      }); // Make sure we only handle notifications reserved by this
      // instance

      if (reserved) {
        // Check if query is set and is type String
        if (notification.query && notification.query === '' + notification.query) {
          try {
            // The query is in string json format - we need to parse it
            notification.query = JSON.parse(notification.query);
          } catch (err) {
            // Did the user tamper with this??
            throw new Error('Push: Error while parsing query string, Error: ' + err.message);
          }
        } // Send the notification


        var result = Push.serverSend(notification);

        if (!options.keepNotifications) {
          // Pr. Default we will remove notifications
          Push.notifications.remove({
            _id: notification._id
          });
        } else {
          // Update the notification
          Push.notifications.update({
            _id: notification._id
          }, {
            $set: {
              // Mark as sent
              sent: true,
              // Set the sent date
              sentAt: new Date(),
              // Count
              count: result,
              // Not being sent anymore
              sending: 0
            }
          });
        } // Emit the send


        self.emit('send', {
          notification: notification._id,
          result: result
        });
      } // Else could not reserve

    }; // EO sendNotification


    sendWorker(function () {
      if (isSendingNotification) {
        return;
      } // Set send fence


      isSendingNotification = true; // var countSent = 0;

      var batchSize = options.sendBatchSize || 1;
      var now = +new Date(); // Find notifications that are not being or already sent

      var pendingNotifications = Push.notifications.find({
        $and: [// Message is not sent
        {
          sent: false
        }, // And not being sent by other instances
        {
          sending: {
            $lt: now
          }
        }, // And not queued for future
        {
          $or: [{
            delayUntil: {
              $exists: false
            }
          }, {
            delayUntil: {
              $lte: new Date()
            }
          }]
        }]
      }, {
        // Sort by created date
        sort: {
          createdAt: 1
        },
        limit: batchSize
      });
      pendingNotifications.forEach(function (notification) {
        try {
          sendNotification(notification);
        } catch (error) {
          if (typeof Push.Log === 'function') {
            Push.Log('Push: Could not send notification id: "' + notification._id + '", Error:', error.message);
          }

          if (Push.debug) {
            console.log('Push: Could not send notification id: "' + notification._id + '", Error: ' + error.message);
          }
        }
      }); // EO forEach
      // Remove the send fence

      isSendingNotification = false;
    }, options.sendInterval || 15000); // Default every 15th sec
  } else {
    if (Push.debug) {
      console.log('Push: Send server is disabled');
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/raix_push/lib/server/server.js                                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Push.appCollection = new Mongo.Collection('_raix_push_app_tokens');

Push.appCollection._ensureIndex({
  userId: 1
});

Push.addListener('token', function (currentToken, value) {
  if (value) {
    // Update the token for app
    Push.appCollection.update({
      token: currentToken
    }, {
      $set: {
        token: value
      }
    }, {
      multi: true
    });
  } else if (value === null) {
    // Remove the token for app
    Push.appCollection.update({
      token: currentToken
    }, {
      $unset: {
        token: true
      }
    }, {
      multi: true
    });
  }
});
Meteor.methods({
  'raix:push-update': function (options) {
    if (Push.debug) {
      console.log('Push: Got push token from app:', options);
    }

    check(options, {
      id: Match.Optional(String),
      token: _matchToken,
      appName: String,
      userId: Match.OneOf(String, null),
      metadata: Match.Optional(Object)
    }); // The if user id is set then user id should match on client and connection

    if (options.userId && options.userId !== this.userId) {
      throw new Meteor.Error(403, 'Forbidden access');
    }

    var doc; // lookup app by id if one was included

    if (options.id) {
      doc = Push.appCollection.findOne({
        _id: options.id
      });
    } else if (options.userId) {
      doc = Push.appCollection.findOne({
        userId: options.userId
      });
    } // No doc was found - we check the database to see if
    // we can find a match for the app via token and appName


    if (!doc) {
      doc = Push.appCollection.findOne({
        $and: [{
          token: options.token
        }, // Match token
        {
          appName: options.appName
        }, // Match appName
        {
          token: {
            $exists: true
          } // Make sure token exists

        }]
      });
    } // if we could not find the id or token then create it


    if (!doc) {
      // Rig default doc
      doc = {
        token: options.token,
        appName: options.appName,
        userId: options.userId,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }; // XXX: We might want to check the id - Why isnt there a match for id
      // in the Meteor check... Normal length 17 (could be larger), and
      // numbers+letters are used in Random.id() with exception of 0 and 1

      doc._id = options.id || Random.id(); // The user wanted us to use a specific id, we didn't find this while
      // searching. The client could depend on the id eg. as reference so
      // we respect this and try to create a document with the selected id;

      Push.appCollection._collection.insert(doc);
    } else {
      // We found the app so update the updatedAt and set the token
      Push.appCollection.update({
        _id: doc._id
      }, {
        $set: {
          updatedAt: new Date(),
          token: options.token
        }
      });
    }

    if (doc) {
      // xxx: Hack
      // Clean up mech making sure tokens are uniq - android sometimes generate
      // new tokens resulting in duplicates
      var removed = Push.appCollection.remove({
        $and: [{
          _id: {
            $ne: doc._id
          }
        }, {
          token: doc.token
        }, // Match token
        {
          appName: doc.appName
        }, // Match appName
        {
          token: {
            $exists: true
          } // Make sure token exists

        }]
      });

      if (removed && Push.debug) {
        console.log('Push: Removed ' + removed + ' existing app items');
      }
    }

    if (doc && Push.debug) {
      console.log('Push: updated', doc);
    }

    if (!doc) {
      throw new Meteor.Error(500, 'setPushToken could not create record');
    } // Return the doc we want to use


    return doc;
  },
  'raix:push-setuser': function (id) {
    check(id, String);

    if (Push.debug) {
      console.log('Push: Settings userId "' + this.userId + '" for app:', id);
    } // We update the appCollection id setting the Meteor.userId


    var found = Push.appCollection.update({
      _id: id
    }, {
      $set: {
        userId: this.userId
      }
    }); // Note that the app id might not exist because no token is set yet.
    // We do create the new app id for the user since we might store additional
    // metadata for the app / user
    // If id not found then create it?
    // We dont, its better to wait until the user wants to
    // store metadata or token - We could end up with unused data in the
    // collection at every app re-install / update
    //
    // The user could store some metadata in appCollectin but only if they
    // have created the app and provided a token.
    // If not the metadata should be set via ground:db

    return !!found;
  },
  'raix:push-metadata': function (data) {
    check(data, {
      id: String,
      metadata: Object
    }); // Set the metadata

    var found = Push.appCollection.update({
      _id: data.id
    }, {
      $set: {
        metadata: data.metadata
      }
    });
    return !!found;
  },
  'raix:push-enable': function (data) {
    check(data, {
      id: String,
      enabled: Boolean
    });

    if (Push.debug) {
      console.log('Push: Setting enabled to "' + data.enabled + '" for app:', data.id);
    }

    var found = Push.appCollection.update({
      _id: data.id
    }, {
      $set: {
        enabled: data.enabled
      }
    });
    return !!found;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/raix:push/lib/common/main.js");
require("/node_modules/meteor/raix:push/lib/common/notifications.js");
require("/node_modules/meteor/raix:push/lib/server/push.api.js");
require("/node_modules/meteor/raix:push/lib/server/server.js");

/* Exports */
Package._define("raix:push", {
  Push: Push,
  _matchToken: _matchToken,
  checkClientSecurity: checkClientSecurity,
  initPushUpdates: initPushUpdates,
  _replaceToken: _replaceToken,
  _removeToken: _removeToken
});

})();

//# sourceURL=meteor://💻app/packages/raix_push.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmFpeDpwdXNoL2xpYi9jb21tb24vbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmFpeDpwdXNoL2xpYi9jb21tb24vbm90aWZpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmFpeDpwdXNoL2xpYi9zZXJ2ZXIvcHVzaC5hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JhaXg6cHVzaC9saWIvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJQdXNoIiwiRXZlbnRTdGF0ZSIsImNoZWNrQ2xpZW50U2VjdXJpdHkiLCJvcHRpb25zIiwiYXBuIiwiY2VydERhdGEiLCJFcnJvciIsImtleURhdGEiLCJwYXNzcGhyYXNlIiwiZ2NtIiwiYXBpS2V5IiwiaW5pdCIsImNvbnNvbGUiLCJ3YXJuIiwiX21hdGNoVG9rZW4iLCJNYXRjaCIsIk9uZU9mIiwiU3RyaW5nIiwibm90aWZpY2F0aW9ucyIsIk1vbmdvIiwiQ29sbGVjdGlvbiIsIl92YWxpZGF0ZURvY3VtZW50Iiwibm90aWZpY2F0aW9uIiwiY2hlY2siLCJmcm9tIiwidGl0bGUiLCJ0ZXh0Iiwic2VudCIsIk9wdGlvbmFsIiwiQm9vbGVhbiIsInNlbmRpbmciLCJJbnRlZ2VyIiwiYmFkZ2UiLCJzb3VuZCIsIm5vdElkIiwiY29udGVudEF2YWlsYWJsZSIsImNhdGVnb3J5IiwiaW1hZ2UiLCJzdHlsZSIsInN1bW1hcnlUZXh0IiwicGljdHVyZSIsInF1ZXJ5IiwidG9rZW4iLCJ0b2tlbnMiLCJwYXlsb2FkIiwiT2JqZWN0IiwiZGVsYXlVbnRpbCIsIkRhdGUiLCJjcmVhdGVkQXQiLCJjcmVhdGVkQnkiLCJsZW5ndGgiLCJzZW5kIiwiY3VycmVudFVzZXIiLCJNZXRlb3IiLCJpc0NsaWVudCIsInVzZXJJZCIsImlzU2VydmVyIiwiXyIsImV4dGVuZCIsInBpY2siLCJ0ZXN0IiwiSlNPTiIsInN0cmluZ2lmeSIsImluc2VydCIsImFsbG93IiwicnVsZXMiLCJhcHBseSIsImRlbnkiLCJzZXRCYWRnZSIsImlzQ29uZmlndXJlZCIsInNlbmRXb3JrZXIiLCJ0YXNrIiwiaW50ZXJ2YWwiLCJMb2ciLCJkZWJ1ZyIsImxvZyIsInNldEludGVydmFsIiwiZXJyb3IiLCJtZXNzYWdlIiwiQ29uZmlndXJlIiwic2VsZiIsInNlbmRUaW1lb3V0IiwiX3JlcGxhY2VUb2tlbiIsImN1cnJlbnRUb2tlbiIsIm5ld1Rva2VuIiwiZW1pdFN0YXRlIiwiX3JlbW92ZVRva2VuIiwicHJvZHVjdGlvbiIsImRldmVsb3BtZW50IiwiZ2F0ZXdheSIsImFic29sdXRlVXJsIiwiTnBtIiwicmVxdWlyZSIsImFwbkNvbm5lY3Rpb24iLCJDb25uZWN0aW9uIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJlcnJDb2RlIiwicmVjaXBpZW50IiwiaW5kZXhPZiIsInNlbmRBUE4iLCJ1c2VyVG9rZW4iLCJwcmlvcml0eSIsIm15RGV2aWNlIiwiRGV2aWNlIiwibm90ZSIsIk5vdGlmaWNhdGlvbiIsImV4cGlyeSIsIk1hdGgiLCJmbG9vciIsIm5vdyIsInNldENvbnRlbnRBdmFpbGFibGUiLCJhbGVydCIsImJvZHkiLCJlanNvbiIsIkVKU09OIiwibWVzc2FnZUZyb20iLCJwdXNoTm90aWZpY2F0aW9uIiwiaW5pdEZlZWRiYWNrIiwiZmVlZGJhY2tPcHRpb25zIiwiY2VydCIsImtleSIsImZlZWRiYWNrIiwiRmVlZGJhY2siLCJkZXZpY2VzIiwiZm9yRWFjaCIsIml0ZW0iLCJkZXZpY2UiLCJzdGFydCIsInNlbmRHQ00iLCJ1c2VyVG9rZW5zIiwiRmliZXIiLCJkYXRhIiwibXNnY250Iiwic291bmRuYW1lIiwiTWVzc2FnZSIsImNvbGxhcHNlS2V5Iiwic2VuZGVyIiwiU2VuZGVyIiwiZWFjaCIsInZhbHVlIiwiZXJyIiwicmVzdWx0IiwiY2Fub25pY2FsX2lkcyIsImNhbGxiYWNrIiwib2xkVG9rZW4iLCJydW4iLCJyZXN1bHRzIiwicmVnaXN0cmF0aW9uX2lkIiwiZmFpbHVyZSIsIl9xdWVyeVNlbmQiLCJjb3VudEFwbiIsImNvdW50R2NtIiwiYXBwQ29sbGVjdGlvbiIsImZpbmQiLCJhcHAiLCJwdXNoIiwiX2lkIiwiY291bnQiLCIkZXhpc3RzIiwic2VydmVyU2VuZCIsInRva2VuTGlzdCIsIiRvciIsIiRhbmQiLCIkaW4iLCJlbmFibGVkIiwiJG5lIiwiaXNTZW5kaW5nTm90aWZpY2F0aW9uIiwic2VuZEludGVydmFsIiwiX2Vuc3VyZUluZGV4Iiwic2VuZE5vdGlmaWNhdGlvbiIsInRpbWVvdXRBdCIsInJlc2VydmVkIiwidXBkYXRlIiwiJGx0IiwiJHNldCIsInBhcnNlIiwia2VlcE5vdGlmaWNhdGlvbnMiLCJyZW1vdmUiLCJzZW50QXQiLCJlbWl0IiwiYmF0Y2hTaXplIiwic2VuZEJhdGNoU2l6ZSIsInBlbmRpbmdOb3RpZmljYXRpb25zIiwiJGx0ZSIsInNvcnQiLCJsaW1pdCIsImFkZExpc3RlbmVyIiwibXVsdGkiLCIkdW5zZXQiLCJtZXRob2RzIiwiaWQiLCJhcHBOYW1lIiwibWV0YWRhdGEiLCJkb2MiLCJmaW5kT25lIiwidXBkYXRlZEF0IiwiUmFuZG9tIiwiX2NvbGxlY3Rpb24iLCJyZW1vdmVkIiwiZm91bmQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0FBLE9BQU8sSUFBSUMsVUFBSixFQUFQLEMsQ0FHQTs7QUFDQUMsc0JBQXNCLFVBQVNDLE9BQVQsRUFBa0I7QUFFdEM7QUFDQTtBQUNBLE1BQUlBLFFBQVFDLEdBQVIsSUFBZUQsUUFBUUMsR0FBUixDQUFZQyxRQUEvQixFQUF5QztBQUN2QyxVQUFNLElBQUlDLEtBQUosQ0FBVSwwREFBVixDQUFOO0FBQ0Q7O0FBRUQsTUFBSUgsUUFBUUMsR0FBUixJQUFlRCxRQUFRQyxHQUFSLENBQVlHLE9BQS9CLEVBQXdDO0FBQ3RDLFVBQU0sSUFBSUQsS0FBSixDQUFVLGtEQUFWLENBQU47QUFDRDs7QUFFRCxNQUFJSCxRQUFRQyxH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OztBQUtBLFFBQUk3QixLQUFLMEUsS0FBVCxFQUFnQjtBQUNkOUQsY0FBUStELEdBQVIsQ0FBWSwrQkFBK0J5RCxLQUFLaUMsT0FBcEMsR0FBOEMsWUFBMUQsRUFBd0VqQyxLQUFLMkQsRUFBN0U7QUFDRDs7QUFFRCxRQUFJUyxRQUFReE0sS0FBS3lKLGFBQUwsQ0FBbUJvQixNQUFuQixDQUEwQjtBQUFFaEIsV0FBS3pCLEtBQUsyRDtBQUFaLEtBQTFCLEVBQTRDO0FBQUVoQixZQUFNO0FBQUVWLGlCQUFTakMsS0FBS2lDO0FBQWhCO0FBQVIsS0FBNUMsQ0FBWjtBQUVBLFdBQU8sQ0FBQyxDQUFDbUMsS0FBVDtBQUNEO0FBbEpZLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcmFpeF9wdXNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVGhlIHB1c2ggb2JqZWN0IGlzIGFuIGV2ZW50IGVtaXR0ZXJcblB1c2ggPSBuZXcgRXZlbnRTdGF0ZSgpO1xuXG5cbi8vIENsaWVudC1zaWRlIHNlY3VyaXR5IHdhcm5pbmdzLCB1c2VkIHRvIGNoZWNrIG9wdGlvbnNcbmNoZWNrQ2xpZW50U2VjdXJpdHkgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgLy8gV2FybiBpZiBjZXJ0aWZpY2F0ZXMgb3Iga2V5cyBhcmUgYWRkZWQgaGVyZSBvbiBjbGllbnQuIFdlIGRvbnQgYWxsb3cgdGhlXG4gIC8vIHVzZXIgdG8gZG8gdGhpcyBmb3Igc2VjdXJpdHkgcmVhc29ucy5cbiAgaWYgKG9wdGlvbnMuYXBuICYmIG9wdGlvbnMuYXBuLmNlcnREYXRhKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdQdXNoLmluaXQ6IERvbnQgYWRkIHlvdXIgQVBOIGNlcnRpZmljYXRlIGluIGNsaWVudCBjb2RlIScpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYXBuICYmIG9wdGlvbnMuYXBuLmtleURhdGEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1B1c2guaW5pdDogRG9udCBhZGQgeW91ciBBUE4ga2V5IGluIGNsaWVudCBjb2RlIScpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuYXBuICYmIG9wdGlvbnMuYXBuLnBhc3NwaHJhc2UpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1B1c2guaW5pdDogRG9udCBhZGQgeW91ciBBUE4gcGFzc3BocmFzZSBpbiBjbGllbnQgY29kZSEnKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmdjbSAmJiBvcHRpb25zLmdjbS5hcGlLZXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1B1c2guaW5pdDogRG9udCBhZGQgeW91ciBHQ00gYXBpIGtleSBpbiBjbGllbnQgY29kZSEnKTtcbiAgfVxufTtcblxuLy8gREVQUkVDQVRFRFxuUHVzaC5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUud2FybignUHVzaC5pbml0IGhhdmUgYmVlbiBkZXByZWNhdGVkIGluIGZhdm9yIG9mIFwiY29uZmlnLnB1c2guanNvblwiIHBsZWFzZSBtaWdyYXRlJyk7XG59O1xuIiwiLy8gVGhpcyBpcyB0aGUgbWF0Y2ggcGF0dGVybiBmb3IgdG9rZW5zXG5fbWF0Y2hUb2tlbiA9IE1hdGNoLk9uZU9mKHsgYXBuOiBTdHJpbmcgfSwgeyBnY206IFN0cmluZyB9KTtcblxuLy8gTm90aWZpY2F0aW9ucyBjb2xsZWN0aW9uXG5QdXNoLm5vdGlmaWNhdGlvbnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignX3JhaXhfcHVzaF9ub3RpZmljYXRpb25zJyk7XG5cbi8vIFRoaXMgaXMgYSBnZW5lcmFsIGZ1bmN0aW9uIHRvIHZhbGlkYXRlIHRoYXQgdGhlIGRhdGEgYWRkZWQgdG8gbm90aWZpY2F0aW9uc1xuLy8gaXMgaW4gdGhlIGNvcnJlY3QgZm9ybWF0LiBJZiBub3QgdGhpcyBmdW5jdGlvbiB3aWxsIHRocm93IGVycm9yc1xudmFyIF92YWxpZGF0ZURvY3VtZW50ID0gZnVuY3Rpb24obm90aWZpY2F0aW9uKSB7XG5cbiAgLy8gQ2hlY2sgdGhlIGdlbmVyYWwgbm90aWZpY2F0aW9uXG4gIGNoZWNrKG5vdGlmaWNhdGlvbiwge1xuICAgIGZyb206IFN0cmluZyxcbiAgICB0aXRsZTogU3RyaW5nLFxuICAgIHRleHQ6IFN0cmluZyxcbiAgICBzZW50OiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgICBzZW5kaW5nOiBNYXRjaC5PcHRpb25hbChNYXRjaC5JbnRlZ2VyKSxcbiAgICBiYWRnZTogTWF0Y2guT3B0aW9uYWwoTWF0Y2guSW50ZWdlciksXG4gICAgc291bmQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgbm90SWQ6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxuICAgIGNvbnRlbnRBdmFpbGFibGU6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxuICAgIGFwbjogTWF0Y2guT3B0aW9uYWwoe1xuICAgICAgZnJvbTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICAgIHRpdGxlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgdGV4dDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICAgIGJhZGdlOiBNYXRjaC5PcHRpb25hbChNYXRjaC5JbnRlZ2VyKSxcbiAgICAgIHNvdW5kOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgbm90SWQ6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxuICAgICAgY2F0ZWdvcnk6IE1hdGNoLk9wdGlvbmFsKFN0cmluZylcbiAgICB9KSxcbiAgICBnY206IE1hdGNoLk9wdGlvbmFsKHtcbiAgICAgIGZyb206IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICB0aXRsZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICAgIHRleHQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICBpbWFnZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICAgIHN0eWxlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgc3VtbWFyeVRleHQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICBwaWN0dXJlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgICAgYmFkZ2U6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxuICAgICAgc291bmQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICBub3RJZDogTWF0Y2guT3B0aW9uYWwoTWF0Y2guSW50ZWdlcilcbiAgICB9KSxcbiAgICBxdWVyeTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICB0b2tlbjogTWF0Y2guT3B0aW9uYWwoX21hdGNoVG9rZW4pLFxuICAgIHRva2VuczogTWF0Y2guT3B0aW9uYWwoW19tYXRjaFRva2VuXSksXG4gICAgcGF5bG9hZDogTWF0Y2guT3B0aW9uYWwoT2JqZWN0KSxcbiAgICBkZWxheVVudGlsOiBNYXRjaC5PcHRpb25hbChEYXRlKSxcbiAgICBjcmVhdGVkQXQ6IERhdGUsXG4gICAgY3JlYXRlZEJ5OiBNYXRjaC5PbmVPZihTdHJpbmcsIG51bGwpXG4gIH0pO1xuXG4gIC8vIE1ha2Ugc3VyZSBhIHRva2VuIHNlbGVjdG9yIG9yIHF1ZXJ5IGhhdmUgYmVlbiBzZXRcbiAgaWYgKCFub3RpZmljYXRpb24udG9rZW4gJiYgIW5vdGlmaWNhdGlvbi50b2tlbnMgJiYgIW5vdGlmaWNhdGlvbi5xdWVyeSkge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gdG9rZW4gc2VsZWN0b3Igb3IgcXVlcnkgZm91bmQnKTtcbiAgfVxuXG4gIC8vIElmIHRva2VucyBhcnJheSBpcyBzZXQgaXQgc2hvdWxkIG5vdCBiZSBlbXB0eVxuICBpZiAobm90aWZpY2F0aW9uLnRva2VucyAmJiAhbm90aWZpY2F0aW9uLnRva2Vucy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHRva2VucyBpbiBhcnJheScpO1xuICB9XG59O1xuXG5QdXNoLnNlbmQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIC8vIElmIG9uIHRoZSBjbGllbnQgd2Ugc2V0IHRoZSB1c2VyIGlkIC0gb24gdGhlIHNlcnZlciB3ZSBuZWVkIGFuIG9wdGlvblxuICAvLyBzZXQgb3Igd2UgZGVmYXVsdCB0byBcIjxTRVJWRVI+XCIgYXMgdGhlIGNyZWF0b3Igb2YgdGhlIG5vdGlmaWNhdGlvblxuICAvLyBJZiBjdXJyZW50IHVzZXIgbm90IHNldCBzZWUgaWYgd2UgY2FuIHNldCBpdCB0byB0aGUgbG9nZ2VkIGluIHVzZXJcbiAgLy8gdGhpcyB3aWxsIG9ubHkgcnVuIG9uIHRoZSBjbGllbnQgaWYgTWV0ZW9yLnVzZXJJZCBpcyBhdmFpbGFibGVcbiAgdmFyIGN1cnJlbnRVc2VyID0gTWV0ZW9yLmlzQ2xpZW50ICYmIE1ldGVvci51c2VySWQgJiYgTWV0ZW9yLnVzZXJJZCgpIHx8XG4gICAgICAgICAgTWV0ZW9yLmlzU2VydmVyICYmIChvcHRpb25zLmNyZWF0ZWRCeSB8fCAnPFNFUlZFUj4nKSB8fCBudWxsO1xuXG4gIC8vIFJpZyB0aGUgbm90aWZpY2F0aW9uIG9iamVjdFxuICAgdmFyIG5vdGlmaWNhdGlvbiA9IF8uZXh0ZW5kKHtcbiAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgY3JlYXRlZEJ5OiBjdXJyZW50VXNlclxuICB9LCBfLnBpY2sob3B0aW9ucywgJ2Zyb20nLCAndGl0bGUnLCAndGV4dCcpKTtcblxuICAgLy8gQWRkIGV4dHJhXG4gICBfLmV4dGVuZChub3RpZmljYXRpb24sIF8ucGljayhvcHRpb25zLCAncGF5bG9hZCcsICdiYWRnZScsICdzb3VuZCcsICdub3RJZCcsICdkZWxheVVudGlsJykpO1xuXG4gIGlmIChNYXRjaC50ZXN0KG9wdGlvbnMuYXBuLCBPYmplY3QpKSB7XG4gICAgbm90aWZpY2F0aW9uLmFwbiA9IF8ucGljayhvcHRpb25zLmFwbiwgJ2Zyb20nLCAndGl0bGUnLCAndGV4dCcsICdiYWRnZScsICdzb3VuZCcsICdub3RJZCcsICdjYXRlZ29yeScpO1xuICB9XG5cbiAgaWYgKE1hdGNoLnRlc3Qob3B0aW9ucy5nY20sIE9iamVjdCkpIHtcbiAgICBub3RpZmljYXRpb24uZ2NtID0gXy5waWNrKG9wdGlvbnMuZ2NtLCAnaW1hZ2UnLCAnc3R5bGUnLCAnc3VtbWFyeVRleHQnLCAncGljdHVyZScsICdmcm9tJywgJ3RpdGxlJywgJ3RleHQnLCAnYmFkZ2UnLCAnc291bmQnLCAnbm90SWQnKTtcbiAgfVxuXG4gIC8vIFNldCBvbmUgdG9rZW4gc2VsZWN0b3IsIHRoaXMgY2FuIGJlIHRva2VuLCBhcnJheSBvZiB0b2tlbnMgb3IgcXVlcnlcbiAgaWYgKG9wdGlvbnMucXVlcnkpIHtcbiAgICAvLyBTZXQgcXVlcnkgdG8gdGhlIGpzb24gc3RyaW5nIHZlcnNpb24gZml4aW5nICM0MyBhbmQgIzM5XG4gICAgbm90aWZpY2F0aW9uLnF1ZXJ5ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5xdWVyeSk7XG4gIH0gZWxzZSBpZiAob3B0aW9ucy50b2tlbikge1xuICAgIC8vIFNldCB0b2tlblxuICAgIG5vdGlmaWNhdGlvbi50b2tlbiA9IG9wdGlvbnMudG9rZW47XG4gIH0gZWxzZSBpZiAob3B0aW9ucy50b2tlbnMpIHtcbiAgICAvLyBTZXQgdG9rZW5zXG4gICAgbm90aWZpY2F0aW9uLnRva2VucyA9IG9wdGlvbnMudG9rZW5zO1xuICB9XG4gIC8vY29uc29sZS5sb2cob3B0aW9ucyk7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5jb250ZW50QXZhaWxhYmxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5vdGlmaWNhdGlvbi5jb250ZW50QXZhaWxhYmxlID0gb3B0aW9ucy5jb250ZW50QXZhaWxhYmxlO1xuICB9XG5cbiAgbm90aWZpY2F0aW9uLnNlbnQgPSBmYWxzZTtcbiAgbm90aWZpY2F0aW9uLnNlbmRpbmcgPSAwO1xuXG4gIC8vIFZhbGlkYXRlIHRoZSBub3RpZmljYXRpb25cbiAgX3ZhbGlkYXRlRG9jdW1lbnQobm90aWZpY2F0aW9uKTtcblxuICAvLyBUcnkgdG8gYWRkIHRoZSBub3RpZmljYXRpb24gdG8gc2VuZCwgd2UgcmV0dXJuIGFuIGlkIHRvIGtlZXAgdHJhY2tcbiAgcmV0dXJuIFB1c2gubm90aWZpY2F0aW9ucy5pbnNlcnQobm90aWZpY2F0aW9uKTtcbn07XG5cblB1c2guYWxsb3cgPSBmdW5jdGlvbihydWxlcykge1xuICBpZiAocnVsZXMuc2VuZCkge1xuICAgIFB1c2gubm90aWZpY2F0aW9ucy5hbGxvdyh7XG4gICAgICAnaW5zZXJ0JzogZnVuY3Rpb24odXNlcklkLCBub3RpZmljYXRpb24pIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgdGhlIG5vdGlmaWNhdGlvblxuICAgICAgICBfdmFsaWRhdGVEb2N1bWVudChub3RpZmljYXRpb24pO1xuICAgICAgICAvLyBTZXQgdGhlIHVzZXIgZGVmaW5lZCBcInNlbmRcIiBydWxlc1xuICAgICAgICByZXR1cm4gcnVsZXMuc2VuZC5hcHBseSh0aGlzLCBbdXNlcklkLCBub3RpZmljYXRpb25dKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuUHVzaC5kZW55ID0gZnVuY3Rpb24ocnVsZXMpIHtcbiAgaWYgKHJ1bGVzLnNlbmQpIHtcbiAgICBQdXNoLm5vdGlmaWNhdGlvbnMuZGVueSh7XG4gICAgICAnaW5zZXJ0JzogZnVuY3Rpb24odXNlcklkLCBub3RpZmljYXRpb24pIHtcbiAgICAgICAgLy8gVmFsaWRhdGUgdGhlIG5vdGlmaWNhdGlvblxuICAgICAgICBfdmFsaWRhdGVEb2N1bWVudChub3RpZmljYXRpb24pO1xuICAgICAgICAvLyBTZXQgdGhlIHVzZXIgZGVmaW5lZCBcInNlbmRcIiBydWxlc1xuICAgICAgICByZXR1cm4gcnVsZXMuc2VuZC5hcHBseSh0aGlzLCBbdXNlcklkLCBub3RpZmljYXRpb25dKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcbiIsIi8qXG4gIEEgZ2VuZXJhbCBwdXJwb3NlIHVzZXIgQ29yZG92YVB1c2hcbiAgaW9zLCBhbmRyb2lkLCBtYWlsLCB0d2l0dGVyPywgZmFjZWJvb2s/LCBzbXM/LCBzbmFpbE1haWw/IDopXG5cbiAgUGhvbmVnYXAgZ2VuZXJpYyA6XG4gIGh0dHBzOi8vZ2l0aHViLmNvbS9waG9uZWdhcC1idWlsZC9QdXNoUGx1Z2luXG4gKi9cblxuLy8gZ2V0VGV4dCAvIGdldEJpbmFyeVxuXG5QdXNoLnNldEJhZGdlID0gZnVuY3Rpb24oLyogaWQsIGNvdW50ICovKSB7XG4gICAgLy8gdGhyb3cgbmV3IEVycm9yKCdQdXNoLnNldEJhZGdlIG5vdCBpbXBsZW1lbnRlZCBvbiB0aGUgc2VydmVyJyk7XG59O1xuXG52YXIgaXNDb25maWd1cmVkID0gZmFsc2U7XG5cbnZhciBzZW5kV29ya2VyID0gZnVuY3Rpb24odGFzaywgaW50ZXJ2YWwpIHtcbiAgaWYgKHR5cGVvZiBQdXNoLkxvZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIFB1c2guTG9nKCdQdXNoOiBTZW5kIHdvcmtlciBzdGFydGVkLCB1c2luZyBpbnRlcnZhbDonLCBpbnRlcnZhbCk7XG4gIH1cbiAgaWYgKFB1c2guZGVidWcpIHtcbiAgICBjb25zb2xlLmxvZygnUHVzaDogU2VuZCB3b3JrZXIgc3RhcnRlZCwgdXNpbmcgaW50ZXJ2YWw6ICcgKyBpbnRlcnZhbCk7XG4gIH1cblxuICByZXR1cm4gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgIC8vIHh4eDogYWRkIGV4cG9uZW50aWFsIGJhY2tvZmYgb24gZXJyb3JcbiAgICB0cnkge1xuICAgICAgdGFzaygpO1xuICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgIGlmICh0eXBlb2YgUHVzaC5Mb2cgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgUHVzaC5Mb2coJ1B1c2g6IEVycm9yIHdoaWxlIHNlbmRpbmc6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICB9XG4gICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmxvZygnUHVzaDogRXJyb3Igd2hpbGUgc2VuZGluZzogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSwgaW50ZXJ2YWwpO1xufTtcblxuUHVzaC5Db25maWd1cmUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XG4gICAgICBzZW5kVGltZW91dDogNjAwMDAsIC8vIFRpbWVvdXQgcGVyaW9kIGZvciBub3RpZmljYXRpb24gc2VuZFxuICAgIH0sIG9wdGlvbnMpO1xuICAgIC8vIGh0dHBzOi8vbnBtanMub3JnL3BhY2thZ2UvYXBuXG5cbiAgICAvLyBBZnRlciByZXF1ZXN0aW5nIHRoZSBjZXJ0aWZpY2F0ZSBmcm9tIEFwcGxlLCBleHBvcnQgeW91ciBwcml2YXRlIGtleSBhc1xuICAgIC8vIGEgLnAxMiBmaWxlIGFuZGRvd25sb2FkIHRoZSAuY2VyIGZpbGUgZnJvbSB0aGUgaU9TIFByb3Zpc2lvbmluZyBQb3J0YWwuXG5cbiAgICAvLyBnYXRld2F5LnB1c2guYXBwbGUuY29tLCBwb3J0IDIxOTVcbiAgICAvLyBnYXRld2F5LnNhbmRib3gucHVzaC5hcHBsZS5jb20sIHBvcnQgMjE5NVxuXG4gICAgLy8gTm93LCBpbiB0aGUgZGlyZWN0b3J5IGNvbnRhaW5pbmcgY2VydC5jZXIgYW5kIGtleS5wMTIgZXhlY3V0ZSB0aGVcbiAgICAvLyBmb2xsb3dpbmcgY29tbWFuZHMgdG8gZ2VuZXJhdGUgeW91ciAucGVtIGZpbGVzOlxuICAgIC8vICQgb3BlbnNzbCB4NTA5IC1pbiBjZXJ0LmNlciAtaW5mb3JtIERFUiAtb3V0Zm9ybSBQRU0gLW91dCBjZXJ0LnBlbVxuICAgIC8vICQgb3BlbnNzbCBwa2NzMTIgLWluIGtleS5wMTIgLW91dCBrZXkucGVtIC1ub2Rlc1xuXG4gICAgLy8gQmxvY2sgbXVsdGlwbGUgY2FsbHNcbiAgICBpZiAoaXNDb25maWd1cmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1B1c2guQ29uZmlndXJlIHNob3VsZCBub3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIScpO1xuICAgIH1cblxuICAgIGlzQ29uZmlndXJlZCA9IHRydWU7XG5cbiAgICAvLyBBZGQgZGVidWcgaW5mb1xuICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUHVzaC5Db25maWd1cmUnLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIGEgdG9rZW4gaXMgcmVwbGFjZWQgb24gYSBkZXZpY2UgLSBub3JtYWxseVxuICAgIC8vIHRoaXMgc2hvdWxkIG5vdCBoYXBwZW4sIGJ1dCBpZiBpdCBkb2VzIHdlIHNob3VsZCB0YWtlIGFjdGlvbiBvbiBpdFxuICAgIF9yZXBsYWNlVG9rZW4gPSBmdW5jdGlvbihjdXJyZW50VG9rZW4sIG5ld1Rva2VuKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdSZXBsYWNlIHRva2VuOiAnICsgY3VycmVudFRva2VuICsgJyAtLSAnICsgbmV3VG9rZW4pO1xuICAgICAgICAvLyBJZiB0aGUgc2VydmVyIGdldHMgYSB0b2tlbiBldmVudCBpdHMgcGFzc2luZyBpbiB0aGUgY3VycmVudCB0b2tlbiBhbmRcbiAgICAgICAgLy8gdGhlIG5ldyB2YWx1ZSAtIGlmIG5ldyB2YWx1ZSBpcyB1bmRlZmluZWQgdGhpcyBlbXB0eSB0aGUgdG9rZW5cbiAgICAgICAgc2VsZi5lbWl0U3RhdGUoJ3Rva2VuJywgY3VycmVudFRva2VuLCBuZXdUb2tlbik7XG4gICAgfTtcblxuICAgIC8vIFJpZyB0aGUgcmVtb3ZlVG9rZW4gY2FsbGJhY2tcbiAgICBfcmVtb3ZlVG9rZW4gPSBmdW5jdGlvbih0b2tlbikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnUmVtb3ZlIHRva2VuOiAnICsgdG9rZW4pO1xuICAgICAgICAvLyBJbnZhbGlkYXRlIHRoZSB0b2tlblxuICAgICAgICBzZWxmLmVtaXRTdGF0ZSgndG9rZW4nLCB0b2tlbiwgbnVsbCk7XG4gICAgfTtcblxuXG4gICAgaWYgKG9wdGlvbnMuYXBuKSB7XG4gICAgICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1B1c2g6IEFQTiBjb25maWd1cmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbGxvdyBwcm9kdWN0aW9uIHRvIGJlIGEgZ2VuZXJhbCBvcHRpb24gZm9yIHB1c2ggbm90aWZpY2F0aW9uc1xuICAgICAgICBpZiAob3B0aW9ucy5wcm9kdWN0aW9uID09PSBCb29sZWFuKG9wdGlvbnMucHJvZHVjdGlvbikpIHtcbiAgICAgICAgICBvcHRpb25zLmFwbi5wcm9kdWN0aW9uID0gb3B0aW9ucy5wcm9kdWN0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2l2ZSB0aGUgdXNlciB3YXJuaW5ncyBhYm91dCBkZXZlbG9wbWVudCBzZXR0aW5nc1xuICAgICAgICBpZiAob3B0aW9ucy5hcG4uZGV2ZWxvcG1lbnQpIHtcbiAgICAgICAgICAvLyBUaGlzIGZsYWcgaXMgbm9ybWFsbHkgc2V0IGJ5IHRoZSBjb25maWd1cmF0aW9uIGZpbGVcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IFB1c2ggQVBOIGlzIHVzaW5nIGRldmVsb3BtZW50IGtleSBhbmQgY2VydGlmaWNhdGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBXZSBjaGVjayB0aGUgYXBuIGdhdGV3YXkgaSB0aGUgb3B0aW9ucywgd2UgY291bGQgcmlzayBzaGlwcGluZ1xuICAgICAgICAgIC8vIHNlcnZlciBpbnRvIHByb2R1Y3Rpb24gd2hpbGUgdXNpbmcgdGhlIHByb2R1Y3Rpb24gY29uZmlndXJhdGlvbi5cbiAgICAgICAgICAvLyBPbiB0aGUgb3RoZXIgaGFuZCB3ZSBjb3VsZCBiZSBpbiBkZXZlbG9wbWVudCBidXQgdXNpbmcgdGhlIHByb2R1Y3Rpb25cbiAgICAgICAgICAvLyBjb25maWd1cmF0aW9uLiBBbmQgZmluYWxseSB3ZSBjb3VsZCBoYXZlIGNvbmZpZ3VyZWQgYW4gdW5rbm93biBhcG5cbiAgICAgICAgICAvLyBnYXRld2F5ICh0aGlzIGNvdWxkIGNoYW5nZSBpbiB0aGUgZnV0dXJlIC0gYnV0IGEgd2FybmluZyBhYm91dCB0eXBvc1xuICAgICAgICAgIC8vIGNhbiBzYXZlIGhvdXJzIG9mIGRlYnVnZ2luZylcbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIFdhcm4gYWJvdXQgZ2F0ZXdheSBjb25maWd1cmF0aW9ucyAtIGl0J3MgbW9yZSBhIGd1aWRlXG4gICAgICAgICAgaWYgKG9wdGlvbnMuYXBuLmdhdGV3YXkpIHtcblxuICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hcG4uZ2F0ZXdheSA9PT0gJ2dhdGV3YXkuc2FuZGJveC5wdXNoLmFwcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFVzaW5nIHRoZSBkZXZlbG9wbWVudCBzYW5kYm94XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IFB1c2ggQVBOIGlzIGluIGRldmVsb3BtZW50IG1vZGUnKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmFwbi5nYXRld2F5ID09PSAnZ2F0ZXdheS5wdXNoLmFwcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEluIHByb2R1Y3Rpb24gLSBidXQgd2FybiBpZiB3ZSBhcmUgcnVubmluZyBvbiBsb2NhbGhvc3RcbiAgICAgICAgICAgICAgICAgIGlmICgvaHR0cDpcXC9cXC9sb2NhbGhvc3QvLnRlc3QoTWV0ZW9yLmFic29sdXRlVXJsKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdXQVJOSU5HOiBQdXNoIEFQTiBpcyBjb25maWd1cmVkIHRvIHByb2R1Y3Rpb24gbW9kZSAtIGJ1dCBzZXJ2ZXIgaXMgcnVubmluZycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyBmcm9tIGxvY2FsaG9zdCcpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gV2FybiBhYm91dCBnYXRld2F5cyB3ZSBkb250IGtub3cgYWJvdXRcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignV0FSTklORzogUHVzaCBBUE4gdW5rb3duIGdhdGV3YXkgXCInICsgb3B0aW9ucy5hcG4uZ2F0ZXdheSArICdcIicpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hcG4ucHJvZHVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgaWYgKC9odHRwOlxcL1xcL2xvY2FsaG9zdC8udGVzdChNZXRlb3IuYWJzb2x1dGVVcmwoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IFB1c2ggQVBOIGlzIGNvbmZpZ3VyZWQgdG8gcHJvZHVjdGlvbiBtb2RlIC0gYnV0IHNlcnZlciBpcyBydW5uaW5nJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnIGZyb20gbG9jYWxob3N0Jyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dBUk5JTkc6IFB1c2ggQVBOIGlzIGluIGRldmVsb3BtZW50IG1vZGUnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgY2VydGlmaWNhdGUgZGF0YVxuICAgICAgICBpZiAoIW9wdGlvbnMuYXBuLmNlcnREYXRhIHx8ICFvcHRpb25zLmFwbi5jZXJ0RGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFUlJPUjogUHVzaCBzZXJ2ZXIgY291bGQgbm90IGZpbmQgY2VydERhdGEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGtleSBkYXRhXG4gICAgICAgIGlmICghb3B0aW9ucy5hcG4ua2V5RGF0YSB8fCAhb3B0aW9ucy5hcG4ua2V5RGF0YS5sZW5ndGgpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFUlJPUjogUHVzaCBzZXJ2ZXIgY291bGQgbm90IGZpbmQga2V5RGF0YScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmlnIGFwbiBjb25uZWN0aW9uXG4gICAgICAgIHZhciBhcG4gPSBOcG0ucmVxdWlyZSgnYXBuJyk7XG4gICAgICAgIHZhciBhcG5Db25uZWN0aW9uID0gbmV3IGFwbi5Db25uZWN0aW9uKCBvcHRpb25zLmFwbiApO1xuXG4gICAgICAgIC8vIExpc3RlbiB0byB0cmFuc21pc3Npb24gZXJyb3JzIC0gc2hvdWxkIGhhbmRsZSB0aGUgc2FtZSB3YXkgYXMgZmVlZGJhY2suXG4gICAgICAgIGFwbkNvbm5lY3Rpb24ub24oJ3RyYW5zbWlzc2lvbkVycm9yJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoZXJyQ29kZSwgbm90aWZpY2F0aW9uLCByZWNpcGllbnQpIHtcbiAgICAgICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0dvdCBlcnJvciBjb2RlICVkIGZvciB0b2tlbiAlcycsIGVyckNvZGUsIG5vdGlmaWNhdGlvbi50b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChbMiwgNSwgOF0uaW5kZXhPZihlcnJDb2RlKSA+PSAwKSB7XG5cblxuICAgICAgICAgICAgLy8gSW52YWxpZCB0b2tlbiBlcnJvcnMuLi5cbiAgICAgICAgICAgIF9yZW1vdmVUb2tlbih7XG4gICAgICAgICAgICAgIGFwbjogbm90aWZpY2F0aW9uLnRva2VuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgLy8gWFhYOiBzaG91bGQgd2UgZG8gYSB0ZXN0IG9mIHRoZSBjb25uZWN0aW9uPyBJdCB3b3VsZCBiZSBuaWNlIHRvIGtub3dcbiAgICAgICAgLy8gVGhhdCB0aGUgc2VydmVyL2NlcnRpZmljYXRlcy9uZXR3b3JrIGFyZSBjb3JyZWN0IGNvbmZpZ3VyZWRcblxuICAgICAgICAvLyBhcG5Db25uZWN0aW9uLmNvbm5lY3QoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyAgICAgY29uc29sZS5pbmZvKCdDSEVDSzogUHVzaCBBUE4gY29ubmVjdGlvbiBPSycpO1xuICAgICAgICAvLyB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUud2FybignQ0hFQ0s6IFB1c2ggQVBOIGNvbm5lY3Rpb24gRkFJTFVSRScpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gTm90ZTogdGhlIGFib3ZlIGNvZGUgc3BvaWxzIHRoZSBjb25uZWN0aW9uIC0gaW52ZXN0aWdhdGUgaG93IHRvXG4gICAgICAgIC8vIHNodXRkb3duL2Nsb3NlIGl0LlxuXG4gICAgICAgIHNlbGYuc2VuZEFQTiA9IGZ1bmN0aW9uKHVzZXJUb2tlbiwgbm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICBpZiAoTWF0Y2gudGVzdChub3RpZmljYXRpb24uYXBuLCBPYmplY3QpKSB7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IF8uZXh0ZW5kKHt9LCBub3RpZmljYXRpb24sIG5vdGlmaWNhdGlvbi5hcG4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc2VuZEFQTicsIG5vdGlmaWNhdGlvbi5mcm9tLCB1c2VyVG9rZW4sIG5vdGlmaWNhdGlvbi50aXRsZSwgbm90aWZpY2F0aW9uLnRleHQsXG4gICAgICAgICAgICAvLyBub3RpZmljYXRpb24uYmFkZ2UsIG5vdGlmaWNhdGlvbi5wcmlvcml0eSk7XG4gICAgICAgICAgICB2YXIgcHJpb3JpdHkgPSAobm90aWZpY2F0aW9uLnByaW9yaXR5IHx8IG5vdGlmaWNhdGlvbi5wcmlvcml0eSA9PT0gMCk/IG5vdGlmaWNhdGlvbi5wcmlvcml0eSA6IDEwO1xuXG4gICAgICAgICAgICB2YXIgbXlEZXZpY2UgPSBuZXcgYXBuLkRldmljZSh1c2VyVG9rZW4pO1xuXG4gICAgICAgICAgICB2YXIgbm90ZSA9IG5ldyBhcG4uTm90aWZpY2F0aW9uKCk7XG5cbiAgICAgICAgICAgIG5vdGUuZXhwaXJ5ID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkgKyAzNjAwOyAvLyBFeHBpcmVzIDEgaG91ciBmcm9tIG5vdy5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygbm90aWZpY2F0aW9uLmJhZGdlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBub3RlLmJhZGdlID0gbm90aWZpY2F0aW9uLmJhZGdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBub3RpZmljYXRpb24uc291bmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIG5vdGUuc291bmQgPSBub3RpZmljYXRpb24uc291bmQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKG5vdGlmaWNhdGlvbi5jb250ZW50QXZhaWxhYmxlKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJsYWxhMlwiKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2cobm90aWZpY2F0aW9uKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygbm90aWZpY2F0aW9uLmNvbnRlbnRBdmFpbGFibGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJsYWxhXCIpO1xuICAgICAgICAgICAgICBub3RlLnNldENvbnRlbnRBdmFpbGFibGUobm90aWZpY2F0aW9uLmNvbnRlbnRBdmFpbGFibGUpO1xuICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKG5vdGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gYWRkcyBjYXRlZ29yeSBzdXBwb3J0IGZvciBpT1M4IGN1c3RvbSBhY3Rpb25zIGFzIGRlc2NyaWJlZCBoZXJlOlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvaW9zL2RvY3VtZW50YXRpb24vTmV0d29ya2luZ0ludGVybmV0L0NvbmNlcHR1YWwvXG4gICAgICAgICAgICAvLyBSZW1vdGVOb3RpZmljYXRpb25zUEcvQ2hhcHRlcnMvSVBob25lT1NDbGllbnRJbXAuaHRtbCMvL2FwcGxlX3JlZi9kb2MvdWlkL1RQNDAwMDgxOTQtQ0gxMDMtU1czNlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBub3RpZmljYXRpb24uY2F0ZWdvcnkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIG5vdGUuY2F0ZWdvcnkgPSBub3RpZmljYXRpb24uY2F0ZWdvcnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vdGUuYWxlcnQgPSB7XG4gICAgICAgICAgICAgIGJvZHk6IG5vdGlmaWNhdGlvbi50ZXh0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5vdGlmaWNhdGlvbi50aXRsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgbm90ZS5hbGVydC50aXRsZSA9IG5vdGlmaWNhdGlvbi50aXRsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQWxsb3cgdGhlIHVzZXIgdG8gc2V0IHBheWxvYWQgZGF0YVxuICAgICAgICAgICAgbm90ZS5wYXlsb2FkID0gKG5vdGlmaWNhdGlvbi5wYXlsb2FkKSA/IHsgZWpzb246IEVKU09OLnN0cmluZ2lmeShub3RpZmljYXRpb24ucGF5bG9hZCkgfSA6IHt9O1xuXG4gICAgICAgICAgICBub3RlLnBheWxvYWQubWVzc2FnZUZyb20gPSBub3RpZmljYXRpb24uZnJvbTtcbiAgICAgICAgICAgIG5vdGUucHJpb3JpdHkgPSBwcmlvcml0eTtcblxuXG4gICAgICAgICAgICAvLyBTdG9yZSB0aGUgdG9rZW4gb24gdGhlIG5vdGUgc28gd2UgY2FuIHJlZmVyZW5jZSBpdCBpZiB0aGVyZSB3YXMgYW4gZXJyb3JcbiAgICAgICAgICAgIG5vdGUudG9rZW4gPSB1c2VyVG9rZW47XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdJOlNlbmQgbWVzc2FnZSB0bzogJyArIHVzZXJUb2tlbiArICcgY291bnQ9JyArIGNvdW50KTtcblxuICAgICAgICAgICAgYXBuQ29ubmVjdGlvbi5wdXNoTm90aWZpY2F0aW9uKG5vdGUsIG15RGV2aWNlKTtcblxuICAgICAgICB9O1xuXG5cbiAgICAgICAgdmFyIGluaXRGZWVkYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcG4gPSBOcG0ucmVxdWlyZSgnYXBuJyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnSW5pdCBmZWVkYmFjaycpO1xuICAgICAgICAgICAgdmFyIGZlZWRiYWNrT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAnYmF0Y2hGZWVkYmFjayc6IHRydWUsXG5cbiAgICAgICAgICAgICAgICAvLyBUaW1lIGluIFNFQ09ORFNcbiAgICAgICAgICAgICAgICAnaW50ZXJ2YWwnOiA1LFxuICAgICAgICAgICAgICAgIHByb2R1Y3Rpb246ICFvcHRpb25zLmFwbi5kZXZlbG9wbWVudCxcbiAgICAgICAgICAgICAgICBjZXJ0OiBvcHRpb25zLmNlcnREYXRhLFxuICAgICAgICAgICAgICAgIGtleTogb3B0aW9ucy5rZXlEYXRhLFxuICAgICAgICAgICAgICAgIHBhc3NwaHJhc2U6IG9wdGlvbnMucGFzc3BocmFzZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIGZlZWRiYWNrID0gbmV3IGFwbi5GZWVkYmFjayhmZWVkYmFja09wdGlvbnMpO1xuICAgICAgICAgICAgZmVlZGJhY2sub24oJ2ZlZWRiYWNrJywgZnVuY3Rpb24gKGRldmljZXMpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRG8gc29tZXRoaW5nIHdpdGggaXRlbS5kZXZpY2UgYW5kIGl0ZW0udGltZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0E6UFVTSCBGRUVEQkFDSyAnICsgaXRlbS5kZXZpY2UgKyAnIC0gJyArIGl0ZW0udGltZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBhcHAgaXMgbW9zdCBsaWtlbHkgcmVtb3ZlZCBmcm9tIHRoZSBkZXZpY2UsIHdlIHNob3VsZFxuICAgICAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIHRva2VuXG4gICAgICAgICAgICAgICAgICAgIF9yZW1vdmVUb2tlbih7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcG46IGl0ZW0uZGV2aWNlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGZlZWRiYWNrLnN0YXJ0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW5pdCBmZWVkYmFjayBmcm9tIGFwbiBzZXJ2ZXJcbiAgICAgICAgLy8gVGhpcyB3aWxsIGhlbHAga2VlcCB0aGUgYXBwQ29sbGVjdGlvbiB1cC10by1kYXRlLCBpdCB3aWxsIGhlbHAgdXBkYXRlXG4gICAgICAgIC8vIGFuZCByZW1vdmUgdG9rZW4gZnJvbSBhcHBDb2xsZWN0aW9uLlxuICAgICAgICBpbml0RmVlZGJhY2soKTtcblxuICAgIH0gLy8gRU8gaW9zIG5vdGlmaWNhdGlvblxuXG4gICAgaWYgKG9wdGlvbnMuZ2NtICYmIG9wdGlvbnMuZ2NtLmFwaUtleSkge1xuICAgICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdHQ00gY29uZmlndXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIC8vc2VsZi5zZW5kR0NNID0gZnVuY3Rpb24ob3B0aW9ucy5mcm9tLCB1c2VyVG9rZW5zLCBvcHRpb25zLnRpdGxlLCBvcHRpb25zLnRleHQsIG9wdGlvbnMuYmFkZ2UsIG9wdGlvbnMucHJpb3JpdHkpIHtcbiAgICAgICAgc2VsZi5zZW5kR0NNID0gZnVuY3Rpb24odXNlclRva2Vucywgbm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICBpZiAoTWF0Y2gudGVzdChub3RpZmljYXRpb24uZ2NtLCBPYmplY3QpKSB7XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IF8uZXh0ZW5kKHt9LCBub3RpZmljYXRpb24sIG5vdGlmaWNhdGlvbi5nY20pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgdXNlclRva2VucyBhcmUgYW4gYXJyYXkgb2Ygc3RyaW5nc1xuICAgICAgICAgICAgaWYgKHVzZXJUb2tlbnMgPT09ICcnK3VzZXJUb2tlbnMpIHtcbiAgICAgICAgICAgICAgdXNlclRva2VucyA9IFt1c2VyVG9rZW5zXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgYW55IHRva2VucyBpbiB0aGVyZSB0byBzZW5kXG4gICAgICAgICAgICBpZiAoIXVzZXJUb2tlbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKFB1c2guZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZW5kR0NNIG5vIHB1c2ggdG9rZW5zIGZvdW5kJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFB1c2guZGVidWcpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NlbmRHQ00nLCB1c2VyVG9rZW5zLCBub3RpZmljYXRpb24pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZ2NtID0gTnBtLnJlcXVpcmUoJ25vZGUtZ2NtJyk7XG4gICAgICAgICAgICB2YXIgRmliZXIgPSBOcG0ucmVxdWlyZSgnZmliZXJzJyk7XG5cbiAgICAgICAgICAgIC8vIEFsbG93IHVzZXIgdG8gc2V0IHBheWxvYWRcbiAgICAgICAgICAgIHZhciBkYXRhID0gKG5vdGlmaWNhdGlvbi5wYXlsb2FkKSA/IHsgZWpzb246IEVKU09OLnN0cmluZ2lmeShub3RpZmljYXRpb24ucGF5bG9hZCkgfSA6IHt9O1xuXG4gICAgICAgICAgICBkYXRhLnRpdGxlID0gbm90aWZpY2F0aW9uLnRpdGxlO1xuICAgICAgICAgICAgZGF0YS5tZXNzYWdlID0gbm90aWZpY2F0aW9uLnRleHQ7XG5cbiAgICAgICAgICAgIC8vIFNldCBpbWFnZVxuICAgICAgICAgICAgaWYodHlwZW9mIG5vdGlmaWNhdGlvbi5pbWFnZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgZGF0YS5pbWFnZSA9IG5vdGlmaWNhdGlvbi5pbWFnZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2V0IGV4dHJhIGRldGFpbHNcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygbm90aWZpY2F0aW9uLmJhZGdlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBkYXRhLm1zZ2NudCA9IG5vdGlmaWNhdGlvbi5iYWRnZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygbm90aWZpY2F0aW9uLnNvdW5kICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBkYXRhLnNvdW5kbmFtZSA9IG5vdGlmaWNhdGlvbi5zb3VuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygbm90aWZpY2F0aW9uLm5vdElkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBkYXRhLm5vdElkID0gbm90aWZpY2F0aW9uLm5vdElkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodHlwZW9mIG5vdGlmaWNhdGlvbi5zdHlsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgZGF0YS5zdHlsZSA9IG5vdGlmaWNhdGlvbi5zdHlsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHR5cGVvZiBub3RpZmljYXRpb24uc3VtbWFyeVRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGRhdGEuc3VtbWFyeVRleHQgPSBub3RpZmljYXRpb24uc3VtbWFyeVRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0eXBlb2Ygbm90aWZpY2F0aW9uLnBpY3R1cmUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGRhdGEucGljdHVyZSA9IG5vdGlmaWNhdGlvbi5waWN0dXJlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL3ZhciBtZXNzYWdlID0gbmV3IGdjbS5NZXNzYWdlKCk7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IG5ldyBnY20uTWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgY29sbGFwc2VLZXk6IG5vdGlmaWNhdGlvbi5mcm9tLFxuICAgICAgICAgICAgLy8gICAgZGVsYXlXaGlsZUlkbGU6IHRydWUsXG4gICAgICAgICAgICAvLyAgICB0aW1lVG9MaXZlOiA0LFxuICAgICAgICAgICAgLy8gICAgcmVzdHJpY3RlZF9wYWNrYWdlX25hbWU6ICdkay5naTIuYXBwJ1xuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ3JlYXRlIEdDTSBTZW5kZXIgdXNpbmcgXCInICsgb3B0aW9ucy5nY20uYXBpS2V5ICsgJ1wiJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2VuZGVyID0gbmV3IGdjbS5TZW5kZXIob3B0aW9ucy5nY20uYXBpS2V5KTtcblxuICAgICAgICAgICAgXy5lYWNoKHVzZXJUb2tlbnMsIGZ1bmN0aW9uKHZhbHVlIC8qLCBrZXkgKi8pIHtcbiAgICAgICAgICAgICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0E6U2VuZCBtZXNzYWdlIHRvOiAnICsgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvKm1lc3NhZ2UuYWRkRGF0YSgndGl0bGUnLCB0aXRsZSk7XG4gICAgICAgICAgICBtZXNzYWdlLmFkZERhdGEoJ21lc3NhZ2UnLCB0ZXh0KTtcbiAgICAgICAgICAgIG1lc3NhZ2UuYWRkRGF0YSgnbXNnY250JywgJzEnKTtcbiAgICAgICAgICAgIG1lc3NhZ2UuY29sbGFwc2VLZXkgPSAnc2l0RHJpZnQnO1xuICAgICAgICAgICAgbWVzc2FnZS5kZWxheVdoaWxlSWRsZSA9IHRydWU7XG4gICAgICAgICAgICBtZXNzYWdlLnRpbWVUb0xpdmUgPSAzOyovXG5cbiAgICAgICAgICAgIC8vIC8qKlxuICAgICAgICAgICAgLy8gICogUGFyYW1ldGVyczogbWVzc2FnZS1saXRlcmFsLCB1c2VyVG9rZW5zLWFycmF5LCBOby4gb2YgcmV0cmllcywgY2FsbGJhY2stZnVuY3Rpb25cbiAgICAgICAgICAgIC8vICAqL1xuXG4gICAgICAgICAgICB2YXIgdXNlclRva2VuID0gKHVzZXJUb2tlbnMubGVuZ3RoID09PSAxKT91c2VyVG9rZW5zWzBdOm51bGw7XG5cbiAgICAgICAgICAgIHNlbmRlci5zZW5kKG1lc3NhZ2UsIHVzZXJUb2tlbnMsIDUsIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFB1c2guZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQU5EUk9JRCBFUlJPUjogcmVzdWx0IG9mIHNlbmRlcjogJyArIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKFB1c2guZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBTkRST0lEOiBSZXN1bHQgb2Ygc2VuZGVyIGlzIG51bGwnKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FORFJPSUQ6IFJlc3VsdCBvZiBzZW5kZXI6ICcgKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmNhbm9uaWNhbF9pZHMgPT09IDEgJiYgdXNlclRva2VuKSB7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGFuIG9sZCBkZXZpY2UsIHRva2VuIGlzIHJlcGxhY2VkXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWJlcihmdW5jdGlvbihzZWxmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUnVuIGluIGZpYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jYWxsYmFjayhzZWxmLm9sZFRva2VuLCBzZWxmLm5ld1Rva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5ydW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFRva2VuOiB7IGdjbTogdXNlclRva2VuIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VG9rZW46IHsgZ2NtOiByZXN1bHQucmVzdWx0c1swXS5yZWdpc3RyYXRpb25faWQgfSwgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IF9yZXBsYWNlVG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9fcmVwbGFjZVRva2VuKHsgZ2NtOiB1c2VyVG9rZW4gfSwgeyBnY206IHJlc3VsdC5yZXN1bHRzWzBdLnJlZ2lzdHJhdGlvbl9pZCB9KTtcblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGNhbnQgc2VuZCB0byB0aGF0IHRva2VuIC0gbWlnaHQgbm90IGJlIHJlZ2lzdHJlZFxuICAgICAgICAgICAgICAgICAgICAvLyBhc2sgdGhlIHVzZXIgdG8gcmVtb3ZlIHRoZSB0b2tlbiBmcm9tIHRoZSBsaXN0XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZmFpbHVyZSAhPT0gMCAmJiB1c2VyVG9rZW4pIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbiBvbGQgZGV2aWNlLCB0b2tlbiBpcyByZXBsYWNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgRmliZXIoZnVuY3Rpb24oc2VsZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJ1biBpbiBmaWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2FsbGJhY2soc2VsZi50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfSkucnVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogeyBnY206IHVzZXJUb2tlbiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBfcmVtb3ZlVG9rZW5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9fcmVwbGFjZVRva2VuKHsgZ2NtOiB1c2VyVG9rZW4gfSwgeyBnY206IHJlc3VsdC5yZXN1bHRzWzBdLnJlZ2lzdHJhdGlvbl9pZCB9KTtcblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIC8qKiBVc2UgdGhlIGZvbGxvd2luZyBsaW5lIGlmIHlvdSB3YW50IHRvIHNlbmQgdGhlIG1lc3NhZ2Ugd2l0aG91dCByZXRyaWVzXG4gICAgICAgICAgICAvLyBzZW5kZXIuc2VuZE5vUmV0cnkobWVzc2FnZSwgdXNlclRva2VucywgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCdBTkRST0lEOiAnICsgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG4gICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIC8vICoqL1xuICAgICAgICB9OyAvLyBFTyBzZW5kQW5kcm9pZFxuXG4gICAgfSAvLyBFTyBBbmRyb2lkXG5cbiAgICAvLyBVbml2ZXJzYWwgc2VuZCBmdW5jdGlvblxuICAgIHZhciBfcXVlcnlTZW5kID0gZnVuY3Rpb24ocXVlcnksIG9wdGlvbnMpIHtcblxuICAgICAgdmFyIGNvdW50QXBuID0gW107XG4gICAgICB2YXIgY291bnRHY20gPSBbXTtcblxuICAgICAgICBQdXNoLmFwcENvbGxlY3Rpb24uZmluZChxdWVyeSkuZm9yRWFjaChmdW5jdGlvbihhcHApIHtcblxuICAgICAgICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2VuZCB0byB0b2tlbicsIGFwcC50b2tlbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYXBwLnRva2VuLmFwbikge1xuICAgICAgICAgICAgICBjb3VudEFwbi5wdXNoKGFwcC5faWQpO1xuICAgICAgICAgICAgICAgIC8vIFNlbmQgdG8gQVBOXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2VuZEFQTikge1xuICAgICAgICAgICAgICAgICAgc2VsZi5zZW5kQVBOKGFwcC50b2tlbi5hcG4sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIGlmIChhcHAudG9rZW4uZ2NtKSB7XG4gICAgICAgICAgICAgIGNvdW50R2NtLnB1c2goYXBwLl9pZCk7XG5cbiAgICAgICAgICAgICAgICAvLyBTZW5kIHRvIEdDTVxuICAgICAgICAgICAgICAgIC8vIFdlIGRvIHN1cHBvcnQgbXVsdGlwbGUgaGVyZSAtIHNvIHdlIHNob3VsZCBjb25zdHJ1Y3QgYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAvLyBhbmQgc2VuZCBpdCBidWxrIC0gSW52ZXN0aWdhdGUgbGltaXQgY291bnQgb2YgaWQnc1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNlbmRHQ00pIHtcbiAgICAgICAgICAgICAgICAgIHNlbGYuc2VuZEdDTShhcHAudG9rZW4uZ2NtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQdXNoLnNlbmQgZ290IGEgZmF1bHR5IHF1ZXJ5Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKFB1c2guZGVidWcpIHtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKCdQdXNoOiBTZW50IG1lc3NhZ2UgXCInICsgb3B0aW9ucy50aXRsZSArICdcIiB0byAnICsgY291bnRBcG4ubGVuZ3RoICsgJyBpb3MgYXBwcyAnICtcbiAgICAgICAgICAgIGNvdW50R2NtLmxlbmd0aCArICcgYW5kcm9pZCBhcHBzJyk7XG5cbiAgICAgICAgICAvLyBBZGQgc29tZSB2ZXJib3NpdHkgYWJvdXQgdGhlIHNlbmQgcmVzdWx0LCBtYWtpbmcgc3VyZSB0aGUgZGV2ZWxvcGVyXG4gICAgICAgICAgLy8gdW5kZXJzdGFuZHMgd2hhdCBqdXN0IGhhcHBlbmVkLlxuICAgICAgICAgIGlmICghY291bnRBcG4ubGVuZ3RoICYmICFjb3VudEdjbS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChQdXNoLmFwcENvbGxlY3Rpb24uZmluZCgpLmNvdW50KCkgPT09IDApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1B1c2gsIEdVSURFOiBUaGUgXCJQdXNoLmFwcENvbGxlY3Rpb25cIiBpcyBlbXB0eSAtJyArXG4gICAgICAgICAgICAgICAgJyBObyBjbGllbnRzIGhhdmUgcmVnaXN0cmVkIG9uIHRoZSBzZXJ2ZXIgeWV0Li4uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICghY291bnRBcG4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoUHVzaC5hcHBDb2xsZWN0aW9uLmZpbmQoeyAndG9rZW4uYXBuJzogeyAkZXhpc3RzOiB0cnVlIH0gfSkuY291bnQoKSA9PT0gMCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUHVzaCwgR1VJREU6IFRoZSBcIlB1c2guYXBwQ29sbGVjdGlvblwiIC0gTm8gQVBOIGNsaWVudHMgaGF2ZSByZWdpc3RyZWQgb24gdGhlIHNlcnZlciB5ZXQuLi4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKCFjb3VudEdjbS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChQdXNoLmFwcENvbGxlY3Rpb24uZmluZCh7ICd0b2tlbi5nY20nOiB7ICRleGlzdHM6IHRydWUgfSB9KS5jb3VudCgpID09PSAwKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQdXNoLCBHVUlERTogVGhlIFwiUHVzaC5hcHBDb2xsZWN0aW9uXCIgLSBObyBHQ00gY2xpZW50cyBoYXZlIHJlZ2lzdHJlZCBvbiB0aGUgc2VydmVyIHlldC4uLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhcG46IGNvdW50QXBuLFxuICAgICAgICAgIGdjbTogY291bnRHY21cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZXJ2ZXJTZW5kID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgeyBiYWRnZTogMCB9O1xuICAgICAgdmFyIHF1ZXJ5O1xuXG4gICAgICAvLyBDaGVjayBiYXNpYyBvcHRpb25zXG4gICAgICBpZiAob3B0aW9ucy5mcm9tICE9PSAnJytvcHRpb25zLmZyb20pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQdXNoLnNlbmQ6IG9wdGlvbiBcImZyb21cIiBub3QgYSBzdHJpbmcnKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMudGl0bGUgIT09ICcnK29wdGlvbnMudGl0bGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQdXNoLnNlbmQ6IG9wdGlvbiBcInRpdGxlXCIgbm90IGEgc3RyaW5nJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnRleHQgIT09ICcnK29wdGlvbnMudGV4dCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1B1c2guc2VuZDogb3B0aW9uIFwidGV4dFwiIG5vdCBhIHN0cmluZycpO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy50b2tlbiB8fCBvcHRpb25zLnRva2Vucykge1xuXG4gICAgICAgIC8vIFRoZSB1c2VyIHNldCBvbmUgdG9rZW4gb3IgYXJyYXkgb2YgdG9rZW5zXG4gICAgICAgIHZhciB0b2tlbkxpc3QgPSAob3B0aW9ucy50b2tlbik/IFtvcHRpb25zLnRva2VuXSA6IG9wdGlvbnMudG9rZW5zO1xuXG4gICAgICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1B1c2g6IFNlbmQgbWVzc2FnZSBcIicgKyBvcHRpb25zLnRpdGxlICsgJ1wiIHZpYSB0b2tlbihzKScsIHRva2VuTGlzdCk7XG4gICAgICAgIH1cblxuICAgICAgICBxdWVyeSA9IHtcbiAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgICAgLy8gWFhYOiBUZXN0IHRoaXMgcXVlcnk6IGNhbiB3ZSBoYW5kIGluIGEgbGlzdCBvZiBwdXNoIHRva2Vucz9cbiAgICAgICAgICAgICAgeyAkYW5kOiBbXG4gICAgICAgICAgICAgICAgICB7IHRva2VuOiB7ICRpbjogdG9rZW5MaXN0IH0gfSxcbiAgICAgICAgICAgICAgICAgIC8vIEFuZCBpcyBub3QgZGlzYWJsZWRcbiAgICAgICAgICAgICAgICAgIHsgZW5hYmxlZDogeyAkbmU6IGZhbHNlIH19XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAvLyBYWFg6IFRlc3QgdGhpcyBxdWVyeTogZG9lcyB0aGlzIHdvcmsgb24gYXBwIGlkP1xuICAgICAgICAgICAgICB7ICRhbmQ6IFtcbiAgICAgICAgICAgICAgICAgIHsgX2lkOiB7ICRpbjogdG9rZW5MaXN0IH0gfSwgLy8gb25lIG9mIHRoZSBhcHAgaWRzXG4gICAgICAgICAgICAgICAgICB7ICRvcjogW1xuICAgICAgICAgICAgICAgICAgICAgIHsgJ3Rva2VuLmFwbic6IHsgJGV4aXN0czogdHJ1ZSB9ICB9LCAvLyBnb3QgYXBuIHRva2VuXG4gICAgICAgICAgICAgICAgICAgICAgeyAndG9rZW4uZ2NtJzogeyAkZXhpc3RzOiB0cnVlIH0gIH0gIC8vIGdvdCBnY20gdG9rZW5cbiAgICAgICAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgICAgICAgLy8gQW5kIGlzIG5vdCBkaXNhYmxlZFxuICAgICAgICAgICAgICAgICAgeyBlbmFibGVkOiB7ICRuZTogZmFsc2UgfX1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH07XG5cbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5xdWVyeSkge1xuXG4gICAgICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1B1c2g6IFNlbmQgbWVzc2FnZSBcIicgKyBvcHRpb25zLnRpdGxlICsgJ1wiIHZpYSBxdWVyeScsIG9wdGlvbnMucXVlcnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcXVlcnkgPSB7XG4gICAgICAgICAgJGFuZDogW1xuICAgICAgICAgICAgICBvcHRpb25zLnF1ZXJ5LCAvLyBxdWVyeSBvYmplY3RcbiAgICAgICAgICAgICAgeyAkb3I6IFtcbiAgICAgICAgICAgICAgICAgIHsgJ3Rva2VuLmFwbic6IHsgJGV4aXN0czogdHJ1ZSB9ICB9LCAvLyBnb3QgYXBuIHRva2VuXG4gICAgICAgICAgICAgICAgICB7ICd0b2tlbi5nY20nOiB7ICRleGlzdHM6IHRydWUgfSAgfSAgLy8gZ290IGdjbSB0b2tlblxuICAgICAgICAgICAgICBdfSxcbiAgICAgICAgICAgICAgLy8gQW5kIGlzIG5vdCBkaXNhYmxlZFxuICAgICAgICAgICAgICB7IGVuYWJsZWQ6IHsgJG5lOiBmYWxzZSB9fVxuICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICAgIH1cblxuXG4gICAgICBpZiAocXVlcnkpIHtcblxuICAgICAgICAvLyBDb252ZXJ0IHRvIHF1ZXJ5U2VuZCBhbmQgcmV0dXJuIHN0YXR1c1xuICAgICAgICByZXR1cm4gX3F1ZXJ5U2VuZChxdWVyeSwgb3B0aW9ucyk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUHVzaC5zZW5kOiBwbGVhc2Ugc2V0IG9wdGlvbiBcInRva2VuXCIvXCJ0b2tlbnNcIiBvciBcInF1ZXJ5XCInKTtcbiAgICAgIH1cblxuICAgIH07XG5cblxuICAgIC8vIFRoaXMgaW50ZXJ2YWwgd2lsbCBhbGxvdyBvbmx5IG9uZSBub3RpZmljYXRpb24gdG8gYmUgc2VudCBhdCBhIHRpbWUsIGl0XG4gICAgLy8gd2lsbCBjaGVjayBmb3IgbmV3IG5vdGlmaWNhdGlvbnMgYXQgZXZlcnkgYG9wdGlvbnMuc2VuZEludGVydmFsYFxuICAgIC8vIChkZWZhdWx0IGludGVydmFsIGlzIDE1MDAwIG1zKVxuICAgIC8vXG4gICAgLy8gSXQgbG9va3MgaW4gbm90aWZpY2F0aW9ucyBjb2xsZWN0aW9uIHRvIHNlZSBpZiB0aGVyZXMgYW55IHBlbmRpbmdcbiAgICAvLyBub3RpZmljYXRpb25zLCBpZiBzbyBpdCB3aWxsIHRyeSB0byByZXNlcnZlIHRoZSBwZW5kaW5nIG5vdGlmaWNhdGlvbi5cbiAgICAvLyBJZiBzdWNjZXNzZnVsbHkgcmVzZXJ2ZWQgdGhlIHNlbmQgaXMgc3RhcnRlZC5cbiAgICAvL1xuICAgIC8vIElmIG5vdGlmaWNhdGlvbi5xdWVyeSBpcyB0eXBlIHN0cmluZywgaXQncyBhc3N1bWVkIHRvIGJlIGEganNvbiBzdHJpbmdcbiAgICAvLyB2ZXJzaW9uIG9mIHRoZSBxdWVyeSBzZWxlY3Rvci4gTWFraW5nIGl0IGFibGUgdG8gY2FycnkgYCRgIHByb3BlcnRpZXMgaW5cbiAgICAvLyB0aGUgbW9uZ28gY29sbGVjdGlvbi5cbiAgICAvL1xuICAgIC8vIFByLiBkZWZhdWx0IG5vdGlmaWNhdGlvbnMgYXJlIHJlbW92ZWQgZnJvbSB0aGUgY29sbGVjdGlvbiBhZnRlciBzZW5kIGhhdmVcbiAgICAvLyBjb21wbGV0ZWQuIFNldHRpbmcgYG9wdGlvbnMua2VlcE5vdGlmaWNhdGlvbnNgIHdpbGwgdXBkYXRlIGFuZCBrZWVwIHRoZVxuICAgIC8vIG5vdGlmaWNhdGlvbiBlZy4gaWYgbmVlZGVkIGZvciBoaXN0b3JpY2FsIHJlYXNvbnMuXG4gICAgLy9cbiAgICAvLyBBZnRlciB0aGUgc2VuZCBoYXZlIGNvbXBsZXRlZCBhIFwic2VuZFwiIGV2ZW50IHdpbGwgYmUgZW1pdHRlZCB3aXRoIGFcbiAgICAvLyBzdGF0dXMgb2JqZWN0IGNvbnRhaW5pbmcgbm90aWZpY2F0aW9uIGlkIGFuZCB0aGUgc2VuZCByZXN1bHQgb2JqZWN0LlxuICAgIC8vXG4gICAgdmFyIGlzU2VuZGluZ05vdGlmaWNhdGlvbiA9IGZhbHNlO1xuXG4gICAgaWYgKG9wdGlvbnMuc2VuZEludGVydmFsICE9PSBudWxsKSB7XG5cbiAgICAgIC8vIFRoaXMgd2lsbCByZXF1aXJlIGluZGV4IHNpbmNlIHdlIHNvcnQgbm90aWZpY2F0aW9ucyBieSBjcmVhdGVkQXRcbiAgICAgIFB1c2gubm90aWZpY2F0aW9ucy5fZW5zdXJlSW5kZXgoeyBjcmVhdGVkQXQ6IDEgfSk7XG4gICAgICBQdXNoLm5vdGlmaWNhdGlvbnMuX2Vuc3VyZUluZGV4KHsgc2VudDogMSB9KTtcbiAgICAgIFB1c2gubm90aWZpY2F0aW9ucy5fZW5zdXJlSW5kZXgoeyBzZW5kaW5nOiAxIH0pO1xuICAgICAgUHVzaC5ub3RpZmljYXRpb25zLl9lbnN1cmVJbmRleCh7IGRlbGF5VW50aWw6IDEgfSk7XG5cbiAgICAgIHZhciBzZW5kTm90aWZpY2F0aW9uID0gZnVuY3Rpb24obm90aWZpY2F0aW9uKSB7XG4gICAgICAgIC8vIFJlc2VydmUgbm90aWZpY2F0aW9uXG4gICAgICAgIHZhciBub3cgPSArbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHRpbWVvdXRBdCA9IG5vdyArIG9wdGlvbnMuc2VuZFRpbWVvdXQ7XG4gICAgICAgIHZhciByZXNlcnZlZCA9IFB1c2gubm90aWZpY2F0aW9ucy51cGRhdGUoe1xuICAgICAgICAgIF9pZDogbm90aWZpY2F0aW9uLl9pZCxcbiAgICAgICAgICBzZW50OiBmYWxzZSwgLy8geHh4OiBuZWVkIHRvIG1ha2Ugc3VyZSB0aGlzIGlzIHNldCBvbiBjcmVhdGVcbiAgICAgICAgICBzZW5kaW5nOiB7ICRsdDogbm93IH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICBzZW5kaW5nOiB0aW1lb3V0QXQsXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBNYWtlIHN1cmUgd2Ugb25seSBoYW5kbGUgbm90aWZpY2F0aW9ucyByZXNlcnZlZCBieSB0aGlzXG4gICAgICAgIC8vIGluc3RhbmNlXG4gICAgICAgIGlmIChyZXNlcnZlZCkge1xuXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgcXVlcnkgaXMgc2V0IGFuZCBpcyB0eXBlIFN0cmluZ1xuICAgICAgICAgIGlmIChub3RpZmljYXRpb24ucXVlcnkgJiYgbm90aWZpY2F0aW9uLnF1ZXJ5ID09PSAnJytub3RpZmljYXRpb24ucXVlcnkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIFRoZSBxdWVyeSBpcyBpbiBzdHJpbmcganNvbiBmb3JtYXQgLSB3ZSBuZWVkIHRvIHBhcnNlIGl0XG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5xdWVyeSA9IEpTT04ucGFyc2Uobm90aWZpY2F0aW9uLnF1ZXJ5KTtcbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgIC8vIERpZCB0aGUgdXNlciB0YW1wZXIgd2l0aCB0aGlzPz9cbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQdXNoOiBFcnJvciB3aGlsZSBwYXJzaW5nIHF1ZXJ5IHN0cmluZywgRXJyb3I6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2VuZCB0aGUgbm90aWZpY2F0aW9uXG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFB1c2guc2VydmVyU2VuZChub3RpZmljYXRpb24pO1xuXG4gICAgICAgICAgaWYgKCFvcHRpb25zLmtlZXBOb3RpZmljYXRpb25zKSB7XG4gICAgICAgICAgICAgIC8vIFByLiBEZWZhdWx0IHdlIHdpbGwgcmVtb3ZlIG5vdGlmaWNhdGlvbnNcbiAgICAgICAgICAgICAgUHVzaC5ub3RpZmljYXRpb25zLnJlbW92ZSh7IF9pZDogbm90aWZpY2F0aW9uLl9pZCB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbm90aWZpY2F0aW9uXG4gICAgICAgICAgICAgIFB1c2gubm90aWZpY2F0aW9ucy51cGRhdGUoeyBfaWQ6IG5vdGlmaWNhdGlvbi5faWQgfSwge1xuICAgICAgICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICAgICAgICAvLyBNYXJrIGFzIHNlbnRcbiAgICAgICAgICAgICAgICAgICAgc2VudDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBzZW50IGRhdGVcbiAgICAgICAgICAgICAgICAgICAgc2VudEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgICAgICAvLyBDb3VudFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogcmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgYmVpbmcgc2VudCBhbnltb3JlXG4gICAgICAgICAgICAgICAgICAgIHNlbmRpbmc6IDBcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBFbWl0IHRoZSBzZW5kXG4gICAgICAgICAgc2VsZi5lbWl0KCdzZW5kJywgeyBub3RpZmljYXRpb246IG5vdGlmaWNhdGlvbi5faWQsIHJlc3VsdDogcmVzdWx0IH0pO1xuXG4gICAgICAgIH0gLy8gRWxzZSBjb3VsZCBub3QgcmVzZXJ2ZVxuICAgICAgfTsgLy8gRU8gc2VuZE5vdGlmaWNhdGlvblxuXG4gICAgICBzZW5kV29ya2VyKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgaWYgKGlzU2VuZGluZ05vdGlmaWNhdGlvbikge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFNldCBzZW5kIGZlbmNlXG4gICAgICAgICAgaXNTZW5kaW5nTm90aWZpY2F0aW9uID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIHZhciBjb3VudFNlbnQgPSAwO1xuICAgICAgICAgIHZhciBiYXRjaFNpemUgPSBvcHRpb25zLnNlbmRCYXRjaFNpemUgfHwgMTtcblxuICAgICAgICAgIHZhciBub3cgPSArbmV3IERhdGUoKTtcblxuICAgICAgICAgIC8vIEZpbmQgbm90aWZpY2F0aW9ucyB0aGF0IGFyZSBub3QgYmVpbmcgb3IgYWxyZWFkeSBzZW50XG4gICAgICAgICAgdmFyIHBlbmRpbmdOb3RpZmljYXRpb25zID0gUHVzaC5ub3RpZmljYXRpb25zLmZpbmQoeyAkYW5kOiBbXG4gICAgICAgICAgICAgICAgLy8gTWVzc2FnZSBpcyBub3Qgc2VudFxuICAgICAgICAgICAgICAgIHsgc2VudCA6IGZhbHNlIH0sXG4gICAgICAgICAgICAgICAgLy8gQW5kIG5vdCBiZWluZyBzZW50IGJ5IG90aGVyIGluc3RhbmNlc1xuICAgICAgICAgICAgICAgIHsgc2VuZGluZzogeyAkbHQ6IG5vdyB9IH0sXG4gICAgICAgICAgICAgICAgLy8gQW5kIG5vdCBxdWV1ZWQgZm9yIGZ1dHVyZVxuICAgICAgICAgICAgICAgIHsgJG9yOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgZGVsYXlVbnRpbDogeyAkZXhpc3RzOiBmYWxzZSB9IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZGVsYXlVbnRpbDogIHsgJGx0ZTogbmV3IERhdGUoKSB9IH1cbiAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdfSwge1xuICAgICAgICAgICAgICAvLyBTb3J0IGJ5IGNyZWF0ZWQgZGF0ZVxuICAgICAgICAgICAgICBzb3J0OiB7IGNyZWF0ZWRBdDogMSB9LFxuICAgICAgICAgICAgICBsaW1pdDogYmF0Y2hTaXplXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIHBlbmRpbmdOb3RpZmljYXRpb25zLmZvckVhY2goZnVuY3Rpb24obm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBzZW5kTm90aWZpY2F0aW9uKG5vdGlmaWNhdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgUHVzaC5Mb2cgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBQdXNoLkxvZygnUHVzaDogQ291bGQgbm90IHNlbmQgbm90aWZpY2F0aW9uIGlkOiBcIicgKyBub3RpZmljYXRpb24uX2lkICsgJ1wiLCBFcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdQdXNoOiBDb3VsZCBub3Qgc2VuZCBub3RpZmljYXRpb24gaWQ6IFwiJyArIG5vdGlmaWNhdGlvbi5faWQgKyAnXCIsIEVycm9yOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTsgLy8gRU8gZm9yRWFjaFxuXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzZW5kIGZlbmNlXG4gICAgICAgICAgaXNTZW5kaW5nTm90aWZpY2F0aW9uID0gZmFsc2U7XG4gICAgICB9LCBvcHRpb25zLnNlbmRJbnRlcnZhbCB8fCAxNTAwMCk7IC8vIERlZmF1bHQgZXZlcnkgMTV0aCBzZWNcblxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoUHVzaC5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmxvZygnUHVzaDogU2VuZCBzZXJ2ZXIgaXMgZGlzYWJsZWQnKTtcbiAgICAgIH1cbiAgICB9XG5cbn07XG4iLCJQdXNoLmFwcENvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignX3JhaXhfcHVzaF9hcHBfdG9rZW5zJyk7XG5QdXNoLmFwcENvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHsgdXNlcklkOiAxIH0pO1xuXG5QdXNoLmFkZExpc3RlbmVyKCd0b2tlbicsIGZ1bmN0aW9uKGN1cnJlbnRUb2tlbiwgdmFsdWUpIHtcbiAgaWYgKHZhbHVlKSB7XG4gICAgLy8gVXBkYXRlIHRoZSB0b2tlbiBmb3IgYXBwXG4gICAgUHVzaC5hcHBDb2xsZWN0aW9uLnVwZGF0ZSh7IHRva2VuOiBjdXJyZW50VG9rZW4gfSwgeyAkc2V0OiB7IHRva2VuOiB2YWx1ZSB9IH0sIHsgbXVsdGk6IHRydWUgfSk7XG4gIH0gZWxzZSBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAvLyBSZW1vdmUgdGhlIHRva2VuIGZvciBhcHBcbiAgICBQdXNoLmFwcENvbGxlY3Rpb24udXBkYXRlKHsgdG9rZW46IGN1cnJlbnRUb2tlbiB9LCB7ICR1bnNldDogeyB0b2tlbjogdHJ1ZSB9IH0sIHsgbXVsdGk6IHRydWUgfSk7XG4gIH1cbn0pO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICdyYWl4OnB1c2gtdXBkYXRlJzogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUHVzaDogR290IHB1c2ggdG9rZW4gZnJvbSBhcHA6Jywgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgY2hlY2sob3B0aW9ucywge1xuICAgICAgaWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICB0b2tlbjogX21hdGNoVG9rZW4sXG4gICAgICBhcHBOYW1lOiBTdHJpbmcsXG4gICAgICB1c2VySWQ6IE1hdGNoLk9uZU9mKFN0cmluZywgbnVsbCksXG4gICAgICBtZXRhZGF0YTogTWF0Y2guT3B0aW9uYWwoT2JqZWN0KVxuICAgIH0pO1xuXG4gICAgLy8gVGhlIGlmIHVzZXIgaWQgaXMgc2V0IHRoZW4gdXNlciBpZCBzaG91bGQgbWF0Y2ggb24gY2xpZW50IGFuZCBjb25uZWN0aW9uXG4gICAgaWYgKG9wdGlvbnMudXNlcklkICYmIG9wdGlvbnMudXNlcklkICE9PSB0aGlzLnVzZXJJZCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsICdGb3JiaWRkZW4gYWNjZXNzJyk7XG4gICAgfVxuXG4gICAgdmFyIGRvYztcblxuICAgIC8vIGxvb2t1cCBhcHAgYnkgaWQgaWYgb25lIHdhcyBpbmNsdWRlZFxuICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICBkb2MgPSBQdXNoLmFwcENvbGxlY3Rpb24uZmluZE9uZSh7X2lkOiBvcHRpb25zLmlkfSk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLnVzZXJJZCkge1xuICAgICAgZG9jID0gUHVzaC5hcHBDb2xsZWN0aW9uLmZpbmRPbmUoe3VzZXJJZDogb3B0aW9ucy51c2VySWR9KTtcbiAgICB9XG5cbiAgICAvLyBObyBkb2Mgd2FzIGZvdW5kIC0gd2UgY2hlY2sgdGhlIGRhdGFiYXNlIHRvIHNlZSBpZlxuICAgIC8vIHdlIGNhbiBmaW5kIGEgbWF0Y2ggZm9yIHRoZSBhcHAgdmlhIHRva2VuIGFuZCBhcHBOYW1lXG4gICAgaWYgKCFkb2MpIHtcbiAgICAgIGRvYyA9IFB1c2guYXBwQ29sbGVjdGlvbi5maW5kT25lKHtcbiAgICAgICAgJGFuZDogW1xuICAgICAgICAgIHsgdG9rZW46IG9wdGlvbnMudG9rZW4gfSwgICAgIC8vIE1hdGNoIHRva2VuXG4gICAgICAgICAgeyBhcHBOYW1lOiBvcHRpb25zLmFwcE5hbWUgfSwgLy8gTWF0Y2ggYXBwTmFtZVxuICAgICAgICAgIHsgdG9rZW46IHsgJGV4aXN0czogdHJ1ZSB9IH0gIC8vIE1ha2Ugc3VyZSB0b2tlbiBleGlzdHNcbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gaWYgd2UgY291bGQgbm90IGZpbmQgdGhlIGlkIG9yIHRva2VuIHRoZW4gY3JlYXRlIGl0XG4gICAgaWYgKCFkb2MpIHtcbiAgICAgIC8vIFJpZyBkZWZhdWx0IGRvY1xuICAgICAgZG9jID0ge1xuICAgICAgICB0b2tlbjogb3B0aW9ucy50b2tlbixcbiAgICAgICAgYXBwTmFtZTogb3B0aW9ucy5hcHBOYW1lLFxuICAgICAgICB1c2VySWQ6IG9wdGlvbnMudXNlcklkLFxuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKVxuICAgICAgfTtcblxuICAgICAgLy8gWFhYOiBXZSBtaWdodCB3YW50IHRvIGNoZWNrIHRoZSBpZCAtIFdoeSBpc250IHRoZXJlIGEgbWF0Y2ggZm9yIGlkXG4gICAgICAvLyBpbiB0aGUgTWV0ZW9yIGNoZWNrLi4uIE5vcm1hbCBsZW5ndGggMTcgKGNvdWxkIGJlIGxhcmdlciksIGFuZFxuICAgICAgLy8gbnVtYmVycytsZXR0ZXJzIGFyZSB1c2VkIGluIFJhbmRvbS5pZCgpIHdpdGggZXhjZXB0aW9uIG9mIDAgYW5kIDFcbiAgICAgIGRvYy5faWQgPSBvcHRpb25zLmlkIHx8IFJhbmRvbS5pZCgpO1xuICAgICAgLy8gVGhlIHVzZXIgd2FudGVkIHVzIHRvIHVzZSBhIHNwZWNpZmljIGlkLCB3ZSBkaWRuJ3QgZmluZCB0aGlzIHdoaWxlXG4gICAgICAvLyBzZWFyY2hpbmcuIFRoZSBjbGllbnQgY291bGQgZGVwZW5kIG9uIHRoZSBpZCBlZy4gYXMgcmVmZXJlbmNlIHNvXG4gICAgICAvLyB3ZSByZXNwZWN0IHRoaXMgYW5kIHRyeSB0byBjcmVhdGUgYSBkb2N1bWVudCB3aXRoIHRoZSBzZWxlY3RlZCBpZDtcbiAgICAgIFB1c2guYXBwQ29sbGVjdGlvbi5fY29sbGVjdGlvbi5pbnNlcnQoZG9jKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgZm91bmQgdGhlIGFwcCBzbyB1cGRhdGUgdGhlIHVwZGF0ZWRBdCBhbmQgc2V0IHRoZSB0b2tlblxuICAgICAgUHVzaC5hcHBDb2xsZWN0aW9uLnVwZGF0ZSh7IF9pZDogZG9jLl9pZCB9LCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgdG9rZW46IG9wdGlvbnMudG9rZW5cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGRvYykge1xuICAgICAgLy8geHh4OiBIYWNrXG4gICAgICAvLyBDbGVhbiB1cCBtZWNoIG1ha2luZyBzdXJlIHRva2VucyBhcmUgdW5pcSAtIGFuZHJvaWQgc29tZXRpbWVzIGdlbmVyYXRlXG4gICAgICAvLyBuZXcgdG9rZW5zIHJlc3VsdGluZyBpbiBkdXBsaWNhdGVzXG4gICAgICB2YXIgcmVtb3ZlZCA9IFB1c2guYXBwQ29sbGVjdGlvbi5yZW1vdmUoe1xuICAgICAgICAkYW5kOiBbXG4gICAgICAgICAgeyBfaWQ6IHsgJG5lOiBkb2MuX2lkIH0gfSxcbiAgICAgICAgICB7IHRva2VuOiBkb2MudG9rZW4gfSwgICAgIC8vIE1hdGNoIHRva2VuXG4gICAgICAgICAgeyBhcHBOYW1lOiBkb2MuYXBwTmFtZSB9LCAvLyBNYXRjaCBhcHBOYW1lXG4gICAgICAgICAgeyB0b2tlbjogeyAkZXhpc3RzOiB0cnVlIH0gfSAgLy8gTWFrZSBzdXJlIHRva2VuIGV4aXN0c1xuICAgICAgICBdXG4gICAgICB9KTtcblxuICAgICAgaWYgKHJlbW92ZWQgJiYgUHVzaC5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlLmxvZygnUHVzaDogUmVtb3ZlZCAnICsgcmVtb3ZlZCArICcgZXhpc3RpbmcgYXBwIGl0ZW1zJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRvYyAmJiBQdXNoLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUHVzaDogdXBkYXRlZCcsIGRvYyk7XG4gICAgfVxuXG4gICAgaWYgKCFkb2MpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCAnc2V0UHVzaFRva2VuIGNvdWxkIG5vdCBjcmVhdGUgcmVjb3JkJyk7XG4gICAgfVxuICAgIC8vIFJldHVybiB0aGUgZG9jIHdlIHdhbnQgdG8gdXNlXG4gICAgcmV0dXJuIGRvYztcbiAgfSxcbiAgJ3JhaXg6cHVzaC1zZXR1c2VyJzogZnVuY3Rpb24oaWQpIHtcbiAgICBjaGVjayhpZCwgU3RyaW5nKTtcblxuICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUHVzaDogU2V0dGluZ3MgdXNlcklkIFwiJyArIHRoaXMudXNlcklkICsgJ1wiIGZvciBhcHA6JywgaWQpO1xuICAgIH1cbiAgICAvLyBXZSB1cGRhdGUgdGhlIGFwcENvbGxlY3Rpb24gaWQgc2V0dGluZyB0aGUgTWV0ZW9yLnVzZXJJZFxuICAgIHZhciBmb3VuZCA9IFB1c2guYXBwQ29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IGlkIH0sIHsgJHNldDogeyB1c2VySWQ6IHRoaXMudXNlcklkIH0gfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIGFwcCBpZCBtaWdodCBub3QgZXhpc3QgYmVjYXVzZSBubyB0b2tlbiBpcyBzZXQgeWV0LlxuICAgIC8vIFdlIGRvIGNyZWF0ZSB0aGUgbmV3IGFwcCBpZCBmb3IgdGhlIHVzZXIgc2luY2Ugd2UgbWlnaHQgc3RvcmUgYWRkaXRpb25hbFxuICAgIC8vIG1ldGFkYXRhIGZvciB0aGUgYXBwIC8gdXNlclxuXG4gICAgLy8gSWYgaWQgbm90IGZvdW5kIHRoZW4gY3JlYXRlIGl0P1xuICAgIC8vIFdlIGRvbnQsIGl0cyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCB0aGUgdXNlciB3YW50cyB0b1xuICAgIC8vIHN0b3JlIG1ldGFkYXRhIG9yIHRva2VuIC0gV2UgY291bGQgZW5kIHVwIHdpdGggdW51c2VkIGRhdGEgaW4gdGhlXG4gICAgLy8gY29sbGVjdGlvbiBhdCBldmVyeSBhcHAgcmUtaW5zdGFsbCAvIHVwZGF0ZVxuICAgIC8vXG4gICAgLy8gVGhlIHVzZXIgY291bGQgc3RvcmUgc29tZSBtZXRhZGF0YSBpbiBhcHBDb2xsZWN0aW4gYnV0IG9ubHkgaWYgdGhleVxuICAgIC8vIGhhdmUgY3JlYXRlZCB0aGUgYXBwIGFuZCBwcm92aWRlZCBhIHRva2VuLlxuICAgIC8vIElmIG5vdCB0aGUgbWV0YWRhdGEgc2hvdWxkIGJlIHNldCB2aWEgZ3JvdW5kOmRiXG5cbiAgICByZXR1cm4gISFmb3VuZDtcbiAgfSxcbiAgJ3JhaXg6cHVzaC1tZXRhZGF0YSc6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBjaGVjayhkYXRhLCB7XG4gICAgICBpZDogU3RyaW5nLFxuICAgICAgbWV0YWRhdGE6IE9iamVjdFxuICAgIH0pO1xuXG4gICAgLy8gU2V0IHRoZSBtZXRhZGF0YVxuICAgIHZhciBmb3VuZCA9IFB1c2guYXBwQ29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IGRhdGEuaWQgfSwgeyAkc2V0OiB7IG1ldGFkYXRhOiBkYXRhLm1ldGFkYXRhIH0gfSk7XG5cbiAgICByZXR1cm4gISFmb3VuZDtcbiAgfSxcbiAgJ3JhaXg6cHVzaC1lbmFibGUnOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgY2hlY2soZGF0YSwge1xuICAgICAgaWQ6IFN0cmluZyxcbiAgICAgIGVuYWJsZWQ6IEJvb2xlYW5cbiAgICB9KTtcblxuICAgIGlmIChQdXNoLmRlYnVnKSB7XG4gICAgICBjb25zb2xlLmxvZygnUHVzaDogU2V0dGluZyBlbmFibGVkIHRvIFwiJyArIGRhdGEuZW5hYmxlZCArICdcIiBmb3IgYXBwOicsIGRhdGEuaWQpO1xuICAgIH1cblxuICAgIHZhciBmb3VuZCA9IFB1c2guYXBwQ29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IGRhdGEuaWQgfSwgeyAkc2V0OiB7IGVuYWJsZWQ6IGRhdGEuZW5hYmxlZCB9IH0pO1xuXG4gICAgcmV0dXJuICEhZm91bmQ7XG4gIH1cbn0pO1xuXG4iXX0=
