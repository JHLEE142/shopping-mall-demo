const { Router } = require('express');
const {
  subscribeToNewProducts,
  unsubscribeFromNewProducts,
  getSubscriptionStatus,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = Router();

// 신상품 알림 구독
router.post('/subscribe/new-products', authenticate, subscribeToNewProducts);

// 신상품 알림 구독 해제
router.post('/unsubscribe/new-products', authenticate, unsubscribeFromNewProducts);

// 구독 상태 확인
router.get('/subscription/status', authenticate, getSubscriptionStatus);

// 사용자 알림 목록 조회
router.get('/', authenticate, getUserNotifications);

// 알림 읽음 처리
router.patch('/:id/read', authenticate, markNotificationAsRead);

// 모든 알림 읽음 처리
router.patch('/read-all', authenticate, markAllNotificationsAsRead);

module.exports = router;

