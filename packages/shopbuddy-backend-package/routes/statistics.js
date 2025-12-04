import express from 'express';
import * as statisticsController from '../controllers/statisticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 모든 통계 라우트는 인증 및 관리자 권한 필요
router.use(authenticate);
router.use(authorize('admin'));

// 대시보드 통계
router.get('/dashboard', statisticsController.getDashboardStats);

// 매출 추이
router.get('/revenue-trend', statisticsController.getRevenueTrend);

// 카테고리별 매출
router.get('/category-sales', statisticsController.getCategorySales);

// 주문 상태 분포
router.get('/order-status', statisticsController.getOrderStatusDistribution);

// 인기 상품
router.get('/top-products', statisticsController.getTopProducts);

// 통계 데이터
router.get('/statistics-data', statisticsController.getStatisticsData);

// 카테고리 성과
router.get('/category-performance', statisticsController.getCategoryPerformance);

// 통계 하이라이트
router.get('/statistics-highlights', statisticsController.getStatisticsHighlights);

// 트래픽 소스 및 전환율
router.get('/traffic-sources', statisticsController.getTrafficSources);

export default router;

