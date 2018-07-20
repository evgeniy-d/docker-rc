(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:graphql":{"server":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/settings.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('General', function () {
  this.section('GraphQL API', function () {
    this.add('Graphql_Enabled', false, {
      type: 'boolean',
      public: false
    });
    this.add('Graphql_CORS', true, {
      type: 'boolean',
      public: false,
      enableQuery: {
        _id: 'Graphql_Enabled',
        value: true
      }
    });
    this.add('Graphql_Subscription_Port', 3100, {
      type: 'int',
      public: false,
      enableQuery: {
        _id: 'Graphql_Enabled',
        value: true
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/api.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let graphqlExpress, graphiqlExpress;
module.watch(require("apollo-server-express"), {
  graphqlExpress(v) {
    graphqlExpress = v;
  },

  graphiqlExpress(v) {
    graphiqlExpress = v;
  }

}, 0);
let jsAccountsContext;
module.watch(require("@accounts/graphql-api"), {
  JSAccountsContext(v) {
    jsAccountsContext = v;
  }

}, 1);
let SubscriptionServer;
module.watch(require("subscriptions-transport-ws"), {
  SubscriptionServer(v) {
    SubscriptionServer = v;
  }

}, 2);
let execute, subscribe;
module.watch(require("graphql"), {
  execute(v) {
    execute = v;
  },

  subscribe(v) {
    subscribe = v;
  }

}, 3);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 4);
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 5);
let bodyParser;
module.watch(require("body-parser"), {
  default(v) {
    bodyParser = v;
  }

}, 6);
let express;
module.watch(require("express"), {
  default(v) {
    express = v;
  }

}, 7);
let cors;
module.watch(require("cors"), {
  default(v) {
    cors = v;
  }

}, 8);
let executableSchema;
module.watch(require("./schema"), {
  executableSchema(v) {
    executableSchema = v;
  }

}, 9);
const subscriptionPort = RocketChat.settings.get('Graphql_Subscription_Port') || 3100; // the Meteor GraphQL server is an Express server

const graphQLServer = express();

if (RocketChat.settings.get('Graphql_CORS')) {
  graphQLServer.use(cors());
}

graphQLServer.use('/api/graphql', (req, res, next) => {
  if (RocketChat.settings.get('Graphql_Enabled')) {
    next();
  } else {
    res.status(400).send('Graphql is not enabled in this server');
  }
});
graphQLServer.use('/api/graphql', bodyParser.json(), graphqlExpress(request => {
  return {
    schema: executableSchema,
    context: jsAccountsContext(request),
    formatError: e => ({
      message: e.message,
      locations: e.locations,
      path: e.path
    }),
    debug: Meteor.isDevelopment
  };
}));
graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/api/graphql',
  subscriptionsEndpoint: `ws://localhost:${subscriptionPort}`
}));

const startSubscriptionServer = () => {
  if (RocketChat.settings.get('Graphql_Enabled')) {
    SubscriptionServer.create({
      schema: executableSchema,
      execute,
      subscribe,
      onConnect: connectionParams => ({
        authToken: connectionParams.Authorization
      })
    }, {
      port: subscriptionPort,
      host: process.env.BIND_IP || '0.0.0.0'
    });
    console.log('GraphQL Subscription server runs on port:', subscriptionPort);
  }
};

WebApp.onListening(() => {
  startSubscriptionServer();
}); // this binds the specified paths to the Express server running Apollo + GraphiQL

WebApp.connectHandlers.use(graphQLServer);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"schema.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schema.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  executableSchema: () => executableSchema
});
let makeExecutableSchema;
module.watch(require("graphql-tools"), {
  makeExecutableSchema(v) {
    makeExecutableSchema = v;
  }

}, 0);
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 1);
let channels;
module.watch(require("./resolvers/channels"), {
  "*"(v) {
    channels = v;
  }

}, 2);
let messages;
module.watch(require("./resolvers/messages"), {
  "*"(v) {
    messages = v;
  }

}, 3);
let accounts;
module.watch(require("./resolvers/accounts"), {
  "*"(v) {
    accounts = v;
  }

}, 4);
let users;
module.watch(require("./resolvers/users"), {
  "*"(v) {
    users = v;
  }

}, 5);
const schema = mergeTypes([channels.schema, messages.schema, accounts.schema, users.schema]);
const resolvers = mergeResolvers([channels.resolvers, messages.resolvers, accounts.resolvers, users.resolvers]);
const executableSchema = makeExecutableSchema({
  typeDefs: [schema],
  resolvers,
  logger: {
    log: e => console.log(e)
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/subscriptions.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  pubsub: () => pubsub
});
let PubSub;
module.watch(require("graphql-subscriptions"), {
  PubSub(v) {
    PubSub = v;
  }

}, 0);
const pubsub = new PubSub();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"authenticated.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/helpers/authenticated.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  authenticated: () => authenticated
});
let AccountsServer;
module.watch(require("meteor/rocketchat:accounts"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);

let _authenticated;

module.watch(require("../mocks/accounts/graphql-api"), {
  authenticated(v) {
    _authenticated = v;
  }

}, 1);

const authenticated = resolver => {
  return _authenticated(AccountsServer, resolver);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dateToFloat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/helpers/dateToFloat.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  dateToFloat: () => dateToFloat
});

