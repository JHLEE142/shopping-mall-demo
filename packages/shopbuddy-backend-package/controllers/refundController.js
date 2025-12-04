import Refund from '../models/Refund.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { generateRefundNumber, calculatePagination } from '../utils/helpers.js';

// 환불 신청
export const createRefund = async (req, res) => {
  try {
    const { orderId, reason, refundItems } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    if (order.paymentStatus !== 'paid') {
      return errorResponse(res, '결제가 완료된 주문만 환불할 수 있습니다.', 400);
    }

    const payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      return errorResponse(res, '결제 정보를 찾을 수 없습니다.', 404);
    }

    // 환불 금액 계산
    let refundAmount = order.totalAmount;
    if (refundItems && refundItems.length > 0) {
      // 부분 환불
      refundAmount = refundItems.reduce((sum, item) => {
        const orderItem = order.items[item.orderItemIndex];
        return sum + (orderItem.totalPrice * item.quantity / orderItem.quantity);
      }, 0);
    }

    const refund = await Refund.create({
      orderId: order._id,
      paymentId: payment._id,
      refundNumber: generateRefundNumber(),
      amount: refundAmount,
      reason,
      type: refundItems ? 'partial' : 'full',
      refundItems: refundItems || [],
      status: 'pending'
    });

    successResponse(res, {
      refund,
      refundNumber: refund.refundNumber
    }, '환불 신청이 접수되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 환불 목록 조회
export const getRefunds = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    // 일반 사용자는 자신의 환불만 조회
    if (req.user.role !== 'admin') {
      const orders = await Order.find({ userId: req.user._id }).select('_id');
      query.orderId = { $in: orders.map(o => o._id) };
    }

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const refunds = await Refund.find(query)
      .populate('orderId', 'orderNumber')
      .populate('paymentId', 'paymentNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Refund.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { refunds }, pagination, '환불 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 환불 상세 조회
export const getRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findById(id)
      .populate('orderId')
      .populate('paymentId');

    if (!refund) {
      return errorResponse(res, '환불을 찾을 수 없습니다.', 404);
    }

    const order = await Order.findById(refund.orderId);
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    successResponse(res, { refund }, '환불 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 환불 승인
export const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = await Refund.findById(id)
      .populate('paymentId');

    if (!refund) {
      return errorResponse(res, '환불을 찾을 수 없습니다.', 404);
    }

    if (refund.status !== 'pending') {
      return errorResponse(res, '이미 처리된 환불입니다.', 400);
    }

    // TODO: PG사 환불 API 호출
    // 여기서는 상태만 업데이트
    refund.status = 'approved';
    refund.processedAt = new Date();
    refund.processedBy = req.user._id;
    await refund.save();

    // 결제 상태 업데이트
    const payment = refund.paymentId;
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = refund.amount;
    await payment.save();

    // 주문 상태 업데이트
    const order = await Order.findById(refund.orderId);
    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    await order.save();

    successResponse(res, { refund }, '환불이 승인되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 환불 반려
export const rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const refund = await Refund.findById(id);
    if (!refund) {
      return errorResponse(res, '환불을 찾을 수 없습니다.', 404);
    }

    if (refund.status !== 'pending') {
      return errorResponse(res, '이미 처리된 환불입니다.', 400);
    }

    refund.status = 'rejected';
    refund.rejectionReason = reason;
    refund.processedAt = new Date();
    refund.processedBy = req.user._id;
    await refund.save();

    successResponse(res, { refund }, '환불이 반려되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

