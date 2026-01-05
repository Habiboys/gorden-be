'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('calculator_type_components', 'price_follows_item_qty', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: 'If true, component quantity/price follows item quantity (jendela count)'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('calculator_type_components', 'price_follows_item_qty');
    }
};
