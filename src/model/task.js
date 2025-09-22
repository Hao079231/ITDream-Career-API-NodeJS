const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const generateId = require('../service/idGenerator');
const simulationModel = require('./simulation');

const taskModel = sequelize.define('taskModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateId.generateId()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  instruction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  kind: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  parentId: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  simulationId: {
    type: DataTypes.BIGINT,
    allowNull: false
  }
}, {
  tableName: 'db_task'
});

// Thiết lập quan hệ N - 1 giữa taskModel và simulationModel
taskModel.hasMany(taskModel, { foreignKey: 'simulationId' });
simulationModel.belongsTo(taskModel, { foreignKey: 'simulationId' });

// Thiết lập quan hệ N - 1 giữa taskModel và chính nó để biểu diễn quan hệ cha-con
taskModel.hasMany(taskModel, { foreignKey: 'parentId' });
taskModel.belongsTo(taskModel, { foreignKey: 'parentId' });

module.exports = taskModel;