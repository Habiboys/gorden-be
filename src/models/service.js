'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Service extends Model {
        static associate(models) {
            // define association here
        }
    }
    Service.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        icon: DataTypes.STRING,
        image_url: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Service',
        underscored: true,
    });
    return Service;
};
