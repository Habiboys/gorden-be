'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            Category.hasMany(models.Product, { foreignKey: 'category_id' });
            Category.hasMany(models.SubCategory, { foreignKey: 'category_id' });
        }
    }
    Category.init({
        name: DataTypes.STRING,
        slug: DataTypes.STRING,
        description: DataTypes.TEXT,
        icon_url: DataTypes.STRING,
        image: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Category',
        underscored: true,
    });
    return Category;
};
