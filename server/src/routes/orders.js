const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  createOrder,
  listOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  deleteOrder,
} = require('../controllers/orderController');

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, listOrders);
router.get('/:id', authenticate, getOrderById);
router.put('/:id', authenticate, updateOrder);
router.delete('/:id', authenticate, deleteOrder);
router.post('/:id/cancel', authenticate, cancelOrder);

module.exports = router;


