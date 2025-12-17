'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('site_settings', {
            key: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING
            },
            value: {
                type: Sequelize.TEXT
            },
            type: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.STRING
            }
            // Note: Model definitions say timestamps: false, so we omit created_at/updated_at here to match that expectation
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('site_settings');
    }
};
