import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { generatePaymentNumber } from '../utils/helpers.js';

// 결제 생성
export const createPayment = async (req, res) => {
  try {
    const { orderId, method, paymentInfo } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    if (order.paymentStatus === 'paid') {
      return errorResponse(res, '이미 결제가 완료된 주문입니다.', 400);
    }

    // 결제 생성
    const payment = await Payment.create({
      orderId: order._id,
      paymentNumber: generatePaymentNumber(),
      amount: order.totalAmount,
      method,
      status: 'pending',
      pgProvider: paymentInfo?.provider,
      pgResponse: paymentInfo
    });

    // 주문에 결제 ID 연결
    order.paymentId = payment._id;
    await order.save();

    successResponse(res, {
      payment,
      paymentNumber: payment.paymentNumber
    }, '결제가 생성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 결제 상세 조회
export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate('orderId');

    if (!payment) {
      return errorResponse(res, '결제를 찾을 수 없습니다.', 404);
    }

    // 본인 또는 관리자만 조회 가능
    const order = await Order.findById(payment.orderId);
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    successResponse(res, { payment }, '결제 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 결제 승인 (PG사 콜백)
export const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { pgTransactionId, pgResponse } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, '결제를 찾을 수 없습니다.', 404);
    }

    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.pgTransactionId = pgTransactionId;
    payment.pgResponse = pgResponse || payment.pgResponse;
    await payment.save();

    // 주문 상태 업데이트
    const order = await Order.findById(payment.orderId);
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();

    successResponse(res, { payment, order }, '결제가 승인되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 결제 실패 처리
export const failPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return errorResponse(res, '결제를 찾을 수 없습니다.', 404);
    }

    payment.status = 'failed';
    payment.pgResponse = req.body.pgResponse || payment.pgResponse;
    await payment.save();

    successResponse(res, { payment }, '결제 실패 처리 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

