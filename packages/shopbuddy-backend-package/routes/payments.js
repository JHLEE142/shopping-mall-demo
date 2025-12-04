import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 결제 생성
router.post('/', authenticate, paymentController.createPayment);

// 결제 상세 조회
router.get('/:id', authenticate, paymentController.getPayment);

// 결제 승인 (PG사 콜백)
router.post('/:id/approve', paymentController.approvePayment);

// 결제 실패 처리
router.post('/:id/fail', paymentController.failPayment);

export default router;
