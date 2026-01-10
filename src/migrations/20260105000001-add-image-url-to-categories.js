'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDescription = await queryInterface.describeTable('Categories');
        if (!tableDescription.image) {
            await queryInterface.addColumn('Categories', 'image', {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Filename/Path of the category image (compressed webp)'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableDescription = await queryInterface.describeTable('Categories');
        if (tableDescription.image) {
            await queryInterface.removeColumn('Categories', 'image');
        }
    }
};
