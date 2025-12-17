const { Faq } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const faqs = await Faq.findAll();
        res.json({ success: true, data: faqs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const faq = await Faq.create(req.body);
        res.status(201).json({ success: true, data: faq });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const faq = await Faq.findByPk(req.params.id);
        if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
        await faq.update(req.body);
        res.json({ success: true, data: faq });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const faq = await Faq.findByPk(req.params.id);
        if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
        await faq.destroy();
        res.json({ success: true, message: 'FAQ deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
