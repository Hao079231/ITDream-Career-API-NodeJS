const task = require('../model/task');
const simulation = require('../model/simulation');
const educator = require('../model/educator');
const accountModel = require('../model/account');
const { ACCOUNT_KINDS, SIMULATION_STATUS, TASK_KIND } = require('../constants/constant');
const responseCleaner = require('../utils/responseCleaner');

exports.createTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await accountModel.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(404).json({ message: 'Educator not found' });

    // Chỉ educator được phép tạo task
    if (requestUser.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }

    if (!decode.pCodes.includes('T_C')) {
      return res.status(400).json({ message: 'Create task cannot be allowed' });
    }

    const {
      name, title, description, instruction, content, imagePath, filePath, simulationId, parentId, kind
    } = req.body;

    // Kiểm tra simulation tồn tại
    const sim = await simulation.findByPk(simulationId);
    if (!sim) return res.status(404).json({ message: 'Simulation not found' });

    // Nếu là subtask (kind = 2) thì phải có parentId và parent phải có kind = 1
    if (kind === TASK_KIND.SUBTASK) {
      if (!parentId) return res.status(400).json({ message: 'parentId is required' });
      const parentTask = await task.findByPk(parentId);
      if (!parentTask) return res.status(404).json({ message: 'Task not found' });
      if (parentTask.kind !== TASK_KIND.TASK) return res.status(400).json({ message: 'Parent task must have kind = TASK' });
    }

    await task.create({
      name,
      title,
      description,
      instruction,
      content,
      imagePath,
      filePath,
      simulationId,
      parentId: kind === TASK_KIND.SUBTASK ? parentId : null,
      kind
    });

    await sim.update({ status: SIMULATION_STATUS.WAITING_APPROVE });

    return res.status(200).json('Task created successfully');
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await accountModel.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(404).json({ message: 'Admin not found' });
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    if (!decode.pCodes.includes('T_L')) {
      return res.status(400).json({ message: 'List task cannot be allowed' });
    }

    const simulationId = req.query.simulationId || req.body.simulationId;
    if (!simulationId) return res.status(400).json({ message: 'simulationId is required' });

    const sim = await simulation.findByPk(simulationId);
    if (!sim) return res.status(404).json({ message: 'Simulation not found' });

    const tasks = await task.findAll({
      where: { simulationId, kind: TASK_KIND.TASK },
      include: [
        {
          model: task,
          as: 'subtasks',
          where: { kind: TASK_KIND.SUBTASK },
          required: false
        },
        {
          model: simulation,
          as: 'simulation',
          attributes: ['id', 'title'],
          include: [
            {
              model: educator,
              attributes: ['id', 'username', 'fullName', 'phone']
            }
          ],
          required: false
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: task, as: 'subtasks' }, 'id', 'ASC']
      ]
    });

    return res.status(200).json(responseCleaner.clean({ message: 'Get list task successfully', data: tasks }));
  } catch (error) {
    console.error('getListTask error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListTaskForEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await accountModel.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(401).json({ message: 'Educator not found' });
    if (requestUser.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('T_EDL')) {
      return res.status(400).json({ message: 'List task cannot be allowed' });
    }
    const simulationId = req.query.simulationId || req.body.simulationId;
    if (!simulationId) return res.status(400).json({ message: 'simulationId is required' });
    const sim = await simulation.findByPk(simulationId);
    if (!sim) return res.status(404).json({ message: 'Simulation not found' });
    if (sim.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'Educator not authorized for this simulation' });
    }
    const tasks = await task.findAll({
      where: { simulationId, kind: TASK_KIND.TASK },
      include: [
        {
          model: task,
          as: 'subtasks',
          where: { kind: TASK_KIND.SUBTASK },
          required: false
        },
        {
          model: simulation,
          as: 'simulation',
          attributes: ['id', 'title'],
          include: [
            {
              model: educator,
              attributes: ['username', 'fullName', 'phone']
            }
          ],
          required: false
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: task, as: 'subtasks' }, 'id', 'ASC']
      ]
    });
    return res.status(200).json(responseCleaner.clean({ message: 'Get list task successfully', data: tasks }));
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListTaskForStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await accountModel.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(401).json({ message: 'Student not found' });
    if (requestUser.kind !== ACCOUNT_KINDS.STUDENT) {
      return res.status(403).json({ message: 'User is not a student' });
    }
    if (!decode.pCodes.includes('T_STL')) {
      return res.status(400).json({ message: 'List task cannot be allowed' });
    }
    const simulationId = req.query.simulationId || req.body.simulationId;
    if (!simulationId) return res.status(400).json({ message: 'simulationId is required' });
    const sim = await simulation.findByPk(simulationId);
    if (!sim) return res.status(404).json({ message: 'Simulation not found' });
    if (sim.status !== SIMULATION_STATUS.ACTIVE) {
      return res.status(403).json({ message: 'Simulation is not active' });
    }
    const tasks = await task.findAll({
      where: { simulationId, kind: TASK_KIND.TASK },
      include: [
        {
          model: task,
          as: 'subtasks',
          where: { kind: TASK_KIND.SUBTASK },
          required: false
        },
        {
          model: simulation,
          as: 'simulation',
          attributes: ['id', 'title'],
          include: [
            {
              model: educator,
              attributes: ['username', 'fullName', 'phone']
            }
          ],
          required: false
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: task, as: 'subtasks' }, 'id', 'ASC']
      ]
    });

    return res.status(200).json(responseCleaner.clean({ message: 'Get list task successfully', data: tasks }));
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await accountModel.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(401).json({ message: 'Educator not found' });
    if (requestUser.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('T_U')) {
      return res.status(400).json({ message: 'Update task cannot be allowed' });
    }
    const { id, name, title, description, instruction, content, imagePath, filePath } = req.body;
    if (!id) return res.status(400).json({ message: 'Task id is required' });
    const existingTask = await task.findByPk(id);
    if (!existingTask) return res.status(404).json({ message: 'Task not found' });
    if (existingTask.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'Educator not authorized to update this task' });
    }
    await existingTask.update({
      name,
      title,
      description,
      instruction,
      content,
      imagePath,
      filePath
    });
    await sim.update({ status: SIMULATION_STATUS.WAITING_APPROVE });
    return res.status(200).json('Task updated successfully');
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await accountModel.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(404).json({ message: 'Educator not found' });
    if (requestUser.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('T_D')) {
      return res.status(400).json({ message: 'Delete task cannot be allowed' });
    }
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Task id is required' });
    const existingTask = await task.findByPk(id);
    if (!existingTask) return res.status(404).json({ message: 'Task not found' });
    if (existingTask.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'Educator not authorized to delete this task' });
    }
    // Nếu là TASK (kind = 1), xóa luôn các subtask thuộc task này
    if (existingTask.kind === TASK_KIND.TASK) {
      await task.destroy({ where: { parentId: existingTask.id, kind: TASK_KIND.SUBTASK } });
    }
    await existingTask.destroy();
    return res.status(200).json('Task deleted successfully');
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
