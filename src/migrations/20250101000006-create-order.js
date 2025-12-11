'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Orders', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            user_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            customer_name: {
                type: Sequelize.STRING
            },
            customer_email: {
                type: Sequelize.STRING
            },
            customer_phone: {
                type: Sequelize.STRING
            },
            shipping_address: {
                type: Sequelize.TEXT
            },
            total_amount: {
                type: Sequelize.DECIMAL
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
                defaultValue: 'PENDING'
            },
            payment_status: {
                type: Sequelize.ENUM('UNPAID', 'PAID', 'REFUNDED'),
                defaultValue: 'UNPAID'
            },
            notes: {
                type: Sequelize.TEXT
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
        await queryInterface.dropTable('Orders');
    }
};
