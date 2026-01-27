const { Product, Category, SubCategory, ProductPackage, ProductVariant, Badge, ProductBadge, Sequelize } = require('../models');
const { Op } = Sequelize;
const { deleteImages, cleanupRemovedImages } = require('../utils/imageCleanup');

// ================== SKU VALIDATION ==================
// SKU must be: lowercase, no spaces, only alphanumeric and dashes
const validateSku = (sku) => {
    if (!sku) return { valid: true }; // SKU is optional

    // Check for uppercase letters
    if (sku !== sku.toLowerCase()) {
        return { valid: false, message: 'SKU harus huruf kecil semua (lowercase)' };
    }

    // Check for spaces
    if (/\s/.test(sku)) {
        return { valid: false, message: 'SKU tidak boleh mengandung spasi' };
    }

    // Check for valid characters: only lowercase letters, numbers, and dashes
    if (!/^[a-z0-9-]+$/.test(sku)) {
        return { valid: false, message: 'SKU hanya boleh mengandung huruf kecil, angka, dan strip (-)' };
    }

    return { valid: true };
};

// Auto-format SKU to be valid
const formatSku = (sku) => {
    if (!sku) return sku;
    return sku
        .toLowerCase()           // Convert to lowercase
        .replace(/\s+/g, '-')    // Replace spaces with dashes
        .replace(/[^a-z0-9-]/g, '') // Remove special characters
        .replace(/-+/g, '-')     // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '');  // Remove leading/trailing dashes
};

