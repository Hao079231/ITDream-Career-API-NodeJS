const account = require('../model/account');
const educator = require('../model/educator');
const group = require('../model/group');
const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../service/emailService');
const { ACCOUNT_STATUS, ACCOUNT_KINDS } = require('../constants/constant');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.registerEducator = async (req, res) => {
  try {
    const { email, username, fullName, password, phone, birthday } = req.body;

    // Kiểm tra trùng lặp
    const existingEmail = await account.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingUsername = await account.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingPhone = await account.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Kiểm tra có tồn tại group educator không
    const educatorGroup = await group.findOne({ where: { kind: ACCOUNT_KINDS.EDUCATOR } });
    if (!educatorGroup) {
      return res.status(400).json({ message: 'Educator group does not exist' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo OTP
    const otp = generateOtp();

    // Tạo account với trạng thái pending
    const newAccount = await account.create({
      email,
      username,
      fullName,
      password: hashedPassword,
      phone,
      birthday,
      kind: ACCOUNT_KINDS.EDUCATOR,  // lưu kind từ constant
      groupId: educatorGroup.id,      // lưu groupId vào DB
      status: ACCOUNT_STATUS.PENDING,  // lưu status từ constant
      otp,                             // lưu otp vào DB
      otpAttempts: 0
    });

    // Tạo educator map 1-1 với account: id educator = id account
    await educator.create({
      id: newAccount.id
    });

    // Gửi email OTP
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'educator registered. OTP sent to email.' });
  } catch (error) {
    console.error('Error registering educator:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === -1) return res.status(403).json({ message: 'Account is locked' });

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
    user.status = ACCOUNT_STATUS.ACTIVE;
    user.otp = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'OTP verified. Account activated.' });
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

    if (user.status === -1) return res.status(403).json({ message: 'Account is locked' });

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

exports.getProfileEducator = async (req, res) => {
  try {
    const decode = req.user; // payload đã decode từ token { id, username, kind, pCodes }
    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'Educator not found' });
    }

    if (!decode.pCodes.includes('ED_P')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const educatorData = requestUser.toJSON();
    delete educatorData.id;
    delete educatorData.password;
    delete educatorData.kind;
    delete educatorData.status;
    delete educatorData.otp;
    delete educatorData.otpAttempt;
    delete educatorData.isAdmin;
    delete educatorData.createdAt;
    delete educatorData.updatedAt;
    delete educatorData.groupId;

    return res.status(200).json({ message: 'Get educator profile successfully', profile: educatorData });
  } catch (error) {
    console.error('Error getting educator profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.forgotPasswordEducator = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await account.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === ACCOUNT_STATUS.LOCKED) {
      return res.status(403).json({ message: 'Fobiden' });
    }
    const otp = generateOtp();
    user.otp = otp;
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

exports.resetPasswordEducator = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!user) return res.status(404).json({ message: 'Account not found' });

    if (user.status === ACCOUNT_STATUS.LOCKED) {
      return res.status(403).json({ message: 'Account is locked' });
    }

    // Kiểm tra OTP
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

    // OTP đúng → reset password ngay
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password with OTP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