function dateToFloat(date) {
  if (date) {
    return new Date(date).getTime();
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"mocks":{"accounts":{"graphql-api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/mocks/accounts/graphql-api.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  authenticated: () => authenticated
});

const authenticated = (Accounts, func) => (root, args, context, info) => Promise.asyncApply(() => {
  const authToken = context.authToken;

  if (!authToken || authToken === '' || authToken === null) {
    throw new Error('Unable to find authorization token in request');
  }

  const userObject = Promise.await(Accounts.resumeSession(authToken));

  if (userObject === null) {
    throw new Error('Invalid or expired token!');
  }

  return Promise.await(func(root, args, Object.assign(context, {
    user: userObject
  }), info));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"resolvers":{"accounts":{"OauthProvider-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/accounts/OauthProvider-type.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/accounts/OauthProvider-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/accounts/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let createJSAccountsGraphQL;
module.watch(require("@accounts/graphql-api"), {
  createJSAccountsGraphQL(v) {
    createJSAccountsGraphQL = v;
  }

}, 0);
let AccountsServer;
module.watch(require("meteor/rocketchat:accounts"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 1);
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 2);
let oauthProviders;
module.watch(require("./oauthProviders"), {
  "*"(v) {
    oauthProviders = v;
  }

}, 3);
let OauthProviderType;
module.watch(require("./OauthProvider-type"), {
  "*"(v) {
    OauthProviderType = v;
  }

}, 4);
const accountsGraphQL = createJSAccountsGraphQL(AccountsServer);
const schema = mergeTypes([accountsGraphQL.schema, oauthProviders.schema, OauthProviderType.schema]);
const resolvers = mergeResolvers([accountsGraphQL.extendWithResolvers({}), oauthProviders.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauthProviders.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/accounts/oauthProviders.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let HTTP;
module.watch(require("meteor/http"), {
  HTTP(v) {
    HTTP = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/accounts/oauthProviders.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);

function isJSON(obj) {
  try {
    JSON.parse(obj);
    return true;
  } catch (e) {
    return false;
  }
}

const resolver = {
  Query: {
    oauthProviders: () => Promise.asyncApply(() => {
      // depends on rocketchat:grant package
      try {
        const result = HTTP.get(Meteor.absoluteUrl('_oauth_apps/providers')).content;

        if (isJSON(result)) {
          const providers = JSON.parse(result).data;
          return providers.map(name => ({
            name
          }));
        } else {
          throw new Error('Could not parse the result');
        }
      } catch (e) {
        throw new Error('rocketchat:grant not installed');
      }
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"channels":{"Channel-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/Channel-type.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let property;
module.watch(require("lodash.property"), {
  default(v) {
    property = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/channels/Channel-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Channel: {
    id: property('_id'),
    name: (root, args, {
      user
    }) => {
      if (root.t === 'd') {
        return root.usernames.find(u => u !== user.username);
      }

      return root.name;
    },
    members: root => {
      const ids = RocketChat.models.Subscriptions.findByRoomIdWhenUserIdExists(root._id, {
        fields: {
          'u._id': 1
        }
      }).fetch().map(sub => sub.u._id);
      return RocketChat.models.Users.findByIds(ids).fetch();
    },
    owners: root => {
      // there might be no owner
      if (!root.u) {
        return;
      }

      return [RocketChat.models.Users.findOneByUsername(root.u.username)];
    },
    numberOfMembers: root => {
      return RocketChat.models.Subscriptions.findByRoomId(root._id).count();
    },
    numberOfMessages: property('msgs'),
    readOnly: root => root.ro === true,
    direct: root => root.t === 'd',
    privateChannel: root => root.t === 'p',
    favourite: (root, args, {
      user
    }) => {
      const room = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);
      return room && room.f === true;
    },
    unseenMessages: (root, args, {
      user
    }) => {
      const room = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);
      return (room || {}).unread;
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelFilter-input.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/ChannelFilter-input.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/ChannelFilter-input.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelNameAndDirect-input.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/ChannelNameAndDirect-input.js                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/ChannelNameAndDirect-input.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelSort-enum.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/ChannelSort-enum.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/ChannelSort-enum.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Privacy-enum.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/Privacy-enum.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/Privacy-enum.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelByName.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/channelByName.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/channelByName.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    channelByName: authenticated((root, {
      name
    }) => {
      const query = {
        name,
        t: 'c'
      };
      return RocketChat.models.Rooms.findOne(query, {
        fields: roomPublicFields
      });
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/channels.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/channels.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    channels: authenticated((root, args) => {
      const query = {};
      const options = {
        sort: {
          name: 1
        },
        fields: roomPublicFields
      }; // Filter

      if (typeof args.filter !== 'undefined') {
        // nameFilter
        if (typeof args.filter.nameFilter !== undefined) {
          query.name = {
            $regex: new RegExp(args.filter.nameFilter, 'i')
          };
        } // sortBy


        if (args.filter.sortBy === 'NUMBER_OF_MESSAGES') {
          options.sort = {
            msgs: -1
          };
        } // privacy


        switch (args.filter.privacy) {
          case 'PRIVATE':
            query.t = 'p';
            break;

          case 'PUBLIC':
            query.t = {
              $ne: 'p'
            };
            break;
        }
      }

      return RocketChat.models.Rooms.find(query, options).fetch();
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsByUser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/channelsByUser.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/channelsByUser.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    channelsByUser: authenticated((root, {
      userId
    }) => {
      const user = RocketChat.models.Users.findOneById(userId);

      if (!user) {
        throw new Error('No user');
      }

      const roomIds = RocketChat.models.Subscriptions.findByUserId(userId, {
        fields: {
          rid: 1
        }
      }).fetch().map(s => s.rid);
      const rooms = RocketChat.models.Rooms.findByIds(roomIds, {
        sort: {
          name: 1
        },
        fields: roomPublicFields
      }).fetch();
      return rooms;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/createChannel.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/channels/createChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Mutation: {
    createChannel: authenticated((root, args, {
      user
    }) => {
      try {
        RocketChat.API.channels.create.validate({
          user: {
            value: user._id
          },
          name: {
            value: args.name,
            key: 'name'
          },
          members: {
            value: args.membersId,
            key: 'membersId'
          }
        });
      } catch (e) {
        throw e;
      }

      const {
        channel
      } = RocketChat.API.channels.create.execute(user._id, {
        name: args.name,
        members: args.membersId
      });
      return channel;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"directChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/directChannel.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/directChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    directChannel: authenticated((root, {
      username,
      channelId
    }, {
      user
    }) => {
      const query = {
        t: 'd',
        usernames: user.username
      };

      if (typeof username !== 'undefined') {
        if (username === user.username) {
          throw new Error('You cannot specify your username');
        }

        query.usernames = {
          $all: [user.username, username]
        };
      } else if (typeof channelId !== 'undefined') {
        query.id = channelId;
      } else {
        throw new Error('Use one of those fields: username, channelId');
      }

      return RocketChat.models.Rooms.findOne(query, {
        fields: roomPublicFields
      });
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/hideChannel.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/hideChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    hideChannel: authenticated((root, args, {
      user
    }) => {
      const channel = RocketChat.models.Rooms.findOne({
        _id: args.channelId,
        t: 'c'
      });

      if (!channel) {
        throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
      }

      const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(channel._id, user._id);

      if (!sub) {
        throw new Error(`The user/callee is not in the channel "${channel.name}.`);
      }

      if (!sub.open) {
        throw new Error(`The channel, ${channel.name}, is already closed to the sender`);
      }

      Meteor.runAsUser(user._id, () => {
        Meteor.call('hideRoom', channel._id);
      });
      return true;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 0);
let channels;
module.watch(require("./channels"), {
  "*"(v) {
    channels = v;
  }

}, 1);
let channelByName;
module.watch(require("./channelByName"), {
  "*"(v) {
    channelByName = v;
  }

}, 2);
let directChannel;
module.watch(require("./directChannel"), {
  "*"(v) {
    directChannel = v;
  }

}, 3);
let channelsByUser;
module.watch(require("./channelsByUser"), {
  "*"(v) {
    channelsByUser = v;
  }

}, 4);
let createChannel;
module.watch(require("./createChannel"), {
  "*"(v) {
    createChannel = v;
  }

}, 5);
let leaveChannel;
module.watch(require("./leaveChannel"), {
  "*"(v) {
    leaveChannel = v;
  }

}, 6);
let hideChannel;
module.watch(require("./hideChannel"), {
  "*"(v) {
    hideChannel = v;
  }

}, 7);
let ChannelType;
module.watch(require("./Channel-type"), {
  "*"(v) {
    ChannelType = v;
  }

}, 8);
let ChannelSort;
module.watch(require("./ChannelSort-enum"), {
  "*"(v) {
    ChannelSort = v;
  }

}, 9);
let ChannelFilter;
module.watch(require("./ChannelFilter-input"), {
  "*"(v) {
    ChannelFilter = v;
  }

}, 10);
let Privacy;
module.watch(require("./Privacy-enum"), {
  "*"(v) {
    Privacy = v;
  }

}, 11);
let ChannelNameAndDirect;
module.watch(require("./ChannelNameAndDirect-input"), {
  "*"(v) {
    ChannelNameAndDirect = v;
  }

}, 12);
const schema = mergeTypes([// queries
channels.schema, channelByName.schema, directChannel.schema, channelsByUser.schema, // mutations
createChannel.schema, leaveChannel.schema, hideChannel.schema, // types
ChannelType.schema, ChannelSort.schema, ChannelFilter.schema, Privacy.schema, ChannelNameAndDirect.schema]);
const resolvers = mergeResolvers([// queries
channels.resolver, channelByName.resolver, directChannel.resolver, channelsByUser.resolver, // mutations
createChannel.resolver, leaveChannel.resolver, hideChannel.resolver, // types
ChannelType.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/leaveChannel.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/leaveChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    leaveChannel: authenticated((root, args, {
      user
    }) => {
      const channel = RocketChat.models.Rooms.findOne({
        _id: args.channelId,
        t: 'c'
      });

      if (!channel) {
        throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
      }

      Meteor.runAsUser(user._id, () => {
        Meteor.call('leaveRoom', channel._id);
      });
      return true;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/settings.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  roomPublicFields: () => roomPublicFields
});
const roomPublicFields = {
  t: 1,
  name: 1,
  description: 1,
  announcement: 1,
  topic: 1,
  usernames: 1,
  msgs: 1,
  ro: 1,
  u: 1,
  archived: 1
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"messages":{"Message-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/Message-type.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let property;
module.watch(require("lodash.property"), {
  default(v) {
    property = v;
  }

}, 1);
let dateToFloat;
module.watch(require("../../helpers/dateToFloat"), {
  dateToFloat(v) {
    dateToFloat = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/Message-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Message: {
    id: property('_id'),
    content: property('msg'),
    creationTime: root => dateToFloat(root.ts),
    author: root => {
      const user = RocketChat.models.Users.findOne(root.u._id);
      return user || root.u;
    },
    channel: root => {
      return RocketChat.models.Rooms.findOne(root.rid);
    },
    fromServer: root => typeof root.t !== 'undefined',
    // on a message sent by user `true` otherwise `false`
    type: property('t'),
    channelRef: root => {
      if (!root.channels) {
        return;
      }

      return RocketChat.models.Rooms.find({
        _id: {
          $in: root.channels.map(c => c._id)
        }
      }, {
        sort: {
          name: 1
        }
      }).fetch();
    },
    userRef: root => {
      if (!root.mentions) {
        return;
      }

      return RocketChat.models.Users.find({
        _id: {
          $in: root.mentions.map(c => c._id)
        }
      }, {
        sort: {
          username: 1
        }
      }).fetch();
    },
    reactions: root => {
      if (!root.reactions || Object.keys(root.reactions).length === 0) {
        return;
      }

      const reactions = [];
      Object.keys(root.reactions).forEach(icon => {
        root.reactions[icon].usernames.forEach(username => {
          reactions.push({
            icon,
            username
          });
        });
      });
      return reactions;
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageIdentifier-input.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/MessageIdentifier-input.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/messages/MessageIdentifier-input.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessagesWithCursor-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/MessagesWithCursor-type.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/messages/MessagesWithCursor-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reaction-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/Reaction-type.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/messages/Reaction-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addReactionToMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/addReactionToMessage.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/addReactionToMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    addReactionToMessage: authenticated((root, {
      id,
      icon
    }, {
      user
    }) => {
      return new Promise(resolve => {
        Meteor.runAsUser(user._id, () => {
          Meteor.call('setReaction', id.messageId, icon, () => {
            resolve(RocketChat.models.Messages.findOne(id.messageId));
          });
        });
      });
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chatMessageAdded.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/chatMessageAdded.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CHAT_MESSAGE_SUBSCRIPTION_TOPIC: () => CHAT_MESSAGE_SUBSCRIPTION_TOPIC,
  publishMessage: () => publishMessage,
  schema: () => schema,
  resolver: () => resolver
});
let withFilter;
module.watch(require("graphql-subscriptions"), {
  withFilter(v) {
    withFilter = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let pubsub;
module.watch(require("../../subscriptions"), {
  pubsub(v) {
    pubsub = v;
  }

}, 2);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 3);
let schema;
module.watch(require("../../schemas/messages/chatMessageAdded.graphqls"), {
  default(v) {
    schema = v;
  }

}, 4);
const CHAT_MESSAGE_SUBSCRIPTION_TOPIC = 'CHAT_MESSAGE_ADDED';

function publishMessage(message) {
  pubsub.publish(CHAT_MESSAGE_SUBSCRIPTION_TOPIC, {
    chatMessageAdded: message
  });
}

function shouldPublish(message, {
  id,
  directTo
}, username) {
  if (id) {
    return message.rid === id;
  } else if (directTo) {
    const room = RocketChat.models.Rooms.findOne({
      usernames: {
        $all: [directTo, username]
      },
      t: 'd'
    });
    return room && room._id === message.rid;
  }

  return false;
}

const resolver = {
  Subscription: {
    chatMessageAdded: {
      subscribe: withFilter(() => pubsub.asyncIterator(CHAT_MESSAGE_SUBSCRIPTION_TOPIC), authenticated((payload, args, {
        user
      }) => {
        const channel = {
          id: args.channelId,
          directTo: args.directTo
        };
        return shouldPublish(payload.chatMessageAdded, channel, user.username);
      }))
    }
  }
};
RocketChat.callbacks.add('afterSaveMessage', message => {
  publishMessage(message);
}, null, 'chatMessageAddedSubscription');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/deleteMessage.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/deleteMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    deleteMessage: authenticated((root, {
      id
    }, {
      user
    }) => {
      const msg = RocketChat.models.Messages.findOneById(id.messageId, {
        fields: {
          u: 1,
          rid: 1
        }
      });

      if (!msg) {
        throw new Error(`No message found with the id of "${id.messageId}".`);
      }

      if (id.channelId !== msg.rid) {
        throw new Error('The room id provided does not match where the message is from.');
      }

      Meteor.runAsUser(user._id, () => {
        Meteor.call('deleteMessage', {
          _id: msg._id
        });
      });
      return msg;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/editMessage.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/editMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    editMessage: authenticated((root, {
      id,
      content
    }, {
      user
    }) => {
      const msg = RocketChat.models.Messages.findOneById(id.messageId); //Ensure the message exists

      if (!msg) {
        throw new Error(`No message found with the id of "${id.messageId}".`);
      }

      if (id.channelId !== msg.rid) {
        throw new Error('The channel id provided does not match where the message is from.');
      } //Permission checks are already done in the updateMessage method, so no need to duplicate them


      Meteor.runAsUser(user._id, () => {
        Meteor.call('updateMessage', {
          _id: msg._id,
          msg: content,
          rid: msg.rid
        });
      });
      return RocketChat.models.Messages.findOneById(msg._id);
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 0);
let messages;
module.watch(require("./messages"), {
  "*"(v) {
    messages = v;
  }

}, 1);
let sendMessage;
module.watch(require("./sendMessage"), {
  "*"(v) {
    sendMessage = v;
  }

}, 2);
let editMessage;
module.watch(require("./editMessage"), {
  "*"(v) {
    editMessage = v;
  }

}, 3);
let deleteMessage;
module.watch(require("./deleteMessage"), {
  "*"(v) {
    deleteMessage = v;
  }

}, 4);
let addReactionToMessage;
module.watch(require("./addReactionToMessage"), {
  "*"(v) {
    addReactionToMessage = v;
  }

}, 5);
let chatMessageAdded;
module.watch(require("./chatMessageAdded"), {
  "*"(v) {
    chatMessageAdded = v;
  }

}, 6);
let MessageType;
module.watch(require("./Message-type"), {
  "*"(v) {
    MessageType = v;
  }

}, 7);
let MessagesWithCursorType;
module.watch(require("./MessagesWithCursor-type"), {
  "*"(v) {
    MessagesWithCursorType = v;
  }

}, 8);
let MessageIdentifier;
module.watch(require("./MessageIdentifier-input"), {
  "*"(v) {
    MessageIdentifier = v;
  }

}, 9);
let ReactionType;
module.watch(require("./Reaction-type"), {
  "*"(v) {
    ReactionType = v;
  }

}, 10);
const schema = mergeTypes([// queries
messages.schema, // mutations
sendMessage.schema, editMessage.schema, deleteMessage.schema, addReactionToMessage.schema, // subscriptions
chatMessageAdded.schema, // types
MessageType.schema, MessagesWithCursorType.schema, MessageIdentifier.schema, ReactionType.schema]);
const resolvers = mergeResolvers([// queries
messages.resolver, // mutations
sendMessage.resolver, editMessage.resolver, deleteMessage.resolver, addReactionToMessage.resolver, // subscriptions
chatMessageAdded.resolver, // types
MessageType.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/messages.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/messages/messages.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Query: {
    messages: authenticated((root, args, {
      user
    }) => {
      const messagesQuery = {};
      const messagesOptions = {
        sort: {
          ts: -1
        }
      };
      const channelQuery = {};
      const isPagination = !!args.cursor || args.count > 0;
      let cursor;

      if (args.channelId) {
        // channelId
        channelQuery._id = args.channelId;
      } else if (args.directTo) {
        // direct message where directTo is a user id
        channelQuery.t = 'd';
        channelQuery.usernames = {
          $all: [args.directTo, user.username]
        };
      } else if (args.channelName) {
        // non-direct channel
        channelQuery.t = {
          $ne: 'd'
        };
        channelQuery.name = args.channelName;
      } else {
        console.error('messages query must be called with channelId or directTo');
        return null;
      }

      const channel = RocketChat.models.Rooms.findOne(channelQuery);
      let messagesArray = [];

      if (channel) {
        // cursor
        if (isPagination && args.cursor) {
          const cursorMsg = RocketChat.models.Messages.findOne(args.cursor, {
            fields: {
              ts: 1
            }
          });
          messagesQuery.ts = {
            $lt: cursorMsg.ts
          };
        } // search


        if (typeof args.searchRegex === 'string') {
          messagesQuery.msg = {
            $regex: new RegExp(args.searchRegex, 'i')
          };
        } // count


        if (isPagination && args.count) {
          messagesOptions.limit = args.count;
        } // exclude messages generated by server


        if (args.excludeServer === true) {
          messagesQuery.t = {
            $exists: false
          };
        } // look for messages that belongs to specific channel


        messagesQuery.rid = channel._id;
        const messages = RocketChat.models.Messages.find(messagesQuery, messagesOptions);
        messagesArray = messages.fetch();

        if (isPagination) {
          // oldest first (because of findOne)
          messagesOptions.sort.ts = 1;
          const firstMessage = RocketChat.models.Messages.findOne(messagesQuery, messagesOptions);
          const lastId = (messagesArray[messagesArray.length - 1] || {})._id;
          cursor = !lastId || lastId === firstMessage._id ? null : lastId;
        }
      }

      return {
        cursor,
        channel,
        messagesArray
      };
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/sendMessage.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 0);
let schema;
module.watch(require("../../schemas/messages/sendMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 1);
const resolver = {
  Mutation: {
    sendMessage: authenticated((root, {
      channelId,
      directTo,
      content
    }, {
      user
    }) => {
      const options = {
        text: content,
        channel: channelId || directTo
      };
      const messageReturn = processWebhookMessage(options, user)[0];

      if (!messageReturn) {
        throw new Error('Unknown error');
      }

      return messageReturn.message;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"User-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/User-type.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let property;
module.watch(require("lodash.property"), {
  default(v) {
    property = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/users/User-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  User: {
    id: property('_id'),
    status: ({
      status
    }) => status.toUpperCase(),
    avatar: ({
      _id
    }) => Promise.asyncApply(() => {
      // XXX js-accounts/graphql#16
      const avatar = Promise.await(RocketChat.models.Avatars.model.rawCollection().findOne({
        userId: _id
      }, {
        fields: {
          url: 1
        }
      }));

      if (avatar) {
        return avatar.url;
      }
    }),
    channels: Meteor.bindEnvironment(({
      _id
    }) => Promise.asyncApply(() => {
      return Promise.await(RocketChat.models.Rooms.findBySubscriptionUserId(_id).fetch());
    })),
    directMessages: ({
      username
    }) => {
      return RocketChat.models.Rooms.findDirectRoomContainingUsername(username).fetch();
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserStatus-enum.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/UserStatus-enum.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/users/UserStatus-enum.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/index.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 0);
let setStatus;
module.watch(require("./setStatus"), {
  "*"(v) {
    setStatus = v;
  }

}, 1);
let UserType;
module.watch(require("./User-type"), {
  "*"(v) {
    UserType = v;
  }

}, 2);
let UserStatus;
module.watch(require("./UserStatus-enum"), {
  "*"(v) {
    UserStatus = v;
  }

}, 3);
const schema = mergeTypes([// mutations
setStatus.schema, // types
UserType.schema, UserStatus.schema]);
const resolvers = mergeResolvers([// mutations
setStatus.resolver, // types
UserType.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setStatus.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/setStatus.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/users/setStatus.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Mutation: {
    setStatus: authenticated((root, {
      status
    }, {
      user
    }) => {
      RocketChat.models.Users.update(user._id, {
        $set: {
          status: status.toLowerCase()
        }
      });
      return RocketChat.models.Users.findOne(user._id);
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"schemas":{"accounts":{"OauthProvider-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/accounts/OauthProvider-type.graphqls                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./OauthProvider-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OauthProvider-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/accounts/OauthProvider-type.graphqls.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"OauthProvider"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]}]}],"loc":{"start":0,"end":39}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauthProviders.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/accounts/oauthProviders.graphqls                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./oauthProviders.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauthProviders.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/accounts/oauthProviders.graphqls.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"oauthProviders"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OauthProvider"}}},"directives":[]}]}],"loc":{"start":0,"end":49}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"channels":{"Channel-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/Channel-type.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Channel-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Channel-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/Channel-type.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Channel"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"id"},"arguments":[],"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"description"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"announcement"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"topic"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"members"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"owners"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"numberOfMembers"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"numberOfMessages"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"readOnly"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"direct"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"privateChannel"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"favourite"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"unseenMessages"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]}]}],"loc":{"start":0,"end":283}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelFilter-input.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/ChannelFilter-input.graphqls                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./ChannelFilter-input.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelFilter-input.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/ChannelFilter-input.graphqls.js                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"InputObjectTypeDefinition","name":{"kind":"Name","value":"ChannelFilter"},"directives":[],"fields":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"nameFilter"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"privacy"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Privacy"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"joinedChannels"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"sortBy"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelSort"}},"defaultValue":null,"directives":[]}]}],"loc":{"start":0,"end":108}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelNameAndDirect-input.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/ChannelNameAndDirect-input.graphqls                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./ChannelNameAndDirect-input.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelNameAndDirect-input.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/ChannelNameAndDirect-input.graphqls.js                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"InputObjectTypeDefinition","name":{"kind":"Name","value":"ChannelNameAndDirect"},"directives":[],"fields":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"direct"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},"defaultValue":null,"directives":[]}]}],"loc":{"start":0,"end":64}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelSort-enum.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/ChannelSort-enum.graphqls                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./ChannelSort-enum.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelSort-enum.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/ChannelSort-enum.graphqls.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"EnumTypeDefinition","name":{"kind":"Name","value":"ChannelSort"},"directives":[],"values":[{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"NAME"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"NUMBER_OF_MESSAGES"},"directives":[]}]}],"loc":{"start":0,"end":47}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Privacy-enum.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/Privacy-enum.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Privacy-enum.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Privacy-enum.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/Privacy-enum.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"EnumTypeDefinition","name":{"kind":"Name","value":"Privacy"},"directives":[],"values":[{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"PRIVATE"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"PUBLIC"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"ALL"},"directives":[]}]}],"loc":{"start":0,"end":39}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelByName.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/channelByName.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./channelByName.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelByName.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/channelByName.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"channelByName"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]}]}],"loc":{"start":0,"end":54}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channels.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/channels.graphqls                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./channels.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channels.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/channels.graphqls.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"channels"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"filter"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelFilter"}},"defaultValue":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"privacy"},"value":{"kind":"EnumValue","value":"ALL"}},{"kind":"ObjectField","name":{"kind":"Name","value":"joinedChannels"},"value":{"kind":"BooleanValue","value":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"sortBy"},"value":{"kind":"EnumValue","value":"NAME"}}]},"directives":[]}],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]}]}],"loc":{"start":0,"end":122}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsByUser.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/channelsByUser.graphqls                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./channelsByUser.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsByUser.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/channelsByUser.graphqls.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"channelsByUser"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"userId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]}]}],"loc":{"start":0,"end":59}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/createChannel.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./createChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/createChannel.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"createChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"private"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false},"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"readOnly"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false},"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"membersId"},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]}]}],"loc":{"start":0,"end":143}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"directChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/directChannel.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./directChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"directChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/directChannel.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"directChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"username"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]}]}],"loc":{"start":0,"end":76}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/hideChannel.graphqls                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./hideChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/hideChannel.graphqls.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"hideChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]}]}],"loc":{"start":0,"end":60}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/leaveChannel.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./leaveChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/leaveChannel.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"leaveChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]}]}],"loc":{"start":0,"end":61}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"messages":{"Message-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/Message-type.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Message-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Message-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/Message-type.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Message"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"id"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"author"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"content"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channel"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"creationTime"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"fromServer"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"type"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"userRef"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channelRef"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"reactions"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Reaction"}}},"directives":[]}]}],"loc":{"start":0,"end":305}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageIdentifier-input.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/MessageIdentifier-input.graphqls                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./MessageIdentifier-input.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageIdentifier-input.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/MessageIdentifier-input.graphqls.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"InputObjectTypeDefinition","name":{"kind":"Name","value":"MessageIdentifier"},"directives":[],"fields":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"messageId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}]}],"loc":{"start":0,"end":68}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessagesWithCursor-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/MessagesWithCursor-type.graphqls                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./MessagesWithCursor-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessagesWithCursor-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/MessagesWithCursor-type.graphqls.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"MessagesWithCursor"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"cursor"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channel"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"messagesArray"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}}},"directives":[]}]}],"loc":{"start":0,"end":88}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reaction-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/Reaction-type.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Reaction-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reaction-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/Reaction-type.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Reaction"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"username"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"icon"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}]}],"loc":{"start":0,"end":50}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addReactionToMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/addReactionToMessage.graphqls                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./addReactionToMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addReactionToMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/addReactionToMessage.graphqls.js                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"addReactionToMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageIdentifier"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"icon"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":88}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chatMessageAdded.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/chatMessageAdded.graphqls                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./chatMessageAdded.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chatMessageAdded.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/chatMessageAdded.graphqls.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Subscription"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"chatMessageAdded"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"directTo"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":87}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/deleteMessage.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./deleteMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/deleteMessage.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"deleteMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageIdentifier"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":66}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/editMessage.graphqls                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./editMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/editMessage.graphqls.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"editMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageIdentifier"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"content"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":82}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/messages.graphqls                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./messages.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/messages.graphqls.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelName"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"directTo"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"cursor"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"count"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"searchRegex"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"excludeServer"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"MessagesWithCursor"}},"directives":[]}]}],"loc":{"start":0,"end":193}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/sendMessage.graphqls                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./sendMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/sendMessage.graphqls.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"directTo"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"content"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":95}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"User-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/users/User-type.graphqls                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./User-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"User-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/users/User-type.graphqls.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"TypeExtensionDefinition","definition":{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"User"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"status"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserStatus"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"avatar"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"lastLogin"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channels"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"directMessages"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]}]}}],"loc":{"start":0,"end":138}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserStatus-enum.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/users/UserStatus-enum.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./UserStatus-enum.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserStatus-enum.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/users/UserStatus-enum.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"EnumTypeDefinition","name":{"kind":"Name","value":"UserStatus"},"directives":[],"values":[{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"ONLINE"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"AWAY"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"BUSY"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"INVISIBLE"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"OFFLINE"},"directives":[]}]}],"loc":{"start":0,"end":60}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setStatus.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/users/setStatus.graphqls                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./setStatus.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setStatus.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/users/setStatus.graphqls.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"setStatus"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"status"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserStatus"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[]}]}],"loc":{"start":0,"end":56}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"apollo-server-express":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/apollo-server-express/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "apollo-server-express";
exports.version = "1.1.2";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/apollo-server-express/dist/index.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var expressApollo_1 = require("./expressApollo");
exports.graphqlExpress = expressApollo_1.graphqlExpress;
exports.graphiqlExpress = expressApollo_1.graphiqlExpress;
var connectApollo_1 = require("./connectApollo");
exports.graphqlConnect = connectApollo_1.graphqlConnect;
exports.graphiqlConnect = connectApollo_1.graphiqlConnect;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"@accounts":{"graphql-api":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/@accounts/graphql-api/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "@accounts/graphql-api";
exports.version = "0.1.1";
exports.main = "lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/@accounts/graphql-api/lib/index.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("babel-runtime/helpers/asyncToGenerator"),require("babel-runtime/regenerator"),require("babel-runtime/core-js/object/assign"),require("babel-runtime/helpers/defineProperty"),require("babel-runtime/helpers/extends")):"function"==typeof define&&define.amd?define(["babel-runtime/helpers/asyncToGenerator","babel-runtime/regenerator","babel-runtime/core-js/object/assign","babel-runtime/helpers/defineProperty","babel-runtime/helpers/extends"],t):"object"==typeof exports?exports["@accounts/graphql-api"]=t(require("babel-runtime/helpers/asyncToGenerator"),require("babel-runtime/regenerator"),require("babel-runtime/core-js/object/assign"),require("babel-runtime/helpers/defineProperty"),require("babel-runtime/helpers/extends")):e["@accounts/graphql-api"]=t(e["babel-runtime/helpers/asyncToGenerator"],e["babel-runtime/regenerator"],e["babel-runtime/core-js/object/assign"],e["babel-runtime/helpers/defineProperty"],e["babel-runtime/helpers/extends"])}(this,function(e,t,r,n,u){return function(e){function t(n){if(r[n])return r[n].exports;var u=r[n]={exports:{},id:n,loaded:!1};return e[n].call(u.exports,u,u.exports,t),u.loaded=!0,u.exports}var r={};return t.m=e,t.c=r,t.p="",t(0)}([function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.JSAccountsContext=t.authenticated=t.createJSAccountsGraphQL=void 0;var n=r(19),u=r(3),o=r(20);t.createJSAccountsGraphQL=n.createJSAccountsGraphQL,t.authenticated=u.authenticated,t.JSAccountsContext=o.JSAccountsContext},function(e,t){e.exports=require("babel-runtime/helpers/asyncToGenerator")},function(e,t){e.exports=require("babel-runtime/regenerator")},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.authenticated=void 0;var u=r(2),o=n(u),a=r(4),s=n(a),i=r(1),c=n(i);t.authenticated=function(e,t){return function(){var r=(0,c.default)(o.default.mark(function r(n,u,a,i){var c,d;return o.default.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:if(c=a.authToken,c&&""!==c&&null!==c){r.next=3;break}throw new Error("Unable to find authorization token in request");case 3:return r.next=5,e.resumeSession(c);case 5:if(d=r.sent,null!==d){r.next=8;break}throw new Error("Invalid or expired token!");case 8:return r.next=10,t(n,u,(0,s.default)(a,{user:d}),i);case 10:return r.abrupt("return",r.sent);case 11:case"end":return r.stop()}},r,void 0)}));return function(e,t,n,u){return r.apply(this,arguments)}}()}},function(e,t){e.exports=require("babel-runtime/core-js/object/assign")},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.mutations="\n  loginWithPassword(user: UserInput!, password: String!): LoginReturn\n  refreshTokens(accessToken: String!, refreshToken: String!): LoginReturn\n  logout(accessToken: String!): Boolean\n  impersonate(accessToken: String! username: String!): ImpersonateReturn\n  createUser(user: CreateUserInput!): Boolean\n  verifyEmail(token: String!): Boolean\n  resetPassword(token: String!, newPassword: PasswordInput!): Boolean\n  sendVerificationEmail(email: String!): Boolean\n  sendResetPasswordEmail(email: String!): Boolean\n"},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.queries="\n  me: User\n"},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.typeDefs="\n  type Tokens {\n    refreshToken: String\n    accessToken: String\n  }\n  \n  type LoginReturn {\n    sessionId: String\n    user: User\n    tokens: Tokens\n  }\n  \n  type ImpersonateReturn {\n    authorized: Boolean\n    tokens: Tokens\n    user: User\n  }\n\n  type User {\n    id: ID!\n    email: String\n    username: String\n  }\n  \n  input UserInput {\n    id: ID\n    email: String\n    username: String\n  }\n  \n  input CreateUserInput {\n    username: String\n    email: String\n    password: String\n    profile: CreateUserProfileInput\n  }\n  \n  type PasswordType {\n    digest: String\n    algorithm: String\n  }\n  \n  input PasswordInput {\n    digest: String\n    algorithm: String\n  }\n  \n  input CreateUserProfileInput {\n    name: String\n    firstName: String\n    lastName: String\n  }\n"},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.createUser=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.createUser=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.user;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.createUser(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.impersonate=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.impersonate=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.accessToken,a=n.username;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.impersonate(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.loginWithPassword=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.loginWithPassword=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.user,a=n.password;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.loginWithPassword(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.logout=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.logout=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.accessToken;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.logout(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.me=void 0;var n=r(3);t.me=function(e){return(0,n.authenticated)(e,function(e,t,r){var n=r.user;return n})}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.refreshTokens=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.refreshTokens=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.accessToken,a=n.refreshToken;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.refreshTokens(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.resetPassword=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.resetPassword=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.token,a=n.newPassword;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.resetPassword(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.sendResetPasswordEmail=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.sendResetPasswordEmail=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.email;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.sendResetPasswordEmail(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.sendVerificationEmail=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.sendVerificationEmail=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.email;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.sendVerificationEmail(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.User={id:function(e){return e.id||e._id},email:function(e){return e.emails[0].address}}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.verifyEmail=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.verifyEmail=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.token;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.verifyEmail(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.createJSAccountsGraphQL=void 0;var u=r(4),o=n(u),a=r(22),s=n(a),i=r(21),c=n(i),d=r(10),f=r(13),l=r(9),p=r(12),m=r(17),v=r(5),b=r(7),h=r(6),y=r(11),g=r(8),_=r(14),w=r(15),x=r(16),P=r(18);t.createJSAccountsGraphQL=function(e){var t,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{rootQueryName:"Query",rootMutationName:"Mutation",extend:!0,withSchemaDefinition:!1},n="\n  "+b.typeDefs+"\n\n  "+(r.extend?"extend ":"")+"type "+r.rootQueryName+" {\n    "+h.queries+"\n  }\n\n  "+(r.extend?"extend ":"")+"type "+r.rootMutationName+" {\n    "+v.mutations+"\n  }\n\n  "+(r.withSchemaDefinition?"schema {\n    query: "+r.rootMutationName+"\n    mutation: "+r.rootQueryName+"\n  }":"")+"\n  ",u=(t={User:m.User},(0,c.default)(t,r.rootMutationName,{loginWithPassword:(0,d.loginWithPassword)(e),refreshTokens:(0,f.refreshTokens)(e),logout:(0,y.logout)(e),impersonate:(0,l.impersonate)(e),createUser:(0,g.createUser)(e),resetPassword:(0,_.resetPassword)(e),sendResetPasswordEmail:(0,w.sendResetPasswordEmail)(e),sendVerificationEmail:(0,x.sendVerificationEmail)(e),verifyEmail:(0,P.verifyEmail)(e)}),(0,c.default)(t,r.rootQueryName,{me:(0,p.me)(e)}),t);return{schema:n,extendWithResolvers:function(e){var t;return(0,s.default)({},e,(t={},(0,c.default)(t,r.rootMutationName,(0,o.default)(e[r.rootMutationName]||{},u[r.rootMutationName])),(0,c.default)(t,r.rootQueryName,(0,o.default)(e[r.rootQueryName]||{},u[r.rootQueryName])),(0,c.default)(t,"User",(0,o.default)(e.User||{},u.User)),t))}}}},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.JSAccountsContext=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"Authorization";return{authToken:e.headers[t]||e.headers[t.toLowerCase()]}}},function(e,t){e.exports=require("babel-runtime/helpers/defineProperty")},function(e,t){e.exports=require("babel-runtime/helpers/extends")}])});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"subscriptions-transport-ws":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/subscriptions-transport-ws/package.json                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "subscriptions-transport-ws";
exports.version = "0.8.2";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/subscriptions-transport-ws/dist/index.js                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./client"));
__export(require("./server"));
__export(require("./helpers"));
__export(require("./message-types"));
__export(require("./protocol"));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"graphql":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "graphql";
exports.version = "0.10.3";
exports.main = "index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('./graphql');

Object.defineProperty(exports, 'graphql', {
  enumerable: true,
  get: function get() {
    return _graphql.graphql;
  }
});

var _type = require('./type');

Object.defineProperty(exports, 'GraphQLSchema', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLSchema;
  }
});
Object.defineProperty(exports, 'GraphQLScalarType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLScalarType;
  }
});
Object.defineProperty(exports, 'GraphQLObjectType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLInterfaceType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInterfaceType;
  }
});
Object.defineProperty(exports, 'GraphQLUnionType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLUnionType;
  }
});
Object.defineProperty(exports, 'GraphQLEnumType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLEnumType;
  }
});
Object.defineProperty(exports, 'GraphQLInputObjectType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInputObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLList', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLList;
  }
});
Object.defineProperty(exports, 'GraphQLNonNull', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLNonNull;
  }
});
Object.defineProperty(exports, 'GraphQLDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLDirective;
  }
});
Object.defineProperty(exports, 'TypeKind', {
  enumerable: true,
  get: function get() {
    return _type.TypeKind;
  }
});
Object.defineProperty(exports, 'DirectiveLocation', {
  enumerable: true,
  get: function get() {
    return _type.DirectiveLocation;
  }
});
Object.defineProperty(exports, 'GraphQLInt', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInt;
  }
});
Object.defineProperty(exports, 'GraphQLFloat', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLFloat;
  }
});
Object.defineProperty(exports, 'GraphQLString', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLString;
  }
});
Object.defineProperty(exports, 'GraphQLBoolean', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLBoolean;
  }
});
Object.defineProperty(exports, 'GraphQLID', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLID;
  }
});
Object.defineProperty(exports, 'specifiedDirectives', {
  enumerable: true,
  get: function get() {
    return _type.specifiedDirectives;
  }
});
Object.defineProperty(exports, 'GraphQLIncludeDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLIncludeDirective;
  }
});
Object.defineProperty(exports, 'GraphQLSkipDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLSkipDirective;
  }
});
Object.defineProperty(exports, 'GraphQLDeprecatedDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLDeprecatedDirective;
  }
});
Object.defineProperty(exports, 'DEFAULT_DEPRECATION_REASON', {
  enumerable: true,
  get: function get() {
    return _type.DEFAULT_DEPRECATION_REASON;
  }
});
Object.defineProperty(exports, 'SchemaMetaFieldDef', {
  enumerable: true,
  get: function get() {
    return _type.SchemaMetaFieldDef;
  }
});
Object.defineProperty(exports, 'TypeMetaFieldDef', {
  enumerable: true,
  get: function get() {
    return _type.TypeMetaFieldDef;
  }
});
Object.defineProperty(exports, 'TypeNameMetaFieldDef', {
  enumerable: true,
  get: function get() {
    return _type.TypeNameMetaFieldDef;
  }
});
Object.defineProperty(exports, '__Schema', {
  enumerable: true,
  get: function get() {
    return _type.__Schema;
  }
});
Object.defineProperty(exports, '__Directive', {
  enumerable: true,
  get: function get() {
    return _type.__Directive;
  }
});
Object.defineProperty(exports, '__DirectiveLocation', {
  enumerable: true,
  get: function get() {
    return _type.__DirectiveLocation;
  }
});
Object.defineProperty(exports, '__Type', {
  enumerable: true,
  get: function get() {
    return _type.__Type;
  }
});
Object.defineProperty(exports, '__Field', {
  enumerable: true,
  get: function get() {
    return _type.__Field;
  }
});
Object.defineProperty(exports, '__InputValue', {
  enumerable: true,
  get: function get() {
    return _type.__InputValue;
  }
});
Object.defineProperty(exports, '__EnumValue', {
  enumerable: true,
  get: function get() {
    return _type.__EnumValue;
  }
});
Object.defineProperty(exports, '__TypeKind', {
  enumerable: true,
  get: function get() {
    return _type.__TypeKind;
  }
});
Object.defineProperty(exports, 'isType', {
  enumerable: true,
  get: function get() {
    return _type.isType;
  }
});
Object.defineProperty(exports, 'isInputType', {
  enumerable: true,
  get: function get() {
    return _type.isInputType;
  }
});
Object.defineProperty(exports, 'isOutputType', {
  enumerable: true,
  get: function get() {
    return _type.isOutputType;
  }
});
Object.defineProperty(exports, 'isLeafType', {
  enumerable: true,
  get: function get() {
    return _type.isLeafType;
  }
});
Object.defineProperty(exports, 'isCompositeType', {
  enumerable: true,
  get: function get() {
    return _type.isCompositeType;
  }
});
Object.defineProperty(exports, 'isAbstractType', {
  enumerable: true,
  get: function get() {
    return _type.isAbstractType;
  }
});
Object.defineProperty(exports, 'isNamedType', {
  enumerable: true,
  get: function get() {
    return _type.isNamedType;
  }
});
Object.defineProperty(exports, 'assertType', {
  enumerable: true,
  get: function get() {
    return _type.assertType;
  }
});
Object.defineProperty(exports, 'assertInputType', {
  enumerable: true,
  get: function get() {
    return _type.assertInputType;
  }
});
Object.defineProperty(exports, 'assertOutputType', {
  enumerable: true,
  get: function get() {
    return _type.assertOutputType;
  }
});
Object.defineProperty(exports, 'assertLeafType', {
  enumerable: true,
  get: function get() {
    return _type.assertLeafType;
  }
});
Object.defineProperty(exports, 'assertCompositeType', {
  enumerable: true,
  get: function get() {
    return _type.assertCompositeType;
  }
});
Object.defineProperty(exports, 'assertAbstractType', {
  enumerable: true,
  get: function get() {
    return _type.assertAbstractType;
  }
});
Object.defineProperty(exports, 'assertNamedType', {
  enumerable: true,
  get: function get() {
    return _type.assertNamedType;
  }
});
Object.defineProperty(exports, 'getNullableType', {
  enumerable: true,
  get: function get() {
    return _type.getNullableType;
  }
});
Object.defineProperty(exports, 'getNamedType', {
  enumerable: true,
  get: function get() {
    return _type.getNamedType;
  }
});

