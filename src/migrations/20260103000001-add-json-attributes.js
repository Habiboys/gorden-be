'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Rename table ProductVariants to product_variants
        try {
            await queryInterface.renameTable('ProductVariants', 'product_variants');
        } catch (error) {
            console.warn('Table rename failed or already done:', error.message);
        }

        // 2. Add variant_options to Products
        await queryInterface.addColumn('Products', 'variant_options', {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Definitions of available options (e.g. [{"name": "Lebar", "values": ["50", "100"]}])'
        });

        // 3. Add attributes to product_variants
        await queryInterface.addColumn('product_variants', 'attributes', {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Flexible attributes JSON (e.g. {"Lebar": "50", "Tinggi": "200"})'
        });

        // 4. Remove unused columns from product_variants
        const columnsToRemove = [
            'width', 'height', 'wave', 'sibak',
            'recommended_min_width', 'recommended_max_width', 'recommended_height',
            'attribute_name', 'attribute_value'
        ];

        for (const col of columnsToRemove) {
            try {
                await queryInterface.removeColumn('product_variants', col);
            } catch (error) {
                console.warn(`Could not remove column ${col}: ${error.message}`);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // 1. Add back removed columns
        await queryInterface.addColumn('product_variants', 'width', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'height', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'wave', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'sibak', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'recommended_min_width', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'recommended_max_width', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'recommended_height', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('product_variants', 'attribute_name', { type: Sequelize.STRING, allowNull: true });
        await queryInterface.addColumn('product_variants', 'attribute_value', { type: Sequelize.STRING, allowNull: true });

        // 2. Remove new columns
        await queryInterface.removeColumn('product_variants', 'attributes');
        await queryInterface.removeColumn('Products', 'variant_options');

        // 3. Rename table back
        await queryInterface.renameTable('product_variants', 'ProductVariants');
    }
};
