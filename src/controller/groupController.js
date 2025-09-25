const { group, permission } = require('../model/groupPermission');
const account = require('../model/account');
const { ACCOUNT_KINDS } = require('../constants/constant');
const sequelize = require('../config/dbConfig')

exports.createGroup = async (req, res) => {
  try {
    const decode = req.user;
    // Lấy account đầy đủ từ DB kèm group và permission
    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Kiểm tra có phải admin không
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    // Kiểm tra quyền pCode G_C
    if (!decode.pCodes.includes('G_C')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { name, description, kind, permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({ message: 'At least one permissionId is required' });
    }

    const permissions = await permission.findAll({
      where: { id: permissionIds }
    });

    if (permissions.length !== permissionIds.length) {
      const existingIds = permissions.map(p => p.id.toString());
      const invalidIds = formattedIds.filter(id => !existingIds.includes(id));
      return res.status(400).json({
        message: 'Some permissionIds are invalid',
        invalidIds
      });
    }

    const newGroup = await group.create({ name, description, kind });
    await newGroup.setPermissions(permissions);

    res.status(200).json({ message: 'Group created successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Create group failed', error: error.message });
  }
};

exports.getList = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    if (!decode.pCodes.includes('G_L')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { kind } = req.query;
    if (!kind) {
      return res.status(400).json({ message: 'kind is required' });
    }

    const groups = await group.findAll({
      where: { kind },
      include: [
        {
          model: permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: [
            'id', 'name', 'action', 'description', 'nameGroup', 'pCode', 'createdAt'
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // ✅ Convert sang plain object rồi xử lý
    const result = groups.map(g => {
      const groupPlain = g.toJSON();
      groupPlain.permissions = groupPlain.permissions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(p => {
          const { createdAt, ...clean } = p; // loại bỏ createdAt
          return clean;
        });
      return groupPlain;
    });

    return res.status(200).json({
      message: 'Get group list successfully',
      data: result
    });
  } catch (error) {
    console.error('Get group list error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    if (!decode.pCodes.includes('G_V')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { id } = req.params;
    const existingGroup = await group.findByPk(id, {
      include: [
        {
          model: permission,
          as: 'permissions',
          through: { attributes: [] },
          attributes: ['id', 'name', 'action', 'description', 'nameGroup', 'pCode', 'createdAt']
        }
      ]
    });

    if (!existingGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Chuyển sang plain object
    const groupPlain = existingGroup.toJSON();

    // ✅ Sắp xếp permission theo createdAt giảm dần và loại bỏ createdAt
    groupPlain.permissions = groupPlain.permissions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(p => {
        const { createdAt, ...clean } = p;
        return clean;
      });

    return res.status(200).json({
      message: 'Get group detail successfully',
      data: groupPlain
    });
  } catch (error) {
    console.error('Get group detail error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

exports.updateGroup = async (req, res) => {
  try {
    const decode = req.user;
    // Lấy account đầy đủ từ DB kèm group và permission
    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Kiểm tra có phải admin không
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    // Kiểm tra quyền pCode G_U
    if (!decode.pCodes.includes('G_U')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { id, name, description, kind, permissionIds } = req.body;

    const existingGroup = await group.findByPk(id);
    if (!existingGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (permissionIds && (!Array.isArray(permissionIds) || permissionIds.length === 0)) {
      return res.status(400).json({ message: 'At least one permissionId is required if updating permissions' });
    }

    let permissions = [];
    if (permissionIds) {
      permissions = await permission.findAll({
        where: { id: permissionIds }
      });

      if (permissions.length !== permissionIds.length) {
        const existingIds = permissions.map(p => p.id.toString());
        const invalidIds = formattedIds.filter(id => !existingIds.includes(id));
        return res.status(400).json({
          message: 'Some permissionIds are invalid',
          invalidIds
        });
      }
    }

    await existingGroup.update({ name, description, kind });
    if (permissionIds) {
      await existingGroup.setPermissions(permissions);
    }

    res.status(200).json({ message: 'Group updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  const t = await sequelize.transaction(); // Dùng transaction để đảm bảo an toàn
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    if (!decode.pCodes.includes('G_D')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { id } = req.params;

    const existingGroup = await group.findByPk(id);
    if (!existingGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // ✅ Xoá toàn bộ liên kết với permission trong bảng trung gian
    // (chỉ cần gọi setPermissions([]) hoặc destroy trực tiếp bảng join)
    await existingGroup.setPermissions([], { transaction: t });
    await existingGroup.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('=======> Delete group failed: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
