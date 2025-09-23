const { sequelize } = require('../config/dbConfig');
const simulation = require('../model/simulation');
const educator = require('../model/educator');
const student = require('../model/student');
const specialization = require('../model/specialization');
const account = require('../model/account');
const task = require('../model/task')
const responseCleaner = require('../utils/responseCleaner');
const { ACCOUNT_KINDS, SIMULATION_STATUS } = require('../constants/constant');
const { validateSimulationLevel } = require('../validation/simulationValidation');
const { searchByTitle } = require('../service/simulationSearch');
const SequelizeToJson = require('../utils/sequelizeToJson');
require('dotenv').config();

function buildFiltersFromQuery(query) {
  const where = {};
  if (query.specializationId) {
    const sid = Number(query.specializationId);
    if (!Number.isNaN(sid)) where.specializationId = sid;
  }
  if (query.level) {
    const lvl = Number(query.level);
    if (!Number.isNaN(lvl)) where.level = lvl;
  }
  return where;
}

exports.createSimulation = async (req, res) => {
  try {
    const decode = req.user;

    const requestUser = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });

    if (!requestUser) {
      return res.status(404).json({ message: 'Educator not found' });
    }

    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(400).json({ message: 'User is not an educator' });
    }

    if (!decode.pCodes.includes('SI_C')) {
      return res.status(403).json({ message: 'Simulation cannot be created' });
    }

    const { title, description, overview, level, totalEstimatedTime, imagePath, specializationId } = req.body;

    // Kiểm tra level có hợp lệ không
    const levelValidation = validateSimulationLevel(level);
    if (!levelValidation.isValid) {
      return res.status(400).json({
        message: levelValidation.message,
        validLevels: levelValidation.validLevels
      });
    }

    const simulationStatus = SIMULATION_STATUS.WAITING_APPROVE;

    await simulation.create({
      title,
      description,
      overview,
      level,
      totalEstimatedTime,
      imagePath,
      educatorId: requestUser.id,
      specializationId,
      status: simulationStatus
    });

    return res.status(200).json({ message: 'Simulation created successfully' });
  } catch (error) {
    console.error('Error creating simulation:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListSimulations = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    if (!decode.pCodes.includes('SI_L')) {
      return res.status(403).json({ message: 'Simulation cannot be listed' });
    }

    const filters = buildFiltersFromQuery(req.query);

    const simulations = await simulation.findAll({
      where: filters,
      include: [
        {
          model: educator,
          as: 'educator',
          include: [
            {
              model: account,
              as: 'account',
              attributes: ['id', 'username', 'fullName']
            }
          ]
        },
        {
          model: specialization,
          as: 'specialization',
          attributes: ['id', 'name']
        }
      ]
    });

    const plainData = SequelizeToJson.convert(simulations);

    return res.status(200).json({
      message: 'Get simulations successfully',
      data: { simulations: plainData }
    });
  } catch (error) {
    console.error('Error in getListSimulations:', error);
    return res.status(500).json({ message: 'Failed to retrieve simulations' });
  }
};

// List simulations for educator (only their own simulations)
// Shows: title, level, totalEstimatedTime, imagePath, avgRating, participantQuantity
// Can filter by specializationId and level via query params
exports.getListSimulationsForEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestEducator = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestEducator) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    if (requestEducator.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('SI_EDL')) {
      return res.status(403).json({ message: 'Simulation cannot be listed' });
    }

    const filters = buildFiltersFromQuery(req.query);
    filters.educatorId = requestEducator.id;

    const simulations = await simulation.findAll({
      where: filters,
      attributes: ['id', 'title', 'level', 'totalEstimatedTime', 'imagePath', 'avgRating', 'participantQuantity'],
      include: [{
        model: specialization,
        as: 'specialization',
        attributes: ['id', 'name']
      }]
    });

    const plainData = SequelizeToJson.convert(simulations);
    return res.status(200).json({
      message: 'Get simulations successfully',
      data: { simulations: plainData }
    });
  } catch (error) {
    console.error('Error in getListSimulationsForEducator:', error);
    return res.status(500).json({ message: 'Failed to retrieve simulations' });
  }
};

