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

    if (requestUser.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(400).json({ message: 'User is not an educator' });
    }

    if (requestUser.status === ACCOUNT_STATUS.LOCKED) {
      return res.status(400).json({ message: 'Account is locked' });
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

exports.approveEducator = async (req, res) => {
  try {
    const decode = req.user; // payload đã decode từ token { id, username, kind, pCodes }

    // Chỉ admin có quyền
    if (decode.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(400).json({ message: 'User is not admin' });
    }

    if (!decode.pCodes.includes('ED_AP')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const { educatorId } = req.body;

    // Tìm educator theo educatorId
    const educator = await account.findByPk(educatorId);
    if (!educator) {
      return res.status(404).json({ message: 'Educator not found' });
    }

    // Cập nhật trạng thái educator thành approved
    educator.status = ACCOUNT_STATUS.ACTIVE;
    await educator.save();

    return res.status(200).json({ message: 'Educator approved successfully' });
  } catch (error) {
    console.error('Error approving educator:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
