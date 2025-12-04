import express from 'express';
import * as supplierController from '../controllers/supplierController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 관리자: 공급사 목록 조회
router.get('/', authenticate, authorize('admin'), supplierController.getSuppliers);

// 관리자: 공급사 등록
router.post('/', authenticate, authorize('admin'), supplierController.createSupplier);

// 관리자: 공급사 수정
router.put('/:id', authenticate, authorize('admin'), supplierController.updateSupplier);

// 관리자: 공급사 상품 동기화
router.post('/:id/sync', authenticate, authorize('admin'), supplierController.syncSupplierProducts);

// 관리자: 공급사 상품 목록 조회
router.get('/:id/products', authenticate, authorize('admin'), supplierController.getSupplierProducts);

export default router;
