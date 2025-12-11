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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1/calculator', calculatorRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Gorden Backend API is running');
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
