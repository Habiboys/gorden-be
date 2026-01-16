'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Create Badges Table
        await queryInterface.createTable('Badges', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            label: {
                type: Sequelize.STRING,
                allowNull: false
            },
            text_color: {
                type: Sequelize.STRING,
                defaultValue: '#FFFFFF'
            },
            bg_color: {
                type: Sequelize.STRING,
                defaultValue: '#EB216A'
            },
            position: {
                type: Sequelize.STRING,
                defaultValue: 'top-left' // top-left, top-right, bottom-left, bottom-right
            },
            is_system: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
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

        // 2. Create ProductBadges Table (Junction)
        await queryInterface.createTable('ProductBadges', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            product_id: {
                type: Sequelize.UUID,
                references: {
                    model: 'Products',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            badge_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Badges',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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

        // 3. Data Migration
        // Create Default Badges
        const now = new Date();
        const badges = [
            { label: 'Featured', text_color: '#FFFFFF', bg_color: '#F59E0B', is_system: true, position: 'top-left', created_at: now, updated_at: now }, // Amber
            { label: 'New Arrival', text_color: '#FFFFFF', bg_color: '#10B981', is_system: true, position: 'top-left', created_at: now, updated_at: now }, // Emerald
            { label: 'Best Seller', text_color: '#FFFFFF', bg_color: '#EB216A', is_system: true, position: 'top-left', created_at: now, updated_at: now }, // Pink
            { label: 'Garansi 1 Tahun', text_color: '#FFFFFF', bg_color: '#3B82F6', is_system: true, position: 'top-right', created_at: now, updated_at: now }, // Blue
            { label: 'Gorden Custom', text_color: '#FFFFFF', bg_color: '#8B5CF6', is_system: true, position: 'top-right', created_at: now, updated_at: now } // Purple
        ];

        await queryInterface.bulkInsert('Badges', badges);

        // Get IDs of inserted badges
        const [insertedBadges] = await queryInterface.sequelize.query('SELECT id, label FROM Badges');
        const badgeMap = {};
        insertedBadges.forEach(b => badgeMap[b.label] = b.id);

        // Get All Products
        const [products] = await queryInterface.sequelize.query('SELECT id, is_featured, is_new_arrival, is_best_seller, is_warranty, is_custom FROM Products');

        const productBadges = [];

        products.forEach(p => {
            if (p.is_featured && badgeMap['Featured']) {
                productBadges.push({ product_id: p.id, badge_id: badgeMap['Featured'], created_at: now, updated_at: now });
            }
            if (p.is_new_arrival && badgeMap['New Arrival']) {
                productBadges.push({ product_id: p.id, badge_id: badgeMap['New Arrival'], created_at: now, updated_at: now });
            }
            if (p.is_best_seller && badgeMap['Best Seller']) {
                productBadges.push({ product_id: p.id, badge_id: badgeMap['Best Seller'], created_at: now, updated_at: now });
            }
            if (p.is_warranty && badgeMap['Garansi 1 Tahun']) {
                productBadges.push({ product_id: p.id, badge_id: badgeMap['Garansi 1 Tahun'], created_at: now, updated_at: now });
            }
            if (p.is_custom && badgeMap['Gorden Custom']) {
                productBadges.push({ product_id: p.id, badge_id: badgeMap['Gorden Custom'], created_at: now, updated_at: now });
            }
        });

        if (productBadges.length > 0) {
            await queryInterface.bulkInsert('ProductBadges', productBadges);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('ProductBadges');
        await queryInterface.dropTable('Badges');
    }
};
