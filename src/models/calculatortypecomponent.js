'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CalculatorTypeComponent extends Model {
        static associate(models) {
            CalculatorTypeComponent.belongsTo(models.CalculatorType, {
                foreignKey: 'calculator_type_id',
                as: 'calculatorType'
            });
            CalculatorTypeComponent.belongsTo(models.SubCategory, {
                foreignKey: 'subcategory_id',
                as: 'subcategory'
            });
        }
    }

    CalculatorTypeComponent.init({
        calculator_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        subcategory_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        price_calculation: {
            type: DataTypes.ENUM('per_meter', 'per_unit', 'per_10_per_meter'),
            defaultValue: 'per_meter'
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        multiply_with_variant: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'If true, component quantity is multiplied by selected variant multiplier'
        }
    }, {
        sequelize,
        modelName: 'CalculatorTypeComponent',
        tableName: 'calculator_type_components',
        underscored: true,
    });

    return CalculatorTypeComponent;
};
