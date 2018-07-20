(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var roles;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:authorization":{"lib":{"rocketchat.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/lib/rocketchat.js                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"models":{"Permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Permissions.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
class ModelPermissions extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
  } // FIND


  findByRole(role, options) {
    const query = {
      roles: role
    };
    return this.find(query, options);
  }

  findOneById(_id) {
    return this.findOne(_id);
  }

  createOrUpdate(name, roles) {
    this.upsert({
      _id: name
    }, {
      $set: {
        roles
      }
    });
  }

  addRole(permission, role) {
    this.update({
      _id: permission
    }, {
      $addToSet: {
        roles: role
      }
    });
  }

  removeRole(permission, role) {
    this.update({
      _id: permission
    }, {
      $pull: {
        roles: role
      }
    });
  }

}

RocketChat.models.Permissions = new ModelPermissions('permissions');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Roles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Roles.js                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
class ModelRoles extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'scope': 1
    });
  }

  findUsersInRole(name, scope, options) {
    const role = this.findOne(name);
    const roleScope = role && role.scope || 'Users';
    const model = RocketChat.models[roleScope];
    return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
  }

  isUserInRoles(userId, roles, scope) {
    roles = [].concat(roles);
    return roles.some(roleName => {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
    });
  }

  createOrUpdate(name, scope = 'Users', description, protectedRole) {
    const updateData = {};
    updateData.name = name;
    updateData.scope = scope;

    if (description != null) {
      updateData.description = description;
    }

    if (protectedRole) {
      updateData.protected = protectedRole;
    }

    this.upsert({
      _id: name
    }, {
      $set: updateData
    });
  }

  addUserRoles(userId, roles, scope) {
    roles = [].concat(roles);

    for (const roleName of roles) {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      model && model.addRolesByUserId && model.addRolesByUserId(userId, roleName, scope);
    }

    return true;
  }

  removeUserRoles(userId, roles, scope) {
    roles = [].concat(roles);

    for (const roleName of roles) {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      model && model.removeRolesByUserId && model.removeRolesByUserId(userId, roleName, scope);
    }

    return true;
  }

}

RocketChat.models.Roles = new ModelRoles('roles');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Base.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Base.js                                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.models._Base.prototype.roleBaseQuery = function ()
/*userId, scope*/
{
  return;
};

RocketChat.models._Base.prototype.findRolesByUserId = function (userId
/*, options*/
) {
  const query = this.roleBaseQuery(userId);
  return this.find(query, {
    fields: {
      roles: 1
    }
  });
};

RocketChat.models._Base.prototype.isUserInRole = function (userId, roleName, scope) {
  const query = this.roleBaseQuery(userId, scope);

  if (query == null) {
    return false;
  }

  query.roles = roleName;
  return !_.isUndefined(this.findOne(query, {
    fields: {
      roles: 1
    }
  }));
};

RocketChat.models._Base.prototype.addRolesByUserId = function (userId, roles, scope) {
  roles = [].concat(roles);
  const query = this.roleBaseQuery(userId, scope);
  const update = {
    $addToSet: {
      roles: {
        $each: roles
      }
    }
  };
  return this.update(query, update);
};

RocketChat.models._Base.prototype.removeRolesByUserId = function (userId, roles, scope) {
  roles = [].concat(roles);
  const query = this.roleBaseQuery(userId, scope);
  const update = {
    $pullAll: {
      roles
    }
  };
  return this.update(query, update);
};

RocketChat.models._Base.prototype.findUsersInRoles = function () {
  throw new Meteor.Error('overwrite-function', 'You must overwrite this function in the extended classes');
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Users.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Users.js                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.models.Users.roleBaseQuery = function (userId) {
  return {
    _id: userId
  };
};

RocketChat.models.Users.findUsersInRoles = function (roles, scope, options) {
  roles = [].concat(roles);
  const query = {
    roles: {
      $in: roles
    }
  };
  return this.find(query, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Subscriptions.js                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.models.Subscriptions.roleBaseQuery = function (userId, scope) {
  if (scope == null) {
    return;
  }

  const query = {
    'u._id': userId
  };

  if (!_.isUndefined(scope)) {
    query.rid = scope;
  }

  return query;
};

RocketChat.models.Subscriptions.findUsersInRoles = function (roles, scope, options) {
  roles = [].concat(roles);
  const query = {
    roles: {
      $in: roles
    }
  };

  if (scope) {
    query.rid = scope;
  }

  const subscriptions = this.find(query).fetch();

  const users = _.compact(_.map(subscriptions, function (subscription) {
    if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id) {
      return subscription.u._id;
    }
  }));

  return RocketChat.models.Users.find({
    _id: {
      $in: users
    }
  }, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"addUserRoles.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/addUserRoles.js                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.authz.addUserRoles = function (userId, roleNames, scope) {
  if (!userId || !roleNames) {
    return false;
  }

  const user = RocketChat.models.Users.db.findOneById(userId);

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.authz.addUserRoles'
    });
  }

  roleNames = [].concat(roleNames);

  const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');

  const invalidRoleNames = _.difference(roleNames, existingRoleNames);

  if (!_.isEmpty(invalidRoleNames)) {
    for (const role of invalidRoleNames) {
      RocketChat.models.Roles.createOrUpdate(role);
    }
  }

  RocketChat.models.Roles.addUserRoles(userId, roleNames, scope);
  return true;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"canAccessRoom.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/canAccessRoom.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals RocketChat */
RocketChat.authz.roomAccessValidators = [function (room, user = {}) {
  if (room && room.t === 'c') {
    if (!user._id && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
      return true;
    }

    return RocketChat.authz.hasPermission(user._id, 'view-c-room');
  }
}, function (room, user = {}) {
  if (!room || !user) {
    return;
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

  if (subscription) {
    return RocketChat.models.Rooms.findOneById(subscription.rid);
  }
}];

RocketChat.authz.canAccessRoom = function (room, user, extraData) {
  return RocketChat.authz.roomAccessValidators.some(validator => {
    return validator.call(this, room, user, extraData);
  });
};

RocketChat.authz.addRoomAccessValidator = function (validator) {
  RocketChat.authz.roomAccessValidators.push(validator);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/getRoles.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.getRoles = function () {
  return RocketChat.models.Roles.find().fetch();
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUsersInRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/getUsersInRole.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.getUsersInRole = function (roleName, scope, options) {
  return RocketChat.models.Roles.findUsersInRole(roleName, scope, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hasPermission.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/hasPermission.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
function atLeastOne(userId, permissions = [], scope) {
  return permissions.some(permissionId => {
    const permission = RocketChat.models.Permissions.findOne(permissionId);
    return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
  });
}

function all(userId, permissions = [], scope) {
  return permissions.every(permissionId => {
    const permission = RocketChat.models.Permissions.findOne(permissionId);
    return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
  });
}

function hasPermission(userId, permissions, scope, strategy) {
  if (!userId) {
    return false;
  }

  permissions = [].concat(permissions);
  return strategy(userId, permissions, scope);
}

RocketChat.authz.hasAllPermission = function (userId, permissions, scope) {
  return hasPermission(userId, permissions, scope, all);
};

RocketChat.authz.hasPermission = RocketChat.authz.hasAllPermission;

RocketChat.authz.hasAtLeastOnePermission = function (userId, permissions, scope) {
  return hasPermission(userId, permissions, scope, atLeastOne);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hasRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/hasRole.js                                                //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.hasRole = function (userId, roleNames, scope) {
  roleNames = [].concat(roleNames);
  return RocketChat.models.Roles.isUserInRoles(userId, roleNames, scope);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRoles.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/removeUserFromRoles.js                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.authz.removeUserFromRoles = function (userId, roleNames, scope) {
  if (!userId || !roleNames) {
    return false;
  }

  const user = RocketChat.models.Users.findOneById(userId);

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.authz.removeUserFromRoles'
    });
  }

  roleNames = [].concat(roleNames);

  const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');

  const invalidRoleNames = _.difference(roleNames, existingRoleNames);

  if (!_.isEmpty(invalidRoleNames)) {
    throw new Meteor.Error('error-invalid-role', 'Invalid role', {
      function: 'RocketChat.authz.removeUserFromRoles'
    });
  }

  RocketChat.models.Roles.removeUserRoles(userId, roleNames, scope);
  return true;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/permissions.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'permissions/get'(updatedAt) {
    this.unblock(); // TODO: should we return this for non logged users?
    // TODO: we could cache this collection

    const records = RocketChat.models.Permissions.find().fetch();

    if (updatedAt instanceof Date) {
      return {
        update: records.filter(record => {
          return record._updatedAt > updatedAt;
        }),
        remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        }).fetch()
      };
    }

    return records;
  }

});
RocketChat.models.Permissions.on('change', ({
  clientAction,
  id,
  data
}) => {
  switch (clientAction) {
    case 'updated':
    case 'inserted':
      data = data || RocketChat.models.Permissions.findOneById(id);
      break;

    case 'removed':
      data = {
        _id: id
      };
      break;
  }

  RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', clientAction, data);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/roles.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.publish('roles', function () {
  if (!this.userId) {
    return this.ready();
  }

  return RocketChat.models.Roles.find();
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"usersInRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/usersInRole.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.publish('usersInRole', function (roleName, scope, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
    return this.error(new Meteor.Error('error-not-allowed', 'Not allowed', {
      publish: 'usersInRole'
    }));
  }

  const options = {
    limit,
    sort: {
      name: 1
    }
  };
  return RocketChat.authz.getUsersInRole(roleName, scope, options);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addUserToRole.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/addUserToRole.js                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'authorization:addUserToRole'(roleName, username, scope) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:addUserToRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'authorization:addUserToRole'
      });
    }

    if (roleName === 'admin' && !RocketChat.authz.hasPermission(Meteor.userId(), 'assign-admin-role')) {
      throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
        method: 'authorization:addUserToRole',
        action: 'Assign_admin'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'authorization:addUserToRole'
      });
    }

    const add = RocketChat.models.Roles.addUserRoles(user._id, roleName, scope);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'added',
        _id: roleName,
        u: {
          _id: user._id,
          username
        },
        scope
      });
    }

    return add;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/deleteRole.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:deleteRole'(roleName) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:deleteRole',
        action: 'Accessing_permissions'
      });
    }

    const role = RocketChat.models.Roles.findOne(roleName);

    if (!role) {
      throw new Meteor.Error('error-invalid-role', 'Invalid role', {
        method: 'authorization:deleteRole'
      });
    }

    if (role.protected) {
      throw new Meteor.Error('error-delete-protected-role', 'Cannot delete a protected role', {
        method: 'authorization:deleteRole'
      });
    }

    const roleScope = role.scope || 'Users';
    const model = RocketChat.models[roleScope];
    const existingUsers = model && model.findUsersInRoles && model.findUsersInRoles(roleName);

    if (existingUsers && existingUsers.count() > 0) {
      throw new Meteor.Error('error-role-in-use', 'Cannot delete role because it\'s in use', {
        method: 'authorization:deleteRole'
      });
    }

    return RocketChat.models.Roles.remove(role.name);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRole.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/removeUserFromRole.js                                       //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'authorization:removeUserFromRole'(roleName, username, scope) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Access permissions is not allowed', {
        method: 'authorization:removeUserFromRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'authorization:removeUserFromRole'
      });
    }

    const user = Meteor.users.findOne({
      username
    }, {
      fields: {
        _id: 1,
        roles: 1
      }
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'authorization:removeUserFromRole'
      });
    } // prevent removing last user from admin role


    if (roleName === 'admin') {
      const adminCount = Meteor.users.find({
        roles: {
          $in: ['admin']
        }
      }).count();
      const userIsAdmin = user.roles.indexOf('admin') > -1;

      if (adminCount === 1 && userIsAdmin) {
        throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
          method: 'removeUserFromRole',
          action: 'Remove_last_admin'
        });
      }
    }

    const remove = RocketChat.models.Roles.removeUserRoles(user._id, roleName, scope);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'removed',
        _id: roleName,
        u: {
          _id: user._id,
          username
        },
        scope
      });
    }

    return remove;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/saveRole.js                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:saveRole'(roleData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:saveRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleData.name) {
      throw new Meteor.Error('error-role-name-required', 'Role name is required', {
        method: 'authorization:saveRole'
      });
    }

    if (['Users', 'Subscriptions'].includes(roleData.scope) === false) {
      roleData.scope = 'Users';
    }

    const update = RocketChat.models.Roles.createOrUpdate(roleData.name, roleData.scope, roleData.description);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'changed',
        _id: roleData.name
      });
    }

    return update;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addPermissionToRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/addPermissionToRole.js                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:addPermissionToRole'(permission, role) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
        method: 'authorization:addPermissionToRole',
        action: 'Adding_permission'
      });
    }

    return RocketChat.models.Permissions.addRole(permission, role);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoleFromPermission.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/removeRoleFromPermission.js                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:removeRoleFromPermission'(permission, role) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:removeRoleFromPermission',
        action: 'Accessing_permissions'
      });
    }

    return RocketChat.models.Permissions.removeRole(permission, role);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/startup.js                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* eslint no-multi-spaces: 0 */
