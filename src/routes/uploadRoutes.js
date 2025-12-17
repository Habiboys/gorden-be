const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

router.post('/image', uploadController.uploadMiddleware, uploadController.uploadFile);
router.post('/multiple', uploadController.uploadMultipleMiddleware, uploadController.uploadMultiple);

module.exports = router;
