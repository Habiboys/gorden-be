'use strict';

/**
 * Migration: Convert all DECIMAL price columns to INTEGER
 * 
 * This migration converts DECIMAL columns to BIGINT (INTEGER) to remove
 * all decimal places from price values. Existing values are rounded.
 * 
 * Affected tables and columns:
 * - documents: total_amount, discount_amount
 * - products: min_width, max_width, min_length, max_length (dimensions, not price but converting for consistency)
 * - product_variants: price, price_gross, price_net (if exists)
 * - calculator_components: price
 * - calculator_leads: estimated_price
 * - calculator_types: fabric_multiplier (this is a multiplier, may want to keep decimal?)
 * - orders: total_amount
 * - order_items: unit_price, width, height, subtotal
 * - referrals: commission_amount
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Helper function to alter column with rounding
            const alterToInteger = async (table, column) => {
                // First, update existing data to rounded values
                await queryInterface.sequelize.query(
                    `UPDATE "${table}" SET "${column}" = ROUND("${column}") WHERE "${column}" IS NOT NULL`,
                    { transaction }
                );

                // Then alter the column type
                await queryInterface.changeColumn(table, column, {
                    type: Sequelize.BIGINT,
                    allowNull: true
                }, { transaction });
            };

            // documents
            await alterToInteger('documents', 'total_amount');
            await alterToInteger('documents', 'discount_amount');

            // products (dimensions - keeping as DECIMAL might be better, but user wants all integer)
            // Actually, let's skip dimensions as they are not prices
            // await alterToInteger('products', 'min_width');
            // await alterToInteger('products', 'max_width');
            // await alterToInteger('products', 'min_length');
            // await alterToInteger('products', 'max_length');

            // product_variants - price columns
            await alterToInteger('product_variants', 'price');

            // Check if price_gross and price_net exist before altering
            const variantColumns = await queryInterface.describeTable('product_variants');
            if (variantColumns.price_gross) {
                await alterToInteger('product_variants', 'price_gross');
            }
            if (variantColumns.price_net) {
                await alterToInteger('product_variants', 'price_net');
            }

            // calculator_components
            await alterToInteger('calculator_components', 'price');

            // calculator_leads
            await alterToInteger('calculator_leads', 'estimated_price');

            // calculator_types - fabric_multiplier (keeping as DECIMAL as it's a multiplier, not a price)
            // await alterToInteger('calculator_types', 'fabric_multiplier');

            // orders
            await alterToInteger('orders', 'total_amount');

            // order_items
            await alterToInteger('order_items', 'unit_price');
            await alterToInteger('order_items', 'subtotal');
            // width and height are dimensions, not prices, skip

            // referrals
            await alterToInteger('referrals', 'commission_amount');

            await transaction.commit();
            console.log('Successfully converted price columns to INTEGER');
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Revert to DECIMAL
            const revertToDecimal = async (table, column) => {
                await queryInterface.changeColumn(table, column, {
                    type: Sequelize.DECIMAL(15, 2),
                    allowNull: true
                }, { transaction });
            };

            await revertToDecimal('documents', 'total_amount');
            await revertToDecimal('documents', 'discount_amount');
            await revertToDecimal('product_variants', 'price');

            const variantColumns = await queryInterface.describeTable('product_variants');
            if (variantColumns.price_gross) {
                await revertToDecimal('product_variants', 'price_gross');
            }
            if (variantColumns.price_net) {
                await revertToDecimal('product_variants', 'price_net');
            }

            await revertToDecimal('calculator_components', 'price');
            await revertToDecimal('calculator_leads', 'estimated_price');
            await revertToDecimal('orders', 'total_amount');
            await revertToDecimal('order_items', 'unit_price');
            await revertToDecimal('order_items', 'subtotal');
            await revertToDecimal('referrals', 'commission_amount');

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
