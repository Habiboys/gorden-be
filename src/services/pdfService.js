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
                bufferPages: true
            });

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

            const isInvoice = document.type === 'INVOICE';

            // ============ HEADER ============
            // Logo (if exists)
            const logoPath = path.join(__dirname, '../assets/logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, 25, { height: 40 });
                // Text next to logo
                // doc.fontSize(14).font('Helvetica-Bold').fillColor(dark).text('AMAGRIYA', 90, 30);
                doc.fontSize(6).font('Helvetica').fillColor(gray).text('Toko Gorden dan Blind Berkualitas', 40, 70);
            } else {
                // Fallback: text only
                doc.fontSize(14).font('Helvetica-Bold').fillColor(dark).text('AMAGRIYA', 40, 35);
                doc.fontSize(6).font('Helvetica').fillColor(gray).text('Toko Gorden dan Blind Berkualitas', 40, 52);
            }

            // Document type in black
            doc.fontSize(12).font('Helvetica-Bold').fillColor(dark)
                .text(isInvoice ? 'INVOICE' : 'PENAWARAN', 350, 35, { width: 205, align: 'right' });
            // Document number below, then date
            doc.fontSize(7).font('Helvetica').fillColor(gray)
                .text(document.document_number, 350, 50, { width: 205, align: 'right' });
            doc.fontSize(7).font('Helvetica').fillColor(dark)
                .text(formatDate(document.created_at || document.createdAt), 350, 60, { width: 205, align: 'right' });

            doc.moveTo(40, 82).lineTo(555, 82).lineWidth(0.5).stroke('#e5e7eb');

            // ============ INFO ============
            let y = 92;
            doc.fontSize(6).font('Helvetica-Bold').fillColor(dark).text('PELANGGAN', 40, y);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text(document.customer_name || '-', 40, y + 9);
            doc.fontSize(6).font('Helvetica').fillColor(gray)
                .text(document.customer_phone || '', 40, y + 19)
                .text(document.customer_email || '', 40, y + 28)
                .text(document.address || '', 40, y + 37, { width: 180 });

            // ============ TABLE ============
            y = 150;

            const isBlindType = docData.calculatorTypeSlug && docData.calculatorTypeSlug.includes('blind');

            if (isBlindType && docData.raw_items) {
                // ==================== BLIND GROUPING VIEW ====================

                // Group items
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
                    if (y > 700) { doc.addPage(); y = 40; }

                    // Product Header Box
                    doc.rect(40, y, 515, 25).fill('#f9fafb'); // Light gray bg
                    doc.rect(40, y, 515, 25).stroke('#e5e7eb');

                    // Product Name & Price
                    doc.fontSize(9).font('Helvetica-Bold').fillColor(dark)
                        .text(product?.name || 'Produk Custom', 50, y + 8);

                    const priceText = product?.price ? formatCurrency(product.price) + '/m' : '';
                    doc.fontSize(9).font('Helvetica-Bold').fillColor(accent)
                        .text(priceText, 40, y + 8, { width: 505, align: 'right' });

                    y += 35;

                    // Table Header
                    doc.fontSize(7).font('Helvetica-Bold').fillColor(gray)
                        .text('LABEL', 45, y)
                        .text('UKURAN', 200, y, { width: 80, align: 'center' })
                        .text('VOL (m²)', 280, y, { width: 40, align: 'center' })
                        .text('HARGA', 330, y, { width: 60, align: 'right' })
                        .text('DISC', 400, y, { width: 30, align: 'center' })
                        .text('QTY', 440, y, { width: 20, align: 'center' })
                        .text('TOTAL', 470, y, { width: 75, align: 'right' });

                    y += 10;
                    doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke('#e5e7eb');
                    y += 8;

                    let groupTotal = 0;

                    // Items
                    items.forEach(item => {
                        const windowItem = docData.windows ? docData.windows.find(w => w.id === item.id) : null;

                        const prices = windowItem ? {
                            total: windowItem.subtotal,
                            meters: parseFloat((windowItem.items[0]?.name || '').match(/\(([\d.]+)m\)/)?.[1] || '0'),
                            unitPrice: windowItem.items[0]?.price || 0
                        } : { total: 0, meters: 0, unitPrice: 0 };

                        // Fallback calculation if window not found or meters extraction failed
                        if (prices.unitPrice === 0 && item.selectedVariant) {
                            prices.unitPrice = item.selectedVariant.price || 0;
                            const widthM = item.width / 100;
                            const heightM = item.height / 100;
                            prices.meters = widthM * (docData.calculatorTypeFromDB?.fabric_multiplier || 2.4) * heightM;
                            // Recalculate total if needed (complex without all helpers, but better than 0)
                            const itemPrice = prices.meters * prices.unitPrice * item.quantity;
                            prices.total = itemPrice * (1 - (item.fabricDiscount || 0) / 100);
                        }

                        groupTotal += prices.total;

                        if (y > 750) { doc.addPage(); y = 40; }

                        // Name Fix Logic
                        let displayName = item.name || '-';
                        // Remove "Pilih [Label]:"
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

                        doc.fontSize(8).font('Helvetica').fillColor(dark)
                            .text(displayName, 45, y, { width: 150 })
                            .text(`${item.width} x ${item.height}`, 200, y, { width: 80, align: 'center' })
                            .text(prices.meters.toFixed(2), 280, y, { width: 40, align: 'center' })
                            .text(formatCurrency(prices.unitPrice), 330, y, { width: 60, align: 'right' })
                            .text(item.fabricDiscount ? `${item.fabricDiscount}%` : '-', 400, y, { width: 30, align: 'center' })
                            .text((item.quantity).toString(), 440, y, { width: 20, align: 'center' })
                            .text(formatCurrency(prices.total), 470, y, { width: 75, align: 'right' });

                        y += 18;
                    });

                    // Group Subtotal Footer
                    doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke('#d1d5db');
                    y += 8;

                    const groupTotalAfterGroupDisc = groupTotal * (1 - groupDiscount / 100);

                    doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                        .text('Subtotal Grup' + (groupDiscount > 0 ? ` (Disc ${groupDiscount}%)` : ''), 350, y, { width: 100, align: 'right' });

                    if (groupDiscount > 0) {
                        // Show original struck through? Maybe too complex for PDFKit layout right now, just show final
                        // Or show both stacked
                        doc.fontSize(7).font('Helvetica').fillColor(gray)
                            .text(formatCurrency(groupTotal), 410, y, { width: 55, align: 'right', strike: true }); // PDFKit doesn't support strike easily? No.
                        // Just show final price
                        doc.fontSize(8).font('Helvetica-Bold').fillColor(accent)
                            .text(formatCurrency(groupTotalAfterGroupDisc), 470, y, { width: 75, align: 'right' });
                    } else {
                        doc.fontSize(8).font('Helvetica-Bold').fillColor(accent)
                            .text(formatCurrency(groupTotal), 470, y, { width: 75, align: 'right' });
                    }

                    y += 25;
                });

            } else {
                // ==================== LEGACY VIEW (Curtains / Standard) ====================
                // Use raw_items when available for accurate price data
                const useRawItems = docData.raw_items && docData.raw_items.length > 0;

                doc.moveTo(40, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
                y += 5;
                // Updated column headers - all CAPITAL with HARGA NET added
                doc.fontSize(6).font('Helvetica-Bold').fillColor(dark)
                    .text('NAMA', 40, y)
                    .text('HARGA', 240, y, { width: 50, align: 'right' })
                    .text('DISC', 295, y, { width: 30, align: 'center' })
                    .text('HARGA NET', 330, y, { width: 55, align: 'right' })
                    .text('QTY', 390, y, { width: 25, align: 'center' })
                    .text('TOTAL', 420, y, { width: 135, align: 'right' });
                y += 12;
                doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke('#d1d5db');
                y += 6;

                if (useRawItems) {
                    // ===== NEW: Use raw_items for accurate data =====
                    docData.raw_items.forEach((item, idx) => {
                        // Window/Item Header
                        const itemTitle = `${item.quantity || 1}. ${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} - Ukuran ${item.width}cm x ${item.height}cm`;
                        const packageType = item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja';

                        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                            .text(itemTitle, 40, y);
                        doc.fontSize(6).font('Helvetica').fillColor(gray).text(packageType, 40, y + 10);
                        y += 18;

                        // Build all rows for this item
                        const allRows = [];

                        // ===== TRY TO USE WINDOWS DATA FIRST (pre-calculated) =====
                        // Find matching window data which has pre-calculated totalPrice
                        const matchingWindow = docData.windows?.find(w => w.id === item.id);
                        if (matchingWindow && matchingWindow.items && matchingWindow.items.length > 0) {
                            // Use pre-calculated values from windows.items
                            matchingWindow.items.forEach((wItem) => {
                                let displayName = wItem.name || '-';
                                displayName = displayName.replace(/^Pilih\s+[^:]+:\s*/i, '');
                                displayName = displayName.replace(/undefined/g, '-');

                                allRows.push({
                                    name: displayName,
                                    priceGross: Math.round(wItem.price_gross || wItem.price || 0),
                                    discount: wItem.discount || 0,
                                    priceNet: Math.round(wItem.price_net || wItem.price || 0),
                                    qty: wItem.quantity || 1,
                                    total: Math.round(wItem.totalPrice || 0) // Use pre-calculated totalPrice
                                });
                            });
                        } else {
                            // ===== FALLBACK: Calculate from raw_items =====
                            // FABRIC ROW
                            const fabricGross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                            const fabricNet = Number(item.selectedVariant?.price_net) || fabricGross;
                            const fabricDiscount = item.fabricDiscount || (fabricGross > 0 ? Math.round(((fabricGross - fabricNet) / fabricGross) * 100) : 0);
                            const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
                            const effectiveQty = variantMultiplier * item.quantity;
                            // Apply discount correctly: (Net Price * Qty) * (1 - discount%)
                            const fabricTotal = fabricNet * effectiveQty * (1 - fabricDiscount / 100);

                            // Get variant name
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
                                priceGross: Math.round(fabricGross),
                                discount: fabricDiscount,
                                priceNet: Math.round(fabricNet),
                                qty: effectiveQty,
                                total: Math.round(fabricTotal)
                            });

                            // ===== COMPONENT ROWS =====
                            if (item.packageType === 'gorden-lengkap' && item.components) {
                                const componentsList = Array.isArray(item.components)
                                    ? item.components
                                    : Object.values(item.components);

                                componentsList.forEach((comp) => {
                                    const compGross = Number(comp.productPriceGross) || Number(comp.productPrice) || Number(comp.product?.price_gross) || Number(comp.product?.price) || 0;
                                    const compNet = Number(comp.productPriceNet) || Number(comp.product?.price_net) || compGross;
                                    const compDiscount = comp.discount || (compGross > 0 ? Math.round(((compGross - compNet) / compGross) * 100) : 0);
                                    const compName = comp.productName || comp.product?.name || 'Komponen';
                                    const likelyShouldScale = ['rel', 'tassel', 'hook', 'vitrase', 'gorden', 'kain', 'rail'].some(k => compName.toLowerCase().includes(k));
                                    const rawQty = comp.qty || 1;
                                    const isSuspiciousUnscaled = comp.displayQty && comp.displayQty === rawQty && (item.quantity || 1) > 1;

                                    const compQty = (!comp.displayQty || (likelyShouldScale && isSuspiciousUnscaled))
                                        ? rawQty * (item.quantity || 1)
                                        : comp.displayQty;
                                    const compTotal = comp.componentTotal || (compNet * compQty);

                                    allRows.push({
                                        name: compName,
                                        priceGross: Math.round(compGross),
                                        discount: compDiscount,
                                        priceNet: Math.round(compNet),
                                        qty: compQty,
                                        total: Math.round(compTotal)
                                    });
                                });
                            }
                        }

                        // Render all rows
                        allRows.forEach(row => {
                            // Clean display name
                            let displayName = row.name || '-';
                            displayName = displayName.replace(/^Pilih\s+[^:]+:\s*/i, '');
                            displayName = displayName.replace(/undefined/g, '-');

                            // Calculate dynamic row height based on name length
                            const nameWidth = 190;
                            const nameHeight = doc.heightOfString(displayName, { width: nameWidth });
                            const rowHeight = Math.max(nameHeight, 10) + 10; // Minimum content height + padding

                            // Check page break before rendering
                            if (y + rowHeight > 750) {
                                doc.addPage();
                                y = 40;
                            }

                            doc.fontSize(6).font('Helvetica').fillColor(dark)
                                .text(displayName, 45, y, { width: nameWidth })
                                .text(formatCurrency(row.priceGross), 240, y, { width: 50, align: 'right' })
                                .text(row.discount > 0 ? `${row.discount}%` : '-', 295, y, { width: 30, align: 'center' })
                                .text(formatCurrency(row.priceNet), 330, y, { width: 55, align: 'right' })
                                .text(row.qty.toString(), 390, y, { width: 25, align: 'center' })
                                .text(formatCurrency(row.total), 420, y, { width: 135, align: 'right' });

                            y += rowHeight;
                        });

                        // Item Subtotal - Use pre-calculated subtotal from window if available
                        let subtotalAfterDiscount;
                        if (matchingWindow && matchingWindow.subtotal !== undefined) {
                            // Use the pre-calculated subtotal which was correctly computed during save
                            subtotalAfterDiscount = matchingWindow.subtotal;
                        } else {
                            // Fallback: calculate from rows (may be inaccurate for old data)
                            const rowsTotal = allRows.reduce((sum, r) => sum + r.total, 0);
                            const itemDiscount = item.itemDiscount || 0;
                            subtotalAfterDiscount = rowsTotal * (1 - itemDiscount / 100);
                        }

                        doc.fontSize(6).font('Helvetica-Bold').fillColor(gray)
                            .text('Subtotal', 350, y, { width: 60, align: 'right' });
                        doc.fontSize(6).font('Helvetica-Bold').fillColor(dark)
                            .text(formatCurrency(Math.round(subtotalAfterDiscount)), 420, y, { width: 135, align: 'right' });
                        y += 18;
                        y += 5;
                    });

                } else if (docData.windows) {
                    // ===== FALLBACK: Legacy windows.items =====
                    docData.windows.forEach(window => {
                        // Window Header
                        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                            .text(`${window.title || ''} - ${window.size || ''}`, 40, y);
                        if (window.fabricType) {
                            doc.fontSize(6).font('Helvetica').fillColor(gray).text(window.fabricType, 40, y + 10);
                        }
                        y += 18;

                        // Window Items
                        if (window.items) {
                            window.items.forEach(item => {
                                const itemPriceGross = parseFloat(item.price_gross) || parseFloat(item.price) || 0;
                                const itemPriceNet = parseFloat(item.price_net) || itemPriceGross;
                                const itemDiscount = item.discount || (itemPriceGross > 0 ? Math.round(((itemPriceGross - itemPriceNet) / itemPriceGross) * 100) : 0);
                                const itemTotal = item.totalPrice || itemPriceNet * (item.quantity || 1);

                                let displayName = item.name || '-';
                                displayName = displayName.replace(/^Pilih\s+[^:]+:\s*/i, '');
                                displayName = displayName.replace(/undefined/g, '-');

                                doc.fontSize(6).font('Helvetica').fillColor(dark)
                                    .text(displayName, 45, y, { width: 190 })
                                    .text(formatCurrency(Math.round(itemPriceGross)), 240, y, { width: 50, align: 'right' })
                                    .text(itemDiscount > 0 ? `${itemDiscount}%` : '-', 295, y, { width: 30, align: 'center' })
                                    .text(formatCurrency(Math.round(itemPriceNet)), 330, y, { width: 55, align: 'right' })
                                    .text((item.quantity || 1).toString(), 390, y, { width: 25, align: 'center' })
                                    .text(formatCurrency(Math.round(itemTotal)), 420, y, { width: 135, align: 'right' });
                                y += 18;
                                if (y > 750) { doc.addPage(); y = 40; }
                            });
                        }

                        // Window Subtotal
                        if (window.subtotal) {
                            doc.fontSize(6).font('Helvetica-Bold').fillColor(gray)
                                .text('Subtotal', 350, y, { width: 60, align: 'right' });
                            doc.fontSize(6).font('Helvetica-Bold').fillColor(dark)
                                .text(formatCurrency(window.subtotal), 420, y, { width: 135, align: 'right' });
                            y += 15;
                        }
                        y += 5;
                    });
                }
            }

            // ============ TOTALS ============
            y += 8;
            doc.moveTo(380, y).lineTo(555, y).lineWidth(0.3).stroke('#d1d5db');
            y += 8;

            doc.fontSize(7).font('Helvetica').fillColor(gray).text('Subtotal', 380, y);
            doc.fillColor(dark).text(formatCurrency(subtotal), 485, y, { width: 70, align: 'right' });
            y += 12;

            if (discount > 0) {
                doc.fontSize(7).font('Helvetica').fillColor(gray).text('Diskon', 380, y);
                // Discount price in green
                doc.fillColor('#10b981').text(`-${formatCurrency(discount)}`, 485, y, { width: 70, align: 'right' });
                y += 12;
            }

            doc.moveTo(380, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
            y += 8;
            doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text('TOTAL', 380, y);
            // Total price in black
            doc.fontSize(9).font('Helvetica-Bold').fillColor(dark).text(formatCurrency(total), 460, y - 1, { width: 95, align: 'right' });

            // ============ PAYMENT ============
            y += 30;
            if (y > 760) { doc.addPage(); y = 40; }

            doc.fontSize(7).font('Helvetica-Bold').fillColor(dark).text('PEMBAYARAN', 40, y);
            doc.fontSize(7).font('Helvetica').fillColor(gray)
                .text(docData.paymentTerms || 'Bank BRI: 0763 0100 1160 564 a.n. ABDUL RAHIM', 40, y + 10, { width: 220 });

            if (document.referral_code) {
                doc.fontSize(7).font('Helvetica-Bold').fillColor(dark).text('KODE REFERRAL', 380, y);
                doc.fontSize(9).font('Helvetica-Bold').fillColor(accent).text(document.referral_code, 380, y + 10);
            }

            if (docData.notes) {
                y += 35;
                doc.fontSize(6).font('Helvetica').fillColor(gray).text('Catatan: ' + docData.notes, 40, y, { width: 300 });
            }

            // ============ FOOTER ============
            doc.fontSize(7).font('Helvetica').fillColor(gray)
                .text('Terima kasih atas kepercayaan Anda', 40, 810, { align: 'center', width: 515 });
            doc.rect(40, 830, 515, 2).fill(accent);

            doc.end();
        } catch (error) { reject(error); }
    });
};

module.exports = { generateDocumentPDF };
