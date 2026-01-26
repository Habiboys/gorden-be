const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const auth = require('../middleware/auth');

// Basic auth required for all
router.post('/transactions', auth(), financeController.createTransaction);
router.get('/stores/:store_id/transactions', auth(), financeController.getTransactions);
router.get('/stores/:store_id/recap', auth(), financeController.getRecap);
router.get('/stores/:store_id/export', auth(), financeController.exportTransactions);

module.exports = router;
