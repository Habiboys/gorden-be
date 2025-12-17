'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Articles
        await queryInterface.createTable('Articles', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            title: { type: Sequelize.STRING, allowNull: false },
            slug: { type: Sequelize.STRING, unique: true },
            excerpt: { type: Sequelize.TEXT },
            content: { type: Sequelize.TEXT },
            category: { type: Sequelize.STRING },
            author: { type: Sequelize.STRING },
            image_url: { type: Sequelize.STRING },
            is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
            status: { type: Sequelize.ENUM('DRAFT', 'PUBLISHED'), defaultValue: 'DRAFT' },
            view_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // Calculator Leads
        await queryInterface.createTable('CalculatorLeads', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: { type: Sequelize.STRING },
            phone: { type: Sequelize.STRING },
            email: { type: Sequelize.STRING },
            calculator_type: { type: Sequelize.STRING },
            estimated_price: { type: Sequelize.DECIMAL },
            calculation_data: { type: Sequelize.JSON },
            status: { type: Sequelize.ENUM('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'), defaultValue: 'NEW' },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // Documents
        await queryInterface.createTable('Documents', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            type: { type: Sequelize.ENUM('QUOTATION', 'INVOICE'), allowNull: false },
            document_number: { type: Sequelize.STRING },
            customer_name: { type: Sequelize.STRING },
            customer_email: { type: Sequelize.STRING },
            customer_phone: { type: Sequelize.STRING },
            address: { type: Sequelize.TEXT },
            total_amount: { type: Sequelize.DECIMAL },
            discount_amount: { type: Sequelize.DECIMAL },
            data: { type: Sequelize.JSON }, // Line items etc
            status: { type: Sequelize.ENUM('DRAFT', 'SENT', 'PAID', 'CANCELLED'), defaultValue: 'DRAFT' },
            referral_code: { type: Sequelize.STRING },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // Services
        await queryInterface.createTable('Services', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            title: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.TEXT },
            icon: { type: Sequelize.STRING },
            image_url: { type: Sequelize.STRING },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // Faqs
        await queryInterface.createTable('Faqs', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            question: { type: Sequelize.TEXT, allowNull: false },
            answer: { type: Sequelize.TEXT, allowNull: false },
            category: { type: Sequelize.STRING },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });

        // Contacts
        await queryInterface.createTable('Contacts', {
            id: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4
            },
            name: { type: Sequelize.STRING },
            email: { type: Sequelize.STRING },
            phone: { type: Sequelize.STRING },
            message: { type: Sequelize.TEXT },
            status: { type: Sequelize.ENUM('NEW', 'READ', 'RESPONDED'), defaultValue: 'NEW' },
            created_at: { allowNull: false, type: Sequelize.DATE },
            updated_at: { allowNull: false, type: Sequelize.DATE }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Contacts');
        await queryInterface.dropTable('Faqs');
        await queryInterface.dropTable('Services');
        await queryInterface.dropTable('Documents');
        await queryInterface.dropTable('CalculatorLeads');
        await queryInterface.dropTable('Articles');
    }
};
