'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('calculator_components', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            type: {
                type: Sequelize.ENUM('rel_gorden', 'tassel', 'hook', 'vitrase_kain', 'vitrase_rel'),
                allowNull: false
            },
            name: {
                type: Sequelize.STRING
            },
            price: {
                type: Sequelize.DECIMAL(15, 2)
            },
            image_url: {
                type: Sequelize.STRING
            },
            max_width: {
                type: Sequelize.INTEGER
            },
            description: {
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
        await queryInterface.dropTable('calculator_components');
    }
};
