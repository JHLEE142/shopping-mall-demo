import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 대화 세션 생성
router.post('/conversations', optionalAuth, aiController.createConversation);

// AI 채팅 (메시지 전송)
router.post('/conversations/:sessionId/messages', optionalAuth, aiController.sendMessage);

// 상품 검색 (AI 기반)
router.post('/search', optionalAuth, aiController.searchProducts);

// 상품 비교
router.post('/compare', optionalAuth, aiController.compareProducts);

// 상품 추천
router.post('/recommend', optionalAuth, aiController.recommendProducts);

// 상품 요약 (AI 생성)
router.post('/products/:id/summary', optionalAuth, aiController.generateProductSummary);

// 대화 히스토리 조회
router.get('/conversations/:sessionId/messages', optionalAuth, aiController.getMessages);

// 대화 세션 종료
router.post('/conversations/:sessionId/end', optionalAuth, aiController.endConversation);

export default router;
