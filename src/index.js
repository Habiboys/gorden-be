const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const orderRoutes = require('./routes/orderRoutes');
const referralRoutes = require('./routes/referralRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const articleRoutes = require('./routes/articleRoutes');
const calculatorLeadRoutes = require('./routes/calculatorLeadRoutes');
const documentRoutes = require('./routes/documentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const faqRoutes = require('./routes/faqRoutes');
const contactRoutes = require('./routes/contactRoutes');
const settingRoutes = require('./routes/settingRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const dashboardRoutes = require('./routes/dashboard');
const wishlistRoutes = require('./routes/wishlistRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const calculatorTypeRoutes = require('./routes/calculatorTypeRoutes');

// Serve static files
app.use('/uploads', express.static('uploads'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', productRoutes); // Reverted to generic mount because productRoutes handles /products and /categories
app.use('/api/v1/calculator-components', calculatorRoutes);
app.use('/api/v1/calculator', calculatorTypeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.use('/api/v1/articles', articleRoutes);
app.use('/api/v1/calculator-leads', calculatorLeadRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/gallery', galleryRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/subcategories', subcategoryRoutes);

app.get('/', (req, res) => {
    res.send('Gorden Backend API is running');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
