const group = require('./group');
const permission = require('./permission');

group.belongsToMany(permission, {
  through: 'db_group_permission',
  foreignKey: 'groupId',
  otherKey: 'permissionId',
  as: 'permissions'
});

permission.belongsToMany(group, {
  through: 'db_group_permission',
  foreignKey: 'permissionId',
  otherKey: 'groupId',
  as: 'groups'
});

module.exports = { group, permission };
