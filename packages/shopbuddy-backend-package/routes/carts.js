import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 장바구니 조회
router.get('/', authenticate, cartController.getCart);

// 장바구니에 상품 추가
router.post('/items', authenticate, cartController.addToCart);

// 장바구니 항목 수정
router.put('/items/:itemId', authenticate, cartController.updateCartItem);

// 장바구니 항목 삭제
router.delete('/items/:itemId', authenticate, cartController.removeCartItem);

// 장바구니 비우기
router.delete('/', authenticate, cartController.clearCart);

export default router;
