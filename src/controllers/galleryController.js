const { GalleryProject } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const { category, featured } = req.query;
        const where = {};
        if (category && category !== 'all') where.category = category;
        if (featured === 'true') where.is_featured = true;

        const projects = await GalleryProject.findAll({
            where,
            order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const project = await GalleryProject.create(req.body);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const project = await GalleryProject.findByPk(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        await project.update(req.body);
        res.json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const project = await GalleryProject.findByPk(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
        await project.destroy();
        res.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
