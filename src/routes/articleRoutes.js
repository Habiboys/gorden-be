const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const optionalAuth = require('../middleware/optionalAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// GET routes use optional auth - allows public access but populates req.user if authenticated
router.get('/', optionalAuth, articleController.getAll);
router.get('/:id', optionalAuth, articleController.getOne);

// Write operations require authentication
router.post('/', authMiddleware, articleController.create);
router.put('/:id', authMiddleware, articleController.update);
router.delete('/:id', authMiddleware, articleController.delete);

module.exports = router;
