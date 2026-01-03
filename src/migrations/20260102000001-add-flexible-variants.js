'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add new fields to Products table
        await queryInterface.addColumn('Products', 'is_warranty', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: true,
            comment: 'Garansi 1 Tahun'
        });

        await queryInterface.addColumn('Products', 'is_custom', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: true,
            comment: 'Gorden Custom'
        });

        // Add flexible variant fields to ProductVariants table
        await queryInterface.addColumn('ProductVariants', 'attribute_name', {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Nama atribut (e.g., Layanan, Ukuran, Warna)'
        });

        await queryInterface.addColumn('ProductVariants', 'attribute_value', {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Nilai atribut (e.g., Ukur Pasang Sendiri, Merah)'
        });

        await queryInterface.addColumn('ProductVariants', 'price_gross', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true,
            comment: 'Harga Gross'
        });

        await queryInterface.addColumn('ProductVariants', 'price_net', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true,
            comment: 'Harga Net'
        });
    },

    async down(queryInterface, Sequelize) {
        // Remove from Products
        await queryInterface.removeColumn('Products', 'is_warranty');
        await queryInterface.removeColumn('Products', 'is_custom');

        // Remove from ProductVariants
        await queryInterface.removeColumn('ProductVariants', 'attribute_name');
        await queryInterface.removeColumn('ProductVariants', 'attribute_value');
        await queryInterface.removeColumn('ProductVariants', 'price_gross');
        await queryInterface.removeColumn('ProductVariants', 'price_net');
    }
};
