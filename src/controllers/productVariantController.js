const { ProductVariant, Product } = require('../models');

// Get all variants for a product
exports.getByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const variants = await ProductVariant.findAll({
            where: { product_id: productId, is_active: true },
            order: [['created_at', 'ASC']]
        });

        res.json({
            success: true,
            data: variants
        });
    } catch (error) {
        console.error('Error fetching product variants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product variants',
            message: error.message
        });
    }
};

// Get variants matching dimensions (for calculator)
exports.getMatchingVariants = async (req, res) => {
    try {
        const { productId } = req.params;
        const { width, height } = req.query;

        const variants = await ProductVariant.findAll({
            where: { product_id: productId, is_active: true },
            order: [['created_at', 'ASC']]
        });

        // Filter variants that match the input dimensions
        const inputWidth = parseInt(width) || 0;
        const inputHeight = parseInt(height) || 0;

        const matchingVariants = variants.filter(v => {
            const minW = v.recommended_min_width || 0;
            const maxW = v.recommended_max_width || Infinity;
            const recH = v.recommended_height || 0;

            const widthMatches = inputWidth >= minW && inputWidth <= maxW;
            const heightMatches = recH === 0 || inputHeight <= recH;

            return widthMatches && heightMatches;
        });

        res.json({
            success: true,
            data: matchingVariants,
            allVariants: variants // Also return all for display
        });
    } catch (error) {
        console.error('Error fetching matching variants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch matching variants',
            message: error.message
        });
    }
};

// Create a new variant
exports.create = async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            attributes, price_gross, price_net, satuan, is_active
        } = req.body;

        // Verify product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        const variant = await ProductVariant.create({
            product_id: productId,
            attributes,
            price_gross,
            price_net,
            satuan: satuan || 'meter',
            is_active: is_active !== undefined ? is_active : true
        });

        res.status(201).json({
            success: true,
            data: variant,
            message: 'Variant created successfully'
        });
    } catch (error) {
        console.error('Error creating variant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create variant',
            message: error.message
        });
    }
};

// Bulk Create/Sync variants (Delete existing, then create new)
exports.bulkCreate = async (req, res) => {
    try {
        const { productId } = req.params;
        const { variants } = req.body; // Expecting array of { attributes, price_gross, price_net, is_active }

        if (!Array.isArray(variants)) {
            return res.status(400).json({
                success: false,
                error: 'Variants array is required'
            });
        }

        // Verify product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Delete all existing variants for this product (sync behavior)
        await ProductVariant.destroy({ where: { product_id: productId } });

        // If no new variants to create, just return empty
        if (variants.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'All variants cleared'
            });
        }

        const variantsData = variants.map(v => ({
            product_id: productId,
            attributes: v.attributes || {},
            price_gross: v.price_gross || 0,
            price_net: v.price_net || 0,
            satuan: v.satuan || 'meter',
            is_active: v.is_active !== undefined ? v.is_active : true
        }));

        const createdVariants = await ProductVariant.bulkCreate(variantsData);

        res.status(201).json({
            success: true,
            data: createdVariants,
            message: `${createdVariants.length} variants synced successfully`
        });
    } catch (error) {
        console.error('Error bulk syncing variants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to bulk create variants',
            message: error.message
        });
    }
};

// Update a variant
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            attributes, price_gross, price_net, satuan, is_active
        } = req.body;

        const variant = await ProductVariant.findByPk(id);
        if (!variant) {
            return res.status(404).json({
                success: false,
                error: 'Variant not found'
            });
        }

        await variant.update({
            attributes: attributes !== undefined ? attributes : variant.attributes,
            price_gross: price_gross !== undefined ? price_gross : variant.price_gross,
            price_net: price_net !== undefined ? price_net : variant.price_net,
            satuan: satuan !== undefined ? satuan : variant.satuan,
            is_active: is_active !== undefined ? is_active : variant.is_active
        });

        res.json({
            success: true,
            data: variant,
            message: 'Variant updated successfully'
        });
    } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update variant',
            message: error.message
        });
    }
};

// Delete a variant
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const variant = await ProductVariant.findByPk(id);
        if (!variant) {
            return res.status(404).json({
                success: false,
                error: 'Variant not found'
            });
        }

        await variant.destroy();

        res.json({
            success: true,
            message: 'Variant deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete variant',
            message: error.message
        });
    }
};
