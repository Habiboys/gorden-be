const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/', auth(), orderController.checkout);
router.get('/', auth(), orderController.getMyOrders);
router.get('/:id', auth(), orderController.getOrderDetail);

module.exports = router;
