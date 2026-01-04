const fs = require('fs');
const path = require('path');

/**
 * Delete image file from server
 * @param {string} imageUrl - Full URL or relative path to image
 * @returns {boolean} - Whether deletion was successful
 */
const deleteImage = (imageUrl) => {
    if (!imageUrl) return false;

    try {
        // Extract filename from URL
        let filename;

        if (imageUrl.startsWith('http')) {
            // Full URL - extract filename from path
            const urlParts = new URL(imageUrl);
            filename = path.basename(urlParts.pathname);
        } else {
            // Relative path or just filename
            filename = path.basename(imageUrl);
        }

        // Build full path to file
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

        // Check if file exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted image: ${filename}`);
            return true;
        } else {
            console.log(`⚠️ Image not found: ${filename}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error deleting image: ${error.message}`);
        return false;
    }
};

/**
 * Delete multiple images from server
 * @param {string|string[]} images - Image URLs or array of URLs (can be JSON string)
 * @returns {number} - Number of successfully deleted images
 */
const deleteImages = (images) => {
    if (!images) return 0;

    let imageList = [];

    // Parse images if it's a JSON string
    if (typeof images === 'string') {
        try {
            imageList = JSON.parse(images);
        } catch {
            // Single image URL
            imageList = [images];
        }
    } else if (Array.isArray(images)) {
        imageList = images;
    }

    let deletedCount = 0;
    for (const imageUrl of imageList) {
        if (deleteImage(imageUrl)) {
            deletedCount++;
        }
    }

    return deletedCount;
};

/**
 * Compare old and new images, delete only the ones that were removed
 * @param {string|string[]} oldImages - Old image URLs
 * @param {string|string[]} newImages - New image URLs
 * @returns {number} - Number of deleted images
 */
const cleanupRemovedImages = (oldImages, newImages) => {
    // Parse old images - ensure it's always an array
    let oldList = [];
    if (typeof oldImages === 'string') {
        try {
            const parsed = JSON.parse(oldImages);
            oldList = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch {
            oldList = oldImages ? [oldImages] : [];
        }
    } else if (Array.isArray(oldImages)) {
        oldList = oldImages;
    } else if (oldImages && typeof oldImages === 'object') {
        // Handle case where images is an object (edge case)
        oldList = [];
    }

    // Parse new images - ensure it's always an array
    let newList = [];
    if (typeof newImages === 'string') {
        try {
            const parsed = JSON.parse(newImages);
            newList = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch {
            newList = newImages ? [newImages] : [];
        }
    } else if (Array.isArray(newImages)) {
        newList = newImages;
    } else if (newImages && typeof newImages === 'object') {
        // Handle case where images is an object (edge case)
        newList = [];
    }

    // Find images that were in old but not in new (removed)
    const removedImages = oldList.filter(oldImg => {
        if (!oldImg || typeof oldImg !== 'string') return false;
        const oldFilename = path.basename(oldImg);
        return !newList.some(newImg => newImg && path.basename(newImg) === oldFilename);
    });

    // Delete removed images
    return deleteImages(removedImages);
};

module.exports = {
    deleteImage,
    deleteImages,
    cleanupRemovedImages
};
