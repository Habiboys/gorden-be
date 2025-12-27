'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Contact extends Model {
        static associate(models) {
            // define association here
        }
    }
    Contact.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: DataTypes.STRING,
        email: DataTypes.STRING,
        phone: DataTypes.STRING,
        subject: DataTypes.STRING,
        message: DataTypes.TEXT,
        status: {
            type: DataTypes.ENUM('NEW', 'READ', 'RESPONDED'),
            defaultValue: 'NEW'
        }
    }, {
        sequelize,
        modelName: 'Contact',
        underscored: true,
    });
    return Contact;
};
