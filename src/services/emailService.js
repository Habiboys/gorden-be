const nodemailer = require('nodemailer');

// Create transporter with environment variables
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // Use App Password for Gmail
        }
    });
};

/**
 * Send email with optional PDF attachment
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {Buffer} [options.pdfBuffer] - PDF attachment buffer
 * @param {string} [options.pdfFilename] - PDF filename
 */
const sendEmail = async ({ to, subject, html, pdfBuffer, pdfFilename }) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Amagriya Gorden" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments: pdfBuffer ? [{
            filename: pdfFilename || 'document.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
        }] : []
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
};

/**
 * Generate invoice email HTML template
 * @param {Object} document - Document data
 */
const generateInvoiceEmailTemplate = (document) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #EB216A; }
            .header h1 { color: #EB216A; margin: 0; }
            .content { padding: 30px 0; }
            .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .amount { font-size: 24px; color: #EB216A; font-weight: bold; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #EB216A, #ff6b9d); color: white; text-decoration: none; border-radius: 25px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Amagriya Gorden/Blind</h1>
                <p>Pusat Gorden Berkualitas</p>
            </div>
            <div class="content">
                <p>Yth. <strong>${document.customer_name}</strong>,</p>
                <p>Terima kasih telah mempercayakan kebutuhan gorden Anda kepada kami.</p>
                <p>Berikut adalah ${document.type === 'QUOTATION' ? 'Surat Penawaran' : 'Invoice'} untuk Anda:</p>
                
                <div class="info-box">
                    <p><strong>No. Dokumen:</strong> ${document.document_number}</p>
                    <p><strong>Tanggal:</strong> ${(() => {
            const dateVal = document.createdAt || document.created_at || document.date;
            if (!dateVal) return '-';
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        })()}</p>
                    <p><strong>Total:</strong> <span class="amount">${formatCurrency(document.total_amount)}</span></p>
                    ${document.discount_amount > 0 ? `<p><strong>Diskon:</strong> ${formatCurrency(document.discount_amount)}</p>` : ''}
                </div>
                
                <p>Dokumen lengkap terlampir dalam email ini.</p>
                
                <p>Jika ada pertanyaan, silakan hubungi kami:</p>
                <ul>
                    <li>WhatsApp: +62 895-0896-5456</li>
                    <li>Email: amagriyacom@gmail.com</li>
                </ul>
            </div>
            <div class="footer">
                <p>Amagriya Gorden - Pusat Gorden Berkualitas</p>
                <p>© ${new Date().getFullYear()} All rights reserved</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generate email verification HTML template
 * @param {string} name - User name
 * @param {string} verificationUrl - Verification URL
 */
const generateVerificationEmailTemplate = (name, verificationUrl) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #EB216A; }
            .header h1 { color: #EB216A; margin: 0; }
            .content { padding: 30px 0; }
            .info-box { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            .btn { display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #EB216A, #ff6b9d); color: white; text-decoration: none; border-radius: 25px; margin: 15px 0; font-weight: bold; }
            .btn:hover { opacity: 0.9; }
            .note { font-size: 12px; color: #888; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Amagriya Gorden</h1>
                <p>Pusat Gorden Berkualitas</p>
            </div>
            <div class="content">
                <p>Halo <strong>${name}</strong>,</p>
                <p>Terima kasih telah mendaftar di Amagriya Gorden! Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
                
                <div class="info-box">
                    <a href="${verificationUrl}" class="btn">Verifikasi Email</a>
                    <p class="note">Atau copy link berikut ke browser Anda:</p>
                    <p style="word-break: break-all; font-size: 12px; color: #666;">${verificationUrl}</p>
                </div>
                
                <p>Link verifikasi ini akan kadaluarsa dalam <strong>24 jam</strong>.</p>
                <p>Jika Anda tidak membuat akun di Amagriya Gorden, abaikan email ini.</p>
                
                <p>Salam hangat,<br/>Tim Amagriya Gorden</p>
            </div>
            <div class="footer">
                <p>Amagriya Gorden - Pusat Gorden Berkualitas</p>
                <p>© ${new Date().getFullYear()} All rights reserved</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, name, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email/${token}`;

    const html = generateVerificationEmailTemplate(name, verificationUrl);

    return sendEmail({
        to: email,
        subject: 'Verifikasi Email - Amagriya Gorden',
        html
    });
};

module.exports = {
    sendEmail,
    generateInvoiceEmailTemplate,
    generateVerificationEmailTemplate,
    sendVerificationEmail
};
