const { User, Store } = require('../models');
const bcrypt = require('bcryptjs');

module.exports = {
    // Get all users
    async getAll(req, res) {
        try {
            const { page = 1, limit = 10, search, role } = req.query;
            console.log('User Controller getAll Query:', req.query);
            const offset = (page - 1) * limit;

            const { Op } = require('sequelize');
            const where = {};

            // Search filter
            if (search) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${search}%` } },
                    { email: { [Op.like]: `%${search}%` } }
                ];
            }

            // Role filter
            if (role && role !== 'undefined' && role !== 'null') {
                where.role = role;
            }

            const { count, rows } = await User.findAndCountAll({
                where,
                attributes: { exclude: ['password_hash'] }, // Ensure correct attribute name (password_hash vs password)
                include: [{
                    model: Store,
                    as: 'Stores',
                    through: { attributes: [] }
                }],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return res.status(200).json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch users',
                error: error.message
            });
        }
    },

    // Get user by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
                include: [{
                    model: Store,
                    as: 'Stores',
                    through: { attributes: [] }
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user',
                error: error.message
            });
        }
    },

    // Create user
    async create(req, res) {
        try {
            const { name, email, password, role, phone } = req.body;

            // Check if email exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                name,
                email,
                password_hash: hashedPassword,
                role: role || 'USER',
                phone
            });

            // Return user without password
            const userResponse = user.toJSON();
            delete userResponse.password_hash;

            return res.status(201).json({
                success: true,
                data: userResponse,
                message: 'User created successfully'
            });
        } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error.message
            });
        }
    },

    // Update user
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, password, role, phone } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const updateData = { name, email, role, phone };

            // Only update password if provided
            if (password) {
                updateData.password_hash = await bcrypt.hash(password, 10);
            }

            // If email is changed, check uniqueness
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already registered'
                    });
                }
            }

            await user.update(updateData);

            const userResponse = user.toJSON();
            delete userResponse.password_hash;

            return res.status(200).json({
                success: true,
                data: userResponse,
                message: 'User updated successfully'
            });
        } catch (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message
            });
        }
    },

    // Delete user
    async delete(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent deleting self? Maybe frontend handles this, but good to have safeguard
            if (req.user && req.user.userId === user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            await user.destroy();

            return res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete user',
                error: error.message
            });
        }
    }
};
