const { Router } = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getRevenueTrend,
  getCategorySales,
  getOrderStatusDistribution,
  getTopProducts,
  getStatisticsData,
  getCategoryPerformance,
  getStatisticsHighlights,
} = require('../controllers/statisticsController');

const router = Router();

// 모든 통계 API는 인증 필요
router.get('/dashboard', authenticate, getDashboardStats);
router.get('/revenue-trend', authenticate, getRevenueTrend);
router.get('/category-sales', authenticate, getCategorySales);
router.get('/order-status', authenticate, getOrderStatusDistribution);
router.get('/top-products', authenticate, getTopProducts);
router.get('/statistics', authenticate, getStatisticsData);
router.get('/category-performance', authenticate, getCategoryPerformance);
router.get('/highlights', authenticate, getStatisticsHighlights);

module.exports = router;

