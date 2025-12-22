const { Article } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const { status, category, limit } = req.query;
        const where = {};
        if (status) where.status = status;
        // If not admin, only show published
        if (!req.user || req.user.role !== 'ADMIN') {
            where.status = 'PUBLISHED';
        }

        if (category) where.category = category;

        const articles = await Article.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: limit ? parseInt(limit) : undefined
        });
        res.json({ success: true, data: articles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

        // Increment view count
        article.view_count += 1;
        await article.save();

        res.json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get article by slug - for public access (only published)
exports.getBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await Article.findOne({
            where: { slug }
        });

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // For non-admin users, only show published articles
        if (!req.user || req.user.role !== 'ADMIN') {
            if (article.status !== 'PUBLISHED') {
                return res.status(404).json({ success: false, message: 'Article not found' });
            }
        }

        // Increment view count
        article.view_count = (article.view_count || 0) + 1;
        await article.save();

        res.json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const article = await Article.create(req.body);
        res.status(201).json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
        await article.update(req.body);
        res.json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);
        if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
        await article.destroy();
        res.json({ success: true, message: 'Article deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
