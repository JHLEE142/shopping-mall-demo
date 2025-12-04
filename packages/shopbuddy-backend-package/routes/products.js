import express from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 상품 목록 조회
router.get('/', productController.getProducts);

// 상품 상세 조회
router.get('/:id', productController.getProduct);

// AI 상품 설명 생성
router.post('/:id/ai-description', authenticate, productController.generateAIDescription);

// 판매자: 상품 등록
router.post('/', authenticate, productController.createProduct);

// 판매자: 상품 수정
router.put('/:id', authenticate, productController.updateProduct);

// 판매자: 상품 삭제
router.delete('/:id', authenticate, productController.deleteProduct);

// 상품 옵션 조회
router.get('/:id/options', productController.getProductOptions);

// 상품 이미지 조회
router.get('/:id/images', productController.getProductImages);

// 상품 이미지 추가
router.post('/:id/images', authenticate, productController.addProductImage);

// 상품 이미지 수정
router.put('/:id/images/:imageId', authenticate, productController.updateProductImage);

// 상품 이미지 삭제
router.delete('/:id/images/:imageId', authenticate, productController.deleteProductImage);

export default router;
