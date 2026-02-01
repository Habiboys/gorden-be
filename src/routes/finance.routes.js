const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const financeCategoryController = require('../controllers/financeCategory.controller');

const auth = require('../middleware/auth');

// Basic auth required for all
router.post('/transactions', auth(), financeController.createTransaction);
router.delete('/transactions/:id', auth(['ADMIN', 'SUPERADMIN']), financeController.deleteTransaction);
router.get('/stores/:store_id/transactions', auth(), financeController.getTransactions);
router.get('/stores/:store_id/recap', auth(), financeController.getRecap);
router.get('/stores/:store_id/export', auth(), financeController.exportTransactions);

// Categories
router.get('/categories', auth(), financeCategoryController.getAll);
router.post('/categories', auth(['ADMIN', 'SUPERADMIN']), financeCategoryController.create);
router.delete('/categories/:id', auth(['ADMIN', 'SUPERADMIN']), financeCategoryController.delete);


module.exports = router;
