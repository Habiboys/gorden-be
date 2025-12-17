const { Contact } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const contacts = await Contact.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const contact = await Contact.create(req.body);
        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });

        if (req.body.status) {
            contact.status = req.body.status;
            await contact.save();
        }
        res.json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
        await contact.destroy();
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
