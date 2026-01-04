'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if column exists first
        const tableInfo = await queryInterface.describeTable('calculator_type_components');
        if (!tableInfo.multiply_with_variant) {
            await queryInterface.addColumn('calculator_type_components', 'multiply_with_variant', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
                comment: 'If true, component quantity is multiplied by selected variant multiplier'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('calculator_type_components');
        if (tableInfo.multiply_with_variant) {
            await queryInterface.removeColumn('calculator_type_components', 'multiply_with_variant');
        }
    }
};
