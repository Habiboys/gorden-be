'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Categories', 'image', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Filename/Path of the category image (compressed webp)'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Categories', 'image');
    }

};
