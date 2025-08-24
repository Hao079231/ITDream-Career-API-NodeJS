const { group, permission } = require('../model/groupPermission');
const account = require('../model/account');
const { ACCOUNT_KINDS } = require('../constants/constant');

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

    res.status(200).json({
      message: 'Group created successfully',
      group: newGroup,
      permissions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Create group failed', error: error.message });
  }
};

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

    res.status(200).json({
      message: 'Group updated successfully',
      group: existingGroup,
      permissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update group failed', error: error.message });
  }
};