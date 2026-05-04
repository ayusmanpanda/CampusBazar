const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { runValidators } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/signup',
  runValidators([
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6, max: 128 }),
    body('department').optional().isString().trim().isLength({ max: 80 }),
    body('year').optional().isInt({ min: 1, max: 6 })
  ]),
  ctrl.signup
);

router.post(
  '/verify-otp',
  runValidators([
    body('email').isEmail().normalizeEmail(),
    body('otp').isString().isLength({ min: 6, max: 6 })
  ]),
  ctrl.verifyOtp
);

router.post(
  '/login',
  runValidators([
    body('email').isEmail().normalizeEmail(),
    body('password').isString().notEmpty()
  ]),
  ctrl.login
);

router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', authMiddleware, ctrl.logout);
router.get('/me', authMiddleware, ctrl.me);

module.exports = router;
