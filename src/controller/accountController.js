const account = require('../model/account');
const token = require('../model/token');
const group = require('../model/group');
const permission = require('../model/permission');
const { sendOtpEmail } = require('../service/emailService');
const { ACCOUNT_STATUS, ACCOUNT_KINDS } = require('../constants/constant');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken } = require('../middleware/jwtAuth');
require('dotenv').config();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      if (user.kind === ACCOUNT_KINDS.EDUCATOR && user.status === ACCOUNT_STATUS.WAITING_APPROVE) {
        return res.status(400).json({ message: 'Account is waiting for approval' });
      }
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

    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(400).json({ message: 'User is not admin' });
    }

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

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === ACCOUNT_STATUS.LOCKED) return res.status(400).json({ message: 'Account is locked' });

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 5) {
        user.status = ACCOUNT_STATUS.LOCKED;
        await user.save();
        return res.status(403).json({ message: 'Account locked due to too many failed attempts' });
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP', attempts: user.otpAttempts });
    }

    // Đúng OTP
    if (user.kind === ACCOUNT_KINDS.EDUCATOR) {
      user.status = ACCOUNT_STATUS.WAITING_APPROVE;
    } else {
      user.status = ACCOUNT_STATUS.ACTIVE;
    }
    user.otp = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'Verify OTP successfully.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === ACCOUNT_STATUS.LOCKED) return res.status(400).json({ message: 'Account is locked' });

    // Tạo OTP mới
    const otp = generateOtp();
    user.otp = otp;
    user.otpAttempts = 0;
    await user.save();

    // Gửi email OTP
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP resent. Please check your email.' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === ACCOUNT_STATUS.LOCKED) {
      return res.status(400).json({ message: 'Account is locked' });
    }
    const otp = generateOtp();
    user.otp = otp;
    user.status = ACCOUNT_STATUS.PENDING;
    user.otpAttempts = 0;
    await user.save();

    // Gửi email OTP
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent to email. Please verify to reset password.' });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === ACCOUNT_STATUS.LOCKED) {
      return res.status(400).json({ message: 'Account is locked' });
    }

    // Kiểm tra OTP
    if (user.otp !== otp) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 5) {
        user.status = ACCOUNT_STATUS.LOCKED;
        await user.save();
        return res.status(400).json({ message: 'Account locked due to too many failed attempts' });
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP', attempts: user.otpAttempts });
    }

    // OTP đúng → reset password ngay
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.status = ACCOUNT_STATUS.ACTIVE;
    user.otp = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password with OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};