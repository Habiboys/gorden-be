const PDFDocument = require('pdfkit');

/**
 * Generate PDF document for quotation/invoice
 * @param {Object} document - Document data from database
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateDocumentPDF = (document) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            const formatCurrency = (amount) => {
                return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
            };

            // ============ HEADER / KOP SURAT ============
            // Pink header bar
            doc.rect(0, 0, 612, 100).fill('#EB216A');

            // Company name
            doc.fillColor('white')
                .fontSize(28)
                .font('Helvetica-Bold')
                .text('AMAGRIYA GORDEN', 50, 30);

            // Tagline
            doc.fontSize(12)
                .font('Helvetica')
                .text('Pusat Gorden Berkualitas - Melayani Sepenuh Hati', 50, 65);

            // Document type badge
            const docTypeLabel = document.type === 'QUOTATION' ? 'SURAT PENAWARAN' : 'INVOICE';
            doc.fillColor('#EB216A')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text(docTypeLabel, 50, 120);

            // Document number
            doc.fillColor('#666')
                .fontSize(10)
                .font('Helvetica')
                .text(`No: ${document.document_number}`, 50, 145);

            // Date on right side
            const documentDate = new Date(document.created_at || Date.now()).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            doc.text(`Tanggal: ${documentDate}`, 400, 145, { align: 'right' });

            // ============ CUSTOMER INFO ============
            doc.rect(50, 170, 495, 80).stroke('#ddd');

            doc.fillColor('#333')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Kepada Yth:', 60, 180);

            doc.font('Helvetica')
                .text(document.customer_name || '-', 60, 195)
                .text(document.customer_email || '-', 60, 210)
                .text(document.customer_phone || '-', 60, 225);

            // Address on right
            doc.font('Helvetica-Bold')
                .text('Alamat:', 320, 180);
            doc.font('Helvetica')
                .text(document.address || '-', 320, 195, { width: 210 });

            // ============ LINE ITEMS TABLE ============
            let yPos = 270;

            // Table header
            doc.rect(50, yPos, 495, 25).fill('#f5f5f5');
            doc.fillColor('#333')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('No', 55, yPos + 8)
                .text('Deskripsi', 80, yPos + 8)
                .text('Qty', 350, yPos + 8)
                .text('Harga', 390, yPos + 8)
                .text('Subtotal', 470, yPos + 8);

            yPos += 30;

            // Parse line items from JSON data
            // Handle case where data might be a string (from some databases)
            let docData = document.data;
            if (typeof docData === 'string') {
                try {
                    docData = JSON.parse(docData);
                } catch (e) {
                    console.error('Failed to parse document data:', e);
                    docData = {};
                }
            }

            const items = docData?.items || docData?.windows || [];
            let itemNumber = 1;

            // Handle nested structure (windows with items inside)
            if (docData?.windows && Array.isArray(docData.windows)) {
                docData.windows.forEach(window => {
                    // Window title
                    doc.fillColor('#EB216A')
                        .font('Helvetica-Bold')
                        .fontSize(9)
                        .text(`${window.title || ''} - ${window.size || ''}`, 55, yPos);
                    yPos += 15;

                    // Window items
                    if (window.items && Array.isArray(window.items)) {
                        window.items.forEach(item => {
                            // Calculate subtotal with discount
                            const discountedPrice = (item.price || 0) * (1 - (item.discount || 0) / 100);
                            const subtotal = discountedPrice * (item.quantity || 1);

                            doc.fillColor('#333')
                                .font('Helvetica')
                                .fontSize(8)
                                .text(itemNumber.toString(), 55, yPos)
                                .text(item.name || '-', 80, yPos, { width: 260 })
                                .text((item.quantity || 1).toString(), 350, yPos)
                                .text(formatCurrency(item.price), 380, yPos)
                                .text(formatCurrency(subtotal), 460, yPos);

                            itemNumber++;
                            yPos += 20;

                            if (yPos > 700) {
                                doc.addPage();
                                yPos = 50;
                            }
                        });
                    }
                    yPos += 10;
                });
            } else if (Array.isArray(items)) {
                // Flat items structure
                items.forEach(item => {
                    // Calculate subtotal with discount
                    const discountedPrice = (item.price || 0) * (1 - (item.discount || 0) / 100);
                    const subtotal = discountedPrice * (item.quantity || 1);

                    doc.fillColor('#333')
                        .font('Helvetica')
                        .fontSize(8)
                        .text(itemNumber.toString(), 55, yPos)
                        .text(item.name || item.description || '-', 80, yPos, { width: 260 })
                        .text((item.quantity || 1).toString(), 350, yPos)
                        .text(formatCurrency(item.price), 380, yPos)
                        .text(formatCurrency(subtotal), 460, yPos);

                    itemNumber++;
                    yPos += 20;

                    if (yPos > 700) {
                        doc.addPage();
                        yPos = 50;
                    }
                });
            }

            // ============ TOTALS ============
            yPos += 20;
            doc.rect(300, yPos, 245, 60).fill('#f9f9f9');

            const discount = parseFloat(document.discount_amount) || 0;
            const total = parseFloat(document.total_amount) || 0;
            const subtotal = total + discount;

            doc.fillColor('#333')
                .font('Helvetica')
                .fontSize(10)
                .text('Subtotal:', 310, yPos + 10)
                .text(formatCurrency(subtotal), 450, yPos + 10, { align: 'right' });

            if (discount > 0) {
                doc.text('Diskon:', 310, yPos + 25)
                    .text(`-${formatCurrency(discount)}`, 450, yPos + 25, { align: 'right' });
            }

            doc.font('Helvetica-Bold')
                .fillColor('#EB216A')
                .fontSize(12)
                .text('TOTAL:', 310, yPos + 45)
                .text(formatCurrency(total), 450, yPos + 45, { align: 'right' });

            // ============ PAYMENT INFO ============
            yPos += 90;

            if (yPos > 680) {
                doc.addPage();
                yPos = 50;
            }

            doc.fillColor('#333')
                .font('Helvetica-Bold')
                .fontSize(10)
                .text('Informasi Pembayaran:', 50, yPos);

            yPos += 15;
            const paymentInfo = docData?.paymentTerms || 'Bank BRI: 0763 0100 1160 564 a.n. ABDUL RAHIM';
            doc.font('Helvetica')
                .fontSize(9)
                .text(paymentInfo, 50, yPos, { width: 300 });

            // ============ REFERRAL INFO ============
            if (document.referral_code) {
                yPos += 40;
                doc.fillColor('#EB216A')
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .text(`Kode Referral: ${document.referral_code}`, 50, yPos);
            }

            // ============ NOTES ============
            if (docData?.notes) {
                yPos += 30;
                doc.fillColor('#666')
                    .font('Helvetica')
                    .fontSize(8)
                    .text('Catatan:', 50, yPos)
                    .text(docData.notes, 50, yPos + 12, { width: 300 });
            }

            // ============ FOOTER ============
            doc.fontSize(8)
                .fillColor('#999')
                .text('Terima kasih atas kepercayaan Anda.', 50, 750, { align: 'center', width: 495 })
                .text('Amagriya Gorden - Pusat Gorden Berkualitas', 50, 762, { align: 'center', width: 495 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateDocumentPDF
};
