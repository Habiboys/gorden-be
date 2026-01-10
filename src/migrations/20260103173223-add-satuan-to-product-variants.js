'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists before adding
    const tableDescription = await queryInterface.describeTable('product_variants');
    if (!tableDescription.satuan) {
      await queryInterface.addColumn('product_variants', 'satuan', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'm', // Default to meter if not specified
        comment: 'Satuan unit (e.g. meter, pcs, set)'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('product_variants');
    if (tableDescription.satuan) {
      await queryInterface.removeColumn('product_variants', 'satuan');
    }
  }
};
