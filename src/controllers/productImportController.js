const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const { Product, ProductVariant, Category, SubCategory, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate and download Products template Excel with dropdown validations using ExcelJS
 */
const downloadProductTemplate = async (req, res) => {
    try {
        // Fetch categories and subcategories for dropdown
        const categories = await Category.findAll({ attributes: ['id', 'name'] });
        const subcategories = await SubCategory.findAll({
            attributes: ['id', 'name', 'category_id'],
            include: [{ model: Category, attributes: ['name'] }]
        });

        const categoryNames = categories.map(c => c.name);
        const subcategoryNames = subcategories.map(s => s.name);

        // Create workbook with ExcelJS
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Amagriya Gorden';
        workbook.created = new Date();

        // Main Products sheet
        const worksheet = workbook.addWorksheet('Products');

        // Define columns
        worksheet.columns = [
            { header: 'name', key: 'name', width: 35 },
            { header: 'sku', key: 'sku', width: 20 },
            { header: 'category_name', key: 'category_name', width: 20 },
            { header: 'subcategory_name', key: 'subcategory_name', width: 25 },
            { header: 'deskripsi_singkat', key: 'deskripsi_singkat', width: 35 },
            { header: 'deskripsi_lengkap', key: 'deskripsi_lengkap', width: 50 },
            { header: 'status', key: 'status', width: 12 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add sample data rows with real categories
        worksheet.addRow({
            name: 'Contoh Produk 1',
            sku: 'PRD-001',
            category_name: categoryNames[0] || '',
            subcategory_name: subcategoryNames[0] || '',
            deskripsi_singkat: 'Deskripsi singkat produk',
            deskripsi_lengkap: 'Deskripsi lengkap produk contoh dengan detail lebih banyak',
            status: 'ACTIVE'
        });
        worksheet.addRow({
            name: 'Contoh Produk 2',
            sku: 'PRD-002',
            category_name: categoryNames.length > 1 ? categoryNames[1] : categoryNames[0] || '',
            subcategory_name: subcategoryNames.length > 1 ? subcategoryNames[1] : '',
            deskripsi_singkat: 'Deskripsi singkat produk kedua',
            deskripsi_lengkap: 'Deskripsi lengkap produk contoh kedua',
            status: 'ACTIVE'
        });

        // Add data validation (dropdown) for category_name column (C2:C1000)
        if (categoryNames.length > 0) {
            for (let row = 2; row <= 100; row++) {
                worksheet.getCell(`C${row}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`"${categoryNames.join(',')}"`],
                    showErrorMessage: true,
                    errorTitle: 'Kategori tidak valid',
                    error: 'Pilih kategori dari dropdown'
                };
            }
        }

        // Add data validation for subcategory_name column (D2:D1000)
        if (subcategoryNames.length > 0) {
            for (let row = 2; row <= 100; row++) {
                worksheet.getCell(`D${row}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`"${subcategoryNames.join(',')}"`],
                    showErrorMessage: true,
                    errorTitle: 'Sub-kategori tidak valid',
                    error: 'Pilih sub-kategori dari dropdown'
                };
            }
        }

        // Add data validation for status column (F2:F1000)
        for (let row = 2; row <= 100; row++) {
            worksheet.getCell(`F${row}`).dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['"ACTIVE,INACTIVE"'],
                showErrorMessage: true,
                errorTitle: 'Status tidak valid',
                error: 'Pilih ACTIVE atau INACTIVE'
            };
        }

        // Add Reference sheet
        const refSheet = workbook.addWorksheet('Referensi');
        refSheet.columns = [
            { header: 'KATEGORI', key: 'category', width: 25 },
            { header: 'SUB-KATEGORI', key: 'subcategory', width: 30 },
            { header: 'PARENT KATEGORI', key: 'parent', width: 20 },
        ];
        refSheet.getRow(1).font = { bold: true };

        // Add categories
        categories.forEach(c => {
            refSheet.addRow({ category: c.name, subcategory: '', parent: '' });
        });
        // Add empty row
        refSheet.addRow({ category: '', subcategory: '', parent: '' });
        // Add subcategories with their parent
        subcategories.forEach(s => {
            refSheet.addRow({ category: '', subcategory: s.name, parent: s.Category?.name || '' });
        });

        // Generate buffer and send
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating product template:', error);
        res.status(500).json({ success: false, message: 'Failed to generate template', error: error.message });
    }
};

/**
 * Generate and download Variants template Excel
 */
const downloadVariantTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();

        const templateData = [
            ['product_sku', 'lebar', 'tinggi', 'sibak', 'price_gross', 'price_net', 'satuan', 'quantity_multiplier'],
            ['GRD-BLK-001', '100', '200', '2', '150000', '120000', 'm', '2'],
            ['GRD-BLK-001', '100', '210', '2', '155000', '125000', 'm', '2'],
            ['GRD-BLK-001', '100', '220', '3', '180000', '145000', 'm', '3'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // product_sku
            { wch: 10 }, // lebar
            { wch: 10 }, // tinggi
            { wch: 10 }, // sibak
            { wch: 15 }, // price_gross
            { wch: 15 }, // price_net
            { wch: 10 }, // satuan
            { wch: 20 }, // quantity_multiplier
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Variants');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=variants_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating variant template:', error);
        res.status(500).json({ success: false, message: 'Failed to generate template', error: error.message });
    }
};

