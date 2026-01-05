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
        },
        variant_filter_rule: {
            type: DataTypes.STRING,
            defaultValue: 'none',
            comment: 'Filter rule for variants: none, gorden-smokering, rel-4-sizes, vitrase-kombinasi'
        },
        hide_on_door: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'If true, component is hidden when item type is Door (Pintu)'
        },
        show_gelombang: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'If true, show dynamic Gelombang column in variant picker'
        },
        price_follows_item_qty: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'If true, component price/qty follows item quantity (jendela count)'
        }
    }, {
        sequelize,
        modelName: 'CalculatorTypeComponent',
        tableName: 'calculator_type_components',
        underscored: true,
    });

    return CalculatorTypeComponent;
};
