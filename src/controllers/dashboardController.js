const { Product, GalleryProject, CalculatorLead, Order, Article, Contact, Category } = require('../models');
const { Op } = require('sequelize');

// Get dashboard statistics
exports.getStats = async (req, res) => {
    try {
        // Get counts from database
        const [
            totalProducts,
            totalGallery,
            totalCalculatorLeads,
            totalOrders,
            totalArticles,
            totalContacts,
            totalCategories,
            pendingLeads,
            pendingContacts
        ] = await Promise.all([
            Product.count(),
            GalleryProject.count(),
            CalculatorLead.count(),
            Order.count(),
            Article.count(),
            Contact.count(),
            Category.count(),
            CalculatorLead.count({ where: { status: 'pending' } }),
            Contact.count({ where: { status: 'pending' } })
        ]);

        // Get recent orders for revenue calculation (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentOrders = await Order.findAll({
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo }
            },
            attributes: ['total_amount', 'status']
        });

        const totalRevenue = recentOrders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

        // Get recent activities
        const [recentProducts, recentArticles, recentLeads, recentContacts, recentGallery] = await Promise.all([
            Product.findAll({ order: [['created_at', 'DESC']], limit: 3, attributes: ['id', 'name', 'created_at'] }),
            Article.findAll({ order: [['created_at', 'DESC']], limit: 3, attributes: ['id', 'title', 'created_at'] }),
            CalculatorLead.findAll({ order: [['created_at', 'DESC']], limit: 3, attributes: ['id', 'name', 'created_at', 'status'] }),
            Contact.findAll({ order: [['created_at', 'DESC']], limit: 3, attributes: ['id', 'name', 'created_at', 'status'] }),
            GalleryProject.findAll({ order: [['created_at', 'DESC']], limit: 3, attributes: ['id', 'title', 'created_at'] })
        ]);

        // Format recent activities
        const activities = [];

        recentProducts.forEach(p => {
            activities.push({
                action: 'Produk baru ditambahkan',
                item: p.name,
                time: formatTimeAgo(p.created_at),
                type: 'success'
            });
        });

        recentArticles.forEach(a => {
            activities.push({
                action: 'Artikel dipublikasikan',
                item: a.title,
                time: formatTimeAgo(a.created_at),
                type: 'success'
            });
        });

        recentLeads.forEach(l => {
            activities.push({
                action: 'Lead kalkulator baru',
                item: l.name,
                time: formatTimeAgo(l.created_at),
                type: l.status === 'pending' ? 'warning' : 'info'
            });
        });

        recentContacts.forEach(c => {
            activities.push({
                action: 'Kontak diterima',
                item: c.name,
                time: formatTimeAgo(c.created_at),
                type: c.status === 'pending' ? 'warning' : 'info'
            });
        });

        recentGallery.forEach(g => {
            activities.push({
                action: 'Galeri diupdate',
                item: g.title,
                time: formatTimeAgo(g.created_at),
                type: 'info'
            });
        });

        // Sort by time and take top 5
        activities.sort((a, b) => {
            const timeA = parseTimeAgo(a.time);
            const timeB = parseTimeAgo(b.time);
            return timeA - timeB;
        });

        res.json({
            success: true,
            data: {
                stats: {
                    totalProducts,
                    totalGallery,
                    totalCalculatorLeads,
                    totalOrders,
                    totalArticles,
                    totalContacts,
                    totalCategories,
                    pendingLeads,
                    pendingContacts,
                    totalRevenue
                },
                recentActivities: activities.slice(0, 5)
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard stats',
            message: error.message
        });
    }
};

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days === 1) return '1 hari lalu';
    return `${days} hari lalu`;
}

// Helper to parse time ago for sorting
function parseTimeAgo(str) {
    const num = parseInt(str) || 0;
    if (str.includes('menit')) return num;
    if (str.includes('jam')) return num * 60;
    if (str.includes('hari')) return num * 60 * 24;
    return num * 60 * 24 * 30;
}
