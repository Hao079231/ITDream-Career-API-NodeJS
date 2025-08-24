const express = require('express');
const router = express.Router();
const permissionController = require('../controller/permissionController');
const { authenticate } = require('../middleware/jwtMiddleware');

router.post('/permission/create', authenticate, permissionController.createPermission);
router.get('/permission/list', authenticate, permissionController.getAllPermissions);

module.exports = router;