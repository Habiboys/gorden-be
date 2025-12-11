const express = require('express');
const router = express.Router();
const calculatorController = require('../controllers/calculatorController');

router.get('/components', calculatorController.getComponents);

module.exports = router;
