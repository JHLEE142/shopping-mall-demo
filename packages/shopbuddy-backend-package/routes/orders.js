import express from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 주문 생성 (장바구니에서)
router.post('/', authenticate, orderController.createOrder);

// 바로 구매 (장바구니 없이)
router.post('/direct', authenticate, orderController.createDirectOrder);

// 주문 목록 조회
router.get('/', authenticate, orderController.getOrders);

// 주문 상세 조회
router.get('/:id', authenticate, orderController.getOrder);

// 주문 취소
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

// 주문서 자동 작성 (AI)
router.post('/auto-fill', authenticate, orderController.autoFillOrder);

export default router;
