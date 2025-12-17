const { CalculatorLead } = require('../models');

exports.create = async (req, res) => {
    try {
        const lead = await CalculatorLead.create(req.body);
        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status) where.status = status;

        const leads = await CalculatorLead.findAll({
            where,
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const lead = await CalculatorLead.findByPk(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

        if (req.body.status) {
            lead.status = req.body.status;
            await lead.save();
        }
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const lead = await CalculatorLead.findByPk(req.params.id);
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        await lead.destroy();
        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