// List simulations for student (only active simulations)
// Shows: title, level, totalEstimatedTime, imagePath, avgRating, participantQuantity
// Can filter by specializationId and level via query params
exports.getListSimulationsForStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await student.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.account.kind !== ACCOUNT_KINDS.STUDENT) {
      return res.status(403).json({ message: 'User is not a student' });
    }
    if (!decode.pCodes.includes('SI_STL')) {
      return res.status(403).json({ message: 'Simulation cannot be listed' });
    }

    const filters = buildFiltersFromQuery(req.query);
    filters.status = SIMULATION_STATUS.ACTIVE;

    const simulations = await simulation.findAll({
      where: filters,
      attributes: ['id', 'title', 'level', 'totalEstimatedTime', 'imagePath', 'avgRating', 'participantQuantity'],
      include: [{
        model: specialization,
        as: 'specialization',
        attributes: ['id', 'name']
      }]
    });

    const plainData = SequelizeToJson.convert(simulations);
    return res.status(200).json({ message: 'Get student simulations successfully', data: { simulations: plainData } });
  } catch (error) {
    console.error('Error in getListSimulationsForStudent:', error);
    return res.status(500).json(responseCleaner.clean({ message: 'Failed to retrieve simulations' }));
  }
};

exports.getDetailSimulation = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('SI_V')) {
      return res.status(403).json({ message: 'Simulation cannot be viewed' });
    }
    const { id } = req.params;
    const sim = await simulation.findOne({
      where: { id },
      include: [
        {
          model: educator,
          as: 'educator',
          include: [
            {
              model: account,
              as: 'account',
              attributes: ['id', 'username', 'fullName']
            }
          ]
        },
        {
          model: specialization,
          as: 'specialization',
          attributes: ['id', 'name']
        }
      ]
    });
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    const plainData = SequelizeToJson.convert(sim);
    return res.status(200).json(responseCleaner.clean({ message: 'Get simulation successfully', data: { simulation: plainData } }));
  } catch (error) {
    console.error('Error in getDetailSimulation:', error);
    return res.status(500).json({ message: 'Failed to retrieve simulation details' });
  }
};

exports.getDetailSimulationForEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestEducator = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestEducator) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    if (requestEducator.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('SI_EDV')) {
      return res.status(403).json({ message: 'Simulation cannot be viewed' });
    }

    const { id } = req.params;
    const sim = await simulation.findOne({
      where: { id },
      include: [
        {
          model: educator,
          as: 'educator',
          include: [{
            model: account,
            as: 'account',
            attributes: ['username', 'fullName']
          }]
        },
        {
          model: specialization,
          as: 'specialization',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    if (sim.educatorId !== requestEducator.id) {
      return res.status(403).json({ message: 'You are not authorized to view this simulation' });
    }

    const plainData = SequelizeToJson.convert(sim);
    delete plainData.educatorId;
    delete plainData.specializationId;
    delete plainData.status;
    delete plainData.createdAt;
    delete plainData.updatedAt;
    delete plainData.educator.id;
    delete plainData.educator.createdAt;
    delete plainData.educator.updatedAt;

    return res.status(200).json({ message: 'Get simulation successfully', data: { simulation: plainData } });
  } catch (error) {
    console.error('Error in getDetailSimulationForEducator:', error);
    return res.status(500).json({ message: 'Failed to retrieve simulation details' });
  }
};

exports.getDetailSimulationForStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await student.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.account.kind !== ACCOUNT_KINDS.STUDENT) {
      return res.status(403).json({ message: 'User is not a student' });
    }
    if (!decode.pCodes.includes('SI_STV')) {
      return res.status(403).json({ message: 'Simulation cannot be viewed' });
    }

    const { id } = req.params;
    const sim = await simulation.findOne({
      where: { id, status: SIMULATION_STATUS.ACTIVE },
      include: [
        {
          model: educator,
          as: 'educator',
          include: [{
            model: account,
            as: 'account',
            attributes: ['username', 'fullName']
          }]
        },
        {
          model: specialization,
          as: 'specialization',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found or not active' });
    }

    const plainData = SequelizeToJson.convert(sim);

    return res.status(200).json({ message: 'Get simulation successfully', data: { simulation: plainData } });
  } catch (error) {
    console.error('Error in getDetailSimulationForStudent:', error);
    return res.status(500).json({ message: 'Failed to retrieve simulation details' });
  }
};

exports.updateSimulation = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('SI_U')) {
      return res.status(403).json({ message: 'Simulation cannot be updated' });
    }
    const { id, title, description, overview, level, totalEstimatedTime, imagePath, specializationId } = req.body;
    const sim = await simulation.findOne({ where: { id } });
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    if (sim.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'You are not authorized to update this simulation' });
    }

    // Kiểm tra level có hợp lệ không
    if (level !== undefined && level !== null) {
      const levelValidation = validateSimulationLevel(level);
      if (!levelValidation.isValid) {
        return res.status(400).json({
          message: levelValidation.message,
          validLevels: levelValidation.validLevels
        });
      }
    }
    const simulationStatus = SIMULATION_STATUS.WAITING_APPROVE;

    await sim.update({
      title: title || sim.title,
      description: description || sim.description,
      overview: overview || sim.overview,
      level: level || sim.level,
      totalEstimatedTime: totalEstimatedTime || sim.totalEstimatedTime,
      imagePath: imagePath || sim.imagePath,
      specializationId: specializationId || sim.specializationId,
      status: simulationStatus
    });
    return res.status(200).json({ message: 'Simulation updated successfully' });
  }
  catch (error) {
    console.error('Error in updateSimulation:', error);
    return res.status(500).json({ message: 'Failed to update simulation' });
  }
};

