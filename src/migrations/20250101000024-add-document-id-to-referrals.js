'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Referrals', 'document_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'Documents',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Referrals', 'document_id');
    }
};
