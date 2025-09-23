const express = require('express');
const router = express.Router();
const simulationController = require('../controller/simulationController');
const { authenticate } = require('../middleware/jwtMiddleware');

/**
 * @swagger
 * tags:
 *   name: Simulation
 *   description: API cho Simulation (Quản lý simulation)
 */

/**
 * @swagger
 * /v1/simulation/create:
 *   post:
 *     summary: Tạo mới Simulation (yêu cầu quyền)
 *     description: Chỉ Educator có quyền tạo simulation. Sau khi tạo sẽ có trạng thái WAITING_APPROVE.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - level
 *               - educatorId
 *               - specializationId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               overview:
 *                 type: string
 *               level:
 *                 type: integer
 *                 description: Một trong các giá trị của SIMULATION_LEVEL
 *               totalEstimatedTime:
 *                 type: string
 *               imagePath:
 *                 type: string
 *               educatorId:
 *                 type: integer
 *               specializationId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tạo simulation thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (ví dụ level không hợp lệ)
 *       403:
 *         description: Người dùng không có quyền tạo
 *       404:
 *         description: Educator không tồn tại
 */
router.post('/simulation/create', authenticate, simulationController.createSimulation);

/**
 * @swagger
 * /v1/simulation/list:
 *   get:
 *     summary: Lấy danh sách Simulation (admin)
 *     description: Chỉ Admin có quyền xem toàn bộ simulation. Hỗ trợ lọc theo specializationId và level.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specializationId
 *         schema:
 *           type: integer
 *         description: Lọc theo specialization id
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *         description: Lọc theo level (SIMULATION_LEVEL)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy danh sách simulation thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Tài khoản không tồn tại
 */
router.get('/simulation/list', authenticate, simulationController.getListSimulations);

/**
 * @swagger
 * /v1/simulation/educator-list:
 *   get:
 *     summary: Lấy danh sách Simulation cho Educator (chỉ của chính họ)
 *     description: |
 *       Educator chỉ nhìn thấy simulation do chính họ tạo.
 *       Trả về các trường: title, level, totalEstimatedTime, imagePath, avgRating, participantQuantity.
 *       Hỗ trợ lọc theo specializationId và level.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specializationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy danh sách simulation của educator thành công
 *       403:
 *         description: Người dùng không phải educator hoặc không có quyền
 *       404:
 *         description: Educator không tồn tại
 */
router.get('/simulation/educator-list', authenticate, simulationController.getListSimulationsForEducator);

/**
 * @swagger
 * /v1/simulation/student-list:
 *   get:
 *     summary: Lấy danh sách Simulation cho Student (chỉ active)
 *     description: |
 *       Student chỉ nhìn thấy simulation có status = ACTIVE.
 *       Trả về các trường: title, level, totalEstimatedTime, imagePath, avgRating, participantQuantity.
 *       Hỗ trợ lọc theo specializationId và level.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specializationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy danh sách simulation cho student thành công
 *       403:
 *         description: Người dùng không phải student hoặc không có quyền
 *       404:
 *         description: Tài khoản không tồn tại
 */
router.get('/simulation/student-list', authenticate, simulationController.getListSimulationsForStudent);

/**
 * @swagger
 * /v1/simulation/get/{id}:
 *   get:
 *     summary: Lấy chi tiết Simulation (admin)
 *     description: Admin có quyền xem chi tiết simulation (bao gồm các id).
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation
 *     responses:
 *       200:
 *         description: Lấy chi tiết simulation thành công
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Simulation không tồn tại
 */
router.get('/simulation/get/:id', authenticate, simulationController.getDetailSimulation);

/**
 * @swagger
 * /v1/simulation/educator-get/{id}:
 *   get:
 *     summary: Lấy chi tiết Simulation cho Educator
 *     description: Educator chỉ xem được simulation do họ tạo. Trả về thông tin nhưng ẩn id của simulation, educator và specialization.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation
 *     responses:
 *       200:
 *         description: Lấy chi tiết simulation cho educator thành công
 *       403:
 *         description: Người dùng không phải educator hoặc không có quyền / không được phép xem simulation này
 *       404:
 *         description: Simulation không tồn tại
 */
router.get('/simulation/educator-get/:id', authenticate, simulationController.getDetailSimulationForEducator);

/**
 * @swagger
 * /v1/simulation/student-get/{id}:
 *   get:
 *     summary: Lấy chi tiết Simulation cho Student
 *     description: Student chỉ xem được simulation đang active; thông tin trả về ẩn id của simulation, educator và specialization.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation
 *     responses:
 *       200:
 *         description: Lấy chi tiết simulation cho student thành công
 *       403:
 *         description: Người dùng không phải student hoặc không có quyền
 *       404:
 *         description: Simulation không tồn tại hoặc không active
 */
router.get('/simulation/student-get/:id', authenticate, simulationController.getDetailSimulationForStudent);

/**
 * @swagger
 * /v1/simulation/update:
 *   put:
 *     summary: Cập nhật Simulation (Educator)
 *     description: Educator chỉ được cập nhật simulation của chính họ. Sau khi cập nhật trạng thái sẽ chuyển về WAITING_APPROVE.
 *     tags:
 *       - Simulation
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               overview:
 *                 type: string
 *               level:
 *                 type: integer
 *               totalEstimatedTime:
 *                 type: string
 *               imagePath:
 *                 type: string
 *               specializationId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật simulation thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Người dùng không phải educator hoặc không có quyền/không được phép cập nhật
 *       404:
 *         description: Simulation không tồn tại
 */
router.put('/simulation/update', authenticate, simulationController.updateSimulation);

/**
 * @swagger
 * /v1/simulation/delete/{id}:
 *   delete:
 *     summary: Xóa Simulation (Educator)
 *     description: Educator chỉ xóa simulation của chính họ.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation cần xóa
 *     responses:
 *       200:
 *         description: Xóa simulation thành công
 *       403:
 *         description: Người dùng không phải educator hoặc không có quyền
 *       404:
 *         description: Simulation không tồn tại
 */
router.delete('/simulation/delete/:id', authenticate, simulationController.deleteSimulation);

/**
 * @swagger
 * /v1/simulation/search:
 *   get:
 *     summary: Tìm kiếm Simulation theo title (Elasticsearch)
 *     description: Tìm kiếm theo query q. Kết quả có thể lọc thêm bằng specializationId và level. Trả về simulations có thông tin educator (username, fullName) và specialization (id, name).
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Chuỗi tìm kiếm trên title
 *       - in: query
 *         name: specializationId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tìm kiếm thành công
 *       400:
 *         description: Thiếu tham số q
 *       500:
 *         description: Lỗi server
 */
router.get('/simulation/search', simulationController.searchSimulations);

/**
 * @swagger
 * /v1/simulation/approve:
 *   put:
 *     summary: Phê duyệt Simulation (Admin)
 *     description: Chỉ Admin có quyền phê duyệt. Chuyển trạng thái từ WAITING_APPROVE => ACTIVE.
 *     tags:
 *       - Simulation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của simulation cần phê duyệt
 *     responses:
 *       200:
 *         description: Phê duyệt simulation thành công
 *       400:
 *         description: Simulation đã active
 *       403:
 *         description: Người dùng không phải admin hoặc không có quyền
 *       404:
 *         description: Simulation không tồn tại
 */
router.put('/simulation/approve', authenticate, simulationController.approveSimulation);

module.exports = router;