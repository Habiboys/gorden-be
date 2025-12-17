'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const userPassword = await bcrypt.hash('user123', salt);

        await queryInterface.bulkInsert('Users', [
            {
                id: '1e3a4b2c-5d6e-7f8g-9h0i-1j2k3l4m5n6o',
                name: 'Admin Amagriya',
                email: 'admin@amagriya.com',
                password_hash: adminPassword,
                phone: '081234567890',
                role: 'ADMIN',
                referral_code: 'ADMIN01',
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '2f4b5c3d-6e7f-8g9h-0i1j-2k3l4m5n6o7p',
                name: 'John Customer',
                email: 'customer@email.com',
                password_hash: userPassword,
                phone: '081298765432',
                role: 'CUSTOMER',
                referral_code: 'USER001',
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Users', null, {});
    }
};
