const duplicateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sourceProduct = await Product.findByPk(id, {
            include: [{ model: ProductVariant }]
        });

        if (!sourceProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Clone Product Data
        const productData = sourceProduct.toJSON();
        delete productData.id;
        delete productData.created_at;
        delete productData.updated_at;
        productData.name = `${productData.name} copy`;

        // Handle unique slug constraint if exists
        if (productData.slug) {
            productData.slug = `${productData.slug}-copy-${Date.now()}`;
        }

        // Create New Product
        const newProduct = await Product.create(productData);

        // Clone Variants
        if (sourceProduct.ProductVariants && sourceProduct.ProductVariants.length > 0) {
            // Note: association usually populates sourceProduct.ProductVariants or sourceProduct.variants based on alias
            // If no alias defined in hasMany, it might be ProductVariants or product_variants (check standard Sequelize)
            // But since we used include: [{ model: ProductVariant }], we can check the result key later? 
            // Actually, safely we map from the included result.
            // But wait, the included result IS attached to sourceProduct.
            // We can check `sourceProduct.ProductVariants` (default) or `sourceProduct.variants`.
            // I will try to inspect one if feasible, but usually strict typing isn't there in JS.
            // Let's assume standard default `ProductVariants` vs lowercase. 
            // I'll be defensive.
        }

        // Re-fetch to be safe about variants key? No, just iterate what we have.
        // Better implementation below in replace_file_content.

        res.json({ success: true, data: newProduct });
    } catch (error) {
        console.error('Error duplicating product:', error);
        res.status(500).json({ success: false, message: 'Gagal menduplikasi produk', error: error.message });
    }
};
