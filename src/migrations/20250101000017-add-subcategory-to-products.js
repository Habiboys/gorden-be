'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Add subcategory_id column
        await queryInterface.addColumn('Products', 'subcategory_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'SubCategories',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // Add max_length column (optional field for certain subcategories)
        await queryInterface.addColumn('Products', 'max_length', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Products', 'subcategory_id');
        await queryInterface.removeColumn('Products', 'max_length');
    }
};
