const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const productVariantController = require('../controllers/productVariantController');

router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductDetail);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/products/:id/duplicate', productController.duplicateProduct);
router.get('/categories', productController.getCategories);
router.post('/categories', productController.createCategory);
router.put('/categories/:id', productController.updateCategory);
router.delete('/categories/:id', productController.deleteCategory);

// Product Variants
router.get('/products/:productId/variants', productVariantController.getByProduct);
router.get('/products/:productId/variants/match', productVariantController.getMatchingVariants);
router.post('/products/:productId/variants', productVariantController.create);
router.post('/products/:productId/variants/bulk', productVariantController.bulkCreate);
router.put('/variants/:id', productVariantController.update);
router.delete('/variants/:id', productVariantController.delete);

module.exports = router;
