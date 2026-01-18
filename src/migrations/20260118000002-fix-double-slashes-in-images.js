'use strict';

/**
 * Migration to fix double slashes in image paths.
 * Fixes paths like "//uploads/..." to "/uploads/..."
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            console.log('🔄 Starting migration: Fix double slashes in image paths...');

            // 1. Fix products.images
            console.log('📦 Processing products.images...');
            await queryInterface.sequelize.query(
                `UPDATE products SET images = REPLACE(images, '"//uploads/', '"/uploads/') WHERE images LIKE '%"//uploads/%'`,
                { transaction }
            );
            console.log('   ✅ Processed products');

            // 2. Fix categories.image
            console.log('📂 Processing categories.image...');
            await queryInterface.sequelize.query(
                `UPDATE categories SET image = REPLACE(image, '//uploads/', '/uploads/') WHERE image LIKE '//uploads/%'`,
                { transaction }
            );
            console.log('   ✅ Processed categories');

            // 3. Fix articles.image_url
            console.log('📰 Processing articles.image_url...');
            try {
                await queryInterface.sequelize.query(
                    `UPDATE articles SET image_url = REPLACE(image_url, '//uploads/', '/uploads/') WHERE image_url LIKE '//uploads/%'`,
                    { transaction }
                );
                console.log('   ✅ Processed articles');
            } catch (e) {
                console.log('   ⚠️ Skipped articles');
            }

            await transaction.commit();
            console.log('✅ Migration completed successfully!');

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Migration failed:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        console.log('⚠️ Down migration: No action needed.');
    }
};
