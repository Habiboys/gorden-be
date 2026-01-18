'use strict';

/**
 * Migration to strip base URLs from image paths in the database.
 * This ensures images are stored as relative paths (e.g., /uploads/...) 
 * instead of full URLs, making the system domain-agnostic.
 */

const BASE_URLS_TO_STRIP = [
    'https://apigorden.oblixpilates.com',
    'http://apigorden.oblixpilates.com',
    'http://localhost:3000',
    'http://localhost:5000',
];

/**
 * Strip base URL from a single URL string
 * Also normalizes double slashes to single slashes
 */
function stripBaseUrl(url) {
    if (!url || typeof url !== 'string') return url;

    let result = url;

    for (const baseUrl of BASE_URLS_TO_STRIP) {
        if (result.startsWith(baseUrl)) {
            result = result.replace(baseUrl, '');
            break;
        }
    }

    // Fix double slashes (e.g., "//uploads/" -> "/uploads/")
    result = result.replace(/^\/\/+/, '/');

    return result;
}

/**
 * Process JSON array of URLs (for products.images, gallery_projects.images)
 */
function processJsonImages(jsonData) {
    if (!jsonData) return jsonData;

    let images;

    // Parse if string
    if (typeof jsonData === 'string') {
        try {
            images = JSON.parse(jsonData);
        } catch (e) {
            // Single URL string
            return stripBaseUrl(jsonData);
        }
    } else {
        images = jsonData;
    }

    // Process array
    if (Array.isArray(images)) {
        return JSON.stringify(images.map(img => stripBaseUrl(img)));
    }

    return jsonData;
}

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            console.log('🔄 Starting migration: Strip base URLs from image paths...');

            // 1. Update products.images (JSON array)
            console.log('📦 Processing products.images...');
            const [products] = await queryInterface.sequelize.query(
                'SELECT id, images FROM products WHERE images IS NOT NULL',
                { transaction }
            );

            for (const product of products) {
                const newImages = processJsonImages(product.images);
                if (newImages !== product.images) {
                    await queryInterface.sequelize.query(
                        'UPDATE products SET images = :images WHERE id = :id',
                        { replacements: { images: newImages, id: product.id }, transaction }
                    );
                }
            }
            console.log(`   ✅ Processed ${products.length} products`);

            // 2. Update categories.image (single string)
            console.log('📂 Processing categories.image...');
            const [categories] = await queryInterface.sequelize.query(
                'SELECT id, image FROM categories WHERE image IS NOT NULL',
                { transaction }
            );

            for (const category of categories) {
                const newImage = stripBaseUrl(category.image);
                if (newImage !== category.image) {
                    await queryInterface.sequelize.query(
                        'UPDATE categories SET image = :image WHERE id = :id',
                        { replacements: { image: newImage, id: category.id }, transaction }
                    );
                }
            }
            console.log(`   ✅ Processed ${categories.length} categories`);

            // 3. Update subcategories.image (single string) - if column exists
            console.log('📁 Processing subcategories.image...');
            try {
                const [subcategories] = await queryInterface.sequelize.query(
                    'SELECT id, image FROM subcategories WHERE image IS NOT NULL',
                    { transaction }
                );

                for (const subcategory of subcategories) {
                    const newImage = stripBaseUrl(subcategory.image);
                    if (newImage !== subcategory.image) {
                        await queryInterface.sequelize.query(
                            'UPDATE subcategories SET image = :image WHERE id = :id',
                            { replacements: { image: newImage, id: subcategory.id }, transaction }
                        );
                    }
                }
                console.log(`   ✅ Processed ${subcategories.length} subcategories`);
            } catch (e) {
                console.log('   ⚠️ subcategories.image column not found, skipping...');
            }

            // 4. Update articles.image_url (single string)
            console.log('📰 Processing articles.image_url...');
            try {
                const [articles] = await queryInterface.sequelize.query(
                    'SELECT id, image_url FROM articles WHERE image_url IS NOT NULL',
                    { transaction }
                );

                for (const article of articles) {
                    const newImage = stripBaseUrl(article.image_url);
                    if (newImage !== article.image_url) {
                        await queryInterface.sequelize.query(
                            'UPDATE articles SET image_url = :image WHERE id = :id',
                            { replacements: { image: newImage, id: article.id }, transaction }
                        );
                    }
                }
                console.log(`   ✅ Processed ${articles.length} articles`);
            } catch (e) {
                console.log('   ⚠️ articles.image_url column not found, skipping...');
            }

            // 5. Update gallery_projects.images (JSON array)
            console.log('🖼️ Processing gallery_projects.images...');
            try {
                const [galleryProjects] = await queryInterface.sequelize.query(
                    'SELECT id, images FROM gallery_projects WHERE images IS NOT NULL',
                    { transaction }
                );

                for (const project of galleryProjects) {
                    const newImages = processJsonImages(project.images);
                    if (newImages !== project.images) {
                        await queryInterface.sequelize.query(
                            'UPDATE gallery_projects SET images = :images WHERE id = :id',
                            { replacements: { images: newImages, id: project.id }, transaction }
                        );
                    }
                }
                console.log(`   ✅ Processed ${galleryProjects.length} gallery projects`);
            } catch (e) {
                console.log('   ⚠️ gallery_projects.images column not found, skipping...');
            }

            // 6. Update site_settings (for logo and other image settings)
            console.log('⚙️ Processing site_settings...');
            try {
                const [settings] = await queryInterface.sequelize.query(
                    `SELECT id, \`key\`, value FROM site_settings WHERE \`key\` IN ('siteLogo', 'logo', 'favicon')`,
                    { transaction }
                );

                for (const setting of settings) {
                    const newValue = stripBaseUrl(setting.value);
                    if (newValue !== setting.value) {
                        await queryInterface.sequelize.query(
                            'UPDATE site_settings SET value = :value WHERE id = :id',
                            { replacements: { value: newValue, id: setting.id }, transaction }
                        );
                    }
                }
                console.log(`   ✅ Processed ${settings.length} site settings`);
            } catch (e) {
                console.log('   ⚠️ site_settings table not found, skipping...');
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
        // This migration is not easily reversible as we don't know what the original base URL was.
        // The data remains valid (relative paths work), so we just log a warning.
        console.log('⚠️ Down migration: No action taken. Relative paths are still valid.');
    }
};
