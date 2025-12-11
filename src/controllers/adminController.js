const { Order, Product, CalculatorComponent, SiteSetting, GalleryProject, Sequelize } = require('../models');

// Stats
const getStats = async (req, res) => {
    try {
        const totalOrders = await Order.count();
        const pendingOrders = await Order.count({ where: { status: 'PENDING' } });
        const totalProducts = await Product.count();

        // Simple total revenue calculation
        const revenue = await Order.sum('total_amount', { where: { payment_status: 'PAID' } });

        res.json({
            totalOrders,
            pendingOrders,
            totalProducts,
            revenue: revenue || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Orders
const getOrders = async (req, res) => {
    try {
        const { status, page = 1 } = req.query;
        const limit = 20;
        const offset = (page - 1) * limit;
        const where = {};
        if (status) where.status = status;

        const { count, rows } = await Order.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            orders: rows,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        await order.save();
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Products
const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.update(req.body);
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Calculator
const updateCalculatorComponent = async (req, res) => {
    try {
        const component = await CalculatorComponent.findByPk(req.params.id);
        if (!component) return res.status(404).json({ message: 'Component not found' });

        await component.update(req.body);
        res.json(component);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Settings
const getSettings = async (req, res) => {
    try {
        const settings = await SiteSetting.findAll();
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expect array or object? Design says Bulk update. Let's expect object { key: value }
        // Loop through keys and update
        // Assuming body is { site_phone: "123", maintenance_mode: "true" }

        for (const [key, value] of Object.entries(updates)) {
            await SiteSetting.upsert({ key, value });
        }

        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Gallery
const createGalleryProject = async (req, res) => {
    try {
        const project = await GalleryProject.create(req.body);
        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteGalleryProject = async (req, res) => {
    try {
        const project = await GalleryProject.findByPk(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        await project.destroy();
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getStats,
    getOrders,
    updateOrderStatus,
    createProduct,
    updateProduct,
    updateCalculatorComponent,
    getSettings,
    updateSettings,
    createGalleryProject,
    deleteGalleryProject
};
