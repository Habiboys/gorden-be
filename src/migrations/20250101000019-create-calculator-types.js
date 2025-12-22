'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('calculator_types', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            slug: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            description: {
                type: Sequelize.TEXT
            },
            has_item_type: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                comment: 'Show Jendela/Pintu selector'
            },
            has_package_type: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                comment: 'Show Gorden Saja/Lengkap selector'
            },
            fabric_multiplier: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 2.5,
                comment: 'Fabric calculation multiplier'
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            display_order: {
                type: Sequelize.INTEGER,
                defaultValue: 0
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

        // Seed default calculator types
        await queryInterface.bulkInsert('calculator_types', [
            {
                name: 'Smokering',
                slug: 'smokering',
                description: 'Kalkulator untuk gorden jenis smokering dengan lipit 2.5x',
                has_item_type: true,
                has_package_type: true,
                fabric_multiplier: 2.5,
                is_active: true,
                display_order: 1,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Kupu-kupu',
                slug: 'kupu-kupu',
                description: 'Kalkulator untuk gorden jenis kupu-kupu dengan panel',
                has_item_type: true,
                has_package_type: true,
                fabric_multiplier: 2.0,
                is_active: true,
                display_order: 2,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                name: 'Blind',
                slug: 'blind',
                description: 'Kalkulator untuk blind/roller blind',
                has_item_type: false,
                has_package_type: false,
                fabric_multiplier: 1.0,
                is_active: true,
                display_order: 3,
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('calculator_types');
    }
};
