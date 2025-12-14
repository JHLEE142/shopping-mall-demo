const { Router } = require('express');
const {
  getReviewsByProduct,
  getReviewStats,
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  getUnreviewedProducts,
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

const router = Router();

// 상품별 리뷰 목록 조회
router.get('/product/:productId', getReviewsByProduct);

// 상품별 리뷰 통계 조회
router.get('/product/:productId/stats', getReviewStats);

// 사용자의 리뷰 미작성 상품 목록 조회 (인증 필요)
router.get('/unreviewed', authenticate, getUnreviewedProducts);

// 리뷰 작성 (인증 필요)
router.post('/', authenticate, createReview);

// 리뷰 수정 (인증 필요)
router.put('/:reviewId', authenticate, updateReview);

// 리뷰 삭제 (인증 필요)
router.delete('/:reviewId', authenticate, deleteReview);

// 리뷰 조회 (단일)
router.get('/:reviewId', getReviewById);

module.exports = router;

