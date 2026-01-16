'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductBadge extends Model {
        static associate(models) {
        }
    }
    ProductBadge.init({
        product_id: DataTypes.UUID,
        badge_id: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ProductBadge',
        tableName: 'product_badges',
        underscored: true,
    });
    return ProductBadge;
};
