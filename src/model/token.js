const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const generateId = require('../service/idGenerator');
const accountModel = require('./account');

const tokenModel = sequelize.define('tokenModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateId.generateId()
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: false
  }
},
  {
    tableName: 'db_token'
  });

tokenModel.belongsTo(accountModel, { foreignKey: 'accountId', allowNull: false });
accountModel.hasMany(tokenModel, { foreignKey: 'accountId' });

module.exports = tokenModel;