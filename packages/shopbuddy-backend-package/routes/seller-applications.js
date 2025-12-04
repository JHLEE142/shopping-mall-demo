import express from 'express';
import * as sellerApplicationController from '../controllers/sellerApplicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 판매자 신청
router.post('/', authenticate, sellerApplicationController.createApplication);

// 내 판매자 신청서 조회
router.get('/my-application', authenticate, sellerApplicationController.getMyApplication);

// 판매자 신청서 수정 (pending 상태일 때만)
router.put('/:id', authenticate, sellerApplicationController.updateApplication);

// 관리자: 판매자 신청서 목록 조회
router.get('/', authenticate, authorize('admin'), sellerApplicationController.getApplications);

// 관리자: 판매자 신청서 상세 조회
router.get('/:id', authenticate, authorize('admin'), sellerApplicationController.getApplication);

// 관리자: 판매자 신청 승인
router.post('/:id/approve', authenticate, authorize('admin'), sellerApplicationController.approveApplication);

// 관리자: 판매자 신청 반려
router.post('/:id/reject', authenticate, authorize('admin'), sellerApplicationController.rejectApplication);

export default router;

