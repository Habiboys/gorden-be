const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, referralController.getStats);

module.exports = router;
