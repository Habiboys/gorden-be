'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('OrderItems', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            order_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'Orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            product_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            product_name: {
                type: Sequelize.STRING
            },
            quantity: {
                type: Sequelize.INTEGER
            },
            unit_price: {
                type: Sequelize.DECIMAL
            },
            width: {
                type: Sequelize.DECIMAL
            },
            height: {
                type: Sequelize.DECIMAL
            },
            subtotal: {
                type: Sequelize.DECIMAL
            },
            package_variant: {
                type: Sequelize.STRING
            },
            components_snapshot: {
                type: Sequelize.JSON
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
        await queryInterface.dropTable('OrderItems');
    }
};
