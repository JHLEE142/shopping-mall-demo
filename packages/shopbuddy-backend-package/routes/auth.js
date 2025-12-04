import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.post('/logout', authenticate, authController.logout);

// 토큰 갱신
router.post('/refresh', authController.refresh);

// 현재 사용자 정보
router.get('/me', authenticate, authController.getMe);

export default router;

