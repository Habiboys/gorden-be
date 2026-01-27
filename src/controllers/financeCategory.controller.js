const { FinanceCategory } = require('../models');

module.exports = {
    // Get All Categories
    async getAll(req, res) {
        try {
            const { type } = req.query;
            const where = {};
            if (type) where.type = type;

            const categories = await FinanceCategory.findAll({
                where,
                order: [['name', 'ASC']]
            });

            return res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error fetching finance categories:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Create Category
    async create(req, res) {
        try {
            const { name, type } = req.body;

            if (!name || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and Type are required'
                });
            }

            const category = await FinanceCategory.create({ name, type });

            return res.status(201).json({
                success: true,
                data: category,
                message: 'Category created successfully'
            });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Category name already exists'
                });
            }
            console.error('Error creating finance category:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Delete Category
    async delete(req, res) {
        try {
            const { id } = req.params;
            const category = await FinanceCategory.findByPk(id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            await category.destroy();

            return res.status(200).json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting finance category:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
