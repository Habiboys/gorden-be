'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Store extends Model {
        static associate(models) {
            Store.belongsToMany(models.User, { through: 'user_stores', foreignKey: 'store_id', as: 'Users' });
            Store.hasMany(models.FinanceTransaction, { foreignKey: 'store_id', as: 'Transactions' });
        }
    }
    Store.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: DataTypes.STRING,
        location: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Store',
        tableName: 'stores',
        underscored: true,
    });
    return Store;
};
