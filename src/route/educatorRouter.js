const express = require('express');
const router = express.Router();
const educatorController = require('../controller/educatorController');
const { authenticate } = require('../middleware/jwtMiddleware');

// Đăng ký educator
router.post('/educator/register', educatorController.registerEducator);

// Xác thực OTP
router.post('/educator/verify-otp', educatorController.verifyOtp);

router.post('/educator/resend-otp', educatorController.resendOtp);

router.get('/educator/profile', authenticate, educatorController.getProfileEducator);

module.exports = router;