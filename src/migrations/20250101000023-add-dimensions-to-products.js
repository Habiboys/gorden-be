'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Products', 'min_width', {
            type: Sequelize.DECIMAL,
            allowNull: true
        });
        await queryInterface.addColumn('Products', 'max_width', {
            type: Sequelize.DECIMAL,
            allowNull: true
        });
        await queryInterface.addColumn('Products', 'min_length', {
            type: Sequelize.DECIMAL,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Products', 'min_width');
        await queryInterface.removeColumn('Products', 'max_width');
        await queryInterface.removeColumn('Products', 'min_length');
    }
};
