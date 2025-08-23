const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const accountModel = require('./account');

const studentModel = sequelize.define('studentModel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: accountModel, key: 'id' }
  }
}, {
  tableName: 'db_student'
});

// Thiết lập quan hệ 1-1
accountModel.hasOne(studentModel, { foreignKey: 'id' });
studentModel.belongsTo(accountModel, { foreignKey: 'id' });

module.exports = studentModel;