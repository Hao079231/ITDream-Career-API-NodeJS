const express = require('express');
const router = express.Router();
const specializationController = require('../controller/specializationController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Specialization
 *   description: API cho Specialization (Quản lý chuyên ngành)
 */

/**
 * @swagger
 * /v1/specialization/create:
 *   post:
 *     summary: Tạo mới Specialization (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Specialization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Khoa học máy tính"
 *                 description: Tên của specialization
 *     responses:
 *       200:
 *         description: Tạo specialization thành công
 *       400:
 *         description: Specialization đã tồn tại
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.post('/specialization/create', authenticate, specializationController.createSpecialization);

/**
 * @swagger
 * /v1/specialization/list:
 *   get:
 *     summary: Lấy danh sách Specialization (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Specialization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách specialization thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.get('/specialization/list', authenticate, specializationController.getListSpecializations);

/**
 * @swagger
 * /v1/specialization/update:
 *   put:
 *     summary: Cập nhật Specialization (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Specialization
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
 *               - name
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *                 description: ID của specialization cần cập nhật
 *               name:
 *                 type: string
 *                 example: "Khoa học dữ liệu"
 *                 description: Tên mới của specialization
 *     responses:
 *       200:
 *         description: Cập nhật specialization thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy specialization
 */
router.put('/specialization/update', authenticate, specializationController.updateSpecialization);

/**
 * @swagger
 * /v1/specialization/delete:
 *   delete:
 *     summary: Xóa Specialization (yêu cầu quyền)
 *     description: Chỉ Admin có quyền gọi API này.
 *     tags:
 *       - Specialization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của specialization cần xóa
 *     responses:
 *       200:
 *         description: Xóa specialization thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Không tìm thấy specialization
 */
router.delete('/specialization/delete/:id', authenticate, specializationController.deleteSpecialization);

module.exports = router;