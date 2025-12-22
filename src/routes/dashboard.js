const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Get dashboard statistics (admin only)
router.get('/stats', auth('ADMIN'), dashboardController.getStats);

module.exports = router;
