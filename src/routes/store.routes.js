const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const auth = require('../middleware/auth');

// All store management routes require Admin access
router.post('/', auth('ADMIN'), storeController.create);
router.get('/', auth(), storeController.getAll); // Allow authenticated users (backend handles filtering logic if needed)
router.get('/:id', auth(), storeController.getById);
router.put('/:id', auth('ADMIN'), storeController.update);
router.delete('/:id', auth('ADMIN'), storeController.delete);

// User assignment
router.post('/:id/users', auth('ADMIN'), storeController.assignUser);
router.delete('/:id/users/:userId', auth('ADMIN'), storeController.removeUser);

module.exports = router;
