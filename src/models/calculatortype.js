'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CalculatorType extends Model {
        static associate(models) {
            CalculatorType.hasMany(models.CalculatorTypeComponent, {
                foreignKey: 'calculator_type_id',
                as: 'components'
            });
        }
    }

    CalculatorType.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: DataTypes.TEXT,
        has_item_type: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        has_package_type: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        fabric_multiplier: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 2.5
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        display_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'CalculatorType',
        tableName: 'calculator_types',
        underscored: true,
    });

    return CalculatorType;
};
