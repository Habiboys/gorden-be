const { Product, Category, SubCategory, ProductPackage, Sequelize } = require('../models');
const { Op } = Sequelize;

const getProducts = async (req, res) => {
    try {
        const { category, search, sort, featured, limit } = req.query;
        let where = {};
        let order = [['created_at', 'DESC']];

        if (category) {
            const cat = await Category.findOne({ where: { slug: category } });
            if (cat) {
                where.category_id = cat.id;
            }
        }

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        // Filter by featured
        if (featured === 'true') {
            where.is_featured = true;
        }

        if (sort === 'price_asc') {
            order = [['price', 'ASC']];
        } else if (sort === 'price_desc') {
            order = [['price', 'DESC']];
        }

        const queryOptions = {
            where,
            order,
            include: [
                { model: Category, attributes: ['name', 'slug'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] }
            ]
        };

        // Add limit if specified
        if (limit) {
            queryOptions.limit = parseInt(limit, 10);
        }

        const products = await Product.findAll(queryOptions);

        res.json({ success: true, data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [
                { model: Category, attributes: ['name', 'slug'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] },
                { model: ProductPackage }
            ]
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            category_id, subcategory_id, name, sku, subtitle, description, information,
            price, original_price, price_self_measure, price_self_measure_install, price_measure_install,
            stock, discount_percent, max_length, price_unit, images, features, how_to_order,
            is_featured, is_new_arrival, is_best_seller,
            meta_title, meta_description, meta_keywords, status
        } = req.body;

        const product = await Product.create({
            category_id, subcategory_id, name, sku, subtitle, description, information,
            price, original_price, price_self_measure, price_self_measure_install, price_measure_install,
            stock, discount_percent, max_length, price_unit, images, features, how_to_order,
            is_featured, is_new_arrival, is_best_seller,
            meta_title, meta_description, meta_keywords, status
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.update(req.body);

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        await product.destroy();
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const category = await Category.create({ name, slug, description });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating category', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating category', error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting category', error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductDetail,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory
};
