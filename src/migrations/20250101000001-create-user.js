'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING,
                unique: true
            },
            password_hash: {
                type: Sequelize.STRING
            },
            phone: {
                type: Sequelize.STRING
            },
            role: {
                type: Sequelize.ENUM('ADMIN', 'CUSTOMER'),
                defaultValue: 'CUSTOMER'
            },
            referral_code: {
                type: Sequelize.STRING,
                unique: true
            },
            referred_by: {
                type: Sequelize.UUID
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Users');
    }
};
