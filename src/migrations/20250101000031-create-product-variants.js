'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ProductVariants', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            product_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            width: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Lebar (cm)'
            },
            wave: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Gelombang'
            },
            height: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Tinggi (cm)'
            },
            sibak: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
                comment: '1 = single, 2 = pair, etc'
            },
            price: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                comment: 'Harga varian'
            },
            recommended_min_width: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Min lebar cocok (cm)'
            },
            recommended_max_width: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Max lebar cocok (cm)'
            },
            recommended_height: {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'Tinggi cocok (cm)'
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add index for faster lookups
        await queryInterface.addIndex('ProductVariants', ['product_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('ProductVariants');
    }
};
