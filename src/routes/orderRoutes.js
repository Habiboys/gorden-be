const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, orderController.checkout);
router.get('/', authMiddleware, orderController.getMyOrders);
router.get('/:id', authMiddleware, orderController.getOrderDetail);

module.exports = router;
