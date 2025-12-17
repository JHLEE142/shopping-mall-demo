const { Router } = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = Router();

// 계층 구조 카테고리 조회 (대분류 > 중분류 > 소분류)
router.get('/hierarchy', categoryController.getCategoryHierarchy);

// 대량 카테고리 저장 (관리자) - 객체 형식
router.post('/bulk', authenticate, authorize('admin'), categoryController.bulkCreateCategories);

// 대량 카테고리 저장 (관리자) - ">" 구분자 문자열 형식
router.post('/bulk-string', authenticate, authorize('admin'), categoryController.bulkCreateCategoriesFromString);

// 대분류에 중분류/소분류 자동 추가 (관리자)
router.post('/add-default-subcategories', authenticate, authorize('admin'), categoryController.addDefaultSubCategories);

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

module.exports = router;

