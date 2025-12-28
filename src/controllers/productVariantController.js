const { ProductVariant, Product } = require('../models');

// Get all variants for a product
exports.getByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const variants = await ProductVariant.findAll({
            where: { product_id: productId, is_active: true },
            order: [['sibak', 'ASC'], ['width', 'ASC']]
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
            order: [['sibak', 'ASC'], ['price', 'ASC']]
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
        const { width, wave, height, sibak, price, recommended_min_width, recommended_max_width, recommended_height } = req.body;

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
            width,
            wave,
            height,
            sibak: sibak || 1,
            price,
            recommended_min_width,
            recommended_max_width,
            recommended_height
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

// Update a variant
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { width, wave, height, sibak, price, recommended_min_width, recommended_max_width, recommended_height, is_active } = req.body;

        const variant = await ProductVariant.findByPk(id);
        if (!variant) {
            return res.status(404).json({
                success: false,
                error: 'Variant not found'
            });
        }

        await variant.update({
            width: width !== undefined ? width : variant.width,
            wave: wave !== undefined ? wave : variant.wave,
            height: height !== undefined ? height : variant.height,
            sibak: sibak !== undefined ? sibak : variant.sibak,
            price: price !== undefined ? price : variant.price,
            recommended_min_width: recommended_min_width !== undefined ? recommended_min_width : variant.recommended_min_width,
            recommended_max_width: recommended_max_width !== undefined ? recommended_max_width : variant.recommended_max_width,
            recommended_height: recommended_height !== undefined ? recommended_height : variant.recommended_height,
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
