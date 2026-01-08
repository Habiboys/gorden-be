'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Make SKU column unique
        await queryInterface.changeColumn('Products', 'sku', {
            type: Sequelize.STRING,
            unique: true,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove unique constraint
        await queryInterface.changeColumn('Products', 'sku', {
            type: Sequelize.STRING,
            unique: false,
            allowNull: true
        });
    }
};
