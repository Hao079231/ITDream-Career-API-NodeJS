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

/**
 * @swagger
 * /v1/group/list:
 *   get:
 *     summary: Lấy danh sách Group (chỉ Admin)
 *     tags: [Group]
 *     description: |
 *       Truyền `kind` bắt buộc để lấy danh sách group thuộc loại (kind) chỉ định.
 *       Kết quả trả về bao gồm cả danh sách permission đã gán cho mỗi group.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kind
 *         schema:
 *           type: string
 *         required: true
 *         description: Loại Group cần lấy
 *         example: 2
 *     responses:
 *       200:
 *         description: Lấy danh sách group thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get group list successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 10
 *                       name:
 *                         type: string
 *                         example: Student Group
 *                       description:
 *                         type: string
 *                         example: Nhóm quyền dành cho sinh viên
 *                       kind:
 *                         type: string
 *                         example: STUDENT
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-25T10:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-25T10:00:00.000Z"
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             name:
 *                               type: string
 *                               example: Xem môn học
 *                             action:
 *                               type: string
 *                               example: READ
 *                             description:
 *                               type: string
 *                               example: Quyền xem môn học
 *                             nameGroup:
 *                               type: string
 *                               example: Môn học
 *                             pCode:
 *                               type: string
 *                               example: MH_R
 *       400:
 *         description: Thiếu hoặc sai query kind
 *       403:
 *         description: Không có quyền hoặc không phải admin
 *       404:
 *         description: Account không tồn tại
 */

router.get('/group/list', authenticate, groupController.getList);

/**
 * @swagger
 * /v1/group/delete/{id}:
 *   delete:
 *     summary: Xóa Group (chỉ Admin)
 *     tags: [Group]
 *     description: |
 *       Xóa group theo id. Khi xóa group sẽ tự động xóa toàn bộ các liên kết giữa group và permission
 *       trong bảng trung gian (db_group_permission).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của group cần xóa
 *         example: 10
 *     responses:
 *       200:
 *         description: Xóa group thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group deleted successfully
 *       403:
 *         description: Không có quyền hoặc không phải admin
 *       404:
 *         description: Group không tồn tại hoặc Account không tồn tại
 */
router.delete('/group/delete/:id', authenticate, groupController.deleteGroup);

/**
 * @swagger
 * /v1/group/get/{id}:
 *   get:
 *     summary: Lấy chi tiết Group
 *     tags: [Group]
 *     description: |
 *       Chỉ Admin mới có quyền.  
 *       Truyền ID group để lấy chi tiết thông tin group và danh sách permission đã gán.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của group cần xem chi tiết
 *         example: 10
 *     responses:
 *       200:
 *         description: Lấy thông tin group thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get group detail successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     name:
 *                       type: string
 *                       example: Student Group
 *                     description:
 *                       type: string
 *                       example: Nhóm quyền dành cho sinh viên
 *                     kind:
 *                       type: string
 *                       example: STUDENT
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: Xem môn học
 *                           action:
 *                             type: string
 *                             example: READ
 *                           description:
 *                             type: string
 *                             example: Quyền xem môn học
 *                           nameGroup:
 *                             type: string
 *                             example: Môn học
 *                           pCode:
 *                             type: string
 *                             example: MH_R
 *       403:
 *         description: Không có quyền hoặc không phải admin
 *       404:
 *         description: Group hoặc Account không tồn tại
 */
router.get('/group/get/:id', authenticate, groupController.get);

module.exports = router;
