const account = require('../model/account');
const student = require('../model/student');
const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../service/emailService');
const { ACCOUNT_STATUS, ACCOUNT_KINDS } = require('../constants/constant');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.registerStudent = async (req, res) => {
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
      kind: ACCOUNT_KINDS.STUDENT,  // lưu kind từ constant
      status: ACCOUNT_STATUS.PENDING,  // lưu status từ constant
      otp,                             // lưu otp vào DB
      otpAttempts: 0
    });

    // Tạo student map 1-1 với account: id student = id account
    await student.create({
      id: newAccount.id
    });

    // Gửi email OTP
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'Student registered. OTP sent to email.' });
  } catch (error) {
    console.error('Error registering student:', error);
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