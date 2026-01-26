'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('finance_transactions', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            store_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Stores',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'NO ACTION' // Keep history if user is deleted? or set null?
            },
            type: {
                type: Sequelize.ENUM('INCOME', 'EXPENSE'),
                allowNull: false
            },
            category: {
                type: Sequelize.STRING,
                allowNull: true
            },
            amount: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT
            },
            transaction_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            balance_after: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true
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

        // Add index for faster queries by store and date
        await queryInterface.addIndex('finance_transactions', ['store_id', 'transaction_date']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('finance_transactions');
    }
};
