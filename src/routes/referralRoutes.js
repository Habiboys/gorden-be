const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// User routes (for logged-in user's own stats)
router.get('/stats', authMiddleware, referralController.getStats);

// Admin routes
router.get('/admin', authMiddleware, adminMiddleware, referralController.getAllReferrers);
router.get('/admin/stats', authMiddleware, adminMiddleware, referralController.getAdminStats);
router.get('/admin/:id', authMiddleware, adminMiddleware, referralController.getReferrerDetail);
router.patch('/admin/:id/pay-all', authMiddleware, adminMiddleware, referralController.payAllCommissions);
router.patch('/:id/pay', authMiddleware, adminMiddleware, referralController.payCommission);

module.exports = router;
