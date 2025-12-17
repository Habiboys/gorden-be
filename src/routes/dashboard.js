const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Get dashboard statistics (admin only)
router.get('/stats', authenticate, adminMiddleware, dashboardController.getStats);



module.exports = router;

