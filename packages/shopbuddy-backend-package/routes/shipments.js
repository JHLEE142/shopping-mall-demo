import express from 'express';
import * as shipmentController from '../controllers/shipmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 배송 정보 조회
router.get('/:orderId', authenticate, shipmentController.getShipment);

// 배송 추적
router.get('/:orderId/tracking', authenticate, shipmentController.trackShipment);

// 판매자: 배송 정보 등록
router.post('/:orderId', authenticate, shipmentController.createShipment);

// 관리자: 배송 상태 업데이트
router.put('/:orderId/status', authenticate, authorize('admin'), shipmentController.updateShipmentStatus);

export default router;
