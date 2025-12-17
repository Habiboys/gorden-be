const express = require('express');
const router = express.Router();
const leadController = require('../controllers/calculatorLeadController');

router.post('/', leadController.create);
router.get('/', leadController.getAll);
router.patch('/:id/status', leadController.updateStatus);
router.delete('/:id', leadController.delete);

module.exports = router;
