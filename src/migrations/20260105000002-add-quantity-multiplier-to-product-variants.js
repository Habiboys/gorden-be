'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if column exists first to avoid errors on re-run
        const tableInfo = await queryInterface.describeTable('product_variants');
        if (!tableInfo.quantity_multiplier) {
            await queryInterface.addColumn('product_variants', 'quantity_multiplier', {
                type: Sequelize.INTEGER,
                defaultValue: 1,
                allowNull: true,
                comment: 'Multiplier for quantity calculation (e.g. 2 for "2 Sibak")'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('product_variants');
        if (tableInfo.quantity_multiplier) {
            await queryInterface.removeColumn('product_variants', 'quantity_multiplier');
        }
    }
};
