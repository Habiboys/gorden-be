const { Product, Category, ProductPackage, Sequelize } = require('../models');
const { Op } = Sequelize;

const getProducts = async (req, res) => {
    try {
        const { category, search, sort } = req.query;
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

        if (sort === 'price_asc') {
            order = [['price', 'ASC']];
        } else if (sort === 'price_desc') {
            order = [['price', 'DESC']];
        }

        const products = await Product.findAll({
            where,
            order,
            include: [{ model: Category, attributes: ['name', 'slug'] }]
        });

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [
                { model: Category, attributes: ['name', 'slug'] },
                { model: ProductPackage }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProducts,
    getProductDetail,
    getCategories
};
