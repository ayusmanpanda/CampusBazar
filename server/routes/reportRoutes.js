const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');
const { runValidators } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  runValidators([
    body('targetType').isIn(['listing', 'user']),
    body('targetId').isMongoId(),
    body('reason').isString().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().isString().isLength({ max: 2000 })
  ]),
  ctrl.createReport
);

module.exports = router;
