const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const generateReferralCode = (name) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
};

const register = async (req, res) => {
    try {
        const { name, email, password, referral_code } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Handle referral
        let referred_by = null;
        if (referral_code) {
            const referrer = await User.findOne({ where: { referral_code } });
            if (referrer) {
                referred_by = referrer.id;
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Generate own referral code
        let newReferralCode = generateReferralCode(name);
        // Simple collision check (could be more robust)
        while (await User.findOne({ where: { referral_code: newReferralCode } })) {
            newReferralCode = generateReferralCode(name);
        }

        const user = await User.create({
            name,
            email,
            password_hash,
            phone: req.body.phone || null,
            role: 'CUSTOMER',
            referral_code: newReferralCode,
            referred_by
        });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d'
        });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                referral_code: user.referral_code
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d'
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const me = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    me
};
