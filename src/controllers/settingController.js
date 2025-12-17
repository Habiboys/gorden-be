const { SiteSetting } = require('../models');

// Get all settings as a key-value object
exports.getAll = async (req, res) => {
    try {
        const settings = await SiteSetting.findAll();
        const settingsMap = {};
        settings.forEach(s => {
            // Convert value based on type
            let val = s.value;
            if (s.type === 'boolean') val = s.value === 'true';
            if (s.type === 'json') {
                try { val = JSON.parse(s.value); } catch (e) { }
            }
            settingsMap[s.key] = val;
        });
        res.json({ success: true, data: settingsMap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get public settings
exports.getPublic = async (req, res) => {
    try {
        const settings = await SiteSetting.findAll();
        const settingsMap = {};
        settings.forEach(s => {
            let val = s.value;
            if (s.type === 'boolean') val = s.value === 'true';
            if (s.type === 'json') {
                try { val = JSON.parse(s.value); } catch (e) { }
            }
            settingsMap[s.key] = val;
        });
        res.json({ success: true, data: settingsMap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Bulk update settings
exports.updateBulk = async (req, res) => {
    try {
        const newSettings = req.body;
        const keys = Object.keys(newSettings);

        for (const key of keys) {
            let val = newSettings[key];
            const type = typeof val;

            // Skip empty strings to preserve existing values
            if (val === '' || val === null || val === undefined) {
                continue;
            }

            let dbVal = val;

            if (type === 'boolean') dbVal = val.toString();
            else if (type === 'object') dbVal = JSON.stringify(val);
            else dbVal = String(val);

            // Upsert
            const [setting, created] = await SiteSetting.findOrCreate({
                where: { key },
                defaults: { value: dbVal, type: type === 'boolean' ? 'boolean' : (type === 'object' ? 'json' : 'string') }
            });

            if (!created) {
                await setting.update({ value: dbVal });
            }
        }

        res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
