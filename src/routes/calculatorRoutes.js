const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');

router.get('/', calculatorController.getComponents);
router.post('/', calculatorController.create);
router.put('/:id', calculatorController.update);
router.delete('/:id', calculatorController.delete);

module.exports = router;
