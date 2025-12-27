'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Referral extends Model {
        static associate(models) {
            Referral.belongsTo(models.User, { foreignKey: 'referrer_id' });
            Referral.belongsTo(models.Order, { foreignKey: 'order_id' });
            Referral.belongsTo(models.Document, { foreignKey: 'document_id' });
        }
    }
    Referral.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        referrer_id: DataTypes.UUID,
        order_id: DataTypes.UUID,
        document_id: DataTypes.UUID,
        commission_amount: DataTypes.DECIMAL,
        status: {
            type: DataTypes.ENUM('PENDING', 'PAID'),
            defaultValue: 'PENDING'
        }
    }, {
        sequelize,
        modelName: 'Referral',
        underscored: true,
    });
    return Referral;
};
