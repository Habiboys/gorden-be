'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Products', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            category_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Categories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name: {
                type: Sequelize.STRING
            },
            subtitle: {
                type: Sequelize.STRING
            },
            description: {
                type: Sequelize.TEXT
            },
            price: {
                type: Sequelize.DECIMAL
            },
            original_price: {
                type: Sequelize.DECIMAL
            },
            stock: {
                type: Sequelize.INTEGER
            },
            discount_percent: {
                type: Sequelize.INTEGER
            },
            price_unit: {
                type: Sequelize.STRING
            },
            images: {
                type: Sequelize.JSON
            },
            features: {
                type: Sequelize.JSON
            },
            how_to_order: {
                type: Sequelize.JSON
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'),
                defaultValue: 'ACTIVE'
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
        await queryInterface.dropTable('Products');
    }
};
