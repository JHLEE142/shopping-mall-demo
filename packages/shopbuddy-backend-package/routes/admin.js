import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 모든 관리자 라우트는 인증 및 관리자 권한 필요
router.use(authenticate);
router.use(authorize('admin'));

// 대시보드 통계
router.get('/dashboard', adminController.getDashboard);

// 사용자 관리
router.get('/users', adminController.getUsers);

// 판매자 관리
router.get('/sellers', adminController.getSellers);

// 판매자 상태 변경
router.put('/sellers/:id/status', adminController.updateSellerStatus);

// 판매자 커미션율 변경
router.put('/sellers/:id/commission', adminController.updateSellerCommission);

// 주문 관리
router.get('/orders', adminController.getOrders);

// 주문 상태 변경
router.put('/orders/:id/status', adminController.updateOrderStatus);

// 상품 관리
router.get('/products', adminController.getProducts);

// 상품 상태 변경
router.put('/products/:id/status', adminController.updateProductStatus);

// 커미션 정책 조회
router.get('/commission-policy', adminController.getCommissionPolicy);

// 커미션 정책 수정
router.put('/commission-policy', adminController.updateCommissionPolicy);

export default router;
