import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 사용자 프로필 조회
router.get('/:id', authenticate, userController.getUserProfile);

// 사용자 프로필 수정
router.put('/:id', authenticate, userController.updateUserProfile);

// 사용자 주소 목록 조회
router.get('/:id/addresses', authenticate, userController.getUserAddresses);

// 사용자 주소 추가/수정
router.post('/:id/addresses', authenticate, userController.updateUserAddress);

// 사용자 주문 내역 조회
router.get('/:id/orders', authenticate, userController.getUserOrders);

export default router;

