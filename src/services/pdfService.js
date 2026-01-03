const PDFDocument = require('pdfkit');

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

            const formatCurrency = (amt) => 'Rp ' + new Intl.NumberFormat('id-ID').format(amt || 0);
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
            doc.fontSize(18).font('Helvetica-Bold').fillColor(dark).text('AMAGRIYA', 40, 35);
            doc.fontSize(7).font('Helvetica').fillColor(gray).text('Pusat Gorden Berkualitas', 40, 55);

            doc.fontSize(16).font('Helvetica-Bold').fillColor(accent)
                .text(isInvoice ? 'INVOICE' : 'PENAWARAN', 350, 35, { width: 205, align: 'right' });
            doc.fontSize(8).font('Helvetica').fillColor(gray)
                .text(document.document_number, 350, 55, { width: 205, align: 'right' });

            doc.moveTo(40, 75).lineTo(555, 75).lineWidth(0.5).stroke('#e5e7eb');

            // ============ INFO ============
            let y = 85;
            doc.fontSize(7).font('Helvetica').fillColor(gray).text('KEPADA', 40, y);
            doc.fontSize(9).font('Helvetica-Bold').fillColor(dark).text(document.customer_name || '-', 40, y + 10);
            doc.fontSize(7).font('Helvetica').fillColor(gray)
                .text(document.customer_phone || '', 40, y + 22)
                .text(document.customer_email || '', 40, y + 32)
                .text(document.address || '', 40, y + 42, { width: 180 });

            doc.fontSize(7).font('Helvetica').fillColor(gray).text('TANGGAL', 400, y, { width: 155, align: 'right' });
            doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                .text(formatDate(document.created_at || document.createdAt), 400, y + 10, { width: 155, align: 'right' });

            if (!isInvoice && document.valid_until) {
                doc.fontSize(7).font('Helvetica').fillColor(gray).text('BERLAKU SAMPAI', 400, y + 25, { width: 155, align: 'right' });
                doc.fontSize(8).font('Helvetica-Bold').fillColor(dark)
                    .text(formatDate(document.valid_until), 400, y + 35, { width: 155, align: 'right' });
            }

            // ============ TABLE ============
            y = 170;

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
                doc.moveTo(40, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
                y += 5;
                // Updated column headers with Disc column
                doc.fontSize(7).font('Helvetica-Bold').fillColor(dark)
                    .text('DESKRIPSI', 40, y)
                    .text('HARGA', 310, y, { width: 60, align: 'right' })
                    .text('DISC', 375, y, { width: 35, align: 'center' })
                    .text('QTY', 415, y, { width: 30, align: 'center' })
                    .text('TOTAL', 450, y, { width: 105, align: 'right' });
                y += 12;
                doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke('#d1d5db');
                y += 6;

                if (docData.windows) {
                    docData.windows.forEach(window => {
                        // Window Header
                        doc.fontSize(8).font('Helvetica-Bold').fillColor(accent)
                            .text(`${window.title || ''} - ${window.size || ''}`, 40, y);
                        if (window.fabricType) {
                            doc.fontSize(6).font('Helvetica').fillColor(gray).text(window.fabricType, 40, y + 10);
                        }
                        y += 18;

                        // Window Items (Fabric + Components)
                        if (window.items) {
                            window.items.forEach(item => {
                                const itemTotal = item.totalPrice || (parseFloat(item.price) || 0) * (item.quantity || 1);
                                const itemDiscount = item.discount || 0;

                                // Name Fix Logic (Legacy/Simple Item)
                                // Only have item.name string here typically (e.g. "Gorden x (Variant)") 
                                // so we just check if string has "undefined"
                                let displayName = item.name || '-';
                                if (displayName.includes('undefined')) {
                                     // Attempt to clean it up. 
                                     // Pattern often: "Smokering 3 (undefinedxundefinedcm)"
                                     // We can just remove the undefined part or replace with generic
                                     displayName = displayName.replace(/\(undefinedxundefinedcm\)/g, '').trim();
                                     // Also "Varian: undefined"
                                     displayName = displayName.replace(/undefined/g, '-');
                                }

                                doc.fontSize(7).font('Helvetica').fillColor(dark)
                                    .text(displayName, 45, y, { width: 260 })
                                    .text(formatCurrency(parseFloat(item.price) || 0), 310, y, { width: 60, align: 'right' })
                                    .text(itemDiscount > 0 ? `${itemDiscount}%` : '-', 375, y, { width: 35, align: 'center' })
                                    .text((item.quantity || 1).toString(), 415, y, { width: 30, align: 'center' })
                                    .text(formatCurrency(itemTotal), 450, y, { width: 105, align: 'right' });
                                y += 12;
                                if (y > 750) { doc.addPage(); y = 40; }
                            });
                        }

                        // Window Subtotal
                        if (window.subtotal) {
                            doc.fontSize(7).font('Helvetica-Bold').fillColor(gray)
                                .text('Subtotal', 380, y, { width: 60, align: 'right' });
                            doc.fontSize(7).font('Helvetica-Bold').fillColor(accent)
                                .text(formatCurrency(window.subtotal), 450, y, { width: 105, align: 'right' });
                            y += 15;
                        }
                        y += 3;
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
                doc.fillColor('#10b981').text(`-${formatCurrency(discount)}`, 485, y, { width: 70, align: 'right' });
                y += 12;
            }

            doc.moveTo(380, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
            y += 8;
            doc.fontSize(9).font('Helvetica-Bold').fillColor(dark).text('TOTAL', 380, y);
            doc.fontSize(10).fillColor(accent).text(formatCurrency(total), 460, y - 1, { width: 95, align: 'right' });

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
