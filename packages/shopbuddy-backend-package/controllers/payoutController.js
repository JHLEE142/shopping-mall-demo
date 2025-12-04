import SellerPayout from '../models/SellerPayout.js';
import Seller from '../models/Seller.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { generatePayoutNumber, calculatePagination } from '../utils/helpers.js';

// 판매자: 정산 내역 조회
export const getMyPayouts = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payouts = await SellerPayout.find({ sellerId: seller._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SellerPayout.countDocuments({ sellerId: seller._id });
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { payouts }, pagination, '정산 내역 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 판매자: 정산 상세 조회
export const getMyPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    const payout = await SellerPayout.findOne({
      _id: id,
      sellerId: seller._id
    }).populate('items.orderId');

    if (!payout) {
      return errorResponse(res, '정산 내역을 찾을 수 없습니다.', 404);
    }

    successResponse(res, { payout }, '정산 상세 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 정산 목록 조회
export const getPayouts = async (req, res) => {
  try {
    const { sellerId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (sellerId) query.sellerId = sellerId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payouts = await SellerPayout.find(query)
      .populate('sellerId', 'businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SellerPayout.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { payouts }, pagination, '정산 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 정산 생성 (기간별)
export const calculatePayout = async (req, res) => {
  try {
    const { sellerId, periodStart, periodEnd } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return errorResponse(res, '판매자를 찾을 수 없습니다.', 404);
    }

    // 기간 내 배송 완료된 주문 조회
    const orders = await Order.find({
      'items.sellerId': sellerId,
      status: 'delivered',
      createdAt: {
        $gte: new Date(periodStart),
        $lte: new Date(periodEnd)
      }
    });

    // 정산 항목 계산
    const items = [];
    let totalSales = 0;
    let totalCommission = 0;
    let totalRefunds = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (item.sellerId?.toString() === sellerId) {
          // 환불 확인 (간단화 - 실제로는 Refund 모델에서 확인 필요)
          const refundAmount = 0; // TODO: 실제 환불 금액 계산

          const netAmount = item.sellerEarnings - refundAmount;
          totalSales += item.totalPrice;
          totalCommission += item.commissionAmount;
          totalRefunds += refundAmount;

          items.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            salesAmount: item.totalPrice,
            commissionRate: item.commissionRate,
            commissionAmount: item.commissionAmount,
            refundAmount,
            netAmount
          });
        }
      }
    }

    const payoutAmount = totalSales - totalCommission - totalRefunds;

    const payout = await SellerPayout.create({
      sellerId: seller._id,
      payoutNumber: generatePayoutNumber(),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      totalSales,
      totalCommission,
      totalRefunds,
      payoutAmount,
      items,
      status: 'calculated',
      calculatedAt: new Date(),
      calculatedBy: req.user._id
    });

    successResponse(res, { payout }, '정산이 생성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 정산 승인
export const approvePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await SellerPayout.findById(id);

    if (!payout) {
      return errorResponse(res, '정산을 찾을 수 없습니다.', 404);
    }

    if (payout.status !== 'calculated') {
      return errorResponse(res, '승인할 수 없는 상태입니다.', 400);
    }

    payout.status = 'approved';
    payout.approvedAt = new Date();
    payout.approvedBy = req.user._id;
    await payout.save();

    successResponse(res, { payout }, '정산이 승인되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 정산 지급 완료
export const payPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId } = req.body;

    const payout = await SellerPayout.findById(id);
    if (!payout) {
      return errorResponse(res, '정산을 찾을 수 없습니다.', 404);
    }

    if (payout.status !== 'approved') {
      return errorResponse(res, '지급할 수 없는 상태입니다.', 400);
    }

    payout.status = 'paid';
    payout.paidAt = new Date();
    payout.paidBy = req.user._id;
    payout.paymentMethod = paymentMethod;
    payout.transactionId = transactionId;
    await payout.save();

    // 판매자 총 수익 업데이트
    const seller = await Seller.findById(payout.sellerId);
    seller.totalEarnings += payout.payoutAmount;
    await seller.save();

    successResponse(res, { payout }, '정산 지급이 완료되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