var _language = require('./language');

Object.defineProperty(exports, 'Source', {
  enumerable: true,
  get: function get() {
    return _language.Source;
  }
});
Object.defineProperty(exports, 'getLocation', {
  enumerable: true,
  get: function get() {
    return _language.getLocation;
  }
});
Object.defineProperty(exports, 'parse', {
  enumerable: true,
  get: function get() {
    return _language.parse;
  }
});
Object.defineProperty(exports, 'parseValue', {
  enumerable: true,
  get: function get() {
    return _language.parseValue;
  }
});
Object.defineProperty(exports, 'parseType', {
  enumerable: true,
  get: function get() {
    return _language.parseType;
  }
});
Object.defineProperty(exports, 'print', {
  enumerable: true,
  get: function get() {
    return _language.print;
  }
});
Object.defineProperty(exports, 'visit', {
  enumerable: true,
  get: function get() {
    return _language.visit;
  }
});
Object.defineProperty(exports, 'visitInParallel', {
  enumerable: true,
  get: function get() {
    return _language.visitInParallel;
  }
});
Object.defineProperty(exports, 'visitWithTypeInfo', {
  enumerable: true,
  get: function get() {
    return _language.visitWithTypeInfo;
  }
});
Object.defineProperty(exports, 'getVisitFn', {
  enumerable: true,
  get: function get() {
    return _language.getVisitFn;
  }
});
Object.defineProperty(exports, 'Kind', {
  enumerable: true,
  get: function get() {
    return _language.Kind;
  }
});
Object.defineProperty(exports, 'TokenKind', {
  enumerable: true,
  get: function get() {
    return _language.TokenKind;
  }
});
Object.defineProperty(exports, 'BREAK', {
  enumerable: true,
  get: function get() {
    return _language.BREAK;
  }
});

var _execution = require('./execution');

Object.defineProperty(exports, 'execute', {
  enumerable: true,
  get: function get() {
    return _execution.execute;
  }
});
Object.defineProperty(exports, 'defaultFieldResolver', {
  enumerable: true,
  get: function get() {
    return _execution.defaultFieldResolver;
  }
});
Object.defineProperty(exports, 'responsePathAsArray', {
  enumerable: true,
  get: function get() {
    return _execution.responsePathAsArray;
  }
});
Object.defineProperty(exports, 'getDirectiveValues', {
  enumerable: true,
  get: function get() {
    return _execution.getDirectiveValues;
  }
});

var _subscription = require('./subscription');

Object.defineProperty(exports, 'subscribe', {
  enumerable: true,
  get: function get() {
    return _subscription.subscribe;
  }
});
Object.defineProperty(exports, 'createSourceEventStream', {
  enumerable: true,
  get: function get() {
    return _subscription.createSourceEventStream;
  }
});

var _validation = require('./validation');

