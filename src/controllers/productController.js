const { Product, Category, SubCategory, ProductPackage, ProductVariant, Sequelize } = require('../models');
const { Op } = Sequelize;
const { deleteImages, cleanupRemovedImages } = require('../utils/imageCleanup');

const getProducts = async (req, res) => {
    try {
        const { category, search, sort, featured, new_arrival, best_seller, limit, category_id } = req.query;
        let where = {};
        let order = [['created_at', 'DESC']];

        // Filter by category slug
        if (category) {
            const cat = await Category.findOne({ where: { slug: category } });
            if (cat) {
                where.category_id = cat.id;
            }
        }

        // Filter by category_id directly
        if (category_id) {
            where.category_id = parseInt(category_id, 10);
        }

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        // Filter by featured
        if (featured === 'true') {
            where.is_featured = true;
        }

        // Filter by new arrival
        if (new_arrival === 'true') {
            where.is_new_arrival = true;
        }

        // Filter by best seller
        if (best_seller === 'true') {
            where.is_best_seller = true;
        }

        if (sort === 'lowest') {
            // Price sorting now handled by variant minPrice, but for initial query we can sort by name or created_at
            order = [['created_at', 'ASC']];
        } else if (sort === 'highest') {
            order = [['created_at', 'DESC']];
        } else if (sort === 'latest') {
            order = [['created_at', 'DESC']]; // 'latest' typically means newest first
        }

        const queryOptions = {
            where,
            order,
            include: [
                { model: Category, attributes: ['name', 'slug'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] },
                { model: ProductVariant, as: 'variants', attributes: ['id', 'attributes', 'price_gross', 'price_net', 'satuan'] }
            ]
        };

        // Add limit if specified
        if (limit) {
            queryOptions.limit = parseInt(limit, 10);
        }

        const products = await Product.findAll(queryOptions);

        // Map products to include minPrice and maxPrice from variants
        const productsWithPrices = products.map(p => {
            const productData = p.toJSON();
            const variants = productData.variants || [];

            if (variants.length > 0) {
                // Filter variants that have at least a net price
                const validVariants = variants.filter(v => Number(v.price_net) > 0);

                if (validVariants.length > 0) {
                    // Get NET prices for determining the cheapest variant
                    const netPrices = validVariants.map(v => Number(v.price_net));
                    const minNetPrice = Math.min(...netPrices);
                    const maxNetPrice = Math.max(...netPrices);

                    // minPrice is the NET price (the actual selling price)
                    productData.minPrice = minNetPrice;
                    productData.maxPrice = maxNetPrice;

                    // Find the variant with the minimum NET price
                    const minVariant = validVariants.find(v => Number(v.price_net) === minNetPrice);

                    if (minVariant) {
                        // Set satuan from this variant
                        if (minVariant.satuan) {
                            productData.price_unit = minVariant.satuan;
                        }

                        // minPriceGross is the GROSS price of this variant (for strikethrough display)
                        if (minVariant.price_gross && Number(minVariant.price_gross) > 0) {
                            productData.minPriceGross = Number(minVariant.price_gross);
                        }
                    }
                }
            }

            return productData;
        });

        res.json({ success: true, data: productsWithPrices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [
                { model: Category, attributes: ['id', 'name', 'slug'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] },
                { model: ProductPackage }
            ]
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            category_id, subcategory_id, name, sku, subtitle, description, information,
            price, original_price, price_self_measure, price_self_measure_install, price_measure_install,
            stock, discount_percent, min_width, max_width, min_length, max_length, price_unit, images, features, how_to_order,
            is_featured, is_new_arrival, is_best_seller, is_warranty, is_custom, variant_options,
            meta_title, meta_description, meta_keywords, status
        } = req.body;

        const product = await Product.create({
            category_id, subcategory_id, name, sku, subtitle, description, information,
            price, original_price, price_self_measure, price_self_measure_install, price_measure_install,
            stock, discount_percent, min_width, max_width, min_length, max_length, price_unit, images, features, how_to_order,
            is_featured, is_new_arrival, is_best_seller, is_warranty, is_custom, variant_options,
            meta_title, meta_description, meta_keywords, status
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Cleanup removed images if images are being updated
        if (req.body.images !== undefined) {
            const oldImages = product.images;
            const newImages = req.body.images;
            const deletedCount = cleanupRemovedImages(oldImages, newImages);
            if (deletedCount > 0) {
                console.log(`🗑️ Cleaned up ${deletedCount} old image(s) for product ${product.id}`);
            }
        }

        console.log('📦 Updating product with data:', JSON.stringify(req.body, null, 2));
        await product.update(req.body);

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('❌ Error updating product:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Delete associated images from server
        if (product.images) {
            const deletedCount = deleteImages(product.images);
            if (deletedCount > 0) {
                console.log(`🗑️ Deleted ${deletedCount} image(s) for product ${product.id}`);
            }
        }

        await product.destroy();
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, slug, description, image, icon_url } = req.body;
        const category = await Category.create({ name, slug, description, image, icon_url });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating category', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Handle Image Cleanup
        if (req.body.image !== undefined && category.image && category.image !== req.body.image) {
            deleteImages(category.image); // Delete old image
        }

        // Handle Icon Cleanup (if icon_url is treated as file path)
        if (req.body.icon_url !== undefined && category.icon_url && category.icon_url !== req.body.icon_url) {
            deleteImages(category.icon_url); // Delete old icon
        }

        await category.update(req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating category', error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        await category.destroy();
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting category', error: error.message });
    }
};

const duplicateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const sourceProduct = await Product.findByPk(id, {
            include: [{ model: ProductVariant, as: 'variants' }]
        });

        if (!sourceProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Clone Product
        const productData = sourceProduct.toJSON();
        delete productData.id;
        delete productData.created_at;
        delete productData.updated_at;
        productData.name = `${productData.name} copy`;

        // Handle Slug
        if (productData.slug) {
            productData.slug = `${productData.slug}-copy-${Date.now()}`;
        }

        // Handle SKU
        if (productData.sku) {
            productData.sku = `${productData.sku}-copy-${Math.floor(Math.random() * 1000)}`;
        }

        const newProduct = await Product.create(productData);

        // Clone Variants
        const variants = sourceProduct.variants || [];

        if (variants.length > 0) {
            const variantsData = variants.map(v => {
                const vData = v.toJSON ? v.toJSON() : v;
                delete vData.id;
                delete vData.product_id;
                delete vData.created_at;
                delete vData.updated_at;

                // Ensure attributes is an object, not a string
                // This fixes the "Double Stringify" issue in duplication
                if (vData.attributes && typeof vData.attributes === 'string') {
                    try {
                        vData.attributes = JSON.parse(vData.attributes);
                    } catch (e) {
                        console.warn('Failed to parse attributes for variant during duplication', vData.attributes);
                        vData.attributes = {};
                    }
                }

                return { ...vData, product_id: newProduct.id };
            });
            await ProductVariant.bulkCreate(variantsData);
        }

        res.json({ success: true, data: newProduct });
    } catch (error) {
        console.error('Error duplicating product:', error);
        res.status(500).json({ success: false, message: 'Gagal menduplikasi produk', error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductDetail,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    createCategory,
    updateCategory,
    deleteCategory
};
