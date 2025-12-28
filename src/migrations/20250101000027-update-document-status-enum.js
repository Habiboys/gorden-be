'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // For MySQL, we can modify the column type directly to update the ENUM
        // Note: This replaces the existing column definition, so we must be inclusive of old values too
        return queryInterface.changeColumn('Documents', 'status', {
            type: Sequelize.ENUM('DRAFT', 'SENT', 'OPENED', 'PENDING', 'PAID', 'ACCEPTED', 'REJECTED', 'CANCELLED'),
            defaultValue: 'DRAFT',
            allowNull: true // Keeping it somewhat loose to avoid strict conflicts during migration if dirty data exists
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Revert to original ENUM values
        // WARNING: This might fail if there are rows with the new status values
        return queryInterface.changeColumn('Documents', 'status', {
            type: Sequelize.ENUM('DRAFT', 'SENT', 'PAID', 'CANCELLED'),
            defaultValue: 'DRAFT'
        });
    }
};
