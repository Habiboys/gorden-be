'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Articles', 'tags', {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Comma separated tags'
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Articles', 'tags');
    }
};
