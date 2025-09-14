const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const generateId = require('../service/idGenerator');

const specializationModel = sequelize.define('specializationModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateId.generateId()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = specializationModel;
