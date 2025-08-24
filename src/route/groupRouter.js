const express = require('express');
const router = express.Router();
const groupController = require('../controller/groupController');
const { authenticate } = require('../middleware/jwtMiddleware');

router.post('/group/create', authenticate, groupController.createGroup);
router.put('/group/update', authenticate, groupController.updateGroup);

module.exports = router;
