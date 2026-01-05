const { CalculatorType, CalculatorTypeComponent, SubCategory, Product, Category, ProductVariant } = require('../models');

// ==================== CALCULATOR TYPES ====================

// Get all calculator types (for user calculator page)
const getCalculatorTypes = async (req, res) => {
    try {
        const types = await CalculatorType.findAll({
            where: { is_active: true },
            order: [['display_order', 'ASC']],
            include: [{
                model: CalculatorTypeComponent,
                as: 'components',
                order: [['display_order', 'ASC']],
                include: [{
                    model: SubCategory,
                    as: 'subcategory',
                    attributes: ['id', 'name', 'slug']
                }]
            }, {
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }]
        });

        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        console.error('Error fetching calculator types:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get all calculator types (admin - includes inactive)
const getAllCalculatorTypes = async (req, res) => {
    try {
        const types = await CalculatorType.findAll({
            order: [['display_order', 'ASC']],
            include: [{
                model: CalculatorTypeComponent,
                as: 'components',
                order: [['display_order', 'ASC']],
                include: [{
                    model: SubCategory,
                    as: 'subcategory',
                    attributes: ['id', 'name', 'slug']
                }]
            }, {
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }]
        });

        res.json({
            success: true,
            data: types
        });
    } catch (error) {
        console.error('Error fetching all calculator types:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get single calculator type by ID
const getCalculatorTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await CalculatorType.findByPk(id, {
            include: [{
                model: CalculatorTypeComponent,
                as: 'components',
                order: [['display_order', 'ASC']],
                include: [{
                    model: SubCategory,
                    as: 'subcategory',
                    attributes: ['id', 'name', 'slug']
                }]
            }]
        });

        if (!type) {
            return res.status(404).json({
                success: false,
                message: 'Calculator type not found'
            });
        }

        res.json({
            success: true,
            data: type
        });
    } catch (error) {
        console.error('Error fetching calculator type:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Create calculator type
const createCalculatorType = async (req, res) => {
    try {
        const { name, slug, description, has_item_type, has_package_type, fabric_multiplier, is_active, display_order, category_id } = req.body;

        const type = await CalculatorType.create({
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            description,
            category_id: category_id || null,
            has_item_type: has_item_type !== undefined ? has_item_type : true,
            has_package_type: has_package_type !== undefined ? has_package_type : true,
            fabric_multiplier: fabric_multiplier || 2.5,
            is_active: is_active !== undefined ? is_active : true,
            display_order: display_order || 0
        });

        res.status(201).json({
            success: true,
            data: type
        });
    } catch (error) {
        console.error('Error creating calculator type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create calculator type',
            error: error.message
        });
    }
};

// Update calculator type
const updateCalculatorType = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await CalculatorType.update(req.body, {
            where: { id }
        });

        if (updated) {
            const updatedType = await CalculatorType.findByPk(id, {
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'slug']
                }]
            });
            res.json({
                success: true,
                data: updatedType
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Calculator type not found'
            });
        }
    } catch (error) {
        console.error('Error updating calculator type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update calculator type',
            error: error.message
        });
    }
};

// Delete calculator type
const deleteCalculatorType = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CalculatorType.destroy({
            where: { id }
        });

        if (deleted) {
            res.json({
                success: true,
                message: 'Calculator type deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Calculator type not found'
            });
        }
    } catch (error) {
        console.error('Error deleting calculator type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete calculator type',
            error: error.message
        });
    }
};

// ==================== CALCULATOR TYPE COMPONENTS ====================

// Add component to a calculator type
const addComponent = async (req, res) => {
    try {
        const { calculator_type_id, subcategory_id, label, is_required, price_calculation, display_order, multiply_with_variant, variant_filter_rule, hide_on_door } = req.body;

        const component = await CalculatorTypeComponent.create({
            calculator_type_id,
            subcategory_id,
            label,
            is_required: is_required || false,
            price_calculation: price_calculation || 'per_meter',
            display_order: display_order || 0,
            multiply_with_variant: multiply_with_variant || false,
            variant_filter_rule: variant_filter_rule || 'none',
            hide_on_door: hide_on_door || false
        });

        // Fetch with subcategory details
        const componentWithDetails = await CalculatorTypeComponent.findByPk(component.id, {
            include: [{
                model: SubCategory,
                as: 'subcategory',
                attributes: ['id', 'name', 'slug']
            }]
        });

        res.status(201).json({
            success: true,
            data: componentWithDetails
        });
    } catch (error) {
        console.error('Error adding component:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add component',
            error: error.message
        });
    }
};

// Update component
const updateComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await CalculatorTypeComponent.update(req.body, {
            where: { id }
        });

        if (updated) {
            const updatedComponent = await CalculatorTypeComponent.findByPk(id, {
                include: [{
                    model: SubCategory,
                    as: 'subcategory',
                    attributes: ['id', 'name', 'slug']
                }]
            });
            res.json({
                success: true,
                data: updatedComponent
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }
    } catch (error) {
        console.error('Error updating component:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update component',
            error: error.message
        });
    }
};

// Delete component
const deleteComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CalculatorTypeComponent.destroy({
            where: { id }
        });

        if (deleted) {
            res.json({
                success: true,
                message: 'Component deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Component not found'
            });
        }
    } catch (error) {
        console.error('Error deleting component:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete component',
            error: error.message
        });
    }
};

// ==================== PRODUCTS BY SUBCATEGORY ====================

// Get products by subcategory (for calculator component selection)
const getProductsBySubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.params;

        const products = await Product.findAll({
            where: {
                subcategory_id: subcategoryId,
                status: 'ACTIVE'
            },
            attributes: ['id', 'name', 'images', 'sku'],
            include: [{
                model: ProductVariant,
                as: 'variants',
                attributes: ['price_net', 'price_gross']
            }]
        });

        // Format products for calculator
        const formattedProducts = products.map(p => {
            // Calculate price from variants if available (min price)
            let price = 0;
            if (p.variants && p.variants.length > 0) {
                const prices = p.variants.map(v => parseFloat(v.price_net) || parseFloat(v.price_gross) || 0).filter(p => p > 0);
                if (prices.length > 0) price = Math.min(...prices);
            }

            // Safely extracting first image
            let firstImage = null;
            let imgList = p.images;
            if (typeof imgList === 'string') {
                try {
                    imgList = JSON.parse(imgList);
                } catch (e) {
                    imgList = [];
                }
            }
            if (Array.isArray(imgList) && imgList.length > 0) {
                firstImage = imgList[0];
            }

            return {
                id: p.id,
                name: p.name,
                price: price,
                image: firstImage,
                sku: p.sku
            };
        });

        res.json({
            success: true,
            data: formattedProducts
        });
    } catch (error) {
        console.error('Error fetching products by subcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    // Calculator Types
    getCalculatorTypes,
    getAllCalculatorTypes,
    getCalculatorTypeById,
    createCalculatorType,
    updateCalculatorType,
    deleteCalculatorType,

    // Components
    addComponent,
    updateComponent,
    deleteComponent,

    // Products
    getProductsBySubcategory
};