exports.deleteSimulation = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('SI_D')) {
      return res.status(403).json({ message: 'Simulation cannot be deleted' });
    }
    const { id } = req.params;
    const sim = await simulation.findOne({ where: { id } });
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    if (sim.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this simulation' });
    }
    await task.destroy({ where: { simulationId: sim.id } });
    await sim.destroy();
    return res.status(200).json({ message: 'Simulation deleted successfully' });
  } catch (error) {
    console.error('Error in deleteSimulation:', error);
    return res.status(500).json({ message: 'Failed to delete simulation' });
  }
};

exports.searchSimulations = async (req, res) => {
  try {
    const { query, size = 20, page = 1, specializationId, level } = req.query;
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }
    const from = (Number(page) - 1) * Number(size);
    const hits = await searchByTitle(query, Number(size), from);

    const ids = hits.hits.map(hit => hit._source.id);
    if (ids.length === 0) {
      return res.status(200).json({ message: 'Search simulations successfully', data: { simulations: [], total: 0 } });
    }

    const where = { id: ids };
    // apply optional filters (specializationId, level)
    if (specializationId) {
      const sid = Number(specializationId);
      if (!Number.isNaN(sid)) where.specializationId = sid;
    }
    if (level) {
      const lvl = Number(level);
      if (!Number.isNaN(lvl)) where.level = lvl;
    }

    const simulations = await simulation.findAll({
      where,
      include: [
        { model: educator, include: [{ model: account, attributes: ['username', 'fullName'] }] },
        { model: specialization, attributes: ['id', 'name'] }
      ]
    });

    // preserve order from ES results
    const map = new Map(simulations.map(sim => [sim.id, sim]));
    const ordered = ids.map(id => map.get(id)).filter(Boolean);

    return res.status(200).json({ message: 'Search simulations successfully', data: { simulations: ordered, total: hits.total?.value || hits.total } });
  } catch (error) {
    console.error('Error in searchSimulations:', error);
    return res.status(500).json({ message: 'Failed to search simulations' });
  }
};

// Approve simulation (admin only). Changes status from WAITING_APPROVE => ACTIVE
exports.approveSimulation = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    if (!decode.pCodes.includes('SI_AP')) {
      return res.status(403).json({ message: 'Simulation cannot be approved' });
    }

    const { id } = req.body;
    const sim = await simulation.findOne({ where: { id } });
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    if (sim.status === SIMULATION_STATUS.ACTIVE) {
      return res.status(400).json({ message: 'Simulation is already active' });
    }

    // Only transition from waiting -> active
    await sim.update({ status: SIMULATION_STATUS.ACTIVE });

    return res.status(200).json({ message: 'Simulation approved successfully' });
  } catch (error) {
    console.error('Error in approveSimulation:', error);
    return res.status(500).json({ message: 'Failed to approve simulation' });
  }
};