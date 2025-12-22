const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const auth = require('../middleware/auth');

// GET routes use optional auth - allows public access but populates req.user if authenticated
router.get('/', auth(null, { optional: true }), articleController.getAll);
router.get('/slug/:slug', auth(null, { optional: true }), articleController.getBySlug);
router.get('/:id', auth(null, { optional: true }), articleController.getOne);

// Write operations require admin authentication
router.post('/', auth('ADMIN'), articleController.create);
router.put('/:id', auth('ADMIN'), articleController.update);
router.delete('/:id', auth('ADMIN'), articleController.delete);

module.exports = router;
