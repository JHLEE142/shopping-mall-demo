import express from 'express';
import * as payoutController from '../controllers/payoutController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 판매자: 정산 내역 조회
router.get('/me', authenticate, payoutController.getMyPayouts);

// 판매자: 정산 상세 조회
router.get('/me/:id', authenticate, payoutController.getMyPayout);

// 관리자: 정산 목록 조회
router.get('/', authenticate, authorize('admin'), payoutController.getPayouts);

// 관리자: 정산 생성 (기간별)
router.post('/calculate', authenticate, authorize('admin'), payoutController.calculatePayout);

// 관리자: 정산 승인
router.post('/:id/approve', authenticate, authorize('admin'), payoutController.approvePayout);

// 관리자: 정산 지급 완료
router.post('/:id/pay', authenticate, authorize('admin'), payoutController.payPayout);

export default router;
