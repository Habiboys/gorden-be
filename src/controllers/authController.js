const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');
require('dotenv').config();

const generateReferralCode = (name) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
};

// Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
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
        while (await User.findOne({ where: { referral_code: newReferralCode } })) {
            newReferralCode = generateReferralCode(name);
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await User.create({
            name,
            email,
            password_hash,
            phone: req.body.phone || null,
            role: 'CUSTOMER',
            referral_code: newReferralCode,
            referred_by,
            email_verified: false,
            verification_token: verificationToken,
            verification_token_expires: verificationTokenExpires
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, name, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails, user can resend
        }

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.',
            requiresVerification: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({
            where: { verification_token: token }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token verifikasi tidak valid'
            });
        }

        // Check if token is expired
        if (user.verification_token_expires && new Date() > user.verification_token_expires) {
            return res.status(400).json({
                success: false,
                message: 'Token verifikasi sudah kadaluarsa. Silakan minta kirim ulang.'
            });
        }

        // Update user as verified
        await user.update({
            email_verified: true,
            verification_token: null,
            verification_token_expires: null
        });

        res.json({
            success: true,
            message: 'Email berhasil diverifikasi! Silakan login.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email tidak ditemukan'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah diverifikasi'
            });
        }

        // Generate new token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await user.update({
            verification_token: verificationToken,
            verification_token_expires: verificationTokenExpires
        });

        // Send verification email
        await sendVerificationEmail(email, user.name, verificationToken);

        res.json({
            success: true,
            message: 'Email verifikasi telah dikirim ulang'
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

        // Check if email is verified (except for admin)
        if (!user.email_verified && user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Email belum diverifikasi. Silakan cek email Anda.',
                requiresVerification: true,
                email: user.email
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d'
        });

        res.json({
            success: true,
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
            attributes: { exclude: ['password_hash', 'verification_token', 'verification_token_expires'] }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password lama dan password baru harus diisi'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password baru minimal 6 karakter'
            });
        }

        // Get user with password
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Password lama tidak sesuai'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await user.update({ password_hash: newPasswordHash });

        res.json({
            success: true,
            message: 'Password berhasil diubah'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    register,
    verifyEmail,
    resendVerification,
    login,
    me,
    changePassword
};
