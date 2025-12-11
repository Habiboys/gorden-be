'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class GalleryProject extends Model {
        static associate(models) {
            // associate if needed
        }
    }
    GalleryProject.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: DataTypes.STRING,
        category: DataTypes.ENUM('RESIDENTIAL', 'APARTMENT', 'OFFICE', 'CAFE_RESTO'),
        installation_type: DataTypes.STRING,
        location: DataTypes.STRING,
        completion_date: DataTypes.DATEONLY,
        image_url: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'GalleryProject',
        underscored: true,
    });
    return GalleryProject;
};
