const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getRecentlyViewedProducts,
  addRecentlyViewedProduct,
  deleteRecentlyViewedProduct,
  deleteAllRecentlyViewedProducts,
} = require('../controllers/recentlyViewedProductController');

const router = Router();

router.get('/', authenticate, getRecentlyViewedProducts);
router.post('/:productId', authenticate, addRecentlyViewedProduct);
router.delete('/:id', authenticate, deleteRecentlyViewedProduct);
router.delete('/', authenticate, deleteAllRecentlyViewedProducts);

module.exports = router;

