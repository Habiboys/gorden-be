const { Referral, Order, User, Document } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

// Get stats for logged-in user (their own referral stats)
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const referrals = await Referral.findAll({
            where: { referrer_id: userId },
            include: [
                { model: Order, attributes: ['id', 'total_amount', 'created_at'] },
                { model: Document, attributes: ['id', 'total_amount', 'created_at'] }
            ],
            order: [['created_at', 'DESC']]
        });

        const total_earnings = referrals.reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0);
        const pending_earnings = referrals
            .filter(r => r.status === 'PENDING')
            .reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0);
        const paid_earnings = referrals
            .filter(r => r.status === 'PAID')
            .reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0);

        res.json({
            success: true,
            data: {
                referral_code: user.referral_code,
                total_earnings,
                pending_earnings,
                paid_earnings,
                total_referrals: referrals.length,
                history: referrals
            }
        });
    } catch (error) {
        console.error('Error getting referral stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: Get all referrers with aggregated stats
const getAllReferrers = async (req, res) => {
    try {
        const { search } = req.query;

        // Find all users who have a referral_code (are referrers)
        let whereClause = {
            referral_code: { [Op.ne]: null }
        };

        if (search) {
            whereClause = {
                ...whereClause,
                [Op.or]: [
                    { name: { [Op.iLike]: `%${search}%` } },
                    { email: { [Op.iLike]: `%${search}%` } },
                    { referral_code: { [Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const referrers = await User.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'email', 'referral_code', 'created_at']
        });

        // For each referrer, calculate their stats
        const referrerStats = await Promise.all(referrers.map(async (user) => {
            const referrals = await Referral.findAll({
                where: { referrer_id: user.id }
            });

            const totalReferrals = referrals.length;
            const successfulReferrals = referrals.filter(r => r.status === 'PAID').length;
            const totalCommission = referrals.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
            const pendingCommission = referrals
                .filter(r => r.status === 'PENDING')
                .reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
            const paidCommission = referrals
                .filter(r => r.status === 'PAID')
                .reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);

            return {
                id: user.id,
                referrerName: user.name,
                referrerCode: user.referral_code,
                referrerEmail: user.email,
                totalReferrals,
                successfulReferrals,
                totalCommission,
                pendingCommission,
                paidCommission,
                joinedAt: user.created_at,
                status: 'active' // Could be enhanced later with user status
            };
        }));

        res.json({
            success: true,
            data: referrerStats
        });
    } catch (error) {
        console.error('Error getting all referrers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: Get single referrer detail with referred customers
const getReferrerDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'referral_code', 'created_at']
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Referrer not found' });
        }

        // Get all referrals for this user
        const referrals = await Referral.findAll({
            where: { referrer_id: id },
            include: [
                {
                    model: Order,
                    attributes: ['id', 'total_amount', 'status', 'created_at'],
                    include: [{ model: User, attributes: ['id', 'name', 'email'] }]
                },
                {
                    model: Document,
                    attributes: ['id', 'customer_name', 'customer_email', 'total_amount', 'status', 'created_at']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Calculate stats
        const totalReferrals = referrals.length;
        const successfulReferrals = referrals.filter(r => r.status === 'PAID').length;
        const totalCommission = referrals.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
        const pendingCommission = referrals
            .filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
        const paidCommission = referrals
            .filter(r => r.status === 'PAID')
            .reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);

        // Format referred customers for frontend
        const referredCustomers = referrals.map(ref => {
            const customerName = ref.Order?.User?.name || ref.Document?.customer_name || 'Unknown';
            const customerEmail = ref.Order?.User?.email || ref.Document?.customer_email || '';
            const orderValue = parseFloat(ref.Order?.total_amount || ref.Document?.total_amount || 0);
            const orderedAt = ref.Order?.created_at || ref.Document?.created_at || ref.created_at;

            return {
                id: ref.id,
                referrerId: ref.referrer_id,
                customerName,
                customerEmail,
                orderValue,
                commission: parseFloat(ref.commission_amount || 0),
                status: ref.status === 'PAID' ? 'completed' : 'pending',
                orderedAt
            };
        });

        res.json({
            success: true,
            data: {
                id: user.id,
                referrerName: user.name,
                referrerCode: user.referral_code,
                referrerEmail: user.email,
                totalReferrals,
                successfulReferrals,
                totalCommission,
                pendingCommission,
                paidCommission,
                joinedAt: user.created_at,
                status: 'active',
                referredCustomers
            }
        });
    } catch (error) {
        console.error('Error getting referrer detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: Get overall referral stats
const getAdminStats = async (req, res) => {
    try {
        // Count total referrers (users with referral_code)
        const totalReferrers = await User.count({
            where: { referral_code: { [Op.ne]: null } }
        });

        // Count total referrals
        const totalReferrals = await Referral.count();

        // Sum all commissions
        const allReferrals = await Referral.findAll();
        const totalCommission = allReferrals.reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
        const pendingCommission = allReferrals
            .filter(r => r.status === 'PENDING')
            .reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);
        const paidCommission = allReferrals
            .filter(r => r.status === 'PAID')
            .reduce((sum, r) => sum + parseFloat(r.commission_amount || 0), 0);

        res.json({
            success: true,
            data: {
                totalReferrers,
                totalReferrals,
                totalCommission,
                pendingCommission,
                paidCommission
            }
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: Pay commission (mark referral as paid)
const payCommission = async (req, res) => {
    try {
        const { id } = req.params;

        const referral = await Referral.findByPk(id);

        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }

        if (referral.status === 'PAID') {
            return res.status(400).json({ success: false, message: 'Commission already paid' });
        }

        referral.status = 'PAID';
        await referral.save();

        res.json({
            success: true,
            message: 'Commission marked as paid',
            data: referral
        });
    } catch (error) {
        console.error('Error paying commission:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: Pay all pending commissions for a referrer
const payAllCommissions = async (req, res) => {
    try {
        const { id } = req.params; // referrer user id

        const [updatedCount] = await Referral.update(
            { status: 'PAID' },
            { where: { referrer_id: id, status: 'PENDING' } }
        );

        res.json({
            success: true,
            message: `${updatedCount} commissions marked as paid`
        });
    } catch (error) {
        console.error('Error paying all commissions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getStats,
    getAllReferrers,
    getReferrerDetail,
    getAdminStats,
    payCommission,
    payAllCommissions
};
