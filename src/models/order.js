'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            Order.belongsTo(models.User, { foreignKey: 'user_id' });
            Order.hasMany(models.OrderItem, { foreignKey: 'order_id' });
            Order.hasOne(models.Referral, { foreignKey: 'order_id' });
        }
    }
    Order.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: DataTypes.UUID,
        customer_name: DataTypes.STRING,
        customer_email: DataTypes.STRING,
        customer_phone: DataTypes.STRING,
        shipping_address: DataTypes.TEXT,
        total_amount: DataTypes.DECIMAL,
        status: {
            type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
            defaultValue: 'PENDING'
        },
        payment_status: {
            type: DataTypes.ENUM('UNPAID', 'PAID', 'REFUNDED'),
            defaultValue: 'UNPAID'
        },
        notes: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Order',
        underscored: true,
    });
    return Order;
};
