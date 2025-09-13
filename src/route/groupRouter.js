const express = require('express');
const router = express.Router();
const groupController = require('../controller/groupController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Group
 *   description: API quản lý Group (chỉ Admin mới có quyền)
 */

/**
 * @swagger
 * /v1/group/create:
 *   post:
 *     summary: Tạo mới Group
 *     tags: [Group]
 *     description: Cần JWT token hợp lệ.
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
 *               - description
 *               - kind
 *               - permissionIds
 *             properties:
 *               name:
 *                 type: string
 *                 example: Student Group
 *               description:
 *                 type: string
 *                 example: Nhóm quyền dành cho sinh viên
 *               kind:
 *                 type: string
 *                 example: STUDENT
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Tạo group thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group created successfully
 *                 group:
 *                   type: object
 *                   example:
 *                     id: 10
 *                     name: Student Group
 *                     description: Nhóm quyền dành cho sinh viên
 *                     kind: STUDENT
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example:
 *                     - id: 1
 *                       name: Xem môn học
 *                       pCode: MH_R
 *                     - id: 2
 *                       name: Tạo môn học
 *                       pCode: MH_C
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc thiếu permissionIds
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Account không tồn tại
 */
router.post('/group/create', authenticate, groupController.createGroup);

/**
 * @swagger
 * /v1/group/update:
 *   put:
 *     summary: Cập nhật Group (Chỉ Admin mới có quyền)
 *     tags: [Group]
 *     description: Cần JWT token hợp lệ.
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
 *                 example: 10
 *               name:
 *                 type: string
 *                 example: Student Group Updated
 *               description:
 *                 type: string
 *                 example: Nhóm quyền dành cho sinh viên (đã cập nhật)
 *               kind:
 *                 type: string
 *                 example: STUDENT
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4]
 *     responses:
 *       200:
 *         description: Cập nhật group thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group updated successfully
 *                 group:
 *                   type: object
 *                   example:
 *                     id: 10
 *                     name: Student Group Updated
 *                     description: Nhóm quyền dành cho sinh viên (đã cập nhật)
 *                     kind: STUDENT
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example:
 *                     - id: 2
 *                       name: Sửa môn học
 *                       pCode: MH_U
 *                     - id: 3
 *                       name: Xóa môn học
 *                       pCode: MH_D
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc permissionIds sai
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Group không tồn tại hoặc Account không tồn tại
 */
router.put('/group/update', authenticate, groupController.updateGroup);

module.exports = router;
