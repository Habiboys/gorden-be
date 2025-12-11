'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class CalculatorComponent extends Model {
        static associate(models) {
            // define association here if needed
        }
    }
    CalculatorComponent.init({
        type: {
            type: DataTypes.ENUM('rel_gorden', 'tassel', 'hook', 'vitrase_kain', 'vitrase_rel'),
            allowNull: false
        },
        name: DataTypes.STRING,
        price: DataTypes.DECIMAL,
        image_url: DataTypes.STRING,
        max_width: DataTypes.INTEGER,
        description: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'CalculatorComponent',
        underscored: true,
    });
    return CalculatorComponent;
};
