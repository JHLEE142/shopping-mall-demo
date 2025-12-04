import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { generateOrderNumber, calculatePagination, calculateCommission } from '../utils/helpers.js';

// 주문 생성 (장바구니에서)
export const createOrder = async (req, res) => {
  try {
    const { cartId, shippingAddress, notes } = req.body;
    const userId = req.user._id;

    // 장바구니 조회
    const cart = await Cart.findOne({ userId, _id: cartId });
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, '장바구니가 비어있습니다.', 400);
    }

    // 상품 정보 및 재고 확인
    const orderItems = [];
    let subtotal = 0;
    let shippingFee = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId)
        .populate('sellerId')
        .populate('categoryId');

      if (!product || product.status !== 'active') {
        return errorResponse(res, `상품 ${product?.name || item.productId}을(를) 찾을 수 없습니다.`, 400);
      }

      // 재고 확인
      if (product.stockManagement === 'track' && product.totalStock < item.quantity) {
        return errorResponse(res, `상품 ${product.name}의 재고가 부족합니다.`, 400);
      }

      const unitPrice = product.salePrice || product.basePrice;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      // 배송비 계산 (첫 상품만)
      if (orderItems.length === 0 && !product.shipping.isFree) {
        shippingFee = product.shipping.fee || 0;
      }

      // 커미션 계산
      let commissionRate = 10; // 기본 커미션
      if (product.sellerId) {
        const seller = await Seller.findById(product.sellerId);
        if (seller) {
          commissionRate = seller.commissionRate;
        }
      } else if (product.categoryId?.commissionRate) {
        commissionRate = product.categoryId.commissionRate;
      }

      const { commission, sellerEarnings } = calculateCommission(totalPrice, commissionRate);

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || {},
        unitPrice,
        totalPrice,
        sellerId: product.sellerId || null,
        ownershipType: product.ownershipType,
        commissionRate,
        commissionAmount: commission,
        sellerEarnings
      });
    }

    const totalAmount = subtotal + shippingFee;

    // 주문 생성
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId,
      items: orderItems,
      subtotal,
      shippingFee,
      totalAmount,
      shippingAddress,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // 재고 차감
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product && product.stockManagement === 'track') {
        product.totalStock -= item.quantity;
        if (product.totalStock <= 0) {
          product.status = 'out_of_stock';
        }
        await product.save();
      }
    }

    // 장바구니 비우기
    cart.items = [];
    await cart.save();

    successResponse(res, {
      order,
      orderNumber: order.orderNumber
    }, '주문이 생성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 바로 구매
export const createDirectOrder = async (req, res) => {
  try {
    const { productId, quantity, selectedOptions, shippingAddress } = req.body;
    const userId = req.user._id;

    const product = await Product.findById(productId)
      .populate('sellerId')
      .populate('categoryId');

    if (!product || product.status !== 'active') {
      return errorResponse(res, '상품을 찾을 수 없습니다.', 404);
    }

    if (product.stockManagement === 'track' && product.totalStock < quantity) {
      return errorResponse(res, '재고가 부족합니다.', 400);
    }

    const unitPrice = product.salePrice || product.basePrice;
    const totalPrice = unitPrice * quantity;
    const shippingFee = product.shipping.isFree ? 0 : (product.shipping.fee || 0);

    // 커미션 계산
    let commissionRate = 10;
    if (product.sellerId) {
      const seller = await Seller.findById(product.sellerId);
      if (seller) commissionRate = seller.commissionRate;
    } else if (product.categoryId?.commissionRate) {
      commissionRate = product.categoryId.commissionRate;
    }

    const { commission, sellerEarnings } = calculateCommission(totalPrice, commissionRate);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId,
      items: [{
        productId: product._id,
        productName: product.name,
        quantity,
        selectedOptions: selectedOptions || {},
        unitPrice,
        totalPrice,
        sellerId: product.sellerId || null,
        ownershipType: product.ownershipType,
        commissionRate,
        commissionAmount: commission,
        sellerEarnings
      }],
      subtotal: totalPrice,
      shippingFee,
      totalAmount: totalPrice + shippingFee,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // 재고 차감
    if (product.stockManagement === 'track') {
      product.totalStock -= quantity;
      if (product.totalStock <= 0) {
        product.status = 'out_of_stock';
      }
      await product.save();
    }

    successResponse(res, {
      order,
      orderNumber: order.orderNumber
    }, '주문이 생성되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 주문 목록 조회
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('items.productId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { orders }, pagination, '주문 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 주문 상세 조회
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('items.productId')
      .populate('items.sellerId', 'businessName')
      .populate('userId', 'name email');

    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    // 본인 또는 관리자만 조회 가능
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    successResponse(res, { order }, '주문 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 주문 취소
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, '주문을 찾을 수 없습니다.', 404);
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return errorResponse(res, '권한이 없습니다.', 403);
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return errorResponse(res, '취소할 수 없는 주문 상태입니다.', 400);
    }

    if (order.paymentStatus === 'paid') {
      return errorResponse(res, '결제가 완료된 주문은 취소할 수 없습니다. 환불을 신청해주세요.', 400);
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledReason = reason;

    // 재고 복구
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.stockManagement === 'track') {
        product.totalStock += item.quantity;
        if (product.status === 'out_of_stock' && product.totalStock > 0) {
          product.status = 'active';
        }
        await product.save();
      }
    }

    await order.save();

    successResponse(res, { order }, '주문이 취소되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 주문서 자동 작성 (AI)
export const autoFillOrder = async (req, res) => {
  try {
    const { naturalLanguage } = req.body;
    const user = await User.findById(req.user._id);

    // TODO: 실제 AI를 사용하여 자연어에서 정보 추출
    // 여기서는 사용자 정보를 기본값으로 반환
    const shippingAddress = {
      recipientName: user.name,
      phone: user.phone || '',
      ...user.address
    };

    successResponse(res, {
      shippingAddress,
      extractedInfo: {
        name: user.name,
        phone: user.phone
      }
    }, '주문서 정보 자동 작성 완료');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

