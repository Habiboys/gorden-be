'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Document extends Model {
        static associate(models) {
            Document.hasOne(models.Referral, { foreignKey: 'document_id' });
        }
    }
    Document.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('QUOTATION', 'INVOICE'),
            allowNull: false
        },
        document_number: DataTypes.STRING,
        customer_name: DataTypes.STRING,
        customer_email: DataTypes.STRING,
        customer_phone: DataTypes.STRING,
        address: DataTypes.TEXT,
        total_amount: DataTypes.DECIMAL,
        discount_amount: DataTypes.DECIMAL,
        data: DataTypes.JSON,
        status: {
            type: DataTypes.ENUM('DRAFT', 'SENT', 'OPENED', 'PENDING', 'PAID', 'ACCEPTED', 'REJECTED', 'CANCELLED'),
            defaultValue: 'DRAFT'
        },
        referral_code: DataTypes.STRING,
        valid_until: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'Document',
        underscored: true,
        timestamps: true,
    });
    return Document;
};
