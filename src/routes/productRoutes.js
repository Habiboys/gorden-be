const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const productVariantController = require('../controllers/productVariantController');
const productImportController = require('../controllers/productImportController');

// Multer config for Excel file upload (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Product Import from Excel
router.get('/products/import/template/products', productImportController.downloadProductTemplate);
router.get('/products/import/template/variants', productImportController.downloadVariantTemplate);
router.post('/products/import/products', upload.single('file'), productImportController.importProducts);
router.post('/products/import/variants', upload.single('file'), productImportController.importVariants);

// Product Variants
router.get('/products/:productId/variants', productVariantController.getByProduct);
router.get('/products/:productId/variants/match', productVariantController.getMatchingVariants);
router.post('/products/:productId/variants', productVariantController.create);
router.post('/products/:productId/variants/bulk', productVariantController.bulkCreate);
router.put('/variants/:id', productVariantController.update);
router.delete('/variants/:id', productVariantController.delete);

module.exports = router;