const getProducts = async (req, res) => {
    try {
        const { category, subcategory, search, sort, featured, new_arrival, best_seller, limit, category_id, subcategory_id, page = 1, badge_id, badge_ids } = req.query;
        let where = {};
        let order = [['created_at', 'DESC']];

        // Filter by category slug
        if (category && category !== 'all') {
            const cat = await Category.findOne({ where: { slug: category } });
            if (cat) {
                where.category_id = cat.id;
            }
        }

        // Filter by category_id directly
        if (category_id && category_id !== 'all') {
            where.category_id = parseInt(category_id, 10);
        }

        // Filter by subcategory slug
        if (subcategory && subcategory !== 'all') {
            const sub = await SubCategory.findOne({ where: { slug: subcategory } });
            if (sub) {
                where.subcategory_id = sub.id;
            }
        }

        // Filter by subcategory_id directly
        if (subcategory_id && subcategory_id !== 'all') {
            where.subcategory_id = parseInt(subcategory_id, 10);
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
            order = [['created_at', 'ASC']];
        } else if (sort === 'highest') {
            order = [['created_at', 'DESC']];
        } else if (sort === 'latest') {
            order = [['created_at', 'DESC']];
        } else if (sort === 'random') {
            const seed = req.query.seed ? parseInt(req.query.seed, 10) : null;
            if (seed) {
                order = [Sequelize.fn('RAND', seed)];
            } else {
                order = [Sequelize.fn('RAND')];
            }
        }

        // Pagination
        const limitVal = parseInt(limit, 10) || 12; // Default limit 12 per page
        const pageVal = parseInt(page, 10) || 1;
        const offset = (pageVal - 1) * limitVal;

        // Build badge include options - always include badges for display
        const badgeInclude = { model: Badge, as: 'badges', required: false };

        // Parse badge filter - support single badge_id or comma-separated badge_ids
        let badgeFilterIds = [];
        if (badge_id) {
            badgeFilterIds = [parseInt(badge_id, 10)];
        } else if (badge_ids) {
            badgeFilterIds = badge_ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        }

        console.log('🏷️ Badge filter params:', { badge_id, badge_ids, parsedIds: badgeFilterIds });

        // If badge filter is set, add a WHERE clause to filter products that have any of the selected badges
        // Using a subquery on the junction table for reliable many-to-many filtering
        if (badgeFilterIds.length > 0) {
            // Find product IDs that have any of the selected badges
            const productIdsWithBadges = await ProductBadge.findAll({
                where: { badge_id: { [Op.in]: badgeFilterIds } },
                attributes: ['product_id'],
                raw: true
            });
            const productIds = productIdsWithBadges.map(pb => pb.product_id);
            console.log('🏷️ Products with selected badges:', productIds.length);

            // Add to the main where clause
            where.id = { [Op.in]: productIds };
        }

        const queryOptions = {
            where,
            order,
            limit: limitVal,
            offset: offset,
            distinct: true, // Important for correct count with includes
            // Optimize payload: Exclude heavy TEXT/JSON fields not needed for listing
            attributes: [
                'id', 'category_id', 'subcategory_id', 'name', 'sku',
                'price_unit', 'stock', 'images',
                'is_featured', 'is_new_arrival', 'is_best_seller',
                'is_warranty', 'is_custom', 'status', 'created_at'
            ],
            include: [
                { model: Category, attributes: ['name', 'slug'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] },
                { model: ProductVariant, as: 'variants', attributes: ['id', 'attributes', 'price_gross', 'price_net', 'satuan'] },
                badgeInclude
            ]
        };

        const { count, rows: products } = await Product.findAndCountAll(queryOptions);

        // Map products logic (same as before)
        const productsWithPrices = products.map(p => {
            const productData = p.toJSON();
            const variants = productData.variants || [];

            if (variants.length > 0) {
                const validVariants = variants.filter(v => Number(v.price_net) > 0);
                if (validVariants.length > 0) {
                    const netPrices = validVariants.map(v => Number(v.price_net));
                    const minNetPrice = Math.min(...netPrices);
                    const maxNetPrice = Math.max(...netPrices);

                    productData.minPrice = minNetPrice;
                    productData.maxPrice = maxNetPrice;

                    const minVariant = validVariants.find(v => Number(v.price_net) === minNetPrice);
                    if (minVariant) {
                        if (minVariant.satuan) {
                            productData.price_unit = minVariant.satuan;
                        }
                        if (minVariant.price_gross && Number(minVariant.price_gross) > 0) {
                            productData.minPriceGross = Number(minVariant.price_gross);
                        }
                    }

                    // Calculate Dimensions Range (Width/Height)
                    const tempWidths = [];
                    const tempHeights = [];

                    validVariants.forEach(v => {
                        let attrs = v.attributes;
                        if (typeof attrs === 'string') {
                            try { attrs = JSON.parse(attrs); } catch (e) { attrs = {}; }
                        } else if (!attrs) {
                            attrs = {};
                        }

                        Object.keys(attrs).forEach(key => {
                            const k = key.toLowerCase();
                            // Extract numeric value from strings like "L 120" or "T 200" or plain "120"
                            const rawVal = String(attrs[key]);
                            const numericMatch = rawVal.match(/[\d.]+/);
                            const val = numericMatch ? parseFloat(numericMatch[0]) : NaN;
                            if (!isNaN(val)) {
                                if (['lebar', 'width', 'l'].includes(k)) tempWidths.push(val);
                                if (['tinggi', 'height', 't'].includes(k)) tempHeights.push(val);
                            }
                        });
                    });

                    if (tempWidths.length > 0) {
                        productData.variantMinWidth = Math.min(...tempWidths);
                        productData.variantMaxWidth = Math.max(...tempWidths);
                    }
                    if (tempHeights.length > 0) {
                        productData.variantMinHeight = Math.min(...tempHeights);
                        productData.variantMaxHeight = Math.max(...tempHeights);
                    }
                }
            }
            return productData;
        });

        res.json({
            success: true,
            data: productsWithPrices,
            meta: {
                total: count,
                page: pageVal,
                totalPages: Math.ceil(count / limitVal),
                limit: limitVal
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getProductDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if id is a UUID (contains dashes and is 36 chars) or SKU
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const whereClause = isUUID ? { id } : { sku: id };

        const product = await Product.findOne({
            where: whereClause,
            include: [
                { model: Category, attributes: ['id', 'name', 'slug'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] },
                { model: SubCategory, attributes: ['id', 'name', 'slug', 'has_max_length'] },
                { model: ProductPackage },
                { model: Badge, as: 'badges', required: false }
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

        // Auto-format and validate SKU
        let formattedSku = sku ? formatSku(sku) : undefined;

        if (formattedSku) {
            const skuValidation = validateSku(formattedSku);
            if (!skuValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: skuValidation.message,
                    field: 'sku'
                });
            }

            // Check for duplicate SKU
            const existingProduct = await Product.findOne({ where: { sku: formattedSku } });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: `SKU "${formattedSku}" sudah digunakan oleh produk lain`,
                    field: 'sku'
                });
            }
        }

        const product = await Product.create({
            category_id, subcategory_id, name, sku: formattedSku, subtitle, description, information,
            price, original_price, price_self_measure, price_self_measure_install, price_measure_install,
            stock, discount_percent, min_width, max_width, min_length, max_length, price_unit, images, features, how_to_order,
            is_featured, is_new_arrival, is_best_seller, is_warranty, is_custom, variant_options,
            meta_title, meta_description, meta_keywords, status
        });

        if (req.body.badgeIds && Array.isArray(req.body.badgeIds)) {
            await product.setBadges(req.body.badgeIds);
        }

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        // Handle unique constraint violation
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: `SKU sudah digunakan oleh produk lain`,
                field: 'sku'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Gagal membuat produk',
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

        // Auto-format and validate SKU (if being updated)
        if (req.body.sku !== undefined) {
            const formattedSku = formatSku(req.body.sku);

            if (formattedSku) {
                const skuValidation = validateSku(formattedSku);
                if (!skuValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: skuValidation.message,
                        field: 'sku'
                    });
                }

                // Check for duplicate SKU (if different from current)
                if (formattedSku !== product.sku) {
                    const existingProduct = await Product.findOne({ where: { sku: formattedSku } });
                    if (existingProduct && existingProduct.id !== product.id) {
                        return res.status(400).json({
                            success: false,
                            message: `SKU "${formattedSku}" sudah digunakan oleh produk lain`,
                            field: 'sku'
                        });
                    }
                }

                // Update req.body with formatted SKU
                req.body.sku = formattedSku;
            }
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

        if (req.body.badgeIds && Array.isArray(req.body.badgeIds)) {
            await product.setBadges(req.body.badgeIds);
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('❌ Error updating product:', error);
        // Handle unique constraint violation
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: `SKU sudah digunakan oleh produk lain`,
                field: 'sku'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate produk',
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
