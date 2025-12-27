'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Contacts', 'subject', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'phone'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Contacts', 'subject');
    }
};
