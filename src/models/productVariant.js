'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ProductVariant extends Model {
        static associate(models) {
            ProductVariant.belongsTo(models.Product, { foreignKey: 'product_id' });
        }
    }

    ProductVariant.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'id'
            }
        },
        attributes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Flexible attributes JSON (e.g. {"Lebar": "50", "Tinggi": "200"})'
        },
        price_gross: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            comment: 'Harga Gross'
        },
        price_net: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            comment: 'Harga Net'
        },
        satuan: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'm',
            comment: 'Satuan unit (e.g. meter, pcs, set)'
        },
        quantity_multiplier: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
            comment: 'Multiplier for quantity calculation (e.g. 2 for "2 Sibak")'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'ProductVariant',
        tableName: 'product_variants',
        underscored: true,
    });

    return ProductVariant;
};
