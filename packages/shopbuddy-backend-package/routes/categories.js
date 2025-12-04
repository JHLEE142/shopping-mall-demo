import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 카테고리 목록 조회 (계층 구조)
router.get('/', categoryController.getCategories);

// 모든 카테고리의 상품 수 업데이트 (관리자)
router.post('/update-product-counts', authenticate, authorize('admin'), categoryController.updateAllCategoryProductCounts);

// 카테고리 상세 조회 (ID 또는 code로 조회)
router.get('/:id', categoryController.getCategory);

// 카테고리별 상품 수 업데이트
router.put('/:id/product-count', authenticate, authorize('admin'), categoryController.updateCategoryProductCount);

// 관리자: 카테고리 생성
router.post('/', authenticate, authorize('admin'), categoryController.createCategory);

// 관리자: 카테고리 수정
router.put('/:id', authenticate, authorize('admin'), categoryController.updateCategory);

// 관리자: 카테고리 삭제
router.delete('/:id', authenticate, authorize('admin'), categoryController.deleteCategory);

export default router;
