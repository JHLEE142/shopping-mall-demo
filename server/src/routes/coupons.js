const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const { 
  getUserCoupons, 
  getAvailableCoupons, 
  receiveCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getUserCouponsByAdmin,
} = require('../controllers/couponController');

const router = Router();

// 모든 쿠폰 라우트는 인증 필요
router.use(authenticate);

// 사용자의 쿠폰함 조회
router.get('/my', getUserCoupons);

// 받을 수 있는 쿠폰 목록 조회
router.get('/available', getAvailableCoupons);

// 쿠폰 받기
router.post('/receive', receiveCoupon);

// 관리자 전용 라우트
const { authorize } = require('../middleware/authMiddleware');

// 모든 쿠폰 목록 조회 (관리자)
router.get('/admin/all', authorize('admin'), getAllCoupons);

// 쿠폰 생성 (관리자)
router.post('/admin', authorize('admin'), createCoupon);

// 쿠폰 수정 (관리자)
router.put('/admin/:couponId', authorize('admin'), updateCoupon);

// 쿠폰 삭제 (관리자)
router.delete('/admin/:couponId', authorize('admin'), deleteCoupon);

// 사용자별 쿠폰 조회 (관리자)
router.get('/admin/user-coupons', authorize('admin'), getUserCouponsByAdmin);

module.exports = router;

