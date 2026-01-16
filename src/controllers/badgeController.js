const { Badge } = require('../models');

const getBadges = async (req, res) => {
    try {
        const badges = await Badge.findAll({ order: [['created_at', 'DESC']] });
        res.json({ success: true, data: badges });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving badges', error: error.message });
    }
};

const createBadge = async (req, res) => {
    try {
        const { label, text_color, bg_color, position, is_system } = req.body;
        const badge = await Badge.create({ label, text_color, bg_color, position, is_system });
        res.status(201).json({ success: true, data: badge });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating badge', error: error.message });
    }
};

const updateBadge = async (req, res) => {
    try {
        const badge = await Badge.findByPk(req.params.id);
        if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });

        await badge.update(req.body);
        res.json({ success: true, data: badge });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating badge', error: error.message });
    }
};

const deleteBadge = async (req, res) => {
    try {
        const badge = await Badge.findByPk(req.params.id);
        if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });

        await badge.destroy();
        res.json({ success: true, message: 'Badge deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting badge', error: error.message });
    }
};

module.exports = { getBadges, createBadge, updateBadge, deleteBadge };
