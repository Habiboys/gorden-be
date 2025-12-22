const express = require('express');
const router = express.Router();
const calculatorTypeController = require('../controllers/calculatorTypeController');
const auth = require('../middleware/auth');

// Public routes (for user calculator page)
router.get('/types', calculatorTypeController.getCalculatorTypes);
router.get('/products/subcategory/:subcategoryId', calculatorTypeController.getProductsBySubcategory);

// Admin routes - Calculator Types CRUD
router.get('/types/all', auth(['ADMIN']), calculatorTypeController.getAllCalculatorTypes);
router.get('/types/:id', auth(['ADMIN']), calculatorTypeController.getCalculatorTypeById);
router.post('/types', auth(['ADMIN']), calculatorTypeController.createCalculatorType);
router.put('/types/:id', auth(['ADMIN']), calculatorTypeController.updateCalculatorType);
router.delete('/types/:id', auth(['ADMIN']), calculatorTypeController.deleteCalculatorType);

// Admin routes - Components CRUD
router.post('/components', auth(['ADMIN']), calculatorTypeController.addComponent);
router.put('/components/:id', auth(['ADMIN']), calculatorTypeController.updateComponent);
router.delete('/components/:id', auth(['ADMIN']), calculatorTypeController.deleteComponent);

module.exports = router;
