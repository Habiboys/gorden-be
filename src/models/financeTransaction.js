'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class FinanceTransaction extends Model {
        static associate(models) {
            FinanceTransaction.belongsTo(models.Store, { foreignKey: 'store_id', as: 'Store' });
            FinanceTransaction.belongsTo(models.User, { foreignKey: 'user_id', as: 'PIC' });
        }
    }
    FinanceTransaction.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        store_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('INCOME', 'EXPENSE'),
            allowNull: false
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true // e.g. "Pemasukan dari owner", "Listrik"
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            get() {
                const value = this.getDataValue('amount');
                return value === null ? null : parseFloat(value);
            }
        },
        description: DataTypes.TEXT,
        transaction_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        balance_after: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            get() {
                const value = this.getDataValue('balance_after');
                return value === null ? null : parseFloat(value);
            }
        }
    }, {
        sequelize,
        modelName: 'FinanceTransaction',
        tableName: 'finance_transactions',
        underscored: true,
    });
    return FinanceTransaction;
};
