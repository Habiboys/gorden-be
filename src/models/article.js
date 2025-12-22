'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Article extends Model {
        static associate(models) {
            // define association here if needed
        }
    }
    Article.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: DataTypes.STRING,
        slug: DataTypes.STRING,
        excerpt: DataTypes.TEXT,
        content: DataTypes.TEXT,
        category: DataTypes.STRING,
        tags: DataTypes.TEXT, // Comma separated tags
        author: DataTypes.STRING,
        image_url: DataTypes.STRING,
        is_featured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        status: {
            type: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
            defaultValue: 'DRAFT'
        },
        view_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'Article',
        underscored: true,
    });
    return Article;
};
