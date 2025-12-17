'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class CalculatorLead extends Model {
        static associate(models) {
            // define association here
        }
    }
    CalculatorLead.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: DataTypes.STRING,
        phone: DataTypes.STRING,
        email: DataTypes.STRING,
        calculator_type: DataTypes.STRING,
        estimated_price: DataTypes.DECIMAL,
        calculation_data: DataTypes.JSON,
        status: {
            type: DataTypes.ENUM('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'),
            defaultValue: 'NEW'
        }
    }, {
        sequelize,
        modelName: 'CalculatorLead',
        underscored: true,
    });
    return CalculatorLead;
};
