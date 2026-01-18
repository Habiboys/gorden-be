/**
 * Meta Tags Controller
 * Serves HTML with dynamic Open Graph meta tags for social media sharing
 */

const { Product, Category } = require('../models');

// Base URLs
const SITE_URL = process.env.FRONTEND_URL || 'https://amagriya.com';
const API_URL = process.env.API_BASE_URL || 'https://api.amagriya.com';

/**
 * Helper to get first image URL from product
 */
const getProductImage = (product) => {
    let images = product.images;

    // Parse JSON if string
    if (typeof images === 'string') {
        try {
            images = JSON.parse(images);
        } catch (e) {
            // If not valid JSON, might be a direct URL
            if (images.startsWith('/') || images.startsWith('http')) {
                return images.startsWith('/') ? `${API_URL}${images}` : images;
            }
            return `${SITE_URL}/og-image.jpg`;
        }
    }

    // Get first image from array
    if (Array.isArray(images) && images.length > 0) {
        const firstImage = images[0];
        return firstImage.startsWith('/') ? `${API_URL}${firstImage}` : firstImage;
    }

    // Fallback
    return `${SITE_URL}/og-image.jpg`;
};

/**
 * Generate HTML with meta tags for product
 */
const generateMetaHtml = (product, pageUrl) => {
    const title = product.meta_title || product.name;
    const description = (product.meta_description || product.description || 'Gorden berkualitas dari Amagriya').replace(/\n/g, ' ').substring(0, 200);
    const image = getProductImage(product);
    const siteName = 'Amagriya Gorden';

    // NO meta refresh - it causes redirect loop with .htaccess bot detection
    // Only JS redirect - bots don't execute JS so they just read meta tags
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${title} | ${siteName}</title>
    <meta name="title" content="${title} | ${siteName}">
    <meta name="description" content="${description}">
    ${product.meta_keywords ? `<meta name="keywords" content="${product.meta_keywords}">` : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title} | ${siteName}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="${siteName}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${pageUrl}">
    <meta name="twitter:title" content="${title} | ${siteName}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    
    <link rel="canonical" href="${pageUrl}">
    
    <!-- JS redirect for users only (bots don't execute JS) -->
    <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
    <p>Redirecting to <a href="${pageUrl}">${title}</a>...</p>
    <noscript>
        <p>Click <a href="${pageUrl}">here</a> if not redirected automatically.</p>
    </noscript>
</body>
</html>`;
};

/**
 * GET /share/product/:slug
 * Returns HTML with proper meta tags for social sharing
 * Note: "slug" in URL is actually the product SKU
 */
exports.getProductMeta = async (req, res) => {
    try {
        const { slug } = req.params;
        console.log('[MetaController] Looking for product with sku:', slug);

        // Products use SKU as URL identifier, not a separate "slug" field
        const product = await Product.findOne({
            where: { sku: slug },
            include: [{ model: Category, as: 'Category' }]
        });

        if (!product) {
            console.log('[MetaController] Product not found for sku:', slug);
            // Try to find by ID as fallback
            const productById = await Product.findByPk(slug, {
                include: [{ model: Category, as: 'Category' }]
            });

            if (!productById) {
                console.log('[MetaController] Product also not found by ID, redirecting to homepage');
                return res.redirect(SITE_URL);
            }

            // Use product found by ID
            const pageUrl = `${SITE_URL}/product/${productById.sku}`;
            const html = generateMetaHtml(productById, pageUrl);
            res.set('Content-Type', 'text/html');
            return res.send(html);
        }

        const pageUrl = `${SITE_URL}/product/${slug}`;
        const html = generateMetaHtml(product, pageUrl);

        res.set('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating product meta:', error);
        res.redirect(SITE_URL);
    }
};

/**
 * GET /share/article/:slug
 * Returns HTML with proper meta tags for article sharing
 */
exports.getArticleMeta = async (req, res) => {
    try {
        const { slug } = req.params;
        const { Article } = require('../models');

        const article = await Article.findOne({
            where: { slug }
        });

        if (!article) {
            return res.redirect(SITE_URL);
        }

        const pageUrl = `${SITE_URL}/articles/${slug}`;
        const title = article.title;
        const description = article.excerpt || article.title;
        let image = article.image_url || `${SITE_URL}/og-image.jpg`;

        // Make image URL absolute
        if (image.startsWith('/')) {
            image = `${API_URL}${image}`;
        }

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Amagriya Gorden</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title} | Amagriya Gorden">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Amagriya Gorden">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${image}">
    <link rel="canonical" href="${pageUrl}">
    <script>window.location.replace("${pageUrl}");</script>
</head>
<body>
    <p>Redirecting to <a href="${pageUrl}">${title}</a>...</p>
    <noscript>
        <p>Click <a href="${pageUrl}">here</a> if not redirected automatically.</p>
    </noscript>
</body>
</html>`;

        res.set('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating article meta:', error);
        res.redirect(SITE_URL);
    }
};
