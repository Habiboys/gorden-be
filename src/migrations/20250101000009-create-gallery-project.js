'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('GalleryProjects', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            title: {
                type: Sequelize.STRING
            },
            category: {
                type: Sequelize.ENUM('RESIDENTIAL', 'APARTMENT', 'OFFICE', 'CAFE_RESTO')
            },
            installation_type: {
                type: Sequelize.STRING
            },
            location: {
                type: Sequelize.STRING
            },
            completion_date: {
                type: Sequelize.DATEONLY
            },
            image_url: {
                type: Sequelize.STRING
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('GalleryProjects');
    }
};
