'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('calculator_type_components', 'variant_filter_rule', {
            type: Sequelize.STRING(50),
            allowNull: true,
            defaultValue: 'none',
            comment: 'Filter rule for variants: none, gorden-smokering, rel-4-sizes, vitrase-kombinasi'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('calculator_type_components', 'variant_filter_rule');
    }
};
