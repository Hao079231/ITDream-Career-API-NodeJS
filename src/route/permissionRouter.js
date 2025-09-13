const express = require('express');
const router = express.Router();
const permissionController = require('../controller/permissionController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Permission
 *   description: API quản lý Permission (chỉ Admin có quyền)
 */

/**
 * @swagger
 * /v1/permission/create:
 *   post:
 *     summary: Tạo Permission mới
 *     tags: [Permission]
 *     description: Yêu cầu JWT token hợp lệ.
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
 *               - action
 *               - nameGroup
 *               - pCode
 *             properties:
 *               name:
 *                 type: string
 *                 example: Quản lý nhóm
 *               description:
 *                 type: string
 *                 example: Quyền tạo nhóm mới
 *               action:
 *                 type: string
 *                 example: CREATE_GROUP
 *               nameGroup:
 *                 type: string
 *                 example: Group
 *               pCode:
 *                 type: string
 *                 example: G_C
 *     responses:
 *       201:
 *         description: Tạo permission thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Permission created successfully
 *                 permission:
 *                   type: object
 *                   example:
 *                     id: 1
 *                     name: Quản lý nhóm
 *                     description: Quyền tạo nhóm mới
 *                     action: CREATE_GROUP
 *                     nameGroup: Group
 *                     pCode: G_C
 *       400:
 *         description: Permission đã tồn tại
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Account không tồn tại
 */
router.post('/permission/create', authenticate, permissionController.createPermission);

/**
 * @swagger
 * /v1/permission/list:
 *   get:
 *     summary: Lấy danh sách tất cả Permission
 *     tags: [Permission]
 *     description: Yêu cầu JWT token hợp lệ.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách permission thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get all permissions successfully
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example:
 *                     - id: 1
 *                       name: Quản lý nhóm
 *                       description: Quyền tạo nhóm mới
 *                       action: CREATE_GROUP
 *                       nameGroup: Group
 *                       pCode: G_C
 *                     - id: 2
 *                       name: Quản lý sinh viên
 *                       description: Quyền xem thông tin sinh viên
 *                       action: VIEW_STUDENT
 *                       nameGroup: Student
 *                       pCode: ST_P
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Account không tồn tại
 */
router.get('/permission/list', authenticate, permissionController.getAllPermissions);

module.exports = router;