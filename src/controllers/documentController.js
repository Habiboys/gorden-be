const { Document, Referral, User } = require('../models');
const { Op } = require('sequelize');
const { generateDocumentPDF } = require('../services/pdfService');
const { sendEmail, generateInvoiceEmailTemplate } = require('../services/emailService');

// Referral commission rate (10%)
const REFERRAL_COMMISSION_RATE = 0.10;

exports.getAll = async (req, res) => {
    try {
        const { type, status, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (type) where.type = type;
        if (status) where.status = status;

        if (search) {
            where[Op.or] = [
                { customer_name: { [Op.like]: `%${search}%` } },
                { document_number: { [Op.like]: `%${search}%` } },
                { customer_email: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Document.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        // Auto-generate document number if not provided
        if (!req.body.document_number) {
            const prefix = req.body.type === 'INVOICE' ? 'INV' : 'QTO';
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            req.body.document_number = `${prefix}-${date}-${random}`;
        }

        const doc = await Document.create(req.body);
        res.status(201).json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        await doc.update(req.body);
        res.json({ success: true, data: doc });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        await doc.destroy();
        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update document status with referral commission logic
 * When status changes to PAID and referral_code exists, activate the referral
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

        const previousStatus = doc.status;
        await doc.update({ status });

        // If status changed to PAID and has referral code, process commission
        if (status === 'PAID' && previousStatus !== 'PAID' && doc.referral_code) {
            try {
                // Find user with this referral code
                const referrer = await User.findOne({
                    where: { referral_code: doc.referral_code }
                });

                if (referrer) {
                    // Calculate commission (10% of total amount)
                    const commissionAmount = parseFloat(doc.total_amount) * REFERRAL_COMMISSION_RATE;

                    // Create referral record
                    await Referral.create({
                        referrer_id: referrer.id,
                        order_id: null,
                        document_id: doc.id,
                        commission_amount: commissionAmount,
                        status: 'PENDING'
                    });

                    console.log(`Referral commission ${commissionAmount} created for user ${referrer.id}`);
                }
            } catch (refError) {
                console.error('Referral processing error:', refError);
                // Don't fail the whole request if referral processing fails
            }
        }

        res.json({
            success: true,
            data: doc,
            message: status === 'PAID' && doc.referral_code ? 'Status updated and referral processed' : 'Status updated'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Generate PDF for a document
 */
exports.generatePDF = async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

        const pdfBuffer = await generateDocumentPDF(doc.toJSON());

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.document_number}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Send document via email with PDF attachment
 */
exports.sendEmail = async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.id);
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

        if (!doc.customer_email) {
            return res.status(400).json({ success: false, message: 'Customer email is required' });
        }

        // Generate PDF
        const pdfBuffer = await generateDocumentPDF(doc.toJSON());

        // Generate email HTML
        const htmlContent = generateInvoiceEmailTemplate(doc.toJSON());

        // Send email
        const emailResult = await sendEmail({
            to: doc.customer_email,
            subject: `${doc.type === 'QUOTATION' ? 'Surat Penawaran' : 'Invoice'} - ${doc.document_number}`,
            html: htmlContent,
            pdfBuffer,
            pdfFilename: `${doc.document_number}.pdf`
        });

        // Update document status to SENT if currently DRAFT
        if (doc.status === 'DRAFT') {
            await doc.update({ status: 'SENT' });
        }

        res.json({
            success: true,
            message: 'Email sent successfully',
            data: {
                messageId: emailResult.messageId,
                sentTo: doc.customer_email
            }
        });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Convert Quotation to Invoice
 * Creates a new Invoice document based on the Quotation data
 */
exports.convertToInvoice = async (req, res) => {
    try {
        const quotation = await Document.findByPk(req.params.id);

        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        if (quotation.type !== 'QUOTATION') {
            return res.status(400).json({ success: false, message: 'Only Quotation can be converted to Invoice' });
        }

        // Generate new invoice number
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const invoiceNumber = `INV-${date}-${random}`;

        // Parse data if it's a string (prevent double-serialization)
        let invoiceData = quotation.data;
        if (typeof invoiceData === 'string') {
            try {
                invoiceData = JSON.parse(invoiceData);
            } catch (e) {
                console.error('Failed to parse quotation data for invoice:', e);
            }
        }
        console.log('Converting quotation to invoice, data:', invoiceData);

        // Create new Invoice with Quotation data
        const invoice = await Document.create({
            type: 'INVOICE',
            document_number: invoiceNumber,
            customer_name: quotation.customer_name,
            customer_email: quotation.customer_email,
            customer_phone: quotation.customer_phone,
            address: quotation.address,
            total_amount: quotation.total_amount,
            discount_amount: quotation.discount_amount,
            data: invoiceData,  // Use parsed data
            status: 'DRAFT',
            referral_code: quotation.referral_code,
            valid_until: null // Invoice doesn't have validity period
        });

        res.status(201).json({
            success: true,
            message: 'Quotation converted to Invoice successfully',
            data: invoice
        });
    } catch (error) {
        console.error('Convert to Invoice error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
