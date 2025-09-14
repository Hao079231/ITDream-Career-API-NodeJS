const express = require('express');
const router = express.Router();
const educatorController = require('../controller/educatorController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Educator
 *   description: API cho Educator (Đăng ký và lấy profile)
 */

/**
 * @swagger
 * /v1/educator/register:
 *   post:
 *     summary: Đăng ký Educator
 *     tags: [Educator]
 *     description: Tạo mới tài khoản Educator và gửi OTP về email
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
 *               - birthday
 *             properties:
 *               email:
 *                 type: string
 *                 example: teacher@example.com
 *               username:
 *                 type: string
 *                 example: teacher123
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               password:
 *                 type: string
 *                 example: P@ssword123
 *               phone:
 *                 type: string
 *                 example: "0912345678"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: 1990-05-20
 *     responses:
 *       200:
 *         description: Đăng ký thành công, OTP được gửi về email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: educator registered. OTP sent to email.
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc bị trùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already exists
 */
router.post('/educator/register', educatorController.registerEducator);


/**
 * @swagger
 * /v1/educator/profile:
 *   get:
 *     summary: Lấy thông tin profile Educator
 *     tags: [Educator]
 *     description: Trả về thông tin profile educator, cần token JWT hợp lệ
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get educator profile successfully
 *                 profile:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: teacher@example.com
 *                     username:
 *                       type: string
 *                       example: teacher123
 *                     fullName:
 *                       type: string
 *                       example: Nguyễn Văn A
 *                     phone:
 *                       type: string
 *                       example: "0912345678"
 *                     birthday:
 *                       type: string
 *                       format: date
 *                       example: 1990-05-20
 *       403:
 *         description: Không có quyền
 * 
 *       404:
 *         description: Không tìm thấy educator
 */
router.get('/educator/profile', authenticate, educatorController.getProfileEducator);

/**
 * @swagger
 * /v1/educator/approve:
 *   put:
 *     summary: Phê duyệt educator (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Educator
 *     security:
 *       - bearerAuth: []   # Yêu cầu JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - educatorId
 *             properties:
 *               educatorId:
 *                 type: integer
 *                 example: 123
 *                 description: ID của educator cần phê duyệt
 *     responses:
 *       200:
 *         description: Phê duyệt educator thành công
 *       400:
 *         description: Người dùng không phải admin
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy educator
 */

router.put('/educator/approve', authenticate, educatorController.approveEducator);

/**
 * @swagger
 * /v1/educator/list:
 *   get:
 *     summary: Lấy danh sách Educator (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Educator
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách educator thành công
 *       400:
 *         description: Người dùng không phải admin
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.get('/educator/list', authenticate, educatorController.getListEducators);

/**
 * @swagger
 * /v1/educator/get:
 *   get:
 *     summary: Lấy chi tiết Educator (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Educator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của educator cần lấy chi tiết
 *     responses:
 *       200:
 *         description: Lấy chi tiết educator thành công
 *       400:
 *         description: Người dùng không phải admin
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy educator
 */
router.get('/educator/get/:id', authenticate, educatorController.getDetailEducator);

/**
 * @swagger
 * /v1/educator/update:
 *   put:
 *     summary: Cập nhật thông tin Educator (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Educator
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - educatorId
 *             properties:
 *               educatorId:
 *                 type: integer
 *                 example: 123
 *               email:
 *                 type: string
 *                 example: educator@gmail.com
 *               username:
 *                 type: string
 *                 example: edu01
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, LOCKED]
 *     responses:
 *       200:
 *         description: Cập nhật educator thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc người dùng không phải admin
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy educator
 */
router.put('/educator/update', authenticate, educatorController.updateEducator);

/**
 * @swagger
 * /v1/educator/delete:
 *   delete:
 *     summary: Xóa Educator (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Educator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của educator cần xóa
 *     responses:
 *       200:
 *         description: Xóa educator thành công
 *       400:
 *         description: Người dùng không phải admin
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy educator
 */
router.delete('/educator/delete/:id', authenticate, educatorController.deleteEducator);

/**
 * @swagger
 * /v1/educator/client-update:
 *   put:
 *     summary: Educator tự cập nhật hồ sơ cá nhân
 *     description: Chỉ Educator có thể gọi API này.
 *     tags:
 *       - Educator
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
 *                 example: educator@gmail.com
 *               username:
 *                 type: string
 *                 example: edu01
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               birthday:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: Cập nhật hồ sơ educator thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tài khoản bị khóa
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy educator
 */
router.put('/educator/client-update', authenticate, educatorController.updateProfileEducator);
module.exports = router;