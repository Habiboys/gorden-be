const { SubCategory, Category } = require('../models');

// Get all subcategories (with optional category filter)
const getSubCategories = async (req, res) => {
    try {
        const { category_id } = req.query;
        let where = {};

        if (category_id) {
            where.category_id = category_id;
        }

        const subcategories = await SubCategory.findAll({
            where,
            include: [{ model: Category, attributes: ['name', 'slug'] }],
            order: [['name', 'ASC']]
        });

        res.json({ success: true, data: subcategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get single subcategory by ID
const getSubCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const subcategory = await SubCategory.findByPk(id, {
            include: [{ model: Category, attributes: ['name', 'slug'] }]
        });

        if (!subcategory) {
            return res.status(404).json({ success: false, message: 'SubCategory not found' });
        }

        res.json({ success: true, data: subcategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create subcategory
const createSubCategory = async (req, res) => {
    try {
        const { name, slug, description, category_id, has_max_length } = req.body;

        if (!name || !category_id) {
            return res.status(400).json({
                success: false,
                message: 'Name and category_id are required'
            });
        }

        // Generate slug if not provided
        const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

        const subcategory = await SubCategory.create({
            name,
            slug: finalSlug,
            description,
            category_id,
            has_max_length: has_max_length || false
        });

        res.status(201).json({ success: true, data: subcategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating subcategory', error: error.message });
    }
};

// Update subcategory
const updateSubCategory = async (req, res) => {
    try {
        const subcategory = await SubCategory.findByPk(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ success: false, message: 'SubCategory not found' });
        }

        await subcategory.update(req.body);
        res.json({ success: true, data: subcategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating subcategory', error: error.message });
    }
};

// Delete subcategory
const deleteSubCategory = async (req, res) => {
    try {
        const subcategory = await SubCategory.findByPk(req.params.id);
        if (!subcategory) {
            return res.status(404).json({ success: false, message: 'SubCategory not found' });
        }

        await subcategory.destroy();
        res.json({ success: true, message: 'SubCategory deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting subcategory', error: error.message });
    }
};

module.exports = {
    getSubCategories,
    getSubCategoryById,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
};
