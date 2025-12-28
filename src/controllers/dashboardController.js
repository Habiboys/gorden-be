const { Product, GalleryProject, CalculatorLead, Order, Article, Contact, Category, Document } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

// Get dashboard statistics
exports.getStats = async (req, res) => {
    try {
        // Get counts from database
        const [
            totalProducts,
            totalGallery,
            totalCalculatorLeads,
            totalOrders, // Using Documents as Orders
            totalArticles,
            totalContacts,
            totalCategories,
            pendingLeads,
            pendingContacts,
            pendingInvoices // Add to destructuring
        ] = await Promise.all([
            Product.count(),
            GalleryProject.count(),
            CalculatorLead.count(),
            Document.count({ where: { type: 'INVOICE' } }),
            Article.count(),
            Contact.count(),
            Category.count(),
            CalculatorLead.count({ where: { status: 'pending' } }),
            Contact.count({ where: { status: 'pending' } }),
            Document.count({ where: { type: 'INVOICE', status: 'PENDING' } })
        ]);

        // Calculate Total Revenue (Paid Invoices)
        const paidInvoices = await Document.findAll({
            where: {
                status: 'PAID',
                type: 'INVOICE'
            },
            attributes: ['total_amount']
        });

        const totalRevenue = paidInvoices.reduce((sum, doc) => sum + (parseFloat(doc.total_amount) || 0), 0);

        // Generate Chart Data (Last 6 Months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d);
        }

        const monthlyStats = await Promise.all(months.map(async (date) => {
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const monthName = startOfMonth.toLocaleDateString('id-ID', { month: 'short' });

            // Monthly Revenue
            const monthRevenueDocs = await Document.findAll({
                where: {
                    status: 'PAID',
                    type: 'INVOICE',
                    created_at: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['total_amount']
            });
            const revenue = monthRevenueDocs.reduce((sum, doc) => sum + (parseFloat(doc.total_amount) || 0), 0);

            // Monthly Orders (Invoices created)
            const orders = await Document.count({
                where: {
                    type: 'INVOICE',
                    created_at: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            return {
                month: monthName,
                revenue,
                orders
            };
        }));


        // Get recent recent activities, now including Documents
        const [recentProducts, recentArticles, recentLeads, recentContacts, recentDocs] = await Promise.all([
            Product.findAll({ order: [['created_at', 'DESC']], limit: 10 }),
            Article.findAll({ order: [['created_at', 'DESC']], limit: 10 }),
            CalculatorLead.findAll({ order: [['created_at', 'DESC']], limit: 10 }),
            Contact.findAll({ order: [['created_at', 'DESC']], limit: 10 }),
            Document.findAll({ order: [['created_at', 'DESC']], limit: 10 })
        ]);

        // Format recent activities
        const activities = [];

        recentProducts.forEach(p => {
            activities.push({
                action: 'Produk baru',
                item: p.name,
                time: formatTimeAgo(p.created_at || p.createdAt),
                rawTime: new Date(p.created_at || p.createdAt),
                type: 'success'
            });
        });

        recentArticles.forEach(a => {
            activities.push({
                action: 'Artikel baru',
                item: a.title,
                time: formatTimeAgo(a.created_at || a.createdAt),
                rawTime: new Date(a.created_at || a.createdAt),
                type: 'success'
            });
        });

        recentDocs.forEach(d => {
            activities.push({
                action: d.type === 'INVOICE' ? 'Invoice dibuat' : 'Penawaran dibuat',
                item: `${d.document_number} - ${d.customer_name}`,
                time: formatTimeAgo(d.created_at || d.createdAt),
                rawTime: new Date(d.created_at || d.createdAt),
                type: 'info'
            });
        });

        recentLeads.forEach(l => {
            activities.push({
                action: 'Lead baru',
                item: l.name,
                time: formatTimeAgo(l.created_at || l.createdAt),
                rawTime: new Date(l.created_at || l.createdAt),
                type: l.status === 'pending' ? 'warning' : 'info'
            });
        });

        recentContacts.forEach(c => {
            activities.push({
                action: 'Pesan baru',
                item: c.name,
                time: formatTimeAgo(c.created_at || c.createdAt),
                rawTime: new Date(c.created_at || c.createdAt),
                type: c.status === 'pending' ? 'warning' : 'info'
            });
        });

        // Sort by time and take top 50
        activities.sort((a, b) => b.rawTime - a.rawTime);

        // Remove rawTime before sending
        const sanitizedActivities = activities.slice(0, 50).map(({ rawTime, ...rest }) => rest);

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
                    pendingInvoices, // Add to response
                    totalRevenue,
                    monthlyStats
                },
                recentActivities: sanitizedActivities
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

// Helper function to format time ago safely
function formatTimeAgo(dateValue) {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diff = now - date;

    // Safety check for negative diff (future dates)
    if (diff < 0) return 'Baru saja';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
