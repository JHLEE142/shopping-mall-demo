import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import SellerPayout from '../models/SellerPayout.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 판매자 정보 조회
export const getSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id)
      .populate('userId', 'name email');

    if (!seller) {
      return errorResponse(res, '판매자를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { seller }, '판매자 정보 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 내 판매자 정보 조회
export const getMyProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone');

    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { seller }, '판매자 정보 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 판매자 정보 수정
export const updateMyProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    const { contactPhone, contactEmail, address, bankAccount } = req.body;
    if (contactPhone) seller.contactPhone = contactPhone;
    if (contactEmail) seller.contactEmail = contactEmail;
    if (address) seller.address = address;
    if (bankAccount) seller.bankAccount = bankAccount;

    await seller.save();

    successResponse(res, { seller }, '판매자 정보가 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 판매자 상품 목록 조회
export const getSellerProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const query = { sellerId: id, ownershipType: 'seller' };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { products }, pagination, '상품 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 내 판매 통계 조회
export const getMyStats = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    // 총 판매액
    const orders = await Order.find({
      'items.sellerId': seller._id,
      status: { $in: ['delivered', 'shipped'] }
    });

    let totalSales = 0;
    let totalOrders = orders.length;
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.sellerId?.toString() === seller._id.toString()) {
          totalSales += item.totalPrice;
        }
      });
    });

    // 총 수익 (정산 완료된 금액)
    const completedPayouts = await SellerPayout.find({
      sellerId: seller._id,
      status: 'paid'
    });
    const totalEarnings = completedPayouts.reduce((sum, payout) => sum + payout.payoutAmount, 0);

    // 대기 중인 정산 금액
    const pendingPayouts = await SellerPayout.find({
      sellerId: seller._id,
      status: { $in: ['pending', 'calculated', 'approved'] }
    });
    const pendingPayout = pendingPayouts.reduce((sum, payout) => sum + payout.payoutAmount, 0);

    successResponse(res, {
      totalSales,
      totalOrders,
      totalEarnings,
      pendingPayout
    }, '통계 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 내 주문 목록 조회
export const getMyOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    const { page = 1, limit = 20, status } = req.query;
    const query = {
      'items.sellerId': seller._id
    };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 해당 판매자의 항목만 필터링
    const filteredOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.filter(item => item.sellerId?.toString() === seller._id.toString())
    }));

    const total = await Order.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { orders: filteredOrders }, pagination, '주문 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 주문 출고 처리
export const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier } = req.body;

    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      return errorResponse(res, '판매자 정보를 찾을 수 없습니다.', 404);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    // 해당 판매자의 주문인지 확인
    const hasSellerItem = order.items.some(item => item.sellerId?.toString() === seller._id.toString());
    if (!hasSellerItem) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    // 배송 정보는 Shipment 모델에서 처리 (별도 구현 필요)
    // 여기서는 주문 상태만 업데이트
    if (order.status === 'confirmed' || order.status === 'processing') {
      order.status = 'shipped';
      await order.save();
    }

    successResponse(res, { order }, '출고 처리가 완료되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 정산 내역 조회
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

// 정산 상세 조회
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

