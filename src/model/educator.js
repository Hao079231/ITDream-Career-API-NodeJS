const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const accountModel = require('./account');

const educatorModel = sequelize.define('educatorModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    references: { model: accountModel, key: 'id' }
  }
}, {
  tableName: 'db_educator'
});

// Thiết lập quan hệ 1-1
accountModel.hasOne(educatorModel, { foreignKey: 'id' });
educatorModel.belongsTo(accountModel, { foreignKey: 'id' });

module.exports = educatorModel;