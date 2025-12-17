'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = 'Products';

        await queryInterface.addColumn(table, 'sku', { type: Sequelize.STRING });
        await queryInterface.addColumn(table, 'information', { type: Sequelize.TEXT });
        await queryInterface.addColumn(table, 'price_self_measure', { type: Sequelize.DECIMAL });
        await queryInterface.addColumn(table, 'price_self_measure_install', { type: Sequelize.DECIMAL });
        await queryInterface.addColumn(table, 'price_measure_install', { type: Sequelize.DECIMAL });
        await queryInterface.addColumn(table, 'is_featured', { type: Sequelize.BOOLEAN, defaultValue: false });
        await queryInterface.addColumn(table, 'is_new_arrival', { type: Sequelize.BOOLEAN, defaultValue: false });
        await queryInterface.addColumn(table, 'is_best_seller', { type: Sequelize.BOOLEAN, defaultValue: false });
        await queryInterface.addColumn(table, 'meta_title', { type: Sequelize.STRING });
        await queryInterface.addColumn(table, 'meta_description', { type: Sequelize.TEXT });
        await queryInterface.addColumn(table, 'meta_keywords', { type: Sequelize.STRING });

        // Note: Changing ENUM values in existing column is DB-specific and tricky.
        // For safety, we will just modify the column to STRING or leave it if it works, 
        // but ideally we should update the ENUM. 
        // Since this is dev, we can try to change it to STRING to support more statuses without strict ENUM issues.
        await queryInterface.changeColumn(table, 'status', {
            type: Sequelize.STRING,
            defaultValue: 'ACTIVE'
        });
    },

    async down(queryInterface, Sequelize) {
        const table = 'Products';
        await queryInterface.removeColumn(table, 'sku');
        await queryInterface.removeColumn(table, 'information');
        await queryInterface.removeColumn(table, 'price_self_measure');
        await queryInterface.removeColumn(table, 'price_self_measure_install');
        await queryInterface.removeColumn(table, 'price_measure_install');
        await queryInterface.removeColumn(table, 'is_featured');
        await queryInterface.removeColumn(table, 'is_new_arrival');
        await queryInterface.removeColumn(table, 'is_best_seller');
        await queryInterface.removeColumn(table, 'meta_title');
        await queryInterface.removeColumn(table, 'meta_description');
        await queryInterface.removeColumn(table, 'meta_keywords');
        // Revert status to original ENUM
        await queryInterface.changeColumn(table, 'status', {
            type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'),
            defaultValue: 'ACTIVE'
        });
    }
};
