const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const generateId = require('../service/idGenerator');

const groupModel = sequelize.define('groupModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateId.generateId()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  kind: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
},
  {
    tableName: 'db_group',
  });

module.exports = groupModel;
