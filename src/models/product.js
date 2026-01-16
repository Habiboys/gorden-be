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
            Product.belongsToMany(models.Badge, {
                through: 'product_badges',
                foreignKey: 'product_id',
                otherKey: 'badge_id',
                as: 'badges'
            });
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
        sku: {
            type: DataTypes.STRING,
            unique: true
        },
        subtitle: DataTypes.STRING,
        description: DataTypes.TEXT,
        information: DataTypes.TEXT,
        // Price fields removed - now handled by ProductVariant.price_net/price_gross
        stock: DataTypes.INTEGER,
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
        variant_options: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Definitions of available options (e.g. [{"name": "Lebar", "values": ["50", "100"]}])'
        },
        sibak: DataTypes.INTEGER, // Added Sibak field
        is_warranty: { type: DataTypes.BOOLEAN, defaultValue: false }, // Garansi 1 Tahun
        is_custom: { type: DataTypes.BOOLEAN, defaultValue: false }, // Gorden Custom
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
