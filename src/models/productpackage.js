'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductPackage extends Model {
        static associate(models) {
            ProductPackage.belongsTo(models.Product, { foreignKey: 'product_id' });
        }
    }
    ProductPackage.init({
        product_id: DataTypes.UUID,
        name: DataTypes.STRING,
        slug: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'ProductPackage',
        tableName: 'product_packages',
        underscored: true,
    });
    return ProductPackage;
};
