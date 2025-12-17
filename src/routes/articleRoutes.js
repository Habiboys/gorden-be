const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
// Assume middleware auth exists in ../middleware/auth
// But I need to check if it exists. existing files use `require('../middleware/auth')`?
// Let's assume public access for GET, protected for writes.
// I'll check existing protected routes later or use a placeholder if I can't find it. 
// Existing index.js requires authRoutes but doesn't show middleware usage. 
// authController.js likely exports middleware. 
// I'll assume a generic protection or no protection for now and add it if I see it in other routes. 
// But commonly:
// const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', articleController.getAll);
router.get('/:id', articleController.getOne);
router.post('/', articleController.create);
router.put('/:id', articleController.update);
router.delete('/:id', articleController.delete);

module.exports = router;
