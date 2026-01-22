'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // Get all products that might have HTML content with images
            const products = await queryInterface.sequelize.query(
                "SELECT id, information, description FROM products WHERE information LIKE '%<img%' OR description LIKE '%<img%'",
                { type: Sequelize.QueryTypes.SELECT, transaction }
            );

            console.log(`Found ${products.length} products to check for absolute image URLs.`);

            for (const product of products) {
                let updatedInfo = product.information;
                let updatedDesc = product.description;
                let needsUpdate = false;

                // Function to strip base URL from content
                const stripBaseUrl = (content) => {
                    if (!content) return content;
                    // Regex to find src attributes with http/https followed by anything and then /uploads/
                    // We want to capture the /uploads/ part and everything after
                    // Example: src="https://api.com/uploads/img.jpg" -> src="/uploads/img.jpg"
                    // We match: src=["'](http[^"']*)(/uploads/[^"']*)["']

                    // A safer, more generic approach: replace specific known patterns logic
                    // Or simpler: replace 'http://.../uploads/' with '/uploads/' 
                    // But '...' can vary.

                    // Let's use a regex that looks for /uploads/ inside a src 
                    return content.replace(/src=["'](https?:\/\/[^"']*)(\/uploads\/[^"']*)["']/g, (match, domain, path) => {
                        return `src="${path}"`;
                    });
                };

                if (updatedInfo) {
                    const newInfo = stripBaseUrl(updatedInfo);
                    if (newInfo !== updatedInfo) {
                        updatedInfo = newInfo;
                        needsUpdate = true;
                    }
                }

                if (updatedDesc) {
                    const newDesc = stripBaseUrl(updatedDesc);
                    if (newDesc !== updatedDesc) {
                        updatedDesc = newDesc;
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    // Escape single quotes for SQL update if necessary, or use replacements
                    // Using replacements is safer
                    await queryInterface.sequelize.query(
                        'UPDATE products SET information = :info, description = :desc WHERE id = :id',
                        {
                            replacements: { info: updatedInfo, desc: updatedDesc, id: product.id },
                            transaction
                        }
                    );
                }
            }

            await transaction.commit();
            console.log('Migration completed successfully.');

        } catch (error) {
            await transaction.rollback();
            console.error('Migration failed:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Reversal is not easily possible as we lost the original domain information.
        // We would have to prepend a default domain which might be wrong, or just do nothing.
        // Given this conforms data to the new standard (relative paths), acting as a "fix",
        // a down migration that does nothing is acceptable or we could warn.
        console.log('Down migration: Cannot revert stripping of base URLs from HTML content.');
    }
};
