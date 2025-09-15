const account = require('../model/account');
const educator = require('../model/educator');
const group = require('../model/group');
const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../service/emailService');
const { ACCOUNT_STATUS, ACCOUNT_KINDS } = require('../constants/constant');
const ResponseCleaner = require('../utils/responseCleaner');
const e = require('express');

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
    delete educatorData.isAdmin;
    delete educatorData.createdAt;
    delete educatorData.updatedAt;
    delete educatorData.groupId;

    return res.status(200).json(ResponseCleaner.clean({ message: 'Get educator profile successfully', profile: educatorData }));
  } catch (error) {
    console.error('Error getting educator profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListEducators = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(400).json({ message: 'User is not admin' });
    }
    if (!decode.pCodes.includes('ED_L')) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    const educators = await account.findAll({ where: { kind: ACCOUNT_KINDS.EDUCATOR } });
    const educatorList = educators.map(educator => {
      const educatorData = educator.toJSON();
      delete educatorData.password;
      delete educatorData.kind;
      delete educatorData.isAdmin;
      delete educatorData.groupId;
      delete educatorData.createdAt;
      delete educatorData.updatedAt;
      return educatorData;
    });
    return res.status(200).json(ResponseCleaner.clean({ message: 'Get list educators successfully', educators: educatorList }));
  }
  catch (error) {
    console.error('Error getting list of educators:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDetailEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(400).json({ message: 'User is not admin' });
    }
    if (!decode.pCodes.includes('ED_V')) {
      return res.status(403).json({ message: 'Get educator detail cannot allowed' });
    }
    const { educatorId } = req.params;
    const educator = await account.findByPk(educatorId);
    if (!educator || educator.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    const educatorData = educator.toJSON();
    delete educatorData.password;

    return res.status(200).json(ResponseCleaner.clean({ message: 'Get educator detail successfully', educator: educatorData }));
  } catch (error) {
    console.error('Error getting educator detail:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(400).json({ message: 'User is not admin' });
    }
    if (!decode.pCodes.includes('ED_U')) {
      return res.status(403).json({ message: 'Update educator cannot allowed' });
    }

    const { educatorId, email, username, fullName, phone, birthday, status } = req.body;
    const educatorToUpdate = await account.findByPk(educatorId);
    if (!educatorToUpdate || educatorToUpdate.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    // Kiểm tra trùng lặp email, username, phone
    if (email && email !== educatorToUpdate.email) {
      const existingEmail = await account.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      educatorToUpdate.email = email;
    }
    if (username && username !== educatorToUpdate.username) {
      const existingUsername = await account.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      educatorToUpdate.username = username;
    }
    if (phone && phone !== educatorToUpdate.phone) {
      const existingPhone = await account.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
      educatorToUpdate.phone = phone;
    }
    if (fullName) {
      educatorToUpdate.fullName = fullName;
    }
    if (birthday) {
      educatorToUpdate.birthday = birthday;
    }
    if (status !== undefined) {
      if (![ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.LOCKED].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      educatorToUpdate.status = status;
    }
    await educatorToUpdate.save();
    return res.status(200).json({ message: 'Educator updated successfully' });
  } catch (error) {
    console.error('Error updating educator:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(400).json({ message: 'User is not admin' });
    }
    if (!decode.pCodes.includes('ED_D')) {
      return res.status(403).json({ message: 'Delete educator cannot allowed' });
    }
    const { educatorId } = req.params;
    const educatorToDelete = await account.findByPk(educatorId);
    if (!educatorToDelete || educatorToDelete.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(404).json({ message: 'Educator not found' });
    }
    await educatorToDelete.destroy();
    return res.status(200).json({ message: 'Educator deleted successfully' });
  } catch (error) {
    console.error('Error deleting educator:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateProfileEducator = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Educator not found' });
    }

    if (requestUser.kind !== ACCOUNT_KINDS.EDUCATOR) {
      return res.status(400).json({ message: 'User is not an educator' });
    }
    if (!decode.pCodes.includes('ED_EDU')) {
      return res.status(403).json({ message: 'Update profile educator cannot allowed' });
    }
    if (requestUser.status === ACCOUNT_STATUS.LOCKED) {
      return res.status(400).json({ message: 'Account is locked' });
    }
    const { email, username, fullName, phone, birthday } = req.body;
    if (email && email !== requestUser.email) {
      const existingEmail = await account.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      requestUser.email = email;
    }
    if (username && username !== requestUser.username) {
      const existingUsername = await account.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      requestUser.username = username;
    }
    if (phone && phone !== requestUser.phone) {
      const existingPhone = await account.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
      requestUser.phone = phone;
    }
    if (fullName) {
      requestUser.fullName = fullName;
    }
    if (birthday) {
      requestUser.birthday = birthday;
    }
    await requestUser.save();
    return res.status(200).json({ message: 'Educator profile updated successfully' });
  } catch (error) {
    console.error('Error updating educator profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.approveEducator = async (req, res) => {
  try {
    const decode = req.user;

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
