const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const { Product, ProductVariant, Category, SubCategory } = require('../models');
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
            { header: 'description', key: 'description', width: 45 },
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
            description: 'Deskripsi produk contoh',
            status: 'ACTIVE'
        });
        worksheet.addRow({
            name: 'Contoh Produk 2',
            sku: 'PRD-002',
            category_name: categoryNames.length > 1 ? categoryNames[1] : categoryNames[0] || '',
            subcategory_name: subcategoryNames.length > 1 ? subcategoryNames[1] : '',
            description: 'Deskripsi produk contoh kedua',
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
            ['product_sku', 'lebar', 'tinggi', 'sibak', 'gelombang', 'price_gross', 'price_net', 'satuan', 'quantity_multiplier'],
            ['GRD-BLK-001', '100', '200', '2', '6', '150000', '120000', 'm', '2'],
            ['GRD-BLK-001', '100', '210', '2', '6', '155000', '125000', 'm', '2'],
            ['GRD-BLK-001', '100', '220', '3', '8', '180000', '145000', 'm', '3'],
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // product_sku
            { wch: 10 }, // lebar
            { wch: 10 }, // tinggi
            { wch: 10 }, // sibak
            { wch: 12 }, // gelombang
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

                // Check for duplicate SKU
                const existingProduct = await Product.findOne({ where: { sku: row.sku } });
                if (existingProduct) {
                    results.skipped.push({ row: rowNum, message: `SKU "${row.sku}" already exists`, data: row });
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
                    sku: row.sku,
                    category_id: categoryId || null,
                    subcategory_id: subcategoryId || null,
                    description: row.description || null,
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
 * Import Variants from Excel file
 */
const importVariants = async (req, res) => {
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

        // Fetch all products for SKU lookup
        const products = await Product.findAll({ attributes: ['id', 'sku'] });
        const productMap = {};
        products.forEach(p => {
            productMap[p.sku] = p.id;
        });

        const results = {
            success: [],
            errors: [],
            skipped: []
        };

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

                // Lookup product by SKU
                const productId = productMap[row.product_sku];
                if (!productId) {
                    results.errors.push({ row: rowNum, message: `Product with SKU "${row.product_sku}" not found`, data: row });
                    continue;
                }

                // Build attributes JSON from columns
                const attributes = {};
                if (row.lebar) attributes['Lebar'] = String(row.lebar);
                if (row.tinggi) attributes['Tinggi'] = String(row.tinggi);
                if (row.sibak) attributes['Sibak'] = String(row.sibak);
                if (row.gelombang) attributes['Gelombang'] = String(row.gelombang);

                // Create variant
                const variant = await ProductVariant.create({
                    product_id: productId,
                    attributes: Object.keys(attributes).length > 0 ? attributes : null,
                    price_gross: parseFloat(row.price_gross) || null,
                    price_net: parseFloat(row.price_net) || null,
                    satuan: row.satuan || 'm',
                    quantity_multiplier: parseInt(row.quantity_multiplier) || 1,
                    is_active: true
                });

                results.success.push({
                    row: rowNum,
                    variant: {
                        id: variant.id,
                        product_sku: row.product_sku,
                        attributes: variant.attributes
                    }
                });

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
