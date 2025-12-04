import express from 'express';
import * as couponController from '../controllers/couponController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 전체 쿠폰 목록 조회 (공개)
router.get('/', couponController.getCoupons);

// 내 쿠폰 목록 조회 (인증 필요)
router.get('/my', authenticate, couponController.getMyCoupons);

// 쿠폰 받기 (발급) - 인증 필요
router.post('/claim', authenticate, couponController.claimCoupon);

// 쿠폰 사용 - 인증 필요
router.post('/use', authenticate, couponController.useCoupon);

// 쿠폰 상세 조회
router.get('/:id', couponController.getCoupon);

// 관리자: 쿠폰 생성
router.post('/', authenticate, authorize('admin'), couponController.createCoupon);

// 관리자: 쿠폰 수정
router.put('/:id', authenticate, authorize('admin'), couponController.updateCoupon);

// 관리자: 쿠폰 삭제
router.delete('/:id', authenticate, authorize('admin'), couponController.deleteCoupon);

export default router;

