const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');
const generateId = require('../service/idGenerator');
const educatorModel = require('./educator');
const specializationModel = require('./specialization');
const { indexSimulation, deleteSimulation } = require('../service/simulationSearch');

const simulationModel = sequelize.define('simulationModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateId.generateId()
  },
  title: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  overview: DataTypes.TEXT,
  level: DataTypes.INTEGER,
  totalEstimatedTime: DataTypes.STRING,
  imagePath: DataTypes.STRING,
  avgRating: { type: DataTypes.FLOAT, defaultValue: 0 },
  participantQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  educatorId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: educatorModel, key: 'id' }
  },
  specializationId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: specializationModel, key: 'id' }
  },
  status: { type: DataTypes.INTEGER, defaultValue: 1 },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'db_simulation' });

// Quan hệ
educatorModel.hasMany(simulationModel, { foreignKey: 'educatorId', as: 'simulation' });
simulationModel.belongsTo(educatorModel, { foreignKey: 'educatorId', as: 'educator' });

specializationModel.hasMany(simulationModel, { foreignKey: 'specializationId', as: 'simulation' });
simulationModel.belongsTo(specializationModel, { foreignKey: 'specializationId', as: 'specialization' });

// Hooks chỉ index document
simulationModel.addHook('afterCreate', async (sim) => {
  try {
    await indexSimulation(sim); // không tạo index
  } catch (e) {
    console.error('ES index create error', e);
  }
});

simulationModel.addHook('afterUpdate', async (sim) => {
  try {
    await indexSimulation(sim);
  } catch (e) {
    console.error('ES index update error', e);
  }
});

simulationModel.addHook('afterDestroy', async (sim) => {
  try {
    await deleteSimulation(sim.id);
  } catch (e) {
    console.error('ES delete error', e);
  }
});

module.exports = simulationModel;
