'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OrderItem extends Model {
        static associate(models) {
            OrderItem.belongsTo(models.Order, { foreignKey: 'order_id' });
            OrderItem.belongsTo(models.Product, { foreignKey: 'product_id' });
        }
    }
    OrderItem.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        order_id: DataTypes.UUID,
        product_id: DataTypes.UUID,
        product_name: DataTypes.STRING,
        quantity: DataTypes.INTEGER,
        unit_price: DataTypes.DECIMAL,
        width: DataTypes.DECIMAL,
        height: DataTypes.DECIMAL,
        subtotal: DataTypes.DECIMAL,
        package_variant: DataTypes.STRING,
        components_snapshot: DataTypes.JSON
    }, {
        sequelize,
        modelName: 'OrderItem',
        underscored: true,
    });
    return OrderItem;
};
