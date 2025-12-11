'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SiteSetting extends Model {
        static associate(models) {
            // associate if needed
        }
    }
    SiteSetting.init({
        key: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        value: DataTypes.TEXT,
        type: DataTypes.STRING,
        description: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'SiteSetting',
        underscored: true,
        timestamps: false // Assuming settings don't strictly need timestamps, but design had them? Design didn't specify timestamps but usually good to have. Design table 1.6 Site settings didn't list timestamps explicitly but usually included. Let's stick to design which didn't verify timestamps. Wait, design table 1.6 doesn't show created_at/updated_at. I'll omit them or keep default true. default true is safer. But design didn't list them. I'll disable them to be precise, or meaningful. Let's keep them false as per strict reading, or true for good practice. The design table 1.6 ends with 'description'. No timestamps row. I'll set timestamps: false.
    });
    return SiteSetting;
};
