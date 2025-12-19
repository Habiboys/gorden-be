'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add email_verified column
        await queryInterface.addColumn('Users', 'email_verified', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });

        // Add verification_token column
        await queryInterface.addColumn('Users', 'verification_token', {
            type: Sequelize.STRING,
            allowNull: true
        });

        // Add verification_token_expires column
        await queryInterface.addColumn('Users', 'verification_token_expires', {
            type: Sequelize.DATE,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'email_verified');
        await queryInterface.removeColumn('Users', 'verification_token');
        await queryInterface.removeColumn('Users', 'verification_token_expires');
    }
};
