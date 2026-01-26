const { Store, User } = require('../models');

module.exports = {
    // Create a new store
    async create(req, res) {
        try {
            const { name, location, description } = req.body;
            const store = await Store.create({ name, location, description });
            return res.status(201).json({
                success: true,
                data: store,
                message: 'Store created successfully'
            });
        } catch (error) {
            console.error('Error creating store:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create store',
                error: error.message
            });
        }
    },

    // Get all stores
    async getAll(req, res) {
        try {
            const stores = await Store.findAll({
                include: [{
                    model: User,
                    as: 'Users',
                    attributes: ['id', 'name', 'email'],
                    through: { attributes: [] }
                }],
                order: [['created_at', 'DESC']]
            });
            return res.status(200).json({
                success: true,
                data: stores
            });
        } catch (error) {
            console.error('Error fetching stores:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch stores',
                error: error.message
            });
        }
    },

    // Get store by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const store = await Store.findByPk(id, {
                include: [{
                    model: User,
                    as: 'Users',
                    attributes: ['id', 'name', 'email', 'role'],
                    through: { attributes: [] }
                }]
            });

            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: store
            });
        } catch (error) {
            console.error('Error fetching store:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch store',
                error: error.message
            });
        }
    },

    // Update store
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, location, description } = req.body;

            const store = await Store.findByPk(id);
            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found'
                });
            }

            await store.update({ name, location, description });

            return res.status(200).json({
                success: true,
                data: store,
                message: 'Store updated successfully'
            });
        } catch (error) {
            console.error('Error updating store:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update store',
                error: error.message
            });
        }
    },

    // Delete store
    async delete(req, res) {
        try {
            const { id } = req.params;
            const store = await Store.findByPk(id);

            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found'
                });
            }

            await store.destroy();

            return res.status(200).json({
                success: true,
                message: 'Store deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting store:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete store',
                error: error.message
            });
        }
    },

    // Assign user to store
    async assignUser(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            const store = await Store.findByPk(id);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Check if already assigned
            const hasUser = await store.hasUser(user);
            if (!hasUser) {
                await store.addUser(user);
            }

            return res.status(200).json({
                success: true,
                message: 'User assigned to store successfully'
            });
        } catch (error) {
            console.error('Error assigning user to store:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to assign user',
                error: error.message
            });
        }
    },

    // Remove user from store
    async removeUser(req, res) {
        try {
            const { id, userId } = req.params;

            const store = await Store.findByPk(id);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            await store.removeUser(user);

            return res.status(200).json({
                success: true,
                message: 'User removed from store successfully'
            });
        } catch (error) {
            console.error('Error removing user from store:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to remove user',
                error: error.message
            });
        }
    }
};
