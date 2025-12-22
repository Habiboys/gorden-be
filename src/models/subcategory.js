'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SubCategory extends Model {
        static associate(models) {
            SubCategory.belongsTo(models.Category, { foreignKey: 'category_id' });
            SubCategory.hasMany(models.Product, { foreignKey: 'subcategory_id' });
        }
    }
    SubCategory.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: DataTypes.STRING,
        description: DataTypes.TEXT,
        has_max_length: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        category_id: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'SubCategory',
        tableName: 'subcategories',
        underscored: true,
    });
    return SubCategory;
};
