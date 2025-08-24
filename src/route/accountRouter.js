const express = require('express');
const router = express.Router();
const accountController = require('../controller/accountController');
const { authenticate } = require('../middleware/jwtMiddleware');

router.post('/api/token', accountController.login);
router.post('/v1/admin/create', authenticate, accountController.createAdmin);
router.get('/v1/admin/profile', authenticate, accountController.getProfileAdmin);

module.exports = router;