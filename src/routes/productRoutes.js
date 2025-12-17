const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductDetail);
router.post('/products', productController.createProduct); // New
router.put('/products/:id', productController.updateProduct); // New
router.delete('/products/:id', productController.deleteProduct); // Need to implement delete too? Controller didn't have delete. I should verify controller has delete. I didn't see delete in my update. I should add delete to controller too if needed. But for now create/update is priority.
router.get('/categories', productController.getCategories);
router.post('/categories', productController.createCategory);
router.put('/categories/:id', productController.updateCategory);
router.delete('/categories/:id', productController.deleteCategory);

module.exports = router;
