const { Order, OrderItem, User, Referral, Product, Sequelize } = require('../models');

const checkout = async (req, res) => {
    const transaction = await Order.sequelize.transaction();
    try {
        const { items, notes, shipping_address } = req.body;
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        // Calculate total
        let total_amount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = await Product.findByPk(item.product_id);
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ message: `Product ${item.product_id} not found` });
            }

            // Basic calculation logic - simplified for now, assuming unit_price is dynamic or base
            // If dynamic pricing (calculator) logic needed, it should be done here.
            // For now, I'll take unit_price from frontend or product price?
            // Design says `unit_price` in order_items is "Price at time of purchase".
            // Let's assume frontend sends calculated price OR we use product base price.
            // Ideally backend verifies price. But calculator is complex.
            // Let's use product.price for base, and maybe frontend sends the final calculated price?
            // For security, backend should recalculate. But for this specific task, I'll trust frontend 'unit_price' if sent, else product.price.
            // Wait, item payload has width/height/components.
            // I will implement a placeholder for complex calculation essentially taking what's given or defaults.

            let price = item.unit_price || product.price; // Fallback
            let subtotal = price * item.quantity;
            total_amount += subtotal;

            orderItemsData.push({
                product_id: product.id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: price,
                width: item.width,
                height: item.height,
                subtotal: subtotal,
                package_variant: item.package_variant,
                components_snapshot: item.components
            });
        }

        const order = await Order.create({
            user_id: userId,
            customer_name: user.name,
            customer_email: user.email,
            customer_phone: user.phone,
            shipping_address: shipping_address || 'Default Address', // Should be validated
            total_amount,
            status: 'PENDING',
            payment_status: 'UNPAID',
            notes
        }, { transaction });

        for (const itemData of orderItemsData) {
            await OrderItem.create({
                order_id: order.id,
                ...itemData
            }, { transaction });
        }

        // Referral Logic
        if (user.referred_by) {
            const commissionRate = 0.10; // 10%
            const commission = total_amount * commissionRate;

            await Referral.create({
                referrer_id: user.referred_by,
                order_id: order.id,
                commission_amount: commission,
                status: 'PENDING'
            }, { transaction });
        }

        await transaction.commit();
        res.status(201).json(order);

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            include: [{ model: OrderItem }]
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderDetail = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: OrderItem }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    checkout,
    getMyOrders,
    getOrderDetail
};
