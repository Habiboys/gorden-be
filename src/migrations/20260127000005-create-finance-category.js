'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('finance_categories', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            type: {
                type: Sequelize.ENUM('INCOME', 'EXPENSE'),
                allowNull: false
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

        // Seed some initial data
        await queryInterface.bulkInsert('finance_categories', [
            {
                id: '10000000-0000-0000-0000-000000000001',
                name: 'Pemasukan dari Owner',
                type: 'INCOME',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '10000000-0000-0000-0000-000000000002',
                name: 'Penjualan Produk',
                type: 'INCOME',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '10000000-0000-0000-0000-000000000003',
                name: 'Operasional Toko',
                type: 'EXPENSE',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '10000000-0000-0000-0000-000000000004',
                name: 'Gaji Karyawan',
                type: 'EXPENSE',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '10000000-0000-0000-0000-000000000005',
                name: 'Listrik & Air',
                type: 'EXPENSE',
                created_at: new Date(),
                updated_at: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('finance_categories');
    }
};
