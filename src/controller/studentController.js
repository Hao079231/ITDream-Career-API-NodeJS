const account = require('../model/account');
const student = require('../model/student');
const group = require('../model/group');
const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../service/emailService');
const { ACCOUNT_STATUS, ACCOUNT_KINDS } = require('../constants/constant');
const responseCleaner = require('../utils/responseCleaner');

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

    // Kiểm tra có tồn tại group STUDENT không
    const studentGroup = await group.findOne({ where: { kind: ACCOUNT_KINDS.STUDENT } });
    if (!studentGroup) {
      return res.status(400).json({ message: 'Student group does not exist' });
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
      groupId: studentGroup.id,      // lưu groupId vào DB
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

exports.getProfileStudent = async (req, res) => {
  try {
    const decode = req.user; // payload đã decode từ token { id, username, kind, pCodes }
    const requestUser = await account.findByPk(decode.id);

    if (!requestUser) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!decode.pCodes.includes('ST_P')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const studentData = requestUser.toJSON();
    delete studentData.id;
    delete studentData.password;
    delete studentData.kind;
    delete studentData.status;
    delete studentData.isAdmin;
    delete studentData.createdAt;
    delete studentData.updatedAt;
    delete studentData.groupId;

    return res.status(200).json(responseCleaner.clean({ message: 'Get student profile successfully', profile: studentData }));
  } catch (error) {
    console.error('Error getting student profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateProfileStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findByPk(decode.id);
    if (!requestUser) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!decode.pCodes.includes('ST_STU')) {
      return res.status(403).json({ message: 'Update profile student cannot allowed' });
    }
    const { email, username, fullName, phone, birthday } = req.body;

    // Kiểm tra trùng lặp
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

    return res.status(200).json({ message: 'Student profile updated successfully' });
  }
  catch (error) {
    console.error('Error updating student profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getListStudents = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('ST_L')) {
      return res.status(403).json({ message: 'Student cannot be listed' });
    }
    const students = await account.findAll({ where: { kind: ACCOUNT_KINDS.STUDENT } });
    const studentList = students.map(student => {
      const studentData = student.toJSON();
      delete studentData.password;
      delete studentData.kind;
      delete studentData.isAdmin;
      delete studentData.createdAt;
      delete studentData.updatedAt;
      delete studentData.groupId;
      return studentData;
    });
    res.status(200).json(responseCleaner.clean({ message: 'Get list student successfully', data: studentList }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve students' });
  }
};

exports.getDetailStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('ST_V')) {
      return res.status(403).json({ message: 'Student cannot be viewed' });
    }
    const { id } = req.params;
    const studentToView = await account.findOne({ where: { id, kind: ACCOUNT_KINDS.STUDENT } });
    if (!studentToView) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const studentData = studentToView.toJSON();
    delete studentData.password;
    delete studentData.kind;
    delete studentData.isAdmin;
    delete studentData.createdAt;
    delete studentData.updatedAt;
    delete studentData.groupId;
    res.status(200).json(responseCleaner.clean({ message: 'Get detail student successfully', data: studentData }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve student detail' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('ST_U')) {
      return res.status(403).json({ message: 'Student cannot be updated' });
    }

    const { id, email, username, fullName, phone, birthday } = req.body;
    const studentToUpdate = await account.findOne({ where: { id, kind: ACCOUNT_KINDS.STUDENT } });
    if (!studentToUpdate) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Kiểm tra trùng lặp
    if (email && email !== studentToUpdate.email) {
      const existingEmail = await account.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      studentToUpdate.email = email;
    }
    if (username && username !== studentToUpdate.username) {
      const existingUsername = await account.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      studentToUpdate.username = username;
    }
    if (phone && phone !== studentToUpdate.phone) {
      const existingPhone = await account.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }
      studentToUpdate.phone = phone;
    }
    if (fullName) {
      studentToUpdate.fullName = fullName;
    }
    if (birthday) {
      studentToUpdate.birthday = birthday;
    }
    await studentToUpdate.save();

    return res.status(200).json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update student' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const decode = req.user;
    const requestUser = await account.findOne({ where: { id: decode.id } });
    if (!requestUser) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (requestUser.kind !== ACCOUNT_KINDS.ADMIN) {
      return res.status(403).json({ message: 'User is not an admin' });
    }
    if (!decode.pCodes.includes('ST_D')) {
      return res.status(403).json({ message: 'Student cannot be deleted' });
    }
    const { id } = req.params;
    const studentToDelete = await account.findOne({ where: { id, kind: ACCOUNT_KINDS.STUDENT } });
    if (!studentToDelete) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await studentToDelete.destroy();
    return res.status(200).json({ message: 'Student deleted successfully' });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete student' });
  }
};