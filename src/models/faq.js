'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Faq extends Model {
        static associate(models) {
            // define association here
        }
    }
    Faq.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        question: DataTypes.TEXT,
        answer: DataTypes.TEXT,
        category: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Faq',
        underscored: true,
    });
    return Faq;
};
