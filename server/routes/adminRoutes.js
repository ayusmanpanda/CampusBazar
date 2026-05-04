const express = require('express');
const ctrl = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/users', ctrl.users);
router.get('/listings', ctrl.listings);
router.get('/reports', ctrl.reports);
router.put('/reports/:id', ctrl.updateReport);
router.put('/users/:id/ban', ctrl.banUser);

module.exports = router;
