const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  removeWishlistItems,
  checkWishlistItem,
  checkWishlistItems,
} = require('../controllers/wishlistController');

const router = Router();

router.get('/', authenticate, getWishlist);
router.post('/items', authenticate, addWishlistItem);
router.delete('/items/:productId', authenticate, removeWishlistItem);
router.delete('/items', authenticate, removeWishlistItems);
router.get('/check/:productId', authenticate, checkWishlistItem);
router.get('/check', authenticate, checkWishlistItems);

module.exports = router;

