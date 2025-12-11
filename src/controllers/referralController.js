const { Referral, Order, User } = require('../models');

const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        const referrals = await Referral.findAll({
            where: { referrer_id: userId },
            include: [{ model: Order, attributes: ['id', 'total_amount', 'created_at'] }],
            order: [['created_at', 'DESC']]
        });

        const total_earnings = referrals.reduce((sum, ref) => sum + parseFloat(ref.commission_amount || 0), 0);

        res.json({
            referral_code: user.referral_code,
            total_earnings,
            history: referrals
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getStats
};
