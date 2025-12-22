const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const auth = require('../middleware/auth');

// Public route - get public settings (no auth needed)
router.get('/public', settingController.getPublic);

// Admin routes - require authentication
router.get('/', auth('ADMIN'), settingController.getAll);
router.put('/', auth('ADMIN'), settingController.updateBulk);
router.put('/bulk', auth('ADMIN'), settingController.updateBulk);

module.exports = router;
