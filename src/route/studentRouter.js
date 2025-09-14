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

/**
 * @swagger
 * /v1/student/list:
 *   get:
 *     summary: Lấy danh sách Student (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách student thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.get('/student/list', authenticate, studentController.getListStudents);

/**
 * @swagger
 * /v1/student/get:
 *   get:
 *     summary: Xem chi tiết Student (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của student cần xem chi tiết
 *     responses:
 *       200:
 *         description: Lấy chi tiết student thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy student
 */
router.get('/student/get/:id', authenticate, studentController.getDetailStudent);

/**
 * @swagger
 * /v1/student/update:
 *   put:
 *     summary: Cập nhật Student (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 101
 *                 description: ID của student cần cập nhật
 *               email:
 *                 type: string
 *                 example: "student01@gmail.com"
 *               username:
 *                 type: string
 *                 example: "student01"
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *     responses:
 *       200:
 *         description: Cập nhật student thành công
 *       400:
 *         description: Trùng email, username hoặc số điện thoại
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy student
 */
router.put('/student/update', authenticate, studentController.updateStudent);

/**
 * @swagger
 * /v1/student/delete:
 *   delete:
 *     summary: Xóa Student (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của student cần xóa
 *     responses:
 *       200:
 *         description: Xóa student thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy student
 */
router.delete('/student/delete/:id', authenticate, studentController.deleteStudent);

/**
 * @swagger
 * /v1/student/client-update:
 *   put:
 *     summary: Student cập nhật thông tin cá nhân
 *     description: Student tự cập nhật profile, cần permission code `ST_STU`.
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "student01@gmail.com"
 *               username:
 *                 type: string
 *                 example: "student01"
 *               fullName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *     responses:
 *       200:
 *         description: Student cập nhật profile thành công
 *       400:
 *         description: Trùng email, username hoặc số điện thoại
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Không tìm thấy student
 */
router.put('/student/client-update', authenticate, studentController.updateProfileStudent);
module.exports = router;
