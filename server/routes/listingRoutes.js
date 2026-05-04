const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/listingController');
const { authMiddleware } = require('../middleware/auth');
const { runValidators } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { CATEGORIES, CONDITIONS } = require('../models/Listing');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/me/mine', authMiddleware, ctrl.myListings);
router.get('/:id', ctrl.getById);

router.post(
  '/',
  authMiddleware,
  upload.array('images', 5),
  runValidators([
    body('title').isString().trim().isLength({ min: 3, max: 120 }),
    body('description').isString().trim().isLength({ min: 5, max: 4000 }),
    body('price').isFloat({ min: 0 }),
    body('category').isIn(CATEGORIES),
    body('condition').isIn(CONDITIONS)
  ]),
  ctrl.create
);

router.put(
  '/:id',
  authMiddleware,
  upload.array('images', 5),
  runValidators([
    body('title').optional().isString().trim().isLength({ min: 3, max: 120 }),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().isIn(CATEGORIES),
    body('condition').optional().isIn(CONDITIONS),
    body('status').optional().isIn(['active', 'sold', 'expired'])
  ]),
  ctrl.update
);

router.delete('/:id', authMiddleware, ctrl.remove);
router.post('/:id/views', ctrl.incrementView);

module.exports = router;
