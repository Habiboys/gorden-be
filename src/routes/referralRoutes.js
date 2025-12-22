const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const auth = require('../middleware/auth');

// User routes (for logged-in user's own stats)
router.get('/stats', auth(), referralController.getStats);

// Admin routes
router.get('/admin', auth('ADMIN'), referralController.getAllReferrers);
router.get('/admin/stats', auth('ADMIN'), referralController.getAdminStats);
router.get('/admin/:id', auth('ADMIN'), referralController.getReferrerDetail);
router.patch('/admin/:id/pay-all', auth('ADMIN'), referralController.payAllCommissions);
router.patch('/:id/pay', auth('ADMIN'), referralController.payCommission);

module.exports = router;
