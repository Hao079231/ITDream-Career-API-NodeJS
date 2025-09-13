const express = require('express');
const router = express.Router();
const accountController = require('../controller/accountController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: API quản lý tài khoản
 */

/**
 * @swagger
 * /api/token:
 *   post:
 *     summary: Đăng nhập lấy token
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grantType
 *               - password
 *             properties:
 *               grantType:
 *                 type: string
 *                 enum: [admin, student, educator]
 *                 example: admin
 *               username:
 *                 type: string
 *                 example: admin
 *               email:
 *                 type: string
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về accessToken và refreshToken
 */
router.post('/api/token', accountController.login);

/**
 * @swagger
 * /v1/account/verify-otp:
 *   post:
 *     summary: Xác thực OTP
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Xác thực thành công
 */
router.post('/v1/account/verify-otp', accountController.verifyOtp);

/**
 * @swagger
 * /v1/account/resend-otp:
 *   post:
 *     summary: Gửi lại OTP đến email
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP đã được gửi lại
 */
router.post('/v1/account/resend-otp', accountController.resendOtp);

/**
 * @swagger
 * /v1/account/forgot-password:
 *   post:
 *     summary: Quên mật khẩu (gửi OTP đến email)
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP khôi phục đã được gửi
 */
router.post('/v1/account/forgot-password', accountController.forgotPassword);

/**
 * @swagger
 * /v1/account/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Đặt mật khẩu thành công
 */
router.post('/v1/account/reset-password', accountController.resetPassword);

/**
 * @swagger
 * /v1/admin/create:
 *   post:
 *     summary: Tạo tài khoản admin (yêu cầu quyền) chỉ admin mới tạo được admin
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - fullName
 *               - password
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 example: newadmin@example.com
 *               username:
 *                 type: string
 *                 example: newadmin
 *               fullName:
 *                 type: string
 *                 example: New Admin
 *               password:
 *                 type: string
 *                 example: admin123
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *     responses:
 *       201:
 *         description: Tạo admin thành công
 */
router.post('/v1/admin/create', authenticate, accountController.createAdmin);

/**
 * @swagger
 * /v1/admin/profile:
 *   get:
 *     summary: Lấy thông tin profile admin (yêu cầu quyền)
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin admin trả về (không bao gồm password)
 */
router.get('/v1/admin/profile', authenticate, accountController.getProfileAdmin);

module.exports = router;
