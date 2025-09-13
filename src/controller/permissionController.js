const permission = require('../model/permission');
const account = require('../model/account');
const { ACCOUNT_KINDS } = require('../constants/constant');

exports.createPermission = async (req, res) => {
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

    // Kiểm tra quyền pCode P_C
    if (!decode.pCodes.includes('P_C')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { name, description, action, nameGroup, pCode } = req.body;

    // Kiểm tra nếu permission đã tồn tại
    const existingPermission = await permission.findOne({ where: { action } });
    if (existingPermission) {
      return res.status(400).json({ message: 'Permission already exists' });
    }

    // Tạo permission mới
    await permission.create({ name, description, action, nameGroup, pCode });

    res.status(200).json({ message: 'Permission created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Create permission failed' });
  }
}

exports.getAllPermissions = async (req, res) => {
  try {
    const decode = req.user;

    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!requestUser.kind === ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    if (!decode.pCodes.includes('P_L')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const permissions = await permission.findAll();
    res.status(200).json({ message: 'Get all permissions successfully', permissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Get all permissions failed' });
  }
}