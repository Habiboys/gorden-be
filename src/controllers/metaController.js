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
    return `${SITE_URL}/favicon.png`;
};

/**
 * Generate HTML with meta tags for product
 */
const generateMetaHtml = (product, pageUrl, isBot = false) => {
    const title = product.meta_title || product.name;
    const description = (product.meta_description || product.description || 'Gorden berkualitas dari Amagriya').replace(/\n/g, ' ').substring(0, 200);
    const image = getProductImage(product);
    const siteName = 'Amagriya Gorden';

    // Only include JS redirect if NOT a bot
    const jsRedirect = !isBot ? `<script>window.location.replace("${pageUrl}");</script>` : '';

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
    
    ${jsRedirect}
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${image}" alt="${title}" style="max-width: 100%; height: auto;">
    <p>View product at: <a href="${pageUrl}">${pageUrl}</a></p>
</body>
</html>`;
};

/**
 * Check if request is from a social media bot/crawler
 */
const isSocialBot = (userAgent) => {
    if (!userAgent) return false;
    const botPatterns = /facebookexternalhit|Facebot|Twitterbot|Pinterest|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|vkShare|crawler|bot|spider/i;
    return botPatterns.test(userAgent);
};

/**
 * GET /share/product/:slug
 * Returns HTML with proper meta tags for social sharing
 * Note: "slug" in URL is actually the product SKU
 */
exports.getProductMeta = async (req, res) => {
    try {
        const { slug } = req.params;
        const userAgent = req.get('User-Agent') || '';
        // Check for bot query param (sent by .htaccess) OR User-Agent
        const isForcedBot = req.query.bot === 'true';
        const isBot = isForcedBot || isSocialBot(userAgent);

        console.log('[MetaController] Request for product:', slug, '| User-Agent:', userAgent.substring(0, 50), '| isBot:', isBot, '| forced:', isForcedBot);

        const pageUrl = `${SITE_URL}/product/${slug}`;

        // If not a bot and not forced, just redirect directly to the product page
        if (!isBot) {
            console.log('[MetaController] Not a bot, redirecting to:', pageUrl);
            return res.redirect(302, pageUrl);
        }

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

            // Use product found by ID - pass isBot true since we are here
            const html = generateMetaHtml(productById, `${SITE_URL}/product/${productById.sku}`, true);
            res.set('Content-Type', 'text/html');
            return res.send(html);
        }

        // Pass isBot=true because we already checked !isBot above
        const html = generateMetaHtml(product, pageUrl, true);
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
        const userAgent = req.get('User-Agent') || '';
        // Check for bot query param (sent by .htaccess) OR User-Agent
        const isForcedBot = req.query.bot === 'true';
        const isBot = isForcedBot || isSocialBot(userAgent);

        const pageUrl = `${SITE_URL}/articles/${slug}`;

        // If not a bot and not forced, just redirect directly to the article page
        if (!isBot) {
            return res.redirect(302, pageUrl);
        }

        const article = await Article.findOne({
            where: { slug }
        });

        if (!article) {
            return res.redirect(SITE_URL);
        }

        const title = article.title;
        const description = (article.excerpt || article.title || '').replace(/\n/g, ' ').substring(0, 200);
        let image = article.image_url;

        // Determine image URL
        if (image && image.startsWith('/')) {
            image = `${API_URL}${image}`;
        } else if (!image) {
            image = `${SITE_URL}/favicon.png`; // Fallback to favicon since logo.png is missing
        }

        // Manual logic for article HTML generation since it uses a unique structure or we could unify it?
        // Let's use custom HTML for article similar to generateMetaHtml but tailored

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
</head>
<body>
    <h1>${title}</h1>
    <p>${description}</p>
    <img src="${image}" alt="${title}" style="max-width: 100%; height: auto;">
    <p>View article at: <a href="${pageUrl}">${pageUrl}</a></p>
</body>
</html>`;

        res.set('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating article meta:', error);
        res.redirect(SITE_URL);
    }
};
