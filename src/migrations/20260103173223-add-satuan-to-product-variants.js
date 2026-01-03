'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('product_variants', 'satuan', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'm', // Default to meter if not specified
      comment: 'Satuan unit (e.g. meter, pcs, set)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('product_variants', 'satuan');
  }
};
