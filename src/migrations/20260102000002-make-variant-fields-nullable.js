'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Make width, height, and price nullable for flexible variant system
        await queryInterface.changeColumn('ProductVariants', 'width', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Lebar (cm) - optional for flexible variants'
        });

        await queryInterface.changeColumn('ProductVariants', 'height', {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Tinggi (cm) - optional for flexible variants'
        });

        await queryInterface.changeColumn('ProductVariants', 'price', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true,
            comment: 'Harga varian - optional if using price_gross/price_net'
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert to NOT NULL (may fail if existing data has nulls)
        await queryInterface.changeColumn('ProductVariants', 'width', {
            type: Sequelize.INTEGER,
            allowNull: false
        });

        await queryInterface.changeColumn('ProductVariants', 'height', {
            type: Sequelize.INTEGER,
            allowNull: false
        });

        await queryInterface.changeColumn('ProductVariants', 'price', {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false
        });
    }
};