Meteor.startup(function () {
  // Note:
  // 1.if we need to create a role that can only edit channel message, but not edit group message
  // then we can define edit-<type>-message instead of edit-message
  // 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
  const permissions = [{
    _id: 'access-permissions',
    roles: ['admin']
  }, {
    _id: 'add-oauth-service',
    roles: ['admin']
  }, {
    _id: 'add-user-to-joined-room',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'add-user-to-any-c-room',
    roles: ['admin']
  }, {
    _id: 'add-user-to-any-p-room',
    roles: []
  }, {
    _id: 'archive-room',
    roles: ['admin', 'owner']
  }, {
    _id: 'assign-admin-role',
    roles: ['admin']
  }, {
    _id: 'ban-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'bulk-create-c',
    roles: ['admin']
  }, {
    _id: 'bulk-register-user',
    roles: ['admin']
  }, {
    _id: 'create-c',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-d',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-p',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-user',
    roles: ['admin']
  }, {
    _id: 'clean-channel-history',
    roles: ['admin']
  }, // special permission to bulk delete a channel's mesages
  {
    _id: 'delete-c',
    roles: ['admin', 'owner']
  }, {
    _id: 'delete-d',
    roles: ['admin']
  }, {
    _id: 'delete-message',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'delete-p',
    roles: ['admin', 'owner']
  }, {
    _id: 'delete-user',
    roles: ['admin']
  }, {
    _id: 'edit-message',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'edit-other-user-active-status',
    roles: ['admin']
  }, {
    _id: 'edit-other-user-info',
    roles: ['admin']
  }, {
    _id: 'edit-other-user-password',
    roles: ['admin']
  }, {
    _id: 'edit-privileged-setting',
    roles: ['admin']
  }, {
    _id: 'edit-room',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'force-delete-message',
    roles: ['admin', 'owner']
  }, {
    _id: 'join-without-join-code',
    roles: ['admin', 'bot']
  }, {
    _id: 'leave-c',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'leave-p',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'manage-assets',
    roles: ['admin']
  }, {
    _id: 'manage-emoji',
    roles: ['admin']
  }, {
    _id: 'manage-integrations',
    roles: ['admin']
  }, {
    _id: 'manage-own-integrations',
    roles: ['admin', 'bot']
  }, {
    _id: 'manage-oauth-apps',
    roles: ['admin']
  }, {
    _id: 'mention-all',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'mention-here',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'mute-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'remove-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'run-import',
    roles: ['admin']
  }, {
    _id: 'run-migration',
    roles: ['admin']
  }, {
    _id: 'set-moderator',
    roles: ['admin', 'owner']
  }, {
    _id: 'set-owner',
    roles: ['admin', 'owner']
  }, {
    _id: 'send-many-messages',
    roles: ['admin', 'bot']
  }, {
    _id: 'set-leader',
    roles: ['admin', 'owner']
  }, {
    _id: 'unarchive-room',
    roles: ['admin']
  }, {
    _id: 'view-c-room',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'user-generate-access-token',
    roles: ['admin']
  }, {
    _id: 'view-d-room',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'view-full-other-user-info',
    roles: ['admin']
  }, {
    _id: 'view-history',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-joined-room',
    roles: ['guest', 'bot', 'anonymous']
  }, {
    _id: 'view-join-code',
    roles: ['admin']
  }, {
    _id: 'view-logs',
    roles: ['admin']
  }, {
    _id: 'view-other-user-channels',
    roles: ['admin']
  }, {
    _id: 'view-p-room',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-privileged-setting',
    roles: ['admin']
  }, {
    _id: 'view-room-administration',
    roles: ['admin']
  }, {
    _id: 'view-statistics',
    roles: ['admin']
  }, {
    _id: 'view-user-administration',
    roles: ['admin']
  }, {
    _id: 'preview-c-room',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-outside-room',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'view-broadcast-member-list',
    roles: ['admin', 'owner', 'moderator']
  }];

  for (const permission of permissions) {
    if (!RocketChat.models.Permissions.findOneById(permission._id)) {
      RocketChat.models.Permissions.upsert(permission._id, {
        $set: permission
      });
    }
  }

  const defaultRoles = [{
    name: 'admin',
    scope: 'Users',
    description: 'Admin'
  }, {
    name: 'moderator',
    scope: 'Subscriptions',
    description: 'Moderator'
  }, {
    name: 'leader',
    scope: 'Subscriptions',
    description: 'Leader'
  }, {
    name: 'owner',
    scope: 'Subscriptions',
    description: 'Owner'
  }, {
    name: 'user',
    scope: 'Users',
    description: ''
  }, {
    name: 'bot',
    scope: 'Users',
    description: ''
  }, {
    name: 'guest',
    scope: 'Users',
    description: ''
  }, {
    name: 'anonymous',
    scope: 'Users',
    description: ''
  }];

  for (const role of defaultRoles) {
    RocketChat.models.Roles.upsert({
      _id: role.name
    }, {
      $setOnInsert: {
        scope: role.scope,
        description: role.description || '',
        protected: true
      }
    });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:authorization/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Permissions.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Roles.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Base.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Users.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/addUserRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/canAccessRoom.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/getRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/getUsersInRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/hasPermission.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/hasRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/removeUserFromRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/permissions.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/roles.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/usersInRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/addUserToRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/deleteRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/removeUserFromRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/saveRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/addPermissionToRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/removeRoleFromPermission.js");
require("/node_modules/meteor/rocketchat:authorization/server/startup.js");

/* Exports */
Package._define("rocketchat:authorization");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_authorization.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21vZGVscy9QZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9tb2RlbHMvUm9sZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbW9kZWxzL0Jhc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbW9kZWxzL1VzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21vZGVscy9TdWJzY3JpcHRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL2Z1bmN0aW9ucy9hZGRVc2VyUm9sZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvZnVuY3Rpb25zL2NhbkFjY2Vzc1Jvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvZnVuY3Rpb25zL2dldFJvbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL2Z1bmN0aW9ucy9nZXRVc2Vyc0luUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvaGFzUGVybWlzc2lvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvaGFzUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvcmVtb3ZlVXNlckZyb21Sb2xlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9wdWJsaWNhdGlvbnMvcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvcHVibGljYXRpb25zL3JvbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL3B1YmxpY2F0aW9ucy91c2Vyc0luUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9tZXRob2RzL2FkZFVzZXJUb1JvbGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbWV0aG9kcy9kZWxldGVSb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvcmVtb3ZlVXNlckZyb21Sb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvc2F2ZVJvbGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbWV0aG9kcy9hZGRQZXJtaXNzaW9uVG9Sb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvcmVtb3ZlUm9sZUZyb21QZXJtaXNzaW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL3N0YXJ0dXAuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsImF1dGh6IiwiTW9kZWxQZXJtaXNzaW9ucyIsIm1vZGVscyIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJhcmd1bWVudHMiLCJmaW5kQnlSb2xlIiwicm9sZSIsIm9wdGlvbnMiLCJxdWVyeSIsInJvbGVzIiwiZmluZCIsImZpbmRPbmVCeUlkIiwiX2lkIiwiZmluZE9uZSIsImNyZWF0ZU9yVXBkYXRlIiwibmFtZSIsInVwc2VydCIsIiRzZXQiLCJhZGRSb2xlIiwicGVybWlzc2lvbiIsInVwZGF0ZSIsIiRhZGRUb1NldCIsInJlbW92ZVJvbGUiLCIkcHVsbCIsIlBlcm1pc3Npb25zIiwiTW9kZWxSb2xlcyIsInRyeUVuc3VyZUluZGV4IiwiZmluZFVzZXJzSW5Sb2xlIiwic2NvcGUiLCJyb2xlU2NvcGUiLCJtb2RlbCIsImZpbmRVc2Vyc0luUm9sZXMiLCJpc1VzZXJJblJvbGVzIiwidXNlcklkIiwiY29uY2F0Iiwic29tZSIsInJvbGVOYW1lIiwiaXNVc2VySW5Sb2xlIiwiZGVzY3JpcHRpb24iLCJwcm90ZWN0ZWRSb2xlIiwidXBkYXRlRGF0YSIsInByb3RlY3RlZCIsImFkZFVzZXJSb2xlcyIsImFkZFJvbGVzQnlVc2VySWQiLCJyZW1vdmVVc2VyUm9sZXMiLCJyZW1vdmVSb2xlc0J5VXNlcklkIiwiUm9sZXMiLCJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJwcm90b3R5cGUiLCJyb2xlQmFzZVF1ZXJ5IiwiZmluZFJvbGVzQnlVc2VySWQiLCJmaWVsZHMiLCJpc1VuZGVmaW5lZCIsIiRlYWNoIiwiJHB1bGxBbGwiLCJNZXRlb3IiLCJFcnJvciIsIlVzZXJzIiwiJGluIiwiU3Vic2NyaXB0aW9ucyIsInJpZCIsInN1YnNjcmlwdGlvbnMiLCJmZXRjaCIsInVzZXJzIiwiY29tcGFjdCIsIm1hcCIsInN1YnNjcmlwdGlvbiIsInUiLCJyb2xlTmFtZXMiLCJ1c2VyIiwiZGIiLCJmdW5jdGlvbiIsImV4aXN0aW5nUm9sZU5hbWVzIiwicGx1Y2siLCJnZXRSb2xlcyIsImludmFsaWRSb2xlTmFtZXMiLCJkaWZmZXJlbmNlIiwiaXNFbXB0eSIsInJvb21BY2Nlc3NWYWxpZGF0b3JzIiwicm9vbSIsInQiLCJzZXR0aW5ncyIsImdldCIsImhhc1Blcm1pc3Npb24iLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJSb29tcyIsImNhbkFjY2Vzc1Jvb20iLCJleHRyYURhdGEiLCJ2YWxpZGF0b3IiLCJjYWxsIiwiYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvciIsInB1c2giLCJnZXRVc2Vyc0luUm9sZSIsImF0TGVhc3RPbmUiLCJwZXJtaXNzaW9ucyIsInBlcm1pc3Npb25JZCIsImFsbCIsImV2ZXJ5Iiwic3RyYXRlZ3kiLCJoYXNBbGxQZXJtaXNzaW9uIiwiaGFzQXRMZWFzdE9uZVBlcm1pc3Npb24iLCJoYXNSb2xlIiwicmVtb3ZlVXNlckZyb21Sb2xlcyIsIm1ldGhvZHMiLCJ1cGRhdGVkQXQiLCJ1bmJsb2NrIiwicmVjb3JkcyIsIkRhdGUiLCJmaWx0ZXIiLCJyZWNvcmQiLCJfdXBkYXRlZEF0IiwicmVtb3ZlIiwidHJhc2hGaW5kRGVsZXRlZEFmdGVyIiwiX2RlbGV0ZWRBdCIsIm9uIiwiY2xpZW50QWN0aW9uIiwiaWQiLCJkYXRhIiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeUxvZ2dlZEluVGhpc0luc3RhbmNlIiwicHVibGlzaCIsInJlYWR5IiwibGltaXQiLCJlcnJvciIsInNvcnQiLCJ1c2VybmFtZSIsIm1ldGhvZCIsImFjdGlvbiIsImlzU3RyaW5nIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJhZGQiLCJub3RpZnlMb2dnZWQiLCJ0eXBlIiwiZXhpc3RpbmdVc2VycyIsImNvdW50IiwiYWRtaW5Db3VudCIsInVzZXJJc0FkbWluIiwiaW5kZXhPZiIsInJvbGVEYXRhIiwiaW5jbHVkZXMiLCJzdGFydHVwIiwiZGVmYXVsdFJvbGVzIiwiJHNldE9uSW5zZXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsS0FBWCxHQUFtQixFQUFuQixDOzs7Ozs7Ozs7OztBQ0FBLE1BQU1DLGdCQUFOLFNBQStCRixXQUFXRyxNQUFYLENBQWtCQyxLQUFqRCxDQUF1RDtBQUN0REMsZ0JBQWM7QUFDYixVQUFNLEdBQUdDLFNBQVQ7QUFDQSxHQUhxRCxDQUt0RDs7O0FBQ0FDLGFBQVdDLElBQVgsRUFBaUJDLE9BQWpCLEVBQTBCO0FBQ3pCLFVBQU1DLFFBQVE7QUFDYkMsYUFBT0g7QUFETSxLQUFkO0FBSUEsV0FBTyxLQUFLSSxJQUFMLENBQVVGLEtBQVYsRUFBaUJELE9BQWpCLENBQVA7QUFDQTs7QUFFREksY0FBWUMsR0FBWixFQUFpQjtBQUNoQixXQUFPLEtBQUtDLE9BQUwsQ0FBYUQsR0FBYixDQUFQO0FBQ0E7O0FBRURFLGlCQUFlQyxJQUFmLEVBQXFCTixLQUFyQixFQUE0QjtBQUMzQixTQUFLTyxNQUFMLENBQVk7QUFBRUosV0FBS0c7QUFBUCxLQUFaLEVBQTJCO0FBQUVFLFlBQU07QUFBRVI7QUFBRjtBQUFSLEtBQTNCO0FBQ0E7O0FBRURTLFVBQVFDLFVBQVIsRUFBb0JiLElBQXBCLEVBQTBCO0FBQ3pCLFNBQUtjLE1BQUwsQ0FBWTtBQUFFUixXQUFLTztBQUFQLEtBQVosRUFBaUM7QUFBRUUsaUJBQVc7QUFBRVosZUFBT0g7QUFBVDtBQUFiLEtBQWpDO0FBQ0E7O0FBRURnQixhQUFXSCxVQUFYLEVBQXVCYixJQUF2QixFQUE2QjtBQUM1QixTQUFLYyxNQUFMLENBQVk7QUFBRVIsV0FBS087QUFBUCxLQUFaLEVBQWlDO0FBQUVJLGFBQU87QUFBRWQsZUFBT0g7QUFBVDtBQUFULEtBQWpDO0FBQ0E7O0FBNUJxRDs7QUErQnZEUixX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QXFCYSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQURvQixFQUVwQjtBQUFFdkIsVUFBTSxXQUFSO0FBQXFCYSxXQUFPLGVBQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQUZvQixFQUdwQjtBQUFFdkIsVUFBTSxRQUFSO0FBQXFCYSxXQUFPLGVBQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQUhvQixFQUlwQjtBQUFFdkIsVUFBTSxPQUFSO0FBQXFCYSxXQUFPLGVBQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQUpvQixFQUtwQjtBQUFFdkIsVUFBTSxNQUFSO0FBQXFCYSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQUxvQixFQU1wQjtBQUFFdkIsVUFBTSxLQUFSO0FBQXFCYSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQU5vQixFQU9wQjtBQUFFdkIsVUFBTSxPQUFSO0FBQXFCYSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQVBvQixFQVFwQjtBQUFFdkIsVUFBTSxXQUFSO0FBQXFCYSxXQUFPLE9BQTVCO0FBQTZDVSxpQkFBYTtBQUExRCxHQVJvQixDQUFyQjs7QUFXQSxPQUFLLE1BQU1oQyxJQUFYLElBQW1CNEksWUFBbkIsRUFBaUM7QUFDaENwSixlQUFXRyxNQUFYLENBQWtCNkMsS0FBbEIsQ0FBd0I5QixNQUF4QixDQUErQjtBQUFFSixXQUFLTixLQUFLUztBQUFaLEtBQS9CLEVBQW1EO0FBQUVvSSxvQkFBYztBQUFFdkgsZUFBT3RCLEtBQUtzQixLQUFkO0FBQXFCVSxxQkFBYWhDLEtBQUtnQyxXQUFMLElBQW9CLEVBQXREO0FBQTBERyxtQkFBVztBQUFyRTtBQUFoQixLQUFuRDtBQUNBO0FBQ0QsQ0EzRkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hdXRob3JpemF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5hdXRoeiA9IHt9O1xuIiwiY2xhc3MgTW9kZWxQZXJtaXNzaW9ucyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoLi4uYXJndW1lbnRzKTtcblx0fVxuXG5cdC8vIEZJTkRcblx0ZmluZEJ5Um9sZShyb2xlLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRyb2xlczogcm9sZVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRPbmVCeUlkKF9pZCkge1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUoX2lkKTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlKG5hbWUsIHJvbGVzKSB7XG5cdFx0dGhpcy51cHNlcnQoeyBfaWQ6IG5hbWUgfSwgeyAkc2V0OiB7IHJvbGVzIH0gfSk7XG5cdH1cblxuXHRhZGRSb2xlKHBlcm1pc3Npb24sIHJvbGUpIHtcblx0XHR0aGlzLnVwZGF0ZSh7IF9pZDogcGVybWlzc2lvbiB9LCB7ICRhZGRUb1NldDogeyByb2xlczogcm9sZSB9IH0pO1xuXHR9XG5cblx0cmVtb3ZlUm9sZShwZXJtaXNzaW9uLCByb2xlKSB7XG5cdFx0dGhpcy51cGRhdGUoeyBfaWQ6IHBlcm1pc3Npb24gfSwgeyAkcHVsbDogeyByb2xlczogcm9sZSB9IH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zID0gbmV3IE1vZGVsUGVybWlzc2lvbnMoJ3Blcm1pc3Npb25zJyk7XG4iLCJjbGFzcyBNb2RlbFJvbGVzIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdzY29wZSc6IDEgfSk7XG5cdH1cblxuXHRmaW5kVXNlcnNJblJvbGUobmFtZSwgc2NvcGUsIG9wdGlvbnMpIHtcblx0XHRjb25zdCByb2xlID0gdGhpcy5maW5kT25lKG5hbWUpO1xuXHRcdGNvbnN0IHJvbGVTY29wZSA9IChyb2xlICYmIHJvbGUuc2NvcGUpIHx8ICdVc2Vycyc7XG5cdFx0Y29uc3QgbW9kZWwgPSBSb2NrZXRDaGF0Lm1vZGVsc1tyb2xlU2NvcGVdO1xuXG5cdFx0cmV0dXJuIG1vZGVsICYmIG1vZGVsLmZpbmRVc2Vyc0luUm9sZXMgJiYgbW9kZWwuZmluZFVzZXJzSW5Sb2xlcyhuYW1lLCBzY29wZSwgb3B0aW9ucyk7XG5cdH1cblxuXHRpc1VzZXJJblJvbGVzKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdFx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXHRcdHJldHVybiByb2xlcy5zb21lKChyb2xlTmFtZSkgPT4ge1xuXHRcdFx0Y29uc3Qgcm9sZSA9IHRoaXMuZmluZE9uZShyb2xlTmFtZSk7XG5cdFx0XHRjb25zdCByb2xlU2NvcGUgPSAocm9sZSAmJiByb2xlLnNjb3BlKSB8fCAnVXNlcnMnO1xuXHRcdFx0Y29uc3QgbW9kZWwgPSBSb2NrZXRDaGF0Lm1vZGVsc1tyb2xlU2NvcGVdO1xuXG5cdFx0XHRyZXR1cm4gbW9kZWwgJiYgbW9kZWwuaXNVc2VySW5Sb2xlICYmIG1vZGVsLmlzVXNlckluUm9sZSh1c2VySWQsIHJvbGVOYW1lLCBzY29wZSk7XG5cdFx0fSk7XG5cdH1cblxuXHRjcmVhdGVPclVwZGF0ZShuYW1lLCBzY29wZSA9ICdVc2VycycsIGRlc2NyaXB0aW9uLCBwcm90ZWN0ZWRSb2xlKSB7XG5cdFx0Y29uc3QgdXBkYXRlRGF0YSA9IHt9O1xuXHRcdHVwZGF0ZURhdGEubmFtZSA9IG5hbWU7XG5cdFx0dXBkYXRlRGF0YS5zY29wZSA9IHNjb3BlO1xuXG5cdFx0aWYgKGRlc2NyaXB0aW9uICE9IG51bGwpIHtcblx0XHRcdHVwZGF0ZURhdGEuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcblx0XHR9XG5cblx0XHRpZiAocHJvdGVjdGVkUm9sZSkge1xuXHRcdFx0dXBkYXRlRGF0YS5wcm90ZWN0ZWQgPSBwcm90ZWN0ZWRSb2xlO1xuXHRcdH1cblxuXHRcdHRoaXMudXBzZXJ0KHsgX2lkOiBuYW1lIH0sIHsgJHNldDogdXBkYXRlRGF0YSB9KTtcblx0fVxuXG5cdGFkZFVzZXJSb2xlcyh1c2VySWQsIHJvbGVzLCBzY29wZSkge1xuXHRcdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblx0XHRmb3IgKGNvbnN0IHJvbGVOYW1lIG9mIHJvbGVzKSB7XG5cdFx0XHRjb25zdCByb2xlID0gdGhpcy5maW5kT25lKHJvbGVOYW1lKTtcblx0XHRcdGNvbnN0IHJvbGVTY29wZSA9IChyb2xlICYmIHJvbGUuc2NvcGUpIHx8ICdVc2Vycyc7XG5cdFx0XHRjb25zdCBtb2RlbCA9IFJvY2tldENoYXQubW9kZWxzW3JvbGVTY29wZV07XG5cblx0XHRcdG1vZGVsICYmIG1vZGVsLmFkZFJvbGVzQnlVc2VySWQgJiYgbW9kZWwuYWRkUm9sZXNCeVVzZXJJZCh1c2VySWQsIHJvbGVOYW1lLCBzY29wZSk7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0cmVtb3ZlVXNlclJvbGVzKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdFx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXHRcdGZvciAoY29uc3Qgcm9sZU5hbWUgb2Ygcm9sZXMpIHtcblx0XHRcdGNvbnN0IHJvbGUgPSB0aGlzLmZpbmRPbmUocm9sZU5hbWUpO1xuXHRcdFx0Y29uc3Qgcm9sZVNjb3BlID0gKHJvbGUgJiYgcm9sZS5zY29wZSkgfHwgJ1VzZXJzJztcblx0XHRcdGNvbnN0IG1vZGVsID0gUm9ja2V0Q2hhdC5tb2RlbHNbcm9sZVNjb3BlXTtcblxuXHRcdFx0bW9kZWwgJiYgbW9kZWwucmVtb3ZlUm9sZXNCeVVzZXJJZCAmJiBtb2RlbC5yZW1vdmVSb2xlc0J5VXNlcklkKHVzZXJJZCwgcm9sZU5hbWUsIHNjb3BlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMgPSBuZXcgTW9kZWxSb2xlcygncm9sZXMnKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUucm9sZUJhc2VRdWVyeSA9IGZ1bmN0aW9uKC8qdXNlcklkLCBzY29wZSovKSB7XG5cdHJldHVybjtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5maW5kUm9sZXNCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZC8qLCBvcHRpb25zKi8pIHtcblx0Y29uc3QgcXVlcnkgPSB0aGlzLnJvbGVCYXNlUXVlcnkodXNlcklkKTtcblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBmaWVsZHM6IHsgcm9sZXM6IDEgfSB9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5pc1VzZXJJblJvbGUgPSBmdW5jdGlvbih1c2VySWQsIHJvbGVOYW1lLCBzY29wZSkge1xuXHRjb25zdCBxdWVyeSA9IHRoaXMucm9sZUJhc2VRdWVyeSh1c2VySWQsIHNjb3BlKTtcblxuXHRpZiAocXVlcnkgPT0gbnVsbCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHF1ZXJ5LnJvbGVzID0gcm9sZU5hbWU7XG5cdHJldHVybiAhXy5pc1VuZGVmaW5lZCh0aGlzLmZpbmRPbmUocXVlcnksIHtmaWVsZHM6IHtyb2xlczogMX19KSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUuYWRkUm9sZXNCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblx0Y29uc3QgcXVlcnkgPSB0aGlzLnJvbGVCYXNlUXVlcnkodXNlcklkLCBzY29wZSk7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkYWRkVG9TZXQ6IHtcblx0XHRcdHJvbGVzOiB7ICRlYWNoOiByb2xlcyB9XG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUucmVtb3ZlUm9sZXNCeVVzZXJJZCA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblx0Y29uc3QgcXVlcnkgPSB0aGlzLnJvbGVCYXNlUXVlcnkodXNlcklkLCBzY29wZSk7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkcHVsbEFsbDoge1xuXHRcdFx0cm9sZXNcblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5maW5kVXNlcnNJblJvbGVzID0gZnVuY3Rpb24oKSB7XG5cdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ292ZXJ3cml0ZS1mdW5jdGlvbicsICdZb3UgbXVzdCBvdmVyd3JpdGUgdGhpcyBmdW5jdGlvbiBpbiB0aGUgZXh0ZW5kZWQgY2xhc3NlcycpO1xufTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlVzZXJzLnJvbGVCYXNlUXVlcnkgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0cmV0dXJuIHsgX2lkOiB1c2VySWQgfTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRVc2Vyc0luUm9sZXMgPSBmdW5jdGlvbihyb2xlcywgc2NvcGUsIG9wdGlvbnMpIHtcblx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHJvbGVzOiB7ICRpbjogcm9sZXMgfVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnJvbGVCYXNlUXVlcnkgPSBmdW5jdGlvbih1c2VySWQsIHNjb3BlKSB7XG5cdGlmIChzY29wZSA9PSBudWxsKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7ICd1Ll9pZCc6IHVzZXJJZCB9O1xuXHRpZiAoIV8uaXNVbmRlZmluZWQoc2NvcGUpKSB7XG5cdFx0cXVlcnkucmlkID0gc2NvcGU7XG5cdH1cblx0cmV0dXJuIHF1ZXJ5O1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kVXNlcnNJblJvbGVzID0gZnVuY3Rpb24ocm9sZXMsIHNjb3BlLCBvcHRpb25zKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyb2xlczogeyAkaW46IHJvbGVzIH1cblx0fTtcblxuXHRpZiAoc2NvcGUpIHtcblx0XHRxdWVyeS5yaWQgPSBzY29wZTtcblx0fVxuXG5cdGNvbnN0IHN1YnNjcmlwdGlvbnMgPSB0aGlzLmZpbmQocXVlcnkpLmZldGNoKCk7XG5cblx0Y29uc3QgdXNlcnMgPSBfLmNvbXBhY3QoXy5tYXAoc3Vic2NyaXB0aW9ucywgZnVuY3Rpb24oc3Vic2NyaXB0aW9uKSB7XG5cdFx0aWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygc3Vic2NyaXB0aW9uLnUgJiYgJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBzdWJzY3JpcHRpb24udS5faWQpIHtcblx0XHRcdHJldHVybiBzdWJzY3JpcHRpb24udS5faWQ7XG5cdFx0fVxuXHR9KSk7XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQoeyBfaWQ6IHsgJGluOiB1c2VycyB9IH0sIG9wdGlvbnMpO1xufTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LmF1dGh6LmFkZFVzZXJSb2xlcyA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSkge1xuXHRpZiAoIXVzZXJJZCB8fCAhcm9sZU5hbWVzKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmRiLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cdGlmICghdXNlcikge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuYXV0aHouYWRkVXNlclJvbGVzJ1xuXHRcdH0pO1xuXHR9XG5cblx0cm9sZU5hbWVzID0gW10uY29uY2F0KHJvbGVOYW1lcyk7XG5cdGNvbnN0IGV4aXN0aW5nUm9sZU5hbWVzID0gXy5wbHVjayhSb2NrZXRDaGF0LmF1dGh6LmdldFJvbGVzKCksICdfaWQnKTtcblx0Y29uc3QgaW52YWxpZFJvbGVOYW1lcyA9IF8uZGlmZmVyZW5jZShyb2xlTmFtZXMsIGV4aXN0aW5nUm9sZU5hbWVzKTtcblxuXHRpZiAoIV8uaXNFbXB0eShpbnZhbGlkUm9sZU5hbWVzKSkge1xuXHRcdGZvciAoY29uc3Qgcm9sZSBvZiBpbnZhbGlkUm9sZU5hbWVzKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZShyb2xlKTtcblx0XHR9XG5cdH1cblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5hZGRVc2VyUm9sZXModXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKTtcblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG4iLCIvKiBnbG9iYWxzIFJvY2tldENoYXQgKi9cblJvY2tldENoYXQuYXV0aHoucm9vbUFjY2Vzc1ZhbGlkYXRvcnMgPSBbXG5cdGZ1bmN0aW9uKHJvb20sIHVzZXIgPSB7fSkge1xuXHRcdGlmIChyb29tICYmIHJvb20udCA9PT0gJ2MnKSB7XG5cdFx0XHRpZiAoIXVzZXIuX2lkICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19BbGxvd0Fub255bW91c1JlYWQnKSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VyLl9pZCwgJ3ZpZXctYy1yb29tJyk7XG5cdFx0fVxuXHR9LFxuXHRmdW5jdGlvbihyb29tLCB1c2VyID0ge30pIHtcblx0XHRpZiAoIXJvb20gfHwgIXVzZXIpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgdXNlci5faWQpO1xuXHRcdGlmIChzdWJzY3JpcHRpb24pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChzdWJzY3JpcHRpb24ucmlkKTtcblx0XHR9XG5cdH1cbl07XG5cblJvY2tldENoYXQuYXV0aHouY2FuQWNjZXNzUm9vbSA9IGZ1bmN0aW9uKHJvb20sIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5yb29tQWNjZXNzVmFsaWRhdG9ycy5zb21lKCh2YWxpZGF0b3IpID0+IHtcblx0XHRyZXR1cm4gdmFsaWRhdG9yLmNhbGwodGhpcywgcm9vbSwgdXNlciwgZXh0cmFEYXRhKTtcblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IgPSBmdW5jdGlvbih2YWxpZGF0b3IpIHtcblx0Um9ja2V0Q2hhdC5hdXRoei5yb29tQWNjZXNzVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XG59O1xuIiwiUm9ja2V0Q2hhdC5hdXRoei5nZXRSb2xlcyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZCgpLmZldGNoKCk7XG59O1xuIiwiUm9ja2V0Q2hhdC5hdXRoei5nZXRVc2Vyc0luUm9sZSA9IGZ1bmN0aW9uKHJvbGVOYW1lLCBzY29wZSwgb3B0aW9ucykge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZFVzZXJzSW5Sb2xlKHJvbGVOYW1lLCBzY29wZSwgb3B0aW9ucyk7XG59O1xuIiwiZnVuY3Rpb24gYXRMZWFzdE9uZSh1c2VySWQsIHBlcm1pc3Npb25zID0gW10sIHNjb3BlKSB7XG5cdHJldHVybiBwZXJtaXNzaW9ucy5zb21lKChwZXJtaXNzaW9uSWQpID0+IHtcblx0XHRjb25zdCBwZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZShwZXJtaXNzaW9uSWQpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5pc1VzZXJJblJvbGVzKHVzZXJJZCwgcGVybWlzc2lvbi5yb2xlcywgc2NvcGUpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gYWxsKHVzZXJJZCwgcGVybWlzc2lvbnMgPSBbXSwgc2NvcGUpIHtcblx0cmV0dXJuIHBlcm1pc3Npb25zLmV2ZXJ5KChwZXJtaXNzaW9uSWQpID0+IHtcblx0XHRjb25zdCBwZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZShwZXJtaXNzaW9uSWQpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5pc1VzZXJJblJvbGVzKHVzZXJJZCwgcGVybWlzc2lvbi5yb2xlcywgc2NvcGUpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gaGFzUGVybWlzc2lvbih1c2VySWQsIHBlcm1pc3Npb25zLCBzY29wZSwgc3RyYXRlZ3kpIHtcblx0aWYgKCF1c2VySWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRwZXJtaXNzaW9ucyA9IFtdLmNvbmNhdChwZXJtaXNzaW9ucyk7XG5cdHJldHVybiBzdHJhdGVneSh1c2VySWQsIHBlcm1pc3Npb25zLCBzY29wZSk7XG59XG5cblJvY2tldENoYXQuYXV0aHouaGFzQWxsUGVybWlzc2lvbiA9IGZ1bmN0aW9uKHVzZXJJZCwgcGVybWlzc2lvbnMsIHNjb3BlKSB7XG5cdHJldHVybiBoYXNQZXJtaXNzaW9uKHVzZXJJZCwgcGVybWlzc2lvbnMsIHNjb3BlLCBhbGwpO1xufTtcblxuUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNBbGxQZXJtaXNzaW9uO1xuXG5Sb2NrZXRDaGF0LmF1dGh6Lmhhc0F0TGVhc3RPbmVQZXJtaXNzaW9uID0gZnVuY3Rpb24odXNlcklkLCBwZXJtaXNzaW9ucywgc2NvcGUpIHtcblx0cmV0dXJuIGhhc1Blcm1pc3Npb24odXNlcklkLCBwZXJtaXNzaW9ucywgc2NvcGUsIGF0TGVhc3RPbmUpO1xufTtcbiIsIlJvY2tldENoYXQuYXV0aHouaGFzUm9sZSA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSkge1xuXHRyb2xlTmFtZXMgPSBbXS5jb25jYXQocm9sZU5hbWVzKTtcblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmlzVXNlckluUm9sZXModXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzID0gZnVuY3Rpb24odXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKSB7XG5cdGlmICghdXNlcklkIHx8ICFyb2xlTmFtZXMpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRpZiAoIXVzZXIpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0ZnVuY3Rpb246ICdSb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXMnXG5cdFx0fSk7XG5cdH1cblxuXHRyb2xlTmFtZXMgPSBbXS5jb25jYXQocm9sZU5hbWVzKTtcblx0Y29uc3QgZXhpc3RpbmdSb2xlTmFtZXMgPSBfLnBsdWNrKFJvY2tldENoYXQuYXV0aHouZ2V0Um9sZXMoKSwgJ19pZCcpO1xuXHRjb25zdCBpbnZhbGlkUm9sZU5hbWVzID0gXy5kaWZmZXJlbmNlKHJvbGVOYW1lcywgZXhpc3RpbmdSb2xlTmFtZXMpO1xuXG5cdGlmICghXy5pc0VtcHR5KGludmFsaWRSb2xlTmFtZXMpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb2xlJywgJ0ludmFsaWQgcm9sZScsIHtcblx0XHRcdGZ1bmN0aW9uOiAnUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzJ1xuXHRcdH0pO1xuXHR9XG5cblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMucmVtb3ZlVXNlclJvbGVzKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSk7XG5cblx0cmV0dXJuIHRydWU7XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQncGVybWlzc2lvbnMvZ2V0Jyh1cGRhdGVkQXQpIHtcblx0XHR0aGlzLnVuYmxvY2soKTtcblx0XHQvLyBUT0RPOiBzaG91bGQgd2UgcmV0dXJuIHRoaXMgZm9yIG5vbiBsb2dnZWQgdXNlcnM/XG5cdFx0Ly8gVE9ETzogd2UgY291bGQgY2FjaGUgdGhpcyBjb2xsZWN0aW9uXG5cblx0XHRjb25zdCByZWNvcmRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZCgpLmZldGNoKCk7XG5cblx0XHRpZiAodXBkYXRlZEF0IGluc3RhbmNlb2YgRGF0ZSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dXBkYXRlOiByZWNvcmRzLmZpbHRlcigocmVjb3JkKSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHJlY29yZC5fdXBkYXRlZEF0ID4gdXBkYXRlZEF0O1xuXHRcdFx0XHR9KSxcblx0XHRcdFx0cmVtb3ZlOiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy50cmFzaEZpbmREZWxldGVkQWZ0ZXIodXBkYXRlZEF0LCB7fSwge2ZpZWxkczoge19pZDogMSwgX2RlbGV0ZWRBdDogMX19KS5mZXRjaCgpXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdHJldHVybiByZWNvcmRzO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMub24oJ2NoYW5nZScsICh7Y2xpZW50QWN0aW9uLCBpZCwgZGF0YX0pID0+IHtcblx0c3dpdGNoIChjbGllbnRBY3Rpb24pIHtcblx0XHRjYXNlICd1cGRhdGVkJzpcblx0XHRjYXNlICdpbnNlcnRlZCc6XG5cdFx0XHRkYXRhID0gZGF0YSB8fCBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5maW5kT25lQnlJZChpZCk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ3JlbW92ZWQnOlxuXHRcdFx0ZGF0YSA9IHsgX2lkOiBpZCB9O1xuXHRcdFx0YnJlYWs7XG5cdH1cblxuXHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkSW5UaGlzSW5zdGFuY2UoJ3Blcm1pc3Npb25zLWNoYW5nZWQnLCBjbGllbnRBY3Rpb24sIGRhdGEpO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgncm9sZXMnLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZCgpO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgndXNlcnNJblJvbGUnLCBmdW5jdGlvbihyb2xlTmFtZSwgc2NvcGUsIGxpbWl0ID0gNTApIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7XG5cdFx0XHRwdWJsaXNoOiAndXNlcnNJblJvbGUnXG5cdFx0fSkpO1xuXHR9XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRsaW1pdCxcblx0XHRzb3J0OiB7XG5cdFx0XHRuYW1lOiAxXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBSb2NrZXRDaGF0LmF1dGh6LmdldFVzZXJzSW5Sb2xlKHJvbGVOYW1lLCBzY29wZSwgb3B0aW9ucyk7XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdhdXRob3JpemF0aW9uOmFkZFVzZXJUb1JvbGUnKHJvbGVOYW1lLCB1c2VybmFtZSwgc2NvcGUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQWNjZXNzaW5nIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmFkZFVzZXJUb1JvbGUnLFxuXHRcdFx0XHRhY3Rpb246ICdBY2Nlc3NpbmdfcGVybWlzc2lvbnMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIXJvbGVOYW1lIHx8ICFfLmlzU3RyaW5nKHJvbGVOYW1lKSB8fCAhdXNlcm5hbWUgfHwgIV8uaXNTdHJpbmcodXNlcm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWFyZ3VtZW50cycsICdJbnZhbGlkIGFyZ3VtZW50cycsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjphZGRVc2VyVG9Sb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJvbGVOYW1lID09PSAnYWRtaW4nICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYXNzaWduLWFkbWluLXJvbGUnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0Fzc2lnbmluZyBhZG1pbiBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjphZGRVc2VyVG9Sb2xlJyxcblx0XHRcdFx0YWN0aW9uOiAnQXNzaWduX2FkbWluJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0X2lkOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAoIXVzZXIgfHwgIXVzZXIuX2lkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmFkZFVzZXJUb1JvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBhZGQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5hZGRVc2VyUm9sZXModXNlci5faWQsIHJvbGVOYW1lLCBzY29wZSk7XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VJX0Rpc3BsYXlSb2xlcycpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCdyb2xlcy1jaGFuZ2UnLCB7XG5cdFx0XHRcdHR5cGU6ICdhZGRlZCcsXG5cdFx0XHRcdF9pZDogcm9sZU5hbWUsXG5cdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNjb3BlXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYWRkO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2F1dGhvcml6YXRpb246ZGVsZXRlUm9sZScocm9sZU5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQWNjZXNzaW5nIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmRlbGV0ZVJvbGUnLFxuXHRcdFx0XHRhY3Rpb246ICdBY2Nlc3NpbmdfcGVybWlzc2lvbnMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb2xlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZE9uZShyb2xlTmFtZSk7XG5cdFx0aWYgKCFyb2xlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvbGUnLCAnSW52YWxpZCByb2xlJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmRlbGV0ZVJvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAocm9sZS5wcm90ZWN0ZWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWRlbGV0ZS1wcm90ZWN0ZWQtcm9sZScsICdDYW5ub3QgZGVsZXRlIGEgcHJvdGVjdGVkIHJvbGUnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246ZGVsZXRlUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvbGVTY29wZSA9IHJvbGUuc2NvcGUgfHwgJ1VzZXJzJztcblx0XHRjb25zdCBtb2RlbCA9IFJvY2tldENoYXQubW9kZWxzW3JvbGVTY29wZV07XG5cdFx0Y29uc3QgZXhpc3RpbmdVc2VycyA9IG1vZGVsICYmIG1vZGVsLmZpbmRVc2Vyc0luUm9sZXMgJiYgbW9kZWwuZmluZFVzZXJzSW5Sb2xlcyhyb2xlTmFtZSk7XG5cblx0XHRpZiAoZXhpc3RpbmdVc2VycyAmJiBleGlzdGluZ1VzZXJzLmNvdW50KCkgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb2xlLWluLXVzZScsICdDYW5ub3QgZGVsZXRlIHJvbGUgYmVjYXVzZSBpdFxcJ3MgaW4gdXNlJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmRlbGV0ZVJvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMucmVtb3ZlKHJvbGUubmFtZSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2F1dGhvcml6YXRpb246cmVtb3ZlVXNlckZyb21Sb2xlJyhyb2xlTmFtZSwgdXNlcm5hbWUsIHNjb3BlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0FjY2VzcyBwZXJtaXNzaW9ucyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpyZW1vdmVVc2VyRnJvbVJvbGUnLFxuXHRcdFx0XHRhY3Rpb246ICdBY2Nlc3NpbmdfcGVybWlzc2lvbnMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIXJvbGVOYW1lIHx8ICFfLmlzU3RyaW5nKHJvbGVOYW1lKSB8fCAhdXNlcm5hbWUgfHwgIV8uaXNTdHJpbmcodXNlcm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWFyZ3VtZW50cycsICdJbnZhbGlkIGFyZ3VtZW50cycsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpyZW1vdmVVc2VyRnJvbVJvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0dXNlcm5hbWVcblx0XHR9LCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0X2lkOiAxLFxuXHRcdFx0XHRyb2xlczogMVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKCF1c2VyIHx8ICF1c2VyLl9pZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpyZW1vdmVVc2VyRnJvbVJvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBwcmV2ZW50IHJlbW92aW5nIGxhc3QgdXNlciBmcm9tIGFkbWluIHJvbGVcblx0XHRpZiAocm9sZU5hbWUgPT09ICdhZG1pbicpIHtcblx0XHRcdGNvbnN0IGFkbWluQ291bnQgPSBNZXRlb3IudXNlcnMuZmluZCh7XG5cdFx0XHRcdHJvbGVzOiB7XG5cdFx0XHRcdFx0JGluOiBbJ2FkbWluJ11cblx0XHRcdFx0fVxuXHRcdFx0fSkuY291bnQoKTtcblxuXHRcdFx0Y29uc3QgdXNlcklzQWRtaW4gPSB1c2VyLnJvbGVzLmluZGV4T2YoJ2FkbWluJykgPiAtMTtcblx0XHRcdGlmIChhZG1pbkNvdW50ID09PSAxICYmIHVzZXJJc0FkbWluKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdMZWF2aW5nIHRoZSBhcHAgd2l0aG91dCBhZG1pbnMgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAncmVtb3ZlVXNlckZyb21Sb2xlJyxcblx0XHRcdFx0XHRhY3Rpb246ICdSZW1vdmVfbGFzdF9hZG1pbidcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVtb3ZlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMucmVtb3ZlVXNlclJvbGVzKHVzZXIuX2lkLCByb2xlTmFtZSwgc2NvcGUpO1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVUlfRGlzcGxheVJvbGVzJykpIHtcblx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlMb2dnZWQoJ3JvbGVzLWNoYW5nZScsIHtcblx0XHRcdFx0dHlwZTogJ3JlbW92ZWQnLFxuXHRcdFx0XHRfaWQ6IHJvbGVOYW1lLFxuXHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzY29wZVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlbW92ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdhdXRob3JpemF0aW9uOnNhdmVSb2xlJyhyb2xlRGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBY2Nlc3NpbmcgcGVybWlzc2lvbnMgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246c2F2ZVJvbGUnLFxuXHRcdFx0XHRhY3Rpb246ICdBY2Nlc3NpbmdfcGVybWlzc2lvbnMnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIXJvbGVEYXRhLm5hbWUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvbGUtbmFtZS1yZXF1aXJlZCcsICdSb2xlIG5hbWUgaXMgcmVxdWlyZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246c2F2ZVJvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoWydVc2VycycsICdTdWJzY3JpcHRpb25zJ10uaW5jbHVkZXMocm9sZURhdGEuc2NvcGUpID09PSBmYWxzZSkge1xuXHRcdFx0cm9sZURhdGEuc2NvcGUgPSAnVXNlcnMnO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmNyZWF0ZU9yVXBkYXRlKHJvbGVEYXRhLm5hbWUsIHJvbGVEYXRhLnNjb3BlLCByb2xlRGF0YS5kZXNjcmlwdGlvbik7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVSV9EaXNwbGF5Um9sZXMnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgncm9sZXMtY2hhbmdlJywge1xuXHRcdFx0XHR0eXBlOiAnY2hhbmdlZCcsXG5cdFx0XHRcdF9pZDogcm9sZURhdGEubmFtZVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVwZGF0ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdhdXRob3JpemF0aW9uOmFkZFBlcm1pc3Npb25Ub1JvbGUnKHBlcm1pc3Npb24sIHJvbGUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQWRkaW5nIHBlcm1pc3Npb24gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246YWRkUGVybWlzc2lvblRvUm9sZScsXG5cdFx0XHRcdGFjdGlvbjogJ0FkZGluZ19wZXJtaXNzaW9uJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmFkZFJvbGUocGVybWlzc2lvbiwgcm9sZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0aG9yaXphdGlvbjpyZW1vdmVSb2xlRnJvbVBlcm1pc3Npb24nKHBlcm1pc3Npb24sIHJvbGUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQWNjZXNzaW5nIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOnJlbW92ZVJvbGVGcm9tUGVybWlzc2lvbicsXG5cdFx0XHRcdGFjdGlvbjogJ0FjY2Vzc2luZ19wZXJtaXNzaW9ucydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5yZW1vdmVSb2xlKHBlcm1pc3Npb24sIHJvbGUpO1xuXHR9XG59KTtcbiIsIi8qIGVzbGludCBuby1tdWx0aS1zcGFjZXM6IDAgKi9cblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdC8vIE5vdGU6XG5cdC8vIDEuaWYgd2UgbmVlZCB0byBjcmVhdGUgYSByb2xlIHRoYXQgY2FuIG9ubHkgZWRpdCBjaGFubmVsIG1lc3NhZ2UsIGJ1dCBub3QgZWRpdCBncm91cCBtZXNzYWdlXG5cdC8vIHRoZW4gd2UgY2FuIGRlZmluZSBlZGl0LTx0eXBlPi1tZXNzYWdlIGluc3RlYWQgb2YgZWRpdC1tZXNzYWdlXG5cdC8vIDIuIGFkbWluLCBtb2RlcmF0b3IsIGFuZCB1c2VyIHJvbGVzIHNob3VsZCBub3QgYmUgZGVsZXRlZCBhcyB0aGV5IGFyZSByZWZlcmVuZWQgaW4gdGhlIGNvZGUuXG5cdGNvbnN0IHBlcm1pc3Npb25zID0gW1xuXHRcdHsgX2lkOiAnYWNjZXNzLXBlcm1pc3Npb25zJywgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnYWRkLW9hdXRoLXNlcnZpY2UnLCAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnYWRkLXVzZXItdG8tam9pbmVkLXJvb20nLCAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ2FkZC11c2VyLXRvLWFueS1jLXJvb20nLCAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2FkZC11c2VyLXRvLWFueS1wLXJvb20nLCAgICAgICAgcm9sZXMgOiBbXSB9LFxuXHRcdHsgX2lkOiAnYXJjaGl2ZS1yb29tJywgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInXSB9LFxuXHRcdHsgX2lkOiAnYXNzaWduLWFkbWluLXJvbGUnLCAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnYmFuLXVzZXInLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ2J1bGstY3JlYXRlLWMnLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2J1bGstcmVnaXN0ZXItdXNlcicsICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2NyZWF0ZS1jJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ3VzZXInLCAnYm90J10gfSxcblx0XHR7IF9pZDogJ2NyZWF0ZS1kJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ3VzZXInLCAnYm90J10gfSxcblx0XHR7IF9pZDogJ2NyZWF0ZS1wJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ3VzZXInLCAnYm90J10gfSxcblx0XHR7IF9pZDogJ2NyZWF0ZS11c2VyJywgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2NsZWFuLWNoYW5uZWwtaGlzdG9yeScsICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSwgLy8gc3BlY2lhbCBwZXJtaXNzaW9uIHRvIGJ1bGsgZGVsZXRlIGEgY2hhbm5lbCdzIG1lc2FnZXNcblx0XHR7IF9pZDogJ2RlbGV0ZS1jJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ2RlbGV0ZS1kJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2RlbGV0ZS1tZXNzYWdlJywgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJywgJ21vZGVyYXRvciddIH0sXG5cdFx0eyBfaWQ6ICdkZWxldGUtcCcsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICdkZWxldGUtdXNlcicsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdlZGl0LW1lc3NhZ2UnLCAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAnZWRpdC1vdGhlci11c2VyLWFjdGl2ZS1zdGF0dXMnLCByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZWRpdC1vdGhlci11c2VyLWluZm8nLCAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZWRpdC1vdGhlci11c2VyLXBhc3N3b3JkJywgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZWRpdC1wcml2aWxlZ2VkLXNldHRpbmcnLCAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZWRpdC1yb29tJywgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ2ZvcmNlLWRlbGV0ZS1tZXNzYWdlJywgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ2pvaW4td2l0aG91dC1qb2luLWNvZGUnLCAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdsZWF2ZS1jJywgICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2JvdCcsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAnbGVhdmUtcCcsICAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnLCAnYW5vbnltb3VzJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1hc3NldHMnLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1lbW9qaScsICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1pbnRlZ3JhdGlvbnMnLCAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdtYW5hZ2Utb2F1dGgtYXBwcycsICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdtZW50aW9uLWFsbCcsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InLCAndXNlciddIH0sXG5cdFx0eyBfaWQ6ICdtZW50aW9uLWhlcmUnLCAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InLCAndXNlciddIH0sXG5cdFx0eyBfaWQ6ICdtdXRlLXVzZXInLCAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAncmVtb3ZlLXVzZXInLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ3J1bi1pbXBvcnQnLCAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ3J1bi1taWdyYXRpb24nLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ3NldC1tb2RlcmF0b3InLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ3NldC1vd25lcicsICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ3NlbmQtbWFueS1tZXNzYWdlcycsICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdzZXQtbGVhZGVyJywgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICd1bmFyY2hpdmUtcm9vbScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWMtcm9vbScsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2JvdCcsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndXNlci1nZW5lcmF0ZS1hY2Nlc3MtdG9rZW4nLCAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1kLXJvb20nLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1mdWxsLW90aGVyLXVzZXItaW5mbycsICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1oaXN0b3J5JywgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1qb2luZWQtcm9vbScsICAgICAgICAgICAgICByb2xlcyA6IFsnZ3Vlc3QnLCAnYm90JywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWpvaW4tY29kZScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWxvZ3MnLCAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LW90aGVyLXVzZXItY2hhbm5lbHMnLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXAtcm9vbScsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXByaXZpbGVnZWQtc2V0dGluZycsICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXN0YXRpc3RpY3MnLCAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXVzZXItYWRtaW5pc3RyYXRpb24nLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdwcmV2aWV3LWMtcm9vbScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LW91dHNpZGUtcm9vbScsICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InLCAndXNlciddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWJyb2FkY2FzdC1tZW1iZXItbGlzdCcsICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9XG5cdF07XG5cblx0Zm9yIChjb25zdCBwZXJtaXNzaW9uIG9mIHBlcm1pc3Npb25zKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5maW5kT25lQnlJZChwZXJtaXNzaW9uLl9pZCkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLnVwc2VydChwZXJtaXNzaW9uLl9pZCwgeyRzZXQ6IHBlcm1pc3Npb24gfSk7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgZGVmYXVsdFJvbGVzID0gW1xuXHRcdHsgbmFtZTogJ2FkbWluJywgICAgIHNjb3BlOiAnVXNlcnMnLCAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWRtaW4nIH0sXG5cdFx0eyBuYW1lOiAnbW9kZXJhdG9yJywgc2NvcGU6ICdTdWJzY3JpcHRpb25zJywgZGVzY3JpcHRpb246ICdNb2RlcmF0b3InIH0sXG5cdFx0eyBuYW1lOiAnbGVhZGVyJywgICAgc2NvcGU6ICdTdWJzY3JpcHRpb25zJywgZGVzY3JpcHRpb246ICdMZWFkZXInIH0sXG5cdFx0eyBuYW1lOiAnb3duZXInLCAgICAgc2NvcGU6ICdTdWJzY3JpcHRpb25zJywgZGVzY3JpcHRpb246ICdPd25lcicgfSxcblx0XHR7IG5hbWU6ICd1c2VyJywgICAgICBzY29wZTogJ1VzZXJzJywgICAgICAgICBkZXNjcmlwdGlvbjogJycgfSxcblx0XHR7IG5hbWU6ICdib3QnLCAgICAgICBzY29wZTogJ1VzZXJzJywgICAgICAgICBkZXNjcmlwdGlvbjogJycgfSxcblx0XHR7IG5hbWU6ICdndWVzdCcsICAgICBzY29wZTogJ1VzZXJzJywgICAgICAgICBkZXNjcmlwdGlvbjogJycgfSxcblx0XHR7IG5hbWU6ICdhbm9ueW1vdXMnLCBzY29wZTogJ1VzZXJzJywgICAgICAgICBkZXNjcmlwdGlvbjogJycgfVxuXHRdO1xuXG5cdGZvciAoY29uc3Qgcm9sZSBvZiBkZWZhdWx0Um9sZXMpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy51cHNlcnQoeyBfaWQ6IHJvbGUubmFtZSB9LCB7ICRzZXRPbkluc2VydDogeyBzY29wZTogcm9sZS5zY29wZSwgZGVzY3JpcHRpb246IHJvbGUuZGVzY3JpcHRpb24gfHwgJycsIHByb3RlY3RlZDogdHJ1ZSB9IH0pO1xuXHR9XG59KTtcbiJdfQ==
