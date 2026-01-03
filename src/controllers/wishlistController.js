const { Wishlist, Product } = require('../models');

// Get user's wishlist
const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const wishlistItems = await Wishlist.findAll({
            where: { user_id: userId },
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'images', 'category_id'] // price removed - using variants now
            }],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: wishlistItems.map(item => item.product)
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Check if product exists
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({
            where: { user_id: userId, product_id: productId }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Produk sudah ada di wishlist'
            });
        }

        // Add to wishlist
        await Wishlist.create({
            user_id: userId,
            product_id: productId
        });

        res.status(201).json({
            success: true,
            message: 'Produk ditambahkan ke wishlist'
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const deleted = await Wishlist.destroy({
            where: { user_id: userId, product_id: productId }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan di wishlist'
            });
        }

        res.json({
            success: true,
            message: 'Produk dihapus dari wishlist'
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Check if product is in wishlist
const checkWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const exists = await Wishlist.findOne({
            where: { user_id: userId, product_id: productId }
        });

        res.json({
            success: true,
            isInWishlist: !!exists
        });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get wishlist count
const getWishlistCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Wishlist.count({
            where: { user_id: userId }
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Get wishlist count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    getWishlistCount
};
