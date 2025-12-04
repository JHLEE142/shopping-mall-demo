const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

const router = Router();

router.get('/', authenticate, getCart);
router.post('/items', authenticate, addCartItem);
router.put('/items/:productId', authenticate, updateCartItem);
router.delete('/items/:productId', authenticate, removeCartItem);
router.delete('/', authenticate, clearCart);

module.exports = router;

