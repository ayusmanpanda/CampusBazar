const express = require('express');
const ctrl = require('../controllers/userController');

const router = express.Router();
router.get('/:id', ctrl.publicProfile);

module.exports = router;
