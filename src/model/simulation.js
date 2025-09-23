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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  totalEstimatedTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avgRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  participantQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
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
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
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
  tableName: 'db_simulation'
});

// Thiết lập quan hệ N - 1 giữa simulationModel và educatorModel
educatorModel.hasMany(simulationModel, { foreignKey: 'educatorId', as: 'simulation' });
simulationModel.belongsTo(educatorModel, { foreignKey: 'educatorId', as: 'educator' });

// Thiết lập quan hệ N - 1 giữa simulationModel và specializationModel
specializationModel.hasMany(simulationModel, { foreignKey: 'specializationId', as: 'simulaiton' });
simulationModel.belongsTo(specializationModel, { foreignKey: 'specializationId', as: 'specialization' });

// Hooks: index khi create/update, xóa khi destroy
simulationModel.addHook('afterCreate', async (sim) => {
  try {
    // chỉ index document, không tạo lại index
    await indexSimulation(sim, { createIndexIfMissing: true });
  } catch (e) {
    console.error('ES index create error', e);
  }
});
simulationModel.addHook('afterUpdate', async (sim) => {
  try {
    await indexSimulation(sim); // chỉ update doc
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