'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasMany(models.Order, { foreignKey: 'user_id' });
            User.hasMany(models.Referral, { foreignKey: 'referrer_id', as: 'Commissions' });
            User.hasMany(models.User, { foreignKey: 'referred_by', as: 'ReferredUsers' });
            User.belongsToMany(models.Store, { through: 'user_stores', foreignKey: 'user_id', as: 'Stores' });
        }
    }
    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: DataTypes.STRING,
        email: {
            type: DataTypes.STRING,
            unique: true
        },
        password_hash: DataTypes.STRING,
        phone: DataTypes.STRING,
        role: {
            type: DataTypes.ENUM('ADMIN', 'CUSTOMER', 'FINANCE'),
            defaultValue: 'CUSTOMER'
        },
        referral_code: {
            type: DataTypes.STRING,
            unique: true
        },
        referred_by: DataTypes.UUID,
        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verification_token: DataTypes.STRING,
        verification_token_expires: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'User',
        underscored: true,
    });
    return User;
};
