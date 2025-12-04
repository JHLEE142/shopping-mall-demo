import express from 'express';
import * as refundController from '../controllers/refundController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 환불 신청
router.post('/', authenticate, refundController.createRefund);

// 환불 목록 조회
router.get('/', authenticate, refundController.getRefunds);

// 환불 상세 조회
router.get('/:id', authenticate, refundController.getRefund);

// 관리자: 환불 승인
router.post('/:id/approve', authenticate, authorize('admin'), refundController.approveRefund);

// 관리자: 환불 반려
router.post('/:id/reject', authenticate, authorize('admin'), refundController.rejectRefund);

export default router;
