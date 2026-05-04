const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');
const { runValidators } = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  runValidators([body('listingId').isMongoId()]),
  ctrl.createOrGetRoom
);

router.get('/', ctrl.myChats);
router.get('/:id/messages', ctrl.getMessages);

router.post(
  '/:id/offer',
  runValidators([
    body('offerPrice').isFloat({ min: 0 }),
    body('text').optional().isString()
  ]),
  ctrl.sendOffer
);

router.put(
  '/:id/offer/:offerId',
  runValidators([
    body('action').isIn(['accept', 'reject', 'counter']),
    body('counterPrice').optional().isFloat({ min: 0 })
  ]),
  ctrl.respondOffer
);

module.exports = router;
