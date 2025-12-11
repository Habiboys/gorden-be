'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Product extends Model {
        static associate(models) {
            Product.belongsTo(models.Category, { foreignKey: 'category_id' });
            Product.hasMany(models.ProductPackage, { foreignKey: 'product_id' });
            Product.hasMany(models.OrderItem, { foreignKey: 'product_id' });
        }
    }
    Product.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        category_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        subtitle: DataTypes.STRING,
        description: DataTypes.TEXT,
        price: DataTypes.DECIMAL,
        original_price: DataTypes.DECIMAL,
        stock: DataTypes.INTEGER,
        discount_percent: DataTypes.INTEGER,
        price_unit: DataTypes.STRING,
        images: DataTypes.JSON,
        features: DataTypes.JSON,
        how_to_order: DataTypes.JSON,
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'),
            defaultValue: 'ACTIVE'
        }
    }, {
        sequelize,
        modelName: 'Product',
        underscored: true,
    });
    return Product;
};
