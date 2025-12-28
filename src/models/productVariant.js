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
        width: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Lebar (cm)'
        },
        wave: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Gelombang'
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Tinggi (cm)'
        },
        sibak: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: '1 = single, 2 = pair, etc'
        },
        price: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            comment: 'Harga varian'
        },
        recommended_min_width: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Min lebar cocok (cm)'
        },
        recommended_max_width: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Max lebar cocok (cm)'
        },
        recommended_height: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Tinggi cocok (cm)'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'ProductVariant',
        tableName: 'ProductVariants',
        underscored: true,
    });

    return ProductVariant;
};
