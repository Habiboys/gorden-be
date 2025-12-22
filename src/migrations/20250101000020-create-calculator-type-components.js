'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('calculator_type_components', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            calculator_type_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'calculator_types',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            subcategory_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'subcategories',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            label: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Display label e.g. "Pilih Rel Gorden"'
            },
            is_required: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            price_calculation: {
                type: Sequelize.ENUM('per_meter', 'per_unit', 'per_10_per_meter'),
                defaultValue: 'per_meter',
                comment: 'How to calculate price: per_meter=width*price, per_unit=price, per_10_per_meter=ceil(width*10)*price'
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

        // Add index for faster queries
        await queryInterface.addIndex('calculator_type_components', ['calculator_type_id']);
        await queryInterface.addIndex('calculator_type_components', ['subcategory_id']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('calculator_type_components');
    }
};