/**
 * Import Products from Excel file
 */
const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        // Fetch all categories and subcategories for lookup
        const categories = await Category.findAll();
        const subcategories = await SubCategory.findAll();

        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name.toLowerCase()] = c.id;
        });

        const subcategoryMap = {};
        subcategories.forEach(s => {
            subcategoryMap[s.name.toLowerCase()] = s.id;
        });

        const results = {
            success: [],
            errors: [],
            skipped: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // Excel row number (1-indexed + header)

            try {
                // Validate required fields
                if (!row.name || !row.sku) {
                    results.errors.push({ row: rowNum, message: 'Missing required fields (name, sku)', data: row });
                    continue;
                }

                // Auto-format SKU: lowercase, no spaces, only alphanumeric and dashes
                const formatSku = (sku) => {
                    if (!sku) return sku;
                    return String(sku)
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                };

                const formattedSku = formatSku(row.sku);

                // Validate formatted SKU
                if (!formattedSku || !/^[a-z0-9-]+$/.test(formattedSku)) {
                    results.errors.push({
                        row: rowNum,
                        message: `SKU "${row.sku}" tidak valid. SKU hanya boleh huruf kecil, angka, dan strip (-)`,
                        data: row
                    });
                    continue;
                }

                // Check for duplicate SKU
                const existingProduct = await Product.findOne({ where: { sku: formattedSku } });
                if (existingProduct) {
                    results.skipped.push({ row: rowNum, message: `SKU "${formattedSku}" sudah ada`, data: row });
                    continue;
                }

                // Lookup category and subcategory
                const categoryId = row.category_name ? categoryMap[row.category_name.toLowerCase()] : null;
                let subcategoryId = null;

                // Validate subcategory if provided
                if (row.subcategory_name) {
                    const subcatKey = row.subcategory_name.toLowerCase();
                    const foundSubcat = subcategories.find(s => s.name.toLowerCase() === subcatKey);

                    if (!foundSubcat) {
                        results.errors.push({
                            row: rowNum,
                            message: `Sub-kategori "${row.subcategory_name}" tidak ditemukan`,
                            data: row
                        });
                        continue;
                    }

                    // Validate subcategory belongs to the specified category
                    if (categoryId && foundSubcat.category_id !== categoryId) {
                        const parentCat = categories.find(c => c.id === foundSubcat.category_id);
                        results.errors.push({
                            row: rowNum,
                            message: `Sub-kategori "${row.subcategory_name}" bukan milik kategori "${row.category_name}". Parent seharusnya: "${parentCat?.name || 'unknown'}"`,
                            data: row
                        });
                        continue;
                    }

                    subcategoryId = foundSubcat.id;

                    // If category not provided but subcategory has a parent, use that
                    if (!categoryId && foundSubcat.category_id) {
                        // Auto-assign category from subcategory's parent
                    }
                }

                // Create product
                const product = await Product.create({
                    name: row.name,
                    sku: formattedSku,
                    category_id: categoryId || null,
                    subcategory_id: subcategoryId || null,
                    description: row.deskripsi_lengkap || null,
                    subtitle: row.deskripsi_singkat || null,
                    status: row.status || 'ACTIVE'
                });

                results.success.push({ row: rowNum, product: { id: product.id, name: product.name, sku: product.sku } });

            } catch (error) {
                results.errors.push({ row: rowNum, message: error.message, data: row });
            }
        }

        res.json({
            success: true,
            message: `Import completed: ${results.success.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`,
            results
        });

    } catch (error) {
        console.error('Error importing products:', error);
        res.status(500).json({ success: false, message: 'Import failed', error: error.message });
    }
};

/**
 * Import Variants from Excel file with Dynamic Attributes support
 */
