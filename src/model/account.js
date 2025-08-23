const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const ACCOUNT_STATUS = require('../constants/constant');
const generateId = require('../service/idGenerator');

const accountModel = sequelize.define('accountModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: generateId.generateId()
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  birthday: {
    type: DataTypes.DATE,
    allowNull: true
  },
  kind: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otpAttempt: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: ACCOUNT_STATUS.ACTIVE
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'db_account',
});

module.exports = accountModel;