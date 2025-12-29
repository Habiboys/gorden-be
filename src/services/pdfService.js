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
            y = 140;
            doc.moveTo(40, y).lineTo(555, y).lineWidth(0.8).stroke(dark);
            y += 5;
            doc.fontSize(7).font('Helvetica-Bold').fillColor(dark)
                .text('DESKRIPSI', 40, y)
                .text('QTY', 390, y)
                .text('HARGA', 420, y)
                .text('JUMLAH', 500, y, { width: 55, align: 'right' });
            y += 12;
            doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke('#d1d5db');
            y += 6;

            if (docData.windows) {
                docData.windows.forEach(window => {
                    doc.fontSize(8).font('Helvetica-Bold').fillColor(accent)
                        .text(`${window.title || ''} - ${window.size || ''}`, 40, y);
                    if (window.fabricType) {
                        doc.fontSize(6).font('Helvetica').fillColor(gray).text(window.fabricType, 40, y + 10);
                    }
                    y += 18;

                    if (window.items) {
                        window.items.forEach(item => {
                            const itemTotal = item.totalPrice || (parseFloat(item.price) || 0) * (item.quantity || 1);

                            let itemName = item.name || '-';
                            if (item.discount && item.discount > 0) {
                                itemName += ` (Disc ${item.discount}%)`;
                            }

                            doc.fontSize(7).font('Helvetica').fillColor(dark)
                                .text(itemName, 45, y, { width: 330 })
                                .text((item.quantity || 1).toString(), 395, y)
                                .text(formatCurrency(parseFloat(item.price) || 0), 415, y)
                                .text(formatCurrency(itemTotal), 485, y, { width: 70, align: 'right' });
                            y += 12;
                            if (y > 750) { doc.addPage(); y = 40; }
                        });
                    }
                    // Removed per-window discount block
                    y += 3;
                });
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
