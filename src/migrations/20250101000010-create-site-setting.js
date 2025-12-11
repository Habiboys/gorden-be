'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('SiteSettings', {
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
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('SiteSettings');
    }
};
