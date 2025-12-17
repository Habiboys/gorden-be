const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');

router.get('/', galleryController.getAll);
router.post('/', galleryController.create);
router.put('/:id', galleryController.update);
router.delete('/:id', galleryController.delete);

module.exports = router;
