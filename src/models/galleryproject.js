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
        category: DataTypes.STRING, // Changed from ENUM
        type: DataTypes.STRING,
        installation_type: DataTypes.STRING,
        location: DataTypes.STRING,
        description: DataTypes.TEXT,
        date: DataTypes.DATEONLY,
        completion_date: DataTypes.DATEONLY, // Keep existing if needed, or map to date. Migration didn't remove it. Frontend uses 'date'. Let's keep both or use one. Migration added 'date'.
        image_url: DataTypes.STRING,
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        sequelize,
        modelName: 'GalleryProject',
        underscored: true,
    });
    return GalleryProject;
};
