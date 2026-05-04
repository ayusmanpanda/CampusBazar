const express = require('express');
const ctrl = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', ctrl.list);
router.put('/read-all', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);

module.exports = router;
