const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// All routes require ADMIN role
router.get('/', auth('ADMIN'), userController.getAll);
router.post('/', auth('ADMIN'), userController.create);
router.get('/:id', auth('ADMIN'), userController.getById);
router.put('/:id', auth('ADMIN'), userController.update);
router.delete('/:id', auth('ADMIN'), userController.delete);

module.exports = router;
