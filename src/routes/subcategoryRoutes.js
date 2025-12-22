const express = require('express');
const router = express.Router();
const {
    getSubCategories,
    getSubCategoryById,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
} = require('../controllers/subcategoryController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', getSubCategories);
router.get('/:id', getSubCategoryById);

// Protected routes (admin only)
router.post('/', auth('ADMIN'), createSubCategory);
router.put('/:id', auth('ADMIN'), updateSubCategory);
router.delete('/:id', auth('ADMIN'), deleteSubCategory);

module.exports = router;
