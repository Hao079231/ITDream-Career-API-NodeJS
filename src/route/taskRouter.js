const express = require('express');
const router = express.Router();
const taskController = require('../controller/taskController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Task
 *   description: API cho Task (Quản lý task và subtask)
 */

/**
 * @swagger
 * /v1/task/create:
 *   post:
 *     summary: Tạo mới Task/Subtask
 *     description: Chỉ Educator có quyền tạo task. Nếu tạo subtask (kind = 2) phải truyền parentId (parent phải có kind = 1)
 *     tags:
 *       - Task
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
 *               - title
 *               - simulationId
 *               - kind
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instruction:
 *                 type: string
 *               content:
 *                 type: string
 *               imagePath:
 *                 type: string
 *               filePath:
 *                 type: string
 *               simulationId:
 *                 type: integer
 *               parentId:
 *                 type: integer
 *                 description: Required when kind = 2 (subtask)
 *               kind:
 *                 type: integer
 *                 description: 1 = Task, 2 = Subtask
 *     responses:
 *       200:
 *         description: Tạo task thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (ví dụ thiếu parentId cho subtask)
 *       403:
 *         description: Người dùng không phải educator hoặc không có quyền
 *       404:
 *         description: Simulation hoặc parent task không tồn tại
 */
router.post('/task/create', authenticate, taskController.createTask);

/**
 * @swagger
 * /v1/task/list:
 *   get:
 *     summary: Lấy danh sách Task và Subtask theo simulation (Admin)
 *     description: Chỉ Admin có quyền xem. Trả về các Task (kind = 1) cùng các Subtask (kind = 2) thuộc từng Task, kèm thông tin simulation và educator
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation
 *     responses:
 *       200:
 *         description: Lấy danh sách task thành công
 *       400:
 *         description: Thiếu simulationId hoặc không có quyền
 *       403:
 *         description: Người dùng không phải admin
 *       404:
 *         description: Simulation không tồn tại
 */
router.get('/task/list', authenticate, taskController.getListTask);

/**
 * @swagger
 * /v1/task/educator-list:
 *   get:
 *     summary: Lấy danh sách Task và Subtask cho Educator (chỉ simulation của họ)
 *     description: Educator chỉ xem được task của các simulation do họ tạo. Trả về Task (kind = 1) và Subtask (kind = 2) kèm thông tin simulation và educator
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation (phải thuộc educator hiện tại)
 *     responses:
 *       200:
 *         description: Lấy danh sách task cho educator thành công
 *       400:
 *         description: Thiếu simulationId hoặc không có quyền
 *       403:
 *         description: Người dùng không phải educator hoặc không được phép truy cập simulation này
 *       404:
 *         description: Simulation không tồn tại
 */
router.get('/task/educator-list', authenticate, taskController.getListTaskForEducator);

/**
 * @swagger
 * /v1/task/student-list:
 *   get:
 *     summary: Lấy danh sách Task và Subtask cho Student (chỉ simulation active)
 *     description: Student chỉ xem được task của simulation có status = ACTIVE. Trả về Task (kind = 1) và Subtask (kind = 2) kèm thông tin simulation và educator
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: simulationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation (phải có status = ACTIVE)
 *     responses:
 *       200:
 *         description: Lấy danh sách task cho student thành công
 *       400:
 *         description: Thiếu simulationId hoặc không có quyền
 *       403:
 *         description: Người dùng không phải student hoặc simulation không active
 *       404:
 *         description: Simulation không tồn tại
 */
router.get('/task/student-list', authenticate, taskController.getListTaskForStudent);

/**
 * @swagger
 * /v1/task/update:
 *   put:
 *     summary: Cập nhật Task
 *     description: Educator có thể cập nhật task của chính họ (nếu áp dụng). Sau khi cập nhật có thể chuyển trạng thái simulation về WAITING_APPROVE
 *     tags:
 *       - Task
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
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instruction:
 *                 type: string
 *               content:
 *                 type: string
 *               imagePath:
 *                 type: string
 *               filePath:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               kind:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật task thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền cập nhật
 *       404:
 *         description: Task hoặc Simulation không tồn tại
 */
router.put('/task/update', authenticate, taskController.updateTask);

/**
 * @swagger
 * /v1/task/delete:
 *   delete:
 *     summary: Xóa Task
 *     description: Educator có thể xóa task của chính họ. Yêu cầu truyền id của task cần xóa
 *     tags:
 *       - Task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: ID của task cần xóa (hoặc truyền trong body)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Xóa task thành công
 *       400:
 *         description: Thiếu id hoặc dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Task không tồn tại
 */
router.delete('/task/delete/:id', authenticate, taskController.deleteTask);

module.exports = router;