const importVariants = async (req, res) => {
    // Increase timeout to 10 minutes
    req.setTimeout(600000);
    const t = await sequelize.transaction();

    try {
        if (!req.file) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Parse Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Excel file is empty' });
        }

        // Fetch all products for SKU lookup
        const products = await Product.findAll({ attributes: ['id', 'sku', 'variant_options'] });
        const productMap = {};
        products.forEach(p => {
            if (p.sku) {
                productMap[p.sku.trim().toLowerCase()] = p.id;
            }
        });

        const results = {
            success: [],
            errors: [],
            skipped: []
        };

        // Reserved keys that are NOT attributes
        const RESERVED_KEYS = [
            'product_sku',
            'price_gross',
            'price_net',
            'satuan',
            'quantity_multiplier',
            'sibak', // Keep for backward compatibility/multiplier logic
            '__rowNum__'
        ];

        // Track all unique attribute values encountered per product
        // Structure: { productId: { AttributeName: Set(values) } }
        const productAttributeValues = {};

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2;

            try {
                // Validate required fields
                if (!row.product_sku) {
                    results.errors.push({ row: rowNum, message: 'Missing product_sku', data: row });
                    continue;
                }

                if (!row.price_gross && !row.price_net) {
                    results.errors.push({ row: rowNum, message: 'Missing price_gross and price_net', data: row });
                    continue;
                }

                // Lookup product by SKU (Case insensitive & Trimmed)
                const skuKey = row.product_sku ? String(row.product_sku).trim().toLowerCase() : '';
                const productId = productMap[skuKey];
                if (!productId) {
                    results.errors.push({ row: rowNum, message: `Product with SKU "${row.product_sku}" not found`, data: row });
                    continue;
                }

                // --- Dynamic Attribute Parsing ---
                const attributes = {};

                // Helper to capitalize first letter
                const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

                // Helper to normalize attribute values (strip L/T prefixes) for storage
                const normalizeForStorage = (val) => {
                    if (val === null || val === undefined) return '';
                    return String(val).trim().replace(/^[LT]\s*/i, '');
                };

                Object.keys(row).forEach(key => {
                    const cleanKey = key.trim();
                    // If not reserved, treat as attribute
                    if (!RESERVED_KEYS.includes(cleanKey.toLowerCase())) {
                        // Use original key casing or Capitalize? Let's Capitalize for consistency
                        const attrName = capitalize(cleanKey);
                        // Normalize values: strip L/T prefix so "L 100" becomes "100"
                        attributes[attrName] = normalizeForStorage(row[key]);
                    }
                });

                // Backward compatibility: If 'lebar' or 'tinggi' are explicitly columns (which they are),
                // they are caught by the loop above if not in RESERVED_KEYS.
                // Wait, I didn't put 'lebar'/'tinggi' in reserved keys, so they will be added as 'Lebar'/'Tinggi'.
                // 'sibak' IS in reserved keys, so it won't be added as attribute automatically.
                // But we might want 'Sibak' to be an attribute IF it's used as one.
                // However, usually Sibak is a multiplier. 
                // Let's explicitly check 'sibak' column to add it as attribute 'Sibak' AND use it as multiplier.
                if (row.sibak) {
                    attributes['Sibak'] = String(row.sibak);
                }

                // --- Duplicate Check ---
                // Helper to normalize attribute values (strip L/T prefixes)
                const normalizeValue = (val) => {
                    if (val === null || val === undefined) return '';
                    return String(val).trim().replace(/^[LT]\s*/i, '');
                };

                const normalizeAttrs = (attrs) => {
                    if (!attrs || typeof attrs !== 'object') return '{}';
                    const sorted = Object.keys(attrs).sort().reduce((obj, key) => {
                        obj[key] = normalizeValue(attrs[key]);
                        return obj;
                    }, {});
                    return JSON.stringify(sorted);
                };

                const priceNet = parseFloat(row.price_net) || 0;
                const priceGross = parseFloat(row.price_gross) || 0;
                const multiplier = row.sibak ? parseInt(row.sibak) : (parseInt(row.quantity_multiplier) || 1);
                const attributesKey = normalizeAttrs(attributes);

                // Check for existing match in DB (match by ATTRIBUTES only)
                const existingVariants = await ProductVariant.findAll({
                    where: { product_id: productId },
                    transaction: t
                });

                const existingMatch = existingVariants.find(v => {
                    return normalizeAttrs(v.attributes) === attributesKey;
                });

                // Helper to track attribute values for variant_options
                const trackAttributes = () => {
                    if (!productAttributeValues[productId]) productAttributeValues[productId] = {};
                    Object.entries(attributes).forEach(([name, val]) => {
                        if (!productAttributeValues[productId][name]) productAttributeValues[productId][name] = new Set();
                        productAttributeValues[productId][name].add(val);
                    });
                };

                let variant;
                if (existingMatch) {
                    // UPDATE existing variant
                    variant = await existingMatch.update({
                        price_gross: priceGross,
                        price_net: priceNet,
                        satuan: row.satuan || existingMatch.satuan,
                        quantity_multiplier: multiplier,
                        is_active: true,
                        attributes: Object.keys(attributes).length > 0 ? attributes : null // Update attributes in case casing/format changed
                    }, { transaction: t });
                    trackAttributes();
                    results.success.push({
                        row: rowNum,
                        message: 'Updated existing variant',
                        variant: { id: variant.id, product_id: variant.product_id, product_sku: row.product_sku }
                    });
                } else {
                    // CREATE new variant
                    variant = await ProductVariant.create({
                        product_id: productId,
                        attributes: Object.keys(attributes).length > 0 ? attributes : null,
                        price_gross: priceGross,
                        price_net: priceNet,
                        satuan: row.satuan || 'm',
                        quantity_multiplier: multiplier,
                        is_active: true
                    }, { transaction: t });
                    trackAttributes();
                    results.success.push({
                        row: rowNum,
                        message: 'Created new variant',
                        variant: { id: variant.id, product_id: variant.product_id, product_sku: row.product_sku }
                    });
                }

            } catch (error) {
                results.errors.push({ row: rowNum, message: error.message, data: row });
            }
        }

        // --- Update Product Variant Options (Dynamic) ---
        const impactedProductIds = Object.keys(productAttributeValues);

        for (const productId of impactedProductIds) {
            try {
                const product = await Product.findByPk(productId, { transaction: t });
                if (!product) continue;

                let options = product.variant_options || [];
                if (typeof options === 'string') {
                    try { options = JSON.parse(options); } catch (e) { options = []; }
                }

                const attrData = productAttributeValues[productId];

                // Helper to update or add an option
                const updateOrAddOption = (name, values, isMultiplier = false) => {
                    // Try to find case-insensitive match for existing option name
                    const existingIdx = options.findIndex(opt => opt.name && opt.name.toLowerCase() === name.toLowerCase());

                    // Helper to normalize L/T prefixes for deduplication
                    const normalizeVal = (val) => String(val).trim().replace(/^[LT]\s*/i, '');

                    // Numeric sort if possible, else string sort
                    const valuesArray = [...values].sort((a, b) => {
                        const numA = parseFloat(a);
                        const numB = parseFloat(b);
                        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                        return String(a).localeCompare(String(b));
                    });

                    if (existingIdx >= 0) {
                        // Merge values - normalize existing values to prevent duplicates
                        const existingValues = (options[existingIdx].values || []).map(v => normalizeVal(v));
                        // Merge normalized values and deduplicate
                        const allValues = [...existingValues, ...valuesArray];
                        const uniqueNormalized = [...new Set(allValues.map(v => normalizeVal(v)))];
                        const mergedValues = uniqueNormalized.sort((a, b) => {
                            const numA = parseFloat(a);
                            const numB = parseFloat(b);
                            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                            return String(a).localeCompare(String(b));
                        });
                        options[existingIdx].values = mergedValues;
                        // Use isMultiplierType to match frontend UnifiedVariantManager
                        if (isMultiplier) options[existingIdx].isMultiplierType = true;
                    } else if (valuesArray.length > 0) {
                        // Add new
                        options.push({
                            name: name,
                            values: valuesArray,
                            isMultiplierType: isMultiplier
                        });
                    }
                };

                // Iterate through ALL collected attributes for this product
                Object.keys(attrData).forEach(attrName => {
                    const values = attrData[attrName];
                    const isMultiplier = attrName.toLowerCase() === 'sibak';
                    updateOrAddOption(attrName, values, isMultiplier);
                });

                await product.update({ variant_options: options }, { transaction: t });

            } catch (updateError) {
                console.error(`Failed to update variant options for product ${productId}:`, updateError);
            }
        }

        await t.commit();

        const sampleSkus = results.success.slice(0, 3).map(r => `${r.variant?.product_sku} (PID: ${r.variant?.product_id})`).filter(Boolean).join(', ');

        res.json({
            success: true,
            message: `Import Selesai: ${results.success.length} BERHASIL disimpan (Contoh: ${sampleSkus}...), ${results.skipped.length} dilewati, ${results.errors.length} GAGAL.`,
            results
        });

    } catch (error) {
        await t.rollback();
        console.error('Error importing variants:', error);
        res.status(500).json({ success: false, message: 'Import failed', error: error.message });
    }
};

module.exports = {
    downloadProductTemplate,
    downloadVariantTemplate,
    importProducts,
    importVariants
};
