'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Modify column to include 'FINANCE'
        // Note: In MySQL, we usually redefine the column.
        // However, Sequelize doesn't support changing ENUM values easily across all dialects.
        // For MySQL:
        await queryInterface.changeColumn('Users', 'role', {
            type: Sequelize.ENUM('ADMIN', 'CUSTOMER', 'FINANCE'),
            allowNull: false,
            defaultValue: 'CUSTOMER'
        });
    },
    async down(queryInterface, Sequelize) {
        // Revert back to original ENUM
        // Warning: Convert 'FINANCE' users to 'CUSTOMER' or handle data loss before this?
        await queryInterface.changeColumn('Users', 'role', {
            type: Sequelize.ENUM('ADMIN', 'CUSTOMER'),
            allowNull: false,
            defaultValue: 'CUSTOMER'
        });
    }
};
