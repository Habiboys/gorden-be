'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Badge extends Model {
        static associate(models) {
            Badge.belongsToMany(models.Product, {
                through: 'product_badges',
                foreignKey: 'badge_id',
                otherKey: 'product_id',
                as: 'products'
            });
        }
    }
    Badge.init({
        label: DataTypes.STRING,
        text_color: DataTypes.STRING,
        bg_color: DataTypes.STRING,
        position: DataTypes.STRING,
        is_system: DataTypes.BOOLEAN
    }, {
        sequelize,
        modelName: 'Badge',
        underscored: true,
    });
    return Badge;
};
