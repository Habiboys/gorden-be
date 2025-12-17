const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/', contactController.getAll);
router.post('/', contactController.create);
router.patch('/:id/status', contactController.updateStatus);
router.delete('/:id', contactController.delete);

module.exports = router;
