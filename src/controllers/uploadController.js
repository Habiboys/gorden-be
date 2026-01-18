const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage - use memory storage for processing before saving
const storage = multer.memoryStorage();

// Filter for images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit (will be compressed)
    }
});

exports.uploadMiddleware = upload.single('file');
exports.uploadMultipleMiddleware = upload.array('files', 10);

/**
 * Process and save image with compression and WebP conversion
 * @param {Buffer} buffer - Image buffer
 * @param {string} originalName - Original filename
 * @returns {Promise<{filename: string, url: string}>}
 */
const processAndSaveImage = async (buffer, originalName, req) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '.webp';
    const filepath = path.join(uploadsDir, filename);

    // Get original file size for logging
    const originalSize = buffer.length;

    // Process image with sharp
    await sharp(buffer)
        .resize(1920, 1920, { // Max dimensions
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({
            quality: 80, // Good balance of quality and size
            effort: 4 // Compression effort (0-6, higher = smaller file, slower)
        })
        .toFile(filepath);

    // Get new file size
    const newSize = fs.statSync(filepath).size;
    const savings = Math.round((1 - newSize / originalSize) * 100);

    console.log(`✅ Image optimized: ${originalName} -> ${filename}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB -> Compressed: ${(newSize / 1024).toFixed(1)}KB (${savings}% savings)`);

    // Return only the relative path (frontend will prepend the base URL)
    const fileUrl = `/uploads/${filename}`;

    return { filename, url: fileUrl };
};

exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        const result = await processAndSaveImage(req.file.buffer, req.file.originalname, req);

        res.json({
            success: true,
            data: {
                url: result.url,
                filename: result.filename
            }
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing image',
            error: error.message
        });
    }
};

exports.uploadMultiple = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    try {
        const results = await Promise.all(
            req.files.map(file => processAndSaveImage(file.buffer, file.originalname, req))
        );

        const urls = results.map(r => r.url);

        res.json({
            success: true,
            data: {
                urls: urls
            }
        });
    } catch (error) {
        console.error('Error processing images:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing images',
            error: error.message
        });
    }
};
