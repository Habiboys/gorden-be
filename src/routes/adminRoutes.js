const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Apply admin auth middleware to all routes
router.use(auth('ADMIN'));

// Stats
router.get('/stats', adminController.getStats);

// Orders
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// Products
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);

// Calculator
router.put('/calculator-components/:id', adminController.updateCalculatorComponent);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Gallery
router.post('/gallery', adminController.createGalleryProject);
router.delete('/gallery/:id', adminController.deleteGalleryProject);

module.exports = router;
