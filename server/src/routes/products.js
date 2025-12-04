const { Router } = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const authenticate = require('../middleware/authMiddleware');

const router = Router();

router.route('/').get(getProducts).post(authenticate, createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(authenticate, updateProduct)
  .delete(authenticate, deleteProduct);

module.exports = router;
