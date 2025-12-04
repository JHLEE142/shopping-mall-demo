import express from 'express';
import * as sellerController from '../controllers/sellerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 판매자 정보 조회
router.get('/:id', sellerController.getSeller);

// 내 판매자 정보 조회
router.get('/me/profile', authenticate, sellerController.getMyProfile);

// 판매자 정보 수정
router.put('/me/profile', authenticate, sellerController.updateMyProfile);

// 판매자 상품 목록 조회
router.get('/:id/products', sellerController.getSellerProducts);

// 내 판매 통계 조회
router.get('/me/stats', authenticate, sellerController.getMyStats);

// 내 주문 목록 조회
router.get('/me/orders', authenticate, sellerController.getMyOrders);

// 주문 출고 처리
router.post('/me/orders/:orderId/ship', authenticate, sellerController.shipOrder);

// 정산 내역 조회
router.get('/me/payouts', authenticate, sellerController.getMyPayouts);

// 정산 상세 조회
router.get('/me/payouts/:id', authenticate, sellerController.getMyPayout);

export default router;
