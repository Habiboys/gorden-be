'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class FinanceCategory extends Model {
        static associate(models) {
            // Define association here
        }
    }
    FinanceCategory.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM('INCOME', 'EXPENSE'),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'FinanceCategory',
        tableName: 'finance_categories',
        underscored: true,
    });
    return FinanceCategory;
};
