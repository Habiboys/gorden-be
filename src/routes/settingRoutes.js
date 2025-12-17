const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public route - get public settings (no auth needed)
router.get('/public', settingController.getPublic);

// Admin routes - require authentication
router.get('/', authMiddleware, adminMiddleware, settingController.getAll);
router.put('/', authMiddleware, adminMiddleware, settingController.updateBulk);
router.put('/bulk', authMiddleware, adminMiddleware, settingController.updateBulk);

module.exports = router;
