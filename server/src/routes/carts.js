const { Router } = require('express');
const { optionalAuth } = require('../middleware/authMiddleware');
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

const router = Router();

// optionalAuth: 토큰이 있으면 사용자 정보 추가, 없어도 통과 (비회원 지원)
router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addCartItem);
router.put('/items/:productId', optionalAuth, updateCartItem);
router.delete('/items/:productId', optionalAuth, removeCartItem);
router.delete('/', optionalAuth, clearCart);

module.exports = router;

