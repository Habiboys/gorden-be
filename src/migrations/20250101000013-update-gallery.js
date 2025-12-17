'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // This migration is no longer needed as the columns were already added
        // in the updated 20250101000009-create-gallery-project.js migration
        // Keeping this as a no-op to maintain migration history
    },

    async down(queryInterface, Sequelize) {
        // No-op
    }
};
