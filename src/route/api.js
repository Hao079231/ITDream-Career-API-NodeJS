const express = require('express');
const router = express.Router();
const studentController = require('../controller/studentController');

// Đăng ký student
router.post('/student/register', studentController.registerStudent);

// Xác thực OTP
router.post('/student/verify-otp', studentController.verifyOtp);

module.exports = router;