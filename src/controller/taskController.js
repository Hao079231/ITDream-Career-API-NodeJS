const task = require('../model/task');
const simulation = require('../model/simulation');
const educator = require('../model/educator');
const student = require('../model/student');
const account = require('../model/account');
const SequelizeToJson = require('../utils/sequelizeToJson');
const { ACCOUNT_KINDS, SIMULATION_STATUS, TASK_KIND } = require('../constants/constant');
const simulationModel = require('../model/simulation');

exports.createTask = async (req, res) => {
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

    // Chỉ educator được phép tạo task
    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }

    if (!decode.pCodes.includes('T_C')) {
      return res.status(400).json({ message: 'Create task cannot be allowed' });
    }

    const {
      name, title, description, instruction, content,
      imagePath, filePath, simulationId, parentId, kind
    } = req.body;

    // ✅ Tìm simulation do cùng educator tạo
    const sim = await simulation.findOne({
      where: {
        id: simulationId,
        educatorId: requestUser.id
      }
    });
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    // ✅ Nếu là task (kind = 1) thì name không trùng trong cùng simulation
    if (kind === TASK_KIND.TASK) {
      const existTask = await task.findOne({
        where: {
          simulationId,
          kind: TASK_KIND.TASK,
          name
        }
      });
      if (existTask) {
        return res.status(400).json({ message: 'Task name already exists' });
      }
    }


    // ✅ Kiểm tra title không trùng trong cùng simulation
    const existSubtask = await task.findOne({
      where: {
        simulationId,
        name,
        title
      }
    });
    if (existSubtask) {
      return res.status(400).json({ message: 'Subtask title already exists' });
    }
    if (kind === TASK_KIND.SUBTASK) {
      const parentSubtask = await task.findOne({ where: { parentId } });
      if (!parentSubtask) {
        return res.status(404).json({ message: 'Parent subtask not found' });
      }
    }

    // ✅ Tạo mới task
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

    // ✅ Cập nhật trạng thái simulation
    await sim.update({ status: SIMULATION_STATUS.WAITING_APPROVE });

    return res.status(200).json({ message: 'Task created successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) return res.status(404).json({ message: 'Admin not found' });
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }

    if (!decode.pCodes.includes('T_L')) {
      return res.status(400).json({ message: 'List task cannot be allowed' });
    }

    const simulationId = req.query.simulationId;
    if (!simulationId) return res.status(400).json({ message: 'simulationId is required' });

    const tasks = await task.findAll({
      where: { simulationId, kind: TASK_KIND.TASK },
      include: [
        {
          model: task,
          as: 'subtask',
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
              as: 'educator',
              include: [
                {
                  model: account,
                  as: 'account',
                  attributes: ['id', 'username', 'fullName']
                }
              ]
            }
          ],
          required: false
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: task, as: 'subtask' }, 'id', 'ASC']
      ]
    });

    const plainData = SequelizeToJson.convert(tasks);

    return res.status(200).json({ message: 'Get list task successfully', data: plainData });
  } catch (error) {
    console.error('getListTask error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListTaskForEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) return res.status(401).json({ message: 'Educator not found' });
    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('T_EDL')) {
      return res.status(400).json({ message: 'List task cannot be allowed' });
    }
    const simulationId = req.query.simulationId;
    if (!simulationId) return res.status(400).json({ message: 'simulationId is required' });
    const tasks = await task.findAll({
      where: { simulationId, kind: TASK_KIND.TASK },
      include: [
        {
          model: task,
          as: 'subtask',
          where: { kind: TASK_KIND.SUBTASK },
          required: false
        },
        {
          model: simulation,
          as: 'simulation',
          attributes: ['id', 'title'],
          required: true,
          where: { educatorId: requestUser.id },
          include: [
            {
              model: educator,
              as: 'educator',
              include: [{
                model: account,
                as: 'account',
                attributes: ['username', 'fullName', 'phone']
              }
              ]
            }
          ]
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: task, as: 'subtask' }, 'id', 'ASC']
      ]
    });
    const plainData = SequelizeToJson.convert(tasks)
    plainData.forEach(t => {
      delete t.simulationId;
      delete t.createdAt;
      delete t.updatedAt;

      if (Array.isArray(t.subtask)) {
        t.subtask.forEach(st => {
          delete st.simulationId;
          delete st.createdAt;
          delete st.updatedAt;
        });
      }

      if (t.simulation && t.simulation.educator) {
        delete t.simulation.educator.id;
        delete t.simulation.educator.createdAt;
        delete t.simulation.educator.updatedAt;
      }
    });
    return res.status(200).json({ message: 'Get list task successfully', data: plainData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListTaskForStudent = async (req, res) => {
  try {
    const decode = req.user;

    // ✅ Xác thực student
    const requestUser = await student.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) return res.status(401).json({ message: 'Student not found' });
    if (requestUser.account.kind !== ACCOUNT_KINDS.STUDENT) {
      return res.status(403).json({ message: 'User is not a student' });
    }
    if (!decode.pCodes.includes('T_STL')) {
      return res.status(400).json({ message: 'List task cannot be allowed' });
    }

    // ✅ Lấy simulationId từ query
    const simulationId = req.query.simulationId;
    if (!simulationId) return res.status(400).json({ message: 'simulationId is required' });

    // ✅ Truy vấn tasks (simulation phải ACTIVE)
    const tasks = await task.findAll({
      where: { simulationId, kind: TASK_KIND.TASK },
      include: [
        {
          model: task,
          as: 'subtask',
          where: { kind: TASK_KIND.SUBTASK },
          required: false
        },
        {
          model: simulation,
          as: 'simulation',
          attributes: ['id', 'title'],
          where: { status: SIMULATION_STATUS.ACTIVE },
          include: [
            {
              model: educator,
              as: 'educator',
              include: [{
                model: account,
                as: 'account',
                attributes: ['username', 'fullName', 'phone']
              }]
            }
          ],
          required: true
        }
      ],
      order: [
        ['id', 'ASC'],
        [{ model: task, as: 'subtask' }, 'id', 'ASC']
      ]
    });

    // ✅ Chuyển sang object thuần
    const plainData = SequelizeToJson.convert(tasks);

    // ✅ Xóa các field không muốn hiển thị
    plainData.forEach(t => {
      delete t.simulationId;
      delete t.createdAt;
      delete t.updatedAt;

      if (Array.isArray(t.subtask)) {
        t.subtask.forEach(st => {
          delete st.simulationId;
          delete st.createdAt;
          delete st.updatedAt;
        });
      }

      if (t.simulation && t.simulation.educator) {
        delete t.simulation.educator.id;
        delete t.simulation.educator.createdAt;
        delete t.simulation.educator.updatedAt;
      }
    });

    return res.status(200).json({
      message: 'Get list task successfully',
      data: plainData
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.updateTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) return res.status(401).json({ message: 'Educator not found' });
    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('T_U')) {
      return res.status(400).json({ message: 'Update task cannot be allowed' });
    }
    const { id, name, title, description, instruction, content, imagePath, filePath } = req.body;
    const existingTask = await task.findByPk(id);
    if (!existingTask) return res.status(404).json({ message: 'Task not found' });
    const simulation = await simulationModel.findByPk(existingTask.simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    if (simulation.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'Educator not authorized to update this task' });
    }
    if (existingTask.getName.toLowerCase() !== name.toLowerCase()) {
      // ✅ Nếu là task (kind = 1) thì name không trùng trong cùng simulation
      if (existingTask.kind === TASK_KIND.TASK) {
        const existTask = await task.findOne({
          where: {
            kind: TASK_KIND.TASK,
            name,
            simulationId: existingTask.id
          }
        });
        if (existTask) {
          return res.status(400).json({ message: 'Task name already exists' });
        }
      } else {
        return res.status(400).json({ message: 'Task name cannot updated' });
      }
    }

    if (existingTask.title.toLowerCase() !== title.toLowerCase()) {
      const existSubtask = task.findOne({
        where: {
          title,
          simulationId: existingTask.id
        }
      });
      if (existSubtask) {
        return res.status(400).json({ message: 'Subtask title already exists' });
      }
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
    await task.update(
      { name },
      { where: { parentId: existingTask.id, kind: TASK_KIND.SUBTASK } }
    );
    await simulation.update({ status: SIMULATION_STATUS.WAITING_APPROVE });
    return res.status(200).json({ message: 'Task updated successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await educator.findOne({
      where: { id: decode.id },
      include: [{
        association: 'account',
        attributes: ['kind', 'email', 'username']
      }]
    });
    if (!requestUser) return res.status(404).json({ message: 'Educator not found' });
    if (requestUser.account.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(403).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('T_D')) {
      return res.status(400).json({ message: 'Delete task cannot be allowed' });
    }
    const { id } = req.params;
    const existingTask = await task.findByPk(id);
    if (!existingTask) return res.status(404).json({ message: 'Task not found' });
    const simulation = await simulationModel.findByPk(existingTask.simulationId);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    // Kiểm tra quyền dựa vào educatorId của Simulation
    if (simulation.educatorId !== requestUser.id) {
      return res.status(403).json({ message: 'Educator not authorized to delete this task' });
    }
    // Nếu là TASK (kind = 1), xóa luôn các subtask thuộc task này
    if (existingTask.kind === TASK_KIND.TASK) {
      await task.destroy({ where: { parentId: existingTask.id, kind: TASK_KIND.SUBTASK } });
    }
    await existingTask.destroy();
    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
