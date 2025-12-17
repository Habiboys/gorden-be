'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('calculator_leads', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: {
                type: Sequelize.STRING
            },
            phone: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING
            },
            calculator_type: {
                type: Sequelize.STRING
            },
            estimated_price: {
                type: Sequelize.DECIMAL(15, 2)
            },
            calculation_data: {
                type: Sequelize.JSON
            },
            status: {
                type: Sequelize.ENUM('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'),
                defaultValue: 'NEW'
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
        await queryInterface.dropTable('calculator_leads');
    }
};
