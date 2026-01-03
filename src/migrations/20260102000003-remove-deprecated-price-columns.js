'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Helper function to safely remove column if it exists
        const safeRemoveColumn = async (table, column) => {
            try {
                await queryInterface.removeColumn(table, column);
                console.log(`✓ Removed ${table}.${column}`);
            } catch (error) {
                console.log(`✗ Skipped ${table}.${column} (doesn't exist or error: ${error.message})`);
            }
        };

        // Remove deprecated price columns from Products table
        // These are no longer used - pricing is now per-variant
        await safeRemoveColumn('products', 'price');
        await safeRemoveColumn('products', 'original_price');
        await safeRemoveColumn('products', 'price_self_measure');
        await safeRemoveColumn('products', 'price_self_measure_install');
        await safeRemoveColumn('products', 'price_measure_install');
        await safeRemoveColumn('products', 'discount_percent');

        // Remove deprecated price column from ProductVariants table
        // We now use price_gross and price_net instead
        await safeRemoveColumn('productvariants', 'price');
    },

    async down(queryInterface, Sequelize) {
        // Restore Product price columns
        await queryInterface.addColumn('products', 'price', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        });
        await queryInterface.addColumn('products', 'original_price', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        });
        await queryInterface.addColumn('products', 'price_self_measure', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        });
        await queryInterface.addColumn('products', 'price_self_measure_install', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        });
        await queryInterface.addColumn('products', 'price_measure_install', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        });
        await queryInterface.addColumn('products', 'discount_percent', {
            type: Sequelize.INTEGER,
            allowNull: true
        });

        // Restore ProductVariant price column
        await queryInterface.addColumn('productvariants', 'price', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        });
    }
};
