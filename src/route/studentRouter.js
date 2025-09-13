const express = require('express');
const router = express.Router();
const studentController = require('../controller/studentController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: API quản lý tài khoản sinh viên
 */

/**
 * @swagger
 * /v1/student/register:
 *   post:
 *     summary: Đăng ký tài khoản sinh viên
 *     tags: [Student]
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
 *                 example: student@example.com
 *               username:
 *                 type: string
 *                 example: student01
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               password:
 *                 type: string
 *                 example: student123
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: 2000-05-20
 *     responses:
 *       200:
 *         description: Đăng ký thành công, OTP đã gửi về email
 *       400:
 *         description: Trùng email/username/số điện thoại hoặc group không tồn tại
 */
router.post('/student/register', studentController.registerStudent);

/**
 * @swagger
 * /v1/student/profile:
 *   get:
 *     summary: Lấy thông tin profile sinh viên
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy profile thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get student profile successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: student@example.com
 *                     username:
 *                       type: string
 *                       example: student01
 *                     fullName:
 *                       type: string
 *                       example: Nguyen Van A
 *                     phone:
 *                       type: string
 *                       example: "0912345678"
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: 2000-05-20
 */
router.get('/student/profile', authenticate, studentController.getProfileStudent);

module.exports = router;
