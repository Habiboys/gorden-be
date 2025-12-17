const { CalculatorComponent } = require('../models');

const getComponents = async (req, res) => {
    try {
        const components = await CalculatorComponent.findAll();

        res.json({
            success: true,
            data: components
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getComponents,
    create: async (req, res) => {
        try {
            const component = await CalculatorComponent.create(req.body);
            res.status(201).json({
                success: true,
                data: component
            });
        } catch (error) {
            console.error('Error creating component:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create component',
                error: error.message
            });
        }
    },
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const [updated] = await CalculatorComponent.update(req.body, {
                where: { id }
            });
            if (updated) {
                const updatedComponent = await CalculatorComponent.findByPk(id);
                res.json({
                    success: true,
                    data: updatedComponent
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Component not found'
                });
            }
        } catch (error) {
            console.error('Error updating component:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update component',
                error: error.message
            });
        }
    },
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await CalculatorComponent.destroy({
                where: { id }
            });
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Component deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Component not found'
                });
            }
        } catch (error) {
            console.error('Error deleting component:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete component',
                error: error.message
            });
        }
    }
};