Object.defineProperty(exports, 'validate', {
  enumerable: true,
  get: function get() {
    return _validation.validate;
  }
});
Object.defineProperty(exports, 'ValidationContext', {
  enumerable: true,
  get: function get() {
    return _validation.ValidationContext;
  }
});
Object.defineProperty(exports, 'specifiedRules', {
  enumerable: true,
  get: function get() {
    return _validation.specifiedRules;
  }
});
Object.defineProperty(exports, 'ArgumentsOfCorrectTypeRule', {
  enumerable: true,
  get: function get() {
    return _validation.ArgumentsOfCorrectTypeRule;
  }
});
Object.defineProperty(exports, 'DefaultValuesOfCorrectTypeRule', {
  enumerable: true,
  get: function get() {
    return _validation.DefaultValuesOfCorrectTypeRule;
  }
});
Object.defineProperty(exports, 'FieldsOnCorrectTypeRule', {
  enumerable: true,
  get: function get() {
    return _validation.FieldsOnCorrectTypeRule;
  }
});
Object.defineProperty(exports, 'FragmentsOnCompositeTypesRule', {
  enumerable: true,
  get: function get() {
    return _validation.FragmentsOnCompositeTypesRule;
  }
});
Object.defineProperty(exports, 'KnownArgumentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownArgumentNamesRule;
  }
});
Object.defineProperty(exports, 'KnownDirectivesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownDirectivesRule;
  }
});
Object.defineProperty(exports, 'KnownFragmentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownFragmentNamesRule;
  }
});
Object.defineProperty(exports, 'KnownTypeNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownTypeNamesRule;
  }
});
Object.defineProperty(exports, 'LoneAnonymousOperationRule', {
  enumerable: true,
  get: function get() {
    return _validation.LoneAnonymousOperationRule;
  }
});
Object.defineProperty(exports, 'NoFragmentCyclesRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoFragmentCyclesRule;
  }
});
Object.defineProperty(exports, 'NoUndefinedVariablesRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoUndefinedVariablesRule;
  }
});
Object.defineProperty(exports, 'NoUnusedFragmentsRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoUnusedFragmentsRule;
  }
});
Object.defineProperty(exports, 'NoUnusedVariablesRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoUnusedVariablesRule;
  }
});
Object.defineProperty(exports, 'OverlappingFieldsCanBeMergedRule', {
  enumerable: true,
  get: function get() {
    return _validation.OverlappingFieldsCanBeMergedRule;
  }
});
Object.defineProperty(exports, 'PossibleFragmentSpreadsRule', {
  enumerable: true,
  get: function get() {
    return _validation.PossibleFragmentSpreadsRule;
  }
});
Object.defineProperty(exports, 'ProvidedNonNullArgumentsRule', {
  enumerable: true,
  get: function get() {
    return _validation.ProvidedNonNullArgumentsRule;
  }
});
Object.defineProperty(exports, 'ScalarLeafsRule', {
  enumerable: true,
  get: function get() {
    return _validation.ScalarLeafsRule;
  }
});
Object.defineProperty(exports, 'SingleFieldSubscriptionsRule', {
  enumerable: true,
  get: function get() {
    return _validation.SingleFieldSubscriptionsRule;
  }
});
Object.defineProperty(exports, 'UniqueArgumentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueArgumentNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueDirectivesPerLocationRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueDirectivesPerLocationRule;
  }
});
Object.defineProperty(exports, 'UniqueFragmentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueFragmentNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueInputFieldNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueInputFieldNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueOperationNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueOperationNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueVariableNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueVariableNamesRule;
  }
});
Object.defineProperty(exports, 'VariablesAreInputTypesRule', {
  enumerable: true,
  get: function get() {
    return _validation.VariablesAreInputTypesRule;
  }
});
Object.defineProperty(exports, 'VariablesInAllowedPositionRule', {
  enumerable: true,
  get: function get() {
    return _validation.VariablesInAllowedPositionRule;
  }
});

var _error = require('./error');

Object.defineProperty(exports, 'GraphQLError', {
  enumerable: true,
  get: function get() {
    return _error.GraphQLError;
  }
});
Object.defineProperty(exports, 'formatError', {
  enumerable: true,
  get: function get() {
    return _error.formatError;
  }
});

var _utilities = require('./utilities');

Object.defineProperty(exports, 'introspectionQuery', {
  enumerable: true,
  get: function get() {
    return _utilities.introspectionQuery;
  }
});
Object.defineProperty(exports, 'getOperationAST', {
  enumerable: true,
  get: function get() {
    return _utilities.getOperationAST;
  }
});
Object.defineProperty(exports, 'buildClientSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildClientSchema;
  }
});
Object.defineProperty(exports, 'buildASTSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildASTSchema;
  }
});
Object.defineProperty(exports, 'buildSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildSchema;
  }
});
Object.defineProperty(exports, 'extendSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.extendSchema;
  }
});
Object.defineProperty(exports, 'printSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.printSchema;
  }
});
Object.defineProperty(exports, 'printIntrospectionSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.printIntrospectionSchema;
  }
});
Object.defineProperty(exports, 'printType', {
  enumerable: true,
  get: function get() {
    return _utilities.printType;
  }
});
Object.defineProperty(exports, 'typeFromAST', {
  enumerable: true,
  get: function get() {
    return _utilities.typeFromAST;
  }
});
Object.defineProperty(exports, 'valueFromAST', {
  enumerable: true,
  get: function get() {
    return _utilities.valueFromAST;
  }
});
Object.defineProperty(exports, 'astFromValue', {
  enumerable: true,
  get: function get() {
    return _utilities.astFromValue;
  }
});
Object.defineProperty(exports, 'TypeInfo', {
  enumerable: true,
  get: function get() {
    return _utilities.TypeInfo;
  }
});
Object.defineProperty(exports, 'isValidJSValue', {
  enumerable: true,
  get: function get() {
    return _utilities.isValidJSValue;
  }
});
Object.defineProperty(exports, 'isValidLiteralValue', {
  enumerable: true,
  get: function get() {
    return _utilities.isValidLiteralValue;
  }
});
Object.defineProperty(exports, 'concatAST', {
  enumerable: true,
  get: function get() {
    return _utilities.concatAST;
  }
});
Object.defineProperty(exports, 'separateOperations', {
  enumerable: true,
  get: function get() {
    return _utilities.separateOperations;
  }
});
Object.defineProperty(exports, 'isEqualType', {
  enumerable: true,
  get: function get() {
    return _utilities.isEqualType;
  }
});
Object.defineProperty(exports, 'isTypeSubTypeOf', {
  enumerable: true,
  get: function get() {
    return _utilities.isTypeSubTypeOf;
  }
});
Object.defineProperty(exports, 'doTypesOverlap', {
  enumerable: true,
  get: function get() {
    return _utilities.doTypesOverlap;
  }
});
Object.defineProperty(exports, 'assertValidName', {
  enumerable: true,
  get: function get() {
    return _utilities.assertValidName;
  }
});
Object.defineProperty(exports, 'findBreakingChanges', {
  enumerable: true,
  get: function get() {
    return _utilities.findBreakingChanges;
  }
});
Object.defineProperty(exports, 'BreakingChangeType', {
  enumerable: true,
  get: function get() {
    return _utilities.BreakingChangeType;
  }
});
Object.defineProperty(exports, 'DangerousChangeType', {
  enumerable: true,
  get: function get() {
    return _utilities.DangerousChangeType;
  }
});
Object.defineProperty(exports, 'findDeprecatedUsages', {
  enumerable: true,
  get: function get() {
    return _utilities.findDeprecatedUsages;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"body-parser":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/body-parser/package.json                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "body-parser";
exports.version = "1.17.2";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/body-parser/index.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var deprecate = require('depd')('body-parser')

/**
 * Cache of loaded parsers.
 * @private
 */

var parsers = Object.create(null)

/**
 * @typedef Parsers
 * @type {function}
 * @property {function} json
 * @property {function} raw
 * @property {function} text
 * @property {function} urlencoded
 */

/**
 * Module exports.
 * @type {Parsers}
 */

exports = module.exports = deprecate.function(bodyParser,
  'bodyParser: use individual json/urlencoded middlewares')

/**
 * JSON parser.
 * @public
 */

Object.defineProperty(exports, 'json', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('json')
})

/**
 * Raw parser.
 * @public
 */

Object.defineProperty(exports, 'raw', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('raw')
})

/**
 * Text parser.
 * @public
 */

Object.defineProperty(exports, 'text', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('text')
})

/**
 * URL-encoded parser.
 * @public
 */

Object.defineProperty(exports, 'urlencoded', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('urlencoded')
})

/**
 * Create a middleware to parse json and urlencoded bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @deprecated
 * @public
 */

function bodyParser (options) {
  var opts = {}

  // exclude type option
  if (options) {
    for (var prop in options) {
      if (prop !== 'type') {
        opts[prop] = options[prop]
      }
    }
  }

  var _urlencoded = exports.urlencoded(opts)
  var _json = exports.json(opts)

  return function bodyParser (req, res, next) {
    _json(req, res, function (err) {
      if (err) return next(err)
      _urlencoded(req, res, next)
    })
  }
}

/**
 * Create a getter for loading a parser.
 * @private
 */

function createParserGetter (name) {
  return function get () {
    return loadParser(name)
  }
}

/**
 * Load a parser module.
 * @private
 */

function loadParser (parserName) {
  var parser = parsers[parserName]

  if (parser !== undefined) {
    return parser
  }

  // this uses a switch for static require analysis
  switch (parserName) {
    case 'json':
      parser = require('./lib/types/json')
      break
    case 'raw':
      parser = require('./lib/types/raw')
      break
    case 'text':
      parser = require('./lib/types/text')
      break
    case 'urlencoded':
      parser = require('./lib/types/urlencoded')
      break
  }

  // store to prevent invoking require()
  return (parsers[parserName] = parser)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"express":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/express/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "express";
exports.version = "4.15.4";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/express/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

module.exports = require('./lib/express');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cors":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/cors/package.json                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "cors";
exports.version = "2.8.4";
exports.main = "./lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/cors/lib/index.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function () {

  'use strict';

  var assign = require('object-assign');
  var vary = require('vary');

  var defaults = {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204
    };

  function isString(s) {
    return typeof s === 'string' || s instanceof String;
  }

  function isOriginAllowed(origin, allowedOrigin) {
    if (Array.isArray(allowedOrigin)) {
      for (var i = 0; i < allowedOrigin.length; ++i) {
        if (isOriginAllowed(origin, allowedOrigin[i])) {
          return true;
        }
      }
      return false;
    } else if (isString(allowedOrigin)) {
      return origin === allowedOrigin;
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    } else {
      return !!allowedOrigin;
    }
  }

  function configureOrigin(options, req) {
    var requestOrigin = req.headers.origin,
      headers = [],
      isAllowed;

    if (!options.origin || options.origin === '*') {
      // allow any origin
      headers.push([{
        key: 'Access-Control-Allow-Origin',
        value: '*'
      }]);
    } else if (isString(options.origin)) {
      // fixed origin
      headers.push([{
        key: 'Access-Control-Allow-Origin',
        value: options.origin
      }]);
      headers.push([{
        key: 'Vary',
        value: 'Origin'
      }]);
    } else {
      isAllowed = isOriginAllowed(requestOrigin, options.origin);
      // reflect origin
      headers.push([{
        key: 'Access-Control-Allow-Origin',
        value: isAllowed ? requestOrigin : false
      }]);
      headers.push([{
        key: 'Vary',
        value: 'Origin'
      }]);
    }

    return headers;
  }

  function configureMethods(options) {
    var methods = options.methods;
    if (methods.join) {
      methods = options.methods.join(','); // .methods is an array, so turn it into a string
    }
    return {
      key: 'Access-Control-Allow-Methods',
      value: methods
    };
  }

  function configureCredentials(options) {
    if (options.credentials === true) {
      return {
        key: 'Access-Control-Allow-Credentials',
        value: 'true'
      };
    }
    return null;
  }

  function configureAllowedHeaders(options, req) {
    var allowedHeaders = options.allowedHeaders || options.headers;
    var headers = [];

    if (!allowedHeaders) {
      allowedHeaders = req.headers['access-control-request-headers']; // .headers wasn't specified, so reflect the request headers
      headers.push([{
        key: 'Vary',
        value: 'Access-Control-Request-Headers'
      }]);
    } else if (allowedHeaders.join) {
      allowedHeaders = allowedHeaders.join(','); // .headers is an array, so turn it into a string
    }
    if (allowedHeaders && allowedHeaders.length) {
      headers.push([{
        key: 'Access-Control-Allow-Headers',
        value: allowedHeaders
      }]);
    }

    return headers;
  }

  function configureExposedHeaders(options) {
    var headers = options.exposedHeaders;
    if (!headers) {
      return null;
    } else if (headers.join) {
      headers = headers.join(','); // .headers is an array, so turn it into a string
    }
    if (headers && headers.length) {
      return {
        key: 'Access-Control-Expose-Headers',
        value: headers
      };
    }
    return null;
  }

  function configureMaxAge(options) {
    var maxAge = options.maxAge && options.maxAge.toString();
    if (maxAge && maxAge.length) {
      return {
        key: 'Access-Control-Max-Age',
        value: maxAge
      };
    }
    return null;
  }

  function applyHeaders(headers, res) {
    for (var i = 0, n = headers.length; i < n; i++) {
      var header = headers[i];
      if (header) {
        if (Array.isArray(header)) {
          applyHeaders(header, res);
        } else if (header.key === 'Vary' && header.value) {
          vary(res, header.value);
        } else if (header.value) {
          res.setHeader(header.key, header.value);
        }
      }
    }
  }

  function cors(options, req, res, next) {
    var headers = [],
      method = req.method && req.method.toUpperCase && req.method.toUpperCase();

    if (method === 'OPTIONS') {
      // preflight
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureMethods(options, req));
      headers.push(configureAllowedHeaders(options, req));
      headers.push(configureMaxAge(options, req));
      headers.push(configureExposedHeaders(options, req));
      applyHeaders(headers, res);

      if (options.preflightContinue ) {
        next();
      } else {
        // Safari (and potentially other browsers) need content-length 0,
        //   for 204 or they just hang waiting for a body
        res.statusCode = options.optionsSuccessStatus || defaults.optionsSuccessStatus;
        res.setHeader('Content-Length', '0');
        res.end();
      }
    } else {
      // actual response
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureExposedHeaders(options, req));
      applyHeaders(headers, res);
      next();
    }
  }

  function middlewareWrapper(o) {
    // if options are static (either via defaults or custom options passed in), wrap in a function
    var optionsCallback = null;
    if (typeof o === 'function') {
      optionsCallback = o;
    } else {
      optionsCallback = function (req, cb) {
        cb(null, o);
      };
    }

    return function corsMiddleware(req, res, next) {
      optionsCallback(req, function (err, options) {
        if (err) {
          next(err);
        } else {
          var corsOptions = assign({}, defaults, options);
          var originCallback = null;
          if (corsOptions.origin && typeof corsOptions.origin === 'function') {
            originCallback = corsOptions.origin;
          } else if (corsOptions.origin) {
            originCallback = function (origin, cb) {
              cb(null, corsOptions.origin);
            };
          }

          if (originCallback) {
            originCallback(req.headers.origin, function (err2, origin) {
              if (err2 || !origin) {
                next(err2);
              } else {
                corsOptions.origin = origin;
                cors(corsOptions, req, res, next);
              }
            });
          } else {
            next();
          }
        }
      });
    };
  }

  // can pass either an options hash, an options delegate, or nothing
  module.exports = middlewareWrapper;

}());

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"graphql-tools":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-tools/package.json                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "graphql-tools";
exports.version = "1.2.2";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-tools/dist/index.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./schemaGenerator"));
__export(require("./mock"));
__export(require("./autopublish"));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"merge-graphql-schemas":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/merge-graphql-schemas/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "merge-graphql-schemas";
exports.version = "1.1.3";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/merge-graphql-schemas/index.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = require('./dist/index');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.property":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/lodash.property/package.json                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "lodash.property";
exports.version = "4.4.2";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/lodash.property/index.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    splice = arrayProto.splice;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"graphql-subscriptions":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-subscriptions/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "graphql-subscriptions";
exports.version = "0.4.4";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-subscriptions/dist/index.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pubsub_1 = require("./pubsub");
exports.PubSub = pubsub_1.PubSub;
var with_filter_1 = require("./with-filter");
exports.withFilter = with_filter_1.withFilter;
var subscriptions_manager_1 = require("./subscriptions-manager");
exports.SubscriptionManager = subscriptions_manager_1.SubscriptionManager;
exports.ValidationError = subscriptions_manager_1.ValidationError;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".graphqls"
  ]
});
require("/node_modules/meteor/rocketchat:graphql/server/settings.js");
var exports = require("/node_modules/meteor/rocketchat:graphql/server/api.js");

