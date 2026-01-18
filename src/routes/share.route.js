/**
 * Share Routes - For social media meta tags
 */

const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');

// Product share meta tags
router.get('/product/:slug', metaController.getProductMeta);

// Article share meta tags  
router.get('/article/:slug', metaController.getArticleMeta);

module.exports = router;
