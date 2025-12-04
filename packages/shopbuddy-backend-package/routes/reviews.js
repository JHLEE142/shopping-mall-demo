import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 상품 리뷰 목록 조회
router.get('/product/:productId', reviewController.getProductReviews);

// 리뷰 작성
router.post('/', authenticate, reviewController.createReview);

// 리뷰 상세 조회
router.get('/:id', reviewController.getReview);

// 리뷰 수정
router.put('/:id', authenticate, reviewController.updateReview);

// 리뷰 삭제
router.delete('/:id', authenticate, reviewController.deleteReview);

// 리뷰 도움됨
router.post('/:id/helpful', reviewController.markHelpful);

// 판매자: 리뷰 답변
router.post('/:id/reply', authenticate, reviewController.replyToReview);

export default router;
