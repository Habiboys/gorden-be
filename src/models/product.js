'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Product extends Model {
        static associate(models) {
            Product.belongsTo(models.Category, { foreignKey: 'category_id' });
            Product.belongsTo(models.SubCategory, { foreignKey: 'subcategory_id' });
            Product.hasMany(models.ProductPackage, { foreignKey: 'product_id' });
            Product.hasMany(models.OrderItem, { foreignKey: 'product_id' });
            Product.hasMany(models.ProductVariant, { foreignKey: 'product_id', as: 'variants' });
        }
    }
    Product.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        category_id: DataTypes.INTEGER,
        subcategory_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        sku: DataTypes.STRING,
        subtitle: DataTypes.STRING,
        description: DataTypes.TEXT,
        information: DataTypes.TEXT,
        price: DataTypes.DECIMAL,
        original_price: DataTypes.DECIMAL,
        price_self_measure: DataTypes.DECIMAL,
        price_self_measure_install: DataTypes.DECIMAL,
        price_measure_install: DataTypes.DECIMAL,
        stock: DataTypes.INTEGER,
        discount_percent: DataTypes.INTEGER,
        min_width: DataTypes.DECIMAL,
        max_width: DataTypes.DECIMAL,
        min_length: DataTypes.DECIMAL,
        max_length: DataTypes.DECIMAL,
        price_unit: DataTypes.STRING,
        images: DataTypes.JSON,
        features: DataTypes.JSON,
        how_to_order: DataTypes.JSON,
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_new_arrival: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_best_seller: { type: DataTypes.BOOLEAN, defaultValue: false },
        meta_title: DataTypes.STRING,
        meta_description: DataTypes.TEXT,
        meta_keywords: DataTypes.STRING,
        sibak: DataTypes.INTEGER, // Added Sibak field
        status: {
            type: DataTypes.STRING, // Changed from ENUM to STRING for flexibility as per migration
            defaultValue: 'ACTIVE'
        }
    }, {
        sequelize,
        modelName: 'Product',
        underscored: true,
    });
    return Product;
};
