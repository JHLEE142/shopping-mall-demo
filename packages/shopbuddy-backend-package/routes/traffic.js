import express from 'express';
import * as trafficController from '../controllers/trafficController.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 페이지뷰 추적 (인증 불필요, 공개 API)
router.post('/track', optionalAuth, trafficController.trackPageView);

// 트래픽 소스 통계 (관리자만)
router.get('/sources', authenticate, authorize('admin'), trafficController.getTrafficSources);

// 방문자 통계 (관리자만)
router.get('/visitors', authenticate, authorize('admin'), trafficController.getVisitorStats);

// 페이지별 통계 (관리자만)
router.get('/pages', authenticate, authorize('admin'), trafficController.getPageStats);

export default router;

