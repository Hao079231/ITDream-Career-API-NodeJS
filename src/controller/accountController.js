const account = require('../model/account');
const token = require('../model/token');
const group = require('../model/group');
const permission = require('../model/permission');
const { ACCOUNT_STATUS, ACCOUNT_KINDS } = require('../constants/constant');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken } = require('../middleware/jwtAuth');
require('dotenv').config();


exports.login = async (req, res) => {
  try {
    const { grantType, username, email, password } = req.body;
    let user;

    if (grantType === 'admin') {
      // Đăng nhập bằng username
      user = await account.findOne({ where: { username } });
    } else if (grantType === 'student' || grantType === 'educator') {
      // Đăng nhập bằng email
      user = await account.findOne({ where: { email } });
    } else {
      return res.status(400).json({ message: 'Invalid grantType' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Tạo tokens
    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);

    await token.create({
      accountId: user.id,
      access_token: accessToken,
      refresh_token: refreshToken
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
};


exports.createAdmin = async (req, res) => {
  try {
    // Lấy thông tin user từ token (được verifyAccessToken gắn vào)
    const decodedUser = req.user;

    // Lấy account đầy đủ từ DB kèm group và permission
    const requestUser = await account.findByPk(decodedUser.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Kiểm tra có phải admin không
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not admin' });
    }

    // Kiểm tra quyền pCode AD_C
    if (!decodedUser.pCodes.includes('AD_C')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { email, username, fullName, password, phone, birthday } = req.body;

    // Kiểm tra email tồn tại hay chưa
    const existingUser = await account.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Kiểm tra username tồn tại hay chưa
    const existingUsername = await account.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Kiểm tra số điện thoại tồn tại hay chưa
    const existingPhone = await account.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Kiểm tra group có tồn tại với kind ADMIN không
    const adminGroup = await group.findOne({ where: { kind: ACCOUNT_KINDS.ADMIN } });
    if (!adminGroup) {
      return res.status(400).json({ message: 'Admin group does not exist' });
    }

    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo tài khoản admin mới
    const newAdmin = await account.create({
      email,
      username,
      fullName,
      password: hashedPassword,
      phone,
      birthday,
      kind: ACCOUNT_KINDS.ADMIN,
      isAdmin: true,
      groupId: adminGroup.id
    });

    res.status(200).json({ message: 'Admin created successfully', admin: newAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Add admin failed' });
  }
}

exports.getProfileAdmin = async (req, res) => {
  try {
    const decode = req.user; // payload đã decode từ token { id, username, kind, pCodes }

    // Lấy account đầy đủ từ DB kèm group và permission
    const requestUser = await account.findByPk(decode.id, {
      include: [
        {
          model: group,
          as: 'groupModel',
          include: [
            {
              model: permission,
              as: 'permissions'
            },
          ],
        },
      ],
    });

    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!decode.pCodes.includes('AD_P')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const adminData = requestUser.toJSON();
    delete adminData.password;

    res.status(200).json({
      message: 'Get profile success',
      admin: adminData
    });
  } catch (error) {
    console.error('Error in getProfileAdmin:', error);
    res.status(500).json({ message: 'Failed to retrieve admin profile' });
  }
};