/* Exports */
Package._define("rocketchat:graphql", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_graphql.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvc2NoZW1hLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvaGVscGVycy9hdXRoZW50aWNhdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL2hlbHBlcnMvZGF0ZVRvRmxvYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvbW9ja3MvYWNjb3VudHMvZ3JhcGhxbC1hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2FjY291bnRzL09hdXRoUHJvdmlkZXItdHlwZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvYWNjb3VudHMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2FjY291bnRzL29hdXRoUHJvdmlkZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9DaGFubmVsLXR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL0NoYW5uZWxGaWx0ZXItaW5wdXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL0NoYW5uZWxOYW1lQW5kRGlyZWN0LWlucHV0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9DaGFubmVsU29ydC1lbnVtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9Qcml2YWN5LWVudW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL2NoYW5uZWxCeU5hbWUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL2NoYW5uZWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9jaGFubmVsc0J5VXNlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvY2hhbm5lbHMvY3JlYXRlQ2hhbm5lbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvY2hhbm5lbHMvZGlyZWN0Q2hhbm5lbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvY2hhbm5lbHMvaGlkZUNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9sZWF2ZUNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9tZXNzYWdlcy9NZXNzYWdlLXR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL01lc3NhZ2VJZGVudGlmaWVyLWlucHV0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9tZXNzYWdlcy9NZXNzYWdlc1dpdGhDdXJzb3ItdHlwZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvbWVzc2FnZXMvUmVhY3Rpb24tdHlwZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvbWVzc2FnZXMvYWRkUmVhY3Rpb25Ub01lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL2NoYXRNZXNzYWdlQWRkZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL2RlbGV0ZU1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL2VkaXRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9tZXNzYWdlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvbWVzc2FnZXMvbWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL3NlbmRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy91c2Vycy9Vc2VyLXR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL3VzZXJzL1VzZXJTdGF0dXMtZW51bS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvdXNlcnMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL3VzZXJzL3NldFN0YXR1cy5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsInNlY3Rpb24iLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsImdyYXBocWxFeHByZXNzIiwiZ3JhcGhpcWxFeHByZXNzIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsImpzQWNjb3VudHNDb250ZXh0IiwiSlNBY2NvdW50c0NvbnRleHQiLCJTdWJzY3JpcHRpb25TZXJ2ZXIiLCJleGVjdXRlIiwic3Vic2NyaWJlIiwiTWV0ZW9yIiwiV2ViQXBwIiwiYm9keVBhcnNlciIsImRlZmF1bHQiLCJleHByZXNzIiwiY29ycyIsImV4ZWN1dGFibGVTY2hlbWEiLCJzdWJzY3JpcHRpb25Qb3J0IiwiZ2V0IiwiZ3JhcGhRTFNlcnZlciIsInVzZSIsInJlcSIsInJlcyIsIm5leHQiLCJzdGF0dXMiLCJzZW5kIiwianNvbiIsInJlcXVlc3QiLCJzY2hlbWEiLCJjb250ZXh0IiwiZm9ybWF0RXJyb3IiLCJlIiwibWVzc2FnZSIsImxvY2F0aW9ucyIsInBhdGgiLCJkZWJ1ZyIsImlzRGV2ZWxvcG1lbnQiLCJlbmRwb2ludFVSTCIsInN1YnNjcmlwdGlvbnNFbmRwb2ludCIsInN0YXJ0U3Vic2NyaXB0aW9uU2VydmVyIiwiY3JlYXRlIiwib25Db25uZWN0IiwiY29ubmVjdGlvblBhcmFtcyIsImF1dGhUb2tlbiIsIkF1dGhvcml6YXRpb24iLCJwb3J0IiwiaG9zdCIsInByb2Nlc3MiLCJlbnYiLCJCSU5EX0lQIiwiY29uc29sZSIsImxvZyIsIm9uTGlzdGVuaW5nIiwiY29ubmVjdEhhbmRsZXJzIiwiZXhwb3J0IiwibWFrZUV4ZWN1dGFibGVTY2hlbWEiLCJtZXJnZVR5cGVzIiwibWVyZ2VSZXNvbHZlcnMiLCJjaGFubmVscyIsIm1lc3NhZ2VzIiwiYWNjb3VudHMiLCJ1c2VycyIsInJlc29sdmVycyIsInR5cGVEZWZzIiwibG9nZ2VyIiwicHVic3ViIiwiUHViU3ViIiwiYXV0aGVudGljYXRlZCIsIkFjY291bnRzU2VydmVyIiwiX2F1dGhlbnRpY2F0ZWQiLCJyZXNvbHZlciIsImRhdGVUb0Zsb2F0IiwiZGF0ZSIsIkRhdGUiLCJnZXRUaW1lIiwiQWNjb3VudHMiLCJmdW5jIiwicm9vdCIsImFyZ3MiLCJpbmZvIiwiRXJyb3IiLCJ1c2VyT2JqZWN0IiwicmVzdW1lU2Vzc2lvbiIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJjcmVhdGVKU0FjY291bnRzR3JhcGhRTCIsIm9hdXRoUHJvdmlkZXJzIiwiT2F1dGhQcm92aWRlclR5cGUiLCJhY2NvdW50c0dyYXBoUUwiLCJleHRlbmRXaXRoUmVzb2x2ZXJzIiwiSFRUUCIsImlzSlNPTiIsIm9iaiIsIkpTT04iLCJwYXJzZSIsIlF1ZXJ5IiwicmVzdWx0IiwiYWJzb2x1dGVVcmwiLCJjb250ZW50IiwicHJvdmlkZXJzIiwiZGF0YSIsIm1hcCIsIm5hbWUiLCJwcm9wZXJ0eSIsIkNoYW5uZWwiLCJpZCIsInQiLCJ1c2VybmFtZXMiLCJmaW5kIiwidSIsInVzZXJuYW1lIiwibWVtYmVycyIsImlkcyIsIm1vZGVscyIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kQnlSb29tSWRXaGVuVXNlcklkRXhpc3RzIiwiZmllbGRzIiwiZmV0Y2giLCJzdWIiLCJVc2VycyIsImZpbmRCeUlkcyIsIm93bmVycyIsImZpbmRPbmVCeVVzZXJuYW1lIiwibnVtYmVyT2ZNZW1iZXJzIiwiZmluZEJ5Um9vbUlkIiwiY291bnQiLCJudW1iZXJPZk1lc3NhZ2VzIiwicmVhZE9ubHkiLCJybyIsImRpcmVjdCIsInByaXZhdGVDaGFubmVsIiwiZmF2b3VyaXRlIiwicm9vbSIsImZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZCIsImYiLCJ1bnNlZW5NZXNzYWdlcyIsInVucmVhZCIsInJvb21QdWJsaWNGaWVsZHMiLCJjaGFubmVsQnlOYW1lIiwicXVlcnkiLCJSb29tcyIsImZpbmRPbmUiLCJvcHRpb25zIiwic29ydCIsImZpbHRlciIsIm5hbWVGaWx0ZXIiLCJ1bmRlZmluZWQiLCIkcmVnZXgiLCJSZWdFeHAiLCJzb3J0QnkiLCJtc2dzIiwicHJpdmFjeSIsIiRuZSIsImNoYW5uZWxzQnlVc2VyIiwidXNlcklkIiwiZmluZE9uZUJ5SWQiLCJyb29tSWRzIiwiZmluZEJ5VXNlcklkIiwicmlkIiwicyIsInJvb21zIiwiTXV0YXRpb24iLCJjcmVhdGVDaGFubmVsIiwiQVBJIiwidmFsaWRhdGUiLCJrZXkiLCJtZW1iZXJzSWQiLCJjaGFubmVsIiwiZGlyZWN0Q2hhbm5lbCIsImNoYW5uZWxJZCIsIiRhbGwiLCJoaWRlQ2hhbm5lbCIsIm9wZW4iLCJydW5Bc1VzZXIiLCJjYWxsIiwibGVhdmVDaGFubmVsIiwiQ2hhbm5lbFR5cGUiLCJDaGFubmVsU29ydCIsIkNoYW5uZWxGaWx0ZXIiLCJQcml2YWN5IiwiQ2hhbm5lbE5hbWVBbmREaXJlY3QiLCJkZXNjcmlwdGlvbiIsImFubm91bmNlbWVudCIsInRvcGljIiwiYXJjaGl2ZWQiLCJNZXNzYWdlIiwiY3JlYXRpb25UaW1lIiwidHMiLCJhdXRob3IiLCJmcm9tU2VydmVyIiwiY2hhbm5lbFJlZiIsIiRpbiIsImMiLCJ1c2VyUmVmIiwibWVudGlvbnMiLCJyZWFjdGlvbnMiLCJrZXlzIiwibGVuZ3RoIiwiZm9yRWFjaCIsImljb24iLCJwdXNoIiwiYWRkUmVhY3Rpb25Ub01lc3NhZ2UiLCJQcm9taXNlIiwicmVzb2x2ZSIsIm1lc3NhZ2VJZCIsIk1lc3NhZ2VzIiwiQ0hBVF9NRVNTQUdFX1NVQlNDUklQVElPTl9UT1BJQyIsInB1Ymxpc2hNZXNzYWdlIiwid2l0aEZpbHRlciIsInB1Ymxpc2giLCJjaGF0TWVzc2FnZUFkZGVkIiwic2hvdWxkUHVibGlzaCIsImRpcmVjdFRvIiwiU3Vic2NyaXB0aW9uIiwiYXN5bmNJdGVyYXRvciIsInBheWxvYWQiLCJjYWxsYmFja3MiLCJkZWxldGVNZXNzYWdlIiwibXNnIiwiZWRpdE1lc3NhZ2UiLCJzZW5kTWVzc2FnZSIsIk1lc3NhZ2VUeXBlIiwiTWVzc2FnZXNXaXRoQ3Vyc29yVHlwZSIsIk1lc3NhZ2VJZGVudGlmaWVyIiwiUmVhY3Rpb25UeXBlIiwibWVzc2FnZXNRdWVyeSIsIm1lc3NhZ2VzT3B0aW9ucyIsImNoYW5uZWxRdWVyeSIsImlzUGFnaW5hdGlvbiIsImN1cnNvciIsImNoYW5uZWxOYW1lIiwiZXJyb3IiLCJtZXNzYWdlc0FycmF5IiwiY3Vyc29yTXNnIiwiJGx0Iiwic2VhcmNoUmVnZXgiLCJsaW1pdCIsImV4Y2x1ZGVTZXJ2ZXIiLCIkZXhpc3RzIiwiZmlyc3RNZXNzYWdlIiwibGFzdElkIiwidGV4dCIsIm1lc3NhZ2VSZXR1cm4iLCJwcm9jZXNzV2ViaG9va01lc3NhZ2UiLCJVc2VyIiwidG9VcHBlckNhc2UiLCJhdmF0YXIiLCJBdmF0YXJzIiwibW9kZWwiLCJyYXdDb2xsZWN0aW9uIiwidXJsIiwiYmluZEVudmlyb25tZW50IiwiZmluZEJ5U3Vic2NyaXB0aW9uVXNlcklkIiwiZGlyZWN0TWVzc2FnZXMiLCJmaW5kRGlyZWN0Um9vbUNvbnRhaW5pbmdVc2VybmFtZSIsInNldFN0YXR1cyIsIlVzZXJUeXBlIiwiVXNlclN0YXR1cyIsInVwZGF0ZSIsIiRzZXQiLCJ0b0xvd2VyQ2FzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixTQUE3QixFQUF3QyxZQUFXO0FBQ2xELE9BQUtDLE9BQUwsQ0FBYSxhQUFiLEVBQTRCLFlBQVc7QUFDdEMsU0FBS0MsR0FBTCxDQUFTLGlCQUFULEVBQTRCLEtBQTVCLEVBQW1DO0FBQUVDLFlBQU0sU0FBUjtBQUFtQkMsY0FBUTtBQUEzQixLQUFuQztBQUNBLFNBQUtGLEdBQUwsQ0FBUyxjQUFULEVBQXlCLElBQXpCLEVBQStCO0FBQUVDLFlBQU0sU0FBUjtBQUFtQkMsY0FBUSxLQUEzQjtBQUFrQ0MsbUJBQWE7QUFBRUMsYUFBSyxpQkFBUDtBQUEwQkMsZUFBTztBQUFqQztBQUEvQyxLQUEvQjtBQUNBLFNBQUtMLEdBQUwsQ0FBUywyQkFBVCxFQUFzQyxJQUF0QyxFQUE0QztBQUFFQyxZQUFNLEtBQVI7QUFBZUMsY0FBUSxLQUF2QjtBQUE4QkMsbUJBQWE7QUFBRUMsYUFBSyxpQkFBUDtBQUEwQkMsZUFBTztBQUFqQztBQUEzQyxLQUE1QztBQUNBLEdBSkQ7QUFLQSxDQU5ELEU7Ozs7Ozs7Ozs7O0FDQUEsSUFBSUMsY0FBSixFQUFtQkMsZUFBbkI7QUFBbUNDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSx1QkFBUixDQUFi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O0FBREg7QUFEa0MsT0FBekM7QUFNQSxhQUFPaFIsV0FBVzZILE1BQVgsQ0FBa0JNLEtBQWxCLENBQXdCc0IsT0FBeEIsQ0FBZ0N6RCxLQUFLeEYsR0FBckMsQ0FBUDtBQUNBLEtBUlU7QUFERjtBQURNLENBQWpCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZ3JhcGhxbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0dlbmVyYWwnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5zZWN0aW9uKCdHcmFwaFFMIEFQSScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdHcmFwaHFsX0VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIHB1YmxpYzogZmFsc2UgfSk7XG5cdFx0dGhpcy5hZGQoJ0dyYXBocWxfQ09SUycsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlLCBlbmFibGVRdWVyeTogeyBfaWQ6ICdHcmFwaHFsX0VuYWJsZWQnLCB2YWx1ZTogdHJ1ZSB9IH0pO1xuXHRcdHRoaXMuYWRkKCdHcmFwaHFsX1N1YnNjcmlwdGlvbl9Qb3J0JywgMzEwMCwgeyB0eXBlOiAnaW50JywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnR3JhcGhxbF9FbmFibGVkJywgdmFsdWU6IHRydWUgfSB9KTtcblx0fSk7XG59KTtcbiIsImltcG9ydCB7IGdyYXBocWxFeHByZXNzLCBncmFwaGlxbEV4cHJlc3MgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuaW1wb3J0IHsgSlNBY2NvdW50c0NvbnRleHQgYXMganNBY2NvdW50c0NvbnRleHQgfSBmcm9tICdAYWNjb3VudHMvZ3JhcGhxbC1hcGknO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uU2VydmVyIH0gZnJvbSAnc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MnO1xuaW1wb3J0IHsgZXhlY3V0ZSwgc3Vic2NyaWJlIH0gZnJvbSAnZ3JhcGhxbCc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFdlYkFwcCB9IGZyb20gJ21ldGVvci93ZWJhcHAnO1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcblxuaW1wb3J0IHsgZXhlY3V0YWJsZVNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcblxuY29uc3Qgc3Vic2NyaXB0aW9uUG9ydCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHcmFwaHFsX1N1YnNjcmlwdGlvbl9Qb3J0JykgfHwgMzEwMDtcblxuLy8gdGhlIE1ldGVvciBHcmFwaFFMIHNlcnZlciBpcyBhbiBFeHByZXNzIHNlcnZlclxuY29uc3QgZ3JhcGhRTFNlcnZlciA9IGV4cHJlc3MoKTtcblxuaWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHcmFwaHFsX0NPUlMnKSkge1xuXHRncmFwaFFMU2VydmVyLnVzZShjb3JzKCkpO1xufVxuXG5ncmFwaFFMU2VydmVyLnVzZSgnL2FwaS9ncmFwaHFsJywgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR3JhcGhxbF9FbmFibGVkJykpIHtcblx0XHRuZXh0KCk7XG5cdH0gZWxzZSB7XG5cdFx0cmVzLnN0YXR1cyg0MDApLnNlbmQoJ0dyYXBocWwgaXMgbm90IGVuYWJsZWQgaW4gdGhpcyBzZXJ2ZXInKTtcblx0fVxufSk7XG5cbmdyYXBoUUxTZXJ2ZXIudXNlKFxuXHQnL2FwaS9ncmFwaHFsJyxcblx0Ym9keVBhcnNlci5qc29uKCksXG5cdGdyYXBocWxFeHByZXNzKHJlcXVlc3QgPT4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzY2hlbWE6IGV4ZWN1dGFibGVTY2hlbWEsXG5cdFx0XHRjb250ZXh0OiBqc0FjY291bnRzQ29udGV4dChyZXF1ZXN0KSxcblx0XHRcdGZvcm1hdEVycm9yOiBlID0+ICh7XG5cdFx0XHRcdG1lc3NhZ2U6IGUubWVzc2FnZSxcblx0XHRcdFx0bG9jYXRpb25zOiBlLmxvY2F0aW9ucyxcblx0XHRcdFx0cGF0aDogZS5wYXRoXG5cdFx0XHR9KSxcblx0XHRcdGRlYnVnOiBNZXRlb3IuaXNEZXZlbG9wbWVudFxuXHRcdH07XG5cdH0pXG4pO1xuXG5ncmFwaFFMU2VydmVyLnVzZShcblx0Jy9ncmFwaGlxbCcsXG5cdGdyYXBoaXFsRXhwcmVzcyh7XG5cdFx0ZW5kcG9pbnRVUkw6ICcvYXBpL2dyYXBocWwnLFxuXHRcdHN1YnNjcmlwdGlvbnNFbmRwb2ludDogYHdzOi8vbG9jYWxob3N0OiR7IHN1YnNjcmlwdGlvblBvcnQgfWBcblx0fSlcbik7XG5cbmNvbnN0IHN0YXJ0U3Vic2NyaXB0aW9uU2VydmVyID0gKCkgPT4ge1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0dyYXBocWxfRW5hYmxlZCcpKSB7XG5cdFx0U3Vic2NyaXB0aW9uU2VydmVyLmNyZWF0ZSh7XG5cdFx0XHRzY2hlbWE6IGV4ZWN1dGFibGVTY2hlbWEsXG5cdFx0XHRleGVjdXRlLFxuXHRcdFx0c3Vic2NyaWJlLFxuXHRcdFx0b25Db25uZWN0OiAoY29ubmVjdGlvblBhcmFtcykgPT4gKHsgYXV0aFRva2VuOiBjb25uZWN0aW9uUGFyYW1zLkF1dGhvcml6YXRpb24gfSlcblx0XHR9LFxuXHRcdHtcblx0XHRcdHBvcnQ6IHN1YnNjcmlwdGlvblBvcnQsXG5cdFx0XHRob3N0OiBwcm9jZXNzLmVudi5CSU5EX0lQIHx8ICcwLjAuMC4wJ1xuXHRcdH0pO1xuXG5cdFx0Y29uc29sZS5sb2coJ0dyYXBoUUwgU3Vic2NyaXB0aW9uIHNlcnZlciBydW5zIG9uIHBvcnQ6Jywgc3Vic2NyaXB0aW9uUG9ydCk7XG5cdH1cbn07XG5cbldlYkFwcC5vbkxpc3RlbmluZygoKSA9PiB7XG5cdHN0YXJ0U3Vic2NyaXB0aW9uU2VydmVyKCk7XG59KTtcblxuLy8gdGhpcyBiaW5kcyB0aGUgc3BlY2lmaWVkIHBhdGhzIHRvIHRoZSBFeHByZXNzIHNlcnZlciBydW5uaW5nIEFwb2xsbyArIEdyYXBoaVFMXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShncmFwaFFMU2VydmVyKTtcbiIsImltcG9ydCB7IG1ha2VFeGVjdXRhYmxlU2NoZW1hIH0gZnJvbSAnZ3JhcGhxbC10b29scyc7XG5pbXBvcnQgeyBtZXJnZVR5cGVzLCBtZXJnZVJlc29sdmVycyB9IGZyb20gJ21lcmdlLWdyYXBocWwtc2NoZW1hcyc7XG5cbmltcG9ydCAqIGFzIGNoYW5uZWxzIGZyb20gJy4vcmVzb2x2ZXJzL2NoYW5uZWxzJztcbmltcG9ydCAqIGFzIG1lc3NhZ2VzIGZyb20gJy4vcmVzb2x2ZXJzL21lc3NhZ2VzJztcbmltcG9ydCAqIGFzIGFjY291bnRzIGZyb20gJy4vcmVzb2x2ZXJzL2FjY291bnRzJztcbmltcG9ydCAqIGFzIHVzZXJzIGZyb20gJy4vcmVzb2x2ZXJzL3VzZXJzJztcblxuY29uc3Qgc2NoZW1hID0gbWVyZ2VUeXBlcyhbXG5cdGNoYW5uZWxzLnNjaGVtYSxcblx0bWVzc2FnZXMuc2NoZW1hLFxuXHRhY2NvdW50cy5zY2hlbWEsXG5cdHVzZXJzLnNjaGVtYVxuXSk7XG5cbmNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0Y2hhbm5lbHMucmVzb2x2ZXJzLFxuXHRtZXNzYWdlcy5yZXNvbHZlcnMsXG5cdGFjY291bnRzLnJlc29sdmVycyxcblx0dXNlcnMucmVzb2x2ZXJzXG5dKTtcblxuZXhwb3J0IGNvbnN0IGV4ZWN1dGFibGVTY2hlbWEgPSBtYWtlRXhlY3V0YWJsZVNjaGVtYSh7XG5cdHR5cGVEZWZzOiBbc2NoZW1hXSxcblx0cmVzb2x2ZXJzLFxuXHRsb2dnZXI6IHtcblx0XHRsb2c6IChlKSA9PiBjb25zb2xlLmxvZyhlKVxuXHR9XG59KTtcbiIsImltcG9ydCB7IFB1YlN1YiB9IGZyb20gJ2dyYXBocWwtc3Vic2NyaXB0aW9ucyc7XG5cbmV4cG9ydCBjb25zdCBwdWJzdWIgPSBuZXcgUHViU3ViKCk7XG4iLCJpbXBvcnQgeyBBY2NvdW50c1NlcnZlciB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmFjY291bnRzJztcbi8vaW1wb3J0IHsgYXV0aGVudGljYXRlZCBhcyBfYXV0aGVudGljYXRlZCB9IGZyb20gJ0BhY2NvdW50cy9ncmFwaHFsLWFwaSc7XG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIGFzIF9hdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vbW9ja3MvYWNjb3VudHMvZ3JhcGhxbC1hcGknO1xuXG5leHBvcnQgY29uc3QgYXV0aGVudGljYXRlZCA9IChyZXNvbHZlcikgPT4ge1xuXHRyZXR1cm4gX2F1dGhlbnRpY2F0ZWQoQWNjb3VudHNTZXJ2ZXIsIHJlc29sdmVyKTtcbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gZGF0ZVRvRmxvYXQoZGF0ZSkge1xuXHRpZiAoZGF0ZSkge1xuXHRcdHJldHVybiBuZXcgRGF0ZShkYXRlKS5nZXRUaW1lKCk7XG5cdH1cbn1cbiIsIi8vIFNhbWUgYXMgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL2pzLWFjY291bnRzL2dyYXBocWwvYmxvYi9tYXN0ZXIvcGFja2FnZXMvZ3JhcGhxbC1hcGkvc3JjL3V0aWxzL2F1dGhlbnRpY2F0ZWQtcmVzb2x2ZXIuanNcbi8vIGV4Y2VwdCBjb2RlIGJlbG93IHdvcmtzXG4vLyBJdCBtaWdodCBiZSBsaWtlIHRoYXQgYmVjYXVzZSBvZiBhc3luYy9hd2FpdCxcbi8vIG1heWJlIFByb21pc2UgaXMgbm90IHdyYXBwZWQgd2l0aCBGaWJlclxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9ibG9iL2EzNjJlMjBhMzc1NDczNjJiNTgxZmVkNTJmNzE3MWQwMjJlODNiNjIvcGFja2FnZXMvcHJvbWlzZS9zZXJ2ZXIuanNcbi8vIE9wZW5lZCBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL2pzLWFjY291bnRzL2dyYXBocWwvaXNzdWVzLzE2XG5leHBvcnQgY29uc3QgYXV0aGVudGljYXRlZCA9IChBY2NvdW50cywgZnVuYykgPT4gKGFzeW5jKHJvb3QsIGFyZ3MsIGNvbnRleHQsIGluZm8pID0+IHtcblx0Y29uc3QgYXV0aFRva2VuID0gY29udGV4dC5hdXRoVG9rZW47XG5cblx0aWYgKCFhdXRoVG9rZW4gfHwgYXV0aFRva2VuID09PSAnJyB8fCBhdXRoVG9rZW4gPT09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIGF1dGhvcml6YXRpb24gdG9rZW4gaW4gcmVxdWVzdCcpO1xuXHR9XG5cblx0Y29uc3QgdXNlck9iamVjdCA9IGF3YWl0IEFjY291bnRzLnJlc3VtZVNlc3Npb24oYXV0aFRva2VuKTtcblxuXHRpZiAodXNlck9iamVjdCA9PT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBvciBleHBpcmVkIHRva2VuIScpO1xuXHR9XG5cblx0cmV0dXJuIGF3YWl0IGZ1bmMocm9vdCwgYXJncywgT2JqZWN0LmFzc2lnbihjb250ZXh0LCB7IHVzZXI6IHVzZXJPYmplY3QgfSksIGluZm8pO1xufSk7XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvYWNjb3VudHMvT2F1dGhQcm92aWRlci10eXBlLmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHsgY3JlYXRlSlNBY2NvdW50c0dyYXBoUUwgfSBmcm9tICdAYWNjb3VudHMvZ3JhcGhxbC1hcGknO1xuaW1wb3J0IHsgQWNjb3VudHNTZXJ2ZXIgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDphY2NvdW50cyc7XG5pbXBvcnQgeyBtZXJnZVR5cGVzLCBtZXJnZVJlc29sdmVycyB9IGZyb20gJ21lcmdlLWdyYXBocWwtc2NoZW1hcyc7XG5cbi8vIHF1ZXJpZXNcbmltcG9ydCAqIGFzIG9hdXRoUHJvdmlkZXJzIGZyb20gJy4vb2F1dGhQcm92aWRlcnMnO1xuLy8gdHlwZXNcbmltcG9ydCAqIGFzIE9hdXRoUHJvdmlkZXJUeXBlIGZyb20gJy4vT2F1dGhQcm92aWRlci10eXBlJztcblxuY29uc3QgYWNjb3VudHNHcmFwaFFMID0gY3JlYXRlSlNBY2NvdW50c0dyYXBoUUwoQWNjb3VudHNTZXJ2ZXIpO1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hID0gbWVyZ2VUeXBlcyhbXG5cdGFjY291bnRzR3JhcGhRTC5zY2hlbWEsXG5cdG9hdXRoUHJvdmlkZXJzLnNjaGVtYSxcblx0T2F1dGhQcm92aWRlclR5cGUuc2NoZW1hXG5dKTtcblxuZXhwb3J0IGNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0YWNjb3VudHNHcmFwaFFMLmV4dGVuZFdpdGhSZXNvbHZlcnMoe30pLFxuXHRvYXV0aFByb3ZpZGVycy5yZXNvbHZlclxuXSk7XG4iLCJpbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9hY2NvdW50cy9vYXV0aFByb3ZpZGVycy5ncmFwaHFscyc7XG5cbmZ1bmN0aW9uIGlzSlNPTihvYmopIHtcblx0dHJ5IHtcblx0XHRKU09OLnBhcnNlKG9iaik7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFF1ZXJ5OiB7XG5cdFx0b2F1dGhQcm92aWRlcnM6IGFzeW5jKCkgPT4ge1xuXHRcdFx0Ly8gZGVwZW5kcyBvbiByb2NrZXRjaGF0OmdyYW50IHBhY2thZ2Vcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuZ2V0KE1ldGVvci5hYnNvbHV0ZVVybCgnX29hdXRoX2FwcHMvcHJvdmlkZXJzJykpLmNvbnRlbnQ7XG5cblx0XHRcdFx0aWYgKGlzSlNPTihyZXN1bHQpKSB7XG5cdFx0XHRcdFx0Y29uc3QgcHJvdmlkZXJzID0gSlNPTi5wYXJzZShyZXN1bHQpLmRhdGE7XG5cblx0XHRcdFx0XHRyZXR1cm4gcHJvdmlkZXJzLm1hcCgobmFtZSkgPT4gKHsgbmFtZSB9KSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcGFyc2UgdGhlIHJlc3VsdCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcigncm9ja2V0Y2hhdDpncmFudCBub3QgaW5zdGFsbGVkJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5pbXBvcnQgcHJvcGVydHkgZnJvbSAnbG9kYXNoLnByb3BlcnR5JztcblxuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL0NoYW5uZWwtdHlwZS5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRDaGFubmVsOiB7XG5cdFx0aWQ6IHByb3BlcnR5KCdfaWQnKSxcblx0XHRuYW1lOiAocm9vdCwgYXJncywgeyB1c2VyIH0pID0+IHtcblx0XHRcdGlmIChyb290LnQgPT09ICdkJykge1xuXHRcdFx0XHRyZXR1cm4gcm9vdC51c2VybmFtZXMuZmluZCh1ID0+IHUgIT09IHVzZXIudXNlcm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcm9vdC5uYW1lO1xuXHRcdH0sXG5cdFx0bWVtYmVyczogKHJvb3QpID0+IHtcblx0XHRcdGNvbnN0IGlkcyA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkV2hlblVzZXJJZEV4aXN0cyhyb290Ll9pZCwgeyBmaWVsZHM6IHsgJ3UuX2lkJzogMSB9IH0pXG5cdFx0XHRcdC5mZXRjaCgpXG5cdFx0XHRcdC5tYXAoc3ViID0+IHN1Yi51Ll9pZCk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZEJ5SWRzKGlkcykuZmV0Y2goKTtcblx0XHR9LFxuXHRcdG93bmVyczogKHJvb3QpID0+IHtcblx0XHRcdC8vIHRoZXJlIG1pZ2h0IGJlIG5vIG93bmVyXG5cdFx0XHRpZiAoIXJvb3QudSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBbUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocm9vdC51LnVzZXJuYW1lKV07XG5cdFx0fSxcblx0XHRudW1iZXJPZk1lbWJlcnM6IChyb290KSA9PiB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlSb29tSWQocm9vdC5faWQpLmNvdW50KCk7XG5cdFx0fSxcblx0XHRudW1iZXJPZk1lc3NhZ2VzOiBwcm9wZXJ0eSgnbXNncycpLFxuXHRcdHJlYWRPbmx5OiAocm9vdCkgPT4gcm9vdC5ybyA9PT0gdHJ1ZSxcblx0XHRkaXJlY3Q6IChyb290KSA9PiByb290LnQgPT09ICdkJyxcblx0XHRwcml2YXRlQ2hhbm5lbDogKHJvb3QpID0+IHJvb3QudCA9PT0gJ3AnLFxuXHRcdGZhdm91cml0ZTogKHJvb3QsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vdC5faWQsIHVzZXIuX2lkKTtcblxuXHRcdFx0cmV0dXJuIHJvb20gJiYgcm9vbS5mID09PSB0cnVlO1xuXHRcdH0sXG5cdFx0dW5zZWVuTWVzc2FnZXM6IChyb290LCBhcmdzLCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb3QuX2lkLCB1c2VyLl9pZCk7XG5cblx0XHRcdHJldHVybiAocm9vbSB8fCB7fSkudW5yZWFkO1xuXHRcdH1cblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9DaGFubmVsRmlsdGVyLWlucHV0LmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL0NoYW5uZWxOYW1lQW5kRGlyZWN0LWlucHV0LmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL0NoYW5uZWxTb3J0LWVudW0uZ3JhcGhxbHMnO1xuXG5leHBvcnQge1xuXHRzY2hlbWFcbn07XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvY2hhbm5lbHMvUHJpdmFjeS1lbnVtLmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHsgcm9vbVB1YmxpY0ZpZWxkcyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2NoYW5uZWxCeU5hbWUuZ3JhcGhxbHMnO1xuXG5jb25zdCByZXNvbHZlciA9IHtcblx0UXVlcnk6IHtcblx0XHRjaGFubmVsQnlOYW1lOiBhdXRoZW50aWNhdGVkKChyb290LCB7IG5hbWUgfSkgPT4ge1xuXHRcdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRcdG5hbWUsXG5cdFx0XHRcdHQ6ICdjJ1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUocXVlcnksIHtcblx0XHRcdFx0ZmllbGRzOiByb29tUHVibGljRmllbGRzXG5cdFx0XHR9KTtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHsgcm9vbVB1YmxpY0ZpZWxkcyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2NoYW5uZWxzLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFF1ZXJ5OiB7XG5cdFx0Y2hhbm5lbHM6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIGFyZ3MpID0+IHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0ge307XG5cdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRzb3J0OiB7XG5cdFx0XHRcdFx0bmFtZTogMVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmaWVsZHM6IHJvb21QdWJsaWNGaWVsZHNcblx0XHRcdH07XG5cblx0XHRcdC8vIEZpbHRlclxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzLmZpbHRlciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0Ly8gbmFtZUZpbHRlclxuXHRcdFx0XHRpZiAodHlwZW9mIGFyZ3MuZmlsdGVyLm5hbWVGaWx0ZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHF1ZXJ5Lm5hbWUgPSB7XG5cdFx0XHRcdFx0XHQkcmVnZXg6IG5ldyBSZWdFeHAoYXJncy5maWx0ZXIubmFtZUZpbHRlciwgJ2knKVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBzb3J0Qnlcblx0XHRcdFx0aWYgKGFyZ3MuZmlsdGVyLnNvcnRCeSA9PT0gJ05VTUJFUl9PRl9NRVNTQUdFUycpIHtcblx0XHRcdFx0XHRvcHRpb25zLnNvcnQgPSB7XG5cdFx0XHRcdFx0XHRtc2dzOiAtMVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBwcml2YWN5XG5cdFx0XHRcdHN3aXRjaCAoYXJncy5maWx0ZXIucHJpdmFjeSkge1xuXHRcdFx0XHRcdGNhc2UgJ1BSSVZBVEUnOlxuXHRcdFx0XHRcdFx0cXVlcnkudCA9ICdwJztcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ1BVQkxJQyc6XG5cdFx0XHRcdFx0XHRxdWVyeS50ID0ge1xuXHRcdFx0XHRcdFx0XHQkbmU6ICdwJ1xuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKHF1ZXJ5LCBvcHRpb25zKS5mZXRjaCgpO1xuXHRcdH0pXG5cdH1cbn07XG5cblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCB7IHJvb21QdWJsaWNGaWVsZHMgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9jaGFubmVsc0J5VXNlci5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRRdWVyeToge1xuXHRcdGNoYW5uZWxzQnlVc2VyOiBhdXRoZW50aWNhdGVkKChyb290LCB7IHVzZXJJZCB9KSA9PiB7XG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignTm8gdXNlcicpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCByb29tSWRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlVc2VySWQodXNlcklkLCB7IGZpZWxkczogeyByaWQ6IDEgfSB9KS5mZXRjaCgpLm1hcChzID0+IHMucmlkKTtcblx0XHRcdGNvbnN0IHJvb21zID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5SWRzKHJvb21JZHMsIHtcblx0XHRcdFx0c29ydDoge1xuXHRcdFx0XHRcdG5hbWU6IDFcblx0XHRcdFx0fSxcblx0XHRcdFx0ZmllbGRzOiByb29tUHVibGljRmllbGRzXG5cdFx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0XHRyZXR1cm4gcm9vbXM7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9jcmVhdGVDaGFubmVsLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0Y3JlYXRlQ2hhbm5lbDogYXV0aGVudGljYXRlZCgocm9vdCwgYXJncywgeyB1c2VyIH0pID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdFJvY2tldENoYXQuQVBJLmNoYW5uZWxzLmNyZWF0ZS52YWxpZGF0ZSh7XG5cdFx0XHRcdFx0dXNlcjoge1xuXHRcdFx0XHRcdFx0dmFsdWU6IHVzZXIuX2lkXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRuYW1lOiB7XG5cdFx0XHRcdFx0XHR2YWx1ZTogYXJncy5uYW1lLFxuXHRcdFx0XHRcdFx0a2V5OiAnbmFtZSdcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG1lbWJlcnM6IHtcblx0XHRcdFx0XHRcdHZhbHVlOiBhcmdzLm1lbWJlcnNJZCxcblx0XHRcdFx0XHRcdGtleTogJ21lbWJlcnNJZCdcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHR0aHJvdyBlO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB7IGNoYW5uZWwgfSA9IFJvY2tldENoYXQuQVBJLmNoYW5uZWxzLmNyZWF0ZS5leGVjdXRlKHVzZXIuX2lkLCB7XG5cdFx0XHRcdG5hbWU6IGFyZ3MubmFtZSxcblx0XHRcdFx0bWVtYmVyczogYXJncy5tZW1iZXJzSWRcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gY2hhbm5lbDtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHsgcm9vbVB1YmxpY0ZpZWxkcyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2RpcmVjdENoYW5uZWwuZ3JhcGhxbHMnO1xuXG5jb25zdCByZXNvbHZlciA9IHtcblx0UXVlcnk6IHtcblx0XHRkaXJlY3RDaGFubmVsOiBhdXRoZW50aWNhdGVkKChyb290LCB7IHVzZXJuYW1lLCBjaGFubmVsSWQgfSwgeyB1c2VyIH0pID0+IHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0XHR0OiAnZCcsXG5cdFx0XHRcdHVzZXJuYW1lczogdXNlci51c2VybmFtZVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHR5cGVvZiB1c2VybmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0aWYgKHVzZXJuYW1lID09PSB1c2VyLnVzZXJuYW1lKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdZb3UgY2Fubm90IHNwZWNpZnkgeW91ciB1c2VybmFtZScpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cXVlcnkudXNlcm5hbWVzID0geyAkYWxsOiBbIHVzZXIudXNlcm5hbWUsIHVzZXJuYW1lIF0gfTtcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGNoYW5uZWxJZCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cXVlcnkuaWQgPSBjaGFubmVsSWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1VzZSBvbmUgb2YgdGhvc2UgZmllbGRzOiB1c2VybmFtZSwgY2hhbm5lbElkJyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHF1ZXJ5LCB7XG5cdFx0XHRcdGZpZWxkczogcm9vbVB1YmxpY0ZpZWxkc1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2hpZGVDaGFubmVsLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0aGlkZUNoYW5uZWw6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCBjaGFubmVsID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHRcdF9pZDogYXJncy5jaGFubmVsSWQsXG5cdFx0XHRcdHQ6ICdjJ1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICghY2hhbm5lbCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcImNoYW5uZWxJZFwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSBjaGFubmVsJyk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKGNoYW5uZWwuX2lkLCB1c2VyLl9pZCk7XG5cblx0XHRcdGlmICghc3ViKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIHVzZXIvY2FsbGVlIGlzIG5vdCBpbiB0aGUgY2hhbm5lbCBcIiR7IGNoYW5uZWwubmFtZSB9LmApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXN1Yi5vcGVuKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGNoYW5uZWwsICR7IGNoYW5uZWwubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0XHR9XG5cblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgY2hhbm5lbC5faWQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBtZXJnZVR5cGVzLCBtZXJnZVJlc29sdmVycyB9IGZyb20gJ21lcmdlLWdyYXBocWwtc2NoZW1hcyc7XG5cbi8vIHF1ZXJpZXNcbmltcG9ydCAqIGFzIGNoYW5uZWxzIGZyb20gJy4vY2hhbm5lbHMnO1xuaW1wb3J0ICogYXMgY2hhbm5lbEJ5TmFtZSBmcm9tICcuL2NoYW5uZWxCeU5hbWUnO1xuaW1wb3J0ICogYXMgZGlyZWN0Q2hhbm5lbCBmcm9tICcuL2RpcmVjdENoYW5uZWwnO1xuaW1wb3J0ICogYXMgY2hhbm5lbHNCeVVzZXIgZnJvbSAnLi9jaGFubmVsc0J5VXNlcic7XG4vLyBtdXRhdGlvbnNcbmltcG9ydCAqIGFzIGNyZWF0ZUNoYW5uZWwgZnJvbSAnLi9jcmVhdGVDaGFubmVsJztcbmltcG9ydCAqIGFzIGxlYXZlQ2hhbm5lbCBmcm9tICcuL2xlYXZlQ2hhbm5lbCc7XG5pbXBvcnQgKiBhcyBoaWRlQ2hhbm5lbCBmcm9tICcuL2hpZGVDaGFubmVsJztcbi8vIHR5cGVzXG5pbXBvcnQgKiBhcyBDaGFubmVsVHlwZSBmcm9tICcuL0NoYW5uZWwtdHlwZSc7XG5pbXBvcnQgKiBhcyBDaGFubmVsU29ydCBmcm9tICcuL0NoYW5uZWxTb3J0LWVudW0nO1xuaW1wb3J0ICogYXMgQ2hhbm5lbEZpbHRlciBmcm9tICcuL0NoYW5uZWxGaWx0ZXItaW5wdXQnO1xuaW1wb3J0ICogYXMgUHJpdmFjeSBmcm9tICcuL1ByaXZhY3ktZW51bSc7XG5pbXBvcnQgKiBhcyBDaGFubmVsTmFtZUFuZERpcmVjdCBmcm9tICcuL0NoYW5uZWxOYW1lQW5kRGlyZWN0LWlucHV0JztcblxuZXhwb3J0IGNvbnN0IHNjaGVtYSA9IG1lcmdlVHlwZXMoW1xuXHQvLyBxdWVyaWVzXG5cdGNoYW5uZWxzLnNjaGVtYSxcblx0Y2hhbm5lbEJ5TmFtZS5zY2hlbWEsXG5cdGRpcmVjdENoYW5uZWwuc2NoZW1hLFxuXHRjaGFubmVsc0J5VXNlci5zY2hlbWEsXG5cdC8vIG11dGF0aW9uc1xuXHRjcmVhdGVDaGFubmVsLnNjaGVtYSxcblx0bGVhdmVDaGFubmVsLnNjaGVtYSxcblx0aGlkZUNoYW5uZWwuc2NoZW1hLFxuXHQvLyB0eXBlc1xuXHRDaGFubmVsVHlwZS5zY2hlbWEsXG5cdENoYW5uZWxTb3J0LnNjaGVtYSxcblx0Q2hhbm5lbEZpbHRlci5zY2hlbWEsXG5cdFByaXZhY3kuc2NoZW1hLFxuXHRDaGFubmVsTmFtZUFuZERpcmVjdC5zY2hlbWFcbl0pO1xuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzID0gbWVyZ2VSZXNvbHZlcnMoW1xuXHQvLyBxdWVyaWVzXG5cdGNoYW5uZWxzLnJlc29sdmVyLFxuXHRjaGFubmVsQnlOYW1lLnJlc29sdmVyLFxuXHRkaXJlY3RDaGFubmVsLnJlc29sdmVyLFxuXHRjaGFubmVsc0J5VXNlci5yZXNvbHZlcixcblx0Ly8gbXV0YXRpb25zXG5cdGNyZWF0ZUNoYW5uZWwucmVzb2x2ZXIsXG5cdGxlYXZlQ2hhbm5lbC5yZXNvbHZlcixcblx0aGlkZUNoYW5uZWwucmVzb2x2ZXIsXG5cdC8vIHR5cGVzXG5cdENoYW5uZWxUeXBlLnJlc29sdmVyXG5dKTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2xlYXZlQ2hhbm5lbC5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdGxlYXZlQ2hhbm5lbDogYXV0aGVudGljYXRlZCgocm9vdCwgYXJncywgeyB1c2VyIH0pID0+IHtcblx0XHRcdGNvbnN0IGNoYW5uZWwgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHtcblx0XHRcdFx0X2lkOiBhcmdzLmNoYW5uZWxJZCxcblx0XHRcdFx0dDogJ2MnXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCFjaGFubmVsKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignZXJyb3Itcm9vbS1ub3QtZm91bmQnLCAnVGhlIHJlcXVpcmVkIFwiY2hhbm5lbElkXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGNoYW5uZWwnKTtcblx0XHRcdH1cblxuXHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRNZXRlb3IuY2FsbCgnbGVhdmVSb29tJywgY2hhbm5lbC5faWQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJleHBvcnQgY29uc3Qgcm9vbVB1YmxpY0ZpZWxkcyA9IHtcblx0dDogMSxcblx0bmFtZTogMSxcblx0ZGVzY3JpcHRpb246IDEsXG5cdGFubm91bmNlbWVudDogMSxcblx0dG9waWM6IDEsXG5cdHVzZXJuYW1lczogMSxcblx0bXNnczogMSxcblx0cm86IDEsXG5cdHU6IDEsXG5cdGFyY2hpdmVkOiAxXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5pbXBvcnQgcHJvcGVydHkgZnJvbSAnbG9kYXNoLnByb3BlcnR5JztcblxuaW1wb3J0IHsgZGF0ZVRvRmxvYXQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2RhdGVUb0Zsb2F0JztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9tZXNzYWdlcy9NZXNzYWdlLXR5cGUuZ3JhcGhxbHMnO1xuXG5jb25zdCByZXNvbHZlciA9IHtcblx0TWVzc2FnZToge1xuXHRcdGlkOiBwcm9wZXJ0eSgnX2lkJyksXG5cdFx0Y29udGVudDogcHJvcGVydHkoJ21zZycpLFxuXHRcdGNyZWF0aW9uVGltZTogKHJvb3QpID0+IGRhdGVUb0Zsb2F0KHJvb3QudHMpLFxuXHRcdGF1dGhvcjogKHJvb3QpID0+IHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHJvb3QudS5faWQpO1xuXG5cdFx0XHRyZXR1cm4gdXNlciB8fCByb290LnU7XG5cdFx0fSxcblx0XHRjaGFubmVsOiAocm9vdCkgPT4ge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUocm9vdC5yaWQpO1xuXHRcdH0sXG5cdFx0ZnJvbVNlcnZlcjogKHJvb3QpID0+IHR5cGVvZiByb290LnQgIT09ICd1bmRlZmluZWQnLCAvLyBvbiBhIG1lc3NhZ2Ugc2VudCBieSB1c2VyIGB0cnVlYCBvdGhlcndpc2UgYGZhbHNlYFxuXHRcdHR5cGU6IHByb3BlcnR5KCd0JyksXG5cdFx0Y2hhbm5lbFJlZjogKHJvb3QpID0+IHtcblx0XHRcdGlmICghcm9vdC5jaGFubmVscykge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKHtcblx0XHRcdFx0X2lkOiB7XG5cdFx0XHRcdFx0JGluOiByb290LmNoYW5uZWxzLm1hcChjID0+IGMuX2lkKVxuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0XHRuYW1lOiAxXG5cdFx0XHRcdH1cblx0XHRcdH0pLmZldGNoKCk7XG5cdFx0fSxcblx0XHR1c2VyUmVmOiAocm9vdCkgPT4ge1xuXHRcdFx0aWYgKCFyb290Lm1lbnRpb25zKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoe1xuXHRcdFx0XHRfaWQ6IHtcblx0XHRcdFx0XHQkaW46IHJvb3QubWVudGlvbnMubWFwKGMgPT4gYy5faWQpXG5cdFx0XHRcdH1cblx0XHRcdH0sIHtcblx0XHRcdFx0c29ydDoge1xuXHRcdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHRcdH1cblx0XHRcdH0pLmZldGNoKCk7XG5cdFx0fSxcblx0XHRyZWFjdGlvbnM6IChyb290KSA9PiB7XG5cdFx0XHRpZiAoIXJvb3QucmVhY3Rpb25zIHx8IE9iamVjdC5rZXlzKHJvb3QucmVhY3Rpb25zKS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCByZWFjdGlvbnMgPSBbXTtcblxuXHRcdFx0T2JqZWN0LmtleXMocm9vdC5yZWFjdGlvbnMpLmZvckVhY2goaWNvbiA9PiB7XG5cdFx0XHRcdHJvb3QucmVhY3Rpb25zW2ljb25dLnVzZXJuYW1lcy5mb3JFYWNoKHVzZXJuYW1lID0+IHtcblx0XHRcdFx0XHRyZWFjdGlvbnMucHVzaCh7XG5cdFx0XHRcdFx0XHRpY29uLFxuXHRcdFx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJlYWN0aW9ucztcblx0XHR9XG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvbWVzc2FnZXMvTWVzc2FnZUlkZW50aWZpZXItaW5wdXQuZ3JhcGhxbHMnO1xuXG5leHBvcnQge1xuXHRzY2hlbWFcbn07XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvbWVzc2FnZXMvTWVzc2FnZXNXaXRoQ3Vyc29yLXR5cGUuZ3JhcGhxbHMnO1xuXG5leHBvcnQge1xuXHRzY2hlbWFcbn07XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvbWVzc2FnZXMvUmVhY3Rpb24tdHlwZS5ncmFwaHFscyc7XG5cbmV4cG9ydCB7XG5cdHNjaGVtYVxufTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL2FkZFJlYWN0aW9uVG9NZXNzYWdlLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0YWRkUmVhY3Rpb25Ub01lc3NhZ2U6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIHsgaWQsIGljb24gfSwgeyB1c2VyIH0pID0+IHtcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFJlYWN0aW9uJywgaWQubWVzc2FnZUlkLCBpY29uLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmUoaWQubWVzc2FnZUlkKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IHdpdGhGaWx0ZXIgfSBmcm9tICdncmFwaHFsLXN1YnNjcmlwdGlvbnMnO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IHB1YnN1YiB9IGZyb20gJy4uLy4uL3N1YnNjcmlwdGlvbnMnO1xuaW1wb3J0IHsgYXV0aGVudGljYXRlZCB9IGZyb20gJy4uLy4uL2hlbHBlcnMvYXV0aGVudGljYXRlZCc7XG5pbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvbWVzc2FnZXMvY2hhdE1lc3NhZ2VBZGRlZC5ncmFwaHFscyc7XG5cbmV4cG9ydCBjb25zdCBDSEFUX01FU1NBR0VfU1VCU0NSSVBUSU9OX1RPUElDID0gJ0NIQVRfTUVTU0FHRV9BRERFRCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoTWVzc2FnZShtZXNzYWdlKSB7XG5cdHB1YnN1Yi5wdWJsaXNoKENIQVRfTUVTU0FHRV9TVUJTQ1JJUFRJT05fVE9QSUMsIHsgY2hhdE1lc3NhZ2VBZGRlZDogbWVzc2FnZSB9KTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkUHVibGlzaChtZXNzYWdlLCB7IGlkLCBkaXJlY3RUbyB9LCB1c2VybmFtZSkge1xuXHRpZiAoaWQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZS5yaWQgPT09IGlkO1xuXHR9IGVsc2UgaWYgKGRpcmVjdFRvKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUoe1xuXHRcdFx0dXNlcm5hbWVzOiB7ICRhbGw6IFtkaXJlY3RUbywgdXNlcm5hbWVdIH0sXG5cdFx0XHR0OiAnZCdcblx0XHR9KTtcblxuXHRcdHJldHVybiByb29tICYmIHJvb20uX2lkID09PSBtZXNzYWdlLnJpZDtcblx0fVxuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFN1YnNjcmlwdGlvbjoge1xuXHRcdGNoYXRNZXNzYWdlQWRkZWQ6IHtcblx0XHRcdHN1YnNjcmliZTogd2l0aEZpbHRlcigoKSA9PiBwdWJzdWIuYXN5bmNJdGVyYXRvcihDSEFUX01FU1NBR0VfU1VCU0NSSVBUSU9OX1RPUElDKSwgYXV0aGVudGljYXRlZCgocGF5bG9hZCwgYXJncywgeyB1c2VyIH0pID0+IHtcblx0XHRcdFx0Y29uc3QgY2hhbm5lbCA9IHtcblx0XHRcdFx0XHRpZDogYXJncy5jaGFubmVsSWQsXG5cdFx0XHRcdFx0ZGlyZWN0VG86IGFyZ3MuZGlyZWN0VG9cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRyZXR1cm4gc2hvdWxkUHVibGlzaChwYXlsb2FkLmNoYXRNZXNzYWdlQWRkZWQsIGNoYW5uZWwsIHVzZXIudXNlcm5hbWUpO1xuXHRcdFx0fSkpXG5cdFx0fVxuXHR9XG59O1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCAobWVzc2FnZSkgPT4ge1xuXHRwdWJsaXNoTWVzc2FnZShtZXNzYWdlKTtcbn0sIG51bGwsICdjaGF0TWVzc2FnZUFkZGVkU3Vic2NyaXB0aW9uJyk7XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9tZXNzYWdlcy9kZWxldGVNZXNzYWdlLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0ZGVsZXRlTWVzc2FnZTogYXV0aGVudGljYXRlZCgocm9vdCwgeyBpZCB9LCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQoaWQubWVzc2FnZUlkLCB7IGZpZWxkczogeyB1OiAxLCByaWQ6IDEgfX0pO1xuXG5cdFx0XHRpZiAoIW1zZykge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE5vIG1lc3NhZ2UgZm91bmQgd2l0aCB0aGUgaWQgb2YgXCIkeyBpZC5tZXNzYWdlSWQgfVwiLmApO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaWQuY2hhbm5lbElkICE9PSBtc2cucmlkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVGhlIHJvb20gaWQgcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggd2hlcmUgdGhlIG1lc3NhZ2UgaXMgZnJvbS4nKTtcblx0XHRcdH1cblxuXHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRNZXRlb3IuY2FsbCgnZGVsZXRlTWVzc2FnZScsIHsgX2lkOiBtc2cuX2lkIH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBtc2c7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL2VkaXRNZXNzYWdlLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0ZWRpdE1lc3NhZ2U6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIHsgaWQsIGNvbnRlbnQgfSwgeyB1c2VyIH0pID0+IHtcblx0XHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKGlkLm1lc3NhZ2VJZCk7XG5cblx0XHRcdC8vRW5zdXJlIHRoZSBtZXNzYWdlIGV4aXN0c1xuXHRcdFx0aWYgKCFtc2cpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBObyBtZXNzYWdlIGZvdW5kIHdpdGggdGhlIGlkIG9mIFwiJHsgaWQubWVzc2FnZUlkIH1cIi5gKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGlkLmNoYW5uZWxJZCAhPT0gbXNnLnJpZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSBjaGFubmVsIGlkIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIHdoZXJlIHRoZSBtZXNzYWdlIGlzIGZyb20uJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vUGVybWlzc2lvbiBjaGVja3MgYXJlIGFscmVhZHkgZG9uZSBpbiB0aGUgdXBkYXRlTWVzc2FnZSBtZXRob2QsIHNvIG5vIG5lZWQgdG8gZHVwbGljYXRlIHRoZW1cblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3VwZGF0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCwgbXNnOiBjb250ZW50LCByaWQ6IG1zZy5yaWQgfSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKG1zZy5faWQpO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBtZXJnZVR5cGVzLCBtZXJnZVJlc29sdmVycyB9IGZyb20gJ21lcmdlLWdyYXBocWwtc2NoZW1hcyc7XG5cbi8vIHF1ZXJpZXNcbmltcG9ydCAqIGFzIG1lc3NhZ2VzIGZyb20gJy4vbWVzc2FnZXMnO1xuLy8gbXV0YXRpb25zXG5pbXBvcnQgKiBhcyBzZW5kTWVzc2FnZSBmcm9tICcuL3NlbmRNZXNzYWdlJztcbmltcG9ydCAqIGFzIGVkaXRNZXNzYWdlIGZyb20gJy4vZWRpdE1lc3NhZ2UnO1xuaW1wb3J0ICogYXMgZGVsZXRlTWVzc2FnZSBmcm9tICcuL2RlbGV0ZU1lc3NhZ2UnO1xuaW1wb3J0ICogYXMgYWRkUmVhY3Rpb25Ub01lc3NhZ2UgZnJvbSAnLi9hZGRSZWFjdGlvblRvTWVzc2FnZSc7XG4vLyBzdWJzY3JpcHRpb25zXG5pbXBvcnQgKiBhcyBjaGF0TWVzc2FnZUFkZGVkIGZyb20gJy4vY2hhdE1lc3NhZ2VBZGRlZCc7XG4vLyB0eXBlc1xuaW1wb3J0ICogYXMgTWVzc2FnZVR5cGUgZnJvbSAnLi9NZXNzYWdlLXR5cGUnO1xuaW1wb3J0ICogYXMgTWVzc2FnZXNXaXRoQ3Vyc29yVHlwZSBmcm9tICcuL01lc3NhZ2VzV2l0aEN1cnNvci10eXBlJztcbmltcG9ydCAqIGFzIE1lc3NhZ2VJZGVudGlmaWVyIGZyb20gJy4vTWVzc2FnZUlkZW50aWZpZXItaW5wdXQnO1xuaW1wb3J0ICogYXMgUmVhY3Rpb25UeXBlIGZyb20gJy4vUmVhY3Rpb24tdHlwZSc7XG5cbmV4cG9ydCBjb25zdCBzY2hlbWEgPSBtZXJnZVR5cGVzKFtcblx0Ly8gcXVlcmllc1xuXHRtZXNzYWdlcy5zY2hlbWEsXG5cdC8vIG11dGF0aW9uc1xuXHRzZW5kTWVzc2FnZS5zY2hlbWEsXG5cdGVkaXRNZXNzYWdlLnNjaGVtYSxcblx0ZGVsZXRlTWVzc2FnZS5zY2hlbWEsXG5cdGFkZFJlYWN0aW9uVG9NZXNzYWdlLnNjaGVtYSxcblx0Ly8gc3Vic2NyaXB0aW9uc1xuXHRjaGF0TWVzc2FnZUFkZGVkLnNjaGVtYSxcblx0Ly8gdHlwZXNcblx0TWVzc2FnZVR5cGUuc2NoZW1hLFxuXHRNZXNzYWdlc1dpdGhDdXJzb3JUeXBlLnNjaGVtYSxcblx0TWVzc2FnZUlkZW50aWZpZXIuc2NoZW1hLFxuXHRSZWFjdGlvblR5cGUuc2NoZW1hXG5dKTtcblxuZXhwb3J0IGNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0Ly8gcXVlcmllc1xuXHRtZXNzYWdlcy5yZXNvbHZlcixcblx0Ly8gbXV0YXRpb25zXG5cdHNlbmRNZXNzYWdlLnJlc29sdmVyLFxuXHRlZGl0TWVzc2FnZS5yZXNvbHZlcixcblx0ZGVsZXRlTWVzc2FnZS5yZXNvbHZlcixcblx0YWRkUmVhY3Rpb25Ub01lc3NhZ2UucmVzb2x2ZXIsXG5cdC8vIHN1YnNjcmlwdGlvbnNcblx0Y2hhdE1lc3NhZ2VBZGRlZC5yZXNvbHZlcixcblx0Ly8gdHlwZXNcblx0TWVzc2FnZVR5cGUucmVzb2x2ZXJcbl0pO1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL21lc3NhZ2VzLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFF1ZXJ5OiB7XG5cdFx0bWVzc2FnZXM6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCBtZXNzYWdlc1F1ZXJ5ID0ge307XG5cdFx0XHRjb25zdCBtZXNzYWdlc09wdGlvbnMgPSB7XG5cdFx0XHRcdHNvcnQ6IHsgdHM6IC0xIH1cblx0XHRcdH07XG5cdFx0XHRjb25zdCBjaGFubmVsUXVlcnkgPSB7fTtcblx0XHRcdGNvbnN0IGlzUGFnaW5hdGlvbiA9ICEhYXJncy5jdXJzb3IgfHwgYXJncy5jb3VudCA+IDA7XG5cdFx0XHRsZXQgY3Vyc29yO1xuXG5cdFx0XHRpZiAoYXJncy5jaGFubmVsSWQpIHtcblx0XHRcdFx0Ly8gY2hhbm5lbElkXG5cdFx0XHRcdGNoYW5uZWxRdWVyeS5faWQgPSBhcmdzLmNoYW5uZWxJZDtcblx0XHRcdH0gZWxzZSBpZiAoYXJncy5kaXJlY3RUbykge1xuXHRcdFx0XHQvLyBkaXJlY3QgbWVzc2FnZSB3aGVyZSBkaXJlY3RUbyBpcyBhIHVzZXIgaWRcblx0XHRcdFx0Y2hhbm5lbFF1ZXJ5LnQgPSAnZCc7XG5cdFx0XHRcdGNoYW5uZWxRdWVyeS51c2VybmFtZXMgPSB7ICRhbGw6IFthcmdzLmRpcmVjdFRvLCB1c2VyLnVzZXJuYW1lXSB9O1xuXHRcdFx0fSBlbHNlIGlmIChhcmdzLmNoYW5uZWxOYW1lKSB7XG5cdFx0XHRcdC8vIG5vbi1kaXJlY3QgY2hhbm5lbFxuXHRcdFx0XHRjaGFubmVsUXVlcnkudCA9IHsgJG5lOiAnZCcgfTtcblx0XHRcdFx0Y2hhbm5lbFF1ZXJ5Lm5hbWUgPSBhcmdzLmNoYW5uZWxOYW1lO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignbWVzc2FnZXMgcXVlcnkgbXVzdCBiZSBjYWxsZWQgd2l0aCBjaGFubmVsSWQgb3IgZGlyZWN0VG8nKTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGNoYW5uZWwgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKGNoYW5uZWxRdWVyeSk7XG5cblx0XHRcdGxldCBtZXNzYWdlc0FycmF5ID0gW107XG5cblx0XHRcdGlmIChjaGFubmVsKSB7XG5cdFx0XHRcdC8vIGN1cnNvclxuXHRcdFx0XHRpZiAoaXNQYWdpbmF0aW9uICYmIGFyZ3MuY3Vyc29yKSB7XG5cdFx0XHRcdFx0Y29uc3QgY3Vyc29yTXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZShhcmdzLmN1cnNvciwgeyBmaWVsZHM6IHsgdHM6IDEgfSB9KTtcblx0XHRcdFx0XHRtZXNzYWdlc1F1ZXJ5LnRzID0geyAkbHQ6IGN1cnNvck1zZy50cyB9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gc2VhcmNoXG5cdFx0XHRcdGlmICh0eXBlb2YgYXJncy5zZWFyY2hSZWdleCA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRtZXNzYWdlc1F1ZXJ5Lm1zZyA9IHtcblx0XHRcdFx0XHRcdCRyZWdleDogbmV3IFJlZ0V4cChhcmdzLnNlYXJjaFJlZ2V4LCAnaScpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGNvdW50XG5cdFx0XHRcdGlmIChpc1BhZ2luYXRpb24gJiYgYXJncy5jb3VudCkge1xuXHRcdFx0XHRcdG1lc3NhZ2VzT3B0aW9ucy5saW1pdCA9IGFyZ3MuY291bnQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBleGNsdWRlIG1lc3NhZ2VzIGdlbmVyYXRlZCBieSBzZXJ2ZXJcblx0XHRcdFx0aWYgKGFyZ3MuZXhjbHVkZVNlcnZlciA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdG1lc3NhZ2VzUXVlcnkudCA9IHsgJGV4aXN0czogZmFsc2UgfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIGxvb2sgZm9yIG1lc3NhZ2VzIHRoYXQgYmVsb25ncyB0byBzcGVjaWZpYyBjaGFubmVsXG5cdFx0XHRcdG1lc3NhZ2VzUXVlcnkucmlkID0gY2hhbm5lbC5faWQ7XG5cblx0XHRcdFx0Y29uc3QgbWVzc2FnZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG1lc3NhZ2VzUXVlcnksIG1lc3NhZ2VzT3B0aW9ucyk7XG5cblx0XHRcdFx0bWVzc2FnZXNBcnJheSA9IG1lc3NhZ2VzLmZldGNoKCk7XG5cblx0XHRcdFx0aWYgKGlzUGFnaW5hdGlvbikge1xuXHRcdFx0XHRcdC8vIG9sZGVzdCBmaXJzdCAoYmVjYXVzZSBvZiBmaW5kT25lKVxuXHRcdFx0XHRcdG1lc3NhZ2VzT3B0aW9ucy5zb3J0LnRzID0gMTtcblxuXHRcdFx0XHRcdGNvbnN0IGZpcnN0TWVzc2FnZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmUobWVzc2FnZXNRdWVyeSwgbWVzc2FnZXNPcHRpb25zKTtcblx0XHRcdFx0XHRjb25zdCBsYXN0SWQgPSAobWVzc2FnZXNBcnJheVttZXNzYWdlc0FycmF5Lmxlbmd0aCAtIDFdIHx8IHt9KS5faWQ7XG5cblx0XHRcdFx0XHRjdXJzb3IgPSAhbGFzdElkIHx8IGxhc3RJZCA9PT0gZmlyc3RNZXNzYWdlLl9pZCA/IG51bGwgOiBsYXN0SWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0Y3Vyc29yLFxuXHRcdFx0XHRjaGFubmVsLFxuXHRcdFx0XHRtZXNzYWdlc0FycmF5XG5cdFx0XHR9O1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCIvKiBnbG9iYWwgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlICovXG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL3NlbmRNZXNzYWdlLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0c2VuZE1lc3NhZ2U6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIHsgY2hhbm5lbElkLCBkaXJlY3RUbywgY29udGVudCB9LCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdFx0dGV4dDogY29udGVudCxcblx0XHRcdFx0Y2hhbm5lbDogY2hhbm5lbElkIHx8IGRpcmVjdFRvXG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBtZXNzYWdlUmV0dXJuID0gcHJvY2Vzc1dlYmhvb2tNZXNzYWdlKG9wdGlvbnMsIHVzZXIpWzBdO1xuXG5cdFx0XHRpZiAoIW1lc3NhZ2VSZXR1cm4pIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVycm9yJyk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBtZXNzYWdlUmV0dXJuLm1lc3NhZ2U7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuaW1wb3J0IHByb3BlcnR5IGZyb20gJ2xvZGFzaC5wcm9wZXJ0eSc7XG5cbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy91c2Vycy9Vc2VyLXR5cGUuZ3JhcGhxbHMnO1xuXG5jb25zdCByZXNvbHZlciA9IHtcblx0VXNlcjoge1xuXHRcdGlkOiBwcm9wZXJ0eSgnX2lkJyksXG5cdFx0c3RhdHVzOiAoe3N0YXR1c30pID0+IHN0YXR1cy50b1VwcGVyQ2FzZSgpLFxuXHRcdGF2YXRhcjogYXN5bmMoeyBfaWQgfSkgPT4ge1xuXHRcdFx0Ly8gWFhYIGpzLWFjY291bnRzL2dyYXBocWwjMTZcblx0XHRcdGNvbnN0IGF2YXRhciA9IGF3YWl0IFJvY2tldENoYXQubW9kZWxzLkF2YXRhcnMubW9kZWwucmF3Q29sbGVjdGlvbigpLmZpbmRPbmUoe1xuXHRcdFx0XHR1c2VySWQ6IF9pZFxuXHRcdFx0fSwgeyBmaWVsZHM6IHsgdXJsOiAxIH19KTtcblxuXHRcdFx0aWYgKGF2YXRhcikge1xuXHRcdFx0XHRyZXR1cm4gYXZhdGFyLnVybDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGNoYW5uZWxzOiBNZXRlb3IuYmluZEVudmlyb25tZW50KGFzeW5jKHsgX2lkIH0pID0+IHtcblx0XHRcdHJldHVybiBhd2FpdCBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlTdWJzY3JpcHRpb25Vc2VySWQoX2lkKS5mZXRjaCgpO1xuXHRcdH0pLFxuXHRcdGRpcmVjdE1lc3NhZ2VzOiAoeyB1c2VybmFtZSB9KSA9PiB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZERpcmVjdFJvb21Db250YWluaW5nVXNlcm5hbWUodXNlcm5hbWUpLmZldGNoKCk7XG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL3VzZXJzL1VzZXJTdGF0dXMtZW51bS5ncmFwaHFscyc7XG5cbmV4cG9ydCB7XG5cdHNjaGVtYVxufTtcbiIsImltcG9ydCB7IG1lcmdlVHlwZXMsIG1lcmdlUmVzb2x2ZXJzIH0gZnJvbSAnbWVyZ2UtZ3JhcGhxbC1zY2hlbWFzJztcblxuLy8gbXV0YXRpb25zXG5pbXBvcnQgKiBhcyBzZXRTdGF0dXMgZnJvbSAnLi9zZXRTdGF0dXMnO1xuLy8gdHlwZXNcbmltcG9ydCAqIGFzIFVzZXJUeXBlIGZyb20gJy4vVXNlci10eXBlJztcbmltcG9ydCAqIGFzIFVzZXJTdGF0dXMgZnJvbSAnLi9Vc2VyU3RhdHVzLWVudW0nO1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hID0gbWVyZ2VUeXBlcyhbXG5cdC8vIG11dGF0aW9uc1xuXHRzZXRTdGF0dXMuc2NoZW1hLFxuXHQvLyB0eXBlc1xuXHRVc2VyVHlwZS5zY2hlbWEsXG5cdFVzZXJTdGF0dXMuc2NoZW1hXG5dKTtcblxuZXhwb3J0IGNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0Ly8gbXV0YXRpb25zXG5cdHNldFN0YXR1cy5yZXNvbHZlcixcblx0Ly8gdHlwZXNcblx0VXNlclR5cGUucmVzb2x2ZXJcbl0pO1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL3VzZXJzL3NldFN0YXR1cy5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdHNldFN0YXR1czogYXV0aGVudGljYXRlZCgocm9vdCwgeyBzdGF0dXMgfSwgeyB1c2VyIH0pID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwge1xuXHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0c3RhdHVzOiBzdGF0dXMudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUodXNlci5faWQpO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iXX0=
