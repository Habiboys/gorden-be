const { CalculatorComponent } = require('../models');

const getComponents = async (req, res) => {
    try {
        const components = await CalculatorComponent.findAll();

        // Group by type
        const grouped = components.reduce((acc, curr) => {
            const type = curr.type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(curr);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getComponents
};
