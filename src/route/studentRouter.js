const express = require('express');
const router = express.Router();
const studentController = require('../controller/studentController');
const { authenticate } = require('../middleware/jwtMiddleware');

// Đăng ký student
router.post('/student/register', studentController.registerStudent);

// Xác thực OTP
router.post('/student/verify-otp', studentController.verifyOtp);

router.get('/student/profile', authenticate, studentController.getProfileStudent);

module.exports = router;