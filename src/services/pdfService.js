const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Generate simple modern PDF with compact text sizes
 */
const generateDocumentPDF = (document) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                bufferPages: true,
                autoFirstPage: false, // We will add page manually
                autoAddPage: false // CRITICAL: Disable auto-add to prevent double-paging conflict with our manual checks
            });

            doc.addPage(); // Add first page specifically

            // ============ WATERMARK (logo on every page) ============
            const addWatermark = () => {
                const wmLogoPath = path.join(__dirname, '../assets/logo.png');
                if (fs.existsSync(wmLogoPath)) {
                    doc.save();
                    doc.opacity(0.08); // Very faint
                    doc.image(wmLogoPath, 150, 300, { width: 300 }); // Centered, large
                    doc.restore();
                    doc.opacity(1); // Reset opacity
                }
            };

            // ============ PAGE HEADER (on every page) ============
            const logoPath = path.join(__dirname, '../assets/logo.png');
            const isInvoice = document.type === 'INVOICE';
            const addPageHeader = () => {
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 40, 25, { height: 40 });
                    doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Toko Gorden dan Blind Berkualitas', 40, 70);
                } else {
                    doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('AMAGRIYA', 40, 35);
                    doc.fontSize(6).font('Helvetica').fillColor('#6b7280').text('Toko Gorden dan Blind Berkualitas', 40, 52);
                }
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
                    .text(isInvoice ? 'INVOICE' : 'PENAWARAN', 350, 35, { width: 205, align: 'right' });
                doc.fontSize(7).font('Helvetica').fillColor('#6b7280')
                    .text(document.document_number, 350, 50, { width: 205, align: 'right' });
                doc.moveTo(40, 82).lineTo(555, 82).lineWidth(0.5).stroke('#e5e7eb');
            };

            addWatermark(); // Add watermark to first page
            addPageHeader(); // Add header to first page

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const accent = '#EB216A';
            const dark = '#111827';
            const gray = '#6b7280';

            const formatCurrency = (amt) => 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amt || 0);
            const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

            // Parse data
            let docData = document.data;
            if (typeof docData === 'string') {
                try { while (typeof docData === 'string') docData = JSON.parse(docData); }
                catch (e) { docData = {}; }
            }
            docData = docData || {};

            // Calculate totals
            let calc = 0;
            if (docData.windows) docData.windows.forEach(w => {
                if (w.subtotal) calc += w.subtotal;
                else if (w.items) w.items.forEach(i => calc += i.totalPrice || 0);
            });
            const discount = parseFloat(document.discount_amount) || 0;
            let total = parseFloat(document.total_amount) || 0;
            if (total === 0 && calc > 0) total = calc - discount;
            const subtotal = total + discount;

            // Header already added by addPageHeader() function above

            // ============ INFO (compact) ============
            let y = 88;
            doc.fontSize(6).font('Helvetica-Bold').fillColor(dark).text('PELANGGAN', 40, y);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text(document.customer_name || '-', 40, y + 9);
            // Show address if exists, otherwise skip
            const hasAddress = document.address && document.address.trim();
            if (hasAddress) {
                doc.fontSize(6).font('Helvetica').fillColor(gray)
                    .text(document.address, 40, y + 19, { width: 180 });
                y = 135; // After address (moderate spacing)
            } else {
                y = 120; // No address, moderate spacing
            }

            // ============ TABLE ============

            const isBlindType = docData.calculatorTypeSlug && docData.calculatorTypeSlug.includes('blind');

            if (isBlindType && docData.raw_items) {
                // ... (Blind Code partially omitted, verify if needs update. User focus was Smokring/General)
                // Keeping Blind view mostly as is unless requested, but will fix subtotal color if shared logic used.
                // Actually the user mentioned "Kalkulator Blinds" too. Let's fix Blind columns too if similar.
                // Blind columns are currently: Label 45, Ukuran 200, Vol 280, Harga 330, Disc 400, Qty 440, Total 470.
                // It seems okay, but check subtotal color.

                // Group items logic...
                const groupedItems = {};
                docData.raw_items.forEach(item => {
                    const groupId = item.groupId || `ungrouped-${item.id}`;
                    if (!groupedItems[groupId]) groupedItems[groupId] = [];
                    groupedItems[groupId].push(item);
                });

                Object.entries(groupedItems).forEach(([groupId, items]) => {
                    const firstItem = items[0];
                    const product = firstItem.product || docData.baseFabric;
                    const groupDiscount = firstItem.groupDiscount || 0;

                    // Group Header
                    if (y > 780) { doc.addPage(); addWatermark(); addPageHeader(); y = 92; }

                    // Product Header (Minimalist - Box Removed)
                    // doc.rect(40, y, 515, 25).fill('#f9fafb'); 
                    // doc.rect(40, y, 515, 25).stroke('#e5e7eb');

                    // Product Name with Variant - Minimalist Style
                    const variantAttrs = firstItem.selectedVariant?.attributes;
                    let variantInfo = '';
                    if (variantAttrs) {
                        try {
                            const attrs = typeof variantAttrs === 'string' ? JSON.parse(variantAttrs) : variantAttrs;
                            if (attrs && Object.keys(attrs).length > 0) {
                                variantInfo = ' (' + Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ') + ')';
                            }
                        } catch (e) { }
                    }
                    doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                        .text((product?.name || 'Produk Custom') + variantInfo, 40, y);



                    y += 20; // Reduced spacing (was 35)

                    // Table Header - Adjusted Columns for consistency
                    // Old: L 45, U 200, V 280, H 330, D 400, Q 440, T 470
                    // New Target: NAMA wider. Shift others right.
                    // NAMA: 40 (width 210) -> Ends at 250
                    // UKURAN: 260
                    // VOL: 320
                    // HARGA: 360
                    // DISC: 410 --> Too tight?
                    // Let's maximize space.
                    // Qty needs to be at ~430. Total ~470.
                    // Let's compress Ukuran/Vol slightly.

                    const bx = {
                        label: 40,
                        size: 230,
                        vol: 280,
                        price: 315,
                        disc: 360,
                        net: 395,    // NEW: Harga Net column
                        qty: 445,
                        total: 475
                    };

                    // Line ABOVE column headers
                    doc.moveTo(40, y - 2).lineTo(555, y - 2).lineWidth(0.5).stroke(dark);

                    doc.fontSize(6).font('Helvetica-Bold').fillColor(gray)
                        .text('NAMA', bx.label, y)
                        .text('UKURAN', bx.size, y, { width: 45, align: 'center' })
                        .text('VOL', bx.vol, y, { width: 30, align: 'center' })
                        .text('HARGA', bx.price, y, { width: 40, align: 'right' })
                        .text('DISC', bx.disc, y, { width: 30, align: 'center' })
                        .text('HARGA NET', bx.net, y, { width: 45, align: 'right' })
                        .text('QTY', bx.qty, y, { width: 25, align: 'center' })
                        .text('TOTAL', bx.total, y, { width: 75, align: 'right' });

                    y += 10;
                    // Line BELOW column headers
                    doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke(dark);
                    y += 8;

                    let groupTotal = 0;

                    // Items - Use pre-calculated values from frontend
                    items.forEach(item => {
                        const windowItem = docData.windows ? docData.windows.find(w => w.id === item.id) : null;

                        // Use pre-calculated values from item/windowItem
                        // Calculate vol from dimensions if not stored
                        let vol = parseFloat(item.vol || item.meters || 0);
                        if (vol === 0 && item.width && item.height) {
                            // Calculate m² from cm dimensions
                            const widthM = item.width / 100;
                            const heightM = item.height / 100;
                            const fabricMultiplier = docData.calculatorTypeFromDB?.fabric_multiplier || 2.4;
                            vol = widthM * heightM * fabricMultiplier;
                        }

                        // Get prices: Gross and Net
                        const priceGross = item.selectedVariant?.price_gross || item.selectedVariant?.price || 0;
                        const priceNet = item.price_net || item.selectedVariant?.price_net || priceGross;
                        const fabricDiscount = item.fabricDiscount || (priceGross > 0 ? Math.round(((priceGross - priceNet) / priceGross) * 100) : 0);

                        const itemTotal = item.totalPrice || (windowItem?.subtotal) || 0;

                        groupTotal += itemTotal;

                        if (y > 780) { doc.addPage(); addWatermark(); addPageHeader(); y = 92; }

                        // Name Fix Logic
                        let displayName = item.name || '-';
                        displayName = displayName.replace(/^Pilih\s+[^:]+:\s*/i, '');

                        if (displayName === '-' || displayName.includes('undefined')) {
                            if (item.selectedVariant) {
                                if (item.selectedVariant.name && !item.selectedVariant.name.includes('undefined')) {
                                    displayName = `${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} (${item.selectedVariant.name})`;
                                } else {
                                    try {
                                        const attrs = typeof item.selectedVariant.attributes === 'string'
                                            ? JSON.parse(item.selectedVariant.attributes)
                                            : item.selectedVariant.attributes;
                                        if (attrs && Object.keys(attrs).length > 0) {
                                            displayName = `${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} (${Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')})`;
                                        }
                                    } catch (e) { }
                                }
                            }
                        }

                        // Render with Justify and Wide Column
                        const nameWidth = 180;
                        const nameHeight = doc.heightOfString(displayName, { width: nameWidth, align: 'justify' });
                        const rowHeight = Math.max(nameHeight, 10) + 4;

                        if (y + rowHeight > 780) { doc.addPage(); addWatermark(); addPageHeader(); y = 92; }

                        doc.fontSize(6).font('Helvetica').fillColor(dark)
                            .text(displayName, bx.label, y, { width: nameWidth, align: 'justify' })
                            .text(`${item.width} x ${item.height}`, bx.size, y, { width: 45, align: 'center' })
                            .text(vol.toFixed(2), bx.vol, y, { width: 30, align: 'center' })
                            .text(formatCurrency(priceGross), bx.price, y, { width: 40, align: 'right' })
                            .text(fabricDiscount > 0 ? `${fabricDiscount}%` : '-', bx.disc, y, { width: 30, align: 'center' })
                            .text(formatCurrency(priceNet), bx.net, y, { width: 45, align: 'right' })
                            .text((item.quantity).toString(), bx.qty, y, { width: 25, align: 'center' })
                            .text(formatCurrency(itemTotal), bx.total, y, { width: 75, align: 'right' });

                        y += rowHeight;
                    });

                    // Group Subtotal Footer
                    doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke('#d1d5db');
                    y += 8;

                    // Calculate totals from Net groupTotal (which matches Admin 'Subtotal' Result)
                    const groupNetTotal = groupTotal;
                    let groupGrossTotal = groupNetTotal;
                    if (groupDiscount > 0) {
                        // Back calculate Gross from Net
                        groupGrossTotal = groupNetTotal / (1 - groupDiscount / 100);
                    }

                    // Subtotal Group Label - Dark
                    doc.fontSize(7).font('Helvetica-Bold').fillColor(dark);

                    if (groupDiscount > 0) {
                        // Show Breakdown: Gross -> Disc -> Net
                        doc.text('Subtotal Grup', 350, y, { width: 100, align: 'right' })
                            .text(formatCurrency(groupGrossTotal), 470, y, { width: 75, align: 'right' });
                        y += 10;
                        doc.text(`Disc ${groupDiscount}%`, 350, y, { width: 100, align: 'right' })
                            .text(`-${formatCurrency(groupGrossTotal - groupNetTotal)}`, 470, y, { width: 75, align: 'right' });
                        y += 10;
                        doc.text('Subtotal', 350, y, { width: 100, align: 'right' })
                            .text(formatCurrency(groupNetTotal), 470, y, { width: 75, align: 'right' });
                    } else {
                        // No discount - just show Net
                        doc.text('Subtotal Grup', 350, y, { width: 100, align: 'right' })
                            .text(formatCurrency(groupNetTotal), 470, y, { width: 75, align: 'right' });
                    }
                    y += 25;
                });

            } else {
                // ==================== LEGACY VIEW (Smokring / Curtains) ====================
                const useRawItems = docData.raw_items && docData.raw_items.length > 0;

                doc.moveTo(40, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
                y += 5;

                // ADJUSTED COLUMNS: NAMA wider, other columns shifted right
                const colX = {
                    name: 40,
                    price: 300,  // Shifted right for wider NAMA column
                    disc: 355,   // Shifted right
                    net: 400,    // Shifted right
                    qty: 465,    // Shifted right
                    total: 500   // Shifted right
                };

                // Single line below header only (removed double line)
                doc.fontSize(6).font('Helvetica-Bold').fillColor(dark)
                    .text('NAMA', colX.name, y)
                    .text('HARGA', colX.price, y, { width: 45, align: 'right' })
                    .text('DISC', colX.disc, y, { width: 35, align: 'center' })
                    .text('HARGA NET', colX.net, y, { width: 55, align: 'right' })
                    .text('QTY', colX.qty, y, { width: 25, align: 'center' })
                    .text('TOTAL', colX.total, y, { width: 55, align: 'right' });

                y += 12;
                // Line BELOW column headers
                doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke(dark);
                y += 6;

                if (useRawItems) {
                    docData.raw_items.forEach((item, idx) => {
                        // Window/Item Header
                        const itemTitle = `${item.quantity || 1} ${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} - Ukuran ${item.width}cm x ${item.height}cm`;
                        const packageType = item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja';

                        // Ensure page break for Header
                        if (y > 780) { doc.addPage(); addWatermark(); addPageHeader(); y = 92; }

                        // Title (bold, black) then Package Type (smaller, gray) on same line
                        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                            .text(itemTitle, 40, y, { continued: true });
                        doc.fontSize(7).font('Helvetica').fillColor(gray)
                            .text(`  ${packageType}`, { continued: false });
                        y += 12;

                        // Render Note on separate line if exists, indented to align with "Jendela" word
                        if (item.note) {
                            // Indent to align with word after number (e.g., "4 Jendela" -> indent past "4 ")
                            const noteIndent = 47; // Position where "Jendela" starts (after "4 ")
                            const noteText = `Catatan: ${item.note}`;
                            const noteW = 515 - (noteIndent - 40);
                            const noteH = doc.heightOfString(noteText, { width: noteW, fontSize: 6 });

                            if (y + noteH > 780) { doc.addPage(); addWatermark(); addPageHeader(); y = 92; }

                            doc.fontSize(6).font('Helvetica-Oblique').fillColor(gray)
                                .text(noteText, noteIndent, y, { width: noteW, align: 'left' });
                            y += noteH + 4;
                        }

                        // Line below item header (and note)
                        doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke(dark);
                        y += 6;

                        const allRows = [];

                        // ... (Data prep same as before)
                        const matchingWindow = docData.windows?.find(w => w.id === item.id);
                        if (matchingWindow && matchingWindow.items && matchingWindow.items.length > 0) {
                            matchingWindow.items.forEach((wItem, wIdx) => {
                                let displayName = wItem.name || '-';

                                // Skip items that are just variant info (start with ( or only contain Lebar/Tinggi)
                                if (displayName.match(/^\s*\([^)]+\)\s*$/) || displayName.match(/^\s*\(?(Lebar|Tinggi|Sibak)/i)) {
                                    return; // Skip this item
                                }

                                // For first item (Gorden), use ONLY product name + variant (ignore wItem.name)
                                if (wIdx === 0 && item.product?.name) {
                                    let variantAttrs = '';
                                    if (item.selectedVariant?.attributes) {
                                        try {
                                            const attrs = typeof item.selectedVariant.attributes === 'string'
                                                ? JSON.parse(item.selectedVariant.attributes)
                                                : item.selectedVariant.attributes;
                                            if (attrs && Object.keys(attrs).length > 0) {
                                                variantAttrs = ' (' + Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ') + ')';
                                            }
                                        } catch (e) { }
                                    }
                                    displayName = `${item.product.name}${variantAttrs}`;
                                } else {
                                    // For other items (components), clean up the name
                                    displayName = displayName.replace(/^[^:]+:\s*/i, '');
                                    displayName = displayName.replace(/undefined/g, '-');
                                    displayName = displayName.replace(/\s*\(\d+\.?\d*m\)\s*$/i, '');
                                }

                                allRows.push({
                                    name: displayName,
                                    priceGross: wItem.price_gross || wItem.price || 0,
                                    discount: wItem.discount || 0,
                                    priceNet: wItem.price_net || wItem.price || 0,
                                    qty: wItem.quantity || 1,
                                    total: wItem.totalPrice || 0
                                });
                            });
                        } else {
                            // ... (Fallback calculation same as before) ...
                            // FABRIC ROW
                            const fabricGross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                            const fabricNet = Number(item.selectedVariant?.price_net) || fabricGross;
                            const fabricDiscount = item.fabricDiscount || (fabricGross > 0 ? Math.round(((fabricGross - fabricNet) / fabricGross) * 100) : 0);
                            const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
                            const effectiveQty = variantMultiplier * item.quantity;
                            const fabricTotal = fabricNet * effectiveQty * (1 - fabricDiscount / 100);

                            let variantName = '-';
                            if (item.selectedVariant) {
                                try {
                                    const attrs = typeof item.selectedVariant.attributes === 'string'
                                        ? JSON.parse(item.selectedVariant.attributes)
                                        : item.selectedVariant.attributes;
                                    if (attrs && Object.keys(attrs).length > 0) {
                                        variantName = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
                                    } else if (item.selectedVariant.name) {
                                        variantName = item.selectedVariant.name;
                                    }
                                } catch (e) {
                                    if (item.selectedVariant.name) variantName = item.selectedVariant.name;
                                }
                            }

                            const productName = item.product?.name || item.productName || 'Gorden';
                            allRows.push({
                                name: `${productName} (${variantName})`,
                                priceGross: fabricGross,
                                discount: fabricDiscount,
                                priceNet: fabricNet,
                                qty: effectiveQty,
                                total: fabricTotal
                            });

                            // Component Rows ...
                            if (item.packageType === 'gorden-lengkap' && item.components) {
                                const componentsList = Array.isArray(item.components) ? item.components : Object.values(item.components);
                                componentsList.forEach((comp) => {
                                    const compGross = Number(comp.productPriceGross) || Number(comp.productPrice) || Number(comp.product?.price_gross) || Number(comp.product?.price) || 0;
                                    const compNet = Number(comp.productPriceNet) || Number(comp.product?.price_net) || compGross;
                                    const compDiscount = comp.discount || (compGross > 0 ? Math.round(((compGross - compNet) / compGross) * 100) : 0);
                                    const compName = comp.productName || comp.product?.name || 'Komponen';
                                    const likelyShouldScale = ['rel', 'tassel', 'hook', 'vitrase', 'gorden', 'kain', 'rail'].some(k => compName.toLowerCase().includes(k));
                                    const rawQty = comp.qty || 1;
                                    const isSuspiciousUnscaled = comp.displayQty && comp.displayQty === rawQty && (item.quantity || 1) > 1;
                                    const compQty = (!comp.displayQty || (likelyShouldScale && isSuspiciousUnscaled)) ? rawQty * (item.quantity || 1) : comp.displayQty;
                                    const compTotal = comp.componentTotal || (compNet * compQty);

                                    allRows.push({
                                        name: compName,
                                        priceGross: compGross,
                                        discount: compDiscount,
                                        priceNet: compNet,
                                        qty: compQty,
                                        total: compTotal
                                    });
                                });
                            }
                        }

                        // Render all rows with numbering (#1, #2, etc)
                        allRows.forEach((row, rowIdx) => {
                            let displayName = row.name || '-';
                            displayName = displayName.replace(/^Pilih\s+[^:]+:\s*/i, '');
                            displayName = displayName.replace(/undefined/g, '-');
                            displayName = displayName.trim(); // Trim whitespace

                            const numberText = `#${rowIdx + 1}`;
                            const indent = 12; // Reduced indentation slightly
                            const nameX = colX.name + indent;
                            const nameWidth = 250 - indent;

                            // Set font size/family BEFORE calculating height to ensure accuracy
                            doc.fontSize(6).font('Helvetica');

                            const nameHeight = doc.heightOfString(displayName, { width: nameWidth, align: 'left' });
                            // Reduce min height slightly (font size 6 is small) and padding
                            const rowHeight = Math.max(nameHeight, 8) + 2;

                            if (y + rowHeight > 780) { doc.addPage(); addWatermark(); addPageHeader(); y = 92; }

                            // Font is already set, just set color and render
                            doc.fillColor(dark)
                                .text(numberText, colX.name, y)
                                .text(displayName, nameX, y, { width: nameWidth, align: 'left' }) // Align left
                                .text(formatCurrency(row.priceGross), colX.price, y, { width: 45, align: 'right' })
                                .text(row.discount > 0 ? `${row.discount}%` : '-', colX.disc, y, { width: 35, align: 'center' })
                                .text(formatCurrency(row.priceNet), colX.net, y, { width: 55, align: 'right' })
                                .text(row.qty.toString(), colX.qty, y, { width: 25, align: 'center' })
                                .text(formatCurrency(row.total), colX.total, y, { width: 55, align: 'right' });

                            y += rowHeight;
                            // REMOVED: Per-item line (user requested removal)
                        });



                        // Item Subtotal
                        let subtotalAfterDiscount;
                        if (matchingWindow && matchingWindow.subtotal !== undefined) {
                            subtotalAfterDiscount = matchingWindow.subtotal;
                        } else {
                            const rowsTotal = allRows.reduce((sum, r) => sum + r.total, 0);
                            const itemDiscount = item.itemDiscount || 0;
                            subtotalAfterDiscount = rowsTotal * (1 - itemDiscount / 100);
                        }

                        // Line ABOVE subtotal (group separator)
                        doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke('#d1d5db');
                        y += 4;

                        // Subtotal Label in Dark
                        doc.fontSize(6).font('Helvetica-Bold').fillColor(dark)
                            .text('Subtotal', 400, y, { width: 60, align: 'right' });
                        doc.fontSize(6).font('Helvetica-Bold').fillColor(dark)
                            .text(formatCurrency(subtotalAfterDiscount), 470, y, { width: 85, align: 'right' });

                        y += 18;
                        doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke('#d1d5db'); // Divider between main items
                        y += 5;
                        y += 5;
                    });

                } else if (docData.windows) {
                    // LEGACY WINDOWS LOOP (Fallback)
                    docData.windows.forEach(window => {
                        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text(`${window.title || ''} - ${window.size || ''}`, 40, y);
                        // ...
                        if (window.items) {
                            window.items.forEach(item => {
                                // ... Same Logic, just reuse colX
                                const itemPriceGross = parseFloat(item.price_gross) || parseFloat(item.price) || 0;
                                const itemPriceNet = parseFloat(item.price_net) || itemPriceGross;
                                const itemDiscount = item.discount || (itemPriceGross > 0 ? Math.round(((itemPriceGross - itemPriceNet) / itemPriceGross) * 100) : 0);
                                const itemTotal = item.totalPrice || itemPriceNet * (item.quantity || 1);
                                let displayName = item.name || '-';

                                doc.fontSize(6).font('Helvetica').fillColor(dark)
                                    .text(displayName, colX.name, y, { width: 210, align: 'justify' })
                                    .text(formatCurrency(itemPriceGross), colX.price, y, { width: 50, align: 'right' })
                                    .text(itemDiscount > 0 ? `${itemDiscount}%` : '-', colX.disc, y, { width: 30, align: 'center' })
                                    .text(formatCurrency(itemPriceNet), colX.net, y, { width: 60, align: 'right' })
                                    .text((item.quantity || 1).toString(), colX.qty, y, { width: 25, align: 'center' })
                                    .text(formatCurrency(itemTotal), colX.total, y, { width: 85, align: 'right' });
                                y += 18;
                            });
                        }
                    });
                }
            }

            // ============ TOTALS + PAYMENT + FOOTER (Consolidated) ============
            // Calculate required space for ALL footer content (~120px)
            const footerHeight = 120;
            if (y + footerHeight > 800) {
                doc.addPage(); addWatermark(); addPageHeader();
                y = 92;
            }

            // --- TOTALS SECTION ---
            y += 8;
            doc.moveTo(380, y).lineTo(555, y).lineWidth(0.3).stroke('#d1d5db');
            y += 8;

            const totalLabelX = 410;
            const totalValueX = 485;
            const totalValueWidth = 70;

            doc.fontSize(7).font('Helvetica').fillColor(dark).text('Subtotal', totalLabelX, y);
            doc.fillColor(dark).text(formatCurrency(subtotal), totalValueX, y, { width: totalValueWidth, align: 'right' });
            y += 12;

            if (discount > 0) {
                doc.fontSize(7).font('Helvetica').fillColor(gray).text('Diskon', totalLabelX, y);
                doc.fillColor('#10b981').text(`-${formatCurrency(discount)}`, totalValueX, y, { width: totalValueWidth, align: 'right' });
                y += 12;
            }

            doc.moveTo(totalLabelX, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
            y += 8;
            doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text('TOTAL', totalLabelX, y);
            doc.fontSize(9).font('Helvetica-Bold').fillColor(dark).text(formatCurrency(Math.ceil(total)), totalValueX - 25, y - 1, { width: 95, align: 'right' });

            // --- PAYMENT SECTION ---
            y += 25;
            doc.fontSize(7).font('Helvetica-Bold').fillColor(dark).text('PEMBAYARAN', 40, y);
            doc.fontSize(7).font('Helvetica').fillColor(gray)
                .text(docData.paymentTerms || 'Bank BRI: 0763 0100 1160 564 a.n. ABDUL RAHIM', 40, y + 10, { width: 220 });

            if (document.referral_code) {
                doc.fontSize(7).font('Helvetica-Bold').fillColor(dark).text('KODE REFERRAL', 380, y);
                doc.fontSize(9).font('Helvetica-Bold').fillColor(accent).text(document.referral_code, 380, y + 10);
            }

            if (docData.notes) {
                y += 30;
                doc.fontSize(6).font('Helvetica').fillColor(gray).text('Catatan: ' + docData.notes, 40, y, { width: 300 });
            }

            // --- FOOTER ---
            y += 35;
            doc.fontSize(7).font('Helvetica').fillColor(gray)
                .text('Terima kasih atas kepercayaan Anda', 40, y, { align: 'center', width: 515 });
            // Pink line removed per user request

            doc.end();
        } catch (error) { reject(error); }
    });
};

module.exports = { generateDocumentPDF };
