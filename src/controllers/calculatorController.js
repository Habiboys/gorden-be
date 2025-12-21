const { CalculatorComponent, Product } = require('../models');

// Get all components as flat list (for Admin page)
const getAll = async (req, res) => {
    try {
        const components = await CalculatorComponent.findAll();

        // Return flat array with formatted data
        const formattedComponents = components.map(comp => ({
            id: comp.id,
            name: comp.name,
            type: comp.type,
            price: parseFloat(comp.price) || 0,
            description: comp.description || '',
            image: comp.image_url || '',
            maxWidth: comp.max_width || null
        }));

        res.json({
            success: true,
            data: formattedComponents
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

// Get components grouped by type (for User Calculator page)
const getGrouped = async (req, res) => {
    try {
        const components = await CalculatorComponent.findAll();

        // Group components by type for frontend use
        const grouped = {
            relGorden: [],
            tassel: [],
            hook: [],
            kainVitrase: [],
            relVitrase: [],
            products: []
        };

        components.forEach(comp => {
            const data = {
                id: comp.id,
                name: comp.name,
                price: parseFloat(comp.price) || 0,
                description: comp.description || '',
                image: comp.image_url || 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&h=300&fit=crop',
                maxWidth: comp.max_width || 500
            };

            switch (comp.type) {
                case 'rel_gorden':
                    grouped.relGorden.push(data);
                    break;
                case 'tassel':
                    grouped.tassel.push(data);
                    break;
                case 'hook':
                    grouped.hook.push(data);
                    break;
                case 'vitrase_kain':
                    grouped.kainVitrase.push(data);
                    break;
                case 'vitrase_rel':
                    grouped.relVitrase.push(data);
                    break;
            }
        });

        // Also fetch products for the calculator
        try {
            const products = await Product.findAll({
                where: { status: 'ACTIVE' },
                limit: 20
            });
            grouped.products = products.map(p => ({
                id: p.id,
                name: p.name,
                price: parseFloat(p.price_self_measure) || parseFloat(p.price) || 0,
                image: p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&h=300&fit=crop',
                category: p.category || 'Gorden'
            }));
        } catch (productError) {
            console.log('Could not fetch products for calculator:', productError.message);
        }

        res.json({
            success: true,
            data: grouped
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
    getAll,
    getGrouped,
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
