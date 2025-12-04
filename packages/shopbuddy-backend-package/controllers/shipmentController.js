import Shipment from '../models/Shipment.js';
import Order from '../models/Order.js';
import Seller from '../models/Seller.js';
import { successResponse, errorResponse } from '../utils/response.js';

// 배송 정보 조회
export const getShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const shipment = await Shipment.findOne({ orderId })
      .populate('orderId');

    if (!shipment) {
      return errorResponse(res, '배송 정보를 찾을 수 없습니다.', 404);
    }

    const order = await Order.findById(orderId);
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    successResponse(res, { shipment }, '배송 정보 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 배송 추적
export const trackShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const shipment = await Shipment.findOne({ orderId });

    if (!shipment) {
      return errorResponse(res, '배송 정보를 찾을 수 없습니다.', 404);
    }

    const order = await Order.findById(orderId);
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    successResponse(res, {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      history: shipment.trackingHistory || []
    }, '배송 추적 정보 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 판매자: 배송 정보 등록
export const createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    // 판매자 확인
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 권한이 없습니다.', 403);
    }

    // 해당 판매자의 주문인지 확인
    const hasSellerItem = order.items.some(item => item.sellerId?.toString() === seller._id.toString());
    if (!hasSellerItem) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    let shipment = await Shipment.findOne({ orderId });
    if (!shipment) {
      shipment = await Shipment.create({
        orderId: order._id,
        trackingNumber,
        carrier,
        status: 'shipped',
        shippedAt: new Date(),
        address: order.shippingAddress,
        trackingHistory: [{
          status: 'shipped',
          location: '',
          timestamp: new Date(),
          description: '상품이 출고되었습니다.'
        }]
      });
    } else {
      shipment.trackingNumber = trackingNumber;
      shipment.carrier = carrier;
      shipment.status = 'shipped';
      shipment.shippedAt = new Date();
      await shipment.save();
    }

    // 주문 상태 업데이트
    order.status = 'shipped';
    await order.save();

    successResponse(res, { shipment }, '배송 정보가 등록되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 배송 상태 업데이트
export const updateShipmentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location, description } = req.body;

    const shipment = await Shipment.findOne({ orderId });
    if (!shipment) {
      return errorResponse(res, '배송 정보를 찾을 수 없습니다.', 404);
    }

    shipment.status = status;
    if (status === 'delivered') {
      shipment.deliveredAt = new Date();
    }

    // 추적 이력 추가
    shipment.trackingHistory.push({
      status,
      location: location || '',
      timestamp: new Date(),
      description: description || ''
    });

    await shipment.save();

    // 주문 상태 업데이트
    if (status === 'delivered') {
      const order = await Order.findById(orderId);
      order.status = 'delivered';
      await order.save();
    }

    successResponse(res, { shipment }, '배송 상태가 업데이트되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

